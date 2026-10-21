#!/usr/bin/env node
/* 베타 센터의 실시간 항해 지도. 게임의 실제 4096×2048 육지·강 자료를
   같은 정거형도법으로 줄여, 표식 경·위도와 해안선이 정확히 겹치게 굽는다. */
'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

global.window = global;
require('../js/core/inflate.js');
require('../js/data/world_data.js');

var D = global.G.WORLD_DATA;
var landBits = global.G.unpackB64(D.land, D.W * D.H / 8);
var riverBits = global.G.unpackB64(D.river, D.W * D.H / 8);
var climate = global.G.unpackB64(D.climate, D.CW * D.CH * 4);
var W = 1600, H = 800, rgba = Buffer.alloc(W * H * 4);

function bit(bits, x, y) {
  x = (x % D.W + D.W) % D.W;
  y = Math.max(0, Math.min(D.H - 1, y));
  var i = y * D.W + x;
  return (bits[i >> 3] >> (i & 7)) & 1;
}

function srcX(x) { return Math.min(D.W - 1, Math.floor((x + 0.5) * D.W / W)); }
function srcY(y) { return Math.min(D.H - 1, Math.floor((y + 0.5) * D.H / H)); }
function landAt(x, y) { return bit(landBits, srcX(x), srcY(y)); }
function riverAt(x, y) { return bit(riverBits, srcX(x), srcY(y)); }
function elevationAt(x, y) {
  var cx = Math.min(D.CW - 1, Math.floor((x + 0.5) * D.CW / W));
  var cy = Math.min(D.CH - 1, Math.floor((y + 0.5) * D.CH / H));
  return climate[(cy * D.CW + cx) * 4 + 2] / 255;
}
function hash(x, y) {
  var n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function noise(x, y, cell) {
  var gx = x / cell, gy = y / cell, ix = Math.floor(gx), iy = Math.floor(gy);
  var tx = gx - ix, ty = gy - iy;
  tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
  var a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
}
function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
function set(x, y, r, g, b, a) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  var i = (y * W + x) * 4;
  if (a == null || a >= 1) { rgba[i] = clamp(r); rgba[i + 1] = clamp(g); rgba[i + 2] = clamp(b); rgba[i + 3] = 255; return; }
  rgba[i] = clamp(rgba[i] * (1 - a) + r * a);
  rgba[i + 1] = clamp(rgba[i + 1] * (1 - a) + g * a);
  rgba[i + 2] = clamp(rgba[i + 2] * (1 - a) + b * a);
  rgba[i + 3] = 255;
}
function line(x0, y0, x1, y1, col, alpha, dash) {
  var dx = x1 - x0, dy = y1 - y0, n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)));
  for (var i = 0; i <= n; i++) {
    if (dash && Math.floor(i / dash) % 2) continue;
    var x = Math.round(x0 + dx * i / n), y = Math.round(y0 + dy * i / n);
    set(x, y, col[0], col[1], col[2], alpha);
  }
}
function polygon(points, col, alpha) {
  var minY = H, maxY = 0;
  points.forEach(function (p) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
  for (var y = Math.max(0, Math.floor(minY)); y <= Math.min(H - 1, Math.ceil(maxY)); y++) {
    var xs = [];
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
      var a = points[i], b = points[j];
      if ((a[1] > y) !== (b[1] > y)) xs.push((b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]);
    }
    xs.sort(function (a, b) { return a - b; });
    for (var k = 0; k + 1 < xs.length; k += 2) for (var x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) set(x, y, col[0], col[1], col[2], alpha);
  }
}

/* 바다와 육지: 포털의 청록·금빛을 유지하되 낡은 해도 종이처럼 결을 준다. */
for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
  var land = landAt(x, y), n = noise(x, y, 46) * 2 - 1, fine = noise(x + 311, y - 97, 13) * 2 - 1;
  var edge = Math.min(x, y, W - 1 - x, H - 1 - y), vig = Math.max(0, 1 - edge / 110);
  if (land) {
    var e = elevationAt(x, y), relief = (e - 0.42) * 38;
    set(x, y, 142 + n * 13 + fine * 4 + relief, 129 + n * 10 + fine * 3 + relief * .65, 82 + n * 8 + fine * 2 + relief * .25 - vig * 24, 1);
  } else {
    var wave = Math.sin(x * .033 + Math.sin(y * .021) * 2.3) * 2.2;
    set(x, y, 25 + n * 5 + fine * 2 - vig * 8, 57 + n * 8 + fine * 2 - vig * 14, 62 + n * 9 + wave - vig * 13, 1);
  }
}

