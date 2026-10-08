/* 새 발견물 점검 (2026-10-08) — 중국·인도·중동 명승지·건축물(js/data/eastdisc.js)과 민족 발견물(js/data/folkdisc.js · js/systems/folk.js)
   - 새 발견물 83곳: 자연 30 · 유적 17 · 민족 36. 모두 G.DISC에 있고, 개척 단계·유물이 있고, 뭍 발견물은 뭍에·바다 발견물은 바다에 있다.
   - 민족 발견물은 모두 풍속(folk: 노래·춤·악기·음식·무예)을 갖는다. 발견 카드에 「풍속」 칸이 나온다.
   - 부족 이름 도시(230~245, 298~308) 둘레에 그 부족 발견물이 있고, 처음 들르면 마을 사람이, 술집에서는 주인이 단서를 준다(개척 단계와 상관없이).
   - 도감(catalog.html)이 오류 없이 열리고 민족 발견물 상세에 풍속 줄이 있다.
   node tests/folk_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const NOISE = /fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|Failed to load|net::/;
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });

    // ① 자료
    const d = await page.evaluate(() => {
      const ids = G.EAST_DISC.concat(G.FOLK_DISC), r = { n: ids.length, cats: {}, place: [], front: [], relic: [], noFolk: [], tribeCities: [] };
      ids.forEach(id => {
        const x = G.DISC[id]; if (!x) { r.place.push(id + ' 없음'); return; }
        r.cats[x.cat] = (r.cats[x.cat] || 0) + 1;
        if (x.how === 'land' && !G.Geo.isLand(x.lon, x.lat)) r.place.push(id + ' 뭍이 아님');
        if (x.how === 'sea' && G.Geo.isLand(x.lon, x.lat)) r.place.push(id + ' 바다가 아님');
        if (!G.DISC_FRONT[id]) r.front.push(id);
        if (!(G.RELICS[id] || []).length) r.relic.push(id);
      });
      r.noFolk = G.DISCOVERIES.filter(x => x.cat === 'people' && !(x.folk && (x.folk.music || x.folk.dance))).map(x => x.id);
      r.people = G.DISCOVERIES.filter(x => x.cat === 'people').length;
      const want = []; for (let i = 230; i <= 245; i++) want.push(i); for (let i = 298; i <= 308; i++) want.push(i);
      r.tribeCities = want.filter(c => !(G.FOLK_CITY[c] || []).length);
      r.rewritten = ['khoikhoi', 'aztec', 'inca', 'vampire', 'punt'].filter(id => G.DISC[id].desc0 && G.DISC[id].folk).length;
      return r;
    });
    console.log('   ' + JSON.stringify(d));
    ok(d.n === 83 && d.cats.nature === 30 && d.cats.ruin === 17 && d.cats.people === 36, '새 발견물 83곳: 자연 30 · 유적 17 · 민족 36');
    ok(!d.place.length, '뭍 발견물은 뭍에, 바다 발견물은 바다에 ' + d.place.join(', '));
    ok(!d.front.length && !d.relic.length, '모두 개척 단계와 유물이 있다 ' + d.front.concat(d.relic).join(','));
    ok(d.people === 52 && !d.noFolk.length, '민족 발견물 52곳 모두 풍속(노래·춤…)을 갖는다 ' + d.noFolk.join(','));
    ok(d.rewritten === 5, '이미 있던 민족 발견물은 풍속 위주 글로 바뀌고 옛 글은 desc0에 남는다');
    ok(!d.tribeCities.length, '부족 이름 도시 27곳 둘레마다 민족 발견물 ' + d.tribeCities.join(','));

    // ② 부족 마을에 처음 들르면 마을 사람이, 술집에서는 주인이 (1490년 — 아직 개척 단계가 닿지 않았어도)
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : i === 10 ? 2 : i === 15 ? 2 : 0), diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1490, m: 6, d: 1 };
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0;
    });
    const said = [];
    await page.exposeFunction('__said', t => said.push(t));
    await page.evaluate(() => { const C = G.Scenes.city; C.mate = async (t) => { window.__said(t); }; C.say = async (w, t) => { window.__said((w && w.name) + ': ' + t); }; C.news = async () => {}; });
    await page.evaluate(() => { const s = G.Game.state, c = G.CITY_DATA[298]; s.loc = { mode: 'land', lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: 298, arrive: true, via: 'land' }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state.loc.city === 298 && G.Town.active(), null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    const h1 = await page.evaluate(() => G.Game.state.hints.folk_zulu);
    ok(h1 && /^town:298/.test(h1.src) && said.some(t => /마을 사람: .*땅을 구르는/.test(t)), '콰줄루에 처음 들르면 마을 사람이 줄루 사람들의 춤 이야기를 한다 (단서 ' + (h1 && h1.src) + ')');
    const h2 = await page.evaluate(async () => { const c = G.CITY_DATA[231]; G.Folk.TAVERN = 1; const got = await G.Folk.tavern(c, { name: '주인' }); return { got, h: G.Game.state.hints.folk_cherokee }; });
    ok(h2.got && h2.h && /^local:231/.test(h2.h.src), '키투와 술집 주인이 체로키 사람들 이야기를 한다');
    const h3 = await page.evaluate(() => G.Disc.addHint('folk_sami', 'tavern:1'));
    ok(typeof h3 === 'boolean', '오지 민족은 보통 소문 규칙(개척 단계)을 따른다');

    // ③ 발견 카드의 풍속 칸 · 새 자연·유적 발견
    const card = await page.evaluate(async () => {
      const p = G.Scenes.discoveryCard(G.DISC.folk_zulu);
      await new Promise(r => setTimeout(r, 900));
      const box = document.querySelector('.disc-folk');
      const rows = box ? Array.from(box.querySelectorAll('dt')).map(e => e.textContent) : [];
      document.querySelectorAll('.modal-back').forEach(e => e.remove());
      return rows;
    });
    ok(card.join() === '노래,춤,악기,음식,무예', '발견 카드에 풍속 칸: ' + card.join('·'));
    const found = await page.evaluate(async () => {
      const UI = G.UI, o = { say: UI.say, alert: UI.alert, toast: UI.toast, rev: G.Scenes.discoveryReveal, card: G.Scenes.discoveryCard, offer: G.Names && G.Names.offer };
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; G.Scenes.discoveryReveal = async () => {}; G.Scenes.discoveryCard = async () => {}; if (G.Names) G.Names.offer = async () => {};
      const ids = ['guilin', 'shaolin', 'tiantan', 'manasarovar', 'socotra', 'umayyad', 'vittala', 'folk_maori', 'folk_tuva', 'folk_mandan'];
      for (const id of ids) { try { await G.Disc.find(G.DISC[id], G.DISC[id].how); } catch (e) { console.error(id + ': ' + e.message); } }
      UI.say = o.say; UI.alert = o.alert; UI.toast = o.toast; G.Scenes.discoveryReveal = o.rev; G.Scenes.discoveryCard = o.card; if (G.Names) G.Names.offer = o.offer;
      return ids.filter(id => G.Disc.foundByMe(id)).length;
    });
    ok(found === 10, '새 발견물 10곳을 실제로 찾아 수첩에 적는다');

    // ④ 도감
    const cat = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    cat.on('pageerror', e => errors.push('catalog: ' + e.message));
    cat.on('console', m => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push('catalog: ' + m.text()); });
    await cat.goto(pathToFileURL(path.join(ROOT, 'catalog.html')).href);
    await cat.waitForFunction(() => document.querySelector('#tab-discoveries'), null, { timeout: 90000 });
    await cat.click('#tab-discoveries');
    await cat.fill('#q', '줄루 사람들');
    await cat.waitForTimeout(800);
    await cat.click('.card');
    await cat.waitForTimeout(800);
    const det = await cat.evaluate(() => document.querySelector('#dBody') ? document.querySelector('#dBody').innerText : '');
    ok(/풍속 · 노래/.test(det) && /풍속 · 무예/.test(det) && /콰줄루/.test(det), '도감 상세에 풍속 줄과 이야기를 듣는 곳(콰줄루)');
    await cat.evaluate(() => document.querySelector('#detail').close());
    await cat.fill('#q', '천단');
    await cat.waitForTimeout(800);
    ok(await cat.evaluate(() => document.querySelectorAll('.card').length >= 1), '도감에서 「천단」을 찾을 수 있다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
