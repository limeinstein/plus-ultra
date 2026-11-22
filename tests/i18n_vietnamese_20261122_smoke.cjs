/* 베트남어 인물 생애·해적여제 서장·네 주인공 선택을 실제 게임 코드에서 확인한다.
   node tests/i18n_vietnamese_20261122_smoke.cjs
   대용량 다른 언어 사전만 뺀 임시 HTML로 같은 게임·도감 코드를 연다. 브라우저는 항상 닫는다. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'artifacts/i18n-vi-followup-20261122');
fs.mkdirSync(out, {recursive:true});
fs.mkdirSync(path.join(root,'tmp'), {recursive:true});
// 다른 언어의 대용량 사전만 빼고 같은 게임·도감 코드를 검사한다.
for(const [source,target] of [['index.html','vi-focused-index.html'],['catalog.html','vi-focused-catalog.html']]){
  const html=fs.readFileSync(path.join(root,source),'utf8')
    .replace('<head>','<head><base href="'+pathToFileURL(root+path.sep).href+'">')
    .replace(/<script src="js\/lang\/(?!vi\.js)[^"]+"><\/script>\s*/g,'');
  fs.writeFileSync(path.join(root,'tmp',target),html);
}
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    const ctx = await browser.newContext({viewport:{width:1280,height:900},locale:'vi-VN'});
    await ctx.addInitScript(() => localStorage.setItem('pu.lang','vi'));
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => {if(m.type()==='error')errors.push(m.text());});
    console.log('베트남어 게임 열기');
    await p.goto(pathToFileURL(path.join(root,'tmp/vi-focused-index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
    await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!document.querySelector('#boot-loader.on'),null,{timeout:120000});
    const source = fs.readFileSync(path.join(root,'tools/i18n/vi/catalog_bios.tsv'),'utf8').trim().split(/\r?\n/).map(l=>l.split('\t'));
    const opening = fs.readFileSync(path.join(root,'tools/i18n/vi/story_jhook_opening_20261122.tsv'),'utf8').trim().split(/\r?\n/).map(l=>l.split('\t'));
    const data = await p.evaluate(({rows,opening})=>{
      const I=G.I18N, changed=rows.filter(([ko,vi])=>I.tr(ko,true)!==vi);
      const bios=Object.entries(G.BIOS).map(([name,ko])=>({name,ko,tr:I.tr(ko,true)}));
      const missingBios=bios.filter(b=>!b.tr||/[가-힣]/.test(b.tr));
      const missingStory=[];
      for(const m of G.StorySelect.list())for(const key of ['hero','title','sub','tag','synopsis','party','year'])if(m[key]&&/[가-힣]/.test(m[key])&&!I.tr(m[key],true))missingStory.push({id:m.id,key,ko:m[key]});
      const scenes=Object.entries(G.JHOOK.prologue);
      const lines=scenes.flatMap(([scene,list])=>list.map((row,index)=>({scene,index,text:row[1]})));
      const pages=lines.flatMap(row=>row.text.split('\f').map(ko=>({...row,ko,tr:I.tx(ko)})));
      const missingPrologue=pages.filter(row=>/[가-힣]/.test(row.tr));
      const targets=new Set(opening.map(row=>I.norm(row[0]))),found=new Set(),openingScenes=[];
      function walk(value,path){
        if(!value||typeof value!=='object')return;
        if(Array.isArray(value)&&value.length&&value.every(row=>Array.isArray(row)&&typeof row[0]==='string'&&typeof row[1]==='string')){
          const parts=value.flatMap(row=>row[1].split('\f')).filter(ko=>targets.has(I.norm(ko)));
          if(parts.length){for(const ko of parts){found.add(I.norm(ko));if(/[가-힣]/.test(I.tx(ko)))throw Error('서장 대사 미번역 '+ko);}openingScenes.push({path,pages:parts.length});}
        }else for(const [key,child]of Object.entries(value))walk(child,path+'.'+key);
      }
      walk(G.JHOOK,'JHOOK');
      return {sourceRows:rows.length,sourceMismatches:changed.length,loadedBios:bios.length,missingBios,missingStory,prologueScenes:scenes.length,prologueLines:lines.length,prologuePages:pages.length,missingPrologue,openingSourceRows:opening.length,openingRuntimeCovered:found.size,openingScenes};
    },{rows:source,opening});
    fs.writeFileSync(path.join(out,'data-probe.json'),JSON.stringify(data,null,2)+'\n');
    if(data.missingBios.length)console.log(JSON.stringify({missingBios:data.missingBios}));
    assert.equal(data.sourceMismatches,0);
    assert.equal(data.missingBios.length,0);
    assert.deepEqual(data.missingPrologue,[]);
    assert.equal(data.openingRuntimeCovered,data.openingSourceRows);
    console.log('인물 원문 검사',data.sourceRows,data.loadedBios);
    const people=['크리스토발 콜론','레오나르도 다 빈치','이순신','황진이','응우옌 빈 키엠'];
    const dialogs=[];
    for(let i=0;i<people.length;i++){
      await p.evaluate(name=>{G.Bio.show(name);},people[i]);
      await p.waitForSelector('.biobox .bio-text p');
      await p.waitForFunction(()=>!/[가-힣]/.test(document.querySelector('.biobox .bio-text p').textContent));
      const text=await p.locator('.biobox .bio-text').textContent();
      assert(!/[가-힣]/.test(text),people[i]+' 대사창');
      dialogs.push({name:people[i],translated:true});
      console.log('이야기 창',people[i]);
      if(i===0||i===4)await p.screenshot({path:path.join(out,'bio-'+i+'.png')});
      await p.keyboard.press('Escape');
      await p.waitForSelector('.biobox',{state:'detached'});
    }
    await p.evaluate(()=>{window.__viSay=G.UI.say(G.JHOOK.prologue.pro[0][1].split('\f')[0],{});});
    await p.waitForSelector('.dialog-speech');
    await p.waitForFunction(()=>{const el=document.querySelector('.dialog-speech');return el&&/1534/.test(el.textContent)&&!/[가-힣]/.test(el.textContent);});
    await p.screenshot({path:path.join(out,'story-opening.png')});
    await p.keyboard.press('Escape');
    await p.evaluate(()=>window.__viSay);
    await p.evaluate(()=>{G.StorySelect.open();});
    await p.waitForSelector('.ss-stage');
    console.log('이야기 선택 열기');
    const ids=await p.locator('.ss-card').evaluateAll(cards=>cards.map(c=>c.dataset.story));
    const storyScreens=[];
    for(const id of ids){
      await p.locator('.ss-card[data-story="'+id+'"]').click();
      await p.waitForSelector('.ss-info:not([hidden])');
      await p.evaluate(()=>G.I18N.sweep(document.querySelector('.ss-stage')));
      const text=await p.locator('.ss-info').innerText();
      const missing=text.split('\n').filter(t=>/[가-힣]/.test(t));
      storyScreens.push({id,missing});
      console.log('주인공',id,missing.length);
      await p.screenshot({path:path.join(out,'story-'+id+'.png')});
    }
    await p.keyboard.press('Escape');
    await p.goto(pathToFileURL(path.join(root,'tmp/vi-focused-catalog.html')).href+'?view=assets#people',{waitUntil:'domcontentloaded'});
    await p.waitForSelector('.card[data-uid^="people:"]');
    const index=await p.evaluate(()=>G.MATES.findIndex(m=>m.name==='응우옌 빈 키엠'));
    assert(index>=0);
    await p.locator('.card[data-uid="people:'+index+'"]').click();
    await p.waitForSelector('#detail[open] .d-text');
    const catalogText=await p.locator('#dBody .d-text').first().innerText();
    assert(catalogText.includes('Trạng Trình'));
    assert(!/[가-힣]/.test(catalogText));
    await p.screenshot({path:path.join(out,'catalog-nguyen.png')});
    const report={...data,dialogs,storyScreens,catalogBiography:true,errors};
    fs.writeFileSync(path.join(out,'focused.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
    assert.deepEqual(errors,[]);
    assert.deepEqual(data.missingStory,[]);assert(storyScreens.every(s=>s.missing.length===0));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
