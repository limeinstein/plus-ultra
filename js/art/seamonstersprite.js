/* 8방향 해상 괴물 그림. 잠수는 몸이 사라지고 물결만 남는 칸까지 이어진다.
   적 생성·피해·표적 선택은 이 파일에서 처리하지 않는다. */
(function (G) {
  'use strict';
  var S = G.SeaMonsterSprite = {}, sheets = {}, loading = {}, TAU = Math.PI * 2;
  function art(id) { return G.SEA_MONSTER_ART && G.SEA_MONSTER_ART[id]; }
  function effects() { return G.FX && G.FX.seaMonster; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function prepare(id) {
    var m = art(id);
    if (!m || !G.Img || !G.Img.has(m.key)) return Promise.resolve(null);
    if (sheets[id]) return Promise.resolve(sheets[id]);
    if (loading[id]) return loading[id];
    loading[id] = G.Img.load(m.key).then(function (img) {
      delete loading[id];
      if (img) sheets[id] = img;
      return img;
    }, function () { delete loading[id]; return null; });
    return loading[id];
  }
  S.preload = function (ids) {
    return Promise.all((ids || Object.keys(G.SEA_MONSTER_ART || {})).map(prepare));
  };
  S.status = function (id) { return sheets[id] ? 'ok' : loading[id] ? 'loading' : 'none'; };
  /* elapsed는 해당 동작을 시작한 뒤 지난 초다. 끝난 잠수는 물결 칸에서 멈춘다. */
  S.sample = function (id, angle, state, elapsed) {
    var m = art(id), layout = G.SEA_MONSTER_LAYOUT, fx = effects();
    if (!m || !layout || !fx) return null;
    var act = fx.actions[state] || fx.actions.idle;
    var q = Math.max(0, Number(elapsed) || 0) / act.seconds;
    q = act.loop ? q % 1 : clamp(q);
    var pos = q * (act.frames.length - 1), first = Math.floor(pos);
    var angleN = ((Number(angle) || 0) % TAU + TAU) % TAU;
    var dir = Math.round(angleN / TAU * layout.dirs) % layout.dirs;
    var residual = angleN - dir * TAU / layout.dirs;
    if (residual > Math.PI) residual -= TAU;
    return { dir: dir, residual: residual,
      row: act.frames[first], nextRow: act.frames[Math.min(first + 1, act.frames.length - 1)],
      mix: pos - first, finished: !act.loop && q >= 1 };
  };
  S.draw = function (ctx, x, y, angle, len, spec, time) {
    spec = spec || {};
    var id = spec.type, m = art(id), layout = G.SEA_MONSTER_LAYOUT;
    if (!m || !(len > 0)) return false;
    var img = sheets[id];
    if (!img) { prepare(id); return false; }
    var elapsed = spec.elapsed == null ? time || 0 : spec.elapsed;
    var frame = S.sample(id, angle, spec.state || 'idle', elapsed);
    if (!frame) return false;
    var c = layout.cell, scale = len / layout.baseLen;
    var sw = (img.naturalWidth || img.width) / layout.cols;
    var sh = (img.naturalHeight || img.height) / layout.rows;
    var opacity = spec.alpha == null ? 1 : clamp(spec.alpha);
    function draw(row, alpha) {
      if (alpha <= 0) return;
      ctx.globalAlpha = opacity * alpha * originalAlpha;
      ctx.drawImage(img, frame.dir * sw, row * sh, sw, sh,
        -layout.anchor[0] * scale, -layout.anchor[1] * scale, c * scale, c * scale);
    }
    ctx.save();
    var originalAlpha = ctx.globalAlpha;
    ctx.translate(x, y);
    // 가장 가까운 방위 칸에서 남은 각도만 돌려 실제 이동 방향을 정확히 바라본다.
    ctx.rotate(-frame.residual);
    // 동작 사이에는 부드럽게 바꾸고, 수중 물결은 같은 수면 위치에 둔다.
    draw(frame.row, 1 - frame.mix);
    draw(frame.nextRow, frame.mix);
    ctx.restore();
    return true;
  };
})(window.G = window.G || {});
