/* 실제 사건 함수를 실행하고 대사·선택지·로그·그림 제목을 모은다. 전투 결과와 연출만 고정한다. */
module.exports=async function(){
 const samples=[],counts={},missing=[],seen=new Set();let scope='runtime',picks=[],battle='win',seaGo=false,npc;
 const save=[],patch=(o,k,v)=>{save.push([o,k,o[k]]);o[k]=v;};
 function check(t,kind='text'){
  if(typeof t!=='string')return;
  for(const ko of t.split('\f')){if(!/[가-힣]/.test(ko))continue;counts[scope]=(counts[scope]||0)+1;
   const tr=G.I18N.tr(ko,true);samples.push({scope,kind,ko,tr});
   if((!tr||/[가-힣]|⟦|⟧|\$\d/.test(tr))&&!seen.has(ko)){seen.add(ko);missing.push({scope,kind,ko,tr});}
  }
 }
 function fresh(city=0){
  const s=G.State.newGame({name:'제시카',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:70,int:80,mar:70,cha:80},sk:{speech:3},lg:G.LANGS.map(()=>3),diff:'normal'});
  s.date={y:1640,m:3,d:1};s.player.gold=1000000;s.player.items=[];s.mates=[];s.achv={};s.settings.res=.35;
  const c=G.CITY_DATA[city];s.loc={mode:'city',city,lon:c.lon,lat:c.lat};return s;
 }
 try{
  scope='person-suffix';
  const base=Object.keys(G.I18N.packs[G.I18N.lang].person.F).find(k=>k.length>1),generated={id:'__i18n_runtime_suffix',name:base+' (리스본)'};
  G.MATES.push(generated);try{check(generated.name,'generated-name');}finally{G.MATES.pop();}
  patch(G.UI,'say',async(t,w)=>{check(t,'say');if(w?.name)check(w.name,'speaker');});
  patch(G.UI,'ask',async(t,opts)=>{check(t,'ask');opts.forEach(o=>check(o.label,'choice'));const want=picks.shift();return (opts.find(o=>o.value===want&&!o.dis)||opts.find(o=>!o.dis)).value;});
  patch(G.UI,'toast',t=>check(t,'toast'));patch(G.State,'log',t=>check(t,'log'));
  patch(G.Game,'refreshHud',()=>{});patch(G.Game,'go',async(name,arg)=>{if(arg?.npc){npc=arg.npc;(npc.names||[]).forEach(n=>check(n,'ship'));(npc.myFleet||[]).forEach(n=>check(n.name,'ship'));}});
  patch(G.FamEv,'showPic',o=>{check(o.title,'picture');return {ready:Promise.resolve(),stop:async()=>{}};});
  patch(G.Achieve,'scene',async()=>{});patch(G.Achieve,'afterHire',async()=>{});
  patch(G.Scenes.land,'landBattle',async name=>{check(name,'enemy');return battle;});
  patch(G.Rel,'greatBattle',async spec=>{for(const k of ['foe','foeLabel','ask','fightLabel','noLabel','decline','lose'])check(spec[k],'battle');spec.names.forEach(n=>check(n,'ship'));check(spec.boss.line,'battle');check(spec.win.text,'battle');return seaGo;});
  scope='xiyou';const XY=G.XiYou,K=G.BALANCE.xiyou;
  fresh(K.sakai);await XY.hint();
  for(const choice of ['fight','pay','chant'])for(const result of ['win','lose']){
   fresh(K.sakai);battle=result;picks=[choice,result==='win'?'go':'no'];await XY.start();
  }
  for(const choice of ['talk','fight'])for(const result of ['win','lose']){
   const s=fresh(K.hangzhou);s.xiyou={step:1,how:{}};battle=result;picks=[choice];await XY.hangzhou();
  }
  fresh();await XY.huaguo();
  for(const choice of ['butterfly','boat','tower']){const s=fresh(K.ayutthaya);s.xiyou={step:2,how:{}};picks=[choice];await XY.ayutthaya();}
  for(const result of ['win','lose']){const s=fresh(K.malacca);s.xiyou={step:3,how:{}};battle=result;await XY.malacca();}
  for(const go of [false,true]){const s=fresh();s.xiyou={step:4,how:{}};seaGo=go;await XY.wokou();}
  fresh();await XY.afterWokou();
  for(const city of K.india){fresh(city);await XY.curry();}
  scope='crew-pets';patch(G.U,'chance',()=>true);patch(G.U,'pick',a=>a[0]);patch(G.CrewPets,'startFlight',async()=>true);
  for(const pet of G.BALANCE.crewPetRecovery.pets)for(const discipline of [20,90]){
   const s=fresh();s.loc.mode='sea';s.player.items=[{id:pet.item}];s.fleet.fatigue=discipline===20?80:100;s.fleet.discipline=discipline;s.day++;
   await G.CrewPets.daily();
  }
  for(const ev of G.CrewPets.antics)for(const discipline of [20,90]){
   const s=fresh();s.loc.mode='sea';s.player.items=G.BALANCE.crewPetRecovery.pets.map(p=>({id:p.item}));s.fleet.fatigue=discipline===20?80:100;s.fleet.discipline=discipline;s.day++;
   patch(G.U,'pick',a=>a.find(x=>x.id===ev.id)||a[0]);await G.CrewPets.interactionDaily();
  }
  scope='apostles';const OP=G.OlympianApostles;
  patch(G.Games,'duel',async()=>battle);patch(G.Games,'landWar',async()=>({res:battle}));patch(G.Games.pz,'hanoi',async()=>battle==='win');patch(G.Games.pz,'balance',async()=>battle==='win');patch(OP,'melody',async()=>battle==='win');
  for(const a of G.OLYMPIAN_APOSTLES){
   for(const result of ['lose','win']){
    const s=fresh();s.disc[a.discovery]={me:true,found:true};OP.afterFind(G.DISC[a.discovery]);const c=OP.city(a);s.loc={mode:'land',lon:c.lon,lat:c.lat,party:36,base:{type:'city',city:c.id,lon:c.lon,lat:c.lat}};
    battle=result;picks=['try','later'];await OP.meet(a.id);if(a.kind==='naval')await OP.finishNaval(npc,result);
    s.day+=2;picks=['try','hire'];await OP.meet(a.id);if(a.kind==='naval'&&s.olympianNaval)await OP.finishNaval(npc,'win');
   }
  }
  fresh();picks=['back'];await OP.open();
  scope='elves';const E=G.Elves;
  for(const sister of [false,true])for(const result of ['win','lose']){
   const s=fresh(),e=G.ELVES[0];if(sister)s.mates=[{id:E.sister(e),role:'first',loyal:90}];battle=result;picks=sister?['talk']:['duel'];
   await E.duel(e,'random','explore');s.day+=31;picks=['yes'];await E.comeBack(e.id,'explore');
  }
  scope='uninvited';const A=G.UninvitedApostles;
  for(const wave of [1,2])for(const result of ['lose','win']){
   const s=fresh();s.loc={mode:'sea',lon:-30,lat:25};s.achv.olympian_companions={d:16400301};s.uninvitedApostles={stage:wave};picks=['later','later'];
   const n=A.npc(wave);check(n.place,'battle');check(n.label,'battle');check(n.tacticNote,'battle');await A.afterBattle(n,result);
  }
  // 재회·고용 보류 뒤 제안과 두 번째 습격 문구도 실제 실행한다.
  const s=fresh();s.loc={mode:'sea',lon:-30,lat:25};s.achv.olympian_companions={d:16400301};s.uninvitedApostles={stage:3,offerSeen:true};s.mates=[{id:'apostle_poseidon',role:'first',loyal:90}];
  const scene=G.Game.sceneName;G.Game.sceneName='sea';try{picks=['later'];await A.onSeaDay();s.day+=100;picks=['join'];await A.onSeaDay();}finally{G.Game.sceneName=scene;}
  return {counts,samples,missing};
 }finally{for(const[o,k,v]of save.reverse())o[k]=v;}
};
