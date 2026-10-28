/* 역사 이벤트 인물 17쌍·장면 16장: 실제 읽기·대화 얼굴상·장면 액자 검사. */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let pw;
try { pw = require('playwright'); }
catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/history-event-art-20261028');
const assets = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/history_event_art_prompts.json'), 'utf8')).assets;
function ok(v, message) { if (!v) throw new Error(message); }

(async () => {
  const browser = await pw.chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const decoded = await page.evaluate(async assets => {
      const output = [];
      for (const a of assets) {
        const keys = a.type === 'portrait' ? ['portraits/history/' + a.id, 'portraits/history/' + a.id + '_half'] : ['legend-events/' + a.id];
        for (const key of keys) {
          if (!G.Img.has(key)) throw new Error('등록 누락: ' + key);
          const im = await G.Img.load(key);
          if (!im || !im.naturalWidth) throw new Error('읽기 실패: ' + key);
          const expected = a.type === 'scene' ? [1881,836] : key.endsWith('_half') ? [1024,1536] : [448,448];
          if (im.naturalWidth !== expected[0] || im.naturalHeight !== expected[1]) throw new Error('규격 오류: ' + key);
          if (key.endsWith('_half')) {
            const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1536;
            const c = canvas.getContext('2d'); c.drawImage(im,0,0);
            if (c.getImageData(0,0,1,1).data[3] !== 0 || c.getImageData(1023,0,1,1).data[3] !== 0) throw new Error('투명 여백 오류: ' + key);
          }
          output.push({ key, width: im.naturalWidth, height: im.naturalHeight });
        }
      }
      const figures = G.MUGHAL_FIGS.concat(G.GOAMAL_FIGS,G.GOAMAL_EXTRA_FIGS);
      for (const id of figures) {
        const who = G.Hist.speaker(id);
        if (G.Img.pick(who.half) !== 'portraits/history/' + id + '_half') throw new Error('무릎상 연결 오류: ' + id);
      }
      return output;
    }, assets);
    ok(decoded.length === 50, '새 자산 50개 누락');
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name:'역사 그림 검수',nation:'PT',job:'adventurer',age:30,
        birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(() => 3),diff:'normal' });
      G.Game.state.settings.res = .35;
      G.Game.state.settings.autosave = false;
      G.Game.state.flags.prologue = true;
      G.UI.fade = async fn => { await fn(); };
      G.Game.go('city',{cityId:0});
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city');
    await page.waitForTimeout(2200); // 첫 도시의 메뉴와 거리 그림 준비가 끝난 뒤 대화를 연다.
    await page.waitForFunction(() => !document.querySelector('.toast'),null,{timeout:10000});
    for (const spec of [
      { key:'teppo_offer',id:'teppo_tokichiro',name:'기노시타 도키치로' },
      { key:'mughal_garden',id:'babur',name:'바부르' },
      { key:'goa_council',id:'albuquerque',name:'아폰수 드 알부케르크' }
    ]) {
      await page.evaluate(spec => {
        const key = 'portraits/history/' + spec.id;
        const who = G.HIST_FIG[spec.id] ? G.Hist.speaker(spec.id) : {
          name:spec.name,portrait:G.Art.withImg(G.Art.npcSpec(spec.id,'soldier','jp','m'),[key]),half:[key+'_half'],lang:3
        };
        window.artSpeaker = who;
        window.artScene = G.FamEv.showPic({img:'legend-events/'+spec.key,title:spec.name});
        window.artSaid = false;
        window.artTalk = G.UI.say('바다를 건너온 손님을 맞이한다.',who).then(() => { window.artSaid = true; });
      }, spec);
      await page.waitForFunction(() => {
        const im = document.querySelector('.famscene img');
        return im && im.complete && im.naturalWidth === 1881;
      }, null, { timeout: 30000 });
      // legend-events 장면은 그림 속 인물을 가리지 않도록 서 있는 무릎상을 숨기고
      // 대화창 안 얼굴상을 쓰는 것이 실제 UI 규칙(js/systems/familyevent.js)이다.
      await page.waitForSelector('.dlg .pframe', { state: 'attached', timeout: 30000 });
      await page.screenshot({path:path.join(OUT,spec.key+'-in-game.png')});
      for (let i=0;i<6 && !await page.evaluate(() => window.artSaid);i++) { await page.keyboard.press('Space'); await page.waitForTimeout(100); }
      await page.evaluate(async () => { await window.artTalk; await window.artScene.stop(); });
      ok(await page.locator('.famscene').count() === 0, '그림 정리 실패');
      await page.evaluate(() => {
        window.artSaid = false;
        window.artTalk = G.UI.say('새 인물의 얼굴과 무릎상.',window.artSpeaker).then(() => { window.artSaid=true; });
      });
      await page.waitForFunction(() => document.querySelector('.dlg-actor.tall'),null,{timeout:30000});
      await page.waitForTimeout(900); // 무릎상 리그의 비동기 그림 읽기와 등장 전환을 기다린다.
      await page.screenshot({path:path.join(OUT,spec.id+'-portrait-in-game.png')});
      for (let i=0;i<6 && !await page.evaluate(() => window.artSaid);i++) { await page.keyboard.press('Space'); await page.waitForTimeout(100); }
      await page.evaluate(() => window.artTalk);
    }
    ok(!errors.length, errors.join('\n'));
    fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify({decoded,errors},null,2));
    console.log('얼굴상 17 · 무릎상 17 · 이벤트 샷 16: 실제 읽기·세 사건 얼굴 대화/장면 통과, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
