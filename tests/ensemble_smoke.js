/* 맞닿은 방 (tests/ensemble_smoke.js) — node tests/ensemble_smoke.js
   · 음악실 앙상블: 맞닿은(위·아래·왼쪽·오른쪽) 음악실의 음악 특기자 2명부터 — 듀엣·트리오·콰트로·밴드·그룹, 떨어진 방·음악 모르는 사람은 빠짐
   · 음악·웅변 단계만큼 하루 피로·규율, 입항한 도시의 유행 파는 값을 키움 (다른 도시·뭍길이면 안 됨)
   · 요리실+식당이 맞닿으면 「따끈한 밥상」 — 두 방 효과 ×1.25, 차림 배율 +0.25 · 선실 화면 꼬리표 · 바다 하루 · 콘솔 오류 0 */
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
  await page.waitForFunction(() => window.G && G.Game && G.Cabins && G.CabinView && G.Scenes && G.Scenes.sea, null, { timeout: 90000 });
  const run = page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m); const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state, CB = G.Cabins, RR = G.R;
    const big = Object.keys(G.SHIP).map(id => ({ id, n: CB.slots({ type: id }) })).sort((a, b) => b.n - a.n)[0];
    const sh = RR.newShip(big.id, '산 가브리엘'); s.fleet.ships = [sh]; s.fleet.crew = G.SHIP[big.id].crew[1]; s.fleet.cabinUid = null;
    const rooms = CB.rooms(); for (let i = 1; i < rooms.length; i++) rooms[i] = 'hold';
    R.push('   기함 ' + G.SHIP[big.id].name + ' · 선실 ' + (rooms.length - 1) + '칸 · ' + CB.cols() + '칸씩 한 줄');
    const ids = Object.keys(G.MATE).filter(id => !G.MATE[id].noWander).slice(0, 12);
    s.mates = ids.map(id => ({ id, loyal: 80, role: 'none', sk: { music: 2, speech: 1 } }));
    const M = s.mates;
    // 1·2·7 맞닿음(7은 1의 아래), 4는 떨어짐
    [1, 2, 7, 4].forEach(i => rooms[i] = 'musicroom');
    ok(CB.roomsTouch(1, 2) && CB.roomsTouch(1, 7) && !CB.roomsTouch(2, 7) && !CB.roomsTouch(6, 7), '맞닿음: 1-2(옆) · 1-7(아래) · 2-7(대각선 아님) · 6-7(줄 끝은 이어지지 않음)');
    CB.place(M[0], 1); CB.place(M[1], 4);
    ok(CB.ensembles().length === 0, '떨어진 두 음악실은 앙상블이 아님');
    CB.place(M[1], 2);
    let e = CB.ensembles();
    ok(e.length === 1 && e[0].name === '듀엣' && e[0].n === 2, '맞닿은 두 방 → ' + (e[0] && e[0].name));
    CB.place(M[2], 7);
    e = CB.ensembles(); ok(e[0].name === '트리오', '셋 → ' + e[0].name);
    M[3].sk = { speech: 3 }; CB.place(M[3], 4); rooms[3] = 'musicroom'; rooms[4] = 'musicroom';   // 3이 2와 4를 잇는다
    e = CB.ensembles(); ok(e[0].n === 3, '음악을 모르는 사람은 함께 연주하지 않음 (' + e[0].n + '명)');
    CB.place(M[4], 3);
    e = CB.ensembles(); ok(e[0].name === '콰트로' && e[0].n === 4, '3번 방이 2·4를 이어 넷 → ' + e[0].name);
    ok(CB.ensembleName(5) === '밴드' && CB.ensembleName(6) === '밴드' && CB.ensembleName(7) === '그룹' && CB.ensembleName(10) === '그룹', '5·6 밴드 · 7 이상 그룹');
    // 실력에 따라
    const fx1 = CB.ensembleFx();
    M.forEach(m => { if (m.sk.music) m.sk = { music: 3, speech: 3 }; });
    const fx2 = CB.ensembleFx();
    ok(fx2.fat > fx1.fat && fx2.disc > fx1.disc && fx2.fad > fx1.fad, '음악·웅변이 높을수록 커짐: 피로 −' + fx1.fat.toFixed(2) + '→−' + fx2.fat.toFixed(2) + ' · 규율 +' + fx1.disc.toFixed(2) + '→+' + fx2.disc.toFixed(2) + ' · 유행 +' + Math.round(fx1.fad * 100) + '%→+' + Math.round(fx2.fad * 100) + '%');
    // 유행
    const home = G.CITY_DATA[s.player.home], g = Object.keys(G.GOOD).sort((a, b) => G.GOOD[b].p - G.GOOD[a].p)[0];
    G.Fad.start({ g, k: 'r', key: home.region, since: s.day, until: s.day + 60, m: 1.6 });
    s.loc.city = home.id; s.loc.via = null;
    const withE = RR.sellPrice(home, g);
    const keep = rooms.slice(); for (let i = 1; i < rooms.length; i++) if (rooms[i] === 'musicroom') rooms[i] = 'hold';
    const noE = RR.sellPrice(home, g);
    for (let i = 0; i < keep.length; i++) rooms[i] = keep[i];
    const want = (1 + 0.6 * (1 + fx2.fad)) / 1.6;
    ok(Math.abs(withE / noE - want) < 0.005, '유행하는 물건 파는 값 ×' + (withE / noE).toFixed(3) + ' (기대 ×' + want.toFixed(3) + ') — ' + noE + '→' + withE + '닢');
    s.loc.via = 'land'; ok(RR.sellPrice(home, g) === noE, '탐험대로 뭍길로 왔으면 악사가 없음'); s.loc.via = null;
    const g2 = Object.keys(G.GOOD)[1]; ok(CB.fadBoost(home, G.Fad.mult(home, g2)) === 1, '유행이 아닌 물건은 그대로');
    // 요리실+식당
    rooms[9] = 'galley'; rooms[11] = 'mess';
    const cook = M[8]; cook.sk = { cook: 3 }; CB.place(cook, 9); CB.place(M[9], 11); M[9].sk = { cook: 2, speech: 2 };
    const far = { mess: CB.fx('mess', 'mess'), galley: CB.fx('galley', 'galley'), meal: CB.galleyMeal() };
    ok(!CB.kitchenLink(), '9·11은 떨어짐');
    rooms[10] = 'mess'; rooms[11] = 'hold'; CB.place(M[9], 10);
    const near = { mess: CB.fx('mess', 'mess'), galley: CB.fx('galley', 'galley'), meal: CB.galleyMeal() };
    ok(CB.kitchenLink() && Math.abs(near.mess / far.mess - 1.25) < 1e-6 && Math.abs(near.galley / far.galley - 1.25) < 1e-6, '맞닿으면 따끈한 밥상: 식당·요리실 효과 ×1.25');
    ok(near.meal && far.meal && near.meal.hot && Math.abs(near.meal.mult - far.meal.mult - 0.25) < 1e-6, '요리실 차림 배율 ' + far.meal.mult.toFixed(2) + '→' + near.meal.mult.toFixed(2));
    // 선실 화면
    const p = G.CabinView.open ? G.CabinView.open() : null; await sleep(500);
    const txt = document.body.innerText;
    ok(/콰트로/.test(txt) && /따끈한 밥상/.test(txt) && /음악실 앙상블/.test(txt), '선실 화면: 카드 꼬리표(콰트로·따끈한 밥상)와 효과 줄');
    const t = G.CabinView._totals(); const ens = t.fx.find(x => x.k === 'ens'), fb = t.fx.find(x => x.k === 'fadb');
    R.push('   효과 줄: ' + ens.label + ' 「' + ens.text + '」 · ' + fb.label + ' ' + fb.text);
    window.__shot = true; await new Promise(r => { window.__go = r; });
    document.querySelectorAll('.modal-back .title .x').forEach(x => x.click()); await sleep(200);
    // 바다에서 하루
    G.Game.go('sea', { depart: home.id }); await sleep(600);
    s.fleet.fatigue = 50; s.fleet.discipline = 50;
    try { await G.Scenes.sea.runDay(); ok(true, '바다 하루 넘김 — 피로 ' + s.fleet.fatigue.toFixed(2) + ' · 규율 ' + s.fleet.discipline.toFixed(2)); } catch (er) { ok(false, '바다 하루: ' + er.message); }
    return R;
  });
  await page.waitForFunction(() => window.__shot, null, { timeout: 90000, polling: 200 });
  if (process.env.SHOT) await page.evaluate(() => { [...document.body.querySelectorAll('*')].filter(e => e.children.length < 6 && /바다를 그리는 중/.test(e.textContent || '') && getComputedStyle(e).position === 'fixed').forEach(e => e.style.display = 'none'); });
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT, timeout: 20000 }).catch(e => console.log('   (스크린숏 못 찍음: ' + e.message.split('\n')[0] + ')'));
  await page.evaluate(() => window.__go());
  const out = await run;
  console.log(out.join('\n')); console.log(errs.length ? errs.join('\n') : '콘솔 오류 0');
  } finally { await b.close(); }
})();
