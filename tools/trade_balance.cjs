/* 실제 가격·재고·포화 규칙으로 1년 교역을 비교한다. 항해는 아래 바닷길과 고정 평균 선속으로 추정한다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
function world(before) {
  const ctx = vm.createContext({ window: {}, console, setTimeout });
  for (const file of ['js/core/util.js', 'js/data/base.js', 'js/data/cities.js', 'js/data/tradegoods.js', 'js/core/rules.js', 'js/data/eratrade.js', 'js/data/tradefleets.js', 'js/systems/era.js', 'js/systems/sakoku.js', 'js/systems/tradefleets.js', 'js/systems/cargo.js']) {
    const source = before && file === 'js/data/eratrade.js' ? cp.execFileSync('git', ['show', 'HEAD:' + file], { cwd: ROOT, encoding: 'utf8' }) : fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(source, ctx, { filename: file });
  }
  const G = ctx.window.G;
  G.State = { log: function () {} };
  G.Game = { state: { date: { y: 1650, m: 1, d: 1 }, day: 0, player: { nation: 'PT' }, fleet: { cargo: {} }, market: {}, invest: {}, owners: {}, tfleet: { open: Object.fromEntries(G.TRADE_ROUTES.map(r => [r.id, -3650])), told: {} } } };
  if (before) { G.BALANCE.oceanTrade = null; G.Era.source = () => 1; G.Sakoku = null; }
  return G;
}
const routes = [
  ['리스본', '카사블랑카', []],
  ['리스본', '아바나', [[-20, 25], [-60, 18]]],
  ['리스본', '페르남부쿠', [[-20, 20], [-30, 0]]],
  ['리스본', '캘리컷', [[-20, 20], [-20, -10], [18, -35], [45, -15], [70, 5]]],
  ['리스본', '고아', [[-20, 20], [-20, -10], [18, -35], [45, -15], [70, 5]]],
  ['런던', '고아', [[-10, 45], [-20, 20], [-20, -10], [18, -35], [45, -15], [70, 5]]],
  ['리스본', '디우', [[-20, 20], [-20, -10], [18, -35], [45, -15], [65, 15]]],
  ['런던', '디우', [[-10, 45], [-20, 20], [-20, -10], [18, -35], [45, -15], [65, 15]]],
  ['리스본', '아덴', [[-20, 20], [-20, -10], [18, -35], [45, -15], [53, 12]]],
  ['리스본', '말라카', [[-20, 20], [-20, -10], [18, -35], [45, -15], [80, 5], [95, 5]]],
  ['리스본', '광주', [[-20, 20], [-20, -10], [18, -35], [45, -15], [80, 5], [102, 2], [110, 15]]],
  ['런던', '광주', [[-10, 45], [-20, 20], [-20, -10], [18, -35], [45, -15], [80, 5], [102, 2], [110, 15]]],
  ['광주', '나가사키', [[122, 25]]], ['고아', '말라카', [[80, 5], [95, 5]]]
];
function distance(a, b) {
  const rad = Math.PI / 180, p = (a[1] - b[1]) * rad, l = (a[0] - b[0]) * rad;
  return 2 * Math.asin(Math.min(1, Math.sqrt(Math.sin(p / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(l / 2) ** 2))) / rad;
}
function compare(G, year) {
  const s = G.Game.state; s.date.y = year;
  return routes.map(([an, bn, way]) => {
    const a = G.CITY_DATA.find(c => c.name === an), b = G.CITY_DATA.find(c => c.name === bn);
    if (!a || !b) throw new Error('도시 이름 확인: ' + an + ' / ' + bn);
    if (G.Sakoku && (G.Sakoku.entryBlock(a) || G.Sakoku.entryBlock(b))) return { route: an + '–' + bn, closed: true, net: 0 };
    const points = [[a.lon, a.lat], ...way, [b.lon, b.lat]], days = Math.ceil(points.slice(1).reduce((n, p, i) => n + distance(points[i], p), 0) / 1.4) + 4;
    s.day = 0; s.market = {};
    const legs = [], crew = 100, capacity = 500, dailyCost = crew * G.BALANCE.crewWage.per / 30 + 15;
    let net = 0, t = 0, trips = 0;
    while (t + days <= 365) {
      const from = trips % 2 ? b : a, to = trips % 2 ? a : b;
      s.day = t;
      const goods = G.R.cityGoods(from).filter(id => G.GOOD[id]);
      const choices = goods.map(id => ({ id, margin: G.R.sellPrice(to, id) - G.R.buyPrice(from, id) })).sort((p, q) => q.margin - p.margin);
      let room = capacity, weight = capacity * G.BALANCE.cargo.shipWt, spent = 0; const lots = [];
      for (const choice of choices) {
        if (choice.margin <= 0 || !room) continue;
        const q = Math.min(room, G.R.supply(from, choice.id), Math.floor(weight / G.Cargo.wt(choice.id)));
        if (!q) continue;
        const price = G.R.buyPrice(from, choice.id); spent += q * price;
        G.R.onBuy(from, choice.id, q); lots.push({ id: choice.id, q }); room -= q; weight -= q * G.Cargo.wt(choice.id);
      }
      t += days; s.day = t;
      let got = 0;
      for (const lot of lots) for (let q = 0; q < lot.q; q++) { got += Math.round(G.R.sellPrice(to, lot.id) * G.Cargo.fresh(lot.id, { d: t - days })); G.R.onSell(to, lot.id, 1); }
      net += got - spent - days * dailyCost; trips++;
      legs.push({ from: from.name, goods: lots.map(l => G.GOOD[l.id].name).join('·') });
    }
    return { route: an + '–' + bn, days, trips, net: Math.round(net), goods: legs.slice(0, 2) };
  }).sort((a, b) => b.net - a.net);
}
function report() {
  const out = { assumptions: '포르투갈 제독·365일·교역용 여유 짐칸 500통과 무게 650(보급 별도)·선원 100명·평균 1.4도/일·항해 급료와 하루 보급 15닢 공제. 실제 재고/포화/시대 가격/중계 가격/무게/신선도 사용. 항로 상선대는 모두 최대(32함대)로 통일. 매입 자금은 충분하다고 가정. 계절풍·위험·흥정·미매각 짐·배값·교역 경험·유행/경제 사건은 제외. 연도는 고정해 시장을 비교한다. 실시간 자동 플레이의 확정 수익이 아니다.', before: {}, after: {} };
  for (const before of [true, false]) { const G = world(before); for (const y of [1600, 1650, 1699]) out[before ? 'before' : 'after'][y] = compare(G, y); }
  return out;
}
if (require.main === module) {
  const out = report(), dir = path.join(ROOT, 'artifacts/gameplay-balance-20261101'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'trade-comparison.json'), JSON.stringify(out, null, 2));
  for (const mode of ['before', 'after']) for (const y of [1600, 1650, 1699]) console.log(mode, y, JSON.stringify(out[mode][y].slice(0, 4)));
}
module.exports = { world, compare, report };
