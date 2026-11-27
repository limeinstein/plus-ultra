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
  function flowingStroke(ctx,points,width,color,alpha) {
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(var k=1;k<points.length-1;k++){
      var p=points[k], q=points[k+1];ctx.quadraticCurveTo(p[0],p[1],(p[0]+q[0])*.5,(p[1]+q[1])*.5);
    }
    var end=points[points.length-1];ctx.lineTo(end[0],end[1]);
    ctx.lineWidth=width;ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.stroke();ctx.globalAlpha=1;
  }
  function bearing(points,i) {
    var a=points[Math.max(0,i-1)], b=points[Math.min(points.length-1,i+1)];
    return Math.atan2(b[1]-a[1],b[0]-a[0]);
  }
  function strip(ctx,points,width,seed,color,alpha) {
    ctx.beginPath();
    for(var side=0;side<2;side++)for(var k=0;k<points.length;k++){
      var i=side?points.length-1-k:k, p=points[i], a=bearing(points,i)+(side?-1:1)*Math.PI/2;
      var w=width*(.91+.18*jitter(seed+i+side*.37));
      if(i===0||i===points.length-1)w*=.40;
      var x=p[0]+Math.cos(a)*w,y=p[1]+Math.sin(a)*w;
      if(side||k)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.fill();ctx.globalAlpha=1;
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
      smokeAtlas=['61,61,62','150,122,92','166,174,176'].map(function(rgb){
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
      var age=frac(t*.56+i*.128+seed*.023), sway=Math.sin(age*4+t*.88+seed)*s*.21;
      smoke(ctx,x+(age*.70-.13)*s+sway,y-age*s*1.22,s*(.29+.69*age),s*(.34+.32*age),color,
        Math.sin(age*Math.PI)*level*(.58+.42*jitter(seed+i)));
    }
  }
  function faults(ctx,e,toScreen,z,t) {
    var f=e.field, phase=G.GroundDisaster.roughness(e,'quake'), progress=U.clamp(f.age/f.warning,.12,1);
    f.lines.forEach(function(line,j){
      var all=line.points.map(function(p){return toScreen(p[0],p[1]);});
      var world=G.GroundDisaster.span(line,0,line.length*progress), path=world.map(function(p){return toScreen(p[0],p[1]);});
      if(f.age<f.warning)dash(ctx,all,(1-progress)*.69);
      var width=f.width*z;
      strip(ctx,path,width,f.seed+j,'#b18c67',.17*phase);
      strip(ctx,path,width*.41,f.seed+j+5,'#503933',.60*phase);
      var lip=path.map(function(p,i){return [p[0],p[1]-width*(.11+.12*jitter(i+j*6))];});
      stroke(ctx,lip,width*.13,'#d6af86',.72*phase);
      stroke(ctx,path,width*.23,'#211b1b',.88*phase);
      for(var i=1;i<path.length-1;i+=2){
        var p=path[i], fly=frac(t*.8+i*.17+j*.29);
        smoke(ctx,p[0]+(jitter(i)-.30)*width*fly,p[1]-fly*width*1.10,width*(1+fly*1.6),width*(.74+fly),1,
          Math.sin(fly*Math.PI)*.32*phase*(.42+.58*(1-progress)));
      }
    });
  }
  function boulder(ctx,x,y,r,rot,seed) {
    var pts=[];
    for(var i=0;i<7;i++){
      var a=rot+i*6.283/7,d=r*(.74+.26*jitter(seed+i));
      pts.push([x+Math.cos(a)*d,y+Math.sin(a)*d*.87]);
    }
    trace(ctx,pts);ctx.closePath();ctx.fillStyle='#57534c';ctx.fill();
    var cols=['#a89a82','#d1bea0','#887d6a','#655d4d','#443d33','#494339','#7f7160'];
    for(var j=0;j<7;j++){
      var p=pts[j], q=pts[(j+1)%7], light=Math.floor((j+rot*.46+70)%7);
      ctx.beginPath();ctx.moveTo(x-r*.14,y-r*.21);ctx.lineTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.closePath();ctx.fillStyle=cols[light];ctx.fill();
    }
    ctx.strokeStyle='rgba(55,45,35,.5)';ctx.lineWidth=1;trace(ctx,pts);ctx.closePath();ctx.stroke();
  }
  function slide(ctx,e,toScreen,z,t) {
    var f=e.field, path=f.line.points.map(function(p){return toScreen(p[0],p[1]);});
    forecast(ctx,path,f.age<f.warning?.90:.42);
    var origin=path[0], rr=f.width*z;
    plume(ctx,origin[0],origin[1],rr*2.85,t,f.seed%79,.55,1);
    f.rocks.forEach(function(item,i){
      var at=G.GroundDisaster.rockAt(e,item,f.age);if(!at)return;
      var p=toScreen(at.x,at.y), r=Math.max(2.5,at.r*z), jump=Math.pow(Math.abs(Math.sin(at.time*8+i*.69)),1.6)*r*.83;
      smoke(ctx,p[0],p[1]+r*.20,r*2.35,r*.91,0,.38);
      smoke(ctx,p[0]-Math.cos(at.angle)*r*1.2,p[1]+Math.sin(at.angle)*r*1.2,r*3.35,r*1.68,1,.56);
      boulder(ctx,p[0],p[1]-jump,r,item.angle+at.time*9,i+f.seed%1000);
    });
  }
  function water(ctx,e,toScreen,z,t) {
    var f=e.field, gd=G.GroundDisaster, fill=gd.roughness(e,'flood');
    var path=f.line.points.map(function(p){return toScreen(p[0],p[1]);});
    if(fill<=.03){dash(ctx,path,.83);return;}
    var width=Math.max(1,f.width*fill*z);
    // 가장 바깥은 흙이 젖은 색부터 시작하고 물빛은 강 가운데로 갈수록 깊어진다.
    flowingStroke(ctx,path,width*2.2,F().wetSand,.19);
    flowingStroke(ctx,path,width*2.03,F().sediment,.21);
    flowingStroke(ctx,path,width*1.87,F().sediment,.32);
    flowingStroke(ctx,path,width*1.62,F().sediment,.38);
    flowingStroke(ctx,path,width*1.10,'#3f6f76',.52);
    ctx.globalAlpha=.52;ctx.lineWidth=Math.max(.75,z*.0022);ctx.strokeStyle=F().waterFoam;ctx.beginPath();
    for(var i=0;i<74;i++){
      var shift=frac(i*.618+t*(.115+i%3*.037)), d=shift*f.line.length, bank=(jitter(i)*2-1)*width*.95;
      var a=toScreen.apply(null,gd.pointAt(f.line,d));
      var b=toScreen.apply(null,gd.pointAt(f.line,d+.024+jitter(i+55)*.033));
      var turn=Math.atan2(b[1]-a[1],b[0]-a[0])+Math.PI/2;
      var x=Math.cos(turn)*bank,y=Math.sin(turn)*bank;
      ctx.moveTo(a[0]+x,a[1]+y);ctx.quadraticCurveTo((a[0]+b[0])/2+x*1.13,(a[1]+b[1])/2+y*1.13,b[0]+x,b[1]+y);
    }
    ctx.stroke();ctx.globalAlpha=1;
  }
  function tongue(ctx,x,y,s,t,seed,intensity) {
    var flare=Math.sin(t*(5+seed%7)+seed*.31), flow=Math.cos(t*7+seed)*s*.36,h=s*(.73+.27*flare)*intensity;
    var grad=ctx.createLinearGradient(x,y-h,x,y);
    grad.addColorStop(0,'rgba(255,102,39,0)');grad.addColorStop(.35,'rgba(245,79,27,.66)');
    grad.addColorStop(.69,F().ember);grad.addColorStop(.94,'#ffe4a0');grad.addColorStop(1,'rgba(244,137,63,.59)');
    ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(x-h*.17,y);
    ctx.bezierCurveTo(x-h*.41,y-h*.36,x+flow*.22,y-h*.67,x+flow,y-h);
    ctx.bezierCurveTo(x+flow-h*.14,y-h*.51,x+h*.43,y-h*.28,x+h*.17,y);
    ctx.closePath();ctx.fill();
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
      for(var j=0;j<7&&heat>.03;j++){
        var a=j*2.39996+i, d=r*(.15+.54*jitter(j+i*5));
        tongue(ctx,p[0]+Math.cos(a)*d,p[1]+Math.sin(a)*d*.67,r*(.47+.53*jitter(j+i*3)),t,j+i*11,heat);
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
      strip(ctx,hot,width,f.seed,'#271f20',.9);
      strip(ctx,hot,width*.74,f.seed+7,'#722f23',.89);
      stroke(ctx,hot,width*.83,F().lava,.86);
      for(var i=0;i<27;i++){
        var at=frac(t*.34+i*.618)*length, d=Math.min(length,at+.014+jitter(i+5)*.035);
        var a=toScreen.apply(null,gd.pointAt(f.line,at)),b=toScreen.apply(null,gd.pointAt(f.line,d));
        var angle=Math.atan2(b[1]-a[1],b[0]-a[0])+Math.PI/2, side=(jitter(i)-.5)*width*.68;
        var x=Math.cos(angle)*side,y=Math.sin(angle)*side;
        stroke(ctx,[[a[0]+x,a[1]+y],[b[0]+x,b[1]+y]],width*.071,F().lavaHot,.51+jitter(i+7)*.36);
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
