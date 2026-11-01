/* 빠른 배속에서도 수명을 표본 한도가 잘라내지 않는지, 카메라 이동과 실제 이동을 구분하는지 검사. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const box={window:{G:{}}};vm.createContext(box);
for(const f of ['js/data/seafx.js','js/data/ships.js','js/scenes/seafx.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),box);
const G=box.window.G,FX=G.SeaFX;
for(const speed of [.5,1,4])for(const hz of [30,60]){
 const F=FX.create(),g={len:.12,wid:.04,ref:1.1,type:'galleon'};
 for(let f=0;f<=hz*12;f++){
  FX.age(F,1/hz);FX.follow(F,{x:f/hz*speed,y:0,baseX:f/hz*speed,baseY:0,h:0,speed:1,time:f/hz},g);
  assert(F.trail.length<=G.FX.wake.maxPoints);assert(F.parts.length<=G.FX.wake.shipParticles);
 }
 const oldest=F.et-F.trail[0].t0;assert(oldest>2&&oldest<=2.4+1/hz,JSON.stringify({speed,hz,oldest,n:F.trail.length}));
 const count=F.trail.length;FX.follow(F,{x:1000,y:1000,baseX:12*speed,baseY:0,h:Math.PI,speed:0,time:12.1},g);assert.equal(F.trail.length,count);
 FX.age(F,2.5);assert.equal(F.trail.length,0);assert.equal(F.parts.length,0);
}
// 날짜 변경선은 가까운 이동으로 이어지고, 전투 픽셀은 경도로 접지 않는다.
const sea=FX.create();FX.follow(sea,{x:179.99,y:0,baseX:179.99,baseY:0,h:0,speed:1,time:0},{len:.2,wid:.06,ref:1.1,type:'galley'});
FX.follow(sea,{x:-179.98,y:0,baseX:-179.98,baseY:0,h:0,speed:1,time:.03},{len:.2,wid:.06,ref:1.1,type:'galley'});assert(sea.trail.length>0&&sea.trail.length<5);
const battle=FX.create({kz:1,spacing:5});FX.step(battle,{x0:0,y0:0,x:200,y:0,h:0,vx:105,vy:0,lat:0,turn:0},{len:120,wid:36,ref:105,type:'galleon'});assert(battle.trail.at(-1).x>140);
console.log('OK: ×0.5/×1/×4·30/60Hz·12초 연속 이동에서 수명/개수 제한·카메라 정지·날짜 변경선·해전 좌표');
