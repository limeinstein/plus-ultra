/* 해적섬·개척 도시 표식과 해안 배치를 실제 게임에서 확인한다. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..');
const out=process.env.OUT||path.join(root,'artifacts/shuangyu-dock-20261127');
fs.mkdirSync(out,{recursive:true});

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
  try{
    const p=await browser.newPage({viewport:{width:1280,height:720}});
    const errors=[];
    p.setDefaultTimeout(180000);
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await p.addInitScript(()=>requestAnimationFrame=()=>0);
    await p.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded'});
    await p.evaluate(()=>document.fonts.ready);
    const release=await p.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'}));
    if(process.env.EXPECT_VERSION)assert.equal(release.version,process.env.EXPECT_VERSION);
    const audit=await p.evaluate(async()=>{
      await G.Game.ensureGeo();
      const sk=Object.fromEntries(G.SKILLS.map(d=>[d.id,1]));
      const s=G.Game.state=G.State.newGame({name:'도시 표식 검사',nation:'PT',job:'explorer',age:24,
        birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
      s.flags.prologue=true;s.settings.res=.66;s.settings.sound=0;s.settings.music=0;
      s.date={y:1480,m:5,d:15};s.fleet.ships=[G.R.newShip('caravel')];
      s.fleet.crew=60;s.fleet.food=2000;s.fleet.water=2000;
      G.State.save=()=>{};G.Rain.weather=()=>({cloud:0,storm:0});G.UI.toast=()=>{};
      await G.TerrainArt.ready;
      const ci=G.CityIcon, islands=G.Lair.list(), sites=G.Colony.sites();
      G.Lair.apply();
      const hidden=islands.every(d=>!G.CITY_DATA[d.id]);
      const ls=G.Lair.st();
      islands.forEach((d,i)=>{ls.rev[d.zone]=0;if(i%2===0)ls.held[d.zone]=0;});
      G.Lair.apply();
      s.colony={list:sites.map((site,i)=>({id:1000+i,key:site.key,nat:site.nat,stage:i%5,built:[]})),call:null};
      G.Colony.apply();
      const samples=[...islands.map(d=>G.CITY_DATA[d.id]),...s.colony.list.map(d=>G.CITY_DATA[d.id])];
      s.known=samples.map(c=>c.id);
      const standard=G.CITY_DATA.filter(c=>c&&!c.lair&&c.colony==null);
      const problems=[], places=[];
      const tierLabels=['','소도시','중도시','대도시'];
      const allStages=[];
      const entry=s.colony.list[0];
      for(let stage=0;stage<=4;stage++){
        entry.stage=stage;
        const c=G.Colony.sync(entry);
        const model=ci.plan(c);
        if(model.prop!=='supply-wagon')problems.push([c.name,'개척 단계',stage]);
        const tier=[1,1,1,2,3][stage];
        if(model.n!==tier||ci.label(c)!==tierLabels[tier]||model.parts.some(p=>p.role==='govhall')!==(stage===4)||
            model.parts.some(p=>p.role==='inspector')!==(stage>=3))
          problems.push([c.name,'개척 규모·시설',stage,model.n,model.parts.map(p=>p.role)]);
        allStages.push({stage,citySize:c.size,tier:model.n,choice:model.prop});
      }
      const reset=s.colony.list[0];reset.stage=0;G.Colony.sync(reset);
      const lairCity=G.CITY_DATA[islands[1].id];
      const lairStages=[];
      for(let tier=1;tier<=3;tier++){
        if(tier>1)G.Lair.afterBattle({kind:'pirate',lairChief:lairCity.lair,chiefNo:tier-2},'win');
        const model=ci.plan(lairCity);
        const width=ci.view(lairCity,{zoom:410}).width;
        if(model.n!==tier||ci.label(lairCity)!==tierLabels[tier]||model.parts.some(p=>p.role==='lairhq')!==(tier===3)||
            model.parts.some(p=>p.role==='lairwatch')!==(tier===2)||
            (tier>1&&width<=lairStages[tier-2].width))
          problems.push([lairCity.name,'해적섬 규모·시설',tier,model.n,model.parts.map(p=>p.role)]);
        lairStages.push({tier:model.n,width});
      }
      for(const c of standard){if(ci.plan(c).prop)problems.push([c.name,'일반 도시의 잘못된 표식']);}
      await Promise.all(Object.keys(G.CITY_PROPS).map(id=>G.Img.load('map-settlements/'+id)));
      const limits=G.FX.ship.zoom;
      const caveZooms=[limits.min,limits.reference,limits.start,limits.reference*limits.shipPreset,G.FX.party.zoom.max,limits.max];
      function auditPlacement(c){
        const model=ci.plan(c), kind=c.lair?'skull-cave':'supply-wagon';
        const shuangyu=c.lair==='east';
        if(model.prop!==kind)problems.push([c.name,'종류',model.prop]);
        if(model.hideBuildings!==shuangyu||shuangyu&&(!c.port||!G.R.facilities(c).harbor||!model.harbor||model.parts.length))
          problems.push([c.name,'동굴과 부두만 있는 도시 구성']);
        const main=shuangyu?null:model.n===3?(c.lair?'lairhq':'govhall'):c.lair&&model.n===2?'lairwatch':null;
        const chart=ci.site(c,model,ci.view(c,{scale:.8}),true);
        if(chart.prop?.id!==kind)problems.push([c.name,'해도 누락']);
        if(shuangyu&&(chart.buildings.length||!chart.dock||chart.dock.w>=chart.prop?.w))
          problems.push([c.name,'해도의 동굴과 작은 부두']);
        if(main&&!chart.buildings.some(item=>item.p.role===main))problems.push([c.name,'해도 대표 건물 누락',main]);
        for(const camera of shuangyu?caveZooms:[95,160,410]){
          const view=ci.view(c,{zoom:camera}), placed=ci.site(c,model,view,true), {prop,dock}=placed;
          if(!prop){problems.push([c.name,camera,'모형 누락',placed.dry,placed.center,placed.buildings.length,c.dock,view.zoom]);continue;}
          if(shuangyu&&(placed.buildings.length||!dock))problems.push([c.name,camera,'동굴과 부두 배치']);
          const building=placed.buildings.find(item=>item.p.role===main);
          if(main&&!building)problems.push([c.name,camera,'대표 건물 누락',main]);
          const [rx,ry]=prop.foot, originY=c.lat+G.Terrain.lift(c.lon,c.lat);
          const ground=(x,y)=>G.Terrain.unproject(G.Geo.wrapLon(c.lon+x/view.zoom),originY-y/view.zoom);
          if(shuangyu&&dock&&(G.Geo.sdf(...ground(...dock.land))<=0||G.Geo.sdf(...ground(...dock.water))>=0||
              G.Geo.sdf(...ground(...dock.ship))>=0))problems.push([c.name,camera,'부두의 육지 입구와 물 위 선착장']);
          const quayLandGap=dock&&Math.hypot(dock.land[0]-prop.x,dock.land[1]-prop.y);
          if(shuangyu&&dock&&quayLandGap<rx+dock.w*.16)problems.push([c.name,camera,'동굴과 부두 입구가 겹침']);
          if(building){
            const point=ground(building.x,building.y);
            if(G.Geo.sdf(...point)<=0||G.Terrain.isLake(...point))problems.push([c.name,camera,'대표 건물 발치가 물에 닿음',main]);
          }
          let wet=0;
          for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++){
            if(i*i+j*j>16)continue;
            const x=prop.x+rx*i/4,y=prop.y+ry*j/4;
            const q=ground(x,y);
            if(G.Geo.sdf(...q)<=0||G.Terrain.isLake(...q))wet++;
          }
          if(wet)problems.push([c.name,camera,'발치가 물에 닿음',wet]);
          places.push({id:c.id,name:c.name,kind,tier:model.n,camera,spritePx:prop.w,main,mainWidth:building?.w,
            buildings:placed.buildings.length,hasHarbor:!!dock,quayWidth:dock?.w,quayLandGap});
        }
      }
      samples.forEach(auditPlacement);
      islands.forEach(d=>{delete ls.held[d.zone];ls.beat[d.zone]=0;auditPlacement(G.CITY_DATA[d.id]);});
      islands.forEach(d=>{delete ls.held[d.zone];ls.beat[d.zone]=1;auditPlacement(G.CITY_DATA[d.id]);});
      islands.forEach(d=>{ls.held[d.zone]=0;});
      s.colony.list.forEach(e=>{e.stage=4;G.Colony.sync(e);});
      samples.forEach(auditPlacement);
      return {islands:islands.length,colonies:sites.length,standard:standard.length,hidden,allStages,lairStages,places,problems};
    });
    fs.writeFileSync(path.join(out,'ground-audit.json'),JSON.stringify(audit,null,2));
    console.log(JSON.stringify({...audit,places:audit.places.length}));
    assert(audit.hidden);
    assert.deepEqual(audit.problems,[]);
    const scenes=[['sea',1200,115,'pirate-base'],['sea',1200,480,'pirate-close'],
      ['sea',1000,115,'colony-base'],['land',1001,480,'colony-close'],
      ['sea',1206,110,'shuangyu-sea'],['land',1206,480,'shuangyu-land'],['land',1206,80,'shuangyu-land-far']];
    const captures=[];
    for(const [scene,id,zoom,filename] of scenes){
      const shot=await p.evaluate(async({scene,id,zoom})=>{
        const s=G.Game.state,c=G.CITY_DATA[id],ci=G.CityIcon;
        const plan=ci.plan(c), keys=['map-cities/'+plan.culture,'map-cities/quays',...plan.parts.map(x=>x.art.key)];
        await Promise.all(keys.map(k=>G.Img.load(k)));
        if(G.Game.sceneName!==scene){
          if(scene==='land')G.Game.go('land',{from:c.id});
          else {s.loc={mode:'sea',lon:c.dock[1],lat:c.dock[0],heading:0};G.Game.go('sea',{fresh:true});}
        }
        const st=G.Scenes[scene].runtime();
        const view=ci.view(c,{zoom});ci.site(c,plan,view,true);
        const gap=155/zoom;
        const actor=scene==='sea'?G.Nav.nearestSea(c.dock[1]-gap,c.dock[0]-gap*.61,16):[c.lon-gap,c.lat-gap*.28];
        s.loc.lon=actor?actor[0]:c.dock[1];s.loc.lat=actor?actor[1]:c.dock[0];
        st.cam.lon=c.lon;st.cam.lat=c.lat;st.cam.zoom=zoom;st.cam.zoomT=0;
        st.t=24;st.busy=1;st.paused=true;st.dayAcc=-1e6;
        if(scene==='sea'){st.npcs=[];st.target={city:c,lon:c.lon,lat:c.lat};}
        G.Game.renderer.invalidate();
        for(let i=0;i<12;i++){st.rframe=2;G.Game.scene.update(.016);}
        const mark=st.cityMarks[c.id], box=mark?.prop?.box, quayBox=mark?.boxes?.at(-1);
        const hit=rect=>!!rect&&ci.hit(mark,(rect[0]+rect[2])/2,(rect[1]+rect[3])/2);
        return {name:c.name,scene,kind:mark?.prop?.id,box,boxCount:mark?.boxes?.length,
          hit:hit(box),quayHit:quayBox!==box&&hit(quayBox)};
      },{scene,id,zoom});
      assert(shot.hit,filename);
      if(id===1206){assert.equal(shot.kind,'skull-cave',filename);assert.equal(shot.boxCount,2,filename);assert(shot.quayHit,filename);}
      captures.push(shot);
      await p.screenshot({path:path.join(out,filename+'.png')});
    }
    const chart=await p.evaluate(()=>{
      const c=G.CITY_DATA[1206], parent=document.createElement('div');
      parent.style.cssText='position:fixed;inset:20px;background:#e2cda0;z-index:20000';
      document.body.append(parent);
      const ci=G.CityIcon,draw=ci.draw;
      let mark;
      ci.draw=function(ctx,city,...args){const m=draw.call(this,ctx,city,...args);if(city===c)mark=m;return m;};
      try{G.ChartView.mount(parent,{center:[c.lon,c.lat],span:8,w:1130,h:605});}finally{ci.draw=draw;}
      return {kind:mark?.prop?.id,boxCount:mark?.boxes?.length,quayInBounds:mark?.right>=mark?.boxes?.at(-1)?.[2]};
    });
    assert.deepEqual(chart,{kind:'skull-cave',boxCount:2,quayInBounds:true});
    await p.screenshot({path:path.join(out,'shuangyu-chart.png')});
    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({...release,audit,captures,chart,errors},null,2));
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
