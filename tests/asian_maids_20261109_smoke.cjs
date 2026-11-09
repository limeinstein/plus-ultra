/* 새 지역 여급 10쌍: 묶음 선택·파일 해독·얼굴 좌표·얼굴/무릎 대화·도감. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/asian-maids-20261109/runtime');
const spec=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/asian_maids_20261109_prompts.json'),'utf8'));
(async()=>{
 assert.equal(spec.portraits.length,10);assert.equal(spec.event_shots,false);
 assert.deepStrictEqual(spec.portraits.reduce((a,r)=>(a[r.group]=(a[r.group]||0)+1,a),{}),{'조선':2,'중국':3,'필리핀':2,'인도네시아':3});
 assert.equal(new Set(spec.portraits.map(r=>r.key)).size,10);
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],checks=[];
 try{
  fs.mkdirSync(OUT,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>{if(r.resourceType()==='image')failed.push(r.url());});};
  const page=await context.newPage();watch(page);
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Img&&G.Img.maidList&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await page.evaluate(()=>{
   G.Game.state=G.State.newGame({name:'지역 여급 새 그림 확인',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   Object.assign(G.Game.state.settings,{res:.35,sound:0,music:0});
  });
  for(const row of spec.portraits){
   const check=await page.evaluate(async row=>{
    const I=G.Img,A=G.Art;
    const city=G.CITY_DATA[row.style==='korea'?190:row.style==='china'?174:row.style==='seasia'?170:167];
    const check=(v,m)=>{if(!v)throw Error(row.id+': '+m);};
    check(I.maidPool(city).includes(row.style),'지역에 맞는 여급 묶음');
    check(I.maidList(row.style,city).filter(k=>k===row.key).length===1,'묶음 안 새 얼굴 한 번 등록');
    check(I.pick(I.chain.halfFor([row.key]))===row.key+'_half','같은 원화의 무릎상');
    for(const [key,w,h] of [[row.key,448,448],[row.key+'_half',1024,1536]]){
     const im=await I.load(key);check(im&&im.naturalWidth===w&&im.naturalHeight===h,'규격·해독 '+key);
     check(!!G.PORTRAIT_FACES[key]&&G.PORTRAIT_FACES[key].box[2]>0,'얼굴 좌표 '+key);
    }
    G.Game.state.loc.city=city.id;G.Town.hidden(true);
    await I.load(I.pick(I.chain.interior('tavern',city)));G.Game.setScene(G.Scenes.city.interior('tavern',city));
    window.__asianMaidWho={name:row.group+' 여급 '+row.number,lang:3,portrait:A.withImg(A.npcSpec('refmaid:'+row.id,'maid',I.folkStyle(city),'f'),[row.key]),half:[row.key+'_half']};
    check(I.pick(A.portraitKeys(window.__asianMaidWho.portrait))===row.key,'실제 대화의 얼굴 선택');
    return {id:row.id,group:row.group,face:row.key,half:row.key+'_half',file:I.file(row.key)};
   },row);
   for(const mode of ['half','face']){
    await page.evaluate(mode=>{
     const who=Object.assign({},window.__asianMaidWho);if(mode==='face')who.noStand=true;
     window.__asianMaidDialog=G.UI.say('어서 오세요. 차 한잔 드시며 쉬어 가세요.',who);
    },mode);
    await page.waitForSelector(mode==='half'?'.dlg-actor.active.tall':'.dlg .pframe');
    await page.waitForTimeout(200);await page.screenshot({path:path.join(OUT,row.id+'_'+mode+'.png')});
    await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('.dlg'),null,{timeout:5000});await page.evaluate(()=>window.__asianMaidDialog);
   }
   checks.push(check);
  }
  const catalog=await context.newPage();watch(catalog);
  await catalog.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href+'?view=assets',{waitUntil:'domcontentloaded',timeout:60000});
  await catalog.waitForFunction(()=>window.G&&G.Img&&G.Img.maidList,null,{timeout:30000});
  await catalog.evaluate(rows=>rows.forEach(r=>{if(!G.Img.has(r.key)||!G.Img.has(r.key+'_half')||!G.Img.maidList(r.style).includes(r.key))throw Error('도감 새 지역 여급 '+r.id);}),spec.portraits);
  assert.equal(checks.length,10);assert.deepStrictEqual(errors,[]);assert.deepStrictEqual(failed,[]);
  fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({checks,errors,failed},null,2));
  console.log('조선2·중국3·필리핀2·인도네시아3: 얼굴/무릎20장·지역 묶음·대화20개·도감 통과. 오류0, 이벤트샷0.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
