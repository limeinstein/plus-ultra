/* 중국 항해사 24명의 등장 주기, 술집 고용, 옛 저장과 새 저장을 실제 게임에서 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(root, 'index.html')).href), {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    const report = await page.evaluate(async () => {
      function check(ok, message) { if (!ok) throw Error(message); }
      let s = G.Game.state = G.State.newGame({name: '명단 시험', nation: 'PT', job: 'explorer', age: 25, birth: {m: 1, d: 1},
        st: {str: 65, int: 65, mar: 65, cha: 65}, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal'});
      s.settings.res = 0.35; s.seed = 67271; s.player.fame = 10000; s.player.gold = 500000; s.flags.prologue = true;
      const tavern = G.Scenes.city.B.tavern, crew = G.MATES.filter(m => m.chinaRotation);
      const ids = crew.map(m => m.id);
      const selection = y => crew.filter(m => G.Frontier.mateReady(m, y)).map(m => m.id).join(',');
      function candidates() {
        const loc = G.MateMove.locs(), cities = new Set(ids.map(id => loc[id]).filter(id => id != null));
        return [...cities].flatMap(id => tavern.candidates(G.CITY_DATA[id]).filter(m => m.chinaRotation).map(m => m.id)).sort();
      }
      check(crew.length === 24 && new Set(ids).size === 24 && new Set(crew.map(m => m.name)).size === 24, '24명의 고유 인물');
      for (const m of crew) {
        check(G.MATE[m.id] === m && !G.MatePower.why(m), '고용 후보 ' + m.name);
        check(G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(m.id))) === m.face &&
          G.Img.pick(G.Img.chain.mateHalf(m.id)) === m.face + '_half', '전용 초상 ' + m.name);
      }
      check(new Set(crew.map(m => m.face)).size === 24, '고유 초상');
      const borrowed = G.Wander.facePool('cn', 'm', 'nav', 'CN');
      check(borrowed.length && !borrowed.some(key => crew.some(m => m.face === key)), '일반 철새 얼굴 분리');
      s.date.y = 1489;
      s.mateLoc = { cnvet_lu_zhen: 175 };
      check(!selection(1489) && candidates().length === 0 && !G.MateMove.where('cnvet_lu_zhen'), '1489년과 옛 항구 자리');
      const cycles = [];
      for (let epoch = 1490; epoch <= 1670; epoch += 60) {
        const decades = [];
        for (let y = epoch; y < epoch + 60; y += 10) {
          s.date.y = y;
          const batch = selection(y).split(',');
          check(batch.length === 4 && selection(y + 9) === batch.join(','), y + '년의 10년 고정 명단');
          check(candidates().join(',') === batch.slice().sort().join(','), y + '년 술집 명단');
          decades.push(batch.join(','));
        }
        check(new Set(decades.join(',').split(',')).size === 24, epoch + '년부터 한 번씩 등장');
        cycles.push(decades.join('|'));
      }
      check(new Set(cycles).size === cycles.length, '1550년 이후 주기별 재추첨');
      s.date.y = 1490;
      const first = selection(1490), m = G.MATE[first.split(',')[0]], c = G.MateMove.where(m.id);
      const other = crew.find(d => !G.Frontier.mateReady(d));
      check(tavern._mateCard(m, c).textContent.includes('1490~1499년'), '술집 카드의 실제 기간');
      G.UI.confirm = async () => true; G.UI.say = async () => {}; G.UI.window = () => ({result: Promise.resolve(1)});
      check(!await tavern.hireMate(c, other), '명단 밖 직접 고용 차단');
      check(await tavern.hireMate(c, m) && !candidates().includes(m.id), '고용 뒤 중복 등장 차단');
      const kept = s.mates.find(x => x.id === m.id);
      s.date.y = 1500;
      check(kept && !G.Frontier.mateReady(m) && candidates().length === 4, '다음 10년에 동료는 남고 새 네 명 등장');
      s.mateDismiss = {[m.id]: {available: true}};
      s.mates = s.mates.filter(x => x.id !== m.id);
      check(!G.MateDismiss.returning(m.id) && !G.MateMove.where(m.id), '쉬는 시기의 해고 동료');
      s.date.y = 1499;
      check(G.MateDismiss.returning(m.id) && candidates().includes(m.id), '해당 기간 재고용 가능');
      s.mates.push(kept); delete s.mateDismiss[m.id];
      const legacy = {id: 'wd_test_legacy', wd: true, type: 'nav', g: 'm', style: 'cn', nat: 'CN', face: crew[0].face};
      s.mates.push({id: legacy.id});
      G.Wander.fixPortrait(legacy);
      check(legacy.face === crew[0].face && legacy.halfKey === legacy.face + '_half', '고용된 옛 철새 초상 보존');
      s.mates.pop();
      G.Wander.fixPortrait(legacy);
      check(borrowed.includes(legacy.face), '일반 후보의 옛 공용 초상 교체');
      const saved = await G.State.saveAsync(1);
      check(saved.ok, '저장 성공');
      s.seed = 17409;
      check(selection(1490) !== first, '서로 다른 게임의 추첨');
      s = G.Game.state = await G.State.loadAsync(1);
      check(selection(1490) === first && s.mates.some(x => x.id === m.id) && !candidates().includes(m.id), '저장 복원과 고용 상태');
      return cycles.length + '주기, 24개 연대, 24명 초상, 술집 고용 및 저장 복원';
    });
    await page.goto(((process.env.WEB_BASE && new URL('catalog.html',process.env.WEB_BASE).href) || pathToFileURL(path.join(root, 'catalog.html')).href), {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.G && G.ChinaCrew && document.readyState === 'complete', null, {timeout: 90000});
    assert.deepEqual(errors, []);
    console.log('통과 — ' + report + ', 게임·도감 콘솔 오류 0건');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
