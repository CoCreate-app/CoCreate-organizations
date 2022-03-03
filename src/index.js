(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./client"], function(CoCreateOrganization) {
        	return factory(CoCreateOrganization)
        });
    } else if (typeof module === 'object' && module.exports) {
      const CoCreateOrganization = require("./server.js")
      module.exports = factory(CoCreateOrganization);
    } else {
        root.returnExports = factory(root["./client.js"]);
  }
}(typeof self !== 'undefined' ? self : this, function (CoCreateOrganization) {
  return CoCreateOrganization;
}));