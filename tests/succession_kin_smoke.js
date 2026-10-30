/* 세대 교체 뒤의 형제·수명 (2026-10-23 사용자 제보) — node tests/succession_kin_smoke.js   (BROWSER_EXE=크롬 경로)
   ① 막내가 뒤를 이으면 위의 아이들은 형·누나 — 막내를 「형」이라 부르지 않고 이름으로 부른다 (맏이가 이으면 예전처럼 동생들이 「형」)
   ② 80세 생일 뒤 바다에서 숨을 거두고(창이 떠 있는 사이 날이 지나도) 46세 맏아들이 뒤를 이으면, 새 제독은 곧바로 세상을 떠나지 않는다
      · 옛 저장에 남은 「수명이 다함」 표시도 젊은 제독에게는 무시된다 · 콘솔 오류 0 */
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
    await page.evaluate(() => { if (window.G && G.BALANCE && G.BALANCE.oldGuard) G.BALANCE.oldGuard.kinChance = 0; });   // 세대 교체 때 친족·소꿉친구 고르기 창을 띄우지 않는다 (tests/old_guard_smoke.js 가 따로 본다)
    await page.waitForFunction(() => window.G && G.Game && G.Siblings && G.Siblings.elder && G.Life, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, said = [], out = {};
      UI.alert = async (t) => { said.push(String(t)); }; UI.say = async (t) => { said.push(String(t)); };
      UI.confirm = async () => true; UI.ask = async (t, ch) => { said.push(String(t)); return null; };
      UI.choose = async () => 0;
      if (G.FamEv) G.FamEv.showPic = () => null;
      const fresh = (y) => {
        G.State.newGame({ name: '가브리엘 코스타', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: y, m: 6, d: 1 }; s.player.born = { y: y - 49, m: 1, d: 1 }; s.player.storage = []; return s;
      };
      const kid = (s, name, sex, age) => { const k = { name, sex, born: { y: s.date.y - age, m: 3, d: 5 }, sk: {}, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, bond: 60 }; s.player.kids.push(k); return k; };
      // ① 막내가 뒤를 잇는다
      let s = fresh(1530);
      const a = kid(s, '안토니우', 'm', 26), b = kid(s, '이자벨', 'f', 23), c = kid(s, '미겔', 'm', 17);
      await G.Family.succeed(c, false);
      const SB = G.Siblings, sib = s.player.siblings || [];
      const A = sib.find(k => k.name === '안토니우'), B = sib.find(k => k.name === '이자벨');
      out.youngest = {
        heir: s.player.name, n: sib.length,
        elderA: SB.elder(A), elderB: SB.elder(B), callA: SB.call(A), callB: SB.call(B), relA: SB.rel(A), relB: SB.rel(B),
        line: SB.fill(G.SIBLINGS.farewell.str.say[1], A), desc: SB.fill(G.SIBLINGS.hire.desc, A), sister: SB.fill(G.SIBLINGS.wed.sister[1], B),
        intro: SB.fill(G.SIBLINGS.farewell.intro[0], A), menu: SB.menuLabel(), log: s.log.slice(-6).map(x => x.t).find(t => /형제자매/.test(t)) || ''
      };
      said.length = 0;
      await SB.talk(A);
      out.youngest.talk = said.join(' | ');
      // 맏이가 뒤를 잇는다 — 동생들은 예전처럼 「형」
      s = fresh(1530);
      const a2 = kid(s, '안토니우', 'm', 26), b2 = kid(s, '이자벨', 'f', 23), c2 = kid(s, '미겔', 'm', 17);
      await G.Family.succeed(a2, false);
      const sib2 = s.player.siblings, C2 = sib2.find(k => k.name === '미겔'), B2 = sib2.find(k => k.name === '이자벨');
      out.eldest = { elderC: SB.elder(C2), callC: SB.call(C2), callB: SB.call(B2), relC: SB.rel(C2), relB: SB.rel(B2), menu: SB.menuLabel(), intro: SB.fill(G.SIBLINGS.farewell.intro[0], C2) };
      // ② 80세에 바다에서 숨을 거둔다 — 창이 떠 있는 동안 날이 지나간다
      s = fresh(1560); s.player.born = { y: 1480, m: 5, d: 30 };
      s.loc = { mode: 'sea', lon: -12, lat: 38 };
      const son = kid(s, '주앙', 'm', 46), dau = kid(s, '마리아', 'f', 40);
      let ended = null; G.Ending.show = async (why) => { ended = why; return 'end'; };
      G.Life.daily(); out.endSet = s.life.end;
      const alert0 = UI.alert; let passed = 0;
      UI.alert = async (t) => { said.push(String(t)); if (passed < 3) { passed++; G.Life.daily(); } };   // 창이 떠 있는 사이 바다에서 하루가 지난다
      await G.Life.die();
      UI.alert = alert0;
      const s2 = G.Game.state;
      out.after = { name: s2.player.name, age: G.R.age(), end: s2.life && s2.life.end, ended };
      // 하루가 더 지나고, 창 틈(tick)이 돌아도 새 제독은 살아 있다
      G.Life.daily(); await G.Life.die();
      out.after2 = { name: G.Game.state.player.name, ended, died: G.Game.state.log.filter(x => /세로 세상을 떠났다/.test(x.t)).map(x => x.t) };
      // 옛 저장: 젊은 제독에게 남은 표시
      G.Game.state.life = { end: 80 }; await G.Life.die();
      out.oldSave = { ended, name: G.Game.state.player.name };
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    const y = r.youngest;
    ok(y.n === 2 && y.elderA && y.elderB && y.relA === '형' && y.relB === '누나', '막내가 이으면 안토니우·이자벨은 새 제독의 형·누나');
    ok(y.callA === '미겔' && y.callB === '미겔', '형·누나는 막내 제독을 「형」이 아니라 이름으로 부른다 (' + y.callA + ')');
    ok(!/미겔\s*(형|오빠)/.test(y.talk) && /미겔/.test(y.talk), '집에서 나누는 이야기: ' + y.talk.slice(0, 120));
    ok(/「미겔의 형」/.test(y.line) && /미겔의 형\./.test(y.desc) && /네 동생이 허락하면/.test(y.sister) && /26세가 되었다/.test(y.intro), '대사: ' + y.line + ' / ' + y.sister + ' / ' + y.intro);
    ok(y.menu === '형제자매' && /형제자매는/.test(y.log), '자택 메뉴 「형제자매」 · 일지 「…의 형제자매는 …」');
    const e = r.eldest;
    ok(!e.elderC && e.callC === '형' && e.callB === '오빠' && e.relC === '남동생' && e.relB === '여동생' && e.menu === '동생들' && /17세가 되었다|스물두 살이/.test(e.intro), '맏이가 이으면 예전처럼 동생들이 「형·오빠」라 부른다');
    ok(r.endSet === 80 && r.after.name === '주앙' && r.after.age === 46 && !r.after.end && r.after.ended == null, '80세에 숨을 거두고 46세 주앙이 뒤를 잇는다 — 수명 표시는 남지 않는다');
    ok(r.after2.name === '주앙' && r.after2.ended == null && r.after2.died.length === 1, '하루가 더 지나도 주앙은 살아 있다 (세상을 떠난 줄은 아버지 하나)');
    ok(r.oldSave.ended == null && r.oldSave.name === '주앙', '옛 저장에 남은 수명 표시도 젊은 제독에게는 무시된다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
