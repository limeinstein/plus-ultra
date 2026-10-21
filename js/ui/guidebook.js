/* 게임 안 「플레이 가이드북」 (G.Guidebook) — 타이틀 「조작 안내」 창 맨 위 단추로 연다.
   · 내용은 js/data/guidebook.js (G.GUIDEBOOK — 원고 docs/guidebook.md 에서 tools/guidebook/build.py 로 만든다)
   · 쪽 넘기기 (2026-10-21): 장(##)의 절(###) 하나가 한 쪽이다. 장 머리말은 그 장 첫 쪽 위에 붙는다.
     왼쪽 차례(장 · 쪽) · 오른쪽 한 쪽, 아래 「◀ 이전 쪽 / 다음 쪽 ▶」. ←→ 쪽 넘기기, PageUp·PageDown 장 넘기기, 그림을 누르면 크게.
   · 그림은 images/guide/ — G.Img 로 읽어(아티팩트 그림 묶음도) 없으면 자리만 감춘다.
   · 마지막에 본 쪽을 기억한다 (localStorage 'plusultra_guide_pg', 못 쓰면 그만). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var GB = G.Guidebook = {};
  var LS = 'plusultra_guide_pg';
  function lastPg() { try { return +(localStorage.getItem(LS) || 0) || 0; } catch (e) { return 0; } }
  function keepPg(i) { try { localStorage.setItem(LS, String(i)); } catch (e) { /* 저장 못 함 */ } }

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
    var unkey = UI.pushKey(function (e) { if (G.Keys.is(e, 'cancel') || G.Keys.is(e, 'confirm') || G.Keys.is(e, 'confirmAlt')) { close(); return true; } return true; });
    function close() { unkey(); if (back.parentNode) back.parentNode.removeChild(back); }
    back.onclick = close;
  }

  /** 장들을 쪽으로 나눈다: [{ch, k(장 안의 쪽 번호), n(장의 쪽 수), title, html}] */
  GB.pages = function (B) {
    var out = [];
    (B || G.GUIDEBOOK).chapters.forEach(function (c, ci) {
      var parts = c.html.split(/(?=<h3 data-sec=")/), intro = '', secs = [];
      parts.forEach(function (h) { if (/^<h3 data-sec="/.test(h)) secs.push(h); else intro += h; });
      if (!secs.length) secs = [''];
      secs.forEach(function (h, k) {
        var t = (h.match(/^<h3 data-sec="\d+">([\s\S]*?)<\/h3>/) || [])[1];
        out.push({ ch: ci, k: k, n: secs.length, title: t ? t.replace(/<[^>]+>/g, '') : c.title, html: (k === 0 && intro.trim() ? '<div class="gb-lead">' + intro + '</div>' : '') + h });
      });
    });
    return out;
  };

  GB.open = function (start) {
    var B = G.GUIDEBOOK;
    if (!B || !B.chapters || !B.chapters.length) { UI.alert('가이드북을 찾지 못했습니다.'); return Promise.resolve(); }
    var chs = B.chapters, pgs = GB.pages(B), cur = Math.max(0, Math.min(pgs.length - 1, start == null ? lastPg() : start));
    function first(ci) { for (var i = 0; i < pgs.length; i++) if (pgs[i].ch === ci) return i; return 0; }
    var nav = '<div class="gb-nav">' + chs.map(function (c, ci) {
      var mine = pgs.map(function (p, i) { return { p: p, i: i }; }).filter(function (o) { return o.p.ch === ci; });
      return '<div class="gb-ch" data-ch="' + ci + '"><b data-pg="' + first(ci) + '">' + (ci + 1) + '. ' + U.esc(c.title) + '</b>' +
        (mine.length > 1 ? '<div class="gb-secs">' + mine.map(function (o) { return '<div class="gb-sec" data-pg="' + o.i + '">' + U.esc(o.p.title) + '</div>'; }).join('') + '</div>' : '') + '</div>';
    }).join('') + '</div>';
    var w = UI.window({ title: B.title, icon: 'book', width: 1340, height: 850, parch: false,
      html: '<div class="gb">' + nav + '<div class="gb-page parch"></div></div>',
      buttons: [{ label: '◀ 이전 쪽', value: 'prev', id: 'prev', onClick: function () { show(cur - 1); return false; } },
        { label: '다음 쪽 ▶', value: 'next', id: 'next', cls: 'navy', onClick: function () { show(cur + 1); return false; } },
        { label: '닫기', value: 1 }],
      onKey: function (e) {
        if (G.Keys.is(e, 'right')) { show(cur + 1); return true; }
        if (G.Keys.is(e, 'left')) { show(cur - 1); return true; }
        if (e.key === 'PageDown') { show(first(Math.min(chs.length - 1, pgs[cur].ch + 1))); return true; }
        if (e.key === 'PageUp') { var c0 = pgs[cur].ch; show(first(pgs[cur].k > 0 ? c0 : Math.max(0, c0 - 1))); return true; }
        return false;
      } });
    w.el.classList.add('gb-win');
    var page = w.content.querySelector('.gb-page');
    function show(i) {
      if (i < 0 || i >= pgs.length) return;
      cur = i; keepPg(i);
      var p = pgs[i], c = chs[p.ch];
      page.innerHTML = '<div class="gb-kicker">' + (p.ch + 1) + '장 ' + U.esc(c.title) + (p.n > 1 ? ' · ' + (p.k + 1) + '/' + p.n + '쪽' : '') + '<span>' + (i + 1) + ' / ' + pgs.length + '</span></div>' +
        (p.k === 0 ? '<h2>' + U.esc(c.title) + '</h2>' : '') + p.html;
      U.$$('img[data-gk]', page).forEach(loadImg);
      U.$$('figure.gb-fig img', page).forEach(function (img) { img.onclick = function () { if (img.src) zoom(img.src, img.alt); }; });
      U.$$('.gb-ch', w.content).forEach(function (el) { el.classList.toggle('on', +el.dataset.ch === p.ch); });
      U.$$('.gb-sec', w.content).forEach(function (el) { el.classList.toggle('on', +el.dataset.pg === i); });
      var on = w.content.querySelector('.gb-sec.on') || w.content.querySelector('.gb-ch.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
      if (w.prev) w.prev.disabled = i === 0;
      if (w.next) w.next.disabled = i === pgs.length - 1;
      page.scrollTop = 0;
    }
    U.$$('[data-pg]', w.content).forEach(function (el) { el.onclick = function () { show(+el.dataset.pg); }; });
    show(cur);
    GB._show = show;   // 시험용 (tests/guidebook_smoke.js)
    return w.result;
  };
})(window.G = window.G || {});
