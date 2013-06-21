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
    return callback(ab);
  });
};

function readMask (path, callback) {
  return readToArrayBuffer (path, function (ab) {
    return mask.Mask.fromPBM(ab, callback);
  });
};

var pbm = [ "test-data/bullet-ascii.pbm",
            "test-data/frame-ascii.pbm",
            "test-data/bullet-binary.pbm",
            "test-data/frame-binary.pbm",
            "test-data/solid-ascii.pbm",
            "test-data/solid-binary.pbm" ];

describe("mask.Mask", function () {
  describe("#fromPBM()", function () {
    it("exists.", function () {
      assert.notEqual(mask.Mask.fromPBM, undefined);
    });
    function assertReads (path) {
      it("reads " + path, function (done) {
        readMask(path, function (mask) {
          done();
        });
      });
    };
    function assertSize (path, width, height) {
      it("gets the size of " + path + " right", function (done) {
        readMask(path, function (mask) {
          assert.equal(mask.size.x, width);
          assert.equal(mask.size.y, height);
          done();
        });
      });
    };
    pbm.forEach(function (img) {
      assertReads(img);
      assertSize(img, 10, 10);
    });
    function assertDataEqual (a, b) {
      it("gets the same data for " + a + " and " + b, function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
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
    };
    assertDataEqual("test-data/bullet-binary.pbm",
                    "test-data/bullet-ascii.pbm");
    assertDataEqual("test-data/frame-binary.pbm",
                    "test-data/frame-ascii.pbm");
  });
  describe(".collidesWith()", function () {
    function assertCollidesWithSelf (path) {
      it ("says " + path + " collides with itself", function (done) {
        readMask(path, function (m) {
          assert.equal(mask.Mask.collision(m, m), true);
          done();
        });
      });
    };
    function assertWithinSelf (path) {
      it ("says " + path + " is within itself", function (done) {
        readMask(path, function (m) {
          assert.equal(mask.Mask.within(m, m), true);
          done();
        });
      });
    };
    function assertDoesNotCollideWithTranslatedSelf (path) {
      it("says " + path + "doesn't collide with itself, translated",
         function (done) {
           readMask(path, function (m) {
             var o = m.at(m.size.x, m.size.y);
             assert.equal(mask.Mask.collision(m, o), false);
             done();
           });
         });
    };
    function assertDoesNotCollide(a, b) {
      it("says that " + a + " and " + b + " collide", function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(mask.Mask.collision(maskA, maskB), false);
            done();
          });
        });
      });
    };
    function assertNotWithin(a, b) {
      it("says that " + a + " is not within " + b, function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(mask.Mask.within(maskA, maskB), false);
            done();
          });
        });
      });
    };
    pbm.forEach(function (img) {
      assertCollidesWithSelf(img);
      assertWithinSelf(img);
      assertDoesNotCollideWithTranslatedSelf(img);
    });
    assertDoesNotCollide("test-data/frame-ascii.pbm",
                         "test-data/bullet-binary.pbm");
    assertNotWithin("test-data/frame-ascii.pbm",
                    "test-data/bullet-binary.pbm");
  });
});
