/* 이야기 원화: 사건 대화와 함께 보여 주고, 수첩에서 다시 펼친다. */
(function (G) {
  'use strict';
  var SA = G.StoryArt = {}, current = null;
  SA.show = async function (key, title) {
    if (!G.Img.has(key) || !G.FamEv) return false;
    if (current) await SA.end();
    current = G.FamEv.showPic({ img: key, title: title || '', noStand: true, objectFit: 'contain' });
    if (!current) return false;
    current.box.classList.add('story-art-shot');
    await current.ready;
    return true;
  };
  SA.end = function () { var h = current; current = null; return h ? h.stop() : Promise.resolve(); };
  /** 저장된 진행은 바꾸지 않고, 각 대사 원문에 맞는 장면을 보여 준다. */
  SA.line = async function (mode, beat, line, index) {
    var plan = (G.STORY_ART[mode] || {}).beats || {}, shots = plan[beat] || [];
    for (var j = 0; j < shots.length; j++) {
      var shot = shots[j], text = Array.isArray(line) ? line[1] : (line && line.ask) || '';
      if ((shot.at != null && shot.at === index) || (shot.text && text.indexOf(shot.text) >= 0)) await SA.show(shot.img, shot.title);
    }
  };
  SA.player = function (p, half, age) {
    var s = G.Game && G.Game.state;
    p = p || (s && s.player);
    if (!s || p !== s.player || p.generation > 1) return [];
    var id = s.gold ? 'adrian' : s.jhook ? 'jessica' : s.song ? 'soyoung' : s.arslan ? 'arslan' : null;
    if (!id) return [];
    if (age == null) age = G.R.age();
    var stage = G.Img.heroAgeStage(p, age);
    if (id === 'arslan') {
      var base = 'portraits/story-player/arslan', suffix = half ? '_half' : '';
      var ageSuffix = stage === 'young' ? '' : stage === 'middle' ? '_thirties' : '_elderly';
      var beat = G.Arslan.currentBeat, keys = [];
      if (beat === 'f_eve' || beat === 'f_rome' || beat === 'f_bed') {
        keys.push(base + '_cardinal' + (stage === 'young' ? '' : '_thirties') + suffix);
      } else if (s.arslan.beats && s.arslan.beats.a4_crown != null) {
        keys.push(base + '_crown' + ageSuffix + suffix);
      }
      keys.push(base + ageSuffix + suffix);
      return keys.filter(G.Img.has);
    }
    // 아드리안은 젊은·중년·노년 모두 검은 외투의 전용 원화를 쓴다.
    if (id === 'adrian') {
      var adrian = 'portraits/story-player/' + (stage === 'young' ? 'adrian' : 'adrian_reference_' + (stage === 'elderly' ? 'elderly' : 'thirties')) + (half ? '_half' : '');
      return G.Img.has(adrian) ? [adrian] : [];
    }
    if (stage === 'young') return [];
    var key = 'portraits/story-player/' + id + (stage === 'elderly' ? '_elderly' : '_thirties') + (half ? '_half' : '');
    return G.Img.has(key) ? [key] : [];
  };
  SA.mate = function (id) {
    if (!G.Game || !G.Game.state || !G.Game.state.arslan) return null;
    if (id === 'little_prince') return 'portraits/npc/ar_LP';
    if (id === 'scheherazade') return 'portraits/npc/ar_SH';
    return null;
  };
  SA.speaker = function (mode, k) {
    var s = G.Game.state, key;
    if (mode === 'jhook' && k === 'JG' && s.date.y < 1553) key = 'portraits/npc/jh_JG_child';
    if (mode === 'gold' && k === 'JS') key = 'portraits/npc/gs_' + (s.gold && s.gold.act >= 15 ? 'JS99' : 'JS');
    if (mode === 'gold' && k === 'SY') key = 'portraits/story-player/soyoung_elderly';
    if (!key || !G.Img.has(key)) return null;
    return { name: k === 'JG' ? '제인 그레이' : k === 'JS' ? '제시카 후크' : '소영',
      rigId: 'npc:' + key, portrait: G.Art.withImg(G.Art.npcSpec(key, 'native', 'ne', 'f'), [key]), half: [key + '_half'] };
  };
  function galleryButton(host, title, label, shots, portraits) {
    var open = document.createElement('button'); open.className = 'btn small';
    open.textContent = label + ' ' + shots.length + (portraits ? '쌍' : '장');
    open.onclick = function () {
      var w = G.UI.window({ title: title + ' · ' + label, icon: 'scroll', width: 1050, html: '<div class="story-art-gallery"></div>', buttons: [{ label: '닫는다', value: null }] });
      var root = w.content || w.el, grid = root.querySelector('.story-art-gallery');
      shots.forEach(function (shot) {
        var b = document.createElement('button'); b.className = 'story-art-card';
        var im = document.createElement('img'); im.src = G.Img.src(shot.img); im.alt = shot.title; im.loading = 'lazy';
        var label = document.createElement('span'); label.textContent = shot.title;
        b.appendChild(im); b.appendChild(label); grid.appendChild(b);
        b.onclick = function () {
          var src = G.U.esc(G.Img.src(shot.img)), name = G.U.esc(shot.title);
          var html = portraits ? '<div class="story-portrait-pair"><img src="' + src + '" alt="' + name + ' 얼굴상"><img src="' + G.U.esc(G.Img.src(shot.img + '_half')) + '" alt="' + name + ' 무릎상"></div>'
            : '<img style="display:block;width:100%;height:auto" src="' + src + '" alt="' + name + '">';
          G.UI.window({ title: shot.title, icon: 'scroll', width: portraits ? 840 : 1180, html: html, buttons: [{ label: '닫는다', value: null }] });
        };
      });
    };
    host.appendChild(open);
  }
  SA.gallery = function (mode, host) {
    var d = G.STORY_ART[mode]; if (!d) return;
    galleryButton(host, d.title, '특별 원화', d.gallery, false);
    if (d.portraits) galleryButton(host, d.title, '인물 초상', d.portraits, true);
  };
})(window.G = window.G || {});
