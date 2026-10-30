/* 사건 인물 13명과 누락 장면 10장의 실제 선택·해독·표시·종료를 확인한다. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let chromium;try{({chromium}=require('playwright'));}catch(_){({chromium}=require('../tools/procedural_art/node_modules/playwright-core'));}
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/event-art-20261031/screenshots');
const spec=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/event_art_20261031_prompts.json'),'utf8'));
assert.strictEqual(spec.portraits.length,13);assert.strictEqual(spec.scenes.length,10);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||undefined,args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  fs.mkdirSync(OUT,{recursive:true});const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title'&&G.Newton&&G.Globe&&G.GalPisa&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const checked=await page.evaluate(async spec=>{
   function check(v,m){if(!v)throw Error(m);}
   G.Game.state=G.State.newGame({name:'그림 확인',nation:'PT',job:'explorer',age:40,birth:{m:1,d:1},st:{str:50,int:50,mar:50,cha:50},sk:{},lg:[],diff:'normal'});
   G.Game.state.settings.res=.35;G.Game.state.settings.sound=0;G.Game.state.settings.music=0;
   window.__eventArtSpeakers={};const portraits=[],scenes=[];
   for(const a of spec.portraits){
    const sp=a.kind==='mate'?G.Legend.speaker(a.id):G.Hist.speaker(a.id);
    const face=G.Img.pick(G.Art.portraitKeys(sp.portrait)),half=G.Img.pick(sp.half);
    check(face===a.key,a.name+' 얼굴 선택: '+face);check(half===a.key+'_half',a.name+' 무릎상 선택: '+half);
    for(const [key,w,h] of [[face,1024,1024],[half,1024,1536]]){
     const im=await G.Img.load(key);check(im&&im.naturalWidth===w&&im.naturalHeight===h,key+' 해독·규격');
     const cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');ctx.drawImage(im,0,0);
     const px=ctx.getImageData(0,0,w,h).data;let clear=0,solid=0;for(let i=3;i<px.length;i+=4){if(px[i]<8)clear++;if(px[i]>240)solid++;}
     check(clear>w*h*.04&&solid>w*h*.08,key+' 실제 투명도·인물');
     const f=G.PORTRAIT_FACES[key];check(f&&f.eyes.length===4&&f.mouth.length===2,key+' 얼굴 좌표');check(f.eyes.concat(f.mouth).every(v=>v>0&&v<1),key+' 좌표 범위');
    }
    window.__eventArtSpeakers[a.id]=sp;portraits.push({id:a.id,face,half});
   }
   for(const a of spec.scenes){const key='legend-events/'+a.id,im=await G.Img.load(key);check(im&&im.naturalWidth===1881&&im.naturalHeight===836,key+' 해독·규격');scenes.push(key);}
   return {portraits,scenes};
  },spec);
  for(const a of spec.portraits)for(const mode of ['half','face']){
   await page.evaluate(({id,mode})=>{const sp=Object.assign({},window.__eventArtSpeakers[id]);if(mode==='face')sp.noStand=true;window.__eventArtDialog=G.UI.say('인물의 얼굴과 복식, 표정을 확인합니다.',sp);},{id:a.id,mode});
   await page.waitForSelector(mode==='half'?'.dlg-actor.active.tall':'.dlg .pframe');await page.waitForTimeout(380);
   await page.screenshot({path:path.join(OUT,a.id+'_'+mode+'.png')});await page.keyboard.press('Enter');await page.evaluate(()=>window.__eventArtDialog);
  }
  for(const a of spec.scenes){
   await page.evaluate(async a=>{window.__eventArtPicture=G.FamEv.showPic({img:'legend-events/'+a.id,title:a.name});if(!await window.__eventArtPicture.ready)throw Error(a.id+' 준비');window.__eventArtDialog=G.UI.say('장면과 대화 표시를 확인합니다.',window.__eventArtSpeakers.newton);},a);
   await page.waitForSelector('.famscene.on img');await page.waitForTimeout(380);
   assert.strictEqual(await page.locator('#ui.scenepic-on').count(),1,'장면 대화 모드');assert.strictEqual(await page.locator('.dlg-actor.active.tall').count(),0,'그림 앞 무릎상 겹침 없음');
   await page.screenshot({path:path.join(OUT,a.id+'.png')});await page.keyboard.press('Enter');
   await page.evaluate(async()=>{await window.__eventArtDialog;await window.__eventArtPicture.stop();});assert.strictEqual(await page.locator('.famscene, #ui.scenepic-on').count(),0,'장면 종료 정리');
  }
  assert.deepStrictEqual(errors,[],'콘솔 오류 0');fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({checked,errors},null,2));
  console.log('13명 초상 26장 선택·해독·규격·투명도·얼굴 좌표, 사건 그림 10장 해독·표시·종료 통과. 실제 화면 36장, 콘솔 오류 0.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
