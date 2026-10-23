/* 자택 보관함 · 발견 증거는 칸을 차지하지 않음 (js/core/rules.js R.slotsUsed·R.storage · js/city/misc.js HM.storage) — node tests/home_storage_smoke.js   (BROWSER_EXE=크롬 경로)
   · 소지품 40칸이 차도 발견 유물·해도 증거는 챙긴다 (칸을 차지하지 않음) → 보고·발표하면(활성화) 그때부터 칸을 차지한다
   · 자택 보관함에는 몇 개든 맡긴다 · 맡기면 칸이 빈다 · 장비 중인 무기를 맡기면 장비가 풀린다 · 증거는 맡기지 않는다 · 칸이 차 있으면 꺼내지 못한다
   · 저장·불러오기에 보관함이 남는다 · 자택 메뉴 「보관함」 창에서 「모두 맡긴다」 · 콘솔 오류 0 · 화면: /tmp/home_storage */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = '/tmp/home_storage';
fs.mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const R = G.R, out = {}, HM = G.Scenes.city.B.home;
      const s = G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const p = s.player; p.items = [{ id: 'rapier' }]; p.equip.weapon = 'rapier';
      const plain = G.ITEMS.filter(it => it.kind === 'gift' && !it.consumable).map(it => it.id);
      for (let i = 0; p.items.length < R.ITEM_MAX; i++) R.addItem(plain[i % plain.length], { name: '시험 물건 ' + i });
      out.full = [R.slotsUsed(), R.itemsFull(), R.addItem(plain[0])];
      // 발견 유물·해도 증거: 칸이 차도 챙긴다
      const discId = Object.keys(G.RELICS).find(id => G.RELICS[id].length && G.DISC[id]);
      const rl = G.RELICS[discId][0];
      out.relic = [R.addItem(rl.id, { disc: discId }), R.slotsUsed(), p.items.length];
      s.disc[discId] = { found: true, me: true, day: 1, relics: [rl.id] };
      // 발표하면 활성화 → 칸을 차지한다
      G.Disc.keepRelics(discId);
      out.after = [R.slotsUsed(), R.itemsFull(), R.addItem(plain[1])];
      // 보관함
      const rap = p.items.find(it => it.id === 'rapier');
      out.store = [HM.storeOne(rap), p.equip.weapon, R.storage().length];
      for (let i = 0; i < 5; i++) HM.storeOne(p.items.find(it => /시험 물건/.test(it.name || '')));
      out.store2 = [R.storage().length, R.slotsUsed()];
      // 증거는 맡기지 않는다
      const ev = { id: 'evidence', kind: 'evidence', evidence: true, name: '시험 해도', disc: 'capegood' }; p.items.push(ev);
      out.proofStore = HM.storeOne(ev);
      // 칸이 차 있으면 꺼내지 못한다
      var fillGuard = 0;
      while (!R.itemsFull() && fillGuard < R.ITEM_MAX + 5) {
        R.addItem(plain[2], { name: '꺼내기 시험 물건 ' + fillGuard });
        fillGuard++;
      }
      if (!R.itemsFull()) throw new Error('소지품 채우기 시험이 ' + fillGuard + '번 안에 끝나지 않음');
      out.takeFull = HM.takeOne(R.storage()[0]);
      HM.storeOne(p.items.find(it => /시험 물건/.test(it.name || '')));
      out.take = HM.takeOne(R.storage().find(x => x.id === 'rapier'));
      // 저장·불러오기
      const S2 = G.State.deserialize(G.State.serialize());
      out.saved = (S2.player.storage || []).length === R.storage().length;
      // 화면: 리스본 자택의 보관함
      p.home = 0; s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat };
      G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 1500));
      document.querySelectorAll('.modal-back').forEach(e => e.remove());
      out.menu = HM.menu(G.CITY_DATA[0]).filter(Boolean).map(m => m.label).join(',');
      HM.storage(G.CITY_DATA[0]);
      await new Promise(r => setTimeout(r, 400));
      out.rows = [document.querySelectorAll('.modal-back [data-st]').length, document.querySelectorAll('.modal-back [data-tk]').length];
      return out;
    });
    await page.screenshot({ path: path.join(OUT, '1_storage.png') });
    const r2 = await page.evaluate(async () => {
      const R = G.R, p = G.Game.state.player, b = document.querySelector('.modal-back [data-all]'), before = R.storage().length;
      b.click(); await new Promise(r => setTimeout(r, 200));
      return { moved: R.storage().length - before, left: p.items.filter(it => !R.isProof(it)).map(it => it.id + (p.equip.weapon === it.id ? '*' : '')).join(','), used: R.slotsUsed(), rows: document.querySelectorAll('.modal-back [data-st]').length };
    });
    await page.screenshot({ path: path.join(OUT, '2_all_stored.png') });
    console.log(JSON.stringify(r), JSON.stringify(r2));
    ok(r.full[0] === 40 && r.full[1] && r.full[2] === false, '소지품 40/40 — 더 받지 못한다');
    ok(r.relic[0] && r.relic[1] === 40 && r.relic[2] === 41, '칸이 차도 발견 유물은 챙기고, 칸을 차지하지 않는다 (40/40 · 실제 41개)');
    ok(r.after[0] === 41 && r.after[1] && r.after[2] === false, '발표하면 유물이 활성화되어 칸을 차지한다 (41/40 — 넘침, 새 물건을 받지 못함)');
    ok(r.store[0] && r.store[1] === null && r.store[2] === 1, '장비 중인 레이피어를 보관함에 맡기면 장비가 풀린다');
    ok(r.store2[0] === 6 && r.store2[1] === 35, '보관함에 맡긴 만큼 칸이 빈다 (보관함 ' + r.store2[0] + '점 · 소지품 ' + r.store2[1] + '/40)');
    ok(r.proofStore === false, '보고하지 않은 발견의 증거(해도)는 맡기지 않는다');
    ok(r.takeFull === false && r.take, '칸이 차 있으면 꺼내지 못하고, 자리가 나면 꺼낸다');
    ok(r.saved, '저장·불러오기에 보관함이 남는다');
    ok(/보관함/.test(r.menu) && r.rows[0] > 0 && r.rows[1] > 0, '자택 메뉴 「보관함」 — 창에 맡길 것 ' + r.rows[0] + '줄 · 꺼낼 것 ' + r.rows[1] + '줄');
    ok(r2.moved > 0 && r2.rows === 0 && r2.used === 0, '「모두 맡긴다」: ' + r2.moved + '점 맡김 · 남은 것 「' + r2.left + '」 (장비 중·증거만)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 화면: ' + OUT);
  } catch (e) { console.error('✗ ' + e.message + '\n' + errors.join('\n')); process.exitCode = 1; }
  await browser.close();
})();
