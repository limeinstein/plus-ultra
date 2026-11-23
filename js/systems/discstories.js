/* 발견물의 사건·지리 합창·가족 소식. 원고와 배역은 js/data/discstories_20261123.js.
   보상·발견 기록은 기존 Disc가 맡고, 이 파일은 말한 갈래만 저장한다. */
(function (G) {
  'use strict';
  var DS = G.DiscStories = {}, U = G.U, UI = G.UI, R = G.R;
  function S() { return G.Game && G.Game.state; }
  function K() { return G.BALANCE.discStory; }
  function norm(t) { return String(t || '').toLowerCase().replace(/[^0-9a-z가-힣]/g, ''); }
  function store() {
    var s = S(), t = s.discStory || (s.discStory = {});
    t.seen = t.seen || {}; t.chorus = t.chorus || {}; t.recent = t.recent || []; t.pending = t.pending || []; t.family = t.family || {}; t.visits = t.visits || {};
    return t;
  }
  function generation() { return S().player.generation || 1; }
  DS.enabled = function () { var s = S(); return !!(s && s.player && (!s.settings || s.settings.banter !== false) && (!G.I18N || G.I18N.isKo())); };
  DS.has = function (d) { return !!(d && G.DISC_STORIES[d.id]); };
  function speaker(m) {
    if (!m) return { name: '갑판장', portrait: G.Art.withImg(G.Art.npcSpec('boatswain', 'sailor', 'ib'), G.Img.chain.npc('boatswain')), lang: 3 };
    var d = G.MATE[m.id];
    return { name: d.name, portrait: G.Scenes.mateSpec(m.id), half: G.Img.chain.mateHalf(m.id), lang: 3 };
  }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, lang: 3 }; }
  /** 기함의 고정 보직 또는 실제 선실에 배치한 사람. 대기·다른 배 선장은 제외한다. */
  DS.crew = function () {
    var s = S(), rooms = G.Cabins ? G.Cabins.rooms() : [], fixed = { first: 1, nav: 1, surveyor: 1, interp: 1, purser: 1 };
    return (s.mates || []).filter(function (m) {
      var d = G.MATE[m.id];
      if (!d || m.role === 'captain' || m.role === 'crew' || (R.mateHidden && R.mateHidden(m))) return false;
      if (d.mute && (!G.Tale || !G.Tale.mute || G.Tale.mute())) return false;
      return !!fixed[m.role] || (m.room != null && m.room >= 0 && m.room < rooms.length && (!G.Cabins.noStaff || !G.Cabins.noStaff(rooms[m.room])));
    });
  };
  DS.role = function (m) {
    var d = G.MATE[m.id] || {}, desc = d.desc || '', v = G.Voice ? G.Voice.typeOf(d) : 'plain', sk = d.sk || {}, f = d.g === 'f';
    if (G.DISC_STORY_ROLES.indexOf(d.discRole) >= 0) return d.discRole;
    if (d.id === 'snow_white') return '백설';
    if (d.id === 'sleeping_beauty') return '잠공';
    if (d.id === 'cinderella') return '신데렐라';
    if (d.id === 'little_mermaid' || /인어/.test(desc)) return '인어';
    if (f && /왕녀|왕의 딸|공주/.test(desc)) return '왕녀';
    if (f && /귀족|공녀|영애/.test(desc)) return '영애';
    if (/남장|남자로 행세/.test(desc)) return '남장';
    if (/도적|도둑|산적/.test(desc)) return '도적';
    if (/가수|무대.*노래|여가수/.test(desc) && f) return '아이돌';
    if (/선교사|사제|수도사|신부/.test(desc)) return '선교사';
    if (/장군|군대를|지휘관/.test(desc)) return '장군';
    if (/병사|군인|군대 출신/.test(desc)) return '군인';
    if (/괴력|근육|역도|힘장사/.test(desc)) return '헬창';
    if (/허풍|큰소리|뻥/.test(desc)) return '허풍';
    if (/구두쇠|짠돌이|한 푼/.test(desc)) return '구두쇠';
    if (/해적|사략/.test(desc) || d.captain || d.pirate) return '해적';
    if (d.minor || v === 'child_f' || v === 'child_m') return '어린애';
    if (/화가|조각가|예술가/.test(desc) || sk.art >= 3) return '예술가';
    if (/기술자|목수|기계|조선공|조선 장인/.test(desc) || sk.ship >= 3 || sk.craft >= 3) return '기술자';
    if (f) return { noble: '영애', genius: '똑순이', rush: '당찬', cute: '귀여운', charm: '유혹녀', tsun: '츤데레', hidden: '여전사', shonen: '엉뚱녀', merch: '살림꾼', witch: '불만', old_f: '노장', polite: '살림꾼', plain: '당찬' }[v] || '살림꾼';
    if (v === 'old_m' || d.old || d.age === 'old') return '노장';
    if (v === 'genius' || sk.hist >= 3 || sk.sci >= 3) return '학자';
    if (v === 'merch') return '구두쇠';
    if (v === 'shonen' || v === 'rush') return '열혈';
    if (v === 'noble') return '장군';
    if (v === 'polite') return '군인';
    return '베테랑';
  };
  /** 원고의 인물 이름은 실제 동료 ID로만 바꾼다. 이름이 없다고 새 사람을 만들어 세우지 않는다. */
  DS.actor = function (label, crew) {
    crew = crew || DS.crew(); var key = norm(String(label).replace(/\([^)]*\)/g, '')), ids = (G.DISC_STORY_ACTORS || {})[key] || [];
    var found = crew.filter(function (m) { return ids.indexOf(m.id) >= 0 || norm(G.MATE[m.id].name) === key; });
    if (found.length) return found[0];
    // '소그드 출신 상인'처럼 신원이 아니라 출신으로 쓴 인물도 실제 설명에 맞는 사람만.
    var place = String(label).match(/소그드|조선|류큐|타이노|잉카/);
    if (place) return crew.filter(function (m) { return (G.MATE[m.id].desc || '').indexOf(place[0]) >= 0; })[0] || null;
    return null;
  };
  function deputy(crew) { return crew.filter(function (m) { return m.role === 'first'; })[0] || null; }
  function line(text, who, m) { return { text: text, who: who, id: m && m.id || null, speaker: who === '*' ? { name: '', lang: 3 } : who === '제독' ? me() : speaker(m) }; }
  function replacePerson(text, label, name) {
    if (!label || label === name) return text;
    var re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(이|가|은|는|을|를|과|와)?', 'g');
    return text.replace(re, function (_, j) { return name + (j ? U.jx(name, { 이: '이/가', 가: '이/가', 은: '은/는', 는: '은/는', 을: '을/를', 를: '을/를', 과: '과/와', 와: '과/와' }[j]) : ''); });
  }
  function render(raw, chosen, crew, bindings) {
    var out = [], bind = bindings || {}, known = {};
    if (chosen) bind[chosen.role] = chosen.m;
    crew.forEach(function (m) { known[norm(G.MATE[m.id].name)] = m; });
    raw.forEach(function (l) {
      if (l[2] && !DS.actor(l[2], crew)) return;
      var who = l[0], t = l[1], m = bind[who] || (who === '부관' ? deputy(crew) : DS.actor(who, crew));
      if (who !== '*' && who !== '제독' && who !== '갑판장' && who !== '부관' && !m) return;
      Object.keys(bind).forEach(function (k) { if (bind[k]) t = replacePerson(t, k, G.MATE[bind[k].id].name); });
      // 원고의 지문에만 나온 동료도 배에 없으면 등장시키지 않는다.
      if (who === '*' && ['견우', '직녀', '유비', '관우', '장비', '제갈량'].some(function (name) { return t.indexOf(name) >= 0 && !DS.actor(name, crew); })) return;
      out.push(line(t, who, m));
    });
    return out;
  }
  function seen(t, id, key) { return (t.seen[id] || []).indexOf(key) >= 0; }
  function tagKey(t) { return String(t || '').split('·')[0].trim(); }
  function voyageText(text) {
    var s = S(), v = s.voyage || {}, c = G.CITY_DATA[v.from != null ? v.from : s.loc.from], days = v.startDay != null ? s.day - v.startDay : (s.fleet.daysOut || 0);
    var port = c ? c.name : '지난 항구';
    return String(text).replace(/\{출항지\}(으로|로|을|를|이|가|은|는|과|와)?/g, function (_, j) { return port + (j ? U.jx(port, { 으로: '으로/로', 로: '으로/로', 을: '을/를', 를: '을/를', 이: '이/가', 가: '이/가', 은: '은/는', 는: '은/는', 과: '과/와', 와: '과/와' }[j]) : ''); }).replace(/\{날수\}/g, String(Math.max(0, Math.floor(days))));
  }
  function chorus(d, rec, crew) {
    var ch = rec.chorus, adj = deputy(crew), picked = [], used = {}, hard = 0, cap = K().chorusMax, candidates = [];
    function take(c, m, isAdj) {
      var id = m ? m.id : 'boatswain'; if (used[id]) return;
      if (c.tag.indexOf('고난') >= 0 && hard >= K().hardshipMax) return;
      used[id] = true; if (c.tag.indexOf('고난') >= 0) hard++;
      picked.push({ row: c, m: m, deputy: isAdj });
    }
    var adjRow = ch.cast.filter(function (c) { return c.actor === '부관'; })[0];
    // 관계 인물이 먼저 자리를 얻고, 부관 한 자리와 고난 한 줄은 따로 남겨 둔다.
    var adjId = adj ? adj.id : 'boatswain', reservedHard = adjRow && adjRow.tag.indexOf('고난') >= 0 ? 1 : 0;
    hard = reservedHard;
    ch.cast.filter(function (c) { return c.named; }).forEach(function (c) { var m = DS.actor(c.actor, crew) || (c.local && G.DiscoveryGuides && G.DiscoveryGuides.local(c.actor, d)); if (m) candidates.push({ row: c, m: m }); });
    ch.cast.filter(function (c) { return !c.named && c.actor !== '부관' && c.actor !== '망대 선원'; }).forEach(function (c) {
      var m = crew.filter(function (x) { return DS.role(x) === c.actor && x !== adj; })[0]; if (m) candidates.push({ row: c, m: m });
    });
    candidates.forEach(function (x) { var reserve = adjRow && !used[adjId] && x.m.id !== adjId ? 1 : 0; if (picked.length < cap - reserve) take(x.row, x.m, false); });
    hard -= reservedHard;
    if (adjRow && !used[adjId]) take(adjRow, adj, true);
    var hardLines = picked.filter(function (x) { return x.row.tag.indexOf('고난') >= 0; }), shout = picked.filter(function (x) { return x.row.tag.indexOf('외침') >= 0; });
    var rest = picked.filter(function (x) { return x.row.tag.indexOf('고난') < 0 && x.row.tag.indexOf('외침') < 0; });
    var out = [line(voyageText(ch.hardship), '*')];
    hardLines.forEach(function (x) { out.push(line(x.row.text, x.row.actor, x.m)); });
    if (!shout.length) { var lookout = ch.cast.filter(function (c) { return c.actor === '망대 선원'; })[0]; out.push({ text: lookout.text, who: '망대 선원', id: null, speaker: { name: '망대 선원', portrait: speaker(null).portrait, lang: 3 } }); }
    shout.concat(rest).forEach(function (x) { out.push(line(x.row.text, x.row.actor, x.m)); });
    out.push(line(ch.close, '*')); out.push(line(ch.admiral, '제독'));
    var consumed = (ch.consumes || []).filter(function (c) { var m = DS.actor(c.actor, crew); return m && picked.some(function (x) { return x.m && x.m.id === m.id; }); }).map(function (c) { return c.key; });
    return { id: d.id, kind: 'chorus', key: rec.key + ':chorus', rec: rec.key, lines: out, participants: picked.map(function (x) { return x.m ? x.m.id : 'boatswain'; }), consumed: consumed, tag: '합창' };
  }
  function visits(t,id) { return t.visits[id] == null ? ((t.seen[id] || []).length || t.chorus[id] ? 1 : 0) : t.visits[id]; }
  function stage(t,id,r) { return !r || !r.requiresChorus || !!t.chorus[id]; }
  function firstAdjSeen(t,id,r) { return seen(t,id,r.key+':adjFirst') || seen(t,id,r.key+':부관'); } // 825본에서 이미 들은 긴 부관 갈래도 보존한다.
  /** 화면 없는 고르기. 저장은 commit에서만 바뀌므로 미리보기·검사로 이야기가 소모되지 않는다. */
  function plan(d) {
    if (!DS.enabled() || !DS.has(d)) return null;
    var t = store(), e = G.DISC_STORIES[d.id], crew = DS.crew(), adj = deputy(crew), rec = e.scenarios[0], candidates = [];
    var firstChorus = e.scenarios.filter(function (r) { return r.chorus && !t.chorus[d.id]; })[0];
    if (firstChorus) return chorus(d, firstChorus, crew);
    var available = e.scenarios.filter(function (r) { return stage(t,d.id,r); });
    rec = available.filter(function (r) { return r.revisit; })[0] || rec;
    e.related.forEach(function (a) {
      if (seen(t, d.id, a.key)) return;
      var associated = a.rec && e.scenarios.filter(function (r) { return r.key === a.rec; })[0];
      if (!stage(t,d.id,associated)) return;
      if (rec.revisit && !(associated && associated.revisit) && !a.onReturn) return;
      var ms = a.actors.map(function (n) { return DS.actor(n, crew); }).filter(Boolean); if (!ms.length) return;
      var bind = {}; a.actors.forEach(function (n) { var m = DS.actor(n, crew); if (m) bind[n] = m; });
      var rendered = render(a.lines, null, crew, bind); if (!rendered.length) return;
      candidates.push({ key: a.key, m: ms[0], tag: '관계', lines: rendered, priority: a.priority, rec: associated ? associated.key : rec.key });
    });
    available.forEach(function (r) {
      r.arcs.forEach(function (a) {
        if (seen(t, d.id, a.key)) return;
        if (a.afterPrimary && (visits(t,d.id)<1 || r.arcs.some(function (p) { return !p.afterPrimary && !seen(t,d.id,p.key); }))) return;
        crew.filter(function (m) { return DS.role(m) === a.role; }).forEach(function (m) {
          candidates.push({ key: a.key, m: m, role: a.role, tag: a.tag, lines: render(a.lines, { m: m, role: a.role }, crew), priority: 4, rec: r.key, extra: a.extra });
        });
      });
    });
    candidates.sort(function (a, b) {
      var ar = t.recent.indexOf(a.m.id) >= 0 ? 1 : 0, br = t.recent.indexOf(b.m.id) >= 0 ? 1 : 0;
      return a.priority - b.priority || ar - br || (tagKey(a.tag) === t.lastTag ? 1 : 0) - (tagKey(b.tag) === t.lastTag ? 1 : 0) || (b.extra ? 1 : 0) - (a.extra ? 1 : 0);
    });
    var a = candidates[0], adjRec = available.filter(function (r) { return (r.adjFirst && !firstAdjSeen(t,d.id,r)) || (r.adj && !seen(t,d.id,r.key+':adj')); })[0];
    if (adj && adjRec && (!a || U.chance(K().deputyChance))) {
      var firstAdj = adjRec.adjFirst && !firstAdjSeen(t,d.id,adjRec);
      return { id: d.id, kind: 'adj', key: adjRec.key + (firstAdj ? ':adjFirst' : ':adj'), rec: adjRec.key, actor: adj.id, tag: '부관', lines: [line(adjRec.base, '*')].concat(render(firstAdj ? adjRec.adjFirst : adjRec.adj, null, crew)) };
    }
    if (a) {
      var base = e.scenarios.filter(function (r) { return r.key === a.rec; })[0];
      return { id: d.id, kind: 'arc', key: a.key, rec: a.rec, actor: a.m.id, tag: a.tag, lines: [line(base.base, '*')].concat(a.lines) };
    }
    // 부관이 없을 때만 갑판장의 그 발견물 전용 장면을 쓴다.
    var deckRec = !adj && available.filter(function (r) { return (r.deck || r.adj) && !seen(t, d.id, r.key + ':deck'); })[0];
    if (deckRec) return { id: d.id, kind: 'deck', key: deckRec.key + ':deck', rec: deckRec.key, tag: '갑판장', lines: [line(deckRec.base, '*')].concat(render(deckRec.deck || deckRec.adj, null, crew)) };
    return { id: d.id, kind: 'recall', key: null, rec: rec.key, tag: '회상', lines: [line(rec.recall || rec.chorus.recall, '제독')] };
  }
  DS.plan = function (d) {
    var p = plan(d); if (!p) return p;
    var s = S(), t = store(), extra = G.DISC_STORY_JINA_MEET, found = s.disc && s.disc[d.id];
    var j = extra && DS.actor('지나');
    if (!j || !s.wangMerch || s.wangMerch.lastMet !== s.day || t.jinaMetDay === s.day || !found || found.found !== U.dateNum(s.date) || extra.except.indexOf(d.id)>=0) return p;
    if (p.kind==='chorus' && p.participants.indexOf(j.id)<0) {
      if (p.participants.length>=K().chorusMax) return p;
      p.participants.push(j.id);
    }
    p.lines.push(line(extra.text,'지나',j));p.jinaMeetDay=s.day;return p;
  };
  DS.commit = function (p) {
    if (!p) return; var t = store(), previousVisits = visits(t,p.id);
    if (p.key && !seen(t, p.id, p.key)) (t.seen[p.id] || (t.seen[p.id] = [])).push(p.key);
    (p.consumed || []).forEach(function (k) { if (!seen(t,p.id,k)) (t.seen[p.id] || (t.seen[p.id]=[])).push(k); });
    t.visits[p.id] = previousVisits + 1;
    if (p.jinaMeetDay != null) t.jinaMetDay=p.jinaMeetDay;
    if (p.kind === 'chorus') t.chorus[p.id] = 1;
    if (p.actor) { t.recent.unshift(p.actor); t.recent = t.recent.slice(0, K().recent); }
    t.lastTag = tagKey(p.tag);
  };
  function familyKey(id,rec) { return generation() + ':' + id + (rec && rec.revisit ? ':'+rec.key : ''); }
  function familyRec(d, key) { var e = G.DISC_STORIES[d.id]; return e.scenarios.filter(function (r) { return r.key === key && r.family; })[0] || e.scenarios.filter(function (r) { return r.family; })[0]; }
  /** 있는 가족만 모은다. 배우자·자녀·형제의 실제 저장 객체가 초상과 호칭을 결정한다. */
  DS.familyMembers = function () {
    var s = S(), p = s.player, members = [], on = DS.crew().map(function (m) { return m.id; });
    if (p.wife && G.Family) members.push({ kind: '아내', id: p.wife, aboard: !!p.wifeAboard, home: p.home, speaker: G.Family.wifeSpeaker() });
    if (G.Wives) (p.wives2 || []).forEach(function (w) { members.push({ kind: '아내', id: w.id, aboard: !!(G.Wives.aboard && G.Wives.aboard().some(function (x) { return x.id === w.id; })), home: w.city != null ? w.city : p.home, speaker: G.Wives.speaker(w) }); });
    if (G.Husbands) G.Husbands.list().forEach(function (h) { var m = (s.mates || []).filter(function (x) { return x.id === h.id; })[0]; members.push({ kind: '남편', id: h.id, aboard: on.indexOf(h.id) >= 0, home: p.home, speaker: speaker(m) }); });
    (p.kids || []).filter(function (k) { return !k.unnamed && !k.lost && !k.away && !k.married; }).forEach(function (k) { members.push({ kind: k.sex === 'f' ? '딸' : '아들', id: 'kid:' + k.name, aboard: !!k.aboard || on.indexOf(k.mateId) >= 0, home: p.home, speaker: G.HomeLife.speaker(k) }); });
    if (G.Siblings) G.Siblings.all().forEach(function (k) { members.push({ kind: G.Siblings.rel(k), id: 'sib:' + k.name, aboard: on.indexOf(k.mateId) >= 0, home: p.home, k: k, speaker: G.Siblings.speaker(k) }); });
    (s.mates || []).forEach(function (m) { var d = G.MATE[m.id]; if (d && d.kin === 'friend') members.push({ kind: '소꿉친구', id: m.id, aboard: on.indexOf(m.id) >= 0, home: p.home, speaker: speaker(m) }); });
    return members;
  };
  function familyChoice(rec, members) {
    var wanted = rec.family.kind, same = wanted === '아내' && R.heroFemale() ? '남편' : wanted;
    var pairs = { 아들: '딸', 딸: '아들', 누나: '언니', 언니: '누나', 형: '오빠', 오빠: '형', 남동생: '여동생', 여동생: '남동생', 아내: '소꿉친구', 남편: '소꿉친구' };
    return members.filter(function (m) { return m.kind === same; })[0] || members.filter(function (m) { return m.kind === pairs[same]; })[0] || null;
  }
  DS.familyText = function (rec, m) {
    var t = rec.family.text, female = R.heroFemale();
    if (m.kind === '남편' && rec.family.husband) return rec.family.husband;
    if (m.kind === '아들' || m.kind === '딸') t = t.replace(/아버지\(어머니\)/g, female ? '어머니' : '아버지').replace(/아빠\(엄마\)/g, female ? '엄마' : '아빠').replace(/아버지|아빠/g, function (v) { return female ? (v === '아빠' ? '엄마' : '어머니') : v; });
    if (m.kind === '남동생' || m.kind === '여동생') {
      var call = female ? (m.kind === '여동생' ? '언니' : '누나') : (m.kind === '여동생' ? '오빠' : '형');
      t = t.replace(/오빠|언니|누나|형/g, call);
    } else if (['형', '오빠', '누나', '언니'].indexOf(m.kind) >= 0) {
      t = t.replace(/오빠|언니|누나|형/g, m.kind);
    }
    if (m.kind === '남편') {
      t = t.replace(/내 남편/g, '내 아내').replace(/줄게요/g, '주겠소').replace(/할게요/g, '하겠소').replace(/했어요/g, '했소').replace(/예요/g, '요').replace(/해요/g, '하오').replace(/봐요/g, '보오');
    }
    return t;
  };
  async function familySay(d, rec, m, letter) {
    var t = store(), key = familyKey(d.id,rec); if (t.family[key]) return false;
    t.family[key] = 1; t.pending = t.pending.filter(function (x) { return x.id !== d.id || x.gen !== generation() || familyKey(x.id,familyRec(d,x.rec)) !== key; });
    if (letter) await UI.say(m.speaker.name + '에게서 「' + d.name + '」 소식을 들었다는 편지가 왔다.', { name: '', lang: 3 });
    var sp = {}; Object.keys(m.speaker).forEach(function (k) { sp[k] = m.speaker[k]; });
    sp.heroSpeechAdapted = true; // familyText에서 어머니·누나 등 현재 제독의 호칭을 이미 골랐다.
    await UI.say(DS.familyText(rec, m), sp); return true;
  }
  async function scheduleFamily(d, rec, skip) {
    if (!rec || !rec.family) return; var t = store(), key = familyKey(d.id,rec); if (t.family[key]) return;
    var member = !skip && familyChoice(rec, DS.familyMembers().filter(function (m) { return m.aboard; }));
    if (member) { await familySay(d, rec, member, false); return; }
    if (!t.pending.some(function (x) { return x.id === d.id && x.gen === generation() && familyKey(x.id,familyRec(d,x.rec)) === key; })) t.pending.push({ id: d.id, rec: rec.key, gen: generation() });
  }
  DS.home = async function (c, letter) {
    if (!DS.enabled()) return 0; var s = S(), t = store(), count = 0;
    t.pending = t.pending.filter(function (x) { return x.gen === generation(); });
    var pending = t.pending.slice();
    for (var i = 0; i < pending.length && count < K().familyPerVisit; i++) {
      var item = pending[i], d = G.DISC[item.id], st = s.disc[item.id];
      if (!d || !st || !(st.reported || st.announced)) continue;
      var rec = familyRec(d, item.rec), members = DS.familyMembers().filter(function (m) { return letter || m.home === c.id; }), m = rec && familyChoice(rec, members);
      if (m && await familySay(d, rec, m, letter)) count++;
    }
    return count;
  };
  DS.arrive = function (c) { return DS.home(c, !!(S().settings && S().settings.discoveryLetters)); };
  DS.at = function (d) {
    var s = S(), loc = s.loc || {}; if (!G.Disc.foundByMe(d.id)) return false;
    if (d.how === 'city') return loc.mode === 'city' && loc.city === d.city;
    if (loc.mode !== 'sea' && loc.mode !== 'land') return false;
    if (d.how === 'land' && loc.mode !== 'land' || d.how === 'sea' && loc.mode !== 'sea') return false;
    var dx = ((loc.lon - d.lon + 540) % 360 - 180) * Math.cos(d.lat * Math.PI / 180), dy = loc.lat - d.lat;
    return dx * dx + dy * dy <= Math.pow(Math.max(d.r || 0, K().revisitRadius), 2);
  };
  DS.play = async function (d) {
    if (DS.running || !DS.enabled()) return false;
    var p = DS.plan(d); if (!p) return false;
    var s = S(), skip = false; DS.running = true;
    try {
      DS.commit(p);
      for (var i = 0; i < p.lines.length && !skip && S() === s; i++) {
        var l = p.lines[i], opts = {};
        Object.keys(l.speaker).forEach(function (k) { opts[k] = l.speaker[k]; });
        opts.onSceneCancel = function () { skip = true; }; opts.raw = true;
        await UI.say(l.text, opts);
      }
      if (S() === s && p.kind !== 'recall') await scheduleFamily(d, familyRec(d, p.rec), skip);
      return true;
    } finally { DS.running = false; }
  };
})(window.G = window.G || {});
