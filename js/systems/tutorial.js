/* 튜토리얼 「첫 항해」 진행기 (G.Tutorial) — 자료·대사: js/data/tutorial.js
   ■ 하는 일
     · 타이틀 「첫 항해 (튜토리얼)」 → 이름만 묻고 고정된 제독(에스파냐·탐험가·세빌리아·22세·카라벨·쉬움)으로 시작한다. 저장 상태에 s.tut = {step, f:{}}.
     · 0.35초마다 지금 단계가 끝났는지(done) 살피고, 끝났으면 맺는 대사 → 다음 단계의 여는 대사.
     · 설명은 모두 부하들(로코·라 코사·아라나)이 대화창에서 말로 한다(단계의 teach — 여는 대사에 이어서, 또는 그 건물에 들어섰을 때).
       화면 위 안내판에는 「지금 할 일」 한 줄과 「다시 듣기」만 두고, 눌러야 할 단추를 빛나게 한다.
     · 게임의 원래 기능(도서관·술집·후원자·항해·해전·탐험·교역·보고·여관)을 그대로 쓴다. 여기서는 그 함수들을 감싸(wrap) 튜토리얼일 때만
       ① 순서에 없는 건물은 로코가 말리고 ② 필요한 사람·명성을 열어 주고 ③ 일이 끝난 것을 적는다. s.tut가 없으면 아무것도 바꾸지 않는다.
     · 고정 사건: 트라팔가르 곶 앞의 해적 푸스타, 산길의 도적 떼, 돌아오는 길의 돌고래. 해전·육상전에서 지면 「다시 해 본다」로 되돌린다(게임 오버 없음).
     · 발견은 헤라클레스의 동굴 하나만(지브롤터 바위 같은 다른 발견은 튜토리얼이 끝난 뒤에).
     · 자동 저장은 튜토리얼 칸(G.TUTORIAL.slot)에 — 본 게임의 자동 저장을 덮지 않는다.
   ■ 끝: 에필로그 창에서 「이 항해를 이어 간다」(s.tut를 지우고 그대로 본 게임) / 「타이틀로 돌아간다」. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var TU = {}, D = G.TUTORIAL;
  G.Tutorial = TU;
  if (!D) return;
  var STEPS = D.steps, IDX = {};
  STEPS.forEach(function (st, i) { IDX[st.id] = i; });
  var LAST = STEPS.length - 1;

  function S() { return G.Game && G.Game.state; }
  function T() { var s = S(); return s && s.tut ? s.tut : null; }
  function step() { var t = T(); return t ? STEPS[Math.min(t.step, LAST)] : null; }
  function at(id) { var st = step(); return !!st && st.id === id; }
  function before(id) { var t = T(); return !!t && t.step < IDX[id]; }
  function after(id) { var t = T(); return !!t && t.step > IDX[id]; }
  function C() { return G.Scenes.city; }
  function scene() { return G.Game.sceneName; }
  function inCity(id) { var s = S(); return scene() === 'city' && s.loc.mode === 'city' && (id == null || s.loc.city === id); }
  function mate(id) { var s = S(); return s.mates.filter(function (m) { return m.id === id; })[0] || null; }
  TU.active = function () { return !!T(); };
  TU.step = function () { var st = step(); return st ? st.id : null; };
  /** 튜토리얼 중에는 뭍의 우연한 만남을 재운다 (land.js) */
  TU.quiet = function () { return !!T(); };

  // ================================================================ 말하는 사람·대사
  function mateWho(id) { var d = G.MATE[id]; return { name: d.name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, rigId: 'player', portrait: p.portrait, half: G.Img.chain.heroHalf() }; }
  function who(k) {
    var city = scene() === 'city';
    try {
      if (k === 'R') return mateWho('rocco');
      if (k === 'C') return mateWho('lacosa');
      if (k === 'A') return mateWho('arana');
      if (k === 'P') return me();
      if (k === 'librarian') return city ? C().npc('librarian', '사서') : { name: '사서' };
      if (k === 'keeper') return city ? C().npc('tavernkeeper', '술집 주인') : { name: '술집 주인' };
      if (k === 'maid') { var m = G.MAID && G.MAID.m_sev; return m && city ? C().B.tavern.maidSpeaker(m) : { name: '여급' }; }
      if (k === 'duke') return G.Sponsor.speaker(G.SPONSOR[D.sponsor]);
      if (k === 'official') return { name: '포르투갈 항구 관리' };
      if (k === 'bandit') return { name: '도적 두목' };
    } catch (e) { console.error(e); }
    return {};
  }
  function fmt(s) { var p = S().player; return String(s).replace(/\{name\}/g, p.name).replace(/<\/?b>/g, ''); }
  /** 대사 묶음을 차례로 보여 준다. 고르는 대답이 있으면 고른 값을 돌려준다 */
  async function play(lines) {
    var picked = null;
    for (var i = 0; i < (lines || []).length; i++) {
      var ln = lines[i];
      if (Array.isArray(ln)) await UI.say(fmt(ln[1]), who(ln[0]));
      else if (ln && ln.ask) {
        var v = await UI.ask(fmt(ln.ask), ln.opts.map(function (o, k) { return { label: o[0], value: k }; }), ln.by ? who(ln.by) : {});
        var o = ln.opts[v == null ? 0 : v];
        picked = o[2] != null ? o[2] : v;
        if (Array.isArray(o[1])) await play(o[1]);
      }
    }
    return picked;
  }
  /** 이 단계에서 한 번만 하는 말 */
  async function once(key, lines) { var t = T(); if (!t || t.f[key]) return false; t.f[key] = 1; await play(lines); return true; }

  // ================================================================ 시작·끝
  /** 타이틀의 단추: 튜토리얼 자동 저장이 있으면 이어 할지 묻는다 */
  TU.begin = async function () {
    await G.State.ready;
    // 하다 만 튜토리얼이 있으면 이어 할지 묻는다 (끝낸 튜토리얼의 칸에는 안내 표시(s.tut)가 없다)
    var old = G.State.meta(D.slot) ? await G.State.loadAsync(D.slot) : null;
    if (old && old.tut) {
      var m = G.State.meta(D.slot);
      var v = await UI.choose('첫 항해 (튜토리얼)', [
        { label: '이어서 한다', value: 'cont', icon: 'sail', right: U.esc(m.name) + ' · ' + m.date + ' · ' + U.esc(m.place) },
        { label: '처음부터 다시', value: 'new', icon: 'compass' }], { width: 640 });
      if (v == null) return;
      if (v === 'cont') { await G.Game.ensureGeo(); G.Game.state = old; G.Game.resume(); return; }
    }
    var name = await UI.prompt('젊은 항해사의 이름', D.name, 14);
    if (name == null) return;
    name = String(name).trim() || D.name;
    await G.Game.ensureGeo();
    TU.start(name);
    await G.Game.launch('첫 항해를 준비하는 중…', function () { G.Game.go('city', { cityId: D.home }); });
  };
  /** 고정된 제독으로 새 상태를 만든다 (시험에서도 쓴다) */
  TU.start = function (name) {
    var sk = {}; G.SKILLS.forEach(function (x) { sk[x.id] = 0; });
    var job = G.JOBS.filter(function (j) { return j.id === 'explorer'; })[0];
    for (var k in job.skills) sk[k] = job.skills[k];
    var lg = G.LANGS.map(function () { return 0; }); lg[0] = 3; lg[1] = 2;
    var s = G.State.newGame({ name: name || D.name, nation: 'ES', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 55, int: 58, mar: 52, cha: 56 }, sk: sk, lg: lg, diff: 'easy', gold: 3000 });
    var parts = String(name || D.name).split(' ');
    s.player.given = parts[0]; s.player.surname = parts.slice(1).join(' ');
    s.fleet.ships[0].name = D.ship;
    // 얼굴: 만들기 화면의 첫 얼굴 (그림이 있으면 그 생김새)
    try {
      var A = G.Art, face = G.Img.chain.player(0);
      s.player.portrait = A.withImg(A.portraitSpec({ seed: 'player0ES', culture: 'med', g: 'm', age: 'young', cloth: '#1e3552', beard: 0 }), face);
      s.player.look = face.length ? face[0].slice('portraits/player/'.length) : 'admiral';
    } catch (e) { console.error(e); }
    s.tut = { step: 0, f: {} };
    G.Game.state = s;
    return s;
  };
  /** 튜토리얼을 마치고 본 게임으로 (keep) / 타이틀로 */
  async function finishWindow() {
    var s = S();
    var html = '<div style="font-size:19px;line-height:1.7">튜토리얼을 마쳤습니다.<br>얻은 것: 동료 <b>' + Math.max(0, s.mates.length - 1) + '</b>명 · 발견 <b>' + s.stats.found + '</b> · 명성 <b>' + U.num(s.player.fame) + '</b> · 금화 <b>' + U.num(s.player.gold) + '</b>닢' +
      '<div class="sep"></div><b>이 항해를 이어 간다</b> — 지금 상태(' + G.CITY_DATA[s.loc.city].name + ', ' + U.fmtDate(s.date) + ')를 그대로 본 게임으로 넘깁니다. 안내는 꺼집니다.<br>' +
      '<b>타이틀로 돌아간다</b> — 처음부터 「새로운 항해」로 제독을 직접 만들 수 있습니다.</div>';
    var v = await UI.window({ title: '첫 항해를 마치다', icon: 'laurel', width: 680, closable: false, html: html,
      buttons: [{ label: '타이틀로 돌아간다', value: 'title' }, { label: '이 항해를 이어 간다', value: 'keep', cls: 'navy' }] }).result;
    TU.end();
    if (v === 'title') { await UI.fade(function () { G.Game.go('title'); }); return; }
    G.Game.refreshHud();
    if (s.settings.autosave !== false) G.State.save(0);
    UI.toast('이제부터는 제독의 바다입니다. 순풍을 빕니다!', 'sail', 5000);
    if (inCity()) C().main();
  }
  /** 튜토리얼 표시를 지운다 (상태는 그대로 — 본 게임이 된다) */
  TU.end = function () {
    var s = S(); if (!s || !s.tut) { restoreData(); render(); return; }
    delete s.tut; restoreData(); render();
    try { G.State.save(D.slot); } catch (e) { console.error(e); }   // 튜토리얼 칸에 「끝냈다」를 남긴다 (다음에 「이어서 한다」를 묻지 않게)
  };
  /** 안내 상자의 「튜토리얼 끝내기」 */
  TU.quit = async function () {
    if (UI.busy()) return;
    var v = await UI.ask('튜토리얼을 여기서 끝낼까요?', [
      { label: '계속한다', value: 0 }, { label: '끝내고 이 항해를 이어 간다', value: 'keep' }, { label: '끝내고 타이틀로', value: 'title' }], {});
    if (!v) return;
    TU.end();
    if (v === 'title') await UI.fade(function () { G.Game.go('title'); });
    else UI.toast('튜토리얼 안내를 껐습니다. 이제부터는 제독의 바다입니다.', 'sail', 4500);
  };

  // ================================================================ 튜토리얼 동안만 바꿔 두는 자료
  var saved = null;
  function applyData() {
    if (saved) return;
    saved = { fame: {}, risk: null };
    D.mates.forEach(function (id) { saved.fame[id] = G.MATE[id].fame; G.MATE[id].fame = 0; });   // 필요 명성 면제 (로코의 보증)
    if (G.SEA_RISK) { saved.risk = { pirate: G.SEA_RISK.pirate, storm: G.SEA_RISK.storm }; G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; }   // 우연한 해적·폭풍은 재운다
  }
  function restoreData() {
    if (!saved) return;
    for (var id in saved.fame) G.MATE[id].fame = saved.fame[id];
    if (saved.risk && G.SEA_RISK) { G.SEA_RISK.pirate = saved.risk.pirate; G.SEA_RISK.storm = saved.risk.storm; }
    saved = null;
  }

  // ================================================================ 안내 상자·빛나는 단추
  var box = null, shown = '';
  function ui() { return document.getElementById('ui'); }
  function render() {
    var t = T(), root = ui(); if (!root) return;
    var toasts = root.querySelector('.toasts');
    if (!t || scene() === 'title') { if (box) { box.remove(); box = null; shown = ''; } if (toasts) toasts.style.top = ''; root.classList.remove('tut-on'); return; }
    var st = step(), s = S();
    var goal = st.goal || '';
    if (st.id === 'gate' && scene() === 'land') goal = '뭍에서 <b>서쪽 곶</b>으로 걸어간다 (땅을 누르면 걷는다)';
    if (st.id === 'auto' && scene() === 'sea') goal = '<b>세빌리아</b>까지 자동항해 (풀렸으면 「로코에게 키를 맡긴다」)';
    var helm = scene() === 'sea' && !!helmCity(), again = !!againLines();
    var key = (helm ? 'h' : '') + (again ? 'a' : '') + st.id + '|' + goal + '|' + scene();
    if (!box) {
      box = U.el('div', 'tutbox parch');
      box.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      box.addEventListener('click', function (e) {
        e.stopPropagation();
        var a = e.target.closest ? e.target.closest('[data-act]') : null; if (!a) return;
        if (a.dataset.act === 'again') TU.again();
        else if (a.dataset.act === 'quit') TU.quit();
        else if (a.dataset.act === 'skip') TU.skip();
        else if (a.dataset.act === 'helm') TU.helm();
      });
      root.appendChild(box);
    }
    if (key !== shown) {
      shown = key;
      box.innerHTML = '<div class="tb-h"><span class="tb-n">첫 항해 ' + (st.no <= 18 ? st.no + '/18' : '') + '</span><b>' + st.title + '</b>' +
        '<span class="tb-btns">' + (helm ? '<a data-act="helm" class="tb-helm">로코에게 키를 맡긴다</a>' : '') + (again ? '<a data-act="again">다시 듣기</a>' : '') + (SKIP[st.id] ? '<a data-act="skip">이 단계 건너뛰기</a>' : '') + '<a data-act="quit">튜토리얼 끝내기</a></span></div>' +
        (goal ? '<div class="tb-g">' + G.icon('check') + '<span>' + goal + '</span></div>' : '');
    }
    root.classList.add('tut-on');
    if (toasts) toasts.style.top = (box.offsetTop + box.offsetHeight + 8) + 'px';
  }
  var GLOW_SEL = '.cmd, .choice, .btn, .hire-row, tr.click, .todo .tr';
  function labelOf(el) {
    if (el.classList.contains('cmd')) { var sp = el.querySelector('span'); return sp ? sp.textContent.trim() : ''; }
    if (el.classList.contains('hire-row')) { var nm = el.querySelector('.nm'); return nm ? nm.textContent.trim() : ''; }
    if (el.tagName === 'TR') { var b = el.querySelector('b'); return b ? b.textContent.trim() : el.textContent.trim(); }
    return el.textContent.trim();
  }
  function glow() {
    var root = ui(); if (!root) return;
    var t = T(), st = step(), want = t && st ? (st.glow || []).slice() : [];
    if (t && st) {
      if (st.id === 'hire') D.mates.forEach(function (id) { if (!mate(id)) want.push(G.MATE[id].name); });
      if (st.id === 'cabin') want.push('수첩');
      if (st.id === 'sail' || st.id === 'auto') want.push('세우타 쪽으로 바닷길 따라', '세우타 쪽으로 곧장 침로', '세빌리아로 자동항해');
      if (st.id === 'depart' && t.f.prep) want = ['항구', '출항', '출항한다'];
    }
    var els = root.querySelectorAll(GLOW_SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i], on = false;
      if (want.length && !el.classList.contains('exit') && !el.closest('.tutbox')) {
        var lb = labelOf(el), loose = el.classList.contains('choice') || el.tagName === 'TR' || el.classList.contains('tr');
        var head = el.classList.contains('btn') && !el.classList.contains('ghost');
        for (var k = 0; k < want.length && !on; k++) on = loose ? lb.indexOf(want[k]) >= 0 : head ? lb.indexOf(want[k]) === 0 : lb === want[k];
      }
      if (on !== el.classList.contains('tut-glow')) el.classList.toggle('tut-glow', on);
    }
  }

  /** 로코가 키를 잡으면 갈 항구: 가는 길(6~9단계)은 세우타, 돌아오는 길(15단계)은 세빌리아. 그 밖에는 null */
  function helmCity() {
    var st = step(); if (!st) return null;
    if (['sail', 'cabin', 'battle', 'port'].indexOf(st.id) >= 0) return G.CITY_DATA[D.port];
    if (st.id === 'auto') return G.CITY_DATA[D.home];
    return null;
  }
  /** 「로코에게 키를 맡긴다」: 그 항구 앞까지 뱃길을 찾아 가서 입항한다 (자동항해가 아니라 가까운 바다의 뱃길 찾기 — 처음 가는 길에서도 된다) */
  TU.helm = function () {
    var ss = seaSt(), SEA = G.Scenes.sea, c = helmCity(); if (!T() || !ss || ss.busy || UI.busy() || !c) return false;
    var d = c.dock || [c.lat, c.lon];
    SEA.setTarget(d[1], d[0], null);
    if (ss.path && ss.target && (at('port') || at('auto'))) ss.target.city = c;      // 닿으면 그대로 입항 (해적을 만나기 전에는 앞바다에서 멈춘다)
    UI.toast('로코가 키를 잡았다 — ' + c.name + U.jx(c.name, '으로/로') + ' 간다.', 'wheel', 3600);
    return true;
  };
  /** 안내판 「다시 듣기」: 지금 자리에서 부하들이 한 설명을 다시 듣는다 */
  function againLines() {
    var st = step(); if (!st) return null;
    if (scene() === 'battle') return STEPS[IDX.battle].begin;
    if (st.id === 'gate' && scene() === 'land') return st.land;
    return st.teach || null;
  }
  TU.again = function () {
    var lines = againLines(); if (!T() || !lines || UI.busy() || running) return false;
    if (scene() !== 'battle' && !idle()) return false;
    running = true;
    play(lines).catch(function (e) { console.error(e); }).then(function () { running = false; });
    return true;
  };
  /** 부하들의 설명(teach): 여는 대사에 이어서, teachAt이 있으면 그 건물에 들어섰을 때 — 단계마다 한 번 */
  async function teach(t, st) {
    if (!st.teach || t.f['t_' + st.id]) return false;
    if (st.teachAt && !(scene() === 'city' && C().current() && C().current().kind === st.teachAt)) return false;
    if (st.id === 'landwar') return false;            // 도적 떼 앞에서 따로 한다 (banditFight)
    t.f['t_' + st.id] = 1;
    await play(st.teach);
    return true;
  }

  // ================================================================ 막기: 순서에 없는 건물
  function allowed(kind, arg) {
    var st = step(), s = S(); if (!st) return true;
    var sp = 'mansion:' + D.sponsor, here = s.loc.city;
    var A = {
      prologue: ['library'], library: ['library'], tavern: ['tavern'], hire: ['tavern'], roles: ['tavern'],
      sponsor: [sp], depart: ['harbor'], sail: ['harbor'], cabin: ['harbor'], battle: ['harbor'], port: ['harbor'],
      gate: ['gate'], landwar: ['gate'], find: ['gate'], 'return': ['gate'],
      buy: ['trade'], auto: ['harbor', 'trade'], sell: ['trade'], report: [sp], inn: ['inn']
    }[st.id];
    if (!A) return true;
    // 길을 잘못 들어 다른 도시에 들어왔으면 항구만
    var home = here === D.home, port = here === D.port;
    if (!home && !port) return kind === 'harbor' || kind === 'gate';
    return A.indexOf(kind) >= 0 || A.indexOf(kind + ':' + arg) >= 0;
  }
  function blockLine(kind) {
    var st = step(), s = S();
    if (s.loc.city !== D.home && s.loc.city !== D.port) return '제독, 여기는 들를 곳이 아닙니다. 항구나 성문으로 나가 갈 길을 갑시다.';
    if ((kind === 'mansion' || kind === 'palace') && st.other && (st.id === 'sponsor' || st.id === 'report')) return st.other;
    return st.block || '거긴 나중에 가지요, 제독.';
  }

  // ================================================================ 건너뛰기 (결과를 대신 채운다)
  var SKIP = {
    prologue: function (t) { },
    library: function (t) { var s = S(); G.Disc.addHint(D.disc, 'book:' + D.book); s.flags['read_' + D.book] = 1; t.f.book = 1; },
    tavern: function (t) { t.f.drink = t.f.maid = 1; },
    hire: function (t) {
      var s = S();
      D.mates.forEach(function (id) { if (!mate(id)) s.mates.push({ id: id, role: 'none', joined: U.dateNum(s.date), loyal: 70, from: D.home }); });
    },
    roles: function (t) { var m = mate('lacosa'); if (m && m.role === 'none') C().B.tavern.assign(m, 'surveyor'); t.f.role = m ? m.role : 'surveyor'; },
    sail: function (t) { t.f.sailed = 1; },
    cabin: function (t) { var m = mate('arana'); if (m) G.Cabins.place(m, 0); },
    battle: function (t) { t.f.won = 1; dropPirate(); },
    landwar: function (t) { t.f.lw = 1; },
    buy: function (t) { t.f.noCoral = 1; },
    sell: function (t) { t.f.noCoral = 1; }
  };
  TU.skip = async function () {
    var t = T(), st = step(); if (!t || !st || !SKIP[st.id] || UI.busy() || running) return;
    if (!(await UI.confirm('「' + st.title + '」 단계를 건너뛸까요? 이 단계에서 할 일은 한 것으로 칩니다.', '건너뛴다', '그만둔다', '튜토리얼'))) return;
    t.f['in_' + st.id] = 1; t.f['skip_' + st.id] = 1;
    SKIP[st.id](t);
    UI.toast('단계를 건너뛰었다 — ' + st.title, 'info', 3200);
  };

  // ================================================================ 고정 사건: 해적·도적·돌고래
  function seaSt() { var SEA = G.Scenes.sea; return scene() === 'sea' && SEA.runtime ? SEA.runtime() : null; }
  function landSt() { var L = G.Scenes.land; return scene() === 'land' && L.runtime ? L.runtime() : null; }
  function dist(latlon) { var l = S().loc; return G.Geo.dist(l.lon, l.lat, latlon[1], latlon[0]); }
  function pirateNpc(near) {
    var s = S(), l = s.loc, P = D.pirate;
    // 가는 쪽(세우타 방향) 앞바다에, 사이에 뭍이 없는 곳에서 나타난다 — 곧장 달려들 수 있게
    var pc = G.CITY_DATA[D.port], pd = pc.dock || [pc.lat, pc.lon], fwd = Math.atan2(pd[0] - l.lat, G.Geo.wrapLon(pd[1] - l.lon));
    for (var i = 0; i < 40; i++) {
      var ang = fwd + U.rf(-1, 1) * (i < 20 ? 0.9 : Math.PI), dd = (near || 1) * U.rf(0.55, 0.95), lon = l.lon + Math.cos(ang) * dd, lat = l.lat + Math.sin(ang) * dd;
      if (!G.Geo.isSea(lon, lat, 0.4)) continue;
      var clear = true;
      for (var q = 1; q < 8 && clear; q++) clear = G.Geo.isSea(l.lon + (lon - l.lon) * q / 8, l.lat + (lat - l.lat) * q / 8, 0.05);
      if (!clear) continue;
      var ships = []; for (var k = 0; k < P.n; k++) ships.push(P.ship);
      return { id: 'tut_pirate', tut: true, kind: 'pirate', lon: lon, lat: lat, heading: Math.atan2(l.lat - lat, G.Geo.wrapLon(l.lon - lon)), n: P.n, K: P.K, spd: 1.35, life: 30, hostile: true, zone: G.Ships.zone(lon, lat), ships: ships };
    }
    return null;
  }
  function dropPirate() { var st = seaSt(); if (st) st.npcs = st.npcs.filter(function (n) { return !n.tut; }); }
  /** 해전이 시작될 때의 상태 사본 — 지면 여기로 되돌린다 */
  var check = null;
  function weaken(k) {
    var B = G.Scenes.battle, bs = B.runtime && B.runtime(); if (!bs) return;
    bs.ships.forEach(function (b) { if (b.side === 'en') { b.crew = b.crew0 = Math.max(4, Math.round(b.crew * k)); b.hp = Math.max(6, Math.round(b.hp * k)); } });
  }
  /** battle.js finish: 튜토리얼 해전에서 이기지 못했을 때 — 되돌려서 다시 싸운다. true면 원래 뒷일을 하지 않는다 */
  TU.battleLost = async function (res) {
    var t = T(); if (!t || !check || res === 'win') return false;
    var st = STEPS[IDX.battle];
    var v = await UI.ask(st.lost.ask, st.lost.opts.map(function (o) { return { label: o[0], value: o[1] }; }), who('R'));
    var back = G.State.deserialize(check.data);
    back.tut.f.weak = (back.tut.f.weak || 0) + (v === 'weak' ? 1 : 0);
    back.tut.f.battleIn = 0;
    G.Game.state = back;
    var npc = U.clone(check.npc);
    await UI.fade(function () { G.Game.go('battle', { npc: npc }); });
    return true;
  };
  /** 산길의 도적 떼 — 육상전을 직접 연다 (지면 다시) */
  async function banditFight() {
    var t = T(), s = S(), l = s.loc, ls = landSt(), st = STEPS[IDX.landwar];
    if (ls) { ls.busy++; ls.paused = true; ls.path = null; }
    try {
      await play(st.intro); await play(st.teach);
      var n = D.bandits, party0 = l.party, crew0 = s.fleet.crew;
      for (;;) {
        var r = await G.Games.landWar({ enemy: { name: '도적 떼', kind: 'bandit', n: n }, party: l.party, terr: 'mountain', guns: false });
        if (r.res === 'win') {
          var lost = l.party - r.left; l.party = Math.max(1, r.left); s.fleet.crew = Math.max(1, s.fleet.crew - lost);
          var loot = n * 12; s.player.gold += loot; G.Fame.add('bt', 5 + (r.leaderDown ? 3 : 0));
          UI.toast('도적 떼를 물리쳤다! (금화 ' + loot + '닢)', 'sword', 4200);
          break;
        }
        // 졌거나 물러났다: 대원은 그대로 두고 다시
        l.party = party0; s.fleet.crew = crew0;
        var v = await UI.ask(st.lost.ask, st.lost.opts.map(function (o) { return { label: o[0], value: o[1] }; }), who('R'));
        if (v === 'weak') n = Math.max(3, Math.round(n * D.weak));
      }
      t.f.lw = 1;
    } catch (e) { console.error(e); t.f.lw = 1; }
    if (ls) { ls.busy--; }
    G.Game.refreshHud();
  }

  // ================================================================ 단계마다: 끝났는가 / 그때그때 할 일
  var DONE = {
    prologue: function (t, s) { return inCity(D.home) && C().current() && C().current().kind === 'library'; },
    library: function (t, s) { return !!t.f.book && !!s.hints[D.disc] || !!G.Disc.foundByMe(D.disc); },
    tavern: function (t, s) { return !!t.f.drink && !!t.f.maid; },
    hire: function (t, s) { return D.mates.every(function (id) { return !!mate(id); }); },
    roles: function (t, s) { var m = mate('lacosa'); return !m || (m.role !== 'none' && !!t.f.role); },
    sponsor: function (t, s) { return !!s.contract && s.contract.disc === D.disc; },
    depart: function (t, s) { return scene() === 'sea' || s.loc.mode === 'sea'; },
    sail: function (t, s) { return !!t.f.sailed || inCity(D.port); },
    cabin: function (t, s) { var m = mate('arana'); return !m || m.room === 0 || inCity(D.port); },
    battle: function (t, s) { return (!!t.f.won && scene() === 'sea') || inCity(D.port); },
    port: function (t, s) { return inCity(D.port); },
    gate: function (t, s) { return scene() === 'land' && dist([G.DISC[D.disc].lat, G.DISC[D.disc].lon]) < D.ambush || !!G.Disc.foundByMe(D.disc); },
    landwar: function (t, s) { return !!t.f.lw; },
    find: function (t, s) { return !!G.Disc.foundByMe(D.disc); },
    'return': function (t, s) { return inCity(D.port); },
    buy: function (t, s) { return !!(s.fleet.cargo[D.good] && s.fleet.cargo[D.good].q > 0) || !!t.f.noCoral; },
    auto: function (t, s) { return inCity(D.home); },
    sell: function (t, s) { return !s.fleet.cargo[D.good] || !!t.f.noCoral; },
    report: function (t, s) { return !s.contract && !!(s.disc[D.disc] && s.disc[D.disc].reported); },
    inn: function (t, s) { return !!t.f.saved; },
    epilogue: function () { return false; }
  };
  /** 여는 대사 앞뒤로 하는 일 */
  var ENTER = {
    prologue: async function (t, s) { if (C().current()) return; await play(STEPS[0].intro); },
    library: async function (t, s, st) { await play(st.intro); },
    sponsor: async function (t, s, st) { await play(st.intro); },
    sail: async function (t, s, st) { t.f.dep0 = [s.loc.lon, s.loc.lat]; await play(st.intro); },
    cabin: async function (t, s, st) { stopShip(); await play(st.intro); },
    battle: async function (t, s) { t.f.wins0 = s.stats.wins; var ss = seaSt(); if (ss && ss.target) ss.target.city = null; },
    port: async function (t, s, st) { if (scene() === 'sea') await play(st.intro); },
    gate: async function (t, s, st) {
      // 귀항 때 산호가 팔리게: 카스티야에 산호 유행 (js/systems/fad.js)
      if (G.Fad) { s.fad = s.fad || { log: [], on: [], off: {} }; s.fad.on.push({ g: D.good, k: 'n', key: R.cityOwner(G.CITY_DATA[D.home]), since: s.day, until: s.day + 90 }); }
      await play(st.intro);
    },
    landwar: async function (t, s) { await banditFight(); },
    find: async function (t, s, st) { await play(st.intro); await teach(t, st); var ls = landSt(); if (ls && !ls.busy && (ls.path || ls.dir)) { ls.paused = false; G.Scenes.land.refreshBar(); } },   // 가던 길을 다시 간다
    epilogue: async function (t, s, st) { await play(st.intro); await finishWindow(); }
  };
  /** 단계 안에서 때를 봐서 하는 일 (한 번에 하나) */
  var TICK = {
    tavern: async function (t, s, st) {
      if (t.f.drink && await once('drinkSaid', st.drink)) return;
      if (t.f.maid) await once('maidSaid', st.maid);
    },
    roles: async function (t, s, st) {
      var m = mate('lacosa'); if (!m || !t.f.role || t.f.roleSaid === t.f.role) return;
      t.f.roleSaid = t.f.role;
      await play(m.role === 'surveyor' ? st.surveyor : st.otherRole);
    },
    depart: async function (t, s) { if (inCity(D.home) && C().current() && C().current().kind === 'harbor') t.f.prep = 1; },
    battle: async function (t, s, st) {
      var ss = seaSt(); if (!ss) return;
      if (t.f.straitDue) { t.f.straitDue = 0; await play(st.strait); goOn(); return; }
      if (t.f.won) return;
      if (s.stats.wins > (t.f.wins0 || 0)) { t.f.won = 1; dropPirate(); await play(st.won); return; }
      if (ss.target && ss.target.city) ss.target.city = null;       // 싸움 전에는 입항하지 않는다 (앞바다에서 멈춘다)
      var pn = ss.npcs.filter(function (n) { return n.tut; })[0];
      if (pn) {
        // 통행료를 냈거나 달아났으면 물린다 (곧 다시 온다)
        if (!pn.hostile || pn.fled || pn.cooldown > 0) { dropPirate(); return; }
        // 노 젓는 배는 바람이 자도 온다: 우리 배가 서 있거나 뭍에 걸려 못 오면 바로 곁으로
        var pd = G.Geo.dist(s.loc.lon, s.loc.lat, pn.lon, pn.lat), still = ss.paused && !ss.stopping;
        if (pd > 0.28 && (still || pd > 1.8)) { var nx = pirateNpc(0.3); if (nx) { pn.lon = nx.lon; pn.lat = nx.lat; pn.heading = nx.heading; pd = G.Geo.dist(s.loc.lon, s.loc.lat, pn.lon, pn.lat); } }
        if (pd < 0.3 && still && G.Scenes.sea.meet) G.Scenes.sea.meet(pn);   // 서 있는 배에도 덤빈다
        return;
      }
      var npc = pirateNpc(); if (!npc) { await stuckHint(t, ss); return; }
      await play(t.f.pirate ? st.avoided : st.sighted);
      t.f.pirate = (t.f.pirate || 0) + 1;
      ss.npcs.push(npc);
      if (G.ShipSprite) G.ShipSprite.want(npc.ships);
      goOn();
    },
    port: async function (t, s, st) {
      var ss = seaSt(); if (!ss) return;
      dropPirate();
      if (t.f.straitDue) { t.f.straitDue = 0; await play(STEPS[IDX.battle].strait); goOn(); return; }
      await stuckHint(t, ss);
    },
    gate: async function (t, s, st) { if (scene() === 'land') await once('landSaid', st.land); },
    find: async function (t, s, st) {
      var ls = landSt(); if (!ls || !t.f.findDue || G.Disc.foundByMe(D.disc)) return;
      t.f.findDue = 0; ls.busy++;
      try { await play(st.spot); await G.Disc.find(G.DISC[D.disc], 'land'); } catch (e) { console.error(e); }
      ls.busy--; G.Game.refreshHud();
    },
    auto: async function (t, s, st) {
      if (!seaSt() || !t.f.dolphinDue) return;
      t.f.dolphinDue = 0; s.fleet.fatigue = Math.max(0, (s.fleet.fatigue || 0) - 6);
      await play(st.dolphin); UI.toast('돌고래 떼를 보고 선원들의 피로가 조금 풀렸다.', 'fish', 4000); goOn();
    }
  };
  /** 배를 그 자리에 바로 세운다 (돛을 거두고 미끄러지는 동안에도 날이 가므로 — 뱃길은 남겨 둔다) */
  function stopShip() { var ss = seaSt(); if (!ss) return; ss.vel = [0, 0]; G.Scenes.sea.halt(); }
  /** 대사 때문에 세운 배를 다시 가게 한다 (가던 길이 있을 때만) */
  function goOn() { var ss = seaSt(), SEA = G.Scenes.sea; if (ss && !ss.busy && (ss.paused || ss.stopping) && (ss.path || ss.dirCrs != null)) SEA.resume(); }
  /** 바다의 고비: 하루가 1초 남짓이라 0.35초 박자로는 놓친다 — 바다 장면이 한 걸음 갈 때마다 살펴, 때가 되면 배를 세우고 표시만 남긴다(대사는 박자에서) */
  function seaStep() {
    var t = T(), ss = seaSt(); if (!t || !ss || ss.busy || ss.paused) return;
    var st = step(), l = S().loc, L = D.legs, SEA = G.Scenes.sea;
    var pc = G.CITY_DATA[D.port], pd = pc.dock || [pc.lat, pc.lon];
    // 세우타 앞바다: 싸움 전에는 해적이 길을 막아 서고(배를 세운다 → 해적이 덤빈다), 싸움 뒤에는 앞바다로 잡은 뱃길이 그대로 입항으로 이어진다
    if (st.id === 'battle' && !t.f.won && dist(pd) < L.offPort) { stopShip(); return; }
    if (st.id === 'port' && ss.path && ss.target && !ss.target.city && G.Geo.dist(ss.target.lon, ss.target.lat, pd[1], pd[0]) < L.offPort) ss.target.city = pc;
    if (st.id === 'sail') { if (t.f.dep0 && !t.f.sailed && G.Geo.dist(l.lon, l.lat, t.f.dep0[0], t.f.dep0[1]) > L.sail) { t.f.sailed = 1; stopShip(); } }
    else if ((st.id === 'battle' || st.id === 'port') && t.f.won && !t.f.strait && dist(D.gibraltar) < L.strait) { t.f.strait = 1; t.f.straitDue = 1; stopShip(); }
    else if (st.id === 'auto') {
      if (!t.f.auto0) t.f.auto0 = [l.lon, l.lat];
      else if (!t.f.dolphin && G.Geo.dist(l.lon, l.lat, t.f.auto0[0], t.f.auto0[1]) > L.dolphin) { t.f.dolphin = 1; t.f.dolphinDue = 1; stopShip(); }
    }
  }
  /** 뭍의 고비: 도적 떼가 막아서는 곳·동굴 앞에서 걸음을 세운다 (하루가 1초 남짓이라 박자로는 지나친다) */
  function landStep() {
    var t = T(), ls = landSt(); if (!t || !ls || ls.busy || ls.paused) return;
    var st = step(), d = dist([G.DISC[D.disc].lat, G.DISC[D.disc].lon]);
    if (st.id === 'gate' && d < D.ambush) { ls.paused = true; G.Scenes.land.refreshBar(); }
    else if (st.id === 'find' && d < D.legs.find && !G.Disc.foundByMe(D.disc)) { t.f.findDue = 1; ls.paused = true; ls.path = null; ls.dir = null; G.Scenes.land.refreshBar(); }
  }
  /** 배가 한참(실제 시간 stuckSec초) 서 있으면 로코가 한마디 (한 번) */
  var stillAt = 0;
  async function stuckHint(t, ss) {
    if (!ss.paused || ss.path || ss.dirCrs != null) { stillAt = 0; return false; }
    if (!stillAt) stillAt = Date.now();
    if (t.f.stuckSaid || Date.now() - stillAt < (D.stuckSec || 20) * 1000) return false;
    t.f.stuckSaid = 1; await play(STEPS[IDX.battle].stuck); return true;
  }
  /** 맺는 대사 */
  var LEAVE = {
    library: async function (t, s, st) { await play(st.got); },
    tavern: async function (t, s, st) { await once('drinkSaid', st.drink); await once('maidSaid', st.maid); },
    hire: async function (t, s, st) { await play(st.done); },
    roles: async function (t, s, st) { await TICK.roles(t, s, st); await play(st.done); },
    sponsor: async function (t, s, st) { await play(st.done); },
    cabin: async function (t, s, st) { if (mate('arana') && mate('arana').room === 0 && !t.f.skip_cabin) await play(st.done); },   // 배는 세워 둔 채 — 다음 단계(해적)에서 다시 돛을 편다
    port: async function (t, s, st) {
      // 한 번 곧장 왔으니 항로가 열린다 (들렀다 왔어도 튜토리얼에서는 열어 준다)
      var RT = G.Routes; s.routes = s.routes || {};
      var k = RT.key(D.home, D.port); if (!s.routes[k] || !s.routes[k].n) s.routes[k] = { n: 1, best: null, last: U.dateNum(s.date) };
      await play(st.done);
    },
    landwar: async function (t, s, st) { await play(st.won); },
    find: async function (t, s, st) { await play(st.done); },
    sell: async function (t, s, st) { if (!t.f.noCoral) await play(st.done); },
    report: async function (t, s, st) { await play(st.done); }
  };

  // ================================================================ 진행
  var running = false, calm = 0;
  function idle() {
    if (UI.busy()) return false;
    var sc = scene();
    if (sc === 'city') return !(C().isBusy && C().isBusy());
    if (sc === 'sea') { var ss = seaSt(); return !!ss && !ss.busy; }
    if (sc === 'land') { var ls = landSt(); return !!ls && !ls.busy; }
    return false;
  }
  async function advance() {
    // 한 단계가 끝나면 틈 없이 다음 단계의 여는 대사로 (바다에서는 0.35초도 반나절이다)
    for (var n = 0; n < 4; n++) {
      var t = T(), s = S(), st = step(); if (!t || !st) return;
      var inKey = 'in_' + st.id;
      if (!t.f[inKey]) {
        // 여는 대사: 건물 안에서 시작해야 하는 단계는 그 건물에 들어온 뒤에
        if (st.id === 'library' && !(C().current() && C().current().kind === 'library')) return;
        t.f[inKey] = 1;
        if (ENTER[st.id]) await ENTER[st.id](t, s, st); else if (st.intro) await play(st.intro);
        if (T() !== t || !idle()) return;
      }
      if (DONE[st.id](t, s)) {
        if (LEAVE[st.id]) await LEAVE[st.id](t, s, st);
        if (T() !== t) return;
        t.step = Math.min(LAST, t.step + 1); shown = '';
        if (!idle()) return;
        continue;
      }
      if (await teach(t, st)) { if (T() !== t || !idle()) return; }
      if (TICK[st.id]) await TICK[st.id](t, s, st);
      return;
    }
  }
  function tick() {
    try {
      var t = T();
      if (!t) { if (saved) restoreData(); if (box) render(); return; }
      if (scene() === 'title') { render(); return; }
      applyData();
      render(); glow();
      // 해전: 처음 들어오면 멈춰 두고 한마디
      if (scene() === 'battle') {
        var B = G.Scenes.battle, bs = B.runtime && B.runtime();
        if (bs && !bs.over && !t.f.battleIn && !UI.busy() && !running) {
          t.f.battleIn = 1; bs.paused = true;
          if (t.f.weak) weaken(Math.pow(D.weak, t.f.weak));
          running = true;
          play(STEPS[IDX.battle].begin).catch(function (e) { console.error(e); }).then(function () { running = false; });
        }
        return;
      }
      if (running) return;
      if (!idle()) { calm = 0; return; }
      if (++calm < 2) return;
      running = true;
      advance().catch(function (e) { console.error(e); }).then(function () { running = false; calm = 0; });
    } catch (e) { console.error(e); running = false; }
  }
  TU.tick = tick;
  /** 시험용: 진행기가 곧 할 일이 있는가 (여는 대사·맺는 대사·바다의 고비) */
  TU.pending = function () {
    var t = T(), st = step(); if (!t || !st) return false;
    return running || !t.f['in_' + st.id] || !!DONE[st.id](t, S()) || !!t.f.straitDue || !!t.f.dolphinDue || !!t.f.findDue || (!!st.teach && !st.teachAt && !t.f['t_' + st.id]);
  };
  /** 시험용: 지금 하고 있는 일이 끝났는가 */
  TU.busy = function () { return running; };

  // ================================================================ 원래 기능 감싸기 (튜토리얼일 때만 끼어든다)
  function wrap(obj, name, fn) { var orig = obj && obj[name]; if (typeof orig !== 'function') return; obj[name] = fn(orig); obj[name]._tut = true; }
  function install() {
    var Cy = C(), TV = Cy.B.tavern, LB = Cy.B.library, SP = G.Sponsor, DS = G.Disc;
    // 건물: 순서에 없는 곳은 로코가 말린다
    wrap(Cy, 'visit', function (orig) {
      return async function (kind, arg) {
        if (T() && !allowed(kind, arg)) {
          if (UI.busy() || running || (Cy.isBusy && Cy.isBusy())) return;
          running = true;
          try { await UI.say(fmt(blockLine(kind)), who('R')); } finally { running = false; }
          return;
        }
        return orig.apply(this, arguments);
      };
    });
    // 도서관: 멜라의 책을 읽었는가
    wrap(LB, 'pick', function (orig) {
      return async function (c, b) {
        var r = await orig.apply(this, arguments), t = T();
        if (t && b) {
          if (b.id === D.book && S().flags['read_' + D.book]) t.f.book = 1;
          else if (at('library') && b.id !== D.book && !S().hints[D.disc]) await UI.say(fmt(step().other), who('R'));
        }
        return r;
      };
    });
    // 술집
    wrap(TV, 'drink', function (orig) { return async function () { var r = await orig.apply(this, arguments); if (T()) T().f.drink = 1; return r; }; });
    wrap(TV, 'maid', function (orig) { return async function () { var r = await orig.apply(this, arguments); if (T()) T().f.maid = 1; return r; }; });
    wrap(TV, 'servant', function (orig) { return async function () { var r = await orig.apply(this, arguments); if (T()) T().f.maid = 1; return r; }; });
    wrap(TV, 'encounter', function (orig) { return async function (c, force) { if (T() && !force) return; return orig.apply(this, arguments); }; });   // 들어서자마자 생기는 우연한 만남은 재운다
    wrap(TV, 'candidates', function (orig) {
      return function (c) {
        var list = orig.apply(this, arguments), t = T();
        if (t && c && c.id === D.home && !after('hire')) {
          D.mates.forEach(function (id) { if (!mate(id) && !list.some(function (m) { return m.id === id; })) list.unshift(G.MATE[id]); });
        }
        return list;
      };
    });
    wrap(TV, 'hireMate', function (orig) {
      return async function (c, m, w) {
        var t = T();
        if (t && m && !after('roles')) {
          if (D.mates.indexOf(m.id) < 0) { await UI.say(fmt(STEPS[IDX.hire].other), who('R')); return false; }
          if (before('hire')) { await UI.say('사람을 들이는 건 조금 뒤에 하지요. 먼저 이 술집을 둘러봅시다.', who('R')); return false; }
          await once('met_' + m.id, STEPS[IDX.hire].hired[m.id]);
        }
        var ok = await orig.apply(this, arguments);
        if (ok && t && D.mates.indexOf(m.id) >= 0) {
          // 자리는 다음 단계에서 직접 정한다
          var row = mate(m.id); if (row) { row.role = 'none'; delete row.ship; if (G.Cabins) G.Cabins.tidy(); }
        }
        return ok;
      };
    });
    wrap(TV, 'assign', function (orig) {
      return function (m, v) { var r = orig.apply(this, arguments), t = T(); if (t && m && m.id === 'lacosa') t.f.role = m.role; return r; };
    });
    // 후원자: 공작은 명성을 따지지 않고 만나 준다
    wrap(SP, 'fameNeed', function (orig) { return function (sp) { return T() && sp && sp.id === D.sponsor ? 0 : orig.apply(this, arguments); }; });
    wrap(Cy.B.mansion, 'enter', function (orig) {
      return async function (c, arg) {
        var ok = await orig.apply(this, arguments), t = T();
        if (ok !== false && t && arg === D.sponsor) {
          if (at('sponsor')) await once('dukeIn', step().enter);
          else if (at('report')) await once('dukeBack', step().enter);
        }
        return ok;
      };
    });
    // 발견: 튜토리얼에서는 헤라클레스의 동굴 하나만
    function only(list) { return (list || []).filter(function (d) { return d && d.id === D.disc; }); }
    wrap(DS, 'checkSea', function (orig) { return function () { var r = orig.apply(this, arguments); return T() ? only(r) : r; }; });
    wrap(DS, 'checkCity', function (orig) { return function () { var r = orig.apply(this, arguments); return T() ? only(r) : r; }; });
    wrap(DS, 'checkTrade', function (orig) { return function () { var r = orig.apply(this, arguments); return T() ? only(r) : r; }; });
    wrap(DS, 'checkLand', function (orig) {
      return function () {
        var r = orig.apply(this, arguments);
        if (T() && r && r.hits) { r.hits = []; if (r.near && r.near.id !== D.disc) { r.near = null; r.nearDist = 99; } }   // 동굴은 라 코사가 짚어 준다 (TICK.find)
        return r;
      };
    });
    // 저장: 자동 저장은 튜토리얼 칸에, 여관의 일지는 그대로
    wrap(G.State, 'saveAsync', function (orig) {
      return function (slot) {
        var t = T();
        if (t && slot === 0) slot = D.slot;
        var mine = t && slot >= 1 && slot <= 3 && at('inn') && !t.f.saved;
        if (mine) t.f.saved = 1;            // 적어 넣는 일지에도 「일지를 썼다」가 남게 미리 적는다
        var p = orig.call(this, slot);
        if (mine) p.then(function (r) { if (!r || !r.ok) t.f.saved = 0; });
        return p;
      };
    });
    // 바다의 고비는 장면이 한 걸음 갈 때마다 살핀다
    wrap(G.Scenes.sea, 'update', function (orig) { return function () { var r = orig.apply(this, arguments); if (T()) { try { seaStep(); } catch (e) { console.error(e); } } return r; }; });
    wrap(G.Scenes.land, 'update', function (orig) { return function () { var r = orig.apply(this, arguments); if (T()) { try { landStep(); } catch (e) { console.error(e); } } return r; }; });
    // 해전: 시작할 때 상태를 떠 둔다 (지면 되돌린다)
    wrap(G.Game, 'go', function (orig) {
      return function (name, arg) {
        var t = T();
        if (t && name === 'battle' && arg && arg.npc && at('battle')) {
          try { t.f.battleIn = 0; check = { data: G.State.serialize(), npc: U.clone(arg.npc) }; } catch (e) { console.error(e); check = null; }
        }
        return orig.apply(this, arguments);
      };
    });
  }

  function boot() {
    try { install(); } catch (e) { console.error(e); }
    setInterval(tick, 350);
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot); else boot();
})(window.G = window.G || {});
