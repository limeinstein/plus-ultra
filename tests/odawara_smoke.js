/* 도요토미 히데요시의 일본 통일 — 오다와라 정벌 (2026-11-01 사용자 요청) — node tests/odawara_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 사카이에서 구키 요시타카 (1590.1~6.20) · 사양하면 끝 · 함께 가면 12일 뒤 사가미 앞바다 해전(물 위 · 끝나면 에도)
   · ② 에도: 이시가키야마 진영 — 리큐의 차 · 「하룻밤 성」(돛천) · 흰 수의의 마사무네 · 철포 사건으로 만났으면 알아본다
   · ③ 머물면 8.4까지 날이 지나고 항복 — 이에야스에게 간토 · 진바오리·금화 · 떠나면 절반 · 늦게 오면 절반
   · 소식(철포 사건과 겹치지 않게) · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Odawara && G.World && G.Rel, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, OD = G.Odawara, said = [], asked = [], out = {}, specs = [];
      let plan = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      G.Scenes.city.news = async (list) => { said.push('[소식] ' + list.length); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Rel.greatBattle = async (sp) => { specs.push(sp); sp.onWin(); return true; };
      const fresh = () => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1590, m: 3, d: 1 }; s.player.born = { y: 1560, m: 1, d: 1 }; delete s.life; delete s.odawara; delete s.teppo; s.player.gold = 10000;
        return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = OD.pending(); if (p) await OD.check(); return p; };
      // ── 날짜·도시
      let s = fresh();
      out.gate = { early: (at(s, 1589, 12, 1, 192), OD.pending()), late: (at(s, 1590, 6, 21, 192), OD.pending()), edo: (at(s, 1590, 3, 1, 297), OD.pending()), ok: (at(s, 1590, 3, 1, 192), OD.pending()) };
      // ── 사양
      await go(['no']); out.no = { join: s.odawara.join, again: OD.pending() };
      // ── ① 함께 간다 (철포 사건에서 총을 전한 적이 있다)
      s = fresh(); s.teppo = { stage: 2, met: 15700101, end: 'done', seen: {} };
      at(s, 1590, 4, 1, 192); const d0 = G.U.dayIndex(s.date); await go(['yes']);
      const sp = specs[0];
      out.call = { join: s.odawara.join, days: G.U.dayIndex(s.date) - d0, spec: sp && sp.id, back: sp && sp.backCity, sea: sp && G.Geo.isSea(sp.center.lon, sp.center.lat, 0.02), allies: sp && sp.allies.length, v: s.odawara.sea, known: said.some(x => /남만 총 상자를 부리던 선장/.test(x)) };
      // ── ② 진영 → ③ 머문다 → 8.4 항복
      at(s, 1590, 6, 1, 297); const g0 = s.player.gold, ex0 = G.R.hasItem('odawara_jinbaori'); await go(['sail', 'spare', 'yes']);
      out.camp = { camp: s.odawara.camp, wall: s.odawara.wall, masa: s.odawara.masa, stay: s.odawara.stay, surrender: s.odawara.surrender, date: s.date.y * 10000 + s.date.m * 100 + s.date.d,
        tea: said.some(x => /리큐의 차 한 잔/.test(x)), teppo: said.some(x => /남만 총 삼백 자루를 세던/.test(x)), sail: said.some(x => /남만의 돛이 일본의 성벽/.test(x)), neck: said.some(x => /여기가 날아갔을 걸세/.test(x)),
        kanto: said.some(x => /간토 여덟 주를 그대에게/.test(x)), edoLine: said.some(x => /에도 포구에 배를 대 주시오/.test(x)), gold: s.player.gold - g0, robe: !ex0 && G.R.hasItem('odawara_jinbaori'), done: OD.pending() };
      // ── 떠나면 절반 · 늦게 오면 절반
      s = fresh(); s.odawara = { told: {}, met: 1, join: 'yes', sea: 'won' }; at(s, 1590, 7, 1, 297); let g1 = s.player.gold; await go(['paper', 'quiet', 'no']);
      out.leave = { stay: s.odawara.stay, gold: s.player.gold - g1, robe: G.R.hasItem('odawara_jinbaori'), paper: said.some(x => /장사꾼의 머리/.test(x)) };
      s = fresh(); s.odawara = { told: {}, met: 1, join: 'yes', sea: 'lost' }; at(s, 1590, 9, 1, 297); g1 = s.player.gold; await go([]);
      out.late = { stay: s.odawara.stay, gold: s.player.gold - g1 };
      // ── 소식: 철포 사건 소식이 있으면 항복 소식은 그쪽에서
      s = fresh(); s.loc = { mode: 'sea', lon: 136, lat: 34 };
      const day = (y, m, d) => { s.date = { y, m, d }; return OD.daily().map(x => x.text).join(' | '); };
      out.news = { castle: day(1590, 5, 25), masa: day(1590, 7, 10), sur: day(1590, 8, 4), unify: day(1590, 9, 7), rikyu: day(1591, 4, 21) };
      s = fresh(); s.loc = { mode: 'sea', lon: 136, lat: 34 }; s.teppo = { met: 15700101, seen: {} };
      out.surTeppo = (s.date = { y: 1590, m: 8, d: 4 }, OD.daily().map(x => x.text).join(' | '));
      s = fresh(); s.date = { y: 1700, m: 1, d: 1 }; delete s.odawara; out.oldSave = OD.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'odawara');
      out.journal = !!(OD.daily && OD.daily._journal);
      out.item = G.ITEM.odawara_jinbaori && G.ITEM.odawara_jinbaori.name;
      return out;
    });
    console.log(JSON.stringify(r));
    const g = r.gate;
    ok(!g.early && !g.late && !g.edo && g.ok, '① 1590.1.1~6.20 사카이에서만 열린다');
    ok(r.no.join === 'no' && !r.no.again, '사양하면 다시 묻지 않는다');
    const c = r.call;
    ok(c.join === 'yes' && c.days === 12 && c.spec === 'odawara_blockade' && c.back === 297 && c.sea && c.allies === 3 && c.v === 'won' && c.known, '① 구키 수군과 12일 뱃길 → 사가미 앞바다(물 위) 해전 · 끝나면 에도 · 철포 사건의 선장을 알아본다');
    const m = r.camp;
    ok(m.camp && m.tea && m.teppo && m.wall === 'sail' && m.sail && m.masa === 'spare' && m.neck, '② 이시가키야마 — 리큐의 차 · 「남만 총 삼백 자루를 세던 그 선장」 · 돛천의 하룻밤 성 · 흰 수의의 마사무네');
    ok(m.stay === 'yes' && m.surrender && m.date === 15900804 && m.kanto && m.edoLine && m.gold > 5000 && m.robe && !m.done, '③ 8월 4일까지 머물면 항복 — 이에야스에게 간토 · 「에도로」 · 진바오리 · 금화 6,000 (머문 날의 품삯은 빠진다) · 끝');
    ok(r.leave.stay === 'no' && r.leave.gold === 3000 && !r.leave.robe && r.leave.paper, '항복 전에 떠나면 포상 절반 (진바오리 없음) · 종이 벽');
    ok(r.late.stay === 'late' && r.late.gold === 3000, '항복 뒤에 오면 포상 절반');
    const n = r.news;
    ok(/에도성/.test(n.castle) && /흰 수의/.test(n.masa) && /오다와라 항복/.test(n.sur) && /천하 통일/.test(n.unify) && n.rikyu === '' && !/오다와라 항복/.test(r.surTeppo), '소식 — 에도성 · 마사무네 · 항복(철포 사건 소식과 겹치지 않게) · 천하 통일 · 리큐는 진영에서 만난 사람에게만');
    ok(r.oldSave === 0 && r.rumor && r.journal && r.item === '히데요시의 진바오리', '옛 저장 · 소문 · 일지 · 진바오리');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
