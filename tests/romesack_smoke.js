/* 1527년 로마 약탈 (2026-10-29 사용자 요청) — node tests/romesack_smoke.js   (BROWSER_EXE=크롬 경로)
   · 인물 6명 · 『군주론』 필사본(책) · 「산탄젤로의 천사상」(귀한 선수상 — 조선소에서 다는 유물 선수상) · 장면이 날짜·도시에 맞게
   · 로마를 지키는 판: ① 피렌체 경고 → ② 4월 말에 오면 5월 5일까지 기다린다(날이 지나간다) → 성벽(육상전 110 · 부르봉) → 파세토(퇴각 판) →
     약탈꾼을 약탈(육상전 35) → 기부 → 천사상 / ③ 마키아벨리의 분노 → 『군주론』(지력 +2) / ④ 행상 수레 → 오르비에토 → 교황청 명예 작위 (황금 박차 기사 → 라테라노 궁정백)
   · 다른 판: 부하의 몫(7,000) · 매수 · 들켜서 일기토 · 6월 21일이 지나면 귀차르디니가 『군주론』을 보낸다 · 맨 위 작위면 하사금 · 소식 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.RomeSack && G.Hist && G.World && G.Court, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, RS = G.RomeSack, said = [], asked = [], out = {};
      let plan = [], chanceV = true, duelV = 'win', battleV = 'win', warV = { res: 'win', left: 40 };
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t, title) => { said.push('[창] ' + (title || '') + ' ' + String(t).replace(/<[^>]+>/g, ' ')); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async (l) => { said.push('[소식] ' + l.map(x => x.text).join(' / ')); };
      const ch0 = G.U.chance; G.U.chance = () => chanceV;
      const battles = [], wars = [], duels = [];
      G.Scenes.land.landBattle = async (name, n, b, o) => { battles.push({ name, n, kind: o && o.kind, leader: o && o.leader }); return battleV; };
      G.Games.landWar = async (o) => { wars.push({ n: o.enemy.n, party: o.party, hold: o.hold }); return Object.assign({}, warV); };
      G.Games.duel = async (en) => { duels.push(en.name); return duelV; };
      const fresh = (nation) => {
        G.State.newGame({ name: '시험', nation: nation || 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1527, m: 1, d: 1 }; delete s.romeSack; s.fleet.crew = 150; s.player.gold = 10000; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c == null ? 33 : c }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = RS.pending(); if (p) await RS.check(); return p; };
      out.figs = G.ROMESACK_FIGS.length; out.figNames = G.ROMESACK_FIGS.every(id => G.Hist.speaker(id).name === G.HIST_FIG[id].name);
      out.items = { book: G.ITEM.il_principe && G.ITEM.il_principe.kind, fig: !!(G.FIGUREHEAD.r_santangelo && G.FIGUREHEAD.r_santangelo.relic && G.FIGUREHEAD.r_santangelo.rare), figItem: G.ITEM.r_santangelo && G.ITEM.r_santangelo.kind };
      // 날짜·도시
      let s = fresh();
      const gate = (y, m, d, c, st) => { at(s, y, m, d, c); s.romeSack = Object.assign({ told: {} }, st || {}); return RS.pending(); };
      out.gates = { warn: gate(1527, 3, 10, 30), warnPisa: gate(1527, 4, 1, 31), warnRome: gate(1527, 4, 1, 33), wall: gate(1527, 4, 20, 33), wallLate: gate(1527, 5, 7, 33, { warn: 'no' }),
        mach: gate(1527, 6, 1, 30, { wall: 'win', defended: true, warn: 'go' }), machNo: gate(1527, 6, 1, 30, { wall: 'lose', defended: false, warn: 'go' }), machLate: gate(1527, 6, 21, 30, { wall: 'win', defended: true, warn: 'go' }),
        flee: gate(1527, 11, 20, 33, { wall: 'leave' }), fleeLate: gate(1527, 12, 7, 33, { wall: 'leave' }) };
      // ── 로마를 지키는 판
      s = fresh('PT');
      at(s, 1527, 3, 20, 30); await go(['go']);
      out.warn = { v: s.romeSack.warn, mach: said.some(x => /^니콜로 마키아벨리: .*굶주린 늑대/.test(x)), river: said.some(x => /운명은 강물과 같다/.test(x)) };
      at(s, 1527, 4, 28, 33); battles.length = 0; wars.length = 0; const crew0 = s.fleet.crew; warV = { res: 'win', left: 36 }; battleV = 'win';
      await go(['stay', 'wall', 'donate']);
      out.wall = { date: s.date.m + '.' + s.date.d, wall: s.romeSack.wall, battle: battles[0], escort: s.romeSack.escort, war: wars[0], defended: s.romeSack.defended, loot: s.romeSack.loot, looterBattle: battles[1],
        fig: G.R.hasItem('r_santangelo'), bourbon: said.some(x => /^부르봉 공작 샤를: /.test(x)), cellini: said.some(x => /^벤베누토 첼리니: .*내가 맞혔소/.test(x)), passetto: said.some(x => /파세토/.test(x)), swiss: said.some(x => /^카스파르 뢰이스트: /.test(x)), crewLost: crew0 - s.fleet.crew, sack: said.some(x => /여드레 동안 로마는 지옥/.test(x)) };
      at(s, 1527, 5, 25, 30); const int0 = s.player.st ? JSON.stringify(s.player.st) : ''; await go([]);
      out.mach = { prince: s.romeSack.prince, book: G.R.hasItem('il_principe'), rage: said.some(x => /이탈리아가 스스로 지키지 못했으니/.test(x)), exhort: said.some(x => /야만인들로부터 해방/.test(x)), stChanged: (s.player.st ? JSON.stringify(s.player.st) : '') !== int0 };
      const title0 = G.Court.rank(G.COURT.realms.PAPAL);
      at(s, 1527, 11, 20, 33); chanceV = true; await go(['hide']);
      out.flee = { v: s.romeSack.flee, res: s.romeSack.fleeRes, title: s.romeSack.title, rank: G.Court.rank(G.COURT.realms.PAPAL) - title0, known: said.some(x => /파세토의 그 선장/.test(x)), alert: said.some(x => /명예 작위/.test(x)) };
      s.loc = { mode: 'sea', lon: 12, lat: 41 }; s.date = { y: 1527, m: 12, d: 7 }; out.escapeNews = RS.daily().map(x => x.text).join(' | ');
      out.logs = s.log.map(x => x.t).filter(t => /로마|교황|마키아벨리|천사상|파세토/.test(t)).length;
      // ── 두 번째 작위: 다시 같은 일을 하면 라테라노 궁정백 → 그다음은 하사금
      s.romeSack.flee = null; at(s, 1527, 11, 25, 33); await go(['bribe']); out.second = { title: s.romeSack.title, rank: G.Court.rank(G.COURT.realms.PAPAL) };
      s.romeSack.flee = null; const g1 = s.player.gold; await go(['bribe']); out.third = { title: s.romeSack.title, gold: s.player.gold - g1 };
      // ── 부하의 몫 · 성벽에서 밀려나도 파세토로 지키면 「지켰다」
      s = fresh('ES'); at(s, 1527, 5, 6, 33); battleV = 'lose'; warV = { res: 'win', left: 40 };
      const espTrust0 = G.Sponsor.rel('es_crown').trust; G.Sponsor.rel('es_crown').met = 1;
      let g0 = s.player.gold; battles.length = 0;
      // 성벽 패배 후 약탈꾼 싸움은 이겨야 하므로 두 번째 싸움부터 'win'
      G.Scenes.land.landBattle = async (name, n, b, o) => { battles.push({ name, n }); return battles.length === 1 ? 'lose' : 'win'; };
      await go(['wall', 'keep']);
      out.keep = { wall: s.romeSack.wall, escort: s.romeSack.escort, defended: s.romeSack.defended, loot: s.romeSack.loot, gold: s.player.gold - g0, es: G.Sponsor.rel('es_crown').trust - espTrust0 };
      // ── 바티칸으로 곧장 · 파세토도 밀려나면 지키지 못했다 → 마키아벨리는 오지 않는다
      s = fresh('PT'); at(s, 1527, 5, 6, 33); warV = { res: 'lose', left: 10 }; await go(['skip', 'keep']);
      out.notDefended = { wall: s.romeSack.wall, escort: s.romeSack.escort, defended: s.romeSack.defended, mach: (at(s, 1527, 6, 1, 30), RS.pending()) };
      // ── 6월 21일: 지켰지만 마키아벨리를 못 만났으면 귀차르디니가 보낸다
      s = fresh('PT'); s.romeSack = { told: { medici: 1, surrender: 1 }, met: 1, defended: true, wall: 'win' }; s.loc = { mode: 'sea', lon: 12, lat: 41 }; s.date = { y: 1527, m: 6, d: 21 };
      out.letter = { news: RS.daily().map(x => x.text).join(' | '), book: G.R.hasItem('il_principe'), prince: s.romeSack.prince };
      // ── 들켜서 일기토에 지면 작위 없음
      s = fresh('PT'); at(s, 1527, 11, 20, 33); s.romeSack = { told: {}, wall: 'leave' }; chanceV = false; duelV = 'lose'; duels.length = 0; const r0 = G.Court.rank(G.COURT.realms.PAPAL);
      await go(['hide']); out.caught = { res: s.romeSack.fleeRes, duel: duels[0], rank: G.Court.rank(G.COURT.realms.PAPAL) - r0 };
      s.player.items.push({ id: 'il_principe' });
      out.print = (s.date = { y: 1532, m: 1, d: 1 }, s.romeSack.told = { medici: 1, surrender: 1, machDeath: 1, escape: 1, crown: 1 }, s.romeSack.met = 1, RS.daily().map(x => x.text).join(' | '));
      s = fresh('PT'); s.date = { y: 1531, m: 1, d: 1 }; delete s.romeSack; out.oldSave = RS.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'romesack');
      out.journal = !!(RS.daily && RS.daily._journal);
      G.U.chance = ch0;
      return out;
    });
    console.log(JSON.stringify({ wall: r.wall, flee: r.flee, second: r.second, third: r.third, keep: r.keep }));
    ok(r.figs === 6 && r.figNames, '인물 6명 (클레멘스 7세·마키아벨리·귀차르디니·부르봉·뢰이스트·첼리니)');
    ok(r.items.book === 'book' && r.items.fig && r.items.figItem === 'fig', '『군주론』 필사본(책) · 산탄젤로의 천사상(귀한 유물 선수상)');
    const g = r.gates;
    ok(g.warn && g.warnPisa && !g.warnRome && g.wall && !g.wallLate && g.mach && !g.machNo && !g.machLate && g.flee && !g.fleeLate, '장면이 날짜·도시에 맞게 열린다 ' + JSON.stringify(g));
    ok(r.warn.v === 'go' && r.warn.mach && r.warn.river, '① 피렌체 성벽의 마키아벨리 — 「굶주린 늑대 떼」 · 「운명은 강물과 같다」');
    const w = r.wall;
    ok(w.date === '5.5' && w.wall === 'win' && w.battle.n === 110 && w.battle.leader === '부르봉 공작 샤를' && w.bourbon && w.cellini, '② 4월 말에 오면 5월 5일까지 기다린다 → 안개 낀 성벽(황제군 110) — 부르봉이 사다리에서 쓰러진다');
    ok(w.escort === 'win' && w.war.n === 60 && w.war.party === 40 && w.war.hold === 2 && w.passetto && w.swiss && w.crewLost === 4 && w.defended, '파세토 — 교황을 산탄젤로성으로 (퇴각 판 · 적 60 · 40명 · 두 차례) · 로마를 지켰다');
    ok(w.sack && w.looterBattle && w.looterBattle.n === 35 && w.loot === 'donate' && w.fig, '약탈의 여드레 → 약탈꾼을 덮쳐 되찾은 금은을 로마 사람들에게 기부 → 산탄젤로의 천사상');
    ok(r.mach.prince === 'given' && r.mach.book && r.mach.rage && r.mach.exhort, '③ 마키아벨리가 치를 떨며 『군주론』 필사본을 건넨다 — 「야만인들로부터 해방하라는 권고」');
    ok(r.flee.v === 'hide' && r.flee.res === 'ok' && r.flee.title === '황금 박차 기사' && r.flee.rank === 1 && r.flee.known && r.flee.alert && /수레를 몬 것이 바다의 제독/.test(r.escapeNews), '④ 행상 수레로 교황을 오르비에토로 — 교황청 명예 작위 「황금 박차 기사」');
    ok(r.second.title === '라테라노 궁정백' && r.second.rank === 2 && r.third.title === 'top' && r.third.gold === 6000 - 3000, '다음은 라테라노 궁정백, 맨 위면 하사금 6,000 (매수 3,000을 뺀 셈)');
    ok(r.keep.wall === 'lose' && r.keep.escort === 'win' && r.keep.defended && r.keep.loot === 'keep' && r.keep.gold === 7000 && r.keep.es < 0, '성벽에서 밀려나도 파세토를 지키면 「지켰다」 · 부하들이 약탈꾼을 약탈한 몫 7,000 · 에스파냐 왕실의 신뢰 −');
    ok(r.notDefended.wall === 'skip' && r.notDefended.escort === 'lose' && !r.notDefended.defended && !r.notDefended.mach, '성벽도 회랑도 지키지 못하면 마키아벨리는 오지 않는다');
    ok(/귀차르디니의 편지/.test(r.letter.news) && r.letter.book && r.letter.prince === 'letter', '6월 21일 마키아벨리의 죽음 — 만나지 못했으면 귀차르디니가 『군주론』을 보낸다');
    ok(r.caught.res === 'fail' && r.caught.duel === '에스파냐 장교' && r.caught.rank === 0, '들켜서 일기토에 지면 작위는 없다');
    ok(/다섯 해 먼저/.test(r.print) && r.oldSave === 0 && r.rumor && r.journal, '1532 『군주론』이 책으로 — 필사본이 다섯 해 먼저 · 옛 저장 · 소문 · 일지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
