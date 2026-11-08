/* 콜론의 탐사 — 두 번째·세 번째·네 번째 항해 (2026-11-08 사용자 요청) — node tests/colonvoy_smoke.js   (BROWSER_EXE=크롬 경로)
   · 지도의 함대(colon2·colon3·colon4b — noDelay) · ⓐ 카디스의 열일곱 척 · 바다에서 만나면: ① 과들루프 ② 라 나비다드 ③ 라 이사벨라 ④ 쿠바의 맹세 ⑤ 파리아 만
     ⑨ 과나하의 카누 ⑩ 벨렌 ⑪ 자메이카 ⑫ 월식 ⑬ 구원(포라스 · 멘데스가 부하로) · 항구: ⑥ 롤단 ⑦ 쇠사슬 · 사슬의 편지 ⑧ 폭풍 · 멘데스의 편지 · 마지막 겨울
   · newworld의 출자로 믿음 +1 · 보바디야·월식의 진실이면 적 · 신호(SF.talk) · 쳐부수면 적 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.ColonVoy && G.World && G.SeaFolk, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, CV = G.ColonVoy, said = [], asked = [], out = {};
      let plan = [], landRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value), dis: opts.filter(o => o.dis).map(o => o.value) }); return plan.length ? plan.shift() : opts[opts.length - 1].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => true;
      G.Game.passDays = async (n) => { const s = G.Game.state, d = G.U.dayIndex(s.date) + n; const t = G.U.fromDayIndex ? G.U.fromDayIndex(d) : null; if (t) s.date = { y: t.y, m: t.m, d: t.d }; else s.date = { y: 1502, m: 7, d: 1 }; return []; };
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'ES', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; s.fleet.food = 300; s.fleet.water = 300; s.fleet.cargo = {}; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const onFleet = (s, exId, y, m, d) => { s.date = { y, m, d }; const p = CV.fleetPos(exId); s.loc = { mode: 'sea', lon: p ? p.lon + 0.4 : 0, lat: p ? p.lat + 0.3 : 0 }; return p; };
      const reset = (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; };
      const go = async (choices, land) => { reset(choices, land); const p = CV.pending(); if (p) await CV.check(); return p; };
      const sea = async (choices, land) => { reset(choices, land); const p = CV.seaPending(); if (p) await CV.atSea(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const has = (id) => G.R.hasItem(id);
      const b = () => CV.state();
      const saidAny = (re) => said.some(x => re.test(x));
      const exs = ['colon2', 'colon3', 'colon4b'].map(id => G.EXPEDITIONS.find(e => e.id === id));
      const M = G.MATE.cv_mendez;
      out.defs = { ex: exs.every(e => e && e.noDelay && G.DISC[e.discs[0]] && !G.DISC[e.discs[0]].rival), mate: !!M && M.eventOnly && M.g === 'm' && !!M.wed && M.sk.nav >= 2 && M.y[0] === 1503,
        items: ['cv_paria', 'cv_letter', 'cv_msg', 'cv_chain'].every(id => G.ITEM[id] && G.ITEM[id].noSell), figs: G.COLONVOY_FIGS.every(id => G.HIST_FIG[id]) };
      // ── 함대의 자리
      let s = fresh(1493, 11, 1);
      const pos = (id, y, m, d) => { s.date = { y, m, d }; return CV.fleetPos(id); };
      const near = (p, lat, lon, e) => p && Math.abs(p.lat - lat) < (e || 1.5) && Math.abs((((p.lon - lon) + 540) % 360) - 180) < (e || 1.5);
      out.pos = { guad: near(pos('colon2', 1493, 11, 7), 16.1, -61.85), nav: near(pos('colon2', 1493, 11, 30), 19.85, -72.25), isa: near(pos('colon2', 1494, 2, 1), 19.95, -71.08), cuba: near(pos('colon2', 1494, 6, 12), 21.85, -83.2),
        paria: near(pos('colon3', 1498, 8, 8), 10.4, -62.2), sdom: near(pos('colon3', 1499, 6, 1), 18.4, -69.92), guan: !!pos('colon4', 1502, 7, 30), belen: near(pos('colon4b', 1503, 2, 10), 9.05, -80.8),
        jam: near(pos('colon4b', 1503, 10, 1), 18.55, -77.2), map: (s.date = { y: 1494, m: 2, d: 1 }, G.SeaFolk.voyages().some(e => e.id === 'colon2')), after: pos('colon4b', 1504, 12, 1) === null };
      // ── ⓐ 카디스의 열일곱 척 — 말을 판다
      s = fresh(1493, 7, 1); at(s, 1493, 7, 1, 8); s.fleet.cargo.horses = { q: 20, cost: 50, from: 8, d: s.day, lots: {} };
      const g0 = s.player.gold; const m1 = await go(['horses']);
      out.muster = { open: m1, sold: s.fleet.cargo.horses.q === 10, gold: s.player.gold > g0, trust: CV.trust() === 1 };
      // ── 두 번째 항해: 과들루프(고향) · 나비다드(들어 준다) · 이사벨라(약재) · 쿠바(거절) + newworld 출자 +1
      s.newworld = s.newworld || { told: {}, pox: {}, poxAt: {} }; s.newworld.invest = 500;
      onFleet(s, 'colon2', 1493, 11, 7); const s1 = await sea(['home']);
      onFleet(s, 'colon2', 1493, 11, 30); const s2 = await sea(['listen']);
      s.fleet.cargo.herbs = { q: 10, cost: 50, from: 8, d: s.day, lots: {} };
      onFleet(s, 'colon2', 1494, 2, 1); const s3 = await sea(['herbs']);
      const tBefore = CV.trust();
      onFleet(s, 'colon2', 1494, 6, 12); const s4 = await sea(['refuse']);
      out.second = { guad: s1 && b().seen.guad === 'home', nav: s2 && b().seen.navidad === 'listen', isa: s3 && s.fleet.cargo.herbs.q === 5, cuba: s4 && CV.trust() === tBefore - 1, bonus: tBefore === 1 + 1 + 1 + 1, once: (onFleet(s, 'colon2', 1494, 6, 20), !CV.seaPending()) };
      // ── 세 번째: 파리아(해도) · 롤단(강화) · 쇠사슬(편지) · 그라나다의 여왕
      onFleet(s, 'colon3', 1498, 8, 8); const p1 = await sea(['sound']);
      at(s, 1499, 3, 1, 194); const r1 = await go(['mediate']);
      at(s, 1500, 9, 1, 194); const c1 = await go(['letter']); const chSaid = saidAny(/사슬을 차고 가겠소/) && has('cv_letter') && b().letter === 'carry';
      const tq = CV.trust(); at(s, 1500, 12, 10, 10); const q1 = await go([]);
      out.third = { paria: p1 && has('cv_paria'), roldan: r1 && b().roldanRes === 'ok', chains: c1 && chSaid, queen: q1 && b().letter === 'given' && !has('cv_letter') && CV.trust() === tq + 2 };
      // ── 네 번째: 폭풍(묶는다 · 건진다) · 과나하(윰베) · 벨렌(지킨다) · 자메이카(편지) · 멘데스의 편지 · 월식(침묵) · 구원(포라스 — 멘데스가 부하로)
      at(s, 1502, 6, 25, 194); const h1 = await go(['tie', 'save']);
      out.storm = { open: h1, seen: b().seen.hurricane === 'tie', date: s.date.y === 1502 && s.date.m === 7, saved: b().survivors === 1 };
      onFleet(s, 'colon4', 1502, 7, 30); const gq = await sea(['free']);
      onFleet(s, 'colon4b', 1503, 4, 10); const be = await sea(['defend'], ['win']); const beOk = b().mendez === 1 && saidAny(/\[육상전\] 벨렌/);
      onFleet(s, 'colon4b', 1503, 9, 1); const ja = await sea(['carry']);
      out.fourth = { guan: gq && b().yumbe === 'free', belen: be && beOk, jam: ja && has('cv_msg') && b().mendez === 2 };
      at(s, 1503, 10, 1, 194); const ms = await go(['press']);
      out.msg = { open: ms, ov: b().ovando === 'send', drop: !has('cv_msg'), noJoinYet: !hired('cv_mendez') && !CV.pending() };
      onFleet(s, 'colon4b', 1504, 2, 29); const ec = await sea(['silent']);
      const ships = s.fleet.ships; while (ships.length < 2) ships.push(JSON.parse(JSON.stringify(ships[0])));
      onFleet(s, 'colon4b', 1504, 4, 10); const rs = await sea(['take'], ['win']); const rsFight = saidAny(/\[육상전\] 포라스/);
      out.rescue = { eclipse: ec && b().seen.eclipse === 'silent', open: rs, fight: rsFight, done: b().rescue === 1, joined: hired('cv_mendez'), notAgain: (onFleet(s, 'colon4b', 1504, 4, 20), !CV.seaPending()) };
      // ── 마지막 겨울 (세비야 · 믿음 need 이상)
      at(s, 1504, 12, 10, 7); const tr = CV.trust(); const lw = await go([]); const lwQ = saidAny(/11월 26일/);
      out.last = { trust: tr >= CV.need(), open: lw, chain: has('cv_chain'), queenDead: lwQ };
      // ── 다른 갈래: 구원 없이 편지만 — 산토도밍고에서 멘데스 · 폭풍과 함께 떠난다(짐을 잃는다)
      s = fresh(1502, 6, 25); at(s, 1502, 6, 25, 194); s.fleet.cargo.wine = { q: 40, cost: 20, from: 194, d: s.day, lots: {} };
      const h2 = await go(['sail']);
      out.sail = { open: h2, lost: (s.fleet.cargo.wine ? s.fleet.cargo.wine.q : 0) === 20, hp: s.fleet.ships.every(sh => sh.hp < sh.maxHp) };
      onFleet(s, 'colon4b', 1503, 9, 1); await sea(['carry']); at(s, 1503, 10, 1, 194); await go(['self']);
      at(s, 1504, 8, 1, 194); const mc = await go([]);
      out.mcity = { open: mc, joined: hired('cv_mendez') };
      // ── 적: 보바디야 편 · 월식의 진실 · 신호를 받지 않는다 · 쳐부숴도 적
      s = fresh(1500, 9, 1); at(s, 1500, 9, 1, 194); await go(['bob']);
      out.bob = { foe: CV.trust() < 0 && b().side === 'bob', none: (onFleet(s, 'colon4b', 1503, 2, 1), !CV.seaPending()) };
      s = fresh(1504, 2, 29); onFleet(s, 'colon4b', 1504, 2, 29); await sea(['truth']);
      out.truth = { foe: b().foe === true, noRescue: (onFleet(s, 'colon4b', 1504, 4, 1), !CV.seaPending()) };
      reset([]); await G.SeaFolk.talk({ exp: exs[2] }, { name: '콜론' });
      out.truthTalk = saidAny(/나눌 말은 없소/);
      s = fresh(1494, 2, 1); s.flags['expBeat_colon2_0'] = 1; out.beaten = CV.trust() < 0 && (onFleet(s, 'colon2', 1494, 2, 1), !CV.seaPending());
      // ── 신호(SF.talk): colon2는 이 사건이 맡는다 — 열린 구간이면 그 장면 · colon4는 열린 구간이 없으면 원래 대사로
      s = fresh(1493, 11, 7); s.loc = { mode: 'sea', lon: 0, lat: 0 }; reset(['give']); await G.SeaFolk.talk({ exp: exs[0] }, { name: '콜론' });
      const tk1 = b().seen.guad === 'give';
      s = fresh(1502, 8, 22); reset([]); const v4 = await CV.talk({ exp: G.EXPEDITIONS.find(e => e.id === 'colon4') }, {});
      out.talk = { leg: tk1, colon4pass: v4 === false };
      // ── 옛 저장 · 소식
      s = fresh(1503, 1, 1); delete s.colonVoy; const st0 = CV.state();
      out.old = { told: st0.told.oath && st0.told.otro && st0.told.storm && !st0.told.belen && !st0.told.home };
      s.date = { y: 1504, m: 11, d: 8 }; const nw = CV.daily();
      out.news = { n: nw.length === 3 && nw.every(x => x.history), belen: nw.some(x => /벨렌/.test(x.text)), home: nw.some(x => /산루카르/.test(x.text)), again: CV.daily().length === 0 };
      // ── 소문 · 일지
      const ru = (G.EVENT_RUMORS || []).find(x => x.id === 'colonvoy');
      s = fresh(1500, 10, 15); const rt = ru ? ru.text(s) : [];
      s = fresh(1503, 9, 1); s.colonVoy = { told: {}, trust: 2, seen: { jamaica: 'carry' }, msg: 'carry' };
      const jh = CV.html();
      out.misc = { rumor: !!ru && rt.some(x => /쇠사슬/.test(x.y)), journal: /멘데스의 편지/.test(jh) && /자메이카 북쪽/.test(jh), court: G.Court && G.Court.taskHtml ? /콜론/.test(G.Court.taskHtml()) : true };
      // ── 말투
      const V = G.VOICES && G.VOICES.cv_mendez;
      const lines = V ? [].concat(V.greet.hi, V.greet.mid, V.greet.low, V.chat.hi, V.chat.mid, V.chat.low, V.again, V.drink, [V.drinkDone], V.lifeIntro) : [];
      out.voice = !!V && V.stories.length === 4 && lines.every(l => l.length <= 140) && !V.love;
      return out;
    });
    const all = (o) => Object.values(o).every(Boolean);
    ok(all(r.defs), '정의 — 지도 함대 셋(noDelay·발표 다툼 없는 대표 발견물) · 멘데스(사건으로만·남자·wed) · 소지품 넷(팔 수 없다) · 사람 ' + JSON.stringify(r.defs));
    ok(all(r.pos), '함대의 자리 — 과들루프·나비다드·이사벨라·쿠바의 맹세·파리아·산토도밍고·과나하·벨렌·자메이카 · 지도에 보인다 · 끝나면 없다 ' + JSON.stringify(r.pos));
    ok(all(r.muster), 'ⓐ 카디스의 열일곱 척 — 말 10통을 웃돈에 판다 · 믿음 ' + JSON.stringify(r.muster));
    ok(all(r.second), '두 번째 항해 — 보리켄의 여인들 · 나비다드 · 이사벨라 약재 · 쿠바의 맹세 거절(믿음 −1) · newworld 출자 +1 · 구간마다 한 번 ' + JSON.stringify(r.second));
    ok(all(r.third), '세 번째 항해 — 파리아 만의 해도 · 롤단 강화 · 쇠사슬(편지 · 「사슬을 차고 가겠소」) · 그라나다의 여왕(믿음 +2) ' + JSON.stringify(r.third));
    ok(all(r.storm), '⑧ 폭풍 — 배를 묶는다 · 7월 1일까지 날이 지난다 · 살아남은 사람들을 건진다 ' + JSON.stringify(r.storm));
    ok(all(r.fourth), '네 번째 항해 — 윰베를 집에 · 벨렌을 지킨다(멘데스와 인연) · 자메이카(멘데스의 편지) ' + JSON.stringify(r.fourth));
    ok(all(r.msg), '멘데스의 편지 — 오반도를 다그쳐 배를 보내게 한다 · 아직 부하는 아니다 ' + JSON.stringify(r.msg));
    ok(all(r.rescue), '⑫⑬ 월식(침묵) · 구원 — 포라스의 반란자들과 싸워 모두 태운다 · 멘데스가 부하가 된다 · 다시 열리지 않는다 ' + JSON.stringify(r.rescue));
    ok(all(r.last), '마지막 겨울 — 믿음 need 이상이면 세비야에서 「콜론의 사슬 한 고리」 · 여왕의 죽음 ' + JSON.stringify(r.last));
    ok(all(r.sail) && all(r.mcity), '금 함대와 함께 떠나면 짐 반을 잃고 배가 상한다 · 구원 없이 편지만 — 1504년 산토도밍고에서 멘데스가 부하로 ' + JSON.stringify([r.sail, r.mcity]));
    ok(all(r.bob) && all(r.truth) && r.truthTalk && r.beaten, '적 — 보바디야 편 · 월식의 진실(구원도 닫힌다) · 신호를 받지 않는다 · 지도의 함대를 쳐부숴도 적 ' + JSON.stringify([r.bob, r.truth, r.truthTalk, r.beaten]));
    ok(all(r.talk), '신호 — colon2는 열린 구간의 장면 · colon4는 열린 구간이 없으면 원래 대사로 넘긴다 ' + JSON.stringify(r.talk));
    ok(all(r.old) && all(r.news), '옛 저장(지난 소식은 띄우지 않는다) · 소식(벨렌·산루카르 · 한 번만) ' + JSON.stringify([r.old, r.news]));
    ok(all(r.misc) && r.voice, '소문 · 일지의 할 일 · 멘데스의 말투(옛이야기 넷 · 140자 이하 · 연정 없음) ' + JSON.stringify([r.misc, r.voice]));
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 5).join(' | ') : ''));
  } catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }
  finally { await browser.close(); }
})();
