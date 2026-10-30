/* 고정 대형으로 옮겨 붙이는 회귀를 막는다: 실제 위치·발걸음·물가·카메라를 시간에 따라 확인한다. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..'),box={window:{G:{}}};vm.createContext(box);
['js/data/seafx.js','js/art/expedition_formation.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),box));
const G=box.window.G,F=G.ExpeditionFormation;
function run(id='walk',ground){
  const u={pts:[[0,0]],follow:{x:0,y:0,zoom:1},mount:{id,n:20},party:4,moving:true,t:0,cache:{},head:0,phase:0};
  if(ground)u.canStand=(x,y)=>ground(x+u.follow.x-u.pts[0][0],y+u.follow.y-u.pts[0][1]);
  let result=F.follow(u,{heading:0,phase:0},1),maxStep=0;
  return {u,get items(){return result;},get maxStep(){return maxStep;},step(x,y,head,dt=1/60){
    const old=result;u.t+=dt;u.follow.x=x;u.follow.y=y;u.head=head;u.moving=Math.hypot(x-old[0].worldX,y-old[0].worldY)>1e-8;u.phase+=u.moving?dt:0;
    result=F.follow(u,{heading:head,phase:u.phase},1);
    result.slice(1).forEach((it,i)=>{assert(Number.isFinite(it.worldX)&&Number.isFinite(it.heading));const distance=Math.hypot(it.worldX-old[i+1].worldX,it.worldY-old[i+1].worldY);maxStep=Math.max(maxStep,distance);if(ground)assert(ground(it.worldX,it.worldY),'대원은 땅 위에 머문다');});return result;
  }};
}
for(const id of ['walk','porter','horse','camel','donkey','llama','yak','wagon','elephant','reindeer']){
  const r=run(id);for(let f=1;f<=360;f++)r.step(f,0,0);
  const before=r.items.map(it=>({x:it.worldX,y:it.worldY,phase:it.phase}));
  r.step(360,0,Math.PI/2);
  r.items.slice(1).forEach((it,i)=>assert(Math.hypot(it.worldX-before[i+1].x,it.worldY-before[i+1].y)<2,'회전 명령으로 대원을 다른 자리로 옮기지 않음'));
  for(let f=1;f<=360;f++)r.step(360,-f,Math.PI/2);
  assert(r.items.slice(1).every(it=>it.worldY<-100),'선장이 지나간 모퉁이를 따라 돈다 '+id);
  assert(r.maxStep<2,'동료의 이동에 순간 이동 없음 '+id);
  let afterCaptainStop=false;for(let f=0;f<300;f++){r.step(360,-360,Math.PI/2);afterCaptainStop=afterCaptainStop||r.items.some(it=>!it.leader&&it.moving);}
  assert(afterCaptainStop,'선장이 멈춰도 뒤처진 대원이 따라옴');
  const stopped=r.items.map(it=>({x:it.worldX,y:it.worldY,phase:it.phase}));
  for(let f=0;f<60;f++)r.step(360,-360,f/60*Math.PI*2);
  r.items.slice(1).forEach((it,i)=>{assert(Math.hypot(it.worldX-stopped[i+1].x,it.worldY-stopped[i+1].y)<0.01,'정지한 대열을 돌려 세우지 않음');assert.strictEqual(it.phase,stopped[i+1].phase,'서 있는 대원은 발을 굴리지 않음');});
  r.u.follow.zoom=2;r.u.pts=[[500,250]];r.step(360,-360,0);
  r.items.slice(1).forEach((it,i)=>assert(Math.hypot(it.worldX-stopped[i+1].x,it.worldY-stopped[i+1].y)<0.01,'카메라 이동·확대로 대원이 걷지 않음'));
}
const road=(x,y)=>(x<=200&&Math.abs(y)<=14)||(Math.abs(x-200)<=14&&y<=14);
const narrow=run('walk',road);
for(let f=1;f<=240;f++)narrow.step(f*5/6,0,0);
for(let f=1;f<=480;f++)narrow.step(200,-f*5/6,Math.PI/2);
assert(narrow.items.slice(1).every(it=>it.worldY<-100),'좁은 ㄱ자 길에서도 전원이 선장을 따라옴');
assert(narrow.u.cache.formation.width<0.1,'좁은 길에서는 일렬에 가까워짐');
assert(narrow.maxStep<2,'물가에서 옆 자리로 튀지 않음');
const funnel=run('walk',(x,y)=>x<200||Math.abs(y)<=14);
for(let f=1;f<=650;f++){const old=funnel.items.map(i=>i.worldX);funnel.step(f,0,0);funnel.items.slice(1).forEach((it,i)=>assert(it.worldX>=old[i+1]-0.001,'줄을 좁히려고 뒤로 돌아가지 않음'));}
const reverse=run('horse');for(let f=1;f<=240;f++)reverse.step(f,0,0);for(let f=1;f<=360;f++)reverse.step(240-f,0,Math.PI);
assert(reverse.maxStep<2,'급반전에도 각자 돌아서서 따라옴');
assert(reverse.items.slice(1).every(it=>it.worldX<100),'급반전 뒤에도 멈춰 남지 않고 선장을 계속 따라옴');
function endAt(hz){const r=run();for(let i=1;i<=hz*8;i++)r.step(i/hz*60,0,0,1/hz);return r.items;}
const a=endAt(30),b=endAt(60);a.slice(1).forEach((it,i)=>assert(Math.hypot(it.worldX-b[i+1].worldX,it.worldY-b[i+1].worldY)<3,'30/60프레임에서 추종 위치 일치'));
const jump=run();jump.step(900,0,0);assert(jump.items.every(it=>Math.abs(it.worldX-900)<160),'도시 재입장 같은 순간 이동에는 가까이 다시 배치');
const dateLine=run();dateLine.u.follow.wrap=360;dateLine.u.follow.zoom=100;dateLine.step(179.9,0,0);dateLine.step(-179.9,0,0);assert(Math.abs(dateLine.items[0].worldX-180.1)<0.001,'날짜 변경선에서 경도를 이어서 추적');
console.log('통과 — 10종 경로 추종·90도 회전·뒤늦은 정지·제자리 회전·독립 보행·카메라/확대·좁은 ㄱ자 길·급반전·30/60프레임');
