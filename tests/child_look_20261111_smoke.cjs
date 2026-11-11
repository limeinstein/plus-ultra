/* 옛 저장의 자녀 초상을 어머니의 그림 설정에 맞추고 성장 뒤에도 유지한다. */
'use strict';
const assert=require('assert'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files']});const errors=[];
 try{
  const p=await browser.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.resolve(__dirname,'../index.html')).href,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.G&&G.HomeLife&&G.Game.sceneName==='title',null,{timeout:120000});
  const rows=await p.evaluate(()=>{
   const s=G.State.newGame({name:'초상 시험',nation:'PT',job:'explorer',age:35,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'}),H=G.HomeLife,out=[];
   s.date={y:1520,m:6,d:1};
   for(const mother of ['snow_white','cinderella','sleeping_beauty','little_mermaid']){
    for(let n=0;n<20;n++){
     const k={name:'딸'+n,sex:'f',mother,born:{y:1500,m:1,d:n+1},portraitVariant:3};s.player.kids=[k];
     const variant=H.variant(k),again=H.variant(JSON.parse(JSON.stringify(k))),key=G.Img.pick(H.chain(k,false));
     out.push({mother,variant,again,folder:k.lookFolder||'',key});
    }
   }
   const preserved={name:'딸',sex:'f',mother:'snow_white',portraitVariant:2,born:{y:1500,m:1,d:1}};
   out.push({preserved:H.variant(preserved)});
   return out;
  });
  for(const r of rows.filter(r=>r.mother)){
   const want={snow_white:2,cinderella:5,sleeping_beauty:5,little_mermaid:1}[r.mother];assert.equal(r.variant,want,r.mother);assert.equal(r.again,r.variant);assert(r.key&&r.key.includes('_age20_v'+want),'성년 초상 '+JSON.stringify(r));
  }
  assert.equal(rows.at(-1).preserved,2);assert.deepEqual(errors,[]);console.log(JSON.stringify({migrated:rows.length-1,compatiblePreserved:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
