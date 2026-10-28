/* 항해사 소식 (G.MateKnow) — 수첩 「철새」에는 소식을 아는 항해사만, 여급에게 행방을 부탁하기. 2026-10-28 사용자 요청
   ■ 아는 항해사 (s.mateKnow = {id: {c: 도시, d: 날번호, how}}) — how: met(술집 명부에서 보았다·이야기했다) · rumor(술집 주인·여관 안주인의 귀띔)
     · tip(여급에게 사례하고 들은 철새) · maid(여급이 찾아 준 행방) · crew(함께 항해했던 부하) · fate(배를 떠난 부하의 남은 이야기)
   ■ 수첩 「철새」: 세계의 모든 철새가 아니라, 소식을 아는 항해사(철새·마녀·실존 항해사 모두)만. 머무는 곳은 「들은 그때의 곳」이다 —
     들은 지 fresh(30)일이 지나면 「예전에 ○○ (1503년 5월)」로 흐리게 적고 지금은 떠났을지도 모른다고 한다(실제로는 한 달에 한 번 옮겨 다닌다, js/systems/matemove.js).
     행방을 들어 그 항구에 머무는 동안(s.mateRumorStay)은 「체류 N일 남음」.
   ■ 여급에게 「항해사의 행방을 부탁한다」(js/city/tavern.js T.maid): 이름을 적는다 →
     · 정확한 이름이 아니면 모른다 · 만났거나 인연이 있던(위의 아는 항해사) 사람이어야 한다 · 지금 제독의 배에 있으면 그렇다고 한다
     · 그 사람이 지금 있는 곳이 이 도시에서 farDeg(30°) 넘게 멀면 소식이 닿지 않는다
     · 아니면 「주변 뱃사람들에게 물어 행방을 찾아 놓겠다 — 20일쯤」 (사례금, 여급마다 하나씩). 날이 차기 전에 가면 아직이라고 한다.
     · 날이 찬 뒤 그 여급을 찾아가면 그때 있는 곳을 알려 주고, 그 항구에서 stay(30)일 머문다. 배를 떠난 부하(s.mateFate)는 그 뒤의 이야기를 들려준다.
   ■ 저장: s.mateKnow · s.maidSeek = {여급 id: {id, name, city, from, due, fee}} · 조정값 G.BALANCE.mateKnow */
