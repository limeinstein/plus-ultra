/* 성능 설정과 스크립트 구문. 실제 정지·복귀·캐시는 브라우저 검사에서 확인한다. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
for(const name of ['js/main.js','js/ui/ui.js','js/games/duel.js','js/games/landwar.js','js/art/ship3d.js','js/data/seafx.js'])new vm.Script(fs.readFileSync(path.join(root,name),'utf8'),{filename:name});
const c=vm.createContext({window:{G:{}}});vm.runInContext(fs.readFileSync(path.join(root,'js/data/seafx.js'),'utf8'),c);
const fx=c.window.G.FX;assert.equal(fx.loop.maxFps,60);assert.equal(fx.loop.maxDt,.1);assert.equal(fx.ship3d.supersample,2);assert.equal(fx.ship3d.shadows,true);assert.equal(fx.ship3d.minBuffer,256);assert.equal(fx.ship3d.maxBuffer,1280);
console.log('OK · 그림 해상도·그림자·시간 상한 유지, 화면 갱신 최대 60회');
