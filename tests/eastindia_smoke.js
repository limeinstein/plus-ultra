/* 동인도 회사의 탄생 (2026-11-04) — 런던 출자·정산 · 암스테르담 VOC 청약·배당·매도 · 수왈리·자야카르타·반다·암보이나의 위기와 네 동료
   node tests/eastindia_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const EI = G.EIndia, out = {}, said = [], asks = [], battles = [];
      let picks = [], fightRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value == want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { battles.push({ name, n, o }); return fightRes; };
      function fresh(y, m, d, city, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m, d }; s.player.gold = (o && o.gold != null) ? o.gold : 20000; s.fleet.cargo = {}; s.player.items = [];
        if (city != null) { const c = G.CITY_DATA[city]; s.loc = { mode: 'city', city, lon: c.lon, lat: c.lat }; }
        said.length = 0; asks.length = 0; battles.length = 0; fightRes = 'win'; return s;
      }
      const has = id => G.Game.state.mates.some(m => m.id === id);
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      function run(s, until) { const news = []; for (let i = 0; i < 20000 && G.U.dateNum(s.date) < until; i++) { s.date = G.U.addDays(s.date, 1); s.day++; EI.daily().forEach(x => news.push(x.text)); } return news; }
      out.data = { mates: G.EINDIA_MATES.map(id => G.MATE[id].g).join(''), figs: G.EINDIA_FIGS.every(id => G.HIST_FIG[id]) };
      // ① 런던 출자 3,000 → 잉글랜드 동인도 회사 주식 6주(액면) → 1604 이익 배당 1주 475 (2026-11-06 주식 하나로)
      let s = fresh(1600, 10, 1, 38); out.ePend = EI.pending(); picks = [3000]; await EI.check();
      out.eic = { inv: s.eindia.eic, gold: s.player.gold, sh: G.Company.state().shares.eic, founder: G.Company.state().founder.eic, item: hasItem('eic_charter'), smythe: said.some(t => t.startsWith('토머스 스마이스|')), lan: said.some(t => /레몬 즙/.test(t)), task: EI.html().replace(/<[^>]+>/g, ' '), again: EI.pending() };
      s.loc = { mode: 'sea', lon: 0, lat: 50 }; const n1 = run(s, 16040401);
      out.eicPay = { gold: s.player.gold, paid: s.eindia.eicPaid, news: n1.map(t => (t.match(/【([^】]+)】/) || [])[1]) };
      // ② 암스테르담 VOC 10,000 → VOC 주식 20주 → 1610 배당 75% → 설립 출자자 혜택은 10년 안 · 주식을 다 쥐고 있을 때만 → 1640 거래소에서 판다
      s = fresh(1602, 5, 1, 24); picks = [10000]; await EI.check();
      out.voc = { inv: s.eindia.voc, item: hasItem('voc_share'), lemaire: said.some(t => t.startsWith('이삭 르메르|')), sh: G.Company.state().shares.voc };
      s.loc = { mode: 'sea', lon: 0, lat: 50 }; run(s, 16100501); out.vocDiv = s.eindia.vocDiv;
      out.fdr = { y1610: G.Company.founder('voc') };
      s.date = { y: 1640, m: 1, d: 1 }; out.fdr.y1640 = G.Company.founder('voc');
      s.date = { y: 1605, m: 1, d: 1 }; G.Company.sell('voc', 1); out.fdr.sold1 = G.Company.founder('voc');
      s.date = { y: 1640, m: 1, d: 1 }; s.loc = { mode: 'city', city: 24, lon: G.CITY_DATA[24].lon, lat: G.CITY_DATA[24].lat }; const g1 = s.player.gold;
      out.sellPend = EI.pending(); const n19 = G.Company.state().shares.voc, bid = G.Company.bid('voc'); G.Company.sell('voc', n19);
      out.vocSell = { got: s.player.gold - g1, want: n19 * bid, left: G.Company.state().shares.voc || 0, px: EI.vocPrice() };
      // ③ 수왈리 — 해적과 싸워 마리암
      s = fresh(1612, 11, 1, 148); picks = ['help']; await EI.check();
      out.sw = { st: s.eindia.swally, mariam: has('mariam'), ring: hasItem('armenian_ring'), best: said.some(t => t.startsWith('토머스 베스트|')), alias: said.some(t => t.startsWith('아르메니아 아가씨|')), b: battles[0] && battles[0].name };
      s = fresh(1612, 11, 1, 148); picks = ['no']; await EI.check(); out.swNo = { how: s.eindia.swallyHow, again: EI.pending() }; s.day += 181; out.swNo.later = EI.pending();
      // ④ 자야카르타 — 금화로 / 싸움에 지면
      s = fresh(1619, 5, 1, 168); picks = ['bribe']; await EI.check();
      out.jk = { st: s.eindia.jakatra, kancana: has('kancana'), gong: hasItem('gamelan_gong'), gold: s.player.gold, coen: said.some(t => t.startsWith('얀 피터르스존 쿤|')), fights: battles.length };
      s = fresh(1619, 5, 1, 168); fightRes = 'lose'; picks = ['fight']; await EI.check(); out.jkLost = { how: s.eindia.jakatraHow, kancana: has('kancana') };
      // ⑤ 반다 (암보이나에서, 1621)
      s = fresh(1621, 6, 1, 172); picks = ['save']; await EI.check();
      out.bd = { st: s.eindia.banda, idris: has('idris'), seed: hasItem('nutmeg_seedling'), b: battles[0] && battles[0].name };
      // ⑥ 암보이나 (1623) — 웅변으로 / 감옥을 깬다
      s = fresh(1623, 3, 1, 172, { sk: { speech: 2 } }); picks = ['plead']; await EI.check();
      out.am = { st: s.eindia.amboyna, edmund: has('edmund'), ledger: hasItem('hale_ledger'), speult: said.some(t => t.startsWith('헤르만 판스페울트|')), fights: battles.length };
      s = fresh(1623, 3, 1, 172); picks = ['break']; await EI.check(); out.am2 = { st: s.eindia.amboyna, edmund: has('edmund'), pleadDis: asks[0].o.includes('plead!'), b: battles[0] && battles[0].name };
      out.amLate = (fresh(1623, 3, 10, 172), EI.pending());
      // 소식 · VOC 소식은 네덜란드 독립 전쟁에서 들었으면 빼기 · 옛 저장
      s = fresh(1600, 1, 1, null); s.loc = { mode: 'sea', lon: 0, lat: 50 }; EI.daily(); const n2 = run(s, 16240101);
      out.news = n2.map(t => (t.match(/【([^】]+)】/) || [])[1]);
      s = fresh(1602, 1, 1, null); s.loc = { mode: 'sea', lon: 0, lat: 50 }; s.dutchwar = { told: { voc: 1 } }; EI.daily(); out.vocDup = run(s, 16020501).length;
      s = fresh(1650, 1, 1, null); s.loc = { mode: 'sea', lon: 0, lat: 50 }; out.old = EI.daily().length;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.mates === 'ffmm' && r.data.figs, '미인 둘(마리암·칸차나) · 미남 둘(이드리스·에드먼드) · 실존 인물');
    ok(r.ePend && r.eic.inv === 3000 && r.eic.gold === 17000 && r.eic.sh === 6 && r.eic.founder === 6 && r.eic.item && r.eic.smythe && r.eic.lan && /3,000/.test(r.eic.task) && /6주/.test(r.eic.task) && !r.eic.again, '① 런던: 스마이스의 출자 명부 · 랭커스터의 레몬 즙 · 금화 3,000 → 회사 주식 6주(액면) · 수첩에 몫');
    ok(r.eicPay.paid === 2850 && r.eicPay.gold === 19850 && r.eicPay.news.includes('동인도 회사 특허장') && r.eicPay.news.includes('동인도 회사의 정산'), '① 특허장 소식 · 1604년 첫 항해 — 1주에 이익 475 (6주 → 2,850), 주식은 그대로');
    ok(r.voc.inv === 10000 && r.voc.sh === 20 && r.voc.item && r.voc.lemaire && r.vocDiv === 7500, '② 암스테르담: 이삭 르메르 · VOC 청약 10,000 → 20주 · 1610년 첫 배당 75%(메이스) = 7,500');
    ok(r.fdr.y1610 === true && r.fdr.y1640 === false && r.fdr.sold1 === false, '② 설립 출자자 혜택: 1610 있음 · 1640(10년 넘음) 없음 · 한 주라도 팔면 없음');
    ok(!r.sellPend && r.vocSell.got === r.vocSell.want && r.vocSell.got > 0 && r.vocSell.left === 0 && r.vocSell.px > 1, '② VOC 주식은 하나 — 따로 팔던 몫은 없고 회사 주식으로 판다 (' + r.vocSell.got + '닢 · 액면의 ' + r.vocSell.px.toFixed(2) + '배)');
    ok(r.sw.st === 'won' && r.sw.mariam && r.sw.ring && r.sw.best && r.sw.alias && /해적/.test(r.sw.b) && r.swNo.how === 'leave' && r.swNo.again === false && r.swNo.later === true, '③ 수왈리 해전의 혼란 — 해적과 싸워 마리암 하코비안 · 물러서면 180일 뒤 다시');
    ok(r.jk.st === 'bribe' && r.jk.kancana && r.jk.gong && r.jk.gold === 17500 && r.jk.coen && r.jk.fights === 0 && r.jkLost.how === 'lost' && !r.jkLost.kancana, '④ 자야카르타의 불 — 금화로 피란길을 열어 칸차나 · 싸움에 지면 다음에');
    ok(r.bd.st === 'won' && r.bd.idris && r.bd.seed && /반다/.test(r.bd.b), '⑤ 반다의 비극 — 육두구 묘목을 안은 이드리스');
    ok(r.am.st === 'plead' && r.am.edmund && r.am.ledger && r.am.speult && r.am.fights === 0 && r.am2.st === 'break' && r.am2.edmund && r.am2.pleadDis && /보초/.test(r.am2.b) && !r.amLate, '⑥ 암보이나 — 웅변으로 변호하거나 감옥을 깨 에드먼드 헤일 · 처형 뒤엔 없다');
    ok(JSON.stringify(r.news) === JSON.stringify(['동인도 회사 특허장', '연합 동인도 회사', '수왈리 해전', '바타비아', '반다의 비극', '암보이나 사건']) && r.vocDup === 0 && r.old === 0, '소식 여섯 · VOC는 독립 전쟁에서 들었으면 다시 안 알림 · 옛 저장');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
