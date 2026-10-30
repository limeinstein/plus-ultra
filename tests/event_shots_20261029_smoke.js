/* 새 역사 장면 26장과 실제 인물을 쓰는 소꿉친구·후견 샷의 연결·선택·정리 검사. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let pw;try{pw=require('playwright');}catch(_){pw=require('../tools/procedural_art/node_modules/playwright-core');}
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/event-shots-20261029');
const specs=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/event_shots_20261029_prompts.json'),'utf8')).assets;
(async()=>{
 const browser=await pw.chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&G.OldGuard);
  const result=await page.evaluate(async specs=>{
   const checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);},decoded=[],previews=[];
   for(const row of specs){const key=(row.folder||'legend-events')+'/'+row.id;check(G.Img.has(key),'등록 '+key);const im=await G.Img.load(key);check(im&&im.naturalWidth===1881&&im.naturalHeight===836,'실제 해독·규격 '+row.id);decoded.push(key);}
   for(const key of ['family-events/childfriend_join','family-events/oldguard_farewell']){check(G.Img.has(key),'공용 장면 등록 '+key);const im=await G.Img.load(key);check(im&&im.naturalWidth===1881&&im.naturalHeight===836,'공용 장면 해독 '+key);decoded.push(key);}
   check(specs.filter(x=>!['oldguard','heirplan'].includes(x.event)).length===26,'누락된 역사 샷 26장');
   await G.Game.ensureGeo();
   const s=G.Game.state=G.State.newGame({name:'선대 제독',nation:'PT',job:'explorer',age:60,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   s.date={y:1700,m:6,d:1};s.settings.res=.35;s.settings.autosave=false;s.flags.prologue=true;
   const k={name:'새 제독',sex:'f',born:{y:1680,m:3,d:1},sk:{},lg:{},st:{str:55,int:55,mar:55,cha:55},edu:{},bond:80};s.player.kids=[k];
   const OG=G.OldGuard,U=G.U,UI=G.UI,ES=G.EventShot,looks=G.OLD_GUARD_FRIEND_LOOKS;
   const originals={alert:UI.alert,say:UI.say,pick:OG.pick,make:OG.makeKin,vets:OG.veterans,show:ES.show,chance:U.chance,known:G.Frontier.known,has:G.Img.has};
   let current=null,calls=[],said=[];
   ES.show=async o=>{current=o;calls.push(o);return originals.show(o);};
   UI.alert=async()=>{};UI.say=async text=>{said.push(text);const cv=document.querySelector('.famscene canvas');check(!!cv,'대화 중 실제 사건 샷');
    if(current&&current.title===G.OLD_GUARD.shots.friend){const key=G.Img.pick(current.cast[1].half);if(key&&key.includes('portraits/childhood-friends/')&&!previews.some(x=>x.key===key)){const thumb=document.createElement('canvas');thumb.width=376;thumb.height=167;thumb.getContext('2d').drawImage(cv,0,0,376,167);previews.push({key,data:thumb.toDataURL('image/jpeg',.9)});}}
   };
   OG.veterans=()=>[];OG.pick=c=>c.filter(x=>x.kin);U.chance=()=>true;G.Frontier.known=()=>true;
   try{
    for(const look of looks){
     s.player.nation=Object.keys(G.WANDER_NATIONS).find(n=>look.styles.includes(G.WANDER_NATIONS[n].style));
     G.OLD_GUARD_FRIEND_LOOKS=[look];const d=originals.make('friend',s.player,k);G.OLD_GUARD_FRIEND_LOOKS=looks;
     check(d&&d.friendLook===look.id,'저장된 친구 생성 '+look.id);OG.makeKin=()=>d;calls=[];s.mates=[];
     const r=await OG.atSucceed(s.player,k,false),shot=calls.find(x=>x.title===G.OLD_GUARD.shots.friend);
     check(r.kept.includes(d.id)&&s.mates[0].loyal===G.BALANCE.oldGuard.kinLoyal&&!s.mates[0].ev,'합류 규칙 유지 '+look.id);
     check(shot&&G.Img.pick(shot.cast[1].half)===look.halfKey,'실제 친구 얼굴 연결 '+look.id);
     check(shot.bg[0]==='legend-events/oldguard_join_'+look.id.split('_')[1],'모항 출신권 배경 '+look.id);
     check(!document.querySelector('.famscene'),'합류 뒤 그림 정리 '+look.id);
    }
    // 이주민 친구는 외모의 고장이 아니라 함께 자란 모항에 선다.
    s.player.nation='PT';G.OLD_GUARD_FRIEND_LOOKS=[looks.find(x=>x.id==='cf_africa_knight')];const immigrant=originals.make('friend',s.player,k);G.OLD_GUARD_FRIEND_LOOKS=looks;
    OG.makeKin=()=>immigrant;calls=[];s.mates=[];await OG.atSucceed(s.player,k,false);
    check(calls.some(x=>x.title===G.OLD_GUARD.shots.friend&&x.bg[0]==='legend-events/oldguard_join_med'),'이주민 친구도 같은 모항');
    U.chance=()=>false;const male=originals.make('friend',s.player,k);U.chance=()=>true;OG.makeKin=()=>male;calls=[];s.mates=[];await OG.atSucceed(s.player,k,false);
    check(male.g==='m'&&calls.some(x=>x.title===G.OLD_GUARD.shots.friend&&G.Img.pick(x.cast[1].half)===G.Img.pick(G.Img.chain.mateHalf(male.id))),'옛 저장·남성 친구도 본인 무릎상');
    const defs=G.MATES.filter(d=>!d.kin&&!d.wd&&!d.sib&&!d.tale&&!d.eventOnly&&d.st).slice(0,2);
    const vets=defs.map(d=>({id:d.id,role:'none',joined:16600101,loyal:70}));
    OG.veterans=()=>vets;OG.makeKin=()=>null;OG.pick=c=>c.filter(x=>x.m);
    for(const forced of [false,true]){
     s.mates=vets.map(x=>({...x}));calls=[];said=[];await OG.atSucceed(s.player,k,forced);
     const aide=calls.find(x=>x.title===(forced?G.OLD_GUARD.shots.mourning:G.OLD_GUARD.shots.aide)&&x.cast.length>2);
     check(aide&&aide.cast.length===(forced?3:4),'선대 생존·사망에 맞는 출연 인원 '+forced);
     check(aide.cast.slice(-2).every((x,i)=>G.Img.pick(x.half)===G.Img.pick(G.Img.chain.mateHalf(vets[i].id))),'고른 노장만 출연 '+forced);
     check(forced?!said.some(x=>/내 뒤를 이을/.test(x)):said.some(x=>/내 뒤를 이을/.test(x)),'생존한 선대만 직접 부탁 '+forced);
     check(!document.querySelector('.famscene'),'후견 뒤 그림 정리 '+forced);
    }
    calls=[];OG.pick=()=>[];await OG.atSucceed(s.player,k,false);check(!calls.some(x=>x.title===G.OLD_GUARD.shots.aide||x.title===G.OLD_GUARD.shots.friend),'고르지 않은 노장의 부탁·합류 샷 없음');
    calls=[];G.Img.has=key=>key.startsWith('legend-events/oldguard_')?false:originals.has(key);UI.say=async()=>{};await OG.atSucceed(s.player,k,false);check(calls.length===0,'그림 없는 옛 팩도 대화 진행');G.Img.has=originals.has;
    OG.pick=c=>c.filter(x=>x.m);UI.say=async()=>{throw Error('의도한 대화 오류');};let failed=false;
    try{await OG.atSucceed(s.player,k,false);}catch(e){failed=e.message==='의도한 대화 오류';}
    check(failed&&!document.querySelector('.famscene')&&!document.getElementById('ui').classList.contains('scenepic-on'),'대화 오류에도 액자·인물 층 정리');
    window.shotArtTest={k,vets,friend:immigrant};
   }finally{
    UI.alert=originals.alert;UI.say=originals.say;OG.pick=originals.pick;OG.makeKin=originals.make;OG.veterans=originals.vets;ES.show=originals.show;U.chance=originals.chance;G.Frontier.known=originals.known;G.Img.has=originals.has;G.OLD_GUARD_FRIEND_LOOKS=looks;
   }
   G.Game.go('city',{cityId:0});
   return{checks,decoded,previews};
  },specs);
  await page.waitForFunction(()=>G.Game.sceneName==='city');await page.mouse.move(1270,790);await page.waitForTimeout(1800);
  // 실제 합류·부탁 대화를 띄워 그림과 대화 얼굴상이 함께 보이는지 확인한다.
  for(const kind of ['friend','aide','visit','council']){
   await page.evaluate(kind=>{
    const t=window.shotArtTest,s=G.Game.state,OG=G.OldGuard;
    G.Game.scene.update=function(){};G.UI.alert=async()=>{};G.UI.toast=()=>{};
    s.mates=(kind==='aide'||kind==='council')?t.vets.map(x=>({...x})):[];
    OG.veterans=()=>kind==='aide'?s.mates:[];OG.makeKin=()=>(kind==='friend'||kind==='visit')?t.friend:null;
    OG.pick=c=>c;G.U.chance=()=>true;
    window.shotSceneDone=false;window.shotSceneError=null;
    if(!window.eventShotOriginal)window.eventShotOriginal=G.EventShot.show;
    G.EventShot.show=async o=>{window.lastActualShot={title:o.title,count:o.cast.length};return window.eventShotOriginal(o);};
    if(kind==='visit'||kind==='council'){t.k.sex='m';s.player.kids=[t.k];G.HeirPlan.plan().ids=[];G.UI.ask=async()=> 'join';}
    const task=kind==='visit'?G.HeirPlan.friendVisit(t.k,G.CITY_DATA[0]):kind==='council'?G.HeirPlan.arrange(G.CITY_DATA[0],false):OG.atSucceed(s.player,t.k,false);
    task.then(()=>window.shotSceneDone=true).catch(e=>window.shotSceneError=e.message);
   },kind);
   console.log('실제 화면 검수',kind);
   const title=kind==='friend'?'어린 날의 약속':kind==='aide'?'새 제독의 곁':kind==='visit'?'소꿉친구가 찾아오다':'후계를 위한 안배';
   for(let i=0;i<50;i++){if(await page.evaluate(({title,kind})=>window.lastActualShot&&window.lastActualShot.title.includes(title)&&(kind!=='council'||window.lastActualShot.count>=3),{title,kind}))break;await page.keyboard.press('Space');await page.waitForTimeout(100);}
   try { await page.waitForFunction(title=>{const e=document.querySelector('.famscene.on');return e&&e.textContent.includes(title)&&Number(getComputedStyle(e).opacity)>.99&&document.querySelector('.dlg');},title,{timeout:30000}); }
   catch(e){console.log(await page.evaluate(()=>({done:window.shotSceneDone,error:window.shotSceneError,pic:document.querySelector('.famscene')?.outerHTML.slice(0,500),dialog:document.querySelector('.dlg')?.outerHTML.slice(0,300),ui:document.getElementById('ui').className})));await page.screenshot({path:path.join(OUT,kind+'-failure.png')});throw e;}
   await page.screenshot({path:path.join(OUT,kind+'-in-game.png'),animations:'disabled'});
   for(let i=0;i<40&&!await page.evaluate(()=>window.shotSceneDone||window.shotSceneError);i++){await page.keyboard.press('Space');await page.waitForTimeout(100);}
   await page.waitForFunction(()=>window.shotSceneDone||window.shotSceneError,null,{timeout:15000});
   assert.strictEqual(await page.evaluate(()=>window.shotSceneError),null);
   assert.strictEqual(await page.locator('.famscene').count(),0);
  }
  for(const [id,who] of [['glory_banqueting','glory_mary2'],['lu_case','lu_katharina'],['huguenot_peace','hg_pastor'],['romesack_machiavelli','machiavelli'],['westphalia_oath','wp_pauw']]){
   await page.evaluate(async ({id,who})=>{await G.Img.resolve(G.Hist.faceKeys(who));window.historySceneDone=false;G.Hist.withScene(id,'역사의 한 장면',()=>G.UI.say('이 바다에서 우리가 지킨 약속을 기억하겠습니다.',G.Hist.speaker(who))).then(()=>window.historySceneDone=true);},{id,who});
   await page.waitForFunction(()=>{const e=document.querySelector('.famscene.on'),im=e&&e.querySelector('img');return im&&im.complete&&im.naturalWidth===1881&&Number(getComputedStyle(e).opacity)>.99&&document.querySelector('.dlg .pframe');});
   await page.waitForTimeout(250);
   if(id==='glory_banqueting')await page.screenshot({path:path.join(OUT,'history-in-game.png'),animations:'disabled'});
   for(let i=0;i<15&&!await page.evaluate(()=>window.historySceneDone);i++){await page.keyboard.press('Space');await page.waitForTimeout(100);}
   await page.waitForFunction(()=>window.historySceneDone);assert.strictEqual(await page.locator('.famscene').count(),0);
  }
  const renderDir=path.join(OUT,'friend-renders');fs.mkdirSync(renderDir,{recursive:true});
  for(const r of result.previews){const file=r.key.split('/').pop()+'.jpg';fs.writeFileSync(path.join(renderDir,file),Buffer.from(r.data.split(',')[1],'base64'));delete r.data;r.file=file;}
  assert.deepStrictEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify({...result,errors},null,2));
  console.log('PASS: 새 장면 37장, 소꿉친구 32종·남성·이주민, 생존·사망 후견·선택·오류 정리, 실제 합류·부탁 화면, 콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
