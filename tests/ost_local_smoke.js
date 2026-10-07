/* 내 컴퓨터의 코스타 델 솔 MP3 점검 (js/systems/localost.js · js/systems/ytmusic.js · js/data/ost.js)
   진짜 MP3(64분) 대신 ffmpeg로 40초짜리 시험 파일을 만들어 곡 구간을 그 안에 잡는다.
   - 파일을 찾으면 유튜브 창 없이 장면 곡을 튼다 · 곡을 바꿀 때 두 재생기를 겹쳐 천천히 바꾼다
   - 주점에 들렀다 나오면 거리 곡이 멈췄던 자리부터 이어진다 · 곡 끝에서 처음과 겹쳐 돌린다 · 곡 이름이 잠깐 뜬다
   - 파일이 없으면 유튜브로 (state 'none')
   node tests/ost_local_smoke.js   (ffmpeg 필요) */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const GAME = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ostlocal-')), MP3 = path.join(DIR, 'test.mp3');
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'lavfi', '-i', 'sine=frequency=440:duration=10', '-f', 'lavfi', '-i', 'sine=frequency=660:duration=10',
  '-f', 'lavfi', '-i', 'sine=frequency=880:duration=10', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=10',
  '-filter_complex', '[0][1][2][3]concat=n=4:v=0:a=1', '-b:a', '64k', MP3]);

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::|youtube/.test(m.text())) errors.push(m.text()); });
    await page.route(/youtube\.com/, r => r.abort());
    await page.addInitScript((url) => {
      window.__ytCalls = 0;
      window.YT = { Player: function (id, opts) { const self = this; setTimeout(() => opts.events.onReady({ target: self }), 5); this.loadVideoById = () => { window.__ytCalls++; }; this.setVolume = () => {}; this.playVideo = () => {}; this.pauseVideo = () => {}; } };
      window.__testMp3 = url;
    }, pathToFileURL(MP3).href);
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    // 시험 파일과 구간: 13(고향) 1~9초 · 21(주점) 11~19 · 23(대서양) 21~29 · 14(지중해) 31~37
    await page.evaluate(() => {
      const L = G.OST.local; L.files = ['../no/such.mp3', window.__testMp3]; L.minDur = 30;
      L.segs = { t13: [1, 9], t21: [11, 19], t23: [21, 29], t14: [31, 37], t08: [31, 37] };
      G.FX.localOst = Object.assign({}, G.FX.localOst, { fade: 1.2, loopFade: 1.5, resumeSec: 60, showSec: 2 });
    });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    const wait = ms => page.waitForTimeout(ms);
    const st = () => page.evaluate(() => Object.assign(G.LocalOST.status(), { cur: G.YTM.current(), box: !!(document.querySelector('.ost-box') && document.querySelector('.ost-box').style.display !== 'none'), now: (document.querySelector('.ost-now') || {}).textContent || '' }));

    // ① 고향(도시) — 설정 OST → 내 MP3로
    await page.evaluate(() => { const s = G.Game.state; s.settings.music = 0.5; const c = G.CITY_DATA[s.player.home]; s.loc.city = c.id; G.YTM.setSource('ost'); });
    await page.waitForFunction(() => G.LocalOST.ready() && G.LocalOST.status().time > 1.5, null, { timeout: 15000 });
    await wait(1500);
    let a = await st();
    console.log(JSON.stringify(a));
    ok(a.state === 'ready' && /test\.mp3/.test(a.source) && a.cur === 't13' && a.track === 't13' && a.time >= 1 && a.time < 9 && !a.paused && !a.box, '내 MP3를 찾아(없는 첫 자리는 건너뜀) 고향 곡 13을 유튜브 창 없이 튼다 (' + a.time + '초)');
    ok(/13 집으로 귀환/.test(a.now), '곡 이름이 잠깐 뜬다: ' + a.now);
    ok(Math.max(...a.vols) > 0.5 && Math.max(...a.vols) <= 0.73, '소리 크기는 설정 음악(0.5)을 따른다 (' + Math.max(...a.vols) + ')');
    const t13at = a.time;

    // ② 주점 — 겹쳐 바꾸기
    await page.evaluate(() => G.YTM.moment('tavern'));
    await wait(400);
    const mid = await st();
    await wait(1600);
    const tav = await st();
    console.log(JSON.stringify(mid), JSON.stringify(tav));
    ok(mid.vols.filter(v => v > 0.02).length === 2, '곡이 바뀌는 동안 두 곡이 겹쳐 들린다 (' + mid.vols.join(' / ') + ')');
    ok(tav.track === 't21' && tav.time >= 11 && tav.time < 19 && tav.vols.filter(v => v > 0.02).length === 1, '주점 곡 21로 넘어갔고 앞 곡은 조용히 멈춤 (' + tav.time + '초)');

    // ③ 나오면 거리 곡이 멈춘 자리부터
    await page.evaluate(() => G.YTM.resume());
    await wait(800);
    const back = await st();
    console.log(JSON.stringify(back));
    ok(back.track === 't13' && back.time >= t13at + 1 && back.time < 9, '주점에서 나오면 고향 곡이 멈췄던 자리(' + t13at + '초 뒤)부터 이어진다 (' + back.time + '초)');

    // ④ 곡 끝에서 처음과 겹쳐 돌림
    await page.waitForFunction(() => { const s = G.LocalOST.status(); return s.track === 't13' && s.time < 3; }, null, { timeout: 15000 });
    const loop = await st();
    ok(loop.time >= 1 && loop.time < 3, '곡 끝(9초)에 닿기 전에 처음(1초)으로 겹쳐 돌린다 (' + loop.time + '초)');

    // ⑤ 바다 곡 · 소리 크기 · 기존 음악으로
    await page.evaluate(() => { const s = G.Game.state; s.loc.lon = -30; s.loc.lat = 30; G.Audio.music('sea'); });
    await wait(1800);
    const sea = await st();
    await page.evaluate(() => { G.Game.state.settings.music = 0.1; G.Audio.setVolume(); });
    await wait(300);
    const quiet = await st();
    ok(sea.track === 't23' && quiet.vols.some(v => v > 0) && Math.max(...quiet.vols) < 0.2, '대서양 먼바다는 23, 음악 크기를 줄이면 바로 작아진다 (' + Math.max(...quiet.vols) + ')');
    await page.evaluate(() => G.YTM.setSource('base'));
    await wait(1500);
    const base = await st();
    ok(base.vols.every(v => !v) && base.track === null, '「기존 음악」으로 돌리면 내 MP3는 조용히 멈춘다');
    ok(await page.evaluate(() => window.__ytCalls) === 0 && !base.box, '그동안 유튜브 재생기는 한 번도 쓰지 않았다');

    // ⑥ 파일이 없으면 유튜브로
    const none = await page.evaluate(async () => {
      await G.LocalOST.forget(); G.OST.local.files = ['../no/such.mp3']; G.YTM.setSource('ost');
      await new Promise(r => setTimeout(r, 1500));
      return { state: G.LocalOST.state(), yt: window.__ytCalls, local: G.YTM.local() };
    });
    ok(none.state === 'none' && !none.local && none.yt > 0, '내 MP3가 없으면 예전처럼 유튜브 재생기로 튼다');
    ok(!errors.length, '페이지 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); fs.rmSync(DIR, { recursive: true, force: true }); }
})();
