/* 보행 주기 보존·양방향 최단 회전·야영·PNG 좌표의 회귀 검사. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const box = { window: { G: {} } };
vm.createContext(box);
['js/data/seafx.js','js/data/expedition_motion.js','js/art/expedition_motion.js'].forEach(file => vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),box));
const G = box.window.G, E = G.ExpeditionMotion, data = G.EXPEDITION_MOTION;
assert.strictEqual(Object.keys(data.mounts).length, 10);
assert.strictEqual(Object.keys(data.sheets).length, 22);
let total = 0;
for (const sheet of Object.values(data.sheets)) {
  const png = fs.readFileSync(path.join(ROOT,'images',sheet.file));
  assert.strictEqual(png.readUInt32BE(16), sheet.width);
  assert.strictEqual(png.readUInt32BE(20), sheet.height);
  assert.strictEqual(sheet.cells.length, sheet.columns * sheet.rows);
  assert(sheet.admiralReferenceHeight > 0);
  assert(Math.abs(E.scale(sheet, 2) * sheet.admiralReferenceHeight - G.FX.sprites.expedition.admiralHeight * 2) < 1e-9, '모든 시트에서 제독 기준 크기 일치');
  assert(sheet.transparentFraction > 0.25);
  for (const [x,y,w,h,px,py] of sheet.cells) {
    assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x+w <= sheet.width && y+h <= sheet.height);
    assert(px >= 0 && px <= w && py >= 0 && py <= h + 12);
  }
  total += sheet.cells.length;
}
assert.strictEqual(total,424);
for (const id of Object.keys(data.mounts)) {
  const u = { mount:{id}, head:0, phase:0.6, moving:true, t:0, cache:{} };
  const first = E.sample(u);
  assert.strictEqual(first.index,10); // 동쪽, 오른발 내딛기
  u.moving = false; u.t=0.1; u.phase=0;
  assert.strictEqual(E.sample(u).index,first.index,'멈춰도 발을 되감지 않음');
  u.head=Math.PI/2; u.t=0.15;
  let turn=E.sample(u);
  assert.strictEqual(turn.action,'turn');
  assert(turn.heading > 0 && turn.heading < Math.PI/2);
  for (let i=0;i<20;i++) {u.t+=0.05;turn=E.sample(u);}
  assert.strictEqual(turn.action,'walk');
  assert.strictEqual(turn.frame,2,'회전이 끝나도 발의 주기는 유지');
  u.camping=true;u.t=3;
  const camp=E.sample(u);
  assert.strictEqual(camp.action,'camp');
  assert.strictEqual(camp.sheet,data.sheets.common_camp);
  u.camping=false;u.moving=true;u.phase=0.75;u.t=3.1;
  assert.strictEqual(E.sample(u).frame,3);
  for (let dir=0;dir<8;dir++) {
    const s=data.sheets[id==='walk'&&dir===4?'on_foot_front':data.mounts[id].walk];
    const count=s.framesPerDirection;
    const sequence=[];
    for(let phase=0;phase<count;phase++) {
      const sample=E.sample({mount:{id},head:Math.PI/2-dir*Math.PI/4,t:0,phase:phase/count,moving:true,cache:{}});
      assert.strictEqual(sample.frame,phase);
      assert.strictEqual(sample.flip,s.directionRows[dir][1]);
      assert(s.cells[sample.index]);sequence.push(sample.index);
    }
    assert.strictEqual(new Set(sequence).size,count,'8방향 각각 좌우 발 교대');
  }
}
for (const action of ['walk','turn']) {
  const foot=data.sheets[data.mounts.walk[action]], elephant=data.sheets[data.mounts.elephant[action]];
  assert(elephant.bodyHeight*E.scale(elephant,1)>foot.bodyHeight*E.scale(foot,1)*2,'코끼리는 제독 크기를 유지하면서 전체 높이 두 배 이상');
}
for (const sign of [-1,1]) {
  const u={mount:{id:'walk'},head:sign*(Math.PI-0.05),t:0,phase:0.5,moving:true,cache:{}};
  E.sample(u);u.head=-sign*(Math.PI-0.05);u.t=0.01;
  const a=E.sample(u);
  const delta=((a.heading-sign*(Math.PI-0.05)+Math.PI*3)%(Math.PI*2))-Math.PI;
  assert(delta*sign>0 && Math.abs(delta)<0.1,'서쪽 경계에서 짧은 쪽으로 회전');
}
const missing={mount:{id:'unknown'},head:0,t:0};
assert.strictEqual(E.sample(missing),null);
console.log('OK · 10종 · 8방향 보행 · 424 원본 장면 · 제독 공통 크기 · 큰 코끼리 · 정지/회전/야영');
