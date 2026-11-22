/* 포르투갈어: 실제 언어 선택·새 항해·도시·교역·도감과 이름/숫자 틀을 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const out = process.env.OUT || path.join(root, 'artifacts/i18n-pt-20261122');
const base = process.env.WEB_BASE || pathToFileURL(root + path.sep).href;
const hangul = /[가-힣]/;
function verifySources() {
  const vm = require('node:vm'), os = require('node:os'), {spawnSync} = require('node:child_process');
  const context = vm.createContext({document: {body: null, documentElement: {dataset: {}}, querySelector: () => null, addEventListener() {}}, navigator: {languages: ['pt-PT']}, location: {protocol: 'https:'}, localStorage: {getItem: () => null}});
  vm.runInContext('window = globalThis; G = {};', context);
  for (const file of ['js/core/i18n.js', 'js/lang/pt.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  for (const locale of ['pt-PT', 'pt-BR']) {
    context.navigator.languages = [locale];
    assert.equal(context.G.I18N.pref(), 'pt', locale + ' 웹 첫 방문');
  }
  const pack = context.G.I18N.packs.pt;
  context.G.CITY_DATA = [{id: 9, name: '말라가'}];
  context.G.I18N.lang = 'pt';
  const rumor = context.G.I18N.tr('장사꾼들 사이에 이런 말이 돈다. 말라가 쪽에 봄비가 한 번도 오지 않았다더군. 이대로 가면 가을에 곡식이 모자랄 걸세.', true);
  assert(rumor && !/[가-힣]/.test(rumor) && rumor.includes('Málaga'), '시장 소문의 여러 문장과 도시 이름');
  for (const section of ['text', 'city', 'good', 'name']) for (const value of Object.values(pack[section])) assert(!/[가-힣\uFFFD]/.test(value), value);
  for (const [, value] of pack.pat) assert(!/[가-힣\uFFFD]/.test(value), value);
  for (const group of Object.values(pack.person)) for (const value of Object.values(group)) assert(!/[가-힣\uFFFD]/.test(value), value);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'good-hope-pt-'));
  try {
    const file = path.join(dir, 'pt.js');
    const result = spawnSync(process.env.PYTHON || 'python', ['tools/i18n/build_lang.py', 'pt', file], {cwd: root, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    const normalize = s => s.replace(/\r\n/g, '\n');
    assert.equal(normalize(fs.readFileSync(file, 'utf8')), normalize(fs.readFileSync(path.join(root, 'js/lang/pt.js'), 'utf8')), '번역 원본 재생성 일치');
  } finally {
    assert.equal(path.dirname(dir), path.resolve(os.tmpdir()));
    assert(path.basename(dir).startsWith('good-hope-pt-'));
    fs.rmSync(dir, {recursive: true});
  }
  return {buildMatches: true, webLocales: ['pt-PT', 'pt-BR'], translationColumnsClean: true, marketRumor: rumor};
}
if (process.env.PT_SOURCES_ONLY === '1') console.log(JSON.stringify(verifySources()));
else (async () => {
  fs.mkdirSync(out, {recursive: true});
  const errors = [], report = {sources: verifySources()};
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  try {
    const context = await browser.newContext({locale: 'pt-PT', viewport: {width: 1280, height: 900}});
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
    assert.equal(initial, new URL(base).protocol === 'file:' ? 'ko' : 'pt');
    await p.locator('.title-lang').click();
    const de = p.locator('.choices > .choice').filter({hasText: 'Português'});
    assert(!(await de.getAttribute('class')).includes('dis'));
    await de.click();
    await p.waitForFunction(() => G.I18N.lang === 'pt' && document.documentElement.lang === 'pt');
    await title();
    report.title = await p.locator('.title-menu').innerText();
    assert(report.title.includes('Nova viagem'));
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
      counts: Object.fromEntries(['text', 'pat', 'city', 'good', 'name'].map(k => [k, Object.keys(G.I18N.packs.pt[k]).length]))
    }));
    assert.equal(report.templates.date, '1 de maio de 1480');
    assert.equal(report.templates.city, 'Lisboa');
    assert.equal(report.templates.cologne, 'Colónia');
    assert.equal(report.templates.good, 'Pimenta');
    assert.equal(report.templates.arrival, 'Atracou em Lisboa pela primeira vez.');
    assert.equal(report.templates.reordered, 'Encontre 3 descobertas iniciais (Cabo da Boa Esperança) para obter pistas de «Rota marítima ocidental».');
    assert(report.templates.heal.includes('3 pontos de atributos e 2 pontos de competências'));
    assert(report.templates.food.includes('12 dias') && report.templates.food.includes('3 dias') && report.templates.food.includes('15 dias'));
    assert.equal(report.templates.fallback, '번역하지 않은 문장 확인용');
    report.rainTemplates = await p.evaluate(() => {
      const results = [];
      for (const order of Object.values(G.Rain.ORDERS)) for (const selected of ['', ' (지금)']) for (const fatigue of ['+1.0', '-0.6', '0.0']) {
        const original = order.name + selected + '<br><small style="opacity:.8">' + order.desc + ' (하루 피로 ' + fatigue + ' · 속력 ×0.92)</small>';
        results.push({fatigue, text: G.I18N.tr(original, true)});
      }
      return results;
    });
    assert.equal(report.rainTemplates.length, 18);
    for (const {fatigue, text} of report.rainTemplates) assert(text && !hangul.test(text) && text.includes(fatigue) && text.includes('0.92'), text);
    const locales = await p.evaluate(() => {
      const I = G.I18N, previous = localStorage.getItem('pu.lang'), results = {};
      localStorage.removeItem('pu.lang');
      const descriptor = Object.getOwnPropertyDescriptor(navigator, 'languages');
      try {
        // file://는 의도적으로 한국어로 시작한다. 웹 첫 방문의 지역별 선택은 별도 정적 검사에서 확인한다.
        for (const locale of ['pt-PT', 'pt-BR']) {
          Object.defineProperty(navigator, 'languages', {configurable: true, value: [locale]});
          results[locale] = I.pref();
        }
      } finally {
        if (descriptor) Object.defineProperty(navigator, 'languages', descriptor);
        else delete navigator.languages;
        if (previous != null) localStorage.setItem('pu.lang', previous);
      }
      return results;
    });
    assert.deepEqual(locales, {'pt-PT': new URL(base).protocol === 'file:' ? 'ko' : 'pt', 'pt-BR': new URL(base).protocol === 'file:' ? 'ko' : 'pt'});
    report.locales = locales;
    console.log('숫자·이름·날짜 틀 통과');
    await p.evaluate(() => G.Scenes.title.help());
    await p.waitForSelector('.modal-back .content');
    report.help = await p.locator('.modal-back .content').innerText();
    assert(report.help.includes('Combates navais') && !hangul.test(report.help));
    await esc();
    await p.evaluate(() => {G.Display.open();});
    await p.waitForSelector('.disp-panel');
    assert((await p.locator('[data-dlang="pt"]').getAttribute('class')).includes('on'));
    assert(!(await p.locator('[data-dlang="pt"]').getAttribute('class')).includes('dim'));
    await esc();
    console.log('조작 안내·언어 설정 통과');
    await p.evaluate(() => {G.StorySelect.open();});
    await p.waitForSelector('.ss-card');
    const stories = await p.locator('.ss-card').evaluateAll(cards => cards.map(card => card.dataset.story));
    report.stories = {};
    for (const id of stories) {
      await p.locator('.ss-card[data-story="' + id + '"]').click();
      await p.waitForTimeout(180);
      const text = await p.locator('.ss-stage').innerText();
      assert(!hangul.test(text), id + ': ' + text);
      assert(text.includes('Começar esta história'));
      report.stories[id] = text;
      await p.screenshot({path: path.join(out, 'story-' + id + '.png')});
    }
    await esc();
    await p.locator('.title-menu .btn').filter({hasText: 'Nova viagem'}).click();
    await p.waitForSelector('.create');
    await p.waitForFunction(() => document.querySelector('#go').textContent.includes('Pronto para zarpar'));
    report.create = await p.locator('.create').innerText();
    assert(!hangul.test(report.create), report.create);
    await p.screenshot({path: path.join(out, 'create.png')});
    await p.reload({waitUntil: 'domcontentloaded'});
    await title();
    assert.equal(await p.evaluate(() => localStorage.getItem('pu.lang')), 'pt');
    assert.equal(await p.evaluate(() => G.I18N.lang), 'pt');
    await p.evaluate(() => {
      G.State.newGame({name: 'Johann', nation: 'PT', job: 'merchant', age: 25, birth: {m: 5, d: 1}, st: {str: 60, int: 65, mar: 60, cha: 60}, sk: {}, lg: [], diff: 'normal'});
      G.Game.state.settings.res = 0.35;
      G.Game.state.player.gold = 20000;
      G.Game.ensureGeo().then(() => G.Game.go('city', {cityId: 0}));
    });
    await p.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.city-banner'), null, {timeout: 120000});
    await esc();
    await p.waitForTimeout(500);
    report.nameCoverage = await p.evaluate(() => ({
      cities: G.CITY_DATA.filter(city => city && !G.I18N.packs.pt.city[city.id]).map(city => city.id),
      goods: G.GOODS.filter(good => !G.I18N.packs.pt.good[good.id]).map(good => good.id)
    }));
    assert.deepEqual(report.nameCoverage, {cities: [], goods: []});
    report.city = await p.evaluate(() => ({name: document.querySelector('.city-banner .nm').textContent, menu: [...document.querySelectorAll('.cmdmenu .cmd')].map(b => b.textContent.trim())}));
    assert.equal(report.city.name, 'Lisboa');
    assert(report.city.menu.some(t => t.includes('Feitoria')) && report.city.menu.some(t => t.includes('Porto')));
    assert(!hangul.test(report.city.menu.join(' ')), report.city.menu.join(' / '));
    await p.screenshot({path: path.join(out, 'city.png')});
    await p.evaluate(() => {G.Scenes.city.B.trade.buy(G.CITY_DATA[0]);});
    await p.waitForSelector('.modal-back');
    await p.waitForTimeout(300);
    report.trade = await p.locator('.modal-back').last().innerText();
    assert(report.trade.includes('Comprar — Lisboa') && report.trade.includes('Existências'));
    assert(!hangul.test(report.trade), report.trade);
    await p.screenshot({path: path.join(out, 'trade.png')});
    await esc();
    await p.evaluate(() => {G.Info.open('admiral');});
    await p.waitForSelector('.notebook-win');
    report.notebookTabs = await p.locator('.notebook-win .tab').allTextContents();
    assert.equal(report.notebookTabs.length, 13);
    assert(report.notebookTabs.every(t => !hangul.test(t)), report.notebookTabs.join(' / '));
    assert(await p.locator('.notebook-win .tab').evaluateAll(tabs => tabs.every(tab => tab.scrollWidth <= tab.clientWidth + 1)), '포르투갈어 수첩 탭의 글이 옆 칸으로 넘치지 않는다');
    report.notebookLabelsFit = await p.locator('.notebook-win').evaluate(el => [...el.querySelectorAll('.famebar .fn, .skillgrid .flex > span:first-child')].every(label => label.scrollWidth <= label.clientWidth + 1));
    assert(report.notebookLabelsFit, '포르투갈어 명성·특기 이름이 단어 중간에서 잘리지 않는다');
    await p.screenshot({path: path.join(out, 'notebook.png')});
    await esc();
    await p.evaluate(() => {G.Info.settings();});
    await p.waitForSelector('.modal-back .content');
    await p.waitForTimeout(300);
    report.settings = await p.locator('.modal-back .content').last().evaluate(el => {
      const copy = el.cloneNode(true);
      copy.querySelectorAll('[translate="no"]').forEach(n => n.remove());
      return copy.textContent;
    });
    assert(!hangul.test(report.settings), report.settings);
    assert(report.settings.includes('Teclas') && report.settings.includes('Guardar também num ficheiro'));
    await p.screenshot({path: path.join(out, 'settings.png')});
    report.settingsVariants = [];
    for (const selector of ['[data-km="helm"]', '[data-km="dir"]', '[data-cs="slow"]', '[data-cs="fast"]', '[data-cs="normal"]', '[data-pa="stop"]', '[data-pa="ask"]', '[data-pa="notify"]', '[data-tk="open"]', '[data-tk="on"]', '[data-tk="off"]']) {
      await p.locator(selector).click();
      await p.waitForTimeout(90);
      const text = await p.locator('.modal-back .content').last().evaluate(el => {
        const copy = el.cloneNode(true);
        copy.querySelectorAll('[translate="no"]').forEach(n => n.remove());
        return copy.textContent;
      });
      assert(!hangul.test(text), selector + ': ' + text);
      report.settingsVariants.push(selector);
    }
    await esc();
    await p.evaluate(() => {G.Game.go('sea', {depart: 0});});
    await p.waitForFunction(() => G.Game.sceneName === 'sea', null, {timeout: 120000});
    await p.waitForTimeout(500);
    report.sea = await p.locator('.sailbar').innerText();
    assert(report.sea.includes('Procurar') && !hangul.test(report.sea), report.sea);
    await p.screenshot({path: path.join(out, 'sea.png')});
    await p.evaluate(() => {G.Game.state.rain = {lv: 2, days: 2, order: 'work', asked: true, got: 0, n: 0}; G.Rain.ask(false);});
    await p.waitForSelector('.askrow > button');
    await p.waitForTimeout(180);
    report.rainChoices = await p.locator('.dlg').last().innerText();
    assert(!hangul.test(report.rainChoices), report.rainChoices);
    assert(report.rainChoices.includes('Manter como está'));
    await p.screenshot({path: path.join(out, 'rain.png')});
    await p.locator('.askrow > button').filter({hasText: 'Manter como está'}).click();
    await esc();
    await p.evaluate(() => {G.Game.go('battle', {npc: {kind: 'pirate', n: 2}});});
    await p.waitForSelector('.ordpanel');
    await p.waitForTimeout(300);
    report.battle = await p.locator('.ordpanel').innerText();
    assert(report.battle.includes('Ordens à frota') && !hangul.test(report.battle), report.battle);
    await p.screenshot({path: path.join(out, 'battle.png')});
    await p.goto(new URL('catalog.html?view=player', base).href, {waitUntil: 'domcontentloaded'});
    await p.waitForSelector('#tabs [data-tab]');
    report.tabs = await p.locator('#tabs [data-tab]').allTextContents();
    assert.equal(report.tabs.length, 7);
    assert(report.tabs.every(t => !hangul.test(t)), report.tabs.join(' / '));
    report.errors = errors;
    assert.deepEqual(errors, []);
    await context.close();
    console.log('포르투갈어 선택·생성·항구·교역·수첩·항해·해전·도감·틀·저장한 언어 검사 통과');
  } finally {
    fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify({...report, errors}, null, 2));
    await browser.close();
  }
})().catch(e => {console.error(e); process.exitCode = 1;});
