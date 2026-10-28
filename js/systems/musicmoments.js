/* 장면 사이의 「잠깐」 곡 (G.MusicMoments) — 미니 게임·육상전·청혼·세계 일주 귀환·엔딩·전설의 대륙을 찾는 순간에는
   그동안 그 순간의 곡(js/data/music.js moments)을 틀고, 끝나면 하던 장면의 곡으로 돌아간다 (G.Audio.fileMoment · G.Audio.fileResume).
   G.Audio.music 이 처음 불릴 때 한 번 감싼다 (install). */
(function (G) {
  'use strict';
  var MM = G.MusicMoments = {};
  function moment(name) { if (G.Audio && G.Audio.fileMoment) G.Audio.fileMoment(name); }
  function resume() { if (G.Audio && G.Audio.fileResume) G.Audio.fileResume(); }
  MM.moment = moment;
  MM.resume = resume;
  /** 한 번 감싸기: 그 함수가 도는 동안 그 순간의 곡 */
  function wrap(obj, key, scene) {
    var f = obj && obj[key]; if (typeof f !== 'function' || f._moment) return;
    var g = function () {
      moment(scene);
      var r;
      try { r = f.apply(this, arguments); } catch (e) { resume(); throw e; }
      if (r && typeof r.then === 'function') return r.then(function (v) { resume(); return v; }, function (e) { resume(); throw e; });
      resume(); return r;
    };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) g[k] = f[k];
    g._moment = true; obj[key] = g;
  }
  MM.install = function () {
    if (MM._inst) return; MM._inst = true;
    wrap(G.Games, 'puzzle', 'minigame'); wrap(G.Games, 'poker', 'minigame'); wrap(G.Fishing, 'open', 'minigame');
    wrap(G.Games, 'landWar', 'landwar');
    wrap(G.Wives, 'proposeMaid', 'love'); wrap(G.Wives, 'proposeMate', 'love');
    wrap(G.Sponsor, 'circumReturn', 'circum');
    wrap(G.Ending, 'show', 'gameover');
    // 전설의 대륙(무 제국·아틀란티스)을 찾는 순간
    var find = G.Disc && G.Disc.find;
    if (find && !find._moment) {
      var g = function (d) {
        var legend = d && (d.id === 'mu' || /atlantis/i.test(d.id) || /아틀란티스|무 대륙|무 제국/.test(d.name || ''));
        if (!legend) return find.apply(this, arguments);
        moment('legend');
        var r = find.apply(this, arguments);
        return r && r.then ? r.then(function (v) { resume(); return v; }, function (e) { resume(); throw e; }) : (resume(), r);
      };
      for (var k in find) if (Object.prototype.hasOwnProperty.call(find, k)) g[k] = find[k];
      g._moment = true; G.Disc.find = g;
    }
  };
})(window.G = window.G || {});
