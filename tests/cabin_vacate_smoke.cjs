/* 피드백 #202: 술집에서 비운 예배실이 화면 재진입·자동 채우기 뒤에도 비어 있어야 한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(ROOT, 'artifacts/cabin-vacate-20261115');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => G.CrewAuto && G.CabinView && G.Joan, null, { polling: 100, timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Tutorial.active = () => false;
      G.State.newGame({ name: '선실 해제 시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state;
      s.settings.autosave = false; s.settings.res = .35;
      s.fleet.ships = [G.R.newShip('caravel', '시험 기함'), G.R.newShip('caravel', '둘째 배')];
      s.mates = G.MATES.filter(d => d.wage && !d.noWander && d.id !== 'joan_of_arc').slice(0, 24).map(d => ({
        id: d.id, role: 'none', loyal: 70, sk: Object.fromEntries(G.SKILLS.map(k => [k.id, 0]))
      }));
      G.Cabins.remodel(1, 'chapel');
      G.Cabins.place(s.mates[0], 1); s.mates[0].sk.theo = 3;
      window.__residentId = s.mates[0].id;
      window.__residentName = G.MATE[__residentId].name;
      G.CrewAuto.refresh();
      await G.Loader.hide();
      window.__organize = G.Scenes.city.B.tavern.organize();
    });
    const cabinChoice = () => page.locator('.choice').filter({ hasText: '기함 선실 —' });
    const closeCabins = async () => {
      await page.locator('.win .foot button').filter({ hasText: '닫는다' }).click();
      await cabinChoice().waitFor();
    };
    const chapelEmpty = () => page.evaluate(() => !G.Cabins.occupant(1) && G.Joan.emptyChapel() === 1);

    await cabinChoice().click();
    await page.locator('.cb-card[data-i="1"]').click();
    await page.locator('.cb-pop-f button').filter({ hasText: '자리를 비운다' }).click();
    await page.locator('.cb-card[data-i="1"]:not(.on)').waitFor();
    await closeCabins();
    assert(await chapelEmpty(), '술집 부하편성으로 돌아가도 비운 예배실을 자동으로 채우지 않는다');
    for (let i = 0; i < 2; i++) {
      await cabinChoice().click();
      await page.locator('.cb-card[data-i="1"]:not(.on)').waitFor();
      assert(await chapelEmpty(), '선실 화면 재진입 후에도 잔다르크 영입용 예배실이 비어 있다');
      if (!i) await page.screenshot({ path: path.join(OUT, 'empty-chapel.png') });
      await closeCabins();
    }
    console.log('통과: 술집 → 기함 선실 → 자리를 비운다 → 닫기·재진입 두 차례');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.choice'), null, { polling: 100 });
    await page.evaluate(() => __organize);

    // 부하 명단의 「자리에서 뺀다」도 같은 선실 비움 규칙을 쓴다.
    await page.evaluate(() => {
      G.Cabins.place(G.Game.state.mates.find(m => m.id === __residentId), 1);
      window.__cabin = G.CabinView.open();
    });
    await page.locator('.cb-mate').filter({ hasText: await page.evaluate(() => __residentName) }).click();
    await page.locator('.cb-pop-f button').filter({ hasText: '자리에서 뺀다' }).click();
    await page.locator('.cb-card[data-i="1"]:not(.on)').waitFor();
    await page.locator('.win .foot button').filter({ hasText: '닫는다' }).click();
    await page.evaluate(() => __cabin);
    assert(await page.evaluate(() => { G.CrewAuto.refresh(); return G.Joan.emptyChapel() === 1; }), '부하 명단에서 빼도 선실 비움 유지');
    console.log('통과: 부하 명단에서 자리 해제 후에도 예배실 비움 유지');

    // 술집에서 동료의 「역할 없음」을 골라도 실제 선실을 비운다.
    await page.evaluate(() => {
      G.Cabins.place(G.Game.state.mates.find(m => m.id === __residentId), 1);
      window.__organize = G.Scenes.city.B.tavern.organize();
    });
    await page.locator('.choice').filter({ hasText: await page.evaluate(() => __residentName) }).click();
    await page.locator('.choice').filter({ hasText: '역할 없음' }).click();
    await cabinChoice().waitFor();
    assert(await chapelEmpty(), '역할 없음은 선실 배치도 해제한다');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.choice'), null, { polling: 100 });
    await page.evaluate(() => __organize);
    console.log('통과: 술집 역할 없음으로 선실 배치 해제');

    const checks = await page.evaluate(() => {
      const CB = G.Cabins, CA = G.CrewAuto, checks = [];
      const check = (v, text) => { if (!v) throw Error(text); checks.push(text); };
      for (let i = 0; i < 3; i++) CA.refresh();
      CB.monthly(false);
      check(G.Joan.emptyChapel() === 1, '반복 자동 채우기·월별 정리 뒤에도 빈 예배실 유지');
      G.Game.state = G.State.deserialize(G.State.serialize());
      CA.refresh();
      check(G.Joan.emptyChapel() === 1, '저장·불러오기 뒤에도 빈 예배실 유지');
      let s = G.Game.state, m = s.mates.find(m => m.id === __residentId);
      CB.place(m, 1); CA.refresh();
      check(CB.occupant(1) === m, '직접 부하를 앉히면 비워 둔 선실을 다시 사용');
      G.Scenes.city.B.tavern.assign(m, 'none'); CA.refresh();
      check(G.Joan.emptyChapel() === 1, '다시 역할을 해제하면 다른 부하도 예배실을 채우지 않음');
      CA.autoAll();
      check(!!CB.occupant(1), '자동 배치를 직접 실행하면 비워 둔 선실도 다시 채움');
      G.Scenes.city.B.tavern.assign(CB.occupant(1), 'none');
      CB.remodel(1, 'galley'); CA.refresh();
      check(!!CB.occupant(1), '다른 용도로 개조한 선실은 정상 자동 배치');
      CB.remodel(1, 'chapel');
      G.Scenes.city.B.tavern.assign(CB.occupant(1), 'none');
      s.player.gold = 1000000; s.fleet.food = s.fleet.water = s.fleet.mat = 0; s.fleet.cargo = {};
      let draft = CB.rooms().slice(); draft[2] = 'store';
      check(CB.remodelAll(draft).ok, '다른 선실의 일괄 개조 적용');
      CA.refresh();
      check(G.Joan.emptyChapel() === 1, '다른 선실을 일괄 개조해도 비워 둔 예배실 유지');
      draft = CB.rooms().slice(); draft[1] = 'galley';
      check(CB.remodelAll(draft).ok, '비워 둔 선실의 일괄 개조 적용');
      CA.refresh();
      check(!!CB.occupant(1), '일괄 개조로 용도가 바뀐 선실은 다시 자동 배치');
      CB.remodel(1, 'chapel');
      G.Scenes.city.B.tavern.assign(CB.occupant(1), 'none');
      const original = s.fleet.ships[0], other = s.fleet.ships[1];
      CB.setStore(other, 0); other.cabins[1] = 'chapel';
      s.fleet.ships.reverse(); CB.rooms(); G.R.tidyCaptains(); CA.refresh();
      check(CB.flagship() === other && !!CB.occupant(1), '기함을 바꾸어도 다른 배의 같은 번호 선실에는 비움 설정이 번지지 않음');
      s.fleet.ships.reverse(); CB.rooms(); G.R.tidyCaptains(); CA.refresh();
      check(CB.flagship() === original && G.Joan.emptyChapel() === 1, '원래 기함으로 돌아오면 비워 둔 예배실 유지');
      return checks;
    });
    checks.forEach(text => console.log('통과: ' + text));
    const joined = await page.evaluate(async () => {
      const s = G.Game.state, UI = G.UI;
      // 잔이 부관 대신 비워 둔 예배실에 들도록 부관 보직을 먼저 채운다.
      G.Scenes.city.B.tavern.assign(s.mates.find(m => m.room == null), 'first');
      s.loc.mode = 'land';
      const saved = { say: UI.say, ask: UI.ask, duel: G.Games.duel, pic: G.FamEv.showPic, hire: G.Achieve.afterHire };
      try {
        UI.say = async () => {}; UI.ask = async (_, opts) => opts[0].value;
        G.Games.duel = async () => 'win'; G.FamEv.showPic = () => null; G.Achieve.afterHire = async () => {};
        let forest;
        for (let x = -1; x <= 6 && !forest; x += .1) for (let y = 43; y <= 50; y += .1) {
          if (!G.Geo.isSea(x, y, 1) && G.Joan.forest(x, y)) { forest = [x, y]; break; }
        }
        if (!forest) throw Error('프랑스 숲을 찾지 못함');
        const result = await G.Joan.onCamp('herb', forest[0], forest[1], true);
        const joan = s.mates.find(m => m.id === 'joan_of_arc');
        G.CrewAuto.refresh();
        return result && joan && G.Cabins.occupant(1) === joan && joan.roomType === 'chapel';
      } finally {
        UI.say = saved.say; UI.ask = saved.ask; G.Games.duel = saved.duel;
        G.FamEv.showPic = saved.pic; G.Achieve.afterHire = saved.hire;
      }
    });
    assert(joined, '비워 둔 예배실로 잔다르크 사건·영입·입실까지 완료');
    checks.push('비워 둔 예배실로 잔다르크 사건·영입·입실까지 완료');
    console.log('통과: ' + checks[checks.length - 1]);
    assert.deepEqual(errors, [], '브라우저 오류 0');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ checks, errors }, null, 2));
    console.log('통과: 브라우저 오류 0');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
