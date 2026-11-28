/* 실제 후견인 건물의 거리·알현실 그림을 같은 장소에서 고른다. */
(function (G) {
  'use strict';
  var H = G.CourtHistory;
  var court = {
    pt_king:'pt', es_crown:'es', es_aragon:'ar', en_king:'en', sc_king:'sc', fr_king:'fr',
    nl_stad:'nl', it_pope:'rome', it_doge:'venice', it_genoa:'genoa', it_medici:'it',
    it_moro:'it', savoy_duke:'it', it_naples:'it', it_sicily:'it',
    at_archduke:'de', de_brandenburg:'de', de_prussia:'de', bo_king:'east', hu_king:'east',
    pl_king:'east', dk_king:'north', se_king:'north', ru_prince:'ru', ot_sultan:'ot', eg_sultan:'eg',
    jp_emperor:'jp_palace', jp_tenka:'jp_house', cn_ming:'cn', cn_shun:'cn', sm_nanjing:'southming',
    sm_fuzhou:'southming', sm_guangzhou:'southming', sm_yongli:'southming',
    en_joint_mary:'en', sc_joint_mary:'sc', ru_joint_peter:'ru', pl_anna:'east',
    hu_junior:'east', bo_junior:'east', hu_bethlen:'eastern_home'
  };
  var korean = {
    kr_seja:'kr_east', kr_women:'kr_residence', kr_inhyeon:'kr_residence',
    kr_sugwang:'kr_office', kr_heogyun:'kr_office', kr_yunseondo:'kr_school', kr_gyeyang:'kr_residence',
    kr_heojun:'kr_clinic', kr_heoim:'kr_clinic', kr_hongsuneon:'kr_interpret',
    kr_janghyeon:'kr_interpret', kr_kimjinam:'kr_interpret'
  };
  var koreanRoles = {official:'kr_office', gov:'kr_office', merchant:'kr_market', scholar:'kr_school', noble:'kr_residence'};
  var civicKind = {official:'guild', gov:'guild', merchant:'trade', scholar:'library', priest:'church', pope:'palace', king:'palace'};
  var northernPorts = [24,57,64,66,67,329,333];
  var italianCities = [26,27,28,29,30,33,34,36];
  var centralCities = [53,54,57,62,330,331,333];
  var places = {
    kr_ryu:'류성룡의 집무처', kr_wonik:'이원익의 접견처', kr_kimyuk:'김육의 집무처',
    kr_heojun:'허준의 진료처', kr_heoim:'허임의 진료처', kr_hongsuneon:'홍순언의 통역 서재',
    kr_janghyeon:'장현의 통역 서재', kr_kimjinam:'김지남의 통역 서재',
    kr_gyeyang:'영양 장계향의 살림집', kr_yunseondo:'해남 윤선도의 서재'
  };
  Object.keys(places).forEach(function (id) { G.SPONSOR[id].place = places[id]; });

  function building(sp, c) {
    if (c.style === 'kr') {
      if (sp.id === 'kr_king') return sp.place === '정릉동 행궁' || sp.place === '피란 조정 연락처' ? 'kr_temp' : 'kr_throne';
      return korean[sp.id] || koreanRoles[sp.type];
    }
    if (sp.id === 'de_emperor') return c.id === 53 ? 'east' : 'de';
    if (sp.id === 'cn_qing') return c.id === 188 ? 'cn' : 'manchu';
    if (sp.id === 'sm_yongli' && c.id === 158) return null;
    if (sp.id === 'jp_shogun') return c.id === 193 || c.id === 297 ? 'jp_castle' : 'jp_house';
    if (sp.id === 'en_king' && G.CourtHistory.civilOffice(sp)) return 'western_office';
    if (sp.id === 'sc_king' && G.CourtHistory.civilOffice(sp)) return 'western_office';
    if (court[sp.id]) return court[sp.id];
    if (c.id === 79 && (sp.type === 'noble' || sp.type === 'gov')) return 'eg';
    if (sp.type === 'priest') return null;
    if (sp.type === 'official' || sp.type === 'gov') {
      if (northernPorts.indexOf(c.id) !== -1) return 'council_north';
      if ([0,5,7,14,38,42,327,328].indexOf(c.id) !== -1) return 'western_office';
    }
    if (sp.type === 'noble' || sp.type === 'official' || sp.type === 'gov') {
      if (italianCities.indexOf(c.id) !== -1) return 'palazzo_home';
      if (centralCities.indexOf(c.id) !== -1) return 'eastern_home';
      if (c.id === 24 || c.id === 329) return 'dutch_home';
      if (c.id === 112) return 'ot_house';
    }
    if ((c.style === 'cn' || c.id === 188) && sp.type !== 'merchant') return 'cn_house';
    if (c.style === 'jp' && sp.type !== 'merchant') return 'jp_house';
    return null;
  }

  H.venue = function (kind, c, variant) {
    if (!c || (kind !== 'palace' && kind !== 'mansion') || !G.SPONSOR) return null;
    var sp = variant && G.SPONSOR[variant];
    // 한 궁궐뿐인 도시의 거리 메뉴는 후원자 번호를 생략하기도 한다.
    if (!variant && kind === 'palace' && G.Sponsor && G.Game && G.Game.state) {
      var local = G.SPONSORS.filter(function (s) { return s.city === c.id && s.bld === kind; });
      sp = local.find(G.Sponsor.present) || local.find(G.Sponsor.caretaker);
    }
    if (!sp || sp.city !== c.id || sp.bld !== kind) return null;
    var role = sp.id === 'sm_yongli' && c.id === 158 ? 'mansion' : civicKind[sp.type] || kind;
    return { profile:building(sp, c), role:role };
  };
})(window.G = window.G || {});
