function exportIo(global) {
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

  function io() {
    var root = {};
    var version = 0;
    var currentBranch = root;

    Object.defineProperty(root, "root", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: root
    });

    function branchFrom(parent, parentBranches) {
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

        version += 1;

        Object.defineProperty(branch, "version", {
          value: version,
          configurable: false,
          enumerable: true,
          writable: false
        });

        var branches = [];

        Object.defineProperty(branch, "branches", {
          configurable: false,
          enumerable: true,
          get: function getBranches() {
            return branches.slice();
          }
        });

        Object.defineProperty(branch, "branch", {
          configurable: false,
          enumerable: false,
          writable: false,
          value: Object.freeze(branchFrom(branch, branches))
        });

        Object.freeze(branch);

        parentBranches.push(branch);

        root.currentBranch = branch;

        return branch;
      };
    }

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
        var key;
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
          for (key in branch) {
            if (key !== "view" && key !== "branches") {
              view[key] = branch[key];
            }
          }
        }
        currentBranch = branch;
        return currentBranch;
      }
    });

    var rootBranches = [];

    Object.defineProperty(root, "branch", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: Object.freeze(branchFrom(root, rootBranches))
    });

    Object.defineProperty(root, "branches", {
      configurable: false,
      enumerable: true,
      get: function getBranches() {
        return rootBranches.slice();
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
    var branches = [];
    var parents = [];
    var branch;
    var parent;
    var i;
    walkBranches(obj, root, parents, branches);
    for (i = 1; i < branches.length; i += 1) {
      branch = branches[i];
      parent = parents[branch.version].branch(branch);
      branches[i] = parent;
      walkBranches(branch, parent, parents, branches);
    }
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
  global.io = io;
  // Closure compiler export
  // global['io'] = io;
}
exportIo(window);
