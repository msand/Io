// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

/**
 * Io version tree: var root = new Io(); var branch = root.up();
 * @constructor
 */
window["Io"] = function() {
  this.tree = [];
};

Io.prototype["up"] = function() {
  var up = Object.create(this);
  this.tree.push(up);
  up.tree = [];
  return up;
};
