/* 조선 여성 동료 20명. 언어와 별개로 01~10은 특기 다섯 개, 11~20은 두세 개를 갖는다.
   1480년부터 3년마다 한 명씩, 저장마다 섞은 순서로 조선 술집·여관에 등장한다. */
(function (G) {
  'use strict';
  var U = G.U, cfg = G.BALANCE.koreaCrew;
  var crew = [
    { no: '01', id: 'krcrew_yun_seoha', name: '윤서하', home: 190,
      st: [57, 84, 47, 85], sk: { nav: 3, ops: 2, survey: 2, ship: 1, sci: 1 }, fame: 850, wage: 120,
      desc: '한양의 항해사. 나침반과 해도를 번갈아 살피며 물살을 읽고, 먼 항해에 필요한 돛과 선체도 꼼꼼히 챙긴다.' },
    { no: '02', id: 'krcrew_kang_chaeryeong', name: '강채령', home: 227,
      st: [48, 86, 39, 87], sk: { acct: 3, speech: 2, craft: 2, nav: 1, art: 1 }, fame: 900, wage: 125,
      desc: '평양의 상인. 장부와 저울로 값을 따지고 비단의 짜임과 공예품의 손길까지 알아본다.' },
    { no: '03', id: 'krcrew_hong_dain', name: '홍다인', home: 228, role: 'soldier',
      st: [67, 65, 87, 81], sk: { sword: 3, ops: 2, shoot: 2, med: 1, nav: 1 }, fame: 950, wage: 125,
      desc: '동래 상선의 호위 검객. 장난스러운 표정으로 당직을 서지만 칼날과 활줄, 동료의 다친 손을 살피는 일은 빼먹지 않는다.' },
    { no: '04', id: 'krcrew_seo_yeonhwa', name: '서연화', home: 190, lg: { 14: 3, 7: 3, 13: 2, 12: 1 },
      st: [45, 88, 36, 89], sk: { speech: 3, hist: 2, acct: 2, music: 1, nav: 1 }, fame: 1000, wage: 130,
      desc: '한양의 통역사. 조선과 중국, 일본 상인의 말을 옮기고 흥정에 담긴 옛 관례와 셈법도 풀어 준다.' },
    { no: '05', id: 'krcrew_baek_soyul', name: '백소율', home: 226,
      st: [49, 90, 34, 82], sk: { med: 3, sci: 2, cook: 2, hist: 1, survey: 1 }, fame: 950, wage: 130,
      desc: '개성의 의원. 낯선 풀과 오래된 의서를 함께 살피며, 선원의 병과 부상뿐 아니라 항해 중 먹을거리도 돌본다.' },
    { no: '06', id: 'krcrew_cha_myeongju', name: '차명주', home: 226,
      st: [52, 85, 43, 91], sk: { speech: 3, acct: 3, ops: 2, hist: 1, craft: 1 }, fame: 1100, wage: 140,
      desc: '개성의 교섭가. 여유롭게 웃으며 어려운 거래를 풀고 계약의 셈과 사람을 부리는 일을 함께 맡는다.' },
    { no: '07', id: 'krcrew_lee_nanseol', name: '이난설', home: 190,
      st: [46, 78, 35, 92], sk: { music: 3, art: 2, speech: 2, hist: 1, cook: 1 }, fame: 850, wage: 120,
      desc: '한양의 악사. 노래와 그림, 이야기로 긴 항해의 밤을 채우고 다툰 선원들도 한자리에 앉힌다.' },
    { no: '08', id: 'krcrew_mun_haerin', name: '문해린', home: 227,
      st: [53, 91, 42, 80], sk: { survey: 3, nav: 2, art: 2, sci: 1, hist: 1 }, fame: 1000, wage: 135,
      desc: '평양의 지도 제작자. 강과 해안의 굽이를 재고 직접 그려 남기며, 오래된 지명과 별자리까지 해도에 적는다.' },
    { no: '09', id: 'krcrew_yu_chohui', name: '유초희', home: 229, role: 'soldier',
      st: [63, 77, 76, 82], sk: { shoot: 3, survey: 2, ops: 2, nav: 1, med: 1 }, fame: 900, wage: 125,
      desc: '제주의 정찰꾼. 활을 메고 먼저 길을 살피며, 여울과 샛길을 기억해 동료를 안전한 곳으로 이끈다.' },
    { no: '10', id: 'krcrew_jeong_yuran', name: '정유란', home: 228, lg: { 14: 3, 7: 2, 13: 2 },
      st: [51, 87, 48, 88], sk: { speech: 3, acct: 2, hist: 2, sword: 1, art: 1 }, fame: 1000, wage: 135,
      desc: '동래의 정보상. 항구에서 들은 말과 오래된 기록을 맞춰 보고 거래에 필요한 사람과 물건의 행방을 알아낸다.' },
    { no: '11', id: 'krcrew_kim_seorin', name: '김서린', home: 228, role: 'soldier',
      st: [64, 67, 81, 73], sk: { shoot: 3, survey: 2, sword: 1 }, fame: 450, wage: 95,
      desc: '동래의 궁수. 자신감 있는 반웃음을 띠고 사선과 거리를 살핀다. 활과 칼을 손질한 뒤에는 해안의 지형을 익힌다.' },
    { no: '12', id: 'krcrew_na_yeonok', name: '나연옥', home: 226,
      st: [48, 83, 34, 81], sk: { acct: 3, ops: 2 }, fame: 350, wage: 85,
      desc: '개성의 장부 관리인. 환한 웃음으로 주판을 놓고 짐의 수량과 품삯을 맞춰 본다.' },
    { no: '13', id: 'krcrew_oh_hyewon', name: '오혜원', home: 229,
      st: [50, 79, 35, 78], sk: { med: 2, sci: 2, cook: 1 }, fame: 300, wage: 80,
      desc: '제주의 약초꾼. 아픈 동료를 걱정하는 눈빛으로 풀의 쓰임을 살피고 먹기 편한 약죽을 끓인다.' },
    { no: '14', id: 'krcrew_jin_chaeun', name: '진채운', home: 190, role: 'soldier',
      st: [66, 72, 84, 68], sk: { sword: 3, ops: 2, gun: 1 }, fame: 500, wage: 100,
      desc: '한양의 호위 부관. 단정한 얼굴로 당직과 무기를 점검하고, 갑판에 다툼이 나면 앞에 나선다.' },
    { no: '15', id: 'krcrew_song_eunchae', name: '송은채', home: 228, lg: { 14: 3, 7: 3, 13: 2 },
      st: [45, 80, 33, 86], sk: { speech: 3, hist: 1 }, fame: 350, wage: 85,
      desc: '동래의 통역사. 호기심 어린 미소로 편지를 읽고 서로 다른 항구의 말과 예절을 익힌다.' },
    { no: '16', id: 'krcrew_bae_yunjeong', name: '배윤정', home: 227,
      st: [50, 82, 38, 87], sk: { speech: 2, acct: 3, craft: 1 }, fame: 450, wage: 95,
      desc: '평양의 중개인. 온화한 반웃음으로 거래를 이끌며 값을 매기기 전에 물건의 마감부터 살핀다.' },
    { no: '17', id: 'krcrew_shin_aram', name: '신아람', home: 190,
      st: [50, 73, 38, 88], sk: { music: 3, speech: 2 }, fame: 250, wage: 75,
      desc: '한양의 악사. 작은 북을 두드리며 경쾌하게 웃고 지친 선원들이 따라 부를 노래를 고른다.' },
    { no: '18', id: 'krcrew_kwon_dohui', name: '권도희', home: 229,
      st: [57, 75, 39, 82], sk: { cook: 3, med: 1, ops: 2 }, fame: 300, wage: 85,
      desc: '제주의 선상 요리사. 장난스러운 미소로 재료를 손질하고 동료의 속을 달랠 따뜻한 끼니를 차린다.' },
    { no: '19', id: 'krcrew_jang_muyeong', name: '장무영', home: 227,
      st: [61, 81, 57, 73], sk: { survey: 3, nav: 2, ops: 1 }, fame: 450, wage: 95,
      desc: '평양의 탐험가. 지도집과 표주박을 챙겨 낯선 길에 나서며, 조용하고 믿음직한 미소로 동료를 이끈다.' },
    { no: '20', id: 'krcrew_jo_soryeong', name: '조소령', home: 226, lg: { 14: 3, 7: 2 },
      st: [46, 84, 40, 85], sk: { speech: 2, acct: 1 }, fame: 300, wage: 80,
      desc: '개성의 정보상. 장옷 아래로 호기심 어린 곁눈질을 보내고 장터에서 들은 말의 값을 가늠한다.' }
  ];
  var ids = crew.map(function (m) { return m.id; });
  crew.forEach(function (m) {
    m.koreaRotation = true;
    m.face = 'portraits/mates/' + m.id;
    m.g = 'f'; m.style = 'kr'; m.role = m.role || 'sailor';
    m.lg = m.lg || { 14: 3 }; m.reg = [6]; m.y = [cfg.start, 9999];
    // 사용자가 정한 특기 수와 단계다. 지명도 공통 보강으로 새 특기를 더하지 않는다.
    m.skBoost = 1;
    G.MATES.push(m); G.MATE[m.id] = m;
    G.MATE_RANGE[m.id] = { zones: ['korea'], home: m.home };
  });

  // 시작 난수와 60년 묶음만으로 정한다. 저장 복원·옛 저장·연도 건너뛰기로 다시 뽑지 않는다.
  var periods = ids.length / cfg.count, lastSeed, lastCycle, order;
  G.KoreaCrew = {
    active: function (id, year, seed) {
      var period = Math.floor((year - cfg.start) / cfg.years);
      if (period < 0) return false;
      var cycle = Math.floor(period / periods);
      if (!order || seed !== lastSeed || cycle !== lastCycle) {
        lastSeed = seed; lastCycle = cycle;
        var rand = U.makeRng(U.strHash('korea-crew:' + seed + ':' + cycle));
        order = U.shuffle(ids.slice(), rand);
      }
      var start = (period % periods) * cfg.count, index = order.indexOf(id);
      return index >= start && index < start + cfg.count;
    },
    periodText: function (year) {
      if (year == null || year < cfg.start) return cfg.start + '년부터 ' + cfg.years + '년마다 ' + ids.length + '명 중 ' + cfg.count + '명 등장';
      var start = year - (year - cfg.start) % cfg.years;
      return start + '~' + (start + cfg.years - 1) + '년';
    }
  };
})(window.G = window.G || {});
