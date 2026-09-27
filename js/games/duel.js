/* 일기토 (duel) — 대항해시대 2처럼 손에 든 패로 겨룬다 (규칙과 글은 이 게임에서 새로 짰다).
   공격 패: 베기 · 찌르기 · 내려치기 / 막기 패: 막기(베기를 막는다) · 흘리기(찌르기를 흘린다) · 피하기(내려치기를 피한다)
   - 둘 다 공격하면 둘 다 맞는다 (숫자가 큰 쪽이 제대로, 작은 쪽은 덜)
   - 알맞은 막기 패를 내면 공격을 온전히 막고, 막은 숫자가 공격 숫자 이상이면 받아친다
   - 어긋난 막기 패는 막기 숫자만큼 조금 덜 맞는다 · 무기에 맞는 공격은 더 세다 · 검술이 높으면 좋은 패가 들어온다 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  G.Games = G.Games || {};
  var NAME = { slash: '베기', thrust: '찌르기', smash: '내려치기', block: '막기', parry: '흘리기', dodge: '피하기' };
  var ATK = ['slash', 'thrust', 'smash'], DEF = ['block', 'parry', 'dodge'];
  var STOPS = { block: 'slash', parry: 'thrust', dodge: 'smash' };            // 이 막기 패가 막는 공격
  var GUARD_OF = { slash: 'block', thrust: 'parry', smash: 'dodge' };
  var HAND = 5;
  G.DUEL_CARD = NAME;

  /** 무기에 맞는 공격: 찌르는 검은 찌르기, 휜 칼은 베기, 무거운 날·곤봉·도끼는 내려치기 */
  var STYLE = { rapier: 'thrust', estoc: 'thrust', katar: 'thrust', kris: 'thrust', longinus: 'thrust',
    saber: 'slash', shamshir: 'slash', katana: 'slash', shotel: 'slash', firangi: 'slash', longsword: 'slash', excalibur: 'slash',
    twohand: 'smash', flamberge: 'smash', broadsword: 'smash', bastard: 'smash', guandao: 'smash', macuahuitl: 'smash' };
  G.Games.weaponStyle = function (id) {
    if (!id) return 'slash';
    if (STYLE[id]) return STYLE[id];
    var d = G.ITEM && G.ITEM[id], n = d ? d.name : '';
    if (/도끼|곤봉|부메랑|라브리스/.test(n)) return 'smash';
    if (/단검|작살|창/.test(n)) return 'thrust';
    return 'slash';
  };

  /** 부관 등 동료가 대신 싸울 때의 능력: 힘 → 체력, 무력 → 공격, 힘 → 방어, 검술 */
  G.Games.mateFighter = function (m) {
    var d = G.MATE[m.id], st = (d && d.st) || [55, 50, 55, 50];
    return { name: d ? d.name : '부관', portrait: G.Scenes.mateSpec(m.id), maxHp: Math.round(60 + st[0] * 0.6), atk: 3 + Math.round(st[2] / 10), def: 1 + Math.floor(st[0] / 30), skill: R.mateSkill(m, 'sword'), mar: st[2], style: 'slash', m: m };
  };
  /** 대신 싸울 부관 (기함의 부관이 있고 다치지 않았으면) */
  G.Games.proxy = function () {
    var s = G.Game.state, m = s.mates.filter(function (x) { return x.role === 'first'; })[0];
    return m && !R.mateHurt(m) ? m : null;
  };

  /** 패 한 장: 검술이 높을수록 큰 숫자, 무기에 맞는 공격이 자주 들어온다 */
  function drawCard(f) {
    var atk = U.chance(0.6);
    var t = atk ? (U.chance(0.45) ? f.style : U.pick(ATK)) : U.pick(DEF);
    var v = Math.round(U.rf(1, 6) + f.skill * 0.7 + U.rand() * 2.5);
    return { t: t, v: U.clamp(v, 1, 9) };
  }
  function isAtk(c) { return ATK.indexOf(c.t) >= 0; }
  /** 한 번 휘두를 때의 피해 */
  function hit(a, b, v, t) {
    var d = v * (2 + a.skill * 0.3) + a.atk * 0.6 - b.def * 0.5 + U.rf(0, 3);
    if (t === a.style) d *= 1.25;
    var crit = U.chance(0.06 + a.skill * 0.03);
    if (crit) d *= 1.5;
    return { d: Math.max(1, Math.round(d)), crit: crit };
  }

  /** enemy: {name, portrait, str, atk, def, skill, mar, style}, opt: {mate: 동료} — 동료가 대신 싸우면 스스로 패를 고르고(패를 눌러 다음 수를 지시할 수 있다) 제독은 다치지 않는다.
      returns 'win' | 'lose' | 'flee' */
  G.Games.duel = function (enemy, opt) {
    var s = G.Game.state, p = s.player, proxy = opt && opt.mate ? G.Games.mateFighter(opt.mate) : null;
    var me = proxy || { name: p.name, maxHp: Math.round(60 + p.st.str * 0.6), atk: R.atk(), def: R.def(), skill: p.sk.sword || 0, mar: p.st.mar, style: G.Games.weaponStyle(p.equip.weapon) };
    me.hp = proxy ? me.maxHp : Math.max(8, Math.round(me.maxHp * p.hp / 100));
    var en = { name: enemy.name, maxHp: Math.round(60 + (enemy.str || 60) * 0.6), atk: enemy.atk || 8, def: enemy.def || 2, skill: enemy.skill || 0, mar: enemy.mar || 55, style: enemy.style || U.pick(ATK) };
    en.hp = en.maxHp;
    me.hand = []; en.hand = [];
    for (var i = 0; i < HAND; i++) { me.hand.push(drawCard(me)); en.hand.push(drawCard(en)); }
    var myHist = [], enHist = [];
    if (G.Audio) G.Audio.music('battle');
    return new Promise(function (resolve) {
      var html = '<div class="duel dk2">' +
        '<div class="side me"><div class="pp"></div><div class="nm">' + U.esc(me.name) + '</div><div class="hpbar"></div><div class="hpn"></div><div class="sty">장기: ' + NAME[me.style] + '</div></div>' +
        '<div class="mid"><div class="table"><div class="slot me"></div><div class="vs">VS</div><div class="slot en"></div></div>' +
        '<div class="dlog">' + (proxy ? U.esc(me.name) + U.jx(me.name, '이/가') + ' 제독 대신 검을 뽑았다. 패를 누르면 다음 수를 지시한다.' : '검을 뽑았다. 패를 한 장 골라 내라! (1~5)') + '</div>' +
        '<div class="enhand"></div></div>' +
        '<div class="side en"><div class="pp"></div><div class="nm">' + U.esc(en.name) + '</div><div class="hpbar"></div><div class="hpn"></div><div class="sty">장기: ' + NAME[en.style] + '</div></div>' +
        '<div class="hand"></div><div class="acts"></div>' +
        '<div class="rule muted">막기 → 베기 · 흘리기 → 찌르기 · 피하기 → 내려치기를 막는다. 막은 숫자가 공격 숫자 이상이면 받아친다. 장기에 맞는 공격은 25% 더 세다.</div></div>';
      var win = UI.window({ title: '일기토', icon: 'sword', width: 1100, html: html, closable: false });
      var el = win.content;
      if (proxy) { if (proxy.portrait) el.querySelector('.me .pp').appendChild(A.portraitCanvas(proxy.portrait, 190)); win.el.querySelector('.title span').textContent = '일기토 — ' + me.name + ' (대리)'; }
      else if (p.portrait) el.querySelector('.me .pp').appendChild(A.portraitCanvas(p.portrait, 190));
      if (enemy.portrait) el.querySelector('.en .pp').appendChild(A.portraitCanvas(enemy.portrait, 190));
      var log = el.querySelector('.dlog'), handEl = el.querySelector('.hand'), acts = el.querySelector('.acts');
      var busy = false, over = false, order = null, fast = false;
      function cardHtml(c, extra) { return '<div class="dcard ' + (isAtk(c) ? 'atk' : 'def') + ' t-' + c.t + (extra || '') + '"><span class="ct">' + NAME[c.t] + '</span><span class="cv">' + c.v + '</span></div>'; }
      function bars() {
        el.querySelector('.me .hpbar').innerHTML = UI.bar(me.hp, me.maxHp, 'red'); el.querySelector('.me .hpn').textContent = Math.max(0, Math.round(me.hp)) + ' / ' + me.maxHp;
        el.querySelector('.en .hpbar').innerHTML = UI.bar(en.hp, en.maxHp, 'red'); el.querySelector('.en .hpn').textContent = Math.max(0, Math.round(en.hp)) + ' / ' + en.maxHp;
        el.querySelector('.enhand').innerHTML = en.hand.map(function () { return '<div class="dcard back"></div>'; }).join('');
        handEl.innerHTML = me.hand.map(function (c, i) { return '<button class="dcard-btn" data-i="' + i + '"><small>' + (i + 1) + '</small>' + cardHtml(c, order === i ? ' on' : '') + '</button>'; }).join('');
        U.$$('[data-i]', handEl).forEach(function (b) { b.onclick = function () { press(+b.dataset.i); }; });
      }
      function shake(sel) { var e = el.querySelector(sel + ' .pp'); e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit'); }
      /** 상대의 버릇을 읽어 알맞은 막기 패를 내거나, 가장 센 공격 패를 낸다 */
      function pickFor(f, hist, readK) {
        var hand = f.hand, recent = hist.slice(-3).filter(function (t) { return ATK.indexOf(t) >= 0; });
        if (recent.length >= 2 && U.chance(readK)) {
          var cnt = {}; recent.forEach(function (t) { cnt[t] = (cnt[t] || 0) + 1; });
          var fav = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
          var gi = -1; hand.forEach(function (c, i) { if (c.t === GUARD_OF[fav] && (gi < 0 || c.v > hand[gi].v)) gi = i; });
          if (gi >= 0) return gi;
        }
        if (f.hp < f.maxHp * 0.35 && U.chance(0.35)) { var di = -1; hand.forEach(function (c, i) { if (!isAtk(c) && (di < 0 || c.v > hand[di].v)) di = i; }); if (di >= 0) return di; }
        var best = -1, bs = -1;
        hand.forEach(function (c, i) { if (!isAtk(c)) return; var sc = c.v * (c.t === f.style ? 1.25 : 1) + U.rand(); if (sc > bs) { bs = sc; best = i; } });
        return best >= 0 ? best : Math.floor(U.rand() * hand.length);
      }
      function finish(res) {
        over = true;
        if (!proxy) p.hp = U.clamp(Math.round(100 * me.hp / me.maxHp), 5, 100);
        setTimeout(function () { win.close(res); if (G.Audio) G.Audio.music(G.Game.sceneName === 'sea' ? 'sea' : 'town'); resolve(res); }, proxy ? 1500 : 1000);
      }
      function turn(i) {
        if (busy || over) return; busy = true;
        var a = me.hand[i], ei = pickFor(en, myHist, 0.25 + en.skill * 0.12), b = en.hand[ei];
        myHist.push(a.t); enHist.push(b.t);
        me.hand.splice(i, 1); en.hand.splice(ei, 1);
        el.querySelector('.slot.me').innerHTML = cardHtml(a, ' played'); el.querySelector('.slot.en').innerHTML = cardHtml(b, ' played');
        if (G.Audio) G.Audio.sfx('sword');
        var who = proxy ? U.esc(me.name) : '나', subj = proxy ? U.esc(me.name) + U.jx(me.name, '이/가') : '내가', txt = '', dMe = 0, dEn = 0;
        var aA = isAtk(a), bA = isAtk(b);
        function crit(h) { return h.crit ? ' <b class="warn-text">필살!</b>' : ''; }
        if (aA && bA) {
          var h1 = hit(me, en, a.v, a.t), h2 = hit(en, me, b.v, b.t);
          if (a.v > b.v) h2.d = Math.round(h2.d * 0.6); else if (b.v > a.v) h1.d = Math.round(h1.d * 0.6);
          dEn = h1.d; dMe = h2.d;
          txt = '칼날이 엇갈렸다! ' + (proxy ? who : '나') + ' ' + NAME[a.t] + ' <b>' + h1.d + '</b>' + crit(h1) + ' · ' + U.esc(en.name) + ' ' + NAME[b.t] + ' <b>' + h2.d + '</b>' + crit(h2);
        } else if (aA && !bA) {
          if (STOPS[b.t] === a.t) {
            if (b.v >= a.v) { var c1 = hit(en, me, b.v - a.v + 2, en.style); c1.d = Math.round(c1.d * 0.6); dMe = c1.d; txt = U.esc(en.name) + U.jx(en.name, '이/가') + ' ' + NAME[a.t] + U.jx(NAME[a.t], '을/를') + ' ' + NAME[b.t] + '로 받아 되받아쳤다! <b>' + c1.d + '</b>'; }
            else txt = U.esc(en.name) + U.jx(en.name, '이/가') + ' ' + NAME[a.t] + U.jx(NAME[a.t], '을/를') + ' 막아 냈다.';
          } else { var h3 = hit(me, en, a.v, a.t); h3.d = Math.round(h3.d * (1 - Math.min(0.5, b.v * 0.06))); dEn = h3.d; txt = U.esc(en.name) + '의 ' + NAME[b.t] + U.jx(NAME[b.t], '이/가') + ' 어긋났다! ' + (proxy ? who + '의 ' : '나의 ') + NAME[a.t] + ' <b>' + h3.d + '</b>' + crit(h3); }
        } else if (!aA && bA) {
          if (STOPS[a.t] === b.t) {
            if (a.v >= b.v) { var c2 = hit(me, en, a.v - b.v + 2, me.style); c2.d = Math.round(c2.d * 0.6); dEn = c2.d; txt = subj + ' ' + NAME[b.t] + U.jx(NAME[b.t], '을/를') + ' ' + NAME[a.t] + '로 받아 되받아쳤다! <b>' + c2.d + '</b>'; }
            else txt = subj + ' ' + NAME[b.t] + U.jx(NAME[b.t], '을/를') + ' 막아 냈다.';
          } else { var h4 = hit(en, me, b.v, b.t); h4.d = Math.round(h4.d * (1 - Math.min(0.5, a.v * 0.06))); dMe = h4.d; txt = (proxy ? who + '의 ' : '나의 ') + NAME[a.t] + U.jx(NAME[a.t], '이/가') + ' 어긋났다! ' + U.esc(en.name) + '의 ' + NAME[b.t] + ' <b>' + h4.d + '</b>' + crit(h4); }
        } else txt = '서로 틈을 노리며 거리를 잰다...';
        en.hp -= dEn; me.hp -= dMe;
        if (dEn) shake('.en'); if (dMe) shake('.me');
        me.hand.push(drawCard(me)); en.hand.push(drawCard(en));
        if (proxy && order != null) order = null;
        log.innerHTML = txt; bars();
        if (en.hp <= 0) { log.innerHTML += '<br><span class="good-text">' + (proxy ? U.esc(me.name) + U.jx(me.name, '이/가') + ' 이겼다!' : '승리했다!') + '</span>'; return finish('win'); }
        if (me.hp <= 0) { log.innerHTML += '<br><span class="warn-text">' + (proxy ? U.esc(me.name) + U.jx(me.name, '이/가') + ' 쓰러졌다...' : '쓰러지고 말았다...') + '</span>'; return finish('lose'); }
        setTimeout(function () { busy = false; if (proxy) auto(); }, 300);
      }
      function press(i) { if (i < 0 || i >= me.hand.length) return; if (proxy) { order = order === i ? null : i; bars(); } else turn(i); }
      if (proxy) { var fb = U.el('button', 'btn ghost', '빨리 보기'); fb.onclick = function () { fast = !fast; fb.classList.toggle('on', fast); }; acts.appendChild(fb); }
      var fl = U.el('button', 'btn ghost', proxy ? '물러서게 한다' : '물러선다'); fl.onclick = function () { if (busy || over) return; busy = true; log.innerHTML = proxy ? U.esc(me.name) + U.jx(me.name, '을/를') + ' 불러들였다.' : '싸움을 피해 물러섰다.'; finish('flee'); }; acts.appendChild(fl);
      // 대리 결투: 동료가 스스로 한 장씩 낸다 (지시한 패가 있으면 그것을)
      var autoT = null;
      function auto() { if (!proxy || over) return; clearTimeout(autoT); autoT = setTimeout(function () { if (over) return; turn(order != null ? order : pickFor(me, enHist, 0.25 + me.skill * 0.12)); }, fast ? 380 : 1100); }
      if (proxy) auto();
      var unkey = UI.pushKey(function (e) { var n = parseInt(e.key, 10); if (n >= 1 && n <= HAND) { press(n - 1); return true; } if (e.key === 'Escape') { fl.onclick(); return true; } return false; });
      win.result.then(unkey);
      G.Games._duelDebug = { me: me, en: en, turn: turn, pick: function () { return pickFor(en, myHist, 1); } };
      bars();
    });
  };
})(window.G = window.G || {});
