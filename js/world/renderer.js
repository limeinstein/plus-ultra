/* WebGL2 world renderer: procedural ocean & terrain drawn from the signed-distance field and climate data.
   반실사풍 입체 전략 지도 — 지형은 색만이 아니라 높낮이·표면·식생 밀도·실루엣·그림자로 나눈다.
     · 높이: 저지대 구릉(지역마다 평탄/기복) + 산맥(기후 자료의 고도를 따라 이어지는 능선 — 등고선을 따르는 평행 능선 +
             능선형 잡음 + 가지 능선), 강을 따라 파인 골짜기, 해안 절벽
     · 생태: 기온·습도·고도·해안 거리로 사막(사구·자갈·암반) / 스텝 / 들판(평탄·건조 풀·흙) / 초원(구릉·푸른 풀·드문 나무) /
             숲(활엽·침엽·열대, 덩어리와 공터, 가장자리는 점점 성기게) / 툰드라(이끼·낮은 관목·남은 눈) / 암반 / 눈·빙상
     · 강: 강 거리장(geo 텍스처 B)을 따라 굽이치며 하류로 갈수록 넓어지고, 강변 식생·하구 모래톱
     · 바다: 연해(모래 바닥·암초가 비침) → 대륙붕 → 심해로 깊어지는 색, 너울·풍랑·잔물결이 서로 다른 크기와 빠르기,
             해안으로 밀려와 부서지는 포말(늘 켜진 외곽선이 아님), 찬 바다의 빙산·유빙·부빙
   육지·바다 경계(sdf + coastNoise)는 js/world/geo.js 의 판정과 같은 식이다. 빙산도 Geo.berg 와 같은 식. 조정값은 G.FX. */
(function (G) {
  'use strict';

  var VS = '#version 300 es\n' +
    'in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }';

  var HEAD = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uGeo;
uniform sampler2D uClim;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uZoom;
uniform float uTime;
uniform vec2 uWind;
uniform float uCloud;
uniform float uEdge;
uniform float uMode;
uniform float uDusk;
uniform float uStorm;
uniform float uQuality;
uniform vec4 uT0;   // relief, mountain, forest, treeSize
uniform vec4 uT1;   // snowline, river, beach, detail
uniform vec4 uW0;   // shelf, wave, whitecap, glint
uniform vec4 uW1;   // shallow rgb, foam
uniform vec4 uW2;   // deep rgb, cloud
uniform vec4 uW3;   // lagoon rgb, berg
out vec4 outColor;
const float TPD = 4096.0/360.0;
const vec3 SUN = vec3(-0.55, 0.50, 0.67);
const vec2 SUNXY = vec2(-0.7399, 0.6727);

uint hashu(ivec2 p){ uint h = (uint(p.x) * 0x27d4eb2du) ^ (uint(p.y) * 0x165667b1u);
  h ^= h >> 15u; h *= 0x85ebca6bu; h ^= h >> 13u; h *= 0xc2b2ae35u; h ^= h >> 16u; return h; }
float hash(ivec2 p){ return float(hashu(p)) * (1.0/4294967296.0); }
float vnoise(vec2 p){ vec2 i = floor(p); vec2 f = p - i; vec2 u = f*f*(3.0-2.0*f); ivec2 q = ivec2(i);
  float a = hash(q), b = hash(q+ivec2(1,0)), c = hash(q+ivec2(0,1)), d = hash(q+ivec2(1,1));
  return a + (b-a)*u.x + (c-a)*u.y + (a-b-c+d)*u.x*u.y; }
vec3 vnoised(vec2 p){ vec2 i = floor(p); vec2 f = p - i; vec2 u = f*f*(3.0-2.0*f); vec2 du = 6.0*f*(1.0-f); ivec2 q = ivec2(i);
  float a = hash(q), b = hash(q+ivec2(1,0)), c = hash(q+ivec2(0,1)), d = hash(q+ivec2(1,1));
  return vec3(a + (b-a)*u.x + (c-a)*u.y + (a-b-c+d)*u.x*u.y, du*(vec2(b-a, c-a) + (a-b-c+d)*u.yx)); }
const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);
// 기울기 잡음(5차 보간): 값 잡음의 네모난 결이 드러나지 않는다 — 문턱값으로 가르는 무늬(숲 덩어리·사구 바다·눈 조각)에 쓴다
float gnoise(vec2 p){ vec2 i = floor(p); vec2 f = p - i; vec2 u = f*f*f*(f*(f*6.0 - 15.0) + 10.0); ivec2 q = ivec2(i);
  vec2 ga = vec2(hash(q), hash(q+ivec2(57,113)))*2.0 - 1.0, gb = vec2(hash(q+ivec2(1,0)), hash(q+ivec2(58,113)))*2.0 - 1.0;
  vec2 gc = vec2(hash(q+ivec2(0,1)), hash(q+ivec2(57,114)))*2.0 - 1.0, gd = vec2(hash(q+ivec2(1,1)), hash(q+ivec2(58,114)))*2.0 - 1.0;
  float a = dot(ga, f), b = dot(gb, f - vec2(1.0,0.0)), c = dot(gc, f - vec2(0.0,1.0)), d = dot(gd, f - vec2(1.0,1.0));
  return 0.5 + 0.75*mix(mix(a, b, u.x), mix(c, d, u.x), u.y); }
float fbm(vec2 p, int oct){ float s = 0.0, a = 0.5, n = 0.0; for(int i=0;i<6;i++){ if(i>=oct) break; s += a*vnoise(p); n += a; p = ROT*p*2.03 + vec2(13.1,7.7); a *= 0.5; } return s/n; }
float gfbm(vec2 p, int oct){ float s = 0.0, a = 0.5, n = 0.0; for(int i=0;i<6;i++){ if(i>=oct) break; s += a*gnoise(p); n += a; p = ROT*p*2.03 + vec2(13.1,7.7); a *= 0.5; } return s/n; }
vec3 fbmd(vec2 p, int oct){ vec3 s = vec3(0.0); float a = 0.5, n = 0.0; mat2 m = mat2(1.0); for(int i=0;i<6;i++){ if(i>=oct) break; vec3 v = vnoised(m*p + vec2(float(i)*13.1, float(i)*7.7)); s += a*vec3(v.x, v.yz*m); n += a; m = ROT*m*2.03; a *= 0.5; } return s/n; }
// 보로노이: (가장 가까운 점까지, 두 번째까지, 가장 가까운 칸의 무작위 값)
vec3 voro(vec2 x){ vec2 n = floor(x); vec2 f = x - n; float f1 = 8.0, f2 = 8.0, id = 0.0;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ ivec2 c = ivec2(n) + ivec2(i,j);
    vec2 r = vec2(float(i), float(j)) + vec2(hash(c), hash(c+ivec2(37,17))) - f; float d = dot(r,r);
    if (d < f1) { f2 = f1; f1 = d; id = hash(c+ivec2(11,91)); } else if (d < f2) f2 = d; }
  return vec3(sqrt(f1), sqrt(f2), id); }
float dsmooth(float a, float b, float x){ float t = clamp((x-a)/(b-a), 0.0, 1.0); return 6.0*t*(1.0-t)/(b-a); }
float band(float x, float a, float b, float c, float d){ return smoothstep(a, b, x) * (1.0 - smoothstep(c, d, x)); }

float coastNoise(vec2 ll){ vec2 p = ll + vec2(180.0, 90.0);
  return (vnoise(p*3.0)-0.5)*1.1 + (vnoise(p*9.0+17.3)-0.5)*0.56 + (vnoise(p*27.0+41.7)-0.5)*0.26; }
vec2 uvOf(vec2 ll){ return vec2((ll.x + 180.0)/360.0, (90.0 - ll.y)/180.0); }
float sdfTex(vec4 g){ float sf = (g.r*255.0-128.0)/16.0; float sc = (g.g*255.0-128.0)/2.0; float w = smoothstep(6.0, 7.5, abs(sf)); return mix(sf, sc, w); }
float rivTex(vec4 g){ return (1.0 - g.b) * 8.0; }
// 해안의 성격 (모래사장·바위 해안·절벽): 육지와 바다가 같은 값을 쓴다
float coastType(vec2 p){ return fbm(p*1.25 + vec2(40.0, 13.0), 3); }

`;
  var LAND = `// ================================================================= 나무
