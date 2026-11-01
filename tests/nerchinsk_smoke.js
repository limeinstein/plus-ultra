/* 네르친스크 조약 (1689) (2026-11-01 사용자 요청) — node tests/nerchinsk_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 사절단: 청 1689.5.1~6.12 북경(페레이라·제르비용·송고투) / 러시아 1689.5.1~7.25 이르쿠츠크(골로빈) · 사양하면 다시 묻지 않는다
   · ② 실카 강가의 천막: 함께 가면 8.22까지 날이 지나간다 · 경계(아르군 강/아무르/바이칼) · 알바진 · 밤의 초안(라틴어로 확률)
   · ③ 조약 9.7: 「좋은 조약」이면 사본·명성·하사금 · 러시아 편은 러시아 명예 작위 · 그렇지 않아도 조약은 맺어진다
   · 소식(알바진·포위를 풀다·사절단·조약) · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Nerchinsk && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, NC = G.Nerchinsk, said = [], asked = [], out = {};
      let plan = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const fresh = (lg) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1689, m: 1, d: 1 }; s.player.born = { y: 1650, m: 1, d: 1 }; delete s.life; delete s.nerchinsk; s.player.gold = 10000;
        if (lg) Object.keys(lg).forEach(k => { s.player.lg[k] = lg[k]; });
        return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = NC.pending(); if (p) await NC.check(); return p; };
      let s = fresh();
      out.gates = { peking: (at(s, 1689, 5, 10, 188), NC.pending()), early: (at(s, 1689, 4, 20, 188), NC.pending()), pkLate: (at(s, 1689, 6, 20, 188), NC.pending()), irk: (at(s, 1689, 7, 20, 291), NC.pending()), irkLate: (at(s, 1689, 7, 30, 291), NC.pending()), other: (at(s, 1689, 5, 10, 190), NC.pending()) };
      // ── 청 편 · 라틴어 능숙 → 좋은 조약
      s = fresh({ 2: 3 }); const G0 = G.U.chance; G.U.chance = () => true;
      out.p = NC.draftP && (at(s, 1689, 5, 10, 188), NC.draftP());
      let g0 = s.player.gold; await go(['yes', 'argun', 'raze', 'draft']);
      G.U.chance = G0;
      const b = s.nerchinsk;
      out.qing = { side: b.side, joined: b.joined, border: b.border, alb: b.albazin, draft: b.draft, grade: b.grade, done: b.done, date: G.U.dateNum(s.date), copy: G.R.hasItem('nc_copy'), gold: s.player.gold - g0,
        latin: said.some(x => /라틴어로 이야기하기로/.test(x)), tents: said.some(x => /실카 강과 네르차 강/.test(x)), passport: said.some(x => /여권을 가진 상인/.test(x)), oath: said.some(x => /하늘과 신의 이름으로/.test(x)), kangxi: said.some(x => /정직하게 통역한 덕/.test(x)) };
      out.again = NC.pending();
      // ── 러시아 편 · 좋은 조약 → 러시아 명예 작위
      s = fresh({ 2: 2 }); const ru = G.COURT.realms.RU, rk0 = ru ? G.Court.rank(ru) : 0; G.U.chance = () => true;
      at(s, 1689, 6, 1, 291); await go(['yes', 'argun', 'raze', 'draft']); G.U.chance = G0;
      out.ru = { side: s.nerchinsk.side, grade: s.nerchinsk.grade, rank: ru ? G.Court.rank(ru) - rk0 : -1, golovin: said.some(x => /셀렌긴스크/.test(x)), cossack: said.some(x => /알바진은 우리 피로/.test(x)) };
      // ── 바이칼 · 위협 → 그래도 조약은 맺어진다 (보통)
      s = fresh(); at(s, 1689, 5, 20, 188); g0 = s.player.gold; await go(['yes', 'baikal', 'keep', 'threat']);
      out.bad = { grade: s.nerchinsk.grade, done: s.nerchinsk.done, copy: G.R.hasItem('nc_copy'), gold: s.player.gold - g0, angry: said.some(x => /여기서 돌아가겠소/.test(x)) };
      // ── 사양
      s = fresh(); at(s, 1689, 5, 20, 188); await go(['no']); out.no = { j: s.nerchinsk.joined, again: NC.pending(), date: G.U.dateNum(s.date) };
      // ── 라틴어가 없으면 확률이 낮다
      s = fresh(); s.player.lg = {}; s.mates = []; at(s, 1689, 5, 20, 188); out.lgDefault = JSON.stringify(G.Game.state.player.lg); out.pLow = NC.draftP();
      // ── 소식
      s = fresh(); s.loc = { mode: 'sea', lon: 121, lat: 38 };
      const day = (y, m, d) => { s.date = { y, m, d }; return NC.daily().map(x => x.text).join(' | '); };
      out.news = { a1: day(1685, 6, 23), a2: day(1686, 7, 18), truce: day(1686, 12, 1), emb: day(1689, 6, 13), treaty: day(1689, 9, 7) };
      s = fresh(); s.date = { y: 1700, m: 1, d: 1 }; delete s.nerchinsk; out.oldSave = NC.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'nerchinsk');
      out.journal = !!(NC.daily && NC.daily._journal);
      return out;
    });
    console.log(JSON.stringify({ qing: r.qing, ru: r.ru, bad: r.bad, p: r.p, pLow: r.pLow }));
    const g = r.gates;
    ok(g.peking && !g.early && !g.pkLate && g.irk && !g.irkLate && !g.other, '사절단 — 청 1689.5.1~6.12 북경 · 러시아 ~7.25 이르쿠츠크 ' + JSON.stringify(g));
    const q = r.qing;
    ok(q.side === 'qing' && q.joined === 'yes' && q.latin && q.tents && q.date >= 16890907, '① 북경의 예수회 — 라틴어로 이야기한다 · 함께 가면 실카 강가의 천막 · 9.7까지 날이 지나간다');
    ok(q.border === 'argun' && q.alb === 'raze' && q.draft === 'ok' && q.passport && q.grade === 'good', '② 아르군 강·외흥안령 · 알바진을 허문다 · 밤의 라틴어 초안 — 「여권을 가진 상인」 · 좋은 조약');
    ok(q.done && q.oath && q.copy && q.gold > 4000 && q.kangxi && r.again === false, '③ 1689.9.7 조약 — 맹세 · 라틴어 조약문 사본 · 강희제의 하사금 · 다시 열리지 않는다');
    ok(r.ru.side === 'ru' && r.ru.grade === 'good' && r.ru.rank === 1 && r.ru.golovin && r.ru.cossack, '러시아 편 — 이르쿠츠크의 골로빈(셀렌긴스크) · 카자크 · 좋은 조약이면 러시아 명예 작위');
    ok(r.bad.grade === 'ok' && r.bad.done && r.bad.copy && r.bad.gold > 1500 && r.bad.gold < 4000 && r.bad.angry, '바이칼·위협이어도 조약은 맺어진다 (보통 — 하사금이 적다)');
    ok(r.no.j === 'no' && r.no.again === false && r.no.date === 16890520, '사양하면 날이 지나가지 않고 다시 묻지 않는다');
    ok(r.p >= 0.75 && r.pLow < 0.5, '밤의 초안 확률 — 라틴어(로망스어) 능숙이면 높고 모르면 낮다 (' + r.p + ' / ' + r.pLow + ')');
    const n = r.news;
    ok(/알바진/.test(n.a1) && /톨부진/.test(n.a2) && /포위를 풀라/.test(n.truce) && /송고투/.test(n.emb) && /라틴어로 썼다/.test(n.treaty), '소식 — 알바진 두 번 · 포위를 풀다 · 사절단 · 조약');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장 · 소문 · 일지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
