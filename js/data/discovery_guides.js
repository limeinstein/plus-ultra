/* 원고 96의 지역 길잡이. 역사 인물과 이름이 겹칠 수 있는 창작 인물이며, 권력자가 아니다. */
(function (G) {
  'use strict';
  G.BALANCE.discoveryGuides = { tenzing: { st: [82, 70, 60, 66], sk: { survey: 3, ops: 2, nav: 2 }, wage: 70 }, kaitau: { st: [76, 78, 56, 72], sk: { nav: 3, survey: 3, music: 2 }, wage: 80 }, tekle: { st: [52, 88, 36, 80], sk: { hist: 3, med: 3, speech: 2 }, wage: 65 } };
  G.DISC_GUIDES = [
    { id: 'ds_tenzing', key: 'tenzing', name: '텐징', style: 'in', age: 'mid', discRole: '베테랑', lg: { 8: 3, 7: 1 },
      desc: '쿰부 계곡 남체에서 야크를 몰던 셰르파 안내인. 서른 무렵의 창작 인물. 산을 어머니라 부르며 서두르는 사람을 말린다. 높은 곳에서 짐을 나르고 길을 읽는 데 익숙하다.',
      title: '짐꾼 구함', meet: ['바다 사람이 산에 오시오? 산은 바다보다 조용하지만 바다보다 참을성이 없소.', '하루에 조금씩 오르시오. 서두르면 머리가 아프오. 엄마 산은 서두르는 아이를 싫어하오.', '짐은 내가 지겠소. 대신 내가 멈추라 하면 멈추시오. 그게 품삯이오.'],
      request: '고산 발견물의 길잡이가 되어 함께 걷겠소. 내 말대로 천천히 올라 주겠소?', sail: '배는 처음이오. 땅이 흔들리는구려… 산이 그립소. 그래도 가 보겠소.' },
    { id: 'ds_kaitau', key: 'kaitau', name: '카이 타우', style: 'af', age: 'mid', discRole: '노장', lg: { 12: 3, 1: 1 },
      desc: '아오테아로아 북섬의 카누 길잡이 집안에서 자란 마오리 항해사. 마흔 무렵의 창작 인물. 별과 파도와 새를 읽고 조상의 항해 노래를 외운다. 손님을 극진히 맞는다.',
      title: '별로 길을 찾는 사람', meet: ['그대 배에는 나침반이 있구려. 우리는 별과 파도와 새를 보오. 둘 다 길이오.', '내 조상 쿠페는 길고 흰 구름을 보고 땅을 찾았소. 나는 그 구름 밑에서 태어났지.', '나를 고향 앞바다까지 데려다주시오. 그 대신 이 바다의 길을 다 알려 주겠소.'],
      request: '길고 흰 구름의 땅 앞바다까지 함께 가 주겠소?', sail: '이 배는 카누보다 무겁구려. 그래도 바다는 무게를 따지지 않소. 갑시다.' },
    { id: 'ds_tekle', key: 'tekle', name: '테클레 마리암', style: 'af', age: 'old', discRole: '선교사', lg: { 10: 3, 5: 2 },
      desc: '아비시니아 고원의 바위 교회에서 게에즈 경전을 읽던 수도사. 쉰 무렵의 창작 인물. 느리고 부드럽게 말하며 오래된 글과 약초를 안다. 죽기 전에 바다를 보고 싶어 한다.',
      title: '바깥세상을 보고 싶은 수도사', meet: ['그대들 나라에선 우리 왕을 프레스터 존이라 불렀다지요. 우리는 그 이름을 몰랐소.', '나는 평생 이 산 위에서 바다 이야기만 들었소. 죽기 전에 소금물을 한 번 맛보고 싶소.', '경전 한 권과 약초 자루 하나면 짐은 다요. 형제여, 데려가 주시오.'],
      request: '수도원장께 책이나 종 하나를 선물하고 나와 길동무가 되어 주겠소?', sail: '이것이 바다로구려. 짜오. 하느님이 이렇게 큰 그릇을 만드셨구려.' }
  ];
  G.DISC_GUIDES.forEach(function (d) {
    var k = G.BALANCE.discoveryGuides[d.key];
    d.g = 'm'; d.st = k.st; d.sk = k.sk; d.wage = k.wage; d.reg = []; d.y = [1480, 1700]; d.fame = 0; d.eventOnly = true; d.skBoost = 1;
    if (G.MATE[d.id]) throw new Error('길잡이 ID 중복: ' + d.id);
    G.MATES.push(d); G.MATE[d.id] = d;
  });
})(window.G = window.G || {});
