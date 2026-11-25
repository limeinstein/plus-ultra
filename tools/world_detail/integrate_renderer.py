"""기존 바다 광학을 보존하며 공유 고도·수로 텍스처를 렌더러에 연결한다."""
from pathlib import Path
P=Path(__file__).resolve().parents[2]/'js/world/renderer.js'
s=P.read_text(encoding='utf-8')
def change(a,b,count=1):
 global s
 if a not in s:raise RuntimeError('연결 위치를 찾지 못함: '+a[:100])
 s=s.replace(a,b,count)
if 'uniform sampler2D uTerrainDetail;' in s:raise SystemExit('이미 연결됨')
change('uniform sampler2D uClim;','''uniform sampler2D uClim;
uniform sampler2D uTerrainDetail;
uniform sampler2D uHydro;
uniform vec2 uDetailSize;
uniform vec4 uHydroRect;
uniform float uDetailOn;
uniform float uHydroOn;
uniform vec4 uCalendar; // 월, 일, 결빙 위도, 여분''')
change('float rivTex(vec4 g){ return (1.0 - g.b) * 8.0; }','''float rivTex(vec4 g){ return (1.0 - g.b) * 8.0; }
float realElevation(vec2 ll){vec4 d=textureLod(uTerrainDetail,uvOf(ll),0.0);return d.r*65280.0+d.g*255.0-12000.0;}
vec4 terrainCell(vec2 ll){ivec2 p=ivec2(floor(uvOf(ll)*uDetailSize));p.x=(p.x+int(uDetailSize.x))%int(uDetailSize.x);p.y=clamp(p.y,0,int(uDetailSize.y)-1);return texelFetch(uTerrainDetail,p,0);}
float biomeAt(vec2 ll){return floor(terrainCell(ll).b*255.0+.5);}
vec4 hydroAt(vec2 ll){
  if(uHydroOn<.5)return vec4(4.0,0.0,0.0,0.0);
  float dx=mod(ll.x-uHydroRect.x+540.0,360.0)-180.0;
  vec2 uv=vec2(dx,ll.y-uHydroRect.y)/uHydroRect.zw;
  if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0))))return vec4(4.0,0.0,0.0,0.0);
  vec4 d=texture(uHydro,uv);float sd=(d.r*65280.0+d.g*255.0-32768.0)/8192.0;
  return vec4(sd,d.b,d.a,1.0);
}
float terrainSdf(vec2 ll,float base){vec4 h=hydroAt(ll);return h.y>.1?min(base,h.x*TPD):base;}
bool frozenRiver(vec2 ll){float m=ll.y<0.0?mod(uCalendar.x+5.0,12.0)+1.0:uCalendar.x;return abs(ll.y)>=uCalendar.z&&(m<2.5||m>11.5);}
vec3 freshWater(vec2 ll,vec4 hyd,float shore,bool lake){
  float a=hyd.z*6.2831853-3.1415927;vec2 flow=vec2(cos(a),sin(a)),across=vec2(-flow.y,flow.x);
  vec2 p=ll+vec2(180.0,90.0);float phase=dot(p,flow)*135.0-uTime*.65;
  float ripple=sin(phase+sin(dot(p,across)*70.0)*.35)*.5+.5;
  float depth=lake?smoothstep(0.0,3.0,shore):smoothstep(0.0,.06,-hyd.x);
  vec3 color=mix(vec3(.16,.31,.29),vec3(.065,.17,.23),depth);
  if(hyd.y>.54&&hyd.y<.61)color=mix(color,vec3(.28,.30,.22),.48);
  color*=.94+.08*ripple; color+=vec3(.025,.035,.032)*pow(ripple,10.0);
  if(!lake&&frozenRiver(ll)){float crack=abs(vnoise(p*120.0)-.5);color=mix(vec3(.57,.68,.68),vec3(.77,.81,.77),smoothstep(.02,.12,crack));}
  return color;
}''')
change('  float E = cl.b;','  float E = cl.b;\n  float measured = uDetailOn>.5 ? max(0.0,realElevation(ll)) : 0.0;\n  float biome = uDetailOn>.5 ? biomeAt(ll) : 0.0;')
change('  if (E > 0.004 || Ew > 0.01) {','''  if(uDetailOn>.5){
    vec2 delta=vec2(360.0/uDetailSize.x,180.0/uDetailSize.y);
    vec2 eg=vec2(realElevation(ll+vec2(delta.x,0.0))-realElevation(ll-vec2(delta.x,0.0)),realElevation(ll+vec2(0.0,delta.y))-realElevation(ll-vec2(0.0,delta.y)))/(2.0*delta)*.001;
    E=clamp(measured/6000.0,0.0,1.0);hm=measured*.00045*uT0.y;
    ridge=1.0-abs(2.0*gfbm(p*8.0,3)-1.0);
    h+=hm+(ridge-.5)*.025*smoothstep(400.0,2000.0,measured);g+=eg*.45*uT0.y;
  } else if (E > 0.004 || Ew > 0.01) {''')
