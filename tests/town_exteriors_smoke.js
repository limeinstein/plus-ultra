/* 거리 외관 회귀 점검:
   - 25개 고장별 자택·교회와 kraal·tent 13종 전체가 모두 등록되고 실제로 읽히는가
   - 로마 교황청 전용 외관과 도시 건축 발견물 92종이 등록되고 읽히는가
   - 도시 건축 발견물이 건립 연도에 맞춰 거리 뒤편에 나타나는가
   node tests/town_exteriors_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const STYLES = ['africa', 'arabia', 'aztec', 'china', 'easteurope', 'espana', 'france', 'iberia', 'inca', 'india', 'italy', 'japan', 'korea', 'kraal', 'masai', 'ottoman', 'plains', 'pueblo', 'russia', 'seasia', 'steppe', 'swahili', 'tent', 'tropic', 'woodland'];
const KINDS = ['harbor', 'trade', 'shipyard', 'tavern', 'inn', 'market', 'church', 'library', 'palace', 'mansion', 'guild', 'gate', 'home'];
const LANDMARKS = [
  'pharos', 'greatlib', 'colosseum', 'byrsa', 'weiyang', 'notredame', 'sankore', 'templomayor', 'kilwa',
  'apostolic', 'erdenezuu', 'wisdom', 'whitetower', 'askia', 'forbidden', 'stbasil', 'kremlin', 'belem',
  'arsenal', 'casacontrat', 'sistine', 'uffizi', 'pisa', 'globe', 'porcelain', 'grandbazaar', 'havana',
  'louvre', 'parthenon', 'hwangnyong', 'jongmyo', 'hagiasophia', 'sepulchre', 'djenne', 'zimbabwe',
  'delhimosque', 'potala', 'isfahanmosque', 'alhambra', 'rockdome', 'redfort', 'bluemosque', 'versailles',
  'eiffel', 'bigben', 'bolshoi', 'orszaghaz', 'maracana', 'sydneyopera', 'unhq', 'biosphere', 'battersea',
  'bellasartes', 'hue', 'emille', 'ayubuddha', 'stele', 'redsquare', 'liberty', 'panama', 'cristo',
  'broadway', 'eram', 'sagrada', 'nabawi', 'kaaba', 'tiantan', 'dayanta', 'huanghelou', 'vittala',
  'umayyad', 'topkapi', 'siosepol',
  'jeronimos', 'giralda', 'stmartintours', 'milanduomo', 'sanmarco', 'smmaggiore', 'florenceduomo',
  'saintsernin', 'edinburgh', 'kyivsophia', 'ironpagoda', 'kinkakuji', 'phrasisanphet', 'vanmieu',
  'stpaulhill', 'jokhang', 'dazhao', 'suleymaniye', 'ibntulun'
];
const NEW_LANDMARKS = [
  'emille', 'ayubuddha', 'stele', 'redsquare', 'liberty', 'panama', 'cristo', 'broadway', 'eram',
  'sagrada', 'nabawi', 'kaaba', 'tiantan', 'dayanta', 'huanghelou', 'vittala', 'umayyad', 'topkapi', 'siosepol',
  'jeronimos', 'giralda', 'stmartintours', 'milanduomo', 'sanmarco', 'smmaggiore', 'florenceduomo',
  'saintsernin', 'edinburgh', 'kyivsophia', 'ironpagoda', 'kinkakuji', 'phrasisanphet', 'vanmieu',
  'stpaulhill', 'jokhang', 'dazhao', 'suleymaniye', 'ibntulun'
];

function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  // 글꼴 CDN은 시험 환경에서 막혀 있을 수 있으므로 게임 오류로 세지 않는다.
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });

  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });

    const assets = await page.evaluate(async ({ styles, landmarks, kinds }) => {
      const expected = [];
      styles.forEach(s => { expected.push('exterior-styles/' + s + '/home', 'exterior-styles/' + s + '/church'); });
      ['kraal', 'tent'].forEach(s => kinds.filter(k => k !== 'home' && k !== 'church')
        .forEach(k => expected.push('exterior-styles/' + s + '/' + k)));
      landmarks.forEach(id => expected.push('landmarks/' + id));
      expected.push('exteriors/palace@33');
      const missing = expected.filter(k => !G.Img.has(k));
      const loaded = await Promise.all(expected.map(async k => [k, !!(await G.Img.load(k))]));
      const cityRuins = G.DISCOVERIES.filter(d => d.cat === 'ruin' && d.how === 'city');
      const unillustratedCityRuins = cityRuins.filter(d => !G.Img.has('landmarks/' + d.id))
        .map(d => d.id + ':' + d.name);
      return { expected: expected.length, missing, failed: loaded.filter(x => !x[1]).map(x => x[0]),
        cityRuins: cityRuins.length, unillustratedCityRuins,
        papal: G.Img.pick(G.Img.chain.exterior('palace', G.CITY_DATA[33], '')) };
    }, { styles: STYLES, landmarks: LANDMARKS, kinds: KINDS });
    ok(assets.expected === 165, '외관 165개(자택 25 + 교회 25 + kraal·tent 나머지 22 + 도시 발견물 92 + 교황청 1) 검사');
    ok(!assets.missing.length, '필요한 외관이 모두 이미지 목록에 등록됨');
    ok(!assets.failed.length, '필요한 외관 파일이 모두 실제로 읽힘');
    ok(assets.cityRuins === 92 && !assets.unillustratedCityRuins.length,
      '도시 유적 92종 모두 전용 외관을 포함 (실제 ' + assets.cityRuins + ')');
    ok(assets.papal === 'exteriors/palace@33', '로마 왕궁 자리에 교황청 전용 외관을 우선 사용');

    // 거리 모듈은 날짜와 제독 생김새만 참조한다. 항해 지도 준비와 무관하게 메모리 상태만 둔다.
    const years = await page.evaluate(async () => {
      G.Game.state = {
        date: { y: 1480, m: 5, d: 1 }, player: { look: 'admiral' }, settings: {},
        disc: {}, hints: {}
      };
      const buildings = [{ kind: 'church', name: '교회', icon: 'church' }, { kind: 'home', name: '자택', icon: 'house' }];
      async function open(cityId, year) {
        G.Game.state.date.y = year;
        await G.Town.open(G.CITY_DATA[cityId], buildings);
        return G.Town.runtime().marks.length;
      }
      return {
        alex1480: await open(78, 1480),
        paris1480: await open(14, 1480),
        paris1600: await open(14, 1600),
        paris1900: await open(14, 1900)
      };
    });
    ok(years.alex1480 === 2, '1480년 알렉산드리아에 파로스 등대·대도서관 외관 표시');
    ok(years.paris1480 === 2 && years.paris1600 === 3 && years.paris1900 === 4,
      '파리 외관이 건립 연도에 맞춰 2개 → 3개 → 4개로 늘어남 (실제 ' +
      years.paris1480 + ' → ' + years.paris1600 + ' → ' + years.paris1900 + ')');

    const placed = await page.evaluate(async ids => {
      G.Game.state.date.y = 2100;
      const buildings = [{ kind: 'church', name: '교회', icon: 'church' }, { kind: 'home', name: '자택', icon: 'house' }];
      const out = {};
      for (const id of ids) {
        const d = G.DISCOVERIES.find(x => x.id === id);
        await G.Town.open(G.CITY_DATA[d.city], buildings);
        const m = G.Town.runtime().marks.find(x => x.id === id);
        out[id] = m ? { w: m.cv.width, h: m.cv.height, y: m.y } : null;
      }
      return out;
    }, NEW_LANDMARKS);
    const missingPlaced = NEW_LANDMARKS.filter(id => !placed[id]);
    const badScale = NEW_LANDMARKS.filter(id => placed[id] &&
      (placed[id].w < 150 || placed[id].w > 820 || placed[id].h < 250 || placed[id].h > 520));
    const badFloor = NEW_LANDMARKS.filter(id => placed[id] && Math.abs(placed[id].y - 768) > 20);
    ok(!missingPlaced.length, '새 전용 외관 38종이 해당 도시 거리에 모두 배치됨');
    ok(!badScale.length, '새 전용 외관 38종의 거리 크기가 정상 범위');
    ok(!badFloor.length, '새 전용 외관 38종의 바닥선이 길에 맞음');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
