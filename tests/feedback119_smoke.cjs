/* 제보 119: 조선소 과다 투자 방지 · 중계 교역품의 저장 후 품목 유지. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
    await page.addInitScript(() => {
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = fn => fn.name === 'loop' ? 0 : raf(fn);
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000, polling: 100 });
    await page.evaluate(() => {
      G.Scenes.title.exit();
      window.feedback119Fresh = function () {
        const s = G.State.newGame({ name: '자금과 교역 시험', nation: 'PT', job: 'merchant', age: 25,
          birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0;
        s.player.gold = 1234567;
        return s;
      };
      feedback119Fresh();
      G.Scenes.city.say = async () => {};
      G.Scenes.city.npc = () => ({ name: '조선소 목수' });
      G.Fame.add = () => 0; // 업적 보상과 분리하여 실제 투자 차감액만 검사한다.
      G.UI.confirm = async text => { window.feedback119Confirm = text; return true; };
    });

    // 실제 금액 창의 「최대」를 선택해도 쓸모 있는 기술 투자액까지만 낸다.
    await page.evaluate(() => {
      const c = G.CITY_DATA.find(c => c && c.name === '아덴');
      G.Game.state.loc.city = c.id;
      window.feedback119Invest = G.Scenes.city.B.shipyard.invest(c);
    });
    await page.locator('.qk').getByRole('button', { name: '최대', exact: true }).click();
    await page.locator('.modal-back .foot').getByRole('button', { name: '결정', exact: true }).click();
    const investment = await page.evaluate(async () => {
      await feedback119Invest;
      const s = G.Game.state, c = G.CITY_DATA.find(c => c && c.name === '아덴');
      const back = G.State.deserialize(G.State.serialize());
      return { gold: s.player.gold, invested: G.Ships.techAmt(c), tech: G.Ships.tech(c),
        savedGold: back.player.gold, savedInvestment: back.tech[c.id], confirm: window.feedback119Confirm };
    });
    const trade = await page.evaluate(() => {
      const s = feedback119Fresh(), c = G.CITY_DATA.find(c => c && c.name === '캘리컷');
      s.loc.city = c.id;
      G.Scenes.city.B.trade.applyBuy(c, 'porcelain', 7, 125);
      s.fleet.cargo.faience = { q: 3, cost: 48, from: 0, d: s.day };
      const before = JSON.stringify(s.fleet.cargo), beforeGold = s.player.gold;
      // 판 번호가 없는 기존 저장도 중계항에서 산 품목을 유지한다.
      delete s.tradeGoodsVersion;
      const back = G.State.deserialize(G.State.serialize());
      return { before, after: JSON.stringify(back.fleet.cargo), beforeGold, afterGold: back.player.gold };
    });
    console.log('아덴:', JSON.stringify(investment));
    console.log('캘리컷:', JSON.stringify(trade));
    assert.equal(investment.gold, 1234567 - 70000, '아덴에서 최대를 눌러도 기술 상한까지 7만 닢만 차감');
    assert.equal(investment.invested, 70000);
    assert.equal(investment.tech, 5);
    assert.equal(investment.savedGold, investment.gold);
    assert.equal(investment.savedInvestment, investment.invested);
    assert.match(investment.confirm, /70,000/);
    assert.equal(trade.after, trade.before, '중국 도자기·기존 유럽 도기의 수량·원가·구매처 기록 유지');
    assert.equal(trade.afterGold, trade.beforeGold);

    const cases = await page.evaluate(async () => {
      const c = G.CITY_DATA.find(c => c && c.name === '아덴'), Y = G.Scenes.city.B.shipyard;
      const number = G.UI.number, confirm = G.UI.confirm;
      const out = [];
      try {
        for (const v of [null, NaN, Infinity, -1, 1.5, 999999]) {
          const s = feedback119Fresh();
          G.UI.number = async () => v;
          await Y.invest(c);
          out.push({ v: String(v), gold: s.player.gold, invested: G.Ships.techAmt(c) });
        }
        const s = feedback119Fresh();
        G.UI.number = async () => 10;
        G.UI.confirm = async () => false;
        await Y.invest(c);
        out.push({ v: '확인 취소', gold: s.player.gold, invested: G.Ships.techAmt(c) });
        G.UI.confirm = confirm;
        s.tech = { [c.id]: 69000 };
        G.UI.number = async o => o.max;
        await Y.invest(c);
        out.push({ v: '마지막 1천 닢', gold: s.player.gold, invested: G.Ships.techAmt(c) });
        await Y.invest(c);
        out.push({ v: '상한 뒤 재투자', gold: s.player.gold, invested: G.Ships.techAmt(c) });
        // 같은 화면에서 확인하는 동안 돈이 줄면 부족한 금액은 결제하지 않는다.
        feedback119Fresh();
        G.UI.number = async () => 10;
        G.UI.confirm = async () => { G.Game.state.player.gold = 5000; return true; };
        await Y.invest(c);
        out.push({ v: '확인 중 잔액 변경', gold: G.Game.state.player.gold, invested: G.Ships.techAmt(c) });
      } finally { G.UI.number = number; G.UI.confirm = confirm; }
      return out;
    });
    for (const r of cases.slice(0, 7)) {
      assert.equal(r.gold, 1234567, r.v + '일 때 자금 유지');
      assert.equal(r.invested, 0, r.v + '일 때 투자 없음');
    }
    for (const r of cases.slice(7, 9)) {
      assert.equal(r.gold, 1234567 - 1000, r.v);
      assert.equal(r.invested, 70000, r.v);
    }
    assert.deepEqual(cases[9], { v: '확인 중 잔액 변경', gold: 5000, invested: 0 });

    const saves = await page.evaluate(async () => {
      const s = feedback119Fresh(), by = name => G.CITY_DATA.find(c => c && c.name === name);
      const results = [];
      for (const name of ['캘리컷', '호르무즈', '이스탄불', '말라카', '고아', '오문', '나가사키']) {
        s.date.y = 1580;
        s.fleet.cargo = { porcelain: { q: 7, cost: 125, from: by(name).id, d: 30 } };
        const raw = JSON.parse(G.State.serialize()); delete raw.tradeGoodsVersion;
        const back = G.State.deserialize(JSON.stringify(raw));
        results.push({ name, same: JSON.stringify(back.fleet.cargo) === JSON.stringify(s.fleet.cargo) });
      }
      s.fleet.cargo = { porcelain: { q: 12, cost: 70, from: by('발렌시아').id, d: 0 } };
      const raw = JSON.parse(G.State.serialize()); delete raw.tradeGoodsVersion;
      const old = G.State.deserialize(JSON.stringify(raw));
      const legacy = !!old.fleet.cargo.faience && !old.fleet.cargo.porcelain;
      // 한 번 보정한 뒤에는 새 물건의 ID를 다시 추정하지 않는다.
      old.fleet.cargo.porcelain = { q: 2, cost: 90, from: by('발렌시아').id, d: 1 };
      G.Game.state = old;
      const twice = G.State.deserialize(G.State.serialize());
      const onceOnly = JSON.stringify(twice.fleet.cargo) === JSON.stringify(old.fleet.cargo);
      s.fleet.cargo = { porcelain: { q: 7, cost: 125, from: by('캘리컷').id, d: 30, lots: { [by('캘리컷').id]: { q: 7, cost: 125 } } } };
      G.Game.state = s;
      const saved = await G.State.saveAsync('journal5');
      return { results, legacy, onceOnly, saved: saved.ok, cargo: s.fleet.cargo, gold: s.player.gold };
    });
    assert(saves.results.every(r => r.same), '기존 중계항 저장의 도자기 품목 유지');
    assert(saves.legacy, '교역품 분리 이전 발렌시아 도자기는 유럽 도기로 보정');
    assert(saves.onceOnly, '옛 교역품 보정은 한 번만 실행');
    assert(saves.saved);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000, polling: 100 });
    const disk = await page.evaluate(async () => {
      const back = await G.State.loadAsync('journal5');
      return { cargo: back.fleet.cargo, gold: back.player.gold };
    });
    assert.deepEqual(disk.cargo, saves.cargo, '브라우저 새로고침 후 일지 불러오기도 품목·구매 기록 유지');
    assert.equal(disk.gold, saves.gold);
    assert.deepEqual(errors, [], '콘솔 오류 0');
    console.log('통과 · 투자 최대/취소/잘못된 값/상한/잔액 변경 · 중계항 7곳 · 옛 저장 · 실제 일지 저장과 불러오기 · 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
