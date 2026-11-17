/* 괴물과 거대한 짐승 (2026-11-17) — 사람 모양 괴물의 일기토 · 세계수의 엘프 · 새끼를 되찾으러 오는 거대한 짐승
   node tests/creatures_smoke.js */
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
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = { bad: [] }, said = [];
      // 자료
      ['lich', 'werewolf', 'deadknight', 'worldtree'].forEach(id => { if (!G.DISC[id]) out.bad.push('발견물 없음 ' + id); if (!(G.DISC_FACTS[id] || []).length) out.bad.push('관찰 없음 ' + id); });
      Object.keys(G.MONSTER_TALES).forEach(id => { const t = G.MONSTER_TALES[id]; if (!G.DISC[id]) out.bad.push('이야기의 발견물 없음 ' + id); if (!G.CREATURE_ART.duel[t.sprite]) out.bad.push('일기토 그림 없음 ' + id); (t.choice ? t.choice.opts : []).forEach(o => { if (o.give && !G.ITEM[o.give]) out.bad.push('물건 없음 ' + o.give); }); });
      Object.keys(G.GUARDIANS).forEach(id => { if (!G.DISC[id]) out.bad.push('짐승 발견물 없음 ' + id); if (!G.RELIC['r_' + id + '_baby']) out.bad.push('새끼 없음 ' + id); if (!G.ITEM['tr_' + id]) out.bad.push('전리품 없음 ' + id); if (!G.SPRITE_SHEETS['cb_' + G.GUARDIANS[id][0]]) out.bad.push('시트 없음 ' + id); });
      G.ELVES.forEach(e => { if (!G.MATE[e.id]) out.bad.push('엘프 동료 없음 ' + e.id); if (G.MATE[e.id] && G.MATE[e.id].duelSprite !== 'elf') out.bad.push('엘프 그림 없음 ' + e.id); }); if (G.ELVES.length !== 20) out.bad.push('엘프 ' + G.ELVES.length + '명');
      // 판
      const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; }); s0.sword = 2; s0.ops = 2;
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: s0, lg: G.LANGS.map(() => 3), diff: 'normal' });
      await G.Game.ensureGeo();
      const s = G.Game.state; s.date = { y: 1600, m: 3, d: 1 };
      G.UI.toast = () => {}; G.UI.say = async (t) => { said.push(String(t)); };
      let answers = [], duelRes = 'win';
      G.UI.ask = async (q, opts) => { const want = answers.shift(); const o = opts.find(x => x.value === want) || opts[0]; said.push('?' + q + ' → ' + o.label); return o.value; };
      G.Games.duel = async () => { G.Games.lastDuel = {}; return duelRes; };
      G.UI.confirm = async () => true;
      if (G.Achieve) G.Achieve.afterFind = async () => {};   // 업적 창(명성 달성)은 이 시험과 상관없다
      G.Scenes.discoveryReveal = async () => {}; G.Scenes.discoveryCard = async () => {}; G.Scenes.discoveryVoices = async () => {};
      // 1) 리치: 이기고 돌을 챙긴다 → 심장석 · 악명
      answers = ['duel', 'take'];
      await G.Disc.find(G.DISC.lich, 'land');
      out.lich = { found: G.Disc.foundByMe('lich'), heart: G.R.hasItem('cr_lich_heart'), staff: G.R.hasItem('r_lich_legend'), notor: s.player.notoriety || 0, res: s.disc.lich.mon };
      // 2) 해골 기사: 거짓말 → 칼은 얻고 탑의 은잔은 두고 온다
      answers = ['duel', 'lie'];
      await G.Disc.find(G.DISC.deadknight, 'land');
      out.knight = { found: G.Disc.foundByMe('deadknight'), sword: G.R.hasItem('cr_knight_sword'), cup: G.R.hasItem('r_deadknight_legend') };
      // 3) 흡혈귀: 지면 30일 동안 막힌다 → 다시 와서 이기고 창을 연다
      duelRes = 'lose'; answers = ['duel'];
      const v1 = await G.Disc.find(G.DISC.vampire, 'land');
      out.vamp = { first: v1, blocked: G.Monsters.blocked(G.DISC.vampire) };
      s.day += 31; duelRes = 'win'; answers = ['duel', 'dawn'];
      await G.Disc.find(G.DISC.vampire, 'land');
      out.vamp.after = G.Disc.foundByMe('vampire'); out.vamp.locket = G.R.hasItem('cr_ilona_locket');
      out.vampLines = said.filter(t => /일로나/.test(t)).length;
      // 4) 엘프: 숲에서 우연히 → 이김 → 30일 뒤 돌아와 한 번 더 겨루고 동료
      const uc = G.U.chance; G.U.chance = () => true;
      const tree = G.DISC.worldtree;
      G.Geo.terrain = (() => { const t0 = G.Geo.terrain; return (lo, la) => (Math.abs(lo - tree.lon) < 3 ? 'forest' : t0(lo, la)); })();
      answers = ['duel'];
      const met = await G.Elves.onLand(tree.lon + 1, tree.lat, {});
      const es = s.elves, elfId = Object.keys(es.met)[0];
      out.elf = { met, elfId, beat: !!es.beat[elfId], back: es.back[elfId] - s.day };
      out.elfAgain = await G.Elves.onLand(tree.lon + 1, tree.lat, {});   // 바로 다음 날은 쉰다 (cool)
      s.day += 30; answers = ['yes'];
      out.elfPending = G.Elves.pending();
      await G.Elves.check();
      out.elfJoined = s.mates.some(m => m.id === elfId);
      out.elfSprite = G.Games.mateFighter(s.mates.find(m => m.id === elfId) || { id: elfId }).sprite;
      // 세계수 발견: 다른 엘프가 막는다
      G.U.chance = uc; answers = ['duel']; s.player.items = [];   // 짐칸이 가득 차면 유물을 버릴지 묻는 창이 뜬다
      await G.Disc.find(tree, 'land');
      out.treeFound = G.Disc.foundByMe('worldtree'); out.metN = Object.keys(es.met).length;
      // 자매가 배에 있으면 끼어들어 설득한다 (엘프 자매 — js/data/elfsisters.js)
      const sisOf = G.MATE[elfId].sisterId; s.elves.last = -999;
      const said0 = said.length; answers = ['talk'];
      const sisRes = await G.Elves.duel(G.Elves.get(sisOf), 'random', 'explore');
      out.sister = { res: sisRes, joined: s.mates.some(m => m.id === sisOf), lines: said.slice(said0).filter(t => /언니|동생|칼 내려|잠깐/.test(t)).length };
      // 5) 거대한 짐승: 호랑이 새끼를 안고 뭍에 → 「?」가 나타나 쫓아온다
      const tg = G.DISC.tiger; G.R.addItem('r_tiger_baby');
      s.loc = { mode: 'land', lon: tg.lon + 0.5, lat: tg.lat, party: 60, base: { type: 'city', lon: tg.lon, lat: tg.lat } }; s.fleet.crew = 60;
      G.Guardian.reset();
      let caught = false, steps = 0, d0 = null;
      while (!caught && steps < 400) { caught = G.Guardian.step(0.05, s.loc); steps++; if (steps === 1) { const c = G.Guardian.chaser(); d0 = G.Geo.dist(s.loc.lon, s.loc.lat, c.lon, c.lat); } }
      out.chase = { caught, days: +(steps * 0.05).toFixed(2), d0: +d0.toFixed(2), near: G.Guardian.chaser().near };
      // 놓아준다
      answers = ['release'];
      out.release = await G.Guardian.encounter({ battle: async () => 'win' });
      out.releaseBaby = G.R.hasItem('r_tiger_baby');
      // 티라노사우루스 알: 싸워 이기면 거대한 머리 화석
      const tx = G.DISC.trex; G.R.addItem('r_trex_baby'); s.loc.lon = tx.lon; s.loc.lat = tx.lat; G.Guardian.reset();
      for (let i = 0; i < 400 && !G.Guardian.step(0.05, s.loc); i++);
      let battleArg = null; answers = ['fight'];
      out.fight = await G.Guardian.encounter({ battle: async (nm, n, o) => { battleArg = { nm, n, o }; return 'win'; } });
      out.battle = battleArg && { nm: battleArg.nm, n: battleArg.n, giant: battleArg.o.giant };
      out.fossil = G.R.hasItem('tr_trex'); out.fossilName = G.ITEM.tr_trex.name;
      out.after = G.Guardian.step(1, s.loc);   // 결판이 났으니 더는 쫓아오지 않는다
      // 다른 대륙으로 가면 쫓아오지 않는다
      const ph = G.DISC.phoenix; G.R.addItem('r_phoenix_baby'); s.loc.lon = -60; s.loc.lat = -10; G.Guardian.reset();
      out.far = G.Guardian.step(5, s.loc) || !!G.Guardian.chaser();
      out.said = said.length;
      return out;
    });
    console.log(JSON.stringify(r, null, 0).slice(0, 1600));
    ok(r.bad.length === 0, '자료가 맞다 ' + r.bad.join(' / '));
    ok(r.lich.found && r.lich.heart && r.lich.notor >= 2 && r.lich.res.res === 'take', '리치: 이기고 심장석을 챙기면 악명이 오른다');
    ok(r.knight.found && r.knight.sword && !r.knight.cup, '해골 기사: 거짓말하면 칼을 얻고 은잔은 두고 온다');
    ok(r.vamp.first === false && r.vamp.blocked && r.vamp.after && r.vamp.locket, '흡혈귀: 지면 30일 막히고, 다시 와 이기면 로켓');
    ok(r.elf.met && r.elf.beat && r.elf.back === 30 && !r.elfAgain, '엘프: 숲에서 겨루어 이기면 30일 뒤에 돌아온다 (' + r.elf.elfId + ')');
    ok(r.elfPending && r.elfJoined && r.elfSprite === 'elf', '엘프: 돌아와 한 번 더 겨루고 동료가 된다 · 일기토 그림도 엘프');
    ok(r.treeFound && r.metN === 2, '세계수: 다른 엘프가 막아서고, 이기면 발견');
    ok(r.sister.res === 'sister' && r.sister.joined && r.sister.lines >= 1, '자매가 배에 있으면 끼어들어 설득하고 함께 온다 (' + r.sister.lines + '줄)');
    ok(r.chase.caught && r.chase.d0 > 2 && r.chase.days > 2 && r.chase.days < 6 && r.chase.near, '새끼를 안고 있으면 「?」가 멀리서 나타나 며칠 안에 따라잡는다 (' + r.chase.days + '일)');
    ok(r.release === 'freed' && !r.releaseBaby, '놓아주면 새끼를 돌려준다');
    ok(r.fight === 'won' && r.battle && r.battle.giant.sheet === 'cb_trex' && r.battle.giant.pow >= 8 && r.fossil, '공룡과 싸워 이기면 거대한 머리 화석 (' + r.fossilName + ')');
    ok(!r.after && !r.far, '결판이 났거나 멀리 떠나면 쫓아오지 않는다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    if (fail) { console.log('실패 ' + fail); process.exitCode = 1; } else console.log('통과');
  } catch (e) { console.error('실패:', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
