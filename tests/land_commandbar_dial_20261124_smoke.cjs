/* 실제 육상 명령판: 항해와 같은 장식·배속, 기존 명령, 지형별 가시성과 좁은 화면을 검사한다. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/land-commandbar-dial-20261124');
fs.mkdirSync(OUT, { recursive:true });
(async () => {
  const browser = await chromium.launch({ executablePath:process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
  let page; const errors = [], report = { layouts:[], terrains:[], speeds:[] };
  try {
    page = await browser.newPage({ viewport:{width:1600,height:900} });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if(m.type()==='error')errors.push(m.text()); });
    await page.addInitScript(() => {
      localStorage.clear();localStorage.setItem('pu.lang','ko');localStorage.setItem('pu.uiSize','normal');
      const raf=window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame=cb=>cb.name==='loop'?setTimeout(()=>raf(cb),150):raf(cb);
    });
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
    await page.evaluate(async()=>{
      await G.Game.ensureGeo();G.Nav.init();
      const s=G.Game.state=G.State.newGame({name:'선장',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
      s.settings.res=.35;s.flags.prologue=true;G.State.save=()=>{};
      G.SEA_RISK.pirate=0;G.SEA_RISK.storm=0;
      G.Game.go('land',{from:0});
      window.__landTick=()=>{const r=G.Scenes.land.runtime();r.dayAcc=0;G.Scenes.land.refreshBar();for(let i=0;i<12;i++)G.Scenes.land.update(.0001);};
    });
    const bar='.land-command-bridge';
    await page.waitForSelector(bar);await page.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.land.runtime().busy);
    assert.equal(await page.locator(bar+' .sb-wing > [data-land-action]').count(),10);
    assert.equal(await page.locator(bar+' .sb-speed-dial .opt').count(),4);
    assert.equal(await page.locator(bar+' .sb-dial-art').count(),1);
    async function speed(n){
      await page.waitForFunction(n=>G.Scenes.land.runtime().speed===n&&document.querySelector('.land-speed').dataset.selected===String(n),n);
      assert.equal(await page.locator(bar+' .opt[aria-pressed="true"]').getAttribute('data-speed'),String(n));
      assert.equal(await page.evaluate(()=>G.Game.state.settings.landSpeed),n);report.speeds.push(n);
    }
    for(const n of [.5,1,2,4]){await page.locator(bar+' .opt[data-speed="'+n+'"] .sb-speed-value').click();await speed(n);}
    for(const [key,n]of[['Backquote',.5],['Digit1',1],['Digit2',2],['Digit3',4]]){await page.keyboard.press(key);await speed(n);}
    await page.locator(bar+' .opt[data-speed="1"]').focus();await page.keyboard.press('Enter');await speed(1);
    await page.locator('[data-land-action="follow"]').click();assert.equal(await page.evaluate(()=>G.Ctrl.follow()),true);
    assert.match(await page.locator('[data-land-action="follow"]').innerText(),/따라가기/);
    await page.locator('[data-land-action="follow"]').click();assert.equal(await page.evaluate(()=>G.Ctrl.follow()),false);
    const z0=await page.evaluate(()=>{const c=G.Scenes.land.runtime().cam;c.zoomT=c.zoom;return c.zoomT;});
    await page.locator('[data-land-action="zoomIn"]').click();
    assert.equal(await page.evaluate(()=>G.Scenes.land.runtime().cam.zoomT),z0*1.25);
    await page.locator('[data-land-action="zoomOut"]').focus();await page.keyboard.press('Space');
    assert.ok(Math.abs(await page.evaluate(()=>G.Scenes.land.runtime().cam.zoomT)-z0)<.001);
    assert.equal(await page.evaluate(()=>G.Scenes.land.runtime().paused),true,'메뉴의 Space 입력이 탐험 이동에 새지 않는다');
    for(const action of ['chart','notebook','settings','apostles']){
      await page.locator('[data-land-action="'+action+'"]').click();await page.waitForSelector('.modal-back,.dlg');
      await page.keyboard.press('Escape');await page.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.land.runtime().busy);
    }
    await page.locator('[data-land-action="camp"]').click();await page.waitForSelector('.dlg');
    assert.match(await page.locator('.dlg').innerText(),/야영지/);
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.land.runtime().busy);
    // 버튼 클릭과 다이얼 축을 눌러도 땅에 이동 경로가 생기지 않는다.
    await page.evaluate(()=>{const r=G.Scenes.land.runtime();r.path=null;r.dir=null;r.paused=true;G.Scenes.land.refreshBar();});
    await page.locator('[data-land-action="pause"]').click();await page.waitForFunction(()=>!G.Scenes.land.runtime().paused);
    await page.locator('[data-land-action="pause"]').click();await page.waitForFunction(()=>G.Scenes.land.runtime().paused);
    const dial=await page.locator(bar+' .sb-dial-art').boundingBox();
    await page.mouse.click(dial.x+dial.width/2,dial.y+dial.height*156/170);
    assert.equal(await page.evaluate(()=>!!G.Scenes.land.runtime().path||!!G.Scenes.land.runtime().dir),false);
    await page.locator('[data-land-action="chart"]').focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.landAction),'notebook');
    assert.equal(await page.evaluate(()=>!!G.Scenes.land.runtime().dir),false,'메뉴 방향키가 뒤의 탐험대를 움직이지 않는다');
    for(const [width,height,size]of[[1600,900,'normal'],[1280,720,'auto'],[960,540,'max'],[800,600,'normal']]){
      await page.setViewportSize({width,height});await page.evaluate(s=>G.Game.setUiSize(s),size);await page.waitForTimeout(350);
      await page.mouse.move(width/2,100);await page.evaluate(()=>document.activeElement.blur());
      const layout=await page.evaluate(()=>{
        const box=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
        const b=document.querySelector('.land-command-bridge');
        return{bar:box(b),buttons:[...b.querySelectorAll('.sb-wing .btn')].map(e=>({action:e.dataset.landAction,box:box(e),overflow:e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1,text:e.textContent})),wings:[...b.querySelectorAll('.sb-wing')].map(e=>({box:box(e),background:getComputedStyle(e).backgroundImage})),dial:box(b.querySelector('.sb-speed-dial'))};
      });
      assert.ok(layout.bar.x>=0&&layout.bar.right<=width+1&&layout.bar.bottom<=height+1);
      layout.buttons.forEach(b=>{assert.equal(b.overflow,false,width+' '+size+' '+b.action+' '+b.text);assert.ok(b.box.x>=0&&b.box.right<=width+1);});
      for(let i=0;i<layout.buttons.length;i++)for(let j=i+1;j<layout.buttons.length;j++){
        const a=layout.buttons[i].box,b=layout.buttons[j].box;
        assert.ok(a.right<=b.x+1||b.right<=a.x+1||a.bottom<=b.y+1||b.bottom<=a.y+1,'명령 버튼 겹침 없음');
      }
      assert.ok(layout.wings.every(w=>w.background.includes('rgb(16, 33, 53)')),'반투명이 아닌 짙은 남색 바탕');
      for(const n of [.5,1,2,4]){await page.locator(bar+' .opt[data-speed="'+n+'"] .sb-speed-value').click();await speed(n);}
      await page.keyboard.press('Digit1');await speed(1);
      await page.screenshot({path:path.join(OUT,'land-'+width+'-'+size+'.png')});report.layouts.push({width,height,size,...layout});
      console.log('통과: '+width+'×'+height+' '+size+' — 버튼·네 배속·겹침·글자 넘침 없음');
    }
    await page.setViewportSize({width:1600,height:900});await page.evaluate(()=>G.Game.setUiSize('normal'));
    for(const [name,lon,lat]of[['forest',24,0],['desert',20,24],['snow',25,70]]){
      const terrain=await page.evaluate(({lon,lat})=>{
        const l=G.Game.state.loc,r=G.Scenes.land.runtime(),p=G.Scenes.land.landPoint(lon,lat);
        l.lon=p[0];l.lat=p[1];r.cam.lon=p[0];r.cam.lat=p[1];r.cam.zoom=170;r.cam.zoomT=170;r.paused=true;r.path=null;r.dir=null;window.__landTick();
        return G.Geo.terrain(p[0],p[1]);
      },{lon,lat});await page.waitForTimeout(450);
      await page.screenshot({path:path.join(OUT,'land-'+name+'-1600.png')});report.terrains.push({name,terrain});
    }
    // 도시·배에서 출발한 복귀 문구와 기존 바다 메뉴가 모두 남는다. 배속 선택도 재입장 후 유지된다.
    await page.evaluate(()=>G.Game.go('land',{from:0}));await page.waitForSelector(bar);await page.waitForFunction(()=>!G.UI.busy());
    await page.evaluate(()=>window.__landTick());assert.match(await page.locator('[data-land-action="back"]').innerText(),/도시 복귀/);
    await page.locator(bar+' .opt[data-speed="2"] .sb-speed-value').click();await speed(2);
    const landStyle=await page.locator(bar).evaluate(e=>getComputedStyle(e).getPropertyValue('--sb-paper'));
    await page.evaluate(()=>G.Game.go('sea',{depart:0}));await page.waitForSelector('.sea-command-bridge');
    assert.equal(await page.locator('.sea-command-bridge .sb-wing .btn').count(),10);
    assert.equal(await page.locator('.sea-command-bridge').evaluate(e=>getComputedStyle(e).getPropertyValue('--sb-paper')),landStyle,'항해와 같은 원본 장식');
    await page.evaluate(()=>G.Game.go('land',{landing:{shipLon:-9.2,shipLat:38.7,shipHeading:0,lon:-9.1,lat:38.7}}));await page.waitForSelector(bar);
    await speed(2);await page.evaluate(()=>window.__landTick());assert.match(await page.locator('[data-land-action="back"]').innerText(),/배에 승선/);
    assert.equal(await page.locator('.travel-command-bridge').count(),1);
    assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
    console.log('통과: 기존 명령·다이얼·단축키·확대/축소·세 지형·육상/항해 왕복·콘솔 오류 0');
  }catch(e){if(page){console.error(await page.evaluate(()=>document.querySelector('#ui').innerText.slice(-1400)).catch(()=>''));await page.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{});}throw e;}
  finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
