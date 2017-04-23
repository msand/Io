/**
 * Io version tree: var root = new Io(); var branch = root.up();
 * @constructor
 */
var Io = (window.Io = function Io() {
  this.tree = [];
});
Io.prototype.up = function up() {
  var up = Object.create(this);
  this.tree.push(up);
  up.tree = [];
  return up;
};
