/* 시장 복수 구매·회계 결제 협상·항구 복수/전부 발표 점검
   node tests/market_bulk_announce_smoke.js */
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
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state, C = G.Scenes.city, MK = C.B.market, H = C.B.harbor, c = G.CITY_DATA[s.player.home];
      s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat }; s.player.gold = 1000000; s.player.items = [];
      const cur = {}, current0 = C.current; C.current = () => cur;
      const choose0 = G.UI.choose, number0 = G.UI.number, confirm0 = G.UI.confirm, ask0 = G.UI.ask, alert0 = G.UI.alert;
      const say0 = C.say, mate0 = C.mate, me0 = C.me, chance0 = G.U.chance;
      C.say = async () => {}; C.mate = async () => {}; C.me = async () => {};

      // ① 같은 아이템 다섯 개를 한 번에 산다.
      const it = MK.stock(c)[0], unit = MK.price(it), gold0 = s.player.gold;
      const choices = [it.id, null]; let numberOpts = null;
      G.UI.choose = async () => choices.shift();
      G.UI.number = async o => { numberOpts = { min: o.min, max: o.max, unit: o.unit, info: o.info(5) }; return 5; };
      G.UI.confirm = async () => true;
      await MK.buy(c);
      const bought = { count: G.R.itemCount(it.id), slots: s.player.items.filter(x => x.id === it.id).length, spent: gold0 - s.player.gold, unit, numberOpts };

      // 금화·소지품 칸이 충분해도 한 번의 거래 상한은 99개다.
      s.player.items = []; s.player.gold = 10000000;
      const cap = MK.buyMax(it, 1);
      G.R.addMarketItems('lime', 3); const lime0 = G.R.itemCount('lime');
      G.R.useCharge('lime'); const lime1 = G.R.itemCount('lime');
      G.R.removeItem('lime'); const lime2 = G.R.itemCount('lime');

      // ② 후려치기 성공 뒤 회계 3이면 결제 추가 협상을 세 번 할 수 있다.
      s.player.sk.acct = 3; cur.mk = { ok: true, buy: 0.9, sell: 1.1 }; cur.mkBuyDeals = 0;
      G.UI.ask = async () => 'deal'; G.U.chance = () => true;
      const deals = [];
      for (let i = 0; i < 4; i++) deals.push(await MK.checkoutDeal(c, it, 5, 100));
      const menuNoPurser = (() => { s.mates.forEach(m => { m.role = 'none'; }); return MK.menu(c).filter(Boolean).map(x => x.label); })();

      // ③ 발표 선택 창에서 임의 복수와 전부를 각각 고를 수 있다.
      const ds = G.DISCOVERIES.filter(d => d.id !== 'westroute' && d.id !== 'indiaroute' && d.id !== 'circum' && d.pw < 3).slice(0, 3);
      ds.forEach(d => { s.disc[d.id] = { me: true, found: s.day || 1 }; });
      const pickP = H.pickAnnouncements(ds);
      const boxes = Array.from(document.querySelectorAll('input[data-disc]')); boxes[0].click(); boxes[2].click();
      Array.from(document.querySelectorAll('.foot button')).find(b => /선택한 발견/.test(b.textContent)).click();
      const picked = await pickP;
      const allP = H.pickAnnouncements(ds);
      Array.from(document.querySelectorAll('.foot button')).find(b => /전부 발표/.test(b.textContent)).click();
      const all = await allP;

      // 실제 일괄 발표는 세 건을 모두 상태에 반영하고 명성을 합산한다.
      G.UI.alert = async () => {};
      const result = await H.announceSelected(c, all);
      const announced = ds.map(d => !!s.disc[d.id].announced);

      G.UI.choose = choose0; G.UI.number = number0; G.UI.confirm = confirm0; G.UI.ask = ask0; G.UI.alert = alert0;
      C.say = say0; C.mate = mate0; C.me = me0; C.current = current0; G.U.chance = chance0;
      return { bought, cap, lime: [lime0, lime1, lime2], deals: deals.map(x => ({ total: x.total, dealt: x.dealt, ok: x.ok })), used: cur.mkBuyDeals, menuNoPurser, ids: ds.map(d => d.id), picked, all, result, announced };
    });
    console.log(JSON.stringify(r));
    ok(r.bought.count === 5 && r.bought.slots === 1 && r.bought.spent === r.bought.unit * 5, '동일 아이템 5개를 한 칸에 묶어 구입하고 총액을 정확히 지불');
    ok(r.bought.numberOpts.min === 1 && r.bought.numberOpts.max === 99 && r.bought.numberOpts.unit === '개' && /구입 뒤/.test(r.bought.numberOpts.info), '수량 선택 창에 1~99개와 구입 뒤 보유 수량 표시');
    ok(r.cap === 99, '한 번에 구입할 수 있는 절대 상한 99개');
    ok(r.lime.join() === '3,2,1', '묶인 소모품은 사용·버림 때 한 개씩 차감');
    ok(r.deals.slice(0, 3).every(x => x.dealt && x.ok && x.total === 465) && !r.deals[3].dealt && r.used === 3, '회계 3: 결제 추가 협상 3회, 이후에는 먼저 정한 가격');
    ok(r.menuNoPurser.some(x => /값 깎기/.test(x)), '경리가 없어도 제독에게 회계 기술이 있으면 값 깎기 가능');
    ok(r.picked.join() === [r.ids[0], r.ids[2]].join(), '발견 두 건을 임의로 복수 선택');
    ok(r.all.join() === r.ids.join(), '「전부 발표」가 미발표 발견 전체를 선택');
    ok(r.result.count === 3 && r.result.fame > 0 && r.announced.every(Boolean), '선택한 발견 세 건을 실제로 일괄 발표하고 명성을 합산');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) {
    console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
