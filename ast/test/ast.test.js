// ast.test.js
// Comprehensive test suite for the AST pipeline.
// Uses Node's built‑in assert module.

const assert = require('assert');
const { parse } = require('../parser');
const { compare } = require('../comparator');
const { resolve } = require('../conflictResolver');
const { generate } = require('../generator');

// Helper: deep clone (safety)
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

// 1. Both versions unchanged
(function testUnchanged() {
  const doc = '# Title\n\nParagraph text.';
  const astA = parse(doc);
  const astB = parse(doc);
  const diffs = compare(astA, astB);
  diffs.forEach(d => assert.strictEqual(d.type, 'unchanged'));
  const { mergedAst, conflicts } = resolve(astA, astA, astB);
  assert.strictEqual(conflicts.length, 0);
  assert.strictEqual(generate(mergedAst), doc);
})();

// 2. Only User A changes a paragraph
(function testAParagraphChange() {
  const original = 'Paragraph one.';
  const aDoc = 'Paragraph ONE changed.';
  const bDoc = original;
  const origAst = parse(original);
  const astA = parse(aDoc);
  const astB = parse(bDoc);
  const { mergedAst, conflicts } = resolve(origAst, astA, astB);
  assert.strictEqual(conflicts.length, 0);
  assert.strictEqual(generate(mergedAst), aDoc);
})();

// 3. Only User B changes a paragraph
(function testBParagraphChange() {
  const original = 'Paragraph one.';
  const aDoc = original;
  const bDoc = 'Paragraph ONE changed by B.';
  const origAst = parse(original);
  const astA = parse(aDoc);
  const astB = parse(bDoc);
  const { mergedAst, conflicts } = resolve(origAst, astA, astB);
  assert.strictEqual(conflicts.length, 0);
  assert.strictEqual(generate(mergedAst), bDoc);
})();

// 4. Users change different nodes (A changes heading, B changes paragraph)
(function testDifferentNodes() {
  const original = '# Heading\n\nPara';
  const aDoc = '# New Heading\n\nPara';
  const bDoc = '# Heading\n\nPara modified by B';
  const origAst = parse(original);
  const astA = parse(aDoc);
  const astB = parse(bDoc);
  const { mergedAst, conflicts } = resolve(origAst, astA, astB);
  assert.strictEqual(conflicts.length, 0);
  const expected = '# New Heading\n\nPara modified by B';
  assert.strictEqual(generate(mergedAst), expected);
})();

// 5. Both users change the same node to the same value (no conflict)
(function testSameChangeNoConflict() {
  const original = 'Paragraph';
  const aDoc = 'Paragraph updated';
  const bDoc = 'Paragraph updated';
  const origAst = parse(original);
  const astA = parse(aDoc);
  const astB = parse(bDoc);
  const { mergedAst, conflicts } = resolve(origAst, astA, astB);
  assert.strictEqual(conflicts.length, 0);
  assert.strictEqual(generate(mergedAst), aDoc);
})();

// 6. Both users change the same node differently -> conflict
(function testConflictDifferentChanges() {
  const original = 'Hello everyone';
  const aDoc = 'Hello students';
  const bDoc = 'Hello friends';
  const origAst = parse(original);
  const astA = parse(aDoc);
  const astB = parse(bDoc);
  const { mergedAst, conflicts } = resolve(origAst, astA, astB);
  assert.strictEqual(conflicts.length, 1);
  assert.strictEqual(mergedAst.type, 'document');
  assert.strictEqual(mergedAst.children[0].type, 'conflict');
})();

// 7. Heading modification (both agree on new heading)
(function testHeadingModification() {
  const original = '# Old';
  const aDoc = '# New Heading';
  const bDoc = '# New Heading';
  const origAst = parse(original);
  const astA = parse(aDoc);
  const astB = parse(bDoc);
  const { mergedAst, conflicts } = resolve(origAst, astA, astB);
  assert.strictEqual(conflicts.length, 0);
  assert.strictEqual(generate(mergedAst), '# New Heading');
})();

// 8. List modification (add an item in A, B unchanged)
(function testListModification() {
  const original = '- Item1';
  const aDoc = '- Item1\n- Item2 added by A';
  const bDoc = '- Item1';
  const origAst = parse(original);
  const astA = parse(aDoc);
  const astB = parse(bDoc);
  const { mergedAst, conflicts } = resolve(origAst, astA, astB);
  assert.strictEqual(conflicts.length, 0);
  const expected = '- Item1\n- Item2 added by A';
  assert.strictEqual(generate(mergedAst), expected);
})();

// 9. Added content (A adds a new paragraph)
(function testAddedContent() {
  const original = 'First paragraph.';
  const aDoc = 'First paragraph.\n\nSecond paragraph added by A.';
  const bDoc = original;
  const origAst = parse(original);
  const astA = parse(aDoc);
  const astB = parse(bDoc);
  const { mergedAst, conflicts } = resolve(origAst, astA, astB);
  assert.strictEqual(conflicts.length, 0);
  assert.strictEqual(generate(mergedAst), aDoc);
})();

// 10. Deleted content (A deletes a paragraph, B unchanged)
(function testDeletedContent() {
  const original = 'Keep this.\n\nDelete this paragraph.';
  const aDoc = 'Keep this.'; // second paragraph removed
  const bDoc = original;
  const origAst = parse(original);
  const astA = parse(aDoc);
  const astB = parse(bDoc);
  const { mergedAst, conflicts } = resolve(origAst, astA, astB);
  assert.strictEqual(conflicts.length, 0);
  assert.strictEqual(generate(mergedAst), aDoc);
})();

console.log('All AST pipeline tests passed');
