/* 통역관 (2026-10-25 사용자 요청): 통역으로 임명한 사람을 통역실에 두면
   ① 제 말 + 제독 + 기함의 다른 부하가 아는 말을 모아(통역 장부) 통역한다 — R.lang · 통역 창
   ② 제가 모르는 말은 「○○가 알려 주었는데 —」처럼 누구에게 물어 옮기는지 밝힌다
   ③ 말을 배우는 속도가 다른 부하보다 빠르다 (×interpRate) · 일행에게 물어 배우되 가르쳐 준 사람의 단계까지
   ④ 통역실에 두지 않았거나 통역으로 임명하지 않았으면 예전 그대로 ⑤ 제독 수첩에 통역 장부 · 선실 화면의 통역 장부 ⑥ 콘솔 오류 0
   node tests/interp_chief_smoke.js  (BROWSER_EXE=크로미움 경로 · OUT=스크린샷 폴더) */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGE = process.env.PAGE ? pathToFileURL(path.resolve(process.env.PAGE)).href : pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = process.env.OUT || path.join(ROOT, 'tmp', 'interp_chief');
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|_blob/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(PAGE);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '디오구 페헤이라', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, R = G.R, CB = G.Cabins; s.prologueDone = true; s.date = { y: 1525, m: 5, d: 1 };
      s.player.lg = G.LANGS.map(() => 0); s.player.lg[1] = 3; s.player.lg[0] = 2;
      const sh = s.fleet.ships[0]; sh.type = 'galleon'; sh.cabins = ['deck', 'interp', 'galley', 'chart'];
      // 통역 A: 아랍어(5)를 알고 중국어(7)·힌두어(8)는 모른다 · B: 중국어 3 · C: 힌두어 2 (B·C는 통역이 아니다)
      const L = G.MATES.filter(m => !m.minor && m.lg && !m.special);
      const A = L.find(m => m.lg[5] >= 2 && !m.lg[7] && !m.lg[8]);
      const B = L.find(m => m !== A && m.lg[7] >= 3 && !m.lg[5]);
      const C = L.find(m => m !== A && m !== B && m.lg[8] >= 2 && !m.lg[7] && !(m.lg[8] >= 3) && !m.lg[5]) || L.find(m => m !== A && m !== B && m.lg[8] >= 2 && !m.lg[7]);
      s.mates = [A, B, C].map(m => ({ id: m.id, role: 'none', loyal: 80 }));
      const [mA, mB, mC] = s.mates;
      const out = { A: A.name, B: B.name, C: C.name, cLv: R.mateLang(mC, 8) };
      // ④ 예전 그대로: A를 통역으로 임명만(통역실 아님) → 중국어는 아무도 옮기지 않는다
      mA.role = 'interp'; mA.room = null;
      out.before = { zh: R.lang(7), ar: R.lang(5), chief: !!CB.chiefInterp() };
      mA.role = 'none'; mA.room = 1;   // 통역실에 두었지만 통역으로 임명하지 않음
      out.roomOnly = { zh: R.lang(7), chief: !!CB.chiefInterp() };
      // ① 통역으로 임명 + 통역실 → 통역관
      mA.role = 'interp'; mA.room = 1;
      out.chief = CB.chiefInterp() && CB.chiefInterp().id;
      out.after = { zh: R.lang(7), hi: R.lang(8), ar: R.lang(5), pt: R.lang(1) };
      out.book = CB.langBook().map(e => G.LANGS[e.li] + e.lv + ':' + (e.src === 'self' ? '직접' : e.name));
      out.sit = G.Tongues.situation({ li: 7 }); out.sitAr = G.Tongues.situation({ li: 5 });
      // 다른 배의 선장이 된 C의 말은 장부에 없다
      mC.role = 'captain'; out.capHi = R.lang(8); mC.role = 'none';
      return out;
    });
    console.log('    통역 ' + r.A + ' · 중국어 ' + r.B + ' · 힌두어 ' + r.C + '(' + r.cLv + ')');
    ok(r.before.zh === 0 && !r.before.chief && r.roomOnly.zh === 0 && !r.roomOnly.chief, '예전 그대로: 통역으로 임명만 하거나 통역실에만 두면 다른 부하의 중국어는 옮기지 않는다');
    ok(r.chief && r.after.zh === 3 && r.after.hi === r.cLv && r.after.ar >= 2 && r.after.pt === 3, '통역관(통역 + 통역실): 중국어 ' + r.after.zh + ' · 힌두어 ' + r.after.hi + ' · 아랍어 ' + r.after.ar + ' · 포르투갈어 ' + r.after.pt);
    ok(r.book.length >= 4, '통역 장부: ' + r.book.join(' · '));
    ok(r.sit.mate && r.sit.mate.role === 'chief' && r.sit.mate.via === r.B && r.sit.team === 3 && r.sitAr.mate && !r.sitAr.mate.via, '중국어는 ' + r.B + '에게 물어 옮기고, 아랍어는 직접 옮긴다');
    ok(r.capHi === 0, '다른 배 선장이 된 부하의 말은 장부에서 빠진다');
    // ② 대화창: 중국 상인의 말 → 통역 창에 「○○가 알려 주었는데 —」
    await page.evaluate(() => { G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy(), null, { timeout: 60000 });
    await page.waitForTimeout(600);
    const dl = await page.evaluate(async () => {
      const p = G.UI.say('비단과 차를 실은 배가 다음 달에 광주를 떠난다고 하오. 값이 오르기 전에 사 두시오.', { name: '중국 상인', li: 7, lang: 3 });
      for (let i = 0; i < 100 && !document.querySelector('.dlg .interp'); i++) await new Promise(r => setTimeout(r, 30));
      const it = document.querySelector('.dlg .interp');
      return { name: it && it.querySelector('.iname').innerText, via: it && it.querySelector('.ivia') && it.querySelector('.ivia').innerText, text: it && it.querySelector('.itext').innerText };
    });
    await page.screenshot({ path: path.join(OUT, '1_relay_via.png') });
    ok(dl.name && /통역관/.test(dl.name) && /에게 물어/.test(dl.name) && dl.via && /알려 주었는데|물어보니|말로는|귀띔해 주기를/.test(dl.via), '통역 창: 「' + dl.name + '」 ' + (dl.text || '').replace(/\s+/g, ' ').slice(0, 70) + '…');
    await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    // ⑤ 제독 수첩 · 선실 화면
    const ui = await page.evaluate(async () => {
      for (let i = 0; i < 20 && document.querySelector('.modal-back'); i++) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); await new Promise(r => setTimeout(r, 100)); }
      G.Info.open('admiral'); await new Promise(r => setTimeout(r, 600));
      const b = document.querySelector('.ibook'); const t = b ? b.innerText : '';
      return { book: t };
    });
    await page.screenshot({ path: path.join(OUT, '2_book.png') });
    ok(/통역 장부/.test(ui.book) && /에게 물어/.test(ui.book) && /직접/.test(ui.book), '제독 수첩의 통역 장부: ' + ui.book.replace(/\s+/g, ' ').slice(0, 120));
    // ③ 배우는 속도: 400일 — 통역관 A와 보통 부하 C를 견준다 (제독의 모국어 포르투갈어)
    const lr = await page.evaluate(() => {
      const s = G.Game.state, CB = G.Cabins, [mA, mB, mC] = s.mates;
      [mA, mB, mC].forEach(m => { m.lgx = {}; m.lgd = {}; });
      [mB, mC].forEach(m => { if (m.room != null) CB.place(m, null); m.role = 'none'; delete m.ship; delete m.post; });   // 도시에 들어올 때 저절로 앉은 자리(2026-10-28 자동 배치)에서 빼 — 맞닿은 방이 아닌 보통 부하로 견준다
      // 견줄 말: 보통 부하도 아직 능숙하지 않은 말 (제독의 모국어 포르투갈어 — 둘 다 같은 하루 몫을 받는다)
      const other = [mB, mC].find(m => CB.mateLang(m, 1) < 3);
      const said = [];
      for (let d = 0; d < 400; d++) { s.day = (s.day || 0) + 1; CB.daily().forEach(x => { if (/익혔다/.test(x.text)) said.push(x.text); }); }
      return { other: G.MATE[other.id].name, dA: mA.lgd[1] || 0, dC: other.lgd[1] || 0, zhA: CB.mateLang(mA, 7), zhC: CB.mateLang(mC, 7), hiA: CB.mateLang(mA, 8), hiCap: G.R.mateLang(mC, 8), said: said.filter(t => t.indexOf(G.MATE[mA.id].name) === 0).slice(0, 3), rate: G.BALANCE.cabins.interpRate };
    });
    ok(lr.dA >= lr.dC * 1.5 && lr.dA > 0, '말 배우는 속도: 400일 동안 포르투갈어를 익힌 날 — 통역관 ' + Math.round(lr.dA) + ' · 보통 부하(' + lr.other + ') ' + Math.round(lr.dC) + ' (×' + lr.rate + ')');
    ok(lr.zhA >= 2 && lr.zhC <= 1 && lr.hiA <= lr.hiCap, '통역관은 일행에게 물어 중국어 ' + lr.zhA + '까지 (보통 부하 ' + lr.zhC + ') · 힌두어는 가르쳐 준 사람 단계(' + lr.hiCap + ')까지 ' + lr.hiA);
    console.log('    ' + lr.said.join(' / '));
    await page.waitForTimeout(300);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 4).join(' | '));
    console.log('    스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  await browser.close();
})();
