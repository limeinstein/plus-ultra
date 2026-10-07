/* 같은 곳을 맴돌며 야영하기 (G.Castaway) — js/scenes/land.js 의 야영(camp)이 끝날 때마다 부른다
   · 야영지: 반지름 radius도 안이면 같은 야영지로 친다. 마지막 야영에서 gapDays일이 넘게 지났거나 멀리 떠나 야영하면 새 야영지.
   · 윌슨: 한 야영지에서 wilsonDays일 안에 wilsonCamps번 야영하면, 지루함을 못 견딘 대원이 가죽 공에 얼굴을 그려
     「윌슨」이라 부른다. 제독도 말을 걸게 된다 — 물건 「윌슨」(쉬기에서 피로가 더 풀린다). 한 번만.
   · 표류기: 한 야영지에서 journalDays일이 넘도록 journalCamps번 넘게 야영하면, 그동안 적어 둔 나날이 한 권이 된다 — 물건 「표류기」
     (육상 탐험 경비가 줄고 사냥·물 긷기가 늘어난다). 한 번만.
   · 저장: s.castaway = {site: {lon, lat, since, last, n, days: [최근 야영한 날]}, wilson: 1, journal: 1}
   조정값: G.BALANCE.castaway */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var CW = G.Castaway = {};
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.castaway) || {}; }
  function st() { var s = S(); return s.castaway || (s.castaway = { site: null }); }
  CW.state = st;

  /** 지금 야영지 (없으면 null) */
  CW.site = function () { return st().site; };

  /** 야영을 한 번 했다: 야영지를 적고, 때가 되면 윌슨·표류기 사건 */
  CW.afterCamp = async function () {
    var s = S(), l = s.loc, T = st(), k = K(), d = s.day;
    if (!l || l.mode !== 'land') return;
    var site = T.site;
    var far = !site || G.Geo.dist(l.lon, l.lat, site.lon, site.lat) > (k.radius || 0.6);
    if (far || d - site.last > (k.gapDays || 30)) site = T.site = { lon: l.lon, lat: l.lat, since: d, last: d, n: 0, days: [] };
    site.n++; site.last = d; site.days.push(d);
    site.days = site.days.filter(function (x) { return d - x < (k.wilsonDays || 30); });
    if (!T.wilson && site.days.length >= (k.wilsonCamps || 10)) await CW.wilson();
    if (!T.journal && d - site.since >= (k.journalDays || 90) && site.n >= (k.journalCamps || 15)) await CW.journal();
  };

  /** 야영지 형편 한 줄 (야영 메뉴의 머리말) */
  CW.note = function () {
    var s = S(), l = s.loc, site = st().site, k = K();
    if (!site || !l || G.Geo.dist(l.lon, l.lat, site.lon, site.lat) > (k.radius || 0.6) || s.day - site.last > (k.gapDays || 30)) return '';
    return '이 근처에서 ' + site.n + '번째 야영 · ' + (s.day - site.since) + '일째 머물고 있다';
  };

  function win(title, icon, itemId, text, res, btn) {
    var src = G.Img && G.Img.itemSrc ? G.Img.itemSrc({ id: itemId }) : null;
    var w = UI.window({ title: title, icon: icon, width: 760, clickAny: true,
      html: '<div class="castaway"><div class="cw-art">' + (src ? '<img src="' + src + '" alt="">' : G.icon(icon)) + '</div>' +
        '<div class="cw-body"><div class="cw-text">' + text + '</div><div class="cw-res">' + res + '</div></div></div>',
      buttons: [{ label: btn, value: 1, cls: 'navy' }] });
    if (G.Audio) G.Audio.sfx('discover');
    return w.result;
  }

  CW.wilson = async function () {
    var s = S(), T = st(), f = s.fleet, sp = G.Scenes.mateSpeaker('first');
    T.wilson = 1;
    var who = (sp && sp.name) || '부관';
    await UI.say('제독... 같은 자리를 몇 번이고 맴도니 대원들이 말수가 줄었습니다. 어젯밤엔 누가 짐 꾸러미에다 대고 혼잣말을 하더군요.', sp);
    var got = !R.itemsFull() && R.addItem('wilson');
    f.fatigue = Math.max(0, f.fatigue - 15);
    f.discipline = Math.min(100, (f.discipline || 60) + 5);
    await win('윌슨', 'people', 'wilson',
      '아침에 보니 모닥불 곁에 낡은 가죽 공 하나가 놓여 있다. 누군가 숯으로 눈 둘, 코 하나, 씩 웃는 입을 그려 놓았다.<br>' +
      '「이 친구 이름은 윌슨입니다.」 대원 하나가 진지하게 말한다. 처음엔 다들 웃었지만, 저녁이 되자 모두 윌슨에게 하루 일을 이야기하고 있다.<br>' +
      '제독도 모르는 사이에 말을 걸고 있었다. 「윌슨, 내일은 어디로 가 볼까?」 대답은 없지만 어쩐지 마음이 놓인다.',
      (got ? '물건 「윌슨」을 얻었다 — 야영에서 쉴 때 피로가 더 풀린다.' : '소지품이 가득해 윌슨은 야영지에 두고 간다.') + ' · 피로 −15 · 규율 +5', '윌슨에게 인사한다');
    G.State.log('야영지에서 가죽 공 「윌슨」이 새 동료가 되었다.');
    if (got) UI.toast('「윌슨」' + '을 얻었다. (' + who + ': 이제 대원이 한 명 늘었군요.)', 'people', 4200);
  };

  CW.journal = async function () {
    var s = S(), T = st(), site = T.site;
    T.journal = 1;
    var days = site ? s.day - site.since : 90;
    var got = !R.itemsFull() && R.addItem('castawaylog', { since: site ? site.since : null, days: days });
    G.Fame.add('ex', 8);
    await win('표류기', 'book', 'castawaylog',
      '같은 바닷가, 같은 숲 언저리에서 ' + days + '일을 보냈다. 날마다 해 뜨고 지는 시각, 물이 나는 바위틈, 덫에 걸린 짐승, 비가 온 날을 빠짐없이 적어 왔다.<br>' +
      '그 기록이 어느새 두툼한 한 권이 되었다. 표지에 「표류기」라고 적어 넣는다. 언젠가 이 고장에 떨어진 누군가가 읽는다면 살아남는 데 쓸모가 있을 것이다.',
      (got ? '물건 「표류기」를 얻었다 — 육상 탐험 경비가 줄고 사냥·물 긷기가 넉넉해진다.' : '소지품이 가득해 표류기는 야영지 돌무덤 아래 묻어 두었다.') + ' · 명성(탐험) +8', '책을 덮는다');
    G.State.log('같은 야영지에서 ' + days + '일을 버티며 「표류기」를 써 냈다.');
  };

  /** 물건의 효과 (js/scenes/land.js) */
  CW.restBonus = function () { return R.hasItem('wilson') ? (K().wilsonRest || 8) : 0; };
  CW.costMult = function () { return R.hasItem('castawaylog') ? 1 - (K().journalCost || 0.15) : 1; };
  CW.findMult = function () { return R.hasItem('castawaylog') ? (K().journalFind || 1.25) : 1; };
})(window.G = window.G || {});
