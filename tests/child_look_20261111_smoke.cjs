/* 옛 저장의 자녀 초상을 어머니의 그림 설정에 맞추고 성장 뒤에도 유지한다. */
'use strict';
const assert=require('assert'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files']});const errors=[];
 try{
  const p=await browser.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.resolve(__dirname,'../index.html')).href,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.G&&G.HomeLife&&G.Game.sceneName==='title',null,{timeout:120000});
  const rows=await p.evaluate(()=>{
   const s=G.State.newGame({name:'초상 시험',nation:'PT',job:'explorer',age:35,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'}),H=G.HomeLife,out=[];
   s.date={y:1520,m:6,d:1};
   for(const mother of ['snow_white','cinderella','sleeping_beauty','little_mermaid']){
    for(let n=0;n<20;n++){
     const k={name:'딸'+n,sex:'f',mother,born:{y:1500,m:1,d:n+1},portraitVariant:3};
     s.player.kids=[{name:'언니',sex:'f',mother,born:{y:1498,m:1,d:1}},k];
     const variant=H.variant(k),again=H.variant(JSON.parse(JSON.stringify(k))),key=G.Img.pick(H.chain(k,false));
     out.push({mother,variant,again,folder:k.lookFolder||'',key});
    }
   }
   const preserved={name:'딸',sex:'f',mother:'snow_white',portraitVariant:2,born:{y:1500,m:1,d:1}};
   out.push({preserved:H.variant(preserved)});
   return out;
  });
  for(const r of rows.filter(r=>r.mother)){
   const want={snow_white:2,cinderella:5,sleeping_beauty:5,little_mermaid:1}[r.mother];assert.equal(r.variant,want,r.mother);assert.equal(r.again,r.variant);assert(r.key&&r.key.includes('_age20_v'+want),'성년 초상 '+JSON.stringify(r));
  }
  assert.equal(rows.at(-1).preserved,2);
  const loaded=await p.evaluate(async()=>{
   const s=G.Game.state, H=G.HomeLife, I=G.Img;
   s.player.wife='rapunzel';
   let count=0;
   for(const mother of ['rapunzel','cathy','m_lis','m_1550_hs','m_1550_hor']){
    for(const sex of ['m','f']){
     const child={name:'첫아이',sex,born:{y:1500,m:1,d:1}};
     if(mother!==s.player.wife) child.mother=mother;
     const sibling={...child,name:'둘째',born:{y:1501,m:1,d:1}};
     s.player.kids=[child,sibling];
     for(const age of [10,20]){
      s.date={y:1500+age,m:6,d:1};
      const speaker=H.speaker(child);
      for(const half of [false,true]){
       const key='portraits/family/from_'+mother+'/'+(sex==='f'?'daughter':'son')+'_age'+age+(half?'_half':'');
       const picked=I.pick(half?speaker.half:G.Art.portraitKeys(speaker.portrait));
       if(picked!==key) throw Error('자녀 대화 그림: '+key+' / '+picked);
       const image=await I.load(key);
       if(!image||image.naturalWidth!==(half?1024:512)||image.naturalHeight!==(half?1536:512)) throw Error('자녀 그림 크기: '+key);
       if(!G.PORTRAIT_FACES[key]) throw Error('얼굴 위치: '+key);
       if(age===20){
        const player={generation:2,heir:{sex,artFamily:H.portraitFamily(child)}};
        if(I.pick(I.heirChain(player,half,age))!==key) throw Error('후계자 그림: '+key);
       }
       count++;
      }
     }
     s.date.y=1521;
     if(I.pick(H.chain(sibling,false)).includes('/from_')) throw Error('같은 성별의 둘째 그림: '+mother);
    }
   }
   return count;
  });
  assert.equal(loaded,40);
  const births=await p.evaluate(async()=>{
   const s=G.Game.state, W=G.Wives, F=G.Family, H=G.HomeLife, I=G.Img;
   const mothers=['cinderella','snow_white','sleeping_beauty','little_mermaid','elizaveta','scheherazade','w_morgan','w_circe','w_medea','w_bellezza'];
   const assets=new Set();
   let count=0;
   G.BALANCE.family.twins=0;
   for(const mother of mothers){
    const mate=G.MATE[mother];
    if(!mate||mate.g!=='f'||mate.old) throw Error('어머니 정보: '+mother);
    const witch=(G.WITCHES||[]).find(w=>w.id===mother);
    const bornYear=witch?witch.y[0]+3:1520;
    for(const main of [true,false]){
     s.date={y:bornYear,m:6,d:1};
     s.momAge={};
     s.player.kids=[];s.player.preg=null;
     s.player.wife=main?mother:'rapunzel';
     const second={id:mother,kind:'mate',city:s.player.home,house:true};
     s.player.wives2=main?[]:[second];
     const parent=main?s.player:second, key=main?'main':mother;
     if(F.momAge(mother)>45) throw Error('출산 나이: '+mother);
     for(const sex of ['m','f']){
      s.date={y:bornYear,m:6,d:1};
      if(!W.sexesOpen(key).includes(sex)) throw Error('임신 조건: '+mother+' '+sex);
      let preg;
      for(let i=0;i<128;i++){preg=W.newPreg(key,s.day,1);if(preg.sex===sex)break;}
      if(preg.sex!==sex||preg.gen.mom!==mother) throw Error('부모·성별 결정: '+mother+' '+sex);
      parent.preg=preg;s.day++;
      if(main) F.daily(); else W.daily();
      const newborn=s.player.kids[s.player.kids.length-1];
      if(parent.preg||newborn.sex!==sex||newborn.artFamily!=='from_'+mother) throw Error('출산 연결: '+mother+' '+sex);
      s.player.kids=JSON.parse(JSON.stringify(s.player.kids));
      const child=s.player.kids[s.player.kids.length-1];
      F.setKidName(child,sex==='f'?'별':'솔');
      for(const age of [10,20]){
       s.date.y=bornYear+age;
       const speaker=H.speaker(child);
       for(const half of [false,true]){
        const expected='portraits/family/from_'+mother+'/'+(sex==='f'?'daughter':'son')+'_age'+age+(half?'_half':'');
        const actual=I.pick(half?speaker.half:G.Art.portraitKeys(speaker.portrait));
        if(actual!==expected) throw Error('출생한 아이 그림: '+expected+' / '+actual);
        const im=await I.load(actual);
        if(!im||im.naturalWidth!==(half?1024:512)||im.naturalHeight!==(half?1536:512)||!G.PORTRAIT_FACES[actual]) throw Error('그림 크기·얼굴 위치: '+actual);
        if(age===20&&I.pick(I.heirChain({generation:2,heir:{sex,artFamily:child.artFamily}},half,age))!==expected) throw Error('후계자 그림: '+actual);
        assets.add(actual);
       }
      }
      count++;
     }
    }
   }
   return {count,assets:assets.size};
  });
  assert.deepEqual(births,{count:40,assets:80});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({migrated:rows.length-1,compatiblePreserved:true,familyPortraits:loaded,fairyBirths:births,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
