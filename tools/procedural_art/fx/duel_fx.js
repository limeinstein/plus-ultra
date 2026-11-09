/* 투명 캔버스에 칼의 잔상·금속 섬광을 굽는다. 원점은 게임의 칼끝 또는 접점이다. */
(function (G) {
  'use strict';
  function lance(ctx, x, y, dx, dy, width, color) {
    var length = Math.hypot(dx, dy) || 1, nx = -dy * width / length, ny = dx * width / length;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + dx*0.28 + nx, y + dy*0.28 + ny); ctx.lineTo(x+dx, y+dy);
    ctx.lineTo(x + dx*0.28 - nx, y + dy*0.28 - ny); ctx.closePath(); ctx.fill();
  }
  function radiance(ctx, x, y, radius, rgb) {
    var g = ctx.createRadialGradient(x,y,0,x,y,radius);
    g.addColorStop(0,'rgba(255,251,231,.96)'); g.addColorStop(0.12,'rgba('+rgb+',.81)');
    g.addColorStop(0.39,'rgba('+rgb+',.23)'); g.addColorStop(1,'rgba('+rgb+',0)');
    ctx.fillStyle=g; ctx.fillRect(x-radius,y-radius,2*radius,2*radius);
  }
  function ribbon(ctx, id, q) {
    var up = id.endsWith('_up'), flat = id.endsWith('_flat'), wide = /heavy|bash/.test(id);
    var len = id.endsWith('heavy') ? 485 : 371;
    var h = flat ? -28 : up ? 150 : -154, bend = flat ? -31 : up ? 241 : -229;
    var end = q === 0 ? 0.64 : q < 0.45 ? 0.87 : 1, start = Math.max(0,(q-0.27)*0.86);
    function at(t) {
      var u = 1-t;
      return [-len*u*u - len*0.62*2*u*t, u*u*h + 2*u*t*bend];
    }
    var width = wide ? 31 : up ? 21 : 13;
    function band(thick, offset, color) {
      var left=[], right=[];
      for(var j=0;j<=42;j++) {
        var p=j/42,t=start+(end-start)*p,v=at(t),next=at(t+0.001);
        var dx=next[0]-v[0],dy=next[1]-v[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
        var taper=Math.pow(Math.sin(Math.PI*p),0.77),w=thick*taper;
        left.push([v[0]+nx*(offset*taper+w),v[1]+ny*(offset*taper+w)]);
        right.push([v[0]+nx*(offset*taper-w),v[1]+ny*(offset*taper-w)]);
      }
      ctx.beginPath(); left.concat(right.reverse()).forEach(function(v,i) { if(i) ctx.lineTo(v[0],v[1]); else ctx.moveTo(v[0],v[1]); });
      ctx.closePath(); ctx.fillStyle=color; ctx.fill();
    }
    ctx.globalAlpha=1-q*0.78;
    band(width*1.4,0,'rgba(250,177,81,.15)'); band(width*0.66,0,'rgba(255,212,149,.74)');
    band(width*0.24,-width*0.25,'#fff9df'); band(1.3,width*1.2,'rgba(250,225,175,.76)');
    if (wide) band(2,width*1.72,'rgba(200,219,225,.52)');
  }
  function burst(ctx,id,q) {
    var ko=id==='ko_burst',parry=id==='clash_parry',glint=id==='glint',cut=id==='impact_cut',pierce=id==='impact_pierce';
    var col=glint||pierce?'188,225,255':'255,196,111';
    var span=ko?195:parry?151:glint?55:cut?99:pierce?95:62;
    ctx.globalAlpha=1-q*0.88;
    if (id==='impact_blunt') {
      ctx.strokeStyle='rgba(217,184,135,.85)'; ctx.lineWidth=9*(1-q)+1;ctx.beginPath();ctx.ellipse(0,0,28+q*76,18+q*57,-0.2,0,7);ctx.stroke();
      radiance(ctx,0,0,48*(1-q*0.7),'198,159,118');return;
    }
    radiance(ctx,0,0,(glint?25:span*0.52)*(1-q*0.65),col);
    var count=ko?28:parry?20:glint?4:cut?6:pierce?12:9;
    for(var i=0;i<count;i++) {
      var angle=glint||parry?i*2*Math.PI/count : i*2.39996-0.68;
      if(cut && i<2) angle=-0.72+i*Math.PI;
      var major=glint|| (parry?i%5===0:cut?i<2:i%3===0);
      var bias=major?1:0.32+0.28*Math.abs(Math.sin(i*24.7));
      var travel=major?0:q*span*0.36;
      var size=span*bias*(major?1-q*0.68:0.55+q*0.42);
      var dx=Math.cos(angle),dy=Math.sin(angle);
      lance(ctx,dx*travel,dy*travel,dx*size,dy*size,major?3.4:1.5,major?'#fffbe3':'rgb('+col+')');
    }
    if (ko) {
      ctx.strokeStyle='rgba(64,47,40,.72)';ctx.lineWidth=4*(1-q)+1;ctx.beginPath();ctx.arc(0,0,66+q*116,-0.42,2.10);ctx.stroke();
    }
  }
  G.bakeDuelEffect = function(ctx,id,i,spec) {
    var q=i/Math.max(1,spec.frames-1);
    if (id==='trail_thrust') {
      ctx.globalAlpha=1-q*0.82;
      lance(ctx,-380,0,380,0,7,'rgba(166,215,255,.7)');
      lance(ctx,-331,0,331,0,2.4,'#fcffff');radiance(ctx,0,0,26,'172,224,255');
    } else if (id.startsWith('trail_')) ribbon(ctx,id,q);
    else if(id==='debris_atlas') {
      ctx.rotate(i*1.19);var color=['#e9cc99','#b78c55','#855435'][Math.floor(i/4)];
      lance(ctx,-19,5,36,-10-i%4*2,4+i%4,color);lance(ctx,-13,4,25,-8,1.7,'#ecd6aa');
    } else burst(ctx,id,q);
  };
})(window);
