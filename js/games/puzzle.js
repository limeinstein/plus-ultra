/* Ruin puzzles: tower of Hanoi and balance scale. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  G.Games = G.Games || {};

  G.Games.puzzle = function (d) {
    var k = U.strHash(d.id) % 2;
    return k === 0 ? hanoi(d) : balance(d);
  };

  // ---------------------------------------------------------------- tower of Hanoi (4 discs, move limit)
  function hanoi(d) {
    var N = 4, limit = 21, moves = 0, sel = null;
    var pegs = [[4, 3, 2, 1], [], []];
    return new Promise(function (resolve) {
      var win = UI.window({ title: '유적의 장치 — 돌 원반', icon: 'gear', width: 820, closable: false, html:
        '<div style="font-size:18px;line-height:1.6;margin-bottom:10px">석판에 새겨진 글: 「큰 돌은 작은 돌 위에 놓일 수 없다. 모든 돌을 오른쪽 기둥으로 옮겨라.」<br><span class="muted">기둥을 눌러 맨 위의 원반을 집고, 다른 기둥을 눌러 내려놓으십시오. (' + limit + '수 이내)</span></div>' +
        '<div class="hanoi"></div><div class="hstat center" style="font-size:18px;margin-top:8px"></div>',
        buttons: [{ label: '포기한다', value: 'give', cls: 'ghost', onClick: function () { resolve(false); } }] });
      var box = win.content.querySelector('.hanoi'), stat = win.content.querySelector('.hstat');
      function draw() {
        box.innerHTML = pegs.map(function (p, i) {
          return '<div class="peg' + (sel === i ? ' sel' : '') + '" data-i="' + i + '"><div class="pole"></div>' + p.map(function (disc) { return '<div class="disc" style="width:' + (40 + disc * 32) + 'px;background:hsl(' + (30 + disc * 12) + ',45%,' + (32 + disc * 6) + '%)"></div>'; }).join('') + '</div>';
        }).join('');
        stat.textContent = '움직인 수: ' + moves + ' / ' + limit;
        U.$$('.peg', box).forEach(function (e) { e.onclick = function () { click(+e.dataset.i); }; });
      }
      function click(i) {
        if (sel == null) { if (pegs[i].length) sel = i; }
        else if (sel === i) sel = null;
        else {
          var a = pegs[sel], b = pegs[i];
          if (!b.length || b[b.length - 1] > a[a.length - 1]) { b.push(a.pop()); moves++; if (G.Audio) G.Audio.sfx('click'); }
          else UI.toast('큰 돌은 작은 돌 위에 놓을 수 없다.', 'info', 1500);
          sel = null;
        }
        draw();
        if (pegs[2].length === N) { stat.innerHTML = '<span class="good-text">철컥! 장치가 풀렸다!</span>'; setTimeout(function () { win.close(true); resolve(true); }, 900); }
        else if (moves >= limit) { stat.innerHTML = '<span class="warn-text">돌이 굳어 더 이상 움직이지 않는다...</span>'; setTimeout(function () { win.close(false); resolve(false); }, 1200); }
      }
      draw();
    });
  }

  // ---------------------------------------------------------------- balance scale: find the heavier jewel among 9 in 2 weighings
  function balance(d) {
    var heavy = U.ri(0, 8), left = [], right = [], tries = 2, phase = 'weigh';
    return new Promise(function (resolve) {
      var win = UI.window({ title: '유적의 장치 — 천칭', icon: 'scales', width: 860, closable: false, html:
        '<div style="font-size:18px;line-height:1.6;margin-bottom:10px">제단 위의 아홉 보석 가운데 하나만 조금 무겁다. 「천칭을 두 번만 써서 진짜 보석을 가려내라. 틀리면 문은 영원히 닫힌다.」<br><span class="muted">보석을 눌러 왼쪽·오른쪽 접시에 올린 뒤 「단다」를 누르십시오. 다 쟀으면 「고른다」로 답하십시오.</span></div>' +
        '<div class="gems"></div><div class="pans"><div class="pan L"></div><div class="beam"></div><div class="pan R"></div></div><div class="bstat center" style="font-size:18px;margin-top:10px"></div>',
        buttons: [{ label: '단다', value: 'w', cls: 'navy', onClick: function () { weigh(); return false; } }, { label: '고른다', value: 'p', onClick: function () { phase = 'pick'; draw(); return false; } }, { label: '포기한다', value: 'g', cls: 'ghost', onClick: function () { resolve(false); } }] });
      var c = win.content, tilt = 0, msg = '천칭을 쓸 수 있는 횟수: 2';
      function where(i) { return left.indexOf(i) >= 0 ? 'L' : right.indexOf(i) >= 0 ? 'R' : ''; }
      function draw() {
        c.querySelector('.gems').innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { var w = where(i); return '<div class="gem ' + w + '" data-i="' + i + '">' + (i + 1) + (w ? '<small>' + (w === 'L' ? '왼' : '오') + '</small>' : '') + '</div>'; }).join('');
        c.querySelector('.pans').style.transform = 'rotate(' + tilt * 6 + 'deg)';
        c.querySelector('.pan.L').textContent = left.map(function (i) { return i + 1; }).join(' ');
        c.querySelector('.pan.R').textContent = right.map(function (i) { return i + 1; }).join(' ');
        c.querySelector('.bstat').innerHTML = phase === 'pick' ? '<b>무거운 보석을 고르십시오.</b>' : msg;
        U.$$('.gem', c).forEach(function (e) { e.onclick = function () { gem(+e.dataset.i); }; });
      }
      function gem(i) {
        if (phase === 'pick') {
          if (i === heavy) { c.querySelector('.bstat').innerHTML = '<span class="good-text">문이 열렸다!</span>'; setTimeout(function () { win.close(true); resolve(true); }, 900); }
          else { c.querySelector('.bstat').innerHTML = '<span class="warn-text">바닥이 흔들리며 문이 닫혔다... (' + (heavy + 1) + '번이 진짜였다)</span>'; setTimeout(function () { win.close(false); resolve(false); }, 1500); }
          return;
        }
        var w = where(i);
        if (!w) left.push(i); else if (w === 'L') { left.splice(left.indexOf(i), 1); right.push(i); } else right.splice(right.indexOf(i), 1);
        draw();
      }
      function weigh() {
        if (phase === 'pick') return;
        if (tries <= 0) { msg = '더 이상 천칭을 쓸 수 없다. 「고른다」를 누르십시오.'; draw(); return; }
        if (!left.length || left.length !== right.length) { msg = '양쪽 접시에 같은 개수를 올려야 한다.'; draw(); return; }
        tries--;
        var l = left.indexOf(heavy) >= 0, r = right.indexOf(heavy) >= 0;
        tilt = l ? -1 : r ? 1 : 0;
        msg = (l ? '왼쪽이 무겁다!' : r ? '오른쪽이 무겁다!' : '천칭이 평형을 이루었다.') + ' (남은 횟수 ' + tries + ')';
        if (G.Audio) G.Audio.sfx('click');
        left = []; right = [];
        draw();
      }
      draw();
    });
  }
})(window.G = window.G || {});
