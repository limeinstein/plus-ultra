'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
module.exports=async function(p,{out,tag='source'}={}){
 p.setDefaultTimeout(30000);
 const report={},shot=async n=>{if(out)await p.screenshot({path:path.join(out,tag+'-'+n+'.png')})};
 async function drain(flag,limit=180){const read=[];for(let i=0;i<limit;i++){
  if(await p.evaluate(name=>!!window[name],flag))return read;
  if(await p.locator('.dialog-speech').count()){const text=await p.locator('.dialog-speech').last().textContent();if(read.at(-1)!==text)read.push(text);await p.keyboard.press('Enter')}
  else{const buttons=p.getByRole('button',{name:/^(확인|그대로 시작|이대로|닫기)$/});if(await buttons.count())await buttons.last().click();}
  await p.waitForTimeout(280);
 }throw Error('대화가 끝나지 않음: '+flag+' '+(await p.locator('body').innerText()).slice(-2000))}
 await p.evaluate(()=>{G.I18N.set('ko');G.State.markIntroSeen();G.Game.go('create')});
 await p.locator('.create [data-g="sex"][data-v="f"]').click();
 for(const expected of [/붉은 외투/,/꽃 댕기/,/붉은 외투/]){for(let i=0;i<20&&!expected.test(await p.locator('.look-name b').textContent());i++)await p.locator('#face').click();assert.match(await p.locator('.look-name b').textContent(),expected);}
 await p.locator('#age').fill('40');await p.locator('#age').dispatchEvent('input');await p.locator('#skipintro').check();await shot('female-create');await p.locator('#go').click();
 for(let i=0;i<120;i++){
  if(await p.evaluate(()=>G.Game.sceneName==='city'&&!G.UI.busy()&&!G.Scenes.city.isBusy()))break;
  const confirm=p.getByRole('button',{name:'그대로 시작',exact:true});if(await confirm.count())await confirm.click();await p.waitForTimeout(500);
 }
 await p.waitForFunction(()=>G.Game.sceneName==='city'&&!G.UI.busy()&&!G.Scenes.city.isBusy(),null,{timeout:120000});
 report.female=await p.evaluate(()=>({g:G.Game.state.player.g,sex:G.R.heroSex(),look:G.Game.state.player.look,age:G.R.age(),faces:G.Img.heroFaces('f').length}));assert.deepEqual(report.female,{g:'f',sex:'f',look:'jessica',age:40,faces:15});console.log(tag+' 여성 제독 생성');
 const husband=await p.evaluate(()=>{
  const s=G.Game.state,d=G.MATES.find(d=>d.g!=='f'&&!d.minor&&!d.sib&&!d.wed&&!d.eventOnly&&d.id!=='rocco');s.mates.push({id:d.id,role:'nav',loyal:85,aff:95,joined:G.U.dateNum(s.date)});G.R.addItem('ring');s.settings.res=.35;s.settings.music=0;s.settings.sound=0;
  window.wedDone=false;G.MateTalk.talk(G.CITY_DATA[s.player.home],s.mates.find(m=>m.id===d.id)).then(()=>wedDone=true);return{id:d.id,name:d.name};
 });
 await p.locator('.askrow button').filter({hasText:'청혼한다'}).click();await p.getByRole('button',{name:'청혼한다',exact:true}).click();
 await drain('wedDone');assert(await p.evaluate(id=>G.Husbands.is(id)&&G.Husbands.count()===1&&G.Game.state.mates.some(m=>m.id===id),husband.id));
 report.marriage={husband,aboard:true};console.log(tag+' 혼인');
 await p.evaluate(id=>{const s=G.Game.state;s.player.pregSelf={since:s.day,due:s.day+266,told:true,sex:'f',dad:id,gen:G.Mother.genSnap(id)};G.Info.open('admiral')},husband.id);
 assert((await p.locator('.notebook-win').innerText()).includes(husband.name));assert.match(await p.locator('.notebook-win').innerText(),/아기를 가짐/);await shot('female-family');await p.locator('.notebook-win>.title .x').click();
 report.saved=await p.evaluate(id=>{const s=G.Game.state,raw=G.State.serialize();G.Game.state=G.State.deserialize(raw);const q=G.Game.state;return q.player.g==='f'&&q.player.husbands.some(h=>h.id===id)&&q.player.pregSelf.dad===id&&q.player.pregSelf.told&&q.player.pregSelf.sex==='f'},husband.id);assert(report.saved);
 const discovery=await p.evaluate(()=>{const s=G.Game.state;delete s.player.pregSelf;const d=G.DISC.ds_183;s.loc={mode:'land',lat:d.lat,lon:d.lon};G.Disc.addHint(d.id,'tavern:0');window.findDone=false;window.findBefore=s.stats.found;G.Disc.find(d,'land').then(()=>findDone=true);return{id:d.id,name:d.realName||d.name}});
 await p.waitForSelector('.disc-card');assert((await p.locator('.disc-card .dname').textContent()).includes('오랑우탄'));await shot('new-discovery');
 report.discoveryLines=await drain('findDone');assert(report.discoveryLines.length>=2);
 report.discovery=await p.evaluate(id=>({id,found:G.Disc.foundByMe(id),delta:G.Game.state.stats.found-findBefore,seen:G.Game.state.discStory.seen[id]}),discovery.id);assert(report.discovery.found&&report.discovery.delta===1&&report.discovery.seen.length>0);
 await p.evaluate(id=>{window.cardDone=false;G.Scenes.discoveryCard(G.DISC[id],0).then(()=>cardDone=true)},discovery.id);await p.waitForSelector('.disc-card');await p.getByRole('button',{name:'현장 이야기',exact:true}).click();
 await p.waitForSelector('.dialog-speech');await p.keyboard.press('Escape');await p.waitForSelector('.disc-card');await p.getByRole('button',{name:'확인',exact:true}).click();await p.waitForFunction(()=>cardDone);assert.equal(await p.evaluate(()=>G.Game.state.stats.found-findBefore),1);report.revisitNoReward=true;
 await p.evaluate(()=>{window.skipDone=false;G.DiscStories.play(G.DISC.canyon).then(()=>skipDone=true)});await p.waitForSelector('.dialog-speech');await p.keyboard.press('Escape');await p.waitForFunction(()=>skipDone&&!G.UI.busy());report.escapeSkipsScene=true;
 const chorus=await p.evaluate(()=>{
  const s=G.Game.state;s.mates=[{id:'rocco',role:'first',loyal:90},{id:'ibnmajid',role:'nav',loyal:90},{id:'cinderella',role:'surveyor',loyal:90}].concat(s.mates.filter(m=>(s.player.husbands||[]).some(h=>h.id===m.id)).map(m=>({...m,role:'none'})));s.voyage={from:0,startDay:s.day-37};s.fleet.daysOut=37;window.chorusDone=false;window.chorusPlan=G.DiscStories.plan(G.DISC.maldives);G.DiscStories.play(G.DISC.maldives).then(()=>chorusDone=true);return{kind:chorusPlan.kind,participants:chorusPlan.participants,first:chorusPlan.lines[0].text};
 });assert.equal(chorus.kind,'chorus');assert(chorus.participants.includes('rocco')&&chorus.participants.includes('ibnmajid')&&chorus.participants.length<=8);assert(chorus.first.includes('리스본')&&chorus.first.includes('37'));await p.waitForSelector('.dialog-speech');await shot('discovery-chorus');
 const chorusLines=await drain('chorusDone');assert(chorusLines.some(x=>x.includes('고리')));assert(await p.evaluate(()=>G.DiscStories.plan(G.DISC.maldives).kind!=='chorus'));report.chorus={...chorus,pages:chorusLines.length,once:true};console.log(tag+' 합창 완료');
 // 925d: 실제 첫 발견의 합창 뒤에는 같은 장소의 재방문 장면이 열린다.
 await p.evaluate(()=>{const s=G.Game.state,d=G.DISC.ds_901;s.mates=[{id:'rocco',role:'first',loyal:90}].concat(s.mates.filter(m=>(s.player.husbands||[]).some(h=>h.id===m.id)).map(m=>({...m,role:'none'})));s.loc={mode:'sea',lat:d.lat,lon:d.lon};G.Disc.addHint(d.id,'tavern:0');window.returnBefore=s.stats.found;window.returnFound=false;G.Disc.find(d,'sea').then(()=>returnFound=true)});
 await p.waitForSelector('.disc-card');await drain('returnFound');assert(await p.evaluate(()=>G.Game.state.discStory.chorus.ds_901===1));
 const returnPlan=await p.evaluate(()=>{const r=G.DiscStories.plan(G.DISC.ds_901);return{rec:r.rec,kind:r.kind}});assert.equal(returnPlan.rec,'R901');
 await p.evaluate(()=>{window.returnCard=false;G.Scenes.discoveryCard(G.DISC.ds_901,0).then(()=>returnCard=true)});await p.waitForSelector('.disc-card');await p.getByRole('button',{name:'현장 이야기',exact:true}).click();await p.waitForSelector('.dialog-speech');await shot('return-story');const returnLines=await drain('returnCard');assert.match(returnLines.join(''),/지난번/);assert(await p.evaluate(()=>G.Game.state.discStory.seen.ds_901.some(k=>k.startsWith('R901:'))));assert.equal(await p.evaluate(()=>G.Game.state.stats.found-returnBefore),1);assert.equal(await p.evaluate(()=>G.Game.state.discStory.visits.ds_901),2);report.returnStory={...returnPlan,noReward:true,chorusOnce:true};
 // 지나가 기함 회계석에 있어야 자기 장면을 말한다. 아버지는 새 동료로 만들지 않는다.
 await p.evaluate(()=>{const s=G.Game.state,id=Object.keys(G.DISC_STORIES).find(id=>G.DISC_STORIES[id].scenarios.some(r=>r.key==='062')),d=G.DISC[id];window.jinaDiscovery=id;s.mates=[{id:'jina',role:'purser',loyal:90}].concat(s.mates.filter(m=>(s.player.husbands||[]).some(h=>h.id===m.id)).map(m=>({...m,role:'none'})));s.loc={mode:'land',lat:d.lat,lon:d.lon};s.disc[id]={me:true,found:G.U.dateNum(s.date)};window.jinaCard=false;G.Scenes.discoveryCard(d,0).then(()=>jinaCard=true)});
 await p.waitForSelector('.disc-card');await p.getByRole('button',{name:'현장 이야기',exact:true}).click();await p.waitForSelector('.dialog-speech');await shot('jina-discovery');const jinaLines=await drain('jinaCard');assert.match(jinaLines.join(''),/주판/);assert(await p.evaluate(()=>G.Game.state.discStory.seen[jinaDiscovery].includes('jina:062')));report.jina={aboard:true,spoken:true};
 // 여성 제독의 가족 반응은 새로 제공된 남편 원문을 사용한다.
 await p.evaluate(id=>{const s=G.Game.state;if(!s.mates.some(m=>m.id===id))throw Error('검사 편성에서 남편이 사라짐');if(!G.Husbands.is(id))throw Error('검사 중 혼인 기록이 사라짐');s.disc.maelstrom={me:true,found:G.U.dateNum(s.date),reported:true};s.discStory.pending=[{id:'maelstrom',rec:'A3',gen:s.player.generation||1}];delete s.discStory.family[(s.player.generation||1)+':maelstrom'];window.husbandNews=false;G.DiscStories.home(G.CITY_DATA[s.player.home],false).then(()=>husbandNews=true)},husband.id);
 await p.waitForSelector('.dialog-speech');await shot('husband-news');const husbandLines=await drain('husbandNews');assert.equal(husbandLines.join('').replace(/\s/g,''),'바다가 돌았다고? 그걸 웃으면서 쓰면 읽는 내가 멀미가 나. 애들한텐 재밌는 이야기라고만 했어. 다음엔 물때 보고 가.'.replace(/\s/g,''));report.husbandNews=true;
 report.data=await p.evaluate(()=>({discoveries:G.DISCOVERIES.length,newDiscoveries:G.DISC_STORY_NEW.length,scenarios:G.DISC_STORY_COUNTS.scenarios,choruses:G.DISC_STORY_COUNTS.choruses,guides:G.DISC_GUIDES.length,unique:new Set(G.DISCOVERIES.map(d=>d.id)).size===G.DISCOVERIES.length}));assert.deepEqual(report.data,{discoveries:1744,newDiscoveries:438,scenarios:989,choruses:67,guides:3,unique:true});
 await p.evaluate(()=>{G.Info.open('menu');});await p.locator('[data-dsl="1"]').click();assert(await p.evaluate(()=>G.Game.state.settings.discoveryLetters));await p.locator('[data-dsl="0"]').click();assert(!await p.evaluate(()=>G.Game.state.settings.discoveryLetters));await p.keyboard.press('Escape');report.lettersSetting=true;

 // 다른 원고에서 이미 고른 어머니 호칭이 공통 대화창에서 다시 아버지로 바뀌지 않는다.
 await p.evaluate(()=>{
  const s=G.Game.state;s.player.kids=[{name:'딸 시험',given:'딸',surname:'시험',sex:'f',born:{y:s.date.y-10,m:1,d:1},bond:60}];
  s.disc.monalisa={found:G.U.dateNum(s.date),me:true,reported:true};s.discStory.pending=[{id:'monalisa',rec:'A4',gen:s.player.generation||1}];delete s.discStory.family[(s.player.generation||1)+':monalisa'];
  window.familyDone=false;G.DiscStories.home(G.CITY_DATA[s.player.home],false).then(n=>{window.familyCount=n;familyDone=true});
 });
 await p.waitForSelector('.dialog-speech');const familyText=await p.locator('.dialog-speech').last().textContent();assert.match(familyText,/엄마/);assert(!/아빠/.test(familyText));await drain('familyDone');assert.equal(await p.evaluate(()=>familyCount),1);report.familySpeech={mother:true,once:await p.evaluate(async()=>await G.DiscStories.home(G.CITY_DATA[G.Game.state.player.home],false)===0)};assert(report.familySpeech.once);
 report.lateUpdates=await p.evaluate(()=>({ships:G.SHIP_TYPES.length,gents:G.BALL_GENTS.length,femaleAwards:G.Achieve.list().some(a=>a.id==='femme_fatale')&&!G.Achieve.list().some(a=>a.id==='casanova'),call:G.R.heroCall('나리')}));assert.deepEqual(report.lateUpdates,{ships:45,gents:8,femaleAwards:true,call:'아씨'});
 await p.evaluate(()=>{const s=G.Game.state;s.player.gold=10000;window.expectedDye=Math.ceil((Math.max(1500,G.SHIP.sloop.price*.04)+600)*G.R.priceLevel(G.CITY_DATA[s.player.home],'ship')/10)*10;const sh=s.fleet.ships[0];sh.type='sloop';sh.sails=G.SHIP.sloop.sails.slice();delete sh.loan;delete sh.sailColor;window.dyeDone=false;G.Scenes.city.B.shipyard.dyeSails(G.CITY_DATA[s.player.home],sh).then(()=>dyeDone=true)});
 await p.waitForSelector('.sail-dye-preview');await p.locator('[data-dye="5"]').click();await shot('sail-color');await p.getByRole('button',{name:'이 색으로 적용',exact:true}).click();await p.waitForFunction(()=>dyeDone);
 report.dye=await p.evaluate(()=>{const s=G.Game.state,raw=G.State.serialize(),q=G.State.deserialize(raw);return{color:s.fleet.ships[0].sailColor,gold:s.player.gold,saved:q.fleet.ships[0].sailColor===s.fleet.ships[0].sailColor}});assert.deepEqual(report.dye,{color:'#435d87',gold:10000-await p.evaluate(()=>expectedDye),saved:true});
 await p.evaluate(()=>G.Game.go('title'));return report;
};
