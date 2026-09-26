// generator.js
// Convert AST back to plain markdown text.

/**
 * Generate markdown from the given AST.
 * @param {object} ast - The AST to serialize.
 * @returns {string} Markdown string.
 */
function generate(ast) {
  if (!ast) return '';
  switch (ast.type) {
    case 'document':
      return ast.children.map(generate).join('\n\n');
    case 'heading':
      return `${'#'.repeat(ast.depth)} ${ast.content}`;
    case 'paragraph':
      return ast.content;
    case 'list':
      return ast.items.map(item => `- ${item.content}`).join('\n');
    case 'listItem':
      // Should not be called directly – list handles items.
      return `- ${ast.content}`;
    case 'conflict':
      // For conflict nodes, we can't generate deterministic text.
      // Return a placeholder indicating conflict.
      return `<!-- CONFLICT -->`;
    default:
      return '';
  }
}

module.exports = { generate };
