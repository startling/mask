var mask = (function () {
  function Mask () {
    this.translation = {};
    this.translation.x = 0;
    this.translation.y = 0;
    this.size = {};
    this.size.x = 0;
    this.size.y = 0;
    this.data = null;
  };
  /* Translate this Mask in two dimensions. */
  Mask.__proto__.translate = function (x, y) {
    this.translation.x += x;
    this.translation.y += y;
  };
  /* Create a Mask object from an ArrayBuffer taken as a PBM image. */
  Mask.from_pbm = function (array, callback) {
    var bytes = new Uint8Array(array);
    if (bytes.byteLength > 2) {
      if (bytes[0] === 'P'.charCodeAt(0)) {
        if (bytes[1] === '4'.charCodeAt(0)) {
          /* This is a PBM binary file... */
          return Mask.from_binary_pbm(bytes, callback);
        } else if (bytes[1] == "1".charCodeAt(0)) {
          /* This is an ASCII binary file... */
          return Mask.from_ascii_pbm(bytes, callback, err);
        } else {
          /* Unknown signature. */
          throw new Error("Unknown or unsupported PBM signature.");
        };
      } else {
        /* Unknown signature. */
        throw new Error("Unknown or unsupported PBM signature.");
      };
    } else {
      /* File two short. */
      throw new Error("Invalid PBM image.");
    };
  };
  /* Create a Mask from an Uint8Array taken semantically as an
     ASCII PBM image. */
  Mask.from_ascii_pbm = function (bytes, callback) {
    var bits = [];
    var index = 2;
    var width = "";
    var height = "";
    while (true) {
      var char = String.charCodeAt(bytes[index++]);
      if (char.match(/\d/)) {
        width += char;
      } else {
        break;
      }
    };
    while (true) {
      var char = String.charCodeAt(bytes[index]);
      if (char.match(/\d/)) {
        height += char;
      } else {
        break;
      };
    };
    for (index; index < bytes.byteLength; i++) {
      switch (bytes[index]) {
      case '0'.charCodeAt(0):
        bits.push(False);
        break;
      case '1'.charCodeAt(0):
        bits.push(True);
        break;
      };
    };
    var mask = new Mask();
    mask.size.x = parseInt(width);
    mask.size.y = parseInt(height);
    if (bits.length !== mask.size.x * mask.size.y) {
      /* Not enough data. */
      throw new Error("Invalid PBM image.");
    } else {
      mask.data = bits;
      return callback(mask);
    };
  };
  Mask.from_pbm_url = function (url, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "arraybuffer";
    req.onload = function (ev) {
      if (req.response) {
        from_bm(req.response, callback);
      } else {
        /* No response. */
        throw new Error("No response.");
      };
    };              
  };
  return {
    Mask: Mask,
  };
})();

if (typeof module !== "undefined") {
  module.exports = mask;
};
