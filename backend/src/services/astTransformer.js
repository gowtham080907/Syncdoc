/**
 * AST Transformer for SyncDoc PDF Export Engine.
 * Converts a validated AST into a single canonical intermediate representation (IR).
 */

/**
 * Normalizes an array of inline nodes by:
 * 1. Dropping zero-length text runs.
 * 2. Merging adjacent text runs with identical styles.
 * 3. Keeping whitespace-only text runs.
 *
 * @param {Array<object>} inlines
 * @returns {Array<object>}
 */
function normalizeInlines(inlines) {
  const result = [];

  for (const item of inlines) {
    if (item.type === 'lineBreak') {
      result.push(item);
      continue;
    }

    if (item.type === 'text') {
      if (!item.text || item.text.length === 0) {
        continue;
      }

      if (result.length > 0) {
        const prev = result[result.length - 1];
        if (
          prev.type === 'text' &&
          Boolean(prev.bold) === Boolean(item.bold) &&
          Boolean(prev.italic) === Boolean(item.italic) &&
          Boolean(prev.underline) === Boolean(item.underline) &&
          prev.link === item.link
        ) {
          prev.text += item.text;
          continue;
        }
      }

      const run = { type: 'text', text: item.text };
      if (item.bold) run.bold = true;
      if (item.italic) run.italic = true;
      if (item.underline) run.underline = true;
      if (item.link) run.link = item.link;
      result.push(run);
    }
  }

  return result;
}

/**
 * Flattens AST inline nodes into IR inline runs, accumulating styles.
 *
 * @param {object} node
 * @param {object} inheritedStyle
 * @returns {Array<object>}
 */
function transformInlineChildren(node, inheritedStyle = {}) {
  let results = [];
  const children = node.children || [];

  for (const child of children) {
    const childInlines = transformInlineNode(child, inheritedStyle);
    results = results.concat(childInlines);
  }

  return results;
}

/**
 * Handles transformation of an inline AST node (text, bold, italic, underline, link, lineBreak).
 *
 * @param {object} node
 * @param {object} inheritedStyle
 * @returns {Array<object>}
 */
function transformInlineNode(node, inheritedStyle = {}) {
  const currentStyle = { ...inheritedStyle };

  switch (node.type) {
    case 'bold':
      currentStyle.bold = true;
      return transformInlineChildren(node, currentStyle);
    case 'italic':
      currentStyle.italic = true;
      return transformInlineChildren(node, currentStyle);
    case 'underline':
      currentStyle.underline = true;
      return transformInlineChildren(node, currentStyle);
    case 'link':
      currentStyle.link = node.href;
      return transformInlineChildren(node, currentStyle);
    case 'lineBreak':
      return [{ type: 'lineBreak' }];
    case 'text': {
      const run = { type: 'text', text: node.text || '' };
      if (currentStyle.bold) run.bold = true;
      if (currentStyle.italic) run.italic = true;
      if (currentStyle.underline) run.underline = true;
      if (currentStyle.link) run.link = currentStyle.link;
      return [run];
    }
    default:
      return [];
  }
}

/**
 * Normalizes mixed AST children (blocks and stray inlines) into a array of IR Block objects.
 * Stray inlines are grouped into implicit paragraph blocks.
 *
 * @param {Array<object>} children
 * @returns {Array<object>}
 */
function normalizeBlocks(children = []) {
  const blocks = [];
  let pendingInlines = [];

  function flushPendingInlines() {
    if (pendingInlines.length > 0) {
      const normalized = normalizeInlines(pendingInlines);
      if (normalized.length > 0) {
        blocks.push({
          type: 'paragraph',
          content: normalized,
        });
      }
      pendingInlines = [];
    }
  }

  for (const child of children) {
    if (isInlineASTNode(child)) {
      const inlines = transformInlineNode(child, {});
      pendingInlines = pendingInlines.concat(inlines);
    } else {
      flushPendingInlines();
      const transformedBlock = transformNode(child, {});
      if (transformedBlock) {
        if (Array.isArray(transformedBlock)) {
          blocks.push(...transformedBlock);
        } else {
          blocks.push(transformedBlock);
        }
      }
    }
  }

  flushPendingInlines();
  return blocks;
}

function isInlineASTNode(node) {
  const inlineTypes = new Set(['text', 'bold', 'italic', 'underline', 'link', 'lineBreak']);
  return inlineTypes.has(node.type);
}

const nodeHandlers = {
  document(node) {
    const blocks = normalizeBlocks(node.children || []);
    return {
      type: 'document',
      blocks,
    };
  },

  heading(node) {
    const rawInlines = transformInlineChildren(node, {});
    const content = normalizeInlines(rawInlines);
    return {
      type: 'heading',
      level: node.level,
      content,
    };
  },

  paragraph(node) {
    const rawInlines = transformInlineChildren(node, {});
    const content = normalizeInlines(rawInlines);
    return {
      type: 'paragraph',
      content,
    };
  },

  blockquote(node) {
    const blocks = normalizeBlocks(node.children || []);
    return {
      type: 'blockquote',
      blocks,
    };
  },

  bulletList(node) {
    const items = (node.children || []).map((itemNode) => {
      const blocks = normalizeBlocks(itemNode.children || []);
      return { blocks };
    });

    return {
      type: 'list',
      ordered: false,
      items,
    };
  },

  orderedList(node) {
    const items = (node.children || []).map((itemNode) => {
      const blocks = normalizeBlocks(itemNode.children || []);
      return { blocks };
    });

    const listBlock = {
      type: 'list',
      ordered: true,
      items,
    };

    if (node.start !== undefined) {
      listBlock.start = node.start;
    }

    return listBlock;
  },

  codeBlock(node) {
    let fullText = '';
    const children = node.children || [];
    for (const child of children) {
      if (child.type === 'text' && typeof child.text === 'string') {
        fullText += child.text;
      }
    }

    const codeBlock = {
      type: 'codeBlock',
      text: fullText,
    };

    if (node.language) {
      codeBlock.language = node.language;
    }

    return codeBlock;
  },
};

/**
 * Transforms an AST node or document into IR representation.
 *
 * @param {object} node - AST node.
 * @param {object} [inheritedStyle] - Inherited style map.
 * @returns {object|Array<object>}
 */
export function transformNode(node, inheritedStyle = {}) {
  if (!node || !node.type) return null;

  if (isInlineASTNode(node)) {
    return transformInlineNode(node, inheritedStyle);
  }

  const handler = nodeHandlers[node.type];
  if (handler) {
    return handler(node, inheritedStyle);
  }

  return null;
}

/**
 * Transforms a complete validated AST document into canonical IR.
 *
 * @param {object} ast - Validated document AST.
 * @returns {object} Canonical IR Document.
 */
export function transformAST(ast) {
  if (!ast || ast.type !== 'document') {
    return { type: 'document', blocks: [] };
  }
  return transformNode(ast, {});
}

export default transformAST;
