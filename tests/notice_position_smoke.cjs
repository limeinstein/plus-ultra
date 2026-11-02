/* 알림: 왼쪽 빈 공간 · 끌기와 누르기 구분 · 기기별 위치 기억 · 대화 보호. */
'use strict';
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const OUT = path.resolve(__dirname, '../artifacts/notice-position-20261103');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const errors = [];
  try {
    const p = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
    await p.addInitScript(() => { requestAnimationFrame = () => 0; });
    async function start() {
      await p.waitForFunction(() => window.G && G.Game && G.Scenes.sea, null, { polling: 100 });
      await p.evaluate(async () => {
        await G.Game.ensureGeo();
        const s = G.State.newGame({ name: '알림 위치 검사', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        s.flags.prologue = true; s.settings.res = .35;
        G.Game.go('sea', { depart: 0 });
        const st = G.Scenes.sea.runtime(); st.paused = true; s.loc.lon = -25; s.loc.lat = -10; st.cam.lon = -25; st.cam.lat = -10;
        document.querySelectorAll('.modal-back').forEach(e => e.remove());
        document.querySelector('.toasts').innerHTML = '';
        G.BALANCE.notice.minMs = G.BALANCE.notice.maxMs = 60000; // 포인터 검사 중 시간 만료와 분리한다.
        window.noticeSample = () => G.UI.toast('시에라리온 쪽으로 바닷길을 따라 갑니다 (뭍·섬을 돌아감). 이번 항해는 자동항해를 풀어 배속은 그대로입니다 — 다음 항구부터 다시 자동항해.', 'map', 8000);
        s.flags.cloudTip = true;
        for (let i = 0; i < 12; i++) G.Scenes.sea.update(0);
        await G.Loader.hide();
        document.querySelector('.toasts').innerHTML = ''; noticeSample();
      });
    }
    async function rects() { return p.evaluate(() => {
      const r = s => { const e = document.querySelector(s), b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom }; };
      return { toast: r('.toasts'), mini: r('.minimap'), status: r('.status-strip'), bar: r('.sailbar'), ui: r('#ui'), saved: G.HudPin.saved('notices'), count: document.querySelectorAll('.toasts .toast:not(.out)').length };
    }); }
    function overlap(a, b) { return a.x < b.right - 1 && a.right > b.x + 1 && a.y < b.bottom - 1 && a.bottom > b.y + 1; }
    function clearLeft(r) {
      assert(r.toast.right < r.ui.x + r.ui.width * .4, '왼쪽에 있어 중앙 배를 가리지 않는다');
      for (const key of ['mini', 'status', 'bar']) assert(!overlap(r.toast, r[key]), `${key}를 가리지 않는다`);
    }
    await p.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await start();
    await p.evaluate(() => G.HudPin.reset('notices'));
    const initial = await rects(); clearLeft(initial);
    fs.mkdirSync(OUT, { recursive: true });
    await p.waitForTimeout(400); // 알림이 나타나는 짧은 효과가 끝난 화면을 남긴다.
    await p.screenshot({ path: path.join(OUT, 'left-default.png') });
    // 실제 포인터로 끌었을 때 닫힘·바다 클릭이 발생하지 않는다.
    const b = initial.toast;
    await p.mouse.move(b.x + 35, b.y + 25); await p.mouse.down();
    await p.mouse.move(b.x + 430, b.y + 130, { steps: 8 }); await p.mouse.up();
    const moved = await rects();
    assert(moved.saved && moved.toast.x > b.x + 250 && moved.count === initial.count, '끌기만 하면 이동하고 닫히지 않는다');
    // 새 알림의 높이가 달라져도 기억한 좌표를 쓴다.
    await p.evaluate(() => { document.querySelector('.toasts').innerHTML = ''; G.UI.toast('새 항로를 찾았습니다!', 'map', 8000); });
    const next = await rects(); assert(Math.abs(next.toast.x - moved.toast.x) < 2 && Math.abs(next.toast.y - moved.toast.y) < 2);
    await p.reload({ waitUntil: 'domcontentloaded' }); await start();
    const restored = await rects(); assert(Math.abs(restored.toast.x - moved.toast.x) < 2 && Math.abs(restored.toast.y - moved.toast.y) < 2, '페이지를 다시 열어도 같은 자리');
    await p.evaluate(() => { window.noticeWindow = G.UI.window({ title: '알림 위치 확인', html: '창을 가리지 않게 잠시 기본 위치를 쓴다.', buttons: [{ label: '닫기', value: 1 }] }); G.UI.noticeZone(); });
    assert.equal(await p.locator('.toasts.hp-moved').count(), 0, '창이 열리면 사용자 위치를 잠시 보류한다');
    await p.evaluate(() => { noticeWindow.close(); G.UI.noticeZone(); });
    assert(Math.abs((await rects()).toast.x - restored.toast.x) < 2, '창을 닫으면 기억한 위치로 복귀한다');
    await p.setViewportSize({ width: 960, height: 540 }); await p.waitForTimeout(100);
    const resized = await rects();
    assert(resized.toast.right <= resized.ui.right + 1 && resized.toast.bottom <= resized.ui.bottom + 1, '옮긴 알림도 작은 창 밖으로 벗어나지 않는다');
    // 작은 창·글자 확대와 긴 알림 세 개도 조작줄과 해도를 덮지 않는다.
    await p.evaluate(() => G.HudPin.reset('notices'));
    await p.mouse.move(1500, 30);
    for (const [width, height] of [[960, 540], [1280, 720], [1600, 900]]) {
      await p.setViewportSize({ width, height });
      await p.waitForTimeout(100); // 창 크기 변경의 UI 배율 재배치가 끝난 다음 검사한다.
      await p.evaluate(() => {
        G.HudPin.fit();
        document.querySelector('.status-strip').classList.add('open');
        document.querySelector('.toasts').innerHTML = '';
        for (let i = 0; i < 3; i++) G.UI.toast('긴 위험 알림 ' + i + ' · ' + '보급과 항로를 확인하십시오. '.repeat(10), 'warn', 8000);
        G.UI.noticeZone();
      });
      clearLeft(await rects());
    }
    await p.evaluate(() => { document.querySelector('#ui').classList.add('watching-nature'); G.UI.noticeZone(); });
    clearLeft(await rects());
    await p.evaluate(() => { document.querySelector('#ui').classList.remove('watching-nature'); G.UI.noticeZone(); });
    const beforeRight = await rects();
    await p.mouse.move(beforeRight.toast.x + 30, beforeRight.toast.y + 25); await p.mouse.down();
    await p.mouse.move(beforeRight.toast.x + 260, beforeRight.toast.y + 50, { steps: 5 }); await p.mouse.up();
    const beforeReset = await rects();
    await p.mouse.click(beforeReset.toast.x + 30, beforeReset.toast.y + 25, { button: 'right' });
    assert.equal((await rects()).saved, null, '오른쪽 클릭으로 기본 위치 복원');
    // 그냥 누르면 기존처럼 닫힌다(드래그 직후 억제 시간이 지난 다음 별도 클릭).
    await p.waitForTimeout(450);
    const clickRect = (await rects()).toast;
    await p.mouse.click(clickRect.x + 40, clickRect.bottom - 25);
    assert.equal(await p.locator('.toasts .toast.out').count(), 1, '단순 클릭은 닫기');
    assert.deepEqual(errors, [], '콘솔 오류 0');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ initial, moved, restored, errors }, null, 2));
    console.log('통과: 왼쪽 배치·패널 겹침 방지·실제 드래그·클릭 닫기·재접속 위치 복원·작은 창·긴 알림·오른쪽 클릭 초기화·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
