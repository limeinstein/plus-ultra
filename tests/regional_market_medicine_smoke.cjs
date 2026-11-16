'use strict';
const assert = require('assert/strict');
const path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:960,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 try{
 await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.resolve(__dirname,'../index.html')).href));
 await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  await G.Game.ensureGeo(); G.State.newGame({name:'시장시험',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
  const s=G.Game.state,R=G.R,M=G.Scenes.city.B.market;
  s.date.y=1600;s.settings.res=0.35;s.player.gold=100000000;
  const check=(v,msg)=>{if(!v)throw Error(msg);};
  const jewels=G.ITEMS.filter(x=>x.marketCollection==='jewels_20261116'),meds=G.ITEMS.filter(x=>x.kind==='medicine');
  check(jewels.length===50&&meds.length===20,'상품 수');
  check(new Set(G.ITEMS.map(x=>x.id)).size===G.ITEMS.length,'중복 ID');
  const distribution=G.REGIONS.map((_,r)=>jewels.filter(x=>x.reg.includes(r)).length);
  check(distribution.every(n=>n>=4&&n<=5),'지역별 균등');
  const seen=new Set();let empty=0,full=0,legendSeen=0,target;
  for(let week=0;week<160;week++){
   s.day=week*G.BALANCE.marketMedicineDays;
   for(const c of G.CITY_DATA){if(!c)continue;const st=M.stock(c),ms=st.filter(x=>x.kind==='medicine');
    check(ms.length<=1,'약 시장 전체 1개 이하');ms.length?full++:empty++;
    for(const it of st){if(it.marketCollection){seen.add(it.id);check(it.reg.includes(c.region),'지역 제한');if(it.subRegion)check(G.subRegion(c)===it.subRegion,'세부 지역 제한');}if(it.legendary)legendSeen++;}
    if(ms.length&&!target)target={city:c.id,day:s.day,id:ms[0].id};
   }
  }
  check(seen.size===70,'모든 신상품 입고 '+seen.size);check(empty&&full&&legendSeen,'빈 재고와 전설 입고');
  s.day=target.day;const c=G.CITY_DATA[target.city],it=G.ITEM[target.id];
  check(M.buyMax(it,1)===1,'약 수량 상한');
  const old={choose:G.UI.choose,number:G.UI.number,confirm:G.UI.confirm,say:G.Scenes.city.say};let picked=false;
  G.UI.choose=async()=>picked?null:(picked=true,it.id);G.UI.number=async()=>1;G.UI.confirm=async()=>true;G.Scenes.city.say=async()=>{};
  try{await M.buy(c);}finally{Object.assign(G.UI,{choose:old.choose,number:old.number,confirm:old.confirm});G.Scenes.city.say=old.say;}
  check(R.itemCount(it.id)===1,'실제 구매');check(!M.stock(c).some(x=>x.id===it.id),'구매 후 품절');
  const save=G.State.serialize();G.Game.state=G.State.deserialize(save);
  check(!M.stock(c).some(x=>x.id===it.id),'저장 복원 후 품절');
  G.Game.state.player.hp=95;check(R.useMedicine(it.id)===5&&G.Game.state.player.hp===100,'상한 회복');check(R.itemCount(it.id)===0,'약 소모');
  R.addItem(it.id);check(R.useMedicine(it.id)===0&&R.itemCount(it.id)===1,'건강 가득 시 보존');
  G.Game.state.player.hp=15;check(R.useMedicine(it.id)===it.heal,'낮은 건강 회복');
  const ginseng=meds.find(x=>x.name==='산삼');R.addItem(ginseng.id);R.addItem(ginseng.id);G.Game.state.player.hp=1;
  check(R.useMedicine(ginseng.id)===99&&R.itemCount(ginseng.id)===1,'산삼 완전 회복·묶음 1개 소모');
  G.Game.state.player.hp=50;G.Info.open('items');
  return {distribution,seen:seen.size,empty,full,legendSeen};
 });
 const button=page.locator('[data-med]').first();await button.waitFor();await button.click();
 assert.equal(await page.evaluate(()=>G.Game.state.player.hp),100);
 console.log(JSON.stringify(result));assert.deepEqual(errors,[]);console.log('PASS: 70종·지역 배분·희소 재고·구매·저장 복원·약 소모·소지품 사용·콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
