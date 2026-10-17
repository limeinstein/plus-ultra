/* 선실 추천 인물 · 특기/능력치 표시 · 선장 임명 때의 「대기」 점검 — node tests/cabin_recommend_smoke.js   (BROWSER_EXE=크롬 경로)
   · 선실에 앉은 부하(역할 없음)는 R.roleName이 「대기」가 아니라 그 방 이름 (항구 「선장 임명」·「부하와 이야기」 목록)
   · 선실의 부하를 다른 배 선장으로 보내면, 밀려난 원래 선장이 그 선실을 넘겨받는다
   · 선실을 누르면: 맞는 특기 순으로 줄을 세우고 1위에 「★ 추천」, 창 위에 추천 한 줄, 사람마다 특기·능력치(체력·지력·무력·매력)
   · 오른쪽 부하 명단에 특기·능력치 줄. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'cabin_recommend');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FILE_NOT_FOUND/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, CB = G.Cabins, R = G.R, T = G.Scenes.city.B.tavern, out = {};
      const big = Object.keys(G.SHIP).map(id => ({ id, n: CB.slots({ type: id }) })).sort((a, b) => b.n - a.n)[0];
      s.fleet.ships[0].type = big.id; s.fleet.ships[0].cabins = null; s.fleet.cabinUid = null;
      const second = JSON.parse(JSON.stringify(s.fleet.ships[0])); second.uid = 'test2'; second.name = '둘째'; second.type = 'caravel'; delete second.cabins;
      s.fleet.ships.push(second);
      // 요리에 밝은 사람 셋(단계 다르게) · 아무나 한 사람(선장)
      const cooks = Object.keys(G.MATE).filter(id => G.MATE[id].sk && G.MATE[id].sk.cook).sort((a, b) => G.MATE[b].sk.cook - G.MATE[a].sk.cook);
      const other = Object.keys(G.MATE).filter(id => !(G.MATE[id].sk && G.MATE[id].sk.cook) && cooks.indexOf(id) < 0)[3];
      s.mates = [];
      const add = id => { const m = { id, role: 'none', loyal: 80 }; s.mates.push(m); return m; };
      const lo = add(cooks[cooks.length - 1]), hi = add(cooks[0]), cap = add(other);
      out.cookHi = G.MATE[hi.id].name; out.cookLo = G.MATE[lo.id].name;
      CB.remodel(1, 'galley'); CB.remodel(2, 'galley'); CB.remodel(3, 'chapel');
      T.assign(cap, 'cap:test2');
      CB.place(lo, 1);
      out.loRole = R.roleName(lo);          // 예전: 「대기」
      out.capRole = R.roleName(cap);
      // 선실의 lo를 둘째 배 선장으로 → 밀려난 cap이 1번 요리실을 넘겨받는다
      T.assign(lo, 'cap:test2');
      out.loAfter = R.roleName(lo); out.capAfterRoom = cap.room; out.capAfter = R.roleName(cap);
      // 다시 처음처럼: lo는 대기, cap은 선장 (화면 점검용)
      T.assign(cap, 'cap:test2');           // 맞바꾸기: cap이 다시 선장, 밀려난 lo가 cap의 요리실로
      out.swapBack = lo.room;
      CB.place(lo, null);
      out.loIdle = R.roleName(lo);
      G.Game.go('city', { city: s.player.home });
      return out;
    });
    console.log(r);
    ok(r.loRole === '요리실', '선실에 앉은 부하는 「대기」가 아니라 방 이름: ' + r.loRole);
    ok(/선장/.test(r.capRole), '선장은 그대로 선장: ' + r.capRole);
    ok(/선장/.test(r.loAfter) && r.capAfterRoom === 1 && r.capAfter === '요리실', '선실 사람을 선장으로 보내면 밀려난 선장이 그 선실을 넘겨받음: ' + r.capAfter);
    ok(r.swapBack === 1, '다시 맞바꾸면 lo가 요리실로 돌아감');
    ok(r.loIdle === '대기', '방도 역할도 없으면 그대로 「대기」');

    await page.waitForTimeout(1500);
    await page.evaluate(() => { G.CabinView.open(); });
    await page.waitForSelector('.cb-card[data-i="2"]', { timeout: 20000 });
    const ros = await page.evaluate(() => [...document.querySelectorAll('.cb-roster .cb-mate')].map(x => x.textContent));
    console.log(ros);
    ok(ros.length === 3 && ros.every(t => /체\d+ 지\d+ 무\d+ 매\d+/.test(t)), '부하 명단에 능력치 줄 (체·지·무·매)');
    ok(ros.some(t => /요리 \d/.test(t)), '부하 명단에 특기 줄');
    await page.screenshot({ path: path.join(OUT, '1_cabin.png') });
    // 방을 누르면: 선실 창은 그대로 두고 그 옆에 팝업
    await page.click('.cb-card[data-i="2"]');
    await page.waitForSelector('.cb-pop .cb-pop-row', { timeout: 10000 });
    const dlg = await page.evaluate(() => ({
      stage: !!document.querySelector('.cb-stage'), choices: document.querySelectorAll('.choices').length,
      faces: [...document.querySelectorAll('.cb-pop .cb-pop-row .cb-face')].map(f => !!f.querySelector('canvas, img, span')),
      ch: [...document.querySelectorAll('.cb-pop .cb-pop-row')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
      head: document.querySelector('.cb-pop-h').textContent, sel: !!document.querySelector('.cb-card.cb-sel[data-i="2"]'),
      inside: (() => { const p = document.querySelector('.cb-pop').getBoundingClientRect(), w = document.querySelector('.cb-pop').parentElement.getBoundingClientRect(); return p.left >= w.left - 1 && p.right <= w.right + 1; })()
    }));
    console.log(dlg.ch);
    ok(dlg.stage && dlg.choices === 0, '선실 창이 보이는 채로 팝업이 뜬다 (따로 고르는 창 없음)');
    ok(dlg.sel && dlg.inside, '누른 방이 밝게 표시되고 팝업은 선실 창 안에');
    ok(dlg.faces.length === 3 && dlg.faces.every(Boolean), '사람마다 작은 얼굴');
    ok(dlg.ch[0].indexOf(r.cookHi) >= 0 && /★ 추천/.test(dlg.ch[0]), '요리를 가장 잘하는 사람이 맨 위에 「★ 추천」: ' + r.cookHi);
    ok(/추천 2/.test(dlg.ch[1]), '둘째로 잘하는 사람은 「추천 2」');
    ok(dlg.ch.every(t => /특기 /.test(t) && /체\d+ 지\d+ 무\d+ 매\d+/.test(t)), '사람마다 특기와 능력치');
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT, '2_pick.png') });
    // Esc는 팝업만 닫는다
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => !document.querySelector('.cb-pop') && !!document.querySelector('.cb-stage')), 'Esc는 팝업만 닫고 선실 창은 남는다');
    // 다시 열어 추천 1위를 누르면 그 방에 앉는다
    await page.click('.cb-card[data-i="2"]');
    await page.waitForSelector('.cb-pop .cb-pop-row.best', { timeout: 10000 });
    await page.click('.cb-pop .cb-pop-row.best');
    await page.waitForFunction(() => document.querySelector('.cb-card[data-i="2"] .cb-who'), null, { timeout: 10000 });
    ok(await page.evaluate(n => document.querySelector('.cb-card[data-i="2"]').textContent.indexOf(n) >= 0, r.cookHi), '팝업에서 고른 사람이 2번 요리실에 앉는다');
    // 부하를 누르면: 그 사람의 특기·능력치와 둘 방 (잘 맞는 방에 「★ 잘 맞음」)
    await page.click('.cb-roster .cb-mate:nth-child(2)');
    await page.waitForSelector('.cb-pop.cb-pop-mate .cb-pop-row', { timeout: 10000 });
    const pr = await page.evaluate(() => ({ d: document.querySelector('.cb-pop-d').textContent.replace(/\s+/g, ' '), big: !!document.querySelector('.cb-pop-h .cb-face.big canvas, .cb-pop-h .cb-face.big span'), ch: [...document.querySelectorAll('.cb-pop .cb-pop-row')].map(x => x.textContent.replace(/\s+/g, ' ').trim()), occ: document.querySelectorAll('.cb-pop .cb-occ .cb-face').length }));
    console.log(pr.ch.slice(0, 6));
    ok(/특기 .*능력 체력 \d+/.test(pr.d) && pr.big, '부하 팝업: 얼굴·특기·능력치');
    ok(pr.ch.some(t => /★ 잘 맞음/.test(t)), '가장 잘 맞는 방에 「★ 잘 맞음」');
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT, '3_room.png') });
    await page.mouse.click(400, 860);   // 팝업 밖
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => !document.querySelector('.cb-pop')), '팝업 밖을 누르면 닫힌다');
    // 갑판 위 부관실 얼굴표도 팝업
    await page.evaluate(() => document.querySelectorAll('.cb-medal')[3].click());
    await page.waitForSelector('.cb-pop .cb-pop-row', { timeout: 10000 });
    ok(/부관실/.test(await page.evaluate(() => document.querySelector('.cb-pop-h').textContent)), '갑판 위 자리(부관실)도 팝업');
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT, '4_medal.png') });
    await page.keyboard.press('Escape');
    // 통역실: 제독이 모르는 말 순으로 추천, 오류 없이 열린다
    await page.evaluate(() => { G.Cabins.remodel(4, 'interp'); document.querySelectorAll('.win .close, .window-close').forEach(b => b.click()); });
    await page.waitForTimeout(300);
    const it = await page.evaluate(async () => { const p = G.UI.choose; let got = null; G.UI.choose = async (t, o, x) => { got = { t, o: o.map(v => v.label + ' | ' + (v.right || '')), x: x && x.text }; return null; }; try { await (G.CabinView._pickFor ? G.CabinView._pickFor('interp', 4) : null); } finally { G.UI.choose = p; } return got; });
    if (it) { console.log(it.o); ok(/말 \d가지|더할 말 없음/.test(it.o.join(' ')), '통역실 추천은 말로 센다'); }
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('통과 — 그림: ' + OUT);
  } catch (e) {
    console.error('실패:', e.message, errors);
    await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {});
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
