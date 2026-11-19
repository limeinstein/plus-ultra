// 격자 중심 사이의 좁은 물길과 목표 칸 연결: 모든 반환 구간이 뭍이어야 한다.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../js/world/landnav.js'),'utf8');
for(const barrier of [.2,.25,.3]){
 const G={Geo:{wrapLon:x=>x,sdf:(x,y)=>Math.abs(x-barrier)<.02&&Math.abs(y)<1?-1:1}};
 vm.runInNewContext(code,{window:{G}});
 const a=[-.5,0],b=[.5,0],p=G.LandNav.path(...a,...b);assert(p&&p.length,'좁은 물길을 둘러 갈 경로');
 let prev=a;for(const q of p){assert(G.LandNav.clear(prev,q),'물길을 가로지르지 않는다');prev=q;}
 assert.deepEqual(Array.from(prev),b);
 console.log('통과: 좁은 물길 '+barrier+' 경로 '+p.length+'구간');
}
{
 const G={Geo:{wrapLon:x=>x,sdf:(x,y)=>Math.abs(x-.25)<.02?-1:1}};vm.runInNewContext(code,{window:{G}});
 assert.equal(G.LandNav.path(-.5,0,.5,0),null,'이어지지 않는 땅은 경로 없음');
 console.log('통과: 연결되지 않은 땅');
}
