'use strict';
/* 무열왕릉 발견 그림의 원화(4×4 마스터 시트)를 three.js로 굽는다 — tools/ruin_gifs/build_v2.py 가 이 시트로 연필·수채화 GIF를 만든다.
   node run_muyeol.js <나갈 png>   (기본: ../ruin_gifs/v2/master/muyeol.png)
   칸 순서(build_v2.py와 약속): 0~6 = 7단계(터 고르기 → 둘레돌 → 흙 쌓기 → 떼 입히기·돌거북 → 머릿돌 → 소나무·길 → 뒤쪽 고분과 산)
                              7 = 완성(쓰지 않음) · 8~15 = 완성된 능을 여덟 방향에서 (드론 회전)
   모양: 지름 약 36m·높이 약 9m의 둥근 흙무덤(봉분), 밑둘레에 드문드문 드러난 자연석, 앞쪽 왼편에 비석 몸돌이 없어진 돌거북(귀부)과
         용 여섯 마리를 새긴 머릿돌(이수). 뒤로 선도산 기슭을 따라 작은 고분 넷이 줄지어 있다. */
const fs = require('fs'), path = require('path'), HERE = __dirname;
let pw; try { pw = require(path.join(HERE, 'node_modules', 'playwright-core')); } catch (e) { pw = require('playwright'); }
const THREE_JS = path.join(HERE, 'node_modules', 'three', 'build', 'three.min.js');
const OUT = process.argv[2] || path.join(HERE, '..', 'ruin_gifs', 'v2', 'master', 'muyeol.png');
const CELL = 512;
(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage(); page.on('pageerror', e => console.log('ERR', e.message)); page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.setContent('<html><body style="margin:0;background:#000"></body></html>');
  await page.addScriptTag({ path: THREE_JS });
  const url = await page.evaluate((CELL) => {
    THREE.ColorManagement.legacyMode = false;
    let seed = 7;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const rr = (a, b) => a + (b - a) * rnd();
    function noiseCanvas(w, h, base, spots) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < spots.n; i++) { g.fillStyle = spots.cols[Math.floor(rnd() * spots.cols.length)]; g.globalAlpha = rr(0.15, 0.45); const x = rr(0, w), y = rr(0, h), r = rr(spots.r0, spots.r1); g.beginPath(); g.ellipse(x, y, r, r * rr(0.4, 1), rr(0, 3), 0, 7); g.fill(); }
      g.globalAlpha = 1; return c;
    }
    function tex(c, rep) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
    const grassTex = tex(noiseCanvas(256, 256, '#6f8f3c', { n: 900, r0: 1, r1: 5, cols: ['#86a648', '#55722c', '#93ad55', '#4f6a28'] }), 8);
    const earthTex = tex(noiseCanvas(256, 256, '#8a6a44', { n: 700, r0: 1, r1: 6, cols: ['#a07c50', '#6e5234', '#b08c5c', '#5e4428'] }), 6);
    const patchTex = (() => { const c = noiseCanvas(512, 512, '#8a6a44', { n: 500, r0: 1, r1: 5, cols: ['#a07c50', '#6e5234'] }); const g = c.getContext('2d'); for (let i = 0; i < 70; i++) { g.fillStyle = ['#6f8f3c', '#86a648', '#55722c'][i % 3]; g.globalAlpha = 0.9; g.beginPath(); g.ellipse(rr(0, 512), rr(0, 512), rr(20, 60), rr(12, 40), rr(0, 3), 0, 7); g.fill(); } return tex(c, 2); })();
    const stoneTex = tex(noiseCanvas(256, 256, '#9a948a', { n: 900, r0: 0.5, r1: 3, cols: ['#b4aea2', '#7c766c', '#8a857a', '#c2bcb0'] }), 2);
    const M = {
      grass: new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95 }),
      earth: new THREE.MeshStandardMaterial({ map: earthTex, roughness: 1 }),
      patch: new THREE.MeshStandardMaterial({ map: patchTex, roughness: 1 }),
      stone: new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 }),
      path: new THREE.MeshStandardMaterial({ color: 0xcdb98e, roughness: 1 }),
      bark: new THREE.MeshStandardMaterial({ color: 0x7a4a30, roughness: 0.9 }),
      pine: new THREE.MeshStandardMaterial({ color: 0x2f5a32, roughness: 0.9 }),
      pine2: new THREE.MeshStandardMaterial({ color: 0x3d6e3a, roughness: 0.9 }),
      hill: new THREE.MeshStandardMaterial({ color: 0x5f7f4a, roughness: 1 }),
      hillFar: new THREE.MeshStandardMaterial({ color: 0x8aa0a0, roughness: 1 }),
      wood: new THREE.MeshStandardMaterial({ color: 0xb08850, roughness: 0.9 }),
      rope: new THREE.MeshStandardMaterial({ color: 0xe0d0a0, roughness: 0.9 })
    };
    const R = 10, HH = 5.6;   // 봉분 반지름·높이
    function mound(h, mat, r) {
      const pts = []; r = r || R;
      for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(Math.max(0.001, r * Math.cos(t * Math.PI / 2) * (1 + 0.04 * Math.sin(t * 9))), h * Math.pow(Math.sin(t * Math.PI / 2), 0.9))); }
      const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), mat); m.castShadow = m.receiveShadow = true; return m;
    }
    function rock(s) { const g = new THREE.DodecahedronGeometry(s, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * rr(0.8, 1.25), p.getY(i) * rr(0.55, 0.8), p.getZ(i) * rr(0.8, 1.2)); g.computeVertexNormals(); const m = new THREE.Mesh(g, M.stone); m.castShadow = m.receiveShadow = true; return m; }
    function curb(full) {
      const g = new THREE.Group(), n = 56;
      for (let i = 0; i < n; i++) { if (!full && rnd() < 0.45) continue; const a = i / n * Math.PI * 2, r = rock(rr(0.45, 0.75)); r.position.set(Math.cos(a) * (R + 0.15), 0.18, Math.sin(a) * (R + 0.15)); r.rotation.y = rr(0, 6); g.add(r); }
      return g;
    }
    function pineTree(h) {
      const g = new THREE.Group(), lean = rr(-0.25, 0.25);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * h / 6, 0.3 * h / 6, h, 8), M.bark); trunk.position.y = h / 2; trunk.rotation.z = lean; trunk.castShadow = true; g.add(trunk);
      for (let k = 0; k < 4; k++) {
        const c = new THREE.Mesh(new THREE.SphereGeometry(rr(0.9, 1.5) * h / 6, 10, 8), k % 2 ? M.pine : M.pine2);
        c.scale.set(1.6, 0.55, 1.3); c.position.set(Math.sin(lean) * -h * 0.8 + rr(-0.8, 0.8), h * (0.72 + k * 0.1), rr(-0.8, 0.8)); c.castShadow = true; g.add(c);
      }
      return g;
    }
    // 돌거북(귀부)과 머릿돌(이수)
    function tortoise() {
      const g = new THREE.Group(), s = 1.6;
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.0 * s, 0.35 * s, 2.3 * s), M.stone); base.position.y = 0.17 * s; g.add(base);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.15 * s, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.stone); shell.scale.set(1.25, 0.62, 0.95); shell.position.y = 0.35 * s; g.add(shell);
      // 등딱지 무늬: 둥근 테 둘
      [0.55, 0.85].forEach(k => { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15 * s * k, 0.035 * s, 6, 40), M.stone); ring.rotation.x = Math.PI / 2; ring.scale.set(1.25, 0.95, 1); ring.position.y = 0.35 * s + 0.62 * 1.15 * s * Math.sqrt(1 - k * k) - 0.02; g.add(ring); });
      // 목과 머리 (앞 = +x), 고개를 쳐든 모습
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * s, 0.36 * s, 0.9 * s, 12), M.stone); neck.rotation.z = -1.0; neck.position.set(1.55 * s, 0.75 * s, 0); g.add(neck);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.38 * s, 16, 12), M.stone); head.scale.set(1.35, 0.9, 0.9); head.position.set(1.95 * s, 1.05 * s, 0); g.add(head);
      [-1, 1].forEach(sd => { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 8, 6), M.stone); eye.position.set(2.15 * s, 1.18 * s, sd * 0.22 * s); g.add(eye); });
      // 발 넷
      [[0.8, 0.85], [0.8, -0.85], [-0.8, 0.85], [-0.8, -0.85]].forEach(p => { const leg = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 10, 8), M.stone); leg.scale.set(1.3, 0.7, 1); leg.position.set(p[0] * s, 0.45 * s, p[1] * s); g.add(leg); });
      g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      return g;
    }
    function capstone() {
      const g = new THREE.Group(), s = 1.6;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.55 * s, 1.0 * s, 1.9 * s), M.stone); slab.position.y = 0.5 * s; g.add(slab);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.95 * s, 0.95 * s, 0.55 * s, 32, 1, false, 0, Math.PI), M.stone); top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2; top.scale.set(1, 1, 0.62); top.position.y = 1.0 * s; g.add(top);
      // 용 여섯 마리: 양쪽 가장자리를 타고 오르는 굵은 줄
      [-1, 1].forEach(side => {
        for (let k = 0; k < 3; k++) {
          const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, a = Math.PI * (0.05 + 0.42 * t) + k * 0.12; pts.push(new THREE.Vector3(side * 0.3 * s, 0.2 * s + Math.sin(a) * (0.95 + k * 0.05) * s + 0.05 * Math.sin(t * 12), Math.cos(a) * (0.95 - k * 0.12) * s * (side > 0 ? 1 : 1) * (k % 2 ? -1 : 1))); }
          const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.07 * s, 6), M.stone); g.add(tube);
        }
      });
      // 가운데 글씨 자리 (여덟 글자를 새긴 네모)
      [-1, 1].forEach(side => { const panel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5 * s, 0.32 * s), new THREE.MeshStandardMaterial({ color: 0x6e695f, roughness: 1 })); panel.position.set(side * 0.29 * s, 0.75 * s, 0); g.add(panel); });
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 12, 10), M.stone); pearl.position.y = 1.55 * s; g.add(pearl);
      g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      return g;
    }
    function skyCanvas() {
      const c = document.createElement('canvas'); c.width = 16; c.height = 256; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#8fb4d8'); gr.addColorStop(0.6, '#d8e4ea'); gr.addColorStop(1, '#efe8d8'); g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    }
    const STELE = new THREE.Vector3(-6.5, 0, 15.5);
    function build(stage) {
      seed = 7;
      const sc = new THREE.Scene(); sc.background = skyCanvas();
      sc.fog = new THREE.Fog(0xdfe6e4, 60, 170);
      const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 64), stage <= 1 ? M.earth : M.grass); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; sc.add(ground);
      // 터: 봉분 자리는 흙빛
      if (stage <= 3) { const pad = new THREE.Mesh(new THREE.CircleGeometry(R + 3, 48), M.earth); pad.rotation.x = -Math.PI / 2; pad.position.y = 0.02; pad.receiveShadow = true; sc.add(pad); }
      // 뒤쪽 산 (선도산)
      [[-30, -95, 40, 26, M.hillFar], [35, -110, 55, 32, M.hillFar], [-5, -70, 38, 16, M.hill], [40, -60, 28, 11, M.hill], [-50, -55, 30, 12, M.hill]].forEach(h => { const m = mound(h[3], h[4], h[2]); m.position.set(h[0], 0, h[1]); sc.add(m); });
      // 둘레의 낮은 산들 (어느 쪽을 보아도 들판 끝에 산이 보이게)
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + 0.3; if (Math.sin(a) < -0.6) continue; const m = mound(rr(12, 22), M.hillFar, rr(30, 45)); m.position.set(Math.cos(a) * 125, -2, Math.sin(a) * 125); sc.add(m); }
      // 1단계: 말뚝과 줄로 둘레를 잡는다
      if (stage === 0) {
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, st = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.4, 6), M.wood); st.position.set(Math.cos(a) * R, 0.7, Math.sin(a) * R); st.castShadow = true; sc.add(st); }
        const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.03, 4, 64), M.rope); ring.rotation.x = Math.PI / 2; ring.position.y = 1.1; sc.add(ring);
        const pile = mound(1.6, M.earth, 3); pile.position.set(4, 0, -3); sc.add(pile);
        const pile2 = mound(1.1, M.earth, 2.2); pile2.position.set(-3, 0, 2); sc.add(pile2);
      }
      if (stage >= 1) sc.add(curb(stage <= 2));
      if (stage === 1) sc.add(mound(HH * 0.3, M.earth));
      if (stage === 2) sc.add(mound(HH, M.earth));
      if (stage === 3) sc.add(mound(HH, M.patch));
      if (stage >= 4) sc.add(mound(HH, M.grass));
      if (stage >= 3) { const t = tortoise(); t.position.copy(STELE); t.rotation.y = Math.atan2(-(STELE.z), STELE.x) + Math.PI; t.rotation.y = -Math.PI / 2 + 0.35; sc.add(t); if (stage >= 4) { const c = capstone(); c.position.set(STELE.x, 1.65, STELE.z); c.rotation.y = t.rotation.y; sc.add(c); } }
      if (stage >= 5) {
        // 소나무 숲과 능으로 드는 흙길
        for (let i = 0; i < 7; i++) { const t = pineTree(rr(6, 9)); t.position.set(rr(-16, 16), 0, rr(-24, -15)); t.userData.tree = 1; sc.add(t); }
        const pathM = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 40), M.path); pathM.rotation.x = -Math.PI / 2; pathM.rotation.z = 0.25; pathM.position.set(-3, 0.03, 26); pathM.receiveShadow = true; sc.add(pathM);
        for (let i = 0; i < 40; i++) { const a = rr(0, Math.PI * 2), d = rr(52, 85); const t = pineTree(rr(5, 8.5)); t.position.set(Math.cos(a) * d, 0, Math.sin(a) * d - 4); t.rotation.y = rr(0, 6); sc.add(t); }
      }
      if (stage >= 6) {
        // 선도산 기슭을 따라 오르는 작은 고분 넷 (서악동 고분군)
        [[-14, -30, 7, 3.6], [-6, -44, 6.5, 3.4], [4, -57, 6, 3.2], [13, -69, 5.5, 3]].forEach(t => { const m = mound(t[3], M.grass, t[2]); m.position.set(t[0], 0, t[1]); sc.add(m); });
      }
      // 빛
      const sun = new THREE.DirectionalLight(0xfff0d8, 3.2); sun.position.set(-40, 60, 35); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 200 }); sun.shadow.bias = -0.0005; sc.add(sun);
      sc.add(new THREE.HemisphereLight(0xcfe0f0, 0x5a5030, 1.1));
      return sc;
    }
    const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(CELL, CELL); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.physicallyCorrectLights = true;
    const cam = new THREE.PerspectiveCamera(38, 1, 0.5, 400);
    function view(az, dist, el) { const target = new THREE.Vector3(-2, 2.2, 3); cam.position.set(target.x + Math.sin(az) * dist * Math.cos(el), target.y + Math.sin(el) * dist, target.z + Math.cos(az) * dist * Math.cos(el)); cam.lookAt(target); }
    const out = document.createElement('canvas'); out.width = CELL * 4; out.height = CELL * 4; const og = out.getContext('2d');
    const shots = [];
    for (let st = 0; st < 7; st++) shots.push([st, 0.42, 44, 0.32]);
    shots.push([6, 0.42, 44, 0.32]);
    for (let k = 0; k < 8; k++) shots.push([6, 0.42 + k * Math.PI / 4, 44, 0.42]);
    const cache = {};
    shots.forEach((s, i) => {
      const sc = cache[s[0]] || (cache[s[0]] = build(s[0]));
      view(s[1], s[2], s[3]);
      sc.traverse(o => { if (o.userData.tree) o.visible = Math.hypot(o.position.x - cam.position.x, o.position.z - cam.position.z) > 30; });   // 사진기 바로 앞의 소나무는 치운다
      r.render(sc, cam);
      og.drawImage(r.domElement, (i % 4) * CELL, Math.floor(i / 4) * CELL);
    });
    return out.toDataURL('image/png');
  }, CELL);
  fs.writeFileSync(OUT, Buffer.from(url.split(',')[1], 'base64'));
  await b.close(); console.log('ok', OUT);
})();
