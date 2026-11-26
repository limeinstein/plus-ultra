/* 누락 원화 연결·저장 호환·전체 초상 구도·여성 선택지를 실제 file:// 화면에서 확인한다. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'artifacts/story-art-20261124');
fs.mkdirSync(out, {recursive:true});
(async()=>{
 const browser = await chromium.launch({executablePath:process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=angle', '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[], report={};
 try {
  const p=await browser.newPage({viewport:{width:1600,height:1000}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','ko');window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await p.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title');
  report.layouts=await p.evaluate(()=>{
   const bad=Object.entries(G.PORTRAIT_LAYOUT).filter(([key,f])=>!G.Img.has(f.source)||!f.rect.every(Number.isFinite)||f.rect[2]<=0||f.rect[3]<=0);
   const missing=Object.keys(G.IMAGE_FILES).filter(k=>/^(portraits|maid-styles)\//.test(k)&&!k.endsWith('_half')&&!G.PORTRAIT_LAYOUT[k]);
   const ref=G.PORTRAIT_FACES['portraits/player/ganghui'],ty=(ref.eyes[1]+ref.eyes[3])/2;
   const geometry=Object.entries(G.PORTRAIT_LAYOUT).filter(([key,f])=>{const face=G.PORTRAIT_FACES[f.source];return !face||(!f.group&&(Math.abs(face.box[3]/f.rect[3]-ref.box[3])>1e-5||Math.abs(((face.eyes[1]+face.eyes[3])/2-f.rect[1])/f.rect[3]-ty)>1e-5));}).map(([key])=>key);
   return{count:Object.keys(G.PORTRAIT_LAYOUT).length,bad,missing,geometry,reference:G.PORTRAIT_LAYOUT['portraits/player/ganghui']};
  });
  assert.deepEqual(report.layouts.bad,[]);assert.deepEqual(report.layouts.missing,[]);assert.deepEqual(report.layouts.geometry,[]);assert(report.layouts.count>=4128);
  report.assets=await p.evaluate(async()=>{
   const keys=[...new Set(Object.values(G.STORY_ART).flatMap(x=>x.gallery.map(x=>x.img)))];
   const results=[];for(const key of keys){const im=await G.Img.load(key);results.push({key,loaded:!!im});}
   return results;
  });assert(report.assets.every(x=>x.loaded));assert.equal(report.assets.length,42);
  await p.evaluate(()=>G.Game.go('create'));
  await p.locator('#faceall').click();
  await p.waitForSelector('.create-face-card');
  report.choices=await p.evaluate(()=>({women:G.Img.heroFaces('f').length,men:G.Img.heroFaces('m').length,buttons:document.querySelectorAll('.create-face-card').length}));
  assert.equal(report.choices.women,15);assert.equal(report.choices.men,14);assert.equal(report.choices.buttons,29);
  await p.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.create-face-card canvas')].map(async cv=>{const key=cv.getAttribute('data-portrait-frame'),f=G.PORTRAIT_LAYOUT[key];if(f)await G.Img.load(f.source);}));});
  await p.waitForTimeout(800);await p.screenshot({path:path.join(out,'create-all-faces.png')});
  await p.locator('.create-face-tabs [data-sex="f"]').click();assert.equal(await p.locator('.create-face-card:visible').count(),15);
  await p.screenshot({path:path.join(out,'create-women-faces.png')});
  await p.locator('[data-look="explorer_f"]').click();
  report.choice=await p.evaluate(()=>({sex:document.querySelector('[data-g="sex"].on').getAttribute('data-v'),key:G.Img.pick(G.Art.portraitKeys(G.Scenes.create.playerSpec()))}));
  assert.equal(report.choice.sex,'f');assert.equal(report.choice.key,'portraits/player/explorer_f');
  await p.screenshot({path:path.join(out,'create-woman.png')});
  await p.evaluate(async()=>{await G.Game.ensureGeo();await G.GoldSea.start();G.Game.state.gold.prologue=1;G.Game.state.settings.res=.35;G.Game.go('city',{cityId:24,gold:true});});
  // 검사 중 자동 프롤로그가 열리지 않게 한다.
  await p.evaluate(async()=>{await G.UI.reset?.();});
  report.people=await p.evaluate(()=>{
   const out=[];for(const k of ['E','M','B','L','YU','JN','KW','PT','YA','YE','CR','SL','NU','SC','EA','YK','RB','MG','TM','MO','RD','GS','HM','NR','DA','JS']){
    const sp=G.GoldSea.who(k);out.push({k,face:G.Img.pick(G.Art.portraitKeys(sp.portrait)),half:G.Img.pick(sp.half)});
   }return out;
  });assert(report.people.every(x=>x.face&&x.half));assert(report.people.find(x=>x.k==='E').face==='portraits/mates/gs_eleonore');
  report.ages=await p.evaluate(()=>{
   const s=G.Game.state,result=[];for(const mode of ['gold','jhook','song']){
    delete s.gold;delete s.jhook;delete s.song;s[mode]={act:1};s.player.generation=1;
    for(const age of [39,40,69,70])result.push({mode,age,face:G.Img.pick(G.Img.chain.heroPortrait(s.player,age)),half:G.Img.pick(G.Img.chain.heroHalf(s.player,age))});
   }delete s.song;s.gold={act:15,beats:{},prologue:1};return result;
  });for(const x of report.ages)if(x.age>=40){assert(x.face.startsWith('portraits/story-player/'));assert(x.half===x.face+'_half');}
  // 진행 중인 옛 저장 상태에서도 원화를 표시하고 끝난 뒤 걷는지 확인한다.
  await p.evaluate(()=>{document.querySelectorAll('.modal-back,.dialog-back').forEach(x=>x.remove());G.Game.state.gold.prologue=1;});
  await p.evaluate(()=>G.StoryArt.show('gold/cuts/14-lovers-embrace','연인이 된 두 사람의 포옹'));
  assert.equal(await p.locator('.story-art-shot img').count(),1);
  await p.evaluate(()=>{window.QA_SAY=G.UI.say('열네 해 하고 아흐레. 이제 장부 밖에서도 당신 곁에 있을게요.',G.GoldSea.who('E'));});
  await p.waitForSelector('.dlg');await p.waitForTimeout(500);await p.screenshot({path:path.join(out,'gold-event.png')});
  await p.keyboard.press('Enter');await p.evaluate(()=>QA_SAY);await p.evaluate(()=>G.StoryArt.end());
  report.routes=await p.evaluate(async()=>{
   const shown=[],orig=G.StoryArt.show,originalSay=G.UI.say,originalAsk=G.UI.ask;
   G.StoryArt.show=async(key)=>shown.push(key);G.UI.say=async()=>{};G.UI.ask=async()=>0;
   try{for(const [mode,api,d] of [['gold',G.GoldSea,G.GOLD],['jhook',G.JHook,G.JHOOK]]){
    const pro=d.prologue;await api.play(pro.pro,'prologue');if(pro.a1)await api.play(pro.a1,'prologue_a1');if(pro.a2)await api.play(pro.a2,'prologue_a2');
    for(const b of d.beats)await api.play(b.lines,b.id);
   }}finally{G.StoryArt.show=orig;G.UI.say=originalSay;G.UI.ask=originalAsk;}
   return [...new Set(shown)];
  });assert(report.routes.filter(k=>k.startsWith('gold/')).length===14);assert(report.routes.filter(k=>k.startsWith('jhook/')).length>=20);
  report.gallery=await p.evaluate(()=>{const el=document.createElement('div');G.StoryArt.gallery('jhook',el);document.getElementById('ui').appendChild(el);el.querySelector('button').click();return document.querySelectorAll('.story-art-card').length;});assert.equal(report.gallery,28);
  await p.waitForTimeout(400);await p.screenshot({path:path.join(out,'jhook-gallery.png')});
  await p.evaluate(async()=>{
   const keys=['portraits/player/ganghui','portraits/player/armored_navigator','portraits/player/explorer_f','portraits/player/jessica','portraits/player/soyoung',
    'portraits/mates/gs_eleonore','portraits/mates/gs_marieke','portraits/mates/gs_bram','portraits/npc/gs_YA','portraits/npc/gs_JS99',
    'portraits/mates/jh_lucia','portraits/mates/jh_mariam','portraits/npc/jh_JG_child','portraits/sponsors/jh_killigrew','portraits/history/mowgli_ape'];
   await Promise.all(keys.map(k=>G.Img.load(G.PORTRAIT_LAYOUT[k].source)));
   const board=document.createElement('div');board.id='portrait-qa-board';board.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#eee4d0;padding:30px;display:grid;grid-template-columns:repeat(5,1fr);gap:12px;overflow:auto;color:#281e15';
   keys.forEach(key=>{const cell=document.createElement('div');cell.style.cssText='text-align:center;border:1px solid #96743c;border-radius:8px;padding:10px';const cv=G.Art.portraitCanvas(G.Art.withImg(G.Art.portraitSpec({seed:key}),[key]),220);cell.appendChild(cv);const label=document.createElement('div');label.style.font='14px sans-serif';label.textContent=key.split('/').pop();cell.appendChild(label);board.appendChild(cell);});document.body.appendChild(board);
  });
  await p.waitForTimeout(300);await p.screenshot({path:path.join(out,'portrait-samples.png')});
  assert.deepEqual(errors,[]);report.errors=errors;
  fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({layouts:report.layouts.count,art:report.assets.length,choices:report.choices,routes:report.routes.length,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
