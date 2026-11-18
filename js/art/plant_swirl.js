/* 식물 발견 단서의 투명 애니메이션 시트. 32칸을 왼쪽 위부터 읽는다. */
(function (G) {
  'use strict';
  var F = G.FX.plantSwirl, TAU = Math.PI * 2, sheets = new Map(), places = new WeakMap();
  // 이름, 잎 너비, 잎 가장자리 굴곡 수와 깊이, 기본 색상
  var regions = {
    iberia: ['이베리아', .19, 0, 0, 89],
    north: ['북유럽', .39, 7, .12, 98],
    greece: ['그리스', .27, 0, 0, 111],
    mediterranean: ['지중해', .32, 3, .22, 105],
    africa: ['아프리카', .33, 0, 0, 92],
    middleeast: ['중동', .24, 9, .09, 79],
    egypt: ['이집트', .13, 0, 0, 76],
    india: ['인도', .38, 0, 0, 122],
    joseon: ['조선', .43, 4, .32, 102],
    ming: ['명', .16, 0, 0, 125],
    mongolia: ['몽골', .21, 6, .12, 66],
    centralasia: ['중앙아시아', .26, 5, .12, 74],
    southeast: ['동남아시아', .42, 0, 0, 136],
    japan: ['왜', .46, 3, .48, 113],
    america: ['아메리카', .46, 5, .24, 119]
  };
  // 이름, 색상 이동, 채도 이동, 밝기 이동, 너비 배율, 잎 수 배율
  var terrains = {
    desert: ['사막', -29, -12, 9, .63, .68],
    steppe: ['초원', -13, -8, 7, .66, .86],
    forest: ['숲', 8, 7, -4, 1.08, 1],
    coast: ['해안가', 24, -16, 9, .83, .91],
    highland: ['고산지대', -7, -10, 8, .73, .82],
    tundra: ['툰드라', -18, -23, 13, .84, .71],
    jungle: ['밀림', 21, 14, -3, 1.16, 1.12]
  };
  var seasons = {
    spring: ['봄', 102, 56, 57, .29],
    summer: ['여름', 122, 60, 42, .14],
    autumn: ['가을', 30, 70, 54, .88],
    winter: ['겨울', 43, 32, 59, .78]
  };
  var regionKeys = ['iberia', 'north', 'mediterranean', 'africa', 'middleeast',
    'india', 'ming', 'centralasia', 'southeast', 'japan', 'america'];
  var terrainKeys = { forest: 'forest', grass: 'steppe', steppe: 'steppe', desert: 'desert',
    mountain: 'highland', snow: 'highland', tundra: 'tundra', ice: 'tundra', jungle: 'jungle', sea: 'coast' };

  function location(d) {
    if (places.has(d)) return places.get(d);
    var lon = d.lon, lat = d.lat, reg = d.reg, region = regionKeys[reg] || 'iberia';
    if (reg === 6 && G.subRegionAt(reg, lon, lat) === '조선') region = 'joseon';
    if (reg === 2 && lon >= 19 && lon < 30 && lat >= 34 && lat < 43) region = 'greece';
    if ((reg === 3 || reg === 4 || reg === 2) && lon >= 25 && lon < 37 && lat >= 21 && lat < 32) region = 'egypt';
    if ((reg === 6 || reg === 7) && lon >= 87 && lon < 120 && lat >= 41 && lat < 53 && region !== 'joseon') region = 'mongolia';
    var terrain = terrainKeys[G.Geo.terrain(lon, lat)] || 'steppe';
    if (terrain === 'steppe' || terrain === 'forest') {
      if (G.Geo.sdf(lon, lat) < F.coast) terrain = 'coast';
    }
    var place = { region: region, terrain: terrain };
    places.set(d, place);
    return place;
  }

  function seasonAt(lat, month) {
    var local = ((month || 5) - 1 + (lat < 0 ? 6 : 0)) % 12 + 1;
    return local < 3 || local === 12 ? 'winter' : local < 6 ? 'spring' : local < 9 ? 'summer' : 'autumn';
  }

  function leaf(ctx, width, lobes, depth, hue, sat, light, bend) {
    function color(dl) { return 'hsl(' + hue + ',' + sat + '%,' + (light + dl) + '%)'; }
    var mid = -.05 + bend * .25;
    var grad = ctx.createLinearGradient(0, -width / 2, .16, width / 2);
    grad.addColorStop(0, color(-24)); grad.addColorStop(.44, color(8));
    grad.addColorStop(.54, color(1)); grad.addColorStop(1, color(-18));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(-.48, 0);
    if (!lobes) {
      ctx.bezierCurveTo(-.3, -width, .22, -width * .78 + bend, .52, bend);
      ctx.bezierCurveTo(.25, width * .63 + bend, -.27, width * .76, -.48, 0);
    } else {
      // 잎 끝과 잎자루 쪽은 좁게, 중간의 굴곡은 종류마다 다르게 그린다.
      for (var side = -1; side <= 1; side += 2) {
        for (var j = 1; j <= 24; j++) {
          var u = side < 0 ? j / 24 : 1 - j / 24;
          var w = Math.pow(Math.sin(u * Math.PI), .9) * width * .72;
          var edge = 1 + depth * Math.cos(u * TAU * lobes);
          ctx.lineTo(u - .48, bend * u + side * w * edge);
        }
      }
    }
    ctx.closePath(); ctx.fill();
    ctx.lineCap = 'round'; ctx.lineWidth = .029;
    ctx.strokeStyle = color(-29); ctx.stroke();
    ctx.strokeStyle = color(20); ctx.lineWidth = .028;
    ctx.beginPath(); ctx.moveTo(-.57, .025); ctx.quadraticCurveTo(mid, bend * .08, .43, bend * .9); ctx.stroke();
    ctx.strokeStyle = color(11); ctx.lineWidth = .014;
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var x = -.27 + i * .15, y = bend * (x + .43) * (x + .43);
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + .1, y - width * .12, x + .16, y - width * .37);
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + .1, y + width * .12, x + .14, y + width * .28);
    }
    ctx.stroke();
  }

  function sheet(region, terrain, season) {
    var key = [region, terrain, season].join('-'), cached = sheets.get(key);
    if (cached) { sheets.delete(key); sheets.set(key, cached); return cached; }
    var r = regions[region], b = terrains[terrain], s = seasons[season];
    var canvas = document.createElement('canvas'), n = F.cell;
    canvas.width = n * F.columns; canvas.height = n * F.rows;
    var ctx = canvas.getContext('2d'), frames = F.columns * F.rows;
    var count = Math.round(F.leaves * b[5]), particles = [];
    for (var i = 0; i < count; i++) {
      var q = (i * .61803398875) % 1, v = (i * .38196601125 + .43) % 1;
      var foliage = document.createElement('canvas');
      foliage.width = foliage.height = 64;
      var lc = foliage.getContext('2d');
      lc.translate(32, 32); lc.scale(48, 48);
      var hue = r[4] + (s[1] - r[4]) * s[4] + b[1] + (v - .5) * 31;
      if (season === 'autumn') hue = Math.max(6, hue);
      leaf(lc, r[1] * b[4] * (.76 + q * .54), r[2], r[3], hue,
        s[2] + b[2], s[3] + b[3] + (q - .5) * 23, (v - .5) * .28);
      particles.push({ image: foliage, angle: (i + q * .75) / count * TAU, q: q, v: v });
    }
    for (var f = 0; f < frames; f++) {
      var phase = f / frames * TAU;
      ctx.save();
      ctx.translate((f % F.columns + .5) * n, (Math.floor(f / F.columns) + .5) * n);
      particles.map(function (p) {
        var a = phase + p.angle, wave = Math.sin(phase + p.q * TAU);
        var radius = n * (.24 + p.v * .12 + wave * .055);
        return { p: p, a: a, x: Math.cos(a) * radius, y: Math.sin(a) * radius * .65 - wave * n * .067 };
      }).sort(function (a, b) { return a.y - b.y; }).forEach(function (entry) {
        var p = entry.p, a = entry.a, size = n * (.09 + p.q * .075 + .035 * Math.sin(a));
        ctx.save();
        ctx.translate(entry.x, entry.y);
        ctx.rotate(a + Math.PI / 2 + .7 * Math.sin(phase * 2 + p.v * TAU));
        ctx.scale(1, .22 + .78 * Math.cos(phase * 2 + p.q * TAU) ** 2);
        ctx.globalAlpha = .64 + .32 * p.q;
        ctx.drawImage(p.image, -size / 2, -size / 2, size, size);
        ctx.restore();
      });
      ctx.restore();
    }
    sheets.set(key, canvas);
    if (sheets.size > F.cache) sheets.delete(sheets.keys().next().value);
    return canvas;
  }

  function frame(ctx, canvas, x, y, size, t) {
    var count = F.columns * F.rows, n = F.cell;
    var f = Math.floor(t / F.seconds * count) % count;
    ctx.drawImage(canvas, f % F.columns * n, Math.floor(f / F.columns) * n, n, n,
      x - size / 2, y - size / 2, size, size);
  }

  G.PlantSwirl = {
    regions: regions, terrains: terrains, seasons: seasons, sheet: sheet, frame: frame,
    location: location, seasonAt: seasonAt,
    draw: function (ctx, d, p, radius, t, date, alpha) {
      if (p[0] < -F.radiusMax || p[0] > 1600 + F.radiusMax ||
          p[1] < -F.radiusMax || p[1] > 900 + F.radiusMax) return;
      var place = location(d), season = seasonAt(d.lat, date && date.m);
      var size = Math.max(F.radiusMin, Math.min(F.radiusMax, radius)) * 2;
      var offset = (G.U.strHash(d.id) >>> 0) % 100 / 100 * F.seconds;
      ctx.save();
      ctx.globalAlpha *= alpha == null ? 1 : alpha;
      frame(ctx, sheet(place.region, place.terrain, season), p[0], p[1], size, t + offset);
      ctx.restore();
    }
  };
})(window.G = window.G || {});
