(function () {
  'use strict';
  var endpoint = 'https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/event';
  var body = JSON.stringify({ event: 'center_view', version: '{{VERSION}}' });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }))) return;
    fetch(endpoint, { method: 'POST', body: body, mode: 'cors', keepalive: true, cache: 'no-store' }).catch(function () {});
  } catch (_) {}
})();