// 숲 한 겹: 칸마다 나무 한 그루(밀도만큼 확률), 3x3 칸에서 가장 높은 수관을 고른다. 그림자는 해 반대쪽으로.
vec4 treeLayer(vec2 p, float dens, float cs, float conif, float trop, float sav, out float gsh){
  vec2 tp = p / cs; vec2 ti = floor(tp);
  float best = -1.0; vec3 col = vec3(0.0); gsh = 0.0; float ov = 0.0;
  for (int j=-1;j<=1;j++) for (int i=-1;i<=1;i++){
    ivec2 c = ivec2(ti) + ivec2(i,j);
    float k = hash(c+ivec2(3,29));
    if (k > dens) continue;
    float a = hash(c), b = hash(c+ivec2(17,3)), e = hash(c+ivec2(9,9));
    vec2 d = tp - (vec2(c) + 0.12 + 0.76*vec2(a,b));
    float isC = step(e, conif);
    float isS = step(fract(e*5.7), sav);
    float r = (0.34 + 0.24*fract(e*7.31)) * (0.78 + 0.5*clamp(dens,0.0,1.0)) * (isC > 0.5 ? 0.78 : 1.0) * (isS > 0.5 ? 1.25 : 1.0);
    float ht = r * (isC > 0.5 ? 1.5 : (isS > 0.5 ? 0.6 : 1.0));
    float sdist = length(d + SUNXY*ht*0.85);
    gsh = max(gsh, smoothstep(r, r*0.45, sdist));
    float dd = length(d);
    if (dd > r*1.25) continue;
    vec2 u1 = d/max(dd, 1e-4);
    vec2 u2 = vec2(u1.x*u1.x - u1.y*u1.y, 2.0*u1.x*u1.y); vec2 u4 = vec2(u2.x*u2.x - u2.y*u2.y, 2.0*u2.x*u2.y);
    vec2 u5 = vec2(u4.x*u1.x - u4.y*u1.y, u4.x*u1.y + u4.y*u1.x); vec2 u3 = vec2(u2.x*u1.x - u2.y*u1.y, u2.x*u1.y + u2.y*u1.x);
    float lob5 = dot(u5, vec2(cos(e*31.0), sin(e*31.0)));
    float lob3 = dot(u3, vec2(cos(e*20.0), sin(e*20.0)));
    float rr = isC > 0.5 ? r*(0.84 + 0.16*abs(lob3)) : r*(1.0 + 0.08*lob5);
    if (dd < rr) {
      float q = dd/rr;
      float top = ht * (isC > 0.5 ? (1.0 - q) : sqrt(max(0.0, 1.0 - q*q)));
      if (top > best) {
        ov = best > 0.0 ? 1.0 : ov;
        best = top;
        vec2 dn = d/max(dd, 1e-4);
        vec3 nn = isC > 0.5 ? normalize(vec3(dn*0.85, 0.52)) : normalize(vec3(d/rr*0.95, sqrt(max(0.05, 1.0 - q*q))));
        if (isC < 0.5) { vec2 bq = floor(tp*7.0); vec2 bmp = vec2(hash(ivec2(bq) + c), hash(ivec2(bq) + c + ivec2(5,3))) - 0.5; nn = normalize(nn + vec3(bmp*0.35, 0.0)); }
        float l = clamp(dot(nn, SUN), 0.0, 1.0);
        vec3 base = isC > 0.5 ? mix(vec3(0.075,0.145,0.10), vec3(0.13,0.215,0.135), a)
                              : mix(vec3(0.16,0.26,0.09), vec3(0.27,0.35,0.13), a);
        base = mix(base, mix(vec3(0.09,0.23,0.07), vec3(0.20,0.36,0.10), b), trop*(1.0 - isC));
        if (isS > 0.5) base = mix(vec3(0.30,0.33,0.15), vec3(0.40,0.40,0.20), b);
        base *= 0.86 + 0.28*fract(k*13.7);
        col = base * (0.42 + 0.92*l);
        col = mix(col*vec3(0.80,0.88,1.0), col, l);
      }
    }
  }
  if (best > 0.0) col *= 1.0 - 0.28*gsh*ov;
  return vec4(col, best > 0.0 ? 1.0 : 0.0);
}

