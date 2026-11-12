/* 영어 발견 설명·가족의 말씨를 한국어 어미 변환 없이 표시하고 되돌린다. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||undefined,args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await p.waitForFunction(()=>window.G&&G.FamVoice&&G.DiscVoice&&G.I18N&&G.Game.sceneName==='title',null,{timeout:120000});
  const result=await p.evaluate(()=>{
   G.I18N.set('en');let observations=0;
   for(const rows of Object.values(G.DISC_FACTS))for(const row of rows){
    const pair=row.slice(1),translated=G.I18N.tr(pair[0],true);if(!translated||/[가-힣]/.test(translated))continue;
    for(const reg of ['sp','yo','ban','hao','hage'])if(G.DiscVoice.conv(pair,reg)!==translated.trim())throw Error('영어 관찰의 말씨 변환');
    observations++;if(observations>=200)break;
   }
   if(observations<200)throw Error('영어 관찰 표본 부족');
   const found=Object.entries(G.DISC_FAM).find(([id,lines])=>/\bFather\b/.test(G.I18N.tr(lines[1],true)||''));
   if(!found)throw Error('아이 대사 표본 없음');
   const [id,lines]=found,d={id},young=G.FamVoice.line(d,{kind:'kid',age:5}),older=G.FamVoice.line(d,{kind:'kid',age:8});
   if(!/Daddy/.test(young)||/\bFather\b|[가-힣]/.test(young)||!/\bFather\b/.test(older))throw Error('어린아이 영어 말씨');
   G.I18N.set('ko');if(!/[가-힣]/.test(G.FamVoice.line(d,{kind:'kid',age:5})))throw Error('한국어 복원');
   return{observations,young,older,koreanRestored:true};
  });
  assert.deepEqual(errors,[]);console.log(JSON.stringify({...result,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
