/* Codex 그림 연결 점검 (2026-10-10)
   · 유물 387종이 모두 전용 그림(images/relics)으로 · 교역품 77종이 모두 전용 그림(images/goods, 노예는 끊어진 족쇄)
   · 새 항해사 얼굴 6명(보쿠덴·첸·김·키스크·말린체·투팍) 흉상·무릎상
   · 얼굴 묶음(images/portraits/pools) 760장마다 무릎상 _half — 묶음 얼굴을 빌린 사람(전용 그림 없는 항해사·후원자, 고장 사람)이 대화에서 서서 말한다
   · 다시 만든 발견물 31곳(GIF·끝 장면·시트) · 대화창에 묶음 얼굴 무릎상이 실제로 선다 · 콘솔 오류 0
   node tests/codex_assets_link_smoke.js   (스크린샷: OUT 또는 임시 폴더/codex_link) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'codex_link');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const REDONE = ['arsenal', 'belem', 'bigben', 'bluemosque', 'bolshoi', 'boudhanath', 'brandenburg', 'casacontrat', 'doisuthep', 'eiffel', 'escorial', 'forbidden',
  'globe', 'grandbazaar', 'havana', 'hermitage', 'himeji', 'kremlin', 'liberty', 'louvre', 'neuschwanstein', 'orszaghaz', 'pisa', 'porcelain', 'redfort',
  'redsquare', 'ruhr', 'sistine', 'stbasil', 'uffizi', 'versailles'];

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Img && G.RELIC && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate((REDONE) => {
      const I = G.Img, K = I.chain;
      const relics = Object.keys(G.RELIC).map(id => G.RELIC[id]);
      const relicMiss = relics.filter(rl => !/^relics\//.test(I.pick(K.relic(rl)) || '')).map(rl => rl.id);
      const goods = Object.keys(G.GOOD).map(id => G.GOOD[id]);
      const goodMiss = goods.filter(g => !/^goods\//.test(I.pick(K.good(g)) || '')).map(g => g.id);
      const mates = ['bokuden', 'chen', 'kim', 'kisk', 'marina', 'tupac'];
      const mateMiss = mates.filter(id => !G.MATE[id] || I.pick(K.mate(id)) !== 'portraits/mates/' + id || I.pick(K.mateHalf(id)) !== 'portraits/mates/' + id + '_half');
      const poolFaces = I.list('portraits/pools/').filter(k => !/_half$/.test(k));
      const poolNoHalf = poolFaces.filter(k => !I.has(k + '_half'));
      // 전용 그림 없는 항해사: 대화 무릎상이 묶음 얼굴의 _half 로
      const borrowers = G.MATES.filter(m => !I.has('portraits/mates/' + m.id));
      const poolHalf = borrowers.filter(m => /^portraits\/pools\/.*_half$/.test(I.pick(K.mateHalf(m.id)) || ''));
      const discMiss = REDONE.filter(id => !I.has('discoveries/' + id) || !I.has('discovery-ends/' + id) || !I.has('discovery-sheets/' + id));
      return { relicN: relics.length, relicMiss, goodN: goods.length, goodMiss, mateMiss, poolN: poolFaces.length, poolNoHalf,
        borrowN: borrowers.length, poolHalfN: poolHalf.length, poolHalfId: poolHalf.length ? poolHalf[0].id : null, discMiss,
        slaves: I.pick(K.good(G.GOOD.slaves)) };
    }, REDONE);
    ok(r.relicN === 387 && !r.relicMiss.length, '유물 ' + r.relicN + '종 모두 전용 그림 ' + r.relicMiss.slice(0, 8).join(','));
    ok(r.goodN === 77 && !r.goodMiss.length && r.slaves === 'goods/slaves', '교역품 ' + r.goodN + '종 모두 전용 그림 (노예 → ' + r.slaves + ') ' + r.goodMiss.join(','));
    ok(!r.mateMiss.length, '새 항해사 얼굴 6명 흉상·무릎상 ' + r.mateMiss.join(','));
    ok(r.poolN === 760 && !r.poolNoHalf.length, '얼굴 묶음 ' + r.poolN + '장 모두 무릎상이 있다 ' + r.poolNoHalf.slice(0, 5).join(','));
    ok(r.poolHalfN > 0, '전용 그림 없는 항해사 ' + r.borrowN + '명 가운데 ' + r.poolHalfN + '명이 묶음 얼굴 무릎상으로 선다');
    ok(!r.discMiss.length, '다시 만든 발견물 31곳 GIF·끝 장면·시트 ' + r.discMiss.join(','));

    // 대화창: 묶음 얼굴을 빌린 항해사가 서서 말한다
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state, c = G.CITY_DATA[0]; s.loc = { mode: 'city', city: 0, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Town && G.Town.active(), null, { timeout: 60000 });
    await page.waitForTimeout(800);
    const shown = await page.evaluate((id) => {
      document.querySelectorAll('.modal-back').forEach(e => e.remove());
      const T = G.Scenes.city.B.tavern, m = G.MATE[id];
      const who = T.duo({ name: m.name, rigId: 'mate:' + id, portrait: G.Art.mateSpec(id), half: G.Img.chain.mateHalf(id) });
      G.UI.say('바다라면 어디든 따라가겠습니다, 제독.', who);
      return m.name + ' ' + G.Img.pick(G.Img.chain.mateHalf(id));
    }, r.poolHalfId);
    await page.waitForFunction(() => document.querySelector('.dlg'), null, { timeout: 10000 });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(OUT, 'pool_half_dialog.png') });
    const stand = await page.evaluate(() => [...document.querySelectorAll('.dlg-actor')].map(a => a.className + ' ' + ((a.querySelector('img') || {}).src || '').split('/').slice(-3).join('/')));
    ok(stand.some(t => /tall/.test(t)), '대화창에 묶음 얼굴 무릎상으로 선다: ' + shown);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
