/* 제작된 초상 쌍의 재등록·화자·동료·도감 연결을 실제 실행 자료로 확인한다. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/portrait-pairs-20261110');
const audit=process.argv.includes('--audit');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  fs.mkdirSync(OUT,{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Hist&&G.Legend&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const report=await page.evaluate(()=>{
   const I=G.Img,A=G.Art;
   const get=(id,name,sp)=>{
    const face=I.pick(A.portraitKeys(sp.portrait)),half=I.pick(sp.half||[]);
    const ff=face&&I.file(face),hf=half&&I.file(half);
    const stem=s=>s&&s.replace(/\.(png|webp|jpg)$/,'').replace(/_half$/,'').replace(/^characters\/player_half_/,'portraits/player/');
    return {id,name,face,half,faceFile:ff,halfFile:hf,matched:!!ff&&!!hf&&stem(ff)===stem(hf)};
   };
   const mates=G.MATES.map(m=>get(m.id,m.name,G.Legend.speaker(m.id)));
   const history=Object.keys(G.HIST_FIG).map(id=>get(id,G.HIST_FIG[id].name,G.Hist.speaker(id)));
   return {mates,history,mismatches:mates.concat(history).filter(r=>r.face&&r.half&&!r.matched)};
  });
  fs.writeFileSync(path.join(OUT,audit?'runtime-before.json':'runtime-after.json'),JSON.stringify(report,null,2));
  console.log('동료 '+report.mates.length+'명, 역사 인물 '+report.history.length+'명. 서로 다른 파일 쌍 '+report.mismatches.length+'개');
  if(audit){console.log(JSON.stringify(report.mismatches));return;}
  assert.deepStrictEqual(report.mismatches,[],'전체 화자의 얼굴·무릎상 파일 쌍');
  const fixed=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/portrait_pair_records_20261110.json'),'utf8'));
  for(const row of fixed){
   for(const kind of ['face','half'])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,row[kind+'_file']))).digest('hex'),row[kind+'_sha256'],row.id+' '+kind+' 검증한 원화 보존');
   const selected=(row.id==='tam'||row.id==='maria'?report.mates:report.history).find(r=>r.id===row.id);
   assert(selected&&selected.matched,row.id+' 얼굴과 몸의 물리 파일 일치');
   assert.equal(selected.faceFile,row.face_file.replace(/^images\//,''));
   assert.equal(selected.halfFile,row.half_file.replace(/^images\//,''));
   await page.evaluate(async row=>{
    for(const key of [row.key,row.key+'_half']){const im=await G.Img.load(key);if(!im||!im.naturalWidth)throw Error(key+' 로드 실패');if(!G.PORTRAIT_FACES[key])throw Error(key+' 얼굴 좌표 없음');}
   },row);
  }
  // 실제 대화는 새 상태에서 같은 화자 함수를 사용한다.
  await page.evaluate(()=>{
   G.Game.state=G.State.newGame({name:'초상 짝 확인',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   Object.assign(G.Game.state.settings,{res:.35,sound:0,music:0});G.UI.clearScreen();
  });
  for(const row of fixed){
   for(const mode of ['half','face']){
    await page.evaluate(({id,mode})=>{const sp=(id==='tam'||id==='maria')?G.Legend.speaker(id):G.Hist.speaker(id);if(mode==='face')sp.noStand=true;window.__pairDialog=G.UI.say('인물의 얼굴과 복식이 같은 원화인지 확인합니다.',sp);},{id:row.id,mode});
    await page.waitForSelector(mode==='half'?'.dlg-actor.active.tall':'.dlg .pframe');
    await page.waitForTimeout(260);await page.screenshot({path:path.join(OUT,row.id+'-'+mode+'.png')});
    await page.keyboard.press('Enter');await page.evaluate(()=>window.__pairDialog);
   }
  }
  const catalog=await browser.newPage();catalog.on('pageerror',e=>errors.push(e.message));
  await catalog.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await catalog.waitForFunction(()=>window.G&&G.Hist&&G.Img&&G.MATE.tam,null,{timeout:60000});
  await catalog.evaluate(rows=>rows.forEach(r=>{const sp=(r.id==='tam'||r.id==='maria')?{portrait:G.Art.mateSpec(r.id),half:G.Img.chain.mateHalf(r.id)}:G.Hist.speaker(r.id);if(G.Img.pick(sp.half)!==r.key+'_half'||G.Img.file(G.Img.pick(G.Art.portraitKeys(sp.portrait)))!==r.face_file.replace(/^images\//,''))throw Error('도감 연결 '+r.id);}),fixed);
  assert.deepStrictEqual(errors,[],'브라우저 오류 없음');
  fs.writeFileSync(path.join(OUT,'runtime-checks.json'),JSON.stringify({fixed:fixed.map(r=>r.id),errors},null,2));
  console.log(fixed.length+'명 실제 얼굴/무릎 대화·도감·파일 쌍 검증 통과, 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
