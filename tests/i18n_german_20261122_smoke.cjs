/* 독일어: 실제 언어 선택·새 항해·도시·교역·도감과 이름/숫자 틀을 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const out = process.env.OUT || path.join(root, 'artifacts/i18n-de-20261122');
const base = process.env.WEB_BASE || pathToFileURL(root + path.sep).href;
const hangul = /[가-힣]/;
(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], report = {};
  try {
    const context = await browser.newContext({locale: 'de-DE', viewport: {width: 1280, height: 900}});
    const p = await context.newPage();
    p.setDefaultNavigationTimeout(120000);
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    const title = async () => {
      await p.waitForFunction(() => window.G && G.Game.sceneName === 'title' && document.querySelector('.title-menu .btn:not(.disabled)'), null, {timeout: 120000});
      await p.locator('#boot-loader').waitFor({state: 'hidden', timeout: 120000});
    };
    const esc = async () => {for (let n = 0; n < 20 && await p.evaluate(() => G.UI.busy()); n++) await p.keyboard.press('Escape');};
    await p.goto(new URL('index.html', base).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await title();
    const initial = await p.evaluate(() => G.I18N.lang);
    assert.equal(initial, new URL(base).protocol === 'file:' ? 'ko' : 'de');
    await p.locator('.title-lang').click();
    const de = p.locator('.choices > .choice').filter({hasText: 'Deutsch'});
    assert(!(await de.getAttribute('class')).includes('dis'));
    await de.click();
    await p.waitForFunction(() => G.I18N.lang === 'de' && document.documentElement.lang === 'de');
    await title();
    report.title = await p.locator('.title-menu').innerText();
    assert(report.title.includes('Neue Seereise'));
    assert(!hangul.test(report.title), report.title);
    await p.screenshot({path: path.join(out, 'title.png')});
    console.log('제목 화면 통과');
    report.templates = await p.evaluate(() => ({
      date: G.U.fmtDate({y: 1480, m: 5, d: 1}),
      city: G.cityName(0), cologne: G.cityName(47), good: G.goodName('pepper'),
      arrival: G.T('{city|에} 처음으로 입항했다.', {city: '리스본'}),
      reordered: G.I18N.tr('맛보기 발견(희망봉)을 3개 찾으면 「서쪽 바닷길」의 단서가 나옵니다.'),
      heal: G.I18N.tr('아직 능력 점수 3점·특기 점수 2점이 남아 있습니다. 남긴 점수는 시작 후 배분할 수 없습니다. 그대로 시작할까요?'),
      food: G.I18N.tr('식량 12일 + 교역품 대체분 3일 = 합계 15일. 교역품을 팔면 대체분도 줄어듭니다.'),
      fallback: G.I18N.tx('번역하지 않은 문장 확인용'),
      counts: Object.fromEntries(['text', 'pat', 'city', 'good', 'name'].map(k => [k, Object.keys(G.I18N.packs.de[k]).length]))
    }));
    assert.equal(report.templates.date, '1. Mai 1480');
    assert.equal(report.templates.city, 'Lissabon');
    assert.equal(report.templates.cologne, 'Köln');
    assert.equal(report.templates.good, 'Pfeffer');
    assert.equal(report.templates.arrival, 'Zum ersten Mal in Lissabon eingelaufen.');
    assert.equal(report.templates.reordered, 'Entdecken Sie 3 erste Einblicke (Kap der Guten Hoffnung), um Hinweise auf „Westlicher Seeweg“ zu erhalten.');
    assert(report.templates.heal.includes('3 Attributpunkte und 2 Fertigkeitspunkte'));
    assert(report.templates.food.includes('12 Tage') && report.templates.food.includes('3 Tage') && report.templates.food.includes('15 Tage'));
    assert.equal(report.templates.fallback, '번역하지 않은 문장 확인용');
    console.log('숫자·이름·날짜 틀 통과');
    await p.evaluate(() => G.Scenes.title.help());
    await p.waitForSelector('.modal-back .content');
    report.help = await p.locator('.modal-back .content').innerText();
    assert(report.help.includes('Seeschlachten') && !hangul.test(report.help));
    await esc();
    await p.evaluate(() => {G.Display.open();});
    await p.waitForSelector('.disp-panel');
    assert((await p.locator('[data-dlang="de"]').getAttribute('class')).includes('on'));
    assert(!(await p.locator('[data-dlang="de"]').getAttribute('class')).includes('dim'));
    await esc();
    console.log('조작 안내·언어 설정 통과');
    await p.locator('.title-menu .btn').filter({hasText: 'Neue Seereise'}).click();
    await p.waitForSelector('.create');
    await p.waitForFunction(() => document.querySelector('#go').textContent.includes('Bereit zum Auslaufen'));
    report.create = await p.locator('.create').innerText();
    assert(!hangul.test(report.create), report.create);
    await p.screenshot({path: path.join(out, 'create.png')});
    await p.reload({waitUntil: 'domcontentloaded'});
    await title();
    assert.equal(await p.evaluate(() => localStorage.getItem('pu.lang')), 'de');
    assert.equal(await p.evaluate(() => G.I18N.lang), 'de');
    await p.evaluate(() => {
      G.State.newGame({name: 'Johann', nation: 'PT', job: 'merchant', age: 25, birth: {m: 5, d: 1}, st: {str: 60, int: 65, mar: 60, cha: 60}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = 0.35;
      G.Game.state.player.gold = 20000;
      G.Game.ensureGeo().then(() => G.Game.go('city', {cityId: 0}));
    });
    await p.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.city-banner'), null, {timeout: 120000});
    await esc();
    await p.waitForTimeout(500);
    report.city = await p.evaluate(() => ({name: document.querySelector('.city-banner .nm').textContent, menu: [...document.querySelectorAll('.cmdmenu .cmd')].map(b => b.textContent.trim())}));
    assert.equal(report.city.name, 'Lissabon');
    assert(report.city.menu.some(t => t.includes('Handelskontor')) && report.city.menu.some(t => t.includes('Hafen')));
    assert(!hangul.test(report.city.menu.join(' ')), report.city.menu.join(' / '));
    await p.screenshot({path: path.join(out, 'city.png')});
    await p.evaluate(() => {G.Scenes.city.B.trade.buy(G.CITY_DATA[0]);});
    await p.waitForSelector('.modal-back');
    await p.waitForTimeout(300);
    report.trade = await p.locator('.modal-back').last().innerText();
    assert(report.trade.includes('Kaufen — Lissabon') && report.trade.includes('Vorrat'));
    assert(!hangul.test(report.trade), report.trade);
    await p.screenshot({path: path.join(out, 'trade.png')});
    await esc();
    await p.evaluate(() => {G.Info.open('admiral');});
    await p.waitForSelector('.notebook-win');
    report.notebookTabs = await p.locator('.notebook-win .tab').allTextContents();
    assert.equal(report.notebookTabs.length, 13);
    assert(report.notebookTabs.every(t => !hangul.test(t)), report.notebookTabs.join(' / '));
    assert(await p.locator('.notebook-win .tab').evaluateAll(tabs => tabs.every(tab => tab.scrollWidth <= tab.clientWidth + 1)), '독일어 수첩 탭의 글이 옆 칸으로 넘치지 않는다');
    report.notebookLabelsFit = await p.locator('.notebook-win').evaluate(el => [...el.querySelectorAll('.famebar .fn, .skillgrid .flex > span:first-child')].every(label => label.scrollWidth <= label.clientWidth + 1));
    assert(report.notebookLabelsFit, '독일어 명성·특기 이름이 단어 중간에서 잘리지 않는다');
    await p.screenshot({path: path.join(out, 'notebook.png')});
    await esc();
    await p.evaluate(() => {G.Game.go('sea', {depart: 0});});
    await p.waitForFunction(() => G.Game.sceneName === 'sea', null, {timeout: 120000});
    await p.waitForTimeout(500);
    report.sea = await p.locator('.sailbar').innerText();
    assert(report.sea.includes('Suchen') && !hangul.test(report.sea), report.sea);
    await p.screenshot({path: path.join(out, 'sea.png')});
    await p.evaluate(() => {G.Game.go('battle', {npc: {kind: 'pirate', n: 2}});});
    await p.waitForSelector('.ordpanel');
    await p.waitForTimeout(300);
    report.battle = await p.locator('.ordpanel').innerText();
    assert(report.battle.includes('Flottenbefehle') && !hangul.test(report.battle), report.battle);
    await p.screenshot({path: path.join(out, 'battle.png')});
    await p.goto(new URL('catalog.html?view=player', base).href, {waitUntil: 'domcontentloaded'});
    await p.waitForSelector('#tabs [data-tab]');
    report.tabs = await p.locator('#tabs [data-tab]').allTextContents();
    assert.equal(report.tabs.length, 7);
    assert(report.tabs.every(t => !hangul.test(t)), report.tabs.join(' / '));
    report.errors = errors;
    assert.deepEqual(errors, []);
    await context.close();
    console.log('독일어 선택·생성·항구·교역·수첩·항해·해전·도감·틀·저장한 언어 검사 통과');
  } finally {
    fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify({...report, errors}, null, 2));
    await browser.close();
  }
})().catch(e => {console.error(e); process.exitCode = 1;});
