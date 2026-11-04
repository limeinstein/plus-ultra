/* 조선소 「여러 척 한꺼번에 개조」 (tests/shipyard_batch_smoke.js) — node tests/shipyard_batch_smoke.js
   · 개조 → 맨 위 「여러 척 한꺼번에 개조」 · 배를 골라(빌린 배는 빠짐, 하나를 뺄 수 있음) 돛·대포·삭구를 한 번에
   · 값은 한 척씩 할 때와 같고, 고르지 않은 배는 그대로 · 조선 기술이 모자라면 그 단에서 멈춤 · 콘솔 오류 0 */
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
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.city && G.Scenes.city.B.shipyard, null, { timeout: 90000, polling: 200 });
  const out = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m); const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state, RR = G.R, SH = G.Ships, Y = G.Scenes.city.B.shipyard;
    const city = G.CITY_DATA.find(c => c && SH.techBase(c) === 2 && Y.types(c).length);
    const A = RR.newShip('carrack', '산 가브리엘'), B = RR.newShip('caravel', '베리우'), Cc = RR.newShip('caravel', '산 미겔'), D = RR.newShip('caravel', '산투 안토니우'), L = RR.newShip('caravel', '빌린 배');
    L.loan = 'x';
    [A, B, Cc, D].forEach(sh => { sh.guns = { type: 'saker', n: 2 }; sh.sails = sh.sails.map(() => 'sq'); sh.rig = 0; });
    s.fleet.ships = [A, B, Cc, L]; s.fleet.crew = 80; s.player.gold = 300000;
    G.Game.go('city', { cityId: city.id }); await sleep(400);
    G.Scenes.city.B.harbor.moored(city).push(D);
    R.push('   시험 도시: ' + city.name + ' (조선 기술 ' + SH.tech(city) + '등급) · 함대 ' + s.fleet.ships.map(x => x.name).join('·') + ' · 계류 ' + D.name);
    const choices = () => [...document.querySelectorAll('.choice')];
    const click = async (txt) => { for (let k = 0; k < 60; k++) { const el = choices().find(x => x.textContent.indexOf(txt) >= 0 && !x.classList.contains('dis')); if (el) { el.click(); await sleep(80); return true; } await sleep(50); } return false; };
    const btn = async (txt) => { for (let k = 0; k < 60; k++) { const el = [...document.querySelectorAll('.modal-back .btn')].reverse().find(x => x.textContent.indexOf(txt) >= 0); if (el) { el.click(); await sleep(120); return true; } await sleep(50); } return false; };
    const advance = async () => { for (let k = 0; k < 12; k++) { await sleep(120); const d = [...document.querySelectorAll('.dlg')].pop(); if (!d || document.querySelector('.choice') || document.querySelector('.ypick')) return; d.click(); } };
    const lastText = () => ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '';
    const p = Y.refit(city);
    ok(await click('여러 척 한꺼번에 개조'), '개조 목록 맨 위에 「여러 척 한꺼번에 개조」');
    await sleep(200);
    const rows = [...document.querySelectorAll('.ypick')];
    ok(rows.length === 4 && rows.every(x => x.checked) && ![...document.querySelectorAll('tr.click b')].some(x => x.textContent === '빌린 배'), '고르기 창: 함대·계류 4척, 처음엔 모두 골라 둠 · 빌린 배는 빠짐');
    document.querySelector('tr.click[data-i="2"]').click(); await sleep(60);   // 산 미겔을 뺀다
    ok(!document.querySelector('.ypick[data-i="2"]').checked, '줄을 누르면 고르기를 뺀다 (산 미겔)');
    // 돛
    let g0 = s.player.gold;
    await btn('돛 일괄 변경'); await click('앞 돛대는 삼각돛'); await sleep(150);
    ok(/산 가브리엘호/.test(lastText()) && /금화/.test(lastText()), '배마다 바뀌는 돛과 값을 보여 주고 묻는다');
    await btn('개조한다'); await advance();
    const nMast = [A, B, D].reduce((t, sh) => t + (sh.sails.length > 1 ? 1 : 0), 0);
    ok([A, B, D].every(sh => sh.sails[0] === (sh.sails.length > 1 ? 'lat' : 'sq') && sh.sails.slice(1).every(x => x === 'sq')) && Cc.sails.every(x => x === 'sq'), '앞 돛대만 삼각돛 — 고른 3척 · 산 미겔은 그대로');
    ok(g0 - s.player.gold === nMast * 300, '돛 값 ' + (g0 - s.player.gold) + '닢 (돛 ' + nMast + '개 × 300)');
    // 대포
    await sleep(200);
    g0 = s.player.gold;
    const want = [A, B, D].reduce((t, sh) => t + Y._batch.gunCost(sh, 'culverin', sh.ports), 0);
    await btn('대포 일괄 변경'); await click('캘버린포'); await click('포문을 가득 채운다'); await sleep(150); await btn('개조한다'); await advance();
    ok([A, B, D].every(sh => sh.guns.type === 'culverin' && sh.guns.n === sh.ports) && Cc.guns.type === 'saker', '캘버린포로 포문 가득 — ' + [A, B, D].map(sh => sh.name + ' ' + sh.guns.n + '문').join(' · '));
    ok(g0 - s.player.gold === want, '대포 값 ' + (g0 - s.player.gold) + '닢 = 한 척씩 할 때의 합 (떼어낸 세이커포는 반값 환급)');
    const locked = choices().length === 0;
    // 삭구 (조선 기술 2등급: 1단만 가능 — 2단은 3등급)
    await sleep(200);
    g0 = s.player.gold;
    const rigWant = [A, B, D].reduce((t, sh) => t + Math.round(G.SHIP[sh.type].price * G.BALANCE.rigging[0].cost / 10) * 10, 0);
    await btn('삭구 일괄 개량'); await click('할 수 있는 데까지'); await sleep(150);
    ok(/조선 기술 3등급 필요/.test(lastText()), '조선 기술이 모자란 단은 까닭을 적는다');
    await btn('개조한다'); await advance();
    ok([A, B, D].every(sh => sh.rig === 1) && !Cc.rig && g0 - s.player.gold === rigWant, '삭구 1단(앞삼각돛) — 3척 · 금화 ' + (g0 - s.player.gold));
    SH.techInvest(city, 70000);
    await sleep(200); await btn('삭구 일괄 개량'); await click('할 수 있는 데까지'); await sleep(150); await btn('개조한다'); await advance();
    ok([A, B, D].every(sh => sh.rig === G.BALANCE.rigging.length), '기술 5등급이 되면 끝 단(' + G.BALANCE.rigging.length + '단)까지 한 번에');
    // 돈이 모자라면
    await sleep(200); s.player.gold = 10;
    await btn('대포 일괄 변경'); await click('캐로네이드포'); await click('포문을 가득 채운다'); await sleep(300);
    ok(s.player.gold === 10 && A.guns.type === 'culverin' && /필요하네/.test(document.body.innerText), '돈이 모자라면 조선소 목수가 값을 말하고 아무것도 바꾸지 않는다');
    await advance();
    // 하나도 고르지 않으면
    await sleep(200); document.querySelectorAll('.ypick').forEach(cb => { if (cb.checked) cb.click(); }); await btn('돛 일괄 변경'); await sleep(150);
    ok(document.querySelectorAll('.ypick').length === 4, '하나도 고르지 않으면 창이 닫히지 않는다');
    await btn('돌아간다'); await sleep(200);
    document.querySelectorAll('.modal-back .title .x').forEach(x => x.click());
    await Promise.race([p.catch(() => {}), sleep(1500)]);
    return R;
  });
  console.log(out.join('\n')); console.log(errs.length ? errs.join('\n') : '콘솔 오류 0');
  } finally { await b.close(); }
})();