// ================================================================= 육지
vec3 landCol(vec2 ll, vec2 p, float s, float rivD, float rivC, vec2 gS, vec2 gR, float pxT, float pxD){
  vec2 uv = uvOf(ll);
  vec4 cl = texture(uClim, uv);
  vec2 cu = vec2(1.0/1024.0, 0.0), cv = vec2(0.0, 1.0/512.0);
  float E = cl.b;
  vec2 gE = vec2(texture(uClim, uv+cu).b - texture(uClim, uv-cu).b, texture(uClim, uv-cv).b - texture(uClim, uv+cv).b) / 0.7031;
  float lod = clamp((pxD - 40.0)/80.0, 0.0, 1.0) * uT1.w;
  float lat = ll.y;

  // ---------------- 높이 (h: 음영용 전체, hm: 산의 몫 — 설선·수목한계선에 쓴다)
  float hil = smoothstep(0.30, 0.72, gfbm(p*0.45 + vec2(9.1,3.7), 3));
  float flat_ = 1.0 - hil;
  vec3 hA = fbmd(p*1.6 + vec2(3.3,1.1), 4);
  float ha = 0.05 + 0.20*hil;
  float h = (hA.x - 0.5)*ha; vec2 g = hA.yz*1.6*ha;
  vec3 hB = fbmd(p*5.2 + vec2(8.1,2.9), 3);
  float hb = 0.012 + 0.035*hil;
  h += (hB.x - 0.5)*hb; g += hB.yz*5.2*hb;
  // 산맥: 고도 자료를 흐린 값(Eb)이 산맥 한가운데서 가장 높다 → 주능선이 산맥을 따라 이어지고,
  //       Eb의 등고선을 따르는 평행 능선 + 침식된 능선형 잡음(가지 능선과 골짜기) + 넓게 퍼진 산기슭(Ew)
  float hm = 0.0; vec2 gm = vec2(0.0); float ridge = 0.0;
  float Ew = textureLod(uClim, uv, 3.5).b;
  if (E > 0.004 || Ew > 0.01) {
    float Eb = textureLod(uClim, uv, 2.0).b;
    vec2 o2 = vec2(2.0/1024.0, 0.0), o2y = vec2(0.0, 2.0/512.0);
    vec2 gEb = vec2(textureLod(uClim, uv+o2, 2.0).b - textureLod(uClim, uv-o2, 2.0).b, textureLod(uClim, uv-o2y, 2.0).b - textureLod(uClim, uv+o2y, 2.0).b) / 1.4063;
    vec2 wq = vec2(fbm(p*0.8 + vec2(5.2,1.3), 2), fbm(p*0.8 + vec2(1.7,8.4), 2)) - 0.5;
    vec3 r = fbmd(p*2.1 + wq*1.3, 5);
    float rn = 2.0*r.x - 1.0; float r1 = 1.0 - abs(rn); ridge = r1*r1;
    vec2 dR = 2.0*r1*(-sign(rn))*2.0*r.yz*2.1;
    float K = 16.0; float cph = Eb*K + wq.x*3.0; float sc = sin(cph); float ca = 1.0 - abs(sc); float cr = ca*ca;
    vec2 dcr = 2.0*ca*(-sign(sc))*cos(cph)*K*gEb;
    float core = E*Eb;
    float B = 0.28 + 0.42*ridge + 0.30*cr;
    float F = (0.35 + 0.65*ridge)*0.30;
    hm = uT0.y*(core*B*1.7 + Ew*F);
    gm = uT0.y*((gE*Eb + E*gEb)*B*1.7 + core*(0.42*dR + 0.30*dcr)*1.7 + Ew*0.65*0.30*dR);
    h += hm; g += gm;
  }
  // 잔무늬
  vec3 hC = fbmd(p*16.0 + vec2(1.9,7.3), 3);
  float hc = 0.010 + 0.03*E + 0.008*hil;
  h += (hC.x - 0.5)*hc; g += hC.yz*16.0*hc;
  if (lod > 0.0) { vec3 hD = fbmd(p*55.0 + vec2(4.4,2.2), 2); float hd = 0.0035*lod*(1.0 + 2.0*E); h += (hD.x-0.5)*hd; g += hD.yz*55.0*hd; }
  // 강을 따라 파인 골짜기
  float vW = 1.8 + 3.5*E;
  float ev = exp(-rivD / vW);
  float vf = 1.0 - 0.6*ev;
  vec2 dvf = 0.6*ev/vW*gR*TPD;
  g = g*vf + h*dvf; h *= vf; hm *= vf;
  // 해안: 저지대는 낮게, 절벽 해안은 물가에서 가파르게 솟는다
  float ct = coastType(p);
  float cliffK = smoothstep(0.60, 0.74, ct + E*0.6 + hil*0.12) * step(0.12, cl.r);
  h += 0.03*smoothstep(0.0, 4.0, s) + cliffK*0.16*smoothstep(0.0, 0.8, s);
  g += gS*TPD*(0.03*dsmooth(0.0, 4.0, s) + cliffK*0.16*dsmooth(0.0, 0.8, s));

  // ---------------- 기후
  float T = cl.r + (fbm(p*1.1 + 31.0, 3) - 0.5)*0.08 - hm*0.30 - 0.35*cl.a - 0.18*smoothstep(55.0, 72.0, abs(lat));
  float M = cl.g + (fbm(p*1.7 + 71.0, 3) - 0.5)*0.28 + (fbm(p*6.5 + 3.0, 3) - 0.5)*0.14;
  M += 0.22*exp(-s/15.0)*smoothstep(0.62, 0.80, cl.r)*smoothstep(0.18, 0.32, cl.g);
  float wetR = exp(-rivD/1.1);
  M += 0.22*wetR*(1.0 - smoothstep(0.7, 0.9, M));
  float I = cl.a;
  float cold = smoothstep(0.30, 0.16, T);
  float wDes = smoothstep(0.27, 0.12, M) * (1.0 - cold);

  // 사구: 바람에 직각인 굽이진 능선, 바람받이는 완만하고 바람그늘은 가파르다 (높이에 넣어 빛을 받게)
  float erg = 0.0;
  if (wDes > 0.01) {
    erg = smoothstep(0.44, 0.54, gfbm(p*0.17 + vec2(2.0, 9.0), 3) + (gfbm(p*0.9, 2) - 0.5)*0.12);
    vec2 wd = normalize(vec2(-0.85, lat > 0.0 ? -0.4 : 0.4)); vec2 wpd = vec2(-wd.y, wd.x);
    float DF = pxD < 90.0 ? 4.5 : 9.0;                 // 멀면 굵은 사구, 가까우면 잔 사구
    float x = dot(p, wd)*DF + (fbm(p*1.1 + 5.0, 2) - 0.5)*5.0 + sin(dot(p, wpd)*4.0)*0.35;
    float fx = fract(x);
    float mo = 0.55 + 0.45*sin(dot(p, wpd)*DF*0.8 + fbm(p*2.0, 2)*5.0);
    float prof = fx < 0.7 ? fx/0.7 : (1.0 - fx)/0.3;
    vec2 gd = wd*DF*(fx < 0.7 ? 1.0/0.7 : -1.0/0.3)*mo;
    float amp = 0.045*(9.0/DF)*0.8*erg*wDes*smoothstep(25.0, 45.0, pxD);
    h += prof*mo*amp; g += gd*amp;
  }
  if (wDes > 0.01) { float hamH = smoothstep(0.60, 0.72, gfbm(p*0.6 + vec2(6.0, 1.0), 2)) * (1.0 - erg) * wDes; vec3 hh = fbmd(p*7.0 + 3.0, 3); h += (hh.x - 0.5)*0.05*hamH; g += hh.yz*7.0*0.05*hamH; }
  // 빙상 (그린란드·남극): 넓은 물결 모양 기복, 해안 가까이는 얼음이 없는 바위띠
  float iceSheet = smoothstep(0.74, 0.92, I + (hB.x - 0.5)*0.2) * smoothstep(0.8, 3.2, s + (hC.x - 0.5)*2.5);
  if (iceSheet > 0.01) { vec3 iu = fbmd(p*0.55 + 20.0, 3); g += iu.yz*0.55*4.0*iceSheet; h += (iu.x - 0.5)*0.3*iceSheet; }

  // ---------------- 빛
  vec3 n = normalize(vec3(-g*0.17*uT0.x, 1.0));
  float slope = length(g)*0.17;
  float dif = clamp(dot(n, SUN), 0.0, 1.0);
  // 큰 산맥이 드리우는 그림자 (해 쪽으로 몇 걸음 가며 높이를 어림한다)
  float msh = 0.0;
  if (Ew > 0.03) {
    for (int i=1;i<=5;i++){
      float t = float(i)*0.085;
      vec2 q = ll + SUNXY*t; vec2 uq = uvOf(q);
      float Eq = texture(uClim, uq).b * textureLod(uClim, uq, 2.0).b;
      float rq = 1.0 - abs(2.0*fbm((q + vec2(180.0,90.0))*2.1, 2) - 1.0);
      float hq = uT0.y*Eq*(0.28 + 0.42*rq*rq + 0.15)*1.7;
      msh = max(msh, clamp((hq - hm - t*1.1)*5.0, 0.0, 1.0));
    }
  }

  // ---------------- 바탕 색 (생태별 무게)
  vec3 steppe = vec3(0.63,0.58,0.37), dryG = vec3(0.67,0.60,0.38), field = vec3(0.56,0.56,0.30), soil = vec3(0.50,0.41,0.29);
  vec3 grass = vec3(0.34,0.46,0.20), grass2 = vec3(0.42,0.52,0.24), meadow = vec3(0.30,0.42,0.19);
  vec3 tundra = vec3(0.42,0.45,0.34), tBrown = vec3(0.44,0.37,0.27), moss = vec3(0.33,0.43,0.26);
  vec3 floorC = vec3(0.17,0.21,0.11), rockC = vec3(0.47,0.44,0.41), snowC = vec3(0.95,0.96,0.99);

  float wSte = band(M, 0.12, 0.26, 0.36, 0.46) * (1.0 - cold*0.6);
  float wFld = band(M, 0.30, 0.42, 0.54, 0.64) * (0.35 + 0.65*flat_) * (1.0 - cold);
  float wGrs = smoothstep(0.40, 0.56, M) * (0.35 + 0.65*hil) * (1.0 - cold);
  float wTun = cold;
  float wsum = wDes + wSte + wFld + wGrs + wTun + 1e-3;

  // 사막: 모래 바다(사구) · 자갈 사막 · 검은 암반 대지
  vec3 dcol = vec3(0.80,0.66,0.46);
  if (wDes > 0.01) {
    float ham = smoothstep(0.60, 0.72, gfbm(p*0.6 + vec2(6.0, 1.0), 2)) * (1.0 - erg);
    vec3 sandC = mix(vec3(0.80,0.58,0.36), vec3(0.88,0.70,0.46), fbm(p*1.6 + 2.0, 3));
    vec2 wdr = normalize(vec2(-0.85, lat > 0.0 ? -0.4 : 0.4));
    float streak = fbm(vec2(dot(p, wdr)*1.5, dot(p, vec2(-wdr.y, wdr.x))*9.0), 3);   // 바람결 줄무늬
    vec3 regC = mix(vec3(0.78,0.67,0.51), vec3(0.70,0.60,0.46), streak) * (0.95 + 0.10*vnoise(p*90.0));
    vec3 hamC = mix(vec3(0.50,0.38,0.28), vec3(0.60,0.47,0.34), fbm(p*6.0, 3)) * (0.9 + 0.12*vnoise(p*40.0));
    dcol = mix(regC, sandC, erg);
    dcol = mix(dcol, hamC, ham*0.8);
  }
  // 스텝·들판: 건조한 풀, 드러난 흙, 황록색
  float pat = fbm(p*4.5 + vec2(3.0, 7.0), 3);
  vec3 scol = mix(steppe, dryG, pat) * (0.92 + 0.16*fbm(p*14.0, 2));
  vec3 fcol = mix(field, dryG, smoothstep(0.45, 0.7, pat));
  fcol = mix(fcol, soil, smoothstep(0.60, 0.78, fbm(p*7.0 + 5.0, 2))*0.6);
  fcol *= 0.93 + 0.14*vnoise(p*40.0);
  // 초원: 부드러운 녹색, 작은 색 변화
  vec3 gcol = mix(meadow, grass2, fbm(p*3.2 + 11.0, 3));
  gcol = mix(gcol, grass, fbm(p*11.0, 2)*0.6) * (0.94 + 0.12*vnoise(p*30.0));
  // 툰드라: 회녹색·갈색 낮은 식생과 이끼, 남은 눈, 작은 늪
  vec3 tcol = mix(tundra, tBrown, fbm(p*3.5 + 21.0, 3));
  tcol = mix(tcol, moss, smoothstep(0.52, 0.68, fbm(p*8.0 + 2.0, 3))*0.6);
  tcol *= 0.92 + 0.16*vnoise(p*70.0);
  if (wTun > 0.05) {
    tcol = mix(tcol, vec3(0.55,0.53,0.40), smoothstep(0.5, 0.7, gfbm(p*2.2 + 13.0, 3))*0.5);    // 누런 지의류 벌판
    tcol = mix(tcol, vec3(0.34,0.40,0.28), smoothstep(0.55, 0.75, gfbm(p*4.0 + 31.0, 3))*0.55);   // 짙은 이끼·관목
    float spt = smoothstep(0.62, 0.78, gfbm(p*5.0 + 7.0, 3) + (0.16 - cl.r)*1.0);
    tcol = mix(tcol, vec3(0.88,0.90,0.93), spt*0.8);
    vec3 pv = voro(p*vec2(9.0, 14.0) + 3.0);
    float pond = step(pv.z, 0.22*(0.3 + flat_)) * smoothstep(0.34, 0.20, pv.x + (vnoise(p*30.0) - 0.5)*0.18);
    tcol = mix(tcol, vec3(0.19,0.27,0.32), pond*0.9);
  }

  vec3 col = (dcol*wDes + scol*wSte + fcol*wFld + gcol*wGrs + tcol*wTun) / wsum;

  // ---------------- 암반·돌산 (경사가 급하거나, 수목한계선 위이거나, 메마른 구릉)
  float snowl = 0.62 + 0.55*clamp(cl.r, 0.0, 1.0) + uT1.x;
  float treel = snowl - 0.22;
  float aridRock = smoothstep(0.30, 0.12, M) * smoothstep(0.58, 0.76, fbm(p*2.4 + 4.0, 3)) * (0.2 + hil) * (1.0 - erg);
  float wRock = max(max(smoothstep(0.95, 1.7, slope), smoothstep(treel, treel + 0.16, hm + 0.10*(ridge - 0.5))), aridRock*0.7);
  // 수목한계선 바로 아래는 고산 초지 (밝은 풀빛)
  col = mix(col, vec3(0.44,0.50,0.28)*(0.9 + 0.2*fbm(p*9.0, 2)), smoothstep(treel - 0.14, treel - 0.02, hm)*(1.0 - smoothstep(treel, treel + 0.1, hm))*0.6*(1.0 - wDes));
  wRock = max(wRock, smoothstep(0.10, 0.35, hm)*0.5*smoothstep(0.35, 0.15, M));
  if (wRock > 0.01) {
    vec3 rv = voro(p*13.0);
    float crack = smoothstep(0.0, 0.07, rv.y - rv.x);
    vec3 rc = mix(rockC, vec3(0.53,0.45,0.37), smoothstep(0.35, 0.15, M));
    rc *= (0.84 + 0.26*rv.z) * (0.74 + 0.26*crack);
    rc *= 0.95 + 0.05*sin(h*85.0 + fbm(p*6.0, 2)*4.0);
    if (lod > 0.0) { vec3 rv2 = voro(p*48.0); rc *= 1.0 - 0.16*lod*smoothstep(0.07, 0.0, rv2.y - rv2.x); rc *= 1.0 + 0.1*lod*(rv2.z - 0.5); }
    col = mix(col, rc, clamp(wRock, 0.0, 1.0));
  }

  // ---------------- 눈·빙상
  float sn = smoothstep(snowl, snowl + 0.10, hm + 0.22*(ridge - 0.5) + (hC.x - 0.5)*0.08 - slope*0.03);
  sn = max(sn, iceSheet);
  if (sn > 0.01) {
    vec3 sc2 = snowC * (0.97 + 0.05*fbm(p*9.0, 2));
    if (iceSheet > 0.3) { vec3 iv = voro(p*5.0 + 3.0); sc2 *= 1.0 - 0.07*smoothstep(0.05, 0.0, iv.y - iv.x)*smoothstep(4.5, 1.5, s); }
    col = mix(col, sc2, sn);
  }

  // ---------------- 해안 (모래사장·바위 해안·절벽·맹그로브)
  float cw = max(0.20, 1.6/pxT) * uT1.z;
  float rockyK = smoothstep(0.44, 0.58, ct) * (1.0 - cliffK);
  rockyK = max(rockyK, cold*0.6*(1.0 - cliffK));
  float beachK = (1.0 - cliffK) * (1.0 - rockyK) * (1.0 - sn) * step(0.14, cl.r);
  float mangK = beachK * smoothstep(0.70, 0.80, cl.r) * smoothstep(0.58, 0.72, M) * smoothstep(0.45, 0.6, fbm(p*2.0 + 9.0, 2));
  float bw = cw * (0.7 + 0.9*fbm(p*4.0 + 1.0, 2));
  float beach = smoothstep(bw, bw*0.55, s) * beachK * (1.0 - mangK);
  if (beach > 0.001) {
    vec3 bs = mix(vec3(0.86,0.78,0.60), vec3(0.80,0.72,0.55), vnoise(p*30.0));
    bs = mix(bs, bs*vec3(0.80,0.80,0.82), smoothstep(bw*0.35, 0.0, s));
    col = mix(col, bs, beach*0.9);
  }
  float rockyShore = smoothstep(cw*1.3, cw*0.5, s) * rockyK;
  if (rockyShore > 0.001) { vec3 bv = voro(p*40.0); vec3 rs = vec3(0.46,0.44,0.42)*(0.75 + 0.4*bv.z)*(0.7 + 0.3*smoothstep(0.0,0.12,bv.y-bv.x)); col = mix(col, rs, rockyShore*0.85); }
  float cliffFace = smoothstep(cw*0.9, cw*0.25, s) * cliffK;
  if (cliffFace > 0.001) { vec3 cv2 = voro(p*30.0); vec3 cf = vec3(0.40,0.37,0.34)*(0.75 + 0.35*cv2.z); col = mix(col, cf, cliffFace*0.9); }
  float mangrove = smoothstep(cw*2.6, cw*0.4, s) * mangK;

  // ---------------- 강 (흐린 강줄기 rivC로 굽이치며 이어지고, 하류로 갈수록 넓어진다) · 강변 · 하구
  float rw = rivC;   // 강 한가운데까지의 거리(텍셀) — MAIN_LAND에서 흐린 강줄기의 기울기로 구한다
  float wR = uT1.y * (0.07 + 0.34*exp(-max(s, 0.0)/45.0) + 0.08*clamp(cl.g, 0.0, 1.0));
  wR = max(wR, 1.1/pxT);
  float riv = smoothstep(wR, wR*0.6, rw) * (1.0 - sn*0.8);
  float bank = smoothstep(wR*2.4, wR, rw) * (1.0 - riv);
  float delta = smoothstep(5.0, 1.0, s) * smoothstep(3.5, 0.8, rivD);

  // ---------------- 숲 밀도 (덩어리·공터·가장자리 점점 성기게)
  float fb = smoothstep(0.50, 0.72, M) * smoothstep(0.18, 0.30, T);
  fb += 0.30*exp(-rivD/0.8)*smoothstep(0.10, 0.35, M) * smoothstep(0.15, 0.3, T);
  fb += 0.40*exp(-rivD/0.45)*smoothstep(0.30, 0.12, M) * smoothstep(0.45, 0.6, T);   // 사막 강가의 야자·관목
  float clump = gfbm(p*1.05 + vec2(11.0, 4.0), 3);
  float dens = fb * smoothstep(0.32, 0.60, clump + (fb - 0.6)*0.35);
  dens *= smoothstep(0.20, 0.46, gfbm(p*5.5 + vec2(2.0, 8.0), 2) + 0.1);
  dens *= 1.0 - smoothstep(treel - 0.08, treel + 0.02, hm);
  dens *= (1.0 - wRock*0.9) * (1.0 - sn) * (1.0 - beach) * (1.0 - rockyShore) * (1.0 - cliffFace) * (1.0 - riv) * (1.0 - wDes*0.9*(1.0 - exp(-rivD/0.5)));
  // 초원·사바나의 드문 나무
  float sparse = wGrs*0.05 + wFld*0.012 + band(M, 0.22, 0.34, 0.5, 0.6)*smoothstep(0.62, 0.74, T)*0.10;
  dens = max(dens, sparse*(1.0 - wRock)*(1.0 - sn)*(1.0 - riv));
  dens = clamp(dens*uT0.z, 0.0, 1.0);
  float conif = clamp(smoothstep(0.44, 0.30, T) + smoothstep(treel - 0.30, treel - 0.10, hm)*0.8, 0.0, 1.0);
  float trop = smoothstep(0.66, 0.78, T) * smoothstep(0.55, 0.7, M);
  float patchF = gfbm(p*1.4 + 17.0, 3);
  float sav = smoothstep(0.62, 0.74, T) * smoothstep(0.55, 0.40, M);
  col = mix(col, floorC*(0.85 + 0.3*fbm(p*20.0,2)), smoothstep(0.40, 0.95, dens)*0.8);

  // 강변 (젖은 흙과 푸른 풀), 메마른 땅을 흐르는 강의 녹지
  col = mix(col, vec3(0.32,0.40,0.20), bank*0.55);
  // 메마른 땅의 강: 넓게 번진 녹색 띠가 아니라, 강가를 따라 끊겼다 이어지는 좁은 경작지·풀밭
  float oas = smoothstep(1.35, 0.25, rivD) * smoothstep(0.35, 0.12, cl.g);
  if (oas > 0.001) {
    float oP = smoothstep(0.34, 0.60, gfbm(p*7.0 + 3.0, 2) + 0.28*smoothstep(0.9, 0.2, rivD));
    vec3 oc = mix(vec3(0.36,0.45,0.20), vec3(0.50,0.50,0.28), vnoise(p*26.0));
    col = mix(col, oc, oas*oP*0.62);
  }

  // ---------------- 빛 입히기
  col *= 0.50 + 0.70*dif;
  col = mix(col, col*vec3(0.82,0.89,1.08), (1.0 - dif)*0.40);
  col *= 1.0 - 0.45*msh;

  // ---------------- 나무 (가까울수록 한 그루씩, 멀면 수관 무늬로)
  float tsz = 0.046*uT0.w;
  float tpx = tsz*pxD;
  if (dens > 0.004) {
    vec3 cn = fbmd(p*26.0, 3); float lc = clamp(dot(normalize(vec3(-cn.yz*0.9, 1.0)), SUN), 0.0, 1.0);
    vec3 canopy = mix(mix(vec3(0.17,0.27,0.10), vec3(0.09,0.17,0.11), conif), vec3(0.12,0.28,0.09), trop) * (0.55 + 0.8*lc) * (0.55 + 0.75*dif) * (1.0 - 0.45*msh);
    canopy *= 0.85 + 0.3*fbm(p*9.0 + 7.0, 2);
    canopy = mix(canopy, canopy*vec3(1.18,1.12,0.85), smoothstep(0.55, 0.75, patchF)*0.6);    // 빛깔이 다른 숲 무리
    vec3 farC = mix(col, canopy, smoothstep(0.1, 0.8, dens));
    if (tpx >= 2.4 && uQuality > 0.3) {
      float gsh = 0.0;
      vec4 tl = treeLayer(p, dens, tsz, conif, trop, sav, gsh);
      float fine = smoothstep(11.0, 16.0, tpx);
      if (fine > 0.0) {
        float gsh2 = 0.0; vec4 t2 = treeLayer(p + vec2(0.37, 0.61), dens, tsz*0.42, conif, trop, sav, gsh2);
        tl = mix(tl, t2, fine); gsh = mix(gsh, gsh2, fine);
      }
      vec3 near = mix(col*(1.0 - 0.55*gsh), tl.rgb*(1.0 - 0.45*msh), tl.a);
      col = mix(near, farC, smoothstep(4.0, 2.4, tpx));
    } else col = farC;
  }
  // 맹그로브 (열대 해안의 짙은 숲 띠)
  if (mangrove > 0.001) { vec3 mv = voro(p*60.0); vec3 mc = vec3(0.12,0.24,0.10)*(0.7 + 0.5*mv.z)*(0.8 + 0.3*dif); col = mix(col, mc, mangrove*0.85); }

  // ---------------- 강물 · 하구 삼각주
  if (riv > 0.001) {
    float mud = smoothstep(0.35, 0.15, cl.g) * 0.28 + trop*0.35;
    vec3 rc2 = mix(vec3(0.20,0.38,0.46), vec3(0.34,0.38,0.32), mud);
    rc2 *= 0.80 + 0.20*smoothstep(0.15, 0.7, riv);   // 물가 쪽은 얕고 어둡게
    rc2 *= 0.92 + 0.14*vnoise(p*50.0 + vec2(uTime*0.4, 0.0));
    rc2 += vec3(0.05,0.06,0.06)*smoothstep(0.4, 1.0, dif);
    col = mix(col, rc2, riv*0.95);
  }
  if (delta > 0.01) {
    float ch = abs(fbm(p*22.0 + 4.0, 3) - 0.5);
    float chan = smoothstep(0.05, 0.02, ch) * delta;
    col = mix(col, mix(vec3(0.33,0.43,0.20), vec3(0.42,0.46,0.26), fbm(p*9.0, 2)), delta*0.65*(1.0 - riv));
    col = mix(col, vec3(0.24,0.40,0.44), chan*0.75);
  }
  col *= 1.0 - cliffFace*0.25*(1.0 - dif);
  return col;
}

