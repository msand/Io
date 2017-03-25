/*jslint forin: true, plusplus: true */
(function(root) {
  "use strict";
  function Io() {
    var currentLeaf = this, lastLeafVersion = 0, view = Object.create(null);

    Object.defineProperty(this, "lastLeafVersion", {
      configurable: false,
      enumerable: true,
      set: function() {
        return ++lastLeafVersion;
      },
      get: function() {
        return lastLeafVersion;
      }
    });
    this.timestamp();
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
        if (!newLeaf instanceof Io) {
          throw new TypeError("Only infinite objects allowed");
        }
        if (!this.root.isPrototypeOf(newLeaf)) {
          throw new TypeError("Only extensions of this root are allowed");
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
    value: function() {
      Object.defineProperty(this, "date", {
        configurable: false,
        enumerable: true,
        writable: false,
        value: new Date()
      });
    }
  });
  Object.defineProperty(Io.prototype, "up", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: function(keyOrProps, value) {
      var numParams = arguments.length, up, name;
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
        if (!(keyOrProps instanceof Object)) {
          throw new TypeError(
            "Property parameter should be an instance of object"
          );
        }
        for (name in keyOrProps) {
          if (keyOrProps.hasOwnProperty(name)) {
            Object.defineProperty(up, name, {
              value: keyOrProps[name],
              configurable: false,
              enumerable: true,
              writable: false
            });
          }
        }
      }

      up.timestamp();

      Object.defineProperty(up, "version", {
        value: ++this.root.lastLeafVersion,
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

  Object.seal(Io.prototype);
  Object.seal(Io);
  root.Io = Io;
  // Closure compiler export
  // window['Io'] = Io;
  // Io.prototype['up'] = Io.prototype.up;
})(this);
