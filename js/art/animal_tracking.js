/* 동물의 이동 흔적과 2~4색 지도 그림. 저장 상태를 추가하지 않는 연출이다. */
(function(G){
  'use strict';
  var A=G.AnimalTracking={}, cache={}, paths={}, filters={}, nearby=null;
  var slots={cat:0,dog:1,bear:2,split:3,hoof:4,elephant:5,rhino:6,hippo:6,bird:7,ostrich:8,web:9,hand:10,hop:11,lizard:12,frog:13,camel:14,small:15,biped:2,raptor:7};
  function cfg(){return G.FX.animalTracking;}
  A.profile=function(d){return d&&G.ANIMAL_TRACKING[d.id]||null;};
  A.is=function(d){return !!A.profile(d);};
  /** 바다에서는 물결을 우선한다. 바다 위를 나는 새는 깃털, 헤엄치는 펭귄은 물결이다. */
  A.traceKind=function(d,mode){
    var p=A.profile(d);if(!p)return null;
    var how=d.how||p.habitat,penguin=/penguin/.test(d.id),bird=p.kind==='bird'||p.kind==='ostrich'||penguin;
    if(bird&&!(penguin&&(mode==='sea'||how==='sea')))return 'feather';
    if(mode==='sea'||how==='sea'||how==='special'||p.kind==='water')return 'water';
    return p.kind;
  };
  A.radius=function(d,r){return A.is(d)?Math.min(r,G.BALANCE.animalTracking[d.how==='land'?'landRadius':'seaRadius']):r;};
  A.alpha=function(t,id){var c=cfg(),phase=(G.U.strHash(id)>>>0)%1000/1000;return c.alphaMin+(c.alphaMax-c.alphaMin)*(0.5-0.5*Math.cos((t/c.pulseSeconds+phase)*Math.PI*2));};
  function image(key){var im=G.Img.get(key);if(!im)G.Img.want(key);return im;}
  // SVG의 이산 색상표는 원화 명암을 2~4개 색면으로 바꾼다. file://에서도 픽셀을 읽지 않는다.
  function filter(p){
    var id='animal-map-'+p.palette.join('').replace(/#/g,'');if(filters[id])return 'url(#'+id+')';
    var ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),f=document.createElementNS(ns,'filter');
    svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';svg.style.pointerEvents='none';
    f.id=id;f.setAttribute('color-interpolation-filters','sRGB');
    var gray=document.createElementNS(ns,'feColorMatrix');gray.setAttribute('type','saturate');gray.setAttribute('values','0');f.appendChild(gray);
    var transfer=document.createElementNS(ns,'feComponentTransfer');
    ['R','G','B'].forEach(function(ch,i){var n=document.createElementNS(ns,'feFunc'+ch);n.setAttribute('type','discrete');n.setAttribute('tableValues',p.palette.map(function(h){return parseInt(h.slice(1+i*2,3+i*2),16)/255;}).join(' '));transfer.appendChild(n);});
    f.appendChild(transfer);svg.appendChild(f);document.body.appendChild(svg);filters[id]=svg;return 'url(#'+id+')';
  }
  A.sprite=function(d,track){
    if(track&&(A.traceKind(d)==='feather'||A.traceKind(d)==='water'))return null;
    var p=A.profile(d);if(!p)return null;var key=d.id+(track?':track':':animal');if(cache[key])return cache[key];
    var sheet=track||p.slot!=null,im=image(track?'animal-tracking/footprints':sheet?'animal-tracking/animals-'+p.sheet:p.key);if(!im)return null;
    var n=4,slot=track?slots[p.kind]:p.slot;if(track&&slot==null)return null;
    var c=document.createElement('canvas');c.width=c.height=cfg().spritePixels;var x=c.getContext('2d');
    x.filter=filter(p);
    if(sheet){
      var w=im.naturalWidth/n,h=im.naturalHeight/n,bounds=!track&&G.ANIMAL_TRACKING_BOUNDS&&G.ANIMAL_TRACKING_BOUNDS[p.sheet]&&G.ANIMAL_TRACKING_BOUNDS[p.sheet][slot];
      if(bounds){var fit=c.width*0.88/Math.max(bounds[2],bounds[3]),dw=bounds[2]*fit,dh=bounds[3]*fit;x.drawImage(im,bounds[0],bounds[1],bounds[2],bounds[3],(c.width-dw)/2,(c.height-dh)/2,dw,dh);}
      else x.drawImage(im,(slot%n)*w+1,Math.floor(slot/n)*h+1,w-2,h-2,0,0,c.width,c.height);
    }
    else x.drawImage(im,0,0,c.width,c.height);
    x.filter='none';
    if(track){ // 발바닥과 발가락을 두 색으로 나누되 그림자를 짙게 유지한다.
      if(p.kind==='hippo'){
        x.clearRect(0,0,c.width,c.height);x.fillStyle=p.palette[0];
        x.beginPath();x.ellipse(48,62,28,25,0,0,Math.PI*2);x.fill();
        for(var toe=0;toe<4;toe++){x.beginPath();x.ellipse(19+toe*19,30+Math.abs(1.5-toe)*5,8,14,(toe-1.5)*0.15,0,Math.PI*2);x.fill();}
      }
      x.globalCompositeOperation='source-in';x.fillStyle=p.palette[0];x.fillRect(0,0,c.width,c.height);
      x.globalCompositeOperation='source-atop';x.fillStyle=p.palette[1];x.fillRect(0,0,c.width,c.height*0.38);
      x.globalCompositeOperation='source-over';
    }
    cache[key]=c;return c;
  };
  // ---------------------------------------------------------------- 발자국 따라가기 (2026-11-17 사용자 요청 — 게임처럼 따라가는 재미)
  /* · 흔적은 먼 쪽 끝(0번)에서 동물이 있는 곳(마지막)으로 이어진다. 탐험대가 다음 발자국 몇 개(lookAhead) 안의 자국을 밟으면 「읽은 자국」이 늘어난다.
       앞으로 보이는 자국은 읽은 자국 + lookAhead 까지 — 끝까지 다 보이지 않으니 한 걸음씩 따라가야 한다. 다음 자국에는 고리가 깜빡인다.
     · 지도 위 동물 그림: 따라간 만큼(진행 p) 흑백에서 색으로 바뀌고, 투명하게 희미하게 점멸한다. 지도에는 글자를 쓰지 않는다 — 무엇인지는 부하의 말로 짐작한다.
     · 25·50·75%마다 부하가 흔적을 읽어 준다(털·배설물·냄새 — 특기마다). 거의 다 따라오면 짐승이 놀라 한 번 달아날 수 있다(측량이 높으면 덜) — 새 자국이 이어진다.
     · 끝까지 따라와서 찾으면 명성이 더 붙는다 (A.fameK — js/systems/discovery.js). 저장: s.track[id] = {hit, said, bolt, shift} */
    function TS(id){var s=G.Game.state;if(!s)return {hit:-1,said:{}};var T=s.track||(s.track={});return T[id]||(T[id]={hit:-1,said:{}});}
  function TC(){return G.BALANCE.animalTracking.follow||{lookAhead:5,stepR:0.32,stepRSea:0.55,boltAt:0.8,bolt:0.35,boltSurvey:0.09,boltDist:1.1,fame:0.4};}
  A.basePos=function(d){
    if(G.SeaMonsters&&G.SeaMonsters.is(d.id))return G.SeaMonsters.position(d.id);
    var k=d.id+':position';if(paths[k])return paths[k];var pos={lon:d.lon,lat:d.lat};
    // 해안가·도시 가장자리의 기존 좌표는 같은 서식 반경 안의 가까운 뭍에서 만난다.
    if(d.how==='land'&&G.Geo.isLand&&!G.Geo.isLand(pos.lon,pos.lat)){
      outer:for(var r=0.1;r<=Math.min(d.r||1.6,cfg().shoreSearch);r+=0.1)for(var j=0;j<24;j++){
        var lon=G.Geo.wrapLon(d.lon+Math.cos(j*Math.PI/12)*r),lat=d.lat+Math.sin(j*Math.PI/12)*r;
        if(G.Geo.isLand(lon,lat)){pos={lon:lon,lat:lat};break outer;}
      }
    }
    paths[k]=pos;return pos;
  };
  /** 지금 동물이 있는 곳 — 놀라 달아났으면 그만큼 옮겨 간 자리 */
  A.position=function(d){
    var b=A.basePos(d),st=G.Game.state&&G.Game.state.track&&G.Game.state.track[d.id];
    return st&&st.shift?{lon:G.Geo.wrapLon(b.lon+st.shift[0]),lat:b.lat+st.shift[1]}:b;
  };
  A.visible=function(mode,lon,lat){
    var c=cfg(),now=performance.now(),state=G.Game.state;
    if(nearby&&nearby.state===state&&nearby.mode===mode&&now-nearby.at<250&&G.Geo.dist(lon,lat,nearby.lon,nearby.lat)<0.1)return nearby.rows.filter(function(d){return !G.Disc.foundByMe(d.id);});
    var list=G.DISCOVERIES.filter(function(d){
      if(!A.is(d)||(mode==='land'?d.how!=='land':d.how!=='sea'&&d.how!=='special'))return false;
      if(G.Disc.foundByMe(d.id)||!G.Disc.built(d)||!G.Disc.opened(d)||!G.Disc.needMet(d))return false;
      if(G.SeaMonsters&&G.SeaMonsters.is(d.id))return false; // 실제 이동하는 괴물은 기존 출몰 좌표·그림을 쓴다.
      var pos=A.position(d);return G.Geo.dist(lon,lat,pos.lon,pos.lat)<c.senseRadius+(TS(d.id).shift?TC().boltDist:0);
    }).sort(function(a,b){var ap=A.position(a),bp=A.position(b);return G.Geo.dist(lon,lat,ap.lon,ap.lat)-G.Geo.dist(lon,lat,bp.lon,bp.lat);}).slice(0,c.maxNearby);
    nearby={state:state,mode:mode,at:now,lon:lon,lat:lat,rows:list};return list;
  };
  /** 흔적: 먼 끝(0) → 처음 있던 자리 → (달아났으면) 옮겨 간 자리 */
  A.trail=function(d){
    var pos=A.basePos(d);if(!pos)return [];var st=TS(d.id),sh=st.shift;
    var k=d.id+':trail:'+pos.lon.toFixed(2)+':'+pos.lat.toFixed(2)+(sh?':'+sh[0].toFixed(2)+':'+sh[1].toFixed(2):'');if(paths[k])return paths[k];var c=cfg(),rng=G.U.makeRng(G.U.strHash(d.id)),angle=rng()*Math.PI*2,pts=[];
    for(var i=0;i<=c.steps;i++){
      var f=i/c.steps,dist=c.trailLength*(1-f),a=angle+Math.sin(f*Math.PI*2)*c.curve;
      var lon=G.Geo.wrapLon(pos.lon+Math.cos(a)*dist),lat=pos.lat+Math.sin(a)*dist;
      pts.push({lon:lon,lat:lat,ground:d.how!=='land'||!G.Geo.isLand||G.Geo.isLand(lon,lat)});
    }
    if(sh){ // 놀라 달아난 길: 앞의 흔적 끝에서 새 자리까지 구불구불 이어진다
      var n=Math.max(4,Math.round(Math.hypot(sh[0],sh[1])/(c.trailLength/c.steps))),rn=G.U.makeRng(G.U.strHash(d.id+':bolt'));
      for(var j=1;j<=n;j++){var g=j/n,w=Math.sin(g*Math.PI)*0.18*(rn()-0.5)*2;var lo=G.Geo.wrapLon(pos.lon+sh[0]*g-sh[1]*w),la=pos.lat+sh[1]*g+sh[0]*w;
        pts.push({lon:lo,lat:la,ground:d.how!=='land'||!G.Geo.isLand||G.Geo.isLand(lo,la),fresh:true});}
    }
    return(paths[k]=pts);
  };
  /** 따라간 정도 0~1 */
  A.progress=function(d){var st=TS(d.id),n=A.trail(d).length;return n>1?Math.max(0,(st.hit+1)/n):0;};
  var KIND_NAME={cat:'큰 고양이',dog:'개 무리',bear:'곰',split:'굽 갈라진 짐승',hoof:'말굽 짐승',elephant:'코끼리',rhino:'뿔 달린 짐승',hippo:'물가의 큰 짐승',bird:'새',ostrich:'큰 발의 새',web:'물갈퀴 새',hand:'손으로 걷는 짐승',hop:'뛰어다니는 짐승',lizard:'도마뱀',frog:'개구리',camel:'낙타',small:'작은 짐승',biped:'두 발로 걷는 것',raptor:'사나운 새',snake:'뱀',insect:'벌레',water:'물속의 짐승',flutter:'나비·나방'};
  A.kindName=function(d){var p=A.profile(d);return p&&KIND_NAME[p.kind]||'짐승';};
  var CLUE={25:[['survey','제독, 자국이 아직 무르지 않았습니다. 하루도 안 된 자국입니다.'],['ops','자국 간격이 일정합니다. 서두르지 않고 걷고 있습니다. 따라잡을 수 있겠습니다.']],
    50:[['sci','덤불에 걸린 털을 찾았습니다. {kind} 털 같습니다.'],['cook','배설물이 아직 따뜻합니다… 냄새로 보아 {kind}입니다. 먹이도 짐작이 갑니다.'],['survey','이 발자국 모양이면 {kind}입니다. 앞발이 뒷발보다 깊게 박혔습니다.']],
    75:[['ops','바람이 우리 쪽에서 불면 냄새를 맡고 달아납니다. 바람을 안고 조용히 가시지요.'],['music','쉿… 저 앞에서 무언가 숨 쉬는 소리가 들립니다.'],['survey','자국이 겹쳐 있습니다. 이 근처를 맴돌았습니다. 거의 다 왔습니다!']]};
  function say(t,d){var sp=G.Scenes&&G.Scenes.mateSpeaker?G.Scenes.mateSpeaker('surveyor'):null;G.UI.toast((sp&&sp.name?sp.name+': ':'')+t.replace(/\{kind\}/g,A.kindName(d)),'paw',5200);}
  function clue(d,step){
    var trace=A.traceKind(d);
    if(trace==='feather'){say(step===25?'제독, 깃털이 하늘에서 흔들리며 내려옵니다. 이쪽으로 날아간 모양입니다.':step===50?'깃털의 빛깔을 보니 {kind} 같습니다. 흩날리는 깃털을 따라가 봅시다.':'쉿… 가까운 곳에서 날개 치는 소리가 들립니다.',d);return;}
    if(trace==='water'){say(step===25?'거품과 물결이 이어집니다. 무언가 이쪽으로 헤엄쳐 갔습니다.':step===50?'물보라 아래로 {kind}의 그림자가 스칩니다. 물결이 퍼지는 쪽을 살펴보십시오.':'제독, 바로 앞 수면이 들썩입니다. 거의 다 왔습니다!',d);return;}
    var L=CLUE[step];if(!L)return;var R=G.R,best=L[0],bv=-1;
    L.forEach(function(x){var v=(R&&R.skill?R.skill(x[0]):0)+Math.random()*0.5;if(v>bv){bv=v;best=x;}});say(best[1],d);
  }
  /** 탐험대가 발자국을 밟았는지 — 앞 lookAhead 개 안에서 가장 먼 자국까지 읽는다 */
  A.follow=function(d,lon,lat,mode){
    var s=G.Game.state;if(!s||G.Disc.foundByMe(d.id))return;
    var st=TS(d.id),pts=A.trail(d),F=TC(),r=mode==='land'?F.stepR:F.stepRSea,hi=st.hit,seen=0;
    // 갈 수 없는 자국(뭍길의 물 위 깃털 · 뱃길의 뭍 위 물결)은 세지 않고 건너뛴다 — 그 너머의 자국을 밟으면 함께 읽힌다
    for(var i=Math.max(0,st.hit+1);i<pts.length&&seen<F.lookAhead;i++){
      var land=G.Geo.isLand?G.Geo.isLand(pts[i].lon,pts[i].lat):true,reach=mode==='land'?land:!land;
      if(!reach)continue;seen++;
      if(G.Geo.dist(lon,lat,pts[i].lon,pts[i].lat)<r)hi=i;
    }
    if(hi===st.hit)return;
    var first=st.hit<0;st.hit=hi;var p=(hi+1)/pts.length;
    if(first){var trace=A.traceKind(d,mode);G.UI.toast(trace==='feather'?'깃털이 흩날린다 — 떨어지는 깃털을 따라가 보자.':trace==='water'?'수면에 거품이 인다 — 물결과 물보라를 따라가 보자.':'발자국을 찾았다 — 자국을 따라가 보자.',trace==='water'?'anchor':trace==='feather'?'feather':'paw',4200);}
    [25,50,75].forEach(function(m){if(p*100>=m&&!st.said[m]){st.said[m]=1;clue(d,m);}});
    // 거의 다 왔을 때 짐승이 놀라 한 번 달아난다 (뭍에서만 · 측량이 높을수록 덜)
    if(mode==='land'&&!st.bolt&&p>=F.boltAt){
      st.bolt=1;var R=G.R,ch=Math.max(0.05,F.bolt-(R&&R.skill?R.skill('survey'):0)*F.boltSurvey);
      if(Math.random()<ch){
        var b=A.basePos(d),a0=Math.atan2(b.lat-pts[0].lat,G.Geo.wrapLon(b.lon-pts[0].lon)),best=null;
        for(var t=0;t<8&&!best;t++){var a=a0+(t%2?1:-1)*Math.ceil(t/2)*0.5,x=G.Geo.wrapLon(b.lon+Math.cos(a)*F.boltDist),y=b.lat+Math.sin(a)*F.boltDist;if(!G.Geo.isLand||G.Geo.isLand(x,y))best=[Math.cos(a)*F.boltDist,Math.sin(a)*F.boltDist];}
        if(best){st.shift=best;nearby=null;var bird=A.traceKind(d)==='feather';G.UI.toast(bird?'날개를 퍼덕이며 멀어졌다 — 새 깃털이 흩날린다.':'덤불이 크게 흔들렸다 — '+A.kindName(d)+U2(A.kindName(d))+' 놀라 달아났다! 새 자국이 이어진다.',bird?'feather':'paw',5600);if(!bird&&G.Audio&&G.Audio.sfx)G.Audio.sfx('growl');}
      }
    }
  };
  function U2(w){return G.U&&G.U.jx?G.U.jx(w,'이/가'):'이';}
  /** 끝까지 따라와 찾았을 때 명성 배율 (js/systems/discovery.js) */
  A.fameK=function(d){return A.is(d)?1+TC().fame*Math.min(1,A.progress(d)):1;};
  /** 흑백 그림: 색 그림을 회색으로 */
  A.graySprite=function(d){
    var key=d.id+':gray';if(cache[key])return cache[key];var im=A.sprite(d,false);if(!im)return null;
    var c=document.createElement('canvas');c.width=im.width;c.height=im.height;var x=c.getContext('2d');
    x.filter='grayscale(1) contrast(1.1) brightness(1.05)';x.drawImage(im,0,0);x.filter='none';return(cache[key]=c);
  };
  /** 깃털은 종별 두 색의 깃판과 깃대로 그려 흔들리며 내려오게 한다. */
  function feather(ctx,p,i,t){
    var f=cfg().airborne,phase=((t||0)/f.cycle+i*0.271)%1,fade=Math.sin(Math.PI*phase);
    // 내려앉을 자리의 옅은 그림자 — 숲처럼 어두운 땅에서도 깃털 길이 보이게 (내려올수록 짙어진다)
    ctx.save();ctx.globalAlpha*=0.18+0.3*phase;ctx.fillStyle='#fff6dc';ctx.beginPath();ctx.ellipse(0,2,f.size*0.55,f.size*0.22,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.globalAlpha*=0.3+0.7*fade;ctx.translate(Math.sin(phase*Math.PI*2+i)*f.sway,-(1-phase)*f.height);
    ctx.rotate(Math.sin(phase*Math.PI*2+i)*f.turn+i*0.37);ctx.scale(f.size/20,f.size/20);
    ctx.fillStyle=p.palette[p.palette.length-1];ctx.beginPath();ctx.moveTo(0,10);ctx.bezierCurveTo(-11,3,-9,-8,1,-11);ctx.bezierCurveTo(8,-6,8,3,0,10);ctx.fill();
    ctx.fillStyle=p.palette[Math.min(1,p.palette.length-1)];ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-6,1,-5,-7,1,-11);ctx.lineTo(0,8);ctx.fill();
    ctx.strokeStyle=p.palette[0];ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(-1,13);ctx.quadraticCurveTo(1,2,1,-9);ctx.stroke();
    for(var j=0;j<3;j++){ctx.beginPath();ctx.moveTo(0,5-j*4);ctx.lineTo(4,1-j*4);ctx.stroke();}
  }
  /** 발자국 대신 수면의 고리·흰 거품·튀어 오르는 물방울을 조합한다. */
  function water(ctx,p,i,t){
    var f=cfg().aquatic,phase=((t||0)/f.cycle+i*0.193)%1,spread=0.65+phase*f.spread,s=f.size;
    ctx.globalAlpha*=1-phase*0.75;ctx.lineWidth=1.25;ctx.strokeStyle=f.mid;
    ctx.beginPath();ctx.ellipse(0,0,s*spread,s*0.3*spread,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=f.light;ctx.beginPath();ctx.ellipse(0,2,s*0.6*spread,s*0.17*spread,0,Math.PI*0.12,Math.PI*0.9);ctx.stroke();
    for(var b=0;b<3;b++){
      var x=(b-1)*s*0.44+Math.sin(i+b)*2,y=Math.sin(i+b*2)*3;
      ctx.fillStyle=f.light;ctx.beginPath();ctx.arc(x,y,1.5+(1-phase)*1.4,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=f.dark;ctx.lineWidth=0.6;ctx.stroke();
    }
    if(i%3===0){
      ctx.strokeStyle=f.light;ctx.lineWidth=1.5;
      for(var k=-1;k<=1;k++){
        ctx.beginPath();ctx.moveTo(k*3,0);ctx.quadraticCurveTo(k*s*0.35,-f.rise*(1-phase),k*s*0.65,-f.rise*(1-phase)*0.5);ctx.stroke();
        ctx.fillStyle=f.mid;ctx.beginPath();ctx.ellipse(k*s*0.65,-f.rise*(1-phase)*0.5-2,1.5,2.5,k*0.4,0,Math.PI*2);ctx.fill();
      }
    }
  }
  function marks(ctx,d,pts,toScreen,t,from,to,hit,mode){
    var p=A.profile(d),c=cfg(),trace=A.traceKind(d,mode),im=trace==='feather'||trace==='water'?null:A.sprite(d,true),kind=p.kind;from=from||0;to=to==null?pts.length-1:to;
    ctx.save();ctx.strokeStyle=p.palette[0];ctx.fillStyle=p.palette[1];ctx.lineWidth=c.traceWidth;ctx.lineCap='round';
    for(var i=from;i<Math.min(to+1,pts.length-1);i++){
      var q=pts[i],next=pts[i+1];if(trace!=='feather'&&trace!=='water'&&(!q.ground||!next.ground))continue;
      if(trace==='water'&&(mode==='sea'||d.how==='sea'||p.habitat==='sea')&&G.Geo&&G.Geo.isLand&&(G.Geo.isLand(q.lon,q.lat)||G.Geo.isLand(next.lon,next.lat)))continue;
      var a=toScreen(q.lon,q.lat),b=toScreen(next.lon,next.lat),h=Math.atan2(b[1]-a[1],b[0]-a[0]);
      // 읽은 자국은 옅게, 앞으로 볼 자국은 진하게 · 가장 앞의 자국은 흐려지며 끝난다
      var ahead=hit==null?1:i>hit?1-Math.max(0,(i-hit-1))/(TC().lookAhead+1):0.4,follow=hit!=null;
      // 따라가기: 앞으로 볼 자국은 크고 진하게, 밑에 옅은 빛 자국을 깔아 땅 무늬와 섞이지 않게 한다
      if(follow&&i>hit&&trace!=='water'&&trace!=='feather'){ctx.save();ctx.globalAlpha=0.22*ahead;ctx.fillStyle='#fff4d6';ctx.beginPath();ctx.ellipse(a[0],a[1],(c.followFoot||18)*0.9,(c.followFoot||18)*0.6,h,0,Math.PI*2);ctx.fill();ctx.restore();}
      ctx.globalAlpha=(follow?(i>hit?0.92:0.5):c.trackAlpha*(0.55+0.45*i/pts.length))*ahead;ctx.save();ctx.translate(a[0],a[1]);if(trace!=='feather'&&trace!=='water')ctx.rotate(h+Math.PI/2);
      if(trace==='feather')feather(ctx,p,i,t);
      else if(trace==='water')water(ctx,p,i,t);
      else if(im){
        var two=/bird|ostrich|web|biped|raptor/.test(kind),hop=/hop|frog|small/.test(kind),s=follow?(c.followFoot||18):c.footSize,tw=follow?s/c.footSize:1;
        function stamp(x,y,scale,flip){ctx.save();ctx.translate(x,y);ctx.scale(flip?-1:1,1);ctx.drawImage(im,-s*scale/2,-s*scale/2,s*scale,s*scale);ctx.restore();}
        if(two)stamp(i%2?c.trackWidth*tw:-c.trackWidth*tw,0,1,i%2===0);
        else if(hop){stamp(-c.trackWidth*tw,-c.hopGap*tw,1.15,false);stamp(c.trackWidth*tw,-c.hopGap*tw,1.15,true);stamp(-c.trackWidth*0.5*tw,c.hopGap*tw,0.65,false);stamp(c.trackWidth*0.5*tw,c.hopGap*tw,0.65,true);}
        else{var side=i%2?1:-1;stamp(side*c.trackWidth*tw,-c.frontGap*tw,1,false);stamp(-side*c.trackWidth*tw,c.frontGap*tw,0.8,true);}
      }else if(kind==='snake'){
        ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(c.waveWidth,-3,-c.waveWidth,-7,0,-Math.hypot(b[0]-a[0],b[1]-a[1]));ctx.stroke();
      }else if(kind==='insect'){
        [-1,1].forEach(function(side){for(var n=0;n<3;n++){ctx.beginPath();ctx.moveTo(side*2,n*3);ctx.lineTo(side*5,n*3-2);ctx.stroke();}});
      }else{
        ctx.beginPath();ctx.ellipse(0,0,c.waveWidth,kind==='water'?3:5,0,Math.PI*0.1,Math.PI*0.9);ctx.stroke();
        ctx.beginPath();ctx.ellipse(0,3,c.waveWidth*0.65,2,0,Math.PI*0.1,Math.PI*0.9);ctx.stroke();
      }
      ctx.restore();
    }
    // 다음에 밟을 자국: 깜빡이는 고리
    var nx=hit==null?-1:hit+1;
    if(nx>=0&&nx<pts.length&&nx<=to){var np=toScreen(pts[nx].lon,pts[nx].lat),k=0.5+0.5*Math.sin(t*5);
      ctx.globalAlpha=0.35+0.45*k;ctx.strokeStyle='#fff2c8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(np[0],np[1],7+k*4,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  A.drawTrail=marks;
  A.draw=function(ctx,toScreen,mode,lon,lat,t){
    var c=cfg();if(c.enabled===false)return;
    A.visible(mode,lon,lat).forEach(function(d){
      A.follow(d,lon,lat,mode);
      A.drawOne(ctx,toScreen,d,lon,lat,t,mode);
    });
  };
  A.drawOne=function(ctx,toScreen,d,lon,lat,t,mode){
    var c=cfg(),pos=A.position(d);if(!pos||c.enabled===false)return;
    var st=TS(d.id),pts=A.trail(d),F=TC(),q=toScreen(pos.lon,pos.lat),distance=G.Geo.dist(lon,lat,pos.lon,pos.lat);
    // 아직 못 찾았으면 먼 끝의 자국 몇 개만 · 찾았으면 읽은 자국 + 앞의 몇 개
    var to=st.hit<0?F.lookAhead:Math.min(pts.length-1,st.hit+F.lookAhead);
    marks(ctx,d,pts,toScreen,t,0,to,st.hit<0?-1:st.hit,mode);
    var p=A.progress(d),show=(st.hit>=0&&p>0)||distance<=c.silhouetteRadius;if(!show)return;
    var col=A.sprite(d,false),gray=A.graySprite(d);if(!col)return;
    // 흑백에서 색으로: 따라간 만큼 색이 올라오고, 투명하게 희미하게 점멸한다
    // 점멸: 투명하게 희미한 빛이 숨 쉬듯 (따라갈수록 또렷해진다) · 크기도 조금씩 커진다
    var mix=Math.max(0,Math.min(1,p*1.15-0.05)),wave=0.5-0.5*Math.cos((t/(c.pulseSeconds||3.6)+((G.U.strHash(d.id)>>>0)%1000)/1000)*Math.PI*2);
    var pulse=(0.3+0.4*Math.min(1,p+(distance<=c.silhouetteRadius?0.25:0)))*(0.55+0.45*wave),vis=1,size=(c.followAnimal||84)*(0.85+0.35*p);
    ctx.save();ctx.imageSmoothingEnabled=true;
    // 투명한 그림이 바다·숲 빛깔에 묻히지 않게 뒤에 옅은 빛무리를 깐다 (함께 점멸)
    var halo=ctx.createRadialGradient(q[0],q[1],size*0.1,q[0],q[1],size*0.62);halo.addColorStop(0,'rgba(255,248,226,'+((mode==='sea'?0.75:0.5)*pulse).toFixed(3)+')');halo.addColorStop(0.55,'rgba(255,248,226,'+((mode==='sea'?0.3:0.18)*pulse).toFixed(3)+')');halo.addColorStop(1,'rgba(255,248,226,0)');
    ctx.globalAlpha=1;ctx.fillStyle=halo;ctx.beginPath();ctx.arc(q[0],q[1],size*0.62,0,Math.PI*2);ctx.fill();
    if(gray&&mix<1){ctx.globalAlpha=pulse*vis*(1-mix);ctx.drawImage(gray,q[0]-size/2,q[1]-size/2,size,size);}
    if(mix>0){ctx.globalAlpha=pulse*vis*mix;ctx.drawImage(col,q[0]-size/2,q[1]-size/2,size,size);}
    // 지도 위에는 글자를 쓰지 않는다 (2026-11-17 사용자 요청) — 무엇인지는 부하의 말(25·50·75%)로만 짐작한다
    // 따라간 정도: 작은 고리 게이지
    if(st.hit>=0){ctx.globalAlpha=0.8;ctx.strokeStyle='rgba(20,14,8,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q[0],q[1]-size/2-6,6,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#f0c060';ctx.beginPath();ctx.arc(q[0],q[1]-size/2-6,6,-Math.PI/2,-Math.PI/2+Math.PI*2*p);ctx.stroke();}
    ctx.restore();
  };
})(window.G=window.G||{});
