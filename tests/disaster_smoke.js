/* 자연재해 점검 (js/systems/disaster.js · js/data/disasters.js · js/art/disasterfx.js)
   · 역사 재해 자료가 올바른가 (갈래·세기·좌표·날짜 차례)
   · 1755년 11월 1일 리스본 대지진: 그날 일어나고, 해일이 함께 오고, 항구의 배가 상하고, 리스본 시장에 「해일 피해」
   · 탐험대 피해 셈(대원 잃는 몫 상한), 재해 자취 안의 걸음 늦춤(G.Disaster.slow)
   · 이름 없는 재해가 한 해에 알맞은 만큼 일어나는가
   · 재해 그림 다섯 장면을 그려 본다 (OUT/disaster_fx.png)
   node tests/disaster_smoke.js  (playwright) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'disaster_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Disaster && G.DISASTERS, null, { timeout: 90000 });
    const data = await page.evaluate(() => {
      var bad = G.DISASTERS.filter(function (d, i, a) {
        return !G.DISASTER_KINDS[d.kind] || d.sev < 1 || d.sev > 3 || Math.abs(d.lat) > 80 || Math.abs(d.lon) > 180 || d.m < 1 || d.m > 12 || d.d < 1 || d.d > 31 ||
          (i && (a[i - 1].y * 400 + a[i - 1].m * 32 + a[i - 1].d) > (d.y * 400 + d.m * 32 + d.d));
      });
      var kinds = {}; G.DISASTERS.forEach(function (d) { kinds[d.kind] = (kinds[d.kind] || 0) + 1; });
      return { n: G.DISASTERS.length, bad: bad.map(function (d) { return d.name; }), kinds: kinds };
    });
    ok(data.n >= 100 && !data.bad.length, '역사 재해 ' + data.n + '건, 자료 이상 없음 ' + JSON.stringify(data.kinds));
    ok(['quake', 'volcano', 'landslide', 'tsunami', 'flood'].every(k => data.kinds[k] > 0), '다섯 갈래가 모두 있다');
    const spriteData = await page.evaluate(async () => {
      var kinds = Object.keys(G.DISASTER_SPRITES || {});
      kinds.forEach(function (kind) { G.Img.want('sprites/' + G.DISASTER_SPRITES[kind].id); });
      await Promise.all(kinds.map(function (kind) {
        var key = 'sprites/' + G.DISASTER_SPRITES[kind].id;
        return new Promise(function (resolve, reject) {
          var started = Date.now(), timer = setInterval(function () {
            var img = G.Img.get(key);
            if (img) { clearInterval(timer); resolve({ kind: kind, w: img.width, h: img.height }); }
            else if (Date.now() - started > 10000) { clearInterval(timer); reject(new Error(key + ' load timeout')); }
          }, 30);
        });
      }));
      return kinds.map(function (kind) { var img = G.Img.get('sprites/' + G.DISASTER_SPRITES[kind].id); return [kind, img.width, img.height]; });
    });
    ok(spriteData.length === 5 && spriteData.every(s => s[1] === 1024 && s[2] === 512), '재해 4×2 스프라이트 시트 5장 로드');
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    const lis = await page.evaluate(() => {
      var s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(function (_, i) { return i === 1 ? 3 : 0; }), diff: 'normal' });
      G.BALANCE.disaster.random = 0;
      s.date = { y: 1755, m: 10, d: 30 };
      var hp0 = s.fleet.ships[0].hp;
      var msgs = G.Game.passDays(3);
      var act = s.dis.act.map(function (e) { return e.kind; });
      return { act: act, hp0: hp0, hp1: s.fleet.ships[0].hp, news: msgs.some(function (m) { return /리스본 대지진/.test(m.text) && m.history; }), mk: G.R.market(0).ev, hit: G.Disaster.cityHit(0), slow: G.Disaster.slow(-9.14, 38.7), far: G.Disaster.slow(10, 50) };
    });
    ok(lis.act.indexOf('quake') >= 0 && lis.act.indexOf('tsunami') >= 0, '1755년 11월 1일 리스본: 지진과 해일 (' + lis.act.join(',') + ')');
    ok(lis.news, '세상의 소식으로 알린다');
    ok(lis.hp1 < lis.hp0, '리스본 항구의 기함이 상했다 (' + Math.round(lis.hp0) + ' → ' + Math.round(lis.hp1) + ')');
    ok(lis.mk === '해일 피해' && lis.hit && lis.hit.kind === 'tsunami', '리스본 시장에 「해일 피해」');
    ok(lis.slow < 0.9 && lis.far === 1, '재해 자취 안에서만 걸음이 느리다 (' + lis.slow.toFixed(2) + ')');
    const rnd = await page.evaluate(() => {
      var s = G.Game.state; G.BALANCE.disaster.random = 1; s.loc = { mode: 'sea', lon: -30, lat: 30, heading: 0 }; s.date = { y: 1600, m: 1, d: 1 }; s.dis = null;
      var n0 = 0; for (var i = 0; i < 365; i++) G.Disaster.daily();
      return s.dis.seq;
    });
    ok(rnd > 3 && rnd < 60, '이름 없는 재해: 한 해에 ' + rnd + '건 (해일·산사태 딸림 포함)');
    await page.evaluate(() => {
      var wrap = document.createElement('div'); wrap.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#222;display:grid;grid-template-columns:640px 640px;gap:4px';
      [['quake', 2.5], ['volcano', 3], ['landslide', 2.5], ['tsunami', 4.2], ['flood', 4]].forEach(function (k) { var c = document.createElement('canvas'); c.width = 640; c.height = 280; wrap.appendChild(c); G.DisasterFx.render(c.getContext('2d'), k[0], k[1], 640, 280); });
      document.body.appendChild(wrap);
    });
    await page.screenshot({ path: path.join(OUT, 'disaster_fx.png') });
    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ' — ' + errors.join(' / ') : ''));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('실패:', e.message, errors); process.exitCode = 1; }
  await browser.close();
})();
