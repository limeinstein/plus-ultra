/* 진귀한 물고기 낚시 (베타 피드백 #157 「거대 오징어 안 낚여요」, 2026-11-07) — node tests/fishing_rare_smoke.js   (BROWSER_EXE=크롬 경로)
   ① 거대 오징어: 노르웨이 바다(북위 60~72°)의 깊은 곳 · 기본 확률 0.03
   ② 단서가 있으면 제 깊이에서 놓칠수록 잘 걸린다(끈기) · 단서가 없거나 다른 깊이면 그대로 · 낚으면 더는 나오지 않는다
   ③ 단서 하나·깊은 곳만: 사흘(미끼 9개) 안에 거의 다 걸린다
   ④ 실제 낚시 창: 진귀한 고기가 걸린 채 너무 일찍 채면 「보통 고기가 아니었다」고 알려 준다 · 보통 고기는 그런 말 없음 · 끝까지 끌어올리면 발견
   콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Fishing, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const F = G.Fishing, U = G.U, out = {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.loc = { mode: 'sea', lon: -5, lat: 66, heading: 0 };
      const f = G.DISC.f_giantsquid.fish;
      out.data = [f.p, f.depth, f.diff, f.lat.join('~')].join(':');
      out.here = F.rareHere(-5, 66).some(x => x.d.id === 'f_giantsquid') && !F.rareHere(-5, 50).some(x => x.d.id === 'f_giantsquid');
      // ② 끈기
      const sq = F.rareHere(-5, 66).find(x => x.d.id === 'f_giantsquid');
      const p0 = F.rareP(sq, 2, 0);
      const real = U.chance; U.chance = () => false;
      for (let i = 0; i < 4; i++) F.pick(-5, 66, 0.9);
      out.noHintMiss = (s.fishMiss || {}).f_giantsquid || 0;
      s.hints.f_giantsquid = { src: 'tavern:1' };
      const p1 = F.rareP(sq, 2, 0);
      for (let i = 0; i < 4; i++) F.pick(-5, 66, 0.9);
      F.pick(-5, 66, 0.2);   // 얕은 곳은 세지 않는다
      out.miss = s.fishMiss.f_giantsquid;
      const p2 = F.rareP(sq, 2, 0), pShallow = F.rareP(sq, 0, 0);
      U.chance = real;
      out.p = [p0, p1, p2, pShallow].map(x => Math.round(x * 1000) / 1000).join(',');
      // ③ 단서 하나 · 깊은 곳만 · 미끼 9개(사흘) 안에 걸릴 비율
      let hit = 0; const T = 3000;
      for (let t = 0; t < T; t++) { s.fishMiss = {}; for (let c = 0; c < 9; c++) { const h = F.pick(-5, 66, 0.9); if (h.rare && h.rare.id === 'f_giantsquid') { hit++; break; } } }
      out.within3 = hit / T;
      s.fishMiss = {};
      // ④ 실제 낚시 창
      const say = []; G.UI.say = async t => { say.push(String(t)); };
      const realPick = F.pick;
      const msgOf = () => { const e = document.querySelector('.fmsg'); return e ? e.textContent : ''; };
      const wait = ms => new Promise(r2 => setTimeout(r2, ms));
      async function cast(hook, strikeEarly) {
        F.pick = () => hook;
        const st = F._st; st.t = 0; st.ph = 'aim';
        const act = [...document.querySelectorAll('.win .btn')].find(b => /던진다|챈다|감는다|던지/.test(b.textContent)) || document.querySelector('.win .btn');
        act.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        await wait(50);
        if (strikeEarly) { act.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(80); return msgOf(); }
        return '';
      }
      const open = F.open({});
      for (let i = 0; i < 100 && !F._st; i++) await wait(30);
      await wait(200);
      const squidHook = { rare: G.DISC.f_giantsquid, n: G.DISC.f_giantsquid.name, kg: 200, diff: 3, depth: 2 };
      out.lostRare = await cast(squidHook, true);
      await wait(300);
      out.lostCommon = await cast({ fish: { n: '대구', school: false }, n: '대구', kg: 5, diff: 1, depth: 1 }, true);
      // 끝까지 끌어올린다: 걸린 상태로 만들어 진행을 채운다
      await wait(300);
      F.pick = () => squidHook;
      const st = F._st; st.ph = 'aim';
      const act = [...document.querySelectorAll('.win .btn')].find(b => /던진다|챈다|감는다|던지/.test(b.textContent)) || document.querySelector('.win .btn');
      act.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await wait(50);
      st.ph = 'bite'; st.t = 0; st.bite = 5;
      act.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      st.prog = 0.999; st.tension = 0.5;
      for (let i = 0; i < 60 && st.ph !== 'done'; i++) { st.tension = 0.5; st.hold = true; await wait(30); }
      out.caughtMsg = msgOf();
      F.pick = realPick;
      // 창을 닫는다
      await wait(300);
      const quit = [...document.querySelectorAll('.win .btn')].find(b => /그만한다/.test(b.textContent));
      quit.click();
      for (let i = 0; i < 200 && !G.Disc.foundByMe('f_giantsquid'); i++) { await wait(50); const m = [...document.querySelectorAll('.modal-back')].pop(); if (m) { const b2 = [...m.querySelectorAll('.btn')].pop(); if (b2 && !/그만한다|던진다/.test(b2.textContent)) b2.click(); } }
      out.found = G.Disc.foundByMe('f_giantsquid');
      out.gone = !F.rareHere(-5, 66).some(x => x.d.id === 'f_giantsquid');
      return out;
    });
    ok(r.data === '0.03:2:3:60~72' && r.here, '거대 오징어: 북위 60~72° 노르웨이 바다의 깊은 곳 · 기본 확률 0.03');
    const p = r.p.split(',').map(Number);
    ok(r.noHintMiss === 0 && Math.abs(p[1] - p[0] * 2) < 1e-3 && r.miss === 4 && Math.abs(p[2] - p[1] * 3) < 1e-3 && p[3] < p[0], '끈기: 단서가 없으면 그대로, 단서가 있으면 깊은 곳에서 4번 놓친 뒤 3배 (얕은 곳은 세지 않음) — ' + r.p);
    ok(r.within3 > 0.85, '단서 하나 · 깊은 곳만 · 사흘(미끼 9개) 안에 걸리는 비율 ' + Math.round(r.within3 * 100) + '%');
    ok(/보통 고기가 아니었다/.test(r.lostRare), '거대 오징어가 걸린 채 너무 일찍 채면 알려 준다 — ' + r.lostRare);
    ok(/너무 일찍/.test(r.lostCommon) && !/보통 고기가 아니었다/.test(r.lostCommon), '보통 고기는 그런 말 없이');
    ok(/잡았다! 「(거대 오징어|크라켄의 팔)」/.test(r.caughtMsg) && r.found && r.gone, '끝까지 끌어올리면 「거대 오징어」 발견(크라켄의 팔) · 더는 나오지 않는다');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' / ') : ''));
    console.log('통과: 진귀한 물고기 낚시');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
