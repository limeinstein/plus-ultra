/* 무도회 · 데뷔탕트 (tests/ball_smoke.js) — node tests/ball_smoke.js
   · 작위가 있어야 자택 메뉴에 「무도회를 연다」 · 집사의 귀띔 · 90일 간격
   · 아가씨의 호감(좋아하는 다가감이면 크게) · 맞수의 시샘 · 그 나라 군주의 신뢰 · 아내의 시샘
   · 꾸밈 넷(뒷말·고자질·술잔·토라짐) · 마녀(망침 → 다음에 다시 · 감명 → 동료 · 마녀 모임에 셈)
   · 청혼: 혼자인 제독 → 본처 · 아내가 있으면 둘째 부인 · 아들 → 신부 → 뒤를 이으면 아내
   · 데뷔탕트: 열다섯~열일곱 딸 · 사교계의 꽃이면 왕궁 청혼이 쉬워짐 · 콘솔 오류 0 */
const path = require('path'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Ball && G.Court && G.Scenes && G.Scenes.city, null, { timeout: 90000, polling: 200 });
  const run = page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m); const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 70 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state, BL = G.Ball, UI = G.UI, home = G.CITY_DATA[s.player.home];
    s.player.gold = 500000;
    // 대화 흉내: say는 기록만, ask는 줄 세운 답(없으면 첫째)
    const said = [], Q = [], realUI = { say: UI.say, ask: UI.ask, confirm: UI.confirm, alert: UI.alert, choose: UI.choose, fade: UI.fade, prompt: UI.prompt };
    UI.say = async (t, w) => { said.push(((w && w.name) || '') + ': ' + t); };
    UI.ask = async (t, ch) => { const a = Q.shift(); const v = typeof a === 'function' ? a(ch) : a; const hit = ch.find(c => c.value === v); return hit ? hit.value : ch[0].value; };
    UI.confirm = async () => true; UI.alert = async (t) => { said.push('[알림] ' + t); }; UI.choose = async (t, o) => o[0].value; UI.fade = async fn => { fn(); };
    G.Game.go('city', { cityId: home.id }); await sleep(400);
    const HM = G.Scenes.city.B.home;
    ok(!BL.menuItem(home) && !HM.menu(home).filter(Boolean).some(x => x.label === '무도회를 연다'), '작위가 없으면 「무도회를 연다」 없음');
    G.Court.state().titles.PT = 3;
    const best = G.Court.best();
    ok(best && BL.noble(), '작위: ' + G.Court.fullName(best));
    ok(HM.menu(home).filter(Boolean).some(x => x.label === '무도회를 연다'), '자택 메뉴에 「무도회를 연다」 · ' + BL.menuItem(home).sub);
    said.length = 0; await BL.homeHint(home);
    ok(said.some(x => /^집사:.*무도회/.test(x)), '처음 작위를 받고 집에 오면 집사가 귀띔');
    // ── 무도회 1: 좋아하는 다가감
    BL.pickGuests = n => ['bl_theresia', 'bl_alexandra', 'bl_lola'].map(id => G.BALL_LADY[id]).slice(0, n);
        const th = G.BALL_LADY.bl_theresia, tr0 = G.Sponsor.rel('de_emperor').trust, fame0 = s.player.fame, day0 = s.day;
    // 다가오는 아가씨를 테레지아로: 호감을 먼저 조금
    BL.rec('bl_theresia').aff = 5; BL.rec('bl_theresia').tgt = 'p';
    window.U_ch = G.U.chance; G.U.chance = p => p >= 0.69 && p <= 0.71 ? true : U_ch(p);
    Q.push('talk'); BL.forceWitch = 'none';
    said.length = 0; await BL.host(home); BL.forceWitch = null; G.U.chance = U_ch;
    const tr = BL.rec('bl_theresia');
    ok(tr.aff > 20, '테레지아가 좋아하는 「정치와 학문」 → 호감 ' + tr.aff);
    ok(BL.rec('bl_alexandra').envy === 1 && said.some(x => /덴마크의 공주가 그렇게|합스부르크의 대공녀님은/.test(x)), '맞수 알렉산드라가 시샘 (+1, 그 자리에서 한마디)');
    ok(G.Sponsor.rel('de_emperor').trust === tr0 + 2, '신성로마제국 황제의 신뢰 +2');
    ok(s.player.fame > fame0 && s.day > day0, '사교 명성 ' + fame0 + '→' + s.player.fame + ' · 하루 지남');
    ok(said.some(x => /드십니다/.test(x)) && said.some(x => /^\[알림\]/.test(x)), '집사가 손님을 알리고, 끝에 결과 정리');
    ok(!(await BL.host(home)) && BL.left() > 0, '90일 안에는 다시 열 수 없음 (' + BL.left() + '일)');
    // 다른 다가감은 덜 오른다
    const gL = BL.gainOf(th, 'talk', null), gO = BL.gainOf(G.BALL_LADY.bl_antonia, 'talk', null);
    ok(gL > gO * 2, '같은 「정치와 학문」: 좋아하는 테레지아 +' + gL + ' · 춤을 좋아하는 안토니아 +' + gO);
    ok(Q.length === 0, '대답 줄이 남지 않음');
    // ── 꾸밈 넷
    const out = [];
    const cases = [['bl_caroline', 'gossip'], ['bl_alexandra', 'politics'], ['bl_antonia', 'spill'], ['bl_amalie', 'sulk']];
    for (const [id, kind] of cases) {
      const l = G.BALL_LADY[id], r = BL.rec(id); r.envy = 2; r.aff = 30;
      const rv = BL.rec(l.rival); rv.aff = 30;
      const f0 = s.player.fame, t0 = G.Sponsor.rel('dk_king').trust;
      Q.push('ignore'); await BL._t.scheme({ guests: [l], out });
      const res = kind === 'gossip' ? s.player.fame < f0 : kind === 'politics' ? G.Sponsor.rel('dk_king').trust < t0 : kind === 'spill' ? rv.aff < 30 : r.aff < 30;
      ok(res && r.envy === 0, l.short + '의 꾸밈 「' + kind + '」 — 모른 척하면 ' + (kind === 'gossip' ? '사교 명성 −' : kind === 'politics' ? '덴마크 왕 신뢰 −' : kind === 'spill' ? G.BALL_LADY[l.rival].short + '의 호감 −' : '제 호감 −'));
    }
    { const l = G.BALL_LADY.bl_lola, r = BL.rec('bl_lola'); r.envy = 3; r.aff = 10; Q.push('soothe'); await BL._t.scheme({ guests: [l], out }); ok(r.envy === 0 && r.aff === 16, '달래면 시샘 0 · 롤라 호감 +6'); }
    // ── 마녀: 망침 → 동료
    BL.forceWitch = 'lose'; Q.push('guard');
    const f1 = s.player.fame; await BL._t.witch(home, { guests: [th], out: [], debut: null });
    ok(!BL.witchJoined() && s.player.fame < f1 && BL.state().witch.fails === 1, '위병으로 내쫓으면 망침 — 사교 명성 −, 동료가 되지 않음');
    BL.forceWitch = 'win'; BL.autoJoin = true; Q.push('dance');
    said.length = 0; await BL._t.witch(home, { guests: [th], out: [], debut: null });
    const wm = s.mates.find(m => m.id === 'w_thistle');
    ok(wm && BL.witchJoined() && said.some(x => /백 년 동안/.test(x)), '춤을 청해 감명 → 엉겅퀴 마녀 그리젤다가 동료 (' + G.MATE.w_thistle.name + ')');
    ok(G.Coven && G.Coven.members().some(m => m.id === 'w_thistle'), '배 위 마녀 모임에도 든다');
    ok(G.MatePower ? !G.MatePower.blocked(G.MATE.w_thistle) : true, '권력자 막음에 걸리지 않음');
    BL.forceWitch = null; BL.autoJoin = null;
    const cw = await (async () => { const r0 = BL.state().witch.tries; await BL._t.witch(home, { guests: [], out: [] }); return BL.state().witch.tries === r0; })();
    ok(cw, '동료가 된 뒤에는 마녀가 오지 않음');
    // ── 청혼: 혼자인 제독 → 본처
    const al = G.BALL_LADY.bl_alexandra, ra = BL.rec('bl_alexandra'); ra.aff = 100; ra.tgt = 'p'; ra.envy = 0;
    const g0 = s.player.gold, dk0 = G.Sponsor.rel('dk_king').trust, th0 = G.Sponsor.rel('de_emperor').trust; BL.autoWed = true;
    await BL._t.proposal({ guests: [al], out: [] });
    ok(s.player.wife === 'bl_alexandra' && ra.wed === 'p', '알렉산드라 공주의 청혼 → 본처');
    ok(s.player.gold === g0 + 40000 && G.Sponsor.rel('dk_king').trust === dk0 + 20 && G.Sponsor.rel('de_emperor').trust === th0 - 10, '지참금 4만 · 덴마크 왕 +20 · 맞수 테레지아의 나라 −10');
    const ws = G.Family.wifeSpeaker();
    ok(ws && ws.name === al.name, '아내로 말한다: ' + (ws && ws.name));
    // ── 아내가 있으면 둘째 부인 · 아내의 시샘
    const ja = G.BALL_LADY.bl_jane, rj = BL.rec('bl_jane'); rj.aff = 100; rj.tgt = 'p';
    const love0 = s.player.wifeLove == null ? 70 : s.player.wifeLove;
    await BL._t.proposal({ guests: [ja], out: [] });
    const w2 = G.Wives.of('bl_jane');
    ok(w2 && w2.city === 38 && w2.house && s.player.wifeLove < love0, '제인 디그비 → 둘째 부인 (런던에 집) · 아내의 정 ' + love0 + '→' + s.player.wifeLove);
    // ── 아들의 신부 → 뒤를 이으면 아내
    const sy = s.date.y;
    s.player.kids.push({ name: '안토니우', given: '안토니우', sex: 'm', born: { y: sy - 20, m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 66 }, sk: { music: 1 }, lg: {}, edu: {}, bond: 70 });
    const son = s.player.kids[s.player.kids.length - 1];
    ok(BL.sons().includes(son), '스무 살 아들은 꼬심 대상');
    const ma = G.BALL_LADY.bl_marie, rm = BL.rec('bl_marie'); rm.aff = 100; rm.tgt = 's'; rm.son = son.name;
    said.length = 0; await BL._t.proposal({ guests: [ma], out: [] });
    ok(son.bride && son.bride.id === 'bl_marie' && said.some(x => /안토니우.*저도 그분이/.test(x)), '마리가 아들에게 청혼 → 신부 (아들의 대답)');
    ok(!BL.sons().includes(son), '혼약한 아들은 더 꼬심 대상이 아님');
    // 아들 소개 흐름 (spotlight)
    s.player.kids.push({ name: '페드루', given: '페드루', sex: 'm', born: { y: sy - 18, m: 1, d: 1 }, st: { str: 55, int: 55, mar: 55, cha: 80 }, sk: { music: 2 }, lg: {}, edu: {}, bond: 60 });
    const son2 = s.player.kids[s.player.kids.length - 1];
    const fr = G.BALL_LADY.bl_friederike, rf = BL.rec('bl_friederike'); rf.aff = 0; delete rf.tgt;
    G.U.chance = p => p === 0.5 ? true : U_ch(p);
    Q.push('son'); Q.push('sea');
    await BL._t.spotlight({ guests: [fr], out: [] }); G.U.chance = U_ch;
    ok(rf.tgt === 's' && rf.son === '페드루' && rf.aff > 10, '「아들을 소개한다」 → 프리데리케가 페드루를 꼬심 (호감 ' + rf.aff + ', 아들 매력으로)');
    // ── 데뷔탕트
    s.player.kids.push({ name: '이사벨', given: '이사벨', sex: 'f', born: { y: sy - 16, m: 1, d: 1 }, st: { str: 50, int: 60, mar: 40, cha: 88 }, sk: { music: 2 }, lg: {}, edu: {}, bond: 80 });
    const dau = s.player.kids[s.player.kids.length - 1];
    ok(BL.debutKids().includes(dau) && HM.menu(home).filter(Boolean).some(x => x.label === '데뷔탕트를 준비한다'), '열여섯 살 딸 → 「데뷔탕트를 준비한다」');
    said.length = 0; await BL.homeHint(home);
    ok(said.some(x => /데뷔탕트/.test(x)) && dau.debutHinted, '아내가 데뷔탕트를 귀띔');
    BL.state().last = null; BL.forceWitch = 'win'; BL.autoJoin = false;
    BL.pickGuests = n => ['bl_caroline', 'bl_auguste', 'bl_helene', 'bl_marianna'].map(id => G.BALL_LADY[id]).slice(0, n);
    Q.push(2); Q.push('back');
    const g1 = s.player.gold; await BL.debut(home);
    ok(dau.debut && dau.debut.score > 0 && g1 - s.player.gold >= BL.cost() + 15000, '데뷔탕트: 눈부신 진주 드레스 · 점수 ' + (dau.debut && dau.debut.score) + (dau.debut && dau.debut.belle ? ' · 사교계의 꽃' : ''));
    ok(!BL.debutKids().includes(dau), '데뷔는 딸마다 한 번');
    if (G.KidWed) { const t = G.HomeLife.touch(dau); ok(G.KidWed.royal(dau) === (t + (dau.debut.belle ? 20 : 0) >= 50), '왕궁 청혼 문턱: 함께한 시간 ' + t + (dau.debut.belle ? ' + 꽃 20' : '')); }
    BL.forceWitch = null; BL.autoWed = null;
    // ── 아들이 뒤를 이으면 신부가 아내로
    UI.prompt = async (t, v) => v || '실바'; if (G.OldGuard) G.OldGuard.atSucceed = async () => {}; if (G.Siblings) G.Siblings.fromRetire = async () => []; G.Family.pickStorage = async () => []; const ss = G.Family.succeed(son); await Promise.race([ss, sleep(6000)]);
    ok(s.player.wife === 'bl_marie', '안토니우가 뒤를 이음 → 마리가 새 제독의 아내 (' + G.Family.wifeName() + ')');
    ok(G.Family.wifeSpeaker().name, '아내 말하는 사람: ' + G.Family.wifeSpeaker().name);
    // 저장·불러오기
    const json = JSON.stringify(s); ok(json.includes('"ball"') && JSON.parse(json).ball.ladies.bl_theresia.aff > 0, '저장에 들어감 (state.ball)');
    // 실제 대화창 하나 (그림 확인)
    Object.assign(UI, realUI);
    window.__shot = true;
    UI.say(BL.fill(th.lines.flirtP, {}), BL.ladySp(th, 'warm'));
    await new Promise(r => { window.__go = r; });
    return R;
  });
  await page.waitForFunction(() => window.__shot, null, { timeout: 120000, polling: 200 });
  await new Promise(r => setTimeout(r, 1500));
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT, timeout: 20000 }).catch(e => console.log('   (스크린숏 못 찍음: ' + e.message.split('\n')[0] + ')'));
  await page.evaluate(() => window.__go());
  const out = await run;
  console.log(out.join('\n')); console.log(errs.length ? errs.join('\n') : '콘솔 오류 0');
  if (out.some(x => x.startsWith('✗ ')) || errs.length) process.exitCode = 1;
  } finally { await b.close(); }
})();
