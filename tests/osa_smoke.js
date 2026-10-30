/* 소꿉친구 (js/systems/osa.js · js/data/osa_pers_a~c.js · js/data/osa_skill.js)
   · 자료: 성격 다섯 · 특기 열 — 모든 장면이 글자리 없이 돌아간다 (말·선택·회상)
   · 아들이 뒤를 이은 2대 제독: 모항에 돌아오면 재회(회상) → 특기 장면(그 건물) → 교역소 흥정이 막히면 친구가 거든다 →
     양아치(일기토) → 고백(용기 판정 실패하면 말을 삼키고 다음에) → 혼례 — 아내가 된다 · 저장·불러오기 뒤에도 아내의 정의가 남는다
   · 딸이 뒤를 이었으면 친구는 남자 — 고백 뒤 함대에 오른다 · 다른 사람과 혼인하면 작별
   · 1대 제독에게는 나오지 않는다 · 콘솔 오류 0
   node tests/osa_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || null;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Osa && G.OSA && G.OSA.pers && G.Scenes.city, null, { timeout: 90000 });
    // 1) 모든 장면을 빠르게 (말·선택은 가짜로) — 성격 다섯 × 특기 열
    const r1 = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const O = G.Osa, UI = G.UI, out = { bad: [], lines: 0, pers: Object.keys(G.OSA.pers), skill: Object.keys(G.OSA.skill || {}) };
      const say0 = UI.say, ask0 = UI.ask, mem0 = O.memory, duel0 = G.Games.duel, alert0 = UI.alert;
      const chk = (t) => { out.lines++; if (/\{[a-z]+\}/.test(t)) out.bad.push('글자리: ' + t.slice(0, 40)); if (!String(t).trim()) out.bad.push('빈 말'); };
      UI.say = async (t) => chk(t); UI.alert = async (t) => chk(t);
      UI.ask = async (t, ch) => { chk(t); ch.forEach(c => chk(c.label)); return ch[Math.floor(Math.random() * ch.length)].value; };
      O.memory = async (t, ls) => { chk(O.fill(t)); (ls || []).forEach(l => chk(O.fill(l))); };
      G.Games.duel = async () => (Math.random() < 0.5 ? 'win' : 'lose');
      for (const fem of [false, true]) for (const pk of out.pers) {
        G.State.newGame({ name: '페드루', nation: 'PT', job: 'explorer', age: 22, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state, p = s.player; p.generation = 2; p.heir = { sex: fem ? 'f' : 'm' }; s.lineage = [{ gen: 1, name: '주앙 다 시우바' }];
        const c = G.CITY_DATA[p.home];
        O.forceAll = true;
        for (const sk of out.skill) {
          s.osa = null; s.osaDefs = {};
          const d = O.make({ pers: pk, skill: sk });
          if (!d || d.g !== (fem ? 'm' : 'f')) { out.bad.push(pk + '/' + sk + ' 친구 성별'); continue; }
          try {
            if (sk === out.skill[0]) {
              await O.meet(); for (let i = 0; i < 3; i++) { s.osa.last = -9; await O.chanceScene(); }
              await O.thug(); await O.haggleHelp(c, 'market');
              s.osa.aff = 90; O.forceBrave = false; s.osa.last = -9; await O.confess(); O.forceBrave = true; s.osa.last = -9; await O.confess();
              s.osa.last = -9; await O.ending();
              if (!fem && s.osa.done === 'wed') { s.osa.stage = 2; p.wife = 'm_lis'; await O.bye(); p.wife = null; }
            }
            s.osa.stage = 1; s.osa.seen = {}; await O.enter(c, G.OSA.skill[sk].at);
          } catch (e) { out.bad.push(pk + '/' + sk + ': ' + e.message); }
        }
      }
      O.forceAll = false; O.forceBrave = null;
      UI.say = say0; UI.ask = ask0; O.memory = mem0; G.Games.duel = duel0; UI.alert = alert0;
      return out;
    });
    ok(r1.pers.length === 5 && r1.skill.length === 10, '성격 ' + r1.pers.join('·') + ' · 특기 ' + r1.skill.length + '가지');
    ok(!r1.bad.length && r1.lines > 1500, '아들·딸 후계자 × 성격 다섯 × 특기 열 — 모든 장면이 돌아가고 글자리가 다 채워진다 (' + r1.lines + '줄)' + (r1.bad.length ? ' — ' + r1.bad.slice(0, 5).join(' / ') : ''));

    // 2) 실제 화면으로 — 아들 후계자, 리스본
    const r2 = await page.evaluate(async () => {
      const O = G.Osa, UI = G.UI, out = {};
      G.State.newGame({ name: '페드루', nation: 'PT', job: 'explorer', age: 22, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, p = s.player, c = G.CITY_DATA[p.home];
      // 1대에게는 없다
      out.gen1 = O.open();
      p.generation = 2; p.heir = { sex: 'm' }; s.lineage = [{ gen: 1, name: '주앙 다 시우바' }];
      out.gen2 = O.open();
      return out;
    });
    ok(r2.gen1 === false && r2.gen2 === true, '1대 제독에게는 없고, 뒤를 이은 2대부터 열린다');
    await page.evaluate(() => { G.Game.go('city', { cityId: G.Game.state.player.home }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => document.querySelectorAll('.modal-back').forEach(x => x.remove()));
    // 자동으로 넘기는 손: 대화는 누르고, 물음은 첫 단추, 회상은 누른다 (shots에 회상·재회 장면을 남긴다)
    await page.evaluate(() => {
      window.__pump = true; window.__seen = { mem: 0, duo: 0 }; window.__said = [];
      (async function pump() {
        while (window.__pump) {
          const m = document.querySelector('.osa-mem');
          if (m) { window.__seen.mem++; m.click(); }
          const b = document.querySelector('.dlg .body');
          if (b) { const t = b.textContent.replace('▼', '').trim(); if (window.__said[window.__said.length - 1] !== t) window.__said.push(t); }
          const ask = document.querySelector('.dlg .askrow button');
          if (ask) ask.click(); else { const c = document.querySelector('.modal-back.catch'); if (c) c.click(); }
          const w = document.querySelector('.win .foot .btn'); if (w && !document.querySelector('.dlg')) w.click();
          await new Promise(r => setTimeout(r, 120));
        }
      })();
    });
    const shot = async (n) => { if (OUT) await page.screenshot({ path: path.join(OUT, n + '.png') }); };
    const r3 = await page.evaluate(async () => {
      const O = G.Osa, s = G.Game.state, p = s.player, c = G.CITY_DATA[p.home], out = {};
      G.Games.duel = async () => 'win';
      O.forceAll = true;
      await O.arrival(c, { arrive: true });
      out.met = s.osa.stage; out.def = O.def() && { id: O.def().id, name: O.def().name, g: O.def().g, pers: s.osa.pers, skill: s.osa.skill };
      out.mem = window.__seen.mem; out.said = window.__said.slice(0, 6);
      // 특기 장면: 그 건물에 들어간다
      const at = G.OSA.skill[s.osa.skill].at, aff0 = s.osa.aff;
      out.enter = await O.enter(c, at); out.skillSeen = !!s.osa.seen.skill; out.affUp = s.osa.aff - aff0;
      // 교역소 흥정이 막히면
      const C = G.Scenes.city; await C.visit('trade');
      await new Promise(r => setTimeout(r, 600));
      const ch = G.U.chance; G.U.chance = () => false;
      try { await C.B.trade.haggle(c); } finally { G.U.chance = ch; }
      const cur = C.current(); out.hag = cur && cur.haggle && { ok: cur.haggle.ok, osa: cur.haggle.osa, buy: cur.haggle.buy };
      // 양아치
      s.osa.last = -9; await O.arrival(c, { arrive: true }); out.afterThug = s.osa.stage; out.thug = s.osa.seen.thug;
      // 고백: 말을 삼킨 뒤, 다시
      s.osa.aff = 80; s.osa.seen.firstTried = 1; O.forceBrave = false; s.osa.last = -9;
      const ask0 = G.UI.ask; G.UI.ask = async (t, chs, o) => (/지금 말할까/.test(t) ? 1 : ask0(t, chs, o));
      await O.arrival(c, { arrive: true }); out.fail = { stage: s.osa.stage, fails: s.osa.fails };
      O.forceBrave = true; s.osa.last = -9; await O.arrival(c, { arrive: true }); out.won = s.osa.stage;
      G.UI.ask = ask0;
      // 혼례
      s.osa.last = -9; await O.arrival(c, { arrive: true });
      out.wife = p.wife; out.wifeName = G.Family.wifeName(); out.done = s.osa.done;
      // 저장·불러오기
      const json = G.State.serialize(); G.Game.state = G.State.deserialize(json); if (G.Wander) G.Wander.apply();
      out.reload = !!G.MATE[out.wife] && G.Family.wifeName() === out.wifeName;
      O.forceAll = false; O.forceBrave = null;
      return out;
    });
    await shot('osa_end');
    console.log('    친구: ' + JSON.stringify(r3.def) + '\n    첫 장면: ' + r3.said.map(x => x.slice(0, 60)).join(' / '));
    ok(r3.met === 1 && r3.mem >= 1 && r3.def && r3.def.g === 'f', '모항에 돌아오니 소꿉친구와 재회 — 회상이 먼저 뜬다 (' + r3.def.name + ' · ' + r3.def.pers + ' · ' + r3.def.skill + ')');
    ok(r3.enter && r3.skillSeen && r3.affUp > 0, '특기 장면: 그 건물에 들어가면 (' + r3.def.skill + ') — 마음이 가까워진다 +' + r3.affUp);
    ok(r3.hag && r3.hag.ok && r3.hag.osa && r3.hag.buy < 1, '교역소에서 흥정이 막히자 친구가 거들어 값이 깎였다 (사는 값 ×' + (r3.hag && r3.hag.buy.toFixed(2)) + ')');
    ok(r3.afterThug === 2 && r3.thug === 'win', '양아치들을 일기토로 물리쳤다');
    ok(r3.fail.stage === 2 && r3.fail.fails >= 1 && r3.won === 3, '고백: 처음엔 말이 목에 걸려 못 하고(실패 ' + r3.fail.fails + '), 다음에 마음이 닿는다');
    ok(r3.wife === r3.def.id && r3.wifeName === r3.def.name && r3.done === 'wed', '다음 귀항에 혼례 — ' + r3.wifeName + '이(가) 아내가 되었다');
    ok(r3.reload, '저장·불러오기 뒤에도 아내가 남는다');
    await page.evaluate(() => { window.__pump = false; });
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
