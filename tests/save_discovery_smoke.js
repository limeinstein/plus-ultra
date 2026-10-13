/* 발견 연출 정리와 자동/여관 저장 5+5칸 회귀 시험.
   node tests/save_discovery_smoke.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.BROWSER_EXE,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => p && fs.existsSync(p));
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const save = await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.Game.state = G.State.newGame({ name: '저장 시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 0), diff: 'normal' });
      G.Game.sceneName = 'city';
      const realNow = Date.now; let now = 100000;
      Date.now = () => now;
      // 구판 숫자 일지 1도 새 여관 일지 1에서 읽혀야 한다.
      s.player.gold = 71; await G.State.saveAsync(1);
      const legacy = G.State.load('journal1').player.gold;
      // 새 여관 일지 다섯 칸.
      for (let i = 0; i < 5; i++) { now += 1000; s.player.gold = 200 + i; await G.State.saveAsync(G.State.JOURNAL_SLOTS[i]); }
      const journalBefore = await Promise.all(G.State.JOURNAL_SLOTS.map(async x => (await G.State.loadAsync(x)).player.gold));
      // 자동 저장 여섯 번: 여섯 번째가 가장 오래된 1번 칸을 교체해야 한다.
      for (let i = 0; i < 6; i++) { now += 1000; s.player.gold = 300 + i; await G.State.saveAsync(0); }
      const autoGold = await Promise.all(G.State.AUTO_SLOTS.map(async x => (await G.State.loadAsync(x)).player.gold));
      const journalAfter = await Promise.all(G.State.JOURNAL_SLOTS.map(async x => (await G.State.loadAsync(x)).player.gold));
      const times = G.State.AUTO_SLOTS.map(x => G.State.meta(x).t);
      const latest = G.State.latestAutoSlot();
      Date.now = realNow;
      return { legacy, journalBefore, journalAfter, autoGold, times, latest, interval: G.State.AUTO_INTERVAL_MS, tick: typeof G.State.autoSaveNow };
    });
    ok(save.legacy === 71, '기존 숫자 일지를 새 여관 일지에서 불러온다');
    ok(save.journalBefore.join() === '200,201,202,203,204' && save.journalAfter.join() === save.journalBefore.join(), '여관 일지 5칸은 자동 저장과 별개다');
    ok(save.autoGold.join() === '305,301,302,303,304', '6번째 자동 저장이 가장 오래된 1번 칸을 교체한다');
    ok(save.latest === 'auto1' && save.times[0] === Math.max(...save.times), '이어하기 대상은 가장 최근 자동 저장이다');
    ok(save.interval === 60000 && save.tick === 'function', '자동 저장 주기는 60초다');

    const menus = await page.evaluate(async () => {
      const oldChoose = G.UI.choose, seen = [];
      G.UI.choose = async (title, opts) => { seen.push({ title, labels: opts.map(x => x.label) }); return null; };
      await G.Info.saveMenu();
      await G.Scenes.title.loadMenu();
      G.UI.choose = oldChoose;
      return seen;
    });
    ok(menus[0].labels.length === 5 && menus[0].labels.every((x, i) => x.indexOf('여관 일지 ' + (i + 1)) === 0), '여관 저장 화면에 별도 일지 5칸이 보인다');
    ok(menus[1].labels.filter(x => /^자동 저장 /.test(x)).length === 5 && menus[1].labels.filter(x => /^여관 일지 /.test(x)).length === 5, '불러오기 화면에서 자동 5칸과 여관 5칸을 구분한다');

    const reveal = await page.evaluate(async () => {
      const d = G.DISC.stonehenge;
      const key = G.Reel.key(d); if (key) await G.Reel.load(key);
      const oldSay = G.UI.say, oldTitle = G.FX.reveal.titleMs;
      G.FX.reveal.titleMs = 1; G.UI.say = async () => {};
      const p = G.Scenes.discoveryReveal(d, 10);
      while (!document.querySelector('#ui .reveal')) await new Promise(r => setTimeout(r, 10));
      document.querySelector('#ui .reveal').click();
      await p;
      const normalLeft = document.querySelectorAll('#ui .reveal').length;
      let caught = false;
      G.UI.say = async () => { throw new Error('forced dialogue failure'); };
      const p2 = G.Scenes.discoveryReveal(d, 10);
      while (!document.querySelector('#ui .reveal')) await new Promise(r => setTimeout(r, 10));
      document.querySelector('#ui .reveal').click();
      try { await p2; } catch (e) { caught = /forced/.test(e.message); }
      const errorLeft = document.querySelectorAll('#ui .reveal').length;
      G.UI.say = oldSay; G.FX.reveal.titleMs = oldTitle;
      return { normalLeft, errorLeft, caught };
    });
    ok(reveal.normalLeft === 0, '발견 연출이 끝나면 창이 사라진다');
    ok(reveal.caught && reveal.errorLeft === 0, '후속 대화에서 예외가 나도 발견 창은 반드시 정리된다');
    ok(!errors.length, '브라우저 콘솔 오류 0');
  } catch (e) {
    console.error('✗ ' + e.message);
    if (errors.length) console.error(errors.join('\n'));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
