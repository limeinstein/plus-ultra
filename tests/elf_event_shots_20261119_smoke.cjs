/* 엘프 사건샷: 실제 분기·이미지 해독·결투 직전 정리·바깥 사건 복구. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = process.env.OUT || path.join(ROOT, 'artifacts/elf-event-shots-20261119');
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
    await page.waitForFunction(() => window.G && G.Elves && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const report = await page.evaluate(async () => {
      const checks = [], ok = (v, label) => { if (!v) throw Error(label); checks.push(label); };
      const s = G.Game.state = G.State.newGame({ name: '엘프 사건샷 시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 70, int: 65, mar: 70, cha: 65 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0; s.settings.autosave = false; s.flags.prologue = true;
      const original = { say: G.UI.say, ask: G.UI.ask, toast: G.UI.toast, duel: G.Games.duel, proxy: G.Games.proxy, chance: G.U.chance };
      const a = G.ELVES[0], sid = G.MATE[a.id].sisterId, seen = [], duelCalls = [];
      let answers = [], result = 'win', failSay = false;
      const active = () => [...document.querySelectorAll('.famscene')].filter(x => !x.hidden);
      const reset = () => { s.elves = { met: {}, beat: {}, back: {}, joined: {}, declined: {}, last: -999 }; s.mates = []; seen.length = 0; duelCalls.length = 0; };
      G.UI.say = async () => {
        if (failSay) throw Error('의도한 대화 중단');
        const frame = active()[0]; if (frame) seen.push(frame.querySelector('img').src);
      };
      G.UI.ask = async (q, opts) => { const answer = answers.shift(); ok(opts.some(o => o.value === answer), '실제 선택지 ' + answer); return answer; };
      G.UI.toast = () => {}; G.U.chance = () => true;
      G.Games.proxy = () => s.mates.find(m => m.role === 'first') || null;
      G.Games.duel = async (fighter, opt) => { ok(active().length === 0, '결투 앞 사건샷 정리'); G.Games.lastDuel = { mate: opt.mate || null }; duelCalls.push(opt); return result; };
      try {
        for (const [kind, shot] of Object.entries(G.ELF_EVENT_SHOTS)) {
          const image = await G.Img.load(shot.img);
          ok(image && image.naturalWidth === 1881 && image.naturalHeight === 836, kind + ' 원화 해독·해상도');
        }
        reset(); answers = ['duel'];
        ok(await G.Elves.duel(a, 'random', 'explore') === 'win', '첫 일기토 승리');
        ok(seen.some(x => x.includes('/duel_20261119.')) && s.elves.back[a.id] === s.day + 30, '첫 대결 원화·30일 뒤 재회 유지');
        ok(document.querySelectorAll('.famscene').length === 0, '승리 뒤 액자 정리');
        reset(); const proxy = { id: 'elf_celebrian', role: 'first', loyal: 75 }; s.mates.push(proxy); answers = ['proxy'];
        await G.Elves.duel(a, 'random', 'explore');
        ok(seen.some(x => x.includes('/support_20261119.')) && duelCalls[0].mate === proxy && proxy.loyal === 79, '동료 지원 원화·실제 대리 출전·충성 유지');
        reset(); s.mates.push({ id: sid, role: 'none' }); answers = ['talk'];
        ok(await G.Elves.duel(a, 'random', 'explore') === 'sister', '자매 설득 성공');
        ok(seen.some(x => x.includes('/sisters_20261119.')) && !duelCalls.length && s.mates.some(m => m.id === a.id), '자매 원화·싸움 없는 합류');
        reset(); s.mates.push({ id: sid, role: 'none' }); answers = ['duel', 'duel'];
        await G.Elves.duel(a, 'disc', 'explore');
        ok(duelCalls.length === 1 && seen.some(x => x.includes('/sisters_20261119.')), '자매 설득 대신 실제 결투 선택');
        reset(); answers = ['back'];
        ok(await G.Elves.duel(a, 'random') === 'back' && !duelCalls.length && !document.querySelector('.famscene'), '물러서기 뒤 정리');
        reset(); result = 'lose'; answers = ['duel'];
        ok(await G.Elves.duel(a, 'random') === 'lose' && !s.elves.beat[a.id] && !document.querySelector('.famscene'), '패배 뒤 정리·미승리 유지');
        reset(); result = 'win'; answers = ['yes']; s.elves.back[a.id] = s.day;
        await G.Elves.comeBack(a.id, 'city');
        ok(seen.some(x => x.includes('/join_20261119.')) && s.mates.some(m => m.id === a.id), '30일 뒤 재회·재대결·합류 원화');
        reset(); answers = ['yes']; result = 'lose';
        await G.Elves.comeBack(a.id, 'explore');
        ok(s.elves.back[a.id] === s.day + 30 && !document.querySelector('.famscene'), '재대결 패배·다음 재회 유지');
        reset(); answers = ['no'];
        await G.Elves.comeBack(a.id, 'city');
        ok(s.elves.declined[a.id] === s.day && !document.querySelector('.famscene'), '합류 거절 뒤 정리');
        reset(); s.mates.push({ id: sid, role: 'none' }); answers = ['yes']; result = 'win';
        await G.Elves.comeBack(a.id, 'city');
        ok(seen.some(x => x.includes('/sisters_20261119.')), '합류 뒤 자매 재회 원화');
        const outer = G.FamEv.showPic({ img: G.ELF_EVENT_SHOTS.join.img, title: '바깥 사건', noStand: true }); await outer.ready;
        reset(); answers = ['back']; await G.Elves.duel(a, 'disc');
        ok(outer.box.isConnected && !outer.box.hidden && document.getElementById('ui').classList.contains('scenepic-on'), '바깥 사건 그림·대화 방식 복구');
        failSay = true; let threw = false;
        try { await G.Elves.duel(a, 'random'); } catch (e) { threw = e.message === '의도한 대화 중단'; }
        ok(threw && !outer.box.hidden && document.querySelectorAll('.famscene').length === 1, '대화 예외에도 액자 정리·바깥 그림 복구');
        failSay = false; await outer.stop();
      } finally { Object.assign(G.UI, { say: original.say, ask: original.ask, toast: original.toast }); Object.assign(G.Games, { duel: original.duel, proxy: original.proxy }); G.U.chance = original.chance; }
      return { checks };
    });
    for (const kind of ['duel', 'support', 'sisters', 'join']) {
      await page.evaluate(async kind => { const a = G.ELF_EVENT_SHOTS[kind]; const pic = G.FamEv.showPic({ img: a.img, title: a.title.replace('{elf}', '갈라드리엘').replace('{mate}', kind === 'sisters' ? '아르웬' : '켈레브리안'), noStand: true }); await pic.ready; }, kind);
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(OUT, kind + '.png') });
      await page.evaluate(() => G.FamEv.stopPic());
    }
    assert.deepEqual(errors, []); report.errors = errors;
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log('엘프 사건샷: ' + report.checks.length + '개 검사 통과, 원화 4장, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
