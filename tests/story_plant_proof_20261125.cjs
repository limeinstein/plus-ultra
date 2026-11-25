/* 0.351 신규 식물 증거품의 실제 획득·등급·저장·그림·곤충 분류 회귀 검사. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..');
const target=process.env.PLANT_TARGET||root;
const out=path.join(root,'artifacts/story-plant-proof-20261125');
fs.mkdirSync(out,{recursive:true});
const rows=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/story-plant-proof-20261125.json'),'utf8'));
const {chromium}=require(path.join(root,'tools/procedural_art/node_modules/playwright-core'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1100,height:800}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{localStorage.setItem('pu.lang','ko');requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16)});
  await page.goto(pathToFileURL(path.join(target,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G?.Game?.sceneName==='title',null,{timeout:120000});
  const result=await page.evaluate(async rows=>{
   const checks=[];function ok(v,t){if(!v)throw Error(t);checks.push(t)}
   await G.Game.ensureGeo();
   function fresh(){const s=G.Game.state=G.State.newGame({name:'식물 증거 검사',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});s.date={y:1650,m:6,d:1};s.settings.res=.35;s.settings.music=0;s.settings.sound=0;s.flags.prologue=true;return s}
   let s=fresh();const D=G.Disc;
   ok(rows.length===20,'누락 식물 20종');
   const plants=G.DISCOVERIES.filter(d=>D.isPlant(d));
   ok(plants.length>=124&&plants.every(d=>D.relicsOf(d.id).length),'식물 '+plants.length+'종 모두 증거품 연결 — 빠짐 '+plants.filter(d=>!D.relicsOf(d.id).length).map(d=>d.id));
   const ant=G.DISC.ds_518;
   ok(ant.animal&&ant.insect&&!ant.plant&&!D.isPlant(ant)&&!G.Court.isPlant(ant),'잎꾼개미는 동물·곤충, 정원 식물 아님');
   ok(!G.PLANT_RELICS.some(r=>r[0]===ant.id),'잎꾼개미 식물 증거품 없음');
   const images=[];
   for(const row of rows){
    const d=G.DISC[row.disc],r=G.RELIC[row.id];
    ok(D.isPlant(d)&&r&&G.ITEM[row.id]===r&&r.relic===d.id,'식물·물건 등록 '+d.id);
    ok(D.relicsOf(d.id).filter(it=>it.id===row.id).length===1,'증거품 중복 없음 '+d.id);
    const n=G.ITEMS.length;G.registerDiscoveryRelic(d.id,r.name,r.kind,.18,r.desc,{rid:row.id});
    ok(G.ITEMS.length===n&&D.relicsOf(d.id).length===1,'재등록 중복 방지 '+d.id);
    for(const key of ['relics/','items/']){
     const resolved=await G.Img.resolve(key+row.id);ok(!!resolved,'그림 연결 '+key+row.id);
     const img=resolved.img;ok(img.naturalWidth===256&&img.naturalHeight===256,'그림 해독 '+key+row.id);images.push({id:key+row.id,src:img.src});
    }
   }
   // 실제 발견 규칙을 실행한다. 클릭을 기다리는 연출·대화만 생략한다.
   G.UI.say=async()=>{};G.UI.ask=async(t,opts)=>opts[0].value;G.UI.toast=()=>{};
   G.Scenes.discoveryCard=async()=>{};G.Scenes.discoveryReveal=async()=>{};G.Scenes.discoveryVoices=async()=>{};
   G.Names.offer=async()=>{};
   const found=[];
   for(const row of rows){
    s=fresh();s.flags.relicTip=1;
    ok(await D.find(G.DISC[row.disc],'special'),'실제 발견 '+row.disc);
    ok(s.player.items.some(it=>it.id===row.id&&it.disc===row.disc),'실제 소지품 획득 '+row.disc);
    ok(D.hasProof(row.disc)&&D.gradeOf(G.DISC[row.disc]).key==='real','실물 증거 인정 '+row.disc);
    const proof=D.proofItems(row.disc)[0];ok(D.proofSrc(proof).includes(row.id),'보고 미리보기 '+row.disc);
    found.push({disc:row.disc,id:row.id,grade:D.gradeOf(G.DISC[row.disc]).key});
    const saved=G.State.serialize();G.Game.state=G.State.deserialize(saved);
    ok(D.hasProof(row.disc),'증거품 저장·복원 '+row.disc);
    ok(D.announce(row.disc)>0&&!D.lastAnnounce.noProof&&G.Game.state.player.items.some(it=>it.id===row.id&&it.done),'항구 발표 뒤 증거품 보유 '+row.disc);
    G.Game.state=G.State.deserialize(saved);
    const submitted=G.Sponsor.submitProof(G.SPONSORS[0],G.DISC[row.disc]);
    ok(!submitted.noProof&&submitted.given.some(it=>it.id===row.id)&&!G.Game.state.player.items.some(it=>it.id===row.id),'후원자 보고 증거품 제출 '+row.disc);
    G.Game.state=G.State.deserialize(saved);
   }
   G.Game.state=G.State.deserialize(G.State.serialize());
   ok(D.hasProof(rows.at(-1).disc),'증거품 저장·복원');
   return {checks,found,images,plants:plants.length};
  },rows);
  await page.evaluate(rows=>{
   const panel=document.createElement('section');panel.id='proof-qa';panel.style='position:fixed;inset:0;overflow:auto;background:#212525;padding:20px;z-index:999999;color:#edddb2;font:16px sans-serif';
   const h=document.createElement('h1');h.textContent='신규 식물 증거품 20종 · 게임 연결 검사';panel.appendChild(h);
   const grid=document.createElement('div');grid.style='display:grid;grid-template-columns:repeat(5,1fr);gap:10px';
   for(const row of rows){const box=document.createElement('div'),im=document.createElement('img');im.src=G.Disc.proofSrc({id:row.id,disc:row.disc});im.style='display:block;width:150px;height:150px';box.append(im,document.createTextNode(G.ITEM[row.id].name));grid.append(box)}
   panel.appendChild(grid);document.body.appendChild(panel);
  },rows);
  await page.screenshot({path:path.join(out,'game-proof-preview.png')});
  assert.deepEqual(errors,[]);result.errors=errors;
  fs.writeFileSync(path.join(out,'runtime-checks.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({passed:result.checks.length,plants:result.plants,found:result.found.length,images:result.images.length,errors}));
  await page.goto(pathToFileURL(path.join(target,'catalog.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G?.RELIC?.r_ds_590_plant,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>G.RELICS.ds_594.length),1);assert.deepEqual(errors,[]);
  console.log('도감 등록·콘솔 오류 0');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
