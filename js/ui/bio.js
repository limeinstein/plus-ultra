/* 실존 인물의 짧은 이야기 창 (G.Bio)
   · G.Bio.find(이름) — G.BIOS에서 찾는다. 「통제사 이순신」·「펠리페 2세 (에스파냐 국왕 겸)」처럼 앞뒤에 말이 붙은 이름도 낱말 경계로 찾는다.
     손으로 쓴 이야기가 없는 후원자(군주·귀족)는 그 자리와 재위 해로 짧은 소개를 만든다.
   · G.Bio.show(이름, {portrait}) — 초상과 이야기를 띄운다. 대화창의 이름표·초상을 누르면 불린다(js/ui/ui.js).
   · 철새(떠돌이 항해사)처럼 지어낸 사람은 d.story가 있으면 그것을, 없으면 찾지 않는다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var B = {};
  G.Bio = B;
  var keys = null;
  function keyList() {
    if (keys) return keys;
    keys = Object.keys(G.BIOS || {}).sort(function (a, b) { return b.length - a.length; });   // 긴 이름부터 (「페르난도 2세」가 「페르난도」보다 먼저)
    return keys;
  }
  B.reset = function () { keys = null; holderIdx = null; };
  function bounded(name, k) {
    var i = name.indexOf(k);
    while (i >= 0) {
      var pre = i === 0 ? ' ' : name.charAt(i - 1), post = i + k.length >= name.length ? ' ' : name.charAt(i + k.length);
      if (/[\s(·,\[]/.test(pre) && /[\s)·,(\]]/.test(post)) return true;
      i = name.indexOf(k, i + 1);
    }
    return false;
  }
  var holderIdx = null;
  function holders() {
    if (holderIdx) return holderIdx;
    holderIdx = {};
    (G.SPONSORS || []).forEach(function (sp) {
      sp.holders.forEach(function (h) {
        if (h[4] === 'g' || h[2] === sp.title || holderIdx[h[2]]) return;
        holderIdx[h[2]] = { sp: sp, h: h };
      });
    });
    return holderIdx;
  }
  /** 이 이름의 이야기 — {key, text, auto} 또는 null */
  B.find = function (name) {
    if (!name) return null;
    name = String(name).replace(/<[^>]+>/g, '').trim();
    var bios = G.BIOS || {};
    // 지어낸 사람(철새·마녀)은 자기 이야기를 가진다
    var mate = (G.MATES || []).filter(function (m) { return m.name === name; })[0];
    if (mate && mate.wd) return mate.story ? { key: name, text: mate.story, made: true } : null;
    if (bios[name]) return { key: name, text: bios[name] };
    var ks = keyList();
    for (var i = 0; i < ks.length; i++) if (ks[i].length >= 2 && bounded(name, ks[i])) return { key: ks[i], text: bios[ks[i]] };
    var hx = holders(), hk = hx[name];
    if (!hk) for (var k in hx) if (k.length >= 3 && bounded(name, k)) { hk = hx[k]; break; }
    if (hk) {
      var sp = hk.sp, h = hk.h, c = G.CITY_DATA[sp.city];
      var end = h[1] >= 9999 ? '' : h[1] + '년';
      return { key: h[2], auto: true, text: h[2] + ' — ' + sp.title + (c ? '(' + c.name + ')' : '') + '. ' + h[0] + '년부터 ' + (end ? end + '까지 ' : '') + '그 자리에 있었다' + (h[4] === 'x' ? ' (죽음이 아니라 자리에서 물러나 끝났다)' : '') + '.' };
    }
    return null;
  };
  B.has = function (name) { return !!B.find(name); };

  /** 이야기 창 */
  B.show = function (name, opts) {
    var b = B.find(name); if (!b) return Promise.resolve();
    opts = opts || {};
    var html = '<div class="biobox">' + (opts.portrait ? '<div class="bio-face"></div>' : '') +
      '<div class="bio-text"><div class="bio-name">' + U.esc(b.key) + '</div>' +
      '<p>' + U.esc(b.text) + '</p>' +
      (b.auto ? '<p class="muted small">— 이 사람의 자세한 이야기는 아직 적어 두지 못했다.</p>' : b.made ? '<p class="muted small">— 떠돌이 항해사가 들려준 제 이야기</p>' : '<p class="muted small">— 실제 역사 속 인물. 게임 속 모습은 이야기를 위해 꾸민 것이다.</p>') +
      '</div></div>';
    var win = UI.window({ title: b.made ? '살아온 이야기' : '인물 이야기', icon: 'book', width: 720, clickAny: true, html: html, buttons: [{ label: '닫기', value: 1, cls: 'navy' }] });
    if (opts.portrait) {
      try {
        var cv = opts.portrait instanceof HTMLCanvasElement ? opts.portrait : G.Art.portraitCanvas(opts.portrait, 180);
        win.content.querySelector('.bio-face').appendChild(cv);
      } catch (e) { /* 그림이 없으면 비워 둔다 */ }
    }
    return win.result;
  };

  /** 이름을 누르면 이야기가 뜨는 작은 단추 (HTML) — data-bio를 문서 전체에서 받아 연다 */
  B.link = function (name, label) {
    if (!B.has(name)) return '';
    return '<span class="biolink" data-bio="' + U.esc(name) + '" title="인물 이야기">' + (label || '📜') + '</span>';
  };
  /** 대화창의 이름표·초상에 붙인다 (누르면 이야기) */
  B.tag = function (el, who) {
    if (!el || !who || !who.name || who.noBio || !B.has(who.name)) return;
    el.setAttribute('data-bio', who.name);
    el.classList.add('has-bio');
    el.title = '누르면 ' + who.name + '의 이야기';
    el._bioPortrait = who.portrait && !(who.portrait instanceof HTMLCanvasElement) ? who.portrait : null;
  };
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-bio]') : null;
    if (!el) return;
    e.stopPropagation(); e.preventDefault();
    B.show(el.getAttribute('data-bio'), { portrait: el._bioPortrait });
  }, true);
})(window.G = window.G || {});
