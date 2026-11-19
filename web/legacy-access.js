/* 기존 공개 시험 주소는 한국 시간 2026-11-21 00:00에 닫는다. */
(function () {
  'use strict';
  var legacy = location.hostname === 'limeinstein.github.io' && /^\/plus-ultra(?:\/|$)/.test(location.pathname);
  var deadline = Date.parse('2026-11-21T00:00:00+09:00');
  var base = Date.now(), started = performance.now(), timer, closed = false;
  function now() { return Math.max(Date.now(), base + performance.now() - started); }
  function allowed() { return !legacy || (!closed && now() < deadline); }
  window.PU_WEB_ACCESS = { allowed: allowed };
  if (!legacy || /\/closed\.html$/.test(location.pathname)) return;
  function check() {
    clearTimeout(timer);
    if (!allowed()) {
      closed = true;
      // 다른 문서로 이동해 게임의 타이머·소리·렌더링도 함께 끝낸다.
      location.replace('/plus-ultra/closed.html');
      return;
    }
    timer = setTimeout(check, Math.min(60000, Math.max(1, deadline - now())));
  }
  function sync() {
    // 캐시되지 않은 같은 출처의 서버 시각을 사용한다. PC 시계를 뒤로 돌려도 종료한다.
    fetch('/plus-ultra/closed.html?clock=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
      .then(function (response) {
        var server = Date.parse(response.headers.get('date'));
        if (isFinite(server)) { base = server; started = performance.now(); }
        check();
      }).catch(function () { check(); });
  }
  check();
  if (!closed) { sync(); setInterval(sync, 60000); }
  document.addEventListener('visibilitychange', check);
  window.addEventListener('pageshow', check);
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (name) {
    window.addEventListener(name, function (event) {
      if (!allowed()) { event.preventDefault(); event.stopImmediatePropagation(); check(); }
    }, { capture: true, passive: false });
  });
})();
