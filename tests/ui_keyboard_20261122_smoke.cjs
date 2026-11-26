/* 실제 Tab·Enter·Space·스크롤과 이야기 선택 초점의 회귀 검사. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/ui-keyboard-20261122');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], cases = [];
  try {
    const p = await browser.newPage({ viewport: { width: 960, height: 540 } });
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.addInitScript(() => {
      localStorage.setItem('pu.lang', 'ko'); localStorage.setItem('pu.uiSize', 'normal'); localStorage.setItem('pu_song_preview', '1');
      window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : setTimeout(() => cb(performance.now()), 16);
    });
    await p.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.waitForFunction(() => window.G && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await p.waitForFunction(() => !G.Loader.shown() && !G.Scenes.title.bootPending && !document.querySelector('.title-menu button.navy.disabled'), null, { timeout: 120000 });
    await p.evaluate(() => G.Game.prepareRenderer());
    await p.evaluate(() => {
      G.State.newGame({ name: '선장', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = .35;
      window.openChoice = () => {
        window.choiceDone = false; window.choiceValue = null; window.choiceResolves = 0;
        G.UI.ask('어느 선택지를 실행합니까?', [{ label: '첫 번째', value: 'first' }, { label: '고를 수 없음', value: 'disabled', dis: true }, { label: '마지막', value: 'last' }], { raw: true }).then(v => { choiceValue = v; choiceDone = true; choiceResolves++; });
      };
    });
    const buttons = p.locator('.askrow button');
    for (const key of ['Enter', 'Space']) {
      await p.evaluate(() => openChoice()); await p.waitForSelector('.askrow button');
      await buttons.first().focus(); await p.keyboard.press('Tab');
      assert(await buttons.last().evaluate(el => el === document.activeElement && el.classList.contains('kbd-focus')));
      await p.keyboard.press(key); await p.waitForFunction(() => choiceDone);
      assert.equal(await p.evaluate(() => choiceValue), 'last'); assert.equal(await p.evaluate(() => choiceResolves), 1);
      cases.push({ name: 'Tab으로 비활성 버튼을 건너뛴 뒤 ' + key + '가 실제 초점의 마지막 선택지를 한 번 실행' });
    }
    await p.evaluate(() => openChoice()); await p.waitForSelector('.askrow button');
    await buttons.first().focus(); await p.keyboard.press('ArrowDown');
    assert(await buttons.last().evaluate(el => el === document.activeElement && el.classList.contains('kbd-focus')));
    await p.keyboard.press('ArrowUp'); assert(await buttons.first().evaluate(el => el === document.activeElement));
    await buttons.nth(1).evaluate(el => el.click()); assert.equal(await p.evaluate(() => choiceDone), false);
    await p.keyboard.press('Enter'); await p.waitForFunction(() => choiceDone); assert.equal(await p.evaluate(() => choiceValue), 'first');
    cases.push({ name: 'Tab 뒤 방향키·Enter의 초점과 선택 일치·비활성 선택 방지' });
    await p.evaluate(() => openChoice()); await p.waitForSelector('.askrow button');
    await buttons.last().click(); await p.waitForFunction(() => choiceDone); assert.equal(await p.evaluate(() => choiceValue), 'last');
    cases.push({ name: '마우스로 고른 선택지 유지' });

    await p.evaluate(() => {
      window.originalModes = G.STORY_MODES;
      window.started = [];
      G.STORY_MODES = originalModes.map((m, i) => Object.assign({}, m, { ok: () => true, synopsis: m.synopsis.repeat(30), begin: async () => started.push(i) }));
    });
    async function openStory() {
      await p.evaluate(() => { window.storyDone = false; G.StorySelect.open().then(() => storyDone = true); });
      await p.waitForSelector('.ss-atlas');
    }
    async function focusedStory(kind, id) { assert(await p.evaluate(({ kind, id }) => document.activeElement.matches('.' + kind) && document.activeElement.dataset.story === id, { kind, id })); }
    await openStory();
    const ids = await p.evaluate(() => G.StorySelect.list().map(m => m.id));
    await focusedStory('ss-card', ids[0]);
    await p.keyboard.press('Tab'); await focusedStory('ss-card', ids[1]);
    const focusStyle = await p.locator('.ss-card:focus').evaluate(el => ({ visible: el.matches(':focus-visible'), style: getComputedStyle(el).outlineStyle, width: parseFloat(getComputedStyle(el).outlineWidth) }));
    assert(focusStyle.visible && focusStyle.style === 'solid' && focusStyle.width > 0, JSON.stringify(focusStyle));
    await p.keyboard.press('Enter'); await focusedStory('ss-card', ids[1]);
    assert.equal(await p.locator('.ss-stage').getAttribute('data-story'), ids[1]);
    cases.push({ name: 'Tab으로 옮긴 카드의 초점 표시·선택 후 같은 카드에 초점 복원' });
    await p.keyboard.press('ArrowRight'); await focusedStory('ss-card', ids[2]);
    assert.equal(await p.locator('.ss-stage').getAttribute('data-story'), ids[2]);
    cases.push({ name: '주인공 방향키 전환 뒤 새 카드의 실제 초점 유지' });
    const copy = p.locator('.ss-copy'); await copy.focus();
    for (const key of ['ArrowDown', 'PageDown', 'Space', 'End']) {
      await copy.evaluate(el => el.scrollTop = 0); await p.keyboard.press(key);
      await p.waitForFunction(() => document.querySelector('.ss-copy').scrollTop > 0);
      assert.equal(await p.locator('.ss-stage').getAttribute('data-story'), ids[2]);
      assert.equal(await p.locator('.ss-stage').getAttribute('data-roster-page'), '1');
      assert.equal(await copy.evaluate(el => el === document.activeElement), true);
    }
    await p.keyboard.press('Home'); await p.waitForFunction(() => document.querySelector('.ss-copy').scrollTop === 0);
    await p.keyboard.press('Enter'); assert.deepEqual(await p.evaluate(() => started), []);
    cases.push({ name: '소개문 방향키·PageDown·Space·Home/End의 실제 스크롤·Enter 오시작 방지' });
    await p.locator('.ss-back').focus(); await p.keyboard.press('Enter');
    assert.equal(await p.locator('.ss-stage').getAttribute('data-page'), 'world'); await focusedStory('ss-card', ids[2]);
    await p.locator('.ss-port[data-story="' + ids[0] + '"]').focus(); await p.keyboard.press('Enter'); await focusedStory('ss-port', ids[0]);
    cases.push({ name: '전체 목록 복귀·지도 표식 선택 후 초점 복원' });
    await p.locator('.ss-go').focus(); await p.keyboard.press('Enter'); await p.waitForFunction(() => storyDone);
    assert.deepEqual(await p.evaluate(() => started), [0]);
    cases.push({ name: '시작 버튼에서만 선택한 이야기를 한 번 시작' });

    await p.evaluate(() => { G.STORY_MODES = Array.from({ length: 6 }, (_, i) => Object.assign({}, originalModes[i % originalModes.length], { id: 'qa-' + i, ok: () => true, begin: async () => started.push(i) })); });
    await openStory(); await p.keyboard.press('PageDown'); await focusedStory('ss-card', 'qa-5');
    assert.equal(await p.locator('.ss-stage').getAttribute('data-roster-page'), '2');
    await p.keyboard.press('PageUp'); await focusedStory('ss-card', 'qa-0');
    await p.keyboard.press('Escape'); await p.waitForFunction(() => storyDone);
    await p.evaluate(() => G.STORY_MODES = originalModes);
    cases.push({ name: '여섯 명의 목록을 PageDown/PageUp으로 넘긴 뒤 초점 유지·Escape 종료' });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ cases, errors }, null, 2));
    console.log(JSON.stringify({ cases, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
