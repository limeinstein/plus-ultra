/* 박물관 자료를 대조한 세 번째 미술 보강. 구조별 근거는 docs/art/rig3d-references.md. */
(function(root){'use strict';
  root.FleetCraft={enrich:function(ship,T,profile){
    var s=ship.s,h=ship.h,q=ship.q,C=ship.C,M=ship.M,f=profile.family,PI=Math.PI,levels=[],houses=[];
    function mesh(g,geo,m,p,role){var o=new T.Mesh(geo,m);if(p)o.position.fromArray(p);o.castShadow=o.receiveShadow=true;if(role)o.userData.craftRole=role;g.add(o);return o;}
    function box(g,p,size,m,role){return mesh(g,new T.BoxGeometry(size[0],size[1],size[2]),m,p,role);}
    function rod(g,a,b,r,m,role,tip){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),d=B.clone().sub(A),o=mesh(g,new T.CylinderGeometry(tip==null?r:tip,r,d.length(),7),m,null,role);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
    function curve(g,p,r,m,role){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(p.map(function(v){return new T.Vector3().fromArray(v);})),16,r,6,false),m,null,role);}
    function grid(g,nu,nv,fn,m,role){var p=[],uv=[],ix=[];for(var j=0;j<=nv;j++)for(var i=0;i<=nu;i++){p.push.apply(p,fn(i/nu,j/nv));uv.push(i/nu,j/nv);}for(var j=0;j<nv;j++)for(var i=0;i<nu;i++){var a=j*(nu+1)+i;ix.push(a,a+1,a+nu+1,a+1,a+nu+2,a+nu+1);}var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();return mesh(g,geo,m,null,role);}
    function loop(g,p,r,axis,role){var o=mesh(g,new T.TorusGeometry(r,.10,4,12),C.rope,p,role);if(axis==='y')o.rotation.x=PI/2;if(axis==='x')o.rotation.y=PI/2;return o;}
    var castle=ship.castle;ship.castle=function(g,a,b,hc,opt){var o=opt||{};levels.push({a:a,b:b,hc:hc,base:o.base||function(u){return h.sheer(u);}});return castle.apply(this,arguments);};
    function deck(u){var y=h.deckY(u);levels.forEach(function(l){if(u>=l.a&&u<=l.b)y=Math.max(y,l.base(u)+l.hc-1.1);});if(s.hull==='panok')y=h.sheer(u)+h.H*.55;if(s.hull==='atake')y=h.sheer(u)+h.H*.85;return y;}
    function rail(g,a,b,height){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),n=Math.max(3,Math.ceil(A.distanceTo(B)/2.8));
      for(var k=0;k<=n;k++){var p=A.clone().lerp(B,k/n);rod(g,p.toArray(),[p.x,p.y+height,p.z],.15,M.dark,'baluster');}
      [.45,1].forEach(function(v){rod(g,[a[0],a[1]+height*v,a[2]],[b[0],b[1]+height*v,b[2]],.19,M.deckc,'handrail');});
    }
    function ladder(g,x,y,z,height){[-1,1].forEach(function(side){rod(g,[x+height*.5,y-height,z+side*.9],[x,y+.3,z+side*.9],.18,M.dark,'access-ladder');});for(var j=0;j<=Math.ceil(height/.9);j++){var t=j/Math.ceil(height/.9);rod(g,[x+height*.5*t,y-height*t,z-.9],[x+height*.5*t,y-height*t,z+.9],.15,M.deckc);}}
    // 판옥선 연구소 복원도의 장대: 기와집 대신 난간·기둥·가벼운 차양이 열린 공간을 이룬다.
    function pavilion(g,x0,x1,hw,y,hh){
      var length=x1-x0,cx=(x0+x1)/2,roof=y+hh,w=hw*.88;
      box(g,[cx,y+.3,0],[length,.6,w*2],M.deckc,'command-platform');
      [-1,1].forEach(function(side){
        for(var i=0;i<=3;i++){var x=x0+length*i/3;rod(g,[x,y,side*w],[x,roof,side*w],.28,M.dark,'pavilion-post');rod(g,[x,roof-1.5,side*w],[x,roof-.1,side*(w+1.2)],.16,M.deckc,'pavilion-brace');}
        rail(g,[x0,y+.3,side*w],[x1,y+.3,side*w],1.9);
        rod(g,[x0-1.1,roof,side*(w+1.1)],[x1+1.1,roof,side*(w+1.1)],.28,M.dark);
      });
      rail(g,[x0,y+.3,-w],[x0,y+.3,w],1.9);ladder(g,x1,y+.3,w*.55,Math.min(5.2,hh*.7));
      grid(g,12,8,function(u,v){return[x0-1.1+u*(length+2.2),roof+.65*Math.sin(PI*v)+.18*Math.sin(PI*u),(-1+2*v)*(w+1.1)];},ship.artCloth('sq'),'pavilion-canopy');
      for(var i=0;i<5;i++)rod(g,[x0+length*i/4,roof-.12,-w-1.1],[x0+length*i/4,roof-.12,w+1.1],.14,C.spar);
    }
    var house=ship.roofHouse;ship.roofHouse=function(g,x0,x1,hw,y,hh,roof,eave,wall){
      houses.push({x0:x0,x1:x1,hw:hw,y:y,hh:hh});
      if(s.id==='panokseon'){pavilion(g,x0,x1,hw,y,hh);return;}
      house.apply(this,arguments);
      // 지붕 밑 받침과 옆 회랑은 실제 집 치수에 맞춰 만든다.
      if(['junk','japanese','korean','jong'].indexOf(f)>=0){
        [-1,1].forEach(function(side){for(var i=0;i<4;i++){var x=x0+(x1-x0)*(i+.5)/4;rod(g,[x,y+hh-1.6,side*(hw-.2)],[x,y+hh-.3,side*(hw+1.3)],.22,M.dark,'eave-bracket');}
          if(s.id==='atakebune'){box(g,[(x0+x1)/2,y+.1,side*(hw+1.2)],[x1-x0+1,.4,2.7],M.deckc,'yagura-balcony');rail(g,[x0,y+.3,side*(hw+2.35)],[x1,y+.3,side*(hw+2.35)],1.5);}
        });
        if(s.id==='jong'){for(var x=x0;x<=x1;x+=2.2)[-1,1].forEach(function(side){rod(g,[x,y+hh,0],[x,y+hh*.86,side*(hw+1.2)],.12,C.bamboo,'thatch-binding');});}
      }
    };
    function mastFoot(g,mx){
      var u=h.U(mx,h.H),y=deck(u);if(houses.some(function(a){return mx>a.x0-2&&mx<a.x1+2;}))return;
      var r=Math.max(.65,s.W*.024);box(g,[mx,y+.35,0],[r*5.4,.7,r*5.4],M.dark,'mast-step');
      [-1,1].forEach(function(side){box(g,[mx,y+2.1,side*r*1.6],[r*3,4.2,r*.7],M.mid,'mast-cheek');rod(g,[mx,y+2.8,side*r*1.95],[mx,y+2.8,-side*r*1.95],.19,f==='west'?C.iron:M.dark,'mast-pivot');});
      for(var i=0;i<4;i++){var a=i*PI/2;var wedge=box(g,[mx+Math.cos(a)*r*1.15,y+.95,Math.sin(a)*r*1.15],[r*.8,1.3,r*.65],M.deckc,'mast-wedge');wedge.rotation.y=-a;}
      if(s.id==='shachuan')[-1,1].forEach(function(side){rod(g,[mx,y+9,0],[mx-2,y,side*s.W*.30],.43,M.dark,'junk-mast-brace');});
    }
    function gallery(g){
      var u=.1,y=deck(u),x=h.X(u,y),w=h.half(u,y)*.97,len=s.L*.17;
      [-1,1].forEach(function(side){var z=side*(w+1.35);box(g,[x,y-.2,z],[len,.5,3.1],M.deckc,'baghlah-gallery');
        rail(g,[x-len/2,y,side*(w+2.7)],[x+len/2,y,side*(w+2.7)],2.2);
        for(var j=0;j<5;j++){var xx=x-len*.44+len*j*.22;rod(g,[xx,y-3,side*(w-.8)],[xx,y-.4,side*(w+2.6)],.25,M.dark,'gallery-knee');
          var ring=mesh(g,new T.TorusGeometry(.45,.09,4,10),M.deckc,[xx,y+1.05,side*(w+2.73)],'carved-roundel');}
      });
    }
    function sternStage(g){
      var y=deck(.015),x=h.X(0,y),w=h.half(.025,y)*.86,len=Math.min(6,s.L*.045);
      for(var j=0;j<6;j++)box(g,[x-len*.5,y-.15,-w+(j+.5)*w/3],[len,.35,w/3-.12],M.deckc,'stern-working-stage');
      [-1,1].forEach(function(side){rod(g,[x+3,y-2,side*w*.65],[x-len,y-.4,side*w*.85],.3,M.dark,'stage-knee');rail(g,[x,y,side*w],[x-len,y,side*w],1.75);});
      rail(g,[x-len,y,-w],[x-len,y,w],1.75);
      // 큰 중앙 키를 올리는 쌍 기둥과 도르래 축.
      [-1,1].forEach(function(side){rod(g,[x,y,side*2],[x,y+4.2,side*2],.3,M.dark,'rudder-hoist');rod(g,[x,y+3.6,side*2],[x-1,y-h.H*.55,side*.55],.11,C.rope);});
      rod(g,[x,y+4,-2.4],[x,y+4,2.4],.35,C.spar);
    }
    function oarStation(g){
      var n=q.oars||7,apost=ship.apost||0;
      for(var k=0;k<n;k++)[-1,1].forEach(function(side){var x=-s.L*.33+k*s.L*.64/Math.max(1,n-1),u=h.U(x,h.H),y=['panok','turtle','atake'].indexOf(s.hull)>=0?h.sheer(u)*.72:h.sheer(u)-.3,z=side*(h.half(u,y)+apost+.3);
        box(g,[x,y-.65,z],[2.3,.45,1.5],M.dark,'oar-bearing');
        [-1,1].forEach(function(a){rod(g,[x+a*.75,y-.6,z],[x+a*.75,y+.7,z],.15,M.deckc,'thole-pin');});
      });
      if(f==='galley'){for(var j=0;j<7;j++){var x=s.L*(-.29+j*.095),u=h.U(x,h.H),y=h.deckY(u);[-1,1].forEach(function(side){var z=side*(h.half(u,h.H)+apost);rod(g,[x,y-1,side*h.half(u,h.H)*.7],[x,y+.05,z],.22,M.dark,'outrigger-knee');});}}
    }
    function bulwarks(g){
      var height=s.id==='panokseon'?h.H*.95:s.id==='atakebune'?h.H*1.15:s.id==='sekibune'?h.H*.55:h.H*.45,inset=s.id==='panokseon'?1.08:1.035;
      [-1,1].forEach(function(side){for(var j=0;j<12;j++){var u=.1+j*.72/11,y=h.sheer(u)+height*.7,x=h.X(u,y),z=side*(h.half(u,y)*inset+.28);
        if(s.id==='kobaya'){for(var k=-1;k<=1;k++){var xx=x+k*.55;rod(g,[xx,y-height*.55,z],[xx,y+height*.35,z],.2,C.bamboo,'bamboo-shield');}loop(g,[x,y,z],.75,'y','shield-binding');}
        else{box(g,[x,y,z],[1.4,height*.20,.18],C.hole,'arrow-slit');box(g,[x,y+height*.13,z],[1.9,.2,.4],M.dark,'slit-lintel');
          var shutter=box(g,[x+1.1,y,z+side*.18],[.65,height*.28,.22],M.deckc,'slit-shutter');shutter.rotation.y=side*.65;}
      }});
    }
    function western(g){
      // 선미루 외부의 무릎재와 갑판 기둥은 넓은 상선의 높은 성루를 받친다.
      if(['cog','hulk','carrack','lcarrack','hcarrack','fluyt'].indexOf(s.id)>=0)[-1,1].forEach(function(side){for(var j=0;j<6;j++){var u=.04+j*.035,l=levels.find(function(l){return u>=l.a&&u<=l.b;}),y=h.sheer(u),x=h.X(u,y),z=side*(h.half(u,y)+.4);if(!l)return;
        rod(g,[x,y-h.H*.6,z*.92],[x,y+l.hc*.78,z*.98],.38,M.dark,'castle-timber');rod(g,[x+2,y,z*.96],[x,y+l.hc*.4,z],.25,M.deckc,'castle-knee');
      }});
      if(q.guns&&s.id!=='galleon'&&s.id!=='lgalleon')for(var k=0;k<q.guns;k++)[-1,1].forEach(function(side){var size=Math.max(1.6,Math.min(2.7,h.H*.17)),x=-s.L*.22+k*s.L*.48/Math.max(1,q.guns-1),u=h.U(x,h.H*.5),y=h.sheer(u)*.5,z=side*(h.half(u,y)+.2);
        var lid=box(g,[h.X(u,y),y+size*.8,z+side*size*.45],[size*1.18,.25,size*.95],M.mid,'port-lid');lid.rotation.x=-side*.35;
        [-1,1].forEach(function(a){rod(g,[h.X(u,y)+a*size*.34,y+size*.9,z+side*.25],[h.X(u,y)+a*size*.34,y+size*.6,z+side*size*.86],.06,C.rope,'port-lift');});
      });
      // 통로 밖의 목제 펌프와 빌레이 핀. 큰 장식이 없는 배에도 작업 설비를 읽게 한다.
      var mx=s.masts[0],u=h.U(mx-4,h.H),y=deck(u),z=s.W*.18;
      box(g,[mx-4,y+1.5,z],[.9,3,.9],M.dark,'deck-pump');rod(g,[mx-5,y+3.1,z],[mx-2,y+3.8,z],.15,C.spar,'pump-handle');
      [-1,1].forEach(function(side){var zz=side*s.W*.21;box(g,[mx-3,y+2.2,zz],[5,.45,1],M.mid,'pin-rail');[-1,1].forEach(function(a){box(g,[mx-3+a*1.9,y+1.1,zz],[.45,2.2,.45],M.dark);});for(var j=0;j<4;j++){rod(g,[mx-4.5+j,y+1.75,zz],[mx-4.5+j,y+2.9,zz],.14,M.deckc,'belaying-pin');loop(g,[mx-4.5+j,y+1.5,zz+.5],.45,'x','rope-coil');}});
    }
    function lashings(g){
      if(s.hull==='raft'){
        var y=ship.raftDeck,r=s.W/(9*2.05);[-s.L*.25,s.L*.20].forEach(function(x){for(var j=0;j<9;j++){var z=-s.W*.47+j*s.W*.94/8;[-.3,0,.3].forEach(function(off){loop(g,[x+off,r*.6,z],r*1.035,'x','log-lashing');});}});
        // 통나무 사이에서 드러나는 목제 조향판의 손잡이와 쐐기.
        [-.38,.34].forEach(function(v,i){var z=(i?-.12:.12)*s.W;box(g,[s.L*v,r*1.6+1.4,z],[3.5,3.2,.55],M.dark,'steering-board');rod(g,[s.L*v-2,r*1.6+3,z],[s.L*v+2,r*1.6+3,z],.23,M.deckc);});return;
      }
      if(s.hull==='outrigger')[-s.L*.24,s.L*.2].forEach(function(x){var y=h.sheer(h.U(x,h.H))+.6;[-1,1].forEach(function(side){for(var k=-2;k<=2;k++)loop(g,[x+k*.22,y,side*s.W*.52],.7,'x','beam-lashing');rod(g,[x-7,y-1,side*s.W*.5],[x,y,side*s.W*2.25],.3,C.bamboo,'outrigger-strut');});});
      if(s.id==='jong')[-1,1].forEach(function(side){for(var j=0;j<9;j++){var u=.28+j*.06,y=h.sheer(u),x=h.X(u,y),z=side*(h.half(u,y)-.5);rod(g,[x,y,z],[x+1,y+1.7,z*.94],.23,M.dark,'deck-knee');}});
    }
    ship.craftRigMast=function(g,mx,foot,top,r,style){
      if(style==='kr'||style==='jp'){rod(g,[mx,top-2.4,-r*3.3],[mx,top-2.4,r*3.3],.26,C.spar,'masthead-crossbar');[-1,1].forEach(function(side){loop(g,[mx,top-2.4,side*r*2.4],.39,'x','halyard-eye');rod(g,[mx-.65,top-2.4,side*r*2.4],[mx-.65,foot+2,side*r*.8],.08,C.rope,'halyard');});}
      else if(style==='bat'){rod(g,[mx-1.3,top-2,0],[mx+1.3,top-2,0],.3,C.spar,'junk-masthead');[-1,1].forEach(function(side){rod(g,[mx+side*.6,top-2,0],[mx+side*.6,foot+2,.7],.09,C.rope,'junk-halyard');});}
      else if(s.hull==='raft'||s.hull==='outrigger'){for(var j=0;j<5;j++)loop(g,[mx,top-1.5+j*.28,0],.75,'y','bipod-lashing');}
    };
    var base=ship.buildHull;ship.buildHull=function(){levels.length=houses.length=0;var g=base.call(this),details=new T.Group();details.userData.craftFamily=f;g.add(details);
      if(ship.turtleDetail)return g;
      if(s.hull!=='raft'&&s.hull!=='outrigger')s.masts.forEach(function(mx){mastFoot(details,mx);});
      if(f==='west')western(details);
      if(f==='dhow'){if(s.id==='baghlah')gallery(details);var y=h.sheer(1),x=h.X(1,y);curve(details,[[x-.6,y,0],[x+1.5,y+2.5,0],[x+1.3,y+4,0],[x+.3,y+4.4,0]],.45,M.dark,'stem-head');[y+1,y+1.65].forEach(function(yy){loop(details,[x+.45,yy,0],.66,'y','stem-binding');});}
      if(f==='junk')sternStage(details);
      if(['galley','korean','japanese','outrigger'].indexOf(f)>=0)oarStation(details);
      if(f==='japanese'||s.id==='panokseon'||s.id==='maengseon')bulwarks(details);
      if(['jong','outrigger','raft'].indexOf(f)>=0)lashings(details);
      return g;
    };return ship;
  }};
})(window);
