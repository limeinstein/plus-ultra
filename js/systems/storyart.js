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
    var id = s.gold ? 'adrian' : s.jhook ? 'jessica' : s.song ? 'soyoung' : null;
    if (!id) return [];
    if (age == null) age = G.R.age();
    var stage = G.Img.heroAgeStage(p, age);
    // 아드리안은 젊은·중년·노년 모두 검은 외투의 전용 원화를 쓴다.
    if (id === 'adrian') {
      var adrian = 'portraits/story-player/' + (stage === 'young' ? 'adrian' : 'adrian_reference_' + (stage === 'elderly' ? 'elderly' : 'thirties')) + (half ? '_half' : '');
      return G.Img.has(adrian) ? [adrian] : [];
    }
    if (stage === 'young') return [];
    var key = 'portraits/story-player/' + id + (stage === 'elderly' ? '_elderly' : '_thirties') + (half ? '_half' : '');
    return G.Img.has(key) ? [key] : [];
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
  SA.gallery = function (mode, host) {
    var d = G.STORY_ART[mode]; if (!d) return;
    var open = document.createElement('button'); open.className = 'btn small';
    open.textContent = '특별 원화 ' + d.gallery.length + '장';
    open.onclick = function () {
      var w = G.UI.window({ title: d.title + ' · 특별 원화', icon: 'scroll', width: 1050, html: '<div class="story-art-gallery"></div>', buttons: [{ label: '닫는다', value: null }] });
      var root = w.content || w.el, grid = root.querySelector('.story-art-gallery');
      d.gallery.forEach(function (shot) {
        var b = document.createElement('button'); b.className = 'story-art-card';
        var im = document.createElement('img'); im.src = G.Img.src(shot.img); im.alt = shot.title; im.loading = 'lazy';
        var label = document.createElement('span'); label.textContent = shot.title;
        b.appendChild(im); b.appendChild(label); grid.appendChild(b);
        b.onclick = function () { G.UI.window({ title: shot.title, icon: 'scroll', width: 1180, html: '<img style="display:block;width:100%;height:auto" src="' + G.U.esc(G.Img.src(shot.img)) + '" alt="' + G.U.esc(shot.title) + '">', buttons: [{ label: '닫는다', value: null }] }); };
      });
    };
    host.appendChild(open);
  };
})(window.G = window.G || {});
