/* 도시 후원: 성능·수익 보상 없이 도시와 가문에 남기는 다섯 단계 기념 사업. */
(function (G) {
  'use strict';
  var P = G.Patronage = {}, U = G.U;
  function S() { return G.Game.state; }
  function K() { return G.BALANCE.commerce.patronage; }
  function state() { var s = S(), p = s.patronage || (s.patronage = {}); if (!p.cities) p.cities = {}; return p; }
  function record(c, id) { var city = state().cities[c.id]; return city && city[id]; }
  P.level = function (c, id) { var r = record(c, id); return r ? Math.min(K().costs.length, r.level || 0) : 0; };
  P.cost = function (c, id) { return K().projects.some(function (d) { return d.id === id; }) ? K().costs[P.level(c, id)] : null; };
  P.records = function () {
    var out = [], cities = state().cities;
    Object.keys(cities).forEach(function (cid) { K().projects.forEach(function (d) {
      var r = cities[cid][d.id]; if (r && r.level) out.push({ city: G.CITY_DATA[cid], project: d, record: r });
    }); }); return out;
  };
  P.contribute = function (c, id) {
    var cost = P.cost(c, id), s = S();
    if (!c || c.outpost || !G.R.cityExists(c) || cost == null || s.player.gold < cost) return false;
    var cities = state().cities, city = cities[c.id] || (cities[c.id] = {}), lv = P.level(c, id), def = K().projects.filter(function (d) { return d.id === id; })[0];
    s.player.gold -= cost;
    var r = city[id] || (city[id] = { level: 0, spent: 0, plaques: [] });
    r.level = lv + 1; r.spent += cost;
    r.plaques.push({ name: s.player.name, date: U.dateNum(s.date), stage: K().names[lv] });
    G.State.log(c.name + ' ' + def.name + ' — ' + K().names[lv] + ' 완공, ' + U.num(cost) + '닢 후원.');
    G.Game.refreshHud(); return true;
  };
  P.menuItem = function (c) {
    var n = K().projects.reduce(function (sum, d) { return sum + P.level(c, d.id); }, 0);
    return { label: '도시 후원·기념 사업', icon: 'seal', sub: n ? '후원 ' + n + '단계 · 명판 보기' : '쉼터·서고·기념관', onClick: function () { return P.open(c); } };
  };
  P.open = async function (c) {
    for (;;) {
      var html = '<p>도시에 남을 기념 사업을 후원합니다. 완공할 때마다 제독과 가문의 이름을 새긴 명판이 남습니다.</p>' +
        '<div class="muted">거래·전투 능력과 정기 수입이 붙지 않는 기념 사업입니다. 후원금은 돌려받지 못합니다.</div>';
      K().projects.forEach(function (d) {
        var lv = P.level(c, d.id), r = record(c, d.id), cost = P.cost(c, d.id);
        html += '<div class="hint-item" style="margin-top:12px"><div class="tx"><b>' + G.icon(d.icon) + ' ' + d.name + '</b> · ' + lv + '/' + K().costs.length + '단계' +
          '<p>' + d.desc + '</p><div style="color:#a57923;letter-spacing:5px">' + Array.from({ length: K().costs.length }, function (_, i) { return i < lv ? '◆' : '◇'; }).join('') + '</div>' +
          (r ? '<p>누적 후원 ' + U.num(r.spent) + '닢 · ' + U.esc(r.plaques[r.plaques.length - 1].name) + '의 ' + K().names[lv - 1] + '</p>' : '') +
          '<small>' + (cost == null ? '모든 기념 사업 완공' : '다음: ' + K().names[lv] + ' · ' + U.num(cost) + '닢') + '</small></div></div>';
      });
      var buttons = K().projects.filter(function (d) { return P.cost(c, d.id) != null; }).map(function (d) { return { label: d.name + ' 후원', value: d.id }; });
      buttons.push({ label: '모든 도시의 명판', value: 'records' }, { label: '돌아간다', value: null });
      var v = await G.UI.window({ title: c.name + ' 도시 후원', icon: 'seal', width: 760, html: html, buttons: buttons }).result;
      if (!v) return;
      if (v === 'records') {
        var rows = P.records().map(function (x) { return '<tr><td>' + U.esc(x.city.name) + ' ' + x.project.name + '</td><td>' + K().names[x.record.level - 1] + '</td><td>' + U.num(x.record.spent) + '닢</td><td>' + x.record.plaques.map(function (p) { return U.esc(p.name) + ' · ' + p.date; }).join('<br>') + '</td></tr>'; }).join('');
        await G.UI.alert(rows ? '<table class="tbl"><tr><th>기념 사업</th><th>완공 단계</th><th>후원금</th><th>명판</th></tr>' + rows + '</table>' : '아직 후원한 기념 사업이 없습니다.', '가문의 도시 후원 기록'); continue;
      }
      var cost = P.cost(c, v); if (cost == null) continue;
      if (S().player.gold < cost) { G.UI.toast('후원금이 모자랍니다.', 'coin'); continue; }
      if (!(await G.UI.confirm('기념 사업에 ' + U.num(cost) + '닢을 후원합니다. 남는 금화 ' + U.num(S().player.gold - cost) + '닢. 완공 명판에 ' + U.esc(S().player.name) + '의 이름을 새깁니다.', '후원한다', '그만둔다'))) continue;
      if (P.contribute(c, v)) G.UI.toast(c.name + '의 기념 명판에 이름을 새겼습니다.', 'seal', 4500);
    }
  };
})(window.G = window.G || {});
