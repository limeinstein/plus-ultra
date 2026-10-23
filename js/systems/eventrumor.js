/* 사건·전설 부하의 소문을 마을 사람이 들려준다 (G.EventRumor) — 자료: js/data/eventrumors.js (G.EVENT_RUMORS). 2026-10-22 사용자 요청
   · 거리를 걷는 마을 사람(js/systems/streetfolk.js)에게 말을 걸면 chance(5%)로, 그 도시 둘레(near·r)의 아직 일어날 수 있는 사건 소문 하나를 듣는다.
   · 말이 통하지 않으면(통역 없음) 듣지 못한다. 짐승은 말하지 않는다.
   · 같은 소문은 gap(90)일 안에 다시 듣지 않는다 · 들은 소문은 항해 일지에 남고, 수첩 「할 일」 아래 「들은 소문」에 최근 것(최대 6)이 보인다.
   · 말투: 소문 말(text)마다 해요체(y)와 하오·하게체(o)를 함께 적고, 말하는 사람에 맞춰 고른다 (REG — 머리말 LEAD와 본문 말투가 섞이지 않게)
   · 끝난 이야기: 부하로 맞았거나(배에 탐) 떠났거나(gone) 제독·선대 제독과 혼인한 사람의 소문은 돌지 않는다 (ER.done)
   · 저장: s.evRumor = { heard: {id: 들은 날번호(s.day)} }
   조정값: G.BALANCE.eventRumor = { chance, gap, show } */
