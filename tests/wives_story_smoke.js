/* 둘째 부인부터 — 떠나는 이야기 · 배 위 상태 바로잡기 · 몇째 부인 · 세대 교체 · 부하와의 썸 (js/systems/wives.js)
   node tests/wives_story_smoke.js   (BROWSER_EXE=크롬 경로)
   · 혼인한 차례대로 「둘째·셋째·넷째 부인」 (누가 떠나도 차례는 그대로)
   · 부하 명단에 없는데 「배에 함께」로 남은 부인(실종) → 제 집으로, 배 위 사건(W.aboard)에 나오지 않는다
   · 충성이 바닥난 부인: 「더 이상 당신이랑 못 살겠어요」 — 붙잡기(성공) · 집으로 보내기(한동안 문을 열지 않음 → 풀림) · 헤어지기(반지·아이는 본국으로)
   · 부인과 남자 부하의 썸 → 갑판 결투: 피로 +, 그 부하 충성 0, 부인 충성 +, 두 사람은 서먹
   · 세대 교체 뒤에도 선대의 부인(어머니·○째 부인)이 수첩에 남는다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Wives && G.Wives.hooked, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const UI = G.UI, s = G.Game.state, p = s.player, W = G.Wives, out = {}, said = [];
      window.PICK = null;
      UI.say = async (t) => { said.push(String(t)); }; UI.alert = async (t) => { said.push(String(t)); }; UI.confirm = async () => true;
      UI.ask = async (t, ch) => { said.push(String(t)); const l = ch.map(o => typeof o === 'string' ? o : o.value); return window.PICK != null && l.includes(window.PICK) ? window.PICK : l[0]; };
      p.wife = 'm_lis';
      const fem = G.MATES.filter(m => m.g === 'f');
      const a = fem[0], b = fem[1], c = fem[2], man = G.MATES.find(m => m.g === 'm' && m.id !== 'rocco');
      const add = (d, loyal) => { s.mates.push({ id: d.id, role: 'none', joined: 0, loyal: loyal == null ? 80 : loyal, from: p.home }); return s.mates[s.mates.length - 1]; };
      // 몇째 부인
      add(a); W.list().push({ id: a.id, kind: 'mate', city: 2, house: false, aboard: true, wed: 1 });
      add(b); W.list().push({ id: b.id, kind: 'mate', city: 3, house: false, aboard: true, wed: 2 });
      out.ord = [W.ordinal(W.of(a.id)), W.ordinal(W.of(b.id))]; out.next = W.ordinal(W.nextNo());
      // 실종: 부하 명단에서 빠졌는데 배에 함께로 남음 → 집으로
      s.mates = s.mates.filter(m => m.id !== b.id);
      out.aboardIds = W.aboard().map(w => w.id); const wb = W.of(b.id);
      out.fixed = { aboard: wb.aboard, house: wb.house, cold: W.isCold(wb) };
      out.info = W.infoWife();
      // 집으로 보내기: 차가운 동안 문이 열리지 않는다 → 풀리면 다시 맞아 준다
      const city = G.CITY_DATA[3]; s.loc = { mode: 'city', city: 3 };
      out.coldEnter = await W.H2.enter(city, b.id);
      s.day = wb.cold + 1; said.length = 0;
      const ent = await W.H2.enter(city, b.id); out.thaw = said.slice(0, 2).join(' / '); out.thawCold = wb.cold == null;
      // 떠나려 한다 — 붙잡기 성공
      const ma = s.mates.find(m => m.id === a.id); ma.loyal = 0; s.leaving = [a.id]; window.PICK = 'keep';
      const ch0 = G.U.chance; G.U.chance = () => true; said.length = 0;
      await G.Cabins.farewell(); G.U.chance = ch0;
      out.keep = { loyal: ma.loyal, aboard: W.of(a.id).aboard, line: said.some(t => /못 살겠어요/.test(t)) };
      // 떠나려 한다 — 집으로 보낸다
      ma.loyal = 0; s.leaving = [a.id]; window.PICK = 'home'; said.length = 0; s.loc = { mode: 'sea' };
      await G.Cabins.farewell();
      const wa = W.of(a.id); out.home = { aboard: wa.aboard, house: wa.house, inMates: s.mates.some(m => m.id === a.id), cold: W.isCold(wa) };
      // 셋째 부인 c를 맞고, 아이를 두고 헤어진다
      add(c, 0); W.list().push({ id: c.id, kind: 'mate', city: 4, house: false, aboard: true, wed: 3, no: W.nextNo() });
      out.cOrd = W.ordinal(W.of(c.id));
      p.kids.push({ name: '루이스', sex: 'm', born: { y: s.date.y - 4, m: 1, d: 1 }, sk: {}, lg: {}, edu: {}, mother: c.id, house: 4 });
      s.leaving = [c.id]; window.PICK = 'part'; said.length = 0;
      await G.Cabins.farewell();
      out.part = { wife: !!W.of(c.id), ring: G.R.hasItem('ring'), kid: p.kids.find(k => k.name === '루이스').house, gone: (p.wivesGone || []).map(g => g.no) };
      out.nextAfter = W.ordinal(W.nextNo());
      // 부인과 부하의 썸 → 결투
      W.of(a.id).aboard = true; W.of(a.id).cold = null; delete W.of(a.id).cold; add(a, 50); const hm = add(man, 70);
      s.fleet.fatigue = 10; const pr = { m: man.id, f: a.id, heat: 30, stage: 'spark', since: 0, cd: 0, due: 'moon' };
      G.Romance.st().pairs[G.Romance.key(man.id, a.id)] = pr;
      G.Games.duel = async () => 'win'; said.length = 0;
      await G.Romance.play(pr);
      out.affair = { fat: s.fleet.fatigue, he: hm.loyal, she: s.mates.find(m => m.id === a.id).loyal, stage: pr.stage, line: said.some(t => /칼을 뽑아라|칼로 답하겠습니다|사내와 사내/.test(t)) };
      // 세대 교체
      const heir = { name: '페드루', sex: 'm', born: { y: s.date.y - 20, m: 1, d: 1 }, sk: {}, lg: {}, edu: {}, mother: a.id, st: { str: 60, int: 60, mar: 60, cha: 60 } };
      p.kids.push(heir);
      G.Family.pickStorage = async () => [];
      await G.Family.succeed(heir);
      out.elders = (s.player.elders || []).map(e => e.title + ':' + e.id);
      out.mateGone = !s.mates.some(m => m.id === a.id);
      G.Info && G.Info.open && G.Info.open('admiral');
      await new Promise(r => setTimeout(r, 300));
      out.infoHtml = (document.querySelector('.win') || document.body).textContent.replace(/\s+/g, ' ');
      out.ids = { a: a.id, b: b.id, c: c.id };
      return out;
    });
    console.log(JSON.stringify(Object.assign({}, r, { infoHtml: undefined, info: r.info }), null, 1).slice(0, 2200));
    ok(r.ord[0] === '둘째 부인' && r.ord[1] === '셋째 부인' && r.next === '넷째 부인', '혼인한 차례대로 둘째·셋째, 다음은 넷째');
    ok(!r.aboardIds.includes(r.ids.b) && !r.fixed.aboard && r.fixed.house && r.fixed.cold, '부하 명단에 없는 부인은 배 위에서 빠져 제 집으로(실종 바로잡기)');
    ok(!new RegExp('셋째 부인 [^,]*배에 함께').test(r.info), '수첩에 「배에 함께」로 남지 않는다');
    ok(r.coldEnter === false, '마음이 풀리지 않았으면 집 문을 열어 주지 않는다');
    ok(r.thawCold && r.thaw.length > 0, '날이 지나면 다시 맞아 준다 (' + r.thaw.slice(0, 40) + '…)');
    ok(r.keep.line && r.keep.loyal === 40 && r.keep.aboard, '「더 이상 당신이랑 못 살겠어요」 — 붙잡으면 충성 40으로 남는다');
    ok(!r.home.aboard && r.home.house && !r.home.inMates && r.home.cold, '집으로 보내면 배에서 내려 제 집으로 — 한동안 냉랭');
    ok(r.cOrd === '넷째 부인', '새 부인은 넷째');
    ok(!r.part.wife && r.part.ring && r.part.kid === -1 && r.part.gone.includes(4), '헤어지면 부인 목록에서 빠지고 반지를 돌려받으며 아이는 본국으로');
    ok(r.nextAfter === '다섯째 부인', '헤어진 뒤에도 차례는 그대로 (다음은 다섯째)');
    ok(r.affair.line && r.affair.fat === 25 && r.affair.he === 0 && r.affair.she === 75 && r.affair.stage === 'cold', '부인과 부하의 썸 → 결투: 피로 +15 · 그 부하 충성 0 · 부인 충성 +25 · 서먹');
    ok(r.elders.length >= 3 && r.elders.some(e => e.startsWith('어머니:' + r.ids.a)) && r.elders.some(e => e.startsWith('선대의 본처')), '세대 교체 뒤 선대의 부인이 남는다 (' + r.elders.join(', ') + ')');
    ok(r.mateGone, '배에 탄 선대의 부인은 배에서 내려 제 집으로');
    ok(/선대의 부인/.test(r.infoHtml), '수첩에 「선대의 부인」 줄');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('통과');
  } catch (e) { console.error('실패:', e.message, errors); process.exitCode = 1; } finally { await browser.close(); }
})();
