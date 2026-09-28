/* Discoveries: hints, finding, rivals, announcements. */
(function (G) {
  'use strict';
  var U = G.U, R = G.R, UI = G.UI;
  var D = {};
  G.Disc = D;
  function S() { return G.Game.state; }

  D.state = function (id) { return S().disc[id] || null; };
  D.isFound = function (id) { var d = S().disc[id]; return !!(d && d.found); };
  D.foundByMe = function (id) { var d = S().disc[id]; return !!(d && d.found && d.me); };
  D.announcedBy = function (id) { var d = S().disc[id]; return d && d.rival ? d.rival : null; };
  D.hasHint = function (id) { return !!S().hints[id]; };
  /** 단서를 적는다. 아직 개척 단계가 닿지 않은 발견물은 받지 않는다 (G.Frontier) */
  D.addHint = function (id, src) {
    var s = S(); if (s.hints[id] || D.foundByMe(id)) return false;
    if (G.Frontier && G.DISC[id] && !G.Frontier.canHint(G.DISC[id], src)) return false;
    s.hints[id] = { src: src, d: U.dateNum(s.date) }; return true;
  };
  /** 지금 단서를 들을 수 있는 발견물인가 */
  D.available = function (d) { return !G.Frontier || G.Frontier.available(d); };
  /** 그림·세공이 발견물의 값어치를 올린다 — 제독이든 부하든(역할·배 상관없이) 가장 잘하는 사람의 솜씨.
      그림: 단계마다 +6% (무엇이든 그려 남긴 기록이 값을 더한다), 세공: 보물·유적·민족(공예)은 단계마다 +7%, 그 밖은 +3%.
      발견 명성·보고 사례금·명명 하사금·보물 노획에 쓰인다 (선금·후원자 관심은 원래 값). */
  D.VALUE_K = { art: 0.06, craft: 0.07, craftOther: 0.03 };
  D.valueParts = function (d) {
    var art = R.skillRead ? R.skillRead('art') : R.skill('art'), craft = R.skillRead ? R.skillRead('craft') : R.skill('craft');
    var hand = d && (d.cat === 'treasure' || d.cat === 'ruin' || d.cat === 'people');
    var ka = art * D.VALUE_K.art, kc = craft * (hand ? D.VALUE_K.craft : D.VALUE_K.craftOther);
    return { art: art, craft: craft, ka: ka, kc: kc, k: 1 + ka + kc, artWho: R.skillBest ? R.skillBest('art').who : null, craftWho: R.skillBest ? R.skillBest('craft').who : null };
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
    var why = []; if (v.ka) why.push('그림' + (v.artWho ? '·' + v.artWho : '') + ' +' + Math.round(v.ka * 100) + '%'); if (v.kc) why.push('세공' + (v.craftWho ? '·' + v.craftWho : '') + ' +' + Math.round(v.kc * 100) + '%');
    return '가치 ' + U.num(D.value(d)) + ' <small>(' + why.join(', ') + ')</small>';
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
    s.player.fame += fame;
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
    // 칸이 남는 만큼 먼저 챙기고, 모자라면 카드를 본 뒤에 무엇을 버릴지 묻는다
    var wait = [];
    rel.forEach(function (r) { if (R.addItem(r.id, { disc: d.id })) got.push(r); else wait.push(r); });
    st.relics = got.map(function (r) { return r.id; });
    await G.Scenes.discoveryCard(d, fame, got.concat(wait));
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
      if (R.addItem(r.id, { disc: d.id })) { (st.relics = st.relics || []).push(r.id); UI.toast(r.name + U.jx(r.name, '을/를') + ' 챙겼다.', 'chest'); return true; }
      var list = s.player.items.map(function (it, i) { return { it: it, i: i }; }).filter(function (x) { return !R.isProof(x.it); });
      var v = await UI.choose('소지품이 가득 찼습니다', list.map(function (x, k) {
        var dd = G.ITEM[x.it.id] || {};
        return { label: '버린다: ' + U.esc(R.itemName(x.it)), right: G.ITEM_KIND[dd.kind || x.it.kind] || '', value: k, icon: 'chest' };
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
    s.player.gold += gold; s.player.fame += fame;
    var king = s.player.nation === 'ES' ? '에스파냐 왕실' : '포르투갈 왕실';
    setTimeout(function () { UI.toast('발견 ' + n + '가지 달성! ' + king + '에서 포상금 금화 ' + U.num(gold) + '닢을 보내왔다. (명성 +' + fame + ')', 'crown', 6500); }, 900);
    G.State.log('발견 ' + n + '가지를 모았다. ' + king + '의 포상 (금화 ' + U.num(gold) + ', 명성 +' + fame + ')');
  };
  D.nextCollect = function () { var n = S().stats.found; for (var i = 0; i < COLLECT.length; i++) if (COLLECT[i] > n) return COLLECT[i]; return null; };

  /** 늦은 발표: 먼저 찾아 두고도 알리지 않는 사이 경쟁자가 발표했으면, 이제 알려도 명성은 이만큼만 받는다 */
  D.LATE_FAME = 0.5;
  D.isLate = function (id) {
    var st = S().disc[id], d = G.DISC[id]; if (!st || !st.me) return false;
    if (st.late) return true;
    // 예전 기록: 경쟁자 발표일보다 먼저 찾았고 경쟁자가 발표했으면 늦은 발표로 본다
    return !!(st.rival && d && d.rival && st.found && st.found < d.rival[0] * 10000 + d.rival[1] * 100 + 1);
  };
  /** 보고·발표로 받을 명성에 곱할 값 (늦은 발표면 D.LATE_FAME) */
  D.lateK = function (id) { return D.isLate(id) ? D.LATE_FAME : 1; };

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
        var nn = G.Names ? G.Names.onRival(d) : null, oldName = G.Names && G.DISC[d.id].aka ? G.DISC[d.id].aka : d.name;
        if (st.me) out.push({ icon: 'flag', text: d.rival[2] + U.j(d.rival[2], '이/가').slice(d.rival[2].length) + ' 「' + oldName + '」의 발견을 발표했다. 제독이 먼저 찾아 두고도 알리지 않은 사이의 일이다 — 이제 알려도 명성은 절반만 받는다.' + (nn ? ' ' + nn : '') });
        else out.push({ icon: 'flag', text: d.rival[2] + U.j(d.rival[2], '이/가').slice(d.rival[2].length) + ' 「' + oldName + '」의 발견을 발표했다.' + (nn ? ' ' + nn : '') });
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
    s.player.fame += fame;
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
      if (d.how !== 'sea' || D.foundByMe(d.id)) return;
      if (G.Geo.dist(lon, lat, d.lon, d.lat) < d.r) hits.push(d);
    });
    // special geography conditions
    function sp(id) { if (!D.foundByMe(id)) hits.push(G.DISC[id]); }
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
      if (d.how !== 'land' || D.foundByMe(d.id)) return;
      var dist = G.Geo.dist(lon, lat, d.lon, d.lat);
      var r = d.r * (1 + R.skill('hist') * 0.25) * (d.cat === 'creature' || d.cat === 'nature' ? 1 + R.skill('sci') * 0.2 : 1);
      if (dist < r) hits.push(d);
      else if (dist < nearD) { nearD = dist; near = d; }
    });
    return { hits: hits, near: near, nearDist: nearD };
  };
  D.checkCity = function (cityId) {
    return G.DISCOVERIES.filter(function (d) { return d.how === 'city' && d.city === cityId && !D.foundByMe(d.id); });
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
