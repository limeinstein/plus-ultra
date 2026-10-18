/* 화면·글꼴 설정 (G.Display) — 2026-10-18 사용자 요청
   「32인치에서는 괜찮은데 27인치 모니터에서는 글씨가 깨져 보인다」
   ■ 까닭: 무대(1600×900)를 CSS transform: scale로 통째로 키우면, 브라우저가 글씨를 1600×900 크기로 그린 뒤 늘린다.
     4K(32인치·배율 150%)처럼 화소가 넉넉하면 티가 안 나지만, 27인치 FHD·QHD(배율 100~125%)에서는 가는 명조 획이 뭉개지고 들쭉날쭉해 보인다.
   ■ 고친 것
     ① 선명한 렌더링(기본): 무대를 CSS zoom으로 키운다 — 글씨가 화면의 실제 크기로 다시 짜여 또렷하게 그려진다. (예전 방식으로 되돌릴 수 있다)
     ② 글자 크기: DEFAULT(자동 — 모니터 크기·화소 밀도에 맞춤)와 제안값 몇 가지. 창·메뉴가 글씨와 함께 커진다 (#ui 층의 zoom — main.js fitUi)
     ③ 글꼴: DEFAULT(자동 — 화소가 넉넉하면 나눔명조, 아니면 획이 고른 본명조)와 고를 수 있는 글꼴 몇 가지
   ■ 이 기기(브라우저)에만 기억한다 — 저장 파일과 상관없다 (모니터마다 다를 수 있으니까). localStorage: pu.uiSize · pu.font · pu.render
   설정 화면: 게임 안 「설정」(js/ui/info.js PAGES.menu)과 타이틀의 「화면·글꼴」 (js/scenes/title.js) — 둘 다 D.panel을 쓴다. */
