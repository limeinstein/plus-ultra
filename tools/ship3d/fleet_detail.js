/* 35종의 선형·문화권별 미술 보강. 갤리온은 승인된 별도 모형을 유지한다. */
(function(root){
  'use strict';
  root.FleetDetail={enrich:function(ship,T,look,profile){
    var s=ship.s,h=ship.h,q=ship.q,C=ship.C,art=root.ShipArtMaterials.make(ship,T,look),M=art.M;
    var paint=art.paint,wood=M.deckc,dark=M.dark,gold=C.brass,rope=C.rope,PI=Math.PI,levels=[];
    var trim=profile.family==='west'||profile.family==='dhow'?gold:wood;
    C.red.color.copy(art.color(look.paint));
    // 장갑판·기와·초가에도 표면 깊이를 준다. 통나무는 널빤지 재질로 바꾸지 않는다.
    ['roof','thatch','plates','wallJ','wallK'].forEach(function(k){C[k]=C[k].clone();if(C[k].map){C[k].bumpMap=C[k].map;C[k].bumpScale=look.woodRelief;}});
    function mesh(g,m,p,parent){var o=new T.Mesh(g,m);if(p)o.position.fromArray(p);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
    function box(g,x,y,z,w,ht,d,m){return mesh(new T.BoxGeometry(w,ht,d),m,[x,y,z],g);}
    function rod(g,a,b,r,m,tip,n){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),v=B.clone().sub(A);
      var o=mesh(new T.CylinderGeometry(tip==null?r:tip,r,v.length(),n||5),m,null,g);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
    function line(g,pts,r,m){for(var i=1;i<pts.length;i++)rod(g,pts[i-1],pts[i],r,m);}
    function ring(g,x,y,z,r,m,axis){var o=mesh(new T.TorusGeometry(r,.15,4,14),m,[x,y,z],g);if(axis==='y')o.rotation.x=PI/2;if(axis==='x')o.rotation.y=PI/2;return o;}
    function deck(x){return h.deckY(h.U(x,h.H));}
    function strip(g,a,b,yf,height,inset,m){
      [1,-1].forEach(function(side){var p=[],uv=[],ix=[],n=28;
        for(var i=0;i<=n;i++){var u=a+(b-a)*i/n,y=yf(u);[-height/2,height/2].forEach(function(off){p.push(h.X(u,y+off),y+off,side*(h.half(u,y+off)*inset+.25));uv.push(i/n,off>0?1:0);});
          if(i<n){var j=i*2;ix.push(j,j+1,j+2,j+1,j+3,j+2);}}
        var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();mesh(geo,m,null,g);
      });
    }
    function rail(g,a,b,yf,inset,n,height){
      [1,-1].forEach(function(side){var top=[],mid=[];
        for(var i=0;i<=n;i++){var u=a+(b-a)*i/n,y=yf(u),x=h.X(u,y),z=side*(h.half(u,y)*inset-.4);
          rod(g,[x,y,z],[x,y+height,z],.24,wood,.2);top.push([x,y+height,z]);mid.push([x,y+height*.42,z]);
          if(i%2===0)box(g,x,y+height+.15,z,.65,.35,.65,trim);
        }line(g,top,.33,dark);line(g,mid,.16,wood);
      });
    }
    function windowFrame(g,x,y,z,w,ht,side){
      var o=new T.Group();o.position.set(x,y,z);o.rotation.y=side>0?0:PI;g.add(o);
      box(o,0,0,0,w,ht,.25,C.glass);
      [-1,1].forEach(function(a){box(o,a*w/2,0,.2,.2,ht+.3,.3,trim);box(o,0,a*ht/2,.2,w+.3,.2,.3,trim);});
      box(o,0,0,.26,.12,ht,.2,trim);box(o,0,0,.26,w,.12,.2,trim);
      if(profile.family==='junk'||profile.family==='korean')[-.25,.25].forEach(function(a){box(o,a*w,0,.3,.10,ht,.2,wood);});
    }
    function hatch(g,x,z,len,w,y){
      box(g,x,y+.35,z,len,.7,w,dark);
      [-1,1].forEach(function(side){box(g,x+side*len*.5,y+.75,z,.65,1.5,w+1.1,M.hull);box(g,x,y+.75,z+side*w*.5,len+.65,1.5,.65,M.hull);
        box(g,x,y+1.55,z+side*w*.5,len+1.1,.2,.8,wood);});
      for(var a=-w*.44;a<=w*.44;a+=1.4)box(g,x,y+.86,z+a,len-.5,.25,.23,wood);
      for(var a=-len*.43;a<=len*.43;a+=1.6)box(g,x+a,y+.85,z,.22,.25,w-.4,wood);
    }
    function barrel(g,x,z,y,r){
      var geo=new T.CylinderGeometry(r*.85,r*.85,r*2.5,10,4),p=geo.attributes.position;
      for(var i=0;i<p.count;i++){var swell=1+.18*(1-Math.pow(p.getY(i)/(r*1.25),2));p.setX(i,p.getX(i)*swell);p.setZ(i,p.getZ(i)*swell);}geo.computeVertexNormals();
      mesh(geo,M.hull,[x,y+r*1.25,z],g);[-.75,.75].forEach(function(a){ring(g,x,y+r*(1.25+a),z,r*.96,C.iron,'y');});
      box(g,x,y+r*2.52,z,r*1.3,.15,.18,dark);
    }
    function stairs(g,x,y,z,up,run,w,dir){
      var n=Math.max(3,Math.ceil(up/1.35));for(var i=0;i<=n;i++)box(g,x+dir*run*i/n,y+up*i/n,z,run/n+.2,.3,w,wood);
      [-1,1].forEach(function(side){var zz=z+side*w*.5;rod(g,[x,y-.3,zz],[x+dir*run,y+up-.3,zz],.3,dark);rod(g,[x,y+2.7,zz],[x+dir*run,y+up+2.7,zz],.22,wood);});
    }
    function coil(g,x,z,y,r){for(var i=0;i<3;i++)ring(g,x,y+i*.13,z,r-i*.22,rope,'y');}
    function bollard(g,x,z,y){[-.9,.9].forEach(function(off){rod(g,[x+off,y,z],[x+off,y+2.1,z],.36,dark);});box(g,x,y+1.5,z,3.4,.4,.6,wood);}
    function anchors(g){
      [1,-1].forEach(function(side){var u=.79,y=h.sheer(u)-1.5,x=h.X(u,y),z=side*(h.half(u,y)+1.2),a=new T.Group();a.position.set(x,y,z);a.rotation.z=-.24;g.add(a);
        rod(a,[0,1,0],[0,-5,0],.28,C.iron);rod(a,[-2.5,0,0],[2.5,0,0],.3,dark);
        line(a,[[-2.6,-2.8,0],[-1.8,-4.5,0],[0,-5,0],[1.8,-4.5,0],[2.6,-2.8,0]],.25,C.iron);ring(a,0,1.6,0,.6,C.iron);
        rod(g,[x,y+1.6,z],[x-2,y+4,z-side*1.3],.16,rope);
      });
    }
    // 선루를 만들 때 실제 갑판 높이와 폭을 받아 해당 선종에 맞는 난간·창·도색을 붙인다.
    var castle=ship.castle;
    ship.castle=function(g,a,b,hc,opt){
      var result=castle.apply(this,arguments),o=opt||{},base=o.base||function(u){return h.sheer(u);},inset=o.inset||.985;
      var upper=function(u){return base(u)+hc;};levels.push({a:a,b:b,hc:hc,base:base,top:upper,inset:inset});
      rail(g,a+.008,b-.008,upper,inset,Math.max(5,Math.round((b-a)*45)),2.1);
      strip(g,a+.008,b-.008,function(u){return upper(u)-hc*.42;},hc*.46,inset,paint);
      strip(g,a+.008,b-.008,function(u){return upper(u)-.7;},.26,inset+.005,trim);
      if(hc>5)[1,-1].forEach(function(side){var count=Math.max(2,Math.round((b-a)*15));
        for(var i=0;i<count;i++){var u=a+(b-a)*(i+1)/(count+1),y=base(u)+hc*.52;windowFrame(g,h.X(u,y),y,side*(h.half(u,y)*inset+.5),2,Math.min(3.4,hc*.43),side);}
      });return result;
    };
    // 기와·초가집: 기둥, 창호, 처마 받침과 지붕 마감. 지붕의 위치는 원본에서 받는다.
    var house=ship.roofHouse;
    ship.roofHouse=function(g,x0,x1,hw,y,hh,roof,eave,wall){
      house.apply(this,arguments);var n=Math.max(2,Math.round((x1-x0)/7)), post=profile.family==='japanese'?dark:paint;
      [1,-1].forEach(function(side){for(var i=0;i<=n;i++){var x=x0+(x1-x0)*i/n;
        box(g,x,y+hh*.5,side*(hw+.16),.45,hh+.25,.45,post);
        rod(g,[x,y+hh-.8,side*hw],[x,y+hh-.3,side*(hw+1.3)],.16,wood);
      }box(g,(x0+x1)/2,y+hh-.15,side*(hw+.2),x1-x0+.5,.45,.5,post);
        if(hh>3.5)windowFrame(g,(x0+x1)/2,y+hh*.52,side*(hw+.3),Math.min(4,(x1-x0)*.4),hh*.48,side);
      });
    };
    // 천의 종류에 맞는 재질을 쓰고 실시간 모션 어댑터가 찾아갈 수 있게 둔다.
    var sq=ship.sqSurface;
    ship.sqSurface=function(grp,mx,yT,yB,spT,spB,brace,bill,st){return sq.call(this,grp,mx,yT,yB,spT,spB,brace,bill,st,art.cloth(s.hull==='raft'?'mat':'sq'),20,14);};
    ['lateen','batten','tanja','triSurface'].forEach(function(name){var original=ship[name];ship[name]=function(grp){
      original.apply(this,arguments);var group=grp.children[grp.children.length-1];
      group.traverse(function(o){if(o.isMesh&&o.material.map)o.material=art.cloth(name==='batten'?'bat':name==='tanja'?'mat':'lat');});
    };});
    function western(g){
      var sternEnd=levels.length?Math.max.apply(null,levels.filter(function(l){return l.a<.1;}).map(function(l){return l.b;})):0;
      if(!isFinite(sternEnd))sternEnd=0;
      var bowStart=.92;levels.forEach(function(l){if(l.a>.65)bowStart=Math.min(bowStart,l.a);});
      rail(g,Math.max(.07,sternEnd+.025),bowStart-.02,function(u){return h.sheer(u);},1,15,1.6);
      if(profile.kit==='gallery'||profile.kit==='castle'){
        levels.filter(function(l){return l.a<.03;}).forEach(function(l){
          [1,-1].forEach(function(side){for(var i=0;i<6;i++){var u=.02+(l.b-.04)*i/5,y=l.top(u)-1.8;
            var mark=box(g,h.X(u,y),y,side*(h.half(u,y)*l.inset+.45),.7,.9,.2,gold);mark.rotation.z=PI/4;}
          });
          var yy=l.base(0)+l.hc*.5,xx=h.X(0,yy)-.9,w=h.half(.002,yy)*l.inset;
          box(g,xx,yy,0,.5,l.hc*.6,w*1.8,paint);
          for(var i=-1;i<=1;i++){var win=new T.Group();win.position.set(xx-.4,yy,i*w*.58);win.rotation.y=-PI/2;g.add(win);windowFrame(win,0,0,0,2.2,Math.min(3.5,l.hc*.45),1);}
          if(profile.kit==='gallery'){box(g,xx-1,yy-l.hc*.34,0,2.7,.5,w*1.9,wood);rod(g,[xx-2.2,yy-.5,-w],[xx-2.2,yy-.5,w],.23,gold);for(var j=-4;j<=4;j++)rod(g,[xx-2.2,yy-l.hc*.32,j*w/4],[xx-2.2,yy-.5,j*w/4],.13,wood);}
        });
      }
      var first=levels.filter(function(l){return l.a<.03;})[0];
      if(first){var target=first.top(first.b)-Math.min(2.4,first.hc*.22),x=h.X(first.b,target),run=Math.min(11,first.hc*.9),y=deck(x+run);
        if(target>y+1)stairs(g,x+run,y,-s.W*.14,target-y,run,3.7,-1);
      }
      hatch(g,s.L*.12,0,Math.min(12,s.L*.08),Math.min(8,s.W*.2),deck(s.L*.12));anchors(g);
      if(profile.kit==='merchant'){
        var x=-s.L*.04,y=deck(x);box(g,x,y+1,0,s.L*.13,2,s.W*.26,dark);
        for(var i=-2;i<=2;i++)box(g,x+i*2,y+2.1,0,1.8,.25,s.W*.24,wood);
      }
    }
    function mediterranean(g){
      // 노꾼 좌석·노받이와 통로 가장자리. 낮은 배에 큰 성루를 얹지 않는다.
      for(var i=0;i<8;i++){var x=-s.L*.27+i*s.L*.55/7,u=h.U(x,h.H),y=deck(x),w=h.half(u,h.H);
        [1,-1].forEach(function(side){box(g,x,y+.7,side*w*.55,1.4,.55,w*.55,wood);rod(g,[x,h.sheer(u),side*(w+.2)],[x,h.sheer(u)+1.7,side*(w+.2)],.24,dark);});
      }
      if(q.stern==='quarter'){
        for(var i=0;i<4;i++){var u=.04+i*.04,y=h.deckY(u),w=h.half(u,h.sheer(u))*.92,x=h.X(u,y),pts=[];
          for(var j=0;j<=10;j++){var a=PI*j/10;pts.push([x,y+3.3+Math.sin(a)*w*.55,-Math.cos(a)*w]);}line(g,pts,.16,trim);
        }
      }
      strip(g,.03,.94,function(u){return h.sheer(u)-1.2;},.65,1,paint);
      [1,-1].forEach(function(side){bollard(g,s.L*.3,side*s.W*.22,deck(s.L*.3));});
      if(s.cap>150)anchors(g);
    }
    function indian(g){
      rail(g,.27,.88,function(u){return h.sheer(u);},1,16,1.8);
      // 판재 이음에 걸친 야자 끈. 선체 곡면을 따라 작은 사선으로 교차한다.
      [1,-1].forEach(function(side){for(var i=0;i<24;i++){var u=.06+i*.87/23;
        [.38,.67].forEach(function(v){var y=h.sheer(u)*v,x=h.X(u,y),z=side*(h.half(u,y)+.26);
          rod(g,[x-.55,y-.65,z],[x+.55,y+.65,z],.1,rope);rod(g,[x-.55,y+.65,z],[x+.55,y-.65,z],.1,rope);
        });
      }});anchors(g);hatch(g,s.L*.04,0,11,8,deck(s.L*.04));
      var x=-s.L*.06,y=deck(x);box(g,x,y+1.5,s.W*.18,11,3,6,art.cloth('mat'));
      for(var i=-1;i<=1;i++)rod(g,[x+i*3,y+3.1,s.W*.18-3],[x+i*3,y+3.1,s.W*.18+3],.13,rope);
    }
    function asian(g){
      var f=profile.family,upper=s.hull==='panok'?h.H*.95:s.hull==='atake'?h.H*1.15:0;
      if(s.hull!=='turtle')rail(g,upper?.06:.3,.89,function(u){return h.sheer(u)+upper;},s.hull==='panok'?1.08:upper?1.035:1,18,1.7);
      var wallY=s.hull==='panok'?h.H*.75:s.hull==='atake'?h.H*.95:s.hull==='jp'&&s.id==='sekibune'?h.H*.4:0;
      if(wallY){
        var wallInset=s.hull==='panok'?1.085:1.04;
        strip(g,.09,.88,function(u){return h.sheer(u)+wallY;},.8,wallInset,paint);
        [1,-1].forEach(function(side){for(var i=0;i<12;i++){var u=.1+i*.76/11,y=h.sheer(u)+wallY*.6,x=h.X(u,y),z=side*(h.half(u,y)*wallInset+.4);
          box(g,x,y,z,.5,wallY,.5,dark);box(g,x,y+wallY*.4,z,2.2,.35,.6,wood);
        }});
      }
      if(f==='junk'){
        [1,-1].forEach(function(side){var u=.9,y=h.sheer(u)*.74,x=h.X(u,y),z=side*(h.half(u,y)+.5);
          var eye=mesh(new T.SphereGeometry(1.4,10,6),C.white,[x,y,z],g);eye.scale.set(1.2,.7,.2);var pupil=mesh(new T.SphereGeometry(.65,8,5),C.hole,[x+.2,y,z+side*.28],g);pupil.scale.z=.22;
        });
        hatch(g,s.L*.25,0,12,9,deck(s.L*.25));
      }
      if(f==='japanese'){
        var y=h.sheer(.16)+(upper||0),x=h.X(.16,y);
        [-1,1].forEach(function(side){var z=side*s.W*.28;rod(g,[x,y,z],[x,y+9,z],.2,dark);box(g,x,y+6,z+side*.65,.22,5,1.8,C.white);});
      }
      if(s.hull==='turtle'&&!ship.turtleDetail){
        // 기존 쇠못을 보존하면서 용머리의 눈·뿔·수염과 포구의 테를 보강한다.
        var y=h.sheer(1)+h.H*.35,x=h.X(1,y)+.5;
        [1,-1].forEach(function(side){mesh(new T.SphereGeometry(.6,8,6),C.white,[x+1,y+1,side*1.8],g);mesh(new T.SphereGeometry(.28,6,5),C.hole,[x+1.25,y+1.1,side*2.15],g);
          line(g,[[x-1,y+1.5,side],[x-2,y+4.4,side*1.6],[x,y+3.4,side*1.9]],.23,gold);
          line(g,[[x+3,y-.2,side*1.2],[x+4,y-1,side*3],[x+2,y-1.5,side*4]],.18,gold);
        });
        var muzzle=ring(g,x+4,y,0,1.05,C.iron,'x');muzzle.rotation.z=.25;
        strip(g,.08,.88,function(u){return h.sheer(u)+h.H*.3;},.55,1.045,paint);
      }
      if(f==='korean'&&s.hull!=='turtle')hatch(g,s.L*.25,0,10,8,deck(s.L*.25)+upper-(upper?h.H*.4:0));
      if(s.hull!=='turtle'&&f!=='japanese')anchors(g);
    }
    function tropical(g){
      if(s.hull==='raft'){
        var rr=s.W/(9*2.05),y=rr*1.9;
        [-s.L*.3,0,s.L*.25].forEach(function(x){for(var k=0;k<9;k++){var z=-s.W*.47+k*s.W*.94/8;
          var o=ring(g,x,rr*.6,z,rr*1.02,rope,'x');o.scale.y=.95;
        }});
        for(var i=-5;i<=5;i++)rod(g,[-s.L*.31,y+.45,i*3.3],[s.L*.23,y+.45,i*3.3],.23,C.bamboo);
        coil(g,s.L*.18,10,y+1,2);barrel(g,s.L*.1,-9,y+1,1.5);
      }else if(s.hull==='outrigger'){
        var z=s.W*2.25;[-s.L*.24,s.L*.2].forEach(function(x){var y=h.sheer(h.U(x,h.H))+.6;
          [-1,1].forEach(function(side){for(var k=-1;k<=1;k++)ring(g,x+k*.5,y,side*z,.8,rope,'x');
            rod(g,[x-4,y,side*z],[x+4,y,side*(z-6)],.18,rope);});
        });
        strip(g,.08,.92,function(u){return h.sheer(u)-.5;},.7,1,paint);
      }else{rail(g,.29,.88,function(u){return h.sheer(u);},1,16,1.7);hatch(g,-s.L*.02,0,14,10,deck(-s.L*.02));}
    }
    var base=ship.buildHull;
    ship.buildHull=function(){
      var g=base.call(this);
      if(profile.family==='west')western(g);else if(profile.family==='galley')mediterranean(g);else if(profile.family==='dhow')indian(g);
      else if(['junk','korean','japanese'].indexOf(profile.family)>=0)asian(g);else tropical(g);
      if(['turtle','atake','panok','outrigger','raft'].indexOf(s.hull)<0){
        for(var k=0;k<profile.cargo;k++){var x=s.L*(.02+(k%3)*.045),z=(k%2?1:-1)*s.W*.22;barrel(g,x,z,deck(x)+.1,Math.min(1.65,s.W*.035));}
        [-.12,.28].forEach(function(v){coil(g,s.L*v,-s.W*.19,deck(s.L*v)+.3,1.25);});
        bollard(g,s.L*.34,s.W*.12,deck(s.L*.34));
      }
      // 돛대의 감긴 끈과 철제 밑동. 큰 배에는 작은 도르래도 붙인다.
      s.masts.forEach(function(mx){var y=s.hull==='raft'?ship.raftDeck:deck(mx);
        for(var k=0;k<3;k++)ring(g,mx,y+1+k*.35,0,1.15,rope,'y');
        if(s.cap>=250)[1,-1].forEach(function(side){var u=h.U(mx-3,h.H),yy=h.sheer(u),z=side*(h.half(u,yy)+.5);ring(g,mx-3,yy+1,z,.6,dark);rod(g,[mx-3,yy+1,z],[mx-1,y+s.heights[0]*.42,side*.7],.11,rope);});
      });return g;
    };
    ship.artProfile=profile;return ship;
  }};
})(window);
