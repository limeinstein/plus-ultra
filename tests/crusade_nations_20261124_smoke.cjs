/* 십자군의 제독 국적 조건: 새 게임·이야기·옛 대기열·레판토 참전. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/crusade-nations-20261124');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : setTimeout(() => cb(performance.now()), 16); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      const cases = [], fail = message => { throw Error(message); };
      const events = G.REL_EVENTS.filter(e => e.ask && e.who && e.who.legate);
      if (events.length !== 5 || events.some(e => e.need.faith !== 'C')) fail('십자군 기부 요청 5개에 조건 필요');
      const original = { say: G.UI.say, ask: G.UI.ask, pic: G.FamEv.showPic, go: G.Game.go };
      let calls = [], pictures = 0, battles = 0;
      G.UI.say = async (text, who) => { calls.push({ text, name: who && who.name }); };
      G.UI.ask = async text => { calls.push({ text, ask: true }); return 'no'; };
      G.FamEv.showPic = () => { pictures++; return { stop: async () => {} }; };
      G.Game.go = () => { battles++; };
      const fresh = (nation, date, story = false) => {
        const s = G.Game.state = G.State.newGame({ name: '국적 검사', nation, byNation: true, job: 'adventurer', age: 24,
          birth: { m: 5, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        s.date = { ...date }; s.settings.res = .35; s.settings.music = 0; s.settings.sound = 0;
        s.settings.autosave = false; s.player.gold = 10000;
        if (story) s.song = { act: 1, beats: {}, rep: [], venues: {}, flags: {} };
        calls = []; pictures = 0; battles = 0; return s;
      };
      try {
        for (const nation of G.NATION_ORDER) for (const e of events) {
          const allowed = G.NATIONS[nation].faith === 'C';
          const s = fresh(nation, { y: e.y, m: e.m, d: e.d - 1 });
          G.Rel.daily(); s.rel.pend = []; s.date.d++;
          const news = G.Rel.daily(), queued = s.rel.pend.includes(e.id);
          if (queued !== allowed || G.Rel.pending() !== allowed) fail(nation + ': 발생 조건 ' + e.id);
          if (!allowed && news.some(n => n.text.includes(e.title))) fail(nation + ': 차단 사건 소식 ' + e.id);
          await G.Rel.present();
          if (!!calls.length !== allowed || !!pictures !== allowed) fail(nation + ': 사절·그림 ' + e.id);
          if (s.player.gold !== 10000 || (s.sponsors.it_pope && s.sponsors.it_pope.trust > 20)) fail('사양·차단 뒤 보상 변경');
          for (const mod of e.mods || []) if (G.Rel.get(mod[0], mod[1]).v !== mod[2]) fail('세계 외교 변화 누락');
          cases.push({ nation, event: e.id, queued, shown: !!calls.length });
        }
        for (const [nation, story] of [['KR', false], ['OT', false], ['KR', true]]) {
          let s = fresh(nation, { y: 1480, m: 8, d: 20 }, story);
          G.Rel.daily(); await G.Rel.present();
          if (calls.length || pictures || G.Rel.pending()) fail(nation + ': 시작 직후 사절');
          cases.push({ nation, story, check: '시작 직후', blocked: true });
          s = fresh(nation, { y: 1571, m: 9, d: 30 }, story);
          G.Rel.daily(); s.rel.pend = events.map(e => e.id); s.rel.told = {};
          s.loc = { mode: 'sea', lon: 21, lat: 38.3, heading: 0 };
          G.Game.state = JSON.parse(JSON.stringify(s)); s = G.Game.state;
          if (G.Rel.pending()) fail(nation + ': 옛 대기열 pending');
          await G.Rel.present();
          if (calls.length || pictures || battles || s.rel.pend.length || s.rel.battle.lepanto) fail(nation + ': 옛 대기열 처리');
          const e = events.find(e => e.battle);
          if (await G.Rel.greatBattle(e.battle, e)) fail(nation + ': 직접 참전');
          if (calls.length || battles) fail(nation + ': 참전 차단');
          cases.push({ nation, story, check: '저장 복원·레판토', blocked: true });
          // 다른 궁정 소식까지 막지 않는다.
          const wedding = G.REL_EVENTS.find(e => e.id === 'ib_wed1497');
          s.date = { y: wedding.y, m: wedding.m, d: wedding.d }; s.rel.pend = [wedding.id];
          delete s.rel.told[wedding.id]; await G.Rel.present();
          if (!calls.length) fail(nation + ': 일반 혼례 소식 누락');
        }
        const e = events.find(e => e.battle);
        for (const nation of ['ES', 'PT', 'EN', 'NL']) {
          const s = fresh(nation, { y: 1571, m: 9, d: 30 }); G.Rel.daily();
          s.rel.pend = [e.id]; s.rel.told = { [e.id]: 1 }; s.loc = { mode: 'sea', lon: 21, lat: 38.3 };
          if (!G.Rel.pending()) fail(nation + ': 레판토 참여 기회 없음');
          await G.Rel.present();
          if (s.rel.battle.lepanto !== 'declined' || !calls.some(c => c.ask)) fail(nation + ': 참전 선택 누락');
          cases.push({ nation, check: '레판토 참전 선택 유지', passed: true });
        }
      } finally {
        G.UI.say = original.say; G.UI.ask = original.ask; G.FamEv.showPic = original.pic; G.Game.go = original.go;
      }
      // 조선 제독의 실제 항해 화면에서 옛 대기열을 처리해도 대화창이 생기지 않는다.
      const s = fresh('KR', { y: 1480, m: 8, d: 20 }); G.Rel.daily();
      s.rel.pend = ['cr_otranto']; s.rel.told = {};
      s.loc = { mode: 'sea', lon: 128, lat: 35, heading: 0 };
      G.Game.showLayers(false, false, true); G.UI.clearScreen();
      if (G.Loader) G.Loader.hide(); document.querySelector('#boot-loader')?.remove();
      G.Game.refreshHud(); await G.Rel.present();
      if (document.querySelector('.modal-back .dlg')) fail('조선 실제 화면에 십자군 대화 노출');
      return { cases, blockedQueue: s.rel.pend };
    });
    await page.screenshot({ path: path.join(OUT, 'korea-no-crusade.png') });
    assert.deepStrictEqual(errors, []);
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ ...result, errors }, null, 2));
    console.log(JSON.stringify({ checks: result.cases.length, blockedQueue: result.blockedQueue, errors, output: OUT }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
