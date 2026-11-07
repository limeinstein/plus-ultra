/* 일곱 해적섬: 실제 그림 선택·해독·거리 보행·대화·본부 진입, file://와 도감. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/pirate-islands-20261107/runtime');
const zones = process.argv.slice(2);
(async () => {
  fs.mkdirSync(OUT, {recursive:true});
  const browser = await chromium.launch({executablePath:process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors = [], failed = [], reports = [];
  try {
    const context = await browser.newContext({viewport:{width:1280,height:800}});
    const page = await context.newPage();
    await page.context().route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if(m.type()==='error') errors.push(m.text());});
    page.on('requestfailed', r => {if(r.resourceType()==='image')failed.push({url:r.url(),error:r.failure().errorText});});
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href, {waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(() => window.G && G.PirateIslandArt && G.Game.sceneName==='title' && !G.Scenes.title.bootPending, null, {timeout:120000});
    const list = await page.evaluate(zones => {
      const s = G.Game.state = G.State.newGame({name:'해적섬 그림 확인',nation:'PT',job:'adventurer',age:30,birth:{m:1,d:1},st:{str:65,int:65,mar:65,cha:65},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
      Object.assign(s.settings,{res:.35,sound:0,music:0});
      s.lair = {rev:{},held:{}};
      G.PIRATE_LAIRS.forEach(d => {s.lair.rev[d.zone]=s.day;s.lair.held[d.zone]=s.day;});
      G.Lair.apply();
      return G.PIRATE_LAIRS.filter(d=>!zones.length || zones.includes(d.zone)).map(d=>({zone:d.zone,id:d.id,place:d.place}));
    }, zones);
    assert(list.length>0);
    for (const d of list) {
      const report = await page.evaluate(async d => {
        const P=G.PirateIslandArt,I=G.Img,C=G.Scenes.city,SF=G.StreetFolk,c=G.CITY_DATA[d.id], rows=[];
        const check=(v,m)=>{if(!v)throw Error(d.zone+': '+m);};
        G.Game.state.loc.city=c.id;
        check(C.buildings(c).map(b=>b.kind).sort().join(',')==='harbor,inn,lairhq,tavern,trade','다섯 건물');
        check(C.B.lairhq.paint==='lairhq','본부 실내');
        for (const b of P.buildings) for (const kind of ['exterior','interior']) {
          const key=I.pick(I.chain[kind](b,c)),want='pirate-islands/'+d.zone+'/'+kind+'/'+b;
          check(key===want,'지역별 '+kind+' '+b+' '+key);
          const im=await I.load(key); check(im && im.naturalWidth>0,'해독 '+key);
          rows.push({key,w:im.naturalWidth,h:im.naturalHeight});
        }
        check(I.pick(I.chain.bg(c))==='pirate-islands/'+d.zone+'/street','전용 거리 배경');
        await I.load(I.pick(I.chain.bg(c)));
        for(const role of Object.keys(P.roles)) {
          const face=I.pick(I.chain.npc(role,c)),half=I.pick(I.chain.npcHalf(role,c)),key=P.faceKey(c,role);
          check(face===key && half===key+'_half','얼굴과 무릎상 '+role);
          check(I.npcGender(role,c)===P.roles[role].g,'성별 '+role);
          for(const [k,w,h] of [[face,448,448],[half,1024,1536]]) {
            const im=await I.load(k);check(im&&im.naturalWidth===w&&im.naturalHeight===h,'초상 규격 '+k);
            check(G.PORTRAIT_FACES[k]&&G.PORTRAIT_FACES[k].box[2]>0,'얼굴 좌표 '+k);
          }
        }
        check(I.pick(I.chain.maidCity(c))===P.faceKey(c,'servant'),'여급 얼굴');
        check(I.pick(I.chain.maidCityHalf(c))===P.faceKey(c,'servant')+'_half','여급 무릎상');
        check(SF.types(c).length===6 && !SF.types(c).some(t=>['boy','girl','noble','librarian'].includes(t)),'성인 해적 출신 여섯 직업');
        const walks=[];
        for(const type of SF.types(c)) {
          const f=SF.make(type,c,3000,700,768,'qa:'+type),key=P.walkKey(c,type),im=await I.load(key);
          check(f.frames.length===8&&f.frames.every(fr=>fr.k===key),'전용 보행 '+type);
          check(im&&im.naturalWidth===1520&&im.naturalHeight===888,'시트 규격 '+type);
          check(f.face.half[0]===P.faceKey(c,P.roleOf(key.split('/').pop()))+'_half','보행과 대화 인물 일치 '+type);
          f.state='walk';f.x=700;f.target=1200;f.v=60;f.ph=0;
          const before=f.x;SF.update([f],.25,500);check(f.x>before&&f.ph>0,'실제 보행 갱신 '+type);
          const cv=document.createElement('canvas');cv.width=500;cv.height=300;
          const ctx=cv.getContext('2d');f.x=250;f.y=280;f.sc=1;
          SF.draw(ctx,f,0,false);check(ctx.getImageData(0,0,500,300).data.some((v,i)=>i%4===3&&v>0),'보행 그리기 '+type);
          walks.push({type,key,name:f.name});
        }
        const originalSay=G.UI.say,said=[];
        G.UI.say=async(text,who)=>{said.push({text,half:who&&who.half});};
        try {const f=SF.make('merchant',c,3000,700,768,'qa:talk');await SF.talk(f,c);check(said[0].text===P.regions[c.lair].line,'섬의 해적 생활 대화');} finally{G.UI.say=originalSay;}
        const normal=G.CITY_DATA[0];
        check(!I.chain.exterior('tavern',normal)[0].startsWith('pirate-islands/'),'일반 도시 외관');
        check(SF.types(normal).includes('boy'),'일반 도시 주민');
        return {zone:d.zone,place:d.place,buildings:rows,walks};
      },d);
      await page.evaluate(d => {
        G.UI.toast=()=>{};
        G.Game.go('city',{cityId:d.id,load:true});
      },d);
      await page.waitForFunction(id=>G.Town.active()&&G.Town.city().id===id&&!G.Scenes.city.isBusy(),d.id,{timeout:60000});
      await page.evaluate(async d => {
        const st=G.Town.runtime();
        if(!st || st.city.id!==d.id)throw Error('실제 거리 진입 '+d.zone);
        if(!st.folks.length || st.folks.some(f=>!G.PirateIslandArt.walkKey(st.city,f.type)))throw Error('실제 거리의 해적 주민');
        await G.Img.preload(st.folks.map(f=>[G.PirateIslandArt.walkKey(st.city,f.type)]),15000);
      },d);
      await page.waitForTimeout(350);
      await page.screenshot({path:path.join(OUT,d.zone+'_street.png')});
      for (const b of ['harbor','trade','tavern','inn','lairhq']) {
        const png=await page.evaluate(({d,b})=>G.Scenes.city.interior(b,G.CITY_DATA[d.id]).toDataURL('image/png').split(',')[1],{d,b});
        fs.writeFileSync(path.join(OUT,d.zone+'_'+b+'_interior.png'),Buffer.from(png,'base64'));
      }
      // 실제 본부 진입에서 전용 배경과 갑판장 대화가 함께 선택된다.
      const visit=await page.evaluate(async()=>{
        const C=G.Scenes.city,oldSay=G.UI.say,oldFocus=G.Town.focusOn;let seen=null;
        G.Town.focusOn=async()=>{};
        G.UI.say=async(t,w)=>{seen={name:w.name,face:G.Img.pick(G.Art.portraitKeys(w.portrait)),half:G.Img.pick(w.half)};};
        try{await C.visit('lairhq');return seen;}finally{G.UI.say=oldSay;G.Town.focusOn=oldFocus;}
      });
      assert(visit && visit.half==='portraits/npc/pirate-islands/'+d.zone+'/boatswain_half',JSON.stringify(visit));
      await page.screenshot({path:path.join(OUT,d.zone+'_headquarters.png')});
      report.headquarters=visit;reports.push(report);
      console.log('✓ '+d.place+' 외부·내부 10장, 주민 여섯 얼굴·무릎상·보행·본부 진입');
    }
    // 무릎상 대화까지 실제 UI에서 확인한다.
    const d=list[0];
    await page.evaluate(async d=>{
      const c=G.CITY_DATA[d.id];G.Game.state.loc.city=d.id;G.Game.refreshHud();G.Town.hidden(true);G.Game.setScene(G.Scenes.city.interior('trade',c));
      G.UI.say('전에는 전리품 몫을 셌고, 지금은 물건값을 세지요.',G.Scenes.city.npc('trader','장물상'));
    },d);
    await page.waitForTimeout(500);
    await page.screenshot({path:path.join(OUT,'npc_dialogue.png')});
    const catalog=await page.context().newPage();
    catalog.on('pageerror',e=>errors.push('도감: '+e.message));
    catalog.on('console',m=>{if(m.type()==='error')errors.push('도감: '+m.text());});
    await catalog.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href,{waitUntil:'domcontentloaded'});
    await catalog.waitForFunction(()=>window.G&&G.PirateIslandArt,null,{timeout:30000});
    assert.deepStrictEqual(errors,[],'브라우저 오류');
    assert.deepStrictEqual(failed,[],'실패한 그림 요청');
    fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({reports,errors,failed},null,2));
    console.log('✓ file:// 게임·도감 오류 0, 그림 요청 실패 0');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
