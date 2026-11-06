/* 탐험 계획: 경쟁자 발표의 재조사, 사건 예고·현장 기록, 교역 인맥. 저장은 처음 쓸 때 만든다. */
(function (G) {
  'use strict';
  var V = G.VoyagePlans = {}, U = G.U, R = G.R, UI = G.UI;
  function S() { return G.Game.state; }
  function K() { return G.BALANCE.voyagePlans; }
  function date(n) { return { y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }; }
  function today() { return U.dateNum(S().date); }
  function day(n) { return U.dayIndex(date(n)); }
  function textDate(n) { return U.fmtDate(date(n)); }
  function cfgState(s) {
    var v = s.voyagePlans || (s.voyagePlans = {});
    ['contacts', 'tasks', 'records', 'notices', 'honors', 'knowledge'].forEach(function (k) { if (!v[k]) v[k] = {}; });
    return v;
  }
  V.state = function () { var s = S(), v = cfgState(s); if (!v.version || !v.knowledgeVersion) V.migrate(s); return v; };
  V.migrate = function (s) {
    var v = cfgState(s);
    if (!v.knowledgeVersion) {
      v.knowledgeVersion = 1;
      // 실제 대화 기록만 복원한다. 예전의 전 세계 자동 예고는 들은 소문으로 간주하지 않는다.
      ((s.evRumor && s.evRumor.log) || []).slice().reverse().forEach(function (x) {
        remember(v, rumorId(x.id), x.text, x.city, x.date, '소문');
      });
      Object.keys(v.records).forEach(function (id) { remember(v, id, '이전에 살펴본 현장 기록.', v.records[id].city, v.records[id].date, '현장 기록'); });
    }
    if (v.version) return;
    v.version = 1; s.hints = s.hints || {};
    Object.keys(s.disc || {}).forEach(function (id) {
      var st = s.disc[id], d = G.DISC[id]; if (!d) return;
      // 이미 받은 발표 보상을 새 보상으로 소급 증폭하지 않는다. 최초 발표의 이름은 남긴다.
      if (d.rival && st.me && !st.rival && !st.late && (st.reported || st.announced)) v.honors[id] = { legacy: true };
      if (st.rival && !st.me && !s.hints[id]) s.hints[id] = { src: 'rival-report:' + id, d: U.dateNum(s.date) };
    });
    if (G.Frontier) G.Frontier.invalidate();
  };
  /** 역사적 개시일은 유지하고, 청약만 최소 원정 왕복 기간만큼 연다. 정산일을 넘기지는 않는다. */
  V.window = function (k, subscription) {
    var end = k.to;
    if (subscription) {
      var extended = U.dateNum(U.addDays(date(k.from), K().subscriptionDays));
      var paid = k.payAt || k.divAt;
      if (paid) extended = Math.min(extended, U.dateNum(U.addDays(date(paid), -1)));
      end = Math.max(end, extended);
    }
    return { from: k.from, to: end };
  };
  var NAMES = { eic: '잉글랜드 동인도 회사 출자', voc: '네덜란드 동인도 회사 청약', swally: '수왈리의 위기', jakatra: '자야카르타 피란민',
    banda: '반다의 묘목', amboyna: '암보이나의 서기', wic: '서인도 회사 청약', fr: '프랑스 동인도 회사 출자',
    pondy: '퐁디셰리 상관', tranq: '트랑케바르 조약', nswe: '신스웨덴의 만남', tobago: '토바고 정착지', darienSub: '스코틀랜드 회사 청약', darien: '다리엔의 이주민' };
  V.isSubscription = function (key) { return ['eic', 'voc', 'wic', 'fr', 'darienSub'].indexOf(key) >= 0; };
  V.subscriptionIntro = async function (k) {
    if (today() <= k.to) return;
    await UI.alert('회사가 세워진 날짜는 바뀌지 않았습니다. 아래에서는 설립 당시의 기록을 돌아보고, 원정을 마친 항해자를 위한 추가 출자에 참여합니다.<br>참여 기한: ' + textDate(V.window(k, true).to), '회사 설립 기록과 추가 출자');
  };
  var places = {};
  function closest(points) {
    if (!points || !points.length) return null;
    var key = JSON.stringify(points); if (places[key]) return places[key];
    var best = null, dist = Infinity;
    G.CITY_DATA.forEach(function (c) { points.forEach(function (p) { var n = G.Geo.dist(c.lon, c.lat, p[0], p[1]); if (n < dist) { best = c; dist = n; } }); });
    places[key] = best; return best;
  }
  var RUMOR_EVENTS = { ei_eic: 'eindia:eic', ei_voc: 'eindia:voc', cw_wic: 'colonyCo:wic', cw_fr: 'colonyCo:fr' };
  function rumorId(id) { return RUMOR_EVENTS[id] || 'rumor:' + id; }
  function remember(v, id, text, city, date, source) {
    if (!text) return;
    v.knowledge[id] = { text: text, city: city, date: date, source: source };
  }
  V.learnRumor = function (r, body, c) {
    remember(V.state(), rumorId(r.id), body, c ? c.id : null, today(), '들은 소문');
  };
  var RECORDS = {
    eic: '런던 상인들의 초기 출자 명부와 첫 항해의 귀환 장부를 살폈다. 항해자는 후추의 매입 항구와 선단의 보급 준비를 대조해 기록했다.',
    voc: '암스테르담의 청약 명부와 향료 선단의 화물 장부를 살폈다. 여러 상인 집단을 하나로 묶은 회사가 인도양의 교역로를 넓혀 갔다.',
    swally: '수왈리 해전 뒤 상인들이 남긴 증언을 들었다. 포르투갈과 잉글랜드의 다툼 속에서도 가족과 화물을 지키려던 사람들의 항로가 기록에 남았다.',
    jakatra: '자야카르타의 불을 피해 반탐으로 온 피란민의 증언을 모았다. 옛 마을의 지도와 피란길은 이후의 탐험 기록으로 이어졌다.',
    banda: '반다에서 달아난 주민들이 남긴 이야기를 들었다. 육두구가 자라는 섬들의 이름과 묘목을 지키던 사람들의 사연을 항해 일지에 적었다.',
    amboyna: '암보이나 상관의 재판 기록과 살아남은 사람들의 증언을 읽었다. 회사 간 다툼이 현지 사람들의 삶까지 흔들었던 흔적을 남겼다.',
    wic: '암스테르담의 설립 기록에서 정착지를 세우자는 상인들과 사략선에 기대를 건 이사들의 논쟁을 읽었다. 대서양 선단의 기록도 함께 살폈다.',
    fr: '프랑스 동인도 회사의 출자 명부와 해외 기지 계획을 살폈다. 파리에서 모인 돈이 먼 인도양의 상관과 어떻게 이어졌는지 항해 기록을 대조했다.',
    pondy: '퐁디셰리의 초기 보급 장부와 상관 지도를 살폈다. 작은 해안 마을이 교역 거점으로 자라나는 과정을 기록했다.',
    tranq: '트랑케바르의 통역과 예물에 관한 증언을 들었다. 항해자가 낯선 고장의 사람들과 항구 사용을 의논했던 과정을 적었다.',
    nswe: '크리스티나 요새에서 땅을 거래한 기록과 현지 주민의 증언을 함께 살폈다. 같은 만남을 서로 다른 사람들이 어떻게 기억하는지 기록했다.',
    tobago: '토바고 정착민의 식량 장부와 항해 일지를 살폈다. 먼 곳에서 보내온 보급선이 새 정착지의 삶을 떠받친 흔적이 남았다.',
    darienSub: '에든버러의 청약 명부와 스코틀랜드 회사의 계획서를 살폈다. 먼 바다에 새 항구를 세우려던 사람들의 기대가 기록에 남았다.',
    darien: '칼레도니아 만의 이주민들이 남긴 증언을 모았다. 식량과 물을 구하기 어려웠던 정착지의 생활과 보급선의 항로를 적었다.'
  };
  V.events = function (companiesOnly) {
    var list = [], s = S();
    [['eindia', s.eindia], ['colonyCo', s.colonyCo]].forEach(function (pair) {
      var cfg = G.BALANCE[pair[0]] || {}, st = pair[1] || {};
      Object.keys(cfg).forEach(function (key) {
        var k = cfg[key]; if (!k || !k.from || !k.to) return;
        var win = V.window(k, V.isSubscription(key));
        var c = k.city != null ? G.CITY_DATA[k.city] : k.box ? closest([[(k.box[0] + k.box[1]) / 2, (k.box[2] + k.box[3]) / 2]]) : null;
        list.push({ id: pair[0] + ':' + key, name: NAMES[key] || '해외 항로의 소식', from: win.from, to: win.to, city: c,
          place: c ? c.name + (k.box ? ' 앞바다' : '') : '관련 항구', done: !!st[key], subscription: V.isSubscription(key),
          record: RECORDS[key], story: V.isSubscription(key) ? '지정된 항구에서 출자 명부를 확인하고 규모와 위험을 의논할 수 있다. 결정을 미뤄도 참여 기한 안에 다시 찾아갈 수 있다.' : '현지의 상인과 주민이 항해자들의 도움이 필요한 소식을 전한다. 장소와 기간을 확인하고 그곳에서 구체적인 조건을 살핀다.' });
      });
    });
    if (companiesOnly) return list;
    (G.EVENT_RUMORS || []).forEach(function (r) {
      if ((!r.d && !r.y) || RUMOR_EVENTS[r.id]) return;
      var from = r.d ? r.d[0] : r.y[0] * 10000 + 101, to = r.d ? r.d[1] : r.y[1] * 10000 + 1231;
      var c = closest(r.near);
      // 이름·시작 장면·등장인물을 자료에서 꺼내 보여 주지 않는다. 실제 들은 말은 아래에서 붙인다.
      list.push({ id: 'rumor:' + r.id, name: '들은 소문', from: from, to: to,
        city: c, place: c ? c.name + ' 일대' : '소문의 고장', rumor: r,
        done: !!(r.mates && r.mates.length && (r.anyDone ? r.mates.some(function (id) { return G.EventRumor.done(id); }) : r.mates.every(function (id) { return G.EventRumor.done(id); }))) });
    });
    return list;
  };
  V.phase = function (e) { return today() < e.from ? 'soon' : today() <= e.to ? 'live' : 'past'; };
  V.visibleEvents = function () {
    var v = V.state();
    return V.events().filter(function (e) { return !e.done && !!v.knowledge[e.id]; }).map(function (e) {
      var known = v.knowledge[e.id], c = G.CITY_DATA[known.city];
      e.story = known.text; e.source = known.source;
      if (e.rumor) {
        e.name = c ? c.name + '에서 들은 소문' : '들은 소문';
        e.city = c || e.city; e.place = c ? c.name + ' 주변 · 자세한 장소는 소문 참고' : '소문 참고';
      } else if (V.phase(e) === 'soon') {
        e.name = c ? c.name + '의 교역 소식' : '들은 교역 소식';
        e.place = '자세한 장소는 들은 말 참고';
      }
      return e;
    });
  };
  V.rivals = function () { return G.DISCOVERIES.filter(function (d) { return R && G.Disc.taken(d.id); }); };
  V.accept = function (id) {
    var d = G.DISC[id], v = V.state(), old = v.tasks[id];
    if (!d || S().loc.mode !== 'city' || (!G.Disc.taken(id) && !(old && old.expired && G.Disc.foundByMe(id))) || old && (old.paid || old.due >= S().day)) return false;
    var active = Object.keys(v.tasks).filter(function (k) { var t = v.tasks[k]; return !t.paid && t.due >= S().day; }).length;
    if (active >= K().maxTasks) return false;
    if (!S().hints[id]) G.Disc.addHint(id, 'rival-report:' + id);
    v.tasks[id] = { start: S().day, due: S().day + K().investigationDays };
    G.State.log('재조사 의뢰 「' + d.name + '」 수락 — 지금부터 ' + K().investigationDays + '일.'); return true;
  };
  V.claim = function (id) {
    var t = V.state().tasks[id];
    if (!t || S().loc.mode !== 'city' || t.paid || S().day > t.due || !G.Disc.foundByMe(id)) return false;
    t.paid = true; S().player.gold += K().investigationGold; G.Fame.add('ex', K().investigationFame);
    G.State.log('「' + G.DISC[id].name + '」 재조사 완료 — 금화 ' + K().investigationGold + '닢.'); G.Game.refreshHud(); return true;
  };
  /** 최초 발견을 공표한 경쟁의 영예. 기존 발견 보상과 별도로 한 번만 지급한다. */
  V.first = function (d) {
    if (!d || !d.rival) return false;
    var st = S().disc[d.id], v = V.state();
    if (!st || !st.me || st.rival || st.late || !(st.reported || st.announced) || v.honors[d.id]) return false;
    v.honors[d.id] = { date: today() }; S().player.gold += K().firstGold; G.Fame.add('ex', K().firstFame);
    G.State.log('최초 발표 「' + d.name + '」 — 칭호 「' + d.name + '의 선구자」 · 금화 ' + K().firstGold + '닢.');
    UI.toast('최초 발표의 영예 — 「' + d.name + '의 선구자」 · 금화 ' + K().firstGold + '닢 · 탐험 명성 +' + K().firstFame, 'flag', 4800); G.Game.refreshHud(); return true;
  };
  V.titles = function () { return Object.keys(V.state().honors).filter(function (id) { return G.DISC[id]; }).map(function (id) { return G.DISC[id].name + '의 선구자'; }); };
  function localHints(c, src) {
    return G.DISCOVERIES.filter(function (d) {
      return !G.Disc.foundByMe(d.id) && !d.bookOnly && G.Disc.built(d) && G.Disc.needMet(d) && G.Disc.available(d) &&
        (d.reg === c.region || d.city === c.id) && (!S().hints[d.id] || G.Disc.canStack(d.id, src));
    }).sort(function (a, b) { return (a.pw || 0) - (b.pw || 0) || a.id.localeCompare(b.id); });
  }
  V.trade = function (c, qty, value) {
    if (!c || qty < K().tradeQty || value < K().tradeValue) return false;
    var v = V.state(), x = v.contacts[c.id] || (v.contacts[c.id] = { visits: 0, level: 0 });
    if (x.last != null && S().day - x.last < K().contactDays) return false;
    x.last = S().day; x.visits++;
    var lv = K().contactLevels.filter(function (n) { return x.visits >= n; }).length;
    if (lv <= x.level) return false;
    x.level = lv;
    var src = 'network:' + c.id + ':' + lv, ds = localHints(c, src), d = ds[0];
    if (d) { G.Disc.addHint(d.id, src); x.hint = d.id; }
    G.State.log(c.name + ' 거래처와의 인연 ' + lv + '단계' + (d ? ' — 「' + d.name + '」 탐험 정보' : ' — 이 고장에는 새 탐험 정보가 없다. 인연은 그대로 남는다.'));
    UI.toast(c.name + ' 거래처가 ' + (d ? '현지 탐험 단서를 전해 주었다.' : '이번에는 새 탐험 정보가 없었다. 거래처의 인연은 남는다.'), 'scroll'); return true;
  };
  V.review = async function (id) {
    var e = V.visibleEvents().filter(function (x) { return x.id === id; })[0], s = S(), v = V.state();
    if (!e || V.phase(e) !== 'past' || v.records[id]) return false;
    if (!e.city || s.loc.mode !== 'city' || s.loc.city !== e.city.id) { await UI.alert('현장 기록은 ' + U.esc(e.place) + '에서 살펴볼 수 있습니다.'); return false; }
    var story = '<b>' + U.esc(e.name) + '</b><p>당시 전해진 기록: ' + U.esc(e.record || e.story) + '</p><p>사건이 일어난 시기는 지났지만, 이곳의 기록과 증언은 다음 탐험으로 이어집니다.</p>';
    var src = 'archive:' + id, d = localHints(e.city, src)[0];
    v.records[id] = { date: today(), city: e.city.id };
    if (d) { G.Disc.addHint(d.id, src); story += '<p>현지 조사 단서: ' + U.esc(G.Disc.hintText(d)) + '</p>'; }
    G.Fame.add('ex', K().archiveFame); G.State.log('현장 기록 조사 — ' + e.name + ' (' + e.place + ')');
    await UI.alert(story, '현장 기록과 후일담'); return true;
  };
  V.daily = function () {
    var v = V.state(), s = S(), out = [];
    // 이미 들은 출자 소식이 실제로 열릴 때만 한 번 귀띔한다. 미공개 사건의 예고·후일담은 알리지 않는다.
    V.visibleEvents().filter(function (e) { return e.subscription && V.phase(e) === 'live'; }).forEach(function (e) {
      var phase = V.phase(e), key = e.id + ':' + phase;
      if (v.notices[key]) return; v.notices[key] = today();
      out.push({ icon: 'scroll', history: true, text: '들은 소식 확인: ' + e.name + ' — ' + e.place + '에서 ' + textDate(e.to) + '까지 참여할 수 있다.' });
    });
    G.DISCOVERIES.forEach(function (d) { if (d.rival) V.first(d); });
    Object.keys(v.tasks).forEach(function (id) { var t = v.tasks[id]; if (!t.paid && !t.expired && s.day > t.due) { t.expired = true; out.push({ icon: 'scroll', text: '「' + G.DISC[id].name + '」 재조사 의뢰 기한이 지났다. 발견과 연쇄는 계속할 수 있고, 계획에서 의뢰를 다시 받을 수 있다.' }); } });
    return out;
  };
  V.summaryHtml = function () {
    var v = V.state(), tasks = Object.keys(v.tasks).filter(function (id) { return !v.tasks[id].paid; });
    return '<div class="sep"></div><h4>탐험·교역 계획</h4><p>직접 들은 소문과 거래처 정보, 공개된 발견의 재조사 의뢰를 적어 둡니다.</p>' +
      (tasks.length ? '<ul>' + tasks.map(function (id) { var t = v.tasks[id]; return '<li>' + U.esc(G.DISC[id].name) + ' — ' + (t.due < S().day ? '기한 경과 · 다시 의뢰 가능' : G.Disc.foundByMe(id) ? '조사 완료 · 계획에서 보고' : (t.due - S().day) + '일 남음') + '</li>'; }).join('') + '</ul>' : '') +
      '<button class="btn" data-voyage-plans>장소·기한·거래처 보기</button>';
  };
  V.departureHtml = function () {
    var now = U.dayIndex(S().date), es = V.visibleEvents().filter(function (e) { return V.phase(e) !== 'past'; });
    es.sort(function (a, b) { return Math.min(day(a.from) < now ? Infinity : day(a.from), day(a.to)) - Math.min(day(b.from) < now ? Infinity : day(b.from), day(b.to)); });
    if (!es.length) return '';
    return '<div style="margin:8px 0"><b>항해 전에 떠올린 소식</b><ul>' + es.slice(0, 3).map(function (e) { return '<li>' + U.esc(e.name) + ' · ' + (e.subscription && V.phase(e) === 'live' ? U.esc(e.place) + ' · ' + textDate(e.to) + '까지' : '들은 소문을 다시 확인해 보자.') + '</li>'; }).join('') + '</ul><button class="btn small" data-voyage-plans>들은 소식 보기</button></div>';
  };
  V.open = function () {
    var filter = 'live', win;
    function html() {
      var v = V.state(), now = U.dayIndex(S().date), events = V.visibleEvents().filter(function (e) { return V.phase(e) === filter; });
      var h = '<div class="ck-cats">' + [['live', '들은 소식'], ['soon', '기다리는 소식'], ['past', '남겨 둔 기록'], ['rival', '발표된 발견 재조사'], ['contacts', '거래처']].map(function (x) { return '<button class="ck-cat' + (filter === x[0] ? ' on' : '') + '" data-vp-filter="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
      if (filter === 'rival') {
        var ids = V.rivals().map(function (d) { return d.id; }); Object.keys(v.tasks).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
        h += '<p>최초 발표의 영예는 먼저 알린 사람에게 남습니다. 현장·유물·핵심 연쇄는 직접 탐험할 수 있습니다. 재조사 의뢰 기한은 항구 해도소에서 수락한 날부터 ' + K().investigationDays + '일입니다.</p>';
        return h + (ids.length ? ids.map(function (id) { var d = G.DISC[id], t = v.tasks[id], found = G.Disc.foundByMe(id); return '<div class="hint-item"><div class="tx"><b>' + U.esc(d.name) + '</b><p>' + U.esc(G.Disc.hintText(d)) + '</p>' +
          (t && t.paid ? '조사 보고 완료' : t && t.due >= S().day ? (found ? '<button class="btn" data-vp-claim="' + id + '">재조사 보고</button>' : '의뢰 기한 ' + (t.due - S().day) + '일 남음') : '<button class="btn" data-vp-accept="' + id + '">재조사 의뢰 수락</button>') + '</div></div>'; }).join('') : '<p>아직 경쟁자의 발표가 없습니다.</p>');
      }
      if (filter === 'contacts') return h + '<p>' + K().tradeQty + '통·' + K().tradeValue + '닢 이상 거래하면 인연이 쌓입니다. 같은 항구에서는 ' + K().contactDays + '일마다 한 번, ' + K().contactLevels.join('·') + '번째 거래에서 현지 탐험 정보를 얻습니다.</p>' + (Object.keys(v.contacts).map(function (id) { var x = v.contacts[id], c = G.CITY_DATA[id]; return '<p><b>' + U.esc(c.name) + '</b> — 인연 ' + x.level + '단계 · 거래 ' + x.visits + '회' + (x.hint ? ' · ' + U.esc(G.Disc.hintText(G.DISC[x.hint])) : '') + '</p>'; }).join('') || '<p>거래처와 첫 인연을 맺어 보십시오.</p>');
      events.sort(function (a, b) { return filter === 'past' ? b.to - a.to : filter === 'soon' ? a.from - b.from : a.to - b.to; });
      h += '<p>직접 들은 이야기만 적혀 있습니다. 더 자세한 사정은 현지에서 알아보십시오.</p><table class="tbl"><tr><th>들은 이야기</th><th>장소</th><th>메모</th></tr>';
      h += events.map(function (e) { return '<tr><td><b>' + U.esc(e.name) + '</b><details><summary>들은 말 다시 보기</summary><p>' + U.esc(e.story) + '</p></details></td><td>' + U.esc(e.place) + '</td><td>' +
        (filter === 'past' ? v.records[e.id] ? '현장 기록 조사 완료' : '<button class="btn small" data-vp-review="' + U.esc(e.id) + '">현장 기록 조사</button>' : filter === 'soon' ? '구체적인 일정은 아직 모른다.' : e.subscription ? textDate(e.to) + '까지 · ' + (day(e.to) - now) + '일 남음' : '상황과 조건은 현지에서 확인') + '</td></tr>'; }).join('');
      return h + '</table>' + (!events.length ? '<p>아직 적어 둔 소식이 없습니다. 마을 사람이나 거래처와 이야기를 나눠 보십시오.</p>' : '');
    }
    win = UI.window({ title: '탐험·교역 계획', icon: 'map', width: 1040, html: html(), buttons: [{ label: '닫기', value: null }], onBuild: function (el, w) {
      function draw() { w.content.innerHTML = html(); wire(); }
      function wire() {
        U.$$('[data-vp-filter]', w.content).forEach(function (b) { b.onclick = function () { filter = b.dataset.vpFilter; draw(); }; });
        U.$$('[data-vp-accept]', w.content).forEach(function (b) { b.onclick = async function () { if (!V.accept(b.dataset.vpAccept)) await UI.alert('항구에서 재조사 의뢰를 접수하십시오. 동시에 맡을 수 있는 의뢰는 ' + K().maxTasks + '개입니다.'); draw(); }; });
        U.$$('[data-vp-claim]', w.content).forEach(function (b) { b.onclick = function () { if (V.claim(b.dataset.vpClaim)) UI.toast('재조사 보고를 마쳤다.', 'scroll'); draw(); }; });
        U.$$('[data-vp-review]', w.content).forEach(function (b) { b.onclick = async function () { await V.review(b.dataset.vpReview); draw(); }; });
      }
      wire();
    } });
    return win.result;
  };
  document.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('[data-voyage-plans]')) V.open(); });
  if (G.Achieve) { var titles = G.Achieve.titles; G.Achieve.titles = function () { return titles.apply(this, arguments).concat(V.titles()); }; }
})(window.G = window.G || {});
