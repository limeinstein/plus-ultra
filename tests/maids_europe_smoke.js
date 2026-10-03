/* 유럽 여급 46명(2026-10-03) 점검: 도시마다 한 명, 그림 사슬이 실제 그림으로 이어지는지, 술집에서 「여급과 이야기」가 뜨고 대화창이 열리는지.
   node tests/maids_europe_smoke.js  (playwright, 스크린샷은 OUT 폴더) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'maids_europe_shots');
const NEW = ['m_opo', 'm_bil', 'm_tol', 'm_zar', 'm_cor', 'm_val', 'm_tls', 'm_rou', 'm_trs', 'm_nan', 'm_bdx', 'm_lyo', 'm_brg', 'm_bxl', 'm_sou',
  'm_edi', 'm_dub', 'm_lub', 'm_brm', 'm_kol', 'm_ffm', 'm_sxb', 'm_nur', 'm_aug', 'm_pra', 'm_vie', 'm_dan', 'm_kgb', 'm_war', 'm_bud', 'm_sto',
  'm_bgo', 'm_mil', 'm_flo', 'm_rom', 'm_pal', 'm_rag', 'm_nov', 'm_mos', 'm_kie', 'm_bel', 'm_ath', 'm_sal', 'm_can', 'm_fam', 'm_kaf'];
const G_NAME = cid => ({ 47: '쾰른', 6: '코르도바', 60: '모스크바' })[cid];
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });

    // 1) 자료와 그림 사슬
    const r = await page.evaluate((NEW) => {
      const byCity = {}, dup = [], bad = [], faces = {};
      G.MAIDS.forEach(m => { if (byCity[m.city]) dup.push(m.id); byCity[m.city] = m.id; });
      NEW.forEach(id => {
        const m = G.MAID[id]; if (!m) { bad.push(id + ' 없음'); return; }
        const c = G.CITY_DATA[m.city];
        if (!G.LIKES[m.like]) bad.push(id + ' like');
        const face = G.Img.pick(G.Img.chain.maid(id, c)), half = G.Img.pick(G.Img.chain.maidHalf(id, c));
        if (!face || !half) bad.push(id + ' 그림 ' + face + ' / ' + half);
        faces[id] = c.name + ' ' + m.name + ' → ' + face;
      });
      const eu = G.CITY_DATA.filter(c => ['ib', 'ne', 'it', 'gr', 'ru'].includes(c.style) && c.size >= 2 && c.lon > -12 && c.lon < 40 && c.lat > 34);
      const missing = eu.filter(c => !byCity[c.id]).map(c => c.name);
      return { n: G.MAIDS.length, dup, bad, faces, missing };
    }, NEW);
    console.log(Object.values(r.faces).join('\n'));
    ok(r.n === 75, '여급 모두 ' + r.n + '명 (예전 29 + 새 46)');
    ok(!r.dup.length, '한 도시에 여급 한 명 ' + (r.dup.join(',') || ''));
    ok(!r.bad.length, '새 여급 46명 모두 얼굴·서 있는 그림이 있음 ' + r.bad.join(' | '));
    console.log('  여급이 없는 유럽 크기 2~3 도시: ' + (r.missing.join(', ') || '없음'));

    // 2) 술집 — 여급과 이야기 (도시마다 새로 시작: 앞 대화창이 남지 않게)
    for (const [cid, id] of [[47, 'm_kol'], [6, 'm_cor'], [60, 'm_mos']]) {
      await page.goto(GAME);
      await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
      await page.evaluate(() => G.Game.go('create'));
      await page.waitForSelector('#nm', { timeout: 30000 });
      await page.fill('#nm', '이강희');   // 시험 캐릭터 — 엔터로 바로 시작
      await page.evaluate(() => { G.Scenes.city.prologue = async function () { G.Game.state.flags.prologue = true; }; });
      await page.press('#nm', 'Enter');
      await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state && G.Game.state.player, null, { timeout: 90000 });
      await page.evaluate((cid) => { G.Game.state.loc.city = cid; G.Game.go('city', { cityId: cid }); }, cid);
      await page.waitForFunction((cid) => G.Game.sceneName === 'city' && G.Game.state.loc.city === cid, cid, { timeout: 60000 });
      await page.waitForTimeout(1500);
      const sub = await page.evaluate(() => G.Scenes.city.B.tavern.sub(G.CITY_DATA[G.Game.state.loc.city]));
      const nm = await page.evaluate(id => G.MAID[id].name, id);
      ok(sub.indexOf(nm) >= 0, G_NAME(cid) + ' 술집: ' + sub);
      await page.evaluate((id) => { const c = G.CITY_DATA[G.Game.state.loc.city]; G.Scenes.city.B.tavern.maid(c, G.MAID[id]).catch(e => console.error(e)); }, id);
      await page.waitForTimeout(2500);
      const shown = await page.evaluate(() => document.body.innerText);
      ok(shown.indexOf(nm) >= 0 && shown.indexOf('처음 뵙는 분') >= 0, nm + ' 대화창이 열림');
      await page.screenshot({ path: path.join(OUT, id + '_talk.png') });
    }

    // 3) 도감 여급 항목
    await page.goto(pathToFileURL(path.join(ROOT, 'catalog.html')).href);
    await page.waitForTimeout(6000);
    await page.evaluate(() => { document.querySelector('#tab-people').click(); const ch = document.querySelector('[data-chip="maid"]'); if (ch) ch.click(); });
    await page.waitForTimeout(1500);
    const cat = await page.evaluate(() => { const t = document.querySelector('#grid').innerText; return t.indexOf('아누시') >= 0 && t.indexOf('에스클라르몽드') >= 0 && document.querySelectorAll('#grid .card').length; });
    ok(cat === 75, '도감 인물 › 여급 ' + cat + '명 (아누시·에스클라르몽드 포함)');
    await page.screenshot({ path: path.join(OUT, 'catalog_maids.png') });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join('\n'));
  } catch (e) {
    console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
