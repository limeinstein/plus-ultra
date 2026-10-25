/* 항해 하단 메뉴의 크기가 늘 같다 (2026-10-25 — 「상륙」을 누르려다 「낚시」를 누르던 것)
   항구 곁(짧은·긴 항구 이름) · 먼바다 · 비 · 정지/출발 · 마우스 따라가기 켬/끔 — 메뉴 너비와 「상륙」「낚시」 단추 자리가 1px도 움직이지 않는다
   node tests/sailbar_fixed_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const sleep = ms => new Promise(x => setTimeout(x, ms));
      await G.Game.ensureGeo(); G.Nav.init();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0;
      const s = G.Game.state, SEA = G.Scenes.sea;
      const lis = G.CITY_DATA[s.player.home];
      // 이름이 가장 긴 항구 (알려진 도시로)
      const longP = G.CITY_DATA.filter(c => c && c.port && !(c.founded > s.date.y)).sort((a, b) => b.name.length - a.name.length)[0];
      if (s.known.indexOf(longP.id) < 0) s.known.push(longP.id);
      G.Game.go('sea', { depart: lis.id }); await sleep(300);
      const st = SEA.runtime();
      const bar = () => document.querySelector('.sailbar');
      const btnBy = t => [...bar().querySelectorAll('.btn')].find(b => b.textContent.indexOf(t) >= 0);
      const tick = () => { for (let i = 0; i < 7; i++) SEA.update(0.0001); };
      const measure = (label) => { tick(); const b = bar().getBoundingClientRect(), l = btnBy('상륙').getBoundingClientRect(), f = btnBy('낚시').getBoundingClientRect(); return { label, w: Math.round(b.width * 10) / 10, land: Math.round(l.left * 10) / 10, fish: Math.round(f.left * 10) / 10, port: (btnBy('입항') || {}).textContent }; };
      const out = [];
      const at = (c) => { const d = c.dock || [c.lat, c.lon]; s.loc.lat = d[0]; s.loc.lon = d[1]; };
      at(lis); out.push(measure('리스본 곁'));
      s.loc.lat = 30; s.loc.lon = -35; out.push(measure('먼바다'));
      at(longP); out.push(measure(longP.name + ' 곁'));
      const rr = G.Rain.raining; G.Rain.raining = () => true; out.push(measure('비')); G.Rain.raining = rr; out.push(measure('비 그침'));
      st.paused = !st.paused; out.push(measure('정지/출발')); st.paused = !st.paused;
      if (G.Ctrl && G.Ctrl.toggle) { G.Ctrl.toggle(); out.push(measure('따라가기 바꿈')); G.Ctrl.toggle(); }
      return { out, longName: longP.name, rainDisabled: btnBy('비 대책') && btnBy('비 대책').classList.contains('disabled') };
    });
    r.out.forEach(x => console.log('    ' + x.label + ': 너비 ' + x.w + ' · 상륙 ' + x.land + ' · 낚시 ' + x.fish + ' · [' + x.port + ']'));
    const w0 = r.out[0];
    ok(r.out.every(x => x.w === w0.w), '하단 메뉴 너비가 늘 ' + w0.w + 'px');
    ok(r.out.every(x => x.land === w0.land && x.fish === w0.fish), '「상륙」「낚시」 단추 자리가 움직이지 않는다');
    ok(/리스본 입항/.test(r.out[0].port) && r.out[2].port.indexOf(r.longName) >= 0, '항구 곁에서는 「' + r.out[0].port + '」처럼 항구 이름이 보인다 (긴 이름 「' + r.longName + '」도 같은 너비 안에 — 넘치면 말줄임)');
    ok(r.rainDisabled, '비가 오지 않을 때 「비 대책」은 자리만 지키고 누를 수 없다');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
