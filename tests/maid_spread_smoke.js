/* 지역 여급 그림을 도시에 고루 뿌리기 (js/core/images.js I.maidPicCity · spreadCityMaids)
   · Codex가 새로 넣은 여급 60명(images/maid-styles — 새 자리 30명 + 다시 그린 30명)이 모두 어느 도시 술집엔가 선다
   · 그림이 모두 한 번씩 쓰이기 전에는 겹치지 않는다(묶음 후보 안에서) · 한 그림이 너무 많은 도시에 서지 않는다
   · 묶음에 맞지 않는 그림은 정해진 곳에서만 (아프리카 금발·붉은 머리 안 씀, 아랍 금발·유럽 옷차림은 지중해 이슬람 도시만, 깃털 머리띠는 아메리카 토착 도시만)
   · 새 그림마다 무릎상(_half)과 얼굴 자리(G.PORTRAIT_FACES)가 있다 · 술집에 서고 대화창이 열린다 · 콘솔 오류 0
   node tests/maid_spread_smoke.js   (스크린샷: OUT 또는 임시 폴더/maid_spread) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'maid_spread');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const range = (st, a, b) => Array.from({ length: b - a + 1 }, (_, i) => 'maid-styles/' + st + '/' + (a + i));
const CODEX = [].concat(range('africa', 13, 18), range('arabia', 8, 13), range('india', 13, 18), range('native', 7, 12), range('westeurope', 2, 7),
  range('arabia', 1, 6), range('ottoman', 1, 6), range('persia', 1, 6), range('seasia', 1, 6), range('tropic', 1, 6));

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Img && G.Img.spreadCityMaids && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate((CODEX) => {
      const I = G.Img, map = I.spreadCityMaids(), used = {}, where = {};
      Object.keys(map).forEach(cid => { const k = map[cid]; used[k] = (used[k] || 0) + 1; (where[k] = where[k] || []).push(G.CITY_DATA[cid]); });
      const named = {}; G.MAIDS.forEach(m => { named[m.city] = 1; });
      const missing = CODEX.filter(k => !I.has(k) || !I.has(k + '_half'));
      const noFace = CODEX.filter(k => !(G.PORTRAIT_FACES || {})[k] || !(G.PORTRAIT_FACES || {})[k + '_half']);
      const unused = CODEX.filter(k => !used[k]);
      // 묶음 후보 안에서: 어떤 그림이 두 번 쓰일 때 같은 후보의 다른 그림이 한 번도 안 쓰였으면 고르게 뿌리지 못한 것
      const uneven = [];
      Object.keys(map).forEach(cid => {
        const c = G.CITY_DATA[cid], k = map[cid];
        const cand = [].concat(...(I.maidPool(c) || []).map(st => I.maidList(st, c)));
        if (used[k] > 1 && cand.some(o => !used[o])) uneven.push(c.name + ':' + k);
      });
      const fs = cid => I.folkStyle(G.CITY_DATA[cid]);
      const ruleBad = Object.keys(map).filter(cid => {
        const k = map[cid], f = fs(cid);
        if (k === 'maid-styles/africa/9' || k === 'maid-styles/africa/11') return true;
        if (/arabia\/(2|3|10)$/.test(k) && f !== 'is') return true;
        if (/arabia\/12$/.test(k) && f !== 'is' && f !== 'pe') return true;
        if (k === 'maid-styles/seasia/5' && ['az', 'an', 'na'].indexOf(f) < 0) return true;
        return false;
      }).map(cid => G.CITY_DATA[cid].name + ':' + map[cid]);
      // 이름 있는 여급이 없는 도시는 모두 그림이 있다 (묶음이 있는 고장)
      const noPic = G.CITY_DATA.filter(c => !named[c.id] && I.maidPool(c) && !map[c.id]).map(c => c.name);
      const maxUse = Math.max(...Object.values(used));
      const sample = CODEX.slice(0, 60).filter((k, i) => i % 6 === 0).map(k => k.slice(12) + '→' + (where[k] || []).map(c => c.name).join('·'));
      // 다시 불러도 같은 배치 (도시 번호 순 결정)
      const again = JSON.stringify(I.spreadCityMaids()) === JSON.stringify(map);
      const cityOf = k => (where[k] || [])[0];
      return { n: CODEX.length, missing, noFace, unused, uneven, ruleBad, noPic, maxUse, sample, again,
        shot: [cityOf('maid-styles/westeurope/3'), cityOf('maid-styles/india/18'), cityOf('maid-styles/arabia/8')].map(c => c && c.id) };
    }, CODEX);
    console.log('  ' + r.sample.join(' / '));
    ok(r.n === 60 && !r.missing.length, 'Codex 여급 60명: 흉상·무릎상 모두 있다 ' + r.missing.join(','));
    ok(!r.noFace.length, '60명 모두 얼굴 자리(눈·입)가 재어져 있다 ' + r.noFace.join(','));
    ok(!r.unused.length, '60명 모두 어느 도시 술집엔가 선다 ' + r.unused.join(','));
    ok(!r.uneven.length, '묶음 후보의 그림이 모두 한 번씩 쓰이기 전에는 겹치지 않는다 ' + r.uneven.slice(0, 8).join(','));
    ok(!r.ruleBad.length, '고장에 맞지 않는 그림은 정해진 도시에서만 ' + r.ruleBad.join(','));
    ok(!r.noPic.length, '이름 있는 여급이 없는 도시는 모두 지역 여급 그림이 있다 ' + r.noPic.slice(0, 8).join(','));
    ok(r.maxUse <= 5 && r.again, '한 그림이 서는 도시는 많아야 ' + r.maxUse + '곳 (그림이 한 장뿐인 묶음), 다시 불러도 같은 배치');

    // 술집에 서 있는 모습과 대화창
    for (const cid of r.shot) {
      await page.evaluate(async (cid) => {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        const s = G.Game.state, c = G.CITY_DATA[cid];
        s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat };
        G.Game.go('city', { cityId: c.id });
      }, cid);
      await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Town && G.Town.active(), null, { timeout: 60000 });
      await page.waitForTimeout(800);
      const name = await page.evaluate(async (cid) => {
        document.querySelectorAll('.modal-back').forEach(e => e.remove());
        const c = G.CITY_DATA[cid], T = G.Scenes.city.B.tavern;
        const panel = T.panel(c); if (panel) document.getElementById('ui').appendChild(panel);
        T.servant(c);
        return c.name + ' ' + G.Img.maidPicCity(c);
      }, cid);
      await page.waitForFunction(() => document.querySelector('.dlg'), null, { timeout: 10000 });
      await page.waitForTimeout(2200);
      const shot = path.join(OUT, 'tavern_' + cid + '.png');
      await page.screenshot({ path: shot });
      const has = await page.evaluate(() => !!document.querySelector('.tavern-maid img, .tavern-maid canvas'));
      ok(has, '술집에 서 있는 여급과 대화창: ' + name);
      for (let i = 0; i < 4 && await page.evaluate(() => !!document.querySelector('.dlg')); i++) { await page.mouse.click(800, 800); await page.waitForTimeout(500); }
      await page.evaluate(() => { document.querySelectorAll('.dlg-stage, .dlg-actors, .tavern-maid, .modal-back').forEach(e => e.remove()); });
    }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
