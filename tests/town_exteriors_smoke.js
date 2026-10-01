/* 거리 외관 회귀 점검:
   - 23개 고장별 자택·교회 그림이 모두 등록되고 실제로 읽히는가
   - 로마 교황청 전용 외관과 도시 건축 발견물 54종이 등록되고 읽히는가
   - 도시 건축 발견물이 건립 연도에 맞춰 거리 뒤편에 나타나는가
   node tests/town_exteriors_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const STYLES = ['africa', 'arabia', 'aztec', 'china', 'easteurope', 'espana', 'france', 'iberia', 'inca', 'india', 'italy', 'japan', 'korea', 'masai', 'ottoman', 'plains', 'pueblo', 'russia', 'seasia', 'steppe', 'swahili', 'tropic', 'woodland'];
const LANDMARKS = [
  'pharos', 'greatlib', 'colosseum', 'byrsa', 'weiyang', 'notredame', 'sankore', 'templomayor', 'kilwa',
  'apostolic', 'erdenezuu', 'wisdom', 'whitetower', 'askia', 'forbidden', 'stbasil', 'kremlin', 'belem',
  'arsenal', 'casacontrat', 'sistine', 'uffizi', 'pisa', 'globe', 'porcelain', 'grandbazaar', 'havana',
  'louvre', 'parthenon', 'hwangnyong', 'jongmyo', 'hagiasophia', 'sepulchre', 'djenne', 'zimbabwe',
  'delhimosque', 'potala', 'isfahanmosque', 'alhambra', 'rockdome', 'redfort', 'bluemosque', 'versailles',
  'eiffel', 'bigben', 'bolshoi', 'orszaghaz', 'maracana', 'sydneyopera', 'unhq', 'biosphere', 'battersea',
  'bellasartes', 'hue'
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

    const assets = await page.evaluate(async ({ styles, landmarks }) => {
      const expected = [];
      styles.forEach(s => { expected.push('exterior-styles/' + s + '/home', 'exterior-styles/' + s + '/church'); });
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
    }, { styles: STYLES, landmarks: LANDMARKS });
    ok(assets.expected === 101, '외관 101개(자택 23 + 교회 23 + 도시 발견물 54 + 교황청 1) 검사');
    ok(!assets.missing.length, '필요한 외관이 모두 이미지 목록에 등록됨');
    ok(!assets.failed.length, '필요한 외관 파일이 모두 실제로 읽힘');
    const excluded = ['ayubuddha', 'broadway', 'cristo', 'emille', 'eram', 'liberty', 'panama', 'redsquare', 'stele'];
    const excludedActual = assets.unillustratedCityRuins.map(x => x.split(':')[0]).sort();
    ok(assets.cityRuins === 63 && excludedActual.join(',') === excluded.sort().join(','),
      '도시 유적 63종 중 건물 54종을 빠짐없이 포함 (실제 ' + assets.cityRuins + ', 미제작 ' + excludedActual.join(',') + ')');
    console.log('  · 외관 대상이 아닌 도시 유적 9종: ' + assets.unillustratedCityRuins.join(', '));
    ok(assets.papal === 'exteriors/palace@33', '로마 왕궁 자리에 교황청 전용 외관을 우선 사용');

    // 거리 모듈은 날짜와 제독 생김새만 참조한다. 항해 지도 준비와 무관하게 메모리 상태만 둔다.
    const years = await page.evaluate(async () => {
      G.Game.state = { date: { y: 1480, m: 5, d: 1 }, player: { look: 'admiral' }, settings: {} };
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
    ok(years.paris1480 === 1 && years.paris1600 === 2 && years.paris1900 === 4,
      '파리 외관이 건립 연도에 맞춰 1개 → 2개 → 4개로 늘어남');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
