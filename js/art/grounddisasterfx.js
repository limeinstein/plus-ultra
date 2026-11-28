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
  var dustAtlas={};
  function dustNoise(grid,x,y) {
    var i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,k=j*40+i;
    u=u*u*(3-2*u);v=v*v*(3-2*v);
    return U.lerp(U.lerp(grid[k],grid[k+1],u),U.lerp(grid[k+40],grid[k+41],u),v);
  }
  // 모래·흙 색을 입힌 불규칙한 먼지 결을 필요할 때 한 번 만들어 쓴다.
  function dustStamp(tone,variant) {
    var key=tone+variant;
    if(dustAtlas[key])return dustAtlas[key];
    var ash=tone==='ash', rgb=ash?F().volcano.ash:F().quake.dust[tone], rng=U.makeRng(61453+variant*417);
    var grid=Float32Array.from({length:40*26},rng);
    var canvas=document.createElement('canvas');canvas.width=108;canvas.height=60;
    var ctx=canvas.getContext('2d'), stamp=ctx.createImageData(canvas.width,canvas.height);
    for(var j=0;j<canvas.height;j++){
      for(var i=0;i<canvas.width;i++){
        var x=i/(canvas.width-1), y=j/(canvas.height-1);
        var rough=dustNoise(grid,x*9,y*6), medium=dustNoise(grid,x*17+11,y*10+8);
        var fine=dustNoise(grid,x*32+4,y*21+2), grain=.52*rough+.31*medium+.17*fine;
        var curl=2*y-1-.19*Math.sin(x*8+variant)-.22*(.5-rough);
        var core=Math.exp(-Math.pow((x-.40)/.25,2)-Math.pow((curl-.15)/.47,2));
        var tail=.64*Math.exp(-Math.pow((x-.69)/.23,2)-Math.pow((curl+.16)/.36,2));
        var edge=U.smooth(0,.13,x)*U.smooth(0,.13,1-x)*U.smooth(0,.16,y)*U.smooth(0,.16,1-y);
        var alpha=U.clamp((core+tail-.14)*(ash?1.72:1.2),0,1)*U.smooth(ash?.14:.25,ash?.65:.78,grain)*edge;
        var shade=ash?25*grain-9*y:11+38*grain-21*y,k=(j*canvas.width+i)*4;
        stamp.data[k]=rgb[0]+shade;stamp.data[k+1]=rgb[1]+shade;
        stamp.data[k+2]=rgb[2]+shade*.85;stamp.data[k+3]=235*alpha;
      }
    }
    ctx.putImageData(stamp,0,0);dustAtlas[key]=canvas;
    return canvas;
  }
  A.dustTone=function(terrain){
    if(terrain==='desert'||terrain==='steppe'||terrain==='savanna')return 'sand';
    if(terrain==='mountain')return 'stone';
    if(terrain==='snow'||terrain==='ice'||terrain==='tundra')return 'frost';
    return 'soil';
  };
  A.drawDust=function(ctx,at,size,age,angle,seed,tone,opacity){
    if(age<=0||age>=1||opacity<=0)return;
    var c=F().quake.dust, spread=Math.pow(age,.65), cos=Math.cos(angle),sin=Math.sin(angle);
    var drift=size*c.drift*spread, rise=size*c.rise*(1-Math.exp(-3.1*age));
    var width=size*(.39+1.25*spread),height=size*(.20+.57*spread);
    var density=U.smooth(0,.18,age)*(1-U.smooth(.26,1,age));
    var x=at[0]+cos*drift,y=at[1]+sin*drift*.31-rise;
    if(x+width<0||x-width>1600||y+height<0||y-height>900)return;
    ctx.save();ctx.translate(x,y);ctx.rotate(sin*.32);ctx.scale(cos<0?-1:1,1);
    ctx.globalAlpha=U.clamp(opacity*c.opacity*density,0,1);
    ctx.drawImage(dustStamp(tone,Math.floor(jitter(seed)*4)),-width*.37,-height*.55,width,height);
    ctx.restore();
  };
  function between(a,b,k) { return [U.lerp(a[0],b[0],k),U.lerp(a[1],b[1],k)]; }
  function faultStrip(ctx,a,b,color,alpha) {
    trace(ctx,a.concat(b.slice().reverse()));ctx.closePath();
    if(color){ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.fill();ctx.globalAlpha=1;}
  }
  function faultPlate(nodes,side,width,shift,strike,seed,raised,c) {
    var lip=[], original=[], shoulder=[], tail=nodes[nodes.length-1].along;
    var slide=width*c.slip*shift*(raised?1:-.58);
    var rise=width*shift*(raised?-c.lift:c.sink);
    for(var i=0;i<nodes.length;i++){
      var p=nodes[i], end=Math.pow(Math.max(0,Math.sin(Math.PI*p.along/tail)),.48);
      var broken=.072+.064*jitter(seed+i*3), src=aside(p,side*broken);
      var edge=aside(p,side*(broken+c.opening*shift*end*(.65+.67*jitter(seed+i))));
      var segment=end*(.87+.13*Math.sin(p.along/width+seed));
      lip.push([edge[0]+slide*strike[0]*segment,edge[1]+(rise+slide*strike[1])*segment]);
      original.push(src);shoulder.push(aside(p,side*c.shoulder));
    }
    return {lip:lip,original:original,shoulder:shoulder};
  }
  // 보이는 지형 일부를 한 번만 복사한다. 갈라진 땅도 원래 자리의 색과 무늬를 사용한다.
  var faultCanvas, faultContext;
  function faultTexture(ctx,plates) {
    var canvases=G.Game&&G.Game.renderer&&G.Game.canvases(), world=canvases&&canvases.world;
    if(!world||ctx.canvas!==canvases.overlay)return null;
    var minX=1600,minY=900,maxX=0,maxY=0;
    plates.forEach(function(p){
      p.shoulder.concat(p.original).forEach(function(v){
        minX=Math.min(minX,v[0]);minY=Math.min(minY,v[1]);maxX=Math.max(maxX,v[0]);maxY=Math.max(maxY,v[1]);
      });
    });
    var kx=world.width/1600,ky=world.height/900;
    var x=Math.max(0,Math.floor((minX-4)*kx)), y=Math.max(0,Math.floor((minY-4)*ky));
    var w=Math.min(world.width,Math.ceil((maxX+4)*kx))-x, h=Math.min(world.height,Math.ceil((maxY+4)*ky))-y;
    if(w<1||h<1)return null;
    if(!faultCanvas){faultCanvas=document.createElement('canvas');faultContext=faultCanvas.getContext('2d');}
    // 화면이 흔들려 복사 영역이 달라져도 매 프레임 캔버스를 재할당하지 않는다.
    if(faultCanvas.width<w||faultCanvas.height<h){
      faultCanvas.width=Math.ceil(w/96)*96;faultCanvas.height=Math.ceil(h/96)*96;
    }
    faultContext.globalCompositeOperation='copy';
    faultContext.drawImage(world,x,y,w,h,0,0,w,h);
    return {canvas:faultCanvas,x:x/kx,y:y/ky,w:w,h:h,kx:kx,ky:ky};
  }
  function faultTriangle(ctx,tex,a,b,c,d,e,f) {
    var sx=b[0]-a[0],sy=b[1]-a[1],tx=c[0]-a[0],ty=c[1]-a[1], det=sx*ty-sy*tx;
    if(Math.abs(det)<.01)return;
    var dx=e[0]-d[0],dy=e[1]-d[1],ux=f[0]-d[0],uy=f[1]-d[1];
    var m=(dx*ty-ux*sy)/det,n=(dy*ty-uy*sy)/det,q=(ux*sx-dx*tx)/det,r=(uy*sx-dy*tx)/det;
    ctx.save();trace(ctx,[d,e,f]);ctx.closePath();ctx.clip();
    ctx.transform(m,n,q,r,d[0]-m*a[0]-q*a[1],d[1]-n*a[0]-r*a[1]);
    ctx.drawImage(tex.canvas,0,0,tex.w,tex.h,tex.x,tex.y,tex.w/tex.kx,tex.h/tex.ky);
    ctx.restore();
  }
  function paintFaultPlate(ctx,tex,plate) {
    var a=plate.original,b=plate.shoulder,d=plate.lip;
    for(var i=1;i<a.length;i++){
      faultTriangle(ctx,tex,a[i-1],b[i-1],b[i],d[i-1],b[i-1],b[i]);
      faultTriangle(ctx,tex,a[i-1],b[i],a[i],d[i-1],b[i],d[i]);
    }
  }
  function fracturedEdge(ctx,plate,width,seed,phase) {
    for(var i=2;i<plate.lip.length-1;i+=2){
      var key=seed+i*23, p=plate.lip[i], edge=plate.shoulder[i];
      if(jitter(key+5)<.3)continue;
      var a=between(p,edge,.1+jitter(key)*.15);
      var b=between(plate.lip[i-1],edge,.23+jitter(key+2)*.19);
      stroke(ctx,[p,a,b],width*.053,'#58442f',phase*(.28+.3*jitter(key+3)));
      if(i%4===0)stroke(ctx,[a,between(a,plate.shoulder[i+1],.24)],width*.021,'#745838',phase*.34);
    }
  }
  function faultSoil(ctx,high,low,nodes,width,f,seed,count,phase) {
    for(var i=0;i<count;i++){
      var key=seed+i*17, index=1+Math.floor(jitter(key)*(nodes.length-2));
      var at=nodes[index].along/nodes[nodes.length-1].along;
      var duration=.36+.46*jitter(key+8);
      var start=f.warning*(.41+at*.59)+.78*jitter(key+1);
      var repeat=.95+1.35*jitter(key+3), elapsed=f.age-start;
      if(elapsed<0)continue;
      var cycle=Math.floor(elapsed/repeat), u=(elapsed-cycle*repeat)/duration;
      if(u>1||cycle>1&&jitter(key+cycle)>.38)continue;
      var edge=jitter(key+11)>.24?high:low, other=edge===high?low:high;
      var offset=jitter(key+6), a=between(edge[index-1],edge[index],offset);
      var b=between(other[index-1],other[index],offset);
      var fall=u*u, drift=U.lerp(.10,.77,fall), p=between(a,b,drift);
      var clod=i%7===0, grain=clod?.095+.066*jitter(key+7):.023+.078*Math.pow(jitter(key+7),2.4);
      var radius=width*grain*(1-.50*fall);
      var sideways=(jitter(key+4)-.5)*width*u*.28;
      p[0]+=sideways;p[1]+=(edge===high?.34:.61)*width*fall;
      var light=(1-U.smooth(.65,1,u))*phase*(cycle===0?1:.78);
      if(clod){
        var wake=between(a,p,.7);
        stroke(ctx,[wake,p],width*.056,'#e0ba8b',light*.43*u);
        smoke(ctx,wake[0],wake[1],width*(.22+u*.42),width*(.17+u*.43),1,
          light*.37*Math.sin(Math.PI*u));
      }
      var rot=key+u*6,right=Math.cos(rot)*radius,up=Math.sin(rot)*radius;
      ctx.globalAlpha=light;ctx.fillStyle=clod?'#e2c69e':'#c4a17a';
      trace(ctx,[[p[0]-right,p[1]-up],[p[0]+up*.36,p[1]-right*.8],
        [p[0]+right,p[1]+up],[p[0]-up*.76,p[1]+right*.81]]);ctx.closePath();ctx.fill();
      ctx.fillStyle='#664634';
      trace(ctx,[p,[p[0]+right,p[1]+up],[p[0]-up*.76,p[1]+right*.81]]);ctx.closePath();ctx.fill();
      ctx.globalAlpha=1;
    }
  }
  function faultGrit(ctx,high,low,width,seed,phase) {
    for(var shade=0;shade<2;shade++){
      ctx.beginPath();
      for(var i=1;i<high.length;i++){
        for(var j=0;j<11;j++){
          var k=seed+i*79+j*3+shade*19, along=jitter(k), depth=.035+.79*jitter(k+1);
          var p=between(between(high[i-1],high[i],along),between(low[i-1],low[i],along),depth);
          var r=width*(.022+.043*jitter(k+2))*(1-depth*.63);
          ctx.moveTo(p[0]-r,p[1]);ctx.lineTo(p[0]+r*.75,p[1]-r*.4);
          ctx.lineTo(p[0]+r*.49,p[1]+r*.43);ctx.closePath();
        }
      }
      ctx.fillStyle=shade?'#d0aa7c':'#35251e';ctx.globalAlpha=phase*.32;ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  function faultWalls(ctx,high,low,nodes,width,f,seed,c,phase) {
    // 층마다 높이가 달라지고 윗단에서 떨어지는 흙은 갈라진 틈 안에서만 보인다.
    var shelves=[.14,.31,.57,.79].map(function(fraction,i){
      return high.map(function(p,j){
        var noise=.047*Math.sin(nodes[j].along/width+i)+.12*(jitter(seed+j*5+i)-.5);
        return between(p,low[j],fraction+noise);
      });
    });
    faultStrip(ctx,high,low,'#201917',phase);
    faultStrip(ctx,high,shelves[3],'#483026',phase);
    faultStrip(ctx,high,shelves[2],'#6c4832',phase);
    faultStrip(ctx,high,shelves[1],'#8b6548',phase);
    faultStrip(ctx,high,shelves[0],'#a48459',phase);
    ctx.save();faultStrip(ctx,high,low);ctx.clip();
    for(var i=1;i<nodes.length;i++){
      var k=seed+i*9, p=high[i], foot=shelves[2][i];
      var depth=between(shelves[1][i-1],foot,.58), end=shelves[3][i];
      faultStrip(ctx,[p,depth],[foot,end],i%3?'#37281f':'#c19e74',phase*(.12+.32*jitter(k)));
      if(i%2)stroke(ctx,[p,depth,end],width*.036,'#38271e',phase*.55);
    }
    faultGrit(ctx,high,low,width,seed,phase);
    stroke(ctx,low,width*.13,'#504233',phase*.87);
    faultSoil(ctx,high,low,nodes,width,f,seed,Math.min(c.grains,nodes.length*3),phase);
    ctx.restore();
    stroke(ctx,high,width*.062,'#d5b486',phase*.72);
    stroke(ctx,low,width*.045,'#a58d67',phase*.65);
  }
  function faultDust(ctx,line,f,tone,phase,c) {
    if(f.age<f.warning)return;
    var nodes=line.nodes, last=nodes.length-1;
    var count=U.clamp(Math.ceil(nodes[last].along/c.spacing),2,c.limit);
    for(var i=0;i<count;i++){
      var seed=line.seed+i*137, along=(i+.18+.64*jitter(seed))/count;
      var point=Math.min(last-1,Math.floor(along*last)), near=jitter(seed+5)>.36?line.high:line.low;
      var from=between(near.lip[point],near.lip[point+1],jitter(seed+9));
      var at=between(from,near.shoulder[point],jitter(seed+4)*.27);
      var outward=near.shoulder[point][0]-from[0], angle=outward<0?Math.PI:0;
      angle+=(jitter(seed+3)-.55)*.92;
      var elapsed=f.age-f.warning-.44*along-.62*jitter(seed+7);
      var gap=1.22+.93*jitter(seed+11), life=.81+.78*jitter(seed+12);
      var burst=Math.floor(elapsed/gap), age=(elapsed-burst*gap)/life;
      if(burst<0||burst>1&&jitter(seed+burst)>.48)continue;
      var size=line.width*(1.6+1.5*jitter(seed+21)), strength=phase*(burst===0?1:.70);
      A.drawDust(ctx,at,size,age,angle,seed+burst,tone,strength);
      A.drawDust(ctx,at,size*.62,age-.15,angle-.48,seed+16+burst,tone,strength*.54);
    }
  }
  function faults(ctx,e,toScreen,z) {
    var f=e.field, c=F().quake, gd=G.GroundDisaster, phase=gd.roughness(e,'quake');
    var progress=U.clamp(f.age/f.warning,.04,1);
    var opening=U.smooth(f.warning*.33,f.warning+.57,f.age);
    var remaining=U.smooth(0,1.3,f.life-f.age);
    var jolt=Math.sin(f.age*19)*.064*U.smooth(f.warning*.63,f.warning,f.age);
    var shift=Math.max(0,opening+jolt)*remaining, visibleFaults=[], plates=[], top=Infinity;
    f.lines.forEach(function(line,j){
      var all=line.points.map(function(p){return toScreen(p[0],p[1]);});
      all.forEach(function(p){ if(p[0]>=32&&p[0]<=1568)top=Math.min(top,p[1]); });
      var path=progress===1?all:gd.span(line,0,line.length*progress).map(function(p){return toScreen(p[0],p[1]);});
      if(f.age<f.warning)dash(ctx,all,(1-progress)*.53);
      if(path.length<2)return;
      var width=Math.min(c.maxWidth,f.width*z)*(j===0?1:.53), seed=f.seed%327+j*73;
      var start=path[0],end=path[path.length-1],dx=end[0]-start[0],dy=end[1]-start[1];
      var length=Math.hypot(dx,dy)||1,sign=jitter(seed)<.5?-1:1;
      var spacing=Math.max(6,width*.56,line.length*z/c.samples);
      var nodes=sketch(path,spacing,width,seed,true);
      if(nodes.length<3){
        stroke(ctx,path,width*.13,'#453629',phase);
        return;
      }
      var side=dx<0?1:-1, strike=[dx/length*sign,dy/length*sign];
      var high=faultPlate(nodes,side,width,shift,strike,seed,true,c);
      var low=faultPlate(nodes,-side,width,shift,strike,seed+19,false,c);
      plates.push(high,low);visibleFaults.push({high:high,low:low,nodes:nodes,width:width,seed:seed});
    });
    var tex=shift>.04&&plates.length?faultTexture(ctx,plates):null;
    // 먼저 지표를 옮기고, 서로 만나는 균열의 안쪽은 나중에 그린다.
    if(tex)plates.forEach(function(plate){paintFaultPlate(ctx,tex,plate);});
    visibleFaults.forEach(function(a){
      fracturedEdge(ctx,a.high,a.width,a.seed,phase);
      fracturedEdge(ctx,a.low,a.width,a.seed+20,phase);
      faultWalls(ctx,a.high.lip,a.low.lip,a.nodes,a.width,f,a.seed,c,phase);
    });
    var tone=A.dustTone(G.Geo.terrain(e.lon,e.lat));
    visibleFaults.forEach(function(a){faultDust(ctx,a,f,tone,phase,c.dust);});
    return top-Math.min(c.maxWidth,f.width*z)*(c.lift+1);
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
  function ashColumn(ctx,p,r,age,seed,strength,c) {
    var reach=U.lerp(.24,1,U.smooth(0,1.8,age)), drift=jitter(seed)>.5?1:-1;
    for(var i=c.ashLayers-1;i>=0;i--){
      var key=seed+i*37, u=frac(age*(.54+.12*jitter(key+2))+i/c.ashLayers);
      var rise=r*c.ventHeight*reach*Math.pow(u,.81);
      var sway=r*(.19+.83*u)*Math.sin(u*8+key*.23+age*.94);
      var x=p[0]+sway*.33+drift*r*u*u*.94;
      var y=p[1]-rise, w=r*(.39+2.15*u)*(.74+.29*jitter(key+3)),h=w*(.68+.46*jitter(key+8));
      ctx.save();ctx.translate(x,y);ctx.rotate((jitter(key+8)-.5)*1.39+age*.17);
      ctx.globalAlpha=U.smooth(0,.13,u)*(1-U.smooth(.68,1,u))*strength*.86;
      ctx.drawImage(dustStamp('ash',i%4),-w*.55,-h*.57,w,h);
      ctx.restore();
    }
  }
  var ashSheets=[];
  function ashSheet(index){
    if(ashSheets[index])return ashSheets[index];
    var rng=U.makeRng(77429+index*2497),grid=Float32Array.from({length:40*26},rng);
    var canvas=document.createElement('canvas');canvas.width=224;canvas.height=132;
    var ctx=canvas.getContext('2d'),pixels=ctx.createImageData(canvas.width,canvas.height), colors=F().volcano.ash;
    for(var i=0;i<canvas.height;i++){
      for(var j=0;j<canvas.width;j++){
        var x=j/(canvas.width-1),y=i/(canvas.height-1);
        var coarse=dustNoise(grid,x*6,y*6), fold=dustNoise(grid,x*11+9,y*10+7);
        var strands=dustNoise(grid,x*34+1,y*21+2), density=.51*coarse+.36*fold+.13*strands;
        var left=U.smooth(0,.24,x)*U.smooth(0,.24,1-x);
        var billow=.065*Math.sin(x*23+index)+.16*(coarse-.5);
        var top=U.smooth(0,.28,y+billow),bottom=U.smooth(0,.35,1-y-billow);
        var ash=U.smooth(.15,.83,density), shade=23*(1-ash)+9*strands;
        var k=(i*canvas.width+j)*4;
        for(var ch=0;ch<3;ch++)pixels.data[k+ch]=colors[ch]+shade;
        pixels.data[k+3]=(56+196*ash)*left*top*bottom;
      }
    }
    ctx.putImageData(pixels,0,0);ashSheets[index]=canvas;
    return canvas;
  }
  A.ashDensity=function(e){
    var f=e.field,c=F().volcano.front,age=f.age-f.warning;
    return U.smooth(c.start,c.full,age)*(1-U.smooth(c.clear,f.life-f.warning,age));
  };
  A.drawAshFront=function(ctx,e,p,visibility,wind){
    var c=F().volcano.front,f=e.field,age=f.age-f.warning;
    var fullness=U.smooth(c.start,c.full,age), opacity=A.ashDensity(e)*visibility*c.opacity;
    if(opacity<=.005)return;
    var rise=Math.pow(fullness,.62), span=Math.pow(fullness,1.42);
    var w=U.lerp(180,3550+Math.abs(p[0]-800),span), h=U.lerp(165,2050,rise);
    var windX=Math.cos(wind), windY=Math.sin(wind);
    ctx.save();
    for(var i=0;i<3;i++){
      var layer=i/2, width=w*(.81+layer*.27), height=h*(.61+layer*.38);
      var drift=age*(9+layer*13)*windX, lift=age*(12+layer*6);
      var x=U.lerp(p[0],800,rise*.63)+drift+(layer-.5)*width*.19;
      var low=U.lerp(p[1]+64,1170,span)-lift+age*9*windY;
      ctx.globalAlpha=opacity*(.61+.29*layer);
      ctx.drawImage(ashSheet((i+f.seed%3)%3),x-width*.5,low-height,width,height);
    }
    ctx.restore();
  };
  function jetPoint(p,v,lift,u) {
    return [p[0]+v[0]*u,p[1]+v[1]*u-4*lift*u*(1-u)];
  }
  function flyingLava(ctx,p,r,age,seed,heat,c) {
    for(var i=0;i<c.projectiles;i++){
      var k=seed+i*23, phase=c.bursts[i%c.bursts.length]+jitter(k+5)*.34;
      var elapsed=age-phase, cycle=Math.floor(elapsed/2.48);
      if(cycle<0)continue;
      var life=.74+1.34*jitter(k+4),u=(elapsed-cycle*2.48)/life;
      if(u>=1)continue;
      var a=jitter(k+1)*2*Math.PI+cycle*.79, reach=r*(.47+3.38*Math.pow(jitter(k+2),1.55));
      var v=[Math.cos(a)*reach,Math.sin(a)*reach*.53], lift=r*(.26+1.71*Math.pow(jitter(k+3),.68));
      var head=jetPoint(p,v,lift,u), path=[], tail=.10+.15*jitter(k+9);
      for(var j=4;j>=0;j--)path.push(jetPoint(p,v,lift,Math.max(0,u-tail*j/4)));
      var flare=heat*(.77+.23*jitter(k))*(1-U.smooth(.81,1,u)), w=r*(.012+.033*jitter(k+12));
      stroke(ctx,path,w*3.4,'#e34a1b',flare*.28);
      stroke(ctx,path,w,'#ff912b',flare*.86);
      stroke(ctx,path.slice(-2),Math.max(.65,w*.53),'#ffea9e',flare*.97);
      if(i%3===0){
        var end=path[3], length=Math.hypot(head[0]-end[0],head[1]-end[1])||1;
        var tx=(head[0]-end[0])/length,ty=(head[1]-end[1])/length;
        ctx.globalAlpha=flare;ctx.fillStyle=u<.61?'#fff1ae':'#fda553';
        trace(ctx,[[head[0]+tx*w*1.7,head[1]+ty*w*1.7],[head[0]-ty*w,head[1]+tx*w],
          [head[0]-tx*w*1.4,head[1]-ty*w*1.4],[head[0]+ty*w*.73,head[1]-tx*w*.73]]);
        ctx.closePath();ctx.fill();ctx.globalAlpha=1;
      }
    }
  }
  function ventFire(ctx,p,r,age,seed,heat){
    var glow=ctx.createLinearGradient(p[0],p[1]+r*.21,p[0],p[1]-r*1.39);
    glow.addColorStop(0,'#ffed94');glow.addColorStop(.27,'#ffb738');
    glow.addColorStop(.59,'rgba(241,77,20,.49)');glow.addColorStop(1,'rgba(241,54,16,0)');
    var points=[[p[0]-r*.18,p[1]+r*.046]], gust=Math.pow(Math.max(0,Math.sin(age*8.1)),2);
    for(var i=0;i<13;i++){
      var x=(i/12-.5)*r*.47, flicker=.52+.48*Math.sin(age*(7+i*.29)+i*71+seed);
      var y=r*(.11+(.37+gust*.52)*jitter(seed+i*7)+flicker*.42);
      points.push([p[0]+x+r*.11*flicker,p[1]-y]);
    }
    points.push([p[0]+r*.16,p[1]+r*.071]);
    trace(ctx,points);ctx.closePath();ctx.fillStyle=glow;ctx.globalAlpha=heat;ctx.fill();ctx.globalAlpha=1;
    for(var f=0;f<6;f++){
      var flick=frac(age*(3.2+f*.37)+jitter(seed+f*3));
      var spray=r*(.21+.53*jitter(seed+f+6))*Math.sin(flick*Math.PI), x0=p[0]+r*(f-2.5)*.044;
      var jet=[[x0,p[1]],[x0+(f-2.5)*spray*.13,p[1]-spray*.53],
        [x0+(f-2.5)*spray*.24,p[1]-spray]];
      stroke(ctx,jet,r*.048,'#ff922d',heat*.53);
      stroke(ctx,jet,r*.023,'#fff3bb',heat*(1-flick)*.80);
    }
    // 넘친 소량의 용암은 화산 사면의 갈라진 결을 따라 흘러내린다.
    for(var j=0;j<8;j++){
      var key=seed+j*17, angle=j*.918+.63*jitter(key+3), points0=[p];
      var distance=r*(.30+.62*jitter(key+9))*U.smooth(0,1.5,age);
      for(var k=1;k<=6;k++){
        var u=k/6,bend=angle+(jitter(key+k)-.5)*.30;
        points0.push([p[0]+distance*u*Math.cos(bend),p[1]+distance*u*(.58+.49*Math.sin(bend))]);
      }
      var q=heat*(.38+.31*Math.sin(age*5+key)+.29*jitter(key));
      stroke(ctx,points0,Math.max(1,r*.076),'#661d17',q*.82);
      stroke(ctx,points0,Math.max(.75,r*.028),'#fc6727',q*.92);
      var glint=1+Math.floor(frac(age*.78+j*.57)*4);
      stroke(ctx,points0.slice(glint-1,glint+1),Math.max(.55,r*.015),'#ffd67c',q*.82);
    }
  }
  function lava(ctx,e,toScreen,z,t) {
    var f=e.field, gd=G.GroundDisaster, length=gd.lavaDistance(e,f.age), width=Math.min(f.width*z,52);
    var v=G.volcanoSite(e.volcanoId,e.lon,e.lat), where=f.line.points[0];
    var p=toScreen(v?v.lon:where[0],v?v.lat:where[1]);
    var c=F().volcano,r=Math.max(4,G.VolcanoArt.radius(v,z)),age=f.age-f.warning,seed=f.seed%931;
    var fade=U.smooth(0,2.1,f.life-f.age), heat=U.smooth(0,.24,age)*fade;
    ctx.lineCap='butt';ctx.lineJoin='bevel';
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
    }
    if(length<f.line.length-.015){
      var remains=gd.span(f.line,length,f.line.length).map(function(p0){return toScreen(p0[0],p0[1]);});
      forecast(ctx,remains,.71);
    }
    ashColumn(ctx,p,r,Math.max(.01,age+.26),seed,fade*(.20+.80*heat),c);
    if(heat>0){
      ventFire(ctx,p,r,age,seed,heat);
      flyingLava(ctx,p,r,age,seed,heat,c);
    }
  }
  A.draw = function (ctx,e,toScreen,zoom,t,ff) {
    var GD=G.GroundDisaster;
    if(!GD.open(e))return;
    var p=toScreen(e.lon,e.lat), extent=e.field.extent*zoom+160;
    if(p[0]+extent<0||p[0]-extent>1600||p[1]+extent<0||p[1]-extent>900)return;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    var quakeTop=Infinity;
    if(e.kind==='quake')quakeTop=faults(ctx,e,toScreen,zoom);
    else if(e.kind==='landslide')slide(ctx,e,toScreen,zoom,t);
    else if(e.kind==='flood')water(ctx,e,toScreen,zoom,t);
    else if(e.kind==='fire')fire(ctx,e,toScreen,zoom,t);
    else lava(ctx,e,toScreen,zoom,t);
    var label=GD.label(e), y=Math.max(100,Math.min(quakeTop,
      p[1]-(e.kind==='fire'||e.kind==='volcano'?e.field.width*zoom*2.8:39)));
    ctx.font='700 14px '+(ff||'serif');ctx.textAlign='center';
    var w=ctx.measureText(label).width+16;ctx.fillStyle='rgba(37,30,25,.83)';ctx.fillRect(p[0]-w/2,y-12,w,22);
    ctx.lineWidth=1;ctx.strokeStyle=F().route;ctx.strokeRect(p[0]-w/2,y-12,w,22);
    ctx.fillStyle=F().label;ctx.fillText(label,p[0],y+3);ctx.restore();
  };
})(window.G=window.G||{});
