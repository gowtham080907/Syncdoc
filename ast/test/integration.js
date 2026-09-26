// integration.js – demo of the full AST pipeline for backend integration
// ---------------------------------------------------------------
// This script runs the complete flow:
//   Original → User A → User B → parse → compare → resolve → generate
// It prints each step so a backend developer can see the output.

const path = require('path');
// Import the unified API from the ast folder (one level up)
const { parse, compare, resolve, generate } = require('../index');

// -------------------- Example documents --------------------
const originalDoc = `Hello everyone`;
const userADoc   = `Hello students`;
const userBDoc   = `Hello friends`;

function header(title) {
  console.log('\n=== ' + title + ' ===\n');
}

// 1. Show original inputs
header('Original Document');
console.log(originalDoc);
header('User A Document');
console.log(userADoc);
header('User B Document');
console.log(userBDoc);

// 2. Parse all three documents
const origAST = parse(originalDoc);
const aAST    = parse(userADoc);
const bAST    = parse(userBDoc);

header('Parsed Original AST');
console.log(JSON.stringify(origAST, null, 2));
header('Parsed User A AST');
console.log(JSON.stringify(aAST, null, 2));
header('Parsed User B AST');
console.log(JSON.stringify(bAST, null, 2));

// 3. Compare A vs B (just to illustrate diff output)
const diffs = compare(aAST, bAST);
header('Diffs between A and B');
console.log(JSON.stringify(diffs, null, 2));

// 4. Resolve conflicts using the original AST as the base
const { mergedAst, conflicts } = resolve(origAST, aAST, bAST);
header('Detected Conflicts');
if (conflicts.length === 0) {
  console.log('No conflicts');
} else {
  console.log(JSON.stringify(conflicts, null, 2));
}

header('Merged AST after resolution');
console.log(JSON.stringify(mergedAst, null, 2));

// 5. Generate the final document text
const finalDoc = generate(mergedAst);
header('Final Merged Document');
console.log(finalDoc);

// ---------------------------------------------------------------
