/* 교역 항로의 상선대 (js/systems/tradefleets.js · js/data/tradefleets.js)
   · 인도·향료·서회·신세계(태평양)·말라카·중국·일본 항로: 발견이 알려지면 열린다
   · 2함대(1~2년) → 4 → 8 → 16 → 32함대(10년째부터 멈춤), 늘 때마다 소식
   · 경제: 받는 쪽(유럽) 후추 값↓·재고↑, 나는 쪽(인도) 후추 값↑, 값으로 치르는 모직물은 인도에서 값↓
   · 옛 저장: 이미 알려진 항로는 발견한 날부터 세고, 지난 소식은 다시 띄우지 않는다
   · 바다: 뱃길 가까이에서 상선대를 더 만나고, 신호를 보내면 그 항로 이야기 · 수첩·교역소 꼬리표
   node tests/tradefleets_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.TradeFleet && G.R, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const TF = G.TradeFleet, R = G.R, s = G.Game.state, out = {};
      const RT = G.TRADE_ROUTES;
      out.routes = RT.map(x => x.id).join(',');
      out.badData = [];
      RT.forEach(x => { if (!G.DISC[x.disc]) out.badData.push('disc ' + x.disc); x.goods.concat(x.back).forEach(g => { if (!G.GOOD[g]) out.badData.push(x.id + ' ' + g); }); });
      const by = n => G.CITY_DATA.find(c => c && c.name === n);
      const lis = by('리스본'), cal = G.CITY_DATA.find(c => c && c.region === 5 && c.port && R.sells(c, 'pepper'));
      out.cal = cal && cal.name;
      const base = { lisSell: R.sellPrice(lis, 'pepper'), lisStock: R.supply(lis, 'pepper'), calBuy: R.buyPrice(cal, 'pepper'), calWool: R.sellPrice(cal, 'woolcloth') };
      out.closed = TF.fleets('india') === 0 && TF.mult(lis, 'pepper', 'sell') === 1 && !TF.daily().length;
      // 1) 인도항로가 알려진다 (경쟁자 발표)
      s.disc.indiaroute = { rival: '바스코 다 가마', found: G.U.dateNum(s.date) };
      const n0 = TF.daily();
      out.openNews = n0.map(x => x.text).join(' | ');
      const seq = [], news = [];
      const day0 = s.day;
      for (let y = 0; y <= 12; y++) { s.day = day0 + y * 365 + 1; news.push(...TF.daily().map(x => x.text)); seq.push(TF.fleets('india')); }
      out.seq = seq.join(',');
      out.news = news.length; out.fullNews = news.some(t => /32함대/.test(t) && /더는 늘지 않는다/.test(t));
      // 2) 경제 (32함대)
      const now = { lisSell: R.sellPrice(lis, 'pepper'), lisStock: R.supply(lis, 'pepper'), calBuy: R.buyPrice(cal, 'pepper'), calWool: R.sellPrice(cal, 'woolcloth') };
      out.base = base; out.now = now;
      out.multLis = TF.mult(lis, 'pepper', 'sell'); out.multCal = TF.mult(cal, 'pepper', 'buy'); out.multWool = TF.mult(cal, 'woolcloth', 'sell');
      out.tag = TF.tag(lis, 'pepper');
      out.box = TF.box();
      // 4함대일 때는 그보다 약하다
      s.day = day0 + 2 * 365 + 1; out.mult4 = TF.mult(lis, 'pepper', 'sell');
      // 3) 옛 저장: 8년 전에 알려진 서회항로 → 32함대, 소식은 없다
      delete s.tfleet; s.day = day0 + 4000;
      const old = { y: s.date.y - 8, m: s.date.m, d: 1 };
      s.disc.westroute = { rival: '콜론', found: old.y * 10000 + old.m * 100 + 1 };
      out.oldWest = TF.fleets('west') + '/' + (TF.state() && TF.fleets('west'));
      out.oldNews = TF.daily().filter(x => /서회/.test(x.text)).length;
      // 4) 바다: 희망봉 앞바다 = 인도 항로의 뱃길
      const lane = TF.laneAt(18, -36), far = TF.laneAt(-40, 60);
      out.lane = (lane && lane.id) + '/' + (far && far.id);
      out.seaK = TF.seaChance(18, -36);
      const npc = { kind: 'merchant', lon: 18, lat: -36 };
      TF.decorate(npc);
      out.npcRoute = npc.route; out.greet = G.SeaFolk.greet(npc) || '';
      return out;
    });
    ok(r.routes === 'india,spice,west,pacific,malacca,china,japan' && !r.badData.length, '항로 7개 · 발견·물건 자료 이상 없음 ' + r.badData.join(' '));
    ok(r.closed, '발견이 알려지기 전에는 상선대도 값 변화도 없다');
    ok(/인도 항로가 열렸다/.test(r.openNews) && /2함대/.test(r.openNews), '인도항로가 알려지자 열림 소식: ' + r.openNews.slice(0, 90));
    ok(r.seq === '2,2,4,4,8,8,16,16,32,32,32,32,32', '함대 수 (해마다): ' + r.seq);
    ok(r.news === 4 && r.fullNews, '늘 때마다 소식 4번, 32함대에서 「더는 늘지 않는다」');
    ok(r.now.lisSell < r.base.lisSell && r.now.lisStock > r.base.lisStock, '리스본 후추: 파는 값 ' + r.base.lisSell + ' → ' + r.now.lisSell + ' · 재고 ' + r.base.lisStock + ' → ' + r.now.lisStock);
    ok(r.now.calBuy > r.base.calBuy, r.cal + ' 후추 사는 값 ' + r.base.calBuy + ' → ' + r.now.calBuy + ' (상선대가 사 간다)');
    ok(r.now.calWool < r.base.calWool, r.cal + ' 모직물 파는 값 ' + r.base.calWool + ' → ' + r.now.calWool + ' (값으로 치르는 물건이 흔해짐)');
    ok(r.mult4 > r.multLis && r.mult4 < 1, '4함대(×' + r.mult4.toFixed(3) + ')는 32함대(×' + r.multLis.toFixed(3) + ')보다 약하다');
    ok(/항로 ▼/.test(r.tag) && /인도 항로/.test(r.box) && /32함대/.test(r.box), '교역소 꼬리표 「항로 ▼」 · 수첩에 인도 항로 32함대');
    ok(r.oldWest === '32/32' && r.oldNews === 0, '옛 저장: 8년 전 알려진 서회항로는 바로 32함대, 지난 소식은 다시 띄우지 않음');
    ok(r.lane === 'india/null' && r.seaK > 0 && r.npcRoute === 'india' && /인도 항로/.test(r.greet), '희망봉 앞바다는 인도 항로 뱃길 — 상선을 더 만나고 신호에 「' + r.greet.slice(0, 40) + '…」');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
