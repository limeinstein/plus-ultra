/* 직업별 말투와 잠재 특성. 처음 실제 효과가 생길 때 정체를 알린다.
   한도·발현 기록은 항해 전체(state.career)에 남겨 승계·저장 불러오기로 중복 수령하지 않는다.
   효과를 미리 보는 함수는 상태를 바꾸지 않으며, 지급·소모는 실제 행동에서만 한다. */
(function (G) {
  'use strict';
  var C = G.Career = {}, U = G.U;
  var DATA = {
    explorer: { name: '지평선의 위안', hint: '낯선 지형과 자연을 직접 마주해 보자.', line: '해도에 없던 풍경이군. 이곳을 기억하면 다음 길도 찾을 수 있겠어.',
      tavern: '지도 밖의 바다를 묻는 눈빛이군. 낯선 해안 이야기를 모아 두었네.', library: '항로와 지형 기록은 저쪽입니다. 빈 해도를 채우러 오셨군요.' },
    digger: { name: '층위의 눈', hint: '옛 유적이나 보물을 직접 찾아 기록해 보자.', line: '흙의 층과 작은 흔적까지 남겨라. 보물보다 오래갈 것은 이 기록이다.',
      tavern: '오래된 돌조각에도 사연이 있다지? 무너진 신전 소문을 들어 보겠나.', library: '발굴자라면 왕조 연대기와 옛 지명을 함께 살피십시오.' },
    hunter: { name: '빈틈없는 해체', hint: '짐승을 사냥하고 전리품을 실어 보자.', line: '가죽이 상하지 않게 결을 따라 벗겨라. 버릴 몫도 살릴 수 있다.',
      tavern: '발자국을 읽는 분이군. 숲에 들어갈 땐 돌아올 길도 살펴 두게.', guild: '짐승의 수보다 지형과 바람을 먼저 보게. 살아 돌아오는 것이 솜씨지.' },
    conq: { name: '열세의 돌격', hint: '기함으로 더 많은 선원을 가진 적에게 접현해 보자.', line: '수가 적어도 물러서지 마라. 좁은 갑판에서는 먼저 자리를 잡는 쪽이 이긴다!',
      tavern: '칼을 찬 손에 망설임이 없군. 그래도 승리 뒤에 남을 사람들을 잊지 말게.', guild: '적이 많을수록 갑판의 좁은 길을 쓰게. 무작정 달려들지만은 말고.' },
    miss: { name: '한마음의 기도', hint: '지친 선원들과 함께 예배처에서 기도해 보자.', line: '믿는 이름은 달라도 무사히 돌아가고 싶은 마음은 같지. 함께 쉬어 가세.',
      tavern: '먼 땅의 믿음도 귀 기울여 듣는 분이군. 선원들의 고민도 들어 주게.', church: '먼 길의 전도사여, 이곳의 기도에도 귀를 기울여 주시오. 선원들도 함께 쉬게 하시오.' },
    merchant: { name: '거래처의 사례', hint: '타지에서 들여온 물건으로 이익을 남겨 보자.', line: '산 값과 운반한 수고를 장부에 남겨라. 신뢰가 쌓이면 거래처도 사례하는 법이지.',
      tavern: '잔 값까지 셈하는 눈이로군! 시세만큼 항로의 비용도 잘 따져 보게.', trade: '상인 제독이군. 같은 항구에서 되팔기보다 다른 산지의 물건으로 이익을 내 보게.' },
    soldier: { name: '질서 있는 일제사격', hint: '규율을 지킨 함대의 기함에서 포격해 보자.', line: '각 포대는 명령을 기다려라. 같은 순간에 조준하고, 한 번에 쏜다!',
      tavern: '군에서 익힌 몸가짐이군. 훈련도 중요하지만 선원들 쉴 시간도 주게.', guild: '좋은 대포도 규율이 무너지면 소용없지. 포대 사이의 호흡부터 맞추게.' }
  };
  var HONOR = {
    explorer: '빈 해도에 선 하나를 더 그었을 뿐이다. 다음 수평선도 우리 눈으로 확인하자.',
    digger: '우리 이름보다 발견의 기록이 오래 남도록, 작은 흔적 하나도 빠뜨리지 말자.',
    hunter: '살아 돌아와 기록을 나눌 수 있어 다행이다. 다음 사냥에서도 욕심은 버리자.',
    conq: '오늘의 영예는 함께 버틴 이들의 것이다. 다음 승리에는 더 적은 희생이 따르기를.',
    miss: '우리가 받은 신뢰만큼, 다음 항구에서는 누군가의 고단함을 덜어 주자.',
    merchant: '사례금은 장부에 적어 두게. 오래 지켜야 할 재산은 거래처의 믿음이다.',
    soldier: '맡은 일을 지킨 이들에게 이 영예를 돌린다. 내일도 선원들을 무사히 이끌겠다.'
  };
  function S() { return G.Game && G.Game.state; }
  function K(id) { return G.BALANCE.career[id]; }
  function is(id) { var s = S(); return !!(s && s.player.job === id); }
  function record() { var s = S(); return s.career || (s.career = { revealed: {}, days: {} }); }
  function budget(id, amount) {
    var st = record(), days = st.days || (st.days = {}), d = days[id];
    if (!d || d.day !== S().day) d = days[id] = { day: S().day, used: 0 };
    var n = Math.max(0, Math.min(amount, K(id).daily - d.used)); d.used += n; return n;
  }
  function reveal(id) {
    var st = record(), seen = st.revealed || (st.revealed = {});
    if (seen[id]) return;
    seen[id] = { d: U.dateNum(S().date) };
    G.State.log('직업 특성 「' + DATA[id].name + '」 발현 — ' + DATA[id].line);
    G.UI.toast('직업 특성 발현 · ' + DATA[id].name + '\n“' + DATA[id].line + '”', 'star', 6500);
  }
  function notice(id, text) { reveal(id); G.UI.toast(DATA[id].name + ' — ' + text, 'star', 3800); }
  C.description = function (id) {
    var k = K(id); if (!k) return '';
    if (id === 'explorer') return '지리·자연을 새로 발견하면 피로 ' + k.fatigue + ' 회복. 하루 최대 ' + k.daily + '.';
    if (id === 'digger') return '유적·보물의 첫 발견 명성 +' + Math.round(k.rate * 100) + '%. 발견당 최대 ' + k.perFind + ', 하루 최대 ' + k.daily + '. 보고 보상에는 미적용.';
    if (id === 'hunter') return '사냥 후 실제로 싣는 전리품 +' + Math.round(k.rate * 100) + '%(버림). 하루 최대 ' + k.daily + '통. 짐칸 한도 적용.';
    if (id === 'conq') return '기함의 접현 시작 시 아군 선원이 적보다 적으면 해당 백병전 공격력 +' + Math.round(k.boarding * 100) + '%. 특기 조합과는 큰 쪽만 적용.';
    if (id === 'miss') return '함께 기도하면 추가 규율 +' + k.discipline + ', 피로 -' + k.fatigue + '. 하루 ' + k.daily + '회.';
    if (id === 'merchant') return '타지 매입분만 팔아 이익을 낸 거래에 순이익 ' + Math.round(k.rate * 100) + '%의 사례금(버림). 하루 최대 ' + k.daily + '닢. 산 곳 없는 전리품·노예 거래 제외.';
    return '규율 ' + k.discipline + ' 이상일 때 기함의 포격 명중률 +' + Math.round(k.accuracy * 100) + '%p. 특기 조합과 큰 쪽만 적용하며 최종 상한 95% 유지.';
  };
  C.hint = function (id) { return DATA[id] ? DATA[id].hint : ''; };
  C.line = function (kind) { var id = S().player.job, d = DATA[id]; return kind === 'honor' ? HONOR[id] || '다음 항해에서도 이 이름에 부끄럽지 않도록 하자.' : d ? d.line : ''; };
  C.html = function () {
    var s = S(), id = s.player.job, d = DATA[id]; if (!d) return '';
    var seen = s.career && s.career.revealed && s.career.revealed[id];
    return '<div class="card career-trait" style="margin:12px 0"><b>직업 잠재 특성 · ' + (seen ? d.name : '아직 드러나지 않음') + '</b><div>' +
      U.esc(seen ? C.description(id) : d.hint) + '</div><div class="muted">' + U.esc('“' + d.line + '”') + '</div></div>';
  };
  C.hail = function (kind) { var s = S(), d = s && DATA[s.player.job]; return d && d[kind] || ''; };
  // 발견의 중복 여부는 D.find에서 먼저 검사한다. 보고·견적·카드 미리보기는 이곳을 부르지 않는다.
  C.discoveryFame = function (d, fame) {
    if (!is('digger') || !d || (d.cat !== 'ruin' && d.cat !== 'treasure')) return 0;
    var n = budget('digger', Math.min(K('digger').perFind, Math.floor(fame * K('digger').rate)));
    if (n) notice('digger', '발견 명성 +' + n); return n;
  };
  C.afterDiscovery = function (d) {
    if (!is('explorer') || !d || (d.cat !== 'geo' && d.cat !== 'nature')) return 0;
    var n = budget('explorer', Math.min(K('explorer').fatigue, S().fleet.fatigue));
    if (n) { S().fleet.fatigue -= n; notice('explorer', '피로 -' + n); } return n;
  };
  // 같은 도시 매입분이 섞이거나 산 곳을 모르는 물건은 사례 대상에서 뺀다.
  C.tradeBonus = function (profit, imported) {
    if (!is('merchant') || !imported || profit <= 0) return 0;
    var n = budget('merchant', Math.floor(profit * K('merchant').rate));
    if (n) { S().player.gold += n; notice('merchant', '별도 사례금 ' + n + '닢'); } return n;
  };
  C.huntBonus = function (q, room) {
    if (!is('hunter')) return 0;
    var n = budget('hunter', Math.min(Math.max(0, room - q), Math.floor(q * K('hunter').rate)));
    if (n) notice('hunter', '사냥 전리품 +' + n + '통'); return n;
  };
  C.pray = function () {
    if (!is('miss')) return false;
    var f = S().fleet, k = K('miss'); if (f.discipline >= 100 && f.fatigue <= 0) return false;
    if (!budget('miss', 1)) return false;
    var dis = Math.min(k.discipline, 100 - f.discipline), fat = Math.min(k.fatigue, f.fatigue);
    f.discipline += dis; f.fatigue -= fat; notice('miss', '규율 +' + dis + ' · 피로 -' + fat); return true;
  };
  C.boardingK = function (flagship, own, enemy) {
    if (!is('conq') || !flagship || own <= 0 || own >= enemy) return 1;
    var combo = G.SkillCombos ? G.SkillCombos.factor('boardingPower') : 1;
    var k = Math.max(1, (1 + K('conq').boarding) / combo);
    if (k > 1) reveal('conq'); return k;
  };
  C.accuracy = function (flagship, base) {
    if (!is('soldier') || !flagship || S().fleet.discipline < K('soldier').discipline) return 0;
    var combo = G.SkillCombos ? G.SkillCombos.bonus('cannonAccuracy') : 0;
    var n = Math.max(0, K('soldier').accuracy - (base || 0) * combo);
    if (n) reveal('soldier'); return n;
  };
})(window.G = window.G || {});
