/* Character creation */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art, R = G.R;
  var C = {};
  G.Scenes.create = C;

  var NAMES = {
    PT: ['주앙 다 시우바', '디오구 페헤이라', '페르낭 소아르스', '가브리엘 코스타', '루이스 멘드스', '안토니우 카르발류'],
    ES: ['디에고 로드리게스', '라몬 데 에레라', '후안 데 메디나', '알론소 페레스', '가르시아 데 로하스', '페드로 데 에스피노사']
  };
  var p;

  /* 이름과 성 — 한국식(성 한 글자이거나 남궁·제갈 같은 두 글자 성 + 한글 이름)이면 「성이름」, 그 밖은 「이름 성」으로 붙여 부른다 */
  var KO2 = ['남궁', '황보', '제갈', '선우', '독고', '사공', '서문', '동방', '어금', '망절', '강전', '소봉', '장곡'];
  function fullName(given, sur) {
    given = String(given || '').trim(); sur = String(sur || '').trim();
    if (!sur) return given; if (!given) return sur;
    var ko = /^[가-힣]+$/;
    return ko.test(given) && ko.test(sur) && given.length <= 3 && (sur.length === 1 || KO2.indexOf(sur) >= 0) ? sur + given : given + ' ' + sur;
  }
  C.fullName = fullName;
  /** 이름 목록의 「주앙 다 시우바」 → 이름 주앙, 성 다 시우바 */
  function splitName(full) { var i = full.indexOf(' '); return i < 0 ? { given: full, surname: '' } : { given: full.slice(0, i), surname: full.slice(i + 1) }; }
  function setName(full) { var n = splitName(full); p.given = n.given; p.surname = n.surname; p.name = fullName(p.given, p.surname); }

  function rollStats() {
    var a = p.age - 18, r = U.rand;
    var jb = { explorer: { int: 3 }, digger: { int: 6, cha: 2 }, hunter: { str: 6 }, conq: { mar: 8 }, miss: { cha: 6 }, merchant: { cha: 4, int: 2 }, soldier: { mar: 6, str: 3 } }[p.job] || {};
    var z = G.zodiacOf(p.birth.m, p.birth.d);
    var st = {
      str: 62 - a * 0.9 + U.ri(-8, 8), int: 42 + a * 1.25 + U.ri(-8, 8), mar: 58 - a * 0.6 + U.ri(-8, 8), cha: 46 + a * 0.75 + U.ri(-8, 8)
    };
    for (var k in jb) st[k] += jb[k];
    st[z.stat] += 6;
    for (k in st) st[k] = Math.round(U.clamp(st[k], 12, 95));
    p.st = st;
  }
  function baseSkills() {
    var j = G.JOBS.filter(function (x) { return x.id === p.job; })[0];
    var sk = {}; G.SKILLS.forEach(function (s) { sk[s.id] = 0; });
    for (var k in j.skills) sk[k] = j.skills[k];
    return sk;
  }
  function baseLangs() {
    var lg = []; for (var i = 0; i < G.LANGS.length; i++) lg.push(0);
    lg[R.nativeLang(p.nation)] = 3; lg[p.nation === 'PT' ? 0 : 1] = 2;
    return lg;
  }
  function points() { return 3 + Math.floor((p.age - 18) / 4); }
  function cost(lv) { return lv === 1 ? 1 : lv === 2 ? 2 : lv === 3 ? 3 : 0; }
  function spent() {
    var n = 0, b = baseSkills(), bl = baseLangs();
    G.SKILLS.forEach(function (s) { for (var l = b[s.id] + 1; l <= p.sk[s.id]; l++) n += cost(l); });
    for (var i = 0; i < p.lg.length; i++) for (var l2 = bl[i] + 1; l2 <= p.lg[i]; l2++) n += cost(l2);
    return n;
  }
  function reset(keepStats) {
    p.sk = baseSkills(); p.lg = baseLangs();
    if (!keepStats) rollStats();
  }

  C.enter = function () {
    starting = false;
    UI.hud.hide();
    G.Game.showLayers(false, false, true);
    p = { name: '', given: '', surname: '', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, diff: 'normal', face: 1 };
    setName(U.pick(NAMES.PT));
    reset(false);
    render();
  };

  function render() {
    UI.clearScreen();
    var zod = G.zodiacOf(p.birth.m, p.birth.d);
    var box = U.el('div', 'create');
    var h = '';
    // column 1
    h += '<div class="col" style="width:330px"><div class="sect parch ornament-corners" style="flex:1">' +
      '<h4>제독</h4><div style="display:flex;justify-content:center;margin:6px 0 10px"><div class="wood" style="padding:8px" id="pv"></div></div>' +
      '<div class="center" style="margin-bottom:12px"><button class="btn small" id="faceprev" title="앞의 얼굴">◀</button> <button class="btn small" id="face">' + G.icon('dice') + '다른 얼굴</button>' + lookLine() + '</div>' +
      '<div class="flex" style="gap:8px;align-items:flex-end"><div style="flex:1.15;min-width:0"><label>이름</label><input type="text" id="nm" maxlength="12" style="width:100%" value="' + U.esc(p.given) + '"></div>' +
      '<div style="flex:1;min-width:0"><label>성</label><input type="text" id="sn" maxlength="12" style="width:100%" value="' + U.esc(p.surname) + '"></div>' +
      '<button class="btn small" id="rn" title="다른 이름">' + G.icon('dice') + '</button></div>' +
      '<div class="muted" id="fullnm" style="margin-top:4px;font-size:15px">불리는 이름: <b style="color:var(--ink)">' + U.esc(p.name) + '</b></div>' +
      '<div style="margin-top:14px"><label>생일</label><div class="flex"><select id="bm">' + mOpts() + '</select><span>월</span><select id="bd">' + dOpts() + '</select><span>일</span></div>' +
      '<div class="muted" style="margin-top:6px;font-size:16px">' + zod.name + ' — ' + { str: '체력', int: '지력', mar: '무력', cha: '매력' }[zod.stat] + '에 보너스</div></div>' +
      '<div style="margin-top:14px"><label>나이 <b style="color:var(--ink)">' + p.age + '세</b> <span class="muted" style="font-size:14px">(젊을수록 체력·무력, 나이 들수록 지력·매력과 특기 점수)</span></label><input type="range" id="age" min="18" max="40" value="' + p.age + '"></div>' +
      '</div></div>';
    // column 2
    h += '<div class="col" style="width:430px"><div class="sect parch ornament-corners"><h4>국적</h4><div class="opt-row">' +
      opt('nat', 'PT', '포르투갈 (리스본)', p.nation === 'PT') + opt('nat', 'ES', '에스파냐 (세빌리아)', p.nation === 'ES') + '</div>' +
      '<div class="muted" style="margin-top:8px;font-size:16px;line-height:1.5">' + (p.nation === 'PT' ? '아프리카 항로 개척에 앞선 해양 왕국. 모국어 포르투갈어, 스페인어도 조금 한다.' : '레콩키스타를 마무리하는 카스티야와 아라곤의 연합 왕국. 모국어 스페인어, 포르투갈어도 조금 한다.') + '</div></div>' +
      '<div class="sect parch ornament-corners" style="flex:1"><h4>직업</h4><div class="opt-row">' +
      G.JOBS.map(function (j) { return opt('job', j.id, j.name, p.job === j.id); }).join('') + '</div>' +
      '<div style="margin-top:10px;font-size:17px;line-height:1.55">' + G.JOBS.filter(function (j) { return j.id === p.job; })[0].desc + '</div>' +
      '<div class="sep"></div><h4 style="border:0;margin-bottom:6px">난이도</h4><div class="opt-row">' +
      opt('diff', 'easy', '쉬움', p.diff === 'easy') + opt('diff', 'normal', '보통', p.diff === 'normal') + opt('diff', 'original', '원작 규칙', p.diff === 'original') + '</div>' +
      '<div class="muted" style="margin-top:6px;font-size:15px;line-height:1.5">' + { easy: '입출항에 1일, 소지금 5000닢. 가볍게 즐기는 항해.', normal: '입출항에 3일. 균형 잡힌 모험.', original: '입출항에 10일, 저장은 자국 항구의 여관에서만. 옛 항해자의 고난 그대로.' }[p.diff] + '</div>' +
      '</div></div>';
    // column 3
    var pts = points(), used = spent();
    h += '<div class="col" style="flex:1"><div class="sect parch ornament-corners"><div class="flex"><h4 style="flex:1">능력치</h4><button class="btn small" id="roll">' + G.icon('dice') + '다시 굴리기</button></div>';
    G.STATS.forEach(function (s) {
      h += '<div class="statrow"><span>' + s.name + '</span>' + UI.bar(p.st[s.id], 100) + '<b style="text-align:right">' + p.st[s.id] + '</b></div>';
    });
    h += '<div class="muted" style="font-size:15px;margin-top:4px">특기 한도 ' + R.skillCap(p.st.int) + '개 · 어학 한도 ' + R.langCap(p.st.int) + '개 (지력에 따라)</div></div>';
    h += '<div class="sect parch ornament-corners cr-skills" style="flex:1"><div class="flex"><h4 style="flex:1">특기 · 어학</h4><span style="font-size:18px">남은 점수 <b style="color:' + (pts - used < 0 ? '#8a2a1e' : '#1e3552') + '">' + (pts - used) + '</b> / ' + pts + '</span></div>' +
      '<div class="skillgrid">';
    var b = baseSkills();
    G.SKILLS.forEach(function (s) {
      h += '<div class="skillrow" title="' + s.desc + '"><span>' + s.name + '</span><span class="pips">' + pips(p.sk[s.id], b[s.id]) + '</span>' +
        '<button class="btn mini" data-sk="' + s.id + '" data-d="-1">−</button><button class="btn mini" data-sk="' + s.id + '" data-d="1">＋</button></div>';
    });
    h += '</div><div class="sep"></div><div class="skillgrid">';
    var bl = baseLangs();
    G.LANGS.forEach(function (l, i) {
      h += '<div class="skillrow" title="' + l + '"><span style="font-size:14px">' + l + '</span><span class="pips">' + pips(p.lg[i], bl[i]) + '</span>' +
        '<button class="btn mini" data-lg="' + i + '" data-d="-1">−</button><button class="btn mini" data-lg="' + i + '" data-d="1">＋</button></div>';
    });
    h += '</div></div><div class="flex" style="justify-content:flex-end;gap:12px"><button class="btn" id="back">' + G.icon('back') + '타이틀로</button><button class="btn navy" id="go" style="min-width:260px">' + G.icon('ship') + '출항 준비 완료</button></div></div>';
    box.innerHTML = h;
    UI.add(box);
    // portrait
    var pv = box.querySelector('#pv');
    pv.appendChild(A.portraitCanvas(playerSpec(), 200));
    // events
    box.querySelector('#face').onclick = function () { p.face++; render(); };
    box.querySelector('#faceprev').onclick = function () { p.face = p.face > 0 ? p.face - 1 : Math.max(0, G.Img.list('portraits/player/').length - 1); render(); };
    var fullEl = box.querySelector('#fullnm b');
    function onName() { p.given = box.querySelector('#nm').value; p.surname = box.querySelector('#sn').value; p.name = fullName(p.given, p.surname); if (fullEl) fullEl.textContent = p.name; }
    ['#nm', '#sn'].forEach(function (q) {
      box.querySelector(q).oninput = onName;
      box.querySelector(q).onkeydown = function (e) {
        e.stopPropagation();
        // 테스트용: 이름이나 성 칸에 「이강희」(또는 성 이 + 이름 강희)를 치고 엔터 → 모든 능력 만렙, 소지금 10만, 거북선(기함)·갤리온으로 바로 시작
        if (e.key === 'Enter') { onName(); if (isTestName()) { e.preventDefault(); startTest(); } }
      };
    });
    box.querySelector('#rn').onclick = function () { setName(U.pick(NAMES[p.nation])); render(); };
    box.querySelector('#bm').onchange = function (e) { p.birth.m = +e.target.value; p.birth.d = Math.min(p.birth.d, U.daysInMonth(1460, p.birth.m)); rollStats(); render(); };
    box.querySelector('#bd').onchange = function (e) { p.birth.d = +e.target.value; rollStats(); render(); };
    box.querySelector('#age').onchange = function (e) { p.age = +e.target.value; reset(false); render(); };
    box.querySelector('#age').oninput = function (e) { var l = box.querySelector('#age').previousElementSibling.querySelector('b'); if (l) l.textContent = e.target.value + '세'; };
    box.querySelector('#roll').onclick = function () { rollStats(); render(); };
    U.$$('[data-g]', box).forEach(function (el) {
      el.onclick = function () {
        var g = el.dataset.g, v = el.dataset.v;
        if (g === 'nat') { if (p.nation !== v) { p.nation = v; setName(U.pick(NAMES[v])); reset(true); } }
        else if (g === 'job') { p.job = v; reset(false); }
        else if (g === 'diff') p.diff = v;
        render();
      };
    });
    U.$$('[data-sk]', box).forEach(function (el) {
      el.onclick = function () {
        var id = el.dataset.sk, d = +el.dataset.d, bs = baseSkills()[id];
        var nv = p.sk[id] + d;
        if (nv < bs || nv > 3) return;
        if (d > 0) {
          var cnt = G.SKILLS.filter(function (s) { return p.sk[s.id] > 0; }).length;
          if (p.sk[id] === 0 && cnt >= R.skillCap(p.st.int)) { UI.toast('지력이 부족해 더 많은 특기를 익힐 수 없습니다.', 'info'); return; }
          if (spent() + cost(nv) > points()) { UI.toast('남은 점수가 부족합니다.', 'info'); return; }
        }
        p.sk[id] = nv; render();
      };
    });
    U.$$('[data-lg]', box).forEach(function (el) {
      el.onclick = function () {
        var i = +el.dataset.lg, d = +el.dataset.d, bl2 = baseLangs()[i];
        var nv = p.lg[i] + d;
        if (nv < bl2 || nv > 3) return;
        if (d > 0) {
          var cnt = p.lg.filter(function (x) { return x > 0; }).length;
          if (p.lg[i] === 0 && cnt >= R.langCap(p.st.int)) { UI.toast('지력이 부족해 더 많은 언어를 익힐 수 없습니다.', 'info'); return; }
          if (spent() + cost(nv) > points()) { UI.toast('남은 점수가 부족합니다.', 'info'); return; }
        }
        p.lg[i] = nv; render();
      };
    });
    box.querySelector('#back').onclick = function () { G.Game.go('title'); };
    box.querySelector('#go').onclick = start;
  }
  function pips(v, base) { var s = ''; for (var i = 1; i <= 3; i++) s += '<i class="' + (i <= base ? 'base' : i <= v ? 'on' : '') + '"></i>'; return s; }
  function opt(g, v, label, on) { return '<div class="opt' + (on ? ' on' : '') + '" data-g="' + g + '" data-v="' + v + '">' + label + '</div>'; }
  function mOpts() { var s = ''; for (var m = 1; m <= 12; m++) s += '<option value="' + m + '"' + (m === p.birth.m ? ' selected' : '') + '>' + m + '</option>'; return s; }
  function dOpts() { var s = ''; for (var d = 1; d <= U.daysInMonth(1460, p.birth.m); d++) s += '<option value="' + d + '"' + (d === p.birth.d ? ' selected' : '') + '>' + d + '</option>'; return s; }
  function playerSpec() {
    var sp = A.portraitSpec({ seed: 'player' + p.face + p.nation, culture: 'med', g: 'm', age: p.age > 34 ? 'mid' : 'young', cloth: ['#1e3552', '#5a1e1e', '#2a3a2a', '#3a2a4a'][p.face % 4], beard: p.face % 3 });
    var face = G.Img.chain.player(p.face);
    if (face.length && p.age >= 40) {
      var id = face[0].slice('portraits/player/'.length), old = 'portraits/player-aged/' + id;
      if (G.Img.has(old)) face = [old].concat(face);
    }
    return A.withImg(sp, face);
  }
  C.playerSpec = playerSpec;
  /** 고른 얼굴의 생김새 이름 — 그 얼굴로 거리를 걷고(characters/<이름>/walk_*) 일기토도 그 모습(duel/fighters/<이름>), 40세부터 수염 난 모습 */
  function lookLine() {
    var faces = G.Img.list('portraits/player/');
    if (!faces.length) return '';
    var i = ((p.face % faces.length) + faces.length) % faces.length, id = faces[i].slice('portraits/player/'.length);
    return '<div class="look-name"><b>' + U.esc(G.Img.heroName(id)) + '</b> <span class="muted">' + (i + 1) + '/' + faces.length + '</span>' +
      '<small class="muted">' + (p.age >= 40 ? '40대 모습 — 수염이 난 얼굴' : '마흔이 되면 수염 난 40대 모습으로 바뀝니다') + '</small></div>';
  }

  // ---------------------------------------------------------------- 테스트용 캐릭터
  var TEST_NAME = '이강희', starting = false;
  /** 이름 칸이나 성 칸 어느 쪽에 「이강희」를 쳐도, 성 「이」 + 이름 「강희」로 쳐도 테스트용 캐릭터 */
  function isTestName() { return [p.given, p.surname, p.name].some(function (x) { return String(x || '').replace(/\s+/g, '') === TEST_NAME; }); }
  C.isTestName = function (given, sur) { var sv = p; p = { given: given, surname: sur, name: fullName(given, sur) }; var r = isTestName(); p = sv; return r; };
  function startTest() {
    if (starting) return;          // 한글 입력 중 엔터가 두 번 들어와도 한 번만
    var T = G.BALANCE.testChar;
    p.surname = '이'; p.given = '강희'; p.name = TEST_NAME;     // 테스트용 캐릭터는 늘 성 이 · 이름 강희
    p.st = {}; G.STATS.forEach(function (s) { p.st[s.id] = T.stat; });
    p.sk = {}; G.SKILLS.forEach(function (s) { p.sk[s.id] = 3; });
    p.lg = G.LANGS.map(function () { return 3; });
    var fi = T.look ? G.Img.list('portraits/player/').indexOf('portraits/player/' + T.look) : -1;
    if (fi >= 0) p.face = fi;      // 이강희 얼굴 그림 → 반신상·일기토 시트도 이강희 것
    var fleet = (T.ships || []).map(function (id) { return G.SHIP[id] ? G.SHIP[id].name : ''; }).filter(Boolean);
    UI.toast('테스트용 캐릭터: 모든 능력 만렙, 소지금 ' + T.gold.toLocaleString() + '닢' + (fleet.length ? ', 첫 함대 ' + fleet.join('·') : ''), 'info');
    start(true);
  }

  async function start(test) {
    test = test === true;          // 버튼 클릭이면 이벤트 객체가 들어온다
    if (starting) return;
    p.given = String(p.given || '').trim(); p.surname = String(p.surname || '').trim();
    p.name = fullName(p.given, p.surname);
    if (!p.given) { UI.toast('이름을 입력하세요.', 'info'); return; }
    if (!test && spent() > points()) { UI.toast('특기 점수를 너무 많이 썼습니다.', 'info'); return; }
    starting = true;
    await G.Game.ensureGeo();
    var T = test ? G.BALANCE.testChar : null;
    var S = G.State.newGame({ name: p.name, nation: p.nation, job: p.job, age: p.age, birth: p.birth, st: p.st, sk: p.sk, lg: p.lg, diff: p.diff, gold: T ? T.gold : p.diff === 'easy' ? 5000 : 3000, ships: T ? T.ships : null });
    if (T) S.player.luck = T.luck;
    S.player.given = p.given; S.player.surname = p.surname;      // 부를 때는 S.player.name(붙인 이름)을 그대로 쓴다
    S.player.portrait = playerSpec();
    // 고른 얼굴 그림을 초상에 못 박아 둔다(얼굴 그림이 늘어 순서가 바뀌어도 그대로) — 그 이름이 제독의 생김새
    var faceKey = G.Img.chain.player(p.face);
    A.withImg(S.player.portrait, faceKey);
    S.player.look = faceKey.length ? faceKey[0].slice('portraits/player/'.length) : 'admiral';
    G.Game.state = S;
    await UI.fade(function () { G.Game.go('city', { cityId: S.player.home, prologue: true }); });
  }
  C.exit = function () { };
})(window.G = window.G || {});
