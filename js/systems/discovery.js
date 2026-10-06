/* Discoveries: hints, finding, rivals, announcements. */
(function (G) {
  'use strict';
  var U = G.U, R = G.R, UI = G.UI;
  var D = {};
  G.Disc = D;
  function S() { return G.Game.state; }

  D.state = function (id) { return S().disc[id] || null; };
  D.foundByMe = function (id) { var d = S().disc[id]; return !!(d && d.found && d.me); };
  D.hasHint = function (id) { return !!S().hints[id]; };
  /** 단서의 갈래: 'talk'(주점·교역소·후원자의 이야기) · 'book'(도서관 사료) — js/data/clues.js */
  D.clue = function (d) { return d && G.CLUE && G.CLUE[d.id] || 'talk'; };
  var TALK_SRC = /^(tavern|trade|sponsor)(:|$)/, BOOK_SRC = /^book(:|$)/;
  /** 이 출처(src 또는 'tavern'·'trade'·'sponsor'·'book')에서 이 발견의 단서가 나올 수 있는가.
      그 밖의 출처(계약·큰 항로·유물·연쇄·유산·부하·원주민·항해 소식…)는 갈래와 상관없다.
      지금 온 세상이 떠드는 이야기(맛보기·차례가 된 관문)는 어디서나 들린다. */
  D.clueOk = function (d, src) {
    if (!d) return true;
    var sr = String(src || ''), want = TALK_SRC.test(sr) ? 'talk' : BOOK_SRC.test(sr) ? 'book' : null;
    if (!want) return true;
    if (G.Frontier && G.Frontier.hot && G.Frontier.hot(d)) return true;
    return D.clue(d) === want;
  };
  /* 단서 겹치기 — 이미 단서가 있는 발견을 다른 곳(다른 도시의 술집·교역소, 다른 후원자·책, 망루·원주민…)에서 또 들으면 겹친다(최대 4겹).
     겹칠수록 망루가 멀리서 알아채고, 찾는 반경이 넓어지고, 계약 목적지 원이 좁아진다 (G.BALANCE.clueStack). 같은 곳에서 거듭 들은 것은 겹치지 않는다. */
  function CS() { return (G.BALANCE && G.BALANCE.clueStack) || { max: 4, sense: [1, 1.4, 1.7, 2.0, 2.3], find: [1, 1, 1.2, 1.35, 1.5], zone: [1, 1, 0.72, 0.5, 0.34], fish: 0.75, stackW: 0.35 }; }
  D.clueStack = CS;
  function srcKey(src) { return String(src || '').split(':').slice(0, 2).join(':'); }
  /** 단서 겹수: 0(없음) ~ 4 */
  D.hintLv = function (id) { var h = S().hints[id]; return h ? Math.min(CS().max, 1 + (h.more ? h.more.length : 0)) : 0; };
  D.hintSrcs = function (id) { var h = S().hints[id]; return h ? [h.src].concat((h.more || []).map(function (x) { return x.src; })) : []; };
  /** 이 출처에서 들으면 단서가 하나 더 겹치는가 (이미 단서가 있고, 아직 찾지 않았고, 그 출처에서는 처음) */
  D.canStack = function (id, src) {
    var h = S().hints[id]; if (!h || D.foundByMe(id) || D.hintLv(id) >= CS().max || /^mirage/.test(String(src || ''))) return false;
    var k = srcKey(src); return D.hintSrcs(id).every(function (x) { return srcKey(x) !== k; });
  };
  /** 겹수에 따른 값 (kind: sense·find·zone) */
  D.clueK = function (id, kind) { var a = CS()[kind] || [1]; return a[Math.min(D.hintLv(id), a.length - 1)]; };
  D.lastMore = null;
  /** 단서를 적는다. 아직 개척 단계가 닿지 않은 발견물은 받지 않는다 (G.Frontier).
      새 단서면 true. 이미 있던 단서가 겹쳤으면 false를 돌려주고 D.lastMore = id (D.noteHint가 알려 준다) */
  D.addHint = function (id, src) {
    var s = S(); D.lastMore = null; if (D.foundByMe(id)) return false;
    var d0 = G.DISC[id], sr = String(src || '');
    if (s.hints[id] && !D.canStack(id, sr)) return false;
    if (d0 && d0.bookOnly && !/^(book|relic|chain|contract|lead|legacy)/.test(sr)) return false;   // 전설·희귀 동물·공룡: 책에서만
    if (d0 && !D.clueOk(d0, sr)) return false;                                                    // 주점·교역소·후원자의 이야기 ↔ 도서관 사료 (js/data/clues.js)
    var here = d0 && d0.animal && /^(local|town):/.test(sr) && D.built(d0);                      // 그 고장에 와서 들은 동물 이야기
    if (G.Frontier && d0 && !here && !G.Frontier.canHint(d0, src)) return false;
    if (s.hints[id]) {
      (s.hints[id].more = s.hints[id].more || []).push({ src: src, d: U.dateNum(s.date) });
      D.lastMore = id;
      if (G.Explore) G.Explore.ver++;
      if (d0 && G.State && G.State.log) G.State.log('「' + d0.name + '」의 단서가 겹쳤다 — 단서 ' + D.hintLv(id) + '겹');
      return false;
    }
    s.hints[id] = { src: src, d: U.dateNum(s.date) }; return true;
  };
  /** 대화에서 단서를 들었을 때: 적고 알린다. 'new' · 'more'(겹침) · null */
  D.noteHint = function (d, src) {
    if (!d) return null;
    if (D.addHint(d.id, src)) { UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll'); return 'new'; }
    if (D.lastMore === d.id) { UI.toast('단서가 겹쳤다: 「' + d.name + '」 — 단서 ' + D.hintLv(d.id) + '겹, 찾기가 쉬워졌다', 'scroll', 4200); return 'more'; }
    return null;
  };
  /** 소문 후보에 넣을 수 있는가: 아직 단서가 없거나, 이 출처에서 들으면 겹친다. 무게(겹칠 것은 가볍게) */
  D.rumourW = function (d, src) { return !S().hints[d.id] ? 1 : D.canStack(d.id, src) ? CS().stackW : 0; };
  /** 세워진 건물인가 (불가사의의 built 해) */
  /** 앞 고리를 모두 찾았는가 (꼬리에 꼬리를 무는 발견 — 열리기 전에는 그 자리에 가도 찾지 못한다) */
  D.needMet = function (d) { return !d || !d.need || d.need.every(function (id) { return D.foundByMe(id); }); };
  D.built = function (d) { return !d || !d.built || S().date.y >= d.built; };
  /** 지금 단서를 들을 수 있는 발견물인가 */
  D.available = function (d) { return !G.Frontier || G.Frontier.available(d); };
  /** 그림·세공이 발견물의 값어치를 올린다 — 제독이든 부하든(역할·배 상관없이) 가장 잘하는 사람의 솜씨.
      그림: 단계마다 +6% (무엇이든 그려 남긴 기록이 값을 더한다), 세공: 보물·유적·민족(공예)은 단계마다 +7%, 그 밖은 +3%.
      발견 명성·보고 사례금·명명 하사금·보물 노획에 쓰인다 (선금·후원자 관심은 원래 값). */
  /* 요리: 교역품(trade) 발견은 단계마다 +8% (맛과 쓰임을 알아보고 팔 길을 연다), 음악: 민족(people) 발견은 단계마다 +8% (노래와 춤으로 마음을 연다) */
  D.VALUE_K = { art: 0.06, craft: 0.07, craftOther: 0.03, cook: 0.08, music: 0.08 };
  function rd(id) { return R.skillRead ? R.skillRead(id) : R.skill(id); }
  D.valueParts = function (d) {
    var art = rd('art'), craft = rd('craft');
    var hand = d && (d.cat === 'treasure' || d.cat === 'ruin' || d.cat === 'people');
    var ka = art * D.VALUE_K.art, kc = craft * (hand ? D.VALUE_K.craft : D.VALUE_K.craftOther);
    // 요리는 교역품(향신료·작물), 음악은 민족(노래·춤·의식)의 값어치를 알아본다
    var CK = ((G.BALANCE && G.BALANCE.crewCare) || {}).discValue || 0.08;
    var care = d && d.cat === 'trade' ? 'cook' : d && d.cat === 'people' ? 'music' : null;
    var cv = care ? (R.skillRead ? R.skillRead(care) : R.skill(care)) : 0, kk = cv * CK;
    return { art: art, craft: craft, ka: ka, kc: kc, care: care, kk: kk, careWho: care && R.skillBest ? R.skillBest(care).who : null,
      k: 1 + ka + kc + kk, artWho: R.skillBest ? R.skillBest('art').who : null, craftWho: R.skillBest ? R.skillBest('craft').who : null };
  };
  D.valueK = function (d) { return D.valueParts(d).k; };
  D.value = function (d) { return Math.round(d.val * D.valueK(d)); };
  D.fameFor = function (d) { return Math.round(D.value(d) / 26 + d.pw * 30); };
  /** 현장 기록 보너스 — 유적은 그림(정밀한 도판)·세공(짜임·재료 기록)에 밝은 사람이 있으면 명성이 더 오른다.
      값어치(D.value)와 따로, 명성에만 곱한다. 발견 순간·후원자 보고·늦은 보고에 모두 쓴다. d 없이 부르면 1(옛 호출과 호환). */
  D.RECORD_K = { art: 0.05, craft: 0.04 };
  D.recordParts = function (d) {
    if (!d || d.cat !== 'ruin') return { art: 0, craft: 0, k: 1 };
    var art = R.skillRead ? R.skillRead('art') : R.skill('art'), craft = R.skillRead ? R.skillRead('craft') : R.skill('craft');
    return { art: art, craft: craft, k: 1 + art * D.RECORD_K.art + craft * D.RECORD_K.craft };
  };
  D.artBonus = function (d) { return D.recordParts(d).k; };
  /** 발견 카드의 「가치」 칸: 올린 값과 그 까닭 */
  D.valueTag = function (d) {
    var v = D.valueParts(d); if (v.k <= 1.0001) return '가치 ' + U.num(d.val);
    var why = []; if (v.ka) why.push('그림' + (v.artWho ? '·' + v.artWho : '') + ' +' + Math.round(v.ka * 100) + '%'); if (v.kc) why.push('세공' + (v.craftWho ? '·' + v.craftWho : '') + ' +' + Math.round(v.kc * 100) + '%'); if (v.kk) why.push((v.care === 'cook' ? '요리' : '음악') + (v.careWho ? '·' + v.careWho : '') + ' +' + Math.round(v.kk * 100) + '%');
    return '가치 ' + U.num(D.value(d)) + ' <small>(' + why.join(', ') + ')</small>';
  };

  // ---------------------------------------------------------------- 발견의 여파 (대항해시대 3식 감정 변화)
  var IMPACT = {
    awe:     { name: '감동', icon: 'star', line: '눈앞의 광경에 긴 여정의 고단함을 잠시 잊었다.' },
    triumph: { name: '성취감', icon: 'laurel', line: '해냈다는 기쁨에 탐험대의 사기가 크게 올랐다.' },
    delight: { name: '흥분', icon: 'chest', line: '귀한 발견을 손에 넣었다는 기쁨이 대원들에게 번졌다.' },
    wonder:  { name: '경이', icon: 'compass', line: '처음 보는 존재를 마주한 놀라움이 마음을 환기했다.' },
    fear:    { name: '공포', icon: 'skull', line: '기괴하고 두려운 광경이 대원들의 마음에 오래 남았다.' },
    grief:   { name: '숙연함', icon: 'skull', line: '사람이 사람을 사고판 자리 앞에서 대원들은 한동안 말을 잃었다. 웃고 떠드는 이가 없었다.' }
  };
  var FEAR_IDS = { bermuda: 1, f_giantsquid: 1, tarantula: 1, roc: 1, minotaur: 1, cannibal: 1, crystalskull: 1, antarctic: 1 };
  /** 데이터에 impact를 따로 적으면 그것을 우선하고, 없으면 발견 갈래와 설명으로 정한다. */
  D.impactKind = function (d) {
    if (d.impact && IMPACT[d.impact]) return d.impact;
    var scary = /악마|유령|식인|사람을 먹|배를 삼키|배를 바다 밑|독이 있어|괴물의 울부짖음/.test((d.name || '') + ' ' + (d.desc || ''));
    if (FEAR_IDS[d.id] || ((d.cat === 'creature' || d.cat === 'people' || d.cat === 'nature') && scary)) return 'fear';
    if (d.cat === 'geo') return 'triumph';
    if (d.cat === 'treasure' || d.cat === 'trade') return 'delight';
    if (d.cat === 'creature' || d.cat === 'people') return 'wonder';
    return 'awe';
  };
  /** 발견 직후 한 번만 피로·규율에 반영한다. 실제로 달라진 수치를 저장해 도감에서도 당시 여파를 볼 수 있다. */
  D.applyImpact = function (d, st) {
    st = st || (S().disc[d.id] || (S().disc[d.id] = {}));
    if (st.impact) return st.impact;
    var s = S(), f = s.fleet, key = D.impactKind(d), meta = IMPACT[key], tab = (G.BALANCE && G.BALANCE.discoveryImpact) || {}, v = tab[key] || {};
    var before = { fatigue: f.fatigue || 0, discipline: f.discipline == null ? 80 : f.discipline };
    // 교역품은 요리사가 그 맛을 나누어 피로를, 민족은 음악가가 함께 어울려 규율을 더 붙든다
    var CI = ((G.BALANCE && G.BALANCE.crewCare) || {}).impact || 2;
    var xf = d.cat === 'trade' && !(G.Slave && G.Slave.is(d.good)) ? -R.skillRead('cook') * CI : 0, xd = d.cat === 'people' ? R.skillRead('music') * CI : 0;
    f.fatigue = U.clamp(before.fatigue + (v.fatigue || 0) + xf, 0, 100);
    f.discipline = U.clamp(before.discipline + (v.discipline || 0) + xd, 0, 100);
    st.impact = {
      key: key, name: meta.name, icon: meta.icon, line: meta.line,
      fatigue: Math.round(f.fatigue - before.fatigue), discipline: Math.round(f.discipline - before.discipline)
    };
    return st.impact;
  };

  /** player discovers d (object). returns promise after showing the event */
  D.find = async function (d, how) {
    var s = S();
    var st = s.disc[d.id] || (s.disc[d.id] = {});
    if (st.me) return false;
    st.found = U.dateNum(s.date); st.me = true; st.evidence = true;
    s.stats.found++;
    D.collectionReward(s.stats.found);
    delete s.hints[d.id];
    var fame = Math.round(D.fameFor(d) * (st.rival ? 0.45 : 0.75) * D.artBonus(d));
    G.Fame.add('ex', fame);
    // 증거품: 이름 붙은 증거(해도·지도)는 소지품으로 챙긴다 — 보고·발표할 때 건넨다 (잃으면 믿어 주지 않는다)
    if (d.evidence && !s.player.items.some(function (it) { return it.kind === 'evidence' && it.disc === d.id; })) {
      s.player.items.push({ id: 'evidence', kind: 'evidence', evidence: true, name: d.evidence, disc: d.id,
        desc: '「' + d.name + '」의 발견을 증명한다. 후원자에게 보고하거나 항구에서 발표할 때 건넨다.' });
    }
    // 발견 유물: 그 자리에서 보물·장신구·무기·서적·선수상 같은 것을 손에 넣는다 — 발견의 증거가 된다
    var rel = D.relicsOf(d.id), got = [];
    // 유물이 없는 보물·유적 발견은 예전처럼 값나가는 것을 조금 챙긴다 (세공 솜씨만큼 더)
    var loot = 0;
    if (!rel.length && (d.cat === 'treasure' || d.cat === 'ruin')) {
      loot = Math.round(D.value(d) * (0.05 + (R.skillRead ? R.skillRead('craft') : R.skill('craft')) * 0.02) * (st.rival ? 0.5 : 1));
      if (loot > 0) s.player.gold += loot;
    }
    G.State.log(d.name + U.j(d.name, '을/를').slice(d.name.length) + ' 발견했다.');
    if (G.Audio) G.Audio.sfx('discover');
    // 유적은 복원 GIF가 빛나며 돌고, 「○○ 발견」과 함께 제독·부하의 대화가 이어진다 (그림·세공 솜씨만큼 자세히)
    if (G.Scenes.discoveryReveal) { try { await G.Scenes.discoveryReveal(d, fame); } catch (e) { console.error(e); } }
    var impact = D.applyImpact(d, st);
    // 칸이 남는 만큼 먼저 챙기고, 모자라면 카드를 본 뒤에 무엇을 버릴지 묻는다
    var wait = [];
    rel.forEach(function (r) { if (R.addItem(r.id, { disc: d.id })) got.push(r); else wait.push(r); });
    st.relics = got.map(function (r) { return r.id; });
    await G.Scenes.discoveryCard(d, fame, got.concat(wait));
    UI.toast('발견의 여파 · ' + impact.name + ' — 피로 ' + (impact.fatigue > 0 ? '+' : '') + impact.fatigue + ' · 규율 ' + (impact.discipline > 0 ? '+' : '') + impact.discipline, impact.icon, 5200);
    if (loot > 0) UI.toast('값나가는 것을 챙겼다 — 금화 ' + U.num(loot) + '닢', 'coin', 4200);
    for (var wi = 0; wi < wait.length; wi++) await D.takeRelic(d, wait[wi]);
    if (rel.length && !s.flags.relicTip) {
      s.flags.relicTip = 1;
      await UI.say('제독, 이것은 이 발견의 틀림없는 증거입니다. 후원자에게 보고하면 증거로 바쳐야 하지만, 항구에서 제독 스스로 발표하면 제독의 것이 됩니다 — 시장에 팔아 자금을 마련할 수도 있습니다. 서적은 소지품에서 읽어 볼 수 있습니다.', G.Scenes.mateSpeaker(R.skill('hist') ? 'surveyor' : 'first'));
    }
    // 곶·해협·항로·대륙: 처음 찾은 사람이 이름을 붙인다
    if (G.Names) await G.Names.offer(d);
    // contract check
    if (s.contract && s.contract.disc === d.id) {
      await UI.say('제독, 이것이 바로 후원자께서 찾던 것입니다! 기한 안에 ' + G.CITY_DATA[G.SPONSOR[s.contract.sponsor].city].name + U.j(G.CITY_DATA[G.SPONSOR[s.contract.sponsor].city].name, '으로/로').slice(G.CITY_DATA[G.SPONSOR[s.contract.sponsor].city].name.length) + ' 돌아가 보고합시다.', G.Scenes.mateSpeaker('first'));
    }
    // 발견의 연쇄: 이것을 찾아서 뒤의 발견물 실마리가 풀렸다
    if (G.DISC_CHAIN) {
      for (var nid in G.DISC_CHAIN) {
        var nd = G.DISC[nid];
        if (!nd || G.DISC_CHAIN[nid].indexOf(d.id) < 0 || D.foundByMe(nid)) continue;
        if (G.Frontier && !G.Frontier.available(nd)) continue;
        if (D.addHint(nid, 'chain:' + d.id)) {
          await UI.say(G.chainLine(nid) + '\n\n— 새 단서: 「' + nd.name + '」', G.Scenes.mateSpeaker(R.skill('hist') ? 'surveyor' : 'first'));
          UI.toast('단서를 얻었다: 「' + nd.name + '」', 'scroll', 4200);
        }
      }
    }
    // 이 발견으로 새 단계가 열렸으면 알린다
    if (G.Frontier) { var fm = G.Frontier.tick(); if (fm.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(fm); }
    // 발견의 주제 조합으로 이룬 업적 (js/systems/achieve.js)
    if (G.Achieve) { try { await G.Achieve.afterFind(d); } catch (e) { console.error(e); } }
    G.Game.refreshHud && G.Game.refreshHud();
    return true;
  };

  // ---------------------------------------------------------------- 발견 유물·증거
  D.relicsOf = function (id) { return (G.RELICS && G.RELICS[id]) || []; };
  /** 보고·발표할 때 증거를 보여야 하는 발견인가 (해도·지도 증거품이나 유물이 있는 발견) */
  D.needsProof = function (d) { return !!(d && (d.evidence || D.relicsOf(d.id).length)); };
  /** 이 발견의 증거로 쓸 수 있는 소지품 (아직 쓰지 않은 해도·지도와 유물) */
  D.proofItems = function (id) { return S().player.items.filter(function (it) { return it.disc === id && R.isProof(it); }); };
  D.hasProof = function (id) { return D.proofItems(id).length > 0; };
  /** 소지품이 가득 찬 채 유물을 찾았다: 무엇을 버리고 챙길지, 두고 갈지 (두고 가면 다시 와서 가져갈 수 있다) */
  D.takeRelic = async function (d, r) {
    var s = S(), st = s.disc[d.id] || (s.disc[d.id] = {});
    for (;;) {
      if (R.addItem(r.id, { disc: d.id })) { (st.relics = st.relics || []).push(r.id); UI.toast(r.name + U.jx(r.name, '을/를') + ' 챙겼다.', { src: G.Img.itemSrc(r), icon: 'chest' }); return true; }
      var list = s.player.items.map(function (it, i) { return { it: it, i: i }; }).filter(function (x) { return !R.isProof(x.it); });
      var v = await UI.choose('소지품이 가득 찼습니다', list.map(function (x, k) {
        var dd = G.ITEM[x.it.id] || {};
        return { label: '버린다: ' + U.esc(R.itemName(x.it)), right: G.ITEM_KIND[dd.kind || x.it.kind] || '', value: k, icon: 'chest', thumb: G.Img.itemSrc(x.it) };
      }).concat([{ label: '두고 간다', right: '다시 오면 가져갈 수 있다', value: 'leave', icon: 'boot' }]),
        { width: 620, text: '「' + r.name + '」' + U.jx(r.name, '을/를') + ' 챙기려면 소지품 하나를 버려야 합니다. (' + (G.ITEM_KIND[r.kind] || '') + ' · 값 ' + U.num(r.price) + '닢)' });
      if (v == null || v === 'leave') {
        (st.left = st.left || []).push(r.id);
        UI.toast(r.name + U.jx(r.name, '을/를') + ' 그 자리에 두었다. 다시 오면 가져갈 수 있다.', 'boot', 4200);
        return false;
      }
      var x = list[v], nm = R.itemName(x.it);
      if (s.player.equip.weapon === x.it.id) s.player.equip.weapon = null;
      if (s.player.equip.armor === x.it.id) s.player.equip.armor = null;
      s.player.items.splice(x.i, 1);
      UI.toast(nm + U.jx(nm, '을/를') + ' 버렸다.', 'chest');
    }
  };
  /** 두고 온 유물이 있는 발견물 가운데 지금 닿은 곳 (how: land/sea/city) */
  D.leftHere = function (how, lon, lat, cityId) {
    var s = S();
    return G.DISCOVERIES.filter(function (d) {
      var st = s.disc[d.id]; if (!st || !st.me || !st.left || !st.left.length) return false;
      if (how === 'city') return d.how === 'city' && d.city === cityId;
      if (d.how === 'city' || d.how === 'trade' || d.lon == null) return false;
      var near = how === 'sea' ? (d.how === 'sea' || d.how === 'special') : d.how === 'land';
      return near && G.Geo.dist(lon, lat, d.lon, d.lat) < (d.r || 0.5) * 1.5;
    });
  };
  /** 두고 온 유물을 가지러 왔다 */
  D.pickupLeft = async function (d) {
    var st = S().disc[d.id], ids = (st.left || []).slice();
    st.left = [];
    await UI.say('「' + d.name + '」에 두고 갔던 것이 그대로 있습니다: ' + ids.map(function (id) { return G.RELIC[id] ? G.RELIC[id].name : id; }).join(', '), G.Scenes.mateSpeaker('first'));
    for (var i = 0; i < ids.length; i++) if (G.RELIC[ids[i]]) await D.takeRelic(d, G.RELIC[ids[i]]);
  };
  /** 스스로 발표: 해도·지도 증거품은 왕실 해도소에 넘기고, 유물은 제독의 것이 된다 (done → 팔거나 써도 된다) */
  D.keepRelics = function (id) {
    var kept = [];
    S().player.items.forEach(function (it) { if (it.disc === id && !it.evidence && G.RELIC[it.id] && !it.done) { it.done = true; kept.push(it); } });
    return kept;
  };
  /** 유물의 값 (세공 솜씨가 좋으면 제값을 더 받아 낸다) */
  D.relicValue = function (it) {
    var r = G.RELIC[it.id]; if (!r) return 0;
    return Math.round(r.price * (1 + (R.skillRead ? R.skillRead('craft') : R.skill('craft')) * 0.08) / 10) * 10;
  };
  /** 서적·지도를 읽는다: 이어지는 발견의 단서를 얻는다 (없으면 가까운 고장의 발견 하나). 처음 한 번만 */
  D.readRelic = async function (it) {
    var s = S(), r = G.RELIC[it.id]; if (!r) return;
    var who = G.Scenes.mateSpeaker(R.skill('hist') ? 'surveyor' : 'first');
    if (it.read) { await UI.say('이미 읽은 것입니다. 적힌 이야기는 수첩에 옮겨 두었습니다.', who); return; }
    it.read = true;
    var ids = (r.lead || []).filter(function (id) { return G.DISC[id] && !D.foundByMe(id) && !s.hints[id]; });
    if (!ids.length) {
      var reg = G.DISC[r.relic] ? G.DISC[r.relic].reg : -1;
      var pool = G.DISCOVERIES.filter(function (d) { return d.reg === reg && d.how !== 'trade' && d.how !== 'special' && !D.foundByMe(d.id) && !s.hints[d.id] && D.available(d) && !(s.disc[d.id] && s.disc[d.id].rival); });
      if (pool.length) ids = [pool[Math.abs(U.strHash(it.id + (s.player.name || ''))) % pool.length].id];
    }
    var got = ids.filter(function (id) { return D.addHint(id, 'relic:' + r.id); });
    if (!got.length) { await UI.say('「' + r.name + '」' + U.jx(r.name, '을/를') + ' 꼼꼼히 읽었지만, 이미 아는 이야기뿐입니다.', who); return; }
    await UI.say('「' + r.name + '」' + U.jx(r.name, '을/를') + ' 읽어 보니 이런 대목이 있습니다.\n\n' + got.map(function (id) { return G.DISC[id].hint; }).join('\n') + '\n\n— 새 단서: ' + got.map(function (id) { return '「' + G.DISC[id].name + '」'; }).join(', '), who);
    UI.toast('단서를 얻었다: ' + got.map(function (id) { return '「' + G.DISC[id].name + '」'; }).join(', '), 'scroll', 4200);
  };

  /** 발견을 일정 수 모을 때마다 모국 왕실이 포상한다 */
  var COLLECT = [5, 12, 25, 40, 60, 85, 115, 150, 186];
  D.collectionReward = function (n) {
    var s = S();
    if (COLLECT.indexOf(n) < 0) return;
    var gold = n * 400, fame = n * 6;
    s.player.gold += gold; G.Fame.add('ex', fame);
    var king = s.player.nation === 'ES' ? '에스파냐 왕실' : '포르투갈 왕실';
    setTimeout(function () { UI.toast('발견 ' + n + '가지 달성! ' + king + '에서 포상금 금화 ' + U.num(gold) + '닢을 보내왔다. (명성 +' + fame + ')', 'crown', 6500); }, 900);
    G.State.log('발견 ' + n + '가지를 모았다. ' + king + '의 포상 (금화 ' + U.num(gold) + ', 명성 +' + fame + ')');
  };

  /** 늦은 발표: 먼저 찾아 두고도 알리지 않는 사이 경쟁자가 발표했으면, 이제 알려도 명성은 이만큼만 받는다 */
  D.LATE_FAME = 0.5;
  D.isLate = function (id) {
    var st = S().disc[id], d = G.DISC[id]; if (!st || !st.me) return false;
    if (st.late) return true;
    // 예전 기록: 경쟁자 발표일보다 먼저 찾았고 경쟁자가 발표했으면 늦은 발표로 본다
    return !!(st.rival && d && d.rival && st.found && st.found < d.rival[0] * 10000 + d.rival[1] * 100 + 1);
  };

  /* 발견물끼리(그리고 도시와) 너무 붙어 있으면 조금씩 떼어 놓는다 — 해도·지도의 표식과 탐지가 겹치지 않게.
     뭍의 것은 뭍에, 바다의 것은 바다에 둔다. 처음 자리는 d.lat0·d.lon0에 남긴다.
     지도(G.Geo)가 준비되면 한 번 (main.js Game.ensureGeo). 늘 같은 결과(무작위 없음). */
  D.SPREAD = {
    min: 0.34,     // 뭍·바다 발견물끼리 이만큼(도)은 떨어져 있게
    city: 0.2,     // 도시와도 이만큼
    maxMove: 0.6,  // 처음 자리에서 이보다 멀리 옮기지 않는다
    rounds: 40     // 되풀이 횟수 (겹친 무리가 풀릴 때까지)
  };
  D.spread = function () {
    if (D._spread || !G.Geo || !G.Geo.ready) return D._spread || 0;
    var P = D.SPREAD, Geo = G.Geo, wrap = Geo.wrapLon || function (v) { return v; };
    var L = G.DISCOVERIES.filter(function (d) { return (d.how === 'land' || d.how === 'sea') && isFinite(d.lat) && isFinite(d.lon); });
    L.forEach(function (d) { d.lat0 = d.lat; d.lon0 = d.lon; d._land = Geo.isLand(d.lon, d.lat); });
    // 유적·자연은 이름난 자리라 덜 움직이고, 보물·동물·사람은 더 움직인다
    function mob(d) { return d.cat === 'ruin' || d.cat === 'nature' || d.cat === 'geo' ? 0.35 : 1; }
    function fits(d, lon, lat) {
      if (Geo.dist(lon, lat, d.lon0, d.lat0) > P.maxMove || lat > 85 || lat < -85) return false;
      return d._land ? Geo.isLand(lon, lat) : !Geo.isLand(lon, lat);
    }
    function push(d, ang, dist) {   // 막히면 조금씩 옆으로 꺾어 본다
      for (var t = 0; t < 9; t++) {
        var a = ang + (t % 2 ? 1 : -1) * Math.ceil(t / 2) * 0.45;
        var lon = wrap(d.lon + Math.cos(a) * dist), lat = d.lat + Math.sin(a) * dist;
        if (fits(d, lon, lat)) { d.lon = lon; d.lat = lat; return true; }
      }
      return false;
    }
    function angOf(a, b) {
      var dx = wrap(b.lon - a.lon), dy = b.lat - a.lat;
      return dx * dx + dy * dy > 1e-8 ? Math.atan2(dy, dx) : (Math.abs(U.strHash(a.id + '|' + b.id)) % 360) * Math.PI / 180;
    }
    var cities = (G.CITY_DATA || []).filter(function (c) { return isFinite(c.lon) && isFinite(c.lat); });
    for (var r = 0; r < P.rounds; r++) {
      var any = false;
      for (var i = 0; i < L.length; i++) {
        var a = L[i];
        for (var j = i + 1; j < L.length; j++) {
          var b = L[j], dd = Geo.dist(a.lon, a.lat, b.lon, b.lat);
          if (dd >= P.min) continue;
          any = true;
          var ang = angOf(a, b), need = P.min - dd + 0.004, ma = mob(a), mb = mob(b);
          if (!push(b, ang, need * mb / (ma + mb))) push(a, ang + Math.PI, need);
          else push(a, ang + Math.PI, need * ma / (ma + mb));
        }
        for (var k = 0; k < cities.length; k++) {
          var c = cities[k], dc = Geo.dist(a.lon, a.lat, c.lon, c.lat);
          if (dc >= P.city) continue;
          any = true; push(a, angOf(c, a), P.city - dc + 0.004);
        }
      }
      if (!any) break;
    }
    D._spread = L.filter(function (d) { return d.lat !== d.lat0 || d.lon !== d.lon0; }).length || -1;
    return D._spread;
  };

  /** rival timeline: called daily */
  D.rivals = function () {
    var s = S(), out = [];
    G.DISCOVERIES.forEach(function (d) {
      if (!d.rival) return;
      var st = s.disc[d.id];
      if (st && (st.rival || st.reported || st.announced)) return;
      var ry = d.rival[0] + (s.flags['delay_' + d.id] || 0), rm = d.rival[1];
      var left = (ry * 12 + rm) - (s.date.y * 12 + s.date.m);
      var mine = D.foundByMe(d.id);
      if (left > 0 && left <= 8 && s.hints[d.id] && !mine && !s.flags['warn_' + d.id]) {
        s.flags['warn_' + d.id] = 1;
        out.push({ icon: 'hourglass', history: true, text: '소문: ' + U.j(d.rival[2], '이/가') + ' 「' + d.name + '」' + U.jx(d.name, '을/를') + ' 찾아 곧 떠난다고 한다. 서두르지 않으면 이름을 빼앗긴다! (앞으로 약 ' + left + '달)' });
      }
      // 찾아 두고 아직 알리지 않았다: 경쟁자가 발표하기 전에 알리라고 일러 준다
      if (left > 0 && left <= 8 && mine && !s.flags['warnf_' + d.id]) {
        s.flags['warnf_' + d.id] = 1;
        out.push({ icon: 'hourglass', history: true, text: '소문: ' + U.j(d.rival[2], '이/가') + ' 「' + d.name + '」의 발견을 곧 발표한다고 한다. 먼저 찾아 둔 제독이 그 전에 후원자에게 보고하거나 항구에서 발표하지 않으면, 나중에 알려도 명성을 절반밖에 받지 못한다! (앞으로 약 ' + left + '달)' });
      }
      if (s.date.y > ry || (s.date.y === ry && s.date.m >= rm)) {
        st = s.disc[d.id] || (s.disc[d.id] = {});
        st.rival = d.rival[2];
        if (st.me) st.late = true;               // 먼저 찾았지만 알리지 않았다 → 늦은 발표
        if (!st.found) st.found = U.dateNum(s.date);
        var at = G.SeaFolk && G.SeaFolk.rivalCity ? G.SeaFolk.rivalCity(d.rival[2]) : null, wh = at ? at.name + '에서 ' : '';   // 머무는 도시가 있는 경쟁자는 그곳에서 발표
        var nn = G.Names ? G.Names.onRival(d) : null, oldName = G.Names && G.DISC[d.id].aka ? G.DISC[d.id].aka : d.name;
        if (st.me) out.push({ icon: 'flag', text: d.rival[2] + U.j(d.rival[2], '이/가').slice(d.rival[2].length) + ' ' + wh + '「' + oldName + '」의 발견을 발표했다. 제독이 먼저 찾아 두고도 알리지 않은 사이의 일이다 — 이제 알려도 명성은 절반만 받는다.' + (nn ? ' ' + nn : '') });
        else out.push({ icon: 'flag', text: d.rival[2] + U.j(d.rival[2], '이/가').slice(d.rival[2].length) + ' ' + wh + '「' + oldName + '」의 발견을 발표했다.' + (nn ? ' ' + nn : '') });
        G.State.log(d.rival[2] + ': 「' + d.name + '」 발견 발표' + (st.me ? ' (먼저 찾아 두었지만 알리지 않았다 — 늦은 발표는 명성 절반)' : ''));
      }
    });
    return out;
  };

  /** announce (발표) at a harbor/palace without a sponsor: fame only */
  D.announce = function (id) {
    var s = S(), d = G.DISC[id], st = s.disc[id];
    if (!st || !st.me || st.reported || st.announced) return 0;
    st.announced = true;
    var fame = D.isLate(id) ? Math.round(D.fameFor(d) * 0.9 * D.LATE_FAME) : Math.round(D.fameFor(d) * (st.rival ? 0.35 : 0.9));
    // 증거(해도·지도, 유물)를 내보이면 제값, 없으면 덜 믿는다. 해도·지도는 왕실 해도소에 넘기고, 유물은 제독이 갖는다
    var proof = D.hasProof(id);
    if (d.evidence && G.Sponsor && G.Sponsor.takeEvidence) G.Sponsor.takeEvidence(id);
    var kept = D.keepRelics(id);
    if (D.needsProof(d) && !proof) fame = Math.round(fame * 0.8);
    D.lastAnnounce = { kept: kept, noProof: D.needsProof(d) && !proof };
    G.Fame.add('ex', fame);
    G.State.log('「' + d.name + '」의 발견을 발표했다. (명성 +' + fame + (D.isLate(id) ? ', 늦은 발표라 절반' : '') + (kept.length ? ', 유물 ' + kept.map(function (it) { return R.itemName(it); }).join('·') + U.jx(R.itemName(kept[kept.length - 1]), '은/는') + ' 제독의 것' : '') + ')');
    return fame;
  };

  /** discoveries owned by player, not yet reported/announced */
  D.unreported = function () {
    var s = S(); return G.DISCOVERIES.filter(function (d) { var st = s.disc[d.id]; return st && st.me && !st.reported && !st.announced; });
  };

  // ---------------------------------------------------------------- checks while moving
  /** at sea: check sea discoveries near position */
  D.checkSea = function (lon, lat) {
    var s = S(), hits = [];
    G.DISCOVERIES.forEach(function (d) {
      if (d.how !== 'sea' || D.foundByMe(d.id) || !D.needMet(d)) return;
      if (G.Geo.dist(lon, lat, d.lon, d.lat) >= d.r * D.clueK(d.id, 'find')) return;   // 단서가 겹칠수록 넓게
      if (!D.built(d)) { if (G.Mirage) G.Mirage.see(d); return; }   // 아직 세워지지 않았다 — 1600년부터는 신기루로 보인다
      hits.push(d);
    });
    // special geography conditions
    function sp(id) { if (!D.foundByMe(id) && D.needMet(G.DISC[id])) hits.push(G.DISC[id]); }
    if (lat < -34.2 && lon > 16 && lon < 30) sp('capegood');
    if (lon > -86 && lon < -60 && lat > 10 && lat < 27 && s.flags.fromEurope) sp('westroute');
    if (lon > 72 && lon < 78 && lat > 8 && lat < 20 && s.flags.viaCape) sp('indiaroute');
    if (lat < -62) { sp('antarctic'); if (lon > -75 && lon < -45) sp('antpeople'); }
    if (lat < -40 && lon > -20 && lon < 110 && U.chance(0.02)) sp('albatross');
    if (G.Geo.dist(lon, lat, 43.3, -11.7) < 1.5 && U.chance(0.05)) sp('coelacanth');
    var winter = s.date.m >= 10 || s.date.m <= 3;
    if (lat > 62 && winter && U.chance(0.03)) sp('aurora');
    if (G.Geo.dist(lon, lat, -170, -5) < 2.5 && s.hints.mu) sp('mu');
    return hits.filter(function (x, i) { return hits.indexOf(x) === i; });
  };
  /** on land expedition */
  D.checkLand = function (lon, lat) {
    var hits = [], near = null, nearD = 99;
    G.DISCOVERIES.forEach(function (d) {
      if (d.how !== 'land' || D.foundByMe(d.id) || !D.needMet(d)) return;
      var dist = G.Geo.dist(lon, lat, d.lon, d.lat);
      var r = d.r * (1 + R.skill('hist') * 0.25) * (d.cat === 'creature' || d.cat === 'nature' ? 1 + R.skill('sci') * 0.2 : 1) * D.clueK(d.id, 'find');
      if (!D.built(d)) { if (dist < r && G.Mirage) G.Mirage.see(d); return; }   // 신기루
      if (dist < r) hits.push(d);
      else if (dist < nearD) { nearD = dist; near = d; }
    });
    if (near && G.Reel && nearD < Math.max(1.2, near.r * 4)) G.Reel.prefetch(near);   // 가까워지면 발견 장면 판을 미리 받아 둔다
    return { hits: hits, near: near, nearDist: nearD };
  };
  D.checkCity = function (cityId) {
    return G.DISCOVERIES.filter(function (d) {
      if (d.how !== 'city' || d.city !== cityId || D.foundByMe(d.id) || !D.needMet(d)) return false;
      if (d.needHint && !S().hints[d.id]) return false;        // 동물: 이야기를 듣고 나서야 거리에서 알아본다
      if (!D.built(d)) { if (G.Mirage) G.Mirage.see(d); return false; }   // 신기루
      return true;
    });
  };
  /** 이 도시에서 찾을 수 있는 발견물의 장면 판을 미리 받는다 (입항하기 전에 — 도시에 들어서는 동안 받아진다) */
  D.prefetchCity = function (cityId) {
    if (!G.Reel) return;
    G.DISCOVERIES.forEach(function (d) { if (d.how === 'city' && d.city === cityId && !D.foundByMe(d.id) && D.built(d)) G.Reel.prefetch(d); });
  };
  D.checkTrade = function (goodId, city) {
    return G.DISCOVERIES.filter(function (d) { return d.how === 'trade' && d.good === goodId && d.regions.indexOf(city.region) >= 0 && !D.foundByMe(d.id); });
  };

  // ---------------------------------------------------------------- circumnavigation tracking
  D.trackCirc = function (dLon) {
    var s = S();
    if (!s.circ) return null;
    s.circ.cum += dLon;
    if (Math.abs(s.circ.cum) >= 360 && !s.circ.done) { s.circ.done = true; return 'done'; }
    return null;
  };
})(window.G = window.G || {});
