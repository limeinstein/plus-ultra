/* 영원성의 여포수 · 수방의 장부 (2026-11-05 사용자 요청) — node tests/ningchong_smoke.js   (BROWSER_EXE=크롬 경로)
   · ⓪ 성벽의 포수 — houjin ② 와 겹치지 않는다 (군관이 먼저 · 약조(quest)·싸움(won) 뒤엔 열리지 않는다 · 거절(no)한 제독만)
   · ① 영원성의 여포수 — houjin 을 했을 때 / 성벽을 함께 지켰을 때 / 낯선 여인 · 원숭환의 수문 · 부두 싸움 · 은자 · 못 본 척
   · ② 수방의 장부 — 옥란 · 장부 · 출입패(북경 통행) · ③ 자경궁 — 장 황후·숭정제 / 판다(옥란이 떠난다) · 기한
   · ④ 옥문이 열리다 — 끌려간 두 사람 · ⑤ 빈 곳간 — 쌀·밀 0.7배 / 차용증 · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.NingChong && G.Houjin && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, NC = G.NingChong, HJ = G.Houjin, said = [], asked = [], out = {};
      let plan = [], landRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; return s;
      };
      const at = (s, y, m, d, c) => { c = c || 189; s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = NC.pending(); if (p) await NC.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const b = () => G.Game.state.ningChong;
      const has = (id) => G.R.hasItem(id);
      const fights = () => said.filter(x => /\[육상전\]/.test(x));
      // ── 처음엔 둘 다 술집에 없다
      let s = fresh(1626, 1, 1);
      out.hidden = G.MATE.nc_ines.eventOnly === true && G.MATE.nc_okran.eventOnly === true && !G.MATE.nc_ines.wed && !G.MATE.nc_okran.wed;
      // ── ⓪ 성벽 — houjin 군관이 먼저 · 거절한 제독에게만
      at(s, 1626, 2, 10); out.w0 = { hjFirst: HJ.pending(), nc: NC.pending() };
      plan = ['no']; await HJ.check(); out.w0.hjNing = s.houjin.ning;
      await go(['help'], ['win']);
      out.W = { wall: b().wall, refused: said.some(x => /끼지 않겠다」던 그 선장/.test(x)), name: said.some(x => /제 이름은 이네스/.test(x)), small: fights().length === 1 && /28$/.test(fights()[0]), father: said.some(x => /북경에서 우리 아버지가 그렇게 죽었어요/.test(x)) };
      const sq = fresh(1626, 1, 1); at(sq, 1626, 2, 10); sq.houjin = { ning: 'quest', ningAsk: 1, told: {} }; out.wQuest = NC.pending();
      sq.houjin.ning = 'won'; out.wWon = NC.pending();
      // ── ① 성벽을 함께 지킨 제독 — 부두 싸움으로 지킨다 (계속 s)
      s = fresh(1626, 1, 1); at(s, 1626, 2, 10); plan = ['no']; await HJ.check(); await go(['help'], ['lose']); const wallLost = b().wall;
      at(s, 1626, 3, 1); await go(['fight'], ['win']);
      out.A_wall = { wallLost, ines: b().ines, how: b().inesHow, hired: hired('nc_ines'), known: said.some(x => /아직 안 떠나셨구나/.test(x)), yuanOpt: asked[0] && asked[0].opts.includes('yuan'), jiyong: said.some(x => /구천세의 위엄/.test(x)), visible: G.MATE.nc_ines.eventOnly === false };
      // ── ① houjin ② 를 한 제독 — 원숭환의 수문
      s = fresh(1626, 1, 1); s.houjin = { ning: 'won', fire: 'center', ningAsk: 1, told: {} }; at(s, 1626, 2, 15); out.hjWall = NC.pending();
      at(s, 1626, 4, 1); await go(['yuan']);
      out.A_hj = { ines: b().ines, how: b().inesHow, umbrella: said.some(x => /노란 일산을 겨눈 그 포/.test(x)), gate: said.some(x => /서문의 수문/.test(x)), fights: fights().length, hired: hired('nc_ines') };
      // ── ① 낯선 여인 — 원숭환 갈래 없음 · 못 본 척
      s = fresh(1626, 1, 1); at(s, 1626, 5, 1); await go(['no']);
      out.A_none = { ines: b().ines, noYuan: !asked[0].opts.includes('yuan'), stranger: said.some(x => /남장한 여인/.test(x)), hidden: G.MATE.nc_ines.eventOnly === true };
      // ── ① 부두 싸움에서 지면 — 포탄 조각
      s = fresh(1626, 1, 1); at(s, 1626, 5, 1); await go(['fight'], ['lose']); out.A_lose = { ines: b().ines, shard: has('nc_shard') };
      // ── ① 은자
      s = fresh(1626, 1, 1); let g0 = s.player.gold; at(s, 1626, 5, 1); await go(['bribe']); out.A_bribe = { ines: b().ines, paid: g0 - s.player.gold };
      // ── ② 수방의 장부 → ③ 장 황후 (옥란이 함께)
      s = fresh(1627, 1, 1); at(s, 1627, 7, 1); out.okEarly = (NC.state().ines = 'free', at(s, 1627, 5, 30), NC.pending()); delete NC.state().ines; at(s, 1627, 7, 1); await go(['fight'], ['win']);
      out.B1 = { okran: b().okran, hired: hired('nc_okran'), ledger: has('nc_ledger'), pass: G.Sneak.hasPass(G.CITY_DATA[188]), shrine: said.some(x => /생사\(生祠\)/.test(x)), visible: G.MATE.nc_okran.eventOnly === false };
      at(s, 1627, 9, 20, 188); out.palEarly = NC.pending();
      g0 = s.player.gold; at(s, 1627, 10, 20, 188); await go(['empress']);
      out.B2 = { palace: b().palace, gold: s.player.gold - g0, ledger: has('nc_ledger'), empress: said.some(x => /아이를 잃었다/.test(x)), cz: said.some(x => /구천세는 없다/.test(x)), okLine: said.some(x => /살아 있었구나, 옥란아/.test(x)), hired: hired('nc_okran') };
      s.loc = { mode: 'sea', lon: 122, lat: 39 }; s.ningChong.told = {};
      const day = (y, m, d) => { s.date = { y, m, d }; return NC.daily().map(x => x.text).join(' | '); };
      out.newsB = { cz: day(1627, 10, 2), wei: day(1627, 12, 11), ke: day(1627, 12, 20) };
      // ── ③ 판다 — 옥란이 떠난다
      s = fresh(1627, 1, 1); at(s, 1627, 8, 1); await go(['bribe']); const nb = s.player.notoriety || 0; g0 = s.player.gold;
      at(s, 1627, 11, 1, 188); await go(['sell']);
      out.B3 = { palace: b().palace, okran: b().okran, hired: hired('nc_okran'), gold: s.player.gold - g0, noto: (s.player.notoriety || 0) - nb, ledger: has('nc_ledger'), burn: said.some(x => /종이는 불에 타면/.test(x)) };
      // ── ② 외면 → 장부·출입패는 받는다 · ④ 옥문 (이네스도 끌려갔다)
      s = fresh(1626, 1, 1); at(s, 1626, 3, 1); await go(['no']); at(s, 1627, 6, 10); await go(['no']);
      out.B4 = { okran: b().okran, ledger: has('nc_ledger'), pass: G.Sneak.hasPass(G.CITY_DATA[188]), throwPass: said.some(x => /수방의 출입패예요/.test(x)) };
      at(s, 1627, 12, 5, 173); out.freeEarly = NC.pending();
      at(s, 1628, 1, 5, 173); await go([]);   // 장부는 아직 품에 — 기한이 지나서 먼저 「늦었다」
      const lateFirst = b().palace;
      at(s, 1628, 1, 6, 173); await go([]);
      out.B5 = { lateFirst, freed: b().freed, ines: b().ines, okran: b().okran, both: hired('nc_ines') && hired('nc_okran'), sing: said.some(x => /포 쏘는 소리를 흉내/.test(x)) };
      // ── ④ 장부를 판 뒤 옥문 — 옥란은 따르지 않는다
      s = fresh(1627, 1, 1); at(s, 1627, 7, 1); await go(['fight'], ['lose']); at(s, 1627, 11, 1, 188); await go(['sell']); at(s, 1628, 2, 1, 188); await go([]);
      out.B6 = { okran: b().okran, hired: hired('nc_okran'), refuse: said.some(x => /고맙다고는 못 하겠어요/.test(x)) };
      // ── ⑤ 빈 곳간 — 싣고 오겠다 → 쌀 40 · 밀 30
      s = fresh(1628, 1, 1); at(s, 1628, 7, 1); await go(['quest']); const q = b().grain;
      s.fleet.cargo.rice = { q: 40, cost: 5 }; s.fleet.cargo.wheat = { q: 30, cost: 5 }; g0 = s.player.gold;
      at(s, 1628, 7, 20); await go([]);
      out.C1 = { q, grain: b().grain, gold: s.player.gold - g0, expect: Math.round(G.GOOD.rice.p * 40 * 0.7) + Math.round(G.GOOD.wheat.p * 20 * 0.7), rice: !s.fleet.cargo.rice, wheat: s.fleet.cargo.wheat && s.fleet.cargo.wheat.q };
      s.loc = { mode: 'sea', lon: 122, lat: 39 }; s.ningChong.told = {}; s.date = { y: 1628, m: 8, d: 25 }; out.mutiny = NC.daily().map(x => x.text).join(' | ');
      s = fresh(1628, 1, 1); g0 = s.player.gold; at(s, 1628, 9, 1); await go(['loan']); out.C2 = { grain: b().grain, paid: g0 - s.player.gold, iou: has('nc_iou') };
      s = fresh(1628, 1, 1); at(s, 1628, 7, 1); await go(['quest']); at(s, 1629, 4, 2, 173); await go([]); out.C3 = b().grain;
      // ── 소식 (이네스를 구한 갈래)
      s = fresh(1626, 1, 1); at(s, 1626, 3, 1); await go(['bribe']); s.loc = { mode: 'sea', lon: 122, lat: 39 }; s.ningChong.told = {};
      out.newsA = { gen: (s.date = { y: 1626, m: 4, d: 20 }, NC.daily().map(x => x.text).join(' | ')), yz: (s.date = { y: 1629, m: 6, d: 1 }, NC.daily().map(x => x.text).join(' | ')) };
      // ── 옛 저장 · 소문 · 일지 · 말투 · 연결
      s = fresh(1640, 1, 1); delete s.ningChong; out.oldSave = NC.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'ningchong');
      out.journal = !!(NC.daily && NC.daily._journal);
      out.voice = !!(G.VOICES && G.VOICES.nc_ines && G.VOICES.nc_okran && G.VOICES.nc_ines.love && G.VOICES.nc_okran.wife);
      return out;
    });
    console.log(JSON.stringify({ B1: r.B1, okEarly: r.okEarly, B3: r.B3, B4: r.B4, B6: r.B6, C2: r.C2, C3: r.C3, freeEarly: r.freeEarly, palEarly: r.palEarly, o: [r.oldSave, r.rumor, r.journal, r.voice] })); console.log(JSON.stringify({ w0: r.w0, W: r.W, A_wall: r.A_wall, A_hj: r.A_hj, B2: r.B2, B5: r.B5, C1: r.C1 }));
    ok(r.hidden, '이네스·옥란은 처음엔 술집에 없다 · 연애 가능(wed 없음)');
    ok(r.w0.hjFirst && !r.w0.nc && r.w0.hjNing === 'no' && r.W.wall === 'won' && r.W.refused && r.W.name && r.W.small && r.W.father, '⓪ 성벽 — houjin 의 군관이 먼저 · 거절한 제독에게만 작은 싸움(28)으로 · 「제 이름은 이네스」');
    ok(r.wQuest === false && r.wWon === false && r.hjWall === false, '⓪ 대포를 약조했거나(quest) houjin 의 영원성 싸움을 치렀으면(won) 성벽 장면은 없다 — 큰 싸움이 두 번 생기지 않는다');
    ok(r.A_wall.wallLost === 'lost' && r.A_wall.ines === 'joined' && r.A_wall.how === 'fight' && r.A_wall.hired && r.A_wall.known && r.A_wall.yuanOpt && r.A_wall.jiyong && r.A_wall.visible, '① 함께 성벽을 지킨 포수 — 진수 태감 기용 「구천세의 위엄」 · 부두 싸움 → 이네스가 배에');
    ok(r.A_hj.ines === 'joined' && r.A_hj.how === 'yuan' && r.A_hj.umbrella && r.A_hj.gate && r.A_hj.fights === 0 && r.A_hj.hired, '① houjin ② 를 한 제독 — 「노란 일산을 겨눈 그 포」 · 원숭환이 서문의 수문을 열어 둔다');
    ok(r.A_none.ines === 'taken' && r.A_none.noYuan && r.A_none.stranger && r.A_none.hidden && r.A_lose.ines === 'taken' && r.A_lose.shard && r.A_bribe.ines === 'joined' && r.A_bribe.paid === 2500, '① 낯선 여인 — 원숭환 갈래 없음 · 못 본 척/지면 동창에 (포탄 조각) · 은자 2,500');
    ok(r.okEarly === false && r.B1.okran === 'joined' && r.B1.hired && r.B1.ledger && r.B1.pass && r.B1.shrine && r.B1.visible, '② 수방의 장부 (1627.6~) — 옥란이 배에 · 장부 · 수방의 출입패(북경 성문 통행)');
    ok(r.palEarly === false && r.B2.palace === 'empress' && r.B2.gold === 3000 && !r.B2.ledger && r.B2.empress && r.B2.cz && r.B2.okLine && r.B2.hired, '③ 자경궁 (10.2~) — 장 황후 「아이를 잃었다」 · 숭정제 「구천세는 없다」 · 하사금');
    ok(/소매에 넣어 온 떡/.test(r.newsB.cz) && /이제예요/.test(r.newsB.cz) && /부성/.test(r.newsB.wei) && /망포의 안감/.test(r.newsB.wei) && /완의국/.test(r.newsB.ke), '소식 — 숭정제 즉위 · 위충현 자결(장부가 황제의 책상에) · 객씨');
    ok(r.B3.palace === 'sold' && r.B3.okran === 'gone' && !r.B3.hired && r.B3.gold === 12000 && r.B3.noto === 10 && !r.B3.ledger && r.B3.burn, '③ 장부를 동창에 팔면 — 금화 12,000 · 악명 +10 · 옥란이 배를 떠난다');
    ok(r.B4.okran === 'taken' && r.B4.ledger && r.B4.pass && r.B4.throwPass, '② 외면해도 — 끌려가는 옥란이 장부와 출입패를 던진다');
    ok(r.freeEarly === false && r.B5.lateFirst === 'late' && r.B5.freed === 1 && r.B5.ines === 'joined' && r.B5.okran === 'joined' && r.B5.both && r.B5.sing, '④ 옥문이 열리다 (12.11~, 오문) — 끌려간 이네스·옥란이 함께 배에 · 장부는 기한이 지나 「늦었다」');
    ok(r.B6.okran === 'gone' && !r.B6.hired && r.B6.refuse, '④ 장부를 팔았으면 옥란은 따르지 않는다');
    ok(r.C1.q === 'quest' && r.C1.grain === 'done' && r.C1.gold === r.C1.expect && r.C1.rice && r.C1.wheat === 10 && /쌀이 먼저 닿은/.test(r.mutiny) && r.C2.grain === 'loan' && r.C2.paid === 3000 && r.C2.iou && r.C3 === 'late', '⑤ 빈 곳간 — 쌀부터 밀까지 60통을 0.7배로 · 영원의 병변 소식 · 차용증 · 기한');
    ok(/안국전군평요정로대장군/.test(r.newsA.gen) && /오문에서 온 여인/.test(r.newsA.gen) && /이자성/.test(r.newsA.yz), '소식 — 대포의 장군 칭호(포수는 적히지 않았다) · 역참 감축과 이자성');
    ok(r.oldSave === 0 && r.rumor && r.journal && r.voice, '옛 저장 · 소문 · 일지 · 이네스·옥란의 말투(연정·아내)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
