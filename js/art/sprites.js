/* 스프라이트 시트 그리기 (images/sprites/)
   · 육상전 부대·들짐승·항해 사건 시트: tools/sprite_repack.py 가 고른 칸으로 다시 짠 것. 칸 크기·발밑 피벗·동작별 장면 번호는
     js/data/sprites.js 의 G.SPRITE_SHEETS. 모든 그림은 오른쪽을 본다(왼쪽은 좌우 반전).
   · 탐험대 8방향 시트(party_*, 탈것마다 천천히·빨리): 줄 = 방위(N NE E SE S SW W NW), 칸 = 걸음 장면. 자르는 선과 피벗은 G.SPRITE_PARTY.
   그림 파일이 없으면 draw 가 false 를 돌려주고, 부르는 쪽은 예전처럼 코드로 그린다. */
(function (G) {
  'use strict';
  var SP = G.Sprites = {};
  var IMG = {};
  function meta(id) { return (G.SPRITE_SHEETS || {})[id] || null; }
  SP.meta = meta;
  /** 시트 그림 (아직 못 읽었으면 읽기 시작하고 null) */
  function sheet(key) {
    var o = IMG[key]; if (o) return o.img;
    o = IMG[key] = { img: null };
    var I = G.Img; if (!I || !I.has(key)) return null;
    var got = I.get(key);
    if (got) { o.img = got; return got; }
    I.resolve([key]).then(function (r) { if (r && r.img) o.img = r.img; });
    return null;
  }
  SP.img = function (id) { return sheet('sprites/' + id); };
  SP.ready = function (id) { return !!(meta(id) && SP.img(id)); };
  SP.has = function (id) { return !!(meta(id) && G.Img && G.Img.has('sprites/' + id)); };
  SP.preload = function (ids) { [].concat(ids || []).forEach(function (id) { SP.img(id); }); };
  /** 줄 번호 (이름 또는 번호) */
  SP.row = function (id, name) { var m = meta(id); if (!m) return -1; if (typeof name === 'number') return name; return m.rows.indexOf(name); };
  /** 이 줄에서 이 동작의 장면 번호 목록 (없으면 idle) */
  SP.frames = function (id, row, act) {
    var m = meta(id); if (!m) return [0];
    var r = m.racts && m.racts[row];
    return (r && r[act]) || m.acts[act] || (r && r.idle) || m.acts.idle || [0];
  };
  /** 시간 t(초)에 보일 장면: fps 로 돌린다. loop=false 면 마지막 장면에서 멈춘다 */
  SP.at = function (id, row, act, t, fps, loop) {
    var f = SP.frames(id, row, act), k = Math.floor(Math.max(0, t) * (fps || 8));
    return f[loop === false ? Math.min(k, f.length - 1) : k % f.length];
  };
  /** 발밑 피벗을 (x, y)에 맞춰 한 장면을 그린다. k: 시트 픽셀 배율, flip: 왼쪽을 보게 */
  SP.draw = function (ctx, id, row, frame, x, y, k, flip, alpha) {
    var m = meta(id), img = SP.img(id);
    if (!m || !img || row < 0) return false;
    k = k || 1;
    ctx.save();
    if (alpha != null) ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, frame * m.cw, row * m.ch, m.cw, m.ch, -m.px * k, -m.py * k, m.cw * k, m.ch * k);
    ctx.restore();
    return true;
  };
  /** 피벗에서 머리끝까지의 높이(시트 픽셀) — 화면 키에 맞출 배율을 셀 때 쓴다 */
  SP.height = function (id) { var m = meta(id); return m ? m.h : 1; };

  // ---------------------------------------------------------------- 탐험대 8방향
  var DIR_N = 8;
  /** 수학 각도(동쪽 0, 북쪽 +π/2) → 시트 줄 (0 = 북, 시계 방향) */
  SP.dirOf = function (ang) { var d = Math.round((Math.PI / 2 - ang) / (Math.PI / 4)); return ((d % DIR_N) + DIR_N) % DIR_N; };
  /** mode: on_foot_walk · mounted_gallop · camel_walk … (js/art/party.js 의 SPRITE_SHEETS) */
  SP.partyReady = function (mode) { var P = G.SPRITE_PARTY; return !!(P && P.sheets[mode] && sheet('sprites/party_' + mode)); };
  SP.partyFrames = function (mode) { var P = G.SPRITE_PARTY; return P && P.sheets[mode] ? P.sheets[mode].n : 1; };
  SP.drawParty = function (ctx, mode, dir, frame, x, y, k, alpha) {
    var P = G.SPRITE_PARTY, s = P && P.sheets[mode], img = sheet('sprites/party_' + mode);
    if (!s || !img) return false;
    var c = frame % s.n, r = dir % DIR_N;
    var sx = s.cols[c], sy = s.rows[r], sw = s.cols[c + 1] - sx, sh = s.rows[r + 1] - sy;
    ctx.save();
    if (alpha != null) ctx.globalAlpha *= alpha;
    ctx.drawImage(img, sx, sy, sw, sh, x - s.px[c] * k, y - s.py[r] * k, sw * k, sh * k);
    ctx.restore();
    return true;
  };
  /** 탐험대 그림의 키(피벗 위로, 시트 픽셀) — 걸어서는 약 50, 말 타고는 약 55 */
  SP.partyHeight = function (mode) { var P = G.SPRITE_PARTY, s = P && P.sheets[mode]; return s ? s.py[0] - 4 : 50; };
})(window.G = window.G || {});
