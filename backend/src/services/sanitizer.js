/**
 * Sanitizer Service for SyncDoc Backend.
 * Implements DOMPurify + jsdom HTML sanitization, URL policy, plain-text policy,
 * and recursive AST sanitization.
 */

import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import {
  MAX_AST_DEPTH,
  MAX_AST_NODES,
  MAX_TEXT_LENGTH,
  MAX_HTML_LENGTH,
  MAX_URL_LENGTH,
  MAX_SANITIZE_CALLS,
} from '../config/securityLimits.js';
import { ValidationError, LimitError, SanitizationError } from '../utils/errors.js';
import { logSecurityEvent } from '../utils/securityLogger.js';

// Setup isolated jsdom window & DOMPurify instance at module load
const jsdomWindow = new JSDOM('', {
  runScripts: undefined,
  resources: 'usable',
}).window;

const DOMPurify = createDOMPurify(jsdomWindow);

if (!DOMPurify.isSupported) {
  throw new Error('FATAL: DOMPurify is not supported in the current Node.js environment.');
}

// Module-level stats for DOMPurify hook callbacks
let currentHookStats = null;

// Register DOMPurify hooks ONCE at module load
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName && node.tagName.toLowerCase() === 'a') {
    const href = node.getAttribute('href');
    if (href) {
      if (!isSafeUrl(href)) {
        node.removeAttribute('href');
        if (currentHookStats) currentHookStats.removedAttrsCount++;
      } else {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
    node.removeAttribute('target');
  }
});

DOMPurify.addHook('afterSanitizeElements', (node) => {
  if (DOMPurify.removed && DOMPurify.removed.length > 0 && currentHookStats) {
    currentHookStats.removedElementsCount += DOMPurify.removed.length;
  }
});

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a',
  ],
  ALLOWED_ATTR: ['href'],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
  FORBID_TAGS: [
    'script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
    'style', 'link', 'meta', 'base', 'form', 'input', 'textarea', 'select',
    'button', 'svg', 'math', 'template', 'noscript', 'audio', 'video',
    'source', 'img',
  ],
  FORBID_ATTR: [
    'style', 'class', 'id', 'name', 'target', 'src', 'srcset', 'srcdoc',
    'action', 'formaction', 'xlink:href',
  ],
  KEEP_CONTENT: true,
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_TRUSTED_TYPE: false,
};

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const HTML_FIELDS_BY_TYPE = {
  htmlBlock: ['html', 'content'],
  customHtml: ['innerHTML'],
};

/**
 * Normalizes and validates a URL according to SyncDoc security policy.
 * Only http:, https:, mailto: protocols are allowed.
 *
 * @param {string} url
 * @returns {string|null}
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string' || url.length > MAX_URL_LENGTH) {
    return null;
  }

  // Strip ASCII control characters and whitespace
  let cleanUrl = url.replace(/[\x00-\x1F\x7F\s]/g, '');

  // Basic HTML entity decoding for character entity bypasses
  cleanUrl = cleanUrl
    .replace(/&#x0*9;/gi, '')
    .replace(/&#x0*A;/gi, '')
    .replace(/&#x0*D;/gi, '')
    .replace(/&#9;/g, '')
    .replace(/&#10;/g, '')
    .replace(/&#13;/g, '');

  try {
    const parsed = new URL(cleanUrl);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
      return parsed.href;
    }
    return null;
  } catch (_err) {
    return null;
  }
}

/**
 * Boolean wrapper for sanitizeUrl.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
  return Boolean(sanitizeUrl(url));
}

/**
 * Sanitizes an HTML string using DOMPurify.
 *
 * @param {string} html
 * @returns {string}
 */
export function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    throw new ValidationError('HTML must be a string', [{ path: 'html', message: 'HTML must be a string' }]);
  }

  if (html.length > MAX_HTML_LENGTH) {
    throw new LimitError(`HTML string length exceeds maximum allowed limit of ${MAX_HTML_LENGTH}`);
  }

  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

/**
 * Sanitizes a plain text or code block string.
 *
 * @param {string} text
 * @param {{ literal?: boolean }} [options]
 * @returns {string}
 */
