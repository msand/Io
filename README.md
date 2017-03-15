Infinite Object (Io) - Version control tree using plain JavaScript and prototypical inheritance
===============================================================================================

## Infinite Object - minimal version
Compiled Size:	119 bytes gzipped (126 bytes uncompressed)
Minimal POC api: 
```javascript
(function () {
  "use strict";
  // Declare Io POC
  function Io(){this.tree=[];}
  Io.prototype.up=function(){var a=Object.create(this);this.tree.push(a);a.tree=[];return a;};
  
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
}());
```

## Infinite Object - small version
Small, more usable api
```javascript
var testObj = new Io();
var branch1 = testObj.up("testProp", "testValue1");
var branch2 = testObj.up("testProp", "testValue2");

var branch1_1 = branch1.up("testProp", "testValue3");
// Allows calling up with object
var branch2_1 = branch2.up({
  testProp: "testValue4",
  anotherProp: "ECMAScript ftw"
});

// Version tree found in root.branches instead of root.tree
```

## Infinite Object - main version
Proper api
```javascript
(function () {
  // Root and branches are immutable (sealed) and
  // all properties are non-configurable and non-writeable after creation
  var root = new Io();
  var infiniteWhiteSpaceCollection = [root];
  var branch1 = root.up("testProp", "testValue");
  var branch2 = root.up("testProp", "testValue2");
  var branch21 = branch2.up({
    testProp: "testValue4",
    anotherProp: "ECMAScript ftw"
  });

  // Branches have a version number
  console.log(branch1.version === 1);
  console.log(branch1.version + 1 === branch2.version);

  // The root (and thus branches) has a reference to the current leaf
  console.log(root.currentLeaf === branch21.currentLeaf);
  console.log(root.currentLeaf === branch21);

  var branch11 = branch1.up("testProp", "testValue3");
  var branch211 = branch21.up({ newProp: ":D" });

  // Leaf changes on branching
  console.log(root.currentLeaf === branch211);

  // The root (and thus branches) has a reference to the root
  console.log(root.root === root);
  console.log(root === branch21.root);

  // Change version to parent branch
  root.currentLeaf = Object.getPrototypeOf(branch211);

  // root.view === branch.view contains an Object without prototype [Object.create(null)] which has
  // all the properties from the prototype chain (excluding root) of the currently active leaf.
  // Enabling fast existence checking of and access to the current properties,
  // without repeated prototype chain traversal.
  var view = root.view;
  for (var key in view) {
    console.log(
      key in branch21 && view[key] === branch21[key]
    );
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
  var parsedIo = Io.fromJSON(jsonIo);
  var reStringified = JSON.stringify(parsedIo);
  console.log("JSON idempotent: " + (reStringified === jsonIo));

  var jsonArr = document.getElementById("output").innerHTML = JSON.stringify(
    infiniteWhiteSpaceCollection
  );
  var parsedArr = JSON.parse(jsonArr).map(Io.fromParsedJSON);
})();
```