`;
  var WATER = `// ================================================================= 빙산·유빙 (찬 바다에서만)
vec4 bergs(vec2 p, float dens, out float skirt, out float shadow, out float ring){
  // 탁상 빙산(모서리 둥근 긴 네모, 평평한 윗면과 깎아지른 옆면)과 뾰족 빙산(들쭉날쭉한 덩어리). 모양 식은 Geo.berg와 같다
  skirt = 0.0; shadow = 0.0; ring = 0.0;
  const float CB = 0.45;
  vec2 ci = floor(p / CB);
  vec4 res = vec4(0.0);
  float bestH = -1.0;
  for (int j=-1;j<=1;j++) for (int i=-1;i<=1;i++){
    ivec2 c = ivec2(ci) + ivec2(i,j);
    if (hash(c + ivec2(5,5)) > dens*0.40) continue;
    vec2 ctr = (vec2(c) + 0.2 + 0.6*vec2(hash(c+ivec2(13,1)), hash(c+ivec2(1,13)))) * CB;
    float hr = hash(c + ivec2(19,7));
    float R = CB*(0.09 + 0.22*hr*hr);
    vec2 d = p - ctr; float dd = length(d);
    if (dd > R*1.9) continue;
    float id = hash(c + ivec2(2,77));
    float tab = step(0.45, id);
    float a0 = id*6.2832, ca = cos(a0), sa = sin(a0);
    vec2 q = vec2(ca*d.x + sa*d.y, -sa*d.x + ca*d.y);
    float asp = 1.0 + 1.2*fract(id*7.7);
    vec2 dir = d / max(dd, 1e-5);
    float sd;   // 1 = 가장자리
    if (tab > 0.5) { vec2 a = abs(q)/R*vec2(1.0, asp); a = a*a; sd = pow(dot(a, a), 0.25); }
    else sd = dd / (R*(0.62 + 0.38*vnoise(dir*3.0 + vec2(id*13.1, hr*7.3))));
    float rr = dd / max(sd, 1e-4);           // 이 방향의 가장자리까지 거리
    skirt = max(skirt, smoothstep(1.7, 0.95, sd));
    ring = max(ring, smoothstep(1.13, 1.0, sd) * step(1.0, sd));
    vec2 ds = d - SUNXY*R*0.5; float dds = length(ds);
    float sds = tab > 0.5 ? pow(dot(pow(abs(vec2(ca*ds.x + sa*ds.y, -sa*ds.x + ca*ds.y))/R*vec2(1.0, asp), vec2(4.0)), vec2(1.0)), 0.25) : dds/(R*0.85);
    shadow = max(shadow, smoothstep(1.02, 0.9, sds) * step(1.0, sd));
    if (sd < 1.0) {
      vec3 nn; float top;
      if (tab > 0.5) {
        float edge = smoothstep(0.80, 0.98, sd);
        vec2 gq = sign(q)*pow(abs(q)/R*vec2(1.0, asp), vec2(3.0))*vec2(1.0, asp);
        vec2 gw = normalize(vec2(ca*gq.x - sa*gq.y, sa*gq.x + ca*gq.y) + 1e-5);
        nn = normalize(mix(vec3(0.0,0.0,1.0), vec3(gw*0.9, 0.3), edge));
        top = 1.0 - edge*0.3;
        nn = normalize(nn + vec3((vnoise(q/R*6.0 + id*9.0) - 0.5)*0.12*(1.0 - edge)));
      } else {
        vec2 bmp = vec2(vnoise(d/R*5.0 + id*9.0), vnoise(d/R*5.0 + id*9.0 + 7.0)) - 0.5;
        nn = normalize(vec3(dir*(0.5 + 0.45*sd) + bmp*0.7, 0.55)); top = 1.0 - sd;
      }
      if (top > bestH) {
        bestH = top;
        float l = clamp(dot(nn, SUN), 0.0, 1.0);
        vec3 c2 = mix(vec3(0.52,0.67,0.82), vec3(0.97,0.98,1.0), 0.2 + 0.8*l);
        c2 *= 0.96 + 0.06*vnoise(d/R*12.0 + id*3.0);
        res = vec4(c2, 1.0);
      }
    }
  }
  return res;
}

