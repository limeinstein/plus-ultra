/* 발견물 1,233종 — 1600·1650·1699년에 실제 찾는 함수로 찾을 수 있는가 (node reach.js [save.json])
   단서는 넣어 두고(없이 찾는 확률은 따로), 찾는 함수(D.checkSea·checkLand·checkCity·cityBuildings·checkPerson·checkTrade·특수)를 그 자리에서 부른다.
   need(사슬)는 앞 고리를 찾은 것으로 쌓아 가며 여러 번 돈다. 결과: reach.json */
const path = require('path'); const fs = require('fs'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../..'), SAVE = process.argv[2], OUT = process.argv[3] || path.join(require('os').tmpdir(), 'reach.json');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE, args: ['--allow-file-access-from-files', '--js-flags=--max-old-space-size=4096'] });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/^https?:\/\//, r => r.fulfill({ status: 204, body: '' }));
  if (SAVE) await p.addInitScript('window.__START=' + JSON.stringify(fs.readFileSync(SAVE, 'utf8')));
  await p.goto('file://' + path.join(ROOT, 'index.html')); await p.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
  const res = await p.evaluate(async () => {
    await G.Game.ensureGeo(); G.UI.fade = async fn => { fn && fn(); };
    const U = G.U, D = G.Disc, R = G.R, Geo = G.Geo;
    const out = { years: {} };
    function fresh(y) {
      if (window.__START) G.Game.state = G.State.deserialize(window.__START);
      else G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y, m: 6, d: 15 }; s.player.born = { y: y - 30, m: 3, d: 3 }; s.flags.prologue = true;
      s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat };
      return s;
    }
    function coastDist(lon, lat, wantLand) {   // 가장 가까운 바다(또는 뭍) 칸까지 (°)
      if (Geo.isLand(lon, lat) === wantLand) return 0;
      for (let rr = 0.1; rr <= 40; rr += rr < 2 ? 0.1 : rr < 10 ? 0.5 : 1) {
        for (let a = 0; a < 32; a++) { const an = a / 32 * Math.PI * 2, x = lon + Math.cos(an) * rr / Math.max(0.2, Math.cos(lat * Math.PI / 180)), yy = lat + Math.sin(an) * rr; if (Math.abs(yy) < 85 && Geo.isLand(x, yy) === wantLand) return +rr.toFixed(1); }
      }
      return 99;
    }
    function tryFind(fn, d, s) {   // 하루 한 개 제한을 풀며 같은 자리에서 여러 번 — 다른 발견이 먼저 나오면 잠깐 찾은 것으로
      const temp = [];
      for (let k = 0; k < 12; k++) {
        s.discDay = null;
        let hits = fn() || []; if (!Array.isArray(hits)) hits = hits.hits || [];
        if (hits.some(x => x && x.id === d.id)) { temp.forEach(id => delete s.disc[id]); return true; }
        const o = hits[0]; if (!o) break;
        temp.push(o.id); s.disc[o.id] = { found: true, me: true, d: U.dateNum(s.date), qa: 1 };
      }
      temp.forEach(id => delete s.disc[id]);
      return false;
    }
    for (const Y of [1600, 1650, 1699]) {
      const s = fresh(Y);
      // 개척 단계 끝까지 (단서를 들을 수 있는가는 따로 본다)
      const fr = {}; try { (G.FRONTIER || []).forEach((f, i) => { const o = G.Frontier.state(i); if (o) { fr[i] = { lv: o.lv, t2: o.t2, t3: o.t3 }; } }); } catch (e) { /* 없음 */ }
      const rec = {}; const done = new Set();
      for (let pass = 0; pass < 8; pass++) {
        let prog = 0;
        for (const d of G.DISCOVERIES) {
          if (done.has(d.id)) continue;
          const r = rec[d.id] = { how: d.how, cat: d.cat };
          if (D.foundByMe(d.id) && !(s.disc[d.id] || {}).qa) { r.st = 'already'; done.add(d.id); continue; }
          if (d.tale) { r.st = 'story-only'; done.add(d.id); continue; }
          if (!D.needMet(d)) { r.st = 'need:' + d.need.filter(id => !D.foundByMe(id)).join(','); continue; }
          if (!D.opened(d)) { r.st = 'not-open(' + d.openY + ')'; done.add(d.id); continue; }
          if (!D.built(d)) { r.st = d.goneY && Y >= d.goneY ? 'gone(' + d.goneY + ')' : 'not-built(' + (d.built || d.mirageFrom || d.openY) + ')'; done.add(d.id); continue; }
          s.hints[d.id] = s.hints[d.id] || { src: 'qa', d: U.dateNum(s.date) };
          let ok = false, why = '';
          try {
            if (d.how === 'sea' && G.SeaMonsters && G.SeaMonsters.is(d.id)) { r.st = 'monster'; const ps = G.SeaMonsters.position(d.id); r.spot = ps ? [+ps.lon.toFixed(1), +ps.lat.toFixed(1)] : null; if (!ps) { r.st = 'FAIL:monster-no-spawn'; } done.add(d.id); continue; }
            if (d.fish || (G.FISH_EXTRA || {})[d.id]) { const f = d.fish || G.FISH_EXTRA[d.id]; r.st = 'fishing'; r.f = JSON.stringify(f).slice(0, 120); done.add(d.id); continue; }
            if (d.how === 'sea') {
              r.sea = coastDist(d.lon, d.lat, false);
              ok = tryFind(() => D.checkSea(d.lon, d.lat, { search: true }), d, s);
              if (!ok && r.sea > 0) { // 가장 가까운 바다 칸에서도
                why = 'land-point';
              }
            } else if (d.how === 'land') {
              r.coast = coastDist(d.lon, d.lat, false);   // 배를 대는 바다에서 얼마나 깊은가
              r.onLand = Geo.isLand(d.lon, d.lat);
              if (!r.onLand) r.landNear = coastDist(d.lon, d.lat, true);
              ok = tryFind(() => D.checkLand(d.lon, d.lat, { search: true }), d, s);
            } else if (d.how === 'city') {
              const c = G.CITY_DATA[d.city];
              if (!c) { why = 'no-city'; }
              else {
                r.city = c.name; r.exists = R.cityExists(c); r.port = !!c.port;
                if (!r.exists) why = 'city-not-exist(' + (c.founded || '') + (c.until ? '~' + c.until : '') + ')';
                else {
                  s.portVisit = (s.portVisit || 0) + 1; s.mirageVisit = { v: s.portVisit, c: {} }; s.mirageVisit.c[d.city] = 1;
                  if (D.isBuilding(d)) ok = D.cityBuildings(d.city).some(x => x.id === d.id), why = ok ? '' : 'building-not-listed';
                  else if (d.by && D.artistAround(d)) { ok = D.checkPerson(d.by).some(x => x.id === d.id); why = ok ? '' : 'artist(' + d.by + ')-no'; r.via = 'artist'; }
                  else { ok = D.checkCity(d.city).some(x => x.id === d.id); why = ok ? '' : 'checkCity-no'; }
                  try { const blk = G.Scenes.city.entryCheck(c); if (blk) r.entry = (blk.reason || blk.text || 'blocked').toString().slice(0, 60) + (blk.bribe ? ' (뇌물)' : ''); } catch (e) { /* 없음 */ }
                }
              }
            } else if (d.how === 'trade') {
              const cs = G.CITY_DATA.filter(c => d.regions.indexOf(c.region) >= 0 && R.cityExists(c));
              const sell = cs.filter(c => (c.goods || []).indexOf(d.good) >= 0);
              r.sellers = sell.length; r.good = !!(G.GOOD && G.GOOD[d.good]);
              ok = cs.some(c => D.checkTrade(d.good, c).some(x => x.id === d.id));
              if (ok && !sell.length) why = 'no-seller';
              if (!ok) why = D.taken(d.id) ? 'taken' : 'checkTrade-no';
            } else if (d.how === 'special') {
              const SP = { capegood: [20, -35], westroute: [-75, 20, 'fromEurope'], indiaroute: [75, 12, 'viaCape'], antarctic: [0, -66], antpeople: [-60, -64], albatross: [40, -45], coelacanth: [43.3, -11.7], aurora: [5, 66], mu: [-170, -5] };
              const sp = SP[d.id];
              if (d.id === 'circum') { r.st = 'circum'; done.add(d.id); continue; }
              if (!sp) { why = 'special-unknown'; }
              else {
                if (sp[2]) s.flags[sp[2]] = true; if (d.id === 'mu') s.hints.mu = s.hints.mu || { src: 'qa' };
                if (d.id === 'aurora') s.date.m = 12;
                ok = false; for (let k = 0; k < 400 && !ok; k++) ok = tryFind(() => D.checkSea(sp[0], sp[1], { search: true }), d, s);
                s.date.m = 6;
              }
            }
          } catch (e) { why = 'err:' + e.message; }
          if (ok) { r.st = 'ok'; s.disc[d.id] = { found: true, me: true, d: U.dateNum(s.date), qa: 1 }; done.add(d.id); prog++; }
          else { r.st = 'FAIL:' + (why || 'no-hit'); done.add(d.id); }
          // 단서를 얻을 수 있는가 (개척 단계·경쟁자) — 지금 상태 그대로
          try { r.avail = D.available(d); r.taken = D.taken(d.id); } catch (e) { /* 없음 */ }
        }
        if (!prog) break;
      }
      const sum = {}; Object.values(rec).forEach(r => { const k = (r.st || '?').replace(/[:(].*/, ''); sum[k] = (sum[k] || 0) + 1; });
      out.years[Y] = { sum, rec };
    }
    return out;
  });
  res.errors = errs;
  fs.writeFileSync(OUT, JSON.stringify(res));
  for (const y in res.years) console.log(y, JSON.stringify(res.years[y].sum));
  console.log('errors', errs.length, errs.slice(0, 5));
  await b.close();
})();
