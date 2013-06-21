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
      it("reads " + path, function (done) {
        readToArrayBuffer(path, function (ab) {
          mask.Mask.fromPBM(ab, function (mask) {
            done();
          });
        });
      });
    };
    function assertSize (path, width, height) {
      it("gets the size of " + path + " right", function (done) {
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
    function assertDataEqual (a, b) {
      it("gets the same data for " + a + " and " + b, function (done) {
        readToArrayBuffer(a, function (abA) {
          mask.Mask.fromPBM(abA, function (maskA) {
            readToArrayBuffer(b, function (abB) {
              mask.Mask.fromPBM(abB, function (maskB) {
                assert.equal(maskA.size.x, maskB.size.x);
                assert.equal(maskA.size.y, maskB.size.y);
                for (var x = 0; x < maskA.size.x; x++) {
                  for (var y = 0; y < maskA.size.y; y++) {
                    assert.equal(maskA.data[x][y], maskB.data[x][y]);
                  };
                };
                done();
              });
            });
          });
        });
      });
    };
    assertDataEqual("test-data/bullet-binary.pbm",
                    "test-data/bullet-ascii.pbm");
    assertDataEqual("test-data/frame-binary.pbm",
                    "test-data/frame-ascii.pbm");
  });
  describe(".collidesWith()", function () {
    function assertCollidesWithSelf (path) {
      it ("says " + path + " collides with itself", function (done) {
        readToArrayBuffer(path, function (ab) {
          mask.Mask.fromPBM(ab, function (m) {
            assert.equal(mask.Mask.collision(m, m), true);
            done();
          });
        });
      });
    };
    function assertDoesNotCollideWithTranslatedSelf (path) {
      it("says " + path + "doesn't collide with itself, translated",
         function (done) {
           readToArrayBuffer(path, function (ab) {
             mask.Mask.fromPBM(ab, function (m) {
               var o = m.at(m.size.x, m.size.y);
               assert.equal(mask.Mask.collision(m, o), false);
               done();
             });
           });
         });
    };
    pbm.forEach(function (img) {
      assertCollidesWithSelf(img);
      assertDoesNotCollideWithTranslatedSelf(img);
    });
  });
});