// ================================================================= 바다
vec3 waterCol(vec2 ll, vec2 p, float d, vec2 gS, float rivD, vec4 cl, float pxT, float pxD, float battle){
  float t = uTime;
  float shelf = uW0.x * (2.0 + 6.5*fbm(p*0.33 + vec2(17.0,5.0), 2));
  float z = d / shelf;
  vec3 lag = uW3.rgb, sha = uW1.rgb, deep = uW2.rgb;
  vec3 mid = mix(sha, deep, 0.5);
  vec3 col = mix(lag, sha, smoothstep(0.02, 0.35, z));
  col = mix(col, mid, smoothstep(0.35, 1.3, z));
  col = mix(col, deep, smoothstep(1.2, 4.0, z));
  col = mix(col, deep*vec3(0.74,0.80,0.88), smoothstep(14.0, 60.0, d));
  float Tw = cl.r;
  col = mix(col, col*vec3(0.84,0.95,0.98) + vec3(0.0,0.015,0.02), smoothstep(0.32, 0.12, Tw));
  col = mix(col, col*vec3(0.90,1.07,1.05), smoothstep(0.70, 0.86, Tw)*exp(-z*1.2));
  col *= 0.95 + 0.10*fbm(p*0.55 + vec2(t*0.004, 0.0), 2);
  float ct = coastType(p);
  float rockyC = smoothstep(0.44, 0.58, ct);
  // 얕은 물에 비치는 바닥: 모래 물결, 수중 암반, 해초
  float vis = exp(-z*2.4) * (1.0 - battle);
  if (vis > 0.02) {
    vec3 bv = voro(p*14.0);
    float rockBed = rockyC * smoothstep(0.42, 0.12, bv.x) * smoothstep(0.3, 0.6, fbm(p*5.0, 2));
    float weed = smoothstep(0.58, 0.72, fbm(p*6.0 + 30.0, 3)) * step(0.35, Tw) * (1.0 - rockyC);
    float rip = 0.5 + 0.5*sin(fbm(p*14.0, 2)*26.0);
    col = mix(col, col*vec3(1.08,1.05,0.92)*(0.96 + 0.08*rip), vis*0.45*(1.0 - rockyC));
    col = mix(col, col*vec3(0.58,0.64,0.66), vis*rockBed*0.75);
    col = mix(col, col*vec3(0.70,0.84,0.70), vis*weed*0.45);
  }
  // 강어귀의 흙탕물
  float plume = exp(-rivD/2.4) * exp(-d/3.5) * (1.0 - battle);
  col = mix(col, vec3(0.36,0.41,0.33), plume*0.5);

  // ---------------- 물결: 너울 2 + 풍랑 5 + 잔물결 (세상 기준 크기, 멀면 흐려진다)
  float wstr = clamp(length(uWind), 0.0, 1.0); vec2 wd = normalize(uWind + vec2(1e-4, 0.0)); vec2 wp = vec2(-wd.y, wd.x);
  vec2 toLand = normalize(gS + vec2(1e-5, 0.0));
  float nearC = exp(-d/5.0) * (1.0 - battle);
  vec2 grad = vec2(0.0); float hs = 0.0; float crest = 0.0;
  float nW1 = vnoise(p*1.3 + 5.0), nW2 = vnoise(p*0.9 + 3.1);
  for (int i=0;i<7;i++){
    float fi = float(i);
    float lam = (i < 2 ? (0.62 - fi*0.22) : (0.17 / (1.0 + (fi - 2.0)*0.42))) * uW0.y;
    float spr = i < 2 ? (fi*0.45 - 0.25) : ((fi - 4.0)*0.45 + 0.1);
    vec2 dir = normalize(wd*cos(spr) + wp*sin(spr));
    dir = normalize(mix(dir, toLand, nearC*(i < 2 ? 0.75 : 0.45)));
    lam *= mix(1.0, 0.6, nearC);
    float lf = smoothstep(3.0, 10.0, lam*pxD);
    if (lf <= 0.0) continue;
    float k = 6.2832/lam;
    float omega = 0.020*sqrt(lam/0.5)*k*(i < 2 ? 1.0 : 1.3);
    float amp = lam*(i < 2 ? (0.07 + 0.05*wstr) : (0.05 + 0.10*wstr)) * (i < 2 ? (1.0 - 0.5*nearC) : 1.0);
    float xp = dot(p, dir)*k;
    float env = 0.55 + 0.45*sin(xp/6.5 - omega/6.5*t + fi*2.1 + nW1*(4.0 + fi));
    float ph = xp - omega*t + fi*1.7 + nW2*(2.5 - fi*0.2) + nW1*fi*0.3;
    hs += amp*env*sin(ph)*lf;
    grad += amp*env*k*dir*cos(ph)*lf;
    if (i >= 2) crest = max(crest, env*smoothstep(0.80, 1.0, sin(ph))*lf);
  }
  float rf = smoothstep(120.0, 300.0, pxD);
  if (rf > 0.0) { vec3 rn = fbmd(p*85.0 - wd*t*0.30, 2); grad += rn.yz*85.0*0.0022*rf*(0.5 + wstr); }
  vec3 n = normalize(vec3(-grad*0.16, 1.0));
  float dif = dot(n, SUN);
  col *= 0.84 + 0.24*dif;
  col += vec3(0.16,0.22,0.28) * pow(1.0 - n.z, 1.5) * 2.2 * (1.0 - 0.6*uStorm);
  col *= 1.0 + 0.06*hs/max(0.02, 0.1*uW0.y);
  vec3 hv = normalize(SUN + vec3(0.0,0.0,1.0));
  float sp = pow(max(dot(n, hv), 0.0), 260.0);
  col += vec3(1.0,0.95,0.82) * min(sp*1.4*uW0.w, 0.28) * (1.0 - 0.8*uStorm);

  // 흰 물마루: 바람이 셀수록, 바람에 직각으로 길쭉한 물마루가 드문드문 생겼다 사라진다
  if (wstr > 0.3 && pxD > 40.0) {
    vec2 qw = vec2(dot(p, wp)*4.5, dot(p, wd)*8.0 - t*0.12);
    vec3 cv = voro(qw);
    float life = fract(t*0.11 + cv.z*9.0);
    float on = step(cv.z, (wstr - 0.3)*0.05*uW0.z) * smoothstep(0.0, 0.25, life) * smoothstep(1.0, 0.55, life);
    float sz = 0.08 + 0.14*fract(cv.z*17.3);            // 물마루마다 크기가 다르다
    float br = 0.40 + 0.45*fract(cv.z*31.7);            // 진하기도 다르다
    float caps = on * smoothstep(sz, sz*0.25, cv.x + (vnoise(qw*6.0) - 0.5)*0.08) * smoothstep(0.5, 1.8, d);
    caps *= smoothstep(0.25, 0.6, vnoise(qw*2.3 + 7.0)); // 끝이 흩어진다
    col = mix(col, vec3(0.92,0.95,0.96), clamp(caps*br, 0.0, 0.8));
  }

  // ---------------- 해안 포말: 밀려와 부서지는 물결 (늘 켜진 외곽선이 아니다)
  if (battle < 0.5 && d < 3.0) {
    float lineOK = smoothstep(1.2, 3.5, pxT);
    float ph2 = d*5.0 + t*0.85 + fbm(p*5.0, 2)*3.5;
    float bnd = smoothstep(0.80, 1.0, sin(ph2)) * smoothstep(clamp(24.0/max(pxT, 1.0), 0.45, 1.05), 0.22, d) * smoothstep(0.02, 0.15, d);
    float gaps = smoothstep(0.38, 0.62, fbm(p*8.0 + vec2(t*0.05, -t*0.04), 2));
    float sw = smoothstep(0.24, 0.03, d) * (0.35 + 0.65*(0.5 + 0.5*sin(t*1.05 + fbm(p*12.0, 2)*9.0))) * smoothstep(0.30, 0.60, fbm(p*16.0 + t*0.07, 2));
    float spray = rockyC * smoothstep(0.40, 0.02, d) * smoothstep(0.6, 0.85, vnoise(p*34.0 + vec2(t*0.5, -t*0.3)));
    float foam = (bnd*gaps*(0.55 + 0.35*(1.0 - rockyC)) + sw*0.75 + spray*0.8) * lineOK;
    foam += (1.0 - lineOK) * smoothstep(0.7, 0.0, d) * 0.22 * (0.6 + 0.4*gaps);
    // 절벽 아래 물은 그늘
    col *= 1.0 - 0.18*smoothstep(0.8, 0.0, d)*smoothstep(0.6, 0.75, ct);
    col = mix(col, vec3(0.93,0.96,0.96), clamp(foam*uW1.w, 0.0, 0.9));
  }

  // ---------------- 빙산·유빙·부빙 (찬 바다에서만)
  float Iw = cl.a;
  // 남극해는 기후 자료의 얼음이 위도 -62°에서 끊기므로, 위도와 잡음으로 부드럽게 얼음 가장자리를 만든다
  float Ipk = ll.y < -55.0 ? smoothstep(-57.0, -67.0, ll.y + (fbm(p*0.5 + 3.0, 3) - 0.5)*7.0) : Iw;
  float IwB = ll.y < -55.0 ? smoothstep(-57.0, -67.0, ll.y) : Iw;
  float coldW = smoothstep(0.52, 0.30, Tw);
  float bergD = (smoothstep(0.02, 0.30, IwB) + 0.3*smoothstep(62.0, 70.0, abs(ll.y))) * coldW * uW3.w * (1.0 - battle);
  float packD = smoothstep(0.50, 0.95, Ipk + (fbm(p*1.2, 2) - 0.5)*0.25) * (1.0 - battle);
  if (packD > 0.01) {
    vec2 pw = p*2.6 + (vec2(fbm(p*1.7, 3), fbm(p*1.7 + 5.0, 3)) - 0.5)*1.6;
    vec3 pv = voro(pw);
    vec3 pv2 = voro(pw*2.3 + 7.0);
    float crackW = mix(0.12, 0.035, packD);
    float lead = smoothstep(crackW*0.5, crackW, pv.y - pv.x + (vnoise(p*25.0) - 0.5)*0.05);
    float brk = smoothstep(0.85, 0.45, packD);
    float small = step(pv2.z, packD*1.2) * smoothstep(0.03, 0.08, pv2.y - pv2.x);
    float floe = step(pv.z, packD*1.1) * lead * mix(1.0, small, brk);
    vec3 fc = mix(vec3(0.76,0.85,0.91), vec3(0.95,0.97,0.99), fbm(p*14.0, 3)) * (0.90 + 0.12*pv.z);
    fc *= 1.0 - 0.07*smoothstep(0.45, 0.55, fbm(p*28.0, 2));
    fc = mix(fc, vec3(0.62,0.72,0.80), smoothstep(0.35, 0.0, pv.z)*0.35);   // 얇은 얼음은 잿빛
    float fl = clamp(dot(normalize(vec3(-(vec2(fbm(p*9.0,2), fbm(p*9.0+3.0,2)) - 0.5)*0.6, 1.0)), SUN), 0.0, 1.0);
    col = mix(col, col*0.82, packD*0.4*(1.0 - floe));
    col = mix(col, fc*(0.86 + 0.2*fl), floe);
  }
  if (bergD > 0.01) {
    float sk, shd, rg;
    vec4 b = bergs(p, bergD, sk, shd, rg);
    col = mix(col, vec3(0.36,0.70,0.78), sk*0.45*(1.0 - b.a));
    col *= 1.0 - 0.28*shd*(1.0 - b.a);
    col = mix(col, vec3(0.92,0.96,0.97), rg*(0.45 + 0.25*sin(t*1.4 + p.x*40.0))*(1.0 - b.a));
    col = mix(col, b.rgb, b.a);
    // 작은 얼음 조각
    if (pxD > 45.0) {
      vec3 fv = voro(p*9.0 + 50.0);
      float bit = step(fv.z, bergD*0.08) * smoothstep(0.24, 0.17, fv.x + (vnoise(p*60.0) - 0.5)*0.10);
      col = mix(col, vec3(0.90,0.95,0.98), bit*0.9);
    }
  }
  return col;
}

