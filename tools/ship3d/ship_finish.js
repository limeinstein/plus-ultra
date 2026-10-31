/* 두 번째 미술 보강: 선루의 실제 높이를 따라 조타·닻 설비와 지붕 마감을 붙인다. */
(function(root){'use strict';
  root.ShipFinish={enrich:function(ship,T,profile){
    var s=ship.s,h=ship.h,q=ship.q,C=ship.C,M=ship.M,PI=Math.PI,levels=[],houses=[];
    function mesh(g,geo,m,x,y,z){var o=new T.Mesh(geo,m);o.position.set(x||0,y||0,z||0);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
    function box(g,x,y,z,w,ht,d,m){return mesh(g,new T.BoxGeometry(w,ht,d),m,x,y,z);}
    function rod(g,a,b,r,m,tip){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),v=B.clone().sub(A);
      var o=mesh(g,new T.CylinderGeometry(tip==null?r:tip,r,v.length(),6),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
    function line(g,pts,r,m){for(var i=1;i<pts.length;i++)rod(g,pts[i-1],pts[i],r,m);}
    function ring(g,x,y,z,r,m,axis){var o=mesh(g,new T.TorusGeometry(r,.15,4,14),m,x,y,z);if(axis==='y')o.rotation.x=PI/2;if(axis==='x')o.rotation.y=PI/2;return o;}
    var castle=ship.castle;
    ship.castle=function(g,a,b,hc,opt){var o=opt||{};
      levels.push({a:a,b:b,base:o.base||function(u){return h.sheer(u);},hc:hc});return castle.apply(this,arguments);
    };
    function deck(u){
      var y=h.deckY(u);
      levels.forEach(function(l){if(u>=l.a&&u<=l.b)y=Math.max(y,l.base(u)+l.hc-Math.max(.9,Math.min(2.4,l.hc*.22)));});
      if(s.hull==='panok'&&u>.04&&u<.92)y=h.sheer(u)+h.H*.55;
      if(s.hull==='atake'&&u>.05&&u<.92)y=h.sheer(u)+h.H*.85;
      return y;
    }
    function occupied(x){return houses.some(function(a){return x>a.x0-3&&x<a.x1+3;})||s.masts.some(function(mx){return Math.abs(x-mx)<5;});}
    var house=ship.roofHouse;
    ship.roofHouse=function(g,x0,x1,hw,y,hh,roof,eave,wall){
      house.apply(this,arguments);houses.push({x0:x0,x1:x1});
      var ov=Math.min(hw*(eave||.2),3.2),rh=Math.min(hw*.5,2.2+hh*.55),yy=y+hh;
      var tiled=['junk','korean','japanese'].indexOf(profile.family)>=0;
      // 지붕 절단면의 두께, 박공 틀, 처마 밑의 짧은 서까래.
      [x0-ov,x1+ov].forEach(function(x){
        line(g,[[x,yy-ov*.35,-hw-ov],[x,yy+rh,0],[x,yy-ov*.35,hw+ov]],tiled?.36:.25,M.dark);
        rod(g,[x,yy-.12,-hw],[x,yy-.12,hw],.28,M.deckc);
        rod(g,[x,yy,0],[x,yy+rh-.2,0],.23,M.deckc);
      });
      [-1,1].forEach(function(side){
        box(g,(x0+x1)/2,yy-ov*.35-.25,side*(hw+ov),x1-x0+2*ov,.55,.45,M.dark);
        for(var x=x0;x<=x1;x+=3.8)rod(g,[x,yy-.3,side*(hw-.8)],[x,yy-ov*.35-.35,side*(hw+ov)],.18,M.deckc);
      });
      // 전면 문과 작은 문턱. 창호와 함께 벽에 깊이를 만든다.
      if(hh>3.2){var dw=Math.min(3.8,hw*.65),dh=hh*.77;
        box(g,x1+.15,y+dh*.5,0,.28,dh,dw,M.dark);
        [-1,1].forEach(function(side){box(g,x1+.4,y+dh*.5,side*dw*.46,.28,dh,.23,M.deckc);});
        for(var i=-1;i<=1;i++)box(g,x1+.32,y+dh*.48,i*dw*.23,.22,dh*.9,.12,M.mid);
        box(g,x1+.6,y+.15,0,1.5,.3,dw+1,M.deckc);box(g,x1+.3,y+dh,0,.45,.3,dw+.5,M.deckc);
      }
      if(tiled){
        [x0-ov,x1+ov].forEach(function(x,i){var dir=i?1:-1;
          line(g,[[x-dir*1.2,yy+rh+.3,0],[x,yy+rh+.45,0],[x+dir*1.4,yy+rh+1.2,0]],.28,M.dark);
        });
      }
    };
    function rudder(g){
      if(s.hull==='raft'){
        // 원본 뗏목의 조타 노에 넓적한 끝과 고정 끈만 더한다.
        var r=ship.raftDeck/2.2,blade=box(g,-s.L*.535,1.1,s.W*.195,6,2.1,.45,C.oar);blade.rotation.z=.25;
        ring(g,-s.L*.42,r*2.4,s.W*.15,.65,C.rope,'x');return;
      }
      if(s.hull==='outrigger'){
        var y=h.sheer(.1),x=-s.L*.36,z=s.W*.28;
        rod(g,[x+4,y+3,z],[x-10,.6,z+4],.35,C.spar);
        var blade=box(g,x-8,1.4,z+3.4,6,2.4,.45,M.mid);blade.rotation.z=.26;
        ring(g,x,y+1.8,z+.9,.75,C.rope,'x');return;
      }
      if(s.hull==='junk'){
        // 정크에는 이미 큰 방향타가 있다. 같은 자리에 두 번째 판을 만들지 않는다.
        var hc=h.H*(q.stern==='tower'?.95:q.stern==='high'?.8:.6),cx=h.X(0,h.sheer(0)+hc*.5)-1.5;
        [.22,.57].forEach(function(v){var yy=h.sheer(0)*v+.6;box(g,cx,yy,0,2.8,.5,.72,C.iron);
          [-1,1].forEach(function(side){rod(g,[cx+.75,yy-1,side*.34],[cx+.75,yy+1,side*.34],.18,C.iron);});});return;
      }
      var top=h.sheer(0)*.83,width=Math.min(6,s.W*.13),shape=new T.Shape();
      shape.moveTo(h.X(0,1)-.6,1);shape.lineTo(h.X(0,top)-.6,top);
      shape.lineTo(h.X(0,top)-width*.65,top);shape.lineTo(h.X(0,1)-width,1);shape.closePath();
      var fin=new T.ExtrudeGeometry(shape,{depth:.8,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.16,bevelThickness:.12});fin.translate(0,0,-.4);mesh(g,fin,M.hull);
      [.28,.62].forEach(function(v){var yy=top*v,x=h.X(0,yy)-.8;
        box(g,x-width*.36,yy,0,width*.82,.55,1.05,C.iron);rod(g,[x,yy-1.1,0],[x,yy+1.1,0],.34,C.iron);
        [-1,1].forEach(function(side){for(var i=0;i<3;i++)mesh(g,new T.SphereGeometry(.16,5,4),C.brass,x-i*width*.27,yy,side*.56);});
      });
      // 작은 배의 노출된 조타 손잡이. 선실이 있는 자리는 비워 둔다.
      var u=.035,yy=deck(u),xx=h.X(u,yy);
      if(!occupied(xx+4)&&s.hull!=='turtle'){
        rod(g,[xx,yy,0],[xx,yy+2.1,0],.5,M.dark);rod(g,[xx,yy+2.1,0],[xx+7,yy+1.6,0],.3,C.spar,.22);
        box(g,xx+6.5,yy+1.65,0,.7,.55,2.4,M.deckc);
      }
    }
    function windlass(g){
      if(['raft','outrigger','turtle'].indexOf(s.hull)>=0)return;
      var u=.81,x=h.X(u,deck(u));
      if(occupied(x)){u=.87;x=h.X(u,deck(u));}if(occupied(x))return;
      var y=deck(u),r=Math.max(.65,Math.min(1.25,s.W*.023)),w=Math.min(7,h.half(u,y)*.55);
      if(s.id==='shachuan'&&Math.abs(x-s.L*.3)<s.L*.05)y+=1.6;
      if(w<2)return;
      [-1,1].forEach(function(side){
        box(g,x,y+1.2,side*w,1.2,2.4,1.1,M.dark);box(g,x,y+.15,side*w,2.5,.3,2.1,M.mid);
        for(var k=0;k<2;k++){var a=k*PI/2;rod(g,[x-Math.cos(a)*2,y+2.1-Math.sin(a)*2,side*(w+.8)],[x+Math.cos(a)*2,y+2.1+Math.sin(a)*2,side*(w+.8)],.19,M.deckc);}
      });
      rod(g,[x,y+2.1,-w-1.2],[x,y+2.1,w+1.2],r,C.spar);
      for(var i=-2;i<=2;i++)ring(g,x,y+2.1,i*.32,r+.08,C.rope);
      [-1,1].forEach(function(side){var pts=[];for(var j=0;j<=8;j++){var v=u+(.95-u)*j/8,yy=deck(v)+.2;pts.push([h.X(v,yy),yy,side*1.2]);}line(g,pts,.15,C.rope);});
    }
    function beak(g){
      if(q.bow!=='beak')return;
      var y=h.sheer(1)*.72+1.3,x=h.X(.985,h.sheer(1)*.7)-1,len=s.L*.075,w=h.W*.15;
      [-1,1].forEach(function(side){
        line(g,[[x,y+2.8,side*w],[x+len*.5,y+2.4,side*w*.48],[x+len,y+2,0]],.25,C.brass);
        for(var i=0;i<4;i++){var t=i/4;rod(g,[x+len*t,y,side*w*(1-t)],[x+len*t,y+2.8-t*.8,side*w*(1-t)],.2,M.dark);}
      });
      for(var i=1;i<6;i++){var t=i/6;rod(g,[x+len*t,y+.1,-w*(1-t)],[x+len*t,y+.1,w*(1-t)],.18,M.deckc);}
    }
    function armor(g){
      if(s.hull!=='turtle'||ship.turtleDetail)return;
      // 머리 아래 비어 있던 연결부를 굽은 목으로 이어 선수에 고정한다.
      var headY=h.sheer(1)+h.H*.35,headX=h.X(1,headY)+.5,baseY=h.sheer(.96),baseX=h.X(.96,baseY);
      var neck=new T.CatmullRomCurve3([new T.Vector3(baseX-1,baseY-.8,0),new T.Vector3(headX-2.8,headY-3.4,0),new T.Vector3(headX-.5,headY-.8,0)]);
      mesh(g,new T.TubeGeometry(neck,12,1.3,8,false),C.brass);
      box(g,baseX-1,baseY-.7,0,3.8,.7,3.6,M.dark);
      for(var k=1;k<5;k++){var t=k/6,p=neck.getPoint(t),tangent=neck.getTangent(t),collar=ring(g,p.x,p.y,p.z,1.33,M.dark);
        collar.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),tangent);}
      function point(t,a){var u=.06+.84*t,e=Math.sin(PI*t),y=h.sheer(u)+h.H*.38,w=h.half(u,y)*1.04,hr=h.B*.62*Math.pow(e,.45)+.8;
        return [h.X(u,y),y+Math.sin(a)*(hr+.18),-Math.cos(a)*(w*(.55+.45*Math.pow(e,.35))+.18)];}
      // 등판의 곡면 이음: 쇠못의 위치와 둥근 실루엣을 그대로 둔다.
      [.17,.33,.5,.67,.83].forEach(function(t){var p=[];for(var j=0;j<=16;j++)p.push(point(t,PI*j/16));line(g,p,.13,C.iron);});
      [PI*.24,PI*.76].forEach(function(a){var p=[];for(var j=1;j<26;j++)p.push(point(j/26,a));line(g,p,.12,C.iron);});
    }
    var base=ship.buildHull;
    ship.buildHull=function(){levels.length=houses.length=0;var g=base.call(this);rudder(g);windlass(g);beak(g);armor(g);return g;};
    return ship;
  }};
})(window);
