/* 코스타 델 솔 3 OST 점검 (js/systems/ytmusic.js · js/data/ost.js) — 유튜브는 가짜 재생기(window.YT)로 바꿔 끼워 본다.
   - 설정 「배경 음악」 OST → 장면·자리마다 맞는 곡, 영상 id·시작/끝 초
   - 주점·미니 게임 같은 「잠깐」 곡과 그 뒤 되돌아가기
   - 유튜브를 못 읽으면 기존 음악으로 돌아감
   node tests/ost_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const GAME = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

async function boot(page, mock) {
  if (mock) await page.addInitScript(() => {
    window.__yt = { calls: [], vol: null };
    window.YT = { Player: function (id, opts) { const self = this; setTimeout(() => opts.events.onReady({ target: self }), 5); this.loadVideoById = o => window.__yt.calls.push(o); this.setVolume = v => { window.__yt.vol = v; }; this.playVideo = () => {}; this.pauseVideo = () => { window.__yt.paused = true; }; } };
  });
  else await page.route(/youtube\.com/, r => r.abort());
  await page.goto(GAME);
  await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
  await page.evaluate(() => G.Game.go('create'));
  await page.waitForSelector('#nm');
  await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
  await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
}

(async function () {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    let page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await boot(page, true);
    const r = await page.evaluate(async () => {
      const Y = G.YTM, AU = G.Audio, s = G.Game.state, out = {};
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const city = nm => G.CITY_DATA.filter(c => c.name === nm)[0];
      Y.setSource('ost'); await wait(60);
      out.on = Y.on();
      const town = nm => { const c = city(nm); s.loc.city = c.id; s.loc.lon = c.lon; s.loc.lat = c.lat; AU.music('town'); return Y.current(); };
      out.towns = { 리스본: town('리스본'), 세빌리아: town('세빌리아'), 파리: town('파리'), 런던: town('런던'), 베니스: town('베니스'), 이스탄불: town('이스탄불'), 통북투: town('통북투'),
        델리: town('델리'), 남경: town('남경'), 한양: town('한양'), 쿄토: town('쿄토'), 말라카: town('말라카'), 아바나: town('아바나'), 모스크바: town('모스크바') };
      const sea = (lon, lat) => { s.loc.city = null; s.loc.lon = lon; s.loc.lat = lat; AU.music('sea'); return Y.current(); };
      out.seas = { 희망봉: sea(20, -35), 지중해: sea(15, 37), 북해: sea(3, 56), 대서양: sea(-40, 30), 카리브: sea(-75, 17), 태평양: sea(-150, 0), 인도양: sea(75, -10), 동남아: sea(110, 5) };
      const c0 = city('리스본'); s.loc.city = c0.id; s.loc.lon = c0.lon; s.loc.lat = c0.lat;
      AU.music('battle'); out.battle = Y.current();
      AU.music('town'); AU.moment('tavern'); out.tavern = Y.current(); AU.music('sea'); out.during = Y.current(); AU.music('town'); AU.resume(); out.after = Y.current();
      AU.moment('palace'); out.palace = Y.current(); AU.resume();
      AU.moment('mansion'); out.mansion = Y.current(); AU.resume();
      // 감싼 함수: 육상전 동안 27번, 끝나면 되돌아감
      const orig = G.Games.landWar; let inner = null;
      out.wrapped = !!(G.Games.landWar && G.Games.landWar._ost);
      const t = G.OST.tracks.t27, last = window.__yt.calls[window.__yt.calls.length - 1];
      out.lastCall = last; out.t27 = t;
      Y.moment('landwar'); out.landwar = Y.current(); AU.music('battle'); out.landwarInner = Y.current(); Y.resume();
      Y.moment('minigame'); out.mini = Y.current(); Y.resume();
      out.calls = window.__yt.calls.length;
      const lc = window.__yt.calls[window.__yt.calls.length - 1];
      out.lastVideo = lc && lc.videoId;
      Y.setSource('base'); out.offPaused = !!window.__yt.paused; out.offOn = Y.on();
      return out;
    });
    ok(r.on, '설정에서 「코스타 델 솔 3 OST」를 고르면 켜짐');
    const T = r.towns;
    ok(T.리스본 === 't13' && T.세빌리아 === 't08' && T.파리 === 't04' && T.런던 === 't07' && T.베니스 === 't04' && T.이스탄불 === 't06' && T.통북투 === 'africa', '도시: 고향 리스본 13(귀환) · 세빌리아 08 · 파리·베니스 04 · 런던 07 · 이스탄불 06 · 통북투 아프리카');
    ok(T.델리 === 't09' && T.남경 === 't05' && T.한양 === 'joseon' && T.쿄토 === 't26' && T.말라카 === 't17' && T.아바나 === 't03' && T.모스크바 === 't07', '도시: 델리 09 · 남경 05 · 한양 조선 · 쿄토 26 · 말라카 17 · 아바나 03 · 모스크바 07');
    const SE = r.seas;
    ok(SE.희망봉 === 't01' && SE.지중해 === 't14' && SE.북해 === 't18' && SE.대서양 === 't23' && SE.카리브 === 't24' && SE.태평양 === 't25' && SE.인도양 === 't12' && SE.동남아 === 't17', '바다: 희망봉 01 · 지중해 14 · 북해 18 · 대서양 23 · 카리브 24 · 태평양 25 · 인도양 12 · 동남아 17');
    ok(r.battle === 't10' && r.palace === 't20' && r.mansion === 't19', '해전 10 · 왕궁 알현 20 · 귀족 알현 19');
    ok(r.tavern === 't21' && r.during === 't21' && r.after === 't13', '주점 21 — 그동안 장면이 바뀌어도 그대로, 나오면 도시 곡(13)으로');
    ok(r.wrapped && r.landwar === 't27' && r.landwarInner === 't27' && r.mini === 't22', '육상 전투 27(안에서 해전 곡을 불러도 그대로) · 미니 게임 22');
    ok(r.calls > 10 && r.lastVideo === 'cnYv1JIAmaE', '유튜브 재생기에 영상 id·시작 초로 ' + r.calls + '번 틀었다');
    ok(r.offPaused && !r.offOn, '「기존 음악」으로 돌리면 유튜브는 멈춤');
    await page.close();
    // 유튜브를 못 읽는 환경 → 기존 음악으로
    page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await boot(page, false);
    const f = await page.evaluate(async () => {
      G.YTM.setSource('ost'); G.Audio.music('town');
      for (let i = 0; i < 60 && !G.YTM.failed(); i++) await new Promise(r => setTimeout(r, 250));
      return { failed: G.YTM.failed(), on: G.YTM.on(), src: G.Game.state.settings.musicSrc };
    });
    ok(f.failed && !f.on && f.src === 'ost', '유튜브를 못 읽으면 알리고 기존 음악으로 (설정은 OST 그대로 — 다음에 다시 시도)');
    ok(!errors.length, '페이지 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
