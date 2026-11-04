/* 특허 회사 (2026-11-04) — 입회·계급 · 회사 창고 · 독점품 납품 · 세관(밀수) · 중개 주문서 · 회사 임무 넷 · 주식·배당·귀띔 · 단추 8개 이하
   node tests/company_smoke.js   (BROWSER_EXE로 크롬 경로를 줄 수 있다) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let pw;
try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const CO = G.Company, out = {}, said = [], asks = [];
      let picks = [], chanceAll = null;
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.alert = async () => true; G.UI.toast = () => {};
      const realChance = G.U.chance; G.U.chance = p => chanceAll == null ? realChance(p) : chanceAll;
      G.Scenes.land.landBattle = async () => 'win';
      function fresh(y, m, d, cityId, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.gold = (o && o.gold != null) ? o.gold : 200000; s.player.fame = 3000; s.fleet.cargo = {};
        if (cityId != null) { const c = G.CITY_DATA[cityId]; s.loc = { mode: 'city', city: cityId, lon: c.lon, lat: c.lat }; }
        said.length = 0; asks.length = 0; picks = []; chanceAll = null; return s;
      }
      function days(s, n) { for (let i = 0; i < n; i++) G.Game.newDay(); }
      const cargo = id => (G.Game.state.fleet.cargo[id] || { q: 0 }).q;
      function give(id, q, from) { CO.addCargo(id, q, 10, from == null ? 'x' : from); }
      // ── 자료
      const bad = [];
      G.COMPANIES.forEach(co => {
        if (!G.CITY_DATA[co.hq]) bad.push(co.id + ' hq');
        co.mono.forEach(g => { if (!G.GOOD[g]) bad.push(co.id + ' mono ' + g); });
        co.posts.forEach(p => { if (!G.CITY_DATA[p.c]) bad.push(co.id + ' post ' + p.c); p.g.forEach(g => { if (!G.GOOD[g]) bad.push(co.id + ' good ' + g); }); });
        co.cand.forEach(c => { if (!G.CITY_DATA[c]) bad.push(co.id + ' cand ' + c); });
        co.navy.concat([co.ship]).forEach(t => { if (!G.SHIP[t]) bad.push(co.id + ' ship ' + t); });
      });
      out.data = bad;
      // ── 1530 리스본: 인도청 본부 · 입회
      let s = fresh(1530, 3, 1, 0);
      out.bld0 = G.Scenes.city.buildings(G.CITY_DATA[0]).filter(b => /company|factory|exchange/.test(b.kind)).map(b => b.kind + ':' + (b.arg || '') + ':' + b.name);
      const pt = G.COMPANY.pt;
      out.fee = CO.fee(pt); out.block0 = CO.joinBlock(pt);
      const g0 = s.player.gold, jr = CO.join(pt);
      out.join = { member: s.company.member, rank: s.company.rank, shares: s.company.shares.pt, paid: g0 - s.player.gold, jr };
      out.joinVoc = CO.joinBlock('es');
      // 단추 수 (나온다 포함 8개 이하)
      const C = G.Scenes.city;
      out.btnHQ = C.B.company.menu(G.CITY_DATA[0], 'pt').filter(Boolean).length + 1;
      // ── 코친 상관: 창고 · 주문서
      s.loc = { mode: 'city', city: 154, lon: G.CITY_DATA[154].lon, lat: G.CITY_DATA[154].lat };
      const coc = G.CITY_DATA[154];
      out.bldCoc = C.buildings(coc).filter(b => /factory/.test(b.kind)).map(b => b.name);
      out.btnFA = C.B.factory.menu(coc).filter(Boolean).length + 1;
      out.q0 = CO.quotaLeft(pt, 154);
      const cost = CO.costPrice(coc, 'pepper'), mk = G.R.buyPrice(coc, 'pepper');
      const paid = CO.buyWarehouse(coc, pt, 'pepper', 30);
      out.wh = { cost, mk, paid, pepper: cargo('pepper'), left: CO.quotaLeft(pt, 154), over: CO.buyWarehouse(coc, pt, 'pepper', 999) > 0 ? CO.quotaLeft(pt, 154) : 'none' };
      // 주문서
      const leg = CO.legOffer(coc, pt, 1);
      out.leg = leg && { to: G.CITY_DATA[leg.to].name, g: leg.g, q: leg.q, mult: leg.mult, days: leg.days };
      if (leg) {
        CO.chainTake(coc, pt, leg); give(leg.g, leg.q, 154);
        const dest = G.CITY_DATA[leg.to]; s.loc = { mode: 'city', city: dest.id, lon: dest.lon, lat: dest.lat };
        out.chainHere = CO.chainHere(dest); s.loc.via = 'sea';
        // 그 도시에 들어서면 바로 넘길지 묻는다 → 넘기고 다음 고리를 잇는다
        const gA = s.player.gold; picks = ['go', 'next']; await CO.arrival(dest, { arrive: true });
        const ch2 = s.company.chain;
        out.d1 = { value: s.player.gold - gA, bonus: ch2 ? ch2.pot : 0, gold: s.player.gold - gA, left: cargo(leg.g), isPost: CO.isPost(pt, dest.id) };
        out.nx = ch2 && { leg: ch2.leg, to: G.CITY_DATA[ch2.to].name, mult: ch2.mult };
        if (ch2) { s.day = ch2.limit + 1; const msgs = CO.daily(); out.broken = { chain: s.company.chain, msg: msgs.map(m => m.text).join('|') }; }
      }
      // ── 독점품 납품 (리스본)
      s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat };
      const lis = G.CITY_DATA[0], pep = cargo('pepper'), mp = CO.monoPrice(lis, pt, 'pepper'), sp = G.R.sellPrice(lis, 'pepper');
      const gD = s.player.gold, dv = CO.deliverMono(lis, pt, 'pepper', pep);
      out.deliver = { pep, mp, sp, value: dv.value, got: s.player.gold - gD, left: cargo('pepper'), merit: s.company.merit };
      out.btnHQ2 = C.B.company.menu(lis, 'pt').length + 1;
      // ── 세관 (비회원)
      s = fresh(1530, 3, 1, 0); s.loc.via = 'sea'; give('pepper', 50, 154);
      chanceAll = true; picks = ['duty']; let g1 = s.player.gold; await CO.customs(lis);
      out.cusDuty = { paid: g1 - s.player.gold, pepper: cargo('pepper'), q: asks[0] && asks[0].o };
      s.day += 1; chanceAll = true; picks = ['hide']; G.U.chance = p => p >= 0.39 ? (p === 0.4 || p === 0.65 ? true : false) : false;
      g1 = s.player.gold; await CO.customs(lis);
      G.U.chance = p => chanceAll == null ? realChance(p) : chanceAll;
      out.cusHide = { pepper: cargo('pepper'), fine: g1 - s.player.gold, smug: s.company.smug.pt, noto: s.player.notoriety, feeUp: CO.fee(pt) };
      // 회원은 검사하지 않는다
      s = fresh(1530, 3, 1, 0); CO.join(pt); give('pepper', 20, 154); chanceAll = true; asks.length = 0; await CO.customs(lis); out.cusMember = asks.length;
      // ── 회사 임무: 계급별 게시판
      s.loc = { mode: 'city', city: 154, lon: coc.lon, lat: coc.lat };
      out.off1 = CO.offers(coc, pt).map(o => o.kind);
      s.company.rank = 2; s.company.merit = 500;
      out.off2 = CO.offers(coc, pt).map(o => o.kind + ':' + o.pay);
      // 귀환 대선단
      let cv = null; for (let i = 0; i < 8 && !cv; i++) { cv = CO.offers(coc, pt).filter(o => o.kind === 'convoy')[0]; if (!cv) s.day += 30; }
      CO.accept(cv);
      s.loc = { mode: 'sea', lon: coc.lon - 2, lat: coc.lat - 2 };
      chanceAll = true; s.company.mission.next = 0;
      const raid = CO.spawn([]);
      out.raid = raid && { co: raid.co, kind: raid.kind, hostile: raid.hostile, n: raid.n, text: CO.encounterText(raid).slice(0, 20) };
      CO.afterBattle(raid, 'retreat', [], null); out.cvLost = s.company.mission && s.company.mission.ships + '/' + s.company.mission.ships0;
      CO.fled(raid); out.cvFled = s.company.mission && s.company.mission.ships;
      chanceAll = null;
      const pxBefore = CO.px('pt');
      s.loc = { mode: 'city', city: 0, lon: lis.lon, lat: lis.lat, via: 'sea' };
      const gC = s.player.gold; await CO.arrival(lis, { arrive: true });
      out.cvHome = { got: s.player.gold - gC, mission: s.company.mission, px: CO.px('pt') > pxBefore };
      // 단속
      s.loc = { mode: 'city', city: 154, lon: coc.lon, lat: coc.lat };
      s.day += 40; let pa = null; for (let i = 0; i < 8 && !pa; i++) { pa = CO.offers(coc, pt).filter(o => o.kind === 'patrol')[0]; if (!pa) s.day += 30; }
      CO.accept(pa); const tgt = G.CITY_DATA[pa.at], dk = tgt.dock || [tgt.lat, tgt.lon];
      s.loc = { mode: 'sea', lon: dk[1], lat: dk[0] }; chanceAll = true;
      const pn = CO.spawn([]); out.patrol = pn && { co: pn.co, kind: pn.kind, label: pn.label, lawful: CO.lawful(pn) };
      CO.afterBattle(pn, 'win', [{ side: 'en', sunk: true }, { side: 'en', captured: true }, { side: 'en', sunk: true }, { side: 'en', sunk: true }], []);
      out.patrolGot = s.company.mission.got + '/' + s.company.mission.n;
      chanceAll = null; s.loc = { mode: 'city', city: 154, lon: coc.lon, lat: coc.lat };
      const gP = s.player.gold, rp = CO.report(coc); out.patrolRep = { got: s.player.gold - gP, rp: !!rp, mission: s.company.mission };
      // 경쟁사 나포 (통상원)
      s.day += 40; let pz = null; for (let i = 0; i < 8 && !pz; i++) { pz = CO.offers(coc, pt).filter(o => o.kind === 'prize')[0]; if (!pz) s.day += 30; }
      out.prizeOffer = pz && { rival: pz.rival, at: G.CITY_DATA[pz.at].name, name: pz.name };
      if (pz) {
        CO.accept(pz); const pc = G.CITY_DATA[pz.at], pd = pc.dock || [pc.lat, pc.lon];
        s.loc = { mode: 'sea', lon: pd[1], lat: pd[0] }; chanceAll = true;
        const zn = CO.spawn([]); out.prize = zn && { co: zn.co, label: zn.label, ships: zn.ships.join(',') };
        const esPx = CO.px('es'), gZ = s.player.gold;
        CO.afterBattle(zn, 'win', [{ side: 'en', type: zn.prizeShip, captured: true }, { side: 'en', type: 'galleon', sunk: true }], []);
        out.prizeWin = { gold: s.player.gold - gZ, got: s.company.mission.got, esDrop: CO.px('es') < esPx };
        chanceAll = null; s.loc = { mode: 'city', city: 0, lon: lis.lon, lat: lis.lat };
        const rz = CO.report(lis); out.prizeRep = rz && rz.pay;
      }
      // 상관 건설
      s.day += 40; s.loc = { mode: 'city', city: 154, lon: coc.lon, lat: coc.lat };
      let fo = null; for (let i = 0; i < 8 && !fo; i++) { fo = CO.offers(coc, pt).filter(o => o.kind === 'found')[0]; if (!fo) s.day += 30; }
      out.foundOffer = fo && { at: G.CITY_DATA[fo.at].name, need: fo.need };
      if (fo) {
        CO.accept(fo); const ft = G.CITY_DATA[fo.at];
        give('timber', fo.need.timber); give('cannon', fo.need.cannon); give('guns', fo.need.guns);
        s.loc = { mode: 'city', city: ft.id, lon: ft.lon, lat: ft.lat, via: 'sea' };
        picks = ['gift']; const gF = s.player.gold; await CO.arrival(ft, { arrive: true });
        out.found = { posts: (s.company.posts.pt || []).map(p => p.c), net: s.player.gold - gF, mission: s.company.mission, timber: cargo('timber'), bld: C.buildings(ft).filter(b => b.kind === 'factory').length };
      }
      // ── 주식 · 배당 · 귀띔
      s = fresh(1610, 6, 1, 24);
      out.bld24 = C.buildings(G.CITY_DATA[24]).filter(b => /company|factory|exchange/.test(b.kind)).map(b => b.kind + ':' + (b.arg || ''));
      out.btnEX = C.B.exchange.menu(G.CITY_DATA[24]).length + 1;
      const voc = G.COMPANY.voc, a0 = CO.ask(voc), gS = s.player.gold, bc = CO.buy(voc, 100);
      out.buy = { ask: a0, cost: bc, paid: gS - s.player.gold, n: s.company.shares.voc };
      const h0 = CO.hist(voc).length; days(s, 400);
      out.stock = { hist: CO.hist(voc).length - h0 + (CO.hist(voc).length >= G.BALANCE.company.stock.hist ? 99 : 0), px: Math.round(CO.px(voc)), divPer: Math.round(CO.divPer(voc)) };
      out.divLog = s.log.filter(l => /배당/.test(l.t || '')).length;
      s.company.ev = []; for (let i = 0; i < 6; i++) s.company.ev.push({ co: 'voc', id: 'fleet', at: s.day + 30 + i, post: 172, known: false });
      const tp = CO.tip(); out.tip = tp && { co: tp.co.id, text: tp.text.slice(0, 18), days: tp.days };
      const sold = CO.sell(voc, 40); out.sell = { got: sold, n: s.company.shares.voc };
      // 경쟁사 주식이 더 많으면 의심
      CO.join('eic'); out.eicJoin = s.company.member;
      out.doubt = CO.doubted();
      // 탈퇴와 대기
      CO.leave(); out.leave = { member: s.company.member, block: CO.joinBlock('voc') };
      // 다른 회사 사람: 그 회사 상관에서 막힌다
      s = fresh(1650, 1, 1, 168); CO.join('eic');
      const ban = G.CITY_DATA[168];
      out.fsBan = CO.factoriesAt(168).map(c => c.id);
      out.eicDests = CO.chainDests('eic', ban).map(t => t.name); out.eicLeg = !!CO.legOffer(ban, 'eic', 1);
      out.rivalOffers = CO.offers(ban, 'voc').length; out.rivalWh = CO.buyWarehouse(ban, 'voc', 'pepper', 10);
      out.btnFA2 = C.B.factory.menu(ban).length + 1;
      // 옛 저장: company 없이도
      delete G.Game.state.company; out.old = { box: CO.box().length > 0, daily: CO.daily().length >= 0, st: !!CO.state() };
      out.said = said.slice(0, 3);
      return out;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 6000));
    ok(r.data.length === 0, '자료: 도시·물건·배 이름이 모두 있다 ' + r.data.join(','));
    ok(r.bld0.some(x => /company:pt/.test(x)), '1530 리스본에 인도청 본부');
    ok(r.join.member === 'pt' && r.join.rank === 1 && r.join.shares > 0 && r.join.paid === r.fee, '입회: 출자금을 내고 사원·주식 ' + r.join.shares + '주');
    ok(/이미/.test(r.joinVoc), '한 회사만 (다른 회사는 막힌다): ' + r.joinVoc);
    ok(r.btnHQ <= 8 && r.btnHQ2 <= 8 && r.btnFA <= 8 && r.btnEX <= 8 && r.btnFA2 <= 8, '단추 8개 이하: 본부 ' + r.btnHQ + ' · 상관 ' + r.btnFA + '/' + r.btnFA2 + ' · 거래소 ' + r.btnEX);
    ok(r.bldCoc.length === 1, '코친에 상관');
    ok(r.wh.paid === r.wh.cost * 30 && r.wh.pepper === 30 && r.wh.left === r.q0 - 30 && r.wh.cost < r.wh.mk, '회사 창고: 원가 ' + r.wh.cost + ' < 교역소 ' + r.wh.mk + ' · 할당 ' + r.q0 + '→' + r.wh.left);
    ok(r.wh.over === 0, '할당량을 넘겨 살 수 없다');
    ok(r.leg && r.chainHere && r.d1 && r.d1.gold === r.d1.value && r.d1.bonus > 0, '중개 주문서 고리 1: 값 ' + (r.d1 && r.d1.value) + ' · 보너스 ' + (r.d1 && r.d1.bonus));
    ok(r.nx && r.nx.leg === 2 && r.nx.mult > r.leg.mult, '들어서자마자 넘기고 다음 고리를 이었다 (×' + (r.nx && r.nx.mult) + ')');
    ok(r.broken && r.broken.chain === null && /날아갔다/.test(r.broken.msg), '기한을 넘기면 사슬이 끊기고 보너스가 날아간다');
    ok(r.eicLeg && r.eicDests.length >= 3, '상관이 적은 회사도 거래처로 주문서를 잇는다 (EIC 반탐 → ' + r.eicDests.slice(0, 5).join('·') + ')');
    ok(r.deliver.value > 0 && r.deliver.mp > r.deliver.sp && r.deliver.left === 0, '독점품 납품: 시장 ' + r.deliver.sp + ' → 회사 ' + r.deliver.mp);
    ok(r.cusDuty.paid > 0 && r.cusDuty.pepper === 50, '세관: 신고하면 관세만 (' + r.cusDuty.paid + ')');
    ok(r.cusHide.pepper === 0 && r.cusHide.smug === 1 && r.cusHide.noto > 0 && r.cusHide.feeUp > r.fee, '세관: 숨기다 걸리면 몰수·벌금·악명·출자금 증가');
    ok(r.cusMember === 0, '회원은 세관이 뒤지지 않는다');
    ok(r.off1.every(k => k === 'patrol' || k === 'convoy') && r.off1.length >= 1, '사원 게시판: 단속·선단 ' + r.off1.join(' '));
    ok(r.off2.some(k => /^(convoy|found|prize)/.test(k)) && r.off2.length <= 3, '선장 게시판: 굵직한 일 ' + r.off2.join(' '));
    ok(r.raid && r.raid.co === 'raid' && r.raid.hostile, '귀환 선단을 노리는 습격대');
    ok(/^\d\/\d$/.test(r.cvLost || '') && +r.cvLost.split('/')[0] === +r.cvLost.split('/')[1] - 1 && r.cvFled === +r.cvLost.split('/')[0] - 1, '습격에 밀려 물러나면 1척, 도망쳐도 1척을 잃는다 (' + r.cvLost + ' → ' + r.cvFled + ')');
    ok(r.cvHome.got > 0 && r.cvHome.mission === null && r.cvHome.px, '본부에 닿으면 수수료 ' + r.cvHome.got + ' · 주가 오름');
    ok(r.patrol && r.patrol.lawful && r.patrolGot && /^(\d)\/\1$/.test(r.patrolGot), '단속: 배를 쳐부숴 ' + r.patrolGot);
    ok(r.patrolRep.got > 0 && r.patrolRep.mission === null, '단속 보고 → 보수 ' + r.patrolRep.got);
    ok(!!r.prizeOffer && (r.prize && r.prizeWin.gold > 0 && r.prizeWin.esDrop && r.prizeRep > 0), '경쟁사 나포: 화물 ' + (r.prizeWin && r.prizeWin.gold) + ' · 경쟁사 주가 하락 · 포상금 ' + r.prizeRep);
    ok(!!r.foundOffer && (r.found && r.found.posts.length === 1 && r.found.mission === null && r.found.bld === 1), '상관 건설: ' + (r.foundOffer && r.foundOffer.at) + '에 새 상관');
    ok(r.bld24.indexOf('company:voc') >= 0 && r.bld24.indexOf('exchange:') >= 0, '1610 암스테르담: VOC 본부 · 거래소');
    ok(r.buy.paid === r.buy.cost && r.buy.n === 100, '주식 100주를 샀다');
    ok(r.stock.hist >= 12 && r.divLog >= 1, '달마다 주가가 움직이고 1월에 배당 (' + r.stock.hist + '달 · 배당 ' + r.divLog + '번)');
    ok(r.tip && r.tip.co === 'voc', '중개인의 귀띔');
    ok(r.sell.got > 0 && r.sell.n === 60, '주식을 판다');
    ok(r.eicJoin === 'eic' && r.doubt === true, '경쟁사(VOC) 주식이 더 많으면 공헌이 덜 쌓인다');
    ok(r.leave.member === null && /한 해/.test(r.leave.block), '떠나면 한 해 동안 들 수 없다');
    ok(r.fsBan.indexOf('voc') >= 0 && r.rivalOffers === 0 && r.rivalWh === 0, '경쟁사 상관에서는 임무·창고가 막힌다');
    ok(r.old.box && r.old.st, '옛 저장(회사 자료 없음)도 열린다');
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '실패 ' + fail : '모두 통과');
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
