/* 항해·해도·육상 탐험이 함께 쓰는 투명 도시 모형.
   도시 자료의 큰 양식(style)을 국가·지리로 한 번 더 나누어 작은 크기에서도 문화권이 읽히게 한다. */
(function (G) {
  'use strict';
  var CI = {};
  G.CityIcon = CI;

  var PAL = {
    iberia: ['#eadfc9', '#b6532d', '#5b3525'], italy: ['#dfbd83', '#a94f2d', '#5a3423'],
    greek: ['#eee9dc', '#738594', '#554437'], france: ['#ddd2bd', '#9b4d32', '#49372e'],
    britain: ['#b7aa91', '#4d4a47', '#40352d'], germany: ['#d3b991', '#543b31', '#382c28'],
    easteurope: ['#d9c7a6', '#75452f', '#44352d'], nordic: ['#ae8765', '#443f3b', '#302c29'],
    russia: ['#e4d8c4', '#4e7a65', '#513b2d'], islam: ['#e3d2ae', '#5e8d82', '#51412f'],
    arabia: ['#cfaa73', '#9a653d', '#503a29'], persia: ['#d9c59c', '#2990a1', '#4e4033'],
    westafrica: ['#b97946', '#704327', '#4d3324'], eastafrica: ['#e5ddca', '#8b6a45', '#4a3d31'],
    india: ['#d9ad73', '#d2a33c', '#583b2c'], southeast: ['#b98d55', '#c89e37', '#503a29'],
    maritime: ['#a66f42', '#553b2c', '#3c3028'], philippines: ['#b89361', '#765036', '#46362a'],
    china: ['#d9cfb9', '#a33e2e', '#49332d'], mongolia: ['#e0d5be', '#477c83', '#493c33'],
    korea: ['#e8e1d3', '#3e5154', '#44352e'], japan: ['#eee7d8', '#343b42', '#46332b'],
    vietnam: ['#d9c7a4', '#8f3228', '#47362d'], inca: ['#9e9280', '#bf9b55', '#463c33'],
    aztec: ['#c9b38b', '#8b4430', '#44362d'], mexico: ['#ead8b6', '#a84f2f', '#4a372b'],
    colonial: ['#eadfc9', '#a95131', '#4c382d'], native: ['#9c734a', '#6f5135', '#403229']
  };
  var CULTURE_NAME = {
    iberia: '이베리아', italy: '이탈리아', greek: '그리스', islam: '이슬람권', arabia: '아라비아', persia: '페르시아·중앙아시아',
    france: '프랑스', britain: '영국·아일랜드', germany: '독일·저지대', easteurope: '동유럽', nordic: '북유럽', russia: '러시아',
    china: '중국', mongolia: '몽골·초원', korea: '조선', japan: '일본', vietnam: '대월', india: '인도',
    southeast: '동남아시아', maritime: '해양 동남아시아', philippines: '필리핀', westafrica: '서아프리카', eastafrica: '동아프리카',
    inca: '안데스·잉카', aztec: '아즈텍·마야', mexico: '누에바 에스파냐', colonial: '아메리카 개척도시', native: '토착 마을'
  };

  function has(s, words) { s = s || ''; for (var i = 0; i < words.length; i++) if (s.indexOf(words[i]) >= 0) return true; return false; }
  function capital(c) { return !!(c.flags && c.flags.indexOf('P') >= 0); }
  CI.tier = function (c) { return capital(c) ? 4 : Math.max(1, Math.min(3, c.size || 1)); };
  CI.label = function (c) { return ['', '소도시', '중도시', '대도시', '수도'][CI.tier(c)]; };

  /** 큰 도시 양식 안에서도 나라와 위치를 보아 지도용 문화권을 고른다. iconCulture는 시험·특수 도시용 덮어쓰기다. */
  CI.culture = function (c) {
    if (c.iconCulture && PAL[c.iconCulture]) return c.iconCulture;
    var n = c.nation || '', name = c.name || '';
    if (c.style === 'ib') return n === '프랑스' ? 'france' : 'iberia';
    if (c.style === 'it') return n === '프랑스' ? 'france' : (n === '라구사 공화국' ? 'easteurope' : 'italy');
    if (c.style === 'gr') return has(name, ['아테네', '살로니카', '간디아', '파마가스타']) ? 'greek' : 'easteurope';
    if (c.style === 'ne') {
      if (has(n, ['프랑스', '브르타뉴'])) return 'france';
      if (has(n, ['잉글랜드', '스코틀랜드', '아일랜드'])) return 'britain';
      if (has(n, ['스웨덴', '덴마크']) || has(name, ['리가', '비즈비', '단치히', '쾨니히스베르크'])) return 'nordic';
      if (has(n, ['폴란드', '보헤미아', '헝가리'])) return 'easteurope';
      return 'germany';
    }
    if (c.style === 'ru') return name === '키에프' ? 'easteurope' : 'russia';
    if (c.style === 'is') {
      if ((c.lon || 0) >= 34 && (c.lat || 0) <= 34 && !has(n, ['오스만'])) return 'arabia';
      return 'islam';
    }
    if (c.style === 'pe') return 'persia';
    if (c.style === 'af') return (c.lon || 0) > 25 ? 'eastafrica' : 'westafrica';
    if (c.style === 'sw') return 'eastafrica';
    if (c.style === 'in') return 'india';
    if (c.style === 'cn') return has(n, ['대월']) ? 'vietnam' : 'china';
    if (c.style === 'kr') return 'korea';
    if (c.style === 'jp') return 'japan';
    if (c.style === 'st') return 'mongolia';
    if (c.style === 'az') return 'aztec';
    if (c.style === 'an') return (c.founded || 0) >= 1492 ? 'colonial' : 'inca';
    if (c.style === 'co') return has(name, ['멕시코', '베라크루스', '아카풀코']) ? 'mexico' : 'colonial';
    if (c.style === 'se') {
      if (has(n, ['필리핀', '마닐라', '세부'])) return 'philippines';
      if (has(n, ['아체', '팔렘방', '반텐', '마자파힛', '브루나이', '테르나테']) || (c.lon || 0) > 105 && (c.lat || 0) < 8) return 'maritime';
      return 'southeast';
    }
    if (c.style === 'tr') return c.region === 10 ? 'native' : 'westafrica';
    return 'iberia';
  };
  CI.cultureName = function (c) { return CULTURE_NAME[CI.culture(c)] || '도시'; };

  CI.metrics = function (c, scale) {
    var t = CI.tier(c), s = scale || 1, w = [0, 22, 30, 38, 46][t], h = [0, 19, 27, 35, 43][t];
    return { width: (w + 8) * s, height: (h + 12) * s, radius: (Math.max(w, h) * .56 + 5) * s,
      top: -(h * .5 + 7) * s, base: (h * .5 + 5) * s };
  };

  function rect(ctx, x, y, w, h, fill, stroke) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); if (stroke) { ctx.strokeStyle = stroke; ctx.strokeRect(x, y, w, h); } }
  function poly(ctx, pts, fill, stroke) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); } }
  function arch(ctx, x, y, w, h, fill) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * .42); ctx.arc(x + w / 2, y + h * .42, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  function roof(ctx, x, y, w, col, out, steep, curved) {
    if (curved) { ctx.beginPath(); ctx.moveTo(x - 2, y + 1); ctx.quadraticCurveTo(x + w * .14, y + 2, x + w * .25, y - 4); ctx.lineTo(x + w * .75, y - 4); ctx.quadraticCurveTo(x + w * .86, y + 2, x + w + 2, y + 1); ctx.quadraticCurveTo(x + w * .72, y + 4, x + w * .5, y + 2); ctx.quadraticCurveTo(x + w * .25, y + 4, x - 2, y + 1); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = out; ctx.stroke(); }
    else poly(ctx, [[x - 1, y], [x + w / 2, y - w * (steep ? .72 : .36)], [x + w + 1, y]], col, out);
  }
  function dome(ctx, x, y, w, col, out, onion) { ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x, y - w * .36, x + w * .2, y - w * .62, x + w / 2, y - w * (onion ? .82 : .64)); ctx.bezierCurveTo(x + w * .8, y - w * .62, x + w, y - w * .36, x + w, y); ctx.quadraticCurveTo(x + w / 2, y + (onion ? 2 : 0), x, y); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = out; ctx.stroke(); }
  function crenel(ctx, x, y, w, col, out) { rect(ctx, x, y, w, 3, col, out); ctx.fillStyle = col; for (var i = 0; i <= 4; i++) ctx.fillRect(x + i * w / 4 - (i === 4 ? 2 : 0), y - 3, 2, 3); }
  function windowRow(ctx, x, y, w, n, col) { ctx.fillStyle = col; for (var i = 0; i < n; i++) ctx.fillRect(x + (i + .5) * w / n - 1, y, 2, 3); }
  function cross(ctx, x, y, out) { ctx.strokeStyle = out; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 5); ctx.moveTo(x - 2, y - 3); ctx.lineTo(x + 2, y - 3); ctx.stroke(); }
  function door(ctx, x, base, visited) { arch(ctx, x - 2.4, base - 6.5, 4.8, 6.5, visited ? '#8a2d25' : '#413127'); }
  function flag(ctx, x, y, col, out) { ctx.strokeStyle = out; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.lineTo(x, y - 2); ctx.stroke(); poly(ctx, [[x, y - 2], [x + 6, y], [x, y + 2]], col, out); }

  function european(ctx, k, t, w, base, p, out, visited) {
    var wall = p[0], rc = p[1], dark = p[2], hallW = w * .54, hallH = 8 + t * 1.5;
    if (k === 'britain') {
      rect(ctx, -hallW / 2, base - hallH - 3, hallW, hallH + 3, wall, out); crenel(ctx, -hallW / 2, base - hallH - 3, hallW, wall, out);
      if (t >= 2) [-1, 1].forEach(function (s) { var x = s * (w / 2 - 4); rect(ctx, x - 3.5, base - 14, 7, 14, wall, out); crenel(ctx, x - 3.5, base - 14, 7, wall, out); });
    } else if (k === 'germany') {
      rect(ctx, -hallW / 2, base - hallH, hallW, hallH, wall, out); roof(ctx, -hallW / 2, base - hallH, hallW, rc, out, true);
      ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-hallW / 2, base - hallH); ctx.lineTo(hallW / 2, base); ctx.moveTo(hallW / 2, base - hallH); ctx.lineTo(-hallW / 2, base); ctx.moveTo(0, base - hallH - hallW * .68); ctx.lineTo(0, base); ctx.stroke();
      if (t >= 2) { rect(ctx, w * .28, base - 15, 5, 15, wall, out); roof(ctx, w * .28, base - 15, 5, dark, out, true); }
    } else if (k === 'nordic') {
      rect(ctx, -hallW / 2, base - 7, hallW, 7, wall, out); roof(ctx, -hallW / 2, base - 7, hallW, rc, out, true);
      if (t >= 2) { rect(ctx, -3, base - 17, 6, 10, wall, out); roof(ctx, -3, base - 17, 6, dark, out, true); }
      ctx.strokeStyle = '#d7b56d'; ctx.beginPath(); ctx.moveTo(-hallW / 2 + 2, base - 1); ctx.lineTo(0, base - 6); ctx.lineTo(hallW / 2 - 2, base - 1); ctx.stroke();
    } else {
      rect(ctx, -hallW / 2, base - hallH, hallW, hallH, wall, out); roof(ctx, -hallW / 2, base - hallH, hallW, rc, out, k === 'france');
      if (k === 'italy') { var bx = hallW / 2 + 2; rect(ctx, bx, base - 17 - t, 5, 17 + t, wall, out); roof(ctx, bx, base - 17 - t, 5, rc, out, false); windowRow(ctx, bx, base - 14, 5, 1, dark); }
      else if (k === 'greek') { dome(ctx, -5, base - hallH, 10, rc, out, false); cross(ctx, 0, base - hallH - 6, out); }
      else if (t >= 2) [-1, 1].forEach(function (s) { var x = s * (w / 2 - 4); rect(ctx, x - 3, base - 13 - t, 6, 13 + t, wall, out); roof(ctx, x - 3, base - 13 - t, 6, rc, out, true); });
    }
    if (k === 'iberia') crenel(ctx, -hallW / 2 + 1, base - hallH, hallW - 2, wall, out);
    windowRow(ctx, -hallW / 2 + 1, base - hallH + 4, hallW - 2, Math.max(2, t + 1), dark); door(ctx, 0, base, visited);
  }

  function domedCity(ctx, k, t, w, base, p, out, visited) {
    var wall = p[0], rc = p[1], dark = p[2], bw = w * .62, bh = 8 + t;
    rect(ctx, -bw / 2, base - bh, bw, bh, wall, out);
    if (k === 'arabia') {
      crenel(ctx, -bw / 2, base - bh, bw, wall, out);
      if (t >= 2) [-1, 1].forEach(function (s) { var x = s * (w / 2 - 4); rect(ctx, x - 3, base - 15, 6, 15, wall, out); crenel(ctx, x - 3, base - 15, 6, wall, out); });
    } else if (k === 'westafrica') {
      var count = t >= 3 ? 3 : 2;
      for (var i = 0; i < count; i++) { var x2 = (i - (count - 1) / 2) * (w * .32), th = 13 + (i === Math.floor(count / 2) ? 5 : 0); poly(ctx, [[x2 - 3.5, base], [x2 - 2.5, base - th], [x2 + 2.5, base - th], [x2 + 3.5, base]], wall, out); crenel(ctx, x2 - 2.5, base - th, 5, wall, out); for (var q = 0; q < 3; q++) { ctx.strokeStyle = dark; ctx.beginPath(); ctx.moveTo(x2 - 5, base - th + 4 + q * 4); ctx.lineTo(x2 + 5, base - th + 4 + q * 4); ctx.stroke(); } }
    } else if (k === 'eastafrica') {
      dome(ctx, -bw * .2, base - bh, bw * .4, rc, out, false); rect(ctx, w * .31, base - 17, 4, 17, wall, out); roof(ctx, w * .31, base - 17, 4, rc, out, true);
    } else {
      dome(ctx, -bw * .28, base - bh, bw * .56, rc, out, k === 'russia');
      var n = t >= 3 ? 2 : 1;
      for (var j = 0; j < n; j++) { var s = n === 1 ? 1 : (j ? 1 : -1), x = s * (w / 2 - 3); rect(ctx, x - 2, base - 16 - t, 4, 16 + t, wall, out); if (k === 'russia') dome(ctx, x - 3, base - 16 - t, 6, rc, out, true); else roof(ctx, x - 2.5, base - 16 - t, 5, rc, out, true); }
      if (k === 'persia') { ctx.strokeStyle = '#e4d5a8'; ctx.strokeRect(-bw * .21, base - bh + 2, bw * .42, bh - 2); }
    }
    windowRow(ctx, -bw / 2 + 2, base - bh + 4, bw - 4, Math.max(2, t + 1), dark); door(ctx, 0, base, visited);
  }

  function asia(ctx, k, t, w, base, p, out, visited) {
    var wall = p[0], rc = p[1], dark = p[2], bw = w * .75;
    if (k === 'mongolia') {
      var n = t >= 3 ? 3 : t;
      for (var i = 0; i < n; i++) { var ww = i === Math.floor(n / 2) ? 12 : 9, x = (i - (n - 1) / 2) * 10; rect(ctx, x - ww / 2, base - 5, ww, 5, wall, out); ctx.beginPath(); ctx.ellipse(x, base - 5, ww / 2, ww * .28, 0, Math.PI, 0); ctx.fillStyle = rc; ctx.fill(); ctx.strokeStyle = out; ctx.stroke(); }
      flag(ctx, 0, base - 13, '#3d8790', out); door(ctx, 0, base, visited); return;
    }
    if (k === 'india') {
      rect(ctx, -bw / 2, base - 8, bw, 8, wall, out); poly(ctx, [[-6, base - 8], [-5, base - 15], [0, base - 24 - t], [5, base - 15], [6, base - 8]], rc, out);
      if (t >= 2) [-1, 1].forEach(function (s) { var x = s * (w / 2 - 5); rect(ctx, x - 3, base - 11, 6, 11, wall, out); dome(ctx, x - 3, base - 11, 6, '#eadfc9', out, true); });
      door(ctx, 0, base, visited); return;
    }
    if (k === 'southeast') {
      rect(ctx, -bw / 2, base - 6, bw, 6, wall, out); var levels = t === 1 ? 2 : t + 1;
      for (var q = 0; q < levels; q++) { var ww2 = bw * (1 - q * .17), y = base - 6 - q * 5; rect(ctx, -ww2 / 2, y - 3, ww2, 3, wall, out); roof(ctx, -ww2 / 2, y - 3, ww2, q === levels - 1 ? '#d2a33c' : rc, out, false, true); }
      door(ctx, 0, base, visited); return;
    }
    if (k === 'maritime' || k === 'philippines') {
      var hh = k === 'philippines' ? 7 : 9; rect(ctx, -bw / 2, base - hh, bw, hh, wall, out); roof(ctx, -bw / 2 - 1, base - hh, bw + 2, rc, out, true, false);
      ctx.strokeStyle = dark; for (var s2 = -1; s2 <= 1; s2 += 2) { ctx.beginPath(); ctx.moveTo(s2 * bw * .36, base); ctx.lineTo(s2 * bw * .36, base + 3); ctx.stroke(); }
      if (t >= 3 && k === 'maritime') { rect(ctx, -5, base - hh - 9, 10, 7, wall, out); roof(ctx, -5, base - hh - 9, 10, rc, out, true); }
      door(ctx, 0, base, visited); return;
    }
    var levels2 = k === 'japan' ? Math.min(3, t) : (t >= 3 ? 2 : 1);
    rect(ctx, -bw / 2, base - 7, bw, 7, wall, out); roof(ctx, -bw / 2, base - 7, bw, rc, out, false, true);
    for (var l = 1; l < levels2; l++) { var uw = bw * (k === 'japan' ? 1 - l * .24 : .58), y2 = base - 7 - l * 7; rect(ctx, -uw / 2, y2, uw, 5, wall, out); roof(ctx, -uw / 2, y2, uw, rc, out, false, true); }
    if (k === 'korea') { crenel(ctx, -bw / 2 + 1, base - 7, bw - 2, wall, out); rect(ctx, -4, base - 14, 8, 5, wall, out); roof(ctx, -4, base - 14, 8, rc, out, false, true); }
    if (k === 'vietnam' && t >= 2) { rect(ctx, w * .3, base - 14, 5, 14, wall, out); roof(ctx, w * .3, base - 14, 5, rc, out, true, true); }
    windowRow(ctx, -bw / 2 + 2, base - 5, bw - 4, Math.max(2, t + 1), dark); door(ctx, 0, base, visited);
  }

  function america(ctx, k, t, w, base, p, out, visited) {
    var wall = p[0], rc = p[1], dark = p[2];
    if (k === 'aztec') {
      var lv = t + 1; for (var i = 0; i < lv; i++) { var ww = w - i * 5, y = base - (i + 1) * 4; rect(ctx, -ww / 2, y, ww, 4, i % 2 ? rc : wall, out); }
      rect(ctx, -4, base - lv * 4 - 5, 8, 5, wall, out); crenel(ctx, -4, base - lv * 4 - 5, 8, wall, out); door(ctx, 0, base, visited); return;
    }
    if (k === 'inca') {
      var lv2 = t + 1; for (var j = 0; j < lv2; j++) { var ww2 = w - j * 6, y2 = base - (j + 1) * 5; poly(ctx, [[-ww2 / 2, y2 + 5], [-ww2 * .43, y2], [ww2 * .43, y2], [ww2 / 2, y2 + 5]], j % 2 ? rc : wall, out); }
      poly(ctx, [[-3, base], [-2, base - 7], [2, base - 7], [3, base]], dark); return;
    }
    if (k === 'native') {
      var n = t >= 3 ? 3 : t; for (var q = 0; q < n; q++) { var x = (q - (n - 1) / 2) * 9; rect(ctx, x - 4, base - 5, 8, 5, wall, out); roof(ctx, x - 4, base - 5, 8, rc, out, true); }
      door(ctx, 0, base, visited); return;
    }
    rect(ctx, -w * .34, base - 8, w * .68, 8, wall, out);
    if (k === 'mexico') [-1, 1].forEach(function (s) { var x2 = s * (w * .25); rect(ctx, x2 - 3, base - 17, 6, 17, wall, out); roof(ctx, x2 - 3, base - 17, 6, rc, out, false); cross(ctx, x2, base - 19, out); });
    else { crenel(ctx, -w * .34, base - 8, w * .68, wall, out); rect(ctx, w * .16, base - 16, 6, 16, wall, out); roof(ctx, w * .16, base - 16, 6, rc, out, false); }
    if (t >= 3) { rect(ctx, -w / 2, base - 5, w * .18, 5, wall, out); crenel(ctx, -w / 2, base - 5, w * .18, wall, out); }
    door(ctx, 0, base, visited);
  }

  function drawModel(ctx, c, culture, t, w, h, opts) {
    var p = PAL[culture] || PAL.iberia, out = opts.visited ? '#7b2924' : '#30251f', base = h / 2 - 1;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 1.05; ctx.shadowColor = 'rgba(24,18,12,.34)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1.3;
    if (has(culture, ['iberia', 'italy', 'greek', 'france', 'britain', 'germany', 'easteurope', 'nordic'])) european(ctx, culture, t, w, base, p, out, !!opts.visited);
    else if (has(culture, ['russia', 'islam', 'arabia', 'persia', 'westafrica', 'eastafrica'])) domedCity(ctx, culture, t, w, base, p, out, !!opts.visited);
    else if (has(culture, ['india', 'southeast', 'maritime', 'philippines', 'china', 'mongolia', 'korea', 'japan', 'vietnam'])) asia(ctx, culture, t, w, base, p, out, !!opts.visited);
    else america(ctx, culture, t, w, base, p, out, !!opts.visited);
    ctx.shadowColor = 'transparent';
    if (c.port) { ctx.strokeStyle = '#287f87'; ctx.lineWidth = 1.35; ctx.beginPath(); ctx.moveTo(-w * .42, base + 2.5); ctx.quadraticCurveTo(-w * .2, base, 0, base + 2.5); ctx.quadraticCurveTo(w * .2, base + 5, w * .42, base + 2.5); ctx.stroke(); }
    else { ctx.strokeStyle = '#956b36'; ctx.lineWidth = 1.25; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(-w * .4, base + 2.5); ctx.lineTo(w * .4, base + 2.5); ctx.stroke(); ctx.setLineDash([]); }
    if (t === 4) flag(ctx, 0, -h / 2 - 4, '#d3a52c', out);
  }

  /** 문화권·규모별 투명 캔버스를 돌려준다. 지형과 분리된 실제 알파 에셋이며 반복 그리기를 캐시한다. */
  var CACHE = {};
  CI.asset = function (c, opts) {
    opts = opts || {};
    var culture = CI.culture(c), t = CI.tier(c), visited = !!opts.visited;
    var key = culture + ':' + t + ':' + (c.port ? 1 : 0) + ':' + (visited ? 1 : 0);
    if (CACHE[key]) return CACHE[key];
    var w = [0, 22, 30, 38, 46][t], h = [0, 19, 27, 35, 43][t], pad = 12, dpr = 2;
    var cv = document.createElement('canvas'); cv.width = (w + pad * 2) * dpr; cv.height = (h + pad * 2) * dpr;
    var cx = cv.getContext('2d'); cx.scale(dpr, dpr); cx.translate(w / 2 + pad, h / 2 + pad); drawModel(cx, c, culture, t, w, h, { visited: visited });
    CACHE[key] = { canvas: cv, width: w + pad * 2, height: h + pad * 2, culture: culture }; return CACHE[key];
  };

  /** 도시 좌표 (x,y)를 중심으로 투명 모형을 그린다. opts: scale, visited, auto */
  CI.draw = function (ctx, c, x, y, opts) {
    opts = opts || {};
    var scale = opts.scale || 1, met = CI.metrics(c, scale), a = CI.asset(c, opts);
    ctx.save(); ctx.translate(x, y);
    if (opts.auto) {
      var aw = met.width / 2 + 2, ah = met.height / 2 + 1, n = Math.max(3, 4 * scale);
      ctx.strokeStyle = '#209b98'; ctx.lineWidth = Math.max(1.4, 1.8 * scale); ctx.beginPath();
      ctx.moveTo(-aw + n, -ah); ctx.lineTo(-aw, -ah); ctx.lineTo(-aw, -ah + n); ctx.moveTo(aw - n, -ah); ctx.lineTo(aw, -ah); ctx.lineTo(aw, -ah + n);
      ctx.moveTo(-aw, ah - n); ctx.lineTo(-aw, ah); ctx.lineTo(-aw + n, ah); ctx.moveTo(aw, ah - n); ctx.lineTo(aw, ah); ctx.lineTo(aw - n, ah); ctx.stroke();
    }
    ctx.imageSmoothingEnabled = true; ctx.drawImage(a.canvas, -a.width * scale / 2, -a.height * scale / 2, a.width * scale, a.height * scale); ctx.restore(); return met;
  };
})(window.G = window.G || {});
