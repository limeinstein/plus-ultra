/* 세키가하라 전투·에도 막부 (2026-11-01 사용자 요청) — node tests/sekigahara_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 리프데호의 항해사: 1600.5~9 사카이 — 애덤스를 변호(지구의 조각) · 포수를 가르치면 동군
   · ② 미쓰나리의 부름: 1600.8~10.20 사카이·쿄토 — 서군(금화) / 동군 / 중립 · 동군이었다가 서군이면 「돌아섰다」
   · ③ 세키가하라(뭍 136.43, 35.37 · 10.1~11.15): 동군 — 문철포 → 고바야카와 / 서군 — 고바야카와를 붙잡기 → 시마 사콘 · 무사시 합류
   · ④ 에도 막부(1603.3.24~): 동군 공짜 주인장+금화 · 서군은 값(애덤스를 변호했으면 절반) · 거절
   · 소식 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Sekigahara && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, SK = G.Sekigahara, said = [], asked = [], out = {};
      let plan = [], landRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value), labels: opts.map(o => o.label) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (nat) => {
        G.State.newGame({ name: '시험', nation: nat || 'NL', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1600, m: 1, d: 1 }; s.player.born = { y: 1570, m: 1, d: 1 }; delete s.life; delete s.sekigahara; s.player.gold = 20000;
        return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = SK.pending(); if (p) await SK.check(); return p; };
      const land = async (lon, lat, choices, res) => { plan = (choices || []).slice(); landRes = (res || []).slice(); said.length = 0; const s = G.Game.state; s.loc = { mode: 'land', lon, lat, party: 40, base: { type: 'city', city: 193, lon: 135.747, lat: 35.024 } }; return await SK.onLand(lon, lat, { battle: (nm, n, o) => G.Scenes.land.landBattle(nm, n, false, o), stop: () => {} }); };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      // ── 문
      let s = fresh();
      const gate = (y, m, d, c) => { at(s, y, m, d, c); s.sekigahara = { told: {} }; return SK.pending(); };
      out.gates = { adams: gate(1600, 6, 1, 192), adamsEarly: gate(1600, 4, 1, 192), adamsKyoto: gate(1600, 6, 1, 193), side: gate(1600, 10, 1, 193), sideLate: gate(1600, 10, 25, 192), shogunNoMeet: gate(1603, 5, 1, 297) };
      // ── 동군: 애덤스 변호 · 가르친다 → 미쓰나리 거절 → 세키가하라(쏜다) → 에도 주인장 공짜
      s = fresh(); at(s, 1600, 6, 1, 192); await go(['defend', 'teach']);
      out.east1 = { adams: s.sekigahara.adams, teach: s.sekigahara.teach, side: s.sekigahara.side, globe: G.R.hasItem('sekigahara_globe'), pirate: said.some(x => /해적입니다/.test(x)), cannon: said.some(x => /대포가 열아홉 문/.test(x)) };
      at(s, 1600, 9, 1, 193); await go(['east']);
      out.east2 = { side: s.sekigahara.side, called: s.sekigahara.called, banner: said.some(x => /대일대만대길/.test(x)) };
      out.farField = await land(136.0, 35.2, [], []);
      let g0 = s.player.gold; s.date = { y: 1600, m: 10, d: 21 };
      out.east3 = { r: await land(136.43, 35.37, ['shoot'], ['win']), battle: s.sekigahara.battle, shot: s.sekigahara.shot, fog: said.some(x => /짙은 안개/.test(x)), turn: said.some(x => /오타니의 진을 쳐라/.test(x)), gold: s.player.gold - g0 };
      out.again = await land(136.43, 35.37, [], []);
      g0 = s.player.gold; at(s, 1603, 5, 1, 297); await go([]);
      out.east4 = { shogun: s.sekigahara.shogun, shuin: G.R.hasItem('sekigahara_shuin'), gold: s.player.gold - g0, anjin: said.some(x => /나요, 애덤스/.test(x)) };
      // ── 서군: 해적이라 거든다 → 가르친다(동군) → 서군으로 돌아선다 → 세키가하라(배신) → 무사시 → 에도 주인장 값
      s = fresh('PT'); at(s, 1600, 6, 1, 192); await go(['accuse', 'teach']);
      g0 = s.player.gold; at(s, 1600, 9, 1, 192); await go(['west']);
      out.west1 = { side: s.sekigahara.side, turned: s.sekigahara.turned, gold: s.player.gold - g0 };
      s.date = { y: 1600, m: 10, d: 21 };
      out.west2 = { r: await land(136.4, 35.35, ['go', 'yes'], ['lose']), battle: s.sekigahara.battle, persuade: !!s.sekigahara.persuade, sakon: said.some(x => /시마 사콘의 창맛/.test(x)), musashi: hired('h_musashi'), betray: said.some(x => /등을 돌렸다/.test(x)) };
      g0 = s.player.gold; at(s, 1604, 1, 1, 193); await go(['pay']);
      out.west3 = { shogun: s.sekigahara.shogun, paid: g0 - s.player.gold, osaka: said.some(x => /히데요리에게는 배를/.test(x)) };
      // ── 중립: 애덤스 변호 · 가르치지 않음 → 중립 → 들판 없음 → 주인장 절반 값 → 거절
      s = fresh(); at(s, 1600, 6, 1, 192); await go(['defend', 'no']); at(s, 1600, 9, 1, 192); await go(['none']); s.date = { y: 1600, m: 10, d: 21 };
      out.none1 = { side: s.sekigahara.side, field: await land(136.43, 35.37, [], []) };
      at(s, 1603, 4, 1, 192); await go(['no']);
      out.none2 = { shogun: s.sekigahara.shogun, shuin: G.R.hasItem('sekigahara_shuin'), fee: (asked[0] && asked[0].t) ? JSON.stringify(asked) : '' };
      // ── 소식
      s = fresh(); s.loc = { mode: 'sea', lon: 135, lat: 34 }; s.date = { y: 1600, m: 1, d: 1 }; s.sekigahara = { told: {}, adams: 'defend' };
      const day = (y, m, d) => { s.date = { y, m, d }; return SK.daily().map(x => x.text).join(' | '); };
      out.news = { liefde: day(1600, 4, 19), fushimi: day(1600, 9, 8), battle: day(1600, 10, 21), mitsu: day(1600, 11, 6), shogun: day(1603, 3, 24), anjin: day(1605, 6, 1) };
      out.farNews = (s = fresh(), s.loc = { mode: 'sea', lon: -10, lat: 40 }, s.date = { y: 1600, m: 10, d: 21 }, SK.daily().length);
      s = fresh(); s.date = { y: 1700, m: 1, d: 1 }; delete s.sekigahara; out.oldSave = SK.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'sekigahara');
      out.journal = !!(SK.daily && SK.daily._journal);
      out.items = [G.ITEM.sekigahara_shuin && G.ITEM.sekigahara_shuin.name, G.ITEM.sekigahara_globe && G.ITEM.sekigahara_globe.name];
      return out;
    });
    console.log(JSON.stringify({ east3: r.east3, west2: r.west2, none2: r.none2 }));
    const g = r.gates;
    ok(g.adams && !g.adamsEarly && !g.adamsKyoto && g.side && !g.sideLate && !g.shogunNoMeet, '장면이 사카이·쿄토·에도에서 날짜에 맞게 열린다 ' + JSON.stringify(g));
    ok(r.east1.adams === 'defend' && r.east1.teach === 1 && r.east1.side === 'east' && r.east1.globe && r.east1.pirate && r.east1.cannon, '① 리프데호 — 예수회의 「해적」 · 애덤스를 변호하고 지구의 조각 · 대포 열아홉 문의 포수를 가르치면 동군');
    ok(r.east2.side === 'east' && r.east2.called === 1 && r.east2.banner, '② 미쓰나리의 부름(대일대만대길) — 동군에 남는다');
    ok(r.farField === false && r.east3.r && r.east3.battle === 'win' && r.east3.shot === 'shoot' && r.east3.fog && r.east3.turn && r.east3.gold === 3000 && r.again === false, '③ 세키가하라 — 안개 · 문철포로 고바야카와가 돌아선다 · 포상 금화 3000 · 다시 열리지 않는다');
    ok(r.east4.shogun === 'shuin' && r.east4.shuin && r.east4.gold === 2000 && r.east4.anjin, '④ 에도 막부 — 동군이면 주인장 공짜 + 금화 2000 · 사무라이가 된 애덤스');
    ok(r.west1.side === 'west' && r.west1.turned === 1 && r.west1.gold === 3000, '② 동군이었다가 서군으로 돌아선다 (금화 3000)');
    ok(r.west2.r && r.west2.battle === 'lose' && r.west2.persuade && r.west2.sakon && r.west2.musashi && r.west2.betray, '③ 서군 — 고바야카와의 배신 · 시마 사콘의 마지막 돌격 · 무사시가 부하로');
    ok(r.west3.shogun === 'shuin' && r.west3.paid === 3000 && r.west3.osaka, '④ 서군은 주인장 값 3000 · 「히데요리에게 배를 빌려주지 마오」');
    ok(r.none1.side === 'none' && r.none1.field === false && r.none2.shogun === 'no' && !r.none2.shuin && /750/.test(r.none2.fee), '중립은 들판에 가지 않는다 · 애덤스를 변호했으면 주인장 값 절반(750) · 거절');
    const n = r.news;
    ok(/리프데호/.test(n.liefde) && /후시미/.test(n.fushimi) && /고바야카와/.test(n.battle) && /담에 해롭다/.test(n.mitsu) && /정이대장군/.test(n.shogun) && /미우라 안진/.test(n.anjin) && r.farNews === 0, '소식 — 리프데호·후시미·세키가하라·로쿠조가와라·에도 막부·미우라 안진 (먼 바다에서는 없음)');
    ok(r.oldSave === 0 && r.rumor && r.journal && r.items[0] === '주인장 (朱印状)' && r.items[1], '옛 저장 · 소문 · 일지 · 소지품');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
