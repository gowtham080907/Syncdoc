<<<<<<< HEAD

=======
// parser.js
// Simple markdown‑style parser that produces a lightweight AST.
// Supported elements: document, heading, paragraph, list, listItem.

/**
 * Parse a plain‑text document into an AST.
 * @param {string} input - The document text.
 * @returns {object} AST root node.
 */
function parse(input) {
  const lines = input.split(/\r?\n/);
  const ast = { type: 'document', children: [] };
  let currentList = null; // Holds the current list node while iterating.

  const flushList = () => {
    if (currentList) {
      ast.children.push(currentList);
      currentList = null;
    }
  };

  const addParagraph = (text) => {
    const trimmed = text.trim();
    if (trimmed) {
      ast.children.push({ type: 'paragraph', content: trimmed });
    }
  };

  let buffer = '';
  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (line.startsWith('#')) {
      // Heading
      flushList();
      addParagraph(buffer);
      buffer = '';
      const depth = line.match(/^#+/)[0].length;
      const content = line.slice(depth).trim();
      ast.children.push({ type: 'heading', depth, content });
    } else if (/^[-*]\s+/.test(line)) {
      // List item
      if (!currentList) {
        currentList = { type: 'list', items: [] };
      }
      const content = line.replace(/^[-*]\s+/, '').trim();
      currentList.items.push({ type: 'listItem', content });
    } else if (line === '') {
      // Blank line – close current paragraph or list.
      flushList();
      addParagraph(buffer);
      buffer = '';
    } else {
      // Regular text – accumulate into a paragraph buffer.
      if (buffer) buffer += ' ';
      buffer += line.trim();
    }
  });

  // Flush any remaining buffered content.
  flushList();
  addParagraph(buffer);

  return ast;
}

module.exports = { parse };
>>>>>>> a88869b (Add AST conflict resolution module)
