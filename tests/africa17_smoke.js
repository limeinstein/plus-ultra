/* 17세기 아프리카의 다섯 이야기 (2026-11-03) — 쿠바(학의 보은) · 곤다르(라푼젤) · 케이프(방황하는 네덜란드인) · 음빌라 뒤 루안다(거위 치는 소녀) · 몸바사(리옹고)
   node tests/africa17_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
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
      const AF = G.Afr17, out = {}, said = [], asks = [], battles = [];
      let picks = [], fightRes = 'win', luck = true;
      G.U.chance = () => luck;
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, o: opts.map(x => x.value + (x.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value === want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = () => {};
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { battles.push({ name, n, o }); return fightRes; };
      const lot = q => ({ q, cost: 10, from: 0, d: 0, lots: { 0: { q, cost: 10 } } });
      function fresh(y, m, d, city, o) {
        const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); Object.assign(s0, (o && o.sk) || {});
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.mates = []; s.date = { y, m, d }; s.player.gold = (o && o.gold != null) ? o.gold : 1000; s.fleet.cargo = (o && o.cargo) || {}; s.player.items = [];
        if (city != null) { const c = G.CITY_DATA[city]; s.loc = { mode: 'city', city, lon: c.lon, lat: c.lat }; }
        said.length = 0; asks.length = 0; battles.length = 0; fightRes = 'win'; return s;
      }
      const has = id => G.Game.state.mates.some(m => m.id === id);
      const hasItem = id => G.Game.state.player.items.some(x => x.id === id);
      out.data = { mates: G.AFR17_MATES.map(id => G.MATE[id] && G.MATE[id].g + (G.MATE[id].eventOnly ? 'E' : '')).join(), figs: G.AFR17_FIGS.every(id => G.HIST_FIG[id]), items: ['kuba_velvet', 'senait_braid', 'buchu_pouch', 'kongo_rosary', 'liongo_utenzi'].every(id => G.ITEM[id]) };
      // ① 쿠바 — 뭍의 한 점
      let pt = null; const kb = G.BALANCE.afr17.kuba.box;
      for (let lat = kb[2] + 0.3; lat < kb[3] && !pt; lat += 0.3) for (let lon = kb[0] + 0.3; lon < kb[1] && !pt; lon += 0.3) { const t = G.Geo.terrain(lon, lat); if (t && t !== 'sea') pt = [lon, lat]; }
      out.pt = pt;
      let s = fresh(1630, 3, 1, null, { cargo: { maize: lot(15) } }); s.loc = { mode: 'land', lon: pt[0], lat: pt[1], party: 30 };
      picks = ['give', 'keep']; await AF.onLand(pt[0], pt[1]);
      out.kuba = { kasha: has('kasha'), velvet: hasItem('kuba_velvet'), maize: s.fleet.cargo.maize ? s.fleet.cargo.maize.q : 0, gift: s.afr17.kubaGift, shyaam: said.some(t => t.startsWith('샤암 왕|')), alias: said.some(t => t.startsWith('라피아 직녀|')), promise: said.some(t => /들여다보면 안 돼요/.test(t)), again: await AF.onLand(pt[0], pt[1]) };
      s = fresh(1630, 3, 1, null); s.loc = { mode: 'land', lon: pt[0], lat: pt[1], party: 30 }; picks = ['peek']; await AF.onLand(pt[0], pt[1]);
      out.peek = { kasha: has('kasha'), velvet: hasItem('kuba_velvet'), st: s.afr17.kuba, giftAsk: asks.some(a => /작물/.test(a.q)) };
      s = fresh(1620, 3, 1, null); s.loc = { mode: 'land', lon: pt[0], lat: pt[1], party: 30 }; out.kubaEarly = await AF.onLand(pt[0], pt[1]);
      // ② 곤다르 (악숨) — 신학으로 / 밤의 탈출 / 아무것도 없으면 말할 수 없다
      s = fresh(1640, 5, 1, 110, { sk: { theo: 2 } }); out.gPend = AF.pending(); picks = ['plead']; await AF.check();
      out.g1 = { st: s.afr17.gondar, senait: has('senait'), braid: hasItem('senait_braid'), fas: said.some(t => t.startsWith('파실리다스 황제|')), psalm: said.some(t => /주께서 나의 목자시니/.test(t)), rope: said.some(t => /머리카락을 촘촘히 땋은 줄/.test(t)) };
      s = fresh(1640, 5, 1, 110); picks = ['escape']; await AF.check(); out.g2 = { st: s.afr17.gondar, senait: has('senait'), b: battles[0] && battles[0].name, pleadDis: asks[0].o.includes('plead!') };
      s = fresh(1640, 5, 1, 110, { gold: 5000 }); picks = ['plead']; await AF.check(); out.g3 = { st: s.afr17.gondar, gold: s.player.gold };
      out.gEarly = (fresh(1630, 5, 1, 110), AF.pending());
      // ③ 케이프 — 소값 / 밤에 울타리(측량 2) / 모른 척
      s = fresh(1655, 6, 1, 101, { gold: 3000 }); picks = ['pay']; await AF.check();
      out.c1 = { st: s.afr17.cape, koa: has('koa'), gold: s.player.gold, hint: !!(s.hints && s.hints['ghost-ship']), riebeeck: said.some(t => t.startsWith('얀 판리베크|')), dutchman: said.some(t => /방황하는 네덜란드인/.test(t)) };
      s = fresh(1655, 6, 1, 101, { sk: { survey: 2 } }); picks = ['night']; await AF.check(); out.c2 = { st: s.afr17.cape, koa: has('koa'), fights: battles.length };
      s = fresh(1655, 6, 1, 101); picks = ['leave']; await AF.check(); out.c3 = { st: s.afr17.capeHow, koa: has('koa'), again: AF.pending() }; s.day += 181; out.c3.later = AF.pending();
      // ④ 루안다 — 몸값 / 숨겨 데려가다 막힘
      s = fresh(1666, 2, 1, 100, { gold: 3000 }); picks = ['pay']; await AF.check();
      out.m1 = { st: s.afr17.mbwila, luzia: has('luzia'), rosary: hasItem('kongo_rosary'), gold: s.player.gold, vidal: said.some(t => t.startsWith('비달 드 네그레이루스 총독|')), goose: said.some(t => /왕비 마마께서 아시면/.test(t)) };
      s = fresh(1666, 2, 1, 100); fightRes = 'lose'; picks = ['smuggle']; await AF.check(); out.m2 = { st: s.afr17.mbwilaHow, luzia: has('luzia') };
      out.mEarly = (fresh(1665, 9, 1, 100), AF.pending());
      // ⑤ 몸바사 — 밤바다 / 약재
      s = fresh(1697, 4, 1, 107); picks = ['escape']; await AF.check();
      out.z1 = { st: s.afr17.mombasa, zahra: has('zahra'), book: hasItem('liongo_utenzi'), saif: said.some(t => t.startsWith('사이프 빈 술탄|')), needle: said.some(t => /구리 바늘/.test(t)), b: battles[0] && battles[0].name };
      s = fresh(1697, 4, 1, 107, { cargo: { herbs: lot(12) } }); picks = ['medicine']; await AF.check(); out.z2 = { st: s.afr17.mombasa, zahra: has('zahra'), herbs: s.fleet.cargo.herbs ? s.fleet.cargo.herbs.q : 0 };
      out.zLate = (fresh(1698, 12, 20, 107), AF.pending());
      // 소식
      s = fresh(1624, 12, 1, null); s.loc = { mode: 'sea', lon: 0, lat: 0 }; AF.daily(); const news = [];
      for (let i = 0; i < 30000 && G.U.dateNum(s.date) < 16790101; i++) { s.date = G.U.addDays(s.date, 1); AF.daily().forEach(x => news.push(x.text)); }
      out.news = news.map(t => (t.match(/【([^】]+)】/) || [])[1]);
      s = fresh(1690, 1, 1, null); s.loc = { mode: 'sea', lon: 0, lat: 0 }; out.old = AF.daily().length;
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.data.mates === 'fE,fE,fE,fE,fE' && r.data.figs && r.data.items, '다섯 여인(동료·사건으로만) · 인물 · 기념품');
    ok(!!r.pt && r.kuba.kasha && r.kuba.velvet && r.kuba.maize === 5 && r.kuba.gift === 'maize' && r.kuba.shyaam && r.kuba.alias && r.kuba.promise && r.kuba.again === false, '① 쿠바: 샤암 왕에게 옥수수 · 「짜는 동안 들여다보지 마세요」 약속을 지키면 카샤가 동료로');
    ok(!r.peek.kasha && r.peek.velvet && r.peek.st === 'peek' && !r.peek.giftAsk && r.kubaEarly === false, '① 들여다보면 천만 남기고 떠난다 (학의 보은) · 작물이 없으면 묻지 않는다 · 1625년 전엔 없다');
    ok(r.gPend && r.g1.st === 'pardon' && r.g1.senait && r.g1.braid && r.g1.fas && r.g1.psalm && r.g1.rope, '② 곤다르: 머리 줄(라푼젤) · 신학으로 파실리다스를 설득해 세나이트 사면 → 동료');
    ok(r.g2.st === 'escape' && r.g2.senait && /웨흐니/.test(r.g2.b) && r.g2.pleadDis && r.g3.st === 'pardon' && r.g3.gold === 2000 && !r.gEarly, '② 밤의 탈출(수비대와 싸움) · 금화 3,000으로도 사면 · 신학·금화가 없으면 말할 수 없다');
    ok(r.c1.st === 'pay' && r.c1.koa && r.c1.gold === 1500 && r.c1.hint && r.c1.riebeeck && r.c1.dutchman, '③ 케이프: 소값을 치러 코아의 소를 돌려준다 → 「뭍에 닿지 못하는 배」(유령선 실마리) · 동료');
    ok(r.c2.st === 'night' && r.c2.koa && r.c2.fights === 0 && r.c3.st === 'leave' && !r.c3.koa && r.c3.again === false && r.c3.later === true, '③ 측량 2면 밤에 들키지 않고 소를 돌려보낸다 · 모른 척하면 동료가 되지 않지만 180일 뒤 다시');
    ok(r.m1.st === 'pay' && r.m1.luzia && r.m1.rosary && r.m1.gold === 500 && r.m1.vidal && r.m1.goose, '④ 루안다: 성당 담에 말을 거는 빨래꾼(거위 치는 소녀) · 총독에게 몸값 → 도나 루지아 동료');
    ok(r.m2.st === 'caught' && !r.m2.luzia && !r.mEarly, '④ 부두 수비대에 막히면 데려가지 못한다 · 음빌라 전투 전엔 없다');
    ok(r.z1.st === 'escape' && r.z1.zahra && r.z1.book && r.z1.saif && r.z1.needle && /오만/.test(r.z1.b) && r.z2.st === 'medicine' && r.z2.zahra && r.z2.herbs === 2 && !r.zLate, '⑤ 몸바사: 리옹고의 구리 바늘 · 필사본을 밤바다로 / 요새에 약재 → 음와나 자흐라 동료 · 함락 뒤엔 없다');
    ok(JSON.stringify(r.news) === JSON.stringify(['쿠바 왕국의 통합', '곤다르', '희망봉 보급기지', '첫 코이코이 전쟁', '음빌라 전투', '상살바도르의 몰락']) && r.old === 0, '소식 여섯 가지 차례대로 · 옛 저장은 몰아서 알리지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
