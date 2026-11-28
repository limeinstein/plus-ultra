/* 지형을 따라 움직이는 재해. 그리는 위치와 피해 판정은 같은 길·반경·시간을 쓴다. */
(function (G) {
  'use strict';
  var U = G.U, GD = G.GroundDisaster = {};
  function C() { return G.BALANCE.disaster.ground; }
  function wrap(x) { return G.Geo.wrapLon(x); }
  function dx(a,b) { return wrap(a-b); }
  function gap(x,y,a,b) { return Math.hypot(dx(x,a),y-b); }
  GD.handles = function (kind) { return !!(C()[kind] && typeof C()[kind] === 'object'); };
  function land(x,y) { return G.Geo.isLand(x,y) && !(G.Terrain && G.Terrain.isLake(x,y)); }
  function fireGround(x,y) { return land(x,y) && /^(forest|jungle|mountain)$/.test(G.Geo.terrain(x,y)); }
  function elevate(x,y) { return G.Terrain.sample(x,y).elevation; }
  function point(x,y,a,d) { return [wrap(x+Math.cos(a)*d),y+Math.sin(a)*d]; }
  function route(points) {
    var lengths = [0];
    for (var i=1;i<points.length;i++) lengths.push(lengths[i-1]+gap(points[i][0],points[i][1],points[i-1][0],points[i-1][1]));
    return {points:points,lengths:lengths,length:lengths[lengths.length-1]};
  }
  GD.pointAt = function (line,d) {
    var pts=line.points, lengths=line.lengths, at=U.clamp(d,0,line.length), i=1;
    while(i<pts.length-1&&at>lengths[i])i++;
    var a=pts[i-1], b=pts[i], n=lengths[i]-lengths[i-1], f=n?(at-lengths[i-1])/n:0;
    return [wrap(a[0]+dx(b[0],a[0])*f),U.lerp(a[1],b[1],f)];
  };
  GD.span = function (line,start,end) {
    var list=[GD.pointAt(line,start)];
    for(var i=1;i<line.points.length-1;i++)if(line.lengths[i]>start&&line.lengths[i]<end)list.push(line.points[i]);
    list.push(GD.pointAt(line,end));return list;
  };
  function downhill(x,y,reach) {
    if(!land(x,y))return null;
    var out=[[x,y]], previous=null, sample=.071, n=Math.ceil(reach/sample);
    for(var k=0;k<n;k++){
      var h=elevate(x,y), best=null, score=1.4, heading=0;
      for(var j=0;j<12;j++) {
        var a=j*Math.PI/6, p=point(x,y,a,sample);
        if(!land(p[0],p[1]))continue;
        var drop=h-elevate(p[0],p[1]), turn=previous==null?0:Math.abs(U.angDiff(previous,a));
        var grade=drop*(1-.19*turn);
        if(drop>1.4&&grade>score){best=p;score=grade;heading=a;}
      }
      if(!best)break;
      out.push(best);x=best[0];y=best[1];previous=heading;
    }
    return out.length>1?route(out):null;
  }
  // 지형 칸보다 작은 화산섬은 정상과 기슭의 높이가 같을 수 있어 해안까지 짧게 진행시킨다.
  function islandSlope(x,y) {
    var best=[];
    for(var i=0;i<12;i++){
      var ray=[];
      for(var j=1;j<=8;j++){
        var p=point(x,y,i*Math.PI/6,.009*j);
        if(!land(p[0],p[1]))break;
        ray.push(p);
      }
      if(ray.length>best.length)best=ray;
    }
    return best.length?route([[x,y]].concat(best)):null;
  }
  function faults(e,c,rng) {
    var list=[], a=rng()*Math.PI*2, span=Math.min(c.reach,e.r*.84);
    for(var branch=0;branch<3;branch++){
      var points=[], heading=a+branch*.71, count=branch===0?13:8, wide=branch===0?1:.53;
      for(var i=0;i<count;i++){
        var p=point(e.lon,e.lat,heading,span*wide*(i/(count-1)-.5));
        p=point(p[0],p[1],heading+Math.PI/2,(rng()-.5)*.095+(branch-1)*.12);
        if(land(p[0],p[1]))points.push(p);
        else if(points.length>1){list.push(route(points));points=[];}
        else points=[];
      }
      if(points.length>1)list.push(route(points));
    }
    return list;
  }
  function embers(e,c,rng) {
    var cells=[{x:e.lon,y:e.lat,delay:0,r:c.width}], a=rng()*Math.PI*2;
    for(var i=0;i<42&&cells.length<17;i++){
      var length=.075+rng()*(c.reach-.075), p=point(e.lon,e.lat,a+(rng()-.5)*2.8,length);
      if(!fireGround(p[0],p[1]))continue;
      var nearest=Infinity;
      for(var k=0;k<cells.length;k++)nearest=Math.min(nearest,gap(p[0],p[1],cells[k].x,cells[k].y));
      if(nearest<.075||nearest>.215)continue;
      cells.push({x:p[0],y:p[1],delay:length/c.spreadSpeed,r:c.width*(.68+rng()*.49)});
    }
    return cells;
  }
  GD.ensure = function (e) {
    if(!GD.handles(e.kind)||e.field!==undefined||!G.Hydro||!G.Hydro.ready)return e.field;
    var c=C()[e.kind], rng=U.makeRng(U.strHash(e.id+'/'+e.lon+'/'+e.lat));
    var f={age:0,wait:0,seed:Math.floor(rng()*1e9),warning:c.warning,life:c.life,width:c.width,extent:c.reach*1.6};
    e.field=null;
    if(e.kind==='quake'){
      f.lines=faults(e,c,rng);
      if(!f.lines.length)return null;
    }else if(e.kind==='fire'){
      if(!fireGround(e.lon,e.lat))return null;
      f.cells=embers(e,c,rng);
    }else if(e.kind==='flood'){
      var river=G.Hydro.floodReach(e.lon,e.lat,c.reach);
      for(var n=1;e.hist&&!river&&n<=24;n++){
        var nearby=point(e.lon,e.lat,n*2.39996,Math.ceil(n/8)*.21);
        river=G.Hydro.floodReach(nearby[0],nearby[1],c.reach);
      }
      if(!river)return null;
      f.river=river.name;f.width+=river.half;f.line=route(river.points);f.extent+=gap(e.lon,e.lat,river.center[0],river.center[1]);
    }else{
      if(e.kind==='landslide'&&G.Geo.terrain(e.lon,e.lat)!=='mountain')return null;
      f.line=downhill(e.lon,e.lat,c.reach);
      if(!f.line&&e.kind==='volcano'){
        var vent=G.volcanoSite(e.volcanoId,e.lon,e.lat);
        if(vent&&vent.smallIsland)f.line=islandSlope(e.lon,e.lat);
      }
      if(!f.line)return null;
      if(e.kind==='landslide'){
        f.rocks=[];
        for(var i=0;i<c.rocks;i++) f.rocks.push({delay:i*.104+rng()*.12,speed:c.speed*(.64+rng()*.68),
          radius:.016+rng()*.032,lane:(rng()-.5)*c.width*1.17,angle:rng()*6.28});
      }
    }
    e.field=f;return f;
  };
  GD.open = function (e) { var f=e.field;return f&&f.age<f.life; };
  GD.roughness = function (e,kind,age) {
    var f=e.field,t=age==null?f.age:age;
    if(kind==='quake')return U.clamp((f.life-t)/1.3,0,1)*U.clamp(t/.72,.23,1);
    if(kind==='flood')return U.clamp((t-f.warning)/1.55,0,1)*U.clamp((f.life-t)/2.1,0,1);
    return 1;
  };
  GD.lavaDistance = function (e,age) {
    return U.clamp((age-e.field.warning)*C().volcano.speed,0,e.field.line.length);
  };
  GD.rockAt = function (e,item,age) {
    var f=e.field, run=age-f.warning-item.delay, d=run*item.speed;
    if(run<0||d>f.line.length)return null;
    var p=GD.pointAt(f.line,d), q=GD.pointAt(f.line,Math.min(f.line.length,d+.023)), a;
    if(d>=f.line.length-.0001){q=p;p=GD.pointAt(f.line,d-.023);}
    a=Math.atan2(q[1]-p[1],dx(q[0],p[0]));
    if(d>=f.line.length-.0001)p=q;
    var r=point(p[0],p[1],a+Math.PI*.5,item.lane);
    return {x:r[0],y:r[1],angle:a,r:item.radius,time:run};
  };
  GD.fireHeat = function (e,cell,age) {
    var c=C().fire, time=age-e.field.warning-cell.delay;
    return time<0?0:U.clamp((c.burnDays-time)/.9,0,1)*U.clamp(.36+time*2.1,0,1);
  };
  function lineDistance(line,x,y,end) {
    var best=Infinity;
    for(var i=1;i<line.points.length;i++){
      var a=line.points[i-1], b=line.points[i], vx=dx(b[0],a[0]), vy=b[1]-a[1], len=line.lengths[i]-line.lengths[i-1];
      var max=end==null||!len?1:U.clamp((end-line.lengths[i-1])/len,0,1);
      var px=dx(x,a[0]), py=y-a[1], s=len?U.clamp((px*vx+py*vy)/(len*len),0,max):0;
      best=Math.min(best,Math.hypot(px-s*vx,py-s*vy));
      if(max<1)break;
    }
    return best;
  }
  function margin(e,x,y,age,preview) {
    var f=e.field, width=f.width, near=Infinity, i;
    if(!preview&&(age<f.warning||age>=f.life))return near;
    if(e.kind==='quake'){
      for(i=0;i<f.lines.length;i++)near=Math.min(near,lineDistance(f.lines[i],x,y)-width);
    }else if(e.kind==='flood'){
      var fill=preview?1:GD.roughness(e,'flood',age);
      if(fill>.03)near=lineDistance(f.line,x,y)-width*fill;
    }else if(e.kind==='volcano'){
      var end=preview?f.line.length:GD.lavaDistance(e,age);
      if(end>.001)near=lineDistance(f.line,x,y,end)-width;
    }else if(e.kind==='landslide'){
      if(preview)return lineDistance(f.line,x,y)-width*1.62;
      for(i=0;i<f.rocks.length;i++){
        var r=GD.rockAt(e,f.rocks[i],age);
        if(r)near=Math.min(near,gap(x,y,r.x,r.y)-r.r);
      }
    }else{
      for(i=0;i<f.cells.length;i++){
        var k=f.cells[i], heat=preview?1:GD.fireHeat(e,k,age);
        if(heat>.03)near=Math.min(near,gap(x,y,k.x,k.y)-k.r*(.62+.38*heat));
      }
    }
    return near;
  }
  function possible(e,l) {
    return l.mode==='land'||(e.kind==='flood'&&G.Geo.landmassSdf(l.lon,l.lat)>0);
  }
  var tips={quake:'Space로 멈추면 피해가 반으로 줄고, 균열을 돌아가면 안전합니다.',landslide:'낙석이 내려오는 길 옆으로 벗어나십시오.',
    flood:'강에서 멀어지면 피할 수 있습니다.',fire:'불길이 번지는 방향에서 벗어나십시오.',volcano:'용암 줄기 밖으로 우회하십시오.'};
  function fireOut(e) {
    var f=e.field;
    return e.kind==='fire'&&f.cells.every(function(cell){return GD.fireHeat(e,cell,f.age)<=.03&&f.age>=f.warning+cell.delay;});
  }
  GD.label = function (e) {
    var f=e.field;
    if(f.age<f.warning)return e.name+' 접근 주의';
    if(fireOut(e))return '산불이 잦아드는 중';
    if(e.kind==='flood')return (f.river==='개울'?'강':f.river)+' 범람';
    if(e.kind==='quake')return '지진 균열';
    if(e.kind==='volcano')return e.name+' · 용암';
    return e.name;
  };
  function nearby(T,l) {
    var output=null,best=Infinity;
    for(var i=0;i<T.act.length;i++){
      var e=T.act[i];
      if(!GD.open(e)||!possible(e,l)||gap(l.lon,l.lat,e.lon,e.lat)>e.field.extent+C().warn+.15)continue;
      var d=margin(e,l.lon,l.lat,e.field.age,true);
      if(d<best){best=d;output=e;}
    }
    return best<C().warn&&output?{event:output,distance:best}:null;
  }
  GD.tag = function (T,l) {
    var n=nearby(T,l);if(!n)return '';
    var e=n.event, inside=margin(e,l.lon,l.lat,e.field.age,false)<=0;
    if(fireOut(e))return '<span style="color:#c5b4a4">산불이 잦아드는 중 · 연기</span>';
    return '<span style="color:#ffc28f" title="'+U.esc(tips[e.kind])+'">'+U.esc(GD.label(e)+(inside?' · 위험 구역':' · '+(e.kind==='quake'?'Space 정지':'우회')))+'</span>';
  };
  GD.slow = function (T,l) {
    var v=1;
    for(var i=0;i<T.act.length;i++){
      var e=T.act[i];
      if(GD.open(e)&&e.kind!=='quake'&&possible(e,l)&&gap(l.lon,l.lat,e.lon,e.lat)<=e.field.extent+.15&&margin(e,l.lon,l.lat,e.field.age,false)<=0) v=Math.min(v,G.DISASTER_KINDS[e.kind].slow);
    }
    return v;
  };
  function rainChain(T,l,days) {
    if(G.BALANCE.disaster.random===0)return;
    var where=l.mode==='land'?'land':null, rn=G.Rain;
    if(!rn||rn.level(where)<2||!rn.raining(where)){T.floodRain=null;return;}
    var record=T.floodRain||(T.floodRain={wet:0,fired:false});
    record.wet+=days;
    if(record.fired||record.wet<C().flood.rainDays||!G.Hydro.ready)return;
    var q=G.Hydro.at(l.lon,l.lat);
    if(!q||q.strait||G.Hydro.season(q,l.lon,l.lat).frozen)return;
    if(T.act.some(function(e){return e.kind==='flood'&&GD.open(e)&&gap(q.point[0],q.point[1],e.lon,e.lat)<1.5;})){record.fired=true;return;}
    var event=G.Disaster.start({kind:'flood',lon:q.point[0],lat:q.point[1],sev:2,r:C().flood.reach,localField:true},true);
    if(event&&event.field)record.fired=true;
  }
  GD.spawnLand = function (T,l,mult) {
    var terr=G.Geo.terrain(l.lon,l.lat), kind=terr==='mountain'&&U.chance(C().landslide.rate*mult)?'landslide':
      /^(forest|jungle|mountain)$/.test(terr)&&!(G.Rain&&G.Rain.active('land'))&&U.chance(C().fire.rate*mult)?'fire':null;
    if(!kind||T.act.some(function(e){return e.kind===kind&&GD.open(e)&&gap(l.lon,l.lat,e.lon,e.lat)<1.7;}))return;
    for(var i=0;i<8;i++){
      var p=point(l.lon,l.lat,(l.heading||0)+U.rf(-2.4,2.4),U.rf(.29,.75));
      if(kind==='fire'?!fireGround(p[0],p[1]):G.Geo.terrain(p[0],p[1])!=='mountain')continue;
      var e=G.Disaster.start({kind:kind,lon:p[0],lat:p[1],sev:U.ri(1,2),localField:true},true);
      if(e)break;
    }
  };
  GD.step = function (T,s,days,lon0,lat0,moving) {
    var l=s.loc, hit=false;
    rainChain(T,l,days);
    var vx=dx(l.lon,lon0),vy=l.lat-lat0, samples=Math.max(1,Math.ceil(Math.max(Math.hypot(vx,vy),days*.59)/C().sample));
    for(var i=0;i<T.act.length;i++){
      var e=T.act[i];if(!GD.handles(e.kind))continue;
      var f=GD.ensure(e);if(!f||f.age>=f.life)continue;
      var time=f.age;f.age+=days;f.wait-=days;
      if(!possible(e,l)||gap(l.lon,l.lat,e.lon,e.lat)>f.extent+C().warn+.15)continue;
      if(!f.warned&&margin(e,l.lon,l.lat,f.age,true)<=C().warn){
        f.warned=true;
        G.UI.toast(GD.label(e)+'. '+tips[e.kind],G.DISASTER_KINDS[e.kind].icon,4700);
      }
      if(e.kind==='quake'&&l.mode==='land'&&!f.shook&&f.age<f.warning+1.6&&gap(l.lon,l.lat,e.lon,e.lat)<f.extent+.22&&G.Quake&&!G.Quake.active('quake')){
        f.shook=true;G.Quake.start('quake',{sev:e.sev,close:.84,seed:f.seed,groundField:true});
      }
      if(f.wait>0||(e.kind==='quake'&&f.hit))continue;
      for(var k=0;k<=samples;k++){
        var t=k/samples;
        if(margin(e,wrap(lon0+vx*t),lat0+vy*t,time+days*t,false)>0)continue;
        var c=C()[e.kind], scale=.74+e.sev*.16;
        if(e.kind==='quake'&&!moving)scale*=c.still;
        var fatigue=s.fleet.fatigue, discipline=s.fleet.discipline;
        s.fleet.fatigue=U.clamp(fatigue+c.fatigue*scale,0,100);
        s.fleet.discipline=U.clamp(discipline-c.discipline*scale,0,100);
        f.hit=true;f.wait=C().contact;
        var text=e.name+' 피해 · 피로 +'+Math.round(s.fleet.fatigue-fatigue)+' · 규율 −'+Math.round(discipline-s.fleet.discipline)+(e.kind==='quake'&&!moving?' · 정지로 피해 반감':'');
        G.UI.toast(text,G.DISASTER_KINDS[e.kind].icon,3700);G.State.log(text);
        hit=true;break;
      }
    }
    return hit;
  };
})(window.G = window.G || {});
