/* 항해·육상 탐험의 강수 (G.Rain) — 비와 눈의 연출, 피로·규율·이동 속력.
   ■ 비가 오는 날: 하루마다 그 바다의 습도(G.Geo.climate().m) · 적도 무풍대(위도 8° 안) · 우기 계절풍(인도양·남중국해 남서 계절풍) ·
     고위도(45° 너머)로 비가 올 확률이 정해진다. 한 번 오면 1~3일 — 소나기(1)이거나 폭우(2). 폭풍이 치는 날은 늘 폭우.
   ■ 연출: 바다 화면에 바람 쪽으로 기운 빗줄기 · 바다에 떨어지는 빗방울 고리 · 어두운 구름(렌더러 cloud·storm) · 빗소리(G.Audio.rain) ·
     폭풍 속 번개. 비가 오고 그칠 때 서서히 짙어지고 옅어진다. 상태 줄에 「소나기/폭우 · 대책」.
   ■ 피로 (하루마다 sea.js 피로 셈에 더한다 — G.Rain.fatigue()):
     · 더운 바다(위도 25° 안): 소나기는 더위를 식혀 피로가 준다(−0.6), 폭우는 +0.8
     · 온대(25~50°): 소나기 +0.5 · 폭우 +1.4        · 추운 바다(50°부터): 소나기 +1.0 · 폭우 +2.0 (폭우의 규율 벌점도 커진다)
     · 요리 솜씨가 있으면 따뜻한 국물로 젖은 몸의 피로가 준다(더하는 피로 × (1 − 요리 × 0.15)) · 폭풍과 겹치면 비의 몫은 절반
   ■ 비 대책 (제독의 명령 — 처음 비가 올 때 부관이 묻고, 바다 화면의 「비 대책」 단추로 바꾼다):
     · work 갑판 작업 계속 — 속력 그대로(폭우면 ×0.92 — 앞이 안 보인다), 피로는 위 그대로, 빗물은 조금(통에 고인 만큼)
     · rest 교대로 선실에서 쉬게 한다 — 피로 −1.2 (비가 오는 날은 오히려 쉬는 날), 기강 +0.2, 속력 ×0.85 (돛 손질 일손이 준다)
     · catch 돛천을 펴 빗물을 받는다 — 하루 물 사용량의 1.2배(폭우 2.5배)를 받아 물통에 채운다(짐칸이 남는 만큼), 피로 +0.4, 속력 ×0.95
   ■ 저장: state.rain은 항해·해전 강수와 대책, state.landWeather는 육상 강수만 보관한다.
   ■ 조정값: G.BALANCE.rain과 travelWeather, G.FX.snowfall */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var RN = G.Rain = {};
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.rain = G.BALANCE.rain || {
    base: 0.03, wet: 0.13, itcz: 0.08, monsoon: 0.14, high: 0.04,   // 하루에 비가 올 확률 = base + wet×습도 + (적도 itcz) + (우기 monsoon) + (고위도 high)
    heavy: 0.3, days: [1, 3],                                        // 폭우일 확률 · 이어지는 날
    fat: { hot: [-0.6, 0.8], mild: [0.5, 1.4], cold: [1.0, 2.0] },   // [소나기, 폭우] 하루 피로
    restFat: -1.2, catchFat: 0.4, cookCut: 0.15, coldDisc: 0.3, restDisc: 0.2,
    speed: { work: [1, 0.92], rest: [0.85, 0.85], catch: [0.95, 0.95] },
    water: { catch: [1.2, 2.5], work: [0.25, 0.5] }                  // 하루 물 사용량 × [소나기, 폭우]
  };
  function K() { return G.BALANCE.rain; }
  function W() { return G.BALANCE.travelWeather; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); if (!s) return null; return s.rain || (s.rain = { lv: 0, days: 0, order: 'work', asked: false, got: 0, n: 0 }); }
  function record(where) { var s = S(); return where === 'land' ? s && s.landWeather : st(); }
  function levelIndex(r) { return r.lv >= 2 ? 1 : 0; }
  function weatherKind(r) { return r.kind === 'snow' ? 'snow' : 'rain'; }
  function seaOrder(r) { return r.order === 'rest' || r.order === 'catch' && weatherKind(r) === 'rain' ? r.order : 'work'; }
  RN.ORDERS = {
    work: { name: '갑판 작업 계속', short: '작업 계속', icon: 'sail', desc: '속력은 그대로 — 젖은 채 일하니 피로가 쌓인다 (폭우면 앞이 안 보여 조금 느려진다)' },
    rest: { name: '교대로 선실에서 쉬게 한다', short: '교대 휴식', icon: 'bed', desc: '비 오는 날을 쉬는 날로 — 피로가 풀리고 기강이 오른다, 대신 일손이 줄어 느려진다' },
    catch: { name: '돛천을 펴 빗물을 받는다', short: '빗물 받기', icon: 'drop', desc: '물통을 채운다 — 젖은 갑판에서 일하니 피로가 조금 더 쌓인다' }
  };
  RN.level = function (where) { var r = record(where); return r ? r.lv : 0; };
  RN.active = function (where) { return RN.level(where) > 0; };
  RN.snowing = function (where) { var r = record(where); return !!(r && r.lv && weatherKind(r) === 'snow'); };
  RN.raining = function (where) { return RN.active(where) && !RN.snowing(where); };
  RN.name = function (lv, where) {
    lv = lv == null ? RN.level(where) : lv;
    return RN.snowing(where) ? (lv >= 2 ? '폭설' : '눈') : (lv >= 2 ? '폭우' : lv ? '소나기' : '');
  };
  // 항구나 다른 장면에서 보낸 날도 지나간 강수의 기간에 포함한다.
  RN.resume = function (where) {
    var s=S(), r=record(where);
    if(!r||!r.lv||r.day==null||s.day<=r.day)return;
    r.days=Math.max(0,r.days-(s.day-r.day)); r.day=s.day;
    if(!r.days){r.lv=0; delete r.kind; if(where!=='land'){r.got=0; r.today=0;}}
  };
  /** 그 바다의 기온대: hot · mild · cold */
  RN.zone = function (lat) { var a = Math.abs(lat || 0); return a < 25 ? 'hot' : a < 50 ? 'mild' : 'cold'; };
  /** 오늘 비가 올 확률 */
  RN.chance = function (lon, lat, date) {
    var k = K(), cl = G.Geo && G.Geo.climate ? G.Geo.climate(lon, lat) : { m: 0.5 }, p = k.base + k.wet * (cl.m || 0);
    if (Math.abs(lat) < 8) p += k.itcz;                                 // 적도 무풍대: 날마다 소나기
    if (Math.abs(lat) > 45) p += k.high;                                // 고위도의 잦은 비
    var M = G.Monsoon, z = M && M.at ? M.at(lon, lat) : null;
    if (z && date && M.phase(z, date) === 'sw') p += k.monsoon;          // 남서 계절풍 = 우기
    return U.clamp(p, 0, 0.6);
  };
  function kindAt(s, terr) {
    if (terr === 'snow' || terr === 'ice' || terr === 'frozenriver') return 'snow';
    var l = s.loc, cfg = W().snow, lat = Math.abs(l.lat), cl = G.Geo.climate(l.lon, l.lat);
    var m = l.lat < 0 ? (s.date.m + 5) % 12 + 1 : s.date.m;
    if (lat >= cfg.polarLatitude && (cl.t <= cfg.coldTemperature || cl.ice >= cfg.iceCover)) return 'snow';
    return lat >= cfg.winterLatitude && (m === 12 || m <= 2) && cl.t <= cfg.winterTemperature ? 'snow' : 'rain';
  }
  function start(r,s,terr){
    var k=K();
    r.kind=kindAt(s,terr);
    r.lv=U.chance(k.heavy)?2:1;
    r.days=U.ri(k.days[0],k.days[1]);
  }
  function startText(where){var name=RN.name(null,where);return name+U.jx(name,'이/가')+' 시작됐다.';}

  // ================================================================ 하루 (js/scenes/sea.js 날 바뀜 — 날씨 다음)
  /** o: {storm: 폭풍 중인가}. 반환: 오늘 새로 비가 시작했으면 true (부관이 대책을 묻는다 — RN.ask) */
  RN.daily = function (msgs, o) {
    var r = st(), s = S(); if (!r || !s || !s.loc) return false;
    var l = s.loc, k = K(), began = false, ended = false;
    r.day=s.day;
    o = o || {};
    if (r.lv > 0) {
      if(weatherKind(r)==='rain')r.n = (r.n || 0) + 1;
      // 빗물: 대책에 따라 물통에 채운다
      var wk = weatherKind(r) === 'rain' ? (k.water[seaOrder(r)] || k.water.work)[levelIndex(r)] || 0 : 0;
      r.today = 0;
      if (wk > 0) {
        var want = Math.round(R.dailyUse() * wk), q = Math.min(want, Math.max(0, Math.floor(R.free())));   // 짐칸이 남는 만큼
        if (q > 0) { s.fleet.water += q; r.got = (r.got || 0) + q; r.today = q; if (r.order === 'catch' && msgs) msgs.push({ icon: 'drop', text: '돛천에 받은 빗물로 물 ' + U.num(q) + '통을 채웠다.' }); }
        else r.today = 0;
      }
      if (--r.days <= 0 && !o.storm) {
        var snow = weatherKind(r) === 'snow';
        r.lv = 0; r.days = 0;
        ended = true;   // 같은 날 바로 새 비를 다시 뽑아 「그쳤다→시작」이 한꺼번에 나오지 않게 한다
        if (msgs) msgs.push({ icon: 'sun', text: snow ? '눈이 그쳤다. 갑판에 쌓인 눈을 털어 낸다.' : '비가 그쳤다. 젖은 돛과 옷을 말린다.' + (r.got ? ' (이번 비에 받은 빗물 ' + U.num(r.got) + '통)' : '') });
        r.got = 0;
      }
    }
    if (o.storm) { began = !r.lv; r.kind = kindAt(s); r.lv = 2; r.days = Math.max(r.days, 1); return began; }
    if (!ended && r.lv === 0 && U.chance(RN.chance(l.lon, l.lat, s.date))) {
      start(r,s); r.got = 0; began = true;
      if (msgs) msgs.push({ icon: 'drop', text: startText() + ' ' + RN.ORDERS[seaOrder(r)].short + RN.effectNote() });
    }
    if (!r.lv) delete r.kind;
    return began;
  };
  var clearEffect = {speed:1, fatigue:0, discipline:0};
  RN.landEffect = function () {
    var r=record('land');
    if(!r || !r.lv)return clearEffect;
    var cfg=W()[weatherKind(r)].land, i=levelIndex(r);
    return {speed:cfg.speed[i], fatigue:cfg.fatigue[i], discipline:-cfg.discipline[i]};
  };
  RN.landDay = function (msgs,terr,sheltered) {
    var s=S(), l=s.loc, f=s.fleet, r=s.landWeather || (s.landWeather={lv:0, days:0});
    r.day=s.day;
    if(r.lv){
      var e=RN.landEffect(), factor=sheltered?W().campShelter:1;
      f.fatigue=U.clamp(f.fatigue+e.fatigue*factor,0,100);
      f.discipline=U.clamp((f.discipline == null ? 80 : f.discipline)+e.discipline*factor,0,100);
      if(--r.days>0)return;
      if(msgs)msgs.push({icon:'sun',text:RN.snowing('land')?'눈이 그쳤다.':'비가 그쳤다.'});
      r.lv=0; r.days=0; delete r.kind;
      return;
    }
    if(U.chance(RN.chance(l.lon,l.lat,s.date)*W().landChance)){
      start(r,s,terr);
      if(msgs)msgs.push({icon:'drop',text:startText('land')+RN.effectNote(null,'land')});
    }
  };
  /** 오늘의 피로 변화 (sea.js 피로 셈에 더한다) */
  RN.fatigue = function (storm) {
    var r = st(), s = S(); if (!r || !r.lv || !s || !s.loc) return 0;
    var k = K(), z = RN.zone(s.loc.lat), order = seaOrder(r), i=levelIndex(r);
    var f = weatherKind(r)==='snow' ? W().snow.sea.fatigue[i] : (k.fat[z] || k.fat.mild)[i];
    if (f > 0) f *= Math.max(0.4, 1 - R.skillRead('cook') * k.cookCut);   // 따뜻한 국물
    if (order === 'rest') f += k.restFat;
    else if (order === 'catch') f += k.catchFat;
    if (storm) f *= 0.5;
    return f;
  };
  /** 오늘의 기강 변화 */
  RN.discipline = function () {
    var r = st(), s = S(); if (!r || !r.lv || !s || !s.loc) return 0;
    var k = K();
    if (seaOrder(r) === 'rest') return k.restDisc;
    if (weatherKind(r) === 'snow') return -W().snow.sea.discipline[levelIndex(r)];
    return r.lv >= 2 ? -W().seaHeavyRainDiscipline - (RN.zone(s.loc.lat) === 'cold' ? k.coldDisc : 0) : 0;
  };
  /** 속력 배수 */
  RN.speedK = function () {
    var r=st(); if(!r||!r.lv)return 1;
    var order=seaOrder(r), snow=W().snow.sea;
    return (weatherKind(r)==='snow'?(order==='rest'?snow.rest:snow.speed):K().speed[order])[levelIndex(r)];
  };
  /** 대책에 따른 하루 효과 요약 (알림·고르는 창) */
  function effectText(f,d,sp) {
    return ' (하루 피로 ' + (f > 0 ? '+' : '') + f.toFixed(1) + ' · 규율 ' + (d > 0 ? '+' : '') + d.toFixed(2) + ' · 속력 ×' + sp.toFixed(2) + ')';
  }
  RN.effectNote = function (order,where) {
    if(where==='land'){var e=RN.landEffect();return effectText(e.fatigue,e.discipline,e.speed);}
    var r = st(), s = S(); if (!r || !s || !s.loc) return '';
    var keep = r.order; if (order) r.order = order;
    var lv0 = r.lv; if (!r.lv) r.lv = 1;
    var f = RN.fatigue(false), d=RN.discipline(), sp = RN.speedK(); r.order = keep; r.lv = lv0;
    return effectText(f,d,sp);
  };
  /** 비 대책을 고른다 (부관이 묻는다) — first: 처음 비가 왔을 때의 설명 */
  RN.ask = async function (first) {
    var r = st(); if (!r) return null;
    var who = G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    var z = RN.zone(S().loc.lat), snow=RN.snowing(), title=snow?'눈 대책':'비 대책';
    if (first) await UI.say(snow?'제독, 눈발에 앞이 가려집니다. 눈이 쌓이는 동안 갑판 작업을 계속할까요?':'제독, ' + (r.lv >= 2 ? '폭우' : '비') + '가 쏟아집니다. ' + (z === 'hot' ? '더운 바다라 소나기는 오히려 더위를 식혀 주지만, 폭우는 사람을 지치게 합니다.' : z === 'cold' ? '이 추운 바다의 비는 뼛속까지 스며듭니다. 젖은 채 일하면 금방 지치고 기강도 흐트러집니다.' : '젖은 옷으로 밧줄을 당기다 보면 다들 금세 지칩니다.') + ' 비가 오는 동안 선원들을 어떻게 부릴까요?', who);
    var opts = (snow?['work','rest']:Object.keys(RN.ORDERS)).map(function (id) {
      var o = RN.ORDERS[id];
      return { label: o.name + (seaOrder(r) === id ? ' (지금)' : '') + '<br><small style="opacity:.8">' + U.esc((snow?'':o.desc) + RN.effectNote(id)) + '</small>', icon: o.icon, value: id };
    });
    var v = await UI.ask(title+' — ' + (RN.active() ? RN.name() + ' · ' : '') + (z === 'hot' ? '더운 바다' : z === 'cold' ? '추운 바다' : '온대 바다'), opts.concat([{ label: '그대로 둔다', value: null }]), who);
    r.asked = true;
    if (v && RN.ORDERS[v]) { r.order = v; UI.toast(title+' · ' + RN.ORDERS[v].name + '.', RN.ORDERS[v].icon, 3200); }
    return v;
  };
  /** 상태 줄 꼬리표 */
  RN.tag = function (where) {
    var r = record(where); if (!r || !r.lv) return '';
    var text=RN.name(null,where), note=RN.effectNote(null,where);
    if(where==='land')text+=' · 걸음 ×'+RN.landEffect().speed.toFixed(2);
    else text+=' · '+RN.ORDERS[seaOrder(r)].short;
    return '<span style="color:#b7dcff" title="' + U.esc(note) + '">' + text + '</span>';
  };

  // ================================================================ 연출 (화면 좌표 1600×900)
  var vis = 0, snowVis=0, drops = null, flakes=null, rings = [], ringCarry = 0, flash = 0, lastT = null;
  var glassTime=0, glassRain=0, glassSnow=0, rainGlass=null, snowGlass=null, snowSprites=null, glassOptics=null;
  /** 강수가 강할수록 지도 위 구름과 폭풍의 명암을 옅게 한다. */
  RN.weather = function (base, where) {
    var strength=Math.max(.62*vis,.62*snowVis,glassRain,glassSnow), cfg=G.FX.weatherGlass;
    var cloud=where==='land'?base.cloud:Math.max(base.cloud,.35);
    return { cloud:cloud+.07*strength, storm:base.storm+(Math.min(base.storm,cfg.stormShade)-base.storm)*strength,
      cloudOpacity:1-(1-cfg.cloudOpacity)*strength };
  };
  RN.vis = function () { return vis; };
  RN.snowVis = function () { return snowVis; };
  /** waterAt(x,y)는 빗방울 고리의 수면 판정, focus는 조종 중인 배나 탐험대의 화면 좌표다. */
  RN.draw = function (ctx, t, windDir, storm, waterAt, where, focus) {
    var lv=RN.level(where), target=lv>=2?1:lv ? .55 : 0, snow=RN.snowing(where);
    var now = (window.performance ? performance.now() : Date.now()) / 1000;   // 짙어지고 옅어지는 것은 실제 시간으로 (게임 배속·느린 장면과 상관없이)
    var dt = lastT == null ? 0.016 : U.clamp(now - lastT, 0, 0.25); lastT = now;
    var blend=Math.min(1,dt*.9);
    vis += ((snow?0:target)-vis)*blend;
    snowVis += ((snow?target:0)-snowVis)*blend;
    var glassBlend=Math.min(1,dt*2.3);
    glassRain+=((lv>=2&&!snow?1:0)-glassRain)*glassBlend;
    glassSnow+=((lv>=2&&snow?1:0)-glassSnow)*glassBlend;
    if (G.Audio && G.Audio.rain) G.Audio.rain(vis > 0.03 ? vis : 0);
    if(vis<.02){rings.length=0;drops=null;}
    if(snowVis<.02)flakes=null;
    if(glassRain<.02)rainGlass=null;
    if(glassSnow<.02)snowGlass=null;
    if(vis<.02&&snowVis<.02)return;
    ctx.save();
    var sk = (G.Game && G.Game.overlayScale) || 1;
    ctx.setTransform(sk, 0, 0, sk, 0, 0);   // 해전 카메라 확대와 무관한 화면 공간 날씨
    if(vis>=.02)drawRain(ctx,windDir,storm,waterAt,where,dt);
    if(snowVis>=.02)drawSnow(ctx,windDir,dt,focus);
    glassTime+=dt;
    if(glassRain>=.02||glassSnow>=.02)drawGlass(ctx,focus,dt,windDir,lv>=2&&!snow);
    ctx.restore();
  };
  function drawRain(ctx,windDir,storm,waterAt,where,dt){
    var W=1600,H=900;
    // 빗방울 고리: 프레임 수가 아니라 초당 수로 만들고, 육지에는 생기지 않는다.
    if(where!=='land'||waterAt)ringCarry += vis * (34 + 42 * vis) * dt;
    var nr = Math.floor(ringCarry); ringCarry -= nr;
    for (var i = 0; i < nr; i++) {
      for (var tr = 0; tr < 5; tr++) {
        var rx = Math.random() * W, ry = Math.random() * H;
        if (!waterAt || waterAt(rx, ry)) { rings.push({ x: rx, y: ry, t: 0, s: 0.65 + Math.random() * 0.7 }); break; }
      }
    }
    ctx.lineWidth = 1;
    for (var j = rings.length - 1; j >= 0; j--) {
      var g = rings[j]; g.t += dt;
      if (g.t > 0.58) { rings.splice(j, 1); continue; }
      var a = (1 - g.t / 0.58) * 0.24 * vis;
      ctx.strokeStyle = 'rgba(178,216,230,' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(g.x, g.y, (1.5 + g.t * 12) * g.s, (0.7 + g.t * 4.5) * g.s, 0, 0, 7); ctx.stroke();
    }
    if (rings.length > 120) rings.splice(0, rings.length - 120);
    drawRainStreaks(ctx,Math.cos(windDir||0),dt);
    // 번개 (폭풍 속 폭우)
    if (storm && vis > 0.6) {
      if (flash <= 0 && Math.random() < dt * 0.12) { flash = 0.45; if (G.Audio && G.Audio.thunder) setTimeout(function () { G.Audio.thunder(); }, 300 + Math.random() * 900); }
      if (flash > 0) { ctx.fillStyle = 'rgba(235,240,255,' + (Math.max(0, flash) * (Math.sin(flash * 40) > 0 ? 0.55 : 0.2)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); flash -= dt; }
    } else flash = 0;
  }
  function drawRainStreaks(ctx,wind,dt){
    var cfg=G.FX.rainLook, heavy=glassRain;
    if(!drops){
      var rng=U.makeRng(Math.random()*4294967296), bands=[[],[],[],[],[]];
      for(var i=0;i<cfg.heavyCount;i++)bands[i%bands.length].push({x:rng()*1800-100,y:rng()*1050-90,speed:.65+rng()*.8,len:.6+rng()*.85});
      drops={rng:rng,bands:bands,wait:0,gust:0,target:0,shift:0,targetShift:0};
    }
    var field=drops, r=field.rng;
    stepGust(field,cfg.gustInterval,dt);
    var slant=wind*(.13+heavy*(.23+.20*field.gust))+heavy*field.shift*.21;
    var count=U.lerp(cfg.lightCount,cfg.heavyCount*(.66+.34*field.gust),heavy)*Math.min(1,vis/.55);
    ctx.lineCap='round';
    for(var j=0;j<field.bands.length;j++){
      var layer=j/(field.bands.length-1), group=field.bands[j], n=Math.round(count/field.bands.length);
      var fall=U.lerp(cfg.fall[0],cfg.fall[1],layer*heavy)*(.64+layer*.48+heavy*field.gust*.30);
      var length=(5+layer*11)+heavy*(8+layer*36);
      ctx.globalAlpha=Math.min(1,vis/.55)*U.lerp(cfg.opacity[0],cfg.opacity[1],heavy)*(.48+layer*.52);
      ctx.lineWidth=.48+layer*(.45+.86*heavy);ctx.strokeStyle='#c8e1ec';ctx.beginPath();
      for(var k=0;k<n;k++){
        var d=group[k], travel=fall*d.speed*dt, len=length*d.len;
        d.y+=travel;d.x+=travel*slant;
        if(d.y>960){d.y=-75-r()*70;d.x=r()*1800-100;d.speed=.65+r()*.8;d.len=.6+r()*.85;}
        if(d.x>1700)d.x-=1800;else if(d.x< -100)d.x+=1800;
        ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-len*slant,d.y-len);
      }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  function stepGust(field,interval,dt){
    var rng=field.rng;
    field.wait-=dt;
    if(field.wait<=0){
      field.wait=U.lerp(interval[0],interval[1],rng());field.target=rng();field.targetShift=rng()*2-1;
    }
    var blend=1-Math.exp(-dt*6);
    field.gust=U.lerp(field.gust,field.target,blend);field.shift=U.lerp(field.shift,field.targetShift,blend);
  }
  function drawSnow(ctx,windDir,dt,focus){
    var cfg=G.FX.snowfall, heavy=glassSnow;
    if(!flakes){
      var rng=U.makeRng(Math.random()*4294967296), bands=[[],[],[],[]];
      for(var i=0;i<cfg.heavyCount;i++)bands[i%4].push({x:rng()*1800-100,y:rng()*1030-90,
        speed:.64+rng()*.84,size:.58+rng()*.91,spin:rng()*Math.PI*2});
      flakes={rng:rng,bands:bands,wait:0,gust:0,target:0,shift:0,targetShift:0};
    }
    var field=flakes, r=field.rng;
    stepGust(field,cfg.gustInterval,dt);
    if(heavy>.02){
      // 시야 전체를 옅게 흐리고, 진행 방향을 판단할 수 있도록 조종 대상 근처에서 농도를 낮춘다.
      var x=focus?focus[0]:800, y=focus?focus[1]:450, haze=ctx.createRadialGradient(x,y,45,x,y,790);
      haze.addColorStop(0,'rgba(215,230,240,'+cfg.veil[0]+')');
      haze.addColorStop(.48,'rgba(211,227,238,'+U.lerp(cfg.veil[0],cfg.veil[1],.55)+')');
      haze.addColorStop(1,'rgba(208,225,237,'+cfg.veil[1]+')');
      ctx.globalAlpha=heavy*(.77+.23*field.gust);ctx.fillStyle=haze;ctx.fillRect(0,0,1600,900);
    }
    var drift=Math.cos(windDir||0)*U.lerp(cfg.drift[0],cfg.drift[1],heavy*(.64+.36*field.gust))+heavy*field.shift*285;
    var density=U.lerp(cfg.lightCount,cfg.heavyCount*(.71+.29*field.gust),heavy)*Math.min(1,snowVis/.55);
    for(var layer=0;layer<field.bands.length;layer++){
      var v=layer/3, group=field.bands[layer], n=Math.round(density/field.bands.length);
      var fall=U.lerp(cfg.fall[0],cfg.fall[1],heavy)*(.48+v*.54);
      ctx.fillStyle=layer<2?'#dce8ee':'#f2f7f9';
      ctx.globalAlpha=Math.min(1,snowVis/.55)*(.22+v*.31+heavy*.19);ctx.beginPath();
      for(var j=0;j<n;j++){
        var p=group[j], swirl=Math.sin(glassTime*(3+v*3)+p.spin);
        var vx=(drift+swirl*(28+135*heavy))*(.40+.60*v)*p.speed;
        p.x+=vx*dt;p.y+=fall*p.speed*dt;
        if(p.y>970){p.y=-55-r()*50;p.x=r()*1800-100;p.speed=.64+r()*.84;}
        if(p.x>1700)p.x-=1800;else if(p.x< -100)p.x+=1800;
        var w=U.lerp(cfg.radius[0],cfg.radius[1],v)*p.size*(.77+.23*swirl), length=w*(1+heavy*(.35+1.27*v));
        var rot=Math.atan2(fall*p.speed,vx);
        ctx.moveTo(p.x+Math.cos(rot)*length,p.y+Math.sin(rot)*length);
        ctx.ellipse(p.x,p.y,length,w*.69,rot,0,Math.PI*2);
      }
      ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  function smooth(x) { x=U.clamp(x,0,1); return x*x*(3-2*x); }
  function fraction(x) { return x-Math.floor(x); }
  function snowGlassSprite(rng) {
    var cv=document.createElement('canvas'); cv.width=cv.height=128;
    var c=cv.getContext('2d'); c.translate(64,64);
    // 눈이 으깨져 붙은 부분은 가장자리와 작은 눈 결정 사이로 배경색이 비친다.
    for(var i=0;i<9;i++){
      var a=rng()*Math.PI*2, d=i===0?0:12+rng()*23, x=Math.cos(a)*d, y=Math.sin(a)*d, r=11+rng()*18;
      var frost=c.createRadialGradient(x-3,y-4,1,x,y,r);
      frost.addColorStop(0,'rgba(248,252,255,.77)');frost.addColorStop(.39,'rgba(217,233,241,.40)');frost.addColorStop(1,'rgba(201,226,242,0)');
      c.fillStyle=frost;c.fillRect(x-r,y-r,2*r,2*r);
    }
    for(var j=0;j<44;j++){
      var angle=rng()*Math.PI*2, spread=39*Math.sqrt(rng()), grain=.7+rng()*3.3;
      c.fillStyle=j%3?'rgba(247,251,255,.32)':'rgba(137,174,197,.23)';
      c.beginPath();c.arc(Math.cos(angle)*spread,Math.sin(angle)*spread,grain,0,Math.PI*2);c.fill();
    }
    return cv;
  }
  function makeSnowGlass(cfg) {
    if(!snowSprites){
      var paint=U.makeRng(1723);snowSprites=[];
      for(var i=0;i<5;i++)snowSprites.push(snowGlassSprite(paint));
    }
    var rng=U.makeRng(Math.random()*4294967296);
    var parts=[];
    for(var j=0;j<cfg.count;j++)parts.push({x:rng(),y:rng(),offset:rng(),size:U.lerp(cfg.size[0],cfg.size[1],Math.pow(rng(),1.35)),
      life:U.lerp(cfg.life[0],cfg.life[1],rng()),melt:U.lerp(cfg.meltSize[0],cfg.meltSize[1],rng()),
      travel:U.lerp(cfg.meltTravel[0],cfg.meltTravel[1],rng()),slope:(rng()-.5)*.24,angle:rng()*Math.PI*2,sprite:snowSprites[j%snowSprites.length]});
    return parts;
  }
  function glassFocus(x,y,fx,fy) {
    var cfg=G.FX.weatherGlass;
    var dx=(x-fx)/cfg.focus[0], dy=(y-fy)/cfg.focus[1];
    return U.lerp(cfg.focusOpacity,1,smooth((dx*dx+dy*dy)*.7));
  }
  function drawGlass(ctx,focus,dt,windDir,raining) {
    var cfg=G.FX.weatherGlass, fx=focus?focus[0]:800, fy=focus?focus[1]:450;
    if(!glassOptics)glassOptics={count:0,optics:new Float32Array((cfg.rain.count*5+160+cfg.snow.count*2)*8)};
    var batch=glassOptics;batch.count=0;
    if(glassRain>=.02)collectRainLenses(batch,cfg.rain,dt,Math.cos(windDir||0),raining,fx,fy);
    if(glassSnow>=.02)drawSnowGlass(ctx,batch,cfg.snow,fx,fy);
    var game=G.Game, renderer=game&&game.renderer;
    if(batch.count&&!(renderer&&ctx.canvas===game.canvases().overlay&&renderer.weatherLenses(batch.optics,batch.count)))drawLensEdges(ctx,batch);
    ctx.globalAlpha=1;
  }
  function collectRainLenses(batch,cfg,dt,wind,raining,fx,fy) {
    if(!rainGlass)rainGlass={rng:U.makeRng(Math.random()*4294967296),drops:[],splashes:[],wait:0};
    var wet=rainGlass;
    // 화면이 느린 때에도 물이 흐르는 방향과 합쳐지는 지점을 짧은 간격으로 계산한다.
    var steps=Math.ceil(dt/.025), step=dt/(steps||1);
    for(var i=0;i<steps;i++)stepRainGlass(wet,cfg,step,wind,raining);
    var gain=cfg.opacity*glassRain;
    for(var j=0;j<wet.drops.length;j++){
      var d=wet.drops[j], focus=glassFocus(d.x,d.y,fx,fy), alpha=gain*focus;
      for(var k=0;k<d.trail.length;k++){
        var p=d.trail[k], a=1-(d.age-p.age)/cfg.trailTime;
        lens(batch,p.x,p.y,p.width,p.height,alpha*a*.36,p.angle,.07,d.phase);
      }
      if(d.spent)continue;
      var speed=d.vy/cfg.maxFall, size=d.size*U.lerp(.72,1,focus);
      lens(batch,d.x,d.y,size*(1-.10*speed),size*(.81+.26*speed),alpha*(1-smooth((d.age/d.life-.77)/.23)),d.slope,.055,d.phase);
    }
    for(var s=0;s<wet.splashes.length;s++)splashLenses(batch,wet.splashes[s],gain,fx,fy);
  }
  function stepRainGlass(wet,cfg,dt,wind,raining) {
    if(raining){
      wet.wait-=dt;
      while(wet.wait<=0){
        wet.wait+=-Math.log(Math.max(.025,1-wet.rng()))/(cfg.rate*(.62+.62*(drops?drops.gust:0)));
        if(wet.drops.length+wet.splashes.length<cfg.count)rainImpact(wet,cfg);
      }
    }
    var beads=wet.drops;
    for(var i=beads.length-1;i>=0;i--){
      var d=beads[i];d.age+=dt;
      if(!d.spent&&d.age<d.life&&d.y<900+d.size){
        if(d.age>d.pin&&d.size>=cfg.glideSize){
          var oldY=d.y, oldX=d.x, slope=wind*.046+d.slope;
          d.vy=Math.min(cfg.maxFall,d.vy+cfg.gravity*(.64+d.size/cfg.size[1])*dt);
          d.x+=slope*d.vy*dt;d.y+=d.vy*dt;
          var last=d.trail[d.trail.length-1];
          if(d.vy>70&&(!last||d.age-last.age>=cfg.trailStep)){
            d.trail.push({x:(oldX+d.x)*.5,y:(oldY+d.y)*.5,age:d.age,width:.55+d.size*.12,
              height:Math.min(d.vy*cfg.trailStep*.31,6+d.size*.16),angle:-Math.atan(slope)});
          }
        }
      }else d.spent=true;
      while(d.trail.length&&d.age-d.trail[0].age>=cfg.trailTime)d.trail.shift();
      if(d.spent&&!d.trail.length)beads.splice(i,1);
    }
    mergeGlassDrops(beads,cfg);
    for(var j=wet.splashes.length-1;j>=0;j--){
      var hit=wet.splashes[j];hit.age+=dt;
      if(hit.age>=hit.life){
        for(var k=0;k<hit.specks.length&&beads.length<cfg.count;k++){
          var p=hit.specks[k];if(!p.stays)continue;
          var travel=splashTravel(hit.life);
          leaveBead(wet,cfg,hit.x+p.vx*travel,hit.y+p.vy*travel,p.r);
        }
        leaveBead(wet,cfg,hit.x+hit.restX,hit.y+hit.restY,hit.size*hit.restSize);
        wet.splashes.splice(j,1);
      }
    }
  }
  function leaveBead(wet,cfg,x,y,size){
    if(wet.drops.length>=cfg.count)return;
    var rng=wet.rng;
    wet.drops.push({x:x,y:y,size:size,vy:0,age:0,phase:rng()*Math.PI*2,slope:(rng()-.5)*.16,
      pin:U.lerp(cfg.pin[0],cfg.pin[1],rng()),life:U.lerp(cfg.life[0],cfg.life[1],rng()),trail:[],spent:false});
  }
  function rainImpact(wet,cfg) {
    var rng=wet.rng, size=U.lerp(cfg.size[0],cfg.size[1],Math.pow(rng(),1.66));
    var x=rng()*1600, y=rng()*900;
    if(size<cfg.splashSize){leaveBead(wet,cfg,x,y,size);return;}
    var specks=[], life=U.lerp(cfg.splashLife[0],cfg.splashLife[1],rng()), start=rng()*Math.PI*2;
    var n=Math.round(cfg.splashCount*(.48+.52*rng()));
    for(var i=0;i<n;i++){
      var angle=start+(i+rng()*.8)*Math.PI*2/n, speed=105+size*(3.6+rng()*8.4);
      var stays=i<2&&size>11;
      specks.push({vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:(stays?2.3:.85)+rng()*Math.min(4.0,size*.23),stays:stays});
    }
    wet.splashes.push({x:x,y:y,size:size,angle:start,age:0,life:life,specks:specks,
      restX:(rng()-.5)*size*.52,restY:rng()*size*.48,restSize:.54+rng()*.25});
  }
  function mergeGlassDrops(drops,cfg) {
    for(var i=0;i<drops.length;i++){
      var a=drops[i];if(a.spent||!a.vy)continue;
      for(var j=0;j<drops.length;j++){
        var b=drops[j];if(i===j||b.spent||a.vy<=b.vy)continue;
        var dx=a.x-b.x, dy=a.y-b.y, reach=(a.size+b.size)*.46;
        if(dx*dx+dy*dy>=reach*reach)continue;
        // 유리를 타고 내려오며 붙어 있던 물을 만나면 합쳐진 쪽이 굵어진다.
        var ma=a.size*a.size, mb=b.size*b.size;
        a.x=U.lerp(a.x,b.x,mb/(ma+mb));a.size=Math.min(cfg.size[1]*1.32,Math.sqrt(ma+mb));
        a.life=Math.max(a.life,a.age+.38);b.spent=true;
      }
    }
  }
  function lens(wet,x,y,w,h,alpha,angle,irregular,phase){
    var i=wet.count*8, data=wet.optics;
    if(alpha<.017||i>=data.length)return;
    data[i]=x;data[i+1]=y;data[i+2]=w;data[i+3]=h;data[i+4]=alpha;
    data[i+5]=angle;data[i+6]=irregular;data[i+7]=phase;wet.count++;
  }
  function splashTravel(t){ return t/(1+16*t); }
  function splashLenses(wet,hit,gain,fx,fy) {
    var t=hit.age, u=t/hit.life, focus=glassFocus(hit.x,hit.y,fx,fy);
    var alpha=gain*focus, travel=splashTravel(t);
    var sheet=hit.size*(.62+.92*smooth(u*2.6))*U.lerp(.73,1,focus);
    lens(wet,hit.x,hit.y,sheet,sheet*.79,alpha*(1-smooth(u)),hit.angle,.11,hit.angle);
    for(var i=0;i<hit.specks.length;i++){
      var p=hit.specks[i], x=hit.x+p.vx*travel, y=hit.y+p.vy*travel;
      var r=p.r*U.lerp(.73,1,focus);
      lens(wet,x,y,r*(1+.60*(1-u)),r,alpha*(p.stays?.94:1-smooth(u)),Math.atan2(p.vy,p.vx),.07,hit.angle);
    }
  }
  function drawLensEdges(ctx,wet){
    // 지도 렌더러가 없는 경우에도 방울은 투명하게 두고 테두리에만 빛을 남긴다.
    var d=wet.optics;
    for(var i=0;i<wet.count*8;i+=8){
      if(d[i+6]>=.20)continue; // 붙은 눈은 이미 입자가 섞인 그림을 얹었다.
      ctx.globalAlpha=d[i+4];ctx.lineWidth=.85;
      ctx.beginPath();ctx.ellipse(d[i],d[i+1],d[i+2]*.94,d[i+3]*.94,d[i+5],.30,2.06);
      ctx.strokeStyle='rgba(28,71,92,.32)';ctx.stroke();
      ctx.beginPath();ctx.ellipse(d[i],d[i+1],d[i+2]*.94,d[i+3]*.94,d[i+5],3.62,4.81);
      ctx.strokeStyle='rgba(193,224,238,.39)';ctx.stroke();
    }
  }
  function drawSnowGlass(ctx,batch,cfg,fx,fy) {
    if(!snowGlass)snowGlass=makeSnowGlass(cfg);
    for(var i=0;i<snowGlass.length;i++){
      var p=snowGlass[i], cycle=glassTime/p.life+p.offset, phase=fraction(cycle), turn=Math.floor(cycle);
      var x=fraction(p.x+turn*.618034)*1600, y=fraction(p.y+turn*.414214)*900;
      var focus=glassFocus(x,y,fx,fy), gain=cfg.opacity*glassSnow*focus;
      var appear=smooth(phase/.087), melt=smooth((phase-.32)/.56);
      var size=p.size*(.51+.49*appear)*(1-.67*melt)*U.lerp(.68,1,focus), frost=gain*appear*(1-melt);
      lens(batch,x,y,size*.64,size*.49,frost*.72,p.angle,.22,p.angle);
      ctx.globalAlpha=frost;
      ctx.drawImage(p.sprite,x-size,y-size*.77,size*2,size*1.54);
      if(phase<.057){
        // 부딪친 자리에 짧게 튀는 눈가루가 보이고, 덩어리는 같은 자리에 남는다.
        var hit=phase/.057;ctx.globalAlpha=gain*(1-hit)*.65;ctx.fillStyle='#eff8fb';ctx.beginPath();
        for(var j=0;j<5;j++){
          var a=p.angle+j*1.27, radius=size*(.24+.71*hit)*(j%2?.8:1), speck=1.4+size*.039*(1-hit);
          var sx=x+Math.cos(a)*radius, sy=y+Math.sin(a)*radius*.80;
          ctx.moveTo(sx+speck,sy);ctx.arc(sx,sy,speck,0,Math.PI*2);
        }
        ctx.fill();
      }
      if(melt>.04){
        var fall=Math.pow(Math.max(0,(phase-.56)/.44),2.15), down=p.travel*fall;
        var bx=x+p.slope*down, by=y+p.size*.13+down, clear=glassFocus(bx,by,fx,fy);
        var wet=smooth((melt-.04)/.47), bead=p.size*p.melt*U.lerp(.69,1,clear)*(.68+.32*wet);
        var alpha=glassSnow*clear*wet*(1-smooth((phase-.90)/.10));
        lens(batch,bx,by,bead*(1-.09*fall),bead*(.79+.37*fall),alpha,p.slope,.049,p.angle);
      }
    }
  }
  /** 항해·탐험 화면을 떠날 때 날씨 그림과 빗소리를 정리한다. */
  RN.leave = function () { vis = 0; snowVis=0; glassRain=0; glassSnow=0; glassTime=0; rainGlass=null; snowGlass=null; drops=null; flakes=null; rings.length = 0; ringCarry = 0; flash=0; lastT = null; if (G.Audio && G.Audio.rain) G.Audio.rain(0); };
})(window.G = window.G || {});
