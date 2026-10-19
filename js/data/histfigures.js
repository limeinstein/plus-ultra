/* 큰 해전·역사 사건에 나오는 실제 인물들 (G.HIST_FIG · G.Hist) — 2026-10-18
   칼레 해전(1588, js/systems/tudor.js) · 레판토 해전(1571, js/data/relevents.js cr_league1571) · 하이레딘 바르바로사의 툴롱 겨울과 제노바(1543~1544, js/systems/barbarossa.js)

   ■ 얼굴 그림 (Codex) — 있으면 그것을, 없으면 아래 차례로 찾는다
     1) images/portraits/history/<id>.webp (384×384 얼굴) · <id>_half.webp (1024×1536 투명 무릎상)
     2) images/portraits/rivals/<이름>.webp · _half  (경쟁 탐험가 그림과 같은 규격 — images/portraits/rivals/PROMPT.md)
     3) mate: 동료 그림(portraits/mates/<id>) · face: 이미 있는 후원자 그림(portraits/sponsors/…)
     4) 역할(role)·양식(st)으로 그린 얼굴 (그림이 없어도 대화는 된다)
   ■ 필드: name 대화창 이름 · full 본명 · title 직함 · st 초상 양식(ne 북유럽·잉글랜드, ib 이베리아, it 이탈리아, is 이슬람·오스만) · role · born · look(그림 주문용 생김새) */
