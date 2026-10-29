/* 역사 이벤트의 실제 이미지 읽기·대화 얼굴상·무릎상·장면 액자 검사. */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let pw;
try { pw = require('playwright'); }
catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..');
const other = process.env.EVENT_ART_SET === 'other';
const dutch = process.env.EVENT_ART_SET === 'dutch';
const gap = process.env.EVENT_ART_SET === 'gap';
const addon = process.env.EVENT_ART_SET === 'addon';
const sky = process.env.EVENT_ART_SET === 'sky';
const suite = sky ? 'sky' : addon ? 'history_addon' : gap ? 'history_gap' : dutch ? 'dutch' : other ? 'other' : 'history';
const OUT = path.join(ROOT, 'artifacts', sky ? 'sky-event-art-20261029' : addon ? 'history-addon-art-20261029' : gap ? 'history-gap-art-20261029' : suite + '-event-art-20261028');
const artData = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', gap || addon ? suite + '_art_prompts.json' : suite + '_event_art_prompts.json'), 'utf8'));
const assets = artData.assets;
const expectedCount = assets.reduce((n,a) => n + (a.type === 'portrait' ? 2 : 1),0);
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
    // file://의 많은 병렬 스크립트를 지연시키는 요청 가로채기를 쓰지 않는다.
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout:90000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const decoded = await page.evaluate(async assets => {
      const output = [];
      for (const a of assets) {
        const prefix = a.portrait_dir || 'portraits/history';
        const keys = a.type === 'portrait' ? [prefix + '/' + a.id, prefix + '/' + a.id + '_half'] : ['legend-events/' + a.id];
        for (const key of keys) {
          if (!G.Img.has(key)) throw new Error('등록 누락: ' + key);
          const im = await G.Img.load(key);
          if (!im || !im.naturalWidth) throw new Error('읽기 실패: ' + key);
          const expected = a.type === 'scene' ? [1881,836] : key.endsWith('_half') ? [1024,1536] : null;
          if (expected && (im.naturalWidth !== expected[0] || im.naturalHeight !== expected[1])) throw new Error('규격 오류: ' + key);
          // 초기 역사 얼굴상은 448 정사각, 새 얼굴상은 1024 정사각이다. 어느 쪽도 배포 때 축소하지 않는다.
          if (!expected && (im.naturalWidth !== im.naturalHeight || im.naturalWidth < 448)) throw new Error('얼굴상 해상도 오류: ' + key);
          if (key.endsWith('_half')) {
            const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1536;
            const c = canvas.getContext('2d'); c.drawImage(im,0,0);
            if (c.getImageData(0,0,1,1).data[3] !== 0 || c.getImageData(1023,0,1,1).data[3] !== 0) throw new Error('투명 여백 오류: ' + key);
          }
          output.push({ key, width: im.naturalWidth, height: im.naturalHeight });
        }
      }
      const figures = assets.filter(a => a.type === 'portrait' && G.HIST_FIG[a.id]).map(a => a.id);
      for (const id of figures) {
        const who = G.Hist.speaker(id);
        if (G.Img.pick(who.half) !== 'portraits/history/' + id + '_half') throw new Error('무릎상 연결 오류: ' + id);
      }
      for (const a of assets.filter(a => a.portrait_dir === 'portraits/legendary')) {
        if (G.Img.pick(G.Img.chain.mateHalf(a.id)) !== a.portrait_dir + '/' + a.id + '_half') throw new Error('동료 무릎상 연결 오류: ' + a.id);
      }
      return output;
    }, assets);
    ok(decoded.length === expectedCount, '새 자산 누락: ' + decoded.length + '/' + expectedCount);
    const historyFigureMissing = await page.evaluate(() => Object.keys(G.HIST_FIG).filter(id =>
      !G.Hist.faceKeys(id).some(k => G.Img.has(k) && G.Img.has(k+'_half'))));
    // 병행 작업의 누락도 기록한다. 해당 작업이 진행 중일 때만 전체 검사 중단을 명시적으로 해제한다.
    if (process.env.EVENT_ART_SKIP_GLOBAL_HISTORY_CHECK !== '1') {
      ok(!historyFigureMissing.length, '역사 화자 초상 한 쌍 누락: ' + historyFigureMissing.join(', '));
    }
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
    const cases = sky || addon ? artData.cases : gap ? [
      { key:'barb_charles_audience',id:'charles',name:'카를 5세' },
      { key:'barb_toulon_winter',id:'hayreddin',name:'하이레딘 파샤' },
      { key:'barb_genoa_ransom',id:'turgut',name:'투르구트 레이스' },
      { key:'tudor_marriage_petition',id:'gardiner',name:'스티븐 가디너' },
      { key:'calais_fireships',id:'tudor_tower_guard',name:'탑의 위병' },
      { key:'calais_council',id:'howard',name:'찰스 하워드' },
      { key:'lepanto_allied_council',id:'donjuan',name:'돈 후안' },
      { key:'lepanto_ottoman_council',id:'alipasha',name:'알리 파샤' },
      { key:'tudor_rome_petition',id:'papal_legate',name:'교황의 사절' },
      { key:'calais_spanish_council',id:'medina',name:'메디나 시도니아 공작' }
    ] : dutch ? [
      { key:'dutch_summer',id:'halina',name:'할리나',legend:true },
      { key:'dutch_summer',id:'verberk',name:'페르베르크',legend:true },
      { key:'dutch_canal',id:'nl_jan',name:'얀' },
      { key:'dutch_manor',id:'nl_pieter',name:'피터르' },
      { key:'dutch_canal',id:'nl_dirk',name:'디르크' }
    ] : other ? [
      { key:'mina_meeting',id:'caramansa',name:'카라만사' },
      { key:'mina_stones',id:'mina_trader',name:'아칸 상인' },
      { key:'mina_door',id:'mina_mother',name:'엘미나의 여인' },
      { key:'nzinga_chair',id:'njinga',name:'은징가' },
      { key:'nzinga_kifunji',id:'kifunji',name:'키푼지' },
      { key:'nzinga_kambu',id:'kambu',name:'캄부' },
      { key:'kongo_baptism',id:'kongo_leonor',name:'레오노르 왕비' },
      { key:'mowgli_riddle',id:'mowgli_ape',name:'늙은 오랑우탄' },
      { key:'kongo_lisbon2',id:'kongo_nsaku_envoy',name:'주앙 다 실바' }
    ] : [
      { key:'teppo_offer',id:'teppo_tokichiro',name:'기노시타 도키치로' },
      { key:'mughal_garden',id:'babur',name:'바부르' },
      { key:'goa_council',id:'albuquerque',name:'아폰수 드 알부케르크' }
    ];
    for (const spec of cases) {
      await page.evaluate(spec => {
        const key = 'portraits/history/' + spec.id;
        const who = spec.rival ? { name:spec.rival,portrait:G.Art.rivalSpec(spec.rival),half:G.Img.chain.rivalHalf(spec.rival),lang:3 } : spec.legend ? G.Legend.speaker(spec.id) : G.HIST_FIG[spec.id] ? G.Hist.speaker(spec.id) : {
          name:spec.name,portrait:G.Art.withImg(G.Art.npcSpec(spec.id,'soldier','jp','m'),[key]),half:[key+'_half'],lang:3,rigNoFace:spec.id==='mowgli_ape'
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
      await page.waitForFunction(() => {
        const scene = document.querySelector('.famscene');
        return scene && Number(getComputedStyle(scene).opacity) >= .999;
      });
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
    fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify({decoded,cases,historyFigureCount:await page.evaluate(()=>Object.keys(G.HIST_FIG).length),historyFigureMissing,errors},null,2));
    console.log('새 자산 ' + expectedCount + '개: 실제 읽기·' + cases.length + '개 사건 얼굴 대화/장면 통과, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
