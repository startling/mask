var mask = (function () {
  function Mask () {
    this.translation = {};
    this.translation.x = 0;
    this.translation.y = 0;
    this.width = {};
    this.width.x = 0;
    this.width.y = 0;
    this.data = null;
  };
  Mask.__proto__.translate = function (x, y) {
    this.translation.x += x;
    this.translation.y += y;
  };
  Mask.from_pbm = function (array, callback, err) {
    var bytes = new Uint8Array(array);
    if (bytes.byteLength > 2) {
      if (bytes[0] === 'P'.charCodeAt(0)) {
        if (bytes[1] === '4'.charCodeAt(0)) {
          /* This is a PBM binary file... */
          Mask.from_binary_pbm(bytes, callback);
          return undefined;
        } else if (bytes[1] == "1") {
          /* This is an ASCII binary file... */
          Mask.from_ascii_pbm(bytes, callback);
          return undefined;
        } else {
          /* Unknown signature. */
        };
      } else {
        /* Unknown signature. */
      };
    } else {
      /* File two short. */
    };
  };
  Mask.from_pbm_url = function (url, callback, err) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "arraybuffer";
    req.onload = function (ev) {
      if (req.response) {
        from_bm(req.response, callback, err);
      }
      else {
        /* No response. */
        err();
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
