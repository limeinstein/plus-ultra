/* 요청한 1~20번 무릎상·22~37번 얼굴상의 실제 픽셀과 대화창 배치. 원화는 쓰지 않는다. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert'), {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/portrait-position-fix-20261108');
const cases = [
  {"number":1,"name":"페드로 데 알바라도","key":"portraits/history/alvarado_half","mode":"half"},
  {"number":2,"name":"디오구 드 아잠부자","key":"portraits/history/azambuja_half","mode":"half"},
  {"number":3,"name":"베르날 디아스 델 카스티요","key":"portraits/history/bernal_half","mode":"half"},
  {"number":4,"name":"카라만사","key":"portraits/history/caramansa_half","mode":"half"},
  {"number":5,"name":"페르낭 드 소우자","key":"portraits/history/fsousa_half","mode":"half"},
  {"number":6,"name":"안토니우 다 가에타 신부","key":"portraits/history/gaeta_half","mode":"half"},
  {"number":7,"name":"주앙 코헤이아 드 소우자","key":"portraits/history/jcsousa_half","mode":"half"},
  {"number":8,"name":"음벰바 아 은징가 왕자","key":"portraits/history/kongo_afonso_half","mode":"half"},
  {"number":9,"name":"마니 콩고 은징가 아 은쿠우","key":"portraits/history/kongo_nkuwu_half","mode":"half"},
  {"number":10,"name":"은사쿠","key":"portraits/history/kongo_nsaku_half","mode":"half"},
  {"number":11,"name":"주앙 다 실바 (은사쿠)","key":"portraits/history/kongo_nsaku_envoy_half","mode":"half"},
  {"number":12,"name":"콩고 사제","key":"portraits/history/kongo_priest_half","mode":"half"},
  {"number":13,"name":"마니 소요 (소요의 주인)","key":"portraits/history/kongo_soyo_half","mode":"half"},
  {"number":14,"name":"두 마을의 노인","key":"portraits/history/mina_elder_half","mode":"half"},
  {"number":15,"name":"서인도 회사의 상관장","key":"portraits/history/mina_factor_half","mode":"half"},
  {"number":16,"name":"늙은 오랑우탄","key":"portraits/history/mowgli_ape_half","mode":"half"},
  {"number":17,"name":"판필로 데 나르바에스","key":"portraits/history/narvaez_half","mode":"half"},
  {"number":18,"name":"임방갈라 전사","key":"portraits/history/nzinga_imb_half","mode":"half"},
  {"number":19,"name":"네덜란드 서인도 회사 사령관","key":"portraits/history/nzinga_wic_half","mode":"half"},
  {"number":20,"name":"살바도르 코헤이아 드 사","key":"portraits/history/salvador_sa_half","mode":"half"},
  {"number":22,"name":"광해군","key":"portraits/history/br_gwanghae_king","mode":"face"},
  {"number":23,"name":"쉴레이만 1세","key":"portraits/history/ot_suleyman","mode":"face"},
  {"number":24,"name":"아프리카 여급 공통 08번","key":"maid-styles/africa/8","mode":"face"},
  {"number":25,"name":"아프리카 여급 공통 10번","key":"maid-styles/africa/10","mode":"face"},
  {"number":26,"name":"아프리카 여급 공통 12번","key":"maid-styles/africa/12","mode":"face"},
  {"number":27,"name":"일본 여급 공통 01번","key":"maid-styles/japan/1","mode":"face"},
  {"number":28,"name":"일본 여급 공통 02번","key":"maid-styles/japan/2","mode":"face"},
  {"number":29,"name":"일본 여급 공통 03번","key":"maid-styles/japan/3","mode":"face"},
  {"number":30,"name":"일본 여급 공통 04번","key":"maid-styles/japan/4","mode":"face"},
  {"number":31,"name":"일본 여급 공통 05번","key":"maid-styles/japan/5","mode":"face"},
  {"number":32,"name":"일본 여급 공통 06번","key":"maid-styles/japan/6","mode":"face"},
  {"number":33,"name":"일본 여급 공통 07번","key":"maid-styles/japan/7","mode":"face"},
  {"number":34,"name":"오츠루 (일본 여급 공통 08번)","key":"maid-styles/japan/8","mode":"face"},
  {"number":35,"name":"일본 여급 공통 09번","key":"maid-styles/japan/9","mode":"face"},
  {"number":36,"name":"오논타 (아메리카 원주민 여급 공통 01번)","key":"maid-styles/native/1","mode":"face"},
  {"number":37,"name":"아메리카 원주민 여급 공통 06번","key":"maid-styles/native/6","mode":"face"}
];
const controls = [
  {number:21, name:'탑의 위병', key:'portraits/history/tudor_tower_guard_half', mode:'half'},
  {number:0, name:'토머스 다우티', key:'portraits/history/dc_doughty_half', mode:'half'},
  {number:-1, name:'토머스 다우티 얼굴상', key:'portraits/history/dc_doughty', mode:'face'}
];
fs.mkdirSync(OUT, {recursive:true});
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors = [], failed = [], rows = [];
  try {
    const context = await browser.newContext({viewport:{width:1280,height:800}});
    await context.route('https://fonts.googleapis.com/**', r => r.fulfill({status:200,contentType:'text/css',body:''}));
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', r => { if (r.resourceType() === 'image') failed.push(r.url()); });
    await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => cb.name === 'loop' ? 0 : raf(cb); });
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(() => window.G && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout:120000});
    await page.evaluate(async () => {
      const s = G.Game.state = G.State.newGame({name:'위치 검토 제독',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},
        st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(() => 3),diff:'normal'});
      Object.assign(s.settings,{res:.35,sound:0,music:0}); await G.Game.ensureGeo(); await G.Game.go('city',{cityId:8,load:true});
      if (G.Town?.active()) G.Town.hidden(true);
      G.Game.setScene(G.Scenes.city.view(G.CITY_DATA[8])); G.Game.showLayers(false,false,true);
      const st = document.createElement('style'); st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'; document.head.appendChild(st);
      window.__frameFix = {bottom:G.FX.stand.frameBottom, faces:G.FX.portraitFace.frames};
      window.__alphaBounds = {};
    });
    const scope = await page.evaluate(() => ({halves:Object.keys(__frameFix.bottom), faces:Object.keys(__frameFix.faces)}));
    assert.deepStrictEqual(scope.halves.sort(), cases.filter(x => x.mode === 'half').map(x => x.key).sort());
    assert.deepStrictEqual(scope.faces.sort(), cases.filter(x => x.mode === 'face').map(x => x.key).sort());
    for (const viewport of [{width:1280,height:800},{width:960,height:600}]) {
      await page.setViewportSize(viewport);
      const folder = path.join(OUT, String(viewport.width)); fs.mkdirSync(folder,{recursive:true});
      for (const item of [...cases,...controls]) {
        const run = {number:item.number, name:item.name, key:item.key, mode:item.mode, width:viewport.width};
        for (const phase of ['before','after']) {
          await page.evaluate(async ({item,phase}) => {
            G.FX.stand.frameBottom = phase === 'after' ? __frameFix.bottom : {};
            G.FX.portraitFace.frames = phase === 'after' ? __frameFix.faces : {};
            const face = item.mode === 'half' ? item.key.replace(/_half$/, '') : item.key;
            const half = item.mode === 'half' ? item.key : null;
            const frame = G.FX.portraitFace.frames[face];
            await Promise.all([face,half,frame?.source].filter(Boolean).map(k => G.Img.load(k)));
            window.__positionDialog = G.UI.say('원화의 머리 위치와 대화창 위 빈틈을 확인합니다.',{
              name:item.name, portrait:G.Art.withImg({},[face]), half:half?[half]:null, special:true, noStand:item.mode === 'face'
            });
          }, {item,phase});
          await page.waitForSelector('.dlg');
          if (item.mode === 'half') await page.waitForFunction(() => {
            const img = document.querySelector('.dlg-actor.active.tall img'); return img?.complete && img.naturalWidth;
          });
          else await page.waitForFunction(() => document.querySelector('.dlg .pframe canvas[data-img]'));
          await page.waitForTimeout(60);
          const m = await page.evaluate(({item,phase}) => {
            if (item.mode === 'half') {
              const a = document.querySelector('.dlg-actor.active.tall'), img = a.querySelector('img'), ir = img.getBoundingClientRect();
              let bounds = __alphaBounds[item.key];
              if (!bounds) {
                const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
                const g = cv.getContext('2d',{willReadFrequently:true}); g.drawImage(img,0,0);
                const d = g.getImageData(0,0,cv.width,cv.height).data; let y1 = cv.height, y2 = 0;
                for (let y=0;y<cv.height;y++) for (let x=0;x<cv.width;x++) if (d[(y*cv.width+x)*4+3] > 40) {y1=Math.min(y1,y); y2=Math.max(y2,y+1);}
                bounds = __alphaBounds[item.key] = [y1,y2];
              }
              const scale = Math.min(ir.width/img.naturalWidth,ir.height/img.naturalHeight), drawnHeight = img.naturalHeight*scale;
              const drawnTop = ir.bottom-drawnHeight, dialogTop = document.querySelector('.dlg').getBoundingClientRect().top;
              const rect = a.getBoundingClientRect();
              return {bottomGap:dialogTop-(drawnTop+bounds[1]*scale),visibleTop:drawnTop+bounds[0]*scale,
                actor:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},frameBottom:a.dataset.frameBottom || null,
                stageFaces:G.UI.stageInfo?.faces};
            }
            const cv = document.querySelector('.dlg .pframe canvas'), g = cv.getContext('2d',{willReadFrequently:true});
            const d = g.getImageData(0,0,cv.width,cv.height).data, bg=[26,18,12]; let last=-1;
            for (let y=0;y<cv.height;y++) for (let x=0;x<cv.width;x++) {
              const i=(y*cv.width+x)*4;
              if (d[i+3]>40 && Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2])>24) last=Math.max(last,y);
            }
            const frame = phase === 'after' ? G.FX.portraitFace.frames[item.key] : null;
            const f = G.PORTRAIT_FACES[frame?.source || item.key], r=frame?.rect || [0,0,1,1];
            return {source:cv.dataset.img,framed:cv.dataset.portraitFrame || null,pixels:cv.toDataURL('image/png'),
              bottomEmpty:(cv.height-last-1)/cv.height,
              faceCenterY:f ? (f.box[1]+f.box[3]/2-r[1])/r[3] : null};
          }, {item,phase});
          if (m.pixels) {fs.writeFileSync(path.join(folder,`${item.number}-${phase}-face.png`),Buffer.from(m.pixels.split(',')[1],'base64')); delete m.pixels;}
          const file = `${viewport.width}/${item.number}-${phase}.png`;
          await page.screenshot({path:path.join(OUT,file)}); run[phase]={...m,file};
          await page.waitForTimeout(250); // 대화 시작 직후의 중복 입력 방지 시간이 지난 뒤 닫는다.
          await page.keyboard.press('Enter');
          await page.waitForFunction(() => !document.querySelector('.dlg'));
          await page.evaluate(() => window.__positionDialog);
        }
        if (item.number >= 1 && item.number <= 20) {
          assert(run.before.bottomGap>50, `${item.number}번: 수정 전 빈틈 재현`);
          assert(run.after.bottomGap>=-12 && run.after.bottomGap<=2, `${item.number}번: 하단 붙이기 ${run.after.bottomGap}`);
          assert(run.after.visibleTop>=35, `${item.number}번: 화면 위로 벗어나지 않음`);
          assert(run.after.stageFaces?.length>=1, `${item.number}번: 얼굴 보호 영역 유지`);
        } else if (item.number >= 24) {
          assert(run.before.bottomEmpty>.085, `${item.number}번: 수정 전 여백 재현`);
          assert(run.after.bottomEmpty<.025, `${item.number}번: 하단 여백 제거 ${run.after.bottomEmpty}`);
        } else if (item.number === 22 || item.number === 23) {
          assert(run.after.faceCenterY>.38 && run.after.faceCenterY<.58, `${item.number}번: 얼굴 중심 ${run.after.faceCenterY}`);
          assert(run.before.faceCenterY-run.after.faceCenterY>.15, `${item.number}번: 낮은 얼굴 올림`);
        } else {
          for (const k of item.mode === 'half' ? ['bottomGap','visibleTop'] : ['bottomEmpty','faceCenterY']) assert.strictEqual(run.before[k],run.after[k],`대조군 ${item.number}: ${k} 유지`);
        }
        rows.push(run);
        fs.writeFileSync(path.join(OUT,'progress.json'),JSON.stringify({rows,errors,failed},null,2));
      }
      // 두 무릎상을 쓸 수 없어 액자 밖의 얼굴 둘로 바뀌는 구도도 확인한다.
      for (const item of cases.filter(x => x.mode === 'face')) {
        await page.evaluate(async item => {
          G.FX.stand.frameBottom=__frameFix.bottom; G.FX.portraitFace.frames=__frameFix.faces;
          window.__positionDialog=G.UI.say('얼굴 둘로 대화할 때도 수정한 구도를 씁니다.',{name:item.name,portrait:G.Art.withImg({},[item.key]),noHalf:true,special:true});
        }, item);
        await page.waitForSelector('.dlg-actor.active.bust canvas[data-portrait-frame]');
        const bust=await page.evaluate(() => {
          const c=document.querySelector('.dlg-actor.active.bust canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          return {key:c.dataset.portraitFrame,transparent:d[3]===0 || d[(c.width-1)*4+3]===0};
        });
        assert.strictEqual(bust.key,item.key); assert(bust.transparent,`${item.number}번: 얼굴 뒤 네모 배경 없음`);
        if ([22,23,34].includes(item.number)) await page.screenshot({path:path.join(folder,`${item.number}-bust.png`)});
        await page.waitForTimeout(250);
        await page.keyboard.press('Enter'); await page.waitForFunction(() => !document.querySelector('.dlg'));
        await page.evaluate(() => window.__positionDialog);
      }
      console.log(`${viewport.width}px: 수정 대상 36종·대조군 3종·얼굴 대화 16종 확인`);
    }
    assert.deepStrictEqual(errors,[]); assert.deepStrictEqual(failed,[]);
    fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({rows,errors,failed,scope},null,2));
    console.log(JSON.stringify({comparisons:rows.length,dialogScreens:rows.length*2,bustChecks:32,errors,failed}));
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode=1;});
