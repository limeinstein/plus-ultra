/* 일곱 해적섬 여급: 새 파일·얼굴 좌표·술집 패널·실제 얼굴/무릎 대화·도감. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/pirate-island-maids-20261107/runtime');
const spec=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/pirate_island_maids_20261107_prompts.json'),'utf8'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],checks=[];
 try{
  fs.mkdirSync(OUT,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  const page=await context.newPage();
  const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>{if(r.resourceType()==='image')failed.push(r.url());});};
  watch(page);
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.PirateIslandArt&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await page.evaluate(()=>{
   const s=G.Game.state=G.State.newGame({name:'해적섬 여급 그림 확인',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   Object.assign(s.settings,{res:.35,sound:0,music:0});s.lair={rev:{},held:{}};
   G.PIRATE_LAIRS.forEach(d=>{s.lair.rev[d.zone]=s.day;s.lair.held[d.zone]=s.day;});G.Lair.apply();
   G.Game.state=G.State.deserialize(G.State.serialize());G.Lair.apply();
  });
  for(const row of spec.portraits){
   const result=await page.evaluate(async row=>{
    const P=G.PirateIslandArt,I=G.Img,A=G.Art,T=G.Scenes.city.B.tavern;
    const d=G.PIRATE_LAIRS.find(d=>d.zone===row.id),c=G.CITY_DATA[d.id],key=row.key;
    const check=(v,m)=>{if(!v)throw Error(row.id+': '+m);};
    check(c.lair===row.id&&P.faceKey(c,'servant')===key,'저장 복원 뒤 같은 섬·여급');
    check(I.pick(I.chain.npc('servant',c))===key&&I.pick(I.chain.npcHalf('servant',c))===key+'_half','주민 얼굴·무릎 한 쌍');
    check(I.pick(I.chain.maidCity(c))===key&&I.pick(I.chain.maidCityHalf(c))===key+'_half','술집 여급 선택');
    for(const [k,file,w,h] of [[key,row.face_file,448,448],[key+'_half',row.half_file,1024,1536]]){
     check(I.file(k)===file.replace(/^images\//,''),'새 버전 파일 '+k);
     const im=await I.load(k);check(im&&im.naturalWidth===w&&im.naturalHeight===h,'규격·해독 '+k);
     check(G.PORTRAIT_FACES[k]&&G.PORTRAIT_FACES[k].box[2]>0,'얼굴 좌표 '+k);
    }
    for(const role of Object.keys(P.roles).filter(r=>r!=='servant')){
     const other=P.faceKey(c,role);check(I.file(other)===other+'.webp','다른 직업 원화 보존 '+role);
    }
    const f=G.StreetFolk.make('woman',c,3000,700,768,'qa:maid:'+row.id);
    check(I.pick(A.portraitKeys(f.face.portrait))===key&&I.pick(f.face.half)===key+'_half','거리 여급 대화 연결');
    G.Game.state.loc.city=c.id;G.Town.hidden(true);
    await I.load(I.pick(I.chain.interior('tavern',c)));G.Game.setScene(G.Scenes.city.interior('tavern',c));
    const who=T.servantSpeaker(c);
    check(I.pick(A.portraitKeys(who.portrait))===key&&I.pick(who.half)===key+'_half','실제 여급 화자');
    const panel=T.panel(c);check(!!panel,'술집 패널 생성');
    panel.id='qa-pirate-maid';Object.assign(panel.style,{position:'fixed',top:'80px',right:'30px',width:'340px',height:'620px',zIndex:'100'});document.body.appendChild(panel);
    window.__pirateMaidWho=who;
    return {zone:row.id,place:row.place,city:c.id,face:key,half:key+'_half',file:I.file(key)};
   },row);
   await page.waitForTimeout(350);await page.screenshot({path:path.join(OUT,row.id+'_panel.png')});
   await page.evaluate(()=>document.getElementById('qa-pirate-maid').remove());
   for(const mode of ['half','face']){
    await page.evaluate(mode=>{
     const who=Object.assign({},window.__pirateMaidWho);if(mode==='face')who.noStand=true;
     window.__pirateMaidDialog=G.UI.say('어서 오세요. 바다를 보며 잠시 쉬어 가세요.',who);
    },mode);
    await page.waitForSelector(mode==='half'?'.dlg-actor.active.tall':'.dlg .pframe');
    await page.waitForTimeout(250);await page.screenshot({path:path.join(OUT,row.id+'_'+mode+'.png')});
    await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('.dlg'),null,{timeout:5000});await page.evaluate(()=>window.__pirateMaidDialog);
   }
   checks.push(result);
  }
  const catalog=await context.newPage();watch(catalog);
  await catalog.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href,{waitUntil:'domcontentloaded',timeout:60000});
  await catalog.waitForFunction(()=>window.G&&G.PirateIslandArt,null,{timeout:30000});
  await catalog.evaluate(rows=>rows.forEach(r=>{if(G.Img.file(r.key)!==r.face_file.replace(/^images\//,''))throw Error('도감의 최신 여급 '+r.id);}),spec.portraits);
  assert.equal(checks.length,7);assert.deepStrictEqual(errors,[]);assert.deepStrictEqual(failed,[]);
  fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({checks,errors,failed},null,2));
  console.log('해적섬 여급 7명·14장: 저장 복원·술집/거리 연결·패널·대화 14개·도감 통과. 오류 0.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
