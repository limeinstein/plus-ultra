/* 기존 항구의 날짜별 총독, 건물·후원 계약 경로, 임명과 저장 복원을 file:// 게임에서 검사한다. */
'use strict';
const assert = require('node:assert/strict');
const fs=require('fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
(async function () {
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width:900,height:540}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.addInitScript(()=>{localStorage.setItem('pu.lang','ko');window.requestAnimationFrame=()=>0;});
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.resolve(__dirname,'../index.html')).href),{waitUntil:'load',timeout:180000});
    const report=await page.evaluate(async ()=>{
      const O=G.Governors, SP=G.Sponsor, seats=G.GOVERNOR_SEATS, C=G.Scenes.city, U=G.U;
      function check(a,b,tag){if(a!==b)throw Error(tag+' '+JSON.stringify(a)+' != '+JSON.stringify(b));}
      G.State.newGame({name:'항구검사',nation:'PT',job:'adventurer',age:24,birth:{m:1,d:1},st:{str:65,int:65,mar:65,cha:65},sk:{},lg:{},diff:'normal'});
      const s=G.Game.state;
      function date(n){s.date={y:Math.floor(n/10000),m:Math.floor(n/100)%100,d:n%100};}
      function role(id,n,expected){date(n);check(SP.holder(G.SPONSOR[id]),expected,id+' '+n);}
      role('pt_funchal',14800101,'주앙 곤살브스 다 카마라 2대');
      role('pt_macau',16230706,null); role('pt_macau',16230707,'프란시스쿠 드 마스카레냐스');
      role('pt_macau',16260718,'프란시스쿠 드 마스카레냐스');role('pt_macau',16260719,'필리프 로부');
      role('pt_macau',16971001,'총독부 접견 서기관');role('pt_macau',17001231,'디오구 드 멜루 이 삼파이우');
      role('pt_india',15050911,null); role('pt_india',15050912,'프란시스쿠 드 알메이다');
      role('pt_india',15091103,'프란시스쿠 드 알메이다');role('pt_india',15091104,'아폰수 드 알부케르크');
      check(G.SPONSOR.pt_india.city,154,'코친');date(15310101);check(G.SPONSOR.pt_india.city,150,'고아');
      role('en_winthrop',16350506,'존 헤인스');role('en_winthrop',16420518,'존 윈스럽');
      role('fr_champlain',16310101,null);role('es_peru',15511015,'안토니오 데 멘도사');
      const ids=new Set(), buildings=new Set();
      function num(v){return v<10000?v*10000+101:v<1000000?v*100+1:v;}
      for(const [id,def] of Object.entries(seats)){
        const sp=G.SPONSOR[id];check(G.SPONSORS.filter(x=>x.id===id).length,1,id+' 후원자 등록');
        for(const t of def.terms){
          date(num(t[0]));check(SP.holder(sp),t[3],id+' 첫날');
          ids.add(t[2]);
          const face=SP.face(sp), key=G.GOVERNOR_PORTRAITS[t[2]]||'portraits/sponsors/governors/'+t[2];
          check(G.Img.pick(G.Art.portraitKeys(face.portrait)),key,t[2]+' 얼굴');check(G.Img.pick(face.half),key+'_half',t[2]+' 인물');
        }
        for(const [n,expected] of [[num(def.windows[0][0]),def.profile],...def.moves.map(m=>[num(m[0]),m[2]])]){
          date(n); const town=G.CITY_DATA[sp.city];buildings.add(expected);
          check(G.Img.pick(G.Img.chain.exterior(sp.bld,town,id)),'exteriors/governors/'+expected,id+' 외관');
          check(G.Img.pick(C.interiorKeys(sp.bld,town,id)),'interiors/governors/'+expected,id+' 실내');
        }
      }
      check(ids.size,221,'실명 인원');check(buildings.size,17,'건물 종류');
      date(16320101);
      for(const id of ['pt_india','pt_macau']){
        const sp=G.SPONSOR[id], town=G.CITY_DATA[sp.city], b=C.buildings(town).find(b=>b.arg===id);
        if(!b)throw Error('총독부 입구 '+id);
        check(C.B[b.kind].sp(town,b.arg),sp,'건물의 후견인 '+id);
        const labels=C.B[b.kind].menu(town,b.arg).map(x=>x.label);
        for(const label of ['모험 제안','보고','이야기'])check(labels.includes(label),true,id+' '+label);
        check(O.canFound(town),false,'기존 총독부에 중복 설립');
      }
      const town=G.CITY_DATA[148], owner=G.R.myOwnerName(), price=G.BALANCE.colonySp.officeCost;
      const macau=G.CITY_DATA[173];date(16230706);s.player.gold=price;
      check(O.canFound(macau),true,'오문 상주 총독 부임 전 직접 설립');
      const earlier=O.found(macau);check(SP.present(earlier),true,'오문 임명 총독 알현');
      date(16230707);check(SP.present(earlier),false,'오문 역사 직책 승계');
      check(SP.present(G.SPONSOR.pt_macau),true,'오문 초대 상주 총독');
      date(16320101);
      s.conquests=Object.assign({},s.conquests,{[town.id]:{owner,from:'구자라트',date:16310101,day:1}});
      check(O.canFound(town),true,'확보한 디우');s.player.gold=price-1;check(O.found(town),null,'자금 부족');
      s.player.gold=price+100;const fresh=O.found(town);if(!fresh)throw Error('총독부 설립');
      check(s.player.gold,100,'설립비');check(O.found(town),null,'중복 설립');
      check(SP.present(fresh),true,'임명 총독');check(C.buildings(town).some(x=>x.arg===fresh.id),true,'새 거리 입구');
      const first=SP.holder(fresh);s.contract={sponsor:fresh.id};SP.rel(fresh.id).trust=49;
      const saved=JSON.parse(JSON.stringify(s.governorOffices));
      delete s.governorOffices;O.restore();check(!!G.SPONSOR[fresh.id],false,'다른 게임에 남은 사람');
      s.governorOffices=saved;O.restore();O.restore();const again=G.SPONSOR[fresh.id];
      check(SP.holder(again),first,'임명 복원');check(SP.rel(again.id).trust,49,'신뢰 복원');check(s.contract.sponsor,again.id,'계약 복원');
      check(G.SPONSORS.filter(x=>x.id===again.id).length,1,'중복 명부');
      s.conquests[town.id].owner='네덜란드';check(SP.present(again),false,'정권 교체');check(SP.caretaker(again),true,'기존 계약 보고');
      const co=G.Colony, entry={id:1000,key:co.sites()[0].key,nat:'PT',owner:'포르투갈',name:'새 항구',stage:3,built:[]};
      s.colony={list:[entry],call:null};co.apply();
      const custom=G.CITY_DATA[entry.id];
      check(O.canFound(custom),false,'개척도시 3단계');
      entry.stage=4;co.sync(entry);check(O.canFound(custom),true,'개척도시 4단계');
      s.player.gold=price;const deputy=O.found(custom);
      check(deputy.title,'총독부 대리','대리 임명');
      check(C.buildings(custom).some(b=>b.arg===deputy.id),true,'대리 집무실');
      check(C.buildings(custom).some(b=>b.kind==='govhall'),true,'제독의 총독부');
      const slot=4, result=await G.State.saveAsync(slot);
      check(result.ok,true,'항해일지 저장');
      const loaded=await G.State.loadAsync(slot);check(loaded.governorOffices[entry.id].name,SP.holder(deputy),'항해일지 총독 이름');
      G.Game.state=loaded;G.Colony.apply();G.ColonySp.apply();
      check(SP.present(G.SPONSOR[deputy.id]),true,'항해일지 대리 복원');
      check(SP.rel(again.id).trust,49,'항해일지 신뢰도');check(loaded.contract.sponsor,again.id,'항해일지 후원 계약');
      return {people:ids.size,offices:Object.keys(seats).length,buildingPairs:buildings.size,appointmentTerms:again.holders.length};
    });
    const output=process.env.OUT||path.join(__dirname,'../artifacts/governors_browser');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'browser-checks.json'),JSON.stringify({...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),report,errors},null,2));
    assert.deepEqual(errors,[]);console.log(JSON.stringify(report));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
