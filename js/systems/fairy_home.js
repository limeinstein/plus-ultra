/* 본가의 네 공주 (G.FairyHome) — 2026-11-06 사용자 요청
   옛이야기의 네 아가씨(js/data/fairytales.js — 신데렐라·백설공주·잠자는 숲속의 공주·인어공주)와 모두 혼인하면(업적 「Happily Ever After」),
   본가(자택 — R.seat: 고향 집이나 가족을 모신 총독 관저)에 공주들을 모셔 함께 지낼 수 있다.
     · 공주 출신이라 신분을 따지지 않아, 본부인이 있어도 다투지 않는다 — 부인끼리의 다툼(js/systems/wifefeud.js WF.peace)에서 빠진다.
       숨은 거처(w.lodge)가 아니라 드러내 놓고 함께 사는 것이라 들킬 일도 없다.
     · 공주들의 아이도 본가로 와서 본처의 아이들과 함께 자란다(k.house를 지운다). 가족이 사는 곳이 바뀌면 공주들도 따라 옮긴다.
     · 자택 메뉴 「공주들을 본가로 모신다」(아직이면) · 「공주들과 함께」(함께 살면 — 이야기·함께 쉬기). 거리에 따로 「○○의 집」은 서지 않는다.
     · 네 공주가 모두 본가에서 함께 살면 업적 「Dream Come True」 (js/data/achievements.js — custom 규칙 'fairyhome').
   저장: 둘째 부인 w.dream = true (본가에서 함께 산다) · s.player.fairyAsked = 마지막으로 물은 날 · s.player.fairyNote = 알린 날
   옛 저장에는 없다 (없으면 아직 모시지 않은 것). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var FH = {};
  G.FairyHome = FH;
  function S() { return G.Game && G.Game.state; }
  function P() { return S().player; }
  function W() { return G.Wives; }
  function seat() { return R.seat ? R.seat() : P().home; }
  FH.ids = function () { return G.FAIRY && G.FAIRY.length ? G.FAIRY : ['cinderella', 'snow_white', 'sleeping_beauty', 'little_mermaid']; };
  FH.isPrincess = function (id) { return FH.ids().indexOf(id) >= 0; };
  function wifeOf(id) { return W() ? W().of(id) : null; }
  /** 네 공주와 모두 혼인해 있다 (본처든 둘째 부인부터든) */
  FH.married = function () { var p = P(); return FH.ids().every(function (id) { return p.wife === id || !!wifeOf(id); }); };
  /** 이 공주가 본가에 산다 (본처이거나, 본가로 모신 둘째 부인부터) */
  FH.living = function (id) { var p = P(), w = wifeOf(id); return p.wife === id || !!(w && w.dream); };
  /** 네 공주가 모두 본가에서 함께 산다 */
  FH.together = function () { return FH.married() && FH.ids().every(FH.living); };
  /** 아직 본가로 모시지 않은 공주가 있다 */
  FH.canInvite = function () { return FH.married() && FH.ids().some(function (id) { var w = wifeOf(id); return w && !w.dream; }); };
  /** 본가에서 함께 사는 둘째 부인부터의 공주들 */
  FH.dreamWives = function () { return W() ? W().list().filter(function (w) { return w.dream; }) : []; };
  function speakerOf(id) {
    var p = P();
    if (p.wife === id && G.Family && G.Family.wifeSpeaker) return G.Family.wifeSpeaker();
    var w = wifeOf(id); if (w && W()) return W().speaker(w);
    return G.Tale && G.Tale.speaker ? G.Tale.speaker(id) : { name: (G.MATE[id] || {}).name || '' };
  }
  function nameOf(id) { return (G.MATE[id] || {}).name || id; }

  /** 공주(둘째 부인부터)와 그 아이들을 본가로 옮긴다 */
  function settleHome(w, home) {
    var old = w.city;
    (P().kids || []).forEach(function (k) { if (k.mother === w.id && k.house != null && k.house !== -1 && (k.house === old || k.house === home)) delete k.house; });   // 본가의 아이들과 함께 자란다
    delete w.lodge;   // 숨은 거처가 아니라 드러내 놓고 함께 산다
    w.dream = true; w.city = home; w.deliver = false;
    if (!w.aboard) w.house = true;
  }
  FH.settleHome = settleHome;

  var LINES = {
    cinderella: '이 집 부엌, 제가 맡아도 될까요? 이번엔 누가 시켜서가 아니라 제가 하고 싶어서예요.',
    snow_white: '방이 많아서 좋아요! 일곱 개쯤 있으면 더 좋겠지만요. 후후.',
    sleeping_beauty: '물레만 없으면 돼요. …농담이에요. 이 집에서라면 깜빡 잠들어도 깨워 줄 사람이 많으니까요.',
    little_mermaid: '(창밖으로 바다가 보이는 방을 가리키며 활짝 웃고는, 다른 세 사람의 손을 차례로 꼭 잡는다.)'
  };
  /** 「공주들을 본가로 모신다」 */
  FH.invite = async function (c) {
    var p = P(), Wv = W(), home = seat(), hc = G.CITY_DATA[home];
    var list = FH.ids().map(wifeOf).filter(function (w) { return w && !w.dream; });
    if (!list.length || !FH.married()) return false;
    p.fairyAsked = S().day;
    await UI.say('네 공주가 모두 제독의 아내가 되었다. 동화책이라면 마지막 장은 한 성에서 다 함께 사는 이야기일 것이다.', {});
    var names = list.map(function (w) { return Wv.name(w); }), lastNm = names[names.length - 1];
    var mainTxt = p.wife && !FH.isPrincess(p.wife) ? '본부인(' + U.esc(G.Family.wifeName()) + ')이 있어도 ' : '';
    var ok = await UI.confirm(U.esc(names.join('·')) + U.jx(lastNm, '을/를') + ' 본가(' + U.esc(hc ? hc.name : '고향') + '의 ' + (hc && hc.colony != null ? '총독 관저' : '자택') + ')에 모셔 함께 지낼까요?' +
      '<br><small>공주 출신이라 신분을 따지지 않으니 ' + mainTxt + '서로 다투지 않습니다. 공주들의 아이도 함께 와서 본가에서 자랍니다.</small>', '본가로 모신다', '그만둔다');
    if (!ok) return false;
    list.forEach(function (w) { settleHome(w, home); });
    var pic = G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'achievement-events/dreamcome', title: '네 공주가 함께 사는 집', noStand: true }) : null;
    try {
      if (p.wife && !FH.isPrincess(p.wife) && G.Family.wifeSpeaker) await UI.say(U.pick(['공주님들을 한 지붕 아래 모시다니… 처음엔 어떻게 대해야 할지 몰랐는데, 다들 소탈해서 오히려 제가 편해요.', '집이 북적이니 사람 사는 것 같네요. 아이들도 언니들이 생겼다고 좋아해요.']), G.Family.wifeSpeaker());
      var ids = FH.ids();
      for (var i = 0; i < ids.length; i++) if (LINES[ids[i]]) await UI.say(LINES[ids[i]], speakerOf(ids[i]));
    } finally { if (pic) await pic.stop(); }
    G.State.log(names.join('·') + U.jx(lastNm, '을/를') + ' 본가에 모셨다. 네 공주가 한 지붕 아래 함께 산다.');
    UI.toast('네 공주가 본가에서 함께 지낸다 — 자택 메뉴 「공주들과 함께」', 'crown', 5200);
    if (G.Game.cityHud) G.Game.cityHud();
    if (G.Achieve && G.Achieve.afterEvent) await G.Achieve.afterEvent();   // Dream Come True
    return true;
  };
  /** 자택에 들어설 때: 공주들의 인사 */
  FH.greet = async function () {
    var ids = FH.ids().filter(function (id) { return FH.living(id) && P().wife !== id; }); if (!ids.length) return;
    var id = U.pick(ids);
    var t = {
      cinderella: ['오늘 저녁은 제가 차렸어요. 다들 기다리고 있었어요!', '유리 구두는 장식장에 넣어 뒀어요. 이젠 이 집이 제 무도회장이니까요.'],
      snow_white: ['아이들이 사과 따기 놀이를 하자고 졸라서 정원이 엉망이에요. 그래도 즐거웠어요!', '어서 오세요! 다들 당신 이야기만 하고 있었어요.'],
      sleeping_beauty: ['오셨어요? …저 안 졸았어요. 정말이에요.', '오늘은 다 같이 노래를 불렀어요. 당신도 다음엔 함께해요.'],
      little_mermaid: ['(발소리를 듣고 제일 먼저 달려 나와 당신의 소매를 끌어당긴다.)', '(창가에서 바다를 보다가, 당신을 보고 손을 크게 흔든다.)']
    }[id] || ['어서 오세요!'];
    await UI.say(U.pick(t), speakerOf(id));
  };
  /** 자택 메뉴 「공주들과 함께」: 한 사람을 골라 이야기하고 함께 시간을 보낸다 */
  FH.menu = async function () {
    var Wv = W(), list = FH.dreamWives().filter(function (w) { return !w.aboard; });
    if (!list.length) { UI.toast('지금 본가에 계신 공주가 없습니다. (배에 함께 있다)', 'heart', 3500); return; }
    var i = await UI.choose('공주들과 함께', list.map(function (w, j) { return { label: Wv.name(w), desc: Wv.ordinal(w) + (w.preg && w.preg.told ? ' · 아기를 가졌다' : ''), value: j, icon: 'heart' }; }), { width: 520 });
    if (i == null) return;
    var w = list[i];
    try { await Wv.visit(w, false); } catch (e) { console.error(e); }
    try { await Wv.talk(w); } catch (e) { console.error(e); }
  };

  // ---------------------------------------------------------------- 날마다: 가족이 옮기면 따라간다 · 새로 태어난 아이도 본가에서 · 한 번 알림
  FH.daily = function () {
    var s = S(), p = s && s.player, out = []; if (!p || !W()) return out;
    var home = seat();
    FH.dreamWives().forEach(function (w) {
      if (w.city !== home) w.city = home;
      if (!w.aboard) w.house = true;
      (p.kids || []).forEach(function (k) { if (k.mother === w.id && k.house === home) delete k.house; });
    });
    if (FH.canInvite() && p.fairyNote == null) {
      p.fairyNote = s.day;
      out.push({ icon: 'crown', text: '옛이야기의 네 공주와 모두 혼인했다. 자택에 들르면 공주들을 본가로 모셔 한 지붕 아래 함께 지낼 수 있다.' });
    }
    return out;
  };

  // ---------------------------------------------------------------- 다른 코드에 잇기 (스크립트가 모두 읽힌 뒤)
  function hook() {
    var C = G.Scenes && G.Scenes.city, F = G.Family;
    if (!C || !C.B || !C.B.home || !F || !G.Wives || !G.Wives.hooked || FH.hooked) return;
    FH.hooked = true;
    var HM = C.B.home;
    var oe = HM.enter;
    HM.enter = async function (c) {
      var r = await oe.apply(this, arguments);
      try {
        if (c && c.id === seat()) {
          var p = P(), again = p.fairyAsked == null || S().day - p.fairyAsked >= 30;
          if (FH.canInvite() && again) await FH.invite(c);
          else if (FH.dreamWives().some(function (w) { return !w.aboard; }) && U.chance(0.6)) await FH.greet();
        }
      } catch (e) { console.error(e); }
      return r;
    };
    var om = HM.menu;
    HM.menu = function (c) {
      var items = om.apply(this, arguments);
      try {
        var add = [];
        if (FH.canInvite()) add.push({ label: '공주들을 본가로 모신다', icon: 'crown', sub: '네 공주와 한 지붕 아래', onClick: function () { return FH.invite(c); } });
        var here = FH.dreamWives().filter(function (w) { return !w.aboard; });
        if (here.length) add.push({ label: '공주들과 함께', icon: 'heart', sub: here.map(function (w) { return G.Wives.name(w); }).join('·'), onClick: function () { return FH.menu(); } });
        if (add.length) {
          var at = -1; items.forEach(function (x, i) { if (x && x.icon === 'save') at = i; });
          if (at >= 0) items.splice.apply(items, [at, 0].concat(add)); else items = items.concat(add);
        }
      } catch (e) { console.error(e); }
      return items;
    };
    // 본가에 사는 공주들은 거리에 따로 집을 세우지 않는다 (자택 안에서 만난다)
    var ob = C.buildings;
    C.buildings = function (c) {
      var out = ob.apply(this, arguments);
      return out.filter(function (b) { var w = b.kind === 'house2' ? wifeOf(b.arg) : null; return !(w && w.dream); });
    };
    // 본가의 공주는 숨은 거처로 옮기지 않는다
    var ol = G.Wives.lodgeAsk;
    G.Wives.lodgeAsk = async function (w) {
      if (w && w.dream) { await UI.say('공주님들과 다 함께 사는 이 집이 좋아요. 다른 곳으로 가고 싶지 않아요.', G.Wives.speaker(w)); return; }
      return ol.apply(this, arguments);
    };
    // 날마다 (family.js F.daily — wives.js가 먼저 잇는다)
    var od = F.daily;
    F.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(FH.daily()); } catch (e) { console.error(e); } return out; };
    // 공주 출신이라 신분을 따지지 않는다 — 본가의 공주가 낀 두 사람은 다투지 않는다
    if (G.WifeFeud) G.WifeFeud.peace = function (a, b) { return !!((a && a.w && a.w.dream) || (b && b.w && b.w.dream)); };
    if (G.Achieve) {
      G.Achieve.rules = G.Achieve.rules || {};
      G.Achieve.rules.fairyhome = function () { return FH.ids().map(function (id) { return { label: nameOf(id) + ' — 본가에서 함께', count: FH.living(id) && FH.married() ? 1 : 0, n: 1 }; }); };
    }
  }
  FH.hook = hook;
  hook();
  if (!FH.hooked) document.addEventListener('DOMContentLoaded', hook);
})(window.G = window.G || {});