change('      float hq = uT0.y*Eq*(0.28 + 0.42*rq*rq + 0.15)*1.7;','      float hq = uDetailOn>.5 ? max(0.0,realElevation(q))*.00045*uT0.y : uT0.y*Eq*(0.28 + 0.42*rq*rq + 0.15)*1.7;')
change('  if (wTun > 0.05) {','  if (wTun > 0.05 && uDetailOn<.5) {')
change('  float treel = snowl - 0.22;','''  float treel = snowl - 0.22;
  if(uDetailOn>.5){snowl=(abs(ll.y)>55.0?2100.0:abs(ll.y)>35.0?3300.0:4500.0)*.00045;treel=(abs(ll.y)>55.0?1000.0:abs(ll.y)>35.0?2100.0:3200.0)*.00045;}''')
change('  float delta = smoothstep(5.0, 1.0, s) * smoothstep(3.5, 0.8, rivD);','''  float delta = smoothstep(5.0, 1.0, s) * smoothstep(3.5, 0.8, rivD);
  vec4 sharedRiver=hydroAt(ll);
  if(uDetailOn>.5){
    // 실제 자료에 없는 물웅덩이·가짜 지류를 덧그리지 않는다.
    riv=0.0;delta=0.0;bank=sharedRiver.y>.1?(1.0-smoothstep(.015,.12,abs(sharedRiver.x))):0.0;
    float green=biome==1.0||biome==2.0||biome==3.0||biome==4.0||biome==5.0||biome==6.0||biome==14.0?1.0:0.0;
    vec3 habitat=biome==13.0?dcol:biome==11.0?tcol:green>.5?mix(vec3(.32,.40,.21),vec3(.27,.35,.18),biome==6.0?1.0:.25):biome==7.0||biome==8.0||biome==10.0?scol:gcol;
    col=mix(col,habitat,.88*(1.0-sn)*(1.0-wRock));
    float grassGrain=sin(p.y*340.0+gfbm(p*110.0,2)*3.0)*sin(p.x*390.0);
    col*=1.0+grassGrain*.025*lod;
  }''')
change('  dens = clamp(dens*uT0.z, 0.0, 1.0);','''  if(uDetailOn>.5){
    float forestBiome=biome>=1.0&&biome<=6.0||biome==14.0?1.0:0.0;
    dens=forestBiome*(.48+.38*smoothstep(.25,.65,clump));
    if(biome==12.0)dens=.18*smoothstep(.45,.66,clump);
    if(biome==7.0||biome==9.0)dens=.10;
    if(biome==13.0)dens=.08*bank;
    dens*=1.0-smoothstep(treel-.12,treel+.05,hm);dens*=1.0-beach;
  }
  dens = clamp(dens*uT0.z, 0.0, 1.0);''')
change('  float trop = smoothstep(0.66, 0.78, T) * smoothstep(0.55, 0.7, M);','''  float trop = smoothstep(0.66, 0.78, T) * smoothstep(0.55, 0.7, M);
  if(uDetailOn>.5){conif=biome==6.0?1.0:biome==5.0?.8:biome==4.0?.28:0.0;trop=biome==1.0||biome==2.0||biome==14.0?1.0:0.0;}''')
change('    canopy = mix(canopy, canopy*vec3(1.18,1.12,0.85), smoothstep(0.55, 0.75, patchF)*0.6);','    canopy *= 1.0+(patchF-.5)*.10; // 같은 지역 숲은 작은 명암 차이만 둔다')
change('    if (tpx >= 2.4 && uQuality > 0.3) {','    if (tpx >= 2.4 && uQuality > 0.3 && uDetailOn<.5) {')
change('  float sn = s + coastNoise(ll);','  float sn = terrainSdf(ll,s + coastNoise(ll));',1)
change('    float s = sdfTex(g0), sn = s + coastNoise(ll), aa = 0.75 / max(pxT, 0.5);','    float s = sdfTex(g0), sn = terrainSdf(ll,s + coastNoise(ll)), aa = 0.75 / max(pxT, 0.5);')
change('    float sn = s + coastNoise(ll);','    float sn = terrainSdf(ll,s + coastNoise(ll));')
change('      vec3 cw = waterCol(ll, p, max(-sn, 0.0), gS, rivTex(g0), cl, pxT, pxD, 0.0);','''      vec4 hyd=hydroAt(ll);bool lake=uDetailOn>.5&&terrainCell(ll).a>.5;
      bool river=hyd.y>.15&&hyd.y<.69&&hyd.x<.17;
      vec3 cw = river||lake ? freshWater(ll,hyd,max(-sn,0.0),lake) : waterCol(ll, p, max(-sn, 0.0), gS, rivTex(g0), cl, pxT, pxD, 0.0);''')
