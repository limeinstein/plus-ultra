/* 후금 건국·청 국호 선포 (2026-11-01 사용자 요청) — node tests/houjin_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 허투알라의 칸 (1616~1617, 국내성·길림 또는 허투알라 둘레의 뭍): 조총을 판다(값 2.2배·악명·통행 패) / 인삼·담비 / 구경
   · ② 영원성 (1625.6~1626.2.21, 요동·북경): 원숭환의 군관 → 오문 보카로에게 홍이포(5000) → 요동에서 영원성 싸움 · 교역품 대포로 바로 · 기한을 넘기면 끝
   · ③ 원숭환의 옥 (1630.1.13~9.21, 북경): 뇌물로 빼내면 동료(1650까지) · 처형 소식이 달라진다 · 그만두면 역사대로
   · ④ 대청 (1636.5.15~, 심양): 차하르 옥새 · 절하지 않는 조선 사신 — 감싼다 · 배를 빌려 달라 (금화·악명)
   · 소식 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Houjin && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, HJ = G.Houjin, said = [], asked = [], out = {};
      let plan = [], landRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value), labels: opts.map(o => o.label) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = () => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1616, m: 1, d: 1 }; s.player.born = { y: 1590, m: 1, d: 1 }; delete s.life; delete s.houjin; s.player.gold = 30000; s.fleet.cargo = {};
        return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = HJ.pending(); if (p) await HJ.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      // ── 문
      let s = fresh();
      const gate = (y, m, d, c) => { at(s, y, m, d, c); s.houjin = { told: {} }; return HJ.pending(); };
      out.gates = { khan: gate(1616, 3, 1, 315), khanJilin: gate(1617, 3, 1, 313), khanLate: gate(1618, 3, 1, 315), khanMing: gate(1616, 3, 1, 189), ning: gate(1625, 8, 1, 189), ningEarly: gate(1625, 5, 1, 189), ningLate: gate(1626, 3, 1, 188), qing: gate(1636, 6, 1, 312), qingEarly: gate(1636, 4, 1, 312) };
      // ── ① 조총을 판다
      s = fresh(); s.fleet.cargo.guns = { q: 60, cost: 50 }; at(s, 1616, 3, 1, 315); let g0 = s.player.gold, n0 = s.player.notoriety || 0;
      await go(['guns']);
      out.guns = { v: s.houjin.khan, gold: s.player.gold - g0, left: s.fleet.cargo.guns && s.fleet.cargo.guns.q, noto: (s.player.notoriety || 0) - n0, seal: G.R.hasItem('houjin_seal'), khan: said.some(x => /나라 이름은 금/.test(x)) };
      // ── ① 뭍에서: 인삼·담비
      s = fresh(); s.date = { y: 1616, m: 5, d: 1 }; s.loc = { mode: 'land', lon: 124.9, lat: 41.7, party: 30 }; g0 = s.player.gold; plan = ['trade'];
      out.land = { r: await HJ.onLand(124.9, 41.7, { stop: () => {} }), v: s.houjin.khan, gold: g0 - s.player.gold, herbs: s.fleet.cargo.herbs && s.fleet.cargo.herbs.q, fur: s.fleet.cargo.fur && s.fleet.cargo.fur.q, far: await HJ.onLand(120, 41, {}) };
      // ── ② 영원성: 오문의 홍이포
      at(s, 1625, 8, 1, 189); await go(['quest']);
      out.ask = { v: s.houjin.ning, opts: asked[0] && asked[0].opts.join() };
      out.noCannon = (at(s, 1625, 9, 1, 189), HJ.pending());
      g0 = s.player.gold; at(s, 1625, 10, 1, 173); await go(['buy']);
      out.buy = { item: G.R.hasItem('houjin_cannon'), paid: g0 - s.player.gold, foundry: said.some(x => /보카로요/.test(x)) };
      g0 = s.player.gold; at(s, 1626, 2, 10, 189); landRes = ['win']; await go(['center']);
      out.ning = { v: s.houjin.ning, fire: s.houjin.fire, gone: !G.R.hasItem('houjin_cannon'), gold: s.player.gold - g0, wound: said.some(x => /일산이 기울고/.test(x)), battle: said.some(x => /\[육상전\] 누르하치의 팔기/.test(x)) };
      // ── ③ 원숭환의 옥: 뇌물
      out.jailEarly = (at(s, 1629, 12, 1, 188), HJ.pending());
      g0 = s.player.gold; at(s, 1630, 3, 1, 188); await go(['bribe']);
      out.jail = { v: s.houjin.yuan, paid: g0 - s.player.gold, join: hired('h_yuanchonghuan'), y: G.MATE.h_yuanchonghuan.y[1], died: said.some(x => /오늘 죽었소/.test(x)) };
      s.loc = { mode: 'sea', lon: 122, lat: 39 }; s.date = { y: 1630, m: 9, d: 22 }; out.execNews = HJ.daily().map(x => x.text).join(' | ');
      // ── ④ 대청: 사신을 감싼다 · 배를 빌려준다
      g0 = s.player.gold; n0 = s.player.notoriety || 0; at(s, 1636, 6, 1, 312); await go(['help', 'yes']);
      out.qing = { v: s.houjin.qing, envoys: s.houjin.envoys, ships: s.houjin.ships, gold: s.player.gold - g0, noto: (s.player.notoriety || 0) - n0, bow: said.some(x => /절하지 않소/.test(x)), yalu: said.some(x => /압록강이 얼면/.test(x)), name: said.some(x => /대청\(大淸\)/.test(x)) };
      // ── 교역품 대포로 바로 · 기한을 넘기면 끝 · 그만두면 역사대로
      s = fresh(); s.fleet.cargo.cannon = { q: 12, cost: 100 }; at(s, 1625, 12, 1, 188); g0 = s.player.gold; landRes = ['lose']; await go(['now', 'wall']);
      out.now = { v: s.houjin.ning, left: s.fleet.cargo.cannon && s.fleet.cargo.cannon.q, gold: s.player.gold - g0 };
      at(s, 1630, 3, 1, 188); await go(['no']); out.jailNo = s.houjin.yuan;
      s.loc = { mode: 'sea', lon: 122, lat: 39 }; s.date = { y: 1630, m: 9, d: 22 }; out.execNo = HJ.daily().map(x => x.text).join(' | ');
      s = fresh(); at(s, 1625, 8, 1, 189); await go(['quest']); at(s, 1626, 3, 1, 173); await go([]);
      out.late = { v: s.houjin.ning, buy: (at(s, 1626, 3, 2, 173), HJ.pending()) };
      // ── 소식
      s = fresh(); s.loc = { mode: 'sea', lon: 122, lat: 39 };
      const day = (y, m, d) => { s.date = { y, m, d }; return HJ.daily().map(x => x.text).join(' | '); };
      out.news = { jin: day(1616, 2, 17), sarhu: day(1619, 4, 18), ning: day(1626, 2, 22), nur: day(1626, 9, 30), qing: day(1636, 5, 15) };
      out.farNews = (s = fresh(), s.loc = { mode: 'sea', lon: -10, lat: 40 }, s.date = { y: 1616, m: 2, d: 17 }, HJ.daily().length);
      s = fresh(); s.date = { y: 1700, m: 1, d: 1 }; delete s.houjin; out.oldSave = HJ.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'houjin');
      out.journal = !!(HJ.daily && HJ.daily._journal);
      out.noSell = !!(G.ITEM.houjin_cannon && G.ITEM.houjin_cannon.noSell);
      return out;
    });
    console.log(JSON.stringify({ guns: r.guns, land: r.land, ning: r.ning, jail: r.jail, qing: r.qing, now: r.now, late: r.late }));
    const g = r.gates;
    ok(g.khan && g.khanJilin && !g.khanLate && !g.khanMing && g.ning && !g.ningEarly && !g.ningLate && g.qing && !g.qingEarly, '장면이 국내성·길림·요동·북경·심양에서 날짜에 맞게 열린다 ' + JSON.stringify(g));
    ok(r.guns.v === 'guns' && r.guns.gold === Math.round(85 * 50 * 2.2) && r.guns.left === 10 && r.guns.noto === 6 && r.guns.seal && r.guns.khan, '① 누르하치(나라 이름은 금) — 교역품 총 50통을 2.2배로 · 악명 +6 · 칸의 통행 패');
    ok(r.land.r && r.land.v === 'trade' && r.land.gold === 1500 && r.land.herbs === 15 && r.land.fur === 15 && r.land.far === false, '① 허투알라 둘레의 뭍에서도 — 인삼과 담비 가죽 (금화 1500 → 약재·모피 15통씩)');
    ok(r.ask.v === 'quest' && r.ask.opts === 'quest,no' && r.noCannon === false, '② 원숭환의 군관 — 대포가 없으면 오문에서 사 오겠다 · 빈손으로는 열리지 않는다');
    ok(r.buy.item && r.buy.paid === 5000 && r.buy.foundry, '② 오문의 보카로 주조장 — 홍이포 열 문 (금화 5000)');
    ok(r.ning.v === 'won' && r.ning.fire === 'center' && r.ning.gone && r.ning.gold === 14000 && r.ning.wound && r.ning.battle, '② 영원성 — 홍이포가 노란 일산(누르하치)을 맞힌다 · 값의 두 배 + 포상 (금화 +14000)');
    ok(r.jailEarly === false && r.jail.v === 'bribe' && r.jail.paid === 8000 && r.jail.join && r.jail.y >= 1650 && r.jail.died && /원 장군이 아니었다/.test(r.execNews), '③ 원숭환의 옥 — 뇌물로 빼내 동료 · 처형 소식에 「그 사람은 원 장군이 아니었다」');
    ok(r.qing.v === 1 && r.qing.envoys === 'help' && r.qing.ships === 'yes' && r.qing.gold === 5000 && r.qing.noto === 8 && r.qing.bow && r.qing.yalu && r.qing.name, '④ 대청 — 절하지 않는 조선 사신을 감싼다 · 「압록강이 얼면」 · 배를 빌려준다 (금화 5000 · 악명 +8)');
    ok(r.now.v === 'lost' && r.now.left === 2 && r.now.gold === Math.round(130 * 10 * 2), '② 교역품 대포 10통으로 바로 영원성 — 져도 성은 버틴다');
    ok(r.jailNo === 'no' && /능지처참/.test(r.execNo) && r.late.v === 'late' && r.late.buy === false, '③ 그만두면 역사대로 처형 · ② 기한을 넘기면 끝 (오문의 주조장도 닫힌다)');
    const n = r.news;
    ok(/허투알라/.test(n.jin) && /강홍립/.test(n.sarhu) && /홍이포/.test(n.ning) && /홍타이지/.test(n.nur) && /나덕헌/.test(n.qing) && r.farNews === 0, '소식 — 후금·사르후·영원성·누르하치의 죽음·대청 (먼 바다에서는 없음)');
    ok(r.oldSave === 0 && r.rumor && r.journal && r.noSell, '옛 저장 · 소문 · 일지 · 홍이포는 팔 수 없다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
