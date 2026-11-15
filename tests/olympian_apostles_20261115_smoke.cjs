/* 시험 경로·실패/재도전·고용·옛 저장·12/12 업적·전용 그림·실제 해전 복귀를 확인한다. */
'use strict';
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'), out=process.env.OUT||path.join(root,'artifacts/olympian-apostles-20261115');
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[], deadline=setTimeout(()=>browser.close().catch(()=>{}),300000);
  try {
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
    await page.addInitScript(()=>{window.testRAF=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=()=>0;});
    await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root,'index.html')).href),{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
    const report=await page.evaluate(async()=>{
      function ck(v,msg){if(!v)throw Error(msg);}
      G.Scenes.title.exit(); await G.Loader.hide(); G.UI.clearScreen();
      G.State.newGame({name:'12신 사도 검사',nation:'PT',job:'explorer',age:28,birth:{m:1,d:1},st:{str:70,int:70,mar:70,cha:70},sk:{},lg:[0,1,2,4],diff:'normal'});
      const s=G.Game.state, OP=G.OlympianApostles, roster=G.OLYMPIAN_APOSTLES, AC=G.Achieve;
      s.settings.res=.35; await G.Game.ensureGeo();
      window.originalApostleUI={say:G.UI.say,ask:G.UI.ask,scene:AC.scene,duel:G.Games.duel,land:G.Games.landWar,hanoi:G.Games.pz.hanoi,balance:G.Games.pz.balance,melody:OP.melody};
      G.UI.say=async()=>{}; G.UI.ask=async(q,opts)=>opts.some(x=>x.value==='try')?'try':opts.some(x=>x.value==='hire')?'hire':'back'; AC.scene=async()=>{};
      ck(roster.length===12&&new Set(roster.map(a=>a.id)).size===12,'사도 12명');
      ck(new Set(roster.map(a=>G.MATE[a.id].name)).size===12&&roster.every(a=>!G.MATE[a.id].name.includes('사도')),'호칭 대신 고유 인명 12개');
      for(const field of ['greet','dare','win','lose','join','wait','again'])ck(new Set(roster.map(a=>G.OLYMPIAN_APOSTLE_EVENTS[a.slug][field])).size===12,'서로 다른 '+field+' 대사');
      ck(roster.every(a=>G.MATE[a.id].eventOnly&&!G.MatePower.blocked(G.MATE[a.id])&&G.MateMove.range(a.id).length===0),'술집 출현 없음·권력자 차단과 무관');
      const kinds={}; roster.forEach(a=>{const k=OP.kindName(a);kinds[k]=(kinds[k]||0)+1;}); ck(Object.values(kinds).every(x=>x===3),'네 종류 세 시험씩');
      const positions=[];
      for(const a of roster){
        const c=OP.city(a),d=G.DISC[a.discovery]; ck(c&&d,'성소·도시 연결 '+a.id);
        ck(!G.CITY_DATA.some(x=>G.R.cityExists(x)&&G.Geo.dist(d.lon,d.lat,x.lon,x.lat)<G.Geo.dist(d.lon,d.lat,c.lon,c.lat)-1e-8),'최인접 도시 '+a.id);
        s.loc={mode:'land',lon:c.lon,lat:c.lat,party:36,base:{type:'city',city:c.id,lon:c.lon,lat:c.lat},days:0};
        ck(!(await OP.meet(a.id)),'발견 전 시험 차단 '+a.id);
        s.disc[a.discovery]={me:true,found:true}; OP.afterFind(d);
        ck(OP.near().includes(a),'발견 후 출현 '+a.id);
        s.loc.mode='sea'; ck(!(await OP.meet(a.id)),'해상에서는 만날 수 없음'); s.loc.mode='land';
        positions.push({god:a.god,id:a.id,discovery:a.discovery,city:c.id,cityName:c.name,trial:OP.kindName(a)});
      }
      const pilgrimage=AC.get('olympian_pilgrim'), companions=AC.get('olympian_companions');
      delete s.disc.vesta; ck(!AC.progress(pilgrimage).done&&AC.progress(pilgrimage).have===11,'11곳은 미달성');
      s.disc.vesta={me:true,found:true}; ck(AC.progress(pilgrimage).done,'12곳 달성');
      AC.check(); ck(AC.done(pilgrimage.id),'발견 업적 기록'); const gold=s.player.gold; AC.check(); ck(s.player.gold===gold,'중복 보상 없음');
      const duel=roster.find(a=>a.kind==='duel'), dc=OP.city(duel); s.loc={mode:'land',lon:dc.lon,lat:dc.lat,party:36,base:{type:'city',city:dc.id,lon:dc.lon,lat:dc.lat},days:0};
      G.Games.duel=async()=> 'lose'; await OP.meet(duel.id); ck(!s.olympianApostles[duel.id].passed&&!s.mates.some(m=>m.id===duel.id),'패배하면 미고용'); ck(!(await OP.meet(duel.id)),'같은 날 재시험 차단'); s.day++;
      const routed={duel:0,land:0,hanoi:0,balance:0,melody:0};
      G.Games.duel=async()=>{routed.duel++;return 'win';}; G.Games.landWar=async o=>{ck(o.party===36&&o.enemy.n===30&&o.noHurt,'중급 모의 육상전');routed.land++;return {res:'win'};};
      G.Games.pz.hanoi=async(d,lv)=>{ck(lv===2,'중급 퍼즐');routed.hanoi++;return true;}; G.Games.pz.balance=async()=>{routed.balance++;return true;}; OP.melody=async()=>{routed.melody++;return true;};
      // 시험 통과 뒤 고용 보류 → 다음 만남은 시험을 반복하지 않는다.
      G.UI.ask=async(q,opts)=>opts.some(x=>x.value==='try')?'try':'later'; await OP.meet(duel.id); ck(s.olympianApostles[duel.id].passed&&!s.olympianApostles[duel.id].hired,'통과·고용 보류 분리');
      s.day++; G.UI.ask=async(q,opts)=>opts.some(x=>x.value==='try')?'try':'hire'; const once=routed.duel; await OP.meet(duel.id); ck(routed.duel===once&&s.olympianApostles[duel.id].hired,'재시험 없이 고용');
      const actualGo=G.Game.go, navals=[];
      for(const a of roster){
        if(a.id===duel.id)continue;
        const c=OP.city(a); s.loc={mode:'land',lon:c.lon,lat:c.lat,party:36,base:{type:'city',city:c.id,lon:c.lon,lat:c.lat},days:0};
        if(a.kind==='naval') {
          let npc; G.Game.go=(name,arg)=>{if(name==='battle')npc=arg.npc;};
          const crew=s.fleet.crew, fleet=JSON.stringify(s.fleet.ships); await OP.meet(a.id); ck(npc&&npc.olympianTrial===a.id&&npc.myFleet.length===1,'실제 해전 전달 '+a.id);
          // 저장 직렬화 후에도 함수 없이 시험 정보를 복구할 수 있다.
          s.olympianNaval=JSON.parse(JSON.stringify(s.olympianNaval)); await OP.finishNaval(npc,'retreat'); ck(s.fleet.crew===crew&&!s.olympianApostles[a.id].passed,'해상 퇴각 후 복원');
          s.day++; await OP.meet(a.id); await OP.finishNaval(npc,'win'); ck(s.fleet.crew===crew&&JSON.stringify(s.fleet.ships)===fleet,'함대·선원 복원'); navals.push(a.id);
          G.Game.go=actualGo;
        } else await OP.meet(a.id);
      }
      ck(roster.every(a=>s.olympianApostles[a.id].hired&&s.mates.some(m=>m.id===a.id)),'12명 모두 고용');
      ck(AC.done(companions.id)&&AC.progress(companions).have===12,'전원 고용 업적');
      ck(s.olympianFellowships.men&&s.olympianFellowships.women,'남성·여성 여섯 명 동행 사건');
      const fellowship=OP.fellowshipScene; let replays=0; OP.fellowshipScene=async()=>{replays++;}; await OP.playFellowships(); ck(replays===0,'동행 사건 중복 방지'); OP.fellowshipScene=fellowship;
      const count=s.mates.length; ck(!(await OP.meet(duel.id))&&s.mates.length===count,'중복 고용 불가');
      s.mates=s.mates.filter(m=>m.id!==duel.id); delete s.olympianApostles; OP.sync(); ck(s.olympianApostles[duel.id].hired&&AC.progress(companions).done,'고용 기록·옛 저장 복구');
      for(const a of roster){for(const key of ['portraits/mates/'+a.id,'portraits/mates/'+a.id+'_half']){const url=G.Img.src(key);ck(url,'그림 등록 '+key);await new Promise((r,j)=>{const i=new Image();i.onload=r;i.onerror=()=>j(Error(key));i.src=url;});}}
      for(const a of [pilgrimage,companions]){const key=G.ACHV_EVENTS[a.id].pic;ck(key==='achievement-events/'+a.id,'전용 이벤트샷');await new Promise((r,j)=>{const i=new Image();i.onload=r;i.onerror=j;i.src=G.Img.src(key);});}
      const extra=roster.map(a=>'olympian-events/meet_'+a.slug).concat(G.OLYMPIAN_FELLOWSHIP_EVENTS.map(e=>e.pic));
      for(const key of extra){ck(G.Img.file(key),'만남·성별 사건 그림 '+key);const im=new Image();im.src=G.Img.src(key);await im.decode();}
      Object.assign(G.UI,{say:window.originalApostleUI.say,ask:window.originalApostleUI.ask}); AC.scene=window.originalApostleUI.scene;
      G.Games.duel=window.originalApostleUI.duel;G.Games.landWar=window.originalApostleUI.land;G.Games.pz.hanoi=window.originalApostleUI.hanoi;G.Games.pz.balance=window.originalApostleUI.balance;OP.melody=window.originalApostleUI.melody;
      return {positions,kinds,routed,navals,names:roster.map(a=>({name:a.name,god:a.god})),achievements:[pilgrimage.id,companions.id],assets:40};
    });
    fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify(report,null,2));
    // 실제 해전 장면을 띄워 엔진 초기화와 승패 복귀를 통과한다.
    await page.evaluate(()=>{
      const s=G.Game.state, a=G.OLYMPIAN_APOSTLES.find(x=>x.slug==='poseidon'), c=G.OlympianApostles.city(a);
      s.loc={mode:'land',lon:c.lon,lat:c.lat,party:s.fleet.crew,base:{type:'city',city:c.id,lon:c.lon,lat:c.lat},days:0};
      s.olympianApostles[a.id].passed=false;s.olympianApostles[a.id].hired=false;delete s.olympianApostles[a.id].next;
      G.OlympianApostles.startNaval(a);
      const rt=G.Scenes.battle.runtime(); if(!rt||rt.ships.length!==2)throw Error('실제 1대1 해전 초기화');
      window.requestAnimationFrame=window.testRAF;
    });
    await page.screenshot({path:path.join(out,'naval-runtime.png')});
    await page.evaluate(async()=>{G.UI.say=async()=>{};G.UI.ask=async()=> 'later'; await G.Scenes.battle._t().finish('lose'); if(G.Game.sceneName!=='land'||G.Game.state.olympianNaval)throw Error('실제 해전 → 육상 복귀');G.UI.say=window.originalApostleUI.say;G.UI.ask=window.originalApostleUI.ask;});
    await page.evaluate(()=>{window.realApostleOnLand=G.OlympianApostles.onLand;G.OlympianApostles.onLand=async()=>false;});
    await page.getByRole('button',{name:'12신의 사도',exact:false}).click();
    await page.screenshot({path:path.join(out,'apostle-status-runtime.png')});
    await page.getByText('돌아간다',{exact:true}).last().click();
    // 실제 업적 연출이 전용 그림을 선택하는지 확인하고 각 첫 장면을 보존한다.
    for(const id of ['olympian_pilgrim','olympian_companions']){
      await page.evaluate(id=>{window.eventDone=false;window.achievementRun=G.Achieve.scene(G.Achieve.get(id)).then(()=>{window.eventDone=true;});},id);
      await page.waitForTimeout(650);
      await page.screenshot({path:path.join(out,id+'-runtime.png')});
      for(let i=0;i<60;i++){
        const done=await page.evaluate(()=>window.eventDone); if(done)break;
        await page.keyboard.press('Enter'); await page.waitForTimeout(160);
      }
      assert.equal(await page.evaluate(()=>window.eventDone),true,'업적 대화와 보상 끝까지 종료');
      await page.evaluate(()=>G.UI.clearScreen());
    }
    for(const id of ['men','women']){
      await page.evaluate(id=>{window.eventDone=false;window.fellowRun=G.OlympianApostles.fellowshipScene(G.OLYMPIAN_FELLOWSHIP_EVENTS.find(e=>e.id===id)).then(()=>{window.eventDone=true;});},id);
      await page.waitForTimeout(450);await page.screenshot({path:path.join(out,id+'-runtime.png')});
      for(let i=0;i<60;i++){if(await page.evaluate(()=>window.eventDone))break;await page.keyboard.press('Enter');await page.waitForTimeout(160);}
      assert.equal(await page.evaluate(()=>window.eventDone),true,'동행 사건 끝까지 종료');
    }
    await page.evaluate(()=>{
      const s=G.Game.state,a=G.OLYMPIAN_APOSTLES.find(a=>a.slug==='demeter'),c=G.OlympianApostles.city(a);
      s.mates=s.mates.filter(m=>m.id!==a.id);delete s.crewEver[a.id];s.olympianApostles[a.id]={city:c.id,unlocked:true};
      G.Game.go('land',{from:c.id});window.eventDone=false;
      window.meetingRun=G.OlympianApostles.meet(a.id).then(()=>{window.eventDone=true;});
    });
    await page.waitForTimeout(450); await page.screenshot({path:path.join(out,'meet-demeter-runtime.png')});
    // 만남 대사를 끝내고 도전 보류를 골라 시험 밖의 정리까지 확인한다.
    for(let i=0;i<55;i++){
      if(await page.evaluate(()=>window.eventDone))break;
      const later=page.getByText('다음에 도전한다',{exact:true});
      if(await later.count())await later.click();else await page.keyboard.press('Enter');
      await page.waitForTimeout(160);
    }
    assert.equal(await page.evaluate(()=>window.eventDone),true,'사도별 만남 대사·도전 보류 종료');
    await page.evaluate(async()=>{
      const L=G.Scenes.land, before=L.runtime().busy, old={day:G.Game.newDay,disaster:G.Disaster.land,notes:G.Quest.showNotes,check:G.Disc.checkLand,onLand:G.OlympianApostles.onLand};
      G.Game.newDay=()=>[];G.Disaster.land=async()=>{};G.Quest.showNotes=async()=>{};G.Disc.checkLand=()=>({hits:[]});G.OlympianApostles.onLand=async()=>true;
      try{await L.runDay();if(L.runtime().busy!==before)throw Error('사도 만남 후 육상 조작 잠금 해제');}
      finally{G.Game.newDay=old.day;G.Disaster.land=old.disaster;G.Quest.showNotes=old.notes;G.Disc.checkLand=old.check;G.OlympianApostles.onLand=old.onLand;}
    });
    // 새 리라 미니게임은 실제 단추로 세 가락을 모두 연주한다.
    await page.evaluate(()=>{window.melodyRun=G.OlympianApostles.melody();});
    for(let round=0;round<3;round++){
      const notes=await page.locator('.olympian-score').textContent();await page.waitForTimeout(2750);
      for(const note of notes.split(' · '))await page.locator('.olympian-notes').getByRole('button',{name:note,exact:true}).click();
    }
    assert.equal(await page.evaluate(()=>window.melodyRun),true,'리라 세 가락 통과');
    await page.evaluate(()=>{window.melodyRun=G.OlympianApostles.melody();});
    await page.getByRole('button',{name:'물러난다',exact:true}).click();assert.equal(await page.evaluate(()=>window.melodyRun),false);
    const catalog=await browser.newPage();catalog.on('pageerror',e=>errors.push(e.message));catalog.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await catalog.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
    await catalog.goto((process.env.WEB_BASE ? new URL('catalog.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root,'catalog.html')).href),{waitUntil:'domcontentloaded',timeout:120000});
    assert.equal(await catalog.evaluate(()=>G.MATES.filter(m=>m.olympianApostle).length),12,'도감 사도 등록');
    assert.equal(await catalog.evaluate(()=>G.MATE.apostle_demeter.name),'멜리사');await catalog.close();
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify({...report,errors},null,2));console.log(JSON.stringify({ok:true,...report,errors}));
  } finally {clearTimeout(deadline);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
