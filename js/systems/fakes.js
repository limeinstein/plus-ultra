/* 모조품(가짜 증거) — 발견물이 있을 것으로 짐작되는 고장의 시장에서 그 발견물의 모조품을 사서 보고에 쓴다.
   - 사기: 단서를 들었거나 계약한 발견물(보물·유적·생물·민족·자연)을, 그 자리에서 12° 안 도시의 시장 「모조품 상인」에게서 (값: 가치의 12%)
     상인은 달마다 7일(BALANCE.fakes.day)에만, 중도시 이상(G.CityIcon.tier ≥ minTier — 수도 포함)의 시장에 나오고, 한 번 나올 때 2개(stock)만 판다
   - 보고할 때 고르기: 진짜만 / 모조품만 / 둘 다 (찾지 못했어도 모조품만으로 보고할 수 있다)
   - 모조품만: 후원자(군주)의 감식안에 따라 들킬 수 있다 → 벌금, 또는 붙잡혀 옥살이(날이 흐른다). 안 들키면 제값
   - 둘 다: 진짜와 똑같이 만든 모조품까지 바치면 감동해 사례금 ×1.3, 신뢰가 더 오른다
   - 이중 계약: 이미 다른 후원자에게 보고한 발견물을 모조품을 증거로 또 팔면, 먼저 보고받은 후원자가 추격자(한 번)를 보내 바다에서 덮친다
   상태: state.fakes = {발견물 id: 개수}, state.disc[id].fakeTo = [후원자 id …] (못 찾은 채 모조품으로 보고한 곳), state.chaser = {sp, disc} */
