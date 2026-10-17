(function () {
  'use strict';
  var endpoint = 'https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/event';
  var presenceEndpoint = 'https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/presence';
  var version = '{{VERSION}}';
  var body = JSON.stringify({ event: 'center_view', version: '{{VERSION}}' });
  try {
    var sent = navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }));
    if (!sent) fetch(endpoint, { method: 'POST', body: body, mode: 'cors', keepalive: true, cache: 'no-store' }).catch(function () {});
  } catch (_) {}

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
  function presence() {
    if (document.hidden) return;
    try {
      fetch(presenceEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ sessionKey: presenceKey, surface: 'center', version: version }), mode: 'cors', keepalive: true, cache: 'no-store' }).catch(function () {});
    } catch (_) {}
  }
  presence();
  window.setInterval(presence, 30000);
  document.addEventListener('visibilitychange', presence);
})();
