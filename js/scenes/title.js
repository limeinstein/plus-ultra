/* Title screen */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art;
  var T = {};
  G.Scenes.title = T;
  var anim = null, bg = null, t0 = 0;

  T.enter = function () {
    var Game = G.Game;
    UI.hud.hide();
    Game.showLayers(false, false, true);
    if (!bg) bg = G.Img.make(G.Img.chain.title(), 1600, 900, A.titleScene);
    Game.setScene(bg);
    var wrap = U.el('div', 'title-wrap');
    wrap.innerHTML = '<div class="title-logo"><div class="latin">PLUS ULTRA</div><div class="rule"></div><div class="ko">더 먼 바다로</div></div>' +
      '<div class="title-menu"></div><div class="loading">해도를 펼치는 중...</div>' +
      '<div class="title-foot">대항해의 시대, 1480 — 이베리아 반도</div>';
    UI.add(wrap);
    var menu = wrap.querySelector('.title-menu');
    function btn(label, icon, fn, cls) { var b = U.el('button', 'btn ' + (cls || ''), G.icon(icon) + label); b.onclick = fn; menu.appendChild(b); return b; }
    var bCont = null;
    if (G.State.meta(0)) bCont = btn('이어하기', 'sail', async function () { await Game.ensureGeo(); var S = G.State.load(0); if (!S) { UI.alert('불러오지 못했습니다.'); return; } G.Game.state = S; G.Game.resume(); }, 'navy');
    var bNew = btn('새로운 항해', 'ship', function () { G.Game.go('create'); }, bCont ? '' : 'navy');
    var bLoad = btn('항해 일지 불러오기', 'book', function () { T.loadMenu(); });
    btn('조작 안내', 'info', function () { T.help(); });
    if (!G.State.hasAnySave()) bLoad.classList.add('disabled');
    bNew.classList.add('disabled'); bLoad.dataset.wait = '1'; if (bCont) bCont.classList.add('disabled');
    var ld = wrap.querySelector('.loading');
    Game.ensureGeo().then(function () {
      ld.textContent = '';
      bNew.classList.remove('disabled'); if (bCont) bCont.classList.remove('disabled');
      if (G.State.hasAnySave()) bLoad.classList.remove('disabled');
    });
  };

  T.loadMenu = async function () {
    var opts = [];
    for (var i = 0; i < 4; i++) {
      var m = G.State.meta(i);
      opts.push({ label: (i === 0 ? '자동 저장' : '일지 ' + i) + (m ? ' — ' + U.esc(m.name) + ' · ' + m.date + ' · ' + U.esc(m.place) : ' — (비어 있음)'), value: i, disabled: !m, icon: 'book' });
    }
    var slot = await UI.choose('항해 일지 불러오기', opts, { width: 760 });
    if (slot == null) return;
    var S = G.State.load(slot);
    if (!S) { UI.alert('불러오지 못했습니다.'); return; }
    await G.Game.ensureGeo();
    G.Game.state = S;
    G.Game.resume();
  };

  T.help = function () {
    UI.window({ title: '조작 안내', icon: 'info', width: 900, html:
      '<div style="font-size:17px;line-height:1.75">' +
      '<b>목표</b> — 도서관·술집·교역소에서 발견물의 <b>단서</b>를 모아 왕궁이나 저택의 <b>후원자</b>에게 모험을 제안합니다. 계약을 맺고 기한 안에 목적지를 찾아 보고하면 사례금과 <b>명성</b>을 얻습니다. 명성이 오르면 더 큰 후원자와 동료를 만날 수 있습니다.<div class="sep"></div>' +
      '<b>도시</b> — 오른쪽 메뉴에서 건물을 고릅니다. 항구: 출항·보급·함대편성·선원편성 / 교역소: 매매·값 깎기 / 조선소: 배 구입·수리·개조 / 술집: 정보·동료·여급·포카 / 여관: 숙박·저장 / 성문: 육상 탐험.<br>' +
      '<b>항해</b> — 바다를 클릭하면 뱃길을 찾아 나아갑니다. 도시 표시를 클릭하면 그 항구로 향하고 도착하면 입항합니다.<br>' +
      '&nbsp;&nbsp;<b>방향키(WASD)</b>: 누른 방위로 침로를 잡고 계속 나아갑니다 — ↑ 북 · ↓ 남 · ← 서 · → 동, 두 키를 함께 누르면 북동·남서 같은 대각선. 맞바람이면 알아서 지그재그로 거슬러 오릅니다. <b>Space</b>를 누르면 돛을 거두고 멈춥니다(멈춘 채 항구 곁이면 정박). 숫자판 1~9도 여덟 방위 침로입니다.<br>' +
      '&nbsp;&nbsp;예전의 <b>손으로 키 잡기</b>(↑ 누르는 동안 나아감, ←→ 뱃머리)는 수첩 → 설정 「바다의 방향키」에서 고를 수 있습니다.<br>' +
      '&nbsp;&nbsp;1/2/3 항해 속도 · M 해도 · Enter 입항 · 마우스 휠 확대/축소 · 오른쪽 클릭 진로 취소<br>' +
      '&nbsp;&nbsp;바람을 거슬러 가면 느려집니다. 자동항해·침로는 맞바람이면 좌우로 번갈아 지그재그(태킹)로 거슬러 오르고, 손으로 몰 때는 스스로 비스듬히 번갈아 가야 합니다. 삼각돛은 역풍에, 사각돛은 순풍에 강합니다. 식량과 물이 떨어지면 선원이 쓰러집니다.<br>' +
      '<b>상륙·탐험</b> — 해안 가까이에서 상륙하거나 성문에서 탐험을 떠납니다. 땅을 클릭해 걸어가며 유적과 생물을 찾고 내륙 도시에 들어갈 수 있습니다.<br>' +
      '<b>해전</b> — 방향키(WASD)로 기함을 그 방위로 몰고 Space로 세웁니다. 바다를 클릭해 그곳으로 움직이고, 적함을 클릭하면 따라붙어 공격합니다. 옆구리를 적에게 향해야 포격합니다(현측에 든 적에게는 알아서 쏩니다). 가까이 붙어 B 키로 백병전을 겁니다. P는 일시정지.<br>' +
      '<b>저장</b> — 입항할 때마다 자동 저장되며, 여관의 「기능」에서 항해 일지에 기록할 수 있습니다.' +
      '</div>', buttons: [{ label: '닫기', value: 1 }] });
  };

  T.exit = function () { };
})(window.G = window.G || {});
