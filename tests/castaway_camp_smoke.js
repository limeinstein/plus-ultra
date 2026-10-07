/* 야영지에서 배 고치기 · 같은 곳 맴돌며 야영(윌슨·표류기) · 술집에서 선원 모으기(뭍길로 들어온 도시 포함) 점검.
   node tests/castaway_camp_smoke.js   (스크린샷: OUT 또는 임시 폴더/castaway_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'castaway_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Game.geoReady !== undefined, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state;
      s.fleet.ships = [G.R.newShip('caravel'), G.R.newShip('caravel')]; s.fleet.crew = 40; s.fleet.mat = 30; s.player.gold = 90000;
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
      G.Game.go('land', { from: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'land', null, { timeout: 30000 });
    await page.waitForTimeout(800);
    // UI.ask 를 차례로 답하게 하고, 받은 고르기를 적어 둔다
    await page.evaluate(() => {
      window.__ans = []; window.__asked = [];
      const ask0 = G.UI.ask;
      G.UI.ask = async (text, opts, who) => { if (/야영지를 차렸다/.test(text)) { window.__asked.push({ text, opts: opts.map(o => ({ label: o.label, value: o.value, dis: !!o.dis })) }); return window.__ans.shift(); } return ask0(text, opts, who); };
      G.UI.say = async () => {};
    });
    // ① 배 곁 야영: 배를 고친다
    const rep = await page.evaluate(async () => {
      const s = G.Game.state, f = s.fleet;
      f.ships.forEach(sh => { sh.hp = Math.round(sh.maxHp * 0.5); });
      const hp0 = f.ships.map(sh => sh.hp), mat0 = f.mat, d0 = s.day;
      window.__ans.push('repair'); await G.Scenes.land._test.camp();
      const opt = window.__asked[0].opts.find(o => o.value === 'repair');
      return { opt, hp0, hp1: f.ships.map(sh => Math.round(sh.hp)), mat0, mat1: Math.round(f.mat * 10) / 10, days: s.day - d0, site: G.Castaway.site() };
    });
    console.log(JSON.stringify(rep));
    ok(rep.opt && !rep.opt.dis && /배를 고친다/.test(rep.opt.label), '배가 보이는 야영지: 「' + rep.opt.label + '」');
    ok(rep.hp1.every((h, i) => h > rep.hp0[i]) && rep.mat1 < rep.mat0 && rep.days === 2, '배 고치기 ' + rep.days + '일: 내구 ' + rep.hp0.join('/') + ' → ' + rep.hp1.join('/') + ' · 자재 ' + rep.mat0 + ' → ' + rep.mat1);
    // ② 멀리서는 막힘, 자재가 없으면 막힘
    const blk = await page.evaluate(async () => {
      const s = G.Game.state, l = s.loc, f = s.fleet, out = {};
      const lon0 = l.lon, lat0 = l.lat;
      l.lon += 4; l.lat += 0.5; window.__ans.push(null); await G.Scenes.land._test.camp();
      out.far = window.__asked[1].opts.find(o => o.value === 'repair');
      l.lon = lon0; l.lat = lat0; const m = f.mat; f.mat = 0; window.__ans.push(null); await G.Scenes.land._test.camp();
      out.noMat = window.__asked[2].opts.find(o => o.value === 'repair'); f.mat = m;
      out.n = G.Castaway.site().n;
      return out;
    });
    ok(blk.far.dis && /배가 보이는 곳에서만/.test(blk.far.label), '배가 안 보이는 곳: ' + blk.far.label);
    ok(blk.noMat.dis && /자재가 없다/.test(blk.noMat.label), '자재가 없으면: ' + blk.noMat.label);
    ok(blk.n === 1, '「그만둔다」는 야영으로 치지 않는다 (야영 ' + blk.n + '번)');
    // ③ 같은 곳에서 한 달 안에 열 번 → 윌슨
    await page.evaluate(async () => { for (let i = 0; i < 8; i++) { window.__ans.push('herb'); await G.Scenes.land._test.camp(); } });
    const pre = await page.evaluate(() => ({ n: G.Castaway.site().n, has: G.R.hasItem('wilson'), note: G.Castaway.note() }));
    ok(pre.n === 9 && !pre.has, '아홉 번째 야영까지는 윌슨이 없다 (' + pre.note + ')');
    await page.evaluate(() => { window.__ans.push('herb'); window.__p = G.Scenes.land._test.camp(); });
    await page.waitForSelector('.castaway', { timeout: 10000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'wilson.png') });
    const wtxt = await page.evaluate(() => document.querySelector('.castaway').innerText);
    await page.waitForTimeout(500);
    await page.locator('.win .foot button').last().click();
    await page.evaluate(() => window.__p);
    const wil = await page.evaluate(() => ({ has: G.R.hasItem('wilson'), img: !!G.Img.itemSrc({ id: 'wilson' }), fat: G.Game.state.fleet.fatigue, cw: G.Game.state.castaway }));
    ok(wil.has && /윌슨/.test(wtxt) && wil.img, '열 번째 야영: 윌슨 사건, 물건 「윌슨」(그림 있음)');
    // 윌슨과 함께 쉬기: 피로가 더 풀린다
    const rest = await page.evaluate(async () => { const f = G.Game.state.fleet; f.fatigue = 80; window.__ans.push('rest'); await G.Scenes.land._test.camp(); return { fat: f.fatigue, bonus: G.Castaway.restBonus() }; });
    ok(rest.bonus > 0 && rest.fat <= 80 - 25 - rest.bonus, '윌슨과 쉬기: 피로 80 → ' + Math.round(rest.fat) + ' (윌슨 −' + rest.bonus + ')');
    // ④ 석 달 → 표류기
    const cost0 = await page.evaluate(() => G.Scenes.land.dailyCost());
    await page.evaluate(async () => { for (let i = 0; i < 40 && !document.querySelector('.castaway'); i++) { window.__ans.push('rest'); const p = G.Scenes.land._test.camp(); await Promise.race([p, new Promise(r => setTimeout(r, 300))]); if (document.querySelector('.castaway')) { window.__p = p; break; } } });
    await page.waitForSelector('.castaway', { timeout: 10000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'castawaylog.png') });
    const jtxt = await page.evaluate(() => document.querySelector('.castaway').innerText);
    await page.waitForTimeout(500);
    await page.locator('.win .foot button').last().click();
    await page.evaluate(() => window.__p);
    const jr = await page.evaluate(() => { const s = G.Game.state, site = G.Castaway.site(); return { has: G.R.hasItem('castawaylog'), days: s.day - site.since, n: site.n, cost: G.Scenes.land.dailyCost(), find: G.Castaway.findMult() }; });
    ok(jr.has && /표류기/.test(jtxt) && jr.days >= 90, '같은 야영지 ' + jr.days + '일 · 야영 ' + jr.n + '번: 표류기 사건, 물건 「표류기」');
    ok(jr.cost < cost0 && jr.find > 1, '표류기: 하루 경비 ' + cost0 + ' → ' + jr.cost + '닢 · 사냥·물 ×' + jr.find);
    // 다시 일어나지 않는다
    const again = await page.evaluate(async () => { const n = G.Game.state.player.items.filter(i => i.id === 'wilson' || i.id === 'castawaylog').length; window.__ans.push('herb'); await G.Scenes.land._test.camp(); return { n, n2: G.Game.state.player.items.filter(i => i.id === 'wilson' || i.id === 'castawaylog').length }; });
    ok(again.n === 2 && again.n2 === 2, '윌슨·표류기는 한 번씩만');
    // 옛 저장: s.castaway 가 없어도 된다
    const old = await page.evaluate(async () => { delete G.Game.state.castaway; window.__ans.push('herb'); await G.Scenes.land._test.camp(); return !!G.Game.state.castaway && G.Castaway.site().n === 1; });
    ok(old, '옛 저장(s.castaway 없음)에서도 새로 센다');

    // ⑤ 술집에서 선원 모으기: 항구 메뉴에서는 빠지고, 뭍길로 들어온 도시에서는 탐험대에 합류
    const tv = await page.evaluate(async () => {
      const s = G.Game.state, C = G.Scenes.city, c = G.CITY_DATA.find(x => !x.port && G.R.cityExists(x) && x.region === 0) || G.CITY_DATA.find(x => !x.port);
      C.say = async () => {}; C.mate = async () => {};
      const party0 = s.loc.party;
      s.landReturn = { lon: s.loc.lon, lat: s.loc.lat, base: s.loc.base, party: s.loc.party, days: s.loc.days, mount: s.loc.mount };
      s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat, heading: 0, via: 'land' };
      const tm = C.B.tavern.menu(c).filter(Boolean).map(m => m.label), hm = C.B.harbor.menu(c).filter(Boolean).map(m => m.label);
      const crew0 = s.fleet.crew, gold0 = s.player.gold;
      let numOpt = null; const num0 = G.UI.number; G.UI.number = async o => { numOpt = { title: o.title, min: o.min, max: o.max }; return crew0 + 6; };
      await C.B.tavern.crew(c);
      const add = { crew: s.fleet.crew - crew0, party: s.landReturn.party - party0, gold: gold0 - s.player.gold, sub: G.Scenes.city.B.tavern.crewSub() };
      G.UI.number = async o => 1;      // 너무 많이 내보내려 해도 탐험대는 한 사람이 남는다
      G.UI.confirm = async () => true;
      await C.B.tavern.crew(c);
      G.UI.number = num0;
      return { city: c.name, tm, hm, numOpt, add, after: { crew: s.fleet.crew, party: s.landReturn.party } };
    });
    console.log(JSON.stringify(tv));
    ok(tv.tm.indexOf('선원을 모은다') >= 0 && tv.hm.indexOf('선원 수 조정') < 0, '술집 메뉴에 「선원을 모은다」, 항구 메뉴에서는 「선원 수 조정」이 빠졌다');
    ok(tv.add.crew === 6 && tv.add.party === 6 && tv.add.gold > 0, '뭍길로 들어온 ' + tv.city + ' 술집: 선원 6명 모집 → 탐험대도 6명 늘어남 (금화 ' + tv.add.gold + ') — ' + tv.add.sub);
    ok(/탐험대/.test(tv.numOpt.title) && tv.after.party >= 1 && tv.after.crew === tv.after.party, '탐험대에서 내보내도 한 사람은 남는다 (선원 ' + tv.after.crew + ' · 탐험대 ' + tv.after.party + ')');
    // 화면: 술집 메뉴 (실제 장면)
    await page.evaluate(() => { const s = G.Game.state; s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; delete s.landReturn; G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
