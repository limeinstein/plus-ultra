/* 발견물 자리 겹침 점검: 같은 좌표(또는 거의 같은 자리)에 발견물이 둘 이상 있으면 한자리에서 한꺼번에 나오고 지도 표식이 포개진다.
   - 뭍(land) 발견물끼리 0.12° 이상, 바다(sea)끼리 0.3° 이상, 그 밖(도시 안·뭍과 도시·뭍과 바다)은 같은 좌표가 아니어야(0.002° 이상)
   - 자리 없는 것(교역품·특수, 좌표 0,0)은 뺀다
   - discoveries.js 의 SPREAD 로 옮긴 뭍 발견물은 뭍에, 바다 발견물은 바다에 있어야 한다 (G.Geo)
   node tests/disc_spacing_smoke.js  (playwright) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const GAME = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;

(async function () {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage();
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.DISCOVERIES && G.Geo && G.Geo.ready !== false && G.Game, null, { timeout: 90000 });
    await page.waitForFunction(() => { try { return typeof G.Geo.sdf(0, 0) === 'number'; } catch (e) { return false; } }, null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const L = G.DISCOVERIES.filter(d => d.lon != null && (d.how === 'land' || d.how === 'sea' || d.how === 'city') && !(d.lat === 0 && d.lon === 0));
      const dist = (a, b) => G.Geo.dist(a.lon, a.lat, b.lon, b.lat);
      const bad = [];
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
        const a = L[i], b = L[j], h = a.how + '/' + b.how, d = dist(a, b);
        const lim = h === 'land/land' ? 0.12 : h === 'sea/sea' ? 0.3 : 0.002;
        if (d < lim) bad.push(a.id + '·' + b.id + ' ' + d.toFixed(3) + '° < ' + lim + ' (' + h + ')');
      }
      const moved = G.DISCOVERIES.filter(d => G.DISC_SPREAD && G.DISC_SPREAD[d.id]);
      const wrong = moved.filter(d => d.how === 'land' ? !G.Geo.isLand(d.lon, d.lat) : d.how === 'sea' ? G.Geo.isLand(d.lon, d.lat) : false)
        .map(d => d.id + ' (' + d.how + ' ' + d.lat + ',' + d.lon + ')');
      return { n: L.length, bad, moved: moved.length, wrong };
    });
    if (r.bad.length) throw new Error('겹친 발견물 ' + r.bad.length + '쌍:\n  ' + r.bad.join('\n  '));
    if (r.wrong.length) throw new Error('옮긴 자리가 뭍/바다와 맞지 않음: ' + r.wrong.join(', '));
    console.log('발견물 ' + r.n + '곳 자리 겹침 없음 (뭍 0.12°·바다 0.3°·그 밖 같은 좌표 금지) · 옮긴 ' + r.moved + '곳 뭍/바다 맞음');
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
