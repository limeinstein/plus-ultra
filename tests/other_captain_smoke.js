/* 기함 말고 다른 배의 선장 바꾸기 (js/systems/crewauto.js CA.setCaptain · js/ui/cabinview.js CV.pickCaptain · js/city/tavern.js 부하편성)
   2026-10-31 사용자 요청: 「기함 말고 다른 배 선장 바꾸는 게 안 된다」 — 다른 배 자리는 늘 자동이라 바꿀 길이 없었고, 바꿔도 자동 채우기가 되돌렸다.
   · 「다른 배의 사람들」 창의 선장 자리를 눌러 고른다 → 그 사람이 선장, 「손」 표시
   · 손으로 정한 선장은 자동 채우기(입항·출항·달마다)와 「자동 배치」가 바꾸지 않는다
   · 두 배의 선장을 맞바꾸기 · 다른 배의 조타수였던 사람을 선장으로 → 밀려난 선장이 그 자리로
   · 기함 부관(술집 역할)을 선장으로 보내면 묻고, 부관 자리는 빈다
   · 「능력에 맞게 저절로」를 고르면 다시 자동 · 술집 부하편성의 「○○호 선장」 · 저장·불러오기 · 콘솔 오류 0
   node tests/other_captain_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => {
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, R = G.R;
      s.fleet.ships.push(R.newShip('caravel', '비토리아'), R.newShip('carrack', '트리니다드'));
      s.fleet.crew = R.crewMin() + 10;
      // 동료 다섯 (로코 + 넷)
      const ids = Object.keys(G.MATE).filter(id => id !== 'rocco' && !s.mates.some(m => m.id === id)).slice(0, 4);
      ids.forEach(id => s.mates.push({ id, loyal: 80, role: 'none' }));
      G.CrewAuto.refresh();
      window.__uid = s.fleet.ships.slice(1).map(x => x.uid);
    });
    // ① 처음에는 저절로 정해진 선장
    const r0 = await page.evaluate(() => { const CA = G.CrewAuto; return window.__uid.map(u => { const c = CA.crewOf(CA.shipByUid(u)).captain; return c ? c.id : null; }); });
    ok(r0[0] && r0[1], '처음에는 두 배 모두 선장이 저절로: ' + r0.join(', '));
    // ② 「다른 배의 사람들」 창에서 비토리아호 선장 자리를 눌러, 지금 선장이 아닌 사람을 고른다
    await page.evaluate(() => { window.__p = G.CabinView.showOthers(); });
    await page.waitForSelector('.cb-oseat.cap[data-uid]');
    const shown = await page.evaluate(() => ({ n: document.querySelectorAll('.cb-oseat.cap').length, txt: document.querySelector('.cb-others').innerText.replace(/\s+/g, ' ').slice(0, 160) }));
    ok(shown.n === 2 && /바꾸기/.test(shown.txt), '창에 선장 자리 두 개 · 「바꾸기」 표시');
    await page.click('.cb-oseat.cap[data-uid="' + (await page.evaluate(() => window.__uid[0])) + '"]');
    await page.waitForSelector('.choices .choice');
    const pick = await page.evaluate(() => {
      const CA = G.CrewAuto, cur = CA.crewOf(CA.shipByUid(window.__uid[0])).captain;
      const want = G.Game.state.mates.find(m => m !== cur && m.role !== 'first' && m.id !== 'rocco');
      window.__want = want.id;
      const ch = [...document.querySelectorAll('.choices .choice')];
      const first = ch[0].innerText;
      const el = ch.find(x => x.innerText.indexOf(G.MATE[want.id].name) >= 0); el.click();
      return { first, name: G.MATE[want.id].name, was: CB_place(want) };
      function CB_place(m) { return G.Cabins.placeName(m); }
    });
    await page.waitForTimeout(300);
    const r1 = await page.evaluate(() => { const CA = G.CrewAuto, sh = CA.shipByUid(window.__uid[0]), c = CA.crewOf(sh).captain; return { cap: c && c.id, lock: CA.locked(c), tag: !!document.querySelector('.cb-oseat.cap[data-uid="' + window.__uid[0] + '"] .cb-lock') }; });
    ok(/능력에 맞게 저절로/.test(pick.first), '고르는 창 맨 위는 「능력에 맞게 저절로」');
    ok(r1.cap === (await page.evaluate(() => window.__want)) && r1.lock && r1.tag, pick.name + '(' + pick.was + ')' + '을 비토리아호 선장으로 — 「손」 표시');
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back .foot button')].pop(); b.click(); });
    await page.evaluate(() => window.__p);
    // ③ 자동 채우기·자동 배치·달이 바뀌어도 그대로
    const r2 = await page.evaluate(() => {
      const CA = G.CrewAuto, s = G.Game.state;
      CA.refresh(); CA.autoAll(); G.Game.passDays(40); CA.refresh();
      const c = CA.crewOf(CA.shipByUid(window.__uid[0])).captain;
      const back = G.State.deserialize(G.State.serialize()), bm = back.mates.find(m => m.id === window.__want);
      return { cap: c && c.id, saved: bm.role === 'captain' && bm.ship === window.__uid[0] && bm.capLock === 1 };
    });
    ok(r2.cap === (await page.evaluate(() => window.__want)) && r2.saved, '자동 채우기·「자동 배치」·40일이 지나도 그대로 · 저장에도 남는다');
    // ④ 두 배의 선장 맞바꾸기
    const r3 = await page.evaluate(() => {
      const CA = G.CrewAuto, a = CA.shipByUid(window.__uid[0]), b = CA.shipByUid(window.__uid[1]);
      const ca = CA.crewOf(a).captain, cb = CA.crewOf(b).captain;
      CA.setCaptain(b.uid, ca);
      return { a: CA.crewOf(a).captain && CA.crewOf(a).captain.id, b: CA.crewOf(b).captain && CA.crewOf(b).captain.id, ca: ca.id, cb: cb.id, lockB: CA.locked(CA.crewOf(b).captain) };
    });
    ok(r3.b === r3.ca && r3.a === r3.cb && r3.lockB, '두 배의 선장을 맞바꾼다 (' + r3.ca + ' ↔ ' + r3.cb + ')');
    // ⑤ 기함 부관을 선장으로 — 묻고, 부관 자리는 빈다
    await page.evaluate(() => { window.__p2 = G.CabinView.pickCaptain(window.__uid[1]); });
    await page.waitForSelector('.choices .choice');
    await page.evaluate(() => { const first = G.Game.state.mates.find(m => m.role === 'first'); window.__first = first.id; [...document.querySelectorAll('.choices .choice')].find(x => x.innerText.indexOf(G.MATE[first.id].name) >= 0).click(); });
    await page.waitForTimeout(200);
    const ask = await page.evaluate(() => { const m = [...document.querySelectorAll('.modal-back')].pop(); return m ? m.innerText.replace(/\s+/g, ' ') : ''; });
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back button')].find(x => /보낸다/.test(x.textContent)); b.click(); });
    await page.evaluate(() => window.__p2);
    const r4 = await page.evaluate(() => { const CA = G.CrewAuto, c = CA.crewOf(CA.shipByUid(window.__uid[1])).captain; return { cap: c && c.id, first: (G.Game.state.mates.find(m => m.role === 'first') || {}).id || null }; });
    ok(/부관/.test(ask) && r4.cap === (await page.evaluate(() => window.__first)) && r4.first !== r4.cap, '기함 부관을 보내면 「부관 자리를 비우고 … 보내겠습니까?」 → 선장, 부관 자리는 빈다');
    // ⑥ 다시 「능력에 맞게 저절로」
    const r5 = await page.evaluate(() => { const CA = G.CrewAuto, u = window.__uid[1]; CA.setCaptain(u, null); const c = CA.crewOf(CA.shipByUid(u)).captain; return { lock: CA.locked(c), cap: c && c.id }; });
    ok(!r5.lock && r5.cap, '「능력에 맞게 저절로」를 고르면 손 표시가 풀리고 다시 자동 (' + r5.cap + ')');
    // ⑦ 술집 부하편성: 사람마다 「○○호 선장」
    const r6 = await page.evaluate(async () => {
      const s = G.Game.state, T = G.Scenes.city.B.tavern, CA = G.CrewAuto;
      const m = s.mates.find(x => x.role === 'crew' || (x.role === 'none' && x.room != null)) || s.mates.find(x => x.role !== 'first' && x.role !== 'captain');
      const name = G.MATE[m.id].name, sh = CA.shipByUid(window.__uid[1]);
      const p = T.organize();
      const step = async (fn) => { for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 50)); if (document.querySelector('.choices .choice')) break; } return fn(); };
      await step(() => [...document.querySelectorAll('.choices .choice')].find(x => x.innerText.indexOf(name) === 0 || x.innerText.trim().startsWith(name)).click());
      const labels = await step(() => [...document.querySelectorAll('.choices .choice')].map(x => x.innerText.replace(/\s+/g, ' ')));
      [...document.querySelectorAll('.choices .choice')].find(x => x.innerText.indexOf(sh.name + '호 선장') >= 0).click();
      await step(() => { const b = [...document.querySelectorAll('.modal-back')].pop(); const x = b && b.querySelector('.title .x'); if (x) x.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
      await p;
      const c = CA.crewOf(sh).captain;
      return { labels: labels.filter(l => /호 선장/.test(l)), cap: c && c.id, want: m.id, lock: CA.locked(c) };
    });
    ok(r6.labels.length === 2 && r6.cap === r6.want && r6.lock, '술집 부하편성 → 역할에 「' + r6.labels.join(' / ').slice(0, 80) + '」 → 고르면 그 배 선장 (손)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
