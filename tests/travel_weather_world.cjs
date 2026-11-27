/* 실제 항해·탐험 장면에서 강수의 이동·일일 효과와 화면을 확인한다. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.env.OUT||process.env.TRAVEL_WEATHER_OUT||path.join(root,'artifacts/travel-weather-20261127'));
const cases=[['sea','rain',-35,20,7],['sea','snow',10,82,1],['land','rain',-8,40,7],['land','snow',10.70,47.85,1]];

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
  try{
    const p=await browser.newPage({viewport:{width:1280,height:720}}), errors=[];
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await p.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    await p.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
    await p.evaluate(async()=>{
      await G.Game.ensureGeo();await G.TerrainArt.ready;
      G.State.save=()=>false;G.State.saveAsync=async()=>({ok:false});
      G.U.chance=()=>false;G.UI.busy=()=>false;G.UI.toast=()=>{};
      G.UI.say=async()=>{};G.UI.ask=async()=>null;
      G.Disc.checkLand=()=>({hits:[]});G.Explore.sense=()=>[];
      window.weatherState=async function(scene,climate,x,y,month){
        const s=G.Game.state=G.State.newGame({name:'날씨 검사',nation:'PT',job:'explorer',age:22,birth:{m:1,d:1},
          st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
        s.date={y:1480,m:month,d:10};s.flags.prologue=true;s.settings.res=.65;s.settings.sound=0;s.settings.music=0;
        s.player.gold=100000;s.fleet.ships=[G.R.newShip('caravel')];s.fleet.crew=60;s.fleet.food=1200;s.fleet.water=1200;
        s.fleet.fatigue=25;s.fleet.discipline=80;s.known=G.CITY_DATA.filter(Boolean).map(c=>c.id);
        if(scene==='sea'){
          // 가까이에 곧게 열린 물이 있는 자리에서 같은 침로로 속도를 잰다.
          const candidates=[];
          for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++)candidates.push([x+i*.12,y+j*.12]);
          candidates.sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y));
          const q=candidates.find(([a,b])=>G.Hydro.clear([a,b],[a+.55,b]));
          if(!q)throw Error('열린 바닷길을 찾을 수 없습니다.');
          [x,y]=q;s.loc={mode:'sea',lon:x,lat:y,heading:0};
          await G.Game.go('sea',{fresh:true});
          s.rain={lv:climate?2:0,kind:climate,days:3,asked:true,order:'work'};
        }else{
          if(!G.Geo.isLand(x,y))throw Error('육상 좌표가 아닙니다.');
          await G.Game.go('land',{from:0});
          Object.assign(s.loc,{lon:x,lat:y,heading:0});
          s.landWeather={lv:climate?2:0,kind:climate,days:3};
        }
        const live=G.Scenes[scene], st=live.runtime();
        Object.assign(st.cam,{lon:x,lat:y,zoom:scene==='sea'?330:355,zoomT:0});
        Object.assign(st,{paused:true,busy:0,dayAcc:-1e6,t:20,rframe:2,npcs:[],tipScan:Infinity});
        if(scene==='sea'){st.wind={dir:0,spd:.55,calm:false};st.windVis={...st.wind};}
        else live.refreshHud();
        return {s,live,st,x,y};
      };
    });
    const results=[];
    for(const [scene,kind,lon,lat,month] of cases){
      const row=await p.evaluate(async({scene,kind,lon,lat,month})=>{
        const rn=G.Rain;
        async function measure(weather){
          const {s,live,st,x,y}=await weatherState(scene,weather,lon,lat,month);
          const before=[s.fleet.fatigue,s.fleet.discipline];
          await live.runDay();
          const daily={fatigue:s.fleet.fatigue-before[0],discipline:s.fleet.discipline-before[1]};
          s.fleet.fatigue=before[0];s.fleet.discipline=before[1];
          Object.assign(s.loc,{lon:x,lat:y,heading:0});
          Object.assign(st,{busy:0,paused:false,npcs:[],dayAcc:-1e6});
          if(scene==='sea'){st.wind={dir:0,spd:.55,calm:false};live.takeCourse(0);}
          else st.dir=[1,0];
          for(let i=0;i<14;i++){st.rframe=2;live.update(.024);}
          const cooking=scene==='sea'?Math.max(.4,1-G.R.skillRead('cook')*G.BALANCE.rain.cookCut):1;
          return {...daily,distance:G.Geo.dist(x,y,s.loc.lon,s.loc.lat),speed:scene==='sea'?rn.speedK():rn.landEffect().speed,cooking};
        }
        const clear=await measure(null), heavy=await measure(kind);
        const {s,live,st}=await weatherState(scene,kind,lon,lat,month);
        const expected=rn.name(null,scene==='land'?'land':null);
        if(scene==='sea'&&kind==='rain')st.storm=1;
        st.busy=1;
        const renderer=G.Game.renderer, drawLenses=renderer.weatherLenses;
        let optical=0, opticalLight=0, gpuError=0, snowOnGlass=0;
        renderer.weatherLenses=function(data,count){
          const gl=this.gl, canvas=this.canvas;
          if(kind==='snow')for(let i=0;i<count*8;i+=8)if(data[i+6]>=.20)snowOnGlass++;
          if(optical||count<20)return drawLenses.call(this,data,count);
          const x=Math.floor(canvas.width*.42), y=Math.floor(canvas.height*.55);
          const before=new Uint8Array(52*52*4), after=new Uint8Array(before.length);
          gl.readPixels(x-26,y-26,52,52,gl.RGBA,gl.UNSIGNED_BYTE,before);
          // 화면의 실제 배경을 읽고 다시 같은 자리에서 물방울 가장자리와 굴절을 확인한다.
          drawLenses.call(this,new Float32Array([672,405,35,29,.9,0,kind==='snow'?.22:.08,3]),1);
          gl.readPixels(x-26,y-26,52,52,gl.RGBA,gl.UNSIGNED_BYTE,after);
          optical=after.reduce((n,v,j)=>n+(Math.abs(v-before[j])>3?1:0),0);
          const light=pixels=>pixels.reduce((sum,value,i)=>i%4===3?sum:sum+value,0);
          opticalLight=light(after)/light(before);
          gpuError=gl.getError();
          st.rframe=2;
          return true;
        };
        try{
          for(let i=0;i<20;i++){
            st.rframe=2;live.update(.05);
            await new Promise(r=>setTimeout(r,85));
          }
        }finally{renderer.weatherLenses=drawLenses;}
        const selector=scene==='land'?'.landstatus, .status-strip':'.status-strip';
        const hud=[...document.querySelectorAll(selector)].map(e=>e.innerText).join(' ');
        const overlay=kind==='snow'?rn.snowVis():rn.vis();
        let orders=null;
        if(scene==='sea'&&kind==='snow'){
          const ask=G.UI.ask;G.UI.ask=async(title,options)=>{orders={title,values:options.map(o=>o.value)};return null;};
          await rn.ask(false);G.UI.ask=ask;
        }
        return {scene,kind,terrain:G.Geo.terrain(s.loc.lon,s.loc.lat),expected,clear,heavy,hud,overlay,orders,optical,opticalLight,gpuError,snowOnGlass};
      },{scene,kind,lon,lat,month});
      await p.screenshot({path:path.join(out,scene+'-'+kind+'.png')});
      row.glass=await p.evaluate(({scene,kind})=>{
        const rn=G.Rain, scope=scene==='land'?'land':null, k=G.Game.overlayScale;
        const layer=document.createElement('canvas');layer.width=1600*k;layer.height=900*k;
        const ctx=layer.getContext('2d',{willReadFrequently:true});
        const draws=[], meltDrops=[], counts=[], airCounts=[];
        const draw=ctx.drawImage.bind(ctx), ellipse=ctx.ellipse.bind(ctx), lineTo=ctx.lineTo.bind(ctx), now=performance.now.bind(performance);
        const random=Math.random, testRandom=G.U.makeRng(7649);
        let when=now(), beads=0, meltMax=0, meltMoves=0, fixedThenShrunk=0, trails=0, splashes=0, runoff=0, streaks=0, airborne=0;
        ctx.drawImage=(image,x,y,w,h)=>{
          draws.push([x+w/2,y+h/2,w,ctx.globalAlpha]);draw(image,x,y,w,h);
        };
        ctx.lineTo=(...p)=>{streaks++;lineTo(...p);};
        ctx.ellipse=(x,y,w,h,angle,start,end)=>{
          if(start===.30){
            if(kind==='snow')meltDrops.push([x,y,w,ctx.globalAlpha]);
            else {draws.push([x,y,w*2,ctx.globalAlpha]);if(h>w*1.6)runoff++;}
          }else if(kind==='snow'&&start===0)airborne++;
          ellipse(x,y,w,h,angle,start,end);
        };
        const weather=scene==='land'?G.Game.state.landWeather:G.Game.state.rain;
        const focus=[1050,515];
        let previous=[], lastMelt=[], sample, appearance;
        try{
          performance.now=()=>when;
          Math.random=testRandom;
          rn.leave();
          const frames=kind==='snow'?64:150, interval=kind==='snow'?.062:.026;
          for(let i=0;i<frames;i++){
            when+=interval*1000;draws.length=0;meltDrops.length=0;streaks=0;airborne=0;ctx.clearRect(0,0,layer.width,layer.height);
            rn.draw(ctx,i*interval,0,false,()=>false,scope,focus);
            if(kind==='snow'){
              beads+=meltDrops.filter(d=>d[3]>.12).length;
              for(const d of meltDrops)if(d[3]>.35&&d[0]>0&&d[0]<1600&&d[1]>0&&d[1]<900){
                meltMax=Math.max(meltMax,d[2]);
                if(lastMelt.some(b=>Math.abs(b[2]-d[2])<3&&Math.abs(b[0]-d[0])<12&&d[1]-b[1]>2&&d[1]-b[1]<28))meltMoves++;
              }
              lastMelt=meltDrops.slice();
              for(const d of draws)if(d[2]>28&&d[3]>.15&&previous.some(p=>Math.abs(p[0]-d[0])<1e-6&&Math.abs(p[1]-d[1])<1e-6&&p[2]>d[2]+.5&&p[3]>d[3]))fixedThenShrunk++;
            }else{
              for(const d of draws){
                if(d[2]<7&&d[3]>.12&&previous.some(p=>Math.abs(p[2]-d[2])<.45&&p[3]>d[3]&&Math.abs(d[0]-p[0])>1&&Math.abs(d[0]-p[0])<9&&Math.abs(d[1]-p[1])<10))splashes++;
                if(d[2]<16||d[3]<.12)continue;
                const prior=previous.find(p=>p[2]>=15&&Math.abs(d[0]-p[0])<7&&d[1]-p[1]>2&&d[1]-p[1]<15);
                if(prior)trails++;
              }
            }
            if(i>frames/2)airCounts.push(kind==='snow'?airborne:streaks);
            previous=draws.slice();
            counts.push(draws.filter(d=>d[3]>.1).length);
          }
          const data=ctx.getImageData(0,0,layer.width,layer.height).data;
          let covered=0, dim=0, all=0, clear=0;
          for(let y=0;y<layer.height;y++)for(let x=0;x<layer.width;x++){
            const a=data[(y*layer.width+x)*4+3];
            if(a>6)covered++;
            if(a>=48)dim++;
            if(Math.hypot((x/k-focus[0])/100,(y/k-focus[1])/65)<1){all++;if(a>=48)clear++;}
          }
          sample={covered:covered/(data.length/4),dim:dim/(data.length/4),focus:clear/all};
          appearance=rn.weather({cloud:.8,storm:.85},scope);
          weather.lv=1;
          for(let i=0;i<24;i++){
            when+=125;draws.length=0;meltDrops.length=0;streaks=0;airborne=0;rn.draw(ctx,0,0,false,()=>false,scope,focus);
          }
          return {sample,appearance,beads,meltMax,meltMoves,fixedThenShrunk,trails,splashes,runoff,peakGlass:Math.max(...counts),lightGlass:draws.length+meltDrops.length,
            rainWaterLimit:G.FX.weatherGlass.rain.size[1]*1.32*.94,
            lightAir:kind==='snow'?airborne:streaks,heavyAir:Math.max(...airCounts),gustSpread:Math.max(...airCounts)-Math.min(...airCounts)};
        }finally{weather.lv=2;performance.now=now;Math.random=random;}
      },{scene,kind});
      console.log(JSON.stringify(row));results.push(row);
      if(scene==='land'&&kind==='rain'){
        await p.evaluate(()=>{
          const scene=G.Scenes.land, st=scene.runtime(), now=performance.now.bind(performance);
          G.Game.state.landWeather.lv=1;G.Rain.leave();scene.refreshHud();
          let t=now();performance.now=()=>t;
          try{for(let i=0;i<30;i++){t+=90;st.rframe=2;scene.update(.05);}}
          finally{performance.now=now;}
        });
        await p.screenshot({path:path.join(out,'land-light-rain.png')});
      }
    }
    const lifecycle=await p.evaluate(async()=>{
      const rn=G.Rain, force=G.U.chance, chance=rn.chance;
      G.U.chance=()=>true;rn.chance=()=>1;
      const checks=[];
      for(const [scene,x,y,m,expected] of [['sea',-35,20,7,'폭우'],['sea',10,82,1,'폭설'],['sea',160,-67.6,7,'폭설'],
        ['land',-8,40,7,'폭우'],['land',-42,73,1,'폭설'],['land',30,-78,2,'폭설']]){
        const {s}=await weatherState(scene,null,x,y,m), isLand=scene==='land', scope=isLand?'land':null;
        const event=()=>isLand?rn.landDay([],G.Geo.terrain(x,y),false):rn.daily([],{});
        event();const name=rn.name(null,scope);
        const r=isLand?s.landWeather:s.rain;
        r.days=1;event();const cleared=!rn.active(scope);
        event();s.day+=4;rn.resume(scope);
        checks.push({scene,name,expected,cleared,expired:!rn.active(scope)});
      }
      G.U.chance=force;rn.chance=chance;
      const {s}=await weatherState('land','snow',-42,73,1);
      const fat=s.fleet.fatigue,disc=s.fleet.discipline;
      rn.landDay([],'ice',true);
      return {checks,shelterFatigue:s.fleet.fatigue-fat,shelterDiscipline:s.fleet.discipline-disc};
    });
    const meta=await p.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'}));
    if(process.env.EXPECT_VERSION)assert.equal(meta.version,process.env.EXPECT_VERSION);
    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({...meta,results,lifecycle,errors},null,2));
    const expected=[[.8,-.4,.92],[3.2,-.8,.76],[1.6,-.5,.8],[2.5,-.75,.65]];
    results.forEach((r,i)=>{
      const [fat,disc,speed]=expected[i];
      assert(Math.abs(r.heavy.fatigue-r.clear.fatigue-fat*r.heavy.cooking)<1e-6,r.scene+' '+r.kind+' 피로');
      assert(Math.abs(r.heavy.discipline-r.clear.discipline-disc)<1e-6,r.scene+' '+r.kind+' 규율');
      assert.equal(r.heavy.speed,speed);
      assert(r.heavy.distance>0&&r.heavy.distance<r.clear.distance,r.scene+' '+r.kind+' 실제 이동');
      assert(r.hud.includes(r.expected)&&r.overlay>.55,r.scene+' '+r.kind+' 화면');
      const glass=r.glass;
      assert(glass.sample.focus<.10&&glass.sample.dim>.001,r.scene+' '+r.kind+' 조종 시야');
      assert(glass.appearance.cloudOpacity<.16&&glass.appearance.storm<.35,r.scene+' '+r.kind+' 구름·명암');
      assert(glass.peakGlass>12&&glass.lightGlass===0,r.scene+' '+r.kind+' 앞유리 강수');
      assert(r.optical>80&&r.opticalLight>.70&&r.opticalLight<2.1&&r.gpuError===0,r.scene+' '+r.kind+' 실제 배경 왜곡');
      assert(glass.lightAir>70&&glass.heavyAir>glass.lightAir*3&&glass.gustSpread>40,r.scene+' '+r.kind+' 강수 강도');
      if(r.kind==='rain'){
        assert(glass.sample.covered<.23&&glass.trails>0&&glass.splashes>0&&glass.runoff>0,r.scene+' 앞유리 폭우');
      }else{
        assert(glass.sample.covered>.60&&glass.sample.dim<.32&&r.snowOnGlass>0,r.scene+' 옅은 눈안개와 붙은 눈');
        assert(glass.beads>0&&glass.fixedThenShrunk>0&&glass.meltMoves>0&&glass.meltMax>glass.rainWaterLimit,r.scene+' 큰 녹은 물방울');
      }
    });
    assert.deepEqual(results[1].orders.values,['work','rest',null]);
    assert(lifecycle.checks.every(c=>c.name===c.expected&&c.cleared&&c.expired));
    assert(Math.abs(lifecycle.shelterFatigue-.875)<1e-6&&Math.abs(lifecycle.shelterDiscipline+.2625)<1e-6);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
