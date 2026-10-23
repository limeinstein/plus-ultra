/* 베타 게임 익명 항해 현황 전송 회귀 점검.
   PAGE=http://127.0.0.1:4179/ node tests/telemetry_privacy_smoke.js
   PAGE를 주지 않으면 이 폴더의 index.html을 베타 채널로 꾸며 연다.
   목록(발견물·도시)은 통계 서버가 늘 받아야 하므로 신호마다 싣는다 */
'use strict';
const { chromium } = require('playwright');

const path = require('path');
const { pathToFileURL } = require('url');
const PAGE = process.env.PAGE || pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const FAKE_BETA = !process.env.PAGE;
function ok(value, message) { if (!value) throw new Error(message); console.log('  ✓ ' + message); }

let browser;
(async function () {
  const errors = [], payloads = [];
  browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  if (FAKE_BETA) await page.addInitScript(() => { window.PU_WEB_CHANNEL = 'beta'; window.PU_TELEMETRY_ENDPOINT = 'https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/event'; });
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error' && !(FAKE_BETA && /ERR_FILE_NOT_FOUND|Failed to load resource|fonts\.(googleapis|gstatic)/.test(message.text()))) errors.push(message.text()); });
  await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/event', route => route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' }));
  await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/presence', route => {
    if (route.request().method() === 'POST') payloads.push(route.request().postDataJSON());
    return route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' });
  });
  await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.State && G.DISCOVERIES && G.CITY_DATA, null, { timeout: 120000 });
  await page.evaluate(() => {
    const s = G.State.newGame({ name: '개인정보시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: G.LANGS.map(() => 0), diff: 'normal' });
    G.Game.state = s; s.player.fame = 12345; s.day = 402; s.visited = { 0: 1 };
    const first = G.DISCOVERIES[0]; s.disc[first.id] = { me: 1, found: 1 };
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);
  const payload = payloads.filter(row => row && row.voyage).pop();
  ok(!!payload, '현재 항해 현황을 실시간 접속 신호에 포함');
  const ver = await page.evaluate(() => (G.Scenes && G.Scenes.title && G.Scenes.title.version) || '');
  ok(payload.version === ver && payload.surface === 'game', '버전과 게임 화면 구분 전송 (' + ver + ')');
  ok(!JSON.stringify(payload).includes('개인정보시험'), '실제 플레이어명은 전송하지 않음');
  ok(payload.voyage.current.name === '리스본' && payload.voyage.fame === 12345 && payload.voyage.playDays === 402, '게임 속 현재 도시·명성·항해 일수 전송');
  ok(payload.voyage.foundDiscoveries.length === 1 && payload.voyage.missingDiscoveries.length > 0, '발견·미발견 발견물 목록 분리');
  ok(payload.voyage.foundCities.length === 1 && payload.voyage.missingCities.length > 0, '방문·미방문 도시 목록 분리');
  ok(JSON.stringify(payload).length < 96000, '항해 현황 요청 크기 제한 준수');
  ok(errors.length === 0, '콘솔 오류 0');
  console.log('통과');
})().catch(error => { console.error('실패:', error.stack || error.message); process.exitCode = 1; })
  .finally(async () => { if (browser) await browser.close(); });
