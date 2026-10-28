/* 포토시 은광 — 은의 산과 샛별 (2026-10-29 사용자 요청) — node tests/potosi_smoke.js   (BROWSER_EXE=크롬 경로)
   · 인물 5명 · 동료 차스카(어른 · 매력 96 · 세공 3 · 케추아 말) · 장면은 포토시에서 날짜에 맞게
   · ① 바람의 불: 비야로엘과 원주민의 대립 — 에스파냐 편(2,000닢) / 원주민 편 / 사이에서 말린다(800닢)
   · ② 볼모 구출 작전: 갱도 잠입 → 감독관 멘도와 일기토 → 조용히 / 라마 행렬 → 들킴 → 퇴각 판 탈출 / 탈출 실패 → 20일 뒤 다시 /
     청원(성공·실패, 한 번만) / 정면 습격(악명 +2) · 에스파냐 편이었으면 갱도 길잡이가 없다
   · 구하면 차스카 합류 (충성 90) · 소식(황제의 마을 · 1551 돌아갔다 · 미타 — 차스카가 배에 있으면 한 줄) · 소문 · 말투 · 육상전 특성 · 콘솔 오류 0 */
'use strict';
const path = require('path');
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
    await page.waitForFunction(() => window.G && G.Game && G.Potosi && G.Hist && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, PO = G.Potosi, said = [], asked = [], out = {};
      let plan = [], chanceV = true, duelV = 'win', warV = { res: 'win', left: 20 };
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      const ch0 = G.U.chance; G.U.chance = (p) => chanceV;
      const duels = [], wars = [], battles = [];
      G.Games.duel = async (en, o) => { duels.push(en.name); return duelV; };
      G.Games.landWar = async (o) => { wars.push({ n: o.enemy.n, party: o.party, hold: o.hold }); return Object.assign({}, warV); };
      G.Scenes.land.landBattle = async (name, n, b, o) => { battles.push({ name, n }); return 'win'; };
      const fresh = (nation) => {
        G.State.newGame({ name: '시험', nation: nation || 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1544, m: 1, d: 1 }; delete s.potosi; s.fleet.crew = 120; s.player.gold = 10000; return s;
      };
      const at = (s, y, m, d) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: 225 }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = PO.pending(); if (p) await PO.check(); return p; };
      const hired = (s) => s.mates.some(m => m.id === 'chaska');
      const c = G.MATE.chaska;
      out.figs = G.POTOSI_FIGS.length; out.figNames = G.POTOSI_FIGS.every(id => G.Hist.speaker(id).name === G.HIST_FIG[id].name);
      out.mate = { minor: !!c.minor, cha: c.st[3], craft: c.sk.craft, que: c.lg[11], wage: c.wage, only: c.eventOnly, g: c.g };
      // 날짜
      let s = fresh();
      const gate = (y, m, d, st) => { at(s, y, m, d); s.potosi = Object.assign({ told: {} }, st || {}); return PO.pending(); };
      out.gates = { fire: gate(1545, 5, 1), fireEarly: gate(1545, 4, 1), host: gate(1546, 2, 1, { fire: 'native' }), hostEs: gate(1546, 2, 1, { fire: 'es' }), hostMissed: gate(1547, 1, 1),
        hostLate: gate(1551, 1, 1, { fire: 'mid' }), hostCool: (s.day = 100, gate(1547, 1, 1, { fire: 'mid', cool: 110 })) };
      // ── ① 원주민 편 → ② 갱도 → 일기토 이김 → 조용히
      s = fresh(); at(s, 1545, 5, 1); await go(['native']);
      out.fire = { v: s.potosi.fire, conflict: said.some(x => /^후안 데 비야로엘: .*등록한 자의 것/.test(x)), chaska: said.some(x => /^차스카: .*이 산은 우리의 와카/.test(x)), thunder: said.some(x => /뒤에 올 자들의 것/.test(x)) };
      at(s, 1546, 3, 1); chanceV = true; duelV = 'win'; duels.length = 0; wars.length = 0; await go(['tunnel']);
      out.tunnel = { opts: asked[0] && asked[0].opts, hired: hired(s), how: s.potosi.how, duel: duels[0], wars: wars.length, loyal: (s.mates.find(m => m.id === 'chaska') || {}).loyal, star: said.some(x => /바다가 보고 싶어요/.test(x)), log: s.log.map(x => x.t).some(t => /차스카를 구했다/.test(t)) };
      out.noMore = (at(s, 1546, 6, 1), PO.pending());
      // ── 라마 행렬 → 들킴 → 탈출 성공 (선원 2명 잃음)
      s = fresh(); at(s, 1546, 2, 1); s.potosi = { told: {}, fire: 'mid' }; chanceV = false; warV = { res: 'win', left: 18 }; wars.length = 0; let g0 = s.player.gold, crew0 = s.fleet.crew;
      await go(['caravan']);
      out.caravan = { hired: hired(s), gold: g0 - s.player.gold, war: wars[0], crew: crew0 - s.fleet.crew, how: s.potosi.how };
      // ── 갱도 → 일기토 짐 → 탈출 실패 → 20일 뒤 다시 → 정면 습격
      s = fresh(); at(s, 1546, 2, 1); s.potosi = { told: {}, fire: 'native' }; chanceV = true; duelV = 'lose'; warV = { res: 'lose', left: 8 }; wars.length = 0;
      await go(['tunnel']);
      out.fail = { hired: hired(s), cool: s.potosi.cool - s.day, war: wars[0], tries: s.potosi.tries, html: PO.html() };
      out.coolBlock = PO.pending();
      s.day += 21; const nt0 = s.player.notoriety || 0; battles.length = 0; await go(['storm']);
      out.storm = { hired: hired(s), battle: battles[0], noto: (s.player.notoriety || 0) - nt0, again: said.some(x => /다시 와 주었구려/.test(x)) };
      // ── 청원: 실패하면 다시는 못 한다 · 성공하면 풀려난다
      s = fresh(); at(s, 1546, 2, 1); s.potosi = { told: {}, fire: 'mid' }; chanceV = false; await go(['law']);
      out.lawFail = { hired: hired(s), tried: s.potosi.lawTried, cool: !!s.potosi.cool };
      s.day += 21; await go(['wait']);
      out.lawGone = asked[0] && asked[0].opts.indexOf('law') < 0;
      s = fresh(); at(s, 1546, 2, 1); s.potosi = { told: {}, fire: 'mid' }; chanceV = true; g0 = s.player.gold; await go(['law']);
      out.lawOk = { hired: hired(s), cost: g0 - s.player.gold, oidor: said.some(x => /^왕실 감찰관: 그러나 법은 법이오/.test(x)) };
      // ── 에스파냐 편: 첫 은의 몫 · 갱도 길잡이 없음
      s = fresh(); at(s, 1545, 6, 1); g0 = s.player.gold; await go(['es']);
      out.es = { gold: s.player.gold - g0 };
      at(s, 1546, 2, 1); await go(['wait']);
      out.esOpts = asked[0] && asked[0].opts;
      // ── 사이에서 말린다
      s = fresh(); at(s, 1545, 6, 1); g0 = s.player.gold; await go(['mid']); out.mid = s.player.gold - g0;
      // ── 소식
      s = fresh(); s.potosi = { told: {}, met: 1, hostage: 1 }; s.loc = { mode: 'sea', lon: -75, lat: -15 };
      s.date = { y: 1547, m: 1, d: 1 }; out.villa = PO.daily().map(x => x.text).join(' | ');
      s.date = { y: 1551, m: 1, d: 1 }; out.gone = PO.daily().map(x => x.text).join(' | '); out.goneRes = s.potosi.res;
      s = fresh(); s.potosi = { told: { villa: 1, gone: 1 }, met: 1, res: 'rescued' }; G.Legend.join('chaska', null); s.date = { y: 1573, m: 1, d: 1 };
      out.mita = PO.daily().map(x => x.text).join(' | ');
      s = fresh(); s.date = { y: 1560, m: 1, d: 1 }; delete s.potosi; out.oldSave = PO.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'potosi');
      out.voice = !!(G.VOICES && G.VOICES.chaska && G.VOICES.chaska.stories.length === 5);
      out.unit = !!(G.LANDWAR && G.LANDWAR.MATE_SKILL ? G.LANDWAR.MATE_SKILL.chaska : JSON.stringify(G.LANDWAR || {}).indexOf('바람의 노래') >= 0);
      out.journal = !!(PO.daily && PO.daily._journal);
      G.U.chance = ch0;
      return out;
    });
    console.log(JSON.stringify({ tunnel: r.tunnel, storm: r.storm, mate: r.mate }));
    ok(r.figs === 5 && r.figNames, '인물 5명 (우알파·비야로엘·쿠시 마이타·아얄라·멘도)');
    ok(!r.mate.minor && r.mate.g === 'f' && r.mate.cha === 96 && r.mate.craft === 3 && r.mate.que === 3 && r.mate.only, '동료 차스카 — 어른 여인 · 매력 96 · 세공 3 · 케추아 말 3 · 사건으로만 · 품삯 ' + r.mate.wage);
    const g = r.gates;
    ok(g.fire && !g.fireEarly && g.host && g.hostEs && g.hostMissed && !g.hostLate && !g.hostCool, '장면이 날짜에 맞게 열린다 (①을 놓쳐도 · 에스파냐 편이었어도 ②는 열린다) ' + JSON.stringify(g));
    ok(r.fire.v === 'native' && r.fire.conflict && r.fire.chaska && r.fire.thunder, '① 바람의 불 — 「등록한 자의 것」 vs 「우리의 와카」 · 천둥의 산 · 원주민 편');
    ok(r.tunnel.opts.join() === 'tunnel,caravan,law,storm,wait' && r.tunnel.hired && r.tunnel.how === 'tunnel:quiet' && r.tunnel.duel === '감독관 멘도' && r.tunnel.wars === 0 && r.tunnel.loyal === 90 && r.tunnel.star && r.tunnel.log,
      '② 갱도로 숨어들어 감독관 멘도와 일기토 — 이기면 조용히 빠져나와 차스카 합류 (충성 90)');
    ok(!r.noMore, '구한 뒤에는 다시 열리지 않는다');
    ok(r.caravan.hired && r.caravan.gold === 1200 && r.caravan.war && r.caravan.war.n === 45 && r.caravan.war.party === 20 && r.caravan.war.hold === 2 && r.caravan.crew === 2, '라마 행렬(뇌물 1,200)에 숨었다 들킴 → 퇴각 판(적 45 · 잠입대 20 · 두 차례) 탈출 · 선원 2 잃음');
    ok(!r.fail.hired && r.fail.cool === 20 && r.fail.war.n === 45 && /차스카 구출/.test(r.fail.html) && !r.coolBlock, '일기토에 지고 탈출도 실패 → 20일 뒤 다시 (수첩에 할 일)');
    ok(r.storm.hired && r.storm.battle && r.storm.battle.n === 70 && r.storm.noto === 2 && r.storm.again, '두 번째 시도: 정면 습격(육상전 70 · 악명 +2)으로 구한다');
    ok(!r.lawFail.hired && r.lawFail.tried && r.lawFail.cool && r.lawGone && r.lawOk.hired && r.lawOk.cost === 1500 && r.lawOk.oidor, '청원 — 실패하면 다시는 못 하고, 성공하면 「새 법」으로 풀려난다 (1,500닢)');
    ok(r.es.gold === 2000 && r.esOpts.join() === 'caravan,law,storm,wait' && r.mid === 800, '에스파냐 편은 첫 은의 몫 2,000 · 우알파가 갱도 길을 열지 않는다 · 사이에서 말리면 800');
    ok(/황제의 마을/.test(r.villa) && /아버지의 마을로 돌아갔다/.test(r.gone) && r.goneRes === 'gone' && /사람을 먹는 산/.test(r.mita) && /차스카가/.test(r.mita), '소식 — 황제의 마을 · 1551년엔 돌아갔다 · 미타(차스카가 배에 있으면 한 줄)');
    ok(r.oldSave === 0 && r.rumor && r.voice && r.unit && r.journal, '옛 저장 · 소문 · 고유 말투(옛이야기 5편) · 육상전 특성 · 일지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
