/* 고장에 맞는 음악 · 주점에서 나오면 거리의 곡 (tests/music_region_smoke.js) — node tests/music_region_smoke.js
   기존 음악: 도시 양식·고장마다 곡(파일 또는 고장의 음계로 만든 코드 음악) · 바다 구역 · 뭍(가까운 도시) · 주점 곡 → 나가기·출항하면 거리·바다 곡
   코스타 델 솔 3 OST: 가짜 유튜브 재생기로 — 주점 21번 → 나오면 그 도시의 곡, 건물을 여러 번 드나들어도 쌓이지 않고 바다로 나가면 바다 곡. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  // 가짜 유튜브 재생기: 무엇을 틀었는지 적어 둔다
  await page.addInitScript(() => {
    window.__yt = [];
    window.YT = { Player: function (id, o) { const p = { loadVideoById: v => window.__yt.push(v.videoId + '@' + v.startSeconds), setVolume() {}, playVideo() {}, pauseVideo() { window.__yt.push('pause'); } }; setTimeout(() => o.events.onReady(), 0); return p; } };
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35; s.date = { y: 1560, m: 6, d: 1 }; s.player.home = 0;
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
    });
    // ① 도시마다 고장의 곡 (기존 음악)
    const r = await page.evaluate(() => {
      const s = G.Game.state, A = G.Audio, id = n => G.CITY_DATA.findIndex(c => c.name === n);
      const at = n => { const i = id(n), c = G.CITY_DATA[i]; s.loc = { mode: 'city', city: i, lon: c.lon, lat: c.lat }; return n + '=' + A.pick('town'); };
      const seN = G.CITY_DATA.find(c => c.style === 'se' && c.region === 8).name; window.__seN = seN;
      const towns = ['리스본', '런던', '나가사키', '한양', '천주', '캘커타', '카이로', seN, '아바나', '통북투', '베니스', '시드니'].map(at).map(x => x.replace(seN + '=', '동남아=') );
      const sea = (lon, lat) => { s.loc = { mode: 'sea', lon, lat }; return A.pick('sea'); };
      const seas = { med: sea(15, 37), ind: sea(70, 5), east: sea(124, 30), sea: sea(110, 5), amer: sea(-75, 20), atl: sea(-30, 30), north: sea(3, 56) };
      const land = (lon, lat) => { s.loc = { mode: 'land', lon, lat }; return G.Geo.terrain(lon, lat) + ':' + A.pick('land'); };
      return { towns, seas, lands: [land(135.7, 35.0), land(78, 22), land(-3.7, 40.4)], none: G.CITY_DATA.filter(c => { s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat }; return !A.pick('town'); }).length };
    });
    console.log(JSON.stringify(r));
    const T = Object.fromEntries(r.towns.map(x => x.split('=')));
    ok(T['리스본'] === 'city_med' && T['베니스'] === 'city_med' && T['런던'] === 'north_europe', '유럽: 리스본·베니스 지중해 곡, 런던 북유럽 곡');
    ok(T['나가사키'] === 'gen:japan' && T['한양'] === 'gen:korea' && T['천주'] === 'gen:east', '동아시아: 일본 미야코부시 · 조선 장단 · 중국 5음');
    ok(T['캘커타'] === 'gen:india' && T['카이로'] === 'gen:arab' && T['통북투'] === 'gen:africa' && T['동남아'] === 'gen:seasia' && T['시드니'] === 'north_europe' && T['아바나'] === 'gen:america', '인도 · 이슬람 · 아프리카 · 동남아 · 아메리카 (시드니는 영국 식민 도시라 북유럽 곡)');
    ok(r.none === 0, '곡이 없는 도시 없음');
    ok(r.seas.med === 'sail_med' && r.seas.north === 'north_europe' && r.seas.ind === 'gen:seaind' && r.seas.east === 'gen:seaeast' && r.seas.sea === 'gen:seaeast' && r.seas.amer === 'gen:america' && r.seas.atl === 'sail_med', '바다 구역마다: ' + JSON.stringify(r.seas));
    ok(/:gen:japan$/.test(r.lands[0]) && /:gen:india$|:explore_(desert|jungle)$/.test(r.lands[1]) && /explore_europe$|explore_desert$/.test(r.lands[2]), '뭍: 가까운 도시의 고장 곡 (사막·밀림이면 그 곡) ' + r.lands.join(' · '));

    // ② 실제 도시에서 주점에 들어갔다 나오기 (기존 음악)
    async function city(i) {
      await page.evaluate((i) => { const s = G.Game.state, c = G.CITY_DATA[i]; s.loc = { mode: 'city', city: i, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: i }); }, i);
      await page.waitForFunction((i) => G.Game.sceneName === 'city' && G.Game.state.loc.city === i && !G.Scenes.city.isBusy(), i, { timeout: 30000 });
    }
    async function clickThrough(cond) {
      for (let k = 0; k < 120; k++) {
        if (await page.evaluate(cond)) return true;
        await page.evaluate(() => { const m = [...document.querySelectorAll('#ui .modal-back')].pop(); if (m) { const b = [...m.querySelectorAll('.btn')].pop() || m.querySelector('.dlg') || m; b.click(); } });
        await page.waitForTimeout(150);
      }
      return false;
    }
    const kag = await page.evaluate(() => G.CITY_DATA.findIndex(c => c.name === '나가사키'));
    await city(0);
    const st0 = await page.evaluate(() => G.Audio.now());
    await page.evaluate(() => { G.Scenes.city.visit('tavern'); });
    await clickThrough(() => G.Scenes.city.current() && G.Scenes.city.current().kind === 'tavern' && !G.Scenes.city.isBusy() && !document.querySelector('#ui .modal-back'));
    const inT = await page.evaluate(() => G.Audio.now() + '|' + G.Audio.place);
    await page.evaluate(() => G.Scenes.city.leave());
    await page.waitForTimeout(300);
    const out = await page.evaluate(() => G.Audio.now() + '|' + G.Audio.place);
    ok(st0 === 'city_med' && inT === 'gen:tavern|tavern' && out === 'city_med|null', '기존 음악: 리스본 거리 ' + st0 + ' → 주점 ' + inT + ' → 나가기 버튼으로 나오면 ' + out);
    await page.evaluate(() => { G.Scenes.city.visit('tavern'); });
    await clickThrough(() => G.Scenes.city.current() && !G.Scenes.city.isBusy() && !document.querySelector('#ui .modal-back'));
    await page.evaluate(() => { G.UI.fade = async fn => { fn(); }; G.Game.go('sea', { depart: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'sea', null, { timeout: 30000 });
    const sea0 = await page.evaluate(() => G.Audio.now() + '|' + G.Audio.place);
    ok(/^(sail_med|gen:)/.test(sea0) && /\|null$/.test(sea0) && sea0.indexOf('tavern') < 0, '주점에서 곧장 바다로 나가도 주점 곡이 남지 않는다 (' + sea0 + ')');
    await city(kag);
    ok(await page.evaluate(() => G.Audio.now()) === 'gen:japan', '나가사키 거리: 일본 곡');

    // ③ 코스타 델 솔 3 OST (가짜 유튜브): 주점 → 나오면 그 도시 곡, 드나들어도 쌓이지 않는다
    await page.evaluate(() => { G.YTM.setSource('ost'); });
    await city(0);
    await page.waitForTimeout(200);
    const o = await page.evaluate(() => G.YTM.current());
    const seq = [];
    for (let k = 0; k < 3; k++) {
      await page.evaluate(() => { G.Scenes.city.visit('tavern'); });
      await clickThrough(() => G.Scenes.city.current() && !G.Scenes.city.isBusy() && !document.querySelector('#ui .modal-back'));
      seq.push(await page.evaluate(() => G.YTM.current()));
      await page.evaluate(() => G.Scenes.city.leave()); await page.waitForTimeout(200);
      seq.push(await page.evaluate(() => G.YTM.current()));
    }
    ok(o === 't13' && seq.join() === 't21,t13,t21,t13,t21,t13' && await page.evaluate(() => !G.YTM.inMoment()), 'OST: 고향 리스본(귀환 13) → 주점 21 → 나오면 13, 세 번 드나들어도 그대로 (' + seq.join(',') + ')');
    await page.evaluate(() => { G.Scenes.city.visit('tavern'); });
    await clickThrough(() => G.Scenes.city.current() && !G.Scenes.city.isBusy() && !document.querySelector('#ui .modal-back'));
    await page.evaluate(() => { G.Game.go('sea', { depart: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'sea', null, { timeout: 30000 });
    const os = await page.evaluate(() => G.YTM.current());
    ok(os !== 't21' && /^t(23|14|01)$/.test(os), 'OST: 주점에서 곧장 출항하면 바다 곡 (' + os + ')');
    await page.waitForFunction(() => +getComputedStyle(document.querySelector('.ost-box')).opacity < 0.6, null, { timeout: 15000 }).catch(() => {});
    const bx = await page.evaluate(() => { const b = document.querySelector('.ost-box'), r = b.getBoundingClientRect(), hud = document.querySelector('.hud').getBoundingClientRect(); return { hov: b.matches(':hover'), yt: window.__yt.slice(-4).join(), x: r.left, y: r.top, w: r.width, right: innerWidth - r.right, top: r.top - hud.bottom, op: +getComputedStyle(b).opacity, pw: b.querySelector('#ost-player') ? b.querySelector('#ost-player').parentNode.getBoundingClientRect().width : 0 }; });
    ok(bx.right < 20 && bx.top >= 0 && bx.top < 20 && bx.op < 0.6 && bx.pw >= 200, 'OST 재생기: 바다에서는 오른쪽 위 구석, 곡이 바뀐 뒤 흐리게(' + bx.op + '), 크기 ' + bx.pw + 'px(유튜브 최소 200)');
    await city(kag);
    ok(await page.evaluate(() => G.YTM.current()) === 't26', 'OST: 나가사키는 26 (일본)');
    const cx = await page.evaluate(() => { const r = document.querySelector('.ost-box').getBoundingClientRect(); return r.left; });
    ok(cx < 30, 'OST 재생기: 도시에서는 왼쪽 (오른쪽 건물 메뉴를 가리지 않게)');
    const bat = await page.evaluate(() => G.CITY_DATA.findIndex(c => c.name === window.__seN));
    await city(bat);
    ok(await page.evaluate(() => G.YTM.current()) === 't17', 'OST: ' + await page.evaluate(() => window.__seN) + '(동남아)는 17 동남아시아');
    ok(await page.evaluate(() => window.__yt.length > 6 && window.__yt.every(x => x === 'pause' || /^\w+@\d+$/.test(x))), '가짜 재생기에 곡이 시각과 함께 넘어갔다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | ')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
