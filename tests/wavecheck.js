// 셰이더의 파도 식(renderer.js 원문에서 잘라냄)과 G.Waves(JS)가 같은 높이를 내는지 GPU로 비교
// 실행: node tests/wavecheck.js  (playwright 필요 — npm i playwright, 또는 PLAYWRIGHT_PATH로 위치 지정)
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const ROOT = path.join(__dirname, '..');
const fs = require('fs');
const src = fs.readFileSync(path.join(ROOT, 'js/world/renderer.js'), 'utf8');
const head = src.slice(src.indexOf('var HEAD = `') + 12, src.indexOf('`', src.indexOf('var HEAD = `') + 12));
function cut(fnName, startMark) {
  const f = src.indexOf(fnName); const a = src.indexOf(startMark, f);
  const c = src.indexOf('if (i >= 2', a); const e = src.indexOf('\n  }', c);
  return src.slice(a, e + 4);
}
const seaBody = cut('vec3 waterCol(', 'float wstr');
const w2 = src.indexOf('vec3 battleSea('); const bw = src.slice(src.indexOf('float wstr', w2), src.indexOf('\n', src.indexOf('float wstr', w2)));
const batLoop = cut('vec3 battleSea(', 'vec2 grad = vec2(0.0); float hs');
const fs1 = head + `
float hsSea(vec2 ll, vec2 p, float d, vec2 gS, float pxD){ float t = uTime; float battle = 0.0;
${seaBody}
  return hs; }
float hsBat(vec2 q, float pxU){ float t = uTime;
${bw}
${batLoop}
  return hs; }
void main(){ vec2 frag = gl_FragCoord.xy; vec2 ll = uCenter + (frag - uRes*0.5)/uZoom; vec2 p = ll + vec2(180.0,90.0);
  float a = hsSea(ll, p, 100.0, vec2(1.0,0.0), uZoom);
  vec2 q = (frag - uRes*0.5)/uZoom * 30.0; float b = hsBat(q, 100.0);
  outColor = vec4(a, b, 0.0, 1.0); }`;
(async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader'] });
  const pg = await br.newPage();
  pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.setContent('<html><body></body></html>');
  await pg.addScriptTag({ content: 'window.G={FX:{water:{wave:1}}};' });
  await pg.addScriptTag({ path: path.join(ROOT, 'js/world/waves.js') });
  const r = await pg.evaluate(({ fsrc }) => {
    const W = 48, H = 24, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const gl = cv.getContext('webgl2'); gl.getExtension('EXT_color_buffer_float');
    function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}')); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fsrc)); gl.bindAttribLocation(pr, 0, 'a'); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, W, H, 0, gl.RGBA, gl.FLOAT, null);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, W, H); gl.useProgram(pr);
    const u = n => gl.getUniformLocation(pr, n);
    const out = [];
    [[-25.3, 37.1, 110, 1234.5, [0.5, 0.2]], [120.2, 12.4, 300, 51.25, [-0.3, 0.7]], [-40, -20, 60, 98765.4, [0.9, -0.1]]].forEach(([lon, lat, zoom, t, wind]) => {
      gl.uniform2f(u('uRes'), W, H); gl.uniform2f(u('uCenter'), lon, lat); gl.uniform1f(u('uZoom'), zoom); gl.uniform1f(u('uTime'), t); gl.uniform2f(u('uWind'), wind[0], wind[1]);
      gl.uniform4f(u('uW0'), 1, 1, 1, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const px = new Float32Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.FLOAT, px);
      let eA = 0, mA = 0, eB = 0, mB = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const fx = x + 0.5, fy = y + 0.5, ll = [lon + (fx - W / 2) / zoom, lat + (fy - H / 2) / zoom];
        const a = G.Waves.sea(ll[0], ll[1], t, wind, zoom, null).h, g = px[(y * W + x) * 4];
        const q = [(fx - W / 2) / zoom * 30, (fy - H / 2) / zoom * 30], b = G.Waves.battle(q[0], q[1], t, wind, 100).h, gb = px[(y * W + x) * 4 + 1];
        eA = Math.max(eA, Math.abs(a - g)); mA = Math.max(mA, Math.abs(g)); eB = Math.max(eB, Math.abs(b - gb)); mB = Math.max(mB, Math.abs(gb));
      }
      out.push({ lon, t, seaErr: eA, seaMax: mA, batErr: eB, batMax: mB });
    });
    return out;
  }, { fsrc: fs1 });
  console.log(JSON.stringify(r, null, 1));
  // 허용 오차: 가장 큰 높이의 6% (GPU는 32비트 부동소수라 큰 위상에서 조금 어긋난다)
  const bad = r.filter(x => x.seaErr > x.seaMax * 0.06 || x.batErr > x.batMax * 0.06);
  console.log(bad.length ? 'FAIL' : 'OK');
  if (bad.length) process.exitCode = 1;
  await br.close();
})();
