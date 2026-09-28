/* City scene: town view, building framework, arrival processing, prologue. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art, R = G.R;
  var C = { B: {} };
  G.Scenes.city = C;
  var viewCache = {}, viewKeys = [], intCache = {}, intKeys = [];
  var cur = null, token = 0, busy = false;

  function S() { return G.Game.state; }
  C.city = function () { return G.CITY_DATA[S().loc.city]; };
  C.isBusy = function () { return busy; };

  function cachePut(cache, keys, k, v, lim) {
    cache[k] = v; keys.push(k);
    while (keys.length > lim) { delete cache[keys.shift()]; }
    return v;
  }
  var NATION_COLOR = { '포르투갈': '#1d3f7a', '카스티야': '#8a1e1e', '아라곤': '#c9a030', '잉글랜드': '#b01e28', '프랑스': '#1e3a8a', '베네치아': '#8a1e2a', '제노바': '#c8c8c8', '오스만 제국': '#a01818', '맘루크 왕조': '#c9a030', '명': '#b8281e', '한자 동맹': '#8a1e1e', '신성로마제국': '#d4a82a' };
  C.nationColor = function (n) { return NATION_COLOR[n] || A.rgba(A.jitter('#6a4a2a', U.makeRng(U.strHash(n || 'x')), 90)); };
  C.timeOfDay = function () { var d = S().day % 7; return d === 5 ? 'golden' : d === 6 ? 'dusk' : 'day'; };
  C.viewKeys = function (c) { return G.Img.chain.city(c, C.timeOfDay()); };
  C.view = function (c) {
    var t = C.timeOfDay(), owner = R.cityOwner(c), k = c.id + ':' + t + ':' + owner;
    if (viewCache[k]) return viewCache[k];
    var winter = (c.lat > 45 && (S().date.m >= 12 || S().date.m <= 2));
    var cv = G.Img.make(C.viewKeys(c), 1600, 900, function () { return A.cityScene(c, { time: t, flag: C.nationColor(owner), snow: winter && c.lat > 55 }); }, { post: timeTint(t) });
    return cachePut(viewCache, viewKeys, k, cv, 4);
  };
  /** a generic picture used at golden hour / dusk gets a light warm tint (time-specific files are left as they are) */
  function timeTint(t) {
    return function (ctx, w, h, key) {
      if (t === 'day' || /_(golden|dusk)$/.test(key)) return;
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = t === 'dusk' ? 'rgba(255,110,60,.45)' : 'rgba(255,170,80,.35)';
      ctx.fillRect(0, 0, w, h);
      if (t === 'dusk') { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(40,20,40,.18)'; ctx.fillRect(0, 0, w, h); }
    };
  }
  C.interiorKeys = function (kind, c, variant) { return G.Img.chain.interior(kind, c, variant); };
  C.interior = function (kind, c, variant) {
    var k = kind + ':' + c.id + ':' + (variant || '');
    if (intCache[k]) return intCache[k];
    var cv = G.Img.make(C.interiorKeys(kind, c, variant), 1600, 900, function () { return A.interior(kind, c, variant); });
    return cachePut(intCache, intKeys, k, cv, 6);
  };
  /** preload the town's override pictures (view waits briefly, portraits load in the background) */
  C.preloadImages = function (c) {
    if (!G.Img.count()) return Promise.resolve();
    G.Img.preload(G.Img.NPCS.map(function (n) { return G.Img.chain.npc(n[0], c); }));
    return G.Img.preload([C.viewKeys(c)], 1500);
  };

  // ---------------------------------------------------------------- speakers
  var RELNAME = { C: '가톨릭', O: '정교회', I: '이슬람교', H: '힌두교', B: '불교', K: '유교', J: '신도·불교', N: '토착 신앙' };
  C.relName = function (c) { return RELNAME[c.rel] || '—'; };
  C.langLv = function (c) { return R.lang((c || C.city()).lang); };
  /** a townsperson speaker for this city */
  C.npc = function (id, title) {
    var c = C.city();
    return { name: title, portrait: A.townSpec(id, c), lang: C.langLv(c), li: c.lang };
  };
  C.say = function (who, text) { return UI.say(text, who); };
  C.ask = function (who, text, choices, opts) { opts = opts || {}; return UI.ask(text, choices, { name: who && who.name, portrait: who && who.portrait, lang: opts.plain ? 3 : who && who.lang, li: opts.plain ? null : who && who.li, minLv: who && who.minLv, cancel: opts.cancel }); };
  C.me = function (text) { var p = S().player; return UI.say(text, { name: p.name, portrait: p.portrait }); };
  C.mate = function (text, role) { return UI.say(text, G.Scenes.mateSpeaker(role || 'first')); };
  C.mateAsk = function (text, choices, role) { var sp = G.Scenes.mateSpeaker(role || 'first'); return UI.ask(text, choices, sp); };

  // ---------------------------------------------------------------- buildings
  C.buildings = function (c) {
    var f = R.facilities(c), out = [], s = S();
    if (f.harbor) out.push({ kind: 'harbor', name: '항구', icon: 'anchor' });
    out.push({ kind: 'trade', name: '교역소', icon: 'scales' });
    if (f.shipyard) out.push({ kind: 'shipyard', name: '조선소', icon: 'hammer' });
    out.push({ kind: 'tavern', name: '술집', icon: 'mug' });
    out.push({ kind: 'inn', name: '여관', icon: 'bed' });
    if (f.market) out.push({ kind: 'market', name: '시장', icon: 'sack' });
    out.push({ kind: 'church', name: R.churchName(c), icon: c.rel === 'I' ? 'mosque' : c.rel === 'C' || c.rel === 'O' ? 'church' : 'temple' });
    if (f.library) out.push({ kind: 'library', name: R.libraryName(c), icon: 'book' });
    if (f.palace) {
      // 이름 있는 왕궁은 지금 주인이 있는 곳마다 따로 (한양: 국왕의 경복궁, 세자의 창덕궁)
      var pals = R.namedPalaces(c) ? G.SPONSORS.filter(function (x) { return x.city === c.id && x.bld === 'palace' && G.Sponsor && G.Sponsor.present(x); }) : [];
      if (pals.length) pals.forEach(function (x) { out.push({ kind: 'palace', arg: x.id, name: R.palaceName(c, x), icon: 'crown' }); });
      else out.push({ kind: 'palace', name: R.palaceName(c), icon: 'crown' });
    }
    f.mansion.forEach(function (sid) {
      var sp = G.SPONSOR[sid]; if (!G.Sponsor || !G.Sponsor.present(sp)) return;
      out.push({ kind: 'mansion', arg: sid, name: C.mansionName(sp), icon: 'mansion' });
    });
    if (f.guild) out.push({ kind: 'guild', name: '조합', icon: 'seal' });
    out.push({ kind: 'gate', name: '성문', icon: 'gate' });
    if (c.id === s.player.home) out.push({ kind: 'home', name: '자택', icon: 'house' });
    return out;
  };

  C.mansionName = function (sp) {
    if (sp.place) return sp.place;   // 이름 있는 저택 (압구정·제승당 등)
    var h = G.Sponsor.holderName(sp), parts = h.split(' ');
    var short = /가문|학당|대학|수도원|조합|평의회|회합/.test(h) ? parts.slice(0, 2).join(' ') : parts[parts.length - 1];
    return short + ' 저택';
  };

  // ---------------------------------------------------------------- enter / arrival
  C.enter = async function (arg) {
    arg = arg || {};
    var s = S(), c = G.CITY_DATA[arg.cityId != null ? arg.cityId : s.loc.city];
    s.loc = { mode: 'city', city: c.id, lon: c.lon, lat: c.lat, heading: s.loc.heading || 0, via: arg.via || (c.port ? 'sea' : 'land') };
    cur = null; token++;
    busy = true;
    G.Game.showLayers(false, false, true);
    if (G.Img.count()) await C.preloadImages(c);
    if (G.Town.available(c)) { try { await G.Town.open(c, C.buildings(c)); } catch (e) { console.error(e); G.Town.close(); } }
    else G.Town.close();
    if (G.Town.active()) G.Town.hidden(false); else G.Game.setScene(C.view(c));
    G.Game.cityHud();
    if (G.Audio) G.Audio.music('town');
    try {
      if (arg.prologue) await C.prologue(c);
      if (arg.arrive) await C.arrival(c, arg);
      if (arg.load) { UI.toast(U.fmtDate(s.date) + ' — ' + c.name, 'book'); }
    } catch (e) { console.error(e); }
    busy = false;
    if (G.Game.scene !== C) return;
    C.main();
  };
  C.exit = function () { cur = null; token++; G.Town.close(); };
  /** the street redraws itself every frame; the painted town view is a still picture */
  C.update = function (dt) { if (G.Town.active() && !G.Town.hidden()) G.Town.update(dt); };
  C.onKey = function (e) { if (G.Town.active() && !G.Town.hidden() && !UI.busy() && !busy) return G.Town.onKey(e); return false; };

  /** processing when the fleet arrives in port */
  C.arrival = async function (c, arg) {
    var s = S();
    var first = s.known.indexOf(c.id) < 0 || !(s.visited && s.visited[c.id]);
    if (!s.visited) s.visited = {};
    if (s.known.indexOf(c.id) < 0) s.known.push(c.id);
    s.visited[c.id] = (s.visited[c.id] || 0) + 1;
    if (!s.lastVisit) s.lastVisit = {};
    // days in port
    var pd = { easy: 1, normal: 3, original: 10 }[s.settings.diff] || 3;
    var voyDays = s.fleet.daysOut || 0;          // 항구에서 날이 지나면 0이 되므로 먼저 적어 둔다
    var msgs = G.Game.passDays(pd);
    s.lastVisit[c.id] = s.day;          // 해도의 도시 요약: 언제 들렀는지
    G.Game.refreshHud();
    // supplies spoil a little less in port; ship minor repairs are not automatic
    R.maybeMarketEvent(c);
    var news = msgs.filter(function (m) { return m.history; });
    msgs.filter(function (m) { return !m.history; }).forEach(function (m) { UI.toast(m.text, m.icon); });
    if (first && arg.arrive) UI.toast(c.name + '에 처음으로 입항했다.', 'anchor');
    // 항해를 돌아본다
    if (arg.arrive && s.voyage && s.loc.via !== 'land') {
      var v = s.voyage, days = voyDays;
      var parts = ['항해 ' + days + '일'];
      var nf = s.stats.found - v.found0; if (nf > 0) parts.push('발견 ' + nf + '건');
      var nk = s.known.length - v.known0; if (nk > 0) parts.push('새 도시 ' + nk + '곳');
      var nm = Object.keys(s.marks || {}).length - (v.marks0 || 0); if (nm > 0) parts.push('망루가 본 것 ' + nm + '곳');
      var nw = s.stats.wins - v.wins0; if (nw > 0) parts.push('해전 승리 ' + nw + '번');
      // 항로 경험: 두 항구 사이를 오간 횟수가 차면 자동항해가 열린다
      var rt = v.from !== c.id ? G.Routes.record(v.from, c.id, days) : null;
      if (rt) parts.push(rt.open ? '자동항해 가능' : '항로 경험 ' + rt.n + '/' + rt.need + (rt.long ? ' (장거리)' : ''));
      if (days > 0 && v.from !== c.id) UI.toast(G.CITY_DATA[v.from].name + ' → ' + c.name + ' · ' + parts.join(' · '), 'log', 5500);
      if (rt && rt.opened) news.push({ icon: 'map', text: G.CITY_DATA[v.from].name + '–' + c.name + ' 항로가 손에 익었다 (' + rt.n + '번 오감' + (rt.long ? ', 장거리' : '') + '). 이제 두 항구 사이는 목적지만 고르면 자동항해로 갈 수 있다.' });
      delete s.voyage;
    }
    if (news.length) await C.news(news);
    // city discoveries (landmarks)
    var ds = G.Disc.checkCity(c.id);
    for (var i = 0; i < ds.length; i++) {
      if (!(G.Scenes.hasReveal && G.Scenes.hasReveal(ds[i]))) await C.mate('제독, 저기를 보십시오! 소문으로만 듣던 ' + U.eul(ds[i].name).replace(ds[i].name, '「' + ds[i].name + '」') + ' 이 눈으로 보게 되다니...');
      await G.Disc.find(ds[i], 'city');
    }
    var lefts = G.Disc.leftHere('city', 0, 0, c.id);
    for (var li = 0; li < lefts.length; li++) await G.Disc.pickupLeft(lefts[li]);
    // contract reminder
    if (s.contract) {
      var sp = G.SPONSOR[s.contract.sponsor];
      if (sp && sp.city === c.id && G.Errand.done(s.contract)) UI.toast('후원자 ' + G.Sponsor.holderName(sp) + '에게 「' + G.Errand.name(s.contract) + '」' + U.jx(G.Errand.name(s.contract), '을/를') + ' 보고할 수 있습니다.', 'seal', 5000);
    }
    // circumnavigation completion
    if (s.circ && s.circ.done && !s.circ.reported && c.id === s.player.home && G.Sponsor && G.Sponsor.circumReturn) await G.Sponsor.circumReturn(c);
    if (s.settings.autosave !== false) G.State.save(0);
  };

  C.news = async function (list) {
    var html = '<div style="font-size:19px;line-height:1.7">' + list.map(function (m) { return '<div class="flex" style="align-items:flex-start;gap:10px;margin:6px 0">' + G.icon(m.icon || 'scroll') + '<div>' + U.esc(m.text) + '</div></div>'; }).join('') + '</div>';
    await UI.window({ title: '세상의 소식', icon: 'scroll', width: 720, clickAny: true, html: html, buttons: [{ label: '확인', value: 1, cls: 'navy' }] }).result;
  };

  // ---------------------------------------------------------------- main town view
  C.main = function () {
    var s = S(), c = C.city();
    cur = null; token++;
    UI.clearScreen();
    if (G.Town.active()) { G.Town.hidden(false); UI.add(G.Town.catcher(function (kind, arg) { C.visit(kind, arg); })); }
    else G.Game.setScene(C.view(c));
    G.Game.cityHud();
    var owner = R.cityOwner(c), m = R.market(c.id);
    var ban = U.el('div', 'city-banner wood brass-frame');
    ban.innerHTML = '<div class="nm">' + c.name + '</div>' +
      '<div class="meta">' + U.esc(owner) + ' · ' + G.REGIONS[c.region] + ' · ' + C.relName(c) + '</div>' +
      '<div class="meta">' + G.LANGS[c.lang] + ' ' + langPips(C.langLv(c)) + (m.ev ? ' · <span style="color:#f0c080">시세: ' + m.ev + '</span>' : '') + '</div>';
    UI.add(ban);
    var items = C.buildings(c).map(function (b) {
      return { label: b.name, icon: b.icon, onClick: function () { C.visit(b.kind, b.arg); } };
    });
    UI.cmdMenu(c.name, '가고 싶은 곳을 고르십시오', items, { top: 72 });
    // bottom info row
    var bar = U.el('div', 'infobar wood');
    [['admiral', '제독', 'crown'], ['fleet', '함대', 'ship'], ['items', '소지품', 'chest'], ['disc', '발견물', 'star'], ['hints', '단서', 'scroll'], ['contract', '계약·의뢰', 'seal'], ['map', '해도', 'map'], ['log', '일지', 'log'], ['menu', '설정', 'gear']].forEach(function (b) {
      var e = U.el('button', 'btn small ghost', G.icon(b[2]) + b[1]);
      e.onclick = function () { if (UI.busy() || busy) return; G.Info.open(b[0]); };
      bar.appendChild(e);
    });
    UI.add(bar);
    var cap = U.el('div', 'caption', U.fmtDate(s.date) + ' · ' + U.fmtLat(c.lat) + ' ' + U.fmtLon(c.lon));
    UI.add(cap);
    // 이 도시에서 할 일
    var todo = C.todo(c);
    if (todo.length && C.todoClosed !== c.id + ':' + s.day) {
      var tp = U.el('div', 'todo wood brass-frame', '<div class="th">' + G.icon('check') + '이 도시에서 할 일<span class="x" title="닫기">✕</span></div>');
      tp.querySelector('.x').onclick = function (e) { e.stopPropagation(); C.todoClosed = c.id + ':' + s.day; tp.remove(); };
      tp.style.top = (ban.offsetTop + ban.offsetHeight + 10) + 'px';
      todo.slice(0, 6).forEach(function (t) {
        var row = U.el('div', 'tr' + (t.hot ? ' hot' : ''), G.icon(t.icon) + '<span>' + t.text + '</span>');
        row.onclick = function () { if (UI.busy() || busy) return; C.visit(t.kind, t.arg); };
        tp.appendChild(row);
      });
      UI.add(tp);
    }
  };

  /** 도착한 도시에서 해 볼 만한 일 (눌러서 바로 그 건물로 간다) */
  C.todo = function (c) {
    var s = S(), f = R.facilities(c), out = [];
    try {
      // 후원자에게 보고
      if (s.contract) {
        var sp = G.SPONSOR[s.contract.sponsor];
        var done = G.Errand.done(s.contract);
        if (sp && sp.city === c.id && done && G.Sponsor.present(sp)) out.push({ kind: sp.bld === 'palace' ? 'palace' : 'mansion', arg: R.bldArg(sp), icon: 'crown', hot: true, text: G.Sponsor.holderName(sp) + '에게 ' + (s.contract.task ? '「' + G.Errand.name(s.contract) + '」' + U.jx(G.Errand.name(s.contract), '을/를') : '발견을') + ' 보고한다' });
      }
      // 조합 의뢰
      if (G.Quest) {
        var rd = G.Quest.readyAt(c);
        if (rd.length && f.guild) out.push({ kind: 'guild', icon: 'seal', hot: true, text: '조합에 끝낸 의뢰 ' + rd.length + '건 보고' });
        var dt = G.Quest.debtAt(c);
        if (dt.length) out.push({ kind: 'trade', icon: 'scroll', hot: true, text: dt[0].who + '에게서 빚을 받아 낸다 (교역소)' });
      }
      // 알리지 않은 발견과 이 도시의 후원자
      var un = G.Disc.unreported().length;
      if (un) {
        var here = G.SPONSORS.filter(function (x) { return x.city === c.id && G.Sponsor.present(x) && !G.Sponsor.isRivalNation(x); });
        if (here.length) out.push({ kind: here[0].bld === 'palace' ? 'palace' : 'mansion', arg: R.bldArg(here[0]), icon: 'star', text: '알리지 않은 발견 ' + un + '건 — ' + G.Sponsor.holderName(here[0]) + '에게 이야기해 볼 만하다' });
        else if (f.harbor) out.push({ kind: 'harbor', icon: 'flag', text: '알리지 않은 발견 ' + un + '건 — 항구에서 발표할 수 있다' });
      }
      // 교역: 배당과 남는 장사
      var iv = R.investTick(c);
      if (iv.div >= 100) out.push({ kind: 'trade', icon: 'coin', text: '교역소 배당 금화 ' + U.num(Math.floor(iv.div)) + '닢이 쌓였다' });
      if (G.Ledger) {
        var br = G.Ledger.bestRoute(c.id);
        if (br && br.gain >= 8) out.push({ kind: 'trade', icon: 'scales', text: G.GOOD[br.good].name + U.jx(G.GOOD[br.good].name, '을/를') + ' 사서 ' + G.CITY_DATA[br.sell].name + '에 팔면 1통 +' + U.num(br.gain) + '닢' });
        var sellHere = Object.keys(s.fleet.cargo).filter(function (id) {
          var cg = s.fleet.cargo[id], p = R.sellPrice(c, id), bs = G.Ledger.bestSell(id, c.id);
          return cg.cost && p > cg.cost * 1.3 && !(bs && bs.price > p * 1.1);
        });
        if (sellHere.length) out.push({ kind: 'trade', icon: 'sack', hot: true, text: sellHere.map(function (id) { return G.GOOD[id].name; }).slice(0, 2).join('·') + U.jx(G.GOOD[sellHere[0]].name, '을/를') + ' 여기서 팔면 이익이 크다' });
      }
      // 개척 단계의 맛보기: 이 교역소에서 살 수 있는 가벼운 발견 (예: 알렉산드리아의 후추 → 인도로 가는 첫걸음)
      if (G.Frontier && f.trade) {
        var goods = R.cityGoods(c), tease = [];
        G.DISCOVERIES.forEach(function (d) {
          if (d.how !== 'trade' || G.Disc.foundByMe(d.id) || goods.indexOf(d.good) < 0 || d.regions.indexOf(c.region) < 0) return;
          var m = G.DISC_FRONT[d.id]; if (!m || m.t !== 0 || !G.Disc.available(d)) return;
          tease.push(d);
        });
        if (tease.length) {
          var fr = G.FRONTIER[G.DISC_FRONT[tease[0].id].f];
          var tn = tease.map(function (d) { return d.name; }).slice(0, 2).join('·');
          out.push({ kind: 'trade', icon: 'star', hot: true, text: tn + U.jx(tn, '을/를') + ' 사 보자 — 〈' + fr.name + '〉' + U.jx(fr.name, '으로/로') + ' 가는 첫 발견' });
        }
      }
      // 출항 준비
      if (f.harbor && s.fleet.ships.length) {
        var note = C.B.harbor.prepNote(c);
        if (note !== '준비됨') out.push({ kind: 'harbor', icon: 'anchor', text: '항구에서 출항 준비 — ' + note });
      }
      // 계절풍 바다 연안 항구: 지금 부는 바람
      if (G.Monsoon && f.harbor) { var mn = G.Monsoon.portNote(c); if (mn) out.push({ kind: 'harbor', icon: 'wind', text: '계절풍: ' + mn.short }); }
      // 리스본·세비야: 새로 들을 수 있는 큰 항로 이야기
      if (G.Frontier && G.Frontier.leads) {
        var ld = G.Frontier.leads(c.id);
        if (ld.length) out.push({ kind: 'tavern', icon: 'scroll', hot: true, text: '술집·후원자에게서 「' + G.DISC[ld[0].disc].name + '」 이야기를 들을 수 있다' });
      }
      // 새 항해사
      if (C.B.tavern && C.B.tavern.candidates) {
        var cand = C.B.tavern.candidates(c).filter(function (m) { return s.player.fame >= m.fame; });
        if (cand.length && s.mates.length < G.MAX_MATES) out.push({ kind: 'tavern', icon: 'people', text: '술집에 함께할 만한 항해사 ' + cand.length + '명' });
      }
      // 조합 게시판
      if (G.Quest && f.guild) { var off = G.Quest.offers(c).length; if (off && G.Quest.list().length < G.Quest.MAX) out.push({ kind: 'guild', icon: 'scroll', text: '조합 게시판에 의뢰 ' + off + '건' }); }
    } catch (e) { console.error(e); }
    out.sort(function (a, b) { return (b.hot ? 1 : 0) - (a.hot ? 1 : 0); });
    return out;
  };
  function langPips(lv) { var h = ''; for (var i = 1; i <= 3; i++) h += i <= lv ? '●' : '○'; return '<span style="letter-spacing:2px;color:' + (lv ? '#e3c68d' : '#a88') + '">' + h + '</span>'; }
  C.langPips = langPips;

  // ---------------------------------------------------------------- building framework
  C.visit = async function (kind, arg) {
    if (busy || UI.busy()) return;
    var B = C.B[kind]; if (!B) { UI.toast('준비 중입니다.', 'info'); return; }
    var c = C.city();
    busy = true;
    cur = { kind: kind, arg: arg, B: B, t: ++token };
    UI.clearScreen();
    if (G.Town.active() && !G.Town.hidden()) { await G.Town.focusOn(kind, arg); G.Town.hidden(true); }
    var ikind = B.paint || kind, ivar = B.variant ? B.variant(c, arg) : '';
    if (G.Img.count()) {
      var pre = [C.interiorKeys(ikind, c, ivar)];
      if (B.preload) { var ex = B.preload(c, arg); if (ex) pre = pre.concat(ex); }
      await G.Img.preload(pre, 1500);
    }
    G.Game.setScene(C.interior(ikind, c, ivar));
    plaque(B, c, arg);
    var ok = true;
    try { if (B.enter) ok = (await B.enter(c, arg)) !== false; } catch (e) { console.error(e); }
    busy = false;
    if (!ok) { if (cur && G.Game.scene === C) C.main(); return; }
    if (cur && G.Game.scene === C) C.menu();
  };
  function plaque(B, c, arg) {
    var old = U.$('.bld-plaque'); if (old) old.remove();
    var name = typeof B.title === 'function' ? B.title(c, arg) : B.title;
    var p = U.el('div', 'city-banner wood brass-frame bld-plaque', '<div class="nm">' + name + '</div><div class="meta">' + c.name + '</div>');
    UI.add(p);
  }
  C.menu = function () {
    if (!cur) return;
    var c = C.city(), B = cur.B, arg = cur.arg;
    UI.clearScreen();
    plaque(B, c, arg);
    var items = B.menu(c, arg).filter(Boolean).map(function (it) {
      return { label: it.label, icon: it.icon, sub: it.sub, dim: it.dim, onClick: function () { C.run(it.onClick); } };
    });
    items.push({ label: B.exitLabel || U.j(typeof B.title === 'function' ? B.title(c, arg) : B.title, '을/를') + ' 나온다', icon: 'boot', exit: true, onClick: function () { C.run(function () { return C.leave(); }); } });
    var title = typeof B.title === 'function' ? B.title(c, arg) : B.title;
    UI.cmdMenu(title, B.sub ? B.sub(c, arg) : '', items, { top: 72 });
    if (B.panel) { var pn = B.panel(c, arg); if (pn) UI.add(pn); }
  };
  /** run a building command; re-render the menu afterwards if still inside */
  C.run = async function (fn) {
    if (busy || UI.busy()) return;
    busy = true;
    var t = cur ? cur.t : -1;
    try { await fn(); }
    catch (e) { console.error(e); UI.toast('오류: ' + e.message, 'info'); }
    finally {
      busy = false;
      if (G.Game.scene === C) {
        G.Game.refreshHud();
        if (cur && cur.t === t) C.menu();
      }
    }
  };
  C.leave = async function () {
    var B = cur && cur.B;
    if (B && B.leave) await B.leave(C.city(), cur.arg);
    cur = null;
    C.main();
  };
  C.current = function () { return cur; };
  /** close the building menu without leaving (used by sub-screens) */
  C.hideMenu = function () { U.$$('.cmdmenu').forEach(function (e) { e.remove(); }); };

  // ---------------------------------------------------------------- prologue
  C.prologue = async function (c) {
    var s = S(), p = s.player, mate = G.MATE.rocco;
    var home = G.CITY_DATA[p.home];
    var sp = G.Scenes.mateSpeaker('first');
    await UI.say(U.fmtDate(s.date) + ', ' + home.name + '.\n항구에는 아침 안개가 걷히고, 갈매기 소리 사이로 뱃사람들의 외침이 들려온다.', {});
    await UI.say('제독! 드디어 오셨군요. ' + mate.name + '입니다. 오늘부터 부관으로서 제독을 모시게 되었습니다.\f' +
      '우리 배 「' + s.fleet.ships[0].name + '」호는 항구에 정박해 있습니다. 선원 ' + s.fleet.crew + '명, 식량과 물은 ' + R.daysOfFood() + '일치를 실어 두었습니다.', sp);
    await C.me('수고했네, 로코. 앞으로 잘 부탁하네.');
    await UI.say('제독, 이 넓은 세상에는 아직 아무도 본 적 없는 곳과 물건이 가득하다고 합니다.\f' +
      '도서관의 책이나 술집의 소문에서 단서를 모으십시오. 그 단서를 왕궁이나 귀족 저택의 후원자에게 제안하면 모험 자금을 받을 수 있습니다.\f' +
      '계약을 맺은 뒤 목적지를 찾아내 기한 안에 보고하면, 사례금과 함께 이름을 떨치게 될 겁니다. 명성이 높아지면 더 큰 후원자도 만나 주겠지요.\f' +
      '돈이 궁하면 교역소에서 싸게 사서 다른 항구에 비싸게 파는 것도 방법입니다. 출항하실 때는 항구에서 보급을 잊지 마십시오.', sp);
    await UI.say('자, 무엇부터 하시겠습니까? 제독의 명령만 기다리겠습니다.', sp);
    s.flags.prologue = true;
  };

  // ---------------------------------------------------------------- entry refusal (called from sea when entering)
  /** returns null if free to enter, else {reason, text, bribe} */
  C.entryCheck = function (c) {
    var s = S(), own = R.cityOwner(c);
    if (s.player.notoriety >= 60 && R.isHomeNation(c)) return { reason: 'wanted', text: '너 같은 악당을 마을에 들여보낼 수는 없다!!' };
    if (c.flags.indexOf('H') >= 0) return { reason: 'holy', text: '이교도는 이 성스러운 도시에 들어올 수 없다.' };
    if (c.flags.indexOf('X') >= 0 && !(s.flags.mingTrade)) return { reason: 'closed', text: '외국인은 들어올 수 없다.', bribe: 2400 + c.size * 800 };
    var d = s.date, tord = d.y > 1494 || (d.y === 1494 && d.m >= 6);
    if (tord) {
      var myPT = s.player.nation === 'PT';
      if (myPT && own === '카스티야' && c.region === 10) return { reason: 'treaty', text: '여기는 카스티야령이다. 토르데시야스 조약에 따라 포르투갈의 함대를 항구에 들여보낼 수 없다!', bribe: 1500 + c.size * 600 };
      if (!myPT && own === '포르투갈' && (c.region === 3 || c.region === 5 || c.region === 8 || c.region === 10)) return { reason: 'treaty', text: '여기는 포르투갈령이다. 토르데시야스 조약에 따라 에스파냐의 함대를 항구에 들여보낼 수 없다!', bribe: 1500 + c.size * 600 };
    }
    return null;
  };
  /** interactive handling; returns true if allowed in */
  C.handleEntry = async function (c) {
    var chk = C.entryCheck(c); if (!chk) return true;
    var s = S();
    var guard = { name: c.name + ' 수비병', portrait: A.withImg(A.npcSpec('guard' + c.id, 'soldier', c.style), G.Img.chain.npc('guard', c)), lang: C.langLv(c), li: c.lang };
    await UI.say(chk.text, guard);
    for (;;) {
      var opts = [];
      if (chk.bribe) opts.push({ label: '교섭한다', value: 'talk' });
      opts.push({ label: '잠입한다', value: 'sneak' });
      if (chk.reason !== 'holy') opts.push({ label: '공격한다', value: 'attack' });
      opts.push({ label: '떠난다', value: 'leave' });
      var v = await C.mateAsk('제독, 어떻게 할까요?', opts);
      if (v == null || v === 'leave') { await C.mate('할 수 없군요. 포기합시다.'); return false; }
      if (v === 'talk') {
        if (C.langLv(c) === 0) { await C.mate('말이 통하지 않아서 교섭할 수 없습니다.'); continue; }
        var cost = Math.round(chk.bribe * (1.15 - R.skill('speech') * 0.1));
        var ok = await UI.confirm('수비대장에게 금화 ' + U.num(cost) + '닢을 건네고 교섭하겠습니까?', '건넨다', '그만둔다');
        if (!ok) continue;
        if (s.player.gold < cost) { await C.mate('제독, 금화가 모자랍니다!'); continue; }
        s.player.gold -= cost;
        if (U.chance(0.55 + R.skill('speech') * 0.12 + C.langLv(c) * 0.05)) {
          await C.mate('교섭에 성공했습니다. ' + c.name + '에 들어갈 수 있습니다.');
          s.flags['pass' + c.id] = U.dateNum(s.date);
          return true;
        }
        await C.mate('교섭에 실패했습니다... 돈만 날렸군요.'); continue;
      }
      if (v === 'sneak') {
        var disguise = chk.reason === 'holy' && R.hasItem('turban');
        var p = disguise ? 0.8 : 0.3 + R.skill('speech') * 0.05 + (C.langLv(c) >= 2 ? 0.15 : 0);
        if (disguise) UI.toast('터번을 사용했다', 'feather');
        if (U.chance(p)) { await C.mate('제독, 조심하십시오. 몰래 들어가는 데 성공했습니다.'); s.flags.sneaking = c.id; return true; }
        await UI.say('침입자다! 잡아라!!', guard);
        if (U.chance(0.5)) { await C.mate('제독, 무사하셨습니까! 여기는 위험하니 포기합시다.'); return false; }
        var fine = Math.floor(s.player.gold * 0.5);
        s.player.gold -= fine; s.player.notoriety += 3;
        await UI.say('벌금형 또는 추방을 명한다. 목숨을 구한 것을 감사히 여겨라.\n(금화 ' + U.num(fine) + '닢을 빼앗겼다)', guard);
        return false;
      }
      if (v === 'attack') {
        var sure = await UI.confirm('정말로 ' + c.name + U.j(c.name, '을/를').slice(c.name.length) + ' 공격하겠습니까? 악명이 크게 오릅니다.', '공격한다', '그만둔다');
        if (!sure) continue;
        var keepParty = s.loc.party;
        s.loc.party = Math.max(1, s.fleet.crew);
        var res = await G.Scenes.land.landBattle(c.name + ' 수비대', 20 + c.size * 25, false, { kind: 'garrison', guns: true });
        if (keepParty != null) s.loc.party = keepParty; else delete s.loc.party;
        s.player.notoriety += 10;
        if (res === 'win') { await C.mate('마을을 공략했습니다. 이것으로 마을에 들어갈 수 있습니다.'); return true; }
        await C.mate('만만치 않군요. 제독, 일단 퇴각합시다.'); return false;
      }
    }
  };
})(window.G = window.G || {});
