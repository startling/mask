var assert = require("assert");
var mask = require("../mask");

describe("mask.Mask", function () {
  describe("#from_pbm()", function () {
    it("exists", function () {
      assert.notEqual(mask.Mask.from_pbm, undefined);
    });
  });
});
