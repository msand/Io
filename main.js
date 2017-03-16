/*jslint browser: true*/
/*global define, module, window*/
(function (factory) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals
    window.io = factory();
  }
}(function ioFactory() {
  "use strict";
  function isObject(value) {
    try {
      Object.create(value);
      return value !== null;
    } catch (ignore) {
      return false;
    }
  }

  function timestamp(obj) {
    if (!obj.hasOwnProperty("date")) {
      Object.defineProperty(obj, "date", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: new Date()
      });
    }
  }

  var reservedPropertyNames = ["branch", "branches", "version"];

  var hasOwnProp = Object.prototype.hasOwnProperty;

  function io() {
    var root = {};
    var maxVersion = 0;
    var currentBranch = root;

    Object.defineProperty(root, "root", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: root
    });

    function branchFrom(parent, addBranch) {
      return function branchUsing(keyOrProps, value) {
        var numParams = arguments.length;
        if (numParams === 0 || numParams > 2) {
          throw new Error("Wrong number of parameters");
        }

        var branch = Object.create(parent);

        if (numParams === 2) {
          if (
            typeof keyOrProps !== "string" ||
            reservedPropertyNames.indexOf(keyOrProps) !== -1
          ) {
            throw new TypeError(
              "Key must be string and not in: " + reservedPropertyNames
            );
          }
          Object.defineProperty(branch, keyOrProps, {
            configurable: false,
            enumerable: true,
            writable: false,
            value: value
          });
        } else if (numParams === 1) {
          if (!isObject(keyOrProps)) {
            throw new TypeError("Props must be object");
          }
          Object.keys(keyOrProps).forEach(function setProp(key) {
            if (reservedPropertyNames.indexOf(key) !== -1) {
              return;
            }
            Object.defineProperty(branch, key, {
              value: keyOrProps[key],
              configurable: false,
              enumerable: true,
              writable: false
            });
          });
        }

        timestamp(branch);

        maxVersion += 1;

        Object.defineProperty(branch, "version", {
          value: maxVersion,
          configurable: false,
          enumerable: true,
          writable: false
        });

        var branches = [];
        var branchesView = Object.freeze(branches.slice());

        function addBranchAndUpdateView(branch) {
          branches.push(branch);
          branchesView = Object.freeze(branches.slice());
        }

        Object.defineProperty(branch, "branches", {
          configurable: false,
          enumerable: true,
          get: function getBranches() {
            return branchesView;
          }
        });

        Object.defineProperty(branch, "branch", {
          configurable: false,
          enumerable: false,
          writable: false,
          value: Object.freeze(branchFrom(branch, addBranchAndUpdateView))
        });

        Object.freeze(branch);

        addBranch(branch);

        root.currentBranch = branch;

        return branch;
      };
    }

    Object.defineProperty(root, "maxVersion", {
      configurable: false,
      enumerable: true,
      get: function getMaxVersion() {
        return maxVersion;
      }
    });

    var view = Object.create(null);

    Object.defineProperty(root, "view", {
      configurable: false,
      enumerable: true,
      get: function getView() {
        return view;
      }
    });

    Object.defineProperty(root, "currentBranch", {
      configurable: false,
      enumerable: false,
      get: function getCurrentBranch() {
        return currentBranch;
      },
      set: function setCurrentBranch(branch) {
        function setViewProp(key) {
          if (!hasOwnProp.call(view, key) && !hasOwnProp.call(root, key)) {
            view[key] = branch[key];
          }
        }
        if (currentBranch === branch) {
          return branch;
        }
        if (!root.isPrototypeOf(branch)) {
          throw new TypeError(
            "Only infinite objects which are extensions of this root are allowed"
          );
        }
        if (Object.getPrototypeOf(branch) === currentBranch) {
          Object.keys(branch).forEach(function setProp(key) {
            view[key] = branch[key];
          });
        } else {
          view = Object.create(null);
          var obj = branch;
          while (obj !== root) {
            Object.keys(obj).forEach(setViewProp);
            obj = Object.getPrototypeOf(obj);
          }
        }
        currentBranch = branch;
        return currentBranch;
      }
    });

    var rootBranches = [];
    var branchesView = Object.freeze(rootBranches.slice());

    function addBranchAndUpdateView(branch) {
      rootBranches.push(branch);
      branchesView = Object.freeze(rootBranches.slice());
    }

    Object.defineProperty(root, "branch", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: Object.freeze(branchFrom(root, addBranchAndUpdateView))
    });

    Object.defineProperty(root, "branches", {
      configurable: false,
      enumerable: true,
      get: function getBranches() {
        return branchesView;
      }
    });

    Object.freeze(root);

    return root;
  }

  function walkBranches(branch, parent, parents, versions) {
    branch.branches.forEach(function walkBranch(child) {
      var childVersion = child.version;
      versions[childVersion] = child;
      parents[childVersion] = parent;
    });
  }

  function fromParsedJSON(obj) {
    var root = io();
    var versions = [];
    versions.length = obj.maxVersion + 1;
    var parents = Array.apply(null, versions);
    var branches = Array.apply(null, versions);
    branches = branches.map(function importBranch(branch) {
      var parent = branch ? parents[branch.version].branch(branch) : root;
      walkBranches(branch || obj, parent, parents, branches);
      return parent;
    });
    root.currentBranch = branches[obj.view.version];
    return root;
  }

  function fromJSON(json) {
    return fromParsedJSON(JSON.parse(json));
  }

  function from(obj) {
    var root = io();
    root.branch(obj);
    return root;
  }

  Object.defineProperty(io, "from", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: from
  });

  Object.defineProperty(io, "fromJSON", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: fromJSON
  });

  Object.defineProperty(io, "fromParsedJSON", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: fromParsedJSON
  });

  Object.defineProperty(io, "reservedPropertyNames", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: reservedPropertyNames
  });

  Object.freeze(reservedPropertyNames);
  Object.freeze(fromParsedJSON);
  Object.freeze(fromJSON);
  Object.freeze(from);
  Object.freeze(io);
  return io;
}));
