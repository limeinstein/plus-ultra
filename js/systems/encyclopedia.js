/* 발견물 백과사전 (G.Encyc) — 자택에 놓인 책. 2026-10-26 사용자 요청 「발견물 단위로 백과사전을 만들어 자택에 배치」
   · 실리는 것: 제독(과 선대 제독)이 찾은 발견물만 — 한 항목에 그림 · 이름(옛 이름) · 갈래 · 지역 · 찾은 날 · 보고/발표 · 손에 넣은 유물 ·
     설명 · 동료들의 특기별 관찰(G.DISC_FACTS — js/systems/discvoice.js와 같은 글)
   · 갈래(지리·자연·유적·보물·생물·민족·교역품)마다 찾은 수 / 전체 수. 한 갈래를 다 채우면(이야기 모드 전용 발견물은 빼고 센다) 왕립 학회가 보상한다:
     명성(그 갈래의 명성 — 교역품은 교역, 민족은 사교, 나머지는 탐험) + 금화. 발견하는 순간 확인한다 (js/systems/discovery.js D.find → G.Encyc.onFind)
   · 자택에 사는 6살 넘은 아이와 한 항목을 함께 읽을 수 있다 — 아이마다 kidGap일에 한 번: 사이 +, 지력 + (가끔), 그 갈래에 맞는 특기 1단계(2까지)
   · 자택 메뉴 「발견물 백과사전」 (js/city/misc.js HM.menu)
   · 저장: s.encyc = { done: {갈래: 해}, last: 마지막으로 본 발견 id } · 아이 k.edu['encyc'] = 날번호 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var EN = G.Encyc = {};
  function S() { return G.Game && G.Game.state; }
  function K() { var b = (G.BALANCE && G.BALANCE.encyc) || {}; return { kidGap: b.kidGap == null ? 30 : b.kidGap, famePer: b.famePer == null ? 20 : b.famePer, goldPer: b.goldPer == null ? 120 : b.goldPer }; }
  EN.K = K;
  function st() { var s = S(); return s.encyc || (s.encyc = { done: {} }); }
  var CATS = ['geo', 'nature', 'ruin', 'treasure', 'creature', 'people', 'trade'];
  EN.CATS = CATS;
  function catName(c) { return (G.DISC_CATS && G.DISC_CATS[c]) || c; }
  var CAT_FAME = { trade: 'tr', people: 'so' };
  // 아이와 읽을 때 배우는 특기
  var CAT_SK = { geo: 'survey', nature: 'sci', ruin: 'hist', treasure: 'craft', creature: 'sci', people: 'speech', trade: 'acct' };

  // ---------------------------------------------------------------- 무엇이 실리나
  function counted(d) { return !d.tale; }                    // 이야기 모드 전용 발견물은 전체 수에서 뺀다
  EN.found = function (cat) {
    return G.DISCOVERIES.filter(function (d) { return (!cat || d.cat === cat) && G.Disc.foundByMe(d.id); });
  };
  EN.total = function (cat) { return G.DISCOVERIES.filter(function (d) { return (!cat || d.cat === cat) && counted(d); }).length; };
  EN.foundCounted = function (cat) { return EN.found(cat).filter(counted).length; };
  EN.complete = function (cat) { var t = EN.total(cat); return t > 0 && EN.foundCounted(cat) >= t; };

  // ---------------------------------------------------------------- 갈래를 다 채우면
  EN.reward = function (cat) { var t = EN.total(cat), k = K(); return { fame: t * k.famePer, gold: t * k.goldPer, fk: CAT_FAME[cat] || 'ex' }; };
  /** 발견한 순간 (D.find) — 그 갈래를 다 채웠으면 보상 */
  EN.onFind = function (d) {
    var s = S(); if (!s || !d) return null;
    var c = st(); if (c.done[d.cat] || !EN.complete(d.cat)) return null;
    var rw = EN.reward(d.cat);
    c.done[d.cat] = s.date.y;
    s.player.gold += rw.gold;
    var fame = G.Fame ? G.Fame.add(rw.fk, rw.fame) : rw.fame;
    var nm = catName(d.cat);
    G.State.log('발견물 백과사전 「' + nm + '」 편을 모두 채웠다 — 왕립 학회의 포상 (금화 ' + U.num(rw.gold) + ', 명성 +' + fame + ')');
    setTimeout(function () { UI.toast('백과사전 「' + nm + '」 편 완성! ' + EN.total(d.cat) + '종을 모두 실었다 — 왕립 학회가 금화 ' + U.num(rw.gold) + '닢과 명성 +' + fame + '을 내렸다.', 'book', 7000); }, 1500);
    if (G.Game.refreshHud) G.Game.refreshHud();
    return { cat: d.cat, gold: rw.gold, fame: fame };
  };

  // ---------------------------------------------------------------- 한 항목
  function discPic(d) { var k = G.Img && G.Img.pick ? G.Img.pick(G.Img.chain.discovery(d)) : null; return k ? G.Img.src(k) : null; }
  function regName(d) { return G.Disc.regName ? G.Disc.regName(d) : (d.reg != null && G.REGIONS[d.reg]) || ''; }
  function skName(id) { var x = (G.SKILLS || []).filter(function (k) { return k.id === id; })[0]; return x ? x.name : id; }
  function dateOf(n) { return n ? U.fmtDate({ y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }) : ''; }
  function status(x) {
    if (!x) return '';
    if (x.reported) return '후원자에게 보고함';
    if (x.announced) return '항구에서 발표함';
    if (x.rival) return '경쟁자가 먼저 발표';
    return '아직 알리지 않음';
  }
  EN.entryHtml = function (d) {
    var x = S().disc[d.id] || {}, pic = discPic(d), facts = (G.DISC_FACTS && G.DISC_FACTS[d.id]) || [];
    var relics = (x.relics || []).map(function (id) { return G.RELIC && G.RELIC[id] ? G.RELIC[id].name : null; }).filter(Boolean);
    var h = '<div class="en-pic">' + (pic ? '<img alt="" src="' + pic + '">' : G.icon('book')) + '</div>' +
      '<div class="en-name">' + U.esc(d.name) + (d.oldName ? ' <span class="muted">(옛 이름 「' + U.esc(d.oldName) + '」)</span>' : '') + '</div>' +
      '<div class="en-meta"><span class="tag">' + U.esc(catName(d.cat)) + '</span> ' + U.esc(regName(d)) +
      (x.found ? ' · ' + U.esc(dateOf(x.found)) + ' 발견' : '') + (x.mirage ? ' · 신기루로 봄' : '') + ' · ' + U.esc(status(x)) + '</div>' +
      '<div class="en-desc">' + U.esc(d.desc || '') + '</div>' +
      (relics.length ? '<div class="en-sub"><b>손에 넣은 것</b> — ' + relics.map(U.esc).join(' · ') + '</div>' : '') +
      (facts.length ? '<div class="en-sub"><b>동료들의 관찰</b></div><ul class="en-facts">' + facts.map(function (f) {
        return '<li><span class="en-sk">' + U.esc(skName(f[0])) + '</span> ' + U.esc(f[1]) + '</li>';
      }).join('') + '</ul>' : '');
    return h;
  };

  // ---------------------------------------------------------------- 아이와 함께 읽는다
  function kidsHere() {
    var s = S(), gap = K().kidGap;
    if (!G.HomeLife || !G.HomeLife.kidsHome) return [];
    return G.HomeLife.kidsHome().filter(function (k) { return G.Family.kidAge(k) >= 6; }).map(function (k) {
      var last = k.edu && k.edu.encyc; return { k: k, wait: last != null && s.day - last < gap ? gap - (s.day - last) : 0 };
    });
  }
  EN.kidsHere = kidsHere;
  /** 아이와 한 항목을 함께 읽는다 → 알림 글 */
  EN.readWith = async function (k, d) {
    var s = S(), F = G.Family, age = F.kidAge(k), sp = G.HomeLife.speaker(k, true), sk = CAT_SK[d.cat] || 'hist';
    if (!k.edu) k.edu = {}; k.edu.encyc = s.day;
    if (!k.sk) k.sk = {}; if (!k.st) k.st = { str: 55, int: 55, mar: 55, cha: 55 };
    var b = F.bond(k);
    await UI.say('난롯가에 백과사전을 펴고 ' + k.name + U.jx(k.name, '과/와') + ' 「' + d.name + '」 항목을 함께 읽었다.', {});
    await UI.say(b < 30 ? '……(처음엔 시큰둥하더니, 그림이 나오자 슬그머니 고개를 내민다)' : age < 10
      ? U.pick(['아빠가 이걸 진짜로 봤어요? 정말요?', '이 그림 진짜예요? 나도 크면 보러 갈래요!', '여기 이건 뭐예요? 또 읽어 줘요!'])
      : U.pick(['「' + d.name + '」… 아버지 일지에 적힌 날짜랑 똑같네요. 그날 어떠셨어요?', '이 관찰은 누가 적은 거예요? 저도 언젠가 이런 걸 적고 싶어요.', '다음 항해에 저도 데려가 주세요. 이 책에 한 줄 보태고 싶어요.']), sp);
    var out = [];
    var bd = F.addBond(k, 3); out.push('사이 +3');
    if (U.chance(0.5)) { k.st.int = Math.min(90, (k.st.int || 55) + 1); out.push('지력 +1'); }
    if ((k.sk[sk] || 0) < 2 && U.chance(0.35)) { k.sk[sk] = (k.sk[sk] || 0) + 1; out.push(skName(sk) + ' ' + k.sk[sk]); }
    if (G.HomeLife.touch) { try { k.touch = (k.touch || 0) + 1; } catch (e) { /* */ } }
    G.State.log(k.name + U.jx(k.name, '과/와') + ' 백과사전의 「' + d.name + '」 항목을 함께 읽었다.');
    var note = k.name + ' — ' + out.join(' · ');
    UI.toast(note, 'book', 4200);
    return note;
  };

  // ---------------------------------------------------------------- 책을 펼친다 (자택)
  EN.menuItem = function (c) {
    var n = EN.found().length;
    return { label: '발견물 백과사전', icon: 'book', sub: n ? n + '종 수록' + (Object.keys(st().done).length ? ' · 완성 ' + Object.keys(st().done).length + '편' : '') : '아직 실린 것이 없다', onClick: function () { return EN.open(c); } };
  };
  EN.open = async function (c, opt) {
    var cur = { cat: (opt && opt.cat) || null, id: (opt && opt.id) || st().last || null, q: '' };
    for (;;) {
      var r = await EN.show(cur);
      if (!r || r.close) return;
      if (r.read) {
        cur = { cat: r.cat, id: r.d.id, q: r.q || '' };
        await EN.readWith(r.k, r.d);
      }
    }
  };
  /** 창 하나 → {close} 또는 {read, k, d, cat, q} */
  EN.show = function (cur) {
    var s = S();
    if (!EN.found().length) return UI.say('백과사전은 아직 백지다. 새로운 곳·짐승·보물을 찾아내면 그 항목이 한 장씩 채워진다.', {}).then(function () { return { close: true }; });
    var all = EN.found();
    if (cur.cat && !all.some(function (d) { return d.cat === cur.cat; })) cur.cat = null;
    var tabs = '<div class="en-tabs"><button class="en-tab" data-cat="">전체 <small>' + all.length + '</small></button>' + CATS.map(function (k) {
      var f = EN.foundCounted(k), t = EN.total(k), done = st().done[k];
      return '<button class="en-tab' + (done ? ' done' : '') + '" data-cat="' + k + '">' + U.esc(catName(k)) + ' <small>' + f + '/' + t + (done ? ' ✓' : '') + '</small></button>';
    }).join('') + '</div>';
    var html = '<div class="en-head muted">' + U.esc(s.player.name) + ' 가문이 찾아 기록한 발견물 ' + all.length + '종 · 갈래를 모두 채우면 왕립 학회가 포상한다</div>' + tabs +
      '<div class="en-body"><div class="en-left"><input class="en-q" type="text" placeholder="이름으로 찾기" value="' + U.esc(cur.q || '') + '"><div class="en-list"></div></div><div class="en-right"></div></div>';
    var win = UI.window({ title: '발견물 백과사전', icon: 'book', width: 1180, html: html, clickAny: false, buttons: [{ label: '덮는다', value: { close: true }, cls: 'navy' }] });
    var el = win.content, list = el.querySelector('.en-list'), right = el.querySelector('.en-right'), q = el.querySelector('.en-q');
    function items() {
      var t = (cur.q || '').trim();
      return all.filter(function (d) { return (!cur.cat || d.cat === cur.cat) && (!t || d.name.indexOf(t) >= 0 || (d.oldName && d.oldName.indexOf(t) >= 0)); })
        .sort(function (a, b) { return ((S().disc[b.id] || {}).found || 0) - ((S().disc[a.id] || {}).found || 0); });
    }
    function drawList() {
      var xs = items();
      list.innerHTML = xs.length ? xs.map(function (d) {
        var pic = discPic(d);
        return '<div class="en-row' + (d.id === cur.id ? ' on' : '') + '" data-id="' + d.id + '">' + (pic ? '<img alt="" src="' + pic + '">' : '<span class="en-noimg">' + G.icon('book') + '</span>') +
          '<div><div class="en-rn">' + U.esc(d.name) + '</div><div class="en-rm">' + U.esc(catName(d.cat)) + ' · ' + U.esc(regName(d)) + '</div></div></div>';
      }).join('') : '<div class="muted" style="padding:10px">찾는 항목이 없다.</div>';
      Array.prototype.forEach.call(list.querySelectorAll('.en-row'), function (row) { row.onclick = function () { cur.id = row.getAttribute('data-id'); drawList(); drawEntry(); }; });
      el.querySelectorAll('.en-tab').forEach(function (b) { b.classList.toggle('on', (b.getAttribute('data-cat') || null) === (cur.cat || null)); });
    }
    function drawEntry() {
      var xs = items(), d = G.DISC[cur.id];
      if (!d || xs.indexOf(d) < 0) d = xs[0];
      if (!d) { right.innerHTML = ''; return; }
      cur.id = d.id; st().last = d.id;
      var kids = kidsHere();
      right.innerHTML = EN.entryHtml(d) + (kids.length ? '<div class="en-kids">' + kids.map(function (x, i) {
        return '<button class="en-kid" data-i="' + i + '"' + (x.wait ? ' disabled' : '') + '>' + G.icon('heart') + ' ' + U.esc(x.k.name) + U.jx(x.k.name, '과/와') + ' 함께 읽는다' + (x.wait ? ' <small>(' + x.wait + '일 뒤)</small>' : '') + '</button>';
      }).join('') + '</div>' : '');
      right.scrollTop = 0;
      Array.prototype.forEach.call(right.querySelectorAll('.en-kid'), function (b) {
        b.onclick = function () { var x = kids[+b.getAttribute('data-i')]; if (x && !x.wait) win.close({ read: true, k: x.k, d: d, cat: cur.cat, q: cur.q }); };
      });
    }
    el.querySelectorAll('.en-tab').forEach(function (b) { b.onclick = function () { cur.cat = b.getAttribute('data-cat') || null; drawList(); drawEntry(); }; });
    q.oninput = function () { cur.q = q.value; drawList(); drawEntry(); };
    q.onkeydown = function (e) { e.stopPropagation(); };
    drawList(); drawEntry();
    var on = list.querySelector('.en-row.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
    return win.result;
  };
})(window.G = window.G || {});
