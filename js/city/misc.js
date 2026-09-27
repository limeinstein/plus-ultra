/* 여관, 시장, 교회, 도서관, 조합, 성문, 자택 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art, C = G.Scenes.city;
  function S() { return G.Game.state; }

  // ================================================================ 여관 (inn)
  var INN = { title: '여관', icon: 'bed', paint: 'inn', exitLabel: '여관을 나온다' };
  C.B.inn = INN;
  function innWife() { return C.npc('innkeeper', G.Img.npcGender('innkeeper', C.city()) === 'm' ? '여관 주인' : '여관 안주인'); }
  INN.enter = async function (c) { await C.say(innWife(), U.pick(['어서 오세요. 쉬어 가실래요?', '어서 오세요. 방은 깨끗하게 치워 두었어요.', '먼 길 오셨네요. 푹 쉬고 가세요.'])); };
  INN.sub = function (c) { return '하룻밤 금화 ' + R.innCost(c) + '닢'; };
  INN.menu = function (c) {
    return [
      { label: '숙박', icon: 'bed', onClick: function () { return INN.stay(c); } },
      { label: '항해사를 찾는다', icon: 'people', sub: (function () { var n = C.B.tavern.candidates(c).length; return n ? n + '명' : '없다'; })(), onClick: function () { return C.B.tavern.hire(c, innWife()); } },
      { label: '부하편성', icon: 'people', sub: S().mates.length + '/' + G.MAX_MATES, onClick: function () { return C.B.tavern.organize(); } },
      { label: '허드렛일', icon: 'tools', onClick: function () { return INN.work(c); } },
      { label: '기능', icon: 'gear', sub: INN.canSave(c) ? '저장 가능' : '', onClick: function () { return INN.func(c); } }
    ];
  };
  INN.canSave = function (c) { var d = S().settings.diff; return d !== 'original' || R.isHomeNation(c); };
  INN.stay = async function (c) {
    var s = S(), cost = R.innCost(c);
    var n = await UI.number({ title: '숙박', text: '선불이에요. 하룻밤에 금화 ' + cost + '닢인데, 며칠 묵으시겠어요?', min: 1, max: 60, value: 1, unit: '박',
      quick: [{ label: '1박', value: 1 }, { label: '7박', value: 7 }, { label: '30박', value: 30 }], info: function (d) { return '비용 금화 ' + U.num(d * cost) + '닢'; } });
    if (!n) return;
    if (s.player.gold < n * cost) { await C.say(innWife(), '소지금이 모자라시네요.'); return; }
    s.player.gold -= n * cost;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n); });
    s.fleet.fatigue = 0; s.player.hp = Math.min(100, s.player.hp + 30 * n);
    msgs.filter(function (m) { return !m.history; }).forEach(function (m) { UI.toast(m.text, m.icon); });
    var news = msgs.filter(function (m) { return m.history; }); if (news.length) await C.news(news);
    G.Game.refreshHud();
    await UI.say('피로가 풀렸다! 체력이 회복됐다!\n(' + U.fmtDate(s.date) + ')', {});
    if (G.Family && G.Family.innEvent) await G.Family.innEvent(c);
  };
  INN.work = async function (c) {
    var s = S(), w = innWife();
    var v = await C.ask(w, '일손이 필요하긴 해요. 열흘 동안 부엌일과 장작 패기를 해 주시면 품삯을 드릴게요.', [{ label: '일한다 (10일)', value: 10 }, { label: '한 달 일한다 (30일)', value: 30 }, { label: '그만둔다', value: 0 }]);
    if (!v) return;
    var pay = Math.round(v * (8 + c.size * 4) * (0.8 + R.stat('str') / 150));
    await UI.fade(function () { G.Game.passDays(v); });
    s.player.gold += pay; s.fleet.fatigue = Math.max(0, s.fleet.fatigue - 20);
    await C.say(w, '수고하셨어요. 이게 약속한 돈이에요. (금화 ' + U.num(pay) + '닢)\f바다의 사나이가 이런 일까지 하시다니... 힘내세요!');
  };
  INN.func = async function (c) {
    var v = await UI.choose('기능', [
      { label: '항해 일지 기록 (저장)', value: 'save', icon: 'save', disabled: !INN.canSave(c), right: INN.canSave(c) ? '' : '모국의 여관에서만' },
      { label: '항해 일지 불러오기', value: 'load', icon: 'book' },
      { label: '항해 수첩 · 설정', value: 'menu', icon: 'gear' }
    ], { width: 520 });
    if (v === 'save') await G.Info.saveMenu();
    else if (v === 'load') await G.Scenes.title.loadMenu();
    else if (v === 'menu') await G.Info.open('menu');
  };

  // ================================================================ 시장 (item market)
  var MK = { title: '시장', icon: 'sack', paint: 'market', exitLabel: '시장을 나온다' };
  C.B.market = MK;
  function vendor() { return C.npc('vendor', '상인'); }
  MK.stock = function (c) {
    var s = S(), rng = U.makeRng(c.id * 7717 + Math.floor(s.day / 45));
    // 라임 절임은 파는 고장이면 늘 있다 (긴 항해의 목숨줄)
    return G.ITEMS.filter(function (it) { return it.price > 0 && !it.rare && it.reg.indexOf(c.region) >= 0 && (!it.from || s.date.y >= it.from); }).filter(function (it) { return rng() < 0.7 || it.id === 'lime'; });
  };
  MK.enter = async function (c) { await C.say(vendor(), U.pick(['자네, 보는 눈이 있군. 좋은 물건이 많다네.', '구경하고 가게! 먼 나라에서 온 물건도 있다네.', '팔고 싶은 물건이 있으면 어디 보여주게!'])); };
  MK.sub = function () { return '무기·도구·장신구'; };
  MK.menu = function (c) {
    return [
      { label: '구입', icon: 'coin', onClick: function () { return MK.buy(c); } },
      { label: '매각', icon: 'sack', onClick: function () { return MK.sell(c); } },
      { label: '소지품', icon: 'chest', sub: S().player.items.length + '/30', onClick: function () { return G.Info.open('items'); } }
    ];
  };
  MK.buy = async function (c) {
    var s = S();
    for (;;) {
      var st = MK.stock(c);
      if (!st.length) { await C.say(vendor(), '미안하네, 지금 물건이 떨어지고 없네.'); return; }
      var v = await UI.choose('구입 아이템 선택 — 소지금 ' + U.num(s.player.gold) + '닢', st.map(function (it) {
        var ex = it.kind === 'weapon' ? '공격 ' + it.atk : it.kind === 'armor' ? '방어 ' + it.def : G.ITEM_KIND[it.kind];
        return { label: it.name + ' <small class="muted">' + ex + '</small>', right: U.num(it.price) + '닢', value: it.id, desc: it.desc, icon: it.kind === 'weapon' ? 'sword' : it.kind === 'armor' ? 'shield' : it.kind === 'gift' ? 'heart' : 'compass', disabled: it.price > s.player.gold };
      }), { width: 700 });
      if (!v) return;
      var it = G.ITEM[v];
      if (s.player.items.length >= 30) { await C.mate('이 이상 가질 수 없습니다!'); return; }
      if (!(await UI.confirm(it.name + '<br><span class="muted">' + it.desc + '</span><br>금화 ' + U.num(it.price) + '닢에 사겠습니까?', '산다', '그만둔다'))) continue;
      s.player.gold -= it.price; R.addItem(v);
      if ((it.kind === 'weapon' && (!s.player.equip.weapon || G.ITEM[s.player.equip.weapon].atk < it.atk)) || (it.kind === 'armor' && (!s.player.equip.armor || G.ITEM[s.player.equip.armor].def < it.def))) {
        if (await UI.confirm(it.name + U.j(it.name, '을/를').slice(it.name.length) + ' 바로 장비하겠습니까?')) s.player.equip[it.kind] = v;
      }
      await C.say(vendor(), '고맙네!');
    }
  };
  MK.sell = async function (c) {
    var s = S();
    for (;;) {
      var list = s.player.items.map(function (it, i) { return { it: it, i: i }; }).filter(function (x) { var d = G.ITEM[x.it.id]; return !(x.it.evidence); });
      if (!list.length) { await C.say(vendor(), '응? 도대체 무엇을 팔겠다는 건가?'); return; }
      var v = await UI.choose('매각', list.map(function (x, k) {
        var d = G.ITEM[x.it.id] || {}, val = itemValue(x.it);
        var eq = s.player.equip.weapon === x.it.id || s.player.equip.armor === x.it.id;
        return { label: R.itemName(x.it) + (eq ? ' <span class="tag">장비 중</span>' : ''), right: U.num(val) + '닢', value: k, icon: 'coin' };
      }), { width: 640, text: '팔고 싶은 물건이 있으면 어디 보여주게!' });
      if (v == null) return;
      var x = list[v], val = itemValue(x.it);
      await C.say(vendor(), '으~음. 금화 ' + U.num(val) + '닢이란 말이군.');
      if (!(await UI.confirm(R.itemName(x.it) + U.j(R.itemName(x.it), '을/를').slice(R.itemName(x.it).length) + ' 금화 ' + U.num(val) + '닢에 팔겠습니까?', '판다', '그만둔다'))) continue;
      var id = x.it.id;
      s.player.items.splice(x.i, 1); s.player.gold += val;
      if (s.player.equip.weapon === id && !R.hasItem(id)) s.player.equip.weapon = null;
      if (s.player.equip.armor === id && !R.hasItem(id)) s.player.equip.armor = null;
    }
  };
  function itemValue(it) { if (it.value) return it.value; var d = G.ITEM[it.id]; return d ? Math.floor((d.price || 500) * (d.rare ? 1 : 0.5)) : 100; }

  // ================================================================ 교회 / 모스크 / 사원
  var CH = { icon: 'church', paint: 'church' };
  CH.title = function (c) { return R.churchName(c); };
  CH.exitLabel = '밖으로 나온다';
  C.B.church = CH;
  function priest(c) {
    var g = G.Img.npcGender('priest', c);
    var t = c.rel === 'I' ? '이맘' : c.rel === 'C' || c.rel === 'O' ? (g === 'f' ? '수녀' : '신부') : '승려';
    return C.npc('priest', t);
  }
  CH.enter = async function (c) {
    var s = S(), christian = c.rel === 'C' || c.rel === 'O';
    await C.say(priest(c), christian ? U.pick(['어서 오시오, 길 잃은 어린 양이여.', '신의 가호가 함께하기를.']) : c.rel === 'I' ? U.pick(['평화가 함께하기를. 이방인이여, 무슨 일이오?', '알라의 집에 오신 것을 환영하오.']) : U.pick(['먼 곳에서 온 손님이군요. 편히 쉬었다 가시오.', '모든 생명에 자비가 있기를.']));
    C.current().prayed = false;
  };
  CH.sub = function (c) { return C.relName(c); };
  CH.menu = function (c) {
    return [
      { label: '기부', icon: 'coin', onClick: function () { return CH.donate(c); } },
      { label: '기도', icon: 'pray', dim: C.current() && C.current().prayed, onClick: function () { return CH.pray(c); } },
      { label: '치료를 부탁한다', icon: 'heart', sub: S().player.hp < 100 ? '건강 ' + Math.round(S().player.hp) : '', onClick: function () { return CH.heal(c); } }
    ];
  };
  CH.donate = async function (c) {
    var s = S();
    var n = await UI.number({ title: '기부', text: '얼마를 기부하시겠습니까? 악명이 줄고 세상의 평판이 오릅니다.', min: 0, max: s.player.gold, value: Math.min(s.player.gold, 500), unit: '닢', quick: [{ label: '100닢', value: Math.min(100, s.player.gold) }, { label: '1,000닢', value: Math.min(1000, s.player.gold) }, { label: '10,000닢', value: Math.min(10000, s.player.gold) }] });
    if (!n) return;
    s.player.gold -= n;
    var dn = Math.floor(n / 200); s.player.notoriety = Math.max(0, s.player.notoriety - dn);
    var fame = Math.floor(n / 1000) * (R.skill('theo') + 1);
    s.player.fame += fame;
    await C.say(priest(c), '당신의 선행은 반드시 보답받을 것이오.' + (fame ? '\n(명성 +' + fame + ')' : '') + (dn ? ' (악명 -' + dn + ')' : ''));
  };
  CH.pray = async function (c) {
    var s = S(), cur = C.current();
    cur.prayed = true;
    s.flags.blessed = s.day + 120;      // 넉 달 동안 폭풍을 덜 만난다 (sea.js blessed)
    await UI.say('항해의 무사를 빌었다. 마음이 편안해진다. (넉 달 동안 폭풍을 조금 덜 만난다)', {});
    if (R.skill('theo') >= 1) { s.fleet.discipline = Math.min(100, s.fleet.discipline + 5); UI.toast('함께 기도한 선원들의 마음이 하나가 되었다. (규율 +5)', 'pray'); }
  };
  CH.heal = async function (c) {
    var s = S(), p = s.player;
    var need = 100 - p.hp, sick = s.fleet.sick || 0;
    if (need <= 0 && !sick) { await C.say(priest(c), '당신은 건강해 보이는군요.'); return; }
    var cost = Math.round(need * 6 + sick * 15);
    if (!(await UI.confirm('치료비로 금화 ' + U.num(cost) + '닢을 헌금하겠습니까?', '헌금한다', '그만둔다'))) return;
    if (p.gold < cost) { UI.toast('소지금이 모자랍니다.', 'coin'); return; }
    p.gold -= cost; p.hp = 100; s.fleet.sick = 0;
    await C.say(priest(c), '신의 은총으로 병이 나았소. 몸조심하시오.');
  };

  // ================================================================ 도서관 (library)
  var LB = { title: '도서관', icon: 'book', paint: 'library', exitLabel: '도서관을 나온다' };
  C.B.library = LB;
  function librarian(c) { return C.npc('librarian', '사서'); }
  /** 이 도시 도서관에 지금 꽂혀 있는 책 (이미 간행된 것만) */
  LB.books = function (c) { var y = S().date.y; return G.BOOKS.filter(function (b) { return b.libs.indexOf(c.id) >= 0 && (b.y || 0) <= y; }); };
  /** 학문서를 풀어 줄 수 있는 자리 */
  function whoKnows(sk) { var r = G.ROLE_SKILLS; return r.surveyor.indexOf(sk) >= 0 ? '측량사' : r.nav.indexOf(sk) >= 0 ? '항해사' : '부관'; }
  LB.whoKnows = whoKnows;
  /** 이 책을 지금 읽으면: 언어 수준, 학문 조건, 단서 상태(새 것·이미 앎·아직 이해 못 함) */
  LB.status = function (b) {
    var s = S(), lv = R.lang(b.lang), need = b.sk ? (b.lv || 1) : 0, have = b.sk ? R.skill(b.sk) : 0;
    var fresh = 0, known = 0, later = 0;
    b.discs.forEach(function (id) {
      if (!G.DISC[id]) return;
      if (s.hints[id] || G.Disc.foundByMe(id)) known++;
      else if (G.Disc.available(G.DISC[id])) fresh++;
      else later++;
    });
    return { lang: lv, need: need, have: have, skOK: have >= need, fresh: fresh, known: known, later: later };
  };
  LB.enter = async function (c) { await C.say(librarian(c), U.pick(['책을 찾고 계십니까?', '조용히 해 주십시오. 여기는 도서관입니다.', '무슨 책을 찾고 계십니까?'])); };
  LB.sub = function (c) { return '장서 ' + LB.books(c).length + '권'; };
  LB.menu = function (c) {
    return [
      { label: '열람', icon: 'book', sub: '서가에서 책을 고른다', onClick: function () { return LB.shelf ? LB.shelf(c) : LB.read(c); } },
      { label: '검색', icon: 'eye', onClick: function () { return LB.search(c); } }
    ];
  };
  LB.read = async function (c) {
    var s = S(), books = LB.books(c);
    if (!books.length) { await C.say(librarian(c), '안됐습니다만, 읽으실 만한 책이 없습니다.'); return; }
    var v = await UI.choose('서적 선택', books.map(function (b) {
      var st = LB.status(b), skName = b.sk ? G.SKILL_BY_ID[b.sk].name : '';
      var need = b.sk ? ' · ' + skName + ' ' + st.need + (st.skOK ? ' ✓' : ' ✗') : '';
      var desc = !st.lang ? G.LANGS[b.lang] + '를 읽을 사람이 없다 (통역·부관)' :
        !st.skOK ? skName + U.jx(skName, '을/를') + ' 아는 사람(제독·' + whoKnows(b.sk) + ')이 있어야 뜻을 풀 수 있다' :
        st.fresh ? '새 단서가 있을지도 모른다' : st.later ? '아직은 알아듣기 어려운 이야기가 남아 있다 — 세상을 더 알게 되면 다시 읽어 보자' : st.known ? '이미 아는 이야기뿐이다' : '';
      return { label: b.title, right: G.LANGS[b.lang] + ' ' + C.langPips(st.lang) + need + (s.flags['read_' + b.id] ? ' · 읽음' : ''), value: b.id, icon: 'book', disabled: false, desc: desc };
    }), { width: 860, text: '책을 읽는 데 하루가 걸립니다. 그 책의 말을 읽을 수 있어야 하고(제독·부관·통역), 학문서는 그 학문을 아는 사람(제독, 또는 그 학문을 맡는 자리의 동료)이 있어야 뜻을 풉니다.' });
    if (!v) return;
    var b = G.BOOKS.filter(function (x) { return x.id === v; })[0], lv = R.lang(b.lang);
    await C.say(librarian(c), '오래 기다리셨습니다. 이 책입니다.');
    if (lv === 0) { await UI.say('「' + b.title + '」\n…전혀 읽을 수 없는 글자다. ' + G.LANGS[b.lang] + '를 아는 사람이 있으면 좋을 텐데.', {}); return; }
    G.Game.passDays(1); G.Game.refreshHud();
    s.flags['read_' + b.id] = 1;
    // 학문: 글자는 읽어도 뜻을 풀 사람이 없으면 단서가 되지 않는다
    if (b.sk && R.skill(b.sk) < (b.lv || 1)) {
      var skn = G.SKILL_BY_ID[b.sk].name;
      await UI.say('「' + b.title + '」' + U.jx(b.title, '을/를') + ' 펼쳤다.\n글자는 읽을 수 있지만, ' + skn + U.jx(skn, '을/를') + ' 아는 사람이 없어 무슨 뜻인지 풀지 못했다.\n(' + skn + ' ' + (b.lv || 1) + '단계 필요 — 제독이 배우거나, ' + whoKnows(b.sk) + ' 자리에 그 학문을 아는 동료를 두면 된다)', {});
      return;
    }
    var got = [];
    var discs = b.discs.filter(function (id) { return G.DISC[id]; });
    var readable = lv >= 3 ? discs.length : lv === 2 ? Math.ceil(discs.length * 0.7) : Math.ceil(discs.length * 0.35);
    var rng = U.makeRng(U.strHash(b.id + s.seed));
    var order = discs.slice().sort(function () { return rng() - 0.5; }).slice(0, readable);
    order.forEach(function (id) { if (G.Disc.addHint(id, 'book:' + b.id)) got.push(G.DISC[id]); });
    // 열람 결과를 나누어 알려 준다: 새 단서 / 이미 앎 / 아직 이해 못 함(개척 단계) / 말이 서툴러 놓침
    var later = order.filter(function (id) { return !s.hints[id] && !G.Disc.foundByMe(id) && !G.Disc.available(G.DISC[id]); }).length;
    var knownN = order.filter(function (id) { return got.indexOf(G.DISC[id]) < 0 && (s.hints[id] || G.Disc.foundByMe(id)); }).length;
    var missed = discs.length - order.length;
    var laterTxt = later ? '먼 나라 이야기라 아직 알아듣기 어려운 대목이 ' + later + '곳 있다. 세상을 더 알게 되면 다시 읽어 보자.' : '';
    var notes = [];
    if (knownN) notes.push('이미 아는 이야기 ' + knownN + '곳');
    if (missed) notes.push(G.LANGS[b.lang] + '가 서툴러 놓친 대목 ' + missed + '곳');
    if (!got.length) { await UI.say('「' + b.title + '」' + U.jx(b.title, '을/를') + ' 읽었다.\n' + (laterTxt || (missed ? '어려운 구절이 많아 다 이해하지 못했다...' : '새로 알게 된 것은 없었다.')) + (notes.length ? '\n(' + notes.join(' · ') + ')' : ''), {}); return; }
    var html = '<div style="font-size:18px;margin-bottom:10px">「' + b.title + '」에서 다음 단서를 얻었다.' + (missed ? ' <span class="muted">(언어 실력이 부족해 일부만 이해했다)</span>' : '') + '</div>' +
      got.map(function (d) { return '<div class="hint-item"><div class="nm">' + d.name + ' <span class="tag">' + G.DISC_CATS[d.cat] + '</span></div><div class="tx">' + U.esc(d.hint) + '</div></div>'; }).join('') +
      (laterTxt ? '<div class="muted" style="margin-top:10px;font-size:16px">' + laterTxt + '</div>' : '') +
      (notes.length ? '<div class="muted" style="margin-top:6px;font-size:15px">' + notes.join(' · ') + '</div>' : '');
    await UI.window({ title: '열람', icon: 'book', width: 760, html: html, buttons: [{ label: '확인', value: 1, cls: 'navy' }] }).result;
  };
  LB.search = async function (c) {
    var s = S();
    var others = G.BOOKS.filter(function (b) { return b.libs.indexOf(c.id) < 0 && (b.y || 0) <= s.date.y; });   // 아직 나오지 않은 책은 아무도 모른다
    var v = await UI.choose('검색 — 어떤 책을 찾으십니까?', others.map(function (b) { return { label: b.title, right: G.LANGS[b.lang], value: b.id, icon: 'eye' }; }), { width: 720 });
    if (!v) return;
    var b = G.BOOKS.filter(function (x) { return x.id === v; })[0];
    var where = b.libs.map(function (id) { return G.CITY_DATA[id].name; });
    await C.say(librarian(c), '안됐습니다만, 그 책은 여기에는 없습니다. ' + (where.length ? where.join(', ') + '의 도서관에 있다고 들었습니다.' : ''));
  };

  // ================================================================ 조합 (guild: training)
  var GU = { title: '조합', icon: 'seal', paint: 'guild', exitLabel: '조합을 나온다' };
  C.B.guild = GU;
  function master(c) { return C.npc('guildmaster', '조합장'); }
  GU.enter = async function (c) { await C.say(master(c), '제독, 조합에 무슨 일이십니까? 훌륭한 선원이 되고 싶다면 여기서 수행하고 가게.'); };
  GU.sub = function (c) {
    var n = G.Quest.offers(c).length, r = G.Quest.readyAt(c).length;
    return r ? '끝낸 의뢰 ' + r + '건을 보고할 수 있다' : n ? '의뢰 ' + n + '건이 붙어 있다' : '특기 수행과 어학';
  };
  GU.menu = function (c) {
    var off = G.Quest.offers(c), ready = G.Quest.readyAt(c), mine = G.Quest.list();
    return [
      { label: '의뢰를 살펴본다', icon: 'scroll', sub: off.length ? off.length + '건' : '없다', dim: !off.length, onClick: function () { return GU.board(c); } },
      { label: '의뢰를 보고한다', icon: 'seal', sub: ready.length ? ready.length + '건' : '', dim: !ready.length, onClick: function () { return GU.report(c); } },
      { label: '맡은 의뢰', icon: 'book', sub: mine.length ? mine.length + '/' + G.Quest.MAX : '없다', dim: !mine.length, onClick: function () { return GU.mine(c); } },
      { label: '특기 수행', icon: 'sword', onClick: function () { return GU.train(c); } },
      { label: '어학 공부', icon: 'book', onClick: function () { return GU.lang(c); } }
    ];
  };

  // ---------------------------------------------------------------- 의뢰 게시판
  function qLine(q) {
    var K = G.Quest.KINDS[q.kind];
    return '<b>' + U.esc(q.title) + '</b> <small class="muted">' + K.name + '</small>';
  }
  GU.board = async function (c) {
    var s = S();
    for (;;) {
      var off = G.Quest.offers(c);
      if (!off.length) { await C.say(master(c), '지금은 맡길 만한 일이 없네. 며칠 뒤에 다시 들러 보게.'); return; }
      var i = await UI.choose('조합 게시판', off.map(function (q) {
        return { value: q, icon: G.Quest.KINDS[q.kind].icon,
          label: qLine(q),
          right: U.num(q.pay) + '닢 · ' + q.limit + '일' };
      }), { width: 760, icon: 'scroll', text: '기한 안에 해내면 사례금과 명성을 받습니다. 한 번에 ' + G.Quest.MAX + '건까지 맡을 수 있습니다. (지금 ' + G.Quest.list().length + '건)' });
      if (!i) return;
      var no = G.Quest.canAccept(i);
      var K = G.Quest.KINDS[i.kind];
      var detail = K.desc + '\n\n사례금 금화 ' + U.num(i.pay) + '닢 · 명성 +' + i.fame + ' · 기한 ' + i.limit + '일' +
        (i.load ? '\n짐칸 ' + i.load + '통을 씁니다.' : '') +
        (i.hint ? '\n' + i.hint : '') +
        (i.kind === 'buy' ? '\n물건값은 제독이 냅니다. 사서 이 조합으로 가져오십시오.' : '') +
        (i.kind === 'debt' ? '\n' + G.CITY_DATA[i.at].name + '에서 돈을 받아 이 조합으로 돌아오십시오.' : '') +
        (no ? '\n\n※ ' + no : '');
      var ok = await UI.confirm('<b>' + U.esc(i.title) + '</b><br><br>' + U.esc(detail).replace(/\n/g, '<br>'), no ? null : '맡는다', '그만둔다', '의뢰');
      if (!ok || no) { if (no) UI.toast(no, 'info'); continue; }
      var q = G.Quest.accept(i);
      if (q.kind === 'carry') await C.say(master(c), '고맙네. 짐은 벌써 실어 두었네. ' + G.CITY_DATA[q.to].name + ' 조합에 내려놓으면 되네.');
      else if (q.kind === 'passenger') await C.say(master(c), q.who + '님이 배에 오르셨네. 부디 무사히 모셔다 드리게.');
      else if (q.kind === 'buy') await C.say(master(c), '물건이 들어오는 대로 이리로 가져오게. 값은 후하게 쳐 주지.');
      else if (q.kind === 'pirate') await C.say(master(c), '요즘 그 바다가 험하다네. 해적을 보면 사정 두지 말게.');
      else await C.say(master(c), '그 사람, 말은 잘하지만 돈은 잘 안 내놓는다네. 잘 부탁하네.');
      UI.toast('의뢰를 맡았다. 기한 ' + q.limit + '일', 'scroll', 4200);
      return;
    }
  };

  GU.mine = async function (c) {
    var qs = G.Quest.list();
    if (!qs.length) { UI.toast('맡은 의뢰가 없습니다.', 'book'); return; }
    for (;;) {
      qs = G.Quest.list();
      if (!qs.length) return;
      var v = await UI.choose('맡은 의뢰', qs.map(function (q) {
        var left = G.Quest.remain(q);
        var prog = q.kind === 'pirate' ? ' (' + (q.got || 0) + '/' + q.qty + ')'
          : q.kind === 'debt' ? (q.collected ? ' (돈을 받아 왔다)' : ' (' + G.CITY_DATA[q.at].name + '으로)') : '';
        return { value: q, icon: G.Quest.KINDS[q.kind].icon,
          label: U.esc(q.title) + prog + ' <small class="muted">' + G.CITY_DATA[q.to].name + ' 조합</small>',
          right: (left < 0 ? '기한 지남' : '남은 ' + left + '일') };
      }), { width: 760, icon: 'book', text: '기한을 넘기면 명성이 깎입니다. 포기하면 명성이 더 깎입니다.' });
      if (!v) return;
      var ok = await UI.confirm('<b>' + U.esc(v.title) + '</b><br><br>이 의뢰를 포기하겠습니까? 명성이 ' + Math.round(v.fame * 1.5) + ' 깎입니다.', '포기한다', '그만둔다');
      if (ok) { G.Quest.give_up(v); UI.toast('의뢰를 포기했다.', 'boot'); }
    }
  };

  GU.report = async function (c) {
    var s = S();
    for (;;) {
      var ready = G.Quest.readyAt(c);
      if (!ready.length) return;
      var q = ready.length === 1 ? ready[0] : await UI.choose('보고할 의뢰', ready.map(function (x) {
        return { value: x, icon: G.Quest.KINDS[x.kind].icon, label: U.esc(x.title), right: U.num(x.pay) + '닢' };
      }), { width: 720 });
      if (!q) return;
      var late = U.dateNum(s.date) > q.due;
      var pay = late ? Math.round(q.pay * 0.5) : q.pay;
      var fame = late ? Math.round(q.fame * 0.5) : q.fame;
      if (q.kind === 'buy') {
        var cg = s.fleet.cargo[q.good];
        if (!cg || cg.q < q.qty) { await C.say(master(c), '아직 물건이 모자라는군.'); return; }
        cg.q -= q.qty; if (cg.q <= 0) delete s.fleet.cargo[q.good];
      }
      s.player.gold += pay; s.player.fame += fame;
      var i = G.Quest.list().indexOf(q); if (i >= 0) G.Quest.list().splice(i, 1);
      if (!s.questDone) s.questDone = {};
      s.questDone[q.key] = 'done';
      s.stats.quests = (s.stats.quests || 0) + 1;
      var line = q.kind === 'carry' ? '짐은 잘 받았네. 하나도 상하지 않았군!'
        : q.kind === 'passenger' ? q.who + '님도 무사히 닿으셨다니 다행일세.'
        : q.kind === 'buy' ? '오, 이걸 정말 구해 왔군! 약속대로 값을 치르겠네.'
        : q.kind === 'pirate' ? '그 바다가 조용해졌다는 소문이 벌써 돌더군. 잘했네!'
        : '그 사람에게서 돈을 받아 오다니, 자네 보통이 아니군.';
      await C.say(master(c), line + (late ? '\f다만 기한을 넘겼으니 사례금은 절반일세.' : '') +
        '\f사례금 금화 ' + U.num(pay) + '닢일세.');
      G.State.log('조합 의뢰를 마쳤다 — ' + q.title + ' (사례금 ' + U.num(pay) + '닢, 명성 +' + fame + ')');
      UI.toast('의뢰 완료! 금화 ' + U.num(pay) + '닢 · 명성 +' + fame, 'seal', 4500);
      G.Game.refreshHud();
    }
  };
  GU.train = async function (c) {
    var s = S(), p = s.player, cap = R.skillCap(p.st.int);
    var v = await UI.choose('수행할 특기 (지력에 따라 최대 ' + Math.min(3, cap) + '단계)', G.SKILLS.map(function (sk) {
      var lv = p.sk[sk.id] || 0, cost = (lv + 1) * 1500, days = (lv + 1) * 10;
      return { label: sk.name + ' ' + G.Info.pips(lv), right: lv >= Math.min(3, cap) ? '한계' : U.num(cost) + '닢 · ' + days + '일', value: sk.id, disabled: lv >= Math.min(3, cap), desc: sk.desc };
    }), { width: 620 });
    if (!v) return;
    var lv = p.sk[v] || 0, cost = (lv + 1) * 1500, days = (lv + 1) * 10;
    if (p.gold < cost) { UI.toast('소지금이 모자랍니다.', 'coin'); return; }
    if (!(await UI.confirm(G.SKILL_BY_ID[v].name + ' 수행에 ' + days + '일, 금화 ' + U.num(cost) + '닢이 듭니다. 수행하겠습니까?', '수행한다', '그만둔다'))) return;
    p.gold -= cost;
    await UI.fade(function () { G.Game.passDays(days); });
    var ch = 0.45 + p.st.int / 200 - lv * 0.08;
    if (U.chance(ch)) { p.sk[v] = lv + 1; await C.say(master(c), '훌륭하네! ' + U.j(G.SKILL_BY_ID[v].name, '이/가') + ' 한 단계 올랐네.'); G.State.log(G.SKILL_BY_ID[v].name + ' 수행을 마쳤다. (' + (lv + 1) + '단계)'); }
    else await C.say(master(c), '아직 멀었군. 다음에 다시 도전하게.');
  };
  GU.lang = async function (c) {
    var s = S(), p = s.player, cap = Math.min(3, R.langCap(p.st.int));
    var teach = [c.lang]; G.CITY_DATA.forEach(function (x) { if (G.REGION_DIST[c.region][x.region] <= 1 && teach.indexOf(x.lang) < 0) teach.push(x.lang); });
    var v = await UI.choose('배울 언어', teach.map(function (li) {
      var lv = p.lg[li] || 0, cost = (lv + 1) * 1000, days = (lv + 1) * 15;
      return { label: G.LANGS[li] + ' ' + G.Info.pips(lv), right: lv >= cap ? '한계' : U.num(cost) + '닢 · ' + days + '일', value: li, disabled: lv >= cap };
    }), { width: 560 });
    if (v == null) return;
    var lv = p.lg[v] || 0, cost = (lv + 1) * 1000, days = (lv + 1) * 15;
    if (p.gold < cost) { UI.toast('소지금이 모자랍니다.', 'coin'); return; }
    if (!(await UI.confirm(G.LANGS[v] + ' 공부에 ' + days + '일, 금화 ' + U.num(cost) + '닢이 듭니다. 공부하겠습니까?', '공부한다', '그만둔다'))) return;
    p.gold -= cost;
    await UI.fade(function () { G.Game.passDays(days); });
    if (U.chance(0.55 + p.st.int / 250 - lv * 0.08)) { p.lg[v] = lv + 1; await C.say(master(c), G.LANGS[v] + '를 제법 하게 되었군! (' + G.LANG_LV[lv + 1] + ')'); }
    else await C.say(master(c), '말이란 하루아침에 느는 것이 아니지. 다음에 또 오게.');
  };

  // ================================================================ 성문 (gate: land expedition)
  var GT = { title: '성문', icon: 'gate', paint: 'gate', exitLabel: '마을로 돌아간다' };
  C.B.gate = GT;
  GT.enter = async function (c) {
    var guard = { name: '수위', portrait: A.withImg(A.npcSpec('gate' + c.id, 'soldier', c.style), G.Img.chain.npc('guard', c)), lang: C.langLv(c) };
    var of = G.Mounts.offers(c, S().date.y).map(function (id) { return G.Mounts.get(id).name; });
    await C.say(guard, U.pick(['성 밖은 위험하다. 조심해서 다녀오게.', '어디로 가려는가? 성 밖에는 도적과 들짐승이 많다네.', '탐험이라도 떠나려는가?']) + (of.length ? ' 성문 옆 마구간에서 ' + of.join('·') + U.jx(of[of.length - 1], '을/를') + ' 구할 수 있지.' : ''));
  };
  GT.sub = function (c) { var of = c ? G.Mounts.offers(c, S().date.y).map(function (id) { return G.Mounts.get(id).name; }) : []; return '육로 탐험' + (of.length ? ' · ' + of.join('·') : ''); };
  GT.menu = function (c) {
    var s = S(), sb = s.stable && s.stable[c.id];
    return [
      s.loc.via === 'land' ? { label: '탐험대로 돌아간다', icon: 'tent', sub: '탈것을 바꿀 수 있다', onClick: function () { return GT.backToParty(c); } }
        : { label: '탐험을 떠난다', icon: 'boot', sub: '탈것을 고른다', onClick: function () { return GT.explore(c); } },
      { label: '마구간', icon: 'horse', sub: sb ? G.Mounts.get(sb.id).name + ' ' + sb.n + unitOf(sb.id) : '둘러본다', onClick: function () { return GT.stableMenu(c); } }
    ];
  };
  function unitOf(id) { return id === 'porter' ? '패' : id === 'wagon' ? '대' : id === 'reindeer' ? '대' : '필'; }
  GT.partySize = function () { var s = S(); return Math.min(30, s.fleet.crew, Math.max(5, Math.round(s.fleet.crew * 0.5))); };
  GT.explore = async function (c) {
    var s = S();
    if (s.loc.via === 'land') return GT.backToParty(c);
    if (s.fleet.crew < 5) { await C.mate('제독, 저희들만으로 탐험을 하는 것은 무모한 짓입니다! 항구에서 사람을 모집한 후로 합시다.'); return; }
    var mt = await GT.outfit(c, 'depart');
    if (!mt) return;
    var ok = await C.mateAsk('탐험을 떠납니까? ' + (mt.id === 'walk' ? '걸어서 갑니다. ' : G.Mounts.get(mt.id).name + ' ' + mt.n + unitOf(mt.id) + U.jx(unitOf(mt.id), '과/와') + ' 함께 갑니다. ') + '준비하는 데 10일 걸립니다. 좋습니까?', [{ label: '떠난다', value: true }, { label: '그만둔다', value: false }]);
    if (!ok) { GT.undo(c, mt); return; }
    await UI.fade(function () { G.Game.passDays(10); G.Game.go('land', { from: c.id, mount: mt }); });
  };
  GT.backToParty = async function (c) {
    var mt = await GT.outfit(c, 'resume');
    if (!mt) return;
    await UI.fade(function () { G.Game.go('land', { resumeFrom: c.id, mount: mt }); });
  };
  GT.stableMenu = async function (c) { await GT.outfit(c, 'stable'); };

  /* 성문 마구간 창: 이 고장에서 구할 수 있는 탈것을 모형 미리보기와 함께 보여 주고 고르게 한다.
     mode 'depart' 새 탐험 · 'resume' 도시를 들른 탐험대 · 'stable' 둘러보기(사서 맡기기·팔기). 고른 것 {id, n, draft, style} 또는 null */
  GT.outfit = function (c, mode) {
    var s = S(), M = G.Mounts, yr = s.date.y;
    var party = mode === 'resume' && s.landReturn ? s.landReturn.party : GT.partySize();
    var have = mode === 'resume' ? (s.landReturn && s.landReturn.mount) : (s.stable && s.stable[c.id]);
    if (have && (have.id === 'walk' || !have.n)) have = null;
    var offers = M.offers(c, yr), ids = ['walk'];
    if (have && ids.indexOf(have.id) < 0) ids.push(have.id);
    offers.forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
    var draftHere = M.draft(c);
    function sellValue(h) { var m = M.get(h.id); return m.hire ? 0 : Math.round(m.price * h.n * m.sell); }
    function plan(id) {
      var m = M.get(id), need = M.need(id, party), own = have && have.id === id ? have.n : 0, canBuy = offers.indexOf(id) >= 0;
      var buyN = id === 'walk' ? 0 : canBuy ? Math.max(0, need - own) : 0;
      var n = id === 'walk' ? 0 : own + buyN;
      var refund = id !== 'walk' && have && have.id !== id ? sellValue(have) : 0;      // 다른 짐승은 되판다 (걸어가면 마구간에 그대로 둔다)
      var buy = buyN * m.price;
      return { id: id, need: need, own: own, buyN: buyN, n: n, buy: buy, refund: refund, net: buy - refund, draft: have && have.id === id && have.draft ? have.draft : draftHere };
    }
    var TN = G.MOUNT_TERR_NAME, sel = have ? have.id : (offers[0] && M.get(offers[0]).per ? offers[0] : 'walk');
    if (mode === 'stable' && sel === 'walk' && offers.length) sel = offers[0];
    function card(id) {
      var m = M.get(id), p = plan(id), best = G.MOUNT_TERR.map(function (t) { return [t, M.val(m.spd, t, 1)]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 2);
      var chips = G.MOUNT_TERR.map(function (t) { var su = M.suit(id, t); return '<span class="tc ' + su.cls + '" title="' + TN[t] + ' 걸음 ×' + M.val(m.spd, t, 1).toFixed(1) + ' · 피로 ×' + M.val(m.fat, t, 1).toFixed(2) + (M.val(m.risk, t, 0) ? ' · 짐승을 잃기 쉽다' : '') + '">' + TN[t] + '<b>' + su.mark + '</b></span>'; }).join('');
      var fatBest = G.MOUNT_TERR.reduce(function (a, t) { return Math.min(a, M.val(m.fat, t, 1)); }, 9);
      var extra = [];
      if (id !== 'walk') extra.push('피로 ×' + M.val(m.fat, 'grass', 1).toFixed(2) + (fatBest < M.val(m.fat, 'grass', 1) ? ' (가장 ×' + fatBest.toFixed(2) + ')' : ''));
      if (m.water) extra.push('물 ×' + M.val(m.water, 'desert', 1).toFixed(2) + '(사막)');
      if (m.food) extra.push('식량 ×' + M.val(m.food, 'grass', 1).toFixed(2));
      if (m.cold) extra.push('추위 피로 ×' + m.cold);
      if (m.combat) extra.push('싸움 +' + Math.round(m.combat * 100) + '%');
      if (m.scout) extra.push('정찰 +' + m.scout + '°');
      var price;
      if (id === 'walk') price = have && mode !== 'resume' ? '마구간의 ' + M.get(have.id).name + U.jx(M.get(have.id).name, '은/는') + ' 그대로 둔다' : '돈이 들지 않는다';
      else {
        var u = unitOf(id), parts = [];
        parts.push((m.per ? p.n + u + ' (대원 ' + party + '명 · ' + (m.per === 1 ? '한 사람에 하나' : m.per + '명에 하나') + ')' : ''));
        if (p.own) parts.push('가진 것 ' + p.own + u);
        if (p.buyN) parts.push((m.hire ? '품삯 ' : '금화 ') + U.num(p.buy) + '닢');
        if (p.refund) parts.push('되판 값 +' + U.num(p.refund) + '닢');
        if (!p.buyN && !p.own) parts.push('여기서는 구할 수 없다');
        price = parts.filter(Boolean).join(' · ');
      }
      var short = p.net > s.player.gold && id !== 'walk';
      return '<div class="of-card' + (id === sel ? ' sel' : '') + (short ? ' short' : '') + '" data-id="' + id + '" tabindex="-1">' +
        '<canvas width="264" height="122"></canvas>' +
        '<div class="of-name">' + m.name + (p.own ? '<span class="of-tag">' + (mode === 'resume' ? '데려온 ' : '마구간 ') + p.own + unitOf(id) + '</span>' : '') + (id === 'wagon' ? '<span class="of-sub">' + (p.draft === 'ox' ? '소가 끈다' : '말이 끈다') + '</span>' : '') + '</div>' +
        '<div class="of-price' + (short ? ' short' : '') + '">' + price + '</div>' +
        (id === 'walk' ? '<div class="of-best">모든 땅 ×1.0</div>' : '<div class="of-best">' + best.map(function (b) { return TN[b[0]] + ' <b>×' + b[1].toFixed(1) + '</b>'; }).join(' · ') + '</div>') +
        '<div class="of-terr">' + chips + '</div>' +
        (extra.length ? '<div class="of-stat">' + extra.join(' · ') + '</div>' : '') +
        '<div class="of-desc">' + m.desc + '</div></div>';
    }
    var intro = mode === 'resume' ? '탐험대로 돌아가기 전에 탈것을 바꿀 수 있습니다.' : mode === 'stable' ? '짐승을 사서 마구간에 맡겨 두거나, 맡긴 짐승을 되팔 수 있습니다.' : '이 고장에서 구할 수 있는 탈것입니다. 탈것은 걸음을 빠르게 하고 피로를 덜어 주지만, 맞지 않는 땅에서는 힘을 못 쓰고 쓰러지기도 합니다.';
    var html = '<div class="outfit"><div class="of-head"><div>' + intro + '</div><div class="of-meta">탐험대 <b>' + party + '명</b> · 소지금 <b class="of-gold">' + U.num(s.player.gold) + '</b>닢</div></div>' +
      '<div class="of-grid">' + ids.map(card).join('') + '</div>' +
      '<div class="of-legend">지형 적합도 <span class="tc best">◎</span> 아주 좋음(×2.2 넘게) <span class="tc good">○</span> 좋음 <span class="tc mid">△</span> 조금 나음 <span class="tc bad">×</span> 나쁨(느리거나 짐승을 잃는다) · 짐승이 모자라면 효과가 그만큼 줄어든다</div></div>';
    var btns = [];
    if (mode === 'stable') {
      btns.push({ label: '사서 마구간에 둔다', value: 'buy', cls: 'navy', id: 'go' });
      if (have) btns.push({ label: '마구간의 ' + M.get(have.id).name + U.jx(M.get(have.id).name, '을/를') + ' 되판다 (+' + U.num(sellValue(have)) + '닢)', value: 'sell', id: 'sell' });
      btns.push({ label: '닫는다', value: null });
    } else {
      btns.push({ label: '떠난다', value: 'go', cls: 'navy', id: 'go' });
      btns.push({ label: '그만둔다', value: null });
    }
    var raf = 0, t0 = performance.now();
    var win = UI.window({ title: c.name + ' 성문 — 마구간', icon: 'horse', width: 1220, html: html, buttons: btns, onClose: function () { cancelAnimationFrame(raf); },
      onKey: function (e) { var k = ids.indexOf(sel); if (e.key === 'ArrowRight') { pick(ids[Math.min(ids.length - 1, k + 1)]); return true; } if (e.key === 'ArrowLeft') { pick(ids[Math.max(0, k - 1)]); return true; } if (e.key === 'Enter') { if (win.go && !win.go.disabled) win.go.click(); return true; } return false; } });
    win.el.classList.add('outfitwin');
    var cards = [].slice.call(win.content.querySelectorAll('.of-card'));
    function pick(id) {
      sel = id; cards.forEach(function (e) { e.classList.toggle('sel', e.getAttribute('data-id') === id); });
      var p = plan(id), m = M.get(id), gold = s.player.gold;
      if (win.go) {
        if (mode === 'stable') {
          win.go.innerHTML = id === 'walk' || !p.buyN ? '살 것이 없다' : m.name + ' ' + p.buyN + unitOf(id) + U.jx(unitOf(id), '을/를') + ' 사서 맡긴다 (' + U.num(p.net) + '닢)';
          win.go.disabled = id === 'walk' || !p.buyN || p.net > gold || m.hire;
          if (m.hire) win.go.innerHTML = '짐꾼은 떠날 때 데려간다';
        } else {
          win.go.innerHTML = (id === 'walk' ? '걸어서 떠난다' : m.name + U.jx(m.name, '과/와') + ' 떠난다') + (p.net > 0 ? ' (' + U.num(p.net) + '닢)' : p.net < 0 ? ' (+' + U.num(-p.net) + '닢)' : '');
          win.go.disabled = p.net > gold || (id !== 'walk' && !p.n);
        }
        win.go.classList.toggle('disabled', !!win.go.disabled);
      }
    }
    cards.forEach(function (e) { var id = e.getAttribute('data-id'); e.addEventListener('click', function () { pick(id); }); e.addEventListener('dblclick', function () { pick(id); if (win.go && !win.go.disabled) win.go.click(); }); });
    pick(sel);
    var cvs = cards.map(function (e) { return { cv: e.querySelector('canvas'), id: e.getAttribute('data-id') }; });
    function loop() {
      var t = (performance.now() - t0) / 1000;
      cvs.forEach(function (o) { var p = plan(o.id); G.Party.preview(o.cv, o.id, p.draft, o.id === sel ? t : t * 0.0 + 0.4, c.style); });
      raf = requestAnimationFrame(loop);
    }
    loop();
    return win.result.then(function (v) {
      if (!v) return null;
      var p = plan(sel), m = M.get(sel);
      s.stable = s.stable || {};
      if (v === 'sell' && have) { s.player.gold += sellValue(have); delete s.stable[c.id]; UI.toast(m.name ? M.get(have.id).name + ' ' + have.n + unitOf(have.id) + U.jx(unitOf(have.id), '을/를') + ' 되팔았다.' : '', 'coin'); return null; }
      if (p.net > s.player.gold) { UI.toast('소지금이 모자랍니다.', 'coin'); return null; }
      s.player.gold -= p.net;
      if (mode === 'stable') { if (p.buyN) { s.stable[c.id] = { id: sel, n: p.n, draft: p.draft }; UI.toast(m.name + ' ' + p.buyN + unitOf(sel) + U.jx(unitOf(sel), '을/를') + ' 사서 마구간에 맡겼다.', 'horse'); } return null; }
      if (sel === 'walk') {
        if (mode === 'resume' && have && !M.get(have.id).hire) { var o0 = s.stable[c.id]; s.stable[c.id] = o0 && o0.id === have.id ? { id: have.id, n: o0.n + have.n, draft: have.draft } : { id: have.id, n: have.n, draft: have.draft }; UI.toast(M.get(have.id).name + U.jx(M.get(have.id).name, '을/를') + ' 이 도시 마구간에 맡겼다.', 'horse'); }
        return { id: 'walk', n: 0 };
      }
      if (mode !== 'resume') delete s.stable[c.id];                 // 마구간의 짐승을 데리고 나간다 (다른 종류였으면 되팔았다)
      if (p.buyN) UI.toast(m.name + ' ' + p.buyN + unitOf(sel) + U.jx(unitOf(sel), '을/를') + (m.hire ? ' 고용했다.' : ' 샀다.'), 'horse');
      if (p.refund) UI.toast(M.get(have.id).name + U.jx(M.get(have.id).name, '을/를') + ' 되팔았다 (+' + U.num(p.refund) + '닢).', 'coin');
      return { id: sel, n: p.n, draft: p.draft, style: c.style, bought: p.net, prev: mode === 'resume' ? null : have };
    });
  };
  /** 떠나기를 그만두면 산 것을 무른다 */
  GT.undo = function (c, mt) {
    var s = S();
    if (!mt || mt.id === 'walk') return;
    s.player.gold += mt.bought || 0;
    s.stable = s.stable || {};
    if (mt.prev) s.stable[c.id] = mt.prev; else if (!G.Mounts.get(mt.id).hire) delete s.stable[c.id];
  };

  // ================================================================ 자택 (home)
  var HM = { title: '자택', icon: 'house', paint: 'home', exitLabel: '집을 나온다' };
  C.B.home = HM;
  HM.enter = async function (c) {
    var s = S();
    if (s.player.wife) await UI.say(U.pick(['어서 와요, 당신! 무사히 돌아와서 다행이에요.', '아, 당신. 오늘은 무엇이 좋겠어요?', '오늘은 당신이 좋아하는 스튜예요.']), G.Family.wifeSpeaker());
    else await UI.say('오랜만의 집이다. 먼지가 조금 쌓여 있다.', {});
  };
  HM.sub = function () { var s = S(); return s.player.wife ? '가족이 기다리는 집' : '혼자 사는 집'; };
  HM.menu = function (c) {
    var s = S();
    return [
      { label: '쉰다', icon: 'bed', onClick: function () { return HM.rest(c); } },
      s.player.wife ? { label: '가족', icon: 'heart', sub: s.player.kids.length ? '자녀 ' + s.player.kids.length : '', onClick: function () { return G.Family.talk(); } } : null,
      { label: '금고', icon: 'chest', sub: U.num(s.player.bank) + '닢', onClick: function () { return HM.bank(c); } },
      { label: '은퇴', icon: 'log', onClick: function () { return G.Family.retire(); } }
    ];
  };
  HM.rest = async function (c) {
    var s = S();
    await UI.fade(function () { G.Game.passDays(3); });
    s.player.hp = 100; s.fleet.fatigue = 0;
    await UI.say('집에서 푹 쉬었다. 몸도 마음도 가벼워졌다.', {});
  };
  HM.bank = async function (c) {
    var s = S(), p = s.player;
    var v = await UI.choose('금고 — 예금 ' + U.num(p.bank) + '닢 (매달 이자 0.3%)', [{ label: '맡긴다', value: 'in', icon: 'plus' }, { label: '찾는다', value: 'out', icon: 'coin' }], { width: 460 });
    if (!v) return;
    var n = await UI.number({ title: v === 'in' ? '맡기기' : '찾기', min: 0, max: v === 'in' ? p.gold : p.bank, value: v === 'in' ? p.gold : p.bank, unit: '닢' });
    if (!n) return;
    if (v === 'in') { p.gold -= n; p.bank += n; } else { p.bank -= n; p.gold += n; }
  };
})(window.G = window.G || {});
