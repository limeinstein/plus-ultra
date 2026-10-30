/* 알려진 해도의 자동 범위·새 삽화·몽골/만주 거점과 실제 거리 배경을 file://에서 검사한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/north-chart-20261030');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { const raf = requestAnimationFrame.bind(window); window.__frames = true; window.requestAnimationFrame = cb => raf(t => { if (window.__frames) cb(t); }); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.SteppeCities && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending && !G.Loader.shown(), null, { timeout: 120000 });
    const report = await page.evaluate(async () => {
      window.__checks = []; const ok = (v, m) => { if (!v) throw Error(m); __checks.push(m); };
      G.State.newGame({ name: '해도 점검', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      await G.Game.ensureGeo(); await G.ChartArt.preload(); window.__frames = false;
      const s = G.Game.state; s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0;
      const europe = G.ChartView.exploredView(1100, 560);
      ok(europe.span < 120 && europe.lon > -15 && europe.lon < 30, '처음 해도는 유럽 중심으로 크게 표시');
      const bits = new Uint8Array(s.chartBits);
      G.State.revealChart(-80, 25, 10); const america = G.ChartView.exploredView(1100, 560);
      G.State.revealChart(125, 40, 10); const asia = G.ChartView.exploredView(1100, 560);
      ok(europe.span < america.span && america.span < asia.span, '아메리카·아시아 탐사에 따라 표시 범위 확대');
      const host = document.createElement('div'); document.body.appendChild(host);
      let api = G.ChartView.mount(host, { w: 1100, h: 560 });
      ok(api.view.span === asia.span, '해도를 다시 펼치면 확장된 범위로 시작');
      api.view.span = 20; api.el.querySelector('[data-z="all"]').click();
      ok(api.view.span === asia.span, '전체 단추는 알려진 범위에 맞춤'); host.remove();
      const explicit = document.createElement('div'); document.body.appendChild(explicit);
      api = G.ChartView.mount(explicit, { w: 1100, h: 560, center: [120, 40], span: 24 });
      ok(api.view.span === 24 && api.view.lon === 120, '명시한 지도 중심·확대율 보존'); explicit.remove();
      ok(G.FX.chart.motifs.length === 14 && G.FX.chart.motifs.every(id => !!G.Img.get('chart/' + id)), '기존 4종·추가 10종 삽화 모두 로딩');
      ok(G.CITY_DATA.length === 316 && G.CITY_DATA.every((c, i) => c.id === i), '기존 도시 ID 보존·7곳 추가');
      for (const id of G.SteppeCities.ids) {
        const c = G.CITY_DATA[id];
        ok(G.Geo.isLand(c.lon, c.lat), c.name + ': 육지 위치');
        ok(c.goods.every(g => !!G.GOOD[g]), c.name + ': 교역품 유효');
        ok(c.aliases.length && G.SteppeCities.note(c), c.name + ': 별칭·역사 설명');
        if (id >= 309) { delete s.market[id]; ok(!!G.R.market(id).g, c.name + ': 옛 저장의 새 시장 자동 생성'); }
      }
      s.date.y = 1500; ok(G.Img.pick(G.Img.chain.bg(G.CITY_DATA[144])) === 'backgrounds/144', '사원 설립 전 기존 카라코룸 배경');
      s.date.y = 1636; ok(G.Img.pick(G.Img.chain.bg(G.CITY_DATA[144])) === G.CITY_DATA[144].bgKey, '후기 에르덴 조 배경');
      ok(G.SteppeCities.note(G.CITY_DATA[315]).includes('옛 왕도'), '국내성은 고구려 왕도 옛터로 설명');
      const owners = [1500, 1625, 1645].map(y => { s.date.y = y; return G.Dominion.owner(G.CITY_DATA[312]); });
      ok(JSON.stringify(owners) === JSON.stringify(['명', '후금', '청']), '심양의 명·후금·청 연대 적용');
      s.date.y = 1636; s.chartBits = bits; s.chartRevision++; G.ChartView.invalidate();
      G.SteppeCities.ids.forEach(id => { if (!s.known.includes(id)) s.known.push(id); });
      G.Info.open('map');
      return { europe, america, asia, checks: __checks };
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, 'europe-aged-chart.png') });
    const search = page.locator('.chartview input[type=search]');
    await search.fill('귀화성');
    await page.waitForFunction(() => [...document.querySelectorAll('.cv-results [role=option]')].some(el => el.textContent.includes('후허호토')), null, { polling: 100 });
    report.checks.push('귀화성 별칭으로 후허호토 검색');
    const backgrounds = await page.evaluate(async () => {
      document.querySelector('.modal-back .title .x').click(); G.Game.showLayers(false, false, true);
      const sheet = document.createElement('canvas'); sheet.width = 1600; sheet.height = 2250; const ctx = sheet.getContext('2d');
      ctx.fillStyle = '#e2d0a3'; ctx.fillRect(0, 0, sheet.width, sheet.height);
      const rows = [];
      for (let i = 0; i < G.SteppeCities.ids.length; i++) {
        const c = G.CITY_DATA[G.SteppeCities.ids[i]], s = G.Game.state; s.date.y = 1636; s.day = 0; s.loc.city = c.id;
        await G.Img.load(c.bgKey); const img = G.Img.get(c.bgKey), buildings = G.Scenes.city.buildings(c);
        await G.Town.open(c, buildings); const st = G.Town.runtime(); st.cam = st.camTo = Math.max(0, (st.streetW - 1600) / 2);
        st.hero.x = st.cam + 800; st.dirty = true; G.Town.update(0);
        if (!img || st.bg !== img || !st.bgCv || st.items.length !== buildings.length) throw Error(c.name + ': 배경·건물 적용 실패');
        ctx.drawImage(G.Game.canvases().scene, i % 2 * 800, Math.floor(i / 2) * 450, 800, 450);
        rows.push({ id: c.id, name: c.name, key: c.bgKey, buildings: st.items.length });
      }
      G.Town.close(); return { rows, png: sheet.toDataURL() };
    });
    fs.writeFileSync(path.join(OUT, 'city-streets.png'), Buffer.from(backgrounds.png.split(',')[1], 'base64'));
    report.backgrounds = backgrounds.rows; report.errors = errors;
    assert.deepStrictEqual(errors, [], '브라우저 오류 0');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`PASS: ${report.checks.length} checks, ${backgrounds.rows.length} city streets, no browser errors`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
