/* 실제 항해 명령판: 배속 클릭·단축키·가변 문구·화면 배치·입력 충돌을 검사한다. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/sea-commandbar-dial-20261124');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], report = { layouts: [], speeds: [], states: [] };
  let page;
  try {
    page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      localStorage.clear(); localStorage.setItem('pu.lang','ko'); localStorage.setItem('pu.uiSize','normal');
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => cb.name === 'loop' ? setTimeout(() => raf(cb), 150) : raf(cb);
    });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil:'domcontentloaded', timeout:120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout:120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init();
      const s = G.Game.state = G.State.newGame({ name:'선장',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal' });
      s.settings.res=.35; s.flags.prologue=true; G.State.save=()=>{};
      G.SEA_RISK.pirate=0; G.SEA_RISK.storm=0;
      G.Game.go('sea',{depart:0}); G.Scenes.sea.runtime().paused=true;
    });
    await page.waitForSelector('.sea-command-bridge');
    await page.waitForFunction(() => !G.UI.busy() && !G.Scenes.sea.runtime().busy);
    const bar = '.sea-command-bridge';
    assert.equal(await page.locator(bar+' .sb-wing .btn').count(),10);
    assert.equal(await page.locator(bar+' .speedctl .opt').count(),4);
    assert.equal(await page.locator(bar+' .sb-dial-art').count(),1);
    async function checkSpeed(speed) {
      await page.waitForFunction(k => G.Scenes.sea.runtime().speed === k && document.querySelector('.sb-speed-dial').dataset.selected === String(k),speed);
      const x = await page.locator(bar+' .opt.on').getAttribute('data-speed');
      assert.equal(x,String(speed)); assert.equal(await page.locator(bar+' .opt[aria-pressed="true"]').count(),1);
      report.speeds.push(speed);
    }
    for (const n of [.5,1,2,4]) { await page.locator(bar+' .opt[data-speed="'+n+'"] .sb-speed-value').click(); await checkSpeed(n); }
    for (const [key,n] of [['Backquote',.5],['Digit1',1],['Digit2',2],['Digit3',4]]) { await page.keyboard.press(key); await checkSpeed(n); }
    await page.locator(bar+' .opt[data-speed="1"]').focus(); await page.keyboard.press('Enter'); await checkSpeed(1);
    // 마우스·키보드로 메뉴를 눌렀을 때 뒤의 바다에 침로가 생기지 않는다.
    await page.locator('[data-sea-action="follow"]').click();
    assert.equal(await page.evaluate(() => G.Ctrl.follow()),true);
    assert.match(await page.locator('[data-sea-action="follow"]').innerText(),/따라가기/);
    await page.locator('[data-sea-action="follow"]').click();
    assert.equal(await page.evaluate(() => G.Ctrl.follow()),false);
    assert.match(await page.locator('[data-sea-action="follow"]').innerText(),/따라가기/);
    await page.locator('[data-sea-action="chart"]').focus(); await page.keyboard.press('Enter');
    await page.waitForSelector('.modal-back'); await page.keyboard.press('Escape');
    await page.waitForFunction(() => !G.UI.busy() && !G.Scenes.sea.runtime().busy);
    await page.locator('[data-sea-action="notebook"]').click(); await page.waitForSelector('.notebook-win');
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !G.UI.busy() && !G.Scenes.sea.runtime().busy);
    await page.locator('[data-sea-action="settings"]').click(); await page.waitForSelector('.modal-back');
    assert.match(await page.locator('.modal-back').innerText(),/설정/);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !G.UI.busy() && !G.Scenes.sea.runtime().busy);
    await page.evaluate(() => { const s=G.Game.state,r=G.Scenes.sea.runtime();s.loc.lon=-20;s.loc.lat=38;r.cam.lon=-20;r.cam.lat=38;r.paused=true;r.vel=[0,0];r.path=null;r.target=null; });
    await page.locator('[data-sea-action="pause"]').click();
    await page.waitForFunction(() => !G.Scenes.sea.runtime().paused);
    await page.locator('[data-sea-action="pause"]').click();
    await page.waitForFunction(() => G.Scenes.sea.runtime().paused);
    assert.equal(await page.evaluate(() => !!G.Scenes.sea.runtime().path || !!G.Scenes.sea.runtime().target),false);
    const dialRect=await page.locator('.sb-dial-art').boundingBox();
    await page.mouse.click(dialRect.x+dialRect.width/2,dialRect.y+dialRect.height*156/170);
    assert.equal(await page.evaluate(() => !!G.Scenes.sea.runtime().path || !!G.Scenes.sea.runtime().target),false,'다이얼 축을 눌러도 바다에 침로가 생기지 않음');
    const shoreMessage=await page.evaluate(()=>{
      const toast=G.UI.toast;let message='';
      G.UI.toast=function(t){message=String(t);return toast.apply(this,arguments);};
      try { document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'ㅣ',code:'KeyL',bubbles:true})); }
      finally {G.UI.toast=toast;}
      return message;
    });
    assert.match(shoreMessage,/해안에서 너무/,'한글 입력 상태의 기존 L 단축키 안내 유지');
    // 길이가 바뀌는 입항 문구와 비·따라가기 상태에서도 슬롯은 고정된다.
    const stable = await page.evaluate(() => {
      const r=G.Scenes.sea.runtime(),s=G.Game.state,SEA=G.Scenes.sea;
      // 멈춰 있을 때 그림은 두 번에 한 번, 단추는 그림 여섯 번마다 갱신된다.
      const tick=()=>{r.dayAcc=0;for(let i=0;i<24;i++)SEA.update(.0001);};
      const measure=name=>{tick();const b=document.querySelector('.sea-command-bridge');return {name,rects:[...b.querySelectorAll('.sb-wing .btn')].map(x=>{const a=x.getBoundingClientRect();return [a.x,a.y,a.width,a.height];}),port:b.querySelector('.portbtn').textContent,rain:b.querySelector('[data-sea-action="rain"]').classList.contains('disabled')};};
      const out=[measure('먼바다')],cities=G.CITY_DATA.filter(c=>c&&c.port&&!(c.founded>s.date.y));
      const long=cities.sort((a,b)=>b.name.length-a.name.length)[0], lis=G.CITY_DATA[0];
      [lis,long].forEach(c=>{if(!s.known.includes(c.id))s.known.push(c.id);const d=c.dock||[c.lat,c.lon];s.loc.lat=d[0];s.loc.lon=d[1];out.push(measure(c.name));});
      const rain=G.Rain.raining;G.Rain.raining=()=>true;out.push(measure('비'));G.Rain.raining=rain;
      G.Ctrl.toggle();out.push(measure('따라가기 켬'));G.Ctrl.toggle();out.push(measure('따라가기 끔'));
      s.loc.lon=-20;s.loc.lat=38;r.cam.lon=-20;r.cam.lat=38;
      if(r.vfx)r.vfx.sendoff=null;
      tick();
      return out;
    });
    stable.forEach(x=>assert.deepEqual(x.rects,stable[0].rects,x.name+' 메뉴 위치 고정'));
    assert.match(stable[1].port,/리스본 입항/); assert.equal(stable[3].rain,false); report.states=stable;
    for (const [width,height,size] of [[1600,900,'normal'],[1280,720,'auto'],[960,540,'max'],[800,600,'normal']]) {
      await page.setViewportSize({width,height}); await page.evaluate(s=>G.Game.setUiSize(s),size); await page.waitForTimeout(350);
      const rects=await page.evaluate(()=>{
        const box=e=>{const a=e.getBoundingClientRect();return {x:a.x,y:a.y,right:a.right,bottom:a.bottom,width:a.width,height:a.height};};
        const b=document.querySelector('.sea-command-bridge');
        return {bar:box(b),buttons:[...b.querySelectorAll('.sb-wing .btn')].map(x=>({action:x.dataset.seaAction,box:box(x),overflow:x.scrollWidth>x.clientWidth+1||x.scrollHeight>x.clientHeight+1})),mini:box(document.querySelector('.minimap')),wind:box(document.querySelector('.windbox')),speed:[...b.querySelectorAll('.sb-speed-value')].map(x=>({text:x.textContent,box:box(x)}))};
      });
      assert.ok(rects.bar.x>=0 && rects.bar.right<=width+1 && rects.bar.bottom<=height+1);
      rects.buttons.forEach(x=>{assert.equal(x.overflow,false,width+' '+size+' '+x.action);assert.ok(x.box.x>=rects.bar.x-1&&x.box.right<=rects.bar.right+1);});
      assert.ok(rects.mini.bottom<rects.bar.y,'작은 해도와 하단 메뉴 겹침 없음');
      rects.buttons.forEach(x=>assert.ok(rects.wind.right<=x.box.x||rects.wind.x>=x.box.right||rects.wind.bottom<=x.box.y||rects.wind.y>=x.box.bottom,'바람 판과 실제 명령 단추 겹침 없음'));
      for(const n of [.5,1,2,4]) {await page.locator(bar+' .opt[data-speed="'+n+'"] .sb-speed-value').click();await checkSpeed(n);}
      await page.keyboard.press('Digit1');await checkSpeed(1);
      await page.locator('[data-sea-action="chart"]').hover();
      await page.screenshot({path:path.join(OUT,'sea-'+width+'-'+size+'.png')});
      report.layouts.push({width,height,size,...rects});
      console.log('통과: '+width+'×'+height+' '+size+' — 메뉴·네 배속 클릭·해도·바람 판 배치');
    }
    // 먹구름·폭우가 배경을 어둡게 해도 양피지 바탕과 명령 글자가 남는다.
    await page.setViewportSize({width:1600,height:900});await page.evaluate(()=>{
      G.Game.setUiSize('normal');const r=G.Scenes.sea.runtime();r.storm=1;r.paused=true;
      G.Game.state.rain={lv:2,days:2,order:'work',asked:true,got:0,n:1};
      for(let i=0;i<24;i++){r.dayAcc=0;G.Scenes.sea.update(.0001);}
    });
    await page.waitForTimeout(350);
    assert.equal(await page.locator('[data-sea-action="rain"]').isEnabled(),true);
    assert.equal(await page.locator('[data-sea-action="rain"]').getAttribute('aria-disabled'),'false');
    await page.screenshot({path:path.join(OUT,'sea-storm-1600.png')});
    // 실제 비 대책을 열고 취소해도 항해로 돌아온다.
    await page.locator('[data-sea-action="rain"]').click();await page.waitForSelector('.modal-back');
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.sea.runtime().busy);
    // 뭍 화면에는 새 바다 전용 외관이 번지지 않고, 돌아오면 한 벌만 만들어진다.
    await page.evaluate(()=>G.Game.go('land',{from:0}));await page.waitForSelector('.land-bar');
    assert.equal(await page.locator('.sea-command-bridge').count(),0);
    await page.evaluate(()=>G.Game.go('sea',{fresh:true}));await page.waitForSelector('.sea-command-bridge');
    assert.equal(await page.locator('.sea-command-bridge').count(),1);
    assert.equal(await page.locator('.sea-command-bridge .sb-wing .btn').count(),10);
    assert.deepEqual(errors,[]);report.errors=errors;
    fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
    console.log('통과: 실제 배속·바늘·단축키·해도·수첩·설정·따라가기·가변 문구 위치 고정·콘솔 오류 0');
  } catch(e) {
    if(page){console.error(await page.evaluate(()=>({ui:document.querySelector('#ui').innerText.slice(-1800),busy:G.UI.busy(),seaBusy:G.Scenes.sea.runtime()&&G.Scenes.sea.runtime().busy})).catch(()=>''));await page.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{});}
    throw e;
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
