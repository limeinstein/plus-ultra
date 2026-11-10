/* 자식과 함께 항해 · 서른 넘은 아들의 독립 · 교육의 밸런스와 운 · 어머니의 말과 솜씨 (tests/kidcrew_smoke.js) — node tests/kidcrew_smoke.js
   · 어른 아들 · 시집 안 간 딸 → 항해사로 함대에 (d.sib · 역할 · 선실에서 는 특기를 아이 기록에 옮김) · 집에 내림 · 견습이 열여섯이 되면 정식 항해사
   · 서른 넘은 아들: 자택에서 떠남(k.away) · 서른셋에 편지 · 떠나도 후계 목록 · 편지로 다시 배에 · 뒤를 이음 (배에 탄 아들 · 떠난 아들)
   · 교육: 예전 규칙과 새 규칙으로 아이 300명을 0~16세까지 키워 평균 비교 · 타고난 그릇 · 좋은 해 · 힘든 해 · 어른 전 특기 2단계
   · 어머니: 여급의 고장 말(3) · 통용 말(2) · 특기(웅변·요리·음악·회계 1~2개) · 아이가 어머니 단계까지 배움 · 콘솔 오류 0 */
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
  await page.waitForFunction(() => window.G && G.Game && G.KidCrew && G.KidGrow && G.Family && G.Scenes && G.Scenes.city, null, { timeout: 90000, polling: 200 });
  const R = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m); const sleep = ms => new Promise(r => setTimeout(r, ms));
    try {
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 70 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state, F = G.Family, KC = G.KidCrew, KG = G.KidGrow, UI = G.UI, p = s.player, home = G.CITY_DATA[p.home];
    p.gold = 500000;
    const said = [], Q = [];
    UI.say = async (t, w) => { said.push(((w && w.name) || '') + ': ' + t); };
    UI.ask = async (t, ch) => { const a = Q.shift(); const v = typeof a === 'function' ? a(ch) : a; const hit = ch.find(c => c.value === v && !c.dis); return hit ? hit.value : ch[0].value; };
    UI.confirm = async () => true; UI.alert = async (t) => { said.push('[알림] ' + t); }; UI.choose = async (t, o) => o[0].value; UI.fade = async fn => { fn(); };
    UI.prompt = async (t, v) => v || '실바';
    G.Game.go('city', { cityId: home.id }); await sleep(400);
    const Y = s.date.y;
    let seq = 0;
    const mk = (sex, age, st, sk) => { const p = s.player; const k = { name: (sex === 'f' ? '마리아' : '안토니우') + (++seq), given: (sex === 'f' ? '마리아' : '안토니우') + seq, unnamed: false, sex, born: { y: Y - age, m: 1, d: 1 }, sk: sk || {}, lg: {}, st: Object.assign({ str: 60, int: 60, mar: 60, cha: 60 }, st || {}), edu: {}, bond: 70 }; p.kids.push(k); return k; };

    // ── 1. 함께 항해: 어른 아들 · 시집 안 간 딸
    const son = mk('m', 18, { mar: 75 }, { sword: 2 }), dau = mk('f', 17, { cha: 72 }, { speech: 1 });
    const n0 = s.mates.length;
    const ms = KC.board(son, home), md = KC.board(dau, home);
    ok(ms && md && s.mates.length === n0 + 2, '어른 아들·딸이 항해사로 함대에 (' + s.mates.length + '명)');
    const ds = G.MATE[son.mateId], dd = G.MATE[dau.mateId];
    ok(ds && ds.sib && ds.kid && dd.sib, 'd.sib — 청혼·선물·썸·스스로 떠남·노장에서 빠짐');
    ok(ds.role === 'soldier' && dd.role === 'maid', '역할: 무력이 높은 아들 → ' + ds.role + ' · 딸 → ' + dd.role);
    ok(ds.sk.sword === 2 && Object.keys(ds.sk).length === 1 && son.aboard && son.crew, '아이 때 익힌 특기만 그대로 — 떠돌이 덤 없음 (' + JSON.stringify(ds.sk) + ')');
    ok(ms.loyal >= 50 && ms.loyal <= 100, '충성은 아버지와의 사이로: ' + ms.loyal);
    ok(F.heirs().includes(son), '배에 탄 아들도 후계 목록에 · ' + KC.heirNote(son));
    ok(!KC.can(son) && !KC.board(son, home), '같은 아이를 두 번 태우지 않음');
    // 선실에서 는 특기 → 아이 기록
    if (G.Cabins && G.Cabins.rawSkill) {
      const rs = G.Cabins.rawSkill; G.Cabins.rawSkill = (m, id) => (m.id === son.mateId && id === 'nav') ? 2 : rs(m, id);
      G.KidCrew.daily(); G.Cabins.rawSkill = rs;
      ok(son.sk.nav === 2, '선실에서 익힌 항해술을 아이 기록에 옮김 (항해술 ' + son.sk.nav + ')');
    }
    // 정식 항해사는 견습처럼 달마다 자라지 않음
    const st0 = JSON.stringify(son.st); for (let i = 0; i < 12; i++) F.newMonth(); ok(JSON.stringify(son.st) === st0, '항해사가 된 자식은 견습 성장이 없음 (선실에서 배운다)');
    // 집에 내림 → 다시 태움
    KC.home(dau);
    ok(!dau.aboard && !dau.crew && !s.mates.some(m => m.id === dau.mateId) && s.flags['gone_' + dau.mateId], '딸을 집에 내림 → 술집에 나오지 않음');
    const id0 = dau.mateId; ok(KC.board(dau, home) && dau.mateId === id0, '다시 태우면 같은 항해사');
    // 해고 → 집으로
    s.mates = s.mates.filter(m => m.id !== dau.mateId);
    const dl = KC.daily(); ok(!dau.crew && dl.some(x => /집으로 돌아갔다/.test(x.text)), '해고되거나 배를 떠나면 집으로: ' + (dl[0] && dl[0].text));
    // 견습이 열여섯 → 정식 항해사
    const ap = mk('m', 15); ap.aboard = true; ap.born.y = Y - 16;
    const al = KC.daily(); ok(ap.crew && KC.hired(ap) && al.some(x => /정식 항해사/.test(x.text)), '견습이 어른이 되면 정식 항해사: ' + (al[0] && al[0].text));
    // 가족 대화의 「배에 태워 함께 다닌다」 → KidCrew.board 경로
    const son2 = mk('m', 20);
    Q.length = 0; for (let i = 0; i < 40; i++) Q.push(ch => ch.some(c => c.value === 'aboard') && !Q.done ? (Q.done = 1, 'aboard') : ch.some(c => c.value === 1) ? 1 : ch[ch.length - 1].value);
    const before = p.kids.filter(k => k.crew).length;
    const tk = F.talk(); await Promise.race([tk, sleep(4000)]); Q.length = 0;
    const nb = p.kids.filter(k => k.crew && KC.hired(k)).length;
    ok(nb === before + 1, '자택 「가족」 → 「배에 태워 함께 다닌다」 → 항해사로 합류 (' + p.kids.filter(k => k.crew).map(k => k.given).join('·') + ')');
    if (dau.crew) KC.home(dau);

    // ── 2. 서른 넘은 아들의 독립
    KC.home(son2);
    const old = mk('m', 31, { int: 80 });
    Q.push('give'); const g0 = p.gold; said.length = 0;
    const hc = await KC.homeCheck(home);
    ok(hc && old.away && old.away.title === '대학의 학자' && p.gold === g0 - 3000, '서른하나 아들이 집에 들르자 떠남 — 지력이 높아 「' + (old.away && old.away.title) + '」 · 노자 3000');
    ok(F.heirs().includes(old) && /독립/.test(KC.heirNote(old)), '떠난 아들도 후계 목록에 ' + KC.heirNote(old));
    ok(!G.HomeLife.kidsHome || !G.HomeLife.kidsHome().includes(old), '집 안의 아이 목록에서는 빠짐');
    ok(!(await KC.homeCheck(home)) || KC.leavers(31, true).length === 0, '한 번에 한 아들만');
    const st1 = JSON.stringify(old.st), b1 = F.bond(old); for (let i = 0; i < 6; i++) F.newMonth(); ok(F.bond(old) === b1, '떠난 아들은 떨어져 지내도 사이가 멀어지지 않음');
    // 서른셋 — 끝내 집에 안 들르면 편지
    const far = mk('m', 33, { str: 82 });
    const ny = KC.newYear();
    ok(far.away && far.away.how === 'letter' && ny.some(x => /편지를 남기고/.test(x.text)), '서른셋까지 안 들르면 편지 — ' + (far.away && far.away.title));
    // 편지에 답장: 「내 배로 오너라」
    Q.push('call'); said.length = 0; await KC.awayTalk(far, home);
    ok(far.crew && !far.away && KC.hired(far), '아내가 전한 편지 → 「내 배로 오너라」 → 함께 항해');
    ok(!(await (async () => { const y0 = old.awayLetterY; await KC.awayTalk(old, home); await KC.awayTalk(old, home); return old.awayLetterY !== s.date.y; })()), '편지는 해마다 한 번');
    // 뒤를 잇는 아들 — 독립한 아들
    UI.prompt = async (t, v) => v || '실바'; if (G.OldGuard) G.OldGuard.atSucceed = async () => {}; F.pickStorage = async () => [];
    const crewIds = [son.mateId, ap.mateId];
    const ss = F.succeed(old); await Promise.race([ss, sleep(6000)]);
    ok(s.player.given === F.given(old) || s.player.name.indexOf(F.given(old)) >= 0, '독립했던 아들이 뒤를 이음 → 새 제독 ' + s.player.name);
    ok(s.player.st.int >= 75, '새 제독은 그 아들의 능력 (지력 ' + s.player.st.int + ')');
    ok(crewIds.every(id => s.mates.some(m => m.id === id)) && (s.player.siblings || []).filter(k => k.mateId && crewIds.includes(k.mateId)).length === 2, '배에 있던 형제는 동생 항해사로 그대로 배에 (' + crewIds.map(id => id + ':' + s.mates.some(m => m.id === id) + '/' + (s.player.siblings || []).some(k => k.mateId === id)).join(' ') + ')');
    ok(!(s.player.siblings || []).some(k => k.crew), '형제가 된 뒤 k.crew는 지움');

    // ── 3. 뒤를 잇는 아들 — 배에 탄 아들 (새 대)
    const p2 = s.player; p2.kids = p2.kids || [];
    const cs = mk('m', 19, { cha: 77 }, { speech: 2 }); s.player.kids.push && null;
    KC.board(cs, home); const cid = cs.mateId;
    const ss2 = F.succeed(cs); await Promise.race([ss2, sleep(6000)]);
    ok(!s.mates.some(m => m.id === cid) && !G.MATE[cid], '배에 탄 아들이 뒤를 이으면 함대에서 내리고 항해사 정의도 거둠');
    ok(s.player.sk.speech >= 2, '배운 특기는 그대로 (웅변 ' + s.player.sk.speech + ')');

    // ── 4. 교육의 밸런스와 운 — 아이 300명을 0~16세까지
    const p3 = s.player;
    function sim(useNew) {
      const N = 300, tot = { str: 0, int: 0, mar: 0, cha: 0, sk: 0, sk3: 0, max: 0 };
      for (let n = 0; n < N; n++) {
        const k = { name: 't', given: 't', sex: 'm', born: { y: s.date.y, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 58, int: 58, mar: 58, cha: 58 }, edu: {}, bond: 60, house: -1 };
        const y0 = s.date.y;
        for (let a = 1; a <= 16; a++) {
          s.date.y = y0 + a; // 이 해의 나이 a
          if (useNew) {
            const yr = KG.year(k, []);
            if (a >= 3 && yr !== 'bad') ['str', 'int', 'mar', 'cha'].forEach(x => { if (G.U.chance(0.5)) KG.stat(k, x, 1); });
            if (a >= 4) { KG.stat(k, 'str', 2); KG.stat(k, 'cha', 1); }      // 놀아 주기
            if (a >= 6 && a < 16) { KG.skill(k, 'sword', KG.K().tutorSkill); KG.stat(k, 'str', 2); KG.skill(k, 'nav', KG.K().tutorSkill); KG.stat(k, 'int', 1); }   // 가정교사 둘
          } else {
            if (a >= 3) ['str', 'int', 'mar', 'cha'].forEach(x => { if (G.U.chance(0.5)) k.st[x] = Math.min(90, k.st[x] + 1); });
            if (a >= 4) { k.st.str = Math.min(90, k.st.str + 2); k.st.cha = Math.min(90, k.st.cha + 1); }
            if (a >= 6 && a < 16) { k.sk.sword = Math.min(3, (k.sk.sword || 0) + 1); k.st.str = Math.min(90, k.st.str + 2); k.sk.nav = Math.min(3, (k.sk.nav || 0) + 1); k.st.int = Math.min(90, k.st.int + 1); }
          }
        }
        s.date.y = y0;
        ['str', 'int', 'mar', 'cha'].forEach(x => tot[x] += k.st[x]);
        const sk = (k.sk.sword || 0) + (k.sk.nav || 0); tot.sk += sk; if (k.sk.sword === 3 || k.sk.nav === 3) tot.sk3++;
        tot.max = Math.max(tot.max, k.st.str);
      }
      ['str', 'int', 'mar', 'cha', 'sk'].forEach(x => tot[x] = Math.round(tot[x] / N * 10) / 10);
      return tot;
    }
    const oldR = sim(false), newR = sim(true);
    R.push('   예전: 체력 ' + oldR.str + ' · 지력 ' + oldR.int + ' · 무력 ' + oldR.mar + ' · 매력 ' + oldR.cha + ' · 특기합 ' + oldR.sk + ' · 3단계 ' + oldR.sk3 + '/300 · 체력 최고 ' + oldR.max);
    R.push('   새로: 체력 ' + newR.str + ' · 지력 ' + newR.int + ' · 무력 ' + newR.mar + ' · 매력 ' + newR.cha + ' · 특기합 ' + newR.sk + ' · 3단계 ' + newR.sk3 + '/300 · 체력 최고 ' + newR.max);
    ok(newR.str < oldR.str - 8 && newR.sk < oldR.sk && newR.sk3 === 0, '같은 교육이라도 덜 강한 2세 — 체력 ' + oldR.str + '→' + newR.str + ' · 특기 ' + oldR.sk + '→' + newR.sk + ' · 어른 전 3단계 없음');
    // 그릇: 아이마다 다르다
    const pots = []; for (let i = 0; i < 200; i++) { const k = { st: { str: 60 } }; pots.push(KG.pot(k, 'str')); }
    const pmin = Math.min(...pots), pmax = Math.max(...pots);
    ok(pmin >= 62 && pmax <= 90 && pmax - pmin >= 14, '타고난 그릇은 운 — 체력 60인 아이 200명의 그릇 ' + pmin + '~' + pmax);
    { const k = { st: { str: 60 }, pot: { str: 64 } }; let g = 0; for (let i = 0; i < 400; i++) { k.st.str = 64; g += KG.stat(k, 'str', 1); } ok(g > 5 && g < 45, '그릇에 닿으면 좀처럼 오르지 않음 (400번 중 ' + g + '번)'); }
    // 좋은 해 · 힘든 해
    let good = 0, bad = 0; for (let i = 0; i < 1000; i++) { const k = { name: 't', given: 't', sex: 'm', born: { y: s.date.y - 9, m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 } }; const r = KG.year(k, []); if (r === 'good') good++; if (r === 'bad') bad++; }
    ok(good > 80 && good < 170 && bad > 60 && bad < 150, '해마다의 운 (1000번): 좋은 해 ' + good + ' · 힘든 해 ' + bad);
    { const k = mk('m', 9); const o = []; G.U.rand0 = G.U.rand; G.U.rand = () => 0.01; KG.year(k, o); G.U.rand = () => 0.15; k.luckY = 0; const o2 = []; KG.year(k, o2); G.U.rand = G.U.rand0; ok(o[0] && /좋은|눈이 트|부쩍/.test(o[0].text) && o2[0] && /올해는 저절로/.test(o2[0].text), '알림: ' + (o[0] && o[0].text) + ' / ' + (o2[0] && o2[0].text)); p3.kids.pop(); }
    { const k = mk('m', 10, { int: 90 }, { sword: 2 }); let up = false; for (let i = 0; i < 50; i++) up = KG.skill(k, 'sword', 1) || up; ok(!up && k.sk.sword === 2, '어른(16) 전에는 특기 2단계까지'); k.born.y -= 8; let up2 = false; for (let i = 0; i < 80; i++) up2 = KG.skill(k, 'sword', 1) || up2; ok(up2 && k.sk.sword === 3, '어른이 되면 3단계도'); p3.kids.pop(); }
    { const lo = { st: { int: 30 }, sk: {}, born: { y: s.date.y - 20, m: 1, d: 1 } }, hi = { st: { int: 90 }, sk: {}, born: { y: s.date.y - 20, m: 1, d: 1 } }; let a = 0, c = 0; for (let i = 0; i < 2000; i++) { lo.sk = {}; hi.sk = {}; if (KG.skill(lo, 'nav', 0.5)) a++; if (KG.skill(hi, 'nav', 0.5)) c++; } ok(c > a * 1.4, '지력이 높을수록 잘 배움 (지력 30: ' + a + ' · 지력 90: ' + c + ' /2000)'); }

    // ── 5. 어머니의 말과 솜씨
    const maids = G.MAIDS.filter(m => G.CITY_DATA[m.city]);
    let okSk = true, poolOk = true, same = true;
    maids.forEach(m => { delete m.sk; const a = KG.momSkills(m.id); const ks = Object.keys(a); if (ks.length < 1 || ks.length > 2) okSk = false; ks.forEach(id => { if (!['speech', 'cook', 'music', 'acct'].includes(id) || a[id] < 1 || a[id] > 2) poolOk = false; }); delete m.sk; if (JSON.stringify(KG.momSkills(m.id)) !== JSON.stringify(a)) same = false; });
    const cnt = {}; maids.forEach(m => Object.keys(m.sk).forEach(id => cnt[id] = (cnt[id] || 0) + 1));
    ok(okSk && poolOk && same, '여급 ' + maids.length + '명 모두 특기 1~2개(웅변·요리·음악·회계, 1~2단계) · 늘 같음 — ' + Object.keys(cnt).map(id => KG.skillText({ [id]: 1 }).replace(' 1', '') + ' ' + cnt[id]).join(' · '));
    const mz = maids.find(m => { const L = KG.momLangs(m.id); return Object.keys(L).length === 2; });
    const L = KG.momLangs(mz.id), c = G.CITY_DATA[mz.city];
    ok(L[c.lang] === 3 && Object.values(L).includes(2), mz.name + '(' + c.name + '): ' + Object.keys(L).map(i => G.LANGS[i] + ' ' + L[i]).join(' · '));
    const langCnt = {}; maids.forEach(m => { const x = KG.momLangs(m.id); langCnt[Object.keys(x).length] = (langCnt[Object.keys(x).length] || 0) + 1; });
    R.push('   여급의 말 수: ' + Object.keys(langCnt).map(n => n + '개 ' + langCnt[n] + '명').join(' · '));
    // 아이가 어머니에게서 배움
    p3.wife = mz.id; const kid = mk('m', 5); kid.mother = mz.id; kid.house = null;
    const uc = G.U.chance; G.U.chance = () => true;
    const fo = []; for (let a = 5; a < 16; a++) { kid.born.y = s.date.y - a; KG.fromMother(kid, fo); }
    G.U.chance = uc;
    const msk = KG.momSkills(mz.id);
    ok(kid.lg[c.lang] >= 2 && Object.keys(L).every(i => (kid.lg[i] || 0) <= L[i]), '아이가 어머니의 말을 배움: ' + Object.keys(L).map(i => G.LANGS[i] + ' ' + (kid.lg[i] || 0)).join(' · ') + ' (어머니 단계까지)');
    ok(Object.keys(msk).every(id => (kid.sk[id] || 0) === Math.min(2, msk[id])), '어머니의 특기도: ' + KG.skillText(kid.sk));
    ok(fo.length > 0, '알림: ' + (fo[0] && fo[0].text));
    { const k2 = mk('m', 7); k2.aboard = true; ok(KG.momOf(k2) === null, '배에 탄 아이는 어머니에게서 못 배움'); p3.kids.pop(); }
    // 부하 출신 아내 → 그 사람이 아는 말
    const mate = G.MATES.find(m => m.lg && Object.keys(m.lg).length >= 3 && !m.sib);
    ok(JSON.stringify(KG.momLangs(mate.id)) === JSON.stringify(Object.fromEntries(Object.entries(mate.lg).filter(([i, v]) => v > 0))), '부하 출신 아내는 그 사람의 말: ' + mate.name);
    // F.newYear 통째로 몇 해
    const yk = mk('f', 7); for (let i = 0; i < 3; i++) { s.date.y++; F.newYear(); }
    ok(true, 'F.newYear 3해 돌림');
    // 저장
    const js = JSON.stringify(s); ok(js.includes('"pot"') && js.includes('"luckY"'), '저장에 그릇·운 기록');
    } catch (e) { R.push('✗ 예외 ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')); }
    return R;
  });
  console.log(R.join('\n')); console.log(errs.length ? errs.join('\n') : '콘솔 오류 0');
  } finally { await b.close(); }
})();
