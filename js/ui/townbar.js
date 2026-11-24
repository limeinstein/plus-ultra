/* 마을 하단 황동 인장 메뉴. 실제 단추와 동작은 city.js·Info.settingsButton의 것을 그대로 쓴다. */
(function (G) {
  'use strict';
  var T = G.TownBar = {}, observer = null, watching = false;
  var keys = ['admiral', 'fleet', 'items', 'disc', 'contract', 'map', 'log', 'notebook', 'settings'];
  function fit() {
    var screen = G.UI.screen(), bar = screen && screen.querySelector('.town-medallions');
    if (!bar || !bar.isConnected) return;
    var f = G.FX.townInfoBar, caption = screen.querySelector('.caption');
    var above = bar.offsetLeft + bar.offsetWidth + f.captionRoom > screen.clientWidth;
    bar.classList.toggle('caption-above', above);
    if (caption) caption.style.bottom = above ? (f.bottom + f.height + 12) + 'px' : '';
    [].forEach.call(bar.querySelectorAll('.tb-label'), function (label) {
      label.style.fontSize = f.font + 'px';
      // 번역이나 큰 글꼴에서도 이름을 생략하지 않는다. 실제 칸 높이·폭에 맞춰 조금 줄인다.
      for (var size = f.font; size > f.minFont && (label.scrollWidth > label.clientWidth + 1 || label.scrollHeight > label.clientHeight + 1); size--) label.style.fontSize = (size - 1) + 'px';
    });
  }
  T.mount = function (bar) {
    if (bar.classList.contains('town-medallions')) return;
    var f = G.FX.townInfoBar, U = G.U, buttons = Array.prototype.slice.call(bar.querySelectorAll('button'));
    bar.classList.remove('wood'); bar.classList.add('town-medallions');
    bar.setAttribute('role', 'navigation'); bar.setAttribute('aria-label', '마을 정보 메뉴');
    ['width', 'left', 'bottom', 'height', 'medal', 'labelHeight', 'gap', 'font'].forEach(function (k) { bar.style.setProperty('--tb-' + k, f[k] + 'px'); });
    buttons.forEach(function (button, index) {
      var icon = button.querySelector('svg'), text = button.textContent.trim();
      // 마을의 설정 인장에는 햇살 모양 대신 톱니바퀴의 외곽선을 쓴다.
      if (icon && keys[index] === 'settings') icon.innerHTML = '<path d="M9 3l.5-1h5l.5 3 2 .9 2.5-1 2 3.4-2 2 .1 2.4 2 2-2 3.5-2.7-1-2 1L14 22h-4l-.5-2.8-2-1-2.6 1-2-3.5 2-2v-2.4l-2-2 2-3.4 2.6 1 2-.9z"/><circle cx="12" cy="12" r="3.4"/>';
      var medal = U.el('span', 'tb-medal'), label = U.el('span', 'tb-label');
      medal.setAttribute('aria-hidden', 'true'); if (icon) medal.appendChild(icon);
      label.textContent = text; button.replaceChildren(medal, label);
      button.classList.remove('small', 'ghost'); button.type = 'button'; button.dataset.townInfo = keys[index] || '';
      button.setAttribute('aria-haspopup', 'dialog');
      button.addEventListener('keydown', function (e) {
        // 선택한 정보 메뉴를 누르는 키가 뒤의 거리 이동·건물 입장으로 새지 않게 한다.
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) button.click(); return; }
        var target = e.key === 'ArrowRight' ? (index + 1) % buttons.length : e.key === 'ArrowLeft' ? (index + buttons.length - 1) % buttons.length : e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : -1;
        if (target >= 0) { e.preventDefault(); e.stopPropagation(); buttons[target].focus(); }
      });
    });
    if (!watching) {
      watching = true;
      if (window.ResizeObserver) { observer = new ResizeObserver(fit); observer.observe(document.getElementById('ui')); }
      else window.addEventListener('resize', fit);
      if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fit);
    }
    fit(); requestAnimationFrame(fit); // 같은 프레임에 뒤이어 만들어지는 날짜·위치 표시도 맞춘다.
  };
})(window.G = window.G || {});
