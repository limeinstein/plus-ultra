/* 고지도 주인공 선택 UI. 이야기 등록·공개 조건·시작 함수는 storyselect.js의 최신 자료를 그대로 읽는다.
   생성 원화는 땅의 질감으로만 쓴다. 해안선과 핀을 같은 경위도 투영으로 그려 항구가 밀리지 않게 한다. */
(function (G) {
  'use strict';
  var SL = G.StorySelect, U = G.U, UI = G.UI, cache = {};
  var PAGES = [
    { id: 'world', lon0: -180, lon1: 180, lat1: 83, lat0: -65 },
    { id: 'eu', lon0: -22, lon1: 50, lat1: 60, lat0: 34 },
    { id: 'ea', lon0: 104, lon1: 154, lat1: 46, lat0: 24 }
  ];
  function fx() { return G.FX.storySelect; }
  function page(id) { return PAGES.filter(function (p) { return p.id === id; })[0] || PAGES[0]; }
  function size(p) { var f = fx().map; return [f.width, p.id === 'world' ? f.worldHeight : f.height]; }
  function point(p, lon, lat) { if (typeof p === 'string') p = page(p); var z = size(p); return [(lon - p.lon0) / (p.lon1 - p.lon0) * z[0], (p.lat1 - lat) / (p.lat1 - p.lat0) * z[1]]; }
  function region(m) { return m.page || (G.CITY_DATA[m.city].lon >= 90 ? 'ea' : 'eu'); }
  function anchor(m) { var a = fx().map.anchors[m.id], c = G.CITY_DATA[m.city]; return a || [c.lon, c.lat]; }
  SL.PAGES = PAGES; SL.px = point;
  function noise(x, y) { return ((Math.imul(x + 23, 374761393) ^ Math.imul(y + 17, 668265263)) >>> 0) / 4294967295; }

  /** 외곽은 항상 실제 지형. 원화에서는 산맥의 선과 종이색만 가져온다. */
  SL.mapCanvas = function (pid) {
    if (cache[pid]) return cache[pid];
    var p = page(pid), z = size(p), w = z[0], h = z[1], f = fx().map, step = f.step;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d'), art = G.Img.get('ui/storyselect/map-' + pid), pixels = null;
    if (art) {
      try { ctx.drawImage(art, 0, 0, w, h); pixels = ctx.getImageData(0, 0, w, h).data; }
      catch (e) { /* 다른 배포 주소의 그림을 읽지 못해도 실제 지형과 표식은 그린다. */ }
    }
    var sea = ctx.createLinearGradient(0, 0, 0, h); sea.addColorStop(0, f.sea[0]); sea.addColorStop(1, f.sea[1]);
    ctx.fillStyle = sea; ctx.fillRect(0, 0, w, h);
    var cols = Math.ceil(w / step), rows = Math.ceil(h / step), mask = new Uint8Array(cols * rows);
    for (var gy = 0; gy < rows; gy++) for (var gx = 0; gx < cols; gx++) {
      var x = gx * step, y = gy * step, lon = p.lon0 + (x + step / 2) / w * (p.lon1 - p.lon0), lat = p.lat1 - (y + step / 2) / h * (p.lat1 - p.lat0);
      if (!G.Geo.isLand(lon, lat)) continue;
      mask[gy * cols + gx] = 1;
      var shade = (noise(gx, gy) - .5) * 14, color = [f.land[0] + shade, f.land[1] + shade, f.land[2] + shade];
      var i = (y * w + x) * 4;
      // 원화의 바다색은 뭍 안으로 가져오지 않는다. 어긋난 해안은 실제 지형의 종이색으로 메운다.
      if (pixels && pixels[i] > pixels[i + 1] * 1.08 && pixels[i] > pixels[i + 2] * 1.16) color = [pixels[i], pixels[i + 1], pixels[i + 2]];
      ctx.fillStyle = 'rgb(' + color.map(function (v) { return v | 0; }).join(',') + ')'; ctx.fillRect(x, y, step, step);
    }
    // 실제 해안에만 얇은 동판 선을 긋는다.
    ctx.fillStyle = '#65492699';
    for (var yy = 1; yy < rows - 1; yy++) for (var xx = 1; xx < cols - 1; xx++) {
      var k = yy * cols + xx;
      if (mask[k] && (!mask[k - 1] || !mask[k + 1] || !mask[k - cols] || !mask[k + cols])) ctx.fillRect(xx * step, yy * step, step, 1);
    }
    // 세계 원화가 없어도 실제 고도 자료를 따라 낮은 산맥을 새긴다.
    if (!pixels) {
      for (var ry = 10; ry < h - 10; ry += 11) for (var rx = 10; rx < w - 10; rx += 13) {
        if (!mask[Math.floor(ry / step) * cols + Math.floor(rx / step)]) continue;
        var lo = p.lon0 + rx / w * (p.lon1 - p.lon0), la = p.lat1 - ry / h * (p.lat1 - p.lat0), elevation = G.Geo.climate(lo, la).e;
        if (elevation < .34 || noise(rx, ry) < .45) continue;
        var peak = 3 + elevation * 9; ctx.strokeStyle = '#84613577'; ctx.lineWidth = .7;
        ctx.beginPath(); ctx.moveTo(rx - 4, ry + 3); ctx.lineTo(rx, ry - peak); ctx.lineTo(rx + 5, ry + 3); ctx.moveTo(rx, ry - peak); ctx.lineTo(rx + 1, ry + 2); ctx.stroke();
      }
    }
    // 가는 방위선. 국명과 표식은 이 위의 실제 글자와 단추다.
    ctx.strokeStyle = '#cda96533'; ctx.lineWidth = .65;
    [[w * .11, h * .24], [w * .79, h * .73]].forEach(function (c) {
      for (var n = 0; n < 16; n++) { var a = n * Math.PI / 8; ctx.beginPath(); ctx.moveTo(c[0] - Math.cos(a) * w, c[1] - Math.sin(a) * w); ctx.lineTo(c[0] + Math.cos(a) * w, c[1] + Math.sin(a) * w); ctx.stroke(); }
    });
    cache[pid] = cv; return cv;
  };

  function art(el, kind, key, rect) {
    if (!G.Img.has(key)) return;
    var wrap = U.el('span', 'ss-art ss-art-' + kind), im = new Image(); wrap.setAttribute('aria-hidden', 'true');
    im.alt = ''; im.draggable = false; im.src = G.Img.src(key);
    if (rect) im.style.cssText = 'width:' + rect[0] / rect[4] * 100 + '%;height:' + rect[1] / rect[5] * 100 + '%;left:' + -rect[2] / rect[4] * 100 + '%;top:' + -rect[3] / rect[5] * 100 + '%;';
    wrap.appendChild(im); el.insertBefore(wrap, el.firstChild);
  }
  function decorate(root) {
    [].forEach.call(root.querySelectorAll('.ss-plaque, .ss-go, .ss-back, .ss-return'), function (el) {
      if (el.querySelector('.ss-art')) return;
      var navy = el.classList.contains('ss-plaque') || el.classList.contains('ss-go'), kind = navy ? 'navy' : 'paper';
      art(el, kind, 'ui/storyselect/button-' + kind + '-ornate', fx().art[kind]);
    });
  }
  function portrait(m, large) {
    var f = fx().portraits, frame = f && f.frames[m.face];
    // 아래 여유가 있는 원본을 쓰면 얼굴을 줄여도 어깨가 이름표까지 이어진다.
    var chain = frame && frame.source ? [frame.source, m.face] : [m.face];
    return G.Img.make(chain, large ? 360 : 220, large ? 300 : 240, function () { var c = document.createElement('canvas'); c.width = 220; c.height = 240; return c; }, {
      fit: 'contain', fx: .5, fy: .4,
      post: function (ctx, w, h, key) {
        var f = fx().portraits, frame = f && f.frames[key], im = frame && G.Img.get(key);
        if (!im) return;
        // 얼굴의 실제 크기로 배율을 정하고 정수리를 같은 높이에 놓는다.
        var scale = h * f.headHeight / (im.naturalHeight * frame.height);
        // 카드에서는 어깨 아래가 이름표 뒤까지 이어지도록 원본의 아래끝도 채운다.
        if (!large) scale = Math.max(scale, h * (1 - f.top) / (im.naturalHeight * (1 - frame.top)));
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(im, w / 2 - im.naturalWidth * frame.centerX * scale, h * f.top - im.naturalHeight * frame.top * scale, im.naturalWidth * scale, im.naturalHeight * scale);
      }
    });
  }
  SL.open = async function () {
    await G.State.ready; await G.Game.ensureGeo();
    var modes = SL.list(); if (!modes.length) return;
    await Promise.all(['world', 'eu', 'ea'].map(function (id) { return G.Img.has('ui/storyselect/map-' + id) ? G.Img.load('ui/storyselect/map-' + id) : null; }));
    var f = fx(), slots = f.slots, sel = -1, focused = 0, rosterPage = 0, picked = null;
    var win = UI.window({ title: '이야기 모드', width: f.width, height: f.height, parch: false, clickAny: false,
      html: '<div class="ss-stage ss-atlas"><header class="ss-head"><button type="button" class="btn ss-return">‹ 타이틀로</button><h2 class="ss-plaque">이야기 모드</h2></header>' +
        '<div class="ss-layout"><aside class="ss-info" hidden></aside><div class="ss-right"><div class="ss-mapview"></div>' +
        '<div class="ss-roster-wrap"><button type="button" class="ss-roster-arrow ss-prev" aria-label="이전 캐릭터 다섯 명">‹</button><div class="ss-roster" aria-label="주인공 선택"></div>' +
        '<button type="button" class="ss-roster-arrow ss-next" aria-label="다음 캐릭터 다섯 명">›</button></div><p class="ss-hint">주인공을 선택하면 이야기를 볼 수 있습니다 · ← → 고르기 · Enter 열기</p></div></div></div>',
      onKey: function (e) {
        if (/^Arrow(Left|Right|Up|Down)$/.test(e.key)) { focused = (focused + (/Right|Down/.test(e.key) ? 1 : -1) + modes.length) % modes.length; show(focused, 'ss-card'); return true; }
        if (e.key === 'PageDown' || e.key === 'PageUp') { turn(e.key === 'PageDown' ? 1 : -1); return true; }
        if (e.key === 'Enter' || e.code === 'Space') {
          var button = e.target && e.target.closest && e.target.closest('button');
          if (button) button.click(); else if (sel < 0) show(focused); else start(); return true;
        }
        return false;
      }
    });
    win.el.classList.add('storyselect-win'); win.back.classList.add('storyselect-back');
    win.el.querySelector(':scope > .title').hidden = true;
    var stage = win.content.querySelector('.ss-stage'), info = stage.querySelector('.ss-info'), map = stage.querySelector('.ss-mapview');
    var roster = stage.querySelector('.ss-roster'), prev = stage.querySelector('.ss-prev'), next = stage.querySelector('.ss-next');
    stage.style.setProperty('--ss-slots', slots); stage.style.setProperty('--ss-info', f.infoWidth + '%');
    art(stage, 'frame', 'ui/storyselect/atlas-frame');
    function focusStory(kind) {
      var id = modes[focused].id;
      var target = Array.prototype.filter.call(stage.querySelectorAll('.' + kind), function (el) { return el.dataset.story === id; })[0];
      if (target) target.focus({ preventScroll: true });
    }
    function renderRoster() {
      roster.innerHTML = '';
      for (var j = 0; j < slots; j++) {
        var idx = rosterPage * slots + j, m = modes[idx];
        if (!m) { roster.appendChild(U.el('div', 'ss-empty', G.icon('compass') + '<span>새로운 이야기</span>')); continue; }
        var card = U.el('button', 'ss-card' + (idx === sel ? ' on' : '')); card.type = 'button'; card.dataset.story = m.id; card.dataset.page = region(m);
        card.setAttribute('aria-pressed', idx === sel ? 'true' : 'false'); card.setAttribute('aria-label', m.hero + ' — ' + m.title);
        art(card, 'panel', 'ui/storyselect/parchment-panel', f.art.panel);
        var face = U.el('span', 'ss-face'); face.appendChild(portrait(m, false)); card.appendChild(face);
        card.appendChild(U.el('span', 'nm ss-plaque', U.esc(m.hero)));
        card.onclick = (function (i) { return function () { show(i); }; })(idx);
        card.onfocus = (function (i) { return function () { focused = i; }; })(idx); roster.appendChild(card);
      }
      prev.hidden = next.hidden = modes.length <= slots; prev.disabled = rosterPage === 0; next.disabled = rosterPage === Math.ceil(modes.length / slots) - 1;
      stage.dataset.rosterPage = String(rosterPage + 1); decorate(stage);
    }
    function renderMap(pid) {
      var p = page(pid), z = size(p); stage.dataset.page = pid; map.innerHTML = '';
      var cv = document.createElement('canvas'); cv.width = z[0]; cv.height = z[1]; cv.className = 'ss-map ss-map-art';
      cv.dataset.projection = pid; cv.getContext('2d').drawImage(SL.mapCanvas(pid), 0, 0); map.appendChild(cv);
      // 국명은 원화·버튼과 분리해서 배치한다.
      var labels = pid === 'world' ? [['북아메리카',-110,47],['남아메리카',-62,-16],['유럽',18,52],['아프리카',20,7],['아시아',94,46],['오세아니아',138,-24]] :
        pid === 'eu' ? [['영국',-3,54],['포르투갈',-8.1,41],['에스파냐',-2.6,39.7],['네덜란드',7.7,53.5],['오스만',32.6,39.2]] : [['조선',127.5,38.5]];
      labels.forEach(function (a) {
        var pt = point(p, a[1], a[2]), label = U.el('span', 'ss-country', U.esc(a[0])); label.style.left = pt[0] / z[0] * 100 + '%'; label.style.top = pt[1] / z[1] * 100 + '%'; map.appendChild(label);
        SL._labels = SL._labels || {}; SL._labels[pid + ':' + a[0]] = [pt[0], pt[1]];
      });
      modes.forEach(function (m, index) {
        if (pid !== 'world' && region(m) !== pid) return;
        var a = anchor(m), pt = point(p, a[0], a[1]), city = G.CITY_DATA[m.city];
        var marker = U.el('button', 'ss-port' + (index === sel ? ' on' : ''), '<svg viewBox="0 0 24 40" aria-hidden="true"><path d="M12 39C10 29 1 22 1 13a11 11 0 0 1 22 0c0 9-9 16-11 26Z"/><circle cx="12" cy="13" r="6"/><path class="ss-pin-cross" d="M12 3v20M2 13h20"/></svg><i class="ss-pin-tip"></i><span>' + U.esc(city.name) + '</span>');
        marker.type = 'button'; marker.dataset.story = m.id; marker.dataset.lon = a[0]; marker.dataset.lat = a[1];
        marker.style.left = pt[0] / z[0] * 100 + '%'; marker.style.top = pt[1] / z[1] * 100 + '%';
        marker.setAttribute('aria-label', city.name + ' — ' + m.hero); marker.onclick = function () { show(index); };
        if (pid === 'world') {
          marker.classList.add('ss-world-port');
          var end = { photo: [-25, 60], jhook: [-25, -8], gold: [65, 12] }[m.id];
          if (end) marker.insertAdjacentHTML('afterbegin', '<svg class="ss-callout" viewBox="0 0 24 40" aria-hidden="true"><path d="M12 40L' + end[0] + ' ' + end[1] + '"/></svg>');
        }
        map.appendChild(marker);
      });
      map.setAttribute('aria-label', pid === 'world' ? '주인공들의 출발지를 표시한 세계 지도' : pid === 'ea' ? '동아시아 지도' : '유럽 지도');
    }
    function show(i, focusKind) {
      var active = document.activeElement;
      if (!focusKind && active && stage.contains(active)) focusKind = active.classList.contains('ss-port') ? 'ss-port' : active.classList.contains('ss-card') ? 'ss-card' : null;
      sel = focused = i; var m = modes[i]; rosterPage = Math.floor(i / slots); stage.classList.add('inf'); stage.dataset.story = m.id; info.hidden = false;
      info.innerHTML = '<div class="ss-person"><div class="ss-portrait"></div><div class="ss-heading"><div class="ss-plaque ss-name">' + U.esc(m.hero) + '</div><h3>' + U.esc(m.title) + '</h3><div class="ss-year">' + U.esc(m.year) + '</div></div></div>' +
        '<div class="ss-tag">' + U.esc(m.sub || m.tag) + '</div><div class="ss-copy" tabindex="0" data-native-scroll aria-label="이야기 소개"><p class="ss-synopsis">' + U.esc(m.synopsis) + '</p><p class="ss-party"><b>함께 떠나는 사람</b><br>' + U.esc(m.party) + '</p></div>' +
        '<div class="ss-actions"><button type="button" class="btn navy ss-go">이 이야기로 시작</button><button type="button" class="btn ss-back">다른 사람을 고른다</button></div>';
      art(info, 'panel', 'ui/storyselect/parchment-panel', f.art.panel); info.querySelector('.ss-portrait').appendChild(portrait(m, true));
      info.querySelector('.ss-go').onclick = start; info.querySelector('.ss-back').onclick = closeInfo;
      renderMap(region(m)); renderRoster();
      if (focusKind) focusStory(focusKind);
    }
    function closeInfo() { sel = -1; info.hidden = true; info.innerHTML = ''; stage.classList.remove('inf'); delete stage.dataset.story; renderMap('world'); renderRoster(); focusStory('ss-card'); }
    function turn(step) { var n = Math.max(0, Math.min(Math.ceil(modes.length / slots) - 1, rosterPage + step)); if (n !== rosterPage) { rosterPage = n; focused = n * slots; renderRoster(); focusStory('ss-card'); } }
    function start() { if (sel < 0 || picked) return; picked = modes[sel]; win.close('go'); }
    stage.querySelector('.ss-return').onclick = function () { win.close(null); }; prev.onclick = function () { turn(-1); }; next.onclick = function () { turn(1); };
    renderMap('world'); renderRoster(); focusStory('ss-card'); var v = await win.result; if (v === 'go' && picked) await picked.begin();
  };
})(window.G = window.G || {});
