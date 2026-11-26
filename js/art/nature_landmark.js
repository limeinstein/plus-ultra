/* 자연 모형의 그림 폭과 발치를 실제 해안·호수·수로 판정에 맞춘다. */
(function (G) {
  'use strict';
  var N = G.NatureLandmark = {}, memo = new WeakMap();
  function fx() { return G.FX.natureLandmark; }
  function land(lon,lat,margin) {
    return G.Geo.sdf(lon,lat) >= margin && (!G.Terrain || !G.Terrain.isLake(lon,lat));
  }
  function offset(p,radius,index,count) {
    var a = index*2*Math.PI/count;
    return [G.Geo.wrapLon(p[0]+radius*Math.cos(a)),p[1]+radius*Math.sin(a)];
  }
  function nearest(p) {
    if(land(p[0],p[1],fx().bankMargin))return p;
    var bands=fx().search;
    for(var b=0;b<bands.length;b++){
      var radius=bands[b], count=radius>.65?32:16, best=null;
      for(var i=0;i<count;i++){
        var q=offset(p,radius,i,count);
        if(!land(q[0],q[1],fx().bankMargin))continue;
        var score=G.Geo.sdf(q[0],q[1]);
        if(!best||score>best.score)best={point:q,score:score};
      }
      if(best)return best.point;
    }
    return null;
  }

  function survey(point,r,width,step,margin) {
    var terrain=G.Terrain, lon=point[0], lat=point[1], rise=terrain?terrain.lift(lon,lat):0;
    var h=r[4]/r[3], ax=r[5], ay=r[6];
    var left=-ax*width, top=-ay*width, height=(h+.10)*width;
    var nx=Math.max(2,Math.ceil(width/step)), ny=Math.max(2,Math.ceil(height/step));
    for(var j=0;j<=ny;j++){
      var py=lat-top-height*j/ny;
      for(var i=0;i<=nx;i++){
        var x=G.Geo.wrapLon(lon+left+width*i/nx);
        if(!land(x,py,margin))return false;
        if(terrain){
          var projected=terrain.unproject(x,py+rise);
          if(Math.abs(projected[1]-py)>.0001&&!land(projected[0],projected[1],margin))return false;
        }
      }
    }
    return true;
  }

  function capacity(p,r) {
    var step=fx().sampleStep, widths=fx().widths;
    for(var i=0;i<widths.length;i++)if(survey(p,r,widths[i],step,fx().bankMargin))return widths[i];
    return 0;
  }

  function site(d,r,shape) {
    var saved=memo.get(d);
    if(!saved||saved.lon!==d.lon||saved.lat!==d.lat){
      var p=[d.lon,d.lat], bank=nearest(p);
      saved={lon:d.lon,lat:d.lat,point:bank||p,width:null,dry:!!bank};
      memo.set(d,saved);
    }
    if(!shape||saved.width!=null||!saved.dry)return saved;
    var origin=saved.point, width=capacity(origin,r);
    // 발치가 좁은 위치에서는 작은 이동만으로 모형이 제대로 앉는지 먼저 확인한다.
    if(origin&&width<fx().fitWidth){
      var rings=fx().local;
      for(var j=0;j<rings.length&&width<fx().fitWidth;j++){
        var radius=rings[j];
        for(var i=0;i<12;i++){
          var q=offset(origin,radius,i,12);
          if(!land(q[0],q[1],fx().bankMargin))continue;
          if(!survey(q,r,fx().fitWidth,fx().sampleStep,fx().bankMargin))continue;
          origin=q;width=capacity(origin,r);break;
        }
      }
    }
    saved.point=origin;saved.width=width;
    return saved;
  }

  function baked(d,r){
    var a=G.NATURE_FOOTINGS&&G.NATURE_FOOTINGS[d.id];
    if(!a||a[0]!==d.lon||a[1]!==d.lat||a[5]!==r[3]||a[6]!==r[4]||a[7]!==r[5]||a[8]!==r[6])return null;
    return {point:[a[2],a[3]],width:a[4],dry:true};
  }
  N.bakedPoint=function(d,r){var fit=baked(d,r);return fit&&fit.point;};

  N.place=function(d,r,width,zoom,chartZoom){
    var p=[d.lon,d.lat], z=zoom||chartZoom;
    if(d.how==='sea'||d.how==='special')return {point:p,width:width};
    if(!G.Geo||!G.Geo.ready)return {point:p,width:width};
    var markerOnly=chartZoom&&chartZoom*fx().widths[0]<fx().markerMin;
    var ground=baked(d,r)||site(d,r,!markerOnly), cap=markerOnly?0:z?ground.width*z:width;
    width=Math.min(width,cap);
    // 아주 작은 섬과 세계 해도에서는 접지 가능한 크기의 위치 점을 쓴다.
    return {point:ground.point,width:width>=fx().markerMin?width:0,marker:width<fx().markerMin&&ground.dry,hidden:!ground.dry};
  };

  N.scan=function(d,r){return site(d,r,true);};
  N.verify=function(p,r,width,zoom){return width===0?land(p[0],p[1],.001):survey(p,r,width/zoom,fx().sampleStep*.65,.001);};
})(window.G=window.G||{});
