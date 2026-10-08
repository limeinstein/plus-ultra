/* 코스타 델 솔 OST 곡 돌림 — 곡이 제 구간 끝까지 돌면 끊기지 않고 그 곡 처음부터 다시 튼다.
   A. 유튜브 재생기 (js/systems/ytmusic.js): 가짜 YT.Player로 시간을 흘려
      · 곡 끝(e초)에 닿기 전에 그 곡 처음(s초)으로 되감고 계속 재생 (endSeconds를 주지 않는다)
      · 유튜브가 곡 끝에서 멈춤(2)·끝(0) 상태가 되어도 처음으로 되돌려 다시 튼다
   B. 내 컴퓨터의 MP3 (js/systems/localost.js): ffmpeg로 만든 64분짜리 시험 파일로
      · 곡 끝 몇 초 전에서 시작해 곡 처음과 겹쳐 돌고 계속 재생
      · 타이머가 멈춰도(창을 내려 둔 때) 재생 위치(timeupdate)만으로 돌림이 된다
   node tests/ost_loop_smoke.js   (BROWSER_EXE=크롬 경로, ffmpeg가 없으면 B는 건너뜀) */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const NEW = { name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' };

/* 가짜 유튜브 재생기: 실제 시간으로 흐르고, endSeconds를 주면 그 자리에서 멈춘다(state 0) */
function fakeYT() {
  window._yt = { calls: [] };
  function P(id, o) {
    const me = this; this.o = o; this.st = -1; this.t = 0; this.vol = 100; this.end = null; this.base = 0; this.at = 0; window._yt.p = this;
    setTimeout(function () { o.events.onReady({ target: me }); }, 50);
    this._iv = setInterval(function () {
      if (me.st !== 1) return;
      const now = me.base + (performance.now() - me.at) / 1000 * (window._yt.speed || 1);
      if (me.end != null && now >= me.end) { me.base = me.end; me.st = 0; o.events.onStateChange({ data: 0 }); return; }
      if (window._yt.pauseAt != null && now >= window._yt.pauseAt) { me.base = window._yt.pauseAt; window._yt.pauseAt = null; me.st = 2; o.events.onStateChange({ data: 2 }); }
    }, 20);
  }
  P.prototype = {
    loadVideoById(o) { window._yt.calls.push(['load', o]); this.end = o.endSeconds != null ? o.endSeconds : null; this.base = o.startSeconds || 0; this.at = performance.now(); this.st = 1; },
    seekTo(t) { window._yt.calls.push(['seek', t]); this.base = t; this.at = performance.now(); },
    playVideo() { if (this.st !== 1) { this.at = performance.now(); this.st = 1; } },
    pauseVideo() { if (this.st === 1) { this.base = this.getCurrentTime(); this.st = 2; } },
    getCurrentTime() { return this.st === 1 ? this.base + (performance.now() - this.at) / 1000 * (window._yt.speed || 1) : this.base; },
    getPlayerState() { return this.st; },
    getDuration() { return 3873; },
    setVolume(v) { this.vol = v; }
  };
  window.YT = { Player: P };
}

(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const errors = [];
  try {
    // ---------------------------------------------------------------- A. 유튜브
    console.log('A. 유튜브 재생기');
    let page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(fakeYT);
    await page.addInitScript(() => { window.PU_LOCAL_OST = false; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const a = await page.evaluate(async (NEW) => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame(NEW);
      G.Game.go('city', { cityId: 0 }); await wait(800);
      G.YTM.setSource('ost'); await wait(800);
      const id = G.YTM.current(), t = G.OST.tracks[id], p = window._yt.p, out = { id, s: t.s, e: t.e };
      out.load = window._yt.calls.filter(c => c[0] === 'load').map(c => c[1]);
      // 곡 끝 2초 전으로 → 4초 뒤
      p.seekTo(t.e - 2); window._yt.calls.length = 0; await wait(4000);
      out.after = { st: p.getPlayerState(), t: +p.getCurrentTime().toFixed(2), seeks: window._yt.calls.filter(c => c[0] === 'seek').map(c => c[1]), vol: p.vol };
      // 유튜브가 곡 끝에서 멈춘 경우
      window._yt.pauseAt = t.e - 0.5; p.seekTo(t.e - 1.2); window._yt.calls.length = 0; await wait(3000);
      out.paused = { st: p.getPlayerState(), t: +p.getCurrentTime().toFixed(2), seeks: window._yt.calls.filter(c => c[0] === 'seek').map(c => c[1]) };
      // 끝 시각이 없는 곡(조선 영상)은 영상 끝(0)에서 처음으로
      out.cur = G.YTM.current();
      p.st = 0; p.base = 3873; p.o.events.onStateChange({ data: 0 }); await wait(300);
      out.ended = { st: p.getPlayerState(), t: +p.getCurrentTime().toFixed(1) };
      // 여러 번 돌아도 계속
      let n = 0; window._yt.speed = 40; window._yt.calls.length = 0;
      for (let i = 0; i < 30; i++) { await wait(500); }
      n = window._yt.calls.filter(c => c[0] === 'seek' && c[1] === t.s).length;
      window._yt.speed = 1;
      out.many = { loops: n, st: p.getPlayerState(), t: +p.getCurrentTime().toFixed(1) };
      return out;
    }, NEW);
    console.log('   ' + JSON.stringify(a));
    ok(a.load.length && a.load.every(o => o.endSeconds == null), '영상에 끝 시각을 주지 않는다 (유튜브가 곡 끝에서 멈추지 않게)');
    ok(a.after.seeks.includes(a.s) && a.after.st === 1 && a.after.t >= a.s && a.after.t < a.s + 4, '곡 끝(' + a.e + '초)에 닿기 전에 그 곡 처음(' + a.s + '초)으로 되감고 계속 재생');
    ok(a.paused.seeks.includes(a.s) && a.paused.st === 1 && a.paused.t < a.s + 4, '유튜브가 곡 끝에서 멈춰도 처음으로 되돌려 다시 튼다');
    ok(a.ended.st === 1 && a.ended.t < a.s + 2, '영상 끝(끝 상태)에 닿아도 그 곡 처음부터');
    ok(a.many.loops >= 3 && a.many.st === 1, '여러 번 돌아도 끊기지 않는다 (' + a.many.loops + '번 돌림)');
    await page.close();

    // ---------------------------------------------------------------- B. 내 MP3
    let ff = null;
    try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); ff = path.join(os.tmpdir(), 'pu_ost_loop_test.mp3'); } catch (e) { ff = null; }
    if (!ff) console.log('B. ffmpeg가 없어 내 MP3 시험은 건너뜀');
    else {
      console.log('B. 내 컴퓨터의 MP3');
      if (!fs.existsSync(ff)) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=8000:duration=3873', '-ac', '1', '-b:a', '8k', ff]);
      page = await browser.newPage();
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => { const A = window.Audio; window._auds = []; window.Audio = function (s) { const x = new A(s); window._auds.push(x); return x; }; window.Audio.prototype = A.prototype; });
      await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
      await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
      const b = await page.evaluate(async ([NEW, ff]) => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        await G.Game.ensureGeo();
        G.OST.local.files = [ff];
        G.Game.state = G.State.newGame(NEW);
        G.Game.go('city', { cityId: 0 }); await wait(800);
        G.YTM.setSource('ost'); await wait(4000);
        const L = G.LocalOST, id = L.current(), sg = L.seg(id), out = { id, sg, src: L.source() };
        let d = window._auds.find(x => !x.paused && /pu_ost_loop_test/.test(x.src));
        if (!d) return { err: 'no deck', st: L.status() };
        d.currentTime = sg[1] - 5; await wait(7000);
        out.after = L.status();
        // 타이머가 멈춘 것처럼: setInterval을 막고 다시 끝 근처로
        const si = window.setInterval; window.setInterval = function () { return 0; };
        const ids = []; for (let k = 1; k < 100000; k++) { if (k > 2000) break; ids.push(k); }
        ids.forEach(k => clearInterval(k));
        d = window._auds.find(x => !x.paused && x.volume > 0.05 && /pu_ost_loop_test/.test(x.src));
        if (d) { d.currentTime = sg[1] - 4.5; await wait(7000); }
        window.setInterval = si;
        out.throttled = L.status();
        out.playing = window._auds.filter(x => !x.paused && /pu_ost_loop_test/.test(x.src)).map(x => +x.currentTime.toFixed(1));
        return out;
      }, [NEW, pathToFileURL(ff).href]);
      console.log('   ' + JSON.stringify(b));
      ok(!b.err && /pu_ost_loop_test/.test(b.src), '시험 MP3를 찾아 튼다');
      ok(b.after.track === b.id && !b.after.paused && b.after.time >= b.sg[0] && b.after.time < b.sg[0] + 6, '곡 끝에서 그 곡 처음과 겹쳐 돌아 계속 재생 (' + b.after.time + '초)');
      ok(b.playing.length >= 1 && b.playing.some(t => t >= b.sg[0] && t < b.sg[0] + 8), '타이머가 멈춰도 재생 위치만으로 돌림 (' + JSON.stringify(b.playing) + ')');
      await page.close();
    }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
