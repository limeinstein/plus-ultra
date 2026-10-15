/* Privacy-first aggregate telemetry for the public beta only. */
(function (G) {
  'use strict';
  if (window.PU_WEB_CHANNEL !== 'beta' || !window.PU_TELEMETRY_ENDPOINT) return;

  var endpoint = window.PU_TELEMETRY_ENDPOINT;
  var title = G.Scenes && G.Scenes.title;
  var version = title && title.version ? title.version : '';
  var lastActivity = 0;

  function send(event) {
    var body = JSON.stringify({ event: event, version: version });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }))) return;
      fetch(endpoint, { method: 'POST', body: body, mode: 'cors', keepalive: true, cache: 'no-store' }).catch(function () {});
    } catch (_) {}
  }

  function active() { lastActivity = Date.now(); }
  ['keydown', 'pointerdown', 'touchstart'].forEach(function (name) {
    window.addEventListener(name, active, { passive: true });
  });

  send('game_start');
  window.setInterval(function () {
    if (!document.hidden && lastActivity && Date.now() - lastActivity < 75000) send('active_minute');
  }, 60000);
})(window.G || (window.G = {}));
