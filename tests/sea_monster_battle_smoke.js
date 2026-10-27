/* 실제 지도·해전·발견 규칙과 저장을 사용한다. 발견 연출만 생략한다. */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('playwright');
const ROOT=path.resolve(__dirname,'..'), OUT=path.join(ROOT,'docs','sea-monster-battle');
async function run() {
  fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try {
    const page=await browser.newPage({viewport:{width:1280,height:800}});
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
    await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
    await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&G.SeaMonsters);
    const world=await page.evaluate(async()=>{
      const s=G.Game.state=G.State.newGame({name:'괴물 토벌 시험',nation:'PT',job:'explorer',age:22,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{nav:2,gun:2},lg:[],diff:'normal'});
      s.settings.res=.35;await G.Game.ensureGeo();
      const entries=G.SeaMonsters.sync(), ids=Object.keys(entries);
      window.monsterTest={entries:G.U.clone(s.seaMonsters),date:G.U.clone(s.date)};
      const e=entries.kraken;
      const c=G.CITY_DATA.filter(c=>c.port&&G.R.cityExists(c)).sort((a,b)=>G.Geo.dist(e.lon,e.lat,a.lon,a.lat)-G.Geo.dist(e.lon,e.lat,b.lon,b.lat))[0];
      window.monsterTest.city=c.id;
      const strongest=G.SeaMonsters.strongest(s.date.y);
      const specs=ids.every(id=>{const spec=G.SeaMonsters.enemy(G.SeaMonsters.npc(entries[id]));return spec.monster===id&&spec.maxHp===strongest.hp*4&&spec.crew===strongest.crew[1];});
      const old=G.SHIP_TYPES.length;
      G.SHIP_TYPES.push({id:'future-test',hp:9999,ports:999,from:s.date.y+1});
      const era=G.SeaMonsters.strongest(s.date.y).id===strongest.id&&G.SeaMonsters.strongest(s.date.y+1).id==='future-test';G.SHIP_TYPES.length=old;
      window.monsterNewsDone=false;
      G.SeaMonsters.tell(c,{name:'항구 관리'},false).then(()=>{window.monsterNewsDone=true;});
      return {count:ids.length,water:ids.every(id=>G.Geo.isSea(entries[id].lon,entries[id].lat,G.BALANCE.seaMonsters.seaMargin)),era,
        common:ids.filter(id=>G.SEA_MONSTERS[id].years===10).length,legend:ids.filter(id=>G.SEA_MONSTERS[id].years===50).length,
        specs,local:G.SeaMonsters.news(c).some(x=>x.id==='kraken'),discovered:G.Disc.foundByMe('kraken')};
    });
    assert.equal(world.count,12);assert(world.water&&world.era&&world.local&&world.specs);assert.equal(world.common,6);assert.equal(world.legend,6);assert(!world.discovered);
    await page.screenshot({path:path.join(OUT,'port-news.png')});
    for(let i=0;i<20;i++){if(await page.evaluate(()=>window.monsterNewsDone))break;await page.keyboard.press('Enter');await page.waitForTimeout(80);}
    assert(await page.evaluate(()=>window.monsterNewsDone),'항구 소식 대화가 끝남');
    const cycleJob=page.evaluate(async()=>{
      const s=G.Game.state,M=G.SeaMonsters,checks=[];function ok(v,msg){if(!v)throw Error(msg);checks.push(msg);}
      const found0=s.stats.found;
      const reveal=G.Scenes.discoveryReveal,card=G.Scenes.discoveryCard,banter=G.Banter.play;
      G.Scenes.discoveryReveal=async()=>{};G.Scenes.discoveryCard=async()=>{};G.Banter.play=async()=>{};
      try {await M.discover(M.sync().kraken);await M.discover(M.sync().kraken);}finally{G.Scenes.discoveryReveal=reveal;G.Scenes.discoveryCard=card;G.Banter.play=banter;}
      ok(G.Disc.foundByMe('kraken')&&s.stats.found===found0+1,'첫 조우만 실제 발견물로 한 번 기록');
      ok(s.disc.kraken.monsterAt.lon===M.sync().kraken.lon,'실제 첫 발견 좌표도 저장');
      const d=G.DISC.kraken;ok(!G.Disc.checkSea(d.lon,d.lat).some(x=>x.id==='kraken'),'옛 고정 좌표에서 중복 발견 없음');
      const root=G.U.clone(s.seaMonsters),date=G.U.clone(s.date);
      s.date={y:1480,m:2,d:29};
      for(const id of ['kraken','jormungandr']){const e=M.sync()[id];M.afterBattle(M.npc(e),'win',[{monster:id,sunk:true,hp:0,maxHp:720}]);}
      ok(s.seaMonsters.entries.kraken.next.y===1490&&s.seaMonsters.entries.kraken.next.d===28,'10년 뒤 달력 날짜와 윤일 보정');
      ok(s.seaMonsters.entries.jormungandr.next.y===1530,'전설 괴물은 50년 뒤');
      s.date={y:1490,m:2,d:27};M.sync();ok(!s.seaMonsters.entries.kraken.active,'재등장 전날에는 없음');
      s.date={y:1490,m:2,d:28};M.sync();const e=s.seaMonsters.entries.kraken;
      ok(e.active&&e.cycle===root.entries.kraken.cycle+1,'날짜가 되면 한 번 재등장');
      ok(G.Geo.dist(e.lon,e.lat,root.entries.kraken.lon,root.entries.kraken.lat)>=G.BALANCE.seaMonsters.spawnMove,'재등장 장소가 이전과 다름');
      ok(!s.seaMonsters.entries.jormungandr.active,'50년 괴물은 10년째에도 없음');
      s.date={y:1530,m:2,d:28};M.sync();ok(s.seaMonsters.entries.jormungandr.active,'50년 뒤 전설 괴물 재등장');
      s.seaMonsters=root;s.date=date;
      return checks;
    });
    let cycleDone=false;cycleJob.then(()=>{cycleDone=true;},()=>{cycleDone=true;});
    for(let i=0;i<120&&!cycleDone;i++){await page.waitForTimeout(150);if(await page.evaluate(()=>G.UI.busy()))await page.keyboard.press('Enter');}
    if(!cycleDone)throw Error('발견 연출 확인 시간 초과');
    const cycle=await cycleJob;console.log(cycle.join('\n'));
    // 실제 항해의 거리 검사 → 조우 선택 → 해전 진입 경로.
    await page.evaluate(async()=>{
      const e=G.SeaMonsters.sync().kraken,s=G.Game.state;
      s.loc={mode:'sea',lon:e.lon,lat:e.lat,heading:0};G.State.revealChart(e.lon,e.lat,8);G.Game.go('sea',{fresh:true});
      await G.SeaMonsterSprite.preload(['kraken']);
      const st=G.Scenes.sea.runtime();st.paused=false;st.frame=9;G.Scenes.sea.update(.01);
    });
    await page.getByRole('button',{name:'싸운다',exact:true}).waitFor();
    await page.evaluate(async()=>{await G.ShipSprite.preload(G.Game.state.fleet.ships.map(x=>x.type),3000);for(let i=0;i<3;i++)G.Scenes.sea.update(.05);});
    await page.screenshot({path:path.join(OUT,'sea-encounter.png')});
    await page.getByRole('button',{name:'싸운다',exact:true}).click();
    await page.waitForFunction(()=>G.Game.sceneName==='battle');
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.fade-black')).every(el=>Number(getComputedStyle(el).opacity)<.01));
    assert.equal(await page.evaluate(()=>G.Scenes.battle.runtime().npc.monster),'kraken');
    console.log('실제 항해 거리 검사에서 괴물 조우·싸운다 선택·해전 진입');
    const combat=await page.evaluate(async()=>{
      const s=G.Game.state,M=G.SeaMonsters,B=G.Scenes.battle,checks=[];
      function ok(v,msg){if(!v)throw Error(msg);checks.push(msg);}
      window.monsterStep=(seconds)=>{for(let left=seconds;left>1e-6;left-=.05)B.update(Math.min(.05,left));};
      s.loc={mode:'sea',lon:-25,lat:32,heading:0};
      const ship=s.fleet.ships[0];ship.hp=ship.maxHp=5000;s.fleet.crew=ship.crewMax;
      const npc=M.npc(M.sync().kraken);npc.center={lon:-25,lat:32};G.Game.go('battle',{npc});
      const st=B.runtime(),me=st.myFlag,en=st.enFlag;
      me.hp=me.maxHp=5000;me.guns.n=0;me.halt=true;me.vel=[0,0];me.x=-200;me.y=0;en.x=200;en.y=0;en.heading=Math.PI;
      await G.SeaMonsterSprite.preload(['kraken']);
      ok(en.maxHp===M.strongest(s.date.y).hp*4&&en.crew===en.t.crew[1],'현 시대 최강 선종 내구 4배·정원 가득');
      en.attackCd=0;B.update(.05);
      ok(st.balls.filter(x=>x.radial).length===G.BALANCE.seaMonsters.rays,'실제 해전에서 16방향 포탄 발사');
      const angles=st.balls.filter(x=>x.radial).map(x=>Math.atan2(x.ty-x.y,x.tx-x.x));
      ok(angles.some(x=>x>.5&&x<2)&&angles.some(x=>x<-0.5&&x>-2)&&angles.some(x=>Math.abs(x)<.2)&&angles.some(x=>Math.abs(x)>3),'동서남북으로 모두 발사');
      const hp=me.hp;window.monsterStep(1.4);ok(me.hp<hp,'물 포탄의 실제 이동 궤적과 충돌 피해');
      st.balls=[];st.hitstop=0;en.attackCd=999;
      en.monsterPhase='surface';en.phaseTime=0;
      B.headless=true;try{window.monsterStep(G.BALANCE.seaMonsters.surfaceSeconds+.05);}finally{B.headless=false;}
      ok(en.monsterPhase==='dive'&&!M.targetable(en),'수면 시간이 지나면 자동 잠수하고 표적에서 제외');
      for(const phase of ['dive','submerged','emerge']) {
        en.monsterPhase=phase;en.phaseTime=0;const before=en.hp;
        st.balls.push({x:me.x,y:me.y,tx:en.x,ty:en.y,t:0,dur:.01,hit:true,dmg:10000,target:en,from:me});
        me.guns.n=2;me.reload=[-1,-1,-1];me.target=en;me.heading=Math.PI/2;
        B.update(.05);
        ok(en.hp===before&&!st.balls.some(ball=>ball.from===me),'잠수 단계 '+phase+'에서 비행 중 포탄 무효·자동 발사 차단');
      }
      me.guns.n=0;en.monsterPhase='submerged';en.phaseTime=3.2;en.hp-=17;
      st.paused=true;st.balls.push({x:en.x,y:en.y,tx:me.x,ty:me.y,t:.1,dur:2,hit:false,radial:true,target:null,from:en,dmg:5});
      const hpSaved=en.hp,raw=G.State.serialize(),parsed=JSON.parse(raw);G.Game.state=G.State.deserialize(raw);G.Game.go('battle',{battle:parsed.battle});
      const restored=B.runtime();
      ok(restored.enFlag.monster==='kraken'&&restored.enFlag.hp===hpSaved&&restored.enFlag.monsterPhase==='submerged'&&restored.enFlag.phaseTime===3.2,'해전 저장·불러오기에서 내구와 잠수 진행 유지');
      ok(restored.enFlag.tr.length===0&&restored.balls[0].from===restored.enFlag&&restored.enFlag.crew===restored.enFlag.crew0,'복원 후 함선 특성 미적용·포탄 참조·가득 찬 정원 유지');
      B.update(.05);return checks;
    });console.log(combat.join('\n'));
    await page.screenshot({path:path.join(OUT,'submerged.png')});
    const charge=await page.evaluate(async()=>{
      const B=G.Scenes.battle,M=G.SeaMonsters,s=G.Game.state;
      const npc=M.npc(M.sync()['man-eating-shark']);npc.center={lon:-25,lat:32};G.Game.go('battle',{npc});
      const st=B.runtime(),me=st.myFlag,en=st.enFlag;me.hp=me.maxHp=5000;me.halt=true;me.vel=[0,0];me.guns.n=0;me.x=0;me.y=0;en.x=-350;en.y=0;en.heading=0;en.attackCd=0;
      await G.SeaMonsterSprite.preload(['man-eating-shark']);let fastest=0;
      for(let i=0;i<60;i++){B.update(.05);fastest=Math.max(fastest,en.spd);}
      const result={speed:fastest,hurt:me.hp<5000,noShots:st.balls.every(x=>x.from!==en),phase:en.chargeStage};
      st.paused=true;return result;
    });assert(charge.speed>=235&&charge.hurt&&charge.noShots);console.log('스피드 괴물의 실제 고속 돌진·충돌 피해·포격 없음');
    await page.screenshot({path:path.join(OUT,'charge.png')});
    const board=page.getByRole('button',{name:'백병전',exact:true});assert(await board.isDisabled());await page.keyboard.press('b');
    assert.equal(await page.locator('.dialogue').count(),0);
    // 실제 포탄으로 괴물을 쓰러뜨리고 토벌 정산까지 진행한다.
    await page.evaluate(()=>{
      const B=G.Scenes.battle,st=B.runtime(),en=st.enFlag,me=st.myFlag;st.paused=false;st.hitstop=0;st.hsCool=0;
      en.monsterPhase='surface';en.phaseTime=0;en.attackCd=999;en.chargeStage='wait';
      st.balls=[{x:me.x,y:me.y,tx:en.x,ty:en.y,t:0,dur:.01,hit:true,dmg:100000,target:en,from:me}];
      window.monsterNotoriety=G.Game.state.player.notoriety;window.monsterWins=G.Game.state.stats.wins;B.update(.05);
    });
    await page.waitForFunction(()=>G.Game.state.seaMonsters.entries['man-eating-shark'].active===false,{},{timeout:15000});
    await page.waitForTimeout(100);await page.keyboard.press('Enter');await page.keyboard.press('Enter');
    const victory=await page.evaluate(()=>({wins:G.Game.state.stats.wins-window.monsterWins,notoriety:G.Game.state.player.notoriety-window.monsterNotoriety,
      next:G.Game.state.seaMonsters.entries['man-eating-shark'].next.y-G.Game.state.date.y,captured:G.Game.state.stats.captured}));
    assert.equal(victory.wins,1);assert.equal(victory.notoriety,0);assert.equal(victory.next,10);assert.equal(victory.captured,0);
    assert.deepEqual(errors,[]);console.log('OK · 12종 출몰·시대/내구·소식·첫 발견·10/50년 재등장·잠수·사방 포격·돌진·저장·나포/악명 없음 · 콘솔 오류 0');
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
