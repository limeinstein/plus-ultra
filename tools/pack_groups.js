/* tools/bundle.py가 아티팩트 그림 묶음을 「같이 쓰이는 것끼리」 나눌 때 쓰는 자료를 뽑는다.
   게임의 자료 파일(js/data/*.js)을 읽어 도시·후원자·여급·동료·발견물이 어디에 있는지 JSON으로 내보낸다.
   사용법: node tools/pack_groups.js  (WebGame 폴더에서) */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
var srcs = (html.match(/<script src="([^"]+)"><\/script>/g) || []).map(function (s) { return /src="([^"]+)"/.exec(s)[1]; })
  .filter(function (s) { return /^js\/(core\/util|data\/)/.test(s); });
var win = { G: {} };
var ctx = vm.createContext({ window: win, console: { log: function () {}, warn: function () {}, error: function () {} }, Math: Math, JSON: JSON, Date: Date, Object: Object, Array: Array, String: String, Number: Number, RegExp: RegExp, Error: Error, Promise: Promise, Map: Map, Set: Set, parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN, isFinite: isFinite, setTimeout: function () {}, document: undefined, navigator: { userAgent: '' } });
srcs.forEach(function (s) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, s), 'utf8'), ctx, { filename: s }); }
  catch (e) { process.stderr.write('pack_groups: ' + s + ' 건너뜀 (' + e.message + ')\n'); }
});
var G = win.G;
function cultureOf(c) {   // js/art/interior.js 의 cultureOf 와 같은 규칙
  var s = c.style;
  if (s === 'is' || s === 'pe' || s === 'sw' || (s === 'af' && c.rel === 'I')) return 'islam';
  if (s === 'cn' || s === 'kr' || s === 'jp') return 'eastasia';
  if (s === 'in' || s === 'se') return 'south';
  if (s === 'az' || s === 'an' || s === 'na' || s === 'tr' || s === 'af') return 'native';
  return 'europe';
}
var out = { cities: {}, sponsors: {}, maids: {}, mates: {}, discoveries: {} };
(G.CITY_DATA || []).forEach(function (c) { out.cities[c.id] = { region: c.region, style: c.style, culture: cultureOf(c), lat: c.lat, lon: c.lon }; });
(G.SPONSORS || []).forEach(function (s) { out.sponsors[s.id] = s.city; });
(G.MAIDS || []).forEach(function (m) { out.maids[m.id] = m.city; });
(G.MATES || []).forEach(function (m) { out.mates[m.id] = m.reg && m.reg.length ? m.reg[0] : -1; });
(G.DISCOVERIES || []).forEach(function (d) { out.discoveries[d.id] = d.city != null ? { city: d.city } : { lat: d.lat, lon: d.lon }; });
process.stdout.write(JSON.stringify(out));
