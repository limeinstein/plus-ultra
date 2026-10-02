/* 도시를 다스리는 나라와 그 나라의 지도자 (G.Dominion)
   자료: js/data/dominion.js (tools/dominion_build.py가 웹 조사 자료 tools/dominion/에서 만든다)
   - G.DOMINION[도시] = [[해, 나라, 달?] …] : 1480(또는 세워진 해)부터 1900년까지. 게임 날짜에 맞는 나라가 그 도시의 주인(R.cityOwner)
   - G.NATION_LEADERS[나라] = [[즉위 해, 물러난 해, 이름] …], G.NATION_TITLES[나라] = 칭호
   - 달이 바뀌면 그 달에 주인이 바뀐 도시를 소식으로 알린다(역사 사건 people.js HISTORY가 같은 달에 이미 알린 도시는 빼고). */
(function (G) {
  'use strict';
  var U = G.U, D = {};
  G.Dominion = D;
  function S() { return G.Game && G.Game.state; }
  D.NEWS_MAX = 4;   // 한 달 소식에 적는 나라 수 (나머지는 「그 밖에 N곳」)

  function list(c) { return c && G.DOMINION && G.DOMINION[c.id != null ? c.id : c]; }
  function num(y, m) { return y * 12 + ((m || 1) - 1); }
  /** 그 해·달에 이 도시를 다스린 나라 (자료가 없으면 null) */
  D.ownerAt = function (c, y, m) {
    var l = list(c); if (!l) return null;
    var t = num(y, m), out = l[0][1];
    for (var i = 0; i < l.length; i++) { if (num(l[i][0], l[i][2]) <= t) out = l[i][1]; else break; }
    return out;
  };
  /** 지금 이 도시의 주인 */
  D.owner = function (c) { var s = S(); return s ? D.ownerAt(c, s.date.y, s.date.m) : D.first(c); };
  /** 게임이 시작할 때(또는 도시가 세워질 때) 주인 */
  D.first = function (c) { var l = list(c); return l ? l[0][1] : null; };
  /** 이 도시의 주인 내력 [{y, m, n}] */
  D.history = function (c) { return (list(c) || []).map(function (p) { return { y: p[0], m: p[2] || 0, n: p[1] }; }); };

  /** 나라 → 후원자 군주 자리 (js/data/people.js · rulers.js) */
  D.SEAT = { '포르투갈': 'pt_king', '카스티야': 'es_crown', '에스파냐': 'es_crown', '잉글랜드': 'en_king', '영국': 'en_king', '프랑스': 'fr_king',
    '신성로마제국': 'de_emperor', '교황령': 'it_pope', '오스만 제국': 'ot_sultan', '덴마크': 'dk_king', '폴란드': 'pl_king',
    '모스크바 대공국': 'ru_prince', '러시아 차르국': 'ru_prince', '러시아 제국': 'ru_prince', '조선': 'kr_king', '대한제국': 'kr_king', '일본': 'jp_shogun',
    '델리 술탄국': 'in_delhi', '무굴 제국': 'in_delhi', '베네치아': 'it_doge', '사파비 왕조': 'pe_shah' };
  var TITLE_RULES = [[/술탄/, '술탄'], [/칸국|칸$/, '칸'], [/대공국/, '대공'], [/공국/, '공작'], [/백국/, '백작'], [/기사단/, '기사단장'],
    [/제국/, '황제'], [/공화국|연방|연합/, '수반'], [/연맹|추장국|부족|원주민/, '추장'], [/왕국|왕조/, '국왕']];
  /** 그 나라 최고 지도자의 칭호 */
  D.title = function (n) {
    var t = G.NATION_TITLES && G.NATION_TITLES[n]; if (t) return t;
    for (var i = 0; i < TITLE_RULES.length; i++) if (TITLE_RULES[i][0].test(n || '')) return TITLE_RULES[i][1];
    return '통치자';
  };
  /** 그 해 그 나라의 지도자 {name(모르면 null), title, text} */
  D.leader = function (n, y) {
    var l = G.NATION_LEADERS && G.NATION_LEADERS[n], hit = null;
    if (y == null) { var s = S(); y = s ? s.date.y : 1480; }
    // 알현할 수 있는 군주 자리(rulers.js)가 있는 나라는 그 자리의 사람 — 왕궁·계승 소식과 이름이 같도록
    var sp = G.SPONSOR && G.SPONSOR[D.SEAT[n]];
    if (sp && y < 1900) sp.holders.forEach(function (h) { if (!hit && h[0] <= y && y < h[1] && h[4] !== 'g') hit = h; });
    if (!hit && l) {
      l.forEach(function (h) { if (h[0] <= y && (y < h[1] || (h[0] === h[1] && h[0] === y))) hit = h; });   // 그 해 즉위한 사람이 앞사람보다 먼저
      if (!hit) l.forEach(function (h) { if (h[1] === y) hit = h; });
    }
    var title = D.title(n), name = hit && hit[2];
    var text = !name ? n + '의 ' + title + (l ? ' (이름이 전하지 않음)' : '')
      : name.indexOf(title) >= 0 || /^(통치자|수반)$/.test(title) || /여왕|여제|천황|왕$|정부|회의|의회|평의회|참사회|장로회|위원|합병|공석|섭정|후계자들|의장|수장|렉토르|집정|판무관|파샤|총독|부왕|보호관|칼리파|이맘|에미르|추장|헤트만|직함|^(국왕|황제|대통령|호국경|법률고문|대법률고문|홀란트|바타비아|프랑스)/.test(name) || (title === '황제' && /제( \(|$)/.test(name)) ? name
      : title + ' ' + name;
    return { name: name || null, title: title, text: text };
  };
  /** 깃발·지도 색 */
  D.color = function (n) { return (G.NATION_COLORS && G.NATION_COLORS[n]) || null; };

  /** 그 해·달에 주인이 바뀐 도시 [{c, from, to}] (도시가 세워진 첫 기록은 빼고 — 새 도시 소식은 world.js가 따로 알린다) */
  D.changesIn = function (y, m) {
    var out = [];
    if (!G.DOMINION) return out;
    G.CITY_DATA.forEach(function (c) {
      var l = G.DOMINION[c.id]; if (!l) return;
      for (var i = 1; i < l.length; i++) if (l[i][0] === y && (l[i][2] || 1) === m && l[i][1] !== l[i - 1][1]) out.push({ c: c, from: l[i - 1][1], to: l[i][1] });
    });
    return out;
  };
  /** 달이 바뀐 날의 소식 (world.js W.newMonth) */
  D.monthly = function () {
    var s = S(); if (!s) return [];
    var y = s.date.y, m = s.date.m, ch = D.changesIn(y, m);
    if (!ch.length) return [];
    // 같은 해 역사 사건(HISTORY)에서 이미 알린 도시는 빼고
    var told = {};
    (G.HISTORY || []).forEach(function (h) { if (h.city && h.y === y) told[h.city[0]] = true; });   // 같은 해(달이 조금 달라도)
    ch = ch.filter(function (x) { return !told[x.c.id] && x.to !== '원주민'; });   // 마을이 비어 원주민 땅으로 돌아간 것은 소식으로 내지 않는다
    if (!ch.length) return [];
    var by = {}, order = [];
    ch.forEach(function (x) { if (!by[x.to]) { by[x.to] = []; order.push(x.to); } by[x.to].push(x); });
    // 들러 본 도시·큰 도시가 많은 나라부터
    function weight(n) { return by[n].reduce(function (a, x) { return a + x.c.size + (s.visited && s.visited[x.c.id] ? 3 : 0) + (s.loc.city === x.c.id ? 9 : 0); }, 0); }
    order.sort(function (a, b) { return weight(b) - weight(a); });
    var out = [], rest = 0;
    order.forEach(function (n, i) {
      var l = by[n];
      if (i >= D.NEWS_MAX) { rest += l.length; return; }
      l.sort(function (a, b) { return b.c.size - a.c.size; });
      var lead = D.leader(n, y), who = lead.name ? ' (' + lead.text + ')' : '';
      if (/[()]/.test(lead.text)) who = lead.name ? ' 다스리는 이: ' + lead.text + '.' : '';   // 괄호가 겹치지 않게
      var tail = who && who.charAt(1) !== '(' ? '.' + who : who + '.';
      var text = l.length === 1
        ? l[0].c.name + U.j(l[0].c.name, '이/가').slice(l[0].c.name.length) + ' ' + l[0].from + '에서 ' + n + '의 다스림 아래로 넘어갔다' + tail
        : n + U.j(n, '이/가').slice(n.length) + ' ' + U.j(l.slice(0, 3).map(function (x) { return x.c.name; }).join('·') + (l.length > 3 ? ' 등 ' + l.length + '곳' : ''), '을/를') + ' 다스리게 되었다' + tail;
      out.push({ icon: 'castle', text: text, history: true });
      G.State.log(text);
    });
    if (rest) out.push({ icon: 'castle', text: '그 밖에도 ' + rest + '곳의 도시가 주인이 바뀌었다.', history: true });
    return out;
  };
})(window.G = window.G || {});
