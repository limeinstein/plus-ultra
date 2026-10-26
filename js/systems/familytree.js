/* 가문의 가계도 (G.FamilyTree) — 자택 메뉴 「가계도」. 2026-10-22 사용자 요청: 1대 제독이 은퇴한 뒤부터 자택에서 가문의 가계도를 본다.
   ■ 기록: 세대 교체(G.Family.succeed) 때 물러나는 제독 한 사람을 s.lineage 에 남긴다 (FT.record) —
     이름·생몰(태어난 해 ~ 물러난 해, 은퇴 / 바다에서 생을 마침)·제독으로 지낸 해·칭호, 본처와 둘째 부인들, 아이들(그때의 얼굴 그림·나이·앞날)과 그 대의 동생들.
   ■ 보기: 위에서 아래로 1대 → 지금 제독. 대마다 「제독 ═ 부인」 아래에 아이들이 줄지어 서고, 뒤를 이은 아이는 금테 · 「▼ N대 제독」.
     아이들의 앞날: 뒤를 이음 · 시집감(혼처) · 제 길로(선장·학자·기사·상인) · 항해사로 함께 · 집에서 지냄 · 섬에서 사라짐 —
     새 제독의 동생이 된 아이는 지금의 모습(s.player.siblings)이나 다음 대의 기록에서 앞날을 읽는다.
   ■ 옛 저장: 세대가 2대 이상인데 기록이 없으면 항해 일지(「…이 은퇴하고 …이 뒤를 이었다」)에서 이름만 찾아 채운다 —
     불러올 때 한 번만 찾아 s.lineage 에 남긴다 (FT.migrate · s.flags.lineageV — 2026-10-23 QA 2: 예전엔 열 때마다 일지를 뒤져, 그 줄이 지워지면 이름이 사라졌다).
     재임 시작 해(from)가 없는 2대 이후 제독은 앞 대가 물러난 해 → 일지의 세대 교체 해 → 동생들이 집에 든 해 순으로 찾고, 없으면 「?」 (QA 3 — 예전엔 게임 시작 해 1480).
   ■ 저장: s.lineage = [{gen, name, born, from, to, end, age, title, nation, chain, wife:{name, chain}, wives:[이름], kids:[…], sibs:[…]}] */
