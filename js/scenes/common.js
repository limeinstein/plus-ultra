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
  SC.discoveryCard = async function (d, fame) {
    var chain = G.Img.chain.discovery(d);
    if (G.Img.pick(chain)) await G.Img.preload([chain], 1500);
    var art = G.Img.make(chain, 720, 320, function () { return A.discoveryArt(d, 720, 320); });
    var html = '<div class="disc-card"><div class="disc-head">DISCOVERY</div><div class="art"></div>' +
      '<div class="dname">' + U.esc(d.name) + '</div>' +
      '<div class="center"><span class="tag">' + (G.DISC_CATS[d.cat] || '') + '</span> <span class="tag">' + (d.how === 'trade' ? '교역품' : G.REGIONS[d.reg] || '') + '</span> <span class="tag">가치 ' + U.num(d.val) + '</span></div>' +
      '<div class="desc">' + U.esc(d.desc) + '</div>' +
      (fame ? '<div class="center big" style="color:#6a3a14">명성 +' + U.num(fame) + '</div>' : '') + '</div>';
    var win = UI.window({ title: '새로운 발견', icon: 'star', width: 780, html: html, buttons: [{ label: '확인', value: 1, cls: 'navy' }] });
    win.content.querySelector('.art').appendChild(art);
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
