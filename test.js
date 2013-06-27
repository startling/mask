var fs = require("fs");
var path = require("path");
var assert = require("assert");
var Mask = require("./mask").Mask;

var pbm = fs.readdirSync("test-data")
  .filter(function (img) {
    return /\.pbm$/.test(img);
  }).map(function (img) {
    return path.join("test-data", img);
  });

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
      if (done) {
        done();
      }
    });
  });
};

assert.disjoint = function (a, b, done) {
  readMask(a, function (a_) {
    readMask(b, function (b_) {
      assert(!Mask.collision(a_, b_),
             a + " collides with " + b + ".");
      if (done) {
        done();
      }
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
            var match = img.match(/\w+-(\d+)-(\d+)/);
            var width = parseInt(match[1]);
            var height = parseInt(match[2]);
            readMask(img, function (m) {
              // N.B. all the test data is 10x10.
              assert.equal(m.h, width,
                           "the mask from " + img +
                           "'s height is not " + height)
              assert.equal(m.w, height,
                           "the mask from " + img +
                           "'s width is not " + width)
              if (index === pbm.length - 1) {
                done();
              }
            });
          });
        });
    describe("#collidesAt", function () {
      it("does not have the bullet and the frame collide.",
         function (done) {
           assert.disjoint("test-data/bullet-10-10-ascii.pbm",
                           "test-data/frame-10-10-ascii.pbm",
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
  describe(".Box", function () {
    var examples = [new Mask.Box(10, 12),
                    new Mask.Box(1, 1),
                    new Mask.Box(2, 5).at(2, 2)
                   ];
    describe("#collidesAt", function () {
      it("has every nonempty box collide with itself",
         function () {
           examples.forEach(function (box) {
             assert(Mask.collision(box, box));
           });
         });
      it("does not have any boxes collide with themselves, translated",
         function () {
           examples.forEach(function (box) {
             assert(!Mask.collision(box, box.translated(box.h, box.w)));
           });
         });
    });
  });
  // ====================================================================
  describe(".Invert", function () {
    describe("#collidesAt", function () {
      it("does not have images collide with their inverses",
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
       

