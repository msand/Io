Infinite Object (Io) - Version control tree using plain JavaScript and prototypical inheritance
===============================================================================================

## Infinite Object - minimal version
Compiled Size:	119 bytes gzipped (126 bytes uncompressed)
Minimal POC api: 
```javascript
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
```

## Infinite Object - small version
Still small but slightly more usable api with polyfill to work in ES3
```javascript
var root = io();

// Allows creating branch using object
root.branch({ testProp: "testValue4", anotherProp: "ECMAScript ftw" });

// Version tree found in root.branches instead of root.tree
```

## Infinite Object - main version
Proper api, requires ES5
```javascript
(function() {
  // Root and branches are immutable (frozen with Object.freeze) and thus
  // all properties are non-configurable and non-writable after creation
  var root = io();
  var infiniteWhiteSpaceCollection = [root];
  var branch1 = root.branch("testProp", "testValue");
  var branch2 = root.branch("testProp", "testValue2");
  var branch21 = branch2.branch({
    testProp: "testValue4",
    anotherProp: "ECMAScript ftw"
  });
  // var reservedPropertyNames = ["branch", "branches", "version"];

  // Version tree found in root.branches instead of root.tree
  console.log(root.branches[0] === branch1);

  // Branches have a version number
  console.log(branch1.version === 1);
  console.log(branch1.version + 1 === branch2.version);

  // The root (and thus branches) has a reference to the current branch
  console.log(root.currentBranch === branch21.currentBranch);
  console.log(root.currentBranch === branch21);

  var branch11 = branch1.branch("testProp", "testValue3");
  var branch211 = branch21.branch({ newProp: ":D" });

  // Branch changes on branching
  console.log(root.currentBranch === branch211);

  // The root (and thus branches) has a reference to the root
  console.log(root.root === root);
  console.log(root === branch21.root);

  // Change version to parent branch
  root.currentBranch = Object.getPrototypeOf(branch211);

  // root.view === branchN.view contains an Object without prototype [Object.create(null)] which has all
  // the properties from the prototype chain (excluding view and branches) of the currently active branch.
  // Enabling fast existence checking of and access to the current properties,
  // without repeated prototype chain traversal.
  var view = root.view;
  for (var key in view) {
    console.log(key in branch21 && view[key] === branch21[key]);
  }
  for (var key in branch21) {
    console.log(
      root.hasOwnProperty(key) || key in view && view[key] === branch21[key]
    );
  }

  // Every branch has a timestamp
  console.log(branch11.date <= branch211.date);

  // Can de/serialize from/to JSON
  var jsonIo = JSON.stringify(root);
  var parsedIo = io.fromJSON(jsonIo);
  var reStringified = JSON.stringify(parsedIo);
  console.log("JSON idempotent: " + (reStringified === jsonIo));

  var jsonArr = document.getElementById("output").innerHTML = JSON.stringify(
    infiniteWhiteSpaceCollection
  );
  var parsedArr = JSON.parse(jsonArr).map(io.fromParsedJSON);
})();
```