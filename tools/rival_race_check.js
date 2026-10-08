/* 경쟁 탐험가 발견 경쟁의 밸런스 점검 — 제독 한 사람이 모든 경쟁자를 앞질러 발견하고 알릴 수 있는가.
   게임 자료(d.rival이 있는 모든 발견물)를 읽어, 리스본에서 처음 받는 배(평균 선속)로 출발해
   「찾을 수 있게 된 때(단서가 열리는 때) ~ 경쟁자가 발표하는 달 1일」 안에 그곳에 가서 찾고 가장 가까운 항구에서 발표하는 순서를 빔 탐색으로 찾는다.
   · 새로 경쟁하는 발견(js/data/rivals.js G.RIVAL_PLAN)은 발표 LEAD달 전에 단서가 열린다. 원래 있던 경쟁 발견은 48달 전(관문 단계가 열리는 때)으로 본다.
   · 뱃길 길이 ÷ 선속 × MARGIN(바람·보급·돌아가는 길) + 항구마다 5일. 뭍 탐험은 해안에서 왕복(0.3°/일), 교역품은 산지 항구에서 사흘.
   · 세계일주(circum)는 따로 한 바퀴를 돌아야 해서 셈에서 뺀다.
   node tools/rival_race_check.js [LEAD=12] [MARGIN=1.5] [BEAM=400]   (playwright, 몇 분 걸린다) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const LEAD = +(process.argv[2] || 12), MARG = +(process.argv[3] || 1.5), BEAM = +(process.argv[4] || 400);

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
  const D = await page.evaluate(async () => {
    await G.Game.ensureGeo();
    const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
    G.Game.state = G.State.newGame({ name: '점검', nation: 'PT', job: 'adventurer', age: 20, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
    const v = G.Plan.avgSpeed();
    // 교역품은 산지의 대표 항구에서 산다
    const TR = { t_tobacco: [20, -75], t_maize: [20, -75], t_pepper: [11.2, 75.7], t_clove: [0.8, 127.3], t_cinnamon: [6.9, 79.8], t_cacao: [16, -86], t_potato: [-12, -77.2], t_tea: [22.5, 113.5] };
    const ports = G.CITY_DATA.filter(c => c.port);
    function goal(d) {
      if (TR[d.id]) return { sea: [TR[d.id][1], TR[d.id][0]], ex: 3 };
      let g = G.Plan.goalPoint(d);
      const bad = !g || (d.how === 'city' && !G.CITY_DATA[d.city].port && !G.CITY_DATA[d.city].dock);
      if (bad) { const ns = G.Nav.nearestSea(d.lon, d.lat, 30); if (!ns) return null; g = { sea: ns, land: G.Geo.dist(ns[0], ns[1], d.lon, d.lat) }; return { sea: g.sea, ex: Math.ceil(g.land * 2 / 0.3) + 3 }; }
      return { sea: g.sea, ex: d.how === 'land' ? Math.ceil(g.land * 2 / 0.3) + 3 : d.how === 'city' ? (g.land ? Math.ceil(g.land * 2 / 0.3) + 1 : 1) : 2 };
    }
    function len(a, b) { const p = G.Nav.path(a[0], a[1], b[0], b[1], 400000); if (!p) return null; let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(G.Geo.wrapLon(p[i][0] - p[i - 1][0]), p[i][1] - p[i - 1][1]); return L; }
    const T = G.DISCOVERIES.filter(d => d.rival && d.id !== 'circum').map(d => {
      const g = goal(d); if (!g) return { id: d.id, err: true };
      let best = null, bd = 1e9; ports.forEach(c => { const dk = c.dock || [c.lat, c.lon], x = G.Geo.dist(dk[1], dk[0], g.sea[0], g.sea[1]); if (x < bd) { bd = x; best = c; } });
      const dk = best.dock || [best.lat, best.lon];
      return { id: d.id, name: d.name, who: d.rival[2], y: d.rival[0], m: d.rival[1], isNew: !!(G.RIVAL_PLAN && G.RIVAL_PLAN[d.id]), sea: g.sea, ex: g.ex, port: best.name, portPt: [dk[1], dk[0]], back: len(g.sea, [dk[1], dk[0]]) || 0 };
    }).filter(x => !x.err);
    const lis = G.CITY_DATA[0], start = [(lis.dock || [lis.lat, lis.lon])[1], (lis.dock || [lis.lat, lis.lon])[0]];
    const M = {}; const froms = { start }; T.forEach(t => { froms[t.id] = t.portPt; });
    Object.keys(froms).forEach(a => { M[a] = {}; T.forEach(t => { M[a][t.id] = a === t.id ? len(t.portPt, t.sea) : len(froms[a], t.sea); }); });
    return { v, T, M };
  });
  await browser.close();

  const base = Date.UTC(1480, 4, 1);
  const day = (y, m) => Math.round((Date.UTC(y, m - 1, 1) - base) / 864e5);
  const ymd = n => new Date(base + n * 864e5).toISOString().slice(0, 10);
  const tg = D.T.map(t => ({ ...t, dl: day(t.y, t.m), op: Math.max(0, day(t.y, t.m - (t.isNew ? LEAD : 48))) }));
  const leg = (a, k) => (D.M[a][k] || 0) / D.v * MARG;
  let beam = [{ n: 0, done: new Set(), pos: 'start', t: 0, hist: [] }];
  for (let step = 0; step < tg.length; step++) {
    const nb = [];
    beam.forEach(st => {
      let ext = false;
      tg.forEach(x => {
        if (st.done.has(x.id)) return;
        const go = Math.max(st.t + leg(st.pos, x.id), x.op), fin = go + x.ex + x.back / D.v * MARG + 5;
        if (fin <= x.dl) { const done = new Set(st.done); done.add(x.id); nb.push({ n: st.n + 1, done, pos: x.id, t: fin, hist: st.hist.concat([[x.id, go, fin]]) }); ext = true; }
      });
      if (!ext) nb.push(st);
    });
    nb.sort((a, b) => b.n - a.n || a.t - b.t);
    const seen = new Set(); beam = [];
    for (const s of nb) { const key = [...s.done].sort().join(',') + '@' + s.pos; if (seen.has(key)) continue; seen.add(key); beam.push(s); if (beam.length >= BEAM) break; }
  }
  const best = beam.reduce((a, b) => (b.n > a.n || (b.n === a.n && b.t < a.t)) ? b : a);
  console.log('평균 선속 ' + D.v.toFixed(2) + '°/일 · LEAD ' + LEAD + '달 · 여유 ×' + MARG + ' → 앞지른 곳 ' + best.n + ' / ' + tg.length);
  const by = {}; tg.forEach(t => { by[t.id] = t; });
  best.hist.forEach(([id, go, fin]) => { const x = by[id]; console.log('  ' + ymd(fin) + ' ' + x.name + ' (' + x.who + ' ' + ymd(x.dl) + ') 출발 ' + ymd(go) + ' · 여유 ' + Math.round(x.dl - fin) + '일 · 발표 ' + x.port); });
  const miss = tg.filter(t => !best.done.has(t.id));
  console.log(miss.length ? '못 앞지른 곳: ' + miss.map(t => t.name + '(' + t.who + ' ' + ymd(t.dl) + ')').join(', ') : '모두 앞지를 수 있다');
})();
