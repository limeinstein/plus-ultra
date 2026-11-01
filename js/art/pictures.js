/* Painted pictures used in windows: discovery vignettes and ship cards. */
(function (G) {
  'use strict';
  var A = G.Art, U = G.U;

  // 악기 진열 그림. 울림통·줄·관·건반을 그려 시장과 소지품·도감에서 같은 모습을 쓴다.
  function instrumentArt(r, x) {
    var wood = x.createLinearGradient(-1, -1, 1, 1);
    wood.addColorStop(0, '#e3b574'); wood.addColorStop(0.45, '#a75d2c'); wood.addColorStop(1, '#472616');
    var pale = '#f0dfb5', dark = '#32251e', brass = '#cda34f', f = r.shape, n = r.strings || 6;
    x.lineWidth = 0.025; x.strokeStyle = dark;
    function box(a, b, w, h, c) { x.fillStyle = c; x.fillRect(a, b, w, h); x.strokeRect(a, b, w, h); }
    function oval(a, b, w, h, c) { x.fillStyle = c; x.beginPath(); x.ellipse(a, b, w, h, 0, 0, Math.PI * 2); x.fill(); x.stroke(); }
    function line(a, b, c, d, col, width) { x.strokeStyle = col || dark; x.lineWidth = width || 0.025; x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); x.strokeStyle = dark; x.lineWidth = 0.025; }
    function strings(a, b, w, h, count) { for (var i = 0; i < count; i++) line(a + w * i / Math.max(1, count - 1), b, a + w * i / Math.max(1, count - 1), b + h, pale, 0.012); }
    function keys(a, b, w, h, count) { for (var i = 0; i < count; i++) { box(a + i * w / count, b, w / count, h, '#f6e9cd'); if (i % 7 !== 2 && i % 7 !== 6 && i < count - 1) box(a + (i + 0.7) * w / count, b, w / count * 0.5, h * 0.6, '#252323'); } }
    function drum(a, b, w, h) { box(a - w, b, w * 2, h, wood); for (var i = 0; i < 5; i++) line(a - w + i * w * 0.5, b, a - w + (i + 0.5) * w * 0.4, b + h, pale); oval(a, b, w, w * 0.3, pale); }
    function smallBell(bx, by, bw, bh, color) {
      x.fillStyle = color || brass; x.beginPath(); x.moveTo(bx - bw * 0.32, by); x.quadraticCurveTo(bx - bw * 0.4, by + bh * 0.65, bx - bw, by + bh); x.lineTo(bx + bw, by + bh); x.quadraticCurveTo(bx + bw * 0.4, by + bh * 0.65, bx + bw * 0.32, by); x.closePath(); x.fill(); x.stroke();
      oval(bx, by + bh, bw, bw * 0.18, '#765526');
    }
    if (f === 'handbell' || f === 'ghanta') {
      smallBell(0, -0.28, 0.68, 0.91); line(0, 0.28, 0, 0.78, '#a78745', 0.055); oval(0, 0.78, 0.09, 0.1, brass);
      box(-0.1, -1.02, 0.2, 0.72, f === 'ghanta' ? brass : wood);
      if (f === 'ghanta') { oval(0, -1.02, 0.23, 0.2, brass); oval(0, -1.02, 0.1, 0.13, dark); for (var gr = 0; gr < 5; gr++) oval(-0.4 + gr * 0.2, 0.3, 0.055, 0.1, '#e5c878'); }
    } else if (f === 'cowbell' || f === 'agogo') {
      var countBell = f === 'agogo' ? 2 : 1;
      for (var ab = 0; ab < countBell; ab++) {
        var ax = countBell === 1 ? 0 : -0.48 + ab * 0.96, aw = countBell === 1 ? 0.56 : 0.3 + ab * 0.08, ay = -0.55 + ab * 0.15;
        x.fillStyle = '#57514a'; x.beginPath(); x.moveTo(ax - aw * 0.5, ay); x.lineTo(ax + aw * 0.5, ay); x.lineTo(ax + aw, ay + 1.1); x.lineTo(ax - aw, ay + 1.1); x.closePath(); x.fill(); x.stroke(); oval(ax, ay + 1.1, aw, 0.09, '#292724');
      }
      line(-0.5, -0.55, 0, -0.95, '#69645d', 0.07); line(0, -0.95, 0.5, -0.4, '#69645d', 0.07); line(-0.83, 0.99, 0.85, 0.72, wood, 0.06);
    } else if (f === 'sleighbells' || f === 'suzu') {
      box(-0.09, f === 'suzu' ? 0.2 : -0.9, 0.18, f === 'suzu' ? 0.84 : 0.46, wood);
      for (var sb = 0; sb < 12; sb++) {
        var sx = f === 'suzu' ? ((sb % 4) - 1.5) * (0.22 + Math.floor(sb / 4) * 0.1) : Math.cos(sb / 12 * Math.PI * 2) * 0.66;
        var sy = f === 'suzu' ? -0.82 + Math.floor(sb / 4) * 0.36 : 0.12 + Math.sin(sb / 12 * Math.PI * 2) * 0.66;
        oval(sx, sy, 0.13, 0.13, brass); line(sx - 0.08, sy, sx + 0.08, sy, dark, 0.025); line(sx, sy - 0.08, sx, sy + 0.08, dark, 0.025);
      }
    } else if (f === 'tingsha' || f === 'manjira') {
      line(-0.43, 0.1, 0, -0.77, f === 'manjira' ? '#9c3c31' : wood, 0.04); line(0, -0.77, 0.43, 0.27, f === 'manjira' ? '#9c3c31' : wood, 0.04);
      [-1, 1].forEach(function (side) { oval(side * 0.44, side * 0.12 + 0.1, 0.46, 0.32, brass); oval(side * 0.44, side * 0.12 + 0.1, 0.35, 0.23, '#ddbe72'); oval(side * 0.44, side * 0.12 + 0.07, f === 'manjira' ? 0.17 : 0.1, 0.1, '#a9813e'); });
    } else if (f === 'pyeonjong' || f === 'bianzhong') {
      var koreanBells = f === 'pyeonjong', rackColor = koreanBells ? '#9d3e2a' : '#513a2a', perRow = koreanBells ? 8 : 5;
      box(-1.05, -1.06, 0.09, 2.02, rackColor); box(0.96, -1.06, 0.09, 2.02, rackColor);
      for (var br = 0; br < 2; br++) {
        var by = -0.97 + br * 0.87; box(-1.04, by, 2.08, 0.08, rackColor);
        for (var bc = 0; bc < perRow; bc++) { var bx = -0.83 + bc * 1.66 / (perRow - 1), bh = koreanBells ? 0.48 : 0.31 + bc * 0.065; line(bx, by + 0.08, bx, by + 0.2, brass); smallBell(bx, by + 0.2, koreanBells ? 0.09 : 0.12, bh, '#9b8449'); }
      }
      box(-1.15, 0.91, 0.36, 0.1, rackColor); box(0.79, 0.91, 0.36, 0.1, rackColor);
      if (koreanBells) { oval(-1.03, -1.04, 0.14, 0.1, '#39786d'); oval(1.03, -1.04, 0.14, 0.1, '#39786d'); }
      line(-0.6, 1.12, 0.6, 1.03, wood, 0.04);
    } else if (f === 'woodblock') {
      box(-0.8, -0.45, 1.6, 0.78, wood); box(-0.64, -0.16, 1.28, 0.1, '#38241b'); line(-0.72, -0.37, 0.66, -0.37, pale, 0.025); line(-0.55, 0.87, 0.88, 0.45, wood, 0.06); oval(-0.55, 0.87, 0.12, 0.12, wood);
    } else if (f === 'claves') {
      [-1, 1].forEach(function (side) { x.save(); x.rotate(side * 0.63); box(-0.09, -0.97, 0.18, 1.94, wood); oval(0, -0.97, 0.09, 0.04, '#d2a16a'); x.restore(); });
    } else if (f === 'guiro') {
      oval(0, 0, 0.4, 0.94, '#c19a52'); for (var gg = 0; gg < 14; gg++) line(-0.26, -0.66 + gg * 0.1, 0.27, -0.66 + gg * 0.1, '#805329', 0.035); oval(-0.31, -0.25, 0.055, 0.09, dark); line(0.56, -0.8, 0.92, 0.85, wood, 0.05);
    } else if (f === 'cabasa') {
      box(-0.08, 0.25, 0.16, 0.8, wood); box(-0.56, -0.67, 1.12, 0.98, '#a8aaa3'); oval(0, -0.67, 0.56, 0.16, wood); oval(0, 0.31, 0.56, 0.16, wood);
      for (var cbx = 0; cbx < 8; cbx++) for (var cby = 0; cby < 6; cby++) oval(-0.47 + cbx * 0.135, -0.49 + cby * 0.13, 0.046, 0.046, '#d8ddda');
    } else if (f === 'caxixi') {
      x.strokeStyle = '#9a713b'; x.lineWidth = 0.11; x.beginPath(); x.ellipse(0, -0.62, 0.23, 0.38, 0, 0, Math.PI * 2); x.stroke(); x.fillStyle = '#b59056'; x.beginPath(); x.moveTo(-0.25, -0.5); x.lineTo(0.25, -0.5); x.lineTo(0.59, 0.8); x.lineTo(-0.59, 0.8); x.closePath(); x.fill();
      for (var cx = 0; cx < 8; cx++) line(-0.54, -0.34 + cx * 0.15, 0.54, -0.34 + cx * 0.15, '#dfc58d', 0.025); oval(0, 0.8, 0.6, 0.12, '#6e492b');
    } else if (f === 'sistrum') {
      box(-0.08, 0.35, 0.16, 0.74, brass); x.strokeStyle = '#897641'; x.lineWidth = 0.11; x.beginPath(); x.ellipse(0, -0.28, 0.55, 0.7, 0, 0, Math.PI * 2); x.stroke();
      for (var sr = 0; sr < 3; sr++) { var sy0 = -0.7 + sr * 0.41; line(-0.51, sy0, 0.51, sy0, brass, 0.045); for (var sd = 0; sd < 4; sd++) oval(-0.3 + sd * 0.2, sy0 + 0.08, 0.07, 0.13, '#bd9e54'); }
    } else if (f === 'moktak') {
      // 고리 손잡이는 실제로 뚫고 몸통의 울림 틈을 어둡게 판다.
      x.fillStyle = wood; x.beginPath(); x.ellipse(0.43, -0.57, 0.36, 0.34, -0.45, 0, Math.PI * 2); x.ellipse(0.43, -0.57, 0.2, 0.18, -0.45, 0, Math.PI * 2); x.fill('evenodd'); x.stroke();
      oval(-0.18, 0.03, 0.69, 0.63, wood);
      x.save(); x.translate(-0.18, 0.08); x.rotate(0.2); oval(0, 0, 0.56, 0.07, '#29160d'); line(-0.5, 0.085, 0.45, 0.085, '#d7984e', 0.025); x.restore();
      x.strokeStyle = '#ba8141'; x.lineWidth = 0.016;
      for (var mg = 0; mg < 4; mg++) { x.beginPath(); x.moveTo(-0.63, -0.33 + mg * 0.065); x.quadraticCurveTo(-0.15, -0.6 + mg * 0.065, 0.31, -0.26 + mg * 0.065); x.stroke(); }
      line(-0.1, 0.9, 0.98, 0.43, wood, 0.09); oval(-0.12, 0.9, 0.17, 0.11, wood);
    } else if (f === 'singingbowl') {
      // 속이 빈 주발과 가장자리를 문지르는 나무채.
      var bowl = x.createLinearGradient(-0.8, -0.5, 0.8, 0.7);
      bowl.addColorStop(0, '#7c5428'); bowl.addColorStop(0.3, '#e5c470'); bowl.addColorStop(0.65, '#b38a42'); bowl.addColorStop(1, '#6a4827');
      x.fillStyle = bowl; x.beginPath(); x.moveTo(-0.85, -0.27); x.bezierCurveTo(-0.82, 0.85, 0.82, 0.85, 0.85, -0.27); x.closePath(); x.fill(); x.stroke();
      oval(0, -0.27, 0.85, 0.33, '#d2b16b'); oval(0, -0.28, 0.73, 0.24, '#7b572e'); oval(0.08, -0.21, 0.48, 0.12, '#aa813f');
      line(-0.65, 0.75, 0.93, 0.37, wood, 0.12); line(-0.65, 0.75, -0.18, 0.64, '#514338', 0.2);
    } else if (f === 'panflute') {
      // 유럽 나이는 곡선 한 줄, 안데스 삼포냐는 별도 panpipe 그림.
      for (var pf = 0; pf < 18; pf++) {
        var px = -0.95 + pf * 0.108, py = -0.87 + pf * 0.043, ph = 1.67 - pf * 0.068;
        var pipe = x.createLinearGradient(px, 0, px + 0.09, 0);
        pipe.addColorStop(0, '#926232'); pipe.addColorStop(0.4, '#d7b775'); pipe.addColorStop(1, '#a8783c');
        box(px, py, 0.095, ph, pipe); oval(px + 0.047, py, 0.047, 0.025, '#483221');
      }
      x.strokeStyle = '#68472c'; x.lineWidth = 0.13; x.beginPath(); x.moveTo(-0.97, 0.73); x.quadraticCurveTo(-0.1, 0.88, 0.95, 0.29); x.stroke();
      line(-0.94, 0.65, 0.93, 0.22, '#bb9a54', 0.025);
    } else if (f === 'harmonica') {
      x.rotate(-0.18); box(-1.05, -0.32, 2.1, 0.64, '#a77645'); box(-1.08, -0.37, 2.16, 0.22, '#c6d3d7'); box(-1.08, 0.19, 2.16, 0.2, '#aebfc6');
      for (var hh = 0; hh < 10; hh++) box(-0.95 + hh * 0.195, -0.11, 0.14, 0.23, '#302b24');
      line(-0.9, -0.26, 0.9, -0.26, '#edf1e9', 0.025); oval(-0.97, -0.27, 0.035, 0.035, dark); oval(0.97, -0.27, 0.035, 0.035, dark);
    } else if (f === 'ajaeng') {
      x.rotate(-0.32); box(-1.05, -0.33, 2.1, 0.66, wood); box(-1.08, -0.37, 0.16, 0.74, dark); box(0.92, -0.37, 0.16, 0.74, dark);
      for (var aj = 0; aj < n; aj++) { var ay = -0.24 + aj * 0.08; line(-0.98, ay, 0.98, ay, pale, 0.02); box(-0.35 + aj * 0.08, ay - 0.025, 0.055, 0.05, '#5a3721'); }
      line(-0.25, -0.93, 0.35, 0.9, '#694829', 0.065); line(-0.27, -0.93, 0.33, 0.9, '#d2ae72', 0.015); box(-0.88, 0.34, 0.1, 0.25, wood);
    } else if (f === 'shekere') {
      oval(0, 0.15, 0.63, 0.71, wood); box(-0.13, -0.92, 0.26, 0.55, wood); oval(0, -0.93, 0.15, 0.06, pale);
      for (var skx = -3; skx <= 3; skx++) for (var sky = -3; sky <= 3; sky++) { var nx = skx * 0.17, ny = 0.15 + sky * 0.18; if (nx * nx / 0.38 + (ny - 0.15) * (ny - 0.15) / 0.49 < 1) { line(nx - 0.06, ny - 0.1, nx + 0.06, ny + 0.1, pale, 0.016); oval(nx, ny, 0.045, 0.04, (skx + sky) % 2 ? '#af4936' : '#e4c77f'); } }
    } else if (f === 'veena') {
      x.rotate(0.58); oval(0, 0.48, 0.48, 0.49, wood); oval(0.2, -0.67, 0.25, 0.25, wood); box(-0.1, -1.06, 0.2, 1.68, dark); box(-0.14, -1.12, 0.28, 0.25, wood);
      for (var vf = 0; vf < 11; vf++) line(-0.11, -0.8 + vf * 0.11, 0.11, -0.8 + vf * 0.11, brass, 0.025);
      strings(-0.065, -1, 0.13, 1.7, n); box(-0.23, 0.65, 0.46, 0.06, pale);
    } else if (f === 'igil') {
      oval(0, 0.45, 0.34, 0.44, wood); oval(0, 0.45, 0.27, 0.35, pale); box(-0.045, -0.95, 0.09, 1.53, wood); strings(-0.025, -0.95, 0.05, 1.7, 2);
      line(-0.14, -0.85, 0.15, -0.85, dark, 0.05); line(-0.14, -0.68, 0.15, -0.68, dark, 0.05); oval(0.04, -1.02, 0.12, 0.07, wood);
      line(0.62, -0.9, 0.62, 0.95, wood, 0.045); line(0.57, -0.9, 0.57, 0.95, pale, 0.014);
    } else if (f === 'kendang') {
      x.fillStyle = wood; x.beginPath(); x.moveTo(-0.85, -0.4); x.quadraticCurveTo(0, -0.65, 0.85, -0.28); x.lineTo(0.85, 0.28); x.quadraticCurveTo(0, 0.65, -0.85, 0.4); x.closePath(); x.fill(); x.stroke();
      for (var kr = 0; kr < 6; kr++) { line(-0.8, -0.36 + kr * 0.14, 0.8, -0.24 + kr * 0.1, pale, 0.018); }
      oval(-0.85, 0, 0.12, 0.43, pale); oval(0.85, 0, 0.1, 0.3, pale); line(-0.5, 0.45, -0.6, 0.72, dark, 0.05); line(0.5, 0.4, 0.6, 0.72, dark, 0.05);
    } else if (f === 'suling') {
      x.rotate(0.55); box(-0.08, -1.04, 0.16, 2.08, '#c8aa70'); for (var sf = 0; sf < 6; sf++) oval(0, -0.42 + sf * 0.2, 0.03, 0.035, dark);
      box(-0.11, -0.94, 0.22, 0.15, '#a67b49'); line(-0.07, -0.86, 0.07, -0.86, pale, 0.025); box(-0.09, 0.83, 0.18, 0.04, '#9c7946');
    } else if (f === 'ocarina') {
      x.fillStyle = '#bd7951'; x.beginPath(); x.moveTo(-0.82, 0.42); x.bezierCurveTo(-0.9, -0.4, -0.3, -0.75, 0.32, -0.25); x.lineTo(0.87, -0.55); x.lineTo(0.95, -0.31); x.lineTo(0.53, 0.08); x.quadraticCurveTo(0.36, 0.95, -0.82, 0.42); x.fill(); x.stroke();
      [[-0.42,-0.17],[-0.14,-0.2],[-0.5,0.12],[-0.2,0.1],[0.1,0.12]].forEach(function (p) { oval(p[0],p[1],0.06,0.06,dark); }); line(-0.64, 0.38, 0.25, 0.48, pale, 0.035);
    } else if (f === 'bugle' || f === 'flugelhorn' || f === 'euphonium' || f === 'sousaphone' || f === 'serpent') {
      function brassTube(draw, width) { [dark, brass].forEach(function (color, pass) { x.strokeStyle = color; x.lineWidth = width + (pass ? 0 : 0.045); x.beginPath(); draw(); x.stroke(); }); x.strokeStyle = dark; x.lineWidth = 0.025; }
      function upBell(bx, by, size) { x.fillStyle = brass; x.beginPath(); x.moveTo(bx - 0.1, by + 0.35); x.lineTo(bx + 0.1, by + 0.35); x.quadraticCurveTo(bx + 0.12, by + 0.05, bx + size, by); x.lineTo(bx - size, by); x.quadraticCurveTo(bx - 0.12, by + 0.05, bx - 0.1, by + 0.35); x.fill(); x.stroke(); oval(bx, by, size, size * 0.24, '#6d4e20'); }
      if (f === 'bugle' || f === 'flugelhorn') {
        brassTube(function () { x.moveTo(-0.92, -0.28); x.lineTo(0.3, -0.28); x.bezierCurveTo(0.8, -0.28, 0.8, 0.5, 0.25, 0.5); x.lineTo(-0.45, 0.5); x.bezierCurveTo(-0.85, 0.5, -0.85, 0.02, -0.45, 0.02); x.lineTo(0.5, 0.02); }, 0.1);
        x.save(); x.translate(0.65, 0.02); x.rotate(Math.PI / 2); upBell(0, -0.25, 0.37); x.restore();
        if (f === 'flugelhorn') for (var fv = 0; fv < 3; fv++) { box(-0.3 + fv * 0.2, -0.32, 0.08, 0.62, brass); line(-0.26 + fv * 0.2, -0.32, -0.26 + fv * 0.2, -0.58, brass, 0.04); box(-0.33 + fv * 0.2, -0.6, 0.14, 0.05, pale); }
      } else if (f === 'euphonium') {
        if (r.id === 'tenorhorn') x.scale(0.83, 0.83);
        brassTube(function () { x.moveTo(-0.45, -0.7); x.lineTo(-0.6, 0.52); x.bezierCurveTo(-0.6, 1.05, 0.58, 1.05, 0.58, 0.52); x.lineTo(0.58, -0.45); }, r.id === 'baritonehorn' ? 0.12 : 0.17);
        brassTube(function () { x.moveTo(-0.35, 0.47); x.lineTo(-0.35, -0.24); x.lineTo(0.23, -0.24); x.lineTo(0.23, 0.47); x.closePath(); }, 0.1);
        upBell(0.58, -0.85, 0.39); for (var ev = 0; ev < 3; ev++) { box(-0.26 + ev * 0.19, -0.1, 0.08, 0.5, brass); box(-0.3 + ev * 0.19, -0.17, 0.16, 0.05, pale); }
      } else if (f === 'sousaphone') {
        brassTube(function () { x.arc(-0.12, 0.12, 0.65, 0, Math.PI * 2); }, 0.2);
        brassTube(function () { x.moveTo(0.52, 0.24); x.lineTo(0.52, -0.48); x.lineTo(0.15, -0.68); }, 0.19);
        oval(0.28, -0.7, 0.55, 0.35, brass); oval(0.28, -0.7, 0.43, 0.25, '#6d4e20');
        for (var sv = 0; sv < 3; sv++) box(-0.17 + sv * 0.16, 0, 0.08, 0.34, brass);
      } else {
        brassTube(function () { x.moveTo(-0.3, -1); x.bezierCurveTo(-1.1, -0.85, 0.65, -0.2, -0.35, 0.05); x.bezierCurveTo(-1, 0.38, 1.02, 0.53, 0.4, 1); }, 0.19);
        x.strokeStyle = '#473c29'; x.lineWidth = 0.15; x.beginPath(); x.moveTo(-0.3, -1); x.bezierCurveTo(-1.1, -0.85, 0.65, -0.2, -0.35, 0.05); x.bezierCurveTo(-1, 0.38, 1.02, 0.53, 0.4, 1); x.stroke(); x.strokeStyle = dark; x.lineWidth = 0.025;
        [[-0.3,-0.77],[-0.18,-0.56],[0.04,-0.36],[-0.25,0.08],[-0.03,0.37],[0.32,0.57]].forEach(function (p) { oval(p[0],p[1],0.045,0.045,brass); });
      }
    } else if (f === 'sopranosax' || f === 'baritonesax') {
      if (f === 'sopranosax') { x.rotate(0.3); box(-0.08, -0.95, 0.16, 1.62, brass); x.fillStyle = brass; x.beginPath(); x.moveTo(-0.08,0.55); x.lineTo(0.08,0.55); x.lineTo(0.25,0.97); x.lineTo(-0.25,0.97); x.closePath(); x.fill(); x.stroke(); }
      else { x.strokeStyle = brass; x.lineWidth = 0.16; x.beginPath(); x.moveTo(-0.4,-0.7); x.bezierCurveTo(-0.6,-1.3,0.15,-1.3,0.05,-0.55); x.lineTo(-0.07,0.64); x.bezierCurveTo(-0.07,1.05,0.67,1.05,0.67,0.47); x.stroke(); x.strokeStyle = dark; x.lineWidth = 0.025; oval(0.67,0.42,0.24,0.1,brass); oval(0.67,0.42,0.16,0.05,dark); }
      for (var sx = 0; sx < 7; sx++) oval(f === 'sopranosax' ? 0 : -0.03, -0.6 + sx * 0.18, 0.06, 0.045, pale);
    } else if (f === 'fife' || f === 'piri') {
      x.rotate(0.55); box(-0.07,-1,0.14,2,wood); for (var fh = 0; fh < (f === 'piri' ? 7 : 6); fh++) oval(0,-0.5 + fh * 0.2,0.025,0.035,dark);
      if (f === 'piri') box(-0.045,-1.18,0.09,0.3,pale); else { box(-0.09,-0.85,0.18,0.04,brass); oval(0,-0.72,0.04,0.035,dark); box(-0.09,0.85,0.18,0.04,brass); }
    } else if (f === 'marchingsnare' || f === 'marchingbass' || f === 'marchingtenors' || f === 'yonggo' || f === 'tanggu') {
      if (f === 'marchingbass') { oval(0,0.1,0.8,0.86,'#9c3632'); oval(0,0.1,0.68,0.74,pale); line(-0.5,-0.57,-0.35,-1,dark,0.075); line(0.5,-0.57,0.35,-1,dark,0.075); }
      else if (f === 'marchingtenors') { [[-0.56,0.1,0.34], [0.56,0.1,0.34], [-0.24,0.4,0.37], [0.24,0.4,0.37]].forEach(function (p) { drum(p[0],p[1],p[2],0.28); }); line(-0.6,-0.1,-0.3,-0.8,dark,0.07); line(0.6,-0.1,0.3,-0.8,dark,0.07); }
      else { drum(0,-0.15,0.68,f === 'marchingsnare' ? 0.52 : 0.82); if (f === 'yonggo') { x.strokeStyle = '#c4943e'; x.lineWidth = 0.05; x.beginPath(); x.moveTo(-0.5,0.32); x.bezierCurveTo(-0.3,-0.02,0.2,0.7,0.5,0.22); x.stroke(); oval(0.5,0.22,0.07,0.04,brass); x.strokeStyle = dark; x.lineWidth = 0.025; } if (f === 'tanggu') { line(-0.55,0.6,-0.75,1.05,dark,0.07); line(0.55,0.6,0.75,1.05,dark,0.07); } else { line(-0.5,-0.2,-0.3,-0.92,dark,0.06); line(0.5,-0.2,0.3,-0.92,dark,0.06); } }
      line(-0.8,-0.8,0.4,-0.12,wood,0.045); line(0.8,-0.8,-0.4,-0.12,wood,0.045);
    } else if (f === 'belllyra' || f === 'unra' || f === 'cevgen') {
      if (f === 'cevgen') { line(0,-0.7,0,1.15,wood,0.09); oval(0,-0.65,0.4,0.4,brass); oval(0,-0.65,0.3,0.3,'#776336'); [-1,1].forEach(function (sd) { line(0,-0.4,sd*0.7,-0.35,brass,0.06); line(sd*0.7,-0.35,sd*0.7,0.1,brass,0.025); oval(sd*0.7,0.15,0.12,0.12,brass); line(sd*0.4,-0.37,sd*0.4,0.35,brass,0.025); oval(sd*0.4,0.4,0.1,0.1,brass); }); }
      else { box(-0.65,-0.95,0.09,1.8,wood); box(0.56,-0.95,0.09,1.8,wood); box(-0.65,-0.95,1.3,0.08,wood); box(-0.65,0.77,1.3,0.08,wood); line(0,0.82,0,1.15,wood,0.1);
        if (f === 'unra') for (var ur = 0; ur < 10; ur++) { var ux = -0.35 + ur % 3 * 0.35, uy = -0.65 + Math.floor(ur / 3) * 0.4; oval(ux,uy,0.13,0.13,brass); }
        else for (var bl = 0; bl < 13; bl++) { var bw = 0.9 - bl * 0.035; box(-bw/2,-0.8 + bl*0.115,bw,0.07,'#becdd0'); }
      }
    } else if (f === 'signalwhistle') {
      oval(-0.2,0.1,0.5,0.43,'#aebdc0'); box(-0.12,-0.15,1,0.24,'#cad5d6'); box(0.3,-0.16,0.2,0.12,dark); oval(-0.63,0.1,0.12,0.12,brass); line(-0.75,0.1,-0.75,-0.8,'#8a5341',0.025); line(-0.75,-0.8,0.8,-0.8,'#8a5341',0.025);
    } else if (f === 'conch') {
      x.rotate(0.4); x.fillStyle = '#d7bd90'; x.beginPath(); x.moveTo(0,-1.02); x.bezierCurveTo(-0.4,-0.5,-0.7,0.15,-0.55,0.72); x.bezierCurveTo(-0.2,1.14,0.65,0.95,0.62,0.3); x.quadraticCurveTo(0.4,-0.3,0,-1.02); x.fill(); x.stroke();
      for (var co = 0; co < 6; co++) { var cy = -0.6 + co * 0.22; line(-0.12 - co*0.06,cy,0.12 + co*0.065,cy + 0.12,'#9c8056',0.025); }
      oval(0.3,0.63,0.29,0.3,'#6c4d2d'); oval(0.3,0.63,0.2,0.22,'#dcb89a'); box(-0.05,-1.15,0.1,0.23,brass);
    } else if (f === 'jing') {
      oval(0,0.1,0.79,0.79,brass); oval(0,0.1,0.67,0.67,'#d5b55d'); line(-0.23,-0.65,0,-1.05,wood,0.035); line(0,-1.05,0.23,-0.65,wood,0.035); line(0.6,-0.8,0.97,0.7,wood,0.05); oval(0.6,-0.8,0.15,0.16,pale);
    } else if (f === 'kos') {
      oval(0,0.1,0.86,0.75,'#b27a40'); oval(0,-0.27,0.88,0.28,pale); line(-0.54,0.6,-0.7,1.04,dark,0.075); line(0.54,0.6,0.7,1.04,dark,0.075); line(-0.75,-0.95,0.5,-0.25,wood,0.07); oval(0.5,-0.25,0.12,0.12,pale); line(0.75,-0.95,-0.5,-0.25,wood,0.07); oval(-0.5,-0.25,0.12,0.12,pale);
    } else if (f === 'vielle' || f === 'rebec' || f === 'citole' || f === 'rubab') {
      x.rotate(0.25);
      if (f === 'vielle') oval(0, 0.3, 0.5, 0.65, wood);
      else if (f === 'rebec') { x.fillStyle = wood; x.beginPath(); x.moveTo(0, -0.55); x.bezierCurveTo(-0.15, -0.2, -0.7, 0.8, 0, 0.95); x.bezierCurveTo(0.7, 0.8, 0.15, -0.2, 0, -0.55); x.fill(); x.stroke(); }
      else { x.fillStyle = wood; x.beginPath(); [[-0.16,-0.4],[-0.43,-0.15],[-0.26,0.12],[-0.55,0.45],[-0.34,0.9],[0.34,0.9],[0.55,0.45],[0.26,0.12],[0.43,-0.15],[0.16,-0.4]].forEach(function (p) { x.lineTo(p[0],p[1]); }); x.closePath(); x.fill(); x.stroke(); }
      box(-0.065, -0.97, 0.13, 1.3, dark); box(-0.12, -1.08, 0.24, 0.2, wood);
      if (f === 'rubab') oval(0, 0.48, 0.36, 0.35, pale); else { oval(-0.2, 0.25, 0.07, 0.11, dark); oval(0.2, 0.25, 0.07, 0.11, dark); }
      strings(-0.06, -0.98, 0.12, 1.68, n); box(-0.2, 0.64, 0.4, 0.05, brass);
      if (f === 'vielle' || f === 'rebec') { line(0.7, -0.8, 0.7, 0.95, wood, 0.05); line(0.65, -0.8, 0.65, 0.95, pale, 0.012); }
    } else if (f === 'hurdygurdy') {
      oval(0, 0.1, 0.64, 0.85, wood); box(-0.24, -0.62, 0.48, 1.04, dark); strings(-0.12, -0.6, 0.24, 1.3, 4);
      for (var hg = 0; hg < 9; hg++) box(0.24, -0.56 + hg * 0.1, 0.22, 0.065, pale);
      oval(0, 0.48, 0.25, 0.16, wood); line(0, 0.85, 0, 1.04, brass, 0.07); line(0, 1.04, 0.45, 1.04, brass, 0.07); oval(0.45, 1.04, 0.09, 0.06, dark);
    } else if (f === 'psaltery' || f === 'hammeredzither') {
      x.fillStyle = wood; x.beginPath(); x.moveTo(-0.62, -0.65); x.lineTo(0.62, -0.65); x.lineTo(1, 0.65); x.lineTo(-1, 0.65); x.closePath(); x.fill(); x.stroke();
      for (var zs = 0; zs < Math.min(n, 18); zs++) { var zy = -0.55 + zs / Math.min(n,18) * 1.1, zw = 0.62 + (zy + 0.55) * 0.25; line(-zw, zy, zw, zy, pale, 0.012); }
      line(-0.3, -0.6, -0.45, 0.59, dark, 0.05); line(0.3, -0.6, 0.45, 0.59, dark, 0.05);
      if (f === 'hammeredzither') { line(-0.85, -0.97, -0.3, 0, wood, 0.035); oval(-0.3, 0, 0.07, 0.04, pale); line(0.85, -0.97, 0.3, 0, wood, 0.035); oval(0.3, 0, 0.07, 0.04, pale); }
      else { oval(-0.65, 0.3, 0.08, 0.08, dark); oval(0.65, 0.3, 0.08, 0.08, dark); }
    } else if (f === 'lyre' || f === 'crwth') {
      box(-0.63, 0.2, 1.26, 0.62, wood); box(-0.63, -0.9, 0.14, 1.12, wood); box(0.49, -0.9, 0.14, 1.12, wood); box(-0.65, -0.96, 1.3, 0.15, wood);
      if (f === 'crwth') box(-0.08, -0.82, 0.16, 1.18, dark);
      strings(-0.38, -0.81, 0.76, 1.36, n); oval(-0.3, 0.5, 0.07, 0.1, dark); oval(0.3, 0.5, 0.07, 0.1, dark);
      if (f === 'crwth') { line(0.84, -0.85, 0.84, 0.94, wood, 0.05); line(0.8, -0.85, 0.8, 0.94, pale, 0.012); }
    } else if (f === 'rabab' || f === 'kamancheh') {
      if (f === 'rabab') { box(-0.35, 0.16, 0.7, 0.61, wood); box(-0.28, 0.22, 0.56, 0.48, pale); }
      else { oval(0, 0.4, 0.4, 0.4, wood); oval(0, 0.4, 0.3, 0.3, pale); }
      box(-0.055, -0.95, 0.11, 1.45, wood); strings(-0.03, -0.93, 0.06, 1.58, n); line(0, 0.76, 0, 1.12, dark, 0.055);
      for (var rp = 0; rp < 3; rp++) line(-0.16, -0.9 + rp * 0.15, 0.16, -0.9 + rp * 0.15, dark, 0.04);
      x.strokeStyle = wood; x.lineWidth = 0.045; x.beginPath(); x.moveTo(0.65, -0.9); x.quadraticCurveTo(0.95, 0, 0.65, 0.95); x.stroke(); line(0.65, -0.9, 0.65, 0.95, pale, 0.014);
    } else if (f === 'angularharp') {
      line(-0.8, 0.8, -0.45, -0.85, wood, 0.22); line(-0.45, -0.85, 0.85, -0.3, wood, 0.14);
      for (var ah = 0; ah < 14; ah++) { var at = ah / 14; line(-0.4 + at * 1.2, -0.8 + at * 0.5, -0.72 + at * 0.25, 0.7 - at * 1.25, pale, 0.016); }
    } else if (f === 'shawm' || f === 'naturaltrumpet' || f === 'taborpipe') {
      x.rotate(0.55); var nc = f === 'naturaltrumpet' ? brass : wood;
      box(-0.07, -1.02, 0.14, 1.7, nc);
      if (f !== 'naturaltrumpet') { var holes = f === 'taborpipe' ? 3 : 7; for (var ph = 0; ph < holes; ph++) oval(0, -0.4 + ph * 0.15, 0.03, 0.04, dark); }
      if (f !== 'taborpipe') { x.fillStyle = nc; x.beginPath(); x.moveTo(-0.08, 0.52); x.lineTo(0.08, 0.52); x.lineTo(0.32, 1); x.lineTo(-0.32, 1); x.closePath(); x.fill(); x.stroke(); oval(0, 1, 0.32, 0.07, dark); }
      else box(-0.09, -0.83, 0.18, 0.1, pale);
      if (f === 'shawm') { oval(0, -0.77, 0.15, 0.04, wood); box(-0.025, -1.15, 0.05, 0.15, pale); }
    } else if (f === 'crumhorn' || f === 'cornett' || f === 'gemshorn' || f === 'bladderpipe') {
      if (f === 'bladderpipe') { oval(0, -0.35, 0.32, 0.43, '#a9875e'); line(0, -0.78, 0.25, -1.1, wood, 0.07); box(-0.065, 0.03, 0.13, 1, wood); for (var bh = 0; bh < 5; bh++) oval(0, 0.2 + bh * 0.14, 0.025, 0.035, dark); }
      else if (f === 'gemshorn') { x.fillStyle = '#c9b88d'; x.beginPath(); x.moveTo(-0.35, -0.75); x.lineTo(0.25, -0.75); x.quadraticCurveTo(0.55, 0.2, -0.45, 0.95); x.quadraticCurveTo(0.05, 0.2, -0.35, -0.75); x.fill(); x.stroke(); for (var gh = 0; gh < 4; gh++) oval(0.02, -0.5 + gh * 0.2, 0.035, 0.035, dark); }
      else { x.strokeStyle = dark; x.lineWidth = 0.18; x.beginPath(); x.moveTo(-0.1, -1); if (f === 'crumhorn') { x.lineTo(-0.1, 0.55); x.bezierCurveTo(-0.1, 1.07, 0.6, 1.07, 0.6, 0.48); } else x.quadraticCurveTo(-0.5, 0, 0.45, 0.95); x.stroke(); x.strokeStyle = f === 'cornett' ? '#45402d' : '#c69a55'; x.lineWidth = 0.13; x.stroke(); x.strokeStyle = dark; x.lineWidth = 0.025; for (var ch = 0; ch < 6; ch++) oval(f === 'cornett' ? -0.15 + ch * 0.045 : -0.1, -0.65 + ch * 0.21, 0.03, 0.035, '#191a16'); }
    } else if (f === 'doublepipe') {
      box(-0.21, -0.94, 0.12, 1.55, '#c0a265'); box(0.08, -0.94, 0.12, 2.05, '#c0a265');
      for (var dp = 0; dp < 6; dp++) oval(-0.15, -0.6 + dp * 0.18, 0.025, 0.035, dark);
      line(-0.23, -0.7, 0.22, -0.7, '#9d513d', 0.06); line(-0.23, 0.45, 0.22, 0.45, '#9d513d', 0.06);
    } else if (f === 'portativeorgan') {
      box(-0.85, -0.26, 1.7, 1.02, wood); for (var po = 0; po < 9; po++) box(-0.72 + po * 0.17, -0.95 + po * 0.07, 0.12, 1 - po * 0.07, brass); keys(-0.75, 0.3, 1.1, 0.3, 10);
      box(0.42, 0.05, 0.35, 0.6, '#694b38'); for (var be = 0; be < 6; be++) line(0.44, 0.1 + be * 0.09, 0.75, 0.1 + be * 0.09, pale, 0.025);
    } else if (f === 'framedrum') {
      oval(0, 0, 0.86, 0.86, wood); oval(0, 0, 0.76, 0.76, pale);
      if (r.id === 'bendir') { line(-0.55, -0.43, 0.55, 0.43, '#9d7a51', 0.025); line(-0.58, -0.38, 0.52, 0.48, '#9d7a51', 0.025); }
      else for (var df = 0; df < 12; df++) { var da = df / 12 * Math.PI * 2; oval(Math.cos(da) * 0.75, Math.sin(da) * 0.75, 0.04, 0.07, '#babbb4'); }
    } else if (f === 'kettlepair') {
      [-1,1].forEach(function (sd) { oval(sd * 0.44, 0.26, sd < 0 ? 0.4 : 0.47, 0.43, '#b4834d'); oval(sd * 0.44, -0.04, sd < 0 ? 0.4 : 0.47, 0.15, pale); });
      line(-0.75, -0.75, 0.3, 0.12, wood, 0.045); line(0.75, -0.75, -0.3, 0.12, wood, 0.045); line(-0.75, 0.55, 0.75, 0.55, '#8d4e32', 0.06);
    } else if (f === 'tabordrum' || f === 'davul') {
      drum(0, -0.2, f === 'davul' ? 0.75 : 0.5, 0.86); line(-0.65, -0.34, 0.3, -0.96, '#6f4932', 0.07); line(0.3, -0.96, 0.65, -0.34, '#6f4932', 0.07);
      line(-0.8, -0.85, 0.4, -0.15, wood, 0.055); if (f === 'davul') line(0.9, -0.65, 0.55, 0.8, wood, 0.025);
    } else if (f === 'metalclappers') {
      [-1,1].forEach(function (sd) { x.save(); x.translate(sd * 0.43, 0); x.rotate(sd * 0.2); box(-0.09, -0.4, 0.18, 0.8, '#6d7374'); oval(0, -0.5, 0.25, 0.3, '#9da5a6'); oval(0, 0.5, 0.25, 0.3, '#9da5a6'); line(-0.13, -0.5, 0.13, -0.5, pale); line(-0.13, 0.5, 0.13, 0.5, pale); x.restore(); });
    } else if (f === 'zither') {
      x.rotate(-0.5); box(-0.32, -1.03, 0.64, 2.06, wood); strings(-0.24, -0.96, 0.48, 1.92, n);
      for (var z = 0; z < n; z++) { var zx = -0.24 + 0.48 * z / (n - 1), zy = -0.45 + z / n * 0.9; box(zx - 0.035, zy, 0.07, 0.035, dark); }
    } else if (f === 'guitar' || f === 'violin' || f === 'cello' || f === 'doublebass' || f === 'lute' || f === 'longlute' || f === 'harplute') {
      x.rotate(f === 'doublebass' ? 0.12 : 0.32); var long = f === 'longlute' || r.id === 'bass', bowed = f === 'violin' || f === 'cello' || f === 'doublebass';
      if (f === 'lute' || long || f === 'harplute') oval(0, 0.42, 0.43, 0.58, wood);
      else { x.fillStyle = wood; x.beginPath(); x.moveTo(0, -0.28); x.bezierCurveTo(-0.55, -0.4, -0.45, 0.03, -0.25, 0.16); x.bezierCurveTo(-0.63, 0.42, -0.52, 0.98, 0, 0.98); x.bezierCurveTo(0.52, 0.98, 0.63, 0.42, 0.25, 0.16); x.bezierCurveTo(0.45, 0.03, 0.55, -0.4, 0, -0.28); x.fill(); x.stroke(); }
      box(-0.075, -0.94, 0.15, long ? 1.35 : 1.1, dark); box(-0.11, -1.1, 0.22, 0.23, wood);
      if (!bowed) oval(0, 0.23, 0.13, 0.16, dark);
      else { line(-0.25, 0.25, -0.2, 0.5, dark, 0.045); line(0.25, 0.25, 0.2, 0.5, dark, 0.045); line(0.7, -0.8, 0.7, 0.9, wood, 0.05); line(0.66, -0.8, 0.66, 0.9, pale, 0.016); }
      box(-0.18, 0.65, 0.36, 0.06, dark); strings(-0.055, -1, 0.11, 1.7, n);
      for (var t = 0; t < 4; t++) { oval(-0.15, -1.02 + t * 0.06, 0.04, 0.025, pale); oval(0.15, -1.02 + t * 0.06, 0.04, 0.025, pale); }
      if (f === 'cello' || f === 'doublebass') line(0, 0.95, 0, 1.17, dark, 0.04);
      if (f === 'doublebass') { box(-0.1, -0.35, 0.2, 0.88, dark); strings(-0.06, -1, 0.12, 1.7, 4); }
      if (f === 'harplute') { strings(-0.4, -0.7, 0.8, 1.25, 16); line(-0.48, -0.4, -0.48, 0.65, wood, 0.06); line(0.48, -0.4, 0.48, 0.65, wood, 0.06); }
    } else if (f === 'spikefiddle') {
      box(-0.3, 0.38, 0.6, 0.48, wood); box(-0.04, -1.02, 0.08, 1.7, wood); strings(-0.025, -0.95, 0.05, 1.7, n);
      line(-0.12, -0.87, 0.15, -0.87, dark, 0.06); line(-0.12, -0.7, 0.15, -0.7, dark, 0.06);
      if (r.id === 'shamisen') { line(0.5, 0.2, 0.7, 0.85, wood, 0.05); oval(0.7, 0.85, 0.13, 0.09, pale); }
      else { line(0.45, -0.9, 0.45, 0.9, wood, 0.045); line(0.4, -0.9, 0.4, 0.9, pale, 0.016); }
      if (r.id === 'morinkhuur') { oval(0.03, -1.07, 0.12, 0.07, wood); line(-0.06, -1.08, -0.06, -1.2, wood, 0.07); }
    } else if (f === 'janggu') {
      x.fillStyle = wood; x.beginPath(); x.moveTo(-0.85, -0.5); x.quadraticCurveTo(0, -0.02, 0.85, -0.5); x.lineTo(0.85, 0.5); x.quadraticCurveTo(0, 0.02, -0.85, 0.5); x.closePath(); x.fill(); x.stroke();
      oval(-0.85, 0, 0.13, 0.52, pale); oval(0.85, 0, 0.13, 0.52, pale);
      for (var j = 0; j < 5; j++) { line(-0.83, -0.45 + j * 0.21, 0.83, -0.24 + j * 0.16, pale); }
      line(-0.8, -0.8, 0.8, -0.63, wood, 0.05);
    } else if (f === 'drum' || f === 'gobletdrum' || f === 'tabla' || f === 'drumset') {
      if (f === 'tabla') { drum(-0.47, -0.1, 0.33, 0.7); drum(0.4, -0.28, 0.39, 0.88); oval(-0.47, -0.1, 0.12, 0.065, dark); oval(0.4, -0.28, 0.14, 0.07, dark); }
      else if (f === 'drumset') { oval(0, 0.48, 0.53, 0.53, wood); oval(0, 0.48, 0.43, 0.43, pale); drum(-0.42, -0.36, 0.32, 0.36); drum(0.35, -0.3, 0.28, 0.32); line(-0.86, -0.65, -0.86, 0.9); line(0.84, -0.6, 0.84, 0.9); oval(-0.86, -0.65, 0.34, 0.08, brass); oval(0.84, -0.6, 0.31, 0.08, brass); }
      else if (f === 'gobletdrum') { x.fillStyle = wood; x.beginPath(); x.moveTo(-0.5, -0.55); x.lineTo(0.5, -0.55); x.lineTo(0.17, 0.35); x.lineTo(0.3, 0.85); x.lineTo(-0.3, 0.85); x.lineTo(-0.17, 0.35); x.closePath(); x.fill(); x.stroke(); oval(0, -0.55, 0.5, 0.16, pale); }
      else drum(0, -0.45, 0.68, 1.15);
    } else if (f === 'concertflute' || f === 'oboe' || f === 'clarinet' || f === 'bassclarinet' || f === 'bassoon' || f === 'contrabassoon') {
      var silver = '#c9d2d6', bassWood = f === 'bassoon' || f === 'contrabassoon', crooked = f === 'bassclarinet';
      if (r.id === 'piccolo' || r.id === 'eflatclarinet') x.scale(0.8, 0.8);
      x.rotate(f === 'concertflute' ? 0.6 : 0.18);
      box(-0.11, -0.82, 0.22, 1.58, f === 'concertflute' ? silver : bassWood ? wood : '#2b2c2d');
      if (bassWood) { box(0.12, -0.9, 0.14, 1.7, wood); oval(0.075, 0.78, 0.18, 0.12, wood); }
      for (var wk = 0; wk < 8; wk++) { var wy = -0.65 + wk * 0.18; oval(0.06, wy, 0.07, 0.045, silver); line(-0.06, wy, 0.14, wy, silver, 0.018); }
      line(0.14, -0.68, 0.14, 0.65, silver, 0.025);
      if (f === 'concertflute') { oval(0, -0.78, 0.1, 0.05, '#596a71'); box(-0.13, 0.67, 0.26, 0.06, silver); }
      else if (bassWood || crooked) {
        x.strokeStyle = silver; x.lineWidth = 0.07; x.beginPath(); x.moveTo(0, -0.82); x.bezierCurveTo(-0.03, -1.17, -0.45, -0.78, -0.4, -0.99); x.stroke(); x.strokeStyle = dark; x.lineWidth = 0.025;
        if (crooked) { x.strokeStyle = silver; x.lineWidth = 0.16; x.beginPath(); x.moveTo(0, 0.65); x.bezierCurveTo(0, 1.1, 0.55, 1.1, 0.55, 0.65); x.stroke(); x.strokeStyle = dark; x.lineWidth = 0.025; oval(0.55, 0.65, 0.17, 0.08, silver); oval(0.55, 0.65, 0.1, 0.035, dark); }
        if (f === 'contrabassoon') { box(0.31, -0.95, 0.12, 1.65, wood); line(0.18, -0.92, 0.37, -0.92, silver, 0.13); oval(0.37, 0.68, 0.14, 0.1, silver); }
      } else {
        if (r.id === 'englishhorn') { line(0, -0.82, -0.18, -1.02, silver, 0.04); oval(0, 0.82, 0.19, 0.2, '#3c2d20'); }
        else { box(-0.04, -1.03, 0.08, 0.2, '#b19a63'); x.fillStyle = '#25272a'; x.beginPath(); x.moveTo(-0.1, 0.66); x.lineTo(0.1, 0.66); x.lineTo(0.23, 0.94); x.lineTo(-0.23, 0.94); x.closePath(); x.fill(); x.stroke(); oval(0, 0.94, 0.23, 0.055, dark); }
      }
    } else if (f === 'trumpet' || f === 'trombone' || f === 'frenchhorn' || f === 'tuba' || f === 'saxophone') {
      // 굽은 금속 관을 두 겹으로 그려 테두리와 황동 빛을 낸다.
      function tube(points, width) { [dark, brass].forEach(function (color, pass) { x.strokeStyle = color; x.lineWidth = pass ? width : width + 0.045; x.beginPath(); x.moveTo(points[0], points[1]); for (var ti = 2; ti < points.length; ti += 2) x.lineTo(points[ti], points[ti + 1]); x.stroke(); }); x.strokeStyle = dark; x.lineWidth = 0.025; }
      function bell(bx, by, size, up) { x.save(); x.translate(bx, by); if (!up) x.rotate(Math.PI / 2); x.fillStyle = brass; x.beginPath(); x.moveTo(-0.09, 0.25); x.lineTo(0.09, 0.25); x.quadraticCurveTo(0.11, -0.05, size, -0.25); x.lineTo(-size, -0.25); x.quadraticCurveTo(-0.11, -0.05, -0.09, 0.25); x.fill(); x.stroke(); oval(0, -0.25, size, size * 0.25, '#6b4c24'); x.restore(); }
      if (f === 'trumpet') { if (r.id === 'cornet') x.scale(0.9, 0.9); tube([-0.98, -0.1, 0.5, -0.1, 0.55, 0.35, -0.55, 0.35, -0.62, 0.13, 0.55, 0.13], 0.1); bell(0.75, -0.1, 0.32, false); for (var v = 0; v < 3; v++) { box(-0.25 + v * 0.21, -0.12, 0.08, 0.47, brass); line(-0.21 + v * 0.21, -0.12, -0.21 + v * 0.21, -0.37, brass, 0.045); box(-0.28 + v * 0.21, -0.4, 0.14, 0.05, pale); } }
      else if (f === 'trombone') { tube([-0.97, -0.12, 0.8, -0.12, 0.93, 0.04, 0.8, 0.22, -0.7, 0.22, -0.8, 0.35, -0.7, 0.48, -0.2, 0.48, -0.1, -0.38, 0.56, -0.38], 0.075); bell(0.76, -0.38, 0.33, false); line(0.52, -0.13, 0.52, 0.23, brass, 0.07); if (r.id === 'basstrombone') oval(-0.35, 0.12, 0.19, 0.16, brass); }
      else if (f === 'frenchhorn') { x.strokeStyle = dark; x.lineWidth = 0.17; x.beginPath(); x.arc(-0.12, 0.15, 0.55, 0, Math.PI * 2); x.stroke(); x.strokeStyle = brass; x.lineWidth = 0.12; x.stroke(); x.strokeStyle = dark; x.lineWidth = 0.025; oval(-0.12, 0.15, 0.35, 0.35, brass); oval(-0.12, 0.15, 0.25, 0.25, dark); tube([-0.62, -0.13, -0.72, -0.7, -0.45, -0.95], 0.07); bell(0.55, 0.25, 0.45, false); for (var hv = 0; hv < 3; hv++) box(-0.34 + hv * 0.19, -0.15, 0.09, 0.3, pale); }
      else if (f === 'tuba') { tube([-0.4, -0.65, -0.65, 0.62, -0.36, 0.88, 0.35, 0.88, 0.58, 0.62, 0.58, -0.35], 0.21); tube([-0.35, 0.55, -0.3, -0.23, 0.1, -0.23, 0.1, 0.55, -0.35, 0.55], 0.13); bell(0.58, -0.55, 0.46, true); for (var tv = 0; tv < 3; tv++) box(-0.22 + tv * 0.19, -0.1, 0.09, 0.53, brass); }
      else { tube([-0.37, -0.95, -0.14, -0.8, 0.15, 0.62, 0.4, 0.85, 0.68, 0.6, 0.68, 0.32], 0.15); bell(0.68, 0.25, 0.28, true); for (var sk = 0; sk < 7; sk++) oval(-0.18 + sk * 0.04, -0.65 + sk * 0.19, 0.065, 0.05, pale); }
    } else if (f === 'timpani' || f === 'snaredrum' || f === 'tenordrum' || f === 'bassdrum') {
      if (f === 'timpani') {
        [-0.47, 0.47].forEach(function (dx) { oval(dx, 0.15, 0.43, 0.48, '#b77c46'); oval(dx, -0.17, 0.44, 0.16, pale); line(dx - 0.25, 0.5, dx - 0.3, 0.9, dark, 0.05); line(dx + 0.25, 0.5, dx + 0.3, 0.9, dark, 0.05); });
        line(-0.65, -0.8, 0.45, -0.38, wood, 0.045); oval(0.45, -0.38, 0.1, 0.1, pale); line(0.65, -0.8, -0.45, -0.38, wood, 0.045); oval(-0.45, -0.38, 0.1, 0.1, pale);
      } else if (f === 'bassdrum') { oval(0, 0, 0.8, 0.88, wood); oval(0, 0, 0.69, 0.77, pale); line(-0.5, 0.7, -0.65, 1.02, dark, 0.07); line(0.5, 0.7, 0.65, 1.02, dark, 0.07); line(0.45, -0.85, 0.98, 0.5, wood, 0.06); oval(0.45, -0.85, 0.15, 0.15, pale); }
      else { drum(0, -0.15, 0.65, f === 'tenordrum' ? 0.85 : 0.45); line(-0.6, -0.7, 0.6, 0, wood, 0.045); line(0.6, -0.7, -0.6, 0, wood, 0.045); if (f === 'snaredrum') for (var sw = 0; sw < 5; sw++) line(-0.26 + sw * 0.12, 0.32, -0.26 + sw * 0.12, 0.42, '#b7bfc5', 0.025); }
    } else if (f === 'triangle') {
      x.strokeStyle = '#4a4b4c'; x.lineWidth = 0.12; x.beginPath(); x.moveTo(0.57, 0.75); x.lineTo(-0.75, 0.75); x.lineTo(0, -0.7); x.lineTo(0.75, 0.75); x.stroke(); x.strokeStyle = '#dce3e4'; x.lineWidth = 0.07; x.stroke(); line(0, -0.7, 0, -1.05, dark, 0.025); line(0.45, -0.55, 1.04, 0.65, '#aab5bc', 0.055);
    } else if (f === 'tambourine' || f === 'cymbals' || f === 'suspendedcymbal' || f === 'tamtam') {
      if (f === 'cymbals') { oval(-0.35, -0.15, 0.57, 0.68, brass); oval(0.37, 0.16, 0.57, 0.68, '#d8b965'); oval(-0.35, -0.15, 0.1, 0.12, wood); oval(0.37, 0.16, 0.1, 0.12, wood); }
      else if (f === 'suspendedcymbal') { line(0, -0.2, 0, 0.85, dark, 0.05); line(0, 0.7, -0.5, 1, dark, 0.05); line(0, 0.7, 0.5, 1, dark, 0.05); oval(0, -0.25, 0.85, 0.2, brass); oval(0, -0.25, 0.15, 0.08, '#e1c77d'); }
      else { if (f === 'tamtam') { box(-0.98, -1, 0.08, 2, dark); box(0.9, -1, 0.08, 2, dark); box(-0.98, -1, 1.96, 0.08, dark); line(-0.3, -0.93, -0.3, -0.6); line(0.3, -0.93, 0.3, -0.6); } oval(0, 0, 0.78, 0.78, f === 'tamtam' ? brass : wood); oval(0, 0, 0.66, 0.66, f === 'tamtam' ? '#b59149' : pale); if (f === 'tambourine') for (var tj = 0; tj < 10; tj++) { var ta = tj / 10 * Math.PI * 2; oval(Math.cos(ta) * 0.72, Math.sin(ta) * 0.72, 0.1, 0.055, '#c9d2d6'); } }
    } else if (f === 'metalbars' || f === 'orchestralmallet' || f === 'crotales') {
      box(-0.9, -0.4, 1.8, 0.8, wood);
      for (var mb = 0; mb < 12; mb++) { var bx = -0.82 + mb * 0.14, bh = 0.64 - mb * 0.025; if (f === 'crotales') oval(bx + 0.06, 0, 0.07, 0.11, brass); else { if (r.id === 'marimba' || r.id === 'vibraphone') box(bx + 0.015, 0.25, 0.08, 0.6 - mb * 0.035, r.id === 'marimba' ? brass : '#8a9d9d'); box(bx, -bh / 2, 0.12, bh, f === 'metalbars' ? '#bcc9cf' : '#ac7540'); } }
      if (r.id !== 'glockenspiel') { line(-0.77, 0.4, -0.77, 0.95, dark, 0.05); line(0.77, 0.4, 0.77, 0.95, dark, 0.05); }
      line(-0.65, -0.9, -0.1, -0.3, wood, 0.035); oval(-0.1, -0.3, 0.075, 0.075, pale); line(0.65, -0.9, 0.1, -0.3, wood, 0.035); oval(0.1, -0.3, 0.075, 0.075, pale);
    } else if (f === 'tubularbells') {
      box(-0.9, -1.03, 1.8, 0.08, dark); box(-0.9, -1.03, 0.08, 2.1, dark); box(0.82, -1.03, 0.08, 2.1, dark);
      for (var cb = 0; cb < 10; cb++) { var cx = -0.73 + cb * 0.15; line(cx, -0.95, cx, -0.72, dark); box(cx - 0.045, -0.72, 0.09, 1.6 - cb * 0.055, brass); line(cx - 0.015, -0.68, cx - 0.015, 0.8 - cb * 0.055, pale, 0.012); }
    } else if (f === 'flute' || f === 'horn') {
      x.rotate(0.55); box(-0.085, -1.05, 0.17, 2.1, wood); for (var h = 0; h < 6; h++) oval(0, -0.55 + h * 0.23, 0.035, 0.045, dark);
      if (f === 'horn') { x.fillStyle = brass; x.beginPath(); x.moveTo(-0.09, 0.5); x.lineTo(0.09, 0.5); x.lineTo(0.34, 1); x.lineTo(-0.34, 1); x.closePath(); x.fill(); x.stroke(); oval(0, 1, 0.34, 0.08, dark); }
      else { box(-0.1, -0.85, 0.2, 0.045, brass); box(-0.1, 0.8, 0.2, 0.045, brass); }
    } else if (f === 'panpipe' || f === 'mouthorgan' || f === 'bamboo') {
      var pipes = f === 'bamboo' ? 4 : 9; for (var p = 0; p < pipes; p++) { var px = -0.7 + p * 1.4 / pipes, top = f === 'panpipe' ? -0.7 : -0.9 + Math.abs(p - pipes / 2) * 0.12, len = f === 'panpipe' ? 1.6 - p * 0.1 : 1.5 - top * 0.1; box(px, top, 0.11, len, '#c7a864'); oval(px + 0.055, top, 0.055, 0.025, dark); }
      line(-0.76, 0.25, 0.76, 0.25, f === 'panpipe' ? '#a64434' : dark, 0.08); line(-0.76, 0.45, 0.76, 0.45, dark, 0.045);
      if (f === 'mouthorgan') { oval(0, 0.8, 0.6, 0.18, wood); line(0.5, 0.8, 0.9, 0.65, wood, 0.1); }
    } else if (f === 'accordion') {
      box(-0.85, -0.55, 0.35, 1.1, '#7c2932'); box(-0.5, -0.48, 1, 0.96, '#633a29'); for (var a = 0; a < 10; a++) line(-0.47 + a * 0.1, -0.47, -0.47 + a * 0.1, 0.47, brass, 0.035);
      box(0.5, -0.55, 0.35, 1.1, '#7c2932'); x.save(); x.translate(0.81, -0.48); x.rotate(Math.PI / 2); keys(0, 0, 0.96, 0.26, 10); x.restore();
      for (var b = 0; b < 8; b++) oval(-0.67, -0.4 + b * 0.11, 0.03, 0.03, pale);
    } else if (f === 'piano' || f === 'organ' || f === 'celesta' || f === 'harpsichord') {
      box(-0.85, -0.48, 1.7, 1.1, '#4e2b22'); box(-0.85, 0.6, 0.12, 0.45, wood); box(0.73, 0.6, 0.12, 0.45, wood); keys(-0.79, 0.13, 1.58, 0.36, 16);
      if (f === 'organ') for (var o = 0; o < 9; o++) box(-0.71 + o * 0.16, -1.05 + Math.abs(o - 4) * 0.09, 0.12, 1.05 - Math.abs(o - 4) * 0.09, '#bdaf87');
      else if (f === 'harpsichord') { x.fillStyle = wood; x.beginPath(); x.moveTo(-0.78, 0.05); x.lineTo(-0.6, -0.95); x.lineTo(0.65, -0.65); x.lineTo(0.78, 0.05); x.closePath(); x.fill(); x.stroke(); for (var hc = 0; hc < 12; hc++) line(-0.55 + hc * 0.1, -0.62, -0.6 + hc * 0.11, 0, pale, 0.012); }
      else { box(-0.78, -0.4, 1.56, 0.4, wood); line(-0.7, -0.25, 0.7, -0.25, brass); if (f === 'celesta') for (var ck = 0; ck < 9; ck++) box(-0.58 + ck * 0.14, -0.32, 0.09, 0.22, '#bfcbd0'); }
    } else if (f === 'harp') {
      line(-0.7, 0.9, 0.65, 0.9, wood, 0.17); line(0.65, -0.85, 0.65, 0.9, brass, 0.14); line(-0.7, 0.9, -0.25, -0.9, wood, 0.2); line(-0.25, -0.9, 0.65, -0.85, brass, 0.13);
      for (var hs = 0; hs < 10; hs++) { var hx = -0.45 + hs * 0.11; line(hx, hs < 2 ? -0.25 - hs * 0.3 : -0.8, hx, 0.82, pale, 0.014); }
    } else if (f === 'bagpipe') {
      oval(-0.08, 0.27, 0.6, 0.4, '#7f3f36'); for (var q = 0; q < 3; q++) { line(-0.4 + q * 0.3, 0.1, -0.7 + q * 0.35, -1 + q * 0.12, wood, 0.1); oval(-0.7 + q * 0.35, -1 + q * 0.12, 0.09, 0.04, brass); } line(0.4, 0.3, 0.75, 0.98, wood, 0.09); line(0.3, 0.05, 0.75, -0.35, wood, 0.07);
    } else if (f === 'xylophone' || f === 'gongset' || f === 'lamellophone') {
      box(-0.8, -0.55, 1.6, 1.1, wood);
      for (var m = 0; m < 10; m++) { var mx = -0.7 + m * 0.14; box(mx, -0.45 + m * 0.025, 0.11, 0.9 - m * 0.055, f === 'xylophone' ? '#d0a16b' : brass); }
      if (f !== 'lamellophone') { line(-0.85, 0.95, -0.45, 0.1, wood, 0.045); oval(-0.45, 0.1, 0.08, 0.08, pale); line(0.85, 0.95, 0.45, 0.1, wood, 0.045); oval(0.45, 0.1, 0.08, 0.08, pale); }
      if (f === 'gongset') { oval(0, -0.78, 0.45, 0.35, brass); oval(0, -0.78, 0.1, 0.08, wood); }
    } else if (f === 'gong') {
      oval(0, 0, 0.77, 0.77, brass); oval(0, 0, 0.62, 0.62, '#d8b965'); line(0.45, -0.8, 0.95, 0.8, wood, 0.065); oval(0.45, -0.8, 0.1, 0.12, pale);
    } else if (f === 'rattle' || f === 'clappers') {
      [-1, 1].forEach(function (side) { x.save(); x.translate(side * 0.4, 0); x.rotate(side * 0.25); if (f === 'rattle') { box(-0.05, 0.05, 0.1, 0.88, wood); oval(0, -0.3, 0.29, 0.4, wood); line(-0.24, -0.3, 0.24, -0.3, '#b64132', 0.1); } else { oval(0, 0, 0.27, 0.4, wood); oval(0.06, 0.04, 0.22, 0.34, '#673c24'); line(0, -0.35, 0, -0.8, '#b64132', 0.045); } x.restore(); });
    }
  }

  // ---------------------------------------------------------------- 발견 유물 (images/relics/ID 가 없을 때 그리는 진열대 그림)
  var RELIC_BG = { treasure: ['#5a1420', '#1e0608'], gift: ['#4a1e4e', '#16061a'], weapon: ['#1e3048', '#070c16'], armor: ['#4a3218', '#140c04'],
    book: ['#1e3e2a', '#06120a'], fig: ['#12404a', '#041216'], animal: ['#34401a', '#0e1206'] };
  A.relicArt = function (r, w, h, opts) {
    w = w || 256; h = h || w;
    opts = opts || {};
    var c = A.canvas(w, h), x = c.getContext('2d'), rng = U.makeRng(U.strHash(r.id || 'relic'));
    var bg = RELIC_BG[r.kind] || RELIC_BG.treasure, m = Math.min(w, h), nm = r.name || '';
    if (!opts.transparent) {
      var g = x.createRadialGradient(w / 2, h * 0.42, m * 0.05, w / 2, h / 2, m * 0.75);
      g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
      // 벨벳 결
      for (var i = 0; i < 60; i++) { x.fillStyle = 'rgba(255,255,255,' + (rng() * 0.025) + ')'; x.fillRect(rng() * w, rng() * h, 1 + rng() * m * 0.02, 1); }
      // 받침대
      x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(w / 2, h * 0.84, m * 0.34, m * 0.07, 0, 0, 7); x.fill();
    }
    x.save(); x.translate(w / 2, h * 0.5); var S = m * 0.36; x.scale(S, S); x.lineJoin = 'round'; x.lineCap = 'round';
    function gold(a, b) { var gg = x.createLinearGradient(-1, -1, 1, 1); gg.addColorStop(0, a || '#fbe39a'); gg.addColorStop(0.5, '#d9a93e'); gg.addColorStop(1, b || '#7a4e12'); return gg; }
    function steel() { var gg = x.createLinearGradient(-1, -1, 1, 1); gg.addColorStop(0, '#f0f4f8'); gg.addColorStop(0.5, '#a9b4bf'); gg.addColorStop(1, '#4a5560'); return gg; }
    function line(col, wd) { x.strokeStyle = col; x.lineWidth = wd / S * m * 0.01; }
    var has = function (k) { return nm.indexOf(k) >= 0; };
    var K = r.kind;
    if (K === 'instrument') {
      instrumentArt(r, x);
    } else if (K === 'weapon') {
      x.rotate(-0.75);
      if (has('도끼')) { x.fillStyle = '#6a4a2a'; x.fillRect(-0.05, -1, 0.1, 2); x.fillStyle = gold('#fff1c0', '#8a6020'); [-1, 1].forEach(function (sd) { x.beginPath(); x.moveTo(0, -0.75); x.quadraticCurveTo(sd * 0.75, -1.05, sd * 0.6, -0.3); x.quadraticCurveTo(sd * 0.3, -0.45, 0, -0.35); x.fill(); }); }
      else if (has('곤봉')) { x.fillStyle = '#5a3a1e'; x.fillRect(-0.06, -0.3, 0.12, 1.3); x.fillStyle = has('청동') ? gold('#f0c070', '#6a4010') : '#6a4a28'; x.beginPath(); for (var a = 0; a < 12; a++) { var rr = a % 2 ? 0.22 : 0.42; x.lineTo(Math.cos(a / 12 * 6.283) * rr, -0.5 + Math.sin(a / 12 * 6.283) * rr); } x.fill(); }
      else if (has('부메랑')) { x.rotate(0.75); x.fillStyle = '#9a6a3a'; x.beginPath(); x.moveTo(-0.95, 0.35); x.quadraticCurveTo(0, -0.95, 0.95, 0.35); x.quadraticCurveTo(0, -0.55, -0.95, 0.35); x.fill(); line('#e8d0a0', 2); x.beginPath(); x.moveTo(-0.5, -0.05); x.quadraticCurveTo(0, -0.55, 0.5, -0.05); x.stroke(); }
      else if (has('작살')) { x.fillStyle = '#e8dcc0'; x.fillRect(-0.035, -0.6, 0.07, 1.65); x.beginPath(); x.moveTo(0, -1.05); x.lineTo(0.14, -0.6); x.lineTo(-0.14, -0.6); x.fill(); x.fillRect(0.03, -0.72, 0.18, 0.05); }
      else {
        var blade = has('청동') || has('운철') ? gold('#f6e0a8', '#7a5020') : steel(); var short = has('단검') ? 0.6 : 1;
        x.fillStyle = blade; x.beginPath(); x.moveTo(0, -1.05 * short - 0.05); x.lineTo(0.09, -0.2); x.lineTo(0.09, 0.25); x.lineTo(-0.09, 0.25); x.lineTo(-0.09, -0.2); x.closePath(); x.fill();
        line('rgba(255,255,255,.6)', 1.5); x.beginPath(); x.moveTo(0, -1.0 * short); x.lineTo(0, 0.2); x.stroke();
        x.fillStyle = gold(); x.fillRect(-0.34, 0.25, 0.68, 0.09); x.fillStyle = '#3a2210'; x.fillRect(-0.06, 0.34, 0.12, 0.42);
        x.fillStyle = gold(); x.beginPath(); x.arc(0, 0.84, 0.1, 0, 7); x.fill(); x.fillStyle = '#c0203a'; x.beginPath(); x.arc(0, 0.29, 0.05, 0, 7); x.fill();
      }
    } else if (K === 'armor') {
      if (has('방패')) { x.fillStyle = '#2e7a4a'; x.beginPath(); x.arc(0, 0, 0.85, 0, 7); x.fill(); for (var f = 0; f < 18; f++) { x.fillStyle = ['#2fa86a', '#e8c040', '#c83a2a'][f % 3]; x.beginPath(); x.ellipse(Math.cos(f / 18 * 6.283) * 0.62, Math.sin(f / 18 * 6.283) * 0.62, 0.16, 0.06, f / 18 * 6.283, 0, 7); x.fill(); } line('#e8c040', 3); x.beginPath(); x.arc(0, 0, 0.85, 0, 7); x.stroke(); }
      else if (has('망토') || has('외투') || has('갑옷')) {
        var fur = has('호랑이') ? '#d8902a' : has('흰곰') || has('북극곰') ? '#eeeae0' : has('악어') || has('괴수') ? '#5a6a3a' : '#a07a4a';
        x.fillStyle = fur; x.beginPath(); x.moveTo(-0.35, -0.85); x.lineTo(0.35, -0.85); x.quadraticCurveTo(0.6, 0, 0.85, 0.85); x.lineTo(-0.85, 0.85); x.quadraticCurveTo(-0.6, 0, -0.35, -0.85); x.fill();
        x.fillStyle = 'rgba(0,0,0,.25)'; for (var st = 0; st < 7; st++) { if (has('호랑이')) { x.fillRect(-0.6 + st * 0.18, -0.3 + (st % 2) * 0.2, 0.06, 0.6); } else if (has('악어') || has('괴수')) { x.fillRect(-0.55 + st * 0.16, -0.1, 0.12, 0.12); x.fillRect(-0.5 + st * 0.16, 0.2, 0.12, 0.12); } }
        line('rgba(0,0,0,.35)', 2); x.beginPath(); x.moveTo(0, -0.85); x.lineTo(0, 0.85); x.stroke();
      } else { // 투구
        x.fillStyle = gold('#fff0b0', '#6a4410'); x.beginPath(); x.arc(0, 0.1, 0.62, Math.PI, 0); x.lineTo(0.62, 0.6); x.lineTo(0.3, 0.6); x.lineTo(0.3, 0.2); x.lineTo(-0.3, 0.2); x.lineTo(-0.3, 0.6); x.lineTo(-0.62, 0.6); x.closePath(); x.fill();
        x.fillRect(-0.05, 0.1, 0.1, 0.5); x.fillStyle = '#5a3a14'; x.beginPath(); x.ellipse(0, -0.62, 0.32, 0.12, 0, 0, 7); x.fill(); x.fillStyle = gold(); x.beginPath(); x.ellipse(0, -0.68, 0.28, 0.11, 0, 0, 7); x.fill();
      }
    } else if (K === 'book' && (has('해도') || has('지도'))) {   // 발견 증거품: 말아 둔 해도 (해안선·나침도·뱃길)
      x.fillStyle = '#e6d3a4'; x.fillRect(-0.78, -0.6, 1.56, 1.2);
      x.fillStyle = 'rgba(120,80,30,.12)'; for (var mk = 0; mk < 14; mk++) { x.beginPath(); x.arc(-0.7 + rng() * 1.4, -0.5 + rng() * 1.0, 0.05 + rng() * 0.12, 0, 7); x.fill(); }
      x.fillStyle = '#c9ad72'; x.strokeStyle = '#5a3a1e'; x.lineWidth = 0.025; x.beginPath(); x.moveTo(-0.78, -0.6);
      var cx0 = -0.78, cy0 = -0.6; for (var ci = 0; ci < 12; ci++) { cx0 += 0.05 + rng() * 0.05; cy0 += 0.04 + (rng() - 0.3) * 0.12; x.lineTo(cx0, Math.min(0.6, cy0)); }
      x.lineTo(-0.78, 0.6); x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(90,60,30,.35)'; x.lineWidth = 0.01; for (var rl0 = 0; rl0 < 12; rl0++) { var ra0 = rl0 / 12 * 6.283; x.beginPath(); x.moveTo(0.35, 0.05); x.lineTo(0.35 + Math.cos(ra0) * 0.9, 0.05 + Math.sin(ra0) * 0.9); x.stroke(); }
      for (var rp = 0; rp < 4; rp++) { x.save(); x.translate(0.35, 0.05); x.rotate(rp * Math.PI / 2); x.fillStyle = rp % 2 ? '#7a2a1e' : '#1e3552'; x.beginPath(); x.moveTo(0, 0); x.lineTo(0.05, -0.05); x.lineTo(0, -0.26); x.lineTo(-0.05, -0.05); x.fill(); x.restore(); }
      x.strokeStyle = 'rgba(150,40,30,.85)'; x.lineWidth = 0.022; x.setLineDash([0.05, 0.05]); x.beginPath(); x.moveTo(-0.35, 0.5); x.bezierCurveTo(-0.1, 0.45, 0.0, -0.2, 0.55, -0.4); x.stroke(); x.setLineDash([]);
      x.fillStyle = '#8a5a2a'; x.fillRect(-0.86, -0.66, 0.1, 1.32); x.fillRect(0.76, -0.66, 0.1, 1.32);
      x.fillStyle = '#7a1e1a'; x.beginPath(); x.arc(0.62, 0.42, 0.09, 0, 7); x.fill();   // 봉랍
    } else if (K === 'book') {
      if (has('두루마리') || has('탁본') || has('편지') || has('다라니')) {
        x.fillStyle = '#e8d8b0'; x.fillRect(-0.7, -0.55, 1.4, 1.05); x.fillStyle = '#8a5a2a'; x.fillRect(-0.82, -0.62, 0.14, 1.2); x.fillRect(0.68, -0.62, 0.14, 1.2);
        x.fillStyle = 'rgba(40,30,20,.7)'; for (var ln = 0; ln < 7; ln++) for (var ch = 0; ch < 8; ch++) if (rng() < 0.8) x.fillRect(-0.55 + ch * 0.14, -0.42 + ln * 0.13, 0.08 + rng() * 0.03, 0.05);
      } else if (has('점토판') || has('벽돌') || has('목판')) {
        x.fillStyle = has('목판') ? '#6a4a2a' : '#b08a5a'; x.fillRect(-0.62, -0.78, 1.24, 1.5);
        x.fillStyle = 'rgba(40,24,10,.55)'; for (var l2 = 0; l2 < 9; l2++) for (var c2 = 0; c2 < 7; c2++) if (rng() < 0.75) { x.beginPath(); x.moveTo(-0.5 + c2 * 0.16, -0.64 + l2 * 0.15); x.lineTo(-0.42 + c2 * 0.16, -0.6 + l2 * 0.15); x.lineTo(-0.5 + c2 * 0.16, -0.56 + l2 * 0.15); x.fill(); }
      } else {
        x.fillStyle = '#6a2418'; x.fillRect(-0.62, -0.8, 1.24, 1.6); x.fillStyle = '#efe2c0'; x.fillRect(0.5, -0.74, 0.1, 1.48);
        line(gold(), 4); x.strokeRect(-0.5, -0.66, 1.0, 1.32); x.fillStyle = gold(); x.beginPath(); x.arc(0, 0, 0.2, 0, 7); x.fill(); x.fillStyle = '#2a5ab0'; x.beginPath(); x.arc(0, 0, 0.09, 0, 7); x.fill();
      }
    } else if (K === 'gift') {
      line(gold(), 5); x.beginPath(); x.arc(0, -0.45, 0.7, 0.15, Math.PI - 0.15); x.stroke();
      var gem = has('루비') ? '#d0203a' : has('청록') ? '#3ac0c0' : has('깃털') ? '#2fa86a' : has('비취') ? '#3a9a5a' : ['#d0203a', '#2a6ad0', '#e0b020', '#30a070'][Math.floor(rng() * 4)];
      for (var b = 0; b < 9; b++) { var an = 0.3 + b / 8 * (Math.PI - 0.6); x.fillStyle = b % 2 ? gold() : gem; x.beginPath(); x.arc(Math.cos(an) * 0.7, -0.45 + Math.sin(an) * 0.7, 0.07, 0, 7); x.fill(); }
      x.fillStyle = gold(); x.beginPath(); x.moveTo(0, 0.2); x.lineTo(0.28, 0.5); x.lineTo(0, 0.9); x.lineTo(-0.28, 0.5); x.closePath(); x.fill();
      x.fillStyle = gem; x.beginPath(); x.moveTo(0, 0.32); x.lineTo(0.17, 0.52); x.lineTo(0, 0.76); x.lineTo(-0.17, 0.52); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(-0.05, 0.46, 0.04, 0, 7); x.fill();
    } else if (K === 'fig') {
      var wood = has('금동') ? gold() : has('여신') ? '#e8e0d0' : '#8a5a30';
      x.fillStyle = wood; x.beginPath(); x.moveTo(-0.7, 0.9); x.quadraticCurveTo(-0.55, -0.2, 0.05, -0.55); x.quadraticCurveTo(0.35, -0.85, 0.7, -0.6); x.quadraticCurveTo(0.8, -0.45, 0.55, -0.35); x.quadraticCurveTo(0.2, -0.25, 0.05, 0.1); x.quadraticCurveTo(-0.1, 0.5, 0.1, 0.9); x.closePath(); x.fill();
      x.fillStyle = '#1a0e06'; x.beginPath(); x.arc(0.42, -0.6, 0.05, 0, 7); x.fill();
      line('rgba(0,0,0,.3)', 2); for (var sc = 0; sc < 5; sc++) { x.beginPath(); x.arc(-0.35 + sc * 0.08, 0.5 - sc * 0.22, 0.12, 0.2, 2.2); x.stroke(); }
      if (has('봉황') || has('신천옹') || has('알바트로스') || has('군함조')) { x.fillStyle = wood; x.beginPath(); x.moveTo(-0.2, -0.05); x.quadraticCurveTo(-0.9, -0.6, -0.95, 0.15); x.quadraticCurveTo(-0.55, -0.05, -0.2, 0.25); x.fill(); }
    } else if (K === 'animal') {
      if (has('씨앗') || has('묘목') || has('솔방울')) { x.fillStyle = '#6a4a2a'; x.beginPath(); x.moveTo(-0.45, 0.35); x.lineTo(0.45, 0.35); x.lineTo(0.35, 0.85); x.lineTo(-0.35, 0.85); x.fill(); line('#3a7a2a', 5); x.beginPath(); x.moveTo(0, 0.35); x.quadraticCurveTo(-0.05, -0.2, 0.05, -0.6); x.stroke(); x.fillStyle = '#5aa83a'; [[-0.35, -0.15, -0.5], [0.35, -0.4, 0.5], [-0.25, -0.65, -0.3]].forEach(function (lf) { x.beginPath(); x.ellipse(lf[0], lf[1], 0.3, 0.12, lf[2], 0, 7); x.fill(); }); }
      else if (has('깃털') || has('털')) { x.rotate(0.5); x.fillStyle = has('붉은') ? '#b0502a' : '#e8e0d0'; x.beginPath(); x.moveTo(0, -1); x.quadraticCurveTo(0.35, -0.2, 0, 0.8); x.quadraticCurveTo(-0.35, -0.2, 0, -1); x.fill(); line('#6a5a4a', 2); x.beginPath(); x.moveTo(0, -0.95); x.lineTo(0, 0.95); x.stroke(); }
      else if (has('뿔')) { line('#d8c8a0', 7); x.beginPath(); x.moveTo(0, 0.8); x.quadraticCurveTo(-0.1, 0, -0.7, -0.5); x.stroke(); x.beginPath(); x.moveTo(-0.25, 0.05); x.lineTo(-0.1, -0.6); x.stroke(); x.beginPath(); x.moveTo(-0.5, -0.3); x.lineTo(-0.55, -0.9); x.stroke(); x.fillStyle = '#d8c8a0'; x.beginPath(); x.ellipse(-0.45, -0.55, 0.35, 0.2, -0.6, 0, 7); x.fill(); }
      else if (has('등딱지') || has('비늘')) { x.fillStyle = has('비늘') ? '#3a8a8a' : '#6a5a2a'; x.beginPath(); x.ellipse(0, 0.05, 0.8, 0.6, 0, 0, 7); x.fill(); line('rgba(0,0,0,.35)', 3); for (var hx = -1; hx <= 1; hx++) for (var hy = -1; hy <= 1; hy++) { x.beginPath(); x.arc(hx * 0.38, 0.05 + hy * 0.32, 0.17, 0, 7); x.stroke(); } }
      else { // 유리 종 안의 표본
        x.fillStyle = 'rgba(200,230,240,.12)'; x.beginPath(); x.moveTo(-0.6, 0.8); x.lineTo(-0.6, -0.3); x.quadraticCurveTo(-0.6, -0.95, 0, -0.95); x.quadraticCurveTo(0.6, -0.95, 0.6, -0.3); x.lineTo(0.6, 0.8); x.fill(); line('rgba(220,240,255,.5)', 2); x.stroke();
        x.fillStyle = '#5a3a1e'; x.fillRect(-0.7, 0.8, 1.4, 0.14);
        x.fillStyle = has('물고기') ? '#3a6a9a' : has('거미') ? '#3a2a1a' : has('새') ? '#222' : '#8a6a3a';
        x.beginPath(); x.ellipse(0, 0.2, 0.36, 0.22, 0, 0, 7); x.fill(); x.beginPath(); x.arc(0.3, 0.02, 0.13, 0, 7); x.fill();
        if (has('거미')) { line('#3a2a1a', 3); for (var lg = 0; lg < 4; lg++) { x.beginPath(); x.moveTo(-0.1 + lg * 0.08, 0.2); x.lineTo(-0.45 + lg * 0.25, 0.65); x.stroke(); } }
        if (has('새')) { x.fillStyle = '#eee'; x.beginPath(); x.ellipse(0.05, 0.28, 0.2, 0.12, 0, 0, 7); x.fill(); }
      }
    } else { // treasure
      var v = has('석판') || has('점토판') ? 5 : has('눈') && !has('눈물') ? 8 : has('가면') || has('두상') ? 1 : has('원반') || has('기초판') || has('명판') || has('장식판') || has('인장') || has('도장') ? 2 : has('잔') || has('뿔잔') ? 0 : has('상') || has('코끼리') || has('말') || has('불') ? 4 : has('타일') || has('부조') || has('모자이크') || has('조각') || has('이콘') ? 5 : has('항아리') || has('토기') || has('주전자') || has('그릇') || has('솥') || has('등잔') || has('합') || has('함') || has('물통') ? 3 : Math.floor(rng() * 4);
      var metal = has('은 ') || has('은주') || has('사산') ? function () { return steel(); } : has('비취') || has('옥') ? function () { var gg = x.createLinearGradient(-1, -1, 1, 1); gg.addColorStop(0, '#a8e0b8'); gg.addColorStop(1, '#1e6a3a'); return gg; } : has('수정') || has('유리') || has('결정') ? function () { var gg = x.createLinearGradient(-1, -1, 1, 1); gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(1, 'rgba(150,190,220,.6)'); return gg; } : has('청동') || has('칠보') ? function () { return gold('#e0c890', '#3a5a4a'); } : has('토기') || has('테라코타') || has('벽돌') || has('항아리') ? function () { return gold('#e8a070', '#7a3a1a'); } : has('돌') || has('석') || has('대리석') || has('사암') ? function () { return gold('#f0e8d8', '#8a7a60'); } : function () { return gold(); };
      if (has('결정') || (has('수정') && !has('해골'))) v = 6; else if (has('도끼')) v = 7; else if (has('공')) v = 8; else if (has('깃털')) v = 9;
      x.fillStyle = metal();
      if (v === 6) { [[-0.35, 0.15, 0.22, 0.95, -0.25], [0.05, 0.05, 0.26, 1.2, 0.05], [0.4, 0.2, 0.2, 0.85, 0.3], [-0.1, 0.35, 0.16, 0.6, -0.5]].forEach(function (c) { x.save(); x.translate(c[0], c[1]); x.rotate(c[4]); x.fillStyle = metal(); x.beginPath(); x.moveTo(-c[2], 0.5); x.lineTo(-c[2], -c[3] * 0.55); x.lineTo(0, -c[3] * 0.8); x.lineTo(c[2], -c[3] * 0.55); x.lineTo(c[2], 0.5); x.closePath(); x.fill(); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-c[2] * 0.6, -c[3] * 0.5, c[2] * 0.4, c[3] * 0.9); x.restore(); }); }
      else if (v === 7) { x.rotate(-0.4); x.beginPath(); x.moveTo(0, -0.85); x.quadraticCurveTo(0.45, -0.3, 0.3, 0.75); x.quadraticCurveTo(0, 0.9, -0.3, 0.75); x.quadraticCurveTo(-0.45, -0.3, 0, -0.85); x.fill(); x.fillStyle = 'rgba(255,255,255,.3)'; x.beginPath(); x.ellipse(-0.1, -0.1, 0.08, 0.45, 0, 0, 7); x.fill(); }
      else if (v === 8) { var bg2 = x.createRadialGradient(-0.25, -0.3, 0.05, 0, 0, 0.7); bg2.addColorStop(0, '#e8e0c8'); bg2.addColorStop(1, '#5a4a30'); x.fillStyle = bg2; x.beginPath(); x.arc(0, 0.05, 0.62, 0, 7); x.fill(); }
      else if (v === 9) { x.rotate(0.5); x.fillStyle = '#6a8a4a'; x.beginPath(); x.moveTo(0, -1.05); x.quadraticCurveTo(0.45, -0.2, 0, 0.9); x.quadraticCurveTo(-0.45, -0.2, 0, -1.05); x.fill(); line('#3a4a2a', 2); x.beginPath(); x.moveTo(0, -1); x.lineTo(0, 1); x.stroke(); for (var fb = 0; fb < 8; fb++) { x.beginPath(); x.moveTo(0, -0.7 + fb * 0.18); x.lineTo(0.3, -0.85 + fb * 0.18); x.moveTo(0, -0.7 + fb * 0.18); x.lineTo(-0.3, -0.85 + fb * 0.18); x.stroke(); } }
      else if (v === 0) { x.beginPath(); x.moveTo(-0.55, -0.7); x.quadraticCurveTo(-0.5, 0.05, 0, 0.1); x.quadraticCurveTo(0.5, 0.05, 0.55, -0.7); x.closePath(); x.fill(); x.fillRect(-0.06, 0.08, 0.12, 0.5); x.beginPath(); x.ellipse(0, 0.66, 0.36, 0.1, 0, 0, 7); x.fill(); x.fillStyle = '#c0203a'; x.beginPath(); x.arc(0, -0.3, 0.07, 0, 7); x.fill(); }
      else if (v === 1) { x.beginPath(); x.ellipse(0, 0, 0.58, 0.8, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(40,20,0,.7)'; x.beginPath(); x.ellipse(-0.22, -0.15, 0.14, 0.05, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(0.22, -0.15, 0.14, 0.05, 0, 0, 7); x.fill(); x.fillRect(-0.18, 0.35, 0.36, 0.04); line('rgba(60,30,0,.5)', 2); x.beginPath(); x.moveTo(0, -0.1); x.lineTo(-0.06, 0.18); x.lineTo(0.06, 0.18); x.stroke(); }
      else if (v === 2) { x.beginPath(); x.arc(0, 0, 0.75, 0, 7); x.fill(); line('rgba(70,40,0,.55)', 2.5); x.beginPath(); x.arc(0, 0, 0.55, 0, 7); x.stroke(); for (var ry = 0; ry < 16; ry++) { var ra = ry / 16 * 6.283; x.beginPath(); x.moveTo(Math.cos(ra) * 0.58, Math.sin(ra) * 0.58); x.lineTo(Math.cos(ra) * 0.72, Math.sin(ra) * 0.72); x.stroke(); } x.beginPath(); x.arc(-0.15, -0.08, 0.06, 0, 7); x.arc(0.15, -0.08, 0.06, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0.12, 0.18, 0.3, 2.8); x.stroke(); }
      else if (v === 3) { x.beginPath(); x.moveTo(-0.25, -0.8); x.lineTo(0.25, -0.8); x.quadraticCurveTo(0.2, -0.5, 0.5, -0.2); x.quadraticCurveTo(0.8, 0.4, 0.3, 0.8); x.lineTo(-0.3, 0.8); x.quadraticCurveTo(-0.8, 0.4, -0.5, -0.2); x.quadraticCurveTo(-0.2, -0.5, -0.25, -0.8); x.fill(); line('rgba(20,10,0,.55)', 3); x.beginPath(); x.moveTo(-0.62, 0.05); x.lineTo(0.62, 0.05); x.stroke(); for (var zz = 0; zz < 6; zz++) { x.beginPath(); x.moveTo(-0.55 + zz * 0.2, 0.2); x.lineTo(-0.45 + zz * 0.2, 0.4); x.lineTo(-0.35 + zz * 0.2, 0.2); x.stroke(); } }
      else if (v === 4) { x.beginPath(); x.ellipse(0, -0.5, 0.22, 0.26, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(-0.2, -0.28); x.quadraticCurveTo(-0.55, 0.1, -0.5, 0.75); x.lineTo(0.5, 0.75); x.quadraticCurveTo(0.55, 0.1, 0.2, -0.28); x.fill(); x.fillRect(-0.62, 0.72, 1.24, 0.12); }
      else { x.fillRect(-0.72, -0.62, 1.44, 1.24); line('rgba(40,20,0,.45)', 2.5); x.strokeRect(-0.62, -0.52, 1.24, 1.04); for (var q = 0; q < 5; q++) { x.beginPath(); x.moveTo(-0.5 + q * 0.25, 0.4); x.quadraticCurveTo(-0.4 + q * 0.25, -0.35, -0.3 + q * 0.25, 0.4); x.stroke(); } }
    }
    x.restore();
    // 반짝임
    if (!opts.transparent) {
      x.globalCompositeOperation = 'lighter';
      for (var sp = 0; sp < 3; sp++) { var sx = w * (0.3 + rng() * 0.4), sy = h * (0.25 + rng() * 0.4), sz = m * (0.02 + rng() * 0.03); x.strokeStyle = 'rgba(255,245,210,.55)'; x.lineWidth = Math.max(1, m * 0.006); x.beginPath(); x.moveTo(sx - sz, sy); x.lineTo(sx + sz, sy); x.moveTo(sx, sy - sz); x.lineTo(sx, sy + sz); x.stroke(); }
      x.globalCompositeOperation = 'source-over';
    }
    return c;
  };

  // ---------------------------------------------------------------- discovery vignette
  A.discoveryArt = function (d, w, h) {
    w = w || 720; h = h || 330;
    var c = A.canvas(w, h), ctx = c.getContext('2d'), rng = U.makeRng(U.strHash(d.id));
    var cat = d.cat;
    var hz = h * 0.58;
    if (cat === 'geo') {
      // chart on parchment
      ctx.fillStyle = '#e8d8b0'; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 400; i++) { ctx.fillStyle = 'rgba(120,80,30,' + rng() * 0.05 + ')'; ctx.beginPath(); ctx.arc(rng() * w, rng() * h, 2 + rng() * 30, 0, 7); ctx.fill(); }
      ctx.strokeStyle = 'rgba(90,60,30,.35)'; ctx.lineWidth = 1;
      for (var a = 0; a < 16; a++) { ctx.beginPath(); ctx.moveTo(w * 0.72, h * 0.5); ctx.lineTo(w * 0.72 + Math.cos(a / 16 * 6.283) * 900, h * 0.5 + Math.sin(a / 16 * 6.283) * 900); ctx.stroke(); }
      // coast
      ctx.fillStyle = '#c9b07a'; ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, h * 0.15);
      var x = 0, y = h * 0.15;
      for (var k = 0; k < 40; k++) { x += w * 0.012 + rng() * w * 0.012; y += (rng() - 0.35) * h * 0.06; ctx.lineTo(x, y); }
      ctx.lineTo(x, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); ctx.stroke();
      // hatching along coast
      ctx.strokeStyle = 'rgba(60,90,120,.35)'; for (var hh = 0; hh < 60; hh++) { var hx = rng() * w, hy = rng() * h; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 18, hy); ctx.stroke(); }
      // compass rose
      ctx.save(); ctx.translate(w * 0.72, h * 0.5);
      for (var r2 = 0; r2 < 8; r2++) { ctx.rotate(Math.PI / 4); ctx.fillStyle = r2 % 2 ? '#7a2a1e' : '#1e3552'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -8); ctx.lineTo(0, -(r2 % 2 ? 40 : 62)); ctx.lineTo(-8, -8); ctx.fill(); }
      ctx.restore();
      A.shipSide(ctx, w * 0.45, h * 0.62, 0.5, { sails: ['sq', 'sq', 'lat'], hull: '#3a2416', cross: true }, rng, 1);
      // dotted route
      ctx.strokeStyle = 'rgba(140,40,30,.8)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.9); ctx.bezierCurveTo(w * 0.3, h * 0.95, w * 0.35, h * 0.6, w * 0.45, h * 0.6); ctx.stroke(); ctx.setLineDash([]);
    } else {
      var preset = cat === 'ruin' ? 'golden' : cat === 'treasure' ? 'night' : cat === 'people' ? 'dusk' : 'day';
      A.sky(ctx, w, h, hz, preset, rng);
      if (preset !== 'night') A.clouds(ctx, w, h, 20, hz - 40, 4, rng, preset === 'dusk' ? '#ffd0a0' : '#fffaf0', 0.6);
      A.ridge(ctx, w, hz, 50 + rng() * 60, 1, cat === 'nature' ? '#6a8a6a' : '#8a8060', rng, d.lat && Math.abs(d.lat) > 50);
      var g = ctx.createLinearGradient(0, hz, 0, h);
      var gc = cat === 'nature' || cat === 'creature' ? ['#5a7a3a', '#2a4a1e'] : cat === 'ruin' ? ['#b89a60', '#6a5030'] : cat === 'treasure' ? ['#2a2018', '#0a0806'] : ['#8a7a4a', '#4a3a20'];
      g.addColorStop(0, gc[0]); g.addColorStop(1, gc[1]); ctx.fillStyle = g; ctx.fillRect(0, hz, w, h - hz);
      if (cat === 'nature') {
        if (/폭포/.test(d.name)) { ctx.fillStyle = 'rgba(230,240,255,.85)'; ctx.fillRect(w * 0.42, hz - 90, w * 0.16, 110); A.glow(ctx, w * 0.5, hz + 20, 160, '#ffffff', 0.4); }
        for (var t = 0; t < 14; t++) A.roundTree(ctx, rng() * w, hz + 10 + rng() * (h - hz) * 0.7, 14 + rng() * 22, '#3a6a2a', rng);
      } else if (d.id === 'tajmahal') {
        paintTaj(ctx, w, h, hz);
      } else if (cat === 'ruin') {
        ctx.fillStyle = '#d8c090';
        for (var col = 0; col < 7; col++) { var cx = w * 0.2 + col * w * 0.09, ch = 90 + (col % 3) * 20; if (rng() < 0.3) ch *= 0.5; ctx.fillRect(cx, hz + 30 - ch, 22, ch); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(cx + 14, hz + 30 - ch, 8, ch); ctx.fillStyle = '#d8c090'; }
        ctx.fillRect(w * 0.18, hz - 90, w * 0.5, 16);
        A.glow(ctx, w * 0.8, hz - 40, 200, '#ffb060', 0.3);
      } else if (cat === 'treasure') {
        A.glow(ctx, w * 0.5, hz + 30, 300, '#ffd070', 0.55);
        ctx.fillStyle = '#6a4020'; ctx.fillRect(w * 0.5 - 80, hz, 160, 80); ctx.fillStyle = '#c9a030'; ctx.fillRect(w * 0.5 - 84, hz - 6, 168, 14); ctx.fillRect(w * 0.5 - 10, hz + 10, 20, 24);
        ctx.beginPath(); ctx.moveTo(w * 0.5 - 80, hz); ctx.quadraticCurveTo(w * 0.5, hz - 70, w * 0.5 + 80, hz); ctx.fillStyle = '#7a4a24'; ctx.fill();
        for (var sp = 0; sp < 40; sp++) { ctx.fillStyle = 'rgba(255,230,150,' + rng() + ')'; ctx.fillRect(w * 0.5 + (rng() - 0.5) * 240, hz - rng() * 120, 2, 2); }
      } else if (cat === 'creature') {
        for (var t2 = 0; t2 < 8; t2++) A.palm(ctx, rng() * w, hz + 20 + rng() * 40, 80 + rng() * 60, '#2a4a1e', rng);
        ctx.fillStyle = '#1a140c';
        ctx.beginPath(); ctx.ellipse(w * 0.5, hz + 60, 70, 34, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w * 0.5 + 72, hz + 34, 26, 20, -0.4, 0, 7); ctx.fill();
        for (var lg = 0; lg < 4; lg++) ctx.fillRect(w * 0.5 - 50 + lg * 30, hz + 80, 10, 40);
      } else if (cat === 'people') {
        A.glow(ctx, w * 0.5, hz + 70, 200, '#ff9040', 0.5);
        ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(w * 0.5 - 16, hz + 80); ctx.quadraticCurveTo(w * 0.5, hz + 20, w * 0.5 + 16, hz + 80); ctx.fill();
        for (var pp = 0; pp < 6; pp++) A.person(ctx, w * 0.5 + Math.cos(pp) * 150, hz + 90 + Math.sin(pp) * 10, 90, [30, 22, 16], rng, {});
        ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(w * 0.15, hz + 60); ctx.lineTo(w * 0.22, hz - 20); ctx.lineTo(w * 0.29, hz + 60); ctx.fill();
      } else {
        for (var sk = 0; sk < 9; sk++) { var sx = w * 0.2 + (sk % 5) * 90, sy = hz + 60 + Math.floor(sk / 5) * 50; ctx.fillStyle = A.rgba(A.jitter('#b89a6a', rng, 40)); ctx.beginPath(); ctx.ellipse(sx, sy, 38, 30, 0, 0, 7); ctx.fill(); }
      }
    }
    A.grade(ctx, w, h, '#ffa850', 0.25); A.vignette(ctx, w, h, 0.6); A.applyGrain(ctx, w, h, 0.06);
    return c;
  };

  /** 흰 대리석 영묘: 양파 돔, 네 미너렛, 긴 연못과 사이프러스 */
  function paintTaj(ctx, w, h, hz) {
    var s = h / 330 * 0.72, cx = w * 0.5, base = hz + 16 * s;
    var marble = '#f5f0e6', shade = 'rgba(160,140,120,.28)', dark = '#8e8272';
    // 정원 잔디와 연못
    var g = ctx.createLinearGradient(0, base, 0, h); g.addColorStop(0, '#6f8f4a'); g.addColorStop(1, '#2f4a22');
    ctx.fillStyle = g; ctx.fillRect(0, base, w, h - base);
    ctx.fillStyle = '#e9e1d2'; ctx.beginPath(); ctx.moveTo(cx - 20 * s, base); ctx.lineTo(cx + 20 * s, base); ctx.lineTo(cx + 120 * s, h); ctx.lineTo(cx - 120 * s, h); ctx.closePath(); ctx.fill();
    var pg = ctx.createLinearGradient(0, base, 0, h); pg.addColorStop(0, '#9fc2da'); pg.addColorStop(1, '#4d7c9e');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(cx - 12 * s, base + 2); ctx.lineTo(cx + 12 * s, base + 2); ctx.lineTo(cx + 84 * s, h); ctx.lineTo(cx - 84 * s, h); ctx.closePath(); ctx.fill();
    A.glow(ctx, cx, base - 150 * s, 240 * s, '#ffe8c8', 0.14);
    // 사이프러스
    for (var k = 0; k < 7; k++) {
      var t = k / 6, yy = base + 6 + t * (h - base) * 0.95, off = 34 * s + t * 150 * s, th = 26 * s + t * 60 * s;
      [-1, 1].forEach(function (sd) {
        ctx.fillStyle = '#1f3a1c'; ctx.beginPath(); ctx.ellipse(cx + sd * off, yy - th * 0.5, th * 0.16, th * 0.55, 0, 0, 7); ctx.fill();
      });
    }
    function arch(x, y, aw, ah, col) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - aw / 2, y); ctx.lineTo(x - aw / 2, y - ah + aw * 0.5);
      ctx.quadraticCurveTo(x - aw / 2, y - ah, x, y - ah - aw * 0.18); ctx.quadraticCurveTo(x + aw / 2, y - ah, x + aw / 2, y - ah + aw * 0.5); ctx.lineTo(x + aw / 2, y); ctx.closePath(); ctx.fill();
    }
    function onion(x, y, rw, rh) {
      ctx.beginPath(); ctx.moveTo(x - rw, y);
      ctx.bezierCurveTo(x - rw * 1.45, y - rh * 0.55, x - rw * 0.35, y - rh * 0.8, x, y - rh);
      ctx.bezierCurveTo(x + rw * 0.35, y - rh * 0.8, x + rw * 1.45, y - rh * 0.55, x + rw, y);
      ctx.closePath(); ctx.fill();
    }
    // 네 미너렛
    [-1, 1].forEach(function (sd) {
      var mx = cx + sd * 178 * s, mh = 170 * s, mw = 9 * s;
      ctx.fillStyle = marble; ctx.fillRect(mx - mw / 2, base - mh, mw, mh);
      ctx.fillStyle = shade; ctx.fillRect(mx, base - mh, mw / 2, mh);
      for (var b = 1; b <= 3; b++) { ctx.fillStyle = '#e2dacb'; ctx.fillRect(mx - mw * 0.9, base - mh * b / 3.3, mw * 1.8, 3 * s); }
      ctx.fillStyle = marble; onion(mx, base - mh, mw * 0.9, 16 * s);
    });
    // 기단
    ctx.fillStyle = '#e6dfd1'; ctx.fillRect(cx - 200 * s, base - 16 * s, 400 * s, 16 * s);
    // 본당
    ctx.fillStyle = marble; ctx.fillRect(cx - 112 * s, base - 116 * s, 224 * s, 100 * s);
    ctx.fillStyle = shade; ctx.fillRect(cx + 70 * s, base - 116 * s, 42 * s, 100 * s);
    arch(cx, base - 16 * s, 46 * s, 86 * s, dark);
    [-1, 1].forEach(function (sd) {
      arch(cx + sd * 78 * s, base - 16 * s, 22 * s, 34 * s, dark);
      arch(cx + sd * 78 * s, base - 62 * s, 22 * s, 34 * s, dark);
    });
    // 드럼과 큰 돔
    ctx.fillStyle = marble; ctx.fillRect(cx - 54 * s, base - 142 * s, 108 * s, 30 * s);
    onion(cx, base - 140 * s, 60 * s, 104 * s);
    // 오른쪽 그늘 (돔 모양 안쪽만)
    ctx.save(); ctx.beginPath(); ctx.rect(cx + 14 * s, base - 250 * s, 80 * s, 112 * s); ctx.clip();
    ctx.fillStyle = shade; onion(cx, base - 140 * s, 60 * s, 104 * s); ctx.restore();
    ctx.strokeStyle = '#c9a85e'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(cx, base - 244 * s); ctx.lineTo(cx, base - 262 * s); ctx.stroke();
    // 지붕의 작은 정자 돔
    [-1, 1].forEach(function (sd) {
      ctx.fillStyle = marble; ctx.fillRect(cx + sd * 88 * s - 11 * s, base - 132 * s, 22 * s, 16 * s);
      onion(cx + sd * 88 * s, base - 130 * s, 14 * s, 26 * s);
    });
    // 연못에 비친 그림자
    ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 9 * s, base + 6, 18 * s, (h - base) * 0.55);
    ctx.restore();
  }

  // ---------------------------------------------------------------- ship picture
  A.shipCard = function (typeId, w, h, seed, spec) {
    var chain = G.Img.chain.ship(typeId);
    if (G.Img.pick(chain)) return G.Img.make(chain, w, h, function () { return paintShipCard(typeId, w, h, seed, spec); });
    return paintShipCard(typeId, w, h, seed, spec);
  };
  function paintShipCard(typeId, w, h, seed, spec) {
    var cv = A.canvas(w, h), ctx = cv.getContext('2d'), rng = U.makeRng(U.strHash(String(seed || typeId)));
    var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#cfd9df'); g.addColorStop(0.62, '#f2e2c0'); g.addColorStop(0.63, '#5d86a6'); g.addColorStop(1, '#27506e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var t = G.SHIP[typeId], look = A.shipLook ? A.shipLook(typeId, spec && spec.sails ? { sails: spec.sails } : null) : { sails: t.sails, hull: '#3a2416', cross: true, flag: '#1d3f7a' };
    // 그림 폭(배 좌표) — 카드에 꼭 맞게 줄이고, 작은 배는 조금 더 작게
    var n = look.sails.length, ht = look.hullType;
    var span = ht === 'galley' ? 270 + (look.big ? 40 : 0) : ht === 'dhow' || ht === 'jong' ? 170 + n * 24 : ht === 'junk' ? 190 + n * 22 : ht === 'kr' ? 180 : ht === 'panok' ? 220 : ht === 'turtle' ? 240 : ht === 'jp' ? (look.big ? 210 : 170) : ht === 'atake' ? 230 : ht === 'raft' ? 140 : ht === 'outrigger' ? 200 : 175 + n * 18;
    var fit = Math.min(w * 0.94 / span, h * 0.72 / 118);
    var scale = fit * U.clamp(0.66 + t.cap / 1500, 0.7, 1);
    A.shipSide(ctx, w * 0.5, h * 0.72, scale, look, rng, 1);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; for (var i = 0; i < 20; i++) ctx.fillRect(rng() * w, h * 0.66 + rng() * h * 0.3, 8 + rng() * 16, 1);
    return cv;
  }

  /** title screen painting: golden sea with a carrack under full sail */
  A.titleScene = function () {
    var W = 1600, H = 900, c = A.canvas(W, H), ctx = c.getContext('2d'), rng = U.makeRng(7);
    A.sky(ctx, W, H, 560, 'golden', rng);
    A.sun(ctx, 1120, 420, 34, '#ffb872');
    A.clouds(ctx, W, H, 80, 360, 7, rng, '#ffe6c4', 0.6);
    A.birds(ctx, 300, 120, 900, 200, 9, rng, 'rgba(70,50,40,.6)');
    A.ridge(ctx, W, 560, 40, 1, A.mix('#7a8a70', '#f2c890', 0.6), rng, false);
    // sea
    A.water(ctx, W, 560, H, '#c98e5e', '#1b3550', rng, 0.8);
    // sun glitter column
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 260; i++) {
      var y = 562 + Math.pow(rng(), 1.3) * 330, spread = 20 + (y - 560) * 0.9;
      ctx.fillStyle = 'rgba(255,210,150,' + (0.08 + rng() * 0.35) + ')';
      ctx.fillRect(1120 + (rng() - 0.5) * spread * 2, y, 8 + rng() * 40, 1.5 + (y - 560) / 160);
    }
    ctx.restore();
    // distant ships
    A.shipSide(ctx, 380, 600, 0.35, { sails: ['sq', 'sq', 'lat'], hull: '#2a1a10', cross: true }, rng, 1);
    A.shipSide(ctx, 1450, 585, 0.22, { sails: ['lat', 'lat'], hull: '#2a1a10' }, rng, -1);
    // hero ship
    A.shipSide(ctx, 760, 760, 2.1, { sails: ['sq', 'sq', 'sq', 'lat'], hull: '#3a2416', cross: true, flag: '#1d3f7a' }, rng, 1);
    // bow wave
    ctx.fillStyle = 'rgba(255,240,220,.35)';
    ctx.beginPath(); ctx.ellipse(1060, 792, 120, 12, 0, 0, Math.PI * 2); ctx.fill();
    A.grade(ctx, W, H, '#ff9a50', 0.35);
    A.vignette(ctx, W, H, 0.75);
    A.applyGrain(ctx, W, H, 0.08);
    return c;
  };

})(window.G = window.G || {});
