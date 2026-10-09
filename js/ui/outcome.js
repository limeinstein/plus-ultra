/* 결과 연출: 잠입·설득·청혼이 되었는지 움직이는 그림(GIF)으로 보여 준다 (대항해시대 3의 성공·실패 장면처럼 — 그림은 새로 그렸다).
   G.Outcome.show(kind, opts) → Promise (그림이 다 돌면, 또는 누르면 닫힌다)

   · kind: 'sneak_ok' 잠입 성공 · 'sneak_fail' 잠입 들킴 · 'win' 설득 성공 · 'lose' 설득 실패 · 'propose' 청혼 성공
   · 그림: images/outcomes/<kind>.gif — 여자 제독(뒤를 이은 딸)은 <kind>_f.gif 가 먼저.
     그림은 tools/outcome_gifs/make_outcomes.py 가 그린다. 같은 이름의 GIF(또는 .anim.webp)로 바꿔 넣으면 그 그림이 나온다.
   · opts: { title: 큰 글씨, sub: 작은 글씨, ms: 보여 줄 시간 }. 그림이 없으면 글씨만 잠깐 보인다.
   · GIF는 한 번만 돌고 마지막 장면에 멈춘다. 같은 그림을 두 번째 볼 때도 처음부터 돌도록 매번 새 주소로 읽는다. */
