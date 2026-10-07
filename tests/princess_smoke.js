/* 사라진 에스파냐 왕녀 (tests/princess_smoke.js) — node tests/princess_smoke.js   (BROWSER_EXE=크롬 경로)
   부름의 조건(명성 50,000 · 남자 · 총각) → 세빌리아 왕궁에서 특명 → 레반트 바다의 해적 함대(실제 해전) → 사로잡은 두목의 실토
   → 홍해 요새: 배로(요새의 함대) 또는 뭍으로(요새 수비대) → 왕녀를 모심 → 국왕에게 귀환
   → 총각이면 혼인(아내 · 한 계급 특진 · 「부마」) / 결혼했으면 하사금만 / 기한을 넘기면 실패 · 옛 저장 · 튜토리얼. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
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
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Princess, null, { timeout: 90000 });
    let r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, P = G.Princess, B = G.BALANCE.princess;
      await G.Game.ensureGeo(); TT.auto = false;
      const said = [], asks = []; let answer = {};
      const keep = { say: UI.say, ask: UI.ask, alert: UI.alert, confirm: UI.confirm, toast: UI.toast };
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      UI.ask = async (t, o) => { asks.push(String(t)); for (const k in answer) if (String(t).indexOf(k) >= 0) return answer[k]; return o[0].value; };
      UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); }; UI.confirm = async () => true; UI.toast = () => {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const fresh = (nation, g) => { const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: nation || 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' }); if (g) s.player.g = g; s.settings.res = 0.35; return s; };
      const setFame = (s, n) => { s.player.fame = n; s.player.fameBy = null; G.Fame.sync(); };
      // ---- 조건
      let s = fresh();
      setFame(s, 49999); out.low = P.daily().length === 0 && !s.princess;
      setFame(s, 52000); s.player.wife = 'm_lis'; out.married = P.daily().length === 0 && !s.princess; s.player.wife = null;
      s.player.g = 'f'; out.female = P.daily().length === 0 && !s.princess; s.player.g = 'm';
      s.tut = { step: 0, f: {} }; out.tut = P.daily().length === 0 && !s.princess; delete s.tut;
      const news = P.daily();
      out.news = news.length === 1 && !!news[0].history && /왕녀가 사라졌다/.test(news[0].text) && s.princess.stage === 0 && s.princess.sp === 'es_crown';
      out.once = P.daily().length === 0;
      // ---- 세빌리아 왕궁: 메뉴 · 할 일 · 전령
      const sev = G.CITY_DATA[7], crown = G.SPONSOR.es_crown;
      out.items = P.palaceItems(crown).map(x => x.label + ':' + x.sub).join(',') + '|' + P.palaceItems(G.SPONSOR.pt_king).length;
      out.todo = P.todo(sev).map(t => t.text).join('/');
      said.length = 0;
      // 다른 나라 땅에서는 전령이 오지 않는다, 에스파냐 땅에서는 한 번
      G.Scenes.city.city = () => sev;
      await P.arrival(G.CITY_DATA[0]); const h0 = said.length; await P.arrival(sev); await P.arrival(sev);
      out.herald = h0 === 0 && said.length === 1 && /왕궁으로/.test(said[0]);
      // ---- 알현: 처음에는 「조금 더」, 다음에는 받는다
      said.length = 0; answer = { '찾아 나서겠습니까': 'later' };
      out.enter0 = await P.onEnter(crown);
      out.later = s.princess.stage === 0 && said.some(t => /블랑카가 사라졌네/.test(t));
      answer = {}; said.length = 0;
      out.enter1 = await P.onEnter(crown);   // 이미 들었으니 먼저 꺼내지 않는다
      await P.audience(crown);
      out.accept = s.princess.stage === 1 && P.remain() > 1000 && s.known.includes(121) && said.some(t => /알렉산드리아와 베이루트/.test(t));
      out.html = P.html().replace(/<[^>]+>/g, ' ');
      // ---- 레반트 바다: 그 바다에서만 해적 함대가 나온다
      const beirut = G.CITY_DATA[121], bd = beirut.dock;
      s.loc = { mode: 'sea', lon: bd[1] - 1.2, lat: bd[0] - 0.3, heading: 0 };
      out.inLevant = P.inLevant();
      const n1 = P.spawn([]);
      out.levant = n1 && n1.princess + ':' + n1.n + ':' + n1.kind + ':' + n1.hostile + ':' + n1.ships.length;
      out.cd = P.spawn([]) === null;   // 하루 쉬고
      s.day += 3; out.dup = P.spawn([n1]) === null;
      s.loc = { mode: 'sea', lon: -9.6, lat: 38.6, heading: 0 }; s.day += 3; out.away = P.spawn([]) === null && !P.inLevant();
      out.meet = P.encounterText(n1);
      // 지면 며칠 뒤에 다시
      P.afterBattle(n1, 'retreat', [], null); out.retreat = s.princess.stage === 1 && s.princess.cd > s.day;
      return out;
    });
    ok(r.low && r.married && r.female && r.tut, '부름의 조건: 명성 50,000 미만 · 결혼함 · 여자 제독 · 튜토리얼이면 일어나지 않는다');
    ok(r.news && r.once, '명성 50,000 · 남자 · 총각 → 소식(한 번) — 카스티야 국왕이 부른다');
    ok(/^사라진 왕녀:부르심\|0$/.test(r.items) && /사라진 왕녀/.test(r.todo) && r.herald, '세빌리아 왕궁 메뉴 「사라진 왕녀」(다른 궁정에는 없음) · 할 일 판 · 에스파냐 땅의 전령은 한 번');
    ok(r.enter0 && r.later && !r.enter1 && r.accept, '알현: 국왕이 사정을 털어놓는다 → 「조금 더」면 그대로 → 받으면 특명(기한 3년)');
    ok(/레반트 바다/.test(r.html), '수첩 「계약·의뢰」에 특명');
    ok(r.inLevant && /^levant:4:pirate:true:4$/.test(r.levant) && r.cd && r.dup && r.away && /바르바리 해적 함대 4척/.test(r.meet) && r.retreat, '레반트 바다에서만 바르바리 해적 함대(4척)가 나온다 · 놓치면 며칠 뒤에 다시');

    // ---- 실제 해전: 레반트의 해적 함대를 쳐부순다 → 사로잡은 두목의 실토
    r = await page.evaluate(async () => {
      const out = {}, s = G.Game.state, P = G.Princess, B = G.Scenes.battle;
      const said = []; G.UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      G.UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      G.UI.fade = async fn => { fn(); };
      s.player.gold = 20000;
      const bd = G.CITY_DATA[121].dock; s.loc = { mode: 'sea', lon: bd[1] - 1.2, lat: bd[0] - 0.3, heading: 0 };
      const npc = P.spawn([]) || (s.princess.cd = 0, P.spawn([]));
      G.Game.go('battle', { npc });
      await new Promise(r2 => setTimeout(r2, 300));
      const st = B.runtime();
      out.enemy = st.ships.filter(b => b.side === 'en').length;
      st.ships.filter(b => b.side === 'en').forEach(b => { b.alive = false; b.sunk = true; b.hp = 0; });
      const t0 = Date.now();
      while (G.Game.sceneName === 'battle' && Date.now() - t0 < 90000) {
        if (!G.UI.busy()) B.update(1 / 6);
        const m = [...document.querySelectorAll('#ui .modal-back')].pop();
        if (m) { const b = [...m.querySelectorAll('.btn')].pop() || m.querySelector('.dlg') || m; b.click(); }
        await new Promise(r2 => setTimeout(r2, 40));
      }
      out.scene = G.Game.sceneName; out.stage = s.princess.stage;
      out.told = said.some(t => /수에즈 만 기슭에 그놈들의 요새/.test(t)) && said.some(t => /카이로에서 나흘/.test(t));
      out.cairo = s.known.includes(79);
      out.html = P.html().replace(/<[^>]+>/g, ' ');
      return out;
    });
    ok(r.enemy === 4 && r.scene === 'sea' && r.stage === 2 && r.told && r.cairo, '실제 해전: 해적 함대 4척을 쳐부수면 두목이 「홍해, 수에즈 만의 요새」를 실토 · 부관이 두 길(뭍·바다)을 일러 줌');
    ok(/수에즈 만 서쪽 기슭/.test(r.html), '수첩: 다음 할 일 — 홍해의 요새');

    // ---- 홍해 요새: 배로 / 뭍으로 → 왕녀를 모심 → 귀환 · 혼인
    r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, P = G.Princess, CT = G.Court, Bp = G.BALANCE.princess;
      const said = []; let answer = {};
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      UI.ask = async (t, o) => { for (const k in answer) if (String(t).indexOf(k) >= 0) return answer[k]; return o[0].value; };
      UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      let s = G.Game.state;
      const snap = G.State.serialize();
      // 배로: 요새 앞바다
      s.loc = { mode: 'sea', lon: 32.8, lat: 28.9, heading: 0 }; s.day += 5; s.princess.cd = 0;
      const dn = P.spawn([]);
      out.den = dn && dn.princess + ':' + dn.n + ':' + dn.ships.length;
      out.denFar = (() => { s.loc = { mode: 'sea', lon: 38.5, lat: 20, heading: 0 }; s.day += 5; return P.spawn([]) === null; })();
      const lines = []; P.afterBattle(dn, 'win', [], lines); await P.tell();
      out.seaRescue = s.princess.stage === 3 && s.princess.how === 'sea' && /구해 냈다/.test(lines.join()) && said.some(t => /블랑카 왕녀: …아버지가 보내셨군요/.test(t));
      // 뭍으로 (다시 2단계에서): 멀면 아무 일 없고, 다가가면 수비대 — 지면 물러났다가 이긴다
      G.Game.state = s = G.State.deserialize(snap); said.length = 0; s.princess.cd = 0;
      const calls = []; let win = false;
      const api = { battle: async (nm, n, o) => { calls.push(nm + ':' + n + ':' + o.kind); return win ? 'win' : 'lose'; }, stop: () => { calls.push('stop'); } };
      s.loc = { mode: 'land', lon: 31.3, lat: 30.0, heading: 0, party: 60 }; await P.onLand(api); out.landFar = calls.length === 0;
      s.loc = { mode: 'land', lon: 32.4, lat: 29.2, heading: 0, party: 60 };
      answer = { '쳐들어갈까요': 0 }; await P.onLand(api); out.landHold = calls.join(',') === 'stop' && s.princess.stage === 2;
      s.day += 2; answer = {}; await P.onLand(api); out.landLose = s.princess.stage === 2 && said.some(t => /물러섰다/.test(t));
      s.day += 3; win = true; await P.onLand(api);
      out.landCalls = calls.join(','); out.landRescue = s.princess.stage === 3 && s.princess.how === 'land' && said.some(t => /고마워요, 제독/.test(t));
      out.palace = P.palaceItems(G.SPONSOR.es_crown).map(x => x.sub).join() + '|' + P.todo(G.CITY_DATA[7]).map(t => t.text).join();
      const snap3 = G.State.serialize();
      // ---- 귀환: 총각이면 왕녀가 청혼한다 → 혼인 (PT 제독: 에스파냐 명예 작위 한 칸)
      said.length = 0;
      const gold0 = s.player.gold, fame0 = s.player.fame, rk0 = CT.rank(G.COURT.realms.ES);
      out.enter = await P.onEnter(G.SPONSOR.es_crown);
      const tt = CT.title(G.COURT.realms.ES);
      out.wed = s.player.wife + ':' + (CT.rank(G.COURT.realms.ES) - rk0) + ':' + (tt && tt.ko) + ':' + (s.player.gold - gold0) + ':' + (s.player.fame - fame0) + ':' + s.princess.end;
      out.title = P.title() + '|' + G.Game.hud.title() + '|' + G.Game.hud.titleTip().slice(0, 40);
      out.wife = G.Family.wifeName() + ':' + G.Family.wifeSpeaker().name + ':' + !G.MAIDS.some(m => m.id === 'm_princess');
      out.wedSaid = said.some(t => /이분 말고 다른 사람에게는 시집가지 않겠어요/.test(t)) && said.some(t => /부마/.test(t));
      out.after = P.palaceItems(G.SPONSOR.es_crown).length + ':' + P.html() + ':' + P.daily().length;
      const back = G.State.deserialize(G.State.serialize()); out.save = back.princess.wed > 0 && back.player.wife === 'm_princess';
      // ---- 같은 귀환을 에스파냐 제독이면: 제 나라 작위 한 칸
      G.Game.state = s = G.State.deserialize(snap3); s.player.nation = 'ES'; G.Court.state().titles.ES = 3;
      await P.onEnter(G.SPONSOR.es_crown); out.esUp = CT.title(G.COURT.realms.ES).ko + ':' + CT.rank(G.COURT.realms.ES);
      // ---- 이미 가장 높으면 특진 대신 금화
      G.Game.state = s = G.State.deserialize(snap3); G.Court.state().titles.ES = G.COURT.realms.ES.honor.length; const g1 = s.player.gold;
      await P.onEnter(G.SPONSOR.es_crown); out.maxed = (s.player.gold - g1) + ':' + CT.rank(G.COURT.realms.ES) + ':' + P.title();
      // ---- 사양하면
      G.Game.state = s = G.State.deserialize(snap3); answer = { '혼인하겠습니까': 'no' }; const g2 = s.player.gold;
      await P.onEnter(G.SPONSOR.es_crown); out.decline = !s.player.wife + ':' + (s.player.gold - g2) + ':' + P.title() + ':' + s.princess.end;
      // ---- 그사이 결혼했으면: 청혼 없이 하사금만
      G.Game.state = s = G.State.deserialize(snap3); s.player.wife = 'm_lis'; answer = {}; said.length = 0; const g3 = s.player.gold, rk3 = CT.rank(G.COURT.realms.ES);
      await P.onEnter(G.SPONSOR.es_crown);
      out.marriedEnd = s.player.wife + ':' + (s.player.gold - g3) + ':' + (CT.rank(G.COURT.realms.ES) - rk3) + ':' + P.title() + ':' + said.some(t => /시집가지 않겠어요/.test(t));
      // ---- 기한을 넘기면
      G.Game.state = s = G.State.deserialize(snap); s.date = G.U.addDays(s.date, 365 * 3 + 5); const f4 = s.player.fame;
      const late = P.daily(); out.late = late.length + ':' + s.princess.end + ':' + (s.player.fame - f4) + ':' + P.palaceItems(G.SPONSOR.es_crown).length;
      // ---- 옛 저장
      delete s.princess; out.old = P.st() === null && P.html() === '' && P.title() === '' && P.palaceItems(G.SPONSOR.es_crown).length === 0 && P.spawn([]) === null;
      return out;
    });
    ok(/^den:5:5$/.test(r.den) && r.denFar && r.seaRescue, '배로: 수에즈 만 요새 앞바다에서만 「검은 매」의 함대(5척) → 이기면 왕녀를 구해 낸다');
    ok(r.landFar && r.landHold && r.landLose && r.landRescue && /^stop,stop,「검은 매」 요새 수비대:54:bandit,stop,「검은 매」 요새 수비대:54:bandit$/.test(r.landCalls), '뭍으로: 요새에 다가가면 수비대 54명이 막아선다 — 물러나기 · 지면 다시 · 이기면 왕녀를 구해 낸다');
    ok(/왕녀를 모셨다/.test(r.palace) && /국왕께 모셔 간다/.test(r.palace), '왕녀를 모시면 세빌리아 왕궁·할 일 판에 「모셔 간다」');
    ok(r.enter && /^m_princess:1:산티아고 기사단 기사:\d+:\d+:done$/.test(r.wed) && r.wedSaid, '귀환: 왕녀가 청혼 → 혼인 · 한 계급 특진(' + r.wed + ')');
    ok(/^부마\|부마 · 산티아고 기사단 기사\|부마/.test(r.title) && /^블랑카 왕녀:블랑카 왕녀:true$/.test(r.wife) && r.save, '칭호 「부마」(직위 칸 ' + r.title.split('|')[1] + ') · 아내는 블랑카 왕녀(술집에는 나오지 않음) · 저장');
    ok(r.after === '0::0', '끝난 뒤에는 메뉴·수첩·소식이 사라진다 (한 번뿐)');
    ok(r.esUp === '자작:4', '에스파냐 제독이면 제 나라 작위로 한 칸 (남작 → ' + r.esUp + ')');
    ok(/^75000:3:부마$/.test(r.maxed) && /^true:30000::done$/.test(r.decline) && /^m_lis:30000:0::false$/.test(r.marriedEnd), '이미 가장 높으면 특진 대신 금화 · 사양하면 하사금만 · 그사이 결혼했으면 청혼 없이 하사금만');
    ok(/^1:failed:-400:0$/.test(r.late) && r.old, '기한(3년)을 넘기면 실패(명성 −400) · 옛 저장(state.princess 없음)에서도 탈 없다');
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | ')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
