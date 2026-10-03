/* Generic helpers: RNG, math, formatting, Korean josa, dates. */
(function (G) {
  'use strict';
  var U = {};
  G.U = U;

  // ---------------------------------------------------------------- RNG (mulberry32)
  U.makeRng = function (seed) {
    var a = seed >>> 0;
    var f = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.state = function () { return a; };
    f.setState = function (s) { a = s | 0; };
    return f;
  };
  U.rng = U.makeRng((Date.now() ^ 0x5bd1e995) >>> 0);
  U.rand = function () { return U.rng(); };
  U.ri = function (a, b) { return a + Math.floor(U.rng() * (b - a + 1)); };  // inclusive
  U.rf = function (a, b) { return a + U.rng() * (b - a); };
  U.chance = function (p) { return U.rng() < p; };
  U.pick = function (arr) { return arr[Math.floor(U.rng() * arr.length)]; };
  U.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(U.rng() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  };
  U.weighted = function (items, wfn) {
    var tot = 0, i; for (i = 0; i < items.length; i++) tot += Math.max(0, wfn(items[i]));
    var r = U.rng() * tot;
    for (i = 0; i < items.length; i++) { r -= Math.max(0, wfn(items[i])); if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };
  /** stable hash of a string -> 32bit */
  U.strHash = function (s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  // ---------------------------------------------------------------- math
  U.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.smooth = function (a, b, x) { var t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  U.angDiff = function (a, b) { var d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  U.sum = function (arr, f) { var s = 0; for (var i = 0; i < arr.length; i++) s += f ? f(arr[i]) : arr[i]; return s; };

  // ---------------------------------------------------------------- formatting
  U.num = function (n) { n = Math.round(n); var s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); return n < 0 ? '-' + s : s; };
  U.gold = function (n) { return '금화 ' + U.num(n) + '닢'; };
  U.pct = function (v) { return Math.round(v * 100) + '%'; };
  U.esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // ---------------------------------------------------------------- Korean particles (josa)
  function hasBatchim(word) {
    if (!word) return false;
    var ch = word.charCodeAt(word.length - 1);
    if (ch >= 0xAC00 && ch <= 0xD7A3) return (ch - 0xAC00) % 28 !== 0;
    // digits / latin: approximate
    var c = word[word.length - 1];
    if (/[0-9]/.test(c)) return '013678'.indexOf(c) >= 0;
    if (/[lmnrLMNR]/.test(c)) return true;
    return false;
  }
  function rieulEnd(word) {
    var ch = word.charCodeAt(word.length - 1);
    return ch >= 0xAC00 && ch <= 0xD7A3 && (ch - 0xAC00) % 28 === 8;
  }
  /** U.j('리스본','을/를') -> '리스본을' */
  U.j = function (word, pair) {
    var p = pair.split('/');
    if (pair === '으로/로' || pair === '로/으로') {
      return word + ((hasBatchim(word) && !rieulEnd(word)) ? '으로' : '로');
    }
    return word + (hasBatchim(word) ? p[0] : p[1]);
  };
  /** particle only, judged by the last hangul/latin/digit char of the text (ignores closing quotes) */
  U.jx = function (text, pair) {
    var t = String(text).replace(/[^가-힣A-Za-z0-9]+$/, '');
    return U.j(t, pair).slice(t.length);
  };
  U.eul = function (w) { return U.j(w, '을/를'); };
  U.wa = function (w) { return U.j(w, '과/와'); };
  U.ro = function (w) { return U.j(w, '으로/로'); };
  U.a = function (w) { return U.j(w, '아/야'); };

  // ---------------------------------------------------------------- calendar
  var MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  U.daysInMonth = function (y, m) { return (m === 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) ? 29 : MDAYS[m - 1]; };
  /** date object {y,m,d} add days (mutates copy) */
  U.addDays = function (date, n) {
    var y = date.y, m = date.m, d = date.d + n;
    while (d > U.daysInMonth(y, m)) { d -= U.daysInMonth(y, m); m++; if (m > 12) { m = 1; y++; } }
    while (d < 1) { m--; if (m < 1) { m = 12; y--; } d += U.daysInMonth(y, m); }
    return { y: y, m: m, d: d };
  };
  U.dateNum = function (dt) { return dt.y * 10000 + dt.m * 100 + dt.d; };
  U.dayIndex = function (dt) { // days since 1400-01-01
    var n = 0, y;
    for (y = 1400; y < dt.y; y++) n += ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365;
    for (var m = 1; m < dt.m; m++) n += U.daysInMonth(dt.y, m);
    return n + dt.d - 1;
  };
  U.dayOfYear = function (dt) { var n = 0; for (var m = 1; m < dt.m; m++) n += U.daysInMonth(dt.y, m); return n + dt.d; };
  U.fmtDate = function (dt) { return dt.y + '년 ' + dt.m + '월 ' + dt.d + '일'; };
  U.monthsBetween = function (a, b) { return (b.y - a.y) * 12 + (b.m - a.m) + (b.d - a.d) / 30; };

  // ---------------------------------------------------------------- coordinates
  U.fmtLat = function (lat) { return (lat >= 0 ? '북위 ' : '남위 ') + Math.abs(lat).toFixed(1) + '°'; };
  U.fmtLon = function (lon) { return (lon >= 0 ? '동경 ' : '서경 ') + Math.abs(lon).toFixed(1) + '°'; };
  var DIR8 = ['동', '북동', '북', '북서', '서', '남서', '남', '남동'];
  U.dirName = function (ang) { // radians, 0 = east, ccw
    var i = Math.round(((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI / 4)) % 8;
    return DIR8[i];
  };

  // ---------------------------------------------------------------- misc
  U.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  U.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  U.el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
})(window.G = window.G || {});
