/* 여러 개 고르기 창의 전체 선택·전체 해제·찾기 (UI.checkTools — 2026-10-28 제안 「발견물 보고 때 전체 선택·해제·검색」)
   · 후원자 일괄 보고: 처음엔 모두 골라짐 → 전체 해제 · 이름 찾기 · 찾은 것만 선택 · 줄을 눌러 하나 빼고 보고 → 뺀 것만 남는다
   · 항구 발표: 전체 선택 뒤 하나 빼고 「선택한 발견 발표」
   · 교역소 매각: 전체 선택 · 찾기 · 하나 빼고 「고른 것 한꺼번에 판다」 → 일괄 매각 창의 수량 막대를 끌면 그 수량으로 다시 셈
   node tests/multi_pick_smoke.js */
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
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Sponsor && G.Scenes.city && G.Scenes.city.B.harbor, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const sleep = ms => new Promise(x => setTimeout(x, ms));
      const until = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < (ms || 5000)) { const v = fn(); if (v) return v; await sleep(40); } return null; };
      await G.Game.ensureGeo();
      const SP = G.Sponsor, UI = G.UI, out = {};
      UI.say = async () => {}; G.Game.refreshHud = () => {};
      const toasts = []; const toast0 = UI.toast; UI.toast = (t) => { toasts.push(String(t)); };
      const s = G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.player.fame = 99999; s.sponsors.pt_king = { trust: 60, met: 3, done: 1, fail: 0, anger: 0 };
      const ids = G.DISCOVERIES.filter(d => d.how !== 'trade' && d.pw <= 3 && !d.rival && d.lat !== 0).slice(0, 5).map(d => d.id);
      ids.forEach(id => { s.disc[id] = { found: true, me: true, day: 1, grade: 'chart' }; });
      SP.interest = () => 3.5;
      if (G.Names) G.Names.onReport = async () => {};
      const sp = G.SPONSOR.pt_king;
      // ① 후원자 일괄 보고
      const p1 = SP.batchReport(sp);
      const win = await until(() => document.querySelector('.cktools') && document.querySelector('.cktools').closest('.win'));
      const boxes = () => [...win.querySelectorAll('tr[data-ck] input[type=checkbox]')];
      const cnt = () => win.querySelector('.ck-count').textContent;
      out.rep = { n: boxes().length, init: boxes().filter(b => b.checked).length, c0: cnt() };
      win.querySelector('.ck-none').click(); out.rep.none = boxes().filter(b => b.checked).length; out.rep.cNone = cnt();
      const goBtn = () => [...win.querySelectorAll('.foot .btn')].find(b => /보고한다/.test(b.textContent));
      goBtn().click(); await sleep(60); out.rep.stillOpen = win.isConnected; out.rep.toast = toasts.slice(-1)[0];
      const name1 = G.DISC[ids[1]].name, q = win.querySelector('.ck-q');
      q.value = name1; q.dispatchEvent(new Event('input'));
      out.rep.shown = [...win.querySelectorAll('tr[data-ck]')].filter(r => r.style.display !== 'none').length; out.rep.allLabel = win.querySelector('.ck-all').textContent;
      win.querySelector('.ck-all').click(); out.rep.searchAll = boxes().filter(b => b.checked).length;
      q.value = ''; q.dispatchEvent(new Event('input'));
      win.querySelector('.ck-all').click();
      // 줄(이름 칸)을 눌러 하나 뺀다
      const row0 = win.querySelector('tr[data-ck]'), name0 = row0.querySelector('b').textContent;
      row0.cells[1].click();
      out.rep.afterRow = boxes().filter(b => b.checked).length; out.rep.sum = win.querySelector('.bt-sum').textContent;
      goBtn().click();
      const sumWin = await until(() => [...document.querySelectorAll('.win')].find(w => /일괄 보고 —/.test(w.textContent)));
      if (sumWin) sumWin.querySelector('.foot .btn').click();
      const res = await p1;
      out.rep.done = res && res.n; out.rep.left = G.Disc.unreported().map(d => d.name); out.rep.name0 = name0;
      // ② 항구 발표: 남은 것 + 새로 넷
      const more = G.DISCOVERIES.filter(d => d.how !== 'trade' && d.pw <= 3 && !d.rival && d.lat !== 0 && ids.indexOf(d.id) < 0).slice(0, 4).map(d => d.id);
      more.forEach(id => { s.disc[id] = { found: true, me: true, day: 1, grade: 'chart' }; });
      const list = G.Disc.unreported();
      const p2 = G.Scenes.city.B.harbor.pickAnnouncements(list);
      const w2 = await until(() => [...document.querySelectorAll('.win')].find(w => /발표할 발견물/.test(w.textContent)));
      const b2 = () => [...w2.querySelectorAll('input[data-disc]')];
      out.ann = { n: b2().length, init: b2().filter(b => b.checked).length };
      w2.querySelector('.ck-all').click(); out.ann.all = b2().filter(b => b.checked).length;
      b2()[0].click(); out.ann.after = b2().filter(b => b.checked).length; out.ann.cnt = w2.querySelector('.ck-count').textContent;
      [...w2.querySelectorAll('.foot .btn')].find(b => /선택한 발견 발표/.test(b.textContent)).click();
      const picked = await p2; out.ann.picked = picked.length; out.ann.skip = picked.indexOf(b2().length ? null : list[0].id) < 0 && picked.indexOf(list[0].id) < 0;
      // ③ 교역소 매각 → 일괄 매각 창의 수량 막대
      const c = G.CITY_DATA[s.player.home]; s.loc.mode = 'city'; s.loc.city = c.id;
      const goods = Object.keys(G.GOOD).filter(id => !(G.Slave && G.Slave.is(id))).slice(0, 4);
      s.fleet.cargo = {}; goods.forEach(id => { s.fleet.cargo[id] = { q: 10, cost: 50, d: s.day, from: 99 }; });
      const p3 = G.Scenes.city.B.trade.sell(c);
      const w3 = await until(() => [...document.querySelectorAll('.win')].find(w => /^매각/.test((w.querySelector('.title') || {}).textContent || '')));
      const b3 = () => [...w3.querySelectorAll('input.bpick')];
      out.sell = { n: b3().length, init: b3().filter(b => b.checked).length };
      w3.querySelector('.ck-all').click(); out.sell.all = b3().filter(b => b.checked).length;
      const q3 = w3.querySelector('.ck-q'); q3.value = G.GOOD[goods[2]].name; q3.dispatchEvent(new Event('input'));
      out.sell.shown = [...w3.querySelectorAll('tr.click')].filter(r => r.style.display !== 'none').length;
      q3.value = ''; q3.dispatchEvent(new Event('input'));
      w3.querySelector('tr.click td.pick').click();       // 첫 품목을 뺀다 (네모 칸을 눌러)
      out.sell.after = b3().filter(b => b.checked).length;
      [...w3.querySelectorAll('.foot .btn')].find(b => /고른 것 한꺼번에/.test(b.textContent)).click();
      const w4 = await until(() => [...document.querySelectorAll('.win')].find(w => /일괄 매각/.test(w.textContent) && w.querySelector('input.bqr')));
      out.sell.batchRows = w4.querySelectorAll('input.bqr').length;
      const rg = w4.querySelector('input.bqr'), gid = rg.dataset.id;
      rg.value = '4'; rg.dispatchEvent(new Event('input')); out.sell.live = w4.querySelector('input.bq[data-id="' + gid + '"]').value;
      rg.dispatchEvent(new Event('change'));
      const w5 = await until(() => { const w = [...document.querySelectorAll('.win')].find(x => /일괄 매각/.test(x.textContent) && x.querySelector('input.bqr')); return w && w !== w4 ? w : null; });
      out.sell.redrawn = !!w5; out.sell.qty = w5 && w5.querySelector('input.bq[data-id="' + gid + '"]').value;
      out.sell.rangeAfter = w5 && w5.querySelector('input.bqr[data-id="' + gid + '"]').value;
      // 그만두고 나온다
      [...w5.querySelectorAll('.foot .btn')].find(b => /돌아간다/.test(b.textContent)).click();
      const w6 = await until(() => [...document.querySelectorAll('.win')].find(w => /^매각/.test((w.querySelector('.title') || {}).textContent || '')));
      if (w6) [...w6.querySelectorAll('.foot .btn')].find(b => /돌아간다/.test(b.textContent)).click();
      await Promise.race([p3, sleep(1500)]);
      UI.toast = toast0;
      return out;
    });
    console.log('    ' + JSON.stringify(r));
    const R = r.rep;
    ok(R.n === 5 && R.init === 5 && /5<\/b>|5 \/ 5/.test(R.c0), '일괄 보고: 처음엔 5건 모두 골라져 있다 (' + R.c0 + ')');
    ok(R.none === 0 && R.stillOpen && /하나 이상/.test(R.toast || ''), '「전체 해제」 → 0건, 그대로 보고하면 창이 남고 「하나 이상 고르십시오」');
    ok(R.shown === 1 && /찾은 것 모두 선택/.test(R.allLabel) && R.searchAll === 1, '이름 찾기 → 1줄만 보이고 「찾은 것 모두 선택」은 그 줄만 고른다');
    ok(R.afterRow === 4 && /4건/.test(R.sum), '전체 선택 뒤 줄을 눌러 하나 뺌 → 4건 (' + R.sum + ')');
    ok(R.done === 4 && R.left.length === 1 && R.left[0] === R.name0, '보고는 4건, 뺀 「' + R.name0 + '」만 보고하지 않은 채 남는다');
    const A = r.ann;
    ok(A.n === 5 && A.init === 0 && A.all === 5 && A.after === 4 && A.picked === 4, '항구 발표: 전체 선택 5 → 하나 빼고 4건 발표 (' + A.cnt + ')');
    const S = r.sell;
    ok(S.n === 4 && S.init === 0 && S.all === 4 && S.shown === 1 && S.after === 3, '교역소 매각: 전체 선택 4 · 품목 찾기 1줄 · 하나 빼고 3가지');
    ok(S.batchRows === 3 && S.live === '4' && S.redrawn && S.qty === '4' && S.rangeAfter === '4', '일괄 매각 창: 수량 막대를 끌면 칸이 따라오고, 놓으면 4통으로 다시 셈');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
