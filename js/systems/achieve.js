/* 업적 — 발견물의 주제 조합으로 이룬다 (자료: js/data/achievements.js, 사슬: js/data/chaindisc.js G.CHAINS).
   - 발견할 때마다(D.find 끝) 살펴 새로 이룬 업적을 알리고 보상(탐험 명성·금화·칭호)을 준다.
     한 가지만 더 찾으면 이루는 업적은 「한 가지 남았다」고 귀띔한다.
   - 하루가 지날 때(G.World.daily) 옛 저장에서 이미 이룬 업적과, 앞 고리를 이미 찾아 둔 사슬의 단서를 챙긴다.
   - 동료 업적(crew): 동료로 들인 적이 있는 사람은 state.crewEver[id] = 날짜. 술집에서 고용하면(T.hireMate) AC.afterHire가 곧바로 살피고, 그 밖의 길은 하루가 지날 때 챙긴다.
   - 수첩 「업적」 쪽: 얻은 칭호, 갈래별 진행, 사슬 지도(찾음·단서·잠김). 저장: state.achv[id] = { d: 날짜 } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var AC = {};
  G.Achieve = AC;
  function S() { return G.Game.state; }
  function store() { var s = S(); return s.achv || (s.achv = {}); }
  function found(id) { return G.Disc.foundByMe(id); }
  function name(id) { var d = G.DISC[id]; return d ? d.name : id; }
  function mine() { var s = S(), out = []; for (var id in s.disc) { var st = s.disc[id]; if (st && st.me && st.found && G.DISC[id]) out.push(G.DISC[id]); } return out; }
  function regName(r) { return (G.REGIONS || [])[r] || ''; }
  /** 동료로 들인 적이 있는 사람 { id: 날짜 } — 지금 배에 탄 동료도 적어 둔다 (옛 저장) */
  function crewEver() {
    var s = S(), ev = s.crewEver || (s.crewEver = {});
    (s.mates || []).forEach(function (m) { if (m && m.id && !ev[m.id]) ev[m.id] = U.dateNum(s.date); });
    return ev;
  }
  function mateName(id) { var m = G.MATE && G.MATE[id]; return m ? m.name : id; }
  /** 혼인한 적이 있는 사람 { id: 날짜 } — 지금의 본처(player.wife)와 둘째 부인들(player.wives2)을 적어 둔다 */
  function wedEver() {
    var s = S(), ev = s.wedEver || (s.wedEver = {}), p = s.player || {};
    if (p.wife && !ev[p.wife]) ev[p.wife] = U.dateNum(s.date);
    (p.wives2 || []).forEach(function (w) { if (w && w.id && !ev[w.id]) ev[w.id] = U.dateNum(s.date); });
    return ev;
  }
  AC.wedEver = wedEver;

  AC.list = function () { return G.ACHIEVEMENTS || []; };
  AC.get = function (id) { return AC.list().filter(function (a) { return a.id === id; })[0] || null; };
  AC.done = function (id) { return !!store()[id]; };
  /** 현재 자료에서 종류별 목록을 만든다. 경쟁자의 발견·시대·단서 유무로 분모를 줄이지 않는다. */
  AC.collectionPool = function (type) {
    var kind = (G.DISC_COLLECTIONS || []).filter(function (x) { return x.id === type; })[0];
    if (!kind) return [];
    var s = S();
    return Object.keys(G.DISC || {}).filter(function (id) { var d = G.DISC[id]; return d && d.id === id && (!d.tale || !!(s && s.story)) && kind.has(d); });
  };
  AC.chainDone = function (ch) { return ch.ids.every(found); };
  AC.chainsDone = function () { return (G.CHAINS || []).filter(AC.chainDone); };

  /** 진행: { have, need, done, rows: [{ label, ids?, got?, count, n }] } */
  AC.progress = function (a, my) {
    my = my || mine();
    var rows = [];
    function idsRow(ids, n, label) { var got = ids.filter(found); return { label: label || null, ids: ids, got: got, count: got.length, n: n || ids.length }; }
    if (a.fameRule) {
      var fr = a.fameRule, cats = fr.all ? ['ex', 'tr', 'bt', 'so'] : [fr.cat || null];
      cats.forEach(function (cat) { rows.push({ label: (cat ? G.Fame.NAME[cat] : '통합') + ' 명성', count: G.Fame.get(cat), n: fr.min }); });
    }
    if (a.collectionRule) {
      var pool = AC.collectionPool(a.collectionRule), got = pool.filter(found);
      rows.push({ collection: true, label: '직접 발견', ids: pool, got: got, count: got.length, n: pool.length });
    }
    if (a.ids) rows.push(idsRow(a.ids, a.n));
    if (a.cats) a.cats.forEach(function (r) {
      if (r.ids) { rows.push(idsRow(r.ids, r.n)); return; }
      var cs = [].concat(r.cat);
      var c = my.filter(function (d) { return cs.indexOf(d.cat) >= 0 && (r.reg == null || d.reg === r.reg); }).length;
      rows.push({ label: cs.map(function (x) { return G.DISC_CATS[x]; }).join('·') + (r.reg != null ? ' (' + regName(r.reg) + ')' : ''), count: c, n: r.n });
    });
    if (a.crew) { var ev = crewEver(), had = a.crew.filter(function (id) { return !!ev[id]; }); rows.push({ crew: true, ids: a.crew, got: had, count: had.length, n: a.n || a.crew.length }); }
    if (a.wed) { var we = wedEver(), wd = a.wed.filter(function (id) { return !!we[id]; }); rows.push({ crew: true, wed: true, ids: a.wed, got: wd, count: wd.length, n: a.n || a.wed.length }); }
    if (a.chains) rows.push({ label: '끝까지 푼 사슬', count: AC.chainsDone().length, n: a.chains });
    if (a.everyReg) (G.REGIONS || []).forEach(function (rn, r) {
      rows.push({ label: rn, count: my.filter(function (d) { return d.reg === r; }).length, n: a.everyReg, small: true });
    });
    if (a.oneReg) {
      var best = null;
      (G.REGIONS || []).forEach(function (rn, r) {
        var rr = a.oneReg.cats.map(function (cat) { return { label: rn + ' · ' + G.DISC_CATS[cat], count: my.filter(function (d) { return d.reg === r && d.cat === cat; }).length, n: a.oneReg.n }; });
        var sc = rr.reduce(function (t, x) { return t + Math.min(x.count, x.n); }, 0);
        if (!best || sc > best.sc) best = { sc: sc, rows: rr };
      });
      if (best) rows = rows.concat(best.rows);
    }
    var have = 0, need = 0, ok = true;
    rows.forEach(function (x) { have += Math.min(x.count, x.n); need += x.n; if (x.count < x.n || (x.collection && !x.n)) ok = false; });
    return { have: have, need: need, done: ok && rows.length > 0, rows: rows };
  };

  /** 아직 이루지 않은 업적 가운데 지금 이룬 것을 기록하고 보상한다 → 이룬 업적 목록 */
  function grant(a) {
    var s = S();
    // 보상보다 먼저 기록하여 명성을 주는 기존 업적과 함께 처리해도 중복 지급하지 않는다.
    store()[a.id] = { d: U.dateNum(s.date) };
    if (a.gold) s.player.gold += a.gold;
    if (a.fame && G.Fame) G.Fame.add('ex', a.fame);
    G.State.log('업적 「' + a.name + '」' + U.jx(a.name, '을/를') + ' 이루었다' + (a.title ? ' — 칭호 「' + a.title + '」' : '') + ' (금화 ' + U.num(a.gold || 0) + ', 명성 +' + (a.fame || 0) + ')');
  }
  AC.check = function () {
    var s = S(), st = store(), my = mine(), got = [];
    AC.list().forEach(function (a) {
      if (st[a.id] || !AC.progress(a, my).done) return;
      grant(a);
      got.push(a);
    });
    return got;
  };
  /** 명성 획득 직후 보상은 즉시 지급하고, 장면은 기존 다음 항구/발견 뒤 대기열로 보낸다. */
  AC.onFame = function () {
    var s = S(), st = store();
    AC.list().forEach(function (a) {
      if (!a.fameRule || st[a.id] || !AC.progress(a, []).done) return;
      grant(a);
      var pend = s.achvPend || (s.achvPend = []); if (pend.indexOf(a.id) < 0) pend.push(a.id);
      UI.toast('명성 업적 달성 · ' + a.name + ' (금화 ' + U.num(a.gold) + '닢)', 'crown', 4800);
    });
  };
  function rewardText(a) { return '금화 ' + U.num(a.gold || 0) + '닢 · 명성 +' + U.num(a.fame || 0) + (a.title ? ' · 칭호 「' + a.title + '」' : ''); }

  // ---------------------------------------------------------------- 업적 장면 (2026-10-23 사용자 요청 「모든 업적 달성할 때 개별 이벤트처럼」)
  // 업적마다 하나의 사건처럼: 종소리·환호 → 금빛 띠 → 이 업적에 든 발견물 그림을 차례로 띄우며 이야기 → 알맞은 부하의 한마디 → 제독의 한마디 → 보상 창
  // 대사는 js/data/achvevents.js (G.ACHV_EVENTS). 대사가 없는 업적도 그림·띠·보상 창으로 장면을 꾸린다.
  function player() { var p = S().player; return { name: p.name, rigId: 'player', portrait: p.portrait, half: G.Img && G.Img.chain.heroHalf ? G.Img.chain.heroHalf() : null }; }
  function mateSp(m) { return { name: G.MATE[m.id].name, portrait: G.Scenes.mateSpec(m.id), half: G.Img.chain.mateHalf(m.id), lang: 3 }; }
  /** 그 특기가 가장 높은 부하 (없으면 부관 · 갑판장) */
  function bySkill(sk) {
    var s = S(), best = null, bl = 0;
    if (sk && sk !== 'first' && G.R && G.R.mateSkill) (s.mates || []).forEach(function (m) {
      if (!m || !G.MATE[m.id]) return; var lv = G.R.mateSkill(m, sk) || 0;
      if (lv > bl) { bl = lv; best = m; }
    });
    return best ? mateSp(best) : G.Scenes.mateSpeaker('first');
  }
  /** 이 업적에 든, 내가 찾은 발견물 가운데 그림이 있는 것 (최대 n) */
  function pics(a, n) {
    var my = mine(), ids = [];
    if (a.collectionRule) ids = AC.collectionPool(a.collectionRule).filter(found);
    else if (a.ids) ids = a.ids.filter(found);
    else if (a.cats) my.forEach(function (d) { if (a.cats.some(function (r) { return r.ids ? r.ids.indexOf(d.id) >= 0 : [].concat(r.cat).indexOf(d.cat) >= 0 && (r.reg == null || d.reg === r.reg); })) ids.push(d.id); });
    else if (a.chains) (G.CHAINS || []).filter(AC.chainDone).forEach(function (ch) { ids.push(ch.ids[ch.ids.length - 1]); });
    else if (a.everyReg || a.oneReg) ids = my.map(function (d) { return d.id; });
    // 값진 것부터 (같은 값이면 원래 차례)
    if (!a.ids) ids.sort(function (x, y) { return ((G.DISC[y] || {}).val || 0) - ((G.DISC[x] || {}).val || 0); });
    return ids.filter(function (id) { return G.Img && G.Img.file('discoveries/' + id); }).slice(0, n || 3);
  }
  function show(img, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: img, title: title, noStand: true }) : null; }
  /** 업적 전용 그림. 사건 자료가 지정한 그림을 우선하고, 업적별 고해상도 그림을 그 다음으로 쓴다. */
  function achievementPic(a, ev) {
    if (ev.pic) return { img: ev.pic, title: ev.picTitle || a.name };
    if (a.id === 'montcrew') return { img: 'legend-events/montcrew_oath', title: '열 사람이 한 배에' };
    if (a.id === 'happily') return { img: 'legend-events/happily_after_all', title: 'Happily After All' };
    if (G.Img && G.Img.file && G.Img.file('achievement-events/' + a.id)) return { img: 'achievement-events/' + a.id, title: a.name };
    return null;
  }
  /** 금빛 띠: 「업적 달성 — 이름」 (장면 내내 위에 떠 있다) */
  function ribbon(a) {
    var root = document.getElementById('ui'); if (!root) return null;
    var el = document.createElement('div'); el.className = 'achv-ribbon';
    el.innerHTML = '<span class="ar-k">업적 달성</span><span class="ar-n">' + U.esc(a.name) + '</span>' + (a.title ? '<span class="ar-t">칭호 「' + U.esc(a.title) + '」</span>' : '');
    root.appendChild(el); requestAnimationFrame(function () { el.classList.add('on'); });
    return { stop: function () { el.classList.remove('on'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400); } };
  }
  /** 한 업적의 장면 */
  AC.scene = async function (a) {
    var ev = (G.ACHV_EVENTS || {})[a.id] || {}, s = S();
    if (a.fameRule) ev = { n: [a.desc, '항구의 서기관이 제독의 행적을 공적록에 적고, 감사의 사례금을 건넸다.'],
      sk: a.fameRule.cat === 'tr' ? 'acct' : a.fameRule.cat === 'bt' ? 'gun' : a.fameRule.cat === 'so' ? 'speech' : 'nav',
      m: '이 이름은 한 번의 행운이 아니라, 우리가 쌓아 온 항해의 기록입니다.',
      p: G.Career ? G.Career.line('honor') : '다음 항해에서도 이 이름에 부끄럽지 않도록 하자.' };
    if (G.Audio) { G.Audio.sfx('bell'); setTimeout(function () { if (G.Audio) G.Audio.sfx('cheer'); }, 450); }
    var heldPic = G.FamEv && G.FamEv.suspendPic ? G.FamEv.suspendPic() : null;
    var fixedShot = achievementPic(a, ev), rb = ribbon(a), shots = fixedShot ? [] : pics(a, 3), pc = null, k = 0;
    function next() {   // 줄이 바뀔 때마다 다음 발견물 그림으로 (그림이 다 떨어지면 마지막 것을 그대로)
      if (fixedShot) { if (!pc) pc = show(fixedShot.img, fixedShot.title); return; }
      if (k < shots.length) { var id = shots[k++]; pc = show('discoveries/' + id, (G.DISC[id] || {}).name || a.name); }
    }
    try {
      next();
      var lines = ev.n || [a.desc];
      for (var i = 0; i < lines.length; i++) { if (i) next(); await UI.say(lines[i], {}); }
      if (ev.cast) {
        var inFleet = {}; (s.mates || []).forEach(function (m) { if (m) inFleet[m.id] = m; });
        for (var c = 0; c < ev.cast.length; c++) {
          var m = inFleet[ev.cast[c][0]]; if (!m || !G.MATE[m.id]) continue;   // 떠난 사람은 말하지 않는다
          next();
          var sp = G.Legend && G.Legend.speaker && G.Legend.speaker(m.id, 'happy'); if (!sp || !sp.name) sp = mateSp(m);
          await UI.say(ev.cast[c][1], sp);
        }
        if (ev.after) await UI.say(ev.after, {});
      }
      if (ev.m) { next(); await UI.say(ev.m, bySkill(ev.sk)); }
      if (ev.p) { next(); await UI.say(ev.p, player()); }
      await UI.window({ title: '업적 달성', icon: 'crown', width: 640, parch: true,
        html: '<div class="achv-pop"><div class="achv-g">' + U.esc(a.group) + '</div><div class="achv-n">' + U.esc(a.name) + '</div><div class="achv-d">' + U.esc(a.desc) + '</div>' +
          '<div class="achv-r">' + rewardText(a) + '</div></div>',
        buttons: [{ label: '좋다', value: 1, cls: 'navy' }] }).result;
    } finally {
      if (rb) rb.stop();
      if (G.FamEv && G.FamEv.stopPic) await G.FamEv.stopPic();
      if (heldPic) heldPic.restore();
    }
  };

  /** 발견한 뒤·동료를 들인 뒤·항구에 들어선 뒤: 새 업적마다 장면을 하나씩 (하루 셈에서 이룬 것도 함께) */
  async function announce(got) {
    var s = S(), pend = (s && s.achvPend) || [];
    if (pend.length) { s.achvPend = []; pend.forEach(function (id) { var a = AC.get(id); if (a && got.indexOf(a) < 0) got = got.concat([a]); }); }
    for (var i = 0; i < got.length; i++) {
      try { await AC.scene(got[i]); } catch (e) { console.error(e); }
    }
  }
  AC.playPending = function () { return announce([]); };
  AC.afterFind = async function (d) {
    var got = AC.check();
    await announce(got);
    if (!d) return got;
    var my = mine();
    AC.list().forEach(function (a) {
      if (AC.done(a.id)) return;
      var inIt = (a.collectionRule && AC.collectionPool(a.collectionRule).indexOf(d.id) >= 0) || (a.ids && a.ids.indexOf(d.id) >= 0) || (a.cats && a.cats.some(function (r) { return r.ids ? r.ids.indexOf(d.id) >= 0 : [].concat(r.cat).indexOf(d.cat) >= 0; }));
      if (!inIt) return;
      var p = AC.progress(a, my);
      if (p.need - p.have === 1) UI.toast('업적 「' + a.name + '」까지 한 가지 남았다', 'crown', 5200);
    });
    return got;
  };

  /** 동료를 들인 뒤(술집 고용 T.hireMate): 동료 업적을 살펴 알리고, 한 사람 남았으면 귀띔한다 */
  AC.afterHire = async function (id) {
    var ev = crewEver();
    if (id && !ev[id]) ev[id] = U.dateNum(S().date);
    var got = AC.check();
    await announce(got);
    AC.list().forEach(function (a) {
      if (!a.crew || AC.done(a.id) || a.crew.indexOf(id) < 0) return;
      var p = AC.progress(a);
      if (p.need - p.have === 1) {
        var left = a.crew.filter(function (x) { return !ev[x]; }).map(mateName);
        UI.toast('업적 「' + a.name + '」까지 한 사람 남았다' + (left.length === 1 ? ' — ' + left[0] : ''), 'crown', 5200);
      }
    });
    return got;
  };

  /** 혼인 직후: 혼인 업적을 바로 알린다. 옛이야기의 네 아가씨를 모두 맞으면 전용 사건 그림도 함께 뜬다. */
  AC.afterWed = async function (id) {
    var ev = wedEver();
    if (id && !ev[id]) ev[id] = U.dateNum(S().date);
    var got = AC.check();
    await announce(got);
    return got;
  };

  /** 하루마다: 옛 저장의 업적·이미 열린 사슬의 단서 → 소식 */
  AC.daily = function () {
    var s = S(), out = [];
    if (!G.Disc || !G.DISC_CHAIN) return out;
    for (var id in G.DISC_CHAIN) {
      var d = G.DISC[id];
      if (!d || found(id) || s.hints[id] || !G.Disc.available(d)) continue;   // 앞 고리를 이미 찾았는데 단서가 없다 — 옛 저장, 또는 찾을 때 아직 개척 단계가 닫혀 있던 경우(무 제국 등)
      var last = d.need[d.need.length - 1];
      if (G.Disc.addHint(id, 'chain:' + last)) out.push({ icon: 'scroll', text: '「' + name(last) + '」의 기록을 다시 살피다가 실마리를 찾았다 — ' + G.chainLine(id) + ' (새 단서: 「' + d.name + '」)' });
    }
    // 하루 셈에서 이룬 업적(혼인처럼 발견·고용이 아닌 길): 알림을 띄우고, 장면은 다음 항구에서 (AC.playPending)
    // 옛 저장을 처음 불러온 날 한꺼번에 채워지는 업적은 알림만 — 장면이 줄줄이 뜨지 않게
    var st = store(), first = !st._init; st._init = 1;
    AC.check().forEach(function (a) {
      out.push({ icon: 'crown', text: '업적 「' + a.name + '」' + U.jx(a.name, '을/를') + ' 이루었다 — ' + rewardText(a) + (first ? '' : ' (다음 항구에서)') });
      if (!first) (s.achvPend = s.achvPend || []).push(a.id);
    });
    return out;
  };

  // 항구에 들어설 때 밀린 업적 장면 (city.js는 이 파일보다 뒤에 읽힌다 — 다 읽힌 뒤 잇는다)
  function hook() {
    var Cc = G.Scenes && G.Scenes.city; if (!Cc || !Cc.arrival || AC.hooked) return;
    AC.hooked = true;
    var oa = Cc.arrival;
    Cc.arrival = async function () {
      var r = await oa.apply(this, arguments);
      try { var s = S(); if (s && s.achvPend && s.achvPend.length) await announce([]); } catch (e) { console.error(e); }
      return r;
    };
  }
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else setTimeout(hook, 0); }

  AC.titles = function () { return AC.list().filter(function (a) { return a.title && AC.done(a.id); }).map(function (a) { return a.title; }); };

  // ---------------------------------------------------------------- 수첩 「업적」 쪽
  function stepHtml(id) {
    var d = G.DISC[id], s = S();
    if (!d) return '';
    if (found(id)) return '<span class="ch-s ok" title="' + U.esc(d.name) + '">✔ ' + U.esc(d.name) + '</span>';
    if (s.hints[id]) return '<span class="ch-s hint" title="단서가 있다">✎ ' + U.esc(d.name) + '</span>';
    if (G.Disc.needMet(d)) return '<span class="ch-s open">' + U.esc(d.name) + '</span>';
    return '<span class="ch-s lock" title="앞 고리를 찾아야 열린다">？？？</span>';
  }
  function itemHtml(id) {
    var d = G.DISC[id]; if (!d) return '';
    if (found(id)) return '<span class="ach-i ok">' + U.esc(d.name) + '</span>';
    if (d.need && !G.Disc.needMet(d) && !S().hints[id]) return '<span class="ach-i lock">？？？</span>';
    return '<span class="ach-i">' + U.esc(d.name) + '</span>';
  }
  /** 완성 업적: 그림·진행·남은 기록을 한 카드에 모은다. 실마리 없는 발견물의 이름은 감춘다. */
  function collectionHtml(list, st, my) {
    var cards = list.filter(function (a) { return !!a.collectionRule; });
    if (!cards.length) return '';
    var h = '<section class="ac-collections" aria-label="발견물 완성 업적"><h4 class="achv-h">세계 발견 대백과</h4>' +
      '<p class="ac-intro">직접 발견한 기록으로 완성하는 항해의 대백과. 그림을 펼치면 남은 기록을 볼 수 있다.</p>' +
      '<div class="ac-grid">';
    cards.forEach(function (a) {
      var p = AC.progress(a, my), row = p.rows[0], done = st[a.id], all = a.collectionRule === 'all';
      var kind = (G.DISC_COLLECTIONS || []).filter(function (x) { return x.id === a.collectionRule; })[0];
      var pct = p.need ? Math.floor(100 * p.have / p.need) : 0, key = 'achievement-events/' + a.id;
      var remaining = row.ids.filter(function (id) { return row.got.indexOf(id) < 0; });
      var known = remaining.filter(function (id) { var d = G.DISC[id], s = S(); return (s.hints && s.hints[id]) || (s.disc[id] && s.disc[id].found) || (d.need && G.Disc.needMet(d)); });
      h += '<details id="collection-' + a.collectionRule + '" class="ac-card' + (all ? ' ac-grand' : '') + (done ? ' ac-earned' : '') + '"><summary>' +
        '<div class="ac-art">' + (G.Img && G.Img.file(key) ? '<img src="' + U.esc(G.Img.src(key)) + '" alt="" loading="lazy">' : '') +
        '<span class="ac-stamp">' + (done ? '★ 완성' : pct + '% 기록') + '</span></div>' +
        '<div class="ac-body"><div class="ac-kind">' + U.esc(kind ? kind.name : a.collectionRule) + '</div>' +
        '<div class="ac-name">' + U.esc(a.name) + '</div>' +
        '<div class="ac-count"><b>' + U.num(p.have) + '</b><span> / ' + U.num(p.need) + ' 발견</span>' +
        '<span class="ac-open">남은 기록 펼치기</span></div>' +
        '<div class="achv-bar" role="progressbar" aria-label="' + U.esc(a.name) + ' 발견 진행" aria-valuemin="0" aria-valuemax="' + Math.max(1, p.need) + '" aria-valuenow="' + p.have + '"><i style="width:' + pct + '%"></i></div>' +
        '<div class="ac-prize">칭호 「' + U.esc(a.title) + '」 · 금화 ' + U.num(a.gold) + '닢</div></div></summary>' +
        '<div class="ac-detail"><p>' + U.esc(a.desc) + '</p><p class="muted">' + rewardText(a) + ' · 첫 달성 때 한 번 지급</p>';
      if (!p.need) h += '<p class="muted">아직 등록된 발견물이 없다.</p>';
      else if (!remaining.length) h += '<p class="ac-complete">이 갈래의 마지막 기록까지 모두 채웠다.</p>';
      else {
        h += '<b>남은 발견물 ' + U.num(remaining.length) + '가지</b>';
        if (known.length) h += '<div class="ac-missing">' + known.map(itemHtml).join(' ') + '</div>';
        var unknown = remaining.length - known.length;
        if (unknown) h += '<p class="muted">아직 실마리를 얻지 못한 발견물 ' + U.num(unknown) + '가지 · 책과 소문, 앞선 발견에서 단서를 찾자.</p>';
      }
      if (done) h += '<p class="ac-complete">달성한 칭호와 보상 기록은 이후 발견물이 늘어나도 남는다.</p>';
      h += '</div></details>';
    });
    return h + '</div><p class="ac-footnote">기본 7갈래에 동물·식물·전설·미신·종교·미술품을 더했다. 한 발견물이 여러 갈래에 들 수 있다. 경쟁자가 먼저 찾았어도 직접 발견해야 세며, 이후 시대에 열리는 발견물도 전체 수에 포함한다. 이야기 전용 발견물은 이야기 모드에서만 센다.</p></section>';
  }
  AC.page = function (el) {
    var list = AC.list(), st = store(), my = mine(), doneN = list.filter(function (a) { return st[a.id]; }).length;
    var titles = AC.titles(), chains = G.CHAINS || [];
    var h = '<div class="achv-page">' +
      '<div class="achv-top"><b>업적 ' + doneN + ' / ' + list.length + '</b> · 사슬 ' + AC.chainsDone().length + ' / ' + chains.length +
      (titles.length ? '<div class="achv-titles">' + titles.map(function (t) { return '<span class="tag good-text">' + U.esc(t) + '</span>'; }).join(' ') + '</div>' : '<div class="muted">명성을 쌓고 발견물·동료를 모으면 업적을 이루고 칭호를 얻는다.</div>') +
      '<div class="muted" style="font-size:14px">명성 업적은 달성 당시 기록을 남기며 금화·칭호를 한 번만 준다. 명성 하락·세대 승계 후에도 유지된다. 칭호에 추가 능력 효과는 없다.</div></div>';
    h += collectionHtml(list, st, my);
    // 사슬 지도
    h += '<h4 class="achv-h">꼬리에 꼬리를 무는 사슬</h4><div class="muted" style="font-size:14px;margin:-4px 0 6px">앞 고리를 찾으면 다음 고리의 단서가 풀린다. 열리기 전에는 그 자리에 가도 찾을 수 없다.</div>';
    chains.forEach(function (ch) {
      h += '<div class="hint-item ch-row"><div class="flex"><span class="nm">' + U.esc(ch.name) + '</span>' + (AC.chainDone(ch) ? '<span class="tag good-text">완성</span>' : '') + '</div><div class="ch-steps">' +
        '<span class="ch-root">' + ch.root.map(function (r) { return (found(r) ? '✔ ' : '') + U.esc(name(r)); }).join(' · ') + '</span> → ' +
        ch.ids.map(stepHtml).join(' → ') + '</div></div>';
    });
    // 갈래별 업적
    (G.ACHV_GROUPS || []).forEach(function (g) {
      if (g === '발견물 완성') return;
      var as = list.filter(function (a) { return a.group === g; }); if (!as.length) return;
      h += '<h4 class="achv-h">' + U.esc(g) + '</h4>';
      as.forEach(function (a) {
        var p = AC.progress(a, my), done = st[a.id];
        var pct = Math.round(100 * p.have / Math.max(1, p.need));
        h += '<div class="hint-item achv-row' + (done ? ' done' : '') + '"><div class="flex"><span class="nm">' + (done ? '★ ' : '') + U.esc(a.name) + '</span>' +
          (a.title ? '<span class="tag">' + U.esc(a.title) + '</span>' : '') +
          '<span class="right muted" style="font-size:14px">' + (done ? U.fmtDate({ y: Math.floor(done.d / 10000), m: Math.floor(done.d / 100) % 100, d: done.d % 100 }) + ' 달성' : p.have + ' / ' + p.need) + '</span></div>' +
          '<div class="tx">' + U.esc(a.desc) + ' <span class="muted">— ' + rewardText(a) + '</span></div>' +
          '<div class="achv-bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="achv-items">' + p.rows.map(function (r) {
            if (r.crew) return r.ids.map(function (id) { return '<span class="ach-i' + (r.got.indexOf(id) >= 0 ? ' ok' : '') + '">' + U.esc(mateName(id)) + '</span>'; }).join(' ');
            if (r.ids) return (r.n < r.ids.length ? '<span class="muted">' + r.n + '가지:</span> ' : '') + r.ids.map(itemHtml).join(' ');
            return '<span class="ach-i' + (r.count >= r.n ? ' ok' : '') + '">' + U.esc(r.label) + ' ' + Math.min(r.count, r.n) + '/' + r.n + '</span>';
          }).join(' <span class="muted">+</span> ') + '</div></div>';
      });
    });
    el.innerHTML = h + '</div>';
  };

  // 수첩 쪽 모양
  if (typeof document !== 'undefined' && !document.getElementById('achv-css')) {
    var css = document.createElement('style'); css.id = 'achv-css';
    css.textContent = '.achv-top{padding:6px 2px 10px;font-size:18px}.achv-titles{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px}' +
      '.achv-h{margin:16px 0 8px;font-size:19px;border-bottom:1px solid rgba(90,60,30,.25);padding-bottom:4px}' +
      '.achv-row.done .nm{color:#7a4f10}.achv-bar{height:6px;background:rgba(90,60,30,.15);border-radius:3px;margin:6px 0 4px;overflow:hidden}.achv-bar i{display:block;height:100%;background:linear-gradient(90deg,#b8862e,#e2b65a)}' +
      '.achv-items{font-size:14px;line-height:1.9}.ach-i{display:inline-block;padding:0 6px;margin:1px 2px;border-radius:4px;background:rgba(90,60,30,.08);color:rgba(60,40,20,.55)}.ach-i.ok{background:rgba(184,134,46,.22);color:#4a3008;font-weight:600}.ach-i.lock{letter-spacing:2px}' +
      '.ch-steps{font-size:14px;line-height:2}.ch-root{color:rgba(60,40,20,.75)}.ch-s{display:inline-block;padding:0 6px;border-radius:4px;background:rgba(90,60,30,.08)}.ch-s.ok{background:rgba(184,134,46,.25);font-weight:600}.ch-s.hint{background:rgba(40,110,170,.15)}.ch-s.lock{color:rgba(60,40,20,.4);letter-spacing:2px}' +
      '.achv-ribbon{position:absolute;left:0;right:0;top:0;height:54px;z-index:80;display:flex;gap:16px;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .35s;background:linear-gradient(180deg,#3a250d,#24170a);border-bottom:2px solid #b8862e;box-shadow:0 2px 10px rgba(0,0,0,.5);color:#f6e2a8;text-shadow:0 1px 2px #000;white-space:nowrap}' +
      '.achv-ribbon.on{opacity:1}.achv-ribbon .ar-k{font-size:15px;letter-spacing:.3em;color:#e2b65a}.achv-ribbon .ar-n{font-size:25px;font-weight:800}.achv-ribbon .ar-t{font-size:15px;color:#e8cf8a}' +
      '.achv-pop{text-align:center;padding:10px 6px}.achv-g{font-size:15px;color:#8a6a3a}.achv-n{font-size:30px;font-weight:800;margin:6px 0 10px}.achv-d{font-size:17px;line-height:1.6}.achv-r{margin-top:14px;font-size:16px;color:#7a4f10;font-weight:600}';
    css.textContent += '.ac-intro{margin:0 0 12px;color:#68533a;font-size:15px}.ac-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:13px}' +
      '.ac-card{min-width:0;border:1px solid #b29b71;border-radius:7px;overflow:hidden;background:rgba(255,251,237,.6)}.ac-card summary{cursor:pointer;list-style:none}.ac-card summary::-webkit-details-marker{display:none}.ac-card summary:focus-visible{outline:3px solid #337a99;outline-offset:-4px}.ac-card[open]{border-color:#8a6329}' +
      '.ac-art{position:relative;aspect-ratio:9/4;overflow:hidden;background:#2e352e}.ac-art img{width:100%;height:100%;object-fit:cover;display:block}.ac-stamp{position:absolute;right:10px;top:9px;padding:3px 9px;background:rgba(27,30,26,.86);color:#f8e7bd;border:1px solid #c4a665;border-radius:3px;font-size:13px}' +
      '.ac-body{padding:11px 13px 13px}.ac-kind{font-size:12px;color:#856b44;letter-spacing:.1em}.ac-name{font-size:20px;line-height:1.45;font-weight:800;margin:3px 0 9px;color:#3f2f19}.ac-count{display:flex;align-items:baseline;gap:4px;font-size:14px;color:#786b55}.ac-count b{font-size:24px;color:#644615;font-variant-numeric:tabular-nums}.ac-open{margin-left:auto;font-size:12px}.ac-card[open] .ac-open{font-size:0}.ac-card[open] .ac-open:after{content:"기록 접기";font-size:12px}' +
      '.ac-prize{font-size:12px;color:#7b633d;line-height:1.6}.ac-detail{padding:0 13px 13px;font-size:14px;border-top:1px solid rgba(100,70,25,.18)}.ac-detail p{margin:9px 0}.ac-missing{max-height:220px;overflow:auto;margin-top:8px;line-height:1.8}.ac-complete{color:#785314;font-weight:700}.ac-earned{border-color:#a17327;box-shadow:inset 0 0 0 1px rgba(190,145,60,.3)}.ac-earned .ac-stamp{background:#765014;color:#fff0b8}' +
      '.ac-grand{grid-column:1/-1;background:linear-gradient(120deg,#252d2c,#3d3020);border-color:#b9934e;color:#f5e7ce}.ac-grand summary{display:grid;grid-template-columns:1.3fr 1fr;align-items:center}.ac-grand .ac-art{height:100%;min-height:210px}.ac-grand .ac-body{padding:20px}.ac-grand .ac-name{font-size:30px;color:#f7e4b2}.ac-grand .ac-kind,.ac-grand .ac-count,.ac-grand .ac-prize,.ac-grand .muted{color:#d3c3a6}.ac-grand .ac-count b{color:#f1cb78;font-size:32px}.ac-grand .achv-bar{background:#191f1d;height:8px}.ac-grand .ac-detail{border-color:#826b45}.ac-grand .ac-complete{color:#efd092}.ac-grand .ach-i{color:#dccbaa;background:#51482f}.ac-footnote{font-size:12px;line-height:1.7;color:#827052;margin:12px 0 20px}@media(max-width:700px){.ac-grand summary{grid-template-columns:1fr}.ac-grand .ac-art{min-height:0}.ac-grand .ac-name{font-size:25px}}';
    document.head.appendChild(css);
  }
})(window.G = window.G || {});
