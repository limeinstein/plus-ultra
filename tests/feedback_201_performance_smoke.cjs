/* 피드백 #201: 항해·해전·일기토의 중복 렌더링 방지 회귀 검사. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const main=read('js/main.js'),duel=read('js/games/duel.js'),ship=read('js/art/ship3d.js'),fx=read('js/data/seafx.js');
for(const [name,src] of [['main',main],['duel',duel],['ship3d',ship],['seafx',fx]]) new vm.Script(src,{filename:name+'.js'});
assert(main.includes('var ok = Math.min(2, s * dpr) * q;'),'빠른 화질을 오버레이에도 적용');
assert(main.includes('Game.pauseScene = function')&&main.includes('!scenePaused && Game.scene'),'전면 장면 중 배경 장면 정지');
assert(duel.includes('G.Game.pauseScene ? G.Game.pauseScene()')&&duel.includes('resumeScene();'),'일기토 시작·종료 때 배경 정지 해제');
assert(duel.includes('1000 / 30')&&duel.includes('now - lastPaint >= duelFrameMs'),'빠른 화질 일기토 30fps');
assert(!ship.includes("spec.sid!=='f0'"),'기함도 3D 캐시 재사용');
assert(ship.includes('var c=drawCfg()')&&ship.includes('fastReuseBudget'),'빠른 화질의 선박 3D 조정');
assert(/reuseBudget:\s*1/.test(fx)&&/fastReuseBudget:\s*0/.test(fx)&&/fastShadows:\s*false/.test(fx),'기본·빠른 화질의 렌더 예산');
console.log('OK · 피드백 #201 성능 회귀 검사');
