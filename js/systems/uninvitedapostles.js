/* 초대받지 못한 세 사도: 12명 고용 뒤 바다에서 2기 → 3기 동시 습격을 이겨 세 사람을 맞는다.
   사건 괴물은 세계 출몰·발견·재등장·전설 선수상 보상과 분리한다. 실제 함대 피해는 해전의 기존 규칙을 따른다. */
(function(G){
  'use strict';
  var A=G.UninvitedApostles={}, U=G.U, UI=G.UI, busy=false;
  function S(){return G.Game.state;}
  function K(){return G.BALANCE.uninvitedApostles;}
  function E(){return G.UNINVITED_APOSTLE_EVENTS;}
  function member(id){return (S().mates||[]).some(function(m){return m.id===id;});}
  function ever(id){return !!((S().crewEver||{})[id] || member(id));}
  function speaker(id){if(id==='P'){var p=S().player;return {name:p.name,portrait:p.portrait,rigId:'player'};}var m=G.MATE[id];return m?{name:m.name,portrait:G.Art.mateSpec(id),half:G.Img.chain.mateHalf(id),lang:4}:{};}   // 'P' 제독 (2026-11-16)
  A.state=function(){
    var s=S(), b=s.uninvitedApostles || (s.uninvitedApostles={stage:0});
    b.won=b.won||{};b.attempts=b.attempts||{};b.earned=b.earned||{};b.claimed=b.claimed||{};
    if(G.UNINVITED_APOSTLES.every(ever))b.stage=4;
    return b;
  };
  A.eligible=function(){
    var s=S(), original=G.OLYMPIAN_APOSTLES||[];
    return !!((s.achv||{}).olympian_companions || (original.length===12 && original.every(function(a){return ever(a.id);})));
  };
  A.openWater=function(){
    var l=S().loc,k=K();if(!l || l.mode!=='sea' || !G.Geo.isSea(l.lon,l.lat,k.openMargin))return false;
    for(var i=0;i<k.probes;i++){var a=i*Math.PI*2/k.probes;if(!G.Geo.isSea(l.lon+Math.cos(a)*k.openRadius,l.lat+Math.sin(a)*k.openRadius,k.openMargin))return false;}
    return true;
  };
  function pauseSea(){var st=G.Scenes.sea.runtime();if(st){st.paused=true;st.path=null;st.target=null;st.keys={};}}
  function picture(e){return G.FamEv.showPic({img:e.pic,title:e.title,noStand:true,objectPosition:G.FX.olympianApostles.shotPosition,objectFit:e.objectFit});}
  A.scene=async function(key){
    var e=E()[key], pc=picture(e);
    try{for(var i=0;i<e.lines.length;i++)await UI.say(e.lines[i][1],speaker(e.lines[i][0]));}
    finally{if(pc)await pc.stop();}
  };
  A.claimRewards=function(){
    var b=A.state(), got=[];
    G.UNINVITED_APOSTLE_REWARDS.forEach(function(it){
      if(!b.earned[it.id] || b.claimed[it.id])return;
      if(G.R.addItem(it.id,{uninvitedReward:true})){b.claimed[it.id]=U.dateNum(S().date);got.push(it.id);UI.toast('사도 사건 보상 · '+it.name,'chest',5000);}
    });
    return got;
  };
  function reward(wave){
    var b=A.state();G.UNINVITED_APOSTLE_REWARDS.forEach(function(it){if(it.wave===wave)b.earned[it.id]=true;});
    A.claimRewards();
    if(G.UNINVITED_APOSTLE_REWARDS.some(function(it){return b.earned[it.id]&&!b.claimed[it.id];}))UI.toast('사도 사건 보상을 보관했다. 소지품을 비운 뒤 「12신의 사도」를 열거나 다음 날 항해하면 받을 수 있다.','chest',6500);
  }
  A.npc=function(wave){
    var k=K(), hp=U.sum(S().fleet.ships,function(sh){return sh.maxHp || (G.SHIP[sh.type]||{}).hp || sh.hp;});
    var each=Math.round(U.clamp(hp*k.hpShare[wave-1],k.minHp,k.maxHp));
    var monsters=k.waves[wave-1].map(function(id){return {id:id,hp:each,ghostHull:'galleon'};});
    var l=S().loc;
    return {kind:'monster',monsters:monsters,n:monsters.length,uninvitedWave:wave,allEnemies:true,noPrize:true,
      center:{lon:l.lon,lat:l.lat},place:wave===1?'초대받지 못한 자들의 첫 포위':'세 갈래의 검은 포위',label:'해상 괴물 '+monsters.length+'기',
      tacticNote:'유령선과 괴물 '+monsters.length+'기를 모두 처치해야 승리합니다. 하나를 꺾어도 나머지는 달아나지 않습니다.'};
  };
  A.startBattle=function(wave){
    var b=A.state();if(b.stage!==wave || b.won[wave])return false;
    b.active=wave;b.attempts[wave]=(b.attempts[wave]||0)+1;
    pauseSea();G.Game.go('battle',{npc:A.npc(wave)});return true;
  };
  A.highFive=async function(){
    var b=A.state();if(b.stage<3 || b.highFiveSeen)return false;
    // 니칸드로스가 떠났거나 사망한 저장에서는 불러 세우지 않는다. 두 사람이 실제로 함께할 때 한 번 재생한다.
    if(!member('apostle_poseidon') || (b.stage===4&&!member('apostle_poseidon_grey'))){b.highFivePending=true;return false;}
    await A.scene('highfive');b.highFiveSeen=U.dateNum(S().date);delete b.highFivePending;
    G.State.log('니칸드로스와 글라우코스가 손바닥을 힘껏 마주치며 서로를 인정했다. 두 진영의 동료들이 경계를 풀었다.');
    return true;
  };
  async function offer(){
    var b=A.state();if(b.stage!==3)return false;
    var firstOffer=!b.offerSeen;
    if(firstOffer){await A.scene('reconciliation');b.offerSeen=true;}
    await A.highFive();
    var pc=picture(b.highFiveSeen?E().highfive:E().reconciliation);
    try{
      if(!firstOffer)await UI.say('세 사람은 깨진 돛대 곁에서 제독의 답을 기다린다. 봉인은 이미 닫혔고, 이번에는 무기 대신 저마다의 이름을 내놓았다.',{});
      var v=await UI.ask('암펠리오스·글라우코스·멜란티오스를 동료로 맞을까? 월급은 각각 '+K().wage+'닢.',[
        {label:'세 사람의 이름을 선원 명부에 적는다',value:'join'},{label:'당장은 답하지 않는다',value:'later'}]);
      if(v!=='join'){b.next=S().day+K().deferDays;await UI.say('암펠리오스가 빈 잔을 거두고, 글라우코스는 해도를 말아 넣는다. 멜란티오스는 열쇠를 잠근 채 기다리겠다고 고개를 끄덕였다.',{});return true;}
      for(var i=0;i<G.UNINVITED_APOSTLES.length;i++){
        var id=G.UNINVITED_APOSTLES[i];if(ever(id))continue;
        var m=G.Legend.join(id,null);if(!m)continue;m.loyal=K().loyal;
        var ev=S().crewEver || (S().crewEver={});ev[id]=U.dateNum(S().date);
        var line=E().join.filter(function(x){return x[0]===id;})[0];await UI.say(line[1],speaker(id));
        if(G.Achieve)await G.Achieve.afterHire(id);
      }
      b.stage=4;b.joined=U.dateNum(S().date);delete b.next;
      G.State.log('초대받지 못한 세 사도의 두 차례 해상 습격을 이겨 암펠리오스·글라우코스·멜란티오스를 동료로 맞았다.');
      return true;
    }finally{if(pc)await pc.stop();}
  }
  A.onSeaDay=async function(){
    if(busy || G.Game.sceneName!=='sea' || !S().loc || S().loc.mode!=='sea')return false;
    A.claimRewards();var b=A.state();
    // 이미 세 사람을 맞은 옛 저장도 새 화해 장면을 볼 수 있다. 고용·전투·보상을 다시 처리하지 않는다.
    if(b.stage===4&&!b.highFiveSeen&&member('apostle_poseidon')&&member('apostle_poseidon_grey')&&S().fleet.ships.length&&S().fleet.crew>0){
      busy=true;pauseSea();try{return await A.highFive();}finally{busy=false;}
    }
    if(!A.eligible() || b.stage===4 || (b.next||0)>S().day || !S().fleet.ships.length || S().fleet.crew<=0)return false;
    if(b.stage!==3 && !A.openWater())return false;
    busy=true;pauseSea();
    try{
      if(b.stage===3)return await offer();
      if(!b.stage){b.stage=1;await A.scene('covenant');}
      if(!(b.attempts[b.stage]||0))await A.scene(b.stage===1?'two':'three');
      else await UI.say(b.stage===1?'술빛 안개가 다시 돛을 적신다. 암펠리오스가 잔을 들어 지난 겨룸의 답을 청하고, 유령선과 크라켄이 함께 모습을 드러낸다.':'글라우코스의 삼지창 끝에 파도가 모인다. 봉인을 거두지 못한 세 괴물이 다시 배의 양옆과 앞길을 막는다.',{});
      return A.startBattle(b.stage);
    }finally{busy=false;}
  };
  A.recordLoss=function(npc){var b=A.state();if(b.stage!==npc.uninvitedWave)return;delete b.active;b.next=S().day+K().retryDays;G.State.log('초대받지 못한 사도의 '+b.stage+'차 습격에서 물러났다. 배를 정비해 다시 맞설 수 있다.');};
  A.afterBattle=async function(npc,res){
    var b=A.state(), wave=npc.uninvitedWave;
    if((wave!==1&&wave!==2) || b.stage!==wave || b.won[wave])return false;
    busy=true;delete b.active;
    try{
      if(res!=='win'){
        A.recordLoss(npc);var line=E().losses[wave-1];await UI.say(line[1],speaker(line[0]));
        UI.toast('배를 정비한 뒤 '+K().retryDays+'일이 지나면 '+wave+'차 습격에 다시 맞설 수 있다.','anchor',6000);
        G.Game.go('sea',{resume:true});pauseSea();return true;
      }
      b.won[wave]=U.dateNum(S().date);b.stage=wave+1;delete b.next;
      S().stats.wins++;
      G.Fame.add('bt',K().fame[wave-1]);reward(wave);
      G.State.log('초대받지 못한 사도의 '+wave+'차 습격에서 해상 괴물 '+K().waves[wave-1].length+'기를 모두 물리쳤다.');
      if(wave===1){
        await A.scene('bridge');
        var v=await UI.ask('유령선·크라켄·바다뱀의 두 번째 습격이 다가온다. 실제 함대의 피해는 남는다.',[
          {label:'지금 세 괴물을 맞아 싸운다',value:'fight'},{label:'먼저 배를 정비한다',value:'later'}]);
        if(v==='fight'){await A.scene('three');return A.startBattle(2);}
        b.next=S().day+K().deferDays;G.Game.go('sea',{resume:true});pauseSea();return true;
      }
      // 마지막 포위가 끝나야 합류가 열린다. 고용을 미루면 승리 기록은 그대로 둔다.
      G.Game.go('sea',{resume:true});pauseSea();return await offer();
    }finally{busy=false;}
  };
})(window.G = window.G || {});
