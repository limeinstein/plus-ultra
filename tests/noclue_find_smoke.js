/* 단서 없이 찾기 (2026-10-18) — js/systems/discovery.js D.noClueChance · G.BALANCE.noClueFind
   · 단서가 없으면 찾는 반경 안에 들어도 그날 못 찾을 수 있다 (확률 < 1) — 뭍·바다 모두
   · 단서가 있으면 예전처럼 반경에 들면 찾는다 (확률 1)
   · 가운데 가까울수록 · 망루 표식 · 기술 · 배를 세우고 탐색하면 확률이 오른다, 최대값을 넘지 않는다
   · 여러 날 반경 안을 맴돌면 결국 찾는다 · 콘솔 오류 0
   node tests/noclue_find_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const GAME = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo && G.Game.ensureGeo());
    await page.waitForFunction(() => !G.Game.ensureGeo || G.Game.geoReady, null, { timeout: 120000 });
    const r = await page.evaluate(() => {
      const D = G.Disc, s = G.Game.state, out = {};
      s.date = { y: 1500, m: 6, d: 1 }; s.mates = []; s.player.sk = {};   // 기술 0 — 기본 확률을 본다
      const okD = d => D.built(d) && D.needMet(d) && !D.foundByMe(d.id) && !D.taken(d.id) && !s.hints[d.id] && !d.bookOnly && !(G.TombDuel && G.TombDuel.blocked(d));
      const land = G.DISCOVERIES.filter(d => d.how === 'land' && okD(d))[0];
      const sea = G.DISCOVERIES.filter(d => d.how === 'sea' && okD(d))[0];
      out.ids = [land && land.id, sea && sea.id];
      function rate(fn, n) { let k = 0; for (let i = 0; i < n; i++) { s.discDay = null; s.date = { y: 1500, m: 6, d: 1 + (i % 28) }; if (fn().length) k++; } return k / n; }
      const N = 600;
      out.landNo = rate(() => D.checkLand(land.lon, land.lat).hits.filter(d => d.id === land.id), N);
      out.seaNo = rate(() => D.checkSea(sea.lon, sea.lat).filter(d => d.id === sea.id), N);
      out.seaSearch = rate(() => D.checkSea(sea.lon, sea.lat, { search: true }).filter(d => d.id === sea.id), N);
      out.pCenter = D.noClueChance(land, 'land', 0, 1, false);
      out.pEdge = D.noClueChance(land, 'land', 0.95, 1, false);
      s.marks = s.marks || {}; s.marks[land.id] = { t: 0, mode: 'land' };
      out.pMark = D.noClueChance(land, 'land', 0.95, 1, false);
      delete s.marks[land.id];
      s.player.sk = { hist: 5, survey: 5, sci: 5 }; out.pMax = D.noClueChance(land, 'land', 0, 1, true); out.pMaxSea = D.noClueChance(sea, 'sea', 0, 1, true); s.player.sk = {};
      out.max = G.BALANCE.noClueFind.max;
      // 여러 날 맴돌면 결국 찾는다
      let days = 0, got = false; for (; days < 40 && !got; days++) { s.discDay = null; s.date = { y: 1500, m: 7, d: 1 + (days % 28) }; got = D.checkLand(land.lon, land.lat).hits.some(d => d.id === land.id); }
      out.days = got ? days : -1;
      // 단서가 있으면 늘 찾는다
      s.hints[land.id] = { src: 'tavern:test' }; s.hints[sea.id] = { src: 'tavern:test' };
      out.landHint = rate(() => D.checkLand(land.lon, land.lat).hits.filter(d => d.id === land.id), 60);
      out.seaHint = rate(() => D.checkSea(sea.lon, sea.lat).filter(d => d.id === sea.id), 60);
      out.pHint = D.noClueChance(land, 'land', 0.9, 1, false);
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.landNo > 0.15 && r.landNo < 0.5, '뭍: 단서 없이 반경 한가운데에서 하루에 찾을 확률 ' + Math.round(r.landNo * 100) + '% (' + r.ids[0] + ')');
    ok(r.seaNo > 0.12 && r.seaNo < 0.5, '바다: 단서 없이 ' + Math.round(r.seaNo * 100) + '% (' + r.ids[1] + ')');
    ok(r.seaSearch > r.seaNo + 0.1, '배를 세우고 탐색하면 더 잘 찾는다 (' + Math.round(r.seaSearch * 100) + '%)');
    ok(r.pCenter > r.pEdge && r.pMark > r.pEdge && r.pMax <= r.max && r.pMaxSea <= r.max, '가운데·망루 표식이면 오르고 최대 ' + r.max + '을 넘지 않는다 (가장자리 ' + r.pEdge.toFixed(2) + ' · 표식 ' + r.pMark.toFixed(2) + ' · 가운데 ' + r.pCenter.toFixed(2) + ')');
    ok(r.days > 0, '반경 안을 며칠 맴돌면 결국 찾는다 (' + r.days + '일째)');
    ok(r.landHint === 1 && r.seaHint === 1 && r.pHint === 1, '단서가 있으면 예전처럼 반경에 들면 늘 찾는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
