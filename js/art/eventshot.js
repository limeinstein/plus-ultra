/* 이벤트 샷 (G.EventShot) — 공주·왕녀가 나서는 사건에서 화면 위쪽에 한 장면을 띄운다. 2026-10-18
   ■ 그린 그림이 있으면 그것을: images/events/princess/<장면>.webp (예: es_rescued · es_return · es_wedding · eliz_tower · eliz_safe ·
     eliz_knight · court_rescue · royal_wedding — tools/eventshot/PROMPT.md)
   ■ 없으면 있는 그림으로 장면을 꾸린다: 그 자리의 배경(왕궁 안·런던 탑·항구·사막·거친 바다) + 사람들의 무릎상 + 빛(금빛·밤·노을·한낮)
     — 주인공(공주)은 밝게 빛나고, 곁의 사람은 한 톤 어둡게. 액자는 옛이야기 장면 그림과 같은 틀(G.FamEv.showPic)이다.
   ■ 그림 속 사람이 주인공이므로, 그동안 대화는 대화창 안의 얼굴로 한다 (scenepic-on — js/ui/ui.js dialogShell).
   ■ G.EventShot.show(o) → Promise<handle> (handle.stop() → Promise). o = { key, title, bg: [그림 열쇠…], cast: [{ half: [열쇠…], x: 0~1, lead, flip, h }], light, sparkle } */
