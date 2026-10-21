/* 은퇴할 때 자택 보관함 물려주기 (js/systems/family.js F.pickStorage · F.succeed) — node tests/heir_storage_smoke.js   (BROWSER_EXE=크롬 경로)
   · 보관함이 비었으면 묻지 않는다 · 처음에는 모두 골라져 있다 · 칸을 눌러 풀면 고른 것만 물려준다
   · 「모두 물려준다」 · 「물려주지 않는다」 → 보관함이 빈다 · 남기는 물건이 있으면 한 번 더 묻고 「다시 고른다」면 창이 다시 뜬다
   · 소지품·장비는 예전처럼 그대로 물려받는다 · 저장·불러오기에 남는다 · 콘솔 오류 0 · 화면: /tmp/heir_storage */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = '/tmp/heir_storage';
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => {
      const UI = G.UI;
      window.__confirms = [];   // 차례대로 돌려줄 확인 답 (없으면 true)
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {};
      UI.confirm = async (msg) => { const v = window.__confirms.length ? window.__confirms.shift() : true; window.__lastConfirm = msg; return v; };
      UI.fade = async () => {}; G.Game.go = () => {}; G.Game.refreshHud = () => {}; G.State.save = () => {};
      window.__fresh = function (nSt) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        const s = G.Game.state = G.State.newGame({ name: '아버지', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
        s.date = { y: 1500, m: 6, d: 1 };
        const gifts = G.ITEMS.filter(it => it.kind === 'gift' && !it.consumable).map(it => it.id);
        s.player.items = [{ id: 'rapier' }]; s.player.equip.weapon = 'rapier';
        s.player.storage = [];
        for (let i = 0; i < nSt; i++) s.player.storage.push({ id: gifts[i % gifts.length], name: '보관 물건 ' + i });
        const k = { name: '아들', sex: 'm', born: { y: s.date.y - 18, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70 };
        s.player.kids.push(k);
        return k;
      };
      window.__run = function (nSt) { const k = window.__fresh(nSt); window.__done = false; G.Family.succeed(k).then(() => { window.__done = true; }); };
      window.__names = () => (G.Game.state.player.storage || []).map(x => x.name).join(',');
    });
    const win = '.modal-back .win';
    async function waitWin() { await page.waitForSelector(win + ' tr[data-pk]', { timeout: 10000 }); }
    async function foot(label) { await page.locator(win + ' .foot button', { hasText: label }).click(); }
    async function done() { await page.waitForFunction(() => window.__done, null, { timeout: 10000 }); return page.evaluate(() => window.__names()); }

    // 1) 보관함이 비었으면 묻지 않는다
    await page.evaluate(() => window.__run(0));
    ok((await done()) === '' && !(await page.$(win)), '보관함이 비었으면 창 없이 뒤를 잇는다');

    // 2) 고른 것만: 처음엔 모두 골라짐 → 둘째 칸을 풀고 물려준다
    await page.evaluate(() => window.__run(4)); await waitWin();
    const checked = await page.$$eval(win + ' input[data-pk]', a => a.filter(x => x.checked).length);
    ok(checked === 4, '처음에는 4칸 모두 골라져 있다');
    await page.locator(win + ' tr[data-pk="1"]').click();
    await page.locator(win + ' input[data-pk="3"]').click();   // 상자를 바로 눌러도 된다
    ok((await page.$$eval(win + ' input[data-pk]', a => a.map(x => x.checked ? 1 : 0).join(''))) === '1010', '칸·상자를 눌러 고른 것을 푼다');
    await page.screenshot({ path: path.join(OUT, 'pick.png') });
    await foot('고른 것을 물려준다');
    let r = await done(), p = await page.evaluate(() => { const p = G.Game.state.player; return { gen: p.generation, items: p.items.map(x => x.id).join(','), w: p.equip.weapon, c: window.__lastConfirm }; });
    ok(r === '보관 물건 0,보관 물건 2' && p.gen === 2, '고른 2칸만 새 제독의 보관함에 (' + r + ')');
    ok(/2칸은 사라집니다/.test(p.c), '남기는 물건이 있으면 한 번 더 묻는다');
    ok(p.items === 'rapier' && p.w === 'rapier', '소지품·장비는 예전처럼 그대로 물려받는다');
    const saved = await page.evaluate(() => (G.State.deserialize(G.State.serialize()).player.storage || []).length);
    ok(saved === 2, '저장·불러오기에 물려받은 보관함이 남는다');

    // 3) 모두 풀고도 「모두 물려준다」 → 전부
    await page.evaluate(() => window.__run(3)); await waitWin();
    await page.locator(win + ' [data-pa="0"]').click();
    await foot('모두 물려준다');
    r = await done();
    ok(r.split(',').length === 3, '「모두 물려준다」 → 3칸 모두');

    // 4) 「물려주지 않는다」 → 「다시 고른다」 → 창이 다시 뜬다 → 「물려주지 않는다」 확정
    await page.evaluate(() => { window.__confirms = [false, true]; window.__run(3); }); await waitWin();
    await foot('물려주지 않는다');
    await page.waitForFunction(() => document.querySelectorAll('.modal-back .win tr[data-pk]').length === 3, null, { timeout: 10000 });
    ok(!(await page.evaluate(() => window.__done)), '「다시 고른다」면 고르기 창이 다시 뜬다');
    await foot('물려주지 않는다');
    r = await done();
    ok(r === '' && (await page.evaluate(() => G.Game.state.player.generation)) === 2, '「물려주지 않는다」 → 보관함이 빈 채로 뒤를 잇는다');

    // 5) Esc로 닫히지 않는다
    await page.evaluate(() => window.__run(2)); await waitWin();
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    ok(!!(await page.$(win + ' tr[data-pk]')), 'Esc로 닫히지 않는다 (실수로 잃지 않게)');
    await foot('모두 물려준다'); await done();

    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