// ================================================================= 해전 바다: 배 몇 척이 한눈에 들어오는 가까운 먼바다
// q = 해전 좌표(100px 단위, 위가 +), pxU = 한 단위의 화면 px. 너울 2 + 풍랑 6 + 잔물결, 물빛 얼룩, 물마루를 비치는 빛, 부서지는 물마루와 바람에 끌리는 거품 줄
vec3 battleSea(vec2 q, float pxU){
  float t = uTime;
  float wstr = clamp(length(uWind), 0.0, 1.0); vec2 wd = normalize(uWind + vec2(1e-4, 0.0)); vec2 wp = vec2(-wd.y, wd.x);
  vec3 deep = uW2.rgb;
  float big = fbm(q*0.035 + vec2(t*0.004, -t*0.003), 3);
  vec3 col = mix(deep*vec3(0.78,0.85,0.92), deep*vec3(1.12,1.22,1.14) + vec3(0.0,0.018,0.02), smoothstep(0.28, 0.74, big));
  vec2 grad = vec2(0.0); float hs = 0.0, crest = 0.0;
  float n1 = vnoise(q*0.11 + 3.0), n2 = vnoise(q*0.07 + 11.0);
  for (int i = 0; i < 8; i++){
    float fi = float(i);
    float lam = (i < 2 ? (7.5 - fi*2.6) : (2.2 / (1.0 + (fi - 2.0)*0.55))) * uW0.y;
    float spr = i < 2 ? (fi*0.5 - 0.2) : sin(fi*2.3)*0.75;
    vec2 dir = normalize(wd*cos(spr) + wp*sin(spr));
    float k = 6.2832/lam;
    float omega = sqrt(9.8*k/33.0)*0.65;                 // 1단위 ≈ 33m: 긴 물결일수록 빠르다(분산), 화면에서 서두르지 않게 조금 늦춤
    float steep = i < 2 ? 0.05 + 0.03*wstr : 0.03 + 0.07*wstr;
    float amp = steep/k;
    float lf = smoothstep(4.0, 14.0, lam*pxU);
    float xp = dot(q, dir)*k;
    float env = 0.55 + 0.45*sin(xp*0.17 - omega*0.17*t + fi*2.1 + n1*(3.0 + fi));
    float ph = xp - omega*t + fi*1.7 + n2*(3.0 - fi*0.25);
    hs += amp*env*sin(ph)*lf;
    grad += amp*env*k*dir*cos(ph)*lf;
    if (i >= 2 && i <= 6) crest = max(crest, env*smoothstep(0.84, 1.0, sin(ph))*lf);
  }
  vec3 rn = fbmd(q*9.0 - wd*t*0.55, 2); grad += rn.yz*9.0*0.0045*(0.5 + wstr)*smoothstep(3.0, 9.0, pxU/9.0);
  vec3 n = normalize(vec3(-grad*0.62, 1.0));
  float dif = dot(n, SUN);
  col *= 0.80 + 0.30*dif;
  col += vec3(0.13,0.19,0.26) * pow(1.0 - n.z, 1.4) * 2.6 * (1.0 - 0.6*uStorm);
  col += vec3(0.012,0.085,0.075) * clamp(hs*5.0, 0.0, 1.0) * (0.6 + 0.4*max(dot(normalize(grad + 1e-5), SUNXY), 0.0));   // 물마루를 비쳐 나오는 청록빛
  col *= 1.0 - 0.10*clamp(-hs*4.0, 0.0, 1.0);                                                                          // 골은 조금 어둡게
  vec3 hv = normalize(SUN + vec3(0.0,0.0,1.0));
  float sp = pow(max(dot(n, hv), 0.0), 320.0);
  col += vec3(1.0,0.95,0.82) * min(sp*1.6*uW0.w, 0.32) * (1.0 - 0.8*uStorm);
  // 부서지는 물마루: 높은 마루에서 잠깐 희어졌다 사라진다 (바람이 셀수록 많다)
  if (wstr > 0.22) {
    float gate = fbm(q*0.45 + vec2(t*0.04, -t*0.03), 2) + (wstr - 0.6)*0.35;
    // 바람에 직각으로 짧게 늘어진 물마루 조각들 — 하나하나 생겼다 사라진다 (줄무늬가 되지 않게 칸마다 따로)
    vec2 qw = vec2(dot(q, wp)*0.9, dot(q, wd)*2.2 - t*0.25);
    vec3 cv = voro(qw);
    float life = fract(t*0.16 + cv.z*9.0);
    float on = step(cv.z, (wstr - 0.25)*0.32*uW0.z) * smoothstep(0.0, 0.15, life) * smoothstep(1.0, 0.45, life);
    float sz = 0.15 + 0.16*fract(cv.z*17.3);
    float brk = on * smoothstep(sz, sz*0.3, cv.x + (vnoise(qw*5.0) - 0.5)*0.12) * smoothstep(0.25, 0.6, vnoise(qw*2.1 + 7.0)) * (0.55 + 0.45*clamp(hs*6.0 + 0.5, 0.0, 1.0));
    vec2 qs = vec2(dot(q, wd)*0.6, dot(q, wp)*5.0);
    float streak = smoothstep(0.66, 0.84, fbm(qs - vec2(t*0.06, 0.0), 3)) * smoothstep(0.50, 0.90, wstr) * 0.22 * smoothstep(0.45, 0.70, gate);   // 바람에 끌리는 거품 줄
    float foam = brk*(0.50 + 0.40*vnoise(q*14.0)) + streak;
    col = mix(col, vec3(0.90,0.94,0.95), clamp(foam*uW0.z, 0.0, 0.85));
  }
  return col;
}

