/* 실제 해전: 이동한 배를 겨누고, 그림·물살·속도 벡터가 같은 방향으로 돌진한다. */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'docs/sea-monster-battle');
async function run(){
  fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1200,height:800}});
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
    await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title');
    await page.evaluate(async()=>{
      const s=G.Game.state=G.State.newGame({name:'상어 돌진 방향',nation:'PT',job:'explorer',age:22,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{nav:2},lg:[],diff:'normal'});
      s.settings.res=.35;s.settings.shake=false;s.loc={mode:'sea',lon:-25,lat:32,heading:0};await G.Game.ensureGeo();G.SeaMonsters.sync();
      await Promise.all([G.SeaMonsterSprite.preload(['man-eating-shark']),G.WaterSplash.preload(),G.ShipSprite.preload(s.fleet.ships.map(x=>x.type))]);
      window.sharkWakes=[];const emit=G.WaterSplash.emit;G.WaterSplash.emit=function(st,id,x,y,scale,angle){if(id==='wake')sharkWakes.push({angle,x,y});return emit.apply(this,arguments);};
    });
    for(let i=0;i<8;i++){
      const result=await page.evaluate(async({i})=>{
        const B=G.Scenes.battle,M=G.SeaMonsters,npc=M.npc(M.sync()['man-eating-shark']);npc.center={lon:-25,lat:32};G.Game.go('battle',{npc});
        const st=B.runtime(),en=st.enFlag,me=st.myFlag,angle=i*Math.PI/4+(i%2?.13:0),distance=220;
        function diff(a,b){return Math.abs(G.U.angDiff(a,b));}
        en.x=en.y=0;en.heading=angle+Math.PI;en.attackCd=0;me.x=Math.cos(angle)*distance;me.y=Math.sin(angle)*distance;
        me.halt=true;me.vel=[0,0];me.guns.n=0;me.hp=me.maxHp=5000;sharkWakes.length=0;
        B.headless=true;let launched=false,launchAngle=0,targetAngle=0,windupAim=false,turnBeforeLaunch=false;
        try{
          for(let n=0;n<40;n++){
            if(i%2&&n===10){me.x=Math.cos(angle+.28)*distance;me.y=Math.sin(angle+.28)*distance;}
            const x=en.x,y=en.y;B.update(.05);
            if(n===20){targetAngle=Math.atan2(me.y-en.y,me.x-en.x);windupAim=diff(en.chargeHeading,targetAngle)<1e-6;turnBeforeLaunch=diff(en.heading,targetAngle)<.15;}
            if(en.chargeStage==='rush'){
              launched=true;targetAngle=Math.atan2(me.y-y,me.x-x);launchAngle=Math.atan2(en.vel[1],en.vel[0]);break;
            }
          }
          if(!launched)throw Error('돌진 시작 실패');
          const firstWake=sharkWakes[0],cv=document.createElement('canvas');cv.width=cv.height=300;const ctx=cv.getContext('2d');
          let facing=null,sourceCol=null;const draw=ctx.drawImage.bind(ctx);
          ctx.drawImage=function(){const m=ctx.getTransform();facing=Math.atan2(m.b,m.a);sourceCol=Math.round(arguments[1]/224);return draw.apply(null,arguments);};
          M.draw(ctx,en,150,160,st.t);
          const spriteHeading=-sourceCol*Math.PI/4+facing;
          let locked=true,hurt=false;
          if(i%2){
            me.x+=150;me.y-=120;
            for(let n=0;n<6;n++){B.update(.05);locked=locked&&diff(Math.atan2(en.vel[1],en.vel[0]),launchAngle)<1e-6;}
          }else{
            for(let n=0;n<14;n++)B.update(.05);hurt=me.hp<5000;
          }
          // 준비 중 저장도 배 참조를 되살린다. 0번 해전에서만 실제로 복원한다.
          let saved=true;
          if(i===0){
            en.chargeStage='windup';en.chargeTime=.3;en.chargeTarget=me;st.paused=true;
            const raw=G.State.serialize(),parsed=JSON.parse(raw);G.Game.state=G.State.deserialize(raw);G.Game.go('battle',{battle:parsed.battle});
            const restored=B.runtime();saved=restored.enFlag.chargeTarget===restored.myFlag;
          }
          return {launched,windupAim,turnBeforeLaunch,launchError:diff(launchAngle,targetAngle),wakeError:diff(firstWake.angle,launchAngle),spriteError:diff(spriteHeading,launchAngle),locked,hurt,saved};
        }finally{B.headless=false;}
      },{i});
      assert(result.launched&&result.windupAim&&result.turnBeforeLaunch,'준비 중 배를 바라봄 '+i);
      assert(result.launchError<1e-6&&result.wakeError<1e-6&&result.spriteError<1e-6,'몸·속도·첫 물살 방향 일치 '+i);
      assert(result.locked&&result.saved);if(i%2===0)assert(result.hurt,'정확히 겨눈 배에 실제 충돌 '+i);
      console.log(i+' 방향 · 현재 배 위치 조준 · 그림/물살/이동 일치 · '+(i%2?'출발 뒤 직선 유지':'실제 충돌'));
    }
    // 배가 왼쪽에 있을 때: 상어가 오른쪽에서 몸을 돌려 왼쪽으로 달려오는 실제 장면.
    await page.evaluate(()=>{
      const B=G.Scenes.battle,M=G.SeaMonsters,npc=M.npc(M.sync()['man-eating-shark']);npc.center={lon:-25,lat:32};G.Game.go('battle',{npc});
      const st=B.runtime(),en=st.enFlag,me=st.myFlag;en.x=220;en.y=80;en.heading=0;en.attackCd=0;me.x=-180;me.y=-10;me.halt=true;me.guns.n=0;me.vel=[0,0];me.hp=me.maxHp=5000;
      B.headless=true;try{for(let i=0;i<31;i++)B.update(.05);}finally{B.headless=false;}
      st.paused=true;B.update(.001);
    });
    await page.screenshot({path:path.join(OUT,'shark-aim.png')});
    assert.deepEqual(errors,[]);console.log('OK · 8방향·움직이는 배 조준·잔여 각도·첫 물살·직선 돌진·충돌·저장 · 콘솔 오류 0');
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
