/* 식물 발견물 79종과 식물 특산물 — node tests/plant_trade_smoke.js   (BROWSER_EXE=크롬 경로)
   · 열매 55종(지역 11곳 × 5) · 매화·난초·국화·대나무·적송·진달래·튤립·장미·흰 장미·파란 장미 · 지역 대표 나무 11 · 선인장 3
   · 열매는 이미 있던 교역품과 겹치지 않는다 · 모두 식물(왕실 정원) · 단서 이름 · 그 고장 도시에서 이야기를 듣는다
   · 찾은 식물을 들고 교역소에 가면 주인이 청한다 → 심으면 그 교역소 특산물 (발견물은 남는다) · 한 교역소 2종까지 · 기후
   · 저장·불러오기, 새 일지에서는 사라진다 · 파란 장미는 두 장미를 찾아야 열린다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.PlantTrade && G.PlantTrade.hooked, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      const out = {}, P = G.PLANTS.map(id => G.DISC[id]);
      // ---- 자료
      out.n = P.length;
      out.fruitByReg = {}; P.filter(d => !d.flower && !d.tree && !d.cactus).forEach(d => { out.fruitByReg[d.reg] = (out.fruitByReg[d.reg] || 0) + 1; });
      out.trees = ['corkoak', 'majoroak', 'stonepine', 'gumarabic', 'cedar', 'teak', 'ginkgo', 'populus', 'camphor', 'sakura', 'brazilwood'].map(id => G.DISC[id] && G.DISC[id].tree ? G.DISC[id].reg : -1);
      out.cacti = P.filter(d => d.cactus).length;
      out.asked = ['매화', '난초', '국화', '대나무', '송', '진달래', '랄레', '다마스크 장미', '흰 장미', '파란 장미'].map(k => P.some(d => (d.realName || d.name).indexOf(k) >= 0));
      const baseNames = G.GOODS.filter(g => !g.plant).map(g => g.name);
      out.dupGood = P.map(d => G.PlantTrade.crop(d)).filter(g => !g || baseNames.indexOf(g.name) >= 0).map(g => g ? g.name : 'none');
      out.goodsTail = G.GOODS.slice(-P.length).every(g => g.plant) && G.GOODS.every((g, i) => g.idx === i);
      out.allPlant = P.every(d => G.Court.isPlant(d) && d.cat === 'creature');
      out.clue = P.every(d => d.clue ? d.clue !== d.realName : (G.DISC_NAMES[d.id] && G.DISC_NAMES[d.id].clue === d.name)) && P.some(d => d.clue) && P.some(d => !d.clue);   // 2026-10-23: 대항해시대 3처럼 이름 그대로인 것도 있다
      out.noCityGoods = G.CITY_DATA.every(c => !c || !c.goods || !c.goods.some(id => G.GOOD[id] && G.GOOD[id].plant));
      // ---- 새 일지
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, R = G.R, PT = G.PlantTrade, UI = G.UI, said = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      let answer = 1; UI.ask = async (t, ch) => { said.push('? ' + String(t)); return answer; };
      out.blue0 = G.Disc.needMet(G.DISC.bluerose);
      // 그 고장 도시에서 듣는 이야기
      out.local = G.Animals.local(G.CITY_DATA[150]).map(d => d.id).filter(id => G.PLANTS.indexOf(id) >= 0);
      out.hintOk = G.Disc.addHint('mango', 'local:150');
      // 찾는다
      const found = id => { s.disc[id] = Object.assign(s.disc[id] || {}, { found: true, me: true }); };
      ['mango', 'durian', 'lingonberry', 'coconut', 'camphor'].forEach(found);
      const mal = G.CITY_DATA[160], lis = G.CITY_DATA[0], goa = G.CITY_DATA[150];
      const buy0 = R.buyPrice ? R.buyPrice(goa, 'p_mango') : null;
      out.why = { linMal: PT.why(G.DISC.lingonberry, mal), mangoLis: PT.why(G.DISC.mango, lis), mangoMal: PT.why(G.DISC.mango, mal) };
      out.menu = (G.Scenes.city.B.trade.menu(mal) || []).filter(Boolean).some(m => m.label === '식물을 심는다');
      // 교역소에 들어서면 주인이 청한다 — 거절
      answer = 0; said.length = 0;
      out.decline = await PT.atTrade(mal); out.askedLine = said.some(t => /특산물/.test(t)); out.cool = s.plantTrade.ask[160] - s.day;
      out.again = await PT.atTrade(mal);   // 쉬는 동안 다시 묻지 않는다
      // 주인이 먼저 청하는 것은 사건처럼 가끔 (2026-10-26): 다른 교역소도 반년(offerGap) 안에는 묻지 않는다 · 한 해 2번까지 · 메뉴는 언제나
      said.length = 0; const goa0 = G.CITY_DATA[150];
      out.gapOther = await PT.atTrade(goa0); out.gapSilent = !said.length; out.menuStill = (G.Scenes.city.B.trade.menu(goa0) || []).filter(Boolean).some(m => m.label === '식물을 심는다');
      const K0 = G.BALANCE.plantTrade, ch0 = K0.offerChance; K0.offerChance = 1;
      s.day += K0.offerGap; out.afterGap = PT.canOffer(); await PT.atTrade(goa0); out.n2 = s.plantTrade.offer.n;
      s.day += K0.offerGap; out.yearCap = s.plantTrade.offer.y === s.date.y ? !PT.canOffer() : true;   // 날짜(s.date)는 그대로라 같은 해 — 3번째는 막힌다
      s.day -= K0.offerGap * 2; K0.offerChance = ch0; delete s.plantTrade.ask[150]; s.plantTrade.offer = null;
      // 메뉴에서 심는다 (값 높은 것부터: 용뇌)
      answer = 1; said.length = 0;
      out.p1 = PT.plant(G.DISC.camphor, mal);
      out.sells1 = R.sells(mal, 'p_camphor');
      out.p2 = PT.plant(G.DISC.durian, mal);
      out.full = PT.why(G.DISC.mango, mal); out.p3 = PT.plant(G.DISC.mango, mal); out.room = PT.room(mal);
      out.goods = mal.goods.filter(id => G.GOOD[id].plant);
      out.stillFound = G.Disc.foundByMe('camphor') && G.Disc.foundByMe('durian');
      out.garden = G.Court.gardenPlants().some(x => x.d && x.d.id === 'durian');
      out.origin = !!R.origins().p_durian[8] && !!R.origins().p_camphor[8];
      out.price = { mal: R.buyPrice ? R.buyPrice(mal, 'p_durian') : 0, sellLis: R.sellPrice(lis, 'p_durian'), sellMal: R.sellPrice(mal, 'p_durian') };
      out.investPool = G.GOODS.filter(g => g.plant).every(g => !R.cityGoods(G.CITY_DATA[0]).includes(g.id));
      // 고아에 망고 (본디 산지 지역)
      out.goa = PT.plant(G.DISC.mango, goa) && R.sells(goa, 'p_mango');
      // 저장 → 새 일지 → 불러오기
      const json = G.State.serialize();
      G.State.newGame({ name: '둘째', nation: 'ES', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      out.fresh = !R.sells(mal, 'p_durian') && !mal.goods.some(id => G.GOOD[id].plant);
      G.Game.state = G.State.deserialize(json);
      out.loaded = R.sells(mal, 'p_durian') && R.sells(mal, 'p_camphor') && R.sells(goa, 'p_mango');
      // 파란 장미
      const s2 = G.Game.state; s2.disc.rose = { found: true, me: true }; s2.disc.whiterose = { found: true, me: true };
      out.blue1 = G.Disc.needMet(G.DISC.bluerose);
      out.log = s2.log ? s2.log.slice(-3).map(x => x.t || x.text || String(x)) : [];
      return out;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 3000));
    ok(r.n === 79, '식물 발견물 79종');
    ok(Object.keys(r.fruitByReg).length === 11 && Object.values(r.fruitByReg).every(n => n === 5), '열매 — 지역 11곳마다 5종 (55)');
    ok(new Set(r.trees).size === 11 && r.trees.length === 11 && r.cacti === 3, '지역 대표 나무 11(지역마다 하나) · 선인장 3');
    ok(r.asked.every(Boolean), '매화·난초·국화·대나무·적송·진달래·튤립·장미·흰 장미·파란 장미');
    ok(!r.dupGood.length, '식물 교역품은 이미 있던 교역품과 이름이 겹치지 않는다 ' + r.dupGood.join(','));
    ok(r.goodsTail, '식물 교역품은 G.GOODS 끝에 (순번 그대로)');
    ok(r.allPlant && r.clue, '모두 식물(왕실 정원) · 단서 이름이 따로 있거나 처음부터 이름 그대로');
    ok(r.noCityGoods, '처음에는 어느 교역소도 식물 교역품을 팔지 않는다');
    ok(r.local.indexOf('mango') >= 0 && r.hintOk, '고아에서 이 고장 식물(망고) 이야기를 들을 수 있다 — ' + r.local.join(','));
    ok(/열대/.test(r.why.linMal) === false && /추운/.test(r.why.linMal) && /열대/.test(r.why.mangoLis) && r.why.mangoMal === null, '기후: 링곤베리는 말라카에 안 맞고, 망고는 리스본에 안 맞는다');
    ok(r.menu, '교역소 메뉴 「식물을 심는다」');
    ok(r.decline === false && r.askedLine && r.cool === 30 && r.again === false, '주인이 먼저 청한다 → 거절하면 30일 동안 묻지 않는다');
    ok(r.gapOther === false && r.gapSilent && r.menuStill && r.afterGap && r.n2 === 2 && r.yearCap, '주인의 청은 사건처럼 가끔 — 다른 교역소도 반년 안에는 묻지 않고, 한 해 2번까지 · 메뉴 「식물을 심는다」는 언제나');
    ok(r.sells1 && r.p2 && r.room === 0 && /자리가 없다/.test(r.full) && r.p3 === false && r.goods.length === 2, '심으면 특산물 · 한 교역소 2종까지 (' + r.goods.join(',') + ')');
    ok(r.stillFound && r.garden, '특산물이 되어도 발견물은 남는다 (왕실 정원에도 바칠 수 있다)');
    ok(r.origin && r.price.sellLis > r.price.sellMal, '심은 지역이 산지가 된다 — 리스본에서 더 비싸게 팔린다 ' + JSON.stringify(r.price));
    ok(r.investPool, '출자로 늘어나는 물건에 식물 교역품은 끼지 않는다');
    ok(r.goa && r.fresh && r.loaded, '저장·불러오기 그대로, 새 일지에서는 사라진다');
    ok(r.blue0 === false && r.blue1 === true, '파란 장미는 다마스크 장미와 요크의 흰 장미를 찾아야 열린다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
