/* 1550년 신규 여급의 연도 경계·전용 초상·실제 술집 대화 검사.
   node tests/maids_1550_smoke.js [--browser] */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const CASES = [
  ['m_1550_qz', 175, '심약란'], ['m_1550_hs', 229, '윤소월'],
  ['m_1550_edo', 297, '오미오'], ['m_1550_cag', 35, '리비아 세라'],
  ['m_1550_vis', 65, '에바 린드'], ['m_1550_yor', 41, '세실리 에번턴'],
  ['m_1550_mag', 50, '마르타 켈러'], ['m_1550_hor', 128, '미라 데사이'],
  ['m_1550_ade', 124, '사미라 알하킴'], ['m_1550_mlg', 9, '이사벨 데루나']
];
function ok(value, message) { if (!value) throw new Error(message); console.log('✓ ' + message); }
const initialGame = { Art: {} };
const sandbox = { G: initialGame, window: { G: initialGame }, console, performance: { now: () => Date.now() } };
vm.createContext(sandbox);
for (const file of ['js/core/util.js', 'js/data/cities.js', 'js/data/people.js',
  'images/manifest.js', 'js/data/portraitfaces.js', 'js/core/images.js', 'js/systems/maidswap.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
}
const G = sandbox.window.G;
ok(G.MAIDS.length === 185, '이름 있는 여급 모두 185명');
ok(new Set(G.MAIDS.map(m => m.city)).size === 185, '기존 여급을 교체하지 않고 서로 다른 도시 10곳에 추가');
for (const [id, city, name] of CASES) {
  const m = G.MAID[id], key = 'portraits/maids/' + id;
  ok(m && m.name === name && m.city === city && m.from === 1550 && G.LIKES[m.like], name + ': 고유 ID·이름·도시·취향·1550년 등장');
  ok(G.MAIDS.filter(x => x.name === name).length === 1, name + ': 다른 여급과 이름이 겹치지 않음');
  for (const year of [1480, 1549, 1550, 1600, 1700]) {
    G.Game = { state: { date: { y: year } } };
    const expected = year >= 1550 ? m : null;
    ok(G.baseMaidAt(city, year) === expected && G.MaidSwap.at(city) === expected,
      name + ': ' + year + '년 실제 선택 ' + (expected ? '등장' : '미등장'));
  }
  ok(G.Img.pick(G.Img.chain.maid(id, G.CITY_DATA[city])) === key &&
    G.Img.pick(G.Img.chain.maidHalf(id, G.CITY_DATA[city])) === key + '_half', name + ': 전용 얼굴·무릎상 연결');
  for (const suffix of ['', '_half']) {
    const k = key + suffix;
    ok(G.Img.has(k) && fs.existsSync(path.join(ROOT, 'images', G.IMAGE_FILES[k])) && G.PORTRAIT_FACES[k],
      name + ': ' + (suffix ? '무릎상' : '얼굴상') + ' 파일·얼굴 리그 좌표');
  }
}
if (process.argv.includes('--browser')) runBrowser().catch(error => { console.error(error); process.exitCode = 1; });

async function runBrowser() {
  const { chromium } = require('playwright');
  const out = path.join(ROOT, 'artifacts/maids1550/runtime');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + (m.location().url || ''))) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const result = await page.evaluate(async cases => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '1550 여급 검사', nation: 'PT', job: 'explorer', age: 28,
        birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state; s.flags.prologue = true; s.settings.res = 0.35;
      await G.Game.ensureGeo();
      G.Town._toldKeys = true; // 거리 조작 안내가 인물 얼굴을 가리지 않는, 안내를 본 상태로 검사한다.
      const bad = [], keys = [];
      for (const [id, cid, name] of cases) {
        const c = G.CITY_DATA[cid]; s.loc = { mode: 'city', city: cid, lon: c.lon, lat: c.lat };
        s.date.y = 1549;
        if (G.Scenes.city.B.tavern.sub(c).includes(name)) bad.push(id + ':1549');
        s.date.y = 1550;
        if (!G.Scenes.city.B.tavern.sub(c).includes(name)) bad.push(id + ':1550');
        const who = G.Scenes.city.B.tavern.maidSpeaker(G.MAID[id]);
        const key = 'portraits/maids/' + id;
        if (who.name !== name || G.Img.pick(who.half) !== key + '_half' ||
            G.Img.pick(G.Art.portraitKeys(who.portrait)) !== key) bad.push(id + ':speaker');
        keys.push(key, key + '_half');
      }
      const loads = await Promise.all(keys.map(key => new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve({ key, w: image.naturalWidth, h: image.naturalHeight });
        image.onerror = () => resolve({ key, w: 0, h: 0 });
        image.src = G.Img.src(key);
      })));
      for (const image of loads) if (image.w !== 1024 || image.h !== (image.key.endsWith('_half') ? 1536 : 1024)) bad.push(image.key + ':size');
      return { bad, loaded: loads.length };
    }, CASES);
    ok(!result.bad.length && result.loaded === 20, '브라우저: 10곳 연도 경계·대화 초상·20개 실제 이미지 로드 ' + result.bad.join(','));
    for (const id of ['m_1550_hs', 'm_1550_yor', 'm_1550_ade']) {
      await page.evaluate(async id => {
        const m = G.MAID[id], c = G.CITY_DATA[m.city], s = G.Game.state;
        s.date.y = 1550; s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat };
        G.Game.go('city', { cityId: c.id });
      }, id);
      await page.waitForTimeout(500);
      await page.evaluate(id => { const m = G.MAID[id]; G.Scenes.city.B.tavern.maid(G.CITY_DATA[m.city], m).catch(e => console.error(e)); }, id);
      await page.waitForTimeout(1200);
      const name = CASES.find(x => x[0] === id)[2];
      ok((await page.locator('body').innerText()).includes(name), name + ': 실제 대화창');
      await page.screenshot({ path: path.join(out, id + '.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }
    ok(!errors.length, '브라우저 콘솔 오류 0 ' + errors.join(' | '));
  } finally { await browser.close(); }
}
