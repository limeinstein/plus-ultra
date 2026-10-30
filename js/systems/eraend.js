/* 대항해시대의 끝 (G.EraEnd) — 2026-10-31 사용자 요청
   1700년 1월 1일이 되면 게임이 끝난다 (시간의 끝 · 어떻게 보면 Game Over).
   · 그날이 되면 세월이 더 흐르지 않는다 (main.js Game.newDay · passDays — 1700년 1월 1일에서 멈춘다).
   · 도시·바다·뭍에서 다른 창이 없을 때(main.js loop → EE.tick) 온 화면 나레이션을 보여 준 뒤
     「항해의 끝」 결산(G.Ending.show('era'))을 거쳐 타이틀로 돌아간다.
   · 그날을 넘긴 저장을 불러와도 곧바로 끝난다. 끝나기 한 해 전(1699년 1월 1일)과 한 달 전(12월 1일)에 소식으로 귀띔한다.
   · 수명·대 잇기보다 앞선다: 같은 날 수명이 다해도 시대의 끝을 보여 준다 (lifespan.js LF.tick · family.js 세월이 흐른다).
   조정값: G.BALANCE.eraEnd = { y, m, d } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var EE = G.EraEnd = {};
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.eraEnd) || { y: 1700, m: 1, d: 1 }; }
  EE.date = function () { var k = K(); return { y: k.y, m: k.m || 1, d: k.d || 1 }; };

  EE.LINES = [
    ['한때 우리의 미지는 수평선 너머에 있었다.', '용기는 그 너머로 배를 이끌었고,', '우리는 바다의 끝을 찾아 돛을 올렸다.', '그러나 발견한 것은 끝이 없는 세계였다.'],
    ['세계는 멈추지 않고,', '후세는 우리의 어깨 위에 서서', '지식이 닿은 자리 너머를 상상할 것이다.'],
    ['대항해시대의 마지막 항해가 끝났다.', '다음 시대의 첫 번째 여명이 밝아오고 있었다.']
  ];

  /** 시대가 끝났는가 (그날이 되었거나 지났다) */
  EE.over = function (s) {
    s = s || S();
    if (!s || !s.date) return false;
    if (s.eraEnd) return true;
    return U.dateNum(s.date) >= U.dateNum(EE.date());
  };
  /** 날마다 (main.js Game.newDay) — 그날이 되면 표시하고, 한 해 전·한 달 전에는 소식으로 */
  EE.daily = function () {
    var s = S(), out = [], e = EE.date();
    if (!s || !s.date) return out;
    if (!s.eraEnd && U.dateNum(s.date) >= U.dateNum(e)) {
      s.eraEnd = { at: U.dateNum(s.date) };
      G.State.log(e.y + '년 ' + e.m + '월 ' + e.d + '일 — 대항해시대가 막을 내렸다.');
      return out;
    }
    var today = U.dateNum(s.date);
    if (today === U.dateNum({ y: e.y - 1, m: e.m, d: e.d }))
      out.push({ icon: 'hourglass', history: true, text: '새해가 밝았다. 세상은 저물어 가는 한 시대를 이야기한다 — 대항해시대에 남은 날은 이제 한 해뿐이다.' });
    else if (today === U.dateNum(U.addDays(e, -31)))
      out.push({ icon: 'hourglass', history: true, text: '한 해가 저문다. 다음 새해가 밝으면 대항해시대도 막을 내린다 — 마지막 항해를 서두르라.' });
    return out;
  };

  function ready() {
    var g = G.Game;
    if (UI.busy() || EE.running) return false;
    if (['city', 'sea', 'land'].indexOf(g.sceneName) < 0) return false;
    var rt = g.scene && g.scene.runtime ? g.scene.runtime() : null;
    if (rt && rt.busy) return false;
    if (g.sceneName === 'city' && G.Scenes.city.busy && G.Scenes.city.busy()) return false;
    return true;
  }
  /** 화면 틈에 (main.js loop — 다른 tick보다 먼저) */
  EE.tick = function () {
    var s = S();
    if (!s || !s.player || !EE.over(s) || !ready()) return;
    if (!s.eraEnd) s.eraEnd = { at: U.dateNum(s.date), late: true };   // 그날을 넘긴 옛 저장
    EE.running = s;
    var ov = EE.mount();   // 창보다 먼저 막을 친다 — 같은 프레임의 다른 tick(수명·이별·첫사랑…)이 창을 띄우지 않게
    (async function () {
      try { await EE.play(ov); await G.Ending.show('era'); }
      catch (e) { console.error(e); try { ov.remove(); } catch (e2) { /* 이미 없다 */ } UI.fade(function () { G.Game.go('title'); }); }
      if (EE.running === s) EE.running = null;
    })();
  };

  // ---------------------------------------------------------------- 온 화면 나레이션
  EE.mount = function () {
    var ov = U.el('div', 'era-end');
    var bg = G.Img && G.Img.has('title') ? G.Img.src('title') : '';
    ov.innerHTML = '<div class="ee-bg"' + (bg ? ' style="background-image:url(\'' + U.esc(bg) + '\')"' : '') + '></div><div class="ee-dawn"></div><div class="ee-veil"></div>' +
      '<div class="ee-date"></div><div class="ee-text"></div><div class="ee-finis"></div>' +
      '<button class="ee-skip" type="button">건너뛰기 ▸▸</button><button class="ee-next" type="button" hidden>항해의 끝</button>';
    var e = EE.date();
    ov.querySelector('.ee-date').textContent = e.y + '년 ' + e.m + '월 ' + e.d + '일';
    (UI.modalRoot && UI.modalRoot() || document.getElementById('stage')).appendChild(ov);
    return ov;
  };
  function wait(ms, ctl) {
    return new Promise(function (res) {
      var t = setTimeout(done, ms);
      function done() { clearTimeout(t); ctl.hurry = null; res(); }
      ctl.hurry = done;
    });
  }
  /** 나레이션을 한 줄씩 — 누르면(클릭·Enter·Space) 다음 줄로, 「건너뛰기」는 끝까지 */
  EE.play = function (ov) {
    var ctl = { hurry: null, skip: false }, text = ov.querySelector('.ee-text');
    var fast = !!(EE.fast || (G.Game.state && G.Game.state.flags && G.Game.state.flags.qaFast));
    var T = fast ? { open: 20, line: 10, hold: 10, gap: 10, dawn: 10 } : { open: 2200, line: 2600, hold: 2400, gap: 1200, dawn: 3200 };
    function poke(ev) {
      if (ev && ev.type === 'keydown' && ['Enter', ' ', 'Spacebar', 'Escape'].indexOf(ev.key) < 0) return;
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      if (ev && ev.key === 'Escape') ctl.skip = true;
      if (ctl.hurry) ctl.hurry();
    }
    ov.addEventListener('click', poke);
    window.addEventListener('keydown', poke, true);
    ov.querySelector('.ee-skip').addEventListener('click', function (ev) { ev.stopPropagation(); ctl.skip = true; if (ctl.hurry) ctl.hurry(); });
    if (G.Audio && G.Audio.music) { try { G.Audio.music('title'); } catch (e) { /* 소리 없음 */ } }
    return (async function () {
      requestAnimationFrame(function () { ov.classList.add('on'); });
      await wait(T.open, ctl);
      ov.classList.add('dated');
      for (var si = 0; si < EE.LINES.length; si++) {
        var last = si === EE.LINES.length - 1;
        if (ctl.skip) break;
        text.innerHTML = ''; text.className = 'ee-text' + (last ? ' last' : '');
        ov.classList.toggle('lift', si >= 1);
        for (var li = 0; li < EE.LINES[si].length; li++) {
          if (ctl.skip) break;
          if (last && li === 1) { ov.classList.add('dawn'); if (G.Audio && G.Audio.sfx) { try { G.Audio.sfx('discover'); } catch (e) { /* 소리 없음 */ } } await wait(T.dawn, ctl); }
          var p = U.el('p', 'ee-line'); p.textContent = EE.LINES[si][li]; text.appendChild(p);
          requestAnimationFrame(function (q) { return function () { q.classList.add('in'); }; }(p));
          await wait(T.line, ctl);
        }
        if (ctl.skip) break;
        await wait(T.hold, ctl);
        if (!last) { text.classList.add('out'); await wait(T.gap, ctl); }
      }
      // 건너뛰었으면 마지막 두 줄을 남긴다
      if (ctl.skip) {
        ov.classList.add('dated', 'lift', 'dawn');
        text.className = 'ee-text last';
        text.innerHTML = EE.LINES[EE.LINES.length - 1].map(function (l) { return '<p class="ee-line in">' + U.esc(l) + '</p>'; }).join('');
      }
      ov.querySelector('.ee-finis').textContent = 'FINIS · ' + EE.date().y;
      ov.classList.add('done');
      var skip = ov.querySelector('.ee-skip'), next = ov.querySelector('.ee-next');
      skip.hidden = true; next.hidden = false;
      await new Promise(function (res) {
        function go(ev) { if (ev && ev.type === 'keydown' && ['Enter', ' ', 'Spacebar', 'Escape'].indexOf(ev.key) < 0) return; if (ev) { ev.preventDefault(); ev.stopPropagation(); } window.removeEventListener('keydown', go, true); res(); }
        next.addEventListener('click', go);
        window.addEventListener('keydown', go, true);
        if (fast) setTimeout(go, 10);
        try { next.focus(); } catch (e) { /* 초점 없음 */ }
      });
      window.removeEventListener('keydown', poke, true);
      ov.classList.add('leave');
      await new Promise(function (r) { setTimeout(r, fast ? 10 : 700); });
      ov.remove();
    })();
  };
})(window.G = window.G || {});
