/* 선박 미술 보강에 쓰는 공용 목재·돛천 재질. */
(function(root){'use strict';
  root.ShipArtMaterials={make:function(ship,T,look){
    var C=ship.C,TX=root.Ship3DTex;
    function color(v) { return new T.Color(v).convertSRGBToLinear(); }
    function material(v, rough) { return new T.MeshStandardMaterial({ color: color(v), roughness: rough || .75, side: T.DoubleSide }); }
    function texture(cv) {
      var t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding;
      t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; return t;
    }
    function wood(base, rows, seed, seam) {
      var map = texture(TX.planks({ w: 1024, h: 1024, color: base, seam: seam, rows: rows,
        seed: seed, minLen: 260, varLen: 340, seamW: 2, seamA: .68, clinker: !!ship.q.clinker && base === look.hull }));
      return new T.MeshStandardMaterial({ map: map, bumpMap: map, bumpScale: look.woodRelief,
        roughness: .72, side: T.DoubleSide });
    }
    var M = ship.M = Object.assign({}, ship.M, {
      hull: wood(look.hull, 22, 37, '#28160f'), deck: wood(look.deck, 18, 48, '#483629'),
      inner: wood(look.inner, 20, 18, '#322318'), dark: material(look.wales, .68),
      mid: material(look.hull), deckc: material(look.deck)
    });
    var paint = material(look.paint, .6), gold = C.brass, rope = C.rope, iron = C.iron;
    C.mast.color.copy(color(look.mast)); C.spar.color.copy(color(look.mast));
    C.rope.color.copy(color(look.rope));
    C.boltRope = material(look.boltRope, .94);
    C.glass.color.copy(color('#243e43')); C.glass.specular.setHex(0xb4d8df);

    // 각 폭의 색 차이, 겹솔기, 리프 밴드, 모서리 보강천을 하나의 지도에 그린다.
    var clothCache = {};
    function cloth(kind) {
      if (clothCache[kind]) return clothCache[kind];
      var triangle = kind === 'lat', woven = kind === 'mat', battens = kind === 'bat';
      var cv = document.createElement('canvas'); cv.width = cv.height = 1024;
      var g = cv.getContext('2d'), r = TX.rng(triangle ? 74 : 73), n = triangle ? 11 : 12;
      g.fillStyle = look.sail; g.fillRect(0, 0, 1024, 1024);
      for (var i = 0; i < n; i++) {
        var x = i * 1024 / n;
        g.fillStyle = 'rgba(113,85,49,' + (.018 + r() * .035) + ')'; g.fillRect(x, 0, 1024 / n, 1024);
        var shade = g.createLinearGradient(x, 0, x + 1024 / n, 0);
        shade.addColorStop(0, 'rgba(74,54,31,.14)'); shade.addColorStop(.10, 'rgba(255,251,234,.08)');
        shade.addColorStop(.82, 'rgba(116,91,55,0)'); shade.addColorStop(1, 'rgba(116,91,55,.055)');
        g.fillStyle = shade; g.fillRect(x, 0, 1024 / n, 1024);
        g.fillStyle = 'rgba(90,69,43,.25)'; g.fillRect(x, 0, 2, 1024);
        g.strokeStyle = 'rgba(88,69,45,.27)'; g.lineWidth = 1; g.setLineDash([3, 5]);
        g.beginPath(); g.moveTo(x + 5, 0); g.lineTo(x + 5, 1024); g.stroke(); g.setLineDash([]);
      }
      for (var k = 0; k < 12000; k++) {
        g.fillStyle = k % 2 ? 'rgba(255,255,242,.06)' : 'rgba(74,60,42,.045)';
        g.fillRect(r() * 1024, r() * 1024, 1, 2 + r() * 5);
      }
      if (woven || battens) {
        for (var wy = 0; wy < 1024; wy += woven ? 5 : 12) { g.fillStyle = 'rgba(82,58,25,.12)'; g.fillRect(0, wy, 1024, 1); }
        for (var wx = 0; wx < 1024; wx += woven ? 7 : 16) { g.fillStyle = 'rgba(255,239,192,.12)'; g.fillRect(wx, 0, 1, 1024); }
      }
      // UV의 아래쪽(v=1)이 실제 돛 발끝이다. CanvasTexture의 flipY를 감안한다.
      var age = g.createLinearGradient(0, 0, 0, 1024);
      age.addColorStop(0, 'rgba(99,75,39,.16)'); age.addColorStop(.17, 'rgba(99,75,39,.015)'); age.addColorStop(1, 'rgba(99,75,39,.025)');
      g.fillStyle = age; g.fillRect(0, 0, 1024, 1024);
      // 모서리의 겹천과 부분 수선. 모든 폭을 똑같이 더럽히지 않는다.
      function patch(x,y,w,h,alpha){
        g.fillStyle='rgba(137,109,68,'+alpha+')';g.fillRect(x,y,w,h);
        g.strokeStyle='rgba(94,72,43,.34)';g.lineWidth=1.5;g.setLineDash([4,4]);g.strokeRect(x+4,y+4,w-8,h-8);g.setLineDash([]);
        g.strokeStyle='rgba(255,247,220,.32)';g.beginPath();g.moveTo(x,y+h);g.lineTo(x+w,y+h);g.stroke();
      }
      if(!woven){
        patch(172,triangle?350:196,84,128,.12);patch(692,triangle?110:720,78,103,.09);
        if(!battens)[0,1].forEach(function(side){
          g.save();g.translate(side?1024:0,0);g.scale(side?-1:1,1);
          [160,112,64].forEach(function(size){g.fillStyle='rgba(137,110,69,.05)';g.beginPath();g.moveTo(0,0);g.lineTo(size,0);g.lineTo(0,size);g.closePath();g.fill();
            g.strokeStyle='rgba(111,86,51,.25)';g.setLineDash([3,4]);g.stroke();});g.restore();
        });
      }
      if (!triangle && !woven && !battens) {
        [.59, .78].forEach(function (v) {
          var y = v * 1024;
          g.fillStyle = 'rgba(154,130,90,.14)'; g.fillRect(0, y - 6, 1024, 12);
          g.strokeStyle = 'rgba(109,88,57,.24)'; g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke();
          for (var x = 32; x < 1024; x += 52) {
            g.strokeStyle = 'rgba(83,64,41,.48)'; g.lineWidth = 2;
            g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 2, y - 8, x + 2, y - 15); g.stroke();
          }
        });
        [[0, 0], [1024, 0], [0, 1024], [1024, 1024]].forEach(function (p) {
          g.fillStyle = 'rgba(154,126,80,.10)'; g.beginPath(); g.moveTo(p[0], p[1]);
          g.lineTo(p[0] + (p[0] ? -100 : 100), p[1]); g.lineTo(p[0], p[1] + (p[1] ? -100 : 100)); g.closePath(); g.fill();
        });
      }
      g.strokeStyle = 'rgba(102,79,44,.58)'; g.lineWidth = 9; g.strokeRect(4.5, 4.5, 1015, 1015);
      g.strokeStyle = 'rgba(255,240,199,.6)'; g.lineWidth = 2; g.strokeRect(9, 9, 1006, 1006);
      var map = texture(cv); map.wrapS = map.wrapT = T.ClampToEdgeWrapping;
      return (clothCache[kind] = new T.MeshStandardMaterial({ map: map, bumpMap: map, bumpScale: look.clothRelief,
        roughness: .97, side: T.DoubleSide, emissive: color('#1d170e'), emissiveIntensity: .28 }));
    }
    ship.artCloth=cloth;
    return {M:M,paint:paint,cloth:cloth,texture:texture,material:material,color:color};
  }};
})(window);
