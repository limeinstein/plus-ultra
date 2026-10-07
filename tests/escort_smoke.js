/* 상선 호위 (tests/escort_smoke.js) — node tests/escort_smoke.js   (BROWSER_EXE=크롬 경로)
   교역소의 호위 요청(열흘 단위로 같은 요청) → 맡으면 상인의 배가 따라온다(내 함대·짐칸·선원과 따로) → 함대가 그 배보다 빨리 가지 못하고 해적이 더 꾄다
   → 목적지에 닿으면 상인이 제 돈으로 싣는다 → 떠난 항구로 데려오면 이익의 일부(적어도 품삯) · 기한을 넘기면 절반 · 너무 늦으면 떠난다
   → 해전에서는 기함 뒤에 숨는 아군 배, 잃으면 실패 · 그만두기 · 저장/옛 저장 · 튜토리얼에서는 나오지 않음. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const T0 = Date.now();
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg + (process.env.VERBOSE ? '  [' + ((Date.now() - T0) / 1000).toFixed(0) + 's]' : '')); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
  // 느린 swiftshader에서 그림 칠하기(rAF)가 시험을 굶기지 않게, 칠하기는 시험이 박자를 정한다
  await page.addInitScript(() => {
    const TT = window.TT = { raf: [], auto: true, n: 0 };
    window.requestAnimationFrame = cb => { TT.raf.push(cb); return ++TT.n; };
    TT.pump = () => { const q = TT.raf; TT.raf = []; q.forEach(cb => { try { cb(performance.now()); } catch (e) { console.error(e); } }); };
    setInterval(() => { if (TT.auto) TT.pump(); }, 16);
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Escort, null, { timeout: 90000 });
    let r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, R = G.R, E = G.Escort, B = G.BALANCE.escort;
      await G.Game.ensureGeo(); TT.auto = false;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35;
      const lis = G.CITY_DATA[0];
      const said = []; let winAns = 'yes';
      const say0 = UI.say, win0 = UI.window, toast0 = UI.toast, conf0 = UI.confirm;
      UI.say = async t => { said.push(String(t)); }; UI.toast = () => {}; UI.confirm = async () => true;
      UI.window = o => ({ result: Promise.resolve(winAns), _html: (out.winHtml = (o.title + ' ' + o.html).replace(/<[^>]+>/g, ' ')) });
      // 확률을 1로: 요청이 반드시 나온다
      const ch0 = B.chance; out.noChance = (B.chance = 0, E.offer(lis)) === null; s.escort = null; B.chance = 1;
      const o = E.offer(lis), o2 = E.offer(lis);
      out.offer = o && [o.from, G.CITY_DATA[o.to].name, G.GOOD[o.good].name, G.SHIP[o.type].name, o.name, o.days, o.len, o.plan, o.share].join('|');
      out.same = o === o2 || JSON.stringify(o) === JSON.stringify(o2);
      const dest = G.CITY_DATA[o.to], dist = G.Geo.dist(lis.lon, lis.lat, dest.lon, dest.lat);
      out.dist = dist >= B.dist[0] && dist <= B.dist[1] && dest.port && dest.goods.includes(o.good) && !lis.goods.includes(o.good);
      out.margin = R.sellPrice(lis, o.good) + '>' + R.buyPrice(dest, o.good);
      const mi = E.menuItem(lis); out.menu = mi && mi.label + ':' + mi.sub; out.todo = E.todo(lis).map(t => t.text).join('/');
      out.tradeMenu = G.Scenes.city.B.trade.menu.length >= 1;
      // 거절 → 그 열흘 동안은 다시 나오지 않는다
      winAns = 'no'; await E.propose(lis, o); out.declined = E.offer(lis) === null && !E.now();
      s.escort.no = null;
      // 맡는다
      const o3 = E.offer(lis); winAns = 'yes';
      const cap0 = R.fleetCap(), crewMin0 = R.crewMin(), n0 = s.fleet.ships.length, known0 = s.known.includes(o3.to);
      s.escort.said = null; await E.atTrade(lis);
      const n = E.now();
      out.accept = !!n && n.stage + ':' + (n.due - s.day) + ':' + n.ship.type + ':' + n.ship.crew + ':' + n.ship.guns.n + ':' + !!n.ship.escort;
      out.window = /호위 요청/.test(out.winHtml) && /받는 몫/.test(out.winHtml) && /기한/.test(out.winHtml);
      out.separate = R.fleetCap() === cap0 && R.crewMin() === crewMin0 && s.fleet.ships.length === n0 && E.seaShips(s.fleet.ships).length === n0 + 1;
      out.known = s.known.includes(n.to) + ':' + known0;
      out.pitch = said.some(t => /호위|함대에 넣어/.test(t)) && said.every(t => !/\{|\}|undefined|NaN/.test(t));
      out.noOffer = E.offer(lis) === null; out.menu2 = E.menuItem(lis).label + ':' + E.menuItem(lis).sub;
      out.html = E.html().replace(/<[^>]+>/g, ' '); out.panel = E.panelHtml().replace(/<[^>]+>/g, ' ');
      // 속력: 상인 배보다 빨리 가지 못한다
      const wind = { dir: 0, spd: 1 }, env = null, save = s.escort.now;
      s.escort.now = null; const v0 = R.fleetSpeed(Math.PI, wind, env);
      s.escort.now = save; const v1 = R.fleetSpeed(Math.PI, wind, env);
      let mv = R.shipSpeed(n.ship, Math.PI, wind, env);
      out.speed = v0.toFixed(3) + '→' + v1.toFixed(3) + ' (상선 ' + mv.toFixed(3) + ')'; out.speedOk = v1 <= v0 + 1e-9 && v1 > 0;
      const slow0 = n.ship.type; n.ship.type = 'cog'; n.ship.sails = G.SHIP.cog.sails.slice(); const fast = s.fleet.ships[0]; const t0 = fast.type; fast.type = 'caravel'; fast.sails = G.SHIP.caravel.sails.slice();
      s.escort.now = null; const a0 = R.fleetSpeed(Math.PI / 2, wind, env); s.escort.now = save; const a1 = R.fleetSpeed(Math.PI / 2, wind, env);
      out.slowed = a1 < a0 && !!R.fleetInfo.escort; out.slowTxt = a0.toFixed(3) + '→' + a1.toFixed(3);
      n.ship.type = slow0; n.ship.sails = G.SHIP[slow0].sails.slice(); fast.type = t0; fast.sails = G.SHIP[t0].sails.slice();
      out.pirate = E.pirateK();
      // 저장·불러오기
      const back = G.State.deserialize(G.State.serialize()); out.save = back.escort.now.ship.type === n.ship.type && back.escort.now.to === n.to;
      // 목적지에 닿는다: 상인이 제 돈으로 싣는다
      const gold0 = s.player.gold, dep0 = R.buyPrice(dest, n.good);
      s.day += n.days; said.length = 0;
      await E.arrival(dest);
      out.load = n.stage + ':' + n.q + ':' + n.cost + ':' + (s.player.gold === gold0) + ':' + (R.buyPrice(dest, n.good) >= dep0);
      out.loadSaid = said.join(' / ').slice(0, 90);
      out.pirate2 = E.pirateK(); out.status = E.statusText();
      // 다른 항구에서는 아무 일도 없다
      await E.arrival(G.CITY_DATA[3]); out.other = !!E.now() && E.now().stage === 'back';
      // 떠난 항구로: 팔고 몫을 준다
      s.day += n.days; said.length = 0;
      const f0 = s.player.fame, tr0 = G.Fame.get('tr'), so0 = G.Fame.get('so'), fee = Math.round(n.days * 2 * B.feeDay), late0 = E.late();
      await E.arrival(lis);
      const pay = s.player.gold - gold0;
      out.home = pay + ':' + fee + ':' + (pay >= fee) + ':' + late0 + ':' + (G.Fame.get('tr') - tr0) + ':' + (G.Fame.get('so') - so0) + ':' + !E.now() + ':' + (s.escort.cool - s.day) + ':' + s.escort.done;
      out.homeSaid = said.join(' / ').slice(0, 110);
      out.cool = E.offer(lis) === null && E.menuItem(lis) === null;
      out.payNum = pay; out.cost = n.cost; out.q = n.q;
      // ---- 기한을 넘기면 절반
      const again = async () => { s.escort = null; s.day += 40; winAns = 'yes'; const of = E.offer(lis); await E.propose(lis, of, false); return E.now(); };
      let m = await again(); const destB = G.CITY_DATA[m.to];
      await E.arrival(destB);
      s.day = m.due + 3; const d1 = E.daily(), d2 = E.daily();
      const expect = (() => { const g = m.good; let rev = 0, q = m.q, left = q, ch = Math.max(1, Math.ceil(q / 10)); const mk = JSON.stringify(R.market(lis.id)); while (left > 0) { const k = Math.min(ch, left); rev += R.sellPrice(lis, g) * k; R.onSell(lis, g, k); left -= k; } s.markets && 0; Object.assign(R.market(lis.id), JSON.parse(mk)); return Math.max(Math.round(m.days * 2 * B.feeDay), Math.round(Math.max(0, rev - m.cost) * m.share)); })();
      out.warn = d1.length + ':' + d2.length + ':' + (d1[0] ? d1[0].text.slice(0, 30) : '');
      const g1 = s.player.gold, fm1 = s.player.fame; await E.arrival(lis);
      out.late = (s.player.gold - g1) + ':' + Math.round(expect * B.late) + ':' + (s.player.fame - fm1);
      // ---- 너무 늦으면 다음 항구에서 떠난다
      m = await again(); s.day = m.due + Math.round((m.due - m.start) * B.grace) + 2; const fm2 = s.player.fame; s.player.fame = Math.max(s.player.fame, 300); G.Fame.sync(); const fm2b = s.player.fame;
      await E.arrival(G.CITY_DATA[3]); out.gone = !E.now() + ':' + (s.player.fame - fm2b) + ':' + s.escort.lost;
      // ---- 그만둔다
      m = await again(); const fm3 = s.player.fame; out.quit = (await E.quit()) + ':' + !E.now() + ':' + (s.player.fame - fm3);
      // ---- 해전의 결과: 배를 잃으면 실패, 살아남으면 내구만 옮긴다
      m = await again(); const fm4 = s.player.fame, lines = [];
      E.afterBattle([{ escort: true, alive: true, hp: 7.4 }], 'win', lines); out.batKeep = !!E.now() && E.now().ship.hp === 7 && lines.length === 0;
      E.afterBattle([{ escort: true, alive: false, sunk: true, hp: 0 }], 'win', lines); out.batLost = !E.now() + ':' + (s.player.fame - fm4) + ':' + lines.length + ':' + /호위 실패/.test(lines[0] || '');
      m = await again(); const fm5 = s.player.fame; E.afterBattle([{ escort: true, alive: true, hp: 20 }], 'flaglost', []); out.batScatter = !E.now() + ':' + (s.player.fame - fm5);
      // ---- 튜토리얼·옛 저장
      s.escort = null; s.day += 40; s.tut = { step: 0, f: {} }; out.tut = E.offer(lis) === null; delete s.tut;
      delete s.escort; out.old = E.now() === null && E.pirateK() === 1 && E.speedK(1, 0, wind, env) === 1 && E.html() === '' && E.panelHtml() === '' && E.seaShips(s.fleet.ships) === s.fleet.ships && E.daily().length === 0;
      // 다음 단계(실제 바다·해전)를 위해 다시 맡아 둔다
      m = await again(); out.ready = !!m;
      UI.say = say0; UI.window = win0; UI.toast = toast0; UI.confirm = conf0; B.chance = ch0;
      return out;
    });
    ok(r.noChance && r.offer && r.same, '요청: ' + r.offer + ' — 열흘 동안 같은 요청, 확률 0이면 없음');
    ok(r.dist && r.menu && /호위 요청/.test(r.menu) && /호위를 청하는 상인/.test(r.todo), '목적지는 거리 안의 항구, 그곳 특산물을 실어 온다 (' + r.margin + ') · 교역소 메뉴 「' + r.menu + '」 · 할 일 판');
    ok(r.declined, '거절하면 그 열흘 동안은 다시 청하지 않는다');
    ok(/^out:\d+:\w+:\d+:\d:true$/.test(r.accept) && r.window && r.pitch && /true/.test(r.known), '맡는다: ' + r.accept + ' · 조건 창 · 상인의 말에 빈칸 없음 · 목적지를 해도에');
    ok(r.separate && r.noOffer && /호위 중인 상인/.test(r.menu2), '상인의 배는 내 함대·짐칸·선원과 따로 따라온다 · 메뉴 「' + r.menu2 + '」');
    ok(/상선 호위/.test(r.html) && /호위/.test(r.panel), '수첩 「계약·의뢰」와 함대 현황판에 보인다');
    ok(r.speedOk && r.slowed, '함대는 상인 배보다 빨리 가지 못한다 (' + r.speed + ' · 느린 상선이면 ' + r.slowTxt + ')');
    ok(r.pirate === 1.3 && r.pirate2 === 1.9, '해적이 더 꾄다: 빈 상선 ×' + r.pirate + ' → 짐을 실으면 ×' + r.pirate2);
    ok(r.save, '저장·불러오기에 호위가 남는다');
    ok(/^back:\d+:\d+:true:true$/.test(r.load) && r.q > 0 && r.cost > 0 && r.other, '목적지: 상인이 제 돈으로 싣는다 (' + r.load + ') — ' + r.loadSaid + ' · ' + r.status);
    ok(/:true:false:\d+:4:true:25:1$/.test(r.home) && r.payNum > 0 && r.cool, '귀환: 몫 ' + r.payNum + '닢 (품삯 이상 · 교역·사교 명성) → 호위 끝, 25일 동안은 새 요청 없음 — ' + r.homeSaid);
    ok(/^1:0:/.test(r.warn) && r.late.split(':')[0] === r.late.split(':')[1] && r.late.split(':')[2] === '0', '기한을 넘기면 한 번 알리고 몫은 절반, 명성 없음 (' + r.late + ')');
    ok(/^true:-6:/.test(r.gone) && /^true:true:-10$/.test(r.quit), '너무 늦으면 상인이 떠난다(명성 −6) · 그만두면 명성 −10');
    ok(r.batKeep && /^true:-20:1:true$/.test(r.batLost) && /^true:-10$/.test(r.batScatter), '해전: 살아남으면 내구만 옮기고, 잃으면 실패(명성 −20), 져서 흩어지면 실패(−10)');
    ok(r.tut && r.old && r.ready, '튜토리얼에서는 나오지 않는다 · 옛 저장(state.escort 없음)에서도 탈 없다');

    // ---- 실제 바다: 상선이 함께 그려진다
    r = await page.evaluate(async () => {
      const out = {}, SEA = G.Scenes.sea, s = G.Game.state;
      G.UI.fade = async fn => { fn(); };
      G.Game.go('sea', { depart: 0 });
      await new Promise(r2 => setTimeout(r2, 300));
      const st = SEA.runtime();
      SEA.takeCourse(Math.PI); for (let i = 0; i < 8; i++) SEA.update(1 / 10);
      for (let i = 0; i < 4; i++) { TT.pump(); await new Promise(r2 => setTimeout(r2, 120)); }
      out.scene = G.Game.sceneName; out.slots = (st.slotPos || []).filter(Boolean).length; out.ships = s.fleet.ships.length;
      return out;
    });
    await page.screenshot({ path: '/tmp/escort_sea.png' });
    ok(r.scene === 'sea' && r.slots === r.ships + 1, '바다: 내 배 ' + r.ships + '척 + 상선 1척이 함께 그려진다');

    // ---- 실제 해전: 상선은 기함 뒤에 숨는 아군 배, 내 선원 셈에 들지 않는다
    r = await page.evaluate(async () => {
      const out = {}, B = G.Scenes.battle, s = G.Game.state, E = G.Escort;
      const crew0 = s.fleet.crew, nShips = s.fleet.ships.length, hp0 = E.ship().hp;
      G.Game.go('battle', { npc: { kind: 'pirate', n: 1 } });
      await new Promise(r2 => setTimeout(r2, 300));
      const st = B.runtime(), eb = st.ships.find(b => b.escort), fl = st.myFlag, en = st.ships.filter(b => b.side === 'en');
      out.in = !!eb && eb.side + ':' + eb.flag + ':' + (eb.crew === E.ship().crew) + ':' + st.ships.filter(b => b.side === 'me').length;
      out.myCrew = st.ships.filter(b => b.side === 'me' && !b.escort).reduce((a, b) => a + b.crew, 0) === crew0;
      for (let i = 0; i < 16 && !st.over; i++) B.update(1 / 8);
      const ex = en.reduce((a, b) => a + b.x, 0) / en.length, ey = en.reduce((a, b) => a + b.y, 0) / en.length;
      out.behind = !!eb.moveTo && Math.hypot(eb.moveTo[0] - ex, eb.moveTo[1] - ey) > Math.hypot(fl.x - ex, fl.y - ey);
      // 이긴다: 적 기함을 가라앉힌다. 상선은 포탄을 조금 맞았다
      eb.hp = Math.max(2, eb.hp - 9); const hpB = Math.round(eb.hp);
      en.forEach(b => { b.alive = false; b.sunk = true; b.hp = 0; });
      const t0 = Date.now();
      while (G.Game.sceneName === 'battle' && Date.now() - t0 < 120000) {
        if (!G.UI.busy()) B.update(1 / 6);
        const m = [...document.querySelectorAll('#ui .modal-back')].pop();
        if (m) { const b = [...m.querySelectorAll('.btn')].pop() || m.querySelector('.dlg') || m; b.click(); }
        await new Promise(r2 => setTimeout(r2, 40));
      }
      out.after = G.Game.sceneName + ':' + !!E.now() + ':' + (E.ship() ? E.ship().hp === hpB : false) + ':' + (s.fleet.ships.length === nShips) + ':' + (s.fleet.crew <= crew0) + ':' + s.stats.wins;
      return out;
    });
    ok(/^me:false:true:\d+$/.test(r.in) && r.myCrew && r.behind, '해전: 상선이 아군으로 나오고(' + r.in + ') 제 선원으로 싸우며, 적의 반대쪽 기함 뒤에 숨는다');
    ok(/^sea:true:true:true:true:1$/.test(r.after), '이기면 호위는 이어지고 상선의 내구만 옮겨진다 · 내 배·선원 셈은 그대로 (' + r.after + ')');
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | ')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
