/* file://에서 미니게임 8종의 그림과 실제 조작을 확인한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tmp/minigame-art');
fs.mkdirSync(OUT, { recursive: true });
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1080 } });
    const errors = [], shots = [];
    page.on('pageerror', e => { errors.push(e.message); console.error('브라우저 오류:', e.message); });
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href, { timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.UI && G.Games.pz.sphinx);
    await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '그림 점검', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 },
        st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 0), diff: 'normal' });
      G.Game.state.settings.res = 0.35;
      G.Audio.sfx = function () {};
      G.UI.say = async function () {};
      G.UI.choose = async function () { return 100; };
      G.UI.confirm = async function () { return false; };
      G.Game.refreshHud = function () {};
      await Promise.all(['props', 'ruins', 'sphinx', 'poker', 'fishing', 'boat'].map(n => G.Img.load('minigames/' + n)));
    });
    async function open(kind, level = 1) {
      await page.evaluate(({ kind, level }) => {
        const d = { id: 'knossos', name: '그림 점검', pw: level };
        if (kind === 'poker') G.Games.poker(G.CITY_DATA[0]);
        else if (kind === 'fishing') G.Fishing.open();
        else G.Games.puzzle(d, kind, level);
      }, { kind, level });
      await page.waitForSelector(kind === 'fishing' ? '.mg-fishing' : '.mg-ready');
    }
    async function shot(kind, name) {
      await page.waitForTimeout(100);
      const file = path.join(OUT, kind + '.png');
      await page.locator('.win').last().screenshot({ path: file });
      shots.push({ kind, name, file });
    }
    async function quit() {
      await page.locator('.win .foot .btn').last().click();
      await page.waitForFunction(() => !document.querySelector('.modal-back'));
    }
    await open('hanoi');
    await shot('hanoi', '돌 원반');
    await page.keyboard.press('1'); await page.keyboard.press('3');
    assert.strictEqual(await page.locator('.peg').nth(2).locator('.disc').count(), 1);
    await quit();
    await open('balance');
    await page.locator('.gem').nth(0).click();
    await page.locator('.gem').nth(1).click(); await page.locator('.gem').nth(1).click();
    await page.getByRole('button', { name: '단다', exact: true }).click();
    assert.match(await page.locator('.bstat').textContent(), /남은 횟수 2/);
    await shot('balance', '천칭'); await quit();
    await open('grail');
    await page.keyboard.press('1'); await page.keyboard.press('2');
    assert.deepStrictEqual(await page.locator('.vessel .amt').allTextContents(), ['3 / 8되', '5 / 5되', '0 / 3되']);
    await shot('grail', '성배의 물'); await quit();
    await open('maze');
    const before = await page.locator('.rm.me').getAttribute('data-k');
    const dir = await page.locator('.rm.me').evaluate(el => ['n', 'e', 's', 'w'].findIndex(x => !el.classList.contains('w' + x)));
    await page.keyboard.press(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][dir]);
    assert.notStrictEqual(await page.locator('.rm.me').getAttribute('data-k'), before);
    await shot('maze', '미궁 64'); await quit();
    await open('cube');
    const cubeBefore = await page.locator('.cboard .c3, .cboard .cube').evaluate(el => el.parentNode.dataset.k);
    for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) {
      await page.keyboard.press(key);
      if (await page.locator('.cboard .c3, .cboard .cube').evaluate(el => el.parentNode.dataset.k) !== cubeBefore) break;
    }
    assert.notStrictEqual(await page.locator('.cboard .c3, .cboard .cube').evaluate(el => el.parentNode.dataset.k), cubeBefore);
    await shot('cube', '돌 입방체'); await quit();
    await open('sphinx'); await shot('sphinx', '스핑크스의 수수께끼');
    await page.locator('.sphinx-ch button').first().click();
    assert.match(await page.locator('.pz-stat').textContent(), /옳다|틀렸다/); await quit();
    await open('poker');
    assert.strictEqual(await page.locator('.pcard.back').count(), 5);
    await page.locator('.me .pcard').first().click();
    assert.strictEqual(await page.locator('.pcard.held').count(), 1);
    await shot('poker', '포카');
    await page.getByRole('button', { name: '교환', exact: true }).click();
    assert.strictEqual(await page.locator('.pcard.back').count(), 0); await quit();
    await open('fishing');
    await page.waitForFunction(() => G.Fishing._st.pow > 0.2);
    await shot('fishing', '바다 낚시');
    await page.keyboard.press('Space');
    assert.strictEqual(await page.evaluate(() => G.Fishing._st.ph), 'fly');
    // 기다림→입질→끌어올림 화면에서도 생성한 물고기를 실제로 그린다.
    await page.waitForFunction(() => G.Fishing._st.ph === 'bite', null, { timeout: 12000 });
    await page.keyboard.down('Space');
    assert.strictEqual(await page.evaluate(() => G.Fishing._st.ph), 'reel');
    await page.waitForTimeout(120);
    await page.locator('.win').last().screenshot({ path: path.join(OUT, 'fishing-reel.png') });
    await page.keyboard.up('Space');
    await page.waitForFunction(() => G.Fishing._st.ph === 'aim', null, { timeout: 6000 }); await quit();
    // 가장 많은 보석·원반·입방체가 있는 난이도에서도 화면이 넘치지 않는지 확인한다.
    for (const kind of ['hanoi', 'balance', 'grail', 'maze', 'cube', 'sphinx']) {
      await open(kind, 3);
      assert.strictEqual(await page.locator('.win .content').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, kind + ' 가로 넘침');
      await page.locator('.win').last().screenshot({ path: path.join(OUT, kind + '-hard.png') });
      await quit();
    }
    assert.deepStrictEqual(errors, [], '콘솔 오류');
    const review = await browser.newPage({ viewport: { width: 1640, height: 1100 }, deviceScaleFactor: 1 });
    await review.setContent('<html lang="ko"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#181d1c;color:#f7e6c2;font:18px Georgia,serif}h1{margin:0 0 8px;font-size:30px}p{color:#bfae8c;margin:0 0 24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;background:#222a27;border:1px solid #68563c;border-radius:6px;overflow:hidden}figcaption{padding:12px 18px;font-size:22px}img{display:block;width:100%;height:500px;object-fit:contain;background:#25231c}</style><h1>미니게임 · 새 그래픽</h1><p>석재 · 금속 · 목재의 질감을 건물 외관과 맞춘 게임 화면</p><div class="grid">' + shots.map(s => '<figure><figcaption>' + s.name + '</figcaption><img src="data:image/png;base64,' + fs.readFileSync(s.file).toString('base64') + '"></figure>').join('') + '</div></html>');
    await review.locator('img').evaluateAll(ims => Promise.all(ims.map(im => im.decode())));
    await review.screenshot({ path: path.join(ROOT, 'docs/art/minigame-preview.png'), fullPage: true });
    console.log('미니게임 8종 · 기본/최고 난이도 · 실제 조작 · file:// 그림 · 콘솔 오류 0 확인');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
