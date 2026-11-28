/* 아르슬란 전용 초상·컷신의 실제 파일 실행과 대사 분기 검사. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      localStorage.setItem('pu.lang', 'ko');
      const raf = requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => (cb.name === 'loop'||String(cb).includes('.frameDue(')&&String(cb).includes('.scene.update(')) ? 0 : raf(cb);
    });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(__dirname, '..', 'index.html')).href), { waitUntil: 'commit', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = await G.Arslan.start();
      s.settings.res = .35;
      s.arslan.prologue = 1; s.arslan.pro = 4;
      G.Game.go('city', { cityId: G.ARSLAN.home, load: true });
    });
    const counts = await page.evaluate(async () => {
      const art = G.STORY_ART.arslan;
      for (const p of art.portraits) {
        for (const suffix of ['', '_half']) {
          const key = p.img + suffix;
          const img = new Image(); img.src = G.Img.src(key); await img.decode();
          if (img.naturalWidth !== (suffix ? 1024 : 512) || img.naturalHeight !== (suffix ? 1536 : 512)) throw Error(key);
        }
      }
      for (const shot of art.gallery) {
        if (!await G.StoryArt.show(shot.img, shot.title)) throw Error(shot.img);
        const img = document.querySelector('.story-art-shot.on img') || document.querySelector('.story-art-shot img');
        await img.decode();
        if (getComputedStyle(img).objectFit !== 'contain' || img.naturalWidth * 4 !== img.naturalHeight * 9 ||
            img.parentElement.clientWidth * img.naturalHeight !== img.parentElement.clientHeight * img.naturalWidth) {
          throw Error('액자 비율 ' + shot.img + ' ' + img.parentElement.clientWidth + '×' + img.parentElement.clientHeight);
        }
        await G.StoryArt.end();
      }
      return [new Set(art.portraits.map(x => x.img)).size, new Set(art.gallery.map(x => x.img)).size];
    });
    assert.deepEqual(counts, [72, 34]);
    const route = await page.evaluate(async () => {
      const D = G.ARSLAN, art = G.STORY_ART.arslan, shown = [], selected = [];
      const orig = { show: G.StoryArt.show, say: G.UI.say, ask: G.UI.ask };
      const state = G.Game.state, oldMates = state.mates;
      try {
        G.StoryArt.show = async key => { shown.push(key); return true; };
        G.UI.say = async () => {};
        G.UI.ask = async (_q, opts) => opts[0].value;
        state.mates = D.crew.map(id => ({ id }));
        const scenes = new Map(D.beats.map(b => [b.id, b.lines]));
        D.prologue.stages.forEach(s => scenes.set('pro_' + s.id, s.lines));
        const returns = { pro_market: '01-fare', f_rome: '21-stage', f_bed: '22-bed' };
        for (const id of Object.keys(art.beats)) {
          const start = shown.length;
          await G.Arslan.play(scenes.get(id), id);
          if (returns[id]) {
            const cues = shown.slice(start);
            if (cues.length !== 3 || cues[0] !== cues[2] || cues[2] !== 'arslan/cuts/' + returns[id]) throw Error(id);
          }
        }
        const missing = art.gallery.filter(s => !shown.includes(s.img)).map(s => s.img);
        for (const pick of [0, 1]) {
          shown.length = 0;
          G.UI.ask = async (_q, opts) => opts[pick].value;
          await G.Arslan.play(scenes.get('w_aylin'), 'w_aylin');
          selected.push(shown.includes('arslan/cuts/19-buckle'));
        }
        shown.length = 0; state.mates = [];
        await G.Arslan.play(scenes.get('f_rome'), 'f_rome');
        return { missing, selected, keys: shown.includes('arslan/cuts/21b-keys') };
      } finally {
        G.StoryArt.show = orig.show; G.UI.say = orig.say; G.UI.ask = orig.ask; state.mates = oldMates;
      }
    });
    assert.deepEqual(route, { missing: [], selected: [true, false], keys: true });
    const speakers = await page.evaluate(() => {
      const expected = [
        ['DL', 'pro_market', 'npc/ar_DL_late'], ['YA', 'pro_market', 'npc/ar_YA'],
        ['JM', 'f_bed', 'npc/ar_JM_ward'], ['KR', 'a4_kemal', 'npc/ar_KR'],
        ['KR', 'a4_ott_head', 'npc/ar_KR_admiral'], ['IN', 'f_rome', 'mates/ar_inaya_solemn'],
        ['LP', 'r_prince', 'npc/ar_LP'], ['SH', 'r_sche', 'npc/ar_SH'],
        ['HG', 'a5_sakai', 'npc/ar_HG'], ['WD', 'a5_sakai', 'npc/ar_WD']
      ];
      return expected.flatMap(([speaker, beat, path]) => {
        const who = G.Arslan.who(speaker, beat), key = 'portraits/' + path;
        const face = G.Img.pick(G.Art.portraitKeys(who.portrait)), half = G.Img.pick(who.half);
        return face === key && half === key + '_half' ? [] : [{ speaker, beat, key, face, half }];
      });
    });
    assert.deepEqual(speakers, []);
    const guestFaces = await page.evaluate(() => {
      const state = G.Game.state, arslan = state.arslan;
      function paired(id, face) {
        return G.Img.pick(G.Art.portraitKeys(G.Scenes.mateSpec(id))) === face &&
          G.Img.pick(G.Img.chain.mateHalf(id)) === face + '_half';
      }
      function inStory() {
        return paired('little_prince', 'portraits/npc/ar_LP') && paired('scheherazade', 'portraits/npc/ar_SH');
      }
      if (!inStory()) return false;
      try {
        state.arslan = null;
        if (inStory()) return false;
      } finally { state.arslan = arslan; }
      return inStory();
    });
    assert(guestFaces);
    const output = process.env.OUT || path.join(__dirname, '_out', 'arslan-20261128');
    fs.mkdirSync(output, { recursive: true });
    await page.evaluate(() => {
      const cue = G.STORY_ART.arslan.beats.pro_market[0];
      const ln = G.ARSLAN.prologue.stages[0].lines.find(line => Array.isArray(line) && line[1].includes(cue.text));
      window.arslanProofDialog = G.Arslan.play([ln], 'pro_market');
    });
    await page.waitForSelector('.story-art-shot.on');
    await page.waitForSelector('.dlg');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(output, 'event-market.png') });
    await page.keyboard.press('Enter');
    await page.evaluate(async () => { await window.arslanProofDialog; G.Info.open('arslan'); });
    await page.getByRole('button', { name: '인물 초상 72쌍' }).click();
    const cards = page.locator('.story-art-gallery .story-art-card');
    assert.equal(await cards.count(), 72);
    await cards.filter({ hasText: '딜샤드 · 말년' }).click();
    await page.locator('.story-portrait-pair img').last().evaluate(async img => { await img.decode(); });
    await page.screenshot({ path: path.join(output, 'portrait-dilshad.png') });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output,'browser-checks.json'),JSON.stringify({...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),counts,route,speakers,guestFaces,errors},null,2));
    console.log('이벤트샷 34장 · 9:4 액자 · 초상 72쌍 · 선택 분기와 화자 · 수첩 확대 · 브라우저 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
