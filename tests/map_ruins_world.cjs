/* 실제 file:// 게임에서 유적 아틀라스, 공개 조건, 선택 범위와 장면을 점검한다. */
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname,'..');
const out = path.join(root,'artifacts/map-ruins-20261126');
fs.mkdirSync(out,{recursive:true});

(async()=>{
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
  try {
    const p = await browser.newPage({viewport:{width:1280,height:720}});
    p.setDefaultTimeout(180000);
    const errors = [];
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await p.addInitScript(()=>requestAnimationFrame=()=>0);
    await p.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>window.G && G.DiscoveryIcon && G.State);
    if (process.argv.includes('--inventory')) {
      const rows=await p.evaluate(()=>G.DISCOVERIES.filter(d=>d.cat==='ruin').map(d=>({
        id:d.id,name:d.name,how:d.how,region:d.reg,formation:!!G.Terrain.formationFor(d.id),
        future:!!(G.Disc.isFuture(d)||d.alwaysMirage||d.mirage50||d.mirageFrom), source:G.DiscoveryIcon.source(d)
      })));
      fs.writeFileSync(path.join(out,'source.json'),JSON.stringify(rows,null,2));
      return;
    }
    await p.evaluate(async()=>{
      await G.Game.ensureGeo();
      const sk = Object.fromEntries(G.SKILLS.map(x=>[x.id,1]));
      const s = G.Game.state = G.State.newGame({name:'유적 지도 검증',nation:'PT',job:'explorer',age:24,
        birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
      s.flags.prologue=true;s.settings.res=.66;s.settings.sound=0;s.settings.music=0;
      s.date={y:1480,m:5,d:15};s.fleet.ships=[G.R.newShip('caravel')];
      s.fleet.crew=60;s.fleet.food=2000;s.fleet.water=2000;
      s.known=G.CITY_DATA.filter(c=>c&&G.R.cityExists(c)).map(c=>c.id);
      G.State.save=()=>{};G.Rain.weather=()=>({cloud:0,storm:0});G.UI.toast=()=>{};
      await G.TerrainArt.ready;
    });
    const report = await p.evaluate(async()=>{
      const models=G.RUIN_MODELS, icon=G.DiscoveryIcon;
      const ids=Object.keys(models), errors=[];
      const set=ids.map(id=>G.DISC[id]);
      const sample=G.DISC.giza, fixed=G.DISC.ds_678, city=G.DISC.parthenon, natural=G.DISC.niagara;
      const atlas=Array.from(new Set(ids.map(id=>models[id][0])));
      await Promise.all(atlas.map(key=>G.Img.load(key)));
      for(const id of ids){
        const entry=models[id], [key,x,y,w,h,ax,ay]=entry, d=G.DISC[id], im=G.Img.get(key);
        if(!d||d.cat!=='ruin'||d.alwaysMirage||d.mirage50||d.mirageFrom||G.Disc.isFuture(d))errors.push([id,'발견물/신기루']);
        if(!im||x+w>im.width||y+h>im.height||w<1||h<1||!Number.isFinite(ax)||!Number.isFinite(ay))errors.push([id,'아틀라스 범위']);
        if(d.how!=='city'&&!icon.isMapLandmark(d))errors.push([id,'지도 등록']);
        if(!icon.source(d)&&entry[8]!=='blender')errors.push([id,'기존 외관 연결']);
      }
      const atBase=icon.metrics(sample,1,110), close=icon.metrics(sample,1,520), chart=icon.metrics(sample,1);
      const y=(close.top+close.base)/2+160;
      const hit=icon.at([sample],()=>[160,160],160,y,1,520)===sample && !icon.at([sample],()=>[160,160],160,270,1,520);
      const c=G.CITY_DATA[city.city], parts=G.CityIcon.plan(c).parts;
      const cityReuse=parts.some(pr=>pr.id===city.id&&pr.art.key===models[city.id][0]);
      const initiallyHidden=!icon.visible().some(d=>d.id===sample.id);
      const naturalLegacy=icon.source(natural).key.startsWith('map-discoveries/');
      const eligible=set.filter(d=>d.how==='land'&&(!d.built||d.built<=1480));
      const coast=eligible.filter(d=>d.id!=='qeswachaka'&&G.Geo.sdf(d.lon,d.lat)<=0);
      const coastOnLand=coast.filter(d=>G.Geo.sdf(...icon.position(d))>0).length;
      const bridge=G.DISC.qeswachaka;
      const bridgeKept=icon.position(bridge).every((value,i)=>value===[bridge.lon,bridge.lat][i]);
      return {count:ids.length,blender:ids.filter(id=>models[id][8]==='blender').length,atlas:atlas.length,
        newOutdoor:icon.isMapLandmark(fixed)&&!icon.source(fixed), initiallyHidden, naturalLegacy, cityReuse,
        oldStonehenge:models.stonehenge[8]==='legacy'&&icon.source(G.DISC.stonehenge).key==='map-discoveries/ruins-1',
        cityNoDuplicate:!icon.isMapLandmark(city), hit, bridgeKept, sizes:[chart.width,atBase.width,close.width],
        coast:{total:coast.length,onLand:coastOnLand},errors};
    });
    assert.deepEqual(report.errors,[]);
    assert(report.count>=360);
    for(const k of ['newOutdoor','initiallyHidden','naturalLegacy','cityReuse','cityNoDuplicate','hit','oldStonehenge','bridgeKept'])assert(report[k],k);
    assert(report.sizes[2]>report.sizes[1]&&report.sizes[1]>report.sizes[0]);
    assert.equal(report.coast.onLand,report.coast.total,'육상 건물이 물 위에 놓이지 않아야 한다');
    console.log('지도 유적',JSON.stringify(report));

    for(const [scene,id,port,zoom,label] of [['land','giza',78,110,'giza-base'],['land','giza',78,520,'giza-close'],
      ['land','stonehenge',38,420,'stonehenge'],['land','angkor',162,470,'angkor'],
      ['land','machupicchu',0,460,'machupicchu'],['sea','ds_329',38,460,'itsukushima']]){
      const rendered=await p.evaluate(async({scene,id,port,zoom})=>{
        const s=G.Game.state,d=G.DISC[id];
        s.disc[id]={found:true,me:true};
        const until=performance.now()+260;
        while(performance.now()<until)await new Promise(r=>setTimeout(r,20));
        if(G.Game.sceneName!==scene){
          if(scene==='land')await G.Game.go('land',{from:port});
          else {s.loc={mode:'sea',lon:d.lon,lat:d.lat,heading:0};await G.Game.go('sea',{fresh:true});}
        }
        const st=G.Scenes[scene].runtime();
        let actor=scene==='sea'?G.Nav.nearestSea(d.lon-155/zoom,d.lat-95/zoom,18):null;
        if(!actor)actor=[d.lon-150/zoom,d.lat-70/zoom];
        s.loc.lon=actor[0];s.loc.lat=actor[1];
        st.cam.lon=d.lon;st.cam.lat=d.lat;st.cam.zoom=zoom;st.cam.zoomT=0;st.paused=true;st.busy=1;st.dayAcc=-1e6;st.t=24;
        if(scene==='sea')st.npcs=[];
        const mark=G.DiscoveryIcon.draw;
        let calls=0, metrics;
        G.DiscoveryIcon.draw=function(ctx,site,...args){
          const result=mark.call(this,ctx,site,...args);
          if(site.id===id){calls++;metrics=result;}
          return result;
        };
        try{
          G.Game.renderer.invalidate();
          for(let i=0;i<10;i++){
            st.rframe=2;
            G.Game.scene.update(.016);
          }
        }finally{G.DiscoveryIcon.draw=mark;}
        return {found:G.DiscoveryIcon.visible().some(s=>s.id===id),calls,width:metrics?.width};
      },{scene,id,port,zoom});
      assert(rendered.found&&rendered.calls>0,label);
      await p.screenshot({path:path.join(out,label+'.png')});
      console.log(scene,label,rendered.width);
    }
    const chart=await p.evaluate(()=>{
      const host=document.createElement('div');
      host.style.cssText='position:absolute;inset:24px;background:#ead9b6;z-index:10000;overflow:auto';
      document.body.append(host);
      G.ChartView.mount(host,{center:[30,32],span:16,w:1120,h:620});
      return !!host.querySelector('canvas');
    });
    assert(chart);
    await p.screenshot({path:path.join(out,'chart.png')});
    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({...report,browserErrors:errors},null,2));
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