(function (G) {
  'use strict';
  var U = G.U;
  var FT = G.FamilyTree = {};
  function S() { return G.Game && G.Game.state; }
  function F() { return G.Family; }
  function HL() { return G.HomeLife; }
  function key(k) { return (k.given != null ? k.given : k.name || '') + ':' + (k.born ? k.born.y + '-' + k.born.m + '-' + k.born.d : ''); }   // 지은 이름 — 성이 붙어도(2026-10-26) 예전 기록과 맞게
  FT.key = key;
  function keys(spec) { try { return (G.Art.portraitKeys(spec) || []).slice(0, 6); } catch (e) { return []; } }
  /** 제독의 얼굴 (그때 나이의 얼굴 — 뒤를 이은 아들은 아이 때 그림을 이은 얼굴) */
  function heroKeys(p) { var out = []; try { out = (G.Img.chain.heroPortrait(p) || []).slice(0, 6); } catch (e) { /* */ } return out.length ? out : keys(p.portrait); }
  function kidChain(k) { try { return HL().chain(k, false).slice(0, 6); } catch (e) { return []; } }

  /** 아이의 앞날 (기록할 때 정해진 것) — 동생이 된 아이는 null (그 뒤의 일은 따로 읽는다) */
  function fateNow(k, heir, nextGen) {
    if (k === heir) return { t: '뒤를 이음 — ' + nextGen + '대 제독', cls: 'heir' };
    if (k.married) return { t: k.married.kind === 'away' ? '편지 한 장 남기고 떠남' : (k.married.kind === 'prince' ? '왕세자비' : '시집감 — ' + k.married.title), cls: 'wed' };
    if (k.lost) return { t: '섬에서 사라짐', cls: 'lost' };
    return null;
  }
  /** 동생(새 제독의 형제)의 앞날 */
  function sibFate(k) {
    if (k.left) return k.left.kind === 'wed' ? { t: '시집감 — ' + k.left.title, cls: 'wed' } : { t: '제 길로 — ' + k.left.title, cls: 'life' };
    if (G.Siblings && G.Siblings.hired(k)) return { t: '항해사로 함께 항해', cls: 'mate' };
    return { t: '집에서 지냄', cls: 'home' };
  }
  function kidRow(k, heir, nextGen) {
    var f = fateNow(k, heir, nextGen);
    return { key: key(k), name: F().kidName(k), sex: k.sex === 'f' ? 'f' : 'm', by: k.born ? k.born.y : null, age: F().kidAge(k), chain: kidChain(k), heir: k === heir, fate: f, sib: !f };
  }

  /** 세대 교체 때 (G.Family.succeed) — 물러나는 제독(p, 아직 s.player)을 남긴다. end: 'retire' | 'death' */
  FT.record = function (p, heir, end) {
    var s = S(), Fm = F(), R = G.R;
    var gen = p.generation || 1, nextGen = gen + 1;
    var line = s.lineage || (s.lineage = []);
    if (line.some(function (x) { return x.gen === gen; })) return null;
    var wife = null;
    if (p.wife) { var ws = Fm.wifeSpeaker(); wife = { name: Fm.wifeName(), chain: keys(ws.portrait) }; }
    var wives = (p.wives2 || []).map(function (w) { return G.Wives ? G.Wives.name(w) : '부인'; });
    var e = {
      gen: gen, name: p.name, nation: p.nation, born: p.born ? p.born.y : null,
      from: p.since != null ? p.since : startYear(s, p, gen), to: s.date.y,
      end: end === 'death' ? 'death' : 'retire', age: R.age ? R.age() : null,
      title: R.fameTitle ? R.fameTitle(p.fame || 0) : '', chain: heroKeys(p),
      wife: wife, wives: wives,
      kids: (p.kids || []).map(function (k) { return kidRow(k, heir, nextGen); }),
      sibs: (p.siblings || []).map(function (k) {   // 이 제독의 동생들 — 물러날 때 집에 남아 있던 사람은 이제 분가한다 (siblings.js)
        var f = sibFate(k); if (f.cls === 'home') f = { t: '분가함', cls: 'life' };
        return { key: key(k), fate: f, chain: kidChain(k), age: Fm.kidAge(k) };
      })
    };
    line.push(e);
    return e;
  };

  /** 항해 일지의 세대 교체 줄: {뒤를 이은 이름: {old: 물러난 이름, y: 해}} */
  function succNames(s) {
    var names = {};
    (s.log || []).forEach(function (l) {
      var m = /^(.+?)[이가] 은퇴하고 (.+?)[이가] 뒤를 이었다/.exec(String(l && l.t || ''));
      if (m) names[m[2]] = { old: m[1], y: Math.floor((l.d || 0) / 10000) };
    });
    return names;
  }
  /** 게임을 시작한 해 (1대 제독이 제독이 된 해) */
  function gameStart(s) { return Math.round(s.date.y - (s.day || 0) / 365.25); }
  /** 제독 p(gen대)가 제독이 된 해 — since 가 없는 옛 저장의 2대 이후: 앞 대의 기록이 물러난 해 → 일지의 세대 교체 해 → 동생들(앞 대의 아이들)이 집에 든 해 → 모름(null) */
  function startYear(s, p, gen) {
    if ((gen || 1) <= 1) return gameStart(s);
    var prev = (s.lineage || []).filter(function (x) { return x.gen === gen - 1; })[0];
    if (prev && prev.to != null) return prev.to;
    var n = p && p.name ? succNames(s)[p.name] : null;
    if (n && n.y) return n.y;
    var sb = ((p && p.siblings) || []).filter(function (k) { return k && k.sib && k.sib.y; })[0];
    return sb ? sb.sib.y : null;
  }
  FT.startYear = function (p, gen) { var s = S(); p = p || s.player; return startYear(s, p, gen || p.generation || 1); };

  /** 기록이 없는 선대를 채운다 — scan: 항해 일지에서 이름을 찾는다 (옛 저장의 첫 불러오기 한 번만) */
  function fill(s, scan) {
    var line = s.lineage || [], gen = (s.player && s.player.generation) || 1;
    var out = line.slice();
    if (gen <= 1) return out;
    var names = scan ? succNames(s) : {}, cur = s.player.name;
    for (var g = gen - 1; g >= 1; g--) {
      var have = out.filter(function (x) { return x.gen === g; })[0];
      if (have) { cur = have.name; continue; }
      var n = names[cur];
      out.push({ gen: g, name: n ? n.old : '', to: n ? n.y : null, end: 'retire', kids: [], sibs: [], stub: true });
      cur = n ? n.old : '';
    }
    out.sort(function (a, b) { return a.gen - b.gen; });
    // 이름만 남은 대의 재임 시작 해: 1대는 게임을 시작한 해, 그 뒤는 앞 대가 물러난 해
    out.forEach(function (e, i) {
      if (!e.stub || e.from != null) return;
      if (e.gen === 1) e.from = gameStart(s);
      else { var pv = out[i - 1]; if (pv && pv.gen === e.gen - 1 && pv.to != null) e.from = pv.to; }
    });
    return out;
  }
  /** 옛 저장을 불러올 때 한 번 (js/core/state.js ST.deserialize): 일지에서 찾은 선대를 s.lineage 에 남기고, 지금 제독의 since 를 채운다 */
  FT.VERSION = 1;
  FT.migrate = function (s) {
    if (!s || !s.player) return false;
    var f = s.flags || (s.flags = {});
    if ((f.lineageV || 0) >= FT.VERSION) return false;
    f.lineageV = FT.VERSION;
    var gen = s.player.generation || 1;
    if (gen <= 1) return false;
    var before = (s.lineage || []).length;
    s.lineage = fill(s, true);
    if (s.player.since == null) { var y = startYear(s, s.player, gen); if (y != null) s.player.since = y; }
    var pv = s.lineage.filter(function (x) { return x.gen === gen - 1; })[0];   // 이름만 남은 앞 대가 물러난 해 = 지금 제독이 된 해
    if (pv && pv.stub && pv.to == null && s.player.since != null) pv.to = s.player.since;
    return s.lineage.length !== before;
  };
  /** 화면에 그릴 기록: 아직 옮기지 않은 판(불러오지 않고 이어 온 판)이면 지금 한 번 옮긴다 */
  function legacy() {
    var s = S();
    if (((s.flags || {}).lineageV || 0) < FT.VERSION) FT.migrate(s);
    return fill(s, false);
  }

  /** 가계도를 볼 수 있나 — 1대 제독이 물러난 뒤부터 */
  FT.has = function () { var s = S(); return !!(s && s.player && ((s.lineage && s.lineage.length) || (s.player.generation || 1) > 1)); };

  /** 화면에 그릴 대들: 기록 + 지금 제독 */
  FT.gens = function () {
    var s = S(), p = s.player, Fm = F(), line = legacy();
    var gens = line.map(function (e) { return { e: e, kids: e.kids.slice() }; });
    // 동생이 된 아이의 앞날: 다음 대의 기록(sibs) 또는 지금 제독의 동생들(live)
    gens.forEach(function (g, i) {
      var next = line[i + 1], live = !next || next.gen !== g.e.gen + 1 ? null : next;
      var curNext = g.e.gen + 1 === (p.generation || 1);
      g.kids = g.kids.map(function (r) {
        if (!r.sib) return r;
        var o = U.clone(r);
        if (curNext) {
          var k = (p.siblings || []).filter(function (x) { return key(x) === r.key; })[0];
          if (k) { o.fate = sibFate(k); o.age = Fm.kidAge(k); if (!k.left) o.chain = kidChain(k); }
          else o.fate = { t: '집을 떠남', cls: 'life' };
        } else if (live) {
          var sb = (live.sibs || []).filter(function (x) { return x.key === r.key; })[0];
          o.fate = sb ? sb.fate : { t: '집을 떠남', cls: 'life' };
          if (sb && sb.chain && sb.chain.length) o.chain = sb.chain;
        } else o.fate = { t: '집을 떠남', cls: 'life' };
        return o;
      });
    });
    var wife = null;
    if (p.wife) { var ws = Fm.wifeSpeaker(); wife = { name: Fm.wifeName(), chain: keys(ws.portrait) }; }
    var cur = {
      gen: p.generation || 1, name: p.name, born: p.born ? p.born.y : null, from: p.since, to: null, now: true, age: G.R.age ? G.R.age() : null,
      title: G.R.fameTitle ? G.R.fameTitle(p.fame || 0) : '', chain: heroKeys(p), wife: wife,
      wives: (p.wives2 || []).map(function (w) { return G.Wives ? G.Wives.name(w) : '부인'; })
    };
    var kids = (p.kids || []).map(function (k) {
      var f = k.married ? fateNow(k, null, 0) : k.lost ? { t: '섬에서 사라짐', cls: 'lost' } : k.aboard ? { t: '견습으로 배에', cls: 'mate' } : k.house != null ? { t: '어머니의 집에서', cls: 'home' } : { t: '집에서 자람', cls: 'home' };
      return { key: key(k), name: Fm.kidName(k), sex: k.sex === 'f' ? 'f' : 'm', by: k.born ? k.born.y : null, age: Fm.kidAge(k), chain: kidChain(k), fate: f };
    });
    gens.push({ e: cur, kids: kids });
    return gens;
  };

  // ---------------------------------------------------------------- 그리기
  function face(chain, size, g) {
    var I = G.Img, px = size * 2;
    if (chain && chain.length && I.pick(chain)) {
      var cv = I.make(chain, px, px, function () { var c = document.createElement('canvas'); c.width = c.height = px; return c; }, { fy: 0.22, bg: '#2a1d12' });
      cv.style.width = size + 'px'; cv.style.height = size + 'px'; return cv;
    }
    var d = U.el('div', 'ft-noface', g === 'f' ? '♀' : '♂'); d.style.width = d.style.height = size + 'px'; d.style.lineHeight = size + 'px'; return d;
  }
  function years(e) {
    var a = e.born != null ? e.born + '년생' : '', b;
    if (e.now) b = (e.from != null ? e.from + '년부터 ' : '') + '지금 제독' + (e.age != null ? ' · ' + e.age + '세' : '');
    // 언제 제독이 되었는지 모르면 「?」 (QA 3)
    else b = (e.to != null ? (e.from != null ? e.from : '?') + '~' + e.to + '년 제독' : '') + (e.end === 'death' ? ' · 바다에서 생을 마침' : e.to != null ? ' · 은퇴' : '');
    return [a, b].filter(Boolean).join(' · ');
  }
  /** 이름이 두 줄이 되면 성 가운데서 끊기지 않게 (「베르나르두 / 다 시우바」 — 아이는 아버지의 성을 이어 간다, 2026-10-26) */
  function nameHtml(n) { n = String(n || ''); var i = n.indexOf(' '); return i < 0 ? U.esc(n) : U.esc(n.slice(0, i)) + ' <span style="white-space:nowrap">' + U.esc(n.slice(i + 1)) + '</span>'; }
  function html(gens) {
    return '<div class="ft">' + gens.map(function (g, gi) {
      var e = g.e, last = gi === gens.length - 1;
      var couple = '<div class="ft-couple' + (e.now ? ' now' : '') + '">' +
        '<div class="ft-person"><div class="ft-face" data-face="a' + gi + '"></div><div><div class="ft-gen">' + e.gen + '대 제독' + (e.now ? ' <span class="ft-now">지금</span>' : '') + '</div>' +
        '<b class="ft-name">' + (e.name ? nameHtml(e.name) : '이름이 전하지 않는 선대') + '</b><div class="ft-sub">' + U.esc(years(e)) + '</div>' + (e.title ? '<div class="ft-sub">' + U.esc(e.title) + '</div>' : '') + '</div></div>' +
        (e.wife ? '<div class="ft-tie">═</div><div class="ft-person"><div class="ft-face" data-face="w' + gi + '"></div><div><div class="ft-gen">본처</div><b class="ft-name">' + U.esc(e.wife.name) + '</b>' +
          (e.wives && e.wives.length ? '<div class="ft-sub">둘째 부인: ' + U.esc(e.wives.join(' · ')) + '</div>' : '') + '</div></div>' :
          (e.wives && e.wives.length ? '<div class="ft-tie">═</div><div class="ft-person"><div><div class="ft-gen">부인</div><b class="ft-name">' + U.esc(e.wives.join(' · ')) + '</b></div></div>' : '')) +
        '</div>';
      var kids = g.kids.length ? '<div class="ft-kids">' + g.kids.map(function (r, ki) {
        return '<div class="ft-kid ' + (r.heir ? 'heir ' : '') + (r.fate ? r.fate.cls : '') + '"><div class="ft-face" data-face="k' + gi + '_' + ki + '"></div>' +
          '<b>' + nameHtml(r.name) + '</b><div class="ft-sub">' + (r.sex === 'f' ? '딸' : '아들') + (r.by != null ? ' · ' + r.by + '년생' : '') + '</div>' +
          (r.fate ? '<div class="ft-fate">' + U.esc(r.fate.t) + '</div>' : '') + '</div>';
      }).join('') + '</div>' : (e.stub ? '<div class="ft-none">이 대의 기록은 남아 있지 않다.</div>' : (last ? '<div class="ft-none">아직 아이가 없다.</div>' : ''));
      return '<section class="ft-row">' + couple + kids + '</section>';
    }).join('<div class="ft-down">▼</div>') + '</div>';
  }
  /** 자택 「가계도」 */
  FT.open = function () {
    var gens = FT.gens(), s = S();
    var w = G.UI.window({ title: '가문의 가계도', icon: 'people', width: 1180, height: 820,
      html: '<div class="ft-top muted">' + U.esc(s.player.name) + ' 가문 · ' + (s.player.generation || 1) + '대째</div>' + html(gens), buttons: [{ label: '닫기', value: 1 }] });
    w.el.classList.add('ft-win');
    gens.forEach(function (g, gi) {
      var a = w.content.querySelector('[data-face="a' + gi + '"]'); if (a) a.appendChild(face(g.e.chain, 84, 'm'));
      var b = w.content.querySelector('[data-face="w' + gi + '"]'); if (b && g.e.wife) b.appendChild(face(g.e.wife.chain, 84, 'f'));
      g.kids.forEach(function (r, ki) { var c = w.content.querySelector('[data-face="k' + gi + '_' + ki + '"]'); if (c) c.appendChild(face(r.chain, 70, r.sex)); });
    });
    var nowEl = w.content.querySelector('.ft-couple.now'); if (nowEl && nowEl.scrollIntoView && gens.length > 2) nowEl.scrollIntoView({ block: 'center' });
    return w.result;
  };
})(window.G = window.G || {});
