/*global define*/
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
        ? define(factory)
        : (global.io = factory());
})(this, function() {
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

  var reservedNames = reservedPropertyNames.join();

  var hasOwnProp = Object.prototype.hasOwnProperty;

  function io() {
    var root = {};
    var listeners = [];
    var numVersions = 0;
    var currentBranch = root;

    Object.defineProperty(root, "root", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: root
    });

    Object.defineProperty(root, "on", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: Object.freeze(function on(listener) {
        listeners.push(listener);
        return function off() {
          root.off(listener);
        };
      })
    });

    Object.defineProperty(root, "off", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: Object.freeze(function off(listener) {
        var index = listeners.indexOf(listener);
        while (index !== -1) {
          listeners.splice(index, 1);
          index = listeners.indexOf(listener);
        }
      })
    });

    function notifyListener(listener) {
      listener(currentBranch);
    }

    function emit() {
      listeners.forEach(notifyListener);
    }

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
              "Key must be string and not in: " + reservedNames
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
            throw new TypeError("Argument must be object");
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

        Object.defineProperty(branch, "version", {
          value: numVersions,
          configurable: false,
          enumerable: true,
          writable: false
        });

        numVersions += 1;

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

    Object.defineProperty(root, "numVersions", {
      configurable: false,
      enumerable: true,
      get: function getNumVersions() {
        return numVersions;
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

        emit();

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

  function walkBranches(source, sources, parents, branch) {
    source.branches.forEach(function walkBranch(child) {
      var childVersion = child.version;
      sources[childVersion] = child;
      parents[childVersion] = branch;
    });
  }

  function fromParsedJSON(obj) {
    var root = io();
    var versions = [];
    versions.length = obj.numVersions;
    var parents = Array.apply(null, versions);
    var sources = Array.apply(null, versions);
    walkBranches(obj, sources, parents, root);
    var branches = sources.map(function importBranch(source) {
      var branch = parents[source.version].branch(source);
      walkBranches(source, sources, parents, branch);
      return branch;
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
});
