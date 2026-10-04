/* Information screens: admiral, fleet, items, discoveries, hints, contract, sea chart, log, settings. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var I = {};
  G.Info = I;
  function S() { return G.Game.state; }

  // ---------------------------------------------------------------- compact fleet panel (left side in buildings)
  I.fleetPanel = function (opts) {
    opts = opts || {};
    var s = S(), f = s.fleet;
    var el = U.el('div', 'fleetpanel wood brass-frame');
    var h = '<div class="fp-h">' + G.icon('ship') + '함대 현황</div>';
    if (!opts.compact) {
      h += f.ships.map(function (sh, i) {
        return '<div class="fp-ship"><div class="flex"><b>' + (i === 0 ? '★ ' : '') + U.esc(sh.name) + '</b><span class="right cream-muted">' + G.SHIP[sh.type].name + '</span></div>' + UI.bar(sh.hp, sh.maxHp, sh.hp / sh.maxHp < 0.4 ? 'red dark' : 'green dark') + '</div>';
      }).join('') || '<div class="cream-muted">배가 없습니다</div>';
    }
    var days = f.ships.length ? Math.min(R.daysOfFood(), R.daysOfWater()) : 0;
    h += '<div class="fp-kv">' +
      '<div>선원</div><div>' + f.crew + ' <small>(최저 ' + R.crewMin() + ' / 최대 ' + R.crewMax() + ')</small></div>' +
      '<div>식량·물</div><div>' + (f.crew ? days + '일분' : '—') + '</div>' +
      '<div>적재</div><div>' + R.used() + ' / ' + R.fleetCap() + '통</div>' +
      '<div>소지금</div><div>' + U.num(s.player.gold) + '닢</div></div>';
    var ids = Object.keys(f.cargo);
    if (ids.length) h += '<div class="fp-cargo">' + ids.map(function (id) { return '<span>' + G.goodDot(id) + G.GOOD[id].name + ' ' + f.cargo[id].q + '</span>'; }).join('') + '</div>';
    el.innerHTML = h;
    return el;
  };

  // ---------------------------------------------------------------- main info window with tabs
  var TABS = [['admiral', '제독'], ['fleet', '함대'], ['mates', '동료'], ['wander', '철새'], ['items', '소지품'], ['disc', '발견물'], ['hints', '단서'], ['achv', '업적'], ['contract', '계약·의뢰'], ['trade', '교역 수첩'], ['map', '해도'], ['log', '일지'], ['menu', '설정']];
  I.open = function (tab) {
    var win = UI.window({ title: '항해 수첩', icon: 'book', width: 1180, height: 780, html: '' });
    var tabs = U.el('div', 'tabs');
    TABS.forEach(function (t) {
      var b = U.el('div', 'tab' + (t[0] === tab ? ' on' : ''), t[1]);
      b.onclick = function () { U.$$('.tab', tabs).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); show(t[0]); };
      tabs.appendChild(b);
    });
    win.el.insertBefore(tabs, win.content);
    function show(k) { win.content.innerHTML = ''; win.content.scrollTop = 0; (PAGES[k] || PAGES.admiral)(win.content, win); }
    show(tab || 'admiral');
    return win.result;
  };
  var PAGES = {};

  function pips(v, mx) { var h = '<span class="pips">'; for (var i = 1; i <= (mx || 3); i++) h += '<i class="' + (i <= v ? 'on' : '') + '"></i>'; return h + '</span>'; }
  I.pips = pips;

  PAGES.admiral = function (el) {
    var s = S(), p = s.player, job = G.JOBS.filter(function (j) { return j.id === p.job; })[0];
    var z = G.zodiacOf(p.born.m, p.born.d);
    var html = '<div class="grid2" style="grid-template-columns:260px 1fr;gap:26px"><div><div class="pc"></div>' +
      '<div class="center" style="margin-top:10px;font-size:26px;font-weight:800">' + U.esc(p.name) + '</div>' +
      '<div class="center muted">' + R.nationName(p.nation) + ' · ' + (job ? job.name : '') + (p.generation > 1 ? ' · ' + p.generation + '대' : '') + '</div>' +
      '<div class="center" style="margin-top:10px"><span class="tag">' + R.fameTitle(p.fame) + '</span>' + (G.Slave ? G.Slave.html() : '') + '</div>' +
      (G.Court && G.Court.best() ? '<div class="center" style="margin-top:6px">' + G.Court.titlesHtml() + '</div>' : '') + '</div><div>' +
      '<div class="kv" style="grid-template-columns:110px 1fr 110px 1fr">' +
      '<div>나이</div><div>' + R.age() + '세 (' + p.born.m + '월 ' + p.born.d + '일생 · ' + z.name + ')</div><div>명성</div><div>' + U.num(p.fame) + '</div>' +
      '<div>소지금</div><div>' + U.num(p.gold) + '닢</div><div>예금</div><div>' + U.num(p.bank) + '닢</div>' +
      '<div>악명</div><div>' + U.num(p.notoriety) + '</div><div>건강</div><div>' + Math.round(p.hp) + ' / 100</div>' +
      (G.Fame ? '<div>명성 갈래</div><div style="grid-column:span 3">' + G.Fame.html() + '</div>' : '') +
      (G.Court ? '<div>작위</div><div style="grid-column:span 3">' + G.Court.titlesHtml() + (G.Court.perkText() ? '<div class="muted" style="font-size:14px;margin-top:2px">' + G.Court.perkText() + '</div>' : '') + (G.Court.papersHtml() ? '<div style="margin-top:3px">' + G.Court.papersHtml() + '</div>' : '') + '</div>' : '') +
      (G.Hostile ? '<div>적대</div><div style="grid-column:span 3">' + G.Hostile.html() + '</div>' : '') +
      '<div>무기</div><div>' + (p.equip.weapon ? G.ITEM[p.equip.weapon].name + ' (공격 ' + G.ITEM[p.equip.weapon].atk + ')' : '없음') + '</div><div>방어구</div><div>' + (p.equip.armor ? G.ITEM[p.equip.armor].name + ' (방어 ' + G.ITEM[p.equip.armor].def + ')' : '없음') + '</div>' +
      '<div>배우자</div><div>' + (p.wife ? U.esc(G.Family.wifeName()) + (p.preg && p.preg.told ? ' <small class="muted">(아기를 가짐 · ' + Math.max(1, Math.round((p.preg.due - s.day) / 30)) + '달 뒤)</small>' : '') + (G.Wives ? G.Wives.infoWife() : '') : '없음') + '</div><div>자녀</div><div>' + (p.kids.length ? p.kids.map(function (k) { return G.Family.kidName(k) + ' <small class="muted">' + G.Family.kidAge(k) + '세' + (k.sex === 'f' ? ' 딸' : ' 아들') + (k.aboard ? ' · 견습' : '') + (G.Wives ? G.Wives.kidTag(k) : '') + '</small>' + (k.unnamed ? '' : ' ' + G.Family.bondHearts(k)); }).join(', ') : '없음') + '</div></div>' +
      '<div class="sep"></div><div class="grid2">' +
      '<div><h4 style="margin:0 0 8px">능력치</h4>' + G.STATS.map(function (st) { return '<div class="statrow"><span>' + st.name + '</span>' + UI.bar(p.st[st.id], 100, 'gold') + '<b>' + p.st[st.id] + '</b></div>'; }).join('') + '</div>' +
      '<div><h4 style="margin:0 0 8px">특기 <small class="muted">(동료 포함 실효 수준)</small></h4><div class="skillgrid" style="grid-template-columns:1fr 1fr">' +
      G.SKILLS.map(function (sk) { var own = p.sk[sk.id] || 0, eff = R.skill(sk.id); return '<div class="flex" style="font-size:16px;gap:6px" title="' + sk.desc + '"><span style="width:70px">' + sk.name + '</span>' + pips(eff) + (eff > own ? '<small class="muted">동료</small>' : '') + '</div>'; }).join('') + '</div></div></div>' +
      '<div class="sep"></div><h4 style="margin:0 0 8px">언어</h4><div style="display:flex;flex-wrap:wrap;gap:6px 18px;font-size:16px">' +
      G.LANGS.map(function (l, i) { var own = p.lg[i] || 0, eff = R.lang(i); if (!eff) return ''; return '<span>' + l + ' ' + pips(eff) + (eff > own ? '<small class="muted"> 통역</small>' : '') + '</span>'; }).join('') + '</div></div></div>';
    el.innerHTML = html;
    var pc = el.querySelector('.pc');
    if (pc) {
      var half = G.Img.pick(G.Img.chain.heroHalf());
      if (half) {
        // 반신상 그림이 있으면 그것을 보여 준다
        var hc = A.canvas(520, 520); hc.style.width = '260px'; hc.style.height = '260px';
        G.Img.preload([G.Img.chain.heroHalf()], 2500).then(function () { G.Img.apply(hc, G.Img.chain.heroHalf(), { fit: 'contain' }); });
        pc.appendChild(hc);
      } else if (p.portrait) pc.appendChild(A.portraitCanvas(p.portrait, 260));
    }
  };

  PAGES.fleet = function (el) {
    var s = S(), f = s.fleet;
    var html = '<div class="grid3" style="margin-bottom:12px">' +
      box('선원', f.crew + '명', '최저 ' + R.crewMin() + ' · 최대 ' + R.crewMax()) +
      box('식량 / 물', Math.floor(f.food) + ' / ' + Math.floor(f.water) + '통', f.crew ? '약 ' + Math.min(R.daysOfFood(), R.daysOfWater()) + '일분' : '') +
      box('적재', R.used() + ' / ' + R.fleetCap() + '통', '교역품 ' + R.cargoQty() + '통 · ' + Object.keys(f.cargo).length + '/' + R.maxKinds() + '종' + (G.Cargo ? ' · 무게 ' + G.Cargo.wtText() : '')) +
      box('피로', Math.round(f.fatigue) + '%', UI.bar(f.fatigue, 100, 'red')) +
      box('규율', Math.round(f.discipline) + '%', UI.bar(f.discipline, 100, 'green')) +
      box('항해', (f.daysOut || 0) + '일째', f.scurvy > 0 ? '<span class="warn-text">괴혈병 ' + Math.round(f.scurvy) + '</span>' : '건강') + '</div>' +
      '<table class="tbl"><tr><th></th><th>선명</th><th>선종</th><th>선장</th><th>목재</th><th class="num">내구력</th><th class="num">적재량</th><th>대포</th><th>돛</th><th>선수상</th></tr>' +
      f.ships.map(function (sh, i) {
        var w = G.Ships.wood(sh);
        return '<tr><td>' + (i === 0 ? '<span class="tag">기함</span>' : '') + '</td><td><b>' + U.esc(sh.name) + '</b>' + (sh.loan ? ' <small class="muted">(빌린 배)</small>' : '') + '</td><td>' + G.SHIP[sh.type].name + '</td><td>' + U.esc(R.captainName(sh)) + '</td><td>' + (w ? w.name : '<span class="muted">—</span>') + '</td><td class="num">' + Math.round(sh.hp) + '/' + sh.maxHp + '</td><td class="num">' + R.shipCargoCap(sh) + '</td><td>' + (G.CANNON[sh.guns.type] || {}).name + ' ' + sh.guns.n + '/' + sh.ports + '</td><td>' + sh.sails.map(function (k) { return k === 'sq' ? '□' : k === 'bat' ? '▤' : '△'; }).join('') + '</td><td>' + (sh.fig ? G.FIGUREHEAD[sh.fig].name : '—') + '</td></tr>' +
          '<tr class="sub"><td></td><td colspan="9"><div class="traits">' + G.Ships.traitChips(sh) + '<span class="cult">' + G.SHIP[sh.type].feat + '</span></div></td></tr>';
      }).join('') + '</table>' + speedReport();
    var ids = Object.keys(f.cargo);
    html += '<div class="sep"></div><h4 style="margin:0 0 8px">적재 교역품</h4>' + (ids.length ? '<table class="tbl"><tr><th>품목</th><th class="num">수량</th><th class="num">산 값</th><th>산 곳</th></tr>' + ids.map(function (id) { var c = f.cargo[id]; return '<tr><td>' + G.goodDot(id) + G.GOOD[id].name + '</td><td class="num">' + c.q + '</td><td class="num">' + U.num(c.cost) + '</td><td>' + (G.CITY_DATA[c.from] ? G.CITY_DATA[c.from].name : '') + '</td></tr>'; }).join('') + '</table>' : '<div class="muted">없음</div>');
    if (s.moored) {
      var ms = []; for (var cid in s.moored) s.moored[cid].forEach(function (sh) { ms.push(U.esc(sh.name) + '호 (' + G.SHIP[sh.type].name + ') — ' + G.CITY_DATA[cid].name); });
      if (ms.length) html += '<div class="sep"></div><h4 style="margin:0 0 8px">계류 중인 배</h4><div style="font-size:17px;line-height:1.7">' + ms.join('<br>') + '</div>';
    }
    el.innerHTML = html;
    cabinButton(el, true);
  };
  /** 「기함 선실」 단추: 선실 화면(js/ui/cabinview.js)을 열고, 닫으면 이 쪽을 다시 그린다 */
  function cabinButton(el, top) {
    if (!G.CabinView || !S().fleet.ships.length) return;
    var b = U.el('button', 'btn navy', G.icon('bed') + ' 기함 선실 — 부하 배치');
    b.style.margin = top ? '0 0 12px' : '10px 0 0';
    b.onclick = function () { G.CabinView.open().then(function () { if (el.isConnected) (top ? PAGES.fleet : PAGES.mates)(el); }); };
    if (top) el.insertBefore(b, el.firstChild); else el.appendChild(b);
  }
  function box(k, v, sub) { return '<div class="parch" style="padding:10px 14px;background:rgba(255,250,236,.35);box-shadow:none;border:1px solid rgba(110,80,40,.3)"><div class="muted" style="font-size:15px">' + k + '</div><div class="big-num">' + v + '</div><div style="font-size:14px" class="muted">' + (sub || '') + '</div></div>'; }

  /** 함대 속력 풀이: 배마다의 평균 선속과 편대 보정 */
  function speedReport() {
    var rp = R.fleetReport(); if (!rp) return '';
    var pct = function (x) { return (x >= 0 ? '+' : '−') + Math.abs(Math.round(x * 1000) / 10) + '%'; };
    var h = '<div class="sep"></div><h4 style="margin:0 0 6px">함대 속력 <small class="muted">(바람을 고르게 받을 때의 평균)</small></h4>' +
      '<table class="tbl speedtbl"><tr><th>선명</th><th>선장</th><th class="num">조함</th><th class="num">짐</th><th class="num">평균 선속</th><th></th></tr>' +
      rp.each.map(function (e) {
        var slow = e.sh === rp.slow && rp.each.length > 1;
        return '<tr' + (slow ? ' class="sel"' : '') + '><td><b>' + U.esc(e.sh.name) + '</b></td><td>' + U.esc(e.cap) + '</td><td class="num">' + pct(e.hand - 1) + '</td><td class="num">' + Math.round(e.share * 100) + '%</td><td class="num">' + e.v.toFixed(2) + '°/일</td><td>' + (slow ? '<span class="tag">가장 느림</span>' : '') + '</td></tr>';
      }).join('') + '</table>';
    if (rp.each.length > 1) {
      h += '<div class="plan-note" style="margin-top:6px">함대는 편대를 지켜 가장 느린 ' + U.esc(rp.slow.name) + '호(' + rp.vmin.toFixed(2) + ')에 맞춥니다. ' +
        '예인 보조 +' + rp.assist.toFixed(2) + ' (운용술 ' + rp.ops + ') · 편대 유지 ' + pct(-rp.drag) + ' → <b>' + rp.v.toFixed(2) + '°/일</b>. ' +
        '짐은 빠른 배부터 싣고, 선장의 항해술 1마다 그 배가 3.5% 빨라집니다 (선장이 없으면 −4%).</div>';
    } else h += '<div class="plan-note" style="margin-top:6px">배가 한 척이면 그 배의 선속이 곧 함대 속력입니다. 두 척 이상이면 가장 느린 배에 맞추되, 운용술로 예인 보조를 받고 편대 유지 부담을 줄입니다.</div>';
    return h;
  }
  /** 부하가 하는 말: 타고난 말과 배에서 익힌 말(★) */
  function mateLangs(m, d) {
    var ks = {}; Object.keys(d.lg || {}).forEach(function (k) { ks[k] = 1; }); Object.keys(m.lgx || {}).forEach(function (k) { ks[k] = 1; });
    return Object.keys(ks).map(function (k) { var lv = R.mateLang(m, +k); return lv ? G.LANGS[k] + ' ' + G.LANG_LV[lv] + (lv > ((d.lg || {})[k] || 0) ? '★' : '') : ''; }).filter(Boolean).join(' · ');
  }
  PAGES.mates = function (el) {
    var s = S();
    if (!s.mates.length) { el.innerHTML = '<div class="muted">동료가 없습니다. 술집에서 동료를 찾아보십시오.</div>'; return; }
    el.innerHTML = '<div class="muted" style="margin-bottom:10px;font-size:16px">기함의 부관은 전투·교섭·의학 등을, 항해사는 항해술·운용술을, 측량사는 측량·역사학을 대신 맡습니다. 통역은 언어를 대신합니다. 경리는 회계로 교역소·시장에서 값을 후려치고 후원자에게 선금·기한을 더 받아 냅니다. 그림·세공은 누가 가졌든(자리와 상관없이) 발견물의 가치를 올립니다. 다른 배의 선장은 자기 배에서만 항해술(속도·폭풍)·포술·검술·조선기술을 씁니다. 역할은 술집·여관의 「부하편성」이나 항구의 「함대편성 → 선장 임명」에서 바꿉니다. 그 밖의 부하는 「기함 선실」에서 방(요리실·진료실·포격실…)에 두면 그 방의 특기가 함대에 쓰입니다. 자리가 없는 부하는 달마다 충성이 떨어지고, 충성이 40 아래면 일을 건성으로 하며, 0이 되면 배에서 내리려 합니다.</div><div class="mates"></div>';
    var box2 = el.querySelector('.mates');
    R.tidyCaptains();
    s.mates.forEach(function (m) {
      var d = G.MATE[m.id]; if (!d) return;
      var row = U.el('div', 'shipcard', '<div class="pp"></div><div><div class="flex"><b style="font-size:21px">' + d.name + '</b>' + (G.Bio ? G.Bio.link(d.name) : '') + (d.witch ? '<span class="tag">마녀</span>' : d.wd ? '<span class="tag">철새 · ' + U.esc(d.natName || '') + '</span>' : '') + '<span class="tag">' + U.esc(G.Cabins ? G.Cabins.placeName(m) : R.roleName(m)) + '</span>' + (G.Cabins && G.Cabins.eff(m) < 1 ? '<span class="tag hurt">일을 건성으로 · 효율 ' + Math.round(G.Cabins.eff(m) * 100) + '%</span>' : '') + (R.mateHurt(m) ? '<span class="tag hurt">부상 ' + R.mateHurt(m) + '일</span>' : '') + '<span class="right muted">월급 ' + d.wage + '닢 · 충성 ' + Math.round(m.loyal || 70) + '</span></div>' +
        '<div class="muted" style="font-size:16px;margin:4px 0">' + d.desc + '</div>' +
        '<div style="font-size:16px">' + Object.keys(d.sk).map(function (k) { return G.SKILL_BY_ID[k].name + ' ' + pips(d.sk[k]); }).join(' &nbsp; ') + '</div>' +
        '<div style="font-size:15px;margin-top:4px" class="muted">' + mateLangs(m, d) + '</div></div>');
      row.style.gridTemplateColumns = '96px 1fr';
      row.querySelector('.pp').appendChild(A.portraitCanvas(G.Scenes.mateSpec(m.id), 96));
      box2.appendChild(row);
    });
    cabinButton(el, false);
  };

  /** 철새 명부: 지금 항구를 떠도는 떠돌이 항해사와 마녀 (소문으로 들은 머무는 곳) */
  PAGES.wander = function (el) {
    var s = S(), y = s.date.y, hired = {};
    s.mates.forEach(function (m) { hired[m.id] = 1; });
    var ready = function (m) { return G.Frontier ? G.Frontier.mateReady(m, y) : true; };
    var list = G.MATES.filter(function (m) { return (m.wd || m.witch) && !hired[m.id] && !s.flags['gone_' + m.id] && ready(m); });
    var c = G.BALANCE.wander || {}, gen = G.Wander ? G.Wander.genOf(y) : 0, ep = (c.epoch || 1480) + (gen + 1) * (c.cycle || 30);
    el.innerHTML = '<div class="muted" style="margin-bottom:10px;font-size:16px">철새는 역사책에 이름이 없는 떠돌이 항해사입니다. 해마다 ' + (c.perYear || 5) + '명씩 새로 항구에 나타나고, ' + (c.cycle || 30) + '년마다 세대가 바뀌어 이름·국적·성별이 달라진 다음 세대가 나타납니다 (다음 세대: ' + ep + '년). 얼굴이 겹치는 사람도 있습니다. 마녀는 전설 속 마녀와 15~17세기에 마녀로 몰렸던 여인들입니다. 머무는 곳은 소문이라 한 달쯤 지나면 달라집니다.</div>' +
      '<table class="tbl"><tr><th></th><th>이름</th><th>국적·갈래</th><th>특기</th><th>명성</th><th>월급</th><th>머무는 곳</th></tr></table>';
    var tb = el.querySelector('table');
    list.sort(function (a, b) { return (b.witch ? 1 : 0) - (a.witch ? 1 : 0) || a.fame - b.fame; });
    list.forEach(function (m) {
      var at = G.MateMove && G.MateMove.where(m.id);
      var tr = U.el('tr', '', '<td class="pp"></td><td><b>' + U.esc(m.name) + '</b>' + (G.Bio ? G.Bio.link(m.name) : '') + ' <small class="muted">' + (m.g === 'f' ? '여' : '남') + '</small></td>' +
        '<td>' + (m.witch ? '<span class="tag">' + (m.legend ? '전설의 마녀' : '마녀') + '</span>' : U.esc(m.natName + ' · ' + m.typeName) + (m.prevName ? ' <small class="muted">(' + (m.gen + 1) + '세대)</small>' : '')) + '</td>' +
        '<td>' + Object.keys(m.sk).map(function (k) { return G.SKILL_BY_ID[k].name + ' ' + m.sk[k]; }).join(' · ') + '</td>' +
        '<td>' + U.num(m.fame) + '</td><td>' + m.wage + '닢</td><td>' + (at ? U.esc(at.name) : '—') + '</td>');
      try { tr.querySelector('.pp').appendChild(A.portraitCanvas(G.Scenes.mateSpec(m.id), 48)); } catch (e) { /* 그림 없음 */ }
      tb.appendChild(tr);
    });
    if (!list.length) el.appendChild(U.el('div', 'muted', '지금은 소문난 철새가 없습니다.'));
  };

  PAGES.items = function (el, win) {
    var s = S(), p = s.player;
    function mountUnit(id) { return id === 'porter' ? '패' : (id === 'wagon' || id === 'reindeer') ? '대' : '필'; }
    /** 탈것은 손에 드는 소지품 칸을 차지하지 않는 재사용 이동 장비다. 현재 탐험대와 도시별 마구간 보관분을 한눈에 보여 준다. */
    function mountGear() {
      if (!G.Mounts) return '';
      var list = [], active = s.loc && s.loc.mode === 'land' ? s.loc.mount : s.landReturn && s.landReturn.mount;
      if (active && active.id !== 'walk' && active.n > 0) list.push({ mt: active, at: '탐험대에서 사용 중', active: true });
      Object.keys(s.stable || {}).forEach(function (cid) {
        var mt = s.stable[cid], c = G.CITY_DATA[+cid];
        if (mt && mt.id !== 'walk' && mt.n > 0) list.push({ mt: mt, at: (c ? c.name : '도시') + ' 성문 마구간' });
      });
      var cards = list.length ? list.map(function (o) {
        var m = G.Mounts.get(o.mt.id), best = G.Mounts.best(o.mt.id), tn = best.terr && G.MOUNT_TERR_NAME[best.terr];
        var reuse = m.hire ? '이번 탐험 동안 고용한 지원 인력으로, 귀환하면 품삯을 받고 돌아간다.' : '도시로 귀환하면 마구간에 보관되어 다음 탐험에 다시 쓸 수 있다.';
        return '<div class="mount-item' + (o.active ? ' active' : '') + '"><div class="mi-icon">' + G.icon('horse') + '</div><div class="mi-body"><div><b>' + U.esc(m.name) + ' ×' + o.mt.n + mountUnit(o.mt.id) + '</b> <span class="tag">' + (m.hire ? '지원 인력' : '이동 장비') + '</span>' + (o.active ? ' <span class="tag on">장비 중</span>' : '') + '</div><div class="mi-at">' + U.esc(o.at) + '</div><small>' + (tn ? tn + '에서 걸음 ×' + best.v.toFixed(1) + ' · ' : '') + reuse + '</small></div></div>';
      }).join('') : '<div class="muted">보유한 이동 장비가 없습니다. 도시 성문의 마구간에서 말·당나귀 같은 탈것을 사면 이곳에 표시됩니다.</div>';
      return '<div class="mount-gear"><h4>이동 장비 <small>소지품 칸을 쓰지 않음</small></h4><div class="mount-items">' + cards + '</div><div class="mount-rule">말·당나귀 같은 탈것은 소모품이 아닙니다. 탐험 중 쓰러진 수량만 잃고, 살아 돌아온 탈것은 출발한 도시 마구간에 자동으로 맡겨져 재사용됩니다. 다른 도시에서 쓰려면 그 도시 마구간에서 따로 마련해야 합니다.</div></div>';
    }
    function render() {
      var nRel = p.items.filter(function (it) { return G.RELIC && G.RELIC[it.id]; }).length;
      var fk = G.Fakes ? G.Fakes.list() : [];       // 모조품 (js/systems/fakes.js) — 짐 칸은 차지하지 않는다
    var fakeHtml = fk.length ? '<div class="mount-gear"><h4>모조품 <small>보고할 때 증거로 내밀 수 있다 · 들키면 벌금이나 옥살이</small></h4><div class="muted">' + fk.map(function (d) { return '「' + U.esc(d.name) + '」' + (G.Fakes.count(d.id) > 1 ? ' ×' + G.Fakes.count(d.id) : '') + (G.Disc.foundByMe(d.id) ? ' <span class="tag">진짜도 가짐</span>' : ''); }).join(' · ') + '</div></div>' : '';
    el.innerHTML = mountGear() + fakeHtml + '<div class="muted" style="margin:14px 0 10px">소지품 ' + p.items.length + '/' + R.ITEM_MAX + (nRel ? ' · 발견 유물 ' + nRel + '점 — <b>증거</b> 표시가 붙은 것은 아직 보고·발표하지 않은 발견의 증거입니다. 후원자에게 보고하면 바치고, 항구에서 발표하면 제독의 것이 됩니다.' : '') + '</div><table class="tbl items-tbl"><tr><th></th><th>이름</th><th>종류</th><th>설명</th><th></th></tr>' +
        p.items.map(function (it, i) {
          var d = G.ITEM[it.id] || {}, kind = d.kind || it.kind, rl = G.RELIC && G.RELIC[it.id];
          var eq = (kind === 'weapon' && p.equip.weapon === it.id) || (kind === 'armor' && p.equip.armor === it.id);
          var act = kind === 'weapon' || kind === 'armor' ? (eq ? '<span class="tag">장비 중</span>' : '<button class="btn small" data-eq="' + i + '">장비</button>') : '';
          if (rl && (rl.kind === 'book' || rl.lead)) act += ' <button class="btn small" data-read="' + i + '">' + (it.read ? '다시 본다' : '읽는다') + '</button>';
          var stat = kind === 'weapon' ? '공격 ' + d.atk : kind === 'armor' ? '방어 ' + d.def : kind === 'gift' && d.gv ? '호감 ' + d.gv : '';
          var tags = (R.isProof(it) ? ' <span class="tag warn-text">「' + U.esc(G.DISC[it.disc] ? G.DISC[it.disc].name : '') + '」 증거</span>' : rl ? ' <span class="tag">유물</span>' : '') + (it.read ? ' <span class="tag">읽음</span>' : '');
          var ob = rl && rl.real && rl.real.obj;
          var extra = (ob ? '<div class="muted" style="font-size:13px">실존 유물 — ' + U.esc(ob.museum) + (ob.no ? ' ' + U.esc(ob.no) : '') + '</div>' : '') + (rl && rl.kind === 'fig' ? '<div class="muted" style="font-size:14px">조선소의 「선수상」에서 배에 달 수 있다.</div>' : '');
          var val = rl ? '<div class="muted" style="font-size:14px">값 ' + U.num(G.Disc.relicValue(it)) + '닢' + (stat ? ' · ' + stat : '') + '</div>' : stat ? '<div class="muted" style="font-size:14px">' + stat + '</div>' : '';
          return '<tr><td class="ic" data-ic="' + i + '"></td><td><b>' + U.esc(R.itemName(it)) + '</b>' + (it.n > 1 ? ' ×' + it.n : '') + tags + '</td><td>' + (G.ITEM_KIND[kind] || '') + '</td><td style="font-size:16px">' + U.esc(it.desc || d.desc || '') + val + extra + '</td><td style="white-space:nowrap">' + act + (eq ? '' : ' <button class="btn small red" data-del="' + i + '">버림</button>') + '</td></tr>';
        }).join('') + '</table>';
      // 유물은 작은 그림을 곁들인다 (images/relics/ID 가 있으면 그 그림)
      U.$$('[data-ic]', el).forEach(function (td) {
        var it = p.items[+td.dataset.ic], d = G.ITEM[it.id], rl = G.RELIC && G.RELIC[it.id], art = rl || d;
        if (art && A.relicArt) {
          var chain = rl ? G.Img.chain.relic(rl) : G.Img.chain.item(d);
          var cv = G.Img.make(chain, 96, 96, function () { return A.relicArt(art, 96, 96); }, { fit: 'contain' });
          cv.className = 'relic-ic'; td.appendChild(cv);
        }
      });
      U.$$('[data-eq]', el).forEach(function (b) { b.onclick = function () { var it = p.items[+b.dataset.eq], d = G.ITEM[it.id]; p.equip[d.kind === 'weapon' ? 'weapon' : 'armor'] = it.id; render(); }; });
      U.$$('[data-read]', el).forEach(function (b) { b.onclick = async function () { await G.Disc.readRelic(p.items[+b.dataset.read]); render(); }; });
      U.$$('[data-del]', el).forEach(function (b) { b.onclick = async function () {
        var it = p.items[+b.dataset.del], nm = R.itemName(it);
        var warn = it.kind === 'evidence' ? '<br><span class="warn-text">발견을 보고할 때 건넬 증거품입니다. 버리면 후원자가 반만 믿어 사례금이 줄어듭니다.</span>'
          : R.isProof(it) ? '<br><span class="warn-text">「' + U.esc(G.DISC[it.disc].name) + '」 발견의 증거인 유물입니다. 버리면 증거가 모자라 사례금과 명성이 줄 수 있고, 다시 구할 수 없습니다.</span>'
          : G.RELIC && G.RELIC[it.id] ? '<br><span class="warn-text">다시 구할 수 없는 유물입니다. 시장에 팔면 금화 ' + U.num(G.Disc.relicValue(it)) + '닢을 받을 수 있습니다.</span>' : '';
        if (await UI.confirm(nm + U.jx(nm, '을/를') + ' 버리겠습니까?' + warn)) { p.items.splice(+b.dataset.del, 1); render(); }
      }; });
    }
    render();
  };

  PAGES.disc = function (el) {
    var s = S();
    var mine = G.DISCOVERIES.filter(function (d) { return G.Disc.foundByMe(d.id); });
    var html = '<div class="flex" style="margin-bottom:10px"><b style="font-size:20px">발견물 ' + mine.length + ' / ' + G.DISCOVERIES.length + '</b><span class="right muted">해도 작성 ' + (G.State.chartPercent() * 100).toFixed(1) + '%</span></div>';
    html += frontierBoard();
    Object.keys(G.DISC_CATS).forEach(function (cat) {
      var all = G.DISCOVERIES.filter(function (d) { return d.cat === cat; });
      var got = all.filter(function (d) { return G.Disc.foundByMe(d.id); });
      html += '<h4 style="margin:14px 0 6px">' + G.DISC_CATS[cat] + ' <small class="muted">' + got.length + '/' + all.length + '</small></h4><div class="cardgrid">' +
        all.map(function (d) {
          var st = s.disc[d.id] || {};
          var nmTag = d.aka ? '<div class="muted" style="font-size:13px">' + U.esc(d.aka) + (S().nameBy && S().nameBy[d.id] === 'me' ? ' — 제독이 이름을 붙임' : '') + '</div>' : '';
          if (st.me) return '<div class="card" data-d="' + d.id + '"><b>' + U.esc(d.name) + '</b>' + nmTag + '<div class="muted" style="font-size:14px">' + (st.reported ? '보고 완료' : st.announced ? '발표 완료' : '미보고') + (G.RELICS && G.RELICS[d.id] ? ' · 유물 ' + G.RELICS[d.id].length : '') + (st.left && st.left.length ? ' · 두고 온 것 있음' : '') + '</div></div>';
          if (st.rival) return '<div class="card off" title="' + U.esc(st.rival) + ' 발견"><b>' + U.esc(d.name) + '</b>' + nmTag + '<div class="muted" style="font-size:14px">' + U.esc(st.rival) + ' 발견</div></div>';
          return '<div class="card off"><b>？？？</b></div>';
        }).join('') + '</div>';
    });
    el.innerHTML = html;
    U.$$('[data-d]', el).forEach(function (c) { c.onclick = function () { G.Scenes.discoveryCard(G.DISC[c.dataset.d], 0); }; });
  };

  /** 개척 현황: 길마다 단계가 어디까지 열렸는지, 다음 목표는 무엇인지 */
  function frontierBoard() {
    if (!G.Frontier || !G.FRONTIERS) return '';
    var open = G.DISCOVERIES.filter(function (d) { return !G.Disc.foundByMe(d.id) && G.Disc.available(d); }).length;
    var h = '<div class="frboard"><div class="fr-title">개척 현황 <small class="muted">— 지금 단서를 들을 수 있는 미발견 발견물 ' + open + '곳. 앞 단계가 알려질수록 더 먼 곳, 더 무거운 발견물의 단서가 열립니다. 칸에 마우스를 올리면 다음 조건이 보입니다.</small></div>';
    ['home', 'east', 'west'].forEach(function (road) {
      var fs = G.FRONTIERS.filter(function (f) { return f.road === road; });
      h += '<div class="fr-row"><span class="fr-road">' + G.ROADS[road] + '</span><div class="fr-chips">' +
        fs.map(function (f, i) {
          var st = G.Frontier.status(f.id);
          return (i && road !== 'home' ? '<span class="fr-arrow">›</span>' : '') +
            '<div class="fr-chip lv' + st.lv + (st.t2 ? ' t2' : '') + (st.t3 ? ' t3' : '') + '" title="' + U.esc(st.next) + '"><b>' + f.name + '</b><small>' + st.label + ' · ' + st.found + '/' + st.total + '</small></div>';
        }).join('') + '</div></div>';
    });
    var goals = G.Frontier.goals();
    if (goals.length) h += '<div class="fr-goals">' + goals.map(function (g) { return '<div><b>' + G.ROADS[g.road] + ' 다음 목표 — 〈' + g.st.name + '〉</b> ' + U.esc(g.st.next) + '</div>'; }).join('') + '</div>';
    return h + '</div>';
  }
  I.frontierBoard = frontierBoard;

  PAGES.achv = function (el) { if (G.Achieve) G.Achieve.page(el); };
  PAGES.hints = function (el) {
    var s = S(), ids = Object.keys(s.hints);
    if (!ids.length) { el.innerHTML = '<div class="muted">아직 단서가 없습니다. 옛 유적·옛 보물·전설·지리는 도서관 사료에서, 자연·생물·민족은 술집의 소문에서, 교역품과 보물은 교역소 주인에게서, 그 밖에 후원자의 취향에 맞는 이야기는 후원자에게서 들을 수 있습니다. 같은 발견의 단서를 다른 곳에서 또 들으면 단서가 겹쳐(최대 4겹) 망루가 더 멀리서 알아채고 찾기가 쉬워집니다.</div>'; return; }
    el.innerHTML = ids.map(function (id) {
      var d = G.DISC[id], h = s.hints[id];
      var st = s.disc[id];
      return '<div class="hint-item"><div class="flex"><span class="nm">' + d.name + '</span><span class="tag">' + G.DISC_CATS[d.cat] + '</span>' + (G.CLUE ? '<span class="tag">' + G.CLUE_NAME[G.Disc.clue(d)] + '</span>' : '') + (st && st.rival ? '<span class="tag warn-text">' + U.esc(st.rival) + ' 선점</span>' : '') + (G.Disc.hintLv(id) > 1 ? '<span class="tag good-text">단서 ' + G.Disc.hintLv(id) + '겹</span>' : '') + '<span class="right muted" style="font-size:14px">' + G.Disc.hintSrcs(id).map(srcName).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join(' · ') + '</span></div><div class="tx">' + U.esc(d.hint) + '</div></div>';
    }).join('');
  };
  function srcName(src) {
    if (!src) return '';
    var p = String(src).split(':');
    if (p[0] === 'book') { var b = G.BOOKS.filter(function (x) { return x.id === p[1]; })[0]; return b ? b.title : '책'; }
    if (p[0] === 'tavern') return (G.CITY_DATA[p[1]] ? G.CITY_DATA[p[1]].name + ' ' : '') + '술집의 소문';
    if (p[0] === 'trade') return (G.CITY_DATA[p[1]] ? G.CITY_DATA[p[1]].name + ' ' : '') + '교역소';
    if (p[0] === 'mate') return '동료의 이야기';
    if (p[0] === 'chain' && G.DISC[p[1]]) return '「' + G.DISC[p[1]].name + '」에서 이어진 실마리';
    if (p[0] === 'relic' && G.RELIC && G.RELIC[p[1]]) return '「' + G.RELIC[p[1]].name + '」에 적힌 이야기';
    var SRC = { sponsor: '후원자의 이야기', contract: '후원자 계약', rival: '경쟁자에게서', lookout: '망루·정찰대', bottle: '병 속 편지', hail: '지나가던 배',
      native: '원주민', nomad: '유목민', local: '고장 사람의 이야기', town: '거리의 마을 사람', lead: '큰 항로 이야기', legacy: '선대의 연구 노트', witch: '점쟁이', ghost: '유령선의 항해 일지', map: '보물 지도 조각' };
    return SRC[p[0]] || '';
  }

  PAGES.contract = function (el) {
    var s = S(), k = s.contract;
    var html = '';
    if (k) {
      var sp = G.SPONSOR[k.sponsor], d = G.DISC[k.disc], tk = k.task;
      var due = { y: Math.floor(k.due / 10000), m: Math.floor(k.due / 100) % 100, d: k.due % 100 };
      html += '<h4 style="margin:0 0 8px">진행 중인 계약</h4><div class="kv"><div>후원자</div><div>' + G.Sponsor.holderName(sp) + ' (' + sp.title + ', ' + G.CITY_DATA[sp.city].name + ')</div>' +
        '<div>목적</div><div><b>' + U.esc(G.Errand.name(k)) + '</b>' + (k.small ? ' <span class="tag">작은 계약</span>' : '') + '</div><div>기한</div><div>' + U.fmtDate(due) + (U.dateNum(s.date) > k.due ? ' <span class="warn-text">(기한 초과)</span>' : '') + '</div>' +
        '<div>선금</div><div>' + U.num(k.advance) + '닢</div><div>성공 보수</div><div>' + U.num(k.reward) + '닢' + (tk && tk.fame ? ' · 명성 +' + tk.fame : '') + '</div>' +
        '<div>상태</div><div>' + (G.Errand.done(k) ? '<span class="good-text">' + G.Errand.status(k) + '</span>' : G.Errand.status(k)) + '</div></div>' +
        (tk && tk.kind !== 'confirm' ? '<div class="hint-item" style="margin-top:10px"><div class="tx">' + U.esc(tk.desc || '') + (sp && G.Sponsor.fameNeed(sp) > s.player.fame ? ' (후원자를 만날 명성이 모자라면 집사에게 보고합니다)' : '') + '</div></div>' : d && !k.circ ? '<div class="hint-item" style="margin-top:10px"><div class="tx">' + U.esc(d.hint) + '</div></div>' : '') +
        (k.loan ? '<div class="muted" style="margin-top:6px;font-size:15px">빌린 배: ' + U.esc(k.loanName || '') + '호 — 정산할 때 돌려줍니다. 잃으면 배값을 물어야 합니다.</div>' : '') +
        (G.Plan && !tk && !G.Disc.foundByMe(k.disc) ? G.Plan.html(G.Plan.forContract()) : '');
    } else html += '<div class="muted">진행 중인 계약이 없습니다. 단서를 모아 왕궁이나 저택의 후원자를 찾아가 모험을 제안하십시오. 아직 이름이 없으면 후원자(또는 집사)에게 「작은 일거리」를 청해 해도 작성·물자 조달·소문 확인부터 시작할 수 있습니다.</div>';
    // 왕명 (js/systems/court.js)
    if (G.Court) html += G.Court.taskHtml();
    // 조합 의뢰
    var qs = G.Quest ? G.Quest.list() : [];
    html += '<div class="sep"></div><h4 style="margin:0 0 8px">맡은 조합 의뢰</h4>';
    if (qs.length) {
      html += '<table class="tbl"><tr><th>의뢰</th><th>종류</th><th>보고할 곳</th><th class="num">사례금</th><th class="num">남은 날</th></tr>' +
        qs.map(function (q) {
          var left = G.Quest.remain(q);
          var prog = q.kind === 'pirate' ? ' (' + (q.got || 0) + '/' + q.qty + ')' : q.kind === 'debt' ? (q.collected ? ' (받아 왔다)' : ' (' + G.CITY_DATA[q.at].name + '으로)') : '';
          return '<tr><td>' + U.esc(q.title) + prog + '</td><td>' + G.Quest.KINDS[q.kind].name + '</td><td>' + G.CITY_DATA[q.to].name + '</td><td class="num">' + U.num(q.pay) + '</td><td class="num' + (left < 3 ? ' warn-text' : '') + '">' + (left < 0 ? '지남' : left) + '</td></tr>';
        }).join('') + '</table>';
    } else html += '<div class="muted">맡은 의뢰가 없습니다. 조합에서 의뢰를 살펴보십시오.</div>';
    // 투자
    var inv = Object.keys(s.invest || {}).filter(function (id) { return s.invest[id].amt > 0; });
    if (inv.length) {
      html += '<div class="sep"></div><h4 style="margin:0 0 8px">출자한 교역소</h4><table class="tbl"><tr><th>도시</th><th class="num">낸 돈</th><th>등급</th><th class="num">쌓인 배당</th></tr>' +
        inv.sort(function (a, b) { return s.invest[b].amt - s.invest[a].amt; }).map(function (id) {
          var iv = s.invest[id];
          return '<tr><td>' + G.CITY_DATA[id].name + '</td><td class="num">' + U.num(iv.amt) + '</td><td>' + R.investLv(+id) + '등급</td><td class="num">' + U.num(Math.floor(iv.div)) + '</td></tr>';
        }).join('') + '</table>';
    }
    var met = Object.keys(s.sponsors || {});
    if (met.length) {
      html += '<div class="sep"></div><h4 style="margin:0 0 8px">알고 지내는 후원자</h4><table class="tbl"><tr><th>후원자</th><th>도시</th><th>세력</th><th class="num">신뢰</th><th class="num">성공</th></tr>' +
        met.map(function (id) { var sp = G.SPONSOR[id], r = s.sponsors[id]; return '<tr><td>' + G.Sponsor.holderName(sp) + ' <small class="muted">' + sp.title + '</small></td><td>' + G.CITY_DATA[sp.city].name + '</td><td>' + G.POWER_NAME[sp.pw] + '</td><td class="num">' + Math.round(r.trust || 0) + '</td><td class="num">' + (r.done || 0) + '</td></tr>'; }).join('') + '</table>';
    }
    el.innerHTML = html;
  };

  /** 수첩 교역: 유럽 시장의 시대 수요 (js/systems/era.js) — 많이 찾는 것·덜 찾는 것·곧 오를 것 */
  function eraBox() {
    if (!G.Era) return '';
    var L = G.Era.list(), RN = G.REGIONS;
    var up = L.filter(function (x) { return x.hi >= 1.15; }).sort(function (a, b) { return b.hi - a.hi; }).slice(0, 8);
    var down = L.filter(function (x) { return x.lo <= 0.87; }).sort(function (a, b) { return a.lo - b.lo; }).slice(0, 5);
    var soon = L.filter(function (x) { return x.trend >= 0.15; }).sort(function (a, b) { return b.trend - a.trend; }).slice(0, 4);
    function chip(x, v, r, cls) { return '<span class="era-chip ' + cls + '" title="' + U.esc(x.note) + '">' + G.goodDot(x.g) + x.name + ' <small>×' + v.toFixed(2) + (r != null && x.hi - x.lo > 0.02 ? ' ' + RN[r] : '') + '</small></span>'; }
    return '<div class="era-box"><b>' + G.icon('scales') + ' 유럽 시장의 시대 수요 (' + S().date.y + '년)</b> <small class="muted">— 이베리아·북유럽·지중해 도시의 값에 곱한다. 이름 위에 마우스를 올리면 까닭</small>' +
      (up.length ? '<div class="era-row"><span class="era-lbl up">많이 찾는다</span>' + up.map(function (x) { return chip(x, x.hi, x.best, 'up'); }).join('') + '</div>' : '') +
      (down.length ? '<div class="era-row"><span class="era-lbl down">덜 찾는다</span>' + down.map(function (x) { return chip(x, x.lo, x.worst, 'down'); }).join('') + '</div>' : '') +
      (soon.length ? '<div class="era-row"><span class="era-lbl soon">곧 오른다</span>' + soon.map(function (x) { return chip(x, x.hi + x.trend, null, 'soon'); }).join('') + '<small class="muted"> (10년 뒤)</small></div>' : '') + '</div>';
  }
  PAGES.trade = function (el) {
    var s = S();
    if (!G.Ledger || !G.Ledger.count()) { el.innerHTML = eraBox() + '<div class="muted">아직 적어 둔 시세가 없습니다. 교역소에 들를 때마다 그 도시의 사는 값·파는 값이 이 수첩에 적힙니다.</div>'; return; }
    var rows = G.Ledger.table();
    var br = G.Ledger.bestRoute();
    var fads = G.Fad ? G.Fad.list() : [];
    function cell(b) { return b ? U.num(b.price) + ' <small class="muted">' + G.CITY_DATA[b.city].name + (b.age > 60 ? ' · ' + b.age + '일 전' : '') + '</small>' : '<span class="muted">—</span>'; }
    var html = '<div class="flex" style="margin-bottom:10px"><b style="font-size:18px">들러 본 교역소 ' + G.Ledger.count() + '곳의 기록</b>' +
      (br ? '<span class="right good-text">가장 남는 장사: ' + G.CITY_DATA[br.buy].name + '의 ' + G.GOOD[br.good].name + ' → ' + G.CITY_DATA[br.sell].name + ' (1통 +' + U.num(br.gain) + ')</span>' : '') + '</div>' +
      (fads.length ? '<div class="good-text" style="margin:-2px 0 10px;font-size:16px">' + G.icon('star') + ' 지금 유행: ' + fads.map(function (x) { return x.where + '의 <b>' + x.name + '</b> (값 ' + x.m + '배 · ' + x.left + '일 남음' + (x.src === 'me' ? '' : ' · ' + U.esc(x.why || '세상의 유행')) + ')'; }).join(' · ') + '</div>' : '') +
      eraBox() +
      '<table class="tbl"><tr><th>교역품</th><th class="num">가장 싸게 사는 곳</th><th class="num">가장 비싸게 파는 곳</th><th class="num">1통 차익</th></tr>' +
      rows.map(function (r) {
        return '<tr><td>' + G.goodDot(r.id) + r.name + '</td><td class="num">' + cell(r.buy) + '</td><td class="num">' + cell(r.sell) + '</td><td class="num ' + (r.gain > 0 ? 'down' : '') + '">' + (r.gain != null ? (r.gain > 0 ? '+' : '') + U.num(r.gain) : '') + '</td></tr>';
      }).join('') + '</table>' +
      '<div class="muted" style="margin-top:8px;font-size:14px">' + G.Ledger.OLD + '일이 넘은 기록은 믿을 수 없어 빼고 보여 줍니다. 한 번에 많이 팔면 값이 떨어지니 여러 곳에 나누어 파십시오.</div>';
    el.innerHTML = html;
  };
  PAGES.log = function (el) {
    var s = S();
    el.innerHTML = '<div style="font-size:17px;line-height:1.75">' + s.log.slice().reverse().map(function (l) {
      var y = Math.floor(l.d / 10000), m = Math.floor(l.d / 100) % 100, d = l.d % 100;
      return '<div class="flex" style="align-items:flex-start;border-bottom:1px solid rgba(90,65,35,.15);padding:4px 0"><span class="muted" style="width:150px;flex:0 0 150px">' + y + '. ' + m + '. ' + d + '.</span><span>' + U.esc(l.t) + '</span></div>';
    }).join('') + '</div>';
  };

  PAGES.map = function (el) {
    el.innerHTML = '<div class="flex" style="margin-bottom:8px"><span class="muted">탐험한 바다만 그려집니다. 휠·＋/－로 확대하고 끌어서 옮기며, 도시를 누르면 요약이 나옵니다.</span><span class="right muted">해도 작성 ' + (G.State.chartPercent() * 100).toFixed(1) + '%</span></div><div class="mapbox"></div>';
    G.ChartView.mount(el.querySelector('.mapbox'), { w: 1100, h: 560 });
    // 이어진 항로: 한 항구에서 출항해 다른 항구에 곧장 입항하면 자동항해가 열린다
    var list = G.Routes ? G.Routes.list() : [];
    var h = '<div class="sep"></div><h4 style="margin:0 0 6px">항로 경험 <small class="muted">— 한 항구에서 출항해 다른 항구에 곧장(다른 항구에 들르지 않고) 입항하면 두 항구 사이의 자동항해가 열립니다(오는 길도). 자동항해 중 손으로 몰면 풀리고, 다음 항구에 들어간 뒤 그 항구와 이어진 항로에서 다시 쓸 수 있습니다.</small></h4>';
    if (!list.length) h += '<div class="muted">아직 항구와 항구 사이를 오간 적이 없습니다. 익숙하지 않은 항로는 목적지 쪽으로 곧장 침로만 잡으므로, 뭍에 막히면 바다를 눌러 돌아가야 합니다.</div>';
    else h += '<table class="tbl"><tr><th>항로</th><th class="num">오간 횟수</th><th class="num">가장 빠른 항해</th><th>자동항해</th></tr>' + list.map(function (r) {
      return '<tr' + (r.open ? ' class="sel"' : '') + '><td><b>' + G.CITY_DATA[r.a].name + ' – ' + G.CITY_DATA[r.b].name + '</b>' + (r.long ? ' <small class="muted">장거리</small>' : '') + '</td><td class="num">' + r.n + '번</td><td class="num">' + (r.best ? r.best + '일' : '—') + '</td><td>' + (r.open ? '<span class="tag">열림</span>' : '<span class="muted">' + (r.need - r.n) + '번 더</span>') + '</td></tr>';
    }).join('') + '</table>';
    el.insertAdjacentHTML('beforeend', h);
  };

  // ---------------------------------------------------------------- parchment sea chart (2D)
  var landRaster = null;
  function buildLand() {
    var W = 720, H = 360, a = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var lon = -180 + (x + 0.5) * 0.5, lat = 90 - (y + 0.5) * 0.5;
      a[y * W + x] = G.Geo.isLand(lon, lat) ? 1 : 0;
    }
    return a;
  }
  /** 해도의 바탕: 탐험한 바다·뭍·해안선·경위선. box = {lon0, lon1, lat0, lat1} */
  I.chartTerrain = function (w, h, box) {
    if (!landRaster) landRaster = buildLand();
    var lon0 = box.lon0, lon1 = box.lon1, lat0 = box.lat0, lat1 = box.lat1;
    var cv = A.canvas(w, h), ctx = cv.getContext('2d');
    var img = ctx.createImageData(w, h), d = img.data;
    var fine = (lon1 - lon0) / w < 0.2;   // small area: sample the coastline directly
    // 칸마다 G.State.charted 를 두 번씩 부르던 것을, 열·줄의 격자 번호를 미리 세어 두고 탐험 비트를 바로 읽는다.
    // 해안선도 점마다 fillRect 하지 않고 같은 픽셀 판에 바로 섞는다 (세계 해도 1440×620 기준 약 4배 빠름).
    var S = G.Game.state, bits = S && S.chartBits, x, y, o;
    var gxs = new Int32Array(w), lons = new Float64Array(w), cls = new Uint8Array(w * h);   // cls: 0 안 가 본 곳 · 1 가 본 바다 · 2 가 본 뭍
    for (x = 0; x < w; x++) { lons[x] = lon0 + (x + 0.5) / w * (lon1 - lon0); gxs[x] = U.clamp(Math.floor((G.Geo.wrapLon(lons[x]) + 180) * 2), 0, 719); }
    for (y = 0; y < h; y++) {
      var lat = lat1 - (y + 0.5) / h * (lat1 - lat0);
      var cy = Math.floor((90 - lat) * 2), inChart = !!bits && cy >= 0 && cy < 360, gy = U.clamp(cy, 0, 359), row = gy * 720;
      for (x = 0; x < w; x++) {
        var gi = row + gxs[x];
        var seen = inChart && (bits[gi >> 3] & (1 << (gi & 7)));
        var land = fine ? (G.Geo.sdfRaw(lons[x], lat) > 0 ? 1 : 0) : landRaster[gi];
        o = (y * w + x) * 4;
        var r, g, b;
        if (!seen) { r = 214; g = 196; b = 156; }
        else if (land) { r = 196; g = 168; b = 112; cls[y * w + x] = 2; }
        else { r = 150; g = 178; b = 176; cls[y * w + x] = 1; }
        var n = ((x * 73856093) ^ (y * 19349663)) & 15;
        d[o] = r - n; d[o + 1] = g - n; d[o + 2] = b - n; d[o + 3] = 255;
      }
    }
    // coast ink on charted land edges
    for (y = 1; y < h - 1; y++) {
      for (x = 1; x < w - 1; x++) {
        var ci = y * w + x, c0 = cls[ci];
        if (!c0) continue;
        var isL = c0 === 2;
        if (isL !== (cls[ci + 1] === 2) || isL !== (cls[ci + w] === 2)) {
          o = ci * 4;
          d[o] = d[o] * 0.32 + 54.4; d[o + 1] = d[o + 1] * 0.32 + 34; d[o + 2] = d[o + 2] * 0.32 + 13.6;    // 갈색 먹선 rgb(80,50,20)을 0.68만큼
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    function px(lon, lat) { return [(lon - lon0) / (lon1 - lon0) * w, (lat1 - lat) / (lat1 - lat0) * h]; }
    // grid (확대하면 더 촘촘하게)
    var step = (lon1 - lon0) > 120 ? 30 : (lon1 - lon0) > 40 ? 10 : 5;
    ctx.strokeStyle = 'rgba(90,60,30,.18)'; ctx.lineWidth = 1;
    for (var gl = Math.ceil(lon0 / step) * step; gl <= lon1; gl += step) { var p0 = px(gl, 0); ctx.beginPath(); ctx.moveTo(p0[0], 0); ctx.lineTo(p0[0], h); ctx.stroke(); }
    for (var gt = Math.ceil(lat0 / step) * step; gt <= lat1; gt += step) { var p1 = px(0, gt); ctx.beginPath(); ctx.moveTo(0, p1[1]); ctx.lineTo(w, p1[1]); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(150,40,30,.3)'; var eq = px(0, 0); ctx.beginPath(); ctx.moveTo(0, eq[1]); ctx.lineTo(w, eq[1]); ctx.stroke();
    return cv;
  };
  /** draws the explored chart. opts: {lon0, lat0, lon1, lat1, marks:[{lon,lat,color,label}], ship:{lon,lat,heading}, labels:true 이면 도시 이름} */
  I.chartCanvas = function (w, h, opts) {
    opts = opts || {};
    var box = { lon0: opts.lon0 != null ? opts.lon0 : -180, lon1: opts.lon1 != null ? opts.lon1 : 180, lat0: opts.lat0 != null ? opts.lat0 : -75, lat1: opts.lat1 != null ? opts.lat1 : 80 };
    var cv = I.chartTerrain(w, h, box), ctx = cv.getContext('2d');
    I.chartOverlay(ctx, w, h, box, opts);
    // vignette border
    var g2 = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.7);
    g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(90,60,20,.35)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
    return cv;
  };
  /** 해도 위의 도시·표식·배 (작은 지도용 — 이름은 labels:true일 때만) */
  I.chartOverlay = function (ctx, w, h, box, opts) {
    var s = S(), lon0 = box.lon0, lon1 = box.lon1, lat0 = box.lat0, lat1 = box.lat1;
    function px(lon, lat) { return [(lon - lon0) / (lon1 - lon0) * w, (lat1 - lat) / (lat1 - lat0) * h]; }
    var fs = Math.max(9, Math.round(w / 110));
    ctx.font = fs + 'px ' + getComputedStyle(document.body).fontFamily;
    s.known.forEach(function (id) {
      var c = G.CITY_DATA[id]; if (!R.cityExists(c)) return;
      var p = px(c.lon, c.lat); if (p[0] < 0 || p[0] > w || p[1] < 0 || p[1] > h) return;
      var visited = s.visited && s.visited[id];
      ctx.fillStyle = visited ? '#7a1e1e' : '#3a2a1a';
      ctx.beginPath(); ctx.arc(p[0], p[1], c.size + 1, 0, 7); ctx.fill();
      if (opts.labels === true && (c.size >= 3 || w > 900)) { ctx.fillStyle = 'rgba(40,25,10,.85)'; ctx.fillText(c.name, p[0] + 4, p[1] - 3); }
    });
    (opts.marks || []).forEach(function (m) {
      var p = px(m.lon, m.lat); ctx.strokeStyle = m.color || '#b01e1e'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(p[0] - 6, p[1] - 6); ctx.lineTo(p[0] + 6, p[1] + 6); ctx.moveTo(p[0] + 6, p[1] - 6); ctx.lineTo(p[0] - 6, p[1] + 6); ctx.stroke();
      if (m.label) { ctx.fillStyle = m.color || '#b01e1e'; ctx.fillText(m.label, p[0] + 8, p[1] + 4); }
    });
    var shipPos = opts.ship || (s.loc.mode !== 'city' ? s.loc : G.CITY_DATA[s.loc.city]);
    I.chartMarks(ctx, px, fs, lon1 - lon0, w, h, shipPos, opts);
    if (shipPos) {
      var sp = px(shipPos.lon, shipPos.lat);
      ctx.fillStyle = '#1e3552'; ctx.strokeStyle = '#f2e7cc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sp[0], sp[1], 5, 0, 7); ctx.fill(); ctx.stroke();
    }
  };
  /** 망루·정찰대가 본 것(? 표식)과 계약 목표 부근 (px: 경위도 → 화면) */
  I.chartMarks = function (ctx, px, fs, spanLon, w, h, shipPos, opts) {
    var s = S();
    opts = opts || {};
    if (!opts.noMarks && G.Explore && shipPos) {
      G.Explore.markers(shipPos.lon, shipPos.lat, 'sea').forEach(function (m) {
        var p = px(m.lon, m.lat); if (p[0] < -20 || p[0] > w + 20 || p[1] < -20 || p[1] > h + 20) return;
        var rr = Math.max(5, m.r / spanLon * w);
        ctx.strokeStyle = 'rgba(40,70,120,.75)'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(30,53,82,.9)'; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(5, fs * 0.6), 0, 7); ctx.fill();
        ctx.fillStyle = '#f2e7cc'; ctx.textAlign = 'center'; ctx.fillText('?', p[0], p[1] + fs * 0.35); ctx.textAlign = 'left';
      });
    }
    if (s.contract && !opts.noTarget && s.contract.task && s.contract.task.kind === 'survey' && !s.contract.task.done) {
      var sv = px(s.contract.task.lon, s.contract.task.lat);
      ctx.strokeStyle = 'rgba(30,80,150,.85)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(sv[0], sv[1], 12, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    if (s.contract && !opts.noTarget) {
      var dd = G.DISC[s.contract.disc];
      if (dd && dd.lon != null && dd.how !== 'trade' && !(dd.lat === 0 && dd.lon === 0) && G.Disc.hasHint(dd.id)) {
        var tp = px(dd.lon, dd.lat);
        ctx.strokeStyle = 'rgba(176,30,30,.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(tp[0], tp[1], 14, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      }
    }
  };
  I.invalidateLand = function () { landRaster = null; };

  // ---------------------------------------------------------------- settings / system
  PAGES.menu = function (el, win) {
    var s = S(), st = s.settings;
    var diffName = { easy: '쉬움', normal: '보통', original: '원작 규칙' }[st.diff] || st.diff;
    el.innerHTML = '<div class="kv" style="grid-template-columns:160px 1fr;align-items:center">' +
      '<div>난이도</div><div>' + diffName + ' <small class="muted">(' + (st.diff === 'original' ? '저장은 모국 도시의 여관에서만' : st.diff === 'easy' ? '어디서나 저장 가능' : '저장은 여관에서') + ')</small></div>' +
      '<div>효과음</div><div><input type="range" min="0" max="100" data-k="sound" value="' + Math.round((st.sound != null ? st.sound : 0.5) * 100) + '"></div>' +
      '<div>음악</div><div><input type="range" min="0" max="100" data-k="music" value="' + Math.round((st.music != null ? st.music : 0.35) * 100) + '"></div>' +
      '<div>화질</div><div class="opt-row"><div class="opt' + ((st.res || 1) < 1 ? ' on' : '') + '" data-res="0.7">빠름</div><div class="opt' + ((st.res || 1) === 1 ? ' on' : '') + '" data-res="1">보통</div></div>' +
      '<div>자동 저장</div><div class="opt-row"><div class="opt' + (st.autosave !== false ? ' on' : '') + '" data-as="1">켬</div><div class="opt' + (st.autosave === false ? ' on' : '') + '" data-as="0">끔</div></div>' +
      '<div>해전 흔들림·번쩍임</div><div class="opt-row"><div class="opt' + (st.shake !== false ? ' on' : '') + '" data-sh="1">켬</div><div class="opt' + (st.shake === false ? ' on' : '') + '" data-sh="0">끔</div></div>' +
      '<div>바다의 방향키</div><div><div class="opt-row"><div class="opt' + (st.keyMode !== 'helm' ? ' on' : '') + '" data-km="dir">방위로 가기</div><div class="opt' + (st.keyMode === 'helm' ? ' on' : '') + '" data-km="helm">손으로 키 잡기</div></div>' +
        '<small class="muted">' + (st.keyMode === 'helm' ? '↑ 누르는 동안 나아감 · ←→ 뱃머리 돌리기 · ↓ 멈춤 · Space 순항/정지' : '↑북 ↓남 ←서 →동(두 키를 함께 누르면 대각선) 쪽으로 계속 감 · Space 정지') + '</small></div>' +
      '</div><div class="sep"></div><div class="flex" style="gap:12px">' +
      (st.diff === 'easy' ? '<button class="btn navy" data-act="save">항해 일지 기록</button>' : '') +
      '<button class="btn" data-act="title">타이틀로 돌아가기</button></div>';
    U.$$('input[type=range]', el).forEach(function (r) { r.oninput = function () { st[r.dataset.k] = r.value / 100; if (G.Audio) G.Audio.setVolume(); }; });
    U.$$('[data-res]', el).forEach(function (o) { o.onclick = function () { st.res = +o.dataset.res; G.Game.fit(); PAGES.menu(el, win); }; });
    U.$$('[data-as]', el).forEach(function (o) { o.onclick = function () { st.autosave = o.dataset.as === '1'; PAGES.menu(el, win); }; });
    U.$$('[data-sh]', el).forEach(function (o) { o.onclick = function () { st.shake = o.dataset.sh === '1'; PAGES.menu(el, win); }; });
    U.$$('[data-km]', el).forEach(function (o) { o.onclick = function () { st.keyMode = o.dataset.km; PAGES.menu(el, win); }; });
    var sv = el.querySelector('[data-act=save]'); if (sv) sv.onclick = async function () { await I.saveMenu(); };
    el.querySelector('[data-act=title]').onclick = async function () {
      if (await UI.confirm('저장하지 않은 진행은 사라집니다. 타이틀로 돌아가겠습니까?')) { win.close(null); UI.fade(function () { G.Game.go('title'); }); }
    };
  };

  I.saveMenu = async function () {
    var opts = [];
    for (var i = 1; i < 4; i++) { var m = G.State.meta(i); opts.push({ label: '일지 ' + i + (m ? ' — ' + U.esc(m.name) + ' · ' + m.date + ' · ' + U.esc(m.place) : ' — (비어 있음)'), value: i, icon: 'book' }); }
    var slot = await UI.choose('항해 일지에 기록', opts, { width: 760 });
    if (slot == null) return false;
    if (G.State.meta(slot) && !(await UI.confirm('일지 ' + slot + '에 덮어쓰겠습니까?'))) return false;
    var r = await G.State.saveAsync(slot);
    if (r.ok && r.where === 'browser') UI.toast('항해 일지에 기록했다.', 'book');
    else if (r.ok) UI.toast('항해 일지에 기록했다. (' + r.msg + ')', 'book', 7000);
    else if (await UI.confirm('기록하지 못했습니다 — ' + r.msg + '<br>지금 진행을 파일로 내려받아 둘까요?', '파일로 내려받기', '그만둔다', '항해 일지')) {
      // 브라우저에 남기지 못했어도 파일로는 남긴다
      var nm = G.State.exportNow();
      UI.toast(nm ? '일지를 내려받았습니다: ' + nm : '내려받지도 못했습니다. 브라우저 설정에서 이 사이트의 저장을 허용해 주십시오.', 'save', 7000);
      return !!nm;
    }
    return r.ok;
  };
})(window.G = window.G || {});
