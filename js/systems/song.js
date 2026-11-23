/* 이야기 모드 「바닷길 노래」 진행기 (G.SongStory) — 자료·대사: js/data/song.js  2026-11-19 사용자 요청
   ■ 하는 일
     · 타이틀 「이야기 — 바닷길 노래」 (G.SONG.release 이후에만 보인다 — 미리 보기: 주소 ?song=1 또는 localStorage pu_song_preview=1)
       → 고정된 제독(김소영 · 조선 · 18세 · 한산도)과 동료 둘(황규·박월담), 사또 임처사의 맹선 「물마루」로 시작한다.
       저장 상태에 s.song = { act, beats: {사건 id: 날 번호}, rep: [배운 노래], venues: {도시: 날}, … } 이 붙는다. 없으면 아무것도 바꾸지 않는다.
     · 사건(G.SONG.beats)은 도시에 들어설 때(js/scenes/city.js) · 바다의 하루 끝(js/scenes/sea.js) · 발견했을 때 · 공연 뒤에 조건을 보고 하나씩 일어난다.
       대사에서 '?'가 붙은 동료의 줄은 그 동료가 배에 없으면 건너뛴다 — 순서를 바꿔 와도 이야기가 이어진다.
     · 바닷길 공연(SS.concert): 어느 도시에서든 「이 도시에서 할 일」 판의 맨 위 「바닷길 공연」 — 그 도시의 거리 그림이 무대가 되고,
       소영의 노래와 월담(거문고)·규(꽹과리·장구)·처사(아쟁)의 반주가 Web Audio로 흐른다. 관객·사례·사교 명성·선원 피로·규율,
       그 고장에서 처음 공연하면 그 고장 노래를 배운다(수첩 「소영의 지도」). 목소리를 잃은 동안은 열 수 없다.
     · 조선 사람 제독(nation 'KR'): R.nationName·R.nativeLang·R.isHomeNation 을 감싸 조선·조선어로. 명나라 항구는 사또가 준 노인(路引)으로 든다.
     · song: true 가 붙은 발견물·후원자·동료는 이 모드가 아니면 나오지 않는다. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var SS = {}, D = G.SONG;
  G.SongStory = SS;
  if (!D) return;

  function S() { return G.Game && G.Game.state; }
  function T() { var s = S(); return s && s.song ? s.song : null; }
  function today() { return U.dayIndex(S().date); }
  function inCity() { var s = S(); return G.Game.sceneName === 'city' && s && s.loc.mode === 'city'; }
  function curCity() { var s = S(); return s && s.loc.mode === 'city' ? G.CITY_DATA[s.loc.city] : null; }
  function aboard(id) { var s = S(); return !!(s && s.mates.some(function (m) { return m.id === id; })); }
  SS.active = function () { return !!T(); };

  /** 타이틀에 단추를 보일 때가 되었나 (G.SONG.release · 미리 보기) */
  SS.released = function () {
    try { if (/[?&]song=1\b/.test(location.search || '')) return true; } catch (e) { /* */ }
    try { if (window.localStorage && localStorage.getItem('pu_song_preview') === '1') return true; } catch (e) { /* */ }
    var t = Date.parse(D.release); return !isNaN(t) && Date.now() >= t;
  };

  // ================================================================ 자료 등록 (읽어 들일 때 한 번)
  function register() {
    if (G.DISCOVERIES && G.DISC) {
      (D.discs || []).forEach(function (o) {
        if (G.DISC[o.id]) return;
        var d = {}; for (var k in o) d[k] = o[k];
        d.song = true; d.needHint = true;
        if (G.discClueInstall) G.discClueInstall(d);
        d.idx = G.DISCOVERIES.length; G.DISCOVERIES.push(d); G.DISC[d.id] = d;
      });
    }
    if (G.SPONSORS && D.sponsorData && !G.SPONSOR[D.sponsorData.id]) { G.SPONSORS.push(D.sponsorData); G.SPONSOR[D.sponsorData.id] = D.sponsorData; }
  }
  register();

  // ================================================================ 말하는 사람
  var MATE_OF = { W: 'sy_woldam', H: 'sy_hwanggyu', I: 'sy_imcheosa', HK: 'sy_hook', ML: 'sy_malindi', GW: 'gyeonwoo', JN: 'jiknyeo', JI: 'jina' };
  function mateWho(id, name) {
    var d = G.MATE[id]; if (!d) return { name: name || id };
    return { name: name || d.name, rigId: 'mate:' + id, portrait: G.Scenes.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true };
  }
  function me() { var p = S().player; return { name: p.name, rigId: 'player', portrait: p.portrait, half: G.Img.chain.heroHalf() }; }
  function npcFace(seed, role, style, g, file, half) {
    var A = G.Art, sp = { lang: 3, rigId: 'npc:' + seed };
    try {
      var spec = A.npcSpec(seed, role || 'native', style || 'kr', g || 'm'), base = A.portraitKeys ? A.portraitKeys(spec) || [] : [];
      var face = file ? (file.indexOf('portraits/') === 0 ? file : 'portraits/' + (file.indexOf('/') >= 0 ? file : 'npc/' + file)) : null;
      sp.portrait = A.withImg(spec, (face ? [face] : []).concat(base));
      sp.half = (half ? [half] : face ? [face + '_half'] : []).concat(G.Img.chain.halfOf ? G.Img.chain.halfOf(base) : []);
    } catch (e) { /* 그림이 없어도 말은 한다 */ }
    return sp;
  }
  function who(k) {
    try {
      if (k === 'P') return me();
      if (k === 'N' || !k) return {};
      if (k === 'D') { var f = G.Story && G.Story.father ? G.Story.father() : npcFace('story_father', 'scholar', 'kr', 'm', 'story_father'); f.name = '도현 아저씨'; return f; }
      if (k === 'M') { var m = npcFace('song_mateus', 'captain', 'ib', 'm', 'portraits/player/navigator_white', 'characters/player_half_navigator_white'); m.name = '마테우스'; return m; }
      if (k === 'J') return mateWho('giacomo', '자코모');
      if (k === 'I') {
        var o = mateWho('sy_imcheosa'); var t = T();
        o.name = aboard('sy_imcheosa') ? '임처사' : t && t.beats && t.beats.a2_report ? '하회탈의 악사' : '사또 임처사';
        if (t && t.beats && t.beats.a2_report && G.Img.has('portraits/mates/sy_imcheosa_mask')) { var mk = npcFace('song_mask', 'soldier', 'kr', 'm', 'portraits/mates/sy_imcheosa_mask'); mk.name = o.name; return mk; }   // 탈 쓴 모습 그림이 생기면
        return o;
      }
      if (MATE_OF[k]) {
        if (k === 'JI' && !aboard('jina') && G.Hist) return G.Hist.speaker('wm_jina');
        return mateWho(MATE_OF[k]);
      }
      if (k === 'MA') return G.Hist ? G.Hist.speaker('wm_ma') : { name: '마대인' };
      if (k === 'DA') return G.MATE.d_artagnan ? mateWho('d_artagnan') : { name: '달타냥' };
      if (k === 'AB') return G.MATE.ali_baba ? mateWho('ali_baba') : { name: '알리바바' };
      var n = (D.npcs || {})[k];
      if (n) {
        // 전용 그림 images/portraits/npc/song_<키>(_half) 가 생기면 그것이 먼저 (없으면 n[4] 빌린 그림 → 코드 그림)
        var own = 'portraits/npc/song_' + k, has = G.Img && G.Img.has && G.Img.has(own);
        if (!n[1] && !has) return { name: n[0] };
        var sp = npcFace('song_' + k, n[1] || 'native', n[2] || 'kr', n[3] || 'f', has ? own : n[4]); sp.name = n[0]; return sp;
      }
    } catch (e) { console.error(e); }
    return { name: k };
  }
  SS.who = who;
  function repNames() { var t = T(); return ((t && t.rep) || []).map(function (k) { var r = D.concert.regions[k]; return r ? '「' + r.song + '」' : ''; }).filter(Boolean); }
  function fmt(t) {
    var s = S(), p = s.player, c = curCity();
    if (String(t).indexOf('{leg|') >= 0) t = G.StoryText.format(t, {
      leg: aboard('gyeonwoo') ? G.MATE.gyeonwoo.name : aboard('sy_woldam') ? G.MATE.sy_woldam.name : G.T('선원 하나'),
      arm: aboard('sy_hwanggyu') ? G.MATE.sy_hwanggyu.name : G.T('다른 선원')
    });
    var rep = repNames();
    return String(t).replace(/\{name\}/g, p.given || p.name).replace(/\{city\}/g, c ? c.name : '항구')
      .replace(/\{ship\}/g, (s.fleet.ships[0] || {}).name || D.ship)
      .replace(/\{rep\}/g, rep.length ? rep.join(', ') + '.' : '');
  }
  /* 대화 장면: 소영이 말할 때도 지금 마주한 사람과 둘이 선다 (G.Story 와 같은 규칙) */
  function speakerOf(l) { return Array.isArray(l) ? String(l[0]).replace(/^\?/, '') : l && l.ask ? (l.by || 'P') : null; }
  function partnerKey(lines, i) {
    var j, k;
    for (j = i - 1; j >= 0; j--) { k = speakerOf(lines[j]); if (!k || k === 'N') break; if (k !== 'P' && k !== 'Y') return k; }
    for (j = i + 1; j < lines.length; j++) { k = speakerOf(lines[j]); if (!k || k === 'N') break; if (k !== 'P' && k !== 'Y') return k; }
    return null;
  }
  function facing(k, lines, i) {
    var sp = who(k);
    if (k !== 'P') return sp;
    var pk = partnerKey(lines, i), pt = pk ? who(pk) : null;
    if (pt && pt.portrait) { sp.layout = 'duo'; sp.side = 'left'; sp.choiceSide = 'left'; sp.partner = pt; sp.emotion = 'neutral'; }
    return sp;
  }
  /** '?W' 같은 줄: 그 동료가 배에 없으면 건너뛴다 */
  function keep(l) {
    if (!Array.isArray(l)) return true;
    var k = String(l[0]); if (k.charAt(0) !== '?') return true;
    var id = MATE_OF[k.slice(1)]; return !id || aboard(id);
  }
  async function play(lines) {
    lines = (lines || []).filter(keep).map(function (l) { return Array.isArray(l) ? [String(l[0]).replace(/^\?/, ''), l[1]] : l; });
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (Array.isArray(ln)) await UI.say(fmt(ln[1]), facing(ln[0], lines, i));
      else if (ln && ln.ask) {
        var v = await UI.ask(fmt(ln.ask), ln.opts.map(function (o, k) { return { label: o[0], value: k }; }), facing(ln.by || 'P', lines, i));
        var o = ln.opts[v == null ? 0 : v];
        if (Array.isArray(o[1])) await play(o[1]);
      }
    }
  }
  SS.play = play;

  // ================================================================ 사건 컷 (images/song/cuts/<이름> — 파일이 없으면 대사만)
  var CUTS = {
    prologue: ['song/cuts/prologue', '한산도, 1474년', '폭풍이 지나간 아침, 갯바위 아래의 낯선 사내.'],
    qufu: ['song/cuts/qufu', '곡부 — 공부자의 사당', '이름이 지워지는 것을 두려워하는 사람들.'],
    longmen: ['song/cuts/longmen', '용문 — 십만 부처의 절벽', '노래를 하면 절벽이 한 박자 늦게 따라 부른다.'],
    todaiji: ['song/cuts/todaiji', '나라 — 도다이지', '사람 수로 세는 부처.'],
    lisbon: ['song/cuts/lisbon', '리스본 — 삐뚤어진 실밥', '처음 보는 얼굴인데, 오래 기다린 사람.'],
    atlantis: ['song/cuts/atlantis', '아틀란티스 — 마지막 소절', '끝맺지 못한 노래가 끝까지 갔다.'],
    malindi: ['song/cuts/malindi', '말린디 — 선창의 밀항자', '포도주 통 사이에서 우아한 손님을 만났다.'],
    hook: ['song/cuts/hook', '후크 — 해적섬을 되찾다', '폭풍 속에서 선장과 소리꾼이 함께 사람들을 구한다.'],
    jina: ['song/cuts/jina', '지나 — 장부 밖으로', '장부 너머의 세상을 보러 배에 오른다.'],
    gyeonwoo: ['song/cuts/gyeonwoo', '견우 — 항주의 오해', '두 동강 난 탁자 사이로 물음표투성이 지도가 펼쳐진다.'],
    jiknyeo: ['song/cuts/jiknyeo', '직녀 — 사카이의 바늘땀', '오해를 푼 뒤, 찢어진 돛을 함께 꿰맨다.'],
    tarzan: ['song/cuts/tarzan', '타잔 — 숲에서 내민 손', '작은 선물 하나가 낯선 이들의 거리를 좁힌다.'],
    rochefort: ['song/cuts/rochefort', '로슈포르 — 검은 망토와 암호 악보', '노래 속에 숨긴 암호를 읽는다.'],
    hook_piano: ['song/cuts/hook_piano', '후크 — 갈고리 선장의 밤 연주', '달빛 드는 선실, 건반 위로 흐르는 선장의 또 다른 가락.']
  };
  SS.cut = function (id) {
    var c = CUTS[id], key = c && c[0];
    if (!c || !G.Img || !G.Img.has(key)) return Promise.resolve(false);
    var html = '<div class="story-cut-stage"><img class="story-cut-image" src="' + U.esc(G.Img.src(key)) + '" alt="' + U.esc(c[1]) + '">' +
      '<div class="story-cut-caption">' + U.esc(c[2]) + '</div></div>';
    var win = UI.window({ title: c[1], icon: 'scroll', width: 1180, parch: false, html: html, clickAny: true, buttons: [{ label: '이야기를 잇는다', value: true, cls: 'navy' }] });
    if (win.el && win.el.classList) win.el.classList.add('story-cut-win');
    return win.result;
  };
  SS.cutKeys = function () { return Object.keys(CUTS).map(function (id) { return CUTS[id][0]; }); };

  // ================================================================ 시작
  SS.begin = async function (skip) {   // skip: 이야기 고르기 지도에서 이미 골랐다
    await G.State.ready;
    var html = '<div style="font-size:18px;line-height:1.7"><b>1480년, 조선 한산도.</b> 여섯 해 전 폭풍이 지나간 아침, 열두 살 소녀가 갯바위 아래에서 낯선 사내를 건졌다. 사내는 세상 이야기와 물음표투성이 지도, 그리고 끝맺지 못한 노래 한 곡을 남기고 사라졌다.<br>' +
      '열여덟이 된 소리꾼 <b>' + U.esc(D.name) + '</b>는 재담꾼 <b>황규</b>, 낙방 선비 <b>박월담</b>과 함께 그가 들려준 세상을 직접 만나러 떠난다.' +
      '<div class="sep"></div><div class="muted" style="font-size:15px">제독·동료·첫 목적지가 정해진 채 시작합니다. 그 뒤로는 보통 항해와 같이 자유롭게 — 지도와 다음 갈 곳은 수첩 「소영의 지도」에서 봅니다.<br>' +
      '어느 도시에서든 「바닷길 공연」을 열면 그 도시가 공연장이 됩니다. 「아버지의 사진」과 같은 세상의 다른 이야기입니다.</div></div>';
    var v = skip ? 'go' : await UI.window({ title: '이야기 — ' + D.title, icon: 'scroll', width: 700, html: html,
      buttons: [{ label: '그만둔다', value: null }, { label: '이야기를 시작한다', value: 'go', cls: 'navy' }] }).result;
    if (v !== 'go') return;
    await G.Game.ensureGeo();
    SS.start();
    await UI.fade(function () { G.Game.go('city', { cityId: D.home, song: true }); });
  };
  /** 고정된 제독·동료로 새 상태를 만든다 (시험에서도 쓴다) */
  SS.start = function () {
    var sk = {}; G.SKILLS.forEach(function (x) { sk[x.id] = 0; });
    sk.music = 3; sk.speech = 2; sk.hist = 1; sk.art = 1;
    var lg = G.LANGS.map(function () { return 0; }); lg[14] = 3; lg[7] = 1; lg[13] = 1;
    var s = G.State.newGame({ name: D.name, given: D.given, surname: D.surname, nation: 'KR', job: 'digger', age: 18, birth: { m: 7, d: 7 },
      st: { str: 58, int: 64, mar: 46, cha: 90 }, sk: sk, lg: lg, diff: 'normal', gold: D.gold, ships: [D.shipType] });
    var p = s.player, home = G.CITY_DATA[D.home];
    p.g = D.g; p.home = D.home;
    s.loc = { mode: 'city', city: D.home, lon: home.lon, lat: home.lat, heading: Math.PI };
    s.fleet.ships[0].name = D.ship;
    try {
      var A = G.Art;
      p.portrait = A.withImg(A.portraitSpec({ seed: 'song_soyoung', culture: 'ea', g: 'f', age: 'young', cloth: '#3a3f55', beard: 0 }), ['portraits/player/' + D.look]);
      p.look = D.look;
    } catch (e) { console.error(e); }
    s.mates = [];
    (D.start.mates || []).forEach(function (id) { s.mates.push({ id: id, role: (D.roles || {})[id] || 'none', joined: 0, loyal: 90, ev: 1, from: D.home }); });
    // 아는 곳: 조선·명·일본의 항구 (이베리아는 아직 모른다)
    s.known = G.CITY_DATA.filter(function (c) { return (c.region === 6 || c.region === 9) && (c.port || c.lang === 14); }).map(function (c) { return c.id; });
    if (s.known.indexOf(D.home) < 0) s.known.push(D.home);
    if (G.State.chartInit) G.State.chartInit(s);
    [[128.5, 35, 7], [123, 31, 7], [134, 34, 6], [119, 25, 5]].forEach(function (r) { G.State.revealChart(r[0], r[1], r[2]); });
    s.log = (s.log || []).filter(function (l) { return !/모험의 첫걸음/.test(typeof l === 'string' ? l : (l && (l.t || l.text)) || ''); });
    p.items.push({ id: 'sy_map', kind: 'keepsake', name: '도현의 지도', desc: '여섯 해 전 갯바위에서 건진 사내가 그려 준 세상. 물음표와 「가게 되면 내 대신 보고 와 줘」라는 글씨가 군데군데. 이제 소영의 글씨가 하나씩 늘어 간다.', tale: true, song: true });
    s.song = { act: 1, beats: {}, rep: [], venues: {}, concerts: 0, crowd: 0, marks: {}, flags: {}, started: U.dateNum(s.date), startDay: U.dayIndex(s.date) };
    G.Game.state = s;
    G.State.log('도현 아저씨의 지도 한 장을 들고 ' + D.name + U.jx(D.name, '이/가') + ' 한산도에서 바다에 길을 내러 나섰다.');
    return s;
  };

  /** 프롤로그 — 1474년의 아침 → 1480년 부두 → 한산 관아(첫 계약) */
  SS.prologue = async function (c) {
    var t = T(); if (!t || t.prologue) return;
    var P = D.prologue;
    await SS.cut('prologue');
    await play(P.flash);
    await play(P.harbor);
    await play(P.sato);
    t.pass = 1;
    SS.contract(D.first);
    SS.hint('sy_longmen');
    await play(P.after);
    t.prologue = 1; S().flags.prologue = true;
    G.Game.refreshHud();
  };
  /** 사또와의 계약 (교섭 없이 정해진 조건). 다른 계약이 걸려 있으면 단서만 */
  SS.contract = function (id) {
    var s = S(), sp = G.SPONSOR[D.sponsor], d = G.DISC[id], o = D.contract;
    if (!sp || !d) return;
    if (s.contract) { SS.hint(id); return; }
    var due = U.addDays(s.date, o.years * 365);
    s.contract = { sponsor: sp.id, disc: d.id, advance: o.advance, reward: o.reward, valueK: G.Disc.valueK ? G.Disc.valueK(d) : 1, due: U.dateNum(due), start: U.dateNum(s.date), circ: false, loan: null };
    if (G.Disc.addHint(d.id, 'contract:' + sp.id)) UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll', 3600); else SS.hint(id);
    s.player.gold += o.advance;
    var rel = G.Sponsor.rel(sp.id); rel.met = 1; rel.trust = Math.max(rel.trust || 0, 40);
    G.State.log('사또 임처사와 「' + d.name + '」 탐색 계약을 맺었다. (선금 ' + o.advance + '닢, 기한 ' + U.fmtDate(due) + ')');
    UI.toast('계약 성립! 선금 ' + U.num(o.advance) + '닢을 받았다.', 'seal', 4000);
  };
  /** 이야기가 직접 알려 주는 단서 (개척 단계를 건너뛴다) */
  SS.hint = function (id) {
    var s = S(), d = G.DISC[id]; if (!s || !d || G.Disc.foundByMe(id) || s.hints[id]) return false;
    s.hints[id] = { src: 'song', d: U.dateNum(s.date) };
    if (G.Explore) G.Explore.ver++;
    UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll', 3600);
    return true;
  };

  // ================================================================ 사건
  SS.beat = function (id) { return (D.beats || []).filter(function (b) { return b.id === id; })[0]; };
  function done(id) { var t = T(); return id === 'end' ? !!t.end : !!(t.beats && t.beats[id] != null); }
  function doneDay(id) { var t = T(); return id === 'end' ? (t.endDay || 0) : t.beats[id]; }
  SS.done = function (id) { return !!T() && done(id); };
  function voiceLost() { var t = T(), v = t && t.voice; return !!(v && !v.ok); }
  function voiceReady() { var t = T(), v = t && t.voice; return !!(v && !v.ok && today() >= v.back); }
  SS.voiceLost = voiceLost;
  function isMing(c) { return !!c && c.port && (R.cityOwner ? R.cityOwner(c) : c.nation) === '명'; }
  function whereOk(b, c) {
    var w = b.where; if (w == null) return true; if (!c) return false;
    if (Array.isArray(w)) return w.indexOf(c.id) >= 0;
    if (w === 'home') return c.id === S().player.home;
    if (w === 'ming') return isMing(c);
    if (w === 'europe') return [0, 1, 2].indexOf(c.region) >= 0;
    if (w === 'france') return [0, 1, 2].indexOf(c.region) >= 0 && (R.cityOwner ? R.cityOwner(c) : c.nation) === '프랑스';
    if (w === 'americas') return c.region === 10;
    return false;
  }
  function ready(b, at, ctx) {
    var s = S(), t = T(); ctx = ctx || {};
    if (!t || !t.prologue || done(b.id) || b.at !== at) return false;
    if (b.after && !b.after.every(done)) return false;
    if (b.gap && b.after && b.after.length) { var last = Math.max.apply(null, b.after.map(doneDay)); if (today() - last < b.gap) return false; }
    if (b.disc && ctx.disc !== b.disc) return false;
    if (b.reported) { var st = s.disc[b.reported]; if (!(st && st.me && (st.reported || st.announced))) return false; }
    if (at === 'city' || at === 'concert') { if (!whereOk(b, ctx.city)) return false; }
    if (b.box) { var l = s.loc, x = b.box; if (l.mode !== 'sea' || l.lon < x[0] || l.lon > x[1] || l.lat < x[2] || l.lat > x[3]) return false; }
    if (b.battles && !G.StoryBattle.won('song', b)) return false;
    if (b.voice === 'back' && !voiceReady()) return false;
    return true;
  }
  /** 사건 하나를 보여 주고 then 을 치른다 */
  async function run(b, ctx) {
    var t = T(), s = S();
    t.beats[b.id] = today();          // 먼저 적는다 — 도중에 오류가 나도 같은 사건이 되풀이되지 않게
    if (b.act) t.act = Math.max(t.act || 1, b.act);
    try {
      if (b.cut) await SS.cut(b.cut);
      else if (b.id === 'a7_lisbon') await SS.cut('lisbon');
      await play(b.lines);
    } catch (e) { console.error(e); }
    await SS.apply(b.then || {}, ctx || {});
    G.State.log('「' + D.title + '」 — ' + (BEAT_LOG[b.id] || '이야기가 한 걸음 나아갔다.'));
    if (G.Game.refreshHud) G.Game.refreshHud();
  }
  var BEAT_LOG = {
    a1_qufu: '곡부 공묘에서 탁본 세 장과 제사 노래를 얻었다.', a1_longmen: '용문의 절벽이 노래를 한 박자 늦게 따라 불렀다.',
    a1_report: '사또 임처사에게 곡부를 보고했다. 다음은 왜국 나라의 큰절.', a2_hangzhou: '항주에서 견우의 오해를 샀다가, 편지의 장단을 찾아냈다.',
    a2_sakai: '사카이에서 견우와 직녀의 노래를 이어 붙였다. 두 사람이 동료가 되었다.', a2_todaiji: '도다이지 기둥 구멍에 끼었다.',
    a2_report: '사또가 물마루호를 소영에게 넘겨주고 사직했다.', a3_stow: '선창에서 하회탈의 악사가 나왔다. 넷이 처음 함께 연주했다.',
    a4_wako: '왜구가 지도를 노리고 덤벼들었다.', a4_after: '바다에 빠진 왜구에게 밧줄을 던졌다. 노래가 이겼다.',
    a5_contract: '금봉호의 독점 계약을 거절했다.', a5_framed: '금봉호와 함께 누명을 벗었다.', a5_jina: '지나가 장부를 들고 배에 올랐다.',
    a7_lisbon: '리스본 부두에서 소매를 꿰매 준 항해사를 만났다. 이름은 마테우스.', r2_letter: '월담의 연애 강독 — 첫 편지는 찢길 뻔했다.',
    a8_france: '프랑스 궁정의 음모에서 빠져나왔다. 노래는 내가 고른다.', a8_malindi: '선창에 숨은 말린디가 동료가 되었다.',
    a9_mateus: '마테우스가 도현 아저씨의 아들이었다. 두 노래가 가운데서 이어졌다.', r4_same: '같은 사람을 다르게 기억하는 두 사람.',
    r6_mishap: '월담과 자코모의 합작 사고.', r7_confess: '좋아한다는 말은 자기 입으로 했다.', r8_comfort: '잘해 보려던 사람들의 서투른 위로.',
    a10_hook: '후크와 손을 잡았다.', a10_storm: '해적섬을 되찾았다. 소영의 목소리가 나오지 않는다. 후크가 배에 올랐다.',
    a10_care: '목소리가 없어도 선장 노릇은 했다.', a10_hum: '목소리가 돌아왔다. 첫 음은 틀렸다.', a11_letter: '도현 아저씨가 미래에서 온 사람이었다.',
    a11_farewell: '마테우스와 웃으며 헤어졌다.', a12_home: '한산도의 작은 마당에서 공연했다.', r12_song: '그 노래를 다시 불렀다.'
  };
  SS.apply = async function (th, ctx) {
    var s = S(), t = T(), c = ctx.city || curCity();
    if (th.act) t.act = Math.max(t.act || 1, th.act);
    if (th.contract) SS.contract(th.contract);
    (th.hints || []).forEach(function (id) { SS.hint(id); });
    if (th.join) th.join.forEach(function (id) {
      if (!G.MATE[id] || aboard(id)) return;
      var nm = G.Legend && G.Legend.join ? G.Legend.join(id, c) : null;
      if (!nm) { nm = { id: id, role: 'none', joined: U.dateNum(s.date), loyal: 85, ev: 1 }; s.mates.push(nm); UI.toast(G.MATE[id].name + ' 동료가 되었다.', 'people', 3600); }
      nm.loyal = Math.max(nm.loyal || 0, 88);
      delete s.flags['gone_' + id];
    });
    if (th.gw) s.gw = { stage: 0, end: 'crew', aboard: ['gyeonwoo', 'jiknyeo'], song: 1 };   // 보통의 「견우와 직녀」 사건이 다시 열리지 않게 (js/systems/gyeonwoo.js)
    if (th.jina) { var w = s.wangMerch || (s.wangMerch = {}); w.jina = s.day; w.deals = Math.max(w.deals || 0, 3); w.met = Math.max(w.met || 0, 1); }
    if (th.endSponsor) t.noSponsor = 1;
    if (th.voiceLose) { t.voice = { lost: today(), back: today() + (D.voiceDays || 75), ok: false }; UI.toast('소영의 목소리가 나오지 않는다 — 한동안 공연을 열 수 없다.', 'heart', 5200); }
    if (th.fame && G.Fame) for (var k in th.fame) G.Fame.add(k, th.fame[k]);
    if (th.crew) { var cap = U.sum(s.fleet.ships, function (x) { return x.crewMax; }); s.fleet.crew = Math.min(cap, s.fleet.crew + th.crew); UI.toast('선원 ' + th.crew + '명이 갑판원이 되었다.', 'people', 3200); }
    if (th.flag) t.flags[th.flag] = today();
    if (th.atl) atlHints();
    if (th.battle) await startBattle(th.battle);
    if (th.finale) await finale();
  };
  async function startBattle(o) {
    var s = S(), t = T();
    t.battleMark = s.stats.battles || 0;
    var npc = { id: 'song_' + (o.label || 'pirate'), kind: o.kind || 'pirate', n: o.n || 2, K: 1, zone: G.Ships && G.Ships.zone ? G.Ships.zone(s.loc.lon, s.loc.lat) : 'east', hostile: true, label: o.label, names: o.names };
    G.StoryBattle.start('song', o, npc);
    await UI.fade(function () { G.Game.go('battle', { npc: npc }); });
  }
  /** 도시에 들어설 때 (js/scenes/city.js) — 프롤로그 또는 일어날 사건 하나 */
  SS.arrive = async function (c, arg) {
    var t = T(); if (!t) return false;
    arg = arg || {};
    if (arg.song) { await SS.prologue(c); if (G.Game.cityHud) G.Game.cityHud(); return true; }
    if (arg.load || !t.prologue) return false;
    var b = (D.beats || []).filter(function (x) { return ready(x, 'city', { city: c }); })[0];
    if (!b) return false;
    await run(b, { city: c });
    if (b.id === 'a10_hum' && t.voice) { t.voice.ok = true; UI.toast('소영의 목소리가 돌아왔다 — 다시 공연을 열 수 있다.', 'heart', 4800); }
    if (inCity() && G.Game.cityHud) G.Game.cityHud();
    return true;
  };
  /** 바다의 하루 끝 (js/scenes/sea.js) */
  SS.seaPending = function () {
    G.StoryBattle.recover('song');
    var t = T(), s = S(); if (!t || !t.prologue || SS._busy || !s || s.loc.mode !== 'sea') return false;
    if (atlNear()) return true;
    return (D.beats || []).some(function (b) { return ready(b, 'sea'); });
  };
  SS.atSea = async function () {
    if (SS._busy) return false; SS._busy = true;
    try {
      if (atlNear()) { await SS.ending(); return true; }
      var b = (D.beats || []).filter(function (x) { return ready(x, 'sea'); })[0];
      if (b) await run(b, {});
    } catch (e) { console.error(e); } finally { SS._busy = false; }
    return true;
  };
  /** 찾았을 때: 지도 표시의 장면 · find 사건 · 아틀란티스 */
  SS.onFind = async function (d) {
    var t = T(); if (!t || !d) return;
    var mk = D.markScenes[d.id], note = (D.marks || []).filter(function (m) { return m[0] === d.id; })[0];
    if (mk && !t.marks[d.id]) {
      t.marks[d.id] = today();
      try { await play(mk); } catch (e) { console.error(e); }
      G.State.log('「' + d.name + '」 — 도현 아저씨의 지도를 고쳐 썼다.');
    } else if (note && !t.marks[d.id]) t.marks[d.id] = today();
    var bs = (D.beats || []).filter(function (b) { return ready(b, 'find', { disc: d.id }); });
    for (var i = 0; i < bs.length; i++) { await run(bs[i], { disc: d.id }); t.marks[d.id] = t.marks[d.id] || today(); }
    if (d.id === D.endDisc && !t.end) {
      if (done('a11_letter')) await SS.ending();
      else if (!t.early) { t.early = today(); await UI.say(D.ending.early, {}); }
    }
    if (done('a11_letter') && !t.end && G.Story && G.Story.ATL_PATH && G.Story.ATL_PATH.indexOf(d.id) >= 0) atlHints();
  };
  function atlHints() { if (G.Story && G.Story.atlNext) G.Story.atlNext().forEach(function (id) { SS.hint(id); }); }
  function atlNear() {
    var t = T(), s = S(), d = G.DISC[D.endDisc];
    if (!t || t.end || !done('a11_letter') || !d || !G.Disc.foundByMe(d.id) || s.loc.mode !== 'sea') return false;
    return G.Geo.dist(s.loc.lon, s.loc.lat, d.lon, d.lat) < (d.r || 1.6) * 0.5;
  }

  // ================================================================ 끝 — 아틀란티스 · 귀향
  SS.ending = async function () {
    var s = S(), t = T(); if (!t || t.end) return;
    t.end = 'done'; t.endDay = today();
    await SS.cut('atlantis');
    await play(D.ending.meet);
    var w = s.player.items.filter(function (it) { return it.id === 'sy_map'; })[0];
    if (w) w.desc = '도현 아저씨가 그려 준 세상 — 이제는 소영의 글씨가 훨씬 많다. 아직 비어 있는 한쪽이 남아 있다.';
    if (G.Fame) { G.Fame.add('ex', 900); G.Fame.add('so', 300); }
    G.State.log(D.ending.done + ' (탐험 명성 +900 · 사교 명성 +300)');
    var html = '<div style="font-size:19px;line-height:1.7">' + U.esc(D.ending.done) + '<br><span class="muted">걸린 날: ' + U.num(today() - (t.startDay || today())) + '일 · 공연 ' + (t.concerts || 0) + '번 · 배운 노래 ' + (t.rep || []).length + '곡</span>' +
      '<div class="sep"></div>「' + U.esc(D.song.last) + '」<div class="sep"></div>이제 공연에서 「' + U.esc(D.song.name) + '」를 끝까지 부를 수 있습니다. 고향 한산도가 기다립니다.</div>';
    await UI.window({ title: D.title + ' — 마지막 소절', icon: 'laurel', width: 700, html: html, buttons: [{ label: '항해를 이어 간다', value: 'ok', cls: 'navy' }] }).result;
    G.Game.refreshHud();
  };
  async function finale() {
    var t = T(); t.finale = today();
    var html = '<div style="font-size:19px;line-height:1.7"><b>「' + U.esc(D.title) + '」 — 끝</b><br>「내가 가 본 데부터 이야기해 줄게. 그다음은 네가 가서 알려 줘.」' +
      '<div class="sep"></div><span class="muted">공연 ' + (t.concerts || 0) + '번 · 관객 ' + U.num(t.crowd || 0) + '명 · 배운 노래 ' + (t.rep || []).length + '곡 · 고친 지도 ' + Object.keys(t.marks || {}).length + '곳</span>' +
      '<div class="sep"></div>이야기는 여기서 한 매듭을 짓습니다. 항해와 공연은 그대로 이어집니다.</div>';
    await UI.window({ title: D.title, icon: 'laurel', width: 680, html: html, buttons: [{ label: '항해를 이어 간다', value: 'ok', cls: 'navy' }] }).result;
  }

  // ================================================================ 바닷길 공연
  var PLAYERS = [['sy_woldam', '거문고'], ['sy_hwanggyu', '꽹과리·장구'], ['sy_imcheosa', '아쟁']];
  function band() {
    var t = T(), eu = !!(t && t.flags && t.flags.europeBand);
    return PLAYERS.filter(function (x) { return aboard(x[0]); }).map(function (x) {
      var inst = x[1];
      if (eu && x[0] === 'sy_hwanggyu') inst = '꽹과리·저음 현악기';
      if (eu && x[0] === 'sy_imcheosa') inst = '아쟁·기타';
      return { id: x[0], inst: inst };
    });
  }
  function regionKey(c) { return c.lang === 14 || c.style === 'kr' ? 'kr' : c.region; }
  SS.regionKey = regionKey;
  // 네 사람이 함께 있을 때만 네 명의 합주 원화를 쓴다.
  SS.concertArt = function (c) {
    var key = c && 'song/concerts/' + regionKey(c);
    return c && PLAYERS.every(function (x) { return aboard(x[0]); }) && G.Img && G.Img.has(key) ? key : null;
  };
  /** 공연을 열 수 있나 {ok, why} */
  SS.canConcert = function (c) {
    var t = T(), K = D.concert; if (!t || !t.prologue || !c) return { ok: false, why: '' };
    if (voiceLost()) return { ok: false, why: '소영의 목소리가 아직 돌아오지 않았다' };
    if (!band().length) return { ok: false, why: '반주할 동료가 배에 없다' };
    var now = today(), last = t.venues[c.id];
    if (last != null && now - last < K.cityGap) return { ok: false, why: '이 도시에서는 ' + (K.cityGap - (now - last)) + '일 뒤에 다시 열 수 있다', soon: true };
    if (t.lastConcert != null && now - t.lastConcert < K.rest) return { ok: false, why: '목을 쉬어야 한다 — ' + (K.rest - (now - t.lastConcert)) + '일 뒤', soon: true };
    return { ok: true };
  };
  function songChoices(c) {
    var t = T(), rk = regionKey(c), out = [];
    var R0 = D.concert.regions;
    out.push({ id: 'kr', label: '「' + R0.kr.song + '」 — 고향 노래', k: rk === 'kr' ? 1.35 : 1.0 });
    if (rk !== 'kr' && t.rep.indexOf(rk) >= 0 && R0[rk]) out.push({ id: String(rk), label: '「' + R0[rk].song + '」 — 이 고장 노래 (배운 노래)', k: 1.35 });
    else if (rk !== 'kr' && R0[rk]) out.push({ id: 'learn', label: '이 고장 노래를 배우며 부른다 (처음)', k: 1.15 });
    out.push(t.end ? { id: 'full', label: '「' + D.song.name + '」 — 마지막 소절까지', k: 1.5 } : { id: 'half', label: '「' + D.song.unfinished + '」 — 도현 아저씨와 만든', k: 1.12 });
    return out;
  }
  /** 「이 도시에서 할 일」 판의 줄 (js/scenes/city.js) */
  SS.todo = function (c) {
    var t = T(); if (!t || !t.prologue || !c) return [];
    var out = [], cc = SS.canConcert(c);
    if (cc.ok) out.push({ icon: 'star', hot: true, text: '바닷길 공연 — 오늘 밤 <b>' + U.esc(c.name) + '</b> 한가운데를 공연장으로', onClick: function () { return SS.concert(c); } });
    else if (cc.why && !cc.soon) out.push({ icon: 'heart', hot: false, text: '바닷길 공연 — ' + U.esc(cc.why), onClick: function () { G.Info.open('song'); } });
    var g = SS.guide();
    if (g) out.push({ icon: 'scroll', text: g + ' <span class="muted">(수첩 「소영의 지도」)</span>', onClick: function () { G.Info.open('song'); } });
    return out;
  };
  /** 지금 할 일 한 줄 (html) */
  SS.guide = function () {
    var t = T(); if (!t || !t.prologue) return '';
    if (t.finale) return '';
    if (done('a11_letter') && !t.end) return atlGuide();
    var b = (D.beats || []).filter(function (x) { return x.guide && !done(x.id) && (!x.after || x.after.every(done)); })[0];
    if (b) return U.esc(b.guide);
    var next = (D.marks || []).filter(function (m) { return !G.Disc.foundByMe(m[0]); })[0];
    return next ? '도현 아저씨의 지도 — <b>' + U.esc(G.DISC[next[0]] ? G.DISC[next[0]].name : next[0]) + '</b>: ' + U.esc(next[3]) : '';
  };
  var ATL_WHERE = { knossos: '크레타 섬 안쪽 (뭍 탐험)', akrotiri: '테라 섬 남쪽 기슭 (뭍 탐험)', timaeus: '아테네 (뭍 탐험)', gibraltar: '지브롤터 해협 (바다)', gadir: '카디스 앞 작은 섬 (뭍 탐험)', azoresridge: '아소르스 제도 둘레 바다', atlantis: '아소르스 남서쪽 바다' };
  function atlGuide() {
    if (G.Disc.foundByMe(D.endDisc)) return '아틀란티스 — <b>아소르스 남서쪽 바다</b>의 그 자리로 다시 가면 도현 아저씨를 만날 수 있다';
    var nx = G.Story && G.Story.atlNext ? G.Story.atlNext() : [];
    if (!nx.length) return '편지의 실마리를 따라 아틀란티스로 (수첩 「단서」)';
    return '아틀란티스로 가는 다음 고리 — ' + nx.map(function (id) { return '<b>' + U.esc(G.DISC[id].name) + '</b>: ' + U.esc(ATL_WHERE[id] || ''); }).join(' · ');
  }

  // ---------------------------------------------------------------- 공연 음악 (Web Audio — 파일 없이 코드로)
  var SCALES = { kr: [0, 3, 5, 7, 10], 6: [0, 2, 4, 7, 9], 9: [0, 1, 5, 7, 8], 4: [0, 1, 4, 5, 7, 8, 10], 5: [0, 1, 4, 5, 7, 8, 11], 0: [0, 2, 4, 5, 7, 9, 11],
    1: [0, 2, 3, 5, 7, 9, 10], 2: [0, 2, 4, 5, 7, 9, 10], 3: [0, 2, 4, 7, 9], 7: [0, 2, 3, 7, 9], 8: [0, 2, 4, 7, 9], 10: [0, 3, 5, 7, 10] };
  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  /** 공연 음악을 흘린다 → 멈추는 함수. o = {region, seed, sec, voice, players:[id…], eu} */
  SS.music = function (o) {
    var AC = window.AudioContext || window.webkitAudioContext, noop = function () {};
    var st = S() && S().settings, vol = st && st.music != null ? st.music : (G.Audio && G.Audio.pref ? G.Audio.pref.music : 0.35);
    if (!AC || !(vol > 0.01)) return noop;
    var ctx; try { ctx = new AC(); } catch (e) { return noop; }
    try { if (ctx.state === 'suspended' && ctx.resume) ctx.resume(); } catch (e) { /* */ }
    var out = ctx.createGain(); out.gain.value = Math.min(1, vol * 1.4) * 0.55; out.connect(ctx.destination);
    var noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), nd = noise.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    var scale = SCALES[o.region] || SCALES.kr, r = rng(o.seed || 1), t0 = ctx.currentTime + 0.15;
    var east = o.region === 'kr' || o.region === 6 || o.region === 9;
    var tempo = east ? 76 : o.region === 3 || o.region === 10 ? 112 : 96, beat = 60 / tempo, sw = east ? 1.5 : 1;   // 동쪽은 굿거리처럼 셋잇단 느낌
    function f(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function deg(n) { var len = scale.length, oc = Math.floor(n / len); return scale[((n % len) + len) % len] + 12 * oc; }
    function env(g, t, a, peak, dur, rel) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + Math.max(a, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    function voice(t, m, d) {
      var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lf = ctx.createOscillator(), lg = ctx.createGain(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      o1.type = 'triangle'; o2.type = 'sine'; o1.frequency.value = f(m); o2.frequency.value = f(m) * 2;
      lf.frequency.value = 5.4; lg.gain.value = f(m) * 0.012; lf.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.6;
      var g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(bp); o1.connect(bp); bp.connect(g); g.connect(out);
      env(g, t, 0.07, 0.36, d, Math.min(0.25, d * 0.4));
      [o1, o2, lf].forEach(function (x) { x.start(t); x.stop(t + d + 0.05); });
    }
    function pluck(t, m, dec, type, cut, peak) {
      var o1 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o1.type = type || 'sawtooth'; o1.frequency.value = f(m); lp.type = 'lowpass'; lp.frequency.setValueAtTime(cut || 1400, t); lp.frequency.exponentialRampToValueAtTime(220, t + dec);
      o1.connect(lp); lp.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak || 0.3, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      o1.start(t); o1.stop(t + dec + 0.05);
    }
    function bow(t, m, d) {
      var o1 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.value = f(m); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 2;
      o1.connect(lp); lp.connect(g); g.connect(out); env(g, t, 0.18, 0.13, d, 0.3);
      o1.start(t); o1.stop(t + d + 0.05);
    }
    function hit(t, hi) {
      var src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noise; fl.type = hi ? 'bandpass' : 'lowpass'; fl.frequency.value = hi ? 3600 : 180; fl.Q.value = hi ? 4 : 0.8;
      src.connect(fl); fl.connect(g); g.connect(out);
      g.gain.setValueAtTime(hi ? 0.32 : 0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (hi ? 0.14 : 0.3));
      src.start(t); src.stop(t + 0.35);
      if (!hi) { var k = ctx.createOscillator(), kg = ctx.createGain(); k.frequency.setValueAtTime(120, t); k.frequency.exponentialRampToValueAtTime(48, t + 0.22); k.connect(kg); kg.connect(out); kg.gain.setValueAtTime(0.5, t); kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); k.start(t); k.stop(t + 0.3); }
    }
    var root = 62 + (east ? 0 : 2), bars = Math.max(4, Math.round((o.sec || 10) / (beat * 4))), pos = 0, has = function (id) { return (o.players || []).indexOf(id) >= 0; };
    var phrase = []; for (var n = 0, x = 4; n < 8; n++) { x += Math.round((r() - 0.5) * 3); x = Math.max(1, Math.min(9, x)); phrase.push({ d: x, len: r() < 0.3 ? 2 : 1 }); }
    for (var b = 0; b < bars; b++) {
      var bt = t0 + b * beat * 4;
      // 장단 (규) — 강박에 북, 사이에 꽹과리
      if (has('sy_hwanggyu')) for (var q = 0; q < 4; q++) { hit(bt + q * beat, false); if (q % 2 || b % 2) hit(bt + q * beat + beat * 0.5 * sw / 1.5, true); }
      // 거문고 (월담) — 마디 첫 박과 셋째 박에 낮은 술대
      if (has('sy_woldam')) { pluck(bt, root - 24 + deg(b % 2 ? 2 : 0), 1.3, 'sawtooth', 900, 0.28); pluck(bt + beat * 2, root - 12 + deg(b % 4 === 3 ? 4 : 2), 0.9, 'sawtooth', 1100, 0.18); }
      // 아쟁 (처사) — 마디를 길게 긋는다 (유럽을 지난 뒤면 기타처럼 퉁긴다)
      if (has('sy_imcheosa')) { if (o.eu && b % 2) { for (var gq = 0; gq < 4; gq++) pluck(bt + gq * beat, root - 12 + deg(gq % 2 ? 4 : 2), 0.5, 'triangle', 2200, 0.12); } else bow(bt, root - 12 + deg(b % 4 < 2 ? 0 : 4), beat * 3.9); }
      // 노래 (소영)
      if (o.voice) for (var k = 0; k < 4; k++) {
        var nt = phrase[(pos++) % phrase.length], vary = b >= bars / 2 && k === 3 ? 2 : 0;
        if (b === bars - 1 && k === 3) { voice(bt + k * beat, root + deg(0), beat * 2.2); break; }
        voice(bt + k * beat, root + deg(nt.d + vary), beat * (nt.len > 1 ? 1.6 : 0.92));
      }
    }
    var stopped = false;
    return function () {
      if (stopped) return; stopped = true;
      try { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(out.gain.value, ctx.currentTime); out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); } catch (e) { /* */ }
      setTimeout(function () { try { ctx.close(); } catch (e) { /* */ } }, 700);
    };
  };

  // ---------------------------------------------------------------- 공연장 화면
  var CSS = '.song-stage{position:relative;width:100%;height:560px;overflow:hidden;border-radius:6px;background:#0d0b14;font-family:inherit}' +
    '.song-stage .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.42) saturate(.85)}' +
    '.song-stage .night{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,8,30,.55),rgba(10,8,30,.1) 40%,rgba(0,0,0,.65))}' +
    '.song-stage .beam{position:absolute;top:-40px;width:240px;height:620px;background:linear-gradient(180deg,rgba(255,236,170,.32),rgba(255,236,170,0));clip-path:polygon(45% 0,55% 0,100% 100%,0 100%);mix-blend-mode:screen;transform-origin:50% 0;animation:songBeam 4.6s ease-in-out infinite alternate}' +
    '.song-stage .beam.b2{animation-duration:5.4s;animation-direction:alternate-reverse}' +
    '@keyframes songBeam{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}' +
    '.song-stage .lanterns{position:absolute;left:0;right:0;top:4px;height:50px}' +
    '.song-stage .lanterns i{position:absolute;width:16px;height:22px;border-radius:45%;background:radial-gradient(circle at 50% 40%,#ffe3a0,#e0602c 70%);box-shadow:0 0 18px 6px rgba(255,160,70,.45);animation:songSway 2.8s ease-in-out infinite alternate}' +
    '@keyframes songSway{from{transform:translateY(0) rotate(-4deg)}to{transform:translateY(3px) rotate(4deg)}}' +
    '.song-stage .banner{position:absolute;left:50%;top:46px;transform:translateX(-50%);padding:6px 22px;border:2px solid #c9a35a;background:rgba(40,20,10,.75);color:#f6e2b0;font-size:22px;letter-spacing:2px;white-space:nowrap;border-radius:4px}' +
    '.song-stage .floor{position:absolute;left:6%;right:6%;bottom:118px;height:26px;background:linear-gradient(180deg,#6b4526,#3a2412);border-radius:4px;box-shadow:0 6px 18px rgba(0,0,0,.6)}' +
    '.song-stage .cast{position:absolute;left:0;right:0;bottom:136px;display:flex;justify-content:center;align-items:flex-end;gap:6px}' +
    '.song-stage .who{position:relative;display:flex;flex-direction:column;align-items:center;animation:songBob 1.6s ease-in-out infinite alternate}' +
    '.song-stage .who:nth-child(2n){animation-delay:.4s}.song-stage .who canvas{display:block;filter:drop-shadow(0 0 14px rgba(255,220,150,.35))}' +
    '.song-stage .who.lead canvas{filter:drop-shadow(0 0 22px rgba(255,236,190,.7))}' +
    '.song-stage .who span{margin-top:-4px;padding:1px 9px;background:rgba(20,12,6,.8);color:#f1dfb4;font-size:13px;border-radius:9px;white-space:nowrap}' +
    '@keyframes songBob{from{transform:translateY(0)}to{transform:translateY(-5px)}}' +
    '.song-stage canvas.crowd{position:absolute;left:0;bottom:0;width:100%;height:150px}' +
    '.song-stage .note{position:absolute;color:#ffe7a8;font-size:26px;text-shadow:0 0 8px #f90;pointer-events:none;animation:songNote 3.2s linear forwards}' +
    '@keyframes songNote{from{opacity:0;transform:translateY(0)}15%{opacity:1}to{opacity:0;transform:translateY(-260px) rotate(20deg)}}' +
    '.song-stage .cheer{position:absolute;padding:4px 12px;background:rgba(250,240,215,.94);color:#3a2610;border-radius:14px;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.4);animation:songCheer 2.8s ease-out forwards;white-space:nowrap}' +
    '@keyframes songCheer{from{opacity:0;transform:translateY(12px) scale(.9)}15%{opacity:1;transform:none}80%{opacity:1}to{opacity:0;transform:translateY(-16px)}}' +
    '.song-stage .lyric{position:absolute;left:50%;top:98px;transform:translateX(-50%);max-width:92%;overflow:hidden;text-overflow:ellipsis;color:#fff6dc;font-size:18px;text-shadow:0 2px 6px #000;white-space:nowrap;opacity:.95}' +
    '.song-stage .heat{position:absolute;right:18px;top:20px;width:190px;color:#f3dfb2;font-size:14px}' +
    '.song-stage .heat b{display:block;height:10px;margin-top:4px;background:rgba(255,255,255,.18);border-radius:5px;overflow:hidden}' +
    '.song-stage .heat b i{display:block;height:100%;width:0;background:linear-gradient(90deg,#f6c453,#e8572e);transition:width .4s}' +
    '.song-stage .result{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);min-width:460px;padding:18px 26px;background:rgba(244,232,204,.97);color:#2b1d0d;border:2px solid #9b7a3c;border-radius:8px;font-size:17px;line-height:1.65;box-shadow:0 8px 28px rgba(0,0,0,.6);animation:songPop .5s ease-out both}' +
    '@keyframes songPop{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}' +
    '.song-stage .result h4{margin:0 0 6px;font-size:21px}' +
    '.song-stage.illustrated .bg{filter:none}' +
    '.song-stage.illustrated .night{background:linear-gradient(180deg,rgba(0,0,0,.36),transparent 22%,transparent 80%,rgba(0,0,0,.5))}' +
    '.song-stage.illustrated .beam,.song-stage.illustrated .lanterns,.song-stage.illustrated .floor,.song-stage.illustrated .cast,.song-stage.illustrated .crowd{display:none}' +
    '.song-stage.illustrated .banner{top:8px;font-size:18px}' +
    '.song-stage.illustrated .lyric{top:auto;bottom:12px}';
  var cssOn = false;
  function css() { if (cssOn) return; cssOn = true; var el = document.createElement('style'); el.id = 'song-css'; el.textContent = CSS; document.head.appendChild(el); }
  function drawCrowd(cv, t, heat, rr) {
    var ctx = cv.getContext('2d'), w = cv.width, h = cv.height; ctx.clearRect(0, 0, w, h);
    for (var row = 0; row < 3; row++) {
      var n = 26 + row * 6, y0 = h - 6 - (2 - row) * 0, base = h - row * 26;
      for (var i = 0; i < n; i++) {
        var x = (i + 0.5 + (row % 2) * 0.5) / n * w, ph = rr[(row * 40 + i) % rr.length] * 6.28;
        var bob = Math.sin(t * (2.2 + heat * 3) + ph) * (2 + heat * 7);
        var col = 'rgb(' + (34 - row * 9) + ',' + (28 - row * 7) + ',' + (44 - row * 10) + ')';
        var hy = base - 54 + bob + row * 8;
        ctx.fillStyle = 'rgba(255,196,120,' + (0.18 + heat * 0.3) * (1 - row * 0.3) + ')';   // 무대 불빛을 받은 머리 윤곽
        ctx.beginPath(); ctx.arc(x, hy - 1.5, 12 - row, 0, 7); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, hy, 11 - row, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, hy + 34, 17 - row, 26, 0, 0, 7); ctx.fill();
        if (heat > 0.35 && rr[(i * 7 + row) % rr.length] < heat * 0.6) {   // 손을 든다
          var arm = Math.sin(t * 4 + ph) * 0.4;
          ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x + 8, hy + 18); ctx.lineTo(x + 14 + arm * 10, hy - 14 - heat * 8); ctx.stroke();
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 14 + arm * 10, hy - 16 - heat * 8, 4, 0, 7); ctx.fill();
        }
      }
      void y0;
    }
  }
  /** 공연 — 곡을 고르고, 무대를 보고, 결과를 받는다 */
  SS.concert = async function (c) {
    c = c || curCity(); var t = T(), s = S(), K = D.concert;
    var chk = SS.canConcert(c); if (!chk.ok) { UI.toast('바닷길 공연 — ' + chk.why, 'heart', 3600); return false; }
    var choices = songChoices(c);
    var v = await UI.ask('오늘 밤 ' + c.name + '에서 무슨 노래를 부를까?', choices.map(function (o) { return { label: o.label, value: o.id }; }).concat([{ label: '오늘은 쉰다', value: null }]), me());
    if (v == null) return false;
    var pick = choices.filter(function (o) { return o.id === v; })[0];
    var rk = regionKey(c), rinfo = K.regions[rk] || K.regions.kr, players = band();
    // 관객·사례
    var musicSum = U.sum(players, function (x) { return (G.MATE[x.id].sk || {}).music || 0; }) + 3;
    var fameK = 1 + Math.min(0.8, (s.player.fame || 0) / 4000);
    var repeatK = t.venues[c.id] != null ? 0.85 : 1;
    var crowd = Math.round((K.base + K.perSize * (c.size || 1)) * (0.55 + 0.15 * players.length + 0.03 * musicSum) * fameK * pick.k * repeatK * U.rf(0.9, 1.12));
    var gold = Math.round(crowd * K.ticket), so = Math.max(K.soFame[0], Math.min(K.soFame[1], Math.round(crowd / 110)));
    var learn = v === 'learn' && t.rep.indexOf(rk) < 0;
    // 무대
    css();
    var lyric = v === 'full' ? D.song.last : v === 'half' ? D.song.first : v === 'kr' ? '♪ 어기야 디야 — 한산도 물마루를 넘어간다 ♪' : '♪ (' + c.name + '의 말로 부르는 「' + rinfo.song + '」) ♪';
    var html = '<div class="song-stage"><div class="night"></div><div class="beam" style="left:18%"></div><div class="beam b2" style="left:58%"></div>' +
      '<div class="lanterns"></div><div class="banner">' + U.esc(c.name) + ' — 바닷길 공연</div>' +
      '<div class="heat">열기<b><i></i></b></div><div class="floor"></div><div class="cast"></div><div class="lyric"></div><canvas class="crowd" width="1100" height="150"></canvas></div>';
    var finished = false, finishFn = null;
    var win = UI.window({ title: '바닷길 공연 — ' + c.name, icon: 'star', width: 1150, parch: false, html: html, clickAny: false,
      buttons: [{ label: '막을 내린다', value: 'ok', cls: 'navy', onClick: function () { if (!finished) { if (finishFn) finishFn(); return false; } } }] });
    var stage = win.content.querySelector('.song-stage');
    try {
      var artKey = SS.concertArt(c);
      if (artKey) { stage.classList.add('illustrated'); stage.dataset.art = artKey; }
      var bg = G.Img.make(artKey ? [artKey] : G.Img.chain.city(c, 'night'), 1100, 560, function () { var x = document.createElement('canvas'); x.width = 1100; x.height = 560; var g = x.getContext('2d'); var gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, '#1b1640'); gr.addColorStop(1, '#3a2a2a'); g.fillStyle = gr; g.fillRect(0, 0, 1100, 560); return x; }, { fit: artKey ? 'contain' : 'cover' });
      bg.className = 'bg'; stage.insertBefore(bg, stage.firstChild);
      var ln = stage.querySelector('.lanterns'); for (var li = 0; li < 14; li++) { var lt = document.createElement('i'); lt.style.left = (3 + li * 7) + '%'; lt.style.top = (Math.sin(li / 13 * Math.PI) * 26) + 'px'; lt.style.animationDelay = (li * 0.21) + 's'; ln.appendChild(lt); }
      var cast = stage.querySelector('.cast');
      function add(chain, label, lead, w, h) {
        var box = document.createElement('div'); box.className = 'who' + (lead ? ' lead' : '');
        var cv = G.Img.make(chain, w, h, function () { var x = document.createElement('canvas'); x.width = w; x.height = h; return x; }, { fit: 'contain' });
        box.appendChild(cv); var sp = document.createElement('span'); sp.textContent = label; box.appendChild(sp); return box;
      }
      var line = players.map(function (x) { return add(G.Img.chain.mateHalf(x.id), G.MATE[x.id].name + ' · ' + x.inst, false, 150, 225); });
      var lead = add(G.Img.chain.heroHalf(), s.player.given + ' · 소리', true, 186, 279);
      var order = line.slice(0, 1).concat([lead]).concat(line.slice(1));
      order.forEach(function (x) { cast.appendChild(x); });
      stage.querySelector('.lyric').textContent = lyric;
    } catch (e) { console.error(e); }
    // 음악
    var AU = G.Audio, prev = AU && AU.want;
    try { if (AU && AU.stop) AU.stop(); } catch (e) { /* */ }
    var sec = (G.FX && G.FX.song && G.FX.song.sec) || 11;
    var stopMusic = SS.music({ region: rk, seed: hash(c.id + ':' + v + ':' + (t.concerts || 0)), sec: sec, voice: true, players: players.map(function (x) { return x.id; }), eu: !!t.flags.europeBand });
    // 열기·관객
    var cv = stage.querySelector('canvas.crowd'), heatBar = stage.querySelector('.heat i'), t0 = Date.now(), rr = []; for (var q = 0; q < 97; q++) rr.push(Math.random());
    var heat = 0, timer = null, cheerAt = 0, cheers = rinfo.cheer.slice();
    function frame() {
      if (finished) return;
      var el = (Date.now() - t0) / 1000, p = Math.min(1, el / sec);
      heat = Math.min(1, p * 1.15); if (heatBar) heatBar.style.width = Math.round(heat * 100) + '%';
      try { drawCrowd(cv, el, heat, rr); } catch (e) { /* */ }
      if (el - cheerAt > 2.4 && cheers.length) {
        cheerAt = el; var ch = document.createElement('div'); ch.className = 'cheer'; ch.textContent = cheers.shift();
        ch.style.left = (8 + Math.random() * 62) + '%'; ch.style.bottom = (150 + Math.random() * 30) + 'px'; stage.appendChild(ch);
        setTimeout(function () { if (ch.parentNode) ch.parentNode.removeChild(ch); }, 3000);
      }
      if (Math.random() < 0.18) { var nt = document.createElement('div'); nt.className = 'note'; nt.textContent = Math.random() < 0.5 ? '♪' : '♫'; nt.style.left = (38 + Math.random() * 24) + '%'; nt.style.bottom = (300 + Math.random() * 60) + 'px'; stage.appendChild(nt); setTimeout(function () { if (nt.parentNode) nt.parentNode.removeChild(nt); }, 3300); }
      if (p >= 1) { finish(); return; }
    }
    timer = setInterval(frame, 120);
    function finish() {
      if (finished) return; finished = true; clearInterval(timer);
      if (heatBar) heatBar.style.width = '100%';
      try { drawCrowd(cv, 0, 1, rr); } catch (e) { /* */ }
      stopMusic();
      var res = document.createElement('div'); res.className = 'result';
      // 숫자와 단위를 함께 옮긴다. 따로 옮기면 인원 단위 「명」을 왕조 이름으로 읽을 수 있다.
      res.innerHTML = G.T('<h4>{city|이/가} 공연장이 되었다</h4>관객 <b>{crowd}</b>명 · 사례 금화 <b>{gold}</b>닢 · 사교 명성 <b>+{fame}</b><br>선원 피로 −{fatigue} · 규율 +{discipline}', {
        city: U.esc(c.name), crowd: U.num(crowd), gold: U.num(gold), fame: so, fatigue: K.fatigue, discipline: K.discipline
      }) +
        (learn ? '<br><b>새 노래를 배웠다 — 「' + U.esc(rinfo.song) + '」</b>' : '');
      stage.appendChild(res);
      var b = win.el.querySelector('.foot button'); if (b) b.textContent = '무대를 정리한다';
    }
    finishFn = finish;
    if (!(G.FX && G.FX.song && G.FX.song.noWait)) await new Promise(function (r) { var iv = setInterval(function () { if (finished) { clearInterval(iv); r(); } }, 100); win.result.then(function () { clearInterval(iv); r(); }); });
    else finish();
    await win.result;
    if (!finished) finish();
    try { if (AU && prev && AU.music) AU.music(prev, true); } catch (e) { /* */ }
    // 결과를 치른다
    s.player.gold += gold;
    if (G.Fame) G.Fame.add('so', so);
    s.fleet.fatigue = Math.max(0, (s.fleet.fatigue || 0) - K.fatigue);
    s.fleet.discipline = Math.min(100, (s.fleet.discipline || 0) + K.discipline);
    var now = today(); t.venues[c.id] = now; t.lastConcert = now; t.concerts = (t.concerts || 0) + 1; t.crowd = (t.crowd || 0) + crowd;
    if (learn) { t.rep.push(rk); UI.toast('새 노래를 배웠다 — 「' + rinfo.song + '」', 'scroll', 4200); }
    G.State.log(c.name + '에서 바닷길 공연을 열었다 — 관객 ' + U.num(crowd) + '명, 사례 ' + U.num(gold) + '닢.');
    if (inCity() && G.Game.cityHud) { try { G.Game.cityHud(); } catch (e) { console.error(e); } }   // 「이 도시에서 할 일」을 다시 그린다
    if (G.Audio && G.Audio.sfx) G.Audio.sfx('coin');
    G.Game.refreshHud();
    // 동료 한 마디 · 공연 뒤 사건
    var cand = D.concert.after.filter(function (x) { return aboard(x[0]); });
    if (cand.length) { var pickL = cand[Math.floor(Math.random() * cand.length)]; await UI.say(pickL[1], mateWho(pickL[0])); }
    var bt = (D.beats || []).filter(function (x) { return ready(x, 'concert', { city: c }); })[0];
    if (bt) await run(bt, { city: c });
    return { crowd: crowd, gold: gold, so: so, learn: learn };
  };

  // ================================================================ 수첩 「소영의 지도」
  function landCanvas(w, h) {
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d'), N = 72, Sx = -56, step = 3;
    ctx.fillStyle = '#efe2c2'; ctx.fillRect(0, 0, w, h);
    if (G.Geo && G.Geo.isLand) for (var y = 0; y < h; y += step) for (var x = 0; x < w; x += step) {
      var lon = -180 + (x + step / 2) / w * 360, lat = N - (y + step / 2) / h * (N - Sx);
      if (G.Geo.isLand(lon, lat)) { ctx.fillStyle = ((x * 7 + y * 13) % 5) ? '#c9ae7d' : '#bea172'; ctx.fillRect(x, y, step, step); }
    }
    var age = ctx.createRadialGradient(w / 2, h / 2, h / 4, w / 2, h / 2, w / 1.7);
    age.addColorStop(0, 'rgba(90,55,20,0)'); age.addColorStop(1, 'rgba(90,55,20,.32)'); ctx.fillStyle = age; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#765932'; ctx.lineWidth = 2; ctx.strokeRect(4, 4, w - 8, h - 8);
    return { cv: cv, px: function (lon, lat) { return [(lon + 180) / 360 * w, (N - lat) / (N - Sx) * h]; } };
  }
  SS.mapCanvas = function (w, h) {
    var m = landCanvas(w, h), ctx = m.cv.getContext('2d'), s = S(), t = T();
    var font = '"Nanum Myeongjo", "Noto Serif KR", serif';
    function label(tx, x, y, col, size) { ctx.font = '700 ' + (size || 12) + 'px ' + font; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(245,236,214,.92)'; ctx.strokeText(tx, x, y); ctx.fillStyle = col; ctx.fillText(tx, x, y); }
    var home = G.CITY_DATA[D.home], hp = m.px(home.lon, home.lat);
    // 지나온 표시를 점선으로 잇는다
    var pts = (D.marks || []).map(function (mk) { var d = G.DISC[mk[0]]; if (!d) return null; var pos = d.lon != null ? d : G.CITY_DATA[d.city]; return { id: mk[0], d: d, p: m.px(pos.lon, pos.lat), found: G.Disc.foundByMe(mk[0]) }; }).filter(Boolean);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(120,40,30,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hp[0], hp[1]);
    pts.filter(function (x) { return x.found; }).forEach(function (x) { ctx.lineTo(x.p[0], x.p[1]); }); ctx.stroke(); ctx.setLineDash([]);
    pts.forEach(function (x) {
      ctx.beginPath(); ctx.arc(x.p[0], x.p[1], 5, 0, 7); ctx.fillStyle = x.found ? '#8a1c10' : 'rgba(60,45,30,.4)'; ctx.fill();
      label(x.found ? x.d.name.split(' ')[0] : '?', x.p[0], x.p[1] - 9, x.found ? '#5a160c' : '#5b4630', x.found ? 11 : 15);
    });
    ctx.beginPath(); ctx.arc(hp[0], hp[1], 6, 0, 7); ctx.fillStyle = '#1e3552'; ctx.fill(); label('한산도', hp[0] + 2, hp[1] + 18, '#1e3552', 12);
    if (t && t.flags && t.flags.metMateus != null) { var lp = m.px(G.CITY_DATA[0].lon, G.CITY_DATA[0].lat); ctx.fillStyle = '#b0306a'; ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.fillText('♥', lp[0], lp[1] + 5); label('다시 올 곳', lp[0], lp[1] + 20, '#8a2050', 11); }
    if (t && t.end) { var ad = G.DISC[D.endDisc], ap = m.px(ad.lon, ad.lat); label('♪ 마지막 소절', ap[0], ap[1], '#1f5a34', 12); }
    return m.cv;
  };
  SS.page = function (el) {
    var s = S(), t = T(); if (!t) { el.innerHTML = '<div class="muted">이야기 모드가 아니다.</div>'; return; }
    var rows = (D.marks || []).map(function (mk) {
      var d = G.DISC[mk[0]], found = G.Disc.foundByMe(mk[0]), hinted = !!s.hints[mk[0]];
      var st = found ? '<span class="tag good-text">고쳐 씀</span>' : hinted ? '<span class="tag warn-text">단서 있음</span>' : '<span class="tag">?</span>';
      return '<tr><td><b>' + U.esc(d ? d.name : mk[0]) + '</b><div class="muted" style="font-size:13px">' + U.esc(mk[3]) + '</div></td>' +
        '<td style="font-size:14px">' + U.esc(mk[1]) + (found ? '<div style="color:#8a1c10;margin-top:3px">✎ ' + U.esc(mk[2]) + '</div>' : '') + '</td><td>' + st + '</td></tr>';
    }).join('');
    var mates = ['sy_hwanggyu', 'sy_woldam', 'sy_imcheosa', 'gyeonwoo', 'jiknyeo', 'jina', 'sy_malindi', 'sy_hook'].map(function (id) {
      var m = G.MATE[id]; return m ? '<span class="tag' + (aboard(id) ? ' good-text' : '') + '" style="margin:2px">' + U.esc(m.name) + (aboard(id) ? '' : ' …') + '</span>' : '';
    }).join('');
    var rep = ['<b>「' + U.esc(D.concert.regions.kr.song) + '」</b>'].concat(repNames()).concat(['<b>「' + U.esc(t.end ? D.song.name : D.song.unfinished) + '」</b>']).join(' · ');
    var voice = voiceLost() ? '<div class="bad-text" style="margin-top:6px">목소리가 아직 돌아오지 않았다' + (voiceReady() ? ' — 항구에 들르면 무언가 달라질지도' : '') + '</div>' : '';
    var g = SS.guide();
    el.innerHTML = '<div class="grid2" style="grid-template-columns:560px 1fr;gap:22px"><div>' +
      '<div class="song-map" title="도현의 지도 — 소영이 고쳐 쓰는 중"></div>' +
      '<div class="muted" style="font-size:14px;line-height:1.6;margin-top:8px">「가게 되면 내 대신 보고 와 줘.」 — 물음표는 아직 가 보지 못한 곳, 붉은 점은 소영이 직접 보고 고쳐 쓴 곳.</div>' +
      '<div class="sep"></div><h4 style="margin:0 0 6px">바닷길 공연</h4><div style="font-size:15px;line-height:1.7">' + G.T('공연 <b>{shows}</b>번 · 관객 <b>{crowd}</b>명 · 공연장이 된 도시 <b>{cities}</b>곳<br>부를 수 있는 노래 — ', {
        shows: t.concerts || 0, crowd: U.num(t.crowd || 0), cities: Object.keys(t.venues || {}).length
      }) + rep + voice + '</div>' +
      '<div class="sep"></div><h4 style="margin:0 0 6px">함께 가는 사람</h4><div>' + mates + '</div>' +
      (aboard('sy_hook') && G.Img && G.Img.has('song/cuts/hook_piano') ? '<button class="btn" data-song-piano style="margin-top:10px">후크의 밤 연주 — 특별 원화</button>' : '') +
      '</div><div>' +
      (g ? '<div style="margin-bottom:10px"><b>지금 할 일</b> — ' + g + '</div>' : (t.end ? '<div style="margin-bottom:10px"><b>' + U.esc(D.song.name) + '</b> — 「' + U.esc(D.song.last) + '」</div>' : '')) +
      '<h4 style="margin:0 0 8px">도현 아저씨의 지도 <small class="muted">찾은 곳은 소영의 글씨로 고쳐 쓴다</small></h4>' +
      '<table class="tbl"><tr><th>곳</th><th>아저씨의 메모 · 소영의 글씨</th><th></th></tr>' + rows + '</table></div></div>';
    var piano = el.querySelector('[data-song-piano]'); if (piano) piano.onclick = function () { SS.cut('hook_piano'); };
    try { var box = el.querySelector('.song-map'), cv = SS.mapCanvas(560, 300); cv.style.width = '560px'; cv.style.height = '300px'; cv.style.borderRadius = '6px'; cv.style.boxShadow = '0 2px 10px rgba(0,0,0,.35)'; box.appendChild(cv); } catch (e) { console.error(e); }
  };

  // ================================================================ 게임 함수 감싸기
  function wrap(obj, name, fn) { var orig = obj && obj[name]; if (typeof orig !== 'function') return; obj[name] = fn(orig); obj[name]._song = true; }
  function install() {
    var DS = G.Disc, SP = G.Sponsor;
    if (DS) {
      wrap(DS, 'available', function (orig) { return function (d) { if (d && d.song && !T()) return false; return orig.apply(this, arguments); }; });
      wrap(DS, 'addHint', function (orig) { return function (id) { var d = G.DISC[id]; if (d && d.song && !T()) return false; return orig.apply(this, arguments); }; });
      wrap(DS, 'checkLand', function (orig) {
        return function () {
          var r = orig.apply(this, arguments);
          if (r && !T()) { if (r.hits) r.hits = r.hits.filter(function (d) { return !d.song; }); if (r.near && r.near.song) { r.near = null; r.nearDist = 99; } }
          return r;
        };
      });
      wrap(DS, 'find', function (orig) {
        return async function (d) {
          var r = await orig.apply(this, arguments);
          if (r !== false && T() && d) { try { await SS.onFind(d); } catch (e) { console.error(e); } }
          return r;
        };
      });
    }
    if (SP) wrap(SP, 'present', function (orig) { return function (sp) { if (sp && sp.song && (!T() || T().noSponsor)) return false; return orig.apply(this, arguments); }; });
    if (G.Frontier) wrap(G.Frontier, 'mateReady', function (orig) { return function (m) { if (m && m.song && !T()) return false; return orig.apply(this, arguments); }; });
    // 조선 사람 제독
    if (R) {
      wrap(R, 'nationName', function (orig) { return function (n) { return n === 'KR' ? '조선' : orig.apply(this, arguments); }; });
      wrap(R, 'nativeLang', function (orig) { return function (n) { return n === 'KR' ? 14 : orig.apply(this, arguments); }; });
      wrap(R, 'isHomeNation', function (orig) { return function (c) { var s = S(); if (s && s.player.nation === 'KR') return (R.cityOwner ? R.cityOwner(c) : c.nation) === '조선'; return orig.apply(this, arguments); }; });
    }
    // 명나라 항구: 사또가 준 노인(路引)으로 든다
    var C = G.Scenes && G.Scenes.city;
    if (C) wrap(C, 'entryCheck', function (orig) { return function (c) { var r = orig.apply(this, arguments), t = T(); if (r && r.reason === 'closed' && t && t.pass && isMing(c)) return null; return r; }; });
  }
  function boot() { try { install(); } catch (e) { console.error(e); } }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot); else boot();
})(window.G = window.G || {});
