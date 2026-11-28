/* 항해·육상·해도에서 쓰는 도시 모형. 도시·시설·시대는 본편 판정을 그대로 따른다. */
(function (G) {
  'use strict';
  var CI=G.CityIcon, D=G.CITY_MODELS, oldDraw=CI.draw;
  if (!D) return;
  var POI={0:['jeronimos','belem'],7:['giralda'],14:['notredame'],29:['sanmarco'],33:['colosseum'],
    38:['whitetower'],60:['stbasil'],61:['kyivsophia'],72:['parthenon'],112:['hagiasophia'],
    162:['phrasisanphet'],193:['kinkakuji'],200:['templomayor']};
  var HERO={notredame:'paris',colosseum:'rome',hagiasophia:'istanbul',whitetower:'london',giralda:'seville'};
  var COURT={fr_king:'louvre',ot_sultan:'topkapi',ru_prince:'kremlin',cn_emperor:'forbidden'};
  var FALLBACK={landmark:'library',gate:'trade',lairwatch:'trade',lairhq:'trade',govhall:'palace'};
  // 대청·가게의 발치, 화면 안의 비중. y가 작은 건물부터 그려 겹친 지붕을 정리한다.
  var SLOTS=Object.assign({landmark:[-.095,-.145,.54],palace:[.23,-.079,.41],manor:[.22,-.068,.32],
    home:[-.15,.045,.195],library:[.322,.06,.23],trade:[-.355,.04,.25],
    market:[-.02,.10,.205],tavern:[-.235,.20,.19],inn:[.161,.227,.177],gate:[0,0,.31]},fx().settlementSlots);
  var modelMemo=new WeakMap(), shoreMemo=new WeakMap(), discoverySource, discoveryCount=-1, discoveries={};
  var offsets=[], budget=0, until=0, principalCache=new Map();
  function fx(){return G.FX.cityModels;}
  function state(){return G.Game&&G.Game.state;}
  function size(c){return Math.max(1,Math.min(3,c.size||1));}
  // 정착지 성장의 지도 외관은 기존 진행 상태에서 판정한다.
  function mapSize(c,s,colony){
    if(c.lair){
      var lair=s&&s.lair;
      if(lair&&lair.held&&lair.held[c.lair]!=null)return 3;
      return lair&&lair.beat&&lair.beat[c.lair]>0?2:1;
    }
    if(colony)return colony.stage>=4?3:colony.stage>=3?2:1;
    return size(c);
  }
  function dateNow(){var s=state();return s&&s.date||{y:1480,m:1};}
  function clamp(x,a,b){return Math.min(b,Math.max(a,x));}
  function asset(key,opts){
    var im=G.Img.get(key);
    if(!im&&G.Img.has(key)){G.Img.want(key);if(opts.pending)opts.pending(key);}
    return im;
  }
  function atlas(group,name){
    var r=D.sheets[group]&&D.sheets[group][name];
    return r?{key:'map-cities/'+group,r:r}:null;
  }
  function settlementArt(id){
    var r=id&&G.CITY_PROPS&&G.CITY_PROPS[id];
    return r?{key:'map-settlements/'+id,r:r}:null;
  }
  function photo(id){
    var p=D.photos[id];
    return p?{key:'map-cities/landmarks/'+id,r:[0,0,p[0],p[1],.5,p[1]/p[0]*.93]}:null;
  }
  function originalArt(id){
    if(HERO[id])return atlas('heritage',HERO[id]);
    var ruin=G.RUIN_MODELS&&G.RUIN_MODELS[id];
    if(ruin)return {key:ruin[0],r:ruin.slice(1,7)};
    return G.RUIN_ADDITIONS&&G.RUIN_ADDITIONS[id]?null:photo(id);
  }
  function direct(id){
    var original=originalArt(id);
    if(original)return original;
    var r=G.RUIN_ADDITIONS&&G.RUIN_ADDITIONS[id];
    return r?{key:r[0],r:r.slice(1,7)}:null;
  }
  function valid(d,date){
    return d && d.cat==='ruin' && d.how==='city' && !d.mirage50 && !d.mirageFrom && !d.alwaysMirage &&
      (!d.built||d.built<=date.y) && (!d.openY||d.openY<=date.y) && (!d.goneY||date.y<d.goneY) && !(G.Disc&&G.Disc.isFuture(d));
  }
  function sites(id){
    var list=G.DISCOVERIES||[];
    if (list!==discoverySource||discoveryCount!==list.length) {
      discoverySource=list;discoveryCount=list.length;discoveries={};
      list.forEach(function(d){
        if(d.city==null||d.how!=='city'||d.cat!=='ruin')return;
        (discoveries[d.city]||(discoveries[d.city]=[])).push(d);
      });
    }
    return discoveries[id]||[];
  }
  function sponsor(c,date,f){
    if(size(c)<3)return null;
    var s=state(), contracted=s&&s.contract&&s.contract.sponsor, year=date.y+((date.m||1)-1)/12;
    var found=null, rank=-1;
    (G.SPONSORS||[]).forEach(function(sp){
      if(sp.city!==c.id || (sp.bld==='palace'?!f.palace:(f.mansion||[]).indexOf(sp.id)<0))return;
      if(sp.id!==contracted && !(sp.holders||[]).some(function(h){return h[0]<=year&&year<h[1];}))return;
      var score=(sp.pw||0)*2+(sp.bld==='palace'?1:0);
      if(score>rank){found=sp;rank=score;}
    });
    return found;
  }
  function courtId(sp,c,date){
    var id=sp&&COURT[sp.id];
    if(!id&&sp&&sp.place){
      var building=sites(c.id).find(function(d){return d.name===sp.place;});
      id=building&&building.id;
    }
    if(!id&&CI.culture(c)==='china'&&sp&&sp.bld==='palace'&&sp.type==='king')id='forbidden';
    var d=id&&G.DISC&&G.DISC[id];
    return d&&d.city===c.id&&valid(d,date)&&direct(id)?id:null;
  }
  function landmark(c,date,royal){
    var chosen=null,best=-1,pref=POI[c.id]||[];
    sites(c.id).forEach(function(d){
      if(d.id===royal||!valid(d,date))return;
      var i=pref.indexOf(d.id);
      // 도시에 이미 전용 대표 외관이 있으면 누락 보완으로 대표 발견물이 바뀌지 않는다.
      var score=(i>=0?1e6-i*1e4:0)+(originalArt(d.id)?50000:0)+(d.wonder?5000:0)+Math.min(20000,d.val||0);
      if(score>best){best=score;chosen=d;}
    });
    return chosen;
  }
  function silhouette(d,culture){
    var title=d.name||'';
    return direct(d.id)||atlas(culture,/궁|성채|사원|신전|모스크|대성당|요새|왕릉|사찰|탑|성벽/.test(title)?'palace':'library');
  }
  CI.plan=function(c,date){
    date=date||dateNow();
    var s=state(), seat=s&&s.player&&(G.R.seat?G.R.seat():s.player.home);
    var contract=s&&s.contract&&s.contract.sponsor, col=c.colony!=null&&G.Colony&&G.Colony.of(c);
    var n=mapSize(c,s,col);
    var prop=c.lair?'skull-cave':c.colony!=null?'supply-wagon':null;
    var lair=c.lair&&G.Lair&&G.Lair.of(c), hideBuildings=!!(lair&&lair.mapHideBuildings);
    var key=[date.y,date.m,seat,contract,n,c.flags,c.port,col&&col.stage,prop,hideBuildings,(G.SPONSORS||[]).length].join(':');
    var memo=modelMemo.get(c);
    if(memo&&memo.key===key&&memo.state===s)return memo;
    var culture=CI.culture(c);
    if(!D.sheets[culture])culture='iberia';
    var f=G.R.facilities(c), sp=sponsor(c,date,f), royal=courtId(sp,c,date);
    var d=c.outpost?null:landmark(c,date,royal);
    var parts=[];
    function add(role,art,id){
      if(!art||hideBuildings)return;
      var slot=SLOTS[role];
      parts.push({role:role,id:id||role,art:art,x:slot[0],y:slot[1],w:slot[2]});
    }
    if(d)add('landmark',silhouette(d,culture),d.id);
    // 현재 도시 메뉴에 열리는 왕궁·총독부와 최고 후원자의 저택만 쓴다.
    var court=n===3&&(sp&&sp.bld==='palace'||!sp&&f.palace&&c.flags&&c.flags.indexOf('P')>=0);
    if(court)add('palace',royal?direct(royal):atlas(culture,'palace'),royal||sp&&sp.id);
    else if(sp)add('manor',atlas(culture,'manor'),sp.id);
    // 두 번째 두목의 수비대가 남아 있는 소굴은 깃발과 돌 망루로 표시한다.
    var watch=c.lair&&n===2&&settlementArt('pirate-watch');
    if(watch)add('lairwatch',watch);
    if(c.lair&&n===3)add('lairhq',settlementArt('pirate-hq'));
    if(f.govhall)add('govhall',settlementArt('governors-hall'));
    if(f.inspector)add('inspector',atlas(culture,'manor'));
    if(seat===c.id&&!c.outpost)add('home',atlas(culture,'home'));
    if(n>=2&&f.market)add('market',atlas(culture,'market'));
    if(n>=2&&f.trade)add('trade',atlas(culture,'trade'));
    if(n>=3&&f.library)add('library',atlas(culture,'library'));
    if(f.tavern)add('tavern',atlas(culture,'tavern'));
    if(f.inn)add('inn',atlas(culture,'inn'));
    if(!parts.length&&f.gate&&c.outpost) add('gate',atlas('heritage','gate'));
    var main=parts[0];
    if(!d&&parts.length&&!watch){
      var roles=['lairhq','govhall','palace','inspector','manor','trade','tavern','inn','home'];
      main=roles.map(function(role){return parts.find(function(p){return p.role===role;});}).find(Boolean)||main;
      if(main&&main.role!=='gate'){main.x=-.067;main.y=-.12;main.w=fx().principal[n];}
    }else if(d&&main){
      main.w=fx().landmark[n];
    }
    parts.sort(function(a,b){return a.y-b.y;});
    var access=!!c.port&&!!f.harbor;
    var layout=parts.map(function(part){return part.role+':'+part.id+':'+part.art.key;}).join('|')+'@'+n+'@'+access+'@'+prop+'@'+hideBuildings;
    memo={key:key,layout:layout,state:s,culture:culture,n:n,parts:parts,main:main,harbor:access,
      landmark:d?d.id:royal||null,sponsor:sp&&sp.id,palace:!!court,seat:seat===c.id,prop:prop,hideBuildings:hideBuildings};
    modelMemo.set(c,memo);
    return memo;
  };

  function geometry(model,width){
    return model.parts.map(function(p){
      var rise=p.art.r[5], cap=width*(p.role==='lairwatch'?fx().watchRise:p===model.main?fx().principalRise:.52);
      var w=Math.min(p.w*width,cap/Math.max(.17,rise));
      return {p:p,x:p.x*width,y:p.y*width,w:w};
    });
  }
  function propGeometry(model,width,chart){
    var id=model.prop, art=settlementArt(id);
    if(!art)return null;
    var cfg=fx().props, style=cfg[id];
    var w=chart?clamp(width*cfg.chartWidth,cfg.chartMin,cfg.chartMax):clamp(width*style.width,style.min,style.max);
    return {id:id,art:art,x:model.hideBuildings?0:width*cfg.x,y:model.hideBuildings?0:width*cfg.y,w:w};
  }
  function* findProp(prop,center,buildings,quay,dry,solid,connected){
    if(!prop)return null;
    var cfg=fx().props, tx=center.x+prop.x,ty=center.y+prop.y;
    function place(x,y,w){
      var a=w*cfg.foot[0],b=w*cfg.foot[1];
      if(!solid(x,y))return null;
      for(var k=0;k<12;k++){
        var angle=k*Math.PI/6;
        if(!solid(x+Math.cos(angle)*a,y+Math.sin(angle)*b))return null;
      }
      return {id:prop.id,art:prop.art,x:x,y:y,w:w,foot:[a,b]};
    }
    for(var i=0;i<cfg.scale.length;i++){
      var w=prop.w*cfg.scale[i], a=w*cfg.foot[0], b=w*cfg.foot[1];
      for(var j=0;j<offsets.length;j++){
        var o=offsets[j];
        if(o[2]>cfg.search)break;
        if(j&&j%16===0)yield;
        var x=tx+o[0],y=ty+o[1];
        if(!dry(x,y)||!connected(x,y))continue;
        if(quay&&Math.hypot(x-quay.land[0],y-quay.land[1])<a+quay.w*.16)continue;
        if(buildings.some(function(item){
          return Math.abs(x-item.x)<a+item.w*.31&&Math.abs(y-item.y)<b+item.w*.23;
        }))continue;
        var spot=place(x,y,w);
        if(spot)return spot;
      }
    }
    // 아주 작은 섬에서는 기존 도시 발치부터 더 촘촘히 살피며 모형을 줄인다.
    for(var i=0;i<cfg.compact.length;i++){
      var w=prop.w*cfg.compact[i];
      for(var j=0;j<cfg.compactRings.length;j++){
        if(j)yield;
        var radius=cfg.compactRings[j];
        for(var k=0;k<(radius?12:1);k++){
          var angle=k*Math.PI/6;
          var x=center.x+Math.cos(angle)*radius,y=center.y+Math.sin(angle)*radius;
          var spot=place(x,y,w);
          if(spot&&(radius<=2||connected(x,y)))return spot;
        }
      }
    }
    return null;
  }
  function dockPoint(i,x,y,r){
    // 부두 원본의 땅 쪽 입구와 배의 발치를 지도 카메라에 사영한다.
    var rad=i*Math.PI/4, a=Math.cos(rad), b=Math.sin(rad), u=a*x-b*y, v=b*x+a*y;
    return [(.83205*u+.55470*v)*r,(.39253*u-.58880*v)*r];
  }
  function* findQuay(dry,wet,sign,sail,connected,home,direction,width,limit,shore,cave){
    var best=null, scale=clamp(width*.20,13,27);
    var origin=[home.x,home.y], cx=shore?shore[0]:0, cy=shore?shore[1]:0;
    for(var i=0;i<8;i++){
      var art=atlas('quays',String(i)), r=scale*256*1.75/(5.4*art.r[2]);
      var bank=dockPoint(i,0,.35,r), tip=dockPoint(i,0,-.63,r);
      var bow=dockPoint(i,.57,-.95,r), stern=dockPoint(i,.57,-.42,r), boat=dockPoint(i,.57,-.69,r);
      var len=Math.hypot(tip[0],tip[1]), align=(tip[0]*direction[0]+tip[1]*direction[1])/len;
      if(align<-.3)continue;
      for(var j=0;j<offsets.length;j++){
        if(j&&j%24===0)yield;
        var o=offsets[j],x=cx+o[0],y=cy+o[1],d=o[2];
        if(d>limit)break;
        var score=d+Math.max(0,Math.hypot(x-origin[0],y-origin[1])-width)*.44+(1-align)*9;
        if(best&&score>=best.score)continue;
        var a=[x+bank[0],y+bank[1]], p=[x+tip[0],y+tip[1]];
        if(cave&&Math.hypot(a[0]-cave.x,a[1]-cave.y)<cave.foot[0]+scale*.16)continue;
        if(!dry(a[0],a[1])||!wet(p[0],p[1])||!wet(x+bow[0],y+bow[1])||!wet(x+stern[0],y+stern[1]))continue;
        if((!shore&&!connected(a[0],a[1]))||sign(a[0],a[1])<=0||sign(p[0],p[1])>=0||
            sign(x+bow[0],y+bow[1])>=0||sign(x+stern[0],y+stern[1])>=0||!sail(x+boat[0],y+boat[1]))continue;
        best={art:art,x:x,y:y,w:scale,score:score,land:a,water:p,ship:[x+boat[0],y+boat[1]]};
      }
    }
    return best;
  }
  function grid(){
    if(offsets.length)return;
    var max=fx().search;
    for(var x=-max;x<=max;x+=4)for(var y=-max;y<=max;y+=4){
      var d=Math.hypot(x,y);
      if(d<=max)offsets.push([x,y,d]);
    }
    offsets.sort(function(a,b){return a[2]-b[2];});
  }
  function* groundPlan(c,model,width,zoom){
    grid();
    var tiles=new Map(), exact=new Map(), lift=G.Terrain.lift, originY=c.lat+lift(c.lon,c.lat);
    function world(x,y){return G.Terrain.unproject(G.Geo.wrapLon(c.lon+x/zoom),originY-y/zoom);}
    function sign(x,y) {
      var key=x+':'+y,s=exact.get(key);
      if(s==null){var p=world(x,y);s=G.Geo.sdf(p[0],p[1]);exact.set(key,s);}
      return s;
    }
    function at(x,y){
      var a=Math.round(x), b=Math.round(y), k=(a+4096)*8192+b;
      var s=tiles.get(k);
      if(s==null){
        // 해안 가까이에서는 높이 투영이 0이므로 후보는 원래 거리장으로 빨리 거른다.
        s=G.Geo.sdf(G.Geo.wrapLon(c.lon+a/zoom),originY-b/zoom);
        tiles.set(k,s);
      }
      return s;
    }
    function dry(x,y){return at(x,y)>.045;}
    function wet(x,y){return at(x,y)<-.035;}
    function sail(x,y){
      if(!wet(x,y))return false;
      var p=world(x,y);
      return G.Geo.sdf(p[0],p[1])<0&&(!G.Hydro||!G.Hydro.ready||G.Hydro.canSail(p[0],p[1],{draft:1,beam:3,turn:28}));
    }
    var dx=c.dock?G.Geo.wrapLon(c.dock[1]-c.lon)*zoom:0,dy=c.dock?(c.lat-c.dock[0])*zoom:1;
    var len=Math.hypot(dx,dy)||1,direction=[dx/len,dy/len];
    // 해안 밖에 찍힌 예전 도시도 가장 가까운 육지부터 찾는다.
    var home=null, best=Infinity;
    for(var i=0;i<offsets.length;i++){
      if(i&&i%24===0)yield;
      var o=offsets[i],score=o[2]+Math.max(0,o[0]*direction[0]+o[1]*direction[1])*.6;
      if(o[2]>best)break;
      if(score<best&&dry(o[0],o[1])&&sign(o[0],o[1])>0){best=score;home={x:o[0],y:o[1]};if(!o[2])break;}
    }
    if(!home)return {buildings:[],dock:null,dry:false};
    function connected(x,y,check,from){
      check=check||dry;
      from=from||home;
      var dx=x-from.x,dy=y-from.y,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));
      for(var k=1;k<=n;k++)if(!check(from.x+dx*k/n,from.y+dy*k/n))return false;
      return true;
    }
    function fits(x,y,w,check,min){
      var f=clamp(w*.19,min==null?2.2:min,9);
      return check(x,y)&&check(x-f,y)&&check(x+f,y)&&check(x,y-f*.60)&&check(x,y+f*.52);
    }
    function solid(x,y){return sign(x,y)>0;}
    var parts=geometry(model,width), center=home;
    if(parts.length){
      for(var i=0;i<offsets.length;i++){
        if(i&&i%12===0)yield;
        var o=offsets[i],x=o[0],y=o[1];
        if(!parts.every(function(a){return fits(a.x+x,a.y+y,a.w,dry);})||!connected(x,y))continue;
        if(!parts.every(function(a){return connected(a.x+x,a.y+y)&&fits(a.x+x,a.y+y,a.w,solid);}))continue;
        center={x:x,y:y};break;
      }
    }
    var propMargin=model.hideBuildings?0:fx().props.margin;
    function propLand(x,y){
      var s=sign(x,y);
      if(s<=0||s<propMargin)return false;
      var p=world(x,y);
      return !G.Terrain.isLake(p[0],p[1]);
    }
    // 쌍서는 동굴 발치를 먼저 잡아 두고, 부두는 그 자리를 피해 물가에 붙인다.
    var prop=null, template=propGeometry(model,width,false), buildings=[];
    if(model.hideBuildings){
      prop=yield* findProp(template,center,buildings,null,dry,propLand,function(x,y){return connected(x,y,propLand);});
    }
    // 부두는 확대해도 같은 지면 폭을 덮어야 입구와 배가 서로 다른 쪽에 놓인다.
    var harbor=fx().harbor, quay=null;
    if(model.harbor){
      var quayWidth=harbor.width[model.hideBuildings?1:model.n], limit=fx().shoreSearch;
      quay=yield* findQuay(dry,wet,sign,sail,connected,center,direction,quayWidth,limit,null,prop);
      if(!quay&&c.dock){
        var dock=[dx,(originY-c.dock[0]-lift(c.dock[1],c.dock[0]))*zoom];
        quay=yield* findQuay(dry,wet,sign,sail,connected,center,direction,quayWidth,limit,dock,prop);
      }
    }
    // 해안에 땅이 비좁으면 시설 사이 간격과 크기를 함께 줄여 같은 물가를 바라보게 한다.
    var bank=quay&&{x:quay.land[0],y:quay.land[1]}, coastal=false;
    if(bank&&!model.hideBuildings&&(parts.length||model.prop)&&Math.hypot(center.x-bank.x,center.y-bank.y)>width*harbor.landward){
      var bx=bank.x-quay.water[0],by=bank.y-quay.water[1],bl=Math.hypot(bx,by)||1;
      var tx=bank.x+bx/bl*width*harbor.landward,ty=bank.y+by/bl*width*harbor.landward;
      coast:for(var i=0;i<harbor.scales.length;i++){
        var scale=harbor.scales[i];
        for(var j=0;j<offsets.length;j++){
          var o=offsets[j];
          if(o[2]>harbor.coastSearch)break;
          if(j&&j%16===0)yield;
          var x=tx+o[0],y=ty+o[1];
          if(Math.hypot(x-home.x,y-home.y)>harbor.moveMax*zoom||!dry(x,y))continue;
          if(!parts.every(function(a){
            var ax=x+a.x*scale,ay=y+a.y*scale,w=a.w*scale;
            return Math.hypot(ax-bank.x,ay-bank.y)>w*.28&&fits(ax,ay,w,dry)&&fits(ax,ay,w,solid)&&connected(ax,ay,solid,bank);
          }))continue;
          center={x:x,y:y};
          buildings=parts.map(function(a){return {p:a.p,x:x+a.x*scale,y:y+a.y*scale,w:a.w*scale};});
          coastal=true;
          break coast;
        }
      }
    }
    if(!coastal)parts.forEach(function(a){
      for(var k=0;k<4;k++){
        var factor=1-k*.25, x=center.x+a.x*factor,y=center.y+a.y*factor;
        if(fits(x,y,a.w,dry)&&connected(x,y)&&fits(x,y,a.w,solid)){buildings.push({p:a.p,x:x,y:y,w:a.w});return;}
      }
      for(var j=1;j<=3;j++){
        var w=a.w*(1-j*.19);
        if(fits(center.x,center.y,w,solid)){buildings.push({p:a.p,x:center.x,y:center.y,w:w});return;}
      }
    });
    // 땅이 좁을 때는 건물별로 겹쳐 놓기보다 시가지 전체를 줄여 다시 맞춘다.
    var cfg=fx().settlementCompact, scales=fx().compactBlocks;
    if(buildings.length<parts.length){
      block:for(var i=0;i<scales.length;i++){
        var scale=scales[i];
        for(var j=0;j<offsets.length;j++){
          var o=offsets[j];
          if(o[2]>width*cfg.search)break;
          if(j&&j%16===0)yield;
          var x=center.x+o[0],y=center.y+o[1];
          if(!solid(x,y)||!parts.every(function(a){
            var ax=x+a.x*scale,ay=y+a.y*scale,w=a.w*scale;
            return fits(ax,ay,w,solid,0)&&connected(ax,ay,solid);
          }))continue;
          center={x:x,y:y};
          buildings=parts.map(function(a){return {p:a.p,x:x+a.x*scale,y:y+a.y*scale,w:a.w*scale};});
          break block;
        }
      }
    }
    // 아주 작은 섬에서는 같은 육지에 대표 건물부터 놓는다.
    var main=parts.find(function(a){return a.p===model.main;});
    if(main&&!buildings.some(function(a){return a.p===main.p;})){
      compact:for(var i=0;i<cfg.scales.length;i++){
        var w=main.w*cfg.scales[i];
        for(var j=0;j<offsets.length;j++){
          var o=offsets[j];
          if(o[2]>width*cfg.search)break;
          if(j&&j%16===0)yield;
          var x=home.x+o[0],y=home.y+o[1];
          if(!fits(x,y,w,solid,0)||!connected(x,y,solid))continue;
          buildings=buildings.filter(function(a){
            return Math.abs(a.x-x)>(a.w+w)*cfg.spacing[0]||Math.abs(a.y-y)>(a.w+w)*cfg.spacing[1];
          });
          buildings.push({p:main.p,x:x,y:y,w:w});
          buildings.sort(function(a,b){return a.y-b.y;});
          break compact;
        }
      }
    }
    if(!model.hideBuildings){
      prop=yield* findProp(template,center,buildings,quay,dry,propLand,function(x,y){
        return coastal?connected(x,y,solid,bank):connected(x,y);
      });
    }
    return {buildings:buildings,dock:quay,dry:true,center:center,prop:prop};
  }
  CI.cullPadding=function(c,zoom){
    var cfg=fx(), extent=cfg.search+cfg.width[3];
    if(c.port&&c.dock)extent+=cfg.shoreSearch+cfg.referenceZoom*Math.max(Math.abs(G.Geo.wrapLon(c.dock[1]-c.lon)),Math.abs(c.dock[0]-c.lat));
    return 24+extent*zoom/cfg.referenceZoom;
  };
  function modelView(n,opts){
    var cfg=fx();
    if(!opts.zoom)return {zoom:0,width:cfg.chart[n]*(opts.scale||1),scale:1};
    return {zoom:cfg.referenceZoom,width:cfg.width[n],scale:opts.zoom/cfg.referenceZoom};
  }
  CI.beginModels=function(){budget=fx().plansPerFrame;until=performance.now()+fx().prepareMs;};
  CI.site=function(c,model,view,force){
    if(!view.zoom||!G.Terrain||!G.Terrain.ready){
      var prop=!view.zoom?propGeometry(model,view.width,true):null, dock=null;
      if(model.harbor&&!view.zoom){
        var small=fx().harbor.smallChart;
        dock=model.hideBuildings&&prop?{art:atlas('quays','0'),x:small.x*prop.w,y:small.y*prop.w,w:small.width*prop.w}:
          {art:atlas('quays','0'),x:.22*view.width,y:.23*view.width,w:view.width*.26};
      }
      return {buildings:geometry(model,view.width),prop:prop,dock:dock};
    }
    var key=[model.layout,c.lon,c.lat,c.dock,view.width,view.zoom].join(':');
    var job=shoreMemo.get(c);
    if(job&&job.key!==key)job=null;
    if(job&&job.done)return job.value;
    if(!force&&(budget<=0||performance.now()>=until))return null;
    if(!force)budget--;
    if(!job){
      job={key:key,iterator:groundPlan(c,model,view.width,view.zoom)};
      shoreMemo.set(c,job);
    }
    do {
      var next=job.iterator.next();
      if(next.done){job.value=next.value;job.done=true;delete job.iterator;return job.value;}
    }while(force||performance.now()<until);
    return null;
  };

  // 매 장면 다시 보정하지 않고 화면에 들어온 대표 건물의 색과 명암을 한 번만 다듬는다.
  function principalSprite(art,im){
    var r=art.r,key=art.key+':'+r[0]+':'+r[1]+':'+r[2]+':'+r[3], saved=principalCache.get(key);
    if(saved&&saved.source===im)return saved.canvas;
    if(typeof document==='undefined')return null;
    var cfg=fx().principalCache, limit=Math.min(1,cfg.side/Math.max(r[2],r[3]));
    var cv=document.createElement('canvas');
    cv.width=Math.max(1,Math.round(r[2]*limit));cv.height=Math.max(1,Math.round(r[3]*limit));
    var cx=cv.getContext('2d');
    if(cx&&'filter' in cx){
      cx.filter=fx().principalFilter;cx.imageSmoothingQuality='high';
      cx.drawImage(im,r[0],r[1],r[2],r[3],0,0,cv.width,cv.height);
    }else cv=null;
    principalCache.set(key,{source:im,canvas:cv});
    if(principalCache.size>cfg.limit)principalCache.delete(principalCache.keys().next().value);
    return cv;
  }
  function paint(ctx,art,im,x,y,w,bounds,shadow,highlight){
    var r=art.r, l=x-r[4]*w, t=y-r[5]*w, h=w*r[3]/r[2];
    if(shadow){
      ctx.fillStyle=fx().shade;ctx.beginPath();
      ctx.ellipse(x+w*.03,y+w*.032,w*.31,w*.105,-.23,0,Math.PI*2);ctx.fill();
    }
    var sprite=highlight&&principalSprite(art,im);
    if(sprite)ctx.drawImage(sprite,l,t,w,h);
    else ctx.drawImage(im,r[0],r[1],r[2],r[3],l,t,w,h);
    bounds.push([l,t,l+w,t+h]);
  }
  function boundsOf(all,y,artX,artY,width){
    var a={left:artX-7,top:artY-y-7,right:artX+7,bottom:artY-y+7};
    all.forEach(function(r){a.left=Math.min(a.left,r[0]);a.top=Math.min(a.top,r[1]-y);a.right=Math.max(a.right,r[2]);a.bottom=Math.max(a.bottom,r[3]-y);});
    return {width:width,height:a.bottom-a.top,radius:Math.max(9,a.right-artX),
      top:a.top,base:a.bottom,left:a.left,right:a.right,y:artY,anchorX:artX,boxes:all};
  }
  CI.hit=function(mark,x,y){
    return !!(mark&&mark.boxes&&mark.boxes.some(function(r){return x>=r[0]-3&&x<=r[2]+3&&y>=r[1]-3&&y<=r[3]+3;}));
  };
  function waiting(ctx,x,y,width){
    ctx.save();
    ctx.fillStyle='#d9b36f';ctx.strokeStyle='#3e3021';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.restore();
    return boundsOf([],y,x,y,width);
  }
  CI.draw=function(ctx,c,x,y,opts){
    opts=opts||{};
    var model=CI.plan(c), view=modelView(model.n,opts), ratio=view.scale, width=view.width*ratio;
    var im=model.hideBuildings?null:asset('map-cities/'+model.culture,opts);
    if(!model.hideBuildings&&!im)return view.zoom?waiting(ctx,x,y,width):oldDraw(ctx,c,x,y,opts);
    var plan=CI.site(c,model,view,false);
    if(!plan)return waiting(ctx,x,y,width);
    var all=[], center=plan.center||{x:0,y:0};
    var ax=x+center.x*ratio,ay=y+center.y*ratio;
    ctx.save();
    ctx.imageSmoothingEnabled=true;
    plan.buildings.forEach(function(item){
      var art=item.p.art, pic=asset(art.key,opts);
      // 외관이 읽히기 전에는 같은 역할의 지역 모형을 쓴다.
      if(!pic){art=atlas(model.culture,FALLBACK[item.p.role]||item.p.role);pic=im;}
      var main=model.main,highlight=view.zoom&&main&&item.p.role===main.role&&item.p.id===main.id;
      if(art)paint(ctx,art,pic,x+item.x*ratio,y+item.y*ratio,item.w*ratio,all,true,highlight);
    });
    var prop=plan.prop, propBox=null;
    if(prop){
      var propImage=asset(prop.art.key,opts);
      if(propImage){
        paint(ctx,prop.art,propImage,x+prop.x*ratio,y+prop.y*ratio,prop.w*ratio,all,!!view.zoom);
        propBox=all[all.length-1];
      }
    }
    // 쌍서에서는 부두까지 포함해 이름표가 가리지 않도록 한다.
    var mark=model.hideBuildings?null:boundsOf(all,y,ax,ay,width);
    var q=plan.dock;
    if(q&&q.art){var qm=asset(q.art.key,opts);if(qm)paint(ctx,q.art,qm,x+q.x*ratio,y+q.y*ratio,q.w*ratio,all,false);}
    if(!mark)mark=boundsOf(all,y,ax,ay,width);
    if(propBox)mark.prop={id:prop.id,box:propBox};
    var own=!model.hideBuildings&&opts.owner!==false&&G.Dominion&&G.R.cityOwner(c), color=own&&G.Dominion.color(own);
    if(color&&all.length){
      var w=clamp(width*.23,9,23), base=ay+3;
      ctx.fillStyle='rgba(20,14,8,.68)';ctx.fillRect(ax-w/2-1,base-1,w+2,4);
      ctx.fillStyle=color;ctx.fillRect(ax-w/2,base,w,2);
    }
    if(!model.hideBuildings&&opts.auto&&all.length){
      ctx.strokeStyle='#74c6bb';ctx.lineWidth=1.45;ctx.beginPath();
      ctx.ellipse(ax,ay+3,Math.max(6,width*.15),3.5,0,0,Math.PI*2);ctx.stroke();
    }
    if(!all.length){
      ctx.fillStyle=color||'#d9b36f';ctx.strokeStyle='#3e3021';
      ctx.beginPath();ctx.arc(ax,ay,3,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
    ctx.restore();
    return mark;
  };
  CI.view=function(c,opts){return modelView(CI.plan(c).n,opts);};
})(window.G=window.G||{});
