/* 자동항해 목적지 고르기 — 방향 · 지역/대륙 묶음 · 즐겨찾기(10곳) 점검 (2026-10-20)
   node tests/autodest_smoke.js   (스크린샷: OUT 또는 임시 폴더/autodest_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'autodest_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1700, m: 5, d: 1 };
      const home = s.player.home, h = G.CITY_DATA[home];
      window.__home = home;
      window.__all = G.CITY_DATA.filter(c => c.port && c.id !== home && G.R.cityExists(c)).map(c => ({ c, d: G.Geo.dist(h.lon, h.lat, c.lon, c.lat) })).sort((a, b) => a.d - b.d);
    });
    const close = () => page.evaluate(() => { const x = [...document.querySelectorAll('#ui .win .x')].pop(); if (x) x.click(); });
    const run = async (fnSrc) => { const r = await page.evaluate(fnSrc); await page.waitForTimeout(250); return r; };

    // ① 8곳: 묶지 않는다 · 방향과 지역이 붙는다
    const flat = await run(() => { const all = window.__all; const s = G.Game.state, home = window.__home; s.routes = {}; [0, 1, 2, 3, 4, 5, 6, 7].map(k => Math.floor(k * all.length / 8)).forEach(i => G.Routes.record(home, all[i].c.id, Math.max(1, Math.round(all[i].d / 2.2)))); const H = G.Scenes.city.B.harbor, c = G.CITY_DATA[home]; window.__dests = H.autoDests(c); H.pickAutoDest(c, window.__dests, 60).then(v => { window.__res = v; }); const box = document.querySelector('.autodest'); return { groups: box.querySelectorAll('.autodest-group').length, rows: [...box.querySelectorAll('.choice')].map(e => e.textContent.replace(/\s+/g, ' ')) }; });
    await page.screenshot({ path: path.join(OUT, '01_flat.png') });
    ok(flat.groups === 0 && flat.rows.length === 8, '8곳이면 묶지 않고 모두 보인다');
    ok(flat.rows.every(t => /(북|동|남|서)쪽 · 약 \d+일/.test(t)), '항구마다 방향·날수 (' + flat.rows[0] + ')');
    await close(); await page.waitForTimeout(200);

    // ② 가까운 18곳: 가까운 항구 5곳 + 지역별 (지역이 10개 안 됨)
    const area = await run(() => { const all = window.__all; const s = G.Game.state, home = window.__home; s.routes = {}; for (let i = 0; i < 18; i++) G.Routes.record(home, all[i].c.id, Math.max(1, Math.round(all[i].d / 2.2))); const H = G.Scenes.city.B.harbor, c = G.CITY_DATA[home]; window.__dests = H.autoDests(c); H.pickAutoDest(c, window.__dests, 60).then(v => { window.__res = v; }); const box = document.querySelector('.autodest'); return { heads: [...box.querySelectorAll('.autodest-head')].map(e => e.textContent.replace(/\s+/g, ' ')), groups: [...box.querySelectorAll('.autodest-group')].map(e => e.textContent.replace(/\s+/g, ' ')), days: [...box.querySelectorAll('.autodest-group')].map(e => +((e.textContent.match(/약 (\d+)일부터/) || [])[1] || 0)) }; });
    await page.screenshot({ path: path.join(OUT, '02_area.png') });
    console.log('   ' + JSON.stringify(area));
    ok(area.heads.some(t => /가까운 항구5곳/.test(t)) && area.heads.some(t => /지역별 항구/.test(t)), '18곳: 가까운 항구 5곳 + 지역별 묶음');
    ok(area.groups.length < 10 && area.days.every((d, i) => i === 0 || d >= area.days[i - 1]), '지역은 가까운 곳부터 (' + area.days + ')');
    // 지역을 펼쳐 즐겨찾기 → 맨 위로
    await page.evaluate(() => { const g = [...document.querySelectorAll('.autodest .autodest-group')].pop(); g.click(); });
    await page.waitForTimeout(200);
    const fav = await page.evaluate(() => { const st = [...document.querySelectorAll('.autodest .autodest-sub .fav-star')]; const name = st[0].closest('.choice').querySelector('span').textContent; st[0].click(); return { name, top: [...document.querySelectorAll('.autodest > *')].slice(0, 2).map(e => e.textContent.replace(/\s+/g, ' ')), favs: G.Scenes.city.B.harbor.favs().length }; });
    await page.screenshot({ path: path.join(OUT, '03_fav.png') });
    ok(fav.favs === 1 && /즐겨찾기/.test(fav.top[0]) && fav.top[1].indexOf(fav.name.split(' ')[0]) >= 0, '즐겨찾기한 항구가 맨 위 (' + fav.top[1] + ')');
    await close(); await page.waitForTimeout(200);

    // ③ 120곳: 지역이 10개를 넘으면 대륙별
    const cont = await run(() => { const all = window.__all; const s = G.Game.state, home = window.__home; s.routes = {}; for (let i = 0; i < 120; i++) G.Routes.record(home, all[Math.floor(i * all.length / 120)].c.id, Math.max(1, Math.round(all[Math.floor(i * all.length / 120)].d / 2.2))); const H = G.Scenes.city.B.harbor, c = G.CITY_DATA[home]; window.__dests = H.autoDests(c); H.pickAutoDest(c, window.__dests, 60).then(v => { window.__res = v; }); const box = document.querySelector('.autodest'); return { heads: [...box.querySelectorAll('.autodest-head')].map(e => e.textContent.replace(/\s+/g, ' ')), groups: [...box.querySelectorAll('.autodest-group')].map(e => e.textContent.replace(/\s+/g, ' ').replace(/^[▾▸]/, '').split(' —')[0]) }; });
    await page.screenshot({ path: path.join(OUT, '04_cont.png') });
    console.log('   ' + JSON.stringify(cont.groups));
    ok(cont.heads.some(t => /대륙별 항구/.test(t)) && cont.groups[0] === '유럽' && cont.groups.indexOf('동아시아') > 0, '120곳: 대륙별 (가까운 유럽부터 ' + cont.groups.join('·') + ')');
    // 즐겨찾기는 10곳까지
    const lim = await page.evaluate(() => { const H = G.Scenes.city.B.harbor; const r = []; window.__dests.forEach(x => { if (H.favs().indexOf(x.c.id) < 0) r.push(H.toggleFav(x.c.id)); }); return { n: H.favs().length, refused: r.filter(x => x === null).length }; });
    ok(lim.n === 10 && lim.refused > 0, '즐겨찾기는 10곳까지 (' + lim.n + '곳, 넘친 ' + lim.refused + '번은 거절)');
    // 고르면 그 항구로
    await page.evaluate(() => { const g = document.querySelector('.autodest .autodest-group'); g.click(); });
    await page.waitForTimeout(200);
    const want = await page.evaluate(() => { const r = [...document.querySelectorAll('.autodest .autodest-sub')][0]; const nm = r.querySelector('span').textContent.split(' ')[0]; r.click(); return nm; });
    await page.waitForTimeout(400);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#ui .askrow button')].find(x => /그대로/.test(x.textContent)); if (b) b.click(); });
    await page.waitForTimeout(300);
    const got = await page.evaluate(() => G.CITY_DATA[window.__res] && G.CITY_DATA[window.__res].name);
    ok(got && want.indexOf(got) === 0, '대륙을 펼쳐 고른 항구로 간다 (' + got + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