(function (G) {
  'use strict';
  var F = G.HIST_FIG = {
    // ── 칼레 해전 (1588) — 잉글랜드·네덜란드
    howard: { name: '찰스 하워드 (에핑엄 남작)', full: 'Charles Howard, 2nd Baron Howard of Effingham', title: '잉글랜드 해군 총사령관', st: 'ne', role: 'noble', born: 1536, look: '50대 초, 단정한 회색 수염, 검은 벨벳 옷에 흰 러프와 가터 훈장 목걸이, 지휘봉' },
    drake: { name: '프랜시스 드레이크', title: '잉글랜드 해군 부사령관', st: 'ne', role: 'captain', mate: 'drake', born: 1540, look: '40대 후반, 붉은 기 도는 짧은 수염, 가죽 조끼와 칼' },
    hawkins: { name: '존 호킨스', title: '잉글랜드 해군 재무관 · 빅토리호 함장', st: 'ne', role: 'captain', born: 1532, look: '50대 중반, 마른 얼굴과 회색 수염, 짙은 녹색 선장 외투, 장부와 칼' },
    winter: { name: '윌리엄 윈터', title: '잉글랜드 해군 감독관 · 화선을 제안한 노장', st: 'ne', role: 'captain', born: 1525, look: '60대, 흰 수염, 낡은 흉갑 위 선장 외투, 노련하고 무뚝뚝함' },
    nassau: { name: '유스티누스 반 나사우', title: '젤란트 제독 · 플랑드르 해안 봉쇄', st: 'ne', role: 'captain', born: 1559, look: '20대 후반, 짧은 갈색 수염, 오라녜 가문의 주황 띠와 네덜란드식 흉갑' },
    // ── 칼레 해전 (1588) — 에스파냐 무적함대
    medina: { name: '메디나 시도니아 공작', full: '알론소 데 구스만 이 소토마요르', portraitName: '알론소 데 구즈만 이 소토마요르', title: '무적함대 총사령관', st: 'ib', role: 'noble', born: 1550, look: '30대 후반, 창백하고 근심 어린 얼굴, 짧은 검은 수염, 검은 비단 옷에 황금 양털 훈장, 뱃멀미를 참는 귀족' },
    recalde: { name: '후안 마르티네스 데 레칼데', title: '무적함대 부사령관 · 산 후안호', st: 'ib', role: 'captain', born: 1540, look: '40대 후반, 바스크 노장, 짙은 수염과 흉터, 낡은 흉갑' },
    oquendo: { name: '미겔 데 오켄도', title: '기푸스코아 함대 사령관 · 산타 아나호', st: 'ib', role: 'captain', born: 1524, look: '60대, 흰 수염, 바스크 베레모와 흉갑, 성마른 눈빛' },
    medrano: { name: '디에고 페르난데스 데 메드라노', title: '무적함대 갤리선대 사령관', st: 'ib', role: 'captain', born: 1540, look: '40대, 검은 수염, 갤리선 장교의 붉은 외투' },
    valdes: { name: '페드로 데 발데스', title: '안달루시아 함대 사령관 · 로사리오호', st: 'ib', role: 'captain', born: 1544, look: '40대, 날카로운 콧수염, 검은 귀족 옷과 칼, 오만함' },
    parma: { name: '파르마 공작 알레산드로 파르네세', portraitName: '알레산드로 파르네세', title: '네덜란드 총독 · 플랑드르 원정군 사령관', st: 'it', role: 'noble', born: 1545, look: '40대, 짧은 수염, 반짝이는 장식 갑옷과 지휘봉, 냉정한 명장' },
    // ── 레판토 해전 (1571) — 신성 동맹
    donjuan: { name: '돈 후안 데 아우스트리아', title: '신성 동맹 함대 총사령관 · 레알호', st: 'ib', role: 'noble', born: 1547, look: '20대 중반, 금빛 머리와 가는 콧수염, 화려한 장식 갑옷, 십자가 깃발' },
    colonna: { name: '마르칸토니오 콜론나', title: '교황 함대 사령관', st: 'it', role: 'noble', born: 1535, look: '30대 후반, 검은 수염, 교황청 붉은 외투 아래 흉갑' },
    venier: { name: '세바스티아노 베니에르', title: '베네치아 함대 사령관', st: 'it', role: 'noble', born: 1496, look: '70대, 길고 흰 수염, 베네치아 귀족 붉은 겉옷 위에 흉갑, 석궁을 든 고집 센 노인' },
    gadoria: { name: '조반니 안드레아 도리아', title: '신성 동맹 오른쪽 날개 · 제노바', st: 'it', role: 'captain', born: 1539, look: '30대, 짧은 수염, 제노바식 검은 갑옷, 계산적인 눈빛' },
    barbarigo: { name: '아고스티노 바르바리고', title: '신성 동맹 왼쪽 날개 · 베네치아', st: 'it', role: 'captain', born: 1516, look: '50대, 회색 수염, 베네치아 장교 갑옷, 투구를 벗고 지휘하는 용장' },
    bazan: { name: '알바로 데 바산 이 구스만', portraitName: '알바로 데 바산 이 구즈만', title: '산타 크루스 후작 · 예비 함대', st: 'ib', role: 'captain', born: 1526, look: '40대 중반, 뾰족한 수염, 에스파냐 장교 흉갑과 붉은 띠' },
    // ── 레판토 해전 (1571) — 오스만 제국
    alipasha: { name: '뮈에진자데 알리 파샤', title: '오스만 대제독 (카푸단 파샤) · 술타나호', st: 'is', role: 'noble', born: 1520, look: '50대, 검은 수염, 큰 흰 터번과 비단 카프탄, 활과 언월도' },
    uluch: { name: '울루츠 알리 레이스', title: '알제의 베이레르베이 · 오스만 왼쪽 날개', st: 'is', role: 'captain', born: 1519, look: '50대, 칼라브리아 출신 개종자, 거친 붉은 수염, 해적 두목의 터번과 가죽 조끼' },
    suluk: { name: '슐루크 메흐메트 파샤', title: '알렉산드리아의 베이 · 오스만 오른쪽 날개', st: 'is', role: 'captain', born: 1525, look: '40대, 수척한 얼굴, 녹색 터번과 오스만 장교 갑옷' },
    turgut: { name: '투르구트 레이스', title: '바르바로사의 오른팔 · 트리폴리의 베이', st: 'is', role: 'captain', mate: 'h_turgut', born: 1485, look: '50대(1544) · 짙은 수염, 해적 선장 터번, 사슬 자국이 남은 손목' },
    pertev: { name: '페르테브 파샤', title: '오스만 육군 사령관', st: 'is', role: 'noble', born: 1520, look: '50대, 흰 수염, 고관의 높은 터번과 모피 카프탄' },
    karahoca: { name: '카라 호자', title: '발로나의 해적 선장', st: 'is', role: 'captain', born: 1530, look: '40대, 검게 그을린 얼굴, 검은 터번, 칼을 문 듯 거친 인상' },
    hasan: { name: '하산 레이스', title: '하이레딘 바르바로사의 아들 · 알제', st: 'is', role: 'captain', born: 1517, look: '50대, 붉은 기 도는 수염(아버지를 닮음), 알제 해적 선장의 흰 터번' },
    mehmedbey: { name: '메흐메트 베이', title: '오스만 갤리선 선장', st: 'is', role: 'captain', born: 1535, look: '30대, 짧은 수염, 붉은 터번과 쇠사슬 갑옷' },
    // ── 하이레딘 바르바로사의 습격 (1543~1544)
    hayreddin: { name: '하이레딘 파샤 (바르바로사)', portraitName: '하이레딘 바르바로사', title: '오스만 대제독 · 「붉은 수염」', st: 'is', role: 'noble', mate: 'barbarossa', born: 1478, look: '60대 중반, 붉었던 수염이 희끗희끗, 대제독의 흰 터번과 모피 카프탄' },
    oruc: { name: '오루츠 레이스', title: '하이레딘의 형 · 알제의 해적왕 「바바 오루츠」', st: 'is', role: 'captain', born: 1474, look: '40대(1518), 붉은 수염, 한쪽 팔에 은 의수, 해적 선장 터번' },
    sokollu: { name: '소콜루 메메드', portraitName: '소콜루 메흐메드 파샤', title: '바르바로사 휘하의 젊은 장교 (뒷날 대재상)', st: 'is', role: 'official', born: 1506, look: '30대 후반, 보스니아 출신, 긴 얼굴과 짙은 수염, 단정한 궁정 터번' },
    sinan: { name: '시난 파샤', title: '바르바로사의 부장 (「유대인 시난」)', st: 'is', role: 'captain', born: 1480, look: '60대, 흰 수염, 해적 선장의 터번과 망원 없이 해도를 든 손' },
    piyale: { name: '피얄레 파샤', portraitName: '퓌알레 파샤', title: '바르바로사 함대의 젊은 선장 (뒷날 대제독)', st: 'is', role: 'captain', born: 1515, look: '20대 후반, 크로아티아 출신, 가는 수염, 오스만 장교 차림' },
    mimar: { name: '미마르 시난', title: '술탄의 궁정 건축가', st: 'is', role: 'scholar', mate: 'h_sinan', born: 1490, look: '50대, 흰 수염, 건축가의 펠트 모자와 컴퍼스·설계도' },
    charles: { name: '카를 5세', title: '신성 로마 황제 · 에스파냐 국왕', st: 'ib', role: 'king', face: 'portraits/sponsors/de_emperor_3', born: 1500, look: '40대, 합스부르크 턱과 짧은 수염, 황금 양털 훈장과 검은 옷' },
    adoria: { name: '안드레아 도리아', title: '제노바의 제독 · 황제의 함대 사령관', st: 'it', role: 'noble', face: 'portraits/sponsors/it_doria', born: 1466, look: '70대 후반, 길고 흰 수염, 검은 옷에 황금 양털 훈장, 꼿꼿함' }
  };
  Object.keys(F).forEach(function (id) { F[id].id = id; });

  var H = G.Hist = {};
  /** 그 사람의 얼굴 그림 이름들 (있는 것부터) */
  H.faceKeys = function (id) {
    var f = F[id]; if (!f) return [];
    var short = f.name.replace(/\s*\(.*\)\s*$/, '');
    var out = ['portraits/history/' + id];
    if (f.portraitName) out.push('portraits/rivals/' + f.portraitName);
    out.push('portraits/rivals/' + f.name, 'portraits/rivals/' + short);
    if (f.mate) out.push('portraits/mates/' + f.mate);
    if (f.face) out.push(f.face);
    return out;
  };
  /** 대화에 세울 사람 {name, portrait, half, lang: 3} — 이 사건들의 말은 늘 알아듣게 (통역이 옮겨 준 셈) */
  H.speaker = function (id) {
    var f = F[id]; if (!f) return { name: id, lang: 3 };
    var keys = H.faceKeys(id), sp = { name: f.name, lang: 3, rigId: 'hist:' + id };
    try {
      var A = G.Art, spec = A.npcSpec('hist_' + id, f.role || 'captain', f.st || 'ib', f.g || 'm'), base = A.portraitKeys ? A.portraitKeys(spec) || [] : [];
      sp.portrait = A.withImg(spec, keys.concat(base));
      sp.half = keys.map(function (k) { return k + '_half'; }).concat(G.Img && G.Img.chain && G.Img.chain.halfOf ? G.Img.chain.halfOf(base) : []);
    } catch (e) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  };
  /** 그림이 실제로 있는가 (시험·도감) */
  H.hasFace = function (id) { return !!(G.Img && G.Img.has && H.faceKeys(id).some(function (k) { return G.Img.has(k); })); };
  /** 대사 묶음을 차례로: [[인물 id 또는 null(내레이션), 말], …] */
  H.play = async function (lines) {
    for (var i = 0; i < (lines || []).length; i++) {
      var l = lines[i]; if (!l) continue;
      await G.UI.say(l[1], l[0] ? H.speaker(l[0]) : {});
    }
  };
})(window.G = window.G || {});
