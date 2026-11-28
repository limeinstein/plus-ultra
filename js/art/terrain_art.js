/* 지도 배율이 달라져도 같은 좌표의 수목과 지형 부품을 같은 원화로 그린다. */
(function(G){
  'use strict';
  var A=G.TerrainArt={},data=G.TERRAIN_ART,images=[],chunks=new Map(),crossingArt=new Map(),last=null,plate=null,scratch=null;
  var chunkStyle=null,detailTiles=new Map();
  var unitCanvas=null,plantsCanvas=null,stats={trees:0,candidates:0,buildMs:0,drawMs:0};
  var foliage=/^(?:tree-|detail-(?:grass|shrub|snowshrub|fern|broadleaf|reeds|reed-tall|miscanthus|wheat|barley|cactus)-)/;
  var soilPatterns=new WeakMap();
  function fx(){return G.FX.terrainWorld;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hash(x,y){return G.Geo.hash2(x,y);}
  function coverCells(x,y,w,h,each){
    var side=G.FX.party.cover.bucket;
    for(var j=Math.floor(y/side);j<=Math.floor((y+h)/side);j++){
      for(var i=Math.floor(x/side);i<=Math.floor((x+w)/side);i++)each(i+':'+j);
    }
  }
  function prepareLayer(canvas,w,h,scale,x,y){
    if(canvas.width<w)canvas.width=w;
    if(canvas.height<h)canvas.height=h;
    var c=canvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
    c.clearRect(0,0,w,h);c.setTransform(scale,0,0,scale,-x*scale,-y*scale);return c;
  }
  // 앞에 서 있는 나무와 풀만 대원의 윤곽 안에 겹친다. 옆의 숲과 뒤쪽 나무의 명암은 이어진다.
  function coverMember(ctx,it,rect,draw,tiles,dx,dy,ratio,fade){
    var padding=it.leader?2:0;
    var l=Math.floor(rect[0])-padding,t=Math.floor(rect[1])-padding;
    var w=Math.ceil(rect[0]+rect[2])-l+padding,h=Math.ceil(rect[1]+rect[3])-t+padding;
    var look=G.FX.party.cover,plants=[];
    tiles.forEach(function(view){
      var s=view.scale*ratio,ox=view.x*ratio+dx,oy=view.y*ratio+dy;
      var left=(l-ox)/s,top=(t-oy)/s,right=left+w/s,bottom=top+h/s;
      var tile=view.tile;
      if(right<tile.left||left>tile.right||bottom<tile.top||top>tile.bottom)return;
      var seen=new Set();
      coverCells(left,top,w/s,h/s,function(key){
        var list=tile.grid.get(key);
        if(list)list.forEach(function(p){
          if(seen.has(p)||oy+p.foot*s<=it.y+look.footGap||p.x>=right||p.x+p.w<=left||p.y>=bottom||p.y+p.h<=top)return;
          seen.add(p);plants.push({id:p.id,x:ox+p.x*s,y:oy+p.y*s,w:p.w*s,h:p.h*s,foot:oy+p.foot*s,opacity:p.opacity});
        });
      });
    });
    if(!plants.length){draw(ctx);return false;}
    if(!unitCanvas){unitCanvas=document.createElement('canvas');plantsCanvas=document.createElement('canvas');}
    var scale=G.Game&&G.Game.overlayScale||1,sw=Math.ceil(w*scale),sh=Math.ceil(h*scale);
    var unit=prepareLayer(unitCanvas,sw,sh,scale,l,t),leaves=prepareLayer(plantsCanvas,sw,sh,scale,l,t);
    draw(unit);
    plants.sort(function(a,b){return a.foot-b.foot;}).forEach(function(prop){
      leaves.globalAlpha=prop.opacity;A.sprite(leaves,prop.id,prop.x,prop.y,prop.w,prop.h);
    });
    if(it.camp||it.onFoot===false){
      var mask=leaves.createLinearGradient(0,t,0,t+h);
      mask.addColorStop(0,'rgba(0,0,0,'+look.upperAlpha+')');mask.addColorStop(.42,'rgba(0,0,0,'+look.upperAlpha+')');mask.addColorStop(.85,'#000');
      leaves.globalAlpha=1;leaves.globalCompositeOperation='destination-in';leaves.fillStyle=mask;leaves.fillRect(l,t,w,h);
    }
    var shade=it.camp?look.camp:it.leader?look.leader:it.onFoot===false?look.mount:look.follower;
    unit.setTransform(1,0,0,1,0,0);unit.globalCompositeOperation='source-atop';unit.globalAlpha=fade*shade;
    unit.drawImage(plantsCanvas,0,0,sw,sh,0,0,sw,sh);
    if(it.leader){
      // 짙은 잎에서도 대장의 자세를 읽을 수 있도록 몸 바깥에만 얇은 가장자리를 남긴다.
      leaves.setTransform(1,0,0,1,0,0);leaves.globalAlpha=1;leaves.globalCompositeOperation='source-over';leaves.clearRect(0,0,sw,sh);
      var edge=scale*look.leaderEdge;
      leaves.drawImage(unitCanvas,0,0,sw,sh,-edge,0,sw,sh);
      leaves.drawImage(unitCanvas,0,0,sw,sh,edge,0,sw,sh);
      leaves.drawImage(unitCanvas,0,0,sw,sh,0,-edge,sw,sh);
      leaves.drawImage(unitCanvas,0,0,sw,sh,0,edge,sw,sh);
      leaves.globalCompositeOperation='source-in';leaves.fillStyle=look.leaderEdgeColor;leaves.fillRect(0,0,sw,sh);
      unit.globalCompositeOperation='destination-over';unit.globalAlpha=fade;
      unit.drawImage(plantsCanvas,0,0,sw,sh,0,0,sw,sh);
    }
    ctx.drawImage(unitCanvas,0,0,sw,sh,l,t,sw/scale,sh/scale);
    return true;
  }
  function isOpenLand(biome){return biome>=7&&biome<=10||biome===12;}
  function rockDetail(t,lon,lat,shore,slope,roll,look){
    if(t.biome===13)return null;
    if(roll<look.bankChance&&shore>=look.banks[0]&&shore<look.banks[1]){
      var river=G.Hydro.at(lon,lat);
      if(river&&river.signed>=look.banks[0]&&river.signed<look.banks[1])return 'cobbles';
    }
    var open=isOpenLand(t.biome);
    var chance=t.biome===11?look.tundraChance:slope>G.FX.terrainBiomes.stoneMinSlope?look.looseChance:
      open&&slope>look.outcropSlope?look.outcropChance:open?look.plainChance:0;
    if(roll>=chance||t.elevation>=G.Terrain.heightLimits(lat).snow)return null;
    var patch=G.Geo.vnoise(lon*2.7-14,lat*2.7+21);
    if(patch<.48)return null;
    if(t.biome===11)return 'erratic';
    if(slope>G.FX.terrainBiomes.stoneMinSlope)return 'talus';
    return slope>look.outcropSlope||patch>.65?'slab':'erratic';
  }
  function seasonKey(){return G.Game&&G.Game.state&&G.Game.state.date?G.Game.state.date.m:5;}
  function yearKey(){return G.Game&&G.Game.state&&G.Game.state.date?G.Game.state.date.y:1480;}
  function cropCenters(cx,cy,look){
    var month=seasonKey(),year=yearKey();
    return (G.CITY_DATA||[]).filter(function(city){
      if(!city.goods||city.goods.indexOf('wheat')<0||Math.abs(city.lat-(cy*2+1))>1+look.cropRadius[1])return false;
      var cosLat=Math.max(.3,Math.cos(city.lat*Math.PI/180));
      if(Math.abs(G.Geo.wrapLon(city.lon-(cx*2+1)))>1+look.cropRadius[1]/cosLat)return false;
      var cropMonth=city.lat<0?(month+5)%12+1:month;
      return look.cropMonths.indexOf(cropMonth)>=0&&(G.R&&G.R.cityExists?G.R.cityExists(city,{y:year,m:month}):!city.founded||year>=city.founded);
    });
  }
  function cropAt(lon,lat,places,look){
    for(var i=0;i<places.length;i++){
      var city=places[i],d=G.Geo.dist(lon,lat,city.lon,city.lat);
      if(d<look.cropRadius[0]||d>look.cropRadius[1])continue;
      var mark=G.Geo.vnoise(G.Geo.wrapLon(lon-city.lon)*look.cropFrequency+city.id, (lat-city.lat)*look.cropFrequency+11);
      if(mark>look.cropPatch)return mark>.68?'barley':'wheat';
    }
    return null;
  }
  A.ready=Promise.all(data?data.sheets.map(function(src,i){return new Promise(function(resolve){var im=new Image();images[i]=im;im.onload=resolve;im.onerror=resolve;im.src=src;});}):[]);
  A.ready.then(function(){A.invalidate();});
  A.has=function(id){return !!(data&&data.sprites['wonder-'+id]);};
  A.sprite=function(ctx,id,x,y,w,h){
    var r=data&&data.sprites[id],im=r&&images[r.sheet];if(!im||!im.complete||!im.naturalWidth)return false;
    ctx.drawImage(im,r.x,r.y,r.w,r.h,x,y,w,h);return true;
  };
  A.metrics=function(id,width){var r=data&&data.sprites[id];return r?{width:width,height:width*r.h/r.w}:null;};
  A.formationId=function(formation){return 'detail-'+formation.kind+'-'+(formation.variant||0);};
  A.trailSoilAt=function(lon,lat){
    var look=G.FX.terrainBiomes.plains.trail;
    if(G.Geo.sdf(lon,lat)<=look.waterMargin*G.Geo.TEX_PER_DEG)return false;
    var terrain=G.Geo.terrain(lon,lat);
    return terrain==='steppe'||terrain==='grass';
  };
  A.drawSoilTrail=function(ctx,trail,cam,toScreen,time){
    var look=G.FX.terrainBiomes.plains.trail,source=G.TerrainMaterials&&G.TerrainMaterials.soilCanvas();
    if(cam.zoom<look.nearZoom||!source||trail.length<2)return false;
    var pattern=soilPatterns.get(ctx);
    if(!pattern){pattern=ctx.createPattern(source,'repeat');if(!pattern)return false;soilPatterns.set(ctx,pattern);}
    var origin=toScreen(cam.lon,cam.lat),scale=look.strokeGrain*cam.zoom/source.width;
    pattern.setTransform(new DOMMatrix().translate(origin[0]-cam.lon*cam.zoom,origin[1]+cam.lat*cam.zoom).scale(scale));
    var runs=[],run=[],previous=null;
    trail.forEach(function(point){
      var fade=point[3]&&G.Party.trackFade(time-point[2]),screen=fade&&toScreen(point[0],point[1]);
      if(!screen||previous&&Math.hypot(screen[0]-previous[0],screen[1]-previous[1])>80){
        if(run.length>1)runs.push(run);
        run=[];
      }
      if(screen)run.push([screen[0],screen[1],fade]);
      previous=screen;
    });
    if(run.length>1)runs.push(run);
    if(!runs.length)return true;
    // 지나온 좌표를 따라 풀 사이로 눌린 흙이 이어진다. 가느다란 가장자리는 바깥 풀빛과 겹친다.
    ctx.save();
    var width=cam.zoom*look.width;
    runs.forEach(function(line){
      function outline(scale){
        var left=[],right=[];
        for(var i=0;i<line.length;i++){
          var a=line[Math.max(0,i-1)],b=line[Math.min(line.length-1,i+1)],p=line[i];
          var dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
          var taper=Math.min(1,(i+1)*.65,(line.length-i)*.65);
          var radius=width*scale*(.44+.07*Math.sin(i*1.72))*p[2]*taper/length;
          left.push([p[0]-dy*radius,p[1]+dx*radius]);right.push([p[0]+dy*radius,p[1]-dx*radius]);
        }
        ctx.beginPath();ctx.moveTo(left[0][0],left[0][1]);
        left.slice(1).concat(right.reverse()).forEach(function(p){ctx.lineTo(p[0],p[1]);});ctx.closePath();ctx.fill();
      }
      ctx.fillStyle=pattern;ctx.globalAlpha=look.edgeOpacity;outline(1.40);
      ctx.globalAlpha=look.soilOpacity;outline(1);
    });
    ctx.restore();
    return true;
  };
  function crossingBanks(r,c){
    var id=r.id+':'+c.lon+':'+c.lat;if(crossingArt.has(id))return crossingArt.get(id);
    var q=G.Hydro.at(c.lon,c.lat),f=fx(),banks=[];if(!q)return null;
    var k=Math.max(.2,Math.cos(c.lat*Math.PI/180)),normal=[-q.flow[1]/k,q.flow[0]];
    for(var side=-1;side<=1;side+=2){
      var found=null;for(var d=0;d<=f.ferrySearch;d+=f.ferryStep){var lon=q.point[0]+normal[0]*d*side,lat=q.point[1]+normal[1]*d*side;if(G.Geo.sdf(lon,lat)>0){found=[lon,lat];break;}}
      if(found)banks.push(found);
    }
    var art=banks.length===2?{banks:banks,span:G.Geo.dist(banks[0][0],banks[0][1],banks[1][0],banks[1][1])}:null;
    crossingArt.set(id,art);return art;
  }
  function mixedForm(base,t,lon,lat,shore,coastPalm,desertBank,oasis,roll,style){
    var biome=t.biome;
    if(coastPalm)return roll<style.fanPalm?'fanpalm':'palm';
    if(biome===13&&desertBank){
      var oldWorldDry=lon>=-18&&lon<=65&&lat>=17&&lat<=42;
      if(oldWorldDry&&oasis<G.BALANCE.terrainLevels.oasisGreen+style.oasisFringe){
        return oasis>G.BALANCE.terrainLevels.oasisGreen?'tamarisk':'palm';
      }
      return oldWorldDry&&roll<style.desertShrubTree?'tamarisk':'palm';
    }
    if(biome===1||biome===2){
      if(roll<style.junglePalm)return roll<style.junglePalm*style.fanPalm?'fanpalm':'palm';
      if(roll<style.jungleHigh)return lon<-32||lon<32&&lon>-20?'kapok':'emergent';
      return base;
    }
    if(biome>=4&&biome<=6){
      if(biome===6&&G.Terrain.snowCover(lon,lat,biome)>.55)return 'snowpine';
      if(roll<style.wetWillow&&biome!==6&&shore<style.willowBank[1]&&t.elevation<style.willowElevation){
        var river=G.Hydro.at(lon,lat),distance=river&&river.signed;
        if(river&&distance>style.willowBank[0]&&distance<style.willowBank[1])return 'willow';
      }
      if(base==='pine'&&roll<style.firShare)return 'fir';
      if(roll>1-style.birchShare&&(biome===6||Math.abs(lat)>40||t.elevation>style.birchSlopeStart))return 'birch';
      if(base==='oak'&&roll<style.beechShare)return 'beech';
    }
    return base;
  }
  function chunk(cx,cy){
    var f=fx();
    var out=[],N=Math.round(2/f.treeCell),cell=2/N,coastFx=G.FX.terrainCoast;
    var dfx=G.FX.terrainBiomes,style=dfx.vegetation,plains=dfx.plains,rocks=dfx.rocks;
    var tall=plains.tall,grainPlaces=cropCenters(cx,cy,tall);
    var stonehenge=G.DISC&&G.DISC.stonehenge, clearing=G.FX.mapRuins.stonehengeClearing;
    if(stonehenge&&(Math.abs(stonehenge.lon-(cx*2+1))>1+clearing[0]||Math.abs(stonehenge.lat-(cy*2+1))>1+clearing[1]))stonehenge=null;
    for(var j=0;j<N;j++)for(var i=0;i<N;i++){
      var ix=cx*N+i,iy=cy*N+j,k=hash(ix,iy),lon=G.Geo.wrapLon((ix+.15+hash(ix+31,iy)*.70)*cell),lat=(iy+.15+hash(ix,iy+71)*.70)*cell;
      if(lat<-82||lat>82)continue;
      var b=G.Terrain.biome(lon,lat),bank=false,oasis=Infinity,nearSpring=false;
      if(b===13){
        var q=G.Hydro.at(lon,lat);
        oasis=G.Terrain.oasisDistance(lon,lat);
        nearSpring=oasis<G.BALANCE.terrainLevels.oasisGreen+style.oasisFringe;
        bank=nearSpring||q&&q.signed<.12;
      }
      var forest=b>=1&&b<=6||b===14,grove=G.Geo.vnoise(lon*2+11,lat*2+4);
      var density=forest?clamp((grove-.30)*3,0,.92):nearSpring?style.oasisTreeDensity:b===13&&bank?.48:0;
      if(isOpenLand(b)&&plains.treeChance[b]){
        var edge=plains.treeClump;
        density=plains.treeChance[b]*clamp((grove-edge[0])/(edge[1]-edge[0]),0,1);
      }
      // 같은 군락 안의 공터. 채도가 다른 색을 섞지 않고 수형과 밀도로 표현한다.
      density*=.65+.35*G.Geo.vnoise(lon*7+2,lat*7+8);
      if(stonehenge){
        var distance=Math.hypot((lon-stonehenge.lon)/clearing[0],(lat-stonehenge.lat)/clearing[1]);
        density*=clamp((distance-.78)/.22,0,1);
      }
      if(b===1)density*=f.tropicalDensity;
      var coast=G.Terrain.coastAt(lon,lat),shore=G.Geo.sdf(lon,lat)/(4096/360),coastPalm=coast.strength>.12&&Math.abs(lat)<30&&shore>coastFx.palmBand[0]&&shore<coastFx.palmBand[1];
      if(coastPalm)density=Math.max(density,coastFx.palmDensity);
      if(k>density*f.forestDensity)continue;
      var t=G.Terrain.sample(lon,lat),lim=G.Terrain.heightLimits(lat).tree;
      var mangrove=b===14&&t.elevation<30&&shore>-.10,nav=mangrove&&G.Hydro.at(lon,lat);
      if(t.elevation>lim||t.lake||shore<(coast.strength>.1?coastFx.coastTreeMargin:.035)&&!mangrove||nav&&nav.route&&nav.signed<.025)continue;
      if(t.elevation>600&&G.Terrain.slope(lon,lat,t.elevation)>.58)continue;
      if(grainPlaces.length&&shore>.075&&t.elevation<tall.cropHighest&&(isOpenLand(b)||b===4||b===5)&&cropAt(lon,lat,grainPlaces,tall)&&G.Terrain.slope(lon,lat,t.elevation)<tall.cropSlope)continue;
      var species=G.Terrain.species(lon,lat),roll=hash(ix+93,iy);
      if(!bank&&!coastPalm&&hash(ix,iy+97)<style.groveMix){
        var patch=G.Geo.vnoise(lon*style.groveFrequency+43,lat*style.groveFrequency-26);
        roll=clamp(.5+(patch-.5)*1.7,0,1);
      }
      var form=mixedForm(species.form,t,lon,lat,shore,coastPalm,bank,oasis,roll,style);
      var age=hash(ix+29,iy),range=age<style.youngShare?style.young:age>style.oldStart?style.old:style.mature;
      var size=(range[0]+hash(ix+121,iy)*(range[1]-range[0]))*(style.treeScale[form]||1)*(b===1?f.tropicalScale:1);
      out.push({lon:lon,lat:lat,id:'tree-'+form+'-'+(hash(ix+77,iy)>0.5?1:0),size:size,priority:hash(ix,iy+19)});
    }
    var DN=Math.ceil(2/dfx.decorCell),dc=2/DN;
    for(var j=0;j<DN;j++)for(var i=0;i<DN;i++){
      var ix=cx*DN+i,iy=cy*DN+j,lon=G.Geo.wrapLon((ix+.12+hash(ix+4,iy)*.76)*dc),lat=(iy+.12+hash(ix,iy+8)*.76)*dc,k=hash(ix+51,iy+31);
      var t=G.Terrain.sample(lon,lat),s=G.Geo.sdf(lon,lat)/(4096/360);if(t.lake||s<.025||Math.abs(lat)>82)continue;
      var slope=t.elevation>450||isOpenLand(t.biome)||grainPlaces.length?G.Terrain.slope(lon,lat,t.elevation):0,kind=null,size=0,opacity=1;
      var grain=grainPlaces.length&&s>.075&&slope<tall.cropSlope&&t.elevation<tall.cropHighest&&
        (isOpenLand(t.biome)||t.biome===4||t.biome===5)&&cropAt(lon,lat,grainPlaces,tall);
      var b=tall.miscanthusBox,grove=G.Geo.vnoise(lon*2+11,lat*2+4);
      var easternMeadow=lon>=b[0]&&lon<=b[1]&&lat>=b[2]&&lat<=b[3]&&(isOpenLand(t.biome)||t.biome===4||t.biome===5);
      var rocky=rockDetail(t,lon,lat,s,slope,k,rocks);
      var river=s<plains.reedBand[1]&&G.Hydro.at(lon,lat);
      var wetBank=s>plains.reedBand[0]&&s<plains.reedBand[1]&&
        (river&&river.signed>plains.reedBand[0]&&river.signed<plains.reedBand[1]||G.Terrain.nearLake(lon,lat));
      var plantCover=clamp((grove-.25)/.42,0,1),plantOpacity=tall.opacity[0]+plantCover*(tall.opacity[1]-tall.opacity[0]);
      // 사막의 암반은 실제 경사 음영과 지정 경관에서만 드러낸다.
      if(t.biome!==13&&t.elevation>800&&slope>.30&&s>dfx.ridgeWorld*.55&&k<dfx.ridgeChance){
        var rock=G.Terrain.rockForm(lon,lat,t.elevation);
        if(rock!=='snowridge'){kind=rock;size=dfx.ridgeWorld*(.8+hash(ix,iy+43)*.4);}
      }
      else if(t.biome===13&&lon>-118&&lon<-103&&lat>22&&lat<35&&k<dfx.cactusChance){kind='cactus';size=dfx.shrubWorld*1.6;}
      else if(grain&&k<tall.cropChance*(.64+.36*plantCover)){
        kind=grain;size=tall.cropWidth*(.72+hash(ix+69,iy)*.27);opacity=plantOpacity;
      }
      else if(rocky){kind=rocky;size=rocks.width[kind]*(.73+.40*hash(ix+27,iy));}
      else if(wetBank&&t.biome!==11&&t.elevation<G.Terrain.heightLimits(lat).tree&&k<tall.reedChance*(.58+.42*plantCover)){
        kind='reed-tall';size=tall.reedWidth*(.72+hash(ix+31,iy)*.32);opacity=plantOpacity;
      }
      else if(easternMeadow&&grove>.29&&grove<.64&&t.elevation<G.Terrain.heightLimits(lat).tree&&k<tall.miscanthusChance*(.62+.38*plantCover)){
        kind='miscanthus';size=tall.miscanthusWidth*(.66+hash(ix+36,iy)*.35);opacity=plantOpacity;
      }
      else if(t.biome===11&&t.elevation<G.Terrain.heightLimits(lat).tree&&k<dfx.shrubChance){kind=G.Terrain.snowCover(lon,lat,t.biome)>.5?'snowshrub':'shrub';size=dfx.shrubWorld;}
      else if((t.biome===1||t.biome===2)&&t.elevation<G.Terrain.heightLimits(lat).tree&&k<dfx.shrubChance){kind=k<dfx.shrubChance*.45?'fern':'broadleaf';size=dfx.shrubWorld*1.4;}
      else if(t.biome>=4&&t.biome<=6&&slope<dfx.stoneMinSlope&&t.elevation<G.Terrain.heightLimits(lat).tree&&k<style.forestUnderstory){
        if(grove>.32&&grove<.59){kind=t.biome===6?'shrub':k<style.forestUnderstory*.45?'fern':'shrub';size=dfx.shrubWorld*(.7+.6*hash(ix,iy+17));}
      }
      else if(t.biome===14&&k<dfx.shrubChance){kind='reeds';size=dfx.shrubWorld;}
      else if(isOpenLand(t.biome)&&t.elevation<G.Terrain.heightLimits(lat).snow&&k<dfx.grassChance){
        var clump=G.Geo.vnoise(lon*4+31,lat*4+9),edges=plains.grassClump;
        var cover=clamp((clump-edges[0])/(edges[1]-edges[0]),0,1);
        if(k<dfx.grassChance*(plains.grassMin+(1-plains.grassMin)*cover)){
          kind='grass';size=dfx.grassWorld*(.48+cover*.46);opacity=plains.grassOpacity[0]+cover*(plains.grassOpacity[1]-plains.grassOpacity[0]);
        }
      }
      if(kind&&data.sprites['detail-'+kind+'-0']){
        var layouts=rocks.width[kind]?rocks.layoutScale:null;
        var variants=layouts?layouts.length:2;
        var variant=Math.floor(hash(ix+92,iy)*variants),id='detail-'+kind+'-'+variant;
        if(!data.sprites[id])id='detail-'+kind+'-0';
        else if(layouts)size*=layouts[variant];
        out.push({lon:lon,lat:lat,id:id,size:1,worldSize:size,opacity:opacity,priority:hash(ix+13,iy+19)});
      }
    }
    // 한 구역의 수목을 한 번 정해 두면 줌이나 이웃 구역의 밀도가 달라져도 같은 나무가 남는다.
    if(out.length>f.plantsPerChunk){out.sort(function(a,b){return a.priority-b.priority;});out.length=f.plantsPerChunk;}
    var lon=cx*2+1,lat=cy*2+1,origin=lat+G.Terrain.lift(lon,lat),z=f.forestTileZoom;
    var tile={lon:lon,lat:lat,plants:[],grid:new Map(),left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity};
    out.forEach(function(t){
      var w=z*(t.worldSize||f.treeWorld*t.size),m=A.metrics(t.id,w);if(!m)return;
      var x=G.Geo.wrapLon(t.lon-lon)*z,foot=(origin-t.lat-G.Terrain.lift(t.lon,t.lat))*z;
      var p={id:t.id,x:x-w/2,y:foot-m.height*.93,foot:foot,w:w,h:m.height,tree:!t.worldSize,opacity:t.opacity==null?1:t.opacity};
      tile.plants.push(p);
      tile.left=Math.min(tile.left,p.x);tile.top=Math.min(tile.top,p.y,p.foot-p.w*.24);
      tile.right=Math.max(tile.right,p.x+p.w*1.1);tile.bottom=Math.max(tile.bottom,p.y+p.h,p.foot+p.w*.24);
      if(foliage.test(p.id))coverCells(p.x,p.y,p.w,p.h,function(key){
        if(!tile.grid.has(key))tile.grid.set(key,[]);tile.grid.get(key).push(p);
      });
    });
    tile.plants.sort(function(a,b){return a.foot-b.foot;});
    return tile;
  }
  function paintPlants(ctx,plants){
    ctx.fillStyle='#101c0b';ctx.globalAlpha=.17;ctx.beginPath();
    plants.forEach(function(p){
      if(!p.tree)return;
      var x=p.x+p.w*.62;
      ctx.moveTo(x+p.w*.44*Math.cos(-.4),p.foot+p.w*.44*Math.sin(-.4));
      ctx.ellipse(x,p.foot,p.w*.44,p.w*.16,-.4,0,Math.PI*2);ctx.closePath();
    });
    ctx.fill();
    plants.forEach(function(p){ctx.globalAlpha=p.opacity;A.sprite(ctx,p.id,p.x,p.y,p.w,p.h);});
    ctx.globalAlpha=1;
  }
  function rasterTile(tile,res){
    var cv=document.createElement('canvas');
    cv.width=Math.ceil((tile.right-tile.left+2)*res);cv.height=Math.ceil((tile.bottom-tile.top+2)*res);
    var tc=cv.getContext('2d');tc.setTransform(res,0,0,res,(1-tile.left)*res,(1-tile.top)*res);
    paintPlants(tc,tile.plants);return cv;
  }
  // 두 해상도의 판은 같은 수목과 같은 발치를 쓴다. 더 가까이에서는 원화를 직접 그린다.
  function paintTile(ctx,tile,scale,left,top,right,bottom){
    var f=fx(),detail=f.forestDetailZoom/f.forestTileZoom,cv,res;
    if(scale<=1){
      res=1;cv=tile.canvas||(tile.canvas=rasterTile(tile,res));
    }else if(scale<=detail){
      res=detail;cv=detailTiles.get(tile);
      if(cv)detailTiles.delete(tile);else cv=rasterTile(tile,res);
      detailTiles.set(tile,cv);
      if(detailTiles.size>f.forestDetailTiles)detailTiles.delete(detailTiles.keys().next().value);
    }
    if(cv){
      ctx.drawImage(cv,tile.left-1,tile.top-1,cv.width/res,cv.height/res);
    }else{
      paintPlants(ctx,tile.plants.filter(function(p){
        return p.x+p.w*1.1>=left&&p.x<=right&&Math.max(p.y+p.h,p.foot+p.w*.24)>=top&&p.y<=bottom;
      }));
    }
  }
  A.draw=function(ctx,cam,toScreen,actor){
    var f=fx();if(!data||!G.Terrain.ready||!f.enabled||cam.zoom<=f.farZoom){stats.trees=0;stats.candidates=0;stats.visibleChunks=0;stats.drawMs=0;stats.pendingChunks=0;return;}
    var now=performance.now(),margin=f.forestCacheMargin,fade=clamp((cam.zoom-f.farZoom)/(f.nearZoom-f.farZoom),0,1),sx=(1800+margin*2)/cam.zoom,sy=(1100+margin*2)/cam.zoom;
    fade=fade*fade*(3-2*fade);
    var left=Math.floor((cam.lon-sx/2)/2),right=Math.floor((cam.lon+sx/2)/2);
    var bottom=Math.max(-41,Math.floor((cam.lat-sy/2-f.reliefMax-f.treeWorld*3)/2)),top=Math.min(40,Math.floor((cam.lat+sy/2)/2));
    var style=[yearKey(),seasonKey(),JSON.stringify(f),JSON.stringify(G.FX.terrainBiomes),JSON.stringify(G.FX.terrainCoast)].join(':');
    if(style!==chunkStyle){A.invalidate();chunkStyle=style;}
    var key=[left,right,bottom,top].join(':');
    if(!last||last.key!==key){
      var pending=[],tiles=[];
      for(var y=bottom;y<=top;y++)for(var x=left;x<=right;x++){
        var cx=((x+90)%180+180)%180-90, id=cx+':'+y, saved=chunks.get(id);
        if(saved){chunks.delete(id);chunks.set(id,saved);if(saved.plants.length)tiles.push(saved);}
        else pending.push({x:cx,y:y,id:id,distance:Math.hypot(x*2+1-cam.lon,y*2+1-cam.lat)});
      }
      pending.sort(function(a,b){return a.distance-b.distance;});
      last={key:key,tiles:tiles,pending:pending,keep:Math.max(160,(right-left+1)*(top-bottom+1))};
      while(chunks.size>last.keep)chunks.delete(chunks.keys().next().value);
    }
    var buildStart=performance.now();
    while(last.pending.length){
      var cell=last.pending.shift(),tile=chunk(cell.x,cell.y);
      chunks.set(cell.id,tile);
      if(chunks.size>last.keep)chunks.delete(chunks.keys().next().value);
      if(tile.plants.length)last.tiles.push(tile);
      if(performance.now()-buildStart>f.chunkBudgetMs)break;
    }
    stats.buildMs=performance.now()-buildStart;stats.pendingChunks=last.pending.length;
    var cacheKey=last.key+':'+last.tiles.length,anchor=plate&&toScreen(plate.lon,plate.lat);
    var ratio=plate?cam.zoom/plate.zoom:1;
    var dx=plate?anchor[0]-plate.anchor[0]*ratio:0,dy=plate?anchor[1]-plate.anchor[1]*ratio:0;
    // 확대 애니메이션 동안은 완성된 숲 판을 지면에 맞춰 옮긴다. 화면 끝이 드러나거나 확대가 끝나면 원화로 다시 그린다.
    var reuse=plate&&plate.complete&&cam.zoomT&&ratio!==1&&ratio<=f.forestZoomReuse&&ratio>=1/f.forestZoomReuse&&
      dx-margin*ratio<=0&&dy-margin*ratio<=0&&dx+(1600+margin)*ratio>=1600&&dy+(900+margin)*ratio>=900;
    if(!reuse&&(!plate||plate.key!==cacheKey||plate.zoom!==cam.zoom||Math.abs(dx)>margin*.6||Math.abs(dy)>margin*.6)){
      var canvas=plate?plate.canvas:document.createElement('canvas'),w=1600+margin*2,h=900+margin*2;
      if(canvas.width!==w)canvas.width=w;
      if(canvas.height!==h)canvas.height=h;
      var pc=canvas.getContext('2d');pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,w,h);
      var scale=cam.zoom/f.forestTileZoom,views=[],count=0,candidates=0;
      last.tiles.sort(function(a,b){return b.lat-a.lat||a.lon-b.lon;});
      last.tiles.forEach(function(tile){
        candidates+=tile.plants.length;
        var p=toScreen(tile.lon,tile.lat),left=(-margin-p[0])/scale,top=(-margin-p[1])/scale;
        var right=left+w/scale,bottom=top+h/scale;
        if(tile.right<left||tile.bottom<top||tile.left>right||tile.top>bottom)return;
        pc.setTransform(scale,0,0,scale,margin+p[0],margin+p[1]);
        paintTile(pc,tile,scale,left,top,right,bottom);
        views.push({tile:tile,x:p[0],y:p[1],scale:scale});count+=tile.plants.length;
      });
      var formations=[];
      (G.LANDSCAPE_FORMATIONS||[]).forEach(function(r){
        if(Math.abs(G.Geo.wrapLon(r.lon-cam.lon))>sx||Math.abs(r.lat-cam.lat)>sy)return;
        var p=toScreen(r.lon,r.lat),w=Math.min(r.width*cam.zoom,G.FX.terrainBiomes.detailMaxPx);
        var id=A.formationId(r),m=A.metrics(id,w);if(!m)return;
        var x=p[0]-w/2,y=p[1]-m.height*.93;
        if(x+w>=-margin&&x<=1600+margin&&y+m.height>=-margin&&y<=900+margin)
          formations.push(r);
      });
      plate={canvas:canvas,key:cacheKey,zoom:cam.zoom,lon:cam.lon,lat:cam.lat,anchor:toScreen(cam.lon,cam.lat),trees:count,formations:formations,tiles:views,complete:!last.pending.length};
      stats.candidates=candidates;stats.visibleChunks=views.length;stats.plateBuilds=(stats.plateBuilds||0)+1;dx=dy=0;ratio=1;
    }
    if(plate.key===cacheKey&&!last.pending.length)plate.complete=true;
    var expedition=actor&&actor.mode==='land',ap=actor&&!expedition&&toScreen(actor.lon,actor.lat);
    ctx.save();ctx.globalAlpha=fade;
    plate.formations.forEach(function(r){
      if(r.discovery&&G.VolcanoArt&&G.VolcanoArt.landmark(r.discovery,cam.zoom))return;
      if(r.discovery&&G.DiscoveryIcon&&G.DiscoveryIcon.replacesFormation(r.discovery))return;
      var p=toScreen(r.lon,r.lat),id=A.formationId(r),w=Math.min(r.width*cam.zoom,G.FX.terrainBiomes.detailMaxPx),m=A.metrics(id,w);
      A.sprite(ctx,id,p[0]-w/2,p[1]-m.height*.93,w,m.height);
    });
    if(ap){
      if(!scratch){scratch=document.createElement('canvas');scratch.width=1600;scratch.height=900;}
      var sc=scratch.getContext('2d');sc.clearRect(0,0,1600,900);sc.drawImage(plate.canvas,dx-margin*ratio,dy-margin*ratio,plate.canvas.width*ratio,plate.canvas.height*ratio);
      var fadeActor=sc.createRadialGradient(ap[0],ap[1],25,ap[0],ap[1],95);fadeActor.addColorStop(0,'rgba(0,0,0,.78)');fadeActor.addColorStop(1,'rgba(0,0,0,0)');
      sc.globalCompositeOperation='destination-out';sc.fillStyle=fadeActor;sc.fillRect(ap[0]-95,ap[1]-95,190,190);sc.globalCompositeOperation='source-over';
      ctx.drawImage(scratch,0,0);
    }else ctx.drawImage(plate.canvas,dx-margin*ratio,dy-margin*ratio,plate.canvas.width*ratio,plate.canvas.height*ratio);
    ctx.restore();stats.trees=plate.trees;stats.drawMs=performance.now()-now;
    // 건널 수 있는 도시의 다리·나루도 통행 판정에 등록된 위치를 쓴다.
    ctx.save();ctx.globalAlpha*=fade;ctx.lineCap='round';G.Hydro.routes().forEach(function(r){r.crossings.forEach(function(c){
      if(!G.Hydro.crossingOpen(c))return;
      var p=toScreen(c.lon,c.lat);if(p[0]<-500||p[0]>2100||p[1]<-500||p[1]>1400)return;
      var art=crossingBanks(r,c);if(!art)return;
      var a=toScreen(art.banks[0][0],art.banks[0][1]),b=toScreen(art.banks[1][0],art.banks[1][1]),dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),pier=Math.min(.18,f.ferryPierLength/Math.max(.01,art.span));
      // 넓은 강은 물 위의 긴 막대 다리 대신 두 물가에 붙은 나루를 그린다.
      var deck=f.bridgeWidth*cam.zoom,plank=deck*.375;
      ctx.strokeStyle='#393125';ctx.lineWidth=deck;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(a[0]+dx*(art.span<=f.bridgeMaxSpan?1:pier),a[1]+dy*(art.span<=f.bridgeMaxSpan?1:pier));
      if(art.span>f.bridgeMaxSpan){ctx.moveTo(b[0],b[1]);ctx.lineTo(b[0]-dx*pier,b[1]-dy*pier);}ctx.stroke();ctx.strokeStyle='#a38c64';ctx.lineWidth=deck*.625;ctx.stroke();
      if(length>plank){ctx.strokeStyle='#64543d';ctx.lineWidth=deck*.125;for(var t=0;t<=1;t+=Math.max(.015,deck*.625/length)){if(art.span>f.bridgeMaxSpan&&t>pier&&t<1-pier)continue;var x=a[0]+dx*t,y=a[1]+dy*t;ctx.beginPath();ctx.moveTo(x-dy/length*plank,y+dx/length*plank);ctx.lineTo(x+dy/length*plank,y-dx/length*plank);ctx.stroke();}}
    });});ctx.restore();
    if(expedition){
      var views=plate.tiles;
      return function(target,member,bounds,draw){return coverMember(target,member,bounds,draw,views,dx,dy,ratio,fade);};
    }
  };
  A.stats=function(){return Object.assign({},stats,{chunks:chunks.size});};
  A.invalidate=function(){chunks.clear();detailTiles.clear();crossingArt.clear();last=null;plate=null;};
})(window.G=window.G||{});
