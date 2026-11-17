/* 동물의 이동 흔적과 2~4색 지도 그림. 저장 상태를 추가하지 않는 연출이다. */
(function(G){
  'use strict';
  var A=G.AnimalTracking={}, cache={}, paths={}, filters={}, nearby=null;
  var slots={cat:0,dog:1,bear:2,split:3,hoof:4,elephant:5,rhino:6,hippo:6,bird:7,ostrich:8,web:9,hand:10,hop:11,lizard:12,frog:13,camel:14,small:15,biped:2,raptor:7};
  function cfg(){return G.FX.animalTracking;}
  A.profile=function(d){return d&&G.ANIMAL_TRACKING[d.id]||null;};
  A.is=function(d){return !!A.profile(d);};
  A.radius=function(d,r){return A.is(d)?Math.min(r,G.BALANCE.animalTracking[d.how==='land'?'landRadius':'seaRadius']):r;};
  A.alpha=function(t,id){var c=cfg(),phase=(G.U.strHash(id)>>>0)%1000/1000;return c.alphaMin+(c.alphaMax-c.alphaMin)*(0.5-0.5*Math.cos((t/c.pulseSeconds+phase)*Math.PI*2));};
  function image(key){var im=G.Img.get(key);if(!im)G.Img.want(key);return im;}
  // SVG의 이산 색상표는 원화 명암을 2~4개 색면으로 바꾼다. file://에서도 픽셀을 읽지 않는다.
  function filter(p){
    var id='animal-map-'+p.palette.join('').replace(/#/g,'');if(filters[id])return 'url(#'+id+')';
    var ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),f=document.createElementNS(ns,'filter');
    svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';svg.style.pointerEvents='none';
    f.id=id;f.setAttribute('color-interpolation-filters','sRGB');
    var gray=document.createElementNS(ns,'feColorMatrix');gray.setAttribute('type','saturate');gray.setAttribute('values','0');f.appendChild(gray);
    var transfer=document.createElementNS(ns,'feComponentTransfer');
    ['R','G','B'].forEach(function(ch,i){var n=document.createElementNS(ns,'feFunc'+ch);n.setAttribute('type','discrete');n.setAttribute('tableValues',p.palette.map(function(h){return parseInt(h.slice(1+i*2,3+i*2),16)/255;}).join(' '));transfer.appendChild(n);});
    f.appendChild(transfer);svg.appendChild(f);document.body.appendChild(svg);filters[id]=svg;return 'url(#'+id+')';
  }
  A.sprite=function(d,track){
    var p=A.profile(d);if(!p)return null;var key=d.id+(track?':track':':animal');if(cache[key])return cache[key];
    var sheet=track||p.slot!=null,im=image(track?'animal-tracking/footprints':sheet?'animal-tracking/animals-'+p.sheet:p.key);if(!im)return null;
    var n=4,slot=track?slots[p.kind]:p.slot;if(track&&slot==null)return null;
    var c=document.createElement('canvas');c.width=c.height=cfg().spritePixels;var x=c.getContext('2d');
    x.filter=filter(p);
    if(sheet){
      var w=im.naturalWidth/n,h=im.naturalHeight/n,bounds=!track&&G.ANIMAL_TRACKING_BOUNDS&&G.ANIMAL_TRACKING_BOUNDS[p.sheet]&&G.ANIMAL_TRACKING_BOUNDS[p.sheet][slot];
      if(bounds){var fit=c.width*0.88/Math.max(bounds[2],bounds[3]),dw=bounds[2]*fit,dh=bounds[3]*fit;x.drawImage(im,bounds[0],bounds[1],bounds[2],bounds[3],(c.width-dw)/2,(c.height-dh)/2,dw,dh);}
      else x.drawImage(im,(slot%n)*w+1,Math.floor(slot/n)*h+1,w-2,h-2,0,0,c.width,c.height);
    }
    else x.drawImage(im,0,0,c.width,c.height);
    x.filter='none';
    if(track){ // 발바닥과 발가락을 두 색으로 나누되 그림자를 짙게 유지한다.
      if(p.kind==='hippo'){
        x.clearRect(0,0,c.width,c.height);x.fillStyle=p.palette[0];
        x.beginPath();x.ellipse(48,62,28,25,0,0,Math.PI*2);x.fill();
        for(var toe=0;toe<4;toe++){x.beginPath();x.ellipse(19+toe*19,30+Math.abs(1.5-toe)*5,8,14,(toe-1.5)*0.15,0,Math.PI*2);x.fill();}
      }
      x.globalCompositeOperation='source-in';x.fillStyle=p.palette[0];x.fillRect(0,0,c.width,c.height);
      x.globalCompositeOperation='source-atop';x.fillStyle=p.palette[1];x.fillRect(0,0,c.width,c.height*0.38);
      x.globalCompositeOperation='source-over';
    }
    cache[key]=c;return c;
  };
  A.position=function(d){
    if(G.SeaMonsters&&G.SeaMonsters.is(d.id))return G.SeaMonsters.position(d.id);
    var k=d.id+':position';if(paths[k])return paths[k];var pos={lon:d.lon,lat:d.lat};
    // 해안가·도시 가장자리의 기존 좌표는 같은 서식 반경 안의 가까운 뭍에서 만난다.
    if(d.how==='land'&&G.Geo.isLand&&!G.Geo.isLand(pos.lon,pos.lat)){
      outer:for(var r=0.1;r<=Math.min(d.r||1.6,cfg().shoreSearch);r+=0.1)for(var j=0;j<24;j++){
        var lon=G.Geo.wrapLon(d.lon+Math.cos(j*Math.PI/12)*r),lat=d.lat+Math.sin(j*Math.PI/12)*r;
        if(G.Geo.isLand(lon,lat)){pos={lon:lon,lat:lat};break outer;}
      }
    }
    paths[k]=pos;return pos;
  };
  A.visible=function(mode,lon,lat){
    var c=cfg(),now=performance.now(),state=G.Game.state;
    if(nearby&&nearby.state===state&&nearby.mode===mode&&now-nearby.at<250&&G.Geo.dist(lon,lat,nearby.lon,nearby.lat)<0.1)return nearby.rows.filter(function(d){return !G.Disc.foundByMe(d.id);});
    var list=G.DISCOVERIES.filter(function(d){
      if(!A.is(d)||(mode==='land'?d.how!=='land':d.how!=='sea'&&d.how!=='special'))return false;
      if(G.Disc.foundByMe(d.id)||!G.Disc.built(d)||!G.Disc.opened(d)||!G.Disc.needMet(d))return false;
      if(G.SeaMonsters&&G.SeaMonsters.is(d.id))return false; // 실제 이동하는 괴물은 기존 출몰 좌표·그림을 쓴다.
      var pos=A.position(d);return G.Geo.dist(lon,lat,pos.lon,pos.lat)<c.senseRadius;
    }).sort(function(a,b){var ap=A.position(a),bp=A.position(b);return G.Geo.dist(lon,lat,ap.lon,ap.lat)-G.Geo.dist(lon,lat,bp.lon,bp.lat);}).slice(0,c.maxNearby);
    nearby={state:state,mode:mode,at:now,lon:lon,lat:lat,rows:list};return list;
  };
  A.trail=function(d){
    var pos=A.position(d);if(!pos)return [];
    var k=d.id+':trail:'+pos.lon.toFixed(2)+':'+pos.lat.toFixed(2);if(paths[k])return paths[k];var c=cfg(),rng=G.U.makeRng(G.U.strHash(d.id)),angle=rng()*Math.PI*2,pts=[];
    for(var i=0;i<=c.steps;i++){
      var f=i/c.steps,dist=c.trailLength*(1-f),a=angle+Math.sin(f*Math.PI*2)*c.curve;
      var lon=G.Geo.wrapLon(pos.lon+Math.cos(a)*dist),lat=pos.lat+Math.sin(a)*dist;
      pts.push({lon:lon,lat:lat,ground:d.how!=='land'||!G.Geo.isLand||G.Geo.isLand(lon,lat)});
    }
    return(paths[k]=pts);
  };
  function marks(ctx,d,pts,toScreen,t){
    var p=A.profile(d),c=cfg(),im=A.sprite(d,true),kind=p.kind;
    ctx.save();ctx.strokeStyle=p.palette[0];ctx.fillStyle=p.palette[1];ctx.lineWidth=c.traceWidth;ctx.lineCap='round';
    for(var i=0;i<pts.length-1;i++){
      var q=pts[i],next=pts[i+1];if(!q.ground||!next.ground)continue;
      var a=toScreen(q.lon,q.lat),b=toScreen(next.lon,next.lat),h=Math.atan2(b[1]-a[1],b[0]-a[0]);
      ctx.globalAlpha=c.trackAlpha*(0.55+0.45*i/pts.length);ctx.save();ctx.translate(a[0],a[1]);ctx.rotate(h+Math.PI/2);
      if(im){
        var two=/bird|ostrich|web|biped|raptor/.test(kind),hop=/hop|frog|small/.test(kind),s=c.footSize;
        function stamp(x,y,scale,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,1);ctx.drawImage(im,-s*scale/2,-s*scale/2,s*scale,s*scale);ctx.restore();}
        if(two)stamp(i%2?c.trackWidth:-c.trackWidth,0,1,i%2===0);
        else if(hop){stamp(-c.trackWidth,-c.hopGap,1.15,false);stamp(c.trackWidth,-c.hopGap,1.15,true);stamp(-c.trackWidth*0.5,c.hopGap,0.65,false);stamp(c.trackWidth*0.5,c.hopGap,0.65,true);}
        else{var side=i%2?1:-1;stamp(side*c.trackWidth,-c.frontGap,1,false);stamp(-side*c.trackWidth,c.frontGap,0.8,true);}
      }else if(kind==='snake'){
        ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(c.waveWidth,-3,-c.waveWidth,-7,0,-Math.hypot(b[0]-a[0],b[1]-a[1]));ctx.stroke();
      }else if(kind==='insect'){
        [-1,1].forEach(function(side){for(var n=0;n<3;n++){ctx.beginPath();ctx.moveTo(side*2,n*3);ctx.lineTo(side*5,n*3-2);ctx.stroke();}});
      }else{
        ctx.beginPath();ctx.ellipse(0,0,c.waveWidth,kind==='water'?3:5,0,Math.PI*0.1,Math.PI*0.9);ctx.stroke();
        ctx.beginPath();ctx.ellipse(0,3,c.waveWidth*0.65,2,0,Math.PI*0.1,Math.PI*0.9);ctx.stroke();
      }
      ctx.restore();
    }ctx.restore();
  }
  A.drawTrail=marks;
  A.draw=function(ctx,toScreen,mode,lon,lat,t){
    var c=cfg();if(c.enabled===false)return;
    A.visible(mode,lon,lat).forEach(function(d){
      A.drawOne(ctx,toScreen,d,lon,lat,t);
    });
  };
  A.drawOne=function(ctx,toScreen,d,lon,lat,t){
    var c=cfg(),pos=A.position(d);if(!pos||c.enabled===false)return;
    var q=toScreen(pos.lon,pos.lat),distance=G.Geo.dist(lon,lat,pos.lon,pos.lat);
    marks(ctx,d,A.trail(d),toScreen,t);
    if(distance>c.silhouetteRadius)return;var im=A.sprite(d,false);if(!im)return;
    ctx.save();ctx.globalAlpha=A.alpha(t,d.id);ctx.imageSmoothingEnabled=true;
    ctx.drawImage(im,q[0]-c.animalSize/2,q[1]-c.animalSize/2,c.animalSize,c.animalSize);ctx.restore();
  };
})(window.G=window.G||{});
