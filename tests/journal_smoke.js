/* 항해 일지의 중요도 (2026-10-23) — node tests/journal_smoke.js   (BROWSER_EXE=크롬 경로)
   · A 발견·탐험: 경쟁 탐험가의 출항 소식(알림이 뜨지 않는 발견도)·채비·발표 — 같은 날 같은 일은 한 줄
   · B 전쟁·정치: 나라 사이의 전쟁, 역사 속 도시 점령   · C 재해·세상: 멀리서 일어난 역사 속 지진도
   · D 일상: 아이와 보낸 시간   · 옛 줄(등급 없음)은 글로 가린다 · 넘치면 오래된 D부터
   · 수첩 「일지」: 등급 표시 없이 날짜와 내용만 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'journal');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Journal && G.Journal.hooked, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, J = G.Journal, out = { hooked: J.hooked };
      const lastG = () => s.log[s.log.length - 1];
      const find = (re) => s.log.filter(e => re.test(e.t));
      // D: 아이와 보낸 시간
      G.State.log('「바닷가의 조개잡이」 — 미겔과 함께 보낸 시간.'); out.kid = lastG().g;
      // A: 디아스의 출항 소식 — 아프리카 남단(세력 1)은 단서·계약이 없으면 알림이 뜨지 않는다
      s.date = { y: 1487, m: 8, d: 1 };
      const news1 = G.Disc.rivals();
      out.diasPopup = news1.some(m => /디아스/.test(m.text || ''));
      out.diasLog = find(/디아스가 캐러벨/).map(e => e.g);
      // A: 발표 — 같은 날 같은 일은 한 줄
      s.date = { y: 1488, m: 2, d: 1 };
      const news2 = G.Disc.rivals();
      const capeName = G.DISC.capegood.name;
      out.announce = { popup: news2.filter(m => m.icon === 'flag').length, lines: s.log.filter(e => e.d === 14880201 && e.t.indexOf(capeName) >= 0).map(e => e.g) };
      // B: 나라 사이의 전쟁
      G.Rel.daily(); const lenB = s.log.length;
      const t0 = G.U.dateNum(s.date);
      G.Rel.set('FR', 'EN', -100, t0 + 10000, '시험 전쟁');
      const nw = G.Rel.daily();
      out.warPopup = nw.filter(m => /전쟁|파국/.test(m.text || '')).length;
      out.war = s.log.slice(lenB).filter(e => /전쟁|파국/.test(e.t)).map(e => e.g + ' ' + e.t.slice(0, 40));
      // B·A: 역사의 흐름 (몬카스트로 점령 · 디아스 귀환)
      s.history = 0; s.date = { y: 1488, m: 12, d: 31 };
      G.World.daily();
      out.hist = s.log.filter(e => /몬카스트로|메흐메트|미나 요새|디아스가 아프리카 남단을 돌아/.test(e.t)).map(e => e.g + ' ' + e.t.slice(0, 26));
      // C: 멀리서 일어난 역사 속 지진 (알림은 없어도 일지에)
      s.loc = { mode: 'city', city: 0, lon: -9.1, lat: 38.7 };
      G.Disaster.start({ kind: 'quake', name: '시험 대지진', place: '먼 동쪽 바닷가', lon: 140, lat: 35, sev: 1, hist: true });
      out.quake = find(/시험 대지진/).map(e => e.g);
      // 옛 줄 (등급 없음)
      s.log.push({ d: 14800105, t: '오스만 제국이 로도스를 포위했다.' }); out.oldB = J.of(lastG());
      s.log.pop();
      // 일지 창: 등급 표시 없이 날짜와 내용만
      G.Info.open('log');
      await new Promise(res => setTimeout(res, 600));
      const box = document.querySelector('.win .content') || document.body;
      out.ui = { quake: /시험 대지진/.test(box.textContent), dias: /디아스가 캐러벨/.test(box.textContent), badges: document.querySelectorAll('.jr-g,[data-jf]').length };
      // 넘치면 오래된 D부터
      const firstA = s.log.find(e => e.g === 'A');
      for (let i = 0; i < 900; i++) G.State.log('아들과 갑판을 닦았다 ' + i, 'D');
      out.cap = { len: s.log.length, keptA: s.log.indexOf(firstA) >= 0 };
      return out;
    });
    await page.screenshot({ path: path.join(OUT, 'journal.png') });
    console.log(JSON.stringify(r, null, 1));
    ok(r.hooked >= 14, '소식을 내는 체계 ' + r.hooked + '곳에 등급을 붙였다');
    ok(r.kid === 'D', '아이와 보낸 시간은 D (일상)');
    ok(!r.diasPopup && r.diasLog.length === 1 && r.diasLog[0] === 'A', '디아스의 출항 — 알림은 없어도 일지에 A');
    ok(r.announce.popup === 1 && r.announce.lines.length === 1 && r.announce.lines[0] === 'A', '경쟁자의 발표는 A로 한 줄 (같은 일 두 번 적지 않는다)');
    ok(r.warPopup === 1 && r.war.length === 1 && /^B/.test(r.war[0]), '나라 사이의 전쟁은 B — ' + r.war.join(' | '));
    ok(r.hist.some(x => /^B .*몬카스트로/.test(x)) && r.hist.some(x => /^A .*디아스/.test(x)), '역사의 흐름: 도시 점령 B, 큰 항해 A — ' + r.hist.join(' | '));
    ok(r.quake.length === 1 && r.quake[0] === 'C', '멀리서 일어난 역사 속 지진도 C로 일지에');
    ok(r.oldB === 'B', '옛 줄은 글을 보고 가린다');
    ok(r.ui.quake && r.ui.dias && r.ui.badges === 0, '일지 창: 등급 표시 없이 내용만 (출항 소식·지진이 보인다)');
    ok(r.cap.len === 800 && r.cap.keptA, '800줄을 넘으면 오래된 일상부터 지우고 큰일은 남긴다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
