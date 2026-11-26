/* 게임 지형에서 모든 자연 모형과 시야별 접지를 확인한다. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..');
const out=process.env.OUT||path.join(root,'artifacts/nature-landmarks-20261127');
fs.mkdirSync(out,{recursive:true});

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    const errors=[];
    page.setDefaultTimeout(180000);
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.addInitScript(()=>requestAnimationFrame=()=>0);
    await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts.ready);
    const report=await page.evaluate(async()=>{
      await G.Game.ensureGeo();
      const sk=Object.fromEntries(G.SKILLS.map(d=>[d.id,1]));
      const s=G.Game.state=G.State.newGame({name:'자연 유적 위치 시험',nation:'PT',job:'explorer',age:24,
        birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
      s.flags.prologue=true;s.settings.res=.65;s.settings.sound=0;s.settings.music=0;
      s.date={y:1650,m:5,d:15};s.fleet.ships=[G.R.newShip('caravel')];
      s.fleet.crew=60;s.fleet.food=2000;s.fleet.water=2000;
      s.known=[];G.State.save=()=>{};G.Rain.weather=()=>({cloud:0,storm:0});G.UI.toast=()=>{};
      await G.TerrainArt.ready;
      const marks=G.NATURE_LANDMARKS,icon=G.DiscoveryIcon;
      const rows=G.DISCOVERIES.filter(d=>d.cat==='nature'||d.natural);
      const byAsset=new Set(Object.values(marks).map(r=>r[0]));
      await Promise.all([...byAsset].map(key=>G.Img.load(key)));
      const problems=[],checks=[],moves=[],times=[];
      let sea=0,land=0,markers=0;
      for(const d of rows){
        const r=marks[d.id];
        if(!r||!icon.isMapLandmark(d)){problems.push([d.id,'누락']);continue;}
        const im=G.Img.get(r[0]);
        if(!im||r[1]+r[3]>im.width||r[2]+r[4]>im.height)problems.push([d.id,'그림 범위']);
        const original=[d.lon,d.lat];
        if(d.how==='sea'||d.how==='special'){
          const view=icon.layout(d,1,110);
          if(view.point.join()!==original.join()||view.marker||view.hidden)problems.push([d.id,'수상 위치']);
          sea++;
          continue;
        }
        land++;
        if(!G.NatureLandmark.bakedPoint(d,r))problems.push([d.id,'접지 사전 계산 누락']);
        const started=performance.now();
        const base=icon.layout(d,1.15,110);
        times.push(performance.now()-started);
        const move=Math.hypot(G.Geo.wrapLon(base.point[0]-d.lon),base.point[1]-d.lat);
        if(move>.01)moves.push({id:d.id,name:d.name,move,from:original,to:base.point});
        for(const [zoom,chart] of [[80,0],[110,0],[290,0],[560,0],[0,100],[0,4]]){
          const view=icon.layout(d,1.15,zoom,chart);
          if(view.marker)markers++;
          const ok=!view.hidden&&G.NatureLandmark.verify(view.point,r,view.marker?0:view.metrics.width,zoom||chart);
          if(!ok)problems.push([d.id,zoom||chart,view.point,view.metrics.width,G.Geo.sdf(view.point[0],view.point[1])]);
          checks.push(ok);
        }
        if(d.lon!==original[0]||d.lat!==original[1])problems.push([d.id,'발견 좌표 변경']);
      }
      const initiallyHidden=!icon.visible().some(d=>d.id==='ds_397');
      const ruler=(lon,lat)=>[800+G.Geo.wrapLon(lon-6.865)*420,450-(lat-45.83278)*420];
      const mont=G.DISC.ds_400, mounted=icon.layout(mont,1.15,420), p=ruler(...mounted.point), m=mounted.metrics;
      const selectable=icon.at([mont],ruler,p[0]+(m.left+m.right)/2,p[1]+(m.top+m.base)/2,1.15,420)===mont;
      times.sort((a,b)=>a-b);
      return {count:rows.length,blender:Object.values(marks).filter(r=>r[8]==='blender').length,atlases:byAsset.size,
        baked:Object.keys(G.NATURE_FOOTINGS||{}).length,
        land,sea,checks:checks.length,markers,initiallyHidden,selectable,problems,
        coldMs:{median:times[Math.floor(times.length/2)],max:times[times.length-1]},
        moves:moves.sort((a,b)=>b.move-a.move).slice(0,20)};
    });
    fs.writeFileSync(path.join(out,'ground-audit.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({...report,moves:report.moves.slice(0,8)}));
    assert.deepEqual(report.problems,[]);
    assert(report.initiallyHidden&&report.selectable);
    assert.equal(report.count,222);
    assert.equal(report.baked,report.land,'처음 표시할 때 지형을 다시 검사하지 않아야 한다');

    const captures=[];
    for(const [scene,id,from,zoom,filename] of [
      ['land','ds_397',38,110,'causeway-base'],['land','ds_397',38,510,'causeway-close'],
      ['land','ds_388',0,450,'victoria-close'],['land','ds_378',190,450,'baekdu-close'],
      ['land','ds_400',0,420,'mont-blanc-close'],['land','niagara',0,330,'niagara-close'],
      ['sea','ds_396',38,420,'fjord-sea'],['sea','phuket',38,300,'phuket-sea']]){
      const shot=await page.evaluate(async({scene,id,from,zoom})=>{
        const s=G.Game.state,d=G.DISC[id],icon=G.DiscoveryIcon;
        s.disc[id]={found:true,me:true};
        await new Promise(resolve=>setTimeout(resolve,255));
        if(G.Game.sceneName!==scene){
          if(scene==='land')G.Game.go('land',{from});
          else{s.loc={mode:'sea',lon:d.lon,lat:d.lat,heading:0};G.Game.go('sea',{fresh:true});}
        }
        const st=G.Scenes[scene].runtime(), view=icon.layout(d,scene==='land'?1.15:1,zoom);
        const [lon,lat]=view.point;
        let actor=scene==='sea'?G.Nav.nearestSea(lon-140/zoom,lat-70/zoom,18):null;
        if(!actor)actor=[lon-140/zoom,lat-70/zoom];
        s.loc.lon=actor[0];s.loc.lat=actor[1];
        st.cam.lon=lon;st.cam.lat=lat+G.Terrain.lift(lon,lat);st.cam.zoom=zoom;st.cam.zoomT=0;
        st.t=25;st.paused=true;st.busy=1;st.dayAcc=-1e6;
        if(scene==='sea')st.npcs=[];
        G.Game.renderer.invalidate();
        const draw=icon.draw;
        let drawn=0, mark;
        icon.draw=function(ctx,site,x,y,opts){
          const result=draw.call(this,ctx,site,x,y,opts);
          if(site===d&&opts.layout&&G.Img.get(icon.key(d))){drawn++;mark=result;}
          return result;
        };
        try{for(let i=0;i<13;i++){st.rframe=2;G.Game.scene.update(.016);}}finally{icon.draw=draw;}
        return {id,name:d.name,scene,zoom,drawn,width:mark?.width,marker:view.marker||false};
      },{scene,id,from,zoom});
      assert(shot.drawn>0,filename);
      captures.push(shot);
      await page.screenshot({path:path.join(out,filename+'.png')});
    }
    const chart=await page.evaluate(()=>{
      const node=document.createElement('div');
      node.style.cssText='position:fixed;inset:20px;background:#e2cda0;z-index:20000';
      document.body.append(node);
      G.ChartView.mount(node,{center:[-6.51,55.24],span:8,w:1150,h:610});
      return !!node.querySelector('.cv-map');
    });
    assert(chart);
    await page.screenshot({path:path.join(out,'causeway-chart.png')});
    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({report,captures,errors},null,2));
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
