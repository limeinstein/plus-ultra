/* 레오나르도 다 빈치 (G.Leo) — 밀라노의 만능 천재. 2026-10-17
   ■ 밀라노 왕궁의 주인(루도비코 일 모로 등)을 먼저 만나야 레오나르도의 저택에 들 수 있다. 술집에는 나오지 않는다.
   ■ 레오나르도의 저택에서 계약을 하나 해내고 보고하면, 그 이야기로 밤을 새운 레오나르도가 항해에 마음이 끌려 배에 태워 달라고 한다.
     · 태우면: 동료가 되고(저택은 빈다), 제독의 생일마다 자기 발명품 하나를 선물한다.
     · 태우지 않으면: 저택에 남아 있다가 신뢰가 100이 되면 발명품을 보내고, 그 뒤로 두 해마다 하나씩 보낸다. 저택에서 다시 청해 태울 수도 있다.
   ■ 발명품: 소지품의 보물(값이 있다). 표는 아래 INVENTIONS.
   ■ 저장: state.leo = {talked, joined, declined, given: [발명품 id], next: 다음 선물 날(day), bday: 마지막 생일 선물 해, pend: [발명품 id]} */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var LE = G.Leo = {};
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); if (!s) return null; var l = s.leo || (s.leo = {}); if (!l.given) l.given = []; if (!l.pend) l.pend = []; return l; }
  var SPID = 'it_leonardo', MORO = 'it_moro';
  var INVENTIONS = [
    ['leo_ornithopter', '날개 치는 비행 기계 모형', 6000, '박쥐 날개를 본뜬 두 날개를 사람의 팔다리로 위아래로 치게 만든 비행 기계의 작은 모형. 「언젠가 사람은 새처럼 날 것」이라는 글이 거울 글씨로 적혀 있다.'],
    ['leo_parachute', '피라미드 낙하산', 4500, '아마포를 씌운 나무 피라미드. 「이것을 쓰면 아무리 높은 곳에서 뛰어내려도 다치지 않는다」고 적혀 있다.'],
    ['leo_diving', '잠수 호흡 장치', 5500, '돼지가죽 두건과 유리 눈구멍, 갈대를 엮은 숨관. 적의 배 밑에 몰래 다가가려고 고안했다고 한다.'],
    ['leo_odometer', '거리를 재는 수레', 4000, '바퀴가 한 바퀴 돌 때마다 작은 돌이 상자에 떨어져 걸어온 거리를 센다. 측량사들이 탐낸다.'],
    ['leo_anemometer', '바람 세기를 재는 판', 3500, '바람에 밀려 눈금을 따라 올라가는 판. 항해사가 바람의 힘을 숫자로 적을 수 있다.'],
    ['leo_hygrometer', '습기 저울', 3000, '한쪽에는 솜, 한쪽에는 밀랍을 단 저울. 솜이 무거워지면 비가 온다는 뜻이다.'],
    ['leo_screw', '하늘로 오르는 나사', 6500, '풀 먹인 아마포를 나선으로 감은 나사 모양 날개. 「빨리 돌리면 공기를 파고 올라간다」고 적혀 있다.'],
    ['leo_tank', '거북 전차 모형', 6000, '거북 등딱지 같은 나무 덮개 둘레에 대포를 빙 둘러 단 싸움 수레의 모형. 안에서 여덟 사람이 바퀴를 돌린다.'],
    ['leo_organ', '서른세 개의 총열', 5000, '총열 열한 개씩 세 줄을 돌려 가며 쏘는 대포의 설계도와 모형. 한 줄을 쏘는 동안 다른 줄을 식히고 다시 채운다.'],
    ['leo_spit', '저절로 도는 고기 꼬챙이', 2500, '불의 뜨거운 기운이 굴뚝 속 바람개비를 돌려 꼬챙이를 돌린다. 요리사들이 좋아한다.'],
    ['leo_waterwalk', '물 위를 걷는 신발', 3000, '공기를 채운 가죽 주머니를 단 신발과 균형 막대. 정말로 물 위를 걸을 수 있는지는 레오나르도도 웃으며 말을 아낀다.'],
    ['leo_notebook', '거울 글씨 공책', 7000, '물의 흐름, 사람 몸의 뼈와 힘줄, 새의 날개짓, 배의 설계까지 거울 글씨로 빼곡히 적은 공책 한 권. 이 세상에 하나뿐이다.']
  ];
  LE.INVENTIONS = INVENTIONS;
  if (G.ITEMS && G.ITEM) INVENTIONS.forEach(function (x) {
    if (G.ITEM[x[0]]) return;
    var d = { id: x[0], name: x[1], kind: 'treasure', price: x[2], rare: true, reg: [], invention: true, desc: x[3] + ' — 레오나르도 다 빈치의 발명품' };
    G.ITEMS.push(d); G.ITEM[d.id] = d;
  });

  function sp() { return G.SPONSOR[SPID]; }
  function aboard() { var s = S(); return !!(s && s.mates && s.mates.some(function (m) { return m.id === 'leonardo'; })); }
  LE.aboard = aboard;
  /** 밀라노 왕궁의 주인을 만났는가 */
  LE.metMoro = function () { var s = S(), r = s && s.sponsors && s.sponsors[MORO]; return !!(r && r.met); };
  function leoSpeaker() { return aboard() ? { name: '레오나르도 다 빈치', portrait: G.Scenes.mateSpec('leonardo'), half: G.Img.chain.mateHalf('leonardo'), lang: 3 } : G.Sponsor.speaker(sp()); }

  // ================================================================ 만나는 조건 · 저택이 비는 때
  function hook() {
    var SP = G.Sponsor; if (!SP || SP._leo) return; SP._leo = true;
    var aud = SP.audience;
    SP.audience = async function (x) {
      if (x && x.id === SPID && !LE.metMoro()) {
        await UI.say('스승님께서는 밀라노 공작 전하의 손님만 맞으십니다. 먼저 왕궁에 들어가 공작 전하께 인사를 올리고 오십시오.', SP.butler ? SP.butler(x) : {});
        UI.toast('밀라노 왕궁의 주인을 먼저 만나야 레오나르도를 만날 수 있다.', 'crown', 4500);
        return false;
      }
      return aud.apply(this, arguments);
    };
    var present = SP.present;
    SP.present = function (x) { if (x && x.id === SPID && aboard()) return false; return present.apply(this, arguments); };
    // 계약을 마치고 보고하면 — 밤샘 이야기
    ['report', 'lateReport'].forEach(function (k) {
      var f = SP[k]; if (!f) return;
      SP[k] = async function (x) { var r0 = x && x.id === SPID ? (SP.rel(SPID).done || 0) : null; var res = await f.apply(this, arguments); if (r0 != null && (SP.rel(SPID).done || 0) > r0) await LE.nightTalk(); return res; };
    });
    if (G.Errand && G.Errand.report) {
      var er = G.Errand.report;
      G.Errand.report = async function (x) { var r0 = x && x.id === SPID ? (SP.rel(SPID).done || 0) : null; var res = await er.apply(this, arguments); if (r0 != null && (SP.rel(SPID).done || 0) > r0) await LE.nightTalk(); return res; };
    }
    // 술집에는 나오지 않는다 — 저택의 이야기로만 동료가 된다
    var MM = G.MateMove;
    if (MM && MM.here) { var here = MM.here; MM.here = function () { return here.apply(this, arguments).filter(function (m) { return m.id !== 'leonardo'; }); }; }
    // 저택 메뉴: 다시 청한다
    var CT = G.Court;
    if (CT && CT.palaceItems) {
      var pi = CT.palaceItems;
      CT.palaceItems = function (x) {
        var out = pi.apply(this, arguments) || [], l = st();
        if (x && x.id === SPID && l && l.talked && !l.joined && !aboard()) out = out.concat([{ label: '함께 항해하자고 청한다', icon: 'ship', sub: '레오나르도가 배에 오른다', onClick: function () { return LE.invite(true); } }]);
        return out;
      };
    }
  }
  LE.hook = hook;

  // ================================================================ 밤샘 이야기 → 배에 태워 달라
  LE.nightTalk = async function () {
    var l = st(), s = S(); if (!l || l.talked) return;
    l.talked = U.dateNum(s.date);
    var who = G.Sponsor.speaker(sp()), p = s.player;
    await UI.say('그날 밤, 레오나르도는 제독을 공방에 붙잡아 두었다. 촛불 아래 펼쳐진 공책 위로 물살과 바람, 새의 날개와 배의 용골 이야기가 끝없이 이어졌다. 창밖이 희뿌옇게 밝아 올 때까지.', {});
    await UI.say(p.name + ' 제독, 당신이 해 준 바다 이야기가 머릿속에서 떠나지 않습니다. 물이 어떻게 소용돌이치고, 돛이 어떻게 바람을 무는지 — 책으로는 결코 알 수 없는 것들이지요.\f…부탁이 있습니다. 저를 당신의 배에 태워 주십시오. 이 눈으로 바다를 보고, 이 손으로 그 모든 것을 그리고 싶습니다.', who);
    await LE.invite(false);
  };
  /** 배에 태울지 묻는다 (again: 저택에서 다시 청할 때) */
  LE.invite = async function (again) {
    var l = st(), s = S(), who = G.Sponsor.speaker(sp());
    var v = await UI.ask(again ? '레오나르도에게 함께 항해하자고 청할까?' : '레오나르도를 배에 태울까?', [
      { label: '태운다 — 동료로 맞는다 (급료 ' + ((G.MATE.leonardo && G.MATE.leonardo.wage) || 0) + '닢/달)', value: 'yes' },
      { label: again ? '아직은 아니다' : '정중히 사양한다 — 저택에 머물러 달라', value: 'no' }], who);
    if (v !== 'yes') {
      if (!again) { l.declined = 1; await UI.say('…아쉽군요. 하지만 이해합니다. 저는 여기서 기다리겠습니다. 언젠가 제 발명품이 당신의 항해에 쓸모가 있기를 바랍니다. 우리 우정이 깊어지거든, 제가 만든 것을 보내 드리지요.', who); }
      return false;
    }
    s.mates.push({ id: 'leonardo', role: 'none', loyal: 95 });
    l.joined = U.dateNum(s.date); l.declined = 0;
    await UI.say('고맙습니다! 공책과 붓, 그리고 마음만 챙기면 됩니다. 아, 그리고 — 당신의 생일이 돌아올 때마다 제가 만든 것을 하나씩 드리겠습니다. 항해의 값이라 생각해 주십시오.', { name: '레오나르도 다 빈치', portrait: G.Scenes.mateSpec('leonardo'), half: G.Img.chain.mateHalf('leonardo'), lang: 3 });
    G.State.log('레오나르도 다 빈치가 배에 올랐다.');
    UI.toast('레오나르도 다 빈치가 동료가 되었다! (선실의 화실·참모실에 두면 좋다)', 'people', 6000);
    if (G.Achieve && G.Achieve.afterHire) { try { G.Achieve.afterHire('leonardo'); } catch (e) { /* 없음 */ } }
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };

  // ================================================================ 발명품
  function nextInvention() { var l = st(); for (var i = 0; i < INVENTIONS.length; i++) if (l.given.indexOf(INVENTIONS[i][0]) < 0 && l.pend.indexOf(INVENTIONS[i][0]) < 0) return INVENTIONS[i][0]; return null; }
  function queue(why) { var l = st(), id = nextInvention(); if (!id) return false; l.pend.push(id); l.why = why; return true; }
  /** 하루 (js/systems/world.js): 생일 선물(배에 탔을 때) · 신뢰 100과 두 해마다(저택에 있을 때) */
  LE.daily = function () {
    var s = S(), l = st(); if (!l || !s.player) return [];
    hook();
    var d = s.date, b = s.player.born || {};
    if (aboard()) {
      if (d.m === b.m && d.d === b.d && l.bday !== d.y) { l.bday = d.y; queue('bday'); }
    } else if (G.Sponsor && sp() && G.Sponsor.present(sp())) {
      var tr = (s.sponsors && s.sponsors[SPID] && s.sponsors[SPID].trust) || 0;
      if (!l.next && tr >= 100) { if (queue('trust')) l.next = s.day + 730; }
      else if (l.next && s.day >= l.next) { if (queue('again')) l.next = s.day + 730; else l.next = s.day + 3650; }
    }
    return [];
  };
  LE.pending = function () { var l = S() && S().leo; return !!(l && l.pend && l.pend.length); };
  /** 선물을 건넨다 (바다의 하루 끝 · 도시에 들어설 때) */
  LE.present = async function () {
    var s = S(), l = st(); if (!l || !l.pend.length || LE._busy) return false;
    LE._busy = true;
    try {
      while (l.pend.length) {
        var id = l.pend.shift(), def = G.ITEM[id]; if (!def) continue;
        var on = aboard(), who = on ? leoSpeaker() : { name: '밀라노에서 온 심부름꾼', portrait: G.Art.withImg(G.Art.npcSpec('leocourier', 'sailor', 'it', 'm'), G.Img.chain.npc('sailor')), lang: 3 };
        if (on) await UI.say(U.pick(['제독, 생일을 축하합니다! 지난 한 해 바다에서 본 것을 붙들어 만든 것입니다 — 「' + def.name + '」.', '오늘이 당신이 태어난 날이지요? 약속한 대로입니다. 「' + def.name + '」 — 밤마다 선실에서 깎고 이었습니다.']), who);
        else await UI.say('제독님 앞으로 밀라노의 레오나르도 선생님께서 상자를 보내셨습니다. 편지도 함께요 — 「우리 우정의 증표로, 제가 만든 것 가운데 아끼는 것을 보냅니다. 「' + def.name + '」. 바다에서 쓸모가 있기를. — 레오나르도」', who);
        var kept = R.addItem(id, { value: def.price });
        l.given.push(id);
        if (!kept) { l.home = l.home || []; l.home.push(id); }
        G.State.log('레오나르도 다 빈치에게서 발명품 「' + def.name + '」을 받았다.');
        UI.toast('레오나르도의 발명품 「' + def.name + '」' + (kept ? ' — 소지품에 넣었다 (값 ' + U.num(def.price) + '닢)' : ' — 소지품이 가득해 고향 집에 두었다'), 'gear', 6000);
      }
    } catch (e) { console.error(e); }
    LE._busy = false;
    return true;
  };
  hook();
})(window.G = window.G || {});
