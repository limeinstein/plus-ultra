/* QA 개선안 A·B (2026-10-23) — node tests/qa_balance_fix_smoke.js   (BROWSER_EXE=크롬 경로)
   · 유행 need 5 · chance 0.3 · ×1.6 / 중계무역 buy 0.8 / 상인 첫 배 카라벨 / 선원 급료 / 명성 칭호·교역 명성 / 이야기 부하 품삯
   · 갤리어스 값 · 노 속력 ×0.8 / 엑스칼리버·명검 값 / 경쟁자가 발표한 뒤에도 찾는다 (계약은 그대로, 다른 단서는 사라짐) · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.World && G.Disc, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const B = G.BALANCE, R = G.R, out = {};
      out.fad = [B.fad.need, B.fad.chance, B.fad.mult];
      out.relay = B.relay.buy;
      out.batch = [B.batchDeal.floor, B.batchDeal.ceil];
      G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, UI = G.UI;
      UI.say = async () => {}; UI.alert = async () => {}; UI.ask = async () => 0; UI.toast = () => {};
      out.ship = s.fleet.ships[0].type;
      // 선원 급료
      const crew = s.fleet.crew, g0 = s.player.gold, mw = G.Cabins.wages();
      G.World.newMonth();
      out.wage = { crew, cw: G.World.crewWage(), paid: g0 - s.player.gold, mw };
      // 명성
      out.titles = [R.fameTitle(4999), R.fameTitle(5000), R.fameTitle(399999), R.fameTitle(400000)];
      out.tradeDiv = B.tradeFameDiv;
      // 이야기 부하 품삯
      out.tale = ['simcheong', 'cinderella', 'snow_white', 'joan_of_arc', 'little_mermaid', 'elizaveta', 'peter_pan', 'sleeping_beauty', 'gerda', 'don_quixote'].map(id => id + ':' + G.MATE[id].wage);
      // 배
      out.galleass = G.SHIP.galleass.price;
      out.kora = R.typeUpwind('korakora'); out.koraOar = G.SHIP.korakora.oar;
      out.oarK = B.oarK;
      // 무기
      out.items = ['excalibur', 'claymore', 'shivablade', 'runeblade', 'paladin', 'muramasa', 'achilles'].map(id => id + ':' + G.ITEM[id].price);
      out.armor = B.duelArmor;
      // ③ 경쟁자가 먼저 발표해도 뒤늦게 찾는다
      const D = G.Disc;
      s.hints.capegood = { src: 'test', d: 14870101 };      // 계약한 발견 (아프리카 남단)
      s.contract = { disc: 'capegood', sponsor: Object.keys(G.SPONSOR)[0], due: 14900101, advance: 1000 };
      s.hints.westroute = { src: 'test', d: 14870101 };     // 계약 없는 발견 (서회항로 — 1492-10 발표)
      s.date = { y: 1488, m: 2, d: 5 };
      const news1 = D.rivals();
      out.after1 = { rival: s.disc.capegood && s.disc.capegood.rival, contract: !!(s.contract && s.contract.disc === 'capegood'), hint: !!s.hints.capegood, news: news1.map(m => m.text).join(' | ') };
      s.date = { y: 1492, m: 11, d: 1 };
      D.rivals();
      out.after2 = { rival: s.disc.westroute && s.disc.westroute.rival, hint: !!s.hints.westroute, taken: D.taken('westroute'), addHint: D.addHint('westroute', 'tavern:0') };
      // 희망봉 앞바다: 경쟁자가 발표했어도 찾힌다
      s.loc = { mode: 'sea', lon: 20, lat: -35 };
      s.discDay = null;
      const hits = D.checkSea(20, -35);
      out.hit = hits.map(d => d.id);
      const pr = D.find(G.DISC.capegood, 'sea'); pr.catch(() => {});
      await new Promise(res => setTimeout(res, 50));
      out.found = { me: !!(s.disc.capegood && s.disc.capegood.me), foundByMe: D.foundByMe('capegood') };
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.fad.join() === '5,0.3,1.6' && r.relay === 0.8 && r.batch.join() === '0.8,1.2', '유행 need 5·확률 0.3·×1.6 · 중계 사는 값 ×0.8 · 흥정+일괄 하한 0.8·상한 1.2');
    ok(r.ship === 'caravel', '상인 첫 배는 카라벨');
    ok(r.wage.cw === r.wage.crew * 2 && r.wage.paid >= r.wage.cw + r.wage.mw, '선원 급료: ' + r.wage.crew + '명 × 2닢 = ' + r.wage.cw + '닢 (부하 급료 ' + r.wage.mw + '닢과 함께 ' + r.wage.paid + '닢 나감)');
    ok(r.titles.join() === '무명의 항해자,신참 모험가,위대한 탐험가,대항해자' && r.tradeDiv === 800, '칭호 5천·2만·6만·15만·40만 · 교역 명성 800닢에 1');
    ok(r.tale.join() === 'simcheong:250,cinderella:185,snow_white:185,joan_of_arc:185,little_mermaid:165,elizaveta:165,peter_pan:140,sleeping_beauty:0,gerda:0,don_quixote:0', '이야기 부하 품삯 — ' + r.tale.join(' '));
    ok(r.galleass === 45000 && r.oarK === 0.8 && r.kora && Math.abs(r.kora.up - r.koraOar * 0.8) < 0.02, '갤리어스 45,000닢 · 코라코라 맞바람(노) ' + (r.kora && r.kora.up.toFixed(2)) + ' = 노 ' + r.koraOar + ' × 0.8');
    ok(r.items.join() === 'excalibur:250000,claymore:60000,shivablade:70000,runeblade:70000,paladin:90000,muramasa:80000,achilles:80000' && r.armor.k === 60 && r.armor.cap === 0.4, '엑스칼리버 25만 · 명검 6만~9만 · 갑옷 방어는 비율(최대 40%)');
    ok(r.after1.rival && r.after1.contract && r.after1.hint && /계약은 그대로/.test(r.after1.news), '경쟁자가 발표해도 맺은 계약과 그 단서는 그대로');
    ok(r.after2.rival && !r.after2.hint && r.after2.taken && r.after2.addHint === false, '계약 없는 발견은 단서가 사라지고 새 단서도 안 붙는다');
    ok(r.hit.indexOf('capegood') >= 0 && r.found.me && r.found.foundByMe, '발표된 아프리카 남단도 그 바다에 가면 뒤늦게 찾는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
