/* 막 왕조의 성립 — 꼬짜이의 어부가 대월의 임금이 되다 (사건: js/systems/macdang.js) 2026-11-07 사용자 요청
   「1527 베트남 — 막 왕조 성립. 막당중이 레 왕조의 왕위를 차지함. 이후 레 왕조 복구 세력과의 장기적인 권력 투쟁으로 이어짐」 · 「플레이어와 관계되는 미형 인물 등장하게 해」
   ■ 사람 (G.HIST_FIG): 막당중 · 레 꿍 호앙(공황) · 태후 · 레 주이 닌(뒷날의 장종 — 열두 살 소년) · 응우옌 낌 · 막의 금위 장수(지어낸 인물)
     응우옌 빈 키엠은 원래 있던 지역 사람 동료 h_nguyenbinhkhiem (js/data/regionfolk.js) — 말하는 사람으로만 선다
   ■ 동료 둘 (사건으로만 — eventOnly)
     · 후옌(md_huyen) — 태후전의 여관(女官). 쟁을 타고 한문을 읽는다 (지어낸 인물 · 여자 어른 — 연애도 된다)
     · 끼엔(md_kien) — 막당중과 같은 꼬짜이 바닷마을의 어부 아들이자 씨름꾼 (지어낸 인물 · 연애 없음 — 바다와 혼인한 사람 wed: 'sea')
   ■ 소지품: 막당중의 그물추(md_sinker) · 후옌의 대모 빗(md_comb) · 진남관의 밧줄 한 토막(md_rope — 팔 수 없다)
   ■ 얼굴: images/portraits/mates/md_*.webp · _half.webp (없으면 코드 초상) — 개발노트의 그림 주문 */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = G.HIST_FIG || {};
  function fig(id, o) { if (!F[id]) { o.id = id; F[id] = o; } }
  fig('md_mac', { name: '막당중', title: '인국공 · 뒷날 막 왕조를 연 임금', st: 'cn', role: 'noble', born: 1483, look: '40대, 어부 출신의 떡 벌어진 어깨와 굵은 목, 검게 칠한 이, 붉은 관복 위로 드러난 씨름꾼의 팔뚝, 웃음기 없는 넓은 얼굴' });
  fig('md_cung', { name: '레 꿍 호앙', title: '대월 레 왕조의 임금 · 공황(恭皇)', st: 'cn', role: 'noble', born: 1507, look: '20세 안팎, 창백하고 여린 얼굴, 몸에 맞지 않는 노란 곤룡포, 늘 곁의 권신을 곁눈질하는 눈' });
  fig('md_dowager', { name: '태후', title: '소종과 공황의 어머니', st: 'cn', role: 'noble', g: 'f', born: 1480, look: '40대 후반, 검은 비단 두건, 검게 칠한 이, 꼿꼿이 앉은 몸, 염주를 쥔 마른 손' });
  fig('md_ninh', { name: '레 주이 닌', title: '쫓겨난 소종의 아들 · 열두 살의 왕손', st: 'cn', role: 'noble', born: 1515, minor: true, look: '열두 살, 부엌 머슴의 무명옷을 입은 소년, 그을음 묻은 볼, 겁먹었지만 꼭 다문 입' });
  fig('md_kim', { name: '응우옌 낌', title: '레 왕조의 옛 장수 · 탄호아의 충신', st: 'cn', role: 'soldier', born: 1468, look: '50대 후반, 흰 수염, 낡은 갑옷 위 갈색 도롱이, 강 어귀 갈대숲에 선 굳은 얼굴' });
  fig('md_guard', { name: '막의 금위 장수', title: '탕롱 성문을 지키는 금위의 우두머리', st: 'cn', role: 'soldier', born: 1490, fiction: true, look: '30대, 붉은 전포와 대나무 비늘 갑옷, 긴 창, 횃불에 번들거리는 얼굴' });
  G.MACDANG_FIGS = ['md_mac', 'md_cung', 'md_dowager', 'md_ninh', 'md_kim', 'md_guard'];

  // ── 동료 (사건으로만)
  function mate(o) {
    o.tale = true; o.legend = true; o.fame = 0; o.wage = 0; o.reg = []; o.eventOnly = true;
    o.face = 'portraits/mates/' + o.id; o.facePool = 'vn';
    if (G.MATES && G.MATE && !G.MATE[o.id]) { G.MATES.push(o); G.MATE[o.id] = o; }
  }
  mate({ id: 'md_huyen', name: '후옌', g: 'f', style: 'cn', role: 'maid', tone: 'polite', age: 'young', st: [42, 82, 36, 94], sk: { speech: 2, music: 2, med: 1, hist: 1 }, lg: { 13: 3, 7: 2 }, y: [1522, 1580],
    desc: '탕롱 궁성의 태후전에서 일하던 여관(女官). 옥빛 비단의 교령포(깃을 여민 긴 옷)에 검은 비단 띠로 긴 머리를 감아 올렸고, 웃을 때 옻칠처럼 검게 칠한 이가 반짝인다 — 대월에서 가장 고운 이라는 칭찬이다. 쟁을 타고 한문 서찰을 쓰며, 태후의 약시중을 들다 약재 이름을 다 외웠다. 이름은 「검고 깊다」는 뜻이다.' });
  mate({ id: 'md_kien', name: '끼엔', g: 'm', wed: 'sea', style: 'cn', role: 'sailor', tone: 'shonen', age: 'young', st: [86, 58, 72, 88], sk: { ship: 2, sword: 2, nav: 1 }, lg: { 13: 3 }, y: [1522, 1575],
    desc: '막당중과 같은 꼬짜이 바닷마을에서 난 어부의 아들이자 씨름꾼. 키가 크고 햇볕에 구운 구릿빛 몸에, 바닷물에 젖은 듯 검은 긴 머리를 정수리에 틀어 올렸다. 짙은 눈썹 아래 웃음이 많은 눈, 검게 칠한 이가 드러나는 시원한 웃음 — 마을 처녀들은 씨름판보다 그의 얼굴을 보러 온다고 한다. 「바다와 혼인했다」며 장가 이야기만 나오면 그물을 고치러 간다.' });

  // ── 소지품
  if (G.ITEMS && G.ITEM) {
    var add = function (it) { if (!G.ITEM[it.id]) { G.ITEMS.push(it); G.ITEM[it.id] = it; } };
    add({ id: 'md_sinker', name: '막당중의 그물추', kind: 'special', price: 0, reg: [], rare: true,
      desc: '막당중이 젊은 날 꼬짜이 앞바다에서 쓰던 납 그물추. 손때에 반질반질하다. 「나도 고기를 잡던 손이오. 그물은 한 번 던지면 거두어야 하오.」' });
    add({ id: 'md_comb', name: '후옌의 대모 빗', kind: 'special', price: 0, reg: [], rare: true,
      desc: '대모(바다거북 등딱지)로 깎은 반달 빗. 태후가 아끼던 여관에게 내린 것으로, 등에 작은 글씨로 「黎(레)」 한 자가 새겨져 있다. 마 강 어귀의 새벽, 후옌이 제독의 손에 쥐여 주었다.' });
    add({ id: 'md_rope', name: '진남관의 밧줄 한 토막', kind: 'special', price: 0, reg: [], rare: true, noSell: true,
      desc: '1540년 겨울, 막당중이 목에 밧줄을 걸고 맨발로 진남관에 나가 명의 장수 앞에 엎드렸다. 그 밧줄의 끝을 끊어 온 것. 「씨름꾼은 목에 밧줄을 걸지 않습니다.」 팔 수 없다.' });
  }

  G.BALANCE = G.BALANCE || {};
  G.BALANCE.macdang = G.BALANCE.macdang || {
    order: { good: 'guns', n: 20, k: 2, days: 240 },   // ① 인국공이 찾는 남만의 총 — n통 · 시세의 k배 · 기한(날)
    medicine: 200,                                     // ① 태후의 약값 (금화)
    wrestle: 62,                                       // ① 끼엔과의 씨름 — 힘(str)이 이만큼이면 이긴다 (모자라면 진다 — 어느 쪽이든 벗이 된다)
    gift: 2000,                                        // ② 막의 즉위 잔치에서 받는 하사금 (총을 바쳤으면 +1000)
    voyage: 3,                                         // ② 탕롱에서 마 강 어귀까지 (날)
    foe: { wharf: 16 },                                // ② 홍강 부두의 금위
    fame: { wrestle: 40, guns: 60, escape: 180, mac: 80, kien: 100, huyen: 120 }
  };
})(window.G = window.G || {});
