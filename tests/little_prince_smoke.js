/* 사막에서 만난 어린 왕자 — js/systems/littleprince.js (2026-10-24)
   · 명성 7만 미만이면 없다 · 사막에서 야영하며 정찰 → 남장한 어린 왕자 · 그냥 보내면 다음에 또 · 음식과 고기를 나눠 주면 캠프파이어
   · 「지도를 그려 줘」 — 숫자 지도는 퇴짜, 그림 지도는 좋아한다 → 동료 · 지도의 우물가(사막)에서 금화 10만 닢 */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOT_DIR || '';

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  async function shot(name) { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name), timeout: 150000 }); } }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.LittlePrince && !G.Scenes.title.bootPending, null, { timeout: 120000 });

    // 사막 곁의 도시에서 뭍으로
    const setup = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0;
      s.fleet.food = 500; s.fleet.water = 500;
      const desertOf = (c) => { for (let r = 0.3; r <= 1.5; r += 0.3) for (let a = 0; a < 6.28; a += 0.5) { const x = c.lon + Math.cos(a) * r, y = c.lat + Math.sin(a) * r; if (G.Geo.isLand(x, y) && G.Geo.terrain(x, y) === 'desert' && G.Geo.terrain(x + 0.6, y) === 'desert' && G.Geo.terrain(x - 0.6, y) === 'desert') return [x, y]; } return null; };
      let from = null, spot = null;
      for (const c of G.CITY_DATA) { if (!c || !c.port) continue; const d = desertOf(c); if (d) { from = c; spot = d; break; } }
      G.Game.go('land', { from: from.id, mount: { id: 'walk', n: 0 } }); await new Promise(r => setTimeout(r, 1500));
      s.loc.lon = spot[0]; s.loc.lat = spot[1];
      document.querySelectorAll('.modal-back').forEach(m => m.remove());
      window.__seen = []; window.__pics = []; window.__ans = { share: 'leave', draw: ['grown', 'child'] };
      G.UI.say = async (t, sp) => {
        window.__seen.push(((sp && sp.name) || '') + '|' + String(t).slice(0, 50));
        const img = document.querySelector('.famscene img'); if (img) window.__pics.push(img.getAttribute('src'));
      };
      G.UI.ask = async (t, opts) => {
        window.__seen.push('ASK ' + t.slice(0, 30));
        if (opts.some(o => o.value === 'scout')) return 'scout';
        if (opts.some(o => o.value === 'share')) return window.__ans.share;
        if (opts.some(o => o.value === 'child')) return window.__ans.draw.shift() || 'child';
        return opts[0].value;
      };
      G.UI.alert = async (t) => { window.__seen.push('ALERT ' + String(t).replace(/<[^>]+>/g, '').slice(0, 300)); };
      return { from: from.name, spot, terr: G.Geo.terrain(spot[0], spot[1]), scene: G.Game.sceneName,
        art: ['portraits/legendary/little_prince', 'portraits/legendary/little_prince_half',
          'legend-events/little_prince_meet', 'legend-events/little_prince_campfire',
          'legend-events/little_prince_map', 'legend-events/little_prince_well',
          'legend-events/little_prince_reveal'].map(key => [key, !!G.Img.file(key)]) };
    });

    // 명성 7만 미만: 없다
    const low = await page.evaluate(async () => {
      window.__seen = [];
      await G.Scenes.land.camp();
      return { seen: window.__seen.filter(x => /소년|별/.test(x)).length, phase: G.Game.state.lprince && G.Game.state.lprince.phase };
    });
    // 명성 7만 — 그냥 보낸다
    const leave = await page.evaluate(async () => {
      const s = G.Game.state; G.Fame.add('ex', 70000 - (s.player.fame || 0));
      window.__seen = [];
      await G.Scenes.land.camp();
      return { fame: s.player.fame, phase: s.lprince.phase, met: s.lprince.met, joined: s.mates.some(m => m.id === 'little_prince'), seen: window.__seen.slice() };
    });
    // 사막이 아닌 곳(초원 등)에서는 없다는 것도
    const notDesert = await page.evaluate(() => {
      const s = G.Game.state; let p = null;
      for (let x = -9; x < 30 && !p; x += 0.5) for (let y = 40; y < 55 && !p; y += 0.5) if (G.Geo.isLand(x, y) && G.Geo.terrain(x, y) !== 'desert') p = [x, y];
      return G.LittlePrince.isDesert(p[0], p[1]);
    });
    // 두 번째: 음식과 고기를 나눠 준다 → 캠프파이어 → 지도 → 동료
    const before = await page.evaluate(() => { window.__ans = { share: 'share', draw: ['grown', 'child'] }; window.__seen = []; const s = G.Game.state; window.__camp = G.Scenes.land.camp(); return { food: s.fleet.food, gold: s.player.gold, use: G.R.dailyUse() }; });
    await page.waitForSelector('.campfire canvas', { timeout: 20000 });
    await page.waitForTimeout(600);
    await shot('01_캠프파이어.png');
    await page.evaluate(() => { [...document.querySelectorAll('.win .foot button')].filter(b => /이야기를 듣는다/.test(b.textContent))[0].click(); });
    await page.waitForSelector('.tmap-cv', { timeout: 20000 });
    await page.waitForTimeout(300);
    await shot('02_어린왕자의_지도.png');
    const mapNote = await page.evaluate(() => document.querySelector('.tmap-note').textContent);
    await page.evaluate(() => { [...document.querySelectorAll('.win .foot button')].filter(b => /접는다/.test(b.textContent))[0].click(); });
    // 명성이 오르며 뜨는 「업적 달성」 창은 닫아 준다 (2026-10-29 — 창이 떠 있으면 야영이 끝나지 않는다)
    await page.evaluate(async () => { let done = false; window.__camp.then(() => { done = true; }); for (let i = 0; i < 200 && !done; i++) { [...document.querySelectorAll('.win .foot button')].filter(b => /^좋다$/.test(b.textContent.trim())).forEach(b => b.click()); await new Promise(r => setTimeout(r, 100)); } return window.__camp; });
    const met = await page.evaluate(() => {
      const s = G.Game.state, p = s.lprince, l = s.loc, m = G.MATE.little_prince;
      return { phase: p.phase, food: s.fleet.food, joined: s.mates.some(x => x.id === 'little_prince'),
        dist: G.Geo.dist(l.lon, l.lat, p.tlon, p.tlat), tDesert: G.Geo.terrain(p.tlon, p.tlat), seen: window.__seen.slice(),
        sk: m.sk, lg: m.lg, face: m.face, g: m.g, minor: m.minor, eventOnly: m.eventOnly, info: G.LittlePrince.html().replace(/<[^>]+>/g, ''),
        log: s.log.slice(-3).map(x => x.t) };
    });

    // 우물가: 가까우면 방향을 일러 주고, 서면 판다
    const dig = await page.evaluate(async () => {
      const s = G.Game.state, p = s.lprince, l = s.loc, g0 = s.player.gold;
      const toasts = []; const t0 = G.UI.toast; G.UI.toast = (t) => { toasts.push(t); };
      l.lon = p.tlon + 1.0; l.lat = p.tlat;
      const r1 = await G.LittlePrince.onLand(l.lon, l.lat, {});
      l.lon = p.tlon + 0.1; l.lat = p.tlat + 0.05; window.__seen = [];
      const r2 = await G.LittlePrince.onLand(l.lon, l.lat, {});
      G.UI.toast = t0;
      const r3 = await G.LittlePrince.onLand(l.lon, l.lat, {});
      return { desc: G.MATE.little_prince.desc.slice(0, 50), g: G.MATE.little_prince.g, revealed: !!p.revealed, r1, r2, r3, toasts, gain: s.player.gold - g0, phase: p.phase, seen: window.__seen.slice(), pics: window.__pics.slice(), info: G.LittlePrince.html(), log: s.log.slice(-3).map(x => x.t).join(' / ') };
    });
    // 저장/불러오기
    const rt = await page.evaluate(() => { const S2 = G.State.deserialize(G.State.serialize()); return { phase: S2.lprince.phase, mate: S2.mates.some(m => m.id === 'little_prince'), revealed: !!S2.lprince.revealed }; });

    assert.strictEqual(setup.terr, 'desert');
    assert(setup.art.every(x => x[1]), '어린 왕자의 얼굴·무릎상·이벤트샷 5장 등록: ' + JSON.stringify(setup.art));
    assert.strictEqual(low.seen, 0, '명성 7만 미만이면 만나지 않는다'); assert(!low.phase);
    assert(leave.fame >= 70000);
    assert.strictEqual(leave.phase, 'met'); assert.strictEqual(leave.met, 1); assert.strictEqual(leave.joined, false, '그냥 보내면 동료가 아니다');
    assert(leave.seen.some(x => /어른들은 늘 바쁘지/.test(x)));
    assert.strictEqual(notDesert, false);
    assert.strictEqual(met.phase, 'map'); assert.strictEqual(met.joined, true, '지도를 받고 동료가 된다');
    assert(before.food - met.food >= Math.round(before.use * 2) - 1 && before.food - met.food <= Math.round(before.use * 2) + Math.ceil(before.use * 3), '식량 2일분을 나눴다 (+야영 이틀치): ' + (before.food - met.food));
    assert(met.seen.some(x => /배가 고파/.test(x)) && met.seen.some(x => /지도를 그려 줘/.test(x)));
    assert(met.seen.some(x => /숫자뿐이잖아/.test(x)), '숫자만 적은 지도는 퇴짜');
    assert(!met.seen.some(x => /사실 나 여자야/.test(x)), '우물을 찾기 전에는 밝히지 않는다');
    assert(met.face === 'portraits/legendary/little_prince' && met.g === 'm', '새 인물화와 공개 전 소년 설정');
    assert(dig.seen.some(x => /사실 나 여자야/.test(x)) && dig.seen.some(x => /어린 왕자」라고 불러 줘/.test(x)), '마지막, 우물가에서 밝힌다');
    assert.strictEqual(dig.g, 'f', '밝힌 뒤에는 여성'); assert(/소녀/.test(dig.desc), dig.desc); assert(dig.revealed);
    assert(met.seen.some(x => /바로 이거야/.test(x)), '그림 지도는 좋아한다');
    assert(met.dist >= 2.4 && met.dist <= 6.2, '우물은 2.5~6° 떨어진 곳: ' + met.dist);
    assert.strictEqual(met.tDesert, 'desert', '우물은 사막에');
    assert.deepStrictEqual(met.sk, { survey: 3, nav: 3, sci: 3, ship: 3 });
    assert.deepStrictEqual(Object.keys(met.lg).map(Number).sort((a, b) => a - b), [2, 5, 6, 7, 8, 9, 10, 11, 15]);
    assert(met.minor && met.eventOnly);
    assert(/어린 왕자의 지도/.test(met.info) && /지도를 펼친다/.test(met.info));
    assert(/모래 언덕 셋/.test(mapNote));
    assert(met.log.some(t => /어린 왕자가 따라왔다/.test(t)));
    assert.strictEqual(dig.r1, false); assert(dig.toasts.some(t => /쪽/.test(t) && /어린 왕자/.test(t)), '가까우면 소년이 방향을 일러 준다: ' + dig.toasts.join(' / '));
    assert.strictEqual(dig.r2, true); assert.strictEqual(dig.gain, 100000, '금화 10만 닢'); assert.strictEqual(dig.phase, 'done');
    assert.strictEqual(dig.r3, false, '한 번만'); assert.strictEqual(dig.info, '');
    assert(dig.seen.some(x => /ALERT .*100,000/.test(x)));
    assert(/금화 100,000닢/.test(dig.log) && /왕자로 다니던 소녀였다/.test(dig.log));
    for (const key of ['meet', 'campfire', 'map', 'well', 'reveal']) assert(dig.pics.some(x => x.includes('little_prince_' + key)), '이벤트샷 표시: ' + key);
    assert.deepStrictEqual(rt, { phase: 'done', mate: true, revealed: true });
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify({ setup, low, leave: { phase: leave.phase, seen: leave.seen.slice(0, 6) }, met: { ...met, seen: met.seen.slice(0, 14) }, mapNote, dig, rt }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
