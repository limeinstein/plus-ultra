/* 새 사건: 두 차례 동시 괴물전·전원 처치·저장·패배/정비·보상 보관·합류를 실제 해전과 확인한다. */
'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=process.env.OUT||path.join(root,'artifacts/uninvited-apostles-20261115');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],deadline=setTimeout(()=>browser.close().catch(()=>{}),300000);
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await page.addInitScript(()=>{window.nativeRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;});
  await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root,'index.html')).href),{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title',null,{timeout:120000});
  const report=await page.evaluate(async()=>{
   function ck(v,m){if(!v)throw Error(m);}
   G.Scenes.title.exit();await G.Loader.hide();G.UI.clearScreen();
   G.State.newGame({name:'초대받지 못한 세 사도 검사',nation:'PT',job:'explorer',age:28,birth:{m:1,d:1},st:{str:70,int:60,mar:70,cha:60},sk:{nav:2,gun:2},lg:[0,4],diff:'normal'});
   const s=G.Game.state,A=G.UninvitedApostles,B=G.Scenes.battle,M=G.SeaMonsters;
   s.settings.res=.35;await G.Game.ensureGeo();
   window.originalUninvitedUI={say:G.UI.say,ask:G.UI.ask,scene:G.Achieve.scene};
   const spoken=[];G.UI.say=async(t,p)=>{spoken.push({t,name:p&&p.name});};G.UI.ask=async()=> 'later';G.Achieve.scene=async()=>{};
   s.loc={mode:'sea',lon:-25,lat:32,heading:0};G.Game.go('sea',{fresh:true});
   ck(A.openWater(),'먼바다 검사');ck(!A.eligible()&&!(await A.onSeaDay()),'12명 미달성은 사건 없음');
   s.crewEver={};G.OLYMPIAN_APOSTLES.slice(0,11).forEach(a=>{s.crewEver[a.id]=1;});ck(!A.eligible(),'11명으로 사건 열리지 않음');
   s.crewEver[G.OLYMPIAN_APOSTLES[11].id]=1;s.achv={olympian_companions:{d:1}};ck(A.eligible(),'12명 뒤 사건 열림');
   ck(G.OLYMPIAN_APOSTLES.length===12&&G.UNINVITED_APOSTLES.length===3,'원래 12명과 추가 3명 분리');
   ck(G.MATE.apostle_poseidon.name==='니칸드로스'&&G.MATE.apostle_poseidon_grey.name==='글라우코스','다른 포세이돈 사도 보존');
   ck(G.UNINVITED_APOSTLES.every(id=>G.MATE[id].eventOnly&&!G.MatePower.blocked(G.MATE[id])&&!G.MATE[id].name.includes('사도')),'고유 이름·사건 전용 등록');
   const oldLoc=s.loc;s.loc={mode:'land',lon:-25,lat:32};ck(!(await A.onSeaDay()),'육상 발동 안 함');s.loc=oldLoc;
   s.player.items=[];s.fleet.ships=[G.R.newShip('caravel','검증선')];s.fleet.crew=s.fleet.ships[0].crewMax;
   const worldBefore=JSON.stringify(s.seaMonsters), sync=M.sync;M.sync=()=>{throw Error('사건 소환체가 세계 괴물을 조회함');};
   try{ck(await A.onSeaDay(),'첫 습격 발동');}finally{M.sync=sync;}
   ck(G.Game.sceneName==='battle'&&A.state().stage===1,'1차 해전');
   let rt=B.runtime(),en=rt.ships.filter(b=>b.side==='en');
   ck(en.length===2&&en.map(b=>b.monster).join(',')==='ghost-ship,kraken','유령선·크라켄 2기 동시 생성');
   ck(rt.enFlag===null&&en.every(b=>!b.flag),'괴물 기함 승리 규칙 없음');
   B.headless=true;try{for(let i=0;i<120;i++)B.update(.05);}finally{B.headless=false;}
   ck(en.every(b=>b.phaseTime>0&&b.volleyN>=1),'두 적 모두 같은 전투에서 행동·공격');
   en[0].alive=false;en[0].sunk=true;en[0].hp=0;B._t().checkEnd();ck(!rt.over&&en[1].alive&&!en[1].fled,'첫 적 처치만으로 승리하지 않음');
   const saved=B.snapshot();G.Game.go('battle',{battle:JSON.parse(JSON.stringify(saved))});rt=B.runtime();
   ck(rt.npc.monsters.length===2&&rt.ships.filter(b=>b.side==='en'&&b.alive).length===1,'저장 후 다중 괴물·처치 상태 복원');
   rt.over=true;await B._t().finish('retreat');
   ck(A.state().stage===1&&!Object.keys(A.state().earned).length&&G.UNINVITED_APOSTLES.every(id=>!s.mates.some(m=>m.id===id)),'퇴각은 보상·합류 없음');
   ck(!(await A.onSeaDay()),'패배 뒤 재도전 대기');s.day+=G.BALANCE.uninvitedApostles.retryDays;
   ck(await A.onSeaDay(),'같은 1차 습격 재도전');
   rt=B.runtime();const mine=rt.ships.find(b=>b.side==='me'),crew=mine.crew;mine.hp=mine.maxHp-35;mine.crew-=3;
   // 실제 소지품 40칸: 획득 기록은 남기고 지급만 보관해야 한다.
   s.player.items=Array.from({length:40},(_,i)=>({id:'full_slot_'+i}));
   rt.ships.filter(b=>b.side==='en').forEach(b=>{b.alive=false;b.sunk=true;b.hp=0;});rt.over=true;
   await B._t().finish('win');
   ck(A.state().stage===2&&A.state().won[1]&&!A.state().won[2],'1차 승리 뒤 2차 대기');
   ck(s.fleet.ships[0].hp===s.fleet.ships[0].maxHp-35&&s.fleet.crew===crew-3,'실제 함대 내구·선원 피해 유지');
   ck(A.state().earned.ua_ivy_cup&&A.state().earned.ua_underworld_key&&!A.state().claimed.ua_ivy_cup,'소지품 가득 차도 보상 보관');
   s.player.items=[];ck(A.claimRewards().length===2&&A.claimRewards().length===0,'빈 칸에 일회 지급');
   ck(G.R.stat('cha')===68&&G.R.stat('int')===68,'잔·열쇠 실제 능력치 +8');
   const fame=s.player.fame;ck(!(await A.afterBattle({uninvitedWave:1},'win'))&&s.player.fame===fame,'이전 전투 중복 보상 차단');
   ck(!(await A.onSeaDay()),'정비 선택은 다음 날 2차 습격');s.day++;
   ck(await A.onSeaDay(),'2차 습격 발동');rt=B.runtime();en=rt.ships.filter(b=>b.side==='en');
   ck(en.length===3&&en.map(b=>b.monster).join(',')==='ghost-ship,kraken,sea-serpent','유령선·크라켄·바다뱀 3기 동시 생성');
   const snap=JSON.parse(JSON.stringify(B.snapshot()));G.Game.go('battle',{battle:snap});rt=B.runtime();en=rt.ships.filter(b=>b.side==='en');
   ck(rt.npc.uninvitedWave===2&&rt.npc.allEnemies&&en.every(b=>b.monster),'2차 해전 저장 복원');
   en[0].alive=false;en[0].sunk=true;en[0].hp=0;B._t().checkEnd();ck(!rt.over&&en[1].alive&&en[2].alive,'3기 중 하나 처치해도 계속');
   en[1].alive=false;en[1].sunk=true;en[1].hp=0;B._t().checkEnd();ck(!rt.over&&en[2].alive,'3기 중 둘 처치해도 계속');
   // 마지막 적은 엔진의 실제 승리 판정으로 처리한다.
   en[2].alive=false;en[2].sunk=true;en[2].hp=0;B._t().checkEnd();
   window.uninvitedCheck={worldBefore,spoken};
   return {names:G.UNINVITED_APOSTLES.map(id=>G.MATE[id].name),first:['ghost-ship','kraken'],second:['ghost-ship','kraken','sea-serpent'],firstDamage:35};
  });
  try{await page.waitForFunction(()=>G.UninvitedApostles.state().stage===3&&G.UninvitedApostles.state().next>G.Game.state.day&&!document.querySelector('.famscene'),null,{timeout:20000,polling:100});}
  catch(e){console.error('전투 후 상태',await page.evaluate(()=>({state:G.UninvitedApostles.state(),day:G.Game.state.day,scene:G.Game.sceneName,battle:G.Scenes.battle.runtime()&&{over:G.Scenes.battle.runtime().over,ships:G.Scenes.battle.runtime().ships.map(b=>({side:b.side,alive:b.alive,sunk:b.sunk,hp:b.hp}))},busy:G.UI.busy(),text:document.body.innerText.slice(-900)})),errors);throw e;}
  const end=await page.evaluate(async()=>{
   function ck(v,m){if(!v)throw Error(m);}const A=G.UninvitedApostles,s=G.Game.state;
   ck(G.UNINVITED_APOSTLES.every(id=>!s.mates.some(m=>m.id===id)),'완승해도 고용 보류 가능');
   ck(s.player.items.some(it=>it.id==='ua_coral_trident'),'마지막 삼지창 보상');s.player.equip.weapon='ua_coral_trident';ck(G.R.atk()===41,'삼지창 장착 공격 41');
   s.uninvitedApostles=JSON.parse(JSON.stringify(s.uninvitedApostles));s.day++;
   G.UI.ask=async()=> 'join';ck(await A.onSeaDay(),'저장 후 승리 기록으로 고용');
   ck(A.state().stage===4&&G.UNINVITED_APOSTLES.every(id=>s.mates.some(m=>m.id===id)&&s.crewEver[id]),'세 사람 동시 합류');
   const n=s.mates.length,items=s.player.items.length;ck(!(await A.onSeaDay())&&s.mates.length===n&&s.player.items.length===items,'종료 후 습격·보상·고용 중복 없음');
   ck(JSON.stringify(s.seaMonsters)===window.uninvitedCheck.worldBefore,'세계 괴물 내구·재등장·발견 보상 불변');
   const keys=G.UNINVITED_APOSTLES.flatMap(id=>['portraits/mates/'+id,'portraits/mates/'+id+'_half']).concat(['uninvited_covenant','uninvited_two','uninvited_three','uninvited_reconciliation'].map(id=>'olympian-events/'+id),G.UNINVITED_APOSTLE_REWARDS.map(it=>'items/'+it.id));
   for(const key of keys){ck(G.Img.file(key),'그림 연결 '+key);const im=new Image();im.src=G.Img.src(key);await im.decode();ck(im.naturalWidth>0,'그림 로딩 '+key);}
   const stats=G.UNINVITED_APOSTLE_REWARDS.map(it=>({name:it.name,kind:it.kind,atk:it.atk,bonus:it.statBonus}));
   G.UI.say=window.originalUninvitedUI.say;G.UI.ask=window.originalUninvitedUI.ask;G.Achieve.scene=window.originalUninvitedUI.scene;
   window.requestAnimationFrame=window.nativeRAF;
   return {assets:keys.length,rewards:stats,wins:Object.keys(A.state().won),joined:G.UNINVITED_APOSTLES.map(id=>G.MATE[id].name),spoken:window.uninvitedCheck.spoken.length};
  });
  // 네 사건 원화가 실제 대화창 뒤에 표시되는 모습.
  for(const key of ['covenant','two','three','reconciliation']){
   await page.evaluate(key=>{window.shotDone=false;G.UninvitedApostles.scene(key).then(()=>{window.shotDone=true;});},key);
   await page.waitForTimeout(450);await page.screenshot({path:path.join(out,key+'-runtime.png')});
   for(let i=0;i<65;i++){if(await page.evaluate(()=>window.shotDone))break;await page.keyboard.press('Enter');await page.waitForTimeout(150);}
   assert.equal(await page.evaluate(()=>window.shotDone),true,'장면 대화 종료 '+key);
  }
  // 다중 괴물의 실제 렌더와 안내를 확인한다. 이 전투는 검사 뒤 브라우저와 함께 닫는다.
  await page.evaluate(async()=>{
   const A=G.UninvitedApostles,s=G.Game.state;
   s.loc={mode:'sea',lon:-25,lat:32,heading:0};G.Game.go('battle',{npc:A.npc(2)});
   await G.SeaMonsterSprite.preload(['kraken','sea-serpent']);const B=G.Scenes.battle,rt=B.runtime();rt.ships.filter(b=>b.monster).forEach(b=>{b.monsterPhase='surface';b.phaseTime=.5;});rt.cameraMode='overview';rt.paused=true;B.update(.01);
  });
  const battleHelp=await page.locator('body').innerText();
  assert(battleHelp.includes('괴물에게 백병전·일기토 불가'),'동시 괴물전의 백병전 금지 안내');
  assert(!battleHelp.includes('B: 백병전'),'동시 괴물전에서 잘못된 백병전 바로가기 안내 없음');
  await page.screenshot({path:path.join(out,'three-monsters-runtime.png')});
  const catalog=await browser.newPage();catalog.on('pageerror',e=>errors.push(e.message));catalog.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await catalog.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await catalog.goto((process.env.WEB_BASE ? new URL('catalog.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root,'catalog.html')).href),{waitUntil:'domcontentloaded',timeout:120000});
  assert.equal(await catalog.evaluate(()=>G.UNINVITED_APOSTLES.length===3&&G.UNINVITED_APOSTLE_REWARDS.length===3),true);await catalog.close();
  assert.deepEqual(errors,[]);const all={...report,...end,errors};fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify(all,null,2));console.log(JSON.stringify({ok:true,...all}));
 }finally{clearTimeout(deadline);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
