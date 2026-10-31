/* 대원별 실제 이동 경로에 구두·발굽·발바닥·바퀴·썰매 자국을 남긴다. */
(function(G){
  'use strict';
  var T=G.ExpeditionTracks={};
  function config(){return G.FX.sprites.expedition.formation.tracks;}
  function shift(p,h,fwd,side,unit){return{x:p.x+(Math.cos(h)*fwd+Math.sin(h)*side)*unit,y:p.y+(-Math.sin(h)*fwd+Math.cos(h)*side)*unit};}
  T.kind=function(role){return role==='foot'||role==='porter'?'boot':role==='horse'||role==='donkey'?'hoof':role==='elephant'?'elephant':role==='camel'||role==='camel2'?'pad':'split';};
  T.update=function(u,items,size){
    var state=u.cache&&u.cache.formation,space=u.follow,c=config();if(!state||!space||c.enabled===false)return;
    var history=state.tracks||(state.tracks=[]),feet=state.trackMembers||(state.trackMembers=[]),zoom=space.zoom,unit=size/zoom,time=Number(u.t)||0;
    function push(mark){var root=state.root,p={x:u.pts[0][0]+(mark.x-root.x)*zoom,y:u.pts[0][1]+(mark.y-root.y)*zoom};if(u.canStand&&!u.canStand(p.x,p.y))return;mark.time=time;history.push(mark);}
    items.forEach(function(it){
      var role=it.leader?G.ExpeditionFormation.variant(u):it.role,old=feet[it.index],now={x:it.worldX,y:it.worldY};
      if(!old){feet[it.index]={x:now.x,y:now.y,acc:0,count:0};return;}
      var distance=Math.hypot(now.x-old.x,now.y-old.y),spacing=(c.spacing[role]||c.spacing.foot)*unit;
      if(!distance)return;
      var first=spacing-old.acc;
      for(var d=first;d<=distance;d+=spacing){
        var f=d/distance,p={x:old.x+(now.x-old.x)*f,y:old.y+(now.y-old.y)*f},h=it.heading,side=old.count++%2?1:-1;
        function stamp(type,forward,lateral){var q=shift(p,h,forward,lateral,unit);push({type:type,x:q.x,y:q.y,heading:h,size:size,actor:it.index});}
        if(role==='foot'||role==='porter')stamp('boot',0,side*c.humanWidth);
        else{
          var cart=role==='wagon'||role==='oxwagon'||role==='reindeer',pack=role==='donkey'||role==='llama'||role==='yak';
          var animal=role==='wagon'?'horse':role==='oxwagon'?'yak':role==='reindeer'?'reindeer':role;
          var forward=cart?c.draftForward:0,lateral=pack?c.packAnimalSide:0;
          stamp(T.kind(animal),forward+c.animalStride, lateral+side*c.animalWidth);
          stamp(T.kind(animal),forward-c.animalStride, lateral-side*c.animalWidth);
          if(pack)stamp('boot',0,-c.packHumanSide+side*c.humanWidth);
          if(cart){
            var q=shift(p,h,-c.cartBack,0,unit);
            if(old.rut){[-1,1].forEach(function(s){var a=shift(old.rut,old.rut.heading,0,s*c.rutWidth,unit),b=shift(q,h,0,s*c.rutWidth,unit);push({type:role==='reindeer'?'runner':'wheel',x:a.x,y:a.y,x2:b.x,y2:b.y,size:size,actor:it.index});});}
            old.rut={x:q.x,y:q.y,heading:h};
          }
        }
      }
      old.acc=(old.acc+distance)%spacing;old.x=now.x;old.y=now.y;
    });
    while(history.length&&(time-history[0].time>c.life||history.length>c.maxMarks))history.shift();
  };
  /** 발자국의 앞이 +x. 사람은 발끝과 굽을 분리하고 말발굽은 뒤가 열린 U자다. */
  T.glyph=function(ctx,type){
    if(type==='boot'){
      ctx.beginPath();ctx.moveTo(-0.7,-1.4);ctx.bezierCurveTo(0.2,-2.1,3.8,-1.8,4,-0.2);ctx.bezierCurveTo(4.2,1.5,1.5,1.8,-0.7,1.1);ctx.closePath();ctx.fill();ctx.fillRect(-3.1,-1.15,1.7,2.3);
    }else if(type==='hoof'){
      ctx.lineWidth=1.1;ctx.beginPath();ctx.ellipse(0,0,2.8,2.3,0,Math.PI*1.25,Math.PI*2.75);ctx.stroke();ctx.beginPath();ctx.moveTo(1,0);ctx.lineTo(-1,-0.65);ctx.lineTo(-1,0.65);ctx.closePath();ctx.fill();
    }else if(type==='split'){
      [-1,1].forEach(function(s){ctx.beginPath();ctx.moveTo(3,s*0.65);ctx.bezierCurveTo(1,s*2.1,-2.4,s*2.4,-2.6,s*0.8);ctx.bezierCurveTo(-2,s*0.15,0.7,s*0.15,3,s*0.65);ctx.fill();});
    }else if(type==='pad'){
      [-1,1].forEach(function(s){ctx.beginPath();ctx.ellipse(0,s*1.5,3.6,1.25,-s*0.12,0,Math.PI*2);ctx.fill();});
    }else if(type==='elephant'){
      ctx.beginPath();ctx.ellipse(0,0,5.3,4.4,0,0,Math.PI*2);ctx.fill();[-1,0,1].forEach(function(s){ctx.beginPath();ctx.ellipse(4.7,s*2.35,1,0.8,0,0,Math.PI*2);ctx.fill();});
    }
  };
  T.draw=function(ctx,u){
    var state=u.cache&&u.cache.formation,c=config();if(!state||!u.follow||u.tracks===false||c.enabled===false)return;
    var zoom=u.follow.zoom,root=state.root,time=Number(u.t)||0,terr=u.terr||'grass';
    var colors=c.colors,ink=/snow|ice|tundra/.test(terr)?colors.snow:terr==='desert'?colors.sand:colors.soil;
    ctx.save();ctx.fillStyle=ink;ctx.strokeStyle=ink;ctx.lineCap='round';
    (state.tracks||[]).forEach(function(mark){
      var age=Math.max(0,time-mark.time);ctx.globalAlpha=c.opacity*Math.max(0,1-age/c.life);
      var x=u.pts[0][0]+(mark.x-root.x)*zoom,y=u.pts[0][1]+(mark.y-root.y)*zoom;
      if(mark.x2!=null){ctx.lineWidth=(mark.type==='runner'?c.runnerLine:c.wheelLine)*mark.size;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(u.pts[0][0]+(mark.x2-root.x)*zoom,u.pts[0][1]+(mark.y2-root.y)*zoom);ctx.stroke();}
      else{ctx.save();ctx.translate(x,y);ctx.rotate(-mark.heading);ctx.scale(mark.size,mark.size*c.groundSquash);T.glyph(ctx,mark.type);ctx.restore();}
    });ctx.restore();
  };
})(window.G=window.G||{});
