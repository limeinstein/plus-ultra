/* 유적의 장치 (퍼즐) — 잠긴 보물·유적을 열 때 푸는 미니게임.
   · 여섯 가지: 돌 원반(하노이의 탑) · 천칭 · 성배의 물 나누기 · 미궁 64 · 돌 입방체 · 스핑크스의 수수께끼(2차방정식)
     앞의 둘은 이 파일, 뒤의 넷은 js/games/puzzle2.js 에 있다 (G.Games.pz[종류](d, 난이도)).
   · 난이도(★1~3)는 발견물의 어려움(pw)에서 정한다: pw 1~2 → ★1, 3 → ★2, 4~5 → ★3.
   · 어느 발견물이 어떤 장치로 잠겨 있는지는 게임을 시작할 때마다 같다(발견물 id로 정함).
     한 지역(G.REGIONS)에 같은 장치가 몰리지 않도록, 지역마다 가장 적게 쓰인 장치부터 차례로 나눠 준다.
     이름난 곳은 어울리는 장치를 먼저 받는다 (기자 → 스핑크스, 크노소스 → 미궁, 성배 → 성배, 바벨탑 → 돌 원반 …).
   조정값: G.Games.PUZZLE_LOCK — 유적이 잠겨 있을 비율 (보물은 늘 잠겨 있다) */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var GM = G.Games = G.Games || {};
  GM.pz = GM.pz || {};

  GM.PUZZLE_TYPES = ['hanoi', 'balance', 'grail', 'maze', 'cube', 'sphinx'];
  GM.PUZZLE_NAME = { hanoi: '돌 원반', balance: '천칭', grail: '성배의 물', maze: '미궁 64', cube: '돌 입방체', sphinx: '스핑크스의 수수께끼' };
  GM.PUZZLE_LOCK = 0.5;
  // 이름난 곳에 어울리는 장치 (지역 나눔보다 먼저)
  GM.PUZZLE_FIX = { giza: 'sphinx', pyramid: 'sphinx', kings: 'sphinx', knossos: 'maze', minotaur: 'maze', grail: 'grail', babel: 'hanoi', ur: 'hanoi', persepolis: 'balance', qinshi: 'cube', petra: 'grail' };
  // 지역의 결에 따라 조금 더 자주 (같은 수일 때 먼저 고른다)
  var THEME = { 4: ['sphinx', 'grail'], 2: ['maze', 'sphinx'], 1: ['grail', 'maze'], 0: ['grail', 'balance'], 6: ['cube', 'hanoi'], 9: ['cube', 'balance'], 10: ['maze', 'cube'], 5: ['balance', 'hanoi'], 8: ['hanoi', 'cube'], 3: ['balance', 'maze'], 7: ['hanoi', 'grail'] };

  /** 장치로 잠길 수 있는 발견물 (뭍으로 찾아가는 보물·유적) */
  function eligible(d) { return d && d.how === 'land' && (d.cat === 'treasure' || d.cat === 'ruin'); }
  function locked(d) {
    if (!eligible(d)) return false;
    if (d.cat === 'treasure' || GM.PUZZLE_FIX[d.id]) return true;
    return (Math.abs(U.strHash('lock:' + d.id)) % 1000) / 1000 < GM.PUZZLE_LOCK;
  }
  var MAP = null;
  /** 발견물 id → 장치 종류. 지역마다 고르게 나눈다 */
  GM.puzzleMap = function () {
    if (MAP) return MAP;
    MAP = {};
    var byReg = {};
    (G.DISCOVERIES || []).forEach(function (d) { if (locked(d)) (byReg[d.reg] = byReg[d.reg] || []).push(d); });
    Object.keys(byReg).forEach(function (rg) {
      var list = byReg[rg].slice().sort(function (a, b) { return (U.strHash('pz:' + a.id) - U.strHash('pz:' + b.id)) || (a.id < b.id ? -1 : 1); });
      var cnt = {}; GM.PUZZLE_TYPES.forEach(function (t) { cnt[t] = 0; });
      list.forEach(function (d) { var f = GM.PUZZLE_FIX[d.id]; if (f) { MAP[d.id] = f; cnt[f]++; } });
      var prev = null;
      list.forEach(function (d) {
        if (MAP[d.id]) return;
        var theme = THEME[rg] || [];
        var best = null, bk = 1e9;
        GM.PUZZLE_TYPES.forEach(function (t) {
          // 적게 쓰인 것 → 바로 앞과 다른 것 → 지역 결 → 발견물마다 다른 순서
          var k = cnt[t] * 100 + (t === prev ? 50 : 0) + (theme.indexOf(t) >= 0 ? 0 : 20) + (Math.abs(U.strHash(d.id + ':' + t)) % 10);
          if (k < bk) { bk = k; best = t; }
        });
        MAP[d.id] = best; cnt[best]++; prev = best;
      });
    });
    return MAP;
  };
  /** 이 발견물을 여는 장치 (잠겨 있지 않으면 null) */
  GM.puzzleKind = function (d) { return (d && GM.puzzleMap()[d.id]) || null; };
  /** 난이도 ★1~3 */
  GM.puzzleLevel = function (d) { var p = (d && d.pw) || 1; return p <= 2 ? 1 : p === 3 ? 2 : 3; };
  GM.stars = function (lv) { return '<span class="pz-stars" title="난이도">' + '★★★'.slice(0, lv) + '<span>' + '☆☆☆'.slice(0, 3 - lv) + '</span></span>'; };
  /** 측량사가 알리는 말 */
  GM.puzzleLine = function (d) {
    var k = GM.puzzleKind(d);
    var L = {
      hanoi: '제독, 안쪽 문 앞에 돌 원반을 끼운 기둥 셋이 서 있습니다. 원반을 옮겨야 문이 열리는 장치 같군요.',
      balance: '제독, 제단 위에 천칭과 보석들이 놓여 있습니다. 진짜 보석을 가려내야 문이 열리는 모양입니다.',
      grail: '제독, 샘물 곁에 성배와 잔들이 놓여 있습니다. 물을 정확히 나누어 담아야 문이 열린다고 새겨져 있습니다.',
      maze: '제독, 입구 너머로 방이 끝없이 이어진 미궁입니다. 횃불이 꺼지기 전에 빠져나가야 합니다.',
      cube: '제독, 바닥에 바둑판처럼 금이 그어져 있고, 한 면에 금빛 문장이 새겨진 돌 입방체가 놓여 있습니다.',
      sphinx: '제독, 문 앞에 사람 얼굴을 한 사자 석상이 버티고 있습니다. 석상의 입에서 목소리가 울려 나옵니다...'
    };
    return L[k] || '제독, 이 유적 안쪽에 무언가 있습니다. 하지만 장치로 굳게 잠겨 있군요...';
  };

  /** 장치를 푼다: true = 열렸다 */
  GM.puzzle = function (d, kind, lv) {
    var k = kind || GM.puzzleKind(d) || (U.strHash(d.id) % 2 === 0 ? 'hanoi' : 'balance');
    var v = lv || GM.puzzleLevel(d);
    var fn = GM.pz[k] || GM.pz.hanoi;
    if (G.State && G.Game && G.Game.state) G.State.log('「' + d.name + '」의 장치: ' + GM.PUZZLE_NAME[k] + ' (난이도 ' + v + ')');
    return fn(d, v);
  };
  function title(name, lv) { return '유적의 장치 — ' + name + ' ' + GM.stars(lv); }
  GM.pzTitle = title;

  // ---------------------------------------------------------------- 돌 원반 (하노이의 탑): ★1 원반 3개 · ★2 4개 · ★3 5개
  GM.pz.hanoi = function hanoi(d, lv) {
    var N = lv === 1 ? 3 : lv === 2 ? 4 : 5, best = Math.pow(2, N) - 1, limit = best + (lv === 1 ? 4 : lv === 2 ? 6 : 6), moves = 0, sel = null;
    var pegs = [[], [], []]; for (var n = N; n >= 1; n--) pegs[0].push(n);
    return new Promise(function (resolve) {
      var win = UI.window({ title: title('돌 원반', lv), icon: 'gear', width: 820, closable: false, html:
        '<div style="font-size:18px;line-height:1.6;margin-bottom:10px">석판에 새겨진 글: 「큰 돌은 작은 돌 위에 놓일 수 없다. 모든 돌을 오른쪽 기둥으로 옮겨라.」<br><span class="muted">기둥을 눌러 맨 위의 원반을 집고, 다른 기둥을 눌러 내려놓으십시오. 숫자 1·2·3 키로도 됩니다. (' + limit + '수 이내)</span></div>' +
        '<div class="hanoi"></div><div class="hstat center" style="font-size:18px;margin-top:8px"></div>',
        buttons: [{ label: '포기한다', value: 'give', cls: 'ghost', onClick: function () { resolve(false); } }],
        onKey: function (e) { var i = { 1: 0, 2: 1, 3: 2 }[e.key]; if (i != null) { click(i); return true; } return false; } });
      var box = win.content.querySelector('.hanoi'), stat = win.content.querySelector('.hstat'), done = false;
      function draw() {
        box.innerHTML = pegs.map(function (p, i) {
          return '<div class="peg' + (sel === i ? ' sel' : '') + '" data-i="' + i + '"><div class="pole"></div>' + p.map(function (disc) { return '<div class="disc" style="width:' + (40 + disc * 32) + 'px;background:hsl(' + (30 + disc * 12) + ',45%,' + (32 + disc * 6) + '%)"></div>'; }).join('') + '</div>';
        }).join('');
        stat.textContent = '움직인 수: ' + moves + ' / ' + limit + '   (가장 적게는 ' + best + '수)';
        U.$$('.peg', box).forEach(function (e) { e.onclick = function () { click(+e.dataset.i); }; });
      }
      function click(i) {
        if (done) return;
        if (sel == null) { if (pegs[i].length) sel = i; }
        else if (sel === i) sel = null;
        else {
          var a = pegs[sel], b = pegs[i];
          if (!b.length || b[b.length - 1] > a[a.length - 1]) { b.push(a.pop()); moves++; if (G.Audio) G.Audio.sfx('click'); }
          else UI.toast('큰 돌은 작은 돌 위에 놓을 수 없다.', 'info', 1500);
          sel = null;
        }
        draw();
        if (pegs[2].length === N) { done = true; stat.innerHTML = '<span class="good-text">철컥! 장치가 풀렸다!</span>'; setTimeout(function () { win.close(true); resolve(true); }, 900); }
        else if (moves >= limit) { done = true; stat.innerHTML = '<span class="warn-text">돌이 굳어 더 이상 움직이지 않는다...</span>'; setTimeout(function () { win.close(false); resolve(false); }, 1200); }
      }
      draw();
    });
  };

  // ---------------------------------------------------------------- 천칭: ★1 보석 9개·3번 · ★2 9개·2번 · ★3 27개·3번
  GM.pz.balance = function balance(d, lv) {
    var NG = lv === 3 ? 27 : 9, tries = lv === 1 ? 3 : lv === 2 ? 2 : 3;
    var heavy = U.ri(0, NG - 1), left = [], right = [], phase = 'weigh', done = false;
    var numW = ['', '한', '두', '세'][tries];
    return new Promise(function (resolve) {
      var win = UI.window({ title: title('천칭', lv), icon: 'scales', width: 900, closable: false, html:
        '<div style="font-size:18px;line-height:1.6;margin-bottom:10px">제단 위의 보석 ' + NG + '개 가운데 하나만 조금 무겁다. 「천칭을 ' + numW + ' 번만 써서 진짜 보석을 가려내라. 틀리면 문은 닫힌다.」<br><span class="muted">보석을 누르면 왼쪽 → 오른쪽 → 내려놓기 순서로 바뀝니다. 「단다」로 재고, 다 쟀으면 「고른다」로 답하십시오.</span></div>' +
        '<div class="gems' + (NG > 9 ? ' many' : '') + '"></div><div class="pans"><div class="pan L"></div><div class="beam"></div><div class="pan R"></div></div><div class="bstat center" style="font-size:18px;margin-top:10px"></div>',
        buttons: [{ label: '단다', value: 'w', cls: 'navy', onClick: function () { weigh(); return false; } }, { label: '고른다', value: 'p', onClick: function () { if (!done) { phase = 'pick'; draw(); } return false; } }, { label: '포기한다', value: 'g', cls: 'ghost', onClick: function () { resolve(false); } }] });
      var c = win.content, tilt = 0, msg = '천칭을 쓸 수 있는 횟수: ' + tries;
      function where(i) { return left.indexOf(i) >= 0 ? 'L' : right.indexOf(i) >= 0 ? 'R' : ''; }
      function draw() {
        var ids = []; for (var i = 0; i < NG; i++) ids.push(i);
        c.querySelector('.gems').innerHTML = ids.map(function (i) { var w = where(i); return '<div class="gem ' + w + '" data-i="' + i + '">' + (i + 1) + (w ? '<small>' + (w === 'L' ? '왼' : '오') + '</small>' : '') + '</div>'; }).join('');
        c.querySelector('.pans').style.transform = 'rotate(' + tilt * 6 + 'deg)';
        c.querySelector('.pan.L').textContent = left.map(function (i) { return i + 1; }).join(' ');
        c.querySelector('.pan.R').textContent = right.map(function (i) { return i + 1; }).join(' ');
        c.querySelector('.bstat').innerHTML = phase === 'pick' ? '<b>무거운 보석을 고르십시오.</b>' : msg;
        U.$$('.gem', c).forEach(function (e) { e.onclick = function () { gem(+e.dataset.i); }; });
      }
      function gem(i) {
        if (done) return;
        if (phase === 'pick') {
          done = true;
          if (i === heavy) { c.querySelector('.bstat').innerHTML = '<span class="good-text">문이 열렸다!</span>'; setTimeout(function () { win.close(true); resolve(true); }, 900); }
          else { c.querySelector('.bstat').innerHTML = '<span class="warn-text">바닥이 흔들리며 문이 닫혔다... (' + (heavy + 1) + '번이 진짜였다)</span>'; setTimeout(function () { win.close(false); resolve(false); }, 1500); }
          return;
        }
        var w = where(i);
        if (!w) left.push(i); else if (w === 'L') { left.splice(left.indexOf(i), 1); right.push(i); } else right.splice(right.indexOf(i), 1);
        draw();
      }
      function weigh() {
        if (phase === 'pick' || done) return;
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
  };
})(window.G = window.G || {});
