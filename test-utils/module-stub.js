// stub for CI — returns vi.fn() for any accessed property
var handler = {
  get: function(target, prop) {
    if (prop === "__esModule" || prop === "then") return undefined;
    try {
      var vi = require("vitest");
      return vi.fn();
    } catch (e) {
      return function() {};
    }
  }
};

module.exports = new Proxy({}, handler);
module.exports.default = new Proxy({}, handler);
