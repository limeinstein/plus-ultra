/* 조류 33종: 현장·도시·바다, 2년 경계, 저장 호환, 무리 시트의 실제 Chromium 재생. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'artifacts/birds-20261029'); fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      const raf = window.requestAnimationFrame.bind(window); window.__frames = true;
      window.requestAnimationFrame = cb => raf(t => { if (window.__frames) cb(t); });
    });
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Birds && G.Game.sceneName === 'title' && !(G.Loader && G.Loader.shown()), null, { timeout: 120000 });
    await page.waitForFunction(() => getComputedStyle(document.getElementById('boot-loader')).display === 'none');
    const report = await page.evaluate(async () => {
      const checks = []; const ok = (v, message) => { if (!v) throw Error(message); checks.push(message); };
      G.State.newGame({ name: '새 관찰 제독', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 },
        st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      await G.Game.ensureGeo(); window.__frames = false;
      let s = G.Game.state; s.settings.res = 0.35;
      G.UI.toast = function () {}; G.UI.say = async function () {};
      const d = G.DISC.flamingo;
      s.date = { y: 1500, m: 6, d: 12 }; s.loc = { mode: 'land', lon: d.lon, lat: d.lat };
      s.disc[d.id] = { me: true, found: 15000612 }; G.Birds.record(d, 751);
      const first = s.player.fame, stats = s.stats.found;
      const away = () => { s.loc.lon = d.lon + 3; G.Birds.check(); s.loc.lon = d.lon; };
      s.date = { y: 1502, m: 6, d: 11 }; away(); ok(!G.Birds.check().length, '2년 하루 전에는 보상 없음');
      s.date.d = 12; away(); const got = G.Birds.check();
      ok(got.length === 1 && got[0].fame === 75 && s.player.fame === first + 75, '2년째 되는 날 최초 명성의 10% 지급·반올림');
      ok(s.stats.found === stats && s.disc[d.id].found === 15000612, '발견 수·최초 발견 날짜 유지');
      ok(!G.Birds.check().length, '같은 자리에 있어도 중복 지급 없음');
      away(); ok(!G.Birds.check().length, '즉시 재진입해도 중복 지급 없음');
      G.Game.state = G.State.deserialize(G.State.serialize()); s = G.Game.state;
      ok(!G.Birds.check().length && s.disc[d.id].birdSeen === 15020612 && s.disc[d.id].birdFame === 751, '저장·불러오기 뒤 날짜·명성 기준 유지·중복 지급 없음');
      s.date.y = 1504; ok(!G.Birds.check().length, '현장에서 2년을 기다리기만 하면 지급하지 않음');
      away(); ok(G.Birds.check()[0].fame === 75, '다시 떠났다 돌아오면 다음 2년 주기 보상');
      ok(G.Birds.dueDate({ found: 15040229 }) === 15060228, '윤년 2월 29일의 2년 뒤는 2월 28일');
      const old = G.DISC.eagle; s.disc.eagle = { found: 15000101, me: true }; s.loc = { mode: 'land', lon: old.lon, lat: old.lat };
      ok(G.Birds.check().some(x => x.id === 'eagle'), '새 필드가 없는 옛 저장도 최초 발견일을 기준으로 관찰');
      const rival = G.DISC.falcon; s.disc.falcon = { found: 15000101, me: false, rival: '경쟁자' };
      s.loc = { mode: 'land', lon: rival.lon, lat: rival.lat };
      ok(!G.Birds.check().length, '경쟁자만 발견한 새는 보상하지 않음');
      const city = G.DISC.stork, cityId = city.city == null ? city.homeCity : city.city;
      s.disc.stork = { found: 15000101, me: true, birdFame: 1000, birdPlace: { mode: 'city', city: cityId, lon: city.lon, lat: city.lat } };
      s.loc = { mode: 'sea', city: cityId, lon: city.lon, lat: city.lat }; ok(!G.Birds.check().length, '도시에서 관찰한 기록은 도시 밖에서 지급하지 않음');
      s.loc.mode = 'city'; ok(G.Birds.check().some(x => x.id === 'stork' && x.fame === 100), '도시에서 관찰한 기록은 같은 도시 재방문 보상');
      const alb = G.DISC.albatross; s.loc = { mode: 'sea', lon: 10, lat: -46 }; s.date = { y: 1500, m: 1, d: 1 };
      s.disc.albatross = { found: 15000101, me: true }; G.Birds.record(alb, 600);
      s.date.y = 1502; s.loc.lon = alb.lon; s.loc.lat = alb.lat; ok(!G.Birds.check().length, '신천옹은 자료의 대표 좌표에서 보상하지 않음');
      s.loc.lon = 10; s.loc.lat = -46; ok(G.Birds.check().some(x => x.id === 'albatross'), '넓은 해역 조류의 실제 발견 위치 기억');
      const ids = Object.keys(G.Birds.kinds);
      ok(ids.length === 33 && ids.every(id => G.DISC[id] && G.Img.pick(['effects/birds/' + id])), '33종 전부 발견물·그림 목록에 등록');
      const birdNames = /새$|조$|펭귄|에뮤|올빼미|두루미|따오기|수리$|투칸|독수리|송골매|청둥오리|봉황|로크|신천옹|앵무|홍학|콘도르/;
      const missing = G.DISCOVERIES.filter(x => x.cat === 'creature' && birdNames.test(x.name) && !G.Birds.isBird(x));
      ok(!missing.length, '추가 지역 자료의 조류도 빠짐없이 포함: ' + missing.map(x => x.id).join(','));
      ok(['penguin', 'magellanpenguin', 'emperorpenguin'].every(id => G.Birds.kinds[id] === 'swim') && ['ostrich', 'kiwi', 'emu', 'roadrunner'].every(id => G.Birds.kinds[id] === 'run'), '펭귄 3종은 헤엄·타조·키위·에뮤·로드러너는 달리기');
      ['run', 'swim'].forEach(kind => {
        const p = G.Birds.groundPath({ lon: -9.2, lat: 38.7 }, kind, 0);
        ok(p.length > 1 && p.every(q => G.Geo.isLand(q[0], q[1]) === (kind === 'run')), kind + ': 해안 경로의 모든 점이 알맞은 땅·물 위');
      });
      const images = await Promise.all(ids.map(id => new Promise((resolve, reject) => {
        const img = new Image(); img.onload = () => resolve({ id, w: img.width, h: img.height }); img.onerror = () => reject(Error(id));
        img.src = 'images/effects/birds/' + id + '.webp';
      })));
      ok(images.every(x => x.w === 1024 && x.h === 512), 'file://에서 33개 8프레임 시트 실제 해독 성공');
      return { checks, ids };
    });
    // 실제 최초 발견 경로: 긴 대화·업적 창만 생략하고 발견 로직은 그대로 실행한다.
    await page.evaluate(async () => {
      const s = G.Game.state, d = G.DISC.budgie; s.date = { y: 1500, m: 1, d: 1 };
      s.loc = { mode: 'land', lon: d.lon, lat: d.lat }; delete s.disc[d.id];
      G.Scenes.discoveryReveal = async () => {}; G.Scenes.discoveryCard = async () => {}; G.Scenes.discoveryVoices = async () => {};
      G.Banter = null; G.Names = null; G.Frontier = null; G.Achieve.afterFind = async () => {};
      const before = s.player.fame; await G.Disc.find(d, 'land');
      if (s.disc[d.id].birdFame !== s.player.fame - before || !s.disc[d.id].birdPlace) throw Error('최초 발견 연동');
    });
    // 실제 항해 화면에 무리가 겹쳐 보이는지 검사한다.
    await page.evaluate(async () => {
      G.Game.go('sea', { depart: 0 });
      G.Game.state = G.State.deserialize(G.State.serialize());
      const s = G.Game.state; s.settings.res = .35; G.Scenes.sea.runtime().paused = true;
      const d = G.DISC.flamingo; s.disc.flamingo.birdPlace = { mode: 'sea', lon: s.loc.lon, lat: s.loc.lat };
      G.Birds.show(d, s.disc.flamingo);
      G.Img.want('effects/birds/flamingo');
    });
    await page.waitForFunction(() => { G.Img.want('effects/birds/flamingo'); return G.Img.get('effects/birds/flamingo'); }, null, { polling: 100 });
    const drawn = await page.evaluate(() => {
      for (let i = 0; i < 4; i++) G.Scenes.sea.update(1 / 30);
      for (let i = 0; i < 70; i++) G.Birds.update(1 / 30);
      const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900;
      const ctx = cv.getContext('2d'), original = ctx.drawImage.bind(ctx); let n = 0;
      ctx.drawImage = function () { n++; return original(...arguments); };
      G.Birds.draw(ctx, () => [800, 450], 'sea'); return n;
    });
    assert.strictEqual(drawn, 8, '8마리를 서로 다른 프레임으로 그림');
    await page.screenshot({ path: path.join(out, 'flamingo-flock-sea.png') });
    await page.evaluate(async () => {
      G.Game.go('land', { from: 0 });
      const s = G.Game.state, d = G.DISC.kiwi;
      G.Scenes.land.runtime().paused = true;
      s.disc.kiwi = { found: G.U.dateNum(s.date), me: true }; G.Birds.record(d, 500); G.Birds.show(d, s.disc.kiwi);
    });
    await page.waitForFunction(() => { G.Img.want('effects/birds/kiwi'); return G.Img.get('effects/birds/kiwi'); }, null, { polling: 100 });
    await page.evaluate(() => { G.Scenes.land.update(1 / 30); for (let i = 0; i < 70; i++) G.Birds.update(1 / 30); });
    await page.screenshot({ path: path.join(out, 'kiwi-flock-land.png') });
    assert.deepStrictEqual(errors, []);
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ ...report, drawn, errors }, null, 2));
    console.log(`PASS: ${report.checks.length + 3} checks, ${report.ids.length} species, ${drawn} flock members, no console errors`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
