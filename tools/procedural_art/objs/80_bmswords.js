/* 암시장 명검 아이콘 5종 (js/systems/blackmarket.js BM.SWORDS): 클레이모어 · 시바신의 마검 · 룬 블레이드 · 성기사의 검 · 요도 무라마사
   칼은 +y로 세워 만들고(칼끝이 아래, 손잡이가 위), run_bmswords.js 가 비스듬히(칼끝 왼쪽 아래 · 자루 오른쪽 위) 눕혀 찍는다
   — images/items 의 다른 칼 그림과 같은 구도. 단위: 칼 길이 약 2 */
(function (T) {
  'use strict';
  var M = T.mat;

  /** 칼날: 단면 모양(왼쪽 가장자리 점들, 칼끝 → 코등이) 을 좌우 대칭이나 비대칭으로 이어 납작하게 뽑고, 가운데를 조금 도톰하게 */
  function bladeGeo(pts, depth, ridge) {
    var sh = T.shape(pts), geo = new THREE.ExtrudeGeometry(sh, { depth: depth, bevelEnabled: true, bevelThickness: depth * 0.5, bevelSize: depth * 0.9, bevelSegments: 3, curveSegments: 48, steps: 1 });
    geo.translate(0, 0, -depth / 2);
    // 날 가운데(칼등 쪽) 도톰하게: x가 가운데선에서 멀수록 z를 줄인다
    if (ridge) T.warp(geo, function (v) { var k = ridge(v.x, v.y); v.z *= k; return v; });
    geo.computeVertexNormals();
    return geo;
  }
  /** ExtrudeGeometry 의 앞뒤 UV(x, y)를 칼날 상자 [x0,x1]×[y0,y1] 에 맞춰 0~1로 */
  function fitUV(geo, x0, x1, y0, y1) {
    var uv = geo.attributes.uv, p = geo.attributes.position;
    for (var i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - x0) / (x1 - x0), (p.getY(i) - y0) / (y1 - y0));
    uv.needsUpdate = true; return geo;
  }
  /** 칼날 무늬 그림 (W×H, 위 = 코등이 쪽) */
  function bladeTex(W, H, fn) { return T.canvas(W, H, fn); }
  function steelTex(W, H, base, extra) {
    return bladeTex(W, H, function (g) {
      var gr = g.createLinearGradient(0, 0, W, 0);
      gr.addColorStop(0, base[0]); gr.addColorStop(0.5, base[1]); gr.addColorStop(1, base[0]);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // 가는 줄 결 (칼 길이 방향)
      for (var i = 0; i < 260; i++) { var x = T.rr(0, W); g.fillStyle = 'rgba(' + (T.rnd() < 0.5 ? '255,255,255' : '40,40,48') + ',' + T.rr(0.02, 0.07) + ')'; g.fillRect(x, 0, T.rr(0.6, 2), H); }
      if (extra) extra(g, W, H);
    });
  }
  /** 감은 손잡이 */
  function grip(len, r0, r1, col, wrap) {
    var g = T.group();
    var core = T.mesh(new THREE.CylinderGeometry(r1, r0, len, 24), M.cloth({ color: col, roughness: 0.8 }), 0, len / 2, 0); g.add(core);
    var n = wrap || 10;
    for (var i = 0; i < n; i++) {
      var y = (i + 0.5) / n * len, rr = r0 + (r1 - r0) * (y / len);
      var t = T.mesh(new THREE.TorusGeometry(rr * 1.02, rr * 0.16, 6, 24), M.cloth({ color: new THREE.Color(col).multiplyScalar(0.7).getHex(), roughness: 0.85 }), 0, y, 0);
      t.rotation.x = Math.PI / 2 + 0.28; g.add(t);
    }
    return g;
  }

  /* ---------------- 클레이모어: 긴 곧은 날 · 앞으로 기운 코등이 · 네잎 고리 · 둥근 자루머리 */
  T.OBJ.claymore = function () {
    var g = T.group(), L = 1.5, w = 0.07;
    var pts = [[0, -L], [-w * 0.5, -L + 0.16], [-w, -L + 0.5], [-w, -0.02], [-w * 1.15, 0], [w * 1.15, 0], [w, -0.02], [w, -L + 0.5], [w * 0.5, -L + 0.16]];
    var geo = fitUV(bladeGeo(pts, 0.012, function (x) { return 1 - Math.min(1, Math.abs(x) / w) * 0.75; }), -w * 1.2, w * 1.2, -L, 0);
    var tex = steelTex(128, 1024, ['#9ea4ab', '#e6e9ee'], function (gg, W, H) {
      gg.fillStyle = 'rgba(70,74,82,.55)'; gg.fillRect(W * 0.46, 0, W * 0.08, H * 0.6);   // 홈(fuller)
      gg.fillStyle = 'rgba(255,255,255,.35)'; gg.fillRect(W * 0.43, 0, W * 0.02, H * 0.6);
    });
    g.add(T.mesh(geo, T.texMat(function (o) { return M.silver(Object.assign({ roughness: 0.2 }, o)); }, tex)));
    // 리캇소(날 밑 가죽)
    g.add(T.mesh(new THREE.BoxGeometry(w * 2.1, 0.14, 0.03), M.cloth({ color: 0x4a2a16 }), 0, -0.08, 0));
    // 코등이: 앞(칼끝 쪽)으로 기운 두 팔 + 끝마다 네잎 고리
    var iron = M.iron({ color: 0x6a6660, roughness: 0.35, metalness: 0.95 });
    [-1, 1].forEach(function (sd) {
      g.add(T.mesh(T.tube([[0, 0.02, 0], [sd * 0.14, -0.02, 0], [sd * 0.3, -0.12, 0]], 0.018, 20, 10), iron));
      for (var k = 0; k < 4; k++) {
        var a = k * Math.PI / 2 + Math.PI / 4, ring = T.mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 20), iron, sd * 0.3 + Math.cos(a) * 0.032, -0.12 + Math.sin(a) * 0.032, 0);
        g.add(ring);
      }
    });
    g.add(T.mesh(new THREE.BoxGeometry(0.06, 0.06, 0.05), iron, 0, 0.02, 0));
    var gp = grip(0.42, 0.024, 0.022, 0x3a2414, 12); gp.position.y = 0.05; g.add(gp);
    g.add(T.mesh(new THREE.SphereGeometry(0.05, 24, 18), iron, 0, 0.52, 0));
    g.add(T.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 10), iron, 0, 0.57, 0));
    return g;
  };

  /* ---------------- 시바신의 마검: 탈와르처럼 휜 넓은 날 · 원반 자루머리 · 금 손잡이 · 칼등의 삼지창 */
  T.OBJ.shivablade = function () {
    var g = T.group(), L = 1.28;
    // 휜 날: 칼끝이 위로(칼등 쪽 = +x) 휘어 오른다
    var edge = [], back = [];
    for (var i = 0; i <= 24; i++) {
      var t = i / 24, y = -L * (1 - t), bow = Math.sin(t * Math.PI * 0.9 + 0.2) * 0.0 + (1 - t) * (1 - t) * 0.34;
      var wd = 0.085 * (0.55 + 0.45 * Math.min(1, t * 2.4)) * (t < 0.06 ? t / 0.06 : 1) + (1 - t) * 0.02;
      edge.push([bow - wd, y]); back.push([bow + wd * 0.55, y]);
    }
    var pts = [[0.34 + 0.04, -L - 0.02]].concat(edge.slice(1)).concat([[-0.09, 0.0], [0.06, 0.0]]).concat(back.slice(1).reverse());
    var geo = fitUV(bladeGeo(pts, 0.011, null), -0.12, 0.42, -L - 0.02, 0);
    var tex = steelTex(256, 1024, ['#7f8792', '#d8dde4'], function (gg, W, H) {
      // 다마스쿠스 물결
      gg.globalAlpha = 0.12;
      for (var k = 0; k < 70; k++) { gg.strokeStyle = k % 2 ? '#3c4048' : '#f4f6f8'; gg.lineWidth = T.rr(1, 3); gg.beginPath(); var x0 = T.rr(0, W); gg.moveTo(x0, 0); for (var yy = 0; yy <= H; yy += 16) gg.lineTo(x0 + Math.sin(yy / T.rr(30, 70) + k) * T.rr(6, 18), yy); gg.stroke(); }
      gg.globalAlpha = 1;
      // 금 상감 삼지창 (칼등 쪽, 손잡이 가까이)
      gg.strokeStyle = '#f2c050'; gg.fillStyle = '#f2c050'; gg.lineWidth = 11; gg.lineCap = 'round'; gg.shadowColor = '#3a2408'; gg.shadowBlur = 4;
      var cx = W * 0.24, top = H * 0.07, bot = H * 0.28;
      gg.beginPath(); gg.moveTo(cx, bot); gg.lineTo(cx, top); gg.stroke();
      gg.beginPath(); gg.moveTo(cx - 22, top + 50); gg.quadraticCurveTo(cx - 24, top + 4, cx - 14, top - 10); gg.moveTo(cx + 22, top + 50); gg.quadraticCurveTo(cx + 24, top + 4, cx + 14, top - 10); gg.moveTo(cx - 22, top + 50); gg.lineTo(cx + 22, top + 50); gg.stroke();
      gg.beginPath(); gg.moveTo(cx, top - 26); gg.lineTo(cx - 9, top); gg.lineTo(cx + 9, top); gg.closePath(); gg.fill();
      gg.beginPath(); gg.arc(cx, bot + 22, 14, 0, 7); gg.stroke();
    });
    g.add(T.mesh(geo, T.texMat(function (o) { return M.silver(Object.assign({ roughness: 0.24 }, o)); }, tex)));
    var gold = M.gold({ roughness: 0.26 });
    // 코등이: 짧은 십자 + 가운데 혀(랑갓)
    g.add(T.mesh(new THREE.BoxGeometry(0.26, 0.035, 0.05), gold, 0, 0.02, 0));
    [-1, 1].forEach(function (sd) { g.add(T.mesh(new THREE.SphereGeometry(0.026, 16, 12), gold, sd * 0.13, 0.02, 0)); });
    g.add(T.mesh(new THREE.ConeGeometry(0.03, 0.1, 4), gold, 0, -0.05, 0).rotateX(Math.PI));
    // 손잡이: 가운데가 불룩한 금
    var hp = T.lathe([[0.026, 0.04], [0.032, 0.1], [0.036, 0.16], [0.03, 0.22], [0.026, 0.27]], 32, 40);
    g.add(T.mesh(hp, gold));
    // 원반 자루머리 + 꼭지 + 붉은 보석
    var disc = T.mesh(new THREE.CylinderGeometry(0.075, 0.03, 0.03, 32), gold, 0, 0.3, 0); g.add(disc);
    g.add(T.mesh(new THREE.SphereGeometry(0.03, 16, 12), gold, 0, 0.33, 0));
    g.add(T.mesh(new THREE.SphereGeometry(0.016, 14, 10), M.cabochon(0xb0101a), 0, 0.36, 0));
    g.add(T.mesh(new THREE.SphereGeometry(0.016, 14, 10), M.cabochon(0x1050b0), 0, 0.16, 0.035));
    return g;
  };

  /* ---------------- 룬 블레이드: 넓고 곧은 바이킹식 날 · 룬 문자(푸른 빛) · 놋쇠 코등이 · 세 갈래 자루머리 */
  T.OBJ.runeblade = function () {
    var g = T.group(), L = 1.3, w = 0.095;
    var pts = [[0, -L], [-w * 0.65, -L + 0.18], [-w * 0.92, -L + 0.6], [-w, -0.02], [w, -0.02], [w * 0.92, -L + 0.6], [w * 0.65, -L + 0.18]];
    var geo = fitUV(bladeGeo(pts, 0.012, function (x) { return 1 - Math.min(1, Math.abs(x) / w) * 0.7; }), -w, w, -L, 0);
    var RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
    var tex = steelTex(160, 1024, ['#6f757e', '#c9ced6'], function (gg, W, H) {
      gg.fillStyle = 'rgba(40,44,52,.55)'; gg.fillRect(W * 0.4, 0, W * 0.2, H * 0.78);
      gg.save(); gg.translate(W * 0.5, H * 0.04); gg.rotate(Math.PI / 2);
      gg.font = 'bold 30px "Noto Sans Runic", "Segoe UI Historic", serif'; gg.textBaseline = 'middle';
      var s = ''; for (var i = 0; i < 18; i++) s += RUNES[Math.floor(T.rnd() * RUNES.length)];
      gg.shadowColor = '#7fd4ff'; gg.shadowBlur = 10; gg.fillStyle = '#bfefff'; gg.fillText(s, 0, 0);
      gg.restore();
    });
    var mat = T.texMat(function (o) { return M.silver(Object.assign({ roughness: 0.3 }, o)); }, tex);
    // 룬이 빛나게: 같은 그림을 발광 지도로
    mat.emissiveMap = T.tex(T.canvas(160, 1024, function (gg, W, H) { gg.drawImage(tex, 0, 0); var d = gg.getImageData(0, 0, W, H), a = d.data; for (var i = 0; i < a.length; i += 4) { var b = a[i + 2] > 200 && a[i] < 210 ? 255 : 0; a[i] = 0; a[i + 1] = b * 0.7; a[i + 2] = b; } gg.putImageData(d, 0, 0); }));
    mat.emissive = new THREE.Color(0x66ccff); mat.emissiveIntensity = 1.4;
    g.add(T.mesh(geo, mat));
    var brass = M.bronze({ color: 0xb08a48, roughness: 0.32 });
    // 코등이: 짧고 두툼한 막대, 끝이 살짝 아래로
    g.add(T.mesh(new THREE.BoxGeometry(0.3, 0.04, 0.06), brass, 0, 0.0, 0));
    [-1, 1].forEach(function (sd) { g.add(T.mesh(new THREE.SphereGeometry(0.03, 16, 12), brass, sd * 0.15, -0.005, 0)); });
    var gp = grip(0.24, 0.028, 0.026, 0x2a1a10, 8); gp.position.y = 0.02; g.add(gp);
    // 세 갈래 자루머리
    g.add(T.mesh(new THREE.BoxGeometry(0.18, 0.03, 0.05), brass, 0, 0.28, 0));
    [-0.055, 0, 0.055].forEach(function (x, i) { var lobe = T.mesh(new THREE.SphereGeometry(i === 1 ? 0.04 : 0.033, 18, 14), brass, x, 0.31, 0); lobe.scale.set(1, 1.15, 0.8); g.add(lobe); });
    return g;
  };

  /* ---------------- 성기사의 검: 곧은 날 · 금 십자 코등이 · 붉은 보석 · 금 글씨 · 원반 자루머리의 십자 */
  T.OBJ.paladin = function () {
    var g = T.group(), L = 1.38, w = 0.08;
    var pts = [[0, -L], [-w * 0.6, -L + 0.2], [-w * 0.9, -L + 0.7], [-w, -0.02], [w, -0.02], [w * 0.9, -L + 0.7], [w * 0.6, -L + 0.2]];
    var geo = fitUV(bladeGeo(pts, 0.012, function (x) { return 1 - Math.min(1, Math.abs(x) / w) * 0.7; }), -w, w, -L, 0);
    var tex = steelTex(160, 1024, ['#a4a9b0', '#eef0f3'], function (gg, W, H) {
      gg.fillStyle = 'rgba(60,64,72,.45)'; gg.fillRect(W * 0.44, 0, W * 0.12, H * 0.7);
      gg.save(); gg.translate(W * 0.5, H * 0.05); gg.rotate(Math.PI / 2);
      gg.font = 'bold 30px serif'; gg.textBaseline = 'middle'; gg.lineWidth = 5; gg.strokeStyle = '#3a2408'; gg.strokeText('+ IN NOMINE DOMINI +', 0, 0); gg.fillStyle = '#f0c050'; gg.fillText('+ IN NOMINE DOMINI +', 0, 0); gg.restore();
    });
    g.add(T.mesh(geo, T.texMat(function (o) { return M.silver(Object.assign({ roughness: 0.18 }, o)); }, tex)));
    var gold = M.gold({ roughness: 0.22 });
    // 넓은 십자 코등이 (끝이 넓어지는 팔)
    [-1, 1].forEach(function (sd) {
      var arm = T.extrude([[0, -0.03], [sd * 0.2, -0.045], [sd * 0.22, -0.06], [sd * 0.24, -0.02], [sd * 0.24, 0.02], [sd * 0.22, 0.06], [sd * 0.2, 0.045], [0, 0.03]], 0.045, 0.006);
      g.add(T.mesh(arm, gold, 0, 0.01, 0));
      g.add(T.mesh(new THREE.SphereGeometry(0.018, 14, 10), M.cabochon(0xa00c18), sd * 0.215, 0.01, 0.03));
    });
    g.add(T.mesh(new THREE.SphereGeometry(0.03, 18, 14), M.cabochon(0xa00c18), 0, 0.01, 0.03));
    var gp = grip(0.28, 0.024, 0.022, 0x5a1a14, 10); gp.position.y = 0.04; g.add(gp);
    // 원반 자루머리 + 십자
    var disc = T.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 36), gold, 0, 0.38, 0); disc.rotation.x = Math.PI / 2; g.add(disc);
    g.add(T.mesh(new THREE.BoxGeometry(0.075, 0.016, 0.044), M.enamel(0xa00c18), 0, 0.38, 0));
    g.add(T.mesh(new THREE.BoxGeometry(0.016, 0.075, 0.044), M.enamel(0xa00c18), 0, 0.38, 0));
    g.add(T.mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.04, 16), gold, 0, 0.33, 0));
    return g;
  };

  /* ---------------- 요도 무라마사: 칼집 없는 일본도 · 물결 하몬 · 검은 쓰바 · 검은 끈을 감은 자루 · 붉은빛 */
  T.OBJ.muramasa = function () {
    var g = T.group(), L = 1.3, w = 0.042;
    // 살짝 휜 날 (칼등 = +x), 칼끝은 기울게 깎은 키사키
    var edge = [], back = [];
    for (var i = 0; i <= 30; i++) {
      var t = i / 30, y = -L * (1 - t), bow = (1 - t) * (1 - t) * 0.07 + (1 - t) * 0.02;
      edge.push([bow - w * (t < 0.05 ? 0.4 + t * 12 : 1), y]); back.push([bow + w * 0.55, y]);
    }
    var pts = [[0.09 + w * 0.55, -L - 0.03]].concat(edge.slice(1)).concat([[-w * 1.05, 0], [w * 0.62, 0]]).concat(back.slice(1).reverse());
    var geo = fitUV(bladeGeo(pts, 0.009, null), -0.06, 0.13, -L - 0.03, 0);
    var tex = steelTex(128, 1024, ['#4c535e', '#8a929e'], function (gg, W, H) {
      // 하몬: 날 쪽(왼쪽)에 흰 물결 띠 — 무라마사의 짝이 맞는 물결
      var x0 = W * 0.22;
      gg.fillStyle = 'rgba(248,250,252,1)'; gg.shadowColor = 'rgba(255,255,255,.9)'; gg.shadowBlur = 10;
      gg.beginPath(); gg.moveTo(0, 0);
      for (var yy = 0; yy <= H; yy += 4) gg.lineTo(x0 + Math.sin(yy / 22) * 9 + Math.sin(yy / 7) * 3, yy);
      gg.lineTo(0, H); gg.closePath(); gg.fill();
      gg.strokeStyle = 'rgba(255,255,255,.6)'; gg.lineWidth = 3; gg.beginPath();
      for (var y2 = 0; y2 <= H; y2 += 4) { var xx = x0 + Math.sin(y2 / 22) * 9 + Math.sin(y2 / 7) * 3; if (y2) gg.lineTo(xx, y2); else gg.moveTo(xx, y2); }
      gg.stroke();
      // 칼등 쪽 시노기 선
      gg.fillStyle = 'rgba(40,42,48,.35)'; gg.fillRect(W * 0.62, 0, 3, H);
    });
    var mat = T.texMat(function (o) { return M.silver(Object.assign({ roughness: 0.14 }, o)); }, tex);
    mat.emissive = new THREE.Color(0x3a0610); mat.emissiveIntensity = 0.18;   // 요기(妖氣)처럼 은은한 붉은빛
    g.add(T.mesh(geo, mat));
    // 하바키(금 덧쇠)
    g.add(T.mesh(new THREE.BoxGeometry(0.1, 0.06, 0.03), M.gold({ roughness: 0.3 }), 0.01, -0.03, 0));
    // 쓰바: 둥근 검은 철판 + 테두리
    var tsuba = T.mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.018, 40), M.iron({ color: 0x2a2624, roughness: 0.45 }), 0.01, 0.01, 0); g.add(tsuba);
    g.add(T.mesh(new THREE.TorusGeometry(0.084, 0.006, 8, 40), M.gold({ roughness: 0.35 }), 0.01, 0.01, 0).rotateX(Math.PI / 2));
    // 자루: 흰 상어가죽 위에 검은 끈 마름모 감기
    var tsuka = T.group(), len = 0.4;
    tsuka.add(T.mesh(new THREE.BoxGeometry(0.06, len, 0.04), M.matte({ color: 0xe8e2d4, roughness: 0.6 }), 0, len / 2, 0));
    for (var k = 0; k < 9; k++) {
      var y0 = (k + 0.5) / 9 * len;
      [-1, 1].forEach(function (sd) { var b = T.mesh(new THREE.BoxGeometry(0.075, 0.016, 0.05), M.cloth({ color: 0x141018, roughness: 0.75 }), 0, y0, 0); b.rotation.z = sd * 0.5; tsuka.add(b); });
    }
    tsuka.position.set(0.012, 0.02, 0); g.add(tsuka);
    // 가시라(자루 끝 쇠)
    g.add(T.mesh(new THREE.BoxGeometry(0.066, 0.03, 0.046), M.iron({ color: 0x2a2624, roughness: 0.4 }), 0.012, 0.44, 0));
    // 붉은 술(사게오) 조금
    g.add(T.mesh(T.tube([[0.04, 0.42, 0.02], [0.1, 0.36, 0.03], [0.12, 0.26, 0.02]], 0.007, 16, 6), M.cloth({ color: 0x8a0c16 })));
    return g;
  };
})(T3);
