// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level ADVANCED_OPTIMIZATIONS
// ==/ClosureCompiler==

// Object.create polyfill
(function() {
  "use strict";
  if (typeof Object.create !== "function") {
    Object.create = (function() {
      /**
       * @constructor
       */
      var NewObject = function() {
        return this;
      };
      return function(prototype) {
        if (arguments.length > 1) {
          throw new Error("Second argument not supported");
        }
        if (typeof prototype !== "object") {
          throw new TypeError("Argument must be an object");
        }
        NewObject.prototype = prototype;
        var result = new NewObject();
        NewObject.prototype = {};
        return result;
      };
    })();
  }
})();

// Infinite Object
(function(root) {
  "use strict";
  function branchFrom(parent) {
    return function branchUsing(keyOrProps, value) {
      var branch = Object.create(parent), key;

      if (typeof keyOrProps === "string") {
        branch[keyOrProps] = value;
      } else if (typeof keyOrProps === "object") {
        for (key in keyOrProps) {
          branch[key] = keyOrProps[key];
        }
      }

      branch.branch = branchFrom(branch);
      parent.branches.push(branch);
      branch.branches = [];
      return branch;
    };
  }

  function io() {
    var root = { branches: [] };
    root.branch = branchFrom(root);
    return root;
  }

  root.io = io;
  // Closure compiler export
  // root['io'] = io;
})(this);
