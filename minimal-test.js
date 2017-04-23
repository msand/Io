/*eslint no-console: ["error", { allow: ["log"] }] */
(function() {
  "use strict";
  // Declare Io POC
  function Io() {
    this.tree = [];
  }
  Io.prototype.up = function() {
    var a = Object.create(this);
    this.tree.push(a);
    a.tree = [];
    return a;
  };

  // Create version tree
  var root = new Io();

  // Set values in root
  root.key = "value";
  root.key2 = { objects: "work" };

  // Make a new branch using up()
  var branch = root.up();

  // Prototypical inheritance
  console.log(Object.getPrototypeOf(branch) === root);
  console.log(root.isPrototypeOf(branch));

  // Set value in branch
  branch.key = "value2";

  // Version tree can be traversed from root
  console.log(root.tree[0] === branch);

  // Properties are inherited from parent
  console.log(branch.key2 === root.key2);

  // Branches override values
  console.log(branch.key !== root.key);
})();
