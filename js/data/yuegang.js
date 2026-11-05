/* 융경개관 — 해금 정책의 부분 완화(1567), 복건 월항 — 사람·소지품·조정값 (사건: js/systems/yuegang.js) 2026-11-05 사용자 요청
   ■ 사람 (G.HIST_FIG): 복건 순무 도택민 · 진씨 상단의 진대랑(지어낸 인물) · 해방관의 관원(지어낸 인물) · 밀무역선 선주(지어낸 인물)
   ■ 소지품: 월항의 선인(yg_license — 진씨 상단과 동업한 증서 · 팔 수 없다) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('yg_tu', { name: '도택민', title: '복건 순무', st: 'cn', role: 'official', born: 1510, look: '50대, 검은 사모와 학을 수놓은 흉배, 지친 눈 아래 다크서클, 상소문 뭉치' });
  fig('yg_chen', { name: '진대랑', title: '해징 진씨 상단의 셋째', st: 'cn', role: 'merchant', born: 1530, fiction: true, look: '30대, 햇볕에 그을린 얼굴, 주판을 허리에 찬 짧은 도포, 웃을 때 금니 하나' });
  fig('yg_clerk', { name: '해방관의 관원', title: '월항의 배와 세금을 다루는 관리', st: 'cn', role: 'official', born: 1525, fiction: true, look: '40대, 장부와 인장, 깐깐한 입매' });
  fig('yg_smuggler', { name: '밀무역선 선주', title: '월항 갯벌의 밤배 주인', st: 'cn', role: 'sailor', born: 1520, fiction: true, look: '40대, 맨발, 칼자국 진 팔, 두건' });
  G.YUEGANG_FIGS = ['yg_tu', 'yg_chen', 'yg_clerk', 'yg_smuggler'];

  if (G.ITEMS && G.ITEM && !G.ITEM.yg_license) {
    var it = { id: 'yg_license', name: '월항의 선인(船引)', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1567년 월항이 열린 뒤 해징 진씨 상단의 배에 내린 바다 나들이 허가장 — 그 배의 짐 몫 절반이 제독의 것이라는 동업 증서가 뒷장에 붙어 있다. 이것을 보이면 하문·천주의 관원이 「진씨 상단의 동업자」로 들여보낸다. 팔 수 없다.' };
    G.ITEMS.push(it); G.ITEM.yg_license = it;
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.yuegang = G.BALANCE.yuegang || {
    smuggle: { gold: 2500, noto: 4, catch: 0.35 },   // ① 밀무역 짐 — 값 · 악명 · 순찰에 걸릴 가망 (걸리면 육상전)
    invest: 4000,               // ② 동업에 넣는 금화
    every: 180,                 // 배당 사이 (날) — 하문에 들를 때
    rate: 0.25, rateSilver: 0.4, // 배당률 (1571년 마닐라가 열린 뒤 은이 들어오면 rateSilver)
    payTo: 16200101,            // 배당이 끝나는 날
    foe: { patrol: 16 },
    fame: { petition: 80, open: 60 }
  };
})(window.G = window.G || {});
