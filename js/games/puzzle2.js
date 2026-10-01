/* 유적의 장치 2 — 성배의 물 나누기 · 미궁 64 · 돌 입방체 · 스핑크스의 수수께끼(2차방정식).
   G.Games.pz[종류](발견물, 난이도 1~3) → Promise<true 열림 | false 실패>. 고르는 일은 js/games/puzzle.js.
   그림은 모두 CSS·글자로 그린다 (따로 그림 파일 없음). 스타일은 이 파일이 한 번 넣는다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var GM = G.Games = G.Games || {};
  GM.pz = GM.pz || {};
  function T(name, lv) { return GM.pzTitle ? GM.pzTitle(name, lv) : '유적의 장치 — ' + name; }
  function sfx(n) { if (G.Audio) try { G.Audio.sfx(n); } catch (e) { /* 소리 없음 */ } }

  // ================================================================ 스타일
  var CSS = [
    '.pz-stars{color:#b8862b;letter-spacing:1px;margin-left:8px;font-size:.9em}.pz-stars span{color:#9a8a70;opacity:.55}',
    '.gems.many .gem{width:46px;height:46px;font-size:16px}',
    '.pz-intro{font-size:18px;line-height:1.6;margin-bottom:10px}.pz-stat{font-size:18px;margin-top:10px;text-align:center;min-height:28px}',
    /* 성배 */
    '.grail-row{display:flex;gap:34px;justify-content:center;align-items:flex-end;min-height:250px;margin-top:6px}',
    '.vessel{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;padding:8px 10px;border-radius:10px}',
    '.vessel.sel{background:rgba(217,180,95,.25);box-shadow:0 0 0 2px #b8862b inset}',
    '.vessel .jar{position:relative;width:96px;border:4px solid #6b4a24;border-top:none;border-radius:0 0 26px 26px;background:linear-gradient(90deg,rgba(255,255,255,.35),rgba(255,255,255,.08));overflow:hidden}',
    '.vessel.grail .jar{border-color:#a07a1e;background:linear-gradient(90deg,rgba(255,240,190,.5),rgba(255,230,160,.12))}',
    '.vessel .water{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(180deg,#5aa6d6,#1f5e8f);transition:height .35s}',
    '.vessel .tick{position:absolute;left:0;width:12px;border-top:1px solid rgba(60,40,20,.55)}',
    '.vessel .stem{width:14px;height:16px;background:#a07a1e}.vessel .foot{width:60px;height:8px;border-radius:4px;background:#a07a1e}',
    '.vessel .lbl{font-size:17px;font-weight:700}.vessel .amt{font-size:22px;font-weight:800;color:#1f4f7a}',
    /* 미궁 */
    '.maze-wrap{display:flex;gap:18px;justify-content:center;align-items:flex-start}',
    '.maze{display:grid;grid-template-columns:repeat(8,52px);grid-template-rows:repeat(8,52px);background:#1b130c;border:4px solid #3a2616;user-select:none}',
    '.maze .rm{position:relative;box-sizing:border-box;background:#120c07;border:3px solid transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:24px}',
    '.maze .rm.seen{background:#c9b28a}.maze .rm.near{background:#8d7a5a}.maze .rm.trail{background:#d9c49a}',
    '.maze .rm.wn{border-top-color:#3a2616}.maze .rm.we{border-right-color:#3a2616}.maze .rm.ws{border-bottom-color:#3a2616}.maze .rm.ww{border-left-color:#3a2616}',
    '.maze .rm.me::after{content:"";width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff3c0,#e38b1c 60%,#8a3a08);box-shadow:0 0 14px 6px rgba(255,180,60,.6)}',
    '.maze-side{width:210px;font-size:16px;line-height:1.6}.maze-side .torch{font-size:30px;font-weight:800;color:#b8551a}',
    '.padbtns{display:grid;grid-template-columns:repeat(3,54px);gap:4px;margin-top:10px}.padbtns button{height:44px;font-size:20px;padding:0}',
    /* 입방체 */
    '.cube-wrap{display:flex;gap:22px;justify-content:center;align-items:flex-start}',
    '.cboard{display:grid;gap:3px;background:#5a3e22;padding:6px;border-radius:6px;user-select:none}',
    '.cboard .cl{width:58px;height:58px;background:#d8c49c;border-radius:3px;position:relative;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer}',
    '.cboard .cl.rock{background:#4a3a2a repeating-linear-gradient(45deg,#4a3a2a 0 6px,#3a2c1e 6px 12px);cursor:default}',
    '.cboard .cl.goal{background:#e7d38a;box-shadow:inset 0 0 0 3px #b8862b}.cboard .cl.goal::before{content:"門";font-size:24px;color:#8a6a1a;opacity:.6}',
    '.cboard .cl.seal::before{content:"◎";color:#7a4a9a}.cboard .cl.seal.lit::before{content:"●";color:#b8862b}',
    '.cboard .cube{position:absolute;inset:6px;background:linear-gradient(135deg,#9a8e80,#6e6458);border-radius:5px;box-shadow:0 3px 6px rgba(0,0,0,.45)}',
    '.cboard .cube .pf{position:absolute;background:#e0b23a}.cboard .cube.ft .pf{inset:7px;border-radius:3px;box-shadow:0 0 10px #ffd86a}',
    '.cboard .cube.fn .pf{left:4px;right:4px;top:0;height:7px}.cboard .cube.fs .pf{left:4px;right:4px;bottom:0;height:7px}',
    '.cboard .cube.fe .pf{top:4px;bottom:4px;right:0;width:7px}.cboard .cube.fw .pf{top:4px;bottom:4px;left:0;width:7px}',
    '.cboard .cube.fb .pf{left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#2a1f16;box-shadow:none}',
    '.cube-side{width:230px;font-size:16px;line-height:1.6}.cube-side .face{font-size:20px;font-weight:800;color:#8a5a10}',
    /* 스핑크스 */
    '.sphinx-q{font-size:20px;line-height:1.7;padding:12px 16px;background:rgba(120,90,50,.1);border-left:4px solid #b8862b;margin:8px 0 12px}',
    '.sphinx-q .eq{font-size:28px;font-weight:800;font-family:Georgia,serif;letter-spacing:.04em;display:block;text-align:center;margin:6px 0}',
    '.sphinx-ch{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sphinx-ch button{font-size:22px;padding:12px;font-family:Georgia,serif}',
    '.sphinx-ch button.struck{text-decoration:line-through;opacity:.4}',
    '.sphinx-top{display:flex;justify-content:space-between;font-size:16px;color:#5a4a36}.sphinx-top .tm{font-weight:800;color:#b8551a}'
  ].join('\n');
  function css() { if (document.getElementById('pz2-css')) return; var s = document.createElement('style'); s.id = 'pz2-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ================================================================ 성배의 물 나누기
  // ★1 8·5·3되 그릇으로 4되씩 · ★2 성배 10되와 7·3되 잔으로 5되씩 · ★3 14·9·5되로 7되씩
  var GRAIL = {
    1: { cap: [8, 5, 3], goal: 4, best: 7, slack: 5, names: ['성배', '은잔', '작은 잔'] },
    2: { cap: [10, 7, 3], goal: 5, best: 9, slack: 5, names: ['성배', '은잔', '작은 잔'] },
    3: { cap: [14, 9, 5], goal: 7, best: 13, slack: 5, names: ['성배', '은잔', '작은 잔'] }
  };
  GM.pz.grail = function (d, lv) {
    css();
    var P = GRAIL[lv] || GRAIL[2], limit = P.best + P.slack, resets = lv === 1 ? 3 : lv === 2 ? 2 : 1;
    var amt, moves, sel = null, done = false;
    function start() { amt = [P.cap[0], 0, 0]; moves = 0; sel = null; }
    start();
    return new Promise(function (resolve) {
      var win = UI.window({ title: T('성배의 물', lv), icon: 'drop', width: 860, closable: false, html:
        '<div class="pz-intro">샘가의 석판: 「성배에 담긴 ' + P.cap[0] + '되의 물을 둘로 똑같이 나누어라. 성배와 은잔에 ' + P.goal + '되씩 담기면 문이 열린다.」<br>' +
        '<span class="muted">그릇에는 눈금이 없습니다. 따를 그릇을 누르고, 받을 그릇을 누르면 넘치기 직전까지 붓습니다. 숫자 1·2·3 키로도 됩니다. (' + limit + '번 이내)</span></div>' +
        '<div class="grail-row"></div><div class="pz-stat"></div>',
        buttons: [{ label: '처음부터', value: 'r', cls: 'navy', onClick: function () { reset(); return false; } }, { label: '포기한다', value: 'g', cls: 'ghost', onClick: function () { resolve(false); } }],
        onKey: function (e) { var i = { 1: 0, 2: 1, 3: 2 }[e.key]; if (i != null) { click(i); return true; } return false; } });
      var row = win.content.querySelector('.grail-row'), stat = win.content.querySelector('.pz-stat'), msg = '';
      function draw() {
        row.innerHTML = P.cap.map(function (c, i) {
          var h = Math.round(40 + c / P.cap[0] * 150), ticks = '';
          for (var k = 1; k < c; k++) ticks += '<div class="tick" style="bottom:' + (k / c * 100) + '%"></div>';
          return '<div class="vessel' + (i === 0 ? ' grail' : '') + (sel === i ? ' sel' : '') + '" data-i="' + i + '"><div class="amt">' + amt[i] + '</div>' +
            '<div class="jar" style="height:' + h + 'px"><div class="water" style="height:' + (amt[i] / c * 100) + '%"></div>' + ticks + '</div>' +
            (i === 0 ? '<div class="stem"></div><div class="foot"></div>' : '') + '<div class="lbl">' + P.names[i] + ' (' + c + '되)</div></div>';
        }).join('');
        U.$$('.vessel', row).forEach(function (e) { e.onclick = function () { click(+e.dataset.i); }; });
        stat.innerHTML = msg || ('부은 횟수: ' + moves + ' / ' + limit + '   · 처음부터 다시: ' + resets + '번 남음');
        msg = '';
      }
      function reset() {
        if (done) return;
        if (resets <= 0) { msg = '<span class="warn-text">더는 처음으로 되돌릴 수 없다.</span>'; draw(); return; }
        resets--; start(); msg = '물을 모두 성배에 되붓고 처음부터 다시 한다.'; draw();
      }
      function click(i) {
        if (done) return;
        if (moves >= limit) { msg = '<span class="warn-text">샘물이 멎었다. 「처음부터」를 누르거나 포기하십시오.</span>'; draw(); return; }
        if (sel == null) { if (amt[i] > 0) sel = i; draw(); return; }
        if (sel === i) { sel = null; draw(); return; }
        var m = Math.min(amt[sel], P.cap[i] - amt[i]);
        if (m <= 0) { msg = '그 그릇은 이미 가득 찼다.'; sel = null; draw(); return; }
        amt[sel] -= m; amt[i] += m; moves++; sel = null; sfx('click');
        draw();
        if (amt[0] === P.goal && amt[1] === P.goal) {
          done = true; stat.innerHTML = '<span class="good-text">성배가 빛나며 문이 스르르 열렸다!</span>';
          setTimeout(function () { win.close(true); resolve(true); }, 1000);
        } else if (moves >= limit) {
          if (resets > 0) { msg = '<span class="warn-text">샘물이 멎었다... 「처음부터」로 다시 해 볼 수 있다.</span>'; draw(); }
          else { done = true; stat.innerHTML = '<span class="warn-text">샘물이 마르고 문은 굳게 닫혔다...</span>'; setTimeout(function () { win.close(false); resolve(false); }, 1400); }
        }
      }
      draw();
    });
  };

  // ================================================================ 미궁 64 (8×8 방)
  // ★1 지도가 다 보인다 · ★2 어둠 속 — 지나온 방과 문 너머 한 칸만 보인다 · ★3 어둠 + 지나온 방만 보이고, 열쇠를 찾아야 나가는 문이 열린다
  var DIRS = [[0, -1, 1, 'n'], [1, 0, 2, 'e'], [0, 1, 4, 's'], [-1, 0, 8, 'w']];   // dx dy 비트 이름
  function opp(bit) { return bit === 1 ? 4 : bit === 4 ? 1 : bit === 2 ? 8 : 2; }
  function makeMaze(N, rng) {
    var open = []; for (var i = 0; i < N * N; i++) open.push(0);
    var seen = {}, stack = [[0, N - 1]]; seen[(N - 1) * N] = 1;
    while (stack.length) {
      var c = stack[stack.length - 1], nb = [];
      DIRS.forEach(function (dd) { var x = c[0] + dd[0], y = c[1] + dd[1]; if (x >= 0 && y >= 0 && x < N && y < N && !seen[y * N + x]) nb.push([x, y, dd[2]]); });
      if (!nb.length) { stack.pop(); continue; }
      var n = nb[Math.floor(rng() * nb.length)];
      open[c[1] * N + c[0]] |= n[2]; open[n[1] * N + n[0]] |= opp(n[2]);
      seen[n[1] * N + n[0]] = 1; stack.push([n[0], n[1]]);
    }
    return open;
  }
  function distFrom(open, N, sx, sy) {
    var D = []; for (var i = 0; i < N * N; i++) D.push(-1);
    D[sy * N + sx] = 0; var q = [[sx, sy]];
    while (q.length) { var c = q.shift(); DIRS.forEach(function (dd) { if (!(open[c[1] * N + c[0]] & dd[2])) return; var x = c[0] + dd[0], y = c[1] + dd[1], k = y * N + x; if (D[k] < 0) { D[k] = D[c[1] * N + c[0]] + 1; q.push([x, y]); } }); }
    return D;
  }
  GM.pz.maze = function (d, lv) {
    css();
    var N = 8, rng = U.makeRng((Math.abs(U.strHash('maze:' + d.id)) + (G.Game && G.Game.state ? G.Game.state.day : 0)) >>> 0);
    var open = makeMaze(N, rng), sx = 0, sy = N - 1, ex = N - 1, ey = 0;
    var dS = distFrom(open, N, sx, sy), dE = distFrom(open, N, ex, ey), shortest = dS[ey * N + ex];
    var key = null, limit;
    if (lv === 3) {
      // 막다른 방 가운데 들어가는 길과 나가는 길이 모두 먼 곳에 열쇠를 둔다
      var bestK = -1;
      for (var k = 0; k < N * N; k++) {
        var o = open[k], deg = (o & 1 ? 1 : 0) + (o & 2 ? 1 : 0) + (o & 4 ? 1 : 0) + (o & 8 ? 1 : 0);
        if (deg !== 1 || k === sy * N + sx || k === ey * N + ex) continue;
        var sc = dS[k] + dE[k] + rng() * 3; if (sc > bestK) { bestK = sc; key = k; }
      }
      if (key == null) key = Math.floor(N * N / 2);
      limit = Math.ceil((dS[key] + dE[key]) * 1.7) + 14;
    } else limit = lv === 1 ? shortest + 14 : Math.ceil(shortest * 2.2) + 12;
    var px = sx, py = sy, steps = 0, got = lv !== 3, done = false, seen = {}, trail = {};
    seen[py * N + px] = 1; trail[py * N + px] = 1;
    var intro = d.id === 'knossos' || d.id === 'minotaur'
      ? '어두운 돌 복도 깊은 곳에서 황소의 울음 같은 소리가 들린다. 「예순네 개의 방을 지나 빛이 드는 문으로 나가라.」'
      : '입구의 석판: 「예순네 개의 방이 서로 얽혀 있다. 횃불이 다 타기 전에 빛이 드는 문으로 나가라.」';
    return new Promise(function (resolve) {
      var win = UI.window({ title: T('미궁 64', lv), icon: 'gate', width: 900, closable: false, html:
        '<div class="pz-intro">' + intro + '<br><span class="muted">방향키(또는 W·A·S·D)로 움직이거나 옆방을 누르십시오. 한 칸 움직일 때마다 횃불이 한 걸음씩 탑니다.' +
        (lv === 3 ? ' 출구는 열쇠가 있어야 열립니다.' : '') + '</span></div>' +
        '<div class="maze-wrap"><div class="maze"></div><div class="maze-side"></div></div><div class="pz-stat"></div>',
        buttons: [{ label: '포기한다', value: 'g', cls: 'ghost', onClick: function () { resolve(false); } }],
        onKey: function (e) {
          var m = { ArrowUp: 0, w: 0, W: 0, ArrowRight: 1, d: 1, D: 1, ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3 }[e.key];
          if (m != null) { move(m); return true; } return false;
        } });
      var box = win.content.querySelector('.maze'), side = win.content.querySelector('.maze-side'), stat = win.content.querySelector('.pz-stat');
      function visible(k) {
        if (lv === 1 || seen[k]) return 'seen';
        if (lv === 2) {   // 지나온 방에서 문이 열린 옆방은 어렴풋이 보인다
          var x = k % N, y = (k / N) | 0;
          for (var i = 0; i < 4; i++) { var dd = DIRS[i], nx = x - dd[0], ny = y - dd[1]; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; if (seen[ny * N + nx] && (open[ny * N + nx] & dd[2])) return 'near'; }
        }
        return '';
      }
      function draw() {
        var h = '';
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
          var k = y * N + x, v = visible(k), o = open[k], cls = 'rm';
          if (v) { cls += ' ' + v; if (!(o & 1)) cls += ' wn'; if (!(o & 2)) cls += ' we'; if (!(o & 4)) cls += ' ws'; if (!(o & 8)) cls += ' ww'; if (trail[k] && lv > 1) cls += ' trail'; }
          if (x === px && y === py) cls += ' me';
          var mark = '';
          if (x === ex && y === ey) mark = got ? '🚪' : '🔒';
          if (key === k && !got && (v || lv === 1)) mark = '🗝️';
          if (x === sx && y === sy && !(x === px && y === py)) mark = mark || '·';
          h += '<div class="' + cls + '" data-k="' + k + '">' + (x === px && y === py ? '' : mark) + '</div>';
        }
        box.innerHTML = h;
        U.$$('.rm', box).forEach(function (e) {
          e.onclick = function () { var k = +e.dataset.k, x = k % N, y = (k / N) | 0; for (var i = 0; i < 4; i++) if (px + DIRS[i][0] === x && py + DIRS[i][1] === y) { move(i); return; } };
        });
        var left = limit - steps;
        side.innerHTML = '<div>횃불</div><div class="torch">' + left + '걸음</div>' +
          '<div class="muted">처음 ' + limit + '걸음' + (lv === 1 ? ' · 가장 짧은 길 ' + shortest + '걸음' : '') + '</div>' +
          (lv === 3 ? '<div style="margin-top:6px">' + (got ? '🗝️ 열쇠를 찾았다!' : '🗝️ 열쇠: 아직 못 찾음') + '</div>' : '') +
          '<div class="padbtns"><span></span><button class="btn small" data-m="0">↑</button><span></span><button class="btn small" data-m="3">←</button><button class="btn small" data-m="2">↓</button><button class="btn small" data-m="1">→</button></div>';
        U.$$('.padbtns button', side).forEach(function (b) { b.onclick = function () { move(+b.dataset.m); }; });
      }
      function move(i) {
        if (done) return;
        var dd = DIRS[i], k = py * N + px;
        if (!(open[k] & dd[2])) { stat.innerHTML = '벽이다. 다른 길을 찾아보자.'; return; }
        px += dd[0]; py += dd[1]; steps++; k = py * N + px; seen[k] = 1; trail[k] = 1; stat.innerHTML = '';
        sfx('click');
        if (key === k && !got) { got = true; stat.innerHTML = '<span class="good-text">녹슨 열쇠를 주웠다!</span>'; }
        draw();
        if (px === ex && py === ey) {
          if (!got) stat.innerHTML = '<span class="warn-text">문이 잠겨 있다. 미궁 어딘가에 열쇠가 있을 것이다.</span>';
          else { done = true; stat.innerHTML = '<span class="good-text">빛이 드는 문을 지나 미궁을 빠져나왔다!</span>'; setTimeout(function () { win.close(true); resolve(true); }, 1000); return; }
        }
        if (steps >= limit && !done) { done = true; stat.innerHTML = '<span class="warn-text">횃불이 꺼졌다... 더듬더듬 입구로 되돌아 나왔다.</span>'; setTimeout(function () { win.close(false); resolve(false); }, 1500); }
      }
      draw();
    });
  };

  // ================================================================ 돌 입방체 굴리기
  // 한 면에만 금빛 문장이 있는 돌 입방체를 굴려 문(門) 칸에 문장이 위로 오게 세운다.
  // ★1 4×4 · ★2 5×5 바위 · ★3 6×6 바위 + 인장 칸 둘(문장을 아래로 하여 눌러 찍어야 한다)
  var ROLL = {   // 굴린 방향 → 문장 면이 어디로 가는가 (t 위 · b 아래 · n 북 · s 남 · e 동 · w 서)
    e: { t: 'e', e: 'b', b: 'w', w: 't', n: 'n', s: 's' },
    w: { t: 'w', w: 'b', b: 'e', e: 't', n: 'n', s: 's' },
    n: { t: 'n', n: 'b', b: 's', s: 't', e: 'e', w: 'w' },
    s: { t: 's', s: 'b', b: 'n', n: 't', e: 'e', w: 'w' }
  };
  var FACE_NAME = { t: '위', b: '아래(바닥)', n: '북쪽', s: '남쪽', e: '동쪽', w: '서쪽' };
  var CUBE = { 1: { n: 4, rocks: 0, seals: 0, min: 5, max: 9, slack: 6 }, 2: { n: 5, rocks: 5, seals: 0, min: 9, max: 14, slack: 5 }, 3: { n: 6, rocks: 7, seals: 2, min: 13, max: 20, slack: 6 } };
  function cubeSolve(B) {   // 가장 적은 수 (BFS) — 못 풀면 -1
    var n = B.n, start = [B.sx, B.sy, B.face, 0], full = (1 << B.seals.length) - 1;
    function key(s) { return s[0] + ',' + s[1] + ',' + s[2] + ',' + s[3]; }
    var seen = {}; seen[key(start)] = 0; var q = [start];
    while (q.length) {
      var s = q.shift(), dd = seen[key(s)];
      if (s[0] === B.gx && s[1] === B.gy && s[2] === 't' && s[3] === full) return dd;
      for (var i = 0; i < 4; i++) {
        var D = DIRS[i], x = s[0] + D[0], y = s[1] + D[1];
        if (x < 0 || y < 0 || x >= n || y >= n || B.rock[y * n + x]) continue;
        var f = ROLL[D[3]][s[2]], m = s[3], si = B.seals.indexOf(y * n + x);
        if (si >= 0 && f === 'b') m |= 1 << si;
        var t = [x, y, f, m], k = key(t);
        if (seen[k] == null) { seen[k] = dd + 1; q.push(t); }
      }
    }
    return -1;
  }
  function cubeBoard(lv) {
    var P = CUBE[lv] || CUBE[2], n = P.n, best = null;
    for (var tries = 0; tries < 400; tries++) {
      var B = { n: n, sx: 0, sy: n - 1, gx: n - 1, gy: 0, face: U.pick(['n', 'e', 's', 'w', 'b']), rock: {}, seals: [] };
      var free = []; for (var k = 0; k < n * n; k++) if (k !== B.sy * n + B.sx && k !== B.gy * n + B.gx) free.push(k);
      U.shuffle(free);
      for (var r = 0; r < P.rocks; r++) B.rock[free.pop()] = 1;
      for (var q = 0; q < P.seals; q++) B.seals.push(free.pop());
      var m = cubeSolve(B);
      if (m < 0) continue;
      B.best = m;
      if (m >= P.min && m <= P.max) return B;
      if (!best || Math.abs(m - P.min) < Math.abs(best.best - P.min)) best = B;
    }
    return best;
  }
  GM.pzTest = { makeMaze: makeMaze, distFrom: distFrom, cubeBoard: cubeBoard, cubeSolve: cubeSolve };   // 시험용
  GM.pz.cube = function (d, lv) {
    css();
    var P = CUBE[lv] || CUBE[2], B = cubeBoard(lv), n = B.n, limit = B.best + P.slack, resets = lv === 1 ? 3 : lv === 2 ? 2 : 1;
    var x, y, face, lit, moves, done = false;
    function start() { x = B.sx; y = B.sy; face = B.face; lit = {}; moves = 0; }
    start();
    return new Promise(function (resolve) {
      var win = UI.window({ title: T('돌 입방체', lv), icon: 'gear', width: 900, closable: false, html:
        '<div class="pz-intro">돌판의 글: 「금빛 문장을 하늘로 향하게 하여 문(門) 위에 세워라.' + (B.seals.length ? ' 그 전에 보랏빛 인장(◎) 칸마다 문장을 아래로 하여 눌러 찍어라.' : '') + '」<br>' +
        '<span class="muted">입방체는 한 칸 굴릴 때마다 한 면씩 돌아갑니다. 방향키(W·A·S·D)나 옆 칸을 눌러 굴리십시오. 위가 북쪽입니다. (' + limit + '번 이내)</span></div>' +
        '<div class="cube-wrap"><div class="cboard" style="grid-template-columns:repeat(' + n + ',58px)"></div><div class="cube-side"></div></div><div class="pz-stat"></div>',
        buttons: [{ label: '처음부터', value: 'r', cls: 'navy', onClick: function () { reset(); return false; } }, { label: '포기한다', value: 'g', cls: 'ghost', onClick: function () { resolve(false); } }],
        onKey: function (e) {
          var m = { ArrowUp: 0, w: 0, W: 0, ArrowRight: 1, d: 1, D: 1, ArrowDown: 2, s: 2, S: 2, ArrowLeft: 3, a: 3, A: 3 }[e.key];
          if (m != null) { roll(m); return true; } return false;
        } });
      var board = win.content.querySelector('.cboard'), side = win.content.querySelector('.cube-side'), stat = win.content.querySelector('.pz-stat'), msg = '';
      function draw() {
        var h = '';
        for (var yy = 0; yy < n; yy++) for (var xx = 0; xx < n; xx++) {
          var k = yy * n + xx, cls = 'cl';
          if (B.rock[k]) cls += ' rock';
          if (xx === B.gx && yy === B.gy) cls += ' goal';
          var si = B.seals.indexOf(k); if (si >= 0) cls += ' seal' + (lit[si] ? ' lit' : '');
          h += '<div class="' + cls + '" data-k="' + k + '">' + (xx === x && yy === y ? '<div class="cube f' + face + '"><div class="pf"></div></div>' : '') + '</div>';
        }
        board.innerHTML = h;
        U.$$('.cl', board).forEach(function (e) {
          e.onclick = function () { var k = +e.dataset.k, cx = k % n, cy = (k / n) | 0; for (var i = 0; i < 4; i++) if (x + DIRS[i][0] === cx && y + DIRS[i][1] === cy) { roll(i); return; } };
        });
        var sealTxt = B.seals.length ? '<div>인장: ' + B.seals.map(function (s, i) { return lit[i] ? '●' : '◎'; }).join(' ') + '</div>' : '';
        side.innerHTML = '<div>금빛 문장이 향한 곳</div><div class="face">' + FACE_NAME[face] + '</div>' +
          '<div class="muted" style="font-size:14px">돌 위의 금빛 띠·점이 문장의 자리입니다. 가득 빛나면 위, 검은 점이면 아래.</div>' + sealTxt +
          '<div style="margin-top:8px">굴린 수: <b>' + moves + '</b> / ' + limit + '</div><div class="muted">가장 적게는 ' + B.best + '번 · 처음부터 ' + resets + '번 남음</div>';
        stat.innerHTML = msg; msg = '';
      }
      function reset() {
        if (done) return;
        if (resets <= 0) { msg = '<span class="warn-text">돌이 너무 무거워 더는 처음 자리로 되돌릴 수 없다.</span>'; draw(); return; }
        resets--; start(); msg = '입방체를 처음 자리로 되돌렸다.'; draw();
      }
      function roll(i) {
        if (done) return;
        if (moves >= limit) { msg = '<span class="warn-text">돌이 바닥에 박혀 움직이지 않는다. 「처음부터」를 누르거나 포기하십시오.</span>'; draw(); return; }
        var D = DIRS[i], nx = x + D[0], ny = y + D[1];
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) { msg = '돌판 끝이다.'; draw(); return; }
        if (B.rock[ny * n + nx]) { msg = '바위가 막고 있다.'; draw(); return; }
        x = nx; y = ny; face = ROLL[D[3]][face]; moves++; sfx('click');
        var si = B.seals.indexOf(y * n + x);
        if (si >= 0 && face === 'b' && !lit[si]) { lit[si] = true; msg = '<span class="good-text">쿵! 인장이 찍혀 빛나기 시작했다.</span>'; }
        draw();
        var all = B.seals.every(function (s, k) { return lit[k]; });
        if (x === B.gx && y === B.gy && face === 't' && all) {
          done = true; stat.innerHTML = '<span class="good-text">금빛 문장이 하늘을 향하자 문이 갈라지며 열렸다!</span>';
          setTimeout(function () { win.close(true); resolve(true); }, 1000);
        } else if (x === B.gx && y === B.gy) {
          stat.innerHTML = face !== 't' ? '문 위에 섰지만 문장이 ' + FACE_NAME[face] + '을 향하고 있다.' : '<span class="warn-text">아직 찍지 않은 인장이 있다.</span>';
        }
        if (!done && moves >= limit) {
          if (resets > 0) stat.innerHTML = '<span class="warn-text">돌이 바닥에 박혔다... 「처음부터」로 다시 해 볼 수 있다.</span>';
          else { done = true; stat.innerHTML = '<span class="warn-text">돌이 바닥에 박혀 문은 끝내 열리지 않았다...</span>'; setTimeout(function () { win.close(false); resolve(false); }, 1400); }
        }
      }
      draw();
    });
  };

  // ================================================================ 스핑크스의 수수께끼 (2차방정식)
  // ★1 x² = 수 (3문제 중 2) · ★2 인수분해로 두 근 (3문제 중 2, 한 문제 45초) · ★3 글로 된 문제 (4문제 중 3, 한 문제 60초)
  // 과학을 아는 동료(또는 제독)가 있으면 문제마다 틀린 답 하나를 지워 준다.
  function sq(n) { return n < 0 ? '(' + n + ')' : '' + n; }
  function poly(a, b, c) {   // a x² + b x + c = 0 을 보기 좋게
    function term(k, v, first) {
      if (!k) return '';
      var s = k < 0 ? (first ? '−' : ' − ') : (first ? '' : ' + '), m = Math.abs(k);
      return s + (m === 1 && v ? '' : m) + v;
    }
    return (term(a, 'x²', true) + term(b, 'x', false) + term(c, '', false)) + ' = 0';
  }
  function frac(p, q) { return q === 1 ? '' + p : p + '/' + q; }
  function pairTxt(a, b) { return 'x = ' + a + ', ' + b; }
  function uniq4(right, cands) {
    var out = [right];
    cands.forEach(function (c) { if (out.length < 4 && out.indexOf(c) < 0) out.push(c); });
    var k = 1; while (out.length < 4) { var v = right + ' (?' + k++ + ')'; if (out.indexOf(v) < 0) out.push(v); }
    return out;
  }
  function q1() {
    var n = U.ri(3, 15), t = U.ri(0, 2), eq, txt;
    if (t === 0) { eq = 'x² = ' + n * n; txt = '어떤 수 x를 두 번 곱한 값은 ' + n * n + '이다. x는 얼마인가? (x는 0보다 큰 수)'; }
    else if (t === 1) { var c = U.ri(1, 30); eq = 'x² + ' + c + ' = ' + (n * n + c); txt = 'x를 두 번 곱한 다음 ' + c + '만큼 더한 값은 ' + (n * n + c) + '이다. x는? (0보다 큰 수)'; }
    else { eq = 'x² − ' + n * n + ' = 0'; txt = '이 식을 맞게 하는 0보다 큰 x는?'; }
    return { txt: txt, eq: eq, right: '' + n, cands: ['' + (n + 1), '' + (n - 1), '' + n * 2, '' + Math.round(n * n / 2), '' + (n + 2)] };
  }
  function q2() {
    var a, b;
    do { a = U.ri(-9, 9); b = U.ri(-9, 9); } while (!a || !b || a === b || a === -b);
    var lo = Math.min(a, b), hi = Math.max(a, b);
    function P(x, y) { return pairTxt(Math.min(x, y), Math.max(x, y)); }
    return { txt: '이 식을 맞게 하는 두 수 x를 모두 고르라. <span class="muted">(곱하면 ' + (a * b) + ', 더하면 ' + (a + b) + ' — 그런 두 수를 찾으면 된다)</span>', eq: poly(1, -(a + b), a * b),
      right: P(lo, hi), cands: [P(-lo, -hi), P(-lo, hi), P(lo, -hi), P(lo + 1, hi - 1), P(1, a * b)] };
  }
  function q3() {
    var t = U.ri(0, 3);
    if (t === 0) {   // 직사각형 밭
      var w = U.ri(4, 14), d = U.ri(2, 7), S = w * (w + d);
      return { txt: '내 신전 앞마당은 직사각형이다. 가로는 세로보다 ' + d + '걸음 길고, 넓이는 ' + S + '칸이다. 세로는 몇 걸음인가?', eq: 'x(x + ' + d + ') = ' + S, right: w + '걸음', cands: [(w + d) + '걸음', (w + 1) + '걸음', (w - 1) + '걸음', (w + 2) + '걸음'] };
    }
    if (t === 1) {   // 이어진 두 수
      var m = U.ri(5, 20), P2 = m * (m + 1);
      return { txt: '이어진 두 자연수를 곱한 값은 ' + P2 + '이다. 둘 중 작은 수는?', eq: 'x(x + 1) = ' + P2, right: '' + m, cands: ['' + (m + 1), '' + (m - 1), '' + Math.round(P2 / 2), '' + (m + 2)] };
    }
    if (t === 2) {   // 던진 돌
      var t1 = U.ri(1, 3), t2 = t1 + U.ri(1, 3), v = 5 * (t1 + t2), H = 5 * t1 * t2;
      return { txt: '돌을 곧장 위로 던지면 t초 뒤 높이는 ' + v + 't − 5t² 자이다. 돌이 처음으로 높이 ' + H + '자에 닿는 것은 몇 초 뒤인가?', eq: '5t² − ' + v + 't + ' + H + ' = 0', right: t1 + '초', cands: [t2 + '초', (t1 + t2) + '초', (t2 - t1 === 1 ? t2 + 1 : t2 - 1) + '초', (t1 * t2) + '초'] };
    }
    // 2x² 꼴: (2x − p)(x − q) = 0
    var p, q;
    do { p = U.ri(1, 9) * (U.chance(0.3) ? -1 : 1); q = U.ri(1, 7) * (U.chance(0.3) ? -1 : 1); } while (p % 2 === 0 || p === 2 * q);
    var r1 = frac(p, 2), r2 = '' + q;
    function P3(x, y) { return 'x = ' + x + ', ' + y; }
    return { txt: '이 식을 맞게 하는 두 수 x를 모두 고르라.', eq: poly(2, -(p + 2 * q), p * q),
      right: P3(r1, r2), cands: [P3(frac(-p, 2), '' + -q), P3('' + p, '' + q), P3(frac(p, 2), '' + -q), P3(frac(-p, 2), r2)] };
  }
  GM.pz.sphinx = function (d, lv) {
    css();
    var NQ = lv === 3 ? 4 : 3, need = lv === 3 ? 3 : 2, secs = lv === 1 ? 0 : lv === 2 ? 45 : 60;
    var gen = lv === 1 ? q1 : lv === 2 ? q2 : q3, qs = [];
    for (var i = 0; i < NQ; i++) { var q = gen(); q.ch = U.shuffle(uniq4(q.right, q.cands)); qs.push(q); }
    var sci = R && R.skillBest ? R.skillBest('sci') : { lv: R ? R.skill('sci') : 0, who: null };
    var idx = 0, ok = 0, bad = 0, timer = null, left = secs, done = false, answered = false;
    var intro = '모래 바람 속에서 사람 얼굴의 거대한 사자가 눈을 뜬다. 「길손이여, 나의 수수께끼를 풀어라. ' + NQ + '문제 가운데 ' + need + '문제를 맞히면 길을 열어 주마. 모르는 수는 x라 부른다.」';
    return new Promise(function (resolve) {
      var win = UI.window({ title: T('스핑크스의 수수께끼', lv), icon: 'eye', width: 860, closable: false, html:
        '<div class="pz-intro">' + intro + '</div><div class="sphinx-top"><span class="qn"></span><span class="tm"></span></div><div class="sphinx-q"></div><div class="sphinx-ch"></div><div class="pz-stat"></div>',
        buttons: [{ label: '물러난다', value: 'g', cls: 'ghost', onClick: function () { stop(); resolve(false); } }],
        onKey: function (e) { var i = { 1: 0, 2: 1, 3: 2, 4: 3 }[e.key]; if (i != null) { pick(i); return true; } return false; } });
      var c = win.content, qBox = c.querySelector('.sphinx-q'), chBox = c.querySelector('.sphinx-ch'), stat = c.querySelector('.pz-stat'), tm = c.querySelector('.tm');
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      function show() {
        answered = false;
        var q = qs[idx];
        c.querySelector('.qn').innerHTML = '수수께끼 ' + (idx + 1) + ' / ' + NQ + ' · 맞힘 ' + ok + ' · 틀림 ' + bad;
        qBox.innerHTML = q.txt + '<span class="eq">' + q.eq + '</span>';
        chBox.innerHTML = q.ch.map(function (t, i) { return '<button class="btn" data-i="' + i + '">' + (i + 1) + '. ' + U.esc(t) + '</button>'; }).join('');
        U.$$('button', chBox).forEach(function (b) { b.onclick = function () { pick(+b.dataset.i); }; });
        stat.innerHTML = '';
        if (sci.lv > 0) {   // 학자의 도움: 틀린 답 하나를 지운다
          var wrong = []; q.ch.forEach(function (t, i) { if (t !== q.right) wrong.push(i); });
          var w = wrong[Math.abs(U.strHash(q.eq)) % wrong.length], bt = chBox.querySelectorAll('button')[w];
          bt.classList.add('struck'); bt.disabled = true;
          stat.innerHTML = '<span class="muted">' + (sci.who ? U.esc(sci.who) + U.j(sci.who, '이/가').slice(sci.who.length) : '제독이') + ' 셈을 해 보고 틀린 답 하나를 지웠다.</span>';
        }
        stop(); left = secs; tm.textContent = secs ? '남은 시간 ' + left + '초' : '';
        if (secs) timer = setInterval(function () { left--; tm.textContent = '남은 시간 ' + left + '초'; if (left <= 0) { stop(); judge(-1); } }, 1000);
      }
      function pick(i) { if (done || answered) return; var b = chBox.querySelectorAll('button')[i]; if (!b || b.disabled) return; judge(i); }
      function judge(i) {
        answered = true; stop();
        var q = qs[idx], right = i >= 0 && q.ch[i] === q.right;
        if (right) { ok++; sfx('click'); stat.innerHTML = '<span class="good-text">「옳다.」 석상의 눈빛이 조금 누그러진다.</span>'; }
        else { bad++; stat.innerHTML = '<span class="warn-text">' + (i < 0 ? '「시간이 다 되었다.」' : '「틀렸다.」') + ' 답은 ' + U.esc(q.right) + '</span>'; }
        U.$$('button', chBox).forEach(function (b, k) { b.disabled = true; if (q.ch[k] === q.right) b.classList.add('navy'); });
        setTimeout(next, right ? 900 : 1700);
      }
      function next() {
        if (ok >= need) { done = true; stat.innerHTML = '<span class="good-text">「지혜로운 자여, 지나가라.」 석상이 옆으로 비켜서며 문이 열렸다!</span>'; setTimeout(function () { win.close(true); resolve(true); }, 1100); return; }
        if (bad > NQ - need) { done = true; stat.innerHTML = '<span class="warn-text">「어리석은 자여, 물러가라.」 모래 바람이 일행을 문 밖으로 밀어냈다...</span>'; setTimeout(function () { win.close(false); resolve(false); }, 1600); return; }
        idx++; show();
      }
      show();
    });
  };
})(window.G = window.G || {});
