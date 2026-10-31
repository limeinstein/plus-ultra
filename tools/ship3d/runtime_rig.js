/* 제작용 돛을 실시간으로 갱신한다. 선종별 활대·돛살과 노의 좌표를 함께 움직인다. */
(function (root) {
  'use strict';
  var PI = Math.PI;
  function mix(a,b,t){return a+(b-a)*t;}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  root.RuntimeRig = { make: function(ship,T,batch,cfg) {
    var moving=[], sails=[], yards=[], s=ship.s, q=ship.q, rig=ship.buildRig;
    function clothIn(group){return group.children.filter(function(o){return o.isMesh && o.geometry.attributes.uv && o.material.map;})[0];}
    function mark(mesh,kind){mesh.userData.sailKind=kind;mesh.frustumCulled=false;mesh.geometry.attributes.position.setUsage(T.DynamicDrawUsage);}
    var square=ship.sqSurface, squareSails=ship.squareSails;
    ship.sqSurface=function(grp,mx,yT,yB,spT,spB,brace,bill){
      var mesh=square.apply(this,arguments);mark(mesh,'square');
      sails.push({kind:'square',mesh:mesh,yT:yT,yB:yB,spT:spT,spB:spB,bill:bill,brace:1});moving.push(mesh);return mesh;
    };
    ship.squareSails=function(grp){
      var n=grp.children.length, first=sails.length;squareSails.apply(this,arguments);
      grp.children.slice(n).forEach(function(o){if(!o.isGroup)return;
        var lower=null, y=o.children[0].position.y;
        if(o.userData.lowerSail)sails.slice(first).forEach(function(a){if(a.mesh===o.userData.lowerSail)lower=a;});
        sails.slice(first).forEach(function(a){if(Math.abs(a.yB-y)<.1)lower=a;});
        moving.push(o);yards.push({group:o,lower:lower,brace:o.userData.braceFactor||1});
      });
    };
    function triangle(group,mesh,A,B,C,bill,turn,xBelly){
      mark(mesh,'triangle');sails.push({kind:'triangle',group:group,mesh:mesh,A:A,B:B,C:C,bill:bill,turn:turn,xBelly:xBelly});moving.push(group);
    }
    var lateen=ship.lateen;
    ship.lateen=function(grp,mx,mh,H0){
      lateen.apply(this,arguments);var group=grp.children[grp.children.length-1],mesh=clothIn(group);
      if(group.userData.trianglePlan){var p=group.userData.trianglePlan;triangle(group,mesh,p.A,p.B,p.C,p.bill,p.turn,p.xBelly);return;}
      var long=q.rig==='galley'||q.rig==='galleass'||q.rig==='xebec';
      var A=[mh*(long?.62:.5),H0+mh*.14], B=[-mh*(long?.62:.56),H0+mh], C=[-mh*(long?.36:.42),H0+mh*.13];
      if(q.rig==='dhow'||q.rig==='baghlah'){A=[mh*.58,H0+mh*.12];B=[-mh*.5,H0+mh*1.03];C=[-mh*.48,H0+mh*.22];}
      triangle(group,mesh,A,B,C,s.W*.22,1.4,.25);
    };
    var tri=ship.triSurface;
    ship.triSurface=function(grp,p0,p1,p2,amp,brace,pivot){
      tri.apply(this,arguments);var group=grp.children[grp.children.length-1];
      triangle(group,clothIn(group),[p0[0]-pivot,p0[1]],[p1[0]-pivot,p1[1]],[p2[0]-pivot,p2[1]],amp,1,0);
    };
    // 여러 돛살은 같은 원통을 인스턴싱한다. 매 프레임 메시를 만들지 않는다.
    function makeBars(group,bars){
      var bins={};bars.forEach(function(b){var key=b.mat.uuid;(bins[key]||(bins[key]={mat:b.mat,bars:[]})).bars.push(b);});
      var out=[];Object.keys(bins).forEach(function(key){var b=bins[key];
        var segments=6,im=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),b.mat,b.bars.length*segments);
        im.instanceMatrix.setUsage(T.DynamicDrawUsage);im.frustumCulled=false;im.castShadow=im.receiveShadow=true;group.add(im);out.push({mesh:im,bars:b.bars,segments:segments});
      });return out;
    }
    function quadGroup(grp,kind,args,original){
      original.apply(ship,args);var group=grp.children[grp.children.length-1],mesh=clothIn(group),uv=mesh.geometry.attributes.uv,p=mesh.geometry.attributes.position;
      mark(mesh,kind);
      function corner(u,v){for(var i=0;i<p.count;i++)if(Math.abs(uv.getX(i)-u)<.001&&Math.abs(uv.getY(i)-v)<.001)return[p.getX(i),p.getY(i),p.getZ(i)];throw new Error('돛 모서리 누락: '+s.id);}
      var a={kind:kind,group:group,mesh:mesh,corners:[corner(0,0),corner(1,0),corner(0,1),corner(1,1)],mh:args[2],kr:args[5]==='kr',baseYaw:group.userData.sailBaseYaw||0,panels:group.userData.sailPanels};
      var bars=[],children=group.children.slice(),n=kind==='batten'?(a.panels||(a.kr?7:6)):4;
      children.forEach(function(o,i){if(o===mesh)return;
        var v=kind==='batten'?(i-1)/n:i===1?1:i===2?0:1-(i-2)/4;
        bars.push({v:v,mat:o.material,rad:o.geometry.parameters.radiusTop||.3});group.remove(o);o.geometry.dispose();
      });
      a.bars=makeBars(group,bars);sails.push(a);moving.push(group);
    }
    var batten=ship.batten,tanja=ship.tanja;
    ship.batten=function(grp){quadGroup(grp,'batten',arguments,batten);};
    ship.tanja=function(grp){quadGroup(grp,'tanja',arguments,tanja);};
    var staticRig=rig.call(ship,{furl:false,brace:0,bill:1,flutter:0,phase:0}),dynamic=new T.Group();
    // 보조 활대와 지브도 같은 회전·고정 규칙을 적용한다.
    staticRig.children.slice().forEach(function(o){if(o.userData.rigYard&&moving.indexOf(o)<0){moving.push(o);yards.push({group:o,lower:null,brace:o.userData.braceFactor||1});}});
    sails.forEach(function(a){if(a.mesh.userData.spritsail)a.brace=.6;if(a.group&&a.group.userData.rigFixed)a.turn=0;});
    moving.forEach(function(o){
      if(o.userData.rigYard){var parts=new T.Group();o.children.slice().forEach(function(ch){parts.add(ch);});o.add(batch(parts,T));}
      // 라틴 활대의 도르래·묶음도 정적으로 합친다. 천만 별도로 변형한다.
      var triangular=sails.filter(function(a){return a.kind==='triangle'&&a.group===o;})[0];
      if(triangular){var fittings=new T.Group();o.children.slice().forEach(function(ch){if(ch!==triangular.mesh)fittings.add(ch);});o.add(batch(fittings,T));}
      staticRig.remove(o);dynamic.add(o);
    });dynamic.add(batch(staticRig,T));
    // 테두리 줄은 천의 실제 꼭짓점에 묶는다. 선종·돛 수와 관계없이 한 번에 그린다.
    var ties=[],ropeMesh,localMatrix=new T.Matrix4(),tieA=new T.Vector3(),tieB=new T.Vector3();
    sails.forEach(function(a){
      var uv=a.mesh.geometry.attributes.uv;
      [[0,0],[0,1],[1,0],[1,1]].forEach(function(edge){
        // 삼각돛의 v=1은 한 점으로 모이므로 중복된 테두리를 만들지 않는다.
        if(a.kind==='triangle'&&edge[0]===1&&edge[1]===1)return;
        var row=[];for(var i=0;i<uv.count;i++)if(Math.abs((edge[0]?uv.getY(i):uv.getX(i))-edge[1])<.001)row.push(i);
        row.sort(function(i,j){return edge[0]?uv.getX(i)-uv.getX(j):uv.getY(i)-uv.getY(j);});
        for(var j=0;j<row.length-1;j+=2)ties.push({sail:a,a:row[j],b:row[Math.min(j+2,row.length-1)],reef:false});
      });
      if(a.kind==='square'&&s.hull!=='raft'&&s.hull!=='jp'&&s.hull!=='atake'){
        [.22,.41].forEach(function(v){for(var u=.15;u<.9;u+=.14){
          var nearest=0,best=Infinity;for(var i=0;i<uv.count;i++){var d=Math.abs(uv.getX(i)-u)+Math.abs(uv.getY(i)-v);if(d<best){best=d;nearest=i;}}
          ties.push({sail:a,a:nearest,b:nearest,reef:true});
        }});
      }
      // 아랫귀의 조임줄. 바람·접기에 따라 움직이는 천의 실제 꼭짓점에 붙인다.
      function corner(u,v){var best=Infinity,idx=0;for(var k=0;k<uv.count;k++){var d=Math.abs(uv.getX(k)-u)+Math.abs(uv.getY(k)-v);if(d<best){best=d;idx=k;}}return idx;}
      var mx=a.group?a.group.position.x:a.mesh.position.x;
      var x=Math.max(-s.L*.45,Math.min(s.L*.45,mx-s.L*.09)),u=ship.h.U(x,ship.h.H),y=ship.rigDeckTop?ship.rigDeckTop(x,0):ship.h.sheer(u);
      var width=ship.h.half(u,ship.h.H)*.92;
      if(a.kind==='square'&&!a.mesh.userData.spritsail){
        // 윗돛의 아랫귀는 바로 아래 활대 끝에 매단다.
        var below=null;sails.forEach(function(b){if(b.kind==='square'&&Math.abs(b.mesh.position.x-a.mesh.position.x)<.01&&b.yT<a.yB&&(!below||b.yT>below.yT))below=b;});
        [-1,1].forEach(function(side){ties.push({sail:a,a:corner(side<0?0:1,1),b:0,sheet:true,anchor:below?null:[x,y+1,side*width],below:below,side:side});});
      }else if(a.kind==='triangle')ties.push({sail:a,a:corner(0,1),b:0,sheet:true,anchor:[x,y+1,width*.65]});
      else if(a.kind==='batten'||a.kind==='tanja'){
        var sheets=a.kind==='batten'?(a.panels||7):2;
        for(var j=0;j<sheets;j++)ties.push({sail:a,a:corner(1,j/sheets),b:0,sheet:true,anchor:[x,y+1,-width*.6]});
      }
    });
    ropeMesh=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,4,1,true),ship.C.boltRope,ties.length);
    ropeMesh.userData.sailRopes=true;ropeMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);ropeMesh.frustumCulled=false;
    ropeMesh.castShadow=ropeMesh.receiveShadow=true;dynamic.add(ropeMesh);
    var axis=new T.Vector3(0,1,0), va=new T.Vector3(),vb=new T.Vector3(),mid=new T.Vector3(),dir=new T.Vector3(),sc=new T.Vector3(),quat=new T.Quaternion(),mat4=new T.Matrix4();
    function matrixBetween(a,b,r){va.fromArray(a);vb.fromArray(b);dir.subVectors(vb,va);var len=dir.length();mid.addVectors(va,vb).multiplyScalar(.5);quat.setFromUnitVectors(axis,dir.normalize());sc.set(r,len,r);return mat4.compose(mid,quat,sc);}
    function quadPoint(a,u,v,furl,fill,pulse){
      var c=a.corners,edge=a.kind==='batten'?0:1, vv=mix(v,edge,furl*.94);
      var x=mix(mix(c[0][0],c[1][0],u),mix(c[2][0],c[3][0],u),vv);
      var y=mix(mix(c[0][1],c[1][1],u),mix(c[2][1],c[3][1],u),vv),z;
      if(a.kind==='batten'){
        if(!a.kr)x-=Math.sin(PI*vv)*a.mh*.62*.12*u*(1-furl);
        var panels=a.panels||(a.kr?7:6), panel=(v*panels)%1;
        z=.9+s.W*.13*fill*pulse*(1-furl)*(.55*Math.sin(PI*u)+.45*Math.sin(PI*panel)*Math.sin(PI*u*.9+.15));
      }else z=.8+s.W*.2*fill*pulse*(1-furl)*Math.sin(PI*u)*Math.sin(PI*v);
      return [x,y,z];
    }
    // 노받이 위치는 공용 모델의 buildOars와 동일하다.
    var n=q.oars||(['galley','kr','panok','turtle','jp','atake','outrigger'].indexOf(s.hull)>=0?7:0), oars=[];
    var poles,blades;
    if(n){
      poles=new T.InstancedMesh(new T.CylinderGeometry(.3,.32,1,5),ship.C.oar,n*2);
      blades=new T.InstancedMesh(new T.BoxGeometry(2.6,.25,1.1),ship.C.oar,n*2);
      [poles,blades].forEach(function(m){m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=m.receiveShadow=true;dynamic.add(m);});
      var reach=['atake','panok','turtle'].indexOf(s.hull)>=0?.62:s.hull==='outrigger'?.95:.9;
      for(var k=0;k<n;k++)[1,-1].forEach(function(side){
        var x=-s.L*.33+k*s.L*.64/Math.max(1,n-1),u=ship.h.U(x,ship.h.H),y=['panok','turtle','atake'].indexOf(s.hull)>=0?ship.h.sheer(u)*.72:ship.h.sheer(u)-.3;
        oars.push({x:x,y:y,z:side*(ship.h.half(u,y)+(ship.apost||0)+.3),side:side,len:s.W*reach+(y-.5)*.6,phase:k*.42+(side>0?0:.28)});
      });
    }
    function update(spec,t){
      var c=cfg,wind=spec.rig||{},furl=clamp(spec.furl||0,0,1),deploy=mix(c.foldHeight,1,1-furl);
      var fill=clamp(wind.fill==null?.9:wind.fill,.05,1.25),brace=clamp(wind.brace||0,-c.maxBrace,c.maxBrace),luff=clamp(wind.luff||0,0,1);
      var pulse=1+Math.sin(t*c.billRate)*c.billPulse,lee=wind.lee==null?1:wind.lee;
      yards.forEach(function(y){y.group.rotation.y=brace*(y.brace||1);if(y.lower)y.group.position.y=(y.lower.yT-y.lower.yB)*(1-deploy);});
      sails.forEach(function(a,index){
        var p=a.mesh.geometry.attributes.position,uv=a.mesh.geometry.attributes.uv;
        if(a.group)a.group.rotation.y=(a.baseYaw||0)-brace*(a.turn==null?(a.kind==='batten'?1.2:1.5):a.turn);else a.mesh.rotation.y=brace*a.brace;
        for(var i=0;i<p.count;i++){
          var u=uv.getX(i),v=uv.getY(i);
          if(a.kind==='square'){
            u=u*2-1;var boom=a.mesh.userData.squareBoom,edge=Math.pow(Math.abs(u),3),belly=a.bill*fill*pulse*(1-furl)*Math.pow(Math.max(0,1-u*u),.85)*(Math.pow(Math.sin(PI*v),.9)*.82+(boom?0:v*.22));
            var flap=Math.sin(v*7+t*c.flutterRate+u*2+index)*edge*v*c.flutter*(.12+luff)*(1-furl)*(boom?1-v:1),fold=furl*Math.sin(v*PI*8)*c.foldDepth;
            var foot=(boom?0:(a.mesh.userData.sailFoot||c.sailFoot))*(1-u*u)*v*v*(1-furl),crease=Math.sin(u*PI*12+v*1.6)*c.sailCrease*u*u*Math.sin(v*PI)*(1-furl);
            var wrinkle=Math.sin(u*PI*7+v*10+index)*c.sailWrinkle*Math.pow(Math.abs(u),1.5)*Math.sin(PI*v)*(1-furl);
            p.setXYZ(i,(a.mesh.userData.sailOffset||0)+belly+flap+fold+crease+wrinkle,a.yT+(a.yB-a.yT)*v*deploy+foot,u*mix(a.spT,a.spB,v)*(1-(a.mesh.userData.sailLeech||c.sailLeech)*Math.sin(PI*v)*(1-furl)));
          }else if(a.kind==='triangle'){
            var lx=mix(a.A[0],a.B[0],u),ly=mix(a.A[1],a.B[1],u);
            var b=fill*pulse*(1-furl)*a.bill*Math.pow(Math.sin(PI*v),.85)*(.35+.65*Math.sin(PI*u))*(1-.6*v*v);
            var flap=Math.sin(u*8+t*c.flutterRate+index)*v*v*c.flutter*(.12+luff)*(1-furl);
            p.setXYZ(i,mix(lx,a.C[0],v*deploy)-b*a.xBelly,mix(ly,a.C[1],v*deploy),.9+(b+flap)*lee);
          }else{var pt=quadPoint(a,u,v,furl,fill,pulse);p.setXYZ(i,pt[0],pt[1],pt[2]*lee);}
        }
        p.needsUpdate=true;a.mesh.geometry.computeVertexNormals();
        if(a.bars)a.bars.forEach(function(bin){bin.bars.forEach(function(b,k){
          // 휜 돛살도 천의 곡면을 따라간다. 직선으로 잇으면 가운데가 천에 묻힌다.
          for(var j=0;j<bin.segments;j++){
            var A=quadPoint(a,j/bin.segments,b.v,furl,fill,pulse),B=quadPoint(a,(j+1)/bin.segments,b.v,furl,fill,pulse);
            if(j===0)A[0]+=.6;if(j===bin.segments-1)B[0]-=.6;A[2]=(A[2]+.16)*lee;B[2]=(B[2]+.16)*lee;
            bin.mesh.setMatrixAt(k*bin.segments+j,matrixBetween(A,B,b.rad));
          }
        });bin.mesh.instanceMatrix.needsUpdate=true;});
      });
      // 배 전체의 회전·기울기는 부모에 맡기고 돛의 국소 변환만 적용한다.
      var lastSail=null;
      ties.forEach(function(tie,i){var a=tie.sail,p=a.mesh.geometry.attributes.position;
        if(a!==lastSail){a.mesh.updateMatrix();localMatrix.copy(a.mesh.matrix);if(a.group){a.group.updateMatrix();localMatrix.premultiply(a.group.matrix);}lastSail=a;}
        tieA.fromBufferAttribute(p,tie.a);tieB.fromBufferAttribute(p,tie.b);
        if(tie.reef){tieA.x+=c.sailRopeRadius;tieB.x+=c.sailRopeRadius+.22;tieB.y-=c.reefRopeLength*(1-furl*.85);}
        tieA.applyMatrix4(localMatrix);tieB.applyMatrix4(localMatrix);
        if(tie.sheet){
          if(tie.below){var b=tie.below;b.mesh.updateMatrix();tieB.set(b.mesh.userData.sailOffset||0,b.yT+.55,tie.side*b.spT).applyMatrix4(b.mesh.matrix);}
          else tieB.fromArray(tie.anchor);
        }
        dir.subVectors(tieB,tieA);var len=dir.length();mid.addVectors(tieA,tieB).multiplyScalar(.5);
        if(len>.00001)quat.setFromUnitVectors(axis,dir.divideScalar(len));else quat.identity();
        var r=tie.sheet?(ship.rigConfig?ship.rigConfig.sheetRadius:.12):c.sailRopeRadius*(tie.reef?.6:1);sc.set(r,Math.max(len,.00001),r);ropeMesh.setMatrixAt(i,mat4.compose(mid,quat,sc));
      });ropeMesh.instanceMatrix.needsUpdate=true;
      var power=clamp(spec.oarPower==null?(spec.motionSpeed==null?.6:spec.motionSpeed):spec.oarPower,0,1)*(1-furl);
      oars.forEach(function(o,i){
        var ph=t*c.oarRate+o.phase,sweep=Math.sin(ph)*c.oarSweep*power,dx=-Math.sin(sweep)*o.len*.92,dz=Math.cos(sweep)*o.len*.92;
        var yy=mix(.6+(.5+.5*Math.cos(ph))*power*c.oarLift,o.y*.7+1.2,furl),A=[o.x,o.y,o.z],B=[o.x+dx,yy,o.z+o.side*dz];
        poles.setMatrixAt(i,matrixBetween(A,B,1));
        mid.set(B[0]+dx*.04,B[1],B[2]+o.side*dz*.04);quat.setFromAxisAngle(axis,-sweep*o.side);sc.set(1,1,1);blades.setMatrixAt(i,mat4.compose(mid,quat,sc));
      });
      if(n){poles.instanceMatrix.needsUpdate=true;blades.instanceMatrix.needsUpdate=true;}
    }
    update({rig:{fill:1,brace:0}},0);
    return {root:dynamic,update:update,sails:sails,oars:oars.length,sailRopes:ties.length};
  }};
})(window);
