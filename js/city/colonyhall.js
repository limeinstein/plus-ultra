/* 개척 도시의 건물: 감찰관 저택 · 총독부 (규칙·대사: js/systems/colony.js · js/data/colony.js)
   - 감찰관 저택(inspector): 본국에서 온 감찰관이 도시를 살핀다 — 이야기 · 개척 현황
   - 총독부(govhall): 총독 취임 · 개척 현황 · 가족을 총독 관저로(또는 고향으로) · 총독 관저로 간다
   그림: 바깥은 저택·왕궁 그림을 빌려 쓰고(js/scenes/town.js SUBSTITUTE), 안은 저택·왕궁 실내 (paint) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city, CO = G.Colony;
  function S() { return G.Game.state; }
  function e(c) { return CO.of(c); }

  /** 감찰관 — 본국의 귀족 (도시마다 같은 얼굴) */
  function inspector(c) {
    var A = G.Art, sp = { name: '감찰관 ' + inspectorName(c), lang: 3 };
    try { sp.portrait = A.withImg(A.npcSpec('insp' + c.id, 'noble', 'ib', 'm'), G.Img.chain.npc('butler', c)); sp.rigId = 'npc:insp' + c.id; } catch (err) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  }
  function inspectorName(c) {
    var x = e(c), pt = x && x.nat === 'PT';
    var first = pt ? ['주앙', '페드루', '루이스', '디오구', '안토니우'] : ['후안', '페드로', '루이스', '디에고', '안토니오'];
    var last = pt ? ['드 멜루', '다 시우바', '드 소자', '코우티뉴', '드 카스트루'] : ['데 멘도사', '데 톨레도', '데 아빌라', '데 구스만', '데 벨라스코'];
    var h = Math.abs(U.strHash('insp' + c.id));
    return first[h % first.length] + ' ' + last[(h >> 3) % last.length];
  }
  /** 총독부의 서기관 */
  function clerk(c) { return C.npc('butler', '총독부 서기관'); }

  // ---------------------------------------------------------------- 감찰관 저택
  var IN = { title: '감찰관 저택', icon: 'mansion', paint: 'mansion', exitLabel: '저택을 나온다' };
  C.B.inspector = IN;
  IN.enter = async function (c) { await UI.say(U.pick(['어서 오시오, 제독. 본국에 보낼 보고서를 쓰던 참이었소.', '제독이로군. 도시가 하루가 다르게 자라고 있소.']), inspector(c)); };
  IN.sub = function (c) { return inspector(c).name + ' · 본국 감찰'; };
  IN.menu = function (c) {
    return [
      { label: '이야기', icon: 'people', onClick: function () { var x = e(c); return CO.say(x && x.gov ? G.COLONY_LINES.inspectorGov : G.COLONY_LINES.inspector, inspector(c), { colony: c.name }); } },
      { label: '개척 현황', icon: 'scroll', onClick: function () { return status(c); } }
    ];
  };

  // ---------------------------------------------------------------- 총독부
  var GV = { title: '총독부', icon: 'crown', paint: 'palace', exitLabel: '총독부를 나온다' };
  C.B.govhall = GV;
  GV.enter = async function (c) {
    var x = e(c), s = S();
    if (x && !x.gov) {
      await CO.say(G.COLONY_LINES.govAsk, clerk(c), { colony: c.name });
      var v = await C.ask(clerk(c), '총독의 자리에 오르시겠습니까?', [{ label: c.name + '의 총독이 된다', value: 'yes' }, { label: '나중에', value: 'no' }]);
      if (v === 'yes') { await CO.becomeGov(c); await CO.say(G.COLONY_LINES.govYes, clerk(c), { colony: c.name }); }
      return true;
    }
    await UI.say(U.pick(['총독 각하, 돌아오셨습니까.', '각하, 오늘 올라온 청원은 책상에 두었습니다.']), clerk(c));
    return true;
  };
  GV.sub = function (c) { var x = e(c); return x && x.gov ? '총독 ' + S().player.name : '총독 자리가 비어 있다'; };
  GV.menu = function (c) {
    var x = e(c), s = S(), p = s.player, fam = !!(p.wife || (p.kids && p.kids.length)), here = p.seat === c.id;
    return [
      x && !x.gov ? { label: '총독에 오른다', icon: 'crown', onClick: function () { return CO.becomeGov(c); } } : null,
      { label: '개척 현황', icon: 'scroll', onClick: function () { return status(c); } },
      x && x.gov && fam && !here ? { label: '가족을 총독 관저로 모신다', icon: 'house', onClick: function () { return moveIn(c); } } : null,
      x && x.gov && here ? { label: '총독 관저로 간다', icon: 'house', sub: '가족이 기다린다', onClick: async function () { await C.leave(); setTimeout(function () { C.visit('home'); }, 60); } } : null,
      x && x.gov && here ? { label: '가족을 고향 집으로 보낸다', icon: 'boot', onClick: function () { return moveOut(c); } } : null
    ];
  };
  async function moveIn(c) {
    var p = S().player;
    if (!(await UI.confirm('아내와 아이들을 ' + c.name + '의 총독 관저로 모시겠습니까?<br><small>그때부터 가족은 이 도시에서 제독을 기다립니다 (고향 집은 비워 둡니다).</small>', '모신다', '그만둔다', '총독 관저'))) return;
    await CO.moveFamily(c, true);
    if (p.wife && G.Family && G.Family.wifeSpeaker) await UI.say(U.pick(['바다 냄새가 나는 집이네요. 아이들이 벌써 마당을 뛰어다녀요.', '여기가 당신의 도시군요. 이제 우리도 이 도시 사람이에요.']), G.Family.wifeSpeaker());
  }
  async function moveOut(c) {
    if (!(await UI.confirm('가족을 고향 ' + G.CITY_DATA[S().player.home].name + '의 집으로 보내겠습니까?', '보낸다', '그만둔다', '총독 관저'))) return;
    await CO.moveFamily(c, false);
  }

  // ---------------------------------------------------------------- 개척 현황
  async function status(c) {
    var x = e(c), s = S(); if (!x) return;
    var site = CO.site(x.key) || {}, St = G.COLONY_STAGES, BN = G.COLONY_BUILD_NAMES;
    var rows = St.map(function (st, i) {
      var done = x.stage >= i, list = (i === 1 ? ['harbor', 'trade', 'tavern', 'inn'] : st.builds).map(function (k) { return BN[k] || k; }).join(' · ');
      return '<div class="cs-row' + (done ? ' done' : '') + (x.stage === i ? ' now' : '') + '"><div class="cs-step">' + (done ? '✓' : i) + '</div><div><b>' + st.name + '</b><br><small>' + list + '</small></div></div>';
    }).join('');
    var need = x.need ? '<b>' + G.GOOD[x.need.good].name + ' ' + x.need.qty + '통</b> (실은 것 ' + (s.fleet.cargo[x.need.good] ? s.fleet.cargo[x.need.good].q : 0) + '통) — 항구에서 넘깁니다' : x.stage < 4 ? '다음 청을 헤아리는 중' : '모든 건물이 섰습니다';
    var html = '<div class="colony-status"><div class="cs-head">' + U.esc(site.name || '') + ' · 세운 날 ' + (x.founded ? U.fmtDate({ y: Math.floor(x.founded / 10000), m: Math.floor(x.founded / 100) % 100, d: x.founded % 100 }) : '—') + '</div>' +
      '<div class="cs-steps">' + rows + '</div><div class="cs-need">' + need + '</div>' +
      (x.gov ? '<div class="cs-gov">총독 ' + U.esc(s.player.name) + (s.player.seat === c.id ? ' · 가족이 총독 관저에 산다' : '') + '</div>' : '') + '</div>';
    await UI.window({ title: c.name + ' — 개척 현황', icon: 'flag', width: 720, clickAny: true, html: html, buttons: [{ label: '확인', value: 1, cls: 'navy' }] }).result;
  }
  G.Colony.statusWindow = status;
})(window.G = window.G || {});
