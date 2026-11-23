/* 17세기 추가 선박: 화물 덮개·측면 키·보강 외판·두 층 포열을 각 선형에 맞춘다. */
(function(root){'use strict';
  root.RegionalDetail={enrich:function(ship,T){
    var s=ship.s,h=ship.h,M=ship.M,C=ship.C,id=s.id;
    if(['shipline','sloop','eastindiaman','ketch','koch','jounseon','bezaisen','padewakang','ghurab'].indexOf(id)<0)return ship;
    function box(g,x,y,z,w,ht,d,m,role){var o=new T.Mesh(new T.BoxGeometry(w,ht,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;o.userData.regionalRole=role;g.add(o);return o;}
    function rod(g,a,b,r,m,role){var A=new T.Vector3().fromArray(a),B=new T.Vector3().fromArray(b),v=B.clone().sub(A),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=o.receiveShadow=true;o.userData.regionalRole=role;g.add(o);return o;}
    function deck(x){return h.deckY(h.U(x,h.H));}
    // 상선에 군선의 방패·포루를 붙이지 않는다. 화물 덮개와 선미 작업 공간을 둔다.
    if(id==='bezaisen')ship.up_jp=function(g){
      var x=-s.L*.33,y=deck(x);ship.roofHouse(g,x-s.L*.08,x+s.L*.08,s.W*.28,y,h.H*.42,C.roof,.18,C.wallJ);
      box(g,-s.L*.04,deck(0)+.5,0,s.L*.32,1,s.W*.62,M.mid,'cargo-hatch');
      for(var k=-3;k<=3;k++)box(g,-s.L*.04,deck(0)+1.1,k*s.W*.085,s.L*.32,.4,s.W*.075,M.deckc,'hatch-board');
      [-1,1].forEach(function(side){for(var k=0;k<12;k++){var x=s.L*(-.32+k*.06),y=deck(x),z=side*s.W*.43;rod(g,[x,y,z],[x,y+2,z],.19,M.dark,'cargo-rail');}
        rod(g,[-s.L*.32,deck(-s.L*.32)+2,side*s.W*.43],[s.L*.34,deck(s.L*.34)+2,side*s.W*.43],.24,M.dark,'cargo-rail');});
      var x=h.X(0,h.H);box(g,x-2,h.H*.7,0,3,h.H*1.25,1.2,M.dark,'large-rudder');
    };
    if(id==='jounseon')ship.up_kr=function(g){
      var x=-s.L*.32;ship.roofHouse(g,x-s.L*.07,x+s.L*.07,s.W*.24,deck(x),h.H*.45,C.thatch,.18,C.wallK);
      box(g,0,deck(0)+1.2,0,s.L*.42,2.4,s.W*.64,M.mid,'grain-hold');
      for(var k=0;k<7;k++)box(g,s.L*(-.18+k*.06),deck(0)+2.6,0,s.L*.055,.45,s.W*.65,M.deckc,'grain-cover');
    };
    if(id==='padewakang')ship.up_jong=function(g){
      var x=-s.L*.24;ship.roofHouse(g,x-s.L*.13,x+s.L*.11,s.W*.31,deck(x),h.H*.48,C.thatch,.14);
      [-1,1].forEach(function(side){var z=side*s.W*.47,x=-s.L*.39,y=deck(x);
        rod(g,[x+5,y+4,z],[x-4,1,z*1.25],.5,M.dark,'quarter-rudder-shaft');
        box(g,x-3,h.H*.25,z*1.22,3,h.H*.8,1,M.mid,'quarter-rudder');
        rod(g,[x+6,y,z],[x-1,y+3,z],.4,M.deckc,'rudder-support');});
    };
    var base=ship.buildHull;
    ship.buildHull=function(){var g=base.call(this),details=new T.Group();details.userData.regionalShip=id;g.add(details);
      if(id==='koch'){
        // 수면 가까이에 두꺼운 보강 외판 띠를 두른다.
        [-1,1].forEach(function(side){for(var k=0;k<20;k++){var u=.08+k*.84/19,y=h.sheer(u)*.45,x=h.X(u,y),z=side*(h.half(u,y)+.65);
          var plank=box(details,x,y,z,s.L*.046,2.1,.8,M.mid,'ice-belt');plank.rotation.y=-side*(u-.5)*.65;}});
      }
      if(id==='shipline'){
        // 기존 아래 포열에 더해, 엇갈린 위 포열과 열린 포문 덮개를 단다.
        [-1,1].forEach(function(side){for(var k=0;k<9;k++){var u=.22+k*.54/8,y=h.sheer(u)*.79,x=h.X(u,y),z=side*(h.half(u,y)+.4),r=1.15;
          box(details,x,y,z,3,2.6,.5,C.hole,'upper-gunport');
          rod(details,[x,y,z],[x,y,z+side*3],r*.42,C.iron,'upper-cannon');
          var lid=box(details,x,y+1.9,z+side*.7,3.2,.35,2.4,M.mid,'upper-port-lid');lid.rotation.x=-side*.45;
        }});
      }
      if(id==='ghurab'){
        var x=h.X(.98,h.H),y=h.sheer(.98);rod(details,[x-5,y,0],[x+s.L*.13,y+2,0],.75,M.dark,'long-prow');
        [-1,1].forEach(function(side){rod(details,[s.L*.29,deck(s.L*.29)+1,side*3],[s.L*.45,deck(s.L*.29)+1,side*3],.65,C.iron,'bow-chaser');});
      }
      if(id==='eastindiaman'){
        var x=s.L*.06,y=deck(x);box(details,x,y+.6,0,s.L*.13,1.2,s.W*.33,M.dark,'large-cargo-hatch');
        for(var k=0;k<5;k++)box(details,x-s.L*.052+k*s.L*.026,y+1.3,0,s.L*.022,.35,s.W*.32,M.deckc,'cargo-hatch-board');
      }
      return g;
    };return ship;
  }};
})(window);
