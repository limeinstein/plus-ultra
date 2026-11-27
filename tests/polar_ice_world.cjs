/* 유빙의 화면 경계와 항해 판정을 실제 게임에서 비교한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname,'..');
const out = process.env.OUT || path.join(root,'artifacts/polar-ice-navigation-20261127');

function shaderFunction(source,name){
  const start = source.search(new RegExp(`^\\w+ ${name}\\(`,'m'));
  if(start<0)throw Error(name);
  let i = source.indexOf('{',start), depth = 1;
  while(depth){
    const ch = source[++i];
    if(ch==null)throw Error(name);
    if(ch==='{')depth++;
    if(ch==='}')depth--;
  }
  return source.slice(start,i+1);
}

(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser = await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
  try{
    const p = await browser.newPage({viewport:{width:1280,height:720}}), errors=[];
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await p.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    await p.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
    await p.evaluate(()=>G.Game.ensureGeo());
    const sea = fs.readFileSync(path.join(root,'js/scenes/sea.js'),'utf8');
    await p.addScriptTag({content:sea.replace('    render(dt);','    if(!window.__skipIceRender)render(dt);')});
    const shader = fs.readFileSync(path.join(root,'js/world/renderer.js'),'utf8');
    const funcs = ['hashu','hash','vnoise','voro','packIceField'].map(name=>shaderFunction(shader,name)).join('\n');
    const glCheck = await p.evaluate(funcs=>{
      const canvas=document.createElement('canvas'), cols=80;
      canvas.width=cols;canvas.height=1;
      const gl=canvas.getContext('webgl2');
      const compile=(type,source)=>{
        const s=gl.createShader(type);
        gl.shaderSource(s,source);gl.compileShader(s);
        if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
        return s;
      };
      const prog=gl.createProgram();
      gl.attachShader(prog,compile(gl.VERTEX_SHADER,'#version 300 es\nvoid main(){gl_Position=vec4(4.0*float(gl_VertexID==1)-1.0,4.0*float(gl_VertexID==2)-1.0,0,1);}'));
      gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,`#version 300 es
        precision highp float;precision highp int;
        uniform vec4 uPackIce;uniform vec3 positions[${cols}];const int uNeighborRadius=1;out vec4 color;
        ${funcs}
        void main(){vec3 xy=positions[int(gl_FragCoord.x)];float f=packIceField(xy.xy,xy.xy+vec2(180,90),xy.z);color=vec4(step(0.0,f),0,0,1);}`));
      gl.linkProgram(prog);
      if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const cfg=G.FX.water.packIce;
      gl.uniform4f(gl.getUniformLocation(prog,'uPackIce'),cfg.scale,cfg.gap,cfg.fill,cfg.latitude);
      const values=[];
      for(let i=0;i<cols;i++){
        const center=i<40?[18,81]:[160,-69], x=center[0]+((i%10)-4.5)*.31,y=center[1]+((Math.floor(i/10)%4)-1.5)*.37;
        values.push([x,y,G.Geo.climate(x,y).ice]);
      }
      gl.uniform3fv(gl.getUniformLocation(prog,'positions[0]'),values.flat());
      gl.drawArrays(gl.TRIANGLES,0,3);
      const colors=new Uint8Array(cols*4);
      gl.readPixels(0,0,cols,1,gl.RGBA,gl.UNSIGNED_BYTE,colors);
      const mismatches=values.flatMap(([x,y],i)=>((G.Geo.packIceField(x,y)>0)!==(colors[i*4]!==0))?[[x,y]]:[]);
      return {samples:cols,ice:values.filter(([x,y])=>G.Geo.packIceField(x,y)>0).length,mismatches};
    },funcs);
    assert(glCheck.ice>0&&glCheck.ice<glCheck.samples);
    assert.deepEqual(glCheck.mismatches,[]);
    const rows=[];
    for(const [id,x,y] of [['arctic',10,82],['antarctic',160,-67.6]]){
      const row = await p.evaluate(async({x,y})=>{
        const geo=G.Geo, nav=G.Nav, hydro=G.Hydro;
        const area=[];
        for(let dy=-6;dy<=6;dy++)for(let dx=-7;dx<=7;dx++)area.push([x+dx*.17,y+dy*.17]);
        const floe=area.find(q=>geo.sdf(...q)<-1&&geo.packIceField(...q)>.05&&!geo.berg(...q));
        if(!floe)throw Error('시험할 유빙을 찾을 수 없습니다.');
        const water=nav.nearestSea(...floe,6);
        const state=G.Game.state=G.State.newGame({name:'유빙 항해 검사',nation:'PT',job:'explorer',age:22,
          birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
        state.flags.prologue=true;state.settings.res=.65;state.settings.sound=0;state.settings.music=0;
        state.fleet.ships=[G.R.newShip('caravel'),G.R.newShip('caravel')];state.fleet.crew=60;
        state.fleet.food=1200;state.fleet.water=1200;
        G.State.save=()=>{};G.Rain.weather=()=>({cloud:0,storm:0});G.UI.busy=()=>false;G.UI.toast=()=>{};
        state.loc={mode:'sea',lon:floe[0],lat:floe[1],heading:0};
        await G.Game.go('sea',{fresh:true});
        const restored=[state.loc.lon,state.loc.lat];
        const open=area.filter(q=>geo.isSea(...q,.5));
        let route=null, start=null, goal=null;
        pairs:for(const a of open)for(const b of open){
          const length=Math.hypot(a[0]-b[0],a[1]-b[1]);
          if(length<.8||length>1.5||hydro.clear(a,b))continue;
          const p=nav.seaPath(...a,...b,4000);
          if(!p||p.length<3||p.some((q,i)=>i&&!hydro.clear(p[i-1],q)))continue;
          route=p;start=a;goal=b;break pairs;
        }
        if(!route)throw Error('유빙 옆으로 돌아가는 항로를 찾지 못했습니다.');
        Object.assign(state.loc,{lon:start[0],lat:start[1],heading:Math.atan2(route[1][1]-start[1],route[1][0]-start[0])});
        const sea=G.Scenes.sea, st=sea.runtime();
        Object.assign(st.cam,{lon:start[0],lat:start[1],zoom:330,zoomT:0});
        Object.assign(st,{npcs:[],dayAcc:-1e6,rframe:2,t:24});
        sea.setTarget(...goal,null);
        if(!st.path||!st.path.slice(1).every((q,i)=>hydro.clear(st.path[i],q)))throw Error('설정한 항로가 얼음을 지나갑니다.');
        window.__skipIceRender=true;
        let frames=0,safe=true;
        for(;frames<440&&st.path&&!st.paused;frames++){
          sea.update(.03);
          safe=safe&&geo.isSea(state.loc.lon,state.loc.lat,.2);
        }
        window.__skipIceRender=false;
        const travelled=state.stats.distance;
        const reached=Math.hypot(state.loc.lon-goal[0],state.loc.lat-goal[1]);
        // 길을 표시한 항해 장면을 같은 유빙에서 한 번 더 실제로 그린다.
        Object.assign(state.loc,{lon:start[0],lat:start[1],heading:Math.atan2(route[1][1]-start[1],route[1][0]-start[0])});
        Object.assign(st.cam,{lon:start[0],lat:start[1],zoom:330,zoomT:0});
        sea.setTarget(...goal,null);
        Object.assign(st,{paused:true,busy:1,npcs:[],rframe:2});
        G.Game.renderer.invalidate();
        for(let i=0;i<10;i++){st.rframe=2;sea.update(.016);}
        const gl=G.Game.renderer.gl, pixel=new Uint8Array(4);
        gl.readPixels(Math.floor(gl.canvas.width/2),Math.floor(gl.canvas.height/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
        if(pixel[0]+pixel[1]+pixel[2]<20||!st.shipWater?.['fleet:0'])throw Error('항해 화면이 비어 있습니다.');
        return {floe,water,restored,restoredSafe:geo.isSea(...restored,.2),nearestSafe:!!water&&geo.isSea(...water,.2),
          floeBlocked:!hydro.canSail(...floe),route,frames,safe,travelled,reached};
      },{x,y});
      rows.push({id,...row});
      await p.screenshot({path:path.join(out,id+'.png')});
      console.log(JSON.stringify({id,...row}));
    }
    const meta=await p.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'}));
    if(process.env.EXPECT_VERSION)assert.equal(meta.version,process.env.EXPECT_VERSION);
    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({...meta,glCheck,rows,errors},null,2));
    for(const row of rows){
      assert(row.restoredSafe&&row.nearestSafe&&row.floeBlocked,row.id+' 유빙과 물 표시');
      assert(row.safe&&row.travelled>.5&&row.reached<.16,row.id+' 실제 우회 항해');
    }
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
