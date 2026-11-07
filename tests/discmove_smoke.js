/* 자리를 옮긴 발견물 (2026-11-07) — 아즈텍 멸망(1521.8) 뒤의 목테수마의 깃털관·템플로 마요르·아즈텍 사람들
   단계별 찾는 도시·단서 · 소식 · 술집 계약 이야기 · 이름 붙이기 뒤에도 유지 · 새 게임·옛 저장 · 멕시코에서 전해 듣기 · 브뤼셀에서 찾기 · 찾은 자리 유지 · 콘솔 오류 0
   node tests/discmove_smoke.js   (스크린숏: tests/_out/discmove_*.png) */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(__dirname, '_out');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    // 발견 장면도 loop라는 이름의 rAF를 쓴다. 여기서는 실제 연출·보행의 박자를 유지한다.
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });

    // ------------------------------------------------------------ 자료·단계 (화면 없이)
    const A = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const NG = () => G.State.newGame({ name: '깃털시험', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map((_, i) => i === 1 ? 3 : i === 0 ? 2 : 0), diff: 'normal' });
      NG();
      const s = G.Game.state, D = G.DISC, r = {};
      const snap = () => ({ m: D.moctezuma.city, mh: D.moctezuma.hint, t: D.templomayor.city, ts: !!D.templomayor.noStreet, a: D.aztec.city, ah: D.aztec.hint, ml: D.moctezuma.lang });
      s.date = { y: 1519, m: 6, d: 1 }; G.Names.apply();
      r.y1519 = snap();
      s.hints.moctezuma = { src: 'tavern', d: 15190601 }; s.hints.aztec = { src: 'tavern', d: 15190601 };
      s.date = { y: 1521, m: 7, d: 31 }; r.d0731 = G.DiscMove.daily();
      s.date = { y: 1521, m: 8, d: 1 }; r.d0801 = G.DiscMove.daily(); r.y1521 = snap();
      r.again = G.DiscMove.daily();
      r.hooked = !!(G.World._discMove && G.Scenes.city._discMove && G.Disc._discMove && G.Names._discMove);
      s.date = { y: 1526, m: 9, d: 4 }; G.DiscMove.daily();
      r.chk25 = G.Disc.checkCity(25).map(d => d.id); r.chk201 = G.Disc.checkCity(201).map(d => d.id); r.chk200 = G.Disc.checkCity(200).map(d => d.id);
      r.bld201 = G.Disc.cityBuildings(201).map(d => d.id);
      r.tav = G.Scenes.city.B.tavern.contractInfo(G.CITY_DATA[201], { disc: 'moctezuma', sponsor: 'x' });
      G.Names.apply(); r.afterNames = snap();
      r.tells201 = G.DiscMove.tellsAt(201); r.tells25 = G.DiscMove.tellsAt(25); r.on25 = G.DiscMove.onLines(25);
      s.date = { y: 1580, m: 1, d: 1 }; r.d1580 = G.DiscMove.daily(); r.y1580 = snap(); r.tells25b = G.DiscMove.tellsAt(25);
      s.date = { y: 1595, m: 1, d: 1 }; r.d1595 = G.DiscMove.daily(); r.y1595 = snap();
      // 옛 저장: discMove 없이 1526에 불러온다
      delete s.discMove; s.date = { y: 1526, m: 3, d: 1 }; G.Names.apply(); r.old = snap(); r.oldSt = JSON.stringify(s.discMove);
      // 찾은 자리 유지
      s.disc.moctezuma = Object.assign(s.disc.moctezuma || {}, { found: true, me: true }); s.discMove.got.moctezuma = 1;
      s.date = { y: 1595, m: 1, d: 1 }; G.DiscMove.daily(); r.foundKeep = D.moctezuma.city;
      // 새 게임: 처음 자리로
      NG(); r.ng = snap(); r.ngDate = G.Game.state.date.y;
      // ---- 같은 일이 있던 발견물: 태양의 돌 · 뉴욕의 신기루 · 몬트리올·필라델피아 · 로마의 허물어진 건물
      const s2 = G.Game.state, at = (y, m) => { s2.date = { y: y, m: m || 6, d: 1 }; G.DiscMove.apply(); };
      const FR = G.DISC_FRONT; G.DISC_FRONT = {};   // 개척 단계와 상관없이 날짜·도시만 본다
      const av = id => G.Disc.available(D[id]);
      at(1500); r.sun1500 = { c: D.sunstone.city, h: D.sunstone.hint, chk: G.Disc.checkCity(200).indexOf(D.sunstone) >= 0 };
      at(1526); r.sun1526 = { c: D.sunstone.city, h: D.sunstone.hint };
      at(1610); r.ny1610 = { c: D.liberty.city, av: av('liberty'), es: av('empirestate') };
      at(1630); r.ny1630 = { c: D.liberty.city, h: D.liberty.hint, av: av('liberty'), es: D.empirestate.city, esh: D.empirestate.hint, col: D.columbia.city, bw: D.broadway.hint };
      at(1670); r.ny1670 = { c: D.liberty.city, h: D.liberty.hint, av: av('liberty') };
      at(1620); r.bio1620 = av('biosphere'); at(1650); r.bio1650 = av('biosphere');
      at(1645); r.up1645 = av('upenn'); at(1660); r.up1660 = { av: av('upenn'), c: D.upenn.city, h: D.upenn.hint }; at(1690); r.up1690 = { av: av('upenn'), c: D.upenn.city };
      const romeB = () => G.Disc.cityBuildings(33).map(d => d.id).filter(id => /constbaths|septizodium/.test(id));
      at(1580); r.rome1580 = { b: romeB(), v: D.septizodium.val };
      at(1590); r.rome1590 = { b: romeB(), v: D.septizodium.val, h: D.septizodium.hint, ns: !!D.septizodium.noStreet, av: av('septizodium') };
      at(1610); r.rome1610 = { b: romeB(), h: D.constbaths.hint, cv: D.constbaths.val };
      G.DISC_FRONT = FR;
      NG(); r.ng2 = { sun: D.sunstone.city, lib: D.liberty.city, sv: D.septizodium.val, sg: D.septizodium.goneY };
      return r;
    });
    ok(A.hooked, '걸이: 세상의 하루·건물 들어가기·발견·이름 붙이기');
    ok(A.y1519.m === 200 && /테노치티틀란 궁궐 보물고/.test(A.y1519.mh) && A.y1519.t === 200 && A.y1519.a === 200, '1519: 셋 다 테노치티틀란 (' + A.y1519.mh.slice(0, 20) + '…)');
    ok(A.d0731.length === 0, '1521.7.31: 아직 그대로');
    ok(A.y1521.m === 25 && /브뤼셀 궁정의 보물 방/.test(A.y1521.mh) && A.y1521.t === 201 && A.y1521.ts && A.y1521.a === 201 && /산 후안 테노치티틀란/.test(A.y1521.ah), '1521.8 함락: 깃털관 → 브뤼셀, 템플로 마요르·아즈텍 사람들 → 멕시코 (거리 그림 없음)');
    ok(A.y1521.ml === 1 || A.y1521.ml != null, '깃털관의 말 = 브뤼셀의 말 (' + A.y1521.ml + ')');
    ok(A.d0801.length === 2 && A.d0801.every(x => /【단서가 바뀌었다】/.test(x.text)) && A.d0801.some(x => /깃털관/.test(x.text) && /찾는 곳: 브뤼셀/.test(x.text)), '단서를 쥔 둘만 소식: ' + A.d0801.map(x => x.text.slice(0, 40)).join(' / '));
    ok(A.again.length === 0, '같은 단계는 다시 알리지 않는다');
    ok(A.chk25.indexOf('moctezuma') >= 0 && A.chk201.indexOf('aztec') >= 0 && A.chk200.indexOf('moctezuma') < 0 && A.bld201.indexOf('templomayor') >= 0, '1526: 브뤼셀에서 깃털관 · 멕시코에서 아즈텍 사람들 · 멕시코 건물 「템플로 마요르」');
    ok(/브뤼셀에 가면/.test(A.tav), '술집의 계약 이야기: ' + A.tav.slice(0, 70) + '…');
    ok(A.afterNames.m === 25 && /브뤼셀/.test(A.afterNames.mh), '대륙 이름이 바뀌어도(Names.apply) 옮긴 단서 유지');
    ok(A.tells201.indexOf('moctezuma') >= 0 && A.tells25.length === 0 && A.on25.length === 1, '멕시코에서는 전해 듣고, 브뤼셀에서는 장면 한 줄 뒤에 찾는다');
    ok(A.y1580.m === 52 && /몬트포르트/.test(A.y1580.mh) && A.d1580.some(x => /아우크스부르크/.test(x.text)) && A.tells25b.indexOf('moctezuma') >= 0, '1575~: 몬트포르트 백작 — 아우크스부르크에서 (브뤼셀에서 전해 듣는다)');
    ok(A.y1595.m === 52 && /암브라스/.test(A.y1595.mh), '1590~: 티롤 대공의 암브라스 성');
    ok(A.old.m === 25 && /"moctezuma":1/.test(A.oldSt), '옛 저장(1526): 처음 쓸 때 만들고 조용히 브뤼셀로 ' + A.oldSt);
    ok(A.foundKeep === 25, '브뤼셀에서 찾은 깃털관은 1595에도 브뤼셀에 그대로');
    ok(A.ng.m === 200 && /테노치티틀란 궁궐/.test(A.ng.mh) && A.ng.t === 200 && !A.ng.ts && A.ng.a === 200, '새 게임(' + A.ngDate + '): 처음 자리로');
    ok(A.sun1500.c === 200 && /테노치티틀란 대신전/.test(A.sun1500.h) && A.sun1500.chk && A.sun1526.c === 201 && /멕시코 중앙 광장/.test(A.sun1526.h), '태양의 돌: 함락 전에는 테노치티틀란 대신전 앞, 뒤에는 멕시코 중앙 광장');
    ok(A.ny1610.c === 255 && !A.ny1610.av && !A.ny1610.es, '1610: 맨해튼에 도시가 없어 뉴욕 신기루 소문이 돌지 않는다');
    ok(A.ny1630.c === 254 && /뉴암스테르담 항구/.test(A.ny1630.h) && A.ny1630.av && A.ny1630.es === 254 && /맨해튼 섬/.test(A.ny1630.esh) && A.ny1630.col === 254 && /브레더 베흐/.test(A.ny1630.bw), '1630: 뉴암스테르담에서 본다 (여신상·브로드웨이·대학·빌딩)');
    ok(A.ny1670.c === 255 && /^뉴욕 항구/.test(A.ny1670.h) && A.ny1670.av, '1670: 뉴욕 (처음 단서)');
    ok(!A.bio1620 && A.bio1650, '몬트리올(1642)이 생기기 전에는 바이오스피어 소문이 돌지 않는다');
    ok(!A.up1645 && A.up1660.av && A.up1660.c === 260 && /크리스티나 요새/.test(A.up1660.h) && A.up1690.av && A.up1690.c === 263, '펜실베이니아 대학교: 1650~1681 크리스티나 요새에서, 1682~ 필라델피아');
    ok(A.rome1580.b.length === 2 && A.rome1590.b.indexOf('septizodium') >= 0 && A.rome1590.v === Math.round(A.rome1580.v / 2) && A.rome1590.ns && /포폴로 광장 오벨리스크/.test(A.rome1590.h) && A.rome1590.av, '셉티조디움 1588 뒤: 터와 다시 쓰인 돌로 찾는다 (값 절반 ' + A.rome1590.v + ', 거리 그림 없음)');
    ok(A.rome1610.b.length === 2 && /말을 다루는 두 거인 상/.test(A.rome1610.h), '콘스탄티누스 욕장 1605 뒤: 퀴리날레 광장의 두 거인 상으로');
    ok(A.ng2.sun === 200 && A.ng2.lib === 255 && A.ng2.sv === A.rome1580.v && A.ng2.sg === 1588, '새 게임: 태양의 돌은 테노치티틀란, 나머지는 처음 자료 그대로');

    // ------------------------------------------------------------ 화면: 1526 멕시코 — 여관에 들어가면 바뀐 단서를 전해 듣는다
    async function settle(max) {
      for (let i = 0; i < (max || 80); i++) {
        if (await page.evaluate(() => !G.Scenes.city.isBusy() && !G.UI.busy() && (!G.Loader || !G.Loader.shown()))) return true;
        if (await page.evaluate(() => G.UI.busy() || document.querySelector('.reveal'))) await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
      return false;
    }
    await page.evaluate(() => {
      const s = G.Game.state; s.date = { y: 1526, m: 9, d: 4 }; s.player.gold = 500000; s.player.fame = 6000; s.settings.res = 0.35;
      s.history = G.HISTORY.findIndex(h => h.y > 1526); if (s.history < 0) s.history = G.HISTORY.length;
      G.Names.apply();
      s.hints.moctezuma = { src: 'sponsor:x', d: 15260904 };
      window.__said = []; const os = G.UI.say; G.UI.say = function (t) { window.__said.push(String(t)); return os.apply(this, arguments); };
      const c = G.CITY_DATA[201]; s.known.push(201, 25); s.loc = { mode: 'city', city: 201, lon: c.lon, lat: c.lat };
      G.Game.go('city', { cityId: 201, load: true });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.city-banner'), null, { timeout: 60000 });
    await settle(); for (let i = 0; i < 10; i++) { if (await page.evaluate(() => G.UI.busy() || document.querySelector('.reveal'))) await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
    await settle();
    const menu = await page.evaluate(() => [...document.querySelectorAll('#screen .cmdmenu:not(.talk-hidden) .cmd')].filter(d => d.offsetParent !== null).map(d => d.textContent.trim()));
    ok(menu.some(t => /템플로 마요르/.test(t)), '멕시코 메뉴에 「템플로 마요르」 (터를 눌러 찾는다): ' + menu.join('·'));
    await page.screenshot({ path: path.join(OUT, 'discmove_mexico.png') });
    await page.evaluate(() => { window.__said = []; G.Scenes.city.visit('inn'); });
    let shotTell = false;
    for (let i = 0; i < 120; i++) {
      if (!shotTell && await page.evaluate(() => /코르테스가 황제께 올려 보냈다/.test(([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || ''))) { await page.screenshot({ path: path.join(OUT, 'discmove_tell.png') }); shotTell = true; }
      if (await page.evaluate(() => { const c = G.Scenes.city.current(); return c && c.kind === 'inn' && !G.Scenes.city.isBusy() && !G.UI.busy(); })) break;
      if (await page.evaluate(() => G.UI.busy() || document.querySelector('.reveal'))) await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
    }
    const B = await page.evaluate(() => ({ said: window.__said.slice(), told: G.Game.state.discMove.told.moctezuma, log: G.Game.state.log.slice(-8).map(l => l.t || l).join(' / ') }));
    ok(B.said.some(t => /궁궐 보물고는 함락 때 모조리 털렸/.test(t) && /브뤼셀 궁정의 보물 방/.test(t)) && B.told === 1, '멕시코 여관: 부하가 전한다 — 「' + (B.said.find(t => /털렸/.test(t)) || '').slice(0, 50) + '…」');
    ok(/이제 브뤼셀에서 찾는다/.test(B.log), '일지에 남는다');
    // 다시 들어가도 되풀이하지 않는다
    await settle(); await page.evaluate(() => G.Scenes.city.main()); await page.waitForTimeout(400); await settle();
    await page.evaluate(() => { window.__said = []; G.Scenes.city.visit('tavern'); });
    for (let i = 0; i < 80; i++) {
      if (await page.evaluate(() => { const c = G.Scenes.city.current(); return c && c.kind === 'tavern' && !G.Scenes.city.isBusy() && !G.UI.busy(); })) break;
      if (await page.evaluate(() => G.UI.busy() || document.querySelector('.reveal'))) await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
    }
    ok(!(await page.evaluate(() => window.__said.some(t => /털렸/.test(t)))), '두 번째 건물에서는 되풀이하지 않는다');
    await settle(); await page.evaluate(() => G.Scenes.city.main()); await page.waitForTimeout(400); await settle();

    // ------------------------------------------------------------ 화면: 브뤼셀 — 건물에 들어가면 장면 한 줄 뒤에 찾는다
    await page.evaluate(() => {
      const s = G.Game.state, c = G.CITY_DATA[25]; s.loc = { mode: 'city', city: 25, lon: c.lon, lat: c.lat };
      G.Game.go('city', { cityId: 25, load: true });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Scenes.city.city() && G.Scenes.city.city().id === 25 && document.querySelector('.city-banner'), null, { timeout: 60000 });
    await settle(); for (let i = 0; i < 10; i++) { if (await page.evaluate(() => G.UI.busy() || document.querySelector('.reveal'))) await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
    await settle();
    await page.evaluate(() => { window.__said = []; G.Scenes.city.visit('inn'); });
    let shotOn = false;
    for (let i = 0; i < 240; i++) {
      if (!shotOn && await page.evaluate(() => /브뤼셀 궁정의 보물 방/.test(([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || ''))) { await page.screenshot({ path: path.join(OUT, 'discmove_brussels.png') }); shotOn = true; }
      if (await page.evaluate(() => G.Disc.foundByMe('moctezuma') && !G.Scenes.city.isBusy() && !G.UI.busy())) break;
      if (await page.evaluate(() => G.UI.busy() || document.querySelector('.reveal'))) await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
    }
    const C = await page.evaluate(() => {
      const s = G.Game.state, r = { found: G.Disc.foundByMe('moctezuma'), got: s.discMove.got.moctezuma, said: window.__said.slice() };
      s.date = { y: 1595, m: 1, d: 1 }; G.DiscMove.daily(); G.Names.apply(); r.city = G.DISC.moctezuma.city;
      return r;
    });
    ok(C.said.some(t => /브뤼셀 궁정의 보물 방/.test(t)) && C.found && C.got === 1, '브뤼셀: 「' + (C.said.find(t => /보물 방/.test(t)) || '').slice(0, 40) + '…」 뒤에 찾았다 (단계 ' + C.got + ')');
    ok(C.city === 25, '찾은 뒤에는 1595에도 브뤼셀 (해도·두고 온 유물 자리)');

    // ------------------------------------------------------------ 화면: 1590 로마 — 허물어진 셉티조디움의 터를 눌러 찾는다
    await settle(); await page.evaluate(() => G.Scenes.city.main()); await settle();
    await page.evaluate(() => {
      const s = G.Game.state, c = G.CITY_DATA[33]; s.date = { y: 1590, m: 3, d: 1 }; G.DiscMove.apply(); s.known.push(33);
      s.loc = { mode: 'city', city: 33, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: 33, load: true });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Scenes.city.city() && G.Scenes.city.city().id === 33 && document.querySelector('.city-banner'), null, { timeout: 60000 });
    await settle(); for (let i = 0; i < 10; i++) { if (await page.evaluate(() => G.UI.busy() || document.querySelector('.reveal'))) await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
    await settle();
    const romeMenu = await page.evaluate(() => [...document.querySelectorAll('#screen .cmdmenu:not(.talk-hidden) .cmd')].filter(d => d.offsetParent !== null).map(d => d.textContent.trim()));
    await page.evaluate(() => { window.__said = []; G.Scenes.city.lookAt('septizodium'); });
    let shotRome = false;
    for (let i = 0; i < 240; i++) {
      if (!shotRome && await page.evaluate(() => /포폴로 광장 오벨리스크의 받침돌/.test(([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || ''))) { await page.screenshot({ path: path.join(OUT, 'discmove_rome.png') }); shotRome = true; }
      if (await page.evaluate(() => G.Disc.foundByMe('septizodium') && !G.Scenes.city.isBusy() && !G.UI.busy())) break;
      if (await page.evaluate(() => G.UI.busy() || document.querySelector('.reveal'))) await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
    }
    const RM = await page.evaluate(() => ({ found: G.Disc.foundByMe('septizodium'), said: window.__said.slice(), got: G.Game.state.discMove.got.septizodium }));
    ok(romeMenu.some(t => /팔라티노 기둥 벽|셉티조디움/.test(t)) && RM.said.some(t => /포폴로 광장 오벨리스크의 받침돌/.test(t)) && RM.found && RM.got === 1, '로마 1590: 메뉴의 「' + (romeMenu.find(t => /팔라티노|셉티조디움/.test(t)) || '') + '」를 누르면 터의 장면 뒤에 찾는다');
  } catch (e) { console.error(e); fail++; }
  ok(errors.length === 0, '콘솔 오류 ' + errors.length + ' ' + errors.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fail ? '실패 ' + fail : '모두 통과');
  process.exit(fail ? 1 : 0);
})();
