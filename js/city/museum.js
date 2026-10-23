/* 왕립 박물관·왕립 미술관·왕립 동물원 — 해당 건립 왕명을 마치면 유럽 군주의 도시에 선다 (규칙: js/systems/court.js).
   들어가면 제독이 바친 발견 유물·명작(박물관)이나 신기한 동물(동물원)을 그림과 함께 볼 수 있다.
   건물 그림: exteriors/museum·zoo, interiors/museum·zoo가 있으면 그것, 없으면 도서관·저택 그림을 빌린다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city, A = G.Art;
  function S() { return G.Game.state; }
  function recOf(kind, c, realmId) { return (G.Court.buildingsAt(c.id).filter(function (x) { return x.kind === kind && x.realm === realmId; })[0] || {}).rec || null; }
  function realmName(id) { var r = G.COURT.realms[id]; return r ? r.name : ''; }
  var MANAGER_ROLE = { zoo: 'maid', museum: 'scholar', gallery: 'official' };
  var MANAGER_TITLE = { zoo: '사육사', museum: '박물관 관장', gallery: '미술관장' };
  // 생성 원화의 성별을 보존한다. 동물원·박물관은 모두 여성, 미술관은 지역마다 다르다.
  var GALLERY_GENDER = { ib: 'f', ne: 'm', it: 'f', gr: 'm', ru: 'f', is: 'm', pe: 'f', af: 'm', sw: 'f', in: 'm', se: 'f', cn: 'm', kr: 'f', jp: 'm', az: 'f', an: 'm', co: 'm', tr: 'f', st: 'm', na: 'm' };
  /** 지역 복식과 건물 성격이 함께 드러나는 전용 관리자. 그림이 없으면 같은 지역의 역할 NPC를 쓴다. */
  function curator(c, kind) {
    var role = MANAGER_ROLE[kind], style = G.Img.folkStyle(c), key = 'portraits/building-managers/' + style + '/' + kind;
    var who = C.npc(kind + '_manager', MANAGER_TITLE[kind]);
    who.portrait = A.withImg(A.npcSpec('building-manager:' + c.id + ':' + kind, role, style, kind === 'gallery' ? GALLERY_GENDER[style] : 'f'),
      [key, 'portraits/npc-roles/' + style + '/' + role]);
    who.half = [key + '_half', 'portraits/npc-roles/' + style + '/' + role + '_half'];
    return who;
  }
  /** 「기증한다」 메뉴 — 지금 기증할 수 있는 수를 함께 보인다 (규칙: G.Court.donate, js/systems/court.js) */
  function donateItem(kind, c, arg) {
    var n = G.Court.donatable ? G.Court.donatable(kind).length : 0;
    return { label: kind === 'zoo' ? '새로 찾은 동물을 기증한다' : kind === 'gallery' ? '명작을 기증한다' : '유물·명작을 기증한다', icon: kind === 'zoo' ? 'horse' : kind === 'gallery' ? 'palette' : 'chest',
      sub: n ? '기증할 수 있는 것 ' + n + (kind === 'zoo' ? '종' : '점') : '지금 기증할 것이 없다', dim: !n,
      onClick: function () { return G.Court.donate(kind, arg, curator(c, kind)); } };
  }

  /** 전시실: 카드 여러 장 (그림 · 이름 · 풀이) */
  function gallery(title, sub, cards) {
    var html = '<div class="mu-sub muted">' + sub + '</div><div class="mu-grid">' + cards.map(function (x) {
      return '<div class="mu-card"><div class="mu-pic' + (x.frame ? ' frame' : '') + '">' + (x.src ? '<img alt="" src="' + x.src + '">' : G.icon(x.icon || 'chest')) + '</div>' +
        '<div class="mu-name">' + U.esc(x.name) + '</div><div class="mu-meta">' + U.esc(x.meta || '') + '</div><div class="mu-desc">' + U.esc(x.desc || '') + '</div></div>';
    }).join('') + '</div>';
    var win = UI.window({ title: title, icon: 'bust', width: 1040, html: html, buttons: [{ label: '나온다', value: true, cls: 'navy' }] });
    return win.result;
  }

  // ================================================================ 왕립 박물관
  var MU = { title: function (c, arg) { return realmName(arg) ? realmName(arg) + ' 왕립 박물관' : '왕립 박물관'; }, icon: 'bust',
    paint: function () { return G.Img && G.Img.has('interiors/museum') ? 'museum' : 'library'; } };
  C.B.museum = MU;
  MU.enter = async function (c, arg) {
    var rec = recOf('museum', c, arg), p = S().player;
    await C.say(curator(c, 'museum'), rec ? '늦지는 않으셨군요, ' + p.name + ' 제독. 보물은 제가 빠짐없이 정리해 두었습니다. 제독을 기다린 건 아니고, 전시 기록을 다시 확인하던 참이었습니다.' : '조용히 관람해 주십시오. 딱히 제독을 기다린 것은 아닙니다.');
  };
  MU.menu = function (c, arg) {
    return [{ label: '전시실을 둘러본다', icon: 'bust', onClick: function () { return MU.show(c, arg); } }, donateItem('museum', c, arg)];
  };
  MU.show = function (c, arg) {
    var rec = recOf('museum', c, arg); if (!rec) return Promise.resolve();
    var cards = rec.items.map(function (x) {
      var who = x.mw && G.MATE[x.by] ? G.MATE[x.by].name : '';
      var d = x.disc && G.DISC[x.disc];
      return { src: G.Court.exhibitSrc(x), frame: !!x.mw, icon: x.mw ? (x.wk === 'sculpt' ? 'bust' : 'palette') : 'chest', name: x.name,
        meta: x.mw ? (x.wk === 'sculpt' ? '조각' : '그림') + ' · ' + who + (x.y ? ' · ' + x.y + '년' : '') : '발견 유물' + (d ? ' · ' + d.name : ''), desc: x.desc };
    });
    return gallery(MU.title(c, arg), rec.y + '년, ' + U.esc(S().player.name) + ' 제독이 바친 ' + G.Court.recNote(rec, rec.items.length, '점') + '.', cards);
  };

  // ================================================================ 왕립 미술관
  var GA = { title: function (c, arg) { return realmName(arg) ? realmName(arg) + ' 왕립 미술관' : '왕립 미술관'; }, icon: 'palette',
    paint: function () { return G.Img && G.Img.has('interiors/gallery') ? 'gallery' : 'library'; } };
  C.B.gallery = GA;
  GA.enter = async function (c, arg) {
    var rec = recOf('gallery', c, arg), p = S().player;
    await C.say(curator(c, 'gallery'), rec ? p.name + ' 제독, 작품과 액자의 간격은 손가락 두 마디로 맞췄습니다. 제독께서 바치신 명작은 제가 정한 순서대로만 관람해 주십시오.' : '전시실에서는 정해진 동선과 간격을 지켜 주십시오.');
  };
  GA.menu = function (c, arg) {
    return [{ label: '작품 전시실을 둘러본다', icon: 'palette', onClick: function () { return GA.show(c, arg); } }, donateItem('gallery', c, arg)];
  };
  GA.show = function (c, arg) {
    var rec = recOf('gallery', c, arg); if (!rec) return Promise.resolve();
    var cards = rec.items.map(function (x) {
      var who = G.MATE[x.by] ? G.MATE[x.by].name : '';
      return { src: G.Court.exhibitSrc(x), frame: x.wk !== 'sculpt', icon: x.wk === 'sculpt' ? 'bust' : 'palette', name: x.name,
        meta: (x.wk === 'sculpt' ? '조각' : '그림') + ' · ' + who + (x.y ? ' · ' + x.y + '년' : ''), desc: x.desc };
    });
    return gallery(GA.title(c, arg), rec.y + '년, ' + U.esc(S().player.name) + ' 제독이 바친 명작 ' + G.Court.recNote(rec, rec.items.length, '점') + '.', cards);
  };

  // ================================================================ 왕립 동물원
  var ZO = { title: function (c, arg) { return realmName(arg) ? realmName(arg) + ' 왕립 동물원' : '왕립 동물원'; }, icon: 'horse',
    paint: function () { return G.Img && G.Img.has('interiors/zoo') ? 'zoo' : 'mansion'; } };
  C.B.zoo = ZO;
  ZO.enter = async function (c, arg) {
    var p = S().player;
    await C.say(curator(c, 'zoo'), '어서 오세요, ' + p.name + ' 제독! 저, 오늘도 새벽부터 먹이를 챙겼어요. 제독께서 알려 주신 짐승들이 저를 알아보는 것 같아요! 아이들도 매일 구경하러 와요.');
  };
  ZO.menu = function (c, arg) {
    return [{ label: '동물들을 둘러본다', icon: 'horse', onClick: function () { return ZO.show(c, arg); } }, donateItem('zoo', c, arg)];
  };
  ZO.show = function (c, arg) {
    var rec = recOf('zoo', c, arg); if (!rec) return Promise.resolve();
    var list = G.Court.zooAnimalsOf(rec);
    var cards = list.map(function (d) {
      var k = G.Img && G.Img.pick ? G.Img.pick(G.Img.chain.discovery(d)) : null;
      return { src: k ? G.Img.src(k) : null, icon: 'horse', name: d.name, meta: '신기한 동물 · ' + (d.reg != null && G.REGIONS[d.reg] ? (G.Disc && G.Disc.regName ? G.Disc.regName(d) : G.REGIONS[d.reg]) : '먼 땅'), desc: d.desc || '' };
    });
    return gallery(ZO.title(c, arg), (rec.y || '') + '년, ' + U.esc(S().player.name) + ' 제독이 찾아낸 짐승 ' + G.Court.recNote(rec, cards.length, '종') + '.', cards);
  };
})(window.G = window.G || {});
