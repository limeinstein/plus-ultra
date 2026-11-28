/* 남녀 가족 장면 동등성·실제 재생·출산 연결·사망 원인·공연 교대·1700년 종료. */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = process.env.OUT || path.join(ROOT, 'artifacts/life-scenes-20261127');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], report = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      localStorage.setItem('pu.lang', 'ko');
      window.requestAnimationFrame = cb => (cb.name === 'loop'||String(cb).includes('.frameDue(')&&String(cb).includes('.scene.update(')) ? 0 : setTimeout(() => cb(performance.now()), 16);
    });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => {
      window.qaFresh = function (g) {
        const sk = {}; G.SKILLS.forEach(x => sk[x.id] = 0);
        const s = G.Game.state = G.State.newGame({ name: '장면 검사', nation: 'PT', job: 'explorer', g, age: 30, birth: {m:1,d:1}, st: {str:60,int:60,mar:60,cha:60}, sk, lg: G.LANGS.map(() => 3), diff:'normal' });
        s.date={y:1520,m:6,d:1};s.day=4000;s.loc={mode:'city',city:0,lon:-9.1,lat:38.7};s.player.home=0;
        s.player.kids=[{name:'아이',sex:'f',born:{y:1512,m:1,d:1},bond:50,st:{str:50,int:50,mar:50,cha:50},sk:{},lg:[],edu:{}}];
        const man=G.MATES.find(d=>d.g!=='f'&&!d.minor&&!d.sib&&!d.wed&&!d.eventOnly&&!(G.Romance&&G.Romance.pairOf(d.id)));
        s.mates=[{id:man.id,role:'first',aff:90,loyal:90}];
        if(g==='f')s.player.husbands=[{id:man.id,wed:3500,no:1}];else s.player.wife=Object.keys(G.MAID)[0];
        return s;
      };
      window.qaSaid=[];
      G.UI.say=async (t)=>{qaSaid.push({text:String(t),img:document.querySelector('.famscene img')?.getAttribute('src')});};
      G.UI.ask=async (t,o)=>o.find(x=>!x.dis&&!x.disabled)?.value;
      G.UI.alert=async()=>{};G.UI.toast=()=>{};G.Game.refreshHud=()=>{};
    });
    report.family=await page.evaluate(async()=>{
      const result={count:G.FAMILY_EVENTS.length,played:[],bad:[],femaleLines:[],images:[]};
      for(const sex of ['m','f']){
        qaFresh(sex);
        for(const ev of G.FAMILY_EVENTS){
          const s=qaFresh(sex),L=G.FamEv.mainWife();
          if((ev.need||[]).includes('lover')){L.kind='lover';L.maid=true;}
          if((ev.need||[]).includes('maidwife')){L.maid=true;L.mate=false;}
          if((ev.need||[]).includes('matewife')){L.mate=true;L.maid=false;}
          L.preg=true;
          const hk=G.FamEv.homeKids(),cs=G.FamEv.cast({love:L,kids:hk.kids,babies:[],witness:true,aboard:true,mate:true,together:(ev.need||[]).includes('together'),days:200,npc:{name:'주례'}});
          qaSaid=[];const ok=await G.FamEv.play(ev,cs);
          result.played.push(sex+':'+ev.id+':'+ok);
          if(!ok)result.bad.push(sex+':'+ev.id);
          if(qaSaid.some(x=>!x.img||!x.img.includes(sex==='f'?'family-events/female/':'family-events/')))result.bad.push('image:'+sex+':'+ev.id);
          if(sex==='f'&&qaSaid.some(x=>/사모님|아내가 아이|아버지 배에|아버지의 손/.test(x.text)))result.femaleLines.push(ev.id);
        }
      }
      return result;
    });
    assert.equal(report.family.count,38);assert.deepEqual(report.family.bad,[]);assert.deepEqual(report.family.femaleLines,[]);
    report.dates=await page.evaluate(async()=>{
      const s=qaFresh('f'),d=G.MATE[s.mates[0].id];s.player.husbands=[];
      const before=G.FamEv.canMateDate(d);await G.FamEv.mateDate(G.CITY_DATA[0],d);
      const after=G.FamEv.canMateDate(d);s.day+=7;const later=G.FamEv.canMateDate(d);
      return {before,after,later,aff:s.mates[0].aff};
    });
    assert(report.dates.before&&!report.dates.after&&report.dates.later);assert(report.dates.aff>90);
    report.mother=await page.evaluate(async()=>{
      const s=qaFresh('f'),dad=s.mates[0].id;
      s.player.pregSelf={since:s.day-45,due:s.day+210,told:false,dad};G.Mother.daily();
      const queued=!!s.motherTodo.news, oldBusy=G.UI.busy,oldCityBusy=G.Scenes.city.busy,oldScene=G.Game.scene,oldName=G.Game.sceneName;
      G.UI.busy=()=>false;G.Scenes.city.busy=()=>false;G.Game.scene=null;G.Game.sceneName='city';qaSaid=[];
      try{G.Mother.tick();for(let i=0;i<300&&G.Mother.running;i++)await new Promise(r=>setTimeout(r,10));}
      finally{G.UI.busy=oldBusy;G.Scenes.city.busy=oldCityBusy;G.Game.scene=oldScene;G.Game.sceneName=oldName;}
      return {queued,said:qaSaid.map(x=>x.text),earlyLie:!!s.player.pregSelf.lie};
    });
    assert(report.mother.queued);assert(!report.mother.earlyLie);assert(report.mother.said.some(x=>/내 안에서/.test(x)));
    report.birth=await page.evaluate(async()=>{
      const s=qaFresh('f'),dad=s.mates[0].id,oldCount=s.player.kids.length;
      s.player.pregSelf={since:s.day-266,due:s.day,told:true,sex:'f',dad,gen:G.Mother.genSnap(dad),lie:{kind:'captain'}};
      G.Mother.daily();const todo=s.motherTodo,choose=G.UI.choose;qaSaid=[];
      G.UI.choose=async(t,opts)=>opts.find(x=>x&&!x.disabled&&!x.dis).value;
      try{await G.Mother.birth(todo);}finally{G.UI.choose=choose;}
      const born=s.player.kids.slice(oldCount);
      return {n:born.length,named:born.every(k=>!!k.name&&!k.unnamed),father:born.every(k=>k.father===dad),hp:s.player.hp,seen:qaSaid.some(x=>x.img&&x.img.includes('family-events/female/19_birth_newborn_hands'))};
    });
    assert(report.birth.n>=1&&report.birth.named&&report.birth.father&&report.birth.seen);assert(report.birth.hp>0);
    report.endings=await page.evaluate(()=>{
      const result=[];
      for(const sex of ['m','f']){qaFresh(sex);for(const [code] of G.ENDING_SCENES){const ev=G.Ending.scene(code==='era'?'era':'death',code);result.push({sex,code,img:ev.img,exists:G.Img.has(ev.img)});}}
      const s=qaFresh('f');s.loc.mode='sea';s.fleet.food=0;const starving=G.Ending.cause('death');s.loc.mode='city';s.player.hp=0;const sick=G.Ending.cause('death');
      G.Ending.noteDeath('mutiny');const saved=JSON.parse(JSON.stringify(s));const old=G.Game.state;G.Game.state=saved;const restored=G.Ending.scene('death').cause;G.Game.state=old;
      return {result,starving,sick,restored};
    });
    assert.equal(report.endings.result.length,28);assert(report.endings.result.every(x=>x.exists&&x.img.startsWith(`endings/${x.sex}/${x.code}`)));assert.equal(report.endings.starving,'starvation');assert.equal(report.endings.sick,'illness');assert.equal(report.endings.restored,'mutiny');
    report.deathPlayback=await page.evaluate(async()=>{
      const s=qaFresh('f');qaSaid=[];await G.Ending.playDeath('mutiny');const first=qaSaid.slice();await G.Ending.playDeath('mutiny');
      const clean=G.Ending.scene('death',null,qaFresh('m')).cause;
      return {first,count:qaSaid.length,saved:s.player.deathScene,clean};
    });
    assert.equal(report.deathPlayback.first.length,1);assert.equal(report.deathPlayback.count,1);assert(report.deathPlayback.saved.shown);assert.equal(report.deathPlayback.saved.cause,'mutiny');assert.equal(report.deathPlayback.clean,'peace_home');
    report.concerts=await page.evaluate(()=>{
      const s=qaFresh('f');s.song={concerts:0};s.mates=['sy_woldam','sy_hwanggyu','sy_imcheosa'].map(id=>({id}));
      const kr=G.CITY_DATA.find(c=>c.style==='kr'),a=[];for(let i=0;i<2;i++){s.song.concerts=i;a.push(G.SongStory.concertArt(kr));}
      s.mates.pop();const trio=[];for(let i=0;i<2;i++){s.song.concerts=i;trio.push(G.SongStory.concertArt(kr));}
      s.mates.pop();const absent=G.SongStory.concertArt(kr);
      return {a,trio,absent};
    });
    assert.deepEqual(report.concerts.a,['song/concerts/kr','song/concerts/kr_fan_20261127']);assert.deepEqual(report.concerts.trio,['song/concerts/kr_trio','song/concerts/kr_trio_20261127']);assert.equal(report.concerts.absent,null);
    for(const [sex,key] of [['f','17_pregnancy_quiet_touch'],['f','41_family_sickbed'],['f','42_family_holiday'],['m','41_family_sickbed']]){
      await page.evaluate(([sex,key])=>{qaFresh(sex);window.qaPic=G.FamEv.showPic({img:'family-events/'+key,title:'가족의 시간'});},[sex,key]);
      await page.waitForFunction(()=>document.querySelector('.famscene img')?.naturalWidth>0);
      await page.waitForTimeout(600);await page.screenshot({path:path.join(OUT,`game-${sex}-${key}.png`)});await page.evaluate(()=>qaPic.stop());
    }
    for(const sex of ['m','f']){
      await page.evaluate(sex=>{qaFresh(sex);G.UI.fade=fn=>fn();window.qaEnding=G.Ending.show('death','prison');},sex);
      await page.waitForFunction(()=>document.querySelector('.ending-event img')?.naturalWidth>0);
      await page.screenshot({path:path.join(OUT,`game-death-${sex}.png`)});
      await page.getByRole('button',{name:'타이틀로',exact:true}).click();await page.evaluate(()=>qaEnding);
      await page.evaluate(sex=>{qaFresh(sex);G.Game.state.date={y:1700,m:1,d:1};window.qaEra=G.EraEnd.mount();qaEra.classList.add('on','dated','lift','dawn','done');qaEra.querySelector('.ee-text').innerText=G.EraEnd.LINES.at(-1).join('\n');qaEra.querySelector('.ee-finis').textContent='GAME OVER · 1700';qaEra.querySelector('.ee-skip').hidden=true;qaEra.querySelector('.ee-next').hidden=false;},sex);
      await page.waitForTimeout(800);await page.screenshot({path:path.join(OUT,`game-era-${sex}.png`)});await page.evaluate(()=>qaEra.remove());
    }
    // 모든 파일은 브라우저에서도 실제로 해독 가능해야 한다.
    const files=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/life_scenes_20261127/assets.json'),'utf8'));
    report.decoded=await page.evaluate(async keys=>{for(const key of keys){const im=new Image();im.src=G.Img.src(key);await im.decode();if(im.naturalWidth!==1152||im.naturalHeight!==512)throw Error(key);}return keys.length;},files.map(x=>x.key));
    assert.equal(report.decoded,75);assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(OUT,'browser-checks.json'),JSON.stringify({...report,...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),errors},null,2));
    console.log('통과: 가족 38종 × 남녀 실제 재생, 데이트 간격·호감, 임신 소식, 남녀 종료 28장, 기존·신규 공연, 그림 75장 해독, 콘솔 오류 0');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
