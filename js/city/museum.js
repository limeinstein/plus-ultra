/* 왕립 박물관·왕립 동물원 — 왕명 「박물관 건립」·「동물원 건설」을 마치면 그 군주의 도시에 선다 (규칙: js/systems/court.js).
   들어가면 제독이 바친 발견 유물·명작(박물관)이나 신기한 동물(동물원)을 그림과 함께 볼 수 있다.
   건물 그림: exteriors/museum·zoo, interiors/museum·zoo가 있으면 그것, 없으면 도서관·저택 그림을 빌린다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city;
  function S() { return G.Game.state; }
  function recOf(kind, c, realmId) { return (G.Court.buildingsAt(c.id).filter(function (x) { return x.kind === kind && x.realm === realmId; })[0] || {}).rec || null; }
  function realmName(id) { var r = G.COURT.realms[id]; return r ? r.name : ''; }
  function curator(c, kind) { return C.npc(kind === 'zoo' ? 'zookeeper' : 'curator', kind === 'zoo' ? '사육사' : '관장'); }

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
    await C.say(curator(c, 'museum'), rec ? '어서 오십시오, ' + p.name + ' 제독. 이 박물관은 제독께서 바치신 보물로 문을 열었습니다. 오늘도 구경하러 온 사람들로 붐빕니다.' : '어서 오십시오.');
  };
  MU.menu = function (c, arg) {
    return [{ label: '전시실을 둘러본다', icon: 'bust', onClick: function () { return MU.show(c, arg); } }];
  };
  MU.show = function (c, arg) {
    var rec = recOf('museum', c, arg); if (!rec) return Promise.resolve();
    var cards = rec.items.map(function (x) {
      var who = x.mw && G.MATE[x.by] ? G.MATE[x.by].name : '';
      var d = x.disc && G.DISC[x.disc];
      return { src: G.Court.exhibitSrc(x), frame: !!x.mw, icon: x.mw ? (x.wk === 'sculpt' ? 'bust' : 'palette') : 'chest', name: x.name,
        meta: x.mw ? (x.wk === 'sculpt' ? '조각' : '그림') + ' · ' + who + (x.y ? ' · ' + x.y + '년' : '') : '발견 유물' + (d ? ' · ' + d.name : ''), desc: x.desc };
    });
    return gallery(MU.title(c, arg), rec.y + '년, ' + U.esc(S().player.name) + ' 제독이 바친 ' + rec.items.length + '점으로 문을 열었다.', cards);
  };

  // ================================================================ 왕립 동물원
  var ZO = { title: function (c, arg) { return realmName(arg) ? realmName(arg) + ' 왕립 동물원' : '왕립 동물원'; }, icon: 'horse',
    paint: function () { return G.Img && G.Img.has('interiors/zoo') ? 'zoo' : 'mansion'; } };
  C.B.zoo = ZO;
  ZO.enter = async function (c, arg) {
    var p = S().player;
    await C.say(curator(c, 'zoo'), '어서 오십시오, ' + p.name + ' 제독! 제독께서 알려 주신 짐승들이 잘 지내고 있습니다. 아이들이 매일 구경하러 옵니다.');
  };
  ZO.menu = function (c, arg) {
    return [{ label: '동물들을 둘러본다', icon: 'horse', onClick: function () { return ZO.show(c, arg); } }];
  };
  ZO.show = function (c, arg) {
    var rec = recOf('zoo', c, arg); if (!rec) return Promise.resolve();
    var list = G.Court.zooAnimalsOf(rec);
    var cards = list.map(function (d) {
      var k = G.Img && G.Img.pick ? G.Img.pick(G.Img.chain.discovery(d)) : null;
      return { src: k ? G.Img.src(k) : null, icon: 'horse', name: d.name, meta: '신기한 동물 · ' + (d.reg != null && G.REGIONS[d.reg] ? G.REGIONS[d.reg] : '먼 땅'), desc: d.desc || '' };
    });
    return gallery(ZO.title(c, arg), (rec.y || '') + '년, ' + U.esc(S().player.name) + ' 제독이 찾아낸 ' + cards.length + '종의 짐승으로 문을 열었다.', cards);
  };
})(window.G = window.G || {});