(function (G) {
  'use strict';
  var F = {}, U = G.U, UI = G.UI, R = G.R;
  G.Fakes = F;
  function S() { return G.Game.state; }
  function B() { return (G.BALANCE && G.BALANCE.fakes) || {}; }
  var CATS = { treasure: 1, ruin: 1, creature: 1, people: 1, nature: 1 };
  F.NEAR = 12;

  F.count = function (id) { var f = S().fakes; return (f && f[id]) || 0; };
  F.give = function (id, n) { var s = S(); s.fakes = s.fakes || {}; s.fakes[id] = (s.fakes[id] || 0) + (n || 1); if (s.fakes[id] <= 0) delete s.fakes[id]; };
  F.list = function () { var f = S().fakes || {}; return Object.keys(f).filter(function (id) { return f[id] > 0 && G.DISC[id]; }).map(function (id) { return G.DISC[id]; }); };
  /** 모조품을 만들 수 있는 발견물 (자리가 있는 물건·짐승·사람의 자취) */
  F.fakeable = function (d) { return !!(d && CATS[d.cat] && (d.how === 'land' || d.how === 'sea' || d.how === 'city') && d.lon != null && !(d.lat === 0 && d.lon === 0)); };
  F.price = function (d) { return Math.max(300, Math.round(d.val * (B().priceK || 0.12) / 100) * 100); };
  /** 이 도시 시장에서 살 수 있는 모조품: 단서를 들었거나 계약한 것, 그 자리가 가까운 것 */
  F.forSale = function (c) {
    var s = S(), k = s.contract;
    return G.DISCOVERIES.filter(function (d) {
      if (!F.fakeable(d) || F.count(d.id)) return false;
      if (!(s.hints[d.id] || (k && k.disc === d.id) || G.Disc.foundByMe(d.id))) return false;
      if (d.how === 'city' ? d.city === c.id : false) return true;
      if (d.homeCity === c.id) return true;
      return G.Geo.dist(c.lon, c.lat, d.lon, d.lat) <= F.NEAR;
    });
  };
  /** 상인이 오늘 이 도시 시장에 나왔는가: 그달 7일 · 중도시 이상 */
  F.open = function (c) {
    var s = S(), b = B(), tier = G.CityIcon ? G.CityIcon.tier(c) : (c.size || 1);
    return !!(c && s.date.d === (b.day || 7) && tier >= (b.minTier || 2));
  };
  /** 이번에 나온 상인의 장부 (도시·날짜가 바뀌면 새로 연다) */
  function shop(c) {
    var s = S(), key = c.id + '@' + s.date.y + '-' + s.date.m + '-' + s.date.d;
    if (!s.fakeShop || s.fakeShop.key !== key) s.fakeShop = { key: key, sold: 0 };
    return s.fakeShop;
  }
  F.left = function (c) { return Math.max(0, (B().stock || 2) - shop(c).sold); };
  /** 오늘 상인이 내놓은 물건: 살 수 있는 것 가운데 남은 수만큼 (계약 목표가 먼저, 나머지는 도시·날짜로 정한 순서라 다시 들어와도 같다) */
  F.stock = function (c) {
    if (!F.open(c)) return [];
    var s = S(), k = s.contract, sh = shop(c), n = F.left(c);
    if (!n) return [];
    return F.forSale(c).sort(function (a, b) {
      var pa = k && k.disc === a.id ? 0 : 1, pb = k && k.disc === b.id ? 0 : 1;
      return pa - pb || U.strHash(sh.key + a.id) - U.strHash(sh.key + b.id);
    }).slice(0, n);
  };
  /** 시장 메뉴에 상인을 보일까: 오늘 나왔고, 팔 것이 있거나 이미 다 팔았을 때 */
  F.shown = function (c) { return F.open(c) && (F.stock(c).length > 0 || shop(c).sold > 0); };
  F.buy = async function (c) {
    var s = S(), who = G.Scenes.city.npc ? G.Scenes.city.npc('vendor', '골목의 상인') : { name: '골목의 상인' };
    if (!F.open(c)) { await UI.say('모조품 상인은 오늘 자리를 비웠다. 달마다 7일에만 나온다고 한다.', who); return; }
    var list = F.stock(c);
    if (!list.length && shop(c).sold) { await UI.say('오늘 내놓을 물건은 다 팔았소. 한 번에 두 개 넘게 만들면 솜씨가 들통나거든. 다음 달 7일에 다시 오시오.', who); return; }
    if (!list.length) { await UI.say('찾는 물건이 뭔지 알아야 만들어 드리지요. 이 고장 근처에서 찾는다는 물건 이야기를 듣고 오시오.', who); return; }
    await UI.say(U.pick(['쉿, 목소리를 낮추시오. 진짜와 똑같이 만들어 드리지. 어지간한 눈으로는 가려내지 못할 거요.', '이 근처에서 났다는 그 물건 말이오? 솜씨 좋은 장인이 있지요. 값만 치르시면 됩니다.']), who);
    if (shop(c).sold === 0) await UI.say('달에 한 번, 7일에만 나오고 한 번에 두 개만 파오. 오늘 내놓은 건 이것뿐이오.', who);
    for (;;) {
      var pick = await UI.choose('모조품 상인', list.map(function (d, i) {
        var f = G.Disc.foundByMe(d.id);
        return { label: '「' + d.name + '」의 모조품' + (f ? ' <span class="tag">진짜도 가짐</span>' : ''), right: '금화 ' + U.num(F.price(d)) + '닢', value: i, icon: 'seal',
          desc: (G.DISC_CATS[d.cat] || '') + ' · ' + (f ? '진짜와 함께 바치면 더 큰 감동을 줄 수 있다' : '찾지 못했어도 이것으로 보고할 수 있다 — 다만 들키면 큰일') };
      }), { width: 700, text: '소지금 ' + U.num(s.player.gold) + '닢 · 오늘 남은 물건 ' + F.left(c) + '개' });
      if (pick == null) return;
      var d = list[pick], p = F.price(d);
      if (s.player.gold < p) { UI.toast('금화가 모자랍니다.', 'coin'); continue; }
      s.player.gold -= p; F.give(d.id, 1); shop(c).sold++; G.Game.refreshHud();
      G.State.log('「' + d.name + '」의 모조품을 샀다. (금화 ' + p + ')');
      UI.toast('「' + d.name + '」의 모조품을 샀다.', 'seal', 3600);
      list = F.stock(c);
      if (!list.length) { if (!F.left(c)) await UI.say('오늘 몫은 이걸로 끝이오. 다음 달 7일에 다시 오시오.', who); return; }
    }
  };

  /** 후원자(군주)의 감식안 0~100: 그 자리 사람마다 다르다(이름으로 정해짐), 학자·교황은 더 밝고, 세력이 클수록 감정사가 많다 */
  F.eye = function (sp) {
    var name = G.Sponsor.holderName(sp), h = U.strHash('eye' + name) % 45;
    var t = { scholar: 18, pope: 12, priest: 8, merchant: 6, king: 0, noble: 0, gov: 4, official: 6 }[sp.type] || 0;
    return U.clamp(32 + h + t + sp.pw * 3, 20, 98);
  };
  F.eyeText = function (sp) { var e = F.eye(sp); return e >= 75 ? '눈이 매섭기로 소문난 분' : e >= 55 ? '꼼꼼히 살피는 분' : '너그럽고 대범한 분'; };
  F.detectP = function (sp) {
    var rd = function (id) { return R.skillRead ? R.skillRead(id) : R.skill(id); };
    return U.clamp(0.06 + (F.eye(sp) - 30) / 110 - rd('craft') * 0.05 - rd('art') * 0.03, 0.05, 0.8);
  };

  /** 보고할 때 무엇을 내밀지 — 'real' | 'fake' | 'both' | null(그만둔다). found: 진짜를 찾았는가 */
  F.choose = async function (sp, d, found) {
    var hasFake = F.count(d.id) > 0;
    if (!hasFake) return found ? 'real' : null;
    var opts = [];
    if (found) { opts.push({ label: '진짜와 모조품을 함께 바친다', value: 'both' }); opts.push({ label: '진짜만 보고한다', value: 'real' }); }
    opts.push({ label: '모조품만 내민다' + (found ? '' : ' (아직 찾지 못했다)'), value: 'fake' });
    opts.push({ label: '그만둔다', value: null });
    return UI.ask('「' + d.name + '」 — 무엇을 증거로 내밀까?\n' + G.Sponsor.holderName(sp) + U.jx(G.Sponsor.holderName(sp), '은/는') + ' ' + F.eyeText(sp) + '이다.', opts, { name: S().player.name, portrait: S().player.portrait });
  };

  /** 모조품만 내밀었을 때: 들키면 벌을 받고 false, 안 들키면 true. reward: 받을 사례금(벌금의 기준) */
  F.tryFake = async function (sp, d, reward) {
    var s = S(), who = G.Sponsor.speaker(sp), rel = G.Sponsor.rel(sp.id);
    F.give(d.id, -1);                                    // 들키든 안 들키든 손을 떠난다
    if (!U.chance(F.detectP(sp))) return true;
    await UI.say(U.pick(['……잠깐. 이 칠의 결, 이 금빛은 어제오늘 입힌 것이로군. 나를 속이려 들다니!', '감정사, 이리 와서 보게. ……역시 그렇군. 이건 가짜야! 감히 나를 우롱하는가!']), who);
    var harsh = ['king', 'pope', 'gov', 'noble', 'official'].indexOf(sp.type) >= 0;
    var arrestP = harsh ? (B().arrestBase || 0.3) + sp.pw * 0.08 : 0.12;
    var fine = Math.max(800, Math.round(reward * (B().fineK || 0.6) / 100) * 100);
    var can = s.player.gold + (s.player.bank || 0) >= fine;
    rel.trust = 0; rel.fail = (rel.fail || 0) + 1;
    if (s.contract && s.contract.sponsor === sp.id) s.contract = null;
    if (U.chance(arrestP) || !can) {
      var days = (B().jailBase || 20) + sp.pw * 12 + U.ri(0, 25);
      await UI.say('저자를 끌어내 옥에 가두어라! 사기꾼에게 줄 자비는 없다.', who);
      rel.banned = U.dateNum(U.addDays(s.date, 365));
      s.player.jailed = (s.player.jailed || 0) + 1;
      var lost = Math.round(s.player.fame * 0.1); if (G.Fame) lost = -G.Fame.add(null, -lost); else s.player.fame -= lost;
      await UI.fade(function () { G.Game.passDays(days); });
      G.State.log('모조품이 들통나 ' + days + '일 동안 옥살이를 했다. (명성 −' + lost + ')');
      await UI.alert('모조품이 들통나 붙잡혔다.<br>' + days + '일 동안 옥에 갇혀 있다가 풀려났다. 명성 −' + lost + '<br><span class="muted">' + G.Sponsor.holderName(sp) + U.jx(G.Sponsor.holderName(sp), '은/는') + ' 한 해 동안 만나 주지 않는다.</span>');
    } else {
      var pay = Math.min(s.player.gold, fine); s.player.gold -= pay; s.player.bank = (s.player.bank || 0) - (fine - pay);
      await UI.say('벌금 금화 ' + U.num(fine) + '닢을 내고 내 눈앞에서 사라지게. 다시는 이런 짓을 하지 마라.', who);
      G.State.log('모조품이 들통나 벌금 ' + fine + '닢을 냈다.');
      await UI.alert('모조품이 들통나 벌금 금화 ' + U.num(fine) + '닢을 냈다.<br><span class="muted">신뢰를 모두 잃었다.</span>');
    }
    G.Game.refreshHud();
    return false;
  };

  /** 보고를 마친 뒤: 못 찾은 채 모조품으로 보고했으면 적어 두고, 이미 다른 후원자에게 보고한 것을 또 팔았으면(이중 계약) 추격자가 온다 */
  F.after = function (sp, d, ev, found) {
    var s = S(), st = s.disc[d.id] = s.disc[d.id] || {};
    var before = [].concat(st.reported && st.reported !== sp.id && st.reportedPrev !== sp.id ? [st.reportedPrev || st.reported] : [], (st.fakeTo || []).filter(function (x) { return x !== sp.id; }));
    if (!found) { st.fakeTo = (st.fakeTo || []).concat([sp.id]); }
    var prev = before.filter(function (x) { return x && x !== sp.id && G.SPONSOR[x]; })[0];
    if (prev) {
      s.chaser = { sp: prev, disc: d.id, since: U.dayIndex(s.date) };
      UI.toast('「' + d.name + '」' + U.jx(d.name, '을/를') + ' 두 곳에 팔았다는 소문이 ' + G.Sponsor.holderName(G.SPONSOR[prev]) + '의 귀에 들어갈지도 모른다…', 'skull', 5200);
      var pn = G.Sponsor.holderName(G.SPONSOR[prev]); G.State.log('「' + d.name + '」' + U.jx(d.name, '을/를') + ' 이중으로 보고했다 — ' + pn + U.jx(pn, '이/가') + ' 추격자를 보낸다.');
    }
  };
  /** 이미 다른 후원자에게 보고했거나 모조품으로 판 발견물인가 (이중 계약이 된다) */
  F.soldElsewhere = function (sp, d) { var st = S().disc[d.id] || {}; return !!((st.reported && st.reported !== sp.id) || (st.fakeTo || []).some(function (x) { return x !== sp.id; })); };

  /** 바다: 배신당한 후원자가 보낸 추격자 (한 번) — sea.js spawnNpcs 가 부른다 */
  F.spawnChaser = function (npcs) {
    var s = S(), ch = s.chaser; if (!ch || npcs.some(function (x) { return x.chaser; })) return null;
    if (U.dayIndex(s.date) - ch.since < 3 || !U.chance(0.25)) return null;     // 소문이 닿을 시간
    var sp = G.SPONSOR[ch.sp]; if (!sp) { s.chaser = null; return null; }
    var l = s.loc;
    for (var t = 0; t < 8; t++) {
      var a = U.rf(0, Math.PI * 2), dd = U.rf(3, 5), lon = l.lon + Math.cos(a) * dd, lat = l.lat + Math.sin(a) * dd;
      if (!G.Geo.isSea(lon, lat, 1)) continue;
      var zone = G.Ships.zone(lon, lat), cnt = Math.min(4, 1 + Math.floor(sp.pw / 2) + U.ri(0, 1)), K = Math.min(1, 0.4 + sp.pw * 0.1);
      var n = { id: 'chaser_' + ch.sp, kind: 'navy', chaser: ch.sp, nation: sp.nation || null, lon: lon, lat: lat, heading: Math.atan2(l.lat - lat, G.Geo.wrapLon(l.lon - lon)),
        n: cnt, K: K, spd: U.rf(1.3, 1.6), life: 30, hostile: true, zone: zone, ships: G.Ships.enemyTypes('navy', zone, sp.nation || null, cnt, K, s.date.y) };
      var hn = G.Sponsor.holderName(sp); n.label = hn + U.jx(hn, '이/가') + ' 보낸 추격자';
      UI.toast('수평선에 ' + n.label + U.jx(n.label, '이/가') + ' 나타났다! 「' + (G.DISC[ch.disc] ? G.DISC[ch.disc].name : '') + '」의 일로 우리를 쫓는다!', 'skull', 5200);
      return n;
    }
    return null;
  };
  /** 추격자와 맞닥뜨림 — 싸우든 달아나든 한 번뿐 */
  F.chaserMet = function (n) { var s = S(); if (s.chaser && s.chaser.sp === n.chaser) { s.chaser = null; G.State.log(n.label + U.jx(n.label, '와/과') + ' 맞닥뜨렸다.'); } };
})(window.G = window.G || {});
