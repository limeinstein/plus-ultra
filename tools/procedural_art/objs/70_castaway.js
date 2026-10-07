/* 야영지 물건 아이콘 2종 (js/systems/castaway.js): 윌슨(숯으로 얼굴을 그린 가죽 공) · 표류기(끈으로 묶은 낡은 가죽 일지)
   run_castaway.js 가 굽는다 → images/items/wilson.webp · castawaylog.webp */
(function (T) {
  'use strict';
  /** 가죽 공: 여덟 쪽 가죽을 꿰맨 공 + 숯 얼굴 (얼굴은 +z 쪽, 공 텍스처 u=0.25) */
  T.OBJ.wilson = function () {
    var W = 2048, H = 1024;
    var leather = T.canvas(W, H, function (g) {
      // 바탕 가죽: 햇볕에 바랜 밤색 + 얼룩
      var base = T.pixels(W / 4, H / 4, function (x, y) {
        var n = T.fbm(x / 22, y / 22, 1.7, 5), m = T.fbm(x / 6, y / 6, 4.2, 3);
        var k = 0.78 + n * 0.35 + m * 0.08;
        return [Math.round(150 * k), Math.round(98 * k), Math.round(58 * k)];
      });
      g.imageSmoothingEnabled = true; g.drawImage(base, 0, 0, W, H);
      // 닳은 자리 (밝게)
      for (var i = 0; i < 26; i++) {
        var x = T.rr(0, W), y = T.rr(H * 0.15, H * 0.85), r = T.rr(30, 120);
        var gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(214,170,118,.32)'); gr.addColorStop(1, 'rgba(214,170,118,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // 여덟 쪽 이음매 (경선) + 바늘땀
      for (var s = 0; s < 8; s++) {
        var u = (s + 0.5) / 8 * W;
        g.strokeStyle = 'rgba(52,30,14,.85)'; g.lineWidth = 7; g.beginPath(); g.moveTo(u, 0); g.lineTo(u, H); g.stroke();
        g.strokeStyle = 'rgba(232,206,160,.9)'; g.lineWidth = 4;
        for (var yy = 18; yy < H - 18; yy += 22) { g.beginPath(); g.moveTo(u - 9, yy); g.lineTo(u + 9, yy + 9); g.stroke(); }
      }
      // 숯으로 그린 얼굴 (u=0.25 → x=W/4, 적도 조금 위)
      var cx = W * 0.25, cy = H * 0.47, sx = 1.3 * W / 2048, sy = 1.3 * H / 1024;
      g.save(); g.translate(cx, cy);
      g.lineCap = 'round'; g.lineJoin = 'round';
      function smear(fn, w, a) { for (var p = 0; p < 3; p++) { g.save(); g.translate(T.rr(-2, 2), T.rr(-2, 2)); g.strokeStyle = 'rgba(18,14,12,' + (a - p * 0.18) + ')'; g.lineWidth = w + p * 4; g.beginPath(); fn(); g.stroke(); g.restore(); } }
      // 눈
      [-1, 1].forEach(function (k) {
        g.fillStyle = 'rgba(16,12,10,.88)'; g.beginPath(); g.ellipse(k * 62 * sx, -70 * sy, 17 * sx, 26 * sy, 0, 0, 7); g.fill();
        smear(function () { g.moveTo(k * 40 * sx, -118 * sy); g.quadraticCurveTo(k * 64 * sx, -132 * sy, k * 92 * sx, -114 * sy); }, 6, 0.75);   // 눈썹
      });
      // 코
      smear(function () { g.moveTo(4 * sx, -40 * sy); g.lineTo(-10 * sx, 6 * sy); g.lineTo(12 * sx, 10 * sy); }, 7, 0.8);
      // 씩 웃는 입
      smear(function () { g.moveTo(-96 * sx, 42 * sy); g.quadraticCurveTo(0, 128 * sy, 98 * sx, 36 * sy); }, 9, 0.85);
      smear(function () { g.moveTo(-104 * sx, 32 * sy); g.lineTo(-90 * sx, 52 * sy); g.moveTo(106 * sx, 26 * sy); g.lineTo(92 * sx, 46 * sy); }, 6, 0.7);
      g.restore();
    });
    var bump = T.canvas(W, H, function (g) {
      g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
      for (var s = 0; s < 8; s++) { var u = (s + 0.5) / 8 * W; g.strokeStyle = '#303030'; g.lineWidth = 10; g.beginPath(); g.moveTo(u, 0); g.lineTo(u, H); g.stroke(); }
      g.globalAlpha = 0.25; g.drawImage(T.noiseCanvas(256, 128, 6, 90, 170, 3), 0, 0, W, H); g.globalAlpha = 1;
    });
    var mat = T.texMat(function (o) { return T.mat.matte(Object.assign({ roughness: 0.62, envMapIntensity: 0.55, sheen: 0.25, sheenColor: new THREE.Color(0xffe2c0) }, o)); }, leather);
    mat.bumpMap = T.tex(bump, { linear: true }); mat.bumpScale = 0.012;
    var geo = new THREE.SphereGeometry(0.5, 128, 96);
    // 오래 써서 살짝 찌그러진 공 (아래가 납작)
    T.warp(geo, function (v) { if (v.y < -0.36) v.y = -0.36 + (v.y + 0.36) * 0.6; v.x *= 1.02; return v; });
    var ball = T.mesh(geo, mat);
    ball.rotation.set(-0.42, 0.22, 0.06);
    return T.group(ball);
  };

  /** 표류기: 끈으로 묶은 두툼한 가죽 일지 + 표지에 쓴 제목·섬 그림 */
  T.OBJ.castawaylog = function () {
    var w = 0.62, h = 0.84, th = 0.22, cov = 0.025;
    var cover = T.canvas(620, 840, function (g, W, H) {
      var base = T.pixels(155, 210, function (x, y) { var n = T.fbm(x / 16, y / 16, 3.3, 5), k = 0.75 + n * 0.4; return [Math.round(96 * k), Math.round(58 * k), Math.round(34 * k)]; });
      g.drawImage(base, 0, 0, W, H);
      // 물에 젖었다 마른 얼룩
      for (var i = 0; i < 9; i++) { var x = T.rr(0, W), y = T.rr(0, H), r = T.rr(60, 170); g.strokeStyle = 'rgba(40,22,10,.35)'; g.lineWidth = T.rr(3, 7); g.beginPath(); g.ellipse(x, y, r, r * T.rr(0.6, 1), T.rr(0, 3), 0, 7); g.stroke(); }
      // 테두리 눌러 찍은 선
      g.strokeStyle = 'rgba(30,16,8,.6)'; g.lineWidth = 6; g.strokeRect(34, 34, W - 68, H - 68);
      // 제목 (바랜 흰 물감)
      g.fillStyle = 'rgba(236,222,190,.88)'; g.font = 'bold 120px "Noto Serif CJK KR", "Noto Serif CJK SC", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.save(); g.translate(W / 2, H * 0.24); g.rotate(-0.03); g.fillText('표류기', 0, 0); g.restore();
      // 섬 그림: 수평선·작은 섬·야자 두 그루·해
      g.strokeStyle = 'rgba(236,222,190,.82)'; g.lineWidth = 6; g.lineCap = 'round';
      var cy = H * 0.66;
      g.beginPath(); g.moveTo(90, cy + 40); g.lineTo(W - 90, cy + 40); g.stroke();
      g.beginPath(); g.moveTo(170, cy + 40); g.quadraticCurveTo(W / 2, cy - 30, W - 170, cy + 40); g.stroke();
      [[W / 2 - 40, -0.25], [W / 2 + 50, 0.2]].forEach(function (p) {
        var bx = p[0], by = cy + 6, tx = bx + p[1] * 120, ty = cy - 150;
        g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + p[1] * 40, cy - 70, tx, ty); g.stroke();
        for (var k = 0; k < 5; k++) { var a = -Math.PI + k * Math.PI / 4 + 0.1; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * 50, ty + Math.sin(a) * 34 - 20, tx + Math.cos(a) * 90, ty + Math.sin(a) * 50 + 22); g.stroke(); }
      });
      g.beginPath(); g.arc(W - 150, cy - 110, 34, 0, 7); g.stroke();
      // 날을 센 금 (표지 아래쪽)
      g.lineWidth = 4;
      for (var t = 0; t < 4; t++) { var x0 = 120 + t * 100; for (var j = 0; j < 4; j++) { g.beginPath(); g.moveTo(x0 + j * 14, H - 130); g.lineTo(x0 + j * 14, H - 84); g.stroke(); } g.beginPath(); g.moveTo(x0 - 8, H - 92); g.lineTo(x0 + 52, H - 122); g.stroke(); }
    });
    var side = T.canvas(512, 128, function (g, W, H) {
      g.fillStyle = '#e4d3ad'; g.fillRect(0, 0, W, H);
      for (var y = 0; y < H; y += 2) { g.fillStyle = 'rgba(120,90,50,' + T.rr(0.05, 0.22) + ')'; g.fillRect(0, y, W, 1); }
      var gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(110,80,40,.25)'); gr.addColorStop(0.5, 'rgba(110,80,40,0)'); gr.addColorStop(1, 'rgba(110,80,40,.3)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    });
    var leatherPlain = T.pixels(128, 128, function (x, y) { var n = T.fbm(x / 14, y / 14, 7.1, 4), k = 0.72 + n * 0.4; return [Math.round(92 * k), Math.round(55 * k), Math.round(32 * k)]; });
    var lm = T.texMat(function (o) { return T.mat.matte(Object.assign({ roughness: 0.7, envMapIntensity: 0.5, sheen: 0.2, sheenColor: new THREE.Color(0xffd8a8) }, o)); }, leatherPlain);
    var cm = T.texMat(function (o) { return T.mat.matte(Object.assign({ roughness: 0.7, envMapIntensity: 0.5, sheen: 0.2, sheenColor: new THREE.Color(0xffd8a8) }, o)); }, cover);
    var pm = T.texMat(T.mat.paper, side, { roughness: 0.95 });
    var g = T.group();
    // 앞뒤 표지 (앞표지 위쪽 면에만 그림)
    var topMats = [lm, lm, cm, lm, lm, lm];
    var front = T.mesh(new THREE.BoxGeometry(w, cov, h), topMats, 0, th / 2 + cov / 2, 0);
    front.geometry.attributes.uv && fixTopUV(front.geometry);
    g.add(front);
    g.add(T.mesh(new THREE.BoxGeometry(w, cov, h), lm, 0, -th / 2 - cov / 2, 0));
    // 종이 덩어리 (조금 들쭉날쭉 — 사이에 끼운 쪽지)
    g.add(T.mesh(new THREE.BoxGeometry(w - 0.04, th, h - 0.04), pm, 0.01, 0, 0));
    var slip = T.mesh(new THREE.BoxGeometry(0.16, 0.006, 0.3), T.mat.paper({ color: 0xd8c39a }), w / 2 + 0.02, 0.05, -0.18); slip.rotation.y = 0.3; g.add(slip);
    // 등 (둥근 가죽)
    var spine = T.mesh(new THREE.CylinderGeometry(th / 2 + cov, th / 2 + cov, h, 24, 1, true, Math.PI, Math.PI), lm, -w / 2, 0, 0);
    spine.rotation.x = Math.PI / 2; g.add(spine);
    // 묶은 끈 두 바퀴 + 매듭
    var rope = T.mat.cloth({ color: 0x8a6a40, roughness: 0.95 });
    [-0.12, 0.16].forEach(function (z) {
      var a = w / 2 + 0.012, b = th / 2 + cov + 0.012;
      var pts = [[-a - 0.02, 0, z], [-a, b, z], [a, b, z], [a + 0.012, 0, z], [a, -b, z], [-a, -b, z], [-a - 0.02, 0, z]].map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
      g.add(T.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.1), 80, 0.013, 8, true), rope));
    });
    var knot = T.mesh(new THREE.TorusKnotGeometry(0.03, 0.011, 48, 8, 2, 3), rope, 0.08, th / 2 + cov + 0.03, 0.16); g.add(knot);
    var tail = T.tube([[0.1, th / 2 + cov + 0.02, 0.17], [0.2, th / 2 + cov + 0.01, 0.24], [0.26, th / 2 + cov + 0.005, 0.36]], 0.011, 24, 8);
    g.add(T.mesh(tail, rope));
    g.rotation.y = -0.35;
    return g;
    // BoxGeometry 윗면(+y)의 UV를 앞표지 그림이 바로 보이게 (u: x, v: -z)
    function fixTopUV(geo) {
      var pos = geo.attributes.position, uv = geo.attributes.uv, nrm = geo.attributes.normal;
      for (var i = 0; i < pos.count; i++) if (nrm.getY(i) > 0.9) uv.setXY(i, pos.getX(i) / w + 0.5, -pos.getZ(i) / h + 0.5);
      uv.needsUpdate = true;
    }
  };
})(T3);
