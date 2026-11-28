/* 실제 지도 자료·탐험 조작으로 지형 재해의 피해 범위, 발생과 소멸을 검사한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.OUT || process.env.GROUND_DISASTER_OUT || path.join(root, 'artifacts/field-disasters-20261127'));

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' || m.text().includes('GL_INVALID')) errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();await G.TerrainArt.ready;
      G.State.save = () => false;G.State.saveAsync = async () => ({ ok: false });
      G.UI.busy = () => false;G.UI.say = async () => {};G.UI.ask = async () => null;
      G.UI.toast = message => window.fieldNotes.push(message);
      G.Disc.checkLand = () => ({ hits: [] });G.Explore.sense = () => [];
      G.U.chance = () => false;
      window.fieldNotes = [];
      const s = G.Game.state = G.State.newGame({
        name: '지형 재해 검사', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal'
      });
      s.date = { y: 1480, m: 7, d: 10 };s.flags.prologue = true;
      Object.assign(s.settings,{res:.68,sound:0,music:0,landSpeed:1,shake:true});
      Object.assign(s.fleet,{ships:[G.R.newShip('caravel')],crew:60,food:1200,water:1200});
      s.player.gold = 100000;
      await G.Game.go('land',{from:0});
      const scene=G.Scenes.land, st=scene.runtime(), l=s.loc;
      window.fieldGame={s,l,scene,st};
      window.fieldFrames=(n,dt=.042)=>{
        for(let i=0;i<n;i++){st.rframe=st.paused?1:2;scene.update(dt);}
      };
      window.placeField=(pos,cam=pos,zoom=355)=>{
        Object.assign(l,{lon:pos[0],lat:pos[1],heading:0});
        Object.assign(st.cam,{lon:cam[0],lat:cam[1],zoom,zoomT:0});
        Object.assign(st,{paused:true,busy:0,dir:null,path:null,dayAcc:-1e6,t:12,rframe:1});
        scene.refreshHud();
      };
      window.resetField=()=>{
        s.dis=null;s.landWeather=null;s.fleet.fatigue=20;s.fleet.discipline=80;
        G.BALANCE.disaster.random=0;G.Quake.clear();G.Rain.leave();window.fieldNotes.length=0;
      };
      window.startField=(kind,x,y,name)=>{
        const ev=G.Disaster.start({kind,lon:x,lat:y,name,r:kind==='quake'?1.15:undefined,sev:2,localField:true},true);
        if(!ev||!ev.field)throw Error(kind+' 지형에서 재해를 시작할 수 없음 '+x+', '+y);
        return ev;
      };
    });
    const observed = {};

    const quake = await page.evaluate(() => {
      resetField();placeField([-100.94,36.4]);
      const e=startField('quake',-100.54,36.63), f=e.field;
      const mid=G.GroundDisaster.pointAt(f.lines[0],f.lines[0].length*.53);
      placeField(mid,[-100.64,36.49]);
      let now=10;G.Quake._clock(()=>now);
      fieldFrames(4);
      const shakeStarted=G.Quake.active('quake');
      now+=2.3;fieldFrames(30);
      const shake=G.Quake.camera();
      const stopped=fieldGame.s.fleet.fatigue-20;
      const {s,l}=fieldGame;
      s.fleet.fatigue=20;s.fleet.discipline=80;f.hit=false;f.wait=0;f.age=f.warning-.03;
      const crossing=G.Disaster.travelStep(.15,l.lon-.031,l.lat,true);
      const moving=s.fleet.fatigue-20;
      f.age=f.warning+1.0;
      placeField([-100.96,36.32],[-100.68,36.42]);
      fieldFrames(12,0);
      window.quakeFixture=e;
      return {shakeStarted,shake,stopped,moving,crossing};
    });
    assert(quake.shakeStarted && quake.shake.some(n=>Math.abs(n)>.05));
    assert(quake.crossing && quake.stopped > 0 && Math.abs(quake.moving - 2*quake.stopped)<1e-8);
    await page.waitForFunction(()=>{fieldFrames(1,0);return fieldGame.st.unitItems?.length > 0;},null,{polling:100,timeout:15000});
    await page.screenshot({ path: path.join(out,'quake.png') });
    observed.quakeDust=await page.evaluate(()=>{
      const fx=G.GroundDisasterFx, q=G.Quake, ctx=G.Game.canvases().overlay.getContext('2d');
      const ellipse=ctx.ellipse, arc=ctx.arc, dust=fx.drawDust, field=fx.draw, ground=q.drawLand;
      const settings=fieldGame.s.settings;
      let earthquake=false,circles=0,wisps=0;
      const inspect=draw=>function(...args){
        earthquake=true;
        try{return draw.apply(this,args);}finally{earthquake=false;}
      };
      const circle=draw=>function(...args){
        if(earthquake)circles++;
        return draw.apply(this,args);
      };
      fx.draw=inspect(field);q.drawLand=inspect(ground);
      ctx.ellipse=circle(ellipse);ctx.arc=circle(arc);
      fx.drawDust=function(...args){
        if(args[3]>0&&args[3]<1&&args[7]>0)wisps++;
        return dust.apply(this,args);
      };
      try{
        fieldFrames(1,0);
        const withShake=wisps;
        settings.shake=false;
        fieldFrames(1,0);
        return {circles,withShake,withoutShake:wisps-withShake};
      }finally{
        settings.shake=true;ctx.ellipse=ellipse;ctx.arc=arc;
        fx.drawDust=dust;fx.draw=field;q.drawLand=ground;
      }
    });
    assert(observed.quakeDust.circles===0 && observed.quakeDust.withShake>0 && observed.quakeDust.withoutShake>0);
    observed.quake={...quake,...await page.evaluate(()=>{
      const e=window.quakeFixture,{s,l}=fieldGame;
      G.Quake.clear();G.Quake._clock(null);s.fleet.fatigue=20;e.field.hit=false;e.field.wait=0;
      const avoided=!G.Disaster.travelStep(.2,l.lon-.15,l.lat,false)&&s.fleet.fatigue===20;
      e.field.age=e.field.life+.1;
      return {avoided,expired:!G.GroundDisaster.open(e)};
    })};
    assert(observed.quake.avoided && observed.quake.expired);

    const slide=await page.evaluate(()=>{
      resetField();placeField([10.5,46.88]);
      const lower=G.Disaster.start({kind:'landslide',lon:-101,lat:36.4,localField:true},true);
      let e;
      for(let j=0;j<19&&!e;j++)for(let i=0;i<19&&!e;i++){
        const x=10.5+(i-9)*.063,y=46.88+(j-9)*.053;
        if(G.Geo.terrain(x,y)!=='mountain')continue;
        const candidate=G.Disaster.start({kind:'landslide',lon:x,lat:y,sev:2,localField:true},true);
        if(candidate?.field.line.length>.33)e=candidate;
        else if(candidate)G.Game.state.dis.act.pop();
      }
      if(!e)throw Error('알프스 낙석 지점 없음');
      const f=e.field, item=f.rocks[0], gd=G.GroundDisaster;
      const age=f.warning+item.delay, a=gd.rockAt(e,item,age+.13), b=gd.rockAt(e,item,age+.45);
      const {s,l}=fieldGame;f.age=age+.45;
      placeField([b.x,b.y]);
      const hit=G.Disaster.travelStep(.021,l.lon,l.lat,false);
      const damage=s.fleet.fatigue-20;
      const start=[e.lon,e.lat], end=f.line.points.at(-1);
      placeField([e.lon-.35,e.lat-.18],[(start[0]+end[0])/2-.12,(start[1]+end[1])/2-.02],395);
      f.age=f.warning+1.36;fieldFrames(8,0);
      return {flatRejected:!lower,terrain:G.Geo.terrain(e.lon,e.lat),hit,damage,
        distance:G.Geo.dist(a.x,a.y,b.x,b.y),drop:G.Terrain.sample(...start).elevation-G.Terrain.sample(...end).elevation};
    });
    assert(slide.flatRejected && slide.terrain==='mountain' && slide.hit && slide.damage>0 && slide.distance>.03 && slide.drop>0);
    observed.landslide=slide;await page.screenshot({path:path.join(out,'landslide.png')});

    const flood=await page.evaluate(()=>{
      resetField();
      const gd=G.GroundDisaster, rivers=G.Hydro.routes().filter(r=>/라인|다뉴브|센강|나일|니제르|황하/.test(r.name));
      let bank, bankDist, heading, reach;
      for(const river of rivers){
        const nodes=river.pts.slice(Math.floor(river.pts.length*.22)).slice(0,130);
        for(const p of nodes){
          reach=G.Hydro.floodReach(p[0],p[1],.67);if(!reach||reach.points.length<7)continue;
          for(let j=0;j<12&&!bank;j++){
            const a=j*Math.PI/6, pos=[p[0]+Math.cos(a)*.162,p[1]+Math.sin(a)*.162];
            const q=G.Hydro.at(pos[0],pos[1]);
            if(q&&q.route===river&&q.signed>.018&&G.Geo.isLand(...pos)){bank=pos;heading=a;bankDist=q.signed;}
          }
          if(bank)break;
        }
        if(bank)break;
      }
      if(!bank)throw Error('검사 강의 걸을 수 있는 강둑 없음');
      placeField(bank);
      const {s,l}=fieldGame;
      G.BALANCE.disaster.random=1;
      s.landWeather={lv:1,kind:'rain',days:4};
      G.Disaster.travelStep(1,l.lon,l.lat,false);
      const light=G.Disaster.active().filter(e=>e.kind==='flood').length;
      s.landWeather={lv:2,kind:'snow',days:4};
      G.Disaster.travelStep(1,l.lon,l.lat,false);
      const snow=G.Disaster.active().filter(e=>e.kind==='flood').length;
      s.landWeather={lv:2,kind:'rain',days:4};
      for(let i=0;i<8;i++)G.Disaster.travelStep(.14,l.lon,l.lat,false);
      const e=G.Disaster.active().find(e=>e.kind==='flood');
      if(!e)throw Error('폭우 뒤 범람 미발생');
      e.field.age=e.field.warning+1.75;
      const onBank=G.Disaster.travelStep(.05,l.lon,l.lat,false), damage=s.fleet.fatigue-20;
      e.field.wait=0;s.fleet.fatigue=20;
      const retreat=[bank[0]+Math.cos(heading)*.40,bank[1]+Math.sin(heading)*.40];
      placeField(retreat,bank,410);
      const safe=!G.Disaster.travelStep(.14,l.lon,l.lat,false)&&s.fleet.fatigue===20;
      fieldFrames(16,.016);
      return {light,snow,onBank,damage,safe,bankDist,river:e.field.river,points:e.field.line.points.length,fill:gd.roughness(e,'flood')};
    });
    assert(flood.light===0 && flood.snow===0 && flood.onBank && flood.damage>0 && flood.safe && flood.points>6 && flood.fill>.5);
    observed.flood=flood;await page.screenshot({path:path.join(out,'flood.png')});

    const fire=await page.evaluate(()=>{
      resetField();placeField([10.7,47.85]);
      const e=startField('fire',10.7,47.85),f=e.field,{s,l}=fieldGame;
      f.age=f.warning+.99;
      const hit=G.Disaster.travelStep(.044,l.lon,l.lat,false), cells=f.cells.length;
      placeField([10.99,47.62],[10.79,47.74],420);
      f.age=f.warning+2.46;fieldFrames(8,0);
      window.fireFixture=e;
      return {hit,cells,damage:s.fleet.fatigue-20};
    });
    assert(fire.hit && fire.cells>2 && fire.damage>0);
    await page.screenshot({path:path.join(out,'fire.png')});
    const recovery=await page.evaluate(()=>{
      const e=fireFixture,f=e.field, {s,l}=fieldGame, gd=G.GroundDisaster;
      f.age=f.warning+G.BALANCE.disaster.ground.fire.burnDays+Math.max(...f.cells.map(cell=>cell.delay))+.11;
      f.wait=0;s.fleet.fatigue=20;
      placeField([e.lon,e.lat],[e.lon+.08,e.lat-.16],420);
      const noDamage=!G.Disaster.travelStep(.08,l.lon,l.lat,false)&&s.fleet.fatigue===20;
      fieldFrames(8,0);
      return {noDamage,smoke:gd.open(e)&&gd.label(e).includes('잦아드는')};
    });
    assert(recovery.noDamage && recovery.smoke);
    observed.fire={...fire,...recovery};await page.screenshot({path:path.join(out,'fire-recovery.png')});

    observed.volcanoSites=await page.evaluate(()=>{
      resetField();
      const sites=G.VOLCANOES;
      const failures=sites.flatMap(v=>{
        const f=G.GroundDisaster.ensure({kind:'volcano',id:v.id,volcanoId:v.id,lon:v.lon,lat:v.lat});
        const land=G.Geo.isLand(v.lon,v.lat)&&!G.Terrain.isLake(v.lon,v.lat);
        return land&&f?.line.length>0&&f.line.points.every(p=>G.Geo.isLand(...p)&&!G.Terrain.isLake(...p))
          ? [] : [{name:v.name,land,length:f?.line.length}];
      });
      const history=G.DISASTERS.filter(h=>h.kind==='volcano');
      const missingHistory=history.filter(h=>!G.volcanoSite(null,h.lon,h.lat)).map(h=>h.name);
      const rejected=!G.Disaster.start({kind:'volcano',lon:-100,lat:36,localField:true},true);
      const v=G.volcanoSite(341090);
      if(!v)throw Error('포포카테페틀 화산이 빠짐');
      placeField([v.lon+.26,v.lat-.23],[v.lon+.12,v.lat-.07],440);
      fieldFrames(8,0);
      return {count:sites.length,unique:new Set(sites.map(v=>v.id)).size,failures,missingHistory,rejected};
    });
    assert.equal(observed.volcanoSites.count,100);
    assert.equal(observed.volcanoSites.unique,100);
    assert.deepEqual(observed.volcanoSites.failures,[]);
    assert.deepEqual(observed.volcanoSites.missingHistory,[]);
    assert(observed.volcanoSites.rejected);
    await page.screenshot({path:path.join(out,'volcano-dormant.png')});

    const volcano=await page.evaluate(()=>{
      const e=G.Disaster.start({kind:'volcano',volcanoId:341090,sev:3,localField:true},true);
      if(!e?.field)throw Error('용암이 흐를 화산을 찾지 못함');
      const gd=G.GroundDisaster,f=e.field,{s,l}=fieldGame;
      const a=gd.lavaDistance(e,f.warning+.55),b=gd.lavaDistance(e,f.warning+1.05);
      f.age=f.warning+1.8;
      const earlier=gd.pointAt(f.line,.10), ahead=gd.pointAt(f.line,f.line.length);
      placeField(ahead);
      const away=gd.lavaDistance(e,f.age)<f.line.length-.03&&!G.Disaster.travelStep(.014,l.lon,l.lat,false);
      placeField(earlier);
      const hit=G.Disaster.travelStep(.021,l.lon,l.lat,false), damage=s.fleet.fatigue-20;
      placeField([e.lon+.26,e.lat-.23],[e.lon+.12,e.lat-.07],440);
      f.age=f.warning+2.15;fieldFrames(8,0);
      window.volcanoFixture=e;
      const drawnSparks=[], canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
      let round=0, ash=0;
      ctx.arc=ctx.ellipse=ctx.createRadialGradient=()=>{round++;};
      const stroke=ctx.stroke, draw=ctx.drawImage;
      ctx.stroke=function(...args){if(this.strokeStyle==='#ff912b')drawnSparks.push(this.lineWidth);return stroke.apply(this,args);};
      ctx.drawImage=function(...args){if(args[0]?.width===108&&args[0]?.height===60)ash++;return draw.apply(this,args);};
      G.GroundDisasterFx.draw(ctx,e,(x,y)=>[800+(x-e.lon)*440,450-(y-e.lat)*440],440,14,'sans-serif');
      canvas.width=1600;canvas.height=900;ctx.clearRect(0,0,1600,900);
      const fx=G.GroundDisasterFx, age=f.age;
      const ashCoverage=at=>{
        f.age=at;ctx.clearRect(0,0,1600,900);
        fx.drawAshFront(ctx,e,[745,400],1,.48);
        return [80,420,830].flatMap(y=>[90,800,1510].map(x=>ctx.getImageData(x,y,1,1).data[3]));
      };
      const clearBefore=ashCoverage(f.warning), screenAsh=ashCoverage(f.warning+5.1), clearAfter=ashCoverage(f.life);
      f.age=age;
      const origin=f.line.points[0];
      return {name:e.name,constantSpeed:(b-a)/.5,expected:G.BALANCE.disaster.ground.volcano.speed,
        hit,away,damage,path:f.line.length,drop:G.Terrain.sample(e.lon,e.lat).elevation-G.Terrain.sample(...ahead).elevation,
        atVent:origin[0]===e.lon&&origin[1]===e.lat,round,ash,projectiles:drawnSparks.length,
        clearBefore,screenAsh,clearAfter};
    });
    assert(volcano.hit && volcano.away && volcano.damage>0 && volcano.drop>0 && Math.abs(volcano.constantSpeed-volcano.expected)<1e-9);
    assert(volcano.atVent && volcano.round===0 && volcano.ash>0 && volcano.projectiles>12);
    assert(volcano.clearBefore.every(a=>a===0) && volcano.screenAsh.every(a=>a>=80) && volcano.clearAfter.every(a=>a===0),JSON.stringify(volcano.screenAsh));
    observed.volcano=volcano;await page.screenshot({path:path.join(out,'volcano.png')});
    await page.evaluate(()=>{const f=window.volcanoFixture.field;f.age=f.warning+5.1;fieldFrames(2,0);});
    await page.screenshot({path:path.join(out,'volcano-ash.png')});

    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),observed,errors},null,2));
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),observed,errors}));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
