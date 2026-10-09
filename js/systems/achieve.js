/* 업적 — 발견물의 주제 조합으로 이룬다 (자료: js/data/achievements.js, 사슬: js/data/chaindisc.js G.CHAINS).
   - 발견할 때마다(D.find 끝) 살펴 새로 이룬 업적을 알리고 보상(탐험 명성·금화·칭호)을 준다.
     한 가지만 더 찾으면 이루는 업적은 「한 가지 남았다」고 귀띔한다.
   - 하루가 지날 때(G.World.daily) 옛 저장에서 이미 이룬 업적과, 앞 고리를 이미 찾아 둔 사슬의 단서를 챙긴다.
   - 수첩 「업적」 쪽: 얻은 칭호, 갈래별 진행, 사슬 지도(찾음·단서·잠김). 저장: state.achv[id] = { d: 날짜 } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI;
  var AC = {};
  G.Achieve = AC;
  function S() { return G.Game.state; }
  function store() { var s = S(); return s.achv || (s.achv = {}); }
  function found(id) { return G.Disc.foundByMe(id); }
  function name(id) { var d = G.DISC[id]; return d ? d.name : id; }
  function mine() { var s = S(), out = []; for (var id in s.disc) { var st = s.disc[id]; if (st && st.me && st.found && G.DISC[id]) out.push(G.DISC[id]); } return out; }
  function regName(r) { return (G.REGIONS || [])[r] || ''; }

  AC.list = function () { return G.ACHIEVEMENTS || []; };
  AC.get = function (id) { return AC.list().filter(function (a) { return a.id === id; })[0] || null; };
  AC.done = function (id) { return !!store()[id]; };
  AC.chainDone = function (ch) { return ch.ids.every(found); };
  AC.chainsDone = function () { return (G.CHAINS || []).filter(AC.chainDone); };

  /** 진행: { have, need, done, rows: [{ label, ids?, got?, count, n }] } */
  AC.progress = function (a, my) {
    my = my || mine();
    var rows = [];
    function idsRow(ids, n, label) { var got = ids.filter(found); return { label: label || null, ids: ids, got: got, count: got.length, n: n || ids.length }; }
    if (a.ids) rows.push(idsRow(a.ids, a.n));
    if (a.cats) a.cats.forEach(function (r) {
      if (r.ids) { rows.push(idsRow(r.ids, r.n)); return; }
      var cs = [].concat(r.cat);
      var c = my.filter(function (d) { return cs.indexOf(d.cat) >= 0 && (r.reg == null || d.reg === r.reg); }).length;
      rows.push({ label: cs.map(function (x) { return G.DISC_CATS[x]; }).join('·') + (r.reg != null ? ' (' + regName(r.reg) + ')' : ''), count: c, n: r.n });
    });
    if (a.chains) rows.push({ label: '끝까지 푼 사슬', count: AC.chainsDone().length, n: a.chains });
    if (a.everyReg) (G.REGIONS || []).forEach(function (rn, r) {
      rows.push({ label: rn, count: my.filter(function (d) { return d.reg === r; }).length, n: a.everyReg, small: true });
    });
    if (a.oneReg) {
      var best = null;
      (G.REGIONS || []).forEach(function (rn, r) {
        var rr = a.oneReg.cats.map(function (cat) { return { label: rn + ' · ' + G.DISC_CATS[cat], count: my.filter(function (d) { return d.reg === r && d.cat === cat; }).length, n: a.oneReg.n }; });
        var sc = rr.reduce(function (t, x) { return t + Math.min(x.count, x.n); }, 0);
        if (!best || sc > best.sc) best = { sc: sc, rows: rr };
      });
      if (best) rows = rows.concat(best.rows);
    }
    var have = 0, need = 0, ok = true;
    rows.forEach(function (x) { have += Math.min(x.count, x.n); need += x.n; if (x.count < x.n) ok = false; });
    return { have: have, need: need, done: ok && rows.length > 0, rows: rows };
  };

  /** 아직 이루지 않은 업적 가운데 지금 이룬 것을 기록하고 보상한다 → 이룬 업적 목록 */
  AC.check = function () {
    var s = S(), st = store(), my = mine(), got = [];
    AC.list().forEach(function (a) {
      if (st[a.id] || !AC.progress(a, my).done) return;
      st[a.id] = { d: U.dateNum(s.date) };
      if (a.gold) s.player.gold += a.gold;
      if (a.fame && G.Fame) G.Fame.add('ex', a.fame);
      G.State.log('업적 「' + a.name + '」' + U.jx(a.name, '을/를') + ' 이루었다' + (a.title ? ' — 칭호 「' + a.title + '」' : '') + ' (금화 ' + U.num(a.gold || 0) + ', 명성 +' + (a.fame || 0) + ')');
      got.push(a);
    });
    return got;
  };
  function rewardText(a) { return '금화 ' + U.num(a.gold || 0) + '닢 · 명성 +' + U.num(a.fame || 0) + (a.title ? ' · 칭호 「' + a.title + '」' : ''); }

  /** 발견한 뒤: 새 업적을 알리고, 한 가지 남은 업적을 귀띔한다 */
  AC.afterFind = async function (d) {
    var got = AC.check();
    for (var i = 0; i < got.length; i++) {
      var a = got[i];
      if (G.Audio) G.Audio.sfx('bell');
      await UI.window({ title: '업적 달성', icon: 'crown', width: 640, parch: true,
        html: '<div class="achv-pop"><div class="achv-g">' + U.esc(a.group) + '</div><div class="achv-n">' + U.esc(a.name) + '</div><div class="achv-d">' + U.esc(a.desc) + '</div>' +
          '<div class="achv-r">' + rewardText(a) + '</div></div>',
        buttons: [{ label: '좋다', value: 1, cls: 'navy' }] }).result;
    }
    if (!d) return got;
    var my = mine();
    AC.list().forEach(function (a) {
      if (AC.done(a.id)) return;
      var inIt = (a.ids && a.ids.indexOf(d.id) >= 0) || (a.cats && a.cats.some(function (r) { return r.ids ? r.ids.indexOf(d.id) >= 0 : [].concat(r.cat).indexOf(d.cat) >= 0; }));
      if (!inIt) return;
      var p = AC.progress(a, my);
      if (p.need - p.have === 1) UI.toast('업적 「' + a.name + '」까지 한 가지 남았다', 'crown', 5200);
    });
    return got;
  };

  /** 하루마다: 옛 저장의 업적·이미 열린 사슬의 단서 → 소식 */
  AC.daily = function () {
    var s = S(), out = [];
    if (!G.Disc || !G.DISC_CHAIN) return out;
    for (var id in G.DISC_CHAIN) {
      var d = G.DISC[id];
      if (!d || found(id) || s.hints[id] || !G.Disc.available(d)) continue;   // 앞 고리를 이미 찾았는데 단서가 없다 — 옛 저장, 또는 찾을 때 아직 개척 단계가 닫혀 있던 경우(무 제국 등)
      var last = d.need[d.need.length - 1];
      if (G.Disc.addHint(id, 'chain:' + last)) out.push({ icon: 'scroll', text: '「' + name(last) + '」의 기록을 다시 살피다가 실마리를 찾았다 — ' + G.chainLine(id) + ' (새 단서: 「' + d.name + '」)' });
    }
    AC.check().forEach(function (a) { out.push({ icon: 'crown', text: '업적 「' + a.name + '」' + U.jx(a.name, '을/를') + ' 이루었다 — ' + rewardText(a) }); });
    return out;
  };

  AC.titles = function () { return AC.list().filter(function (a) { return a.title && AC.done(a.id); }).map(function (a) { return a.title; }); };

  // ---------------------------------------------------------------- 수첩 「업적」 쪽
  function stepHtml(id) {
    var d = G.DISC[id], s = S();
    if (!d) return '';
    if (found(id)) return '<span class="ch-s ok" title="' + U.esc(d.name) + '">✔ ' + U.esc(d.name) + '</span>';
    if (s.hints[id]) return '<span class="ch-s hint" title="단서가 있다">✎ ' + U.esc(d.name) + '</span>';
    if (G.Disc.needMet(d)) return '<span class="ch-s open">' + U.esc(d.name) + '</span>';
    return '<span class="ch-s lock" title="앞 고리를 찾아야 열린다">？？？</span>';
  }
  function itemHtml(id) {
    var d = G.DISC[id]; if (!d) return '';
    if (found(id)) return '<span class="ach-i ok">' + U.esc(d.name) + '</span>';
    if (d.need && !G.Disc.needMet(d) && !S().hints[id]) return '<span class="ach-i lock">？？？</span>';
    return '<span class="ach-i">' + U.esc(d.name) + '</span>';
  }
  AC.page = function (el) {
    var list = AC.list(), st = store(), my = mine(), doneN = list.filter(function (a) { return st[a.id]; }).length;
    var titles = AC.titles(), chains = G.CHAINS || [];
    var h = '<div class="achv-page">' +
      '<div class="achv-top"><b>업적 ' + doneN + ' / ' + list.length + '</b> · 사슬 ' + AC.chainsDone().length + ' / ' + chains.length +
      (titles.length ? '<div class="achv-titles">' + titles.map(function (t) { return '<span class="tag good-text">' + U.esc(t) + '</span>'; }).join(' ') + '</div>' : '<div class="muted">발견의 주제를 맞춰 모으면 업적을 이루고 칭호를 얻는다.</div>') + '</div>';
    // 사슬 지도
    h += '<h4 class="achv-h">꼬리에 꼬리를 무는 사슬</h4><div class="muted" style="font-size:14px;margin:-4px 0 6px">앞 고리를 찾으면 다음 고리의 단서가 풀린다. 열리기 전에는 그 자리에 가도 찾을 수 없다.</div>';
    chains.forEach(function (ch) {
      h += '<div class="hint-item ch-row"><div class="flex"><span class="nm">' + U.esc(ch.name) + '</span>' + (AC.chainDone(ch) ? '<span class="tag good-text">완성</span>' : '') + '</div><div class="ch-steps">' +
        '<span class="ch-root">' + ch.root.map(function (r) { return (found(r) ? '✔ ' : '') + U.esc(name(r)); }).join(' · ') + '</span> → ' +
        ch.ids.map(stepHtml).join(' → ') + '</div></div>';
    });
    // 갈래별 업적
    (G.ACHV_GROUPS || []).forEach(function (g) {
      var as = list.filter(function (a) { return a.group === g; }); if (!as.length) return;
      h += '<h4 class="achv-h">' + U.esc(g) + '</h4>';
      as.forEach(function (a) {
        var p = AC.progress(a, my), done = st[a.id];
        var pct = Math.round(100 * p.have / Math.max(1, p.need));
        h += '<div class="hint-item achv-row' + (done ? ' done' : '') + '"><div class="flex"><span class="nm">' + (done ? '★ ' : '') + U.esc(a.name) + '</span>' +
          (a.title ? '<span class="tag">' + U.esc(a.title) + '</span>' : '') +
          '<span class="right muted" style="font-size:14px">' + (done ? U.fmtDate({ y: Math.floor(done.d / 10000), m: Math.floor(done.d / 100) % 100, d: done.d % 100 }) + ' 달성' : p.have + ' / ' + p.need) + '</span></div>' +
          '<div class="tx">' + U.esc(a.desc) + ' <span class="muted">— ' + rewardText(a) + '</span></div>' +
          '<div class="achv-bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="achv-items">' + p.rows.map(function (r) {
            if (r.ids) return (r.n < r.ids.length ? '<span class="muted">' + r.n + '가지:</span> ' : '') + r.ids.map(itemHtml).join(' ');
            return '<span class="ach-i' + (r.count >= r.n ? ' ok' : '') + '">' + U.esc(r.label) + ' ' + Math.min(r.count, r.n) + '/' + r.n + '</span>';
          }).join(' <span class="muted">+</span> ') + '</div></div>';
      });
    });
    el.innerHTML = h + '</div>';
  };

  // 수첩 쪽 모양
  if (typeof document !== 'undefined' && !document.getElementById('achv-css')) {
    var css = document.createElement('style'); css.id = 'achv-css';
    css.textContent = '.achv-top{padding:6px 2px 10px;font-size:18px}.achv-titles{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px}' +
      '.achv-h{margin:16px 0 8px;font-size:19px;border-bottom:1px solid rgba(90,60,30,.25);padding-bottom:4px}' +
      '.achv-row.done .nm{color:#7a4f10}.achv-bar{height:6px;background:rgba(90,60,30,.15);border-radius:3px;margin:6px 0 4px;overflow:hidden}.achv-bar i{display:block;height:100%;background:linear-gradient(90deg,#b8862e,#e2b65a)}' +
      '.achv-items{font-size:14px;line-height:1.9}.ach-i{display:inline-block;padding:0 6px;margin:1px 2px;border-radius:4px;background:rgba(90,60,30,.08);color:rgba(60,40,20,.55)}.ach-i.ok{background:rgba(184,134,46,.22);color:#4a3008;font-weight:600}.ach-i.lock{letter-spacing:2px}' +
      '.ch-steps{font-size:14px;line-height:2}.ch-root{color:rgba(60,40,20,.75)}.ch-s{display:inline-block;padding:0 6px;border-radius:4px;background:rgba(90,60,30,.08)}.ch-s.ok{background:rgba(184,134,46,.25);font-weight:600}.ch-s.hint{background:rgba(40,110,170,.15)}.ch-s.lock{color:rgba(60,40,20,.4);letter-spacing:2px}' +
      '.achv-pop{text-align:center;padding:10px 6px}.achv-g{font-size:15px;color:#8a6a3a}.achv-n{font-size:30px;font-weight:800;margin:6px 0 10px}.achv-d{font-size:17px;line-height:1.6}.achv-r{margin-top:14px;font-size:16px;color:#7a4f10;font-weight:600}';
    document.head.appendChild(css);
  }
})(window.G = window.G || {});
