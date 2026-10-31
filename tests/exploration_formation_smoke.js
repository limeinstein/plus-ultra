/* 새 동료 12종·384칸, 편대·부족한 탈것·정지/회전·실제 육상 화면을 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
let pw;try{pw=require('playwright');}catch(_){pw=require('../tools/procedural_art/node_modules/playwright-core');}
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/exploration-formation-20261029');
(async()=>{
  const browser=await pw.chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const errors=[];try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT,'test_expedition_formation.html')).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>Object.keys(G.EXPEDITION_FOLLOWERS.sheets).every(id=>G.ExpeditionFormation.ready(id)),null,{timeout:60000});
    await page.waitForFunction(()=>Object.keys(G.EXPEDITION_MOTION.mounts).every(id=>G.ExpeditionMotion.ready(id)),null,{timeout:60000});
    await page.click('#pause');await page.waitForTimeout(200);
    await page.screenshot({path:path.join(OUT,'formation-preview.png'),fullPage:true});
    await page.locator('article').nth(2).screenshot({path:path.join(OUT,'horse-formation.png')});
    const checks=await page.evaluate(()=>{
      function ok(v,msg){if(!v)throw new Error(msg);}
      const F=G.ExpeditionFormation,E=G.ExpeditionMotion,cv=document.createElement('canvas');cv.width=cv.height=1000;const ctx=cv.getContext('2d');
      let frames=0,cases=0;const decoded=[];
      Object.entries(G.EXPEDITION_FOLLOWERS.sheets).forEach(([id,s])=>{
        const im=G.Img.get(s.key);ok(im&&im.naturalWidth===s.width&&im.naturalHeight===s.height,'그림 규격 '+id);ok(s.cells.length===32,'32칸 '+id);
        s.cells.forEach(c=>{ok(c[0]>=0&&c[1]>=0&&c[0]+c[2]<=s.width&&c[1]+c[3]<=s.height,'칸 경계 '+id);ctx.drawImage(im,c[0],c[1],c[2],c[3],0,0,256,256);frames++;});decoded.push(id);
      });
      const mounts=Object.keys(G.EXPEDITION_MOTION.mounts);
      mounts.forEach(id=>{
        for(let dir=0;dir<8;dir++)for(let fr=0;fr<4;fr++){
          const u={pts:[[500,500]],head:Math.PI/2-dir*Math.PI/4,mount:{id,n:99},party:4,moving:true,phase:fr/4,t:0,cache:{}};
          const before=JSON.stringify(u.mount),items=E.draw(ctx,u);ok(items.length===4,'네 자리 '+id);ok(new Set(items.map(i=>i.x+':'+i.y)).size===4,'겹치지 않는 자리 '+id);
          ok(items.filter(i=>i.role==='captain').length===1,'선장 원화 '+id);ok(items.every(i=>!i.fallback),'동료 시트 연결 '+id);
          ok(items.every((it,i)=>!i||items[i-1].y<=it.y),'앞뒤 가림 순서');ok(JSON.stringify(u.mount)===before,'탈것 수 보존');cases++;
        }
      });
      const u={pts:[[0,0]],head:Math.PI/2,mount:{id:'horse',n:4},party:4,moving:true,phase:0.625,t:1,cache:{}};
      const first=E.draw(ctx,u).sort((a,b)=>a.index-b.index);u.moving=false;u.phase=0;u.t=1.1;const stopped=E.draw(ctx,u).sort((a,b)=>a.index-b.index);
      ok(first.every((a,i)=>a.frame===stopped[i].frame&&a.cell===stopped[i].cell),'정지 때 전원 자세 유지');
      u.moving=true;u.phase=0.875;u.t=1.2;const resumed=E.draw(ctx,u).sort((a,b)=>a.index-b.index);ok(resumed.some((a,i)=>a.cell!==stopped[i].cell),'재출발 뒤 걸음 재개');
      u.head=-Math.PI/2;for(let i=0;i<50;i++){u.t+=0.05;E.draw(ctx,u);}ok(Math.abs(E.sample(u).heading+Math.PI/2)<0.02,'최단 방향 회전 완료');
      for(let n=1;n<=4;n++){u.party=n;ok(E.draw(ctx,u).length===n,'소규모 인원 '+n);}
      u.party=4;u.mount.n=1;ok(F.roles(u).filter(r=>r==='foot').length===3,'말 한 필이면 동료는 도보');
      u.mount={id:'wagon',n:1};ok(F.roles(u).slice(1).every(r=>r==='wagon'),'마차 탑승자를 도보 호위와 섞지 않음');
      u.mount={id:'wagon',n:2};ok(F.roles(u)[3]==='wagon','두 번째 마차는 후미');
      u.draft='ox';ok(F.roles(u)[0]==='oxwagon'&&F.roles(u)[3]==='oxwagon','소 마차 연결');
      u.mount={id:'camel',n:4};u.region='st';ok(F.roles(u).every(r=>r==='camel2'),'쌍봉낙타 연결');
      u.mount={id:'horse',n:4};u.draft=null;u.region=null;u.pts=[[0,0],[0,60],[-60,60],[-100,60]];const curve=F.layout(u,Math.PI/2,1);ok(curve.every(it=>Number.isFinite(it.x)&&Number.isFinite(it.heading)),'굽은 길의 자리와 방향');
      u.canStand=(x,y)=>x>=-1;const shore=F.constrain(F.layout(u,Math.PI/2,1),u,1);ok(shore.every(it=>u.canStand(it.x,it.y)),'해안에서 전원 발밑이 육지');ok(new Set(shore.map(it=>it.x+':'+it.y)).size===4,'해안에서도 네 자리 유지');delete u.canStand;
      u.camping=true;ok(E.draw(ctx,u).length===1&&E.sample(u).action==='camp','야영은 기존 공통 야영 장면');u.camping=false;
      const originalGet=G.Img.get;G.Img.get=key=>key.indexOf('expedition_follower_')>=0?null:originalGet(key);
      const fallback=E.draw(ctx,u);G.Img.get=originalGet;ok(fallback.length===4&&fallback.some(i=>i.fallback),'동료 파일을 못 읽어도 편대 유지');
      return{decoded,frames,cases,stopResume:true,turn:true,smallParty:true,scarceMounts:true,regionalVariants:true,curve:true,shore:true,camp:true,fallback:true};
    });
    assert.strictEqual(checks.frames,384);assert.strictEqual(checks.cases,320);
    await page.selectOption('#direction','2');await page.waitForTimeout(600);await page.screenshot({path:path.join(OUT,'formation-east.png'),fullPage:true});
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:90000});
    await page.evaluate(async()=>{await G.Game.ensureGeo();G.Game.state=G.State.newGame({name:'편대 점검',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});G.Game.state.settings.res=0.35;G.Game.state.fleet.crew=4;G.Game.state.fleet.food=100;G.Game.state.fleet.water=100;G.Game.go('land',{from:0,mount:{id:'horse',n:4}});G.Game.state.loc.heading=Math.PI/2;});
    await page.waitForFunction(()=>{const r=G.Scenes.land.runtime();return r&&r.unitItems&&r.unitItems.length===4&&r.unitItems.every(i=>!i.fallback);},null,{timeout:60000});
    await page.waitForTimeout(700);await page.screenshot({path:path.join(OUT,'horse-coast-in-game.png')});
    const coast=await page.evaluate(()=>{const r=G.Scenes.land.runtime();return r.unitItems.every(it=>G.Geo.isLand(r.cam.lon+(it.x-800)/r.cam.zoom,r.cam.lat-(it.y-450)/r.cam.zoom));});
    assert(coast,'실제 리스본 해안에서도 전원의 발밑은 육지');
    await page.evaluate(()=>{const l=G.Game.state.loc,r=G.Scenes.land.runtime();l.lon+=1.5;r.cam.lon=l.lon;r.cam.lat=l.lat;r.trail=[];});
    await page.waitForTimeout(500);await page.screenshot({path:path.join(OUT,'horse-in-game.png')});
    const runtime=await page.evaluate(()=>({scene:G.Game.sceneName,crew:G.Game.state.loc.party,mount:G.Game.state.loc.mount,items:G.Scenes.land.runtime().unitItems.map(i=>({role:i.role,index:i.index,x:i.x,y:i.y}))}));
    assert.strictEqual(runtime.crew,4);assert.strictEqual(runtime.items.length,4);assert.deepStrictEqual(errors,[],'콘솔 오류');
    fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify({checks,runtime,coast,errors},null,2));
    console.log('통과 — 동료 12종·384칸 / 320가지 방향·자세 / 정지·재출발·회전·소규모·탈것 부족·지역 변형·야영·누락 대체 / 실제 게임 4명 / 콘솔 오류 0');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
