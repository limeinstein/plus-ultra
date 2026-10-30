/* 갈릴레오와 피사의 사탑 (2026-10-30 사용자 요청) — node tests/galpisa_smoke.js   (BROWSER_EXE=크롬 경로)
   · 장면은 피사에서 날짜에 맞게 (등불 1583~1585.6 · 사탑 1589.10~1592.6)
   · ① 등불: 모래시계를 빌려주고 「같다」를 맞히면 탐험 명성 · 「기도나 하게」면 물음 없음
   · ② 사탑: 「동시에」에 건 내기(금화 +500) · 「둘」에 놓으면 다시(교수가 아리스토텔레스 만세) → 「셋」에 · 손가락 두 마디 · 깃털 · 쇠공 · 사탑 단서 · 갈릴레오 합류
   · 가벼운 쪽에 걸면 −500 · 합류를 사양하면 1592 파도바로 소식 · 1612 코레시오 · 1654 비비아니 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
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
    await page.waitForFunction(() => window.G && G.Game && G.GalPisa && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, GP = G.GalPisa, said = [], asked = [], out = {};
      let plan = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const fresh = () => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1580, m: 1, d: 1 }; delete s.galPisa; s.player.gold = 5000; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c == null ? 31 : c }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = GP.pending(); if (p) await GP.check(); return p; };
      const hired = (s) => s.mates.some(m => m.id === 'galileo');
      let s = fresh();
      const gate = (y, m, d, c, st) => { at(s, y, m, d, c); s.galPisa = Object.assign({ told: {} }, st || {}); return GP.pending(); };
      out.gates = { lamp: gate(1583, 6, 1), lampEarly: gate(1582, 12, 1), lampFlorence: gate(1583, 6, 1, 30), lampLate: gate(1585, 7, 1), tower: gate(1590, 3, 1), towerEarly: gate(1589, 9, 1, 31, { lamp: 'pray' }), towerLate: gate(1592, 7, 1) };
      // ── ① 등불
      s = fresh(); at(s, 1583, 6, 1); const ex0 = s.player.fame;
      await go(['glass', 'same']);
      out.lamp = { v: s.galPisa.lamp, iso: s.galPisa.iso, q: asked[1] && asked[1].opts, pulse: said.some(x => /맥박을 세고 있어요/.test(x)), clock: said.some(x => /시계를 만들 수도/.test(x)), log: s.log.some(x => /흔들리는 등불/.test(x.t)) };
      // ── ② 사탑: 동시에 걸고, 둘에 놓았다가 다시 셋에, 깃털도, 합류
      at(s, 1590, 4, 1); let g0 = s.player.gold;
      await go(['same', 'two', 'three', 'yes', 'yes']);
      out.tower = { done: s.galPisa.tower, bet: s.galPisa.bet, win: s.galPisa.betWin, gold: s.player.gold - g0, tries: s.galPisa.tries, drop: s.galPisa.drop,
        remember: said.some(x => /대성당의 그 선장님/.test(x)), aristotle: said.some(x => /아리스토텔레스 만세/.test(x)), fingers: said.some(x => /손가락 두 마디/.test(x)), feather: said.some(x => /공기가 없는 곳이 있다면/.test(x)),
        ball: G.R.hasItem('galileo_ball'), hint: !!(s.hints && s.hints.pisa), hired: hired(s), mast: said.some(x => /돛대 꼭대기에서 돌을/.test(x)) };
      out.again = (at(s, 1591, 1, 1), GP.pending());
      // ── 가벼운 쪽에 걸고, 합류를 사양
      s = fresh(); at(s, 1591, 5, 1); g0 = s.player.gold;
      await go(['light', 'watch', 'no', 'no']);
      out.lose = { gold: g0 - s.player.gold, drop: s.galPisa.drop, hired: hired(s), join: s.galPisa.join, lampNone: !s.galPisa.lamp };
      s.loc = { mode: 'sea', lon: 10, lat: 43 };
      s.date = { y: 1592, m: 9, d: 26 }; out.padua = GP.daily().map(x => x.text).join(' | ');
      s.date = { y: 1612, m: 6, d: 1 }; out.coresio = GP.daily().map(x => x.text).join(' | ');
      s.date = { y: 1654, m: 1, d: 1 }; out.viviani = GP.daily().map(x => x.text).join(' | ');
      // ── 내기 없이 · 갈릴레오가 이미 배에 있으면
      s = fresh(); at(s, 1590, 4, 1); G.Legend.join('galileo', null); await go(['none', 'three', 'no']);
      out.aboard = { done: s.galPisa.tower, bet: s.galPisa.bet, line: said.some(x => /우리 배의 대포알/.test(x)), noJoinAsk: !asked.some(a => a.opts.join() === 'yes,no' && /배에 타고 싶다/.test(a.t)) };
      // ── 옛 저장
      s = fresh(); s.date = { y: 1700, m: 1, d: 1 }; delete s.galPisa; out.oldSave = GP.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'galpisa');
      out.journal = !!(GP.daily && GP.daily._journal);
      out.item = G.ITEM.galileo_ball && G.ITEM.galileo_ball.name;
      return out;
    });
    console.log(JSON.stringify({ lamp: r.lamp, tower: r.tower, lose: r.lose }));
    const g = r.gates;
    ok(g.lamp && !g.lampEarly && !g.lampFlorence && !g.lampLate && g.tower && !g.towerEarly && !g.towerLate, '장면이 피사에서 날짜에 맞게 열린다 ' + JSON.stringify(g));
    ok(r.lamp.v === 'glass' && r.lamp.iso && r.lamp.q.join() === 'short,same,long' && r.lamp.pulse && r.lamp.clock && r.lamp.log, '① 흔들리는 등불 — 모래시계 · 「같다」 (등시성) · 「언젠가 시계를」');
    const t = r.tower;
    ok(t.done === 'done' && t.remember && t.bet === 'same' && t.win && t.gold === 500, '② 사탑 — 등불의 선장을 기억 · 「동시에」에 건 내기 금화 +500');
    ok(t.tries === 2 && t.aristotle && t.drop === 'three' && t.fingers, '「둘」에 놓으면 대포알이 먼저 — 교수들이 「아리스토텔레스 만세」 → 다시 「셋」에 · 손가락 두 마디');
    ok(t.feather && t.ball && t.hint && t.mast && t.hired && !r.again, '깃털과 공기 · 사탑에서 떨어뜨린 쇠공 · 사탑 단서 · 「돛대 꼭대기에서 돌을」 → 갈릴레오 합류 · 다시 열리지 않는다');
    ok(r.lose.gold === 500 && r.lose.drop === 'late' && !r.lose.hired && r.lose.join === 'no' && r.lose.lampNone, '가벼운 쪽에 걸면 −500 · 「보고 놓는다」는 조금 늦게 · 합류 사양');
    ok(/파도바/.test(r.padua) && /코레시오/.test(r.coresio) && /손가락 두 마디/.test(r.coresio) && /비비아니/.test(r.viviani) && /대포알이 있었다는 이야기는 적혀 있지 않다/.test(r.viviani), '소식 — 1592 파도바로 · 1612 코레시오의 반박 · 1654 비비아니의 기록');
    ok(r.aboard.done === 'done' && r.aboard.bet === 'none' && r.aboard.line && r.aboard.noJoinAsk, '갈릴레오가 이미 배에 있으면 「우리 배의 대포알」 · 합류를 다시 묻지 않는다');
    ok(r.oldSave === 0 && r.rumor && r.journal && r.item === '사탑에서 떨어뜨린 쇠공', '옛 저장 · 소문 · 일지 · 소지품');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
