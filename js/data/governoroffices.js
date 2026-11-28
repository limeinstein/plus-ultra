/* 고정 항구의 역사 총독부와 플레이 중 임명한 총독을 일반 후원자 명부에 올린다. */
(function (G) {
  'use strict';
  var O = G.Governors = {}, H = G.CourtHistory, seats = G.GOVERNOR_SEATS;
  var offices = Object.keys(seats), appointed = [];
  var background = { PT:['ib',1,'C'], ES:['ib',0,'C'], EN:['ne',3,'C'], NL:['ne',3,'C'], FR:['ne',2,'C'] };
  function game() { return G.Game && G.Game.state; }
  function today() { var s = game(); return s && s.date ? G.U.dateNum(s.date) : 14800101; }
  function stamp(v) { return v < 10000 ? v * 10000 + 101 : v < 1000000 ? v * 100 + 1 : v; }
  function time(n) { return H.time({ y:Math.floor(n / 10000), m:Math.floor(n / 100) % 100, d:n % 100 }); }
  function location(def, n) {
    var city = def.city, profile = def.profile;
    def.moves.forEach(function (move) {
      if (n >= stamp(move[0])) { city = move[1]; profile = move[2]; }
    });
    return {city:city, profile:profile};
  }
  function seatTitle(id, def) {
    var n = today();
    if (id === 'es_peru' && n < 15440515) return '누에바카스티야 총독';
    if (id === 'fr_champlain' && n < 16270000) return '퀘벡 거점 책임자';
    if (id === 'nl_cape' && n >= 16910000) return '희망봉 총독';
    if (id === 'en_virginia' && n < 16100000) return '버지니아 평의회 의장';
    return def.title;
  }
  function seatPlace(id, def) {
    if (id === 'es_peru' && today() < 15440515) return '리마 총독 관저';
    if (id === 'nl_cape' && today() >= 16790101) return '희망봉 성 총독부';
    return def.place;
  }
  function watch(n, sp) {
    var list = H.changes[n] || (H.changes[n] = []);
    if (list.indexOf(sp) < 0) list.push(sp);
  }
  function publish(sp) {
    G.SPONSOR[sp.id] = sp;
    if (G.SPONSORS.indexOf(sp) < 0) G.SPONSORS.push(sp);
  }
  function install(id) {
    var d = seats[id], old = G.SPONSOR[id], code = id.slice(0,2).toUpperCase(), info = background[code];
    var sp = old || { id:id, bld:'mansion', pw:3, wealth:4, taste:['geo','trade','people'] };
    sp.type = 'gov'; sp.governorOffice = id; sp.govNation = code; sp.style = info[0]; sp.lang = info[1]; sp.rel = info[2];
    if (!old) sp.nation = code === 'NL' ? null : code;
    Object.defineProperties(sp, {
      city:{enumerable:true,configurable:true,get:function () { return location(d,today()).city; }},
      title:{enumerable:true,configurable:true,get:function () { return seatTitle(id,d); }},
      place:{enumerable:true,configurable:true,get:function () { return seatPlace(id,d); }}
    });
    var former = sp.holders || [], usedKeys = {}, rows = [];
    function record(a,b,term) {
      if (a >= b) return;
      var label = term ? term[3] : '총독부 접견 서기관';
      var row = [time(a),time(b),label,term ? 'governors/'+term[2] : 'governors/desk',term ? 'x' : 'g',term && term[2] === 'mariana' ? 'f' : 'm'];
      if (term) {
        var prior = former.find(function (v) { return v[2] === label && v[0] < row[1] && row[0] < v[1]; });
        if (prior) {
          var key = sp.id + ':' + prior[0] + ':' + prior[2];
          if (!usedKeys[key]) { usedKeys[key] = true; row[7] = key; }
        }
      }
      rows.push(row); watch(a,sp); watch(b,sp);
    }
    // 직무가 이어진 시기 중 명단에 실명이 없는 구간은 서기관이 접견한다.
    d.windows.forEach(function (win) {
      var start = stamp(win[0]), end = stamp(win[1]), cursor = start;
      d.terms.forEach(function (term) {
        var a = Math.max(stamp(term[0]),start), b = Math.min(stamp(term[1]),end);
        if (a >= b) return;
        record(cursor,a,null); record(a,b,term); cursor = b;
      });
      record(cursor,end,null);
    });
    sp.holders = rows;
    publish(sp);
  }
  offices.forEach(install);
  function historicalAt(c, code, n) {
    return offices.some(function (id) {
      var d=seats[id];
      return (!code || G.SPONSOR[id].govNation===code) && location(d,n).city===c.id &&
        d.windows.some(function (w) { return n>=stamp(w[0]) && n<stamp(w[1]); });
    });
  }
  O.displaced = function (sp, date) {
    var s = game(), n = date ? G.U.dateNum(date) : today();
    if (!s || !sp.governorOffice) return false;
    if (sp.appointedGovernor) {
      var city = G.CITY_DATA[sp.city];
      if (!city) return true;
      if (city.colony != null) return !(G.Colony && G.Colony.of(city));
      var owner = G.R.cityOwner(city);
      var sameOwner = owner === sp.commissionOwner || G.COLONY_POWERS[owner] === sp.govNation;
      return !sameOwner || historicalAt(city,sp.govNation,n);
    }
    var cityId = location(seats[sp.governorOffice],n).city;
    var held = s.conquests && s.conquests[cityId];
    if (held && held.date && (typeof held.date === 'number' ? held.date : G.U.dateNum(held.date)) > n) return false;
    return !!held && (G.COLONY_POWERS || {})[held.owner] !== sp.govNation;
  };
  O.profile = function (sp) { return sp.appointedGovernor ? sp.officeProfile : location(seats[sp.governorOffice],today()).profile; };
  O.onlyHistoricalPalace = function (c) {
    var local = G.SPONSORS.filter(function (sp) { return sp.city === c.id && sp.bld === 'palace'; });
    return local.length ? local.every(function (sp) { return !!sp.governorOffice; }) : historicalAt(c,null,today());
  };
  function charterProfile(c, code) {
    if (c.id === 173) return 'macau';
    if (c.id === 150) return 'goa';
    if (c.id === 154) return 'cochin';
    if (c.id === 101) return today() < 16790101 ? 'capeearly' : 'cape';
    if (code === 'NL') return 'amsterdam';
    if (code === 'FR') return 'quebec';
    if (code === 'EN' || code === 'SC') return 'virginia';
    if (code === 'ES') return 'cuba';
    if (c.region === 10) return 'bahia';
    return c.region === 3 ? 'madeira' : 'cochin';
  }
  function appointedName(code, rng, c) {
    var names=G.COLONY_NAMES[code], nat=G.NATIONS[code];
    if (names) return names.given[Math.floor(rng()*names.given.length)]+' '+names.sur[Math.floor(rng()*names.sur.length)];
    var local=nat && nat.names && nat.names.m;
    return local && local.length ? local[Math.floor(rng()*local.length)] : c.name+' 파견관';
  }
  function commissionedTerms(c, e) {
    var terms=[], start=e.start, name=e.name, lengths=G.BALANCE.colonySp.term;
    var rng=G.U.makeRng(G.U.strHash('office-terms:'+e.code+':'+c.id+':'+start));
    while (start<17010101) {
      var years=lengths[0]+Math.floor(rng()*(lengths[1]-lengths[0]+1));
      var end=Math.min(17010101,(Math.floor(start/10000)+years)*10000+101);
      terms.push([time(start), time(end), name, 0, 'x']);
      start=end; name=appointedName(e.code,rng,c);
    }
    return terms;
  }
  function newSeat(c, entry) {
    var info = G.COLONY_NATION[entry.code], nat = G.NATIONS && G.NATIONS[entry.code];
    var sp = {id:entry.id,city:c.id,governorOffice:entry.id,appointedGovernor:true,commissionOwner:entry.owner,
      govNation:entry.code,officeProfile:entry.profile,type:'gov',bld:'mansion',style:info ? info.style : c.style,
      nation:info ? info.sp : entry.code,lang:info ? info.lang : nat ? nat.lang : c.lang,rel:info ? (info.cath ? 'C' : c.rel) : c.rel,
      title:c.colony != null ? '총독부 대리' : '임명 총독',place:c.colony != null ? '총독부 대리 집무실' : c.name+' 총독부',
      taste:['trade','geo','people'],pw:3,wealth:4,holders:commissionedTerms(c,entry)};
    publish(sp); appointed.push(sp); return sp;
  }
  O.restore = function () {
    appointed.forEach(function (sp) { var i=G.SPONSORS.indexOf(sp); if (i>=0) G.SPONSORS.splice(i,1); if (G.SPONSOR[sp.id]===sp) delete G.SPONSOR[sp.id]; });
    appointed = [];
    var s=game();
    Object.keys(s && s.governorOffices || {}).forEach(function (key) {
      var e=s.governorOffices[key], c=G.CITY_DATA[e.city];
      if (c) newSeat(c,e);
    });
  };
  O.canFound = function (c) {
    var s=game();
    if (!c || !s || !s.player || s.date.y>1700 || s.date.y<1480 || c.outpost || (s.governorOffices && s.governorOffices[c.id])) return false;
    if (c.colony != null) { var e=G.Colony && G.Colony.of(c); return !!e && e.stage>=4; }
    if (!G.R.cityExists(c) || !G.ColonySp || !G.ColonySp.candidate(c)) return false;
    var holding=s.conquests && s.conquests[c.id], owner=G.R.cityOwner(c);
    var home=G.R.myOwnerName(), code=G.COLONY_POWERS[owner];
    if (holding ? owner !== home && (!code || code !== s.player.nation) : !code || code !== s.player.nation) return false;
    return !historicalAt(c,holding ? s.player.nation : null,today());
  };
  O.found = function (c) {
    if (!O.canFound(c)) return null;
    var s=game(), cost=G.BALANCE.colonySp.officeCost;
    if (s.player.gold<cost) return null;
    var code=s.player.nation, n=today(), rng=G.U.makeRng(G.U.strHash('governor:'+c.id+':'+n+':'+code));
    var name=appointedName(code,rng,c);
    var entry={id:'appointed_gov_'+c.id, city:c.id, start:n, name:name, code:code, owner:G.R.cityOwner(c),profile:charterProfile(c,code)};
    if (!s.governorOffices) s.governorOffices={};
    s.governorOffices[c.id]=entry; s.player.gold-=cost;
    var sp=newSeat(c,entry);
    if (G.Succession) G.Succession.sync();
    G.State.log(c.name+'에 '+sp.title+' '+name+' 취임. 총독부에서 후원을 청할 수 있다.');
    return sp;
  };
  O.permit = async function (c) {
    if (!O.canFound(c)) return;
    var cost=G.BALANCE.colonySp.officeCost;
    if (game().player.gold<cost) { G.UI.toast('설립비 '+G.U.num(cost)+'닢이 필요합니다.','coin'); return; }
    var deputy=c.colony!=null, title=deputy ? '총독부 대리를 임명한다' : '총독부를 세운다';
    if (!await G.UI.confirm(c.name+'에서 '+(deputy?'총독부 대리를 임명':'총독부를 설립')+'합니다. 비용은 '+G.U.num(cost)+'닢입니다. 임명한 후견인에게 모험을 제안하고 발견을 보고할 수 있습니다.',title,'취소',title)) return;
    if (!game() || G.Scenes.city.city()!==c) return;
    var sp=O.found(c);
    if (!sp) return;
    G.Game.refreshHud(); G.UI.toast(sp.place+' · '+G.Sponsor.holderName(sp),'crown');
    var cityScene=G.Scenes.city;
    if (G.Town.active()) await G.Town.open(c,cityScene.buildings(c));
    if (G.Game.scene===cityScene && cityScene.city()===c) cityScene.main();
  };
})(window.G = window.G || {});
