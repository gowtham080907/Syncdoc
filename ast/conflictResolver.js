// conflictResolver.js
// Resolve differences between two ASTs (A and B) given the original AST.
// Returns an object { mergedAst, conflicts } where conflicts is an array of conflict descriptors.

/**
 * Recursively resolve nodes from original, version A and version B.
 * Handles additions, deletions, and modifications according to the rules:
 *   - Only A changed -> keep A
 *   - Only B changed -> keep B
 *   - Both changed differently -> conflict node
 *   - Unchanged -> keep original
 * Deletions are represented by the node being undefined in the version.
 * @param {object|undefined} orig - Original node (may be undefined).
 * @param {object|undefined} a - Node from version A (may be undefined).
 * @param {object|undefined} b - Node from version B (may be undefined).
 * @returns {{merged: object|undefined, conflicts: Array<object>}}
 */
function resolveNode(orig, a, b) {
  // No node at all
  if (!orig && !a && !b) {
    return { merged: undefined, conflicts: [] };
  }

  // Deletion / addition handling based on original presence
  if (!a && b) {
    // A missing, B present
    if (orig) {
      // Node existed originally -> A deleted it
      return { merged: undefined, conflicts: [] };
    }
    // Node did not exist originally -> B added it
    return { merged: b, conflicts: [] };
  }
  if (!b && a) {
    // B missing, A present
    if (orig) {
      // Node existed originally -> B deleted it
      return { merged: undefined, conflicts: [] };
    }
    // Node did not exist originally -> A added it
    return { merged: a, conflicts: [] };
  }

  // Both a and b are present (or both undefined, handled above)
  // Leaf nodes (heading, paragraph, listItem)
  if (["heading", "paragraph", "listItem"].includes(a.type)) {
    const origContent = orig ? orig.content : undefined;
    const aChanged = orig ? a.content !== origContent : true; // if no original, treat as change (addition)
    const bChanged = orig ? b.content !== origContent : true;

    if (!aChanged && !bChanged) {
      return { merged: a, conflicts: [] }; // unchanged
    }
    if (aChanged && !bChanged) {
      return { merged: a, conflicts: [] }; // only A changed
    }
    if (!aChanged && bChanged) {
      return { merged: b, conflicts: [] }; // only B changed
    }
    // Both changed
    if (a.content === b.content) {
      return { merged: a, conflicts: [] }; // same modification
    }
    // Different modifications => conflict
    return { merged: { type: "conflict", a, b }, conflicts: [{ a, b, reason: "different modifications" }] };
  }

  // List node
  if (a.type === "list") {
    const max = Math.max(
      (orig && orig.items ? orig.items.length : 0),
      a.items.length,
      b.items.length
    );
    const mergedItems = [];
    const conflicts = [];
    for (let i = 0; i < max; i++) {
      const res = resolveNode(
        orig && orig.items ? orig.items[i] : undefined,
        a.items[i],
        b.items[i]
      );
      if (res.merged !== undefined) mergedItems.push(res.merged);
      conflicts.push(...res.conflicts);
    }
    return { merged: { type: "list", items: mergedItems }, conflicts };
  }

  // Document node
  if (a.type === "document") {
    const max = Math.max(
      (orig && orig.children ? orig.children.length : 0),
      a.children.length,
      b.children.length
    );
    const mergedChildren = [];
    const conflicts = [];
    for (let i = 0; i < max; i++) {
      const res = resolveNode(
        orig && orig.children ? orig.children[i] : undefined,
        a.children[i],
        b.children[i]
      );
      if (res.merged !== undefined) mergedChildren.push(res.merged);
      conflicts.push(...res.conflicts);
    }
    return { merged: { type: "document", children: mergedChildren }, conflicts };
  }

  // Fallback – keep A's node
  return { merged: a, conflicts: [] };
}

/**
 * Resolve two ASTs against an original AST.
 * @param {object} originalAst - The original AST.
 * @param {object} astA - AST from version A.
 * @param {object} astB - AST from version B.
 * @returns {{mergedAst: object, conflicts: Array<object>}}
 */
function resolve(originalAst, astA, astB) {
  const { merged, conflicts } = resolveNode(originalAst, astA, astB);
  return { mergedAst: merged, conflicts };
}

module.exports = { resolve };
