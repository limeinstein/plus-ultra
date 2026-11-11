/* 북유럽 신화·초원 기마민족·시베리아 발견물 42곳 (js/data/steppenorse.js) — node tests/steppenorse_smoke.js   (BROWSER_EXE=크롬 경로)
   · 1570년엔 없다(소문·도시 메뉴·마을 이야기도) · 양귀비는 1650년부터 · 자료·글·자리·개척 단계·유물 · 그 자리에서 찾는다
   · 투르판·카슈가르 도시 메뉴 · 『몽골 비사』 단서 · 새 민족의 마을 이야기 · 도감 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, m) { console.log((v ? '  ✓ ' : '  ✗ ') + m); if (!v) process.exitCode = 1; }
(async () => {
  const br = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
  const page = await br.newPage({ viewport: { width: 1280, height: 720 } }); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts|Failed to load resource|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.route(/fonts\.(googleapis|gstatic)/, r => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      s.date.y = 1570;
      const ids0 = G.STEPPE_NORSE;
      const before = ids0.filter(id => G.Disc.built(G.DISC[id]) || G.Frontier.available(G.DISC[id]) || G.Disc.opened(G.DISC[id]));
      const cityBefore = G.Disc.cityBuildings(138).concat(G.Disc.cityBuildings(137)).map(d => d.id).filter(id => ids0.includes(id));
      const folkBefore = G.Folk.local(G.CITY_DATA[295]).map(d => d.id).filter(id => ids0.includes(id));
      s.date.y = 1600;
      const poppy1600 = G.Disc.built(G.DISC.poppy);
      const D = G.Disc, ids = G.STEPPE_NORSE.filter(id => id !== 'poppy'), out = { before: before.length, cityBefore, folkBefore, poppy1600, n: ids.length + 1, bad: [], near: [], cats: {}, find: {}, val: {} };
      ids.forEach(id => {
        const d = G.DISC[id]; if (!d) { out.bad.push(id + ' 없음'); return; }
        out.cats[d.cat] = (out.cats[d.cat] || 0) + 1;
        if (!G.DISC_NAMES[id] || !G.DISC_FACTS[id] || !G.DISC_FAM[id]) out.bad.push(id + ' 딸린 글 빠짐');
        if (G.DISC_FACTS[id].some(f => !f[2] || f[1] === f[2])) out.bad.push(id + ' 해요체 빠짐');
        if (d.clue !== G.DISC_NAMES[id].clue) out.bad.push(id + ' 단서 이름 안 붙음(' + d.clue + ')');
        if (d.how === 'land' && !G.Geo.isLand(d.lon, d.lat)) out.bad.push(id + ' 뭍 아님');
        if (d.how === 'city' && !G.CITY_DATA[d.city]) out.bad.push(id + ' 도시 없음');
        if (!G.DISC_FRONT[id]) out.bad.push(id + ' 개척 단계 없음');
        if ((d.cat === 'ruin' || d.cat === 'nature' || d.cat === 'people') && !(G.RELICS[id] || []).length) out.bad.push(id + ' 유물 없음');
        if (d.cat === 'people' && !(G.FOLK_JOIN[id] && d.folk && d.folk.music)) out.bad.push(id + ' 민족 자료 빠짐');
        if (d.plant && !(G.PLANT_CROP[id] && G.GOOD[G.PLANT_CROP[id].id])) out.bad.push(id + ' 교역품 없음');
        G.DISCOVERIES.forEach(o => { if (o.id !== id && Math.hypot(o.lat - d.lat, o.lon - d.lon) < 0.35) out.near.push(id + '~' + o.id + ' ' + Math.hypot(o.lat - d.lat, o.lon - d.lon).toFixed(2)); });
        out.val[id] = d.val;
        if (d.how === 'land') {
          let got = 0;
          for (let i = 0; i < 40 && !got; i++) { s.discDay = {}; const c = D.checkLand(d.lon, d.lat, { search: true }); const h = (c && (c.hits || c)) || []; if (h.some && h.some(x => x.id === id)) got = i + 1; }
          out.find[id] = got;
        }
      });
      s.date.y = 1650; out.poppy1650 = G.Disc.built(G.DISC.poppy);
      out.leads = { secret: (G.WONDERS.leads.b_secret || []).filter(x => ids.includes(x)), kutadgu: (G.WONDERS.leads.b_kutadgu || []).filter(x => ids.includes(x)) };
      out.local = { tashkent: G.Folk.local(G.CITY_DATA[133]).map(d => d.id), urga: G.Folk.local(G.CITY_DATA[295]).map(d => d.id), kashgar: G.Folk.local(G.CITY_DATA[137]).map(d => d.id) };
      out.cityB = { turpan: G.Disc.cityBuildings(138).map(d => d.id), kashgar: G.Disc.cityBuildings(137).map(d => d.id) };
      out.goods = G.GOODS.length; out.goodTail = G.GOODS.slice(-5).map(g => g.id + ':' + g.idx);
      out.voice = G.DiscVoice && G.DiscVoice.render ? G.DiscVoice.render(G.DISC.sulde, [G.DISC_FACTS.sulde[0][1], G.DISC_FACTS.sulde[0][2]], 1, { d: '술데' }) : null;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.before === 0 && !r.cityBefore.length && !r.folkBefore.length, '1570년: 아직 없다 (소문·도시 메뉴·마을 이야기도)');
    ok(r.poppy1600 === false && r.poppy1650 === true, '양귀비는 1650년부터');
    ok(r.n === 42 && !r.bad.length, '새 발견물 42곳 — 자료·글·자리·개척 단계·유물 ' + r.bad.join(', '));
    ok(Object.values(r.find).every(Boolean), '그 자리에서 찾아보면 모두 찾는다 ' + Object.entries(r.find).filter(e => !e[1]).map(e => e[0]).join(','));
    ok(r.cityB.turpan.includes('karez') && r.cityB.kashgar.includes('idkah'), '투르판·카슈가르 도시 메뉴에 카레즈·이드 카');
    ok(r.leads.secret.length === 4, '『몽골 비사』 단서 4');
    ok(r.local.tashkent.includes('folk_kazakh') && r.local.urga.includes('folk_mongol') && r.local.kashgar.includes('folk_uyghur'), '도시 마을 이야기에 새 민족');
    await page.goto(process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'catalog.html')).href);
    await page.waitForTimeout(8000);
    console.log('errors', errors.slice(0, 6));
    ok(!errors.length, '콘솔 오류 0 (게임·도감)');
  } catch (e) { console.log('ERR', e.message); process.exitCode = 1; }
  } finally { await br.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
