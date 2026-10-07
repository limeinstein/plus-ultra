/* 토르데시야스 조약(1494.6.7)·사라고사 조약(1529.4.22) — G.Treaty (자료 js/data/treaty.js)
   · 그날이 되면 조약 창(세계 지도에 경계선)을 띄우고, 그날부터 조약의 조건이 걸린다.
   · 반구: 서경 46.5° 선의 서쪽 → 에스파냐, 동쪽 → 포르투갈. 지구 반대편 경계는 1529년까지 조약에서 셈한 동경 133.5°(다툼이 있었다),
     사라고사 조약부터 동경 144.5°(향료제도는 포르투갈 쪽). 유럽·동북아시아·내륙 중앙아시아는 조약이 미치지 않는다(G.TREATY.exclude).
   · 조건: ① 새로 찾은 땅(지리·자연·유적·민족 발견)을 후원자에게 보고하면, 그 땅이 후원자 왕실의 몫이면 사례금 ×ownK, 상대 왕실의 몫이면 ×otherK
     (잉글랜드·프랑스 후원자는 조약을 인정하지 않는다). 보고한 땅에 몫을 적는다(s.disc[id].claim).
     ② 상대 왕실의 반구에 있는 상대 왕실 항구에는 들어갈 수 없다(교섭·잠입은 된다) — js/scenes/city.js C.entryCheck
     ③ 바다에서 경계선을 넘으면 알림, 해도(G.ChartView)에 선을 그린다.
     ④ 포르투갈이 다스리는 항구와 G.TREATY.ptPorts 항구에서는 포르투갈어가 통한다 (R.cityLang)
   · 저장: s.treaty = {t1, t2: 창을 보였나(1 보임 · 'skip' 옛 저장에서 이미 지난 날), side: 바다에서 마지막으로 있던 반구}
   조정값: G.BALANCE.treaty */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var T = G.Treaty = {};
  function S() { return G.Game && G.Game.state; }
  function D() { return G.TREATY; }
  function K() { return (G.BALANCE && G.BALANCE.treaty) || {}; }
  function st() { var s = S(); return s && (s.treaty || (s.treaty = {})); }
  function dn(o) { return o.y * 10000 + o.m * 100 + (o.d || 1); }
  function today() { var s = S(); return s ? dn(s.date) : 0; }
  /** 토르데시야스 조약이 걸렸는가 (1494년 6월 7일부터) */
  T.active = function () { return !!S() && today() >= dn(D().tordesillas); };
  /** 사라고사 조약이 걸렸는가 (1529년 4월 22일부터) */
  T.zaragoza = function () { return !!S() && today() >= dn(D().zaragoza); };
  /** 지구 반대편 경계의 경도 */
  T.antiLon = function () { return T.zaragoza() ? D().zaragoza.lon : D().tordesillas.lon + 180; };
  /** 이 자리가 어느 왕실의 반구인가: 'ES'·'PT' (조약 전이면 null) */
  T.side = function (lon, lat) {
    if (!T.active()) return null;
    var L = D().tordesillas.lon, A = T.antiLon(), x = G.Geo && G.Geo.wrapLon ? G.Geo.wrapLon(lon) : lon;
    return x >= L && x < A ? 'PT' : 'ES';
  };
  /** 조약이 미치는 지역인가 */
  T.inZone = function (region) { return region == null || D().exclude.indexOf(region) < 0; };
  T.crownName = function (n) { return n === 'PT' ? '포르투갈' : n === 'ES' ? (S().date.y < 1516 ? '카스티야' : '에스파냐') : n; };
  /** 다스리는 나라 이름 → 'PT'·'ES' (이베리아 두 왕실이 아니면 null) */
  T.crownOf = function (owner) { return owner === '포르투갈' ? 'PT' : (owner === '카스티야' || owner === '아라곤' || owner === '에스파냐') ? 'ES' : null; };

  // ---------------------------------------------------------------- ① 새로 찾은 땅의 몫
  /** 이 발견이 조약으로 어느 왕실의 땅이 되는가 ('ES'·'PT', 땅이 아니거나 조약 밖이면 null) */
  T.claimOf = function (d) {
    if (!d || !T.active() || D().landCats.indexOf(d.cat) < 0 || !T.inZone(d.reg)) return null;
    return T.side(d.lon, d.lat);
  };
  /** 후원자에게 보고할 때: {k: 사례금 배수, line: 후원자의 말, claim} 또는 null */
  T.reportMod = function (sp, d) {
    var cl = T.claimOf(d); if (!cl || !sp) return null;
    var k = K(), nm = T.crownName(cl);
    if (sp.nation === 'FR' || sp.nation === 'EN') return { k: 1, claim: cl, line: U.pick(['교황이 세상을 둘로 나눴다고? 아담의 유언장 어디에 그런 말이 있는지 보여 주게. 우리는 그 조약을 모르네.', '이베리아 두 왕실끼리 나눠 가진 종잇장이 우리와 무슨 상관인가. 먼저 깃발을 꽂는 자가 임자일세.']) };
    if (sp.nation !== 'PT' && sp.nation !== 'ES') return null;
    if (sp.nation === cl) return { k: k.ownK || 1.15, claim: cl, line: '토르데시야스 선 ' + (cl === 'ES' ? '서쪽' : '동쪽') + '의 땅이니 조약에 따라 우리 ' + nm + ' 왕실의 몫일세. 폐하께서도 크게 기뻐하실 걸세.' };
    return { k: k.otherK || 0.7, claim: cl, line: '그런데 그 땅은 토르데시야스 선 ' + (cl === 'ES' ? '서쪽' : '동쪽') + '이로군. 조약에 따라 ' + nm + '의 몫이 되니 우리 왕실이 차지할 수는 없네. 알려 준 공은 있으니 사례는 하겠지만, 약속한 만큼은 어렵네.' };
  };

  // ---------------------------------------------------------------- ② 상대 왕실의 항구
  /** 들어갈 수 없으면 {reason:'treaty', text, bribe} (js/scenes/city.js C.entryCheck) */
  T.entryBlock = function (c, owner) {
    if (!T.active() || !c || !T.inZone(c.region)) return null;
    var me = S().player.nation, crown = T.crownOf(owner || R.cityOwner(c));
    if (!crown || crown === me || (me !== 'PT' && me !== 'ES')) return null;
    if (T.side(c.lon, c.lat) !== crown) return null;   // 자기 반구 밖(브라질 서쪽 끝 등)에 있는 상대 왕실 항구는 막지 않는다
    var k = K(), b = k.bribe || [1500, 600];
    return { reason: 'treaty', text: '여기는 ' + T.crownName(crown) + '령이다. 토르데시야스 조약에 따라 ' + T.crownName(me) + '의 함대를 항구에 들여보낼 수 없다!', bribe: b[0] + c.size * b[1] };
  };

  // ---------------------------------------------------------------- ④ 포르투갈어가 통하는 항구
  /** 이 도시에서 포르투갈어가 통하는가 — 까닭 한 줄 또는 null */
  T.ptLang = function (c) {
    if (!c || c.lang === 1 || !S()) return null;
    var y = S().date.y;
    if (R.cityOwner(c) === '포르투갈') return '포르투갈이 다스리는 항구라 포르투갈어가 통한다';
    var p = D().ptPorts.filter(function (x) { return x[0] === c.name && y >= x[1] && y <= x[2]; })[0];
    return p ? p[3] : null;
  };

  // ---------------------------------------------------------------- 날마다: 조약의 날 · 바다에서 경계선 넘기 (js/systems/world.js)
  T.daily = function () {
    var s = S(), out = []; if (!s) return out;
    var t = st(), d = today();
    if (!t.init) { t.init = 1; T.fixOld(); }   // 옛 저장: 이미 한참 지난 조약은 창 없이
    if (!t.t1 && d >= dn(D().tordesillas)) { t.t1 = 'due'; G.State.log('토르데시야스 조약 — 서경 46.5° 선의 서쪽은 에스파냐, 동쪽은 포르투갈의 몫이 되었다.'); }
    if (!t.t2 && d >= dn(D().zaragoza)) { t.t2 = 'due'; G.State.log('사라고사 조약 — 동경 144.5° 선으로 태평양 쪽 경계를 정했다. 향료제도는 포르투갈의 몫.'); }
    if (s.loc && s.loc.mode === 'sea' && T.active()) {
      var sd = T.side(s.loc.lon, s.loc.lat), lat = s.loc.lat, near = nearLine(s.loc.lon);
      if (t.side && sd !== t.side && near && lat > -65 && lat < 72) {
        var lineName = near === 'atl' ? '토르데시야스 선(서경 46.5°)을' : T.zaragoza() ? '사라고사 선(동경 144.5°)을' : '지구 반대편 경계(동경 133.5° 남짓 — 두 왕실이 다툰다)를';
        out.push({ icon: 'flag', text: lineName + ' 넘었다 — 여기서부터는 ' + T.crownName(sd) + '의 바다다.' });
      }
      t.side = sd;
    } else if (s.loc && s.loc.mode !== 'sea') t.side = null;
    return out;
  };
  function nearLine(lon) {
    var x = G.Geo.wrapLon(lon), a = Math.abs(x - D().tordesillas.lon), b = Math.abs(G.Geo.wrapLon(x - T.antiLon()));
    return a < 8 ? 'atl' : b < 8 ? 'pac' : null;
  }
  /** 옛 저장: 이미 지난 조약은 창 없이 넘어간다 */
  T.fixOld = function () {
    var t = st(), d = today(); if (!t) return;
    if (t.t1 == null && d > dn(D().tordesillas) + 30) t.t1 = 'skip';
    if (t.t2 == null && d > dn(D().zaragoza) + 30) t.t2 = 'skip';
  };

  // ---------------------------------------------------------------- 조약 창
  function ready() {
    var g = G.Game, s = S();
    if (!s || !s.player || !UI || (UI.busy && UI.busy())) return false;
    if (['city', 'sea', 'land'].indexOf(g.sceneName) < 0) return false;
    var rt = g.scene && g.scene.runtime ? g.scene.runtime() : null;
    if (rt && rt.busy) return false;
    if (g.sceneName === 'city' && G.Scenes.city.busy && G.Scenes.city.busy()) return false;
    return true;
  }
  var running = false;
  T.tick = function () {
    var s = S(); if (!s || running || !s.treaty) return;
    var t = s.treaty, which = t.t1 === 'due' ? 't1' : t.t2 === 'due' ? 't2' : null; if (!which || !ready()) return;
    running = true;
    (which === 't1' ? T.showTordesillas() : T.showZaragoza()).then(function () { t[which] = 1; running = false; }, function (e) { console.error(e); t[which] = 1; running = false; });
  };
  setInterval(function () { try { T.tick(); } catch (e) { console.error(e); } }, 600);

  /** 세계 지도: 뭍·바다 + 두 왕실의 반구 + 경계선 (조약 창·도감) */
  var LAND = null, MAP_N = 72, MAP_S = -56;   // 조약 지도의 위도 범위
  function landMap(w, h) {
    if (LAND && LAND.width === w) return LAND;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    for (var y = 0; y < h; y++) {
      var lat = MAP_N - (y + 0.5) / h * (MAP_N - MAP_S);
      for (var x = 0; x < w; x++) {
        var lon = -180 + (x + 0.5) / w * 360, o = (y * w + x) * 4, land = G.Geo.isLand(lon, lat), n = ((x * 73856093) ^ (y * 19349663)) & 7;
        if (land) { d[o] = 200 - n; d[o + 1] = 176 - n; d[o + 2] = 124 - n; } else { d[o] = 156 - n; d[o + 1] = 182 - n; d[o + 2] = 182 - n; }
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    LAND = cv; return cv;
  }
  T.mapCanvas = function (w, h, opt) {
    opt = opt || {};
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    function px(lon, lat) { return [(lon + 180) / 360 * w, (MAP_N - lat) / (MAP_N - MAP_S) * h]; }
    ctx.drawImage(landMap(w, h), 0, 0);
    var L = D().tordesillas.lon, A = opt.zaragoza ? D().zaragoza.lon : L + 180;
    // 반구 물들이기: 에스파냐(붉은 금빛) · 포르투갈(초록)
    function band(a, b, col) { var p0 = px(a, 0)[0], p1 = px(b, 0)[0]; ctx.fillStyle = col; ctx.fillRect(p0, 0, p1 - p0, h); }
    band(L, A, 'rgba(40,120,70,.20)');
    band(-180, L, 'rgba(176,40,30,.18)'); band(A, 180, 'rgba(176,40,30,.18)');
    // 조약이 미치지 않는 곳: 유럽·동북아시아 (빗금)
    ctx.save(); ctx.strokeStyle = 'rgba(60,50,40,.35)'; ctx.lineWidth = 1;
    [[-12, 42, 35, 72], [100, 145, 20, 55]].forEach(function (r) {
      var p0 = px(r[0], r[3]), p1 = px(r[1], r[2]);
      ctx.beginPath(); ctx.rect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]); ctx.clip();
      for (var i = -h; i < w; i += 7) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke(); }
      ctx.restore(); ctx.save(); ctx.strokeStyle = 'rgba(60,50,40,.35)';
    });
    ctx.restore();
    function meridian(lon, col, dash, wdt) { var p = px(lon, 0)[0]; ctx.strokeStyle = col; ctx.lineWidth = wdt || 2.5; ctx.setLineDash(dash || []); ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke(); ctx.setLineDash([]); return p; }
    var fx = meridian(L, '#8a1c10', [], 3);
    var ax = opt.zaragoza ? meridian(A, '#8a1c10', [], 3) : meridian(A, 'rgba(138,28,16,.7)', [6, 5], 2);
    // 카보베르데 제도에서 370레구아
    var cvp = px(D().tordesillas.capeVerde[0], D().tordesillas.capeVerde[1]);
    ctx.fillStyle = '#1e3552'; ctx.beginPath(); ctx.arc(cvp[0], cvp[1], 4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#1e3552'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(cvp[0], cvp[1]); ctx.lineTo(fx, cvp[1]); ctx.stroke(); ctx.setLineDash([]);
    var font = getComputedStyle(document.body).fontFamily;
    function label(t, x, y, col, size, align) { ctx.font = '700 ' + (size || 15) + 'px ' + font; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(245,236,214,.9)'; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); }
    label('카보베르데 → 370레구아', (cvp[0] + fx) / 2, cvp[1] - 13, '#1e3552', 12);
    label('서경 46.5°', fx, 14, '#8a1c10', 13);
    label(opt.zaragoza ? '동경 144.5° (사라고사)' : '반대편 경계 (다툼)', ax, 14, '#8a1c10', 13);
    var sy = px(0, 8)[1];
    label('◀ 에스파냐', fx - 12, sy, '#8a1c10', 18, 'right');
    label('포르투갈 ▶', fx + 12, sy, '#1f5a34', 18, 'left');
    label('브라질', px(-40, -12)[0], px(-40, -12)[1], '#1f5a34', 14);
    label('아메리카', px(-100, 40)[0], px(-100, 40)[1], '#8a1c10', 15);
    label('아프리카·인도', px(45, 5)[0], px(45, 5)[1], '#1f5a34', 15);
    label('조약 밖', px(122, 38)[0], px(122, 38)[1], '#4a3b2c', 12);
    if (opt.zaragoza) { var mp = px(D().zaragoza.moluccas[0], D().zaragoza.moluccas[1]); ctx.fillStyle = '#1f5a34'; ctx.beginPath(); ctx.arc(mp[0], mp[1], 4, 0, 7); ctx.fill(); label('향료제도', mp[0] + 2, mp[1] + 14, '#1f5a34', 12); }
    if (opt.here) { var hp = px(opt.here.lon, opt.here.lat); ctx.fillStyle = '#1e3552'; ctx.strokeStyle = '#f2e7cc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hp[0], hp[1], 5, 0, 7); ctx.fill(); ctx.stroke(); }
    return cv;
  };
  function hereNow() { var s = S(), l = s.loc || {}; return l.mode === 'city' && G.CITY_DATA[l.city] ? G.CITY_DATA[l.city] : { lon: l.lon, lat: l.lat }; }
  function myLine() {
    var me = S().player.nation;
    return me === 'PT' ? '포르투갈의 제독으로서는 아프리카를 돌아 인도와 동방으로 가는 바다가 우리의 몫이 되었다. 선 서쪽의 에스파냐 항구에는 이제 들어갈 수 없다.'
      : me === 'ES' ? '에스파냐의 제독으로서는 대서양 서쪽의 새 땅이 모두 우리의 몫이 되었다. 아프리카·인도의 포르투갈 항구에는 이제 들어갈 수 없다.' : '';
  }
  function win(title, html, mapOpt) {
    var w = UI.window({ title: title, icon: 'scroll', width: 1060, html: '<div class="treaty"><div class="tr-map"></div><div class="tr-text">' + html + '</div></div>', buttons: [{ label: '조약문을 접는다', value: 1, cls: 'navy' }] });
    try { var cv = T.mapCanvas(900, 300, mapOpt); cv.className = 'tr-cv'; w.content.querySelector('.tr-map').appendChild(cv); } catch (e) { console.error(e); }
    if (G.Audio) G.Audio.sfx('discover');
    return w.result;
  }
  T.showTordesillas = function () {
    return win('토르데시야스 조약 — 1494년 6월 7일',
      '<p>카스티야의 토르데시야스에서 에스파냐와 포르투갈 두 왕실이 세상을 둘로 나누는 조약을 맺었다. <b>카보베르데 제도 서쪽 370레구아(약 800마일)</b>의 대서양 위에 남북으로 선(서경 46° 남짓)을 그었다.</p>' +
      '<ul><li><b>서쪽</b> — 선보다 서쪽에서 새로 찾는 모든 땅은 <b>에스파냐</b>의 것이다. 아메리카 대륙의 대부분이 이쪽이다.</li>' +
      '<li><b>동쪽</b> — 선보다 동쪽의 땅과 <b>아프리카·아시아</b>로 가는 동방 항로는 <b>포르투갈</b>의 것이다.</li>' +
      '<li>이 선은 남아메리카의 동쪽 끝을 지난다. 그 땅(뒷날의 <b>브라질</b>)은 포르투갈의 몫이 되어, 남아메리카에서 홀로 포르투갈어를 쓰는 나라가 된다.</li>' +
      '<li>유럽과 <b>동북아시아(명·조선·일본)</b>는 조약과 상관없다. 다만 포르투갈 상인이 드나드는 몇몇 항구에서는 포르투갈어가 통하게 된다.</li></ul>' +
      '<p class="tr-rule">이제부터 — 새로 찾은 땅을 보고하면 조약에 따라 그 땅의 몫이 정해지고(후원자 왕실의 몫이면 사례금이 오르고 상대 왕실의 몫이면 줄어든다), 상대 왕실 반구의 상대 왕실 항구는 함대를 들이지 않는다. 해도에 선이 그려진다.</p>' +
      (myLine() ? '<p class="tr-me">' + myLine() + '</p>' : ''), { here: hereNow() });
  };
  T.showZaragoza = function () {
    return win('사라고사 조약 — 1529년 4월 22일',
      '<p>마젤란의 함대가 서쪽으로 돌아 향료제도에 닿자, 지구 반대편에서 두 왕실이 맞부딪쳤다. 아라곤의 사라고사에서 다시 조약을 맺어 <b>태평양 쪽의 경계</b>를 정했다.</p>' +
      '<ul><li>향료제도(말루쿠) 동쪽 297.5레구아, <b>동경 144.5° 남짓</b>에 남북으로 선을 그었다.</li>' +
      '<li>그 서쪽 — <b>향료제도</b>를 포함해 — 은 <b>포르투갈</b>, 동쪽의 태평양은 <b>에스파냐</b>의 몫이다. 에스파냐는 향료제도의 권리를 금화 35만 두카도에 넘겼다.</li>' +
      '<li>이로써 아메리카와 태평양은 에스파냐, 아프리카·인도·동남아시아의 바닷길은 포르투갈이 나누어 가지며 두 나라는 세계 제국으로 커 간다. 동북아시아는 여전히 조약 밖이다.</li></ul>', { zaragoza: true, here: hereNow() });
  };

  // ---------------------------------------------------------------- ③ 해도에 선 (js/ui/chartview.js)
  T.drawChart = function (ctx, px, W, H) {
    if (!T.active()) return;
    var L = D().tordesillas.lon, A = T.antiLon(), z = T.zaragoza();
    function line(lon, solid, text) {
      var p = px(lon, 0); if (p[0] < -4 || p[0] > W + 4) return;
      ctx.save(); ctx.strokeStyle = solid ? 'rgba(138,28,16,.75)' : 'rgba(138,28,16,.45)'; ctx.lineWidth = solid ? 2 : 1.5; ctx.setLineDash(solid ? [10, 4, 2, 4] : [5, 6]);
      ctx.beginPath(); ctx.moveTo(p[0], 0); ctx.lineTo(p[0], H); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '700 12px ' + getComputedStyle(document.body).fontFamily; ctx.textBaseline = 'top';
      var tw = ctx.measureText(text).width + 8; ctx.fillStyle = 'rgba(245,236,214,.85)'; ctx.fillRect(p[0] + 4, 6, tw, 18); ctx.fillStyle = '#8a1c10'; ctx.fillText(text, p[0] + 8, 9);
      ctx.restore();
    }
    line(L, true, '토르데시야스 선 · ◀ 에스파냐 | 포르투갈 ▶');
    line(A, z, z ? '사라고사 선 · ◀ 포르투갈 | 에스파냐 ▶' : '반대편 경계(다툼)');
  };
})(window.G = window.G || {});
