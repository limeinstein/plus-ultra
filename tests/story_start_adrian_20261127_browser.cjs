/* 실제 이야기 시작·로딩 유지·아드리안 원화·옛 저장·후계자 보호를 확인한다. */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), out = process.env.OUT || path.join(root, 'artifacts/story-start-adrian-20261127');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', ...(process.env.HARDWARE_GL === '1' ? ['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist'] : ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])] });
  const errors = [], report = {};
  try {
    const p = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.addInitScript(() => {
      localStorage.setItem('pu.lang', 'ko'); localStorage.setItem('pu_song_preview', '1');
      window.requestAnimationFrame = cb => cb.name === 'loop' || String(cb).includes('.frameDue(') && String(cb).includes('.scene.update(') ? 0 : setTimeout(() => cb(performance.now()), 16);
    });
    await p.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.waitForFunction(() => window.G && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await p.evaluate(()=>document.fonts.ready);
    Object.assign(report,await p.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})));
    if(process.env.EXPECT_VERSION)assert.equal(report.version,process.env.EXPECT_VERSION);
    await p.waitForFunction(() => !G.Loader.busy(), null, { timeout: 120000 });
    await p.evaluate(() => {
      window.qaDone = false;
      G.StorySelect.open().then(() => qaDone = true);
      // 타이틀이 다시 노출되는 순간과 중복 시작을 함께 기록한다.
      window.qaLeaks = []; window.qaCalls = 0;
      const mode = G.STORY_MODES.find(m => m.id === 'gold'), begin = mode.begin;
      mode.begin = async () => { qaCalls++; await new Promise(r => setTimeout(r, 500)); return begin(); };
    });
    await p.locator('.ss-card[data-story="gold"]').click();
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(out, '01-adrian-selection.png') });
    await p.evaluate(() => {
      window.qaWatch = setInterval(() => {
        if (!qaDone && !document.querySelector('.ss-stage') && G.Game.sceneName === 'title' && !G.Loader.shown()) qaLeaks.push('title');
      }, 16);
    });
    await p.locator('.ss-go').click();
    await p.waitForFunction(() => G.Loader.shown());
    await p.screenshot({ path: path.join(out, '02-story-loading.png') });
    await p.evaluate(() => { G.StorySelect.begin(G.STORY_MODES.find(m => m.id === 'gold')); });
    await p.waitForFunction(() => qaDone && G.Game.sceneName === 'city' && document.querySelector('.dlg'), null, { timeout: 180000 });
    await p.evaluate(() => clearInterval(qaWatch));
    await p.screenshot({ path: path.join(out, '03-gold-prologue.png') });
    report.start = await p.evaluate(() => ({ calls: qaCalls, leaks: qaLeaks, scene: G.Game.sceneName, gold: !!G.Game.state.gold, look: G.Game.state.player.look }));
    assert.equal(report.start.calls, 1); assert.deepEqual(report.start.leaks, []); assert.equal(report.start.look, 'blackcoat_captain');
    report.portraits = await p.evaluate(async () => {
      const s = G.Game.state, result = [];
      for (const legacy of [false, true]) {
        s.player.look = legacy ? 'noble_scholar' : G.GOLD.look;
        for (const age of [22, 39, 40, 69, 70]) {
          const face = G.Img.pick(G.Img.chain.heroPortrait(s.player, age)), half = G.Img.pick(G.Img.chain.heroHalf(s.player, age));
          result.push({ legacy, age, face, half, loaded: !!(await G.Img.load(face)) && !!(await G.Img.load(half)), walk: G.Img.chain.heroMotion('walk')[0] });
        }
      }
      s.player.generation = 2; s.player.heir = { sex: 'f', folder: '', variant: 1 };
      const heir = G.Img.chain.heroPortrait(s.player, 22)[0];
      s.player.generation = 1; delete s.player.heir; s.player.look = G.GOLD.look;
      return { result, heir };
    });
    for (const row of report.portraits.result) {
      assert.equal(row.face, 'portraits/story-player/' + (row.age < 40 ? 'adrian' : 'adrian_reference_' + (row.age < 70 ? 'thirties' : 'elderly')));
      assert.equal(row.half, row.face + '_half'); assert(row.loaded); assert.equal(row.walk, 'characters/blackcoat_captain/motion/walk');
    }
    assert(report.portraits.heir.startsWith('portraits/family/'));
    // 프롤로그의 실제 대화·선택을 끝까지 진행한다. 출항 완료를 확인한다.
    await p.evaluate(() => { window.qaSay = G.UI.say; });
    report.prologueActions=0;
    const prologueDeadline=Date.now()+180000;
    while(!await p.evaluate(()=>!!G.Game.state.gold.prologue&&G.Game.sceneName==='sea')){
      if(Date.now()>prologueDeadline){
        const debug=await p.evaluate(()=>({scene:G.Game.sceneName,prologue:G.Game.state.gold.prologue,busy:G.UI.busy(),body:document.body.innerText.slice(-8000),focus:document.activeElement?.outerHTML}));
        fs.writeFileSync(path.join(out,'failure-gold-prologue.json'),JSON.stringify(debug,null,2));
        await p.screenshot({path:path.join(out,'failure-gold-prologue.png')});
        throw new Error('실제 프롤로그 출항 대기 초과: '+JSON.stringify(debug));
      }
      const choice=p.locator('.askrow button:enabled:visible').first();
      if(await choice.count()){await choice.click();report.prologueActions++;}
      else if(await p.locator('.dlg:visible').count()){await p.keyboard.press('Enter');report.prologueActions++;}
      await p.waitForTimeout(450);
    }
    report.portraits.legacyRoundTrip=await p.evaluate(()=>{
      const original = G.Game.state; original.player.look = 'noble_scholar';
      G.Game.state = G.State.deserialize(G.State.serialize());
      const legacyRoundTrip = {look:G.Img.heroLook(),face:G.Img.pick(G.Img.chain.heroPortrait(G.Game.state.player,22)),gold:!!G.Game.state.gold};
      G.Game.state = original; original.player.look = G.GOLD.look;
      return legacyRoundTrip;
    });
    assert.deepEqual(report.portraits.legacyRoundTrip,{look:'blackcoat_captain',face:'portraits/story-player/adrian',gold:true});
    await p.evaluate(() => G.Game.go('city', { cityId: 24 }));
    await p.waitForFunction(() => G.Town && G.Town.active());
    await p.evaluate(async () => {
      const player = G.Game.state.player, key = G.Img.chain.heroHalf(player)[0]; await G.Img.load(key);
      G.Info.open('admiral');
    });
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(out, '04-adrian-town-profile.png') });
    report.finish = await p.evaluate(() => ({ scene: G.Game.sceneName, prologue: G.Game.state.gold.prologue, face: G.Img.pick(G.Art.portraitKeys(G.Game.state.player.portrait)), half: G.Img.pick(G.Img.chain.heroHalf()) }));
    assert.equal(report.finish.face, 'portraits/story-player/adrian'); assert.equal(report.finish.half, report.finish.face + '_half');
    await p.keyboard.press('Escape');
    await p.evaluate(() => { G.UI.say = qaSay; window.qaDialogue = G.UI.say('길을 살게요. 길이 얼마인지는 아직 모르지만.', G.GoldSea.who('P')); });
    await p.waitForSelector('.dlg'); await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(out, '05-adrian-town-dialogue.png') });
    await p.keyboard.press('Enter'); await p.evaluate(() => qaDialogue);
    // 다른 이야기들도 같은 시작 경로로 실제 상태와 첫 도시를 연다.
    report.otherStories = [];
    for (const id of ['photo', 'jhook', 'song']) {
      await p.evaluate(id => {
        G.UI.say = async () => {}; G.UI.ask = async () => 0;
        const api = id === 'photo' ? G.Story : id === 'jhook' ? G.JHook : G.SongStory;
        api.prologue = async () => {};
        G.Game.go('title'); window.qaDone = false;
        G.StorySelect.open().then(() => qaDone = true);
      }, id);
      await p.locator('.ss-card[data-story="' + id + '"]').click();
      await p.locator('.ss-go').focus(); await p.keyboard.press('Enter');
      await p.waitForFunction(() => qaDone && G.Game.sceneName === 'city' && !G.Loader.busy(), null, { timeout: 180000 });
      const item = await p.evaluate(id => ({ id, scene: G.Game.sceneName, active: !!G.Game.state[id === 'photo' ? 'story' : id], city: G.Game.state.loc.city }), id);
      assert(item.active); report.otherStories.push(item);
    }
    assert.deepEqual(errors, []); report.errors = errors;
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
