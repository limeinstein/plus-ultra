/* 아프리카 부족 마을 점검 (도시 298~308, js/data/tribes.js · cities.js flags 'T')
   - 건물은 술집·여관·성문·교역소·시장·조합 + 사당(이슬람 마을은 모스크) (왕궁·조선소 없음) — 사당 그림은 kraal·tent 묶음의 church
   - 땅 위에 있고, 거리 화면이 열리며 그 부족의 건물 그림·배경 그림을 쓴다
   - 도시 요약의 「부족」 줄, 지도 이름표 「부족 마을」, 지배 국가, 고장 사람 고장
   node tests/tribes_smoke.js   (스크린샷: OUT 또는 임시 폴더/tribes_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'tribes_shots');
const IDS = [298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308];
const WANT_EXT = { 298: 'kraal', 299: 'masai', 300: 'kraal', 301: 'africa', 302: 'africa', 303: 'tent', 304: 'arabia', 305: 'kraal', 306: 'tent', 307: 'masai', 308: 'africa' };
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : i === 10 ? 2 : 0), diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1490, m: 6, d: 1 };
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
    });

    // ① 자료: 건물 여섯 곳 · 땅 위 · 부족 설명 · 이름표 · 지배 국가 · 고장
    const d = await page.evaluate((ids) => ids.map(id => {
      const c = G.CITY_DATA[id], C = G.Scenes.city;
      return { id, name: c.name, exists: G.R.cityExists(c), land: G.Geo.isLand(c.lon, c.lat), blds: C.buildings(c).map(b => b.kind).join(','), rel: c.rel, church: G.R.churchName(c), churchPic: G.Img.pick(G.Img.chain.exterior('church', c)),
        tribe: (G.TRIBES[id] || {}).tribe, label: G.CityIcon.label(c), owner: G.R.cityOwner(c), info: G.CityInfo.summary(c).some(r => r.k === '부족'),
        zone: Object.keys(G.MATE_ZONES).filter(z => G.MATE_ZONES[z].ids.indexOf(id) >= 0).join(','), ext: G.Img.extStyle(c), bg: G.Img.pick(G.Img.chain.bg(c)) };
    }), IDS);
    d.forEach(x => console.log('   ' + JSON.stringify(x)));
    ok(G_len(await page.evaluate(() => G.CITY_DATA.length)) === 309 && d.every(x => x.exists), '도시 309곳 — 부족 마을 11곳이 1490년에 있다');
    ok(d.every(x => x.blds === 'trade,tavern,inn,market,church,guild,gate'), '부족 마을 건물: 교역소·술집·여관·시장·사당·조합·성문 (왕궁·조선소 없음)');
    ok(d.every(x => x.church === (x.rel === 'I' ? '모스크' : '사당')) && d.filter(x => x.ext === 'kraal' || x.ext === 'tent').every(x => /exterior-styles\/(kraal|tent)\/church/.test(x.churchPic)), '사당 이름(이슬람 마을은 모스크) · 벌집 오두막·천막 마을은 새 사당 그림: ' + d.map(x => x.name + ':' + x.church + ':' + x.churchPic).join(' '));
    ok(d.every(x => x.land), '11곳 모두 땅 위 (Geo.isLand)');
    ok(d.map(x => x.tribe).join() === '줄루,마사이,코사,요루바,하우사,풀라니,베르베르,산,투아레그,오로모,아샨티', '부족: ' + d.map(x => x.name + '(' + x.tribe + ')').join(' '));
    ok(d.every(x => x.label === '부족 마을' && x.info), '도시 요약에 「부족」 줄, 규모는 「부족 마을」');
    ok(d.every(x => x.ext === WANT_EXT[x.id]), '건물 그림 묶음: ' + d.map(x => x.id + ':' + x.ext).join(' '));
    ok(d.every(x => x.bg === 'backgrounds/' + x.id), '거리 배경 그림 11장');
    ok(d.every(x => x.zone), '고장 사람 고장: ' + d.map(x => x.id + ':' + x.zone).join(' '));
    const own = await page.evaluate(() => { const s = G.Game.state, c = G.CITY_DATA[308], r = []; [1600, 1710, 1897].forEach(y => { s.date.y = y; r.push(G.R.cityOwner(c)); }); s.date.y = 1490; return r; });
    ok(own.join() === '아칸,아샨티 왕국,영국', '쿠마시 주인: 1600 아칸 → 1710 아샨티 왕국 → 1897 영국');
    const imgs = await page.evaluate(async () => { const ks = []; ['kraal', 'tent'].forEach(b => ['tavern', 'inn', 'gate', 'trade', 'market', 'guild', 'church', 'harbor', 'home', 'library', 'mansion', 'palace', 'shipyard'].forEach(k => ks.push('exterior-styles/' + b + '/' + k))); const r = await Promise.all(ks.map(k => G.Img.load(k))); return ks.filter((k, i) => !r[i]); });
    ok(!imgs.length, '새 건물 그림 26장(벌집 오두막·천막 각 13종 — 기본 6 + 코덱스가 더한 사당·항구·자택·도서관·저택·왕궁·조선소 7)이 읽힌다 ' + imgs.join(','));

    // ② 처음 들르면 부관이 부족을 일러 준다 · 거리 화면
    const said = [];
    await page.exposeFunction('__said', t => said.push(t));
    for (const id of IDS) {
      await page.evaluate((id) => { const s = G.Game.state, c = G.CITY_DATA[id]; G.Scenes.city.mate = async (t) => { window.__said(t); }; s.loc = { mode: 'land', lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: id, arrive: true, via: 'land' }); }, id);
      await page.waitForFunction((id) => G.Game.sceneName === 'city' && G.Game.state.loc.city === id && G.Town.active(), id, { timeout: 30000 });
      await page.waitForTimeout(1500);
      await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
      await page.screenshot({ path: path.join(OUT, 'tribe_' + id + '.png') });
    }
    ok(said.length >= 11 && /줄루/.test(said.join()) && /푸른 천/.test(said.join()), '처음 들르면 부관이 그 부족을 일러 준다 (' + said.length + '번)');
    ok(!/황금 의자/.test(said.join()), '1490년 쿠마시: 「황금 의자」 이야기는 아직 (1701년부터)');
    const folk = await page.evaluate(async () => { const c = G.CITY_DATA[298], SF = G.StreetFolk; let bad = 0; const sv = G.UI.say; G.UI.say = async (t) => { if (/교회|신전 지붕/.test(t)) bad++; }; const cm = G.Scenes.city.mate; for (let i = 0; i < 60; i++) { const f = SF.make('man', c, 1600, 300, 600, 'x' + i); f.used = true; await SF.talk(f, c); } G.UI.say = sv; return bad; });
    ok(folk === 0, '부족 마을 거리 사람은 교회·신전 이야기를 하지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
function G_len(n) { return n; }
