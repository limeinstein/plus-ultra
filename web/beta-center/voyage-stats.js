(function () {
  'use strict';
  var STATS_API = 'https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/stats';
  var status = document.getElementById('voyage-stats-status');
  var pins = document.getElementById('voyage-map-pins');
  var empty = document.getElementById('voyage-map-empty');

  function num(value) { return Number(value || 0).toLocaleString('ko-KR'); }
  function days(value) {
    var n = Math.max(0, Number(value) || 0), years = Math.floor(n / 365), rest = n % 365;
    return (years ? years + '년 ' : '') + rest + '일';
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function put(id, value) { var node = document.getElementById(id); if (node) node.textContent = value; }

  function ranking(id, rows, kind) {
    var list = document.getElementById(id); if (!list) return; clear(list);
    if (!rows || !rows.length) {
      var none = document.createElement('li'); none.className = 'ranking-empty'; none.textContent = '현재 접속 항해가 없습니다.'; list.appendChild(none); return;
    }
    rows.slice(0, 5).forEach(function (row, index) {
      var item = document.createElement('li'), rank = document.createElement('b'), who = document.createElement('span'), value = document.createElement('strong'), sub = document.createElement('small');
      rank.textContent = String(index + 1); who.textContent = row.alias; value.textContent = kind === 'fame' ? num(row.fame) : days(row.playDays);
      sub.textContent = row.currentPlace + ' · 발견 ' + num(row.foundDiscoveryCount) + ' / 미발견 ' + num(row.missingDiscoveryCount) + ' · 도시 ' + num(row.foundCityCount) + ' / 미방문 ' + num(row.missingCityCount);
      item.appendChild(rank); item.appendChild(who); item.appendChild(value); item.appendChild(sub); list.appendChild(item);
    });
  }

  function map(rows) {
    clear(pins); var shown = 0;
    (rows || []).forEach(function (row) {
      var lon = Number(row.lon), lat = Number(row.lat);
      if (!isFinite(lon) || !isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) return;
      var pin = document.createElement('span');
      pin.className = 'voyage-pin'; pin.style.left = ((lon + 180) / 360 * 100) + '%'; pin.style.top = ((90 - lat) / 180 * 100) + '%';
      pin.textContent = row.alias; pin.title = row.alias + ' · ' + row.currentPlace + ' · 명성 ' + num(row.fame) + ' · ' + days(row.playDays);
      pin.tabIndex = 0; pin.setAttribute('aria-label', pin.title + ' · 동경 ' + lon.toFixed(2) + '도 · 북위 ' + lat.toFixed(2) + '도');
      pins.appendChild(pin); shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }

  function summary(data) {
    var d = data.discoveryRanking && data.discoveryRanking[0], c = data.cityRanking && data.cityRanking[0];
    var pd = data.popularDiscoveries && data.popularDiscoveries[0], pc = data.popularCities && data.popularCities[0];
    put('discovery-champion', d ? d.alias : '—'); put('discovery-champion-detail', d ? num(d.foundDiscoveryCount) + '개 발견 · 미발견 ' + num(d.missingDiscoveryCount) + '개' : '접속 항해 없음');
    put('city-champion', c ? c.alias : '—'); put('city-champion-detail', c ? num(c.foundCityCount) + '곳 방문 · 미방문 ' + num(c.missingCityCount) + '곳' : '접속 항해 없음');
    put('popular-discovery', pd ? pd.name : '—'); put('popular-discovery-detail', pd ? num(pd.count) + '명의 접속 항해가 발견' : '집계 대기 중');
    put('popular-city', pc ? pc.name : '—'); put('popular-city-detail', pc ? num(pc.count) + '명의 접속 항해가 방문' : '집계 대기 중');
  }

  function render(data) {
    map(data.voyages || []); ranking('fame-ranking', data.fameRanking || [], 'fame'); ranking('duration-ranking', data.playRanking || [], 'days'); summary(data);
    if (status) status.textContent = '현재 접속 항해 ' + num((data.voyages || []).length) + '명 · ' + new Date(data.generatedAt).toLocaleTimeString('ko-KR') + ' 갱신';
  }

  function load() {
    fetch(STATS_API, { cache: 'no-store', mode: 'cors' }).then(function (response) { if (!response.ok) throw new Error('stats'); return response.json(); })
      .then(render).catch(function () { if (status) { status.textContent = '항해 통계를 불러오지 못했습니다. 잠시 뒤 다시 확인해 주세요.'; status.classList.add('error'); } });
  }
  load(); window.setInterval(load, 30000);
})();
