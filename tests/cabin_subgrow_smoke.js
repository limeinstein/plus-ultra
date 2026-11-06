/* 선실의 보조 특기 성장 (tests/cabin_subgrow_smoke.js) — node tests/cabin_subgrow_smoke.js — 2026-11-06 사용자 요청
   「보조 능력치도 올라갈 수 있게 · 보조 특기는 1.2배 느리게」
   · 해병 대기실(★검술 ☆사격술): 3년이면 검술 +1, 사격술은 3.6년에 +1 · 갑판(★운용 ☆검술) · 참모실(★운용 ☆역사·측량)
   · 진행 글은 실제 지낸 날로 · 선실 화면이 열린다 · 콘솔 오류 0 */
const path = require('path'); const { pathToFileURL } = require('url');
let chromium; try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Cabins && G.CabinView, null, { timeout: 90000, polling: 200 });
  const out = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m); const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state, CB = G.Cabins;
    const sh = G.R.newShip('lgalleon', '산 가브리엘'); s.fleet.ships = [sh]; s.fleet.cabinUid = null;
    const rooms = CB.rooms(); rooms[1] = 'marine'; rooms[2] = 'staff';
    const ids = Object.keys(G.MATE).filter(id => !G.MATE[id].noWander && !G.MATE[id].eventOnly).slice(0, 3);
    s.mates = ids.map(id => ({ id, loyal: 90, role: 'none', sk: { sword: 1, shoot: 0, ops: 0, hist: 0, survey: 0 } }));
    const [a, c2] = s.mates;
    CB.place(a, 1); CB.place(c2, 2);
    ok(JSON.stringify(CB.growSkills('marine').map(x => x.sk + (x.sub ? '☆' : '★'))) === '["sword★","shoot☆"]', '해병 대기실: ' + CB.growSkills('marine').map(x => (x.sub ? '☆' : '★') + G.SKILL_BY_ID[x.sk].name + ' ×' + x.rate.toFixed(3)).join(' · '));
    ok(CB.growSkills('staff').length === 3 && CB.growSkills('deck').map(x => x.sk).join() === 'ops,sword', '참모실: ' + CB.growSkills('staff').map(x => (x.sub ? '☆' : '★') + G.SKILL_BY_ID[x.sk].name).join(' · ') + ' · 갑판: ' + CB.growSkills('deck').map(x => (x.sub ? '☆' : '★') + G.SKILL_BY_ID[x.sk].name).join(' · '));
    ok(!CB.growSkills('hold').length && !CB.growSkills('store').length && !CB.growSkills('captain').length, '빈 선실·창고·함장실은 아무것도 늘지 않음');
    const msgs = [];
    const run = n => { for (let i = 0; i < n; i++) msgs.push(...CB.grow()); };
    run(1095);
    ok(CB.rawSkill(a, 'sword') === 2 && CB.rawSkill(a, 'shoot') === 0, '3년(1,095일): 검술 1→2 · 사격술은 아직 0');
    R.push('   3년째 진행: ' + CB.growNote(a));
    ok(/☆사격술 3년 · 다음 단계 3년 219일/.test(CB.growNote(a)), '보조 특기 진행은 실제 날로 보여 준다');
    run(1314 - 1095);
    ok(CB.rawSkill(a, 'shoot') === 1, '3.6년(1,314일): 사격술 0→1');
    R.push('   알림: ' + msgs.filter(x => /사격술/.test(x.text)).map(x => x.text).join(' / '));
    ok(CB.rawSkill(c2, 'ops') === 1 && CB.rawSkill(c2, 'hist') === 1 && CB.rawSkill(c2, 'survey') === 1, '참모실 3.6년: 운용·역사·측량 모두 +1');
    run(3285 - 1314);
    ok(CB.rawSkill(a, 'sword') === 3 && CB.rawSkill(a, 'shoot') === 1, '9년: 검술 3(끝) · 사격술은 아직 1 (2단계는 10.8년)');
    run(3942 - 3285);
    ok(CB.rawSkill(a, 'shoot') === 2, '10.8년(3,942일): 사격술 2');
    // 선실 화면
    const p = G.CabinView.open ? G.CabinView.open() : null; await sleep(600);
    ok(/사격술/.test(document.body.innerText), '선실 화면에 보조 특기 진행이 보인다');
    document.querySelectorAll('.modal-back .title .x').forEach(x => x.click()); await sleep(200);
    return R;
  });
  console.log(out.join('\n')); console.log(errs.length ? errs.join('\n') : '콘솔 오류 0');
  const failed = out.filter(x => x.startsWith('✗ '));
  if (failed.length || errs.length) throw new Error(failed.concat(errs).join('\n'));
  } finally { await b.close(); }
})();
