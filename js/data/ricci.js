/* 마테오 리치의 중국 내륙 선교 시작(1583) — 사람·소지품·조정값 (사건: js/systems/ricci.js) 2026-11-05 사용자 요청
   ■ 사람 (G.HIST_FIG): 마테오 리치 · 미켈레 루지에리 · 조경 지부 왕반 · 조경의 선비 · 서광계(동료 h_xuguangqi 가 있으면 그 얼굴)
     얼굴: images/portraits/history/<id>.webp (없으면 코드 초상)
   ■ 소지품: 자명종(rc_clock — 왕반에게 바치는 선물) · 산해여지도 사본(rc_map) · 『기하원본』(rc_euclid) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('rc_ricci', { name: '마테오 리치', title: '예수회 신부 · 중국 이름 이마두(利瑪竇)', st: 'it', role: 'priest', born: 1552, look: '30대 초반(1583) / 50대(1607), 처음엔 깎은 머리에 회색 승복, 뒤에는 긴 수염에 선비의 비단 도포와 사방건' });
  fig('rc_ruggieri', { name: '미켈레 루지에리', title: '예수회 신부 · 중국 이름 나명견(羅明堅)', st: 'it', role: 'priest', born: 1543, look: '40대, 깎은 머리, 회색 승복, 한문 책을 낀 팔, 온화하고 고집 센 얼굴' });
  fig('rc_wangpan', { name: '왕반', title: '조경 지부(知府)', st: 'cn', role: 'official', born: 1539, look: '40대, 검은 사모와 흉배를 단 관복, 호기심 많은 눈' });
  fig('rc_scholar', { name: '조경의 선비', title: '세상 지도를 보러 온 거인(擧人)', st: 'cn', role: 'scholar', born: 1550, fiction: true, look: '30대, 사방건, 부채, 지도 앞에서 굳은 얼굴' });
  fig('rc_xu', { name: '서광계', title: '한림원의 관리 · 리치의 벗', st: 'cn', role: 'scholar', born: 1562, mate: 'h_xuguangqi', look: '40대, 관복, 붓과 컴퍼스를 함께 쥔 손' });
  G.RICCI_FIGS = ['rc_ricci', 'rc_ruggieri', 'rc_wangpan', 'rc_scholar', 'rc_xu'];
  // 초기 조경의 승복과 북경 시기의 선비 복식을 사건 연도에 맞춰 고른다.
  F.rc_ricci.periodFaces = [{ from: 1595, face: 'portraits/history/rc_ricci_late' }];

  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'rc_map', name: '산해여지도 사본', kind: 'special', price: 0, reg: [], rare: true,
      desc: '1584년 조경에서 마테오 리치가 그린 세계 지도의 사본. 명나라를 한가운데 두고 그 둘레에 유럽·아프리카·아메리카를 그렸다. 바닷길 몇 줄은 바다에서 온 한 선장의 해도로 고쳐 그렸다.' });
    add({ id: 'rc_euclid', name: '『기하원본』', kind: 'special', price: 0, reg: [], rare: true,
      desc: '1607년 북경에서 마테오 리치가 말로 옮기고 서광계가 붓으로 적은 에우클레이데스 『원론』 앞 여섯 권의 한문 번역. 「점은 나뉘지 않는 것이다」로 시작한다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.ricci = G.BALANCE.ricci || {
    clock: 1200,                 // ① 왕반에게 바칠 자명종 값
    map: { known: 60, found: 20 },  // ② 제독의 해도가 지도를 크게 고치는 기준 (아는 도시 · 발견물)
    fame: { zq: 100, map: 160, mapSmall: 60, euclid: 120 }
  };
})(window.G = window.G || {});
