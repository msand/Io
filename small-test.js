/*global io*/
var root = io();

// Allows creating branch using object
root.branch({ testProp: "testValue4", anotherProp: "ECMAScript ftw" });
// Version tree found in root.branches instead of root.tree
