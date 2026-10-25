/* 항해 중 보급 경고 (2026-10-25) — node tests/supply_warn_smoke.js   (BROWSER_EXE=크롬 경로)
   맞바람·순풍이 사흘마다 바뀌는 90일 항해(리스본→캘리컷, 보급 60일분)에서 부관의 창은 첫 경고와 「정말 급할 때」 한 번씩만, 그 사이는 귀퉁이 알림 몇 번 (예전: 창 9번) */
// 보급 경고 횟수 시뮬레이션: 리스본 출항 → 먼 항구. 하루마다 runDay, 바람은 FLIP일마다 맞바람/순풍, 배는 그날 속력만큼 뱃길을 따라 움직인다.
// 매 CLICK일마다 바다 한 점을 눌러 길을 새로 잡는 것도 흉내 낸다 (0이면 안 함)
const path=require('path');const {pathToFileURL}=require('url');const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'), DEST=152, FOOD=60, DAYS=90, FLIP=3, CLICK=0;
function ok(v,msg){ if(!v) throw new Error(msg); console.log('  ✓ '+msg); }
(async()=>{const b=await chromium.launch({executablePath: process.env.BROWSER_EXE || undefined, args:['--use-gl=swiftshader','--no-sandbox','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
try{const p=await b.newPage({viewport:{width:960,height:540}});
await p.addInitScript(()=>{window.requestAnimationFrame=cb=>0;});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
await p.waitForFunction(()=>window.G&&G.Game&&G.Scenes&&G.Scenes.sea,null,{timeout:180000});
const r=await p.evaluate(async([DEST,FOOD,DAYS,FLIP,CLICK])=>{await G.Game.ensureGeo();
 G.State.newGame({name:'시험',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
 const s=G.Game.state; s.settings.res=0.3; G.State.save=()=>true;
 const dialogs=[], toasts=[], UI=G.UI;
 UI.say=async(t)=>{ if(/떨어질 수 있습니다|남지 않았습니다/.test(t)) dialogs.push({day:s.day, t:String(t).slice(0,80)}); };
 const t0=UI.toast; UI.toast=(t,i,ms)=>{ if(/보급/.test(t)) toasts.push({day:s.day,t:String(t).slice(0,60)}); };
 UI.alert=async()=>{}; UI.ask=async(t,ch)=>{const l=ch.map(o=>typeof o==='string'?o:o.value);return l[l.length-1];}; UI.confirm=async()=>false; UI.choose=async()=>null;
 G.U.chance=()=>false;
 G.Game.go('sea',{depart:0}); await new Promise(r=>setTimeout(r,1500));
 const SEA=G.Scenes.sea, st=SEA.runtime(), R=G.R;
 s.fleet.food=FOOD*R.dailyUse(); s.fleet.water=FOOD*R.dailyUse();
 SEA.goCity(DEST); st.paused=false;
 const w0=R.wind; R.wind=function(lon,lat,date,dc){ const w=w0.apply(this,arguments); const crs=st.crs!=null?st.crs:s.loc.heading; const head=Math.floor(dc/FLIP)%2===0; return {dir: head? crs : crs+Math.PI, spd: Math.max(0.55,w.spd)}; };
 const move=()=>{ if(!st.path) return; let v=R.fleetSpeed(st.crs!=null?st.crs:s.loc.heading, st.wind||{dir:0,spd:.5}); let i=st.pathI||0;
   while(v>0 && i<st.path.length){ const q=st.path[i], dx=G.Geo.wrapLon(q[0]-s.loc.lon), dy=q[1]-s.loc.lat, d=Math.hypot(dx,dy);
     st.crs=Math.atan2(dy,dx); if(d<=v){ s.loc.lon=q[0]; s.loc.lat=q[1]; v-=d; i++; } else { s.loc.lon+=dx/d*v; s.loc.lat+=dy/d*v; v=0; } }
   st.pathI=i; };
 const etas=[]; const d0=s.day;
 for(let day=0; day<DAYS && st.path && (st.pathI||0)<st.path.length-1; day++){
   if(CLICK && day>0 && day%CLICK===0 && st.path){ const q=st.path[Math.min(st.path.length-1,(st.pathI||0)+8)]; SEA.setTarget(q[0],q[1]); setTimeout(()=>{},0); SEA.goCity(DEST); }
   await SEA.runDay(); move(); etas.push([day, SEA.etaDays(), Math.min(R.daysOfFood(),R.daysOfWater())]);
 }
 return {dialogs, toasts, days:s.day-d0, etas:etas.filter((x,i)=>i%6===0)};
},[DEST,FOOD,DAYS,FLIP,CLICK]);
console.log(JSON.stringify({dialogs:r.dialogs.map(d=>d.day+': '+d.t), toasts:r.toasts.map(t=>t.day)}));
ok(r.days>=60, '맞바람·순풍이 사흘마다 바뀌는 항해를 '+r.days+'일 돌렸다');
ok(r.dialogs.length>=1 && /떨어질 수 있습니다/.test(r.dialogs[0].t), '첫 경고는 부관이 말로 (창)');
ok(r.dialogs.length<=2 && r.dialogs.slice(1).every(d=>/남지 않았습니다/.test(d.t)), '창은 첫 경고와 「정말 급할 때」 한 번뿐 — '+r.dialogs.length+'번 (예전 9번)');
ok(r.toasts.every((t,i)=>!i || t.day-r.toasts[i-1].day>=15), '그 사이는 귀퉁이 알림만, 15일 넘게 띄워서 — '+r.toasts.map(t=>t.day).join(','));
ok(!errs.length, '콘솔 오류 0 '+errs.slice(0,3).join(' | '));
}finally{await b.close();}})().catch(e=>{console.error('✗ '+e.message);process.exit(1);});
