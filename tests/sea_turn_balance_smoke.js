/* 항해 선회 — 방향키(방위로 가기)·마우스 따라가기·바다 누르기(항로)·손으로 키 잡기의 빠르기 균형 (js/scenes/sea.js courseRate — 2026-11-11)
   그림을 그리지 않고 조타만 돌린다 (SEA.arrowTurn·pointerTurn·_steer). node tests/sea_turn_balance_smoke.js */
'use strict';
const {pathToFileURL}=require('url');
const path=require('path'); const {chromium}=require('playwright');
function ok(v,m){ if(!v) throw new Error(m); console.log('  ✓ '+m); }
(async()=>{
 const b=await chromium.launch({executablePath:process.env.BROWSER_EXE||undefined,args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try {
 const errors=[];
 const p=await b.newPage({viewport:{width:640,height:360}});
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.addInitScript(()=>{ window.requestAnimationFrame=()=>0; document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style'); st.textContent='canvas{display:none!important}'; document.head.appendChild(st);}); });
 await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.join(__dirname,'..','index.html')).href,{timeout:120000});
 await p.waitForFunction(()=>window.G&&G.Game&&G.Scenes&&G.Scenes.sea,null,{timeout:180000});
 await p.evaluate(async()=>{ await G.Game.ensureGeo(); G.Nav.init(); G.State.newGame({name:'t',nation:'PT',job:'explorer',age:20,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'}); G.Game.state.settings.res=0.2; G.Game.go('sea',{depart:0}); });
 const out=await p.evaluate(()=>{
   const SEA=G.Scenes.sea, s=G.Game.state, st=SEA.runtime(), U=G.U, res={};
   function reset(h){ s.loc.heading=h; st.paused=false; st.stopping=false; st.path=null; st.target=null; st.manual=false; st.keys={}; st.arrows={}; st.arrowSteer=false; st.pointerSteer=false; st.pointerTurning=false; st.pointerWant=null; st.dirCrs=h; st.crs=h; st.tackTheta=0; st.tackSide=0; st.arrowHeld=0; st.turnHeld=0; st.thr=1; st.cruise=true; st.dW=Infinity; }
   function run(setup, target, spd, maxT){
     reset(0); st.speed=spd; setup(); const dt=1/60; let t=0;
     while(t<maxT){ SEA.arrowTurn(dt); SEA.pointerTurn(dt); const sp=(st.manual&&(st.keys.left||st.keys.right)&&spd>1)?1:spd; SEA._steer(dt, sp); t+=dt; if(Math.abs(U.angDiff(s.loc.heading,target))<2*Math.PI/180) break; }
     const sp=(st.manual)?Math.min(spd,1):spd;
     return t>=maxT?99:+(t*sp).toFixed(2);   // 게임 속 초 (= 실제 초 × 배속 → 도는 반경에 비례)
   }
   const N=Math.PI/2, W=Math.PI;
   const sets={
     key:(tg)=>()=>{ st.arrows= tg===N?{up:true}:{left:true}; st.arrowSteer=true; },
     mouse:(tg)=>()=>{ st.pointerSteer=true; st.followArmed=true; st.pointerWant=tg; if(!(G.Ctrl.sens().seaTurn>0)){st.dirCrs=tg; st.crs=tg;} },
     click:(tg)=>()=>{ st.dirCrs=tg; st.crs=tg; },
     helm:(tg)=>()=>{ st.manual=true; st.dirCrs=null; st.keys={left:true}; st.thr=1; st.cruise=true; }
   };
   ['slow','normal','fast'].forEach(sens=>{ s.settings.ctrlSens=sens;
     ['caravel','galleon'].forEach(sh=>{ s.fleet.ships.forEach(x=>{x.type=sh;});
       [1,4].forEach(spd=>{ const row={};
         ['key','mouse','click','helm'].forEach(k=>{ [N,W].forEach(tg=>{ if(k==='helm'&&tg===W) return; s.settings.keyMode=k==='helm'?'helm':'dir'; row[k+(tg===N?'90':'180')]=run(sets[k](tg),tg,spd,15); }); });
         s.settings.keyMode='dir'; res[sens+'|'+sh+'|'+spd]=row; }); }); });
   return res;
 });
 try {
 for(const k in out) console.log('    '+k.padEnd(20), Object.entries(out[k]).map(([a,v])=>a+'='+v).join('  '));
 const R=(sens,sh,spd)=>out[sens+'|'+sh+'|'+spd], near=(a,b,k)=>Math.abs(a-b)<=Math.max(0.07,b*(k||0.05));   // 한 걸음(×4면 1/15 게임 초)만큼의 어긋남은 봐준다
 const all=Object.keys(out);
 ok(all.every(k=>near(out[k].key90,out[k].mouse90)&&near(out[k].key180,out[k].mouse180)),'방향키와 마우스 따라가기가 같은 빠르기로 돈다 (감도·배·배속 모두)');
 ok(['slow','normal','fast'].every(se=>['caravel','galleon'].every(sh=>near(R(se,sh,1).key90,R(se,sh,4).key90,0.08)&&near(R(se,sh,1).mouse180,R(se,sh,4).mouse180,0.08))),'배속 ×1과 ×4에서 도는 반경이 같다 (게임 속 시간)');
 ok(['slow','normal'].every(se=>R(se,'galleon',1).key90>R(se,'caravel',1).key90&&R(se,'galleon',1).mouse90>R(se,'caravel',1).mouse90),'둔한 배(갤리온)는 방향키·마우스 모두 날랜 배(카라벨)보다 천천히 돈다');
 ok(all.every(k=>out[k].key90>=out[k].click90-0.05&&out[k].mouse90>=out[k].click90-0.05),'어느 조작도 선체가 도는 빠르기(바다를 눌러 잡은 항로)보다 빠르지 않다');
 ok(['fast'].every(se=>['caravel','galleon'].every(sh=>near(R(se,sh,1).key90,R(se,sh,1).click90))),'「빠르게」 감도는 방향키·마우스 모두 곧바로 (선체 빠르기만)');
 ok(all.filter(k=>!/^slow/.test(k)).every(k=>out[k].helm90<=out[k].click90*1.25+0.05),'손으로 키 잡기(돛을 다 폈을 때, 보통·빠르게 감도)도 선체 빠르기와 비슷하다');
 ok(!errors.length,'콘솔 오류 0 '+errors.join(' | '));
 console.log('통과');
 } catch(e){ console.error('✗ '+e.message); process.exitCode=1; }
 } finally { await b.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
