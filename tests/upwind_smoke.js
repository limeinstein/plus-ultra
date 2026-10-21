/* 맞바람 시험 (tests/upwind_smoke.js) — node tests/upwind_smoke.js
   · 사각돛 곡선(G.BALANCE.upwind.sq): 프리깃·대형 갤리온의 맞바람 성능이 카라벨의 70% 안팎, 순풍은 그대로
   · 항해술이 높을수록 지그재그 손실이 적다 (R.tackK 0.92 → 0.98)
   · 조선소 「개조 → 삭구 개량」: 1단씩 차례로, 값을 치르고, 맞바람 함대 속력이 오르고 순풍은 그대로, 용골은 적재량 −4%
   · 구입 카드의 「맞바람」 칸 · 바다: 맞바람을 정면으로 안고 손으로 몰면 부관이 지그재그를 묻고, 예 → 자동 지그재그. 콘솔 오류 0 */
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea && G.Scenes.city && G.Scenes.city.B.shipyard, null, { timeout: 90000 });
  const out = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0;
    const s = G.Game.state, RR = G.R;
    // 1) 배 종류의 맞바람 성능
    const U = id => RR.typeUpwind(id, 0);
    const car = U('caravel'), fri = U('frigate'), lg = U('lgalleon'), cog = U('cog');
    ok(fri.up / car.up > 0.65 && lg.up / car.up > 0.5, '맞바람: 카라벨 ' + car.up.toFixed(3) + ' · 프리깃 ' + fri.up.toFixed(3) + ' (' + Math.round(fri.up / car.up * 100) + '%) · 대형 갤리온 ' + lg.up.toFixed(3) + ' · 코그 ' + cog.up.toFixed(3));
    const oldBest = G.SHIP.frigate.spd * Math.max(...[0, 15, 30, 45, 60, 75, 90].map(a => G.SHIP.frigate.sails.reduce((t, k) => t + (k === 'sq' ? (a < 60 ? 1 - a / 600 : 0.9 - (a - 60) * 0.0125) : RR.sailEff(k, a * Math.PI / 180)), 0) / 4));
    ok(Math.abs(fri.best - oldBest) < 1e-9, '프리깃 순풍·옆바람 최고 속력은 예전 곡선과 같음 ' + fri.best.toFixed(3) + ' = ' + oldBest.toFixed(3));
    ok(car.up > fri.up, '그래도 삼각돛 카라벨이 맞바람에는 더 빠르다');
    ok(RR.upwindWord(car) === '강함' && RR.upwindWord(cog) === '약함', '한 낱말: 카라벨 ' + RR.upwindWord(car) + ' · 프리깃 ' + RR.upwindWord(fri) + ' · 코그 ' + RR.upwindWord(cog) + ' · 갤리 ' + RR.upwindWord(U('galley')));
    // 2) 함대: 프리깃 한 척, 정면 맞바람
    const sh = RR.newShip('frigate', '산타 루치아'); s.fleet.ships = [sh]; s.fleet.crew = G.SHIP.frigate.crew[1]; s.fleet.fatigue = 0; s.mates = [];
    s.player.sk.nav = 0;
    const wind = { dir: Math.PI, spd: 0.62 }, env = null;   // 바람이 서쪽으로 분다 → 동쪽(0)으로 가면 정면 맞바람
    const head0 = RR.fleetMotion(0, wind, env).vmg, down0 = RR.fleetMotion(Math.PI, wind, env).vmg;
    s.player.sk.nav = 3;
    const head3 = RR.fleetMotion(0, wind, env).vmg;
    ok(Math.abs(RR.tackK() - 0.98) < 1e-9 && head3 > head0 * 1.04, '항해술 3: 지그재그 손실 0.92 → ' + RR.tackK() + ' (맞바람 ' + head0.toFixed(3) + ' → ' + head3.toFixed(3) + ', 조함 보정 포함)');
    s.player.sk.nav = 0;
    // 3) 조선소 삭구 개량 (리스본)
    const lis = G.CITY_DATA.find(c => c && c.name === '리스본');
    G.Game.go('city', { cityId: lis.id }); await sleep(400);
    const Y = G.Scenes.city.B.shipyard;
    const card = document.createElement('div'); document.body.appendChild(card);
    const tech = G.Ships.tech(lis); R.push('   리스본 조선 기술 ' + tech + '등급');
    s.player.gold = 200000;
    const click = async (txt) => { for (let k = 0; k < 40; k++) { const el = [...document.querySelectorAll('.choice:not(.dis)')].find(x => x.textContent.indexOf(txt) >= 0); if (el) { el.click(); await sleep(60); return true; } await sleep(50); } return false; };
    const closeWin = async () => { for (let k = 0; k < 6; k++) { const mb = [...document.querySelectorAll('.modal-back')].pop(); if (!mb) return; const x = mb.querySelector('.title .x'); if (x) x.click(); else (mb.querySelector('.dlg') || mb).click(); await sleep(80); } };
    const advance = async () => { for (let k = 0; k < 10; k++) { const d = [...document.querySelectorAll('.dlg')].pop(); if (!d || document.querySelector('.choice')) return; d.click(); await sleep(60); } };
    const cap0 = RR.shipCargoCap(sh), g0 = s.player.gold;
    const p = Y.refit(lis);
    ok(await click('산타 루치아'), '개조할 배 고름');
    const menuTxt = [...document.querySelectorAll('.choice')].map(x => x.textContent).join(' | ');
    ok(/삭구 개량/.test(menuTxt), '개조 메뉴에 「삭구 개량」: ' + (menuTxt.match(/삭구 개량[^|]*/) || [''])[0]);
    ok(await click('삭구 개량'), '삭구 개량 열기');
    const rigTxt = [...document.querySelectorAll('.choice')].map(x => x.textContent.replace(/\s+/g, ' ')).join(' | ');
    R.push('   ' + rigTxt.slice(0, 220));
    const dis2 = [...document.querySelectorAll('.choice')].filter(x => /2단/.test(x.textContent))[0];
    ok(dis2 && dis2.classList.contains('dis'), '2단은 1단을 하기 전에 고를 수 없음');
    ok(await click('1단'), '1단 · 앞삼각돛'); await advance();
    ok(sh.rig === 1 && s.player.gold < g0, '1단 됨 (금화 ' + (g0 - s.player.gold) + '닢)');
    if (tech >= 3) { await click('2단'); await advance(); }
    if (tech >= 4) { await click('3단'); await advance(); }
    await closeWin(); await closeWin(); await Promise.race([p.catch(() => {}), sleep(2000)]);
    if (sh.rig < 3) { sh.rig = 3; sh.cap = Math.round(sh.cap * 0.96); R.push('   (조선 기술이 모자라 2·3단은 직접 매김)'); }
    const head3r = RR.fleetMotion(0, wind, env).vmg, down3r = RR.fleetMotion(Math.PI, wind, env).vmg;
    ok(head3r > head0 * 1.2, '삭구 3단: 맞바람 ' + head0.toFixed(3) + ' → ' + head3r.toFixed(3) + ' (+' + Math.round((head3r / head0 - 1) * 100) + '%)');
    const rg = sh.rig; sh.rig = 0; const downNo = RR.fleetMotion(Math.PI, wind, env).vmg; sh.rig = rg;
    ok(Math.abs(down3r - downNo) < 1e-9, '순풍은 삭구와 상관없음 ' + downNo.toFixed(3) + ' (용골 바닥짐 탓 짐 비율만 조금: 처음 ' + down0.toFixed(3) + ')');
    ok(RR.shipCargoCap(sh) < cap0, '용골: 적재량 ' + cap0 + ' → ' + RR.shipCargoCap(sh));
    ok(RR.shipValue(sh) > 0, '배값에 개량비 일부 반영: ' + RR.shipValue(sh));
    // 4) 구입 카드
    await closeWin();
    const pb = Y.buy(lis); await sleep(500);
    const buyTxt = (document.querySelector('.modal-back .win') || {}).textContent || '';
    ok(/맞바람/.test(buyTxt) && /(강함|보통|약함)/.test(buyTxt), '구입 카드에 맞바람 칸');
    await closeWin(); await Promise.race([pb.catch(() => {}), sleep(2000)]);
    // 5) 바다: 손으로 몰며 정면 맞바람 → 부관이 묻는다
    sh.rig = 0;
    s.settings.tackMode = 'on';                          // 설정 「맞바람 지그재그 — 언제나」 (기본은 곧게 — tests/tack_mode_smoke.js)
    G.Game.go('sea', { depart: lis.id }); await sleep(300);
    const SEA = G.Scenes.sea, st = SEA.runtime();
    st.paused = false; st.manual = true; st.keys = { up: true }; st.cruise = true; st.thr = 1;
    const w = SEA.curWind ? SEA.curWind() : null;
    st.windVis = st.wind; const wd = st.wind.dir;
    s.loc.heading = wd + Math.PI;                       // 바람이 오는 쪽으로 뱃머리
    let asked = false;
    for (let k = 0; k < 400 && !asked; k++) { s.loc.heading = st.wind.dir + Math.PI; SEA.update(0.05); await sleep(0); asked = /지그재그를 하며 거슬러/.test(([...document.querySelectorAll('.dlg')].pop() || {}).textContent || ''); }
    ok(asked, '맞바람을 안고 손으로 몰면 부관이 「지그재그로 거슬러 오를까요?」 (headT ' + (st.headT || 0).toFixed(2) + ')');
    for (let k = 0; k < 20 && !document.querySelector('.askrow .btn'); k++) { const d = [...document.querySelectorAll('.dlg')].pop(); if (d) d.click(); await sleep(60); }
    const yes = [...document.querySelectorAll('.askrow .btn')].find(x => /지그재그로 거슬러/.test(x.textContent));
    if (yes) { yes.click(); await sleep(150); }
    ok(!st.manual && st.dirCrs != null, '예 → 그 방위로 침로(자동 지그재그) dirCrs=' + (st.dirCrs != null ? st.dirCrs.toFixed(2) : null));
    for (let k = 0; k < 60; k++) { SEA.update(0.05); await sleep(0); }
    ok(st.tackTheta > 0, '지그재그로 거슬러 오르는 중 (θ ' + Math.round((st.tackTheta || 0) * 180 / Math.PI) + '°)');
    return R;
  });
  console.log(out.join('\n')); console.log(errs.slice(0, 5).join('\n') || '✓ 콘솔 오류 없음'); await b.close();
  process.exitCode = out.some(x => x[0] === '✗') || errs.length ? 1 : 0;
})();
