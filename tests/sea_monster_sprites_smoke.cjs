/* 실제 PNG/WebP와 file:// 미리보기, 잠수 끝 상태, 8방향 표본을 검사한다. */
'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const sharp = require('sharp');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname,'..');
async function run() {
  const atlas = JSON.parse(fs.readFileSync(path.join(ROOT,'images/sea-monsters/atlas.json'),'utf8'));
  const expectedIds=['kraken','giant-octopus','sea-serpent','sea-dragon','man-eating-shark','ghost-ship',
    'isonade','bakunawa','zaratan','leviathan','jormungandr','cipactli'];
  assert.deepEqual(atlas.monsters.map(m=>m.id).sort(),expectedIds.slice().sort());assert.equal(atlas.cell,224);
  for(const monster of atlas.monsters) {
    for(const file of [monster.png,monster.webp]) {
      const m=await sharp(path.join(ROOT,file)).metadata();
      assert.equal(m.width,1792);assert.equal(m.height,1344);assert(m.hasAlpha,file);
    }
    const {data,info}=await sharp(path.join(ROOT,monster.webp)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    for(let row=0;row<6;row++)for(let col=0;col<8;col++) {
      let visible=0;
      for(let y=0;y<224;y++)for(let x=0;x<224;x++) {
        const alpha=data[((row*224+y)*info.width+col*224+x)*4+3];
        if(alpha>32)visible++;
        if(x<10||x>=214||y<10||y>=214) assert.equal(alpha,0,monster.id+'의 칸 경계 침범');
      }
      assert(visible>80,monster.id+'의 빈 칸 '+row+','+col);
    }
  }
  const executablePath=process.env.BROWSER_EXE || (process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
  const browser=await chromium.launch({executablePath,args:['--use-gl=swiftshader','--no-sandbox','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width:1180,height:1040},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT,'test_sea_monster_sprites.html')).href);
    await page.waitForFunction(()=>window.MONSTER_PREVIEW&&MONSTER_PREVIEW.ready,null,{timeout:60000});
    await page.locator('#paused').check();
    const result=await page.evaluate(()=>{
      var ids=Object.keys(G.SEA_MONSTER_ART),layout=G.SEA_MONSTER_LAYOUT;
      var canvas=document.createElement('canvas');canvas.width=canvas.height=224;var ctx=canvas.getContext('2d'),draws=0;
      ids.forEach(function(id){
        for(var d=0;d<8;d++)layout.states.forEach(function(state){
          if(!G.SeaMonsterSprite.draw(ctx,112,139,d*Math.PI/4,158,{type:id,state:state,elapsed:.3},0))throw Error('그림 누락');draws++;
        });
        if(G.SeaMonsterSprite.sample(id,0,'dive',100).row!==4)throw Error('잠수 끝에 몸이 다시 나타남');
        if(G.SeaMonsterSprite.sample(id,0,'emerge',100).row!==0)throw Error('재등장 끝에 수면으로 돌아오지 않음');
        if(G.SeaMonsterSprite.sample(id,-Math.PI/4,'idle',0).dir!==7)throw Error('음수 방위 오류');
      });
      var calls=[],draw=ctx.drawImage.bind(ctx);ctx.drawImage=function(){calls.push(Array.from(arguments).slice(1,5));return draw.apply(null,arguments);};
      G.SeaMonsterSprite.draw(ctx,112,139,Math.PI/4,158,{type:ids[0],state:'submerged'},0);
      return {draws:draws,source:calls[0],shipCell:G.SHIP_ART.baochuan.cell,anchor:layout.anchor};
    });
    assert.equal(result.draws,expectedIds.length*48);assert.deepEqual(result.source,[224,896,224,224]);
    assert.equal(result.shipCell,224);assert.deepEqual(result.anchor,[112,139]);
    await page.locator('[data-state="idle"]').click();
    await page.screenshot({path:path.join(ROOT,'docs/art/sea-monsters-preview.png'),fullPage:true});
    for(const state of ['attack','dive','submerged','emerge']) {
      await page.locator('[data-state="'+state+'"]').click();
      await page.waitForFunction(state=>MONSTER_PREVIEW.mode===state,state);
    }
    await page.locator('#direction').selectOption('7');
    await page.waitForFunction(()=>MONSTER_PREVIEW.direction===7);
    await page.locator('[data-state="submerged"]').click();
    await page.waitForFunction(()=>MONSTER_PREVIEW.state==='submerged');
    await page.screenshot({path:path.join(ROOT,'docs/art/sea-monsters-submerged.png'),fullPage:true});
    // 게임 진입점에서도 두 파일과 그림 목록이 읽히는지 확인한다.
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
    await page.waitForFunction(()=>window.G&&G.Game&&G.SeaMonsterSprite&&G.SEA_MONSTER_ART,null,{timeout:60000});
    const registered=await page.evaluate(()=>Object.keys(G.SEA_MONSTER_ART).every(id=>G.Img.has(G.SEA_MONSTER_ART[id].key)));
    assert(registered,'게임 그림 목록 등록');assert.deepEqual(errors,[]);
    console.log('OK · '+expectedIds.length+'종 '+result.draws+'칸 · 투명 경계 · 보선 규격 · 잠수/재등장 끝 상태 · 실제 file:// 화면 · 콘솔 오류 0');
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
