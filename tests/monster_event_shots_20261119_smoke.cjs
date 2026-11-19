/* 실제 괴물 7종·14개 결말의 사건샷, 보상, 재도전, 액자 복구를 검증한다. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = process.env.OUT || path.join(ROOT, 'artifacts/monster-event-shots-20261119');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const errors = [], page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.addInitScript(() => { const raf = window.requestAnimationFrame; window.requestAnimationFrame = fn => fn.name === 'loop' ? 0 : raf(fn); });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Monsters && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const report = await page.evaluate(async () => {
      const checks = [], ok = (v, label) => { if (!v) throw Error(label); checks.push(label); };
      const s = G.Game.state = G.State.newGame({ name: '괴물 사건샷 시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 70, int: 65, mar: 70, cha: 65 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0; s.settings.autosave = false; s.flags.prologue = true; s.mates = [];
      const original = { say: G.UI.say, ask: G.UI.ask, toast: G.UI.toast, duel: G.Games.duel, proxy: G.Games.proxy };
      let answers = [], result = 'win', failSay = false, seen = [], calls = 0;
      const active = () => [...document.querySelectorAll('.famscene')].filter(x => !x.hidden);
      G.UI.say = async () => { if (failSay) throw Error('시험용 대화 중단'); for (const frame of active()) seen.push(frame.querySelector('img').src); };
      G.UI.ask = async (q, opts) => { const v = answers.shift(); ok(opts.some(o => o.value === v), '실제 선택지 ' + v); return v; };
      G.UI.toast = () => {}; G.Games.proxy = () => null;
      G.Games.duel = async () => { calls++; ok(active().length === 0, '결투 중 사건샷 숨김'); G.Games.lastDuel = {}; return result; };
      try {
        ok(Object.keys(G.MONSTER_EVENT_SHOTS).length === 7, '괴물 7종 등록');
        for (const [id, tale] of Object.entries(G.MONSTER_TALES)) {
          for (const kind of ['meet', ...tale.choice.opts.map(o => o.value)]) {
            const shot = G.MONSTER_EVENT_SHOTS[id][kind], image = await G.Img.load(shot.img);
            ok(image && image.naturalWidth === 1881 && image.naturalHeight === 836, id + '/' + kind + ' 해독·1881×836');
          }
          for (const option of tale.choice.opts) {
            s.disc[id] = {}; s.player.items = []; s.player.gold = 100000; s.player.notoriety = 0; seen = []; calls = 0; result = 'win'; answers = ['duel', option.value];
            const out = await G.Monsters.meet(G.DISC[id], 'land');
            ok(out.go && s.disc[id].mon.done && s.disc[id].mon.res === option.value && calls === 1, id + '/' + option.value + ' 실제 결말·발견 허용');
            ok(seen.some(x => x.includes(id + '_meet_20261119.')) && seen.some(x => x.includes(id + '_' + option.value + '_20261119.')), id + '/' + option.value + ' 만남·결말 이미지 표시');
            if (option.give) ok(G.R.hasItem(option.give), id + '/' + option.value + ' 보상 물건 유지');
            if (option.gold) ok(s.player.gold === 100000 + option.gold, id + '/' + option.value + ' 금화 유지');
            if (option.notor) ok(s.player.notoriety === option.notor, id + '/' + option.value + ' 악명 유지');
            if (option.relic === false) ok(out.noRelic === true, id + '/' + option.value + ' 유물 거절 유지');
            ok(!document.querySelector('.famscene'), id + '/' + option.value + ' 액자 정리');
          }
          for (const back of [false, true]) {
            s.disc[id] = {}; seen = []; calls = 0; result = 'lose'; answers = [back ? 'back' : 'duel'];
            const out = await G.Monsters.meet(G.DISC[id], 'land');
            ok(!out.go && s.disc[id].monBlock === s.day + 30 && calls === (back ? 0 : 1) && !document.querySelector('.famscene'), id + (back ? ' 물러서기' : ' 패배') + ' 재도전·액자 정리');
          }
        }
        const shot = G.ELF_EVENT_SHOTS.join, outer = G.FamEv.showPic({ img: shot.img, title: '바깥 사건', noStand: true }); await outer.ready;
        s.disc.vampire = {}; answers = ['duel', 'dawn']; result = 'win'; await G.Monsters.meet(G.DISC.vampire, 'land');
        ok(outer.box.isConnected && !outer.box.hidden && active().length === 1, '결말 뒤 바깥 발견 액자 복구');
        s.disc.lich = {}; failSay = true; let threw = false;
        try { await G.Monsters.meet(G.DISC.lich, 'land'); } catch (e) { threw = e.message === '시험용 대화 중단'; }
        ok(threw && !outer.box.hidden && active().length === 1, '대화 예외 때 사건샷 정리·바깥 액자 복구');
        failSay = false; await outer.stop();
      } finally { Object.assign(G.UI, { say: original.say, ask: original.ask, toast: original.toast }); Object.assign(G.Games, { duel: original.duel, proxy: original.proxy }); }
      return { checks };
    });
    for (const [id, kind] of [['vampire', 'dawn'], ['lich', 'free'], ['troll', 'stone'], ['yeti', 'pass']]) {
      await page.evaluate(async ({ id, kind }) => { const a = G.MONSTER_EVENT_SHOTS[id][kind], pic = G.FamEv.showPic({ img: a.img, title: a.title, noStand: true }); await pic.ready; }, { id, kind });
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(OUT, 'game-' + id + '-' + kind + '.png') });
      await page.evaluate(() => G.FamEv.stopPic());
    }
    assert.deepEqual(errors, []); report.errors = errors;
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log('괴물 사건샷: ' + report.checks.length + '개 검사 통과, 21장 해독, 실제 결말 14개, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
