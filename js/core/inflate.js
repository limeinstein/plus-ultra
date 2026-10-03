/* Minimal zlib/DEFLATE decoder (RFC 1950/1951). Synchronous; used to unpack embedded world data. */
(function (G) {
  'use strict';
  var LBASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
  var LEXT  = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  var DBASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
  var DEXT  = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  var CLORDER = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];

  function Huff(lengths, n) {
    var counts = new Uint16Array(16), offs = new Uint16Array(16), i;
    for (i = 0; i < n; i++) counts[lengths[i]]++;
    counts[0] = 0;
    for (i = 1; i < 16; i++) offs[i] = offs[i - 1] + counts[i - 1];
    var symbols = new Uint16Array(n);
    for (i = 0; i < n; i++) if (lengths[i]) symbols[offs[lengths[i]]++] = i;
    this.counts = counts; this.symbols = symbols;
  }

  function inflateRaw(src, pos, outSize) {
    var out = new Uint8Array(outSize || src.length * 8), op = 0;
    var bitbuf = 0, bitcnt = 0;
    function need(n) {
      while (bitcnt < n) {
        bitbuf |= (pos < src.length ? src[pos] : 0) << bitcnt; pos++; bitcnt += 8;
      }
    }
    function bits(n) {
      need(n); var v = bitbuf & ((1 << n) - 1); bitbuf >>>= n; bitcnt -= n; return v;
    }
    function ensure(extra) {
      if (op + extra <= out.length) return;
      var nb = new Uint8Array(Math.max(out.length * 2, op + extra)); nb.set(out); out = nb;
    }
    function decode(h) {
      var code = 0, first = 0, index = 0, len, count;
      for (len = 1; len < 16; len++) {
        code |= bits(1);
        count = h.counts[len];
        if (code - count < first) return h.symbols[index + (code - first)];
        index += count; first += count; first <<= 1; code <<= 1;
      }
      throw new Error('inflate: bad code');
    }
    var fixedL = null, fixedD = null;
    function fixed() {
      if (fixedL) return;
      var l = new Uint8Array(288), i;
      for (i = 0; i < 144; i++) l[i] = 8; for (; i < 256; i++) l[i] = 9; for (; i < 280; i++) l[i] = 7; for (; i < 288; i++) l[i] = 8;
      fixedL = new Huff(l, 288);
      var d = new Uint8Array(30); for (i = 0; i < 30; i++) d[i] = 5; fixedD = new Huff(d, 30);
    }
    function codes(lh, dh) {
      for (;;) {
        var sym = decode(lh);
        if (sym < 256) { ensure(1); out[op++] = sym; }
        else if (sym === 256) return;
        else {
          sym -= 257;
          var len = LBASE[sym] + bits(LEXT[sym]);
          var ds = decode(dh);
          var dist = DBASE[ds] + bits(DEXT[ds]);
          ensure(len);
          for (var k = 0; k < len; k++) { out[op] = out[op - dist]; op++; }
        }
      }
    }
    var last;
    do {
      last = bits(1);
      var type = bits(2);
      if (type === 0) {
        bitbuf = 0; bitcnt = 0;
        var len = src[pos] | (src[pos + 1] << 8); pos += 4;
        ensure(len); out.set(src.subarray(pos, pos + len), op); op += len; pos += len;
      } else if (type === 1) {
        fixed(); codes(fixedL, fixedD);
      } else if (type === 2) {
        var hlit = bits(5) + 257, hdist = bits(5) + 1, hclen = bits(4) + 4, i;
        var cl = new Uint8Array(19);
        for (i = 0; i < hclen; i++) cl[CLORDER[i]] = bits(3);
        var clh = new Huff(cl, 19);
        var lens = new Uint8Array(hlit + hdist);
        for (i = 0; i < hlit + hdist;) {
          var s = decode(clh);
          if (s < 16) lens[i++] = s;
          else {
            var rep = 0, val = 0;
            if (s === 16) { val = lens[i - 1]; rep = 3 + bits(2); }
            else if (s === 17) rep = 3 + bits(3);
            else rep = 11 + bits(7);
            while (rep--) lens[i++] = val;
          }
        }
        codes(new Huff(lens.subarray(0, hlit), hlit), new Huff(lens.subarray(hlit), hdist));
      } else throw new Error('inflate: bad block');
    } while (!last);
    return op === out.length ? out : out.subarray(0, op);
  }

  function b64ToBytes(b64) {
    if (typeof atob === 'function') {
      var s = atob(b64), n = s.length, a = new Uint8Array(n);
      for (var i = 0; i < n; i++) a[i] = s.charCodeAt(i);
      return a;
    }
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }

  G.unpackB64 = function (b64, outSize) { return inflateRaw(b64ToBytes(b64), 2, outSize); };
})(typeof window !== 'undefined' ? (window.G = window.G || {}) : (global.G = global.G || {}));
