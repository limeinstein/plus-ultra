/* 2회차 QA 재점검: 실제 시작·교역·보급 화면과 옛 저장 설정 이관.
   Game.launch·UI 대화·도시 진입을 대체하지 않고 화면 갱신만 낮은 빈도로 돌린다. */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts', 'second-run-recheck-20261027');
const passed = [];
function ok(value, message) { assert(value, message); passed.push(message); console.log('  ✓ ' + message); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    fs.mkdirSync(OUT, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => {
      window.createImageBitmap = undefined;
      let queue = [], n = 0;
      window.requestAnimationFrame = cb => { queue.push(cb); return ++n; };
      setInterval(() => { if (!window.qaFrames) return; const q = queue; queue = []; q.forEach(cb => cb(performance.now())); }, 80);
    });
    await page.goto(process.env.PAGE_URL || pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Scenes.create && G.Info, null, { polling: 100 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Game.autoRes = .35; G.Game.fit();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.State.newGame({ name: '옛 저장', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'original', gold: 99999 });
      const s = G.Game.state;
      s.settings.banter = false; s.settings.shake = false; s.settings.sound = .12; s.settings.music = 0; s.settings.res = .35;
      s.settings.keys.up = 'KeyW'; s.settings.speed = 4; s.flags.prologue = true;
      // 옛 저장에는 별도 개인 설정 기록이 없고, 불러온 settings에만 취향이 들어 있다.
      G.Game.state = G.State.deserialize(G.State.serialize());
      window.qaFrames = true;
      G.Game.go('create');
    });
    ok(await page.locator('#skipintro').isChecked(), '5: 옛 저장의 프롤로그 완료 기록도 건너뛰기에 반영');
    await page.locator('#go').click();
    await page.getByRole('button', { name: '그대로 시작', exact: true }).click();
    await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.cmdmenu') && !G.Scenes.city.isBusy() && !G.Loader.shown(), null, { polling: 100, timeout: 90000 });
    ok(await page.evaluate(() => G.Game.state.settings.banter === false && G.Game.state.settings.sound === .12 && G.Game.state.settings.keys.up === 'KeyW'), '3: 실제 새 게임 시작에서 옛 저장의 수다·음량·단축키 이관');
    ok(await page.evaluate(() => G.Game.state.settings.diff === 'normal' && G.Game.state.settings.speed === 1 && G.Game.state.player.gold === 3000), '3: 옛 저장의 난이도·배속·재산은 새 회차에 섞이지 않음');
    ok(await page.evaluate(() => {
      const st = G.Game.state.settings, old = st.sound; st.sound = .99;
      const remembered = G.State.newSettings('easy').sound; st.sound = old;
      return remembered === .12;
    }), '3: 이미 기기에 기억한 취향은 다른 저장의 값으로 덮지 않음');

    await page.getByText('교역소', { exact: true }).click();
    await page.waitForSelector('.dlg', { timeout: 30000 });
    for (let i = 0; i < 8; i++) {
      if (!(await page.locator('.dlg').count())) break;
      await page.locator('.dlg').click();
      await page.waitForTimeout(120);
    }
    await page.waitForFunction(() => !G.Scenes.city.isBusy() && !!document.querySelector('.cmdmenu'), null, { polling: 100 });
    await page.getByText('구입', { exact: true }).click();
    await page.locator('.win tr[data-id="wine"] td').nth(1).click();
    await page.locator('.nfield').fill('20');
    await page.locator('.nfield').press('Enter');
    await page.waitForFunction(() => G.Game.state.fleet.cargo.wine?.q === 20, null, { polling: 100 });
    ok(await page.evaluate(() => document.querySelector('.fleetpanel').textContent.includes('포도주 20') && document.querySelector('.fleetpanel').textContent.includes(G.U.num(G.Game.state.player.gold) + '닢')), '2·4·8: 실제 구입창에서 Enter 거래 후 함대 수량·소지금 즉시 일치');
    await page.getByRole('button', { name: '돌아간다', exact: true }).click();
    await page.getByText('매각', { exact: true }).click();
    const record = await page.evaluate(() => JSON.stringify(G.Game.state.ledger));
    await page.locator('.win tr[data-id="wine"] td').nth(1).click();
    await page.locator('.nfield').fill('5');
    ok(await page.evaluate(before => JSON.stringify(G.Game.state.ledger) === before, record), '2: 예상 매각액 계산만으로 실제 시세 기록이 바뀌지 않음');
    await page.locator('.nfield').press('Enter');
    await page.waitForFunction(() => G.Game.state.fleet.cargo.wine?.q === 15, null, { polling: 100 });
    ok(await page.evaluate(() => G.Ledger.bestSell('wine').price === G.R.sellPrice(G.CITY_DATA[0], 'wine') && document.querySelector('.fleetpanel').textContent.includes('포도주 15')), '2·8: 실제 매각창에서도 기록·잔여 수량 즉시 일치');
    await page.screenshot({ path: path.join(OUT, 'actual-sell.png') });
    await page.getByRole('button', { name: '돌아간다', exact: true }).click();
    await page.getByText('교역소를 나온다', { exact: true }).click();
    await page.getByText('항구', { exact: true }).click();
    // 0.286부터 항구에 들어서면 해상 괴물 소식 대화가 나올 수 있다 — 넘긴다
    for (let i = 0; i < 20; i++) { await page.waitForTimeout(300); if (await page.locator('.dlg').count()) await page.locator('.dlg').click(); else if (await page.evaluate(() => !G.Scenes.city.isBusy())) break; }
    await page.waitForFunction(() => !G.Scenes.city.isBusy() && G.Scenes.city.current()?.kind === 'harbor', null, { polling: 100 });
    await page.getByText('보급', { exact: true }).click();
    const before = await page.evaluate(() => ({ food: G.Game.state.fleet.food, water: G.Game.state.fleet.water, gold: G.Game.state.player.gold }));
    await page.locator('.b-num').fill('45');
    ok((await page.locator('.sup-total').innerText()).includes('식량 45+0일') && (await page.locator('.sup-total').innerText()).includes('물 45+33일'), '4·9: 보급 수량 직접 입력 중에 예상 일수 즉시 갱신');
    ok(await page.evaluate(b => G.Game.state.fleet.food === b.food && G.Game.state.player.gold === b.gold, before), '4·9: 보급 예상치 갱신만으로 물자·돈이 바뀌지 않음');
    await page.locator('.b-num').press('Escape');
    await page.waitForFunction(() => !G.UI.busy(), null, { polling: 100 });
    ok(await page.evaluate(b => G.Game.state.fleet.food === b.food && G.Game.state.fleet.water === b.water && G.Game.state.player.gold === b.gold, before), '4: 보급 입력칸의 Escape 취소가 물자·돈을 보존');

    await page.getByText('보급', { exact: true }).click();
    await page.locator('.b-num').fill('1000000000000');
    ok(!/NaN|Infinity/.test(await page.locator('.sup-total').innerText()), '4: 매우 큰 보급 수량을 입력해도 멈추지 않고 짐칸 한도로 계산');
    await page.locator('.b-num').press('Escape');
    await page.getByText('보급', { exact: true }).click();
    await page.locator('.b-num').fill('20');
    const water = page.locator('.supply tr[data-k="water"] input[type="number"]');
    await water.fill('50');
    ok((await page.locator('.sup-total').innerText()).includes('물 50+33일'), '9: 물만 직접 바꾼 경우에도 보급품과 교역품 일수 구분');
    await page.screenshot({ path: path.join(OUT, 'actual-supply.png') });
    await water.press('Enter');
    await page.waitForFunction(() => !G.UI.busy() && Math.abs(G.Game.state.fleet.water / G.R.dailyUse() - 50) < 1e-6, null, { polling: 100 });
    ok(await page.evaluate(b => Math.abs(G.Game.state.fleet.food - b.food) < 1e-6 && G.Game.state.player.gold === b.gold - Math.ceil((50 * G.R.dailyUse() - b.water)) * G.R.waterCost(G.CITY_DATA[0]), before), '4·9: 보급 입력칸 Enter 확정 시 표시한 물량·가격만 적용');
    await page.getByText('마을로 돌아간다', { exact: true }).click();

    const extinct = await page.evaluate(() => {
      const s = G.Game.state, c = G.CITY_DATA.find(c => c.until && c.until > 1480);
      window.qaDate = s.date; window.qaKnown = s.known.slice();
      s.date = { y: c.until + 1, m: 1, d: 1 }; if (!s.known.includes(c.id)) s.known.push(c.id);
      return c.name;
    });
    await page.getByRole('button', { name: '해도', exact: true }).click();
    await page.getByRole('combobox').fill(extinct);
    ok(await page.getByRole('option', { name: new RegExp('^' + extinct + '( |$)') }).count() === 0, '7: 이름을 알고 있어도 사라진 도시는 검색에서 제외');
    await page.getByRole('combobox').fill('리스본');
    await page.getByRole('combobox').press('Enter');
    ok(await page.evaluate(() => document.querySelector('.cv-info').textContent.includes('리스본') && G.Game.state.loc.mode === 'city'), '7: 실제 해도에서도 검색 선택은 요약만 열고 이동하지 않음');
    await page.screenshot({ path: path.join(OUT, 'actual-chart-960.png') });
    ok(errors.length === 0, '실제 시작·교역·보급·해도 화면의 pageerror·console.error 0: ' + errors.join(' | '));
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ passed, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
