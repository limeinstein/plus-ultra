/* 탐험 지도 위 균열, 낙석, 범람, 산불과 용암. 실제 피해 위치를 같은 좌표에 그린다. */
(function (G) {
  'use strict';
  var U=G.U, A=G.GroundDisasterFx={};
  function F() { return G.FX.groundDisaster; }
  function frac(x) { return x-Math.floor(x); }
  function jitter(n) { return frac(Math.sin(n*72.37+2.11)*43758.5453); }
  function trace(ctx,points) {
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(var i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
  }
  function stroke(ctx,points,width,color,alpha) {
    trace(ctx,points);ctx.lineWidth=Math.max(.5,width);ctx.strokeStyle=color;
    ctx.globalAlpha=alpha;ctx.stroke();ctx.globalAlpha=1;
  }
  function bearing(points,i) {
    var a=points[Math.max(0,i-1)], b=points[Math.min(points.length-1,i+1)];
    return Math.atan2(b[1]-a[1],b[0]-a[0]);
  }
  function sketch(points,spacing,width,seed,dry) {
    var path=[points[0]], depth=[0], distance=0;
    for(var i=1;i<points.length;i++){
      var a=points[i-1], b=points[i], length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(length<.01)continue;
      var n=Math.ceil(length/spacing);
      for(var j=1;j<=n;j++){
        var f=j/n;
        path.push([U.lerp(a[0],b[0],f),U.lerp(a[1],b[1],f)]);depth.push(distance+length*f);
      }
      distance+=length;
    }
    if(path.length<2)return [];
    return path.map(function(p,i){
      var angle=bearing(path,i)+Math.PI*.5, at=depth[i]/distance;
      var n0=Math.sin(depth[i]*.105+seed), n1=Math.sin(depth[i]*.37-seed*.7);
      var tail=dry?Math.min(1,.08+Math.pow(Math.sin(Math.PI*at),.53)*1.22):1;
      return {x:p[0],y:p[1],nx:Math.cos(angle),ny:Math.sin(angle),
        left:width*tail*(.92+.15*n0+.08*n1),right:width*tail*(.91-.14*n0-.10*n1),
        along:depth[i]};
    });
  }
  function aside(p,f) {
    var d=f*(f<0?p.left:p.right);
    return [p.x+p.nx*d,p.y+p.ny*d];
  }
  function currentAt(nodes,f,lane) {
    var k=U.clamp(f,0,1)*(nodes.length-1), i=Math.min(nodes.length-2,Math.floor(k));
    var a=aside(nodes[i],lane), b=aside(nodes[i+1],lane), x=k-i;
    return [U.lerp(a[0],b[0],x),U.lerp(a[1],b[1],x)];
  }
  function shorePath(ctx,points) {
    var first=points[0];ctx.beginPath();ctx.moveTo(first[0],first[1]);
    for(var i=1;i<points.length-1;i++){
      var a=points[i], b=points[i+1];ctx.quadraticCurveTo(a[0],a[1],(a[0]+b[0])*.5,(a[1]+b[1])*.5);
    }
    var last=points[points.length-1];ctx.lineTo(last[0],last[1]);ctx.closePath();
  }
  function band(ctx,nodes,left,right,color,alpha,loose) {
    if(nodes.length<2)return;
    var a=[], b=[], start=nodes[0], end=nodes[nodes.length-1];
    if(loose){
      var w=Math.max(start.left,start.right)*loose;
      a.push([start.x-start.ny*w,start.y+start.nx*w]);
    }
    for(var i=0;i<nodes.length;i++){
      a.push(aside(nodes[i],left));b.push(aside(nodes[i],right));
    }
    if(loose){
      var t=Math.max(end.left,end.right)*loose;
      a.push([end.x+end.ny*t,end.y-end.nx*t]);
    }
    var outline=a.concat(b.reverse());
    if(loose)shorePath(ctx,outline);else{trace(ctx,outline);ctx.closePath();}
    ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.fill();ctx.globalAlpha=1;
  }
  function dash(ctx,points,alpha) {
    ctx.setLineDash([7,8]);stroke(ctx,points,1.6,F().route,alpha);ctx.setLineDash([]);
  }
  function forecast(ctx,points,alpha) {
    dash(ctx,points,alpha);
    var end=points[points.length-1], a=bearing(points,points.length-1);
    ctx.globalAlpha=alpha;ctx.fillStyle=F().route;ctx.beginPath();ctx.moveTo(end[0],end[1]);
    ctx.lineTo(end[0]-Math.cos(a-.51)*12,end[1]-Math.sin(a-.51)*12);
    ctx.lineTo(end[0]-Math.cos(a+.51)*12,end[1]-Math.sin(a+.51)*12);ctx.fill();ctx.globalAlpha=1;
  }
  var smokeAtlas=null;
  function smoke(ctx,x,y,w,h,pale,alpha) {
    if(!smokeAtlas) {
      var rng=U.makeRng(54037);
      smokeAtlas=['61,61,62','150,122,92','166,174,176','244,105,43'].map(function(rgb){
        var canvas=document.createElement('canvas');canvas.width=120;canvas.height=88;
        var c=canvas.getContext('2d');
        for(var i=0;i<13;i++){
          var x0=24+rng()*72, y0=22+rng()*44,r=11+rng()*12;
          var gr=c.createRadialGradient(x0-3,y0-3,0,x0,y0,r);
          gr.addColorStop(0,'rgba('+rgb+',.42)');gr.addColorStop(.49,'rgba('+rgb+',.17)');gr.addColorStop(1,'rgba('+rgb+',0)');
          c.fillStyle=gr;c.fillRect(x0-r,y0-r,r*2,r*2);
        }
        return canvas;
      });
    }
    ctx.globalAlpha=U.clamp(alpha,0,1);ctx.drawImage(smokeAtlas[pale],x-w/2,y-h/2,w,h);ctx.globalAlpha=1;
  }
  function plume(ctx,x,y,s,t,seed,level,color) {
    for(var i=8;i>=0;i--){
      var age=frac(t*(.43+.13*jitter(seed+i))+i*.128+seed*.023);
      var sway=Math.sin(age*5+t*.82+seed)*s*(.05+.22*age), wobble=.81+.35*jitter(seed+i+17);
      var lift=s*(age*1.07+age*age*.31);
      smoke(ctx,x+(age*.74-.11)*s+sway,y-lift,s*(.24+.77*age)*wobble,s*(.27+.47*age)*wobble,color,
        Math.sin(age*Math.PI)*level*(.49+.51*jitter(seed+i)));
    }
  }
  function faults(ctx,e,toScreen,z,t) {
    var f=e.field, phase=G.GroundDisaster.roughness(e,'quake'), progress=U.clamp(f.age/f.warning,.12,1);
    f.lines.forEach(function(line,j){
      var all=line.points.map(function(p){return toScreen(p[0],p[1]);});
      var world=G.GroundDisaster.span(line,0,line.length*progress), path=world.map(function(p){return toScreen(p[0],p[1]);});
      if(f.age<f.warning)dash(ctx,all,(1-progress)*.69);
      var width=f.width*z, nodes=sketch(path,Math.max(3,width*.23),width*(j===0?1:.75),f.seed%180+j,true);
      band(ctx,nodes,-1,1,'#a2805d',.17*phase);
      band(ctx,nodes,-.53,.43,'#665043',.68*phase);
      band(ctx,nodes,-.29,.30,'#292325',.84*phase);
      band(ctx,nodes,-.19,-.04,'#100f12',.89*phase);
      band(ctx,nodes,-.52,-.39,'#d5b08b',.63*phase);
      band(ctx,nodes,.21,.36,'#8f7660',.57*phase);
      for(var i=3;i<nodes.length-2;i+=3){
        var p=nodes[i], seed=f.seed%758+j*21+i, side=jitter(seed)>.45?1:-1;
        var start=aside(p,.27*side), fork=aside(p,side*(.47+.31*jitter(seed+9)));
        var end=[fork[0]+p.ny*width*.25,fork[1]-p.nx*width*.25];
        stroke(ctx,[start,fork,end],width*.061,'#42362d',.66*phase);
        if(i%2){
          var fly=frac(t*.83+i*.17+j*.29), size=width*(.76+fly);
          smoke(ctx,fork[0]+(jitter(i)-.30)*width*fly,fork[1]-fly*width*.91,size*1.5,size*.81,1,
            Math.sin(fly*Math.PI)*.21*phase*(.42+.58*(1-progress)));
        }
      }
    });
  }
  function boulder(ctx,x,y,r,rot,seed) {
    var pts=[];
    for(var i=0;i<7;i++){
      var a=rot+i*6.283/7,d=r*(.74+.26*jitter(seed+i));
      pts.push([x+Math.cos(a)*d,y+Math.sin(a)*d*.87]);
    }
    trace(ctx,pts);ctx.closePath();
    var gr=ctx.createLinearGradient(x-r*.58,y-r*.68,x+r*.38,y+r*.60);
    gr.addColorStop(0,'#cabca1');gr.addColorStop(.38,'#a1947d');gr.addColorStop(.64,'#70665a');gr.addColorStop(1,'#443d35');
    ctx.fillStyle=gr;ctx.fill();ctx.save();ctx.clip();
    var cos=Math.cos(rot),sin=Math.sin(rot);
    for(var j=0;j<7;j++){
      var u=(jitter(seed+j*2)-.5)*r*1.56,v=(jitter(seed+j*2+11)-.5)*r*1.32;
      var sx=x+u*cos-v*sin,sy=y+(u*sin+v*cos)*.9, size=r*(.11+jitter(seed+j*3)*.27);
      ctx.beginPath();ctx.moveTo(sx-size*cos,sy-size*sin);ctx.lineTo(sx-size*.40*sin,sy+size*.4*cos);
      ctx.lineTo(sx+size*1.12*cos,sy+size*sin);ctx.lineTo(sx+size*.26*sin,sy-size*.37*cos);
      ctx.fillStyle=j%3?'rgba(48,44,41,.24)':'rgba(219,204,175,.37)';ctx.fill();
      if(j%2===0&&r>5){
        stroke(ctx,[[sx-size*cos,sy-size*sin],[sx+size*.08*sin,sy-size*.13*cos],[sx+size*cos,sy+size*sin]],r*.052,'#d6c4a0',.54);
      }
    }
    ctx.restore();ctx.strokeStyle='rgba(54,43,32,.57)';ctx.lineWidth=Math.max(.65,r*.055);trace(ctx,pts);ctx.closePath();ctx.stroke();
  }
  function slide(ctx,e,toScreen,z,t) {
    var f=e.field, path=f.line.points.map(function(p){return toScreen(p[0],p[1]);});
    forecast(ctx,path,f.age<f.warning?.90:.42);
    var origin=path[0], rr=f.width*z;
    plume(ctx,origin[0],origin[1],rr*2.85,t,f.seed%79,.55,1);
    f.rocks.forEach(function(item,i){
      var at=G.GroundDisaster.rockAt(e,item,f.age);if(!at)return;
      var p=toScreen(at.x,at.y), r=Math.max(2.5,at.r*z), bounce=Math.abs(Math.sin(at.time*8+i*.69)), jump=Math.pow(bounce,1.6)*r*.83;
      smoke(ctx,p[0]+r*.22,p[1]+r*.33,r*(2.3+bounce*.55),r*(.90+bounce*.24),0,.51-bounce*.22);
      for(var j=3;j>=1;j--){
        var earlier=G.GroundDisaster.rockAt(e,item,f.age-j*.071);
        if(!earlier)continue;
        var q=toScreen(earlier.x,earlier.y), d=frac(t*.59+j*.28+i*.088);
        smoke(ctx,q[0]+(d-.46)*r,q[1]-j*r*.25,r*(2.24+j*.55+d),r*(1.3+j*.32),1,(1-d)*(.39-.074*j));
      }
      for(var k=0;k<3;k++){
        var f0=frac(t*(.9+k*.13)+k*.618+i*.17), size=r*(.068+jitter(i+k*11)*.11);
        var rx=p[0]+Math.cos(at.angle)*(f0-1)*r*2.1+(jitter(i+k)-.5)*r*f0;
        var ry=p[1]-Math.sin(at.angle)*(f0-1)*r*2.1-Math.sin(Math.PI*f0)*r*.45;
        stroke(ctx,[[rx-size,ry+size*.4],[rx+size,ry-size*.32]],size*.67,'#bbae98',.68*(1-f0));
      }
      boulder(ctx,p[0],p[1]-jump,r,item.angle+at.time*9,i+f.seed%1000);
    });
  }
  function water(ctx,e,toScreen,z,t) {
    var f=e.field, gd=G.GroundDisaster, fill=gd.roughness(e,'flood');
    var path=f.line.points.map(function(p){return toScreen(p[0],p[1]);});
    if(fill<=.03){dash(ctx,path,.83);return;}
    var width=Math.max(1,f.width*fill*z);
    var nodes=sketch(path,Math.max(4,width*.11),width,f.seed%360,false);
    if(nodes.length<2)return;
    // 둑에서 번진 젖은 흙과 옅은 흙탕물 사이로 잔물결이 하류로 흐른다.
    band(ctx,nodes,-1.07,1.08,F().wetSand,.25,.89);
    band(ctx,nodes,-1,1,F().sediment,.31,.88);
    band(ctx,nodes,-.91,.83,F().sediment,.31,.68);
    band(ctx,nodes,-.68,.64,'#56868a',.36,.58);
    band(ctx,nodes,-.42,.38,'#2d5b66',.46,.41);
    band(ctx,nodes,-.86,-.71,'#b3a585',.19,.46);
    band(ctx,nodes,.69,.87,'#a69a7e',.14,.44);
    for(var layer=0;layer<3;layer++){
      ctx.globalAlpha=[.18,.40,.67][layer];ctx.lineWidth=Math.max(.55,z*.00154)*(1+layer*.27);
      ctx.strokeStyle=layer===0?'#ccd0b6':F().waterFoam;ctx.beginPath();
      for(var i=0;i<36;i++){
        var seed=i+layer*31, lane=(jitter(seed)*2-1)*(layer===2?.96:.84);
        if(layer===2)lane=Math.sign(lane)*(.56+.43*Math.abs(lane));
        var v=frac(i*.618+t*(.14+layer*.029)+layer*.26), length=(.008+jitter(seed+55)*.033)*(1.1-Math.abs(lane)*.31);
        var a=currentAt(nodes,v,lane), b=currentAt(nodes,v+length*.49,lane+.035*Math.sin(t*4+i)), c=currentAt(nodes,v+length,lane*.97);
        if(v+length<1){ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(b[0],b[1],c[0],c[1]);}
      }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    for(var j=0;j<12;j++){
      var flow=frac(t*.11+j*.381), lane0=(jitter(j+53)-.5)*1.78, stick=currentAt(nodes,flow,lane0), length0=width*(.023+.058*jitter(j+191));
      stroke(ctx,[[stick[0]-length0,stick[1]+length0*.39],[stick[0]+length0,stick[1]-length0*.32]],Math.max(.7,length0*.29),'#5f5845',.52);
    }
  }
  function tongue(ctx,x,y,s,t,seed,intensity) {
    var pulse=t*(5.1+seed%5)+seed*.31, flare=.61*Math.sin(pulse)+.39*Math.cos(pulse*1.71);
    var h=s*(.81+.19*flare)*intensity, flow=(.18+.32*Math.cos(t*7+seed))*h;
    var grad=ctx.createLinearGradient(x,y-h,x,y);
    grad.addColorStop(0,'rgba(255,88,28,.04)');grad.addColorStop(.32,'rgba(224,56,20,.56)');
    grad.addColorStop(.66,'#fa7c33');grad.addColorStop(.93,F().ember);grad.addColorStop(1,'rgba(239,119,55,.64)');
    ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(x-h*.19,y);
    ctx.bezierCurveTo(x-h*.50,y-h*.25,x+flow*.47,y-h*.43,x+flow*.10,y-h*.64);
    ctx.quadraticCurveTo(x+flow*.90,y-h*.72,x+flow,y-h);
    ctx.bezierCurveTo(x+flow+h*.13,y-h*.62,x+h*.47,y-h*.34,x+h*.18,y);
    ctx.closePath();ctx.fill();
    var hot=h*(.26+.27*jitter(seed+2));
    ctx.beginPath();ctx.moveTo(x-hot*.22,y);
    ctx.quadraticCurveTo(x-hot*.48,y-hot*.52,x+flow*.34,y-hot);
    ctx.quadraticCurveTo(x+hot*.59,y-hot*.29,x+hot*.23,y);
    ctx.fillStyle='#ffe4a1';ctx.globalAlpha=.48+flare*.17;ctx.fill();ctx.globalAlpha=1;
  }
  function fire(ctx,e,toScreen,z,t) {
    var f=e.field, gd=G.GroundDisaster;
    f.cells.forEach(function(cell,i){
      var p=toScreen(cell.x,cell.y),r=cell.r*z, age=f.age-f.warning-cell.delay;
      if(age<0){
        ctx.setLineDash([4,6]);ctx.lineWidth=1;ctx.strokeStyle='rgba(255,189,108,.53)';
        ctx.beginPath();ctx.ellipse(p[0],p[1],r*.92,r*.74,0,.3,3.8);ctx.stroke();ctx.setLineDash([]);
        return;
      }
      var heat=gd.fireHeat(e,cell,f.age), recovery=U.clamp((f.life-f.age)/2.9,0,1);
      smoke(ctx,p[0]+r*.15,p[1],r*2.15,r*1.74,0,.82*recovery);
      if(heat>.03)smoke(ctx,p[0],p[1],r*2.28,r*1.23,3,.70*heat);
      for(var j=0;j<9&&heat>.03;j++){
        var a=j*2.39996+i, d=r*(.15+.54*jitter(j+i*5));
        tongue(ctx,p[0]+Math.cos(a)*d,p[1]+Math.sin(a)*d*.67,r*(.30+.73*jitter(j+i*3)),t,j+i*11,heat);
      }
      if(heat>.10)for(var e0=0;e0<6;e0++){
        var fly=frac(t*(.86+e0*.054)+e0*.618+i*.26), sx=p[0]+r*(fly*.91+jitter(e0+i)-.5),sy=p[1]-r*1.75*fly;
        ctx.globalAlpha=(1-fly)*heat*.77;ctx.fillStyle=F().ember;ctx.fillRect(sx,sy,1.6,1.1);ctx.globalAlpha=1;
      }
      plume(ctx,p[0],p[1]-r*.10,r*2.48,t,i+f.seed%27,recovery*(.38+.52*heat),0);
    });
  }
  function lava(ctx,e,toScreen,z,t) {
    var f=e.field, gd=G.GroundDisaster, length=gd.lavaDistance(e,f.age), width=f.width*z;
    var path=f.line.points.map(function(p){return toScreen(p[0],p[1]);}), p=path[0];
    var r=Math.max(5,width*.95);
    smoke(ctx,p[0],p[1],r*2.7,r*1.61,0,.81);
    var rim=[];
    for(var j=0;j<13;j++){
      var angle0=j*6.283/13, d0=r*(.68+.37*jitter(f.seed%1000+j));
      rim.push([p[0]+Math.cos(angle0)*d0,p[1]+Math.sin(angle0)*d0*.56]);
    }
    trace(ctx,rim);ctx.closePath();ctx.fillStyle='#3c2c2b';ctx.fill();
    ctx.strokeStyle='#827166';ctx.lineWidth=Math.max(1,r*.16);ctx.stroke();
    for(var k=0;k<rim.length;k+=2){
      var rock=rim[k];boulder(ctx,rock[0],rock[1]-r*.13,r*(.11+jitter(k+3)*.08),k*.52,k+f.seed%960);
    }
    if(length>.001){
      var hot=gd.span(f.line,0,length).map(function(p0){return toScreen(p0[0],p0[1]);});
      var nodes=sketch(hot,Math.max(3,width*.23),width,f.seed%360,true);
      band(ctx,nodes,-1.10,1.10,'#703827',.27,.24);
      band(ctx,nodes,-1,1,'#2d2524',.90,.26);
      band(ctx,nodes,-.81,.72,'#743625',.93,.23);
      band(ctx,nodes,-.60,.56,'#ad3f1d',.90,.23);
      band(ctx,nodes,-.39,.46,F().lava,.92,.22);
      band(ctx,nodes,-.13,.16,'#fb943b',.68,.15);
      for(var i=0;nodes.length>1&&i<32;i++){
        var v=frac(t*.37+i*.618), segment=(.012+jitter(i+5)*.041)*(.55+jitter(i+11)*.65);
        var lane=(jitter(i)-.5)*1.34, a=currentAt(nodes,v,lane),b=currentAt(nodes,v+segment,lane*.92);
        if(v+segment<1)stroke(ctx,[a,b],width*(.044+jitter(i+7)*.058),F().lavaHot,.35+jitter(i+19)*.48);
        if(i%3===0){
          var p0=currentAt(nodes,v+segment,Math.sign(lane)*(.62+jitter(i+8)*.26));
          var size=width*(.056+.132*jitter(i+71));
          ctx.fillStyle='rgba(59,36,27,.84)';ctx.beginPath();ctx.moveTo(p0[0]-size,p0[1]+size*.16);
          ctx.lineTo(p0[0]-.18*size,p0[1]-size*.63);ctx.lineTo(p0[0]+size*.93,p0[1]+size*.17);
          ctx.lineTo(p0[0]+size*.35,p0[1]+size*.46);ctx.fill();
        }
      }
      var front=hot[hot.length-1];
      plume(ctx,front[0],front[1],width*1.7,t,3,.36,2);
    }
    if(length<f.line.length-.015){
      var remains=gd.span(f.line,length,f.line.length).map(function(p0){return toScreen(p0[0],p0[1]);});
      forecast(ctx,remains,.71);
    }
    tongue(ctx,p[0]-r*.20,p[1]+r*.18,r*1.33,t,3,.86);
    tongue(ctx,p[0]+r*.32,p[1]+r*.11,r,t,8,.75);
    plume(ctx,p[0]+r*.12,p[1]-r*.34,r*4.62,t,18,.78,0);
  }
  A.draw = function (ctx,e,toScreen,zoom,t,ff) {
    var GD=G.GroundDisaster;
    if(!GD.open(e))return;
    var p=toScreen(e.lon,e.lat), extent=e.field.extent*zoom+160;
    if(p[0]+extent<0||p[0]-extent>1600||p[1]+extent<0||p[1]-extent>900)return;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    if(e.kind==='quake')faults(ctx,e,toScreen,zoom,t);
    else if(e.kind==='landslide')slide(ctx,e,toScreen,zoom,t);
    else if(e.kind==='flood')water(ctx,e,toScreen,zoom,t);
    else if(e.kind==='fire')fire(ctx,e,toScreen,zoom,t);
    else lava(ctx,e,toScreen,zoom,t);
    var label=GD.label(e), y=Math.max(100,p[1]-(e.kind==='fire'||e.kind==='volcano'?e.field.width*zoom*2.8:39));
    ctx.font='700 14px '+(ff||'serif');ctx.textAlign='center';
    var w=ctx.measureText(label).width+16;ctx.fillStyle='rgba(37,30,25,.83)';ctx.fillRect(p[0]-w/2,y-12,w,22);
    ctx.lineWidth=1;ctx.strokeStyle=F().route;ctx.strokeRect(p[0]-w/2,y-12,w,22);
    ctx.fillStyle=F().label;ctx.fillText(label,p[0],y+3);ctx.restore();
  };
})(window.G=window.G||{});
