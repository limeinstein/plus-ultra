/* 거북선 전용 상부 구조. 사용자 복원선 사진의 용두·방패벽·두 돛 배치를 따른다. */
(function(root){'use strict';
  var PI=Math.PI;
  function roof(ship,c,t,a){
    var h=ship.h,u=c.roofStart+(c.roofEnd-c.roofStart)*t,y=h.sheer(u)+h.H*c.wallHeight;
    return [h.X(u,y),y+Math.sin(a)*h.H*c.roofRise*(.82+.18*Math.sin(PI*t)),-Math.cos(a)*h.half(u,y)*1.035];
  }
  root.TurtleDetail={prepare:function(ship,c){
    ship.turtleDetail=true;
    // 공유 선종 자료는 복사한다. 선체의 길이·폭·건현은 건드리지 않는다.
    var top=0;for(var i=0;i<=40;i++)top=Math.max(top,roof(ship,c,i/40,PI/2)[1]);
    var s=Object.assign({},ship.s);s.masts=c.mastX.map(function(x){return x*s.L;});
    s.heights=c.sailHeight.map(function(h){return top+c.sailClearance+h+4-s.H;});
    ship.s=s;ship.h.s=s;ship.turtleRoofTop=top;ship.turtleSailBase=top+c.sailClearance;
  },enrich:function(ship,T,c){
    var s=ship.s,h=ship.h,M=ship.M,C=ship.C;
    function color(v){return new T.Color(v).convertSRGBToLinear();}
    function mat(v,r){return new T.MeshStandardMaterial({color:color(v),roughness:r||.8,side:T.DoubleSide});}
    var carved=mat('#ab977d',.78),edge=mat('#302820'),tooth=mat('#d5c49f'),inside=mat('#171613'),tongue=mat('#40312a'),eye=mat('#b8aa7e');
    // 통나무를 깎은 용두에는 선체 판재 이음이 나타나지 않도록 잔결만 따로 만든다.
    var woodCanvas=document.createElement('canvas');woodCanvas.width=woodCanvas.height=256;var wg=woodCanvas.getContext('2d');
    wg.fillStyle='#81715d';wg.fillRect(0,0,256,256);wg.lineWidth=.5;
    for(var j=0;j<160;j++){wg.strokeStyle=j%3?'rgba(26,21,17,.10)':'rgba(198,172,130,.08)';wg.beginPath();
      for(var i=0;i<=24;i++){var xx=i*256/24,yy=j*1.65+Math.sin(i*.3+j*.41)*2.4;if(i)wg.lineTo(xx,yy);else wg.moveTo(xx,yy);}wg.stroke();}
    var woodTex=new T.CanvasTexture(woodCanvas);woodTex.encoding=T.sRGBEncoding;woodTex.wrapS=woodTex.wrapT=T.RepeatWrapping;woodTex.anisotropy=8;
    carved.color.copy(color('#6f6a60'));carved.map=woodTex;carved.bumpMap=woodTex;carved.bumpScale=.035;
    var relief=carved.clone();relief.color.copy(color('#867d70'));
    var frame=mat('#4d3526'),panel=M.inner,roofMat;
    function mesh(g,geo,m,p,role){var o=new T.Mesh(geo,m);if(p)o.position.fromArray(p);o.castShadow=o.receiveShadow=true;if(role)o.userData.turtleRole=role;g.add(o);return o;}
    function box(g,p,size,m,role){return mesh(g,new T.BoxGeometry(size[0],size[1],size[2]),m,p,role);}
    function ball(g,p,size,m,role){var o=mesh(g,new T.SphereGeometry(1,14,10),m,p,role);o.scale.fromArray(size);return o;}
    function rod(g,a,b,r,m,tip){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),d=B.clone().sub(A);
      var o=mesh(g,new T.CylinderGeometry(tip==null?r:tip,r,d.length(),8),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
    function curve(g,pts,r,m,end,role,quality){
      var path=new T.CatmullRomCurve3(pts.map(function(p){return new T.Vector3().fromArray(p);})),n=quality===true?24:quality||12,sides=quality===true?10:7,geo=new T.TubeGeometry(path,n,r,sides,false);
      if(end!=null){var p=geo.attributes.position;for(var i=0;i<=n;i++){var center=path.getPointAt(i/n),k=1+(end/r-1)*i/n;
        for(var j=0;j<=sides;j++){var idx=i*(sides+1)+j;p.setXYZ(idx,center.x+(p.getX(idx)-center.x)*k,center.y+(p.getY(idx)-center.y)*k,center.z+(p.getZ(idx)-center.z)*k);}}geo.computeVertexNormals();}
      return mesh(g,geo,m,null,role);
    }
    function ring(g,p,r,m,thick){var o=mesh(g,new T.TorusGeometry(r,thick||.15,5,20),m,p);o.rotation.x=PI/2;return o;}
    function grid(g,nu,nv,fn,m,role){var p=[],uv=[],ids=[];
      for(var j=0;j<=nv;j++)for(var i=0;i<=nu;i++){p.push.apply(p,fn(i/nu,j/nv));uv.push(i/nu,j/nv);}
      for(var j=0;j<nv;j++)for(var i=0;i<nu;i++){var a=j*(nu+1)+i;ids.push(a,a+1,a+nu+1,a+1,a+nu+2,a+nu+1);}
      var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();return mesh(g,geo,m,null,role);
    }
    // 길이 방향 덮개 판재와 이음. 이전의 큰 반구보다 낮고 긴 지붕을 만든다.
    var cv=document.createElement('canvas');cv.width=cv.height=512;var ctx=cv.getContext('2d'),rng=root.Ship3DTex.rng(81);
    ctx.fillStyle='#737971';ctx.fillRect(0,0,512,512);
    for(var j=0;j<16;j++)for(var i=0;i<8;i++){
      ctx.fillStyle='rgba(23,31,29,'+(.04+rng()*.14)+')';ctx.fillRect(i*64,j*32,64,32);
      ctx.fillStyle='rgba(22,30,28,.45)';ctx.fillRect(i*64,j*32,64,1.5);ctx.fillRect(i*64,j*32,1.2,32);
      ctx.fillStyle='rgba(222,220,194,.3)';ctx.fillRect(i*64+3,j*32+3,1.3,26);
      ctx.fillStyle='#3c433e';ctx.fillRect(i*64+6,j*32+5,2,2);ctx.fillRect(i*64+56,j*32+26,2,2);
    }
    var tx=new T.CanvasTexture(cv);tx.encoding=T.sRGBEncoding;tx.anisotropy=8;
    roofMat=new T.MeshStandardMaterial({map:tx,bumpMap:tx,bumpScale:.14,roughness:.9,side:T.DoubleSide});
    function dragon(parent){
      var g=new T.Group();g.userData.turtleRole='dragon';parent.add(g);
      var front=roof(ship,c,1,0),baseY=front[1]-h.H*.36;
      g.position.set(front[0]+1.3,baseY,0);g.scale.setScalar(c.dragonScale);
      // 단면을 이어 코부터 이마까지 한 덩어리로 깎는다. 둥근 코를 따로 붙이지 않는다.
      function loft(parent,sections,m,role){
        var path=new T.CatmullRomCurve3(sections.map(function(p){return new T.Vector3(p[0],p[1],p[2]);})),width=new T.CatmullRomCurve3(sections.map(function(p){return new T.Vector3(p[3],0,0);}));
        return grid(parent,48,24,function(u,v){var p=path.getPoint(u),w=Math.max(.015,width.getPoint(u).x),a=v*PI*2,sy=Math.sin(a),sz=Math.cos(a);
          return[p.x,p.y+Math.sign(sy)*Math.pow(Math.abs(sy),.65)*Math.max(.015,p.z),Math.sign(sz)*Math.pow(Math.abs(sz),.65)*w];},m,role);
      }
      // 볼의 비늘·눈썹·수염은 면적과 볼륨이 있는 양각. 가는 선을 붙인 장식과 구분한다.
      function plaque(parent,outline,z,side,bulge,m,role){
        var path=new T.CatmullRomCurve3(outline.map(function(p){return new T.Vector3(p[0],p[1],0);}),true,'centripetal'),center=new T.Vector3();
        outline.forEach(function(p){center.x+=p[0]/outline.length;center.y+=p[1]/outline.length;});
        var o=grid(parent,32,4,function(u,v){var p=path.getPoint(u);return[center.x+(p.x-center.x)*v,center.y+(p.y-center.y)*v,side*(z+bulge*(1-v*v))];},m,role);
        grid(parent,32,1,function(u,v){var p=path.getPoint(u),r=1+.025*v;return[center.x+(p.x-center.x)*r,center.y+(p.y-center.y)*r,side*(z-.025*v)];},edge,'carving-groove');return o;
      }
      function carve(parent,pts,r,end,role,m){return curve(parent,pts,r,m||relief,end,role,role==='tooth'?8:true);}
      // 굵은 목의 앞쪽에는 겹치는 배 비늘, 뒤·옆에는 방패 모양 비늘을 둔다.
      box(g,[-.9,1,0],[3.6,6,6.4],frame,'dragon-mount');
      function neckPoint(a,y,extra){var t=y/12.5,r=2.95-.45*t+extra,cs=Math.cos(a),t4=Math.pow(t,4);return[t*t-1.7*t4+r*cs*(1-.42*t4*Math.max(0,cs)),y,r*.93*Math.sin(a)];}
      grid(g,32,24,function(u,v){return neckPoint(u*PI*2,v*12.6,0);},carved,'dragon-neck');
      grid(g,32,1,function(u,v){var p=neckPoint(u*PI*2,12.6,0);return[-.75+(p[0]+.75)*v,p[1],p[2]*v];},carved);
      for(var j=0;j<6;j++)(function(j){
        grid(g,28,5,function(u,v){var a=(u-.5)*PI*1.38,y=.35+j*1.88+v*1.88-.18*Math.cos(a);return neckPoint(a,y,.1+.16*(1-v)+.06*Math.sin(v*PI));},relief,'neck-scute');
        var seam=[];for(var i=0;i<=24;i++){var a=(i/24-.5)*PI*1.38;seam.push(neckPoint(a,.35+j*1.88-.18*Math.cos(a),.27));}curve(g,seam,.065,edge);
      })(j);
      [-1,1].forEach(function(side){for(var j=0;j<3;j++){
        var y=7.4+j*1.55;plaque(g,[[-1.7,y+1.4],[.2,y+1.0],[.8,y-.05],[-.6,y-.45],[-2.2,y+.2]],2.35,side,.22,carved,'neck-scale');
      }});
      var head=new T.Group();head.position.set(1.65,12.3,0);head.userData.turtleRole='dragon-head';g.add(head);
      loft(head,[[-3.8,1.7,.02,.02],[-3.1,1.7,2.0,2.0],[-1.6,2.05,2.4,2.55],[0,2.65,1.65,2.5],[1.5,2.68,1.1,2.12],[3.4,2.98,.98,1.9],[5.2,3.55,1.08,2.12],[6.4,3.98,1.1,2.2],[7.05,3.9,.86,1.9],[7.32,3.8,.04,.03]],carved,'upper-jaw');
      loft(head,[[-3.35,.25,.02,.02],[-2.5,-.15,1.55,2.25],[-1,-1.1,.87,2.42],[1,-1.65,.56,2.25],[3.4,-1.55,.48,2.05],[5.4,-1.24,.55,2.12],[6.55,-.88,.65,1.85],[7,-.7,.03,.03]],carved,'lower-jaw');
      ball(head,[2.35,-1.15,0],[3.5,.24,1.54],tongue,'tongue');
      // 입 안쪽은 오목한 면으로 만들어 정면에서도 어두운 목구멍이 보인다.
      grid(head,24,12,function(u,v){var a=(u-.5)*PI,y=-1.25+v*3;return[-.55-Math.cos(a)*.9,y,Math.sin(a)*1.72];},inside,'mouth-cavity');
      [-1,1].forEach(function(side){
        // 이어진 C자 입가와 코의 날개. 정면에도 위·아래 턱 사이가 열린다.
        carve(head,[[6.85,3.12,side*1.35],[5.6,2.68,side*1.75],[3.4,2.11,side*1.68],[1.4,1.72,side*1.84],[-.4,1.2,side*2.16],[-.83,.0,side*2.39],[.1,-.8,side*2.24],[2.5,-1.12,side*2.0],[5.5,-.79,side*2.0],[6.6,-.37,side*1.45]],.23,.18,'mouth-rim');
        carve(head,[[6.5,4.1,side*1.76],[5.95,4.47,side*1.95],[5.3,4.29,side*1.91],[5.0,3.88,side*2.02]],.23,.12,'nose-wing');
        var nostril=ball(head,[5.73,4.13,side*2.05],[.52,.25,.12],inside,'nostril');nostril.rotation.z=.25;
        // 눈 윤곽을 뾰족하게 잡고 눈두덩에서 긴 눈썹을 뒤로 흘린다.
        plaque(head,[[-1.22,3.13],[-.55,3.72],[.55,3.64],[1.55,2.92],[.53,2.58],[-.61,2.67]],2.42,side,.13,inside,'eye-socket');
        plaque(head,[[-.83,3.11],[-.26,3.46],[.51,3.39],[1.12,2.98],[.42,2.77],[-.36,2.86]],2.56,side,.14,eye,'eye');
        ball(head,[.32,3.13,side*2.73],[.22,.32,.07],inside,'pupil');
        plaque(head,[[1.6,3.01],[.66,3.95],[-.65,4.16],[-2.45,4.04],[-3.85,4.75],[-3.26,3.64],[-1.35,3.47],[.25,3.56]],2.43,side,.32,relief,'brow');
        plaque(head,[[.65,3.95],[-.5,4.37],[-2.0,4.48],[-3.7,5.02],[-3.0,4.11],[-1.45,3.99]],2.08,side,.22,carved,'brow-flame');
        plaque(head,[[-.55,4.3],[-1.4,4.62],[-2.5,4.63],[-3.8,5.2],[-3.18,4.46],[-2.2,4.24]],1.62,side,.20,relief,'brow-flame');
        // 불꽃 모양 갈기를 겹쳐 넓은 볼에서 뒤통수까지 연결한다.
        for(var k=0;k<3;k++){
          var y=2.8-k*.77;plaque(head,[[-.55,y],[-1.6,y+.47],[-3.15,y+.63],[-4.75-k*.15,y+1.42],[-3.85,y+.02],[-2.12,y-.42]],2.42-k*.09,side,.26,carved,'cheek-scale');
        }
        plaque(head,[[-1.5,.45],[-2.0,1.05],[-3.05,.82],[-4.62,1.22],[-4.0,.1],[-2.8,-.52],[-2,-.2]],2.64,side,.3,relief,'ear');
        carve(head,[[-2.0,.48,side*2.95],[-2.9,.52,side*3.03],[-3.65,.68,side*2.95]],.075,.03,'ear-fold',edge);
        // 뿔은 굵은 밑동에서 뒤로 뻗어 세 갈래로 갈라진다.
        carve(head,[[-2.3,2.8,side*1.85],[-3.8,3.2,side*2.7],[-5.3,3.65,side*3.3],[-7.15,4.65,side*3.65],[-8.15,6.25,side*3.7]],.79,.035,'horn',carved);
        carve(head,[[-4.3,3.35,side*2.95],[-4.8,4.55,side*3.05],[-5.05,5.8,side*3.1],[-5.65,6.5,side*3.1]],.43,.025,'horn-tine',carved);
        carve(head,[[-6,4.05,side*3.45],[-6.2,5.1,side*3.5],[-6.5,6.0,side*3.5]],.33,.02,'horn-tine',carved);
        // 코 수염을 입 바깥으로 흘려 이빨이 드러나게 한다.
        carve(head,[[5.2,3.0,side*2.0],[4.6,2.6,side*2.45],[3,2.55,side*2.8],[1.5,2.7,side*3.0],[.5,2.9,side*3.2]],.17,.025,'whisker');
        // 작은 이빨과 굽은 송곳니의 뿌리를 잇몸 안에 묻는다.
        for(var k=0;k<8;k++){
          var x=.35+k*.73,y=1.57+Math.max(0,x-1.5)*.25,z=side*(1.8-Math.max(0,x-1)*.027);
          carve(head,[[x,y,z],[x+.06,y-.26,z],[x-.07,y-.57,z*.98]],.16,.015,'tooth',tooth);
          var yy=-1.05+Math.max(0,x-2.5)*.08;carve(head,[[x+.14,yy,z],[x+.18,yy+.24,z],[x+.07,yy+.51,z*.98]],.16,.015,'tooth',tooth);
        }
        carve(head,[[5.86,2.95,side*1.67],[5.7,2.23,side*1.72],[5.4,1.53,side*1.69],[5.06,1.12,side*1.58]],.36,.02,'fang',tooth);
        carve(head,[[4.9,-.83,side*1.72],[4.94,-.17,side*1.78],[4.6,.27,side*1.73]],.3,.02,'fang',tooth);
        // 아래턱 가장자리에 폭이 넓고 끝이 뾰족한 조각 수염을 잇는다.
        for(var k=0;k<6;k++){
          var x=-.5+k*.95,y=-1.6+Math.max(0,x-2.7)*.1;plaque(head,[[x-.7,y+.05],[x+.3,y+.02],[x+.55,y-.5],[x-.22,y-1.25],[x-.7,y-.6]],2.04-Math.abs(x-1.9)*.035,side,.2,carved,'beard');
        }
      });
      // 코끝의 좌우를 잇는 주름과 앞니도 같은 입체 모형에 붙인다.
      carve(head,[[6.85,3.12,-1.35],[7.2,3.19,0],[6.85,3.12,1.35]],.23,.23,'upper-lip');
      carve(head,[[6.6,-.37,-1.45],[6.83,-.34,0],[6.6,-.37,1.45]],.23,.23,'lower-lip');
      for(var j=-1;j<=1;j+=2){carve(head,[[6.9,3.15,j*.65],[6.95,2.68,j*.64],[6.75,2.39,j*.61]],.24,.02,'tooth',tooth);carve(head,[[6.55,-.44,j*.6],[6.61,-.02,j*.61],[6.48,.18,j*.61]],.2,.015,'tooth',tooth);}
      // 정수리의 낮은 능선을 이마와 이어진 볼륨으로 만든다.
      loft(head,[[-3.25,3.5,.02,.02],[-2.55,4.0,.3,.8],[-1.35,4.4,.22,.74],[-.45,4.14,.18,.6],[.5,3.7,.02,.02]],relief,'forehead-crest');
    }
    ship.up_turtle=function(g){
      var lo=c.roofStart,hi=c.roofEnd;
      [1,-1].forEach(function(side){
        grid(g,28,2,function(t,v){var u=lo+(hi-lo)*t,y=h.sheer(u)-h.bul+v*(h.bul+h.H*c.wallHeight);return[h.X(u,y),y,side*(h.half(u,y)*1.03)];},panel,'shield-wall');
        var eave=[];for(var j=0;j<=28;j++)eave.push(roof(ship,c,j/28,side>0?PI:0));curve(g,eave,.48,frame);
        for(var j=0;j<=10;j++){var u=lo+(hi-lo)*j/10,y=h.sheer(u),top=y+h.H*c.wallHeight,x=h.X(u,top),z=side*h.half(u,top)*1.035;
          rod(g,[x,y-h.bul,z],[x,top,z],.42,frame);
          if(j<10){var v=u+(hi-lo)/20,yy=h.sheer(v),xx=h.X(v,yy+h.H*.26),zz=side*(h.half(v,yy+h.H*.26)*1.034+.12);
            var port=mesh(g,new T.CircleGeometry(1.1,12),inside,[xx,yy+h.H*.24,zz],'gun-port');if(side<0)port.rotation.y=PI;
            var rim=mesh(g,new T.TorusGeometry(1.2,.16,5,12),frame,[xx,yy+h.H*.24,zz+side*.08]);
            var ventY=yy+h.H*c.wallHeight-1.6;box(g,[h.X(v,ventY),ventY,side*(h.half(v,ventY)*1.035+.12)],[5.2,1.55,.35],inside,'vent');
          }
        }
      });
      // 앞뒤 방패벽의 둥근 박공과 가로 골조.
      [0,1].forEach(function(t){var face=roof(ship,c,t,0),u=lo+(hi-lo)*t,base=h.sheer(u)-h.bul,pts=[face[0],base,0],ids=[];
        for(var j=0;j<=18;j++)pts.push.apply(pts,roof(ship,c,t,PI*j/18));
        for(var j=0;j<18;j++)ids.push(0,j+1,j+2);
        pts.push(face[0],base,-face[2],face[0],base,face[2]);ids.push(0,1,21,0,19,20);
        var uv=[];for(var j=0;j<pts.length;j+=3)uv.push((pts[j+2]/Math.abs(face[2])+1)*.5,(pts[j+1]-base)/(face[1]+h.H*c.roofRise-base));
        var geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();mesh(g,geo,panel,null,'end-wall');
        var x=face[0]+(t? .25:-.25),w=Math.abs(face[2]);
        [-.7,0,.7].forEach(function(k){rod(g,[x,base,k*w],[x,face[1]+(k?1.5:h.H*c.roofRise),k*w],.5,frame);});
        rod(g,[x,base+.5,-w],[x,base+.5,w],.65,frame);rod(g,[x,face[1]-2.8,-w],[x,face[1]-2.8,w],.42,frame);
      });
      grid(g,36,16,function(t,v){return roof(ship,c,t,PI*v);},roofMat,'roof');
      [.25,.5,.75].forEach(function(t){var pts=[];for(var j=0;j<=16;j++)pts.push(roof(ship,c,t,PI*j/16));curve(g,pts,.17,frame);});
      var spikes=new T.InstancedMesh(new T.ConeGeometry(.32,1.65,5),C.spike,88),matrix=new T.Matrix4(),quat=new T.Quaternion(),scale=new T.Vector3(1,1,1),count=0;
      for(var j=1;j<=11;j++)for(var k=1;k<=8;k++){var t=j/12,a=k*PI/9,p=new T.Vector3().fromArray(roof(ship,c,t,a)),n=new T.Vector3(0,Math.sin(a),-Math.cos(a)).normalize();p.addScaledVector(n,.7);quat.setFromUnitVectors(new T.Vector3(0,1,0),n);spikes.setMatrixAt(count++,matrix.compose(p,quat,scale));}
      spikes.castShadow=spikes.receiveShadow=true;spikes.userData.turtleRole='roof-spikes';g.add(spikes);
      s.masts.forEach(function(mx){var u=h.U(mx,h.H),t=(u-lo)/(hi-lo),p=roof(ship,c,t,PI/2),y=p[1];
        box(g,[mx,y+.25,0],[5,.65,5],frame,'mast-collar');ring(g,[mx,y+.75,0],1.5,C.rope,.18);
      });dragon(g);
    };
    // 이 전용 돛도 공용 모션 어댑터가 천·돛살·테두리를 함께 갱신한다.
    var batten=ship.batten;
    ship.batten=function(g,mx,mh,H0,st,style,i){
      batten.apply(this,arguments);var group=g.children[g.children.length-1],cloth=group.children[0],material=cloth.material;
      group.children.slice().forEach(function(o){group.remove(o);o.geometry.dispose();});
      var width=s.W*c.sailWidth[i],bottom=ship.turtleSailBase,ht=c.sailHeight[i],n=c.sailPanels;
      grid(group,14,n*3,function(u,v){return[(.47-u)*width,bottom+v*ht+(u-.5)*v*1.4,.9];},material,'sail');
      for(var k=0;k<=n;k++){var v=k/n;rod(group,[width*.47+.6,bottom+ht*v-.7*v,.9],[-width*.53-.6,bottom+ht*v+.7*v,.9],k===0||k===n?.55:.3,k===n?C.spar:C.batten);}
      group.position.x=mx;group.userData.sailBaseYaw=c.sailYaw;group.userData.sailPanels=n;group.rotation.y=c.sailYaw;
    };
    ship.buildRig=function(st){var g=new T.Group();
      s.masts.forEach(function(mx,i){var top=s.H+s.heights[i],base=ship.turtleRoofTop;
        rod(g,[mx,h.H,0],[mx,top,0],1.1,C.mast,.64);
        [base+1,base+2].forEach(function(y){ring(g,[mx,y,0],1.18,C.rope,.16);});
        [-1,1].forEach(function(side){rod(g,[mx,top-2,side*.5],[mx-7,base-4,side*s.W*.32],.13,C.rope);});
        var ax=i===0?s.L*.39:s.masts[0];rod(g,[mx,top-1,0],[ax,base+1,0],.13,C.rope);
        ship.batten(g,mx,s.heights[i],s.H,st,'kr',i);
      });return g;
    };
    return ship;
  }};
})(window);
