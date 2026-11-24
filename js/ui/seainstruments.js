/* 원형 항해 계기·확대 조작. 바람·배율의 계산과 버튼 동작은 sea.js가 맡는다. */
(function (G) {
  'use strict';
  var I = G.SeaInstruments = {}, watching = false;
  function text(s) { return G.U.esc(G.T ? G.T(s) : s); }
  function spriteStyle(r) {
    var a = G.FX.seaInstruments.art;
    return 'background-size:' + a.width / r[2] * 100 + '% ' + a.height / r[3] * 100 + '%;background-position:' + r[0] / (a.width - r[2]) * 100 + '% ' + r[1] / (a.height - r[3]) * 100 + '%;';
  }
  function plate(kind) {
    var a = G.FX.seaInstruments.art, paper = kind === 'paper';
    return '<span class="si-plate-art ' + (paper ? 'si-paper-art' : 'si-navy-art') + '" aria-hidden="true"><span class="si-sprite" style="' + spriteStyle(a[kind]) + '"></span><span class="si-text-clear"><span class="si-sprite" style="' + spriteStyle(a[paper ? 'paperFill' : 'navyFill']) + '"></span></span></span>';
  }
  I.rows = function (v) {
    var rows = [ ['direction', v.direction], ['strength', '풍속'], ['relation', v.relation], ['cloud', v.cloud] ];
    if (v.monsoon) rows.push(['monsoon', v.monsoon]);
    if (v.rain) rows.push(['rain', v.rain]);
    if (v.rowing) rows.push(['rowing', '노 젓는 중']);
    var tips = { cloud: '구름이 흘러가는 쪽이 바람이 부는 쪽 — 그쪽으로 달리면 순풍을 탄다', monsoon: v.monsoonTip, rain: v.rainTip,
      rowing: '돛이 바람을 못 받아 선원들이 노를 젓는다 — 오래 저으면 지친다' };
    return rows.map(function (r) {
      var title = tips[r[0]] || r[1];
      var value = r[0] === 'strength' ? '<span>' + text('풍속') + '</span><span class="wi-pips" aria-hidden="true">' + [0, 1, 2, 3, 4].map(function (i) { return '<i class="wi-pip' + (i < v.strength ? ' filled' : '') + '"></i>'; }).join('') + '</span>' : text(r[1]);
      return '<div class="wi-row" data-wind-row="' + r[0] + '" style="width:min(100%,' + (G.FX.seaInstruments.plaqueWidths[r[0]] || 184) + 'px)" title="' + text(title) + '"' + (r[0] === 'strength' ? ' aria-label="' + text('풍속') + ' ' + v.strength + '/5"' : '') + '>' + plate('paper') + '<span class="wi-copy">' + value + '</span></div>';
    }).join('');
  };
  I.compass = function (canvas, wind, heading) {
    var ctx = canvas.getContext('2d'), size = canvas.width;
    ctx.clearRect(0, 0, size, size); ctx.save(); ctx.translate(size / 2, size / 2); ctx.scale(size / 260, size / 260);
    var face = ctx.createRadialGradient(-30, -50, 0, 0, 0, 130);
    face.addColorStop(0, '#29435a'); face.addColorStop(1, '#102337');
    ctx.fillStyle = face; ctx.beginPath(); ctx.arc(0, 0, 128, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d5b36b'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 123, 0, Math.PI * 2); ctx.stroke();
    for (var n = 0; n < 72; n++) {
      var a = n * Math.PI / 36, outer = 116, inner = n % 9 === 0 ? 103 : n % 3 === 0 ? 107 : 111;
      ctx.strokeStyle = n % 3 === 0 ? '#f4d890' : '#bca36e'; ctx.lineWidth = n % 9 === 0 ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner); ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer); ctx.stroke();
    }
    ctx.font = '700 28px Georgia,serif'; ctx.fillStyle = '#f9e5ad'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [['N', 0, -88], ['E', 89, 0], ['S', 0, 89], ['W', -89, 0]].forEach(function (p) { ctx.fillText(p[0], p[1], p[2]); });
    // 하늘색은 바람이 불어가는 쪽, 밝은 바늘은 실제 뱃머리. 기존 항해의 각도를 그대로 쓴다.
    ctx.save(); ctx.rotate(-wind);
    var breeze = ctx.createLinearGradient(0, -19, 0, 19); breeze.addColorStop(0, '#e0f2ff'); breeze.addColorStop(.5, '#b3ddff'); breeze.addColorStop(1, '#6eacd9');
    ctx.fillStyle = breeze; ctx.strokeStyle = '#16334a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-67, -4); ctx.lineTo(48, -4); ctx.lineTo(44, -19); ctx.lineTo(76, 0); ctx.lineTo(44, 19); ctx.lineTo(48, 4); ctx.lineTo(-67, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    // 뱃머리는 황동의 모서리·상아색 면·갈라진 꼬리가 있는 입체적인 창 모양 바늘이다.
    ctx.save(); ctx.rotate(-heading); ctx.shadowColor = '#0009'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
    var metal = ctx.createLinearGradient(0, -13, 0, 13); metal.addColorStop(0, '#fff9dc'); metal.addColorStop(.45, '#f9e8bb'); metal.addColorStop(.53, '#c39a4a'); metal.addColorStop(1, '#e8cc82');
    ctx.fillStyle = metal; ctx.strokeStyle = '#79501f'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(69, 0); ctx.lineTo(7, -11); ctx.lineTo(-31, -6); ctx.lineTo(-48, -12); ctx.lineTo(-40, 0); ctx.lineTo(-48, 12); ctx.lineTo(-31, 6); ctx.lineTo(7, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.strokeStyle = '#b28b44'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-39, 0); ctx.lineTo(66, 0); ctx.stroke();
    ctx.strokeStyle = '#fff8dc'; ctx.beginPath(); ctx.moveTo(9, -8); ctx.lineTo(58, -1.8); ctx.stroke(); ctx.restore();
    var hub = ctx.createRadialGradient(-2, -3, 0, 0, 0, 9); hub.addColorStop(0, '#ffedb6'); hub.addColorStop(1, '#aa7a32');
    ctx.fillStyle = hub; ctx.strokeStyle = '#6d4e25'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  };
  I.fit = function () {
    var screen = G.UI.screen(), wb = screen && screen.querySelector('.wind-medallions'), zb = screen && screen.querySelector('.zoom-medallions');
    if (!wb || !zb) return;
    var f = G.FX.seaInstruments, compact = screen.clientWidth < f.compactAt;
    var sig = screen.clientWidth + '|' + (document.fonts ? document.fonts.status : '') + '|' + wb.querySelector('.wtxt').textContent;
    if (wb._wiFit === sig) return; wb._wiFit = sig;
    var vars = { width: compact ? f.compactWidth : f.windWidth, compass: compact ? f.compactCompass : f.compass,
      row: compact ? f.compactRow : f.rowHeight, gap: f.gap, font: compact ? f.compactFont : f.font, bottom: compact ? f.compactWindBottom : f.windBottom };
    Object.keys(vars).forEach(function (k) { wb.style.setProperty('--wi-' + k, vars[k] + 'px'); });
    zb.style.setProperty('--zi-width', (compact ? f.compactZoomWidth : f.zoomWidth) + 'px'); zb.style.top = (compact ? f.compactZoomTop : f.zoomTop) + 'px';
    zb.classList.toggle('zi-compact', compact);
    wb.classList.toggle('wi-compact', compact);
    [].forEach.call(wb.querySelectorAll('.wi-row'), function (row) {
      var copy = row.querySelector('.wi-copy'), size = compact ? f.compactFont : f.font; row.style.fontSize = size + 'px';
      while (size > f.minFont && copy.scrollWidth > copy.clientWidth + 1) row.style.fontSize = --size + 'px';
    });
    if (G.HudPin) G.HudPin.fit();
  };
  I.mount = function (wb, zb) {
    if (wb.classList.contains('wind-medallions')) return;
    var U = G.U, cv = wb.querySelector('canvas'), disc = U.el('div', 'wi-compass'), column = U.el('div', 'wi-compass-column');
    var art = G.FX.seaInstruments.art, src = new URL(G.Img.src(art.key), document.baseURI).href;
    G.UI.screen().style.setProperty('--si-reference', 'url("' + src + '")');
    wb.classList.remove('wood', 'brass-frame'); wb.classList.add('wind-medallions');
    disc.appendChild(cv); column.appendChild(disc);
    // 원본 이미지의 황동 고리만 배경으로 쓰고, 안쪽은 실제 바늘을 그리는 캔버스로 덮는다.
    disc.style.setProperty('--si-compass-size', art.width / art.compass[2] * 100 + '% ' + art.height / art.compass[3] * 100 + '%');
    disc.style.setProperty('--si-compass-pos', art.compass[0] / (art.width - art.compass[2]) * 100 + '% ' + art.compass[1] / (art.height - art.compass[3]) * 100 + '%');
    column.appendChild(U.el('div', 'wi-legend', plate('navy') + '<span class="wi-wind-arrow">➜</span><span>' + text('바람') + '</span><span class="wi-heading-arrow">➜</span><span>' + text('뱃머리') + '</span>'));
    wb.insertBefore(column, wb.firstChild); cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', '바람과 뱃머리 방향');
    var buttons = zb.querySelectorAll('button'), output = zb.querySelector('output'), zoomRow = U.el('div', 'zi-rounds'), actions = U.el('div', 'zi-actions');
    var title = U.el('div', 'zi-title', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6"/></svg><span>' + text('시야') + '</span>');
    ['out', 'in', 'ship', 'reset'].forEach(function (key, i) { buttons[i].dataset.zoomAction = key; buttons[i].type = 'button'; buttons[i].classList.add(i < 2 ? 'zi-round' : 'zi-action');
      if (i < 2) { buttons[i].style.setProperty('--si-disc-size', art.width / art.round[2] * 100 + '% ' + art.height / art.round[3] * 100 + '%'); buttons[i].style.setProperty('--si-disc-pos', art.round[0] / (art.width - art.round[2]) * 100 + '% ' + art.round[1] / (art.height - art.round[3]) * 100 + '%'); }
      else buttons[i].insertAdjacentHTML('afterbegin', plate(i === 2 ? 'navy' : 'paper'));
    });
    output.style.setProperty('--si-disc-size', art.width / art.readout[2] * 100 + '% ' + art.height / art.readout[3] * 100 + '%');
    output.style.setProperty('--si-disc-pos', art.readout[0] / (art.width - art.readout[2]) * 100 + '% ' + art.readout[1] / (art.height - art.readout[3]) * 100 + '%');
    title.insertAdjacentHTML('afterbegin', plate('navy'));
    zoomRow.appendChild(buttons[0]); zoomRow.appendChild(output); zoomRow.appendChild(buttons[1]);
    actions.appendChild(buttons[2]); actions.appendChild(buttons[3]);
    zb.classList.remove('wood', 'brass-frame'); zb.classList.add('zoom-medallions'); zb.replaceChildren(title, zoomRow, actions);
    output.setAttribute('aria-label', '현재 지도 배율');
    zb.addEventListener('keydown', function (e) {
      var b = e.target.closest('button'); if (!b || !zb.contains(b)) return;
      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) b.click(); return; }
      var bs = [].slice.call(zb.querySelectorAll('button')), i = bs.indexOf(b), n = e.key === 'ArrowRight' ? (i + 1) % bs.length : e.key === 'ArrowLeft' ? (i + bs.length - 1) % bs.length : -1;
      if (n >= 0) { e.preventDefault(); e.stopPropagation(); bs[n].focus(); }
    });
    I.fit();
    if (!watching) {
      watching = true;
      if (window.ResizeObserver) new ResizeObserver(I.fit).observe(document.getElementById('ui')); else window.addEventListener('resize', I.fit);
      if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', I.fit);
    }
  };
})(window.G = window.G || {});
