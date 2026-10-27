/* 7종 RGBA 시트와 실제 해전의 발사·착수·피격·돌진·잠수·복원을 확인한다. */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),sharp=require('sharp'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'docs/art/water-splash-battle');
async function run(){
  fs.mkdirSync(OUT,{recursive:true});
  const ids=['cannon','hull','volley','wake','ram','dive','emerge'];
  for(const id of ids){
    const file=path.join(ROOT,'images/effects/water',id+'.webp'),meta=await sharp(file).metadata();
    assert.equal(meta.width,1024);assert.equal(meta.height,512);assert(meta.hasAlpha);
    const raw=await sharp(file).ensureAlpha().raw().toBuffer();
    for(let n=0;n<8;n++){
      let solid=0,transparent=0;
      for(let y=0;y<256;y++)for(let x=0;x<256;x++){
        const a=raw[((Math.floor(n/4)*256+y)*1024+n%4*256+x)*4+3];
        if(a>20)solid++;if(!a)transparent++;
        if(x<12||x>=244||y<12||y>=244)assert.equal(a,0,id+' 칸 경계 투명 여백');
      }
      assert(solid>100&&transparent>256*256*.35,id+' '+n+' 독립된 투명 프레임');
    }
  }
  console.log('7종 × 8프레임 = 56칸 · 투명도·칸 여백 확인');
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1200,height:800}});
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
    await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
    await page.goto(pathToFileURL(path.join(ROOT,'test_water_splashes.html')).href);
    await page.waitForFunction(()=>window.SPLASH_PREVIEW&&SPLASH_PREVIEW.ready);
    await page.evaluate(()=>{document.getElementById('paused').checked=true;document.getElementById('phase').value=.36;SPLASH_PREVIEW.draw(.36);});
    await page.screenshot({path:path.join(OUT,'seven-types.png'),fullPage:true});
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
    await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title');
    const checks=await page.evaluate(async()=>{
      const checks=[];function ok(v,s){if(!v)throw Error(s);checks.push(s);}
      const B=G.Scenes.battle,M=G.SeaMonsters,W=G.WaterSplash;
      const s=G.Game.state=G.State.newGame({name:'물보라 시험',nation:'PT',job:'explorer',age:22,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{gun:2,nav:2},lg:[],diff:'normal'});
      s.settings.res=.35;s.settings.shake=true;s.loc={mode:'sea',lon:-25,lat:32,heading:0};await G.Game.ensureGeo();
      window.waterEvents=[];const emit=W.emit;W.emit=function(st,id){const r=emit.apply(W,arguments);if(r)waterEvents.push(id);return r;};
      function enter(id){const npc=M.npc(M.sync()[id]);npc.center={lon:-25,lat:32};G.Game.go('battle',{npc});const st=B.runtime(),me=st.myFlag,en=st.enFlag;me.hp=me.maxHp=5000;me.halt=true;me.vel=[0,0];me.guns.n=0;me.x=-180;me.y=0;en.x=180;en.y=0;en.heading=Math.PI;en.attackCd=999;return st;}
      let st=enter('kraken'),en=st.enFlag,me=st.myFlag;
      await W.preload();await G.SeaMonsterSprite.preload(['kraken','man-eating-shark']);
      ok(Object.keys(G.FX.waterSplash.types).every(id=>W.status(id)==='ok'),'실제 file:// 게임에서 7종 모두 준비');
      // 그림의 배경 투명도뿐 아니라 실제로 합성된 물 자체도 바다가 비쳐야 한다.
      const cv=document.createElement('canvas');cv.width=cv.height=256;const cx=cv.getContext('2d',{willReadFrequently:true});
      for(const id of Object.keys(G.FX.waterSplash.types))for(let frame=0;frame<8;frame++){
        cx.clearRect(0,0,256,256);const life=G.FX.waterSplash.types[id].life,q=Math.max(.04,Math.min(.96,frame/7));
        W.draw(cx,{style:id,t:q*life,life,size:256,angle:0},128,176);
        const px=cx.getImageData(0,0,256,256).data;let nonzero=0,max=0,base=0;
        for(let y=0;y<256;y++)for(let x=0;x<256;x++){const a=px[(y*256+x)*4+3];if(a>0)nonzero++;max=Math.max(max,a);if(y>=176)base=Math.max(base,a);}
        ok(nonzero>5&&max<=170&&base<=55,id+' '+frame+'프레임: 물기둥·수면 거품을 반투명으로 합성');
      }
      en.attackCd=0;B.update(.05);
      ok(waterEvents.includes('volley')&&st.balls.filter(x=>x.radial).length===16,'사방 포격 때 물보라 1회와 포탄 16개');
      ok(st.fx.filter(x=>x.style==='volley').length===1,'포탄 수만큼 분출 연출을 중첩하지 않음');
      ok(!st.fx.some(x=>x.kind==='ring'),'괴물의 물보라 위에 원형 고리를 겹치지 않음');
      ok(B.feel().shake>0&&en.trem&&!en.trem.idle(),'괴물의 공격 시작에 화면과 공격자 떨림');
      st.balls=[];en.attackCd=999;st.hitstop=0;
      st.balls.push({x:me.x,y:me.y,tx:0,ty:100,t:0,dur:.01,hit:false,target:null,from:me});B.update(.05);
      ok(waterEvents.includes('cannon'),'빗나간 포탄의 실제 착수 물기둥');
      ok(!st.fx.some(x=>x.kind==='ring'),'착수 물보라에도 원형 고리를 겹치지 않음');
      st.balls.push({x:en.x,y:en.y,tx:me.x,ty:me.y,t:0,dur:.01,hit:true,dmg:5,target:me,from:en});B.update(.05);
      ok(waterEvents.includes('hull')&&me.hp<5000,'실제 명중 위치의 선체 물보라와 피해');
      st.hitstop=0;en.phaseTime=G.BALANCE.seaMonsters.surfaceSeconds-.01;B.update(.05);
      ok(waterEvents.includes('dive')&&en.monsterPhase==='dive'&&!M.targetable(en),'잠수 시작 물보라와 기존 무적 규칙');
      en.monsterPhase='submerged';en.phaseTime=G.BALANCE.seaMonsters.hiddenSeconds-.01;B.update(.05);
      ok(waterEvents.includes('emerge')&&en.monsterPhase==='emerge','수중 은신 종료의 재등장 물기둥');
      // 발사자가 실제로 포를 쏘게 하고 선체 반동을 검사한다.
      en.monsterPhase='surface';en.phaseTime=0;en.attackCd=999;st.balls=[];st.hitstop=0;st.shake=0;delete st.shaker;delete me.trem;delete st.attackFeelT;
      me.x=0;me.y=0;en.x=150;en.y=0;me.guns.n=4;me.heading=Math.PI/2;me.reload=[-1,-1,-1];me.target=en;B.update(.05);
      ok(st.balls.some(x=>x.from===me)&&me.trem&&!me.trem.idle()&&B.feel().shake>0,'일반 함선의 실제 포격에도 선체 반동과 화면 흔들림');
      const cameraSamples=[.02,.04,.08].map(dt=>st.shaker.sample(performance.now()/1000+dt,st.shake));
      ok(cameraSamples.some(p=>Math.hypot(p[0],p[1])>.1),'발사 반동이 실제 카메라 어긋남을 생성');
      // 그림용 카메라를 움직여도 선체의 실제 좌표는 움직이지 않는다.
      st.paused=true;const xy=[me.x,me.y];B.update(.05);ok(me.x===xy[0]&&me.y===xy[1],'연출은 선체의 실제 좌표를 바꾸지 않음');st.paused=false;me.guns.n=0;
      s.settings.shake=false;st.shake=0;delete st.shaker;delete en.trem;delete st.attackFeelT;en.attackCd=0;st.hitstop=0;B.update(.05);
      ok(!B.feel().shake&&!en.trem&&st.fx.some(x=>x.style==='volley'),'흔들림 설정을 꺼도 물보라는 재생하고 화면·선체 떨림은 생성하지 않음');
      s.settings.shake=true;waterEvents.length=0;st=enter('man-eating-shark');en=st.enFlag;me=st.myFlag;
      me.x=0;en.x=-280;en.heading=0;en.attackCd=0;
      B.headless=true;try{for(let i=0;i<55;i++)B.update(.05);}finally{B.headless=false;}
      ok(waterEvents.includes('wake')&&waterEvents.includes('ram')&&me.hp<5000,'실제 고속 돌진 물살과 충돌 폭발');
      ok(me.trem&&!me.trem.idle(),'들이받힌 배의 선체 떨림');
      // 효과가 많은 상태와 흔들림 클래스가 있어도 직렬화·참조 복원이 가능하다.
      st.paused=true;const hp=me.hp,raw=G.State.serialize(),parsed=JSON.parse(raw);G.Game.state=G.State.deserialize(raw);G.Game.go('battle',{battle:parsed.battle});st=B.runtime();B.update(.05);
      ok(st.myFlag.hp===hp&&st.enFlag.monster==='man-eating-shark','공격 연출 중 저장·불러오기 가능');
      const limit={fx:[]};for(let i=0;i<200;i++)W.emit(limit,'cannon',0,0);ok(limit.fx.length===G.FX.waterSplash.max,'동시에 재생되는 그림 효과 48개 상한');
      // 실제 해전 검수 장면: 돌진 뒤 남은 물살과 피격 지점.
      await G.ShipSprite.preload(st.ships.map(b=>b.type));
      st.myFlag.x=-160;st.myFlag.y=40;st.enFlag.x=160;st.enFlag.y=0;st.cx=0;st.cy=0;st.vz=1;
      W.emit(st,'ram',st.myFlag.x,st.myFlag.y,1.4,0);W.emit(st,'wake',st.enFlag.x,st.enFlag.y,1.5,0);
      st.fx.forEach(f=>{if(f.kind==='waterSprite')f.t=f.life*.36;});B.update(.001);
      return checks;
    });
    console.log(checks.join('\n'));await page.screenshot({path:path.join(OUT,'charge-impact.png')});
    await page.evaluate(()=>{const B=G.Scenes.battle,st=B.runtime(),en=st.enFlag;en.monster='kraken';en.name='크라켄';en.monsterPhase='emerge';en.phaseTime=.6;st.fx=[];G.WaterSplash.emit(st,'emerge',en.x,en.y,1.4);st.fx[0].t=.6;B.update(.001);});
    await page.screenshot({path:path.join(OUT,'emerge.png')});
    assert.deepEqual(errors,[]);console.log('OK · 물보라 7종·실제 공격/잠수 연동·반동·설정·저장 · 콘솔 오류 0');
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
