/* 위그노 내전 — 라로셸 포위 (js/systems/huguenot.js, 2026-10-29)
   · 달타냥·아토스·포르토스·아라미스가 모두 부하이고 1562년 이후 프랑스 왕의 도시에 들어서면 국왕의 전령 → 라로셸 앞바다에서 어느 편에 설까
   · 왕의 편(생제르베 보루 육상전) · 성의 편(봉쇄 돌파 해전 · 식량) · 화평(아라미스와 — 실패하면 다시 고른다) */
'use strict';
const assert = require('assert'); const path = require('path'); const fs = require('fs'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'); const SHOTS = process.env.SHOT_DIR || '';
(async function () {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errors = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  try {
    await p.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await p.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Huguenot && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const setup = await p.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0;
      s.date = { y: 1572, m: 9, d: 1 };
      const bordeaux = G.CITY_DATA.find(c => c.name === '보르도');
      s.loc = { mode: 'city', city: bordeaux.id, lon: bordeaux.lon, lat: bordeaux.lat };
      ['d_artagnan', 'athos', 'porthos', 'aramis'].forEach(id => G.Legend.join(id, null));
      const H = G.Huguenot, out = {};
      out.ids = ['d_artagnan', 'athos', 'porthos', 'aramis'].map(id => !!G.MATE[id]);
      out.owner = G.R.cityOwner(bordeaux);
      // 한 사람이라도 없으면, 1562년 전이면 없다
      const ar = s.mates.find(m => m.id === 'aramis'); s.mates.splice(s.mates.indexOf(ar), 1);
      out.noAramis = H.pending(); s.mates.push(ar);
      s.date.y = 1550; out.early = H.pending(); s.date.y = 1572;
      out.pending = H.pending();
      // 라로셸 앞바다가 바다인가
      const b = G.BALANCE.huguenot.box; let sea = null;
      for (let x = b[0]; x <= b[1] && !sea; x += 0.05) for (let y = b[2]; y <= b[3] && !sea; y += 0.05) if (G.Geo.isSea(x, y, 0.05)) sea = [x, y];
      out.sea = sea;
      return out;
    });
    // 부름 — 실제 대화창으로 한 장
    await p.evaluate(() => { window.__said = []; const s0 = G.UI.say; G.UI.say = function (t, sp) { window.__said.push(((sp && sp.name) || '') + '|' + String(t).slice(0, 60)); return s0.apply(this, arguments); }; window.__c = G.Huguenot.check(); });
    for (let i = 0; i < 12; i++) {
      await p.waitForTimeout(900);
      if (SHOTS && i === 1) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, '01_전령.png'), timeout: 150000 }); }
      if (SHOTS && i === 3) await p.screenshot({ path: path.join(SHOTS, '02_아토스.png'), timeout: 150000 });
      const done = await p.evaluate(() => G.Huguenot.state().phase === 'call');
      if (done) break; await p.keyboard.press('Enter');
    }
    await p.evaluate(() => window.__c);
    const r = await p.evaluate(async (sea) => {
      const s = G.Game.state, H = G.Huguenot, out = {}, R = G.R;
      G.UI.say = async (t, sp) => { window.__said.push(((sp && sp.name) || '') + '|' + String(t).slice(0, 60)); };
      out.call = { phase: H.state().phase, said: window.__said.slice(0, 7), log: s.log.slice(-1)[0].t };
      const toSea = () => { s.loc = { mode: 'sea', lon: sea[0], lat: sea[1], heading: 0 }; s.day += 31; };
      const loyal = () => ['d_artagnan', 'athos', 'porthos', 'aramis'].map(id => s.mates.find(m => m.id === id).loyal);
      const reset = () => { const p0 = H.state(); Object.keys(p0).forEach(k => delete p0[k]); p0.phase = 'call'; p0.at = s.day; };
      // 왕의 편 — 육상전을 이긴다
      toSea(); out.seaPending = H.seaPending();
      G.UI.ask = async (t, o) => (o.some(x => x.value === 'king') ? 'king' : o[0].value);
      let lw = null; G.Games.landWar = async (o) => { lw = o; return { res: 'win', left: o.party - 3 }; };
      s.mates.forEach(m => m.loyal = 70);
      let g0 = s.player.gold, crew0 = s.fleet.crew;
      await H.atSea();
      out.king = { phase: H.state().phase, side: H.state().side, gold: s.player.gold - g0, lw: { hold: lw.hold, enemy: lw.enemy.name }, crew: crew0 - s.fleet.crew, loyal: loyal(), said: window.__said.filter(x => /모두는 하나를|하나는 모두를/.test(x)).length };
      // 성의 편 — 봉쇄 해전을 이긴다
      reset(); toSea(); window.__said = []; s.fleet.food = 5000;
      G.UI.ask = async (t, o) => (o.some(x => x.value === 'city') ? 'city' : o[0].value);
      G.Rel.greatBattle = async (spec) => { G.Rel.afterBattle({ great: spec.id }, 'win', []); return true; };
      g0 = s.player.gold; const f0 = s.fleet.food;
      await H.atSea();
      out.cityMid = { pending: H.state().pending, won: H.state().won, after: H.seaAfterPending() };
      await H.afterSeaAll();
      out.city = { phase: H.state().phase, side: H.state().side, food: f0 - s.fleet.food, gold: s.player.gold - g0, said: window.__said.filter(x => /목사|하나는 모두를/.test(x)).length };
      // 화평 — 실패하면 다시 고른다 (왕의 편으로)
      reset(); toSea(); window.__said = [];
      const ch = G.U.chance; G.U.chance = () => false;
      let n = 0; G.UI.ask = async (t, o) => (n++ === 0 ? 'peace' : 'king');
      await H.atSea(); G.U.chance = ch;
      out.peaceFail = { side: H.state().side, said: window.__said.some(x => /하느님께서 귀를 기울이지 않으시는군요/.test(x)) };
      // 화평 — 이룬다
      reset(); toSea(); window.__said = []; G.U.chance = () => true; G.UI.ask = async (t, o) => (o.some(x => x.value === 'peace') ? 'peace' : null);
      g0 = s.player.gold; await H.atSea(); G.U.chance = ch;
      out.peace = { side: H.state().side, gold: s.player.gold - g0, said: window.__said.some(x => /칼보다 오래 가는 길/.test(x)) };
      // 물러나기 — 한 달 동안은 다시 묻지 않는다
      reset(); toSea(); G.UI.ask = async () => null; await H.atSea(); out.retreat = { phase: H.state().phase, again: H.seaPending() };
      out.peaceChance = H.peaceChance();
      out.save = JSON.parse(G.State.serialize()).huguenot;
      return out;
    }, setup.sea);
    console.log(JSON.stringify({ setup, r }, null, 1));
    assert.deepStrictEqual(setup.ids, [true, true, true, true]);
    assert.strictEqual(setup.owner, '프랑스'); assert.strictEqual(setup.noAramis, false, '넷이 모두 있어야'); assert.strictEqual(setup.early, false, '1562년 뒤'); assert.strictEqual(setup.pending, true);
    assert(setup.sea, '라로셸 앞바다는 바다');
    assert.strictEqual(r.call.phase, 'call'); assert(r.call.said.some(x => /국왕의 전령\|/.test(x)) && r.call.said.some(x => /^아토스/.test(x)));
    assert.strictEqual(r.seaPending, true);
    assert.strictEqual(r.king.side, 'king'); assert.strictEqual(r.king.phase, 'done'); assert.strictEqual(r.king.gold, 30000); assert.strictEqual(r.king.lw.hold, 2); assert.strictEqual(r.king.crew, 3);
    assert.deepStrictEqual(r.king.loyal, [80, 80, 80, 80], '총사 넷 충성 +10'); assert(r.king.said >= 2, '모두는 하나를 위하여');
    assert.strictEqual(r.cityMid.pending, 'city'); assert.strictEqual(r.cityMid.won, 'win'); assert.strictEqual(r.cityMid.after, true);
    assert.strictEqual(r.city.side, 'city'); assert(r.city.food > 0, '식량을 성에 넘겼다'); assert.strictEqual(r.city.gold, 20000); assert(r.city.said >= 2);
    assert.strictEqual(r.peaceFail.side, 'king'); assert(r.peaceFail.said);
    assert.strictEqual(r.peace.side, 'peace'); assert.strictEqual(r.peace.gold, 10000); assert(r.peace.said);
    assert.deepStrictEqual(r.retreat, { phase: 'call', again: false });
    assert(r.peaceChance > 0.1 && r.peaceChance < 0.9);
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
