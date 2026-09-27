/* Painted pictures used in windows: discovery vignettes and ship cards. */
(function (G) {
  'use strict';
  var A = G.Art, U = G.U;

  // ---------------------------------------------------------------- 발견 유물 (images/relics/ID 가 없을 때 그리는 진열대 그림)
  var RELIC_BG = { treasure: ['#5a1420', '#1e0608'], gift: ['#4a1e4e', '#16061a'], weapon: ['#1e3048', '#070c16'], armor: ['#4a3218', '#140c04'],
    book: ['#1e3e2a', '#06120a'], fig: ['#12404a', '#041216'], animal: ['#34401a', '#0e1206'] };
  A.relicArt = function (r, w, h) {
    w = w || 256; h = h || w;
    var c = A.canvas(w, h), x = c.getContext('2d'), rng = U.makeRng(U.strHash(r.id || 'relic'));
    var bg = RELIC_BG[r.kind] || RELIC_BG.treasure, m = Math.min(w, h), nm = r.name || '';
    var g = x.createRadialGradient(w / 2, h * 0.42, m * 0.05, w / 2, h / 2, m * 0.75);
    g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    // 벨벳 결
    for (var i = 0; i < 60; i++) { x.fillStyle = 'rgba(255,255,255,' + (rng() * 0.025) + ')'; x.fillRect(rng() * w, rng() * h, 1 + rng() * m * 0.02, 1); }
    // 받침대
    x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(w / 2, h * 0.84, m * 0.34, m * 0.07, 0, 0, 7); x.fill();
    x.save(); x.translate(w / 2, h * 0.5); var S = m * 0.36; x.scale(S, S); x.lineJoin = 'round'; x.lineCap = 'round';
    function gold(a, b) { var gg = x.createLinearGradient(-1, -1, 1, 1); gg.addColorStop(0, a || '#fbe39a'); gg.addColorStop(0.5, '#d9a93e'); gg.addColorStop(1, b || '#7a4e12'); return gg; }
    function steel() { var gg = x.createLinearGradient(-1, -1, 1, 1); gg.addColorStop(0, '#f0f4f8'); gg.addColorStop(0.5, '#a9b4bf'); gg.addColorStop(1, '#4a5560'); return gg; }
    function line(col, wd) { x.strokeStyle = col; x.lineWidth = wd / S * m * 0.01; }
    var has = function (k) { return nm.indexOf(k) >= 0; };
    var K = r.kind;
    if (K === 'weapon') {
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
        var fur = has('호랑이') ? '#d8902a' : has('흰곰') ? '#eeeae0' : has('악어') || has('괴수') ? '#5a6a3a' : '#a07a4a';
        x.fillStyle = fur; x.beginPath(); x.moveTo(-0.35, -0.85); x.lineTo(0.35, -0.85); x.quadraticCurveTo(0.6, 0, 0.85, 0.85); x.lineTo(-0.85, 0.85); x.quadraticCurveTo(-0.6, 0, -0.35, -0.85); x.fill();
        x.fillStyle = 'rgba(0,0,0,.25)'; for (var st = 0; st < 7; st++) { if (has('호랑이')) { x.fillRect(-0.6 + st * 0.18, -0.3 + (st % 2) * 0.2, 0.06, 0.6); } else if (has('악어') || has('괴수')) { x.fillRect(-0.55 + st * 0.16, -0.1, 0.12, 0.12); x.fillRect(-0.5 + st * 0.16, 0.2, 0.12, 0.12); } }
        line('rgba(0,0,0,.35)', 2); x.beginPath(); x.moveTo(0, -0.85); x.lineTo(0, 0.85); x.stroke();
      } else { // 투구
        x.fillStyle = gold('#fff0b0', '#6a4410'); x.beginPath(); x.arc(0, 0.1, 0.62, Math.PI, 0); x.lineTo(0.62, 0.6); x.lineTo(0.3, 0.6); x.lineTo(0.3, 0.2); x.lineTo(-0.3, 0.2); x.lineTo(-0.3, 0.6); x.lineTo(-0.62, 0.6); x.closePath(); x.fill();
        x.fillRect(-0.05, 0.1, 0.1, 0.5); x.fillStyle = '#5a3a14'; x.beginPath(); x.ellipse(0, -0.62, 0.32, 0.12, 0, 0, 7); x.fill(); x.fillStyle = gold(); x.beginPath(); x.ellipse(0, -0.68, 0.28, 0.11, 0, 0, 7); x.fill();
      }
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
      if (has('봉황') || has('신천옹') || has('군함조')) { x.fillStyle = wood; x.beginPath(); x.moveTo(-0.2, -0.05); x.quadraticCurveTo(-0.9, -0.6, -0.95, 0.15); x.quadraticCurveTo(-0.55, -0.05, -0.2, 0.25); x.fill(); }
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
      var v = has('가면') || has('두상') ? 1 : has('원반') || has('기초판') || has('명판') || has('장식판') || has('인장') || has('도장') ? 2 : has('잔') || has('뿔잔') ? 0 : has('상') || has('코끼리') || has('말') || has('불') ? 4 : has('타일') || has('부조') || has('모자이크') || has('조각') || has('이콘') ? 5 : has('항아리') || has('토기') || has('주전자') || has('그릇') || has('솥') || has('등잔') || has('합') || has('함') || has('물통') ? 3 : Math.floor(rng() * 4);
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
    x.globalCompositeOperation = 'lighter';
    for (var sp = 0; sp < 3; sp++) { var sx = w * (0.3 + rng() * 0.4), sy = h * (0.25 + rng() * 0.4), sz = m * (0.02 + rng() * 0.03); x.strokeStyle = 'rgba(255,245,210,.55)'; x.lineWidth = Math.max(1, m * 0.006); x.beginPath(); x.moveTo(sx - sz, sy); x.lineTo(sx + sz, sy); x.moveTo(sx, sy - sz); x.lineTo(sx, sy + sz); x.stroke(); }
    x.globalCompositeOperation = 'source-over';
    return c;
  };

  // ---------------------------------------------------------------- discovery vignette
  var CAT_COL = { geo: '#3d679a', nature: '#4f8a52', ruin: '#9a6a3a', treasure: '#c9a030', creature: '#7a5a2a', people: '#8a3a2a', trade: '#6a4a8a' };
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
