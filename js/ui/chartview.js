/* 해도 보기 (G.ChartView): 확대·축소·끌어 옮기기, 도시는 문화권별 투명 모형으로.
   표식: 청록 모서리 = 지금 있는 항구(또는 이번 항해를 시작한 항구)에서 자동항해 가능 · 금색 마름모 = 후원자 · 붉은 깃발 = 탐험 계약한 후원자
   도시를 누르면 요약(G.CityInfo)이 오른쪽에 나온다. 무엇을 알 수 있는지는 제독과 부하의 능력에 따라 다르다. */
(function (G) {
  'use strict';
  var U = G.U, R = G.R, I = G.Info;
  var CV = {};
  G.ChartView = CV;
  function S() { return G.Game.state; }

  var LAT_MIN = -75, LAT_MAX = 80, SPAN_MIN = 8, SPAN_MAX = 360;
  // 세계 전체의 바탕 그림은 하루에 한 번만 다시 그린다
  var worldCv = null, worldKey = '';
  function worldTerrain() {
    var s = S(), k = s.day + ':' + s.known.length;
    if (!worldCv || worldKey !== k) { worldCv = I.chartTerrain(1440, 620, { lon0: -180, lon1: 180, lat0: LAT_MIN, lat1: LAT_MAX }); worldKey = k; }
    return worldCv;
  }
  CV.invalidate = function () { worldCv = null; };

  /** host 안에 해도를 만든다.
      opts: {w, h, center:[lon,lat], span, ref: 기준 항구(자동항해 표식), actions(c) → [{label, icon, fn}], seaAction(lon,lat) → {label, fn}, select: 도시 id} */
  CV.mount = function (host, opts) {
    opts = opts || {};
    var s = S(), W = opts.w || 1100, H = opts.h || 560;
    var ref = opts.ref != null ? opts.ref : (s.loc.mode === 'city' ? s.loc.city : (G.Routes ? G.Routes.origin() : null));
    var here = s.loc.mode !== 'city' ? { lon: s.loc.lon, lat: s.loc.lat } : G.CITY_DATA[s.loc.city];
    var wrap = U.el('div', 'chartview');
    wrap.innerHTML = '<canvas class="cv-map" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="cv-zoom"><button class="btn small" data-z="in" title="확대">＋</button><button class="btn small" data-z="out" title="축소">－</button><button class="btn small" data-z="all" title="세계 전체">전체</button><button class="btn small" data-z="me" title="지금 위치">여기</button></div>' +
      '<div class="cv-legend"><span>⚑ 수도</span><span>모형 크기: 대·중·소</span><span>〰 항구</span><span>┄ 내륙</span><span>⌜ 청록 모서리: 자동항해</span><span><i class="lg own"></i>밑줄 색: 다스리는 나라</span><span><i class="lg dia"></i>후원자</span><span><i class="lg flag"></i>계약</span><span><i class="lg me"></i>지금 위치</span></div>' +
      '<div class="cv-info" hidden></div><div class="cv-tip" hidden></div>';
    host.appendChild(wrap);
    var cv = wrap.querySelector('canvas'), ctx = cv.getContext('2d'), info = wrap.querySelector('.cv-info'), tipEl = wrap.querySelector('.cv-tip');
    cv.style.width = '100%'; cv.style.height = 'auto'; cv.style.display = 'block';
    var view = { lon: opts.center ? opts.center[0] : (here ? U.clamp(here.lon, -150, 150) : 0), lat: opts.center ? opts.center[1] : (here ? here.lat : 20), span: opts.span || 120 };
    var crisp = null, crispKey = '', idleT = null, hover = null, sel = opts.select != null ? G.CITY_DATA[opts.select] : null, seaSel = null, dead = false;
    function latSpan() { return view.span * H / W; }
    function clampView() {
      view.span = U.clamp(view.span, SPAN_MIN, SPAN_MAX);
      var ls = latSpan();
      if (ls >= LAT_MAX - LAT_MIN) view.lat = (LAT_MAX + LAT_MIN) / 2; else view.lat = U.clamp(view.lat, LAT_MIN + ls / 2, LAT_MAX - ls / 2);
      if (view.span >= 360) view.lon = 0; else view.lon = U.clamp(view.lon, -180 + view.span / 2, 180 - view.span / 2);
    }
    function box() { var ls = latSpan(); return { lon0: view.lon - view.span / 2, lon1: view.lon + view.span / 2, lat0: view.lat - ls / 2, lat1: view.lat + ls / 2 }; }
    function px(lon, lat, b) { b = b || box(); return [(lon - b.lon0) / (b.lon1 - b.lon0) * W, (b.lat1 - lat) / (b.lat1 - b.lat0) * H]; }
    function toWorld(x, y) { var b = box(); return [b.lon0 + x / W * (b.lon1 - b.lon0), b.lat1 - y / H * (b.lat1 - b.lat0)]; }
    function evPos(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }

    // ------------------------------------------------ 그리기
    function terrain() {
      var b = box(), key = b.lon0.toFixed(3) + ':' + b.lat0.toFixed(3) + ':' + view.span.toFixed(3);
      if (crisp && crispKey === key) { ctx.drawImage(crisp, 0, 0); return; }
      var wc = worldTerrain(), sx = (b.lon0 + 180) / 360 * wc.width, sy = (LAT_MAX - b.lat1) / (LAT_MAX - LAT_MIN) * wc.height;
      var sw = view.span / 360 * wc.width, sh = latSpan() / (LAT_MAX - LAT_MIN) * wc.height;
      ctx.imageSmoothingEnabled = true; ctx.fillStyle = '#d6c49c'; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(wc, sx, sy, sw, sh, 0, 0, W, H);
      // 확대했으면 잠시 뒤 선명하게 다시 그린다
      if (view.span < 300) {
        clearTimeout(idleT);
        idleT = setTimeout(function () { if (dead) return; crisp = I.chartTerrain(W, H, box()); crispKey = key; draw(); }, 160);
      }
    }
    function draw() {
      if (dead) return;
      var b = box(), zk = Math.pow(U.clamp(360 / view.span, 1, 40), 0.28);
      var cityScale = U.clamp(Math.pow(32 / view.span, 0.25) * 0.75, 0.42, 1.15);
      ctx.save(); terrain();
      // 항로 경험 (열린 항로 진한 선, 익히는 중 점선)
      if (G.Routes) G.Routes.list().forEach(function (r) {
        var A = G.CITY_DATA[r.a], B = G.CITY_DATA[r.b]; if (Math.abs(A.lon - B.lon) > 180) return;
        var pa = px(A.lon, A.lat, b), pb = px(B.lon, B.lat, b);
        ctx.strokeStyle = r.open ? 'rgba(31,122,120,.8)' : 'rgba(90,60,30,.45)'; ctx.lineWidth = r.open ? 2.2 : 1.2; ctx.setLineDash(r.open ? [] : [4, 4]);
        ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke(); ctx.setLineDash([]);
      });
      var fs = 13, font = getComputedStyle(document.body).fontFamily;
      I.chartMarks(ctx, function (lon, lat) { return px(lon, lat, b); }, fs, view.span, W, H, here, {});
      // 도시: 지역별 건축 양식과 규모를 작은 실루엣으로 표시한다.
      var labels = [];
      cities().forEach(function (c) {
        var p = px(c.lon, c.lat, b); if (p[0] < -12 || p[0] > W + 12 || p[1] < -12 || p[1] > H + 12) return;
        var f = G.CityInfo.flags(c, ref), visited = s.visited && s.visited[c.id];
        var mark = G.CityIcon.draw(ctx, c, p[0], p[1], { scale: cityScale, visited: visited, auto: f.auto });
        var r = mark.radius;
        if (f.sponsor) { var dx = p[0] + mark.width / 2, dy = p[1] + mark.top, dz = 3.6 * zk; ctx.fillStyle = '#c9a030'; ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dx, dy - dz); ctx.lineTo(dx + dz, dy); ctx.lineTo(dx, dy + dz); ctx.lineTo(dx - dz, dy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        if (f.contract) { var fx = p[0] - mark.width * 0.18, fy = p[1] + mark.top; ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 15); ctx.stroke(); ctx.fillStyle = '#b01e1e'; ctx.beginPath(); ctx.moveTo(fx, fy - 15); ctx.lineTo(fx - 11, fy - 11.5); ctx.lineTo(fx, fy - 8); ctx.closePath(); ctx.fill(); }
        if (c === sel || c === hover) labels.push([c, p, r]);
        else if (view.span <= 16 && c.port) labels.push([c, p, r, true]);
      });
      // 이름: 고른 도시·마우스를 올린 도시, 아주 크게 확대했을 때만 항구 이름
      ctx.font = '600 ' + fs + 'px ' + font; ctx.textBaseline = 'middle';
      var rects = [];
      labels.sort(function (a, b2) { return (a[3] ? 1 : 0) - (b2[3] ? 1 : 0); }).forEach(function (L) {
        var c = L[0], p = L[1], tw = ctx.measureText(c.name).width + 10, x = p[0] + L[2] + 5, y = p[1];
        if (x + tw > W) x = p[0] - L[2] - 5 - tw;
        var rc = [x, y - 10, tw, 20];
        if (L[3] && rects.some(function (q) { return rc[0] < q[0] + q[2] && q[0] < rc[0] + rc[2] && rc[1] < q[1] + q[3] && q[1] < rc[1] + rc[3]; })) return;
        rects.push(rc);
        ctx.fillStyle = L[3] ? 'rgba(242,231,204,.8)' : 'rgba(30,20,12,.82)'; ctx.fillRect(rc[0], rc[1], rc[2], rc[3]);
        ctx.fillStyle = L[3] ? '#3a2410' : '#f2e7cc'; ctx.fillText(c.name, x + 5, y + 1);
      });
      if (sel) { var sp2 = px(sel.lon, sel.lat, b); ctx.strokeStyle = '#f2e7cc'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(sp2[0], sp2[1], 12 * zk, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      if (seaSel) { var q2 = px(seaSel[0], seaSel[1], b); ctx.strokeStyle = '#1e3552'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(q2[0] - 7, q2[1] - 7); ctx.lineTo(q2[0] + 7, q2[1] + 7); ctx.moveTo(q2[0] + 7, q2[1] - 7); ctx.lineTo(q2[0] - 7, q2[1] + 7); ctx.stroke(); }
      // 지금 위치
      if (here) {
        var hp = px(here.lon, here.lat, b);
        ctx.fillStyle = '#1e3552'; ctx.strokeStyle = '#f2e7cc'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(hp[0], hp[1], 5.5, 0, 7); ctx.fill(); ctx.stroke();
        if (s.loc.mode !== 'city') { var hd = s.loc.heading || 0; ctx.strokeStyle = '#1e3552'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hp[0], hp[1]); ctx.lineTo(hp[0] + Math.cos(hd) * 14, hp[1] - Math.sin(hd) * 14); ctx.stroke(); }
      }
      // 축척
      ctx.fillStyle = 'rgba(40,25,10,.7)'; ctx.font = '12px ' + font; ctx.textBaseline = 'alphabetic';
      ctx.fillText('경도 ' + Math.round(view.span) + '° 폭', W - 96, H - 10);
      // 가장자리 그늘
      var g2 = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
      g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(90,60,20,.3)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    var cityList = null;
    function cities() {
      if (!cityList) cityList = s.known.map(function (id) { return G.CITY_DATA[id]; }).filter(function (c) { return c && R.cityExists(c); });
      return cityList;
    }
    function cityAt(x, y) {
      var b = box(), best = null, bd = Infinity;
      var scale = U.clamp(Math.pow(32 / view.span, 0.25) * 0.75, 0.42, 1.15);
      cities().forEach(function (c) {
        var p = px(c.lon, c.lat, b), d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y);
        var hit = Math.max(11, G.CityIcon.metrics(c, scale).radius + 3);
        if (d <= hit * hit && d < bd) { bd = d; best = c; }
      });
      return best;
    }

    // ------------------------------------------------ 도시 요약
    function showCity(c) {
      sel = c; seaSel = null;
      var acts = opts.actions ? opts.actions(c) || [] : [];
      info.innerHTML = '<button class="ci-x" title="닫기">×</button>' + G.CityInfo.html(c, ref) +
        (acts.length ? '<div class="ci-acts">' + acts.map(function (a, i) { return '<button class="btn small' + (i === 0 ? ' navy' : '') + '" data-i="' + i + '">' + (a.icon ? G.icon(a.icon) : '') + U.esc(a.label) + '</button>'; }).join('') + '</div>' : '');
      info.hidden = false;
      info.querySelector('.ci-x').onclick = function () { sel = null; info.hidden = true; draw(); };
      U.$$('.ci-acts .btn', info).forEach(function (bt) { bt.onclick = function () { acts[+bt.dataset.i].fn(c); }; });
      draw();
    }
    function showSea(lon, lat) {
      var a = opts.seaAction && opts.seaAction(lon, lat);
      if (!a) { sel = null; info.hidden = true; seaSel = null; draw(); return; }
      sel = null; seaSel = [lon, lat];
      info.innerHTML = '<button class="ci-x" title="닫기">×</button><div class="ci-h"><b>바다</b><span class="ci-sub">' + U.fmtLat(lat) + ' · ' + U.fmtLon(lon) + '</span></div><div class="ci-hint" style="margin:8px 0">' + U.esc(a.note || '') + '</div><div class="ci-acts"><button class="btn small navy">' + U.esc(a.label) + '</button></div>';
      info.hidden = false;
      info.querySelector('.ci-x').onclick = function () { seaSel = null; info.hidden = true; draw(); };
      info.querySelector('.ci-acts .btn').onclick = function () { a.fn(lon, lat); };
      draw();
    }

    // ------------------------------------------------ 조작
    function zoomAt(k, x, y) {
      var w0 = toWorld(x, y);
      view.span /= k; clampView();
      var w1 = toWorld(x, y);
      view.lon += w0[0] - w1[0]; view.lat += w0[1] - w1[1]; clampView();
      draw();
    }
    cv.addEventListener('wheel', function (e) { e.preventDefault(); e.stopPropagation(); var p = evPos(e); zoomAt(e.deltaY < 0 ? 1.25 : 1 / 1.25, p[0], p[1]); }, { passive: false });
    var drag = null;
    cv.addEventListener('mousedown', function (e) { if (e.button !== 0) return; e.stopPropagation(); drag = { p: evPos(e), lon: view.lon, lat: view.lat, moved: false }; });
    function onMove(e) {
      var p = evPos(e);
      if (drag) {
        var dx = p[0] - drag.p[0], dy = p[1] - drag.p[1];
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        if (drag.moved) { view.lon = drag.lon - dx / W * view.span; view.lat = drag.lat + dy / H * latSpan(); clampView(); cv.style.cursor = 'grabbing'; draw(); }
        return;
      }
      var hc = cityAt(p[0], p[1]);
      if (hc !== hover) { hover = hc; cv.style.cursor = hc ? 'pointer' : 'grab'; draw(); }
    }
    function onUp(e) {
      if (!drag) return;
      var d = drag; drag = null; cv.style.cursor = hover ? 'pointer' : 'grab';
      if (d.moved) return;
      var p = evPos(e), c = cityAt(p[0], p[1]);
      if (c) showCity(c); else { var w = toWorld(p[0], p[1]); showSea(w[0], w[1]); }
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    cv.addEventListener('mouseleave', function () { if (hover && !drag) { hover = null; draw(); } });
    cv.addEventListener('dblclick', function (e) { var p = evPos(e); zoomAt(2, p[0], p[1]); });
    U.$$('.cv-zoom .btn', wrap).forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var z = b.dataset.z;
        if (z === 'in') zoomAt(1.6, W / 2, H / 2); else if (z === 'out') zoomAt(1 / 1.6, W / 2, H / 2);
        else if (z === 'all') { view.span = 360; clampView(); draw(); }
        else if (z === 'me' && here) { view.lon = here.lon; view.lat = here.lat; view.span = Math.min(view.span, 60); clampView(); draw(); }
      };
    });
    // 창이 닫히면 전역 이벤트를 떼어 낸다
    var mo = new MutationObserver(function () { if (!document.body.contains(wrap)) { dead = true; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); mo.disconnect(); } });
    mo.observe(document.body, { childList: true, subtree: true });
    cv.style.cursor = 'grab';
    clampView(); draw();
    if (sel) showCity(sel);
    return { el: wrap, redraw: draw, view: view, select: showCity };
  };
})(window.G = window.G || {});
