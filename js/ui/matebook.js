/* 동료 명부와 인물 상세 — 수첩·술집이 같은 화면과 정렬을 사용한다. */
(function (G) {
  'use strict';
  var MB = G.MateBook = {}, U = G.U, R = G.R;
  function S() { return G.Game.state; }
  function data(m) { return G.MATE[m.id]; }
  function loyal(m) { return m.devoted ? 100 : Math.round(m.loyal == null ? 70 : m.loyal); }
  function skill(m, k) { return R.mateSkill(m, k); }
  function lang(m, k) { return R.mateLang(m, +k); }
  function raw(m, k) { return G.Cabins ? G.Cabins.rawSkill(m, k) : ((m.sk || {})[k] == null ? (data(m).sk || {})[k] || 0 : m.sk[k]); }
  function affection(m, d) {
    if (d.sib || d.minor || d.wed) return '<span class="mb-empty">—</span>';
    var n = U.clamp(Math.round(m.aff || 0), 0, 100), hearts = '';
    for (var i = 0; i < 5; i++) hearts += '<span class="mb-heart" aria-hidden="true">♡<i style="width:' + U.clamp(n * 5 - i * 100, 0, 100) + '%">♥</i></span>';
    return '<span class="mb-hearts" role="img" aria-label="애정 ' + n + ' / 100" title="애정 ' + n + ' / 100">' + hearts + '</span>';
  }
  function loyalty(m) { var n = loyal(m); return '<span class="mb-loyal' + (n < 50 ? ' low' : '') + '" data-loyal="' + n + '">' + n + '</span>'; }
  MB.traits = function (m) {
    var d = data(m), out = [];
    var bio = G.Bio && G.Bio.find(d.name);
    if (d.legend) out.push('전설');
    if (d.witch) out.push('마녀');
    if (d.renown || (bio && !bio.made && !d.tale && !d.legend && !d.wd)) out.push('실존');
    if (d.tale || d.eventOnly || (G.STORY_CREW || []).indexOf(d.id) >= 0) out.push('이야기');
    if (d.wd || m.rehired || (G.MateDismiss && G.MateDismiss.record(m.id))) out.push('철새');
    if (d.sib) out.push('동생');
    if (d.kinTag) out.push(d.kinTag);
    if (m.devoted) out.push('충성 서약');
    if (G.HeirPlan && G.HeirPlan.pledged(m)) out.push('후계 안배');
    if (m.aide && S().day < (m.leaveCd || 0)) out.push('후견');
    else if (G.OldGuard && G.OldGuard.isVeteran(m)) out.push('노장 · ' + G.MateLeave.years(m) + '년');
    if (!out.length) out.push('항해사');
    return out;
  };
  function tags(m) { return MB.traits(m).map(function (t) { return '<span class="mb-trait">' + U.esc(t) + '</span>'; }).join(''); }
  function tile(name, lv, type, title, grown, id) {
    lv = Math.max(0, Math.min(3, lv || 0));
    var label = U.esc(name);
    if (type === 'language') label = label.replace('토착어', '<wbr>토착어').replace('·', '·<wbr>');
    return '<span class="mb-tile ' + type + ' lv' + lv + '" data-level="' + lv + '"' + (id == null ? '' : ' data-' + (type === 'skill' ? 'skill' : 'language') + '="' + id + '"') + ' title="' + U.esc(title || name + ' ' + lv + '단계') + '"><span>' + label + '</span><b>' + lv + (grown ? '<sup>★</sup>' : '') + '</b></span>';
  }
  function skills(m, all, limit) {
    var list = G.SKILLS.filter(function (x) { return all || raw(m, x.id) > 0; });
    return list.slice(0, limit || list.length).map(function (x) {
      var lv = skill(m, x.id), n = raw(m, x.id), grown = (m.skg || {})[x.id];
      return tile(x.name, lv, 'skill', x.name + ' · 지금 ' + lv + ' / 본디 ' + n + '단계' + (grown ? ' · 선실 수련 +' + grown : '') + '\n' + x.desc, grown, x.id);
    }).join('') + (limit && list.length > limit ? '<span class="mb-more" title="나머지 특기 ' + (list.length - limit) + '개 — 상세에서 모두 보기">+' + (list.length - limit) + '</span>' : '') || '<span class="mb-empty">특기 없음</span>';
  }
  function languages(m, all, limit) {
    var d = data(m), keys = G.LANGS.map(function (name, k) { return k; }).filter(function (k) { return all || lang(m, k); });
    return keys.slice(0, limit || keys.length).map(function (k) {
      var lv = lang(m, k);
      var html = tile(G.LANGS[k], lv, 'language', G.LANGS[k] + ' · ' + G.LANG_LV[lv], lv > ((d.lg || {})[k] || 0), k);
      return limit ? html.replace(/<wbr>/g, '') : html;
    }).join('') + (limit && keys.length > limit ? '<span class="mb-more" title="나머지 언어 ' + (keys.length - limit) + '개 — 상세에서 모두 보기">+' + (keys.length - limit) + '</span>' : '') || '<span class="mb-empty">알려진 언어 없음</span>';
  }
  function face(el, m, size, large) {
    if (large && G.Img) {
      var key = G.Img.pick(G.Img.chain.mateHalf(m.id));
      if (key) { var im = new Image(); im.alt = data(m).name + '의 외형'; im.src = G.Img.src(key); el.appendChild(im); return; }
    }
    el.appendChild(G.Art.portraitCanvas(G.Scenes.mateSpec(m.id), size));
  }
  function square(d) {
    var v = (d.st || []).map(function (x) { return Math.max(0, Math.min(100, x)); });
    var points = [[100, 80 - v[0] * .55], [100 + v[1] * .55, 80], [100, 80 + v[2] * .55], [100 - v[3] * .55, 80]].map(function (p) { return p.join(','); }).join(' ');
    return '<div class="mb-stats" aria-label="능력치"><svg viewBox="0 0 200 160" role="img" aria-label="체력 ' + (d.st || [])[0] + ', 지력 ' + (d.st || [])[1] + ', 무력 ' + (d.st || [])[2] + ', 매력 ' + (d.st || [])[3] + '"><rect x="45" y="25" width="110" height="110"/><rect x="72.5" y="52.5" width="55" height="55"/><path d="M100 25V135M45 80H155"/><polygon points="' + points + '"/>' +
      '<text x="100" y="17" text-anchor="middle">체력 ' + (d.st[0] == null ? '—' : d.st[0]) + '</text><text x="160" y="76">지력</text><text x="160" y="94">' + d.st[1] + '</text><text x="100" y="154" text-anchor="middle">무력 ' + d.st[2] + '</text><text x="40" y="76" text-anchor="end">매력</text><text x="40" y="94" text-anchor="end">' + d.st[3] + '</text></svg></div>';
  }
  MB.story = function (m) {
    var d = data(m), bio = G.Bio && G.Bio.find(d.name), own = (G.VOICES || {})[m.id], out = [];
    var main = d.story || (G.MATE_STORIES || {})[m.id] || (bio && bio.text);
    if (main) out.push(main);
    if (own && own.stories) own.stories.forEach(function (t) { out.push('「' + t.t + '」\n' + (t.l || []).map(function (l) { return G.Voice ? G.Voice.fill(l) : l; }).join('\n')); });
    if (!out.length) {
      var best = G.SKILLS.slice().sort(function (a, b) { return raw(m, b.id) - raw(m, a.id); })[0];
      if (best && raw(m, best.id)) out.push(best.name + ' 솜씨를 믿고 배에 오른 동료. 낯선 항구와 거친 바다를 지나며 자신의 솜씨를 일행과 나눈다. 함께한 항로의 다음 이야기는 아직 항해일지에 쓰이는 중이다.');
      else out.push('낯선 항구에서 배에 올라 제독과 항해하는 동료. 저마다의 사연을 품고 같은 수평선을 향해 간다. 다음 항구에서 함께 쓸 이야기를 기다리고 있다.');
    }
    return out;
  };
  function sortValue(m, key) {
    if (key === 'name') return data(m).name;
    if (key === 'role') return R.roleName(m);
    if (key.indexOf('st:') === 0) return (data(m).st || [])[+key.slice(3)] || 0;
    if (key.indexOf('sk:') === 0) return skill(m, key.slice(3));
    if (key.indexOf('lg:') === 0) return lang(m, key.slice(3));
    if (key === 'loyal') return loyal(m);
    if (key === 'aff') return m.aff || 0;
    if (key === 'wage') return R.mateWage(m.id);
    if (key === 'languages') return G.LANGS.reduce(function (n, x, i) { return n + lang(m, i); }, 0);
    return G.SKILLS.reduce(function (n, x) { return n + skill(m, x.id); }, 0);
  }
  MB.sorted = function (list, key, desc) {
    return list.slice().sort(function (a, b) {
      var av = sortValue(a, key), bv = sortValue(b, key);
      return (typeof av === 'string' ? av.localeCompare(bv, 'ko') : av - bv) * (desc ? -1 : 1) || data(a).name.localeCompare(data(b).name, 'ko') || a.id.localeCompare(b.id);
    });
  };
  /** opts.city가 있으면 술집·여관의 대화 명부. 수첩에서도 항구에서 해고할 수 있다. */
  MB.mount = function (el, opts) {
    opts = opts || {};
    var key = 'name', desc = false, selected = null, mode = 'list', search = '', working = false;
    var listScroll = 0, navScroll = 0, storyPositions = {};
    el.innerHTML = '<div class="matebook"><div class="mb-toolbar"><div class="mb-heading"><b>전체 동료</b><small></small></div><input class="mb-search" aria-label="동료 이름 검색" placeholder="이름 찾기"><label>정렬 <select class="mb-sort" aria-label="동료 정렬 기준"></select></label><button class="mb-order" type="button" aria-label="정렬 방향">오름차순 ↑</button><div class="mb-view-switch" role="group" aria-label="동료 보기 전환"><button class="mb-list-button" type="button">전체 동료</button><button class="mb-detail-button" type="button">동료 상세</button></div></div><div class="mb-body" tabindex="0" aria-label="전체 동료 목록"></div><div class="mb-legend"><span>특기</span>' + [0, 1, 2, 3].map(function (n) { return tile(n === 0 ? '미숙' : n === 1 ? '기초' : n === 2 ? '숙련' : '달인', n, 'skill'); }).join('') + '<span>언어</span>' + [0, 1, 2, 3].map(function (n) { return tile(G.LANG_LV[n], n, 'language'); }).join('') + '<small>★ 배에서 익힘 · 숫자는 현재 단계</small></div></div>';
    var root = el.querySelector('.matebook'), body = root.querySelector('.mb-body'), sort = root.querySelector('select'), order = root.querySelector('.mb-order');
    var basic = [['name', '이름'], ['role', '직위'], ['st:0', '체력'], ['st:1', '지력'], ['st:2', '무력'], ['st:3', '매력'], ['loyal', '충성'], ['aff', '애정'], ['total', '특기 단계 합계'], ['languages', '언어 단계 합계'], ['wage', '월급']];
    sort.innerHTML = '<optgroup label="기본">' + basic.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('') + '</optgroup><optgroup label="특기 단계">' + G.SKILLS.map(function (x) { return '<option value="sk:' + x.id + '">' + x.name + ' 단계</option>'; }).join('') + '</optgroup><optgroup label="언어 단계">' + G.LANGS.map(function (x, i) { return '<option value="lg:' + i + '">' + x + ' 단계</option>'; }).join('') + '</optgroup>';
    function list() { return MB.sorted(S().mates.filter(function (m) { return data(m) && (!search || data(m).name.indexOf(search) >= 0); }), key, desc); }
    function setSort(k) { if (key === k) desc = !desc; else { key = k; desc = k !== 'name'; } sort.value = key; render(true); }
    sort.onchange = function () { key = sort.value; desc = key !== 'name'; render(true); };
    order.onclick = function () { desc = !desc; render(true); };
    root.querySelector('.mb-search').oninput = function (e) { search = e.target.value.trim(); render(true); };
    root.querySelector('.mb-search').onkeydown = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.value = ''; search = ''; this.blur(); render(); }
    };
    root.querySelector('.mb-list-button').onclick = function () { mode = 'list'; render(); };
    root.querySelector('.mb-detail-button').onclick = function () { mode = 'detail'; render(); };
    if (G.CabinView) {
      var cabin = U.el('button', 'mb-cabin-button', '선실 배치'); cabin.type = 'button';
      cabin.onclick = function () { return action(function () { return G.CabinView.open(); }); };
      root.querySelector('.mb-toolbar').appendChild(cabin);
    }
    if (G.Romance) {
      var relations = U.el('button', 'mb-relations-button', '동료 사이'); relations.type = 'button';
      relations.onclick = function () { G.UI.window({ title: '동료 사이', icon: 'heart', width: 780, html: G.Romance.html() }); };
      root.querySelector('.mb-toolbar').appendChild(relations);
    }
    function choose(m) { selected = m.id; mode = 'detail'; render(); }
    async function action(fn) {
      if (working) return; working = true;
      root.querySelectorAll('.mb-actions button').forEach(function (b) { b.disabled = true; });
      try { await fn(); } finally { working = false; if (root.isConnected) render(); }
    }
    function render(resetList) {
      var oldNav = body.querySelector('.mb-nav-list'), oldStory = body.querySelector('.mb-story');
      var oldId = root.dataset.selected;
      if (oldStory && oldId) storyPositions[oldId] = oldStory.scrollTop;
      if (root.dataset.view === 'list') listScroll = body.scrollTop;
      if (oldNav) navScroll = oldNav.scrollTop;
      if (resetList) listScroll = 0;
      var L = list();
      order.textContent = desc ? '내림차순 ↓' : '오름차순 ↑';
      root.querySelector('.mb-heading small').textContent = L.length + ' / ' + S().mates.length + '명';
      root.querySelector('.mb-heading b').textContent = mode === 'list' ? '전체 동료' : '동료 상세';
      root.querySelector('.mb-list-button').setAttribute('aria-pressed', mode === 'list' ? 'true' : 'false');
      root.querySelector('.mb-detail-button').setAttribute('aria-pressed', mode === 'detail' ? 'true' : 'false');
      root.querySelector('.mb-detail-button').disabled = !L.length;
      root.classList.toggle('is-detail', mode === 'detail');
      root.dataset.view = mode;
      body.setAttribute('aria-label', mode === 'list' ? '현재 고용한 전체 동료 목록' : '선택한 동료 상세');
      body.innerHTML = '';
      if (!L.length) { body.innerHTML = '<div class="mb-no-results">' + (search ? '이름이 일치하는 동료가 없습니다.' : '함께 항해하는 동료가 없습니다. 술집에서 항해사를 찾아보십시오.') + '</div>'; return; }
      if (mode === 'list') {
        var table = U.el('table', 'mb-table', '<colgroup><col class="mb-col-name"><col class="mb-col-role"><col span="4" class="mb-col-number"><col class="mb-col-loyal"><col class="mb-col-aff"><col class="mb-col-skill"><col class="mb-col-language"></colgroup><thead><tr>' + [['name', '동료'], ['role', '직위'], ['st:0', '체력'], ['st:1', '지력'], ['st:2', '무력'], ['st:3', '매력'], ['loyal', '충성'], ['aff', '애정'], ['total', '특기'], ['languages', '언어']].map(function (x) { return '<th scope="col"' + (key === x[0] ? ' aria-sort="' + (desc ? 'descending' : 'ascending') + '"' : '') + '><button type="button" data-sort="' + x[0] + '">' + x[1] + (key === x[0] ? (desc ? ' ↓' : ' ↑') : '') + '</button></th>'; }).join('') + '</tr></thead><tbody></tbody>');
        table.querySelectorAll('[data-sort]').forEach(function (b) { b.onclick = function () { setSort(b.dataset.sort); }; });
        L.forEach(function (m) {
          var d = data(m), rc = G.CabinView && G.CabinView.rowClass(m);
          var tr = U.el('tr', (rc === 'idle' ? 'mb-idle' : '') + (m.id === selected ? ' on' : ''), '<td><button type="button" class="mb-person" title="' + U.esc(d.name) + '"><span class="mb-face"></span><span><b>' + U.esc(d.name) + '</b></span></button></td><td class="mb-role" title="' + U.esc(G.Cabins ? G.Cabins.placeName(m) : R.roleName(m)) + '">' + U.esc(R.roleName(m)) + '</td>' + (d.st || [0, 0, 0, 0]).map(function (n) { return '<td class="mb-number">' + n + '</td>'; }).join('') + '<td class="mb-number mb-loyal-cell">' + loyalty(m) + '</td><td class="mb-aff-cell">' + affection(m, d) + '</td><td><div class="mb-tiles">' + skills(m, false, 4) + '</div></td><td><div class="mb-tiles">' + languages(m, false, 3) + '</div></td>');
          tr.dataset.mate = m.id; tr.onclick = function () { if (!working) choose(m); };
          tr.querySelector('.mb-person').setAttribute('aria-label', d.name + ' 상세 보기');
          face(tr.querySelector('.mb-face'), m, 44, false);
          table.querySelector('tbody').appendChild(tr);
        });
        body.appendChild(table); body.scrollTop = listScroll; return;
      }
      var m = L.filter(function (x) { return x.id === selected; })[0] || L[0], d = data(m); selected = m.id;
      root.dataset.selected = m.id;
      var detail = U.el('div', 'mb-detail', '<nav class="mb-nav" aria-label="다른 동료 선택"><div class="mb-section-title">함께 항해하는 사람들</div><div class="mb-nav-list" tabindex="0" aria-label="동료 선택 목록"></div></nav><section class="mb-profile"><div class="mb-portrait"></div><div class="mb-name">' + U.esc(d.name) + '</div><div class="mb-traits">' + tags(m) + '</div><dl class="mb-facts"><dt>직위</dt><dd>' + U.esc(R.roleName(m)) + '</dd><dt>선실</dt><dd>' + U.esc(G.Cabins ? G.Cabins.placeName(m) : '—') + '</dd><dt>말투</dt><dd>' + U.esc(G.Banter ? G.Banter.toneName(m.id) : '—') + '</dd><dt>충성</dt><dd class="mb-loyal-value">' + loyalty(m) + (m.devoted ? ' · 계속 유지' : '') + '</dd><dt>애정</dt><dd>' + affection(m, d) + '</dd><dt>월급</dt><dd>금화 ' + U.num(R.mateWage(m.id)) + '닢</dd></dl>' + square(d) + '</section><section class="mb-record"><div class="mb-section-title">특기 <small>0 미숙 · 1 기초 · 2 숙련 · 3 달인</small></div><div class="mb-tiles mb-all-skills">' + skills(m, true) + '</div><div class="mb-section-title mb-language-title">언어 <small>0 모름 · 1 기초 · 2 보통 · 3 능숙</small></div><div class="mb-tiles mb-all-languages">' + languages(m, true) + '</div><div class="mb-section-title">살아온 이야기</div><div class="mb-story" tabindex="0" aria-label="살아온 이야기"></div><div class="mb-actions"></div></section>');
      L.forEach(function (x) {
        var btn = U.el('button', 'mb-nav-person' + (x.id === m.id ? ' on' : ''), '<span class="mb-face"></span><span>' + U.esc(data(x).name) + '</span>');
        btn.type = 'button'; btn.dataset.mate = x.id; btn.setAttribute('aria-pressed', x.id === m.id ? 'true' : 'false');
        btn.title = data(x).name;
        face(btn.querySelector('.mb-face'), x, 36, false); btn.onclick = function () { if (!working) choose(x); };
        detail.querySelector('.mb-nav-list').appendChild(btn);
      });
      face(detail.querySelector('.mb-portrait'), m, 234, true);
      var owned = U.el('section', 'mb-owned'), held = R.mateItems(m);
      owned.setAttribute('aria-label', '동료 소지품');
      owned.innerHTML = '<div class="mb-section-title">소지품 <small>' + held.reduce(function (n, it) { return n + R.itemQty(it); }, 0) + '개</small></div><div class="mb-owned-list"></div>';
      var ownedList = owned.querySelector('.mb-owned-list');
      if (!held.length) ownedList.innerHTML = '<span class="mb-empty">가지고 있는 물건이 없습니다.</span>';
      held.forEach(function (it) {
        var def = G.ITEM[it.id] || it, rl = G.RELIC && G.RELIC[it.id], note = G.ITEM_KIND[def.kind] || '물건';
        if (def.kind === 'instrument' && G.Cabins) {
          var boost = G.Cabins.musicInstrument({ id: m.id, items: [it] });
          note += ' · 음악실 배치 시 효과 ' + boost.mult + '배';
        }
        var row = U.el('div', 'mb-owned-item', '<span class="mb-owned-pic"></span><span><b>' + U.esc(R.itemName(it)) + '</b> <span class="mb-owned-qty">×' + R.itemQty(it) + '</span><small>' + U.esc(note) + '</small></span>');
        row.dataset.item = it.id; row.title = def.desc || '';
        if (G.Img && G.Art.relicArt) row.querySelector('.mb-owned-pic').appendChild(G.Img.make(rl ? G.Img.chain.relic(rl) : G.Img.chain.item(def), 48, 48, function () { return G.Art.relicArt(rl || def, 48, 48, { transparent: true }); }, { fit: 'contain' }));
        ownedList.appendChild(row);
      });
      var music = G.Cabins && G.Cabins.musicInstrument(m);
      if (music && music.item) owned.insertAdjacentHTML('beforeend', '<p class="mb-owned-music">음악실 배치 시 ' + U.esc((G.ITEM[music.item] || {}).name || music.item) + ' 효과 <b>' + music.mult + '배</b> · 여러 악기는 중첩하지 않습니다.</p>');
      var storyHeading = detail.querySelector('.mb-story').previousElementSibling;
      storyHeading.parentNode.insertBefore(owned, storyHeading);
      detail.querySelector('.mb-story').innerHTML = '<p class="mb-appearance">' + U.esc(d.desc || '') + '</p>' + MB.story(m).map(function (t) { return '<p>' + U.esc(t) + '</p>'; }).join('') + (G.Romance && G.Romance.tag(m.id) ? '<p class="mb-relationship">인연 · ' + U.esc(G.Romance.tag(m.id)) + '</p>' : '');
      var notes = [];
      if (G.Cabins && G.Cabins.eff(m) < 1) notes.push('일을 건성으로 · 효율 ' + Math.round(G.Cabins.eff(m) * 100) + '%');
      if (R.mateHurt(m)) notes.push('부상 ' + R.mateHurt(m) + '일');
      if (G.Cabins && G.Cabins.growNote(m)) notes.push('선실 수련 · ' + G.Cabins.growNote(m));
      if (notes.length) detail.querySelector('.mb-story').insertAdjacentHTML('afterbegin', '<p class="mb-service-note">' + U.esc(notes.join(' · ')) + '</p>');
      var actions = detail.querySelector('.mb-actions');
      function button(label, fn, cls) { var b = U.el('button', 'btn ' + (cls || ''), label); b.type = 'button'; b.onclick = fn; actions.appendChild(b); return b; }
      var i = L.indexOf(m);
      button('‹ 이전', function () { choose(L[(i + L.length - 1) % L.length]); });
      button('다음 ›', function () { choose(L[(i + 1) % L.length]); });
      if (G.MateTalk) button('물건을 준다', function () { return action(function () { return G.MateTalk.give(m); }); }, 'navy').dataset.action = 'give-item';
      if (opts.city && G.MateTalk) button('이야기한다', function () { return action(function () { return G.MateTalk.talk(opts.city, m); }); }, 'navy');
      var city = opts.city || (S().loc && S().loc.mode === 'city' && G.CITY_DATA[S().loc.city]);
      var fire = button('해고', function () { return action(function () { return G.MateDismiss.fire(m, city); }); }, 'mb-fire');
      fire.disabled = !city || working; fire.title = city ? '이 동료를 해고한다' : '항구에서 해고할 수 있습니다';
      // 소지품이 많아도 전달·이전·다음 단추는 화면 안에 남긴다.
      var record = detail.querySelector('.mb-record'), recordScroll = U.el('div', 'mb-record-scroll');
      while (record.firstChild && record.firstChild !== actions) recordScroll.appendChild(record.firstChild);
      record.insertBefore(recordScroll, actions);
      body.appendChild(detail); body.scrollTop = 0;
      detail.querySelector('.mb-nav-list').scrollTop = navScroll;
      detail.querySelector('.mb-nav-person.on').scrollIntoView({ block: 'nearest' });
      detail.querySelector('.mb-story').scrollTop = storyPositions[m.id] || 0;
    }
    render();
    return { refresh: render, select: function (id) { var m = S().mates.filter(function (x) { return x.id === id; })[0]; if (m) choose(m); } };
  };
  MB.open = function (city) {
    R.tidyCaptains(); if (G.CrewAuto) G.CrewAuto.refresh();
    var win = G.UI.window({ title: '부하와 이야기', icon: 'people', width: 1280, height: 790, html: '' });
    win.el.classList.add('matebook-win');
    MB.mount(win.content, { city: city }); return win.result;
  };
})(window.G = window.G || {});
