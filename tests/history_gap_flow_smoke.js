/* 역사 그림 연결: 실제 사건 진입·진행·작전 회의와 액자 정리를 함께 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let pw;try{pw=require('playwright');}catch(_){pw=require('../tools/procedural_art/node_modules/playwright-core');}
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/history-gap-art-20261029');
function ok(v,m){if(!v)throw new Error(m);}
(async()=>{
  const browser=await pw.chromium.launch({executablePath:process.env.BROWSER_EXE||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args:['--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:960,height:600}});
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:90000});
    const result=await page.evaluate(async()=>{
      await G.Game.ensureGeo();
      const seen=[],faces=[],stateChecks={},UI=G.UI;let choose='yes';
      function shot(){const imgs=[...document.querySelectorAll('.famscene img')];const im=imgs[imgs.length-1];return im?(decodeURIComponent(im.src).match(/legend-events\/([^/.]+)\./)||[])[1]:null;}
      UI.say=async(t,w)=>{const key=shot();if(key)seen.push(key);if(w&&w.portrait)faces.push({name:w.name,face:G.Img.pick(G.Art.portraitKeys(w.portrait)),half:G.Img.pick(w.half)});};
      UI.ask=async(t,opts)=>{const found=opts.find(o=>o.value===choose);return found?found.value:opts[0].value;};
      UI.alert=async()=>{};UI.toast=()=>{};UI.confirm=async()=>true;UI.fade=async fn=>fn();
      G.Game.refreshHud=()=>{};G.State.save=()=>{};G.Game.go=()=>{};
      function fresh(y,m,d){
        const sk={};G.SKILLS.forEach(x=>{sk[x.id]=1;});
        const s=G.State.newGame({name:'역사 그림 연결 검사',nation:'PT',job:'explorer',age:30,birth:{m:3,d:2},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>3),diff:'normal'});
        G.Game.state=s;s.date={y,m,d};s.player.gold=100000;s.settings.autosave=false;s.settings.res=.35;s.flags.prologue=true;
        s.loc={mode:'city',city:38,lon:G.CITY_DATA[38].lon,lat:G.CITY_DATA[38].lat};return s;
      }
      let s=fresh(1529,5,1);let r=G.Sponsor.rel('en_king');r.met=true;r.trust=60;
      await G.Court.onEnter(G.SPONSOR.en_king);stateChecks.petition=s.tudor&&s.tudor.div.stage===1;
      const menu=G.Court.palaceItems(G.SPONSOR.it_pope).find(x=>/특사/.test(x.label));
      if(!menu)throw new Error('교황 알현 메뉴 없음');await menu.onClick();stateChecks.rome=s.tudor.div.stage===2;
      s=fresh(1555,5,1);await G.Scenes.city.B.tower.enter(G.CITY_DATA[38]);
      const legate=G.Rel.speaker({legate:true});await UI.say('교황의 사절 초상 검사',legate);
      s=fresh(1543,5,1);s.barb={ok:1};choose='yes';await G.Barb.call(G.SPONSOR.es_crown);stateChecks.charles=s.barb.stage==='call';
      s.date={y:1543,m:11,d:1};s.loc={mode:'sea',lon:5.9,lat:43.0};await G.Barb.check();stateChecks.toulon=!!s.barb.toulon;
      s.date={y:1544,m:5,d:1};s.loc={mode:'city',city:28,lon:G.CITY_DATA[28].lon,lat:G.CITY_DATA[28].lat};choose='watch';await G.Barb.check();stateChecks.genoa=s.barb.stage==='done'&&s.barb.genoa==='watch';
      s=fresh(1588,8,1);s.tudor={div:{stage:0},eliz:{stage:2},knight:{day:s.day-2000,y:1583},calais:{rep:1,stage:'call'}};
      s.loc={mode:'sea',lon:1.8,lat:50.9};choose='no';await G.Tudor.check();stateChecks.calais=s.rel.battle.calais==='declined';
      s=fresh(1571,10,1);s.loc={mode:'sea',lon:21,lat:38.3};choose='no';await G.Rel.greatBattle(G.Rel.spec('lepanto'));stateChecks.lepanto=s.rel.battle.lepanto==='declined';
      const noLeakBefore=!document.querySelector('.famscene');
      let caught=false;try{await G.Hist.withScene('calais_council','정리 검사',async()=>{throw new Error('의도한 중단');});}catch(e){caught=e.message==='의도한 중단';}
      const cleanup=noLeakBefore&&caught&&!document.querySelector('.famscene')&&!document.getElementById('ui').classList.contains('scenepic-on');
      const fallback=await G.Hist.withScene('missing_scene_for_test','없는 장면',async()=>42);
      return {seen:[...new Set(seen)],faces,stateChecks,cleanup,fallback};
    });
    for(const [k,v]of Object.entries(result.stateChecks))ok(v,'사건 진행 실패: '+k);
    const specs=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/history_gap_art_prompts.json'),'utf8')).assets;
    for(const a of specs.filter(a=>a.type==='scene'))ok(result.seen.includes(a.id),'실제 사건에서 표시 안 된 장면: '+a.id);
    for(const id of ['gardiner','tudor_tower_guard','papal_legate'])ok(result.faces.some(f=>f.face==='portraits/history/'+id&&f.half==='portraits/history/'+id+'_half'),'실제 화자의 전용 초상 연결 실패: '+id);
    ok(result.cleanup,'중단 뒤 액자/화면 상태가 남음');ok(result.fallback===42,'없는 그림이 사건을 막음');ok(!errors.length,errors.join('\n'));
    fs.writeFileSync(path.join(OUT,'flow-results.json'),JSON.stringify({...result,errors},null,2));
    console.log('통과 — 사건 장면 10종·전용 화자 3명·진행 상태·중단 정리·누락 그림 대체, 콘솔 오류 0');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
