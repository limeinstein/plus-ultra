/* 나비·나방 17종의 무작위 30~60마리·개별 등장/퇴장·조류와 공통 2년 반복 보상. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/butterflies-20261031');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { const raf = requestAnimationFrame.bind(window); window.__frames = true; window.requestAnimationFrame = cb => raf(t => { if (window.__frames) cb(t); }); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Birds && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending && !G.Loader.shown(), null, { timeout: 120000 });
    const report = await page.evaluate(async () => {
      const checks = [], ok = (v, m) => { if (!v) throw Error(m); checks.push(m); };
      G.State.newGame({ name: '나비 관찰자', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 },
        st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      await G.Game.ensureGeo(); window.__frames = false;
      let s = G.Game.state; s.settings.res = .35;
      G.UI.toast = () => {}; G.UI.say = async () => {};
      const ids = Object.keys(G.Birds.butterflies);
      const expected = G.INSECTS.filter(id => /나비|나방|부탄글로리/.test(G.DISC[id].name));
      ok(ids.length === 17 && expected.length === 17 && expected.every(id => G.Birds.isButterfly(G.DISC[id])), '나비·나방 17종 모두 포함');
      ok(!G.Birds.isObservable(G.DISC.hercules) && !G.Birds.isObservable(G.DISC.fireflyriver), '딱정벌레·반딧불이는 나비로 처리하지 않음');
      const sheets = await Promise.all(ids.map(id => G.Img.load('effects/butterflies/' + id)));
      ok(sheets.every(im => im && im.width === 1024 && im.height === 512), '17종의 8프레임 비행 시트 실제 해독');
      const d = G.DISC.morpho, bird = G.DISC.flamingo;
      ok(G.Birds.count(d, () => 0) === 30 && G.Birds.count(d, () => .999999) === 60, '개체 수 양 끝 30·60 포함');
      const random = Math.random; let counts;
      try {
        Math.random = G.U.makeRng(20261031);
        counts = Array.from({ length: 30 }, () => G.Birds.show(d, { found: 15000101 }).members.length);
      } finally { Math.random = random; }
      ok(counts.every(n => n >= 30 && n <= 60) && new Set(counts).size > 10, '무리마다 개체 수를 무작위로 새로 결정');
      ok(G.FX.butterflies.size * Math.max(...G.FX.butterflies.scale) < G.FX.birds.size * .6 * .75, '가장 작은 조류보다 작은 나비 개체');
      // 실제 발견 위치는 자료의 대표 좌표와 구별한다.
      s.date = { y: 1500, m: 6, d: 12 }; const origin = { lon: d.lon + 1.1, lat: d.lat + .1 };
      s.loc = { mode: 'land', lon: origin.lon, lat: origin.lat };
      for (const species of [d, bird]) { s.disc[species.id] = { me: true, found: 15000612 }; G.Birds.record(species, 753); }
      ok(s.disc.morpho.butterflyFame === 753 && s.disc.morpho.butterflyPlace.lon === origin.lon, '최초 명성·실제 발견 위치 기록');
      const initial = s.player.fame, found = s.stats.found;
      const leave = () => { s.loc.lon = origin.lon + 3; G.Birds.check(); s.loc.lon = origin.lon; };
      s.date = { y: 1502, m: 6, d: 11 }; leave(); ok(!G.Birds.check().length, '2년 하루 전 보상 없음');
      for (let year = 1502; year <= 1508; year += 2) {
        s.date = { y: year, m: 6, d: 12 }; leave(); const got = G.Birds.check();
        ok(got.length === 2 && got.every(x => x.fame === 75), year + ': 조류와 나비 모두 최초 명성 10% 반복 지급');
        ok(!G.Birds.check().length, year + ': 같은 자리 중복 지급 방지');
        leave(); ok(!G.Birds.check().length, year + ': 즉시 재진입 중복 지급 방지');
        G.Game.state = G.State.deserialize(G.State.serialize()); s = G.Game.state;
        ok(s.disc.morpho.butterflySeen === year * 10000 + 612 && s.disc.morpho.butterflyFame === 753 && !G.Birds.check().length, year + ': 저장 뒤 기준 명성·마지막 관찰일 보존');
      }
      ok(s.player.fame === initial + 2 * 4 * 75 && s.stats.found === found && s.disc.morpho.found === 15000612, '네 주기 누적 보상·발견 수·최초 날짜 보존');
      s.date.y = 1510; ok(!G.Birds.check().length, '현장에서 2년 기다리는 것만으로 지급하지 않음');
      s.loc.lon = origin.lon + 3; G.Birds.check(); s.loc.lon = d.lon; s.loc.lat = d.lat;
      ok(!G.Birds.check().length, '대표 좌표가 아닌 실제 발견 위치로 돌아와야 함');
      s.loc.lon = origin.lon; s.loc.lat = origin.lat; ok(G.Birds.check().length === 2, '실제 발견 위치 재방문 보상');
      ok(G.Birds.dueDate({ found: 15040229, butterflySeen: 15040229 }) === 15060228, '윤일 관찰의 다음 주기는 2월 28일');
      const old = G.DISC.swallowtail; s.disc.swallowtail = { me: true, found: 15000101 }; s.loc = { mode: 'land', lon: old.lon, lat: old.lat };
      ok(G.Birds.check().some(x => x.id === old.id && x.fame === G.Birds.reward(old, s.disc[old.id])), '옛 저장 나비도 최초 발견일로 재관찰');
      const rival = G.DISC.glasswing; s.disc.glasswing = { me: false, found: 15000101, rival: '경쟁자' }; s.loc = { mode: 'land', lon: rival.lon, lat: rival.lat };
      ok(!G.Birds.check().length, '경쟁자만 발견한 나비는 재관찰 보상 없음');
      // 최초 발견 함수 자체를 실행하되 대화·업적 창은 생략한다.
      G.Scenes.discoveryReveal = async () => {}; G.Scenes.discoveryCard = async () => {}; G.Scenes.discoveryVoices = async () => {};
      G.Banter = null; G.Names = null; G.Frontier = null; G.Achieve.afterFind = async () => {};
      s.date = { y: 1500, m: 1, d: 1 }; const first = G.DISC.peacockbf; delete s.disc[first.id];
      s.loc = { mode: 'land', lon: first.lon, lat: first.lat }; const before = s.player.fame;
      await G.Disc.find(first, 'land');
      ok(s.disc[first.id].butterflyFame === s.player.fame - before && s.disc[first.id].butterflySeen === 15000101, '실제 최초 발견 경로와 명성·관찰 기록 연결');
      G.Game.go('land', { from: 0 }); G.Scenes.land.runtime().paused = true;
      G.Game.state = G.State.deserialize(G.State.serialize()); s = G.Game.state;
      const st = { found: 15000101, butterflyPlace: { mode: 'land', lon: s.loc.lon, lat: s.loc.lat } };
      window.__butterflyFlock = G.Birds.show(d, st); const f = window.__butterflyFlock;
      const ctx = document.createElement('canvas').getContext('2d'); let draws = [];
      ctx.drawImage = (...args) => draws.push({ x: ctx.getTransform().e, y: ctx.getTransform().f, width: args[7], alpha: ctx.globalAlpha });
      const sample = t => { f.t = t; draws = []; G.Birds.draw(ctx, () => [800, 450], 'land'); return draws.slice(); };
      const a = sample(.3), b = sample(3), c = sample(10), end = sample(f.limit + 1);
      ok(a.length < b.length && b.length === f.members.length && c.length < b.length && end.length === 0, '개체별 무작위 등장·유지·퇴장·완전 소멸');
      ok(new Set(f.members.map(x => x.delay)).size === f.members.length && new Set(f.members.map(x => x.life)).size === f.members.length, '등장 지연·수명은 개체마다 다름');
      ok(b.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.width > 0 && p.width < 36 && p.alpha > 0), '모든 나비의 작은 크기·유효한 비행 좌표');
      ok(new Set(b.map(p => p.x.toFixed(1) + ':' + p.y.toFixed(1))).size === b.length, '무리가 한 좌표에 겹치지 않고 흩날림');
      f.t = 3; for (let i = 0; i < 4; i++) G.Scenes.land.update(1 / 30); G.Birds.update(0);
      return { checks, ids, counts, samples: { start: a.length, full: b.length, late: c.length, end: end.length } };
    });
    await page.screenshot({ path: path.join(OUT, 'morpho-swarm-land.png') });
    assert.deepStrictEqual(errors, [], '브라우저 오류 0');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ ...report, errors }, null, 2));
    console.log(`PASS: ${report.checks.length} checks, ${report.ids.length} species, random swarms 30–60, four recurring reward cycles, no browser errors`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
