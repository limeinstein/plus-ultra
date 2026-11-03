/* 고장별 주민 성격·직접 대화에서 듣는 현재 소식. 저장 필드는 만들지 않는다. */
(function (G) {
  'use strict';
  var U = G.U, R = G.R, SC = G.StreetCulture = {};
  function S() { return G.Game.state; }
  function D() { return G.STREET_FOLK; }
  function K() { return G.FX.streetFolk.culture; }
  function num(d) { return d.y * 10000 + (d.m || 1) * 100 + (d.d || 1); }
  function fill(t, c) { return t.replace(/\{city\}/g, c.name); }
  function style(c) { return G.Img.folkStyle(c); }
  SC.region = function (c) {
    var st = style(c);
    if (['kr', 'cn', 'jp', 'in', 'se', 'st'].indexOf(st) >= 0) return st;
    // 건물·점령 국가가 아니라 주민 양식과 지리로 고른다. 카리브 해안(tr)은 아프리카가 아니다.
    if (c.region === 10) return st === 'an' ? 'an' : st === 'az' ? 'az' : 'na';
    if (st === 'sw') return 'sw';
    if (c.rel === 'I' || st === 'is' || st === 'pe') return 'islam';
    if (c.region === 3 || st === 'af') return 'af';
    return 'europe';
  };
  function entry(id, mood, brief, text, urgent) { return { id: id, mood: mood, brief: brief, text: text, urgent: !!urgent }; }
  function reaction(f, mood, fallback) {
    var rows = D().cultureReactions || [];
    for (var i = 0; i < rows.length; i++) if (rows[i].roles.indexOf(f.type) >= 0) return rows[i][mood] || fallback;
    return fallback;
  }
  SC.localLines = function (f, c) {
    var p = D().cultures[SC.region(c)] || D().cultures.europe, now = num(S().date), child = f.type === 'boy' || f.type === 'girl';
    function read(lines, prefix, group, explicitRole) {
      return (lines || []).map(function (l, i) {
        if (explicitRole && !l[3]) return null;  // 아이가 상인의 장부·노인의 회고를 자기 일처럼 말하지 않는다.
        if ((l[3] && l[3].indexOf(f.type) < 0) || (l[4] && now < l[4])) return null;
        var e = entry(prefix + i, l[0], l[1], fill(l[2], c)); e.group = group; return e;
      }).filter(Boolean);
    }
    return read(p.lines, 'culture:', 'region', child)
      .concat(read((D().cultureRoleLines || {})[f.type], 'culture:role:' + f.type + ':', 'role'))
      .concat(child ? read((D().cultureRoleLines || {}).child, 'culture:role:child:', 'role') : [])
      .concat(read((D().cultureCityLines || {})[c.id], 'culture:city:' + c.id + ':', 'city', child));
  };
  /** 그 날짜까지 알려진 고장 소식. 사건을 일으키거나 보상을 주지는 않는다. */
  SC.context = function (f, c) {
    var s = S(), now = num(s.date), region = SC.region(c), out = [], owner = R.cityOwner(c);
    var disasters = G.Disaster && G.Disaster.at ? G.Disaster.at(c.lon, c.lat) : [];
    if (disasters.length) out.push(entry('disaster:' + disasters[0].id, 'worry', '이웃들은 무사한가요?',
      '{city}에 재해가 닥쳐 이웃들이 걱정이에요. 먼저 다친 사람과 머물 곳 없는 사람부터 살펴야겠어요.', true));
    var held = s.conquests && s.conquests[c.id];
    if (held) out.push(entry('conquest:' + owner, 'worry', '새 깃발 아래서도 살아가야지.',
      '이제 {city}를 다스리는 나라는 ' + owner + '이라지요. 깃발이 바뀐 뒤에도 우리 가족은 여기서 살아가야 해요. 새 관리들이 백성의 살림부터 살펴주었으면 해요.', true));
    (D().cultureHistory || []).forEach(function (h, i) {
      var avoided = s.horan && s.horan.end === 'avoided';
      if ((h.unless === 'horanAvoided' && avoided) || (h.when === 'horanAvoided' && !avoided)) return;
      if (h.region === region && now >= h.at && now < h.until) out.push(entry('local:' + i, h.mood, h.brief, h.text, true));
    });
    var evs = G.Econ && G.Econ.activeAt ? G.Econ.activeAt(c.id) : [];
    evs.forEach(function (e) {
      var happy = ['bumper', 'festival', 'wedding', 'textile'].indexOf(e.type) >= 0;
      var danger = ['war', 'border', 'plague', 'fire', 'drought', 'coldrain'].indexOf(e.type) >= 0;
      var title = G.Econ.title(e), why = e.why ? ' ' + e.why + '.' : '';
      out.push(entry('economy:' + (e.id || e.type), happy ? 'happy' : 'worry', happy ? '장터에 반가운 소식이 있어요!' : '요즘 장터 사정이 걱정이에요.',
        '요즘 화제는 ' + title + '이지요.' + why + reaction(f, happy ? 'happy' : 'worry', happy ? ' 이 기쁨이 이웃들 밥상에도 닿으면 좋겠어요.' : ' 물건 값도 걱정이지만 식구들 살림이 먼저예요.'), danger));
    });
    // 유럽의 정치: 가장 가까운 다른 세력들과의 실제 관계. 플레이어의 국적과 별개다.
    if (region === 'europe' && G.Rel) {
      var power = G.Rel.cityPower(c), near = {};
      if (power) (G.CITY_DATA || []).forEach(function (t) {
        if (t.id === c.id || !R.cityExists(t)) return;
        var p = G.Rel.cityPower(t); if (!p || p === power) return;
        var dist = Math.pow(t.lon - c.lon, 2) + Math.pow(t.lat - c.lat, 2);
        if (dist <= K().neighborRange * K().neighborRange && (!near[p] || dist < near[p].dist)) near[p] = { p: p, t: t, dist: dist };
      });
      Object.keys(near).map(function (p) { return near[p]; }).sort(function (a, b) { return a.dist - b.dist; }).slice(0, K().neighborCount).forEach(function (n) {
        var rel = G.Rel.get(power, n.p), war = rel.tier === 'war', good = rel.tier === 'friend' || rel.tier === 'ally';
        out.push(entry('politics:' + n.p + ':' + rel.tier, war ? 'worry' : good ? 'happy' : 'calm', war ? '이웃 나라와 전쟁이라니…' : good ? '이웃과 사이가 좋다니 다행이오.' : '이웃 항구 소식도 살펴야지.',
          '우리 ' + owner + U.jx(owner, '과/와') + ' ' + G.Rel.name(n.p) + '의 사이는 지금 ' + G.Rel.TIER[rel.tier] + '이라오.' +
          (rel.why ? ' ' + rel.why + ' 때문이지.' : '') + ' ' + n.t.name + ' 쪽으로 가는 장사꾼들도 ' + (war ? '길과 통행 허가를 걱정하고 있소.' : good ? '교역이 이어지길 바라고 있소.' : '정세를 살피고 있소.'), war));
      });
    }
    var history = (G.HISTORY || []).concat(G.REL_EVENTS || []), powerOf = G.Rel && G.Rel.power;
    var ownPower = powerOf ? powerOf(owner) : null;
    history.filter(function (h) {
      if (!h.text || num(h) > now || U.dayIndex(s.date) - U.dayIndex({ y: h.y, m: h.m || 1, d: h.d || 1 }) > K().historyDays) return false;
      if (h.city) {
        if (h.city[0] === c.id) return !held && R.cityOwner(c) === h.city[1];
        var hc = G.CITY_DATA[h.city[0]];
        return hc && hc.region === c.region && Math.abs(hc.lon - c.lon) + Math.abs(hc.lat - c.lat) <= K().neighborRange;
      }
      return h.text.indexOf(c.name) >= 0 || h.text.indexOf(owner) >= 0 || (ownPower && (h.mods || []).some(function (m) { return m[0] === ownPower || m[1] === ownPower; }));
    }).sort(function (a, b) { return num(b) - num(a); }).slice(0, K().historyCount).forEach(function (h) {
      var mood = /세상을 떠|숨졌|죽음/.test(h.text) ? 'sad' : /실패|함락|항복|무너|패했다|약탈/.test(h.text) ? 'worry'
        : /조약|화약|혼례|혼인/.test(h.text) ? 'happy' : /귀환|발견|닿았|돌아왔다/.test(h.text) ? 'proud' : 'calm';
      var reactions = { sad: ' 그 소식에 골목도 한동안 조용했소. 남은 사람들이 무사하면 좋겠소.',
        worry: ' 소식을 듣고 나니 식구들과 이웃이 걱정이오. 하루빨리 안정을 찾았으면 하오.',
        happy: ' 이런 반가운 소식이 우리 {city} 사람들의 살림에도 좋은 일을 가져오면 좋겠소.',
        proud: ' 그 이야기를 들으니 나도 가슴이 벅차더군. 우리 {city}의 아이들에게도 들려주고 싶소.',
        calm: ' 큰 역사가 우리 {city}의 살림에는 어떤 변화를 가져올지 지켜보고 있소.' };
      out.push(entry('history:' + (h.id || num(h) + ':' + h.text), mood, '얼마 전 소식 들으셨소?',
        h.y + '년 ' + (h.m || 1) + '월에 이런 소식이 왔소. “' + h.text + '”' + reaction(f, mood, reactions[mood])));
    });
    out.push(entry('owner:' + owner, 'calm', '지금 이 고장은 ' + owner + '의 땅이지.',
      '지금 {city}는 ' + owner + U.jx(owner, '이/가') + ' 다스리고 있소.' + (G.Dominion && G.Dominion.leader ? ' 다스리는 이는 ' + G.Dominion.leader(owner).text + '이라지.' : '') + ' 먼 항구의 옛 소문만 듣고 오면 놀랄 수도 있겠소.'));
    return out.map(function (e) { return Object.assign({}, e, { text: fill(e.text, c) }); });
  };
  /** 같은 사람과 이야기하면 현재 일 → 문화 → 다른 소식 순으로, 모두 듣기 전에는 같은 문장을 피한다. */
  SC.next = function (f, c) {
    var context = SC.context(f, c), culture = SC.localLines(f, c), heard = f.cultureHeard || (f.cultureHeard = {});
    var count = f.cultureTalks || 0, urgent = context.filter(function (e) { return e.urgent && !heard[e.id]; });
    var pool = count % 2 ? culture.concat(context) : context.concat(culture);
    var fresh = pool.filter(function (e) { return !heard[e.id]; });
    if (!fresh.length) { f.cultureHeard = heard = {}; fresh = pool; }
    var choice;
    if (urgent.length && count % 2 === 0) choice = urgent[0];
    else if (count % 2 || (count === 0 && Math.abs(U.strHash(String(f.seed))) % 2)) choice = fresh.filter(function (e) { return e.id.indexOf('culture:') === 0; })[0];
    else choice = fresh.filter(function (e) { return e.id.indexOf('culture:') !== 0; })[0];
    choice = choice || fresh[0];
    // 도시·고장·역할 이야기를 고루 들려주며, 해당 묶음을 다 들었으면 남은 이야기로 이어간다.
    if (choice && choice.id.indexOf('culture:') === 0) {
      var cultural = fresh.filter(function (e) { return e.id.indexOf('culture:') === 0; });
      var order = D().cultureFocusOrder || ['region'], stories = f.cultureStories || 0;
      var focused = cultural.filter(function (e) { return e.group === order[stories % order.length]; });
      if (focused.length) cultural = focused;
      choice = cultural[Math.abs(U.strHash(String(f.seed) + ':' + f.type + ':' + stories)) % cultural.length];
      f.cultureStories = stories + 1;
    }
    if (choice) { heard[choice.id] = true; f.cultureTalks = count + 1; f.mood = choice.mood; }
    return choice;
  };
  SC.attach = function (f, c) {
    if (f.animal) return;
    var p = D().cultures[SC.region(c)] || D().cultures.europe;
    f.cultureCity = c;
    f.name = c.name + '의 ' + ((p.roles || {})[f.type] || f.name.replace(/\s*\([^)]*\)/g, ''));
    if (f.face) f.face.name = f.name;
  };
})(window.G = window.G || {});
