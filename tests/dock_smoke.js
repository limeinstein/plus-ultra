/* 도크(선거) (tests/dock_smoke.js) — node tests/dock_smoke.js
   · 모항 10척 · 다른 항구 3척 · 모항이 아닌 도크는 2년(730일) 뒤 폐기, 90·30일 남았을 때 알림 · 옛 저장의 배는 오늘부터 센다 · 콘솔 오류 0 */
const assert = require('assert'); const path = require('path'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.city && G.Scenes.city.B.harbor && G.Dock, null, { timeout: 90000 });
  const out = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m); const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state, RR = G.R, D = G.Dock, H = G.Scenes.city.B.harbor;
    const home = G.CITY_DATA[s.player.home];
    const other = G.CITY_DATA.find(c => c && c.port && c.id !== home.id && G.Scenes.city.B.shipyard.types(c).length);
    ok(D.cap(home) === 10 && D.cap(other) === 3, '모항 ' + home.name + ' ' + D.cap(home) + '척 · ' + other.name + ' ' + D.cap(other) + '척');
    const mk = n => RR.newShip('caravel', '배' + n);
    s.fleet.ships = [RR.newShip('carrack', '기함'), mk(1), mk(2), mk(3), mk(4)]; s.fleet.crew = 60; s.mates = [];
    G.Game.go('city', { cityId: other.id }); await sleep(400);
    const item = H.menu(other).find(x => x && x.label === '도크');
    ok(item && /도크 0\/3척/.test(item.sub), '항구 메뉴에 「도크」 · ' + (item && item.sub));
    // UI로 맡기기: 도크 창 → 「도크에 맡긴다」 → 배 고르기
    const choices = () => [...document.querySelectorAll('.choice')];
    const btn = t => [...document.querySelectorAll('.modal-back .btn')].find(x => x.textContent.indexOf(t) >= 0);
    const p = H.dock(other); await sleep(200);
    const dlgTxt = ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '';
    ok(/모항/.test(dlgTxt) && /2년/.test(dlgTxt), '도크 창 안내: 모항 10척 · 다른 항구 2년 뒤 폐기');
    for (let n = 0; n < 4; n++) {
      btn('도크에 맡긴다').click(); await sleep(150);
      const el = choices()[0]; if (el) { el.click(); await sleep(200); }
    }
    ok(D.list(other).length === 3 && s.fleet.ships.length === 2, '다른 항구 도크는 3척에서 멈춤 (도크 ' + D.list(other).length + ' · 함대 ' + s.fleet.ships.length + ')');
    btn('도크에서 꺼낸다').click(); await sleep(150); choices()[0].click(); await sleep(200);
    ok(D.list(other).length === 2 && s.fleet.ships.length === 3 && s.fleet.ships[2].dockDay == null, '도크에서 꺼내면 함대로 · 날짜 지움');
    btn('닫는다').click(); await Promise.race([p, sleep(1500)]);
    // 기한
    const d0 = D.list(other)[0];
    d0.dockDay = s.day - 640; d0.dockWarn = {};
    let o = D.daily();
    ok(o.some(x => /90일|일 뒤면 폐기/.test(x.text)), '90일 남았을 때 알림: ' + (o[0] && o[0].text));
    d0.dockDay = s.day - 730; o = D.daily();
    ok(D.list(other).indexOf(d0) < 0 && o.some(x => /폐기되었다/.test(x.text)), '2년 지나면 폐기: ' + (o.find(x => /폐기되었다/.test(x.text)) || {}).text);
    // 옛 저장: 날짜 없는 배는 오늘부터
    const old = D.list(other)[0]; delete old.dockDay; D.daily();
    ok(old.dockDay === s.day && D.list(other).indexOf(old) >= 0, '옛 저장의 배는 오늘부터 2년 (사라지지 않음)');
    // 모항은 기한 없음
    const hs = mk(9); D.put(home, hs); hs.dockDay = s.day - 5000; D.daily();
    ok(D.list(home).indexOf(hs) >= 0 && D.left(home, hs) == null, '모항 도크는 기한 없음');
    for (let n = 0; n < 12; n++) D.put(home, mk(20 + n));
    ok(D.list(home).length === 10, '모항 도크 10척까지 (' + D.list(home).length + ')');
    // 함대 현황·함대편성 창 그리기
    const el = document.createElement('div'); document.body.appendChild(el);
    try { G.Info.fleetPanel && G.Info.fleetPanel(el); } catch (e) { R.push('   fleetPanel: ' + e.message); }
    const fp = H.fleet(other); await sleep(200);
    const ft = ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '';
    ok(/도크 1\/3척/.test(ft) && /도크에 맡김/.test(ft) && /남음/.test(ft), '함대편성 창: 도크 줄·남은 기한');
    btn('편성 종료').click(); await Promise.race([fp, sleep(1500)]);
    // 하루 넘기기 (world daily 통째로)
    try { const W = G.World || G.W; if (W && W.daily) W.daily(); R.push('   world daily ok'); } catch (e) { R.push('✗ world daily ' + e.message); }
    return R;
  });
  console.log(out.join('\n')); console.log(errs.length ? errs.join('\n') : '콘솔 오류 0');
  assert(out.every(x => !/^✗/.test(x)), out.filter(x => /^✗/.test(x)).join('\n'));
  assert.deepStrictEqual(errs, []);
  } finally { await b.close(); }
})();
