/* 실측 고도·생물군계와 공유 수로. 렌더러·충돌·뱃길·뭍길이 같은 원본을 읽는다. */
(function(G){
  'use strict';
  var H=G.Hydro={}, T=G.Terrain={}, segments=[], grid=Object.create(null), detail=null, patches=null, original=null;
  var routes=G.WATERWAYS||[], byId=Object.create(null), degrees=Math.PI/180;
  function rules(){return G.BALANCE.waterways;}
  function wrap(x){return G.Geo.wrapLon(x);}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hash(x,y){return G.Geo.hash2(x,y);}
  function key(x,y){return Math.floor(wrap(x))+':'+Math.floor(y);}
  function state(){return G.Game&&G.Game.state;}
  function date(ctx){return ctx&&ctx.date||state()&&state().date||{y:1480,m:5,d:15};}
  function mount(ctx){return ctx&&ctx.mount||state()&&state().loc&&state().loc.mount||{id:'walk',n:0};}
  function pixels(lon,lat){return [(wrap(lon)+180)/360*detail.W-.5,(90-lat)/180*detail.H-.5];}
  function atChannel(x,y,c){x=((x%detail.W)+detail.W)%detail.W;y=clamp(y,0,detail.H-1);return detail.raw[(y*detail.W+x)*4+c];}
  T.sample=function(lon,lat){
    if(!detail)return {elevation:0,biome:0,lake:false};
    var q=pixels(lon,lat),x=Math.floor(q[0]),y=Math.floor(q[1]),a=q[0]-x,b=q[1]-y;
    function elev(ix,iy){return atChannel(ix,iy,0)*256+atChannel(ix,iy,1)-12000;}
    var n=elev(x,y)*(1-a)+elev(x+1,y)*a,s=elev(x,y+1)*(1-a)+elev(x+1,y+1)*a;
    var ix=Math.floor(q[0]+.5),iy=Math.floor(q[1]+.5);
    var height=n*(1-b)+s*b;
    if(patches)for(var k=0;k<patches.areas.length;k++){
      var r=patches.areas[k].rect,u=(wrap(lon)-r[0])/r[2],v=(r[1]+r[3]-lat)/r[3];if(u<0||u>1||v<0||v>1)continue;
      var side=patches.side,fx=u*side-.5,fy=v*side-.5,px=Math.floor(fx),py=Math.floor(fy),tx=fx-px,ty=fy-py;
      function value(x,y){var i=(k*side*side+clamp(y,0,side-1)*side+clamp(x,0,side-1))*2;return patches.raw[i]*256+patches.raw[i+1]-12000;}
      var upper=value(px,py)*(1-tx)+value(px+1,py)*tx,lower=value(px,py+1)*(1-tx)+value(px+1,py+1)*tx;
      var edge=clamp(Math.min(u,v,1-u,1-v)/.08,0,1);edge=edge*edge*(3-2*edge);height+=(upper*(1-ty)+lower*ty-height)*edge;break;
    }
    return {elevation:height,biome:atChannel(ix,iy,2),lake:T.isLake(lon,lat)};
  };
  T.texture=function(){return detail&&detail.raw;};
  T.patches=function(){return patches;};
  function lakeField(lon,lat){if(!detail)return 0;var q=pixels(lon,lat),x=Math.floor(q[0]),y=Math.floor(q[1]),a=q[0]-x,b=q[1]-y;return(atChannel(x,y,3)*(1-a)+atChannel(x+1,y,3)*a)*(1-b)+(atChannel(x,y+1,3)*(1-a)+atChannel(x+1,y+1,3)*a)*b;}
  T.isLake=function(lon,lat){return lakeField(lon,lat)>128;};
  T.nearLake=function(lon,lat){return lakeField(lon,lat)>96;};
  T.size=function(){return detail?{W:detail.W,H:detail.H}:null;};
  T.biome=function(lon,lat){if(!detail)return 0;var q=pixels(lon,lat);return atChannel(Math.floor(q[0]+.5),Math.floor(q[1]+.5),2);};
  T.landClass=function(lon,lat){
    var d=T.sample(lon,lat),c=original.climate(lon,lat),h=d.elevation,b=d.biome;
    if(c.ice>.6||h>4200&&Math.abs(lat)>55)return 'ice';
    if(h>3600)return 'snow';
    if(h>1400)return 'mountain';
    if(b===13)return 'desert';
    if(b===1||b===2||b===3||b===14)return 'jungle';
    if(b===4||b===5||b===6)return 'forest';
    if(b===11)return 'tundra';
    if(b===7||b===8||b===9||b===10)return 'steppe';
    if(b===12)return 'grass';
    return original.terrain(lon,lat);
  };
  T.species=function(lon,lat){
    var d=T.sample(lon,lat),p=G.REGIONAL_VEGETATION||[],choices=[];
    for(var i=0;i<p.length;i++){var r=p[i],b=r.box;if(lon>=b[0]&&lon<=b[1]&&lat>=b[2]&&lat<=b[3]&&r.biomes.indexOf(d.biome)>=0)choices.push(r);}
    if(choices.length)return choices[Math.floor(hash(Math.floor(lon*20),Math.floor(lat*20))*choices.length)%choices.length];
    return {id:d.biome===6?'boreal':d.biome===1?'tropical':'oak',form:d.biome===6||d.biome===5&&d.elevation>500?'pine':d.biome===1?'tropical':'oak',name:'지역 숲'};
  };
  function add(a,b,r,index,nav){
    var dx=wrap(b[0]-a[0]),dy=b[1]-a[1];if(Math.abs(dx)>30||Math.hypot(dx,dy)<.00001)return;
    var s={a:a,b:[a[0]+dx,b[1]],dx:dx,dy:dy,r:r,index:index,nav:nav};var id=segments.length;segments.push(s);
    var pad=nav?r.displayHalf+.25:.12;
    for(var y=Math.floor(Math.min(a[1],b[1])-pad);y<=Math.floor(Math.max(a[1],b[1])+pad);y++)
      for(var x=Math.floor(Math.min(a[0],a[0]+dx)-pad);x<=Math.floor(Math.max(a[0],a[0]+dx)+pad);x++){
        var k=key(x+.01,y+.01);(grid[k]||(grid[k]=[])).push(id);
      }
  }
  function project(s,lon,lat){
    var k=Math.max(.12,Math.cos(lat*degrees)),px=wrap(lon-s.a[0])*k,py=lat-s.a[1],vx=s.dx*k,vy=s.dy;
    var t=clamp((px*vx+py*vy)/(vx*vx+vy*vy),0,1),dx=px-vx*t,dy=py-vy*t;
    return {distance:Math.hypot(dx,dy),t:t,point:[wrap(s.a[0]+s.dx*t),s.a[1]+s.dy*t]};
  }
  function section(s,t){
    var r=s.r,progress=s.nav?(r.lengths?(r.lengths[s.index]+(r.lengths[s.index+1]-r.lengths[s.index])*t)/r.total:(s.index+t)/Math.max(1,r.pts.length-1)):.5;
    var w=s.nav?r.displayHalf*(1-.52*progress):r.half;
    return {half:w,progress:progress,width:s.nav?r.width[0]+(r.width[1]-r.width[0])*progress:Math.max(8,25*(8-r.rank)),
      depth:s.nav?r.depth[0]+(r.depth[1]-r.depth[0])*progress:0,turn:s.nav?r.turn*(1-.35*progress):0};
  }
  H.at=function(lon,lat){
    var ids=grid[key(lon,lat)],best=null,bd=1e9;
    if(!ids)return null;
    for(var i=0;i<ids.length;i++){
      var s=segments[ids[i]],p=project(s,lon,lat),v=section(s,p.t),sd=p.distance-v.half;
      if(sd<bd&&sd<.20){bd=sd;best={id:s.r.id||'',name:s.r.name||'개울',route:s.nav&&!s.r.strait?s.r:null,strait:!!s.r.strait,segment:s,index:s.index,t:p.t,point:p.point,
        signed:sd,half:v.half,width:v.width,depth:v.depth,turn:v.turn,progress:v.progress,
        flow:[-s.dx/Math.hypot(s.dx,s.dy),-s.dy/Math.hypot(s.dx,s.dy)]};}
    }
    return best;
  };
  H.isWater=function(q,lon,lat){
    if(!q)return false;
    return q.signed<=0;
  };
  H.season=function(q,lon,lat,ctx){
    var d=date(ctx),k=rules(),m=d.m||1;
    if(lat<0)m=(m+5)%12+1;
    var frozen=Math.abs(lat)>=k.freezeLatitude&&k.winterMonths.indexOf(m)>=0;
    var flood=!!(q&&q.route&&q.route.flood.indexOf(d.m)>=0&&(d.d||1)<=k.floodDays&&!frozen);
    return {frozen:frozen,flood:flood};
  };
  H.fleetProfile=function(ships){
    ships=ships||state()&&state().fleet&&state().fleet.ships||[];
    var p={draft:1,beam:3,turn:28};
    ships.forEach(function(sh){var d=G.SHIP&&G.SHIP[sh.type],cap=d&&d.cap||sh.cap||100,c=Math.sqrt(cap),rr=rules();
      p.draft=Math.max(p.draft,rr.shipDraft[sh.type]||.75+c*.08);p.beam=Math.max(p.beam,3+c*.22);p.turn=Math.max(p.turn,(12+c*1.05)*rr.shipTurnSafety/Math.max(.6,d&&d.turn||1));
    });return p;
  };
  function routeRoot(r){return r.parent?routeRoot(byId[r.parent]):r;}
  function lakeInfo(lon,lat){
    if(!T.nearLake(lon,lat))return null;
    var list=G.TERRAIN_DETAIL.lakes;
    for(var i=0;i<list.length;i++){var b=list[i].box;if(lon>=b[0]-.1&&lon<=b[2]+.1&&lat>=b[1]-.1&&lat<=b[3]+.1)return list[i];}
    return {name:'호수'};
  }
  H.canSail=function(lon,lat,profile,ctx){
    var q=H.at(lon,lat),lake=T.isLake(lon,lat);
    if(lake&&!(q&&q.route&&H.isWater(q,lon,lat))){var l=lakeInfo(lon,lat);if(!l||!l.route||H.season(null,lon,lat,ctx).frozen)return false;}
    if(q&&H.isWater(q,lon,lat)){
      if(q.strait)return true;
      var r=q.route;if(!r)return lake?!!lakeInfo(lon,lat).route:original.isSea(lon,lat,.2);if(!r.connected)return false;
      var se=H.season(q,lon,lat,ctx);if(se.frozen)return false;
      var p=profile||H.fleetProfile();return q.depth>=p.draft&&q.width>=p.beam*rules().shipWidthSafety&&q.turn>=p.turn;
    }
    if(lake)return !!lakeInfo(lon,lat).route;
    return original.isSea(lon,lat,.2);
  };
  H.crossing=function(lon,lat,q){
    if(!q||!q.route)return null;var r=q.route,list=r.crossings||[];
    for(var i=0;i<list.length;i++)if(G.Geo.dist(lon,lat,list[i].lon,list[i].lat)<.26)return list[i];
    return null;
  };
  H.landEffect=function(lon,lat,ctx){
    var q=H.at(lon,lat);if(!q||!H.isWater(q,lon,lat))return {allowed:original.sdf(lon,lat)>0,speed:1,risk:0,river:null};
    if(q.strait)return {allowed:false,speed:0,risk:0,river:null};
    var se=H.season(q,lon,lat,ctx),m=mount(ctx),id=m.id||m,bridge=H.crossing(lon,lat,q),k=rules();
    if(bridge)return {allowed:true,speed:1,risk:0,river:q,bridge:bridge};
    if(se.frozen)return {allowed:true,speed:id==='reindeer'?2.6:1.05,risk:id==='reindeer'?0:.008,river:q,frozen:true};
    if(se.flood)return {allowed:false,speed:0,risk:0,river:q,flood:true,reason:'불어난 강물 때문에 지금은 건널 수 없습니다.'};
    var big=q.width>250,a=k.mounts[id]||k.mounts.walk;
    return {allowed:!(big&&id==='wagon'),speed:a[big?1:0],risk:a[2]*(big?1:.4),river:q,
      reason:big&&id==='wagon'?'마차로 큰 강을 건널 수 없습니다. 다리나 나루가 있는 도시를 찾으십시오.':null};
  };
  H.canWalk=function(lon,lat,ctx){if(T.isLake(lon,lat))return false;return H.landEffect(lon,lat,ctx).allowed;};
  // 한 번의 큰 걸음이 강 전체를 건너뛰어도 물속 구간에 든 시간을 지불한다.
  H.landStep=function(a,dir,length,startFactor){
    if(length<=0)return length;var n=Math.max(1,Math.ceil(length/.012)),ds=length/n,budget=length/Math.max(.01,startFactor),spent=0;
    for(var i=0;i<n;i++){
      var d=(i+.5)*ds,e=H.landEffect(a[0]+dir[0]*d,a[1]+dir[1]*d);
      if(!e.allowed)return length; // 기존 선분 충돌이 이동을 막고 안내한다.
      var cost=ds/Math.max(.01,e.river?e.speed:1);
      if(spent+cost>budget)return i*ds+(budget-spent)/cost*ds;
      spent+=cost;
    }
    return length;
  };
  H.freshwater=function(lon,lat){
    var l=lakeInfo(lon,lat);if(l&&lakeField(lon,lat)>=128-rules().freshRadius*G.Geo.TEX_PER_DEG*16&&!/Caspian|Aral|Dead|Salt/i.test(l.name))return {name:l.name||'호수'};
    var q=H.at(lon,lat);if(q&&q.signed<rules().freshRadius&&(!q.route||q.progress>.12))return {name:q.name};
    return null;
  };
  H.landDay=function(s,msgs,rng){
    var l=s.loc,e=H.landEffect(l.lon,l.lat),fresh=H.freshwater(l.lon,l.lat),day=s.day||0;
    if(fresh){l.riverWaterUntil=day+rules().refillDays;if(l.riverWaterNotice!==fresh.name){msgs.push({icon:'drop',text:fresh.name+'에서 탐험대의 식수를 보충했다. 물을 구하는 경비가 줄어든다.'});l.riverWaterNotice=fresh.name;}}
    else l.riverWaterNotice=null;
    if(!e.river||!e.risk||e.bridge)return;
    var checked=day+':'+(e.river.id||e.river.name);
    if(l.riverRiskChecked===checked)return;
    l.riverRiskChecked=checked;
    if((rng?rng():Math.random())<e.risk){
      l.lastRiverLossDay=day;var m=l.mount;
      if(m&&m.n>0&&m.id!=='walk'&&m.id!=='porter'){m.n--;msgs.push({icon:'skull',text:'강을 건너다 '+G.Mounts.get(m.id).name+' 한 마리를 잃었다.'});if(m.n<=0)l.mount={id:'walk',n:0};}
      else {var lost=Math.min(s.player.gold,Math.max(1,Math.round(s.player.gold*rules().cargoLoss)));s.player.gold-=lost;msgs.push({icon:'sack',text:'강물에 짐을 놓쳐 금화 '+lost+'닢 상당을 잃었다.'});}
    }
  };
  H.movedLand=function(s,a,b){
    var dx=wrap(b[0]-a[0]),dy=b[1]-a[1],n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.012)),old=s.loc;
    for(var i=1;i<=n;i++){
      var x=wrap(a[0]+dx*i/n),y=a[1]+dy*i/n,e=H.landEffect(x,y);
      if(!e.river)continue;
      var saved=[old.lon,old.lat];old.lon=x;old.lat=y;var msgs=[];H.landDay(s,msgs);old.lon=saved[0];old.lat=saved[1];
      if(G.UI)msgs.forEach(function(m){G.UI.toast(m.text,m.icon,4000);});
      break;
    }
  };
  H.clear=function(a,b,profile,ctx){
    var dx=wrap(b[0]-a[0]),dy=b[1]-a[1],n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.012));
    for(var i=0;i<=n;i++)if(!H.canSail(a[0]+dx*i/n,a[1]+dy*i/n,profile,ctx))return false;
    return true;
  };
  function projectRoute(r,p){
    var best=null,bd=1e9;
    for(var i=1;i<r.full.length;i++){var a=r.full[i-1],b=r.full[i],s={a:a,b:b,dx:wrap(b[0]-a[0]),dy:b[1]-a[1]},v=project(s,p[0],p[1]);if(v.distance<bd){bd=v.distance;best={r:r,index:i-1,t:v.t,point:v.point};}}
    return best;
  }
  function tail(v){var out=[v.point];for(var i=v.index;i>=0;i--)out.push(v.r.full[i]);return out;}
  function head(v){return tail(v).reverse();}
  function lakeRoute(p){if(!T.isLake(p[0],p[1]))return null;var l=lakeInfo(p[0],p[1]);return l&&l.route?byId[l.route]:null;}
  H.path=function(a,b,base,profile){
    profile=profile||H.fleetProfile();var qa=H.at(a[0],a[1]),qb=H.at(b[0],b[1]),ra=qa&&qa.route&&H.isWater(qa,a[0],a[1])?qa.route:lakeRoute(a),rb=qb&&qb.route&&H.isWater(qb,b[0],b[1])?qb.route:lakeRoute(b);
    var waterA=qa&&!qa.strait&&H.isWater(qa,a[0],a[1]),waterB=qb&&!qb.strait&&H.isWater(qb,b[0],b[1]),la=T.isLake(a[0],a[1]),lb=T.isLake(b[0],b[1]);
    H.lastReason=null;
    if(!(waterA||waterB||la||lb))return undefined;
    if((waterA||la)&&!H.canSail(a[0],a[1],profile)||(waterB||lb)&&!H.canSail(b[0],b[1],profile)){
      H.lastReason='이 함대는 강의 폭·수심·선회 여유 또는 결빙 조건 때문에 들어갈 수 없습니다.';return null;
    }
    var pa=ra?projectRoute(ra,a):null,pb=rb?projectRoute(rb,b):null,out=[];
    if(pa&&pb&&ra===rb){
      var forward=pa.index+pa.t<=pb.index+pb.t;out=[a,pa.point];
      if(forward){for(var j=pa.index+1;j<=pb.index;j++)out.push(ra.full[j]);}
      else {for(var j=pa.index;j>pb.index;j--)out.push(ra.full[j]);}
      out.push(pb.point,b);
    }else if(pa&&pb&&routeRoot(ra)===routeRoot(rb)){
      var common=0;while(common<ra.full.length&&common<rb.full.length&&G.Geo.dist(ra.full[common][0],ra.full[common][1],rb.full[common][0],rb.full[common][1])<.02)common++;
      var junction=Math.min(common-1,pa.index,pb.index);out=[a,pa.point];for(var j=pa.index;j>=junction;j--)out.push(ra.full[j]);for(var j=junction+1;j<=pb.index;j++)out.push(rb.full[j]);out.push(pb.point,b);
    }else{
      var start=pa?ra.full[0]:a,end=pb?rb.full[0]:b,sea=base(start[0],start[1],end[0],end[1]);
      if(!sea)return null;
      out=pa?[a].concat(tail(pa)):[];out=out.concat(sea);if(pb)out=out.concat(head(pb),[b]);
    }
    var clean=[];
    out.forEach(function(p){if(!clean.length||G.Geo.dist(p[0],p[1],clean[clean.length-1][0],clean[clean.length-1][1])>.0001)clean.push(p);});
    for(var i=1;i<clean.length;i++)if(!H.clear(clean[i-1],clean[i],profile)){H.lastReason='이 함대가 통과할 수 있는 이어진 수로가 없습니다.';return null;}
    return clean;
  };
  // 화면보다 넓은 판에 수로 거리장을 굽는다. CPU 통행과 같은 선분·폭을 쓰며, 바다는 원래 해안선을 쓴다.
  H.raster=function(lon,lat,spanX,spanY,side){
    side=side||1024;var lo=lon-spanX/2,la=lat-spanY/2,dx=spanX/side,dy=spanY/side,N=side*side;
    var raw=new Uint8Array(N*4),field=new Float32Array(N);field.fill(4);
    for(var i=0;i<N;i++){raw[i*4]=255;raw[i*4+1]=255;}
    var set=Object.create(null),ids=[];
    for(var y=Math.floor(la-.3);y<=Math.ceil(la+spanY+.3);y++)for(var x=Math.floor(lo-.3);x<=Math.ceil(lo+spanX+.3);x++){
      var bucket=grid[key(x+.01,y+.01)]||[];for(var j=0;j<bucket.length;j++)if(!set[bucket[j]]){set[bucket[j]]=1;ids.push(bucket[j]);}
    }
    for(var k=0;k<ids.length;k++){
      var s=segments[ids[k]],ax=lon+wrap(s.a[0]-lon),bx=ax+s.dx,ay=s.a[1],by=s.b[1],rad=(s.nav?s.r.displayHalf:.04)+Math.max(dx,dy)*3+.07;
      var xrad=rad/Math.max(.12,Math.cos(Math.max(Math.abs(ay),Math.abs(by))*degrees));
      var x0=clamp(Math.floor((Math.min(ax,bx)-xrad-lo)/dx),0,side-1),x1=clamp(Math.ceil((Math.max(ax,bx)+xrad-lo)/dx),0,side-1);
      var y0=clamp(Math.floor((Math.min(ay,by)-rad-la)/dy),0,side-1),y1=clamp(Math.ceil((Math.max(ay,by)+rad-la)/dy),0,side-1);
      if(Math.max(ax,bx)+xrad<lo||Math.min(ax,bx)-xrad>lo+spanX||Math.max(ay,by)+rad<la||Math.min(ay,by)-rad>la+spanY)continue;
      var len=Math.hypot(s.dx,s.dy),angle=(Math.atan2(-s.dy,-s.dx)+Math.PI)/Math.PI/2;
      var flood=s.nav&&!s.r.strait&&H.season({route:s.r},0,(ay+by)/2).flood;
      for(var yy=y0;yy<=y1;yy++){var lat0=la+(yy+.5)*dy,cos=Math.max(.12,Math.cos(lat0*degrees)),vx=s.dx*cos,vy=s.dy,L=vx*vx+vy*vy;
        for(var xx=x0;xx<=x1;xx++){
          var px=(lo+(xx+.5)*dx-ax)*cos,py=lat0-ay,t=clamp((px*vx+py*vy)/L,0,1);
          var rp=!s.nav?.5:s.r.lengths?(s.r.lengths[s.index]+(s.r.lengths[s.index+1]-s.r.lengths[s.index])*t)/s.r.total:(s.index+t)/Math.max(1,s.r.pts.length-1);
          var half=s.nav?s.r.displayHalf*(1-.52*rp):s.r.half;
          var d=Math.hypot(px-vx*t,py-vy*t)-half,idx=yy*side+xx;
          if(d>=field[idx])continue;field[idx]=d;var n=clamp(Math.round(32768+d*8192),0,65535),o=idx*4;
          raw[o]=n>>8;raw[o+1]=n&255;raw[o+2]=s.r.strait?192:s.nav?(flood?144:128):64;raw[o+3]=Math.round(angle*255);
        }
      }
    }
    return {raw:raw,side:side,rect:[lo,la,spanX,spanY],segments:ids.length};
  };
  H.routes=function(){return routes;};
  // GPU 거리장도 아래 CPU 판과 같은 선분·끝점 폭·계절을 받는다. 픽셀 계산만 GPU가 맡는다.
  H.rasterSegments=function(lon,lat,spanX,spanY){
    var lo=lon-spanX/2,la=lat-spanY/2,seen=Object.create(null),out=[];
    for(var y=Math.floor(la-.4);y<=Math.ceil(la+spanY+.4);y++)for(var x=Math.floor(lo-.4);x<=Math.ceil(lo+spanX+.4);x++){
      var ids=grid[key(x+.01,y+.01)]||[];for(var j=0;j<ids.length;j++){
        var id=ids[j];if(seen[id])continue;seen[id]=1;var s=segments[id],ax=lon+wrap(s.a[0]-lon)-lo,ay=s.a[1]-la,bx=ax+s.dx,by=ay+s.dy;
        var p=section(s,0),q=section(s,1),rad=Math.max(p.half,q.half)+.20,xrad=rad/Math.max(.12,Math.cos(Math.max(Math.abs(s.a[1]),Math.abs(s.b[1]))*degrees));
        if(Math.max(ax,bx)+xrad<0||Math.min(ax,bx)-xrad>spanX||Math.max(ay,by)+rad<0||Math.min(ay,by)-rad>spanY)continue;
        var flood=s.nav&&!s.r.strait&&H.season({route:s.r},0,(s.a[1]+s.b[1])/2).flood,flag=s.r.strait?192:s.nav?(flood?144:128):64;
        out.push(ax,ay,bx,by,p.half,q.half,flag,(Math.atan2(-s.dy,-s.dx)+Math.PI)/Math.PI/2);
      }
    }
    return {data:new Float32Array(out),rect:[lo,la,spanX,spanY],count:out.length/8};
  };
  H.stats=function(){return {segments:segments.length,buckets:Object.keys(grid).length,routes:routes.length};};
  T.init=function(){
    if(T.ready||!G.TERRAIN_DETAIL)return;
    var D=G.TERRAIN_DETAIL,geo=G.Geo;
    detail={W:D.W,H:D.H,raw:G.unpackB64(D.tex,D.W*D.H*4)};
    var P=G.TERRAIN_PATCHES;if(P)patches={side:P.side,areas:P.areas,raw:G.unpackB64(P.data,P.side*P.side*2*P.areas.length)};
    original={sdf:geo.sdf,sdfRaw:geo.sdfRaw,isSea:geo.isSea,climate:geo.climate,terrain:geo.terrain};
    var noisy=original.sdf;original.sdf=function(lon,lat){return T.nearLake(lon,lat)?original.sdfRaw(lon,lat):noisy(lon,lat);};
    // 옛 isSea 함수도 Geo.sdf를 참조하므로 그대로 붙잡으면 새 강을 바다로 오인한다.
    original.isSea=function(lon,lat,margin){return original.sdf(lon,lat)<-(margin||.25)&&!geo.berg(lon,lat);};
    geo.baseSdf=original.sdf;geo.baseSdfRaw=original.sdfRaw;geo.baseIsSea=original.isSea;
    // 운하는 제작 단계에서 제외한다. 가는 강도 표시와 도보 판정에 공용한다.
    D.rivers.forEach(function(row){var r={name:row[0]||'개울',rank:row[1],half:clamp(.031-row[1]*.002,.012,.028)};for(var j=1;j<row[2].length;j++)add(row[2][j-1],row[2][j],r,j-1,false);});
    routes.forEach(function(r){byId[r.id]=r;r.crossings=[];r.full=r.pts;});
    routes.forEach(function(r){
      if(r.parent){var p=byId[r.parent],q=projectRoute(p,r.pts[0]);r.full=p.full.slice(0,q.index+1).concat([q.point],r.pts);r.connected=!!p.connected;}
      else {var a=r.pts[0],b=r.pts[1],vx=a[0]-b[0],vy=a[1]-b[1],L=Math.hypot(vx,vy)||1;
        for(var j=0;j<=30;j++){var x=wrap(a[0]+vx/L*j*.04),y=a[1]+vy/L*j*.04;if(original.sdf(x,y)<-.5){if(j)r.pts.unshift([x,y]);r.connected=true;break;}}
        r.full=r.pts;
      }
      r.lengths=[0];r.total=0;
      for(var j=1;j<r.pts.length;j++){r.total+=G.Geo.dist(r.pts[j-1][0],r.pts[j-1][1],r.pts[j][0],r.pts[j][1]);r.lengths.push(r.total);}
      for(var j=1;j<r.pts.length;j++)add(r.pts[j-1],r.pts[j],r,j-1,true);
    });
    (geo.CHANNELS||[]).forEach(function(c){
      if(!c.pts)return;var r={id:'strait-'+c.name,name:c.name,pts:c.pts,displayHalf:c.w,width:[2000,2000],depth:[20,20],turn:900,strait:true,connected:true};
      for(var j=1;j<c.pts.length;j++)add(c.pts[j-1],c.pts[j],r,j-1,true);
    });
    // 연결된 강이 실제 호수 폴리곤 안으로 들어가는 경우에만 그 호수를 배에 개방한다.
    D.lakes.forEach(function(l){l.route=null;var b=l.box;routes.forEach(function(r){if(!r.connected)return;for(var j=1;j<r.pts.length;j++){
      var a=r.pts[j-1],p=r.pts[j];if(Math.max(a[0],p[0])<b[0]||Math.min(a[0],p[0])>b[2]||Math.max(a[1],p[1])<b[1]||Math.min(a[1],p[1])>b[3])continue;
      var n=Math.max(1,Math.ceil(G.Geo.dist(a[0],a[1],p[0],p[1])/.02));for(var k=0;k<=n;k++){var x=a[0]+(p[0]-a[0])*k/n,y=a[1]+(p[1]-a[1])*k/n;if(x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3]&&T.isLake(x,y)){l.route=r.id;break;}}
    }});});
    (G.CITY_DATA||[]).forEach(function(c){if(!c.port)return;var q=H.at(c.lon,c.lat);if(q&&q.route&&q.signed<.22)q.route.crossings.push({id:c.id,name:c.name,lon:q.point[0],lat:q.point[1]});});
    geo.sdf=function(lon,lat){var base=original.sdf(lon,lat),q=H.at(lon,lat);return q?Math.min(base,q.signed*geo.TEX_PER_DEG):base;};
    geo.sdfRaw=function(lon,lat){var base=original.sdfRaw(lon,lat),q=H.at(lon,lat);return q?Math.min(base,q.signed*geo.TEX_PER_DEG):base;};
    geo.isLand=function(lon,lat){return geo.sdf(lon,lat)>0;};
    geo.isSea=function(lon,lat,margin){var q=H.at(lon,lat);if(q&&H.isWater(q,lon,lat)||T.isLake(lon,lat))return H.canSail(lon,lat,{draft:1,beam:3,turn:28});return original.isSea(lon,lat,margin);};
    geo.canWalk=H.canWalk;
    geo.terrain=function(lon,lat){var q=H.at(lon,lat);if(q&&H.isWater(q,lon,lat))return H.season(q,lon,lat).frozen?'frozenriver':'river';if(geo.sdf(lon,lat)<=0)return 'sea';return T.landClass(lon,lat);};
    T.ready=H.ready=true;
  };
})(window.G=window.G||{});
