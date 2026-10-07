'use strict';
/* 암시장 명검 아이콘 5종을 굽는다: node run_bmswords.js <나갈 폴더>  → claymore.png · shivablade.png · runeblade.png · paladin.png · muramasa.png (256×256 투명)
   webp로 바꿔 images/items/ 에 넣고 python tools/images.py */
const fs = require('fs'), path = require('path'), HERE = __dirname;
let pw; try { pw = require(path.join(HERE, 'node_modules', 'playwright-core')); } catch (e) { pw = require('playwright'); }
const T = path.join(HERE, 'node_modules', 'three');
const LIBS = ['build/three.min.js', 'examples/js/environments/RoomEnvironment.js', 'examples/js/math/ConvexHull.js', 'examples/js/geometries/ConvexGeometry.js', 'examples/js/utils/BufferGeometryUtils.js'].map(f => path.join(T, f));
const IDS = (process.argv[3] || 'claymore,shivablade,runeblade,paladin,muramasa').split(',');
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage(); page.on('pageerror', e => console.log('ERR', e.message)); page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.setContent('<html><body></body></html>');
  for (const f of LIBS.concat([path.join(HERE, 'lib.js'), path.join(HERE, 'objs', '80_bmswords.js')])) await page.addScriptTag({ path: f });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const icons = await page.evaluate((ids) => {
    THREE.ColorManagement.legacyMode = false;
    /* 칼을 비스듬히 눕혀(칼끝 왼쪽 아래) 정면에서 찍는다 — images/items 의 다른 칼과 같은 구도 */
    function shot(build, px) {
      var r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setPixelRatio(1); r.setSize(px * 3, px * 3); r.setClearColor(0x000000, 0);
      r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.physicallyCorrectLights = true;
      var pm = new THREE.PMREMGenerator(r), sc = new THREE.Scene();
      // 밝은 회색 방 + 앞·위의 큰 소프트박스: 정면에서 본 납작한 날이 밝은 강철빛으로 비친다
      var env = new THREE.Scene();
      env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x5a5856, side: THREE.BackSide })));
      function panel(w, h, p, k, col) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(p[0], p[1], p[2]); m.lookAt(0, 0, 0); env.add(m); }
      panel(14, 8, [-3, 4, 9], 1.6, 0xfff4e6); panel(4, 14, [8, 0, 6], 1.1, 0xdde8ff); panel(16, 5, [0, 10, 0], 1.4, 0xffffff); panel(6, 3, [0, -6, 8], 0.5, 0xffe8d0);
      sc.environment = pm.fromScene(env, 0.02).texture;
      var inner = build(); inner.rotation.y = 0.32;        // 날을 조금 돌려 반사가 비스듬히 흐르게
      var g = new THREE.Group(); g.add(inner); g.rotation.z = -Math.PI / 4; sc.add(g);
      var box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
      var half = Math.max(sz.x, sz.y) * 0.53;
      var cam = new THREE.OrthographicCamera(-half, half, half, -half, 0.01, 50);
      cam.position.set(c.x + 0.6, c.y + 1.2, c.z + 10); cam.lookAt(c.x, c.y, c.z);
      var key = new THREE.DirectionalLight(0xfff0dd, 3.0); key.position.set(-3, 4, 5); sc.add(key);
      var fill = new THREE.DirectionalLight(0xdde8ff, 1.0); fill.position.set(4, -1, 3); sc.add(fill);
      sc.add(new THREE.HemisphereLight(0xffffff, 0x404040, 0.5));
      r.render(sc, cam);
      var o = document.createElement('canvas'); o.width = o.height = px;
      var x = o.getContext('2d'); x.imageSmoothingQuality = 'high';
      x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = px * 0.02; x.shadowOffsetX = px * 0.006; x.shadowOffsetY = px * 0.012;
      x.drawImage(r.domElement, 0, 0, px, px);
      r.dispose();
      return o.toDataURL('image/png');
    }
    var o = {};
    ids.forEach(function (id) { T3.seed(id); o[id] = shot(T3.OBJ[id], 256); });
    return o;
  }, IDS);
  for (const k in icons) fs.writeFileSync(path.join(out, k + '.png'), Buffer.from(icons[k].split(',')[1], 'base64'));
  await b.close(); console.log('ok', Object.keys(icons).join(','));
})();
