/* 루터의 종교 개혁 — 면죄받은 자들 (2026-10-29) — 술을 싣고 만난다 · 단서 셋 · 추리 · 고발과 육상전 · 빈 맥주 통 · 소식
   node tests/reformation_smoke.js */
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
      const out = {}, said = [], toasts = [], asks = [], battles = [];
      let picks = [], fightRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asks.push({ q, opts: opts.map(o => o.value + (o.dis ? '!' : '')) }); const want = picks.shift(); const o = opts.find(x => x.value === want && !x.dis) || opts[opts.length - 1]; return o.value; };
      G.UI.toast = (t) => { toasts.push(t); };
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { battles.push({ name, n, o }); return fightRes; };
      const RF = G.Reform, MAG = 50;
      const lot = q => ({ q, cost: 20 });
      function fresh(y, m, d, cargo, items) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.gold = 1000;
        const c = G.CITY_DATA[MAG]; s.loc = { mode: 'city', city: MAG, lon: c.lon, lat: c.lat };
        s.fleet.cargo = cargo || {}; (items || []).forEach(id => G.R.addItem(id));
        said.length = 0; toasts.length = 0; asks.length = 0; battles.length = 0; delete s.reform;
        return s;
      }
      const sayBy = (n, re) => said.some(t => t.startsWith(n + '|') && re.test(t));
      out.data = ['lu_luther', 'lu_katharina', 'lu_cardinal', 'lu_ruprecht', 'lu_canon', 'lu_tetzel', 'lu_konrad', 'lu_kurt'].every(id => G.HIST_FIG[id]) && !!G.ITEM.luther_note && G.HIST_FIG.lu_luther.face === 'portraits/sponsors/de_luther';
      // 술이 없으면 · 기간 밖이면 · 다른 도시면 없다
      out.noDrink = (fresh(1503, 5, 1, {}), RF.pending());
      out.late = (fresh(1511, 1, 1, { wine: lot(30) }), RF.pending());
      out.early = (fresh(1498, 12, 31, { wine: lot(30) }), RF.pending());
      // ① 술(포도주 12 · 맥주 4)을 싣고 — 루터와 카타리나, 면죄받은 자들
      let s = fresh(1503, 5, 1, { wine: lot(12), beer: lot(4) }); picks = ['canon', 'monks', 'later'];
      out.meetPend = RF.pending(); await RF.check();
      out.meet = { met: s.reform.met, story: sayBy('마르틴 루터', /앞으로 지을 죄|아직 짓지 않은 죄/) && sayBy('비단 상인 콘라트', /면죄부/) && sayBy('기사 쿠르트', /값을 치렀다/), kath: sayBy('카타리나 폰 보라', /소름/), adult: said.some(t => /스물넷/.test(t)),
        clue: Object.assign({}, s.reform.clue), wine: s.fleet.cargo.wine ? s.fleet.cargo.wine.q : 0, monksDis: asks[0].opts.includes('monks!'), feastDis: asks[0].opts.includes('feast!'), html: RF.html().replace(/<[^>]+>/g, ' ') };
      // 다음에 — 맥주 대신 술 선물(셰리)로 단서 ② · 연회는 술 20
      s.fleet.cargo.beer = lot(0); delete s.fleet.cargo.beer; G.R.addItem('sack'); s.fleet.cargo.rum = lot(25); picks = ['monks', 'feast', 'later'];
      out.again = RF.pending(); said.length = 0; asks.length = 0; await RF.check();
      out.mid = { clue: Object.assign({}, s.reform.clue), sack: s.player.items.some(x => x.id === 'sack'), rum: s.fleet.cargo.rum ? s.fleet.cargo.rum.q : 0, card: sayBy('그라우엔펠스 추기경', /곁에 있어야/), kath: sayBy('카타리나 폰 보라', /손 치우세요/), ledger: said.some(t => /미래의 죄/.test(t)), deduceOpt: asks[asks.length - 1].opts.includes('deduce') };
      // 추리 — 두 번 틀리면 그날은 끝
      picks = ['deduce', 'tetzel', 'canon']; said.length = 0; await RF.check();
      out.wrong = { solved: !!s.reform.solved, wrong: s.reform.wrong, battles: battles.length, kath: sayBy('카타리나 폰 보라', /다음에 해요/) };
      // 다시 — 한 번 틀리고 다 맞힌다 · 사병에게 진다
      fightRes = 'lose'; picks = ['deduce', 'cardinal', 'drunk', 'ledger', 'paid']; said.length = 0; await RF.check();
      out.lost = { solved: !!s.reform.solved, b: battles[0] && { n: battles[0].n, kind: battles[0].o.kind, leader: battles[0].o.leader }, again: RF.pending() };
      s.date = G.U.addDays(s.date, 8); fightRes = 'win'; picks = ['deduce', 'cardinal', 'ledger', 'paid', 'poor']; said.length = 0; battles.length = 0;
      const tr0 = G.Sponsor.rel('de_luther').trust;
      out.retry = RF.pending(); await RF.check();
      out.win = { solved: !!s.reform.solved, gave: s.reform.gave, note: s.player.items.some(x => x.id === 'luther_note'), barrel: sayBy('카타리나 폰 보라', /맥주 통/), trust: G.Sponsor.rel('de_luther').trust - tr0, gold: s.player.gold, confess: sayBy('비서 루프레히트', /자백|모두 말하겠소/), after: RF.pending(), html: RF.html() };
      // 소식 — 1517 테첼 · 비텐베르크의 문(풀었을 때) · 1525 혼례 (탈출 소식은 없다)
      s.date = { y: 1517, m: 4, d: 1 }; const news = [];
      for (let i = 0; i < 3000; i++) { s.date = G.U.addDays(s.date, 1); RF.daily().forEach(x => news.push(x.text)); }
      out.news = news.map(t => (t.match(/【([^】]+)】/) || [])[1]);
      out.doorLine = news.some(t => /비텐베르크의 문/.test(t) && /마그데부르크의 술집/.test(t));
      // 풀지 못한 판: 탈출 소식 · 문 소식 없음 · 수첩은 1517.10.30까지
      s = fresh(1505, 1, 1, { beer: lot(5) }); picks = ['later']; await RF.check(); s.date = { y: 1523, m: 3, d: 1 };
      const n2 = []; for (let i = 0; i < 900; i++) { s.date = G.U.addDays(s.date, 1); RF.daily().forEach(x => n2.push(x.text)); }
      out.unsolved = n2.map(t => (t.match(/【([^】]+)】/) || [])[1]); out.closed = RF.html() === '' && (s.loc.city = MAG, !RF.pending());
      // 아이템 술(브랜디 한 통)만 있어도 만난다
      out.itemOnly = (fresh(1509, 5, 1, {}, ['brandy']), RF.pending());
      // 옛 저장(1530): 지난 소식은 몰아서 알리지 않는다
      s = fresh(1530, 1, 1, {}); RF.daily(); s.reform.met = 1; out.old = RF.daily().length;
      return out;
    });
    console.log('   ' + JSON.stringify({ meet: r.meet, mid: r.mid, wrong: r.wrong, lost: r.lost, win: Object.assign({}, r.win, { html: undefined }), news: r.news, unsolved: r.unsolved }));
    ok(r.data, '인물 여덟 · 루터는 후원자 그림 · 기념품 「루터의 수첩 한 장」');
    ok(r.noDrink === false && r.late === false && r.early === false, '술이 없거나 1499~1510년 밖이면 루터를 만나지 않는다');
    ok(r.meetPend && r.meet.met && r.meet.story && r.meet.kath && r.meet.adult, '① 사건 수첩: 면죄부를 흔들며 다시 죄를 짓는 상인·기사 · 「앞으로 지을 죄」 · 카타리나(스물넷, 추기경에게 치를 떤다)');
    ok(r.meet.clue.canon && !r.meet.clue.monks && r.meet.wine === 2 && r.meet.monksDis && r.meet.feastDis && /단서 ①/.test(r.meet.html), '단서 ① 참사회원에게 포도주 10 — 맥주가 모자라면 단서 ②는 잠기고, 연회는 ①② 뒤');
    ok(r.again && r.mid.clue.monks && r.mid.clue.feast && !r.mid.sack && r.mid.rum === 5 && r.mid.card && r.mid.kath && r.mid.ledger && r.mid.deduceOpt, '단서 ② 맥주 대신 술 선물(셰리) · 단서 ③ 연회에 술 20 — 추기경이 카타리나를 붙잡고, 친필 장부');
    ok(!r.wrong.solved && r.wrong.wrong === 2 && r.wrong.battles === 0 && r.wrong.kath, '추리를 두 번 틀리면 그날은 고발하지 못한다');
    ok(!r.lost.solved && r.lost.b && r.lost.b.kind === 'garrison' && r.lost.b.n === 40 && /루프레히트/.test(r.lost.b.leader) && !r.lost.again, '추리를 맞히면 고발 → 추기경의 사병 40과 육상전 — 지면 일주일 뒤 다시');
    ok(r.retry && r.win.solved && r.win.gave === 'poor' && r.win.note && r.win.barrel && r.win.trust === 20 && r.win.gold === 1000 && r.win.confess && !r.win.after && r.win.html === '', '이기면 추기경 소환 · 카타리나는 빈 맥주 통으로 · 금고를 가난한 이에게 — 루터의 신뢰 +20');
    ok(r.news.includes('테첼의 노래') && r.news.includes('비텐베르크의 문') && r.news.includes('루터와 카타리나의 혼례') && !r.news.includes('수녀원의 탈출') && r.doorLine, '소식: 테첼의 노래 · 비텐베르크의 문(마그데부르크 술집의 한 줄) · 혼례');
    ok(r.unsolved.includes('수녀원의 탈출') && !r.unsolved.includes('비텐베르크의 문') && r.closed, '풀지 못한 판: 청어 통 탈출 소식 · 1517년 10월이 지나면 수사도 닫힌다');
    ok(r.itemOnly, '교역품 대신 술 선물 아이템만 있어도 루터를 만난다');
    ok(r.old === 0, '옛 저장은 지난 소식을 몰아서 알리지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
