/* 새 괴물 자료가 게임과 도감에서 함께 등록되고 실제 그림을 읽는지 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=process.env.OUT||path.join(root,'artifacts/creature-catalog-release');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const errors=[];
try{
 const p=await browser.newPage({viewport:{width:1100,height:800}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
 await p.goto((process.env.WEB_BASE?new URL('catalog.html',process.env.WEB_BASE).href:pathToFileURL(path.join(root,'catalog.html')).href)+'?view=assets#discoveries');
 await p.waitForFunction(()=>window.G&&G.CREATURE_ART&&G.DISC&&G.Img,null,{timeout:120000});
 const data=await p.evaluate(async()=>{const ids=['lich','werewolf','deadknight','worldtree'];for(const id of ids)if(!G.DISC[id])throw Error('도감 발견물 누락 '+id);
 const keys=[...new Set([...Object.values(G.CREATURE_ART.duel),...Object.values(G.CREATURE_ART.land)])];if(keys.length!==36)throw Error('괴물 그림 36종');for(const key of keys){const im=await G.Img.load(key);if(!im||!im.naturalWidth)throw Error('도감 그림 누락 '+key);}
 if(!G.CREATURE_RELICS.every(r=>Object.values(G.RELIC).some(x=>x.id===r[1])))throw Error('도감 유물 누락');
 return {ids,images:keys.length,discoveries:G.DISCOVERIES.length,relics:G.DISC_RELICS.length,items:G.ITEMS.length};});
 await p.locator('#q').fill('세계수');const card=p.locator('#grid .card').filter({hasText:'세계수 이그드라실'});await card.first().click();assert((await p.locator('#detail').innerText()).includes('이그드라실'));await p.screenshot({path:path.join(out,'worldtree-catalog.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...data,errors},null,2));console.log(JSON.stringify({...data,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
