/* 기함이 아닌 배의 선실 → 창고 — 조선소 개조, 적재량·거주 자리·비용·공사일·저장 회귀. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

function ok(value, message) {
  if (!value) throw new Error(message);
  console.log('  ✓ ' + message);
}

(async function () {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(message.text())) errors.push(message.text()); });
  try {
    await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Cabins && G.CrewAuto && G.Scenes && G.Scenes.city && G.Scenes.city.B.shipyard, null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      G.State.newGame({ name: '창고 시험', nation: 'PT', job: 'merchant', age: 25, birth: { m: 1, d: 1 }, st: { str: 50, int: 60, mar: 50, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, R = G.R, CB = G.Cabins, CA = G.CrewAuto, Y = G.Scenes.city.B.shipyard;
      const flagship = R.newShip('carrack', '기함'), other = R.newShip('caravel', '짐배');
      s.fleet.ships = [flagship, other]; s.player.gold = 100000;
      const slots = CB.slots(other), beforeCap = R.shipCargoCap(other), beforeDay = s.day, beforeGold = s.player.gold;
      const expectedBonus = Math.floor(G.SHIP[other.type].cap * 0.03 * slots);
      const menu = [];
      const oldChoose = G.UI.choose, oldNumber = G.UI.number, oldConfirm = G.UI.confirm, oldFade = G.UI.fade;
      const oldSay = G.Scenes.city.say;
      let stage = 0;
      G.UI.choose = async function (title, options) {
        menu.push({ title, labels: options.map(x => String(x.label).replace(/<[^>]*>/g, '')) });
        if (title === '개조할 배') return 1;
        if (/짐배호 개조/.test(title) && stage++ === 0) return 'store';
        return null;
      };
      G.UI.number = async function () { return slots; };
      G.UI.confirm = async function () { return true; };
      G.UI.fade = async function (fn) { return fn(); };
      G.Scenes.city.say = async function () {};
      try { await Y.refit(G.CITY_DATA[0]); } finally {
        G.UI.choose = oldChoose; G.UI.number = oldNumber; G.UI.confirm = oldConfirm; G.UI.fade = oldFade; G.Scenes.city.say = oldSay;
      }
      const after = {
        stores: CB.storeCount(other), bonus: CB.storeBonus(other), cap: R.shipCargoCap(other), berths: CB.berths(other),
        gold: s.player.gold, day: s.day, menu: menu.flatMap(x => x.labels)
      };
      const flagSlots = CB.slots(flagship); CB.setStore(flagship, flagSlots);
      const flagBonus = CB.storeBonus(flagship), flagExpected = Math.floor(G.SHIP[flagship.type].cap * 0.05 * Math.min(flagSlots, 4));
      const restored = G.State.deserialize(G.State.serialize());
      const savedOther = restored.fleet.ships[1];
      return { slots, beforeCap, beforeDay, beforeGold, expectedBonus, after, flagSlots, flagBonus, flagExpected, saved: savedOther.cabins.filter(x => x === 'store').length };
    });
    ok(result.after.menu.some(x => /선실 → 창고 개조/.test(x)), '기함이 아닌 배의 개조 메뉴에 「선실 → 창고 개조」가 보인다');
    ok(result.after.stores === result.slots && result.after.berths === 0, '모든 선실을 창고로 바꾸면 창고 ' + result.slots + '칸·거주 자리 0칸');
    ok(result.after.bonus === result.expectedBonus && result.after.cap === result.beforeCap + result.expectedBonus, '선실마다 기본 적재량 3%씩 짐칸 +' + result.after.bonus + '통');
    ok(result.beforeGold - result.after.gold === result.slots * 1200, '창고 한 칸 1,200닢의 개조비를 정확히 낸다');
    ok(result.after.day - result.beforeDay === result.slots, '창고 한 칸당 하루씩 공사한다 (' + result.slots + '일)');
    ok(result.flagBonus === result.flagExpected, '기함은 기존 규칙대로 한 칸 5%·최대 4칸만 적용한다');
    ok(result.saved === result.slots, '저장·불러오기 뒤에도 다른 배의 창고 수가 유지된다');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('\n통과');
  } catch (error) {
    console.error('✗ ' + error.message);
    if (errors.length) console.error(errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
