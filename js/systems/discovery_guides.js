/* 발견과 지역을 확인하고 세 길잡이의 만남·합류·첫 출항을 한 번씩 잇는다. */
(function (G) {
  'use strict';
  var DG = G.DiscoveryGuides = {}, UI = G.UI;
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.discoveryGuides || (s.discoveryGuides = { joined: {}, met: {}, sail: {} }); }
  function found(id) { return G.Disc.foundByMe(id); }
  function aboard(id) { return S().mates.some(function (m) { return m.id === id; }); }
  function who(d) { return { name: d.name, portrait: G.Scenes.mateSpec(d.id), half: G.Img.chain.mateHalf(d.id), lang: 3 }; }
  DG.eligible = function (id, c) {
    var t = st(); if (!c || t.joined[id] || aboard(id)) return false;
    if (id === 'ds_tenzing') return c.lon >= 80 && c.lon <= 94 && c.lat >= 18 && c.lat <= 30 && found('ds_557') && (found('yak') || found('folk_tibet') || found('everest'));
    if (id === 'ds_kaitau') return c.lat >= -45 && c.lat <= -10 && (c.lon >= 165 || c.lon <= -165) && (found('folk_maori') || found('ds_547'));
    if (id === 'ds_tekle') return c.lon >= 35 && c.lon <= 46 && c.lat >= 9 && c.lat <= 23 && found('prester');
    return false;
  };
  DG.gifts = function () {
    return (S().player.items || []).filter(function (it) { var d = G.ITEM[it.id]; return d && !(G.R.isProof && G.R.isProof(it)) && (d.kind === 'book' || /성경|성서|경전|종$/.test(d.name || '') || it.id === 'bell' || it.id === 'bible'); });
  };
  DG.offer = async function (d, c) {
    if (!DG.eligible(d.id, c)) return false;
    var t = st();
    for (var i = 0; i < d.meet.length; i++) await UI.say(d.meet[i], who(d));
    var gift = null;
    if (d.key === 'tekle') {
      var gifts = DG.gifts(); if (!gifts.length) { await UI.say('수도원에 남길 책이나 종 하나를 구해 다시 와 주시오.', who(d)); return false; }
      gift = await UI.choose('수도원장께 바칠 선물', gifts.map(function (it, i) { return { label: G.ITEM[it.id].name, value: i }; }), { cancel: true });
      if (gift == null) return false; gift = gifts[gift];
    }
    if (!await UI.confirm(d.request + '\n' + d.name + ' — 월급 금화 ' + d.wage + '닢', '함께 항해한다', '다음에')) return false;
    if (gift && !G.R.removeItem(gift.id, 1)) return false;
    var m = G.Legend.join(d.id, c); if (!m) return false;
    t.joined[d.id] = 1; t.sail[d.id] = 'waiting';
    G.Game.refreshHud(); return true;
  };
  DG.arrive = async function (c) {
    var s = S(); if (!s || s.tut && !s.tut.done) return;
    var t = st(), visit = (s.portVisit || 0) + ':' + c.id;
    for (var i = 0; i < G.DISC_GUIDES.length; i++) {
      var d = G.DISC_GUIDES[i];
      if (!DG.eligible(d.id, c) || t.met[d.id] === visit) continue;
      t.met[d.id] = visit; await DG.offer(d, c);
    }
  };
  DG.depart = function () {
    var t = st(); Object.keys(t.sail).forEach(function (id) { if (t.sail[id] === 'waiting' && aboard(id)) t.sail[id] = 'pending'; });
  };
  DG.tick = function () {
    var s = S(); if (!s || DG.running || G.Game.sceneName !== 'sea' || UI.busy() || G.DiscStories.running) return;
    var rt = G.Scenes.sea.runtime(); if (!rt || rt.busy) return;
    var t = st(), d = G.DISC_GUIDES.filter(function (x) { return t.sail[x.id] === 'pending' && aboard(x.id); })[0]; if (!d) return;
    DG.running = true; t.sail[d.id] = 'done'; rt.busy++;
    UI.say(d.sail, who(d)).catch(function (e) { console.error(e); }).finally(function () { rt.busy = Math.max(0, rt.busy - 1); DG.running = false; });
  };
  DG.local = function (label, d) { return d.id === 'prester' && /테클레|아비시니아 수도사/.test(label) ? { id: 'ds_tekle' } : null; };
})(window.G = window.G || {});