change("  UNIFORMS = UNIFORMS.concat(['uOcean', 'uOptics', 'uAbsorption', 'uOceanFlow', 'uOceanTime']);","  UNIFORMS = UNIFORMS.concat(['uOcean', 'uOptics', 'uAbsorption', 'uOceanFlow', 'uOceanTime','uTerrainDetail','uDetailSize','uDetailOn','uHydro','uHydroRect','uHydroOn','uCalendar']);")
change('    this.texGeo = tg; this.texClim = tc;','''    this.texGeo = tg; this.texClim = tc;
    var td=gl.createTexture(),ds=G.Terrain&&G.Terrain.size(),raw=ds?G.Terrain.texture():new Uint8Array([46,224,0,0]);
    gl.bindTexture(gl.TEXTURE_2D,td);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,ds?ds.W:1,ds?ds.H:1,0,gl.RGBA,gl.UNSIGNED_BYTE,raw);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);this.texDetail=td;
    this.emptyHydro=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.emptyHydro);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,0,0]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);''')
change('    var gl = this.gl;\n    gl.activeTexture(gl.TEXTURE0);','''    var gl = this.gl,ds=G.Terrain&&G.Terrain.size(),hyd=this._activeHydro;
    gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,this.texDetail);gl.uniform1i(u.uTerrainDetail,4);
    gl.uniform2f(u.uDetailSize,ds?ds.W:1,ds?ds.H:1);gl.uniform1f(u.uDetailOn,ds&&(!G.FX.terrainWorld||G.FX.terrainWorld.enabled)?1:0);
    gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,hyd?hyd.tex:this.emptyHydro);gl.uniform1i(u.uHydro,5);gl.uniform1f(u.uHydroOn,hyd?1:0);
    var hr=hyd?hyd.rect:[0,0,360,180];gl.uniform4f(u.uHydroRect,hr[0],hr[1],hr[2],hr[3]);
    var calendar=G.Game&&G.Game.state&&G.Game.state.date||{m:5,d:15};gl.uniform4f(u.uCalendar,calendar.m,calendar.d,G.BALANCE.waterways.freezeLatitude,0);
    gl.activeTexture(gl.TEXTURE0);''')
change('  Renderer.prototype._renderStrip = function (c, view, y0, y1) {\n    var gl = this.gl, u = this.uL;','''  Renderer.prototype._renderStrip = function (c, view, y0, y1) {
    var gl = this.gl, u = this.uL;
    if(G.Hydro&&G.Hydro.ready&&!c.hydroReady){
      var start=performance.now(),side=(G.FX.terrainWorld||{}).atlasSide||1024,h=G.Hydro.raster(c.lon,c.lat,c.w/c.zoom,c.h/c.zoom,side);
      var ht=c.hydro?c.hydro.tex:gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,ht);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,side,side,0,gl.RGBA,gl.UNSIGNED_BYTE,h.raw);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      c.hydro={tex:ht,rect:h.rect};c.hydroReady=true;this.stats.hydroBuilds=(this.stats.hydroBuilds||0)+1;this.stats.hydroMs=(this.stats.hydroMs||0)+performance.now()-start;
    }
    this._activeHydro=c.hydro;''')
change('c.key = key; c.ready = false;','c.key = key; c.ready = false; c.hydroReady=false;',1)
change('bk.key = key; bk.ready = false;','bk.key = key; bk.ready = false; bk.hydroReady=false;')
change('    this._common(u, view, c.width, c.height, zoom);','    this._activeHydro=cache&&cache.hydro;\n    this._common(u, view, c.width, c.height, zoom);')
change("var key = JSON.stringify(FX.terrain || {}) + '|' + (view.quality == null ? 1 : view.quality);","var key = JSON.stringify(FX.terrain || {}) + JSON.stringify(FX.terrainWorld || {}) + '|' + (view.quality == null ? 1 : view.quality) + '|' + seasonKey();",2)
change('  var ZOOM_KEEP = 2;','''  function seasonKey(){var d=G.Game&&G.Game.state&&G.Game.state.date;return d?d.m+':'+(d.d<=G.BALANCE.waterways.floodDays?1:0):'';}
  var ZOOM_KEEP = 2;''')
# 캐시 크기 교체 시 수로 텍스처도 함께 해제한다.
change('gl.deleteTexture(bk.tex); gl.deleteFramebuffer(bk.fbo);','gl.deleteTexture(bk.tex); gl.deleteFramebuffer(bk.fbo); if(bk.hydro)gl.deleteTexture(bk.hydro.tex);',2)
P.write_text(s,encoding='utf-8');print('RENDERER_CONNECTED')
