/* 연출 QA (2026-11-06): 사건 창이 뜰 때마다 누르기 전에 찍고 재 본다 — qalib.js 의 Q.clear 가 window.__shotHook(m, txt) 를 부른다.
   window.__shot(meta) 는 node 쪽(shot.js)이 page.exposeBinding 으로 건다 → 화면을 찍어 파일로.
   재는 것: 창 제목·글 · <img>(주소·그려졌나) · 바탕 그림(background-image) · 캔버스(그려 낸 얼굴 = 그림 없음의 대체) ·
            글 이상(undefined·NaN·{자리표}·[object) · 글이 넘침(스크롤) · 이 사건 동안 그림 고리에서 첫 그림이 없던 것(G.Img.pick) */
(function () {
  'use strict';
  var SH = window.SHOT = { cur: null, miss: {}, fb: {}, n: 0 };
  function hookImg() {
    if (!window.G || !G.Img || !G.Img.pick || G.Img.pick.__sh) return false;
    var pick = G.Img.pick;
    G.Img.pick = function (chain) {
      var r = pick.apply(this, arguments);
      try {
        if (SH.cur && chain) {
          var arr = [].concat(chain).filter(Boolean);
          if (arr.length) {
            if (!r) SH.miss[arr[0]] = (SH.miss[arr[0]] || 0) + 1;
            else if (r !== arr[0] && !/^(portraits\/npc-roles|portraits\/pools|maid-styles|street-folk|backgrounds|exterior|interior)/.test(arr[0])) SH.fb[arr[0] + ' → ' + r] = (SH.fb[arr[0] + ' → ' + r] || 0) + 1;
          }
        }
      } catch (e) { /* 없음 */ }
      return r;
    };
    G.Img.pick.__sh = 1;
    return true;
  }
  var t = setInterval(function () { if (hookImg()) clearInterval(t); }, 50);
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function bgUrls(root) {
    var out = [];
    [root].concat([].slice.call(root.querySelectorAll('*'))).forEach(function (el) {
      var bi = getComputedStyle(el).backgroundImage;
      if (bi && bi !== 'none' && /url\(/.test(bi)) { var m = bi.match(/url\("?([^")]+)"?\)/); if (m && !/data:image\/svg/.test(m[1])) out.push(m[1].replace(/^.*\/images\//, '')); }
    });
    return out;
  }
  window.__shotHook = async function (m, txt) {
    if (!SH.cur || !window.__shot) return;
    // 그림이 다 들어오고 등장 움직임이 끝나기를 잠깐 기다린다
    var imgs = [].slice.call(m.querySelectorAll('img'));
    for (var i = 0; i < 30 && imgs.some(function (im) { return !im.complete; }); i++) await sleep(50);
    try { if (G.Game.scene && G.Game.scene.update) G.Game.scene.update(0.001); } catch (e) { /* 없음 */ }
    await sleep(window.SHOT_WAIT || 320);
    var win = m.querySelector('.win') || m;
    var body = m.querySelector('.body, .dlg .txt, .dlg') || win;
    var text = (m.innerText || '').replace(/\s+/g, ' ').trim();
    var meta = {
      ev: SH.cur, i: ++SH.n,
      title: ((m.querySelector('.title') || {}).innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      kind: m.querySelector('.dlg') ? 'say' : m.querySelector('.askrow') ? 'ask' : 'win',
      text: text.slice(0, 400),
      imgs: imgs.map(function (im) { return { src: (im.getAttribute('src') || '').replace(/^.*\/images\//, '').slice(0, 120), ok: im.complete && im.naturalWidth > 0, w: im.naturalWidth, h: im.naturalHeight, cls: im.className }; }),
      bgs: bgUrls(m).slice(0, 8),
      canvases: [].slice.call(m.querySelectorAll('canvas')).map(function (c) { var dr = '?'; try { var g = c.getContext('2d'), a = g.getImageData(0, 0, c.width, c.height).data, n = 0, v = 0; for (var q = 0; q < a.length; q += 4 * 97) { n++; var l = a[q] + a[q + 1] + a[q + 2]; if (a[q + 3] > 10 && Math.abs(l - 3 * 26) > 40) v++; } dr = v / Math.max(1, n) > 0.08 ? 'drawn' : 'BLANK'; } catch (e) { dr = 'taint'; } return (c.className || c.parentNode.className || '').slice(0, 40) + ' ' + c.width + 'x' + c.height + ' ' + dr; }),
      bad: (text.match(/undefined|NaN|\[object|\{[a-zA-Z_]+\}|\bnull\b/g) || []).slice(0, 5),
      overflow: body && body.scrollHeight > body.clientHeight + 4 ? (body.scrollHeight + '>' + body.clientHeight) : '',
      date: G.Game.state ? G.Game.state.date.y + '.' + G.Game.state.date.m + '.' + G.Game.state.date.d : '', scene: G.Game.sceneName
    };
    await window.__shot(meta);
  };
  SH.start = function (id) { SH.cur = id; SH.miss = {}; SH.fb = {}; };
  SH.stop = function () { var o = { miss: SH.miss, fb: SH.fb }; SH.cur = null; return o; };
})();
