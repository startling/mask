
/* This is `mask`, a tiny MIT-licensed library providing collision masks
 * and thus pixel-perfect collision detection in JavaScript. Collision
 * masks are read from [PBM][] files. Check the [github][] page for more
 * information.
 * [github]: https://github.com/startling/mask
 * [PBM]: http://netpbm.sourceforge.net/doc/pbm.html
 */
/*!*/
var mask = (function () {
  /* Construct a `mask`.
   *
   * Examples:
   * 
   *     new mask()
   *
   * @constructor
   * @api public
   */
  function mask () {
    this.x = this.y = this.w = this.h = 0;
    this.data = null;
  }
  /* Make a clone of a `mask`.
   *
   * @this {mask}
   * @api public
   */
  mask.prototype.clone = function () {
    var other = new mask();
    other.x = this.x;
    other.y = this.y;
    other.w = this.w;
    other.h = this.h;
    other.data = this.data;
    return other;
  };
  /* Translate this `mask` in two dimensions.
   *
   * @this {mask}
   * @param {Number} x x-distance
   * @param {Number} y y-distancex
   * @api public
   */
  mask.prototype.translate = function (x, y) {
    this.x += x;
    this.y += y;
  };
  /* Make a copy of this `mask` translated to the coordinates given.
   *
   * @this {mask}
   * @param {Number} x x-coordinate
   * @param {Number} y y-coordinate
   * @return {mask}
   * @api public
   */
  mask.prototype.at = function (x, y) {
    var other = this.clone();
    other.x = x;
    other.y = y;
    return other;
  };
  /* Mask a copy of this `mask` translated in two dimensions.
   * @this {mask}
   * @param {Number} x x-distance
   * @param {Number} y y-distance
   * @return {mask}
   * @api public
   */
  mask.prototype.translated = function (x, y) {
    var other = this.clone();
    other.translate(x, y);
    return other;
  };
  /* Test that a mask is completely within a box described by
   * the coordinates of its top-left corner and its width and height.
   *
   * @this {mask}
   * @param {Number} x the top left x-coordinate of the box
   * @param {Number} y the top left y-coordinate of the box
   * @param {Number} w the width of the box
   * @param {Number} h the height of the box
   * @return {Boolean}
   * @api public
   */
  mask.prototype.framedBy = function (x, y, w, h) {
    var intersect = intersection(this, {x: x, y: y, w: w, h: h});
    return intersect.x === this.x &&
      intersect.y === this.y &&
      intersect.h === this.h &&
      intersect.w === this.w;
  }

  /** Some callbacks expect a `mask`.
   * @callback maskCallback
   * @param {mask} the collision map
   * @api private
   */
  /* Create a `mask` object from an `ArrayBuffer` taken as a PBM image.
   *
   * @param {ArrayBuffer} array image data
   * @param {maskCallback} callback
   * @api public
   */
  mask.fromPBM = function (array, callback) {
    var bytes = new Uint8Array(array);
    if (bytes.byteLength > 2) {
      if (bytes[0] === 'P'.charCodeAt(0)) {
        if (bytes[1] === '4'.charCodeAt(0)) {
          // This is a PBM binary file...
          return mask.fromBinaryPBM(bytes, callback);
        } else if (bytes[1] == "1".charCodeAt(0)) {
          // This is an ASCII binary file...
          return mask.fromASCIIPBM(bytes, callback);
        } else {
          // Unknown signature.
          return callback(null, new Error("Unknown PBM signature."));
        }
      } else {
        // Unknown signature.
        return callback(null, new Error("Unknown PBM signature."));
      }
    } else {
      // File too short.
      return callback(null, Error("Invalid PBM image."));
    }
  };
  /* Skip every byte matching a regular expression.
   *
   * @api private
   * @param {RegExp} regex regular expression
   * @param {Uint8Buffer} bytes character data
   * @param {object} state parser state
   */
  function skipRegex (regex, bytes, state) {
    for (; state.index < bytes.byteLength; state.index++) {
      var here = String.fromCharCode(bytes[state.index]);
      if (!here.match(regex)) {
        break;
      }
    }
  }
  /* Find all the leading characters matching a regular expression and
   * stick them in an array.
   *
   * @api private
   * @param {RegExp} regex regular expression
   * @param {Uint8Buffer} bytes character data
   * @param {object} state parser state
   * @return {Array}
   */
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
  /* Skip the parts that come after a PBM signature -- whitespace and any
   * number of comments.
   *
   * @api private
   * @param {Uint8Buffer} bytes character data
   * @param {object} state parser state
   */
  function skipPostSignature (bytes, state) {
    skipRegex(/\s/, bytes, state);
    var here = String.fromCharCode(bytes[state.index]);
    while (here === '#') {
      state.index++;
      skipRegex(/[^\n]/, bytes, state);
      skipRegex(/\s/, bytes, state);
      here = String.fromCharCode(bytes[state.index]);
    }
  }
  /* Create a mask from an Uint8Array taken semantically as an ASCII PBM image.
   *
   * @param {Uint8Buffer} bytes PBM image data.
   * @param {maskCallback} callback
   * @api public
   */
  mask.fromASCIIPBM = function (bytes, callback) {
    var bits = [];
    var state = {index: 2};
    // Skip the spaces and comments post-signature.
    skipPostSignature(bytes, state);
    var width = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    // Read numbers and stick them into 'height' until whitespace.
    var height = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    // Create a mask.
    var m = new mask();
    m.w = parseInt(width, 10);
    m.h = parseInt(height, 10);
    // Read 0 and 1 until the end of the file, skipping everything else.
    for (; state.index < bytes.byteLength; state.index++) {
      function add (x) {
        if (!bits.length || bits[bits.length - 1].length === m.w) {
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
    m.data = bits;
    return callback(m);
  };
  /* Create a `mask` from an Uint8Array taken semantically as an binary
   * PBM image.
   *
   * @param {Uint8Buffer} bytes PBM image data.
   * @param {maskCallback} callback
   * @api public
   */
  mask.fromBinaryPBM = function (bytes, callback) {
     var bits = [];
    var state = {index: 2};
    // Skip the spaces and comments post-signature.
    skipPostSignature(bytes, state);
    // Read numbers and stick them into 'width' until whitespace.
    var width = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    // Read numbers and stick them into 'height' until whitespace.
    var height = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    // Create a mask.
    var m = new mask();
    m.w = parseInt(width, 10);
    m.h = parseInt(height, 10);
    // Read each byte, in sequence.
    for (; state.index < bytes.byteLength; state.index++) {
      if (bits.length === m.h - 1 &&
          bits[bits.length - 1].length === m.w - 1) {
        break;
      }
      else if (!bits.length || bits[bits.length - 1].length >= m.w) {
        bits.push([]);
      }
      for (var b = 0; b < 8; b++) {
        if (bits[bits.length - 1].length < m.w) {
          var bit = Boolean((bytes[state.index] >> (7 - b)) & 0x01);
          bits[bits.length - 1].push(bit);
        }
      }
    }
    m.data = bits;
    callback(m);
  };
  /* Create a `mask` from a PBM image at some URL.
   *
   * @param {String} url A URL pointing to a PBM image.
   * @param {maskCallback} callback
   * @api public
   */
  mask.fromPBMUrl = function (url, callback) {
    var req = new XMLHttpRequest();
    req.responseType = "arraybuffer";
    req.onload = function (ev) {
      if (req.response) {
        return mask.fromPBM(req.response, callback);
      } else {
        // No response.
        return callback(null, new Error("No response."));
      }
    };
    req.onerror = function (e) {
      return callback(null, e);
    };
    req.open("GET", url, true);
    req.send();
  };
  /* Create an object representing the intersection of the bounding
   * boxes of two objects.
   *
   * @api private
   */
  function intersection (a, b) {
    var a_2 = {x: a.x + a.w, y: a.y + a.h};
    var b_2 = {x: b.x + b.w, y: b.y + b.h};
    var overlap = {x: a.x > b.x ? a.x : b.x,
                   y: a.y > b.y ? a.y : b.y};
    overlap.w = (a_2.x < b_2.x ? a_2.x : b_2.x) - overlap.x;
    overlap.h = (a_2.y < b_2.y ? a_2.y : b_2.y) - overlap.y;
    return overlap;
  }
  /* Test whether two masks collide.
   *
   * @param {mask} a
   * @param {mask} b
   * @api public
   */
  mask.collision = function (a, b) {
    var intersect = intersection(a, b);
    for (var x = intersect.x; x < intersect.w; x++) {
      for (var y = intersect.y; y < intersect.h; y++) {
        if (a.data[x - a.x][y - a.y] &&
            b.data[x - b.x][y - b.y]) {
          return true;
        }
      }
    }
    return false;
  };
  /* Test whether a mask is completely contained within another.
   *
   * @param {mask} a The contained mask.
   * @param {mask} b The containing mask.
   * @api public
   */
  mask.within = function (a, b) {
    var intersect = intersection(a, b);
    for (var x = intersect.x; x < intersect.w; x++) {
      for (var y = intersect.y; y < intersect.h; y++) {
        if (a.data[x - a.x][y - a.y] &&
            !(b.data[x - b.x][y - b.y])) {
          return false;
        }
      }
    }
    return true;
  };
  /*!*/
  if (typeof module !== "undefined") {
    module.exports = mask;
  }
  return mask;
})();
