var fs = require("fs");
var assert = require("assert");
var mask = require("./mask");

function readToArrayBuffer (path, callback) {
  var rs = fs.createReadStream(path);
  rs.on("readable", function () {
    var buffer = rs.read();
    var ab = new ArrayBuffer(buffer.length);
    var u8 = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; i++) {
      u8[i] = buffer[i];
    };
    callback(ab);
  });
};

describe("mask.Mask", function () {
  describe("#from_pbm()", function () {
    it("exists", function () {
      assert.notEqual(mask.Mask.from_pbm, undefined);
    });
    function assert_reads (path) {
      it("reads " + path + ".", function (done) {
        readToArrayBuffer(path, function (ab) {
          mask.Mask.from_pbm(ab, function (mask) {
            done();
          });
        });
      });
    };
    assert_reads("test-data/bullet-ascii.pbm");
    assert_reads("test-data/frame-ascii.pbm");
    assert_reads("test-data/bullet-binary.pbm");
    assert_reads("test-data/frame-binary.pbm");
  });
});
