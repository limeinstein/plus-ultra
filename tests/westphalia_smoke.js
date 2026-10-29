/* 베스트팔렌 조약 (2026-10-29 사용자 요청) — node tests/westphalia_smoke.js   (BROWSER_EXE=크롬 경로)
   · 인물 4명 · 시장 사건 westphaliapeace · 장면 날짜(암스테르담 ①·①' · 브레멘 ②)
   · 할리나 편 한 판(두 해 이른 독립 · 할리나가 배에): 파우가 운하의 밤을 기억 → 뮌스터의 맹세 → 그림 속에 선다 → 평화의 종 소식에 할리나 → 브레멘에서 교회를 나눠 쓴다 → 10.24 소식(69년 · 종교·땅)
   · 페르베르크 편 한 판(에스파냐 제독 · 페르베르크가 배에): 페냐란다의 말 · 문가 → 기준해대로
   · 독립 전쟁을 겪지 않은 판: 사양 → 평화의 종(①') · 67년
   · rf_westphalia 창은 띄우지 않는다 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Westphalia && G.Hist && G.World && G.DutchWar, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, WP = G.Westphalia, said = [], asked = [], out = {};
      let plan = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const fresh = (nation) => {
        G.State.newGame({ name: '시험', nation: nation || 'NL', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1648, m: 1, d: 1 }; delete s.westph; WP.state(); s.player.gold = 5000; return s;
      };
      const at = (s, y, m, d, city) => { s.date = { y, m, d }; s.loc = { mode: 'city', city }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = WP.pending(); if (p) await WP.check(); return p; };
      const daily = (s, y, m, d) => { s.date = { y, m, d }; s.loc = { mode: 'sea' }; return WP.daily(); };
      const has = (s, id) => s.player.items.some(x => x.id === id);
      out.figs = G.WESTPHALIA_FIGS.length; out.figNames = G.WESTPHALIA_FIGS.every(id => G.HIST_FIG[id] && G.Hist.speaker(id).name === G.HIST_FIG[id].name);
      out.econDef = !!(G.Econ && G.Econ.DEF && G.Econ.DEF.westphaliapeace);
      let s = fresh();
      const gate = (y, m, d, c, stt) => { at(s, y, m, d, c); s.westph = Object.assign({ told: {} }, stt || {}); return WP.pending(); };
      out.gates = {
        oathEarly: gate(1648, 2, 1, 24), oath: gate(1648, 4, 1, 24), oathBremen: gate(1648, 4, 1, 46), feast: gate(1648, 6, 10, 24, { oath: 'no' }), feastAfterOath: gate(1648, 6, 10, 24, { oath: 'go' }), feastLate: gate(1648, 9, 5, 24, { oath: 'no' }),
        table: gate(1648, 7, 1, 46), tableLate: gate(1648, 10, 25, 46), tableEarly: gate(1648, 5, 1, 46)
      };
      // ── 할리나 편 한 판 (두 해 이른 독립, 할리나가 배에)
      s = fresh('NL');
      s.dutchwar = { met: 1, side: 'free', step: 2, early: 15750301, joined: 'halina', told: {} };
      s.mates.push({ id: 'halina', role: 'none', joined: 15750301, loyal: 90, ev: 1 });
      out.link = WP.link();
      out.signNews = daily(s, 1648, 1, 31).some(m => /여든 해/.test(m.text) && /운하 어귀/.test(m.text));
      at(s, 1648, 4, 20, 24); await go(['go', 'in']);
      out.oath = { oath: s.westph.oath, pose: s.westph.pose, sketch: has(s, 'terborch_sketch'), canal: said.some(x => /^아드리안 파우: .*운하의 밤/.test(x)), halina: said.filter(x => /^할리나: /.test(x)).length, oath2: said.some(x => /두 손가락/.test(x)), terborch: said.some(x => /^헤라르트 테르보르흐: /.test(x)) };
      out.oathAgain = await go([]);
      out.oathNews = daily(s, 1648, 5, 16).some(m => /제독도 그 방에/.test(m.text));
      out.bellNews = daily(s, 1648, 6, 6).some(m => /에흐몬트/.test(m.text) && /할리나/.test(m.text));
      at(s, 1648, 7, 10, 46); await go(['share']);
      out.table = { church: s.westph.church, rope: has(s, 'verden_bell_rope'), salvius: said.some(x => /^요한 아들레르 살비우스: .*1624년 1월 1일/.test(x)), halina: said.some(x => /^할리나: .*장부 마감일/.test(x)) };
      if (!s.rel) s.rel = { seen: {} };
      const pn = daily(s, 1648, 10, 25);
      out.peace = { news: pn.some(m => /베스트팔렌 조약/.test(m.text) && /칼뱅파/.test(m.text) && /1624년 1월 1일/.test(m.text) && /스위스/.test(m.text) && /69년 만/.test(m.text) && /독일어 찬송/.test(m.text)),
        relSeen: !!(s.rel.seen && s.rel.seen.rf_westphalia), econ: (s.econ && s.econ.ev || []).some(e => e.type === 'westphaliapeace') };
      const ev = (s.econ.ev || []).find(e => e.type === 'westphaliapeace');
      out.cities = ev ? ev.cities.map(id => G.CITY_DATA[id].name) : [];
      out.relDaily = G.Rel && G.Rel.daily ? G.Rel.daily().some(m => /베스트팔렌/.test(m.text || '')) : false;
      out.pope = daily(s, 1648, 11, 27).some(m => /인노첸시오 10세/.test(m.text));
      // ── 페르베르크 편 한 판 (에스파냐 제독)
      s = fresh('ES');
      s.dutchwar = { met: 1, side: 'spain', step: 2, joined: 'verberk', told: {} };
      s.mates.push({ id: 'verberk', role: 'none', joined: 15750301, loyal: 90, ev: 1 });
      at(s, 1648, 5, 1, 24); await go(['go', 'door']);
      out.es = { pose: s.westph.pose, sketch: has(s, 'terborch_sketch'), king: said.some(x => /^아드리안 파우: .*페르베르크 저택의 곳간/.test(x)), pena: said.some(x => /^페냐란다 백작: .*폐하의 깃발/.test(x)), verberk: said.filter(x => /^페르베르크: /.test(x)).length };
      at(s, 1648, 8, 1, 46); await go(['law']);
      out.esTable = { church: s.westph.church, verberk: said.some(x => /^페르베르크: .*규칙은 규칙/.test(x)) };
      // ── 독립 전쟁을 겪지 않은 판
      s = fresh('EN');
      at(s, 1648, 3, 10, 24); await go(['no']);
      out.plain = { oath: s.westph.oath, generic: said.some(x => /할아버지들이 시작한 싸움/.test(x)) };
      at(s, 1648, 6, 8, 24); await go([]);
      out.feast = { feast: s.westph.feast, song: said.some(x => /개미와 베짱이/.test(x)), crier: said.some(x => /^암스테르담의 포고관: /.test(x)) };
      out.plainYears = daily(s, 1648, 10, 25).some(m => /67년 만/.test(m.text));
      // ── 옛 저장
      s = fresh('NL'); s.date = { y: 1660, m: 1, d: 1 }; delete s.westph;
      out.oldSave = { n: WP.daily().length, told: Object.keys(s.westph.told).length };
      out.rumor = !!(G.EVENT_RUMORS && G.EVENT_RUMORS.some(x => x.id === 'westphalia'));
      out.journal = !!(WP.daily && WP.daily._journal);
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.figs === 4 && r.figNames, '인물 4명');
    ok(r.econDef, '시장 사건 westphaliapeace');
    const g = r.gates;
    ok(!g.oathEarly && g.oath && !g.oathBremen, '뮌스터의 맹세 1648.3~5.14 암스테르담');
    ok(g.feast && !g.feastAfterOath && !g.feastLate, '평화의 종 5.15~8.31 (맹세를 보지 않았으면)');
    ok(g.table && !g.tableLate && !g.tableEarly, '1624년의 교회 6.1~10.23 브레멘');
    ok(r.link.side === 'free' && r.link.early && r.link.halina, '독립 전쟁 연결 — 할리나 편 · 두 해 이른 독립 · 할리나가 배에');
    ok(r.signNews, '뮌스터 조약 소식 (운하의 밤 한 줄)');
    const o = r.oath;
    ok(o.oath === 'go' && o.pose === 'in' && o.sketch && o.canal && o.halina >= 2 && o.oath2 && o.terborch && !r.oathAgain, '뮌스터의 맹세 — 파우가 운하의 밤을 기억 · 할리나 · 두 손가락 · 테르보르흐의 스케치');
    ok(r.oathNews && r.bellNews, '맹세 소식(제독도 그 방에) · 평화의 종(할리나)');
    ok(r.table.church === 'share' && r.table.rope && r.table.salvius && r.table.halina, '브레멘 — 1624년 기준해 · 두 신앙이 나눠 쓴다(종줄)');
    ok(r.peace.news && r.peace.relSeen && r.peace.econ && !r.relDaily, '10.24 베스트팔렌 조약 — 종교·땅·스위스 · 69년 · rf_westphalia 창은 대신 · 시장 사건');
    ok(r.cities.indexOf('프랑크푸르트') >= 0 && r.cities.indexOf('파리') < 0 && r.cities.length >= 3, '전쟁 뒤 독일 시장 — ' + r.cities.join('·'));
    ok(r.pope, '교황의 항의');
    ok(r.es.pose === 'door' && !r.es.sketch && r.es.king && r.es.pena && r.es.verberk >= 2, '페르베르크 편 · 에스파냐 제독 — 왕의 곳간 · 페냐란다 · 문가');
    ok(r.esTable.church === 'law' && r.esTable.verberk, '기준해대로 — 페르베르크의 말');
    ok(r.plain.oath === 'no' && r.plain.generic, '독립 전쟁을 겪지 않은 판 — 사양');
    ok(r.feast.feast && r.feast.song && r.feast.crier && r.plainYears, '평화의 종 · 67년 만');
    ok(r.oldSave.n === 0 && r.oldSave.told === 5, '옛 저장(1660) — 지난 소식은 띄우지 않는다');
    ok(r.rumor, '소문');
    ok(r.journal, '일지 등급');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패:', e.message); process.exit(1); });
