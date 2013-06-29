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

var frame = "test-data/frame-10-10-ascii.pbm";
var dot = "test-data/dot-10-10-ascii.pbm";
readBoth(frame, dot, function (frame_, dot_) {
  new Benchmark.Suite().
    add("Mask.collision [frame@0/0, dot@0/0 ]", function () {
      Mask.collision(frame_, dot_);
    }).
    add("Mask.collision [frame@9/9, dot@0/0 ]", function () {
      Mask.collision(frame_.at(9, 9), dot_);
    }). 
    add("Mask.collision [dot@0/0, frame@9/9 ]", function () {
      Mask.collision(dot_, frame_.at(9, 9));
    }).
    add("Mask.collision [frame@0/0, bounding]", function () {
      Mask.collision(frame_, Mask.Box.bounding(frame_));
    }).
    add("Mask.collision [dot@0/0, bounding  ]", function () {
      Mask.collision(dot_, Mask.Box.bounding(dot_));
    }).
    add("Mask.collision [10/10@0/0, 2/2@0/0 ]", function () {
      Mask.collision(new Mask.Box(10, 10),
                     new Mask.Box(2, 2));
    }).
    add("Mask.collision [2/2@0/0, 10/10@0/0 ]", function () {
      Mask.collision(new Mask.Box(2, 2),
                     new Mask.Box(10, 10));
    }).
    add("Mask.collision [2/2@2/2, 4/4@0/0   ]", function () {
      Mask.collision(new Mask.Box(2, 2).at(2, 2),
                     new Mask.Box(4, 4));
    }).
    on("cycle", function (event) {
     console.log(event.target.toString());
    }).
    run();
});
