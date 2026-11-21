/* 항해 수첩 실제 탭·동료 클릭·항해 선택창 한 화면 맞춤을 확인한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core'),ROOT=path.resolve(__dirname,'..'),OUT=process.env.OUT||path.join(ROOT,'artifacts/notebook-choice-fit-20261121');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const errors=[],cases=[];
try{
const page=await browser.newPage({viewport:{width:1600,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);localStorage.setItem('pu.lang','ko');});
await page.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title',null,{timeout:120000});
await page.evaluate(async()=>{G.State.newGame({name:'선장',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});G.Game.setUiSize('normal');G.UI.clearScreen();G.UI.hud.hide();if(G.Loader)G.Loader.hide();await G.Game.ensureGeo();const p=G.Game.state.player;p.look='blackcoat_captain';p.portrait=G.Art.withImg(G.Art.npcSpec('notebook-apply','captain','ib','m'),G.Img.chain.heroPortrait(p));G.Info.open('admiral');});
await page.waitForFunction(()=>document.querySelector('.nb-paper img')?.naturalWidth>2);
async function insideNotebook(){
return page.locator('.notebook-win').evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1&&[...el.querySelectorAll('.tabs .tab')].every(t=>{const r=t.getBoundingClientRect();return r.left>=b.left&&r.right<=b.right&&r.bottom<=b.bottom;});});
}
assert(await insideNotebook());assert.strictEqual(await page.locator('.notebook-win .tab').count(),13);
const tabs=await page.locator('.notebook-win .tab').evaluateAll(els=>els.map(el=>el.dataset.k));
for(const tab of tabs){await page.locator('.tab[data-k="'+tab+'"]').click();await page.waitForTimeout(tab==='map'?600:80);assert(await insideNotebook(),'수첩과 모든 탭이 화면 안에 놓인다: '+tab);assert(await page.locator('.notebook-win > .content').innerText(),'실제 탭 내용 유지: '+tab);if(['admiral','fleet','trade','map'].includes(tab))await page.screenshot({path:path.join(OUT,'notebook-'+tab+'.png')});}
cases.push({name:'양피지 수첩 13개 실제 탭·값·스크롤·전체 탭 노출',passed:true});
await page.locator('.tab[data-k="mates"]').click();await page.waitForTimeout(350);assert.strictEqual(await page.locator('.mb-table .mb-person').count(),await page.evaluate(()=>G.Game.state.mates.length));await page.screenshot({path:path.join(OUT,'notebook-mates-list.png')});
await page.locator('.mb-person').first().click();await page.waitForTimeout(500);assert(await page.locator('.mb-profile').isVisible());assert.strictEqual(await page.locator('.mb-all-skills .mb-tile').count(),17);assert.strictEqual(await page.locator('.mb-all-languages .mb-tile').count(),16);assert((await page.locator('.mb-facts').innerText()).includes('40닢'));
assert(await page.locator('.mb-actions').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('.win').getBoundingClientRect();return a.bottom<=b.bottom&&a.left>=b.left&&a.right<=b.right;}));await page.screenshot({path:path.join(OUT,'notebook-mate-detail.png')});
await page.locator('.mb-list-button').click();assert(await page.locator('.mb-table').isVisible());cases.push({name:'전체 동료 이름 클릭→개별 항해사 상세→전체 목록 복귀·17특기·16언어·기존월급',passed:true});
await page.evaluate(()=>G.Game.setUiSize('max'));assert(await insideNotebook());await page.locator('.mb-person').first().click();await page.waitForTimeout(300);
assert(await page.locator('.mb-actions').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('.win').getBoundingClientRect();return a.bottom<=b.bottom&&a.top>=b.top&&a.right<=b.right;}),'최대 배율의 개별 항해사 동작도 화면 안에 남긴다');
await page.screenshot({path:path.join(OUT,'notebook-mate-detail-large.png')});await page.locator('.win .x').click();cases.push({name:'최대 배율·개별 항해사 상세·동작 단추 고정',passed:true});
if(process.env.NOTEBOOK_ONLY==='1'){assert.deepStrictEqual(errors,[]);fs.writeFileSync(path.join(OUT,'report-notebook-only.json'),JSON.stringify({cases,errors},null,2));console.log(JSON.stringify({cases,errors}));return;}
await page.setViewportSize({width:1280,height:720});await page.evaluate(()=>{G.Game.state.settings.res=.35;G.Game.go('sea',{depart:0});});await page.waitForFunction(()=>G.Game.sceneName==='sea'&&G.Scenes.sea.runtime());await page.evaluate(()=>{if(G.Loader)G.Loader.hide();for(let i=0;i<8;i++)G.Scenes.sea.update(0);});
await page.evaluate(()=>{window.flowDone=false;G.Scenes.sea.encounterForTest({kind:'pirate',n:3,spd:.8,zone:0},false).then(()=>flowDone=true);});
await page.waitForSelector('.chart-question .askrow button');await page.waitForTimeout(450);
async function metrics(){return page.evaluate(()=>{const box=document.querySelector('.dlg'),b=box.getBoundingClientRect(),body=box.querySelector('.body'),c=body.querySelector('.dialog-content'),copy=box.querySelector('.dialog-copy'),row=box.querySelector('.askrow'),r=row.getBoundingClientRect();return{inside:b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,contentFits:c.scrollHeight<=c.clientHeight+1,text:box.querySelector('.dialog-speech').textContent,copyScroll:copy.scrollHeight>copy.clientHeight+1,rowScroll:row.scrollHeight>row.clientHeight+1,buttons:[...row.querySelectorAll('button')].map(el=>{const a=el.getBoundingClientRect();return a.top>=r.top-1&&a.bottom<=r.bottom+1&&a.left>=r.left-1&&a.right<=r.right+1;}),page:box.dataset.page,next:!!box.querySelector('.dialog-next'),height:box.offsetHeight};});}
let m=await metrics();assert(m.inside&&m.contentFits&&!m.next&&!m.rowScroll&&m.buttons.every(Boolean),JSON.stringify(m));await page.screenshot({path:path.join(OUT,'sea-real-pirate-choice.png')});await page.keyboard.press('Escape');await page.waitForFunction(()=>flowDone);cases.push({name:'실제 항해 해적 조우·질문과 모든 선택지 한 창·쪽 넘기기 없음',...m,passed:true});
async function askCase(name,text,count,font,size,shot){
await page.evaluate(({text,count,font,size})=>{G.Game.setUiSize(size);window.choiceDone=false;window.choiceResult=null;G.UI.ask(text,Array.from({length:count},(_,i)=>({label:'선택 '+(i+1)+' — 식량과 항로를 살펴 결정한다',value:i,dis:i===1})),Object.assign({},G.Scenes.mateSpeaker('first'),{raw:true,lang:3})).then(v=>{choiceResult=v;choiceDone=true;});if(font)document.querySelector('.dlg .body').style.fontSize=font+'px';},{text,count,font,size});
await page.waitForTimeout(450);const a=await metrics();assert(a.inside&&a.contentFits&&!a.next&&a.page==='1',name+JSON.stringify(a));assert.strictEqual(a.text.replace(/\s+/g,''),text.replace(/\s+/g,''),'질문 전체 글 보존');
assert(!a.rowScroll&&a.buttons.every(Boolean),'모든 선택지가 같은 창에 보인다: '+name+JSON.stringify(a));
assert(await page.locator('.dlg-actor.bust').evaluateAll(els=>els.every(el=>el.offsetHeight>=80)),'선택지가 많아도 얼굴상이 너무 작아지지 않는다');
await page.locator('.askrow button').nth(1).evaluate(el=>el.click());assert(!(await page.evaluate(()=>choiceDone)),'비활성 선택지 유지');
if(shot)await page.screenshot({path:path.join(OUT,shot)});
await page.locator('.askrow button').last().click();await page.waitForFunction(()=>choiceDone);assert.strictEqual(await page.evaluate(()=>choiceResult),count-1);cases.push({name,...a,passed:true});
}
await askCase('항해 12개 긴 선택지·긴 질문·최대 배율','제독, 다음 항구까지 식량과 식수가 충분한지 살펴야 합니다. 바람과 암초를 확인하고 항로를 골라 주십시오. '.repeat(4),12,0,'max','sea-many-choices.png');
await askCase('글씨 30px·선택지 9개·항해 한 화면 맞춤','식량과 선원들의 건강, 다음 항구까지의 거리를 함께 살펴 결정하십시오. '.repeat(6),9,30,'max','sea-large-font.png');
await askCase('아주 긴 글·20개 선택지·본문만 같은 창 안에서 스크롤','거친 해류와 낯선 해안의 암초를 피하며 동료들과 다음 항구를 정합니다. '.repeat(35),20,0,'max','sea-long-scroll.png');
await askCase('명시적 쪽 나눔도 질문 한 창으로 합침','첫 항구의 소식을 전합니다.\f다음 항로를 고르십시오.',3,0,'normal');
await page.evaluate(()=>{window.choiceDone=false;G.UI.ask('환율과 선원의 상태를 확인합니다. (금화 1,000닢)',[{label:'계속한다',value:true},{label:'그만둔다',value:false}],G.Scenes.mateSpeaker('first')).then(()=>choiceDone=true);});await page.waitForTimeout(400);m=await metrics();assert(m.inside&&m.contentFits&&!m.next&&await page.locator('.ask-note').isVisible(),'안내도 같은 창에 표시');await page.locator('.askrow button').last().click();await page.waitForFunction(()=>choiceDone);cases.push({name:'금화 안내와 선택지를 함께 표시',passed:true});
assert.deepStrictEqual(errors,[]);fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({cases,errors},null,2));console.log(JSON.stringify({cases,errors},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
