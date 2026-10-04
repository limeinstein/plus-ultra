/* 발견 규칙 점검 (2026-10-04)
   - 동물: 도시 안에서 찾던 것은 도시 밖 뭍으로(outskirts), 찾을 수 있는 범위가 넓다(뭍 1.6°·바다 3°·도시 근처 1°)
   - 하루 한 개: 한자리에서 하루에 발견물은 하나만, 이튿날 또 하나
   - 개인 작품: 그 작가가 살아 있으면 도시가 아니라 그 사람을 만나서(checkPerson), 작업을 시작한 해부터. 떠난 뒤에는 도시에서
   - 도시 건물: 들어가는 것만으로는 안 찾고 눌러야(cityBuildings → 메뉴 항목 · 거리 볼거리)
   node tests/disc_rules_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const GAME = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
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
    const r = await page.evaluate(() => {
      const D = G.Disc, s = G.Game.state, out = {};
      const an = G.ANIMALS.map(id => G.DISC[id]);
      out.cityAnimals = an.filter(d => d.how === 'city').length;
      out.outskirts = an.filter(d => d.outskirts).length;
      out.minLandR = Math.min.apply(null, an.filter(d => d.how === 'land' && !d.outskirts).map(d => d.r));
      out.minSeaR = Math.min.apply(null, an.filter(d => d.how === 'sea').map(d => d.r));
      // 하루 한 개 — 세렝게티(사자·얼룩말·기린·바늘두더지가 모여 사는 곳)
      s.discDay = null; s.date = { y: 1500, m: 6, d: 1 };
      const h1 = D.checkLand(35, -2).hits.map(d => d.id);
      h1.forEach(id => { s.disc[id] = { found: true, me: true }; });
      const h2 = D.checkLand(35, -2).hits.map(d => d.id);
      s.date = { y: 1500, m: 6, d: 2 };
      const h3 = D.checkLand(35, -2).hits.map(d => d.id);
      out.day = [h1, h2, h3];
      // 개인 작품
      const paris = G.CITY_DATA.filter(c => c.name === '파리')[0].id;
      s.date = { y: 1505, m: 1, d: 1 };
      out.city1505 = D.checkCity(paris).map(d => d.id);
      out.leo1505 = D.checkPerson('leonardo').map(d => d.id);
      s.date = { y: 1490, m: 1, d: 1 }; out.leo1490 = D.checkPerson('leonardo').map(d => d.id);
      s.date = { y: 1525, m: 1, d: 1 }; out.city1525 = D.checkCity(paris).map(d => d.id); out.leo1525 = D.checkPerson('leonardo').map(d => d.id);
      out.buildings = D.cityBuildings(paris).map(d => d.id);
      // 이 도시(리스본)의 메뉴에 건물 발견물 항목이 붙는가
      s.date = { y: 1500, m: 6, d: 1 };
      const here = G.Scenes.city.city();
      out.hereB = D.cityBuildings(here.id).map(d => d.name);
      G.Scenes.city.main();
      out.menuHas = out.hereB.filter(nm => Array.from(document.querySelectorAll('button, .cmd, .item')).some(b => b.textContent.indexOf(nm) >= 0));
      return out;
    });
    ok(r.cityAnimals === 0 && r.outskirts > 0, '도시 안 동물 0 — ' + r.outskirts + '종은 도시 근처 뭍(도시 밖)에서');
    ok(r.minLandR >= 1.6 && r.minSeaR >= 3, '동물 찾는 범위: 뭍 ' + r.minLandR + '° 이상 · 바다 ' + r.minSeaR + '° 이상');
    ok(r.day[0].length === 1 && r.day[1].length === 0 && r.day[2].length === 1 && r.day[2][0] !== r.day[0][0], '하루 한 개: 첫날 ' + r.day[0] + ' → 같은 날 0 → 이튿날 ' + r.day[2]);
    ok(r.city1505.indexOf('monalisa') < 0 && r.leo1505.indexOf('monalisa') >= 0 && r.leo1505.indexOf('lastsupper') >= 0, '1505년: 모나리자는 파리 시내가 아니라 레오나르도를 만나서 (' + r.leo1505 + ')');
    ok(r.leo1490.length === 0, '1490년: 아직 작업 전이라 레오나르도를 만나도 없음');
    ok(r.city1525.indexOf('monalisa') >= 0 && r.leo1525.length === 0, '1525년(레오나르도가 떠난 뒤): 다시 파리 시내에서');
    ok(r.city1505.indexOf('notredame') < 0 && r.buildings.indexOf('notredame') >= 0, '노트르담: 들어가는 것만으로는 안 찾고 눌러서');
    ok(r.menuHas.length === r.hereB.length, '이 도시 메뉴에 건물 발견물 ' + r.hereB.length + '곳 (' + r.hereB.join('·') + ')');
    // 파리: 메뉴의 「노트르담 대성당」을 누르면 그 자리에서 발견 (발견 연출은 건너뛴다)
    const clear = async () => { for (let i = 0; i < 15; i++) { if (!(await page.evaluate(() => G.UI.busy()))) return; await page.keyboard.press('Enter'); await page.waitForTimeout(450); } };
    await clear();
    await page.evaluate(() => { const s = G.Game.state, p = G.CITY_DATA.filter(c => c.name === '파리')[0]; s.date = { y: 1500, m: 6, d: 1 }; s.loc.city = p.id; G.Scenes.city.main(); });
    await page.waitForTimeout(1200); await clear();
    await page.evaluate(() => G.Scenes.city.main()); await page.waitForTimeout(600); await clear();
    const clicked = await page.evaluate(async () => {
      const found = [], orig = G.Disc.find; G.Disc.find = async (d, how) => { found.push(d.id + ':' + how); };
      const el = Array.from(document.querySelectorAll('.cmdmenu .items > *')).find(e => e.textContent.indexOf('노트르담') >= 0);
      if (el) el.click(); await new Promise(r => setTimeout(r, 2500)); G.Disc.find = orig; return { el: !!el, found };
    });
    ok(clicked.el && clicked.found.indexOf('notredame:city') >= 0, '파리 메뉴 「노트르담 대성당」을 누르면 발견');
    ok(!errors.length, '페이지 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
