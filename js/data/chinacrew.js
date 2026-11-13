/* 중국 항해사 24명. 초상 번호는 고정하고, 등장 순서만 저장별·주기별로 섞는다. */
(function (G) {
  'use strict';
  var U = G.U, cfg = G.BALANCE.chinaCrew;
  var crew = [
    { no: '01', id: 'cncrew_shen_heng', name: '심형', home: 175, st: [54, 85, 43, 66], sk: { survey: 3, nav: 2 }, fame: 450, wage: 95,
      desc: '천주의 해도사. 사공들이 귀항할 때마다 모래톱이 어디까지 옮겨 갔는지 묻고 해도를 고친다.' },
    { no: '02', id: 'cncrew_zhao_shuo', name: '조삭', home: 176, role: 'soldier', st: [78, 57, 84, 63], sk: { sword: 3, ops: 2 }, fame: 350, wage: 90,
      desc: '복주 상선의 호위 무사. 배를 댈 때면 짐을 먼저 내리고 마지막에 널빤지를 건넌다.' },
    { no: '03', id: 'cncrew_tao_kuan', name: '도관', home: 174, st: [88, 56, 76, 65], sk: { ops: 3, ship: 1 }, fame: 300, wage: 85,
      desc: '갑판장. 돛줄을 당길 때 선창까지 들리는 목소리로 박자를 센다.' },
    { no: '04', id: 'cncrew_wen_jian', name: '문간', home: 174, st: [51, 79, 43, 83], sk: { speech: 3, acct: 1 }, lg: { 7: 3, 12: 3, 13: 2 }, fame: 400, wage: 95,
      desc: '광주의 통역관. 흥정이 막히면 양쪽 상인이 쓰는 저울부터 한 탁자에 올린다.' },
    { no: '05', id: 'cncrew_luo_xun', name: '나순', home: 287, st: [68, 78, 69, 61], sk: { survey: 2, nav: 3 }, fame: 400, wage: 90,
      desc: '선단 정찰원. 작은 배로 먼저 만에 들어가 암초 사이의 물길을 살핀다.' },
    { no: '06', id: 'cncrew_fan_yong', name: '범용', home: 175, st: [89, 53, 81, 60], sk: { ops: 2, sword: 1 }, fame: 100, wage: 55,
      desc: '선창 짐꾼. 무거운 항아리가 배의 한쪽에 몰리지 않게 바닥에 분필로 자리를 그린다.' },
    { no: '07', id: 'cncrew_yu_xian', name: '유현', home: 177, st: [55, 72, 44, 84], sk: { music: 3, speech: 1 }, fame: 250, wage: 75,
      desc: '항주의 선상 악사. 교대가 늦어지는 밤이면 가락을 바꿔 졸고 있는 당직을 깨운다.' },
    { no: '08', id: 'cncrew_wei_song', name: '위송', home: 176, st: [72, 77, 61, 57], sk: { ship: 3, craft: 2 }, fame: 400, wage: 95,
      desc: '복주의 선목수. 멀쩡해 보이는 선체에서도 나무못이 헐거워진 소리를 찾아낸다.' },
    { no: '09', id: 'cncrew_gu_man', name: '고만', home: 288, st: [68, 64, 49, 79], sk: { cook: 3, ops: 1 }, fame: 150, wage: 65,
      desc: '선상 요리사. 닻을 올린 뒤 맨 마지막에 식사하러 온 선원의 국도 따로 데워 둔다.' },
    { no: '10', id: 'cncrew_xu_jin', name: '서근', home: 177, st: [50, 84, 42, 63], sk: { acct: 3, ops: 2 }, fame: 400, wage: 95,
      desc: '선단 회계원. 여러 배에 나눠 실은 비단 한 필까지 어느 선창에 들었는지 적어 둔다.' },
    { no: '11', id: 'cncrew_qin_su', name: '진소', home: 175, st: [52, 86, 45, 67], sk: { med: 3, sci: 2 }, fame: 500, wage: 100,
      desc: '선의. 병자가 약을 삼킬 수 있게 뱃멀미가 잦아드는 때를 기다려 달임약을 낸다.' },
    { no: '12', id: 'cncrew_pei_yan', name: '배언', home: 174, st: [53, 78, 46, 73], sk: { craft: 3, acct: 2 }, fame: 350, wage: 90,
      desc: '도자기 감정사. 선창에서 금이 간 그릇과 가마에서부터 흠이 있던 그릇을 구별한다.' },
    { no: '13', id: 'cncrew_du_qiu', name: '두추', home: 288, st: [54, 80, 49, 65], sk: { nav: 2, sci: 2 }, fame: 250, wage: 75,
      desc: '선상 시각지기. 구름이 걷히면 별의 위치를 살펴 밤 당직이 바뀔 때를 알린다.' },
    { no: '14', id: 'cncrew_jiang_feng', name: '강봉', home: 176, st: [70, 69, 65, 72], sk: { ops: 2, nav: 2 }, fame: 200, wage: 70,
      desc: '선단의 기수. 비에 젖은 깃발도 신호가 또렷이 보이도록 손목으로 크게 돌린다.' },
    { no: '15', id: 'cncrew_deng_zhou', name: '등주', home: 287, st: [74, 72, 65, 62], sk: { nav: 3, survey: 2 }, fame: 450, wage: 95,
      desc: '항만 도선사. 뱃전에 물이 닿는 소리만 듣고도 여울을 벗어난 때를 짚는다.' },
    { no: '16', id: 'cncrew_lu_an', name: '노안', home: 177, st: [77, 66, 67, 55], sk: { ops: 2, nav: 1 }, fame: 150, wage: 65,
      desc: '야간 당직 선원. 등불 심지를 다듬어 두고 안개 너머에서 들리는 노 소리를 센다.' },
    { no: '17', id: 'cncrew_peng_he', name: '팽하', home: 175, st: [76, 67, 59, 68], sk: { nav: 2, cook: 2 }, fame: 200, wage: 70,
      desc: '어로장. 뜬고기 떼를 보고 그물 내릴 곳을 정하고, 잡은 고기는 선원들과 함께 손질한다.' },
    { no: '18', id: 'cncrew_ji_ren', name: '계인', home: 288, st: [65, 73, 54, 61], sk: { ship: 2, craft: 2 }, fame: 200, wage: 70,
      desc: '돛 수선공. 바람을 팽팽하게 받은 자리부터 살펴 헝겊을 어느 결로 덧댈지 정한다.' },
    { no: '19', id: 'cnvet_lu_zhen', name: '육진', home: 175, role: 'soldier',
      st: [81, 58, 86, 66], sk: { sword: 3, nav: 2, ops: 1 }, fame: 850, wage: 115,
      desc: '변경 기병 출신의 선단 호위. 투구에 꽂았던 꿩깃 한 쌍을 상투에 달고 다닌다.',
      story: '마지막 군마를 인계한 날, 육진은 안장을 팔아 천주로 가는 배를 탔다. 첫 항해에서 멀미가 어찌나 심했던지 지금도 신참이 비틀거리면 말없이 제 자리를 내준다.' },
    { no: '20', id: 'cnvet_shi_gang', name: '석강', home: 176, role: 'soldier',
      st: [89, 52, 88, 60], sk: { ops: 3, sword: 2, nav: 1 }, fame: 800, wage: 115,
      desc: '중갑 보병 출신의 갑판장. 굵은 목소리로 구령을 붙여 선원들의 밧줄 당기는 박자를 맞춘다.',
      story: '석강이 배에서 처음 배운 것은 힘을 빼는 법이었다. 혼자 들어도 꿈쩍 않던 짐이 늙은 뱃사람의 도르래 하나로 떠올랐다. 제 갑판을 맡은 지금도 그 도르래를 손수 기름쳐 쓴다.' },
    { no: '21', id: 'cnvet_gan_chao', name: '감조', home: 174,
      st: [70, 74, 72, 68], sk: { survey: 3, nav: 2, sword: 1 }, fame: 600, wage: 105,
      desc: '수군 척후병 출신의 연안 길잡이. 물이 빠져야 드러나는 여울까지 제 해도에 그려 넣는다.',
      story: '감조는 물안개 속에서 동료의 배를 놓친 뒤로 놋방울 둘을 차고 다닌다. 이제 그 소리를 듣고 따라오는 이는 섬 사이로 소금을 나르는 뱃사람들이다.' },
    { no: '22', id: 'cnvet_han_ding', name: '한정', home: 177, role: 'soldier',
      st: [68, 79, 77, 58], sk: { nav: 3, ops: 2, sword: 2 }, fame: 900, wage: 125,
      desc: '변경 수비병 출신의 호송선 항해사. 나침반을 덮기 전에 선단의 마지막 돛부터 센다.',
      story: '젊은 날 성문을 닫을 때면 한정은 마지막 순찰병이 돌아올 때까지 빗장을 들고 기다렸다. 호송선에서도 성미는 같다. 해가 지면 뒤처진 작은 배 곁에 자기 배를 댄다.' },
    { no: '23', id: 'cnvet_liang_tie', name: '양철', home: 287,
      st: [78, 68, 71, 55], sk: { ship: 3, nav: 1, ops: 2 }, fame: 450, wage: 95,
      desc: '부교를 놓던 공병 출신의 선박 수리공. 나무망치로 널을 두드려 물이 스미는 곳을 찾는다.',
      story: '장마에 떠내려가던 부교에서 양철을 건져 준 것은 하문의 작은 고깃배였다. 뭍에 닿자 그는 새는 배 밑을 고쳐 주었다. 그 솜씨를 본 어부들이 차례로 배를 맡기면서 항구에 눌러앉았다.' },
    { no: '24', id: 'cnvet_he_run', name: '하윤', home: 288,
      st: [73, 65, 69, 62], sk: { nav: 3, ops: 2, acct: 1 }, fame: 400, wage: 90,
      desc: '군량 수송병 출신의 조타수. 곡식이 가득 실린 배가 물살을 만나면 어느 쪽으로 기울지 안다.',
      story: '대운하에서 군량을 나르며 하윤은 빈 배와 만재한 배의 키가 전혀 다르게 듣는다는 것을 배웠다. 오늘도 출항 전에 짐칸을 한 바퀴 돈 뒤에야 키를 잡는다.' }
  ];
  var ids = crew.map(function (m) { return m.id; });
  crew.forEach(function (m) {
    m.chinaRotation = true;
    m.face = 'portraits/mates/chinese-men/' + m.no;
    m.g = 'm'; m.style = 'cn'; m.role = m.role || 'sailor';
    m.lg = m.lg || { 7: 3 }; m.reg = [6]; m.y = [cfg.start, 9999];
    G.MATES.push(m); G.MATE[m.id] = m;
    G.MATE_RANGE[m.id] = { zones: ['china'], home: m.home };
  });

  // 저장의 시작 난수와 주기 번호만으로 명단이 정해진다. 옛 저장과 연도 건너뛰기에도 같은 결과다.
  var periods = ids.length / cfg.count, lastSeed, lastCycle, order;
  G.ChinaCrew = {
    active: function (id, year, seed) {
      var period = Math.floor((year - cfg.start) / cfg.years);
      if (period < 0) return false;
      var cycle = Math.floor(period / periods);
      if (!order || seed !== lastSeed || cycle !== lastCycle) {
        lastSeed = seed; lastCycle = cycle;
        var rand = U.makeRng(U.strHash('china-crew:' + seed + ':' + cycle));
        order = U.shuffle(ids.slice(), rand);
      }
      var start = (period % periods) * cfg.count, index = order.indexOf(id);
      return index >= start && index < start + cfg.count;
    },
    periodText: function (year) {
      if (year == null) return cfg.start + '년부터 ' + cfg.years + '년마다 ' + ids.length + '명 중 ' + cfg.count + '명 등장';
      var start = year - (year - cfg.start) % cfg.years;
      return start + '~' + (start + cfg.years - 1) + '년';
    }
  };
})(window.G = window.G || {});
