'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function(p,{out,tag='source'}={}){
 const result={};
 const shot=async n=>{if(out)await p.screenshot({path:path.join(out,tag+'-'+n+'.png')});};
 const close=async()=>{for(let i=0;i<30&&await p.evaluate(()=>G.UI.busy());i++){await p.keyboard.press('Escape');await p.waitForTimeout(100);}};
 const ime=async(key,code)=>p.evaluate(([key,code])=>{for(const type of ['keydown','keyup'])document.body.dispatchEvent(new KeyboardEvent(type,{key,code,bubbles:true,cancelable:true}));},[key,code]);
 const step=async()=>p.evaluate(()=>{for(let i=0;i<12;i++)G.Scenes.sea.update(0);});
 await p.evaluate(()=>{G.I18N.set('ko');G.StorySelect.open();});await p.waitForSelector('.ss-card');
 await p.waitForFunction(()=>[...document.querySelectorAll('.ss-card canvas')].length===4&&[...document.querySelectorAll('.ss-card canvas')].every(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<a.length;i+=4)if(a[i])n++;return n>c.width*c.height/5;}));
 assert.equal(await p.locator('.ss-card').count(),4);
 await p.locator('.ss-card[data-story="jhook"]').click();await p.waitForTimeout(300);await shot('portraits');
 assert.equal(await p.evaluate(()=>G.FX.storySelect.portraits.frames['portraits/player/jessica'].source),'characters/player_half_jessica');
 await p.locator('.ss-return').click();await close();
 result.portraits=4;
 await p.evaluate(()=>{G.State.newGame({name:'배포 확인',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});const s=G.Game.state;s.settings.res=.35;s.settings.music=0;s.settings.sound=0;s.flags.prologue=true;G.Game.showLayers(false,false,true);});
 await p.evaluate(()=>G.Game.go('city',{cityId:0,load:true}));await p.waitForFunction(()=>G.Game.sceneName==='city'&&!G.Scenes.city.isBusy()&&!G.UI.busy(),null,{timeout:120000});
 result.frames=[];
 for(const key of ['legend-events/snow_white_rescue','legend-events/happily_after_all','achievement-events/onceupon','achievement-events/dreamcome']){
  await p.evaluate(key=>{window.releaseShot=G.FamEv.showPic({img:key,title:'새 사건 원화',noStand:true});return releaseShot.ready;},key);
  const dims=await p.locator('.famscene img').evaluate(im=>[im.naturalWidth,im.naturalHeight]);assert.deepEqual(dims,[1881,836]);
  await p.waitForFunction(()=>{const im=document.querySelector('.famscene img');if(!im)return false;const b=im.getBoundingClientRect(),st=getComputedStyle(im.closest('.famscene'));return st.opacity>0.95&&st.visibility==='visible'&&b.width>500&&b.height>200&&b.left>=0&&b.top>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;});
  if(!result.frames.length)await shot('snow-event');result.frames.push(key);await p.evaluate(()=>G.FamEv.stopPic());assert.equal(await p.locator('.famscene').count(),0);
 }
 await p.evaluate(()=>{G.Game.state.player.wife=Object.keys(G.MAID)[0];window.homeDone=false;G.FamEv.play('dock_embrace',G.FamEv.cast({at:'dock',love:G.FamEv.mainWife(),kids:[],babies:[],days:187})).then(()=>homeDone=true);});
 await p.waitForFunction(()=>document.querySelector('.famscene img')?.naturalWidth===576);assert.equal(await p.locator('.famscene img').evaluate(im=>im.naturalHeight),256);await shot('homecoming');
 for(let i=0;i<50&&!await p.evaluate(()=>homeDone);i++){await p.keyboard.press('Enter');await p.waitForTimeout(280);}
 assert(await p.evaluate(()=>homeDone));assert.equal(await p.locator('.famscene').count(),0);result.homecoming=true;
 await p.evaluate(()=>G.Game.go('sea',{depart:0}));await p.waitForFunction(()=>G.Game.sceneName==='sea'&&G.Scenes.sea.runtime()?.alive&&!G.Scenes.sea.runtime().busy&&!G.UI.busy(),null,{timeout:120000});
 // 입력 검사에서는 임의 상선의 거래 제안이 끼어들지 않도록 빈 시험 해역을 만든다.
 // 실제 장면·키 처리·단추·대화·저장은 그대로 쓰며 외부 API 응답을 바꾸지 않는다.
 await p.evaluate(()=>{const st=G.Scenes.sea.runtime();st.paused=true;st.npcs=[];st.tipScan=Infinity;});await step();
 const hints=await p.locator('.sailbar .btn.has-hk').evaluateAll(es=>es.map(e=>e.textContent.replace(/\s/g,'')));assert.deepEqual(hints.sort(),['해도M','상륙L','낚시F','탐색S','비대책R'].sort());await shot('sea-keys');result.hints=hints;
 assert(!((await p.locator('.sailbar .btn').filter({hasText:'상륙'}).getAttribute('class'))||'').split(' ').includes('disabled'),'리스본 출항 위치에서 해안 상륙 가능');
 await ime('ㅣ','KeyL');await p.waitForSelector('.askrow');assert.match(await p.locator('.dialog-speech').textContent(),/상륙해서 탐험/);await p.locator('.askrow button').filter({hasText:'그만둔다'}).click();await p.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.sea.runtime().busy);result.seaLandIme=true;
 await ime('ㅡ','KeyM');await p.waitForSelector('.chartwrap');await close();
 await p.evaluate(()=>{window.alertDone=false;G.UI.alert('단축키 차단 확인').then(()=>alertDone=true);});await p.waitForSelector('.modal-back');const modalCount=await p.locator('.modal-back').count();await ime('ㅡ','KeyM');assert.equal(await p.locator('.modal-back').count(),modalCount);assert.equal(await p.locator('.chartwrap').count(),0);await close();
 await p.evaluate(()=>G.Keys.bind(G.Game.state.settings,'chart','KeyK'));await step();assert(await p.locator('.sailbar .btn.has-hk').filter({hasText:'해도'}).textContent().then(t=>t.includes('K')));
 await ime('ㅡ','KeyM');assert.equal(await p.locator('.chartwrap').count(),0);await p.keyboard.press('k');await p.waitForSelector('.chartwrap');await close();
 await p.evaluate(()=>G.Keys.clear(G.Game.state.settings,'chart'));await step();assert.equal(await p.locator('.sailbar .btn').filter({hasText:'해도'}).locator('.hk').count(),0);
 const saved=await p.evaluate(()=>{const value=G.State.deserialize(G.State.serialize());const old={keys:{down:'KeyM'}};G.Keys.ensure(old);return {disabled:value.settings.keys.chart,conflict:old.keys.chart,land:old.keys.seaLand};});assert.deepEqual(saved,{disabled:'',conflict:'',land:'KeyL'});result.savedKeys=saved;
 await p.evaluate(()=>G.Keys.reset(G.Game.state.settings));await step();
 result.languages=[];
 for(const lang of ['en','ja','pt','de','fr','es','vi','zh-Hans','zh-Hant']){
  await p.evaluate(l=>G.I18N.set(l),lang);await step();await p.waitForTimeout(100);
  const data=await p.evaluate(()=>({title:[...document.querySelectorAll('.sailbar .btn')].find(b=>b.querySelector('.hk')?.textContent==='L').title,descs:G.Keys.actions.filter(a=>/^(chart|sea)/.test(a.id)).map(a=>G.I18N.tx(a.desc))}));
  assert(!/[가-힣]/.test(data.title),lang+' '+data.title);assert(data.descs.every(t=>!/[가-힣]/.test(t)),lang+' '+data.descs.join(','));result.languages.push({lang,...data});
 }
 await p.evaluate(()=>G.I18N.set('ko'));await step();
 await p.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.sea.runtime().busy);
 await p.evaluate(()=>G.Game.go('land',{from:0}));await p.waitForSelector('.land-bar');await p.waitForFunction(()=>G.Scenes.land.runtime()?.alive&&!G.Scenes.land.runtime().busy&&!G.UI.busy());assert.equal(await p.locator('.land-bar .btn.has-hk .hk').textContent(),'M');await ime('ㅡ','KeyM');await p.waitForSelector('.chartwrap');await close();result.landChart=true;
 await p.evaluate(()=>G.Game.go('battle',{npc:{kind:'pirate',n:2,zone:'med'}}));await p.waitForFunction(()=>G.Game.sceneName==='battle'&&G.Scenes.battle.runtime()?.ships.length>0&&!G.UI.busy(),null,{timeout:120000});
 const before=await p.evaluate(()=>G.Scenes.battle.runtime().paused);await ime('ㅔ','KeyP');assert.equal(await p.evaluate(()=>G.Scenes.battle.runtime().paused),!before);result.battleIme=true;
 await close();return result;
};
