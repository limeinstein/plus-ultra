/* 일본 여성 항해사 10명. 1550년부터 5년마다 두 명씩, 저장별로 섞은 순서로 등장한다. */
(function (G) {
  'use strict';
  var U = G.U, cfg = G.BALANCE.japanCrew;
  var crew = [
    { no: '01', id: 'jpcrew_haruka', name: '하루카', home: 191,
      st: [58, 76, 48, 86], sk: { nav: 3, ops: 2 }, fame: 300, wage: 85,
      desc: '나가사키의 조타수. 활짝 웃으며 승선한 뒤에도 뱃전의 물살과 바람이 달라지는 순간은 놓치지 않는다.' },
    { no: '02', id: 'jpcrew_misaki', name: '미사키', home: 192,
      st: [49, 83, 42, 78], sk: { acct: 3, speech: 2 }, fame: 350, wage: 90,
      desc: '사카이 상선의 경리. 새침한 얼굴로 장부를 덮었다가도 흥정이 시작되면 누구보다 먼저 주판을 꺼낸다.' },
    { no: '03', id: 'jpcrew_rei', name: '레이', home: 193,
      st: [51, 86, 53, 79], sk: { survey: 3, nav: 2 }, fame: 450, wage: 95,
      desc: '쿄토 출신의 해도사. 부채를 접어 물길을 짚으며, 낯선 해안의 작은 굽이까지 차분하게 그려 낸다.' },
    { no: '04', id: 'jpcrew_nao', name: '나오', home: 191, role: 'soldier',
      st: [64, 62, 82, 75], sk: { gun: 3, ops: 2 }, fame: 400, wage: 95,
      desc: '나가사키 무장 상선의 포수. 호탕한 웃음으로 당직의 긴장을 풀어 주고, 포를 쏠 때면 누구보다 먼저 귀를 기울인다.' },
    { no: '05', id: 'jpcrew_shiori', name: '시오리', home: 193,
      st: [45, 85, 35, 82], sk: { med: 3, sci: 2 }, fame: 400, wage: 95,
      desc: '쿄토의 약방에서 배운 선의. 수줍게 인사하지만 아픈 선원 앞에서는 약 달이는 손길에 망설임이 없다.' },
    { no: '06', id: 'jpcrew_akira', name: '아키라', home: 192, role: 'soldier',
      st: [62, 66, 85, 72], sk: { sword: 3, ops: 2 }, fame: 450, wage: 100,
      desc: '사카이 상선의 호위 무사. 말수가 적고 눈빛이 당차며, 갑판에서 다툼이 나면 검보다 먼저 두 사람 사이에 선다.' },
    { no: '07', id: 'jpcrew_yui', name: '유이', home: 191,
      st: [50, 72, 38, 85], sk: { cook: 3, music: 2 }, fame: 200, wage: 75,
      desc: '나가사키의 선상 요리사. 처음 보는 식재료에 눈을 동그랗게 뜨고, 긴 항해에서도 선원들의 밥상을 다채롭게 차린다.' },
    { no: '08', id: 'jpcrew_sae', name: '사에', home: 193, lg: { 13: 3, 7: 3, 14: 2 },
      st: [48, 79, 37, 87], sk: { speech: 3, acct: 2 }, fame: 350, wage: 90,
      desc: '쿄토 출신의 일본 상선 통역관. 다정한 미소로 서로의 말을 듣고, 중국과 조선의 상인 사이에서도 뜻을 또렷하게 옮긴다.' },
    { no: '09', id: 'jpcrew_chiharu', name: '치하루', home: 192,
      st: [56, 73, 49, 88], sk: { music: 3, speech: 2 }, fame: 250, wage: 80,
      desc: '사카이의 선상 악사. 장난스러운 윙크로 노래를 시작하고, 낯선 항구에서도 선원들이 함께 부를 가락을 찾아낸다.' },
    { no: '10', id: 'jpcrew_rina', name: '리나', home: 192,
      st: [47, 84, 40, 86], sk: { craft: 3, acct: 2 }, fame: 400, wage: 95,
      desc: '사카이의 공예품 감정사. 여유로운 눈웃음 뒤로 비단의 짜임과 옻칠의 결을 살피며, 먼 항구에서 좋은 물건을 골라 온다.' }
  ];
  var ids = crew.map(function (m) { return m.id; });
  crew.forEach(function (m) {
    m.japanRotation = true;
    m.face = 'portraits/mates/' + m.id;
    m.g = 'f'; m.style = 'jp'; m.role = m.role || 'sailor';
    m.lg = m.lg || { 13: 3 }; m.reg = [9]; m.y = [cfg.start, 9999];
    G.MATES.push(m); G.MATE[m.id] = m;
    G.MATE_RANGE[m.id] = { zones: ['japan'], home: m.home };
  });

  // 시작 난수와 25년 묶음만으로 정한다. 저장 복원·옛 저장·연도 건너뛰기로 다시 추첨하지 않는다.
  var periods = ids.length / cfg.count, lastSeed, lastCycle, order;
  G.JapanCrew = {
    active: function (id, year, seed) {
      var period = Math.floor((year - cfg.start) / cfg.years);
      if (period < 0) return false;
      var cycle = Math.floor(period / periods);
      if (!order || seed !== lastSeed || cycle !== lastCycle) {
        lastSeed = seed; lastCycle = cycle;
        var rand = U.makeRng(U.strHash('japan-crew:' + seed + ':' + cycle));
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
