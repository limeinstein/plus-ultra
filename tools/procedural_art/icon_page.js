/* 교역품 아이콘(192×192 투명) — 3D 모형을 위에서 비스듬히 */
(function (T) {
  T.icon = function (build, px) {
    var r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(px * 2, px * 2); r.setClearColor(0x000000, 0);
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.physicallyCorrectLights = true;
    var pm = new THREE.PMREMGenerator(r), sc = new THREE.Scene();
    sc.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    var g = build(); sc.add(g);
    var box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    var R = Math.max(sz.x, sz.y, sz.z) * 0.62, cam = new THREE.PerspectiveCamera(28, 1, 0.01, 50);
    var d = R / Math.tan(14 * Math.PI / 180);
    cam.position.set(c.x + d * 0.15, c.y + d * 0.55, c.z + d * 0.82); cam.lookAt(c);
    var key = new THREE.DirectionalLight(0xfff0dd, 3.2); key.position.set(-2, 4, 3); sc.add(key);
    var fill = new THREE.DirectionalLight(0xdde8ff, 1.0); fill.position.set(3, 1, 2); sc.add(fill);
    sc.add(new THREE.HemisphereLight(0xffffff, 0x404040, 0.6));
    r.render(sc, cam);
    var out = document.createElement('canvas'); out.width = out.height = px;
    var o = out.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(r.domElement, 0, 0, px, px);
    r.dispose();
    return out.toDataURL('image/png');
  };
})(T3);
