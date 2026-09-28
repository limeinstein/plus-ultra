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

  // ---------------------------------------------------------------- 실제 자료 (tools/heritage → G.HERITAGE)
  function link(url, text) { return url ? '<a href="' + U.esc(url) + '" target="_blank" rel="noopener">' + U.esc(text) + '</a>' : U.esc(text); }
  /** 출처 한 줄: 설명·자료·사진이 어디서 왔는지 (재사용 조건 표시) */
  SC.realCredit = function (H) {
    if (!H) return '';
    var p = [];
    if (H.whc) p.push(link(H.whc.url, 'UNESCO 세계유산센터') + ' (CC BY-SA 3.0 IGO)');
    if (H.wiki) p.push(link(H.wiki.url, '위키백과') + ' (CC BY-SA 4.0)');
    if (H.bio) p.push(link(H.bio.url, 'GBIF.org'));
    if (H.sea) p.push(link(H.sea.url, 'OBIS'));
    if (H.obj) p.push(link(H.obj.url, H.obj.museum) + ' (CC0)');
    var ph = H.photo ? '사진: ' + link(H.photo.url, [H.photo.by, H.photo.src].filter(Boolean).join(' · ') || '출처') + (H.photo.lic ? ' (' + U.esc(H.photo.lic) + ')' : '') : '';
    if (!p.length && !ph) return '';
    return '<div class="real-credit">' + (p.length ? '자료: ' + p.join(' · ') + (H.desc || H.record ? ' — 한국어 글은 이를 바탕으로 새로 씀' : '') : '') + (p.length && ph ? '<br>' : '') + ph + '</div>';
  };
  /** 발견물의 실제 모습: 세계유산 등재·생물 분류·소장품 — 발견 카드와 수첩에서 쓴다 */
  SC.realInfo = function (H) {
    if (!H) return '';
    var tags = [], out = '';
    if (H.whc) tags.push('<span class="tag whc">UNESCO 세계유산' + (H.whc.year ? ' · ' + H.whc.year + '년 등재' : '') + '</span>' + (H.whc.crit ? '<span class="tag">기준 ' + U.esc(H.whc.crit) + '</span>' : '') + (H.whc.danger ? '<span class="tag warn-text">위험에 처한 유산</span>' : ''));
    if (H.bio) tags.push('<span class="tag"><i>' + U.esc(H.bio.sci) + '</i></span>' + (H.bio.family ? '<span class="tag">' + U.esc(H.bio.family) + '</span>' : '') + (H.bio.records ? '<span class="tag">관찰 기록 ' + U.num(H.bio.records) + '건</span>' : '') + (H.bio.extinct ? '<span class="tag warn-text">멸종</span>' : ''));
    if (H.sea) tags.push('<span class="tag">바다 기록 ' + U.num(H.sea.records || 0) + '건' + (H.sea.depth ? ' · 깊이 ' + H.sea.depth[0] + '–' + H.sea.depth[2] + 'm' : '') + '</span>');
    if (H.obj) tags.push('<span class="tag">' + U.esc(H.obj.museum) + ' 소장</span>');
    if (H.legend) tags.push('<span class="tag">전설</span>');
    if (tags.length) out += '<div class="center real-tags">' + tags.join(' ') + '</div>';
    if (H.record) out += '<div class="real-record"><b>' + (H.whc ? '세계유산 기록' : H.legend ? '전설의 배경' : '오늘날의 기록') + '</b> ' + U.esc(H.record) + '</div>';
    if (H.lore && H.lore.length) out += H.lore.map(function (t) { return '<div class="real-lore">' + U.esc(t) + '</div>'; }).join('');
    if (H.obj && H.obj.title) out += '<div class="real-obj">' + link(H.obj.url, H.obj.title) + [H.obj.date, H.obj.culture, H.obj.no ? '소장 번호 ' + H.obj.no : ''].filter(Boolean).map(function (x) { return ' · ' + U.esc(x); }).join('') + '</div>';
    return out + SC.realCredit(H);
  };

  /** big discovery announcement card */
  /** 발견 그림 요소. 유적 복원 GIF는 움직임을 살리고, 나머지는 기존 Canvas 교체 체계를 쓴다. */
  SC.discoveryPicture = function (d, chain) {
    chain = chain || G.Img.chain.discovery(d);
    var picked = G.Img.pick(chain), file = picked && G.Img.file(picked), art;
    if (d.cat === 'ruin' && file && /\.gif(?:$|[?#])/i.test(file)) {
      art = document.createElement('img');
      art.className = 'disc-build-gif'; art.src = G.Img.src(picked); art.alt = d.name + ' 7단계 복원과 360도 상공 회전';
      return art;
    }
    return G.Img.make(chain, 720, 320, function () { return A.discoveryArt(d, 720, 320); });
  };
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
      list.map(function (r) { var ob = r.real && r.real.obj; return '<div class="rs-item" data-relic="' + r.id + '"><b>' + U.esc(r.name) + '</b><small>' + where(r) + '</small>' + (ob ? '<small class="rs-museum">' + U.esc(ob.museum) + '</small>' : '') + '</div>'; }).join('') + '</div>' +
      (relics ? '<div class="rs-note">후원자에게 보고하면 증거로 바치고, 항구에서 스스로 발표하면 제독의 것이 됩니다.</div>' : '') + '</div>';
  };
  SC.discoveryCard = async function (d, fame, relics) {
    var chain = G.Img.chain.discovery(d);
    if (G.Img.pick(chain)) await G.Img.preload([chain], 1500);
    // 애니메이션 GIF를 Canvas에 그리면 한 프레임만 남는다. 유적은 원본 <img>로 올린다.
    var art = SC.discoveryPicture(d, chain);
    var html = '<div class="disc-card"><div class="disc-head">DISCOVERY</div><div class="art"></div>' +
      '<div class="dname">' + U.esc(d.name) + '</div>' +
      '<div class="center"><span class="tag">' + (G.DISC_CATS[d.cat] || '') + '</span> <span class="tag">' + (d.how === 'trade' ? '교역품' : G.REGIONS[d.reg] || '') + '</span> <span class="tag">' + (G.Disc.valueTag ? G.Disc.valueTag(d) : '가치 ' + U.num(d.val)) + '</span></div>' +
      '<div class="desc">' + U.esc(d.desc) + '</div>' + SC.realInfo(d.real) +
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
    if (G.Wander) G.Wander.apply();      // 철새 — 옛 저장에는 처음 불러올 때 생긴다
    var s = G.Game.state;
    if (!s.settings) s.settings = { diff: 'normal', speed: 1 };
    if (s.fleet && s.fleet.mat == null) s.fleet.mat = (G.BALANCE && G.BALANCE.matStart) || 10;   // 자재가 생기기 전 저장 파일
    UI.fade(function () {
      if (s.loc.mode === 'sea') G.Game.go('sea', { resume: true });
      else if (s.loc.mode === 'land' && G.Scenes.land) G.Game.go('land', { resume: true });
      else G.Game.go('city', { cityId: s.loc.city, load: true });
    });
  };
})(window.G = window.G || {});
