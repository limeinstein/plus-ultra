/* 일기토 (duel): slash / thrust / guard, rock-paper-scissors with stats. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  G.Games = G.Games || {};
  var ACT = { slash: '베기', thrust: '찌르기', guard: '막기' };
  // guard beats slash, thrust beats guard, slash beats thrust
  var BEATS = { guard: 'slash', thrust: 'guard', slash: 'thrust' };

  /** 부관 등 동료가 대신 싸울 때의 능력: 힘 → 체력, 무력 → 공격, 힘 → 방어, 검술 */
  G.Games.mateFighter = function (m) {
    var d = G.MATE[m.id], st = (d && d.st) || [55, 50, 55, 50];
    return { name: d ? d.name : '부관', portrait: G.Scenes.mateSpec(m.id), maxHp: Math.round(60 + st[0] * 0.6), atk: 3 + Math.round(st[2] / 10), def: 1 + Math.floor(st[0] / 30), skill: R.mateSkill(m, 'sword'), mar: st[2], m: m };
  };
  /** 대신 싸울 부관 (기함의 부관이 있고 다치지 않았으면) */
  G.Games.proxy = function () {
    var s = G.Game.state, m = s.mates.filter(function (x) { return x.role === 'first'; })[0];
    return m && !R.mateHurt(m) ? m : null;
  };
  /** enemy: {name, portrait, str, atk, def, skill, mar}, opt: {mate: 동료} — 동료가 대신 싸우면 스스로 수를 고르고(1~3으로 다음 수를 지시할 수 있다) 제독은 다치지 않는다.
      returns 'win' | 'lose' | 'flee' */
  G.Games.duel = function (enemy, opt) {
    var s = G.Game.state, p = s.player, proxy = opt && opt.mate ? G.Games.mateFighter(opt.mate) : null;
    var me = proxy || { name: p.name, maxHp: Math.round(60 + p.st.str * 0.6), atk: R.atk(), def: R.def(), skill: p.sk.sword || 0, mar: p.st.mar };
    me.hp = proxy ? me.maxHp : Math.max(8, Math.round(me.maxHp * p.hp / 100));
    var en = { name: enemy.name, maxHp: Math.round(60 + (enemy.str || 60) * 0.6), atk: enemy.atk || 8, def: enemy.def || 2, skill: enemy.skill || 0, mar: enemy.mar || 55 };
    en.hp = en.maxHp;
    var hist = [];
    if (G.Audio) G.Audio.music('battle');
    return new Promise(function (resolve) {
      var html = '<div class="duel">' +
        '<div class="side me"><div class="pp"></div><div class="nm">' + U.esc(me.name) + '</div><div class="hpbar"></div><div class="hpn"></div></div>' +
        '<div class="mid"><div class="vs">VS</div><div class="dlog">' + (proxy ? U.esc(me.name) + U.jx(me.name, '이/가') + ' 제독 대신 검을 뽑았다. 1~3으로 다음 수를 지시할 수 있다.' : '검을 뽑았다. 상대의 움직임을 읽어라!') + '</div><div class="acts"></div><div class="rule muted">막기 → 베기를 막는다 · 찌르기 → 막기를 뚫는다 · 베기 → 찌르기를 쳐낸다</div></div>' +
        '<div class="side en"><div class="pp"></div><div class="nm">' + U.esc(en.name) + '</div><div class="hpbar"></div><div class="hpn"></div></div></div>';
      var win = UI.window({ title: '일기토', icon: 'sword', width: 1060, html: html, closable: false });
      var el = win.content;
      if (proxy) { if (proxy.portrait) el.querySelector('.me .pp').appendChild(A.portraitCanvas(proxy.portrait, 190)); win.el.querySelector('.title span').textContent = '일기토 — ' + me.name + ' (대리)'; }
      else if (p.portrait) el.querySelector('.me .pp').appendChild(A.portraitCanvas(p.portrait, 190));
      if (enemy.portrait) el.querySelector('.en .pp').appendChild(A.portraitCanvas(enemy.portrait, 190));
      var log = el.querySelector('.dlog'), acts = el.querySelector('.acts'), busy = false;
      function bars() {
        el.querySelector('.me .hpbar').innerHTML = UI.bar(me.hp, me.maxHp, 'red'); el.querySelector('.me .hpn').textContent = Math.max(0, Math.round(me.hp)) + ' / ' + me.maxHp;
        el.querySelector('.en .hpbar').innerHTML = UI.bar(en.hp, en.maxHp, 'red'); el.querySelector('.en .hpn').textContent = Math.max(0, Math.round(en.hp)) + ' / ' + en.maxHp;
      }
      function dmg(a, b) { var d = a.atk * 1.4 + a.mar * 0.12 + a.skill * 3 - b.def * 0.8 + U.rf(0, 4); if (U.chance(0.1 + a.skill * 0.04)) d *= 1.6; return Math.max(1, Math.round(d)); }
      function aiMove() {
        var recent = hist.slice(-3), cnt = { slash: 0, thrust: 0, guard: 0 };
        recent.forEach(function (h) { cnt[h]++; });
        var fav = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
        if (recent.length && U.chance(0.3 + en.skill * 0.1)) { for (var k in BEATS) if (BEATS[k] === fav) return k; }
        return U.pick(['slash', 'thrust', 'guard']);
      }
      function shake(sel) { var e = el.querySelector(sel + ' .pp'); e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit'); }
      var over = false, order = null, fast = false, ehist = [];
      function finish(res) {
        over = true;
        if (!proxy) p.hp = U.clamp(Math.round(100 * me.hp / me.maxHp), 5, 100);
        setTimeout(function () { win.close(res); if (G.Audio) G.Audio.music(G.Game.sceneName === 'sea' ? 'sea' : 'town'); resolve(res); }, proxy ? 1400 : 900);
      }
      /* 대리로 싸우는 동료의 수: 지시가 있으면 그대로, 없으면 검술이 높을수록 상대의 버릇을 읽어 받아친다 */
      function mateMove() {
        if (order) { var o = order; order = null; return o; }
        var recent = ehist.slice(-3), cnt = { slash: 0, thrust: 0, guard: 0 };
        recent.forEach(function (h) { cnt[h]++; });
        var fav = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
        if (recent.length && U.chance(0.25 + me.skill * 0.12)) { for (var k in BEATS) if (BEATS[k] === fav) return k; }
        return U.pick(['slash', 'thrust', 'guard']);
      }
      function turn(a) {
        if (busy || over) return; busy = true;
        var b = aiMove(); hist.push(a); ehist.push(b);
        if (G.Audio) G.Audio.sfx('sword');
        var txt = (proxy ? U.esc(me.name) : '나') + ': ' + ACT[a] + ' / ' + en.name + ': ' + ACT[b] + ' — ';
        if (BEATS[a] === b) { var d = dmg(me, en); en.hp -= d; txt += '<b>' + d + '</b>의 타격을 주었다!'; shake('.en'); }
        else if (BEATS[b] === a) { var d2 = dmg(en, me); me.hp -= d2; txt += '<b>' + d2 + '</b>의 타격을 받았다!'; shake('.me'); }
        else if (a === 'guard') txt += '서로 노려보고 있다...';
        else { var x = Math.round(dmg(me, en) * 0.5), y = Math.round(dmg(en, me) * 0.5); en.hp -= x; me.hp -= y; txt += '칼날이 부딪혔다! (' + x + ' / ' + y + ')'; shake('.me'); shake('.en'); }
        log.innerHTML = txt; bars();
        if (en.hp <= 0) { log.innerHTML += '<br><span class="good-text">' + (proxy ? U.esc(me.name) + U.jx(me.name, '이/가') + ' 이겼다!' : '승리했다!') + '</span>'; return finish('win'); }
        if (me.hp <= 0) { log.innerHTML += '<br><span class="warn-text">' + (proxy ? U.esc(me.name) + U.jx(me.name, '이/가') + ' 쓰러졌다...' : '쓰러지고 말았다...') + '</span>'; return finish('lose'); }
        setTimeout(function () { busy = false; if (proxy) auto(); }, 250);
      }
      var orderBtns = [];
      function mark() { orderBtns.forEach(function (o) { o.b.classList.toggle('on', order === o.k); }); }
      function press(k) { if (proxy) { order = order === k ? null : k; mark(); } else turn(k); }
      [['slash', '베기'], ['thrust', '찌르기'], ['guard', '막기']].forEach(function (x, i) {
        var bt = U.el('button', 'btn' + (i === 0 ? ' red' : i === 1 ? ' navy' : ''), (i + 1) + '. ' + (proxy ? x[1] + ' 지시' : x[1])); bt.onclick = function () { press(x[0]); }; acts.appendChild(bt);
        orderBtns.push({ b: bt, k: x[0] });
      });
      if (proxy) { var fb = U.el('button', 'btn ghost', '빨리 보기'); fb.onclick = function () { fast = !fast; fb.classList.toggle('on', fast); }; acts.appendChild(fb); }
      var fl = U.el('button', 'btn ghost', proxy ? '물러서게 한다' : '물러선다'); fl.onclick = function () { if (busy || over) return; busy = true; log.innerHTML = proxy ? U.esc(me.name) + U.jx(me.name, '을/를') + ' 불러들였다.' : '싸움을 피해 물러섰다.'; finish('flee'); }; acts.appendChild(fl);
      // 대리 결투: 동료가 스스로 한 수씩 둔다 (지시한 수가 있으면 그것을)
      var autoT = null;
      function auto() { if (!proxy || over) return; clearTimeout(autoT); autoT = setTimeout(function () { if (over) return; turn(mateMove()); mark(); }, fast ? 320 : 950); }
      if (proxy) auto();
      var unkey = UI.pushKey(function (e) { if (e.key === '1') { press('slash'); return true; } if (e.key === '2') { press('thrust'); return true; } if (e.key === '3') { press('guard'); return true; } if (e.key === 'Escape') { fl.onclick(); return true; } return false; });
      win.result.then(unkey);
      bars();
    });
  };
})(window.G = window.G || {});