export function sanitizeText(text, options = {}) {
  const { literal = false } = options;

  if (typeof text !== 'string') {
    throw new ValidationError('Text must be a string', [{ path: 'text', message: 'Text must be a string' }]);
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new LimitError(`Text node length exceeds maximum allowed limit of ${MAX_TEXT_LENGTH}`);
  }

  // Step 2: Strip NUL (\0), C0/C1 control characters except \t, \n, \r, and bidi override controls
  let cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u202A-\u202E\u2066-\u2069]/g, '');

  if (literal) {
    return cleaned;
  }

  // Step 3: Prose mode - only run DOMPurify text extraction if text contains a tag-like sequence
  if (/<[a-z!\/?]/i.test(cleaned)) {
    const fragment = DOMPurify.sanitize(cleaned, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
      RETURN_DOM_FRAGMENT: true,
    });
    return fragment.textContent || '';
  }

  return cleaned;
}

/**
 * Recursively sanitizes a valid AST document, returning a NEW clean AST.
 *
 * @param {object} ast - Input AST document.
 * @param {object} [options]
 * @returns {object}
 */
let _sanitizeASTOverride = null;

export function __setSanitizeASTOverride(fn) {
  _sanitizeASTOverride = fn;
}

export function sanitizeAST(ast, options = {}) {
  if (_sanitizeASTOverride) {
    return _sanitizeASTOverride(ast, options);
  }

  if (!ast || typeof ast !== 'object' || Array.isArray(ast)) {
    throw new ValidationError('AST must be a non-null object', [{ path: 'ast', message: 'AST must be a non-null object' }]);
  }

  if (ast.type !== 'document') {
    throw new ValidationError('Root node must have type "document"', [{ path: 'ast.type', message: 'Root node must have type "document"' }]);
  }

  const stats = {
    removedElementsCount: 0,
    removedAttrsCount: 0,
    unwrappedLinksCount: 0,
    strippedTextNodesCount: 0,
    dompurifyCalls: 0,
    nodeCount: 0,
  };

  currentHookStats = stats;

  try {
    function sanitizeChildren(children = [], currentDepth, isCodeBlock = false) {
      const result = [];

      for (let i = 0; i < children.length; i++) {
        const childNode = children[i];
        const sanitized = sanitizeNode(childNode, currentDepth + 1, isCodeBlock);
        if (sanitized !== null) {
          if (Array.isArray(sanitized)) {
            result.push(...sanitized);
          } else {
            result.push(sanitized);
          }
        }
      }

      return result;
    }

    function sanitizeNode(node, currentDepth, isCodeBlock = false) {
      stats.nodeCount++;
      if (stats.nodeCount > MAX_AST_NODES) {
        throw new LimitError(`AST node count exceeds maximum allowed limit of ${MAX_AST_NODES}`);
      }

      if (currentDepth > MAX_AST_DEPTH) {
        throw new LimitError(`AST depth exceeds maximum allowed limit of ${MAX_AST_DEPTH}`);
      }

      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        return null;
      }

      // Own property prototype pollution guard
      const ownKeys = Object.getOwnPropertyNames(node);
      for (const key of ownKeys) {
        if (DANGEROUS_KEYS.has(key)) {
          return null;
        }
      }

      const { type } = node;
      if (!type || typeof type !== 'string') {
        return null;
      }

      switch (type) {
        case 'document': {
          const children = sanitizeChildren(node.children || [], currentDepth, false);
          return { type: 'document', children };
        }

        case 'heading': {
          let level = node.level;
          if (typeof level !== 'number' || !Number.isInteger(level) || level < 1 || level > 6) {
            level = 1;
          }
          const children = sanitizeChildren(node.children || [], currentDepth, false);
          return { type: 'heading', level, children };
        }

        case 'paragraph':
        case 'bold':
        case 'italic':
        case 'underline':
        case 'bulletList':
        case 'listItem':
        case 'blockquote': {
          const children = sanitizeChildren(node.children || [], currentDepth, false);
          return { type, children };
        }

        case 'orderedList': {
          const listNode = { type: 'orderedList' };
          if (node.start !== undefined && typeof node.start === 'number' && Number.isInteger(node.start) && node.start >= 1) {
            listNode.start = node.start;
          }
          listNode.children = sanitizeChildren(node.children || [], currentDepth, false);
          return listNode;
        }

        case 'lineBreak': {
          return { type: 'lineBreak' };
        }

        case 'text': {
          const textVal = typeof node.text === 'string' ? node.text : '';
          stats.dompurifyCalls++;
          const limitMaxCalls = process.env.MAX_SANITIZE_CALLS
            ? parseInt(process.env.MAX_SANITIZE_CALLS, 10) || MAX_SANITIZE_CALLS
            : MAX_SANITIZE_CALLS;
          if (stats.dompurifyCalls > limitMaxCalls) {
            throw new LimitError(`DOMPurify invocation limit (${limitMaxCalls}) exceeded`);
          }

          const sanitizedTextVal = sanitizeText(textVal, { literal: isCodeBlock });
          if (sanitizedTextVal !== textVal) {
            stats.strippedTextNodesCount++;
          }
          return { type: 'text', text: sanitizedTextVal };
        }

        case 'codeBlock': {
          const codeNode = { type: 'codeBlock' };
          if (typeof node.language === 'string' && /^[A-Za-z0-9_+#.-]{1,32}$/.test(node.language)) {
            codeNode.language = node.language;
          }
          codeNode.children = sanitizeChildren(node.children || [], currentDepth, true);
          return codeNode;
        }

        case 'link': {
          const safeHref = sanitizeUrl(node.href);
          const sanitizedChildren = sanitizeChildren(node.children || [], currentDepth, false);

          if (safeHref) {
            return {
              type: 'link',
              href: safeHref,
              children: sanitizedChildren,
            };
          }

          // Unsafe link: UNWRAP link node into its children
          stats.unwrappedLinksCount++;
          return sanitizedChildren;
        }

        default: {
          // Check for HTML fields on unknown node types or extension node types
          const htmlFields = HTML_FIELDS_BY_TYPE[type];
          if (htmlFields) {
            const newNode = { type };
            for (const field of htmlFields) {
              if (typeof node[field] === 'string') {
                stats.dompurifyCalls++;
                if (stats.dompurifyCalls > MAX_SANITIZE_CALLS) {
                  throw new LimitError(`DOMPurify invocation limit (${MAX_SANITIZE_CALLS}) exceeded`);
                }
                newNode[field] = sanitizeHTML(node[field]);
              }
            }
            if (Array.isArray(node.children)) {
              newNode.children = sanitizeChildren(node.children, currentDepth, false);
            }
            return newNode;
          }

          // Truncate unknown type name to 32 chars and replace non-alphanumeric chars
          const safeTypeName = type.slice(0, 32).replace(/[^A-Za-z0-9_-]/g, '?');
          throw new SanitizationError(`Unsupported or invalid node type "${safeTypeName}"`);
        }
      }
    }

    const sanitizedAST = sanitizeNode(ast, 1, false);

    // Log security event if sanitization modified any nodes/attrs/links
    if (
      stats.removedElementsCount > 0 ||
      stats.removedAttrsCount > 0 ||
      stats.unwrappedLinksCount > 0 ||
      stats.strippedTextNodesCount > 0
    ) {
      logSecurityEvent({
        level: 'info',
        event: 'security.sanitized',
        req: options.req || null,
        requestId: options.requestId || (options.req ? options.req.requestId : null),
        method: options.method || null,
        path: options.path || null,
        counts: {
          removedElements: stats.removedElementsCount,
          removedAttributes: stats.removedAttrsCount,
          unwrappedLinks: stats.unwrappedLinksCount,
          strippedTextNodes: stats.strippedTextNodesCount,
        },
      });
    }

    return sanitizedAST;
  } finally {
    currentHookStats = null;
  }
}

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeUrl,
  isSafeUrl,
  sanitizeAST,
};
