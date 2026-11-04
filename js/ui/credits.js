/* 만든 사람들·출처 (G.Credits) — 2026-11-04 저작권 QA 9번
   타이틀 화면 아래 「만든 사람들 · 출처」와 설정 창의 단추가 연다. 같은 내용을 배포판용 THIRD_PARTY_NOTICES.md에도 적는다
   (글꼴 라이선스 전문은 licenses/). 새 외부 자료를 들이면 여기와 THIRD_PARTY_NOTICES.md에 함께 적는다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var CR = G.Credits = {};
  /** 갈래마다 [이름, 쓴 곳, 조건(라이선스), 주소] */
  CR.list = [
    { h: '게임', rows: [
      ['Loop of Good Hope', '기획·제작', '© limeinstein', ''],
      ['코드·글', '제작자가 AI 도구(Anthropic Claude · OpenAI Codex)와 함께 썼다', '', ''],
      ['그림', '제작자가 이미지 생성 도구(OpenAI ImageGen)와 three.js 절차적 3D로 만든 원화. 다른 작품의 그림을 옮기지 않는다', '', ''],
      ['배경 음악', '제작자가 Suno로 만든 기악곡 44곡 (곡마다 출처는 music/CREDITS.md)', '', 'https://suno.com'] ] },
    { h: '효과음', rows: [
      ['Kenney 「RPG Audio」', '발걸음·동전·칼·책·문·천', 'CC0 1.0 (공개 저작물)', 'https://kenney.nl'],
      ['Mixkit', '파도·항구·비·폭풍·새·짐승·북·폭발', 'Mixkit Sound Effects Free License — 게임 안 묶음(sounds/nature.pack.js)으로만 싣는다', 'https://mixkit.co/license/#sfxFree'],
      ['Pixabay (universfield · freesound_community)', '탁자 위에 도는 동전 · 동전 떨어지는 소리', 'Pixabay Content License — 게임 안 묶음으로만 싣는다', 'https://pixabay.com/service/license-summary/'] ] },
    { h: '글꼴', rows: [
      ['Cinzel · Cinzel Decorative', '로고·라틴 글자', 'SIL Open Font License 1.1 — © The Cinzel Project Authors, Natanael Gama', 'https://fonts.google.com/specimen/Cinzel'],
      ['나눔명조 (Nanum Myeongjo)', '본문', 'SIL Open Font License 1.1 — © NHN Corporation', 'https://fonts.google.com/specimen/Nanum+Myeongjo'],
      ['송명 (Song Myung)', '한글 로고·메뉴', 'SIL Open Font License 1.1 — © The SongMyung Project Authors', 'https://fonts.google.com/specimen/Song+Myung'] ] },
    { h: '프로그램', rows: [
      ['three.js r147', '3D 배 그림', 'MIT License — © 2010-2022 three.js authors (js/vendor/THREE-LICENSE.txt)', 'https://threejs.org'],
      ['Electron (설치판)', 'Windows 설치형 게임의 껍데기', 'MIT License — Chromium 등의 라이선스는 설치 폴더의 LICENSES.chromium.html', 'https://www.electronjs.org'] ] },
    { h: '지도·자료', rows: [
      ['Natural Earth', '세계 지도(해안선·땅)', '공개 저작물', 'https://www.naturalearthdata.com'],
      ['UNESCO 세계유산센터', '세계유산 등재 자료 — 한국어로 새로 쓴 글의 바탕', 'CC BY-SA 3.0 IGO', 'https://whc.unesco.org'],
      ['위키백과', '발견물·인물 요약의 바탕 — 한국어로 새로 쓴 글', 'CC BY-SA 4.0', 'https://www.wikipedia.org'],
      ['위키미디어 공용', '발견 그림이 참고한 원본 사진 — 작가·라이선스는 발견 카드와 도감의 「실제 자료」에', 'CC0 · CC BY · CC BY-SA (사진마다 다름)', 'https://commons.wikimedia.org'],
      ['The Met · Smithsonian Open Access', '유물의 실존 소장품 자료', 'CC0', 'https://www.metmuseum.org/about-the-met/policies-and-documents/open-access'],
      ['GBIF.org · OBIS', '동식물의 학명·관찰 기록', 'CC BY 4.0', 'https://www.gbif.org'] ] },
    { h: '명화', rows: [
      ['미켈란젤로 「아담의 창조」 · 보티첼리 「비너스의 탄생」', '발견 연출', '공개 저작물 (Web Gallery of Art · Google Art Project)', 'https://commons.wikimedia.org'],
      ['미켈란젤로 「다비드」 사진', '발견 연출 — 이 사진으로 만든 그림도 같은 조건으로 공개', '사진: Σπάρτακος (2018), CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:David_-_(Michelangelo).jpg'] ] }
  ];
  CR.note = '역사 속 인물·사건과 옛이야기(피노키오·피터 팬·안데르센 동화·돈키호테·천일야화 등)는 공개 저작물인 원작을 바탕으로 이 게임에 맞게 새로 썼다. ' +
    '실제 회사·건물 이름은 그 장소를 가리키는 데만 쓴다. 출처 전체와 라이선스 원문: THIRD_PARTY_NOTICES.md · licenses/';
  function link(url, text) { return url ? '<a href="' + U.esc(url) + '" target="_blank" rel="noopener">' + U.esc(text) + '</a>' : U.esc(text); }
  CR.html = function () {
    return '<div class="credits">' + CR.list.map(function (g) {
      return '<h4>' + U.esc(g.h) + '</h4><table class="credits-t">' + g.rows.map(function (r) {
        return '<tr><th>' + link(r[3], r[0]) + '</th><td>' + U.esc(r[1]) + (r[2] ? '<br><small>' + U.esc(r[2]) + '</small>' : '') + '</td></tr>';
      }).join('') + '</table>';
    }).join('') + '<p class="muted credits-note">' + U.esc(CR.note) + '</p></div>';
  };
  CR.open = function () {
    if (!UI || !UI.window) return Promise.resolve();
    var win = UI.window({ title: '만든 사람들 · 출처', icon: 'book', width: 860, height: 720, html: CR.html(), buttons: [{ label: '닫기', value: 1, cls: 'navy' }] });
    return win.result;
  };
})(window.G = window.G || {});
