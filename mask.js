/** This is `mask`, a tiny MIT-licensed library providing collision masks
 * and thus pixel-perfect collision detection in JavaScript. Collision
 * masks are read from [PBM][] files. Check the [github][] page for more
 * information.
 * [github]: https://github.com/startling/mask
 * [PBM]: http://netpbm.sourceforge.net/doc/pbm.html
 */
/*!*/
var Mask = (function () {
  /** Construct a `Mask`.
   *
   * Subclasses of `Mask` should implement, at the least, `collidesAt` and
   * `clone`. All subclasses are expected to have the properties `x`, `y`,
   * `w`, and `h` -- the coordinates, width, and height of a bounding box
   * around the `Mask`.
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
  /** Make a clone of a `Mask`.
   *
   * Examples:
   *
   *     someMask.clone()
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
  /** Translate this `Mask` in two dimensions.
   *
   * Examples:
   *
   *     someMask.translate(10, 10)
   *
   * @this {Mask}
   * @param {Number} x x-distance
   * @param {Number} y y-distance
   * @api public
   */
  Mask.prototype.translate = function (x, y) {
    this.x += x;
    this.y += y;
  };
  /** Make a copy of this `Mask` translated to the coordinates given.
   *
   * Examples:
   *
   *     someMask.at(10, 10)
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
  /** Mask a copy of this `Mask` translated in two dimensions.
   *
   * Examples:
   *
   *     someMask.translated(10, 10)
   *
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
  /** Test whether a Mask is completely contained within another.
   * Examples:
   *
   *     someMask.within(new Mask.Box(10, 10))
   *
   * @this {Mask}
   * @param {Mask} b The containing Mask.
   * @api public
   */
  Mask.prototype.within = function (b) {
    for (var x = this.x; x < this.w + this.x; x++) {
      for (var y = this.y; y < this.h + this.y; y++) {
        if (this.collidesAt(x, y) &&
            !b.collidesAt(x, y)) {
          return false;
        }
      }
    }
    return true;
  };
  /** Test whether this mask collides at the given location.
   *
   * Examples:
   *
   *     new Mask.Box(10, 10).collidesAt(5, 5)
   *
   * @this {Mask}
   * @param {Number} x x-coordinate
   * @param {Number} y y-coordinate
   * @return {Mask}
   * @api public
   */
  Mask.prototype.collidesAt = function (x, y) {
    return false;
  };
  /** Create an object representing the intersection of the bounding
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
  /** Test whether two Masks collide.
   *
   * Examples:
   *
   *     Mask.collide(new Mask.Box(5, 5), new Mask.Box(10, 10))
   *
   * @param {Mask} a
   * @param {Mask} b
   * @api public
   */
  Mask.collision = function (a, b) {
    var intersect = intersection(a, b);
    for (var x = intersect.x; x < intersect.x + intersect.w; x++) {
      for (var y = intersect.y; y < intersect.y + intersect.h; y++) {
        if (a.collidesAt(x, y) &&
            b.collidesAt(x, y)) {
          return true;
        }
      }
    }
    return false;
  };
  /** Some callbacks expect a `Mask`.
   * @callback MaskCallback
   * @param {Mask} the collision map
   * @api private
   */
  /**  A mask taken from a PBM image.
   *
   * Examples:
   *
   *     new Mask.PBM.load(arrayBuffer, callback);
   *
   * @constructor
   * @api public
   */
  Mask.PBM = function () {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.data = [];
  };
  Mask.PBM.prototype = new Mask();
  Mask.PBM.prototype.clone = function () {
    var other = new Mask.PBM();
    other.x = this.x;
    other.y = this.y;
    other.w = this.w;
    other.h = this.h;
    other.data = this.data;
    return other;
  };
  Mask.PBM.prototype.collidesAt = function (x, y) {
    return !!this.data[x - this.x] &&
      !!this.data[x - this.x][y - this.y];
  };
  /** Skip every byte matching a regular expression.
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
  /** Find all the leading characters matching a regular expression and
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
  /** Skip the parts that come after a PBM signature -- whitespace and any
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
  /** Create a `Mask` from an Uint8Array taken semantically as an ASCII PBM image.
   *
   * @param {Uint8Buffer} bytes PBM image data.
   * @param {MaskCallback} callback
   * @api private
   */
  fromASCIIPBM = function (m, bytes, callback) {
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
    m.data = []
    // Read 0 and 1 until the end of the file, skipping everything else.
    for (var y = 0; y < m.h; y++) {
      var row = [];
      for (var x = 0; x < m.w; x++) {
        if (state.index >= bytes.byteLength) {
          break;
        }
        while (state.index < bytes.byteLength) {
          var here = String.fromCharCode(bytes[state.index]);
          state.index += 1;
          if (here === '0') {
            row.push(false);
            break;
          } else if (here === '1') {
            row.push(true);
            break;
          };
        }
      }
      m.data.push(row);
    }
    return callback(m);
  };
  /** Create a `Mask` from an Uint8Array taken semantically as an binary
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
  /** Create a `Mask` from a PBM image at some URL.
   *
   * Examples:
   *
   *     Mask.PBM.url("http://example.com/mask.pbm", callback)
   *
   * @param {String} url A URL pointing to a PBM image.
   * @param {MaskCallback} callback
   * @api public
   */
  Mask.PBM.url = function (url, callback) {
    var req = new XMLHttpRequest();
    req.onload = function (ev) {
      if (req.response) {
        var m = new Mask.PBM();
        return m.load(req.response, callback);
      } else {
        // No response.
        return callback(null, new Error("No response."));
      }
    };
    req.onerror = function (e) {
      return callback(null, e);
    };
    req.open("GET", url, true);
    req.responseType = "arraybuffer";
    req.send();
  };
  /** Load an `ArrayBuffer` taken as a PBM image to a PBM mask.
   *
   * N.B. do not use the newly-initialized `Mask` directly until
   * the callback is called.
   *
   * Examples:
   *
   *     new Mask.PBM.load(arrayBuffer, callback);
   *
   * @param {ArrayBuffer} array image data
   * @param {MaskCallback} callback
   * @api public
   */
  Mask.PBM.prototype.load = function (array, callback) {
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
  /** Create a mask as an inversion of another.
   *
   * Examples:
   *
   *     new Mask.Invert(other)
   *
   * @constructor
   * @param {Mask} other the mask to invert.
   * @api public
   */
  Mask.Invert = function (other) {
    this.x = other.x;
    this.y = other.y;
    this.w = other.w;
    this.h = other.h;
    this.inversion = other;
  };
  Mask.Invert.prototype = new Mask();
  Mask.Invert.prototype.clone = function () {
    var other = new Mask.Invert(this.inversion);
    other.translate(this.x, this.y);
    return other;
  };
  Mask.Invert.prototype.collidesAt = function (x, y) {
    return !this.inversion.collidesAt(x, y);
  };
  /** Masks representing vector boxes.
   *
   * Examples:
   *
   *     new Mask.Box(10, 10)
   *
   * @constructor
   * @param {Number} w width
   * @param {Number} h height
   * @api public
   */
  Mask.Box = function (w, h) {
    this.x = 0;
    this.y = 0;
    this.w = w;
    this.h = h;
  };
  Mask.Box.prototype = new Mask();
  Mask.Box.prototype.clone = function () {
    var other = new Mask.Box(this.w, this.h);
    other.translate(this.x, this.y);
    return other;
  };
  Mask.Box.prototype.collidesAt = function (x, y) {
    return x >= this.x && y >= this.y &&
      x < (this.x + this.w) && y < (this.y + this.h);
  };
  /* Get a mask representing a bounding box of some other mask.
   *
   * Examples:
   *
   *     Mask.Box.bounding(someMask)
   *
   * @param {Mask} m
   * @return {Mask.Box}
   * @api public
   */
  Mask.Box.bounding = function (m) {
    return new Mask.Box(m.w, m.h).at(m.x, m.y);
  };
  /*!*/
  if (typeof module !== "undefined") {
    module.exports = Mask;
  }
  return Mask;
})();
