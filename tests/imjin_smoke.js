/* 임진왜란 — 동래에서 노량까지 (2026-10-30 사용자 요청) — node tests/imjin_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 부름: 조선에 들른 적이 있으면 1592.1~5.22 동아시아 항구에서 김시민의 군관 (들른 적 없으면 없음)
   · ② 부산포 앞바다: 조선·명의 배가 없으면 왜선이 지나간다(이야기 없음) · 판옥선이면 해전(끝나면 동래로)
   · ③ 논개 구출(육상전) → 태운다 · 김시민의 비단(팔 수 없다) · 동래 포구가 막힌다(출항 불가)
   · ④ 성문 밖 돌파 · ⑤ 탄금대(신립 — 지더라도 구해 준다, 포구가 풀린다) · ⑥ 한양(선조·광해군·허준·갓장수)
   · ⑦ 곽재우·김덕령 (갓이 있으면 부하로) · ⑧ 행주산성 — 비단을 전하면 조선 명예 작위 · 갓이 없었으면 진영의 갓장수 (두 번째 기회)
   · ⑨ 원균 → 옥포 (함대가 5척 미만이면 모자란 수만큼 거북선) · ⑩ 한산도 · ⑪ 칠천량(1597.8~) · ⑫ 노량(1598.12~) → 의술이 있으면 이순신이 「나의 죽음을 알리지 마라」 하고 합류 · 없으면 역사대로
   · 논개는 구하기 전엔 술집에 나오지 않는다 · 소식 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
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
    await page.waitForFunction(() => window.G && G.Game && G.Imjin && G.World && G.Rel, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, IJ = G.Imjin, said = [], asked = [], out = {}, specs = [];
      let plan = [], landRes = [], seaWin = true;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.land.landBattle = async (nm, n, b, o) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      G.Rel.greatBattle = async (sp) => { specs.push(sp); if (seaWin) sp.onWin(); else sp.onLose(); return true; };
      const fresh = (ships) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1592, m: 1, d: 1 }; s.player.born = { y: 1560, m: 1, d: 1 }; delete s.life; delete s.imjin; s.player.gold = 20000; s.visited = {};
        if (ships) s.fleet.ships[0].type = ships;
        return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = c == null ? { mode: 'sea', lon: 129.2, lat: 35.0 } : { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = IJ.pending(); if (p) await IJ.check(); return p; };
      const land = async (lon, lat, choices, res) => { plan = (choices || []).slice(); landRes = (res || []).slice(); said.length = 0; asked.length = 0; const s = G.Game.state; s.loc = { mode: 'land', lon, lat, party: 40, base: { type: 'city', city: 226, lon: 129.083, lat: 35.205 } }; return await IJ.onLand(lon, lat, { battle: (nm, n, o) => G.Scenes.land.landBattle(nm, n, false, o), stop: () => {} }); };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      // ── 논개는 구하기 전엔 술집에 나오지 않는다
      let s = fresh('panokseon');
      out.nongaeHidden = !!G.MATE.h_nongae.eventOnly;
      // ── ① 부름: 조선에 들른 적이 없으면 없음 · 있으면 나가사키에서
      at(s, 1592, 3, 1, 191); s.visited = { 191: 1 }; out.callNoVisit = IJ.pending();
      s.visited = { 191: 1, 229: 1 }; out.callLate = (at(s, 1592, 5, 25, 191), IJ.pending());
      at(s, 1592, 3, 1, 191); await go([]);
      out.call = { v: s.imjin.call, line: said.some(x => /김시민 장군께서 선장을 찾으시오/.test(x)), ships: said.some(x => /판옥선/.test(x)) };
      // ── ② 부산포 앞바다: 배가 없으면 지나간다
      const busan = G.CITY_DATA[226];
      s = fresh('carrack'); s.visited = { 190: 1 }; at(s, 1592, 5, 24); said.length = 0;
      out.noShip = { r: await IJ.beforePort(busan), pass: said.some(x => /그냥 지나갑니다/.test(x)), toast: said.some(x => /조선 군선이나 명나라 배/.test(x)), specs: specs.length };
      out.early = (s.fleet.ships[0].type = 'panokseon', at(s, 1592, 5, 1), await IJ.beforePort(busan));
      at(s, 1592, 5, 24); said.length = 0;
      out.busan = { r: await IJ.beforePort(busan), spec: specs[0] && { id: specs[0].id, back: specs[0].backCity, n: specs[0].ships.length, label: specs[0].fightLabel }, sea: s.imjin.sea, mistaken: said.some(x => /조선의 수군이다/.test(x)) };
      // ── ③ 동래: 논개 (육상전 이김) → 태운다 · 김시민
      at(s, 1592, 5, 25, 226); await go(['fight', 'yes']);
      out.nongae = { v: s.imjin.nongae, join: hired('h_nongae'), visible: !G.MATE.h_nongae.eventOnly, cut: said.some(x => /목을 끌어안고 강물에/.test(x)), song: said.some(x => /싸워 죽기는 쉬우나/.test(x)), silk: G.R.hasItem('imjin_silk'), north: s.imjin.north, shut: IJ.portShut(busan) };
      out.noSell = !!G.ITEM.imjin_silk.noSell;
      said.length = 0; await G.Scenes.city.B.harbor.depart(busan); out.depart = said.some(x => /부산포 어귀는 왜선이 겹겹이/.test(x));
      // ── ④ 성문 밖 (지더라도 지나간다)
      out.breakout = { r: await land(129.1, 35.3, [], ['lose']), v: s.imjin.breakout, fight: said.some(x => /고니시군의 조총대/.test(x)) };
      out.notYet = await land(128.6, 36.0, [], []);
      // ── ⑤ 탄금대: 새재를 권한다 · 져도 신립이 구한다
      out.tangeum = { r: await land(127.9, 37.0, ['pass'], ['lose']), v: s.imjin.tangeum, deliver: s.imjin.delivered, open: !IJ.portShut(busan), scoff: said.some(x => /기마대가 짓밟아/.test(x)), bae: said.some(x => /배수진/.test(x)), rescue: said.some(x => /말 위로 끌어올리며/.test(x)) };
      // ── ⑥ 한양: 광해군 · 허준에게 약 · 갓을 산다
      let g0 = s.player.gold; at(s, 1592, 6, 9, 190); await go(['listen', 'give', 'buy']);
      out.seoul = { v: s.imjin.seoul, king: said.some(x => /과인은 북으로 간다/.test(x)), fire: said.some(x => /경복궁의 기와지붕/.test(x)), youth: said.some(x => /그래도 나라는 지켜야/.test(x)), gwang: said.some(x => /원망은 내가 다 듣겠다/.test(x)), heo: said.some(x => /백성이 살아야 나라가/.test(x)), gat: G.R.hasItem('imjin_gat'), gold: g0 - s.player.gold };
      // ── ⑦ 곽재우·김덕령 (갓이 있으니 부하로)
      out.gwak = { r: await land(127.1, 37.3, ['yes'], ['win']), v: s.imjin.gwak, join: s.imjin.gwakJoin, both: hired('h_gwakjaeu') && hired('h_kimdeokryeong'), yi: said.some(x => /전라좌수사 이순신/.test(x)), red: said.some(x => /홍의장군/.test(x)) };
      // ── ⑧ 행주산성: 비단 → 명예 작위
      const kr = G.COURT.realms.KR, rk0 = G.Court.rank(kr);
      out.haengjuFar = await land(126.95, 37.57, [], []);
      out.haengju = { r: await land(126.82, 37.60, [], []), v: s.imjin.haengju, silk: !G.R.hasItem('imjin_silk') && s.imjin.silk === 'given', rank: G.Court.rank(kr) - rk0, apron: said.some(x => /치마폭이 지킬/.test(x)) };
      // ── ⑨ 원균 → 옥포 (함대 1척 → 거북선 4척) · 이순신이 미리 배에 있었으면 제 자리로
      G.Legend.join('h_yisunsin', null);
      at(s, 1592, 7, 1, 226); specs.length = 0; await go(['leave']);
      const ok1 = specs[0];
      out.okpo = { v: s.imjin.wongyun, spec: ok1 && ok1.id, back: ok1 && ok1.backCity, turtles: ok1 ? ok1.allies.filter(a => a.type === 'geobukseon').length : -1, won: s.imjin.okpo, sank: said.some(x => /손수 가라앉혔지/.test(x)), yiLeft: !hired('h_yisunsin') && s.imjin.yiAboard === 1 };
      // ── ⑩ 한산도
      at(s, 1592, 8, 14, 229); specs.length = 0; await go([]);
      out.hansan = { spec: specs[0] && specs[0].id, won: s.imjin.hansan, crane: !!(specs[0] && /학익진/.test(specs[0].intro)), council: said.some(x => /와키자카 야스하루/.test(x)) };
      await go([]); out.hansanAfter = { said: s.imjin.hansanSaid, call: said.some(x => /바다가 다시 끓거든/.test(x)) };
      out.chilEarly = (at(s, 1596, 1, 1, 229), IJ.pending());
      // ── ⑪ 칠천량 (1597.8~) — 이기면 열두 척
      at(s, 1597, 8, 20, 229); specs.length = 0; await go([]);
      out.chil = { spec: specs[0] && specs[0].id, won: s.imjin.chil };
      await go([]); out.chilAfter = { said: s.imjin.chilSaid, twelve: said.some(x => /열두 척이 빠져나왔다/.test(x)) };
      // ── ⑫ 노량 (1598.12~) — 제독이 의술 1 → 이순신이 산다
      s.player.sk.med = 1;
      at(s, 1598, 12, 10, 229); specs.length = 0; await go([]);
      out.noryang = { spec: specs[0] && specs[0].id, allies: specs[0] && specs[0].allies.map(a => a.type).join(','), won: s.imjin.noryang };
      const rk1 = G.Court.rank(kr);
      await go(['go']);
      out.shot = { yi: s.imjin.yi, join: hired('h_yisunsin'), line: said.some(x => /나의 죽음을 알리지 마라/.test(x)), end: said.some(x => /전쟁은 이제 끝났다/.test(x)), y: G.MATE.h_yisunsin.y[1], rank: G.Court.rank(kr) - rk1 };
      out.done = (at(s, 1599, 1, 1, 229), IJ.pending());
      // ── 갓 없이: 곽재우는 「나중에」 → 행주의 갓장수에게 사면 부하로 · 논개를 놓고 가면 술집에
      const chance0 = G.U.chance; G.U.chance = () => false;   // 겁주기는 실패한다
      s = fresh('ljunk'); s.visited = { 226: 1 }; at(s, 1592, 6, 1); await IJ.beforePort(busan);
      at(s, 1592, 6, 2, 226); landRes = ['lose']; await go(['scare', 'no']);
      out.alt1 = { v: s.imjin.nongae, join: hired('h_nongae'), visible: !G.MATE.h_nongae.eventOnly };
      G.U.chance = chance0;
      await land(129.1, 35.3, [], ['win']); at(s, 1592, 6, 20, 190); await go(['guard', 'no', 'no']);
      out.alt2 = { skip: s.imjin.tangeum, deliver: s.imjin.delivered, gat: G.R.hasItem('imjin_gat'), report: said.some(x => /신립이 탄금대에서 무너졌다는 소식이 먼저/.test(x)) };
      await land(127.1, 37.3, [], ['win']);
      out.alt3 = { join: s.imjin.gwakJoin, noHat: said.some(x => /갓도 안 쓰셨구려/.test(x)) };
      await land(126.82, 37.60, ['buy', 'yes'], []);
      out.alt4 = { join: s.imjin.gwakJoin, gat: s.imjin.gat, both: hired('h_gwakjaeu') && hired('h_kimdeokryeong') };
      // ── 노량 — 의술이 없으면 역사대로
      s.imjin.wongyun = 'leave'; s.imjin.okpo = 'won'; s.imjin.hansan = 'won'; s.imjin.hansanSaid = 1; s.imjin.chil = 'lost'; s.imjin.chilSaid = 1; s.player.sk.med = 0;
      s.mates = s.mates.filter(m => !(G.R.mateSkill(m, 'med') > 0));
      at(s, 1598, 12, 12, 226); await go([]); at(s, 1598, 12, 13, 229); await go(['go']);
      out.died = { yi: s.imjin.yi, join: hired('h_yisunsin'), line: said.some(x => /싸움이 급하다/.test(x)) };
      // ── 소식
      s = fresh('carrack'); s.loc = { mode: 'sea', lon: 130, lat: 34 };
      const day = (y, m, d) => { s.date = { y, m, d }; return IJ.daily().map(x => x.text).join(' | '); };
      out.news = { busan: day(1592, 5, 24), fall: day(1592, 5, 25), tang: day(1592, 6, 7), seoul: day(1592, 6, 12), hansan: day(1592, 8, 14), jinju: day(1593, 7, 27), noryang: day(1598, 12, 16) };
      // ── 옛 저장
      s = fresh('carrack'); s.date = { y: 1700, m: 1, d: 1 }; delete s.imjin; out.oldSave = IJ.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'imjin');
      out.journal = !!(IJ.daily && IJ.daily._journal);
      out.voices = ['h_nongae', 'h_gwakjaeu', 'h_kimdeokryeong', 'h_yisunsin'].every(id => G.VOICES && G.VOICES[id]);
      return out;
    });
    console.log(JSON.stringify({ busan: r.busan, nongae: r.nongae, tangeum: r.tangeum, seoul: r.seoul, okpo: r.okpo, shot: r.shot, alt2: r.alt2, alt4: r.alt4 }));
    ok(r.nongaeHidden, '논개는 동래에서 구하기 전에는 술집에 나오지 않는다');
    ok(!r.callNoVisit && !r.callLate && r.call.v === 1 && r.call.line && r.call.ships, '① 부름 — 조선에 들른 적이 있어야 · 5.22까지 · 김시민의 군관 (조선·명의 배로)');
    ok(r.noShip.r === false && r.noShip.pass && r.noShip.toast && r.noShip.specs === 0 && r.early === false, '② 조선·명의 배가 없으면 왜선이 지나간다 · 5.23 전에는 아무 일 없다');
    ok(r.busan.r === true && r.busan.spec.id === 'imjin_busan' && r.busan.spec.back === 226 && r.busan.spec.n >= 3 && r.busan.spec.label === '맞서 싸운다' && r.busan.sea === 'won' && r.busan.mistaken, '② 판옥선이면 「조선의 수군이다!」 — 부산포 해전 (끝나면 동래로)');
    const n = r.nongae;
    ok(n.v === 'saved' && n.join && n.visible && n.cut && n.song && n.silk && n.north && n.shut && r.noSell && r.depart, '③ 논개 구출 · 합류 · 송상현 「싸워 죽기는 쉬우나」 · 비단(팔 수 없다) · 동래 포구가 막혀 출항 불가');
    ok(r.breakout.r && r.breakout.v === 'lose' && r.breakout.fight && r.notYet === false, '④ 성문 밖 조총대 — 져도 북쪽으로 지나간다');
    const t = r.tangeum;
    ok(t.r && t.v === 'lose' && t.deliver === 1 && t.open && t.scoff && t.bae && t.rescue, '⑤ 탄금대 — 신립이 조총을 비웃는다 · 배수진 · 져도 신립이 말 위로 끌어올려 구한다 · 동래 포구가 풀린다');
    const sl = r.seoul;
    ok(sl.v === 1 && sl.king && sl.fire && sl.youth && sl.gwang && sl.heo && sl.gat && sl.gold === 600, '⑥ 한양 — 선조의 파천 · 불타는 경복궁 · 젊은 의병 · 원망을 듣는 광해군 · 허준 · 갓 (약 300 + 갓 300)');
    ok(r.gwak.r && r.gwak.v === 1 && r.gwak.join === 'yes' && r.gwak.both && r.gwak.yi && r.gwak.red, '⑦ 곽재우(홍의장군)·김덕령 — 이순신 소식 · 갓을 썼으니 둘 다 부하로');
    ok(r.haengjuFar === false && r.haengju.r && r.haengju.v === 1 && r.haengju.silk && r.haengju.rank === 1 && r.haengju.apron, '⑧ 행주산성 — 권율에게 비단을 전하고 조선 명예 작위 한 칸 (한양 성문 곁에서는 열리지 않는다)');
    const o = r.okpo;
    ok(o.v === 'leave' && o.spec === 'imjin_okpo' && o.back === 229 && o.turtles === 4 && o.won === 'won' && o.sank && o.yiLeft, '⑨ 원균(배를 가라앉혔다) → 옥포 — 함대 1척이라 거북선 4척 합류 · 미리 데리고 있던 이순신은 전라좌수영으로');
    ok(r.hansan.spec === 'imjin_hansan' && r.hansan.won === 'won' && r.hansan.crane && r.hansan.council && r.hansanAfter.said && r.hansanAfter.call && r.chilEarly === false, '⑩ 한산도 대첩(학익진) · 「바다가 다시 끓거든」 · 1597.8 전에는 칠천량이 열리지 않는다');
    ok(r.chil.spec === 'imjin_chil' && r.chil.won === 'won' && r.chilAfter.said && r.chilAfter.twelve, '⑪ 칠천량 — 조선 수군이 무너지고 열두 척을 건져 낸다');
    ok(r.noryang.spec === 'imjin_noryang' && /ljunk/.test(r.noryang.allies) && /geobukseon/.test(r.noryang.allies) && r.noryang.won === 'won', '⑫ 노량 — 진린의 명 수군·거북선이 우리 편');
    ok(r.shot.yi === 'saved' && r.shot.join && r.shot.line && r.shot.end && r.shot.y >= 1625 && r.shot.rank === 1 && r.done === false, '⑫ 의술로 살린 이순신 — 「전쟁은 이제 끝났다. 나의 죽음을 알리지 마라」 · 합류 · 선무공신 작위 · 끝');
    ok(r.alt1.v === 'kimsimin' && !r.alt1.join && r.alt1.visible, '논개 — 겁주기 실패·패배여도 김시민의 군사와 함께 구한다 · 태우지 않으면 술집에 나온다');
    ok(r.alt2.skip === 'skip' && r.alt2.deliver === 1 && !r.alt2.gat && r.alt2.report, '탄금대를 지나쳐도 한양에서 소식을 전한다 · 갓을 사지 않을 수도');
    ok(r.alt3.join === 'later' && r.alt3.noHat && r.alt4.join === 'yes' && r.alt4.gat === 'haengju' && r.alt4.both, '갓이 없으면 곽재우·김덕령은 「갓도 안 쓰셨구려」 → 행주 진영의 갓장수에게 사면 부하로');
    ok(r.died.yi === 'died' && !r.died.join && r.died.line, '의술이 없으면 역사대로 — 「싸움이 급하다. 나의 죽음을 알리지 마라」');
    const nw = r.news;
    ok(/정발/.test(nw.busan) && /길을 빌려주기는 어렵다/.test(nw.fall) && /달천/.test(nw.tang) && /한양 함락/.test(nw.seoul) && /학이 날개/.test(nw.hansan) && /남강/.test(nw.jinju) && /나의 죽음을 알리지 마라/.test(nw.noryang), '소식 — 부산진·동래성·탄금대·한양·한산도·진주성·노량');
    ok(r.oldSave === 0 && r.rumor && r.journal && r.voices, '옛 저장 · 소문 · 일지 · 네 사람의 말투');
    await page.reload();
    await page.waitForFunction(() => window.G && G.Game && G.Imjin && G.World && G.Rel, null, { timeout: 120000 });
    const q = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, IJ = G.Imjin, out = {};
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {};
      UI.ask = async (t, opts) => /한산도 대첩/.test(t) ? 'no' : opts[0].value;
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1592, m: 7, d: 1 }; s.player.born = { y: 1560, m: 1, d: 1 }; delete s.life;
      s.imjin = { told: {}, call: 1, sea: 'won', nongae: 'saved', north: 1, delivered: 1, breakout: 'win', tangeum: 'win', seoul: 1, gwak: 1, haengju: 1, wongyun: 'leave' };
      s.loc = { mode: 'city', city: 226, lon: G.CITY_DATA[226].lon, lat: G.CITY_DATA[226].lat };
      G.Game.go('city', { cityId: 226 });
      const wait = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return true; await new Promise(r => setTimeout(r, 200)); } return false; };
      out.inBattle = await wait(() => G.Game.sceneName === 'battle' && G.Scenes.battle.runtime(), 60000);
      const bs = G.Scenes.battle.runtime();
      out.allies = bs ? bs.ships.filter(b => b.ally).map(b => b.type).join(',') : '';
      out.mine = bs ? bs.ships.filter(b => b.side === 'me' && !b.ally).length : -1;
      out.foes = bs ? bs.ships.filter(b => b.side === 'en').length : -1;
      await G.Scenes.battle._t().finish('win');
      out.back = await wait(() => G.Game.sceneName === 'city' && s.loc.city === 229 && !IJ._busy, 60000);
      out.okpo = s.imjin.okpo; out.hansanDeclined = !s.imjin.hansan;
      return out;
    });
    console.log(JSON.stringify(q));
    ok(q.inBattle && q.mine === 1 && (q.allies.match(/geobukseon/g) || []).length === 4 && /panokseon/.test(q.allies) && q.foes === 8, '진짜 해전 장면 — 옥포: 내 배 1척 + 판옥선 · 거북선 4척이 우리 편 · 왜선 8척');
    ok(q.back && q.okpo === 'won' && q.hansanDeclined, '옥포에서 이기면 한산도로 — 한산도 대첩은 「나중에」로 미룰 수 있다');
    await page.reload();
    await page.waitForFunction(() => window.G && G.Game && G.Imjin && G.World && G.Rel, null, { timeout: 120000 });
    const w = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, out = {};
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; UI.ask = async (t, opts) => opts[0].value; UI.confirm = async () => true;
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const wait = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return true; await new Promise(r => setTimeout(r, 200)); } return false; };
      const start = async (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: 1560, m: 1, d: 1 }; delete s.life; s.visited = { 190: 1 }; s.fleet.ships[0].type = 'panokseon';
        const c = G.CITY_DATA[226]; s.loc = { mode: 'sea', lon: c.dock[1], lat: c.dock[0], heading: 0 };
        G.Game.go('sea', {}); await wait(() => G.Game.sceneName === 'sea', 20000);
        await G.Scenes.sea.enterPort(c);
        return s;
      };
      let s = await start(1592, 4, 1);
      out.before = await wait(() => G.Game.sceneName === 'city', 30000) && s.loc.city === 226 && !(s.imjin && s.imjin.sea);
      s = await start(1592, 5, 24);
      out.battle = await wait(() => G.Game.sceneName === 'battle' && G.Scenes.battle.runtime(), 30000);
      out.great = G.Scenes.battle.runtime() && G.Scenes.battle.runtime().npc.great;
      return out;
    });
    console.log(JSON.stringify(w));
    const landSrc = fs.readFileSync(path.join(ROOT, 'js/scenes/land.js'), 'utf8'), harborSrc = fs.readFileSync(path.join(ROOT, 'js/city/harbor.js'), 'utf8');
    ok(/G\.Imjin\.onLand\(l\.lon, l\.lat, \{ battle: function \(nm, n, o\) \{ return landBattle\(nm, n, false, o\); \}/.test(landSrc) && /G\.Imjin\.portShut\(c\)/.test(harborSrc), '뭍의 하루 끝(js/scenes/land.js)·출항(js/city/harbor.js)에 걸려 있다');
    ok(w.before && w.battle && w.great === 'imjin_busan', '진짜 입항 — 5.23 전에는 동래로 그냥 들어가고, 판옥선으로 5.24에 다가가면 부산포 해전이 열린다');
    const misc = fs.readFileSync(path.join(ROOT, 'js/city/misc.js'), 'utf8');
    ok(/d && d\.noSell/.test(misc), '시장 매각 목록이 noSell 물건을 뺀다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
