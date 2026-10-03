/* 포카: five-card draw against a tavern patron. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art;
  G.Games = G.Games || {};
  var SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  var HANDS = ['하이카드', '원페어', '투페어', '트리플', '스트레이트', '플러시', '풀하우스', '포카드', '스트레이트 플러시', '로열 스트레이트 플러시'];

  function deck() { var d = []; for (var s = 0; s < 4; s++) for (var r = 0; r < 13; r++) d.push({ s: s, r: r }); return U.shuffle(d); }
  /** returns [category, tiebreak ranks...] */
  function evalHand(h) {
    var rs = h.map(function (c) { return c.r; }).sort(function (a, b) { return b - a; });
    var flush = h.every(function (c) { return c.s === h[0].s; });
    var uniq = rs.filter(function (r, i) { return rs.indexOf(r) === i; });
    var straight = uniq.length === 5 && (rs[0] - rs[4] === 4 || (rs[0] === 12 && rs[1] === 3));
    var top = straight && rs[0] === 12 && rs[1] === 3 ? 3 : rs[0];
    var cnt = {}; rs.forEach(function (r) { cnt[r] = (cnt[r] || 0) + 1; });
    var groups = Object.keys(cnt).map(Number).sort(function (a, b) { return cnt[b] - cnt[a] || b - a; });
    var shape = groups.map(function (g) { return cnt[g]; }).join('');
    if (straight && flush) return [top === 12 ? 9 : 8, top];
    if (shape === '41') return [7].concat(groups);
    if (shape === '32') return [6].concat(groups);
    if (flush) return [5].concat(rs);
    if (straight) return [4, top];
    if (shape === '311') return [3].concat(groups);
    if (shape === '221') return [2].concat(groups);
    if (shape === '2111') return [1].concat(groups);
    return [0].concat(rs);
  }
  function cmp(a, b) { for (var i = 0; i < Math.max(a.length, b.length); i++) { var d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; }
  function cardHtml(c, hidden, held) {
    if (hidden) return '<div class="pcard back"></div>';
    var red = c.s === 1 || c.s === 2;
    return '<div class="pcard' + (red ? ' red' : '') + (held ? ' held' : '') + '"><span class="r">' + RANKS[c.r] + '</span><span class="s">' + SUITS[c.s] + '</span><span class="rb">' + RANKS[c.r] + '</span>' + (held ? '<i>유지</i>' : '') + '</div>';
  }
  /** dealer keeps pairs+ ; draws to flush/straight sometimes */
  function dealerHold(h) {
    var e = evalHand(h), keep = [false, false, false, false, false];
    if (e[0] >= 4) return [true, true, true, true, true];
    var cnt = {}; h.forEach(function (c) { cnt[c.r] = (cnt[c.r] || 0) + 1; });
    var any = false;
    h.forEach(function (c, i) { if (cnt[c.r] >= 2) { keep[i] = true; any = true; } });
    if (!any) {
      var suits = [0, 0, 0, 0]; h.forEach(function (c) { suits[c.s]++; });
      var fs = suits.indexOf(4);
      if (fs >= 0) h.forEach(function (c, i) { keep[i] = c.s === fs; });
      else { var hi = 0; h.forEach(function (c, i) { if (c.r > h[hi].r) hi = i; }); keep[hi] = h[hi].r >= 9; }
    }
    return keep;
  }

  G.Games.poker = async function (city) {
    var s = G.Game.state, p = s.player;
    var opp = { name: '술집 손님', portrait: A.withImg(A.npcSpec('poker' + city.id + (s.day % 5), 'sailor', city.style), G.Img.chain.npc('gambler', city)) };
    await UI.say(U.pick(['오우, 자네 꽤 운이 있을 것 같은데, 어때, 포카로 내기하지 않겠나?', '여, 포카로 나와 내기하세. 도저히 따분해서 말이지.', '거기, 이쪽으로 오게. 포카나 하세.']), opp);
    for (;;) {
      var bets = [100, 500, 1000, 5000].filter(function (b) { return b <= p.gold; });
      if (!bets.length) { await UI.say('돈이 없으면 앉을 자리도 없네.', opp); return; }
      var bet = await UI.choose('판돈을 정하십시오 — 소지금 ' + U.num(p.gold) + '닢', bets.map(function (b) { return { label: '금화 ' + U.num(b) + '닢', value: b, icon: 'coin' }; }).concat([{ label: '그만둔다', value: 0, icon: 'boot' }]), { width: 460 });
      if (!bet) { await UI.say('쳇, 재미없군.', opp); return; }
      var res = await round(bet, opp);
      if (res > 0) { p.gold += bet; if (G.Audio) G.Audio.sfx('coin'); }
      else if (res < 0) p.gold -= bet;
      G.Game.refreshHud();
      if (!(await UI.confirm(res > 0 ? '이겼다! 금화 ' + U.num(bet) + '닢을 땄다. 한 판 더 하겠습니까?' : res < 0 ? '졌다... 금화 ' + U.num(bet) + '닢을 잃었다. 한 판 더 하겠습니까?' : '무승부. 한 판 더 하겠습니까?', '한 판 더', '그만둔다'))) return;
    }
  };

  function round(bet, opp) {
    return new Promise(function (resolve) {
      var d = deck(), me = d.splice(0, 5), en = d.splice(0, 5), hold = [false, false, false, false, false], phase = 0;
      var win = UI.window({ title: '포카 — 판돈 ' + U.num(bet) + '닢', icon: 'dice', width: 900, closable: false, html:
        '<div class="poker"><div class="row en"></div><div class="plog center">바꾸고 싶지 않은 카드를 눌러 <b>유지</b>하고 「교환」을 누르십시오.</div><div class="row me"></div></div>',
        buttons: [{ label: '교환', value: 'draw', cls: 'navy', onClick: function () { step(); return false; } }] });
      var el = win.content;
      if (G.MinigameArt) G.MinigameArt.mount(el, 'poker');
      function render(reveal) {
        el.querySelector('.en').innerHTML = en.map(function (c) { return cardHtml(c, !reveal); }).join('');
        el.querySelector('.me').innerHTML = me.map(function (c, i) { return cardHtml(c, false, phase === 0 && hold[i]); }).join('');
        if (phase === 0) U.$$('.me .pcard', el).forEach(function (cd, i) { cd.onclick = function () { hold[i] = !hold[i]; render(false); }; });
      }
      function step() {
        if (phase === 0) {
          me = me.map(function (c, i) { return hold[i] ? c : d.pop(); });
          var dk = dealerHold(en); en = en.map(function (c, i) { return dk[i] ? c : d.pop(); });
          phase = 1; render(true);
          var a = evalHand(me), b = evalHand(en), r = cmp(a, b);
          el.querySelector('.plog').innerHTML = '나: <b>' + HANDS[a[0]] + '</b> &nbsp; 상대: <b>' + HANDS[b[0]] + '</b> — ' + (r > 0 ? '<span class="good-text">나의 승리!</span>' : r < 0 ? '<span class="warn-text">상대의 승리...</span>' : '무승부');
          var btn = win.el.querySelector('.foot .btn'); btn.textContent = '확인';
          btn.onclick = function () { win.close(r); resolve(r > 0 ? 1 : r < 0 ? -1 : 0); };
        }
      }
      render(false);
    });
  }
  G.Games.evalHand = evalHand;
})(window.G = window.G || {});
