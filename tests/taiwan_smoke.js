/* 타이완 — 정성공의 질란디아(1661~62) · 청의 타이완 정복(1683) (2026-11-01 사용자 요청) — node tests/taiwan_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 녹이문: 1661.3~5 하문 (네덜란드 사람은 아님) — 하빈의 물길 · 배에 있던 정성공은 제 함대로 · 타이완 앞바다 해전(끝나면 하문)
   · ② 질란디아의 항복: 1661.12~1662.1 하문 → 1662.2.1까지 날이 지나간다 · 명예로운 조건 / 재물 · 질란디아 성의 열쇠
   · ③ 구원 함대: 1661.6~12 나가사키·반탐 (네덜란드면 하문도) — 이기면 동인도 회사의 은 메달 · 카우는 달아난다
   · ④ 팽호: 1683.5~7.15 하문·천주 — 시랑 편 / 정씨 편 / 어느 편도 · ⑤ 마지막 연평왕(1683.10.3~) — 시랑을 부하로 / 대명의 마지막 깃발
   · 진짜 해전 장면(타이완 앞바다) · 소식 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Taiwan && G.World && G.Rel, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, TW = G.Taiwan, said = [], asked = [], out = {}, specs = [];
      let plan = [], seaWin = true;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Rel.greatBattle = async (sp) => { specs.push(sp); if (seaWin) sp.onWin(); else sp.onLose(); return true; };
      const fresh = (nat) => {
        G.State.newGame({ name: '시험', nation: nat || 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1661, m: 1, d: 1 }; s.player.born = { y: 1630, m: 1, d: 1 }; delete s.life; delete s.taiwan; s.player.gold = 10000;
        return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = TW.pending(); if (p) await TW.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      // ── 문
      let s = fresh();
      out.gates = { cross: (at(s, 1661, 4, 1, 287), TW.pending()), early: (at(s, 1661, 2, 1, 287), TW.pending()), late: (at(s, 1661, 6, 1, 287), TW.pending()), quanzhou: (at(s, 1661, 4, 1, 175), TW.pending()),
        nlCross: (s.player.nation = 'NL', at(s, 1661, 4, 1, 287), TW.pending()), nlRelief: (at(s, 1661, 7, 1, 287), TW.pending()) };
      // ── ① 녹이문 — 배에 있던 정성공은 제 함대로
      s = fresh(); G.Legend.join('h_zhengchenggong', null);
      at(s, 1661, 4, 20, 287); await go([]);
      const c1 = specs[0];
      out.cross = { side: s.imjin, b: s.taiwan.side, won: s.taiwan.cross, spec: c1 && c1.id, back: c1 && c1.backCity, center: c1 && c1.center && c1.center.lon, hector: c1 && c1.names.indexOf('헥토르호') >= 0, junks: c1 ? c1.allies.length : 0,
        hebin: said.some(x => /한 자 반이 더 깊어지오/.test(x)), left: !hired('h_zhengchenggong') };
      out.seaOk = G.Geo.isSea(TW.PLACES.zeelandia.lon, TW.PLACES.zeelandia.lat) && G.Geo.isSea(TW.PLACES.penghu.lon, TW.PLACES.penghu.lat);
      at(s, 1661, 6, 1, 287); await go([]); out.crossAfter = { said: s.taiwan.crossSaid, call: said.some(x => /항복 자리에|항복 조건을 정하는 자리/.test(x)) };
      out.reliefBlocked = (at(s, 1661, 7, 1, 191), TW.pending());
      // ── ② 질란디아의 항복
      let g0 = s.player.gold; at(s, 1661, 12, 20, 287); await go(['honor']);
      out.terms = { v: s.taiwan.terms, date: G.U.dateNum(s.date), key: G.R.hasItem('tw_key'), gold: s.player.gold - g0, coyett: said.some(x => /코이엣이오/.test(x)), dongning: said.some(x => /동녕/.test(x)) };
      // ── ③ 구원 함대 (네덜란드 사람, 나가사키)
      s = fresh('NL'); at(s, 1661, 8, 1, 191); specs.length = 0; await go([]);
      out.relief = { spec: specs[0] && specs[0].id, back: specs[0] && specs[0].backCity, side: s.taiwan.side, won: s.taiwan.relief, caeuw: said.some(x => /신중하게 갈 생각/.test(x)) };
      await go([]); out.reliefAfter = { said: s.taiwan.reliefSaid, medal: G.R.hasItem('tw_medal'), fled: said.some(x => /시암 쪽으로 달아났/.test(x)) };
      s = fresh('EN'); out.bantam = (at(s, 1661, 9, 1, 168), TW.pending());
      // ── ④ 팽호 — 시랑 편 → ⑤ 시랑을 부하로
      s = fresh(); at(s, 1683, 6, 1, 175); specs.length = 0; await go(['qing']);
      const p1 = specs[0];
      out.penghu = { p83: s.taiwan.p83, spec: p1 && p1.id, center: p1 && p1.center && p1.center.lat, back: p1 && p1.backCity, liu: p1 && p1.foeLabel, envoy: said.some(x => /정씨의 밀사/.test(x)) };
      await go([]); out.penghuAfter = { said: s.taiwan.penghuSaid };
      out.lastEarly = (at(s, 1683, 9, 1, 175), TW.pending());
      at(s, 1683, 10, 10, 287); await go(['ask']);
      out.last = { done: s.taiwan.last, shilang: hired('h_shilang'), shrine: said.some(x => /사당에 들어가/.test(x)), boy: said.some(x => /대청 황제께 바치옵니다/.test(x)) };
      // ── 정씨 편 (시랑이 배에 있으면 떠난다) → 대명의 마지막 깃발
      s = fresh(); G.Legend.join('h_shilang', null); at(s, 1683, 7, 1, 287); specs.length = 0; await go(['zheng']);
      out.zheng = { p83: s.taiwan.p83, foe: specs[0] && specs[0].foe, left: !hired('h_shilang') };
      await go([]); at(s, 1683, 11, 1, 191); await go([]);
      out.banner = { last: s.taiwan.last, banner: G.R.hasItem('tw_banner') };
      // ── 어느 편도
      s = fresh(); at(s, 1683, 6, 1, 287); specs.length = 0; await go(['none']); out.none = { p83: s.taiwan.p83, specs: specs.length, again: TW.pending() };
      // ── 소식
      s = fresh(); s.loc = { mode: 'sea', lon: 119, lat: 24 };
      const day = (y, m, d) => { s.date = { y, m, d }; return TW.daily().map(x => x.text).join(' | '); };
      out.news = { cross: day(1661, 4, 30), sur: day(1662, 2, 1), death: day(1662, 6, 23), jing: day(1681, 3, 17), peng: day(1683, 7, 17), last: day(1683, 10, 3), pref: day(1684, 5, 27) };
      s = fresh(); s.date = { y: 1700, m: 1, d: 1 }; delete s.taiwan; out.oldSave = TW.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'taiwan');
      out.journal = !!(TW.daily && TW.daily._journal);
      return out;
    });
    console.log(JSON.stringify({ cross: r.cross, terms: r.terms, relief: r.relief, penghu: r.penghu, last: r.last, zheng: r.zheng }));
    const g = r.gates;
    ok(g.cross && !g.early && !g.late && !g.quanzhou && !g.nlCross && g.nlRelief, '문 — 1661.3~5 하문 (네덜란드 사람은 녹이문 대신 구원 함대) ' + JSON.stringify(g));
    const c = r.cross;
    ok(c.b === 'zheng' && c.won === 'won' && c.spec === 'tw_cross' && c.back === 287 && c.center && c.hector && c.junks === 7 && c.hebin && c.left && r.seaOk, '① 녹이문 — 하빈의 사리 물길 · 헥토르호와 해전(타이완 앞바다, 끝나면 하문) · 정성공은 제 함대로');
    ok(r.crossAfter.said && r.crossAfter.call && r.reliefBlocked === false, '① 뒤 — 겨울에 항복 자리로 부른다 · 정씨 편이면 구원 함대는 열리지 않는다');
    const t = r.terms;
    ok(t.v === 'honor' && t.date >= 16620201 && t.key && t.gold > 3000 && t.coyett && t.dongning, '② 질란디아의 항복 — 1662.2.1 · 명예로운 조건 · 성의 열쇠 · 금화 4,000(날이 지나간 품삯을 뺀) · 동녕');
    const rl = r.relief;
    ok(rl.spec === 'tw_relief' && rl.back === 191 && rl.side === 'dutch' && rl.won === 'won' && rl.caeuw && r.reliefAfter.said && r.reliefAfter.medal && r.reliefAfter.fled && r.bantam, '③ 구원 함대 — 나가사키에서 · 이기면 은 메달 · 카우는 시암으로 달아난다 · 반탐에서도 열린다');
    const p = r.penghu;
    ok(p.p83 === 'qing' && p.spec === 'tw_penghu' && p.center === 23.5 && p.back === 175 && /유국헌/.test(p.liu) && p.envoy && r.penghuAfter.said && r.lastEarly === false, '④ 팽호 — 시랑의 편 (그날 밤 정씨의 밀사도) · 팽호 앞바다 해전 · 10월 전에는 마지막 장면이 열리지 않는다');
    ok(r.last.done && r.last.shilang && r.last.shrine && r.last.boy, '⑤ 마지막 연평왕 — 정극상의 항복 · 시랑이 사당에서 운다 · 시랑을 부하로');
    ok(r.zheng.p83 === 'zheng' && r.zheng.foe === '청' && r.zheng.left && r.banner.last && r.banner.banner, '정씨 편 — 배에 있던 시랑은 떠난다 · 나가사키에서도 마지막 장면 · 대명의 마지막 깃발');
    ok(r.none.p83 === 'none' && r.none.specs === 0 && r.none.again === false, '어느 편도 들지 않으면 해전이 없고 다시 묻지 않는다');
    const n = r.news;
    ok(/녹이문/.test(n.cross) && /코이엣/.test(n.sur) && /선왕을 뵐 낯이 없다/.test(n.death) && /정극상/.test(n.jing) && /다섯 척이 한 척/.test(n.peng) && /머리를 깎고/.test(n.last) && /대만부/.test(n.pref), '소식 — 녹이문·질란디아·국성야의 죽음·정경·팽호·마지막 연평왕·대만부');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장 · 소문 · 일지');
    // ── 진짜 해전 장면: 타이완 앞바다
    await page.reload();
    await page.waitForFunction(() => window.G && G.Game && G.Taiwan && G.Rel, null, { timeout: 120000 });
    const q = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, out = {};
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; UI.ask = async (t, opts) => opts[0].value;
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1661, m: 4, d: 20 }; s.player.born = { y: 1630, m: 1, d: 1 }; delete s.life;
      s.loc = { mode: 'city', city: 287, lon: G.CITY_DATA[287].lon, lat: G.CITY_DATA[287].lat };
      G.Game.go('city', { cityId: 287 });
      const wait = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return true; await new Promise(r => setTimeout(r, 200)); } return false; };
      out.inBattle = await wait(() => G.Game.sceneName === 'battle' && G.Scenes.battle.runtime(), 60000);
      const bs = G.Scenes.battle.runtime();
      out.allies = bs ? bs.ships.filter(b => b.ally).length : -1; out.foes = bs ? bs.ships.filter(b => b.side === 'en').length : -1;
      out.center = bs && bs.center ? Math.round(bs.center.lon * 100) : 0;
      await G.Scenes.battle._t().finish('win');
      out.back = await wait(() => G.Game.sceneName === 'city' && s.loc.city === 287 && !G.Taiwan._busy, 60000);
      out.won = s.taiwan && s.taiwan.cross;
      return out;
    });
    console.log(JSON.stringify(q));
    ok(q.inBattle && q.allies === 7 && q.foes === 4 && q.center === 12002 && q.back && q.won === 'won', '진짜 해전 장면 — 타이완 앞바다에서 정크 7척과 함께 네덜란드 배 4척 · 이기면 하문으로');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
