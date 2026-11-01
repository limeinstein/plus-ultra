/* 일본 막부의 대외 통제. 날짜는 게임의 적용 경계이며 포고일을 정밀하게 재현한 것은 아니다. */
(function (G) {
  'use strict';
  var J = G.Sakoku = {}, U = G.U;
  function S() { return G.Game && G.Game.state; }
  function K() { return G.BALANCE.sakoku; }
  function date() { return S() ? U.dateNum(S().date) : 0; }
  function nation(n) { return { PT: '포르투갈', ES: '에스파냐', NL: '네덜란드', CN: '명', JP: '일본', KR: '조선' }[n] || n; }
  function japanese(c) { return !!(c && c.region === 9 && G.R.cityOwner(c) === '일본'); }
  /** 나가사키의 중국·네덜란드 교역은 남는다. 서양 전체가 완전히 단절된 것으로 다루지 않는다. */
  J.entryBlock = function (c, nat) {
    if (!S() || !japanese(c)) return null;
    var t = date(), n = nation(nat || S().player.nation), why = '';
    if (n === '일본') return null;
    if (t >= K().portuguese && n === '포르투갈') why = '1639년 포르투갈선의 내항이 금지되었소. 마카오에서 오던 배도 들일 수 없소.';
    else if (t >= K().dejima && !(c.id === K().nagasaki && ['네덜란드', '네덜란드 동인도 회사', '명', '청', '중국'].indexOf(n) >= 0)) why = '막부의 대외 통제로 외국 상선은 이곳에 들어올 수 없소. 중국선과 네덜란드선의 교역은 나가사키에 한정되오.';
    else if (t >= K().restrict && c.id !== K().nagasaki) why = '막부가 외국 상선의 입항을 제한했소. 나가사키에서 교역을 청하시오.';
    return why ? { reason: 'sakoku', text: why } : null;
  };
  J.tradeBlock = function (c, id, side) {
    var b = J.entryBlock(c); if (b) return '막부의 교역 금지로 거래할 수 없습니다. ' + b.text;
    if (japanese(c) && id === 'silver' && side === 'buy' && date() >= K().silverBan) return '1668년부터 일본 은의 수출이 금지되었습니다. 동광석·도자기·칠기 교역을 알아보십시오.';
    return '';
  };
  J.stock = function (c) { return japanese(c) && date() >= K().dejima ? K().stock : 1; };
  J.routeNation = function () { return date() >= K().dejima ? '네덜란드' : date() >= K().portuguese ? '명' : '포르투갈'; };
  J.routeK = function () { return date() >= K().dejima ? K().routeK : date() >= K().portuguese ? K().transitionK : 1; };
  J.routeGood = function (id) { return id !== 'silver' || date() < K().silverBan; };
  J.daily = function () {
    var s = S(); if (!s) return [];
    var events = [
      [K().restrict, '【일본의 대외 통제】 막부가 일본인의 해외 도항과 귀국을 금하고 외국 상선의 입항을 통제한다. 일본 교역은 나가사키로 향해야 한다.'],
      [K().portuguese, '【포르투갈선 내항 금지】 시마바라의 난 뒤 막부가 포르투갈선을 추방했다. 마카오–나가사키의 남만 교역이 끊겼다. 포르투갈 제독은 인도·동남아시아·중국의 시장에서 새 판로를 찾아야 한다.'],
      [K().dejima, '【데지마 교역】 네덜란드 상관이 나가사키 데지마로 옮겨졌다. 중국선과 네덜란드선은 제한된 교역을 이어 간다. 일본의 대외 교역이 모두 사라진 것은 아니다.'],
      [K().silverBan, '【일본 은 수출 금지】 막부가 은의 수출을 금지했다. 일본 교역의 중심이 동과 도자기·칠기로 옮겨 간다.']
    ], t = date();
    if (!s.sakoku) {
      s.sakoku = { told: {} };
      events.forEach(function (e) { if (e[0] < t) s.sakoku.told[e[0]] = 1; }); // 옛 저장에 지난 소식을 몰아 띄우지 않는다
    }
    var told = s.sakoku.told || (s.sakoku.told = {}), out = [];
    events.forEach(function (e) { if (t >= e[0] && !told[e[0]]) { told[e[0]] = 1; out.push({ icon: 'scroll', history: true, text: e[1] }); G.State.log(e[1]); } });
    return out;
  };
})(window.G = window.G || {});
