/* 포카: five-card draw against a tavern patron. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art;
  G.Games = G.Games || {};
  var SUITS = ['♠', '♥', '♦', '♣'], SUIT_KEYS = ['spades', 'hearts', 'diamonds', 'clubs'];
  var RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  var HANDS = ['하이카드', '원페어', '투페어', '트리플', '스트레이트', '플러시', '풀하우스', '포카드', '스트레이트 플러시', '로열 스트레이트 플러시'];
  var FACE_KEYS = [];
  SUIT_KEYS.forEach(function (suit) { ['j', 'q', 'k'].forEach(function (rank) { FACE_KEYS.push('minigames/cards/' + rank + '-' + suit); }); });

  function deck() { var d = []; for (var s = 0; s < 4; s++) for (var r = 0; r < 13; r++) d.push({ s: s, r: r }); return U.shuffle(d); }
  /** returns [category, tiebreak ranks...] */
  function evalHand(h) {
    var rs = h.map(function (c) { return c.r; }).sort(function (a, b) { return b - a; });
    var flush = h.every(function (c) { return c.s === h[0].s; });
    var uniq = rs.filter(function (r, i) { return rs.indexOf(r) === i; });
    // 스트레이트: 다섯 장의 숫자가 둥글게 이어지면 된다 — 이 술집에서는 K-A-2-3-4처럼 에이스를 사이에 두고 돌아가는 연결도 친다 (2026-10-17 사용자 요청)
    //   top = 연결의 끝 카드: 10-J-Q-K-A는 A(12, 가장 높다), A-2-3-4-5는 5(3), 돌아가는 연결은 K-A-2-3-4 → 4(2), Q-K-A-2-3 → 3(1), J-Q-K-A-2 → 2(0)이라 가장 낮다
    var straight = false, top = rs[0], wrap = false;
    if (uniq.length === 5) for (var st0 = 0; st0 < 13 && !straight; st0++) {
      var run = true; for (var k = 0; k < 5 && run; k++) run = uniq.indexOf((st0 + k) % 13) >= 0;
      if (run) { straight = true; top = (st0 + 4) % 13; wrap = st0 + 4 > 12 && st0 !== 12; }
    }
    var cnt = {}; rs.forEach(function (r) { cnt[r] = (cnt[r] || 0) + 1; });
    var groups = Object.keys(cnt).map(Number).sort(function (a, b) { return cnt[b] - cnt[a] || b - a; });
    var shape = groups.map(function (g) { return cnt[g]; }).join('');
    if (straight && flush) return tag([top === 12 ? 9 : 8, top], wrap);
    if (shape === '41') return [7].concat(groups);
    if (shape === '32') return [6].concat(groups);
    if (flush) return [5].concat(rs);
    if (straight) return tag([4, top], wrap);
    if (shape === '311') return [3].concat(groups);
    if (shape === '221') return [2].concat(groups);
    if (shape === '2111') return [1].concat(groups);
    return [0].concat(rs);
  }
  function tag(e, wrap) { if (wrap) e.wrap = true; return e; }
  function handName(e) { return HANDS[e[0]] + (e.wrap ? ' (돌아가는)' : ''); }
  function cmp(a, b) { for (var i = 0; i < Math.max(a.length, b.length); i++) { var d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; }
  function faceKey(c) {
    if (!c || c.r < 9 || c.r > 11) return null;
    return 'minigames/cards/' + RANKS[c.r].toLowerCase() + '-' + SUIT_KEYS[c.s];
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function motionStyle(i, side) {
    return '--deal-x:' + ((2 - i) * 110) + 'px;--deal-y:' + (side === 'en' ? 128 : -128) + 'px;--deal-turn:' + ((i - 2) * 2.5) + 'deg';
  }
  function cardHtml(c, hidden, held, opt) {
    opt = opt || {};
    var cls = 'pcard' + (hidden ? ' back' : '') + (held ? ' held' : '') + (opt.deal ? ' deal-in' : '') + (opt.leave ? ' leaving' : '');
    var style = opt.deal ? ' style="' + motionStyle(opt.index, opt.side) + '"' : '';
    if (hidden) return '<div class="' + cls + '" data-card="' + c.s + '-' + c.r + '"' + style + '></div>';
    var red = c.s === 1 || c.s === 2;
    var key = faceKey(c), art = key && G.Img && G.Img.has(key) ? G.Img.src(key) : null;
    if (art) cls += ' face';
    return '<div class="' + cls + (red ? ' red' : '') + '" data-card="' + c.s + '-' + c.r + '"' + style + '>' +
      (art ? '<img class="pcard-art" src="' + esc(art) + '" alt="' + RANKS[c.r] + SUITS[c.s] + '">' :
        '<span class="r">' + RANKS[c.r] + '</span><span class="s">' + SUITS[c.s] + '</span><span class="rb">' + RANKS[c.r] + '</span>') +
      (held ? '<i>유지</i>' : '') + '</div>';
  }
  function slotHtml(i) { return '<div class="pcard slot" data-slot="' + i + '" aria-hidden="true"></div>'; }
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
    var opp = { name: '술집 손님', portrait: A.withImg(A.npcSpec('poker' + city.id + (s.day % 5), 'sailor', G.Img.folkStyle(city)), G.Img.chain.npc('gambler', city)) };
    if (G.Img) await G.Img.preload(FACE_KEYS.map(function (k) { return [k]; }), 0, true);
    await UI.say(U.pick(['오우, 자네 꽤 운이 있을 것 같은데, 어때, 포카로 내기하지 않겠나?', '여, 포카로 나와 내기하세. 도저히 따분해서 말이지.', '거기, 이쪽으로 오게. 포카나 하세.']), opp);
    for (;;) {
      var bets = [100, 500, 1000, 5000].filter(function (b) { return b <= p.gold; });
      if (!bets.length) { await UI.say('돈이 없으면 앉을 자리도 없네.', opp); return; }
      var bet = await UI.choose('판돈을 정하십시오 — 소지금 ' + U.num(p.gold) + '닢', bets.map(function (b) { return { label: '금화 ' + U.num(b) + '닢', value: b, icon: 'coin' }; }).concat([{ label: '그만둔다', value: 0, icon: 'boot' }]), { width: 460, text: '<span class="muted">이 술집의 규칙: K-A-2-3-4처럼 에이스를 사이에 두고 돌아가는 연결도 스트레이트로 친다 (스트레이트 가운데 가장 낮다).</span>' });
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
      var d = deck(), me = [null, null, null, null, null], en = [null, null, null, null, null];
      var hold = [false, false, false, false, false], phase = -1;
      var win = UI.window({ title: '포카 — 판돈 ' + U.num(bet) + '닢', icon: 'dice', width: 900, closable: false, html:
        '<div class="poker"><div class="poker-table"><div class="row en"></div><div class="poker-mid"><div class="poker-deck" aria-hidden="true"><b></b><b></b><b></b></div><div class="plog center">덱을 섞는 중…</div></div><div class="row me"></div></div></div>',
        buttons: [{ label: '교환', value: 'draw', cls: 'navy', onClick: function () { step(); return false; } }] });
      var el = win.content, btn = win.el.querySelector('.foot .btn');
      if (G.MinigameArt) G.MinigameArt.mount(el, 'poker');
      function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
      function timing(name, fallback) {
        var cfg = G.FX && G.FX.minigames && G.FX.minigames.poker;
        return reduced() ? 0 : (cfg && cfg[name] != null ? cfg[name] : fallback);
      }
      function pause(name, fallback) { return new Promise(function (done) { setTimeout(done, timing(name, fallback)); }); }
      function setButton(label, enabled) { btn.textContent = label; btn.disabled = !enabled; btn.classList.toggle('dim', !enabled); }
      function setLog(html) { el.querySelector('.plog').innerHTML = html; }
      function rowHtml(cards, side, reveal, moving, leaving) {
        return cards.map(function (c, i) {
          if (!c) return slotHtml(i);
          return cardHtml(c, side === 'en' && !reveal, side === 'me' && phase < 2 && hold[i], {
            side: side, index: i, deal: !!(moving && moving.side === side && moving.index === i), leave: !!(leaving && leaving[side] && leaving[side][i])
          });
        }).join('');
      }
      function render(reveal, moving, leaving) {
        el.querySelector('.en').innerHTML = rowHtml(en, 'en', reveal, moving, leaving);
        el.querySelector('.me').innerHTML = rowHtml(me, 'me', reveal, moving, leaving);
        if (phase === 0) U.$$('.me .pcard', el).forEach(function (cd, i) { cd.onclick = function () { hold[i] = !hold[i]; render(false); }; });
      }
      async function dealOne(side, i, card) {
        if (side === 'en') en[i] = card; else me[i] = card;
        render(false, { side: side, index: i });
        await pause('dealMs', 170);
      }
      async function firstDeal() {
        setButton('패를 나누는 중…', false);
        var pile = el.querySelector('.poker-deck'); pile.classList.add('active', 'shuffling');
        await pause('shuffleMs', 720); pile.classList.remove('shuffling');
        setLog('한 장씩 패를 나누는 중…');
        for (var i = 0; i < 5; i++) {
          await dealOne('en', i, d.pop());
          await dealOne('me', i, d.pop());
        }
        phase = 0; render(false);
        pile.classList.remove('active');
        setLog('바꾸고 싶지 않은 카드를 눌러 <b>유지</b>하고 「교환」을 누르십시오.');
        setButton('교환', true);
      }
      async function step() {
        if (phase !== 0) return;
        phase = 1; setButton('패를 바꾸는 중…', false);
        el.querySelector('.poker-deck').classList.add('active');
        var dk = dealerHold(en), dropMe = hold.map(function (kept) { return !kept; }), dropEn = dk.map(function (kept) { return !kept; });
        setLog('홀드하지 않은 패를 거두는 중…');
        render(false, null, { me: dropMe, en: dropEn });
        await pause('discardMs', 260);
        dropMe.forEach(function (drop, i) { if (drop) me[i] = null; });
        dropEn.forEach(function (drop, i) { if (drop) en[i] = null; });
        render(false);
        setLog('빈자리에만 새 패를 나누는 중…');
        for (var i = 0; i < 5; i++) {
          if (dropEn[i]) await dealOne('en', i, d.pop());
          if (dropMe[i]) await dealOne('me', i, d.pop());
        }
        phase = 2; render(true);
        el.querySelector('.poker-deck').classList.remove('active');
        var a = evalHand(me), b = evalHand(en), r = cmp(a, b);
        setLog('나: <b>' + handName(a) + '</b> &nbsp; 상대: <b>' + handName(b) + '</b> — ' + (r > 0 ? '<span class="good-text">나의 승리!</span>' : r < 0 ? '<span class="warn-text">상대의 승리...</span>' : '무승부'));
        setButton('확인', true);
        btn.onclick = function () { win.close(r); resolve(r > 0 ? 1 : r < 0 ? -1 : 0); };
      }
      render(false); firstDeal();
    });
  }
  G.Games.evalHand = evalHand;
  G.Games.pokerFaceKey = faceKey;
  G.Games.poker._eval = evalHand; G.Games.poker._cmp = cmp; G.Games.poker._name = function (e) { return handName(e); };   // 시험용
})(window.G = window.G || {});
