/* 풀·흙·암반·모래·습지의 반복 재질과 사구 음영 판. */
(function(G){
  'use strict';var cached=null,soilCanvas=null;
  function wrapTile(v){return v-Math.round(v);}
  function smooth(a,b,v){var t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);}

  function duneHeights(side){
    // 한 판에 초승달, 굽은 능선, 별사구, 낮은 모래 언덕을 함께 놓는다.
    // 각 사구의 끝은 다음 반복 경계에 닿기 전에 낮아진다.
    var ridges=[
      // [중심 x, y, 방향, 길이, 완만한 사면 폭, 급한 사면 폭, 굽힘, 높이]
      [.21,.19,.24,.16,.095,.032,.080,.52],
      [.36,.10,.45,.085,.055,.024,.022,.22],
      [.68,.20,-.55,.24,.075,.035,-.034,.35],
      [.84,.37,-.43,.22,.064,.027,.032,.29],
      [.56,.68,.71,.21,.094,.040,.056,.42],
      [.93,.88,.08,.115,.068,.037,.035,.26]
    ].map(function(d){return {x:d[0],y:d[1],cos:Math.cos(d[2]),sin:Math.sin(d[2]),length:d[3],windward:d[4],lee:d[5],bend:d[6],height:d[7]};});
    var arms=[.3,2.15,4.45].map(function(a){return [Math.cos(a),Math.sin(a)];});
    var heights=new Float32Array(side*side);
    for(var y=0;y<side;y++)for(var x=0;x<side;x++){
      var u=x/side,v=y/side,h=0;
      for(var k=0;k<ridges.length;k++){
        var d=ridges[k],dx=wrapTile(u-d.x),dy=wrapTile(v-d.y);
        var along=(dy*d.cos-dx*d.sin)/d.length;
        if(Math.abs(along)>=1||dx*dx+dy*dy>=.22)continue;
        var across=dx*d.cos+dy*d.sin-d.bend*along*along;
        var width=across<0?d.windward:d.lee;
        var tail=1-along*along;
        h+=d.height*Math.exp(-Math.pow(across/width,2))*tail*tail*(1-smooth(.26,.46,Math.hypot(dx,dy)));
      }
      // 별사구는 중심이 높고 바람이 성긴 세 방향으로 가는 모래등이 이어진다.
      var sx=wrapTile(u-.26),sy=wrapTile(v-.73),radius=Math.hypot(sx,sy);
      var star=.51*Math.exp(-Math.pow(radius/.070,2));
      for(var k=0;k<arms.length;k++){
        var axis=arms[k],along=sx*axis[0]+sy*axis[1],across=sy*axis[0]-sx*axis[1];
        star+=.28*smooth(-.03,.035,along)*(1-smooth(.055,.19,along))*Math.exp(-Math.pow((across-along*along*1.1)/.029,2));
      }
      var mx=wrapTile(u-.84),my=wrapTile(v-.61);
      var mound=.16*Math.exp(-Math.pow(mx/.096,2)-Math.pow((my+mx*.43)/.067,2));
      heights[y*side+x]=h+star*(1-smooth(.16,.23,radius))+mound;
    }
    return heights;
  }

  function bakeDunes(raw,side){
    var heights=duneHeights(side);
    function height(x,y){return heights[((y+side)%side)*side+(x+side)%side];}
    var base=6*side*side*4;
    for(var y=0;y<side;y++)for(var x=0;x<side;x++){
      var nx=(height(x-1,y)-height(x+1,y))*16,ny=(height(x,y-1)-height(x,y+1))*16;
      var n=Math.hypot(nx,ny,1),o=base+(y*side+x)*4;
      raw[o]=Math.round((nx/n*.5+.5)*255);
      raw[o+1]=Math.round((ny/n*.5+.5)*255);
      raw[o+2]=Math.round((1/n*.5+.5)*255);
      raw[o+3]=Math.round(Math.min(1,height(x,y))*255);
    }
  }

  function bakePlain(raw,side,layer,palette,rnd,blades){
    var canvas=document.createElement('canvas');canvas.width=canvas.height=side;
    var ctx=canvas.getContext('2d'),base=palette[0],light=palette[1],dark=palette[2];
    ctx.fillStyle='rgb('+base+')';ctx.fillRect(0,0,side,side);
    // 풀은 여러 가닥이 같은 방향으로 눕고, 맨흙에는 작고 둥근 알갱이만 남는다.
    for(var i=0;i<blades;i++){
      var x=rnd()*side,y=rnd()*side,angle=.40+.83*Math.sin(x/side*Math.PI*2)+.72*Math.cos(y/side*Math.PI*2);
      angle+=(rnd()-.5)*1.7;
      var length=layer===9?.75+rnd()*1.30:1.25+rnd()*5.3;
      var dx=Math.cos(angle)*length,dy=Math.sin(angle)*length;
      ctx.strokeStyle='rgb('+(i%3?light:dark)+')';ctx.globalAlpha=.13+rnd()*.36;
      ctx.lineWidth=layer===9?.65+rnd()*.50:.42+rnd()*.44;
      ctx.beginPath();
      var wrapX=x<8?side:x>side-8?-side:0,wrapY=y<8?side:y>side-8?-side:0;
      for(var iy=0;iy<=(wrapY?1:0);iy++)for(var ix=0;ix<=(wrapX?1:0);ix++){
        var px=x+ix*wrapX,py=y+iy*wrapY;
        ctx.moveTo(px,py);ctx.quadraticCurveTo(px+dx*.53-dy*.30,py+dy*.53+dx*.30,px+dx,py+dy);
      }
      ctx.stroke();
    }
    raw.set(ctx.getImageData(0,0,side,side).data,layer*side*side*4);
    return canvas;
  }

  G.TerrainMaterials={duneHeights:duneHeights,build:function(){
    if(cached)return cached;
    var side=256,layers=10,raw=new Uint8Array(side*side*4*layers),seed=5781;
    function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    var palette=[[[121,131,83],[163,164,110],[78,102,59]],[[139,126,94],[174,162,117],[103,106,75]],[[119,104,78],[153,135,98],[88,85,62]],[[145,137,123],[181,172,157],[101,97,86]],[[203,171,117],[229,198,141],[164,137,91]],[[99,116,77],[143,151,104],[67,89,63]]];
    for(var layer=0;layer<6;layer++){
      var cv=document.createElement('canvas');cv.width=cv.height=side;var c=cv.getContext('2d'),p=palette[layer];c.fillStyle='rgb('+p[0]+')';c.fillRect(0,0,side,side);
      for(var i=0;i<70;i++){
        var x=rnd()*side,y=rnd()*side,r=12+rnd()*39,gr=c.createRadialGradient(x,y,0,x,y,r),t=i%2?p[1]:p[2];gr.addColorStop(0,'rgba('+t+',.18)');gr.addColorStop(1,'rgba('+t+',0)');c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2);
      }
      for(var i=0;i<7500;i++){
        var x=rnd()*side,y=rnd()*side,a=rnd()*6.283,s=layer===4?.35+rnd()*.6:.4+rnd()*1.1,col=i%2?p[1]:p[2];c.globalAlpha=.16+rnd()*.24;c.fillStyle='rgb('+col+')';c.fillRect(x,y,s,s);
      }
      if(layer===0||layer===1||layer===5)for(var i=0;i<2400;i++){
        var x=rnd()*side,y=rnd()*side,len=1.4+rnd()*(layer===0?5:3),a=rnd()*6.283,col=i%3?p[1]:p[2];c.globalAlpha=.22+rnd()*.25;c.strokeStyle='rgb('+col+')';c.lineWidth=.45+rnd()*.35;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a+.6)*len*.7,y+Math.sin(a+.6)*len*.7,x+Math.cos(a)*len,y+Math.sin(a)*len);c.stroke();
      }
      if(layer===3)for(var i=0;i<200;i++){
        var x=rnd()*side,y=rnd()*side,r=1+rnd()*3;c.globalAlpha=.26;c.fillStyle='rgb('+p[2]+')';c.beginPath();c.ellipse(x+1,y+1,r,r*.65,rnd()*3,0,Math.PI*2);c.fill();c.fillStyle='rgb('+p[1]+')';c.beginPath();c.ellipse(x,y,r,r*.65,rnd()*3,0,Math.PI*2);c.fill();
      }
      if(layer===3)for(var i=0;i<22;i++){
        var x=rnd()*side,y=rnd()*50;c.globalAlpha=.18;c.strokeStyle='rgb('+p[2]+')';c.lineWidth=.6+rnd()*.6;c.beginPath();c.moveTo(x,y);
        for(var j=0;j<15;j++){x+=(rnd()-.5)*11;y+=9+rnd()*13;c.lineTo(x,y);}c.stroke();
      }
      c.globalAlpha=1;raw.set(c.getImageData(0,0,side,side).data,layer*side*side*4);
    }
    bakeDunes(raw,side);
    bakePlain(raw,side,7,[[124,140,76],[176,180,100],[74,94,47]],rnd,14500);
    bakePlain(raw,side,8,[[173,153,88],[211,186,116],[115,107,62]],rnd,14100);
    soilCanvas=bakePlain(raw,side,9,[[171,133,91],[207,173,122],[105,83,54]],rnd,10500);
    cached={side:side,layers:layers,raw:raw};return cached;
  },soilCanvas:function(){return soilCanvas;}};
})(window.G=window.G||{});
