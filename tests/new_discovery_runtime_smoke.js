/* 2026-10-18 신규 발견물 151종의 실제 게임 연결을 file:// Chromium에서 확인한다.
   - 발견 연출 GIF·종료 프레임·장면 판
   - 비도시 유적·자연 지도 아이콘
   - 도시 유적 정면 건물과 해당 도시 거리 배치 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (error) {
  ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core'));
}

const ROOT = path.resolve(__dirname, '..');
const PROMPTS = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'tools', 'new_discovery_assets', 'prompts.json'), 'utf8'
));
const IDS = PROMPTS.source.map(row => row.id);
const CITY_IDS = PROMPTS.landmarks.map(row => row.id);
const MAP_IDS = PROMPTS.iconSheets.flatMap(row => row.ids);
const executablePath = [
  process.env.BROWSER_EXE,
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find(candidate => candidate && fs.existsSync(candidate));

function ok(value, message) {
  if (!value) throw new Error(message);
  console.log('  ✓ ' + message);
}

(async function () {
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader',
      '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(message.text())) {
      errors.push('console: ' + message.text());
    }
  });
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }));

  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {
      waitUntil: 'domcontentloaded', timeout: 120000
    });
    await page.waitForFunction(() => window.G && G.DISC && G.Reel && G.DiscoveryIcon &&
      G.Town && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });

    const linked = await page.evaluate(async ({ ids, cityIds, mapIds }) => {
      const missingDiscovery = ids.filter(id => !G.DISC[id] ||
        !G.DiscAdd.ids.includes(id) || !G.Scenes.hasReveal(G.DISC[id]));
      const missingReveal = ids.filter(id => !G.Reel.key(G.DISC[id]) ||
        !['discoveries/', 'discovery-ends/', 'discovery-sheets/'].every(prefix =>
          G.Img.has(prefix + id)));
      const missingMap = mapIds.filter(id => {
        const discovery = G.DISC[id];
        const key = discovery && G.DiscoveryIcon.key(discovery);
        return !discovery || !G.DiscoveryIcon.isMapLandmark(discovery) ||
          !key || !G.Img.has(key);
      });
      const badCityData = cityIds.filter(id => {
        const discovery = G.DISC[id];
        return !discovery || discovery.cat !== 'ruin' || discovery.how !== 'city' ||
          !G.CITY_DATA[discovery.city] ||
          G.Img.pick(G.Img.chain.landmark(id)) !== 'landmarks/' + id;
      });

      const played = [];
      for (const id of ['sphinx', 'kinabalu', 'sunbear', 'ankh']) {
        const discovery = G.DISC[id];
        const reel = await G.Reel.load(G.Reel.key(discovery));
        const canvas = document.createElement('canvas');
        canvas.width = 576; canvas.height = 256;
        document.body.appendChild(canvas);
        const player = G.Reel.play(canvas, reel, { ms: 220 });
        const first = canvas.toDataURL();
        await player.done;
        played.push({ id, frames: reel && reel.n, changed: first !== canvas.toDataURL() });
        canvas.remove();
      }

      G.Game.state = {
        date: { y: 2100, m: 5, d: 1 }, player: { look: 'admiral' }, settings: {},
        disc: {}, hints: {}
      };
      const buildings = [
        { kind: 'church', name: '교회', icon: 'church' },
        { kind: 'home', name: '자택', icon: 'house' }
      ];
      const missingInTown = [];
      for (const id of cityIds) {
        const discovery = G.DISC[id];
        await G.Town.open(G.CITY_DATA[discovery.city], buildings);
        const mark = G.Town.runtime().marks.find(item => item.id === id);
        if (!mark || mark.cv.width < 150 || mark.cv.height < 250 ||
            Math.abs(mark.y - 768) > 20) missingInTown.push(id);
      }
      return { missingDiscovery, missingReveal, missingMap, badCityData,
        missingInTown, played, mapCount: G.DiscoveryIcon.count() };
    }, { ids: IDS, cityIds: CITY_IDS, mapIds: MAP_IDS });

    ok(IDS.length === 151 && !linked.missingDiscovery.length,
      '신규 발견물 151종이 실제 발견물 자료에 등록됨');
    ok(!linked.missingReveal.length,
      '151종 모두 발견 GIF·종료 프레임·장면 판과 연결됨');
    ok(MAP_IDS.length === 81 && !linked.missingMap.length,
      '비도시 유적·자연 81종이 항해·해도·육상 지도 아이콘과 연결됨');
    ok(CITY_IDS.length === 19 && !linked.badCityData.length,
      '도시 유적 19종이 해당 도시와 정면 건물 이미지에 연결됨');
    ok(!linked.missingInTown.length,
      '도시 정면 건물 19종이 실제 해당 도시 거리에 배치됨');
    ok(linked.played.every(item => item.frames >= 16 && item.changed),
      '유적·자연·동물·보물 대표 장면 판이 실제 재생됨');
    ok(linked.mapCount >= MAP_IDS.length, '지도 아이콘 등록 수 ' + linked.mapCount + '종');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally {
    await browser.close();
  }
}()).catch(error => {
  console.error('실패: ' + error.message);
  process.exitCode = 1;
});
