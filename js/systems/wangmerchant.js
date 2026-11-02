/* 중국 근해의 떠돌이 상선 — 마대인과 딸 지나, 비단 장수 왕서방 (G.WangMerch) 2026-11-02 사용자 요청. 사람·조정값: js/data/wangmerchant.js (G.BALANCE.wangMerch)
   ■ 만남: 중국 근해(box)를 항해하는 바다의 하루 끝마다 chance (처음엔 firstChance) — 한 번 만나면 cool일 동안은 없다. (js/scenes/sea.js 가 부른다)
   ■ 흐름
     ① 금봉호가 다가온다. 마대인과 딸 지나, 비단 장수 왕서방. (1567년 해금이 풀리기 전에는 몰래 하는 바다 장사라고 귀띔한다)
     ② 왕서방: 짐칸에 조선 항구에서 산 몫이 있으면 「명월이 사는 동네 물건」이라며 최근에 본 값의 korea배로 사 준다 (팔지 말지 고른다)
     ③ 금봉호의 짐: 견직물·도자기·차를 품목마다 stock(700~1000)통 — 제독이 「최근에 본 값」(시세 수첩에 적힌 가장 최근의 사는 값, 없으면 파는 값, 그것도 없으면 본디 값)의 ratio(70%)
     ④ 후려치기 교섭 (고르면): 수법마다 한 번씩 —
          흠을 잡는다(세공) −6%p · 금화 상자를 연다(소지금이 넉넉해야) −5%p · 마대인을 치켜세운다(웅변) −7%p · 돌아서는 척한다 −9%p (들키면 값이 도로 오른다)
        성공률: 회계(일행에서 가장 잘하는 사람)·매력·중국어·경리. 거절이 patience번(경리가 있으면 +1) 쌓이면 지나가 장부를 덮는다. floor(45%) 아래로는 안 내려간다.
     ⑤ 산다: 품목을 골라 실을 수 있는 만큼(짐칸·무게·소지금·재고·품목 수) — 산 곳은 가장 가까운 명나라 항구로 적는다.
     ⑥ 거래(사거나 조선 물건을 판 만남)가 joinDeals(3)번이 되면 지나가 「장부 너머의 세상을 보고 싶다」며 제독을 따라온다(동료).
        그 뒤로 금봉호를 만나면 값은 마대인이 부르고, 지나는 제독 편에서 아버지의 값을 후려친다(성공률 +jinaOdds).
   ■ 저장: s.wangMerch = { met, cool, day: 굴린 날, hit, deals: 거래한 만남 수, korea: 조선 물건을 판 번 수, jina: 지나가 따라온 날 } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var WM = G.WangMerch = {};
  function K() { return G.BALANCE.wangMerch; }
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.wangMerch || (s.wangMerch = {}); }
  function H(id) { return G.Hist ? G.Hist.speaker('wm_' + id) : { name: id, lang: 3 }; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  /** 지나가 제독의 배에 있나 */
  WM.jinaAboard = function () { return !!row('jina'); };
  function seller() { return WM.jinaAboard() ? 'ma' : 'jina'; }   // 값을 부르는 사람
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) {
    if (k === 'P') return me();
    if (k === 'purser') { var pu = R.purser(); return pu && G.Legend && G.Legend.speaker ? G.Legend.speaker(pu.id) : pu ? { name: pu.name, portrait: G.Scenes.mateSpec(pu.id), lang: 3 } : me(); }
    if (k === 'first') return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    if (k === 'jina' && WM.jinaAboard() && G.Legend && G.Legend.speaker) return G.Legend.speaker('jina');
    return k ? H(k) : {};
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  function today() { return U.dateNum(S().date); }
  function num(n) { return U.num(Math.round(n)); }
  function pct(r) { return Math.round(r * 100) + '%'; }

  // ================================================================ 값
  /** 제독이 최근에 본 값 {p, city, kind: 'buy'|'sell'|'base'} — 시세 수첩(js/systems/ledger.js)에서 가장 최근의 사는 값, 없으면 파는 값, 그것도 없으면 본디 값 */
  WM.seen = function (id) {
    var s = S(), book = s.ledger || {}, g = G.GOOD[id], best = null;
    for (var cid in book) {
      var row = book[cid]; if (!row) continue;
      var b = row.b && row.b[id];
      if (b > 0 && (!best || best.kind !== 'buy' || row.t > best.t)) best = { p: b, city: +cid, kind: 'buy', t: row.t };
    }
    if (best) return best;
    for (var cid2 in book) {
      var r2 = book[cid2]; if (!r2 || !r2.s || g.idx == null) continue;
      var sp = r2.s[g.idx];
      if (sp > 0 && (!best || r2.t > best.t)) best = { p: sp, city: +cid2, kind: 'sell', t: r2.t };
    }
    return best || { p: g.p, city: null, kind: 'base', t: null };
  };
  /** 금봉호가 부르는 1통 값 */
  WM.price = function (id, ratio) { return Math.max(1, Math.round(WM.seen(id).p * ratio)); };

  // ================================================================ 조선 물건 (왕서방)
  function koreaCity(cid) { var c = G.CITY_DATA[cid]; return !!(c && /조선/.test(c.nation || '')); }
  /** 짐칸 가운데 조선 항구에서 산 몫 [{id, q, cost}] */
  WM.koreaLots = function () {
    var c = S().fleet.cargo || {}, out = [];
    for (var id in c) {
      var cg = c[id]; if (!cg || !(cg.q > 0) || !G.GOOD[id]) continue;
      var L = R.cargoLots(cg), q = 0, cost = 0;
      for (var k in L) if (koreaCity(+k) && L[k].q > 0) { q += L[k].q; cost += L[k].q * L[k].cost; }
      q = Math.min(q, cg.q);
      if (q > 0) out.push({ id: id, q: q, cost: cost });
    }
    return out;
  };
  /** 왕서방이 사 주는 1통 값 */
  WM.koreaPrice = function (id) { var sn = WM.seen(id); return Math.max(1, Math.round(Math.max(sn.p, G.GOOD[id].p) * K().korea)); };
  function sellKorea(lots) {
    var s = S(), gold = 0, profit = 0, parts = [];
    lots.forEach(function (x) {
      var cg = s.fleet.cargo[x.id]; if (!cg) return;
      var L = R.cargoLots(cg), left = x.q, cost = 0;
      for (var k in L) { if (!left) break; if (!koreaCity(+k)) continue; var t = Math.min(left, L[k].q); L[k].q -= t; cost += t * L[k].cost; left -= t; if (!(L[k].q > 0)) delete L[k]; }
      var q = x.q - left, p = WM.koreaPrice(x.id), got = q * p;
      cg.q -= q;
      if (cg.q <= 0) delete s.fleet.cargo[x.id];
      else { var n = 0, c2 = 0; for (var k2 in L) { n += L[k2].q; c2 += L[k2].q * L[k2].cost; } if (n) cg.cost = Math.round(c2 / n); }
      gold += got; profit += got - cost; parts.push(G.GOOD[x.id].name + ' ' + q + '통');
    });
    s.player.gold += gold; if (s.stats) s.stats.profit = (s.stats.profit || 0) + profit;
    return { gold: gold, profit: profit, text: parts.join(' · ') };
  }

  // ================================================================ 후려치기 교섭
  var TACTICS = [
    { id: 'flaw', label: '흠을 잡는다 — 비단 올이 굵고 찻잎에 줄기가 섞였다', cut: 0.06, skill: 'craft' },
    { id: 'cash', label: '금화 상자를 열어 보인다 — 현찰로 한꺼번에', cut: 0.05, cash: true },
    { id: 'flatter', label: '마대인을 치켜세운다 — 남쪽 바다의 큰손', cut: 0.07, skill: 'speech' },
    { id: 'walk', label: '돌아서는 척한다 — 「광주에 가면 더 싸다」', cut: 0.09, bluff: true }
  ];
  WM.TACTICS = TACTICS;
  /** 이 수법이 먹힐 확률 */
  WM.odds = function (t, offerTotal) {
    var acct = R.skillBest('acct').lv, cha = R.stat('cha') || 50, zh = R.langBest ? R.langBest(7).lv : 0, pu = R.purser();
    var p = 0.30 + acct * 0.10 + (cha - 50) * 0.004 + zh * 0.05 + (pu ? 0.08 : 0) + (WM.jinaAboard() ? 0.12 : 0);   // 지나가 제독 편이면 아버지의 셈을 훤히 안다
    if (t.skill) p += R.skillBest(t.skill).lv * 0.08;
    if (t.cash) p += S().player.gold >= offerTotal ? 0.15 : -0.2;
    if (t.bluff) p -= 0.05;
    return U.clamp(p, 0.08, 0.9);
  };
  var JINA_NO = {
    flaw: ['jina', '(비단을 불빛에 비춰 보이며) 올이 굵다고요? 이건 항주 비단이에요. 제 장부에 거짓말은 한 줄도 없답니다.'],
    cash: ['jina', '금화 냄새는 좋네요. 하지만 금화는 광주에도 있어요, 제독님.'],
    flatter: ['wang', '(킥킥 웃으며) 대인 형님, 칭찬은 공짜인데 비단은 공짜가 아니지요. 지나 아가씨가 다 듣고 계십니다.'],
    walk: ['jina', '(부채로 입을 가리며) 가세요, 가세요. 광주 세관에서 웃돈 얹어 사시면 되겠네요. …돌아오실 줄 알았어요.']
  };
  var MA_NO = {   // 지나가 제독의 배에 오른 뒤 — 값은 마대인이 부른다
    flaw: ['ma', '흠? 그 눈썰미, 우리 지나한테 배웠구려. 그래도 이건 항주 비단이오. 깎을 데가 없소.'],
    cash: ['ma', '금화는 좋지. 하지만 내 딸이 그쪽 배에 탔다고 값까지 내려 줄 줄 아시오?'],
    flatter: ['wang', '(킥킥) 형님, 칭찬은 공짜인데 비단은 공짜가 아니지요. 저쪽 배에서 지나 아가씨가 웃고 있습니다.'],
    walk: ['ma', '가시오, 가시오! …(딸을 힐끔 보며) 정말 가는 거요? 지나야, 너도 가는 거냐?']
  };
  var MA_YES = {
    flaw: ['ma', '흠, 흠! 눈이 매서운 손님이구려. 지나야, 저 정도 눈이면 조금 빼 주자.'],
    cash: ['ma', '허허, 상자째로! 바다 위에서 이렇게 시원한 손님은 오랜만이오. 좋소, 깎아 주지.'],
    flatter: ['ma', '하하하! 그렇지, 이 남쪽 바다에서 마대인 모르는 사람이 없지! …지나야, 이 손님은 사람 볼 줄 아는구나. 조금 빼 주자.'],
    walk: ['jina', '…잠깐만요! (주판알을 튕기더니 한숨) 알았어요. 이 값이면 되겠어요? 이번만이에요.']
  };
  var MA_YES2 = { walk: ['ma', '…잠깐! (주판을 서툴게 튕기며) 지나가 없으니 셈이 느리구먼. 알았소, 이 값이면 되겠소?'] };
  function noLine(v) { return (WM.jinaAboard() ? MA_NO : JINA_NO)[v]; }
  function yesLine(v) { return WM.jinaAboard() && MA_YES2[v] ? MA_YES2[v] : MA_YES[v]; }
  async function haggle(o) {
    var k = K(), pu = R.purser(), ratio = o.ratio, fails = 0, maxFail = k.patience + (pu ? 1 : 0), used = {};
    var talker = pu ? 'purser' : 'P';
    if (WM.jinaAboard()) await play([['jina', '아버지, 이번엔 제가 이쪽 편이에요. 금봉호 값에 바람이 얼마나 들었는지는 제가 제일 잘 알거든요.'], ['ma', '허허, 내 딸이 내 값을 깎는구나. 장사꾼 집안에서 이보다 무서운 일이 없지!']]);
    else await play([[talker, pu ? '제독님, 셈은 제게 맡기십시오. 바다 위 장사꾼이 부르는 값에는 늘 바람이 들어 있습니다.' : '자, 그 값에서 조금 더 이야기해 봅시다.'],
      ['jina', '어머, 후려치시려고요? 좋아요. 우리 집 장부는 제가 쥐고 있으니 저랑 하세요.']]);
    for (;;) {
      var left = TACTICS.filter(function (t) { return !used[t.id]; });
      if (!left.length || fails >= maxFail || ratio <= k.floor + 1e-9) break;
      var total = Math.round(k.goods.reduce(function (a, id) { return a + WM.price(id, ratio) * 300; }, 0));
      var opts = left.map(function (t) { return { label: t.label + ' (' + Math.round(WM.odds(t, total) * 100) + '%)', value: t.id }; });
      opts.push({ label: '이 값(' + pct(ratio) + ')으로 하자', value: 'stop' });
      var v = await UI.ask('후려치기 — 지금 ' + pct(ratio) + ' · 거절 ' + fails + '/' + maxFail, opts, who(seller()));
      if (v === 'stop' || !v) break;
      var t = TACTICS.filter(function (x) { return x.id === v; })[0]; used[v] = 1;
      if (U.chance(WM.odds(t, total))) {
        ratio = Math.max(k.floor, ratio - t.cut);
        await play([yesLine(v)]);
        UI.toast('후려치기 성공 — 이제 최근에 본 값의 ' + pct(ratio), 'scales', 3800);
        if (G.Growth && G.Growth.haggle) G.Growth.haggle();
      } else {
        fails++;
        await play([noLine(v)]);
        if (t.bluff) { ratio = Math.min(o.ratio0, ratio + k.bluffBack); UI.toast('돌아서는 척이 들켰다 — 값이 ' + pct(ratio) + '로 도로 올랐다', 'scales', 3800); }
        else UI.toast('거절당했다 — ' + pct(ratio) + ' 그대로', 'scales', 3200);
      }
    }
    if (fails >= maxFail) await play([WM.jinaAboard() ? ['ma', '(부채를 탁 접으며) 여기까지요. 딸이 저쪽에 있어도 장사는 장사요.'] : ['jina', '(장부를 탁 덮으며) 여기까지예요. 더 깎으면 우리 배가 가라앉아요.']]);
    else if (ratio <= k.floor + 1e-9) await play([WM.jinaAboard() ? ['ma', '이 이상은 안 되오! 지나 이 녀석, 아비 배를 통째로 넘기려는 게냐!'] : ['ma', '지나야, 이 이상은 안 된다! 이러다 금봉호를 통째로 넘기겠다!']]);
    return ratio;
  }

  // ================================================================ 사기
  function nearPort() {
    var s = S(), l = s.loc, best = null, bd = 1e9;
    K().ports.forEach(function (cid) { var c = G.CITY_DATA[cid]; if (!c) return; var d = Math.abs(c.lon - l.lon) + Math.abs(c.lat - l.lat); if (d < bd) { bd = d; best = cid; } });
    return best != null ? best : 175;
  }
  /** 이 품목을 몇 통까지 살 수 있나 (짐칸·무게·소지금·재고·품목 수) */
  WM.canBuy = function (id, price, stock) {
    var s = S(), c = s.fleet.cargo || {};
    if (!c[id] && Object.keys(c).length >= R.maxKinds()) return 0;
    var room = G.Cargo && G.Cargo.room ? G.Cargo.room(id) : R.free();
    return Math.max(0, Math.min(stock, Math.floor(room), Math.floor(s.player.gold / Math.max(1, price))));
  };
  function load(id, q, price, cityId) {
    var s = S(), f = s.fleet, cg = f.cargo[id];
    if (cg) { R.addCargoLot(cg, cityId, q, price); cg.cost = Math.round((cg.cost * cg.q + price * q) / (cg.q + q)); cg.d = Math.round(((cg.d || s.day) * cg.q + s.day * q) / (cg.q + q)); cg.q += q; }
    else { f.cargo[id] = { q: q, cost: price, from: cityId, d: s.day, lots: {} }; f.cargo[id].lots[cityId] = { q: q, cost: price }; }
    s.player.gold -= q * price;
  }
  async function shop(o) {
    var k = K(), port = nearPort(), bought = [];
    for (;;) {
      var opts = k.goods.map(function (id) {
        var p = WM.price(id, o.ratio), n = WM.canBuy(id, p, o.stock[id]);
        return { label: G.GOOD[id].name + ' — 1통 ' + num(p) + '닢 · 남은 ' + o.stock[id] + '통 · 지금 실을 수 있는 ' + n + '통', value: id, dis: !n };
      });
      opts.push({ label: '그만 산다', value: 'done' });
      var v = await UI.ask('금봉호의 짐 — 소지금 ' + num(S().player.gold) + '닢', opts, who(seller()));
      if (v === 'done' || !v) break;
      var p2 = WM.price(v, o.ratio), q = WM.canBuy(v, p2, o.stock[v]);
      if (!q) continue;
      load(v, q, p2, port); o.stock[v] -= q;
      bought.push(G.GOOD[v].name + ' ' + q + '통');
      UI.toast(G.GOOD[v].name + ' ' + q + '통을 실었다 (금화 ' + num(q * p2) + '닢)', 'coin', 3600);
      if (G.Audio) G.Audio.sfx('coin');
      if (G.Game.refreshHud) G.Game.refreshHud();
    }
    return bought;
  }

  // ================================================================ 만남
  function inSea() {
    var s = S(), l = s && s.loc, b = K().box;
    if (!l || l.mode !== 'sea' || l.lon == null) return false;
    return l.lon >= b[0] && l.lon <= b[1] && l.lat >= b[2] && l.lat <= b[3];
  }
  WM.inSea = inSea;
  /** 바다의 하루 끝 — 하루에 한 번만 굴린다 */
  WM.seaPending = function () {
    var s = S(); if (!s || !inSea()) return false;
    var o = st(); if (o.cool > s.day) return false;
    if (o.day === s.day) return !!o.hit;
    o.day = s.day;
    o.hit = (!G.Pace || G.Pace.ok()) && U.chance(o.met ? K().chance : K().firstChance);
    return o.hit;
  };
  WM.atSea = async function () {
    if (WM._busy) return false; WM._busy = true;
    try { var o = st(); o.hit = false; await WM.meet(); } catch (e) { console.error(e); }
    WM._busy = false;
    return true;
  };
  WM.meet = async function () {
    var s = S(), o = st(), k = K(), first = !o.met, pc = null;
    o.met = (o.met || 0) + 1; o.cool = s.day + k.cool;
    if (G.Pace) G.Pace.mark('wangMerch');
    var stock = {}; k.goods.forEach(function (id) { stock[id] = U.ri(k.stock[0], k.stock[1]); });
    try {
      pc = pic('wm_junk', '금봉호');
      if (first) {
        await play([
          [null, '수평선에서 붉은 돛 세 장을 단 큰 정크선이 다가온다. 뱃머리에 금빛 봉황을 그린 배 — 갑판 위에서 비단옷 차림의 사람들이 손을 흔든다.'],
          ['first', '제독님, 해적은 아닌 것 같습니다. 짐을 잔뜩 실어 흘수가 깊습니다.'],
          ['ma', '어이, 바다 건너 오신 손님! 나는 금봉호의 주인, 사람들은 마대인이라 부르오. 이쪽은 내 딸 지나, 우리 배의 장부는 전부 이 아이 손에 있소.'],
          ['jina', '반가워요. 아버지 말은 반만 믿으세요 — 값은 제가 정하거든요.'],
          ['wang', '그리고 저는 이 배에 얹혀 다니는 비단 장수 왕서방이올시다. 항주 비단이라면 올 하나까지 제가 압니다.'],
          today() < 15670101 ? ['ma', '(목소리를 낮추며) 황제 폐하께서 바다를 막아 두셨으니, 우리 장사는 이렇게 바다 위에서 조용히 하오. 세관 나리들 눈을 피하면 값이 싸질 수밖에.'] :
            ['ma', '월항이 열린 뒤로 바다 장사가 한결 편해졌소. 그래도 세관을 거치면 값이 붙지 — 바다 위에서 바로 사면 그만큼 싸오.']
        ]);
      } else {
        await play([
          [null, '붉은 돛 세 장, 금빛 봉황 — 금봉호다. 마대인이 뱃전에서 접부채를 흔든다.'],
          ['ma', '오오, 또 만났구려! 바다가 넓다지만 장사꾼 길은 좁은 법이지.' + (WM.jinaAboard() ? ' …지나야! 잘 지내느냐? 제독, 내 딸 밥은 잘 먹이시오?' : '')],
          WM.jinaAboard() ? ['jina', '아버지도 참. 저 이 배 장부 보느라 바빠요. 왕서방 아저씨, 아버지 셈 틀리지 않게 잘 봐 드려요.'] : null
        ]);
      }
      if (pc) { await pc.stop(); pc = null; }
      // ② 왕서방 — 조선 물건
      var kl = WM.koreaLots(), traded = false;
      if (kl.length) {
        var kt = kl.map(function (x) { return G.GOOD[x.id].name + ' ' + x.q + '통(1통 ' + num(WM.koreaPrice(x.id)) + '닢)'; }).join(' · ');
        var ktot = kl.reduce(function (a, x) { return a + x.q * WM.koreaPrice(x.id); }, 0);
        await play([['wang', '(짐 꾸러미의 표식을 보더니 눈이 동그래진다) 이, 이건 조선 물건 아니오? 한양에서, 동래에서… 명월이 사는 동네 물건이구려!'],
          ['wang', '내 이 장사 길에 조선에서 명월이라는 사람을 만났소. 그 뒤로 조선 물건만 보면 값을 따질 수가 없다오. 최근에 보신 값보다 훨씬 쳐 드리리다. 저한테 넘기시오!'],
          ['jina', '(한숨) 또 시작이네. 왕서방, 그 돈이면 비단이 몇 필인데요.']]);
        var kv = await UI.ask('왕서방이 조선에서 산 짐을 사겠다 — ' + kt + ' · 모두 금화 ' + num(ktot) + '닢', [
          { label: '왕서방에게 판다 (금화 ' + num(ktot) + '닢)', value: 'sell' }, { label: '팔지 않는다', value: 'no' }], who('wang'));
        if (kv === 'sell') {
          var sold = sellKorea(kl); o.korea = (o.korea || 0) + 1; traded = true;
          await play([['wang', '하하! 이 고운 결 좀 보시오. 명월이 손길이 닿았을지도 모르지. 고맙소, 제독!']]);
          G.State.log('중국 근해에서 비단 장수 왕서방에게 조선에서 산 짐(' + sold.text + ')을 금화 ' + num(sold.gold) + '닢에 넘겼다.');
          UI.toast('왕서방에게 조선 물건을 넘겼다 — 금화 +' + num(sold.gold) + ' (남는 몫 ' + (sold.profit >= 0 ? '+' : '') + num(sold.profit) + ')', 'coin', 5200);
          if (G.Game.refreshHud) G.Game.refreshHud();
        } else await play([['wang', '…아쉽구려. 다음에 만나면 꼭 넘기시오. 명월이 동네 물건은 내가 제일 비싸게 쳐 주니까.']]);
      }
      // ③ 금봉호의 짐
      var ratio0 = k.ratio, list = k.goods.map(function (id) { var sn = WM.seen(id); return G.GOOD[id].name + ' ' + stock[id] + '통 — 1통 ' + num(WM.price(id, ratio0)) + '닢 (최근에 보신 값 ' + num(sn.p) + '닢의 ' + pct(ratio0) + ')'; });
      pc = pic('wm_deal', '금봉호의 짐');
      await play([WM.jinaAboard() ? ['ma', '우리 배 짐을 보시오. ' + list.join(' · ') + '. 제독이 최근에 본 값의 일곱 할이오. 딸 둔 집이라고 더 싸지는 않소!'] : ['jina', '우리 배 짐을 보세요. ' + list.join(' · ') + '. 제독님이 최근에 보신 값의 일곱 할이에요. 어디서 이 값을 보시겠어요?']]);
      if (pc) { await pc.stop(); pc = null; }
      var deal = { ratio: ratio0, ratio0: ratio0, stock: stock };
      var v = await UI.ask('금봉호의 짐을 살까?', [
        { label: '후려친다 — 더 깎아 보자', value: 'haggle' },
        { label: '이 값(' + pct(ratio0) + ')에 산다', value: 'buy' },
        { label: '사지 않는다', value: 'no' }], who(seller()));
      if (v === 'haggle') { deal.ratio = await haggle(deal); v = 'buy'; }
      var bought = v === 'buy' ? await shop(deal) : [];
      if (bought.length) {
        var tr = G.Fame ? G.Fame.add('tr', 10) : 0;
        await play([['ma', '좋은 장사였소! 바닷길에서 또 봅시다. 다음엔 조금 더 비싸게 팔 거요, 하하!'], WM.jinaAboard() ? ['wang', '형님, 지나 아가씨 없으니 셈이 자꾸 틀리십니다그려.'] : ['jina', '(장부에 적으며) 아버지 말은 반만 믿으세요.']]);
        G.State.log('중국 근해에서 금봉호(마대인과 딸 지나)에게 ' + bought.join(' · ') + '을 최근에 본 값의 ' + pct(deal.ratio) + '에 샀다.' + (tr ? ' (교역 명성 +' + tr + ')' : ''));
      } else if (!traded) {
        await play([['ma', '그럼 다음에 또 봅시다! 바다 위에서 금봉호를 보거든 손을 흔드시오.']]);
        G.State.log('중국 근해에서 마대인과 딸 지나, 비단 장수 왕서방의 정크선 금봉호를 만났다.');
      }
      if (bought.length || traded) {
        o.deals = (o.deals || 0) + 1;
        if (o.deals >= (k.joinDeals || 3) && WM.jinaReady()) await jinaJoins();
      }
      if (G.Game.refreshHud) G.Game.refreshHud();
      return true;
    } finally { if (pc) await pc.stop(); }
  };

  // ================================================================ ⑥ 지나가 따라온다
  WM.jinaReady = function () { var s = S(); return !!(G.MATE.jina && !row('jina') && !(s.flags && s.flags.gone_jina) && !st().jina); };
  async function jinaJoins() {
    var s = S(), o = st(), pc = pic('wm_jina_leave', '지나의 결심');
    try {
      await play([
        [null, '거래를 마치고 배를 떼려는데, 지나가 장부를 품에 안고 뱃전으로 다가왔다.'],
        ['jina', '아버지. 저 이 배에 탈래요.'],
        ['ma', '…뭐, 뭐라고? 지나야, 그게 무슨 소리냐!'],
        ['jina', '세 번이나 이 손님과 셈을 해 봤어요. 이분들은 바다 건너 서쪽 끝에서 왔대요. 거기 사람들은 장부를 어떻게 적는지, 거기 시장에서는 비단이 얼마에 팔리는지 — 금봉호 장부 너머가 보고 싶어요.'],
        ['ma', '(한참 부채만 쥐었다 폈다 하더니) …네 어미를 닮아 한번 마음먹으면 못 말리지. 제독! 내 딸을 맡기오. 장부는 세상 누구보다 잘 보지만, 바다는 아직 모르는 아이요. 셈이 틀리면 지나 탓이 아니라 그대 탓이오!'],
        ['wang', '(코를 훌쩍이며) 아가씨, 조선에 가거든… 아니오, 아니오. 잘 가시오!'],
        ['jina', '아버지 말은 반만 믿으세요, 제독님. 그래도 오늘 말은 다 믿으셔도 돼요. …잘 부탁드려요.']
      ]);
    } finally { if (pc) await pc.stop(); }
    var c = G.CITY_DATA[nearPort()];
    var nm = G.Legend && G.Legend.join ? G.Legend.join('jina', c) : null;
    if (!nm) { nm = { id: 'jina', role: 'none', joined: today(), loyal: 82 }; s.mates.push(nm); }
    nm.loyal = Math.max(nm.loyal || 0, 82);
    o.jina = s.day;
    G.State.log('금봉호와 세 번째 거래를 마친 날, 마대인의 딸 지나가 장부 너머의 세상을 보겠다며 따라나섰다.');
    UI.toast('지나가 동료가 되었다 — 회계 3 · 웅변·세공 2 · 중국어 3', 'heart', 5200);
    if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire('jina'); } catch (e) { console.error(e); } }
  }
  WM._t = { haggle: haggle, shop: shop, sellKorea: sellKorea, jinaJoins: jinaJoins };
})(window.G = window.G || {});