(function (G) {
  'use strict';
  var U = G.U;
  var MK = G.MateKnow = {};
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.mateKnow = G.BALANCE.mateKnow || { fresh: 30, days: [18, 22], farDeg: 30, stay: 30, fee: 0.8 };
  function K() { return G.BALANCE.mateKnow; }
  function S() { return G.Game && G.Game.state; }
  function know() { var s = S(); return s.mateKnow || (s.mateKnow = {}); }
  function city(id) { return id == null ? null : G.CITY_DATA[id]; }
  function hired(id) { return S().mates.some(function (m) { return m.id === id; }); }
  function dist(a, b) { return G.Geo.dist(a.lon, a.lat, b.lon, b.lat); }
  function dirName(a, b) {
    var ang = Math.atan2(b.lat - a.lat, G.Geo.wrapLon(b.lon - a.lon)) * 180 / Math.PI, n = ['동', '북동', '북', '북서', '서', '남서', '남', '남동'];
    return n[Math.round(((ang + 360) % 360) / 45) % 8] + '쪽';
  }
  function daysTo(a, b) { return Math.max(2, Math.round(dist(a, b) * 1.6)); }
  function ymd(day) { var s = S(), back = s.day - day, t = new Date(s.date.y, s.date.m - 1, s.date.d - back); return t.getFullYear() + '년 ' + (t.getMonth() + 1) + '월'; }

  /** 소식을 적는다 (같은 사람은 새 소식으로 덮는다 — 함께 항해했던 사실·남은 이야기는 남긴다) */
  MK.know = function (id, cityId, how) {
    var s = S(); if (!s || !G.MATE[id]) return;
    var K0 = know(), old = K0[id] || {};
    K0[id] = { c: cityId == null ? old.c : cityId, d: s.day, how: how, crew: old.crew || how === 'crew' || undefined };
  };
  /** 지금 함께 항해하는 부하는 「인연이 있던 사람」으로 남긴다 (달마다·불러올 때) */
  MK.syncCrew = function () {
    var s = S(); if (!s || !s.mates) return [];
    var K0 = know();
    s.mates.forEach(function (m) { if (!G.MATE[m.id]) return; var o = K0[m.id]; if (!o) K0[m.id] = { c: null, d: s.day, how: 'crew', crew: true }; else o.crew = true; });
    return [];
  };
  /** 만났거나 인연이 있던 사람인가 */
  MK.known = function (id) { var o = know()[id]; return !!o; };
  /** 그 사람에 대해 아는 것 {c, d, how, crew} 또는 null */
  MK.info = function (id) { return know()[id] || null; };

  var HOW = { met: '직접 보았다', rumor: '술집에서 들었다', tip: '여급의 귀띔', maid: '여급이 찾아 준 행방', crew: '함께 항해했다', fate: '배를 떠났다' };
  MK.HOW = HOW;
  /** 머무는 곳 글: {text, stale} — 들은 그때의 곳 */
  MK.whereText = function (id) {
    var s = S(), o = know()[id]; if (!o) return { text: '—', stale: true };
    var c = city(o.c), age = s.day - o.d, left = G.MateMove && G.MateMove.rumorStayLeft ? G.MateMove.rumorStayLeft(id) : 0;
    if (!c) return { text: '어디 있는지 모른다', stale: true };
    if (left > 0) return { text: c.name + ' — 체류 ' + left + '일 남음', stale: false };
    if (age <= K().fresh) return { text: c.name + ' — ' + (age ? age + '일 전 소식' : '오늘 소식') + ' · ' + (HOW[o.how] || ''), stale: false };
    return { text: '예전에 ' + c.name + ' (' + ymd(o.d) + ') — 지금은 떠났을지도', stale: true };
  };
  /** 수첩 「철새」에 올릴 사람: 아는 항해사 가운데 함대에 없고, 떠나지 않은 사람 */
  MK.list = function () {
    var s = S(), K0 = know();
    Object.keys(s.mateRumorStay || {}).forEach(function (id) {   // 옛 저장: 이미 행방을 들은 철새
      var h = s.mateRumorStay[id]; if (!K0[id] && h && G.MATE[id]) K0[id] = { c: h.city, d: Math.min(s.day, h.until - ((G.BALANCE.wander || {}).rumorStayDays || 59)), how: 'tip' };
    });
    return Object.keys(K0).map(function (id) { return G.MATE[id]; }).filter(function (d) {
      return d && !d.sib && !hired(d.id) && !s.flags['gone_' + d.id] && K0[d.id].c != null;
    }).sort(function (a, b) { return K0[b.id].d - K0[a.id].d; });
  };

  // ================================================================ 여급에게 행방을 부탁한다
  function seeks() { var s = S(); return s.maidSeek || (s.maidSeek = {}); }
  MK.seekOf = function (maidId) { return seeks()[maidId] || null; };
  MK.fee = function (c, st) { var base = G.MaidTip && G.MaidTip.price ? G.MaidTip.price('wander', c, st) : 150 + (c.size || 1) * 30; return Math.max(20, Math.round(base * K().fee / 10) * 10); };
  function norm(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  /** 이름으로 찾는다 — 정확히 같은 이름 (띄어쓰기만 너그럽게) */
  MK.byName = function (name) {
    var n = norm(name), n2 = n.replace(/ /g, '');
    if (!n) return [];
    return G.MATES.filter(function (d) { var x = norm(d.name); return x === n || x.replace(/ /g, '') === n2; });
  };
  /** 메뉴의 꼬리글 */
  MK.seekSub = function (m) {
    var q = MK.seekOf(m.id); if (!q) return '';
    var left = q.due - S().day;
    return left > 0 ? q.name + ' — ' + left + '일 뒤' : q.name + ' — 소식이 왔다';
  };
  /** 부탁한 소식을 들려준다 (날이 찼을 때만) — 들려주었으면 true */
  MK.deliver = async function (c, m, say) {
    var s = S(), q = MK.seekOf(m.id); if (!q || s.day < q.due) return false;
    delete seeks()[m.id];
    var d = G.MATE[q.id], fate = s.mateFate && s.mateFate[q.id];
    if (!d) { await say('부탁하신 분 말이에요… 아무도 모른대요. 미안해요.', 'sad'); return true; }
    if (hired(q.id)) { await say('부탁하신 ' + d.name + ' 말이에요. 어머, 그분 지금 제독님 배에 계시다던데요?', 'warm'); return true; }
    if (fate) {
      var hc = city(fate.home), at = city(fate.at);
      var t = fate.kind === 'death' ? d.name + '… 세상을 떠나셨대요. ' + (fate.sea ? '바다에서 장례를 치렀다고' : (at ? at.name + '의 언덕에 묻혔다고' : '')) + ' 하더라고요.' :
        fate.kind === 'health' ? d.name + U.jx(d.name, '은/는') + ' 몸이 상해서 배에서 내렸대요. ' + (hc ? hc.name + '에서 바다를 보며 지낸다고' : '고향에서 지낸다고') + ' 하던데요.' :
        d.name + U.jx(d.name, '은/는') + ' 배를 떠나 ' + (hc ? hc.name + '에서' : '고향에서') + ' 지낸대요. ' + otherWhy(fate.why);
      await say('부탁하신 소식이요. ' + t, fate.kind === 'death' ? 'sad' : 'warm');
      MK.know(q.id, fate.home, 'fate');
      G.State.log(m.name + '의 소식: ' + t);
      return true;
    }
    if (s.flags['gone_' + q.id]) { await say('부탁하신 ' + d.name + ' 말이에요. 바다를 떠났다는 소문만 들려요. 어디로 갔는지는 아무도 모른대요.', 'sad'); return true; }
    var at2 = G.MateMove ? G.MateMove.where(q.id) : null;
    if (!at2) { await say('부탁하신 ' + d.name + ' 말이에요. 요즘은 어느 술집에서도 봤다는 사람이 없대요.', 'sad'); return true; }
    var stay = K().stay;
    (s.mateRumorStay || (s.mateRumorStay = {}))[q.id] = { city: at2.id, until: s.day + stay, any: true };
    MK.know(q.id, at2.id, 'maid');
    var line = at2.id === c.id ? '어머, 그분 바로 이 도시에 계신대요! 이 술집에도 들른대요.' : at2.name + ' 술집에 계신대요. 여기서 ' + dirName(c, at2) + ' 약 ' + daysTo(c, at2) + '일이에요.';
    await say('부탁하신 ' + d.name + ' 소식이 왔어요. ' + line + ' 한 달쯤은 거기 머문다고 했대요.', 'happy');
    G.State.log(m.name + '의 소식: ' + d.name + U.jx(d.name, '이/가') + ' ' + at2.name + ' 술집에 머문다 (' + stay + '일).');
    G.UI.toast(d.name + ' — ' + at2.name + ' · ' + stay + '일 머문다', 'people', 5000);
    return true;
  };
  function otherWhy(id) {
    var r = G.MATE_LEAVE ? G.MATE_LEAVE.other.reasons.filter(function (x) { return x.id === id; })[0] : null;
    return r ? '(' + r.t + ' 떠났다고 하더라고요.)' : '';
  }
  /** 「항해사의 행방을 부탁한다」 — say(text, emotion)는 tavern.js T.maid 의 것 */
  MK.seek = async function (c, m, st, say) {
    var UI = G.UI, s = S();
    if (await MK.deliver(c, m, say)) return;
    var q = MK.seekOf(m.id);
    if (q) { await say(q.name + ' 말이죠? 아직 소식이 안 왔어요. ' + (q.due - s.day) + '일쯤 더 기다려 주세요.', 'warm'); return; }
    if (G.MaidTip && G.MaidTip.canAsk && !G.MaidTip.canAsk(st)) { await say('사람을 찾아 달라고요? …아직 잘 모르는 분 부탁은 좀 그래요. 우리 좀 더 친해지면요.', 'warm'); return; }
    await say('어떤 분을 찾으세요? 이름을 정확히 알려 주시면, 주변 뱃사람들한테 물어볼게요. 만나 보셨거나 인연이 있는 분이면 좋겠어요.', 'warm');
    var name = await UI.prompt('찾을 항해사의 이름 (정확히)', '', 30);
    if (!name) return;
    var hit = MK.byName(name);
    if (!hit.length) { await say('「' + norm(name) + '」… 그런 이름은 처음 들어요. 이름을 정확히 아세요?', 'warm'); return; }
    var known = hit.filter(function (d) { return MK.known(d.id) || hired(d.id); });
    if (!known.length) { await say(norm(name) + '… 어떤 분인지 짐작이 안 가요. 직접 만나 보셨거나 함께 지낸 분이어야 손님들한테 물어볼 수 있어요.', 'warm'); return; }
    var d = known[0];
    if (hired(d.id)) { await say('어머, ' + d.name + U.jx(d.name, '은/는') + ' 지금 제독님 배에 계시잖아요!', 'happy'); return; }
    var fate = s.mateFate && s.mateFate[d.id];
    if (!fate && !s.flags['gone_' + d.id]) {
      var at = G.MateMove ? G.MateMove.where(d.id) : null;
      if (!at || dist(c, at) > K().farDeg) { await say(d.name + '… 너무 먼 바다에 계신 것 같아요. 그쪽 소식은 이 항구까지 잘 안 와요. 미안해요.', 'sad'); return; }
    }
    var fee = MK.fee(c, st);
    var ok = await UI.confirm(U.esc(m.name) + '에게 ' + U.esc(d.name) + '의 행방을 부탁할까요?<br><span class="muted">사례금 금화 ' + U.num(fee) + '닢 · 소식이 오기까지 20일쯤 — 그 뒤에 ' + U.esc(c.name) + ' 술집의 ' + U.esc(m.name) + U.jx(m.name, '을/를') + ' 다시 찾아간다</span>', '부탁한다', '그만둔다');
    if (!ok) return;
    if (s.player.gold < fee) { UI.toast('소지금이 모자랍니다.', 'coin'); return; }
    s.player.gold -= fee;
    var days = U.ri(K().days[0], K().days[1]);
    seeks()[m.id] = { id: d.id, name: d.name, city: c.id, from: s.day, due: s.day + days, fee: fee };
    st.aff = Math.min(100, (st.aff || 0) + 1);
    await say('알았어요. 주변 뱃사람들한테 물어서 ' + d.name + '의 행방을 찾아 놓을게요. 20일쯤 걸릴 거예요. 그때 다시 들러 주세요.', 'warm');
    G.State.log(c.name + ' 술집의 ' + m.name + '에게 ' + d.name + '의 행방을 부탁했다 (' + days + '일쯤).');
    if (G.Game.refreshHud) G.Game.refreshHud();
  };

  /** 수첩 「할 일」 — 여급에게 부탁한 행방 */
  MK.html = function () {
    var s = S(); if (!s || !s.maidSeek) return '';
    var L = Object.keys(s.maidSeek).map(function (mid) { var q = s.maidSeek[mid]; q._m = mid; return q; }); if (!L.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">여급에게 부탁한 행방</h4><ul>' + L.map(function (q) {
      var mn = G.MAID && G.MAID[q._m] ? G.MAID[q._m].name : '여급', c = city(q.city), left = q.due - s.day;
      return '<li>' + U.esc(q.name) + ' — ' + U.esc((c ? c.name + ' 술집 ' : '') + mn) + ' · ' + (left > 0 ? left + '일 뒤 소식' : '<b>소식이 왔다 — 찾아가자</b>') + '</li>';
    }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._mateSeekHtml) { G.Court._mateSeekHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + MK.html(); }; }

  // ================================================================ 수첩 「철새」 (js/ui/info.js PAGES.wander)
  MK.page = function (el) {
    var s = S(), R = G.R, A = G.Art, list = MK.list(), k = K();
    el.innerHTML = '<div class="muted" style="margin-bottom:10px;font-size:16px">소식을 아는 항해사만 적힙니다 — 술집에서 직접 보았거나, 술집 주인·여관 안주인·여급에게 행방을 들었거나, 함께 항해했던 사람. ' +
      '적힌 곳은 <b>소식을 들은 그때</b>의 곳입니다. 항해사는 한 달에 한 번쯤 옮겨 다니므로, 들은 지 ' + k.fresh + '일이 지나면 흐리게 「예전에 ○○」로 바뀝니다. ' +
      '행방을 들은 철새와 여급이 찾아 준 사람은 한동안 그 항구에 머뭅니다. 만났거나 인연이 있던 항해사는 술집 여급에게 「항해사의 행방을 부탁한다」로 찾을 수 있습니다.</div>' +
      '<table class="tbl"><tr><th></th><th>이름</th><th>갈래</th><th>능력치</th><th>특기</th><th>월급</th><th>마지막으로 들은 곳</th></tr></table>';
    var tb = el.querySelector('table');
    list.forEach(function (m) {
      var w = MK.whereText(m.id), st = m.st || [];
      var kind = m.witch ? '<span class="tag">' + (m.legend ? '전설의 마녀' : '마녀') + '</span>' : m.wd ? U.esc(m.natName + ' · ' + m.typeName) + (m.prevName ? ' <small class="muted">(' + (m.gen + 1) + '세대)</small>' : '') + ' <span class="tag">철새</span>' : '<span class="tag">항해사</span>';
      var tr = U.el('tr', w.stale ? 'mk-stale' : '', '<td class="pp"></td><td><b>' + U.esc(m.name) + '</b>' + (G.Bio ? G.Bio.link(m.name) : '') + ' <small class="muted">' + (m.g === 'f' ? '여' : '남') + '</small>' + (know()[m.id] && know()[m.id].crew ? ' <small class="muted">· 옛 부하</small>' : '') + '</td>' +
        '<td style="white-space:nowrap">' + kind + '</td><td style="white-space:nowrap">' + (G.STATS || []).map(function (x, i) { return x.name.slice(0, 1) + ' ' + (st[i] == null ? '—' : st[i]); }).join(' ') + '</td>' +
        '<td>' + Object.keys(m.sk || {}).filter(function (x) { return m.sk[x] > 0 && G.SKILL_BY_ID[x]; }).map(function (x) { return G.SKILL_BY_ID[x].name + ' ' + m.sk[x]; }).join(' · ') + '</td>' +
        '<td style="white-space:nowrap">' + R.mateWage(m.id) + '닢</td><td>' + (w.stale ? '<i class="muted">' + U.esc(w.text) + '</i>' : U.esc(w.text)) + '</td>');
      try { tr.querySelector('.pp').appendChild(A.portraitCanvas(G.Scenes.mateSpec(m.id), 48)); } catch (e) { /* 그림 없음 */ }
      tb.appendChild(tr);
    });
    if (!list.length) el.appendChild(U.el('div', 'muted', '아직 소식을 아는 항해사가 없습니다. 술집에서 항해사를 찾거나 주인·여급에게 행방을 들어 보십시오.'));
  };
})(window.G = window.G || {});
