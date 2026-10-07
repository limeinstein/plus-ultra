/* 모조품 점검 (js/systems/fakes.js)
   - 발견물 가까운 도시 시장에 「모조품 상인」, 값 = 가치 × 12%
   - 못 찾은 채 모조품만으로 계약 보고 → 안 들키면 사례금, 발견물은 그대로 못 찾은 상태
   - 같은 것을 다른 후원자에게 또 팔면(이중 계약) 먼저 보고받은 후원자가 추격자를 보낸다 → 바다에 한 번 나타난다
   - 들키면 벌금 또는 옥살이(날이 흐르고 한 해 동안 못 만남)
   - 진짜와 모조품을 함께 바치면 사례금 ×1.3·신뢰 더
   - 상인은 달마다 7일에만, 중도시 이상에만 나오고, 한 번 나올 때 2개만 판다
   node tests/fakes_smoke.js */
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
    const r = await page.evaluate(async () => {
      const s = G.Game.state, F = G.Fakes, SP = G.Sponsor, UI = G.UI, U = G.U, out = {};
      let answers = [];
      UI.say = async () => {}; UI.alert = async () => {}; UI.fade = async (fn) => { fn && fn(); };
      UI.ask = async (t, opts) => { const a = answers.shift(); return a === undefined ? null : a; };
      SP.shareWithMates = async () => {}; if (G.Names) G.Names.onReport = async () => {};
      const city = G.Scenes.city.city();
      s.date = { y: 1500, m: 3, d: 7 };
      // 리스본에서 12° 안의, 아직 못 찾은 모조품감 하나
      const d = G.DISCOVERIES.filter(x => F.fakeable(x) && x.how !== 'city' && !G.Disc.foundByMe(x.id) && G.Geo.dist(city.lon, city.lat, x.lon, x.lat) < 12 && G.Disc.built(x))[0];
      out.d = d.id;
      s.hints[d.id] = 'test';
      out.forSale = F.forSale(city).some(x => x.id === d.id);
      out.price = F.price(d);
      G.Scenes.city.visit && 0;
      out.menu = G.Scenes.city.B.market.menu(city).some(it => it.label === '모조품 상인');
      // 7일에만 · 중도시 이상 · 한 번에 2개
      const mk = G.Scenes.city.B.market;
      s.date = { y: 1500, m: 3, d: 8 };
      out.day8 = F.open(city) || mk.menu(city).some(it => it.label === '모조품 상인');
      s.date = { y: 1500, m: 3, d: 7 };
      const small = G.CITY_DATA.filter(c => G.CityIcon.tier(c) === 1)[0], mid = G.CITY_DATA.filter(c => G.CityIcon.tier(c) === 2)[0];
      out.small = F.open(small); out.mid = F.open(mid); out.smallName = small.name; out.midName = mid.name;
      G.DISCOVERIES.filter(x => F.fakeable(x) && !G.Disc.foundByMe(x.id) && G.Disc.built(x) && G.Geo.dist(city.lon, city.lat, x.lon, x.lat) < 12).slice(0, 6).forEach(x => { s.hints[x.id] = s.hints[x.id] || 'test'; });
      out.cands = F.forSale(city).length; out.stock = F.stock(city).length;
      const uch = UI.choose, gold0 = s.player.gold; s.player.gold = 1e7;
      UI.choose = async () => 0;
      const have0 = F.list().length;
      await F.buy(city);
      out.bought = F.list().length - have0; out.left = F.left(city);
      const it = mk.menu(city).filter(it => it.label === '모조품 상인')[0]; out.soldSub = it && it.sub;
      s.date = { y: 1500, m: 4, d: 7 }; out.nextMonth = F.left(city);
      UI.choose = uch; s.player.gold = gold0; F.list().forEach(x => F.give(x.id, -F.count(x.id)));
      s.date = { y: 1500, m: 3, d: 7 };
      // 1) 계약 → 못 찾은 채 모조품만 → 안 들킴
      const king = G.SPONSOR.pt_king, merch = G.SPONSOR.pt_marchionni;
      F.give(d.id, 1);
      s.contract = { sponsor: king.id, disc: d.id, reward: 10000, due: U.dateNum(U.addDays(s.date, 200)) };
      const g0 = s.player.gold; F.detectP = () => 0;
      answers = ['fake'];
      await SP.report(king);
      out.paid1 = s.player.gold - g0; out.found1 = G.Disc.foundByMe(d.id); out.fakeTo = (s.disc[d.id] || {}).fakeTo; out.contract1 = s.contract;
      // 2) 같은 것을 다른 후원자에게 모조품으로 또 판다 → 이중 계약 → 추격자
      F.give(d.id, 1); answers = ['fake'];
      const g1 = s.player.gold;
      await SP.lateReport(merch, d, 1);
      out.paid2 = s.player.gold - g1; out.chaser = s.chaser && s.chaser.sp;
      s.date = U.addDays(s.date, 10);
      const uc = U.chance; U.chance = () => true;
      s.loc.lon = -12; s.loc.lat = 38;          // 리스본 앞바다
      const n = F.spawnChaser([]);
      out.chaserNpc = n && n.chaser; out.chaserLabel = n && n.label;
      if (n) F.chaserMet(n); out.chaserAfter = s.chaser;
      U.chance = uc;
      // 3) 들킴 → 옥살이 (군주, 체포 확률 100%)
      const d2 = G.DISCOVERIES.filter(x => F.fakeable(x) && x.id !== d.id && !G.Disc.foundByMe(x.id) && G.Disc.built(x))[0];
      F.give(d2.id, 1); F.detectP = () => 1; G.BALANCE.fakes.arrestBase = 5;
      const day0 = U.dayIndex(s.date), fame0 = s.player.fame + 1000; s.player.fame = fame0;
      s.contract = { sponsor: king.id, disc: d2.id, reward: 8000, due: U.dateNum(U.addDays(s.date, 200)) };
      answers = ['fake'];
      await SP.report(king);
      out.jailDays = U.dayIndex(s.date) - day0; out.banned = !!SP.rel(king.id).banned; out.fameCut = fame0 - s.player.fame; out.contract3 = s.contract;
      // 4) 들킴 → 벌금 (체포 없음)
      SP.rel(merch.id).banned = 0; G.BALANCE.fakes.arrestBase = -5;
      F.give(d2.id, 1); const g3 = s.player.gold; answers = ['fake'];
      const uc2 = U.chance; U.chance = (p) => p >= 1;        // 들키기는 하되(확률 1) 붙잡히지는 않게
      await SP.lateReport(merch, d2, 1);
      U.chance = uc2;
      out.fine = g3 - s.player.gold;
      // 5) 진짜와 모조품을 함께 → 사례금 ×1.3
      const d3 = G.DISCOVERIES.filter(x => F.fakeable(x) && x.id !== d.id && x.id !== d2.id && !G.Disc.foundByMe(x.id) && G.Disc.built(x) && x.how !== 'city')[1];
      s.disc[d3.id] = { found: true, me: true }; F.give(d3.id, 1);
      const sch = G.SPONSOR.pt_behaim; SP.rel(sch.id).trust = 30;
      s.contract = { sponsor: sch.id, disc: d3.id, reward: 10000, due: U.dateNum(U.addDays(s.date, 200)) };
      // 같은 판을 두 번: 진짜만(기준) → 되돌려 둘 다 — 사례금 비율만 본다(다른 보정이 붙어도 비율은 1.3)
      const snap = JSON.stringify(G.Game.state), uc3 = U.chance; U.chance = () => false;
      const g5 = G.Game.state.player.gold; answers = ['real'];
      await SP.report(sch);
      out.paidReal = G.Game.state.player.gold - g5;
      G.Game.state = JSON.parse(snap);
      const s2 = G.Game.state;
      const g4 = s2.player.gold, t4 = SP.rel(sch.id).trust; answers = ['both'];
      await SP.report(sch);
      U.chance = uc3;
      out.paidBoth = s2.player.gold - g4; out.trustBoth = SP.rel(sch.id).trust - t4; out.fakeLeft = F.count(d3.id);
      return out;
    });
    ok(!r.day8, '8일에는 모조품 상인이 없다');
    ok(!r.small && r.mid, '소도시(' + r.smallName + ')에는 없고 중도시(' + r.midName + ')에는 7일에 나온다');
    ok(r.cands > 2 && r.stock === 2, '살 수 있는 모조품 ' + r.cands + '가지 가운데 오늘 내놓는 것은 2개');
    ok(r.bought === 2 && r.left === 0 && /다 팔림/.test(r.soldSub || ''), '한 번에 2개만 판다 — 다 사면 「' + r.soldSub + '」');
    ok(r.nextMonth === 2, '다음 달 7일에 다시 2개');
    ok(r.forSale && r.menu, '리스본 시장에 「모조품 상인」 — 「' + r.d + '」 모조품 금화 ' + r.price);
    ok(r.paid1 > 0 && !r.found1 && r.fakeTo && r.fakeTo.indexOf('pt_king') >= 0 && !r.contract1, '못 찾은 채 모조품만으로 계약 보고: 사례금 ' + r.paid1 + ', 발견물은 그대로 못 찾은 상태');
    ok(r.paid2 > 0 && r.chaser === 'pt_king', '다른 후원자에게 또 팔면(이중 계약) 사례금 ' + r.paid2 + ' — 포르투갈 국왕이 추격자를 보낸다');
    ok(r.chaserNpc === 'pt_king' && !r.chaserAfter, '바다에 「' + r.chaserLabel + '」 한 번 나타나고, 맞닥뜨리면 끝');
    ok(r.jailDays >= 20 && r.banned && r.fameCut > 0 && !r.contract3, '들켜서 옥살이 ' + r.jailDays + '일 · 명성 −' + r.fameCut + ' · 한 해 출입 금지 · 계약 끝');
    ok(r.fine >= 800, '들켜서 벌금 금화 ' + r.fine);
    ok(r.paidReal > 0 && Math.abs(r.paidBoth / r.paidReal - 1.3) < 0.03 && r.trustBoth >= 16 && r.fakeLeft === 0, '진짜와 모조품을 함께: 사례금 ' + r.paidBoth + ' (진짜만 ' + r.paidReal + '의 ×1.3) · 신뢰 +' + r.trustBoth + '(10 더)');
    ok(!errors.length, '페이지 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
