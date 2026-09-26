import { MAX_AST_DEPTH, MAX_AST_NODES, MAX_URL_LENGTH } from '../config/securityLimits.js';

const BLOCK_TYPES = new Set([
  'heading',
  'paragraph',
  'bulletList',
  'orderedList',
  'blockquote',
  'codeBlock',
]);

const INLINE_TYPES = new Set([
  'text',
  'bold',
  'italic',
  'underline',
  'link',
  'lineBreak',
]);

const ALL_TYPES = new Set(['document', ...BLOCK_TYPES, ...INLINE_TYPES, 'listItem']);

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Validates an AST object against canonical schema rules.
 *
 * @param {unknown} ast - The input AST object.
 * @returns {{ valid: boolean, errors: Array<{ path: string, message: string }> }}
 */
export function validateAST(ast) {
  const errors = [];
  const maxDepth = MAX_AST_DEPTH;
  const maxNodes = process.env.MAX_AST_NODES ? parseInt(process.env.MAX_AST_NODES, 10) || MAX_AST_NODES : MAX_AST_NODES;
  const maxErrors = 50;

  function addError(path, message) {
    if (errors.length < maxErrors) {
      errors.push({ path, message });
    }
  }

  // Root validation
  if (!ast || typeof ast !== 'object' || Array.isArray(ast)) {
    return {
      valid: false,
      errors: [{ path: 'ast', message: 'AST must be a non-null object' }],
    };
  }

  if (Object.prototype.hasOwnProperty.call(ast, '__proto__') ||
      Object.prototype.hasOwnProperty.call(ast, 'constructor') ||
      Object.prototype.hasOwnProperty.call(ast, 'prototype')) {
    return {
      valid: false,
      errors: [{ path: 'ast', message: 'Prototype pollution attempt detected' }],
    };
  }

  if (ast.type !== 'document') {
    return {
      valid: false,
      errors: [{ path: 'ast.type', message: 'Root node must have type "document"' }],
    };
  }

  let nodeCount = 0;

  function validateNode(node, currentPath, currentDepth, parentType) {
    if (errors.length >= maxErrors) return;

    nodeCount++;
    if (nodeCount > maxNodes) {
      addError('ast', `AST node count exceeds maximum allowed limit of ${maxNodes}`);
      return;
    }

    if (currentDepth > maxDepth) {
      addError(currentPath, `AST depth exceeds maximum allowed limit of ${maxDepth}`);
      return;
    }

    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      addError(currentPath, 'Node must be an object');
      return;
    }

    // Check for prototype pollution keys in node keys
    const ownKeys = Object.getOwnPropertyNames(node);
    for (const key of ownKeys) {
      if (DANGEROUS_KEYS.has(key)) {
        addError(currentPath, `Invalid key "${key}" detected on node`);
        return;
      }
    }

    const { type } = node;
    if (!type || typeof type !== 'string' || type.trim() === '') {
      addError(`${currentPath}.type`, 'Node type must be a non-empty string');
      return;
    }

    if (!ALL_TYPES.has(type)) {
      addError(`${currentPath}.type`, `Unsupported node type "${type}"`);
      return;
    }

    if (type === 'document' && parentType !== null) {
      addError(`${currentPath}.type`, 'Node of type "document" can only appear as the root node');
      return;
    }

    // Validate parent-child rules
    if (parentType === 'document') {
      if (!BLOCK_TYPES.has(type)) {
        addError(currentPath, `Node of type "${type}" is not allowed directly under "document"`);
      }
    } else if (parentType === 'bulletList' || parentType === 'orderedList') {
      if (type !== 'listItem') {
        addError(currentPath, `Node of type "${type}" is not allowed directly under "${parentType}". Only "listItem" is permitted.`);
      }
    } else if (parentType === 'heading' || parentType === 'paragraph' || parentType === 'bold' || parentType === 'italic' || parentType === 'underline' || parentType === 'link') {
      if (!INLINE_TYPES.has(type)) {
        addError(currentPath, `Block node of type "${type}" is not allowed inside inline container "${parentType}"`);
      }
    } else if (parentType === 'codeBlock') {
      if (type !== 'text') {
        addError(currentPath, `Node of type "${type}" is not allowed inside "codeBlock". Only "text" nodes are permitted.`);
      }
    }

    // Node-specific attribute checks
    if (type === 'heading') {
      const { level } = node;
      if (level === undefined || typeof level !== 'number' || !Number.isInteger(level) || level < 1 || level > 6) {
        addError(`${currentPath}.level`, 'heading level must be an integer between 1 and 6');
      }
    } else if (type === 'text') {
      if (!Object.prototype.hasOwnProperty.call(node, 'text') || typeof node.text !== 'string') {
        addError(`${currentPath}.text`, 'text node must have a string "text" property');
      }
    } else if (type === 'link') {
      const { href } = node;
      if (typeof href !== 'string' || href.trim() === '') {
        addError(`${currentPath}.href`, 'link node must have a non-empty string "href" property');
      } else if (href.length > MAX_URL_LENGTH) {
        addError(`${currentPath}.href`, `link href length exceeds maximum allowed limit of ${MAX_URL_LENGTH}`);
      }
    } else if (type === 'orderedList') {
      if (node.start !== undefined) {
        if (typeof node.start !== 'number' || !Number.isInteger(node.start) || node.start < 1) {
          addError(`${currentPath}.start`, 'orderedList start attribute must be a positive integer');
        }
      }
    } else if (type === 'codeBlock') {
      if (node.language !== undefined && typeof node.language !== 'string') {
        addError(`${currentPath}.language`, 'codeBlock language attribute must be a string');
      }
    }

    // Children validation
    if (Object.prototype.hasOwnProperty.call(node, 'children')) {
      if (node.children !== undefined) {
        if (!Array.isArray(node.children)) {
          addError(`${currentPath}.children`, 'children must be an array');
        } else if (type === 'text' || type === 'lineBreak') {
          if (node.children.length > 0) {
            addError(`${currentPath}.children`, `Node of type "${type}" cannot have children`);
          }
        } else {
          for (let i = 0; i < node.children.length; i++) {
            validateNode(node.children[i], `${currentPath}.children[${i}]`, currentDepth + 1, type);
          }
        }
      }
    }
  }

  validateNode(ast, 'ast', 1, null);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default validateAST;
