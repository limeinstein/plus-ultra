/* 도시 요약 (G.CityInfo): 해도에서 도시를 누르면 보이는 정보.
   무엇을 알 수 있는지는 제독과 부하의 능력, 그리고 가 본 적이 있는지에 따라 다르다.
     · 국가·규모: 아는 도시면 늘
     · 지도자: 가 봤거나, 우리나라 도시거나, 역사학 1 이상, 또는 그 고장 말을 하며 웅변 2 이상
     · 특산물: 가 봤으면 다. 아니면 그 고장 말을 하고 회계 2면 다, 회계 1이면 두어 가지
     · 상업 번영도: 회계 2면 수치까지, 가 봤거나 회계 1이면 대략(말로)
     · 도시 기술력(조선 기술): 가 봤으면 정확히, 조선기술 2면 정확히, 1이면 어림
     · 도시 상태: 90일 안에 들렀으면 지금 상태, 아니면 마지막으로 들른 때만 (주인이 바뀐 일은 큰 소식이라 늘 안다) */
(function (G) {
  'use strict';
  var U = G.U, R = G.R;
  var CI = {};
  G.CityInfo = CI;
  function S() { return G.Game.state; }

  CI.SIZE = ['', '소도시', '중도시', '대도시'];
  CI.FRESH = 90;   // 이 날수 안에 들렀으면 지금 사정을 안다

  /** 그 특기를 가장 잘 아는 사람 (제독 또는 그 자리를 맡은 기함 참모) — "이름(특기 n)" 또는 null */
  CI.who = function (id) {
    var s = S(), best = s.player.sk[id] || 0, name = '제독';
    s.mates.forEach(function (m) {
      var d = G.MATE[m.id]; if (!d) return;
      var roles = G.ROLE_SKILLS[m.role];
      if (!roles || roles === 'all' || roles.indexOf(id) < 0) return;
      var lv = R.mateSkill(m, id); if (lv > best) { best = lv; name = d.name; }
    });
    return best ? name + ' (' + G.SKILL_BY_ID[id].name + ' ' + best + ')' : null;
  };

  /** 지도자: 이 도시에 궁전을 둔 후원자 → 같은 나라 수도의 군주 → 족장·통치자 */
  CI.leader = function (c) {
    var own = R.cityOwner(c), SP = G.Sponsor;
    var here = G.SPONSORS.filter(function (x) { return x.city === c.id && x.bld === 'palace' && SP.holder(x); })[0];
    // 조사한 나라별 지도자 (dominion.js): 군주 자리(king·pope)는 이 도시를 다스리는 나라의 자리일 때만 그 사람, 다른 나라가 차지했으면 그 나라 지도자
    if (G.Dominion && here && (here.type === 'king' || here.type === 'pope') && G.Dominion.SEAT[own] !== here.id) here = null;
    if (G.Dominion && (!here || G.Dominion.SEAT[own] === here.id) && (G.NATION_LEADERS[own] || G.Dominion.SEAT[own])) return G.Dominion.leader(own).text;
    if (here) return here.title + ' ' + SP.holder(here);
    var cap = G.SPONSORS.filter(function (x) { var cc = G.CITY_DATA[x.city]; return x.bld === 'palace' && (x.type === 'king' || x.type === 'pope') && cc && R.cityOwner(cc) === own && SP.holder(x); })[0];
    if (cap) return cap.title + ' ' + SP.holder(cap) + ' (' + G.CITY_DATA[cap.city].name + ')';
    return c.rel === 'N' ? own + '의 족장' : own + '의 통치자';
  };
  /** 상업 번영도 0~100: 도시 크기, 교역품 가짓수, 조합, 사업 투자, 시장 사건 */
  var EV_K = { '호경기': 12, '불경기': -12, '축제': 6, '풍작': 2, '대풍작': 4, '기근': -8, '대기근': -14, '전쟁': -10, '역병': -12, '노동력부족': -4, '대조선': 4 };
  CI.event = function (c) { var m = R.market(c.id); return m.ev && S().day <= m.evEnd ? m.ev : null; };
  CI.commerce = function (c) {
    var v = 12 + c.size * 16 + R.cityGoods(c).length * 3 + (c.flags.indexOf('G') >= 0 ? 8 : 0) + R.investLv(c.id) * 8;
    return U.clamp(v + (EV_K[CI.event(c)] || 0), 5, 100);
  };
  CI.commerceWord = function (v) { return v < 25 ? '쇠락' : v < 45 ? '보통' : v < 65 ? '활기' : v < 82 ? '번성' : '크게 번성'; };

  /** 해도에 쓰는 표식: {auto, sponsor, contract, home} */
  CI.flags = function (c, ref) {
    var s = S(), k = s.contract, sp = k ? G.SPONSOR[k.sponsor] : null;
    return {
      auto: ref != null && G.Routes && G.Routes.isOpen(ref, c.id),
      sponsor: G.SPONSORS.some(function (x) { return x.city === c.id && G.Sponsor.holder(x); }),
      contract: !!(sp && sp.city === c.id),
      home: s.player.home === c.id
    };
  };

  /** 요약: [{k: 항목, v: 값(HTML), src: 누가·어떻게 알았나, hint: 모를 때 알아내는 방법}] */
  CI.summary = function (c, ref) {
    var s = S(), rows = [];
    var here = s.loc.mode === 'city' && s.loc.city === c.id;
    var visited = here || !!(s.visited && s.visited[c.id]), last = here ? s.day : s.lastVisit && s.lastVisit[c.id];
    var fresh = last != null && s.day - last <= CI.FRESH;
    var speak = (c.lang != null && R.cityLang(c).lv >= 1) || c.lang == null;   // 포르투갈어가 통하는 항구 (js/systems/treaty.js)
    var own = R.isHomeNation(c), owner = R.cityOwner(c);
    var acct = R.skill('acct'), ship = R.skill('ship'), hist = R.skill('hist'), speech = R.skill('speech');
    function row(k, v, src, hint) { rows.push({ k: k, v: v, src: src || '', hint: hint || '' }); }
    // 국가·규모
    var orig = (G.Dominion && G.Dominion.first(c)) || c.nation, since = G.Dominion ? G.Dominion.history(c).filter(function (h) { return h.y <= s.date.y; }).pop() : null;
    row('국가', U.esc(owner) + (since && since.y > 1480 ? ' <small class="muted">' + since.y + '년부터' + (owner !== orig ? ' · 원래 ' + U.esc(orig) : '') + '</small>' : owner !== orig ? ' <small class="muted">(원래 ' + U.esc(orig) + ')</small>' : ''));
    row('도시 규모', (G.CityIcon ? G.CityIcon.label(c) : CI.SIZE[c.size]) + ' · ' + (c.port ? '항구' : '내륙 도시') + (R.facilities(c).shipyard ? ' · 조선소' : ''));
    if (G.CityIcon) row('도시 양식', G.CityIcon.cultureName(c));
    // 지도자
    if (visited || own || hist >= 1 || (speak && speech >= 2)) row('지도자', U.esc(CI.leader(c)), visited ? '가 봄' : own ? '우리나라' : hist >= 1 ? CI.who('hist') : CI.who('speech'));
    else row('지도자', '?', '', '가 보거나 역사학을 아는 사람(또는 그 고장 말과 웅변 2)이 있으면 압니다');
    // 도시 상태
    var st = [], ev = CI.event(c), chk = G.Scenes.city.entryCheck ? G.Scenes.city.entryCheck(c) : null;
    if (owner !== orig) st.push(owner + '의 손에 넘어감');
    if (fresh || visited) {
      if (chk) st.push({ wanted: '수배 중이라 들어갈 수 없음', holy: '이교도 입항 금지', islam: '이교도 출입 금지 — 잠입이나 교섭', closed: '외국인 입항 금지', treaty: '조약으로 입항 금지' }[chk.reason] + (s.flags['pass' + c.id] ? ' (예전 통행 허가는 기한이 지남)' : ''));   // 잠입 G.Sneak
    }
    if (fresh) {
      st.push(ev ? '시장 사건 「' + ev + '」 (앞으로 ' + Math.max(0, R.market(c.id).evEnd - s.day) + '일쯤)' : '평온');
      row('도시 상태', st.join(' · '), s.day - last <= 0 ? '지금 이 도시에 있음' : (s.day - last) + '일 전에 들름');
    } else if (visited) row('도시 상태', (st.length ? st.join(' · ') + ' · ' : '') + '<span class="muted">요즘 사정은 모름</span>', '마지막으로 들른 지 ' + (last != null ? (s.day - last) + '일' : '오래'), CI.FRESH + '일 안에 들르면 지금 사정을 압니다');
    else row('도시 상태', st.length ? st.join(' · ') : '?', '', '가 보면 압니다');
    // 특산물
    var goods = R.cityGoods(c).map(function (g) { return (G.goodDot ? G.goodDot(g) + G.GOOD[g].name : G.GOOD[g].name) + (R.isRelay(c, g) ? '<small class="muted">(중계)</small>' : ''); });
    if (visited) row('특산물', goods.join(' · '), '가 봄');
    else if (speak && acct >= 2) row('특산물', goods.join(' · '), CI.who('acct') + ' — 상인들에게 들음');
    else if (speak && acct >= 1) row('특산물', goods.slice(0, 2).join(' · ') + ' <span class="muted">…</span>', CI.who('acct'), '회계 2면 다 압니다');
    else row('특산물', '?', '', speak ? '가 보거나 회계를 아는 사람이 있으면 압니다' : '그 고장 말을 아는 사람이 없어 들은 것이 없습니다');
    // 상업 번영도
    var cm = CI.commerce(c), bar = '<span class="cibar"><i style="width:' + cm + '%"></i></span>';
    if (acct >= 2 && (visited || speak)) row('상업 번영도', bar + ' <b>' + cm + '</b> · ' + CI.commerceWord(cm) + (R.investLv(c.id) ? ' <small class="muted">(사업 투자 ' + R.investLv(c.id) + '등급)</small>' : ''), CI.who('acct'));
    else if (visited || (speak && acct >= 1)) row('상업 번영도', CI.commerceWord(cm) + ' <span class="muted">(대략)</span>', visited ? '가 봄' : CI.who('acct'), '회계 2면 수치까지 압니다');
    else row('상업 번영도', '?', '', '가 보거나 회계를 아는 사람이 있으면 압니다');
    // 도시 기술력
    var yard = R.facilities(c).shipyard, tech = G.Ships ? G.Ships.tech(c) : null;
    if (!c.port) row('도시 기술력', '<span class="muted">배를 짓지 않는 내륙 도시</span>');
    else if (!yard && (visited || ship >= 1)) row('도시 기술력', '조선소 없음', visited ? '가 봄' : CI.who('ship'));
    else if (visited || ship >= 2) row('도시 기술력', '조선 기술 <b>' + tech + '등급</b> <small class="muted">(' + G.SHIP_LV[tech] + '까지)</small>' + (G.Ships.techBonus(c) ? ' <small class="muted">· 기술 투자 +' + G.Ships.techBonus(c) + '</small>' : ''), visited ? '가 봄' : CI.who('ship'));
    else if (ship >= 1) row('도시 기술력', '조선 기술 ' + Math.max(1, tech - 1) + '~' + Math.min(5, tech + 1) + '등급쯤', CI.who('ship'), '조선기술 2면 정확히 압니다');
    else row('도시 기술력', '?', '', '가 보거나 조선기술을 아는 사람이 있으면 압니다');
    // 항로
    if (c.port && ref != null && ref !== c.id && G.Routes) {
      var open = G.Routes.isOpen(ref, c.id);
      row('항로', open ? '<b>자동항해 가능</b> (' + G.CITY_DATA[ref].name + '에서)' : G.Routes.label(ref, c.id) + ' — 곧장 침로만');
    }
    // 후원자·계약
    var sps = G.SPONSORS.filter(function (x) { return x.city === c.id && G.Sponsor.holder(x); });
    if (sps.length) row('후원자', sps.map(function (x) { return x.title + (visited || own ? ' ' + G.Sponsor.holder(x) : ''); }).join(' · '));
    var k = s.contract;
    if (k && G.SPONSOR[k.sponsor] && G.SPONSOR[k.sponsor].city === c.id) row(k.small ? '작은 계약' : '탐험 계약', '「' + G.Errand.name(k) + '」 — 여기서 ' + G.Sponsor.holderName(G.SPONSOR[k.sponsor]) + '에게 보고');
    if (s.player.home === c.id) row('고향', '제독의 모항');
    return rows;
  };

  /** 요약 패널 HTML */
  CI.html = function (c, ref) {
    var s = S(), f = CI.flags(c, ref), visited = !!(s.visited && s.visited[c.id]) || (s.loc.mode === 'city' && s.loc.city === c.id);
    var tags = (f.home ? '<span class="citag home">고향</span>' : '') + (f.auto ? '<span class="citag auto">자동항해</span>' : '') + (f.sponsor ? '<span class="citag sp">후원자</span>' : '') + (f.contract ? '<span class="citag ct">계약</span>' : '') + (visited ? '' : '<span class="citag new">가 본 적 없음</span>');
    return '<div class="ci-h"><b>' + U.esc(c.name) + '</b><span class="ci-sub">' + G.REGIONS[c.region] + '</span></div><div class="ci-tags">' + tags + '</div>' +
      '<table class="ci-tbl">' + CI.summary(c, ref).map(function (r) {
        return '<tr><th>' + r.k + '</th><td>' + r.v + (r.src ? '<div class="ci-src">' + U.esc(r.src) + '</div>' : '') + (r.hint ? '<div class="ci-hint">' + U.esc(r.hint) + '</div>' : '') + '</td></tr>';
      }).join('') + '</table>';
  };
})(window.G = window.G || {});
