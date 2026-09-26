// comparator.js
// Simple recursive diff between two ASTs.
// Returns an array of diff objects:
// { type: 'unchanged'|'added'|'deleted'|'modified', path: Array<string|number>, a: nodeA, b: nodeB }

function isLeaf(node) {
  return ['heading', 'paragraph', 'listItem'].includes(node.type);
}

function nodesEqual(a, b) {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (isLeaf(a)) {
    return a.content === b.content && a.depth === b.depth;
  }
  if (a.type === 'list') {
    return a.items.length === b.items.length && a.items.every((it, i) => nodesEqual(it, b.items[i]));
  }
  if (a.type === 'document') {
    return a.children.length === b.children.length && a.children.every((ch, i) => nodesEqual(ch, b.children[i]));
  }
  return false;
}

function diffNodes(a, b, path = []) {
  const diffs = [];
  if (a === undefined) {
    diffs.push({ type: 'added', path, a: undefined, b });
    return diffs;
  }
  if (b === undefined) {
    diffs.push({ type: 'deleted', path, a, b: undefined });
    return diffs;
  }
  if (nodesEqual(a, b)) {
    diffs.push({ type: 'unchanged', path, a, b });
    return diffs;
  }
  diffs.push({ type: 'modified', path, a, b });

  if (a.type === 'document' && b.type === 'document') {
    const max = Math.max(a.children.length, b.children.length);
    for (let i = 0; i < max; i++) {
      diffs.push(...diffNodes(a.children[i], b.children[i], path.concat(['children', i])));
    }
  } else if (a.type === 'list' && b.type === 'list') {
    const max = Math.max(a.items.length, b.items.length);
    for (let i = 0; i < max; i++) {
      diffs.push(...diffNodes(a.items[i], b.items[i], path.concat(['items', i])));
    }
  }
  return diffs;
}

/**
 * Compare two ASTs.
 * @param {object} astA - First AST.
 * @param {object} astB - Second AST.
 * @returns {Array} diff objects.
 */
function compare(astA, astB) {
  return diffNodes(astA, astB);
}

module.exports = { compare };
