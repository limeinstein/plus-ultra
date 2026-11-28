/* 주점에 도는 소문 (G.TavernRumor) — 조정값 js/data/base.js G.BALANCE.tavernRumor, 특별 소문 js/data/tavernspecial.js
   · 한 도시 주점이 품는 소문은 3건까지(n). 처음 들를 때 정하고, 30일(days)이 지나면 새로 뽑는다.
   · 고르는 법: 아직 찾지 않았고 들을 수 있는 발견 가운데 난이도(pw)가 낮은 것부터 채운다.
     같은 난이도 안에서는 이 도시와 가까울수록(지역 거리·실제 거리) 잘 뽑히고, 온 세상이 떠드는 이야기(개척 단계 맛보기·관문)는 hotK배.
   · 3건 가운데 하나를 찾으면 그 자리에 다음 소문이 들어온다.
   · 화면에는 보이지 않는다 — 술꾼·여급·이름난 여급이 이 3건 안에서만 이야기한다 (js/city/tavern.js T.rumour).
   · 특별 소문(G.TAVERN_SPECIAL)은 그 대륙·도시 주점에서만, 3건과 따로 술집 주인이 꺼낸다 — 증거품을 사면 단서가 한 겹 더. */
(function (G) {
  'use strict';
  var TR = G.TavernRumor = {};
  function S() { return G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.tavernRumor) || {}; }
  function num(v, d) { return v == null ? d : v; }
  function U() { return G.U; }

  /** 어느 주점의 특별 소문인가 */
  TR.isSpecial = function (id) { return !!(G.TAVERN_SPECIAL_BY_DISC && G.TAVERN_SPECIAL_BY_DISC[id]); };
  /** 이 도시 주점의 특별 소문들 — 도시 것이 먼저 */
  TR.specialsAt = function (c) {
    var L = G.TAVERN_SPECIAL || [];
    return L.filter(function (t) { return t.at.city && t.at.city.indexOf(c.id) >= 0; })
      .concat(L.filter(function (t) { return t.at.region && t.at.region.indexOf(c.region) >= 0; }));
  };

  /** 이 항해에 존재하고, 그 화자에게서 새로 얻거나 보강할 수 있는 단서. */
  TR.canTell = function (d, src) {
    var s = S(), D = G.Disc;
    return !!d && d.id !== 'circum' && !d.bookOnly && (!d.tale || s.story) && (!d.song || s.song) &&
      !D.foundByMe(d.id) && (!s.hints[d.id] || D.canStack(d.id, src)) &&
      D.available(d) && D.clueOk(d, src) && (!G.Frontier || G.Frontier.canHint(d, src));
  };

  function ordinary(d) {
    if (!d || TR.isSpecial(d.id)) return false;
    var hot = G.Frontier && G.Frontier.hot(d);
    return hot || (d.how !== 'trade' && d.cat !== 'trade' && d.cat !== 'treasure');
  }

  /** 소문 후보: 아직 찾지 않았고, 들을 수 있고, 주점이 말할 갈래(이야기)이고, 이 도시에서 너무 멀지 않은 것 */
  TR.candidates = function (c, src) {
    var fame = S().player.fame, maxD = fame < 300 ? 1 : fame < 1500 ? 2 : fame < 3500 ? 3 : 5;
    return G.DISCOVERIES.filter(function (d) {
      if (!ordinary(d) || !TR.canTell(d, src)) return false;
      if (d.id === 'mu' || d.id === 'antpeople') return fame > 5000;
      return (G.Frontier && G.Frontier.hot(d)) || G.REGION_DIST[c.region][d.reg] <= maxD;
    });
  };
  /** 가까울수록 무겁다: 지역 거리 + 실제 거리(도) */
  TR.weight = function (c, d, src) {
    var w = 1 / (1 + G.REGION_DIST[c.region][d.reg]);
    if ((d.lat || d.lon) && G.Geo && G.Geo.dist) w *= 1 / (1 + G.Geo.dist(c.lon, c.lat, d.lon, d.lat) / num(B().geo, 15));
    if (G.Frontier && G.Frontier.hot(d)) w *= num(B().hotK, 3);
    return w * G.Disc.rumourW(d, src);
  };
  /** 난이도 층: pw 1~5 */
  TR.tier = function (d) { return d.pw || 3; };

  function fill(c, p, n) {
    var src = 'tavern:' + c.id, have = {};
    p.ids.forEach(function (id) { have[id] = 1; });
    var cand = TR.candidates(c, src).filter(function (d) { return !have[d.id]; });
    var tiers = {};
    cand.forEach(function (d) { var t = TR.tier(d); (tiers[t] = tiers[t] || []).push(d); });
    Object.keys(tiers).map(Number).sort(function (a, b) { return a - b; }).forEach(function (t) {
      var list = tiers[t];
      while (p.ids.length < n && list.length) {
        var pick = U().weighted(list, function (d) { return TR.weight(c, d, src) || 1e-6; });
        p.ids.push(pick.id); list.splice(list.indexOf(pick), 1);
      }
    });
  }
  /** 이 도시 주점의 소문 3건 {d: 정한 날, ids: [발견 id]} — 30일 지나면 새로, 찾은 것은 빼고 채운다 */
  TR.pool = function (c) {
    var s = S(), n = num(B().n, 3), days = num(B().days, 30);
    var all = s.tavernRumor || (s.tavernRumor = {}), p = all[c.id];
    if (!p || s.day - p.d >= days || s.day < p.d) p = all[c.id] = { d: s.day, ids: [] };
    p.ids = p.ids.filter(function (id) { return ordinary(G.DISC[id]) && !G.Disc.foundByMe(id); });
    if (p.ids.length < n) fill(c, p, n);
    return p;
  };
  /** 지금 이 주점에서 꺼낼 소문 하나 — 3건 가운데 아직 여기서 듣지 않은 것, 쉬운 것부터. 없으면 null */
  TR.next = function (c) {
    var src = 'tavern:' + c.id;
    return TR.pool(c).ids.map(function (id) { return G.DISC[id]; }).find(function (d) {
      return ordinary(d) && TR.canTell(d, src);
    }) || null;
  };

  // 오래된 지명이 남거나 행동이 빠져 있던 소문은 발견물마다 직접 쓴다.
  var SPOKEN = {
    capegood: '서아프리카 해안을 따라 내려온 선원들이 그러더군. 남쪽으로만 가던 해안선이 갑자기 동쪽으로 꺾이고, 곶을 돌면 거꾸로 육지가 북쪽에 보인다고.',
    westroute: '대서양 너머에 섬들이 있다는 말이 돌아요. 리스본이나 세빌리아에서 배를 띄워 서쪽으로 건너가 보세요. 카리브해의 섬들이 나타나면 그 바닷길을 이은 셈이죠.',
    indiaroute: '아프리카 남쪽 곶을 돈 배들이 다음에 찾는 게 말라바르 물길이라지요. 곶을 돌아 인도양으로 나아간 뒤 캘리컷이 있는 인도 서해안까지 올라가 보세요.',
    pamukkale: '눈처럼 하얀 언덕에서 김이 오른다지요. 아나톨리아 서쪽 내륙에서 데니즐리 쪽으로 가면, 따뜻한 물이 흰 돌계단마다 고여 있는 곳을 찾을 수 있어요.',
    carnac: '브르타뉴 남쪽 들판에 사람 키보다 큰 돌들이 줄을 맞춰 섰다네. 밭둑이라기엔 줄이 너무 길어서, 해안에서 뭍으로 들어가 돌의 끝이 어디인지 보러 가는 사람도 있지.',
    aurora: '북쪽 바다에서는 밤하늘에도 돛이 걸린다더군. 가을이 깊어 10월이 되면 북위 62도 너머로 나가 보게. 이듬해 3월까지는 밤하늘에 빛이 번지는 걸 볼 수 있대.',
    antpeople: '남쪽 얼음 땅에 누가 산다는 말은 아직 풍문뿐이야. 확인하려거든 남아메리카 쪽에서 더 내려가 남위 62도를 넘은 얼음 바다를 살펴보게.',
    mu: '옛 이야기에는 태평양에 가라앉은 나라가 나온다네. 쿠페의 별길이 가리키는 바다를 살피게. 남위 5도, 서경 170도 부근이라는 말이 있지.',
    t_cacao: '서쪽 땅에서는 잔돈을 세듯 열매의 씨를 세더군요. 볶아서 잔에 풀기도 한답니다. 그 씨를 파는 교역소라면 물건을 보여 달라 해 보세요.',
    t_tobacco: '서쪽 섬에서 배운 선원들은 마른 잎을 말아 불을 붙이더군요. 한 번 피우면 옷에서도 냄새가 나서, 자루를 열기 전부터 무슨 짐인지 알아차릴 정도라니까요.',
    t_maize: '서쪽에서 온 이삭 하나에 노란 알이 수백 개나 붙어 있대요. 가루로 빻아 빵을 만든다니, 곡물 파는 사람에게 이삭째 보여 달라 해 보세요.',
    t_coral: '붉은 가지처럼 생긴 게 배 밑의 얕은 바다에서 올라온다네. 세공사는 금이 가기 전에 색을 보고, 상인은 저울에 올리기 전 흠집부터 본다지.'
  };

  function direction(from, to) {
    return U().dirName(Math.atan2(to.lat - from.lat, G.Geo.wrapLon(to.lon - from.lon)));
  }

  function landmark(c, d, at, land) {
    var range = num(B().geo, 15), startDist = G.Geo.dist(c.lon, c.lat, at.lon, at.lat);
    if (startDist <= range && (land || c.port)) return { town: c, dist: startDist };
    return G.CITY_DATA.reduce(function (best, town) {
      if (!town || town.region !== d.reg || (!land && !town.port) || !G.R.cityExists(town)) return best;
      var dist = G.Geo.dist(town.lon, town.lat, at.lon, at.lat);
      return dist <= range && (!best || dist < best.dist) ? { town: town, dist: dist } : best;
    }, null);
  }

  function buyingPlace(c, d) {
    var s = S(), R = G.R;
    return G.CITY_DATA.reduce(function (best, town) {
      if (!town || d.regions.indexOf(town.region) < 0 || !R.cityExists(town) || !R.facilities(town).trade) return best;
      var lv = s.invest && s.invest[town.id] ? R.investLv(town.id) : 0;
      if (R.cityGoods(town, lv).indexOf(d.good) < 0) return best;
      var dist = G.Geo.dist(c.lon, c.lat, town.lon, town.lat);
      return !best || dist < best.dist ? { town: town, dist: dist } : best;
    }, null);
  }

  /** 실제로 발견되는 방식에 맞춘 마지막 한마디. 돌아다니는 대상에는 오래된 좌표를 쓰지 않는다. */
  TR.route = function (c, d, polite) {
    var D = G.Disc, AT = G.AnimalTracking, text, town, action;
    function end(a, b) { return polite ? b : a; }
    if (G.SeaMonsters && G.SeaMonsters.is(d.id)) return '';    // 발견물의 소문 본문에서 최근 목격지까지 알려 준다.
    if (d.how === 'trade' && d.regions) {
      var seller = buyingPlace(c, d), good = G.GOOD[d.good];
      if (!seller || !good) return '';
      return (c.id === seller.town.id ? '이 도시' : seller.town.name) + ' 교역소에서 ' + U().eul(good.name) +
        ' 한 통 사서' + end(' 살펴보게.', ' 살펴보세요.');
    }
    if (d.how === 'city') {
      if (d.by && D.artistAround(d) && S().date.y >= (d.byFrom || 0)) {
        var maker = G.MATE[d.by];
        if (S().mates.some(function (m) { return m.id === d.by; })) return '일행인 ' + U().j(maker.name, '이/가') + ' 도시에서 그 작품을 보여 줄' + end(' 걸세.', ' 거예요.');
        return '작품을 보려면 만든 사람인 ' + U().j(maker.name, '을/를') + ' 만나 이야기해' + end(' 보게.', ' 보세요.');
      }
      town = G.CITY_DATA[d.city];
      if (!town || !G.R.cityExists(town)) return '';
      text = town.id === c.id ? '이 도시에서 ' : town.name + '에 가서 ';
      if (D.isBuilding(d)) return text + '거리에 있는 그 건물 앞으로 가 직접' + end(' 살펴보게.', ' 살펴보세요.');
      return text + '거리의 건물 안에 들어가 주변을' + end(' 살펴보게.', ' 살펴보세요.');
    }
    var tracks = AT && AT.is(d), land = d.how === 'land';
    if (!land && d.how !== 'sea' && !tracks) return '';   // 항로·오로라 등은 위의 고유 단서에서 조건을 안내한다.
    var at = tracks ? AT.basePos(d) : D.position(d);
    if (!at) return '';
    var anchor = landmark(c, d, at, land);
    text = anchor ? anchor.town.name + (anchor.dist < 0.8 ? ' 가까운 ' : '에서 ' + direction(anchor.town, at) + '쪽 ')
      : '이야기에 나온 고장 주변 ';
    if (land) text += '뭍에 탐험대를 보내 ';
    else text += '물길을 배로 지나며 ';
    action = tracks ? { feather: '깃털', water: '수면의 흔적' }[AT.traceKind(d)] || '발자국' : '';
    return text + (action ? U().eul(action) + ' 눈여겨' : '주변을 찬찬히') + end(' 살펴보게.', ' 살펴보세요.');
  };

  var MATE_OPEN = {
    geo: '해도에는 선이 한 줄이지만, 그 선에 배를 대는 건 다른 일이야.',
    nature: '길을 물을 땐 고장 이름보다 눈에 띄는 지형부터 기억해 두지.',
    creature: '짐승은 먼저 보고 달아나는 법이라, 생김새보다 남긴 흔적이 말을 더 많이 하지.',
    ruin: '옛 기록을 읽을 때는 돌에 남은 것과 사람이 덧붙인 말을 가려 들어야 해.',
    treasure: '값부터 물으면 장사꾼 이야기만 듣지. 그 물건이 어디서 왔는지부터 들어 보게.',
    trade: '짐표에 물건 이름만 적어 두면 다음 장사 때 헤매지. 어디서 살 수 있는지도 같이 적어 두게.',
    people: '다른 배의 이야기를 듣다 보면 먼 곳 사람들의 풍속도 조금씩 알게 되지.'
  };
  function opening(d, voice, m, polite, written) {
    if (voice === 'mate') {
      if (m && d.by === m.id) return polite ? '제 작품 이야기군요. 그 일이라면 제가 아는 대로 말씀드리지요.' : '내 손을 거친 물건이라, 얽힌 이야기는 내가 잘 알지.';
      return polite ? '저라면 이 대목을 항해 일지에 적어 두겠습니다.' : MATE_OPEN[d.cat];
    }
    var known = G.Disc.hasHint(d.id);
    if (voice === 'maid') return known ? '그 얘기, 다른 손님도 하셨어요. 어디서 들었는지까지 물어봤지요.'
      : '술잔을 놓으러 갔다가 솔깃한 말을 들었어요. 행선지를 적어 두면 쓸모가 있겠더라고요.';
    if (voice === 'drinker') return known ? '자네도 들었나? 그럼 내 귀에 들어온 얘기도 들어 보게.'
      : '잔을 한 번만 내려놓게. 선원들끼리 술안주로 넘기기엔 아까운 얘기가 있어.';
    return voice === 'rival' && !written ? '해도에 내가 가 보려는 곳을 짚어 주지.' : '';
  }
  TR.clue = function (c, d, voice, m, written) {
    var polite = voice === 'maid' || (m && m.tone === 'polite');
    var main = written || SPOKEN[d.id] || (d.how === 'trade' ? d.desc0 || d.desc : G.Disc.hintText(d));
    var route = TR.route(c, d, polite);
    if (!written && !SPOKEN[d.id] && d.discStoryNew && main && d.how !== 'trade') {
      main = (polite ? '항해 기록에는 이렇게 적혀 있어요. ' : '항해 기록에는 이렇게 적혀 있네. ') + '「' + main + '」';
    }
    return [opening(d, voice, m, polite, written), main, route].filter(Boolean).join('\f');
  };

  // ---------------------------------------------------------------- 특별 소문 · 증거품
  function hasEv(t) { return S().player.items.some(function (it) { return it.kind === 'clue' && it.sp === t.id; }); }
  /** 지금 주인이 꺼낼 특별 소문 — 열린 발견이고, 아직 찾지 않았고, 증거품을 아직 사지 않은 것 */
  TR.special = function (c) {
    var s = S();
    return TR.specialsAt(c).filter(function (t) {
      var d = G.DISC[t.disc];
      return d && (!d.tale || s.story) && (!d.song || s.song) && !G.Disc.foundByMe(d.id) &&
        G.Disc.available(d) && !hasEv(t);
    })[0] || null;
  };
  TR.evPrice = function (t) { return Math.round((t.ev.price || 800) * num(B().evK, 1)); };
  /** 술집 주인이 특별 소문을 꺼내고 증거품을 권한다 (T.drink). 꺼냈으면 true */
  TR.tellSpecial = async function (c, who) {
    var t = TR.special(c); if (!t) return false;
    var s = S(), UI = G.UI, d = G.DISC[t.disc], st = (s.tavernSp = s.tavernSp || {}), told = st[t.id];
    var src = 'special:' + c.id;
    if (told == null) {
      var text = TR.clue(c, d, 'keeper', null, t.line);
      await G.Scenes.city.say(who, text);
      if (S() !== s) return true;
      st[t.id] = s.day;
      G.Disc.noteHint(d, src, {
        record: 'evidence', title: d.name + ' 단서', body: text.split('\f').join('\n\n'), source: c.name + ' · ' + who.name
      });
    } else await G.Scenes.city.say(who, '전에 말한 그 이야기 말일세 — ' + t.ev.name + U().jx(t.ev.name, '은/는') + ' 아직 내가 갖고 있네.');
    var price = TR.evPrice(t);
    var ok = await UI.confirm('「' + U().esc(t.ev.name) + '」<div class="muted" style="font-size:16px;margin-top:6px">' + U().esc(t.ev.desc) + '</div>' +
      '<div style="font-size:16px;margin-top:6px">금화 ' + U().num(price) + '닢에 사겠습니까? 가지고 있으면 이 이야기의 단서가 한 겹 더 쌓입니다.</div>', '산다', '그만둔다', '주점의 증거품');
    if (!ok) { await G.Scenes.city.say(who, '생각이 바뀌면 다시 오게. 이건 이 고장에서만 구할 수 있네.'); return true; }
    if (s.player.gold < price) { await G.Scenes.city.mate('제독, 금화가 모자랍니다.'); return true; }
    if (G.R.itemsFull && G.R.itemsFull()) { await G.Scenes.city.mate('제독, 소지품이 가득합니다. 무언가를 버려야 받을 수 있습니다.'); return true; }
    s.player.gold -= price;
    s.player.items.push({ id: 'clue_' + t.id, kind: 'clue', sp: t.id, clue: d.id, name: t.ev.name,
      desc: t.ev.desc + ' — 「' + d.name + '」의 단서를 뒷받침한다.' });
    var item = s.player.items[s.player.items.length - 1];
    var record = { record: 'evidence', title: t.ev.name, body: t.ev.name + U().jx(t.ev.name, '을/를') + ' 손에 넣었다.\n\n' + t.ev.desc + '\n\n' + G.Disc.hintText(d), img: G.Disc.proofSrc ? G.Disc.proofSrc(item) : '', source: c.name + ' 술집' };
    var r = G.Disc.noteHint(d, 'evidence:' + t.id, record);
    if (!r) UI.toast(t.ev.name + U().jx(t.ev.name, '을/를') + ' 손에 넣었다.', 'scroll', null, record);
    if (G.Game.refreshHud) G.Game.refreshHud();
    return true;
  };
})(window.G = window.G || {});
