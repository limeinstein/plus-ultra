/* 식민지 경쟁에 뛰어든 나라와 회사 — 여섯 개의 생성 이야기 (사건은 js/systems/colonyco.js · G.ColonyCo). 2026-11-04 사용자 요청
   ① 네덜란드 서인도 회사 (1621, 암스테르담) — 우셀링크스의 꿈 · 청약 → 1628 피트 헤인의 은 선단 → 1629 배당 50%
   ② 프랑스 동인도 회사 (1664, 파리 — 콜베르) · 퐁디셰리 (1674, 코로만델 앞바다 — 프랑수아 마르탱)
   ③ 덴마크의 트랑케바르 (1620, 코로만델 앞바다 — 크라페와 탄자부르의 나야크, 단스보르 요새)
   ④ 신스웨덴 (1638, 크리스티나 요새 — 페터 미누이트와 레나페)
   ⑤ 쿠를란트의 토바고 (1654, 토바고 앞바다 — 야코프 공작의 「새 쿠를란트」)
   ⑥ 스코틀랜드의 다리엔 (1696 에든버러 청약 · 1698~1699 칼레도니아 만) — 나라의 돈 4분의 1이 사라진 꿈
   그림: images/legend-events/COLONYCO_PROMPT.md — 초상 portraits/history/cw_*, 장면 legend-events/cw_* */
