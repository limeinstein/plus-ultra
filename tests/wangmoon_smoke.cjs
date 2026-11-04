/* 왕서방·명월의 독립 발생·산지별 매입·옛 저장·금봉호와 분리, 실제 도시 대화. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/merchant-event-split-20261103');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.WangMoon && G.WangMerch && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    const checks = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const WM = G.WangMoon, checks = [], said = [], questions = [];
      const original = {say: G.UI.say, ask: G.UI.ask, toast: G.UI.toast};
      const check = (condition, label) => {if (!condition) throw Error(label); checks.push(label);};
      let choice = 'sell';
      G.UI.say = async (text, who) => {said.push({text, name: who && who.name});};
      G.UI.ask = async (text, opts) => {questions.push(text); return opts.some(o => o.value === choice) ? choice : 'no';};
      G.UI.toast = () => {};
      function fresh(city) {
        G.Game.state = G.State.newGame({name: '분리 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 60, int: 60, mar: 60, cha: 60}, sk: {}, lg: [], diff: 'normal'});
        const s = G.Game.state;
        s.loc = {mode: 'city', city}; s.date = {y: 1600, m: 5, d: 1}; s.mates = [];
        s.fleet.cargo = {}; s.ledger = {}; s.player.gold = 10000;
        s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0; s.flags.prologue = true;
        said.length = 0; questions.length = 0;
        return s;
      }
      function cargo(s) {
        s.fleet.cargo.herbs = {q: 40, cost: 25, from: 190, d: s.day, lots: {190: {q: 30, cost: 20}, 0: {q: 10, cost: 40}}};
      }
      try {
        check(G.WANGMERCH_FIGS.join() === 'wm_ma,wm_jina' && G.WANGMOON_FIGS.join() === 'wm_wang,wm_myeongwol', '인물 자료도 두 사건으로 분리');
        let s = fresh(0);
        check(!WM.pending(), '리스본에서는 발생하지 않음');
        s.loc = {mode: 'sea', lon: 117, lat: 23};
        check(!WM.pending(), '금봉호가 나오는 중국 바다에서는 발생하지 않음');
        s = fresh(226);
        check(WM.pending(), '금봉호를 몰라도 동래에서 첫 만남');
        await WM.check();
        check(said.some(x => x.name === '왕서방') && said.some(x => x.name === '명월') && !said.some(x => /마대인|지나/.test(x.name || '')), '왕서방·명월만 등장');
        check(!s.wangMerch && !s.wangMoon.korea && !questions.length, '짐 없는 인사는 금봉호 상태·돈·거래 횟수에 영향 없음');
        s = fresh(190); cargo(s);
        const beforeGold = s.player.gold, unit = WM.koreaPrice('herbs');
        check(WM.koreaLots().length === 1 && WM.koreaLots()[0].q === 30, '혼합 짐에서 조선산 30통만 선택');
        check(WM.todo(G.CITY_DATA[190]).length === 1, '도시 할 일에서 별개 거래를 선택할 수 있음');
        await WM.check();
        check(s.player.gold === beforeGold + unit * 30 && s.fleet.cargo.herbs.q === 10 && s.fleet.cargo.herbs.cost === 40 && !s.fleet.cargo.herbs.lots[190], '조선산만 매각하고 다른 산지 수량·원가는 유지');
        check(!s.wangMerch && s.wangMoon.korea === 1 && s.stats.profit === unit * 30 - 600, '매각·순이익은 새 사건에만 기록');
        cargo(s);
        check(!WM.pending() && !await WM.check() && s.wangMoon.korea === 1, '같은 날 재진입·재호출로 중복 매각하지 않음');
        const saved = JSON.parse(JSON.stringify(s)); G.Game.state = saved;
        check(!WM.pending(), '저장 복원 뒤에도 거래 대기시간 유지');
        saved.day = saved.wangMoon.cool;
        check(WM.pending(), '독립 대기시간이 지나면 다시 거래');
        s = fresh(190); cargo(s); choice = 'no';
        const declineGold = s.player.gold;
        await WM.check();
        check(s.player.gold === declineGold && s.fleet.cargo.herbs.q === 40 && !s.wangMoon.korea, '사양하면 돈·짐·거래 횟수가 바뀌지 않음');
        choice = 'sell';
        s = fresh(190); cargo(s);
        s.wangMerch = {met: 2, deals: 2, korea: 4, cool: s.day + 9999};
        const old = JSON.stringify(s.wangMerch);
        check(WM.pending() && s.wangMoon.korea === 4, '옛 조선 거래 기록을 옮기되 금봉호 대기시간은 적용하지 않음');
        for (let i = 0; i < 3; i++) {
          cargo(s); if (i) s.day = s.wangMoon.cool;
          await WM.check();
        }
        check(s.wangMoon.korea === 7 && JSON.stringify(s.wangMerch) === old && !s.mates.some(m => m.id === 'jina'), '조선 거래 세 번으로 지나가 합류하거나 금봉호 진행이 바뀌지 않음');
        s.day = s.wangMoon.cool; cargo(s);
        check(WM.pending() && s.wangMoon.korea === 7, '옛 기록을 두 번 옮기지 않음');
        const rumors = G.EVENT_RUMORS || [];
        check(rumors.some(x => x.id === 'wangmoon') && rumors.some(x => x.id === 'wangmerch'), '서로 다른 소문으로 각 만남을 안내');
      } finally {Object.assign(G.UI, original);}
      // 실제 도시를 연 뒤 새 사건의 대화를 표시한다. 자동 도착 사건과 중복 실행하지 않는다.
      const visual = fresh(190);
      visual.wangMoon = {met: 1, cool: visual.day + 1};
      G.Game.go('city', {cityId: 190, load: true});
      return checks;
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy(), null, {timeout: 120000});
    fs.mkdirSync(OUT, {recursive: true});
    await page.evaluate(() => {
      delete G.Game.state.wangMoon;
      const originalSay = G.UI.say;
      G.UI.say = function (text, who) {window.__splitLine = {seq: ((window.__splitLine || {}).seq || 0) + 1, name: who && who.name}; return originalSay.call(this, text, who);};
      window.__splitDone = false;
      window.__splitVisual = G.WangMoon.check().finally(() => {window.__splitDone = true;});
    });
    let sequence = 0;
    const captured = new Set();
    for (let i = 0; i < 12; i++) {
      await page.waitForFunction(seq => window.__splitDone || window.__splitLine && window.__splitLine.seq > seq, sequence);
      if (await page.evaluate(() => window.__splitDone)) break;
      const line = await page.evaluate(() => window.__splitLine);
      sequence = line.seq;
      await page.waitForSelector('.dlg');
      await page.waitForTimeout(260); // 대화창의 220ms 중복 입력 방지를 지난 뒤 넘긴다.
      if (line.name && !captured.has(line.name)) {
        await page.screenshot({path: path.join(OUT, line.name === '왕서방' ? 'wang.png' : 'myeongwol.png')});
        captured.add(line.name);
      }
      await page.keyboard.press('Enter');
    }
    await page.evaluate(() => window.__splitVisual);
    assert(captured.has('왕서방') && captured.has('명월'));
    assert.deepStrictEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, errors}, null, 2));
    console.log(checks.join('\n') + '\n실제 한양에서 왕서방·명월 대화·전용 초상 표시 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
