/* 업적을 이룰 수 있는가 — node achv.js reach.json (reach.js 결과의 1699년에서 찾을 수 없는 발견물로 센다) */
const path=require('path'),fs=require('fs');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.BROWSER_EXE,args:['--allow-file-access-from-files']});const p=await b.newPage();
await p.route(/^https?:\/\//,r=>r.fulfill({status:204,body:''}));
await p.goto('file://'+path.resolve(__dirname,'../..','index.html')+'');await p.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:180000});
const R=JSON.parse(fs.readFileSync(process.argv[2],'utf8')).years['1699'].rec;
const bad=Object.keys(R).filter(k=>/^(not-built|gone|FAIL|need|story-only|not-open)/.test(R[k].st));
console.log(JSON.stringify(await p.evaluate((bad)=>{const B=new Set(bad),out=[];
 const D=G.DISCOVERIES;
 G.ACHIEVEMENTS.forEach(a=>{
  let probs=[];
  if(a.ids){const ok=a.ids.filter(id=>!B.has(id)&&G.DISC[id]);const need=a.n||a.ids.length;if(ok.length<need)probs.push('ids '+ok.length+'/'+need+' (빠짐: '+a.ids.filter(id=>B.has(id)).join(',')+')');}
  if(a.cats)a.cats.forEach(c=>{let pool;if(c.ids)pool=c.ids;else{const cs=[].concat(c.cat);pool=D.filter(d=>cs.indexOf(d.cat)>=0&&(c.reg==null||d.reg===c.reg)).map(d=>d.id);}
    const ok=pool.filter(id=>!B.has(id));if(ok.length<(c.n||pool.length))probs.push('cats '+ok.length+'/'+(c.n||pool.length)+' '+(c.ids?'':JSON.stringify(c.cat)));});
  if(a.collectionRule){const pool=(G.Achieve.collectionPool(a.collectionRule))||[];const miss=(pool||[]).map(d=>d.id||d).filter(id=>B.has(id));if(miss.length)probs.push('collection 빠짐 '+miss.length+': '+miss.slice(0,12).join(','));}
  if(probs.length)out.push(a.group+' / '+a.name+' ('+a.id+'): '+probs.join(' ; '));});
 return out;},bad),null,1));await b.close();})();
