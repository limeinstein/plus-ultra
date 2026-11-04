/* 피노키오 목각 장난감 v3 (2026-11-04 저작권 QA 7번) — 콜로디 원작(1883)의 차림으로 고쳐 그린다.
   v2의 깃털 꽂은 모자·푸른 띠·흰 옷깃은 디즈니 영화판 피노키오의 특징이라 뺐다.
   원작: 빵 속살로 만든 뾰족한 작은 모자 · 꽃무늬 종이옷 · 나무껍질 신. 쓰는 법: node tools/procedural_art/run_puppet3.js (BROWSER_EXE로 Chrome 경로) */
'use strict';
const fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('./node_modules/playwright-core')); } catch (e) { ({ chromium } = require('playwright')); }
const ROOT = path.resolve(__dirname, '../..');
const OUTPUT = path.join(ROOT, 'tools/addition_art/sources/pinocchio_doll-v3.png');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.setContent('<html><body></body></html>');
    for (const file of ['node_modules/three/build/three.min.js', 'node_modules/three/examples/js/environments/RoomEnvironment.js', 'lib.js', 'icon_page.js'])
      await page.addScriptTag({ path: path.join(__dirname, file) });
    const png = await page.evaluate(() => {
      T3.seed('pinocchio_doll');
      return T3.icon(function () {
        const g = new THREE.Group();
        const grain = T3.canvas(512, 512, (c, w, h) => {
          c.fillStyle = '#c99557'; c.fillRect(0, 0, w, h);
          for (let x = 0; x < w; x += 2) {
            c.beginPath(); c.strokeStyle = 'rgba(91,49,18,' + (.05 + T3.rnd()*.16) + ')';
            for (let y = 0; y <= h; y += 4) {
              const u = x + Math.sin(y*.018 + x*.06)*3 + Math.sin(y*.045+x)*.5;
              if (y) c.lineTo(u, y); else c.moveTo(u, y);
            }
            c.stroke();
          }
        });
        const wood = T3.texMat(T3.mat.wood, grain, { roughness: .43, clearcoat: .25 });
        const dark = T3.mat.wood({ color: 0x754829, roughness: .55 });
        // 꽃무늬 종이옷: 누런 종이 바탕에 작은 꽃을 찍는다 (원작 「꽃무늬 종이로 지은 옷」)
        const paperTex = (base) => T3.canvas(512, 512, (c, w, h) => {
          c.fillStyle = base; c.fillRect(0, 0, w, h);
          for (let i = 0; i < 2600; i++) { c.fillStyle = 'rgba(120,90,50,' + (T3.rnd() * .05) + ')'; c.fillRect(T3.rnd() * w, T3.rnd() * h, 2, 2); }
          for (let y = 18; y < h; y += 46) for (let x = (y / 46 % 2) * 23 + 12; x < w; x += 46) {
            const cx = x + (T3.rnd() - .5) * 8, cy = y + (T3.rnd() - .5) * 8, pc = ['#b4473a', '#c9893a', '#5a7fa8'][Math.floor(T3.rnd() * 3)];
            for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; c.fillStyle = pc; c.beginPath(); c.arc(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 4.5, 0, Math.PI * 2); c.fill(); }
            c.fillStyle = '#e8c860'; c.beginPath(); c.arc(cx, cy, 3.4, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#5d7a3f'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + 8, cy + 6); c.lineTo(cx + 15, cy + 13); c.stroke();
          }
        });
        const red = T3.texMat(T3.mat.matte, paperTex('#e6d6b2'), { roughness: .86 });
        const blue = T3.texMat(T3.mat.matte, paperTex('#c9b48a'), { roughness: .88 });
        const crumb = T3.mat.matte({ color: 0xe2cc9a, roughness: .95 });   // 빵 속살 모자
        const ivory = T3.mat.matte({ color: 0xe5d7b3 });
        const black = T3.mat.matte({ color: 0x241c17 });
        const gold = T3.mat.gold({ roughness: .48 });
        function mesh(geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); g.add(m); return m; }
        function ball(x,y,z,r,mat=wood,scale) { const m=mesh(new THREE.SphereGeometry(r,40,28),mat,x,y,z); if(scale)m.scale.set(...scale); return m; }
        function rod(a,b,r,mat=wood,r2=r) {
          const p=new THREE.Vector3(...a), q=new THREE.Vector3(...b), v=q.clone().sub(p);
          const m=mesh(new THREE.CylinderGeometry(r2,r,v.length(),32),mat,...p.clone().add(q).multiplyScalar(.5).toArray());
          m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()); return m;
        }
        // 두꺼운 칠을 한 몸통·바지와 나무 관절을 분리해 장난감 구조를 드러낸다.
        mesh(new THREE.CylinderGeometry(.27,.31,.65,40),red,0,.62,0);
        mesh(new THREE.CylinderGeometry(.32,.31,.09,40),dark,0,.29,0);
        mesh(new THREE.BoxGeometry(.53,.28,.36),blue,0,.13,0);
        rod([0,.95,0],[0,1.11,0],.10);
        ball(0,1.37,0,.33,wood,[.87,1.1,.9]);
        ball(-.30,1.37,0,.083); ball(.30,1.37,0,.083);
        rod([0,1.37,.25],[0,1.36,.66],.065,wood,.034);
        for(const side of [-1,1]) {
          ball(side*.115,1.47,.261,.070,ivory,[.85,1,.45]);
          ball(side*.115,1.475,.291,.034,black,[.85,1,.4]);
          ball(side*.106,1.489,.306,.009,ivory);
          const brow=rod([side*.16,1.57,.254],[side*.075,1.59,.268],.014,dark);
          const s=[side*.30,.86,0], e=[side*.49,.40,.015], w=[side*.67,.10,.11];
          ball(...s,.105,dark); rod(s,e,.090,red,.105); ball(...e,.103,dark); rod(e,w,.075,wood,.086);
          ball(...w,.085,dark); ball(side*.70,-.015,.13,.11,wood,[.7,1.4,.8]);
          ball(side*.62,-.005,.18,.05);
          const h=[side*.17,.02,0], k=[side*.25,-.54,.02], a=[side*.30,-1.04,.10];
          ball(...h,.12,dark); rod(h,k,.11,blue,.13); ball(...k,.115,dark); rod(k,a,.078,wood,.10);
          ball(...a,.09,dark); ball(side*.30,-1.13,.23,.16,dark,[.83,.56,1.6]);
        }
        const smile = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.105,1.26,.267),new THREE.Vector3(0,1.20,.304),new THREE.Vector3(.105,1.26,.267));
        mesh(new THREE.TubeGeometry(smile,24,.012,10,false),dark,0,0,0);
        // 빵 속살로 만든 뾰족하고 가는 작은 모자 — 챙·띠·깃털 없이 (원작 삽화의 차림)
        const cap=mesh(new THREE.ConeGeometry(.25,.66,40),crumb,.02,1.97,0); cap.rotation.z=-.2;
        ball(.10,2.27,0,.035,crumb);
        for (const y of [.43,.62,.81]) ball(0,y,.292,.03,dark,[1,1,.45]);   // 나무 단추
        g.rotation.y=-.18; g.rotation.z=-.06;
        return g;
      }, 1024);
    });
    if(errors.length) throw new Error(errors.join('\n'));
    if(fs.existsSync(OUTPUT) && !process.env.FORCE) throw new Error('기존 원화를 덮지 않습니다: ' + OUTPUT);
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, Buffer.from(png.split(',')[1], 'base64'));
    const specFile=path.join(ROOT,'docs/art/additions-20261030-prompts.json');
    if (fs.existsSync(specFile)) {
      const spec=JSON.parse(fs.readFileSync(specFile,'utf8')), row=spec.assets.find(r=>r.id==='pinocchio_doll');
      if (row && row.target !== 'tools/addition_art/sources/pinocchio_doll-v3.png') {
        row.previous_versions=(row.previous_versions||[]).concat([{target:row.target,generator_script:row.generator_script,note:'v2: 깃털 모자·흰 옷깃 — 디즈니판 특징이라 v3에서 뺌'}]);
        row.target='tools/addition_art/sources/pinocchio_doll-v3.png';
        row.generator_script='tools/procedural_art/run_puppet3.js'; row.generated_source=row.generator_script;
        row.generation_note='콜로디 원작(1883)의 차림: 빵 속살 모자·꽃무늬 종이옷·나무 단추. 깃털·모자 띠·흰 옷깃(디즈니판 특징)은 넣지 않는다 (2026-11-04 저작권 QA).';
        fs.writeFileSync(specFile,JSON.stringify(spec,null,2)+'\n');
      }
    }
    console.log('PASS: 목각 인형 1024px 투명 원화, 브라우저 오류 0');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
