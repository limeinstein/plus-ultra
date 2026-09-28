/* 이름 붙이기 (G.Names)
   · 곶·해협·항로·대륙 같은 지리상의 발견은 처음 찾은 사람이 이름을 붙인다 (아프리카 남단 → 「희망봉」, 신세계 해협 → 「마젤란 해협」 …).
     이름을 붙이면 그 자리에서 명성이 크게 오르고, 보고·발표할 때 왕실이 그 이름을 공인하며 하사금을 내린다.
     경쟁자가 먼저 발표하면 역사 속 이름이 붙는다.
   · 새 대륙: 아메리고 베스푸치가 발견 보고 세 번(1500·1502·1503)을 마치기 전에 제독이 서회항로(신세계)와 인도항로를 모두 보고하면
     제독이 대륙의 이름을 짓는다. 늦으면 1507년 발트제뮐러의 지도에 「아메리카」가 적힌다. 베스푸치가 제독의 부하로 있는 동안은 그의 보고가 미뤄진다.
     이름이 정해지면 사람들(대사·지명·지역 이름)이 모두 그 이름으로 대륙을 부른다. 그 전에는 「신대륙」. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var N = {};
  G.Names = N;
  function S() { return G.Game.state; }

  // kind: 붙는 말 · hist: 역사 속 이름 · note: 이름에 얽힌 이야기
  G.NAMEABLE = {
    capegood:    { kind: '곶', hist: '희망봉', note: '디아스는 이 곶을 「폭풍의 곶」이라 불렀고, 주앙 2세가 「희망봉」으로 고쳐 불렀다.', alt: '폭풍의 곶' },
    westroute:   { kind: '항로', hist: '서회항로', note: '대서양을 서쪽으로 곧장 건너는 뱃길.' },
    indiaroute:  { kind: '항로', hist: '인도항로', note: '아프리카를 돌아 인도에 이르는 뱃길.' },
    malacca:     { kind: '해협', hist: '말라카 해협', note: '인도양과 남중국해를 잇는 좁은 물길.' },
    newstrait:   { kind: '해협', hist: '마젤란 해협', note: '역사에서는 처음 지나간 마가야네스(마젤란)의 이름이 붙었다.' },
    northstrait: { kind: '해협', hist: '베링 해협', note: '역사에서는 1728년에 지나간 비투스 베링의 이름이 붙었다.' },
    endstrait:   { kind: '해협', hist: '드레이크 해협', note: '역사에서는 1578년 폭풍에 밀려 이곳을 본 드레이크의 이름이 붙었다.' },
    australia:   { kind: '대륙', hist: '오스트레일리아', note: '옛 지리학자들이 「남쪽의 땅(테라 아우스트랄리스)」이라 부르던 곳.' },
    antarctic:   { kind: '대륙', hist: '남극대륙', note: '얼음으로 덮인 세상의 남쪽 끝.' }
  };
  // 아메리고 베스푸치의 보고 (세 번 모두 마치면 대륙 이름이 그를 따라 「아메리카」가 된다)
  G.VESPUCCI = [
    [1500, 6, '오헤다와 함께 남쪽 해안(작은 베네치아)을 다녀온 항해를 보고했다'],
    [1502, 9, '포르투갈 함대로 브라질 해안을 따라 멀리 남쪽까지 내려간 항해를 보고했다'],
    [1503, 6, '「신세계(문두스 노부스)」 — 그 땅은 아시아가 아니라 새로운 대륙이라고 보고했다']
  ];
  N.AMERICA_Y = 1507; N.AMERICA_M = 4;

  function names() { var s = S(); return s.names || (s.names = {}); }
  N.get = function (id) { return names()[id] || null; };
  /** 지금 대륙의 이름 (정해지지 않았으면 null) */
  N.continent = function () { return names().continent || null; };
  N.contLabel = function () { return N.continent() || '신대륙'; };

  // ---------------------------------------------------------------- 이름을 데이터와 글에 입힌다
  var ORIG = null;
  function remember() {
    if (ORIG) return;
    ORIG = { regions: G.REGIONS.slice(), cult: G.SHIP_CULT ? G.SHIP_CULT.am : null, zone: G.Ships ? G.Ships.ZONE_NAME.amer : null, disc: {} };
    G.DISCOVERIES.forEach(function (d) { ORIG.disc[d.id] = { name: d.name, desc: d.desc, hint: d.hint }; });
    if (G.FRONTIERS) G.FRONTIERS.forEach(function (f) { f._name0 = f._name0 || f.name; });
  }
  /** 대륙 이름을 글에 바꿔 넣는다: 「신대륙」과, 제독이 이름을 지었으면 「아메리카」도 */
  N.tx = function (str) {
    if (typeof str !== 'string' || !str) return str;
    var c = S() && S().names && S().names.continent;
    if (!c) return str;
    var out = str.replace(/신대륙/g, c);
    if (c !== '아메리카') out = out.replace(/아메리카/g, c);
    return out;
  };
  N.apply = function () {
    var s = S(); if (!s) return;
    remember();
    var nm = names(), cont = nm.continent;
    G.REGIONS[10] = cont || '신대륙';
    if (G.SHIP_CULT) G.SHIP_CULT.am = cont || '신대륙';
    if (G.Ships) G.Ships.ZONE_NAME.amer = cont || '신대륙';
    G.DISCOVERIES.forEach(function (d) {
      var o = ORIG.disc[d.id]; if (!o) return;
      var own = nm[d.id];
      d.name = own || N.tx(o.name);
      d.aka = own && own !== o.name ? o.name : null;          // 원래 부르던 말 (예: 아프리카 남단)
      d.desc = N.tx(o.desc); d.hint = N.tx(o.hint);
    });
    if (G.FRONTIERS) G.FRONTIERS.forEach(function (f) {
      var g = f.gate && nm[f.gate]; f.name = g && f._name0 === ORIG.disc[f.gate].name ? g : N.tx(f._name0);
    });
  };
  /** 발견물 이름에 옛 이름을 곁들여 (수첩 등) */
  N.label = function (d) { return d.aka ? d.name + ' (' + d.aka + ')' : d.name; };

  // ---------------------------------------------------------------- 화면에 나오는 말도 새 이름으로 (대사·알림·창)
  (function wrapUI() {
    function w(fn, idx) { return function () { var a = Array.prototype.slice.call(arguments); idx.forEach(function (i) { if (typeof a[i] === 'string') a[i] = N.tx(a[i]); }); return fn.apply(this, a); }; }
    UI.say = w(UI.say, [0]); UI.ask = w(UI.ask, [0]); UI.toast = w(UI.toast, [0]); UI.alert = w(UI.alert, [0, 1]); UI.confirm = w(UI.confirm, [0]);
    var ch = UI.choose;
    UI.choose = function (title, opts, o) {
      if (o && o.text) o.text = N.tx(o.text);
      (opts || []).forEach(function (x) { if (x) { x.label = N.tx(x.label); x.right = N.tx(x.right); x.desc = N.tx(x.desc); } });
      return ch.call(this, N.tx(title), opts, o);
    };
    var win = UI.window;
    UI.window = function (o) { if (o) { o.title = N.tx(o.title); o.html = N.tx(o.html); } return win.call(this, o); };
  })();

  // ---------------------------------------------------------------- 발견한 곳에 이름을 붙인다
  N.fameFor = function (d) { return 150 + d.pw * 80; };
  N.goldFor = function (d) { return Math.round((G.Disc.value ? G.Disc.value(d) : d.val) * 0.5 / 100) * 100; };
  /** 발견한 직후 (discovery.js) */
  N.offer = async function (d) {
    var s = S(), nm = G.NAMEABLE[d.id]; if (!nm) return;
    var st = s.disc[d.id];
    if (!st || !st.me || st.rival || names()[d.id]) return;
    var p = s.player.name, kind = nm.kind;
    var mine = kind === '대륙' ? p + '의 땅' : p + ' ' + kind;
    var opts = [{ label: nm.hist, right: '역사 속 이름', value: nm.hist, icon: 'book' }];
    if (nm.alt) opts.push({ label: nm.alt, right: '뱃사람들이 부르던 이름', value: nm.alt, icon: 'wind' });
    opts.push({ label: mine, right: '제독의 이름을 따서', value: mine, icon: 'crown' });
    var k = s.contract, sp = k && G.SPONSOR[k.sponsor], holder = sp && G.Sponsor.holder(sp);
    if (holder) { var sn = kind === '대륙' ? holder + '의 땅' : holder + ' ' + kind; opts.push({ label: sn, right: '후원자 ' + sp.title + U.jx(sp.title, '을/를') + ' 기려', value: sn, icon: 'seal' }); }
    opts.push({ label: '직접 짓는다', right: '', value: '_custom', icon: 'feather' });
    var v = await UI.choose('「' + d.name + '」에 이름을 붙입니다', opts, { width: 660, text: '이곳을 처음 찾은 사람만이 이름을 붙일 수 있습니다. ' + nm.note + ' 이름을 붙이면 명성이 크게 오르고, 보고하거나 발표할 때 왕실이 그 이름을 공인하며 하사금을 내립니다.' });
    if (v === '_custom') { v = await UI.prompt(d.name + '의 이름 (' + kind + ')', nm.hist, 14); }
    v = String(v || nm.hist).trim() || nm.hist;
    names()[d.id] = v; (s.nameBy || (s.nameBy = {}))[d.id] = 'me';
    var fame = N.fameFor(d); s.player.fame += fame;
    var old = d.name; N.apply();
    G.State.log('「' + old + '」에 「' + v + '」' + U.jx(v, '이라는/라는') + ' 이름을 붙였다. (명성 +' + fame + ')');
    await UI.say('이제부터 이곳은 「' + v + '」' + U.jx(v, '이다/다') + '! 해도에 이 이름을 적어 넣어라!\n\n(명성 +' + fame + ' — 보고하면 왕실이 이름을 공인하고 하사금을 내립니다)', G.Scenes.mateSpeaker('first'));
    G.Game.refreshHud && G.Game.refreshHud();
  };
  /** 경쟁자가 먼저 발표하면 역사 속 이름이 붙는다 (discovery.js rivals) — 소식 문장을 돌려준다 */
  N.onRival = function (d) {
    var nm = G.NAMEABLE[d.id]; if (!nm || names()[d.id]) return null;
    var o = ORIG ? ORIG.disc[d.id].name : d.name;
    if (nm.hist === o) return null;
    names()[d.id] = nm.hist; (S().nameBy || (S().nameBy = {}))[d.id] = 'rival';
    N.apply();
    return '그곳은 「' + nm.hist + '」' + U.jx(nm.hist, '이라는/라는') + ' 이름으로 불리게 되었다.';
  };
  /** 보고·발표한 뒤 (sponsor.js, harbor.js): 이름 공인 하사금, 그리고 대륙 이름 */
  N.onReport = async function (d) {
    var s = S(); if (!d) return;
    var by = s.nameBy && s.nameBy[d.id], st = s.disc[d.id];
    if (by === 'me' && st && !st.nameGrant) {
      st.nameGrant = true;
      var gold = N.goldFor(d), fame = 100 + d.pw * 50, king = s.player.nation === 'ES' ? '에스파냐 왕실' : '포르투갈 왕실';
      s.player.gold += gold; s.player.fame += fame;
      G.State.log(king + '이 「' + d.name + '」의 이름을 공인했다. (하사금 ' + gold + '닢, 명성 +' + fame + ')');
      await UI.alert(king + '이 제독이 붙인 이름 「' + d.name + '」' + U.jx(d.name, '을/를') + ' 공인했습니다. 이제 온 세상의 지도에 이 이름이 적힙니다.<br><br>명명 하사금 금화 <b>' + U.num(gold) + '</b>닢 · 명성 +' + fame, '이름의 공인');
    }
    if ((d.id === 'westroute' || d.id === 'indiaroute') && N.canNameContinent()) await N.offerContinent();
  };
  function reported(id) { var st = S().disc[id]; return !!(st && st.me && (st.reported || st.announced)); }
  N.vespucciCount = function () { var v = S().vesp; return v ? v.n : 0; };
  N.canNameContinent = function () { return !N.continent() && N.vespucciCount() < 3 && reported('westroute') && reported('indiaroute'); };
  N.offerContinent = async function () {
    var s = S(), p = s.player.name;
    var opts = [
      { label: p + '아', right: '제독의 이름을 라틴식으로 (아메리고 → 아메리카처럼)', value: p + '아', icon: 'crown' },
      { label: p + '의 땅', right: '제독의 이름을 따서', value: p + '의 땅', icon: 'crown' },
      { label: '콜롬비아', right: '처음 대서양을 건넌 콜론을 기려', value: '콜롬비아', icon: 'book' },
      { label: '인디아스', right: '에스파냐 사람들이 부르던 이름', value: '인디아스', icon: 'book' },
      { label: '직접 짓는다', right: '', value: '_custom', icon: 'feather' }
    ];
    var v = await UI.choose('새 대륙에 이름을 붙입니다', opts, { width: 700, text: '제독은 대서양 서쪽 끝의 땅과 인도에 이르는 뱃길을 모두 세상에 알렸습니다. 학자들은 서쪽의 땅이 아시아가 아니라 새로운 대륙이라고 입을 모읍니다. 아메리고 베스푸치보다 먼저, 제독이 이 대륙의 이름을 정할 수 있습니다. 한번 정하면 온 세상이 그 이름으로 부릅니다.' });
    if (v === '_custom') v = await UI.prompt('새 대륙의 이름', p + '아', 12);
    v = String(v || p + '아').trim() || p + '아';
    names().continent = v; (s.nameBy || (s.nameBy = {})).continent = 'me';
    var gold = 30000, fame = 800;
    s.player.gold += gold; s.player.fame += fame;
    N.apply();
    G.State.log('새 대륙에 「' + v + '」' + U.jx(v, '이라는/라는') + ' 이름을 붙였다. (하사금 ' + gold + '닢, 명성 +' + fame + ')');
    await UI.alert('세상 사람들이 새 대륙을 「<b>' + U.esc(v) + '</b>」' + U.jx(v, '이라고/라고') + ' 부르기 시작했습니다.<br>지도 제작자들이 앞다투어 이 이름을 새겨 넣습니다.<br><br>하사금 금화 <b>' + U.num(gold) + '</b>닢 · 명성 +' + fame, '대륙의 이름');
    G.Game.refreshHud && G.Game.refreshHud();
  };

  // ---------------------------------------------------------------- 아메리고 베스푸치 (날마다, world.js)
  N.daily = function () {
    var s = S(), out = [];
    var v = s.vesp || (s.vesp = { n: 0 });
    var hired = s.mates.some(function (m) { return m.id === 'vespucci'; });
    if (!N.continent()) {
      if (v.n < G.VESPUCCI.length) {
        var e = G.VESPUCCI[v.n];
        var due0 = s.date.y > e[0] || (s.date.y === e[0] && s.date.m >= e[1]);
        if (due0 && hired) v.held = true;                          // 제독의 부하로 있는 동안은 보고하지 못한다
        if (due0 && !hired) {
          v.n++; v.last = v.held ? U.dateNum(s.date) : e[0] * 10000 + e[1] * 100 + 1;   // 한번 미뤄지면 뒤의 보고도 미뤄진 날로 센다
          out.push({ icon: 'scroll', history: true, text: '소식: 아메리고 베스푸치가 ' + e[2] + '. (' + v.n + '/3)' + (v.n < 3 && !N.continent() ? ' 제독이 서회항로와 인도항로를 먼저 보고하면 새 대륙의 이름은 제독이 정하게 된다.' : '') });
        }
      } else {
        // 세 번째 보고 뒤 — 1507년(또는 그 보고가 늦었으면 그만큼 뒤) 지도 제작자가 「아메리카」를 적는다
        var ly = Math.floor((v.last || 15030601) / 10000), due = Math.max(N.AMERICA_Y * 12 + N.AMERICA_M, ly * 12 + 6 + 36);
        if (s.date.y * 12 + s.date.m >= due) {
          names().continent = '아메리카'; (s.nameBy || (s.nameBy = {})).continent = 'vespucci';
          N.apply();
          out.push({ icon: 'map', history: true, text: '소식: 지도 제작자 발트제뮐러가 새 세계지도에 새 대륙을 아메리고 베스푸치의 이름을 따 「아메리카」라고 적었다. 이제 모두가 그 땅을 아메리카라 부른다.' });
        }
      }
    }
    return out;
  };
})(window.G = window.G || {});
