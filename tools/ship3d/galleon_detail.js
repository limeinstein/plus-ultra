/* 실시간 갤리온 전용 미술. 공용 36종 모형과 스프라이트 제작에는 적용하지 않는다.
   외부 파일 없이 목재·돛천을 만들고, 정적 장식은 런타임에서 재질별로 합친다. */
(function (root) {
  'use strict';
  root.GalleonDetail = { enrich: function (ship, T, cfg) {
    var h = ship.h, s = ship.s, C = ship.C, TX = root.Ship3DTex, PI = Math.PI;
    var look = cfg.art, mix = function (a, b, t) { return a + (b - a) * t; };
    var art = root.ShipArtMaterials.make(ship, T, look), M = art.M, paint = art.paint;
    var gold = C.brass, rope = C.rope, iron = C.iron, squareCloth = art.cloth('sq'), lateenCloth = art.cloth('lat');
    var baseSq = ship.sqSurface, baseLat = ship.lateen;
    ship.sqSurface = function (grp, mx, yT, yB, spT, spB, brace, bill, st) {
      return baseSq.call(this, grp, mx, yT, yB, spT, spB, brace, bill, st, squareCloth, 24, 16);
    };
    ship.lateen = function (grp) {
      baseLat.apply(this, arguments);
      grp.children[grp.children.length - 1].traverse(function (o) {
        if (o.isMesh && o.material.map) { o.material = lateenCloth; o.userData.galleonSail = true; }
      });
    };

    function mesh(g, m, p, parent) {
      var o = new T.Mesh(g, m); if (p) o.position.set(p[0], p[1], p[2]);
      o.castShadow = o.receiveShadow = true; parent.add(o); return o;
    }
    function box(parent, x, y, z, a, b, c, m) { return mesh(new T.BoxGeometry(a, b, c), m, [x, y, z], parent); }
    function rod(parent, a, b, rad, m, tip, sides) {
      var va = new T.Vector3().fromArray(a), vb = new T.Vector3().fromArray(b), d = vb.clone().sub(va);
      var o = mesh(new T.CylinderGeometry(tip == null ? rad : tip, rad, d.length(), sides || 6), m, null, parent);
      o.position.copy(va.add(vb).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return o;
    }
    function path(parent, pts, r, m, sides) { for (var i = 1; i < pts.length; i++) rod(parent, pts[i - 1], pts[i], r, m, r, sides || 4); }
    function torus(parent, x, y, z, r, thick, m, rx) {
      var o = mesh(new T.TorusGeometry(r, thick, 4, 16), m, [x, y, z], parent); o.rotation.x = rx || 0; return o;
    }
    function deckY(x) { return h.deckY(h.U(x, h.H)); }
    function sideStrip(parent, a, b, height, lower, upper, inset, m) {
      [1, -1].forEach(function (side) {
        var p = [], uv = [], idx = [], n = 36;
        for (var i = 0; i <= n; i++) {
          var u = mix(a, b, i / n);
          [lower, upper].forEach(function (off) {
            var y = h.sheer(u) + height + off;
            p.push(h.X(u, y), y, side * (h.half(u, y) * inset + .28)); uv.push(i / n, off === lower ? 0 : 1);
          });
          if (i < n) { var q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
        }
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); mesh(g, m, null, parent);
      });
    }
    function rail(parent, a, b, height, inset, count) {
      [1, -1].forEach(function (side) {
        var points = [];
        for (var i = 0; i <= count; i++) {
          var u = mix(a, b, i / count), y = h.sheer(u) + height + .05;
          var x = h.X(u, y), z = side * (h.half(u, y) * inset - .45);
          rod(parent, [x, y, z], [x, y + 2.35, z], .25, M.deckc, .20);
          rod(parent, [x, y + .7, z], [x, y + 1.35, z], .39, M.mid, .39);
          points.push([x, y + 2.65, z]);
        }
        path(parent, points, .43, M.dark, 6); path(parent, points.map(function (p) { return [p[0], p[1] + .18, p[2]]; }), .14, gold);
      });
    }
    // 둥근 창 윗부분과 가는 황동 창살.
    function windowFrame(parent, p, w, ht, rot) {
      var group = new T.Group(); group.position.fromArray(p); group.rotation.y = rot; parent.add(group);
      var shape = new T.Shape(); shape.moveTo(-w / 2, -ht / 2); shape.lineTo(w / 2, -ht / 2);
      shape.lineTo(w / 2, ht * .12); shape.absarc(0, ht * .12, w / 2, 0, PI, false); shape.closePath();
      mesh(new T.ShapeGeometry(shape, 8), C.glass, [0, 0, .12], group);
      var outline = [[-w / 2, -ht / 2, .22], [w / 2, -ht / 2, .22], [w / 2, ht * .12, .22]];
      for (var j = 0; j <= 8; j++) outline.push([Math.cos(j * PI / 8) * w / 2, ht * .12 + Math.sin(j * PI / 8) * w / 2, .22]);
      outline.push(outline[0]); path(group, outline, .17, gold);
      rod(group, [0, -ht / 2, .26], [0, ht * .12 + w / 2, .26], .09, gold);
      rod(group, [-w / 2, -ht * .06, .26], [w / 2, -ht * .06, .26], .09, gold);
      box(group, 0, -ht / 2 - .3, .3, w + .8, .4, .8, M.dark);
    }
    function stairs(parent, x, y, z, up, run, width, direction) {
      var n = Math.ceil(up / 1.25);
      for (var i = 0; i <= n; i++) box(parent, x + direction * run * i / n, y + up * i / n, z, run / n + .25, .35, width, M.deckc);
      [-1, 1].forEach(function (side) {
        var zz = z + side * width * .5;
        rod(parent, [x, y - .35, zz], [x + direction * run, y + up - .35, zz], .33, M.dark);
        rod(parent, [x, y, zz], [x, y + 3.1, zz], .23, M.mid);
        rod(parent, [x + direction * run, y + up, zz], [x + direction * run, y + up + 3.1, zz], .23, M.mid);
        rod(parent, [x, y + 3.1, zz], [x + direction * run, y + up + 3.1, zz], .25, M.dark);
      });
    }
    function fittings(grp) {
      // 구멍의 어둠이 남도록 격자 덮개 아래에 어두운 바닥을 둔다.
      [-5, 29].forEach(function (x) {
        var y = deckY(x) + .55, w = x < 0 ? 10 : 7, l = x < 0 ? 14 : 9;
        box(grp, x, y, 0, l, .6, w, M.dark);
        [-1,1].forEach(function(side){box(grp,x+side*l*.5,y+.4,0,.65,1.3,w+.8,M.hull);box(grp,x,y+.4,side*w*.5,l+.6,1.3,.65,M.hull);box(grp,x,y+1.1,side*w*.5,l+1,.18,.8,M.deckc);});
        for (var zz = -w * .45; zz <= w * .45; zz += 1.1) box(grp, x, y + .48, zz, l - .5, .3, .27, M.deckc);
        for (var xx = -l * .45; xx <= l * .45; xx += 1.2) box(grp, x + xx, y + .45, 0, .28, .3, w - .4, M.deckc);
      });
      // 캡스턴과 여덟 개의 손잡이.
      var x = -24, y = deckY(x);
      rod(grp, [x, y, 0], [x, y + 3.5, 0], 1.35, M.mid, 1.1, 10);
      rod(grp, [x, y + 2.6, 0], [x, y + 3.1, 0], 1.7, iron, 1.7, 10);
      for (var k = 0; k < 8; k++) { var a = k * PI / 4; rod(grp, [x, y + 2.8, 0], [x + Math.cos(a) * 4.2, y + 2.8, Math.sin(a) * 4.2], .2, M.deckc); }
      // 선루로 오르는 두 계단. 계단 도착점의 갑판 높이를 맞춘다.
      var top = h.sheer(.33) + h.H * .62 - 2.4, edge = h.X(.33, top);
      stairs(grp, edge + 12, deckY(edge + 12), -8, top - deckY(edge + 12), 12, 4.2, -1);
      var top2 = h.sheer(.1914) + h.H * 1.10 - 2.2, edge2 = h.X(.1914, top2);
      stairs(grp, edge2 + 10, h.sheer(.26) + h.H * .62 - 2.4, 7, top2 - (h.sheer(.26) + h.H * .62 - 2.4), 10, 3.8, -1);
      // 물통 세 개: 휘어진 판재와 철제 띠.
      [[-15, -11], [-19, -11], [36, 8]].forEach(function (p) {
        var yy = deckY(p[0]) + 2, g = new T.CylinderGeometry(1.35, 1.35, 3.7, 10, 4), pos = g.attributes.position;
        for (var i = 0; i < pos.count; i++) { var swell = 1 + .16 * (1 - Math.pow(pos.getY(i) / 1.85, 2)); pos.setX(i, pos.getX(i) * swell); pos.setZ(i, pos.getZ(i) * swell); }
        g.computeVertexNormals(); mesh(g, M.hull, [p[0], yy, p[1]], grp);
        [-1.25, 1.25].forEach(function (off) { torus(grp, p[0], yy + off, p[1], 1.46, .14, iron, PI / 2); });
      });
      // 갑판 가장자리에 놓인 구명정: 열린 안쪽, 늑골, 세 개의 벤치.
      var boat = new T.Group(), bx = 1, by = deckY(bx) + .7; boat.position.set(bx, by, 10); grp.add(boat);
      var vertices = [], indices = [], uv = [], seg = 28;
      for (var i = 0; i <= seg; i++) {
        var a = i * PI * 2 / seg, xx = Math.cos(a) * 9, zz = Math.sin(a) * 2.9;
        vertices.push(xx * .84, .3, zz * .45, xx, 2.6 + Math.abs(Math.cos(a)) * .7, zz); uv.push(i / seg * 2, 0, i / seg * 2, 1);
        if (i < seg) { var b = i * 2; indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      var bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); bg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); bg.setIndex(indices); bg.computeVertexNormals(); mesh(bg, M.inner, null, boat);
      box(boat, 0, .35, 0, 14, .3, 2.5, M.dark);
      var lip = []; for (var j = 0; j <= seg; j++) { var a = j * PI * 2 / seg; lip.push([Math.cos(a) * 9, 2.6 + Math.abs(Math.cos(a)) * .7, Math.sin(a) * 2.9]); }
      path(boat, lip, .22, M.deckc);
      [-4, 0, 4].forEach(function (x) { box(boat, x, 2.1, 0, .9, .25, 4.9, M.deckc); });
      [-30, 39].forEach(function (x) { for (var k = 0; k < 3; k++) torus(grp, x, deckY(x) + .2 + k * .14, 9, 1.5 - k * .27, .16, rope, PI / 2); });
    }
    function decorations(grp) {
      var h1 = h.H * .62, h2 = h.H * .48;
      sideStrip(grp, .008, .325, 0, h1 * .24, h1 - 1.2, .98, paint);
      sideStrip(grp, .008, .189, h1, h2 * .18, h2 - 1.2, .95, paint);
      [.25, .85].forEach(function (k) { sideStrip(grp, .01, .323, 0, h1 * k, h1 * k + .25, .985, gold); });
      sideStrip(grp, .76, .93, 0, h.H * .24, h.H * .34, .967, paint);
      rail(grp, .012, .185, h1 + h2, .95, 12);
      rail(grp, .197, .323, h1, .98, 8);
      rail(grp, .345, .745, 0, 1, 18);
      rail(grp, .77, .925, h.H * .42, .96, 10);
      [1, -1].forEach(function (side) {
        // 옆 회랑의 지붕·주춧돌, 창틀과 창 사이의 금박 기둥.
        [.07, .115, .21, .27].forEach(function (u) {
          var y = h.sheer(u) + h1 * .57, x = h.X(u, y), z = side * (h.half(u, y) * .98 + .6);
          windowFrame(grp, [x, y, z], 2.3, 3.7, side > 0 ? 0 : PI);
        });
        [.035, .185, .305].forEach(function (u) {
          var y = h.sheer(u) + h1 * .56, x = h.X(u, y), z = side * (h.half(u, y) * .985 + .5);
          rod(grp, [x, y - 3.4, z], [x, y + 3.5, z], .28, gold, .24);
          box(grp, x, y + 3.5, z, 1.2, .5, .65, gold);
        });
        var u = .1485, y = h.sheer(u) + h1 * .4, x = h.X(u, y), z = side * (h.half(u, y) * .98 + 1.7);
        windowFrame(grp, [x, y, z + side * .15], 3.1, 4.2, side > 0 ? 0 : PI);
        box(grp, x, y - 3.1, z, 6.8, .7, 3.2, gold);
        box(grp, x, y + 3.5, z - side * .5, 6.6, .6, 3.8, M.dark);
        // 선미루의 마름모 무늬. 작게 보아도 반복되는 금색 점이 남는다.
        for (var k = 0; k < 8; k++) {
          var u = .022 + k * .021, y = h.sheer(u) + h1 + h2 * .55;
          var mark = box(grp, h.X(u, y), y, side * (h.half(u, y) * .95 + .4), .9, 1.25, .24, gold); mark.rotation.z = PI / 4;
        }
        // 포문 덮개, 포신의 테와 현측 사다리.
        for (var k = 0; k < 6; k++) {
          var x = -s.L * .22 + k * s.L * .48 / 5, u = h.U(x, h.H * .5), y = h.sheer(u) * .5;
          var z = side * (h.half(u, y) + .4), size = 2.7;
          var lid = box(grp, x, y + 2.15, z + side * .7, 3.4, .3, 2.4, M.mid); lid.rotation.x = side * -.45;
          torus(grp, x, y, z + side * 2.7, .54, .12, iron);
        }
        // 선수에 걸어둔 닻과 고정줄.
        var ax = 58, ay = h.sheer(h.U(ax, h.H)) - 3, az = side * (h.half(h.U(ax, h.H), ay) + 1.3);
        var anchor = new T.Group(); anchor.position.set(ax, ay, az); anchor.rotation.z = side * -.28; grp.add(anchor);
        rod(anchor, [0, 2, 0], [0, -6, 0], .38, iron);
        rod(anchor, [-2.8, .7, 0], [2.8, .7, 0], .4, M.dark);
        path(anchor, [[-3, -3.5, 0], [-2.3, -5.2, 0], [0, -6, 0], [2.3, -5.2, 0], [3, -3.5, 0]], .35, iron, 6);
        torus(anchor, 0, 2.7, 0, .75, .17, iron);
        rod(grp, [ax, ay + 2.7, az], [ax - 4, ay + 5, az - side * 2], .2, rope);
      });
      // 선미의 뒤로 기운 면을 따라 도색과 창을 배치한다.
      var ya = h.sheer(0) + h1 * .23, yb = h.sheer(0) + h1 + h2 * .84;
      var pts = [], uv = [], ids = [];
      for (var j = 0; j <= 6; j++) {
        var y = mix(ya, yb, j / 6), w = h.half(.002, y) * .955;
        pts.push(h.X(0, y) - .45, y, -w, h.X(0, y) - .45, y, w); uv.push(0, j / 6, 1, j / 6);
        if (j < 6) { var b = j * 2; ids.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      var geom = new T.BufferGeometry(); geom.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); geom.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geom.setIndex(ids); geom.computeVertexNormals(); mesh(geom, paint, null, grp);
      [h1 * .58, h1 + h2 * .48].forEach(function (off, row) {
        var y = h.sheer(0) + off, w = h.half(.002, y) * .78, x = h.X(0, y) - 1.2;
        [-1, 0, 1].forEach(function (k) { windowFrame(grp, [x, y, k * w * .72], row ? 2.6 : 3, 4.1, -PI / 2); });
        rod(grp, [x - .1, y - 3, -w * 1.17], [x - .1, y - 3, w * 1.17], .3, gold);
      });
      var y = h.sheer(0) + h1 * .35, x = h.X(0, y) - 2, w = h.half(.002, y);
      box(grp, x - .7, y - .5, 0, 3.5, .7, w * 2, M.deckc);
      rod(grp, [x - 2.2, y + 2, -w], [x - 2.2, y + 2, w], .3, gold);
      for (var k = -5; k <= 5; k++) rod(grp, [x - 2.2, y, k * w / 5], [x - 2.2, y + 2, k * w / 5], .17, M.deckc);
      // 작은 선미 등. 발광은 유리 재질에만 두어 밤에도 과장되지 않는다.
      var ly = h.sheer(0) + h1 + h2 + 4, lx = h.X(0, ly) - .8;
      rod(grp, [lx, ly - 4, 0], [lx, ly + 1.8, 0], .25, gold);
      box(grp, lx, ly, 0, 1.5, 2.1, 1.5, C.glass);
      [-1, 1].forEach(function (side) { rod(grp, [lx + side * .85, ly - 1.1, -.85], [lx + side * .85, ly + 1.1, -.85], .13, gold); rod(grp, [lx + side * .85, ly - 1.1, .85], [lx + side * .85, ly + 1.1, .85], .13, gold); });
      mesh(new T.ConeGeometry(1.5, 1.3, 4), gold, [lx, ly + 1.6, 0], grp);
    }
    function deadeyes(grp) {
      s.masts.forEach(function (mx, i) {
        [1, -1].forEach(function (side) {
          for (var k = 0; k < 4; k++) {
            var x = mx - 1.5 - k * 2.2, u = h.U(x, h.H), y = h.sheer(u), z = side * (h.half(u, y) + .65);
            rod(grp, [x, y - 3.5, z - side * .5], [x, y + .5, z], .15, iron);
            var wheel = mesh(new T.CylinderGeometry(.54, .54, .4, 8), M.dark, [x, y + .7, z], grp); wheel.rotation.x = PI / 2;
            var upper = mesh(new T.CylinderGeometry(.54, .54, .4, 8), M.dark, [x, y + 2.25, z - side * .5], grp); upper.rotation.x = PI / 2;
            [-.22, .22].forEach(function (dx) { rod(grp, [x + dx, y + .7, z], [x + dx, y + 2.25, z - side * .5], .09, rope); });
          }
        });
      });
    }
    var baseHull = ship.buildHull;
    ship.buildHull = function () {
      var grp = baseHull.call(this); decorations(grp); fittings(grp); deadeyes(grp); return grp;
    };
    return ship;
  }};
})(window);
