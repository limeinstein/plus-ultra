/* 2회차 QA 1~9 회귀 시험. node tests/second_run_qa_smoke.js
   PAGE_URL=로컬 HTTP 주소 · BROWSER_EXE=Chromium 경로 · 임시 브라우저는 finally에서 닫는다. */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const root = path.resolve(__dirname, '..');
const url = process.env.PAGE_URL || pathToFileURL(path.join(root, 'index.html')).href;
const out = path.join(root, 'artifacts', 'second-run-qa-20261027');
const passed = [];
function ok(value, message) { assert(value, message); passed.push(message); console.log('  ✓ ' + message); }

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    if (/^http:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(url)) {
      await page.route(/plus-ultra-telemetry\.luminary121284\.chatgpt\.site/, r => r.fulfill({ status: 204, body: '' }));
    }
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    async function ready() {
      await page.waitForFunction(() => window.G && G.Game && G.Info && G.ChartView && G.Scenes.create, null, { polling: 100 });
      await page.evaluate(async () => {
        await G.Game.ensureGeo(); G.Nav.init();
        G.Game.launch = async (_, fn) => fn(); // 화면 갱신 대기만 생략하고 생성·도시 진입은 실제 코드를 쓴다
        G.UI.fade = async fn => fn();
        await G.Loader.hide(); // 화면 갱신을 멈춘 시험에서는 타이틀의 두 프레임 대기도 생략한다
      });
    }
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await ready();
    await page.evaluate(() => { window.qaRi = G.U.ri; G.U.ri = () => 8; G.Game.go('create'); });
    await page.locator('[data-g="job"][data-v="digger"]').click();
    for (const sk of ['nav', 'med', 'cook']) await page.locator('[data-sk="' + sk + '"][data-d="1"]').click();
    for (const lg of [5, 6]) await page.locator('[data-lg="' + lg + '"][data-d="1"]').click();
    await page.evaluate(() => { G.U.ri = () => -8; });
    await page.locator('#roll').click(); await page.locator('#go').click();
    ok(await page.evaluate(() => G.Game.sceneName === 'create' && /특기가 5개.*한도 4개/.test(document.querySelector('.cr-error').textContent)), '1: 지력이 내려간 뒤 특기 5개/한도 4개 상태로 시작 불가');
    await page.locator('[data-sk="cook"][data-d="-1"]').click(); await page.locator('#go').click();
    ok(await page.evaluate(() => G.Game.sceneName === 'create' && /어학이 4개.*한도 3개/.test(document.querySelector('.cr-error').textContent)), '1: 어학 한도도 출항 전에 재검사');
    fs.mkdirSync(out, { recursive: true });
    await page.screenshot({ path: path.join(out, 'create-limit.png') });

    await page.evaluate(() => { G.U.ri = () => 8; G.Game.go('create'); });
    await page.locator('[data-g="job"][data-v="digger"]').click();
    for (const sk of ['hist', 'nav', 'med']) await page.locator('[data-sk="' + sk + '"][data-d="1"]').click();
    await page.evaluate(() => { G.U.ri = () => -8; });
    await page.locator('#bm').selectOption('5'); await page.locator('#go').click();
    ok(await page.evaluate(() => G.Game.sceneName === 'create' && /점수가 모자랍니다/.test(document.querySelector('.cr-error').textContent)), '1: 생일 변경으로 특기 점수가 줄어든 경우도 초과 배분으로 시작 불가');

    await page.evaluate(() => { G.U.ri = window.qaRi; G.Game.go('create'); });
    await page.locator('#skipintro').check();
    await page.locator('#go').click();
    ok((await page.locator('.win').innerText()).includes('아직 능력 점수'), '6: 배분하지 않은 점수를 출항 전에 안내');
    await page.getByRole('button', { name: '배분으로 돌아가기', exact: true }).click();
    ok(await page.locator('#go').isVisible(), '6: 취소하면 캐릭터 배분 화면 유지');
    await page.locator('#go').click(); await page.getByRole('button', { name: '그대로 시작', exact: true }).click();
    try { await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.cmdmenu') && !G.Scenes.city.isBusy(), null, { timeout: 60000, polling: 100 }); }
    catch (e) { console.log(await page.evaluate(() => ({ scene: G.Game.sceneName, text: document.body.innerText.slice(-2400), busy: G.Scenes.city.isBusy() })), errors); throw e; }
    ok(await page.evaluate(() => G.Game.state.flags.prologue && G.State.introSeen() && !document.querySelector('.dlg')), '5: 시작 안내를 건너뛰어도 정상적으로 도시 진입');
    await page.evaluate(() => { G.Game.go('create'); });
    ok(await page.locator('#skipintro').isChecked(), '5: 이미 시작 안내를 본 다음 회차는 건너뛰기 기본 선택');
    await page.evaluate(() => { G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => !!document.querySelector('.cmdmenu'), null, { polling: 100 });

    await page.evaluate(() => { G.Info.settings(); });
    await page.locator('[data-bt="0"]').click(); await page.locator('[data-sh="0"]').click();
    await page.locator('[data-res="0.7"]').click();
    await page.locator('[data-keyact="up"]').click(); await page.keyboard.press('w');
    await page.locator('.win .title .x').click();
    ok(await page.evaluate(() => {
      const a = G.Game.state.settings, oldKey = a.keys.up;
      const b = G.State.newSettings('original'); b.keys.up = 'KeyQ';
      const c = G.State.newSettings('easy');
      return !c.banter && !c.shake && c.res === 0.7 && c.keys.up === 'KeyW' && a.keys.up === oldKey && c.diff === 'easy' && c.speed === 1 && b.diff === 'original';
    }), '3: 수다·흔들림·화질·단축키 유지, 난이도·배속과 키 객체는 회차별로 분리');
    await page.reload({ waitUntil: 'domcontentloaded' }); await ready();
    ok(await page.evaluate(() => !G.State.newSettings().banter && G.State.newSettings().keys.up === 'KeyW'), '3: 페이지를 다시 열어도 개인 설정 유지');

    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.State.newGame({ name: '반복 교역 시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal', gold: 100000 });
      G.Game.state.settings.res = 0.35;
      G.UI.clearScreen(); G.Game.cityHud();
      G.UI.add(G.Info.fleetPanel({ compact: true }));
      const c = G.CITY_DATA[0], T = G.Scenes.city.B.trade;
      G.Ledger.record(c); T.applyBuy(c, 'wine', 138, G.R.buyPrice(c, 'wine'));
      window.qaQuote = G.Ledger.bestSell('wine').price;
      T.sellQty(c, 'wine', 77);
    });
    ok(await page.evaluate(() => G.Ledger.bestSell('wine').price === G.R.sellPrice(G.CITY_DATA[0], 'wine') && G.Ledger.bestSell('wine').price < window.qaQuote), '2: 대량 매각 직후 수첩에 하락한 시세 반영');
    ok(await page.evaluate(() => {
      const el = document.querySelector('.fleetpanel');
      return el.dataset.compact === '1' && /포도주 61/.test(el.textContent) && el.textContent.includes(G.U.num(G.Game.state.player.gold) + '닢');
    }), '8: 거래창을 닫지 않아도 함대 패널의 수량·소지금 갱신');
    ok(await page.evaluate(() => {
      const w = G.Game.hud.supply('water');
      return w.storedDays === 20 && w.cargoDays === 135 && w.days === 155 && /교역품 대체분/.test(w.tip) && document.querySelector('.hud [data-k="water"]').textContent.includes('20+135일');
    }), '9: 물통 20일+교역품 135일, 합계 155일을 구분');

    await page.evaluate(() => { window.qaNumber = null; G.UI.number({ title: '수량 검증', min: 1, max: 138, value: 138, info: n => '금액 ' + n * 15 }).then(n => { window.qaNumber = n; }); });
    await page.locator('.nfield').fill('60');
    ok((await page.locator('.win .inf').innerText()).includes('900') && await page.locator('.win input[type="range"]').inputValue() === '60', '4: 수량 입력 중 합계와 슬라이더 즉시 갱신');
    await page.locator('.nfield').evaluate(el => { el.setSelectionRange(0, 1); });
    await page.keyboard.type('5');
    ok(await page.locator('.nfield').evaluate(el => el.value === '50' && el.selectionStart === 1), '4: 숫자 중간을 고쳐도 입력 커서 위치 유지');
    await page.locator('.nfield').fill('60');
    await page.locator('.nfield').press('Enter'); await page.waitForFunction(() => window.qaNumber === 60, null, { polling: 100 });
    ok(true, '4: 입력칸에서 Enter로 수정한 수량 60 확정');
    await page.evaluate(() => { window.qaNumber = '대기'; G.UI.number({ title: '경계값 검증', min: 1, max: 138, value: 10 }).then(n => { window.qaNumber = n; }); });
    await page.locator('.nfield').fill('999'); await page.getByRole('button', { name: '결정', exact: true }).click();
    await page.waitForFunction(() => window.qaNumber === 138, null, { polling: 100 }); ok(true, '4: 마우스 확정도 최대 수량을 넘지 않음');
    await page.evaluate(() => { window.qaNumber = '대기'; G.UI.number({ title: '취소 검증', min: 1, max: 138, value: 10 }).then(n => { window.qaNumber = n; }); });
    await page.locator('.nfield').press('Escape'); await page.waitForFunction(() => window.qaNumber === null, null, { polling: 100 });
    ok(true, '4: 입력칸에서 Escape로 취소');

    await page.evaluate(() => { G.Scenes.city.B.harbor.supply(G.CITY_DATA[0]); });
    ok((await page.locator('.sup-total').innerText()).includes('물 30+135일') && (await page.locator('.tbl.supply').innerText()).includes('지금 보급품'), '9: 보급창도 남길 보급품과 교역품 대체분을 분리');
    await page.screenshot({ path: path.join(out, 'supply-breakdown.png') });
    await page.getByRole('button', { name: '그만둔다', exact: true }).click();
    await page.evaluate(() => {
      const win = G.UI.window({ title: '해도 검색 시험', width: 1140 }); window.qaTravel = 0;
      window.qaChart = G.ChartView.mount(win.content, { w: 1100, h: 520,
        actions: () => [{ label: '이 항구로 간다', fn: () => { window.qaTravel++; } }] });
    });
    await page.getByRole('combobox').fill('리스 본'); await page.getByRole('combobox').press('Enter');
    ok(await page.evaluate(() => document.querySelector('.cv-info').textContent.includes('리스본') && Math.abs(window.qaChart.view.lon - G.CITY_DATA[0].lon) < 0.001 && window.qaTravel === 0), '7: 도시명 검색으로 지도와 요약만 이동, 항해를 자동 실행하지 않음');
    await page.getByRole('button', { name: '이 항구로 간다', exact: true }).click();
    ok(await page.evaluate(() => window.qaTravel === 1), '7: 검색 뒤 기존 이동 단추로만 항해 확정');
    const unknown = await page.evaluate(() => G.CITY_DATA.find(c => c && !G.Game.state.known.includes(c.id) && G.R.cityExists(c)).name);
    await page.getByRole('combobox').fill(unknown);
    ok(await page.locator('.cv-results button').count() === 0, '7: 아직 모르는 도시 이름은 검색으로 노출하지 않음');
    await page.getByRole('combobox').fill('리스본'); await page.getByRole('combobox').press('Enter');
    await page.screenshot({ path: path.join(out, 'chart-search.png') });
    await page.setViewportSize({ width: 960, height: 540 });
    await page.screenshot({ path: path.join(out, 'chart-search-960.png') });
    ok(errors.length === 0, '변경 화면의 pageerror·console.error 0: ' + errors.join(' | '));
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ passed, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