(function (G) {
  'use strict';
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.colonyCo = G.BALANCE.colonyCo || {
    wic: { city: 24, from: 16210603, to: 16231231, opts: [1000, 3000, 10000], divAt: 16290301, div: 0.5 },
    fr: { city: 14, from: 16640827, to: 16651231, opts: [1000, 3000, 10000], payAt: 16750101, ret: 0.6, trust: 8 },   // 장사가 시원치 않아 원금의 60%만 돌아온다 (게임의 어림)
    pondy: { from: 16740101, to: 16801231, box: [79.55, 80.7, 11.55, 12.35], gold: 1500, guns: 10 },
    tranq: { from: 16200501, to: 16211231, box: [79.55, 80.7, 10.6, 11.45], gold: 1000, lang: 2 },
    nswe: { city: 260, from: 16380329, to: 16411231, speech: 2, bounty: 2000 },
    tobago: { from: 16540520, to: 16601231, box: [-61.2, -60.15, 10.9, 11.7], food: 30, gold: 1200 },
    darienSub: { city: 42, from: 16960226, to: 16960831, opts: [1000, 3000, 10000] },          // 돈은 돌아오지 않는다
    darien: { from: 16981104, to: 16990620, box: [-78.3, -77.1, 8.5, 9.4], food: 30, price: 4, minSell: 2000 }  // 굶주린 이주민에게 식량을 판다면 값을 이만큼 곱해 받을 수 있다
  };
  var F = G.HIST_FIG = G.HIST_FIG || {};
  var L = {
    cw_usselincx: { name: '빌럼 우셀링크스', title: '서인도 회사를 꿈꾼 안트베르펜 상인', st: 'ne', role: 'merchant', born: 1567,
      look: '50대, 흰 머리와 긴 수염, 낡은 검은 외투, 품에 두툼한 설계 문서 뭉치, 열정에 찬 눈' },
    cw_heeren: { name: '열아홉 이사', title: '서인도 회사의 이사회 (헤렌 XIX)', st: 'ne', role: 'merchant', born: 1570,
      look: '검은 옷에 흰 맷돌 깃을 단 상인 여럿, 긴 탁자, 은 잉크병' },
    cw_colbert: { name: '장바티스트 콜베르', title: '프랑스 재무총감', st: 'it', role: 'official', born: 1619,
      look: '40대 중반, 길고 검은 곱슬 가발, 엄격한 얼굴, 검은 비단 옷에 흰 레이스 깃, 손에 장부' },
    cw_martin: { name: '프랑수아 마르탱', title: '프랑스 동인도 회사 퐁디셰리 책임자', st: 'it', role: 'official', born: 1634,
      look: '40세, 햇볕에 탄 얼굴, 짧은 갈색 가발, 땀에 젖은 셔츠 소매를 걷어 올림, 손에 설계도' },
    cw_crappe: { name: '롤란 크라페', title: '덴마크 동인도 회사 상관장', st: 'ne', role: 'merchant', born: 1585,
      look: '30대 중반, 네덜란드 출신, 짧은 수염, 인도식 터번을 쓴 유럽 옷차림, 손에 조약 문서' },
    cw_gjedde: { name: '오베 기에데', title: '덴마크 동인도 함대 제독', st: 'ne', role: 'captain', born: 1594,
      look: '20대 중반, 젊고 오만한 귀족, 금발, 덴마크 붉은 십자 어깨띠, 칼' },
    cw_minuit: { name: '페터 미누이트', title: '신스웨덴 원정대장 (전 뉴암스테르담 총독)', st: 'ne', role: 'official', born: 1580,
      look: '50대 후반, 둥근 얼굴, 회색 수염, 넓은 모자와 검은 외투, 손에 땅 문서' },
    cw_mattahorn: { name: '마타호른', title: '레나페(델라웨어) 사람들의 추장', st: 'an', role: 'native', born: 1590,
      look: '40대, 깃털 꽂은 머리, 조개 구슬(왐펌) 띠, 사슴 가죽 망토, 위엄 있는 얼굴' },
    cw_mollens: { name: '빌럼 몰런스', title: '쿠를란트 공작의 선장 · 토바고 원정대장', st: 'ne', role: 'captain', born: 1615,
      look: '40대, 네덜란드 출신의 뱃사람, 붉은 얼굴, 쿠를란트 공작의 검은 가재 깃발' },
    cw_paterson: { name: '윌리엄 패터슨', title: '스코틀랜드 회사의 설계자 · 잉글랜드 은행을 세운 이', st: 'ne', role: 'merchant', born: 1658,
      look: '30대 후반, 열정적인 눈, 긴 갈색 가발, 소박한 검은 옷, 손에 파나마 지협 지도' }
  };
  Object.keys(L).forEach(function (id) { if (!F[id]) { L[id].id = id; F[id] = L[id]; } });
  G.COLONYCO_FIGS = Object.keys(L);

  var IT = [
    { id: 'wic_share', name: '서인도 회사 주식 증서', gv: 16, desc: '1621년 암스테르담에서 청약한 네덜란드 서인도 회사의 몫. 아메리카와 서아프리카의 장사, 그리고 에스파냐 선단을 노리는 사략의 몫이다.' },
    { id: 'fr_eic_share', name: '프랑스 동인도 회사 출자 증서', gv: 14, desc: '1664년 파리에서 콜베르의 권유로 낸 출자의 증서. 왕의 이름이 맨 위에 적혀 있다.' },
    { id: 'pondy_plan', name: '퐁디셰리의 첫 설계도', gv: 20, desc: '1674년 프랑수아 마르탱이 모래톱 마을 위에 그린 첫 성채와 거리의 설계도. 귀퉁이에 제독의 배 이름이 적혀 있다.' },
    { id: 'dansborg_seal', name: '단스보르 요새의 밀랍 인장', gv: 18, desc: '1620년 탄자부르의 나야크와 덴마크 동인도 회사가 맺은 트랑케바르 조약에 찍힌 인장의 본. 덴마크 왕관과 사자가 새겨져 있다.' },
    { id: 'wampum_belt', name: '레나페의 조개 구슬 띠', gv: 18, desc: '1638년 크리스티나 요새에서 레나페의 추장 마타호른이 건넨 왐펌 띠. 하얀 조개와 보랏빛 조개로 「공정한 거래」의 무늬를 엮었다.' },
    { id: 'courland_letter', name: '쿠를란트 공작의 감사장', gv: 16, desc: '야코프 공작의 「새 쿠를란트」 이주민을 도운 제독에게 보낸 감사장. 검은 가재 문장이 찍혀 있다.' },
    { id: 'darien_share', name: '스코틀랜드 회사 출자 증서', gv: 10, desc: '1696년 에든버러에서 낸 「아프리카·인도 무역 스코틀랜드 회사」의 출자 증서. 다리엔의 꿈과 함께 종이 한 장이 되었다.' }
  ];
  if (G.ITEMS && G.ITEM) IT.forEach(function (x) {
    if (G.ITEM[x.id]) return;
    var it = { id: x.id, name: x.name, kind: 'keepsake', price: 0, gv: x.gv, reg: [], desc: x.desc };
    G.ITEMS.push(it); G.ITEM[it.id] = it;
  });
})(window.G = window.G || {});
