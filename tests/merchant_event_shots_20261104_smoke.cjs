/* 누락 상인 장면 다섯 장의 실제 표시·정리와 사건별 호출을 검사한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/merchant-event-shots-20261104/screenshots');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/merchant_event_shots_20261104_prompts.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], checks = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.WangMoon && G.WangMerch && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      window.__merchantFresh = () => {
        const s = G.Game.state = G.State.newGame({name: '상인 그림 확인', nation: 'PT', job: 'explorer', age: 30, birth: {m: 1, d: 1}, st: {str: 60, int: 60, mar: 60, cha: 60}, sk: {}, lg: [], diff: 'normal'});
        s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0;
        s.date = {y: 1600, m: 5, d: 1}; s.mates = []; s.fleet.cargo = {}; s.player.gold = 10000;
        return s;
      };
      window.__merchantFresh();
    });
    for (const row of plan.scenes) {
      const check = await page.evaluate(async row => {
        const key = 'legend-events/' + row.id;
        const image = await G.Img.load(key);
        if (!image || image.naturalWidth !== 1881 || image.naturalHeight !== 836) throw Error('장면 해독·규격: ' + key);
        window.__merchantPic = G.FamEv.showPic({img: key, title: row.title});
        await window.__merchantPic.ready;
        window.__merchantSay = G.UI.say('다음 장사 길에서도 다시 만납시다.', G.Hist.speaker(row.speaker));
        return {key, speaker: row.speaker, width: image.naturalWidth, height: image.naturalHeight};
      }, row);
      await page.waitForSelector('.famscene.on img');
      await page.waitForSelector('.dlg .pframe');
      await page.evaluate(() => document.querySelector('.famscene img').decode());
      await page.waitForTimeout(350);
      assert.strictEqual(await page.locator('.dlg-actor.active.tall').count(), 0);
      await page.screenshot({path: path.join(OUT, row.id+'.png')});
      await page.keyboard.press('Enter');
      await page.evaluate(async () => {await window.__merchantSay; await window.__merchantPic.stop();});
      assert.strictEqual(await page.locator('.famscene').count(), 0);
      assert(!(await page.locator('#ui').evaluate(el => el.classList.contains('scenepic-on'))));
      checks.push(check);
    }
    const integration = await page.evaluate(async () => {
      const old = {say: G.UI.say, ask: G.UI.ask, toast: G.UI.toast, showPic: G.FamEv.showPic};
      const observed = [], speakers = [];
      let picks = [];
      G.FamEv.showPic = function (ev) {observed.push(ev.img); return old.showPic.call(this, ev);};
      G.UI.say = async (text, who) => {speakers.push(who && who.name);};
      G.UI.ask = async (q, opts) => {const v = picks.shift(); return opts.some(x => x.value === v && !x.dis) ? v : opts[opts.length-1].value;};
      G.UI.toast = () => {};
      try {
        let s = window.__merchantFresh(); s.loc = {mode: 'sea', lon: 117, lat: 23}; picks = ['no'];
        await G.WangMerch.meet();
        if (observed.join() !== 'legend-events/wm_junk,legend-events/wm_deal') throw Error('금봉호 만남·거래 샷 호출');
        if (speakers.some(x => /왕서방|명월/.test(x || ''))) throw Error('금봉호 사건 인물 혼합');
        observed.length = 0;
        await G.WangMerch._t.jinaJoins();
        if (observed.join() !== 'legend-events/wm_jina_leave' || !s.mates.some(x => x.id === 'jina')) throw Error('지나 송별 샷·합류');
        observed.length = 0; speakers.length = 0;
        s = window.__merchantFresh(); s.loc = {mode: 'city', city: 190};
        s.fleet.cargo.herbs = {q: 3, cost: 20, from: 190, d: s.day, lots: {190: {q: 3, cost: 20}}};
        picks = ['sell']; const before = s.player.gold;
        await G.WangMoon.check();
        if (observed.join() !== 'legend-events/wangmoon_port,legend-events/wangmoon_deal') throw Error('왕서방·명월 독립 샷 호출');
        if (speakers.some(x => /마대인|지나/.test(x || ''))) throw Error('조선 포구 사건 인물 혼합');
        if (s.wangMerch || s.wangMoon.korea !== 1 || s.player.gold <= before || s.fleet.cargo.herbs) throw Error('독립 거래 처리');
        if (document.querySelector('.famscene') || document.getElementById('ui').classList.contains('scenepic-on')) throw Error('사건 종료 뒤 그림 남음');
        // 대화 도중 오류가 발생해도 새 그림이 반드시 닫힌다.
        s = window.__merchantFresh(); s.loc = {mode: 'city', city: 190};
        G.UI.say = async () => {throw Error('정리 검사');};
        let caught = false;
        try {await G.WangMoon.check();} catch (e) {caught = e.message === '정리 검사';}
        if (!caught || G.WangMoon._busy || document.querySelector('.famscene') || document.getElementById('ui').classList.contains('scenepic-on')) throw Error('오류 뒤 그림·진행 잠금 정리');
        return ['금봉호 만남·거래·지나 송별 호출', '조선 포구 만남·품질 확인 호출', '두 사건의 인물·거래 기록 분리', '정상·오류 종료 뒤 그림 정리'];
      } finally {G.UI.say=old.say; G.UI.ask=old.ask; G.UI.toast=old.toast; G.FamEv.showPic=old.showPic;}
    });
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, integration, errors}, null, 2));
    assert.deepStrictEqual(errors, []);
    console.log('새 장면 5장 표시·종료·대화 얼굴, 실제 사건 호출·인물 분리·오류 정리 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
