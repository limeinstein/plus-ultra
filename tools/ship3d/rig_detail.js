/* 선종별 범장. 선체 자료를 복사하고 지붕·선루 위에 실제 돛의 아래 끝을 배치한다. */
(function(root){'use strict';
  var PI=Math.PI,mix=function(a,b,t){return a+(b-a)*t;};
  root.RigDetail={prepare:function(ship,c){
    var p=c.profiles[ship.s.id];if(!p)throw new Error('범장 프로필 누락: '+ship.s.id);
    ship.rigPlan=p;ship.rigConfig=c;
    if(ship.s.id==='geobukseon')return;
    var s=Object.assign({},ship.s);s.masts=p.map(function(m){return m[0]*s.L;});s.heights=p.map(function(m){return m[1]*s.L;});
    s.sails=p.map(function(m){return m[2];});ship.s=s;ship.h.s=s;
  },enrich:function(ship,T){
    if(ship.turtleDetail)return ship;
    var s=ship.s,h=ship.h,C=ship.C,c=ship.rigConfig,plan=ship.rigPlan,levels=[],houses=[];
    function mesh(g,geo,m,p){var o=new T.Mesh(geo,m);if(p)o.position.fromArray(p);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
    function rod(g,a,b,r,m,tip){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),d=B.clone().sub(A);
      var o=mesh(g,new T.CylinderGeometry(tip==null?r:tip,r,d.length(),6),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
    function block(g,p,r){
      var b=new T.Group();b.position.fromArray(p);b.userData.rigBlock=true;g.add(b);
      [-1,1].forEach(function(side){var cheek=mesh(b,new T.SphereGeometry(1,10,7),ship.M.mid,[0,0,side*r*.42]);cheek.scale.set(r,r*1.45,r*.25);});
      var wheel=mesh(b,new T.CylinderGeometry(r*.65,r*.65,r*.65,10),C.rope);wheel.rotation.x=PI/2;
      rod(b,[0,0,-r*.78],[0,0,r*.78],r*.15,C.iron);
      var strop=mesh(b,new T.TorusGeometry(r*1.06,r*.13,4,12),C.rope);strop.scale.y=1.45;return b;
    }
    function deadeyes(g,x,y,z,side,r){
      var d=new T.Group();d.position.set(x,y,z);d.userData.rigDeadeye=true;g.add(d);
      [0,r*3.4].forEach(function(yy){var disk=mesh(d,new T.CylinderGeometry(r,r,r*.48,12),ship.M.dark,[0,yy,0]);disk.rotation.x=PI/2;
        for(var k=0;k<3;k++){var a=-PI/2+k*PI*2/3,xx=Math.cos(a)*r*.46,dy=Math.sin(a)*r*.46;
          var hole=mesh(d,new T.CircleGeometry(r*.15,6),C.hole,[xx,yy+dy,side*r*.26]);if(side<0)hole.rotation.y=PI;}
      });
      for(var k=0;k<3;k++){var xx=(k-1)*r*.45;rod(d,[xx,r*.35,side*r*.32],[-xx,r*3.05,side*r*.32],.065,C.rope);}
      rod(d,[0,-r*.6,0],[0,-r*4,side*-.6],.14,C.iron);
      return[y+r*3.4,z];
    }
    function grid(g,nu,nv,fn,m){var p=[],uv=[],ids=[];
      for(var j=0;j<=nv;j++)for(var i=0;i<=nu;i++){p.push.apply(p,fn(i/nu,j/nv));uv.push(i/nu,j/nv);}
      for(var j=0;j<nv;j++)for(var i=0;i<nu;i++){var a=j*(nu+1)+i;ids.push(a,a+1,a+nu+1,a+1,a+nu+2,a+nu+1);}
      var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();return mesh(g,geo,m);
    }
    var castle=ship.castle,house=ship.roofHouse;
    ship.castle=function(g,a,b,hc,opt){var o=opt||{};levels.push({a:a,b:b,top:function(u){return(o.base?o.base(u):h.sheer(u))+hc;}});return castle.apply(this,arguments);};
    ship.roofHouse=function(g,x0,x1,hw,y,hh){houses.push({x0:x0-3,x1:x1+3,top:y+hh+Math.min(hw*.5,2.2+hh*.55)+1.5});return house.apply(this,arguments);};
    function deck(x,reach){var y=0;
      for(var k=0;k<=8;k++){var xx=x+(k/8-.5)*2*(reach||0),u=Math.max(0,Math.min(1,h.U(xx,h.H)));y=Math.max(y,h.sheer(u));
        levels.forEach(function(l){if(u>=l.a&&u<=l.b)y=Math.max(y,l.top(u));});
        if(s.hull==='panok')y=Math.max(y,h.sheer(u)+h.H*.95);
        if(s.hull==='atake')y=Math.max(y,h.sheer(u)+h.H*1.05);
      }
      houses.forEach(function(a){if(x+(reach||0)>a.x0&&x-(reach||0)<a.x1)y=Math.max(y,a.top);});return y;
    }
    ship.rigDeckTop=deck;
    function base(mx,reach){return deck(mx,reach)+c.clearance;}
    function planAt(mx){return plan[s.masts.indexOf(mx)];}
    function reset(g){var mat=g.children.filter(function(o){return o.isMesh&&o.material.map&&o.geometry.attributes.uv;})[0].material;
      g.children.slice().forEach(function(o){g.remove(o);if(o.geometry)o.geometry.dispose();});return mat;}
    // 서양 사각돛: 큰 코스 위에 머리가 좁고 발이 넓은 윗돛. 활대마다 독립된 층이다.
    ship.squareSails=function(g,mx,mh,H0,top,i,nm,st,style,tiers,raft){
      var m=plan[i],jp=m[2]==='jp',bottom=base(mx,s.W*m[4]*.28),height=top-bottom,span=s.W*m[4]*.5;
      var bands=c.bands[m[3]];
      bands.forEach(function(b,k){var yT=bottom+height*(m[3]===1&&s.hull==='west'&&s.cap>=150?.83:b[0]),yB=bottom+height*b[1],spT=span*b[2],spB=span*b[3];
        var yard=new T.Group();yard.position.x=mx;yard.userData.rigYard=true;yard.userData.yardY=yT;g.add(yard);
        rod(yard,[c.sailOffset,yT+.55,-spT*1.06],[c.sailOffset,yT+.55,spT*1.06],k?.42:.64,C.spar).userData.rigYardSpar=true;
        // 돛머리 묶음과 중앙 도르래. 활대와 같은 그룹이어서 방향을 바꿀 때 함께 돈다.
        for(var z=-spT*.94;z<=spT*.94;z+=Math.max(2.5,spT*.15)){
          var tie=mesh(yard,new T.TorusGeometry(k?.48:.69,.08,4,8),C.rope,[c.sailOffset,yT+.55,z]);
          rod(yard,[c.sailOffset,yT+.2,z],[c.sailOffset,yT-.35,z],.08,C.rope);
        }
        block(yard,[c.sailOffset+.2,yT+1.45,0],c.blockRadius);
        // 활대 들줄: 돛대 중심에서 활대 끝으로 연결한다.
        [-1,1].forEach(function(side){rod(yard,[0,Math.min(top,yT+height*.18),0],[c.sailOffset,yT+.55,side*spT*1.03],.10,C.rope);});
        var cloth=ship.sqSurface(g,mx,yT,yB,spT,spB,0,st.bill*Math.min(s.W*.22,(yT-yB)*.3),st);
        cloth.userData.sailOffset=c.sailOffset;cloth.userData.squareBoom=jp||raft;cloth.userData.rigTier=k;cloth.userData.rigMast=i;cloth.userData.rigClearance=bottom;
        cloth.userData.sailFoot=(yT-yB)*(k?c.topFoot:c.courseFoot);cloth.userData.sailLeech=c.leech;
        // 서양 코스의 아랫자락에는 활대가 없다. 일본선·뗏목만 아래 활대를 둔다.
        if(jp||raft){var lower=new T.Group();lower.position.x=mx;lower.userData.rigYard=true;lower.userData.lowerSail=cloth;
          rod(lower,[c.sailOffset,yB,-spB],[c.sailOffset,yB,spB],.42,C.spar).userData.rigYardSpar=true;g.add(lower);}
      });
    };
    var lateen=ship.lateen;
    ship.lateen=function(g,mx,mh,H0,st,i){
      lateen.apply(this,arguments);var group=g.children[g.children.length-1],material=reset(group),m=plan[i];
      var width=s.W*m[4],top=H0+mh;width=Math.max(width,(top-base(mx,width*.60))*.95);
      var bottom=base(mx,width*.64),dh=Math.max(24,top-bottom);
      // 긴 대각선 활대. 뒷돛은 선미루 높이에 맞춰 짧게, 갤리는 길고 낮게 둔다.
      var A=[width*.42,bottom+dh*.08],B=[-width*.60,bottom+dh*.96],D=[-width*.45,bottom];
      var delta=[B[0]-A[0],B[1]-A[1]];
      rod(group,[A[0]-delta[0]*.035,A[1]-delta[1]*.035,.55],[B[0]+delta[0]*.035,B[1]+delta[1]*.035,.55],.65,C.spar,.36);
      grid(group,22,16,function(u,v){return[mix(mix(A[0],B[0],u),D[0],v),mix(mix(A[1],B[1],u),D[1],v),.9];},material);
      group.userData.trianglePlan={A:A,B:B,C:D,bill:Math.min(width*.16,dh*.15),turn:1.15,xBelly:.08};
      group.userData.rigClearance=bottom;
      rod(group,[0,top,0],[mix(A[0],B[0],.48),mix(A[1],B[1],.48),.55],.12,C.rope);
      var center=[mix(A[0],B[0],.48),mix(A[1],B[1],.48),.55];block(group,[center[0],center[1]+1.1,center[2]],c.blockRadius*1.2);
      for(var k=-2;k<=2;k++){var tie=mesh(group,new T.TorusGeometry(.72,.10,4,10),C.rope,[center[0]+delta[0]*k*.009,center[1]+delta[1]*k*.009,.55]);tie.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(delta[0],delta[1],0).normalize());}
    };
    var batten=ship.batten;
    ship.batten=function(g,mx,mh,H0,st,style,i){
      batten.apply(this,arguments);var group=g.children[g.children.length-1],material=reset(group),m=plan[i],kr=m[2]==='kr';
      var w=s.W*m[4],bottom=base(mx,kr?w*.38:w*.95),top=H0+mh-3,ht=Math.max(24,top-bottom),n=kr?8:7;
      var f=kr?.48:.22,lx=w*f,ax=-w*(1-f),rise=kr?ht*.025:ht*.22;
      grid(group,16,n*3,function(u,v){return[mix(lx,ax,u),bottom+v*(ht-rise+rise*u),.9];},material);
      for(var k=0;k<=n;k++){var v=k/n;rod(group,[lx+.5,bottom+v*(ht-rise),.9],[ax-.5,bottom+v*ht,.9],k===0||k===n?.48:.27,k===n?C.spar:C.batten);}
      group.userData.sailBaseYaw=kr?PI/2:0;group.userData.sailPanels=n;group.userData.rigClearance=bottom;
      group.rotation.y=group.userData.sailBaseYaw;
    };
    var tanja=ship.tanja;
    ship.tanja=function(g,mx,mh,H0,st){
      tanja.apply(this,arguments);var group=g.children[g.children.length-1],material=reset(group),m=planAt(mx),w=s.W*m[4],bottom=base(mx,w*.6),ht=H0+mh-bottom;
      // 기울어진 위·아래 활대 사이에 매단 직조 사각돛. 대나무 정크돛과 구분한다.
      var A=[w*.38,bottom],B=[-w*.62,bottom+ht*.18],D=[w*.60,bottom+ht*.78],E=[-w*.40,bottom+ht*.96];
      grid(group,18,16,function(u,v){return[mix(mix(D[0],E[0],u),mix(A[0],B[0],u),v),mix(mix(D[1],E[1],u),mix(A[1],B[1],u),v),.8];},material);
      rod(group,[A[0],A[1],.8],[B[0],B[1],.8],.48,C.bamboo);rod(group,[D[0],D[1],.8],[E[0],E[1],.8],.48,C.bamboo);
      group.userData.rigClearance=bottom;
    };
    function platform(g,mx,y,r){
      var nest=new T.Group();nest.position.set(mx-r*.20,y,0);nest.userData.rigTop=true;g.add(nest);
      // 승강구는 실제로 뚫고, 판재도 구멍 가장자리에서 끊는다.
      var shape=new T.Shape();shape.absarc(0,0,r,0,PI*2,false);var hole=new T.Path(),x0=-r*.84,x1=-r*.30,z0=-r*.31,z1=r*.31;
      hole.moveTo(x0,z0);hole.lineTo(x0,z1);hole.lineTo(x1,z1);hole.lineTo(x1,z0);hole.closePath();shape.holes.push(hole);
      var geo=new T.ExtrudeGeometry(shape,{depth:.6,bevelEnabled:false,curveSegments:18});geo.rotateX(PI/2);var floor=mesh(nest,geo,ship.M.mid);floor.userData.topFloor=true;floor.userData.topHatch={x0:x0,x1:x1,z0:z0,z1:z1};
      for(var x=-r*.86;x<=r*.86;x+=r*.24){var span=Math.sqrt(r*r-x*x)*.96,parts=x+r*.11>x0&&x-r*.11<x1?[[-span,z0],[z1,span]]:[[-span,span]];
        parts.forEach(function(p){if(p[1]>p[0]){var plank=mesh(nest,new T.BoxGeometry(r*.21,.16,p[1]-p[0]),ship.M.deckc,[x,.08,(p[0]+p[1])/2]);plank.userData.topPlank=true;}});}
      [z0,z1].forEach(function(z){mesh(nest,new T.BoxGeometry(x1-x0+.2,.22,.16),ship.M.dark,[(x0+x1)/2,.16,z]);});
      var height=r*.65;
      for(var k=0;k<c.topRailPosts;k++){var a=k*PI*2/c.topRailPosts,xx=Math.cos(a),zz=Math.sin(a);
        var post=rod(nest,[xx*r*.88,.1,zz*r*.88],[xx*r*1.06,height,zz*r*1.06],.16,ship.M.dark);post.userData.topRailPost=true;
        if(k%2===0)rod(nest,[r*.2,-r*.95,0],[xx*r*.86,-.3,zz*r*.86],.22,C.spar);
      }
      [.65,height].forEach(function(yy){var rr=yy===height?r*1.06:r*.93;
        var rim=mesh(nest,new T.TorusGeometry(rr,.22,5,24),ship.M.dark,[0,yy,0]);rim.rotation.x=PI/2;rim.userData.topRail=true;});
      // 망루 입구까지 이어지는 짧은 승강 사다리. 아래 슈라우드와 시각적으로 연결한다.
      [-1,1].forEach(function(side){rod(nest,[-r*.57,-r*1.6,side*r*.21],[-r*.57,.5,side*r*.21],.12,C.rope);});
      for(var k=0;k<5;k++)rod(nest,[-r*.57,-r*1.45+k*r*.34,-r*.21],[-r*.57,-r*1.45+k*r*.34,r*.21],.12,C.spar);
      // 망루 아래 돛대 볼받침과 위쪽 접합 모자.
      [-1,1].forEach(function(side){mesh(nest,new T.BoxGeometry(r*.55,r*1.45,r*.18),ship.M.dark,[r*.2,-r*.72,side*r*.3]);});
      mesh(nest,new T.BoxGeometry(r*.85,.55,r*.9),ship.M.dark,[r*.20,r*.95,0]).userData.mastCap=true;
    }
    ship.buildRig=function(st){var g=new T.Group(),west=s.hull==='west',raft=s.hull==='raft';
      plan.forEach(function(m,i){var mx=s.masts[i],mh=s.heights[i],top=Math.max(s.H+mh,base(mx,s.W*m[4]*.95)+32),foot=h.deckY(h.U(mx,h.H)),r=Math.max(.65,s.W*.024)*(m[2]==='lat'?.75:1),style=m[2];
        mh=top-s.H;s.heights[i]=mh;
        if(raft||s.hull==='outrigger'){
          [-1,1].forEach(function(side){rod(g,[mx-3,foot,side*s.W*.25],[mx,top,0],.65,C.bamboo,.38);});
          if(!raft)rod(g,[mx+4,foot,0],[mx,top,0],.55,C.bamboo,.35);
        }else{
          rod(g,[mx,foot-.5,0],[mx,top,0],r,C.mast,r*.48);
          for(var j=1;j<6;j++){var y=mix(foot,top*.64,j/6);rod(g,[mx,y-.22,0],[mx,y+.22,0],r*1.05,C.iron);}
        }
        var sq=style==='sq'&&west,bot=base(mx,s.W*m[4]*.28),topY=bot+(top-bot)*(m[3]===3?.54:m[3]===1?.88:.63);
        if(sq&&s.cap>=150){platform(g,mx,topY,r*4.1);if(m[3]===3)platform(g,mx,bot+(top-bot)*.81,r*2.5);}
        // 정크의 자립 돛대에는 서양식 사다리 그물을 복제하지 않는다.
        if(west||s.hull==='galley'||s.hull==='dhow'){
          var count=sq?4:2,yh=sq?topY:top*.76;
          [-1,1].forEach(function(side){var ends=[];
            for(var k=0;k<count;k++){var x=mx-1.5-k*2.2,u=h.U(x,h.H),y=h.sheer(u),z=side*(h.half(u,y)+.9),ey=y+.2;
              if(west){var result=deadeyes(g,x,y+.7,z,side,c.deadeyeRadius);ey=result[0];}
              ends.push([x,ey,z]);rod(g,[mx,yh,side*r*.6],ends[k],.16,C.rope);}
            if(west)mesh(g,new T.BoxGeometry(count*2.2+1,.5,1.8),ship.M.dark,[mx-1.5-(count-1)*1.1,ends[0][1]-c.deadeyeRadius*4,ends[0][2]-side*.3]);
            if(sq)for(var j=1;j<14;j++){var t=j/14,A=ends[0],B=ends[count-1];rod(g,[mix(A[0],mx,t),mix(A[1],yh,t),mix(A[2],side*r*.6,t)],[mix(B[0],mx,t),mix(B[1],yh,t),mix(B[2],side*r*.6,t)],.075,C.rope);}
            if(sq&&m[3]>1)rod(g,[mx,top-2,0],[mx-5,topY+1,side*r*2.5],.11,C.rope);
          });
          var end=i?[s.masts[i-1],s.H+s.heights[i-1]*.43,0]:ship.sprit?ship.sprit.b:[s.L*.46,h.sheer(.95)+1,0];
          rod(g,[mx,top-2,0],end,.13,C.rope);
        }else if(style==='kr'||style==='jp'){
          [-1,1].forEach(function(side){rod(g,[mx,top-3,0],[mx-s.L*.09,foot+1,side*s.W*.37],.13,C.rope);});
        }
        if(style==='sq'||style==='jp')ship.squareSails(g,mx,mh,s.H,top,i,plan.length,st,style,false,raft);
        else if(style==='lat')ship.lateen(g,mx,mh,s.H,st,i);
        else if(style==='tanja')ship.tanja(g,mx,mh,s.H,st);
        else ship.batten(g,mx,mh,s.H,st,style==='kr'?'kr':'bat',i);
        mesh(g,new T.SphereGeometry(r*.6,8,6),C.spar,[mx,top+.3,0]);
        if(ship.craftRigMast)ship.craftRigMast(g,mx,foot,top,r,style,i);
      });
      if(ship.sprit&&['carrack','lcarrack','hcarrack','galleon','lgalleon','fluyt','hulk'].indexOf(s.id)>=0){
        var a=ship.sprit.a,b=ship.sprit.b,x=mix(a[0],b[0],.70),y=mix(a[1],b[1],.70)-1,span=s.W*.29;
        var cloth=ship.sqSurface(g,x,y,Math.max(3,y-s.W*.25),span,span*.94,0,s.W*.07,st);cloth.userData.spritsail=true;
        var yard=new T.Group();yard.position.x=x;yard.userData.rigYard=true;yard.userData.yardY=y;yard.userData.braceFactor=.6;g.add(yard);
        rod(yard,[0,y+.5,-span*1.08],[0,y+.5,span*1.08],.42,C.spar).userData.rigYardSpar=true;
        [-1,1].forEach(function(side){rod(yard,[0,y+3,0],[0,y+.5,side*span],.10,C.rope);});
      }
      if(ship.sprit&&['tartane','xebec'].indexOf(s.id)>=0){
        var b=ship.sprit.b,mx=s.masts[0],top=s.H+s.heights[0],bottom=base(mx,2);
        ship.triSurface(g,b,[mx,top*.84,0],[mx+3,bottom,0],s.W*.1,0,mx,ship.artCloth('lat'));
        g.children[g.children.length-1].userData.rigFixed=true;
      }
      return g;
    };
    return ship;
  }};
})(window);
