/* 본편을 열어 도시 자료와 지형 판정, 실제 장면의 지도 그림을 함께 검사한다. */
'use strict';
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'artifacts/city-icons-world-20261126');
fs.mkdirSync(out,{recursive:true});

(async()=>{
  const browser=await chromium.launch({
    executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']
  });
  const errors=[];
  try{
    const p=await browser.newPage({viewport:{width:1280,height:720}});
    p.setDefaultTimeout(180000);
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await p.addInitScript(()=>requestAnimationFrame=()=>0);
    await p.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>window.G&&G.CityIcon&&G.CityIcon.plan&&G.State);
    await p.evaluate(()=>G.Game.ensureGeo());
    await p.evaluate(async()=>{
      const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);
      const s=G.Game.state=G.State.newGame({name:'지도 도시 비교',nation:'PT',job:'explorer',age:24,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
      s.flags.prologue=true;s.settings.res=.66;s.settings.sound=0;s.settings.music=0;s.date={y:1480,m:5,d:15};
      s.fleet.ships=[G.R.newShip('caravel')];s.fleet.crew=60;s.fleet.food=2000;s.fleet.water=2000;
      G.State.save=()=>{};G.Rain.weather=()=>({cloud:0,storm:0});G.UI.toast=()=>{};
      s.known=G.CITY_DATA.filter(c=>c&&G.R.cityExists(c)).map(c=>c.id);
      await G.TerrainArt.ready;
      window.cityTick=()=>{const st=G.Scenes[G.Game.sceneName].runtime();st.rframe=2;st.busy=1;st.paused=true;st.dayAcc=-1e6;G.Game.scene.update(.016);};
    });
    const report=await p.evaluate(()=>{
      const all=G.CITY_DATA.filter(Boolean), issues=[], dates=[], checked=new Set(), cultures=new Set();
      const order=[1480,1521,1557,1620,1640,1685,1800,1905];
      for(const y of order){
        const date={y,m:5,d:15};G.Game.state.date=date;
        let named=0,courts=0,exact=0;
        const counts=[0,0,0,0];
        for(const c of all.filter(c=>G.R.cityExists(c,date))){
          const m=G.CityIcon.plan(c,date), f=G.R.facilities(c), roles=m.parts.map(p=>p.role);
          const expected=Math.max(1,Math.min(3,c.size||1));
          checked.add(c.id);cultures.add(m.culture);counts[expected]++;
          if(m.n!==expected || m.harbor!==Boolean(c.port&&f.harbor))issues.push([y,c.name,'규모/항구']);
          if(!roles.length&&!m.harbor)issues.push([y,c.name,'빈 도시']);
          for(const k of ['tavern','inn','trade','market','library','palace']){
            if(roles.includes(k)&&!f[k])issues.push([y,c.name,k]);
          }
          if((roles.includes('trade')||roles.includes('market'))&&expected===1)issues.push([y,c.name,'소도시 시설']);
          if(roles.includes('library')&&expected<3)issues.push([y,c.name,'도서관']);
          if(new Set(roles).size!==roles.length)issues.push([y,c.name,'중복 시설']);
          if(roles.includes('home')&&G.R.seat()!==c.id)issues.push([y,c.name,'자택']);
          if(m.palace)courts++;
          for(const v of m.parts){
            if(!G.Img.has(v.art.key))issues.push([y,c.name,v.art.key]);
          }
          if(!m.landmark)continue;
          named++;
          const d=G.DISC[m.landmark];
          if(!d||d.city!==c.id||d.mirage50||d.mirageFrom||d.alwaysMirage||G.Disc.isFuture(d)||d.built>y)issues.push([y,c.name,'발견물',m.landmark]);
          const hero=m.parts.find(v=>v.role==='landmark' || v.role==='palace'&&v.id===m.landmark);
          if(hero?.art.key.includes('/landmarks/')||hero?.art.key.endsWith('/heritage'))exact++;
        }
        dates.push({year:y,total:counts.slice(1).reduce((a,b)=>a+b,0),small:counts[1],medium:counts[2],large:counts[3],named,courts,exact});
      }
      G.Game.state.date={y:1480,m:5,d:15};
      const exactCases=[['notredame',14],['colosseum',33],['whitetower',38],['giralda',7],['hagiasophia',112]];
      for(const [id,cid] of exactCases){const m=G.CityIcon.plan(G.CITY_DATA[cid]);if(m.landmark!==id||!m.palace)issues.push([cid,id,m.landmark,m.palace]);}
      return {all:all.length,checked:checked.size,cultures:cultures.size,issues,dates,
        missing:all.filter(c=>!checked.has(c.id)).map(c=>[c.name,c.founded,c.until])};
    });
    fs.writeFileSync(path.join(out,'data-audit.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
    assert.deepEqual(report.issues,[]);
    assert.equal(report.checked,report.all);
    const sites=await p.evaluate(()=>{
      const rows=[], G0=G.Geo,T=G.Terrain;
      const cities=G.CITY_DATA.filter(Boolean);
      for(const zoom of [110,330]){
        for(const c of cities){
          const date={y:Math.max(1480,c.founded||0),m:5,d:15};
          G.Game.state.date=date;
          if(!G.R.cityExists(c,date))continue;
          const m=G.CityIcon.plan(c), view=G.CityIcon.view(c,{zoom}), start=performance.now(), site=G.CityIcon.site(c,m,view,true);
          const ms=performance.now()-start, y=c.lat+T.lift(c.lon,c.lat);
          const sdf=(x,z)=>{const point=T.unproject(G0.wrapLon(c.lon+x/view.zoom),y-z/view.zoom);return G0.sdf(...point);};
          const q=site.dock;
          rows.push({id:c.id,name:c.name,zoom:view.zoom,width:view.width,port:m.harbor,buildings:site.buildings.length,
            expected:m.parts.length,waterFeet:site.buildings.filter(v=>sdf(v.x,v.y)<=0).length,quay:!!q,
            waterQuay:!!q&&(sdf(...q.land)<=0||sdf(...q.water)>=0||sdf(...q.ship)>=0),ms});
        }
      }
      G.Game.state.date={y:1480,m:5,d:15};
      return rows;
    });
    fs.writeFileSync(path.join(out,'shore-audit.json'),JSON.stringify(sites,null,2));
    console.log('지형 검사',sites.length,'건물 수면',sites.filter(r=>r.waterFeet).length,'부두 수면',sites.filter(r=>r.waterQuay).length);
    assert(!sites.some(r=>r.waterFeet||r.waterQuay));
    assert.equal(sites.length,report.all*2);
    assert(!sites.some(r=>r.expected!==r.buildings||r.port&&!r.quay));

    const shots=[['land',14,'paris',540],['land',33,'rome',415],['sea',38,'london',330],['sea',112,'istanbul',330],['sea',7,'seville',330],
      ['sea',0,'lisbon',210],['sea',78,'alexandria',330],['sea','말라카','malacca',300],['sea','나가사키','nagasaki',300],
      ['land','한양','hanyang',510],['land','북경','beijing',410],['land','테노치티틀란','tenochtitlan',510],
      ['land','쿠스코','cusco',510],['sea','모가디슈','mogadishu',300],['sea','고아','goa',300],['sea','독도','dokdo',330]];
    const done=[];
    for(const [kind,id,name,zoom] of shots){
      const result=await p.evaluate(async({kind,id,zoom,name})=>{
        const c=typeof id==='number'?G.CITY_DATA[id]:G.CITY_DATA.find(x=>x&&x.name===id);
        if(!c)return null;
        const s=G.Game.state, plan=G.CityIcon.plan(c);
        const keys=['map-cities/'+plan.culture,...plan.parts.map(p=>p.art.key)];
        if(plan.harbor)keys.push('map-cities/quays');
        await Promise.all(keys.map(k=>G.Img.load(k)));
        if(G.Game.sceneName!==kind){
          if(kind==='land')await G.Game.go('land',{from:c.id});
          else {s.loc={mode:'sea',lon:c.lon,lat:c.lat,heading:0};await G.Game.go('sea',{fresh:true});}
        }
        const st=G.Scenes[kind].runtime();
        const gap=154/zoom;
        let actor=kind==='sea'?G.Nav.nearestSea(c.lon-gap,c.lat-gap*.75,18):null;
        if(!actor)actor=kind==='sea'&&c.dock?[c.dock[1],c.dock[0]]:[c.lon-gap,c.lat-gap*.36];
        s.loc.lon=actor[0];s.loc.lat=actor[1];
        st.cam.lon=c.lon-gap*.31;st.cam.lat=c.lat-gap*.2;st.cam.zoom=zoom;st.cam.zoomT=0;
        st.t=24;st.busy=1;st.paused=true;
        if(kind==='sea'){st.npcs=[];st.target={lon:c.lon,lat:c.lat,city:c};}
        else st.trail=[];
        G.Game.renderer.invalidate();
        for(let i=0;i<65;i++){
          cityTick();
          if(i>=7&&st.cityMarks[c.id]?.boxes?.length>0)break;
        }
        const mark=st.cityMarks[c.id];
        return {name:c.name,id:c.id,file:name,parts:plan.parts.map(p=>[p.role,p.id]),boxes:mark?.boxes?.length??-1,
          anchor:[mark?.anchorX,mark?.y],
          label:mark?.label, hit:!!mark?.boxes?.some(b=>G.CityIcon.hit(mark,(b[0]+b[2])/2,(b[1]+b[3])/2))};
      },{kind,id,zoom,name});
      if(!result)continue;
      assert(result.boxes>0,result.name+' 블렌더 그림');
      assert(result.hit,result.name+' 그림을 눌렀을 때 선택');
      done.push(result);
      await p.screenshot({path:path.join(out,name+'.png')});
      console.log('게임 화면',result.name,result.boxes);
    }
    assert(done.length>=10);
    const chart=await p.evaluate(async()=>{
      const host=document.createElement('div');
      host.style.cssText='position:absolute;inset:24px;background:#ead9b6;z-index:10000;overflow:auto';
      document.body.append(host);
      G.ChartView.mount(host,{center:[3,45],span:23,w:1120,h:620});
      return !!host.querySelector('canvas');
    });
    assert(chart);
    await p.screenshot({path:path.join(out,'chart.png')});
    fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify({done,errors},null,2));
    assert.deepEqual(errors,[]);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
