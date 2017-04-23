/*eslint-env browser, node, es6 */
/*jslint white: true, es6: true*/
/*jshint esversion: 6*/

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

const reservedPropertyNames = ["branch", "branches", "version"];

const reservedNames = reservedPropertyNames.join();

const hasOwnProp = Object.prototype.hasOwnProperty;

function immutable() {
  throw new Error("Immutable");
}

const immutableArrayViewer = {
  isExtensible: () => false,
  preventExtensions: immutable,
  defineProperty: immutable,
  deleteProperty: immutable,
  set: immutable
};

function io() {
  const root = {};
  let numVersions = 0;
  const listeners = [];
  let currentBranch = root;

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
      return () => root.off(listener);
    })
  });

  Object.defineProperty(root, "off", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.freeze(function off(listener) {
      let index = listeners.indexOf(listener);
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

  function branchFrom(parent, parentBranches) {
    return function branchUsing(...args) {
      const numParams = args.length;
      if (numParams === 0 || numParams > 2) {
        throw new Error("Wrong number of parameters");
      }

      const branch = Object.create(parent);

      if (numParams === 2) {
        const [key, value] = args;
        if (
          typeof key !== "string" ||
          reservedPropertyNames.indexOf(key) !== -1
        ) {
          throw new TypeError(
            "Key must be string and not in: " + reservedNames
          );
        }
        Object.defineProperty(branch, key, {
          configurable: false,
          enumerable: true,
          writable: false,
          value: value
        });
      } else if (numParams === 1) {
        const [props] = args;
        if (!isObject(props)) {
          throw new TypeError("Argument must be object");
        }
        Object.keys(props).forEach(function setProp(key) {
          if (reservedPropertyNames.indexOf(key) !== -1) {
            return;
          }
          Object.defineProperty(branch, key, {
            value: props[key],
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

      const branches = [];

      const branchesView = new Proxy(branches, immutableArrayViewer);

      Object.defineProperty(branch, "branches", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: branchesView
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

  Object.defineProperty(root, "numVersions", {
    configurable: false,
    enumerable: true,
    get: function getNumVersions() {
      return numVersions;
    }
  });

  let view = Object.create(null);

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
        let obj = branch;
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

  const rootBranches = [];
  const branchesView = new Proxy(rootBranches, immutableArrayViewer);

  Object.defineProperty(root, "branch", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.freeze(branchFrom(root, rootBranches))
  });

  Object.defineProperty(root, "branches", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: branchesView
  });

  Object.freeze(root);

  return root;
}

function walkBranches(source, sources, parents, branch) {
  source.branches.forEach(function walkBranch(child) {
    const childVersion = child.version;
    sources[childVersion] = child;
    parents[childVersion] = branch;
  });
}

function fromParsedJSON(obj) {
  const root = io();
  const versions = [];
  versions.length = obj.numVersions;
  const parents = Array.apply(null, versions);
  const sources = Array.apply(null, versions);
  walkBranches(obj, sources, parents, root);
  const branches = sources.map(function importBranch(source) {
    const branch = parents[source.version].branch(source);
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
  const root = io();
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

export default io;
