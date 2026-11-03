/* 자택 보관함: 용도·정보 공유, 선택 수량, 한도 초과 시 원자적 거절. */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let chromium;try{({chromium}=require('playwright'));}catch(_){({chromium}=require('../tools/procedural_art/node_modules/playwright-core'));}
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/storage-withdraw-details-20261103');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];try{const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);requestAnimationFrame=cb=>window.__pauseFrames?0:raf(cb);});
await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForFunction(()=>window.G&&G.Info&&G.Scenes.city.B.home&&G.Game.sceneName==='title'&&!document.querySelector('#boot-loader.on'),null,{timeout:120000});
await page.evaluate(()=>{window.__pauseFrames=true;});
const result=await page.evaluate(()=>{
const check=(v,m)=>{if(!v)throw Error(m);},R=G.R,HM=G.Scenes.city.B.home;
G.Game.state=G.State.newGame({name:'보관함 검사',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
const p=G.Game.state.player,plain=(n)=>Array.from({length:n},(_,i)=>({id:'rapier',name:'채운 물건 '+i}));
p.items=plain(39);p.storage=[{id:'compass',qty:10,from:0,paid:480,n:3},{id:'sextant'}];
const compass=p.storage[0],sextant=p.storage[1],before=JSON.stringify([p.items,p.storage]);
check(!HM.takeMany([{it:compass,qty:2},{it:sextant,qty:1}]).ok,'두 칸 필요·한 칸 여유 거절');check(JSON.stringify([p.items,p.storage])===before,'초과 시 양쪽 물건·수량 불변');
check(HM.takeOne(compass,3)&&compass.qty===7&&R.itemCount('compass')===3&&R.slotsUsed()===40,'선택 수량만 꺼냄');
check(HM.takeOne(compass,2)&&compass.qty===5&&R.itemCount('compass')===5&&R.slotsUsed()===40,'가득 차도 같은 일반 물건 한 칸에 합침');
check(R.paidAt(p.items.find(x=>x.id==='compass'),0)===480&&p.items.find(x=>x.id==='compass').n===3,'구매 기록·남은 사용 보존');
const saved=JSON.stringify([p.items,p.storage]);for(const q of [0,-1,1.5,Infinity,NaN,6])check(!HM.takeMany([{it:compass,qty:q}]).ok,'잘못된 수량 거절 '+q);
check(!HM.takeMany([{it:compass,qty:3},{it:compass,qty:3}]).ok,'같은 물건 중복 선택 합산');check(JSON.stringify([p.items,p.storage])===saved,'잘못된 입력에도 물건 불변');
const sword=Object.values(G.RELIC).find(x=>x.kind==='weapon'),book=Object.values(G.RELIC).find(x=>x.kind==='book'),armor=Object.values(G.RELIC).find(x=>x.kind==='armor'),jewel=Object.values(G.RELIC).find(x=>x.kind==='gift');
check(sword&&book&&armor&&jewel,'유물 용도별 자료');p.items=plain(39);const a={id:sword.id,disc:sword.relic,done:true,qty:2,name:'사용자 이름',read:true,buys:{0:900},n:2,legacy:{owner:'선대 제독'}};p.storage=[a];
check(HM.takeOne(a,1)&&a.qty===1,'개별 상태가 있는 유물 일부 꺼내기');const taken=p.items.find(x=>x.id===sword.id);check(taken!==a&&taken.legacy!==a.legacy&&taken.legacy.owner==='선대 제독'&&taken.read&&taken.name===a.name,'부분 이동 메타데이터 복제');
check(!HM.takeOne(a,1)&&a.qty===1,'개별 유물은 같은 ID라도 새 칸 필요');
p.items=[];p.storage=[{id:'compass',qty:3,from:0,paid:480},{id:'compass',qty:4,from:1,paid:400}];const parts=p.storage.slice();R.ITEM_MAX=1;
check(HM.takeMany(parts.map(it=>({it,qty:R.itemQty(it)}))).ok&&p.items.length===1&&R.itemCount('compass')===7,'선택한 새 일반 물건끼리도 한 칸으로 합침');check(!p.storage.length&&R.paidAt(p.items[0],1)===400,'전량 이동·원산지 기록 보존');R.ITEM_MAX=40;
const restored=G.State.deserialize(G.State.serialize());check(restored.player.items.some(x=>x.id==='compass'&&R.itemQty(x)===7),'저장 왕복');
p.items=[];p.storage=[{id:sword.id,disc:sword.relic,done:true},{id:armor.id,disc:armor.relic,done:true},{id:book.id,disc:book.relic,done:true,read:true},{id:jewel.id,disc:jewel.relic,done:true},{id:'compass',qty:8,from:0,paid:480,n:3}];p.equip={weapon:null,armor:null};
window.__storageItems=p.storage.slice();HM._st={cat:'',sort:'base'};HM._storedSt={cat:'',sort:'base'};
return {sword:sword.id,book:book.id,armor:armor.id,jewel:jewel.id,checks:'수량·칸 한도·초과 무변경·중복 선택·유물 상태·구매 기록·저장 왕복 통과'};
});
// 소지품에 있을 때 보인 내용을 기록하고, 같은 물건을 보관함으로 옮겨 실제 DOM 내용을 비교한다.
const expected=await page.evaluate(()=>{const p=G.Game.state.player;p.items=window.__storageItems;p.storage=[];G.Info.open('items');return p.items.map(it=>({id:it.id,name:G.R.itemName(it),detail:G.Info.itemInfo(it)}));});
await page.locator('.items-tbl').waitFor();
const inventoryRows=await page.locator('.items-tbl tr').allTextContents();assert(inventoryRows.some(x=>x.includes('무기'))&&inventoryRows.some(x=>x.includes('서적')));
await page.keyboard.press('Escape');
await page.evaluate(()=>{const p=G.Game.state.player;p.storage=p.items;p.items=[];G.Scenes.city.B.home.storage(G.CITY_DATA[0]);});
await page.locator('.st-s [data-tk]').first().waitFor();
for(const x of expected){const row=page.locator('.st-s tr').filter({has:page.getByText(x.name,{exact:true})});const text=await row.innerText();assert(text.includes(x.detail.kindName));const expectedText=await page.evaluate(html=>{const el=document.createElement('div');el.innerHTML=html;return el.textContent;},x.detail.description);assert(text.replace(/\s/g,'').includes(expectedText.replace(/\s/g,'')),'소지품 설명·값·효과가 보관함과 같다: '+x.name);}
assert(await page.locator('[data-storage-take]').evaluate(el=>el.getBoundingClientRect().bottom<=el.closest('.content').getBoundingClientRect().bottom),'처음부터 꺼내기 단추가 창 안에 보임');
await page.screenshot({path:path.join(out,'storage-details.png')});
await page.locator('[data-storecat="book"]').click();assert.equal(await page.locator('.st-s [data-tk]').count(),1);assert((await page.locator('.st-s').innerText()).includes('읽음'));
await page.locator('[data-storecat=""]').click();
// 공간 부족 시 버튼도 눌러 알림을 확인할 수 있어야 한다.
await page.evaluate(()=>{const p=G.Game.state.player;p.items=Array.from({length:39},(_,i)=>({id:'rapier',name:'칸 채움 '+i}));});
await page.locator('[data-storage-pick="0"]').check();await page.locator('[data-storage-pick="1"]').check();const before=await page.evaluate(()=>JSON.stringify([G.Game.state.player.items,G.R.storage()]));
await page.locator('[data-storage-take]').click();await page.getByText('꺼낼 수 없습니다',{exact:true}).waitFor();assert((await page.locator('.win').last().innerText()).includes('남은 칸은 1칸'));assert.equal(await page.evaluate(()=>JSON.stringify([G.Game.state.player.items,G.R.storage()])),before);
await page.screenshot({path:path.join(out,'capacity-alert.png')});await page.getByRole('button',{name:'확인',exact:true}).last().click();
await page.locator('[data-storage-pick="1"]').uncheck();await page.locator('[data-storage-take]').click();assert.equal(await page.evaluate(()=>G.R.slotsUsed()),40);assert.equal(await page.evaluate(()=>G.R.storage().length),4);
// 40칸이어도 기존 일반 물건에 합칠 수량만 꺼낸다.
await page.evaluate(()=>{const p=G.Game.state.player;p.items[0]={id:'compass',qty:2};});
const compassIndex=await page.evaluate(()=>G.R.storage().findIndex(x=>x.id==='compass'));
await page.locator('[data-storage-qty="'+compassIndex+'"]').fill('3');await page.locator('[data-storage-pick="'+compassIndex+'"]').check();await page.locator('[data-storage-take]').click();assert.deepEqual(await page.evaluate(()=>[G.R.itemCount('compass'),G.R.storage().find(x=>x.id==='compass').qty,G.R.slotsUsed()]),[5,5,40]);
// 한 종류를 버튼으로 꺼낼 때도 수량 선택 창을 거친다.
const singleIndex=await page.evaluate(()=>G.R.storage().findIndex(x=>x.id==='compass'));await page.locator('[data-tk="'+singleIndex+'"]').click();await page.locator('.win .nfield').last().fill('2');await page.getByRole('button',{name:'결정',exact:true}).last().click();assert.deepEqual(await page.evaluate(()=>[G.R.itemCount('compass'),G.R.storage().find(x=>x.id==='compass').qty]),[7,3]);
await page.setViewportSize({width:960,height:720});await page.screenshot({path:path.join(out,'storage-small.png')});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({result,errors},null,2));console.log(result.checks);console.log('통과: 실제 종류 필터·수량 입력·초과 알림·분할 꺼내기·정보 동일·콘솔 오류 0');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
