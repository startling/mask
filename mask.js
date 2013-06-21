var Mask = (function () {
  function Mask () {
    this.translation = {};
    this.translation.x = 0;
    this.translation.y = 0;
    this.size = {};
    this.size.x = 0;
    this.size.y = 0;
    this.data = null;
  }
  /* Make a clone of this Mask. */
  Mask.prototype.clone = function () {
    var other = new Mask();
    other.translation.x = this.translation.x;
    other.translation.y = this.translation.y;
    other.size.x = this.size.x;
    other.size.y = this.size.y;
    other.data = this.data;
    return other;
  };
  /* Translate this Mask in two dimensions. */
  Mask.prototype.translate = function (x, y) {
    this.translation.x += x;
    this.translation.y += y;
  };
  /* Make a copy of this Mask translated to the coordinates given. */
  Mask.prototype.at = function (x, y) {
    var other = this.clone();
    other.translation = {x: x, y: y};
    return other;
  };
  /* Create a Mask object from an ArrayBuffer taken as a PBM image. */
  Mask.fromPBM = function (array, callback) {
    var bytes = new Uint8Array(array);
    if (bytes.byteLength > 2) {
      if (bytes[0] === 'P'.charCodeAt(0)) {
        if (bytes[1] === '4'.charCodeAt(0)) {
          /* This is a PBM binary file... */
          return Mask.fromBinaryPBM(bytes, callback);
        } else if (bytes[1] == "1".charCodeAt(0)) {
          /* This is an ASCII binary file... */
          return Mask.fromASCIIPBM(bytes, callback);
        } else {
          /* Unknown signature. */
          throw new Error("Unknown or unsupported PBM signature.");
        }
      } else {
        /* Unknown signature. */
        throw new Error("Unknown or unsupported PBM signature.");
      }
    } else {
      /* File two short. */
      throw new Error("Invalid PBM image.");
    }
  };
  /* Parsing utility functions. */
  function skipRegex (regex, bytes, state) {
    for (; state.index < bytes.byteLength; state.index++) {
      var here = String.fromCharCode(bytes[state.index]);
      if (!here.match(regex)) {
        break;
      }
    }
  }
  function accumulateRegex (regex, bytes, state) {
    var accumulator = [];
    for (; state.index < bytes.byteLength; state.index++) {
      var here = String.fromCharCode(bytes[state.index]);
      if (here.match(regex)) {
        accumulator.push(here);
      } else {
        break;
      }
    }
    return accumulator;
  }
  function skipPostSignature (bytes, state) {
    skipRegex(/\s/, bytes, state);
    var here = String.fromCharCode(bytes[state.index]);
    while (here === '#') {
      state.index++;
      skipRegex(/[^\n]/, bytes, state);
      skipRegex(/\s/, bytes, state);
      here = String.fromCharCode(bytes[state.index]);
    };
  };
  /* Create a Mask from an Uint8Array taken semantically as an
     ASCII PBM image. */
  Mask.fromASCIIPBM = function (bytes, callback) {
    var bits = [];
    var state = {index: 2};
    /* Skip the spaces and comments post-signature. */
    skipPostSignature(bytes, state);
    /* Read numbers and stick them into 'width' until whitespace. */
    var width = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    /* Read numbers and stick them into 'height' until whitespace. */
    var height = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    /* Create a mask. */
    var mask = new Mask();
    mask.size.x = parseInt(width, 10);
    mask.size.y = parseInt(height, 10);
    /* Read 0 and 1 until the end of the file, skipping everything else. */
    for (; state.index < bytes.byteLength; state.index++) {
      function add (x) {
        if (!bits.length || bits[bits.length - 1].length === mask.size.x) {
          bits.push([]);
        }
        bits[bits.length - 1].push(x);
      }
      switch (bytes[state.index]) {
      case '0'.charCodeAt(0):
        add(false);
        break;
      case '1'.charCodeAt(0):
        add(true);
        break;
      default:
        break;
      }
    }
    mask.data = bits;
    return callback(mask);
  };
  /* Create a Mask from an Uint8Array taken semantically as an
     binary PBM image. */
  Mask.fromBinaryPBM = function (bytes, callback) {
     var bits = [];
    var state = {index: 2};
    /* Skip the spaces and comments post-signature. */
    skipPostSignature(bytes, state);
    /* Read numbers and stick them into 'width' until whitespace. */
    var width = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    /* Read numbers and stick them into 'height' until whitespace. */
    var height = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    /* Create a mask. */
    var mask = new Mask();
    mask.size.x = parseInt(width, 10);
    mask.size.y = parseInt(height, 10);
    /* Read each byte, in sequence. */
    for (; state.index < bytes.byteLength; state.index++) {
      if (bits.length === mask.size.y - 1 &&
          bits[bits.length - 1].length === mask.size.x - 1) {
        break;
      }
      else if (!bits.length || bits[bits.length - 1].length >= mask.size.x) {
        bits.push([]);
      }
      for (var b = 0; b < 8; b++) {
        if (bits[bits.length - 1].length < mask.size.x) {
          var bit = Boolean((bytes[state.index] >> (7 - b)) & 0x01);
          bits[bits.length - 1].push(bit);
        }
      }
    }
    mask.data = bits;
    callback(mask);
  };
  /* Create a Mask from a PBM image at some URL. */
  Mask.fromPBMUrl = function (url, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "arraybuffer";
    req.onload = function (ev) {
      if (req.response) {
        from_bm(req.response, callback);
      } else {
        /* No response. */
        throw new Error("No response.");
      }
    };
  };
  /* Test whether two Masks collide. */
  Mask.collision = function (a, b) {
    var diff = {x: a.translation.x - b.translation.x,
                y: a.translation.y - b.translation.y };
    for (var x = 0; x < a.size.x; x++) {
      for (var y = 0; y < a.size.y; y++) {
        if (a.data[x][y]) {
          var forB = {x: x + diff.x, y: y + diff.y};
          if (b.data[forB.x] && b.data[forB.x][forB.y]) {
            return true;
          }
        }
      }
    }
    return false;
  };
  /* Test whether a mask is completely contained within another. */
  Mask.within = function (a, b) {
    var diff = {x: a.translation.x - b.translation.x,
                y: a.translation.y - b.translation.y };
    for (var x = 0; x < a.size.x; x++) {
      for (var y = 0; y < a.size.y; y++) {
        if (a.data[x][y]) {
          var forB = {x: x + diff.x, y: y + diff.y};
          if (!(b.data[forB.x] && b.data[forB.x][forB.y])) {
            return false;
          }
        }
      }
    }
    return true;
  };
  if (typeof module !== "undefined") {
    module.exports = Mask;
  }
  return Mask;
})();
