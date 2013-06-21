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

var pbm = [ "test-data/bullet-ascii.pbm",
            "test-data/frame-ascii.pbm",
            "test-data/bullet-binary.pbm",
            "test-data/frame-binary.pbm" ];

describe("mask.Mask", function () {
  describe("#fromPBM()", function () {
    it("exists.", function () {
      assert.notEqual(mask.Mask.fromPBM, undefined);
    });
    function assertReads (path) {
      it("reads " + path + ".", function (done) {
        readToArrayBuffer(path, function (ab) {
          mask.Mask.fromPBM(ab, function (mask) {
            done();
          });
        });
      });
    };
    function assertSize (path, width, height) {
      it("gets the size of " + path + " right.", function (done) {
        readToArrayBuffer(path, function (ab) {
          mask.Mask.fromPBM(ab, function (mask) {
            assert.equal(mask.size.x, width);
            assert.equal(mask.size.y, height);
            done();
          });
        });
      });
    };
    pbm.forEach(function (img) {
      assertReads(img);
      assertSize(img, 10, 10);
    });
  });
});