(function (G) {
  'use strict';
  var ES = {};
  G.EventShot = ES;
  var W = 1512, H = 672;   // 액자(1008×448)의 1.5배로 그려 또렷하게
  function I() { return G.Img; }
  function load(chain) {
    var Im = I(); if (!Im || !chain || !chain.length || !Im.pick(chain)) return Promise.resolve(null);
    return Im.wait(Im.resolve(chain), 4000).then(function (r) { return r && r.img ? r.img : null; }, function () { return null; });
  }
  var LIGHT = {
    gold:  { top: 'rgba(255,214,140,.10)', mid: 'rgba(255,196,110,.16)', glow: 'rgba(255,224,160,.65)', vig: 0.55 },
    night: { top: 'rgba(10,18,48,.55)', mid: 'rgba(30,40,90,.30)', glow: 'rgba(200,220,255,.55)', vig: 0.72 },
    dusk:  { top: 'rgba(255,120,40,.20)', mid: 'rgba(120,40,30,.18)', glow: 'rgba(255,190,120,.6)', vig: 0.6 },
    day:   { top: 'rgba(255,255,255,.04)', mid: 'rgba(255,240,210,.06)', glow: 'rgba(255,248,220,.5)', vig: 0.45 }
  };
  /** 장면을 캔버스에 그린다 → Promise<canvas> */
  ES.compose = function (o) {
    var L = LIGHT[o.light] || LIGHT.gold, cast = o.cast || [];
    return Promise.all([load(o.bg)].concat(cast.map(function (c) { return load(c.half); }))).then(function (imgs) {
      var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d'), bg = imgs[0];
      // 배경
      if (bg) { var z = o.bgZoom || 1; G.Img.drawCover(ctx, bg, -W * (z - 1) / 2, -H * (z - 1) / 2, W * z, H * z, 0.5, o.bgY == null ? 0.45 : o.bgY); }   // bgZoom: 가장자리에 검은 띠가 있는 그림은 조금 당겨서
      else { var g0 = ctx.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, '#3a2a1a'); g0.addColorStop(1, '#120c06'); ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H); }
      // 빛: 위에서 내려오는 색 · 가운데의 따스함 (사람 뒤)
      var g1 = ctx.createLinearGradient(0, 0, 0, H); g1.addColorStop(0, L.top); g1.addColorStop(1, 'rgba(0,0,0,.25)'); ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
      var lead = cast.filter(function (c) { return c.lead; })[0] || cast[0];
      var lx = lead ? (lead.x == null ? 0.5 : lead.x) * W : W / 2;
      var g2 = ctx.createRadialGradient(lx, H * 0.45, 20, lx, H * 0.45, H * 0.9); g2.addColorStop(0, L.mid); g2.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
      // 사람들: 곁의 사람을 먼저(뒤), 주인공을 나중에(앞)
      var order = cast.map(function (c, i) { return i; }).sort(function (a, b) { return (cast[a].lead ? 1 : 0) - (cast[b].lead ? 1 : 0); });
      order.forEach(function (i) {
        var c = cast[i], im = imgs[i + 1]; if (!im) return;
        var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height; if (!iw || !ih) return;
        var h = H * (c.h || 1.1), w = h * iw / ih, x = (c.x == null ? 0.5 : c.x) * W - w / 2, y = H * (c.y == null ? 0.03 : c.y);
        ctx.save();
        if (c.lead) { ctx.shadowColor = L.glow; ctx.shadowBlur = 38; }
        else { try { ctx.filter = 'brightness(0.78) saturate(0.9)'; } catch (e) { /* 옛 브라우저 */ } ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 24; }
        if (c.flip) { ctx.translate(x + w / 2, 0); ctx.scale(-1, 1); ctx.translate(-(x + w / 2), 0); }
        ctx.drawImage(im, x, y, w, h);
        ctx.restore();
      });
      // 반짝임 (주인공 둘레)
      if (o.sparkle !== false && lead) {
        var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
        for (var k = 0; k < 18; k++) {
          var sx = lx + (rnd() - 0.5) * W * 0.32, sy = H * (0.08 + rnd() * 0.6), r = 1.5 + rnd() * 3.5;
          var g3 = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4); g3.addColorStop(0, 'rgba(255,248,220,.95)'); g3.addColorStop(1, 'rgba(255,230,170,0)');
          ctx.fillStyle = g3; ctx.beginPath(); ctx.arc(sx, sy, r * 4, 0, 7); ctx.fill();
        }
      }
      // 가장자리를 어둡게 (영화의 한 장면처럼)
      var g4 = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H * 0.5, W * 0.62); g4.addColorStop(0, 'rgba(0,0,0,0)'); g4.addColorStop(1, 'rgba(0,0,0,' + L.vig + ')');
      ctx.fillStyle = g4; ctx.fillRect(0, 0, W, H);
      return cv;
    });
  };
  /** 장면을 띄운다 → Promise<handle>. 그린 그림(images/events/princess/<key>)이 있으면 그것을 */
  ES.show = function (o) {
    var none = { stop: function () { return Promise.resolve(); } };
    if (!G.FamEv || !G.FamEv.showPic) return Promise.resolve(none);
    var own = o.key && I() && I().pick(['events/princess/' + o.key]);
    if (own) return Promise.resolve(G.FamEv.showPic({ img: own, title: o.title, noStand: true }) || none);
    return ES.compose(o).then(function (cv) { return G.FamEv.showPic({ canvas: cv, title: o.title, noStand: true }) || none; }, function (e) { console.error(e); return none; });
  };

  // ---------------------------------------------------------------- 공주 장면
  function heroHalf() { return G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : ['characters/player_half']; }
  function palaceBg(c) { return c && G.Img.chain.interior ? G.Img.chain.interior('palace', c) : ['interiors/palace_europe']; }
  /** 궁정의 왕녀(G.COURT.princesses) — 나라와 이름으로 */
  ES.courtPrincess = function (realm, name) {
    var L = (G.COURT && G.COURT.princesses) || [];
    return L.filter(function (x) { return (!realm || x.realm === (realm.id || realm)) && x.name === name; })[0] ||
      L.filter(function (x) { return x.realm === (realm && (realm.id || realm)); })[0] || null;
  };
  /** 그 왕녀가 말할 때 (얼굴·무릎상) */
  ES.princessSpeaker = function (realm, name) {
    var pr = ES.courtPrincess(realm, name);
    if (!pr) return { name: name || '왕녀', lang: 3 };
    return { name: name || pr.name, portrait: G.Art.withImg(G.Art.npcSpec('pr:' + pr.id, 'noble', pr.style, 'f'), [pr.face]), half: [pr.half], lang: 3, special: true };
  };
  /** 공주가 나서는 장면. scene: es_rescued · es_return · es_wedding · eliz_tower · eliz_safe · eliz_knight · court_rescue · royal_wedding */
  ES.princess = function (scene, o) {
    o = o || {};
    var esHalf = ['portraits/princesses/m_princess_half', 'portraits/npc/princess_es_half'];
    var eliz = ['portraits/princesses/court_princess_en_1_half', 'portraits/sponsors/en_king_6_half'];
    var queen = ['portraits/sponsors/en_king_6_half', 'portraits/princesses/court_princess_en_1_half'];
    var C = G.CITY_DATA, spec;
    if (scene === 'es_rescued') spec = { title: '해적 요새에서 구한 왕녀', bg: o.how === 'land' ? ['landwar/backgrounds/desert', 'battle/rough-sea'] : ['battle/rough-sea', 'landwar/backgrounds/desert'], light: 'dusk', bgY: 0.6, bgZoom: o.how === 'land' ? 1 : 1.22,
      cast: [{ half: heroHalf(), x: 0.3 }, { half: esHalf, x: 0.66, lead: true }] };
    else if (scene === 'es_return') spec = { title: '왕녀의 귀환', bg: palaceBg(o.city || C[7]), light: 'gold',
      cast: [{ half: o.kingHalf || [], x: 0.73 }, { half: esHalf, x: 0.4, lead: true }] };
    else if (scene === 'es_wedding') spec = { title: '부마의 혼례', bg: palaceBg(o.city || C[7]), light: 'gold',
      cast: [{ half: heroHalf(), x: 0.34 }, { half: esHalf, x: 0.64, lead: true }] };
    else if (scene === 'eliz_tower') spec = { title: '런던 탑의 공주', bg: ['discovery-ends/whitetower', 'discoveries/whitetower'], light: 'night', bgY: 0.4,
      cast: [{ half: eliz, x: 0.6, lead: true }] };
    else if (scene === 'eliz_safe') spec = { title: '무사히 닿은 항구' + (o.city ? ' — ' + o.city.name : ''), bg: o.city ? (G.Img.chain.bg ? G.Img.chain.bg(o.city) : ['backgrounds/' + o.city.id]) : [], light: 'day', bgY: 0.5,
      cast: [{ half: heroHalf(), x: 0.32 }, { half: eliz, x: 0.66, lead: true }] };
    else if (scene === 'eliz_knight') spec = { title: '여왕의 기사', bg: palaceBg(o.city || C.filter(function (c) { return c && c.name === '런던'; })[0]), light: 'gold',
      cast: [{ half: heroHalf(), x: 0.32 }, { half: queen, x: 0.66, lead: true }] };
    else if (scene === 'court_rescue' || scene === 'royal_wedding') {
      var pr = ES.courtPrincess(o.realm, o.name), ph = pr ? [pr.half] : [];
      spec = scene === 'court_rescue'
        ? { title: (o.name || '왕녀') + '의 귀환', bg: palaceBg(o.city), light: 'gold', cast: [{ half: heroHalf(), x: 0.32 }, { half: ph, x: 0.66, lead: true }] }
        : { title: o.title || '두 왕실의 혼인', bg: palaceBg(o.city), light: 'gold', cast: [{ half: ph, x: 0.5, lead: true }] };
    }
    if (!spec) return Promise.resolve({ stop: function () { return Promise.resolve(); } });
    spec.key = scene;
    return ES.show(spec);
  };
})(window.G = window.G || {});
