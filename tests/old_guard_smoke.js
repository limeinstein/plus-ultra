/* 노장 — 세대 교체의 두 사람 · 친족·소꿉친구 · 스무 해 뒤의 철새 (2026-10-29 사용자 요청) — node tests/old_guard_smoke.js   (BROWSER_EXE=크롬 경로)
   js/systems/oldguard.js · js/data/oldguard.js · js/systems/mateleave.js
   ① 노장 = 40년↑ 함께했고 기함의 선실·다른 배의 선장 자리에 없는 부하 (아내·동생 아님)
   ② 세대 교체: 노장들은 물러나는 제독과 내리고 둘까지 남는다(셋째는 고를 수 없다) — 남은 노장 충성 100·한동안 떠나지 않음 · 내린 노장은 gone_ · 남은 이야기
      · 친족(사촌·외삼촌)·소꿉친구가 찾아오면 한 자리를 쓴다 — 사건 표시 없이 합류 · 사촌은 집안의 성
      · 선실·선장 자리의 부하, 40년 안 된 부하는 그대로 남는다
   ③ 내린 사건 동료 → 20년 뒤 해가 바뀔 때 다른 이름의 철새 (능력치·특기·말·얼굴 그대로) · 소문 · 불러오기 뒤에도 얼굴 그대로 · 친족 항해사 정의도 다시 올라온다
   ④ 해고·떠남으로 내린 사건 동료도 · 사건 동료가 아니면 기록하지 않는다 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.OldGuard && G.MateLeave && G.Wander && G.Family, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, said = [], out = {};
      UI.alert = async (t, title) => { said.push('[' + (title || '') + '] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + t); };
      UI.confirm = async () => true; UI.ask = async () => null; UI.choose = async () => 0; UI.toast = () => {};
      UI.fade = (fn) => { if (fn) fn(); }; G.Game.go = () => {};
      if (G.FamEv) G.FamEv.showPic = () => null;
      // 고르기 창: 이름 차례대로 누른다 (window.__clicks)
      window.__rows = [];
      const win0 = UI.window.bind(UI);
      UI.window = (o) => {
        const el = document.createElement('div'); el.innerHTML = o.html; const w = { content: el };
        if (o.onBuild) o.onBuild(el, w);
        if (/남을 사람/.test(o.title)) {
          (window.__clicks || []).forEach(nm => { const tr = [...el.querySelectorAll('tr[data-og]')].find(x => x.textContent.indexOf(nm) >= 0); if (tr) tr.onclick({ preventDefault() {} }); });
          window.__rows = [...el.querySelectorAll('tr[data-og]')].map(x => x.textContent.replace(/\s+/g, ' '));
          window.__checked = [...el.querySelectorAll('tr[data-og] input:checked')].length;
          return { result: Promise.resolve('pick') };
        }
        return win0(o);
      };
      G.State.newGame({ name: '가브리엘 코스타', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1540, m: 6, d: 1 }; s.player.born = { y: 1475, m: 1, d: 1 }; s.player.storage = []; s.player.surname = '코스타'; s.player.given = '가브리엘';
      G.Wander.apply();
      const plain = G.MATES.filter(m => !m.wd && !m.witch && !m.sib && !m.tale && !m.eventOnly && m.st && m.y && m.y[1] < 9000).slice(0, 5);
      const evd = G.MATES.find(m => m.tale && !m.minor && !m.sib) || G.MATES.find(m => m.eventOnly && !m.sib);
      // A·F: 45년 갑판 · B: 45년 다른 배 선장 · C: 45년 기함 선실 · D: 10년 · E: 45년 사건 동료
      const ship2 = s.fleet.ships[1] || (s.fleet.ships.push(Object.assign(JSON.parse(JSON.stringify(s.fleet.ships[0])), { uid: 'og2', name: '둘째' })), s.fleet.ships[1]);
      const [A, B, C, D, F] = plain;
      s.mates = [
        { id: A.id, role: 'none', joined: 14950101, loyal: 70 },
        { id: B.id, role: 'captain', ship: ship2.uid, joined: 14950101, loyal: 70 },
        { id: C.id, role: 'nav', joined: 14950101, loyal: 70 },   // 조타실 (기함의 선실)
        { id: D.id, role: 'none', joined: 15300101, loyal: 70 },
        { id: evd.id, role: 'none', joined: 14950101, loyal: 80, ev: 1 },
        { id: F.id, role: 'none', joined: 14950101, loyal: 70 }
      ];
      G.Cabins.rooms();
      const OG = G.OldGuard;
      out.names = { A: A.name, B: B.name, C: C.name, D: D.name, E: evd.name, F: F.name };
      out.vets = OG.veterans().map(m => G.MATE[m.id].name);
      out.mlvW = s.mates.map(m => G.MateLeave.weight(m) > 0);
      out.tagA = OG.tags(s.mates[0], A); out.tagB = OG.tags(s.mates[1], B);
      // ② 세대 교체 — 사촌이 찾아온다 · A·F·사촌 차례로 누른다 (셋째는 막힌다)
      const k = { name: '주앙', sex: 'm', born: { y: 1514, m: 3, d: 5 }, sk: {}, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, bond: 60 };
      s.player.kids.push(k);
      G.BALANCE.oldGuard.kinChance = 1; G.BALANCE.oldGuard.kinKinds = { cousin: 1 };
      window.__clicks = [A.name, F.name, '사촌'];
      const day0 = s.day;
      await G.Family.succeed(k, false);
      const s2 = G.Game.state, ids = s2.mates.map(m => m.id);
      const kinRow = s2.mates.find(m => /^kin_/.test(m.id)), kinDef = kinRow && G.MATE[kinRow.id];
      out.after = {
        player: s2.player.name, rows: window.__rows, checked: window.__checked,
        stay: { A: ids.includes(A.id), B: ids.includes(B.id), C: ids.includes(C.id), D: ids.includes(D.id), E: ids.includes(evd.id), F: ids.includes(F.id) },
        aideA: s2.mates.find(m => m.id === A.id), aideF: s2.mates.find(m => m.id === F.id),
        gone: { E: s2.flags['gone_' + evd.id], kin: !!kinRow }, fateE: s2.mateFate && s2.mateFate[evd.id], day0,
        ret: JSON.parse(JSON.stringify(s2.oldGuard.ret)), said: said.join('\n'),
        log: s2.log.slice(-14).map(x => x.t).join('\n')
      };
      out.tagAide = OG.tags(out.after.aideA, G.MATE[A.id]);
      G.Info.open('mates'); const iw = [...document.querySelectorAll('.win')].pop(); out.infoTags = iw ? [...iw.querySelectorAll('.tag')].map(e => e.textContent).join(',') : '';
      document.querySelectorAll('#ui .modal-back, .win').forEach(e => e.remove());
      // 사촌 없이 고르면 (A·F를 남기고 사촌을 누르면 막힌다) → 사촌은 오지 않는다. 다시: 사촌을 먼저 누르는 경우를 따로 본다
      out.kinTry = { kinRow: !!kinRow };
      // 다시 한 세대 — 사촌이 먼저 · 노장 하나
      said.length = 0;
      s2.date.y = 1546; s2.player.born = { y: 1500, m: 1, d: 1 };
      const G1 = G.MATES.filter(m => !m.wd && !m.witch && !m.sib && !m.tale && !m.eventOnly && m.st && m.y && m.y[1] < 9000 && !s2.mates.some(x => x.id === m.id)).slice(0, 2);
      s2.mates.push({ id: G1[0].id, role: 'none', joined: 15000101, loyal: 70 }, { id: G1[1].id, role: 'none', joined: 15000101, loyal: 70 });
      const k2 = { name: '페드루', sex: 'm', born: { y: 1520, m: 3, d: 5 }, sk: {}, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, bond: 60 };
      s2.player.kids.push(k2);
      G.BALANCE.oldGuard.kinKinds = { friend: 1 };
      window.__clicks = ['소꿉친구', G1[0].name];
      await G.Family.succeed(k2, false);
      const s3 = G.Game.state, fr = s3.mates.find(m => G.MATE[m.id] && G.MATE[m.id].kin === 'friend');
      out.friend = { ok: !!fr, ev: fr && fr.ev, loyal: fr && fr.loyal, name: fr && G.MATE[fr.id].name, said: said.join('\n'), g1: s3.mates.some(m => m.id === G1[0].id), g2: s3.mates.some(m => m.id === G1[1].id),
        g2fate: s3.mateFate[G1[1].id] };
      const cz = G.OldGuard.makeKin('cousin', s3.player, { name: '루이스', sex: 'm' });
      out.kin = { id: fr && fr.id, cousin: cz.name, cousinTag: cz.kinTag, cousinDesc: cz.desc, sur: s3.player.surname };
      // ③ 스무 해 뒤의 철새
      const r0 = s3.oldGuard.ret.find(x => x.id === evd.id);
      s3.date.y = r0.due - 1; const early = G.Wander.newYear();
      s3.date.y = r0.due; const news = G.Wander.newYear();
      const wd = Object.values(s3.wander.defs).find(d => d.ret === evd.id);
      const orig = G.MATE[evd.id];
      out.ret = { early: early.some(n => /배에서 내린/.test(n.text)), news: news.map(n => n.text).filter(t => /배에서 내린/.test(t)), wd: wd && { name: wd.name, st: wd.st, sk: wd.sk, lg: wd.lg, face: wd.face, home: wd.home, wdf: wd.wd, story: wd.story, range: G.MATE_RANGE[wd.id] },
        orig: { name: orig.name, st: orig.st, lg: orig.lg, face: orig.face || 'portraits/mates/' + orig.id }, snap: r0.sk, done: s3.oldGuard.ret.find(x => x.id === evd.id).done };
      // 불러오기: 친족 항해사 정의가 다시 올라오고 돌아온 철새의 얼굴은 그대로
      const kinId = out.kin.id, wdId = wd && wd.id;
      delete G.MATE[kinId]; for (let i = G.MATES.length - 1; i >= 0; i--) if (G.MATES[i].id === kinId) G.MATES.splice(i, 1);
      const saved = JSON.parse(JSON.stringify(s3)); G.Game.state = saved; G.Wander.apply();
      out.load = { kin: !!G.MATE[kinId] && G.MATE[kinId].kin, face: wdId && G.MATE[wdId] && G.MATE[wdId].face, spec: wdId && !!G.Art.mateSpec(wdId) };
      // ④ 해고·떠남 — 사건 동료만 기록
      const s4 = G.Game.state, ev2 = G.MATES.find(m => (m.tale || m.eventOnly) && !m.sib && m.id !== evd.id && !m.minor);
      s4.mates.push({ id: ev2.id, role: 'none', joined: 15400101, loyal: 80 });
      const plain2 = s4.mates.find(m => !G.OldGuard.isEvent(m) && !/^kin_/.test(m.id));
      out.fire = { ev: !!G.OldGuard.left(ev2.id, 'fire'), twice: !!G.OldGuard.left(ev2.id, 'fire'), plain: !!G.OldGuard.left(plain2.id, 'fire'), due: s4.oldGuard.ret.find(x => x.id === ev2.id).due, y: s4.date.y };
      return out;
    });
    console.log(JSON.stringify({ vets: r.vets, rows: r.after.rows, kin: r.kin, friend: { name: r.friend.name }, ret: r.ret.news, wd: r.ret.wd && r.ret.wd.name }, null, 1));
    const n = r.names, a = r.after;
    ok(r.vets.length === 3 && [n.A, n.E, n.F].every(x => r.vets.includes(x)), '노장 = 40년↑ · 선실·선장 자리에 없는 부하 — ' + r.vets.join('·') + ' (선장 ' + n.B + ' · 선실 ' + n.C + ' · 10년 ' + n.D + ' 은 아니다)');
    ok(/노장 · 45년/.test(r.tagA) && r.tagB === '', '수첩 꼬리표: 노장 · 45년 (선장은 없음)');
    ok(/후견/.test(r.tagAide) && /후견/.test(r.infoTags), '세대 교체 뒤 수첩 「동료」에 후견 — ' + r.infoTags);
    ok(r.mlvW.join(',') === 'true,false,false,false,true,true', '달마다의 이별도 노장만 겪는다 (사건 동료 포함) — ' + r.mlvW.join(','));
    ok(a.rows.length === 4 && a.checked === 2, '고르기 창: 노장 셋 + 사촌 — 둘까지만 고른다 (셋째는 막힘)');
    ok(a.stay.A && a.stay.F && !a.stay.E && a.stay.B && a.stay.C && a.stay.D, '고른 노장 둘은 남고, 사건 동료 노장은 선대와 함께 내린다 · 선장·선실·젊은 부하는 그대로');
    ok(a.aideA.loyal === 100 && a.aideA.aide && a.aideA.leaveCd >= a.day0 + 3650 && a.aideF.aide, '남은 노장: 충성 100 · 후견(aide) · 열 해 동안 떠나지 않는다');
    ok(a.gone.E && a.fateE && a.fateE.why === 'retire' && !a.gone.kin, '내린 노장은 gone_ · 남은 이야기(선대 제독을 따라) — 두 자리가 차서 사촌은 합류하지 않았다');
    ok(/노장들/.test(a.said) && /함께 배에서 내렸다/.test(a.said) && /선대께 받은 은혜|처음 배를 몰던 날/.test(a.said), '작별·남는 말: ' + a.said.split('\n').filter(x => /내렸다|은혜|몰던/.test(x)).join(' / ').slice(0, 220));
    ok(/선대 제독 .+ 함께 배에서 내렸다/.test(a.log) && /후견/.test(a.log), '일지: 내린 노장 · 남은 노장(후견)');
    ok(a.ret.length === 1 && a.ret[0].id && a.ret[0].due === 1560, '사건 동료는 스무 해 뒤(1560년)에 돌아올 자리를 적어 둔다');
    ok(r.friend.ok && !r.friend.ev && r.friend.loyal === 90 && r.friend.g1 && !r.friend.g2 && r.friend.g2fate.why === 'retire', '소꿉친구가 찾아와 한 자리를 쓴다 (사건 표시 없이 · 충성 90) — 노장 하나만 남고 하나는 내린다');
    ok(/나무 칼/.test(r.friend.said) && /약속 지키러/.test(r.friend.said), '소꿉친구의 말: ' + r.friend.said.split('\n').filter(x => /나무 칼|약속/.test(x)).join(' / '));
    ok(!r.kinTry.kinRow, '두 자리가 다 찼으면 찾아온 친족은 함께 하지 못한다');
    ok(!r.ret.early && r.ret.news.length === 1 && r.ret.done === 1560, '스무 해가 차기 전에는 없고, 찬 해에 철새 소식 — ' + r.ret.news[0] + ' ' + JSON.stringify([r.ret.early, r.ret.news.length, r.ret.done]));
    const w = r.ret.wd, o = r.ret.orig;
    ok(w && w.wdf && w.name !== o.name && JSON.stringify(w.st) === JSON.stringify(o.st) && JSON.stringify(w.lg) === JSON.stringify(o.lg) && JSON.stringify(w.sk) === JSON.stringify(r.ret.snap), '다른 이름(' + (w && w.name) + ' ← ' + o.name + ') · 능력치·특기·말 그대로');
    ok(w.face === o.face && w.range && w.range.home != null && /닮았다는 말/.test(w.story), '얼굴 그대로 · 고장의 술집에 나타난다 · 이야기: ' + w.story);
    ok(new RegExp(r.kin.sur + '$').test(r.kin.cousin) && r.kin.cousinTag === '사촌' && /삼촌/.test(r.kin.cousinDesc), '사촌은 집안의 성을 쓴다 — ' + r.kin.cousin);
    ok(r.load.kin === 'cousin' || r.load.kin === 'friend', '불러오기: 친족·소꿉친구 항해사 정의가 다시 올라온다');
    ok(r.load.face === o.face && r.load.spec, '불러오기 뒤에도 돌아온 철새의 얼굴은 그대로');
    ok(r.fire.ev && !r.fire.twice && !r.fire.plain && r.fire.due === r.fire.y + 20, '해고·떠남으로 내린 사건 동료도 스무 해 뒤 · 두 번 적지 않고 · 사건 동료가 아니면 적지 않는다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' / ') : ''));
    console.log('old_guard_smoke OK');
  } catch (e) {
    console.error('✗ ' + (e && e.stack || e)); process.exitCode = 1;
  } finally { await browser.close(); }
})();
