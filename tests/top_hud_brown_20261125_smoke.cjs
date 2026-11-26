/* 실제 마을·항해·육상 상단: 갈색 황동 틀, 규율 갱신, 화면별 항목, 작은 화면과 긴 값. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/top-hud-brown-20261125');
fs.mkdirSync(OUT,{recursive:true});
const KEYS={
  city:['date','place','lang','lat','lon','fat','discipline','contract','gold','fame','title'],
  sea:['date','lat','lon','days','food','water','crew','fat','discipline','contract'],
  land:['date','lat','lon','days','party','cost','fat','discipline','terr','mount','contract','gold']
};
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=angle', '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  let page;const errors=[],report={layouts:[],values:[]};
  try{
    page=await browser.newPage({viewport:{width:1600,height:900}});
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.addInitScript(()=>{
      localStorage.clear();localStorage.setItem('pu.lang','ko');localStorage.setItem('pu.uiSize','normal');
      const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?setTimeout(()=>raf(cb),150):raf(cb);
    });
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
    await page.evaluate(async()=>{
      await G.Game.ensureGeo();G.Nav.init();
      const s=G.Game.state=G.State.newGame({name:'선장',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
      s.settings.res=.35;s.flags.prologue=true;G.State.save=()=>{};G.SEA_RISK.pirate=0;G.SEA_RISK.storm=0;
      G.UI.say=async()=>{};G.UI.fade=async fn=>fn();G.Scenes.city.findInside=async()=>{};
      window.__hudTick=()=>{
        const name=G.Game.sceneName,scene=G.Game.scene,r=scene.runtime&&scene.runtime();
        if(r){r.paused=true;r.dayAcc=0;for(let i=0;i<64;i++)scene.update(.0001);}
        G.Game.refreshHud();G.UI.fitHud();
      };
    });
    async function enter(scene){
      await page.evaluate(scene=>{
        G.Game.state.fleet.discipline=80;G.Game.state.fleet.fatigue=0;
        G.Game.go(scene,scene==='city'?{cityId:0,load:true}:scene==='sea'?{depart:0}:{from:0});
      },scene);
      await page.waitForFunction(scene=>G.Game.sceneName===scene&&!!document.querySelector('.hud.brown-hud [data-k="discipline"]')&&!G.UI.busy()&&(scene!=='city'||!G.Scenes.city.isBusy()),scene,{timeout:60000});
      await page.evaluate(()=>window.__hudTick());await page.waitForTimeout(150);
    }
    async function keys(scene){assert.deepEqual(await page.locator('.hud .cell').evaluateAll(es=>es.map(e=>e.dataset.k)),KEYS[scene]);}
    for(const scene of ['city','sea','land']){
      await enter(scene);await keys(scene);
      assert.equal(await page.locator('.hud [data-k="fat"] + [data-k="discipline"]').count(),1,'피로 바로 옆 규율');
      const values=await page.evaluate(()=>{
        const out=[],f=G.Game.state.fleet;
        for(const n of [72.6,10,100]){f.discipline=n;G.Game.refreshHud();const c=document.querySelector('.hud [data-k="discipline"]');out.push({n,text:c.querySelector('.tv > span').textContent,warn:c.querySelector('.tv').classList.contains('val-warn')});}
        f.discipline=80;f.fatigue=0;window.__hudTick();
        return out;
      });
      assert.deepEqual(values.map(v=>v.text),['73%','10%','100%']);assert.equal(values[1].warn,true);assert.equal(values[2].warn,false);report.values.push({scene,values});
      await keys(scene); // 공통 갱신과 장면 갱신 뒤에도 삭제한 칸이 다시 생기지 않는다.
      for(const [width,height,size]of[[1600,900,'normal'],[1280,720,'auto'],[960,540,'max'],[800,600,'normal']]){
        await page.setViewportSize({width,height});await page.evaluate(size=>{G.Game.setUiSize(size);window.__hudTick();},size);await page.waitForTimeout(180);
        const layout=await page.evaluate(()=>{
          const b=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
          const h=document.querySelector('.hud'),cs=getComputedStyle(h);
          return{hud:b(h),zoom:cs.zoom,font:cs.getPropertyValue('--hud-font'),frame:getComputedStyle(h,'::before').backgroundImage,
            cells:[...h.querySelectorAll('.cell')].map(e=>({key:e.dataset.k,rect:b(e),text:e.textContent,overflow:e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1,background:getComputedStyle(e).backgroundImage,shadow:getComputedStyle(e).boxShadow}))};
        });
        assert.ok(layout.frame.includes('%2321160e'),'선택한 진한 갈색 바탕');assert.ok(layout.hud.x>=-1&&layout.hud.right<=width+1);
        assert.ok(layout.hud.height<height/6,'상단 상태바 높이 유지 — 화면 위아래 여백은 제외');
        for(const c of layout.cells){assert.equal(c.overflow,false,scene+' '+width+' '+size+' '+c.key+' '+c.text);assert.ok(c.rect.x>=-1&&c.rect.right<=width+1,c.key+' 화면 안');}
        for(let i=1;i<layout.cells.length;i++)assert.ok(layout.cells[i-1].rect.right<=layout.cells[i].rect.x+1,'항목 겹침 없음');
        for(const c of layout.cells.filter(c=>c.key==='date'||c.key==='gold')){assert.equal(c.background,'none');assert.equal(c.shadow,'none');}
        await page.mouse.move(width/2,height/2);await page.screenshot({path:path.join(OUT,scene+'-'+width+'-'+size+'.png')});report.layouts.push({scene,width,height,size,...layout});
        console.log('통과: '+scene+' '+width+'×'+height+' '+size+' — 항목·규율·갈색 프레임·겹침 없음');
      }
      // 큰 소지금·긴 계약 문구·양쪽 자리수 끝값에서도 창 밖으로 나가지 않는다.
      await page.setViewportSize({width:960,height:540});await page.evaluate(()=>{
        G.Game.setUiSize('max');const s=G.Game.state;s.player.gold=9876543210;s.fleet.discipline=100;s.fleet.fatigue=100;G.Game.refreshHud();
        G.UI.hud.set('contract','남은 999일');G.UI.fitHud();
      });await page.waitForTimeout(180);
      const last=await page.locator('.hud .cell').last().boundingBox();assert.ok(last.x+last.width<=961,'긴 값도 화면 안');
      await page.screenshot({path:path.join(OUT,scene+'-long-values.png')});
      await page.evaluate(()=>{G.Game.state.player.gold=3000;G.Game.state.fleet.discipline=80;G.Game.state.fleet.fatigue=0;});
    }
    // 옛 저장의 누락/비정상 규율은 표시를 망치지 않고, 실제 값은 변경하지 않는다.
    const legacy=await page.evaluate(()=>{
      const f=G.Game.state.fleet,keep=f.discipline;delete f.discipline;const missing=G.Game.hud.discipline();const unchanged=!('discipline'in f);
      f.discipline=NaN;const bad=G.Game.hud.discipline();f.discipline=keep;return{missing,bad,unchanged};
    });assert.equal(legacy.missing.text,'80%');assert.equal(legacy.bad.text,'80%');assert.equal(legacy.unchanged,true);
    // 기존 나침반의 지난 소식 창은 그대로 열린다.
    await page.locator('.hud .notice-btn').click();await page.waitForSelector('.modal-back');await page.keyboard.press('Escape');await page.waitForFunction(()=>!G.UI.busy());
    // 세 화면을 다시 방문해도 상태 칸이 중복되지 않는다.
    await page.setViewportSize({width:1600,height:900});await page.evaluate(()=>G.Game.setUiSize('normal'));
    for(const scene of ['city','sea','land']){await enter(scene);await keys(scene);assert.equal(await page.locator('.hud [data-k="discipline"]').count(),1);}
    // 해전의 별도 정보줄에는 새 갈색 틀이 번지지 않는다.
    await page.evaluate(()=>G.UI.hud.show([{k:'title',icon:'cannon',text:'해전'},{k:'me',text:'시험 함대'}]));
    assert.equal(await page.locator('.hud.brown-hud').count(),0);
    assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
    console.log('통과: 실제 규율 변경·위험 표시·날짜/돈 강조 없음·긴 값·옛 저장·지난 소식·장면 왕복·콘솔 오류 0');
  }catch(e){if(page){console.error(await page.evaluate(()=>document.querySelector('.hud').innerText).catch(()=>''));await page.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{});}throw e;}
  finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
