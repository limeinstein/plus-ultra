/* 왜구의 대규모 침입과 척계광의 토벌 (2026-11-05 사용자 요청) — node tests/wokou_smoke.js   (BROWSER_EXE=크롬 경로)
   · 입항: 장면이 기다리는 명의 항구·통행첩이면 길이 열린다 · ① 불타는 포구(항주·상해 — 호종헌의 통행첩) · ①' 히라도의 정해왕(밀무역 · 깃발 · 악명)
   · ② 왕직의 귀순(믿는다/덫/침묵 — 늘 붙잡힌다 · 부하였으면 먼저 내린다) · ③ 원앙진 물음 둘 → 태주(왜구가 준다) → 『기효신서』
   · ④ 평해위 큰 해전(유대유·유현의 복선) → 척계광/유대유를 부하로 · 진짜 해전 장면 · 진짜 입항 · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
  const boot = async () => { await page.waitForFunction(() => window.G && G.Game && G.Wokou && G.World && G.Rel, null, { timeout: 120000 }); };
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href); await boot();
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, WK = G.Wokou, said = [], asked = [], fights = [], specs = [], out = {};
      let plan = [], landRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.Scenes.land.landBattle = async (nm, n) => { fights.push(nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      G.Rel.greatBattle = async (sp) => { specs.push(sp); sp.onWin(); return true; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; fights.length = 0; const p = WK.pending(); if (p) await WK.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const b = () => G.Game.state.wokou;
      // ── 입항 문
      let s = fresh(1552, 6, 1); s.loc = { mode: 'sea', lon: 121, lat: 30 };
      const hz = G.CITY_DATA[177], fz = G.CITY_DATA[176];
      await WK.beforePort(hz); out.passEarly = G.Sneak.hasPass(hz);
      s.date = { y: 1554, m: 5, d: 1 }; await WK.beforePort(hz); out.passRaid = G.Sneak.hasPass(hz); out.passFz = (await WK.beforePort(fz), G.Sneak.hasPass(fz));
      // ── ① 불타는 포구 (명의 길)
      at(s, 1554, 5, 1, 177); await go([], ['win']);
      out.raid = { path: b().path, raid: b().raid, pass: G.R.hasItem('wk_pass'), fight: fights[0], hu: said.some(x => /히라도의 왕직을 아오/.test(x)), mixed: said.some(x => /중국 옷을 입은 사내들/.test(x)) };
      s.loc = { mode: 'sea', lon: 119, lat: 26 }; await WK.beforePort(fz); out.passAny = G.Sneak.hasPass(fz);
      // ── ② 귀순 (명의 길 · 덫이라 경고)
      let g0 = s.player.gold; at(s, 1557, 11, 1, 177); await go(['warn']);
      out.sur = { v: b().surrender, gold: s.player.gold - g0, anyway: said.some(x => /그래도 가겠소/.test(x)), bound: said.some(x => /군사들이 그를 묶었다/.test(x)) };
      // ── ③ 원앙진 — 물음 둘 맞힘
      at(s, 1560, 3, 1, 177); await go(['shield', 'langxian', 'go'], ['win']);
      out.qi = { quiz: b().quiz, date: s.date.y + '.' + s.date.m + '.' + s.date.d, fight: fights[0], book: G.R.hasItem('wk_book'), nine: said.some(x => /아홉 번 다 이겼소/.test(x)) };
      // ── ④ 평해위 → 척계광
      at(s, 1563, 4, 10, 175); await go([]);
      out.ph = { spec: specs[0] && specs[0].id, allies: specs[0] && specs[0].allies.map(a => a.type).join(','), n: specs[0] && specs[0].ships.length, back: specs[0] && specs[0].backCity, won: b().pinghai, again: (at(s, 1563, 4, 11, 175), WK.pending()) };
      await go(['qi']);
      out.join = { v: b().join, qi: hired('h_qijiguang'), done: WK.pending() };
      s.loc = { mode: 'sea', lon: 121, lat: 30 }; s.wokou.told = {};
      const day = (y, m, d) => { s.date = { y, m, d }; return WK.daily().map(x => x.text).join(' | '); };
      out.news = { raids: day(1553, 6, 1), arrest: day(1558, 2, 1), exe: day(1560, 1, 22), tz: day(1561, 6, 10), ph: day(1563, 5, 23) };
      // ── ①' 정해왕의 길 — 밀무역 · 귀순(부하 왕직이 먼저 내린다)
      s = fresh(1555, 3, 1); g0 = s.player.gold; const n0 = s.player.notoriety || 0; at(s, 1555, 3, 1, 191); await go(['trade']);
      out.wang = { path: b().path, gold: s.player.gold - g0, noto: (s.player.notoriety || 0) - n0, flag: G.R.hasItem('wk_flag'), sea: said.some(x => /해금을 풀어 주면/.test(x)), raidAfter: (at(s, 1555, 5, 1, 177), WK.pending()) };
      G.Legend.join('h_wangzhi', null); at(s, 1557, 12, 1, 177); await go(['trust']);
      out.wang2 = { v: b().surrender, left: !hired('h_wangzhi'), mao: said.some(x => /장사꾼의 깃발이 아니오/.test(x)) };
      s.loc = { mode: 'sea', lon: 121, lat: 30 }; s.wokou.told = {}; out.newsW = day(1560, 1, 22);
      // ── 물음을 틀리면 왜구가 그대로 · 유대유 · 이미 데리고 있으면 빼고
      s = fresh(1560, 1, 1); at(s, 1560, 1, 1, 288); await go(['gun', 'net', 'go'], ['lose']);
      out.qi2 = { quiz: b().quiz, fight: fights[0], tz: b().taizhou, book: G.R.hasItem('wk_book') };
      G.Legend.join('h_qijiguang', null); at(s, 1563, 5, 1, 287); await go([]); await go(['yu']);
      out.join2 = { opts: (asked[0] || {}).opts, v: b().join, yu: hired('h_yudayou') };
      out.lateJoin = (s.wokou.join = null, at(s, 1568, 1, 1, 287), WK.pending());
      // ── 옛 저장 · 소문 · 일지 · 말투
      s = fresh(1600, 1, 1); delete s.wokou; out.oldSave = WK.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'wokou');
      out.journal = !!(WK.daily && WK.daily._journal);
      out.voices = !!(G.VOICES && G.VOICES.h_qijiguang && G.VOICES.h_yudayou);
      return out;
    });
    console.log(JSON.stringify({ raid: r.raid, qi: r.qi, ph: r.ph, wang: r.wang, qi2: r.qi2, join2: r.join2 }));
    // ── 진짜 해전 장면 — 평해위
    await page.reload(); await boot();
    const q = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, WK = G.Wokou, out = {};
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; UI.ask = async (t, opts) => opts[0].value;
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1563, m: 5, d: 1 }; s.player.born = { y: 1530, m: 1, d: 1 }; delete s.life;
      s.wokou = { told: {}, qi: 1, taizhou: 'win' };
      s.loc = { mode: 'city', city: 175, lon: G.CITY_DATA[175].lon, lat: G.CITY_DATA[175].lat };
      G.Game.go('city', { cityId: 175 });
      const wait = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return true; await new Promise(r => setTimeout(r, 200)); } return false; };
      out.inBattle = await wait(() => G.Game.sceneName === 'battle' && G.Scenes.battle.runtime(), 60000);
      const bs = G.Scenes.battle.runtime();
      out.allies = bs ? bs.ships.filter(x => x.ally).map(x => x.type).join(',') : '';
      out.foes = bs ? bs.ships.filter(x => x.side === 'en').length : -1;
      out.great = bs && bs.npc.great;
      await G.Scenes.battle._t().finish('win');
      out.back = await wait(() => G.Game.sceneName === 'city' && s.loc.city === 175 && s.wokou.join, 60000);
      out.won = s.wokou.pinghai; out.join = s.wokou.join;
      out.diag = { scene: G.Game.sceneName, city: s.loc && s.loc.city, pending: WK.pending(), busy: !!WK._busy, uiBusy: G.UI.busy(), cityBusy: G.Scenes.city.isBusy(), relBattle: s.rel && s.rel.battle && s.rel.battle.wokou_pinghai,
        earlier: ['Rel','Leo','Tudor','Barb','Quix','Sim','IncaFall','Aztec','Macao','Odawara','Sekigahara','Houjin','Horan','Taiwan','Nerchinsk','Safavid','Mohacs','WangMoon','Brothers','Yeonsan','Ricci','Yuegang','Jiajing'].filter(k => G[k] && G[k].pending && G[k].pending()) };
      return out;
    });
    console.log(JSON.stringify(q));
    // ── 진짜 입항 — 외국인을 막는 항주에 장면이 기다리면 들어간다
    await page.reload(); await boot();
    const w = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, out = {};
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; UI.ask = async (t, opts) => opts[0].value; UI.confirm = async () => true;
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.land.landBattle = async () => 'win'; G.Scenes.city.news = async () => {};   // 도착 소식 창은 닫은 셈
      const wait = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return true; await new Promise(r => setTimeout(r, 200)); } return false; };
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1554, m: 6, d: 1 }; s.player.born = { y: 1524, m: 1, d: 1 }; delete s.life;
      const c = G.CITY_DATA[177]; s.loc = { mode: 'sea', lon: c.dock[1], lat: c.dock[0], heading: 0 };
      G.Game.go('sea', {}); await wait(() => G.Game.sceneName === 'sea', 20000);
      await G.Scenes.sea.enterPort(c);
      out.city = await wait(() => G.Game.sceneName === 'city' && s.loc.city === 177 && s.wokou && s.wokou.path === 'ming', 60000);
      out.pass = G.R.hasItem('wk_pass');
      return out;
    });
    console.log(JSON.stringify(w));
    ok(!r.passEarly && r.passRaid && !r.passFz, '입항 — 장면이 기다리는 항구에만 길이 열린다 (1553.4 전·복주는 아직)');
    ok(r.raid.path === 'ming' && r.raid.raid === 'win' && r.raid.pass && /포구를 터는 왜구 30/.test(r.raid.fight) && r.raid.hu && r.raid.mixed && r.passAny, '① 불타는 포구 — 왜구와 육상전 · 호종헌 「왕직을 아오」 · 통행첩(다섯 항구)');
    ok(r.sur.v === 'warn' && r.sur.gold >= 3000 && r.sur.anyway && r.sur.bound, '② 왕직의 귀순 — 덫이라 해도 「그래도 가겠소」 · 붙잡힌다 · 호종헌의 사례');
    ok(r.qi.quiz === 2 && r.qi.date === '1561.5.25' && /태주를 에워싼 왜구 33/.test(r.qi.fight) && r.qi.book && r.qi.nine, '③ 원앙진 물음 둘(등패·낭선) → 태주(1561.5.25 · 왜구 44→33) → 『기효신서』');
    ok(r.ph.spec === 'wokou_pinghai' && /ljunk,ljunk,junk/.test(r.ph.allies) && r.ph.n === 9 && r.ph.back === 175 && r.ph.won === 'won' && r.ph.again === true, '④ 평해위 — 유대유·유현의 복선이 우리 편 · 왜구 선단 9척 · 끝나면 그 항구로');
    ok(r.join.v === 'qi' && r.join.qi && r.join.done === false, '평해위 뒤 — 척계광을 부하로');
    const n = r.news;
    ok(/일본 사람이 아니라/.test(n.raids) && /덫인 줄 알고도/.test(n.arrest) && /양절의 백성/.test(n.exe) && /이방인 선장의 사람들/.test(n.tz) && /유룡척호/.test(n.ph) && /이방인 선장의 배/.test(n.ph), '소식 — 대왜구 · 왕직이 갇히다(덫인 줄 알고도) · 처형 · 태주 · 평해위');
    ok(r.wang.path === 'wang' && r.wang.gold === 4000 && r.wang.noto === 4 && r.wang.flag && r.wang.sea && r.wang.raidAfter === false, '①\' 히라도의 정해왕 — 밀무역 금화 4,000 · 악명 +4 · 깃발 · (명의 길 장면은 열리지 않는다)');
    ok(r.wang2.v === 'trust' && r.wang2.left && r.wang2.mao && /조기를 달았다/.test(r.newsW), '정해왕의 길 귀순 — 부하였던 왕직이 먼저 내린다 · 모해봉 · 처형 소식(깃발의 배)');
    ok(r.qi2.quiz === 0 && /태주를 에워싼 왜구 44/.test(r.qi2.fight) && r.qi2.tz === 'lose' && r.qi2.book, '물음을 틀리면 왜구가 그대로 · 져도 책은 받는다');
    ok(r.join2.opts && r.join2.opts.join() === 'yu,none' && r.join2.v === 'yu' && r.join2.yu && r.lateJoin === false, '이미 척계광을 데리고 있으면 유대유만 · 1568년부터는 묻지 않는다');
    ok(q.inBattle && q.great === 'wokou_pinghai' && q.allies === 'ljunk,ljunk,junk' && q.foes === 9 && q.back && q.won === 'won' && q.join === 'qi', '진짜 해전 장면 — 평해위: 복선 둘·사선 하나가 우리 편 · 왜구 9척 · 이기면 천주로 · 부하 물음');
    ok(w.city && w.pass, '진짜 입항 — 외국인을 막는 항주라도 장면이 기다리면 들어가 포구를 지킨다 · 통행첩');
    ok(r.oldSave === 0 && r.rumor && r.journal && r.voices, '옛 저장 · 소문 · 일지 · 척계광·유대유의 말투');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
