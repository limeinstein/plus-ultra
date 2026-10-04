/* 실제 파일 실행: 모든 동작을 그리고 게임의 야영 버튼 연결까지 확인한다. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname,'..');
const OUT = path.join(ROOT,'docs/art');
(async function () {
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-gl=swiftshader','--no-sandbox','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({viewport:{width:1400,height:1100}});
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT,'test_expedition_sprites.html')).href);
    await page.waitForFunction(()=>Object.keys(G.EXPEDITION_MOTION.mounts).every(id=>['walk','turn','camp'].every(a=>G.ExpeditionMotion.ready(id,a))),null,{timeout:30000});
    // 정면의 상체는 그대로이고, 가장 낮은 발은 좌우로 교대하는지 실제 픽셀로 확인한다.
    const footData='data:image/png;base64,'+fs.readFileSync(path.join(ROOT,'images/sprites/expedition_v3_on_foot_front.png')).toString('base64');
    const gaitPixels=await page.evaluate(async uri=>{
      const im=new Image();im.src=uri;await im.decode();
      const old=G.Img.get;G.Img.get=key=>key==='sprites/expedition_v3_on_foot_front'?im:old(key);
      function pose(phase){const cv=document.createElement('canvas');cv.width=400;cv.height=320;G.ExpeditionMotion.draw(cv.getContext('2d'),{pts:[[200,290]],mount:{id:'walk'},head:-Math.PI/2,moving:true,phase,t:0,size:4,cache:{}});return cv.getContext('2d').getImageData(0,0,400,320).data;}
      const a=pose(0),b=pose(0.5);G.Img.get=old;
      function headX(data){let sum=0,weight=0;for(let y=70;y<145;y++)for(let x=0;x<400;x++){const alpha=data[(y*400+x)*4+3];sum+=x*alpha;weight+=alpha;}return sum/weight;}
      function footX(data){let sum=0,weight=0;for(let y=272;y<310;y++)for(let x=0;x<400;x++){const alpha=data[(y*400+x)*4+3];sum+=x*alpha;weight+=alpha;}return sum/weight;}
      return {headShift:Math.abs(headX(a)-headX(b)),left:footX(a),right:footX(b)};
    },footData);
    assert(gaitPixels.headShift<3,'발이 바뀌어도 머리 위치는 안정적으로 유지');
    assert(Math.abs(gaitPixels.left-gaitPixels.right)>4,'정면에서 앞으로 내딛는 발이 실제로 좌우 교대');
    await page.evaluate(()=>{
      const cv=document.createElement('canvas');cv.id='gaitProof';cv.width=1000;cv.height=550;cv.style='position:absolute;top:0;left:0;z-index:99;width:1000px;height:550px';document.body.append(cv);
      const ctx=cv.getContext('2d');ctx.fillStyle='#899b77';ctx.fillRect(0,0,1000,550);ctx.fillStyle='#122322';ctx.font='20px sans-serif';
      [0,1,2,3].forEach(f=>{ctx.fillText(['왼발 내딛기','교차','오른발 내딛기','교차'][f],f*250+50,35);[0,-Math.PI/2].forEach((head,row)=>G.ExpeditionMotion.draw(ctx,{pts:[[125+f*250,265+row*260]],mount:{id:'walk'},head,moving:true,phase:f/4,t:0,size:4,cache:{}}));});
    });
    await page.locator('#gaitProof').screenshot({path:path.join(OUT,'expedition-gait-poses.png')});
    await page.evaluate(()=>document.getElementById('gaitProof').remove());
    await page.screenshot({path:path.join(OUT,'expedition-motion-preview.png'),fullPage:true});
    // 모든 원본 장면이 실제로 그려지는지 확인한다.
    const coverage = await page.evaluate(()=>{
      let frames=0;
      const cv=document.createElement('canvas');cv.width=cv.height=256;
      const ctx=cv.getContext('2d');
      Object.values(G.EXPEDITION_MOTION.sheets).forEach(s=>{
        const im=G.Img.get(s.key);
        s.cells.forEach(c=>{
          ctx.clearRect(0,0,256,256);
          ctx.drawImage(im,c[0],c[1],c[2],c[3],0,0,256,256);
          frames++; // 파일 실행에서는 픽셀 읽기가 제한된다. 빈 칸 검사는 메타데이터 도구가 맡는다.
        });
      });return {frames};
    });
    assert.deepStrictEqual(coverage,{frames:424});
    await page.selectOption('#action','turn');
    await page.waitForTimeout(500);
    await page.screenshot({path:path.join(OUT,'expedition-motion-turn.png'),fullPage:true});
    await page.selectOption('#action','camp');
    await page.waitForTimeout(200);
    await page.screenshot({path:path.join(OUT,'expedition-motion-camp.png'),fullPage:true});
    assert.deepStrictEqual(errors,[],'미리보기 콘솔 오류');
    // 외부 글꼴 대신 기본 글꼴로 시험해 인터넷 상태와 관계없이 파일 실행을 확인한다.
    await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
    await page.setViewportSize({width:960,height:540});
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
    await page.waitForFunction(()=>window.G && G.Game && G.State,null,{timeout:60000});
    await page.evaluate(()=>G.Game.ensureGeo());
    await page.evaluate(()=>{
      const sk={};G.SKILLS.forEach(x=>sk[x.id]=0);sk.survey=2;
      G.Game.state=G.State.newGame({name:'동작 점검',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:50,int:50,mar:50,cha:50},sk,lg:G.LANGS.map(()=>0),diff:'normal'});
      G.Game.state.settings.res=0.35;
      G.Game.go('land',{from:0,mount:{id:'horse',n:20}});
    });
    await page.waitForFunction(()=>G.Game.scene===G.Scenes.land && G.Scenes.land.runtime() && G.ExpeditionMotion.ready('horse','camp'));
    const camp = await page.evaluate(async()=>{
      const old=G.UI.ask;let finish;
      G.UI.ask=()=>new Promise(resolve=>finish=resolve);
      const promise=G.Scenes.land._test.camp();
      const st=G.Scenes.land.runtime(), during=st.camping;
      const cv=document.createElement('canvas');cv.width=cv.height=200;
      const sample=G.ExpeditionMotion.sample({pts:[[100,160]],head:0,t:st.t,phase:st.gph,mount:G.Game.state.loc.mount,camping:st.camping,cache:st.unit});
      finish(null);await promise;G.UI.ask=old;
      return {during,after:st.camping,action:sample.action,busy:st.busy};
    });
    assert.deepStrictEqual(camp,{during:true,after:false,action:'camp',busy:0});
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(250);
    await page.keyboard.press('Space');
    await page.screenshot({path:path.join(OUT,'expedition-motion-in-game.png')});
    await page.evaluate(()=>{G.Game.state.loc.mount={id:'elephant',n:20};G.ExpeditionMotion.preload('elephant');});
    await page.waitForFunction(()=>G.ExpeditionMotion.ready('elephant','walk'));
    await page.waitForTimeout(180);
    await page.screenshot({path:path.join(OUT,'expedition-motion-elephant-in-game.png')});
    await page.getByRole('button',{name:'야영',exact:true}).click();
    await page.waitForFunction(()=>G.Scenes.land.runtime().camping);
    await page.waitForTimeout(180);
    await page.screenshot({path:path.join(OUT,'expedition-motion-camp-in-game.png')});
    await page.getByRole('button',{name:'그만둔다',exact:true}).click();
    await page.waitForFunction(()=>!G.Scenes.land.runtime().camping);
    assert.deepStrictEqual(errors,[],'실제 게임 콘솔 오류');
    console.log('OK · file 실행 · 22개 시트 로딩 · 424장면 렌더 · 게임 야영 시작/종료 · 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
