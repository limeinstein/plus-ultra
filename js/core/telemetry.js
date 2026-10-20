/* Privacy-first aggregate telemetry for the public beta only. */
(function (G) {
  'use strict';
  if (window.PU_WEB_CHANNEL !== 'beta' || !window.PU_TELEMETRY_ENDPOINT) return;

  var endpoint = window.PU_TELEMETRY_ENDPOINT;
  var presenceEndpoint = endpoint.replace(/\/api\/event(?:\?.*)?$/, '/api/presence');
  var title = G.Scenes && G.Scenes.title;
  var version = title && title.version ? title.version : '';
  var lastActivity = 0;

  function sessionKey() {
    var key = '';
    try {
      key = sessionStorage.getItem('pu_presence_session') || '';
      if (!key) {
        key = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(16) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
        sessionStorage.setItem('pu_presence_session', key);
      }
    } catch (_) { key = Date.now().toString(16) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2); }
    return key;
  }
  var presenceKey = sessionKey();

  function voyageSnapshot() {
    var s = G.Game && G.Game.state;
    if (!s || !s.player || !s.loc || !G.CITY_DATA || !G.DISCOVERIES) return null;
    var currentCity = s.loc.mode === 'city' && G.CITY_DATA[s.loc.city] ? G.CITY_DATA[s.loc.city] : null;
    var current = {
      name: currentCity ? currentCity.name : s.loc.mode === 'land' ? '뭍 탐험 중' : '해상 항해 중',
      lon: Math.round(Number(s.loc.lon || (currentCity && currentCity.lon) || 0) * 1000),
      lat: Math.round(Number(s.loc.lat || (currentCity && currentCity.lat) || 0) * 1000)
    };
    var foundDiscoveries = [], missingDiscoveries = [];
    G.DISCOVERIES.forEach(function (d) {
      var row = { id: String(d.id), name: String(d.name || d.id), how: String(d.how || ''), city: d.city != null && G.CITY_DATA[d.city] ? String(G.CITY_DATA[d.city].name) : '' };
      if (G.Disc && G.Disc.foundByMe && G.Disc.foundByMe(d.id)) foundDiscoveries.push(row);
      else missingDiscoveries.push(row);
    });
    var foundCities = [], missingCities = [];
    G.CITY_DATA.forEach(function (c) {
      if (G.R && G.R.cityExists && !G.R.cityExists(c)) return;
      var row = { id: Number(c.id), name: String(c.name || c.id) };
      if ((s.visited && s.visited[c.id]) || (currentCity && currentCity.id === c.id)) foundCities.push(row);
      else missingCities.push(row);
    });
    return {
      current: current,
      fame: Math.max(0, Math.round(Number(s.player.fame) || 0)),
      playDays: Math.max(0, Math.round(Number(s.day) || 0)),
      foundDiscoveries: foundDiscoveries,
      missingDiscoveries: missingDiscoveries,
      foundCities: foundCities,
      missingCities: missingCities
    };
  }

  function send(event) {
    var body = JSON.stringify({ event: event, version: version });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }))) return;
      fetch(endpoint, { method: 'POST', body: body, mode: 'cors', keepalive: true, cache: 'no-store' }).catch(function () {});
    } catch (_) {}
  }

  function active() { lastActivity = Date.now(); }
  function presence() {
    if (document.hidden) return;
    try {
      fetch(presenceEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ sessionKey: presenceKey, surface: 'game', version: version, voyage: voyageSnapshot() }), mode: 'cors', cache: 'no-store' }).catch(function () {});
    } catch (_) {}
  }
  ['keydown', 'pointerdown', 'touchstart'].forEach(function (name) {
    window.addEventListener(name, active, { passive: true });
  });

  send('game_start');
  presence();
  window.setInterval(presence, 30000);
  document.addEventListener('visibilitychange', presence);
  window.setInterval(function () {
    if (!document.hidden && lastActivity && Date.now() - lastActivity < 75000) send('active_minute');
  }, 60000);
})(window.G || (window.G = {}));
