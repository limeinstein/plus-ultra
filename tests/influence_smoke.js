/* 항구 영향도 · 식민지의 후원자 (2026-11-05)
   1602년 전에는 0 · 투자·회사(계급·주식·다른 나라 절반)·실적 · 값·재고·할당 이점 · 단계 알림 · 교역소 글 · 수첩
   식민지: 새 게임의 섬 식민지 · 고아(1510) · 짧은 점령(라스팔마스 1599·산토도밍고 1586)은 빼고 · 말라카(1641 포르투갈 → 네덜란드) · 테노치티틀란(사라짐) ·
   저장·불러오기에서 같은 사람 · 옛 저장(1650) · 제독의 개척 도시 · 콘솔 오류 0
   node tests/influence_smoke.js   (BROWSER_EXE로 크롬 경로) */
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
      const IF = G.Influence, CS = G.ColonySp, CO = G.Company, out = {}, toasts = [];
      G.UI.say = async () => {}; G.UI.ask = async (q, o) => o[0].value; G.UI.alert = async () => true; G.UI.toast = t => toasts.push(t);
      function fresh(y, m, cityId, nation) {
        G.State.newGame({ name: '주앙', nation: nation || 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d: 1 }; s.player.gold = 2000000; s.player.fame = 5000; s.fleet.cargo = {};
        if (cityId != null) { const c = G.CITY_DATA[cityId]; s.loc = { mode: 'city', city: cityId, lon: c.lon, lat: c.lat }; }
        CS.apply(); IF.bump(); toasts.length = 0; return s;
      }
      const C = id => G.CITY_DATA[id];
      function monthsTo(y, m) { const s = G.Game.state, news = []; while (s.date.y * 12 + s.date.m < y * 12 + m) { s.date = { y: s.date.y + (s.date.m === 12 ? 1 : 0), m: s.date.m === 12 ? 1 : s.date.m + 1, d: 1 }; s.day += 30; CS.daily().forEach(n => news.push(n.text)); } return news; }
      const sps = cid => G.SPONSORS.filter(o => o.colonial && o.city === cid);
      const open = cid => sps(cid).filter(o => G.Sponsor.open(o));
      // ── 1602 전: 영향도 없음
      let s = fresh(1590, 1, 0);
      const lis = C(0), goa = C(150);
      G.R.invest(0).amt = 500000;
      out.pre = { on: IF.on(), lv: IF.level(lis), mult: IF.mult(lis, 'pepper', 'buy'), tag: IF.tag(lis), box: IF.box() };
      // ── 1610: 투자만으로
      s.date = { y: 1610, m: 6, d: 1 }; IF.bump();
      const lvInv = G.R.investLv(0), p0 = IF.parts(lis);
      out.invest = { lv: lvInv, part: p0.invest, total: p0.total, tier: IF.tier(p0.total).name };
      const buyWith = G.R.buyPrice(lis, 'wine'), sellWith = G.R.sellPrice(lis, 'pepper');
      const saved = IF.mult; IF.mult = () => 1; const buyNo = G.R.buyPrice(lis, 'wine'), sellNo = G.R.sellPrice(lis, 'pepper'), stockNo = G.R.stockCapacity(lis, 'wine'), capNo = G.R.satCap(lis, 'pepper'); IF.mult = saved;
      out.price = { buyWith, buyNo, sellWith, sellNo, stockWith: G.R.stockCapacity(lis, 'wine'), stockNo, capWith: G.R.satCap(lis, 'pepper'), capNo };
      // ── 회사: 인도청(같은 나라) 선장 + 주식 → 고아
      CO.join('pt'); s.company.rank = 2; IF.bump();
      const pg = IF.parts(goa);
      out.member = { company: pg.company, via: pg.via, want: G.BALANCE.influence.member[2] + G.BALANCE.influence.stakeMax * Math.min(1, s.company.shares.pt * CO.px('pt') / G.BALANCE.influence.stakeFull) };
      const before = IF.level(goa); CO.buy('pt', 2000); const after = IF.level(goa);
      out.stake = { before, after };
      // 다른 나라 회사(VOC — 반탐)는 절반
      CO.leave(); s.company.cool = 0; CO.join('voc'); s.company.rank = 2; IF.bump();
      const ban = C(168), pb = IF.parts(ban);
      const K = G.BALANCE.influence; out.foreign = { company: pb.company, via: pb.via, half: (K.member[2] + K.stakeMax * Math.min(1, s.company.shares.voc * CO.px('voc') / K.stakeFull)) * K.foreignK };
      // 실적: 주문서 고리 (반탐) · 두 해 뒤 절반
      IF.add(ban, 6, 'voc'); const a1 = IF.parts(ban).act; s.day += 730; const a2 = IF.parts(ban).act;
      out.act = { a1, a2 };
      // 할당량 (반탐 VOC 상관)
      const q0 = CO.perk(2).quota, ql = CO.quotaLeft('voc', 168);
      out.quota = { base: q0, left: ql, lv: IF.level(ban) };
      // 단계 알림 · 교역소 글 · 수첩
      s.influence.tier = {}; toasts.length = 0; const said = IF.arrival(ban);
      out.arrive = { said: !!said, toast: toasts.join('|').slice(0, 80), again: IF.arrival(ban) };
      out.sub = G.Scenes.city.B.trade.sub(ban);
      out.box = IF.box().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      out.notice = IF.daily().map(n => n.text.slice(0, 30)); out.notice2 = IF.daily().length;
      // ── 식민지: 1480 새 게임
      s = fresh(1480, 5, 0);
      out.start = { groups: s.colonySp.groups.map(g => C(g.c).name + ':' + g.code + ':' + g.n), ceuta: open(84).map(o => o.title + '/' + G.Sponsor.holder(o)) };
      const f84 = G.R.facilities(C(84));
      out.ceutaFac = f84.mansion.filter(id => /^csp_/.test(id)).length;
      out.ceutaBld = G.Scenes.city.buildings(C(84)).filter(b => b.kind === 'mansion').map(b => b.name);
      out.spec = (() => { const o = open(84)[0]; const sp = G.Art.sponsorSpec(o, G.Sponsor.holderIndex(o)); return { style: sp.style, culture: sp.culture }; })();
      // 고아 1510
      const n1 = monthsTo(1511, 1);
      out.goa = { n: open(150).length, titles: open(150).map(o => o.title), news: n1.filter(t => /고아/.test(t)).length, newsAll: n1.length };
      // 산토도밍고 1586 잉글랜드 약탈 — 잉글랜드 무리가 생기지 않고 에스파냐 무리는 그대로
      monthsTo(1587, 6);
      out.sd = s.colonySp.groups.filter(g => g.c === 194).map(g => g.code + (g.until ? '×' : ''));
      // 라스팔마스 1599 네덜란드 — 짧은 점령
      monthsTo(1600, 6);
      out.lp = s.colonySp.groups.filter(g => g.c === 88).map(g => g.code + (g.until ? '×' : ''));
      // 테노치티틀란 — 1521년 도시가 사라진다
      out.teno = s.colonySp.groups.filter(g => g.c === 200).map(g => g.code + (g.until ? '×' : ''));
      // 말라카 1641 포르투갈 → 네덜란드
      monthsTo(1640, 6); const malBefore = open(160).map(o => o.colonial);
      monthsTo(1642, 6);
      out.mal = { before: malBefore, after: open(160).map(o => o.colonial), groups: s.colonySp.groups.filter(g => g.c === 160).map(g => g.code + (g.until ? '×' + g.until.toFixed(1) : '')) };
      out.total = { groups: s.colonySp.groups.length, open: G.SPONSORS.filter(o => o.colonial && G.Sponsor.open(o)).length };
      // 저장·불러오기: 같은 사람
      const snap = open(150).map(o => o.id + '|' + G.Sponsor.holder(o)).join(',');
      const json = JSON.stringify(G.Game.state);
      fresh(1480, 5, 0);
      G.Game.state = JSON.parse(json); CS.apply();
      out.reload = { same: open(150).map(o => o.id + '|' + G.Sponsor.holder(o)).join(',') === snap, n: G.SPONSORS.filter(o => o.colonial).length, noDup: new Set(G.SPONSORS.map(o => o.id)).size === G.SPONSORS.length };
      // 옛 저장 (1650, colonySp 없음) — 조용히, 고아는 1510년부터
      const old = JSON.parse(json); delete old.colonySp; old.date = { y: 1650, m: 3, d: 1 };
      G.Game.state = old; CS.apply();
      const g150 = old.colonySp.groups.filter(g => g.c === 150);
      out.old = { goaSince: g150[0] && Math.floor(g150[0].since), goaOpen: open(150).length, malCode: open(160).map(o => o.colonial)[0], groups: old.colonySp.groups.length };
      // 제독의 개척 도시: 도시를 세우면 곧바로 저택
      s = fresh(1560, 3, 0);
      const site = G.Colony.sites()[0];
      s.colony = { list: [{ id: 1000, key: site.key, nat: 'PT', owner: '포르투갈', name: null, stage: 0, built: [] }], call: null };
      G.Colony.apply(); const cc = G.CITY_DATA[1000];
      s.loc = { mode: 'city', city: 1000, lon: cc.lon, lat: cc.lat };
      G.UI.prompt = async () => '새 리스본'; G.UI.ask = async (q, o) => o[0].value; G.Colony.showStage = async () => {};
      const e = s.colony.list[0];
      try { await G.Colony.found(cc, e); } catch (err) { out.foundErr = String(err); }
      out.colony = { stage: e.stage, sps: open(1000).map(o => o.title), bld: G.Colony.buildings(G.CITY_DATA[1000]).filter(b => b.kind === 'mansion').map(b => b.name), toast: toasts.filter(t => /저택/.test(t)).length };
      return out;
    });
    if (process.env.VERBOSE) console.log(JSON.stringify(r, null, 1));
    ok(!r.pre.on && r.pre.lv === 0 && r.pre.mult === 1 && r.pre.tag === '' && r.pre.box === '', '1602년 전에는 영향도가 없다');
    ok(r.invest.lv >= 1 && r.invest.part === r.invest.lv * 7 && r.invest.total === r.invest.part, '1610 투자만으로 영향도 ' + r.invest.total + ' (' + r.invest.tier + ')');
    ok(r.price.buyWith < r.price.buyNo && r.price.sellWith > r.price.sellNo && r.price.stockWith > r.price.stockNo && r.price.capWith > r.price.capNo,
      '이점: 사는 값 ' + r.price.buyNo + '→' + r.price.buyWith + ' · 파는 값 ' + r.price.sellNo + '→' + r.price.sellWith + ' · 재고 ' + r.price.stockNo + '→' + r.price.stockWith);
    ok(Math.abs(r.member.company - r.member.want) < 0.01 && r.member.via === 'pt', '인도청 선장 + 주식: 고아 회사 몫 ' + r.member.company.toFixed(1));
    ok(r.stake.after > r.stake.before, '주식을 더 사면 오른다 (' + r.stake.before + '→' + r.stake.after + ')');
    ok(Math.abs(r.foreign.company - r.foreign.half) < 0.01 && r.foreign.via === 'voc', '다른 나라 회사(VOC)는 절반: ' + r.foreign.company.toFixed(1));
    ok(Math.abs(r.act.a1 - 3) < 0.01 && Math.abs(r.act.a2 - 1.5) < 0.01, '실적: 다른 나라 회사 일 6점 → 3 · 두 해 뒤 절반 ' + r.act.a2);
    ok(r.quota.left > r.quota.base, '회사 창고 할당이 는다 (' + r.quota.base + '→' + r.quota.left + ', 영향도 ' + r.quota.lv + ')');
    ok(r.arrive.said && /영향도/.test(r.arrive.toast) && r.arrive.again === null, '단계가 오르면 한 번 알린다');
    ok(/영향도 \d+ · /.test(r.sub), '교역소 메뉴 글: ' + r.sub);
    ok(/항구 영향도/.test(r.box) && /리스본 45 우세 투자 35/.test(r.box) && /그 밖에 \d+곳/.test(r.box), '수첩의 영향도 상자 (높은 항구부터 8곳 · 갈래별)');
    ok(r.notice.length === 1 && r.notice2 === 0, '1602년 소식은 한 번');
    ok(r.start.groups.length >= 3 && r.start.ceuta.length >= 2 && r.ceutaFac >= 2 && r.ceutaBld.length >= 2, '1480 새 게임: 섬 식민지 ' + r.start.groups.join(' ') + ' · 세우타 저택 ' + r.ceutaBld.join('·'));
    ok(r.spec.style === 'ib', '식민지 후원자는 본국 얼굴(ib)');
    ok(r.goa.n >= 2 && r.goa.n <= 3 && r.goa.news >= 1, '고아 1510: 후원자 ' + r.goa.titles.join('·') + ' · 소식');
    ok(r.sd.join() === 'ES', '산토도밍고 1586 약탈: 잉글랜드 무리 없음 (' + r.sd.join() + ')');
    ok(r.lp.join() === 'ES', '라스팔마스 1599 네덜란드의 짧은 점령: 무리 그대로 (' + r.lp.join() + ')');
    ok(r.teno.every(x => /×/.test(x)), '테노치티틀란(사라진 도시)의 무리는 닫힌다 (' + r.teno.join() + ')');
    ok(r.mal.before.every(x => x === 'PT') && r.mal.before.length >= 2 && r.mal.after.every(x => x === 'NL') && r.mal.after.length >= 2, '말라카 1641: 포르투갈 사람들이 떠나고 네덜란드 사람들 (' + r.mal.groups.join(' ') + ')');
    ok(r.reload.same && r.reload.noDup, '저장·불러오기: 같은 사람 · 중복 없음 (' + r.reload.n + '명)');
    ok(r.old.goaSince === 1510 && r.old.goaOpen >= 2 && r.old.malCode === 'NL', '옛 저장 1650: 고아는 1510년부터 · 말라카는 네덜란드 (' + r.old.groups + '곳)');
    ok(r.colony.stage === 1 && r.colony.sps.length >= 2 && r.colony.bld.length === r.colony.sps.length && r.colony.toast >= 1, '개척 도시를 세우면 저택 ' + r.colony.bld.join('·') + (r.foundErr ? ' 오류 ' + r.foundErr : ''));
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '실패 ' + fail : '모두 통과');
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
