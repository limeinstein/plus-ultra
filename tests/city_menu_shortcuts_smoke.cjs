/* 도시·건물 메뉴 바로가기와 고정 Esc — node tests/city_menu_shortcuts_smoke.cjs */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(ROOT, 'artifacts/city-menu-shortcuts-20261115');
const KEYS = '1234567890qwerasdfzxcv';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  let page;
  try {
    page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      localStorage.setItem('pu.lang', 'ko');
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => cb.name === 'loop' ? setTimeout(() => raf(cb), 100) : raf(cb);
    });
    await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href), { timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.Game.state = G.State.newGame({ name: '바로가기', nation: 'PT', job: 'adventurer', age: 22,
        birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35; s.flags.prologue = true;
      G.UI.say = async () => {};  // 입장 인사·무관한 발견 연출을 생략하고 실제 명령·선택창은 그대로 쓴다.
      G.UI.fade = async fn => { await fn(); };
      G.Scenes.city.findInside = async () => {};
      G.Game.go('city', { cityId: 0, load: true });
    });
    async function ready(inside) {
      await page.waitForFunction(inside => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy() && !G.UI.busy() &&
        !!G.Scenes.city.current() === inside && !!document.querySelector('.cmdmenu[data-shortcuts]'), inside, { timeout: 45000 });
    }
    await ready(false);
    const street = await page.evaluate(() => ({
      keys: [...document.querySelectorAll('.cmdmenu .cmd')].map(x => x.dataset.shortcut),
      count: G.Scenes.city.buildings(G.Scenes.city.city()).length,
      focus: !!document.querySelector('.cmdmenu .kbd-focus'),
      font: getComputedStyle(document.querySelector('.cmd-key')).fontSize
    }));
    assert.equal(street.keys.slice(0, street.count).join(''), KEYS.slice(0, street.count));
    assert.equal(street.focus, false); assert.equal(street.font, '11px');
    await page.screenshot({ path: path.join(OUT, 'city.png') });
    const before = await page.evaluate(() => G.Game.state.day);
    // 실제 거리 메뉴의 여관에 해당하는 키로 입장한다.
    const innKey = await page.evaluate(() => [...document.querySelectorAll('.cmdmenu .cmd')].find(x => x.querySelector('span').textContent === '여관').dataset.shortcut);
    await page.keyboard.press(innKey); await ready(true);
    assert.equal(await page.evaluate(() => G.Scenes.city.current().kind), 'inn');
    assert.equal(await page.evaluate(() => G.Game.state.day), before + 1);
    assert.deepEqual(await page.locator('.cmdmenu .cmd-key').allTextContents(), ['1', '2', '3', '4', '5', '6', 'Esc']);
    await page.screenshot({ path: path.join(OUT, 'inn.png') });
    console.log('확인: 실제 여관 입장·번호 표시·날짜 하루 경과');
    const focused = await page.locator('.cmdmenu .kbd-focus > span').first().textContent();
    await page.keyboard.press('ArrowDown');
    assert.notEqual(await page.locator('.cmdmenu .kbd-focus > span').first().textContent(), focused);
    await page.keyboard.press('1');
    await page.waitForSelector('.modal-back input');
    await page.locator('.modal-back input').first().focus();
    await page.keyboard.press('9');
    assert.equal(await page.evaluate(() => G.Scenes.city.current().kind), 'inn');
    await page.keyboard.press('Escape'); await ready(true);
    await page.keyboard.press('1'); await page.waitForSelector('input.nfield');
    await page.locator('input.nfield').focus(); await page.keyboard.press('7');
    await page.keyboard.press('Escape'); await ready(true);
    assert.equal(await page.evaluate(() => G.Game.state.day), before + 1, '숙박 취소로 날짜가 늘지 않는다');
    await page.evaluate(() => { G.Game.state.settings.keys.cancel = 'KeyK'; });
    await page.keyboard.press('Escape'); await ready(false);
    console.log('통과: 거리 단축키로 여관 입장·숙박 선택·입력·Esc 취소·설정과 무관한 Esc 퇴장');

    // 전체 키 순서와 충돌 방지는 실제 도시 장면에 충분히 긴 메뉴를 붙여 검사한다.
    await page.evaluate(keys => {
      G.UI.clearScreen(); window.__hits = [];
      G.Game.state.settings.keys.nb_disc = 'KeyQ';
      const items = [...keys].map((key, i) => ({ label: '선택 ' + (i + 1), onClick: () => window.__hits.push(key) }));
      items.splice(3, 0, null);  // 없는 항목은 번호를 차지하지 않는다.
      items.splice(7, 0, { label: '나가기', exit: true, onClick: () => window.__hits.push('exit') });
      G.UI.cmdMenu('전체 바로가기', '', items, { shortcuts: true, top: 72 });
      const notebook = G.U.el('button', 'btn', '수첩');
      notebook.onclick = () => window.__hits.push('notebook'); G.UI.add(notebook);
    }, KEYS);
    assert.equal(await page.locator('.cmdmenu .cmd:not(.exit)').evaluateAll(xs => xs.map(x => x.dataset.shortcut).join('')), KEYS);
    for (const key of KEYS) await page.keyboard.press(key);
    assert.equal(await page.evaluate(() => window.__hits.join('')), KEYS);
    await page.keyboard.press('Shift+Q'); await page.keyboard.press('Numpad0');
    assert.deepEqual(await page.evaluate(() => window.__hits.slice(-2)), ['q', '0']);
    const hits = await page.evaluate(() => window.__hits.length);
    await page.keyboard.press('Control+1'); await page.keyboard.press('Alt+Q');
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1', repeat: true, bubbles: true })));
    await page.evaluate(() => {
      const menu = document.querySelector('.cmdmenu'); menu.classList.add('talk-hidden');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1', bubbles: true }));
      menu.classList.remove('talk-hidden'); menu.style.visibility = 'hidden';
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1', bubbles: true }));
      menu.style.visibility = '';
      for (const tag of ['input', 'textarea', 'select', 'div']) {
        const el = document.createElement(tag); if (tag === 'div') el.contentEditable = 'true';
        document.body.appendChild(el); el.focus();
        el.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1', bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true }));
        el.remove();
      }
    });
    assert.equal(await page.evaluate(() => window.__hits.length), hits);
    await page.evaluate(() => { window.__chosen = 'waiting'; G.UI.choose('선택창 우선', [{ label: '하나', value: 'modal' }]).then(x => { window.__chosen = x; }); });
    await page.waitForSelector('.choices'); await page.keyboard.press('1');
    assert.equal(await page.evaluate(() => window.__chosen), 'waiting');
    assert.equal(await page.evaluate(() => window.__hits.length), hits);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__chosen === 'modal');
    assert.equal(await page.evaluate(() => window.__hits.length), hits);
    await page.evaluate(() => { window.__prompt = 'waiting'; G.UI.prompt('이름 입력', '시험').then(x => { window.__prompt = x; }); });
    await page.waitForSelector('input.nfield'); await page.locator('input.nfield').focus();
    await page.keyboard.press('Escape'); await page.waitForFunction(() => window.__prompt === null);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => window.__hits.at(-1)), 'exit');
    console.log('통과: 22개 키·숫자판·대문자·수첩 키 충돌·길게 누르기·보조키·숨긴 메뉴·입력칸·대화창 우선');

    await page.evaluate(() => { G.Scenes.city.main(); });
    // 두 칸 도시 메뉴와 긴 수치가 붙은 실내 메뉴의 키 표가 글을 가리거나 넘치지 않는지 확인한다.
    for (const [width, height] of [[1280, 720], [960, 540]]) {
      await page.setViewportSize({ width, height });
      for (const kind of [null, 'harbor', 'trade', 'inn', 'gate', 'home']) {
        console.log('배치 확인: ' + width + ' ' + (kind || '거리'));
        if (kind) { await page.evaluate(k => { G.Scenes.city.visit(k); }, kind); await ready(true); }
        const over = await page.evaluate(() => [...document.querySelectorAll('.cmdmenu .cmd')].filter(b => {
          const key = b.querySelector('.cmd-key'); if (!key) return false;
          const r = key.getBoundingClientRect(), box = b.getBoundingClientRect();
          return b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1 || r.right > box.right + 1 || [...b.children].some(ch => {
            if (ch === key || getComputedStyle(ch).position === 'absolute') return false;
            const c = ch.getBoundingClientRect();
            return ch.clientWidth > 0 && (ch.scrollWidth > ch.clientWidth + 1 || c.right > r.left + 1);
          });
        }).map(b => b.textContent));
        assert.deepEqual(over, [], width + ' ' + (kind || '거리') + ' 메뉴 겹침');
        if (kind) { await page.keyboard.press('Escape'); await ready(false); }
      }
    }
    assert.deepEqual(errors, []);
    console.log('통과: 1280×720·960×540 거리/항구/교역소/여관/성문/자택 메뉴 겹침 없음·콘솔 오류 0');
  } catch (e) {
    if (page) {
      console.error(await page.evaluate(() => ({ busy: G.UI.busy(), cityBusy: G.Scenes.city.isBusy(), current: (G.Scenes.city.current() || {}).kind, text: document.querySelector('#ui').innerText.slice(-1800) })).catch(() => ({})));
      await page.screenshot({ path: path.join(OUT, 'failure.png') }).catch(() => {});
    }
    throw e;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
