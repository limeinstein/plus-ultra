/* 미남 항해사 — 동아시아 (2026-11-05 사용자 요청, 연애 없이 동료로만) — node tests/beauxea_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 혼노지의 불길(1582.5.20~6.21 쿄토) — 6.21까지 날이 지나간다 · 아케치 육상전 · 말로 붙잡는다/둘러멘다 · 지면 역사대로 · 철포를 바친 제독은 알아본다
   · ② 모란정의 서생(1599~1620 소주) — 몸값/소동 틈(육상전)/탕현조 · ③ 에도의 마상재(통신사가 에도에 머문 때) — 말을 사 준다/일기토
   · 셋 다 eventOnly · wed:'sea'(연애 없음) · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.BeauxEA && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, BX = G.BeauxEA, said = [], asked = [], out = {};
      let plan = [], landRes = [], duelRes = [], luck = false;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value), dis: opts.filter(o => o.dis).map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => luck;
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      G.Games = G.Games || {}; G.Games.duel = async (e) => { said.push('[일기토] ' + e.name); return duelRes.length ? duelRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land, duel) => { plan = choices.slice(); landRes = (land || []).slice(); duelRes = (duel || []).slice(); said.length = 0; asked.length = 0; const p = BX.pending(); if (p) await BX.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const b = () => G.Game.state.beauxEA;
      const IDS = ['bx_ranmaru', 'bx_okrang', 'bx_mujin'];
      out.mates = IDS.map(id => { const m = G.MATE[id]; return !!m && m.eventOnly && m.wed === 'sea' && m.g === 'm' && m.wage === 0 && !!m.desc && m.sk.nav >= 1; });
      out.inPool = (G.MATES || []).filter(m => IDS.includes(m.id)).length;
      // ── 문 (날짜·도시)
      let s = fresh(1582, 1, 1);
      out.gate = {
        ranEarly: (at(s, 1582, 5, 19, 193), BX.pending()), ranOn: (at(s, 1582, 5, 25, 193), BX.pending()), ranSakai: (at(s, 1582, 5, 25, 192), BX.pending()), ranLate: (at(s, 1582, 6, 22, 193), BX.pending()),
        okEarly: (at(s, 1598, 12, 31, 286), BX.pending()), okOn: (at(s, 1600, 3, 1, 286), BX.pending()), okLate: (at(s, 1621, 1, 1, 286), BX.pending()),
        mu36: (at(s, 1636, 12, 20, 297), BX.pending()), mu43: (at(s, 1643, 8, 1, 297), BX.pending()), mu55: (at(s, 1655, 10, 1, 297), BX.pending()), muOff: (at(s, 1640, 6, 1, 297), BX.pending()), muDongnae: (at(s, 1636, 12, 20, 226), BX.pending())
      };
      // ── ① 철포를 노부나가에게 바친 제독 · 말로 붙잡는다 (성공)
      s = fresh(1582, 1, 1); s.teppo = { stage: 2, met: 15800101, end: 'done', by: 'nobu' }; luck = true;
      at(s, 1582, 5, 25, 193); const fm0 = s.player.fame ? JSON.stringify(s.player.fame) : '';
      await go(['talk'], ['win']);
      out.R1 = { ran: b().ran, way: b().ranWay, date: s.date.m + '.' + s.date.d, hired: hired('bx_ranmaru'), knew: said.some(x => /남만 총 삼백 자루/.test(x)), fifty: said.some(x => /인간 오십 년/.test(x)), akechi: said.some(x => /적은 혼노지에 있다/.test(x)), fight: said.some(x => /\[육상전\] 혼노지를 에워싼 아케치의 군사 30/.test(x)), name: said.some(x => /그냥 「란」이라 불러/.test(x)), pct: (asked[0] || {}).opts, again: (at(s, 1582, 6, 21, 193), BX.pending()) };
      s.loc = { mode: 'sea', lon: 135, lat: 34 }; b().told = {}; s.date = { y: 1582, m: 6, d: 23 };
      out.newsSaved = BX.daily().map(x => x.text).join(' | ');
      // ── ① 철포 없이 · 말로 붙잡기 실패 → 둘러멘다 (그래도 산다)
      s = fresh(1582, 1, 1); luck = false; at(s, 1582, 6, 21, 193); await go(['talk'], ['win']);
      out.R2 = { ran: b().ran, way: b().ranWay, hired: hired('bx_ranmaru'), knew: said.some(x => /남만 총 삼백 자루/.test(x)), refuse: said.some(x => /그 말씀은 고맙습니다/.test(x)) };
      // ── ① 아케치에게 지면 역사대로
      s = fresh(1582, 1, 1); at(s, 1582, 6, 1, 193); await go(['carry'], ['lose']);
      out.R3 = { ran: b().ran, hired: hired('bx_ranmaru'), ash: said.some(x => /절은 잿더미였다/.test(x)), again: (at(s, 1582, 6, 21, 193), BX.pending()) };
      s.loc = { mode: 'sea', lon: 135, lat: 34 }; b().told = {}; s.date = { y: 1582, m: 6, d: 23 };
      out.newsLost = BX.daily().map(x => x.text).join(' | ');
      // ── ② 몸값을 치른다
      s = fresh(1600, 1, 1); let g0 = s.player.gold; at(s, 1600, 4, 1, 286); await go(['pay']);
      out.O1 = { ok: b().ok, way: b().okWay, paid: g0 - s.player.gold, hired: hired('bx_okrang'), song: said.some(x => /꽃처럼 아름다운 이여/.test(x)), salt: said.some(x => /이제 너는 내 것이다/.test(x)), sea: said.some(x => /노래로만 부르던 바다를 보고 싶어요/.test(x)), tangOpt: asked[0].opts.includes('tang'), again: (at(s, 1600, 5, 1, 286), BX.pending()) };
      s.loc = { mode: 'sea', lon: 121, lat: 31 }; out.newsOk = BX.daily().map(x => x.text).join(' | ');
      // ── ② 돈이 모자라면 몸값을 고를 수 없다 · 소동 틈에서 지면 팔려 간다
      s = fresh(1600, 1, 1); s.player.gold = 500; at(s, 1605, 4, 1, 286); await go(['steal'], ['lose']);
      out.O2 = { ok: b().ok, dis: asked[0].dis.includes('pay'), fight: said.some(x => /\[육상전\] 왕 대인의 하인들 14/.test(x)), hired: hired('bx_okrang') };
      // ── ② 탕현조가 배에 있으면 — 「정을 은으로 살 수 있다고 쓴 적은 없소」
      s = fresh(1600, 1, 1); s.mates.push({ id: 'h_tangxianzu', role: 'none', loyal: 80 }); at(s, 1610, 4, 1, 286); await go(['tang']);
      out.O3 = { ok: b().ok, way: b().okWay, tangOpt: asked[0].opts.includes('tang'), line: said.some(x => /정을 은으로 살 수 있다고 쓴 적은 없소/.test(x)), hired: hired('bx_okrang') };
      // ── ③ 말을 사 준다 / 일기토
      s = fresh(1636, 1, 1); g0 = s.player.gold; at(s, 1636, 12, 20, 297); await go(['horse']);
      out.M1 = { mu: b().mu, way: b().muWay, paid: g0 - s.player.gold, hired: hired('bx_mujin'), trick: said.some(x => /말 배 밑으로 사라졌다가/.test(x)), needle: said.some(x => /가는 침 하나가 꽂혀/.test(x)), taunt: said.some(x => /광대 재주/.test(x)), sea: said.some(x => /이제 바다를 타 보고 싶소/.test(x)), again: (at(s, 1637, 1, 5, 297), BX.pending()) };
      s.loc = { mode: 'sea', lon: 139, lat: 35 }; out.newsMu = BX.daily().map(x => x.text).join(' | ');
      s = fresh(1655, 1, 1); at(s, 1655, 10, 1, 297); await go(['duel'], [], ['lose']);
      out.M2 = { mu: b().mu, way: b().muWay, duel: said.some(x => /\[일기토\] 쇼군의 근시/.test(x)), res: b().muDuel, hired: hired('bx_mujin') };
      // ── 연애 없음 — 부하끼리의 썸·청혼에서 빠진다 (romance.js · matetalk.js 가 d.wed를 본다)
      out.noLove = IDS.every(id => !!G.MATE[id].wed);
      // ── 옛 저장 · 소문 · 일지 · 말투
      s = fresh(1600, 1, 1); delete s.beauxEA; out.oldSave = { n: BX.daily().length, told: !!G.Game.state.beauxEA.told.honnoji };
      const rum = (G.EVENT_RUMORS || []).find(x => x.id === 'beauxea');
      s = fresh(1582, 1, 1); s.date = { y: 1582, m: 5, d: 1 }; const rr = rum ? rum.text(s) : [];
      s.date = { y: 1636, m: 12, d: 1 }; const rr2 = rum ? rum.text(s) : [];
      out.rumor = { has: !!rum, ran: rr.some(x => /란마루/.test(x.y) && x.o), mu: rr2.some(x => /통신사/.test(x.y)) };
      out.journal = !!(BX.daily && BX.daily._journal);
      out.voice = IDS.map(id => { const v = G.VOICES && G.VOICES[id]; return !!v && v.stories.length === 4 && v.stories.every(st => st.l.length >= 3 && st.l.length <= 6) && !/아내|연인|사랑하|혼인하고/.test(JSON.stringify(v)); });
      out.voiceLen = IDS.every(id => { const v = G.VOICES[id]; const L = [].concat(v.greet.hi, v.greet.mid, v.greet.low, v.chat.hi, v.chat.mid, v.chat.low, v.again, v.drink, [v.drinkDone], v.lifeIntro); return L.every(x => x.length <= 140); });
      return out;
    });
    console.log(JSON.stringify({ R1: r.R1, R2: r.R2, O1: r.O1, M1: r.M1, M2: r.M2 }));
    ok(r.mates.every(Boolean) && r.inPool === 3, '동료 셋 — 사건으로만(eventOnly) · 남자 · 월급 0 · 항해 기술 · wed:\'sea\'');
    const g = r.gate;
    ok(!g.ranEarly && g.ranOn && !g.ranSakai && !g.ranLate && !g.okEarly && g.okOn && !g.okLate && g.mu36 && g.mu43 && g.mu55 && !g.muOff && !g.muDongnae, '문 — 혼노지 1582.5.20~6.21 쿄토 · 모란정 1599~1620 소주 · 마상재 통신사 세 번(1636·1643·1655) 에도');
    ok(r.R1.ran === 'saved' && r.R1.way === 'talk' && r.R1.date === '6.21' && r.R1.hired && r.R1.knew && r.R1.fifty && r.R1.akechi && r.R1.fight && r.R1.name && r.R1.again === false, '① 혼노지 — 6.21 새벽까지 · 아케치 육상전 · 「인간 오십 년」 · 말로 붙잡아 「란」으로 (철포를 바친 제독은 알아본다)');
    ok(r.R2.ran === 'saved' && r.R2.way === 'carry' && r.R2.hired && !r.R2.knew && r.R2.refuse, '① 말이 통하지 않으면 둘러메고 나온다 · 철포 없이는 알아보지 못한다');
    ok(r.R3.ran === 'lost' && !r.R3.hired && r.R3.ash && r.R3.again === false && /함께 쓰러졌다/.test(r.newsLost) && /주검도 찾지 못했다/.test(r.newsSaved), '① 지면 역사대로 · 소식 — 살렸으면 「란마루의 주검도 찾지 못했다」');
    ok(r.O1.ok === 'joined' && r.O1.way === 'pay' && r.O1.paid === 2000 && r.O1.hired && r.O1.song && r.O1.salt && r.O1.sea && !r.O1.tangOpt && r.O1.again === false && /옥랑이 사라졌다/.test(r.newsOk), '② 모란정 — 소금 상인의 몸값 2000을 치른다 · 「노래로만 부르던 바다」 · 소식');
    ok(r.O2.ok === 'lost' && r.O2.dis && r.O2.fight && !r.O2.hired, '② 금화가 모자라면 몸값을 못 고른다 · 소동 틈(하인 14)에서 지면 팔려 간다');
    ok(r.O3.ok === 'joined' && r.O3.way === 'tang' && r.O3.tangOpt && r.O3.line && r.O3.hired, '② 탕현조가 배에 있으면 「정을 은으로 살 수 있다고 쓴 적은 없소」');
    ok(r.M1.mu === 'joined' && r.M1.way === 'horse' && r.M1.paid === 1200 && r.M1.hired && r.M1.trick && r.M1.needle && r.M1.taunt && r.M1.sea && r.M1.again === false && /바다로 갔다/.test(r.newsMu), '③ 에도의 마상재 — 독침에 쓰러진 말 · 말을 사 준다(1200) · 「바다를 타 보고 싶소」 · 소식');
    ok(r.M2.mu === 'joined' && r.M2.way === 'duel' && r.M2.duel && r.M2.res === 'lose' && r.M2.hired, '③ 하타모토와 일기토 — 져도 독침 통이 떨어져 무진은 배에 오른다');
    ok(r.noLove, '연애 없음 — 셋 다 wed가 있어 부하끼리의 썸·제독의 청혼에서 빠진다');
    ok(r.oldSave.n === 0 && r.oldSave.told && r.rumor.has && r.rumor.ran && r.rumor.mu && r.journal, '옛 저장(혼노지 소식 안 뜸) · 소문(교토·통신사) · 일지');
    ok(r.voice.every(Boolean) && r.voiceLen, '말투 — 셋 다 옛이야기 4편 · 연애 말 없음 · 한 줄 140자 이하');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
