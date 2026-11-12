/* 성문 탐험 준비의 난이도별 실제 날짜·확인 문구와 취소 환불을 확인한다. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.BROWSER_EXE||undefined,args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:960,height:540}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.resolve(__dirname,'../index.html')).href);await p.waitForFunction(()=>window.G&&G.Scenes.city.B.gate&&G.Game.sceneName==='title',null,{timeout:120000});
 const rows=await p.evaluate(async()=>{
  await G.Game.ensureGeo();const gate=G.Scenes.city.B.gate,C=G.Scenes.city,UI=G.UI,game=G.Game;
  const original={outfit:gate.outfit,undo:gate.undo,ask:C.mateAsk,mate:C.mate,fade:UI.fade,go:game.go,pass:game.passDays};
  const rows=[];let answer=true,mount={id:'walk',n:0},refunds=0,question='',destination=null;
  gate.outfit=async()=>mount;gate.undo=()=>refunds++;C.mateAsk=async text=>{question=text;return answer;};C.mate=async()=>{};UI.fade=async cb=>cb();game.go=(name,data)=>{destination={name,data};};
  const fresh=diff=>{const s=G.State.newGame({name:'준비 시험',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff});s.settings.autosave=false;s.settings.res=.35;s.fleet.crew=20;destination=null;question='';refunds=0;return s;};
  try{
   for(const [diff,days] of [['easy',1],['normal',3],['original',10]])for(const lang of ['ko','en']){
    G.I18N.set(lang);const s=fresh(diff),day=s.day,c=G.CITY_DATA[s.player.home];await gate.explore(c);
    if(s.day-day!==days||destination?.name!=='land'||!question.includes(days+'일'))throw Error('탐험 준비: '+diff+'/'+lang);
    if(lang==='en'&&/[가-힣]/.test(G.I18N.tx(question)))throw Error('영문 탐험 준비: '+G.I18N.tx(question));
    rows.push({diff,lang,days:s.day-day});
   }
   G.I18N.set('ko');let s=fresh('normal'),day=s.day;answer=false;mount={id:'horse',n:1};await gate.explore(G.CITY_DATA[s.player.home]);
   if(s.day!==day||destination||refunds!==1)throw Error('취소 날짜·탈것 반환');
   answer=true;mount=null;s=fresh('normal');day=s.day;await gate.explore(G.CITY_DATA[s.player.home]);if(s.day!==day||destination||question)throw Error('장비 창 취소');
   return rows;
  }finally{gate.outfit=original.outfit;gate.undo=original.undo;C.mateAsk=original.ask;C.mate=original.mate;UI.fade=original.fade;game.go=original.go;game.passDays=original.pass;}
 });
 assert.deepEqual(errors,[]);console.log(JSON.stringify({rows,cancelled:true,errors}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
