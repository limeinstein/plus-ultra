/* 같은 물건은 한 칸 · 시장 매각 수량·능력치 — node tests/items_stack_sell_smoke.js   (BROWSER_EXE=크롬 경로)
   · 처음 가진 나침반 + 시장에서 산 나침반(다른 도시) + 사건으로 받은 나침반 → 한 칸 ×3, 산 곳은 it.buys
   · 옛 저장의 따로 쌓인 칸도 불러올 때 합친다 · 산 도시에서는 치른 값까지만(R.paidAt)
   · 소지품이 가득해도 이미 가진 물건은 그 칸에 받는다 · 발견 유물은 따로 둔다
   · 매각: 목록에 능력치, 여러 개면 수량 창(구입과 같은), 확인 창에 그림·설명·능력치, 판 수량만큼 금화 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'items_stack');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, R = G.R, out = {};
      const comp = () => s.player.items.filter(x => x.id === 'compass');
      out.start = comp().length;
      R.addMarketItems('compass', 1, 1, 480);          // 다른 도시(1번)에서 삼
      R.addItem('compass');                              // 사건으로 받음
      out.after = comp().map(x => R.itemQty(x));
      out.buys = JSON.stringify(comp()[0].buys || null);
      out.paidSev = R.paidAt(comp()[0], 1); out.paidLis = R.paidAt(comp()[0], 0);
      // 옛 저장: 따로 쌓인 칸
      s.player.items.push({ id: 'compass', from: 5, paid: 700 }, { id: 'compass', qty: 2 });
      const json = G.State.serialize(); const S2 = G.State.deserialize(json);
      out.loaded = S2.player.items.filter(x => x.id === 'compass').map(x => R.itemQty(x));
      R.mergeItems();
      // 가득 찬 소지품: 이미 가진 물건은 받고, 새 물건은 못 받는다
      while (R.slotsUsed() < R.ITEM_MAX) s.player.items.push({ id: 'keepsakeX' + s.player.items.length, kind: 'keepsake', name: '추억' });
      out.fullSame = R.addItem('compass'); out.fullNew = R.addItem('sextant');
      out.qty = R.itemQty(comp()[0]);
      // 발견 유물은 따로
      const relic = Object.keys(G.RELIC || {})[0];
      if (relic) { R.addItem(relic, { disc: 'x1' }); R.addItem(relic, { disc: 'x2' }); out.relics = s.player.items.filter(x => x.id === relic).length; }
      s.player.items = s.player.items.filter(x => x.kind !== 'keepsake' && !(G.RELIC && G.RELIC[x.id]));
      s.player.gold = 1000;
      G.Game.go('city', { city: 0 });
      return out;
    });
    console.log(r);
    ok(r.start === 1 && r.after.length === 1 && r.after[0] === 3, '처음 나침반 + 다른 도시에서 산 것 + 사건으로 받은 것 → 한 칸 ×3');
    ok(r.paidSev === 480 && r.paidLis == null, '산 곳과 치른 값은 남는다 (1번 도시 480닢)');
    ok(r.loaded.length === 1 && r.loaded[0] === 6, '옛 저장의 따로 쌓인 칸도 불러올 때 합친다 (×6)');
    ok(r.fullSame === true && r.fullNew === false && r.qty === 7, '소지품이 가득해도 가진 물건은 그 칸에 받고, 새 물건은 못 받는다');
    if (r.relics != null) ok(r.relics === 2, '발견 유물은 따로 둔다');
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => { window.__noRaf = true; window.__sold = null; const c = G.CITY_DATA[0]; G.Scenes.city.B.market.sell(c).then(() => { window.__sold = 1; }); });
    // 상인 인사 대화 넘기기 → 목록
    const until = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await page.evaluate(fn)) return true; await page.waitForTimeout(150); } return false; };
    await until(() => document.querySelector('.choices .choice'), 8000);
    const rows = await page.evaluate(() => [...document.querySelectorAll('.choices .choice')].map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    console.log(rows);
    ok(rows.some(t => /나침반 ×7.*항해도구/.test(t)) && rows.some(t => /레이피어.*공격 \d+/.test(t)), '매각 목록에 수량과 능력치 (나침반 ×7 · 항해도구, 레이피어 · 공격)');
    ok(rows.filter(t => /^.*나침반/.test(t)).length === 1, '나침반은 한 줄');
    await page.evaluate(() => { const c = [...document.querySelectorAll('.choices .choice')].find(x => /나침반/.test(x.textContent)); c.click(); });
    ok(await until(() => document.querySelector('input.nfield'), 5000), '여러 개면 수량 창이 뜬다');
    const numText = await page.evaluate(() => document.querySelector('input.nfield').closest('.win').textContent.replace(/\s+/g, ' '));
    ok(/한 개에 금화 [\d,]+닢/.test(numText) && /가진 것 7개/.test(numText) && /항해도구/.test(numText), '수량 창: 한 개 값 · 가진 수 · 능력치');
    await page.screenshot({ path: path.join(OUT, '1_qty.png') });
    await page.evaluate(() => { const f = document.querySelector('input.nfield'); f.value = '3'; f.dispatchEvent(new Event('input', { bubbles: true })); f.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForTimeout(200);
    const unit = await page.evaluate(() => G.Scenes.city.B.market.sellValue(G.Game.state.player.items.find(x => x.id === 'compass')));
    await page.evaluate(() => { const b = [...document.querySelectorAll('.win .foot .btn')].find(x => /확인|정한다|산다|좋다|navy/.test(x.textContent + x.className)); (b || document.querySelector('.win .foot .btn.navy')).click(); });
    // 상인 말 → 확인 창
    for (let i = 0; i < 30; i++) {
      const st = await page.evaluate(() => ({ conf: !!document.querySelector('.win .foot .btn.navy') && /팔겠습니까/.test(document.querySelector('.win').textContent), say: !!document.querySelector('.modal-back.catch') }));
      if (st.conf) break;
      if (st.say) await page.evaluate(() => document.querySelector('.modal-back.catch').click());
      await page.waitForTimeout(200);
    }
    const conf = await page.evaluate(() => document.querySelector('.win').textContent.replace(/\s+/g, ' '));
    console.log(conf.slice(0, 200));
    ok(/나침반 3개/.test(conf) && /항해도구/.test(conf) && /진행 방향/.test(conf), '확인 창: 수량 · 능력치 · 설명');
    await page.screenshot({ path: path.join(OUT, '2_confirm.png') });
    const g0 = await page.evaluate(() => G.Game.state.player.gold);
    await page.evaluate(() => document.querySelector('.win .foot .btn.navy').click());
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({ gold: G.Game.state.player.gold, q: G.R.itemCount('compass') }));
    ok(after.q === 4 && after.gold - g0 === unit * 3, '3개를 팔아 금화 ' + unit * 3 + '닢 · 남은 나침반 4개');
    await page.evaluate(() => { const x = document.querySelector('.choices') ? document.querySelector('.win .title .x') : null; if (x) x.click(); });
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('통과 — 그림: ' + OUT);
  } catch (e) { console.error('실패:', e.message, errors); await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {}); process.exitCode = 1; } finally { await browser.close(); }
})();
