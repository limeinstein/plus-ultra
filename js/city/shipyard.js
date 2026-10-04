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
    function iberian() { add('barca'); add('caravel'); add('lcaravel'); add('carrack'); if (y >= 1540) add('galleon'); }
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
        add('cog'); add('pinnace'); add('carrack'); add('lcarrack'); if (y >= 1510) add('hcarrack'); if (y >= 1540) add('galleon');
        if (DUTCH.indexOf(id) >= 0) add('fluyt');
        if (DUTCH.indexOf(id) >= 0 || ENGLAND.indexOf(id) >= 0 || c.nation === '프랑스') add('frigate');
      }
    } else if (r === 2) {
      if (BARBARY.indexOf(id) >= 0) { add('fusta'); add('tartane'); add('galley'); add('xebec'); }
      else if (c.rel === 'I' || own === '오스만 제국') { add('fusta'); add('tartane'); add('galley'); add('carrack'); if (id === 112) add('galleass'); }
      else {
        add('tartane'); add('galley'); add('caravel'); add('carrack'); add('lcarrack'); if (y >= 1535) add('galleon');
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

  Y.enter = async function (c) { await C.say(keeper(), U.pick(['어서 오게. 배가 필요한가?', '우리 조선소의 배는 튼튼하기로 소문났지.', '수리할 배가 있으면 맡겨 주게.'])); };
  Y.sub = function () { return '배를 사고팔고 고칩니다'; };
  Y.menu = function (c) {
    var dmg = S().fleet.ships.some(function (s) { return s.hp < s.maxHp; });
    return [
      { label: '구입', icon: 'ship', onClick: function () { return Y.buy(c); } },
      { label: '매각', icon: 'coin', onClick: function () { return Y.sell(c); } },
      { label: '수리', icon: 'tools', sub: dmg ? '손상 있음' : '', onClick: function () { return Y.repair(c); } },
      { label: '개조', icon: 'gear', onClick: function () { return Y.refit(c); } },
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
      '<div class="kv" style="font-size:16px;grid-template-columns:auto 1fr auto 1fr auto 1fr"><div>적재량</div><div>' + t.cap + '통</div><div>내구력</div><div>' + hpWith(t, lw) + (hpWith(t, lw) !== t.hp ? ' <small class="muted">(기본 ' + t.hp + ')</small>' : '') + '</div><div>선원</div><div>' + t.crew[0] + '~' + t.crew[1] + '명</div>' +
      '<div>포문</div><div>' + t.ports + '문</div><div>돛</div><div>' + t.sails.map(function (k) { return { sq: '사각', lat: '삼각', bat: '살돛' }[k]; }).join('·') + '</div><div>속도</div><div>' + stars(t.spd) + '</div>' + (t.oar ? '<div>노</div><div>' + stars(t.oar + 0.35) + '</div>' : '') + '</div>' +
      (lock ? '<div class="warn-text" style="margin-top:6px">' + G.icon('seal') + lock + '</div>' : '') +
      '</div></div>';
  }
  Y.buy = async function (c) {
    var s = S(), types = Y.types(c);
    if (!types.length) { await C.say(keeper(), '미안하네, 이 고장에서는 큰 배를 짓지 않네. 수리라면 해 주지.'); return; }
    var picked = null, lw = SH().localWood(c).id;
    var html = woodNote(c) + '<div class="scroll" style="max-height:560px">' + types.map(function (id) { return shipCardHtml(c, id, lw); }).join('') + '</div>';
    var win = UI.window({ title: '배 구입 — 소지금 ' + U.num(s.player.gold) + '닢', icon: 'ship', width: 900, html: html, buttons: [{ label: '돌아간다', value: null }],
      onBuild: function (el, w) {
        U.$$('.pic', el).forEach(function (p) { p.appendChild(A.shipCard(p.dataset.t, 220, 120)); });
        U.$$('.shipcard.click', el).forEach(function (d) { d.onclick = function () { picked = d.dataset.id; w.close('pick'); }; });
      } });
    if ((await win.result) !== 'pick') return;
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
    if (!(await UI.confirm(wood.name + U.jx(wood.name, '으로/로') + ' 지은 ' + t.name + U.jx(t.name, '을/를') + ' 금화 ' + U.num(price) + '닢에 사겠습니까? (내구력 ' + hpWith(t, opt.id) + ')', '산다', '그만둔다'))) return;
    var name = await UI.prompt('새 배의 이름', U.pick(G.SHIP_NAMES), 12);
    if (!name) name = U.pick(G.SHIP_NAMES);
    s.player.gold -= price;
    if (opt.how === 'cargo') SH().useCargoWood(opt.id, opt.need);
    var sh = R.newShip(picked, name, opt.id);
    if (G.ShipSprite) G.ShipSprite.want([sh.type]);
    if (s.fleet.ships.length < G.MAX_SHIPS) { s.fleet.ships.push(sh); UI.toast(name + '호가 함대에 편입되었다.', 'ship'); }
    else { C.B.harbor.moored(c).push(sh); UI.toast(name + '호는 이 항구에 계류되었다. (함대가 가득 참)', 'anchor'); }
    G.State.log(c.name + '에서 ' + wood.name + U.jx(wood.name, '으로/로') + ' 지은 ' + t.name + ' ' + name + '호를 샀다.');
    await C.say(keeper(), opt.how === 'local' ? '고맙네! 좋은 배일세. 아껴 주게나.' : '먼 곳의 ' + wood.name + U.jx(wood.name, '으로/로') + ' 지었네. 좋은 나무는 배를 오래 살게 하지.');
  };
  function stars(v) { var n = Math.round((v - 0.9) / 0.14); n = U.clamp(n, 1, 5); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }

  // ---------------------------------------------------------------- 기술 투자 (대항해시대 2의 공업 투자)
  Y.invest = async function (c) {
    var s = S(), SHp = SH(), tech = SHp.tech(c), next = SHp.techNext(c);
    var types = Y.types(c), nextShips = types.filter(function (id) { return G.SHIP[id].lv === tech + 1; }).map(function (id) { return G.SHIP[id].name; });
    var head = '이 조선소의 기술은 ' + tech + '등급일세 (기본 ' + SHp.techBase(c) + '등급, 지금까지 들어온 투자 금화 ' + U.num(SHp.techAmt(c)) + '닢).';
    if (next == null) { await C.say(keeper(), head + ' ' + (tech >= 5 ? '이 이상은 어느 조선소도 짓지 못하는 배들뿐이지.' : '더 투자해도 이 조선소가 오를 수 있는 끝일세.')); return; }
    await C.say(keeper(), head + ' 금화 ' + U.num(next) + '닢을 더 대 주면 도크를 넓히고 장인을 불러 ' + (tech + 1) + '등급 배를 지을 수 있네.' + (nextShips.length ? ' (' + nextShips.join('·') + ')' : ' 다만 이 고장에서 짓는 배 가운데 그 등급 배는 아직 없네.'));
    if (s.player.gold < 1000) { await C.say(keeper(), '투자는 금화 1,000닢부터 받네.'); return; }
    var n = await UI.number({ title: '조선 기술 투자 (천 닢 단위)', min: 1, max: Math.floor(s.player.gold / 1000), value: Math.min(Math.floor(s.player.gold / 1000), Math.ceil(next / 1000)), unit: '천 닢',
      info: function (k) { var a = SHp.techAmt(c) + k * 1000, b = 0; for (var i = 1; i < SHp.TECH_INV.length; i++) if (a >= SHp.TECH_INV[i]) b = i; return '금화 ' + U.num(k * 1000) + '닢 → 조선 기술 ' + Math.min(5, SHp.techBase(c) + b) + '등급'; } });
    if (!n) return;
    var amt = n * 1000; s.player.gold -= amt;
    var up = SHp.techInvest(c, amt);
    s.player.fame += Math.round(amt / 2000);
    if (up > 0) {
      var now = SHp.tech(c), opened = Y.types(c).filter(function (id) { var lv = G.SHIP[id].lv; return lv > tech && lv <= now; }).map(function (id) { return G.SHIP[id].name; });
      G.State.log(c.name + ' 조선소에 금화 ' + U.num(amt) + '닢을 투자했다. 조선 기술 ' + now + '등급.');
      await C.say(keeper(), '고맙네! 이제 ' + now + '등급 배까지 지을 수 있네.' + (opened.length ? ' ' + opened.join('·') + U.jx(opened[opened.length - 1], '을/를') + ' 주문해 보게.' : ''));
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
    var i = await C.B.harbor.pickShip('개조할 배', list); if (i == null) return;
    var sh = list[i];
    if (sh.loan) { await C.say(keeper(), '빌린 배는 함부로 뜯어고칠 수 없네. 돌려줄 때 원래 모습 그대로여야 하지 않겠나. 수리라면 해 주지.'); return; }
    for (;;) {
      var t = G.SHIP[sh.type];
      var v = await UI.choose(sh.name + '호 개조', [
        { label: '대포', right: (G.CANNON[sh.guns.type] || {}).name + ' ' + sh.guns.n + '/' + sh.ports + '문', value: 'gun', icon: 'cannon' },
        { label: '돛', right: sh.sails.map(function (k) { return k === 'sq' ? '사각' : '삼각'; }).join('·'), value: 'sail', icon: 'sail' },
        { label: '포문 증설', right: sh.ports + '/' + t.ports + '문', value: 'port', icon: 'plus', disabled: sh.ports >= t.ports },
        { label: '선수상', right: sh.fig ? G.FIGUREHEAD[sh.fig].name : '없음', value: 'fig', icon: 'feather' },
        { label: '선체 다시 짓기 (목재)', right: (SH().wood(sh) || { name: '보통 목재' }).name, value: 'wood', icon: 'hammer' },
        { label: '선명 변경', right: sh.name, value: 'name', icon: 'scroll' }
      ].concat(sh === s.fleet.ships[0] && G.CabinView ? [{ label: '선실 개조', right: '선실 ' + (G.Cabins.rooms().length - 1) + '칸', value: 'cabin', icon: 'bed' }] : []), { width: 600, text: '소지금 ' + U.num(s.player.gold) + '닢' });
      if (v == null) return;
      if (v === 'cabin') await G.CabinView.open({ yard: c });
      else if (v === 'gun') await refitGuns(c, sh);
      else if (v === 'sail') await refitSails(c, sh);
      else if (v === 'port') await refitPorts(c, sh);
      else if (v === 'fig') await refitFig(c, sh);
      else if (v === 'wood') await refitWood(c, sh);
      else if (v === 'name') { var nm = await UI.prompt('새 이름', sh.name, 12); if (nm) { sh.name = nm; UI.toast('선명을 ' + nm + '호로 바꾸었다.', 'scroll'); } }
    }
  };
  async function refitGuns(c, sh) {
    var s = S();
    var ty = await UI.choose('대포 종류', G.CANNONS.map(function (g) { return { label: g.name, right: '1문 ' + g.price + '닢 · 사정 ' + g.range + ' · 위력 ' + g.dmg + ' · 무게 ' + g.load, value: g.id, desc: g.desc, icon: 'cannon' }; }), { width: 700, text: '같은 종류로 수를 바꾸거나 다른 종류로 바꿔 달 수 있습니다. 떼어낸 대포는 반값에 사들입니다.' });
    if (!ty) return;
    var g = G.CANNON[ty], old = G.CANNON[sh.guns.type];
    var refund = function (n) { return old ? Math.floor(old.price * 0.5 * n) : 0; };
    var n = await UI.number({ title: g.name + ' 탑재 수', min: 0, max: sh.ports, value: ty === sh.guns.type ? sh.guns.n : Math.min(sh.ports, sh.guns.n || 4), unit: '문',
      info: function (k) {
        var cost = ty === sh.guns.type ? Math.max(0, k - sh.guns.n) * g.price - (k < sh.guns.n ? refund(sh.guns.n - k) : 0) : k * g.price - refund(sh.guns.n);
        var cap = Math.max(0, Math.floor(sh.cap - k * g.load));
        return (cost >= 0 ? '비용 ' + U.num(cost) : '환급 ' + U.num(-cost)) + '닢 · 적재량 ' + cap + '통';
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
      var i = await UI.choose('돛 바꾸기 (1개 ' + price + '닢)', opts, { width: 620, text: '사각돛은 순풍에서 빠르고, 삼각돛은 옆바람과 맞바람에 강합니다.' + (kinds.length > 2 ? ' 대나무 살 돛은 그 사이 — 어느 바람에나 무난하고 폭풍에 빨리 줄일 수 있습니다.' : '') });
      if (i == null) return;
      if (s.player.gold < price) { await C.say(keeper(), '돈이 모자라는군.'); return; }
      var cur = kinds.indexOf(sh.sails[i]);
      s.player.gold -= price; sh.sails[i] = kinds[(cur + 1) % kinds.length] || 'sq';
      UI.toast((i + 1) + '번 돛대를 ' + G.SAIL_NAME[sh.sails[i]] + U.jx(G.SAIL_NAME[sh.sails[i]], '으로/로') + ' 바꾸었다.', 'sail');
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
      return { label: w.name, right: '금화 ' + U.num(cost(o)) + '닢 · 내구 ' + sh.maxHp + '→' + hp, value: i, icon: o.how === 'cargo' ? 'sack' : 'hammer', desc: SH().woodLine(w) + (o.how === 'cargo' ? ' · 싣고 온 목재 ' + o.need + '통' : '') + ' — ' + w.desc };
    }), { width: 720, text: '판자를 모두 갈아 다시 짓습니다. 배값의 40% 정도가 듭니다. 지금 손상은 비율대로 남습니다.' });
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
  async function refitPorts(c, sh) {
    var s = S(), t = G.SHIP[sh.type], price = 250;
    var n = await UI.number({ title: '포문 증설 (1문 ' + price + '닢)', min: 1, max: t.ports - sh.ports, value: Math.min(2, t.ports - sh.ports), unit: '문', info: function (k) { return '비용 ' + U.num(k * price) + '닢'; } });
    if (!n) return;
    if (s.player.gold < n * price) { await C.say(keeper(), '돈이 모자라는군.'); return; }
    s.player.gold -= n * price; sh.ports += n; UI.toast('포문을 ' + n + '문 늘렸다.', 'plus');
  }
  async function refitFig(c, sh) {
    var s = S(), rng = U.makeRng(c.id * 17 + Math.floor(s.day / 60));
    var sold = G.FIGUREHEADS.filter(function (f) { return !f.rare; }).filter(function () { return rng() < 0.45; });
    // 소지품의 유물 선수상도 달 수 있다
    var mine = s.player.items.map(function (it, i) { return { it: it, i: i }; }).filter(function (x) { return G.FIGUREHEAD[x.it.id] && G.FIGUREHEAD[x.it.id].relic; });
    if (!sold.length && !mine.length && !sh.fig) { await C.say(keeper(), '지금은 선수상이 하나도 없네.'); return; }
    var opts = mine.map(function (x, k) { var f = G.FIGUREHEAD[x.it.id]; return { label: f.name + ' <span class="tag">소지품 · 유물</span>' + (R.isProof(x.it) ? ' <span class="tag">증거</span>' : ''), right: '달기 150닢', value: 'my' + k, desc: f.desc, icon: 'feather' }; })
      .concat(sold.map(function (f) { return { label: f.name, right: U.num(f.price) + '닢', value: f.id, desc: f.desc, icon: 'feather' }; }))
      .concat(sh.fig ? [{ label: '선수상 떼어내기', value: '_off', icon: 'tools', desc: G.FIGUREHEAD[sh.fig] && G.FIGUREHEAD[sh.fig].relic ? '유물 선수상은 떼어 소지품으로 돌려받는다' : '' }] : []);
    var v = await UI.choose('선수상', opts, { width: 660, text: '선수상은 배를 지켜 주는 수호상입니다. 배마다 하나씩 달 수 있습니다.' + (sh.fig ? ' 지금: <b>' + G.FIGUREHEAD[sh.fig].name + '</b>' : '') });
    if (!v) return;
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
    s.player.gold -= f.price; sh.fig = v; UI.toast(sh.name + '호에 ' + f.name + U.j(f.name, '을/를').slice(f.name.length) + ' 달았다. ' + f.desc, 'feather');
  }
  /** 달린 선수상을 뗀다. 유물 선수상은 소지품으로 돌려받는다 (칸이 없으면 묻는다) */
  async function takeOffFig(sh) {
    var f = G.FIGUREHEAD[sh.fig];
    if (f && f.relic) {
      if (R.itemsFull()) { if (!(await UI.confirm('소지품이 가득 차서 ' + f.name + U.jx(f.name, '을/를') + ' 돌려받을 자리가 없습니다. 버리겠습니까? (다시 구할 수 없는 유물입니다)', '버린다', '그만둔다'))) return false; }
      else { R.addItem(f.id, { disc: f.relic, done: true }); UI.toast(f.name + U.jx(f.name, '을/를') + ' 소지품으로 돌려받았다.', { src: G.Img.itemSrc(f.id), icon: 'chest' }); }
    }
    sh.fig = null; return true;
  }
})(window.G = window.G || {});
