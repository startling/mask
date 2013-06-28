var fs = require("fs");
var path = require("path");
var assert = require("assert");
var Mask = require("./mask");

var pbm = fs.readdirSync("test-data").filter(function (img) {
    return (/\.pbm$/).test(img);
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
    var m = new Mask.PBM();
    return m.load(ab, callback);
  });
}

function readBoth (a, b, done) {
  readMask(a, function (a_) {
    readMask(b, function (b_) {
      done(a_, b_);
    });
  });
}
  

assert.collides = function (a, b, done) {
  readBoth(a, b, function (a_, b_) {
    assert(Mask.collision(a_, b_),
           a + " does not collide with " + b + ".");
    if (done) {
      done();
    }
  });
};

assert.disjoint = function (a, b, done) {
  readBoth(a, b, function (a_, b_) {
    assert(!Mask.collision(a_, b_),
           a + " collides with " + b + ".");
    if (done) {
      done();
    }
  });
};

assert.within = function (a, b, done) {
  readBoth(a, b, function (a_, b_) {
    assert(a_.within(b_),
           a + " is not within " + b + ".");
    if (done) {
      done();
    }
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
            var width = parseInt(match[1], 10);
            var height = parseInt(match[2], 10);
            readMask(img, function (m) {
              // N.B. all the test data is 10x10.
              assert.equal(m.h, width,
                           "the mask from " + img +
                           "'s height is not " + height);
              assert.equal(m.w, height,
                           "the mask from " + img +
                           "'s width is not " + width);
              if (index === pbm.length - 1) {
                done();
              }
            });
          });
        });
    it("gets the same data from the ascii and binary bullets",
       function (done) {
         readBoth("test-data/bullet-10-10-ascii.pbm",
                  "test-data/bullet-10-10-binary.pbm",
                  function(a_, b_) {
                    assert.equal(a_.w, b_.w);
                    assert.equal(a_.h, b_.h);
                    for (var x = 0; x < a_.w; x++) {
                      for (var y = 0; y < a_.h; y++) {
                        assert.equal(a_.data[x][y], b_.data[x][y]);
                      }
                    }
                    done();
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
           pbm.filter(function (img) {
             return !(/empty/).test(img);
           }).forEach(function (img, index, arr) {
             assert.collides(img, img, function () {
               if (index === arr.length - 1) {
                 done();
               }
             });
           });
         });
      it("has every image within itself",
         function (done) {
           pbm.forEach(function (img, index) {
             assert.within(img, img, function () {
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
      it("has every box within itself",
         function () {
           examples.forEach(function (box) {
             assert(box.within(box));
           });
         });
      it("has every nonempty image collide with its bounding box",
         function (done) {
           pbm.filter(function (img) {
             return !(/empty/).test(img);
           }).forEach(function (img, index, arr) {
             readMask(img, function (m) {
               assert(Mask.collision(m, Mask.Box.bounding(m)));
               if (index === arr.length - 1) {
                 done();
               }
             });
           });
         });
      it("has every nonempty image within its bounding box",
         function (done) {
           pbm.filter(function (img) {
             return !(/empty/).test(img);
           }).forEach(function (img, index, arr) {
             readMask(img, function (m) {
               assert(m.within(Mask.Box.bounding(m)));
               if (index === arr.length - 1) {
                 done();
               }
             });
           });
         });
      it("has every nonempty image not within its bounding box, translated",
         function (done) {
           pbm.filter(function (img) {
             return !(/empty/).test(img);
           }).forEach(function (img, index, arr) {
             readMask(img, function (m) {
               assert(!m.within(Mask.Box.bounding(m).translated(m.w, m.h)));
               if (index === arr.length - 1) {
                 done();
               }
             });
           });
         });
      it("has every nonempty image not within a unit box at -1, -1",
         function (done) {
           var empty = new Mask.Box(1, 1).at(-1, -1);
           pbm.filter(function (img) {
             return !(/empty/).test(img);
           }).forEach(function (img, index, arr) {
             readMask(img, function (m) {
               assert(!m.within(empty));
               if (index === arr.length - 1) {
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
       