// ================================================================= 구름
float clouds(vec2 ll, float extra, out vec2 cg){ vec2 p = (ll + vec2(180.0,90.0))*0.9 - uWind*uTime*0.015;
  vec3 c = fbmd(p, 5); cg = c.yz; float cover = 0.78 - uCloud*0.30 - extra*0.40; return smoothstep(cover, cover + 0.16, c.x); }

`;
  var MAIN_LAND = `// ================================================================= 육지 캐시 패스: 화면보다 넓은 판에 육지만 그려 둔다 (알파 = 육지 비율)
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 ll = uCenter + (frag - uRes*0.5) / uZoom;
  ll.x = mod(ll.x + 180.0, 360.0) - 180.0;
  ll.y = clamp(ll.y, -89.9, 89.9);
  vec2 p = ll + vec2(180.0, 90.0);
  vec2 uv = uvOf(ll);
  float pxT = uZoom / TPD, pxD = uZoom;
  vec4 g0 = texture(uGeo, uv);
  float s = sdfTex(g0);
  float sn = s + coastNoise(ll);
  float aa = 0.75 / max(pxT, 0.5);
  if (sn <= -aa) { outColor = vec4(0.0); return; }
  vec2 du = vec2(1.0/4096.0, 0.0), dv = vec2(0.0, 1.0/2048.0);
  vec4 gx1 = texture(uGeo, uv + du), gx0 = texture(uGeo, uv - du), gy1 = texture(uGeo, uv - dv), gy0 = texture(uGeo, uv + dv);
  float rivD = rivTex(g0);
  vec2 wv = vec2(vnoise(p*26.0 + 5.0), vnoise(p*26.0 + 17.0)) - 0.5;
  // 흐린 강줄기 c ≈ c0·exp(-x²/2σ²) 에서 x = σ²·|∇c|/c — 줄기가 가늘든 굵든(봉우리 높이와 상관없이) 한가운데가 0
  float rivC = 9.0;
  if (rivD < 3.0) {
    vec2 uvr = uvOf(ll + wv*0.45/TPD), hx = vec2(0.5/4096.0, 0.0), hy = vec2(0.0, 0.5/2048.0);
    float c0 = texture(uGeo, uvr).a;
    vec2 gc = vec2(texture(uGeo, uvr + hx).a - texture(uGeo, uvr - hx).a, texture(uGeo, uvr - hy).a - texture(uGeo, uvr + hy).a);
    rivC = c0 > 0.03 ? 0.95*length(gc)/c0 : 9.0;
  }
  vec2 gS = vec2(sdfTex(gx1) - sdfTex(gx0), sdfTex(gy1) - sdfTex(gy0)) * 0.5;
  vec2 gR = vec2(rivTex(gx1) - rivTex(gx0), rivTex(gy1) - rivTex(gy0)) * 0.5;
  vec3 col = landCol(ll, p, max(sn, 0.0), rivD, rivC, gS, gR, pxT, pxD);
  outColor = vec4(col, smoothstep(-aa, aa, sn));
}
`;
  var MAIN_COMP = `// ================================================================= 화면 패스: 바다는 매 장면 새로, 육지는 캐시에서
