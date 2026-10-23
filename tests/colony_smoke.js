/* 개척 도시 (js/systems/colony.js): 명성 200,000 → 국왕의 부름 → 세울 곳 고르기 → 개척지 입항 · 이름 짓기 → 물자 3번 → 총독 → 가족 → 명성 400,000 두 번째
   그림(스크린샷)은 OUT 폴더에. node tests/colony_smoke.js  (BROWSER_EXE=크로미움 경로 · PAGE=다른 html · OUT=스크린샷 폴더) */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGE = process.env.PAGE ? (/^http/.test(process.env.PAGE) ? process.env.PAGE : pathToFileURL(path.resolve(process.env.PAGE)).href) : pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = process.env.OUT || path.join(ROOT, 'tmp', 'colony_shots');
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
let shotN = 0;
async function shot(page, name) { shotN++; const f = path.join(OUT, String(shotN).padStart(2, '0') + '_' + name + '.png'); await page.screenshot({ path: f }); return f; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  if (process.env.FONTS !== 'keep') await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|_blob/.test(m.text())) errors.push(m.text()); });
  // 열린 말·물음을 넘긴다 (fn이 있으면 물음마다 고를 값을 정한다)
  async function drain(max, pickFn, stopFn) {
    for (let i = 0; i < (max || 40); i++) {
      await page.waitForTimeout(250);
      if (stopFn && await stopFn()) return;
      const st = await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back')].pop(); if (!b) return null; return { ask: !!b.querySelector('.askrow'), win: !!b.querySelector('.win'), text: (b.innerText || '').slice(0, 160), btns: [...b.querySelectorAll('.askrow button')].map(x => x.innerText) }; });
      if (!st) { const busy = await page.evaluate(() => G.Scenes.city.isBusy && G.Scenes.city.isBusy()); if (!busy) return; continue; }
      if (pickFn) { const r = await pickFn(st); if (r === 'handled') continue; }
      if (st.ask) await page.evaluate(() => { const bs = [...document.querySelectorAll('.modal-back')].pop().querySelectorAll('.askrow button'); bs[0].click(); });
      else if (st.win) await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-back')].pop(); const bt = b.querySelectorAll('.foot button'); if (bt.length) bt[bt.length - 1].click(); else { const x = b.querySelector('.title .x, .x, button'); if (x) x.click(); else b.click(); } });
      else await page.keyboard.press('Enter');
    }
  }
  async function waitCity() { for (let i = 0; i < 80; i++) { const r = await page.evaluate(() => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy() && !document.querySelector('.modal-back') && !!document.querySelector('.cmdmenu')); if (r) return true; await drain(3); await page.waitForTimeout(200); } return false; }
  try {
    await page.goto(PAGE);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '디오구 페헤이라', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.prologueDone = true; s.date = { y: 1525, m: 3, d: 1 }; s.player.gold = 100000;
      s.visited = s.visited || {}; [150, 154, 172, 100].forEach(id => { s.visited[id] = 1; if (s.known.indexOf(id) < 0) s.known.push(id); });   // 고아·코친·암보이나·르완다에 들렀다
      if (G.SEA_RISK) { G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; }
    });
    // ---- ① 명성 200,000 → 국왕의 부름
    const call = await page.evaluate(() => {
      const s = G.Game.state; s.player.fame = 199000; const a = G.Colony.daily().length;
      s.player.fame = 200500; const m = G.Colony.daily();
      return { before: a, news: m.map(x => x.text), call: s.colony && s.colony.call };
    });
    ok(call.before === 0 && call.news.length === 1 && call.call && call.call.sp, '명성 200,000 → 국왕의 부름: 「' + (call.news[0] || '').slice(0, 60) + '…」');
    // ---- ② 리스본 왕궁 알현 → 세울 곳 고르기
    await page.evaluate(() => { G.Game.go('city', { cityId: 0 }); });
    await waitCity();
    const todo = await page.evaluate(() => [...document.querySelectorAll('.todo .tr')].map(e => e.innerText));
    ok(todo.some(t => /새 도시/.test(t)), '리스본 「이 도시에서 할 일」: ' + todo.find(t => /새 도시/.test(t)));
    await page.evaluate(() => { const sp = G.SPONSOR[G.Game.state.colony.call.sp]; G.Scenes.city.visit('palace', G.R.bldArg(sp)); });
    let picked = false;
    await drain(160, async st => {
      if (st.ask && st.btns.some(b => /세울 곳을 고른다/.test(b))) { await shot(page, 'king_ask'); await page.evaluate(() => { const b = [...[...document.querySelectorAll('.modal-back')].pop().querySelectorAll('.askrow button')].find(x => /세울 곳/.test(x.innerText)); b.click(); }); return 'handled'; }
      if (st.win && /새 도시를 세울 곳/.test(st.text) && !picked) {
        await page.waitForTimeout(600); await shot(page, 'site_pick');
        picked = await page.evaluate(() => { const it = [...document.querySelectorAll('.cp-item')].find(x => /봄베이/.test(x.innerText)); it.click(); return [...document.querySelectorAll('.cp-item')].map(x => x.innerText.replace(/\s+/g, ' ') + (x.classList.contains('dis') ? ' [X]' : '')); });
        await page.waitForTimeout(300); await shot(page, 'site_pick_bombay');
        await page.evaluate(() => { [...document.querySelectorAll('.modal-back .foot button')].find(x => /이곳에/.test(x.innerText)).click(); });
        return 'handled';
      }
      return null;
    });
    console.log('    후보:', JSON.stringify(picked));
    const plant = await page.evaluate(() => { const s = G.Game.state, e = s.colony.list[0], c = G.CITY_DATA[e.id]; return { e, name: c.name, known: s.known.indexOf(e.id) >= 0, call: s.colony.call, fac: G.R.facilities(c), gold: s.player.gold }; });
    ok(plant.e.key === 'bombay' && plant.e.stage === 0 && plant.known && !plant.call && /개척지/.test(plant.name), '봄베이를 골랐다 → 해도에 「' + plant.name + '」 (항구만) · 개척 자금 → 소지금 ' + plant.gold);
    const far = await page.evaluate(() => G.Colony.reach({ key: 'x', lon: -30, lat: -45 }));
    ok(picked && picked.some(t => /봄베이/.test(t) && !/\[X\]/.test(t)) && !!far, '후보 ' + picked.length + '곳 (막힌 곳 ' + picked.filter(t => /\[X\]/.test(t)).length + ') · 아무도 닿지 않은 바다는 고를 수 없다: 「' + far + '」');
    await waitCity();
    // ---- ③ 개척지에 입항 → 이름 짓기 → 도시가 선다
    const cid = plant.e.id;
    await page.evaluate(id => { const s = G.Game.state, c = G.CITY_DATA[id]; s.loc = { mode: 'sea', lon: c.dock[1], lat: c.dock[0], heading: 0 }; G.Game.go('city', { cityId: id, arrive: true }); }, cid);
    let named = false, bannerShot = false;
    await drain(60, async st => {
      if (st.win && /이름을 지어/.test(st.text) && !named) {
        await shot(page, 'name_prompt');
        await page.evaluate(() => { const i = document.querySelector('.modal-back .win input'); i.value = '노바 리스보아'; [...document.querySelectorAll('.modal-back .foot button')].find(x => /결정/.test(x.innerText)).click(); });
        named = true; return 'handled';
      }
      return null;
    }, () => named && page.evaluate(() => !!document.querySelector('.colony-banner')));
    // 금빛 글귀(그림)가 떠 있는 동안 찍는다
    for (let i = 0; i < 40 && !bannerShot; i++) { const b = await page.evaluate(() => !!document.querySelector('.colony-banner')); if (b) { await page.waitForTimeout(700); await shot(page, 'founded_banner'); await page.waitForTimeout(1600); await shot(page, 'founded_banner2'); bannerShot = true; } else { await drain(2); await page.waitForTimeout(150); } }
    await drain(40);
    await waitCity();
    await page.waitForTimeout(800);
    await shot(page, 'colony_stage1');
    const f1 = await page.evaluate(id => { const s = G.Game.state, e = s.colony.list[0], c = G.CITY_DATA[id]; return { name: c.name, stage: e.stage, need: e.need, blds: G.Scenes.city.buildings(c).map(b => b.name), town: G.Town.active(), items: G.Town.active() ? G.Town.item('tavern') != null : null, log: s.log.slice(-4).map(l => l.t || l.text || l) }; }, cid);
    ok(named && f1.name === '노바 리스보아' && f1.stage === 1, '이름 짓기 → 「' + f1.name + '」 1단계');
    ok(bannerShot, '도시를 세우는 순간: 금빛 글귀와 함께 새 거리 (그림)');
    ok(f1.blds.join(',') === '항구,교역소,술집,식당,여관,성문', '1단계 건물: ' + f1.blds.join(' · '));   // 식당은 개척 도시 1단계에도 선다 (js/systems/colony.js CO.buildings · QA 2026-10-23)
    ok(f1.need && /wheat|timber/.test(f1.need.good) && f1.need.qty === 40, '첫 물자의 청: ' + JSON.stringify(f1.need));
    // ---- ④ 물자 3번 → 2·3·4단계
    for (let k = 1; k <= 3; k++) {
      const need = await page.evaluate(() => { const s = G.Game.state, e = s.colony.list[0]; if (!e.need) { s.day = e.nextDay; G.Colony.daily(); } return e.need; });
      await page.evaluate(n => { const s = G.Game.state; s.fleet.ships.forEach(sh => { sh.cap = 400; }); s.fleet.cargo[n.good] = { q: n.qty + 5, cost: 10 }; }, need);
      await page.evaluate(() => { G.Scenes.city.visit('harbor'); });
      await drain(10);
      for (let i = 0; i < 30 && !(await page.evaluate(() => !!document.querySelector('.cmdmenu .cmd.exit'))); i++) { await drain(2); await page.waitForTimeout(200); }
      await page.evaluate(() => { const it = [...document.querySelectorAll('.cmdmenu .cmd')].find(x => /개척 물자/.test(x.innerText)); it.click(); });
      let bs = false;
      for (let i = 0; i < 60; i++) {
        const b = await page.evaluate(() => !!document.querySelector('.colony-banner'));
        if (b && !bs) { await page.waitForTimeout(1500); await shot(page, 'stage' + (k + 1) + '_banner'); bs = true; }
        if (bs && !b) break;
        const m = await page.evaluate(() => !!document.querySelector('.modal-back'));
        if (m) { const isConfirm = await page.evaluate(() => /넘깁니까/.test(([...document.querySelectorAll('.modal-back')].pop() || {}).innerText || '')); if (isConfirm) await page.evaluate(() => { [...document.querySelectorAll('.modal-back .foot button')].find(x => /넘긴다/.test(x.innerText)).click(); }); else await drain(2); }
        await page.waitForTimeout(250);
      }
      await drain(20); await waitCity(); await page.waitForTimeout(600);
      await shot(page, 'colony_stage' + (k + 1));
      const r = await page.evaluate(id => { const s = G.Game.state, e = s.colony.list[0]; return { stage: e.stage, blds: G.Scenes.city.buildings(G.CITY_DATA[id]).map(b => b.name), cargo: s.fleet.cargo[Object.keys(s.fleet.cargo)[0]], nextDay: e.nextDay, size: G.CITY_DATA[id].size }; }, cid);
      ok(r.stage === k + 1 && bs, '물자 ' + k + '번째 (' + need.qty + '통 ' + need.good + ') → ' + (k + 1) + '단계: ' + r.blds.join(' · '));
    }
    // ---- ⑤ 총독부 → 총독 · 가족을 관저로
    await page.evaluate(() => { const p = G.Game.state.player; p.wife = 'm_ines'; p.kids = [{ name: '주앙', sex: 'm', born: { y: 1515, m: 3, d: 3 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {} }]; });
    await page.evaluate(() => { G.Scenes.city.visit('govhall'); });
    let govShot = false;
    await drain(30, async st => {
      if (st.ask && st.btns.some(b => /총독이 된다/.test(b))) { await shot(page, 'gov_ask'); await page.evaluate(() => { [...[...document.querySelectorAll('.modal-back')].pop().querySelectorAll('.askrow button')].find(x => /총독이 된다/.test(x.innerText)).click(); }); return 'handled'; }
      return null;
    }, () => page.evaluate(() => !!document.querySelector('.colony-banner')));
    for (let i = 0; i < 30 && !govShot; i++) { if (await page.evaluate(() => !!document.querySelector('.colony-banner'))) { await page.waitForTimeout(600); await shot(page, 'governor_banner'); govShot = true; } else { await drain(2); await page.waitForTimeout(150); } }
    await drain(20);
    for (let i = 0; i < 30 && !(await page.evaluate(() => !!document.querySelector('.cmdmenu .cmd.exit'))); i++) { await drain(2); await page.waitForTimeout(200); }
    await shot(page, 'govhall_menu');
    ok(govShot, '총독 취임의 금빛 글귀 (그림)');
    const g1 = await page.evaluate(() => ({ title: G.Colony.title(), hud: (document.querySelector('.hud') || {}).innerText, items: [...document.querySelectorAll('.cmdmenu .cmd')].map(x => x.innerText.replace(/\s+/g, ' ')) }));
    ok(/노바 리스보아 총독/.test(g1.title) && /총독/.test(g1.hud), '총독에 올랐다 — 윗줄 직위: 「' + g1.title + '」');
    await page.evaluate(() => { [...document.querySelectorAll('.cmdmenu .cmd')].find(x => /가족을 총독 관저로/.test(x.innerText)).click(); });
    await drain(10, async st => { if (st.win && /모시겠습니까/.test(st.text)) { await page.evaluate(() => { [...document.querySelectorAll('.modal-back .foot button')].find(x => /모신다/.test(x.innerText)).click(); }); return 'handled'; } return null; });
    await drain(10);
    await page.evaluate(() => { const C = G.Scenes.city; if (C.current()) C.run(() => C.leave()); });
    await waitCity(); await page.waitForTimeout(800);
    await shot(page, 'colony_with_residence');
    const fam = await page.evaluate(id => ({ seat: G.R.seat(), blds: G.Scenes.city.buildings(G.CITY_DATA[id]).map(b => b.name), lisbon: G.Scenes.city.buildings(G.CITY_DATA[0]).map(b => b.name).filter(n => /자택/.test(n)), atHome: G.Family.atHome() }), cid);
    ok(fam.seat === cid && fam.blds.indexOf('총독 관저') >= 0 && !fam.lisbon.length && fam.atHome, '가족이 총독 관저로 — 개척 도시에 「총독 관저」, 리스본 자택은 비었다');
    await page.evaluate(() => { G.Scenes.city.visit('home'); });
    await drain(20); await page.waitForTimeout(500);
    for (let i = 0; i < 30 && !(await page.evaluate(() => !!document.querySelector('.cmdmenu .cmd.exit'))); i++) { await drain(2); await page.waitForTimeout(200); }
    await shot(page, 'residence_inside');
    const home = await page.evaluate(() => ({ plaque: (document.querySelector('.bld-plaque .nm') || {}).textContent, items: [...document.querySelectorAll('.cmdmenu .cmd')].map(x => x.innerText.split('\n')[0]) }));
    ok(home.plaque === '총독 관저' && home.items.some(t => /가족/.test(t)), '총독 관저 = 자택처럼 (' + home.items.join(' · ') + ')');
    await page.evaluate(() => { const C = G.Scenes.city; if (C.current()) C.run(() => C.leave()); });
    await waitCity();
    // ---- ⑥ 일지에 적고 다시 연다 (개척 도시가 남아 있어야 한다)
    const sv = await page.evaluate(async id => {
      const raw = G.State.serialize(); G.Colony.apply.call(null); // 그대로
      // 새 게임을 하면 개척 도시는 사라진다
      G.State.newGame({ name: '시험', nation: 'ES', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const gone = !G.CITY_DATA[id];
      G.Game.state = G.State.deserialize(raw); G.Game.resume();
      await new Promise(r => setTimeout(r, 3000));
      const back = G.CITY_DATA[id] && G.CITY_DATA[id].name;
      return { gone, back, scene: G.Game.sceneName, city: G.Game.state.loc.city, seat: G.R.seat() };
    }, cid);
    ok(sv.gone && sv.back === '노바 리스보아' && sv.city === cid && sv.seat === cid, '일지: 새 게임에는 없고, 다시 열면 「' + sv.back + '」에서 이어진다');
    await drain(20); await waitCity();
    // ---- ⑦ 명성 400,000 → 두 번째 부름
    const two = await page.evaluate(() => { const s = G.Game.state; s.player.fame = 399000; const a = G.Colony.daily().filter(m => /궁정|찾으신다/.test(m.text)).length; s.player.fame = 400100; const b = G.Colony.daily().filter(m => /찾으신다/.test(m.text)); return { a, b: b.map(m => m.text), call: !!s.colony.call }; });
    ok(two.a === 0 && two.b.length === 1 && two.call, '명성 400,000 → 두 번째 부름: 「' + two.b[0].slice(0, 50) + '…」');
    // 수첩: 계약·의뢰 탭에 개척 도시
    await page.evaluate(() => { G.Info.open('contract'); }); await page.waitForTimeout(900);
    await shot(page, 'notebook_colony');
    const nb = await page.evaluate(() => (document.querySelector('.modal-back .win .content') || {}).innerText || '');
    ok(/개척 도시/.test(nb) && /노바 리스보아/.test(nb), '수첩 「계약·의뢰」에 개척 도시 현황');
    await drain(3);
    // 이 도시의 건물을 한 번씩 (오류가 없어야)
    const kinds = await page.evaluate(id => G.Scenes.city.buildings(G.CITY_DATA[id]).map(b => b.kind).filter(k => k !== 'gate'), cid);
    for (const k of kinds) {
      await page.evaluate(k => { const C = G.Scenes.city; if (C.current()) C.run(() => C.leave()); setTimeout(() => C.visit(k), 300); }, k);
      await page.waitForTimeout(600); await drain(15);
      for (let i = 0; i < 20 && !(await page.evaluate(() => !!document.querySelector('.cmdmenu .cmd.exit'))); i++) { await drain(2); await page.waitForTimeout(200); }
      if (k === 'inspector' || k === 'trade' || k === 'tavern') await shot(page, 'bld_' + k);
    }
    // 세월이 흘러도(개척 도시가 있는 채) 오류가 없다
    const yr = await page.evaluate(() => { const C = G.Scenes.city; if (C.current()) C.leave(); let n = 0; for (let i = 0; i < 12; i++) n += G.Game.passDays(30).length; return n; });
    ok(yr >= 0, '개척 도시가 있는 채 1년 (소식 ' + yr + '건)');
    await page.waitForTimeout(500);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 4).join(' | '));
    console.log('    스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
