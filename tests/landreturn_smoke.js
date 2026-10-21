/* 상륙했다가 배로 돌아왔을 때 배가 껴서 움직이지 않던 것 (2026-10-21) 점검.
   ① 바다의 하루 사건이 끝나기 전에 상륙(L 키)하면, 돌아온 뒤 그 사건이 끝나며 「바쁨」이 −1이 되어 배·단추가 모두 멈췄다 → 0 아래로 내려가지 않는다 · 바쁠 때는 상륙하지 않는다
   ② 돌아오면 뱃머리가 늘 동쪽(0)이라 뭍을 보고 있으면 손으로 몰 수 없었다 → 내릴 때의 뱃머리를 그대로, 그래도 막혔으면 트인 물 쪽으로
   node tests/landreturn_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GAME = process.env.PAGE || pathToFileURL(path.join(ROOT, 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
    await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/**', route => route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' }));
    await page.goto(GAME, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.UI.fade = async fn => { fn && fn(); };
      const s = G.Game.state, SEA = G.Scenes.sea, out = {};
      G.Game.go('sea', { depart: s.player.home });
      // ① 끝나지 않은 일(바쁨 1)을 둔 채 장면이 바뀌었다가 돌아오고, 그 일이 끝난다
      const st = SEA.runtime(); st.busy = 1;
      let done; const pending = new Promise(r => { done = r; });
      (async () => { await pending; st.busy = Math.max(0, st.busy - 1); })();   // sea.js의 끝맺음과 같은 꼴
      s.loc = { mode: 'sea', lon: s.loc.lon, lat: s.loc.lat, heading: 1 }; G.Game.go('sea', { resume: true, fromLand: true });
      done(); await new Promise(r => setTimeout(r, 30));
      out.busyAfter = SEA.runtime().busy;
      // sea.js 안의 모든 끝맺음이 0 아래로 내려가지 않는 꼴인가
      const src = window.PU_WEB_CHANNEL ? '' : await (await fetch('js/scenes/sea.js')).text().catch(() => '');
      out.rawDec = src.length > 1000 ? (src.match(/st\.busy--/g) || []).length : -1;
      // 바쁠 때는 상륙하지 않는다 (L 키)
      SEA.runtime().busy = 1; const sc0 = G.Game.sceneName;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', code: 'KeyL' }));
      await new Promise(r => setTimeout(r, 200));
      out.landWhileBusy = !!document.querySelector('#ui .modal-back') || G.Game.sceneName !== sc0;
      SEA.runtime().busy = 0;
      // ② 뭍을 바라보는 뱃머리로 돌아왔다 → 트인 물 쪽으로
      const ports = G.CITY_DATA.filter(c => c.port && G.R.cityExists(c)); let tried = 0, fixed = 0, kept = 0;
      for (const c of ports.slice(0, 120)) {
        const dock = c.dock || [c.lat, c.lon]; const p = G.Nav.nearestSea(dock[1], dock[0], 12); if (!p || !G.Geo.isSea(p[0], p[1], 0.2)) continue;
        let land = null; for (let a = 0; a < 24; a++) { const h = a / 24 * Math.PI * 2; if (!G.Geo.isSea(p[0] + Math.cos(h) * 0.06, p[1] + Math.sin(h) * 0.06, 0.2)) { land = h; break; } }
        if (land == null) continue;
        tried++;
        s.loc = { mode: 'sea', lon: p[0], lat: p[1], heading: land }; G.Game.go('sea', { resume: true, fromLand: true });
        const l = s.loc; let d = 0; for (let r0 = 0.03; r0 <= 0.3001; r0 += 0.03) { if (!G.Geo.isSea(l.lon + Math.cos(l.heading) * r0, l.lat + Math.sin(l.heading) * r0, 0.2)) break; d = r0; }
        if (d >= 0.15) fixed++;
      }
      // 뱃머리가 이미 트인 물을 보고 있으면 그대로
      const p0 = G.Nav.nearestSea(-12, 38, 4); s.loc = { mode: 'sea', lon: p0[0], lat: p0[1], heading: 2.5 }; G.Game.go('sea', { resume: true, fromLand: true }); kept = s.loc.heading === 2.5;
      out.tried = tried; out.fixed = fixed; out.kept = kept;
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.busyAfter === 0, '돌아온 뒤 끝난 일이 바쁨을 0 아래로 내리지 않는다 (' + r.busyAfter + ')');
    ok(r.rawDec === 0 || r.rawDec === -1, (r.rawDec === -1 ? '(파일을 읽지 못해 건너뜀) ' : '') + 'sea.js의 바쁨 끝맺음이 모두 0 아래로 내려가지 않는 꼴');
    ok(!r.landWhileBusy, '바다의 사건이 끝나지 않았으면 L 키로 상륙하지 않는다');
    ok(r.tried > 10 && r.fixed / r.tried >= 0.9, '뭍을 바라보며 돌아온 배 ' + r.tried + '척 가운데 ' + r.fixed + '척이 트인 물 쪽으로 뱃머리를 돌렸다');
    ok(r.kept, '이미 트인 물을 보고 있으면 뱃머리를 그대로 둔다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
