/* 바다 낚시 (G.Fishing) — 항해 중 배를 세우고 낚싯줄을 드리운다. 대항해시대 3의 낚시를 본뜬 새 미니게임.
   ① 던지기: 오르내리는 힘 막대를 보고 눌러 던진다 — 멀리 던질수록 깊은 곳의 큰 고기가 문다.
   ② 기다리기: 찌가 톡톡 건드려지는 것(입질 흉내)에 속지 말고, 찌가 쑥 잠기며 「!」가 뜨면 곧바로 챈다.
   ③ 끌어올리기: 누르고 있으면 줄을 감는다. 줄의 팽팽함이 초록 칸 안에 있을 때만 감긴다.
      너무 당기면 줄이 끊어지고, 너무 늦추면 고기가 바늘을 털고 달아난다. 고기가 세차게 달릴 때는 손을 놓아 줄을 풀어 준다.
   · 잡은 고기는 식량이 된다. 그 바다에만 사는 진귀한 물고기(js/data/seadisc.js의 fish)는 발견물이 된다.
   · 가끔 병 속의 편지(바다 발견물의 단서)·진주조개 같은 것이 걸려 올라온다.
   · 미끼는 하루에 G.BALANCE.fishing.bait개. 폭풍 속에서는 할 수 없다.
   조정값: G.BALANCE.fishing */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var F = G.Fishing = {};
  G.BALANCE = G.BALANCE || {};
  G.BALANCE.fishing = G.BALANCE.fishing || { bait: 3, food: 0.04, junk: 0.07, hintK: 2, rareSci: 0.25 };
  function B() { return G.BALANCE.fishing; }
  function S() { return G.Game.state; }

  // ---------------------------------------------------------------- 바다의 성질
  F.climate = function (lat) { var a = Math.abs(lat); return a < 23.5 ? 'trop' : a < 50 ? 'temp' : 'cold'; };
  F.basin = function (lon, lat) {
    if (lat > 40.5 && lat < 47.5 && lon > 27 && lon < 42) return 'black';
    if (lat > 30 && lat < 46 && lon > -5.6 && lon < 36.5) return 'med';
    if (lat > 53 && lat < 66 && lon > 9 && lon < 31) return 'baltic';
    if (lon >= 105 && lon <= 150 && lat > 15 && lat < 50) return 'east';
    if (lon < -100 || (lat < 8 && lon < -78) || (lat < -3 && lon < -68) || lon >= 105) return 'pac';
    if (lon > 20 && lat < 30) return 'ind';
    return 'atl';
  };
  var ALL = ['atl', 'med', 'black', 'baltic', 'ind', 'pac', 'east'];
  // 흔한 고기: 무게(kg), 사는 기후, 바다, 깊이(0 얕음 1 중간 2 깊음), 어려움, 흔함
  F.FISH = [
    { id: 'sardine', n: '정어리 떼', kg: [3, 12], c: ['temp'], b: ['atl', 'med', 'pac', 'east'], d: 0, diff: 1, w: 10, school: true },
    { id: 'anchovy', n: '멸치 떼', kg: [2, 8], c: ['temp', 'trop'], b: ['med', 'black', 'pac', 'east', 'atl'], d: 0, diff: 1, w: 8, school: true },
    { id: 'mackerel', n: '고등어', kg: [0.5, 1.5], c: ['temp', 'cold'], b: ['atl', 'med', 'black', 'east', 'baltic', 'pac'], d: 0, diff: 1, w: 10 },
    { id: 'herring', n: '청어 떼', kg: [2, 9], c: ['cold'], b: ['atl', 'baltic', 'pac'], d: 0, diff: 1, w: 12, school: true },
    { id: 'cod', n: '대구', kg: [4, 40], c: ['cold'], b: ['atl', 'baltic'], d: 2, diff: 2, w: 10 },
    { id: 'pollock', n: '명태', kg: [1, 4], c: ['cold'], b: ['pac', 'east'], d: 1, diff: 1, w: 8 },
    { id: 'salmon', n: '연어', kg: [3, 20], c: ['cold'], b: ['atl', 'pac', 'baltic'], d: 1, diff: 2, w: 5 },
    { id: 'halibut', n: '큰넙치', kg: [20, 150], c: ['cold'], b: ['atl', 'pac'], d: 2, diff: 3, w: 2 },
    { id: 'hake', n: '민대구', kg: [1, 6], c: ['temp', 'cold'], b: ['atl', 'pac', 'med'], d: 2, diff: 1, w: 6 },
    { id: 'flounder', n: '가자미', kg: [0.5, 3], c: ['temp', 'cold'], b: ALL, d: 2, diff: 1, w: 6 },
    { id: 'bream', n: '도미', kg: [1, 6], c: ['temp'], b: ['med', 'east', 'atl'], d: 1, diff: 2, w: 8 },
    { id: 'seabass', n: '농어', kg: [2, 10], c: ['temp'], b: ['med', 'atl', 'east', 'black'], d: 0, diff: 2, w: 6 },
    { id: 'mullet', n: '숭어', kg: [1, 5], c: ['temp', 'trop'], b: ALL, d: 0, diff: 1, w: 6 },
    { id: 'squid', n: '오징어', kg: [0.3, 2], c: ['temp', 'trop'], b: ALL, d: 1, diff: 1, w: 6 },
    { id: 'rockfish', n: '볼락', kg: [0.3, 2], c: ['temp', 'cold'], b: ['east', 'pac', 'atl'], d: 2, diff: 1, w: 5 },
    { id: 'eel', n: '붕장어', kg: [0.5, 3], c: ['temp'], b: ALL, d: 2, diff: 1, w: 4 },
    { id: 'bonito', n: '가다랑어', kg: [2, 15], c: ['trop', 'temp'], b: ALL, d: 1, diff: 2, w: 7 },
    { id: 'hairtail', n: '갈치', kg: [1, 4], c: ['temp', 'trop'], b: ['east', 'ind', 'pac'], d: 1, diff: 2, w: 7 },
    { id: 'yellowtail', n: '방어', kg: [5, 20], c: ['temp'], b: ['east'], d: 1, diff: 2, w: 6 },
    { id: 'mahi', n: '만새기', kg: [5, 25], c: ['trop'], b: ALL, d: 0, diff: 2, w: 7 },
    { id: 'barracuda', n: '꼬치고기', kg: [3, 25], c: ['trop'], b: ALL, d: 1, diff: 2, w: 6 },
    { id: 'snapper', n: '붉은 돔', kg: [2, 12], c: ['trop'], b: ALL, d: 1, diff: 2, w: 6 },
    { id: 'grouper', n: '능성어', kg: [5, 60], c: ['trop', 'temp'], b: ['ind', 'pac', 'atl', 'med', 'east'], d: 2, diff: 2, w: 5 },
    { id: 'tuna', n: '다랑어', kg: [30, 200], c: ['trop', 'temp'], b: ['atl', 'pac', 'ind', 'med'], d: 2, diff: 3, w: 2 },
    { id: 'shark', n: '상어', kg: [40, 300], c: ['trop', 'temp'], b: ALL, d: 2, diff: 3, w: 2 }
  ];
  // 걸려 올라오는 물건
  F.JUNK = [
    { id: 'bottle', n: '병 속의 편지', w: 3 },
    { id: 'pearl', n: '진주조개', w: 2, b: ['ind', 'east', 'pac', 'atl'], c: ['trop', 'temp'] },
    { id: 'amber', n: '호박 덩어리', w: 3, b: ['baltic'] },
    { id: 'boot', n: '낡은 가죽 신', w: 3 },
    { id: 'weed', n: '바닷말 한 뭉치', w: 3 }
  ];

  function inBox(f, lon, lat) {
    if (f.alat && (Math.abs(lat) < f.alat[0] || Math.abs(lat) > f.alat[1])) return false;
    if (f.lat && (lat < f.lat[0] || lat > f.lat[1])) return false;
    if (f.lon && (lon < f.lon[0] || lon > f.lon[1])) return false;
    return true;
  }
  /** 지금 이 바다에서 낚을 수 있는 진귀한 물고기(발견물) */
  F.rareHere = function (lon, lat) {
    var out = [];
    var ids = (G.FISH_DISCS || []).concat(Object.keys(G.FISH_EXTRA || {}));
    ids.forEach(function (id) {
      var d = G.DISC && G.DISC[id]; if (!d || G.Disc.foundByMe(id)) return;
      var f = d.fish || (G.FISH_EXTRA || {})[id]; if (!f || !inBox(f, lon, lat)) return;
      out.push({ d: d, f: f });
    });
    return out;
  };
  /** 흔한 고기 목록 (깊이에 맞춰 무게를 준다) */
  F.commonHere = function (lon, lat, depth) {
    var c = F.climate(lat), b = F.basin(lon, lat);
    return F.FISH.filter(function (f) { return f.c.indexOf(c) >= 0 && f.b.indexOf(b) >= 0; })
      .map(function (f) { return { f: f, w: f.w * (f.d === depth ? 2.2 : Math.abs(f.d - depth) === 1 ? 1 : 0.35) }; });
  };
  /** 무엇이 걸릴지 고른다 (던진 거리 power 0~1 → 깊이) */
  F.pick = function (lon, lat, power) {
    var depth = power < 0.36 ? 0 : power < 0.72 ? 1 : 2;
    var s = S(), sci = R.skillRead ? R.skillRead('sci') : R.skill('sci');
    var rares = F.rareHere(lon, lat);
    for (var i = 0; i < rares.length; i++) {
      var x = rares[i], p = x.f.p * (s.hints[x.d.id] ? B().hintK + (G.Disc.hintLv(x.d.id) - 1) * G.Disc.clueStack().fish : 1) * (1 + sci * B().rareSci) * (x.f.depth === depth ? 1.5 : Math.abs(x.f.depth - depth) === 1 ? 0.8 : 0.4);
      if (U.chance(p)) return { rare: x.d, n: x.d.name, kg: U.rf(x.f.kg[0], x.f.kg[1]), diff: x.f.diff, depth: x.f.depth };
    }
    if (U.chance(B().junk)) {
      var c = F.climate(lat), b = F.basin(lon, lat);
      var js = F.JUNK.filter(function (j) { return (!j.b || j.b.indexOf(b) >= 0) && (!j.c || j.c.indexOf(c) >= 0); });
      var j = U.weighted(js, function (q) { return q.w; });
      if (j) return { junk: j, n: j.n, kg: 0.5, diff: 1, depth: depth };
    }
    var list = F.commonHere(lon, lat, depth);
    if (!list.length) list = [{ f: F.FISH[2], w: 1 }];
    var pk = U.weighted(list, function (q) { return q.w; }).f;
    return { fish: pk, n: pk.n, kg: U.rf(pk.kg[0], pk.kg[1]), diff: pk.diff, depth: pk.d };
  };

  /** 오늘 남은 미끼 */
  F.baitLeft = function () {
    var s = S(), fs = s.fishing;
    if (!fs || fs.day !== s.day) return B().bait;
    return Math.max(0, B().bait - fs.n);
  };
  function useBait() { var s = S(); if (!s.fishing || s.fishing.day !== s.day) s.fishing = { day: s.day, n: 0, caught: (s.fishing && s.fishing.caught) || 0 }; s.fishing.n++; }

  // ---------------------------------------------------------------- 낚시 창
  /** opts: { storm: bool } → Promise (창을 닫고 발견까지 마친 뒤) */
  F.open = async function (opts) {
    opts = opts || {};
    if (opts.storm) { UI.toast('폭풍 속에서는 낚싯줄을 드리울 수 없습니다.', 'wind'); return; }
    if (F.baitLeft() <= 0) { UI.toast('오늘 쓸 미끼가 다 떨어졌습니다. 내일 다시 해 보십시오.', 'info', 3200); return; }
    var finds = await play();
    for (var i = 0; i < finds.length; i++) {
      var d = finds[i];
      if (G.Disc.foundByMe(d.id)) continue;
      await UI.say('제독, 이런 물고기는 처음 봅니다! 학자들에게 보여 주면 깜짝 놀라겠군요!', G.Scenes.mateSpeaker('surveyor'));
      await G.Disc.find(d, 'sea');
    }
    if (G.Game.refreshHud) G.Game.refreshHud();
  };

  function play() {
    var s = S(), l = s.loc, finds = [];
    var W = 820, H = 340, SEA_Y = 118;
    var ops = R.skill ? R.skill('ops') : 0;
    var st = { ph: 'aim', t: 0, pow: 0, cast: 0, wait: 0, nib: [], bite: 0, tension: 0.3, prog: 0, slack: 0, strain: 0, run: 0, runT: 0, hold: false, hook: null, msg: '', msgT: 0, log: [] };
    var raf = null, last = 0, closed = false, lastLbl = '';
    F._st = st;   // 시험용 (tests)
    function rumor() {   // 단서를 얻은 진귀한 물고기가 이 바다에 있으면 알려 준다 (어느 깊이인지도)
      var DN = ['얕은 곳', '중간 깊이', '깊은 곳'];
      var rs = F.rareHere(l.lon, l.lat).filter(function (x) { return s.hints[x.d.id]; });
      return rs.length ? '<div style="font-size:16px;margin-top:6px;color:#8a5a10">소문의 물고기: ' + rs.map(function (x) { return '「' + U.esc(x.d.name) + '」(' + DN[x.f.depth] + ')'; }).join(', ') + ' — 이 바다에 산다고 한다.</div>' : '';
    }
    return new Promise(function (resolve) {
      var win = UI.window({ title: '바다 낚시', icon: 'fish', width: 880, closable: false, html:
        '<div style="font-size:16px;line-height:1.5;margin-bottom:6px" class="muted">Space(또는 아래 큰 단추·그림)를 눌러 던지고, 찌가 잠기면 챕니다. 끌어올릴 때는 <b>누르고 있으면 감고, 떼면 줄을 풉니다.</b> 초록 칸을 지키십시오.</div>' +
          '<canvas width="' + W * 2 + '" height="' + H * 2 + '" style="width:' + W + 'px;height:' + H + 'px;display:block;border:3px solid #5a3e22;border-radius:6px;cursor:pointer;touch-action:none"></canvas>' +
          '<div class="fstat" style="display:flex;justify-content:space-between;font-size:17px;margin-top:8px"><span class="fmsg"></span><span class="fbait"></span></div>' + rumor(),
        buttons: [{ label: '던진다', value: 'act', cls: 'navy', id: 'act', onClick: function () { return false; } }, { label: '그만한다', value: 'q', cls: 'ghost', onClick: function () { quit(); return false; } }],
        onKey: function (e) {
          if (e.key === ' ' || e.key === 'Enter') { if (!e.repeat) press(); return true; }
          if (e.key === 'Escape') { quit(); return true; }
          return false;
        } });
      var cv = win.content.querySelector('canvas'), g = cv.getContext('2d'), msgEl = win.content.querySelector('.fmsg'), baitEl = win.content.querySelector('.fbait'), act = win.act;
      win.content.classList.add('mg-fishing');
      if (G.MinigameArt) G.MinigameArt.prepare(['props', 'fishing', 'boat']);
      g.scale(2, 2);
      function up(e) { if (e.key === ' ' || e.key === 'Enter') st.hold = false; }
      document.addEventListener('keyup', up);
      function down(e) { e.preventDefault(); press(); }
      function release() { st.hold = false; }
      cv.addEventListener('pointerdown', down); act.addEventListener('pointerdown', function (e) { e.preventDefault(); press(); });
      window.addEventListener('pointerup', release);
      function say(t, ms) { st.msg = t; st.msgT = ms || 2.5; }
      function quit() {
        if (closed) return;
        if (st.ph === 'reel' || st.ph === 'bite') { say('줄에 고기가 걸려 있습니다. 끌어올리거나 놓친 뒤에 그만하십시오.'); return; }
        closed = true; cancelAnimationFrame(raf);
        document.removeEventListener('keyup', up); window.removeEventListener('pointerup', release);
        win.close(null); resolve(finds);
      }
      function press() {
        if (closed) return;
        if (st.ph === 'aim') {
          if (F.baitLeft() <= 0) { say('미끼가 다 떨어졌다. 오늘은 여기까지.'); return; }
          useBait(); st.cast = st.pow; st.ph = 'fly'; st.t = 0;
          st.hook = F.pick(l.lon, l.lat, st.cast);
          st.wait = U.rf(1.6, 4.8) + (st.hook.diff - 1) * 0.6;
          st.nib = []; var nn = st.hook.diff + U.ri(0, 1); for (var i = 0; i < nn; i++) st.nib.push(U.rf(0.5, st.wait - 0.4));
          if (G.Audio) try { G.Audio.sfx('click'); } catch (e) { /* */ }
          return;
        }
        if (st.ph === 'wait' || st.ph === 'fly') { say('너무 일찍 챘다! 고기가 놀라 달아났다.'); toAim(); return; }
        if (st.ph === 'bite') { st.ph = 'reel'; st.t = 0; st.tension = 0.45; st.prog = 0.08; st.hold = true; st.runT = U.rf(1, 2.5); say('걸렸다! 누르고 있으면 감깁니다.', 2); return; }
        if (st.ph === 'reel') { st.hold = true; return; }
        if (st.ph === 'done') { toAim(); }
      }
      function toAim() { st.ph = 'aim'; st.t = 0; st.hook = null; st.hold = false; }
      function zone() {
        var dd = st.hook ? st.hook.diff : 1, z = dd === 1 ? [0.18, 0.86] : dd === 2 ? [0.28, 0.8] : [0.36, 0.76];
        var k = ops * 0.02; return [z[0] - k, z[1] + k];
      }
      function catchIt() {
        var h = st.hook, s2 = S();
        st.ph = 'done'; st.t = 0; st.hold = false;
        s2.fishing.caught = (s2.fishing.caught || 0) + 1;
        if (h.rare) { finds.push(h.rare); say('잡았다! 「' + h.n + '」 — 처음 보는 물고기다!', 5); G.State.log('낚시: 「' + h.n + '」' + U.jx(h.n, '을/를') + ' 낚아 올렸다.'); }
        else if (h.junk) junk(h.junk);
        else {
          var kg = h.kg, food = Math.max(0.3, Math.round(kg * B().food * 10) / 10);
          s2.fleet.food += food;
          if (G.Scenes && G.Scenes.sea && G.Scenes.sea.rearmSupplyWarn) G.Scenes.sea.rearmSupplyWarn();
          say('잡았다! ' + h.n + ' ' + (h.fish.school ? '줄줄이 ' : '') + (kg < 10 ? kg.toFixed(1) : Math.round(kg)) + 'kg — 식량 +' + food + '통', 5);
        }
        st.log.unshift(h.n);
      }
      function junk(j) {
        var s2 = S();
        if (j.id === 'pearl') { var gd = U.ri(60, 240); s2.player.gold += gd; say('진주조개다! 속에서 작은 진주가 나왔다 — 금화 ' + gd + '닢어치', 5); return; }
        if (j.id === 'amber') { var ga = U.ri(100, 380); s2.player.gold += ga; say('바닷물에 떠밀려 온 호박 덩어리다 — 금화 ' + ga + '닢어치', 5); return; }
        if (j.id === 'bottle') {
          var lon = l.lon, lat = l.lat, best = null, bd = 1e9;
          (G.DISCOVERIES || []).forEach(function (d) {
            if ((d.how !== 'sea' && !(d.fish || (G.FISH_EXTRA || {})[d.id])) || G.Disc.foundByMe(d.id) || s2.hints[d.id]) return;
            if (G.Disc.available && !G.Disc.available(d)) return;
            if (d.lon == null) return;
            var dist = G.Geo.dist(lon, lat, d.lon, d.lat); if (dist < bd) { bd = dist; best = d; }
          });
          if (best && G.Disc.addHint(best.id, 'bottle')) { say('병 속의 편지: 「' + best.hint + '」 — 새 단서 「' + best.name + '」', 7); G.State.log('병 속의 편지에서 단서를 얻었다: 「' + best.name + '」'); }
          else say('병 속에 편지가 들어 있지만, 바닷물에 번져 읽을 수 없다.', 4);
          return;
        }
        say(j.id === 'boot' ? '낡은 가죽 신이 걸려 올라왔다... 선원들이 껄껄 웃는다.' : '바닷말 한 뭉치가 걸려 올라왔다.', 4);
      }
      // ---------------------------------------------------------- 갱신
      function step(dt) {
        st.t += dt; if (st.msgT > 0) { st.msgT -= dt; if (st.msgT <= 0) st.msg = ''; }
        if (st.ph === 'aim') st.pow = 0.5 - 0.5 * Math.cos(st.t * 2.6);
        else if (st.ph === 'fly') { if (st.t > 0.6) { st.ph = 'wait'; st.t = 0; } }
        else if (st.ph === 'wait') { if (st.t >= st.wait) { st.ph = 'bite'; st.t = 0; st.bite = [1.0, 0.78, 0.58][st.hook.diff - 1] + ops * 0.05; } }
        else if (st.ph === 'bite') { if (st.t >= st.bite) { say('미끼만 빼앗겼다... 찌가 잠기면 곧바로 챕시다.'); toAim(); } }
        else if (st.ph === 'reel') {
          var h = st.hook, dd = h.diff, z = zone();
          st.runT -= dt;
          if (st.runT <= 0) { if (st.run > 0) { st.run = 0; st.runT = U.rf(1.4, 3.2) - dd * 0.3; } else { st.run = [0.22, 0.32, 0.42][dd - 1] * U.rf(0.8, 1.2); st.runT = U.rf(0.7, 1.4) + dd * 0.2; } }
          var upK = 0.55, downK = 0.62;
          st.tension += (st.hold ? upK : -downK) * dt + st.run * dt + Math.sin(st.t * 7) * 0.04 * dt * dd;
          st.tension = Math.max(0, st.tension);
          var need = [4, 7, 10][dd - 1] * (1 + Math.min(1, h.kg / 400) * 0.4);
          if (st.tension >= 1) { say('툭! 줄이 끊어졌다... 고기가 너무 세게 당길 때는 손을 놓아 줄을 풀어 주십시오.', 4.5); toAim(); return; }
          if (st.tension > z[1]) { st.strain += dt; if (st.strain > 1.0) { say('줄이 버티지 못하고 끊어졌다...', 4); toAim(); return; } }
          else st.strain = Math.max(0, st.strain - dt);
          if (st.tension < z[0]) { st.slack += dt; st.prog = Math.max(0, st.prog - 0.06 * dt); if (st.slack > 2.0) { say('줄이 느슨해진 사이 고기가 바늘을 털고 달아났다.', 4); toAim(); return; } }
          else st.slack = Math.max(0, st.slack - dt * 0.5);
          if (st.hold && st.tension >= z[0] && st.tension <= z[1]) st.prog += dt / need;
          if (st.prog >= 1) catchIt();
        } else if (st.ph === 'done') { if (st.t > 2.2 && F.baitLeft() > 0) toAim(); }
      }
      // ---------------------------------------------------------- 그림
      function draw() {
        var t = performance.now() / 1000;
        var art = G.MinigameArt;
        if (!art || !art.fishing(g, W, H, SEA_Y)) {
        var sky = g.createLinearGradient(0, 0, 0, SEA_Y); sky.addColorStop(0, '#9cc6e0'); sky.addColorStop(1, '#e8eef0');
        g.fillStyle = sky; g.fillRect(0, 0, W, SEA_Y);
        var sea = g.createLinearGradient(0, SEA_Y, 0, H); sea.addColorStop(0, '#2f7aa6'); sea.addColorStop(0.5, '#1c4f78'); sea.addColorStop(1, '#0b2440');
        g.fillStyle = sea; g.fillRect(0, SEA_Y, W, H - SEA_Y);
        }
        // 물결
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath();
        for (var x = 0; x <= W; x += 8) { var y = SEA_Y + Math.sin(x * 0.04 + t * 2) * 2; if (x) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
        // 깊이 띠
        g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(280, SEA_Y, 180, H - SEA_Y); g.fillRect(640, SEA_Y, 180, H - SEA_Y);
        g.font = '12px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)';
        g.fillText('얕은 곳', 350, H - 10); g.fillText('중간', 540, H - 10); g.fillText('깊은 곳', 710, H - 10);
        // 물고기 그림자
        for (var i = 0; i < 6; i++) {
          var fx = (i * 157 + t * (14 + i * 5)) % (W + 80) - 40, fy = SEA_Y + 40 + (i * 37) % (H - SEA_Y - 60);
          g.save(); g.globalAlpha = 0.4; g.translate(fx, fy); g.scale(-1, 1);
          var painted = art && art.draw(g, 'fish', -25 - i * 2, -10, 50 + i * 4, 21 + i);
          g.restore();
          if (painted) continue;
          g.fillStyle = 'rgba(5,20,35,.35)'; g.beginPath(); g.ellipse(fx, fy, 14 + i * 2, 5 + i, 0, 0, 7); g.fill();
          g.beginPath(); g.moveTo(fx - 14 - i * 2, fy); g.lineTo(fx - 24 - i * 2, fy - 6); g.lineTo(fx - 24 - i * 2, fy + 6); g.fill();
        }
        // 배
        var boat = art && art.get('boat'), bp = G.FX && G.FX.minigames && G.FX.minigames.boat;
        if (boat && bp) g.drawImage(boat, bp[0], SEA_Y + bp[1], bp[2], bp[3]);
        else {
        g.fillStyle = '#5a3a1e'; g.beginPath(); g.moveTo(10, SEA_Y - 30); g.lineTo(210, SEA_Y - 30); g.lineTo(186, SEA_Y + 8); g.lineTo(34, SEA_Y + 8); g.closePath(); g.fill();
        g.fillStyle = '#3a2412'; g.fillRect(10, SEA_Y - 36, 200, 6);
        g.fillStyle = '#7a5532'; g.fillRect(70, SEA_Y - 112, 6, 82);
        g.fillStyle = '#efe6cf'; g.beginPath(); g.moveTo(78, SEA_Y - 108); g.quadraticCurveTo(130, SEA_Y - 80, 78, SEA_Y - 44); g.closePath(); g.fill();
        }
        // 낚싯대
        var tipX = 250, tipY = SEA_Y - 74;
        g.strokeStyle = '#59391c'; g.lineWidth = 3; g.beginPath(); g.moveTo(boat ? 195 : 170, SEA_Y - (boat ? 18 : 38)); g.lineTo(tipX, tipY); g.stroke();
        var bx = 280 + st.cast * 500, by = SEA_Y;
        if (st.ph === 'aim') {
          // 힘 막대
          g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(270, 18, 520, 22);
          var pg = g.createLinearGradient(270, 0, 790, 0); pg.addColorStop(0, '#7fd17f'); pg.addColorStop(0.5, '#e8d36a'); pg.addColorStop(1, '#e07a3a');
          g.fillStyle = pg; g.fillRect(272, 20, 516 * st.pow, 18);
          g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.fillText('던질 힘 — 멀리 던질수록 깊은 곳의 큰 고기', 280, 58);
          g.strokeStyle = '#ddd'; g.lineWidth = 1; g.beginPath(); g.moveTo(tipX, tipY); g.lineTo(tipX + 10, tipY + 40); g.stroke();
        } else {
          var flyK = st.ph === 'fly' ? Math.min(1, st.t / 0.6) : 1;
          var cx = tipX + (bx - tipX) * flyK, cy = st.ph === 'fly' ? tipY + (by - tipY) * flyK - Math.sin(flyK * Math.PI) * 60 : by;
          var dip = 0;
          if (st.ph === 'wait') { st.nib.forEach(function (n) { if (st.t > n && st.t < n + 0.25) dip = 4; }); dip += Math.sin(t * 3) * 1.5; }
          if (st.ph === 'bite') dip = 12;
          var hy = SEA_Y + 40 + (st.hook ? st.hook.depth : 1) * 70;
          if (st.ph === 'reel' || st.ph === 'done') {
            // 고기가 배 쪽으로 끌려온다
            var fxp = bx - (bx - 230) * st.prog + (st.run ? Math.sin(t * 12) * 10 : 0), fyp = hy - (hy - SEA_Y - 10) * st.prog;
            g.strokeStyle = st.tension > zone()[1] ? '#ff7a5a' : '#f2f2f2'; g.lineWidth = 1.2 + st.tension; g.beginPath(); g.moveTo(tipX, tipY);
            g.quadraticCurveTo((tipX + fxp) / 2, SEA_Y + (1 - st.tension) * 50, fxp, fyp); g.stroke();
            if (st.ph === 'reel') {
              var fw = 42 + Math.min(36, st.hook.kg / 12);
              if (!art || !art.draw(g, 'fish', fxp - fw / 2, fyp - fw / 5, fw, fw * 0.45)) {
              g.fillStyle = st.hook.rare ? '#e0b23a' : '#c9d8e0'; g.beginPath(); g.ellipse(fxp, fyp, 16 + Math.min(20, st.hook.kg / 15), 7 + Math.min(8, st.hook.kg / 40), 0, 0, 7); g.fill();
              }
            }
          } else {
            g.strokeStyle = '#f2f2f2'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(tipX, tipY); g.quadraticCurveTo((tipX + cx) / 2, Math.min(tipY, cy) - 20, cx, cy + dip); g.stroke();
            if (st.ph !== 'fly') { g.setLineDash([3, 4]); g.beginPath(); g.moveTo(cx, cy + dip); g.lineTo(cx, hy); g.stroke(); g.setLineDash([]); }
            // 찌
            g.fillStyle = '#d63a2a'; g.beginPath(); g.arc(cx, cy + dip - 3, 6, Math.PI, 0); g.fill();
            g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy + dip - 3, 6, 0, Math.PI); g.fill();
            if (st.ph === 'bite') {
              g.fillStyle = '#ffd84a'; g.font = 'bold 40px sans-serif'; g.fillText('!', cx - 6, cy - 22);
              g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy + 4, 10 + (st.t * 40) % 24, 0, 7); g.stroke();
            }
          }
        }
        // 팽팽함 막대 (끌어올릴 때)
        if (st.ph === 'reel') {
          var z = zone(), X = W - 54, Y0 = 20, HH = H - 60;
          g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(X - 4, Y0 - 4, 34, HH + 8);
          g.fillStyle = '#6a2a1a'; g.fillRect(X, Y0, 26, HH);
          g.fillStyle = '#3f8f4a'; g.fillRect(X, Y0 + HH * (1 - z[1]), 26, HH * (z[1] - z[0]));
          var ty = Y0 + HH * (1 - Math.min(1, st.tension));
          g.fillStyle = '#fff'; g.fillRect(X - 6, ty - 2, 38, 4);
          g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText('팽팽함', X - 8, H - 22);
          // 끌어올린 정도
          g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(270, 16, 420, 18);
          g.fillStyle = '#e0b23a'; g.fillRect(272, 18, 416 * Math.min(1, st.prog), 14);
          g.fillStyle = '#fff'; g.font = 'bold 13px sans-serif'; g.fillText('끌어올림 ' + Math.round(st.prog * 100) + '%' + (st.run ? '  — 고기가 세차게 달린다! 손을 놓으십시오' : ''), 276, 52);
        }
        if (st.ph === 'done' && st.hook) {
          g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(250, 30, 440, 48);
          g.fillStyle = st.hook.rare ? '#ffd86a' : '#fff'; g.font = 'bold 22px sans-serif'; g.fillText(st.hook.n + (st.hook.rare ? ' !' : ''), 268, 62);
        }
      }
      function render() {
        msgEl.innerHTML = st.msg ? U.esc(st.msg) : st.ph === 'aim' ? '힘이 알맞을 때 누르십시오.' : st.ph === 'wait' || st.ph === 'fly' ? '찌를 지켜보십시오... (톡톡 건드리는 것에 속지 마십시오)' : st.ph === 'bite' ? '지금이다! 누르십시오!' : st.ph === 'reel' ? '누르고 있으면 감고, 떼면 풉니다.' : '';
        baitEl.textContent = '오늘 남은 미끼 ' + F.baitLeft() + ' / ' + B().bait + (st.log.length ? ' · 잡은 것: ' + st.log.slice(0, 3).join(', ') : '');
        var lbl = st.ph === 'aim' ? '던진다' : st.ph === 'bite' ? '챈다!' : st.ph === 'reel' ? '감는다 (누르고 있기)' : st.ph === 'done' ? '다시 던진다' : '챈다';
        if (lastLbl !== lbl) { lastLbl = lbl; act.innerHTML = G.icon('fish') + lbl; }
      }
      function loop(now) {
        if (closed) return;
        var dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016; last = now;
        step(dt); draw(); render();
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
    });
  }
})(window.G = window.G || {});
