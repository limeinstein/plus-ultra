/* 게임 안 「플레이 가이드북」 (G.Guidebook) — 타이틀 「조작 안내」 창 맨 위 단추로 연다.
   · 내용은 js/data/guidebook.js (G.GUIDEBOOK — 원고 docs/guidebook.md 에서 tools/guidebook/build.py 로 만든다)
   · 왼쪽 차례(장 · 절) · 오른쪽 본문, 아래 「이전 장 / 다음 장」. ←→(또는 PageUp·PageDown) 장 넘기기, 그림을 누르면 크게.
   · 그림은 images/guide/ — G.Img 로 읽어(아티팩트 그림 묶음도) 없으면 자리만 감춘다.
   · 마지막에 본 장을 기억한다 (localStorage 'plusultra_guide_ch', 못 쓰면 그만). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var GB = G.Guidebook = {};
  var LS = 'plusultra_guide_ch';
  function lastCh() { try { return +(localStorage.getItem(LS) || 0) || 0; } catch (e) { return 0; } }
  function keepCh(i) { try { localStorage.setItem(LS, String(i)); } catch (e) { /* 저장 못 함 */ } }

  /** 그림 하나를 G.Img 로 읽어 붙인다 (아티팩트 묶음이면 묶음이 올 때까지 기다림) */
  function loadImg(img) {
    var k = img.getAttribute('data-gk'), I = G.Img;
    var fig = img.closest('figure');
    if (!I || !k || !I.has(k)) { if (fig) fig.style.display = 'none'; return; }
    fig.classList.add('wait');
    I.resolve([k]).then(function (r) {
      if (r && r.img && r.img.src) { img.src = r.img.src; fig.classList.remove('wait'); }
      else if (fig) fig.style.display = 'none';
    }, function () { if (fig) fig.style.display = 'none'; });
  }

  /** 그림을 크게 (창 위에 덮어 보임 · 누르거나 Esc로 닫음) */
  function zoom(src, cap) {
    var back = U.el('div', 'gb-zoom', '<img src="' + src + '" alt=""><div class="gb-zcap">' + U.esc(cap || '') + '</div>');
    document.getElementById('ui').appendChild(back);
    var unkey = UI.pushKey(function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { close(); return true; } return true; });
    function close() { unkey(); if (back.parentNode) back.parentNode.removeChild(back); }
    back.onclick = close;
  }

  GB.open = function (start) {
    var B = G.GUIDEBOOK;
    if (!B || !B.chapters || !B.chapters.length) { UI.alert('가이드북을 찾지 못했습니다.'); return Promise.resolve(); }
    var chs = B.chapters, cur = Math.max(0, Math.min(chs.length - 1, start == null ? lastCh() : start));
    var nav = '<div class="gb-nav">' + chs.map(function (c, i) {
      return '<div class="gb-ch" data-ch="' + i + '"><b>' + (i + 1) + '. ' + U.esc(c.title) + '</b>' +
        (c.secs.length ? '<div class="gb-secs">' + c.secs.map(function (s, j) { return '<div class="gb-sec" data-ch="' + i + '" data-sec="' + j + '">' + U.esc(s) + '</div>'; }).join('') + '</div>' : '') + '</div>';
    }).join('') + '</div>';
    var w = UI.window({ title: B.title, icon: 'book', width: 1340, height: 850, parch: false,
      html: '<div class="gb">' + nav + '<div class="gb-page parch"></div></div>',
      buttons: [{ label: '◀ 이전 장', value: 'prev', id: 'prev', onClick: function () { show(cur - 1); return false; } },
        { label: '다음 장 ▶', value: 'next', id: 'next', cls: 'navy', onClick: function () { show(cur + 1); return false; } },
        { label: '닫기', value: 1 }],
      onKey: function (e) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { show(cur + 1); return true; }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { show(cur - 1); return true; }
        return false;
      } });
    w.el.classList.add('gb-win');
    var page = w.content.querySelector('.gb-page');
    function show(i, sec) {
      if (i < 0 || i >= chs.length) return;
      cur = i; keepCh(i);
      var c = chs[i];
      page.innerHTML = '<div class="gb-kicker">' + (i + 1) + ' / ' + chs.length + '</div><h2>' + U.esc(c.title) + '</h2>' + c.html;
      U.$$('img[data-gk]', page).forEach(loadImg);
      U.$$('figure.gb-fig img', page).forEach(function (img) { img.onclick = function () { if (img.src) zoom(img.src, img.alt); }; });
      U.$$('.gb-ch', w.content).forEach(function (el) { el.classList.toggle('on', +el.dataset.ch === i); });
      var on = w.content.querySelector('.gb-ch.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
      if (w.prev) w.prev.disabled = i === 0;
      if (w.next) w.next.disabled = i === chs.length - 1;
      var h = sec != null ? page.querySelector('h3[data-sec="' + sec + '"]') : null;
      page.scrollTop = h ? h.offsetTop - 12 : 0;
    }
    U.$$('.gb-ch > b', w.content).forEach(function (el) { el.onclick = function () { show(+el.parentNode.dataset.ch); }; });
    U.$$('.gb-sec', w.content).forEach(function (el) { el.onclick = function () { show(+el.dataset.ch, +el.dataset.sec); }; });
    show(cur);
    return w.result;
  };
})(window.G = window.G || {});
