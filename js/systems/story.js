/* 이야기 모드 「아버지의 사진」 진행기 (G.Story) — 자료·대사: js/data/story.js
   ■ 하는 일
     · 타이틀 「이야기 — 아버지의 사진」 → 고정된 제독(마테우스 다 코스타 · 포르투갈 · 탐험가 · 22세 · 리스본)과 동료 셋(자코모·안셀무 신부·에스테방)으로 시작한다.
       저장 상태에 s.story = { found: [흔적 id…], end } 가 붙는다. 없으면 이 진행기는 아무것도 바꾸지 않는다(본 게임·옛 저장에 영향 없음).
     · 프롤로그(어머니 → 부두 → 남작 저택 → 알함브라 계약)는 한 번에 이어서 보여 준다. 그 뒤로는 게임의 원래 기능을 그대로 쓴다.
     · 아버지의 흔적(G.STORY.traces)은 도시 발견물 — 단서를 받은 뒤 그 도시의 건물에 들어서면 찾는다. 찾으면 장면·기억을 보여 주고 다음 단서를 적는다.
       마지막 편지(한양)는 아틀란티스 사슬(크노소스·지브롤터·『티마이오스』)의 단서를 준다. 아틀란티스를 찾으면 아버지를 만난다(끝).
     · tale: true 가 붙은 발견물·동료·후원자는 이야기 모드가 아니면 소문·술집·저택에 나오지 않는다 (Disc.available·addHint·Frontier.mateReady·Sponsor.present 를 감쌈).
     · 자코모는 말을 두 배로 빨리 배운다 (G.MATE.giacomo.lgk — js/systems/cabins.js).
   ■ 수첩 「아버지의 사진」 탭(js/ui/info.js): 사진의 생김새, 찾은 흔적과 아버지가 다녀간 해, 다음 단서, 편지.
   ■ 대를 이은 뒤 (2026-10-30): G.Family.succeed를 감싸 s.story.line에 {gen, dad, dadGiven, forced, mom} 을 적는다.
     · 어머니 = 물러난 제독의 본처(1부인)가 리스본 자택을 지킨다 — 맞이·「어머니와 이야기」·비상금·아내와 어머니의 장면을 맡는다 (ST.mother).
     · 할머니 = 둘째 대는 레오노르(신트라·알파마 옛집에서 지내며 가끔 들른다 — ST.grandmaVisit), 셋째 대부터는 선선대의 본처 (ST.grandma).
     · 「아버지」의 흔적은 「할아버지」(ST.kin)의 흔적 — 흔적 장면의 제독 대사는 G.STORY.heirTrace, 다른 사람 대사의 「아버지」는 {gf}로, 아틀란티스의 만남은 heirMeet. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var ST = {}, D = G.STORY;
  G.Story = ST;
  if (!D) return;

  function S() { return G.Game && G.Game.state; }
  function T() { var s = S(); return s && s.story ? s.story : null; }
  function C() { return G.Scenes.city; }
  // 날짜 간격을 dateNum(y*10000+m*100+d) 뺄셈으로 재면 달·해가 바뀔 때 날 수가 엉뚱했다 — 저장값(dateNum)을 실제 날 번호로 바꿔 뺀다 (QA 2026-10-23)
  function dnDay(n) { n = +n || 0; return U.dayIndex({ y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100 || 1, d: n % 100 || 1 }); }
  function daysSince(n) { return U.dayIndex(S().date) - dnDay(n); }
  ST._dnDay = dnDay;   // 시험용
  function inCity() { var s = S(); return G.Game.sceneName === 'city' && s && s.loc.mode === 'city'; }
  ST.active = function () { return !!T(); };
  ST.isTrace = function (id) { return D.traces.some(function (t) { return t[0] === id; }); };
  /** 아버지 / 할아버지 (대를 이었을 때) */
  ST.kin = function () { var s = S(), g = s && s.player.generation || 1; return g >= 3 ? '증조할아버지' : g === 2 ? '할아버지' : '아버지'; };
  /** 사진·시계·편지의 이름 — 「아버지의 사진」 → 대를 이으면 「할아버지의 사진」 */
  ST.photoName = function () { return ST.kin() + '의 사진'; };

  // ================================================================ 대를 이은 뒤 — 어머니(물러난 제독의 본처)·할머니
  function gen() { var s = S(); return (s && s.player.generation) || 1; }
  /** 이번 대가 이어받을 때의 기록 {gen, dad, dadGiven, forced, mom} (옛 저장이면 선대의 부인 명단에서 어림) */
  function lineRec() {
    var t = T(); if (!t || gen() < 2) return null;
    var L = (t.line || []).filter(function (r) { return r.gen === gen(); })[0];
    if (L) return L;
    var el = (S().player.elders || []), e = el.filter(function (x) { return x.gen === 1 && x.kind === 'main'; })[0] || el.filter(function (x) { return x.gen === 1 && x.title === '어머니'; })[0];
    return { gen: gen(), dad: '', dadGiven: '', forced: false, mom: e ? e.id : null };
  }
  ST.heirMode = function () { return !!T() && gen() >= 2; };
  ST.line = lineRec;
  function speakerOfId(id) {
    var W = G.Wives;
    try { if (W && W.speaker) { var sp = W.speaker({ id: id }); if (!sp.name || sp.name === '부인') sp.name = W.name(id); return sp; } } catch (e) { console.error(e); }
    return { name: G.MAID[id] ? G.MAID[id].name : G.MATE[id] ? G.MATE[id].name : '어머니' };
  }
  /** 할머니: 둘째 대는 레오노르(visitTill세까지), 셋째 대부터는 선선대의 본처. 없으면 null */
  function gmInfo() {
    if (gen() < 2) return null;
    if (gen() === 2) { var age = S().date.y - (D.mother.born || 1438); return age <= (D.mother.visitTill || 90) ? { leonor: true } : null; }
    var t = T(), prev = (t.line || []).filter(function (r) { return r.gen === gen() - 1; })[0];
    var id = prev && prev.mom || ((S().player.elders || []).filter(function (x) { return x.gen === 2 && x.kind === 'main'; })[0] || {}).id;
    return id ? { id: id } : null;
  }
  ST.hasGrandma = function () { return !!gmInfo(); };
  /** 할머니의 얼굴: 전용 그림(portraits/npc/story_mother_old)이 있으면 그것, 없으면 이베리아 할머니 그림 (레오노르의 젊은 초상 대신 나이 든 모습으로) */
  function oldFace(seed) {
    var file = G.Img && G.Img.has && G.Img.has('portraits/npc/story_mother_old') ? 'story_mother_old' : 'street-folk/grandmother_ib';
    return npcFace(seed, 'noble', 'ib', 'f', file);
  }
  ST.grandma = function () {
    var g = gmInfo(), o;
    if (!g || g.leonor) { o = oldFace('story_grandmother'); o.name = D.mother.name.split(' ')[0] + ' 할머니'; return o; }
    o = oldFace('story_grandmother_' + g.id); o.name = speakerOfId(g.id).name + ' 할머니'; return o;
  };
  /** 어머니 역할: 첫 대는 레오노르, 대를 이으면 물러난 제독의 본처 (본처가 없으면 할머니가 집을 지킨다) */
  ST.mother = function () {
    if (!ST.heirMode()) return ST.leonor();
    var L = lineRec();
    if (L && L.mom) return speakerOfId(L.mom);
    return ST.grandma();
  };
  ST.motherName = function () { var m = ST.mother(); return (m && m.name) || D.mother.name; };
  function hasMom() { var L = lineRec(); return !ST.heirMode() || !!(L && L.mom); }

  // ================================================================ 자료 등록 (읽어 들일 때 한 번)
  function register() {
    // 흔적 → 도시 발견물 (discoveries.js 의 add 와 같은 꼴, 가치 ×1.75)
    if (G.DISCOVERIES && G.DISC) {
      var prev = null;
      D.traces.forEach(function (t) {
        if (G.DISC[t[0]]) { prev = t[0]; return; }
        var c = G.CITY_DATA[t[2]];
        // 그 도시의 다른 발견물과 한 점에 포개지지 않게 조금 비켜 둔다 (지도 표식이 겹치지 않게 — QA 2026-10-10)
        var la = c.lat - 0.012, lo = c.lon + 0.012;
        for (var tries = 0; tries < 8 && G.DISCOVERIES.some(function (x) { return x.lon != null && G.Geo.dist(lo, la, x.lon, x.lat) < 0.004; }); tries++) la -= 0.006;
        var o = { id: t[0], name: t[1], cat: 'treasure', lat: la, lon: lo, how: 'city', pw: t[7], val: Math.round(t[6] * 1.75 / 50) * 50, lang: c.lang, reg: c.region,
          desc: t[4], hint: t[5], r: 0.5, city: t[2], needHint: true, tale: true, year: t[3], need: prev ? [prev] : undefined };
        if (!o.need) delete o.need;
        if (G.discClueInstall) G.discClueInstall(o);   // 단서 이름 (js/data/cluenames.js)
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
      var face = file.indexOf('/') >= 0 ? 'portraits/' + file : 'portraits/npc/' + file;    // 'street-folk/elder_is' 처럼 다른 그림 묶음도
      sp.portrait = A.withImg(spec, [face].concat(base));
      sp.half = [face + '_half'].concat(G.Img.chain.halfOf ? G.Img.chain.halfOf(base) : []);
      if (inCity() && C().B && C().B.tavern && C().B.tavern.playerSpeaker) { sp.layout = 'duo'; sp.side = 'right'; sp.partner = C().B.tavern.playerSpeaker(); sp.emotion = 'neutral'; }
    } catch (e) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  }
  ST.leonor = function () { var o = npcFace('story_mother', 'noble', 'ib', 'f', 'story_mother'); o.name = D.mother.name; return o; };
  ST.father = function () { var o = npcFace('story_father', 'scholar', 'kr', 'm', 'story_father'); o.name = D.father.name + ' (' + D.father.alias + ')'; return o; };
  // 흔적마다 이야기해 주는 고장 사람 [마을 사람 id, 부르는 말]
  // [역할, 부르는 말, 얼굴(portraits/street-folk)] — 이름에 맞는 사람으로 선다 (예전에는 그 도시 시장 상인 그림이라 「늙은 안내인」이 젊은 여인으로 나왔다)
  var KEEPER = { ft_granada: ['priest', '궁전의 늙은 안내인', 'elder_is'], ft_cairo: ['keeper', '커피집 주인', 'innkeeper_is'], ft_delhi: ['soldier', '탑지기', 'soldier_in'],
    ft_cuzco: ['native', '쿠스코의 노인', 'elder_an'], ft_hangzhou: ['keeper', '찻집 주인', 'innkeeper_cn'], ft_sakai: ['priest', '절의 스님', 'elder_jp'], ft_hanyang: ['priest', '노승', 'elder_kr'] };
  var curTrace = null;
  function who(k) {
    try {
      if (k === 'P') return me();
      if (k === 'G') return mateWho('giacomo');
      if (k === 'A') return mateWho('anselmo');
      if (k === 'E') return mateWho('estevao');
      if (k === 'M') return ST.mother();
      if (k === 'O') return ST.grandma();
      if (k === 'F') return ST.father();
      if (k === 'W') { var w = G.Family.wifeSpeaker(); w.name = w.name || G.Family.wifeName(); return w; }
      if (k === 'B') { var sp = G.SPONSOR[D.sponsor]; return G.Sponsor.speaker(sp); }   // 도시 밖(편지·회상)에서도 얼굴과 무릎상으로 선다
      if (k === 'keeper') {
        var kp = KEEPER[curTrace] || ['merchant', '고장 사람', null];
        // 도시 안팎 모두 그 흔적이 있는 고장의 사람으로 얼굴과 무릎상이 선다 (도시 안이면 제독과 마주 본다 — npcFace).
        // 이야기의 실마리는 늘 알아듣게 (lang 3) — 그 고장 말을 몰라도 동료가 옮겨 준다 (예전에는 아랍어 따위로 뒤섞여 다음 단서를 읽을 수 없었다)
        var tr = (D.traces || []).filter(function (t) { return t[0] === curTrace; })[0], tc = tr && G.CITY_DATA[tr[2]];
        var o = npcFace('story_keeper_' + (curTrace || ''), kp[0], tc && G.Img.folkStyle ? G.Img.folkStyle(tc) : 'ib', 'm', kp[2] ? 'street-folk/' + kp[2] : 'story_keeper_' + (curTrace || ''));
        o.name = kp[1]; return o;
      }
    } catch (e) { console.error(e); }
    return {};
  }
  function fmt(t) {
    var p = S().player;
    var wife = G.Family && p.wife ? G.Family.wifeName() : '', k0 = homeKid() || (p.kids || [])[0], kid = k0 && G.Family ? G.Family.kidName(k0) : '';
    // 대를 이은 뒤: {dad} 아버지(물러난 제독) · {mom} 어머니 · {gm} 할머니 · {gf} 도앙과의 촌수 · {dadNote}·{dadNote2}·{gmFrom} 아버지의 형편
    var L = lineRec(), hh = (D.homeLife && D.homeLife.heir) || {}, gone = !!(L && L.forced);
    var dad = L ? (L.dadGiven || L.dad || '아버지') : D.father.alias, mom = ST.heirMode() ? ST.motherName() : D.mother.name;
    var gm = ST.heirMode() ? ST.grandma().name.replace(/ 할머니$/, '') : '';
    var en = D.ending || {};
    return String(t).replace(/\{name\}/g, p.name).replace(/\{kin\}/g, ST.kin()).replace(/\{kinCall\}/g, ST.kin()).replace(/\{father\}/g, D.father.alias).replace(/\{mother\}/g, D.mother.call)
      .replace(/\{dadNote2\}/g, (gone ? en.dadNote2Gone : en.dadNote2Alive) || '').replace(/\{dadNote\}/g, (gone ? hh.dadGone : hh.dadAlive) || '')
      .replace(/\{gmFrom\}/g, (gone ? hh.gmFromGone : hh.gmFromAlive) || '').replace(/\{gf\}/g, ST.kin())
      .replace(/\{(wife|kid|dad|mom|gm)([^}\/]*\/[^}]+)\}/g, function (m0, w, pair) { return U.jx({ wife: wife, kid: kid, dad: dad, mom: mom, gm: gm }[w], pair); })   // {wife이/가} → 조사만
      .replace(/\{dad\}/g, dad).replace(/\{mom\}/g, mom).replace(/\{gm\}/g, gm)
      .replace(/\{wife\}/g, wife).replace(/\{kid\}/g, kid).replace(/\{given\}/g, p.given || p.name);
  }

  // ================================================================ 사건 컷
  // 그림은 images/story/cuts/<이름>에 둔다. 파일이 없는 판에서는 대사만 이어 간다.
  var CUTS = {
    prologue: ['story/cuts/prologue', '리스본, 1480년', '어머니는 사진을 기름종이에 싸서 아들의 품에 넣어 주었다.'],
    ft_granada: ['story/cuts/granada', '그라나다 — 사자의 뜰', '아버지가 남긴 낯선 글자와 작은 아이 얼굴.'],
    ft_cairo: ['story/cuts/cairo', '카이로 — 얼음 장수의 기억', '먹을 찍지 않아도 글이 써지던 쇠막대 같은 붓.'],
    ft_delhi: ['story/cuts/delhi', '델리 — 녹슬지 않는 쇠기둥', '천 년 묵은 글자들 사이에 새겨진 아버지의 이름.'],
    ft_cuzco: ['story/cuts/cuzco', '쿠스코 — 돌 다섯 개의 놀이', '세상 반대편 아이들이 아버지에게 배운 놀이를 하고 있었다.'],
    ft_hangzhou: ['story/cuts/hangzhou', '항주 — 스물아홉 점의 판', '찻집 탁자에 새겨진 윷판이 조선을 가리켰다.'],
    ft_sakai: ['story/cuts/sakai', '사카이 — 제비와 박씨 이야기', '아버지가 마지막 밤에 들려준 이야기가 바다를 건너와 있었다.'],
    ft_hanyang: ['story/cuts/hanyang', '한양 — 사진 속의 자리', '사진 속 유적은 먼 옛날이 아니라 먼 미래의 경복궁이었다.'],
    atlantis: ['story/cuts/atlantis', '아틀란티스 — 바다 끝의 사람', '스물네 해가 지나도 아버지는 사진 속 모습 그대로였다.']
  };
  ST.cut = function (id) {
    var c = CUTS[id], key = c && c[0];
    if (!c || !G.Img || !G.Img.has(key)) return Promise.resolve(false);
    var src = G.Img.src(key);
    var html = '<div class="story-cut-stage"><img class="story-cut-image" src="' + U.esc(src) + '" alt="' + U.esc(c[1]) + '">' +
      '<div class="story-cut-caption">' + U.esc(c[2]) + '</div></div>';
    var win = UI.window({ title: c[1], icon: 'scroll', width: 1180, parch: false, html: html, clickAny: true,
      buttons: [{ label: '이야기를 잇는다', value: true, cls: 'navy' }] });
    if (win.el && win.el.classList) win.el.classList.add('story-cut-win');
    return win.result;
  };
  ST.cutKeys = function () { return Object.keys(CUTS).map(function (id) { return CUTS[id][0]; }); };
  /* 대화 장면: 제독이 말할 때도 지금 마주한 사람과 둘이 선다 — 얼굴 하나 → 둘 → 하나로 바뀌지 않게.
     마주한 사람 = 같은 장면(내레이션 N 사이)에서 바로 앞에 말한 다른 사람, 없으면 곧 말할 사람 */
  function speakerOf(l) { return Array.isArray(l) ? l[0] : l && l.ask ? (l.by || 'P') : null; }
  function partnerKey(lines, i) {
    var j, k;
    for (j = i - 1; j >= 0; j--) { k = speakerOf(lines[j]); if (!k || k === 'N') break; if (k !== 'P') return k; }
    for (j = i + 1; j < lines.length; j++) { k = speakerOf(lines[j]); if (!k || k === 'N') break; if (k !== 'P') return k; }
    return null;
  }
  function facing(k, lines, i) {
    var sp = who(k);
    if (k !== 'P') return sp;
    var pk = partnerKey(lines, i), pt = pk ? who(pk) : null;
    if (pt && pt.portrait) { sp.layout = 'duo'; sp.side = 'left'; sp.choiceSide = 'left'; sp.partner = pt; sp.emotion = 'neutral'; }
    return sp;
  }
  /* pair = ['W', 'M']: 아내와 어머니의 장면 — 두 사람이 말할 때는 서로 마주 선다 (아내 왼쪽 · 어머니 오른쪽) */
  function paired(k, sp, pair) {
    if (!pair || pair.indexOf(k) < 0) return sp;
    var other = pair[0] === k ? pair[1] : pair[0], pt = who(other);
    if (pt && pt.portrait) { sp.layout = 'duo'; sp.side = k === pair[0] ? 'left' : 'right'; sp.partner = pt; sp.emotion = sp.emotion || 'neutral'; }
    return sp;
  }
  async function play(lines, pair) {
    for (var i = 0; i < (lines || []).length; i++) {
      var ln = lines[i];
      if (Array.isArray(ln)) await UI.say(fmt(ln[1]), paired(ln[0], facing(ln[0], lines, i), pair));
      else if (ln && ln.ask) {
        var v = await UI.ask(fmt(ln.ask), ln.opts.map(function (o, k) { return { label: o[0], value: k }; }), facing(ln.by || 'P', lines, i));
        var o = ln.opts[v == null ? 0 : v];
        if (Array.isArray(o[1])) await play(o[1], pair);
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
    await ST.cut('prologue');
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
      var sc = D.scenes[d.id] || {}, scene = sc.scene, mem = sc.memory;
      if (ST.heirMode()) {   // 대를 이은 뒤: 제독의 대사는 손자의 것으로, 다른 사람의 「아버지」는 할아버지로, 기억은 아버지에게서 들은 이야기로
        scene = heirScene(d.id, scene);
        if (mem && mem.length && HD0().heir) mem = [['N', HD0().heir.memoryLead]].concat(mem);
      }
      curTrace = d.id;
      try {
        await ST.cut(d.id);
        await play(scene);
        if (mem && mem.length) await play(mem);
      } catch (e) { console.error(e); }
      curTrace = null;
      (sc.next || []).forEach(function (id) { ST.hint(id); });
      if (d.id === 'ft_hanyang') {
        t.letter = U.dateNum(s.date);
        s.player.items.push({ id: 'watch', kind: 'keepsake', name: ST.kin() + '의 시계', desc: '바늘이 멈춘 작은 시계. 편지에는 아틀란티스에 가져오면 다시 돌지도 모른다고 적혀 있다.', tale: true });
        UI.toast(ST.kin() + '의 편지와 멈춘 시계를 얻었다. 아틀란티스의 실마리를 따라가자.', 'scroll', 5200);
      }
      G.State.log('「' + d.name + '」 — ' + ST.kin() + '의 흔적을 찾았다. (' + d.year + '년의 자취)');
      return;
    }
    if (d.id === D.endDisc && !t.end) await ST.ending();
  };
  /** 대를 이은 뒤의 흔적 장면: 제독(P)의 대사는 G.STORY.heirTrace 로 차례대로 바꾸고, 다른 사람·내레이션의 「아버지」는 {gf}(할아버지)로.
      「남작 아버지」(자코모의 아버지)와 도앙의 편지(F)는 그대로 둔다 */
  function heirText(t) {
    return String(t).replace(/남작 아버지/g, '\u0001').replace(/자네가 태어난 지/g, '자네 아버지가 태어난 지').replace(/네가 아버지를/g, '네 아버지가 {gf}를')
      .replace(/그 사람 아들이라면/g, '그 사람의 핏줄이라면').replace(/아버지/g, '{gf}').replace(/\u0001/g, '남작 아버지');
  }
  function heirScene(id, lines) {
    var ps = (D.heirTrace || {})[id] || [], pi = 0;
    return (lines || []).map(function (l) {
      if (!Array.isArray(l)) return l;
      if (l[0] === 'P') { var alt = ps[pi++]; return ['P', alt != null ? alt : heirText(l[1])]; }
      if (l[0] === 'F') return l;
      return [l[0], heirText(l[1])];
    });
  }
  ST._heirScene = heirScene;   // 시험용
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
    await ST.cut('atlantis');
    var heir = ST.heirMode() && D.ending.heirMeet, done = fmt(heir ? D.ending.heirDone : D.ending.done);
    await play(heir ? D.ending.heirMeet : D.ending.meet);
    s.player.items.forEach(function (it) { if (it.id === 'watch') { it.desc = '다시 돌기 시작한 작은 시계. 두 해마다 한 번, 아틀란티스에서 ' + ST.kin() + '를 만날 수 있다.'; } });
    G.Fame.add('ex', 1200);
    G.State.log(done + ' (명성 +1,200)');
    var html = '<div style="font-size:19px;line-height:1.7">' + U.esc(done) + '<br><span class="muted">걸린 날: ' + U.num(dnDay(t.endDate) - dnDay(t.started)) + '일 · 찾은 흔적 ' + t.found.length + ' / ' + D.traces.length + '</span>' +
      '<div class="sep"></div>이야기는 여기서 한 매듭을 짓습니다. 항해는 그대로 이어집니다 — 두 해마다 한 번 아틀란티스에 들르면 ' + ST.kin() + '를 다시 만날 수 있습니다.</div>';
    await UI.window({ title: ST.photoName() + ' — 끝', icon: 'laurel', width: 680, html: html, buttons: [{ label: '항해를 이어 간다', value: 'ok', cls: 'navy' }] }).result;
    G.Game.refreshHud();
  };
  /** 아틀란티스에 다시 들렀을 때(끝난 뒤) — 두 해에 한 번 */
  ST.revisit = async function () {
    var s = S(), t = T(); if (!t || t.end !== 'done') return false;
    var now = U.dateNum(s.date), last = t.lastMeet || t.endDate;
    if (daysSince(last) < 365 * 2 - 30) return false;
    t.lastMeet = now;
    await UI.say('돌섬 위, 늙지 않은 ' + ST.kin() + '가 손을 흔든다. 「왔구나. 바람이 바뀌기 전에 이야기나 하자.」', ST.father());
    if (s.mates.length) await UI.say('……' + ST.kin() + '는 두 해 동안의 바다 이야기를 다 듣고 나서야 손을 놓아주었다.', {});
    s.fleet.fatigue = 0; s.fleet.discipline = Math.min(100, (s.fleet.discipline || 0) + 20);
    return true;
  };

  // ================================================================ 수첩 「아버지의 사진」
  /** 크게 보는 사진. 소지품의 팬던트와 수첩의 사진이 함께 쓴다. */
  ST.showPhoto = function () {
    var ph = D.photo, pn = ST.photoName();
    var win = UI.window({ title: pn, icon: 'book', width: 1030, height: 820, clickAny: false,
      html: '<div class="story-photo-view" role="img" aria-label="' + U.esc(ph.desc) + '"><div class="story-photo-locket"></div></div>' +
        '<div class="story-photo-caption"><b>' + U.esc(pn) + '</b><span>' + U.esc(ph.desc) + '</span></div>',
      buttons: [{ label: '사진을 넣는다', value: true, cls: 'navy' }] });
    var cv = G.Img.make(['story/photo'], 600, 750, function () {
      var c = document.createElement('canvas'); c.width = 600; c.height = 750;
      drawPhotoFallback(c.getContext('2d'), 600, 750); return c;
    }, { fit: 'cover', fx: 0.48, fy: 0.48 });
    cv.className = 'story-photo-large';
    win.content.querySelector('.story-photo-locket').appendChild(cv);
    return win.result;
  };

  /** 소지품에 달 작은 팬던트 — 안에는 큰 사진과 같은 그림을 접어 넣는다. */
  ST.photoPendant = function (host) {
    var b = U.el('button', 'story-photo-pendant');
    b.type = 'button'; b.title = ST.photoName() + '을 크게 본다'; b.setAttribute('aria-label', b.title);
    var cv = G.Img.make(['story/photo'], 72, 82, function () {
      var c = document.createElement('canvas'); c.width = 72; c.height = 82;
      drawPhotoFallback(c.getContext('2d'), 72, 82); return c;
    }, { fit: 'cover', fx: 0.42, fy: 0.42 });
    cv.className = 'story-photo-pendant-picture'; b.appendChild(cv);
    b.onclick = function () { ST.showPhoto(); };
    host.appendChild(b); return b;
  };

  /** 「이 도시에서 할 일」 판: 아버지의 흔적 — 이 도시에 있으면 건물로, 아니면 다음 갈 곳을 (누르면 수첩 「아버지의 사진」) */
  ST.todo = function (c) {
    var s = S(), t = T(); if (!t || t.end === 'done' || !t.prologue) return [];
    var next = D.traces.filter(function (tr) { return !G.Disc.foundByMe(tr[0]); })[0], open = function () { G.Info.open('story'); };
    if (!next) return t.letter ? [{ icon: 'scroll', hot: false, text: ST.kin() + '의 편지 — 아틀란티스의 실마리를 따라간다 (크노소스·지브롤터·『티마이오스』)', onClick: open }] : [];
    if (!s.hints[next[0]]) return [];
    var tc = G.CITY_DATA[next[2]];
    if (tc.id === c.id) { var f = R.facilities(c), k = f.tavern ? 'tavern' : f.market ? 'market' : null; return [{ kind: k, icon: 'star', hot: true, text: ST.kin() + '의 흔적 — 이 도시의 건물에 들어서면 알아볼 수 있다', onClick: k ? null : open }]; }
    return [{ icon: 'scroll', text: ST.kin() + '의 흔적 — 다음은 <b>' + U.esc(tc.name) + '</b> (수첩 「' + ST.photoName() + '」)', onClick: open }];
  };
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
      '<h4 style="margin:12px 0 6px">' + U.esc(ST.photoName()) + '</h4><div class="muted" style="font-size:15px;line-height:1.6">' + U.esc(ph.desc) + '</div>' +
      '<div class="sep"></div><div style="font-size:15px;line-height:1.6"><b>사람</b> — ' + U.esc(ph.look) + '<br><b>뒤편</b> — ' + U.esc(ph.back) + '<br><b>틈새</b> — ' + U.esc(ph.people) + '</div>' +
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
      box.title = '사진을 크게 본다'; box.setAttribute('role', 'button'); box.setAttribute('tabindex', '0');
      box.appendChild(cv); box.onclick = function () { ST.showPhoto(); };
      box.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ST.showPhoto(); } };
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

  // ================================================================ 자택의 어머니 · 아내와 어머니 (자료: G.STORY.homeLife)
  function HD0() { return D.homeLife || {}; }
  /** 이번 대의 집안 대사: 첫 대는 레오노르의 것, 대를 이으면 어머니(본처)의 것 — 본처가 없으면 할머니가 집을 지킨다 */
  function HD() {
    var h = HD0(); if (!ST.heirMode() || !h.heir) return h;
    var hh = h.heir, o = {}, k;
    for (k in h) o[k] = h[k];
    ['greet', 'greetEnd', 'talk', 'talkFound', 'allowance', 'allowanceAgain', 'allowanceSoon'].forEach(function (x) { if (hh[x]) o[x] = hh[x]; });
    if (!hasMom()) { o.greet = hh.gmGreet || o.greet; o.talk = hh.gmTalk || o.talk; o.talkFound = []; o.greetEnd = null; }
    o.family = (h.family || []).filter(function (e) { return !e.gen1; }).concat(hh.family || []);
    return o;
  }
  /** 할머니가 없으면(셋째 대에 기록이 없거나 레오노르가 너무 늙었으면) 할머니(O)의 대사는 건너뛴다 */
  function dropMissing(lines) { return ST.hasGrandma() ? lines : (lines || []).filter(function (l) { return !(Array.isArray(l) && l[0] === 'O'); }); }
  /** 이야기 모드에서 이 도시가 제독의 고향(어머니가 사는 집)인가 */
  ST.atHome = function (c) { var s = S(); return !!(T() && s && c && c.id === s.player.home); };
  function pickLines(list, key) {
    var t = T(); if (!list || !list.length) return null;
    var last = t[key], i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === last) i = (i + 1) % list.length;
    t[key] = i; return list[i];
  }
  /** 집에 들어설 때 어머니가 맞는다 (아내가 있으면 아내 다음에) */
  ST.motherGreet = async function (c) {
    var t = T(); if (!ST.atHome(c)) return false;
    // 대를 이은 뒤 처음 집에 들어설 때: 어머니(본처)와 할머니가 맞고, 사진(과 시계)을 물려준다 — 대마다 한 번
    if (ST.heirMode() && t.heirIntro !== gen() && HD0().heir) {
      t.heirIntro = gen(); t.gmLast = U.dateNum(S().date);
      await play(dropMissing(t.end === 'done' ? HD0().heir.introEnd : HD0().heir.intro));
      return 'intro';
    }
    var L = HD().greet; if (t.end === 'done' && U.chance(0.4)) L = HD().greetEnd;
    await play(pickLines(L, 'greetI'));
    return true;
  };
  /** 「어머니와 이야기」 */
  ST.motherTalk = async function () {
    var t = T(); if (!t) return;
    var L = (HD().talk || []).slice(); if (t.found && t.found.length) L = L.concat(HD().talkFound || []);
    await play(pickLines(L, 'talkI'));
  };
  /** 비상금: 가진 돈(소지금+금고)이 적으면 어머니가 도와준다 (allowanceCfg.gap 일에 한 번) */
  ST.allowance = async function (c) {
    var s = S(), t = T(), cf = HD().allowanceCfg || {}; if (!ST.atHome(c)) return false;
    var money = (s.player.gold || 0) + (s.player.bank || 0);
    if (money > (cf.below || 2000)) return false;
    var now = U.dateNum(s.date);
    if (t.allowLast != null && daysSince(t.allowLast) < (cf.gap || 180)) {
      if (t.allowSoonSaid !== t.allowLast) { t.allowSoonSaid = t.allowLast; await play(HD().allowanceSoon); }
      return false;
    }
    await play(t.allowN ? HD().allowanceAgain : HD().allowance);
    s.player.gold += cf.gift || 7777; t.allowLast = now; t.allowN = (t.allowN || 0) + 1;
    var mn = ST.motherName();
    G.State.log((hasMom() ? '어머니 ' : '') + mn + U.jx(mn, '이/가') + ' 비상금으로 금화 ' + U.num(cf.gift || 7777) + '닢을 주었다.');
    UI.toast((hasMom() ? '어머니' : '할머니') + '의 비상금 — 금화 ' + U.num(cf.gift || 7777) + '닢', 'coin', 4200);
    G.Game.refreshHud();
    return true;
  };
  /** 집에서 할머니 치맛자락을 붙들고 뛰어다닐 만한 아이: 이름이 있고, 두 살~열두 살, 배에 타지 않은 아이 (QA 2026-10-10) */
  function homeKid() {
    var p = S().player, F = G.Family; if (!F) return null;
    return (p.kids || []).filter(function (k) { var a = F.kidAge(k); return !k.unnamed && !k.aboard && a >= 2 && a <= 12; })[0] || null;
  }
  function famOk(e) {
    var s = S(), p = s.player, t = T();
    if (e.need === 'kids') return !!homeKid();
    if (e.need === 'nokids') return !(p.kids || []).length;
    if (e.need === 'preg') return !!(p.preg && p.preg.told);
    if (e.need === 'found') return !!(t.found && t.found.length);
    if (e.need === 'end') return t.end === 'done';
    if (e.need === 'leonor') { var g = gmInfo(); return !!(g && g.leonor); }
    if (e.need === 'wife') return !!p.wife;
    if (e.need === 'dadAlive' || e.need === 'dadGone') { var L = lineRec(); return !!L && (e.need === 'dadGone') === !!L.forced; }
    return true;
  }
  /** 할머니가 잠깐 들른다 (대를 이은 뒤 · 어머니가 집을 지킬 때) — 집에 들어설 때 visitCfg.chance, 들른 뒤 gap일 동안은 오지 않는다. 들렀으면 true */
  ST.grandmaVisit = async function (c, force) {
    var s = S(), t = T(), hh = HD0().heir;
    if (!ST.heirMode() || !ST.atHome(c) || !hh || !hh.visits || !ST.hasGrandma() || !hasMom()) return false;
    var cf = hh.visitCfg || {}, now = U.dateNum(s.date);
    if (!force && t.gmLast != null && daysSince(t.gmLast) < (cf.gap || 30)) return false;
    var seen = t.gmSeen || (t.gmSeen = {});
    var cand = hh.visits.filter(famOk), fresh = cand.filter(function (e) { return !seen[e.id]; }), pool = fresh.length ? fresh : cand;
    if (!pool.length) return false;
    if (!force && !U.chance((cf.chance || 0.35) * (fresh.length ? 1 : 0.4))) return false;
    var e = pool[Math.floor(Math.random() * pool.length)];
    seen[e.id] = (seen[e.id] || 0) + 1; t.gmLast = now;
    await play(e.lines, ['O', 'M']);
    return true;
  };
  /** 아내와 어머니가 함께 있는 장면 — at: home · inn · mansion. 일어났으면 true */
  ST.family = async function (c, at, force) {
    var s = S(), t = T(), h = HD(); if (!ST.atHome(c) || !s.player.wife || !h.family) return false;
    var now = U.dateNum(s.date);
    if (!force && t.famLast != null && daysSince(t.famLast) < (h.famGap || 20)) return false;
    var seen = t.famSeen || (t.famSeen = {});
    var cand = h.family.filter(function (e) { return e.at === at && famOk(e); });
    var fresh = cand.filter(function (e) { return !seen[e.id]; });
    var pool = fresh.length ? fresh : cand;
    if (!pool.length) return false;
    var p = ((h.famChance || {})[at] || 0.3) * (fresh.length ? 1 : (h.famRepeat || 0.1));
    if (!force && !U.chance(p)) return false;
    var e = pool[Math.floor(Math.random() * pool.length)];
    seen[e.id] = (seen[e.id] || 0) + 1; t.famLast = now;
    await play(e.lines, ['W', 'M']);
    return true;
  };

  /** 대를 이은 직후: 사진·시계의 이름을 이번 대의 촌수로, 일지에 어머니가 집을 지킨다고 적는다 (장면은 처음 집에 들어설 때 — ST.motherGreet) */
  ST.afterSucceed = function (rec) {
    var s = S(), kin = ST.kin();
    (s.player.items || []).forEach(function (it) {
      if (it.id === 'photo' && it.tale) it.name = kin + '의 사진';
      if (it.id === 'watch' && it.tale) { it.name = kin + '의 시계'; if (T().end === 'done') it.desc = '다시 돌기 시작한 작은 시계. 두 해마다 한 번, 아틀란티스에서 ' + kin + '를 만날 수 있다.'; }
    });
    var mn = rec.mom ? ST.motherName() : null, g = gmInfo();
    if (mn) G.State.log('어머니 ' + mn + U.jx(mn, '이/가') + ' 리스본 집을 지킨다.' + (g ? ' ' + ST.grandma().name + '는 ' + ((rec.forced ? HD0().heir.gmFromGone : HD0().heir.gmFromAlive) || '') + ' 지내며 가끔 들른다.' : ''));
  };

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
    // 대를 이을 때: 누가 물러나고 누가 어머니(본처)가 되는지 적어 두고, 사진·시계 이름을 「할아버지의 …」로 (2026-10-30)
    if (G.Family) wrap(G.Family, 'succeed', function (orig) {
      return async function (k, forced) {
        var t = T(), p0 = S() && S().player;
        var rec = t && p0 ? { gen: (p0.generation || 1) + 1, dad: p0.name, dadGiven: p0.given || p0.name, forced: !!forced, mom: p0.wife || (k && k.mother) || null, y: S().date.y } : null;
        var r = await orig.apply(this, arguments);
        try { if (T() && rec && gen() === rec.gen) { (T().line || (T().line = [])).push(rec); ST.afterSucceed(rec); } } catch (e) { console.error(e); }
        return r;
      };
    });
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
