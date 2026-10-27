/* 해전 저장 회귀 시험: node tests/battle_save_smoke.js (BROWSER_EXE로 Chromium 경로 지정 가능) */
'use strict';
const fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts', 'battle-save');
const CHROME = [process.env.BROWSER_EXE, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p => p && fs.existsSync(p));
function ok(value, text) { if (!value) throw new Error(text); console.log('  ✓ ' + text); }

(async function () {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', e => errors.push(e.stack));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.addInitScript(() => {
    // 게임 시간만 직접 움직인다. 불러오기·그림 준비가 쓰는 프레임은 그대로 둔다.
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = fn => fn.name === 'loop' ? 0 : raf(fn);
  });
  fs.mkdirSync(OUT, { recursive: true });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    const saved = await page.evaluate(async () => {
      const s = G.Game.state = G.State.newGame({ name: '해전 저장 시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      s.settings.res = 0.35; s.fleet.ships = s.fleet.ships.slice(0, 1);
      s.fleet.ships[0].hp = 40; s.fleet.crew = 18;
      s.loc = { mode: 'sea', lon: -25, lat: 32, heading: 0 };
      await G.Game.ensureGeo();
      G.Game.go('battle', { npc: { kind: 'pirate', n: 3, K: 0 } });
      const st = G.Scenes.battle.runtime(), me = st.myFlag, en = st.enFlag;
      me.hp = 20; me.crew = 13; me.x = -321; me.y = 123; me.vel = [2, 3];
      me.target = en; en.target = me; me.board = en; me.crane = { T: en, th: 0.4, R: 200 };
      me.reload = [1, 2, 3]; me.moveTo = [100, 200]; st.sel = me;
      en.hp -= 7; en.crew -= 3;
      st.ships[2].alive = false; st.ships[2].sunk = true; st.ships[2].hp = 0;
      st.paused = true; st.retreat = true; st.t = 17;
      st.balls.push({ x: 0, y: 0, tx: me.x, ty: me.y, t: 0.2, dur: 2, hit: true, dmg: 1, kill: 1, target: me, from: en });
      const raw = JSON.parse(G.State.serialize());
      const result = await G.State.saveAsync('journal5');
      return { result, hp: raw.fleet.ships[0].hp, crew: raw.fleet.crew, liveHp: s.fleet.ships[0].hp, liveCrew: s.fleet.crew, battle: !!raw.battle, enemyHp: en.hp, enemyCrew: en.crew };
    });
    ok(saved.result.ok && saved.hp === 20 && saved.crew === 13 && saved.battle, '저장에 내구 20·선원 13명과 전장을 기록한다');
    ok(saved.liveHp === 40 && saved.liveCrew === 18, '저장 자체가 전투 종료 정산을 중복 실행하지 않는다');

    await page.reload();
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title');
    const resumed = await page.evaluate(async () => {
      G.Game.state = await G.State.loadAsync('journal5');
      await G.Game.resume();
      const s = G.Game.state, st = G.Scenes.battle.runtime(), me = st.myFlag, en = st.enFlag;
      const out = {
        scene: G.Game.sceneName, hp: me.hp, crew: me.crew, enemyHp: en.hp, enemyCrew: en.crew,
        position: [me.x, me.y], reload: me.reload, target: me.target === en && en.target === me,
        refs: me.board === en && me.crane.T === en && st.sel === me && st.balls[0].target === me && st.balls[0].from === en,
        source: me.src === s.fleet.ships[0], sunk: st.ships[2].sunk && !st.ships[2].alive,
        paused: st.paused, retreat: st.retreat, time: st.t, battles: s.stats.battles,
        repeat: G.State.deserialize(G.State.serialize()).battle.ships[0].hp
      };
      G.Scenes.battle.update(1 / 30);
      return out;
    });
    ok(resumed.scene === 'battle' && resumed.hp === 20 && resumed.crew === 13, '불러오면 피해를 유지한 채 같은 해전으로 돌아온다');
    ok(resumed.enemyHp === saved.enemyHp && resumed.enemyCrew === saved.enemyCrew && resumed.sunk, '적 피해와 침몰한 배도 그대로 복원한다');
    ok(resumed.position.join() === '-321,123' && resumed.reload.join() === '1,2,3' && resumed.target && resumed.refs && resumed.source, '위치·장전·공격 목표·포탄·원본 배 연결을 복원한다');
    ok(resumed.paused && resumed.retreat && resumed.time === 17 && resumed.battles === 1 && resumed.repeat === 20, '정지·퇴각·경과 시간을 유지하고 재저장해도 전투 횟수가 늘지 않는다');
    await page.screenshot({ path: path.join(OUT, 'resumed.png') });

    const downloadEvent = page.waitForEvent('download');
    ok(await page.evaluate(() => !!G.State.exportNow()), '현재 해전을 파일로 내보낸다');
    const download = await downloadEvent, file = path.join(OUT, download.suggestedFilename());
    await download.saveAs(file);
    const chooserEvent = page.waitForEvent('filechooser');
    await page.evaluate(() => { window.__importBattle = G.State.importFile(); });
    await (await chooserEvent).setFiles(file);
    const imported = await page.evaluate(async () => {
      const imported = await window.__importBattle;
      G.Game.state = imported.state; await G.Game.resume();
      const st = G.Scenes.battle.runtime();
      return G.Game.sceneName === 'battle' && st.myFlag.hp === 20 && st.myFlag.crew === 13 && st.myFlag.target === st.enFlag;
    });
    ok(imported, '내보낸 파일을 실제 파일 선택으로 불러와도 해전을 이어간다');

    const guarded = await page.evaluate(async () => {
      const st = G.Scenes.battle.runtime(), before = G.State.meta('journal5').t;
      const out = [];
      for (const key of ['busy', 'over']) {
        st[key] = key === 'busy' ? 1 : true;
        const result = await G.State.saveAsync('journal5');
        out.push(!result.ok && !G.State.save('journal5') && !G.State.autoSaveNow() && G.State.midEvent() && !G.State.exportNow());
        st[key] = key === 'busy' ? 0 : false;
      }
      return out.every(Boolean) && G.State.meta('journal5').t === before;
    });
    ok(guarded, '백병전·결과 처리 중에는 자동·수동·파일 저장을 미루고 기존 일지를 지킨다');

    const projectile = await page.evaluate(() => {
      const B = G.Scenes.battle, st = B.runtime();
      st.paused = false; st.retreat = false; st.hitstop = 0;
      st.ships.forEach(b => { b.guns.n = 0; b.target = null; b.board = null; b.crane = null; b.moveTo = null; b.halt = true; });
      for (let i = 0; i < 45; i++) B.update(0.05);
      return st.myFlag.hp < 20 && st.myFlag.crew <= 13 && st.balls.length === 0;
    });
    ok(projectile, '불러오기 전에 발사된 포탄도 재개 후 실제 피해를 준다');

    const settlement = await page.evaluate(async () => {
      // 실제 자동 저장 경로와 재개 뒤 추가 피해, 침몰선 제거, 정산까지 확인한다.
      const s = G.Game.state;
      G.Game.go('sea', { resume: true });
      s.fleet.ships.push(G.U.clone(s.fleet.ships[0])); s.fleet.crew = 36;
      G.Game.go('battle', { npc: { kind: 'pirate', n: 1, K: 0 } });
      let st = G.Scenes.battle.runtime();
      st.myFlag.hp = 20; st.myFlag.crew = 13;
      st.ships[1].hp = 0; st.ships[1].crew = 0; st.ships[1].alive = false; st.ships[1].sunk = true;
      if (!G.State.autoSaveNow()) return false;
      G.Game.state = await G.State.loadAsync(G.State.latestAutoSlot()); await G.Game.resume();
      st = G.Scenes.battle.runtime(); st.myFlag.hp = 19; st.myFlag.crew = 12; st.over = true;
      const alert = G.UI.alert, fade = G.UI.fade;
      G.UI.alert = async () => {}; G.UI.fade = fn => fn();
      try { await G.Scenes.battle._t().finish('retreat'); }
      finally { G.UI.alert = alert; G.UI.fade = fade; }
      const back = G.State.deserialize(G.State.serialize());
      return G.Game.sceneName === 'sea' && back.fleet.ships.length === 1 && back.fleet.ships[0].hp === 19 && back.fleet.crew === 12 && !back.battle;
    });
    ok(settlement, '자동 저장에서 재개한 뒤 추가 피해와 침몰선 제거를 한 번만 정산한다');

    const special = await page.evaluate(async () => {
      const s = G.Game.state, originalHp = s.fleet.ships[0].hp;
      s.fleet.crew = 300;
      G.Game.go('battle', { npc: { kind: 'navy', n: 2, myFleet: [{ type: 'pinnace', name: '빌린 배' }], allies: [{ type: 'caravel', name: '우군' }], myGun: 'culverin', backCity: 0 } });
      let st = G.Scenes.battle.runtime(); st.myFlag.hp = 10; st.myFlag.crew = 7;
      const expectedCrew = st.spare + 7, allyCrew = st.ships.find(b => b.ally).crew;
      G.Game.state = G.State.deserialize(G.State.serialize()); await G.Game.resume();
      st = G.Scenes.battle.runtime();
      const lent = st.myFlag.src !== G.Game.state.fleet.ships[0] && st.myFlag.src.lent;
      const first = lent && st.myFlag.hp === 10 && st.myFlag.crew === 7 && G.Game.state.fleet.crew === expectedCrew && G.Game.state.fleet.ships[0].hp === originalHp && st.ships.find(b => b.ally).crew === allyCrew && st.npc.backCity === 0;
      G.Game.go('sea', { resume: true });
      const current = G.Game.state;
      const ship = G.U.clone(current.fleet.ships[0]); ship.crew = 9;
      current.escort = { now: { ship } };
      G.Game.go('battle', { npc: { kind: 'pirate', n: 1, K: 0 } });
      st = G.Scenes.battle.runtime(); st.ships.find(b => b.escort).hp = 8;
      G.Game.state = G.State.deserialize(G.State.serialize()); await G.Game.resume();
      const escort = G.Scenes.battle.runtime().ships.find(b => b.escort);
      return first && escort.hp === 8 && escort.crew === 9 && escort.src === G.Escort.ship();
    });
    ok(special, '빌린 배·대기 선원·우군·호위선도 구분해서 복원한다');

    const legacy = await page.evaluate(async () => {
      const s = G.Game.state;
      G.Game.go('sea', { resume: true }); delete s.escort;
      const raw = JSON.parse(G.State.serialize()); delete raw.battle;
      G.Game.state = G.State.deserialize(JSON.stringify(raw)); await G.Game.resume();
      const sea = G.Game.sceneName === 'sea';
      raw.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat };
      G.Game.state = G.State.deserialize(JSON.stringify(raw)); await G.Game.resume();
      return sea && G.Game.sceneName === 'city';
    });
    ok(legacy, '전장 정보가 없는 옛 항해·도시 저장도 기존대로 불러온다');
    ok(!errors.length, '브라우저 pageerror·console.error 0: ' + errors.join('\n'));
  } catch (e) {
    console.error(e.stack); if (errors.length) console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
