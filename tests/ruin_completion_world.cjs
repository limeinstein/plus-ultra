/* 게임 본편에서 기존 도시·유적 보존, 새 외관과 거리 진입을 확인한다. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'artifacts/map-architecture-audit');

(async()=>{
  const before=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/ruin-completion-20261126-before.json'),'utf8'));
  const after=JSON.parse(fs.readFileSync(path.join(out,'verified-inventory.json'),'utf8'));
  assert.deepEqual(before.errors,[]);
  assert.deepEqual(after.errors,[]);
  assert.equal(after.cities.length,before.cities.length);
  assert.equal(after.ruins.length,before.ruins.length);
  const previous=new Map(before.ruins.map(d=>[d.id,d]));
  const oldPlans=new Map(before.cities.flatMap(c=>c.plans.map(plan=>[`${c.id}/${plan.year}`,plan])));
  const cities=after.cities.filter(c=>c.plans.length);
  const checkedPlans=cities.flatMap(c=>c.plans.map(plan=>[c,plan]));
  for(const [c,plan] of checkedPlans){
    assert(plan.parts.length,`비어 있는 도시 ${c.name}`);
    assert.deepEqual(plan.bad,[]);
    assert.equal(plan.port,Boolean(c.port&&plan.hasHarbor));
    if(c.size===1)assert(!plan.parts.some(([role])=>['market','trade','library'].includes(role)));
    const old=oldPlans.get(`${c.id}/${plan.year}`);
    assert(old,`${c.name} ${plan.year}년`);
    for(const [role,id,key] of old.parts){
      if(!key.startsWith('map-cities/landmarks/')&&!key.startsWith('map-ruins/')&&key!=='map-cities/heritage')continue;
      if(previous.get(id)?.goneY<=plan.year)continue;
      assert(plan.parts.some(([roleNow,idNow,artNow])=>roleNow===role&&idNow===id&&artNow===key),`${c.name} 기존 외관 ${id}`);
    }
  }
  const real=after.ruins.filter(d=>!d.future);
  const added=real.filter(d=>d.added);
  assert.equal(added.length,29);
  assert.equal(added.filter(d=>d.how==='city').length,26);
  for(const d of after.ruins){
    const old=previous.get(d.id);
    assert.deepEqual(d.model,old.model,d.id);
    assert.equal(d.future,old.future);
    if(!d.added){assert.equal(d.key,old.key);assert.equal(d.oldArt,old.oldArt);}
    if(d.future){
      assert(!d.added);
      assert.equal(d.key,old.key);
      assert.equal(d.oldArt,old.oldArt);
      continue;
    }
    if(d.how==='city')assert(d.oldArt||d.cityArt||d.model,`${d.id} 거리 외관 누락`);
    else assert(d.key||d.formation,`${d.id} 야외 외관 누락`);
  }

  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
  try{
    const p=await browser.newPage({viewport:{width:1280,height:720}});
    const errors=[];
    p.setDefaultTimeout(180000);
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await p.addInitScript(()=>requestAnimationFrame=()=>0);
    await p.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded'});
    const sprites=await p.evaluate(async()=>{
      await G.Game.ensureGeo();
      const sk=Object.fromEntries(G.SKILLS.map(x=>[x.id,1]));
      const s=G.Game.state=G.State.newGame({name:'도시·유적 보완 확인',nation:'PT',job:'explorer',age:24,
        birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
      s.flags.prologue=true;s.settings.sound=0;s.settings.music=0;s.settings.res=.66;
      s.date={y:1658,m:5,d:15};s.fleet.ships=[G.R.newShip('caravel')];
      s.fleet.crew=60;s.fleet.food=2000;s.fleet.water=2000;
      s.known=G.CITY_DATA.filter(c=>c&&G.R.cityExists(c)).map(c=>c.id);
      G.State.save=()=>{};G.Rain.weather=()=>({cloud:0,storm:0});G.UI.toast=()=>{};
      await G.TerrainArt.ready;
      const list=Object.keys(G.RUIN_ADDITIONS).map(id=>G.DISC[id]);
      const keys=list.flatMap(d=>[G.RUIN_ADDITIONS[d.id][0],...(d.how==='city'?['landmarks/'+d.id]:[])]);
      await Promise.all([...new Set(keys)].map(key=>G.Img.load(key)));
      const fail=[];
      for(const d of list){
        const [key,x,y,w,h,ax,ay]=G.RUIN_ADDITIONS[d.id];
        const im=G.Img.get(key);
        if(!im||x+w>im.width||y+h>im.height||!Number.isFinite(ax)||!Number.isFinite(ay))fail.push([d.id,'아틀라스']);
        if(d.how==='city'&&!G.Img.get('landmarks/'+d.id))fail.push([d.id,'거리 그림']);
        if(d.how!=='city'&&G.DiscoveryIcon.visible().includes(d))fail.push([d.id,'발견하기 전에 공개']);
      }
      return {fail,map:list.length,uniqueImages:new Set(keys).size};
    });
    assert.deepEqual(sprites.fail,[]);
    const land=[];
    for(const [site,from] of [['ds_687',61],['ds_692',33],['ds_850',0]]){
      const d=await p.evaluate(async({site,from})=>{
        const d=G.DISC[site], s=G.Game.state, icon=G.DiscoveryIcon;
        if(G.Game.sceneName!=='land')await G.Game.go('land',{from});
        s.disc[site]={found:true,me:true};
        await new Promise(r=>setTimeout(r,265));
        const st=G.Scenes.land.runtime(), zoom=500;
        const [lon,lat]=icon.position(d);
        s.loc.lon=lon-.26;s.loc.lat=lat-.12;
        st.cam.lon=lon;st.cam.lat=lat+G.Terrain.lift(lon,lat);st.cam.zoom=zoom;st.cam.zoomT=0;
        st.paused=true;st.busy=1;st.dayAcc=-1e6;st.t=18;
        G.Game.renderer.invalidate();
        const metrics=icon.metrics(d,1.15,zoom);
        const hit=icon.at([d],()=>[800,450],800+(metrics.left+metrics.right)/2,450+(metrics.top+metrics.base)/2,1.15,zoom)===d;
        let calls=0;
        const draw=icon.draw;
        icon.draw=function(ctx,site,...args){if(site===d)calls++;return draw.call(this,ctx,site,...args);};
        try{for(let i=0;i<10;i++){st.rframe=2;G.Game.scene.update(.016);}}finally{icon.draw=draw;}
        return {site:d.id,title:d.name,calls,hit};
      },{site,from});
      assert(d.calls>0&&d.hit,site);
      land.push(d);
      await p.screenshot({path:path.join(out,site+'.png')});
    }
    const street=[];
    for(const [city,sites] of [[33,['vesta','ds_677']],[47,['ds_315']],[227,['ds_331']],[190,['ds_716']]]){
      await p.evaluate(city=>G.Game.go('city',{cityId:city,load:true}),city);
      try {
        await p.waitForFunction(city=>G.Town.runtime()?.city.id===city,city,{polling:50,timeout:30000});
      } catch(error) {
        const status=await p.evaluate(city=>({enabled:G.Town.available(G.CITY_DATA[city]),location:G.Game.state.loc,
          town:G.Town.city()?.name,busy:G.Scenes.city.isBusy()}),city);
        throw new Error(`거리 준비 ${city}: ${JSON.stringify({status,errors})}`,{cause:error});
      }
      const row=await p.evaluate(({city,sites})=>{
        const t=G.Town.runtime();
        const marks=t.marks.filter(m=>sites.includes(m.id));
        if(marks.length){
          t.hero.x=marks[0].x+marks[0].cv.width*.30;
          t.cam=t.camTo=Math.max(0,Math.min(t.streetW-1600,t.hero.x-800));
          t.dirty=true;
          G.Game.scene.update(.016);
        }
        const marked=marks.map(m=>({id:m.id,w:m.cv.width,h:m.cv.height}));
        return {city:G.CITY_DATA[city].name,marked,available:sites.map(id=>G.Disc.inTown(G.DISC[id]))};
      },{city,sites});
      assert.equal(row.marked.length,sites.length,row.city);
      assert(row.available.every(Boolean),row.city);
      street.push(row);
      await p.screenshot({path:path.join(out,`street-${city}.png`)});
    }
    assert.deepEqual(errors,[]);
    const result={cities:cities.length,plans:checkedPlans.length,ruins:after.ruins.length,historic:real.length,
      temporal:after.ruins.length-real.length,added:added.length,sprites,land,street,errors};
    fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
