/* 가까운 숲은 Blender에서 구운 수종, 먼 숲은 지형 셰이더. 위치·수종은 같은 지리 자료에서 고른다. */
(function(G){
  'use strict';
  var A=G.TerrainArt={},data=G.TERRAIN_ART,images=[],chunks=new Map(),last=null,stats={trees:0,candidates:0,buildMs:0,drawMs:0};
  function fx(){return G.FX.terrainWorld;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hash(x,y){return G.Geo.hash2(x,y);}
  A.ready=Promise.all(data?data.sheets.map(function(src,i){return new Promise(function(resolve){var im=new Image();images[i]=im;im.onload=resolve;im.onerror=resolve;im.src=src;});}):[]);
  A.has=function(id){return !!(data&&data.sprites['wonder-'+id]);};
  A.sprite=function(ctx,id,x,y,w,h){
    var r=data&&data.sprites[id],im=r&&images[r.sheet];if(!im||!im.complete||!im.naturalWidth)return false;
    ctx.drawImage(im,r.x,r.y,r.w,r.h,x,y,w,h);return true;
  };
  A.metrics=function(id,width){var r=data&&data.sprites[id];return r?{width:width,height:width*r.h/r.w}:null;};
  function chunk(cx,cy){
    cx=((cx+90)%180+180)%180-90;
    var f=fx(),key=[cx,cy,f.treeCell,f.forestDensity].join(':'),got=chunks.get(key);if(got)return got;
    var out=[],cell=f.treeCell,N=Math.round(2/cell);
    for(var j=0;j<N;j++)for(var i=0;i<N;i++){
      var ix=cx*N+i,iy=cy*N+j,k=hash(ix,iy),lon=G.Geo.wrapLon((ix+.15+hash(ix+31,iy)*.70)*cell),lat=(iy+.15+hash(ix,iy+71)*.70)*cell;
      if(lat<-82||lat>82)continue;
      var b=G.Terrain.biome(lon,lat),bank=false;
      if(b===13){var q=G.Hydro.at(lon,lat);bank=q&&q.signed<.12;}
      var forest=b>=1&&b<=6||b===14,grove=G.Geo.vnoise(lon*2+11,lat*2+4),density=forest?clamp((grove-.30)*3,0,.92):b===12?.18:b===7||b===9?.10:b===13&&bank?.48:0;
      // 같은 군락 안의 공터. 채도가 다른 색을 섞지 않고 수형과 밀도로 표현한다.
      density*=.65+.35*G.Geo.vnoise(lon*7+2,lat*7+8);
      if(k>density*f.forestDensity)continue;
      var t=G.Terrain.sample(lon,lat),lim=Math.abs(lat)>55?1000:Math.abs(lat)>35?2100:3200;
      if(t.elevation>lim||t.lake||G.Geo.sdf(lon,lat)<.4)continue;
      var species=G.Terrain.species(lon,lat),form=b===13&&bank?'palm':species.form;
      out.push({lon:lon,lat:lat,id:'tree-'+form+'-'+(hash(ix+77,iy)>0.5?1:0),size:.80+hash(ix+29,iy)*.4,priority:hash(ix,iy+19)});
    }
    chunks.set(key,out);if(chunks.size>160)chunks.delete(chunks.keys().next().value);return out;
  }
  A.draw=function(ctx,cam,toScreen,actor){
    var f=fx();if(!data||!G.Terrain.ready||!f.enabled||cam.zoom<=f.farZoom){stats.trees=0;stats.candidates=0;stats.drawMs=0;return;}
    var now=performance.now(),fade=clamp((cam.zoom-f.farZoom)/(f.nearZoom-f.farZoom),0,1),sx=1700/cam.zoom,sy=1040/cam.zoom;
    var left=Math.floor((cam.lon-sx/2)/2),right=Math.floor((cam.lon+sx/2)/2),bottom=Math.floor((cam.lat-sy/2)/2),top=Math.floor((cam.lat+sy/2)/2);
    var key=[left,right,bottom,top,f.treeCell,f.forestDensity].join(':');
    if(!last||last.key!==key){
      var list=[];for(var y=bottom;y<=top;y++)for(var x=left;x<=right;x++)list=list.concat(chunk(x,y));
      list.sort(function(a,b){return a.priority-b.priority;});last={key:key,list:list};stats.buildMs=performance.now()-now;
    }
    stats.candidates=last.list.length;var draw=[];
    for(var i=0;i<last.list.length;i++){var t=last.list[i],p=toScreen(t.lon,t.lat);if(p[0]<-60||p[0]>1660||p[1]<-10||p[1]>980)continue;draw.push({t:t,p:p});if(draw.length>=f.maxTrees)break;}
    draw.sort(function(a,b){return a.p[1]-b.p[1];});var ap=actor&&toScreen(actor.lon,actor.lat);ctx.save();ctx.imageSmoothingEnabled=true;
    for(var i=0;i<draw.length;i++){
      var t=draw[i].t,p=draw[i].p,w=clamp(cam.zoom*f.treeWorld*t.size,9,76),m=A.metrics(t.id,w);if(!m)continue;
      var alpha=fade;if(ap){var d=Math.hypot(p[0]-ap[0],p[1]-ap[1]);alpha*=.22+.78*clamp((d-25)/60,0,1);}
      ctx.globalAlpha=alpha*.20;ctx.fillStyle='#101c0b';ctx.beginPath();ctx.ellipse(p[0]+w*.12,p[1],w*.44,w*.16,-.4,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=alpha;A.sprite(ctx,t.id,p[0]-w/2,p[1]-m.height*.93,w,m.height);
    }
    ctx.restore();stats.trees=draw.length;stats.drawMs=performance.now()-now;
    // 건널 수 있는 도시의 다리·나루도 통행 판정에 등록된 위치를 쓴다.
    ctx.save();ctx.lineCap='round';G.Hydro.routes().forEach(function(r){r.crossings.forEach(function(c){
      var p=toScreen(c.lon,c.lat);if(p[0]<-80||p[0]>1680||p[1]<-80||p[1]>980)return;
      var q=G.Hydro.at(c.lon,c.lat);if(!q)return;var v=q.flow,len=q.half*cam.zoom*1.2,dx=-v[1]*len,dy=-v[0]*len;
      ctx.strokeStyle='#30291e';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(p[0]-dx,p[1]-dy);ctx.lineTo(p[0]+dx,p[1]+dy);ctx.stroke();
      ctx.strokeStyle='#ac9465';ctx.lineWidth=5;ctx.stroke();
    });});ctx.restore();
  };
  A.stats=function(){return Object.assign({},stats,{chunks:chunks.size});};
  A.invalidate=function(){chunks.clear();last=null;};
})(window.G=window.G||{});
