var fs = require("fs");
var assert = require("assert");
var Mask = require("./mask").Mask;

var pbm = [ "test-data/bullet-ascii.pbm",
            "test-data/frame-ascii.pbm",
            "test-data/bullet-binary.pbm",
            "test-data/frame-binary.pbm",
            "test-data/solid-ascii.pbm",
            "test-data/solid-binary.pbm" ];

function readMask (path, callback) {
  var rs = fs.createReadStream(path);
  rs.on("readable", function () {
    var buffer = rs.read();
    var ab = new ArrayBuffer(buffer.length);
    var u8 = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; i++) {
      u8[i] = buffer[i];
    }
    return new Mask.PBM(ab, callback);
  });
}

assert.collides = function (a, b, done) {
  readMask(a, function (a_) {
    readMask(b, function (b_) {
      assert(Mask.collision(a_, b_),
            a + " does not collide with " + b + ".");
      done();
    });
  });
};

assert.disjoint = function (a, b, done) {
  readMask(a, function (a_) {
    readMask(b, function (b_) {
      assert(!Mask.collision(a_, b_),
            a + " collides with " + b + ".");
      done();
    });
  });
};


describe("Mask", function () {
  // ====================================================================
  describe(".PBM", function () {
    it("reads all of the test data files",
        function (done) {
          pbm.forEach(function (img, index) {
            readMask(img, function (m) {
              if (index === pbm.length - 1) {
                done();
              }
            });
          });
        });
    it("reads all of the test data files /with the correct dimensions/",
        function (done) {
          pbm.forEach(function (img, index) {
            readMask(img, function (m) {
              // N.B. all the test data is 10x10.
              assert.equal(m.h, 10,
                           "the mask from" + img + "'s height is not 10")
              assert.equal(m.w, 10,
                           "the mask from" + img + "'s width is not 10")
              if (index === pbm.length - 1) {
                done();
              }
            });
          });
        });
    describe("#collidesAt", function () {
      it("does not have the bullet and the frame collide.",
         function (done) {
           assert.disjoint("test-data/bullet-ascii.pbm",
                           "test-data/frame-ascii.pbm",
                           done);
         });
      it("has every non-empty image collide with itself",
         function (done) {
           pbm.forEach(function (img, index) {
             assert.collides(img, img, function () {
               if (index === pbm.length - 1) {
                 done();
               }
             });
           });
         });
    });
  });
  // ====================================================================
  describe(".Invert", function () {
    describe("#collidesAt", function () {
      it("does not have things collide with their inverses",
         function (done) {
           pbm.forEach(function (img, index) {
             readMask(img, function (m) {
               var inverse = new Mask.Invert(m);
               assert(!Mask.collision(m, inverse));
               if (index === pbm.length - 1) {
                 done();
               }
             });
           });
         });
    });
  });
  // ====================================================================
});
       

