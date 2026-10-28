/* 네덜란드 독립 전쟁 — 개미와 베짱이 (2026-10-28) — 여름의 노래 · 개미의 곳간 · 왕의 곳간 · 동료 · 두 해 이른 독립 · 소식
   node tests/dutchwar_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
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
      const out = {}, said = [], battles = [], toasts = [];
      let pick = 'free', fightRes = 'win', join = true;
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { const o = opts.find(x => x.value === pick) || opts[opts.length - 1]; return o.value; };
      G.UI.confirm = async () => join;
      G.UI.toast = (t) => { toasts.push(t); };
      G.Scenes.land.landBattle = async (name, n, beasts, o) => { battles.push({ name, n, o }); return fightRes; };
      const DW = G.DutchWar, AMS = 24;
      function fresh(y, m, d, wheat, nation) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        G.Game.state = G.State.newGame({ name: '주앙', nation: nation || 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d };
        const c = G.CITY_DATA[AMS]; s.loc = { mode: 'city', city: AMS, lon: c.lon, lat: c.lat };
        s.fleet.cargo = wheat ? { wheat: { q: wheat, cost: 8, d: 0, lots: { 0: { q: wheat, cost: 8 } } } } : {};
        said.length = 0; battles.length = 0; toasts.length = 0; delete s.dutchwar;
        return s;
      }
      const has = id => G.Game.state.mates.some(m => m.id === id);
      out.data = ['halina', 'verberk'].every(id => G.MATE[id] && G.MATE[id].eventOnly && G.MATE[id].g === 'f') && ['nl_jan', 'nl_pieter', 'nl_dirk'].every(id => G.HIST_FIG[id]);
      out.sk = { h: G.MATE.halina.sk, v: G.MATE.verberk.sk };
      out.before = (fresh(1566, 7, 1), DW.pending());
      // ① 여름의 노래 — 아직 모르겠다 → 30일 뒤 다시
      let s = fresh(1568, 6, 1, 0); pick = 'wait';
      out.pend1 = DW.pending(); await DW.check();
      out.wait = { met: s.dutchwar.met, side: s.dutchwar.side || null, again: DW.pending(), story: ['할리나', '페르베르크', '얀', '피터르', '디르크'].every(n => said.some(t => t.startsWith(n + '|'))), ant: said.some(t => /개미/.test(t) && /베짱이/.test(t)) };
      s.date = G.U.addDays(s.date, 31); out.again = DW.pending();
      // 할리나 편 — 밀이 없으면 과제만 받는다
      pick = 'free'; said.length = 0; await DW.check();
      out.task = { side: s.dutchwar.side, step: s.dutchwar.step, html: DW.html().replace(/<[^>]+>/g, ' '), noRun: DW.pending() };
      // 밀 30 싣고 다시 — 디르크의 순찰대에 진다
      s.fleet.cargo = { wheat: { q: 40, cost: 8 } }; fightRes = 'lose';
      out.runPend = DW.pending(); await DW.check();
      out.lost = { wheat: s.fleet.cargo.wheat ? s.fleet.cargo.wheat.q : 0, step: s.dutchwar.step, b: battles[0] && { name: battles[0].name, n: battles[0].n, kind: battles[0].o.kind, guns: battles[0].o.guns, leader: battles[0].o.leader }, cool: DW.pending(), early: DW.early() };
      // 한 달 뒤 다시 — 이긴다
      s.date = G.U.addDays(s.date, 31); s.fleet.cargo = { wheat: { q: 30, cost: 8 } }; fightRes = 'win'; said.length = 0;
      const ownerBefore = G.R.cityOwner(G.CITY_DATA[AMS]);
      await DW.check();
      out.won = { step: s.dutchwar.step, early: !!s.dutchwar.early, halina: has('halina'), verberk: has('verberk'), wheat: s.fleet.cargo.wheat ? s.fleet.cargo.wheat.q : 0, refuse: said.some(t => /^할리나\|/.test(t) && /곳간지기/.test(t)), suitors: said.some(t => /^피터르\|/.test(t) && /반지/.test(t)) && said.some(t => /^얀\|/.test(t) && /아내/.test(t)), toast: toasts.some(t => /두 해 빨라진다/.test(t)), ownerBefore };
      // 두 해 이른 독립: 도시 주인·나라·관계·지도자·소식
      const D = G.Dominion, RL = G.Rel;
      out.early = {
        ams1576: D.ownerAt(G.CITY_DATA[24], 1576, 5), ams1576a: D.ownerAt(G.CITY_DATA[24], 1576, 4), ams1578: D.ownerAt(G.CITY_DATA[24], 1578, 6),
        antw1575: D.ownerAt(G.CITY_DATA[23], 1575, 8), antw1586: D.ownerAt(G.CITY_DATA[23], 1586, 1), lisbon: D.ownerAt(G.CITY_DATA[0], 1576, 5),
        ch1576: D.changesIn(1576, 5).map(x => x.c.name + ':' + x.to), ch1578: D.changesIn(1578, 5).map(x => x.c.name + ':' + x.to),
        nl1579: RL.powers(1579).includes('NL'), nl1578: RL.powers(1578).includes('NL'), leader: D.leader('네덜란드', 1580).name
      };
      s.date = { y: 1579, m: 3, d: 1 }; out.early.war = RL.get('ES', 'NL').tier; out.early.en = RL.get('EN', 'NL').tier;
      s.date = { y: 1582, m: 3, d: 1 }; out.early.war82 = RL.get('ES', 'NL').tier;
      // 소식 — 1579.7 선언 (본래 1581.7.26 소식은 다시 알리지 않는다)
      s.date = { y: 1579, m: 7, d: 20 }; const news = [];
      for (let i = 0; i < 760; i++) { s.date = G.U.addDays(s.date, 1); G.World.daily().forEach(x => news.push(x.text)); }
      out.news = { early: news.filter(t => /독립 선언/.test(t)).length, d: news.find(t => /【네덜란드의 독립 선언】/.test(t)) || '', halinaLine: news.some(t => /할리나가 돛대/.test(t)) };
      // 페르베르크 편 — 고른 자리에서 밀이 있으면 바로, 이기면 페르베르크 · 역사 그대로
      s = fresh(1573, 3, 1, 35); pick = 'spain'; fightRes = 'win'; join = true; battles.length = 0;
      const t0 = G.Sponsor.rel('es_crown').trust;
      await DW.check();
      out.spain = { step: s.dutchwar.step, early: !!s.dutchwar.early, verberk: has('verberk'), halina: has('halina'), b: battles[0] && { name: battles[0].name, kind: battles[0].o.kind, leader: battles[0].o.leader }, trust: G.Sponsor.rel('es_crown').trust - t0,
        ams1576: G.Dominion.ownerAt(G.CITY_DATA[24], 1576, 5), nl1579: G.Rel.powers(1579).includes('NL'), wheat: s.fleet.cargo.wheat ? s.fleet.cargo.wheat.q : 0 };
      // 동료 제안을 미뤘다 → 다음에 암스테르담에서 다시
      s = fresh(1570, 3, 1, 30); pick = 'free'; join = false;
      await DW.check();
      out.defer = { offer: s.dutchwar.offer, halina: has('halina'), html: DW.html().replace(/<[^>]+>/g, ' '), pend: DW.pending() };
      join = true; await DW.check(); out.defer.after = has('halina');
      // 기한이 지나면 끝 (역사 그대로)
      s = fresh(1575, 8, 1, 30); out.late = DW.pending(); out.lateExpired = !!s.dutchwar.expired;
      // 옛 저장(1600년): 지난 소식은 몰아서 알리지 않는다
      s = fresh(1600, 1, 1, 0); DW.daily(); s.dutchwar.met = 1; out.oldNews = DW.daily().length;
      // 할리나 편을 든 판이 아니면 1581년 본래 선언은 그대로
      s = fresh(1581, 7, 20, 0); s.dutchwar = { met: 1, side: 'spain', step: 2, told: {} }; const n2 = [];
      for (let i = 0; i < 10; i++) { s.date = G.U.addDays(s.date, 1); G.World.daily().forEach(x => n2.push(x.text)); }
      out.normal = n2.filter(t => /독립 선언/.test(t)).length;
      return out;
    });
    console.log('   ' + JSON.stringify({ lost: r.lost, won: r.won, early: r.early, spain: r.spain }));
    ok(r.data, '할리나·페르베르크(여성, 사건으로만) · 사내 셋(얀·피터르·디르크)');
    ok(r.before === false, '1566년 8월 전에는 일이 없다');
    ok(r.pend1 && r.wait.met && !r.wait.side && r.wait.story && r.wait.ant && !r.wait.again && r.again, '여름의 노래: 다섯 젊은이의 개미와 베짱이 다툼 · 「아직 모르겠다」면 한 달 뒤 다시 묻는다');
    ok(r.task.side === 'free' && r.task.step === 1 && /밀 30을 싣고 암스테르담으로/.test(r.task.html) && !r.task.noRun, '할리나 편: 밀이 없으면 수첩에 과제만 — ' + r.task.html.trim().slice(0, 50));
    ok(r.runPend && r.lost.b && r.lost.b.kind === 'garrison' && r.lost.b.guns && /디르크/.test(r.lost.b.leader) && r.lost.wheat === 10 && r.lost.step === 1 && !r.lost.cool && !r.lost.early, '운하의 밤: 디르크의 순찰대에 지면 밀 30을 빼앗기고 한 달 뒤 다시');
    ok(r.won.step === 2 && r.won.early && r.won.halina && !r.won.verberk && r.won.wheat === 0 && r.won.refuse && r.won.suitors && r.won.toast, '이기면: 피터르·얀의 청혼을 물리치고 할리나가 동료로 · 독립이 두 해 빨라진다');
    ok(r.early.ams1576 === '네덜란드' && r.early.ams1576a === '에스파냐' && r.early.ams1578 === '네덜란드' && r.early.antw1575 === '네덜란드' && r.early.antw1586 === '에스파냐' && r.early.lisbon === '포르투갈', '도시 주인: 암스테르담 1576.5 · 앤트워프 1575.8부터 네덜란드 (되찾긴 그대로)');
    ok(r.early.ch1576.includes('암스테르담:네덜란드') && !r.early.ch1578.includes('암스테르담:네덜란드'), '도시 주인 소식도 두 해 앞 달에 (' + r.early.ch1576.join(',') + ')');
    ok(r.early.nl1579 && !r.early.nl1578 && /빌럼/.test(r.early.leader || '') && r.early.war === 'war' && r.early.en !== 'war' && r.early.war82 === 'war', '나라: 네덜란드 1579년부터 · 에스파냐와 전쟁 · 스타트하우더 빌럼 1세');
    ok(r.news.early === 1 && /7월 26일/.test(r.news.d) && r.news.halinaLine, '소식: 1579.7.26 독립 선언 한 번 (1581년 본래 소식은 다시 없다) · 할리나가 깃발을 올린다');
    ok(r.spain.step === 2 && !r.spain.early && r.spain.verberk && !r.spain.halina && r.spain.b && r.spain.b.kind === 'bandit' && /얀/.test(r.spain.b.leader) && r.spain.trust === 15 && r.spain.ams1576 === '에스파냐' && !r.spain.nl1579 && r.spain.wheat === 5, '페르베르크 편: 밀이 있으면 바로 · 얀의 바다거지들을 막으면 페르베르크가 동료 · 에스파냐 왕실 신뢰 +15 · 역사 그대로');
    ok(r.defer.offer === 'halina' && !r.defer.halina && /할리나가 기다린다/.test(r.defer.html) && r.defer.pend && r.defer.after, '동료 제안을 미루면 암스테르담에서 기다렸다가 다시 묻는다');
    ok(r.late === false && r.lateExpired, '1575년 7월이 지나면 이야기는 닫힌다');
    ok(r.oldNews === 0, '1600년 저장이면 지난 소식은 몰아서 알리지 않는다');
    ok(r.normal === 1, '할리나 편이 아니면 1581.7.26 본래 독립 선언 소식이 그대로 나온다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
