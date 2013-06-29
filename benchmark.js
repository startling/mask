var fs = require("fs");
var Benchmark = require("benchmark");
var memwatch = require('memwatch');
var Mask = require("./mask");

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
      return done(a_, b_);
    });
  });
}

var hd = new memwatch.HeapDiff();
readMask("test-data/frame-10-10-ascii.pbm",
         function (_a) {
           var diff = hd.end();
           console.log("Reading \"frame-10-10-ascii.pbm\" costs",
                       diff.change.size + ".");
         });

readBoth("test-data/frame-10-10-ascii.pbm",
         "test-data/dot-10-10-ascii.pbm",
         function (a_, b_) {
           new Benchmark.Suite().add("Mask.PBM#collidesAt", function () {
             Mask.collision(a_, b_);
           }).on("cycle", function (event) {
             console.log(String(event.target));
           }).run();
         });

