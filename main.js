/*jslint for: true, this: true, white: true */
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
  function Io(fromObj) {
    var root = this;
    var currentLeaf = this;
    var lastLeafVersion = 0;
    var view = Object.create(null);

    Object.defineProperty(this, "lastLeafVersion", {
      configurable: false,
      enumerable: true,
      set: function() {
        lastLeafVersion += 1;
        return lastLeafVersion;
      },
      get: function() {
        return lastLeafVersion;
      }
    });
    this.timestamp(fromObj);
    Object.defineProperty(this, "root", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: this
    });
    Object.defineProperty(this, "view", {
      configurable: false,
      enumerable: true,
      get: function() {
        return view;
      }
    });
    Object.defineProperty(this, "currentLeaf", {
      configurable: false,
      enumerable: false,
      get: function() {
        return currentLeaf;
      },
      set: function(newLeaf) {
        var key;
        if (!root.isPrototypeOf(newLeaf)) {
          throw new TypeError(
            "Only infinite objects which are extensions of this root are allowed"
          );
        }
        if (Object.getPrototypeOf(newLeaf) === currentLeaf) {
          for (key in newLeaf) {
            if (newLeaf.hasOwnProperty(key)) {
              view[key] = newLeaf[key];
            }
          }
        } else {
          view = Object.create(null);
          for (key in newLeaf) {
            if (!this.root.hasOwnProperty(key) || key === "date") {
              view[key] = newLeaf[key];
            }
          }
        }
        currentLeaf = newLeaf;
        return currentLeaf;
      }
    });
    Object.defineProperty(this, "branches", {
      configurable: false,
      enumerable: true,
      writable: false,
      value: []
    });
    Object.seal(this);
  }

  Object.defineProperty(Io.prototype, "timestamp", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function(fromObj) {
      if (!this.hasOwnProperty("date")) {
        Object.defineProperty(this, "date", {
          configurable: false,
          enumerable: true,
          writable: false,
          value: fromObj ? new Date(fromObj.date) : new Date()
        });
      }
    }
  });
  Object.defineProperty(Io.prototype, "up", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function(keyOrProps, value) {
      var numParams = arguments.length;
      var props;
      var name;
      var up;
      var l;
      var i;
      if (numParams === 0 || numParams > 2) {
        throw new Error("Wrong number of parameters");
      }

      up = Object.create(this);

      if (numParams === 2) {
        if (typeof keyOrProps !== "string") {
          throw new TypeError("Wrong property name type");
        }
        Object.defineProperty(up, keyOrProps, {
          configurable: false,
          enumerable: true,
          writable: false,
          value: value
        });
      } else if (numParams === 1) {
        if (!isObject(keyOrProps)) {
          throw new TypeError(
            "Property parameter should be an object"
          );
        }
        props = Object.keys(keyOrProps);
        l = props.length;
        for (i = 0; i < l; i += 1) {
          name = props[i];
          Object.defineProperty(up, name, {
            value: keyOrProps[name],
            configurable: false,
            enumerable: true,
            writable: name === "branches" || name === "version"
          });
        }
      }

      up.timestamp();

      this.root.lastLeafVersion += 1;

      Object.defineProperty(up, "version", {
        value: this.root.lastLeafVersion,
        configurable: false,
        enumerable: true,
        writable: false
      });

      Object.defineProperty(up, "branches", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: []
      });

      Object.seal(up);

      this.branches.push(up);

      this.root.currentLeaf = up;

      return up;
    }
  });

  Object.defineProperty(Io, "fromJSON", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function(json) {
      return Io.fromParsedJSON(JSON.parse(json));
    }
  });

  function walkBranches(branch, parent, parents, versions) {
    var branches = branch.branches;
    var l = branches.length;
    var version;
    var child;
    var b;
    for (b = 0; b < l; b += 1) {
      child = branches[b];
      version = child.version;
      versions[version] = child;
      parents[version] = parent;
    }
  }

  Object.defineProperty(Io, "fromParsedJSON", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function(obj) {
      var io = new Io(obj);
      var branches = [];
      var parents = [];
      var branch;
      var parent;
      var i;
      walkBranches(obj, io, parents, branches);
      for (i = 1; i < branches.length; i += 1) {
        branch = branches[i];
        parent = parents[branch.version].up(branch);
        branches[i] = parent;
        walkBranches(branch, parent, parents, branches);
      }
      io.currentLeaf = branches[obj.view.version];
      return io;
    }
  });

  Object.seal(Io.prototype);
  Object.seal(Io);
  global.Io = Io;
  // Closure compiler export
  // window['Io'] = Io;
  // Io.prototype['up'] = Io.prototype.up;
}
exportIo(this);