(function (G) {
  'use strict';
  var D = G.Display = {};
  function get(k, def) { try { var v = window.localStorage.getItem(k); return v == null ? def : v; } catch (e) { return (D._mem && D._mem[k] != null) ? D._mem[k] : def; } }
  function put(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { (D._mem = D._mem || {})[k] = v; } }

  // ---------------------------------------------------------------- 글자 크기 (main.js의 UI_SIZES와 같은 열쇠)
  /* auto = DEFAULT. 숫자는 창·글씨 배율 (1 = 1600×900 화면에서 짠 그대로) */
  D.SIZES = [
    { id: 'auto', label: 'DEFAULT', note: '모니터 크기에 맞춤' },
    { id: 'small', label: '작게', k: 0.9 },
    { id: 'normal', label: '보통', k: 1 },
    { id: 'large', label: '조금 크게', k: 1.15 },
    { id: 'xlarge', label: '크게', k: 1.3 },
    { id: 'max', label: '아주 크게', k: 1.45 }
  ];

  // ---------------------------------------------------------------- 글꼴
  /* css: Google Fonts 주소 (고를 때만 읽는다) · stack: --serif 에 넣을 글꼴 묶음 */
  var GF = 'https://fonts.googleapis.com/css2?family=';
  D.FONTS = [
    { id: 'auto', label: 'DEFAULT', note: '모니터에 맞춰 나눔명조·본명조 가운데 고른다' },
    { id: 'nanum', label: '나눔명조', note: '옛 책 같은 기본 글꼴', stack: "'Nanum Myeongjo', 'Noto Serif KR', 'Batang', '바탕', 'AppleMyungjo', serif" },
    { id: 'notoserif', label: '본명조', note: '획이 고르고 또렷한 명조', css: GF + 'Noto+Serif+KR:wght@400;500;700&display=swap', stack: "'Noto Serif KR', 'Nanum Myeongjo', 'Batang', '바탕', serif", weight: 500 },
    { id: 'gowun', label: '고운바탕', note: '굵고 부드러운 명조', css: GF + 'Gowun+Batang:wght@400;700&display=swap', stack: "'Gowun Batang', 'Nanum Myeongjo', 'Batang', serif" },
    { id: 'nanumgothic', label: '나눔고딕', note: '작은 글씨에 강한 고딕', css: GF + 'Nanum+Gothic:wght@400;700;800&display=swap', stack: "'Nanum Gothic', 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', sans-serif" },
    { id: 'notosans', label: '본고딕', note: '가장 또렷한 고딕', css: GF + 'Noto+Sans+KR:wght@400;500;700&display=swap', stack: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', sans-serif" }
  ];
  function fontById(id) { return D.FONTS.filter(function (f) { return f.id === id; })[0] || D.FONTS[0]; }
  D.fontPref = function () { var v = get('pu.font', 'auto'); return fontById(v).id; };
  /** 화면 1 CSS 화소(1600×900 기준)가 실제 화면 몇 점인가 — 무대 배율 × 화면 배율(DPR) × 글씨 배율 */
  D.density = function () { var g = G.Game || {}; return (g.scale || 1) * (window.devicePixelRatio || 1) * (g.uiZoom || 1); };
  /** DEFAULT 글꼴: 화소가 넉넉하면(4K·레티나) 나눔명조, 아니면(27인치 FHD·QHD) 획 굵기가 고른 본명조 */
  D.AUTO_SHARP = 1.8;
  D.fontNow = function () { var p = D.fontPref(); if (p !== 'auto') return fontById(p); return fontById(D.density() >= D.AUTO_SHARP ? 'nanum' : 'notoserif'); };
  var loaded = {};
  function loadCss(f) {
    if (!f.css || loaded[f.id]) return;
    loaded[f.id] = true;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = f.css; l.dataset.font = f.id;
    document.head.appendChild(l);
  }
  D.applyFont = function () {
    var f = D.fontNow(), root = document.documentElement;
    loadCss(f);
    root.style.setProperty('--serif', f.stack);
    root.style.setProperty('--body-weight', String(f.weight || 400));
    root.dataset.font = f.id;
    if (G.UI && G.UI.fitHud) setTimeout(function () { G.UI.fitHud(); }, 400);   // 글꼴 폭이 바뀌면 위 막대를 다시 맞춘다
  };
  D.setFont = function (id) { put('pu.font', fontById(id).id); D.applyFont(); };

  // ---------------------------------------------------------------- 렌더링 방식
  /* sharp: 무대를 CSS zoom으로 키운다 (글씨가 실제 크기로 다시 그려진다) · classic: 예전처럼 transform: scale */
  D.zoomOk = function () { try { return !!(window.CSS && CSS.supports && CSS.supports('zoom', '2')); } catch (e) { return false; } };
  D.render = function () { var v = get('pu.render', 'sharp'); return v === 'classic' || !D.zoomOk() ? 'classic' : 'sharp'; };
  D.setRender = function (v) { put('pu.render', v === 'classic' ? 'classic' : 'sharp'); if (G.Game && G.Game.fit) G.Game.fit(); };

  // ---------------------------------------------------------------- 설정 판 (게임 안 설정 · 타이틀 「화면·글꼴」)
  function opt(attr, val, on, label, title) { return '<div class="opt' + (on ? ' on' : '') + '" ' + attr + '="' + val + '"' + (title ? ' title="' + title + '"' : '') + '>' + label + '</div>'; }
  /** kv 칸(2열 그리드) 안에 넣을 HTML */
  D.panelHtml = function () {
    var g = G.Game || {}, size = g.uiSizePref ? g.uiSizePref() : 'auto', font = D.fontPref(), now = D.fontNow(), ren = D.render();
    var esc = G.U ? G.U.esc : function (s) { return s; };
    return '<div>글자 크기</div><div><div class="opt-row">' + D.SIZES.map(function (o) { return opt('data-dsz', o.id, size === o.id, o.label, o.note || Math.round(o.k * 100) + '%'); }).join('') + '</div>' +
      '<small class="muted">지금 ' + Math.round((g.uiZoom || 1) * 100) + '% — DEFAULT는 모니터 크기와 화소 밀도에 맞춰 정합니다. 창·메뉴도 함께 커지고 작아집니다 (이 기기에만 기억)</small></div>' +
      '<div>글꼴</div><div><div class="opt-row">' + D.FONTS.map(function (f) { return opt('data-dfont', f.id, font === f.id, f.id === 'auto' ? f.label : '<span style="font-family:' + esc(f.stack).replace(/"/g, '&quot;') + '">' + f.label + '</span>', f.note); }).join('') + '</div>' +
      '<small class="muted">지금 「' + now.label + '」 — ' + (font === 'auto' ? '화면이 촘촘하면 나눔명조, 27인치 FHD·QHD처럼 성기면 획이 고른 본명조를 씁니다' : esc(now.note)) + '</small></div>' +
      (D.zoomOk() ? '<div>글씨 렌더링</div><div><div class="opt-row">' + opt('data-dren', 'sharp', ren === 'sharp', '선명하게') + opt('data-dren', 'classic', ren === 'classic', '예전 방식') + '</div>' +
        '<small class="muted">선명하게: 글씨를 모니터의 실제 크기로 다시 그립니다 (기본) · 예전 방식: 화면을 통째로 늘립니다</small></div>' : '');
  };
  /** 판의 단추에 일을 붙인다. redraw(): 판을 다시 그리는 함수 */
  D.bind = function (el, redraw) {
    var U = G.U;
    U.$$('[data-dsz]', el).forEach(function (o) { o.onclick = function () { if (G.Game.setUiSize) G.Game.setUiSize(o.dataset.dsz); D.applyFont(); redraw(); }; });
    U.$$('[data-dfont]', el).forEach(function (o) { o.onclick = function () { D.setFont(o.dataset.dfont); redraw(); }; });
    U.$$('[data-dren]', el).forEach(function (o) { o.onclick = function () { D.setRender(o.dataset.dren); D.applyFont(); redraw(); }; });
  };
  /** 타이틀에서 여는 「화면·글꼴」 창 */
  D.open = function () {
    var UI = G.UI;
    var win = UI.window({ title: '화면 · 글꼴', icon: 'gear', width: 860, html: '<div class="disp-panel"></div><div class="disp-sample"></div>', buttons: [{ label: '닫기', value: 1, cls: 'navy' }] });
    var el = win.content.querySelector('.disp-panel'), sm = win.content.querySelector('.disp-sample');
    function draw() {
      el.innerHTML = '<div class="kv" style="grid-template-columns:140px 1fr;align-items:center">' + D.panelHtml() + '</div>';
      sm.innerHTML = '<div class="sep"></div><div class="dlg-sample">바다는 넓고 우리의 배는 작다. 그래도 제독, 저 수평선 너머에 무엇이 있는지 보러 갑시다. 리스본 시장에서 후추 한 자루가 금화 서른 닢이랍니다.</div>';
      D.bind(el, draw);
    }
    draw();
    return win.result;
  };

  // 화면 배율(DPR)이 바뀌면(창을 다른 모니터로 옮기면) 다시 맞춘다 — resize가 오지 않는 브라우저도 있다
  function watchDpr() {
    if (!window.matchMedia) return;
    try {
      var mq = window.matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
      var on = function () { if (G.Game && G.Game.fit) G.Game.fit(); D.applyFont(); watchDpr(); };
      if (mq.addEventListener) mq.addEventListener('change', on, { once: true }); else if (mq.addListener) mq.addListener(on);
    } catch (e) { /* 지원하지 않으면 resize만 */ }
  }
  D.init = function () { D.applyFont(); watchDpr(); };
})(window.G = window.G || {});
