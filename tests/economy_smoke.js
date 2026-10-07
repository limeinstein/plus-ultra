/* 살아 있는 경제 점검 (js/systems/economy.js · js/data/econ.js · rules.js 포화·폭락·번짐 · 술집 장사 소문)
   · 모자람 사건(가뭄): 파는 값·사는 값이 뛰고 재고가 준다 → 모자란 양만큼 팔면 값이 제자리로 (먼저 간 사람이 남긴다)
   · 넘침 사건(향료 선단): 값이 떨어지고 재고가 쌓인다
   · 대량 매각: 받아 줄 양을 넘기면 폭락, 그 고장 산물은 조금만 받아 줌, 이웃 항구로 포화가 번짐
   · 술집 「장사 소문을 듣는다」: 어느 도시에서 무슨 까닭으로 무엇이 모자란지 · 조짐 소문 · 하루 두 번
   · 가까이 있으면 【시장 소식】, 실제 전쟁(임진왜란)의 나라 도시에서 총포 값, 처음 시작할 때 세상에 이미 벌어진 일들, 3년 흐름
   · 교역소 구입·매각 창 꼬리표와 「받아 줄 양」, 수첩 교역 「시장 소식」, 옛 저장, 콘솔 오류 0
   node tests/economy_smoke.js   (스크린샷: OUT 또는 임시 폴더/economy_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'economy_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + String(e.stack).split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Econ && G.ECON_EVENTS, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });

    const r = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const B = G.BALANCE, E = G.Econ, R = G.R, C = id => G.CITY_DATA[id];
      B.econ.perDay = 0; B.econ.warPerDay = 0; B.econ.seed = 0; if (B.disaster) B.disaster.random = 0;
      s.econ = { ev: [], seq: 0, seeded: 1 };
      const o = {};
      const cad = C(8), sev = C(7), lis = C(0), cor = C(2), opo = C(1);
      // ① 가뭄 (카디스 일대) — 카디스는 밀을 안 내고, 세빌리아는 밀 산지
      o.p0 = { cadSell: R.sellPrice(cad, 'wheat'), sevBuy: R.buyPrice(sev, 'wheat'), sevStock: R.supply(sev, 'wheat') };
      const e = E.start('drought', 8, { lead: 0, dur: 200, k: 1 });
      o.cities = e.cities.map(id => C(id).name);
      s.day += 26;   // 차츰 세지는 24일이 지나 한창 (다른 상인들이 날마다 조금씩 채운다)
      o.p1 = { cadSell: R.sellPrice(cad, 'wheat'), sevBuy: R.buyPrice(sev, 'wheat'), sevStock: R.supply(sev, 'wheat'), mSell: E.mult(cad, 'wheat', 'sell'), mBuy: E.mult(sev, 'wheat', 'buy') };
      o.need = E.needLeft(e, cad, 'wheat'); o.needAt = E.needAt(cad, 'wheat');
      o.say = E.say(e, lis);
      // 모자란 양만큼 실어다 판다 (교역소 매각과 같은 셈 — 10번에 나눠)
      let total = 0, left = o.need, ch = Math.ceil(o.need / 10), first = R.sellPrice(cad, 'wheat'), last = first;
      while (left > 0) { const n = Math.min(ch, left); last = R.sellPrice(cad, 'wheat'); total += last * n; R.onSell(cad, 'wheat', n); left -= n; }
      o.fill = { first, last, avg: total / o.need, needLeft: E.needLeft(e, cad, 'wheat'), mult: E.mult(cad, 'wheat', 'sell') };
      s.market[8] = null; delete s.market[8];
      o.afterFill = R.sellPrice(cad, 'wheat');   // 포화를 빼고 보면 제값 근처
      // ② 넘침: 향료 선단 (리스본)
      const pb0 = R.buyPrice(lis, 'pepper'), ps0 = R.sellPrice(lis, 'pepper'), pk0 = R.supply(lis, 'pepper');
      s.year1500 = 1; s.date.y = 1510;
      const pb0b = R.buyPrice(lis, 'pepper'), ps0b = R.sellPrice(lis, 'pepper'), pk0b = R.supply(lis, 'pepper');
      const g = E.start('spicefleet', 0, { lead: 0, dur: 100, k: 1 }); s.day += 30;
      o.glut = { buy: R.buyPrice(lis, 'pepper') / pb0b, sell: R.sellPrice(lis, 'pepper') / ps0b, stock: R.supply(lis, 'pepper') / Math.max(1, pk0b), relay: R.isRelay(lis, 'pepper'), say: E.say(g, lis) };
      s.date.y = 1480;
      // ③ 대량 매각: 라코루냐(작은 항구)에 포도주 900통 — 받아 줄 양 300통
      function dump(c, id, q, crash) {
        const keep = JSON.stringify(s.market[c.id] || null), K = B.market, c0 = K.crash; K.crash = crash;
        let left = q, ch = Math.ceil(q / 30), firstP = R.sellPrice(c, id), lastP = firstP, tot = 0;
        while (left > 0) { const n = Math.min(ch, left); lastP = R.sellPrice(c, id); tot += lastP * n; R.onSell(c, id, n); left -= n; }
        K.crash = c0; s.market[c.id] = JSON.parse(keep); if (!s.market[c.id]) delete s.market[c.id];
        return { first: firstP, last: lastP, avg: tot / q };
      }
      o.cap = { cor: R.satCap(cor, 'wine'), lisWine: R.satCap(lis, 'wine'), lisWineFull: B.market.sat[0] + lis.size * B.market.sat[1] };
      o.dump = { crash: dump(cor, 'wine', 900, B.market.crash), noCrash: dump(cor, 'wine', 900, 0), small: dump(cor, 'wine', 150, B.market.crash) };
      // 번짐: 실제로 판 뒤 R.spill — 이웃 오포르토(같은 지역, 2도 남짓)
      const sp0 = (R.market(1).g.wine || {}).sat || 0;
      R.onSell(cor, 'wine', 600); R.spill(cor, 'wine', 600);
      o.spill = { opo: ((R.market(1).g.wine || {}).sat || 0) - sp0, far: ((R.market(12).g.wine || {}).sat || 0) };   // 바르셀로나(멀다)
      delete s.market[2]; delete s.market[1];
      // ④ 실제 전쟁: 임진왜란 (1592)
      s.date = { y: 1593, m: 3, d: 1 };
      const w = E.wars().filter(x => x[2] === '임진왜란')[0];
      const ew = E.spawnWar(w); ew.start = s.day; ew.end = s.day + 200; s.day += 40;
      const wc = C(ew.at);
      o.war = { name: E.title(ew), nat: ew.nat, all: ew.cities.every(id => R.cityOwner(C(id)) === ew.nat), n: ew.cities.length, guns: E.mult(wc, 'guns', 'sell'), art: E.mult(wc, 'art', 'sell'), say: E.say(ew, wc) };
      s.date = { y: 1480, m: 6, d: 1 };
      s.econ.ev = s.econ.ev.filter(x => x !== ew && x !== g);
      return o;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 2500));
    ok(r.cities.indexOf('카디스') >= 0 && r.cities.indexOf('세빌리아') >= 0, '가뭄이 카디스 일대 ' + r.cities.length + '곳에 (' + r.cities.slice(0, 6).join('·') + ')');
    ok(r.p1.mSell > 1.7 && r.p1.cadSell > r.p0.cadSell * 1.5, '카디스 밀 파는 값 ' + r.p0.cadSell + ' → ' + r.p1.cadSell + ' (사건 ×' + r.p1.mSell.toFixed(2) + ')');
    ok(r.p1.mBuy > 1.5 && r.p1.sevBuy > r.p0.sevBuy && r.p1.sevStock < r.p0.sevStock * 0.6, '산지 세빌리아도 밀이 귀하다: 사는 값 ' + r.p0.sevBuy + ' → ' + r.p1.sevBuy + ' (×' + r.p1.mBuy.toFixed(2) + '), 재고 ' + r.p0.sevStock + ' → ' + r.p1.sevStock);
    ok(r.need > 150 && r.need < 238 && r.needAt === r.need && /카디스/.test(r.say) && /모자라다/.test(r.say), '모자란 양 ' + r.need + '통 — 「' + r.say.slice(0, 80) + '…」');
    ok(r.fill.needLeft === 0 && Math.abs(r.fill.mult - 1) < 0.02 && r.fill.last < r.fill.first * 0.65, '모자란 양을 채우면 값이 제자리로: 첫 ' + r.fill.first + ' → 마지막 ' + r.fill.last + ' (평균 ' + Math.round(r.fill.avg) + '), 사건 배수 ×' + r.fill.mult.toFixed(2));
    ok(Math.abs(r.afterFill / r.p0.cadSell - 1) < 0.05, '채운 뒤 (포화 빼고) 밀 값 ' + r.afterFill + ' ≈ 처음 ' + r.p0.cadSell);
    ok(r.glut.buy < 0.7 && r.glut.sell < 0.7 && r.glut.stock > 1.4, '향료 선단(넘침): 리스본 후추 사는 값 ×' + r.glut.buy.toFixed(2) + ' · 파는 값 ×' + r.glut.sell.toFixed(2) + ' · 재고 ×' + r.glut.stock.toFixed(2));
    ok(r.cap.lisWine < r.cap.lisWineFull * 0.5 && r.cap.cor === 300, '받아 줄 양: 라코루냐 포도주 ' + r.cap.cor + '통, 산지 리스본 ' + Math.round(r.cap.lisWine) + '통 (산지가 아니면 ' + r.cap.lisWineFull + '통)');
    ok(r.dump.crash.last < r.dump.crash.first * 0.2 && r.dump.crash.last < r.dump.noCrash.last * 0.4, '900통 한꺼번에: 첫 ' + r.dump.crash.first + ' → 마지막 ' + r.dump.crash.last + '닢 (폭락 — 폭락 셈이 없으면 ' + r.dump.noCrash.last + '닢)');
    ok(r.dump.small.last >= r.dump.small.first * 0.75, '150통이면 완만: 첫 ' + r.dump.small.first + ' → 마지막 ' + r.dump.small.last);
    ok(r.spill.opo > 0.1 && r.spill.far === 0, '대량 매각이 이웃 오포르토로 번짐 (포화 +' + r.spill.opo.toFixed(2) + '), 먼 바르셀로나는 그대로');
    ok(r.war.all && r.war.guns > 1.6 && r.war.art < 1 && /임진왜란/.test(r.war.name), r.war.name + ': ' + r.war.n + '곳 · 총 ×' + r.war.guns.toFixed(2) + ' · 미술품 ×' + r.war.art.toFixed(2) + ' — 「' + r.war.say.slice(0, 60) + '…」');

    // ⑤ 소식과 소문: 제독이 카디스에 있다
    await page.evaluate(() => { const s = G.Game.state; s.loc = { mode: 'city', city: 8, lon: G.CITY_DATA[8].lon, lat: G.CITY_DATA[8].lat }; G.Game.go('city', { cityId: 8 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
    const nz = await page.evaluate(async () => {
      const s = G.Game.state, E = G.Econ, C = G.Scenes.city, o = {};
      // 가까운 세빌리아에 큰불 — 다음 날 소식, 먼 베니스의 혼례 조짐은 소식이 없다
      const f = E.start('fire', 7, { lead: 0, dur: 90 });
      const ven = G.CITY_DATA.find(c => c.name === '베니스');
      const wd = E.start('wedding', ven.id, { lead: 30, dur: 60 });
      const msgs = G.Game.passDays(1);
      o.news = msgs.filter(m => /【시장 소식】/.test(m.text)).map(m => m.text);
      o.fireKnown = !!f.known; o.wedKnown = !!wd.known;
      // 술집 소문: 먼 곳 사건도 (조짐 포함) 듣는다 — 하루 두 번
      const said = []; C.say = async (who, t) => { said.push(t); }; C.mate = async (t) => { said.push(t); };
      const lisArm = E.start('armada', 0, { lead: 25, dur: 150 });   // 리스본 함대 건조 조짐
      const g0 = s.player.gold;
      await C.B.tavern.rumor(G.CITY_DATA[8]); await C.B.tavern.rumor(G.CITY_DATA[8]);
      o.left = C.B.tavern.rumorLeft(G.CITY_DATA[8]);
      await C.B.tavern.rumor(G.CITY_DATA[8]);
      o.said = said; o.paid = g0 - s.player.gold; o.armKnown = !!lisArm.known; o.known = E.knownList().length;
      o.menu = C.B.tavern.menu(G.CITY_DATA[8]).filter(Boolean).map(m => m.label + (m.sub ? '(' + m.sub + ')' : ''));
      return o;
    });
    console.log(JSON.stringify(nz, null, 1).slice(0, 2500));
    ok(nz.news.some(t => /세빌리아/.test(t) && /큰불|불타/.test(t)) && nz.fireKnown && !nz.wedKnown, '가까운 세빌리아의 대화재는 【시장 소식】으로, 먼 베니스 혼례 조짐은 소식 없음: 「' + (nz.news[0] || '').slice(0, 70) + '…」');
    ok(nz.menu.some(l => /장사 소문을 듣는다/.test(l)), '술집 메뉴: ' + nz.menu.filter(l => /소문/.test(l)).join(''));
    ok(nz.said.length >= 2 && nz.left === 0 && /그게 다일세/.test(nz.said[nz.said.length - 1]) && nz.paid === 2 * (4 + 2 * 2), '장사 소문 하루 두 번 (술값 ' + nz.paid + '닢), 세 번째는 「오늘 들은 이야기는 그게 다」');
    ok(nz.said.slice(0, 2).join(' ').length > 60 && nz.known >= 2, '소문: 「' + nz.said[0].replace(/\f/g, ' / ').slice(0, 160) + '…」 · 아는 소식 ' + nz.known + '가지');

    // ⑥ 화면: 교역소 매각·구입 창, 수첩 교역
    await page.evaluate(() => {
      const s = G.Game.state; s.fleet.cargo.wheat = { q: 120, cost: 5, from: 7, d: s.day }; s.fleet.cargo.pepper = { q: 60, cost: 40, from: 0, d: s.day };
      G.Econ.start('drought', 8, { lead: 0, dur: 200 }); s.day += 30;
      window.__p = G.Scenes.city.B.trade.sell(G.CITY_DATA[8]);
    });
    await page.waitForSelector('.win .tbl', { timeout: 10000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'sell.png') });
    const sellUi = await page.evaluate(() => ({ head: [...document.querySelectorAll('.win .tbl th')].map(t => t.textContent), ev: document.querySelectorAll('.win .tag.ev-up').length, txt: document.querySelector('.win .tbl').innerText }));
    // 수량 창: 첫 통 → 마지막 통
    await page.locator('.win tr.click').first().click();
    await page.waitForTimeout(500);
    const numInfo = await page.evaluate(() => (document.querySelector('.win .num-info, .win .info, .win') || {}).innerText || '');
    await page.screenshot({ path: path.join(OUT, 'sell_qty.png') });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
    await page.evaluate(() => { window.__p = G.Scenes.city.B.trade.buy(G.CITY_DATA[8]); });
    await page.waitForSelector('.win .tbl', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'buy.png') });
    const buyUi = await page.evaluate(() => ({ spec: [...document.querySelectorAll('.win .tag.spec')].map(t => t.textContent + ' | ' + t.title) }));
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
    await page.evaluate(() => { window.__q = G.Scenes.city.B.trade.quotes(G.CITY_DATA[8]); });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, 'quotes.png') });
    const qUi = await page.evaluate(() => document.querySelector('.win').innerText.slice(0, 600));
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); G.Info.open('trade'); });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, 'notebook.png') });
    const nb = await page.evaluate(() => { const b = document.querySelector('.econ-box'); return b ? b.innerText : ''; });
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
    console.log(JSON.stringify({ sellUi, numInfo: numInfo.slice(0, 300), buyUi, qUi, nb: nb.slice(0, 400) }, null, 1));
    ok(sellUi.head.indexOf('받아 줄 양') >= 0 && sellUi.ev >= 1 && /모자람/.test(sellUi.txt) && /귀함|산지/.test(sellUi.txt), '매각 창: 가뭄 ▲ 꼬리표 · 「받아 줄 양」(모자람) · 귀함/산지');
    ok(/첫 통/.test(numInfo) && /마지막 통/.test(numInfo), '매각 수량 창: 첫 통 → 마지막 통 값');
    ok(buyUi.spec.length >= 1, '구입 창 특산 꼬리표: ' + buyUi.spec[0]);
    ok(/가뭄/.test(qUi) && /비싸게 팔리는 곳/.test(qUi), '시세 창: 이 도시에 걸린 사건 · 산물이 비싸게 팔리는 곳');
    ok(/시장 소식/.test(nb) && /가뭄|대화재/.test(nb), '수첩 교역 「시장 소식」: ' + nb.split('\n').slice(0, 3).join(' / '));

    // ⑦ 처음 시작: 세상에 이미 벌어진 일들 · 3년 흐름 · 옛 저장
    const life = await page.evaluate(() => {
      const s = G.Game.state, E = G.Econ, B = G.BALANCE.econ, o = {};
      B.perDay = 0.1; B.warPerDay = 0.02; B.seed = 7;
      delete s.econ; s.date = { y: 1500, m: 1, d: 1 };
      o.oldMult = E.mult(G.CITY_DATA[8], 'wheat', 'sell'); o.oldTag = E.tag(G.CITY_DATA[8], 'wheat');
      E.daily(); o.seed = s.econ.ev.length; o.seedTold = s.econ.ev.every(e => e.told === 1); o.seedActive = s.econ.ev.filter(e => s.day >= e.start).length;
      let spawned = 0, maxLive = 0, seen = {}, types = {};
      for (let i = 0; i < 365 * 3; i++) {
        s.day++; if (i % 30 === 29) { s.date.m = s.date.m % 12 + 1; if (s.date.m === 1) s.date.y++; }
        E.daily(); s.econ.ev.forEach(e => { if (!seen[e.n]) { seen[e.n] = 1; spawned++; types[e.type] = (types[e.type] || 0) + 1; } });
        maxLive = Math.max(maxLive, s.econ.ev.filter(e => s.day >= e.start && s.day < e.end).length);
      }
      o.spawned = spawned; o.maxLive = maxLive; o.types = types; o.allEnd = s.econ.ev.every(e => e.end > s.day);
      // 사건에 걸린 도시 비율 (지금)
      const hit = {}; s.econ.ev.forEach(e => { if (s.day >= e.start) e.cities.forEach(id => { hit[id] = 1; }); });
      o.hitShare = Object.keys(hit).length / G.CITY_DATA.filter(c => G.R.cityExists(c)).length;
      return o;
    });
    console.log(JSON.stringify(life));
    ok(life.oldMult === 1 && life.oldTag === '', '옛 저장(s.econ 없음): 값 그대로');
    ok(life.seed >= 5 && life.seedTold && life.seedActive >= 5, '처음 시작: 이미 벌어진 일 ' + life.seed + '가지 (소식 없이 한창)');
    ok(life.spawned > 60 && life.maxLive <= 14 + 6 && life.allEnd, '3년: 사건 ' + life.spawned + '가지 일어남, 한때 많아야 ' + life.maxLive + '가지 · ' + Object.keys(life.types).length + '종 · 지금 도시의 ' + Math.round(life.hitShare * 100) + '%에 걸림');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
