// 게임 자료마다 전용 그림이 있는지(아니면 갈래 그림으로 대신하는지), 그리고 주인 없는 그림 — node coverage.js <repo> <out.json>
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const ROOT = process.argv[2], OUT = process.argv[3];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(ROOT, 'index.html')); await p.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
  const r = await p.evaluate(() => {
    const I = G.Img, K = I.chain, has = k => I.has(k), out = {};
    const GOODS = G.GOODS || Object.values(G.GOOD || {}), SHIPS = G.SHIPS || Object.keys(G.SHIP || {}).map(id => Object.assign({ id }, G.SHIP[id])), MATES = G.MATES || Object.values(G.MATE || {}), SPONS = G.SPONSORS || [];
    const keys = Object.keys(G.IMAGE_FILES);
    const miss = (list, f) => list.filter(x => !f(x));
    // 발견물
    const D = G.DISCOVERIES;
    out.disc = { n: D.length,
      noMain: miss(D, d => has('discoveries/' + d.id)).map(d => d.id + ':' + d.cat + ':' + (d.realName || d.name)),
      noSheet: miss(D, d => has('discovery-sheets/' + d.id)).length, noEnd: miss(D, d => has('discovery-ends/' + d.id)).length,
      noMap: miss(D, d => has('map-discoveries/' + d.id)).length };
    // 유물
    const RL = Object.values(G.RELIC || {});
    out.relic = { n: RL.length, noOwn: miss(RL, r => has('relics/' + r.id) || has('items/' + r.id)).map(r => r.id + ':' + r.kind + ':' + r.name) };
    // 일반 소지품
    const IT = (G.ITEMS || []).filter(it => !(G.RELIC && G.RELIC[it.id]));
    out.item = { n: IT.length, noOwn: miss(IT, it => has('items/' + it.id) || (it.kind === 'fig' && has('figureheads/' + it.id))).map(it => it.id + ':' + it.kind + ':' + it.name) };
    // 선수상
    out.fig = { n: G.FIGUREHEADS.length, noOwn: miss(G.FIGUREHEADS, f => has('figureheads/' + f.id) || has('relics/' + f.id) || has('items/' + f.id)).map(f => f.id + ':' + f.name) };
    // 교역품
    out.good = { n: GOODS.length, noOwn: miss(GOODS, g => I.pick(K.good(g)) && I.pick(K.good(g)).indexOf('good-kinds/') !== 0).map(g => g.id + ':' + g.name) };
    // 배
    out.ship = { n: SHIPS.length, noOwn: miss(SHIPS, s => has('ships/' + s.id)).map(s => s.id + ':' + s.name), noNav: miss(SHIPS, s => keys.some(k => k.indexOf('ships-nav/' + s.id) === 0)).map(s => s.id) };
    // 항해사
    const M = MATES.filter(m => !m.gen);
    out.mate = { n: M.length, noOwn: miss(M, m => has('portraits/mates/' + m.id) || (m.pic && has(m.pic)) || (m.portrait && has(m.portrait))).map(m => m.id + ':' + m.name) };
    // 후원자
    out.sponsor = { n: SPONS.length, noOwn: miss(SPONS, sp => has('portraits/sponsors/' + sp.id) || keys.some(k => k.indexOf('portraits/sponsors/' + sp.id + '_') === 0)).map(sp => sp.id + ':' + sp.title) };
    // 여급
    const MA = Object.values(G.MAID || {});
    out.maid = { n: MA.length, noOwn: miss(MA, m => { const k = I.pick(K.maid(m.id)); return k && k.indexOf('maid-styles/') !== 0; }).map(m => m.id + ':' + m.name).slice(0, 400) };
    // 도시 배경
    out.city = { n: G.CITY_DATA.length, noBg: miss(G.CITY_DATA, c => has('backgrounds/' + c.id)).map(c => c.id + ':' + c.name) };
    // 주인 없는 그림: 이름이 id인 폴더에서 자료에 없는 id
    const ids = { discoveries: new Set(D.map(d => d.id)), 'discovery-sheets': new Set(D.map(d => d.id)), 'discovery-ends': new Set(D.map(d => d.id)), 'map-discoveries': new Set(D.map(d => d.id)),
      relics: new Set(RL.map(r => r.id)), items: new Set((G.ITEMS || []).map(i => i.id)), figureheads: new Set(G.FIGUREHEADS.map(f => f.id)), goods: new Set(GOODS.map(g => g.id)),
      ships: new Set(SHIPS.map(s => s.id)), 'portraits/mates': new Set(MATES.map(m => m.id)), backgrounds: new Set(G.CITY_DATA.map(c => String(c.id))) };
    out.orphan = {};
    Object.keys(ids).forEach(dir => {
      out.orphan[dir] = keys.filter(k => k.indexOf(dir + '/') === 0).map(k => k.slice(dir.length + 1)).filter(rest => rest.indexOf('/') < 0 && !ids[dir].has(rest.replace(/_half$/, '').replace(/_(\d+|alt|v\d+)$/, '')));
    });
    return out;
  });
  r.errors = errs;
  fs.writeFileSync(OUT, JSON.stringify(r, null, 1));
  const sum = {}; for (const k in r) if (r[k] && r[k].n != null) sum[k] = Object.fromEntries(Object.entries(r[k]).map(([a, v]) => [a, Array.isArray(v) ? v.length : v]));
  console.log(JSON.stringify(sum)); console.log('orphan', JSON.stringify(Object.fromEntries(Object.entries(r.orphan).map(([a, v]) => [a, v.length]))));
  await b.close();
})();