(function (G) {
  'use strict';
  var O = G.Outcome = {};
  O.enabled = true;

  /** 그림마다 기본 글씨와 보여 줄 시간(ms, 그림 길이 + 마지막 장면을 볼 틈) */
  O.KINDS = {
    sneak_ok: { title: '잠입 성공!', good: true, ms: 4600, sfx: 'discover' },
    sneak_fail: { title: '들켰다!', good: false, ms: 4600 },
    win: { title: '설득 성공!', good: true, ms: 3700, sfx: 'cheer' },
    lose: { title: '설득 실패…', good: false, ms: 3900 },
    propose: { title: '청혼 성공!', good: true, ms: 5000, sfx: 'cheer' }
  };

  function S() { return G.Game && G.Game.state; }
  /** 지금 제독이 여자인가 (뒤를 이은 딸) */
  function female() {
    var I = G.Img, s = S(), p = s && s.player; if (!p) return false;
    if (p.sex) return p.sex === 'f';
    var hk = I && I.heirKid ? I.heirKid(p) : null;
    return !!(hk && hk.sex === 'f');
  }
  /** 쓸 그림 이름 (없으면 null) */
  O.key = function (kind) {
    var I = G.Img; if (!I || !I.has) return null;
    var b = 'outcomes/' + kind;
    if (female() && I.has(b + '_f')) return b + '_f';
    return I.has(b) ? b : null;
  };

  // ---------------------------------------------------------------- 매번 처음부터 도는 주소
  // GIF는 같은 주소면 브라우저가 한 번 돈 상태를 기억해 두 번째에는 마지막 장면만 보인다.
  //   · 한 파일짜리 판(data:)·아티팩트(https·/_blob/): 그림을 Blob으로 한 번 받아 두고, 볼 때마다 새 blob: 주소를 만든다
  //   · 내 컴퓨터에서 연 판(file:): 주소 뒤에 ?r=번호를 붙인다 (file:에서는 fetch를 못 쓴다)
  var blobs = {}, seq = 0;
  function dataBlob(f) {
    var m = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(f); if (!m) return null;
    var raw = m[2] ? atob(m[3]) : decodeURIComponent(m[3]), a = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i);
    return new Blob([a], { type: m[1] || 'image/gif' });
  }
  function getBlob(k, src) {
    if (blobs[k]) return Promise.resolve(blobs[k]);
    var f = (G.IMAGE_FILES || {})[k];
    if (typeof f === 'string' && f.indexOf('data:') === 0) { try { blobs[k] = dataBlob(f); } catch (e) { blobs[k] = null; } return Promise.resolve(blobs[k]); }
    if (!window.fetch || location.protocol === 'file:' || /^blob:/.test(src)) return Promise.resolve(null);
    return fetch(src).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) { blobs[k] = b; return b; }, function () { return null; });
  }
  /** → Promise<{ src, done() }> (done: 다 본 뒤 주소를 놓아 준다) */
  O.freshSrc = function (k) {
    var src = G.Img.src(k);
    if (!src) return Promise.resolve(null);
    return getBlob(k, src).then(function (b) {
      if (b && window.URL && URL.createObjectURL) {
        var u = URL.createObjectURL(b);
        return { src: u, done: function () { try { URL.revokeObjectURL(u); } catch (e) { /* 이미 놓았다 */ } } };
      }
      if (/^(blob:|data:)/.test(src)) return { src: src, done: function () {} };
      return { src: src + (src.indexOf('?') < 0 ? '?' : '&') + 'r=' + (++seq) + '_' + Date.now(), done: function () {} };
    });
  };

  // ---------------------------------------------------------------- 보여 주기
  var busy = null;
  O.show = function (kind, opts) {
    opts = opts || {};
    var K = O.KINDS[kind] || { title: '', good: true, ms: 3000 };
    var UI = G.UI;
    if (!O.enabled || !UI || !UI.window || !document.body) return Promise.resolve();
    var k = O.key(kind), title = opts.title != null ? opts.title : K.title;
    var ms = opts.ms || (k ? K.ms : 1500);
    var run = function () {
      return (k ? O.freshSrc(k) : Promise.resolve(null)).then(function (fs) {
        return new Promise(function (resolve) {
          var html = '<div class="oc-card ' + (K.good ? 'good' : 'bad') + ' oc-' + kind + '">' +
            (fs ? '<div class="oc-pic"><img alt="' + G.U.esc(title) + '"></div>' : '') +
            '<div class="oc-cap"><div class="oc-title">' + G.U.esc(title) + '</div>' + (opts.sub ? '<div class="oc-sub">' + G.U.esc(opts.sub) + '</div>' : '') + '</div></div>';
          var w = UI.window({ html: html, parch: false }), timer = 0;
          w.el.classList.add('oc-win'); w.back.classList.add('oc-back');
          // 시간은 그림을 다 받은 때부터 잰다 (아티팩트에서 그림을 받는 사이에 닫히지 않게 — 그래도 늦으면 글씨만 보고 넘어간다)
          var started = false, pic = !!fs;
          function start() { if (started || !w) return; started = true; clearTimeout(timer); timer = setTimeout(close, pic ? ms : Math.min(ms, 1500)); }
          if (fs) {
            var im = w.content.querySelector('img');
            im.onload = start;
            im.onerror = function () { var p = im.parentNode; if (p && p.parentNode) p.parentNode.removeChild(p); pic = false; start(); };
            im.src = fs.src;
          }
          if (K.sfx && G.Audio && G.Audio.sfx) { try { G.Audio.sfx(K.sfx); } catch (e) { /* 소리는 없어도 된다 */ } }
          var t0 = Date.now(), unkey = null;
          function close() {
            if (!w) return; clearTimeout(timer); if (unkey) unkey();
            var ww = w; w = null; ww.close(true); if (fs) fs.done(); resolve();
          }
          // 막 뜬 창은 0.5초 동안 누름을 받지 않는다 (앞 대화를 넘기던 누름에 바로 닫히지 않게)
          function skip(e) { if (Date.now() - t0 < 500) return; if (e) e.stopPropagation(); close(); }
          w.back.addEventListener('click', skip);
          if (UI.pushKey) unkey = UI.pushKey(function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { skip(); return true; } return false; });
          w.result.then(function () { if (w) close(); });
          if (fs) timer = setTimeout(start, 4000); else start();
        });
      });
    };
    // 연출이 겹치면 앞의 것이 끝난 뒤에
    var p = (busy || Promise.resolve()).then(run, run);
    busy = p; p.then(function () { if (busy === p) busy = null; });
    return p;
  };
})(window.G = window.G || {});
