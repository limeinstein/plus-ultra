/* 이야기 모드 「아버지의 사진」 진행기 (G.Story) — 자료·대사: js/data/story.js
   ■ 하는 일
     · 타이틀 「이야기 — 아버지의 사진」 → 고정된 제독(마테우스 다 코스타 · 포르투갈 · 탐험가 · 22세 · 리스본)과 동료 셋(자코모·안셀무 신부·에스테방)으로 시작한다.
       저장 상태에 s.story = { found: [흔적 id…], end } 가 붙는다. 없으면 이 진행기는 아무것도 바꾸지 않는다(본 게임·옛 저장에 영향 없음).
     · 프롤로그(어머니 → 부두 → 남작 저택 → 알함브라 계약)는 한 번에 이어서 보여 준다. 그 뒤로는 게임의 원래 기능을 그대로 쓴다.
     · 아버지의 흔적(G.STORY.traces)은 도시 발견물 — 단서를 받은 뒤 그 도시의 건물에 들어서면 찾는다. 찾으면 장면·기억을 보여 주고 다음 단서를 적는다.
       마지막 편지(한양)는 아틀란티스 사슬(크노소스·지브롤터·『티마이오스』)의 단서를 준다. 아틀란티스를 찾으면 아버지를 만난다(끝).
     · tale: true 가 붙은 발견물·동료·후원자는 이야기 모드가 아니면 소문·술집·저택에 나오지 않는다 (Disc.available·addHint·Frontier.mateReady·Sponsor.present 를 감쌈).
     · 자코모는 말을 두 배로 빨리 배운다 (G.MATE.giacomo.lgk — js/systems/cabins.js).
   ■ 수첩 「아버지의 사진」 탭(js/ui/info.js): 사진의 생김새, 찾은 흔적과 아버지가 다녀간 해, 다음 단서, 편지. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var ST = {}, D = G.STORY;
  G.Story = ST;
  if (!D) return;

  function S() { return G.Game && G.Game.state; }
  function T() { var s = S(); return s && s.story ? s.story : null; }
  function C() { return G.Scenes.city; }
  function inCity() { var s = S(); return G.Game.sceneName === 'city' && s && s.loc.mode === 'city'; }
  ST.active = function () { return !!T(); };
  ST.isTrace = function (id) { return D.traces.some(function (t) { return t[0] === id; }); };
  /** 아버지 / 할아버지 (대를 이었을 때) */
  ST.kin = function () { var s = S(), g = s && s.player.generation || 1; return g >= 3 ? '증조할아버지' : g === 2 ? '할아버지' : '아버지'; };

  // ================================================================ 자료 등록 (읽어 들일 때 한 번)
  function register() {
    // 흔적 → 도시 발견물 (discoveries.js 의 add 와 같은 꼴, 가치 ×1.75)
    if (G.DISCOVERIES && G.DISC) {
      var prev = null;
      D.traces.forEach(function (t) {
        if (G.DISC[t[0]]) { prev = t[0]; return; }
        var c = G.CITY_DATA[t[2]];
        var o = { id: t[0], name: t[1], cat: 'treasure', lat: c.lat, lon: c.lon, how: 'city', pw: t[7], val: Math.round(t[6] * 1.75 / 50) * 50, lang: c.lang, reg: c.region,
          desc: t[4], hint: t[5], r: 0.5, city: t[2], needHint: true, tale: true, year: t[3], need: prev ? [prev] : undefined };
        if (!o.need) delete o.need;
        o.idx = G.DISCOVERIES.length; G.DISCOVERIES.push(o); G.DISC[o.id] = o;
        prev = o.id;
      });
    }
    // 동료 셋
    (D.mates || []).forEach(function (m) {
      var d = {}; for (var k in m) if (k !== 'zones' && k !== 'home') d[k] = m[k];
      if (G.MATES && !G.MATE[d.id]) { G.MATES.push(d); G.MATE[d.id] = d; }
      if (G.MATE_RANGE && !G.MATE_RANGE[m.id]) G.MATE_RANGE[m.id] = { zones: m.zones, home: m.home };
    });
    // 후원자
    if (G.SPONSORS && D.sponsorData && !G.SPONSOR[D.sponsorData.id]) { G.SPONSORS.push(D.sponsorData); G.SPONSOR[D.sponsorData.id] = D.sponsorData; }
  }
  register();

  // ================================================================ 말하는 사람·대사
  function mateWho(id) {
    var d = G.MATE[id]; if (!d) return { name: id };
    return { name: d.name, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3 };
  }
  function me() { var p = S().player; return { name: p.name, rigId: 'player', portrait: p.portrait, half: G.Img.chain.heroHalf() }; }
  function npcFace(seed, role, style, g, file) {
    var A = G.Art, sp = { lang: 3, rigId: 'npc:' + seed };
    try {
      var spec = A.npcSpec(seed, role, style, g), base = A.portraitKeys ? A.portraitKeys(spec) || [] : [];
      sp.portrait = A.withImg(spec, ['portraits/npc/' + file].concat(base));
      sp.half = ['portraits/npc/' + file + '_half'].concat(G.Img.chain.halfOf ? G.Img.chain.halfOf(base) : []);
      if (inCity() && C().B && C().B.tavern && C().B.tavern.playerSpeaker) { sp.layout = 'duo'; sp.side = 'right'; sp.partner = C().B.tavern.playerSpeaker(); sp.emotion = 'neutral'; }
    } catch (e) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  }
  ST.mother = function () { var o = npcFace('story_mother', 'noble', 'ib', 'f', 'story_mother'); o.name = D.mother.name; return o; };
  ST.father = function () { var o = npcFace('story_father', 'scholar', 'kr', 'm', 'story_father'); o.name = D.father.name + ' (' + D.father.alias + ')'; return o; };
  // 흔적마다 이야기해 주는 고장 사람 [마을 사람 id, 부르는 말]
  var KEEPER = { ft_granada: ['vendor', '궁전의 늙은 안내인'], ft_cairo: ['tavernkeeper', '커피집 주인'], ft_delhi: ['librarian', '탑지기'], ft_cuzco: ['vendor', '쿠스코의 노인'],
    ft_hangzhou: ['tavernkeeper', '찻집 주인'], ft_sakai: ['priest', '절의 스님'], ft_hanyang: ['priest', '노승'] };
  var curTrace = null;
  function who(k) {
    try {
      if (k === 'P') return me();
      if (k === 'G') return mateWho('giacomo');
      if (k === 'A') return mateWho('anselmo');
      if (k === 'E') return mateWho('estevao');
      if (k === 'M') return ST.mother();
      if (k === 'F') return ST.father();
      if (k === 'B') { var sp = G.SPONSOR[D.sponsor]; return inCity() ? G.Sponsor.speaker(sp) : { name: G.Sponsor.holderName(sp) }; }
      if (k === 'keeper') { var kp = KEEPER[curTrace] || ['vendor', '고장 사람']; return inCity() ? C().npc(kp[0], kp[1]) : { name: kp[1] }; }
    } catch (e) { console.error(e); }
    return {};
  }
  function fmt(t) {
    var p = S().player;
    return String(t).replace(/\{name\}/g, p.name).replace(/\{kin\}/g, ST.kin()).replace(/\{kinCall\}/g, ST.kin()).replace(/\{father\}/g, D.father.alias).replace(/\{mother\}/g, D.mother.call);
  }
  async function play(lines) {
    for (var i = 0; i < (lines || []).length; i++) {
      var ln = lines[i];
      if (Array.isArray(ln)) await UI.say(fmt(ln[1]), who(ln[0]));
      else if (ln && ln.ask) {
        var v = await UI.ask(fmt(ln.ask), ln.opts.map(function (o, k) { return { label: o[0], value: k }; }), ln.by ? who(ln.by) : {});
        var o = ln.opts[v == null ? 0 : v];
        if (Array.isArray(o[1])) await play(o[1]);
      }
    }
  }
  ST.play = play;

  // ================================================================ 시작
  /** 타이틀의 단추 */
  ST.begin = async function () {
    await G.State.ready;
    var html = '<div style="font-size:18px;line-height:1.7"><b>1480년, 리스본.</b> 행방불명된 아버지가 남긴 것은 「있을 수 없는 그림」 한 장 — 붓 자국이 없고, 세상 어디에도 없는 옷과 지붕이 찍힌 사진.<br>' +
      '하얀 남방의 항해사 <b>' + U.esc(D.name) + '</b>는 남작의 아들 <b>자코모 카사노바</b>, 안셀무 신부, 늙은 항해사 에스테방과 함께 아버지의 자취를 찾아 동쪽으로 떠난다.' +
      '<div class="sep"></div><div class="muted" style="font-size:15px">제독·동료·첫 목적지가 정해진 채 시작합니다. 그 뒤로는 보통 항해와 같이 자유롭게 — 아버지의 흔적은 수첩 「아버지의 사진」에서 따라갑니다. 자동 저장은 보통 항해와 같은 칸(자동 저장)을 씁니다.</div></div>';
    var v = await UI.window({ title: '이야기 — 아버지의 사진', icon: 'scroll', width: 680, html: html,
      buttons: [{ label: '그만둔다', value: null }, { label: '이야기를 시작한다', value: 'go', cls: 'navy' }] }).result;
    if (v !== 'go') return;
    await G.Game.ensureGeo();
    ST.start();
    await UI.fade(function () { G.Game.go('city', { cityId: D.home, story: true }); });
  };
  /** 고정된 제독·동료로 새 상태를 만든다 (시험에서도 쓴다) */
  ST.start = function () {
    var sk = {}; G.SKILLS.forEach(function (x) { sk[x.id] = 0; });
    var job = G.JOBS.filter(function (j) { return j.id === 'explorer'; })[0];
    for (var k in job.skills) sk[k] = job.skills[k];
    var lg = G.LANGS.map(function () { return 0; }); lg[1] = 3; lg[0] = 2; lg[2] = 1;
    var s = G.State.newGame({ name: D.name, nation: 'PT', job: 'explorer', age: 22, birth: { m: 3, d: 9 }, st: { str: 54, int: 66, mar: 50, cha: 62 }, sk: sk, lg: lg, diff: 'normal', gold: D.gold });
    s.player.given = D.given; s.player.surname = D.surname;
    s.fleet.ships[0].name = D.ship;
    // 얼굴: 하얀 남방의 항해사
    try {
      var A = G.Art, face = ['portraits/player/' + D.look];
      s.player.portrait = A.withImg(A.portraitSpec({ seed: 'player0PT', culture: 'med', g: 'm', age: 'young', cloth: '#e8e2d2', beard: 0 }), face);
      s.player.look = D.look;
    } catch (e) { console.error(e); }
    // 동료: 로코 대신 이야기의 세 사람
    s.mates = [];
    (D.mates || []).forEach(function (m) { s.mates.push({ id: m.id, role: (D.roles || {})[m.id] || 'none', joined: 0, loyal: 85 }); });
    // 사진
    s.player.items.push({ id: 'photo', kind: 'keepsake', name: D.photo.name, desc: D.photo.desc, tale: true });
    s.story = { found: [], end: null, started: U.dateNum(s.date) };
    G.Game.state = s;
    G.State.log('아버지가 남긴 사진 한 장을 들고 ' + D.name + U.jx(D.name, '이/가') + ' 리스본에서 아버지의 자취를 찾아 나섰다.');
    return s;
  };

  /** 프롤로그 — 어머니 → 부두(세 사람) → 남작 저택(첫 계약) */
  ST.prologue = async function (c) {
    var s = S(), t = T(); if (!t || t.prologue) return;
    var P = D.prologue;
    await play(P.intro);
    await play(P.harbor);
    await play(P.baron);
    ST.contract();
    await play(P.after);
    t.prologue = 1; s.flags.prologue = true;
    G.Game.refreshHud();
  };
  /** 남작과의 첫 계약 (알함브라) — 교섭 없이 정해진 조건 */
  ST.contract = function () {
    var s = S(), sp = G.SPONSOR[D.sponsor], d = G.DISC[D.first], o = D.contract;
    if (!sp || !d || s.contract) return;
    var due = U.addDays(s.date, o.years * 365);
    s.contract = { sponsor: sp.id, disc: d.id, advance: o.advance, reward: o.reward, valueK: G.Disc.valueK ? G.Disc.valueK(d) : 1, due: U.dateNum(due), start: U.dateNum(s.date), circ: false, loan: null };
    G.Disc.addHint(d.id, 'contract:' + sp.id);
    s.player.gold += o.advance;
    var rel = G.Sponsor.rel(sp.id); rel.met = 1; rel.trust = Math.max(rel.trust || 0, 40);
    // 첫 흔적(그라나다)의 단서도 함께 — 알함브라에서 찾는다
    ST.hint(D.traces[0][0]);
    G.State.log(G.Sponsor.holderName(sp) + U.jx(G.Sponsor.holderName(sp), '과/와') + ' 「' + d.name + '」 탐색 계약을 맺었다. (선금 ' + o.advance + '닢, 기한 ' + U.fmtDate(due) + ')');
    UI.toast('계약 성립! 선금 ' + U.num(o.advance) + '닢을 받았다.', 'seal', 4000);
  };
  /** 이야기의 단서를 적는다 (개척 단계·연쇄 조건을 건너뛴다 — 이야기가 직접 알려 주는 것) */
  ST.hint = function (id) {
    var s = S(), d = G.DISC[id]; if (!s || !d || G.Disc.foundByMe(id)) return false;
    if (s.hints[id]) return false;
    s.hints[id] = { src: 'story', d: U.dateNum(s.date) };
    if (G.Explore) G.Explore.ver++;
    UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll', 3600);
    return true;
  };

  // ================================================================ 흔적을 찾았을 때
  ST.onFind = async function (d) {
    var s = S(), t = T(); if (!t) return;
    if (ST.isTrace(d.id)) {
      if (t.found.indexOf(d.id) < 0) t.found.push(d.id);
      var sc = D.scenes[d.id] || {};
      curTrace = d.id;
      try {
        await play(sc.scene);
        if (sc.memory && sc.memory.length) await play(sc.memory);
      } catch (e) { console.error(e); }
      curTrace = null;
      (sc.next || []).forEach(function (id) { ST.hint(id); });
      if (d.id === 'ft_hanyang') {
        t.letter = U.dateNum(s.date);
        s.player.items.push({ id: 'watch', kind: 'keepsake', name: '아버지의 시계', desc: '바늘이 멈춘 작은 시계. 편지에는 아틀란티스에 가져오면 다시 돌지도 모른다고 적혀 있다.', tale: true });
        UI.toast('아버지의 편지와 멈춘 시계를 얻었다. 아틀란티스의 실마리를 따라가자.', 'scroll', 5200);
      }
      G.State.log('「' + d.name + '」 — ' + ST.kin() + '의 흔적을 찾았다. (' + d.year + '년의 자취)');
      return;
    }
    if (d.id === D.endDisc && !t.end) await ST.ending();
  };
  /** 아틀란티스 — 아버지와의 만남 */
  ST.ending = async function () {
    var s = S(), t = T(); if (!t || t.end) return;
    var hasLetter = !!t.letter;
    if (!hasLetter) {      // 편지 없이 아틀란티스에 먼저 닿았다 — 아버지는 아직 여기 묶이기 전
      await UI.say('물빛 아래 동심원의 성벽. 그러나 돌섬 위에는 아무도 없다. ……아직은.', {});
      t.earlyAtlantis = U.dateNum(s.date);
      return;
    }
    t.end = 'done'; t.endDate = U.dateNum(s.date);
    await play(D.ending.meet);
    s.player.items.forEach(function (it) { if (it.id === 'watch') { it.desc = '다시 돌기 시작한 작은 시계. 두 해마다 한 번, 아틀란티스에서 아버지를 만날 수 있다.'; } });
    G.Fame.add('ex', 1200);
    G.State.log(D.ending.done + ' (명성 +1,200)');
    var html = '<div style="font-size:19px;line-height:1.7">' + U.esc(D.ending.done) + '<br><span class="muted">걸린 날: ' + U.num(t.endDate - t.started) + '일 · 찾은 흔적 ' + t.found.length + ' / ' + D.traces.length + '</span>' +
      '<div class="sep"></div>이야기는 여기서 한 매듭을 짓습니다. 항해는 그대로 이어집니다 — 두 해마다 한 번 아틀란티스에 들르면 ' + ST.kin() + '를 다시 만날 수 있습니다.</div>';
    await UI.window({ title: '아버지의 사진 — 끝', icon: 'laurel', width: 680, html: html, buttons: [{ label: '항해를 이어 간다', value: 'ok', cls: 'navy' }] }).result;
    G.Game.refreshHud();
  };
  /** 아틀란티스에 다시 들렀을 때(끝난 뒤) — 두 해에 한 번 */
  ST.revisit = async function () {
    var s = S(), t = T(); if (!t || t.end !== 'done') return false;
    var now = U.dateNum(s.date), last = t.lastMeet || t.endDate;
    if (now - last < 365 * 2 - 30) return false;
    t.lastMeet = now;
    await UI.say('돌섬 위, 늙지 않은 ' + ST.kin() + '가 손을 흔든다. 「왔구나. 바람이 바뀌기 전에 이야기나 하자.」', ST.father());
    if (s.mates.length) await UI.say('……' + ST.kin() + '는 두 해 동안의 바다 이야기를 다 듣고 나서야 손을 놓아주었다.', {});
    s.fleet.fatigue = 0; s.fleet.discipline = Math.min(100, (s.fleet.discipline || 0) + 20);
    return true;
  };

  // ================================================================ 수첩 「아버지의 사진」
  ST.page = function (el) {
    var s = S(), t = T(); if (!t) { el.innerHTML = '<div class="muted">이야기 모드가 아니다.</div>'; return; }
    var ph = D.photo, kin = ST.kin();
    var rows = D.traces.map(function (tr, i) {
      var d = G.DISC[tr[0]], found = G.Disc.foundByMe(tr[0]), hinted = !!s.hints[tr[0]];
      var c = G.CITY_DATA[tr[2]];
      var st = found ? '<span class="tag good-text">찾음</span>' : hinted ? '<span class="tag warn-text">단서 있음</span>' : '<span class="tag">?</span>';
      var where = found || hinted ? c.name : (i === 0 ? c.name : '—');
      var when = found ? tr[3] + '년의 자취' : '';
      return '<tr><td>' + (i + 1) + '</td><td><b>' + (found || hinted ? U.esc(d.name) : '…') + '</b></td><td>' + where + '</td><td>' + when + '</td><td>' + st + '</td></tr>';
    }).join('');
    var next = D.traces.filter(function (tr) { return !G.Disc.foundByMe(tr[0]); })[0];
    var nextTxt = t.end === 'done' ? kin + '를 찾았다. 두 해마다 한 번 아틀란티스에서 만날 수 있다.'
      : !next ? '편지의 실마리를 따라 아틀란티스로 — 크노소스·지브롤터·『티마이오스』에서 꼬리를 물고 간다 (수첩 「단서」).'
      : s.hints[next[0]] ? G.CITY_DATA[next[2]].name + '의 건물에 들어서면 ' + kin + '의 자취를 알아볼 수 있다.'
      : '앞의 흔적을 찾으면 다음 단서가 열린다.';
    el.innerHTML = '<div class="grid2" style="grid-template-columns:320px 1fr;gap:26px"><div>' +
      '<div class="story-photo"></div>' +
      '<h4 style="margin:12px 0 6px">' + U.esc(ph.name) + '</h4><div class="muted" style="font-size:15px;line-height:1.6">' + U.esc(ph.desc) + '</div>' +
      '<div class="sep"></div><div style="font-size:15px;line-height:1.6"><b>사람</b> — ' + U.esc(ph.look) + '<br><b>뒤편</b> — ' + U.esc(ph.back) + '<br><b>뜰</b> — ' + U.esc(ph.people) + '</div>' +
      '</div><div>' +
      '<h4 style="margin:0 0 8px">' + kin + '의 흔적 <small class="muted">두 해마다 한 번, 머물렀던 자리로 다시 떨어진다</small></h4>' +
      '<table class="tbl"><tr><th></th><th>흔적</th><th>곳</th><th>때</th><th></th></tr>' + rows + '</table>' +
      '<div class="sep"></div><div><b>지금 할 일</b> — ' + nextTxt + '</div>' +
      (t.letter ? '<div class="sep"></div><h4 style="margin:0 0 6px">' + kin + '의 편지</h4><div class="muted" style="font-size:15px;line-height:1.65;white-space:pre-line">' + U.esc(fmt(letterText())) + '</div>' : '') +
      '</div></div>';
    // 사진: images/story/photo 가 있으면 그 그림, 없으면 양피지 틀에 글로만
    try {
      var box = el.querySelector('.story-photo'), chain = ['story/photo'];
      var cv = G.Img.make(chain, 320, 240, function () { var c = document.createElement('canvas'); c.width = 320; c.height = 240; drawPhotoFallback(c.getContext('2d'), 320, 240); return c; }, { fit: 'contain' });
      cv.style.width = '320px'; cv.style.height = '240px'; cv.style.borderRadius = '6px'; cv.style.boxShadow = '0 2px 10px rgba(0,0,0,.35)';
      box.appendChild(cv);
    } catch (e) { console.error(e); }
  };
  function letterText() {
    var ln = (D.scenes.ft_hanyang.scene || []).filter(function (x) { return Array.isArray(x) && x[0] === 'F'; })[0];
    return ln ? ln[1].replace(/\f/g, '\n\n') : '';
  }
  /** 사진 그림이 없을 때: 빛바랜 사진 틀 — 전각 지붕 실루엣과 사람 하나 */
  function drawPhotoFallback(ctx, w, h) {
    ctx.fillStyle = '#efe6d0'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#cfd8e8'; ctx.fillRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#8a9bb4'; ctx.fillRect(12, h * 0.55, w - 24, h - 24 - h * 0.55 + 12);
    // 전각
    ctx.fillStyle = '#4a4a52';
    ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.5); ctx.lineTo(w * 0.3, h * 0.34); ctx.lineTo(w * 0.7, h * 0.34); ctx.lineTo(w * 0.8, h * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9a3b2e'; ctx.fillRect(w * 0.26, h * 0.5, w * 0.48, h * 0.1);
    ctx.fillStyle = '#d8d0c0'; for (var i = 0; i < 6; i++) ctx.fillRect(w * 0.28 + i * w * 0.08, h * 0.5, w * 0.015, h * 0.1);
    // 사람
    ctx.fillStyle = '#5ab0e0'; ctx.fillRect(w * 0.47, h * 0.62, w * 0.07, h * 0.14);
    ctx.fillStyle = '#e9c9a8'; ctx.beginPath(); ctx.arc(w * 0.505, h * 0.58, w * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.strokeRect(w * 0.485, h * 0.57, w * 0.017, h * 0.02); ctx.strokeRect(w * 0.508, h * 0.57, w * 0.017, h * 0.02);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(12, 12, w - 24, h * 0.1);
    ctx.fillStyle = '#6b5a3e'; ctx.font = '12px sans-serif'; ctx.fillText('(그림 없음 — images/story/photo)', 18, h - 18);
  }

  // ================================================================ 게임 함수 감싸기
  function wrap(obj, name, fn) { var orig = obj && obj[name]; if (typeof orig !== 'function') return; obj[name] = fn(orig); obj[name]._story = true; }
  function install() {
    var DS = G.Disc, SP = G.Sponsor;
    if (DS) {
      // 이야기의 발견물은 이야기 모드에서만 소문·단서에 나온다
      wrap(DS, 'available', function (orig) { return function (d) { if (d && d.tale && !T()) return false; return orig.apply(this, arguments); }; });
      wrap(DS, 'addHint', function (orig) { return function (id, src) { var d = G.DISC[id]; if (d && d.tale && !T()) return false; return orig.apply(this, arguments); }; });
      // 찾았을 때: 장면·기억·다음 단서 / 아틀란티스에서 끝
      wrap(DS, 'find', function (orig) {
        return async function (d, how) {
          var r = await orig.apply(this, arguments);
          if (r !== false && T() && d && (d.tale || d.id === D.endDisc)) { try { await ST.onFind(d); } catch (e) { console.error(e); } }
          return r;
        };
      });
    }
    if (G.Frontier) wrap(G.Frontier, 'mateReady', function (orig) { return function (m) { if (m && m.tale && !T()) return false; return orig.apply(this, arguments); }; });
    if (SP) wrap(SP, 'present', function (orig) { return function (sp) { if (sp && sp.tale && !T()) return false; return orig.apply(this, arguments); }; });
    // 자코모의 무릎상: 카사노바 그림
    if (G.Img && G.Img.chain) wrap(G.Img.chain, 'mateHalf', function (orig) { return function (id) { var out = orig.apply(this, arguments), d = G.MATE[id]; return d && d.halfKey ? [d.halfKey].concat(out) : out; }; });
    // 끝난 뒤 아틀란티스에 다시 들르면 (바다 발견물 자리 — checkSea 가 찾은 것은 다시 찾지 않으므로 여기서 본다)
    if (G.Scenes.sea && G.Scenes.sea.update) wrap(G.Scenes.sea, 'update', function (orig) {
      return function () {
        var r = orig.apply(this, arguments), t = T();
        if (t && t.end === 'done' && !UI.busy()) {
          var s = S(), d = G.DISC[D.endDisc];
          if (d && s.loc.mode === 'sea' && G.Geo.dist(s.loc.lon, s.loc.lat, d.lon, d.lat) < (d.r || 1.6) * 0.5) ST.revisit();
        }
        return r;
      };
    });
  }
  function boot() { try { install(); } catch (e) { console.error(e); } }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot); else boot();
})(window.G = window.G || {});
