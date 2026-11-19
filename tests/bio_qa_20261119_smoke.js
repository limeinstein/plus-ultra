/* 동물·식물 발견 QA 100판 수정 (2026-11-19 사용자 요청)
   ① 식물 증거 아이템(보석·표본·지팡이·선수상·장신구·약재·화관·종자) — js/data/plantrelics.js
   ② 생물 명성 차등(고향에서의 거리·희귀도) — G.BALANCE.bioFame · G.Disc.bioK
   ③ 몰린 동식물 나누기(G.BIO_SPREAD) · 육식 동물 곁의 먹잇감은 달아나고 · 찾지 않은 식물 곁의 동물은 숨는다 — js/systems/biohide.js
   ④ 단서 방향·좌표 (순록·비버·흰올빼미·바다코끼리·황제펭귄 지역)
   ⑥ 뭍길 찾기 — 호수를 둘러 걷는다 (js/world/landnav.js · land.js routeTo)
   ⑦ 원주민 마을 11곳 (도시 316~326, js/data/natives.js) — 그 고장 동식물 단서를 듣는다
   ⑨ 육상 탐험 멈춤 감시 · ⑧ 기지 없는 귀환 · 덤: 「르완다」→「루안다」
   node tests/bio_qa_20261119_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,process.env.PAGE || 'index.html')).href));
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const s = G.Game.state, D = G.Disc, Geo = G.Geo, B = G.BioHide, out = {};
      // ① 식물 증거 아이템
      const plants = G.DISCOVERIES.filter(d => D.isPlant(d));
      const noRelic = plants.filter(d => !(G.RELICS[d.id] || []).length).map(d => d.id);
      const kinds = {}; (G.PLANT_RELICS || []).forEach(a => { kinds[a[3]] = (kinds[a[3]] || 0) + 1; });
      const meds = (G.PLANT_RELICS || []).filter(a => a[3] === 'medicine').map(a => G.ITEM[a[1]]);
      out.relic = { plants: plants.length, noRelic, kinds, n: (G.PLANT_RELICS || []).length, medOk: meds.every(m => m && m.heal > 0 && m.consumable === 1), allItems: (G.PLANT_RELICS || []).every(a => G.ITEM[a[1]] && G.RELIC[a[1]]) };
      // ② 명성 차등
      s.player.home = 0;   // 리스본
      const near = G.DISC.bitterorange, far = G.DISC.lotus, legend = G.DISCOVERIES.find(d => d.legendBeast && d.bookOnly && d.how === 'land');
      out.fame = { near: D.bioK(near), far: D.bioK(far), legend: D.bioK(legend), ruin: D.bioK(G.DISC.pyramid || G.DISCOVERIES.find(d => d.cat === 'ruin')), farFame: D.fameFor(far) };
      // ③ 나누기
      const moved = Object.keys(G.BIO_SPREAD).filter(id => G.DISC[id]);
      out.spread = { n: moved.length, applied: moved.every(id => Geo.dist(G.DISC[id].lon, G.DISC[id].lat, G.BIO_SPREAD[id][1], G.BIO_SPREAD[id][0]) < 0.3 && Geo.isLand(G.DISC[id].lon, G.DISC[id].lat))   /* 뒤에서 겹친 발견물을 조금씩 벌리는 일이 있어 0.3° 안이면 된다 */ };
      // ③ 육식 동물과 먹잇감
      const prey = G.DISCOVERIES.filter(d => B.isPrey(d) && B.predator(d) && B.fled(d));
      const p = prey[0], c = p && B.predator(p), fp = p && B.fled(p);
      out.flee = { count: prey.length, prey: p && p.name, pred: c && c.name, dist: p && +Geo.dist(fp.lon, fp.lat, p.lon, p.lat).toFixed(2), predDist: p && +Geo.dist(fp.lon, fp.lat, c.lon, c.lat).toFixed(2), land: p && Geo.isLand(fp.lon, fp.lat) };
      if (p) {
        const pos = G.AnimalTracking.position(p);
        out.flee.posIsFled = Geo.dist(pos.lon, pos.lat, fp.lon, fp.lat) < 0.01;
        s.hints[p.id] = {src:'qa',day:s.day};
        const hHome = D.checkLand(p.lon, p.lat).hits.map(d => d.id), hFled = B.hidden(p) ? [] : D.checkLand(pos.lon, pos.lat).hits.map(d => d.id);
        out.flee.hitHome = hHome.indexOf(p.id) >= 0; out.flee.hitFled = hFled.indexOf(p.id) >= 0 || B.hidden(p);
        // 육식 동물을 찾으면 돌아온다
        Object.assign(s.disc[c.id] = s.disc[c.id] || {}, { me: true, found: 15000101 }); s.stats.found++;
        out.flee.back = !B.fled(p) || B.predator(p) !== c;   // 둘레에 다른 육식 동물이 있으면 그쪽을 피한다
        delete s.disc[c.id].me; delete s.disc[c.id].found; s.stats.found--;
      }
      // ③ 식물 곁에 숨은 동물
      const hid = G.DISCOVERIES.filter(d => d.animal && d.how === 'land' && B.hidden(d));
      const h = hid[0], hp = h && B.hidingPlant(h);
      out.hide = { count: hid.length, animal: h && h.name, plant: hp && hp.name };
      if (h) {
        const hpos = B.pos(h);
        out.hide.hitBefore = D.checkLand(hpos.lon, hpos.lat).hits.some(d => d.id === h.id);
        Object.assign(s.disc[hp.id] = s.disc[hp.id] || {}, { me: true, found: 15000101 }); s.stats.found++;
        out.hide.visibleAfter = !B.hidden(h) || B.hidingPlant(h) !== hp;   // 다른 식물이 또 곁에 있으면 그 식물 때문에 숨는다
        delete s.disc[hp.id].me; delete s.disc[hp.id].found; s.stats.found--;
      }
      // ④ 단서 방향·좌표
      const yak = G.CITY_DATA.find(c => c && c.name === '야쿠츠크'), que = G.CITY_DATA.find(c => c && c.name === '퀘벡');
      const ang = (a, b) => Math.atan2(b.lat - a.lat, Geo.wrapLon(b.lon - a.lon)) * 180 / Math.PI;
      out.hint = { reindeer: Math.round(ang(yak, G.DISC.reindeer)), beaver: que ? Math.round(ang(que, G.DISC.beaver)) : null, penguinReg: G.DISC.emperorpenguin.reg,
        walrusIce: (() => { let n = 0; const w = G.DISC.walrus; for (let a = 0; a < 16; a++) for (const rr of [0.5, 1, 1.5]) if (Geo.berg(w.lon + Math.cos(a / 16 * 6.283) * rr * 2, w.lat + Math.sin(a / 16 * 6.283) * rr)) n++; return n; })() };
      // ⑦ 원주민 마을
      const V = [316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326].map(id => G.CITY_DATA[id]);
      out.vil = { n: V.filter(Boolean).length, land: V.every(c => c && Geo.isLand(c.lon, c.lat)), tribe: V.every(c => c && G.TRIBES[c.id] && /T/.test(c.flags)), exist: V.every(c => G.R.cityExists(c)),
        clues: { eora: G.Animals.local(V[0]).map(d => d.id).slice(0, 6), maori: G.Animals.local(V[2]).map(d => d.id).slice(0, 4), evenki: G.Animals.local(V[4]).map(d => d.id).slice(0, 6), omagua: G.Animals.local(V[9]).map(d => d.id).slice(0, 6) },
        fac: (() => { const f = G.R.facilities(V[0]); return { church: f.church, market: f.market, palace: f.palace }; })() };
      // ⑥ 뭍길: 빅토리아 호수 동쪽 기슭에서 서쪽 기슭(진주모나비 쪽)으로
      const LN = G.LandNav, a = [34.66, -0.37], b2 = [32.6, 0.6];
      const route = LN.path(a[0], a[1], b2[0], b2[1]);
      let allLand = !!route, prev = a; (route || []).forEach(q => { if (!LN.clear(prev, q)) allLand = false; prev = q; });
      out.nav = { straight: LN.clear(a, b2), route: route ? route.length : 0, allLand, nodes: LN.lastNodes };
      // 덤
      out.luanda = G.CITY_DATA[100].name;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.relic.noRelic.length === 0 && r.relic.n >= 96 && r.relic.allItems, '식물 ' + r.relic.plants + '종 모두 증거 아이템이 있다 (새로 ' + r.relic.n + '개)');
    ok(['treasure', 'animal', 'weapon', 'fig', 'gift', 'medicine'].every(k => r.relic.kinds[k] > 0) && r.relic.medOk, '갈래: 보석·표본/종자·지팡이·선수상·장신구/화관·약재 ' + JSON.stringify(r.relic.kinds));
    ok(Math.abs(r.fame.near - 1) < 0.1 && r.fame.far > 1.5 && r.fame.legend > r.fame.far * 0.9 && r.fame.ruin === 1, '명성 배수: 고향 곁 흔한 생물 ×' + r.fame.near.toFixed(2) + ' · 아마존 ×' + r.fame.far.toFixed(2) + ' · 먼 전설 ×' + r.fame.legend.toFixed(2) + ' · 유적은 그대로');
    ok(r.spread.n >= 30 && r.spread.applied, '몰린 동식물 ' + r.spread.n + '종을 지역 안의 뭍으로 나눴다');
    ok(r.flee.count > 0 && r.flee.land && r.flee.dist >= 1.9 && r.flee.predDist > 1.6 && r.flee.posIsFled, '육식 동물 곁의 먹잇감 ' + r.flee.count + '종이 달아나 있다 — 예: ' + r.flee.prey + '(← ' + r.flee.pred + ') ' + r.flee.dist + '° 떨어진 뭍');
    ok(!r.flee.hitHome && r.flee.hitFled && r.flee.back, '원래 자리에서는 안 보이고 달아난 자리에서 찾는다 · 육식 동물을 찾으면 돌아온다');
    ok(r.hide.count > 0 && !r.hide.hitBefore && r.hide.visibleAfter, '찾지 않은 식물 곁의 동물 ' + r.hide.count + '종이 숨는다 — 예: ' + r.hide.animal + ' (「' + r.hide.plant + '」을 찾으면 나온다)');
    ok(Math.abs(r.hint.reindeer - 90) < 45 && (r.hint.beaver == null || Math.abs(r.hint.beaver - 90) < 45) && r.hint.penguinReg === 8 && r.hint.walrusIce === 0, '단서 방향: 순록·비버가 「북쪽」에, 황제펭귄 지역, 바다코끼리 둘레에 얼음 없음');
    ok(r.vil.n === 11 && r.vil.land && r.vil.tribe && r.vil.exist && r.vil.fac.church && !r.vil.fac.palace, '원주민 마을 11곳 (뭍 · 부족 마을 건물)');
    ok(r.vil.clues.eora.length && r.vil.clues.maori.indexOf('kiwi') >= 0 && r.vil.clues.evenki.length && r.vil.clues.omagua.length, '마을에서 그 고장 동식물 단서를 듣는다 ' + JSON.stringify(r.vil.clues));
    ok(!r.nav.straight && r.nav.route > 0 && r.nav.allLand, '빅토리아 호수를 곧장 못 건너면 뭍으로 둘러 가는 길 (굽이 ' + r.nav.route + ', 칸 ' + r.nav.nodes + ')');
    ok(r.luanda === '루안다', '「르완다」→「루안다」');

    // ⑥ 실제 육상 장면: 호수 건너편을 눌러도 둘러 걸어 닿는다 · ⑨ 멈춤 감시
    const w = await page.evaluate(async () => {
      const s = G.Game.state, sleep = ms => new Promise(r => setTimeout(r, ms)), L = G.Scenes.land;
      const nam = G.CITY_DATA.find(c => c && c.name === '나망가') || G.CITY_DATA[299];
      s.loc = { mode: 'city', city: nam.id, lon: nam.lon, lat: nam.lat };
      G.Game.go('land', { from: nam.id }); await sleep(600);
      const st = L.runtime(); st.busy = 0;
      // 길찾기 이동만 검사한다. 하루 사건은 이 구간에 끼어들지 않도록 하루 누적을 충분히 뒤로 둔다.
      st.dayAcc = -10000;
      s.loc.lon = 34.66; s.loc.lat = -0.37;
      const ok1 = L.routeTo(32.6, 0.6);
      const hops = st.path && st.path.next ? st.path.next.length + 1 : 0;
      let i = 0; for (; i < 4000 && (st.path || st.busy); i++) { if (G.UI.busy()) { const b = document.querySelector('.modal-back button'); (b || document.querySelector('.modal-back')).click(); } if (!st.busy) L.update(0.3); await sleep(1); }
      const end = G.Geo.dist(s.loc.lon, s.loc.lat, 32.6, 0.6);
      // 멈춤 감시: 창 없이 busy가 남아 있으면 45초 뒤 풀린다
      st.busy = 1; const now0 = Date.now(), dn = Date.now; let t = now0; Date.now = () => t;
      L.update(0.01); t += 46000; L.update(0.01); const freed = st.busy === 0; Date.now = dn;
      st.busy = -1; L.update(0.01); const neg = st.busy;
      return { ok1, hops, end: +end.toFixed(2), steps: i, freed, neg, paused:st.paused,busy:st.busy,path:st.path,ui:G.UI.busy(),windows:[...document.querySelectorAll(".win")].map(e=>e.innerText.slice(0,200)) };
    });
    console.log('   ' + JSON.stringify(w));
    ok(w.ok1 && w.hops > 1 && w.end < 0.3, '육상 장면에서 호수 건너편을 누르면 굽이 ' + w.hops + '번으로 둘러 걸어 닿는다 (남은 거리 ' + w.end + '°)');
    ok(w.freed && w.neg === 0, '창 없이 멈춘 탐험대는 45초 뒤 풀리고, 음수 busy는 0으로');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('실패: ' + e.message); console.error(errors.join('\n')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
