/* 조각 (SDF로 빚은 매끈한 몸) */
(function (T) {
  var O = T.OBJ, M = T.mat, S = T.sd;
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  /** 관절 J로 몸 부품을 만든다. o.fem 여성, o.noArms, o.noHead, o.head(머리 SDF를 직접), o.stumps(팔 대신 짧은 어깨) */
  function body(J, o) {
    o = o || {};
    var P = [], k = 0.022;
    function cap(a, b, ra, rb, kk) { P.push({ t: 'c', a: a, b: b, ra: ra, rb: rb === undefined ? ra : rb, k: kk || k }); }
    function ell(c, r, kk) { P.push({ t: 'e', c: c, r: r, k: kk || k }); }
    var f = o.fem ? 1 : 0;
    // 몸통
    ell(J.pelvis, [0.09 + f * 0.012, 0.065, 0.062], 0.03);
    ell(J.belly, [0.074 - f * 0.006, 0.075, 0.056], 0.035);
    ell(J.chest, [0.098 - f * 0.012, 0.08, 0.064], 0.035);
    cap(J.lsh, J.rsh, 0.036, 0.036, 0.03);
    if (!f) { ell(add(J.chest, [0.045, 0.012, 0.042]), [0.05, 0.036, 0.022], 0.03); ell(add(J.chest, [-0.045, 0.012, 0.042]), [0.05, 0.036, 0.022], 0.03); }
    else { P.push({ t: 's', c: add(J.chest, [0.045, -0.01, 0.05]), r: 0.036, k: 0.025 }); P.push({ t: 's', c: add(J.chest, [-0.045, -0.01, 0.05]), r: 0.036, k: 0.025 }); }
    ell(add(J.pelvis, [0.045, -0.02, -0.04]), [0.05, 0.05, 0.045], 0.03); ell(add(J.pelvis, [-0.045, -0.02, -0.04]), [0.05, 0.05, 0.045], 0.03);
    cap(J.neck, J.headBase, 0.033 - f * 0.004, 0.03, 0.02);
    // 팔
    ['l', 'r'].forEach(function (s) {
      if (o.noArms) { if (o.stumps) cap(J[s + 'sh'], add(J[s + 'sh'], [(s === 'l' ? 1 : -1) * 0.025, -0.06, 0.005]), 0.036, 0.03); return; }
      ell(add(J[s + 'sh'], [0, -0.01, 0]), [0.042, 0.04, 0.04], 0.02);
      cap(J[s + 'sh'], J[s + 'el'], 0.034 - f * 0.005, 0.026 - f * 0.004);
      cap(J[s + 'el'], J[s + 'wr'], 0.026 - f * 0.004, 0.018 - f * 0.002);
      if (J[s + 'ha']) { cap(J[s + 'wr'], J[s + 'ha'], 0.02, 0.014, 0.012); }
    });
    // 다리
    ['l', 'r'].forEach(function (s) {
      if (!J[s + 'hip']) return;
      cap(J[s + 'hip'], J[s + 'kn'], 0.064 + f * 0.006, 0.04);
      var calf = lerp(J[s + 'kn'], J[s + 'an'], 0.3);
      cap(J[s + 'kn'], calf, 0.04, 0.042, 0.03); cap(calf, J[s + 'an'], 0.042, 0.024, 0.03);
      if (J[s + 'ft']) cap(J[s + 'an'], J[s + 'ft'], 0.026, 0.02, 0.02);
    });
    if (!o.noHead) {
      var hf = o.head || T.headSdf(J.head, 0.064, { noEars: f });
      P.push({ t: 'f', f: hf, k: 0.02 });
      if (o.hair) P.push({ t: 'f', f: o.hair, k: 0.015 });
    }
    return P;
  }
  /** 서 있는 사람의 기본 관절 (키 1, 앞 = +z, 왼쪽 = +x). w: 몸무게를 실은 쪽 'r'|'l' */
  function stand(w) {
    var tilt = w === 'l' ? -1 : 1; // 오른발에 무게 → 오른쪽 골반이 올라감
    var J = {
      pelvis: [0, 0.52, 0], belly: [0, 0.6, 0.005], chest: [0, 0.72, 0.0], neck: [0, 0.83, 0.0], headBase: [0, 0.86, 0.005], head: [0, 0.925, 0.012],
      lsh: [0.105, 0.805 + tilt * 0.01, -0.005], rsh: [-0.105, 0.805 - tilt * 0.01, -0.005],
      lhip: [0.055, 0.5 - tilt * 0.012, 0], rhip: [-0.055, 0.5 + tilt * 0.012, 0]
    };
    // 무게 실은 다리는 곧게, 다른 다리는 무릎을 굽혀 앞으로
    var sup = w === 'l' ? 'l' : 'r', fr = sup === 'l' ? 'r' : 'l', sx = sup === 'l' ? 1 : -1;
    J[sup + 'kn'] = [sx * 0.05, 0.28, 0.0]; J[sup + 'an'] = [sx * 0.045, 0.045, -0.01]; J[sup + 'ft'] = [sx * 0.05, 0.015, 0.06];
    J[fr + 'kn'] = [-sx * 0.075, 0.285, 0.045]; J[fr + 'an'] = [-sx * 0.1, 0.055, -0.03]; J[fr + 'ft'] = [-sx * 0.12, 0.018, 0.03];
    return J;
  }
  function plinth(w, d, h, mat) { return T.mesh(new THREE.BoxGeometry(w, h, d), mat || M.stone({ color: 0x3a3632, roughness: 0.6 }), 0, -h / 2, 0); }
  function sdfMesh(P, box, res, mat, colorFn, kk) {
    var geo = T.sdfMesh(T.partsSdf(P, kk || 0.022), box[0], box[1], res, colorFn);
    if (colorFn) mat.vertexColors = true;
    return T.mesh(geo, mat);
  }
  function marble() {
    var m = M.marble({ color: 0xf2ebe0, roughness: 0.42 });
    return m;
  }

  /* ---------------- 다비드 */
  O.david = function () {
    var J = stand('r');
    J.head = [0.006, 0.925, 0.012];
    // 왼팔: 어깨로 올려 무릿매를 쥠, 오른팔: 늘어뜨려 돌을 쥠
    J.lel = [0.155, 0.69, 0.03]; J.lwr = [0.1, 0.8, 0.07]; J.lha = [0.085, 0.84, 0.06];
    J.rel = [-0.13, 0.63, -0.01]; J.rwr = [-0.135, 0.48, 0.0]; J.rha = [-0.13, 0.42, 0.01];
    var hair = function (x, y, z) { // 곱슬머리: 머리 위·뒤 덩어리 + 작은 혹
      var d = S.ell(x, y, z, [0.006, 0.948, -0.008], [0.066, 0.058, 0.07]);
      var bump = 0.004 * Math.sin(x * 260) * Math.sin(y * 240) * Math.sin(z * 250);
      return d + bump;
    };
    var P = body(J, { hair: hair });
    // 어깨 뒤로 넘긴 무릿매 끈
    P.push({ t: 'c', a: [0.085, 0.84, 0.05], b: [0.0, 0.82, -0.08], ra: 0.006, rb: 0.006, k: 0.01 });
    P.push({ t: 'c', a: [0.0, 0.82, -0.08], b: [-0.11, 0.55, -0.07], ra: 0.006, rb: 0.006, k: 0.01 });
    // 오른다리 뒤 나무 그루터기 받침
    P.push({ t: 'c', a: [-0.07, 0.0, -0.06], b: [-0.075, 0.3, -0.07], ra: 0.042, rb: 0.03, k: 0.02 });
    var mesh = sdfMesh(P, [[-0.22, -0.02, -0.16], [0.24, 1.0, 0.16]], 230, marble());
    var g = T.group(mesh);
    var rock = T.mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.04, 40), M.marble({ color: 0xe6ded0, roughness: 0.55 }), 0, -0.02, 0); g.add(rock);
    g.add(plinth(0.5, 0.5, 0.12).translateY(-0.04));
    g.userData = { elev: 8, exposure: 0.7 };
    return g;
  };

  /* ---------------- 밀로의 비너스 */
  O.venusmilo = function () {
    var J = stand('r');
    J.chest = [0.0, 0.72, 0.0]; J.head = [0.012, 0.925, 0.016]; J.headBase = [0.006, 0.86, 0.008];
    J.lsh[1] -= 0.01;
    var P = body(J, { fem: 1, noArms: true, stumps: true, hair: function (x, y, z) { return Math.min(S.ell(x, y, z, [0.012, 0.95, -0.01], [0.064, 0.05, 0.066]), S.sphere(x, y, z, [0.012, 0.93, -0.07], 0.03)); } });
    // 엉덩이 아래로 흘러내린 옷: 주름진 원뿔
    P.push({ t: 'f', k: 0.03, f: function (x, y, z) {
      if (y > 0.56) return 1;
      var cx = 0.0 + (0.52 - y) * 0.05, cz = (0.52 - y) * 0.06 - 0.005;
      var a = Math.atan2(x - cx, z - cz), r = Math.hypot(x - cx, z - cz);
      var R = 0.118 + (0.5 - y) * 0.085 + 0.009 * T.noise(a * 2.2, y * 9, 1.3) + 0.006 * Math.sin(a * 7 + y * 25 + 2 * T.noise(a, y * 4)) + 0.003 * Math.sin(a * 19 - y * 12);
      return Math.max(r - R, y - 0.55, -y);
    } });
    // 옷이 걸친 허리 매듭
    P.push({ t: 'c', a: [0.1, 0.53, 0.03], b: [-0.09, 0.5, 0.06], ra: 0.03, rb: 0.026, k: 0.03 });
    var mesh = sdfMesh(P, [[-0.22, -0.02, -0.17], [0.22, 1.0, 0.19]], 230, M.marble({ color: 0xece2d2, roughness: 0.45 }));
    var g = T.group(mesh, plinth(0.42, 0.42, 0.12, M.marble({ color: 0xd8cfbe, roughness: 0.6 })));
    g.userData = { elev: 8, exposure: 0.7 };
    return g;
  };

  /* ---------------- 사모트라케의 니케 */
  O.nike = function () {
    var J = stand('r');
    // 앞으로 숙인 몸, 머리·팔 없음
    J.chest = [0, 0.72, 0.035]; J.belly = [0, 0.6, 0.025]; J.neck = [0, 0.82, 0.05];
    J.lsh = [0.105, 0.8, 0.03]; J.rsh = [-0.105, 0.8, 0.03];
    J.lkn = [0.07, 0.28, 0.07]; J.lan = [0.08, 0.05, 0.02]; J.lft = [0.08, 0.02, 0.09];
    var P = body(J, { fem: 1, noArms: true, stumps: true, noHead: true });
    P.push({ t: 'c', a: J.neck, b: add(J.neck, [0, 0.03, 0.01]), ra: 0.034, rb: 0.03, k: 0.02 });
    // 젖은 옷이 휘날림: 다리 사이와 뒤로 흐르는 천
    P.push({ t: 'f', k: 0.035, f: function (x, y, z) {
      if (y > 0.6) return 1;
      var cx = -0.01, cz = -0.03 - (0.58 - y) * 0.28;
      var a = Math.atan2(x - cx, z - cz), r = Math.hypot((x - cx) * 1.1, z - cz);
      var R = 0.07 + (0.58 - y) * 0.12 + 0.008 * Math.sin(a * 9 + y * 40);
      return Math.max(r - R, y - 0.6, -y + 0.06, z - 0.0);
    } });
    var mesh = sdfMesh(P, [[-0.22, -0.02, -0.3], [0.22, 0.9, 0.2]], 230, M.marble({ color: 0xece4d6, roughness: 0.45 }));
    var g = T.group(mesh);
    // 날개 둘: 어깨뼈에서 뒤·위로 뻗은 깃털 판
    [-1, 1].forEach(function (sd) {
      var wing = T.group(), fm = M.marble({ color: 0xebe2d2, roughness: 0.5 });
      for (var row = 0; row < 3; row++) {
        var n = 12 - row * 3;
        for (var i = 0; i < n; i++) {
          var t = i / (n - 1), len = (0.14 + 0.3 * Math.pow(t, 0.8)) * (1 - row * 0.3), wd = 0.03 + row * 0.006, sh = new THREE.Shape();
          sh.moveTo(-wd / 2, 0); sh.quadraticCurveTo(-wd * 0.7, len * 0.6, 0, len); sh.quadraticCurveTo(wd * 0.7, len * 0.6, wd / 2, 0); sh.closePath();
          var f = T.mesh(T.extrude(sh, 0.01, 0.004), fm);
          var bx = t * 0.34, by = 0.06 + t * 0.12; // 뼈대(앞→뒤 끝)
          f.position.set(bx, by - row * 0.03, row * 0.012);
          f.rotation.z = -(0.1 + t * 0.7) + row * 0.1;
          wing.add(f);
        }
      }
      // 뼈대 방향: 뒤(-z)로 뻗고 조금 바깥으로
      wing.position.set(sd * 0.05, 0.72, -0.07);
      wing.rotation.set(0, sd > 0 ? 0.93 : Math.PI - 0.93, 0);
      wing.rotation.x = 0;
      g.add(wing);
    });
    // 뱃머리 받침
    var prow = new THREE.Shape(); prow.moveTo(-0.22, -0.3); prow.lineTo(0.22, -0.3); prow.lineTo(0.22, 0.2); prow.quadraticCurveTo(0.1, 0.42, 0, 0.5); prow.quadraticCurveTo(-0.1, 0.42, -0.22, 0.2); prow.closePath();
    var pg = new THREE.ExtrudeGeometry(prow, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
    pg.rotateX(-Math.PI / 2); pg.translate(0, -0.14, 0);
    g.add(T.mesh(pg, M.stone({ color: 0x8a8478, roughness: 0.7 })));
    g.userData = { elev: 10, exposure: 0.7 };
    return g;
  };

  /* ---------------- 라오콘 군상 */
  O.laocoon = function () {
    var P = [];
    // 가운데 아버지: 제단에 반쯤 앉아 뒤로 젖힘
    var J = {
      pelvis: [0, 0.42, 0.0], belly: [0.0, 0.5, 0.0], chest: [0.01, 0.62, -0.015], neck: [0.02, 0.72, -0.03], headBase: [0.025, 0.745, -0.03], head: [0.035, 0.8, -0.03],
      lsh: [0.11, 0.69, -0.02], rsh: [-0.1, 0.71, -0.025],
      lel: [0.2, 0.62, 0.02], lwr: [0.22, 0.52, 0.06], lha: [0.21, 0.48, 0.07],
      rel: [-0.17, 0.82, -0.04], rwr: [-0.1, 0.92, -0.06], rha: [-0.07, 0.94, -0.06],
      lhip: [0.06, 0.4, 0.0], lkn: [0.13, 0.36, 0.13], lan: [0.15, 0.12, 0.12], lft: [0.16, 0.08, 0.18],
      rhip: [-0.06, 0.4, 0.0], rkn: [-0.14, 0.3, 0.1], ran: [-0.2, 0.06, 0.08], rft: [-0.22, 0.03, 0.15]
    };
    P = P.concat(body(J, { head: T.headSdf(J.head, 0.07), hair: function (x, y, z) { return S.ell(x, y, z, [0.035, 0.82, -0.05], [0.07, 0.06, 0.07]) + 0.004 * Math.sin(x * 200) * Math.sin(y * 220); } }));
    P.push({ t: 'e', c: [0.035, 0.75, 0.01], r: [0.05, 0.05, 0.04], k: 0.02 }); // 수염
    // 두 아들 (작게)
    function son(x, sc, lean) {
      var J2 = stand(x > 0 ? 'l' : 'r'), o = {};
      Object.keys(J2).forEach(function (k) { var p = J2[k]; o[k] = [x + p[0] * sc + lean * (p[1] * sc), p[1] * sc, p[2] * sc]; });
      o.lel = [o.lsh[0] + 0.04, o.lsh[1] + 0.05, o.lsh[2]]; o.lwr = [o.lsh[0] + 0.02, o.lsh[1] + 0.13, o.lsh[2]];
      o.rel = [o.rsh[0] - 0.05, o.rsh[1] - 0.06, o.rsh[2] + 0.02]; o.rwr = [o.rsh[0] - 0.03, o.rsh[1] - 0.14, o.rsh[2] + 0.04];
      var parts = body(o, {});
      parts.forEach(function (p) { if (p.t === 'c') { p.ra *= sc; p.rb *= sc; } else if (p.t === 'e') p.r = p.r.map(function (q) { return q * sc; }); else if (p.t === 's') p.r *= sc; });
      parts.pop(); parts.push({ t: 'f', f: T.headSdf(o.head, 0.064 * sc), k: 0.015 });
      return parts;
    }
    P = P.concat(son(0.33, 0.7, -0.05)).concat(son(-0.32, 0.74, 0.06));
    // 뱀 두 마리: 몸을 휘감음
    function snake(pts, r) {
      var c = new THREE.CatmullRomCurve3(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));
      var n = 40, sp = c.getSpacedPoints(n);
      for (var i = 0; i < n; i++) P.push({ t: 'c', a: [sp[i].x, sp[i].y, sp[i].z], b: [sp[i + 1].x, sp[i + 1].y, sp[i + 1].z], ra: r * (1 - i / n * 0.5), rb: r * (1 - (i + 1) / n * 0.5), k: 0.012 });
    }
    snake([[0.42, 0.05, 0.05], [0.3, 0.25, 0.1], [0.12, 0.4, 0.09], [-0.05, 0.47, 0.08], [-0.15, 0.55, 0.0], [-0.05, 0.62, -0.08], [0.15, 0.58, -0.02], [0.24, 0.55, 0.08], [0.21, 0.5, 0.12]], 0.022);
    snake([[-0.38, 0.05, 0.08], [-0.3, 0.2, 0.08], [-0.2, 0.3, 0.12], [-0.32, 0.38, 0.06], [-0.4, 0.45, -0.02], [-0.25, 0.47, -0.08], [-0.1, 0.4, 0.02], [0.03, 0.33, 0.1]], 0.02);
    // 제단 (계단)
    P.push({ t: 'b', c: [0, 0.18, -0.02], b: [0.16, 0.2, 0.12], rr: 0.01, k: 0.01 });
    var mesh = sdfMesh(P, [[-0.5, -0.02, -0.2], [0.5, 1.02, 0.25]], 260, M.marble({ color: 0xebe2d2, roughness: 0.45 }), null, 0.02);
    var g = T.group(mesh, plinth(1.0, 0.45, 0.1, M.marble({ color: 0xd8cfbe, roughness: 0.6 })));
    g.userData = { elev: 10, exposure: 0.7 };
    return g;
  };

  /* ---------------- 네페르티티 흉상 (채색) */
  O.nefertiti = function () {
    var hc = [0, 0.62, 0.02], r = 0.13;
    var head = T.headSdf(hc, r, { noEars: false });
    var P = [{ t: 'f', f: head, k: 0.02 }];
    // 긴 목·어깨 단면
    P.push({ t: 'c', a: [0, 0.3, -0.02], b: [0, 0.52, 0.0], ra: 0.06, rb: 0.055, k: 0.04 });
    P.push({ t: 'f', k: 0.06, f: function (x, y, z) { // 어깨 단면: 넓고 납작한 가슴, 아래는 잘림
      var d = S.box(x, y, z, [0, 0.16, -0.03], [0.21, 0.12, 0.085], 0.07);
      return Math.max(d, -y + 0.04);
    } });
    // 위가 평평한 푸른 관 (뒤로 비스듬히 올라감)
    P.push({ t: 'f', k: 0.03, f: function (x, y, z) {
      var t = Math.max(0, Math.min(1, (y - 0.66) / 0.2)), cz = -0.03 - t * 0.09, rx = 0.098 + t * 0.045, rz = 0.1 + t * 0.04;
      var d = Math.hypot(x / rx, (z - cz) / rz) - 1;
      return Math.max(d * Math.min(rx, rz), y - 0.86, 0.66 - y);
    } });
    function col(x, y, z, n) {
      // 관
      var crownT = (y - 0.66) / 0.2, cz = -0.03 - Math.max(0, crownT) * 0.09;
      if (y > 0.69 && Math.hypot(x, z - cz) > 0.06) {
        if (Math.abs(y - 0.72) < 0.012) return [0.82, 0.6, 0.18]; // 금띠
        return [0.07, 0.17, 0.42];
      }
      if (y < 0.33 && y > 0.12) { // 넓은 목걸이: 띠
        var b = Math.floor((0.33 - y) / 0.02) % 4;
        if (z > 0.0) return [[0.12, 0.42, 0.28], [0.75, 0.2, 0.12], [0.85, 0.65, 0.2], [0.12, 0.3, 0.55]][b];
        return [0.55, 0.32, 0.2];
      }
      // 입술
      if (y > 0.54 && y < 0.565 && Math.abs(x) < 0.03 && z > 0.08) return [0.6, 0.18, 0.12];
      // 눈썹·눈매
      if (z > 0.08 && Math.abs(Math.abs(x) - 0.033) < 0.022 && Math.abs(y - 0.655) < 0.004) return [0.08, 0.06, 0.05];
      if (z > 0.09 && Math.abs(Math.abs(x) - 0.033) < 0.012 && Math.abs(y - 0.627) < 0.006) return Math.abs(y - 0.627) < 0.003 ? [0.05, 0.04, 0.04] : [0.85, 0.82, 0.75];
      return [0.66, 0.4, 0.24]; // 살빛
    }
    var mesh = sdfMesh(P, [[-0.32, 0.0, -0.24], [0.32, 0.9, 0.2]], 220, M.marble({ color: 0xffffff, roughness: 0.55, clearcoat: 0.1, sheen: 0 }), col);
    var g = T.group(mesh, plinth(0.6, 0.4, 0.06, M.stone({ color: 0x2a2826 })));
    g.userData = { elev: 6 };
    return g;
  };

  /* ---------------- 베닌 청동 두상 (오바) */
  O.benin = function () {
    var hc = [0, 0.62, 0.0], r = 0.13;
    var head = T.headSdf(hc, r);
    var P = [{ t: 'f', f: head, k: 0.02 }];
    // 구슬 목걸이 높은 깃 (턱까지)
    P.push({ t: 'f', k: 0.01, f: function (x, y, z) {
      if (y > 0.56 || y < 0.12) return Math.max(y - 0.56, 0.12 - y, 0.0) + 0.01;
      var rr = 0.125 + (0.56 - y) * 0.12, ring = 0.006 * Math.cos((y - 0.12) / 0.026 * Math.PI * 2);
      return Math.hypot(x, z * 1.05) - rr - ring;
    } });
    // 구슬 모자 + 양옆 날개 장식
    P.push({ t: 'f', k: 0.02, f: function (x, y, z) {
      var d = S.ell(x, y, z, [0, 0.69, -0.02], [0.115, 0.1, 0.12]);
      var bead = 0.004 * Math.sin(x * 230) * Math.sin(y * 230 + z * 200);
      return Math.max(d + bead, 0.66 - y);
    } });
    [-1, 1].forEach(function (sd) { P.push({ t: 'e', c: [sd * 0.12, 0.75, -0.05], r: [0.015, 0.07, 0.04], k: 0.02 }); });
    // 아래 둥근 받침 테
    P.push({ t: 'f', k: 0.01, f: function (x, y, z) { return Math.max(Math.hypot(x, z) - 0.24, y - 0.12, -y); } });
    var mesh = sdfMesh(P, [[-0.27, -0.02, -0.27], [0.27, 0.82, 0.27]], 210, M.bronze({ color: 0x8a5a30, roughness: 0.38 }), function (x, y, z) {
      var n = 0.5 + 0.5 * T.noise(x * 30, y * 30, z * 30); return n > 0.72 ? [0.38, 0.45, 0.32] : [0.75 + n * 0.2, 0.55 + n * 0.15, 0.4];
    });
    var g = T.group(mesh, plinth(0.6, 0.6, 0.05, M.lacquer()));
    g.userData = { elev: 8 };
    return g;
  };

  /* ---------------- 첼리니의 소금 그릇 (살리에라) */
  O.saliera = function () {
    function recline(x0, dir, fem) {
      // 비스듬히 누운 사람: 몸통을 기울이고 다리를 앞으로 뻗음
      var s = 0.55, J = {
        pelvis: [x0, 0.2, 0], belly: [x0 + dir * 0.03, 0.27, 0], chest: [x0 + dir * 0.06, 0.35, 0.0], neck: [x0 + dir * 0.08, 0.42, 0], headBase: [x0 + dir * 0.085, 0.44, 0.0], head: [x0 + dir * 0.095, 0.49, 0.01],
        lsh: [x0 + dir * 0.06, 0.4, 0.06], rsh: [x0 + dir * 0.08, 0.4, -0.06],
        lel: [x0 + dir * 0.0, 0.33, 0.1], lwr: [x0 - dir * 0.03, 0.26, 0.1], rel: [x0 + dir * 0.16, 0.44, -0.08], rwr: [x0 + dir * 0.22, 0.52, -0.06],
        lhip: [x0, 0.19, 0.04], lkn: [x0 - dir * 0.18, 0.24, 0.07], lan: [x0 - dir * 0.36, 0.13, 0.05], lft: [x0 - dir * 0.4, 0.12, 0.06],
        rhip: [x0, 0.19, -0.04], rkn: [x0 - dir * 0.17, 0.16, -0.05], ran: [x0 - dir * 0.34, 0.1, -0.08], rft: [x0 - dir * 0.38, 0.09, -0.08]
      };
      var parts = body(J, { fem: fem });
      return parts;
    }
    var P = recline(0.22, -1, 0).concat(recline(-0.22, 1, 1));
    P.push({ t: 'c', a: [0.36, 0.48, -0.06], b: [0.36, 0.22, -0.06], ra: 0.006, rb: 0.006, k: 0.005 }); // 삼지창 자루
    var mesh = sdfMesh(P, [[-0.5, 0.0, -0.2], [0.5, 0.62, 0.2]], 240, M.gold({ roughness: 0.22 }), null, 0.02);
    var g = T.group(mesh);
    // 소금 배와 작은 신전, 흑단 받침 + 에나멜 띠
    var boat = T.mesh(T.lathe(T.smoothProfile([[0, 0], [0.06, 0.0], [0.08, 0.04], [0.07, 0.05], [0.0, 0.03]], 20), 32), M.gold(), 0.14, 0.09, 0.12); boat.scale.set(1.6, 1, 0.8); g.add(boat);
    var temple = T.group(T.mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), M.gold()), T.mesh(new THREE.ConeGeometry(0.065, 0.05, 4), M.gold(), 0, 0.075, 0).rotateY(Math.PI / 4));
    temple.position.set(-0.16, 0.14, -0.1); g.add(temple);
    var bs = T.lathe(T.smoothProfile([[0, 0], [0.5, 0.0], [0.52, 0.03], [0.5, 0.07], [0.48, 0.09], [0.0, 0.09]], 30), 96);
    var bm = T.mesh(bs, M.lacquer({ color: 0x0c0806 }), 0, 0, 0); bm.scale.set(1, 1, 0.62); g.add(bm);
    var band = T.mesh(new THREE.TorusGeometry(0.5, 0.012, 8, 96), M.gold(), 0, 0.045, 0); band.rotation.x = Math.PI / 2; band.scale.set(1.02, 0.63, 1); g.add(band);
    for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2; var f = T.mesh(new THREE.SphereGeometry(0.03, 12, 10), M.gold(), Math.cos(a) * 0.51, 0.045, Math.sin(a) * 0.32); g.add(f); }
    g.userData = { elev: 18 };
    return g;
  };
})(T3);