(function (G) {
  'use strict';
  var U = G.U;
  var ER = G.EventRumor = {};
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.eventRumor = G.BALANCE.eventRumor || { chance: 0.05, gap: 90, show: 6 };
  function K() { return G.BALANCE.eventRumor; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.evRumor || (s.evRumor = { heard: {} }); }
  function dn(s) { return s.date.y * 10000 + s.date.m * 100 + s.date.d; }
  function gone(s, id) { return !!(s.flags && s.flags['gone_' + id]); }
  function aboard(s, id) { return (s.mates || []).some(function (m) { return m.id === id; }); }
  /** 제독(또는 선대 제독)의 아내인가 — 집에 사는 부인은 부하 명단에도 gone 표시에도 없다 (QA 9) */
  function wed(s, id) {
    var p = s.player || {};
    if (p.wife === id) return true;
    if ((p.wives2 || []).some(function (w) { return w.id === id; })) return true;
    return (p.elders || []).some(function (e) { return e.id === id; });
  }
  /** 이 사람의 이야기는 끝났는가: 배에 있다 · 떠났다 · 혼인했다 */
  ER.done = function (id, s) { s = s || S(); return !!s && (aboard(s, id) || gone(s, id) || wed(s, id)); };
  // 말하는 사람의 말투: y 해요체 · o 하오·하게체 (없는 종류는 해요체)
  var REG = { man: 'o', woman: 'y', boy: 'y', girl: 'y', elder: 'o', grandma: 'o', librarian: 'y', innkeeper: 'o', adventurer: 'o', merchant: 'o', noble: 'o', soldier: 'o', navigator: 'o' };
  /** 지금 이 소문으로 할 수 있는 말들 (text가 함수면 사건의 단계·날짜에 맞는 말만) — 문자열이거나 {y, o} */
  ER.texts = function (r) {
    var s = S(), t = r.text;
    if (typeof t === 'function') { try { t = t(s); } catch (e) { t = null; } }
    return (t || []).filter(Boolean);
  };
  function say(x, reg) { return typeof x === 'string' ? x : (x[reg] || x.y || x.o); }

  /** 이 소문의 사건이 아직 일어날 수 있는가 */
  ER.live = function (r) {
    var s = S(); if (!s) return false;
    if (r.y && (s.date.y < r.y[0] || s.date.y > r.y[1])) return false;
    if (r.d && (dn(s) < r.d[0] || dn(s) > r.d[1])) return false;
    if (r.mates && r.mates.length) {
      var fin = function (id) { return ER.done(id, s); };
      if (r.anyDone ? r.mates.some(fin) : r.mates.every(fin)) return false;   // 모두(anyDone: 한 사람이라도) 만났거나 떠났거나 혼인했다
    }
    if (r.live) { try { if (!r.live(s)) return false; } catch (e) { return false; } }
    return ER.texts(r).length > 0;    // 지금 단계에 맞는 말이 없으면 (이미 지난 장면) 돌지 않는다
  };
  /** 이 도시 사람이 이야기할 수 있는가 (near 둘레 r° 안) */
  ER.near = function (r, c) {
    if (r.own && !r.own.test(G.R.cityOwner(c) || '')) return false;   // 그 나라 사람들 사이에 도는 이야기
    if (r.where) { try { if (!r.where(c)) return false; } catch (e) { return false; } }   // 그 도시의 종교·주인 같은 조건 (이슬람 도시 등)
    return (r.near || []).some(function (p) { return G.Geo.dist(c.lon, c.lat, p[0], p[1]) <= (r.r || 8); });
  };
  /** 이 도시에서 들을 수 있는 소문들 (최근에 들은 것은 빼고) */
  ER.at = function (c) {
    var s = S(), h = st().heard, gap = K().gap || 90;
    return (G.EVENT_RUMORS || []).filter(function (r) { return ER.near(r, c) && ER.live(r) && !(h[r.id] != null && s.day - h[r.id] < gap); });
  };
  var LEAD = {
    man: ['장사꾼들 사이에 도는 얘긴데 말이오, ', '들은 얘기가 있소. '], woman: ['우물가에서 들은 얘긴데요, ', '이건 소문인데요, '],
    boy: ['아저씨, 이거 알아요? ', '형들이 그러는데요, '], girl: ['언니들이 그러는데요, ', '있잖아요, '],
    elder: ['늙은이가 들은 이야기 하나 해 주지. ', '요즘 젊은 것들이 떠드는 이야기가 있더군. '], grandma: ['장터 할멈들이 수군대더라. ', '내 귀에 들어온 얘기가 있어. '],
    librarian: ['책에는 없는 이야기입니다만, ', '손님들 사이에 도는 이야기가 있습니다. '], innkeeper: ['손님들한테 들은 건데, ', '우리 여관에 묵은 사람이 그러더군. '],
    adventurer: ['모험가들 사이에 도는 이야기요. ', '내가 직접 본 건 아니지만, '], merchant: ['장삿길에 들은 얘기요. ', '거래처에서 들은 소문이오. '],
    noble: ['궁정에서 흘러나온 이야기인데, ', '귀족들끼리만 쉬쉬하는 이야기네만, '], soldier: ['초소에서 들은 얘기요. ', '병사들 사이에 도는 소문이오. '],
    navigator: ['배 타는 사람들 사이의 이야기요. ', '항구에서 들은 소문이오. ']
  };
  /** 마을 사람 f가 들려줄 소문 한 마디 (없으면 null). force: 확률을 건너뛴다 (시험) */
  ER.pick = function (f, c, force) {
    if (!f || f.animal || f.rumored) return null;
    if (!force && !U.chance(K().chance == null ? 0.05 : K().chance)) return null;
    var list = ER.at(c); if (!list.length) return null;
    var r = U.pick(list), lead = U.pick(LEAD[f.type] || ['소문인데요, ']), body = say(U.pick(ER.texts(r)), REG[f.type] || 'y');
    return { r: r, body: body, text: lead + body };
  };
  /** 들었다고 적는다 */
  ER.heard = function (r, body, c) {
    var s = S(); st().heard[r.id] = s.day;
    (st().log = st().log || []).unshift({ id: r.id, day: s.day, date: dn(s), city: c ? c.id : null, text: body });
    st().log = st().log.slice(0, 12);
    G.State.log('소문 (' + (c ? c.name + '의 마을 사람' : '마을 사람') + '): ' + body);
  };
  /** 수첩 「할 일」 아래 — 들은 소문 (아직 일어날 수 있는 것만) */
  ER.html = function () {
    var s = S(), t = s && s.evRumor; if (!t || !t.log || !t.log.length) return '';
    var byId = {}; (G.EVENT_RUMORS || []).forEach(function (r) { byId[r.id] = r; });
    var seen = {}, list = t.log.filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return byId[x.id] && ER.live(byId[x.id]); }).slice(0, K().show || 6);
    if (!list.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">들은 소문</h4><ul>' + list.map(function (x) {
      var c = G.CITY_DATA[x.city]; return '<li>' + U.esc(x.text) + (c ? ' <small class="muted">(' + U.esc(c.name) + '의 마을 사람)</small>' : '') + '</li>';
    }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._evRumorHtml) { G.Court._evRumorHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + ER.html(); }; }
})(window.G = window.G || {});
