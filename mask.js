/* This is `mask`, a tiny MIT-licensed library providing collision masks
 * and thus pixel-perfect collision detection in JavaScript. Collision
 * masks are read from [PBM][] files. Check the [github][] page for more
 * information.
 * [github]: https://github.com/startling/mask
 * [PBM]: http://netpbm.sourceforge.net/doc/pbm.html
 */
/*!*/
var Mask = (function () {
  /* Construct a `Mask`.
   *
   * Examples:
   * 
   *     new Mask()
   *
   * @constructor
   * @api public
   */
  function Mask () {
    this.x = this.y = this.w = this.h = 0;
  }
  /* Make a clone of a `Mask`.
   *
   * @this {Mask}
   * @api public
   */
  Mask.prototype.clone = function () {
    var other = new Mask();
    other.x = this.x;
    other.y = this.y;
    other.w = this.w;
    other.h = this.h;
    return other;
  };
  /* Translate this `Mask` in two dimensions.
   *
   * @this {Mask}
   * @param {Number} x x-distance
   * @param {Number} y y-distancex
   * @api public
   */
  Mask.prototype.translate = function (x, y) {
    this.x += x;
    this.y += y;
  };
  /* Make a copy of this `Mask` translated to the coordinates given.
   *
   * @this {Mask}
   * @param {Number} x x-coordinate
   * @param {Number} y y-coordinate
   * @return {Mask}
   * @api public
   */
  Mask.prototype.at = function (x, y) {
    var other = this.clone();
    other.x = x;
    other.y = y;
    return other;
  };
  /* Mask a copy of this `Mask` translated in two dimensions.
   * @this {Mask}
   * @param {Number} x x-distance
   * @param {Number} y y-distance
   * @return {Mask}
   * @api public
   */
  Mask.prototype.translated = function (x, y) {
    var other = this.clone();
    other.translate(x, y);
    return other;
  };
  /* Test that a Mask is completely within a box described by
   * the coordinates of its top-left corner and its width and height.
   *
   * @this {Mask}
   * @param {Number} x the top left x-coordinate of the box
   * @param {Number} y the top left y-coordinate of the box
   * @param {Number} w the width of the box
   * @param {Number} h the height of the box
   * @return {Boolean}
   * @api public
   */
  Mask.prototype.framedBy = function (x, y, w, h) {
    var intersect = intersection(this, {x: x, y: y, w: w, h: h});
    return intersect.x === this.x &&
      intersect.y === this.y &&
      intersect.h === this.h &&
      intersect.w === this.w;
  }
  /* Test whether a Mask is completely contained within another.
   *
   * @this {Mask}
   * @param {Mask} b The containing Mask.
   * @api public
   */
  Mask.prototype.within = function (b) {
    var intersect = intersection(this, b);
    for (var x = intersect.x; x < intersect.w; x++) {
      for (var y = intersect.y; y < intersect.h; y++) {
        if (this.collidesAt(x, y) &&
            !b.collidesAt(x, y)) {
          return false;
        }
      }
    }
    return true;
  };
  /* Test whether this mask collides at the given location.
   *
   * @this {Mask}
   * @param {Number} x x-coordinate
   * @param {Number} y y-coordinate
   * @return {Mask}
   * @api public
   */
  Mask.prototype.collidesAt = function (x, y) {
    return this.data[x - this.x][y - this.y];
  };
  /** Some callbacks expect a `Mask`.
   * @callback MaskCallback
   * @param {Mask} the collision map
   * @api private
   */
  /* Create a `Mask` object from an `ArrayBuffer` taken as a PBM image.
   *
   * N.B. do not use the newly-constructed `Mask` directly until
   * the callback is called.
   *
   * @constructor
   * @param {ArrayBuffer} array image data
   * @param {MaskCallback} callback
   * @api public
   */
  Mask.PBM = function (array, callback) {
    Mask.bind(this)();
    this.data = null;
    var bytes = new Uint8Array(array);
    if (bytes.byteLength > 2) {
      if (bytes[0] === 'P'.charCodeAt(0)) {
        if (bytes[1] === '4'.charCodeAt(0)) {
          // This is a PBM binary file...
          return fromBinaryPBM(this, bytes, callback);
        } else if (bytes[1] == "1".charCodeAt(0)) {
          // This is a PBM ASCII file...
          return fromASCIIPBM(this, bytes, callback);
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
  Mask.PBM.prototype = new Mask();
  Mask.PBM.prototype.clone = function () {
    var other = this.__proto__.clone();
    other.data = this.data;
    return other;
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
  /* Create a `Mask` from an Uint8Array taken semantically as an ASCII PBM image.
   *
   * @param {Uint8Buffer} bytes PBM image data.
   * @param {MaskCallback} callback
   * @api private
   */
  fromASCIIPBM = function (m, bytes, callback) {
    var bits = [];
    var state = {index: 2};
    // Skip the spaces and comments post-signature.
    skipPostSignature(bytes, state);
    var width = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    // Read numbers and stick them into 'height' until whitespace.
    var height = accumulateRegex(/\d/, bytes, state).join("");
    skipRegex(/\s/, bytes, state);
    // Initialize the mask.
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
  /* Create a `Mask` from an Uint8Array taken semantically as an binary
   * PBM image.
   *
   * @param {Uint8Buffer} bytes PBM image data.
   * @param {MaskCallback} callback
   * @api private
   */
  fromBinaryPBM = function (m, bytes, callback) {
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
    // Initialize the mask.
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
  /* Create a `Mask` from a PBM image at some URL.
   *
   * @param {String} url A URL pointing to a PBM image.
   * @param {MaskCallback} callback
   * @api public
   */
  Mask.PBM.url = function (url, callback) {
    var req = new XMLHttpRequest();
    req.responseType = "arraybuffer";
    req.onload = function (ev) {
      if (req.response) {
        return Mask.fromPBM(req.response, callback);
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
  /* Test whether two Masks collide.
   *
   * @param {Mask} a
   * @param {Mask} b
   * @api public
   */
  Mask.collision = function (a, b) {
    var intersect = intersection(a, b);
    for (var x = intersect.x; x < intersect.w; x++) {
      for (var y = intersect.y; y < intersect.h; y++) {
        if (a.collidesAt(x, y) &&
            b.collidesAt(x, y)) {
          return true
        }
      }
    }
    return false;
  };
  /*!*/
  Mask.Invert = function (other) {
    this.x = other.x;
    this.y = other.y;
    this.w = other.w;
    this.h = other.h;
    this.inversion = other;
  }
  Mask.Invert.prototype = new Mask();
  Mask.Invert.prototype.collidesAt = function (x, y) {
    return !this.inversion.collidesAt(x, y);
  }
  /* Create a vector box mask. */
  Mask.Box = function (x, y, h, w) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  Mask.Box.prototype = new Mask();
  Mask.Box.prototype.collidesAt = function (x, y) {
    return x >= this.x && y >= this.y &&
      x <= (this.x + this.w) && y <= (this.y + this.h);
  }
  /*!*/
  if (typeof module !== "undefined") {
    module.exports = { Mask: Mask };
  }
  return Mask;
})();
