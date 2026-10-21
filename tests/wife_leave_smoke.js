/* 충성이 바닥나 배에서 내린(또는 해고한) 부하가 둘째 부인이면: 「배에 함께」가 풀리고 제 집으로 간다 (2026-10-21, Codex의 G.Wives.farewell·sync 방식)
   예전에는 부하 명단에서만 빠지고 가족 칸에는 배에 있는 것으로 남아, 술집에서 한잔·바다의 가족 사건이 계속 떴다 (세대 교체 때에야 사라짐).
   node tests/wife_leave_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, W = G.Wives, out = {};
      G.UI.say = async () => {}; G.UI.toast = (t) => { (window.__t = window.__t || []).push(t); };
      s.player.wife = 'x_main';   // 본처가 있어 부하가 둘째 부인이 된다 (본처는 집에)
      const fem = G.MATES.filter(m => m.g === 'f' && !m.tale && !m.witch).slice(0, 2);
      const add = (d, city) => { s.mates.push({ id: d.id, role: 'none', loyal: 0, joined: 14800101 }); W.list().push({ id: d.id, kind: 'mate', city, house: false, aboard: true, wed: s.day }); };
      add(fem[0], 7); add(fem[1], 2);
      out.before = W.aboard().map(w => w.id);
      // ① 충성 0 → 「더는 당신이랑 못 살겠어요」 → 집으로 보내 준다 (G.Wives.farewell)
      s.leaving = [fem[0].id]; G.UI.ask = async (t, o) => (o.find(x => x.value === 'home') || o[1]).value; G.UI.alert = async () => true;
      await G.Cabins.farewell();
      const w0 = W.of(fem[0].id);
      out.leave = { inMates: s.mates.some(m => m.id === fem[0].id), aboard: w0.aboard, house: w0.house, gone: !!s.flags['gone_' + fem[0].id], toast: (window.__t || []).pop() };
      out.aboardAfter = W.aboard().map(w => w.id);
      out.info = W.infoWife().replace(/<[^>]+>/g, '');
      // 가족 사건이 고르는 「배에 탄 아내」에 떠난 사람이 없다
      out.famWife = G.FamEv && G.FamEv.aboardWife ? (G.FamEv.aboardWife('tavern') || {}).id : null;
      // ② 옛 저장: 부하 명단에서는 빠졌는데 「배에 함께」로 남은 둘째 부인 → 볼 때 제 집으로
      s.mates = s.mates.filter(m => m.id !== fem[1].id);
      out.healed = W.aboard().length === 0 && W.of(fem[1].id).house === true;
      out.cold = W.isCold(w0) && W.isCold(W.of(fem[1].id));
      // ③ 마음이 풀리기 전에는 배에 오르지 않고, 풀린 뒤에는 다시 태울 수 있다
      G.UI.confirm = async () => true; s.loc = { mode: 'city', city: 7 };
      await W.board(w0); out.coldRefuse = !W.of(fem[0].id).aboard;
      s.day = w0.cold + 1; await W.board(w0);
      out.reboard = W.of(fem[0].id).aboard && s.mates.some(m => m.id === fem[0].id);
      // ④ 해고한 둘째 부인도 배에서 내려 제 집으로
      const i1 = s.mates.findIndex(m => m.id === fem[0].id); s.mates.splice(i1, 1); W.sync();
      out.fired = !W.of(fem[0].id).aboard && W.of(fem[0].id).house;
      out.names = [fem[0].name, fem[1].name];
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.before.length === 2, '두 둘째 부인이 배에 함께 (' + r.names.join('·') + ')');
    ok(!r.leave.inMates && !r.leave.aboard && r.leave.house && !r.leave.gone, '충성이 바닥나 내린 둘째 부인: 부하에서 빠지고 「배에 함께」가 풀려 제 집으로');
    ok(r.aboardAfter.length === 1 && r.info.indexOf('세빌리아의 집') >= 0, '수첩 가족 칸: ' + r.info.trim());
    ok(r.cold && r.coldRefuse, '한동안 마음이 상해 있어 배에 오르지 않는다');
    ok(r.famWife !== r.names[0] && r.famWife !== undefined, '가족 사건의 「배에 탄 아내」에 떠난 사람이 없다 (' + r.famWife + ')');
    ok(r.healed, '옛 저장(부하에서 빠졌는데 배에 함께로 남음)도 제 집으로 고쳐진다');
    ok(r.reboard, '마음이 풀린 뒤에는 집에서 다시 배에 태울 수 있다');
    ok(r.fired, '해고한(부하에서 뺀) 둘째 부인도 제 집으로');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
