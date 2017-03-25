/*jslint this:true, for:true, white: true, browser: true*/
/*global window*/
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
    }());
  }
}());

// Object.assign polyfill
(function() {
  "use strict";
  if (typeof Object.assign !== "function") {
    /* eslint-disable no-unused-vars */
    Object.assign = function(
      target,
      ignore // .length of function is 2
    ) {
      if (
        target === null || target === undefined // TypeError if undefined or null
      ) {
        throw new TypeError("Cannot convert undefined or null to object");
      }

      var to = Object(target);
      var nextSource;
      var nextKey;
      var index;

      for (index = 1; index < arguments.length; index += 1) {
        nextSource = arguments[index];

        if (
          nextSource !== null && nextSource !== undefined // Skip over if undefined or null
        ) {
          for (nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }
}());

// Infinite Object
(function() {
  "use strict";
  function branchFrom(parent) {
    return function branchUsing(keyOrProps, value) {
      var branch = Object.create(parent);

      if (typeof keyOrProps === "string") {
        branch[keyOrProps] = value;
      } else if (typeof keyOrProps === "object") {
        Object.assign(branch, keyOrProps);
      }

      Object.assign(branch, { branches: [], branch: branchFrom(branch) });

      parent.branches.push(branch);

      return branch;
    };
  }

  function io() {
    var root = {};
    Object.assign(root, { branches: [], branch: branchFrom(root) });
    return root;
  }

  window["io"] = io;
}());
