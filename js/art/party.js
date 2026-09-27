/* 육상 탐험대 모형 (G.Party) — 지도 위를 걷는 작은 부대.
   · 사람·짐승은 옆모습을 조금 위에서 내려다본 작은 모형으로 그리고, 발밑에 그림자를 둔다 (전략 게임 지도의 유닛처럼)
   · 대원들은 지나온 길(trail)을 따라 줄지어 선다 — 앞장선 대장이 탐험대의 자리이고, 뒤따르는 대원은 이미 걸어온 땅 위에 있다
   · 걸음은 간 거리로 움직인다 (빠를수록 걸음도 빨라지고, 멈추면 선다). 멈추면 대원들이 한데 모여 짐승은 풀을 뜯는다
   · 지형마다 발밑의 먼지·눈보라·자갈·풀잎이 이는 모습과 발자국·바퀴 자국이 다르다
   크기는 G.FX.party.size (1 = 사람 키 약 34px) */
(function (G) {
  'use strict';
  var P = {};
  G.Party = P;
  var TAU = Math.PI * 2;
  function FXP() { return (G.FX && G.FX.party) || { size: 1, spacing: 1, dust: 1 }; }
  function rgb(h, k) { var n = parseInt(h.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; k = k == null ? 1 : k; return 'rgb(' + Math.min(255, Math.round(r * k)) + ',' + Math.min(255, Math.round(g * k)) + ',' + Math.min(255, Math.round(b * k)) + ')'; }
  var OUT = 'rgba(24,15,8,.78)';

  // ================================================================ 사람
  /* 서 있거나 걷는 사람. 발밑이 (0,0), +x가 앞. o = {coat, pants, skin, hat, pack, item, flag, load, phase, moving, bob} */
  function person(ctx, o) {
    var ph = o.phase || 0, mv = o.moving ? 1 : 0, a = mv * 0.5 * Math.sin(TAU * ph), bob = mv * Math.abs(Math.sin(TAU * ph)) * 1.3;
    var coat = o.coat || '#5a4632', pants = o.pants || '#3a2c20', skin = o.skin || '#c89a78';
    ctx.save(); ctx.translate(0, -bob);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 먼 다리·먼 팔
    leg(ctx, 0, -15, -a, 15, rgb(pants, 0.72), 3.4);
    ctx.strokeStyle = rgb(coat, 0.7); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-0.5, -25); ctx.lineTo(-0.5 + Math.sin(a * 0.8) * 10, -25 + Math.cos(a * 0.8) * 10); ctx.stroke();
    // 짐
    if (o.pack) { ctx.fillStyle = rgb('#7a5a36'); ctx.strokeStyle = OUT; ctx.lineWidth = 1; rr(ctx, -8.5, -28, 6, 12, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = rgb('#c8b48a'); rr(ctx, -9, -31, 7, 3.4, 1.6); ctx.fill(); ctx.stroke(); }
    // 몸통
    var g = ctx.createLinearGradient(-4, 0, 4, 0); g.addColorStop(0, rgb(coat, 0.78)); g.addColorStop(0.6, rgb(coat, 1.05)); g.addColorStop(1, rgb(coat, 0.9));
    ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-3.6, -27.5); ctx.lineTo(3.4, -27.5); ctx.lineTo(4.4, -13); ctx.lineTo(-4.4, -13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgb('#4a2e18'); ctx.fillRect(-4.1, -17.2, 8.4, 1.8);               // 허리띠
    // 가까운 다리
    leg(ctx, 0, -15, a, 15, pants, 3.6);
    // 머리
    ctx.fillStyle = skin; ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0.8, -31.2, 3.7, 0, TAU); ctx.fill(); ctx.stroke();
    hat(ctx, o.hat, 0.8, -33.4);
    // 이고 가는 짐 (짐꾼)
    if (o.load === 'head') { ctx.fillStyle = rgb('#b89a64'); ctx.strokeStyle = OUT; rr(ctx, -4.5, -42.5, 10, 6.5, 2.5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(80,50,20,.6)'; ctx.beginPath(); ctx.moveTo(-4, -39.2); ctx.lineTo(5, -39.2); ctx.stroke(); }
    // 가까운 팔과 든 것
    var ha = o.item === 'flag' || o.item === 'staff' ? 0.35 : -a * 0.8;
    var hx = 0.8 + Math.sin(ha) * 10, hy = -25 + Math.cos(ha) * 10;
    if (o.load === 'head') { hx = 2.5; hy = -38; }
    ctx.strokeStyle = coat; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(0.8, -25.5); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, 1.4, 0, TAU); ctx.fill();
    if (o.item === 'musket') { ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-3, -17); ctx.lineTo(6, -39); ctx.stroke(); ctx.strokeStyle = '#8a8a90'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(3.6, -33); ctx.lineTo(6.6, -40.5); ctx.stroke(); }
    if (o.item === 'staff') { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx + 0.5, hy - 12); ctx.lineTo(hx + 1.5, 0 + bob); ctx.stroke(); }
    if (o.item === 'flag') flag(ctx, hx, hy, o.flag, o.t || 0, o.moving);
    ctx.restore();
  }
  function leg(ctx, x, y, a, len, col, w) {
    var kx = x + Math.sin(a) * len * 0.5, ky = y + Math.cos(a) * len * 0.5;
    var bend = Math.max(0, -Math.sin(a * 2)) * 0.25;
    var fx = kx + Math.sin(a - bend) * len * 0.5, fy = ky + Math.cos(a - bend) * len * 0.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy);
    ctx.strokeStyle = OUT; ctx.lineWidth = w + 1.4; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    ctx.fillStyle = '#20150c'; ctx.beginPath(); ctx.ellipse(fx + 1.2, fy - 0.6, 2.2, 1.2, 0, 0, TAU); ctx.fill();
  }
  function hat(ctx, h, x, y) {
    ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    if (h === 'morion') { ctx.fillStyle = '#b8bcc4'; ctx.beginPath(); ctx.ellipse(x, y + 0.6, 6.2, 1.6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + 0.2, 3.6, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e0e4ea'; ctx.fillRect(x - 0.4, y - 4.6, 0.9, 2.2); return; }
    if (h === 'turban') { ctx.fillStyle = '#ece4d2'; ctx.beginPath(); ctx.ellipse(x - 0.3, y - 0.8, 4.4, 3.0, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(120,100,70,.5)'; ctx.beginPath(); ctx.moveTo(x - 4, y - 0.6); ctx.lineTo(x + 3.8, y - 1.6); ctx.stroke(); return; }
    if (h === 'cap') { ctx.fillStyle = '#8a2a20'; ctx.beginPath(); ctx.arc(x, y + 0.8, 3.9, Math.PI, 0); ctx.fill(); ctx.stroke(); return; }
    if (h === 'hood') { ctx.fillStyle = '#6a5a48'; ctx.beginPath(); ctx.arc(x - 0.4, y + 1.6, 4.6, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); ctx.stroke(); return; }
    if (h === 'fur') { ctx.fillStyle = '#6a5038'; ctx.beginPath(); ctx.arc(x, y + 1.2, 4.6, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d8ccb8'; ctx.fillRect(x - 4.6, y + 0.6, 9.2, 1.6); return; }
    if (h === 'none') return;
    // 챙 넓은 모자
    ctx.fillStyle = h === 'dark' ? '#2a2420' : '#5a4028';
    ctx.beginPath(); ctx.ellipse(x, y + 0.8, 6.4, 1.7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 3.2, y + 0.6); ctx.lineTo(x - 2.6, y - 3.2); ctx.lineTo(x + 2.8, y - 3.2); ctx.lineTo(x + 3.4, y + 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  function flag(ctx, hx, hy, col, t, mv) {
    ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx, hy + 6); ctx.lineTo(hx, hy - 30); ctx.stroke();
    ctx.fillStyle = '#d8b050'; ctx.beginPath(); ctx.arc(hx, hy - 31, 1.6, 0, TAU); ctx.fill();
    var w = 17, h = 11, top = hy - 29, sp = mv ? 7 : 3;
    ctx.fillStyle = col || '#1d3f7a'; ctx.strokeStyle = OUT; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(hx, top);
    for (var i = 1; i <= 6; i++) { var u = i / 6; ctx.lineTo(hx - w * u, top + Math.sin(t * sp - u * 5) * 1.6 * u); }
    for (var j = 6; j >= 0; j--) { var v = j / 6; ctx.lineTo(hx - w * v, top + h + Math.sin(t * sp - v * 5) * 1.6 * v - (j === 6 ? 0 : 0)); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(232,200,110,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(hx - w * 0.5, top + 2 + Math.sin(t * sp - 2.5) * 0.8); ctx.lineTo(hx - w * 0.5, top + h - 2 + Math.sin(t * sp - 2.5) * 0.8); ctx.moveTo(hx - w * 0.85, top + h * 0.5 + Math.sin(t * sp - 4) * 1.3); ctx.lineTo(hx - w * 0.15, top + h * 0.5 + Math.sin(t * sp - 1) * 0.5); ctx.stroke();
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }

  // ================================================================ 짐승 (네 발)
  /* 종마다 몸 비율·다리·목·머리·꼬리·털·혹·뿔을 다르게 한 하나의 식. 발밑 (0,0), +x가 앞 */
  var SP = {
    horse:    { L: 30, H: 12, leg: 17, lw: 2.8, neck: [[12, -27], [21, -38]], nw: 6.5, head: [25, -37, 6.2, 3.2, 0.75], ear: 2.6, tail: 'horse', col: ['#7a4a2a', '#5a3420', '#9a6a3a', '#3a2a22', '#8a8278'], mane: '#2a1a10' },
    donkey:   { L: 23, H: 11, leg: 12, lw: 2.6, neck: [[9, -21], [15, -28]], nw: 6, head: [19, -28, 5.6, 3.4, 0.9], ear: 6, tail: 'thin', col: ['#8a8078', '#7a6a5a', '#9a9088'], belly: '#d8d0c4', mane: '#3a302a' },
    mule:     { L: 26, H: 11.5, leg: 14, lw: 2.6, neck: [[10, -24], [17, -32]], nw: 6, head: [21, -32, 5.8, 3.2, 0.85], ear: 5, tail: 'thin', col: ['#6a4a34', '#5a4030'], mane: '#2a1e14' },
    camel:    { L: 33, H: 14, leg: 20, lw: 3.0, neck: [[14, -31], [24, -27], [29, -40]], nw: 6, head: [32, -40, 6.2, 3.2, 0.3], ear: 1.8, tail: 'thin', hump: 1, col: ['#c49a62', '#b08a58', '#d0aa74'], mane: '#8a6a40' },
    camel2:   { L: 33, H: 15, leg: 18, lw: 3.2, neck: [[14, -30], [24, -26], [28, -38]], nw: 6.5, head: [31, -38, 6.2, 3.4, 0.3], ear: 1.8, tail: 'thin', hump: 2, col: ['#9a7448', '#8a6440'], mane: '#5a4028', shag: 1 },
    llama:    { L: 19, H: 10, leg: 15, lw: 2.2, neck: [[8, -26], [10, -40]], nw: 5, head: [13, -41, 4.2, 2.6, 0.2], ear: 4.5, tail: 'puff', col: ['#e8e0d0', '#8a6a4a', '#3a2e26', '#c4a882'], wool: 1 },
    yak:      { L: 27, H: 15, leg: 11, lw: 3.6, neck: [[11, -20], [16, -22]], nw: 9, head: [19, -21, 5.6, 4.2, 1.2], ear: 2, tail: 'bushy', horn: 'yak', col: ['#2e2420', '#3a2c24', '#4a3a2e'], shag: 2, belly: '#e8e0d4' },
    reindeer: { L: 23, H: 10, leg: 15, lw: 2.4, neck: [[9, -25], [16, -33]], nw: 5.5, head: [20, -33, 5, 2.8, 0.7], ear: 2.4, tail: 'puff', antler: 1, col: ['#8a7a66', '#7a6a58'], belly: '#e8e2d6' },
    ox:       { L: 28, H: 14, leg: 12, lw: 3.4, neck: [[11, -22], [17, -24]], nw: 9, head: [21, -23, 5.8, 3.8, 1.0], ear: 2.4, tail: 'thin', horn: 'ox', hump: 0.5, col: ['#d8ccb4', '#a88a6a', '#6a5040'], belly: '#ece4d4' }
  };
  /* o = {sp, phase, moving, gait('walk'|'trot'|'gallop'|'pace'), coat index, pack, rider, graze, t} */
  function beast(ctx, o) {
    var S = SP[o.sp] || SP.horse, ph = o.phase || 0, mv = o.moving ? 1 : 0;
    var col = S.col[(o.ci || 0) % S.col.length];
    var gait = o.gait || 'walk';
    var amp = mv * (gait === 'gallop' ? 0.62 : gait === 'trot' ? 0.45 : 0.36);
    var offs = gait === 'gallop' ? [0.0, 0.08, 0.5, 0.58] : gait === 'pace' ? [0.0, 0.0, 0.5, 0.5] : gait === 'trot' ? [0.0, 0.5, 0.5, 0.0] : [0.0, 0.25, 0.5, 0.75];
    // [먼 뒷다리, 먼 앞다리, 가까운 뒷다리, 가까운 앞다리]
    var bob = mv * (gait === 'gallop' ? 2.2 * Math.abs(Math.sin(TAU * ph)) : 1.0 * Math.abs(Math.sin(TAU * ph * 2)));
    var pitch = gait === 'gallop' ? mv * Math.sin(TAU * ph) * 0.07 : 0;
    var sway = gait === 'pace' ? mv * Math.sin(TAU * ph) * 1.2 : 0;
    var top = -(S.leg + S.H) - bob;             // 등 높이
    ctx.save();
    ctx.translate(0, 0); ctx.rotate(pitch);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var hx = -S.L * 0.36, fx = S.L * 0.34, ly = top + S.H * 0.72;
    function legAt(x, off, near) {
      var a = amp * Math.sin(TAU * (ph + off)), lift = Math.max(0, Math.cos(TAU * (ph + off))) * amp * 0.9;
      var len = S.leg + S.H * 0.28;
      var kx = x + Math.sin(a) * len * 0.5, ky = ly + Math.cos(a) * len * 0.5 - lift * 2;
      var fx2 = kx + Math.sin(a - lift * (x < 0 ? -0.9 : 0.9)) * len * 0.5, fy2 = ky + Math.cos(a - lift) * len * 0.5;
      fy2 = Math.min(fy2, -bob + 0.2 + (near ? 0 : -1.2));
      ctx.beginPath(); ctx.moveTo(x, ly - 2); ctx.lineTo(kx, ky); ctx.lineTo(fx2, fy2);
      ctx.strokeStyle = OUT; ctx.lineWidth = S.lw * (near ? 1 : 0.92) + 1.6; ctx.stroke();                 // 땅 색과 비슷해도 보이게 테두리
      ctx.strokeStyle = near ? rgb(col, 0.92) : rgb(col, 0.62); ctx.lineWidth = S.lw * (near ? 1 : 0.92); ctx.stroke();
      ctx.fillStyle = '#1e140c'; ctx.beginPath(); ctx.ellipse(fx2 + 0.6, fy2, S.lw * 0.7, S.lw * 0.45, 0, 0, TAU); ctx.fill();
    }
    legAt(hx + 1.5, offs[0], false); legAt(fx + 1.5, offs[1], false);
    // 꼬리
    ctx.strokeStyle = S.mane || rgb(col, 0.6); ctx.lineWidth = S.tail === 'horse' ? 3.2 : S.tail === 'bushy' ? 4 : 1.6;
    var tw = mv ? Math.sin(TAU * ph + 1) * 2 : Math.sin((o.t || 0) * 1.3) * 1.5;
    if (S.tail === 'puff') { ctx.fillStyle = rgb(col, 1.05); ctx.beginPath(); ctx.arc(-S.L * 0.5, top + 2, 2.4, 0, TAU); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(-S.L * 0.48, top + 2); ctx.quadraticCurveTo(-S.L * 0.62, top + 6, -S.L * 0.58 + tw, top + (S.tail === 'horse' ? 15 : 12)); ctx.stroke(); }
    // 몸통
    var g = ctx.createLinearGradient(0, top, 0, top + S.H); g.addColorStop(0, rgb(col, 1.18)); g.addColorStop(0.55, rgb(col, 1.0)); g.addColorStop(1, rgb(col, 0.72));
    ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, top + S.H * 0.5 + sway * 0.2, S.L * 0.5, S.H * 0.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    if (S.belly) { ctx.fillStyle = S.belly; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(1, top + S.H * 0.8, S.L * 0.34, S.H * 0.18, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    // 혹 (낙타·혹소)
    if (S.hump) {
      ctx.fillStyle = rgb(col, 1.1); ctx.strokeStyle = OUT;
      if (S.hump === 2) { hump(ctx, -S.L * 0.14, top + 1, 5.5, 7); hump(ctx, S.L * 0.12, top + 1, 5.5, 7); }
      else if (S.hump === 1) hump(ctx, -S.L * 0.02, top + 1, 8, 9);
      else hump(ctx, S.L * 0.28, top + 2, 4, 4);
    }
    // 털 (라마의 양털, 야크의 늘어진 털)
    if (S.wool) { ctx.strokeStyle = rgb(col, 0.8); ctx.lineWidth = 1; for (var w = -4; w <= 4; w++) { ctx.beginPath(); ctx.arc(w * S.L * 0.1, top + S.H * 0.95, 1.8, 0, Math.PI); ctx.stroke(); } }
    if (S.shag) { ctx.strokeStyle = rgb(col, 0.75); ctx.lineWidth = 1.4; var sl = S.shag === 2 ? 8 : 4; for (var f = -6; f <= 6; f++) { var sx = f * S.L * 0.075, sw = mv ? Math.sin(TAU * ph + f) * 1.2 : 0; ctx.beginPath(); ctx.moveTo(sx, top + S.H * 0.8); ctx.lineTo(sx - 0.8 + sw, top + S.H * 0.8 + sl + (f % 2) * 1.5); ctx.stroke(); } }
    // 짐 (먼 쪽 짐바구니는 몸통에 가려 윗부분만)
    if (o.pack) packLoad(ctx, S, top, o.pack);
    // 탄 사람
    if (o.rider) { ctx.save(); ctx.translate(S.hump === 1 ? -2 : 0, top + (S.hump === 1 ? -5 : S.hump === 2 ? -2 : 1)); rider(ctx, o.rider, o, S); ctx.restore(); }
    // 가까운 다리
    legAt(hx, offs[2], true); legAt(fx, offs[3], true);
    // 목과 머리 (풀을 뜯을 때는 숙인다)
    var gz = o.graze || 0, nk = S.neck;
    ctx.save();
    if (gz > 0) { ctx.translate(nk[0][0], nk[0][1] - bob); ctx.rotate(gz * (S.antler ? 0.9 : 1.1)); ctx.translate(-nk[0][0], -(nk[0][1] - bob)); }
    var nb = mv ? Math.sin(TAU * ph * (gait === 'pace' ? 1 : 2)) * 1.2 : 0;
    ctx.beginPath(); ctx.moveTo(nk[0][0], nk[0][1] - bob);
    if (nk.length === 3) ctx.quadraticCurveTo(nk[1][0], nk[1][1] - bob + nb, nk[2][0], nk[2][1] - bob + nb); else ctx.lineTo(nk[1][0], nk[1][1] - bob + nb);
    ctx.strokeStyle = OUT; ctx.lineWidth = S.nw + 1.8; ctx.stroke();
    ctx.strokeStyle = rgb(col, 0.98); ctx.lineWidth = S.nw; ctx.stroke();
    if (S.mane && (o.sp === 'horse' || o.sp === 'mule')) { ctx.strokeStyle = S.mane; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(nk[0][0] - 1.5, nk[0][1] - bob - 2.6); ctx.lineTo(nk[1][0] - 2, nk[1][1] - bob + nb - 2.8); ctx.stroke(); }
    var H = S.head, hxp = H[0], hyp = H[1] - bob + nb;
    // 뿔·귀
    ctx.strokeStyle = rgb(col, 0.8); ctx.lineWidth = 1.6;
    if (S.ear) { ctx.beginPath(); ctx.moveTo(hxp - H[2] * 0.6, hyp - H[3] * 0.4); ctx.lineTo(hxp - H[2] * 0.9, hyp - H[3] - S.ear); ctx.stroke(); }
    if (S.horn === 'yak') { ctx.strokeStyle = '#d8d0c0'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(hxp - 2, hyp - 3); ctx.quadraticCurveTo(hxp - 7, hyp - 6, hxp - 4, hyp - 10); ctx.stroke(); }
    if (S.horn === 'ox') { ctx.strokeStyle = '#e0d6c0'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(hxp - 2, hyp - 3); ctx.quadraticCurveTo(hxp + 1, hyp - 8, hxp + 4, hyp - 8); ctx.stroke(); }
    if (S.antler) { ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hxp - 2, hyp - 2.5); ctx.quadraticCurveTo(hxp - 9, hyp - 9, hxp - 6, hyp - 17); ctx.moveTo(hxp - 5.5, hyp - 8); ctx.lineTo(hxp - 1, hyp - 12); ctx.moveTo(hxp - 7.5, hyp - 12.5); ctx.lineTo(hxp - 3, hyp - 16); ctx.moveTo(hxp - 6, hyp - 5); ctx.lineTo(hxp - 11, hyp - 9); ctx.stroke(); }
    ctx.fillStyle = rgb(col, 1.05); ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(hxp, hyp, H[2], H[3], H[4], 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#140c06'; ctx.beginPath(); ctx.arc(hxp - H[2] * 0.2, hyp - H[3] * 0.35, 0.8, 0, TAU); ctx.fill();
    if (o.sp === 'donkey' || o.sp === 'llama') { ctx.fillStyle = 'rgba(240,232,220,.65)'; ctx.beginPath(); ctx.ellipse(hxp + H[2] * 0.6, hyp + H[3] * 0.25, H[2] * 0.4, H[3] * 0.55, H[4], 0, TAU); ctx.fill(); }
    if (o.sp === 'llama' && o.tassel) { ctx.fillStyle = ['#c0281e', '#e0a020', '#2a8a4a'][o.ci % 3]; ctx.beginPath(); ctx.arc(hxp - H[2] * 0.9, hyp - H[3] - S.ear + 1, 1.4, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }
  function hump(ctx, x, y, w, h) { ctx.beginPath(); ctx.moveTo(x - w, y + 1); ctx.quadraticCurveTo(x - w * 0.6, y - h, x, y - h); ctx.quadraticCurveTo(x + w * 0.6, y - h, x + w, y + 1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  function packLoad(ctx, S, top, kind) {
    ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    // 등의 짐: 말아 묶은 짐과 자루
    var cx = S.hump === 1 ? -2 : 0, cy = top - (S.hump === 1 ? 6 : 1);
    ctx.fillStyle = kind === 'bright' ? '#b83a28' : '#8a6a44'; rr(ctx, cx - S.L * 0.26, cy - 2, S.L * 0.52, 4, 2); ctx.fill(); ctx.stroke();       // 깔개
    ctx.fillStyle = '#c8b48a'; rr(ctx, cx - S.L * 0.2, cy - 7, S.L * 0.4, 5.5, 2.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9a7a4e'; rr(ctx, cx - S.L * 0.24, cy + 1, S.L * 0.2, S.H * 0.55, 2); ctx.fill(); ctx.stroke();                                 // 가까운 짐바구니
    ctx.fillStyle = '#8a6a40'; rr(ctx, cx + S.L * 0.04, cy + 1, S.L * 0.18, S.H * 0.5, 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,36,16,.7)'; ctx.beginPath(); ctx.moveTo(cx - S.L * 0.14, cy - 7); ctx.lineTo(cx - S.L * 0.14, cy + S.H * 0.55); ctx.stroke();
  }
  function rider(ctx, r, o, S) {
    // 앉은 사람: 엉덩이가 (0,0)
    var coat = r.coat || '#3a4a6a', skin = r.skin || '#c89a78', ph = o.phase || 0, mv = o.moving ? 1 : 0;
    var rb = mv * (o.gait === 'gallop' ? Math.sin(TAU * ph + 1) * 1.4 : Math.abs(Math.sin(TAU * ph * 2)) * 0.8);
    ctx.lineCap = 'round';
    ctx.translate(0, -rb);
    // 가까운 다리 (걸터앉아 늘어뜨림)
    ctx.strokeStyle = r.pants || '#3a2c20'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(3, 6); ctx.lineTo(1.5, 11); ctx.stroke();
    ctx.fillStyle = '#20150c'; ctx.beginPath(); ctx.ellipse(2.4, 11.4, 2, 1.1, 0, 0, TAU); ctx.fill();
    var g = ctx.createLinearGradient(-4, 0, 4, 0); g.addColorStop(0, rgb(coat, 0.78)); g.addColorStop(1, rgb(coat, 1.05));
    ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-3.4, 0); ctx.lineTo(3.8, 0); ctx.lineTo(3.0, -12); ctx.lineTo(-2.8, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0.8, -15.6, 3.6, 0, TAU); ctx.fill(); ctx.stroke();
    hat(ctx, r.hat, 0.8, -17.8);
    // 고삐를 쥔 팔
    ctx.strokeStyle = coat; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(1, -10); ctx.lineTo(7, -5); ctx.stroke();
    if (r.item === 'flag') flag(ctx, -1.5, -8, r.flag, o.t || 0, o.moving);
    if (r.item === 'lance') { ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(8, -28); ctx.stroke(); }
    if (r.item === 'musket') { ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(4, -22); ctx.stroke(); }
  }

  // ================================================================ 마차 · 썰매 · 코끼리
  function cart(ctx, o) {
    var dist = o.dist || 0, mv = o.moving ? 1 : 0, ph = o.phase || 0;
    var r = 8, jolt = mv * Math.abs(Math.sin(TAU * ph * 2)) * 0.8;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 먼 바퀴
    wheel(ctx, -14, -r + 1.5, r * 0.95, dist / r, true); wheel(ctx, 14, -r + 1.5, r * 0.95, dist / r, true);
    ctx.translate(0, -jolt);
    // 짐칸
    ctx.fillStyle = '#6a4424'; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-24, -24); ctx.lineTo(24, -24); ctx.lineTo(22, -12); ctx.lineTo(-22, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,18,8,.5)'; for (var k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 9, -24); ctx.lineTo(k * 9, -12); ctx.stroke(); }
    // 포장
    var g = ctx.createLinearGradient(0, -46, 0, -24); g.addColorStop(0, '#f2ead8'); g.addColorStop(1, '#c8bca0');
    ctx.fillStyle = g; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.moveTo(-23, -24); ctx.bezierCurveTo(-24, -44, 22, -44, 21, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,100,70,.55)'; for (var i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 8.5, -24); ctx.quadraticCurveTo(i * 8.5 + 0.5, -40, i * 8.5, -39.5); ctx.stroke(); }
    // 마부
    ctx.save(); ctx.translate(22, -24); rider(ctx, { coat: '#6a3a2a', hat: 'brim' }, o, {}); ctx.restore();
    // 끌채
    ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(22, -14); ctx.lineTo(40, -17); ctx.stroke();
    ctx.restore();
    // 가까운 바퀴
    wheel(ctx, -14, -r, r, dist / r, false); wheel(ctx, 14, -r, r, dist / r, false);
  }
  function wheel(ctx, x, y, r, ang, far) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = far ? '#2a1a0c' : '#3a2412'; ctx.lineWidth = far ? 2 : 2.4; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = far ? 'rgba(60,40,20,.7)' : '#5a3a1e'; ctx.lineWidth = 1.2;
    for (var k = 0; k < 6; k++) { var a = ang + k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
    ctx.fillStyle = '#2a1a0c'; ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function sled(ctx, o, people) {
    var jolt = o.moving ? Math.abs(Math.sin(TAU * (o.phase || 0) * 2)) * 0.6 : 0;
    ctx.save(); ctx.translate(0, -jolt); ctx.lineCap = 'round';
    // 썰매 날
    ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, -1); ctx.lineTo(16, -1); ctx.quadraticCurveTo(24, -1, 23, -8); ctx.stroke();
    ctx.strokeStyle = '#6a4424'; ctx.lineWidth = 1.4; for (var k = -2; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 11, -1); ctx.lineTo(k * 11, -7); ctx.stroke(); }
    ctx.fillStyle = '#7a5230'; ctx.strokeStyle = OUT; ctx.lineWidth = 1; rr(ctx, -21, -12, 38, 5, 2); ctx.fill(); ctx.stroke();
    // 짐과 털가죽
    ctx.fillStyle = '#b8a07a'; rr(ctx, -20, -19, 14, 7.5, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a5038'; rr(ctx, -7, -16, 22, 4.5, 2); ctx.fill(); ctx.stroke();
    // 앉은 사람
    for (var i = 0; i < (people || 1); i++) { ctx.save(); ctx.translate(2 + i * 10, -13); rider(ctx, { coat: i ? '#5a4a3a' : '#2a3a5a', hat: 'fur', item: i === 0 && o.leader ? 'flag' : null, flag: o.flagColor }, o, {}); ctx.restore(); }
    ctx.strokeStyle = 'rgba(40,24,10,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(20, -9); ctx.lineTo(34, -20); ctx.stroke();
    ctx.restore();
  }
  function elephant(ctx, o) {
    var ph = o.phase || 0, mv = o.moving ? 1 : 0, col = '#8a8580';
    var amp = mv * 0.28, bob = mv * Math.abs(Math.sin(TAU * ph * 2)) * 1.2;
    var top = -48 - bob;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function legE(x, off, near) {
      var a = amp * Math.sin(TAU * (ph + off)), lift = Math.max(0, Math.cos(TAU * (ph + off))) * amp * 2.4;
      var fy = -0.5 - lift - bob * 0.2;
      ctx.beginPath(); ctx.moveTo(x, top + 24); ctx.lineTo(x + Math.sin(a) * 22, Math.min(fy, -1));
      ctx.strokeStyle = OUT; ctx.lineWidth = 9.6; ctx.stroke();
      ctx.strokeStyle = near ? rgb(col, 0.92) : rgb(col, 0.64); ctx.lineWidth = 8; ctx.stroke();
      ctx.fillStyle = '#d8d0c4'; ctx.beginPath(); ctx.ellipse(x + Math.sin(a) * 22, Math.min(fy, -1) + 0.5, 4.2, 1.2, 0, 0, TAU); ctx.fill();
    }
    legE(-13, 0.25, false); legE(15, 0.75, false);
    ctx.strokeStyle = rgb(col, 0.7); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-24, top + 10); ctx.quadraticCurveTo(-29, top + 20, -27 + (mv ? Math.sin(TAU * ph) * 2 : 0), top + 30); ctx.stroke();
    var g = ctx.createLinearGradient(0, top, 0, top + 30); g.addColorStop(0, rgb(col, 1.15)); g.addColorStop(1, rgb(col, 0.72));
    ctx.fillStyle = g; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(-1, top + 15, 25, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // 하우다 (등 위의 가마)
    ctx.fillStyle = '#9a2a20'; rr(ctx, -16, top - 3, 26, 5, 2); ctx.fill(); ctx.stroke();                          // 깔개
    ctx.fillStyle = '#c89a30'; ctx.fillRect(-15, top + 2, 24, 3);
    ctx.fillStyle = '#7a4a24'; rr(ctx, -12, top - 12, 18, 10, 2); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(-3, top - 9); rider(ctx, { coat: '#2a3a5a', hat: 'brim', item: o.leader ? 'flag' : null, flag: o.flagColor }, o, {}); ctx.restore();
    ctx.fillStyle = '#b83a28'; ctx.beginPath(); ctx.moveTo(-14, top - 22); ctx.quadraticCurveTo(-3, top - 30, 8, top - 22); ctx.lineTo(8, top - 20); ctx.lineTo(-14, top - 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-12, top - 20); ctx.lineTo(-12, top - 11); ctx.moveTo(6, top - 20); ctx.lineTo(6, top - 11); ctx.stroke();
    legE(-15, 0.75, true); legE(13, 0.25, true);
    // 머리·귀·코·상아
    var hx = 22, hy = top + 12, tb = mv ? Math.sin(TAU * ph) * 3 : Math.sin((o.t || 0) * 0.8) * 2;
    ctx.fillStyle = rgb(col, 1.02); ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(hx, hy, 9, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 6, hy + 5); ctx.quadraticCurveTo(hx + 12, hy + 16, hx + 9 + tb, hy + 28);
    ctx.strokeStyle = OUT; ctx.lineWidth = 6.6; ctx.stroke(); ctx.strokeStyle = rgb(col, 0.95); ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = '#f0e8d8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx + 5, hy + 6); ctx.quadraticCurveTo(hx + 10, hy + 11, hx + 14, hy + 8); ctx.stroke();
    ctx.fillStyle = rgb(col, 0.82); ctx.strokeStyle = OUT; ctx.beginPath(); ctx.ellipse(hx - 6, hy + 1, 7, 9, -0.2 + (mv ? Math.sin(TAU * ph * 2) * 0.08 : 0), 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#140c06'; ctx.beginPath(); ctx.arc(hx + 3, hy - 3, 1, 0, TAU); ctx.fill();
    // 코끼리 몰이꾼 (목 위)
    ctx.save(); ctx.translate(hx - 5, hy - 9); rider(ctx, { coat: '#e8dcc4', hat: 'turban', skin: '#8a5a3a' }, o, {}); ctx.restore();
    ctx.restore();
  }

  // ================================================================ 탐험대 짜임
  /* 탈것·대원 수·끄는 짐승(draft)에 따라 대원을 짠다. 앞 사람이 대장(깃발) */
  var EXPL = [{ coat: '#2a3a5a', hat: 'brim', item: 'flag' }, { coat: '#5a4632', hat: 'morion', item: 'musket', pack: 1 }, { coat: '#4a5a3a', hat: 'brim', pack: 1, item: 'staff' }, { coat: '#6a3a2a', hat: 'cap', pack: 1, item: 'musket' }, { coat: '#3a3a3a', hat: 'dark', pack: 1 }];
  P.compose = function (mt, party, draft, region) {
    var id = mt && mt.id || 'walk', n = mt && mt.n || 0, big = party >= 15 ? 1 : 0, out = [];
    var need = G.Mounts ? G.Mounts.need(id, party) : 1, few = id !== 'walk' && n < need * 0.5;   // 모자라면 걷는 사람이 섞인다
    function ppl(k, from) { for (var i = 0; i < k; i++) out.push({ t: 'person', o: EXPL[(from + i) % EXPL.length], gap: 17 }); }
    if (id === 'walk') { ppl(4 + big, 0); return out; }
    if (id === 'porter') { ppl(2, 0); for (var i = 0; i < 2 + big; i++) out.push({ t: 'person', o: { coat: ['#d8c8a4', '#b8905a', '#e8e0cc'][i % 3], pants: '#6a5a44', hat: i % 2 ? 'turban' : 'none', skin: '#8a5a3a', load: 'head' }, gap: 16 }); return out; }
    if (id === 'horse') { for (var h = 0; h < 3 + big; h++) out.push({ t: 'beast', sp: 'horse', ci: h, rider: EXPL[h % EXPL.length], gap: 32 }); if (few) ppl(2, 2); return out; }
    if (id === 'camel') {
      var ct = region === 'st' || region === 'pe' || region === 'cn' ? 'camel2' : 'camel';
      out.push({ t: 'beast', sp: ct, ci: 0, rider: EXPL[0], gap: 36 }); out.push({ t: 'beast', sp: ct, ci: 1, rider: { coat: '#e8dcc4', hat: 'turban', skin: '#9a6a44' }, gap: 34 });
      out.push({ t: 'beast', sp: ct, ci: 2, pack: 'bright', gap: 34 }); if (big) out.push({ t: 'beast', sp: ct, ci: 1, pack: 1, gap: 34 });
      if (few) ppl(2, 1); return out;
    }
    if (id === 'donkey') { ppl(1, 0); out.push({ t: 'beast', sp: 'donkey', ci: 0, pack: 1, gap: 24 }); ppl(1, 1); out.push({ t: 'beast', sp: 'donkey', ci: 1, pack: 1, gap: 24 }); out.push({ t: 'beast', sp: 'donkey', ci: 2, pack: 1, gap: 24 }); if (big) ppl(1, 2); return out; }
    if (id === 'llama') { ppl(1, 0); for (var l = 0; l < 3 + big; l++) out.push({ t: 'beast', sp: 'llama', ci: l, pack: l % 2 ? 'bright' : 1, tassel: 1, gap: 20 }); out.push({ t: 'person', o: { coat: '#b83a28', pants: '#3a2c20', hat: 'cap', skin: '#9a6a44', item: 'staff' }, gap: 17 }); ppl(1, 1); return out; }
    if (id === 'yak') { ppl(1, 0); for (var y = 0; y < 3; y++) out.push({ t: 'beast', sp: 'yak', ci: y, pack: y === 1 ? 'bright' : 1, gap: 28 }); out.push({ t: 'person', o: { coat: '#7a2a20', pants: '#3a2c20', hat: 'fur', skin: '#a0704a', item: 'staff' }, gap: 17 }); ppl(1 + big, 1); return out; }
    if (id === 'wagon') {
      out.push({ t: 'beast', sp: 'horse', ci: 1, rider: EXPL[0], gap: 32 });
      out.push({ t: 'cart', draft: draft === 'ox' ? 'ox' : 'horse', gap: draft === 'ox' ? 82 : 80 });
      if (big || few) ppl(2, 1); else ppl(1, 1); return out;
    }
    if (id === 'elephant') { out.push({ t: 'elephant', leader: 1, gap: 62 }); ppl(2, 1); if (big) out.push({ t: 'elephant', gap: 62 }); return out; }
    if (id === 'reindeer') { out.push({ t: 'sled', leader: 1, people: 2, gap: 72 }); out.push({ t: 'sled', people: 1, gap: 72 }); if (few) ppl(2, 1); return out; }
    ppl(4, 0); return out;
  };

  /* 한 대원을 (x,y)에 그린다. f = 바라보는 쪽(±1), s = 크기 */
  function member(ctx, m, x, y, f, s, st) {
    var o = { phase: st.phase + (m.poff || 0), moving: st.moving, t: st.t, gait: st.gait, dist: st.dist, leader: m.leader, flagColor: st.flag };
    ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s);
    if (m.t === 'person') {
      var po = {}; for (var k in m.o) po[k] = m.o[k];
      po.phase = o.phase; po.moving = o.moving; po.t = o.t; po.flag = st.flag;
      if (po.item === 'flag' && !m.leader) po.item = 'staff';
      shadow(ctx, 0, 0, 7, 2.4);
      person(ctx, po);
    } else if (m.t === 'beast') {
      var S = SP[m.sp] || SP.horse;
      shadow(ctx, 0, 0, S.L * 0.62, 3.2);
      var rd = m.rider ? copy(m.rider, { flag: st.flag, item: m.rider.item === 'flag' && !m.leader ? 'musket' : m.rider.item }) : null;
      beast(ctx, { sp: m.sp, ci: m.ci, phase: o.phase, moving: o.moving, gait: m.sp === 'horse' ? st.gait : (m.sp === 'camel' || m.sp === 'camel2') ? 'pace' : 'walk', pack: m.pack, rider: rd, t: o.t, tassel: m.tassel, graze: st.moving ? 0 : grazeAt(st.t, m.ci + (m.poff || 0) * 7) });
    } else if (m.t === 'cart') {
      shadow(ctx, 12, 0, 50, 4);
      // 끄는 짐승 둘 (먼 쪽 먼저)
      ctx.save(); ctx.translate(52, -3); beast(ctx, { sp: m.draft, ci: 1, phase: o.phase + 0.3, moving: o.moving, gait: 'walk', t: o.t }); ctx.restore();
      ctx.save(); ctx.translate(-2, 0); cart(ctx, o); ctx.restore();
      ctx.save(); ctx.translate(55, 1); beast(ctx, { sp: m.draft, ci: 0, phase: o.phase, moving: o.moving, gait: 'walk', t: o.t }); ctx.restore();
      ctx.strokeStyle = 'rgba(40,24,10,.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(36, -17); ctx.lineTo(64, -22); ctx.stroke();
    } else if (m.t === 'elephant') {
      shadow(ctx, 2, 0, 30, 4.5);
      elephant(ctx, o);
    } else if (m.t === 'sled') {
      shadow(ctx, 12, 0, 40, 3.5);
      ctx.save(); ctx.translate(44, -2); beast(ctx, { sp: 'reindeer', ci: 1, phase: o.phase + 0.35, moving: o.moving, gait: 'trot', t: o.t }); ctx.restore();
      sled(ctx, o, m.people);
      ctx.save(); ctx.translate(47, 1); beast(ctx, { sp: 'reindeer', ci: 0, phase: o.phase, moving: o.moving, gait: 'trot', t: o.t }); ctx.restore();
      ctx.strokeStyle = 'rgba(40,24,10,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(22, -8); ctx.lineTo(56, -24); ctx.stroke();
    }
    ctx.restore();
  }
  function grazeAt(t, k) { var c = (t * 0.23 + k * 0.37) % 1; return c < 0.45 ? Math.sin(c / 0.45 * Math.PI) : 0; }
  function copy(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function shadow(ctx, x, y, rx, ry) { ctx.fillStyle = 'rgba(14,10,6,.30)'; ctx.beginPath(); ctx.ellipse(x, y + 0.5, rx, ry, 0, 0, TAU); ctx.fill(); }

  // ================================================================ 줄 서기 (지나온 길 위)
  /* pts: 화면 좌표의 길 [[x,y], ...] (0 = 대장 자리, 뒤로 갈수록 지나온 곳). 길이 d인 곳의 점과 진행 방향 */
  function along(pts, d, head) {
    var acc = 0;
    for (var i = 1; i < pts.length; i++) {
      var ax = pts[i - 1][0], ay = pts[i - 1][1], bx = pts[i][0], by = pts[i][1], l = Math.hypot(bx - ax, by - ay);
      if (l < 1e-6) continue;
      if (acc + l >= d) { var u = (d - acc) / l; return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u, dx: (ax - bx) / l, dy: (ay - by) / l }; }
      acc += l;
    }
    // 길이 모자라면 대장 뒤로 곧게
    var lx = pts.length ? pts[pts.length - 1][0] : 0, ly = pts.length ? pts[pts.length - 1][1] : 0, rest = d - acc;
    var hx = Math.cos(head), hy = -Math.sin(head);
    return { x: lx - hx * rest, y: ly - hy * rest, dx: hx, dy: hy };
  }

  /* 대원이 차지하는 길이: 앞쪽(front)·뒤쪽(back) — 마차·썰매는 앞에 끄는 짐승이 있다 */
  function ext(m, back) {
    if (m.t === 'person') return 8;
    if (m.t === 'beast') { var S = SP[m.sp] || SP.horse; return back ? S.L * 0.62 : S.L * 0.5 + (S.head ? Math.max(0, S.head[0] - S.L * 0.5) : 0) * 0.8; }
    if (m.t === 'cart') return back ? 27 : (m.draft === 'ox' ? 82 : 84);
    if (m.t === 'elephant') return back ? 30 : 34;
    if (m.t === 'sled') return back ? 23 : 64;
    return 12;
  }
  /** 탐험대를 그린다. u = {pts, head(세상 각), moving, phase, dist, t, mount, party, draft, region, gather(0~1), flag, face(±1), terr} → 차지한 자리 목록 [{x,y}] */
  P.draw = function (ctx, u) {
    var FP = FXP(), s = u.size || FP.size || 1, gapK = (FP.spacing || 1) * s;
    var key = (u.mount && u.mount.id) + ':' + (u.mount && u.mount.n) + ':' + u.party + ':' + u.draft + ':' + u.region;
    if (u.cache && u.cache.key === key) var list = u.cache.list;
    else { list = P.compose(u.mount, u.party, u.draft, u.region); list.forEach(function (m, i) { m.poff = (i * 0.37) % 1; }); list[0].leader = 1; if (u.cache) { u.cache.key = key; u.cache.list = list; } }
    var st = { phase: u.phase || 0, moving: u.moving, t: u.t || 0, dist: u.dist || 0, flag: u.flag || '#1d3f7a', gait: u.gait || 'walk' };
    var items = [], gz = u.gather || 0;
    // 맨 앞(대장의 코끝)이 탐험대의 자리 — 대장의 몸은 그만큼 뒤에 선다 (보이는 앞머리와 물가 판정이 맞게)
    var d = Math.max(0, ext(list[0], 0) - 6) * gapK;
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      // 멈추면 두 줄로 모여 선다 (간격을 좁히고 좌우로 비켜)
      if (i) d += (ext(list[i - 1], 1) + ext(m, 0) + 3) * gapK * (1 - 0.48 * gz);
      var q = along(u.pts, d, u.head);
      var side = i ? (i % 2 ? 1 : -1) : 0, lat = (5 * (1 - gz) + 17 * gz) * s;
      var x = q.x + (-q.dy) * side * lat, y = q.y + q.dx * side * lat * 0.7;
      var f = q.dx > 0.12 ? 1 : q.dx < -0.12 ? -1 : (u.face || 1);
      if (i === 0) f = u.face || f;
      items.push({ m: m, x: x, y: y, f: f });
    }
    if (u.ring) P.ring(ctx, items[0].x, items[0].y, u.head, u.moving, u.t || 0, s);
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it) { member(ctx, it.m, it.x, it.y, it.f, s, st); });
    return items;
  };

  /** 대장 발밑의 고리 (조종하는 부대 표시 · 나아가는 쪽 갈매기표 · 멈추면 숨 쉬듯) */
  P.ring = function (ctx, x, y, head, moving, t, s) {
    s = s || 1;
    var rx = 24 * s, ry = 9 * s, a = moving ? 0.5 : 0.32 + 0.18 * Math.sin(t * 2.4);
    ctx.save();
    ctx.strokeStyle = 'rgba(10,8,4,' + (a * 0.6).toFixed(3) + ')'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,222,150,' + a.toFixed(3) + ')'; ctx.lineWidth = 2; ctx.setLineDash(moving ? [] : [8, 6]); ctx.lineDashOffset = -t * 6;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    if (moving) {
      var hx = Math.cos(head), hy = -Math.sin(head), px = x + hx * (rx + 16 * s), py = y + hy * (ry + 12 * s);
      ctx.translate(px, py); ctx.rotate(Math.atan2(hy * (ry / rx), hx)); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(255,226,160,.9)'; ctx.strokeStyle = 'rgba(40,24,8,.7)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-3, -6.5); ctx.lineTo(0, 0); ctx.lineTo(-3, 6.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };

  // ================================================================ 발밑의 먼지·눈·자갈·풀잎, 발자국
  var DUST = {
    desert:   { c: [214, 184, 132], n: 1.6, r: [3, 11], life: 1.5, rise: 5 },
    steppe:   { c: [196, 176, 128], n: 0.9, r: [2, 8], life: 1.1, rise: 4 },
    grass:    { c: [150, 170, 96], n: 0.5, r: [1.2, 3], life: 0.7, rise: 6, fleck: 1 },
    forest:   { c: [70, 96, 44], n: 0.35, r: [1.2, 2.6], life: 0.8, rise: 5, fleck: 1 },
    jungle:   { c: [52, 86, 38], n: 0.4, r: [1.4, 3], life: 0.9, rise: 4, fleck: 1 },
    mountain: { c: [150, 144, 134], n: 0.7, r: [1.2, 5], life: 0.9, rise: 3, pebble: 1 },
    snow:     { c: [246, 250, 252], n: 1.2, r: [2, 7], life: 1.0, rise: 5 },
    tundra:   { c: [220, 226, 222], n: 0.6, r: [1.5, 5], life: 0.9, rise: 4 },
    ice:      { c: [236, 244, 250], n: 1.0, r: [2, 6], life: 0.9, rise: 4 }
  };
  P.newFx = function () { return { parts: [], acc: 0, tracks: [] }; };
  /** 움직인 만큼 발밑에서 인다 (dpx = 이번에 움직인 화면 거리, feet = 대원 발 자리들(세상 좌표)) */
  P.emit = function (F, terr, dpx, feet, speedK) {
    var D = DUST[terr]; if (!D || !feet.length) return;
    F.acc += dpx * D.n * (FXP().dust || 1) * (0.5 + 0.5 * Math.min(2, speedK || 1)) / 7;
    while (F.acc >= 1) {
      F.acc -= 1;
      var ft = feet[Math.floor(Math.random() * feet.length)];
      F.parts.push({ x: ft[0], y: ft[1], ox: (Math.random() - 0.5) * 10, oy: (Math.random() - 0.5) * 3, age: 0, life: D.life * (0.7 + Math.random() * 0.6), r0: D.r[0], r1: D.r[1] * (0.6 + Math.random() * 0.8), c: D.c, rise: D.rise, fleck: D.fleck, pebble: D.pebble, vx: (Math.random() - 0.5) * 8 });
      if (F.parts.length > 260) F.parts.shift();
    }
  };
  P.age = function (F, dt) {
    var j = 0, A = F.parts;
    for (var i = 0; i < A.length; i++) { var p = A[i]; p.age += dt; if (p.age < p.life) A[j++] = p; }
    A.length = j;
  };
  P.drawFx = function (ctx, F, toScreen) {
    F.parts.forEach(function (p) {
      var u = p.age / p.life, sp = toScreen(p.x, p.y), x = sp[0] + p.ox + p.vx * u, y = sp[1] + p.oy;
      if (p.fleck || p.pebble) {
        var hop = Math.sin(Math.min(1, u * 1.6) * Math.PI) * p.rise;
        ctx.fillStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',' + (0.85 * (1 - u)).toFixed(3) + ')';
        ctx.fillRect(x - p.r0 * 0.5, y - hop, p.r0, p.r0 * (p.fleck ? 0.6 : 1));
        return;
      }
      var r = p.r0 + (p.r1 - p.r0) * Math.sqrt(u), a = 0.42 * (1 - u) * Math.min(1, u * 6 + 0.2);
      ctx.fillStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(x, y - p.rise * u, r, r * 0.62, 0, 0, TAU); ctx.fill();
    });
  };
  /** 지나온 길의 자국: 사람·짐승은 발자국 점, 마차·썰매는 두 줄 바퀴 자국 (오래될수록 옅게) */
  P.drawTracks = function (ctx, pts, kind, terr, s) {
    if (pts.length < 2) return;
    var wheel = kind === 'wagon' || kind === 'reindeer', snow = terr === 'snow' || terr === 'ice' || terr === 'tundra', sand = terr === 'desert';
    var col = snow ? '90,110,130' : sand ? '120,86,48' : '60,40,20', base = snow ? 0.45 : 0.32;
    var n = pts.length, acc = 0;
    ctx.save(); ctx.lineCap = 'round';
    for (var i = 1; i < n; i++) {
      var a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
      if (l < 0.01 || l > 60) continue;
      var fade = base * Math.max(0, 1 - i / n);
      if (fade < 0.02) break;
      var nx = -dy / l, ny = dx / l;
      if (wheel) {
        ctx.strokeStyle = 'rgba(' + col + ',' + fade.toFixed(3) + ')'; ctx.lineWidth = 1.4;
        for (var k = -1; k <= 1; k += 2) { ctx.beginPath(); ctx.moveTo(a[0] + nx * k * 6 * s, a[1] + ny * k * 3.5 * s); ctx.lineTo(b[0] + nx * k * 6 * s, b[1] + ny * k * 3.5 * s); ctx.stroke(); }
      } else {
        acc += l;
        while (acc > 7 * s) {
          acc -= 7 * s;
          var u = 1 - acc / l, x = a[0] + dx * u, y = a[1] + dy * u, sd = (Math.floor(i + acc) % 2) ? 1 : -1;
          ctx.fillStyle = 'rgba(' + col + ',' + fade.toFixed(3) + ')';
          ctx.beginPath(); ctx.ellipse(x + nx * sd * 3 * s, y + ny * sd * 2 * s, 1.6 * s, 1.0 * s, 0, 0, TAU); ctx.fill();
        }
      }
    }
    ctx.restore();
  };

  /** 성문 마구간 미리보기: 작은 캔버스에 그 탈것의 탐험대가 제자리에서 걷는다 */
  P.preview = function (cv, id, draft, t, region) {
    var ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    var best = G.Mounts ? G.Mounts.best(id).terr : 'grass';
    var ground = { grass: ['#8aa05a', '#6f8a46'], steppe: ['#b8a46a', '#9a8a54'], desert: ['#dcc08a', '#c4a468'], forest: ['#4e6a34', '#3e5a2a'], jungle: ['#3e6a30', '#2e5a26'], mountain: ['#8a8474', '#6e6a5e'], snow: ['#e8eef2', '#c8d4dc'], tundra: ['#a8ae94', '#8a927c'], ice: ['#dce8f0', '#b8cad8'] }[best || 'grass'];
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, ground[0]); g.addColorStop(1, ground[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; for (var i = 0; i < 26; i++) { var rx = (i * 97.3 + t * 30) % (W + 20) - 10, ry = (i * 53.7) % H; ctx.fillRect(W - rx, ry, 3, 1.5); }
    var sc = H / 120, pts = [];
    for (var k = 0; k < 40; k++) pts.push([W * 0.78 - k * 8 * sc, H * 0.8]);
    P.draw(ctx, { pts: pts, head: 0, moving: true, phase: t * 1.4, dist: t * 60, t: t, mount: { id: id, n: 99 }, party: 12, draft: draft, region: region, gather: 0, face: 1, flag: '#1d3f7a', gait: id === 'horse' ? 'trot' : 'walk', size: sc * 0.95 });
  };
})(window.G = window.G || {});
