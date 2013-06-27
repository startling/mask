var fs = require("fs");
var assert = require("assert");
var Mask = require("./mask").Mask;

function readToArrayBuffer (path, callback) {
  var rs = fs.createReadStream(path);
  rs.on("readable", function () {
    var buffer = rs.read();
    var ab = new ArrayBuffer(buffer.length);
    var u8 = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; i++) {
      u8[i] = buffer[i];
    }
    return callback(ab);
  });
}

function readMask (path, callback) {
  return readToArrayBuffer (path, function (ab) {
    return new Mask.PBM(ab, callback);
  });
}

var pbm = [ "test-data/bullet-ascii.pbm",
            "test-data/frame-ascii.pbm",
            "test-data/bullet-binary.pbm",
            "test-data/frame-binary.pbm",
            "test-data/solid-ascii.pbm",
            "test-data/solid-binary.pbm" ];

describe("Mask", function () {
  describe(".PBM()", function () {
    function assertReads (path) {
      it("reads " + path, function (done) {
        readMask(path, function (Mask) {
          done();
        });
      });
    }
    function assertSize (path, width, height) {
      it("gets the size of " + path + " right", function (done) {
        readMask(path, function (Mask) {
          assert.equal(Mask.w, width);
          assert.equal(Mask.h, height);
          done();
        });
      });
    }
    /* We should be able to read each image and get its size correct. */
    pbm.forEach(function (img) {
      assertReads(img);
      assertSize(img, 10, 10);
    });
    function assertDataEqual (a, b) {
      it("gets the same data for " + a + " and " + b, function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(maskA.w, maskB.w);
            assert.equal(maskA.h, maskB.h);
            for (var x = 0; x < maskA.w; x++) {
              for (var y = 0; y < maskA.h; y++) {
                assert.equal(maskA.data[x][y], maskB.data[x][y]);
              }
            }
            done();
          });
        });
      });
    }
    /* The binary and ascii variants of things should have equal data. */
    assertDataEqual("test-data/bullet-binary.pbm",
                    "test-data/bullet-ascii.pbm");
    assertDataEqual("test-data/frame-binary.pbm",
                    "test-data/frame-ascii.pbm");
    /* Make sure we read commented ASCII PBM correctly. */
    it("Reads commented ASCII PBM", function (done) {
      readMask("test-data/commented-ascii.pbm", function (m) {
        assert.equal(m.w, 1);
        assert.equal(m.h, 1);
        done();
      });
    });
  });
  describe(".collision()", function () {
    function assertCollidesWithSelf (path) {
      it ("says " + path + " collides with itself", function (done) {
        readMask(path, function (m) {
          assert.equal(Mask.collision(m, m), true);
          done();
        });
      });
    }
    function assertDoesNotCollideWithTranslatedSelf (path) {
      it("says " + path + "doesn't collide with itself, translated",
         function (done) {
           readMask(path, function (m) {
             var o = m.at(m.w, m.h);
             assert.equal(Mask.collision(m, o), false);
             done();
           });
         });
    }
    function assertCollides(a, b) {
      it("says that " + a + " and " + b + " collide", function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(Mask.collision(maskA, maskB), true);
            done();
          });
        });
      });
    }
    function assertDoesNotCollide(a, b) {
      it("says that " + a + " and " + b + "do not collide", function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(Mask.collision(maskA, maskB), false);
            done();
          });
        });
      });
    }
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
          assert.equal(m.within(m), true);
          done();
        });
      });
    }
    function assertWithin(a, b) {
      it("says that " + a + " is within " + b, function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(maskA.within(maskB), true);
            done();
          });
        });
      });
    }
    function assertNotWithin(a, b) {
      it("says that " + a + " is not within " + b, function (done) {
        readMask(a, function (maskA) {
          readMask(b, function (maskB) {
            assert.equal(maskA.within(maskB), false);
            done();
          });
        });
      });
    }
    /* Every image should be within itself and within the solid image. */
    pbm.forEach(function (img) {
      assertWithinSelf(img);
      assertWithin(img, "test-data/solid-binary.pbm");
    });
    /* The frame image should not be within the bullet image. */
    assertNotWithin("test-data/frame-ascii.pbm",
                    "test-data/bullet-binary.pbm");
  });
  describe("#framedBy()", function () {
    function assertFramedByBoundingBox(a) {
      it ("frames " + a + " by its bounding box", function (done) {
        readMask(a, function (m) {
          assert.equal(m.framedBy(m.x, m.y, m.w, m.h), true);
          done();
        });
      });
    }
    function assertNotFramedByTranslatedBoundingBox(a) {
      it ("does not frame " + a + " by its bounding box, translated",
          function (done) {
            readMask(a, function (m) {
              assert.equal(m.framedBy(m.x + m.w, m.y + m.h, m.w, m.h),
                           false);
              done();
        });
      });
    }
    pbm.forEach(function (img) {
      assertFramedByBoundingBox(img);
      assertNotFramedByTranslatedBoundingBox(img);
    });
  });
});