/* 위·경도선과 오래된 항해도의 방위선. */
for (var lon = -150; lon <= 150; lon += 30) {
  var gx = Math.round((lon + 180) / 360 * W);
  line(gx, 8, gx, H - 9, [219, 184, 112], lon === 0 ? .22 : .12, 5);
}
for (var lat = -60; lat <= 60; lat += 30) {
  var gy = Math.round((90 - lat) / 180 * H);
  line(8, gy, W - 9, gy, [219, 184, 112], lat === 0 ? .22 : .12, 5);
}
[[330, 370], [1045, 350], [1270, 585]].forEach(function (c, ci) {
  for (var a = 0; a < 360; a += 22.5) {
    var r = Math.PI * a / 180, reach = 950;
    line(c[0], c[1], c[0] + Math.cos(r) * reach, c[1] + Math.sin(r) * reach, [212, 170, 95], ci === 2 ? .09 : .065, 7);
  }
});

/* 해안선과 강. 육지 마스크와 같은 픽셀에서 따므로 표식과 어긋나지 않는다. */
for (y = 1; y < H - 1; y++) for (x = 0; x < W; x++) {
  var here = landAt(x, y), other = landAt(x - 1, y) !== here || landAt(x + 1, y) !== here || landAt(x, y - 1) !== here || landAt(x, y + 1) !== here;
  if (other) set(x, y, here ? 66 : 210, here ? 51 : 167, here ? 33 : 88, here ? .9 : .72);
  else if (here && riverAt(x, y)) set(x, y, 41, 79, 78, .78);
}

/* 남태평양의 나침반 장미. 실제 지형을 가리지 않도록 작고 낮은 대비로 둔다. */
var cx = 176, cy = 620, rr = 58;
for (var ring = rr; ring >= rr - 3; ring--) for (var deg = 0; deg < 360; deg++) {
  var rad = deg * Math.PI / 180;
  set(Math.round(cx + Math.cos(rad) * ring), Math.round(cy + Math.sin(rad) * ring), 224, 184, 103, .68);
}
for (var a = 0; a < 8; a++) {
  var rad = a * Math.PI / 4, long = a % 2 === 0 ? 52 : 36, side = a % 2 === 0 ? 11 : 7;
  polygon([[cx + Math.cos(rad) * long, cy + Math.sin(rad) * long], [cx + Math.cos(rad + Math.PI / 2) * side, cy + Math.sin(rad + Math.PI / 2) * side], [cx - Math.cos(rad) * 9, cy - Math.sin(rad) * 9], [cx + Math.cos(rad - Math.PI / 2) * side, cy + Math.sin(rad - Math.PI / 2) * side]], a % 2 ? [192, 143, 73] : [229, 196, 128], .72);
}

/* 액자처럼 두른 이중 테두리. */
for (var q = 0; q < 4; q++) {
  var inset = 4 + q * 3, alpha = q === 0 ? .86 : .42;
  line(inset, inset, W - 1 - inset, inset, [224, 184, 103], alpha);
  line(inset, H - 1 - inset, W - 1 - inset, H - 1 - inset, [224, 184, 103], alpha);
  line(inset, inset, inset, H - 1 - inset, [224, 184, 103], alpha);
  line(W - 1 - inset, inset, W - 1 - inset, H - 1 - inset, [224, 184, 103], alpha);
}

function crc32(buf) {
  var c = 0xffffffff;
  for (var i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (var k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  var name = Buffer.from(type), out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0); name.copy(out, 4); data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return out;
}
var scan = Buffer.alloc((W * 4 + 1) * H);
for (y = 0; y < H; y++) { scan[y * (W * 4 + 1)] = 0; rgba.copy(scan, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
var ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
var png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(scan, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
var out = path.resolve(__dirname, '../web/beta-center/world-map-medieval.png');
fs.writeFileSync(out, png);
console.log(out + ' ' + W + 'x' + H + ' ' + png.length + ' bytes');
