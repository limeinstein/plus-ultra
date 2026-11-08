/* 조선소: 구입, 매각, 수리, 개조 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art, C = G.Scenes.city;
  function S() { return G.Game.state; }
  var Y = { title: '조선소', icon: 'hammer', paint: 'shipyard' };
  C.B.shipyard = Y;
  function keeper() { return C.npc('shipwright', '조선소 목수'); }

  var SH = function () { return G.Ships; };
  var HANSA = [44, 45, 46, 56, 57, 58, 65], DUTCH = [22, 23, 24], ENGLAND = [38, 39, 40];
  var BARBARY = [81, 82, 83, 85], MED_ISLAM = [78, 118, 121], MED_SPAIN = [9, 11, 12, 13];
  var MALABAR = [151, 152, 154], JAVA = [160, 167, 168, 169], MOLUCCA = [171, 172], NORTH_CN = [177, 189], INCA = [220, 221];
  /** ship types sold in this city (특수선은 조건이 모자라도 목록에 넣고 Y.locked로 막는다) */
  Y.types = function (c) {
    var y = S().date.y, own = R.cityOwner(c), iber = R.iberOwner(own);
    var r = c.region, id = c.id, out = [];
    function add(k) { var t = G.SHIP[k]; if (t && (!t.from || y >= t.from) && out.indexOf(k) < 0) out.push(k); }
    function iberian() { add('barca'); add('caravel'); add('lcaravel'); add('carrack'); if (y >= 1530) add('galleon'); }   // 1520년 이후의 배는 10년 당김 (예전 1540)
    if (r === 0) {
      if (c.rel === 'I') { add('tartane'); add('fusta'); add('galley'); }
      else {
        add('barca'); add('cog'); add('caravel'); add('pinnace'); add('lcaravel'); add('carrack'); add('lcarrack'); if (y >= 1500) add('hcarrack');
        add('galleon'); if (id === 0 || id === 7) add('lgalleon');
        if (MED_SPAIN.indexOf(id) >= 0) { add('tartane'); add('galley'); }
      }
    } else if (r === 1) {
      if (HANSA.indexOf(id) >= 0) { add('cog'); add('hulk'); add('carrack'); add('lcarrack'); add('fluyt'); }
      else {
        add('cog'); add('pinnace'); add('carrack'); add('lcarrack'); if (y >= 1510) add('hcarrack'); if (y >= 1530) add('galleon');   // 북유럽 갤리온: 예전 1540 → 10년 당김
        if (DUTCH.indexOf(id) >= 0) add('fluyt');
        if (DUTCH.indexOf(id) >= 0 || ENGLAND.indexOf(id) >= 0 || c.nation === '프랑스') add('frigate');
      }
    } else if (r === 2) {
      if (BARBARY.indexOf(id) >= 0) { add('fusta'); add('tartane'); add('galley'); add('xebec'); }
      else if (c.rel === 'I' || own === '오스만 제국') { add('fusta'); add('tartane'); add('galley'); add('carrack'); if (id === 112) add('galleass'); }
      else {
        add('tartane'); add('galley'); add('caravel'); add('carrack'); add('lcarrack'); if (y >= 1525) add('galleon');   // 지중해 갤리온: 예전 1535 → 10년 당김
        if (id === 28 || id === 29) add('greatgalley'); if (id === 29) add('galleass');
      }
    } else if (r === 3) {
      if (c.style === 'sw') { add('dhow'); add('sambuk'); }
      else if (BARBARY.indexOf(id) >= 0) { add('fusta'); add('tartane'); }
      if (iber) { add('barca'); add('caravel'); add('carrack'); }
    } else if (r === 4) {
      if (MED_ISLAM.indexOf(id) >= 0) { add('fusta'); add('tartane'); add('galley'); }
      else { add('sambuk'); add('dhow'); add('baghlah'); }
      if (iber) iberian();
    } else if (r === 5) {
      add('dhow'); if (MALABAR.indexOf(id) >= 0) add('parau'); add('baghlah');
      if (iber) { iberian(); add('fusta'); }
    } else if (r === 6) {
      if (c.style === 'kr') { add('maengseon'); add('panokseon'); add('geobukseon'); }
      else { add('junk'); if (NORTH_CN.indexOf(id) >= 0) add('shachuan'); add('ljunk'); add('baochuan'); if (iber) iberian(); }
    } else if (r === 8) {
      if (MOLUCCA.indexOf(id) >= 0) add('korakora');
      else { if (c.rel === 'I') add('dhow'); add('junk'); if (JAVA.indexOf(id) >= 0) add('jong'); }
      if (iber) { iberian(); add('fusta'); }
    } else if (r === 9) { add('kobaya'); add('sekibune'); add('junk'); add('atakebune'); }
    else if (r === 10) {
      if (c.rel === 'N') { if (INCA.indexOf(id) >= 0) add('balsa'); }
      else { add('barca'); add('caravel'); add('pinnace'); add('lcaravel'); add('carrack'); add('galleon'); if (id === 196 || id === 205) add('lgalleon'); }
    }
    // 등급 순으로
    return out.sort(function (a2, b2) { return G.SHIP[a2].lv - G.SHIP[b2].lv; });
  };
  /** 지금 지을 수 없으면 까닭을, 지을 수 있으면 null — 조선 기술 등급 */
  Y.locked = function (c, id) {
    var t = G.SHIP[id], tech = SH().tech(c);
    if (t.lv > tech) return '조선 기술 ' + t.lv + '등급이 되어야 지을 수 있습니다 (지금 ' + tech + '등급 — 「기술 투자」로 올립니다)';
    return null;
  };
  /** 배값: 이 고장 배가 아니면 비싸고, 목재값이 붙고, 목재 시장이 있으면 싸다 */
  Y.priceOf = function (c, id, opt) {
    var t = G.SHIP[id], k = SH().cityYards(c).indexOf(t.cult) >= 0 ? 1 : 1.2;
    if (!opt) { var lw = SH().localWood(c); opt = { k: G.TIMBER[lw.id].price * lw.k }; }
    return Math.round(t.price * k * opt.k * (SH().timberMarket(c) ? 0.92 : 1) * (SH().techBonus(c) ? 0.95 : 1) / 10) * 10;
  };
  function hpWith(t, wid) { return Math.round(t.hp * (G.TIMBER[wid] ? G.TIMBER[wid].hp : 1)); }

  Y.enter = async function (c) { await C.say(keeper(), C.hail(c, 'shipyard', ['어서 오게. 배가 필요한가?', '우리 조선소의 배는 튼튼하기로 소문났지.', '수리할 배가 있으면 맡겨 주게.'])); };
  Y.sub = function () { return '배를 사고팔고 고칩니다'; };
  Y.menu = function (c) {
    var dmg = S().fleet.ships.some(function (s) { return s.hp < s.maxHp; });
    return [
      { label: '구입', icon: 'ship', onClick: function () { return Y.buy(c); } },
      { label: '매각', icon: 'coin', onClick: function () { return Y.sell(c); } },
      { label: '수리', icon: 'tools', sub: dmg ? '손상 있음' : '', onClick: function () { return Y.repair(c); } },
      { label: '개조', icon: 'gear', onClick: function () { return Y.refit(c); } },
      { label: '기함 변경', icon: 'flag', sub: '기함 ' + U.esc(S().fleet.ships[0] ? S().fleet.ships[0].name : '') + '호', dim: S().fleet.ships.length < 2, onClick: function () { return C.B.harbor.changeFlag(); } },   // 항구 「함대편성」의 기함 변경과 같다 (2026-10-31)
      { label: '기술 투자', icon: 'coin', sub: '조선 기술 ' + SH().tech(c) + '등급', onClick: function () { return Y.invest(c); } }
    ];
  };
  Y.panel = function () { return G.Info.fleetPanel(); };

  // ---------------------------------------------------------------- buy
  function woodNote(c) {
    var lw = SH().localWood(c), w = G.TIMBER[lw.id], mk = SH().timberMarket(c), lv = R.investLv(c.id);
    var tb = SH().techBonus(c);
    var h = '<div class="woodnote">' + G.icon('gear') + '조선 기술 <b>' + SH().tech(c) + '등급</b> <small>(기본 ' + SH().techBase(c) + (tb ? ' + 투자 ' + tb + ' · 투자자 할인 5%' : '') + ')</small> · ' +
      G.icon('hammer') + '목재: <b>' + w.name + '</b> <small>(' + SH().woodLine(w) + ')</small>' +
      (mk ? ' · <span class="tag">목재 시장</span> 배값 8% 할인' : '') + ' · 사업 투자 ' + lv + '등급';
    var hint = SH().woodHint(c);
    return h + (hint ? '<div class="muted small">' + hint + '</div>' : '') + '</div>';
  }
  function shipCardHtml(c, id, lw) {
    var t = G.SHIP[id], lock = Y.locked(c, id), foreign = SH().cityYards(c).indexOf(t.cult) < 0;
    return '<div class="shipcard' + (lock ? ' locked' : ' click') + '" data-id="' + id + '"' + (lock ? '' : ' style="cursor:pointer"') + '><div class="pic" data-t="' + id + '"></div><div>' +
      '<div class="flex"><b style="font-size:22px">' + t.name + '</b><span class="muted" style="margin-left:10px;font-size:15px">' + t.feat + '</span><span class="right big-num">' + U.num(Y.priceOf(c, id)) + '<small style="font-size:15px">닢</small></span></div>' +
      '<div class="traits"><span class="trait lvchip">' + t.lv + '등급</span>' + SH().traitChips(t) + '<span class="cult">' + G.SHIP_CULT[t.cult] + '의 배' + (foreign ? ' · 이 고장 배가 아님(값 +20%)' : '') + '</span></div>' +
      '<div class="muted" style="margin:4px 0 8px;font-size:16px">' + t.desc + '</div>' +
      '<div class="kv" style="font-size:16px;grid-template-columns:auto 1fr auto 1fr auto 1fr"><div>적재량</div><div>' + t.cap + '통 <small class="muted" title="처음 다는 사커 대포의 무게를 뺀 실제 짐칸">(짐칸 ' + newShipCap(t) + ')</small></div><div>내구력</div><div>' + hpWith(t, lw) + (hpWith(t, lw) !== t.hp ? ' <small class="muted">(기본 ' + t.hp + ')</small>' : '') + '</div><div>선원</div><div>' + t.crew[0] + '~' + t.crew[1] + '명</div>' +
      '<div>포문</div><div>' + t.ports + '문</div><div>돛</div><div>' + t.sails.map(function (k) { return { sq: '사각', lat: '삼각', bat: '살돛' }[k]; }).join('·') + '</div><div>속도</div><div>' + stars(t.spd) + '</div>' + upwindCell(t) + (t.oar ? '<div>노</div><div>' + stars(t.oar + 0.35) + '</div>' : '') + cabinCell(id) + '</div>' +
      '<div class="muted small">' + G.icon('scroll') + ' 누르면 이 배의 역사와 게임 설정을 봅니다 · 권장 여유자금 약 ' + U.num(Math.round(Y.priceOf(c, id) * G.BALANCE.commerce.operatingReserve)) + '닢 (화물·보급·급료 준비, 실제 비용은 항로·선원에 따라 다릅니다)</div>' +
      (lock ? '<div class="warn-text" style="margin-top:6px">' + G.icon('seal') + lock + '</div>' : '') +
      '</div></div>';
  }
  /** 선실 칸 수 — 기함으로 쓸 때 부하를 둘 방 (지금 기함보다 적으면 붉게) · 2026-11-05 피드백 */
  function cabinCell(id) {
    var CBx = G.Cabins; if (!CBx || !CBx.slotsOf) return '';
    var n = CBx.slotsOf(id), fl = S().fleet.ships[0], m = fl ? CBx.slots(fl) : 0, d = n - m;
    var cmp = !fl ? '' : d < 0 ? ' <small class="warn-text">(기함 ' + U.esc(fl.name) + '호보다 ' + (-d) + '칸 적음)</small>' : d > 0 ? ' <small class="good-text">(기함보다 ' + d + '칸 많음)</small>' : ' <small class="muted">(기함과 같음)</small>';
    return '<div title="기함으로 쓰면 부하를 배치할 방 수 · 종선이면 창고로 고쳐 짐칸을 늘릴 수 있다">선실</div><div>' + n + '칸' + cmp + '</div>';
  }
  Y.buy = async function (c) {
    var s = S(), types = Y.types(c);
    if (!types.length) { await C.say(keeper(), '미안하네, 이 고장에서는 큰 배를 짓지 않네. 수리라면 해 주지.'); return; }
    var picked = null, lw = SH().localWood(c).id;
    var html = woodNote(c) + '<div class="scroll" style="max-height:560px">' + types.map(function (id) { return shipCardHtml(c, id, lw); }).join('') + '</div>';
    // 배를 누르면 도움말(역사·게임 설정) → 「이 배를 산다」를 눌러야 산다. 「다른 배를 본다」면 목록으로 (2026-11-08 사용자 요청)
    for (;;) {
      var win = UI.window({ title: '배 구입 — 소지금 ' + U.num(s.player.gold) + '닢', icon: 'ship', width: 900, html: html, buttons: [{ label: '돌아간다', value: null }],
        onBuild: function (el, w) {
          U.$$('.pic', el).forEach(function (p) { p.appendChild(A.shipCard(p.dataset.t, 220, 120)); });
          U.$$('.shipcard', el).forEach(function (d) { d.style.cursor = 'pointer'; d.onclick = function () { picked = d.dataset.id; w.close('pick'); }; });
        } });
      if ((await win.result) !== 'pick') return;
      if ((await Y.shipHelp(c, picked, { buy: true })) === 'buy') break;
    }
    var t = G.SHIP[picked];
    // 목재 고르기
    var opts = SH().woodOptions(c, picked), opt = opts[0];
    if (opts.length > 1) {
      var HOW = { local: '이 고장 목재', near: '가까운 고장에서 들여옴', world: '먼 나라에서 들여옴', cargo: '싣고 온 목재' };
      var v = await UI.choose(t.name + '에 쓸 목재', opts.map(function (o, i) {
        var w = G.TIMBER[o.id];
        return { label: w.name, right: '금화 ' + U.num(Y.priceOf(c, picked, o)) + '닢', value: i, icon: o.how === 'cargo' ? 'sack' : 'hammer',
          desc: HOW[o.how] + (o.src != null ? ' (산지: ' + G.CITY_DATA[o.src].name + ')' : '') + (o.how === 'cargo' ? ' — 목재 ' + o.need + '통을 쓴다' : '') + ' · 내구력 ' + hpWith(t, o.id) + ' · ' + SH().woodLine(w) + ' — ' + w.desc };
      }), { width: 760, text: '목재에 따라 배의 내구력과 속도, 나중의 수리비가 달라집니다.' });
      if (v == null) return;
      opt = opts[v];
    }
    var price = Y.priceOf(c, picked, opt), wood = G.TIMBER[opt.id];
    if (s.player.gold < price) { await C.say(keeper(), '그렇다면 금화 ' + U.num(price) + '닢 필요하네. 돈이 모자라는군.'); return; }
    // 탐험대가 배에서 멀리 떨어진 항구: 새 배로 여기서 떠날지 — 남겨 둔 배는 2년 안에 찾으러 가지 않으면 폐기 (js/systems/strandfleet.js)
    var far = G.Strand ? G.Strand.farFrom(c) : null;
    if (far) {
      var fv = await C.mateAsk(G.Strand.askText(c, far), [{ label: '새 배를 지어 여기서 떠난다', value: 'go' }, { label: '그만둔다', value: null }]);
      if (fv !== 'go') return;
    }
    // 함대가 가득 차면 새 배는 이 항구 도크로 — 도크도 가득이면 살 수 없다 (js/systems/dock.js)
    if (!far && s.fleet.ships.length >= G.MAX_SHIPS && G.Dock && G.Dock.full(c)) { await C.say(keeper(), '함대도 가득 찼고 이 항구 도크도 ' + G.Dock.note(c) + '로 꽉 찼네. 배를 하나 팔거나 도크에서 빼고 오게나.'); return; }
    if (!(await UI.confirm(wood.name + U.jx(wood.name, '으로/로') + ' 지은 ' + t.name + U.jx(t.name, '을/를') + ' 금화 ' + U.num(price) + '닢에 사겠습니까? (내구력 ' + hpWith(t, opt.id) + ')', '산다', '그만둔다'))) return;
    var name = await UI.prompt('새 배의 이름', U.pick(G.SHIP_NAMES), 12);
    if (!name) name = U.pick(G.SHIP_NAMES);
    s.player.gold -= price;
    if (opt.how === 'cargo') SH().useCargoWood(opt.id, opt.need);
    var sh = R.newShip(picked, name, opt.id); sh.paidPrice = price;
    if (G.ShipSprite) G.ShipSprite.want([sh.type]);
    if (far) {
      await G.Strand.leaveAndBoard(c, sh, far);
      G.State.log(c.name + '에서 ' + wood.name + U.jx(wood.name, '으로/로') + ' 지은 ' + t.name + ' ' + name + '호를 샀다.');
      await C.say(keeper(), '먼 길을 걸어온 사람들이군. 이 배라면 집까지 데려다줄 걸세. 행운을 비네!');
      await C.mate(name + '호로 함대를 새로 꾸렸습니다. 이 항구에서 출항할 수 있습니다 — 보급을 잊지 마십시오. 남겨 둔 배는 ' + Math.round(((G.BALANCE.strand || {}).keepDays || 730) / 365) + '년 안에 찾으러 가면 되찾습니다.');
      return;
    }
    if (s.fleet.ships.length < G.MAX_SHIPS) { s.fleet.ships.push(sh); UI.toast(name + '호가 함대에 편입되었다.', 'ship'); }
    else { G.Dock.put(c, sh); UI.toast(name + '호는 이 항구 도크에 맡겼다. (함대가 가득 참 · ' + G.Dock.note(c) + ')', 'anchor'); }
    G.State.log(c.name + '에서 ' + wood.name + U.jx(wood.name, '으로/로') + ' 지은 ' + t.name + ' ' + name + '호를 샀다.');
    await C.say(keeper(), opt.how === 'local' ? '고맙네! 좋은 배일세. 아껴 주게나.' : '먼 곳의 ' + wood.name + U.jx(wood.name, '으로/로') + ' 지었네. 좋은 나무는 배를 오래 살게 하지.');
  };
  /** 구입 카드의 맞바람 칸: 강함·보통·약함 (사각돛 배는 「개조」로 보강할 수 있다고 알려 준다) */
  function upwindCell(t) {
    if (!R.typeUpwind) return '';
    var u = R.typeUpwind(t.type || t.id, 0), w = R.upwindWord(u), col = w === '강함' ? '#2e6a36' : w === '약함' ? '#8a2a1e' : 'inherit';
    var tip = u.row ? '노를 저어 바람과 상관없이' : w === '약함' ? '사각돛이 많아 맞바람에 느리다 — 「개조」에서 삭구 개량·돛 바꾸기로 보강' : w === '보통' ? '맞바람에 그럭저럭 — 삭구 개량으로 보강' : '삼각돛·살돛으로 맞바람에 강하다';
    return '<div>맞바람</div><div title="' + tip + '" style="color:' + col + '">' + w + (u.row ? ' (노)' : '') + '</div>';
  }
  function stars(v) { var n = Math.round((v - 0.9) / 0.14); n = U.clamp(n, 1, 5); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }

  /* 교체·개조 화면마다 적재량과 내구력을 보인다 (2026-11-08 사용자 요청)
     적재량 = 실제로 짐을 싣는 칸 (R.shipCargoCap: 선체 적재량 − 대포 무게 + 창고). 바뀌는 개조는 「지금 → 바꾼 뒤」로 */
  function storeOf(sh) { return G.Cabins && G.Cabins.storeBonus ? Math.round(G.Cabins.storeBonus(sh)) : 0; }
  function capHp(sh) {
    var st = storeOf(sh);
    return '적재량 <b>' + U.num(R.shipCargoCap(sh)) + '</b>통 <small class="muted">(선체 ' + U.num(sh.cap) + ' − 대포 ' + U.num(Math.round(R.gunLoad(sh))) + (st ? ' + 창고 ' + U.num(st) : '') + ')</small> · 내구력 <b' + (sh.hp < sh.maxHp ? ' class="warn-text"' : '') + '>' + Math.round(sh.hp) + '/' + sh.maxHp + '</b>';
  }
  Y.capHp = capHp;
  /** 고쳐 본 뒤의 적재량: 바뀔 값(patch)을 잠깐 씌워 재고 되돌린다 */
  function capIf(sh, patch) {
    var keep = {}; Object.keys(patch).forEach(function (k) { keep[k] = sh[k]; sh[k] = patch[k]; });
    try { return R.shipCargoCap(sh); } finally { Object.keys(keep).forEach(function (k) { sh[k] = keep[k]; }); }
  }
  function capArrow(a, b) { return a === b ? '적재량 ' + U.num(a) + '통 그대로' : '적재량 ' + U.num(a) + ' → <b class="' + (b < a ? 'warn-text' : 'good-text') + '">' + U.num(b) + '</b>통'; }
  function hpArrow(sh, to) { return to == null || to === sh.maxHp ? '내구력 ' + Math.round(sh.hp) + '/' + sh.maxHp + ' 그대로' : '내구력 ' + sh.maxHp + ' → <b class="' + (to < sh.maxHp ? 'warn-text' : 'good-text') + '">' + to + '</b>'; }
  /** 새 배가 처음 다는 대포(사커 4문)를 뺀 실제 짐칸 — R.newShip과 같은 셈 */
  function newShipCap(t) { var g = G.CANNON.saker; return Math.max(0, Math.floor(t.cap - Math.min(4, t.ports) * (g ? g.load : 1))); }

  /* ---------------------------------------------------------------- 배 도움말 (2026-11-08 사용자 요청)
     조선소 「배 구입」에서 배를 누르면 — 그 배의 역사 이야기(js/data/shiphist.js)와 게임 설정(js/data/ships.js의 수치)을 함께 보인다.
     「개조」의 배 메뉴에도 「이 배 도움말」. opt: {buy: 구입 단추를 보일지, sh: 가진 배(지금 상태도 함께)} → 'buy' | null */
  Y.shipHelp = function (c, id, opt) {
    opt = opt || {};
    var t = G.SHIP[id], h = (G.SHIP_HIST || {})[id] || {}, lw = c ? SH().localWood(c).id : null, sh = opt.sh;
    var sailNm = function (k) { return { sq: '사각돛', lat: '삼각돛', bat: '대나무 살 돛' }[k] || k; };
    var startPorts = Math.min(t.ports, Math.max(4, Math.round(t.ports * 0.5)));
    var when = t.from || t.to ? (t.from ? t.from + '년부터' : '') + (t.to ? (t.from ? ' ' : '') + t.to + '년까지' : '') : '처음부터';
    var row = function (k, v) { return '<div>' + k + '</div><div>' + v + '</div>'; };
    var kv = '<div class="kv shiphelp-kv" style="font-size:16px;grid-template-columns:auto 1fr auto 1fr">' +
      row('등급', t.lv + '등급 <small class="muted">(조선 기술 ' + t.lv + '등급 이상)</small>') + row('문화권', G.SHIP_CULT[t.cult] + '의 배 <small class="muted">(다른 문화권 조선소는 수리비가 비싸다)</small>') +
      row('나오는 때', when) + row('파는 곳', U.esc(t.where || '—')) +
      row('적재량', t.cap + '통 <small class="muted">(처음 다는 사커 ' + Math.min(4, t.ports) + '문을 빼면 짐칸 ' + newShipCap(t) + '통)</small>') +
      row('내구력', t.hp + (lw && hpWith(t, lw) !== t.hp ? ' <small class="muted">(이 조선소 목재로는 ' + hpWith(t, lw) + ')</small>' : '') + ' <small class="muted">— 목재에 따라 달라진다</small>') +
      row('선원', t.crew[0] + '~' + t.crew[1] + '명') + row('포문', '최대 ' + t.ports + '문 <small class="muted">(새 배는 ' + startPorts + '문)</small>') +
      row('돛', t.sails.map(sailNm).join(' · ') + ' <small class="muted">(돛대 최대 ' + t.maxMast + ')</small>') + row('속도', stars(t.spd) + ' <small class="muted">(' + t.spd.toFixed(2) + '°/일)</small>') +
      (t.oar ? row('노', stars(t.oar + 0.35) + ' <small class="muted">(' + t.oar.toFixed(2) + '°/일 — 바람이 없어도)</small>') : '') + row('선회', '×' + t.turn) +
      upwindCell(t) + cabinCell(id) +
      (c ? row('값', '금화 ' + U.num(Y.priceOf(c, id)) + '닢 <small class="muted">(이 조선소)</small>') : row('기본 값', '금화 ' + U.num(t.price) + '닢')) +
      '</div>';
    var traits = t.traits.length ? '<div class="shiphelp-traits" style="font-size:15px;line-height:1.6;margin-top:8px">' + t.traits.map(function (k) { var d = G.SHIP_TRAITS[k]; return d ? '<div><span class="trait">' + d.name + '</span> ' + d.desc + '</div>' : ''; }).join('') + '</div>' : '';
    var now = sh ? '<div class="woodnote" style="margin-top:10px">' + G.icon('ship') + ' <b>' + U.esc(sh.name) + '호</b> 지금 — ' + capHp(sh) + ' · ' + ((G.CANNON[sh.guns.type] || {}).name || '대포') + ' ' + sh.guns.n + '/' + sh.ports + '문</div>' : '';
    var html = '<div class="shiphelp" style="display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:start">' +
      '<div><div class="pic" data-t="' + id + '"></div><div class="traits" style="margin-top:6px"><span class="trait lvchip">' + t.lv + '등급</span>' + SH().traitChips(t) + '</div>' +
      '<div class="muted" style="font-size:15px;margin-top:6px">' + U.esc(t.feat || '') + '</div></div>' +
      '<div><h3 style="margin:0 0 4px">역사' + (h.era ? ' <small class="muted" style="font-weight:400">' + h.era + '</small>' : '') + '</h3>' +
      '<div style="font-size:17px;line-height:1.65">' + (h.hist || t.desc) + '</div>' +
      (h.known ? '<div style="font-size:16px;line-height:1.6;margin-top:6px">' + G.icon('scroll') + ' ' + h.known + '</div>' : '') + '</div></div>' +
      '<h3 style="margin:14px 0 4px">게임에서</h3><div class="muted" style="font-size:16px;margin-bottom:6px">' + t.desc + '</div>' + kv + traits + now;
    var lock = opt.buy && c ? Y.locked(c, id) : null;
    var btns = (opt.buy && !lock ? [{ label: '이 배를 산다', value: 'buy', cls: 'primary' }] : []).concat([{ label: opt.buy ? '다른 배를 본다' : '닫기', value: null }]);
    var win = UI.window({ title: '배 도움말 — ' + t.name, icon: 'ship', width: 940, html: '<div class="scroll" style="max-height:620px">' + html + (lock ? '<div class="warn-text" style="margin-top:8px">' + G.icon('seal') + lock + '</div>' : '') + '</div>', buttons: btns,
      onBuild: function (el) { U.$$('.pic', el).forEach(function (pc) { pc.appendChild(A.shipCard(pc.dataset.t, 300, 165)); }); } });
    return win.result;
  };

  // ---------------------------------------------------------------- 기술 투자 (공업 투자)
  Y.invest = async function (c) {
    var s = S(), SHp = SH(), tech = SHp.tech(c), next = SHp.techNext(c);
    var types = Y.types(c), nextShips = types.filter(function (id) { return G.SHIP[id].lv === tech + 1; }).map(function (id) { return G.SHIP[id].name; });
    var head = '이 조선소의 기술은 ' + tech + '등급일세 (기본 ' + SHp.techBase(c) + '등급, 지금까지 들어온 투자 금화 ' + U.num(SHp.techAmt(c)) + '닢).';
    if (next == null) { await C.say(keeper(), head + ' ' + (tech >= 5 ? '이 이상은 어느 조선소도 짓지 못하는 배들뿐이지.' : '더 투자해도 이 조선소가 오를 수 있는 끝일세.')); return; }
    var nextGear = Y.gearAt(tech + 1);
    await C.say(keeper(), head + ' 금화 ' + U.num(next) + '닢을 더 대 주면 도크를 넓히고 장인을 불러 ' + (tech + 1) + '등급 배를 지을 수 있네.' + (nextShips.length ? ' (' + nextShips.join('·') + ')' : ' 다만 이 고장에서 짓는 배 가운데 그 등급 배는 아직 없네.') +
      (nextGear ? ' 주물장과 목각장도 늘어 ' + nextGear + '도 만들 수 있게 되지.' : ''));
    if (s.player.gold < 1000) { await C.say(keeper(), '투자는 금화 1,000닢부터 받네.'); return; }
    var remaining = SHp.techRemaining(c), max = Math.min(Math.floor(s.player.gold / 1000), Math.ceil(remaining / 1000));
    var n = await UI.number({ title: '조선 기술 투자 (천 닢 단위)', min: 1, max: max, value: Math.min(max, Math.ceil(next / 1000)), unit: '천 닢',
      text: '한 단위는 금화 1,000닢입니다. 이 조선소의 마지막 등급까지 필요한 금액만 받습니다.',
      info: function (k) { var amt = Math.min(k * 1000, remaining), a = SHp.techAmt(c) + amt, b = 0; for (var i = 1; i < SHp.TECH_INV.length; i++) if (a >= SHp.TECH_INV[i]) b = i; return '금화 ' + U.num(amt) + '닢 → 조선 기술 ' + Math.min(5, SHp.techBase(c) + b) + '등급 · 남는 돈 ' + U.num(s.player.gold - amt) + '닢'; } });
    if (typeof n !== 'number' || !isFinite(n) || n !== Math.floor(n) || n < 1 || n > max) return;
    var amt = Math.min(n * 1000, SHp.techRemaining(c));
    if (amt <= 0) return;
    if (!(await UI.confirm(c.name + ' 조선소에 금화 ' + U.num(amt) + '닢을 투자하겠습니까? (투자 후 소지금 ' + U.num(s.player.gold - amt) + '닢)', '투자한다', '그만둔다'))) return;
    if (s.player.gold < amt) { await C.say(keeper(), '투자할 돈이 모자라는군.'); return; }
    s.player.gold -= amt;
    var up = SHp.techInvest(c, amt);
    G.Fame.add('tr', Math.round(amt / 2000));
    if (up > 0) {
      var now = SHp.tech(c), opened = Y.types(c).filter(function (id) { var lv = G.SHIP[id].lv; return lv > tech && lv <= now; }).map(function (id) { return G.SHIP[id].name; });
      G.State.log(c.name + ' 조선소에 금화 ' + U.num(amt) + '닢을 투자했다. 조선 기술 ' + now + '등급.');
      var gear = []; for (var lv = tech + 1; lv <= now; lv++) { var gl = Y.gearAt(lv); if (gl) gear.push(gl); }
      await C.say(keeper(), '고맙네! 이제 ' + now + '등급 배까지 지을 수 있네.' + (opened.length ? ' ' + opened.join('·') + U.jx(opened[opened.length - 1], '을/를') + ' 주문해 보게.' : '') +
        (gear.length ? ' 개조에서 ' + gear.join(', ') + '도 달아 주겠네.' : ''));
    } else {
      UI.toast(c.name + ' 조선소에 금화 ' + U.num(amt) + '닢을 투자했다.' + (SHp.techNext(c) != null ? ' (다음 등급까지 ' + U.num(SHp.techNext(c)) + '닢)' : ''), 'coin');
    }
  };

  // ---------------------------------------------------------------- sell
  Y.sell = async function (c) {
    var s = S(), dock = C.B.harbor.moored(c);
    var list = s.fleet.ships.slice(1).concat(dock).filter(function (x) { return !x.loan; });
    if (!list.length) { await C.say(keeper(), s.fleet.ships.some(function (x) { return x.loan; }) && s.fleet.ships.length > 1 ? '빌린 배는 팔 수 없네. 주인에게 돌려줘야 할 배 아닌가.' : s.fleet.ships.length ? '기함까지 팔면 자네는 뭘 타고 다니려나? 팔 수 있는 배가 없네.' : '팔 배가 없지 않은가.'); return; }
    var i = await UI.choose('매각할 배', list.map(function (sh, k) { return { label: U.esc(sh.name) + '호 (' + G.SHIP[sh.type].name + ')', right: '금화 ' + U.num(R.shipValue(sh)) + '닢', value: k, icon: 'ship' }; }), { width: 640 });
    if (i == null) return;
    var sh = list[i], v = R.shipValue(sh);
    if (!(await UI.confirm(sh.name + '호를 금화 ' + U.num(v) + '닢에 팔겠습니까?', '판다', '그만둔다'))) return;
    var fi = s.fleet.ships.indexOf(sh); if (fi >= 0) s.fleet.ships.splice(fi, 1); else dock.splice(dock.indexOf(sh), 1);
    if (G.FigFx) G.FigFx.salvage(sh);   // 유물·전설 선수상은 떼어 돌려받는다
    s.player.gold += v;
    C.B.harbor.trimCrew();
    UI.toast(sh.name + '호를 팔았다. (금화 ' + U.num(v) + '닢)', 'coin');
  };

  // ---------------------------------------------------------------- repair
  /** 수리비: 낯선 문화권의 배는 비싸고, 목재·꿰맨 선체에 따라 달라진다 */
  function repairCost(sh, c) {
    if (!c || typeof c !== 'object') c = S().loc.city != null ? G.CITY_DATA[S().loc.city] : null;
    return Math.ceil((sh.maxHp - sh.hp) * G.SHIP[sh.type].price / sh.maxHp * 0.32 * SH().repairK(sh, c));
  }
  Y.repairCost = repairCost;
  Y.repair = async function (c) {
    var s = S(), list = s.fleet.ships.concat(C.B.harbor.moored(c)).filter(function (sh) { return sh.hp < sh.maxHp; });
    if (!list.length) { await C.say(keeper(), '고칠 곳이 하나도 없군. 좋은 상태일세.'); return; }
    var rc = function (sh) { return repairCost(sh, c); };
    var tot = U.sum(list, rc);
    var odd = list.filter(function (sh) { return SH().cityYards(c).indexOf(G.SHIP[sh.type].cult) < 0; });
    var opts = [{ label: '전부 수리', right: '금화 ' + U.num(tot) + '닢', value: -1, icon: 'tools' }].concat(list.map(function (sh, i) { var w = SH().wood(sh); return { label: U.esc(sh.name) + '호', right: Math.round(sh.hp) + '/' + sh.maxHp + ' · 금화 ' + U.num(rc(sh)) + '닢', value: i, icon: 'ship', desc: G.SHIP[sh.type].name + (w ? ' · ' + w.name : '') + (odd.indexOf(sh) >= 0 ? ' · 이 고장에 낯선 배라 수리비 1.5배' : '') + (SH().has(sh, 'sewn') ? ' · 꿰맨 선체라 수리가 싸다' : '') }; }));
    var v = await UI.choose('수리', opts, { width: 660, text: odd.length ? '이 조선소 목수들은 ' + odd.map(function (sh) { return G.SHIP_CULT[G.SHIP[sh.type].cult]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join('·') + ' 배에 익숙하지 않아 수리비가 더 듭니다.' : '' });
    if (v == null) return;
    var targets = v === -1 ? list : [list[v]], cost = U.sum(targets, rc);
    if (s.player.gold < cost) { await C.say(keeper(), '그거라면 금화 ' + U.num(cost) + '닢 필요하네. 돈이 모자라는군.'); return; }
    s.player.gold -= cost; targets.forEach(function (sh) { sh.hp = sh.maxHp; });
    await C.say(keeper(), '완벽하게 수리했네. 새 배나 다름없을 걸세.');
  };

  // ---------------------------------------------------------------- refit
  Y.refit = async function (c) {
    var s = S();
    var list = s.fleet.ships.concat(C.B.harbor.moored(c));
    if (!list.length) return;
    // 여러 척 한꺼번에 개조 (2026-11-04 사용자 요청 — 종선도 같이 강화해야 함대 속력이 떨어지지 않는다)
    var own = list.filter(function (x) { return !x.loan; });
    // 배마다 지금 개조 상태를 수첩 「함대」 표처럼 자세히 (2026-11-07 사용자 요청): 선종·선장·목재·내구·적재·대포·돛·삭구·선수상 + 특징
    var i = await UI.choose('개조할 배', (own.length >= 2 ? [{ label: '여러 척 한꺼번에 개조', right: '돛 · 대포 · 삭구', value: -1, icon: 'gear', desc: '배를 골라 같은 개조를 한 번에 합니다' }] : []).concat(list.map(function (x, k) {
      return { label: U.esc(x.name) + '호', right: G.SHIP[x.type].name + ' · 내구 ' + Math.round(x.hp) + '/' + x.maxHp, value: k, cls: 'yship', html: shipRow(x, s, list) };
    })), { width: 1260, head: YHEAD, cls: 'yships' });
    if (i == null) return;
    if (i === -1) return Y.batch(c);
    var sh = list[i];
    if (sh.loan) { await C.say(keeper(), '빌린 배는 함부로 뜯어고칠 수 없네. 돌려줄 때 원래 모습 그대로여야 하지 않겠나. 수리라면 해 주지.'); return; }
    for (;;) {
      var t = G.SHIP[sh.type];
      var v = await UI.choose(sh.name + '호 개조', [
        { label: '대포', right: (G.CANNON[sh.guns.type] || {}).name + ' ' + sh.guns.n + '/' + sh.ports + '문', value: 'gun', icon: 'cannon' },
        { label: '돛', right: sh.sails.map(function (k) { return { sq: '사각', lat: '삼각', bat: '살돛' }[k] || k; }).join('·'), value: 'sail', icon: 'sail' },
        { label: '삭구 개량 (맞바람)', right: rigLabel(sh), value: 'rig', icon: 'gear' },
        { label: '포문 증설', right: sh.ports + '/' + t.ports + '문', value: 'port', icon: 'plus', disabled: sh.ports >= t.ports },
        { label: '선수상', right: sh.fig ? G.FIGUREHEAD[sh.fig].name : '없음', value: 'fig', icon: 'feather', thumb: G.Img.figureheadSrc(sh.fig), desc: sh.fig && G.FigFx ? G.FigFx.short(G.FIGUREHEAD[sh.fig]) : '' },
        { label: '선체 다시 짓기 (목재)', right: (SH().wood(sh) || { name: '보통 목재' }).name, value: 'wood', icon: 'hammer' },
        { label: '선명 변경', right: sh.name, value: 'name', icon: 'scroll' },
        { label: '이 배 도움말', right: t.name + '의 역사와 설정', value: 'help', icon: 'book' }
      ].concat(sh === s.fleet.ships[0] && G.CabinView ? [{ label: '선실 개조', right: '선실 ' + (G.Cabins.rooms().length - 1) + '칸', value: 'cabin', icon: 'bed' }]
        : G.Cabins && G.Cabins.setStore ? [{ label: '선실 → 창고 개조', right: '창고 ' + G.Cabins.storeCount(sh) + '/' + G.Cabins.slots(sh) + '칸 · 짐칸 +' + U.num(G.Cabins.otherStoreBonus(sh, G.Cabins.storeCount(sh))) + '통', value: 'store', icon: 'chest',
            desc: '기함이 아닌 배의 선실을 창고로 고쳐 짐칸을 늘린다 (한 칸마다 적재량의 ' + Math.round(storeK().per * 100) + '%). 창고로 고친 칸에는 부하가 머물지 않는다.' }] : []), { width: 640, text: capHp(sh) + '<br>소지금 ' + U.num(s.player.gold) + '닢' });
      if (v == null) return;
      if (v === 'help') { await Y.shipHelp(c, sh.type, { sh: sh }); continue; }
      if (v === 'cabin') await G.CabinView.open({ yard: c });
      else if (v === 'store') await refitStore(c, sh);
      else if (v === 'gun') await refitGuns(c, sh);
      else if (v === 'sail') await refitSails(c, sh);
      else if (v === 'rig') await refitRig(c, sh);
      else if (v === 'port') await refitPorts(c, sh);
      else if (v === 'fig') await refitFig(c, sh);
      else if (v === 'wood') await refitWood(c, sh);
      else if (v === 'name') { var nm = await UI.prompt('새 이름', sh.name, 12); if (nm) { sh.name = nm; UI.toast('선명을 ' + nm + '호로 바꾸었다.', 'scroll'); } }
    }
  };
  /* 「개조할 배」 목록의 한 줄 — 수첩 「함대」 표(js/ui/info.js PAGES.fleet)와 같은 칸에 삭구를 더했다. 둘째 줄은 배의 특징과 맡긴 곳·창고 */
  var YHEAD = '<div class="yhead"><span>선명</span><span>선종</span><span>선장</span><span>목재</span><span class="n">내구력</span><span class="n">적재량</span><span>대포</span><span>돛</span><span>삭구</span><span>선수상</span></div>';
  var SAIL_MARK = { sq: '□', lat: '△', bat: '▤' };
  function shipRow(sh, s, list) {
    var t = G.SHIP[sh.type], w = SH().wood(sh), fig = sh.fig && G.FIGUREHEAD[sh.fig], inFleet = s.fleet.ships.indexOf(sh) >= 0;
    var tag = sh === s.fleet.ships[0] ? '<span class="tag">기함</span>' : !inFleet ? '<span class="tag">계류</span>' : sh.loan ? '<span class="tag">빌린 배</span>' : '';
    var gun = G.CANNON[sh.guns.type] || {}, sails = sh.sails.map(function (k) { return SAIL_MARK[k] || '?'; }).join('');
    var sailTitle = sh.sails.map(function (k) { return { sq: '사각', lat: '삼각', bat: '살돛' }[k] || k; }).join(' · ');
    var hurt = sh.hp < sh.maxHp;
    var extra = [];
    if (sh.ports < t.ports) extra.push('포문 ' + sh.ports + '/' + t.ports + '문 (늘릴 수 있음)');
    if (G.Cabins && G.Cabins.storeCount && sh !== s.fleet.ships[0] && G.Cabins.storeCount(sh)) extra.push('선실 창고 ' + G.Cabins.storeCount(sh) + '/' + G.Cabins.slots(sh) + '칸');
    if (w) extra.push(w.name + ' — ' + SH().woodLine(w));
    return '<div class="yrow">' +
      '<span class="nm">' + tag + '<b>' + U.esc(sh.name) + '</b></span>' +
      '<span>' + t.name + '</span>' +
      '<span>' + U.esc(inFleet ? R.captainName(sh) : '—') + '</span>' +
      '<span' + (w ? ' title="' + U.esc(w.name + ' — ' + SH().woodLine(w)) + '"' : '') + '>' + (w ? w.name : '<span class="muted">—</span>') + '</span>' +
      '<span class="n' + (hurt ? ' warn-text' : '') + '">' + Math.round(sh.hp) + '/' + sh.maxHp + '</span>' +
      '<span class="n">' + U.num(R.shipCargoCap(sh)) + '</span>' +
      '<span>' + (gun.name || '대포') + ' ' + sh.guns.n + '/' + sh.ports + '</span>' +
      '<span class="sl" title="' + sailTitle + '">' + sails + '</span>' +
      '<span title="' + U.esc('삭구 개량: ' + rigLabel(sh)) + '">' + rigLabel(sh) + '</span>' +
      '<span' + (fig && G.FigFx ? ' title="' + U.esc(G.FigFx.plain(fig)) + '"' : '') + '>' + (fig ? fig.name + (fig.legend ? ' ★' : '') : '—') + '</span>' +
      '</div><div class="traits ysub">' + SH().traitChips(sh) + '<span class="cult">' + (t.feat || '') + '</span>' +
      (extra.length ? '<span class="yx">' + extra.join(' · ') + '</span>' : '') + '</div>';
  }
  // ---------------------------------------------------------------- 여러 척 한꺼번에 개조 (2026-11-04 사용자 요청)
  // 개조 → 「여러 척 한꺼번에 개조」: 배를 골라(빌린 배는 빠진다) 돛 · 대포 · 삭구를 한 번에. 배마다 값을 보여 주고 한 번 묻는다.
  // 할 수 없는 배(조선 기술이 모자람 · 짐이 너무 많음 · 다 해 둠)는 까닭을 적고 건너뛴다. 값은 한 척씩 개조할 때와 같다.
  function sailTxt(sh) { return sh.sails.map(function (k) { return { sq: '사각', lat: '삼각', bat: '살돛' }[k] || k; }).join('·'); }
  function gunTxt(sh) { return ((G.CANNON[sh.guns.type] || {}).name || '대포') + ' ' + sh.guns.n + '/' + sh.ports + '문'; }
  Y.batch = async function (c) {
    var s = S(), all = s.fleet.ships.concat(C.B.harbor.moored(c)).filter(function (x) { return !x.loan; });
    if (all.length < 2) return;
    var sel = all.map(function () { return true; });
    for (;;) {
      var html = '<div class="muted" style="font-size:16px;margin-bottom:8px">개조할 배를 고르고 아래 단추를 누르십시오. 고른 배 모두에 같은 개조를 합니다. 종선도 함께 손보아야 함대가 가장 느린 배에 발이 묶이지 않습니다. (빌린 배는 뺍니다)</div>' +
        '<table class="tbl"><tr><th></th><th>선명</th><th>선종</th><th>돛</th><th>대포</th><th>삭구</th></tr>' +
        all.map(function (sh, k) {
          var tag = sh === s.fleet.ships[0] ? ' <span class="tag">기함</span>' : s.fleet.ships.indexOf(sh) < 0 ? ' <span class="tag">계류</span>' : '';
          return '<tr class="click" data-i="' + k + '"><td class="pick"><input type="checkbox" class="ypick" data-i="' + k + '"' + (sel[k] ? ' checked' : '') + '></td><td><b>' + U.esc(sh.name) + '</b>' + tag + '</td><td>' + G.SHIP[sh.type].name + '</td><td>' + sailTxt(sh) + '</td><td>' + gunTxt(sh) + '</td><td>' + rigLabel(sh) + '</td></tr>';
        }).join('') + '</table>';
      var need = function () { if (!sel.some(Boolean)) { UI.toast('개조할 배를 하나 이상 고르십시오.', 'info'); return false; } };
      var v = await UI.window({ title: '여러 척 한꺼번에 개조 — 소지금 ' + U.num(s.player.gold) + '닢', icon: 'gear', width: 940, html: html, buttons: [
        { label: '돛 일괄 변경', value: 'sail', onClick: need }, { label: '대포 일괄 변경', value: 'gun', onClick: need }, { label: '삭구 일괄 개량', value: 'rig', onClick: need }, { label: '선실 → 창고', value: 'store', onClick: need }, { label: '돌아간다', value: null, cls: 'navy' }],
        onBuild: function (el) {
          U.$$('.ypick', el).forEach(function (cb) { cb.onclick = function (e) { e.stopPropagation(); sel[+cb.dataset.i] = cb.checked; }; });
          U.$$('tr.click', el).forEach(function (tr) { tr.onclick = function () { var k = +tr.dataset.i, cb = tr.querySelector('.ypick'); sel[k] = !sel[k]; cb.checked = sel[k]; }; });
        } }).result;
      if (!v) return;
      var ships = all.filter(function (x, k) { return sel[k]; });
      if (!ships.length) continue;
      if (v === 'sail') await batchSails(c, ships); else if (v === 'gun') await batchGuns(c, ships); else if (v === 'rig') await batchRig(c, ships); else if (v === 'store') await batchStore(c, ships);
    }
  };
  /** 배마다 할 일을 보여 주고 묻는다 — lines: [{sh, text, cost, skip}] */
  function planConfirm(title, lines) {
    var tot = U.sum(lines, function (l) { return l.skip ? 0 : l.cost; });
    var body = lines.map(function (l) { return (l.skip ? '<span class="muted">· ' : '· ') + '<b>' + U.esc(l.sh.name) + '호</b> — ' + l.text + (l.skip ? '</span>' : (l.cost > 0 ? ' · 금화 ' + U.num(l.cost) + '닢' : l.cost < 0 ? ' · 환급 ' + U.num(-l.cost) + '닢' : '')); }).join('<br>');
    return { tot: tot, ask: function () { return UI.confirm('<b>' + title + '</b><br>' + body + '<br><br>' + (tot >= 0 ? '모두 금화 <b>' + U.num(tot) + '</b>닢' : '모두 환급 <b>' + U.num(-tot) + '</b>닢') + ' · 소지금 ' + U.num(S().player.gold) + '닢', '개조한다', '그만둔다'); } };
  }
  async function batchDone(title, done, skipped) {
    UI.toast(title + ' — ' + done.length + '척' + (skipped.length ? ' (' + skipped.length + '척 건너뜀)' : ''), 'gear', 4200);
    if (skipped.length) await C.mate(skipped.join('<br>'));
    else if (done.length) await C.say(keeper(), U.pick(['다 됐네. 함대가 한 몸처럼 움직일 걸세.', '모두 손봤네. 이제 느린 배 때문에 기다릴 일은 줄겠지.', '한꺼번에 하니 일꾼들도 신이 났다네.']));
  }
  async function batchSails(c, ships) {
    var s = S(), price = 300, kinds = sailKinds(c);
    var choices = kinds.slice(); if (kinds.indexOf('lat') >= 0) choices.push('mix');
    function want(sh, i, k) { return k === 'mix' ? (i === 0 && sh.sails.length > 1 ? 'lat' : 'sq') : k; }
    function count(sh, k) { var n = 0; sh.sails.forEach(function (x, i) { if (x !== want(sh, i, k)) n++; }); return n; }
    var k = await UI.choose('돛 일괄 변경 — ' + ships.length + '척 (1개 ' + price + '닢)', choices.map(function (x) {
      var n = U.sum(ships, function (sh) { return count(sh, x); });
      return { label: x === 'mix' ? '앞 돛대는 삼각돛, 나머지는 사각돛' : '모든 돛대를 ' + G.SAIL_NAME[x] + U.jx(G.SAIL_NAME[x], '으로/로'), right: n ? n + '개 · 금화 ' + U.num(n * price) + '닢' : '이미 모두 그렇다',
        value: x, icon: 'sail', disabled: !n, desc: x === 'mix' ? '순풍과 맞바람의 절충 — 돛대가 하나뿐인 배는 사각돛' : '' };
    }), { width: 680, text: '사각돛은 순풍에서 빠르고, 삼각돛은 옆바람과 맞바람에 강합니다.' + (kinds.length > 2 ? ' 대나무 살 돛은 그 사이입니다.' : '') });
    if (!k) return;
    var lines = ships.map(function (sh) { var n = count(sh, k); return { sh: sh, n: n, cost: n * price, skip: !n, text: n ? sailTxt(sh) + ' → ' + sh.sails.map(function (x, i) { return { sq: '사각', lat: '삼각', bat: '살돛' }[want(sh, i, k)]; }).join('·') : '바꿀 돛이 없다' }; });
    var pc = planConfirm('돛 일괄 변경', lines);
    if (pc.tot > s.player.gold) { await C.say(keeper(), '금화 ' + U.num(pc.tot) + '닢 필요하네. 돈이 모자라는군.'); return; }
    if (!(await pc.ask())) return;
    var done = [];
    lines.forEach(function (l) { if (l.skip) return; l.sh.sails = l.sh.sails.map(function (x, i) { return want(l.sh, i, k); }); s.player.gold -= l.cost; done.push(l.sh); });
    await batchDone('돛을 바꾸었다', done, []);
  }
  function gunCost(sh, ty, n) {
    var g = G.CANNON[ty], old = G.CANNON[sh.guns.type], cur = sh.guns.n;
    var refund = function (x) { return old ? Math.floor(old.price * 0.5 * x) : 0; };
    return ty === sh.guns.type ? Math.max(0, n - cur) * g.price - (n < cur ? refund(cur - n) : 0) : n * g.price - refund(cur);
  }
  async function batchGuns(c, ships) {
    var s = S();
    var ty = await UI.choose('대포 일괄 변경 — ' + ships.length + '척', G.CANNONS.map(function (g) {
      var ok = Y.gunOk(c, g);
      return { label: g.name + ((g.lv || 1) > 1 ? ' <span class="tag">기술 ' + g.lv + '</span>' : ''), right: ok ? '1문 ' + g.price + '닢 · 사정 ' + g.range + ' · 위력 ' + g.dmg + ' · 무게 ' + g.load : '조선 기술 ' + g.lv + '등급 필요',
        value: g.id, desc: g.desc, icon: 'cannon', disabled: !ok };
    }), { width: 760, text: '고른 배 모두에 같은 대포를 답니다. 떼어낸 대포는 반값에 사들입니다. 이 조선소의 조선 기술은 ' + SH().tech(c) + '등급입니다.' });
    if (!ty) return;
    var g = G.CANNON[ty], maxP = Math.max.apply(null, ships.map(function (sh) { return sh.ports; }));
    var mode = await UI.choose(g.name + ' — 배마다 몇 문', [
      { label: '포문을 가득 채운다', right: '배마다 포문 수만큼', value: 'full', icon: 'cannon' },
      { label: '지금 탑재한 수 그대로 종류만 바꾼다', value: 'same', icon: 'cannon' },
      { label: '수를 정한다', right: '포문보다 많으면 포문 수만큼', value: 'num', icon: 'cannon' }], { width: 620 });
    if (!mode) return;
    var fix = null;
    if (mode === 'num') { fix = await UI.number({ title: g.name + ' — 배마다 몇 문', min: 0, max: maxP, value: maxP, unit: '문' }); if (fix == null) return; }
    var lines = ships.map(function (sh) {
      var n = mode === 'full' ? sh.ports : mode === 'same' ? Math.min(sh.ports, sh.guns.n) : Math.min(sh.ports, fix);
      var same = ty === sh.guns.type && n === sh.guns.n;
      return { sh: sh, n: n, cost: same ? 0 : gunCost(sh, ty, n), skip: same, text: same ? '이미 ' + g.name + ' ' + n + '문' : gunTxt(sh) + ' → ' + g.name + ' ' + n + '/' + sh.ports + '문 · ' + capArrow(R.shipCargoCap(sh), capIf(sh, { guns: { type: ty, n: n } })) };
    });
    if (lines.every(function (l) { return l.skip; })) { UI.toast('바꿀 배가 없습니다.', 'info'); return; }
    var pc = planConfirm('대포 일괄 변경', lines);
    if (pc.tot > s.player.gold) { await C.say(keeper(), '금화 ' + U.num(pc.tot) + '닢 필요하네. 돈이 모자라는군.'); return; }
    if (!(await pc.ask())) return;
    var done = [], skipped = [];
    lines.forEach(function (l) {
      if (l.skip) return;
      var sh = l.sh, capAfter = Math.floor(sh.cap - l.n * g.load);
      if (s.fleet.ships.indexOf(sh) >= 0 && R.used() > R.fleetCap() - R.shipCargoCap(sh) + Math.max(0, capAfter)) { skipped.push(sh.name + '호 — 짐이 너무 많아 대포를 더 실을 수 없습니다.'); return; }
      if (l.cost > s.player.gold) { skipped.push(sh.name + '호 — 돈이 모자랍니다.'); return; }
      s.player.gold -= l.cost; sh.guns = { type: ty, n: l.n }; done.push(sh);
    });
    await batchDone(g.name + U.jx(g.name, '을/를') + ' 달았다', done, skipped);
  }
  function rigPrice(sh, i) { return Math.round(G.SHIP[sh.type].price * rigTiers()[i].cost / 10) * 10; }
  async function batchRig(c, ships) {
    var s = S(), T = rigTiers(), tech = SH().tech(c);
    var mode = await UI.choose('삭구 일괄 개량 — ' + ships.length + '척', [
      { label: '한 단씩 올린다', value: 'one', icon: 'gear' },
      { label: '이 조선소에서 할 수 있는 데까지 올린다', right: '조선 기술 ' + tech + '등급', value: 'max', icon: 'gear' }], { width: 640,
      text: '바람을 거슬러 오르는 힘을 키웁니다(앞삼각돛 → 돛 재단·밧줄 → 용골). 사각돛이 많은 배일수록 효과가 큽니다. 값은 배값에 따라 다릅니다.' });
    if (!mode) return;
    var lines = ships.map(function (sh) {
      var from = sh.rig || 0, to = from, cost = 0, why = '';
      while (to < T.length) {
        if (tech < T[to].lv) { why = (to + 1) + '단은 조선 기술 ' + T[to].lv + '등급 필요'; break; }
        cost += rigPrice(sh, to); to++;
        if (mode === 'one') break;
      }
      if (from >= T.length) why = '다 해 둠';
      var capTo = sh.cap; for (var ri = from; ri < to; ri++) if (T[ri].cap) capTo = Math.round(capTo * (1 + T[ri].cap));
      return { sh: sh, from: from, to: to, cost: cost, skip: to === from, text: to === from ? why : rigLabel(sh) + ' → ' + to + '단 · ' + T[to - 1].name + (why && mode === 'max' ? ' (' + why + ')' : '') + (capTo !== sh.cap ? ' · ' + capArrow(R.shipCargoCap(sh), capIf(sh, { cap: capTo })) : '') };
    });
    if (lines.every(function (l) { return l.skip; })) { await C.say(keeper(), '고른 배들은 이 조선소에서 더 손볼 삭구가 없네. ' + (lines[0] ? lines[0].text : '')); return; }
    var pc = planConfirm('삭구 일괄 개량', lines);
    if (pc.tot > s.player.gold) { await C.say(keeper(), '금화 ' + U.num(pc.tot) + '닢 필요하네. 돈이 모자라는군.'); return; }
    if (!(await pc.ask())) return;
    var done = [], skipped = [];
    lines.forEach(function (l) {
      if (l.skip) return;
      var sh = l.sh;
      for (var i = l.from; i < l.to; i++) {
        var r = T[i], price = rigPrice(sh, i);
        if (price > s.player.gold) { skipped.push(sh.name + '호 — ' + (i + 1) + '단: 돈이 모자랍니다.'); break; }
        if (r.cap) {
          var capAfter = Math.round(sh.cap * (1 + r.cap));
          if (s.fleet.ships.indexOf(sh) >= 0 && R.used() > R.fleetCap() - R.shipCargoCap(sh) + Math.max(0, capAfter - R.gunLoad(sh))) { skipped.push(sh.name + '호 — ' + (i + 1) + '단: 짐이 너무 많아 용골에 바닥짐을 더 실을 수 없습니다.'); break; }
          sh.cap = capAfter;
        }
        s.player.gold -= price; sh.rig = i + 1; sh.rigPaid = (sh.rigPaid || 0) + price;
      }
      if ((sh.rig || 0) > l.from) done.push(sh);
    });
    await batchDone('삭구를 개량했다', done, skipped);
  }
  Y._batch = { sails: batchSails, guns: batchGuns, rig: batchRig, gunCost: gunCost };   // 시험용

  /** 이 조선소에서 부어 달 수 있는 대포인가 — 조선 기술 등급(기술 투자로 오른다)이 대포의 lv 이상이어야 한다 */
  Y.gunOk = function (c, g) { return (g.lv || 1) <= SH().tech(c); };
  /** 조선 기술 lv등급이 되면 새로 달 수 있는 대포·선수상 이름 (투자 안내용) */
  Y.gearAt = function (lv) {
    var g = G.CANNONS.filter(function (x) { return (x.lv || 1) === lv; }).map(function (x) { return x.name; });
    var f = G.FIGUREHEADS.filter(function (x) { return !x.rare && !x.relic && (x.lv || 1) === lv; }).map(function (x) { return x.name; });
    return lv > 1 ? g.concat(f).join('·') : '';
  };
  async function refitGuns(c, sh) {
    var s = S(), tech = SH().tech(c);
    var more = G.CANNONS.filter(function (g) { return !Y.gunOk(c, g); });
    var cap0 = R.shipCargoCap(sh), n0 = Math.min(sh.ports, sh.guns.n || 4);
    var ty = await UI.choose('대포 종류', G.CANNONS.map(function (g) {
      var ok = Y.gunOk(c, g), mine = g.id === sh.guns.type;
      return { label: g.name + ((g.lv || 1) > 1 ? ' <span class="tag">기술 ' + g.lv + '</span>' : '') + (mine ? ' <span class="tag">지금</span>' : ''),
        right: (ok || mine ? '1문 ' + g.price + '닢 · 사정 ' + g.range + ' · 위력 ' + g.dmg + ' · 무게 ' + g.load : '조선 기술 ' + g.lv + '등급 필요') + ' · <span title="' + n0 + '문을 달 때의 적재량">적재 ' + U.num(capIf(sh, { guns: { type: g.id, n: n0 } })) + '통</span>',
        value: g.id, desc: g.desc + (!ok && mine ? ' — 이 조선소에서는 줄이거나 떼어낼 수만 있다' : '') + ' · ' + n0 + '문이면 ' + capArrow(cap0, capIf(sh, { guns: { type: g.id, n: n0 } })).replace(/<[^>]+>/g, ''), icon: 'cannon', disabled: !ok && !mine };
    }), { width: 760, text: sh.name + '호 — ' + capHp(sh) + '<br>같은 종류로 수를 바꾸거나 다른 종류로 바꿔 달 수 있습니다. 떼어낸 대포는 반값에 사들입니다. 대포가 무거울수록 짐칸이 줄어듭니다 (오른쪽 「적재」는 ' + n0 + '문을 달 때).' +
      (more.length ? ' 이 조선소의 조선 기술은 <b>' + tech + '등급</b> — 「기술 투자」로 올리면 ' + more.map(function (g) { return g.name; }).join('·') + U.jx(more[more.length - 1].name, '을/를') + ' 부어 달 수 있습니다.' : '') });
    if (!ty) return;
    var g = G.CANNON[ty], old = G.CANNON[sh.guns.type];
    var refund = function (n) { return old ? Math.floor(old.price * 0.5 * n) : 0; };
    var n = await UI.number({ title: g.name + ' 탑재 수', min: 0, max: Y.gunOk(c, g) ? sh.ports : sh.guns.n, value: ty === sh.guns.type ? sh.guns.n : Math.min(sh.ports, sh.guns.n || 4), unit: '문',
      info: function (k) {
        var cost = ty === sh.guns.type ? Math.max(0, k - sh.guns.n) * g.price - (k < sh.guns.n ? refund(sh.guns.n - k) : 0) : k * g.price - refund(sh.guns.n);
        return (cost >= 0 ? '비용 ' + U.num(cost) : '환급 ' + U.num(-cost)) + '닢 · ' + capArrow(R.shipCargoCap(sh), capIf(sh, { guns: { type: ty, n: k } })) + ' · ' + hpArrow(sh);
      } });
    if (n == null) return;
    var cost = ty === sh.guns.type ? Math.max(0, n - sh.guns.n) * g.price - (n < sh.guns.n ? refund(sh.guns.n - n) : 0) : n * g.price - refund(sh.guns.n);
    if (cost > s.player.gold) { await C.say(keeper(), '돈이 모자라는군.'); return; }
    var capAfter = Math.floor(sh.cap - n * g.load);
    var usedNow = R.used(), capNow = R.fleetCap();
    if (S().fleet.ships.indexOf(sh) >= 0 && usedNow > capNow - R.shipCargoCap(sh) + Math.max(0, capAfter)) { await C.mate('제독, 짐이 너무 많아서 대포를 더 실을 수 없습니다.'); return; }
    s.player.gold -= cost; sh.guns = { type: ty, n: n };
    UI.toast(sh.name + '호에 ' + g.name + ' ' + n + '문을 탑재했다.', 'cannon');
  }
  /** 이 조선소에서 달 수 있는 돛: 동아시아 조선소는 대나무 살 돛도 단다 */
  function sailKinds(c) { var y = SH().cityYards(c); return y.indexOf('ea') >= 0 || y.indexOf('sa') >= 0 ? ['sq', 'lat', 'bat'] : ['sq', 'lat']; }
  async function refitSails(c, sh) {
    var s = S(), price = 300, kinds = sailKinds(c);
    for (;;) {
      var opts = sh.sails.map(function (k, i) { var nx = kinds[(kinds.indexOf(k) + 1) % kinds.length] || 'sq'; return { label: (i + 1) + '번 돛대', right: G.SAIL_NAME[k] + ' → ' + G.SAIL_NAME[nx], value: i, icon: 'sail' }; });
      var i = await UI.choose('돛 바꾸기 (1개 ' + price + '닢)', opts, { width: 620, text: sh.name + '호 — ' + capHp(sh) + ' <small class="muted">(돛을 바꿔도 그대로)</small><br>사각돛은 순풍에서 빠르고, 삼각돛은 옆바람과 맞바람에 강합니다.' + (kinds.length > 2 ? ' 대나무 살 돛은 그 사이 — 어느 바람에나 무난하고 폭풍에 빨리 줄일 수 있습니다.' : '') });
      if (i == null) return;
      if (s.player.gold < price) { await C.say(keeper(), '돈이 모자라는군.'); return; }
      var cur = kinds.indexOf(sh.sails[i]);
      s.player.gold -= price; sh.sails[i] = kinds[(cur + 1) % kinds.length] || 'sq';
      UI.toast((i + 1) + '번 돛대를 ' + G.SAIL_NAME[sh.sails[i]] + U.jx(G.SAIL_NAME[sh.sails[i]], '으로/로') + ' 바꾸었다.', 'sail');
    }
  }
  /** 삭구 개량 단계 이름 */
  function rigTiers() { return (G.BALANCE && G.BALANCE.rigging) || []; }
  function rigLabel(sh) { var n = sh.rig || 0, T = rigTiers(); return n ? n + '단 · ' + T[n - 1].name : '안 함'; }
  /** 맞바람 속력 비교 글: 지금 → 개량 뒤 (돛·삭구가 같은 배 종류 기준) */
  function upTxt(sh, lvl) {
    var t = G.SHIP[sh.type], sails = sh.sails, tk = R.tackK ? R.tackK() : 0.92, up = 0;
    for (var th = 25; th <= 75; th += 10) { var rad = th * Math.PI / 180, rel = Math.PI - rad; up = Math.max(up, t.spd * (1 + (sh.spdMod || 0)) * R.sailThrust(sails, rel) * R.rigK(sails, lvl, rel) * Math.cos(rad) * tk); }
    return (up * 0.846).toFixed(2);
  }
  /** 삭구 개량 (G.BALANCE.rigging): 한 단씩 차례로 — 앞삼각돛 → 돛 재단·밧줄 → 용골 */
  async function refitRig(c, sh) {
    var s = S(), t = G.SHIP[sh.type], T = rigTiers(), tech = SH().tech(c);
    for (;;) {
      var n = sh.rig || 0;
      var opts = T.map(function (r, i) {
        var price = Math.round(t.price * r.cost / 10) * 10, done = i < n, next = i === n, lock = next && tech < r.lv;
        var capTxt = r.cap ? ' · 적재 ' + (next ? U.num(R.shipCargoCap(sh)) + '→' + U.num(capIf(sh, { cap: Math.round(sh.cap * (1 + r.cap)) })) + '통' : (r.cap > 0 ? '+' : '') + Math.round(r.cap * 100) + '%') : '';
        return { label: (i + 1) + '단 · ' + r.name, right: (done ? '해 둠' : next ? (lock ? '조선 기술 ' + r.lv + '등급 필요' : '금화 ' + U.num(price) + '닢') : '앞 단계를 먼저') + capTxt,
          value: i, icon: done ? 'check' : 'gear', disabled: !next || lock,
          desc: r.desc + (r.cap ? ' (적재량 ' + Math.round(r.cap * 100) + '%' + (next ? ' — ' + capArrow(R.shipCargoCap(sh), capIf(sh, { cap: Math.round(sh.cap * (1 + r.cap)) })) : '') + ')' : '') + (next ? ' — 맞바람 속력 ' + upTxt(sh, n) + ' → ' + upTxt(sh, n + 1) + '°/일 (무역풍 세기)' : '') };
      });
      var i = await UI.choose(sh.name + '호 삭구 개량', opts, { width: 720,
        text: sh.name + '호 — ' + capHp(sh) + '<br>바람을 거슬러 오르는 힘을 키웁니다. 사각돛이 많은 배일수록 효과가 크고(삼각돛·살돛뿐인 배는 절반), 순풍 속력은 그대로입니다. 이 조선소의 조선 기술은 ' + tech + '등급입니다. 소지금 ' + U.num(s.player.gold) + '닢.' });
      if (i == null) return;
      var r = T[i], price = Math.round(t.price * r.cost / 10) * 10;
      if (i !== (sh.rig || 0)) return;
      if (s.player.gold < price) { await C.say(keeper(), '금화 ' + U.num(price) + '닢 필요하네. 돈이 모자라는군.'); return; }
      if (r.cap) {
        var capAfter = Math.round(sh.cap * (1 + r.cap));
        if (S().fleet.ships.indexOf(sh) >= 0 && R.used() > R.fleetCap() - R.shipCargoCap(sh) + Math.max(0, capAfter - R.gunLoad(sh))) { await C.mate('제독, 짐이 너무 많아 용골에 바닥짐을 더 실을 수 없습니다. 짐을 조금 내린 뒤에 하십시오.'); return; }
        sh.cap = capAfter;
      }
      s.player.gold -= price; sh.rig = i + 1; sh.rigPaid = (sh.rigPaid || 0) + price;
      UI.toast(sh.name + '호: ' + r.name + ' — 삭구 ' + sh.rig + '단', 'gear');
      await C.say(keeper(), U.pick(['다 됐네. 이제 바람을 안고도 제법 버틸 걸세.', '단단히 손봤네. 맞바람에서 차이를 느낄 게야.', '좋은 배가 더 좋아졌군. 바람이 앞에서 불어도 겁낼 것 없네.']));
    }
  }
  /** 선체 다시 짓기: 다른 목재로 판자를 갈아 내구력을 바꾼다 */
  async function refitWood(c, sh) {
    var s = S(), t = G.SHIP[sh.type];
    if (SH().cityYards(c).indexOf(t.cult) < 0) { await C.say(keeper(), t.name + U.jx(t.name, '은/는') + ' 우리가 다뤄 본 적 없는 배일세. 선체를 뜯어 다시 짓는 건 그 배를 짓는 고장에 가서 하게.'); return; }
    var opts = SH().woodOptions(c, sh.type).filter(function (o) { return o.id !== sh.wood; });
    if (!opts.length) { await C.say(keeper(), '지금 쓰는 목재 말고는 들일 나무가 없네. ' + SH().woodHint(c)); return; }
    var cost = function (o) { return Math.round(t.price * 0.4 * o.k / 10) * 10; };
    var v = await UI.choose(sh.name + '호 선체 다시 짓기', opts.map(function (o, i) {
      var w = G.TIMBER[o.id], hp = Math.round(t.hp * w.hp);
      return { label: w.name, right: '금화 ' + U.num(cost(o)) + '닢 · ' + hpArrow(sh, hp), value: i, icon: o.how === 'cargo' ? 'sack' : 'hammer', desc: SH().woodLine(w) + (o.how === 'cargo' ? ' · 싣고 온 목재 ' + o.need + '통' : '') + ' — ' + w.desc };
    }), { width: 720, text: sh.name + '호 — ' + capHp(sh) + ' <small class="muted">(적재량은 목재와 상관없이 그대로)</small><br>판자를 모두 갈아 다시 짓습니다. 배값의 40% 정도가 듭니다. 지금 손상은 비율대로 남습니다.' });
    if (v == null) return;
    var o = opts[v], w = G.TIMBER[o.id], price = cost(o);
    if (s.player.gold < price) { await C.say(keeper(), '금화 ' + U.num(price) + '닢 필요하네. 돈이 모자라는군.'); return; }
    s.player.gold -= price;
    if (o.how === 'cargo') SH().useCargoWood(o.id, o.need);
    var old = SH().wood(sh), ratio = sh.hp / sh.maxHp;
    sh.spdMod = (sh.spdMod || 0) - (old ? old.spd : 0) + w.spd;
    sh.maxHp = Math.max(1, Math.round(t.hp * w.hp)); sh.hp = Math.max(1, Math.round(sh.maxHp * ratio)); sh.wood = o.id;
    UI.toast(sh.name + '호를 ' + w.name + U.jx(w.name, '으로/로') + ' 다시 지었다. (내구력 ' + sh.maxHp + ')', 'hammer');
  }
  // ---------------------------------------------------------------- 기함이 아닌 배의 선실 → 창고 (2026-11-05 피드백 — 대항해시대4처럼)
  // 한 칸마다 값 G.CABIN.store.cost, 공사 날 store.days × storeOther.daysK. 창고를 빈 선실로 되돌리는 것은 값이 들지 않는다.
  // 기함은 「선실 개조」 화면에서 방마다 고친다 (창고는 4칸까지 센다). 이 배가 나중에 기함이 되면 창고 칸은 그대로 창고다.
  function storeK() { var b = (G.BALANCE.cabins || {}), o = b.storeOther || {}, c0 = G.CABIN.store || {}; return { per: o.per != null ? o.per : 0.03, cost: c0.cost || 1200, days: (c0.days || 2) * (o.daysK != null ? o.daysK : 0.5) }; }
  function storeDays(n) { return n > 0 ? Math.max(1, Math.ceil(n * storeK().days)) : 0; }
  /** 창고를 to칸으로 맞추면: 값·날·짐칸 변화·쫓겨날 부하 수 */
  function storePlan(sh, to) {
    var CBx = G.Cabins, cur = CBx.storeCount(sh), add = Math.max(0, to - cur), k = storeK();
    var dCap = CBx.otherStoreBonus(sh, to) - CBx.otherStoreBonus(sh, cur);
    var lodgers = G.CrewAuto ? G.CrewAuto.crewOf(sh).cabin.length : 0, berths = CBx.slots(sh) - to;
    return { cur: cur, to: to, add: add, cost: add * k.cost, days: storeDays(add), dCap: dCap, out: Math.max(0, lodgers - berths) };
  }
  function storeApply(list) {
    var s = S(), days = 0;
    list.forEach(function (x) { G.Cabins.setStore(x.sh, x.p.to); s.player.gold -= x.p.cost; days = Math.max(days, x.p.days); });
    if (R.tidyCaptains) R.tidyCaptains();
    if (G.CrewAuto && G.CrewAuto.refresh) G.CrewAuto.refresh();
    G.Game.refreshHud && G.Game.refreshHud();
    return days;
  }
  async function refitStore(c, sh) {
    var s = S(), CBx = G.Cabins, N = CBx.slots(sh), cur = CBx.storeCount(sh), k = storeK();
    if (sh === s.fleet.ships[0]) return;
    var n = await UI.number({ title: sh.name + '호 — 선실을 창고로 (한 칸 ' + U.num(k.cost) + '닢)', min: 0, max: N, value: N, unit: '칸',
      text: G.SHIP[sh.type].name + '의 선실 ' + N + '칸 가운데 몇 칸을 창고로 쓸지 정하십시오. 지금 창고 ' + cur + '칸.<br><small class="muted">창고 한 칸마다 짐칸이 적재량(' + U.num(G.SHIP[sh.type].cap) + '통)의 ' + Math.round(k.per * 100) + '%씩 늡니다. 무게 한도는 그대로입니다. 창고로 고친 칸에는 부하가 머물지 않고, 창고를 빈 선실로 되돌리는 데는 돈이 들지 않습니다.</small>',
      info: function (v) { var p = storePlan(sh, v); return capArrow(R.shipCargoCap(sh), R.shipCargoCap(sh) + p.dCap) + ' · ' + (p.cost ? '금화 ' + U.num(p.cost) + '닢 · 공사 ' + p.days + '일' : '비용 없음') + (p.out ? ' · <span class="warn-text">이 배 선실의 부하 ' + p.out + '명은 대기로</span>' : ''); } });
    if (n == null || n === cur) return;
    var p = storePlan(sh, n);
    if (s.player.gold < p.cost) { await C.say(keeper(), '돈이 모자라는군.'); return; }
    if (p.dCap < 0 && R.used() > R.fleetCap() + p.dCap) { await C.say(keeper(), '짐이 꽉 차 있어 창고를 뜯어낼 수 없네. 짐을 ' + U.num(Math.ceil(R.used() - R.fleetCap() - p.dCap)) + '통 덜어 내고 오게.'); return; }
    if (p.cost && !(await UI.confirm(sh.name + '호의 선실 ' + p.add + '칸을 창고로 고치겠습니까? (금화 ' + U.num(p.cost) + '닢 · 공사 ' + p.days + '일 · 짐칸 +' + U.num(p.dCap) + '통)', '고친다', '그만둔다'))) return;
    var days = storeApply([{ sh: sh, p: p }]);
    if (days) await UI.fade(function () { G.Game.passDays(days); });
    UI.toast(sh.name + '호 — 창고 ' + n + '/' + N + '칸 · 짐칸 ' + (p.dCap >= 0 ? '+' : '') + U.num(p.dCap) + '통', 'chest', 4200);
    if (p.add) await C.say(keeper(), U.pick(['칸막이를 걷어 내고 선반을 짰네. 이제 그 배는 통째로 짐배일세.', '선실 자리에 고정 끈과 선반을 달았네. 짐이 꽤 더 들어갈 걸세.']));
  }
  async function batchStore(c, ships) {
    var s = S(), list = ships.filter(function (sh) { return sh !== s.fleet.ships[0]; });
    var lines = ships.map(function (sh) {
      if (sh === s.fleet.ships[0]) return { sh: sh, cost: 0, skip: true, text: '기함은 「선실 개조」에서 방마다 고친다' };
      var p = storePlan(sh, G.Cabins.slots(sh));
      return { sh: sh, p: p, cost: p.cost, skip: !p.add, text: p.add ? '선실 ' + p.add + '칸 → 창고 (창고 ' + p.to + '칸) · 짐칸 +' + U.num(p.dCap) + '통 · ' + p.days + '일' + (p.out ? ' · 부하 ' + p.out + '명 대기로' : '') : '이미 모든 선실이 창고' };
    });
    var todo = lines.filter(function (l) { return !l.skip; });
    if (!todo.length) { await C.say(keeper(), list.length ? '고른 배들은 선실이 이미 모두 창고일세.' : '기함의 선실은 「선실 개조」에서 방마다 고치게.'); return; }
    var pc = planConfirm('선실 → 창고 — 기함이 아닌 배의 선실을 모두 창고로', lines);
    if (s.player.gold < pc.tot) { await C.say(keeper(), '돈이 모자라는군. 모두 금화 ' + U.num(pc.tot) + '닢이 드네.'); return; }
    if (!(await pc.ask())) return;
    var days = storeApply(todo);
    if (days) await UI.fade(function () { G.Game.passDays(days); });
    await batchDone('선실 → 창고', todo.map(function (l) { return l.sh; }), []);
  }
  async function refitPorts(c, sh) {
    var s = S(), t = G.SHIP[sh.type], price = 250;
    var n = await UI.number({ title: '포문 증설 (1문 ' + price + '닢)', text: sh.name + '호 — ' + capHp(sh) + '<br><small class="muted">포문만 뚫으면 적재량은 그대로 — 대포를 달면 그 무게만큼 줄어든다</small>', min: 1, max: t.ports - sh.ports, value: Math.min(2, t.ports - sh.ports), unit: '문', info: function (k) { return '비용 ' + U.num(k * price) + '닢 · 포문 ' + sh.ports + ' → ' + (sh.ports + k) + '문'; } });
    if (!n) return;
    if (s.player.gold < n * price) { await C.say(keeper(), '돈이 모자라는군.'); return; }
    s.player.gold -= n * price; sh.ports += n; UI.toast('포문을 ' + n + '문 늘렸다.', 'plus');
  }
  async function refitFig(c, sh) {
    var s = S(), tech = SH().tech(c);
    // 조선 기술 등급(기술 투자로 오른다)이 선수상의 lv 이상이면 깎아 준다 — 대포와 같다 (2026-10-29). 그 위 등급은 잠긴 채 보인다
    var shop = G.FIGUREHEADS.filter(function (f) { return !f.rare && !f.relic; });
    var sold = shop.filter(function (f) { return (f.lv || 1) <= tech; });
    var later = shop.filter(function (f) { return (f.lv || 1) > tech; });
    sold.sort(function (a, b) { return (b.lv || 1) - (a.lv || 1) || a.price - b.price; });   // 기술 투자로 늘어난 선수상을 위에
    later.sort(function (a, b) { return (a.lv || 1) - (b.lv || 1) || a.price - b.price; });
    // 소지품의 유물 선수상도 달 수 있다
    var FX = G.FigFx, ll = function (f) { return FX ? FX.labelLine(f) : ''; }, tip = function (f) { return f.desc + (FX ? ' — ' + FX.plain(f) : ''); };
    var mine = s.player.items.map(function (it, i) { return { it: it, i: i }; }).filter(function (x) { var f0 = G.FIGUREHEAD[x.it.id]; return f0 && (f0.relic || f0.legend); });
    if (!sold.length && !mine.length && !sh.fig) { await C.say(keeper(), '지금은 선수상이 하나도 없네.'); return; }
    var opts = mine.map(function (x, k) { var f = G.FIGUREHEAD[x.it.id]; return { label: f.name + (f.legend ? (FX ? FX.tag(f) : '') : ' <span class="tag">' + (f.great ? '위대한 발견' : '소지품 · 유물') + '</span>') + (R.isProof(x.it) ? ' <span class="tag">증거</span>' : '') + ll(f), right: '달기 150닢', value: 'my' + k, desc: tip(f), icon: 'feather', thumb: G.Img.figureheadSrc(f) }; })
      .concat(sold.map(function (f) { return { label: f.name + ((f.lv || 1) > 1 ? ' <span class="tag">기술 ' + f.lv + '</span>' : ''), right: U.num(f.price) + '닢', value: f.id, desc: tip(f), icon: 'feather', thumb: G.Img.figureheadSrc(f) }; }).map(function (o, i) { o.label += ll(sold[i]); return o; }))
      .concat(later.map(function (f) { return { label: f.name + ' <span class="tag">기술 ' + f.lv + '</span>' + ll(f), right: '조선 기술 ' + f.lv + '등급 필요', value: '_lock', desc: tip(f), icon: 'feather', thumb: G.Img.figureheadSrc(f), disabled: true }; }))
      .concat(sh.fig ? [{ label: '선수상 떼어내기', value: '_off', icon: 'tools', thumb: G.Img.figureheadSrc(sh.fig), desc: FX && FX.keepable(G.FIGUREHEAD[sh.fig]) ? (G.FIGUREHEAD[sh.fig].legend ? '전설' : '유물') + ' 선수상은 떼어 소지품으로 돌려받는다' : '' }] : []);
    var v = await UI.choose('선수상', opts, { width: 720, text: '선수상은 배를 지켜 주는 수호상입니다. 배마다 하나씩 달 수 있습니다.' + (sh.fig ? ' 지금: <b>' + G.FIGUREHEAD[sh.fig].name + '</b>' + (FX ? ' <small>(' + FX.short(G.FIGUREHEAD[sh.fig]) + ')</small>' : '') : '') +
      '<br><small class="muted">여러 배에 달면 같은 효과는 가장 큰 것 하나가 그대로, 다른 배의 것은 ¼만 더해집니다. 속력만은 단 배에만 붙습니다. ★ 전설의 선수상은 전설의 바다 괴물을 무찌르면 건집니다.</small>' +
      (later.length ? '<br><small class="muted">이 조선소의 조선 기술은 <b>' + tech + '등급</b> — 「기술 투자」로 올리면 ' + later.length + '가지 선수상을 더 깎을 수 있습니다' + (later.some(function (f) { return f.lv === tech + 1; }) ? ' (다음 등급: ' + later.filter(function (f) { return f.lv === tech + 1; }).map(function (f) { return f.name; }).join('·') + ')' : '') + '</small>' : '') });
    if (!v || v === '_lock') return;
    if (v === '_off') { if (!(await takeOffFig(sh))) return; UI.toast('선수상을 떼어냈다.', 'tools'); return; }
    if (String(v).indexOf('my') === 0) {
      var x = mine[+String(v).slice(2)], rf = G.FIGUREHEAD[x.it.id];
      if (s.player.gold < 150) { await C.say(keeper(), '다는 품삯 150닢은 받아야겠네.'); return; }
      if (R.isProof(x.it) && !(await UI.confirm(rf.name + U.jx(rf.name, '은/는') + ' 아직 보고·발표하지 않은 「' + G.DISC[x.it.disc].name + '」 발견의 증거입니다. 배에 달면 증거로 내보일 수 없습니다. 그래도 달겠습니까?', '단다', '그만둔다'))) return;
      if (sh.fig && !(await takeOffFig(sh))) return;
      s.player.items.splice(s.player.items.indexOf(x.it), 1);
      s.player.gold -= 150; sh.fig = rf.id;
      UI.toast(sh.name + '호에 ' + rf.name + U.jx(rf.name, '을/를') + ' 달았다.', 'feather', 4200);
      return;
    }
    var f = G.FIGUREHEAD[v];
    if (s.player.gold < f.price) { await C.say(keeper(), '돈이 모자라는군.'); return; }
    if (sh.fig && !(await takeOffFig(sh))) return;
    s.player.gold -= f.price; sh.fig = v; UI.toast(sh.name + '호에 ' + f.name + U.j(f.name, '을/를').slice(f.name.length) + ' 달았다. ' + (FX ? FX.short(f) : f.desc), 'feather');
  }
  /** 달린 선수상을 뗀다. 유물 선수상은 소지품으로 돌려받는다 (칸이 없으면 묻는다) */
  async function takeOffFig(sh) {
    var f = G.FIGUREHEAD[sh.fig];
    if (f && (f.relic || f.legend)) {
      if (R.itemsFull()) { if (!(await UI.confirm('소지품이 가득 차서 ' + f.name + U.jx(f.name, '을/를') + ' 돌려받을 자리가 없습니다. 버리겠습니까? (다시 구할 수 없는 유물입니다)', '버린다', '그만둔다'))) return false; }
      else { R.addItem(f.id, f.relic ? { disc: f.relic, done: true } : null); UI.toast(f.name + U.jx(f.name, '을/를') + ' 소지품으로 돌려받았다.', { src: G.Img.itemSrc(f.id), icon: 'chest' }); }
    }
    sh.fig = null; return true;
  }
})(window.G = window.G || {});

