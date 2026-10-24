/* 조선소 대포·선수상 늘리기 (tests/shipyard_gear_smoke.js) — node tests/shipyard_gear_smoke.js
   · 대포 10종: 세이커·캘버린·페리에·카논(1등급) + 청동 세이커·페드레로(2) · 롱 캘버린·청동 카논(3) · 중카논(4) · 캐로네이드(5)
   · 조선 기술이 모자라면 대포 목록에서 잠기고, 「기술 투자」로 올리면 풀린다 (지금 달린 대포는 줄이거나 뗄 수만 있다)
   · 선수상: 조선 기술 2~5등급에서만 깎는 16가지 · 발견에 딸려 오는 선수상 33가지 (js/data/figrelics.js)
   · 페드레로·캐로네이드는 갑판 선원을 더 쓰러뜨린다 (kill). 콘솔 오류 0 */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.city && G.Scenes.city.B.shipyard, null, { timeout: 90000 });
  const out = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state, RR = G.R, SH = G.Ships;

    // 1) 자료
    const ids = G.CANNONS.map(c => c.id + '/' + c.lv);
    ok(G.CANNONS.length === 10 && ids.join(' ') === 'saker/1 culverin/1 perrier/1 cannon/1 bsaker/2 lculverin/3 pedrero/2 bcannon/3 hcannon/4 carronade/5', '대포 10종: ' + G.CANNONS.map(c => c.name).join('·'));
    const shop = G.FIGUREHEADS.filter(f => !f.rare && !f.relic), hi = shop.filter(f => (f.lv || 1) > 1);
    ok(hi.length === 16 && [2, 3, 4, 5].every(lv => hi.filter(f => f.lv === lv).length === 4), '조선 기술 2~5등급 선수상 16가지 (등급마다 4): ' + hi.map(f => f.name + f.lv).join(' '));
    const rel = G.FIGUREHEADS.filter(f => f.relic);
    const NEW = ['narwhal', 'humpback', 'manatee', 'mermaid', 'kraken', 'leviathan', 'dolphin', 'sealion', 'sailfish', 'f_marlin', 'manta', 'walrus', 'eagle', 'tiger', 'peacock', 'hornbill', 'paradise', 'dragon', 'phoenix', 'phoenixw', 'folk_maori', 'folk_hawaii', 'folk_bajau', 'moai', 'trelleborg', 'byrsa', 'gadir', 'antikythera', 'flordelamar', 'mahabali', 'tanahlot', 'poompuhar', 'munmu'];
    const got = NEW.filter(d => rel.some(f => f.relic === d && G.DISC[d] && G.RELICS[d].some(r => r.id === f.id && r.kind === 'fig')));
    ok(got.length === 33, '발견에 딸려 오는 선수상 33가지 더 (모두 ' + rel.length + '가지): ' + got.length);
    ok(G.RELIC.r_narwhal && G.RELIC.r_narwhal.kind !== 'fig' && G.RELIC.r_narwhal2 && G.RELIC.r_narwhal2.kind === 'fig', '예전 유물 id는 그대로 (r_narwhal) · 새 선수상은 뒤에 번호 (r_narwhal2) — 옛 저장과 맞음');
    ok(rel.every(f => ['spd', 'hp', 'luck', 'storm', 'monster', 'morale', 'battle'].some(k => f[k] > 0)), '모든 유물 선수상에 덕이 하나 이상');

    // 2) 조선 기술 2등급 도시의 조선소
    const city = G.CITY_DATA.find(c => c && c.flags && c.flags.indexOf('S') >= 0 && SH.techBase(c) === 2 && !SH.techAmt(c)) || G.CITY_DATA.find(c => c && SH.techBase(c) === 2);
    R.push('   시험 도시: ' + city.name + ' (조선 기술 ' + SH.tech(city) + '등급)');
    const sh = RR.newShip('carrack', '산 가브리엘'); s.fleet.ships = [sh]; s.fleet.crew = G.SHIP.carrack.crew[1]; s.mates = [];
    sh.guns = { type: 'saker', n: 4 };
    s.player.gold = 500000;
    G.Game.go('city', { cityId: city.id }); await sleep(400);
    const Y = G.Scenes.city.B.shipyard;
    const choices = () => [...document.querySelectorAll('.choice')];
    const click = async (txt, dis) => { for (let k = 0; k < 40; k++) { const el = choices().find(x => x.textContent.indexOf(txt) >= 0 && (dis || !x.classList.contains('dis'))); if (el) { el.click(); await sleep(60); return true; } await sleep(50); } return false; };
    const closeAll = async () => { for (let k = 0; k < 8; k++) { const mb = [...document.querySelectorAll('.modal-back')].pop(); if (!mb) return; const x = mb.querySelector('.title .x'); if (x) x.click(); else (mb.querySelector('.dlg') || mb).click(); await sleep(80); } };
    const advance = async () => { for (let k = 0; k < 10; k++) { const d = [...document.querySelectorAll('.dlg')].pop(); if (!d || document.querySelector('.choice')) return; d.click(); await sleep(60); } };
    async function gunMenu() {
      const p = Y.refit(city);
      await click('산 가브리엘'); await click('대포');
      await sleep(120);
      const rows = choices().map(x => ({ t: x.textContent.replace(/\s+/g, ' '), dis: x.classList.contains('dis') }));
      const text = ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '';
      return { p, rows, text };
    }
    let m = await gunMenu();
    const lockedNames = m.rows.filter(r => r.dis).map(r => r.t.split(' ')[0]);
    ok(m.rows.length === 10 && lockedNames.length === 4, '2등급 조선소: 대포 10종 가운데 4종 잠김 — ' + lockedNames.join('·'));
    ok(/기술 투자/.test(m.text) && /캐로네이드포/.test(m.text), '잠긴 대포는 「기술 투자」로 풀린다고 알려 준다');
    ok(!m.rows.find(r => /페드레로/.test(r.t)).dis && m.rows.find(r => /중카논/.test(r.t)).dis, '페드레로포(2)는 열려 있고 중카논포(4)는 잠김');
    await closeAll(); await Promise.race([m.p.catch(() => {}), sleep(1500)]); await closeAll();

    // 3) 기술 투자로 5등급 → 모두 풀린다, 캐로네이드 6문
    ok(/캐로네이드포/.test(Y.gearAt(5)) && /용상/.test(Y.gearAt(5)), '5등급이 되면 새로 다는 것: ' + Y.gearAt(5));
    SH.techInvest(city, 70000);
    ok(SH.tech(city) === 5, '기술 투자 7만 닢 → 조선 기술 ' + SH.tech(city) + '등급');
    m = await gunMenu();
    ok(m.rows.length === 10 && m.rows.every(r => !r.dis), '5등급 조선소: 대포 10종 모두 고를 수 있다');
    await click('캐로네이드포');
    await sleep(150);
    const num = document.querySelector('.modal-back input[type=number], .modal-back input');
    if (num) { num.value = 6; num.dispatchEvent(new Event('input', { bubbles: true })); num.dispatchEvent(new Event('change', { bubbles: true })); }
    await sleep(80);
    const okBtn = [...document.querySelectorAll('.modal-back .btn')].find(x => /확인|결정|정한다/.test(x.textContent)) || [...document.querySelectorAll('.modal-back .btn')].pop();
    if (okBtn) okBtn.click(); await sleep(200); await advance();
    ok(sh.guns.type === 'carronade' && sh.guns.n === 6, '캐로네이드포 ' + sh.guns.n + '문을 달았다 (' + sh.guns.type + ')');
    await closeAll(); await Promise.race([m.p.catch(() => {}), sleep(1500)]); await closeAll();

    // 4) 기술이 낮은 조선소에서는 달린 캐로네이드를 줄이거나 뗄 수만
    const low = G.CITY_DATA.find(c => c && SH.tech(c) === 1 && c.flags && c.flags.indexOf('S') >= 0) || G.CITY_DATA.find(c => c && SH.tech(c) === 1);
    const city0 = city; G.Game.go('city', { cityId: low.id }); await sleep(300);
    const p4 = Y.refit(low); await click('산 가브리엘'); await click('대포'); await sleep(120);
    const car = choices().find(x => /캐로네이드/.test(x.textContent)), hc = choices().find(x => /중카논/.test(x.textContent));
    ok(car && !car.classList.contains('dis') && hc && hc.classList.contains('dis'), low.name + '(1등급): 지금 단 캐로네이드는 고를 수 있고(줄이기·떼기만) 중카논은 잠김');
    await closeAll(); await Promise.race([p4.catch(() => {}), sleep(1500)]); await closeAll();

    // 5) 선수상: 1등급 조선소는 기술 선수상이 없고, 5등급 조선소는 여러 철에 걸쳐 2~5등급 선수상이 나온다
    async function figRows(c) {
      const p = Y.refit(c); await click('산 가브리엘'); await click('선수상'); await sleep(120);
      const rows = choices().map(x => x.textContent.replace(/\s+/g, ' ')), text = ([...document.querySelectorAll('.modal-back')].pop() || {}).textContent || '';
      await closeAll(); await Promise.race([p.catch(() => {}), sleep(1500)]); await closeAll();
      return { rows, text };
    }
    const lowFig = await figRows(low);
    ok(!lowFig.rows.some(t => /기술 [2-5]/.test(t)) && /기술 투자/.test(lowFig.text), '1등급 조선소: 기술 선수상 없음, 「기술 투자」로 더 깎을 수 있다고 알려 줌');
    G.Game.go('city', { cityId: city0.id }); await sleep(300);
    const seen = new Set();
    for (let k = 0; k < 6; k++) { s.day += 60; const f = await figRows(city0); f.rows.forEach(t => { const h = hi.find(x => t.indexOf(x.name) === 0); if (h) seen.add(h.lv); }); }
    ok(seen.size >= 3, '5등급 조선소에서 여러 철에 걸쳐 나온 기술 선수상 등급: ' + [...seen].sort().join('·'));
    // 소지품의 발견 선수상을 달 수 있다
    RR.addItem('r_mermaid', { disc: 'mermaid', done: true });
    const pf = Y.refit(city0); await click('산 가브리엘'); await click('선수상'); await sleep(120);
    ok(await click('인어 선수상'), '소지품의 「인어 선수상」(발견 유물)이 선수상 목록에 나온다'); await advance();
    ok(sh.fig === 'r_mermaid' && RR.fleetBonus('luck') >= 0.07, '인어 선수상을 달았다 — 행운 +' + RR.fleetBonus('luck'));
    await closeAll(); await Promise.race([pf.catch(() => {}), sleep(1500)]); await closeAll();
    return R;
  });
  // 6) 해전: kill 배율이 포탄에 실려 선원 피해에 곱해진다
  const bsrc = fs.readFileSync(path.join(ROOT, 'js/scenes/battle.js'), 'utf8');
  out.push((/kill: c\.kill \|\| 1/.test(bsrc) && /\(k\.kill \|\| 1\)/.test(bsrc) ? '✓ ' : '✗ ') + '해전: 페드레로·캐로네이드의 kill 배율이 선원 피해에 곱해진다');
  console.log(out.join('\n')); console.log(errs.slice(0, 5).join('\n') || '✓ 콘솔 오류 없음'); await b.close();
  process.exitCode = out.some(x => x[0] === '✗') || errs.length ? 1 : 0;
})();
