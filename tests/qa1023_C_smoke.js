/* QA 2026-10-23 C 그룹(역사 사건) 고침 점검 — node tests/qa1023_C_smoke.js
   [1] 메디치 기한 실패 때 맡긴 돈 회수 · [7] 로렌초는 1492년 4월까지 · [12] 이야기 모드 날 수 · [13] 아즈텍 결말 뒤 포카혼타스 30일
   [14] 드레이크 습격 1585~ · 무적함대 1588 · [15] 레오나르도 발명품 → 자택 보관함 · [27] 옛 저장의 아즈텍·잉카 소식
   [28] 레오나르도 일괄 보고 뒤 밤샘 이야기 한 번 · [37] 보물 지도 5만 · 2장 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const s = G.Game.state, out = {};
      G.UI.say = async () => {}; G.UI.toast = () => {}; G.UI.alert = async () => {};
      // [1] 메디치: 잉글랜드에서 20만을 받고(3단계) 기한을 넘긴다
      s.date = { y: 1491, m: 6, d: 1 };
      s.player.gold = 150000; s.player.bank = 100000; s.player.notoriety = 0;
      s.medici = { stage: 3, start: 14900101, due: 14910501, got: {}, visit: {} };
      let msgs = G.Medici.daily();
      out.med1 = { gold: s.player.gold, bank: s.player.bank, noto: s.player.notoriety, end: s.medici.end, line: msgs.some(m => /거두어 갔다 \(금화 200,000닢\)/.test(m.text)) };
      s.player.gold = 30000; s.player.bank = 0; s.player.notoriety = 0;
      s.medici = { stage: 3, start: 14900101, due: 14910501, got: {}, visit: {} };
      msgs = G.Medici.daily();
      out.med2 = { gold: s.player.gold, noto: s.player.notoriety, short: s.medici.short };
      s.player.gold = 30000; s.player.notoriety = 0;
      s.medici = { stage: 1, start: 14900101, due: 14910501, got: {}, visit: {} };
      G.Medici.daily();
      out.med3 = { gold: s.player.gold, noto: s.player.notoriety };
      delete s.medici;
      // [7] 로렌초는 1492년 4월까지 당주
      const med = G.SPONSOR.it_medici;
      s.date = { y: 1492, m: 4, d: 1 }; out.lor4 = G.Sponsor.holderName(med);
      s.date = { y: 1492, m: 1, d: 1 }; out.lor1 = G.Sponsor.holderName(med);
      s.date = { y: 1492, m: 5, d: 1 }; out.lor5 = G.Sponsor.holderName(med);
      // [12] 이야기 모드: dateNum 사이의 실제 날 수
      out.storyGap = G.Story._dnDay(15010105) - G.Story._dnDay(15001220);
      out.storyGap2 = G.Story._dnDay(15030301) - G.Story._dnDay(15010301);
      // [13] 아즈텍 결말 뒤 30일은 포카혼타스가 기다린다
      const havana = G.CITY_DATA.filter(c => c && c.name === '아바나')[0];
      s.loc = { mode: 'city', city: havana.id }; s.date = { y: 1521, m: 9, d: 1 };
      const di = G.U.dayIndex(s.date);
      s.aztec = { side: 'none', lock: 1, end: 'none', endDay: di, told: {} };
      out.poca0 = G.Pocahontas.pending();
      s.aztec.endDay = di - 31; out.poca31 = G.Pocahontas.pending();
      G.Aztec.evDay = di; out.pocaSameDay = G.Pocahontas.pending(); G.Aztec.evDay = null;
      // [27] 옛 저장(1525년)을 불러온다 — 아즈텍 소식·시장 사건이 한꺼번에 뜨지 않는다
      delete s.aztec; s.date = { y: 1525, m: 3, d: 1 };
      const evBefore = JSON.stringify((s.econ && s.econ.events) || s.events || []).match(/aztec/g);
      const azNews = G.Aztec.daily();
      const evAfter = JSON.stringify((s.econ && s.econ.events) || s.events || []).match(/aztec/g);
      out.az = { news: azNews.length, pox: s.aztec.told.pox, war: s.aztec.told.war, ev: (evAfter || []).length - (evBefore || []).length };
      delete s.incaFall; s.date = { y: 1540, m: 3, d: 1 };
      const ifNews = G.IncaFall.daily(); out.inca = { news: ifNews.length, gold: s.incaFall.told && s.incaFall.told.gold };
      delete s.incaFall; s.date = { y: 1534, m: 1, d: 9 }; out.incaFresh = G.IncaFall.daily().some(m => /잉카의 황금/.test(m.text));
      // [14] 드레이크: 1559년 기사라도 1585년 전에는 부르지 않는다 · 무적함대는 1588년
      s.date = { y: 1559, m: 2, d: 1 }; s.tudor = { div: { stage: 0 }, eliz: { stage: 2 }, knight: { day: s.day, y: 1559 } };
      s.day += 800; s.date = { y: 1561, m: 4, d: 1 }; G.Tudor.daily(); out.drake1561 = s.tudor.drake.call;
      s.day += 365 * 24; s.date = { y: 1585, m: 2, d: 1 }; G.Tudor.daily(); out.drake1585 = s.tudor.drake.call;
      s.day += 380; s.date = { y: 1586, m: 2, d: 15 }; G.Tudor.daily(); out.drake1586 = [s.tudor.drake.call, s.tudor.drake.done];
      s.day += 800; s.date = { y: 1588, m: 3, d: 1 }; G.Tudor.daily(); out.arm1588_3 = s.tudor.armada || null;
      s.day += 90; s.date = { y: 1588, m: 6, d: 1 }; const tn = G.Tudor.daily(); out.arm1588_6 = [s.tudor.armada, s.tudor.drake.call, tn.some(m => /무적함대/.test(m.text))];
      s.tudor = { div: { stage: 0 }, eliz: { stage: 2 }, knight: { day: s.day - 2000, y: 1583 }, calais: { rep: 1, stage: 'call' } };
      G.Tudor.daily(); out.armCalais = s.tudor.armada || null;
      delete s.tudor;
      // [15] 레오나르도 발명품 — 소지품이 가득하면 자택 보관함
      s.date = { y: 1500, m: 3, d: 1 };
      const keep = s.player.items.slice();
      while (G.R.slotsUsed() < G.R.ITEM_MAX) s.player.items.push({ id: 'compass', note: 'fill' + s.player.items.length });
      s.leo = { given: [], pend: ['leo_parachute'], home: ['leo_ornithopter'] };
      const st0 = G.R.storage().length;
      await G.Leo.present();
      out.leo = { storage: G.R.storage().slice(st0).map(x => x.id), home: s.leo.home === undefined };
      s.player.items = keep;
      // [28] 일괄 보고 중의 lateReport(batch)에서는 밤샘 이야기를 부르지 않고, batchReport가 끝난 뒤 한 번
      const nt = G.Leo.nightTalk; let calls = 0; G.Leo.nightTalk = async () => { calls++; };
      const leo = G.SPONSOR.it_leonardo, rel = G.Sponsor.rel('it_leonardo');
      const d = G.DISCOVERIES[0];
      s.disc = s.disc || {};
      try { await G.Sponsor.lateReport(leo, d, 1, { batch: true }); } catch (e) { out.lrErr = e.message; }
      out.batchMid = calls;
      out.relDone = rel.done || 0;
      out.batchWrapped = /nightTalk/.test(String(G.Sponsor.batchReport));
      G.Leo.nightTalk = nt;
      // [37] 보물 지도: 윗값 5만 · 2장까지
      out.thMax = 0;
      const Q = G.Quest, c0 = G.CITY_DATA[0];
      let q0 = null;
      for (let b = 0; b < 400; b++) { s.day = b * 10; const of = Q.offers(c0).filter(q => q.kind === 'treasure'); of.forEach(q => { out.thMax = Math.max(out.thMax, q.pay); q0 = q0 || q; }); }
      s.quests = (s.quests || []).filter(q => q.kind !== 'treasure');
      s.quests.push({ key: 'x1', kind: 'treasure', pay: 10000 }, { key: 'x2', kind: 'treasure', pay: 10000 });
      let found = false;
      for (let b = 0; b < 200 && !found; b++) { s.day = b * 10; found = Q.offers(c0).some(q => q.kind === 'treasure'); }
      out.thOfferFull = found;
      s.player.gold = 1e6;
      out.thAccept = q0 ? Q.canAccept(q0) : 'noq';
      s.quests = s.quests.filter(q => q.key !== 'x1' && q.key !== 'x2');
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.med1.gold === 0 && r.med1.bank === 50000 && r.med1.noto === 50 && r.med1.end === 'fail' && r.med1.line, '[1] 메디치 기한 실패: 소지금 15만 + 예금 5만을 거두고 알림 한 줄');
    ok(r.med2.gold === 0 && r.med2.short === 170000 && r.med2.noto === 50 + 17, '[1] 모자란 17만 → 악명 +17 더');
    ok(r.med3.gold === 30000 && r.med3.noto === 50, '[1] 아직 20만을 받기 전(1단계) 실패면 돈은 그대로');
    ok(r.lor1 === '로렌초 데 메디치' && r.lor4 === '로렌초 데 메디치' && r.lor5 === '피에로 데 메디치', '[7] 1492년 1~4월은 로렌초, 5월부터 피에로');
    ok(r.storyGap === 16 && r.storyGap2 === 730, '[12] 이야기 모드 날 수: 1500.12.20→1501.1.5 = 16일, 두 해 = 730일');
    ok(!r.poca0 && r.poca31 && !r.pocaSameDay, '[13] 아즈텍 결말 당일·같은 날 장면 뒤에는 포카혼타스가 뜨지 않고, 31일 뒤엔 뜬다');
    ok(r.az.news === 0 && r.az.pox === 1 && r.az.war === 1 && r.az.ev === 0, '[27] 1525년 옛 저장: 아즈텍 소식·천연두·정복 전쟁 시장 사건이 뜨지 않는다');
    ok(r.inca.news === 0 && r.inca.gold === 1 && r.incaFresh, '[27] 1540년 옛 저장: 잉카의 황금 없음 · 1534.1.9 제때면 그대로 뜬다');
    ok(!r.drake1561 && r.drake1585 === 1 && r.drake1586[0] === 2 && r.drake1586[1] === 1, '[14] 1559년 기사: 1561년엔 부르지 않고 1585년에 습격 ①, 한 해 뒤 ②');
    ok(r.arm1588_3 === null && r.arm1588_6[0] === 'call' && r.arm1588_6[1] === 0 && r.arm1588_6[2], '[14] 무적함대는 1588년 5월 말 뒤에 (그 전에는 아님), 남은 습격은 지나간다');
    ok(r.armCalais === null, '[14] 칼레 해전에 불린 제독에게는 드레이크의 무적함대가 따로 열리지 않는다');
    ok(r.leo.storage.indexOf('leo_parachute') >= 0 && r.leo.storage.indexOf('leo_ornithopter') >= 0 && r.leo.home, '[15] 발명품: 소지품이 가득하면 자택 보관함 · 옛 l.home도 보관함으로');
    ok(r.batchWrapped, '[28] 일괄 보고(SP.batchReport)가 끝난 뒤 밤샘 이야기를 한 번 부르도록 감쌌다');
    ok(r.batchMid === 0, '[28] 일괄 보고 중(lateReport batch)에는 밤샘 이야기가 끼어들지 않는다' + (r.lrErr ? ' (lateReport: ' + r.lrErr + ')' : ''));
    ok(r.thMax > 0 && r.thMax <= 50000, '[37] 보물 지도 사례 윗값 5만 (가장 큰 것 ' + r.thMax + ')');
    ok(!r.thOfferFull && /2장/.test(r.thAccept || ''), '[37] 보물 지도 2장을 가졌으면 새 지도가 붙지 않고 받을 수도 없다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
