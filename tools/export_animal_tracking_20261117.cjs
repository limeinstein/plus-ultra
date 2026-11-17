/* 게임 렌더러가 만든 투명 동물 PNG와 실제 걸음 배열을 내보낸다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('./procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/animal-tracking-20261117');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox']});
try{const page=await browser.newPage();await page.goto(pathToFileURL(path.join(out,'gallery.html')).href);await page.waitForFunction(()=>document.querySelectorAll('.card').length===261);const data=await page.evaluate(()=>Object.keys(G.ANIMAL_TRACKING).map(id=>{const p=G.AnimalTracking.profile({id}),track=document.createElement('canvas');track.width=256;track.height=64;G.AnimalTracking.drawTrail(track.getContext('2d'),{id},Array.from({length:8},(_,i)=>({lon:i,lat:0,ground:true})),(lon,lat)=>[18+lon*31,40-lat*31],1.4);return{id,kind:p.kind,trace:G.AnimalTracking.traceKind({id}),palette:p.palette,animal:G.AnimalTracking.sprite({id},false).toDataURL('image/png'),trail:track.toDataURL('image/png')};}));
for(const folder of ['animals','trails'])fs.mkdirSync(path.join(out,'png',folder),{recursive:true});
for(const d of data){fs.writeFileSync(path.join(out,'png/animals',d.id+'.png'),Buffer.from(d.animal.split(',')[1],'base64'));fs.writeFileSync(path.join(out,'png/trails',d.id+'.png'),Buffer.from(d.trail.split(',')[1],'base64'));}
fs.writeFileSync(path.join(out,'png/species.json'),JSON.stringify(data.map(({id,kind,trace,palette})=>({id,kind,trace,palette})),null,2));fs.writeFileSync(path.join(out,'png/읽어주세요.txt'),'동물 발견물 261종\nanimals: 종별 2~4색 투명 PNG 96×96\ntrails: 종별 발자국·낙하 깃털·거품·물결·물보라 투명 PNG 256×64\nspecies.json: 게임 ID·이동 방식·상징색\n게임 적용 시 동물 그림 전체 투명도를 0.16~0.58 사이에서 3.6초 주기로 조절하면 점멸합니다.\n원화 제작: 내장 image_gen. 게임 렌더러의 색면·배치 결과를 내보냈습니다.\n');console.log('동물 PNG 261장·이동 흔적 PNG 261장 내보내기 완료');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
