/* 아즈텍 제국의 멸망 — 실제 장면: 「퇴각 판」 육상전(G.Games.landWar hold)과 호수의 큰 해전(빌린 브리건틴·막힘 없는 물·끝나면 그 도시로). */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Aztec && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    // ---------------- 퇴각 판: 방어만 하며 두 차례 버티면 빠져나간다
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'ES', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0;
      s.date = { y: 1520, m: 6, d: 30 }; s.loc = { mode: 'city', city: 200, lon: G.CITY_DATA[200].lon, lat: G.CITY_DATA[200].lat };
      window.__lw = G.Games.landWar({ enemy: { name: '둑길의 메시카 전사들', kind: 'native', n: 30, leader: '쿠이틀라우아크' }, party: 60, terr: 'grass', guns: false, hold: 2, flee: false });
      window.__lw.then(r => { window.__lwRes = r; });
    });
    await page.waitForSelector('.lwar .lw-btns button', { timeout: 20000 });
    const formText = await page.evaluate(() => document.querySelector('.lwar .lw-log').textContent);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.lwar .lw-btns button')].filter(x => /전투 개시|시작/.test(x.textContent))[0]; if (b) b.click(); });
    for (let i = 0; i < 6; i++) {
      const done = await page.evaluate(() => !!window.__lwRes || !!document.querySelector('.lwar .lw-btns button.navy:not(.disabled)') && /확인/.test(document.querySelector('.lwar .lw-btns').textContent));
      if (done) break;
      await page.evaluate(() => { const b = [...document.querySelectorAll('.lwar .lw-btns button')].filter(x => /방어/.test(x.textContent))[0]; if (b) b.click(); });
      await page.waitForTimeout(4500);
    }
    await page.evaluate(() => { const b = [...document.querySelectorAll('.lwar .lw-btns button')].filter(x => /확인/.test(x.textContent))[0]; if (b) b.click(); });
    await page.waitForFunction(() => !!window.__lwRes, null, { timeout: 30000 });
    const lw = await page.evaluate(() => window.__lwRes);

    // ---------------- 호수의 큰 해전 (정복자의 편 — 투라스칼라에서)
    const before = await page.evaluate(async () => {
      const s = G.Game.state, UI = G.UI;
      s.fleet.crew = 120;
      s.aztec = { side: 'cortes', lock: 1, met: 1, told: {} };
      s.date = { y: 1521, m: 6, d: 1 }; s.loc = { mode: 'city', city: 202, lon: G.CITY_DATA[202].lon, lat: G.CITY_DATA[202].lat };
      UI.say = async () => {}; UI.ask = async (q, o) => o[0].value; UI.alert = async () => {};
      const ships = s.fleet.ships.map(x => x.uid || x.name);
      await G.Aztec._t.lake();
      return { ships, crew: s.fleet.crew };
    });
    await page.waitForFunction(() => G.Game.sceneName === 'battle' && G.Scenes.battle.debug(), null, { timeout: 30000 });
    const bt = await page.evaluate(() => {
      const st = G.Scenes.battle.debug(), T = G.Scenes.battle._t();
      const mine = st.ships.filter(b => b.side === 'me' && !b.ally), allies = st.ships.filter(b => b.ally), en = st.ships.filter(b => b.side === 'en');
      return { mine: mine.map(b => b.type + ':' + b.name), myCrew: mine.reduce((a, b) => a + b.crew, 0), allies: allies.length, en: en.length, enType: en[0] && en[0].type,
        center: st.center, spare: st.spare, blocked: T.terrainBlocked(0, 0, null) || T.terrainBlocked(300, 200, null), hasLand: st.terrain.hasLand, flagCap: G.R.captain(mine[0].src) };
    });
    // 이긴 것으로 끝낸다 → 그 도시(투라스칼라)로
    await page.evaluate(() => { const st = G.Scenes.battle.debug(); st.ships.filter(b => b.side === 'en').forEach(b => { b.alive = false; b.sunk = 1; }); st.over = true; G.Scenes.battle._t().finish('win'); });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 60000 });
    const after = await page.evaluate(() => { const s = G.Game.state; return { city: s.loc.city, lake: s.aztec.lake, ships: s.fleet.ships.map(x => x.uid || x.name), crew: s.fleet.crew, rel: s.relations && s.relations.battle ? s.relations.battle.aztec_lake : null }; });

    assert(/퇴각 판/.test(formText), '편성 화면에 퇴각 판 안내');
    assert.strictEqual(lw.res, 'win', '퇴각 판: 버티면 이긴다');
    assert.strictEqual(lw.held, true, '빠져나와서 이겼다 (우두머리를 쓰러뜨린 것이 아님)');
    assert.deepStrictEqual(bt.mine, ['pinnace:라 카피타나', 'pinnace:산티아고', 'pinnace:산 페드로', 'pinnace:산 후안'], '빌린 브리건틴 네 척');
    assert.strictEqual(bt.allies, 8); assert.strictEqual(bt.en, 14); assert.strictEqual(bt.enType, 'korakora');
    assert.strictEqual(bt.blocked, false, '호수: 막힘 없는 물'); assert.strictEqual(bt.hasLand, false);
    assert.strictEqual(bt.flagCap, 'admiral', '빌린 기함은 제독이 몬다');
    assert.strictEqual(bt.myCrew + bt.spare, before.crew, '선원은 빌린 배에 타고 남은 사람은 기다린다');
    assert.strictEqual(after.city, 202, '싸움이 끝나면 투라스칼라로');
    assert.strictEqual(after.lake, 'won');
    assert.deepStrictEqual(after.ships, before.ships, '내 배는 그대로');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify({ lw, bt, before, after }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
