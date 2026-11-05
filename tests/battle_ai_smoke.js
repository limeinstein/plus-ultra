/* 해전: 오른쪽 클릭 명령 · 적의 생각 (tests/battle_ai_smoke.js) — node tests/battle_ai_smoke.js — 2026-11-05 사용자 요청
   · 우리 배를 고르고 오른쪽 클릭 → 그 자리로 가서 지킴 · 적함 위 → 그 적을 노림 · 고른 배가 없으면 기함 · 브라우저 오른쪽 메뉴는 뜨지 않음
   · 적: 표적을 나눠 고르고, 장전된 현측으로 돌아서고, 동료와 간격을 두고, 우리 현측 앞을 피해 돌아 든다 — 예전 방식(기능을 끈 것)과 견준다 · 콘솔 오류 0 */
const path = require('path'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
  const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  page.on('console', m => { if (m.type() === 'log' && /^trial/.test(m.text())) console.log(m.text()); });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.battle, null, { timeout: 90000, polling: 200 });
  const out = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m); const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: { gun: 2 }, lg: [], diff: 'normal' });
    const s = G.Game.state; s.settings.res = 0.35;
    const BT = G.Scenes.battle, base = JSON.parse(JSON.stringify(G.BALANCE.navalAI));
    BT.noRender = true;   // 그리지 않고 셈만 (헤드리스에서는 한 장면 그리기가 2초씩 걸린다)
    function fleet() { s.fleet.ships = [G.R.newShip('carrack', '산 가브리엘'), G.R.newShip('carrack', '베리우'), G.R.newShip('carrack', '산 미겔')]; s.fleet.ships.forEach(x => { x.guns = { type: 'culverin', n: x.ports }; }); s.fleet.crew = 240; }
    function startBattle(npc) { fleet(); s.loc = { mode: 'sea', lon: -20, lat: 30, heading: 0 }; G.Game.go('battle', { npc }); }
    async function ready() { for (let k = 0; k < 100; k++) { const st = BT.runtime(); if (st && st.ships && st.ships.length && !G.UI.busy()) return st; await sleep(100); if (G.UI.busy()) { const d = [...document.querySelectorAll('.dlg')].pop(); if (d) d.click(); } } return BT.runtime(); }
    // ── 1. 오른쪽 클릭
    startBattle({ kind: 'navy', n: 3 }); let st = await ready();
    const mine = st.ships.filter(x => x.side === 'me'), fs = mine.find(x => x.flag), al = mine.find(x => !x.flag), foe = st.ships.find(x => x.side === 'en');
    R.push('   우리 ' + mine.length + '척 · 적 ' + st.ships.filter(x => x.side === 'en').length + '척');
    st.sel = al;
    const gx = al.x + 160, gy = al.y + 60;
    BT._onRight(gx, gy);
    ok(al.order === 'hold' && al.hold && Math.hypot(al.hold[0] - gx, al.hold[1] - gy) < 1 && st.clickMark && !st.clickMark.foe, '아군 배를 고르고 바다에 오른쪽 클릭 → 그 자리로 (지점 사수)');
    for (let i = 0; i < 80; i++) BT.update(0.2);
    ok(Math.hypot(al.x - gx, al.y - gy) < 90, '16초 뒤 그 자리 가까이 — 남은 거리 ' + Math.round(Math.hypot(al.x - gx, al.y - gy)));
    BT._onRight(foe.x, foe.y);
    ok(al.order === 'attack' && al.otarget === foe && st.clickMark.foe, '적함 위에 오른쪽 클릭 → 그 적을 노림');
    st.sel = null;
    const fx = fs.x - 150, fy = fs.y + 80; BT._onRight(fx, fy);
    ok(fs.moveTo && Math.hypot(fs.moveTo[0] - fx, fs.moveTo[1] - fy) < 1, '고른 배가 없으면 기함이 그 자리로');
    const cat = document.querySelector('.mapcatch');
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); cat.dispatchEvent(ev);
    const md = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 2, clientX: 300, clientY: 200 }); cat.dispatchEvent(md);
    ok(ev.defaultPrevented && st.clickMark, '브라우저 오른쪽 메뉴는 막고, 진짜 마우스 오른쪽 누름도 명령이 된다');
    // ── 2. 적의 생각: 새 방식 vs 끈 것
    const OFF = Object.assign({}, base, { rake: false, swap: false, sepK: 0, crowdW: 0, hpW: 0, flagW: 0, stickW: 0, guardHp: -1, boardHp: 0, routChance: 0, navyFlee: -1, hurtClose: 1, pirateClose: 1 });
    async function trial(cfg) {
      G.BALANCE.navalAI = cfg; startBattle({ kind: 'navy', n: 4 }); const st2 = await ready();
      st2.ships.forEach(x => { if (x.side === 'me') { x.hp = x.maxHp = 2e5; } });   // 우리 배는 버틴다 — 적이 얼마나 잘 때리는지만 본다
      const me0 = st2.ships.filter(x => x.side === 'me').reduce((t, x) => t + x.hp, 0);
      let sepSum = 0, sepN = 0, tgtKinds = 0, tgtN = 0, swaps = 0, lastSwap = {};
      for (let i = 0; i < 600; i++) {
        BT.update(0.1);
        const en = st2.ships.filter(x => x.side === 'en' && x.alive);
        if (i % 10 === 0 && en.length > 1) {
          let mn = 1e9; for (let a = 0; a < en.length; a++) for (let c = a + 1; c < en.length; c++) mn = Math.min(mn, Math.hypot(en[a].x - en[c].x, en[a].y - en[c].y)); sepSum += mn; sepN++;
          tgtKinds += new Set(en.map(x => x.target && x.target.no)).size; tgtN++;
        }
        en.forEach(x => { if (x.swapSide && x.swapSide !== lastSwap[x.no]) swaps++; lastSwap[x.no] = x.swapSide; });
        if (st2.over) break;
      }
      const dmg = me0 - st2.ships.filter(x => x.side === 'me').reduce((t, x) => t + x.hp, 0);
      return { dmg: Math.round(dmg), sep: Math.round(sepSum / Math.max(1, sepN)), tg: +(tgtKinds / Math.max(1, tgtN)).toFixed(2), swaps };
    }
    const NEW = [], OLD = [];
    for (let k = 0; k < 3; k++) { NEW.push(await trial(base)); console.log('trial new ' + JSON.stringify(NEW[k])); OLD.push(await trial(OFF)); console.log('trial off ' + JSON.stringify(OLD[k])); }
    G.BALANCE.navalAI = base;
    const avg = (L, k) => L.reduce((t, x) => t + x[k], 0) / L.length;
    R.push('   새 방식: ' + JSON.stringify(NEW)); R.push('   끈 것  : ' + JSON.stringify(OLD));
    ok(avg(NEW, 'dmg') > avg(OLD, 'dmg'), '60초 동안 적이 준 피해 — 새 방식 ' + Math.round(avg(NEW, 'dmg')) + ' > 끈 것 ' + Math.round(avg(OLD, 'dmg')));
    ok(avg(NEW, 'sep') > avg(OLD, 'sep'), '적끼리 가장 가까운 거리 평균 — 새 방식 ' + Math.round(avg(NEW, 'sep')) + ' > 끈 것 ' + Math.round(avg(OLD, 'sep')) + ' (덜 뭉친다)');
    ok(avg(NEW, 'tg') >= avg(OLD, 'tg'), '적이 노리는 우리 배 가짓수 — 새 방식 ' + avg(NEW, 'tg').toFixed(2) + ' · 끈 것 ' + avg(OLD, 'tg').toFixed(2));
    ok(avg(NEW, 'swaps') > 0, '장전된 현측으로 돌아선 횟수 (판마다 평균 ' + avg(NEW, 'swaps').toFixed(1) + ')');
    // 백병전·도망
    startBattle({ kind: 'pirate', n: 3 }); st = await ready();
    const ef = st.enFlag; ef.alive = false; ef.sunk = true; ef.hp = 0;
    G.BALANCE.navalAI = Object.assign({}, base, { routChance: 1 });
    for (let i = 0; i < 5; i++) BT.update(1 / 10);
    ok(st.ships.filter(x => x.side === 'en' && x.alive).every(x => x.fleeing), '해적은 기함을 잃으면 달아난다 (routChance)');
    G.BALANCE.navalAI = base; BT.noRender = false;
    // 오른쪽 클릭 고리를 실제로 그려 본다 (한 장면)
    const st3 = BT.runtime(); const f3 = st3.ships.find(x => x.side === 'me' && x.alive);
    if (f3) { st3.sel = null; BT._onRight(f3.x + 120, f3.y); BT.update(0.05); ok(!!st3.clickMark, '오른쪽 클릭 자리에 고리를 그린다 (그리기 오류 없음)'); }
    return R;
  });
  console.log(out.join('\n')); console.log(errs.length ? errs.slice(0, 5).join('\n') : '콘솔 오류 0');
  } finally { await b.close(); }
})();
