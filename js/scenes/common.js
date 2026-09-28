/* Shared scene helpers: companion speakers, discovery card with painted vignette, resume. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art, R = G.R;
  var SC = G.Scenes;
  function S() { return G.Game.state; }

  SC.mateSpec = function (id) { return A.mateSpec(id); };
  /** speaker object for the companion in a given fleet role (falls back to any mate / boatswain) */
  SC.mateSpeaker = function (role) {
    var s = S(), m = null;
    if (s) { m = s.mates.filter(function (x) { return x.role === role; })[0] || s.mates.filter(function (x) { return x.role === 'first'; })[0] || s.mates[0]; }
    if (!m) return { name: '갑판장', portrait: A.withImg(A.npcSpec('boatswain', 'sailor', 'ib'), G.Img.chain.npc('boatswain')), lang: 3 };
    var d = G.MATE[m.id];
    return { name: d.name, portrait: SC.mateSpec(m.id), lang: 3 };
  };
  SC.hasMate = function (role) { var s = S(); return s.mates.some(function (x) { return x.role === role; }); };

  /** big discovery announcement card */
  /** 발견 카드 아래의 유물 줄: 새로 찾았을 때는 손에 넣은 것, 수첩에서 볼 때는 지금 어디에 있는지 */
  SC.relicStrip = function (d, relics) {
    var all = G.RELICS && G.RELICS[d.id]; if (!all || !all.length) return '';
    var s = G.Game.state, st = s.disc[d.id] || {}, mine = st.me;
    var list = relics || (mine ? all : null); if (!list || !list.length) return '';
    function where(r) {
      if (relics) return G.RELIC_KIND[r.kind] + ' · 값 ' + U.num(r.price);
      var it = s.player.items.filter(function (x) { return x.id === r.id; })[0];
      if (it) return R.isProof(it) ? '소지 중 (증거)' : '소지 중';
      if (st.left && st.left.indexOf(r.id) >= 0) return '그 자리에 두고 옴';
      if ((st.relics || []).indexOf(r.id) < 0) return '손에 넣지 못함';
      if (s.fleet.ships.some(function (sh) { return sh.fig === r.id; })) return '배에 달았다';
      return st.reported && st.gaveTo ? '후원자에게 바침' : '손을 떠남';
    }
    return '<div class="relic-strip"><div class="rs-head">' + (relics ? '손에 넣은 유물 — 발견의 증거가 됩니다' : '이 발견의 유물') + '</div><div class="rs-row">' +
      list.map(function (r) { return '<div class="rs-item" data-relic="' + r.id + '"><b>' + U.esc(r.name) + '</b><small>' + where(r) + '</small></div>'; }).join('') + '</div>' +
      (relics ? '<div class="rs-note">후원자에게 보고하면 증거로 바치고, 항구에서 스스로 발표하면 제독의 것이 됩니다.</div>' : '') + '</div>';
  };
  SC.discoveryCard = async function (d, fame, relics) {
    var chain = G.Img.chain.discovery(d);
    if (G.Img.pick(chain)) await G.Img.preload([chain], 1500);
    var art = G.Img.make(chain, 720, 320, function () { return A.discoveryArt(d, 720, 320); });
    var html = '<div class="disc-card"><div class="disc-head">DISCOVERY</div><div class="art"></div>' +
      '<div class="dname">' + U.esc(d.name) + '</div>' +
      '<div class="center"><span class="tag">' + (G.DISC_CATS[d.cat] || '') + '</span> <span class="tag">' + (d.how === 'trade' ? '교역품' : G.REGIONS[d.reg] || '') + '</span> <span class="tag">' + (G.Disc.valueTag ? G.Disc.valueTag(d) : '가치 ' + U.num(d.val)) + '</span></div>' +
      '<div class="desc">' + U.esc(d.desc) + '</div>' +
      (fame ? '<div class="center big" style="color:#6a3a14">명성 +' + U.num(fame) + '</div>' : '') + SC.relicStrip(d, relics) + '</div>';
    var win = UI.window({ title: fame ? '새로운 발견' : d.name, icon: 'star', width: 780, clickAny: true, html: html, buttons: [{ label: '확인', value: 1, cls: 'navy' }] });
    win.content.querySelector('.art').appendChild(art);
    U.$$('[data-relic]', win.content).forEach(function (el) {
      var r = G.RELIC[el.dataset.relic]; if (!r || !A.relicArt) return;
      el.insertBefore(G.Img.make(G.Img.chain.relic(r), 112, 112, function () { return A.relicArt(r, 112, 112); }), el.firstChild);
    });
    return win.result;
  };

  // ---------------------------------------------------------------- resume from a loaded save
  G.Game.resume = function () {
    if (G.Names) G.Names.apply();
    var s = G.Game.state;
    if (!s.settings) s.settings = { diff: 'normal', speed: 1 };
    UI.fade(function () {
      if (s.loc.mode === 'sea') G.Game.go('sea', { resume: true });
      else if (s.loc.mode === 'land' && G.Scenes.land) G.Game.go('land', { resume: true });
      else G.Game.go('city', { cityId: s.loc.city, load: true });
    });
  };
})(window.G = window.G || {});