uniform sampler2D uCache;
uniform vec2 uCacheC;
uniform float uCacheZ;
uniform vec2 uCacheSize;
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 ll = uCenter + (frag - uRes*0.5) / uZoom;
  ll.x = mod(ll.x + 180.0, 360.0) - 180.0;
  ll.y = clamp(ll.y, -89.9, 89.9);
  vec2 p = ll + vec2(180.0, 90.0);
  vec2 uv = uvOf(ll);
  float pxT = uZoom / TPD;
  float pxD = uZoom;
  vec3 col;
  float battle = step(0.5, uMode);
  if (battle > 0.5) {
    vec2 q = vec2(mod(ll.x - uCacheC.x + 540.0, 360.0) - 180.0, ll.y - uCacheC.y) * uCacheZ / 100.0;
    col = battleSea(q, uZoom / uCacheZ * 100.0);
  } else {
    vec4 g0 = texture(uGeo, uv);
    float s = sdfTex(g0);
    float sn = s + coastNoise(ll);
    float aa = 0.75 / max(pxT, 0.5);
    vec4 land = vec4(0.0);
    if (sn > -aa) {
      float dx = mod(ll.x - uCacheC.x + 540.0, 360.0) - 180.0;
      vec2 cp = vec2(uCacheSize.x*0.5 + dx*uCacheZ, uCacheSize.y*0.5 + (ll.y - uCacheC.y)*uCacheZ);
      land = texture(uCache, cp / uCacheSize);
    }
    if (land.a < 0.998) {
      vec2 du = vec2(1.0/4096.0, 0.0), dv = vec2(0.0, 1.0/2048.0);
      vec4 gx1 = texture(uGeo, uv + du), gx0 = texture(uGeo, uv - du), gy1 = texture(uGeo, uv - dv), gy0 = texture(uGeo, uv + dv);
      vec2 gS = vec2(sdfTex(gx1) - sdfTex(gx0), sdfTex(gy1) - sdfTex(gy0)) * 0.5;
      vec4 cl = texture(uClim, uv);
      vec3 cw = waterCol(ll, p, max(-sn, 0.0), gS, rivTex(g0), cl, pxT, pxD, 0.0);
      col = mix(cw, land.rgb, land.a);
    } else col = land.rgb;
  }
  // 구름 그림자와 구름 (화면 가장자리에 짙고, 배가 있는 가운데는 맑게)
  vec2 sc = frag / uRes; float edge = min(min(sc.x, 1.0 - sc.x)*1.5, min(sc.y, 1.0 - sc.y));
  float eb = (1.0 - smoothstep(0.0, 0.16, edge)) * uEdge * 0.55;
  float clear = smoothstep(0.30, 0.08, length((sc - 0.5)*vec2(1.6, 1.0)));
  float camt = uW2.w * (1.0 - battle*0.7);
  vec2 cg; float cs = clouds(ll + vec2(0.35, -0.3), eb - clear*0.6, cg);
  col *= 1.0 - cs*0.22*camt;
  float cd = clouds(ll, eb - clear*0.6, cg);
  vec3 cn = normalize(vec3(-cg*0.9, 1.0)); float lc = clamp(dot(cn, SUN), 0.0, 1.0);
  vec3 ccol = mix(vec3(0.66,0.69,0.75), vec3(1.0,0.985,0.95), 0.35 + 0.65*lc);
  col = mix(col, ccol, cd*0.88*camt);
  col = mix(col, col*vec3(0.55,0.6,0.7), uStorm*0.7);
  col = mix(col, col*vec3(0.62,0.55,0.75), uDusk*0.6);
  col = pow(max(col, 0.0), vec3(0.95)) * vec3(1.03, 1.0, 0.95);
  vec2 vc = sc - 0.5; float vig = smoothstep(0.95, 0.35, length(vc*vec2(1.25, 1.0)));
  col *= 0.82 + 0.18*vig;
  outColor = vec4(col, 1.0);
}
`;
  var FS_LAND = HEAD + LAND + MAIN_LAND;
  var FS_MAIN = HEAD + WATER + MAIN_COMP;

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(sh);
      console.error(log);
      throw new Error('shader compile failed: ' + log);
    }
    return sh;
  }

  function link(gl, fs) {
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(prog, 0, 'aPos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link failed: ' + gl.getProgramInfoLog(prog));
    return prog;
  }
  var UNIFORMS = ['uGeo', 'uClim', 'uRes', 'uCenter', 'uZoom', 'uTime', 'uWind', 'uCloud', 'uEdge', 'uMode', 'uDusk', 'uStorm', 'uQuality',
    'uT0', 'uT1', 'uW0', 'uW1', 'uW2', 'uW3', 'uCache', 'uCacheC', 'uCacheZ', 'uCacheSize'];

  /* 두 패스:
     · 육지 캐시 — 무거운 육지(높이·생태·나무·강)는 화면보다 1.45배 넓은 판에 그려 두고, 카메라가 그 판 안에 있는 동안 다시 쓴다.
       배가 움직여 여유의 40%를 쓰면 진행 방향으로 앞선 새 판을 한 장면에 1/4씩 뒤에서 그려 두었다가 바꿔 끼운다(끊김 없이).
       확대가 바뀌거나 판 밖으로 나가면 그 자리에서 한 번에 다시 그린다.
     · 화면 — 바다(물결·포말·빙산)는 매 장면 새로 그리고, 육지는 캐시에서 읽어 섞은 뒤 구름·색보정 */
  function Renderer(canvas) {
    this.canvas = canvas;
    var gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL2 not available');
    this.gl = gl;
    this.progMain = link(gl, FS_MAIN);
    this.progLand = link(gl, FS_LAND);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.vao = vao;
    var self = this;
    function locs(prog) { var o = {}; UNIFORMS.forEach(function (n) { o[n] = gl.getUniformLocation(prog, n); }); return o; }
    this.uM = locs(this.progMain); this.uL = locs(this.progLand);
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.caches = [null, null];     // [앞(쓰는 중), 뒤(그리는 중)]
    this.job = null;
    this.stats = { full: 0, strips: 0, swaps: 0 };
    this._uploadTextures();
  }

  Renderer.prototype._uploadTextures = function () {
    var gl = this.gl, sz = G.Geo.size();
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    var tg = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tg);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, sz.W, sz.H, 0, gl.RGBA, gl.UNSIGNED_BYTE, G.Geo.geoTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var tc = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tc);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, sz.CW, sz.CH, 0, gl.RGBA, gl.UNSIGNED_BYTE, G.Geo.climateTexture());
    gl.generateMipmap(gl.TEXTURE_2D);   // 흐린 고도(산맥의 등줄기)를 textureLod로 읽는다
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.texGeo = tg; this.texClim = tc;
  };

  function fxv(o, k, d) { return o && o[k] != null ? o[k] : d; }
  Renderer.prototype._common = function (u, view, W, H, zoom) {
    var gl = this.gl;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texGeo); gl.uniform1i(u.uGeo, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texClim); gl.uniform1i(u.uClim, 1);
    gl.uniform2f(u.uRes, W, H);
    gl.uniform1f(u.uZoom, zoom);
    gl.uniform1f(u.uQuality, view.quality == null ? 1 : view.quality);
    var FX = G.FX || {}, T = FX.terrain, Wt = FX.water;
    var sh = fxv(Wt, 'shallow', [0.10, 0.47, 0.55]), dp = fxv(Wt, 'deep', [0.04, 0.165, 0.32]), lg = fxv(Wt, 'lagoon', [0.30, 0.66, 0.63]);
    gl.uniform4f(u.uT0, fxv(T, 'relief', 1), fxv(T, 'mountain', 1), fxv(T, 'forest', 1), fxv(T, 'treeSize', 1));
    gl.uniform4f(u.uT1, fxv(T, 'snowline', 0), fxv(T, 'river', 1), fxv(T, 'beach', 1), fxv(T, 'detail', 1));
    gl.uniform4f(u.uW0, fxv(Wt, 'shelf', 1), fxv(Wt, 'wave', 1), fxv(Wt, 'whitecap', 1), fxv(Wt, 'glint', 1));
    gl.uniform4f(u.uW1, sh[0], sh[1], sh[2], fxv(Wt, 'foam', 1));
    gl.uniform4f(u.uW2, dp[0], dp[1], dp[2], fxv(Wt, 'cloud', 0.8));
    gl.uniform4f(u.uW3, lg[0], lg[1], lg[2], fxv(Wt, 'berg', 1));
  };
  function wrap(d) { d = (d + 180) % 360; if (d < 0) d += 360; return d - 180; }
  /** 캐시 판 하나 (텍스처 + 프레임버퍼) */
  Renderer.prototype._newCache = function (w, h) {
    var gl = this.gl, tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex: tex, fbo: fbo, w: w, h: h, ready: false };
  };
  /** 판 c의 [y0, y1) 줄만 육지 패스로 그린다 */
  Renderer.prototype._renderStrip = function (c, view, y0, y1) {
    var gl = this.gl, u = this.uL;
    gl.bindFramebuffer(gl.FRAMEBUFFER, c.fbo);
    gl.viewport(0, 0, c.w, c.h);
    gl.enable(gl.SCISSOR_TEST); gl.scissor(0, y0, c.w, y1 - y0);
    gl.useProgram(this.progLand);
    gl.bindVertexArray(this.vao);
    this._common(u, view, c.w, c.h, c.zoom);
    gl.uniform2f(u.uCenter, c.lon, c.lat);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  /** 판 c가 이 화면을 덮는가 — 세상 좌표(°)로 따진다. 확대가 조금 달라도(ZOOM_KEEP 배 안) 늘이거나 줄여서 쓴다 */
  var ZOOM_KEEP = 2;
  Renderer.prototype._covers = function (c, lon, lat, zoom, W, H, key, slack) {
    if (!c || !c.ready || c.key !== key) return false;
    var r = zoom / c.zoom; if (r > ZOOM_KEEP || r < 1 / ZOOM_KEEP) return false;
    var dx = Math.abs(wrap(lon - c.lon)), dy = Math.abs(lat - c.lat);
    return dx + W / 2 / zoom <= (c.w / 2 - slack) / c.zoom && dy + H / 2 / zoom <= (c.h / 2 - slack) / c.zoom;
  };
  /** 뒤에서 판을 몇 줄로 나눠 그릴지: 판이 클수록 잘게 (한 장면에 무거운 육지 패스를 조금씩) */
  function stripsFor(cw, ch) { return Math.max(4, Math.min(10, Math.round(cw * ch / 450000))); }
  Renderer.prototype._ensureCache = function (view, W, H, zoom) {
    var FX = G.FX || {}, gl = this.gl, self = this;
    var key = JSON.stringify(FX.terrain || {}) + '|' + (view.quality == null ? 1 : view.quality);
    var cw = Math.min(this.maxTex, Math.ceil(W * 1.45)), ch = Math.min(this.maxTex, Math.ceil(H * 1.45));
    // 뒤 판은 늘 지금 크기로 — 앞 판은 크기가 달라도(해상도를 막 바꿨을 때) 화면을 덮는 동안 그대로 쓴다
    var bk = this.caches[1];
    if (!bk || bk.w !== cw || bk.h !== ch) { if (bk) { gl.deleteTexture(bk.tex); gl.deleteFramebuffer(bk.fbo); } this.caches[1] = this._newCache(cw, ch); this.job = null; }
    // 카메라가 움직이는 빠르기 (화면 px/장면, 부드럽게)
    var lv = this._lastView, vx = 0, vy = 0;
    if (lv && lv.zoom === zoom) { vx = wrap(view.lon - lv.lon) * zoom; vy = (view.lat - lv.lat) * zoom; }
    this._vel = this._vel || [0, 0];
    this._vel[0] = this._vel[0] * 0.9 + vx * 0.1; this._vel[1] = this._vel[1] * 0.9 + vy * 0.1;
    this._zoomStill = lv && lv.zoom === zoom ? (this._zoomStill || 0) + 1 : 0;   // 확대가 몇 장면째 그대로인가
    this._lastView = { lon: view.lon, lat: view.lat, zoom: zoom };
    var mX = (cw - W) / 2, mY = (ch - H) / 2;
    function plan(c) {   // 새 판의 가운데: 지금 카메라에서 진행 방향으로 여유의 절반까지 앞서
      var lx = Math.max(-mX * 0.5, Math.min(mX * 0.5, self._vel[0] * 40)), ly = Math.max(-mY * 0.5, Math.min(mY * 0.5, self._vel[1] * 40));
      c.lon = wrap(view.lon + lx / zoom); c.lat = view.lat + ly / zoom; c.zoom = zoom; c.key = key; c.ready = false;
    }
    var front = this.caches[0], back = this.caches[1], j = this.job;
    if (!this._covers(front, view.lon, view.lat, zoom, W, H, key, 1)) {
      // 뒤에서 그리던 판이 이 자리를 덮으면 마저 그려 쓰고, 아니면 여기서 한 번에 새로 그린다
      if (j && back.zoom === zoom && back.key === key) {
        back.ready = true; var okBack = this._covers(back, view.lon, view.lat, zoom, W, H, key, 1); back.ready = false;
        if (okBack) { for (var k = j.i; k < j.n; k++) this._renderStrip(back, view, Math.floor(k * ch / j.n), Math.floor((k + 1) * ch / j.n)); back.ready = true; this.job = null; this.caches = [back, front]; this.stats.swaps++; return this.caches[0]; }
      }
      plan(back);
      this._renderStrip(back, view, 0, ch); back.ready = true; this.job = null;
      this.caches = [back, front]; this.stats.full++;
      return this.caches[0];
    }
    // 그리는 사이 확대가 또 바뀌었으면 멈췄다가 확대가 가라앉으면 새로
    if (j && (back.zoom !== zoom || back.key !== key)) { this.job = j = null; }
    if (j) {
      this._renderStrip(back, view, Math.floor(j.i * ch / j.n), Math.floor((j.i + 1) * ch / j.n)); j.i++; this.stats.strips++;
      if (j.i >= j.n) { back.ready = true; this.job = null; this.caches = [back, front]; this.stats.swaps++; }
    } else {
      // 확대·해상도가 바뀐 판(늘여 쓰는 중)은 확대가 멈추면 새로, 아니면 여유의 40%를 쓰면 진행 방향으로 앞선 판을
      var stale = front.zoom !== zoom || front.w !== cw || front.h !== ch;
      var used = Math.max(Math.abs(wrap(view.lon - front.lon)) * zoom / Math.max(1, mX), Math.abs(view.lat - front.lat) * zoom / Math.max(1, mY));
      if ((stale && this._zoomStill >= 3) || (!stale && used > 0.4)) { plan(back); this.job = { i: 0, n: stripsFor(cw, ch) }; }
    }
    return this.caches[0];
  };
  /** 캐시를 버린다 (조정값을 바꾼 뒤 등) */
  Renderer.prototype.invalidate = function () { this.caches.forEach(function (c) { if (c) c.ready = false; }); this.job = null; };

  /** view: {lon, lat, zoom(px/deg in CSS px), time, wind:[x,y], cloud, edge, mode, dusk, storm, quality, cssWidth} */
  Renderer.prototype.draw = function (view) {
    var gl = this.gl, c = this.canvas, u = this.uM;
    var pxScale = c.width / (view.cssWidth || c.width), zoom = view.zoom * pxScale;
    var cache = null;
    if (!view.mode) cache = this._ensureCache(view, c.width, c.height, zoom);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, c.width, c.height);
    gl.useProgram(this.progMain);
    gl.bindVertexArray(this.vao);
    this._common(u, view, c.width, c.height, zoom);
    gl.uniform2f(u.uCenter, view.lon, view.lat);
    gl.uniform1f(u.uTime, view.time || 0);
    var w = view.wind || [0.5, 0.3];
    gl.uniform2f(u.uWind, w[0], w[1]);
    gl.uniform1f(u.uCloud, view.cloud == null ? 0.35 : view.cloud);
    gl.uniform1f(u.uEdge, view.edge == null ? 0.8 : view.edge);
    gl.uniform1f(u.uMode, view.mode || 0);
    gl.uniform1f(u.uDusk, view.dusk || 0);
    gl.uniform1f(u.uStorm, view.storm || 0);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, cache ? cache.tex : null); gl.uniform1i(u.uCache, 2);
    if (cache) { gl.uniform2f(u.uCacheC, cache.lon, cache.lat); gl.uniform1f(u.uCacheZ, cache.zoom); gl.uniform2f(u.uCacheSize, cache.w, cache.h); }
    else if (view.mode) { var og = view.origin || [view.lon, view.lat]; gl.uniform2f(u.uCacheC, og[0], og[1]); gl.uniform1f(u.uCacheZ, view.zoom); }   // 해전: 바다 무늬의 원점(전장 한가운데)과 CSS 배율
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  G.WorldRenderer = Renderer;
})(window.G = window.G || {});
