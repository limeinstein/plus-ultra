/* 기존 강 항구에서 큰 배를 사거나 옛 일지를 불러와도 출항할 수 있어야 한다. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{G}=require('./waterways_20261125.cjs');
assert(Object.keys(G.BALANCE.waterways.shipDraft).every(id=>G.SHIP[id]),'선종 제한의 ID가 실제 선종과 일치');
const ships=Object.keys(G.SHIP).map(type=>({type,...G.Hydro.fleetProfile([{type}])})),largest={draft:Math.max(...ships.map(x=>x.draft)),beam:Math.max(...ships.map(x=>x.beam)),turn:Math.max(...ships.map(x=>x.turn))};
const rows=G.Hydro.routes().filter(r=>r.crossings.length).map(r=>({id:r.id,ports:r.crossings.filter(c=>c.city.port).map(c=>({name:c.name,point:[c.lon,c.lat],largestAllowed:G.Hydro.canSail(c.lon,c.lat,largest),approach:!!G.Hydro.path(r.pts[0],[c.lon,c.lat],()=>null,largest)}))})).filter(r=>r.ports.length);
console.log(JSON.stringify({largest,ships:ships.sort((a,b)=>b.turn-a.turn).slice(0,4),rows}));
fs.writeFileSync(path.resolve(__dirname,'../artifacts/world-detail-20261125/harbor-profiles.json'),JSON.stringify({largest,rows},null,2));
if(!process.argv.includes('--report'))assert(rows.every(r=>r.ports.every(c=>c.largestAllowed&&c.approach)),'기존 항구의 대형선 입출항');
assert(!G.Hydro.crossingOpen({city:{founded:4000}},{date:{y:1480,m:5,d:15}}),'건설 전 도시의 다리·나루는 열리지 않는다');
