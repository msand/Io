// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level ADVANCED_OPTIMIZATIONS
// ==/ClosureCompiler==

/*jslint forin: true */
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
  /**
   * @constructor
   */
  function Io() {
    this.branches = [];
  }

  Io.prototype.up = function(keyOrProps, value) {
    var up = Object.create(this), key;

    if (typeof keyOrProps === "string") {
      up[keyOrProps] = value;
    } else if (typeof keyOrProps === "object") {
      for (key in keyOrProps) {
        up[key] = keyOrProps[key];
      }
    }

    this.branches.push(up);
    up.branches = [];
    return up;
  };

  root.Io = Io;
  // Closure compiler export
  // window['Io'] = Io;
  // Io.prototype['up'] = Io.prototype.up;
})(this);
