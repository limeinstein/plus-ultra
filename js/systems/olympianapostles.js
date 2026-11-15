/* 성소 발견 → 가장 가까운 현존 도시 밖의 사도 → 중급 시험 → 고용.
   옛 저장은 발견·동료 기록으로 복구한다. 시험 승리와 고용을 따로 저장해 고용을 미뤄도 재시험하지 않는다. */
(function (G) {
  'use strict';
  var OP = G.OlympianApostles = {}, UI = G.UI, U = G.U, busy = false;
  function S() { return G.Game.state; }
  function K() { return G.BALANCE.olympianApostles; }
  function list() { return G.OLYMPIAN_APOSTLES || []; }
  function spec(id) { return list().filter(function (a) { return a.id === id; })[0]; }
  function states() { var s = S(); return s.olympianApostles || (s.olympianApostles = {}); }
  function row(a) { var st = states(); return st[a.id] || (st[a.id] = {}); }
  function member(id) { return (S().mates || []).some(function (m) { return m.id === id; }); }
  function found(a) { return !!(G.Disc && G.Disc.foundByMe(a.discovery)); }
  function event(a) { return G.OLYMPIAN_APOSTLE_EVENTS[a.slug]; }
  function who(a) { return {name:G.MATE[a.id].name, portrait:G.Art.mateSpec(a.id), half:G.Img.chain.mateHalf(a.id), lang:4}; }
  function picture(a) { return G.FamEv.showPic({img:'olympian-events/meet_'+a.slug,title:a.name+' · '+a.god+'의 사도',noStand:true,objectPosition:G.FX.olympianApostles.shotPosition}); }
  OP.kindName = function (a) { return {duel:'일기토',land:'육상전투',naval:'해상전투'}[a.kind] || '미니게임'; };
  /** 발견물과 같은 도시 또는 지리상 가장 가까운 현존 도시. 선택한 도시는 저장해 장소가 흔들리지 않는다. */
  OP.city = function (a) {
    var b = row(a), d = G.DISC[a.discovery], c = b.city != null && G.CITY_DATA[b.city];
    if (c && G.R.cityExists(c)) return c;
    if (!d) return null;
    c = d.city != null && G.CITY_DATA[d.city];
    if (!c || !G.R.cityExists(c)) {
      var best = Infinity; c = null;
      G.CITY_DATA.forEach(function (x) { if (!G.R.cityExists(x)) return; var n = G.Geo.dist(d.lon,d.lat,x.lon,x.lat); if (n < best) { best=n; c=x; } });
    }
    if (c) b.city = c.id;
    return c;
  };
  OP.sync = function () {
    list().forEach(function (a) {
      var b = row(a);
      if (found(a)) { b.unlocked = true; OP.city(a); }
      if (member(a.id) || (S().crewEver || {})[a.id]) { b.hired = true; b.passed = true; }
    });
  };
  OP.afterFind = function (d) {
    list().forEach(function (a) {
      if (a.discovery !== d.id || !found(a)) return;
      var b = row(a), fresh = !b.unlocked; b.unlocked = true;
      var c = OP.city(a);
      if (fresh && c) { var msg = a.name+'('+a.god+'의 사도)가 '+c.name+' 성문 밖에서 기다린다 — '+OP.kindName(a); UI.toast(msg,'people',6500); G.State.log(msg); }
    });
  };
  OP.near = function () {
    OP.sync(); var l = S().loc;
    if (!l || l.mode !== 'land') return [];
    return list().filter(function (a) { var b=row(a), c=b.unlocked && !b.hired && OP.city(a); return c && !member(a.id) && G.Geo.dist(l.lon,l.lat,c.lon,c.lat) <= K().nearCity; });
  };
  OP.onLand = async function (lon, lat, ctx) {
    if (busy) return false;
    var a = OP.near().filter(function (x) { return (row(x).next || 0) <= S().day; })[0];
    if (!a) return false;
    if (ctx && ctx.stop) ctx.stop();
    return OP.meet(a.id);
  };
  OP.open = async function () {
    if (G.UninvitedApostles) G.UninvitedApostles.claimRewards();
    OP.sync();
    var near=OP.near(), opts=list().map(function (a) {
      var b=row(a), c=b.unlocked && OP.city(a), ready=near.indexOf(a)>=0 && (b.next||0)<=S().day;
      var status=b.hired?'고용 완료':!b.unlocked?'성소 미발견':b.passed?'시험 통과 · 고용 대기':(b.next||0)>S().day?'하루 뒤 재도전':OP.kindName(a);
      return {label:a.name+' · '+a.god+' · '+(c?c.name+' 성문 밖':'「'+G.DISC[a.discovery].name+'」 발견 후')+' · '+status,value:a.id,dis:!ready};
    });
    opts.push({label:'돌아간다',value:'back'});
    var id=await UI.ask('12신의 사도 — 발견한 성소에서 가장 가까운 도시 밖에서 만난다',opts);
    if (spec(id)) return OP.meet(id);
    return false;
  };
  async function recruit(a) {
    var b=row(a);
    var v=await UI.ask(a.name+'의 이름을 선원 명부에 올릴까? 월급 '+U.num(G.MATE[a.id].wage)+'닢.',[
      {label:'부하로 맞는다',value:'hire'},{label:'다음에 맞는다',value:'later'}],who(a));
    if (v !== 'hire') { b.next=S().day+K().retryDays; await UI.say(event(a).wait,who(a)); return; }
    if (b.hired || member(a.id)) return;
    var m=G.Legend.join(a.id,OP.city(a));
    if (!m) return;
    m.loyal=K().loyal; b.hired=true; b.hiredDay=S().day;
    await UI.say(event(a).join,who(a));
    var ev=S().crewEver || (S().crewEver={}); ev[a.id]=ev[a.id] || U.dateNum(S().date);
    await OP.playFellowships();
    if (G.Achieve) await G.Achieve.afterHire(a.id);
  }
  async function complete(a, win) {
    var b=row(a), e=event(a), pc=picture(a);
    try {
      if (!win) { b.next=S().day+K().retryDays; await UI.say(e.lose,who(a)); return; }
      b.passed=true; delete b.next;
      G.State.log(a.name+'의 시험 「'+a.title+'」을 통과했다.');
      await UI.say(e.win,who(a));
      await recruit(a);
    } finally { if(pc)await pc.stop(); }
  }
  /** 남녀 각 여섯 명의 고용 기록을 채우면 전용 사건을 한 번씩. 반대 성별 동료의 유무는 관계없다. */
  OP.fellowshipScene = async function (e) {
    var pc=G.FamEv.showPic({img:e.pic,title:e.title,noStand:true,objectPosition:G.FX.olympianApostles.shotPosition});
    try {
      for(var i=0;i<e.n.length;i++)await UI.say(e.n[i],{});
      for(var j=0;j<e.cast.length;j++){var a=spec(e.cast[j][0]);if(a && member(a.id))await UI.say(e.cast[j][1],who(a));}
      await UI.say(e.end,{});
    } finally {if(pc)await pc.stop();}
  };
  OP.playFellowships = async function () {
    var s=S(), seen=s.olympianFellowships || (s.olympianFellowships={}), ever=s.crewEver || {}, events=G.OLYMPIAN_FELLOWSHIP_EVENTS;
    for(var i=0;i<events.length;i++){
      var e=events[i], group=list().filter(function(a){return G.MATE[a.id].g===e.gender;});
      if(seen[e.id] || group.length!==6 || !group.every(function(a){return !!ever[a.id] || member(a.id);}))continue;
      seen[e.id]=U.dateNum(s.date); await OP.fellowshipScene(e);
    }
  };
  /** 리라의 음표 기억: 짧은 가락을 보고 같은 순서로 눌러 세 번 완성한다. */
  OP.melody = function () {
    var k=K().melody, names=['도','레','미','솔','라'], round=0, mistakes=0, seq=[], input=[], timer=null, accepting=false;
    return new Promise(function (resolve) {
      var win=UI.window({title:'아폴론의 리라 — 태양의 선율',icon:'music',width:680,closable:false,clickAny:false,
        html:'<p>나타나는 음표를 기억한 뒤 같은 순서로 누르십시오. 세 가락을 완성하면 통과합니다. 실수 두 번까지 허용합니다.</p><div class="olympian-score" style="font-size:34px;text-align:center;min-height:75px"></div><div class="olympian-notes" style="display:flex;justify-content:center;gap:10px"></div><p class="olympian-progress center"></p>',
        buttons:[{label:'물러난다',value:0,onClick:function(){finish(false);}}]});
      var score=win.content.querySelector('.olympian-score'), box=win.content.querySelector('.olympian-notes'), progress=win.content.querySelector('.olympian-progress'), done=false;
      function finish(ok) { if(done)return; done=true; clearTimeout(timer); win.close(ok); resolve(ok); }
      function show() {
        accepting=false; input=[]; seq=[];
        for(var i=0;i<k.start+round;i++)seq.push(U.ri(0,k.notes-1));
        score.textContent=seq.map(function(n){return names[n];}).join(' · ');
        progress.textContent=(round+1)+' / '+k.rounds+' 가락 · 실수 '+mistakes+' / '+k.mistakes;
        timer=setTimeout(function(){if(done)return; score.textContent='기억한 순서대로 연주'; accepting=true;},k.showMs);
      }
      names.forEach(function(n,i){var btn=U.el('button','btn',n); btn.onclick=function(){
        if(!accepting || done)return; input.push(i); score.textContent=input.map(function(x){return names[x];}).join(' · ');
        if(i!==seq[input.length-1]) { mistakes++; if(mistakes>k.mistakes)finish(false); else show(); }
        else if(input.length===seq.length) { round++; if(round>=k.rounds)finish(true); else show(); }
      }; box.appendChild(btn);});
      show();
    });
  };
  OP.startNaval = function (a) {
    var s=S(), k=K().naval, c=OP.city(a);
    // 연습선으로 싸우므로 실제 함대·선원·탐험 위치를 손대지 않고 돌려놓는다. 저장 뒤 이어가기도 가능하다.
    s.olympianNaval={id:a.id,loc:JSON.parse(JSON.stringify(s.loc)),crew:s.fleet.crew};
    s.fleet.crew=k.crew;
    G.Game.go('battle',{npc:{kind:'navy',n:1,ships:[k.type],names:[a.god+'의 연습선'],gun:k.gun,crewK:k.crewK,gunK:k.gunK,
      olympianTrial:a.id,K:k.power,center:{lon:c.lon,lat:c.lat},myFleet:[{type:k.type,name:'사도의 연습선',gun:k.gun}]}});
  };
  OP.finishNaval = async function (npc,res) {
    var s=S(), saved=s.olympianNaval, a=spec(npc.olympianTrial);
    if (!saved || !a || saved.id!==a.id) return;
    s.fleet.crew=saved.crew; s.loc=saved.loc; delete s.olympianNaval; delete s.battle;
    // 장면을 먼저 되돌려 시험 뒤 대사와 고용을 육상에서 진행한다.
    busy=true;
    try { await G.Game.go('land',{}); await complete(a,res==='win'); }
    finally { busy=false; }
  };
  OP.meet = async function (id) {
    var a=spec(id);
    if (busy || !a || OP.near().indexOf(a)<0 || (row(a).next||0)>S().day) return false;
    busy=true;
    try {
      var b=row(a), e=event(a), pc=picture(a), v;
      try {
        if (b.passed) { await UI.say(e.again,who(a)); await recruit(a); return true; }
        if (!b.met) { for(var i=0;i<e.n.length;i++)await UI.say(e.n[i],{}); b.met=true; }
        await UI.say(e.greet,who(a)); await UI.say(e.dare,who(a));
        v=await UI.ask(a.title+' · '+OP.kindName(a)+' · 중급',[
          {label:'시험에 도전한다',value:'try'},{label:'다음에 도전한다',value:'later'}],who(a));
        if (v!=='try') { b.next=S().day+K().retryDays; await UI.say(e.wait,who(a)); return true; }
      } finally { if(pc)await pc.stop(); }
      if(a.kind==='naval') { OP.startNaval(a); return true; }
      var win=false, m=G.MATE[a.id], k=K();
      if(a.kind==='duel') {
        win=(await G.Games.duel({name:m.name,portrait:G.Art.mateSpec(a.id),look:'rival',str:m.st[0],mar:m.st[2],int:m.st[1],cha:m.st[3],atk:k.duel.atk,def:k.duel.def,skill:k.duel.skill,style:a.slug==='ares'?'thrust':'slash'},{place:'explore'}))==='win';
      } else if(a.kind==='land') {
        // 동수에 가까운 모의전: 실제 탐험대 인원·전리품과 분리한다.
        var l=S().loc, terr=G.Geo.terrain(l.lon,l.lat);
        var r=await G.Games.landWar({enemy:{name:a.title,kind:'garrison',n:k.land.n,leader:m.name,portrait:G.Art.mateSpec(a.id),noSpecial:true},party:k.land.party,terr:terr==='sea'?'grass':terr,guns:a.slug==='hephaestus',flee:true,noHurt:true});
        win=r.res==='win';
      } else if(a.kind==='melody')win=await OP.melody();
      else win=await G.Games.pz[a.kind]({name:a.title,pzText:a.dare},k.puzzleLevel);
      await complete(a,win);
      return true;
    } finally { busy=false; }
  };
})(window.G = window.G || {});
