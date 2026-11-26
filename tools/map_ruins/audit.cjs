/* 게임이 읽는 도시·유적 자료와 지도에 실제로 연결된 외관을 확인한다. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'../..');
const output=path.resolve(process.argv[2]||path.join(root,'artifacts/map-architecture-audit/inventory.json'));

(async()=>{
  const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({executablePath:chrome,args:['--allow-file-access-from-files']});
  try {
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
    await page.addInitScript(()=>requestAnimationFrame=()=>0);
    await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:180000});
    const data=await page.evaluate(()=>{
      const cities=G.CITY_DATA.filter(Boolean);
      const ruins=G.DISCOVERIES.filter(d=>d.cat==='ruin').map(d=>({
        id:d.id,name:d.name,how:d.how,city:d.city,lon:d.lon,lat:d.lat,built:d.built,openY:d.openY,goneY:d.goneY,
        future:!!(G.Disc.isFuture(d)||d.mirage50||d.alwaysMirage||d.mirageFrom),
        desc:d.desc,region:d.reg, source:G.DiscoveryIcon.source(d), key:G.DiscoveryIcon.key(d),
        model:G.RUIN_MODELS[d.id]||null, added:G.RUIN_ADDITIONS?.[d.id]||null, formation:!!G.Terrain.formationFor(d.id),
        cityArt:G.Img.path('map-cities/landmarks/'+d.id), oldArt:G.Img.path('landmarks/'+d.id)
      }));
      const sk=Object.fromEntries(G.SKILLS.map(d=>[d.id,1]));
      G.Game.state=G.State.newGame({name:'지도 외관 검사',nation:'PT',job:'explorer',age:24,
        birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
      const cityPlans = cities.map(c=>{
        const years=new Set([1480,1520,1580,1650,1699,Math.max(1480,c.founded||1480)]);
        ruins.filter(d=>d.how==='city'&&d.city===c.id&&!d.future).forEach(d=>{
          years.add(Math.max(d.built||1480,d.openY||1480,1480));
          if(d.goneY)years.add(d.goneY);
        });
        const plans=[...years].sort((a,b)=>a-b).flatMap(y=>{
          const date={y,m:6,d:15};
          G.Game.state.date=date;
          if(!G.R.cityExists(c,date))return [];
          const m=G.CityIcon.plan(c,date), f=G.R.facilities(c);
          return [{year:y,culture:m.culture,port:m.harbor,hasHarbor:!!f.harbor,landmark:m.landmark,
            parts:m.parts.map(p=>[p.role,p.id,p.art.key]),bad:m.parts.filter(p=>!G.Img.has(p.art.key)).map(p=>p.art.key)}];
        });
        return {id:c.id,name:c.name,size:c.size,founded:c.founded,until:c.until,port:c.port,lon:c.lon,lat:c.lat,plans};
      });
      return {cities:cityPlans,ruins};
    });
    fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,JSON.stringify({...data,errors},null,2));
    console.log(`도시 ${data.cities.length}곳, 유적 ${data.ruins.length}곳, 오류 ${errors.length}건`);
    if(errors.length)process.exitCode=1;
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
