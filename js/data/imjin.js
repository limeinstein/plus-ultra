/* 임진왜란 — 동래에서 노량까지 (사건: js/systems/imjin.js). 2026-10-30 사용자 요청
   ■ 사람(대화에 세우는 실존 인물 — G.HIST_FIG): 김시민 · 송상현 · 신립 · 선조 · 광해군 · 권율 · 원균 · 고니시 유키나가 · 진린
     얼굴: images/portraits/legendary/<이름>.webp (이미 있는 것 — kim_simin · sin_rip · seonjo · gwon_yul · konishi_yukinaga) · 없으면 portraits/history/<id>
   ■ 동료: 논개(h_nongae)·곽재우(h_gwakjaeu)·이순신(h_yisunsin)·허준(h_heojun)은 원래 있던 지역 사람(js/data/regionfolk.js)을 쓴다.
     김덕령(h_kimdeokryeong)은 여기서 새로 — 사건으로만 만난다 (eventOnly). 얼굴: portraits/legendary/kim_deokryeong
   ■ 소지품: 김시민이 맡긴 비단(imjin_silk — 팔 수 없다: noSell, js/city/misc.js) · 갓(imjin_gat — 곽재우·김덕령이 부하가 되려면) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('kimsimin', { name: '김시민', title: '동래성을 지키는 장수', st: 'kr', role: 'soldier', born: 1554, face: 'portraits/legendary/kim_simin', look: '30대 후반, 붉은 철릭에 전립, 각진 턱과 짙은 눈썹, 허리에 환도' });
  fig('songsanghyeon', { name: '송상현', title: '동래 부사', st: 'kr', role: 'official', born: 1551, look: '40대 초반, 조복 위에 갑옷, 단정한 수염, 성루에 선 문관' });
  fig('sinrip', { name: '신립', title: '삼도 도순변사', st: 'kr', role: 'soldier', born: 1546, face: 'portraits/legendary/sin_rip', look: '40대 중반, 두정갑, 말 위의 장수, 기세등등한 눈빛' });
  fig('seonjo', { name: '선조', title: '조선의 임금', st: 'kr', role: 'noble', born: 1552, face: 'portraits/legendary/seonjo', look: '40대, 비에 젖은 곤룡포, 지친 얼굴' });
  fig('gwanghae', { name: '광해군', title: '조선의 세자', st: 'kr', role: 'noble', born: 1575, look: '10대 후반, 세자의 익선관, 굳게 다문 입, 흙 묻은 도포' });
  fig('gwonyul', { name: '권율', title: '전라도 순찰사', st: 'kr', role: 'soldier', born: 1537, face: 'portraits/legendary/gwon_yul', look: '50대, 흰 수염, 두정갑에 지휘봉, 침착한 눈빛' });
  fig('wongyun', { name: '원균', title: '경상우수사', st: 'kr', role: 'captain', born: 1540, look: '50대, 붉은 얼굴, 술잔, 수군 장수의 갑옷을 풀어 헤친 차림' });
  fig('konishi', { name: '고니시 유키나가', title: '왜군 제1군 선봉장', st: 'jp', role: 'soldier', born: 1555, face: 'portraits/legendary/konishi_yukinaga', look: '30대 후반, 십자가를 단 일본 갑옷, 상인 집안 출신의 날카로운 눈매' });
  fig('chenlin', { name: '진린', title: '명나라 수군 도독', st: 'cn', role: 'captain', born: 1543, look: '50대, 명나라 수군 갑옷, 거만하지만 의리 있는 얼굴' });
  G.IMJIN_FIGS = ['kimsimin', 'songsanghyeon', 'sinrip', 'seonjo', 'gwanghae', 'gwonyul', 'wongyun', 'konishi', 'chenlin'];

  // 이름만 나오던 조연도 전용 얼굴상·무릎상을 쓴다 (2026-10-31).
  fig('yiwan', { name: '이완', title: '이순신의 조카 · 수군 군관', st: 'kr', role: 'soldier', look: '젊은 얼굴, 남색 군복과 어두운 갑옷, 북채, 다급한 눈빛' });
  fig('baeseol', { name: '배설', title: '경상우수사', st: 'kr', role: 'captain', look: '지친 중년 얼굴, 어두운 붉은 두정갑, 남색 띠와 해도' });
  fig('imjin_officer', { name: '김시민의 군관', title: '동래의 소식을 전하는 군관', st: 'kr', role: 'soldier', look: '갓과 푸른 철릭, 문서를 내미는 젊은 군관' });
  fig('imjin_peddler', { name: '갓장수', title: '피란길의 갓장수', st: 'kr', role: 'merchant', look: '황토색 삼베옷, 갓짐을 진 웃는 노인' });
  fig('imjin_refugee', { name: '피란민', title: '한양의 피란민', st: 'kr', role: 'maid', g: 'f', look: '해진 저고리와 푸른 치마, 보따리를 안은 중년 여인' });
  fig('imjin_youth', { name: '젊은 의병', title: '나라를 지키려는 젊은이', st: 'kr', role: 'soldier', look: '흰 머리띠와 삼베옷, 녹색 띠, 창을 쥔 청년' });
  fig('imjin_soldier', { name: '왜병', title: '왜군 조총병', st: 'jp', role: 'soldier', look: '진가사와 검은 갑옷, 갈색 옷, 조총을 든 병사' });
  fig('imjin_elder', { name: '피란민 노인', title: '한양에 남은 노인', st: 'kr', role: 'merchant', look: '수척한 얼굴과 흰 수염, 해진 회갈색 옷, 보따리를 안고 앉은 노인' });
  G.IMJIN_SUPPORT_FIGS = ['yiwan', 'baeseol', 'imjin_officer', 'imjin_peddler', 'imjin_refugee', 'imjin_youth', 'imjin_soldier', 'imjin_elder'];

  // ── 동료: 김덕령 (사건으로만)
  var k = { id: 'h_kimdeokryeong', name: '김덕령', g: 'm', style: 'kr', role: 'soldier', tone: 'plain', age: 'young',
    st: [88, 62, 90, 70], sk: { sword: 3, ops: 2 }, lg: { 14: 3 }, fame: 900, wage: 110, y: [1592, 1625], reg: [6],
    face: 'portraits/legendary/kim_deokryeong', native: true, eventOnly: true,
    desc: '전라도 광주 석저촌의 젊은 선비. 날아다니듯 말을 타고 두 손에 철퇴를 든다는 소문의 장사(壯士). 형을 전쟁에서 잃고 상복을 입은 채 의병을 일으켰다. 「익호장군」이라 불린다.' };
  if (G.MATES && G.MATE && !G.MATE[k.id]) { G.MATES.push(k); G.MATE[k.id] = k; }
  if (G.BIOS && !G.BIOS['김덕령']) G.BIOS['김덕령'] = '임진왜란 때 전라도에서 의병을 일으킨 장수. 용맹으로 이름났으나 1596년 이몽학의 난에 엮였다는 모함으로 옥에서 매를 맞아 스물아홉에 세상을 떠났다.';

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    if (!G.ITEM.imjin_silk) {
      var silk = { id: 'imjin_silk', name: '김시민이 맡긴 비단 궤짝', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
        desc: '동래성의 김시민이 「여비 삼아 들고 가되, 팔지는 마시오」라며 맡긴 조선 비단 스무 필. 북쪽의 권율 장군에게 전하면 군량과 화살이 된다. 팔 수 없다.' };
      G.ITEMS.push(silk); G.ITEM.imjin_silk = silk;
    }
    if (!G.ITEM.imjin_gat) {
      var gat = { id: 'imjin_gat', name: '갓 (흑립)', kind: 'special', price: 300, reg: [], rare: true,
        desc: '말총을 엮어 옻칠한 조선 선비의 검은 갓. 이것을 쓰면 조선의 선비와 의병들이 「예를 아는 사람」으로 대해 준다.' };
      G.ITEMS.push(gat); G.ITEM.imjin_gat = gat;
    }
  }

  // ── 조정값
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.imjin = G.BALANCE.imjin || {
    eastShips: ['maengseon', 'panokseon', 'geobukseon', 'junk', 'shachuan', 'ljunk', 'baochuan'],   // 조선 군선·명나라 배 — 이 배가 있어야 왜선이 조선 수군으로 알고 덤빈다
    turtleTo: 5,                    // 이순신과 함께하는 해전: 내 함대가 5척 미만이면 모자란 수만큼 거북선이 (기함이 아닌 배로) 합류한다
    gatPrice: 300,                  // 한양의 갓장수 · 길 위의 갓장수
    foe: { breakout: 34, tangeum: 70, refugee: 22, nongae: 16 },   // 육상전 왜군 수
    fame: { busan: 160, nongae: 60, breakout: 80, tangeum: 120, seoul: 120, gwak: 80, haengju: 200, okpo: 260, hansan: 420, chil: 180, noryang: 500 }
  };
})(window.G = window.G || {});
