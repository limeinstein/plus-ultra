/* Title screen */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art;
  var T = {};
  G.Scenes.title = T;
  T.version = '0.294';   // 배포할 때 tools/web_release.py가 0.001씩 올린다
  var bg = null;
  var bootPending = false;   // 처음 열 때의 불러오는 그림이 아직 준비 단계를 밟는 중 (타이틀을 떠나면 바로 걷는다 — T.exit)

  T.enter = function () {
    var Game = G.Game;
    UI.hud.hide();
    Game.showLayers(false, false, true);
    if (G.Audio) G.Audio.music('title');     // 첫 화면: 항해(태평양) — 브라우저가 첫 클릭 전에는 소리를 막으므로 그때부터 (js/data/music.js)
    if (!bg) bg = G.Img.make(G.Img.chain.title(), 1600, 900, A.titleScene);
    Game.setScene(bg);
    var wrap = U.el('div', 'title-wrap');
    var loadingKey = G.Img.has('effects/loading-world.anim') ? 'effects/loading-world.anim' : 'effects/loading-world', loadingSrc = G.Img.has(loadingKey) ? G.Img.src(loadingKey) : '';   // 움직이는 WEBP(1.7MB)가 있으면 GIF(6.4MB) 대신
    wrap.innerHTML = '<div class="title-logo"><div class="latin">Loop of Good Hope</div><div class="rule"></div><div class="ko">더 먼 바다로</div></div>' +
      '<div class="title-menu"></div><div class="loading" role="status">' +
      (loadingSrc ? '<img src="' + loadingSrc + '" alt="지구 둘레를 항해하는 갤리온">' : '') +
      '<span>해도를 펼치는 중...</span></div>' +
      '<div class="title-bottom"><div class="title-foot">대항해의 시대, 1480 — 이베리아 반도</div>' +
      '<div class="title-version" aria-label="게임 버전">VERSION ' + T.version + (window.PU_WEB_CHANNEL === 'beta' ? ' · BETA' : '') + '</div>' +
      (window.PU_WEB_CHANNEL === 'beta' ? '<a class="title-beta-center" href="center/">베타 안내 · 피드백</a>' : '') + '</div>';
    UI.add(wrap);
    var menu = wrap.querySelector('.title-menu');
    function btn(label, icon, fn, cls) { var b = U.el('button', 'btn ' + (cls || ''), G.icon(icon) + label); b.onclick = fn; menu.appendChild(b); return b; }
    var bCont = null;
    async function cont() { await Game.ensureGeo(); var slot = G.State.latestAutoSlot(); var S = slot && await G.State.loadAsync(slot); if (!S) { UI.alert('불러오지 못했습니다.'); return; } G.Game.state = S; G.Game.resume(); }
    if (G.State.latestAutoSlot()) bCont = btn('이어하기', 'sail', cont, 'navy');
    var bNew = btn('새로운 항해', 'ship', function () { G.Game.go('create'); }, bCont ? '' : 'navy');
    // 처음 하는 사람을 위한 튜토리얼 「첫 항해」 (js/systems/tutorial.js) — 저장이 하나도 없으면 이 단추를 강조한다
    var bTut = G.Tutorial && G.Tutorial.begin ? btn('첫 항해 (튜토리얼)', 'compass', function () { if (!bTut.classList.contains('disabled')) G.Tutorial.begin(); }, bCont ? '' : 'navy') : null;
    if (bTut) { bTut.classList.add('disabled'); if (!bCont) bNew.classList.remove('navy'); }
    // 이야기 모드 「아버지의 사진」 (js/systems/story.js) — 정해진 제독·동료로 시작하는 이야기
    var bStory = G.Story && G.Story.begin ? btn('이야기 — 아버지의 사진', 'scroll', function () { if (!bStory.classList.contains('disabled')) G.Story.begin(); }) : null;
    if (bStory) bStory.classList.add('disabled');
    var bLoad = btn('항해 일지 불러오기', 'book', function () { T.loadMenu(); });
    var bHelp = btn('조작 안내', 'info', function () { T.help(); });
    if (G.Display) {   // 글자 크기·글꼴 (js/ui/display.js) — 조작 안내와 한 줄에 나란히 (단추가 늘어 화면 밑으로 밀리지 않게)
      var row = U.el('div', 'title-row'); menu.insertBefore(row, bHelp); row.appendChild(bHelp);
      var bDisp = btn('화면 · 글꼴', 'gear', function () { G.Display.open(); }); row.appendChild(bDisp);
    }
    bLoad.classList.add('disabled');
    bNew.classList.add('disabled'); bLoad.dataset.wait = '1'; if (bCont) bCont.classList.add('disabled');
    var ld = wrap.querySelector('.loading');
    // 보조 저장소(IndexedDB)의 일지도 읽은 뒤에 이어하기·불러오기를 정한다 (localStorage가 지워졌어도 남아 있을 수 있다)
    /* 처음 열 때(불러오는 그림이 떠 있을 때): 게임을 할 수 있을 때까지 그림을 걷지 않는다 (2026-10-18)
       예전에는 지도·저장·글꼴만 기다리고 그림을 걷은 뒤 바다 셰이더를 컴파일해, 첫 화면(오프닝)이 뜬 채 몇 초씩 멈춰 있었다 —
       이제 ① 지도(해도) ② 바다 셰이더 ③ 타이틀 그림까지 그림이 떠 있는 동안 마치고, 그다음 단추를 켜고 그림을 걷는다. 단계마다 글이 바뀐다. */
    var LD = G.Loader, boot = !!(LD && LD.shown()), stepMs = (G.FX && G.FX.loader && G.FX.loader.titleWaitMs) || 20000;
    function step(t) { if (bootPending && LD) LD.text(t); return LD && LD.frames ? LD.frames(2) : Promise.resolve(); }
    function cap(p, ms) { return Promise.race([p, new Promise(function (r) { setTimeout(r, ms); })]); }
    if (boot) { bootPending = true; window.PU_BOOT_DONE = true; var bc = document.querySelector('#boot-loader .bl-count'); if (bc) bc.textContent = ''; step('해도를 펼치는 중…'); }   // 받은 파일 수(index.html)는 여기서 그친다
    Promise.all([Game.ensureGeo(), G.State.ready, document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]) : null]).then(async function () {
      if (boot && bootPending) {
        await step('바다를 그리는 중…');
        try { if (Game.ensureRenderer()) Game.renderer.warmShaders(); } catch (e) { console.warn(e); }   // 첫 항해가 멈칫하지 않게 — 그림이 떠 있는 동안
        await step('첫 화면을 꾸미는 중…');
        try { if (G.Img && G.Img.resolve && G.Img.has(G.Img.pick(G.Img.chain.title()))) await cap(G.Img.resolve(G.Img.chain.title()), stepMs); } catch (e) { console.warn(e); }
        if (Game.sceneName === 'title' && bg) Game.setScene(bg);   // 받은 타이틀 그림으로 다시 그린다
      }
      ld.classList.add('done');
      if (!boot) setTimeout(function () { try { if (Game.ensureRenderer()) Game.renderer.warmShaders(); } catch (e) { console.warn(e); } }, 600);
      if (!bCont && G.State.latestAutoSlot()) { bCont = btn('이어하기', 'sail', cont, 'navy'); menu.insertBefore(bCont, menu.firstChild); bNew.classList.remove('navy'); if (bTut) bTut.classList.remove('navy'); }
      if (bTut) bTut.classList.remove('disabled');
      if (bStory) bStory.classList.remove('disabled');
      bNew.classList.remove('disabled'); if (bCont) bCont.classList.remove('disabled');
      bLoad.classList.remove('disabled');      // 일지가 없어도 「파일에서 불러오기」는 할 수 있다
      if (LD && (!boot || bootPending)) LD.hide();   // 모든 준비가 끝난 뒤에 오프닝을 보인다 (그새 타이틀을 떠났으면 이미 걷었다)
      bootPending = false;
    });
  };

  T.loadMenu = async function () {
    await G.State.ready;
    var opts = [];
    G.State.AUTO_SLOTS.forEach(function (slot, i) {
      var m = G.State.meta(slot);
      opts.push({ label: '자동 저장 ' + (i + 1) + (m ? ' — ' + U.esc(m.name) + ' · ' + m.date + ' · ' + U.esc(m.place) : ' — (비어 있음)'), value: slot, disabled: !m, icon: 'save' });
    });
    G.State.JOURNAL_SLOTS.forEach(function (slot, i) {
      var m = G.State.meta(slot);
      opts.push({ label: '여관 일지 ' + (i + 1) + (m ? ' — ' + U.esc(m.name) + ' · ' + m.date + ' · ' + U.esc(m.place) : ' — (비어 있음)'), value: slot, disabled: !m, icon: 'book' });
    });
    opts.push({ label: '파일에서 불러오기', value: 'file', icon: 'scroll', right: '내려받아 둔 일지 파일 (.json)' });
    if (G.State.hasAnySave()) opts.push({ label: '일지를 파일로 내려받기', value: 'export', icon: 'save', right: '다른 기기·브라우저로 옮길 때' });
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
    await G.State.ready;
    var opts = [];
    G.State.AUTO_SLOTS.forEach(function (slot, i) { var m = G.State.meta(slot); if (m) opts.push({ label: '자동 저장 ' + (i + 1) + ' — ' + U.esc(m.name) + ' · ' + m.date + ' · ' + U.esc(m.place), value: slot, icon: 'save' }); });
    G.State.JOURNAL_SLOTS.forEach(function (slot, i) { var m = G.State.meta(slot); if (m) opts.push({ label: '여관 일지 ' + (i + 1) + ' — ' + U.esc(m.name) + ' · ' + m.date + ' · ' + U.esc(m.place), value: slot, icon: 'book' }); });
    if (!opts.length) { UI.alert('내려받을 일지가 없습니다.'); return; }
    var slot = await UI.choose('일지를 파일로 내려받기', opts, { width: 760 });
    if (slot == null) return;
    var name = G.State.exportSlot(slot);
    UI.toast(name ? '일지를 내려받았습니다: ' + name : '내려받지 못했습니다.', 'save', 5000);
  };
  T.help = function () {
    var gb = G.GUIDEBOOK && G.Guidebook;   // 플레이 가이드북 (js/ui/guidebook.js) — 이 창 맨 위 카드와 아래 단추로 연다
    UI.window({ title: '조작 안내', icon: 'info', width: 900, html:
      (gb ? '<div class="help-guide"><img class="hg-pic" alt=""><div><div class="hg-t">' + G.icon('book') + ' 플레이 가이드북 펼치기</div>' +
        '<div class="hg-s">처음 바다에 나서는 제독을 위한 안내서 — 시작하기 · 도시 · 항해 · 교역 · 모험과 발견 · 전투 · 사람들 · 즐길거리 · 초보 선장을 위한 팁. 게임 화면 그림 ' + G.GUIDEBOOK.chapters.reduce(function (n, c) { return n + (c.html.match(/data-gk=/g) || []).length; }, 0) + '장과 함께 ' + G.GUIDEBOOK.chapters.length + '장으로 엮었습니다.</div></div></div>' : '') +
      '<div style="font-size:17px;line-height:1.75">' +
      '<b>목표</b> — 도서관·술집·교역소에서 발견물의 <b>단서</b>를 모아 왕궁이나 저택의 <b>후원자</b>에게 모험을 제안합니다. 계약을 맺고 기한 안에 목적지를 찾아 보고하면 사례금과 <b>명성</b>을 얻습니다. 명성이 오르면 더 큰 후원자와 동료를 만날 수 있습니다.<div class="sep"></div>' +
      '<b>도시</b> — 오른쪽 메뉴에서 건물을 고릅니다. 메뉴와 선택창은 기본 ↑↓로 이동하고 Enter·Space로 고르며 Esc로 닫습니다. 항구: 출항·보급·함대편성 / 교역소: 매매·값 깎기 / 조선소: 배 구입·수리·개조 / 술집: 선원 모집·정보·동료·여급·포카 / 여관: 숙박·저장 / 성문: 육상 탐험.<br>' +
      '<b>항해</b> — 바다를 클릭하면 뱃길을 찾아 나아갑니다. 도시 표시를 클릭하면 그 항구로 향하고 도착하면 입항합니다.<br>' +
      '&nbsp;&nbsp;<b>방향키</b>: 누르고 있는 동안 뱃머리가 그 방위로 차츰 돌아갑니다 — ← 서 · → 동 · ↑ 북 · ↓ 남, 두 키를 함께 누르면 북서·남동 같은 대각선. 떼면 그때 향한 쪽으로 곧게 나아갑니다(맞바람이면 느림). 기본 <b>Space</b>를 누르면 돛을 거두고 멈춥니다(멈춘 채 항구 곁이면 정박, 자동항해·침로를 잡아 둔 채 멈췄으면 한 번 더 눌러 이어 감). 숫자판 1~9도 여덟 방위 침로입니다.<br>' +
      '&nbsp;&nbsp;예전의 <b>손으로 키 잡기</b>(↑ 누르는 동안 나아감, ←→ 뱃머리)는 수첩 → 설정 「바다의 방향키」에서 고를 수 있습니다.<br>' +
      '&nbsp;&nbsp;<b>F11</b>: 전체 화면 켜기·끄기 (게임이 켠 전체 화면이라 마우스를 맨 위로 올려도 브라우저 메뉴가 내려오지 않습니다)<br>' +
      '&nbsp;&nbsp;기본 1/2/3 항해 속도 · M 해도 · Enter 입항 · 마우스 휠 확대/축소 · 오른쪽 클릭 진로 취소. 방향·확정·취소·해상 속도 키는 수첩 → 설정 → 「키보드 설정」에서 모두 바꿀 수 있습니다.<br>' +
      '&nbsp;&nbsp;바람을 거슬러 가면 느려집니다. 자동항해·침로는 맞바람이어도 곧게 거슬러 오르고(설정 「맞바람 지그재그」에서 먼바다에서만·언제나 좌우로 번갈아 오르는 지그재그로 바꿀 수 있습니다 — 도착하는 날은 같습니다), 손으로 몰 때는 스스로 비스듬히 번갈아 가야 합니다. 삼각돛은 역풍에, 사각돛은 순풍에 강합니다. 식량과 물이 떨어지면 선원이 쓰러집니다.<br>' +
      '<b>상륙·탐험</b> — 해안 가까이에서 상륙하거나 성문에서 탐험을 떠납니다. <b>선원 모두가 탐험대</b>로 나섭니다. 땅을 클릭해 걸어가며 유적과 생물을 찾고 내륙 도시에 들어갈 수 있습니다. 원주민에게 <b>선물</b>하면 식량과 물을 나누어 주고, 때로는 더 얹어 주거나 <b>캠프파이어</b> 곁에서 재워 줍니다(여관처럼 피로가 풀림).<br>' +
      '<b>발견 유물</b> — 발견한 자리에서 보물·장신구·무기·서적·선수상 같은 것을 얻습니다. 발견의 증거라 <b>후원자에게 보고</b>하면 바치고(서적·다음 탐험으로 이어지는 것은 돌려받기도 함), <b>항구에서 스스로 발표</b>하면 제독의 것이 되어 시장에 팔 수 있습니다. 서적은 소지품에서 읽으면 새 단서가 나옵니다.<br>' +
      '<b>육상전</b> — 탐험대를 제독대와 부대(보병·기병·총병·포병)로 나누어 싸웁니다. 1 공격 · 2 방어 · 3~6 특수 작전(기습·함정·저격·작렬탄). 적 부대를 누르면 목표 — 기병은 뒷줄의 우두머리까지 칩니다. <b>우두머리</b>를 쓰러뜨리면 이기고 제독대가 무너지면 집니다.<br>' +
      '<b>해전</b> — 방향키로 기함을 그 방위로 몰고 기본 Space로 세웁니다. 바다를 클릭해 그곳으로 움직이고, 적함을 클릭하면 따라붙어 공격합니다. 옆구리를 적에게 향해야 포격합니다(현측에 든 적에게는 알아서 쏩니다). 가까이 붙어 B 키로 백병전을 겁니다. P는 일시정지. 배마다 번호가 붙고 <b>1번이 기함</b> — 적 기함을 가라앉히거나 나포하면 이기고, 우리 기함을 잃으면 집니다.<br>' +
      '<b>일기토</b> — 갑판(술집) 위에서 두 사람이 겨룹니다. 먼저 <b>방침</b>(1 결사돌진 · 2 강력공격 · 3 절대생포 · 4 호신중시)을 고르면 무력·검술에 따라 합이 저절로 오갑니다. 합마다 <b>다음 수</b>(0 자동 · 1 베기 · 2 찌르기 · 3 치기)를 고를 수 있고, 찌르기 → 베기 → 치기 → 찌르기로 화살표 쪽을 이깁니다(상대가 노리는 수는 검술이 높을수록 잘 읽힘). 기세가 차면 <b>기술</b>(일격필살·선제공격·측면공격·생포·거짓퇴각·비밀무기·유인·교체·설득·허보·호통·필살기)을 씁니다. Space 멈춤 · Esc 물러서기.<br>' +
      '<b>저장</b> — 플레이 중 1분마다 자동 저장되며, 5칸이 차면 가장 오래된 기록부터 갱신됩니다. 여관의 「기능」에는 자동 저장과 별개인 항해 일지 5칸이 있습니다.' +
      '</div>', buttons: (gb ? [{ label: '플레이 가이드북', icon: 'book', cls: 'navy', onClick: function () { G.Guidebook.open(); return false; } }] : []).concat([{ label: '닫기', value: 1 }]),
      onBuild: function (el) {
        var card = el.querySelector('.help-guide'); if (!card) return;
        card.onclick = function () { G.Guidebook.open(); };
        var pic = card.querySelector('.hg-pic');
        if (G.Img && G.Img.has('guide/01_title')) G.Img.resolve(['guide/01_title']).then(function (r) { if (r && r.img) pic.src = r.img.src; else pic.style.display = 'none'; });
        else pic.style.display = 'none';
      } });
  };

  /** 준비가 끝나기 전에 타이틀을 떠나면(시험·바로 가기) 불러오는 그림을 걷는다 — 다음 장면을 가리지 않게 */
  T.exit = function () { if (bootPending) { bootPending = false; if (G.Loader) G.Loader.hide(); } };
})(window.G = window.G || {});
