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
      fetch(presenceEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ sessionKey: presenceKey, surface: 'game', version: version }), mode: 'cors', keepalive: true, cache: 'no-store' }).catch(function () {});
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
