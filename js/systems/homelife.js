/* 자택에서 아이와 보내는 시간 (G.HomeLife) — 나이·고장에 맞는 아이 그림, 「아이와 함께」 할 일, 집에 들어설 때 생기는 일, 추억의 물건.
   내용은 js/data/homelife.js, 장면 그림은 js/art/homeart.js, 조정값은 G.BALANCE.homelife.

   저장 상태 (옛 저장에는 없다 — 쓸 때 만든다)
   · 아이: k.edu['해:h:할 일'] = 올해 했다, k.playDay = 마지막으로 함께한 날, k.aim = 꿈(str·int·mar·cha), k.once = {한 번뿐인 일}
   · 제독: p.keeps = [{id, kid, y}] 추억의 물건, p.homeEvt = 집에서 일이 생긴 마지막 날, p.homeSeen = 집에 마지막으로 들른 날,
           p.homeGap = {dinner: 날, portrait: 해} */
(function (G) {
  'use strict';
  var U = G.U, HL = {};
  G.HomeLife = HL;
  function S() { return G.Game.state; }
  function F() { return G.Family; }
  function B() { return (G.BALANCE && G.BALANCE.homelife) || {}; }
  function LOOK() { return G.FAMILY_LOOK || { stages: [[3, 5], [8, 10], [13, 15]], scale: {}, region: {} }; }

  // ---------------------------------------------------------------- 아이 그림
  /** 나이에 맞는 그림 번호 (5·10·15). 세 살 아래 아기는 0 */
  HL.stage = function (k) {
    var age = F().kidAge(k), st = 0;
    LOOK().stages.forEach(function (x) { if (age >= x[0]) st = x[1]; });
    return st;
  };
  /** 딸 그림 폴더: 어머니의 고장 — 여급 그림 묶음과 같은 이름(images/maid-styles/<고장>, I.maidStyle). '' = 기본 */
  HL.region = function () {
    var p = S().player, w = p.wife, I = G.Img;
    try {
      if (w && G.MAID[w]) return I.maidStyle(w, G.CITY_DATA[G.MAID[w].city]) || '';
      if (w && G.MATE[w]) { var pool = I.MAID_POOL[(G.Art.mateSpec(w) || {}).style]; return (pool && pool[0]) || ''; }
    } catch (e) { /* 그림 규칙이 없으면 기본 그림 */ }
    return '';
  };
  /** 아이 그림 폴더: 딸은 어머니의 고장, 아들은 아버지(제독)의 생김새 (images/portraits/family/<폴더>/) */
  HL.folder = function (k) { return k.sex === 'f' ? HL.region() : (G.Img.heroLook ? G.Img.heroLook() : ''); };
  function order(k) {
    var same = (S().player.kids || []).filter(function (x) { return (x.sex === 'f') === (k.sex === 'f'); });
    return Math.max(1, same.indexOf(k) + 1);
  }
  /** 아이 그림 후보 (half = 무릎상) */
  HL.chain = function (k, half) {
    return G.Img.chain.kid(k.sex, order(k), HL.stage(k) || 5, HL.folder(k), half);   // 아기는 가장 어린 그림
  };
  /** 대화에서 말하는 아이 */
  HL.speaker = function (k, withAge) {
    var st = HL.stage(k), age = F().kidAge(k);
    return { name: k.name + (withAge ? ' (' + age + '세 · ' + F().bondWord(k) + ')' : ''), portrait: F().kidSpec(k), half: HL.chain(k, true), standScale: LOOK().scale[st] || 1, lang: 3 };
  };
  /** 집에 있는 아이들 (이름이 있고, 세 살부터, 견습으로 나가 있지 않은) */
  HL.kidsHome = function () {
    return (S().player.kids || []).filter(function (k) { return !k.unnamed && !k.aboard && F().kidAge(k) >= 3; });
  };

  // ---------------------------------------------------------------- 집 안에 서 있는 가족
  /** 자택 화면에 세울 사람들 [{who:'wife'|'kid', k, name, sub, chain, scale}] — 아내와 집에 있는 아이들(어린 순). 아기는 아내 곁의 이름표로만 */
  HL.family = function () {
    var s = S(), p = s.player, out = [], Fm = F();
    if (!p.wife) return out;
    var ws = Fm.wifeSpeaker(), babies = (p.kids || []).filter(function (k) { return !k.aboard && Fm.kidAge(k) < 3; });
    var wchain = ws.half || [];
    if (!wchain.length && ws.portrait && G.Art.portraitKeys) { try { wchain = G.Img.chain.halfFor(G.Art.portraitKeys(ws.portrait)); } catch (e) { wchain = []; } }
    out.push({ who: 'wife', name: Fm.wifeName(), sub: babies.length ? babies.map(function (k, i) { var nm = Fm.kidName(k); return i === babies.length - 1 ? U.j(nm, '을/를') : nm; }).join('·') + ' 안고 있다' : (p.preg && p.preg.told ? '아기를 기다리는 중' : '아내'), chain: wchain, portrait: ws.portrait, scale: 1 });
    HL.kidsHome().slice().sort(function (a, b) { return Fm.kidAge(a) - Fm.kidAge(b); }).forEach(function (k) {
      out.push({ who: 'kid', k: k, name: k.name, sub: Fm.kidAge(k) + '세 ' + Fm.bondHearts(k), chain: HL.chain(k, true), portrait: Fm.kidSpec(k), scale: LOOK().scale[HL.stage(k)] || 1 });
    });
    return out;
  };
  /** 자택 메뉴 화면의 가족 (misc.js HM.panel): 아내와 아이들이 방 안에 서 있다. 누르면 그 사람과 이야기한다 */
  HL.familyPanel = function () {
    var list = HL.family(); if (!list.length) return null;
    var fx = (G.FX && G.FX.homeFamily) || { h: 610, width: 1150, left: 50, bottom: 0, overlap: 0.3 };
    var el = U.el('div', 'home-family');
    el.style.cssText = 'left:' + fx.left + 'px;bottom:' + fx.bottom + 'px;width:' + fx.width + 'px;height:' + fx.h + 'px';
    // 사람이 많으면 겹쳐 세우고, 그래도 넘치면 모두 조금 줄인다
    var ws = list.map(function (f) { return fx.h * f.scale * 2 / 3; }), n = list.length;
    var total = ws.reduce(function (a, b) { return a + b; }, 0) * (1 - fx.overlap) + ws[n - 1] * fx.overlap;
    var k = Math.min(1, fx.width / total);
    list.forEach(function (f, i) {
      var h = Math.round(fx.h * f.scale * k), w = Math.round(h * 2 / 3);
      var one = U.el('div', 'hf-one ' + f.who);
      one.style.width = w + 'px'; one.style.height = h + 'px';
      if (i) one.style.marginLeft = -Math.round(w * fx.overlap) + 'px';
      one.style.zIndex = f.who === 'wife' ? 1 : 2 + i;
      one.style.animationDelay = (-i * 0.9) + 's';
      var key = G.Img.pick(f.chain), cv;
      if (key) cv = G.Img.make(f.chain, w * 2, h * 2, function () { return document.createElement('canvas'); }, { fit: 'contain' });
      else { one.classList.add('bust'); try { cv = G.Art.portraitCanvas(f.portrait, 200); } catch (e) { cv = document.createElement('canvas'); } }
      one.appendChild(cv);
      one.appendChild(U.el('div', 'hf-name wood', '<b>' + U.esc(f.name) + '</b><small>' + f.sub + '</small>'));
      one.title = f.who === 'wife' ? '아내와 이야기한다' : f.name + U.jx(f.name, '과/와') + ' 시간을 보낸다';
      one.onclick = function () {
        var C = G.Scenes.city;
        C.run(function () { return f.who === 'wife' ? F().talk() : HL.kidMenu(f.k); });
      };
      el.appendChild(one);
    });
    return el;
  };

  // ---------------------------------------------------------------- 글
  function fill(t, k) {
    var nm = k ? k.name : '아이';
    return String(t).replace(/\{name(?::([^}]+))?\}/g, function (_, pair) { return pair ? U.j(nm, pair) : nm; });
  }
  /** 줄 하나를 말한다: 'k:…' 아이 · 'w:…' 아내 · 'n:…' 설명 */
  async function line(l, k) {
    if (Array.isArray(l)) l = U.pick(l);
    var who = l.slice(0, 2), t = fill(l.slice(2), k), UI = G.UI;
    if (who === 'k:') { if (k) await UI.say(t, HL.speaker(k)); }
    else if (who === 'w:') { if (S().player.wife) await UI.say(t, F().wifeSpeaker()); }
    else await UI.say(t, {});
  }
  async function lines(list, k) { for (var i = 0; i < (list || []).length; i++) await line(list[i], k); }

  // ---------------------------------------------------------------- 결과
  var STAT = { str: '힘', 'int': '지력', mar: '무력', cha: '매력' };
  /** fx를 아이에게 적용하고, 바뀐 것을 한 줄로 돌려준다 */
  function apply(fx, k, all) {
    var s = S(), p = s.player, out = [], b = B();
    if (!fx) return '';
    var kids = all ? HL.kidsHome() : [k];
    if (fx.bond) { kids.forEach(function (x) { F().addBond(x, fx.bond); }); out.push('사이 ' + (fx.bond > 0 ? '+' : '') + fx.bond); }
    if (k && !all) {
      if (!k.st) k.st = { str: 50, 'int': 50, mar: 50, cha: 50 };
      Object.keys(STAT).forEach(function (x) { if (fx[x]) { k.st[x] = U.clamp(k.st[x] + fx[x], 1, b.statMax || 90); out.push(STAT[x] + ' +' + fx[x]); } });
      // 특기: 첫 단계는 누구나 가르칠 수 있고, 그 위는 제독(함대)이 아는 만큼만 — 할 일마다 상한이 있다
      if (fx.sk) Object.keys(fx.sk).forEach(function (id) {
        var cap = Math.min(fx.sk[id], Math.max(G.R.skill(id), 1));
        k.sk = k.sk || {};
        if ((k.sk[id] || 0) < cap && U.chance(b.skillChance == null ? 0.6 : b.skillChance)) { k.sk[id] = (k.sk[id] || 0) + 1; out.push(G.SKILL_BY_ID[id].name + ' ' + k.sk[id]); }
      });
      if (fx.lang) {
        var li = HL.teachLang(k);
        if (li != null) { k.lg = k.lg || {}; k.lg[li] = (k.lg[li] || 0) + 1; out.push(G.LANGS[li] + ' ' + G.LANG_LV[k.lg[li]]); }
      }
      if (fx.gold) { var g = Math.round((k.st['int'] || 50) * (b.ledgerGold || 4)); p.gold += g; out.push('금화 +' + U.num(g)); }
    }
    if (fx.rest) { s.fleet.fatigue = Math.max(0, (s.fleet.fatigue || 0) - (b.dinnerRest || 10)); }
    if (fx.keep) { if (HL.addKeep(fx.keep, all ? null : k)) out.push(fill(G.HOME_KEEPS[fx.keep].name, k) + U.jx(fill(G.HOME_KEEPS[fx.keep].name, k), '을/를') + ' 얻었다'); }
    return out.join(' · ');
  }
  /** 아이에게 가르칠 수 있는 말: 제독이 보통(2) 이상 하고 아이가 그보다 못하는 말 (아이는 보통까지) */
  HL.teachLang = function (k) {
    var p = S().player, best = null;
    (p.lg || []).forEach(function (lv, li) {
      var kl = (k.lg && k.lg[li]) || 0;
      if (lv >= 2 && kl < Math.min(2, lv) && li !== G.R.nativeLang(p.nation) && (best == null || lv > p.lg[best])) best = li;
    });
    return best;
  };
  HL.addKeep = function (id, k) {
    var p = S().player; p.keeps = p.keeps || [];
    if (p.keeps.some(function (x) { return x.id === id && (x.kid || '') === (k ? k.name : ''); })) return false;
    p.keeps.push({ id: id, kid: k ? k.name : '', y: S().date.y });
    return true;
  };

  // ---------------------------------------------------------------- 할 일
  function yearKey(a) { return S().date.y + ':h:' + a.id; }
  /** 이 아이와 지금 할 수 있는가 — {ok, why} */
  HL.can = function (a, k) {
    var s = S(), p = s.player, age = k ? F().kidAge(k) : 0;
    if (a.family) {
      if (!p.wife || !HL.kidsHome().length) return { ok: false, hide: true };
      p.homeGap = p.homeGap || {};
      if (a.gap && p.homeGap[a.id] != null && s.day - p.homeGap[a.id] < a.gap) return { ok: false, why: (a.gap - (s.day - p.homeGap[a.id])) + '일 뒤에' };
      if (a.gapYears && p.homeGap[a.id] != null && s.date.y - p.homeGap[a.id] < a.gapYears) return { ok: false, why: (p.homeGap[a.id] + a.gapYears) + '년에' };
      return { ok: true };
    }
    if (age < a.min || age > a.max) return { ok: false, hide: true };
    if (a.need === 'lang' && HL.teachLang(k) == null) return { ok: false, hide: true };
    if (k.edu && k.edu[yearKey(a)]) return { ok: false, why: '올해는 했다' };
    return { ok: true };
  };
  function costText(a) { return (a.cost ? U.num(a.cost) + '닢' : '') + (a.cost && a.days ? ' · ' : '') + (a.days ? a.days + '일' : ''); }

  /** 체스: 아이의 지력과 제독의 지력을 견준다 */
  async function chess(k) {
    var me = G.R.stat('int') + U.ri(-12, 12), kid = (k.st['int'] || 50) + U.ri(-12, 12), UI = G.UI;
    var v = await UI.ask(fill('{name}의 기사가 깊숙이 들어왔다. 어떻게 둘까?', k), [{ label: '정석대로 받아친다', value: 'a' }, { label: '일부러 길을 열어 준다', value: 'b' }], HL.speaker(k));
    if (v === 'b' || kid > me) { await line(['k:외통수! …제가 이긴 거 맞죠?', 'k:이겼다! 아버지, 한 판 더 하실래요?'], k); return apply({ bond: v === 'b' ? 4 : 7, 'int': 2 }, k); }
    await line(['k:아… 거기에 성장이 있었네요. 졌습니다.', 'k:다음에는 그 수에 안 당할 거예요.'], k);
    return apply({ bond: 5, 'int': 1 }, k);
  }
  /** 앞날 이야기: 아이의 꿈을 듣는다 */
  async function dream(k) {
    var UI = G.UI, best = 'str';
    Object.keys(STAT).forEach(function (x) { if ((k.st[x] || 0) > (k.st[best] || 0)) best = x; });
    var aim = G.HOME_AIMS[k.aim || best], sp = HL.speaker(k);
    await UI.say(aim.say, sp);
    var v = await UI.ask(fill('{name:은/는} ' + aim.name + U.jx(aim.name, '이/가') + ' 되고 싶어 한다.', k), [
      { label: '「네 뜻대로 해 보아라. 내가 돕겠다.」', value: 'own' },
      { label: '「먼저 내 뒤를 이어 함대를 맡아 다오.」', value: 'heir' }], sp);
    if (v === 'own') {
      k.aim = k.aim || best;
      await UI.say('…정말입니까? 고맙습니다, 아버지. 부끄럽지 않게 하겠습니다.', sp);
      return apply({ bond: 8 }, k) + ' · 꿈: ' + aim.name + ' (해마다 ' + STAT[k.aim] + '이 더 자란다)';
    }
    var good = F().bond(k) >= 65;
    await UI.say(good ? '아버지의 배라면… 좋습니다. 그 길 위에서 제 꿈도 찾겠습니다.' : '…그럴 줄 알았습니다. 알겠습니다.', sp);
    return apply({ bond: good ? 3 : -4 }, k);
  }

  /** 할 일 하나를 한다 */
  HL.run = async function (a, k) {
    var s = S(), p = s.player, UI = G.UI, b = B();
    if (a.cost && p.gold < a.cost) { UI.toast('금화가 모자랍니다. (' + U.num(a.cost) + '닢)', 'coin'); return; }
    var art = G.HomeArt ? G.HomeArt.show(a.pic, { title: a.name }) : null;
    var res = '';
    try {
      var cold = k && !a.family && F().bond(k) < (b.cold || 30) && a.cold;
      if (a.cost) p.gold -= a.cost;
      if (a.family) {
        var ks = HL.kidsHome(), kk = U.pick(ks);
        await lines(a.intro, kk);
        res = apply(a.fx, null, true);
        await lines(a.done, kk);
        p.homeGap = p.homeGap || {}; p.homeGap[a.id] = a.gapYears ? s.date.y : s.day;
      } else {
        await line(a.intro[0], k);
        if (cold) await lines(a.cold, k); else await lines(a.intro.slice(1), k);
        if (a.need === 'chess') res = await chess(k);
        else if (a.need === 'dream') res = await dream(k);
        else if (a.pick) {
          var opts = a.pick.opts.map(function (o, i) { return { label: o.label + (o.cost ? ' (금화 ' + U.num(o.cost) + '닢)' : ''), value: i }; });
          var v = await UI.ask(fill(a.pick.text, k), opts, HL.speaker(k)), o = a.pick.opts[v] || a.pick.opts[0];
          if (o.cost && p.gold < o.cost) { UI.toast('금화가 모자라 구경만 하고 돌아왔다.', 'coin'); o = a.pick.opts[a.pick.opts.length - 1]; }
          if (o.cost) p.gold -= o.cost;
          res = apply(o.fx, k);
          if (o.say) await line(o.say, k);
        } else {
          res = apply(a.fx, k);
          await lines(a.done, k);
        }
        if (cold) F().addBond(k, b.coldBonus || 2);          // 서먹한 아이일수록 함께한 시간이 크다
        k.edu = k.edu || {}; k.edu[yearKey(a)] = 1; k.playDay = s.day;
      }
    } catch (e) { console.error(e); }
    if (art) await art.stop();
    if (a.days) await UI.fade(function () { G.Game.passDays(a.days); });
    if (res) UI.toast((k && !a.family ? k.name + ' — ' : '가족 — ') + res, 'heart', 5000);
    if (k && !a.family) G.State.log('자택 — ' + k.name + ': ' + a.name + '.');
    if (G.Game.cityHud) G.Game.cityHud();
  };

  /** 자택 메뉴 「아이와 함께」 */
  HL.menu = async function () {
    var UI = G.UI, s = S();
    for (;;) {
      var kids = HL.kidsHome();
      if (!kids.length) { UI.toast('집에 함께 시간을 보낼 아이가 없습니다.', 'heart'); return; }
      var opts = kids.map(function (k, i) {
        return { label: k.name + ' <small class="muted">' + F().kidAge(k) + '세 · ' + (k.sex === 'f' ? '딸' : '아들') + (k.aim ? ' · 꿈: ' + G.HOME_AIMS[k.aim].name : '') + '</small>', right: F().bondHearts(k), value: i, thumb: kidThumb(k), icon: 'heart' };
      });
      G.HOME_ACTS.filter(function (a) { return a.family; }).forEach(function (a) {
        var c = HL.can(a); if (c.hide) return;
        opts.push({ label: a.name, right: c.ok ? costText(a) : c.why, value: 'f:' + a.id, icon: a.icon, disabled: !c.ok });
      });
      if ((s.player.keeps || []).length) opts.push({ label: '추억 상자를 열어 본다', right: s.player.keeps.length + '점', value: 'keeps', icon: 'chest' });
      var v = await UI.choose('아이와 함께', opts, { width: 620, icon: 'heart', text: '누구와 시간을 보낼까요? 같은 일은 아이마다 한 해에 한 번씩 할 수 있습니다.' });
      if (v == null) return;
      if (v === 'keeps') { await HL.keeps(); continue; }
      if (typeof v === 'string') { var fa = G.HOME_ACTS.filter(function (a) { return 'f:' + a.id === v; })[0]; if (fa && HL.can(fa).ok) await HL.run(fa); continue; }
      await HL.kidMenu(kids[v]);
    }
  };
  function kidThumb(k) { var key = G.Img.pick(HL.chain(k, false)); return key ? G.Img.src(key) : null; }
  HL.kidMenu = async function (k) {
    var UI = G.UI;
    for (;;) {
      var list = G.HOME_ACTS.filter(function (a) { return !a.family && !HL.can(a, k).hide; });
      var opts = list.map(function (a) {
        var c = HL.can(a, k);
        return { label: a.name, right: c.ok ? costText(a) : c.why, value: a.id, icon: a.icon, disabled: !c.ok };
      });
      var st = k.st || {};
      var v = await UI.choose(k.name + ' (' + F().kidAge(k) + '세)', opts, { width: 600, icon: 'heart',
        text: F().bondHearts(k) + ' ' + F().bondWord(k) + ' — 힘 ' + (st.str || 0) + ' · 지력 ' + (st['int'] || 0) + ' · 무력 ' + (st.mar || 0) + ' · 매력 ' + (st.cha || 0) +
          (Object.keys(k.sk || {}).length ? '<br><small class="muted">' + Object.keys(k.sk).map(function (id) { return (G.SKILL_BY_ID[id] || { name: id }).name + ' ' + k.sk[id]; }).join(' · ') + '</small>' : '') });
      if (v == null) return;
      var a = list.filter(function (x) { return x.id === v; })[0];
      if (!a || !HL.can(a, k).ok) continue;
      await HL.run(a, k);
    }
  };
  /** 추억 상자 */
  HL.keeps = async function () {
    var p = S().player, UI = G.UI;
    var html = (p.keeps || []).map(function (x) {
      var d = G.HOME_KEEPS[x.id] || { name: x.id, icon: 'heart' }, nm = String(d.name).replace('{name}', x.kid || '아이');
      return '<div class="choice" style="cursor:default">' + G.icon(d.icon) + '<span>' + U.esc(nm) + '</span><span class="r">' + (x.kid ? U.esc(x.kid) + ' · ' : '') + x.y + '년</span></div>';
    }).join('');
    await UI.window({ title: '추억 상자', icon: 'chest', width: 520, html: '<div class="choices">' + html + '</div><div class="muted" style="margin-top:10px;font-size:15px">먼 바다에서 가끔 꺼내 보면 피로가 조금 풀린다.</div>', buttons: [{ label: '닫는다', value: 1 }] }).result;
  };

  // ---------------------------------------------------------------- 집에 들어설 때 생기는 일
  function eligible(h, k) {
    var s = S(), p = s.player, age = F().kidAge(k), b = B(), bond = F().bond(k);
    if (age < h.min || age > h.max) return false;
    if (h.when === 'longAway') return p.homeSeen != null && s.day - p.homeSeen >= (b.longAway || 300);
    if (h.when === 'birthday') {
      if (k.bday === s.date.y) return false;
      var d = Math.abs((s.date.m - k.born.m) * 30 + (s.date.d - k.born.d)); d = Math.min(d, 360 - d);
      return d <= (b.birthdayDays || 10);
    }
    if (h.when === 'lowBond') return bond < 45;
    if (h.when === 'highBond') return bond >= 60;
    if (h.when === 'tutor') return !!(k.edu && (k.edu[s.date.y] || k.edu[s.date.y - 1]));
    return true;
  }
  /** 자택에 들어섰을 때 (misc.js HM.enter): 가끔 아이와 얽힌 일이 생긴다 */
  HL.happen = async function () {
    var s = S(), p = s.player, b = B(), UI = G.UI;
    var kids = HL.kidsHome(), seen = p.homeSeen;
    if (!p.wife || !kids.length) { p.homeSeen = s.day; return; }
    var gap = b.happenGap == null ? 20 : b.happenGap;
    var list = [];
    G.HOME_HAPPEN.forEach(function (h) { kids.forEach(function (k) { if (eligible(h, k)) list.push([h, k]); }); });
    p.homeSeen = s.day;
    // 오래 떠나 있다 돌아온 날·생일은 꼭, 그 밖에는 가끔
    var must = list.filter(function (x) { return x[0].when === 'longAway' || x[0].when === 'birthday'; });
    if (!must.length && ((p.homeEvt != null && s.day - p.homeEvt < gap) || !U.chance(b.happenChance == null ? 0.55 : b.happenChance))) return;
    var pickd = must.length ? must[0] : U.pick(list.filter(function (x) { return x[0].id !== p.homeLast; }));
    if (!pickd) return;
    var h = pickd[0], k = pickd[1];
    p.homeEvt = s.day; p.homeLast = h.id; void seen;
    if (h.when === 'birthday') k.bday = s.date.y;
    var art = G.HomeArt ? G.HomeArt.show(h.pic, {}) : null, res = '';
    try {
      await lines(h.lines, k);
      var opts = h.pick.opts.map(function (o, i) { return { label: fill(o.label, k) + (o.cost ? ' (금화 ' + U.num(o.cost) + '닢)' : '') + (o.days ? ' (' + o.days + '일)' : ''), value: i }; });
      var v = await UI.ask(fill(h.pick.text, k), opts, HL.speaker(k)), o = h.pick.opts[v] || h.pick.opts[0];
      if (o.cost && p.gold < o.cost) { UI.toast('금화가 모자랍니다.', 'coin'); o = h.pick.opts[h.pick.opts.length - 1]; }
      if (o.cost) p.gold -= o.cost;
      res = apply(o.fx, k);
      if (o.say) await line(o.say, k);
      if (o.days) await UI.fade(function () { G.Game.passDays(o.days); });
    } catch (e) { console.error(e); }
    if (art) await art.stop();
    if (res) UI.toast(k.name + ' — ' + res, 'heart', 5000);
    if (G.Game.cityHud) G.Game.cityHud();
  };

  // ---------------------------------------------------------------- 날·해
  /** 날마다 (W.daily): 먼 바다에서 가끔 추억의 물건을 꺼내 본다 */
  HL.daily = function () {
    var s = S(), p = s.player, b = B(), out = [];
    var keeps = (p.keeps || []).filter(function (x) { return G.HOME_KEEPS[x.id] && G.HOME_KEEPS[x.id].sea; });
    if (!keeps.length || !s.loc || s.loc.mode !== 'sea' || (s.fleet.fatigue || 0) < (b.keepFatigue || 25)) return out;
    if (!U.chance(b.keepChance == null ? 0.03 : b.keepChance)) return out;
    var x = U.pick(keeps);
    s.fleet.fatigue = Math.max(0, s.fleet.fatigue - (b.keepRest || 4));
    out.push({ icon: 'heart', text: String(G.HOME_KEEPS[x.id].sea).replace('{name}', x.kid || '아이') });
    return out;
  };
  /** 해마다 (W.newYear): 꿈을 정한 아이는 그 능력이 하나 더 자란다 */
  HL.newYear = function () {
    (S().player.kids || []).forEach(function (k) {
      if (k.aim && k.st && k.st[k.aim] != null) k.st[k.aim] = Math.min(B().statMax || 90, k.st[k.aim] + 1);
    });
    return [];
  };
})(window.G = window.G || {});
