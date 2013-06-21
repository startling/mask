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
    return mask.fromPBM(ab, callback);
  });
};

var pbm = [ "test-data/bullet-ascii.pbm",
            "test-data/frame-ascii.pbm",
            "test-data/bullet-binary.pbm",
            "test-data/frame-binary.pbm",
            "test-data/solid-ascii.pbm",
            "test-data/solid-binary.pbm" ];

describe("mask", function () {
  describe("#fromPBM()", function () {
    it("exists.", function () {
      assert.notEqual(mask.fromPBM, undefined);
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
    /* We should be able to read each image and get its size correct. */
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
    /* The binary and ascii variants of things should have equal data. */
    assertDataEqual("test-data/bullet-binary.pbm",
                    "test-data/bullet-ascii.pbm");
    assertDataEqual("test-data/frame-binary.pbm",
                    "test-data/frame-ascii.pbm");
    /* Make sure we read commented ASCII PBM correctly. */
    it("Reads commented ASCII PBM", function (done) {
      readMask("test-data/commented.pbm", function (m) {
        console.log(m);
        assert.equal(m.size.x, 1);
        assert.equal(m.size.y, 1);
        done();
      });
    });
  });
  describe(".collision()", function () {
    function assertCollidesWithSelf (path) {
      it ("says " + path + " collides with itself", function (done) {
        readMask(path, function (m) {
          assert.equal(mask.collision(m, m), true);
          done();
        });
      });
    };
    function assertDoesNotCollideWithTranslatedSelf (path) {
      it("says " + path + "doesn't collide with itself, translated",
         function (done) {
           readMask(path, function (m) {
             var o = m.at(m.size.x, m.size.y);
             assert.equal(mask.collision(m, o), false);
             done();
           });
         });
    };
    function assertCollides(a, b) {
      it("says that " + a + " and " + b + " collide", function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(mask.collision(maskA, maskB), true);
            done();
          });
        });
      });
    };
    function assertDoesNotCollide(a, b) {
      it("says that " + a + " and " + b + "do not collide", function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(mask.collision(maskA, maskB), false);
            done();
          });
        });
      });
    };
    /* Every nonempty image should collide with itself;
       every nonempty image should collide with the solid image;
       every image should not collide with itself translated by its size. */
    pbm.forEach(function (img) {
      assertCollidesWithSelf(img);
      assertCollides(img, "test-data/solid-binary.pbm");
      assertDoesNotCollideWithTranslatedSelf(img);
    });
    /* The frame image and the bullet image should not collide. */
    assertDoesNotCollide("test-data/frame-ascii.pbm",
                         "test-data/bullet-binary.pbm");
  });
  describe(".within()", function () {
    function assertWithinSelf (path) {
      it ("says " + path + " is within itself", function (done) {
        readMask(path, function (m) {
          assert.equal(mask.within(m, m), true);
          done();
        });
      });
    };
    function assertWithin(a, b) {
      it("says that " + a + " is within " + b, function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(mask.within(maskA, maskB), true);
            done();
          });
        });
      });
    };
    function assertNotWithin(a, b) {
      it("says that " + a + " is not within " + b, function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(mask.within(maskA, maskB), false);
            done();
          });
        });
      });
    };
    /* Every image should be within itself and within the solid image. */
    pbm.forEach(function (img) {
      assertWithinSelf(img);
      assertWithin(img, "test-data/solid-binary.pbm");
    });
    /* The frame image should not be within the bullet image. */
    assertNotWithin("test-data/frame-ascii.pbm",
                    "test-data/bullet-binary.pbm");
  });
});
