/* 실제 화산 좌표에 얹는 분화구와 산기슭. 보이는 곳의 그림만 미리 그려 재사용한다. */
(function(G){
  'use strict';
  var A=G.VolcanoArt={},U=G.U,cache=new Map(),TAU=Math.PI*2;
  var profiles=[
    {width:1,height:.90,bowl:.18,slope:1.38},
    {width:1.22,height:.55,bowl:.25,slope:2.1},
    {width:1.05,height:.61,bowl:.36,slope:1.33},
    {width:1.16,height:.36,bowl:.28,slope:1.1}
  ];
  var discoveries={fuji:283030,vesuvius:211020,hawaii:332010,krakatau:262000};
  var rock={
    desert:[132,103,77],steppe:[112,100,72],grass:[94,92,71],forest:[76,88,62],
    jungle:[65,83,58],mountain:[99,96,86],tundra:[110,109,105],snow:[137,142,145],ice:[141,151,155]
  };
  function conf(){return G.FX.groundDisaster.volcano;}
  A.radius=function(site,zoom){
    var c=conf(), scale=site?U.clamp(.72+site.elevation/9900,.73,1.27):1;
    if(site&&site.smallIsland)scale*=.52;
    if(site&&G.Geo.ready){
      var coast=G.Geo.sdf(site.lon,site.lat)/G.Geo.TEX_PER_DEG;
      scale*=.48+.52*U.smooth(0,.12,coast);
    }
    return Math.min(c.maxRadius,zoom*c.scale*scale);
  };
  A.landmark=function(id,zoom){
    var number=discoveries[id];
    return number&&zoom>conf().minZoom?G.volcanoSite(number):null;
  };
  function color(rgb,luminance,alpha){
    var shade=rgb.map(function(n){return Math.round(U.clamp(n*luminance,0,255));});
    return 'rgba('+shade.join(',')+','+alpha+')';
  }
  function point(p){return [152+p[0]*77,84+(p[1]*.56-p[2])*77];}
  function path(ctx,pts){
    ctx.beginPath();
    pts.forEach(function(p,i){p=point(p);if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});
    ctx.closePath();
  }
  function lithology(site){
    var terrain=G.Geo.terrain(site.lon,site.lat), climate=G.Geo.climate(site.lon,site.lat);
    var snowy=terrain==='ice'||terrain==='snow'||(Math.abs(site.lat)>36&&site.elevation>2900);
    return {ground:rock[terrain]||rock.grass,
      core:climate.t<.25?[84,80,79]:[98,81,66],snow:snowy};
  }
  // 지층의 가는 결 사이로 퇴적재와 돌의 색이 얼룩처럼 이어지게 한다.
  function grain(ctx,w,h,seed){
    var image=ctx.getImageData(0,0,w,h), data=image.data, rng=U.makeRng(seed);
    var grid=Float32Array.from({length:40*29},rng);
    function noise(x,y){
      var i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,k=j*40+i;
      return U.lerp(U.lerp(grid[k],grid[k+1],u),U.lerp(grid[k+40],grid[k+41],u),v);
    }
    for(var y=55;y<h;y++)for(var x=0;x<w;x++){
      var i=4*(y*w+x);
      if(!data[i+3])continue;
      var u=x/w,v=y/h, direction=(u-.5)/(.42+.92*v);
      var bed=noise(u*13,v*11), grit=noise(u*36,v*24);
      var ribs=noise(U.clamp(direction*28+18,0,38),8+v*3.2);
      var shade=(bed-.50)*28+(grit-.5)*20+(ribs-.5)*28+(rng()-.50)*14;
      for(var k=0;k<3;k++)data[i+k]=data[i+k]+shade;
    }
    ctx.putImageData(image,0,0);
  }
  function build(site){
    var canvas=document.createElement('canvas');canvas.width=304;canvas.height=232;
    var ctx=canvas.getContext('2d'), rng=U.makeRng(site.id), land=lithology(site);
    var profile=profiles[site.shape], count=59, ring=[], faces=[], ridge=[], rockTone=[];
    var seed=rng()*12, direction=rng()*TAU, oval=site.shape===3?.48:.72+rng()*.31;
    for(var i=0;i<count;i++){
      ridge.push((rng()-.5)*.17+.10*Math.sin(i*.53+seed));rockTone.push(.92+rng()*.16);
    }
    // 분화구 안쪽에서 흙과 숲이 있는 산기슭까지 이은 바위 능선.
    var bands=[profile.bowl*.53,profile.bowl,U.lerp(profile.bowl,.60,.47),.60,.78,.97,1.32];
    bands.forEach(function(r,k){
      var verts=[];
      for(var i=0;i<count;i++){
        var a=i*TAU/count+.09*Math.sin(k*.8+i*.32), slump=Math.cos(a-direction), jag=ridge[i];
        var w=r*profile.width*(1+jag*(k===0?1.1:.67)+.18*Math.sin(a*3+seed)+.11*slump);
        var z=k===0?-.075+ridge[i]*.25:
          -profile.height*(1-Math.pow(Math.max(0,1-(r-profile.bowl)/(1.18-profile.bowl)),profile.slope));
        if(k>0)z+=(.17+.38*Math.sin(Math.PI*r))*jag;
        verts.push([Math.cos(a)*w+(k>1?.17*slump*r:0),Math.sin(a)*w*oval,z]);
      }
      ring.push(verts);
    });
    var basin=[];
    ring[0].forEach(function(p){basin.push(p);});
    path(ctx,basin);ctx.fillStyle=color(land.core,.34,1);ctx.fill();
    for(var j=1;j<ring.length;j++){
      for(var n=0;n<count;n++){
        var m=(n+1)%count, a=ring[j-1][n],b=ring[j][n],d=ring[j][m],c=ring[j-1][m];
        var ex=b[0]-a[0],ey=b[1]-a[1],ez=b[2]-a[2],fx=c[0]-a[0],fy=c[1]-a[1],fz=c[2]-a[2];
        var nx=ey*fz-ez*fy,ny=ez*fx-ex*fz,nz=ex*fy-ey*fx;
        var light=(.57+(-nx*.37-ny*.43+nz*.82)/Math.max(.001,Math.hypot(nx,ny,nz))*.28)*rockTone[n];
        if(j===1)light*=.76;
        var blend=U.smooth(1,6,j);
        var rgb=land.core.map(function(v,i){return U.lerp(v,land.ground[i],blend);});
        if(land.snow&&j<=5){
          var snow=U.clamp(.40+.29*Math.sin(n*.58+seed)+.15*rng()-(j-2)*.15,0,.64);
          if(j===1)snow*=.18;
          rgb=rgb.map(function(v,i){return U.lerp(v,[200,205,205][i],snow);});
        }
        faces.push({pts:[a,b,d,c], shade:rgb, light:light+.27,
          edge:j===ring.length-1, depth:(a[1]+b[1]+c[1]+d[1])*.25+(a[2]+b[2]+c[2]+d[2])*.13});
      }
    }
    faces.sort(function(a,b){return a.depth-b.depth;});
    faces.forEach(function(f){
      path(ctx,f.pts);
      if(f.edge){
        var a=point(f.pts[0]),b=point(f.pts[1]),c=point(f.pts[2]),d=point(f.pts[3]);
        var fade=ctx.createLinearGradient((a[0]+d[0])/2,(a[1]+d[1])/2,(b[0]+c[0])/2,(b[1]+c[1])/2);
        fade.addColorStop(0,color(f.shade,f.light,.94));fade.addColorStop(1,color(f.shade,f.light,0));
        ctx.fillStyle=fade;
      }else{
        var inner=point(f.pts[0]),outer=point(f.pts[2]);
        var grad=ctx.createLinearGradient(inner[0],inner[1],outer[0],outer[1]);
        grad.addColorStop(0,color(f.shade,f.light*(.91+.09*rng()),1));
        grad.addColorStop(1,color(f.shade,f.light*(.97+.13*rng()),1));
        ctx.fillStyle=grad;ctx.strokeStyle=grad;ctx.lineJoin='bevel';ctx.lineWidth=.73;ctx.stroke();
      }
      ctx.fill();
    });
    ctx.globalCompositeOperation='source-atop';
    for(var i=0;i<890;i++){
      var x=18+rng()*268,y=62+rng()*152,h=.25+rng()*1.24;
      ctx.fillStyle=i%3?'rgba(32,25,20,.17)':'rgba(229,215,194,.18)';
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(x-152)*.047,y+h*2.6);
      ctx.lineTo(x+h*1.5,y+h*.33);ctx.fill();
    }
    grain(ctx,canvas.width,canvas.height,site.id+901);
    return canvas;
  }
  A.map=function(ctx,cam,toScreen){
    var c=conf();
    if(!G.Geo.ready||cam.zoom<=c.minZoom)return;
    ctx.save();ctx.globalAlpha*=U.smooth(c.minZoom,c.fullZoom,cam.zoom);
    var viewX=910/cam.zoom,viewY=630/cam.zoom;
    for(var i=0;i<G.VOLCANOES.length;i++){
      var v=G.VOLCANOES[i];
      if(Math.abs(v.lat-cam.lat)>viewY||Math.abs(G.Geo.wrapLon(v.lon-cam.lon))>viewX)continue;
      var at=toScreen(v.lon,v.lat), r=A.radius(v,cam.zoom)/77, picture=cache.get(v.id);
      if(!picture){
        picture=build(v);
        if(cache.size>=c.terrainCache)cache.delete(cache.keys().next().value);
        cache.set(v.id,picture);
      }
      ctx.drawImage(picture,at[0]-152*r,at[1]-84*r,picture.width*r,picture.height*r);
    }
    ctx.restore();
  };
})(window.G=window.G||{});
