/* Title screen */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art;
  var T = {};
  G.Scenes.title = T;
  var bg = null;

  T.enter = function () {
    var Game = G.Game;
    UI.hud.hide();
    Game.showLayers(false, false, true);
    if (!bg) bg = G.Img.make(G.Img.chain.title(), 1600, 900, A.titleScene);
    Game.setScene(bg);
    var wrap = U.el('div', 'title-wrap');
    wrap.innerHTML = '<div class="title-logo"><div class="latin">Loop of Good Hope</div><div class="rule"></div><div class="ko">더 먼 바다로</div></div>' +
      '<div class="title-menu"></div><div class="loading">해도를 펼치는 중...</div>' +
      '<div class="title-foot">대항해의 시대, 1480 — 이베리아 반도</div>';
    UI.add(wrap);
    var menu = wrap.querySelector('.title-menu');
    function btn(label, icon, fn, cls) { var b = U.el('button', 'btn ' + (cls || ''), G.icon(icon) + label); b.onclick = fn; menu.appendChild(b); return b; }
    var bCont = null;
    async function cont() { await Game.ensureGeo(); var S = await G.State.loadAsync(0); if (!S) { UI.alert('불러오지 못했습니다.'); return; } G.Game.state = S; G.Game.resume(); }
    if (G.State.meta(0)) bCont = btn('이어하기', 'sail', cont, 'navy');
    var bNew = btn('새로운 항해', 'ship', function () { G.Game.go('create'); }, bCont ? '' : 'navy');
    // 처음 하는 사람을 위한 튜토리얼 「첫 항해」 (js/systems/tutorial.js) — 저장이 하나도 없으면 이 단추를 강조한다
    var bTut = G.Tutorial && G.Tutorial.begin ? btn('첫 항해 (튜토리얼)', 'compass', function () { if (!bTut.classList.contains('disabled')) G.Tutorial.begin(); }, bCont ? '' : 'navy') : null;
    if (bTut) { bTut.classList.add('disabled'); if (!bCont) bNew.classList.remove('navy'); }
    var bLoad = btn('항해 일지 불러오기', 'book', function () { T.loadMenu(); });
    btn('조작 안내', 'info', function () { T.help(); });
    bLoad.classList.add('disabled');
    bNew.classList.add('disabled'); bLoad.dataset.wait = '1'; if (bCont) bCont.classList.add('disabled');
    var ld = wrap.querySelector('.loading');
    // 보조 저장소(IndexedDB)의 일지도 읽은 뒤에 이어하기·불러오기를 정한다 (localStorage가 지워졌어도 남아 있을 수 있다)
    Promise.all([Game.ensureGeo(), G.State.ready]).then(function () {
      ld.textContent = '';
      if (!bCont && G.State.meta(0)) { bCont = btn('이어하기', 'sail', cont, 'navy'); menu.insertBefore(bCont, menu.firstChild); bNew.classList.remove('navy'); if (bTut) bTut.classList.remove('navy'); }
      if (bTut) bTut.classList.remove('disabled');
      bNew.classList.remove('disabled'); if (bCont) bCont.classList.remove('disabled');
      bLoad.classList.remove('disabled');      // 일지가 없어도 「파일에서 불러오기」는 할 수 있다
    });
  };

  T.loadMenu = async function () {
    var opts = [];
    for (var i = 0; i < 4; i++) {
      var m = G.State.meta(i);
      opts.push({ label: (i === 0 ? '자동 저장' : '일지 ' + i) + (m ? ' — ' + U.esc(m.name) + ' · ' + m.date + ' · ' + U.esc(m.place) : ' — (비어 있음)'), value: i, disabled: !m, icon: 'book' });
    }
    opts.push({ label: '파일에서 불러오기', value: 'file', icon: 'scroll', right: '내려받아 둔 일지 파일 (.json)' });
    if (G.State.hasAnySave()) opts.push({ label: '일지를 파일로 내려받기', value: 'export', icon: 'save', right: '다른 기기·브라우저로 옮길 때' });
    await G.State.ready;
    var slot = await UI.choose('항해 일지 불러오기', opts, { width: 760 });
    if (slot == null) return;
    if (slot === 'export') { await T.exportMenu(); return; }
    var S;
    if (slot === 'file') {
      try { var got = await G.State.importFile(); if (!got) return; S = got.state; }
      catch (e) { UI.alert('불러오지 못했습니다: ' + U.esc(e && e.message || e)); return; }
    } else S = await G.State.loadAsync(slot);
    if (!S) { UI.alert('불러오지 못했습니다.'); return; }
    await G.Game.ensureGeo();
    G.Game.state = S;
    G.Game.resume();
  };

  /** 저장된 일지 하나를 파일로 내려받는다 */
  T.exportMenu = async function () {
    var opts = [];
    for (var i = 0; i < 4; i++) { var m = G.State.meta(i); if (m) opts.push({ label: (i === 0 ? '자동 저장' : '일지 ' + i) + ' — ' + U.esc(m.name) + ' · ' + m.date + ' · ' + U.esc(m.place), value: i, icon: 'save' }); }
    if (!opts.length) { UI.alert('내려받을 일지가 없습니다.'); return; }
    var slot = await UI.choose('일지를 파일로 내려받기', opts, { width: 760 });
    if (slot == null) return;
    var name = G.State.exportSlot(slot);
    UI.toast(name ? '일지를 내려받았습니다: ' + name : '내려받지 못했습니다.', 'save', 5000);
  };
  T.help = function () {
    UI.window({ title: '조작 안내', icon: 'info', width: 900, html:
      '<div style="font-size:17px;line-height:1.75">' +
      '<b>목표</b> — 도서관·술집·교역소에서 발견물의 <b>단서</b>를 모아 왕궁이나 저택의 <b>후원자</b>에게 모험을 제안합니다. 계약을 맺고 기한 안에 목적지를 찾아 보고하면 사례금과 <b>명성</b>을 얻습니다. 명성이 오르면 더 큰 후원자와 동료를 만날 수 있습니다.<div class="sep"></div>' +
      '<b>도시</b> — 오른쪽 메뉴에서 건물을 고릅니다. 항구: 출항·보급·함대편성·선원편성 / 교역소: 매매·값 깎기 / 조선소: 배 구입·수리·개조 / 술집: 정보·동료·여급·포카 / 여관: 숙박·저장 / 성문: 육상 탐험.<br>' +
      '<b>항해</b> — 바다를 클릭하면 뱃길을 찾아 나아갑니다. 도시 표시를 클릭하면 그 항구로 향하고 도착하면 입항합니다.<br>' +
      '&nbsp;&nbsp;<b>방향키(WASD)</b>: 누르고 있는 동안 뱃머리가 그 방위로 차츰 돌아갑니다 — ← 서 · → 동 · ↑ 북 · ↓ 남, 두 키를 함께 누르면 북서·남동 같은 대각선. 떼면 그때 향한 쪽으로 곧게 나아갑니다(맞바람이면 느림). <b>Space</b>를 누르면 돛을 거두고 멈춥니다(멈춘 채 항구 곁이면 정박, 자동항해·침로를 잡아 둔 채 멈췄으면 Space를 한 번 더 눌러 이어 감). 숫자판 1~9도 여덟 방위 침로입니다.<br>' +
      '&nbsp;&nbsp;예전의 <b>손으로 키 잡기</b>(↑ 누르는 동안 나아감, ←→ 뱃머리)는 수첩 → 설정 「바다의 방향키」에서 고를 수 있습니다.<br>' +
      '&nbsp;&nbsp;1/2/3 항해 속도 · M 해도 · Enter 입항 · 마우스 휠 확대/축소 · 오른쪽 클릭 진로 취소<br>' +
      '&nbsp;&nbsp;바람을 거슬러 가면 느려집니다. 자동항해·침로는 맞바람이면 좌우로 번갈아 지그재그(태킹)로 거슬러 오르고, 손으로 몰 때는 스스로 비스듬히 번갈아 가야 합니다. 삼각돛은 역풍에, 사각돛은 순풍에 강합니다. 식량과 물이 떨어지면 선원이 쓰러집니다.<br>' +
      '<b>상륙·탐험</b> — 해안 가까이에서 상륙하거나 성문에서 탐험을 떠납니다. <b>선원 모두가 탐험대</b>로 나섭니다. 땅을 클릭해 걸어가며 유적과 생물을 찾고 내륙 도시에 들어갈 수 있습니다. 원주민에게 <b>선물</b>하면 식량과 물을 나누어 주고, 때로는 더 얹어 주거나 <b>캠프파이어</b> 곁에서 재워 줍니다(여관처럼 피로가 풀림).<br>' +
      '<b>발견 유물</b> — 발견한 자리에서 보물·장신구·무기·서적·선수상 같은 것을 얻습니다. 발견의 증거라 <b>후원자에게 보고</b>하면 바치고(서적·다음 탐험으로 이어지는 것은 돌려받기도 함), <b>항구에서 스스로 발표</b>하면 제독의 것이 되어 시장에 팔 수 있습니다. 서적은 소지품에서 읽으면 새 단서가 나옵니다.<br>' +
      '<b>육상전</b> — 탐험대를 제독대와 부대(보병·기병·총병·포병)로 나누어 싸웁니다. 1 공격 · 2 방어 · 3~6 특수 작전(기습·함정·저격·작렬탄). 적 부대를 누르면 목표 — 기병은 뒷줄의 우두머리까지 칩니다. <b>우두머리</b>를 쓰러뜨리면 이기고 제독대가 무너지면 집니다.<br>' +
      '<b>해전</b> — 방향키(WASD)로 기함을 그 방위로 몰고 Space로 세웁니다. 바다를 클릭해 그곳으로 움직이고, 적함을 클릭하면 따라붙어 공격합니다. 옆구리를 적에게 향해야 포격합니다(현측에 든 적에게는 알아서 쏩니다). 가까이 붙어 B 키로 백병전을 겁니다. P는 일시정지. 배마다 번호가 붙고 <b>1번이 기함</b> — 적 기함을 가라앉히거나 나포하면 이기고, 우리 기함을 잃으면 집니다.<br>' +
      '<b>일기토</b> — 갑판(술집) 위에서 두 사람이 겨룹니다. 먼저 <b>방침</b>(1 결사돌진 · 2 강력공격 · 3 절대생포 · 4 호신중시)을 고르면 무력·검술에 따라 합이 저절로 오갑니다. 합마다 <b>다음 수</b>(0 자동 · 1 베기 · 2 찌르기 · 3 치기)를 고를 수 있고, 찌르기 → 베기 → 치기 → 찌르기로 화살표 쪽을 이깁니다(상대가 노리는 수는 검술이 높을수록 잘 읽힘). 기세가 차면 <b>기술</b>(일격필살·선제공격·측면공격·생포·거짓퇴각·비밀무기·유인·교체·설득·허보·호통·필살기)을 씁니다. Space 멈춤 · Esc 물러서기.<br>' +
      '<b>저장</b> — 입항할 때마다 자동 저장되며, 여관의 「기능」에서 항해 일지에 기록할 수 있습니다.' +
      '</div>', buttons: [{ label: '닫기', value: 1 }] });
  };

  T.exit = function () { };
})(window.G = window.G || {});
