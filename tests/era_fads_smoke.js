/* 시대의 유행·세상의 유행 점검 (js/systems/era.js · js/data/eratrade.js · js/systems/fad.js)
   · 시대 수요: 런던의 차·커피는 1500년엔 찾는 이가 없다가 1690년엔 값이 크게 오르고, 후추는 내린다. 유럽 밖 도시는 그대로
   · 1652년 5월: 「런던에 첫 커피하우스」 유럽 시장 소식
   · 발견의 유행: 교역품 발견 「육두구」를 북유럽 후원자에게 보고하면 북유럽에서 육두구가 유행 (값 2배)
   · 저절로 이는 유행이 한 해에 알맞은 만큼 (번짐 포함), 제독이 만든 유행(3배)과 따로 셈
   · 수첩 교역 칸에 「유럽 시장의 시대 수요」, 콘솔 오류 0. 스크린샷 OUT/era_info.png
   node tests/era_fads_smoke.js  (playwright) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'era_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Era && G.ERA_DEMAND, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    const r = await page.evaluate(() => {
      var s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(function (_, i) { return i === 1 ? 3 : 0; }), diff: 'normal' });
      var lon = G.CITY_DATA.filter(function (c) { return c.name === '런던'; })[0], cal = G.CITY_DATA.filter(function (c) { return c.name === '캘리컷'; })[0];
      function at(y) { s.date = { y: y, m: 1, d: 1 }; }
      var o = {};
      at(1500); o.tea1500 = G.Era.mult(lon, 'tea'); o.coffee1500 = G.Era.mult(lon, 'coffee'); o.pep1500 = G.Era.mult(lon, 'pepper'); o.p1500 = G.R.sellPrice(lon, 'tea');
      at(1690); o.tea1690 = G.Era.mult(lon, 'tea'); o.coffee1690 = G.Era.mult(lon, 'coffee'); o.pep1690 = G.Era.mult(lon, 'pepper'); o.p1690 = G.R.sellPrice(lon, 'tea'); o.cal = G.Era.mult(cal, 'tea');
      // 소식
      G.BALANCE.era.worldPerYear = 0; s.era = null; s.fad = null; s.date = { y: 1652, m: 4, d: 29 };
      var news = G.Game.passDays(4).filter(function (m) { return /커피하우스/.test(m.text) && m.history; });
      o.news = news.length;
      // 발견의 유행: 북유럽 후원자에게 「중국」 발견을 보고했다
      var sp = (G.SPONSORS || []).filter(function (x) { return G.CITY_DATA[x.city] && G.CITY_DATA[x.city].region === 1; })[0];
      G.BALANCE.era.discChance = 1;
      s.disc.t_nutmeg = { me: true, found: 16520501, reported: sp.id };   // 교역품 발견 「육두구」 (경쟁자가 발표하지 않는 발견)
      var msgs = G.Game.passDays(1).filter(function (m) { return /세상의 유행/.test(m.text); });
      o.disc = msgs.map(function (m) { return m.text; });
      o.discFads = G.Fad.list().map(function (x) { return x.where + ':' + x.g + ':' + x.m + ':' + x.src; });
      o.fadLon = !!G.Fad.at(lon, 'nutmeg') && G.Fad.mult(lon, 'nutmeg') === 2;
      // 저절로 이는 유행: 20년
      G.BALANCE.era.worldPerYear = 2.5; s.fad = null;
      var n = 0, sp2 = 0;
      for (var i = 0; i < 365 * 20; i++, s.day++) G.Era.daily().forEach(function (m) { if (/【세상의 유행】/.test(m.text)) n++; if (/번졌다/.test(m.text)) sp2++; });
      o.world = n; o.spread = sp2;
      o.fadMult = G.Fad.list().every(function (x) { return x.m < 3; });
      return o;
    });
    ok(r.tea1500 < 0.7 && r.coffee1500 < 0.7, '1500년 런던: 차·커피를 찾는 이가 거의 없다 (×' + r.tea1500.toFixed(2) + ' · ×' + r.coffee1500.toFixed(2) + ')');
    ok(r.tea1690 > 1.4 && r.coffee1690 > 1.4, '1690년 런던: 차·커피 열풍 (×' + r.tea1690.toFixed(2) + ' · ×' + r.coffee1690.toFixed(2) + ')');
    ok(r.pep1690 < r.pep1500, '후추는 흔해져 내린다 (×' + r.pep1500.toFixed(2) + ' → ×' + r.pep1690.toFixed(2) + ')');
    ok(r.p1690 > r.p1500 * 2, '런던의 차 파는 값 ' + r.p1500 + ' → ' + r.p1690);
    ok(r.cal === 1, '유럽 밖(캘리컷)은 시대 수요를 곱하지 않는다');
    ok(r.news === 1, '1652년 5월: 런던 첫 커피하우스 소식');
    ok(r.disc.length >= 1 && r.fadLon, '「육두구」 발견을 북유럽 후원자에게 보고 → 런던에서 육두구 값 2배: ' + r.discFads.join(', '));
    ok(r.world >= 20 && r.world <= 90 && r.spread > 0, '저절로 이는 유행: 20년에 ' + r.world + '번 (번짐 ' + r.spread + '번)');
    ok(r.fadMult, '세상의 유행은 제독의 유행(3배)보다 약하다');
    await page.evaluate(() => { var s = G.Game.state; s.date = { y: 1690, m: 5, d: 1 }; G.Info.open('trade'); });
    await page.waitForTimeout(800);
    ok(await page.$('.era-box .era-chip'), '수첩 교역: 유럽 시장의 시대 수요');
    await page.screenshot({ path: path.join(OUT, 'era_info.png') });
    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ' — ' + errors.join(' / ') : ''));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('실패:', e.message, errors); process.exitCode = 1; }
  await browser.close();
})();
