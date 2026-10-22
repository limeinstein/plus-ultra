/* 선실에서 지내면 그 방의 특기가 는다 — 3년 +1 · 9년 +2 · 27년 +3 (특기 3까지)
   지도 제작실 → 측량 · 조타실(항해사) → 항해 · 파수대(측량사) → 측량 · 창고·선장은 늘지 않는다
   node tests/cabin_growth_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const res = [];
function ok(v, msg) { res.push([!!v, msg]); console.log((v ? '  ✓ ' : '  ✗ ') + msg); }
(async function () {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
  const r = await page.evaluate(() => {
    const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
    G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
    const s = G.Game.state, R = G.R, CB = G.Cabins, out = {};
    const big = ['galleon', 'carrack', 'nao'].filter(t => G.SHIP[t])[0];
    s.fleet.ships[0] = R.newShip(big, '기함');
    s.mates = [];
    const ids = G.MATES.filter(d => d.wage).map(d => d.id).slice(0, 10);
    const mk = (k, skv) => { const m = { id: ids[k], role: 'none', loyal: 80, sk: {} }; G.SKILLS.forEach(x => { m.sk[x.id] = skv[x.id] || 0; }); s.mates.push(m); return m; };
    const rooms = CB.rooms();
    const i = rooms.findIndex((t, k) => k > 0 && !G.CABIN[t].fixed);
    out.remodel = CB.remodel(i, 'chart');
    const a = mk(0, {}); CB.place(a, i);
    const h = mk(1, { nav: 2 }); h.role = 'nav';
    const idle = mk(2, {});                // 방 없음
    const cap = mk(3, {}); cap.role = 'captain';
    out.growChart = CB.growSkill('chart'); out.growHelm = CB.growSkill('helm'); out.growHold = CB.growSkill('hold'); out.growStore = CB.growSkill('store');
    let msgs = [];
    const run = n => { for (let d = 0; d < n; d++) msgs = msgs.concat(CB.grow()); };
    out.s0 = R.mateSkill(a, 'survey');
    run(1094); out.s1094 = R.mateSkill(a, 'survey');
    run(1); out.s1095 = R.mateSkill(a, 'survey'); out.msg1 = msgs.map(x => x.text).join(' / ');
    out.note = CB.growNote(a);
    out.h1095 = R.mateSkill(h, 'nav'); out.hNav = h.skg && h.skg.nav;   // 2 + 1 = 3
    run(3285 - 1095); out.s3285 = R.mateSkill(a, 'survey');
    out.hCap = R.mateSkill(h, 'nav');   // 3에서 멈춘다
    run(9855 - 3285); out.s9855 = R.mateSkill(a, 'survey'); out.note3 = CB.growNote(a);
    out.idle = idle.skd ? Object.keys(idle.skd).length : 0; out.cap = cap.skd ? Object.keys(cap.skd).length : 0;
    out.msgN = msgs.length;
    // 같은 특기를 키우는 다른 방(파수대)으로 옮겨도 이어진다
    const b = mk(4, {}); CB.place(b, i); b.skd = { survey: 1000 }; CB.grow(); a.role = 'none';
    b.room = null; delete b.roomType; b.role = 'surveyor'; run(95); out.carry = R.mateSkill(b, 'survey');
    // 옛 저장(skd·skg 없음)도 그대로
    const old = mk(5, { survey: 1 }); out.old = R.mateSkill(old, 'survey');
    // 하루 일과에서도 돈다
    const c = mk(6, {}); const j = rooms.findIndex((t, k) => k > 0 && !G.CABIN[t].fixed && k !== i); CB.remodel(j, 'galley'); CB.place(c, j);
    CB.daily(); out.daily = c.skd && c.skd.cook;
    // 화면: 선실 창 그리기
    try { if (G.CabinView && G.CabinView.html) G.CabinView.html(); out.view = 'ok'; } catch (e) { out.view = e.message; }
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.remodel, '빈 방을 지도 제작실로 고친다');
  ok(r.growChart === 'survey' && r.growHelm === 'nav' && !r.growHold && !r.growStore, '방마다 키우는 특기: 지도 제작실 측량 · 조타실 항해 · 창고 없음');
  ok(r.s0 === 0 && r.s1094 === 0 && r.s1095 === 1, '3년(1095일)째에 측량 0 → 1 (1094일 ' + r.s1094 + ')');
  ok(/지도 제작실에서 3년을 지내며 측량이 늘었다 \(측량 0 → 1\)/.test(r.msg1), '알림: ' + r.msg1);
  ok(/측량 3년/.test(r.note) && /\+2까지 6년/.test(r.note), '진행 표시: ' + r.note);
  ok(r.s3285 === 2 && r.s9855 === 3, '9년 +2 · 27년 +3 (' + r.s3285 + ' · ' + r.s9855 + ')');
  ok(r.h1095 === 3 && r.hCap === 3, '조타실 항해사: 항해 2 → 3, 그 위로는 3에서 멈춘다');
  ok(/다 컸다/.test(r.note3), '27년 뒤 표시: ' + r.note3);
  ok(r.idle === 0 && r.cap === 0, '방 없는 부하·다른 배 선장은 쌓이지 않는다');
  ok(r.msgN === 3 + 1, '알림은 단계가 오를 때만 (지도 제작실 3번 + 조타실 1번) — ' + r.msgN);
  ok(r.carry === 1, '지도 제작실 1001일 + 파수대 95일 = 3년 → 측량 1 (방을 옮겨도 이어진다)');
  ok(r.old === 1, '옛 저장의 부하는 특기 그대로');
  ok(r.daily === 1, 'CB.daily가 하루를 쌓는다 (주방 → 요리)');
  ok(errors.length === 0, '콘솔 오류 0 ' + (errors.length ? errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
  const bad = res.filter(x => !x[0]).length;
  console.log(bad ? '실패 ' + bad : '모두 통과 ' + res.length);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
