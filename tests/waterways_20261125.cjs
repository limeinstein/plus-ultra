/* 수로의 표시 원본·선종·도하·계절·호수 연결과 기존 지도 단위를 검사한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const ROOT=path.resolve(__dirname,'..');
const c={console,performance,Uint8Array,Int8Array,Uint16Array,Int16Array,Int32Array,Float32Array,Float64Array,Math,atob};c.window=c;c.G={unpackB64:(b)=>new Uint8Array(zlib.inflateSync(Buffer.from(b,'base64')))};vm.createContext(c);
for(const f of ['js/data/base.js','js/data/ships.js','js/data/world_data.js','js/data/terrain_detail.js','js/data/terrain_patches.js','js/data/waterway_geometry.js','js/data/waterways.js','js/data/cities.js','js/world/geo.js','js/world/terrain.js','js/world/nav.js','js/world/landnav.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),c,{filename:f});
const G=c.G;G.FX={water:{berg:0}};G.Game={state:{day:1,date:{y:1480,m:5,d:15},loc:{mount:{id:'walk',n:0}},fleet:{ships:[]}}};
G.Geo.init();
console.log(JSON.stringify({stats:G.Hydro.stats(),alps:G.Terrain.sample(8.1,46.5),fuji:G.Terrain.sample(138.73,35.36),nile:G.Terrain.sample(31.2,29.6),class:G.Geo.terrain(8.1,46.5)}));
const profile={draft:1.6,beam:6,turn:60},large={draft:5.2,beam:14,turn:210};
const rows=G.Hydro.routes().map(r=>({id:r.id,connected:!!r.connected,crossings:r.crossings.length,lower:G.Hydro.canSail(r.pts[1][0],r.pts[1][1],large),upper:G.Hydro.canSail(r.pts.at(-1)[0],r.pts.at(-1)[1],large)}));
console.log(JSON.stringify(rows));
if(process.argv.includes('--inspect'))process.exit(0);
assert(Math.abs(G.Geo.dist(-9.1,38.7,103.8,1.3)-Math.hypot(112.9,-37.4))<1e-10);
assert(G.Terrain.sample(8.1,46.5).elevation>1000,'알프스는 실제 고도에서 높다');
assert(G.Hydro.routes().filter(r=>r.connected).length>=16,'주요 하류 개방');
const r=G.Hydro.routes().find(r=>r.id==='amazon'),a=r.pts[3],b=r.pts[5];
assert(G.Hydro.canSail(a[0],a[1],large),'아마존 하류의 큰 배');
assert(G.Hydro.landEffect(a[0],a[1],{mount:{id:'horse'},date:{m:3,d:15}}).speed>G.Hydro.landEffect(a[0],a[1],{mount:{id:'walk'},date:{m:3,d:15}}).speed);
assert(!G.Hydro.canWalk(a[0],a[1],{mount:{id:'wagon'},date:{m:3,d:15}}),'큰 강의 마차 차단');
assert(!G.Hydro.canWalk(a[0],a[1],{mount:{id:'elephant'},date:{m:5,d:2}}),'홍수 도하 차단');
assert(!G.Hydro.canSail(33, -.5,profile),'연결되지 않은 빅토리아 호수 차단');
const north=G.Hydro.routes().find(r=>r.id==='northerndvina').pts[2];
const ice=G.Hydro.landEffect(north[0],north[1],{mount:{id:'reindeer'},date:{m:1,d:15}});assert(ice.frozen&&ice.speed>1.5,'북쪽 겨울 썰매');
assert(!G.Hydro.canSail(north[0],north[1],profile,{date:{m:1,d:15}}),'결빙 항해 차단');
assert(G.Hydro.freshwater(31.2,29.6),'사막 강가 담수');
const atlas=G.Hydro.raster(a[0],a[1],2,2,256);assert.equal(atlas.raw.length,256*256*4);
const nav=G.Hydro.path(a,b,()=>null,profile);assert(nav&&nav.length>1,'공유 수로 자동항해');
for(let i=1;i<nav.length;i++)assert(G.Hydro.clear(nav[i-1],nav[i],profile));
console.log('WATERWAYS_RULES_OK');
const checked=[];
for(const river of G.Hydro.routes()){
 let blocked=[];for(let i=1;i<river.pts.length;i++)if(!G.Hydro.clear(river.pts[i-1],river.pts[i],profile)){
  const p=river.pts[i],q=G.Hydro.at(...p);blocked.push({i,p,name:q&&q.name,depth:q&&q.depth,turn:q&&q.turn,lake:G.Terrain.isLake(...p),smallest:G.Hydro.canSail(...p,{draft:1,beam:3,turn:28}),lakes:G.TERRAIN_DETAIL.lakes.filter(l=>p[0]>l.box[0]&&p[0]<l.box[2]&&p[1]>l.box[1]&&p[1]<l.box[3])});
 }
 checked.push({id:river.id,segments:river.pts.length-1,blocked});
}
console.log(JSON.stringify({routeContinuity:checked}));assert(checked.every(r=>!r.blocked.length),'선정한 하류의 모든 선분이 작은 탐험선으로 이어진다');
const nile=G.Hydro.routes().find(x=>x.id==='nile'),rosetta=G.TERRAIN_DETAIL.rivers.find(x=>x[0]==='Rosetta Branch')[2];
assert(nile.connected && G.Geo.baseIsSea(...nile.pts[0],.2),'로제타 하구가 지중해까지 열린다');
assert(rosetta.every(p=>nile.pts.some(q=>G.Geo.dist(...p,...q)<.00001)),'로제타 지류 지도 중심선이 공용 수로에 이어진다');
const nilePath=G.Hydro.path(nile.pts[0],nile.pts.at(-1),()=>null,profile);
assert(nilePath&&nilePath.length>100,'나일강 굽이를 따라 바다에서 상류까지 길을 잡는다');
// 좁은 강의 표시 거리장도 같은 폭이다. 특히 고위도에서 경도 축 폭이 잘리지 않아야 한다.
for(const id of ['amazon','northerndvina','thames','nile']){
 const river=G.Hydro.routes().find(x=>x.id===id),p=river.pts[Math.floor(river.pts.length/2)],side=256,span=1.5,tex=G.Hydro.raster(...p,span,span,side);let max=0,n=0;
 for(let y=10;y<side-10;y+=9)for(let x=10;x<side-10;x+=9){
  const lon=p[0]-span/2+(x+.5)*span/side,lat=p[1]-span/2+(y+.5)*span/side,q=G.Hydro.at(lon,lat),o=(y*side+x)*4;
  if(!q||Math.abs(q.signed)>.08)continue;
  const d=(tex.raw[o]*256+tex.raw[o+1]-32768)/8192;max=Math.max(max,Math.abs(d-q.signed));n++;
 }
 assert(max<.001,`${id} 그림/충돌 경계 차이 ${max}`);console.log(JSON.stringify({atlas:id,samples:n,maxDegrees:max}));
}
const crossing=G.Hydro.routes().find(x=>x.crossings.length).crossings[0];assert(G.Hydro.landEffect(crossing.lon,crossing.lat,{mount:{id:'wagon'},date:{m:5,d:2}}).bridge,'도시의 나루/다리');
G.Mounts={get:()=>({name:'말'})};const s=G.Game.state;s.player={gold:1000};s.loc={lon:a[0],lat:a[1],mount:{id:'horse',n:3}};s.day=20;const msgs=[];G.Hydro.landDay(s,msgs,()=>0);assert.equal(s.loc.mount.n,2,'도하 시 짐승 손실');G.Hydro.landDay(s,msgs,()=>0);assert.equal(s.loc.mount.n,2,'같은 날 도하 손실 중복 없음');
console.log('WATERWAYS_CONTINUITY_AND_EDGE_OK');
let stream=null;
for(const row of G.TERRAIN_DETAIL.rivers){for(let i=1;i<row[2].length;i+=7){const p=row[2][i],q=G.Hydro.at(...p);if(q&&!q.route&&G.Geo.baseSdf(...p)>2&&!G.Terrain.isLake(...p)){stream=p;break;}}if(stream)break;}
assert(stream,'작은 강 시험 위치');assert(!G.Hydro.canSail(...stream,profile),'작은 강에는 배가 들어가지 않는다');assert(G.Hydro.canWalk(...stream,{mount:{id:'walk'},date:{m:5,d:15}}),'작은 강은 육상 탐험 가능');
const mekong=G.Hydro.routes().find(r=>r.id==='mekong'),tonle=G.Hydro.routes().find(r=>r.id==='tonlesap');
const branch=G.Hydro.path(mekong.pts[3],tonle.pts.at(-1),()=>null,profile);assert(branch&&branch.every(p=>p),'메콩강에서 톤레사프 수로로 연결');
const connected=G.TERRAIN_DETAIL.lakes.filter(l=>l.route);console.log(JSON.stringify({smallRiver:stream,connectedLakes:connected.map(l=>({name:l.name,route:l.route}))}));assert(connected.some(l=>l.route==='tonlesap'),'톤레사프 호수 연결');
const center=r.pts[Math.floor(r.pts.length*.65)],water=G.Hydro.at(...center),normal=[-water.flow[1],water.flow[0]],from=[center[0]+normal[0]*(water.half+.03),center[1]+normal[1]*(water.half+.03)],dir=normal.map(x=>-x),len=water.half*2+.06;
const limited=G.Hydro.landStep(from,dir,len,1);assert(limited<len*.8,'큰 걸음도 강 구간의 이동 시간을 지불한다');
console.log('SMALL_STREAM_LAKE_BRANCH_AND_TRAVEL_COST_OK');
assert(G.Terrain.isLake(103.9,13)&&G.Hydro.canSail(103.9,13,profile),'연결된 톤레사프 호수 안 항해');
const lakePath=G.Hydro.path(mekong.pts[3],[103.9,13],()=>null,profile);assert(lakePath&&lakePath.length>2,'바다와 연결된 강에서 호수 안까지 자동항해');
assert(!G.Hydro.canSail(33,-.5,profile),'수로로 연결하지 않은 빅토리아 호수 진입 금지');
console.log('CONNECTED_LAKE_NAVIGATION_OK');
module.exports={G};
