// index.js – single entry point for the AST module
// Re‑export the four core functions so that callers can simply do:
// const { parse, compare, resolve, generate } = require('./ast');

module.exports = {
  parse: require('./parser').parse,
  compare: require('./comparator').compare,
  resolve: require('./conflictResolver').resolve,
  generate: require('./generator').generate,
};
