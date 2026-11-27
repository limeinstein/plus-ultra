/* 실제 저장 직렬화 전후의 강수·재해와 온대 항로를 확인한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=process.env.OUT||path.join(root,'artifacts/weather-save-routes-20261127');
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
try{const p=await b.newPage({viewport:{width:960,height:540}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.addInitScript(()=>{requestAnimationFrame=()=>0});
await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
const result=await p.evaluate(async()=>{
 await G.Game.ensureGeo();G.Nav.init();G.State.save=()=>false;G.UI.toast=()=>{};G.U.chance=()=>false;G.BALANCE.disaster.random=0;
 const rn=G.Rain,d=G.Disaster,s=G.Game.state=G.State.newGame({name:'강수 저장 검사',nation:'PT',job:'explorer',age:22,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
 s.flags.prologue=true;s.loc={mode:'sea',lon:-25,lat:30,heading:0};s.date={y:1480,m:7,d:10};s.fleet.ships=[G.R.newShip('caravel')];s.fleet.food=20;s.fleet.water=20;s.fleet.fatigue=25;s.fleet.discipline=80;
 function roundTrip(){G.Game.state=G.State.deserialize(G.State.serialize());return G.Game.state;}
 const fresh=roundTrip();delete fresh.rain;delete fresh.landWeather;delete fresh.dis;
 const defaults={speed:rn.speedK(),land:rn.landEffect(),active:rn.active(),disasters:d.active().length};
 fresh.rain={lv:2,days:2,order:'catch',asked:true,got:12,n:7};
 const legacy=roundTrip(),oldRain={name:rn.name(),rain:rn.raining(),snow:rn.snowing(),speed:rn.speedK()};
 const beforeWater=legacy.fleet.water;rn.daily([],{});oldRain.water=legacy.fleet.water-beforeWater;
 legacy.rain={lv:2,days:3,order:'catch',asked:true,got:0,n:7,kind:'snow',day:legacy.day};legacy.landWeather={lv:2,days:3,kind:'snow',day:legacy.day};
 const e=d.start({kind:'hurricane',lon:-62,lat:25,heading:.4,speed:.25,curve:.02,r:.8,sev:2});d.travelStep(.3,legacy.loc.lon,legacy.loc.lat,false);
 const dis=JSON.stringify(legacy.dis),weather=JSON.stringify([legacy.rain,legacy.landWeather]);const saved=roundTrip();
 const restored={dis:JSON.stringify(saved.dis)===dis,weather:JSON.stringify([saved.rain,saved.landWeather])===weather,heading:saved.dis.act[0].wind.heading};
 const snowWater=saved.fleet.water;rn.daily([],{});restored.snowWater=saved.fleet.water-snowWater;restored.snowSpeed=rn.speedK();
 saved.day+=5;rn.resume();rn.resume('land');restored.expired=!rn.active()&&!rn.active('land');
 // Old disasters without the new geometry are initialized from actual terrain on first step.
 saved.loc={mode:'land',lon:-100.54,lat:36.63,heading:0};saved.dis={act:[{id:'ds1',kind:'quake',name:'지진',lon:-100.54,lat:36.63,sev:2,r:1.15,start:G.U.dayIndex(saved.date),end:G.U.dayIndex(saved.date)+10}],hp:-1,city:{},seq:1};
 d.travelStep(.05,saved.loc.lon,saved.loc.lat,false);const geom=JSON.stringify(saved.dis.act[0].field);const fieldSave=roundTrip();restored.field=!!fieldSave.dis.act[0].field&&JSON.stringify(fieldSave.dis.act[0].field)===geom;
 const routes=[];
 for(const [a,z] of [[[ -25,30],[-21,31]],[[-7,36],[-4.5,36]],[[-60,23],[-56,24]]]){
  const line=G.Nav.seaPath(...a,...z,10000);routes.push({a,z,points:line?.length||0,clear:!!line&&line.slice(1).every((v,i)=>G.Hydro.clear(line[i],v))});
 }
 return {version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable',defaults,oldRain,restored,routes};
});
assert.deepEqual(result.defaults,{speed:1,land:{speed:1,fatigue:0,discipline:0},active:false,disasters:0});assert(result.oldRain.rain&&!result.oldRain.snow&&result.oldRain.name==='폭우'&&result.oldRain.water>0);assert(result.restored.dis&&result.restored.weather&&result.restored.field&&result.restored.expired&&result.restored.snowWater===0);assert.equal(result.restored.snowSpeed,.76);assert(result.routes.every(r=>r.clear&&r.points>=2));assert.deepEqual(errors,[]);if(process.env.EXPECT_VERSION)assert.equal(result.version,process.env.EXPECT_VERSION);
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({...result,errors},null,2));console.log(JSON.stringify({...result,errors}));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
