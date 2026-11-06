/* 실제 얼굴·무릎상 선택, 새 사건·업적의 장면 표시와 오류 시 정리를 file://에서 검사한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/missing-event-art-20261106/runtime');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/missing_event_art_20261106_prompts.json'), 'utf8'));
(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.G && G.Lair && G.FairyHome && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      const s = G.Game.state = G.State.newGame({name: '그림 확인', nation: 'PT', job: 'adventurer', age: 30, birth: {m: 1, d: 1}, st: {str: 65, int: 65, mar: 65, cha: 65}, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal'});
      Object.assign(s.settings, {res: .35, sound: 0, music: 0});
    });
    const inventory = await page.evaluate(() => {
      const has = k => !!G.IMAGE_FILES[k];
      const hist = Object.keys(G.HIST_FIG).map(id => {const keys = G.Hist.faceKeys(id); return {id, name: G.HIST_FIG[id].name, face: keys.find(has), half: keys.map(k => k+'_half').find(has)};});
      const mates = G.MATES.filter(m => m.eventOnly || m.legend || m.tale).map(m => {const keys = ['portraits/mates/'+m.id, m.face, 'portraits/legendary/'+m.id].filter(Boolean); return {id:m.id, name:m.name, face:keys.find(has), half:[m.halfKey,...keys.map(k=>k+'_half')].filter(Boolean).find(has)};});
      const achievements = G.Achieve.list().map(a => {const ev = G.ACHV_EVENTS[a.id] || {}; return {id:a.id, name:a.name, key:ev.pic || (a.id==='montcrew'?'legend-events/montcrew_oath':a.id==='happily'?'legend-events/happily_after_all':'achievement-events/'+a.id)};});
      return {hist, mates, achievements, files:G.IMAGE_FILES};
    });
    const real = key => key && inventory.files[key] && fs.existsSync(path.join(ROOT, 'images', inventory.files[key]));
    const missing = {
      historical:inventory.hist.filter(r=>!real(r.face)||!real(r.half)),
      story:inventory.mates.filter(r=>!real(r.face)||!real(r.half)),
      achievements:inventory.achievements.filter(r=>!real(r.key))
    };
    const audit = {historical:inventory.hist.length, story:inventory.mates.length, achievements:inventory.achievements.length, missing};
    fs.writeFileSync(path.join(OUT, 'inventory.json'), JSON.stringify(audit,null,2));
    assert(Object.values(missing).every(r=>!r.length), JSON.stringify(missing));
    const checks = await page.evaluate(async rows => {
      const out = [];
      const current = [];
      G.PIRATE_LAIRS.forEach(d => {
        d.chiefs.forEach((c,i) => current.push({id:'lairchief_'+d.zone+'_'+i,name:c.name}));
        d.mates.forEach((m,i) => current.push({id:'lair_'+d.zone+'_'+(i+1),name:m[0]}));
      });
      if(current.length!==rows.length || current.some(c=>!rows.some(r=>r.id===c.id&&r.name===c.name))) throw Error('현재 두목·간부 명부와 제작 목록 불일치');
      for (const row of rows) {
        const sp = G.Captains.speaker({kind:'pirate', zone:row.zone, cap:{id:row.id,name:row.name,g:row.g}});
        const face = G.Img.pick(G.Art.portraitKeys(sp.portrait)), half = G.Img.pick(sp.half);
        if (face!==row.key || half!==row.key+'_half') throw Error('전용 그림 선택: '+row.id+' '+face+' '+half);
        for (const [key,w,h] of [[face,448,448],[half,1024,1536]]) {
          const img = await G.Img.load(key), coord = G.PORTRAIT_FACES[key];
          if (!img || img.naturalWidth!==w || img.naturalHeight!==h || !coord || coord.box[2]<=0) throw Error('해독·규격·얼굴 좌표: '+key);
          const c = document.createElement('canvas'); c.width=c.height=1;
          const ctx=c.getContext('2d'), corners=[[0,0],[w-1,0],[0,h-1],[w-1,h-1]];
          const alpha=corners.map(([x,y])=>{ctx.clearRect(0,0,1,1);ctx.drawImage(img,x,y,1,1,0,0,1,1);return ctx.getImageData(0,0,1,1).data[3];});
          if(Math.min(...alpha)>8)throw Error('배경 투명도: '+key);
        }
        out.push({id:row.id,face,half});
      }
      return out;
    }, plan.portraits);
    for (const row of plan.portraits) {
      for (const mode of ['half','face']) {
        await page.evaluate(({row,mode})=>{
          const sp=G.Captains.speaker({kind:'pirate',zone:row.zone,cap:{id:row.id,name:row.name,g:row.g}});
          if(mode==='face')sp.noStand=true;
          window.__artDialog=G.UI.say(row.place+' — '+row.name+'의 전용 인물화.',sp);
        },{row,mode});
        await page.waitForSelector(mode==='half'?'.dlg-actor.active.tall':'.dlg .pframe');
        await page.waitForTimeout(300);
        await page.screenshot({path:path.join(OUT,row.id+'_'+mode+'.png')});
        await page.keyboard.press('Enter');
        await page.waitForFunction(()=>!document.querySelector('.dlg'));
        await page.evaluate(()=>window.__artDialog);
      }
    }
    const scenes = await page.evaluate(async plan=>{
      const out=[];
      for(const row of plan.scenes.concat([{id:'dreamcome',key:'achievement-events/dreamcome'}])){
        const img=await G.Img.load(row.key);
        if(!img||img.naturalWidth!==1881||img.naturalHeight!==836)throw Error('장면 그림 해독·규격: '+row.key);
        out.push({id:row.id,key:row.key});
      }
      const UI=G.UI, oldSay=UI.say, oldAlert=UI.alert, oldConfirm=UI.confirm, oldWindow=UI.window, oldAfter=G.Achieve.afterEvent;
      const expect=async key=>{
        const ready=G.FamEv.pendingPic();if(ready)await ready;
        const el=document.querySelector('.famscene img');
        if(!el||!el.complete||!el.naturalWidth||el.src!==new URL(G.Img.src(key),location.href).href)throw Error('사건 중 실제 장면: '+key);
        if(!document.querySelector('#ui.scenepic-on'))throw Error('장면 앞 인물 중복');
      };
      try{
        UI.alert=async()=>{};UI.confirm=async()=>true;UI.window=()=>({result:Promise.resolve(1)});G.Achieve.afterEvent=async()=>{};
        for(const d of G.PIRATE_LAIRS){
          UI.say=async()=>expect('legend-events/lair_'+d.zone);
          const s=G.Game.state;
          s.lair={kills:{},rev:{},held:{},beat:{},cd:{},tell:[]};
          for(const kind of ['reveal','chief','hold']){
            s.lair.tell.push({kind,zone:d.zone,no:0,cap:{id:'lair_'+d.zone+'_1',name:d.mates[0][0],g:'m'}});
            await G.Lair.tell();
            if(document.querySelector('.famscene'))throw Error('소굴 장면 정리: '+kind);
          }
        }
        G.Game.state.lair.tell.push({kind:'chief',zone:'med',no:0});
        UI.say=async()=>{await expect('legend-events/lair_med');throw Error('__lair_cleanup_probe__');};
        let lairThrew=false;
        try{await G.Lair.tell();}catch(e){if(e.message==='__lair_cleanup_probe__')lairThrew=true;else throw e;}
        if(!lairThrew||document.querySelector('.famscene')||document.querySelector('#ui.scenepic-on'))throw Error('소굴 대사 오류 시 장면 정리');
        for(const id of ['dreamcome','pirateking']){
          UI.say=async()=>expect('achievement-events/'+id);
          await G.Achieve.scene(G.Achieve.list().find(a=>a.id===id));
          if(document.querySelector('.famscene'))throw Error('업적 장면 정리: '+id);
        }
        // 취소할 때 그림이 생기지 않고, 확인 후 대사 오류가 나도 그림이 남지 않는다.
        const s=G.Game.state,p=s.player;
        p.wife='cinderella';p.wives2=[];
        ['snow_white','sleeping_beauty','little_mermaid'].forEach((id,i)=>G.Wives.list().push({id,kind:'mate',city:23+i,house:true,aboard:false,wed:s.day,no:i+2}));
        UI.say=async()=>{};UI.confirm=async()=>false;
        if(await G.FairyHome.invite(G.CITY_DATA[p.home]))throw Error('취소한 초대');
        if(document.querySelector('.famscene'))throw Error('취소한 초대의 그림');
        UI.confirm=async()=>true;
        UI.say=async()=>{if(G.FamEv.pendingPic()||document.querySelector('.famscene')){await expect('achievement-events/dreamcome');throw Error('__cleanup_probe__');}};
        let threw=false;
        try{await G.FairyHome.invite(G.CITY_DATA[p.home]);}catch(e){if(e.message==='__cleanup_probe__')threw=true;else throw e;}
        if(!threw||document.querySelector('.famscene')||document.querySelector('#ui.scenepic-on'))throw Error('초대 오류 시 장면 정리');
      }finally{UI.say=oldSay;UI.alert=oldAlert;UI.confirm=oldConfirm;UI.window=oldWindow;G.Achieve.afterEvent=oldAfter;await G.FamEv.stopPic();}
      return out;
    },plan);
    for(const row of plan.scenes.concat([{id:'dreamcome',key:'achievement-events/dreamcome',title:'Dream Come True'}])){
      await page.evaluate(async row=>{window.__artPic=G.FamEv.showPic({img:row.key,title:row.title,noStand:true});await window.__artPic.ready;},row);
      await page.waitForTimeout(300);
      await page.screenshot({path:path.join(OUT,row.id+'_scene.png')});
      await page.evaluate(()=>window.__artPic.stop());
    }
    assert.deepStrictEqual(errors,[]);
    fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({audit,portraits:checks,scenes,errors},null,2));
    console.log(JSON.stringify({audit,portraits:checks.length,portraitFiles:checks.length*2,scenes:scenes.length,screenshots:checks.length*2+scenes.length,errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
