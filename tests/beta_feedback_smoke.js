/* 베타 센터 익명 피드백 회귀 점검.
   PAGE=http://127.0.0.1:4179/center/ node tests/beta_feedback_smoke.js */
'use strict';
const { chromium } = require('playwright');

const PAGE = process.env.PAGE || 'http://127.0.0.1:4179/center/';
function ok(value, message) { if (!value) throw new Error(message); console.log('  ✓ ' + message); }

let browser;
(async function () {
  const errors = [];
  let submitted = null;
  let presence = null;
  browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: Number(process.env.WIDTH) || 960, height: Number(process.env.HEIGHT) || 900 } });
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

  await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/feedback', async route => {
    if (route.request().method() === 'POST') {
      submitted = route.request().postDataJSON();
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ accepted: true, id: 8 }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ posts: [{
      id: 7, category: 'suggestion', title: '익명 글 보기 시험', detail: '게시판에 익명 글 내용이 표시됩니다.',
      steps: '', environment: 'Chrome', status: 'closed', reply: '개발팀 답변 표시 시험입니다.',
      repliedAt: '2026-10-18 00:00:00', createdAt: '2026-10-17 12:00:00'
    }] }) });
  });
  await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/event', route =>
    route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' }));
  await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/presence', route => {
    if (route.request().method() === 'POST') presence = route.request().postDataJSON();
    return route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true,"online":1}' });
  });
  await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/stats', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      generatedAt: '2026-10-20T10:00:00.000Z', voyages: [{ alias: '가*', currentPlace: '리스본', lon: -9.2, lat: 38.7, fame: 12000, playDays: 400, foundDiscoveryCount: 42, missingDiscoveryCount: 8, foundCityCount: 30, missingCityCount: 5 }],
      fameRanking: [{ alias: '가*', currentPlace: '리스본', fame: 12000, playDays: 400, foundDiscoveryCount: 42, missingDiscoveryCount: 8, foundCityCount: 30, missingCityCount: 5 }],
      playRanking: [{ alias: '가*', currentPlace: '리스본', fame: 12000, playDays: 400, foundDiscoveryCount: 42, missingDiscoveryCount: 8, foundCityCount: 30, missingCityCount: 5 }],
      discoveryRanking: [{ alias: '가*', foundDiscoveryCount: 42, missingDiscoveryCount: 8 }],
      cityRanking: [{ alias: '가*', foundCityCount: 30, missingCityCount: 5 }],
      popularDiscoveries: [{ id: 'moai', name: '모아이', count: 1 }], popularCities: [{ id: 0, name: '리스본', count: 1 }]
    }) }));
  await page.route('https://api.github.com/repos/limeinstein/plus-ultra/issues**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.post');
  const shownVersion = ((await page.locator('.eyebrow').innerText()).match(/VERSION\s+(\d+\.\d{3})/) || [])[1];
  ok(!!shownVersion, '베타 센터에 배포 버전 표시');
  ok(await page.locator('#feedback-form').isVisible(), '로그인 없는 피드백 양식 표시');
  ok((await page.locator('.post-title').first().innerText()).includes('익명 글 보기 시험'), '익명 글을 공개 게시판에 합쳐 표시');
  await page.locator('.post').first().click();
  ok((await page.locator('.comment').first().innerText()).includes('개발팀 답변 표시 시험입니다.'), '익명 글 아래 관리자 답변 표시');
  ok((await page.locator('.post-links a').first().getAttribute('href')).endsWith('/admin#feedback-7'), '익명 글에서 해당 관리자 답변 화면으로 연결');

  await page.locator('[name=title]').fill('로그인 없는 등록 시험');
  await page.locator('[name=detail]').fill('계정 없이도 의견을 보낼 수 있는지 확인합니다.');
  await page.waitForTimeout(3100);
  await page.locator('#feedback-submit').click();
  await page.waitForFunction(() => document.querySelector('#feedback-form-status').textContent.includes('등록되었습니다'));
  ok(submitted && submitted.title === '로그인 없는 등록 시험', '익명 피드백 POST 전송');
  ok(!('name' in submitted) && !('account' in submitted) && !('ip' in submitted), '이름·계정·IP를 보내지 않음');
  ok(presence && presence.surface === 'center' && presence.version === shownVersion, '베타 센터 실시간 접속 신호 전송 (' + shownVersion + ')');
  ok(typeof presence.sessionKey === 'string' && presence.sessionKey.length >= 20, '탭 한정 무작위 접속 키 전송');
  await page.waitForSelector('.voyage-pin');
  ok((await page.locator('.voyage-pin').first().innerText()) === '가*', '실제 이름 대신 한 글자 익명 표식으로 세계 지도 표시');
  ok((await page.locator('#fame-ranking').innerText()).includes('12,000'), '명성 순위와 현재 도시·미발견 수 표시');
  ok((await page.locator('#duration-ranking').innerText()).includes('1년 35일'), '게임 내 항해 기간 순위 표시');
  ok((await page.locator('#popular-discovery').innerText()) === '모아이' && (await page.locator('#popular-city').innerText()) === '리스본', '가장 자주 발견된 발견물과 도시 표시');
  if (process.env.SCREENSHOT) await page.screenshot({ path: process.env.SCREENSHOT, fullPage: true });
  if (errors.length) console.error(errors.join('\n'));
  ok(errors.length === 0, '콘솔 오류 0');
  console.log('통과');
})().catch(error => { console.error('실패:', error.stack || error.message); process.exitCode = 1; })
  .finally(async () => { if (browser) await browser.close(); });
