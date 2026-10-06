/* 노예 무역 (tests/slave_trade_smoke.js) — node tests/slave_trade_smoke.js
   교역 발견물 「노예 무역」(t_slaves): 아프리카 상관에서 처음 사면 발견 / 사고팔 때마다 악명 / 「노예 상인」이라는 이름(직위 칸·수첩) /
   5해 동안 손대지 않으면 잊힘 / 뒤를 이은 자녀에게는 이어지지 않음 / 조합·왕명은 노예를 맡기지 않음 / 옛 물건 순번 그대로. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, R = G.R, SL = G.Slave, T = G.Scenes.city.B.trade;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const g = G.GOOD.slaves, d = G.DISC.t_slaves, city = n => G.CITY_DATA.find(c => c && c.name === n);
      out.good = !!g && g.idx === G.GOODS.length - 1 && G.GOODS[g.idx] === g;
      out.disc = d && d.cat + ':' + d.how + ':' + d.good + ':' + d.regions.join(',') + ':' + d.name;
      out.impact = G.Disc.impactKind(d);
      out.cities = G.CITY_DATA.filter(c => c && c.goods && c.goods.includes('slaves')).map(c => c.name).join(',');
      const mina = city('산호르헤'), lis = city('리스본'), dom = city('산토도밍고'), cai = city('알렉산드리아');
      out.price = [R.buyPrice(mina, 'slaves'), R.sellPrice(lis, 'slaves'), R.sellPrice(dom, 'slaves'), R.sellPrice(cai, 'slaves')].join('/');
      out.avail = G.Disc.available(d) && G.Disc.checkTrade('slaves', mina).length === 1 && G.Disc.checkTrade('slaves', lis).length === 0;
      // 처음: 부관이 말린다
      let asked = 0, answer = 0; UI.ask = async (t, o) => { asked++; return answer; }; UI.toast = () => {}; G.Game.refreshHud = () => {};
      out.refuse = (await SL.confirm(mina)) === false && asked === 1 && !s.slaver;
      answer = 1; out.accept = (await SL.confirm(mina)) === true;
      out.title0 = SL.title();
      // 산다: 30통 → 악명 +4
      const n0 = s.player.notoriety; SL.onBuy(mina, 30);
      out.buy = (s.player.notoriety - n0) + ':' + SL.title() + ':' + s.slaver.bought;
      asked = 0; out.noAskAgain = (await SL.confirm(mina)) === true && asked === 0;
      // 판다: 30통 → 악명 +6
      const n1 = s.player.notoriety; SL.onSell(lis, 30);
      out.sell = (s.player.notoriety - n1) + ':' + s.slaver.sold + ':' + s.stats.slaves;
      out.log = s.log.some(l => /노예 상인/.test(JSON.stringify(l)));
      // 직위 칸·수첩
      out.html = SL.html().replace(/<[^>]+>/g, '');
      // 실제 교역소 사는 길: T.buyOne 같은 안쪽 함수는 창을 띄우므로 sellQty만 직접 (cargo → 판다)
      s.fleet.cargo.slaves = { q: 20, cost: 80, from: mina.id, d: s.day };
      // 5해 뒤 잊힌다
      const day0 = s.day; s.day = day0 + 5 * 365 - 1; out.still = SL.title(); s.day = day0 + 5 * 365; out.gone = SL.title() === '' && SL.html() === '';
      // 다시 손대면 다시 붙는다
      SL.onSell(lis, 5); out.again = SL.title();
      // 뒤를 이은 자녀에게는 이어지지 않는다
      s.player.generation = 2; out.heir = SL.title() === ''; asked = 0; answer = 0; out.heirAsk = (await SL.confirm(mina)) === false && asked === 1; s.player.generation = 1;
      // 조합·왕명은 노예를 맡기지 않는다
      let q = 0; for (let b = 0; b < 400; b++) { s.day = b * 10; G.Quest.offers(mina).forEach(o => { if (o.good === 'slaves') q++; }); }
      out.quest = q;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.good, '물건 「노예」는 물건 목록 맨 끝 (옛 물건 순번 그대로)');
    ok(r.disc === 'trade:trade:slaves:3:노예 무역' && r.impact === 'grief', '교역 발견물 t_slaves (발견의 여파는 숙연함): ' + r.disc);
    ok(r.cities === '아르킨,베르데 곶,시에라리온,산호르헤,산토메,르완다,킬와,잔지바르', '산지: ' + r.cities);
    const p = r.price.split('/').map(Number);
    ok(p[0] < p[1] && p[1] < p[2] && p[3] > p[0], '값: 산지 ' + p[0] + ' < 리스본 ' + p[1] + ' < 산토도밍고 ' + p[2] + ' · 알렉산드리아 ' + p[3]);
    ok(r.avail, '아프리카 상관에서 처음 살 때 발견 (다른 고장에서는 아님)');
    ok(r.refuse && r.accept && r.title0 === '' && r.noAskAgain, '처음에는 부관이 말린다 — 그만두면 아무 일 없음, 한 번 손대면 다시 묻지 않음');
    ok(r.buy === '4:노예 상인:30' && r.sell === '6:30:30' && r.log, '사고팔 때마다 악명(+4, +6)·「노예 상인」이라는 이름·일지');
    ok(r.html === '노예 상인', '수첩에 「노예 상인」');
    ok(r.still === '노예 상인' && r.gone && r.again === '노예 상인', '5해 동안 손대지 않으면 잊히고, 다시 손대면 다시 붙는다');
    ok(r.heir && r.heirAsk, '뒤를 이은 자녀에게는 이어지지 않는다');
    ok(r.quest === 0, '조합 의뢰에 노예가 나오지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
