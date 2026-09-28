/* Shared scene helpers: companion speakers, discovery card with painted vignette, resume. */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, A = G.Art, R = G.R;
  var SC = G.Scenes;
  function S() { return G.Game.state; }

  SC.mateSpec = function (id) { return A.mateSpec(id); };
  /** speaker object for the companion in a given fleet role (falls back to any mate / boatswain) */
  SC.mateSpeaker = function (role) {
    var s = S(), m = null;
    if (s) { m = s.mates.filter(function (x) { return x.role === role; })[0] || s.mates.filter(function (x) { return x.role === 'first'; })[0] || s.mates[0]; }
    if (!m) return { name: '갑판장', portrait: A.withImg(A.npcSpec('boatswain', 'sailor', 'ib'), G.Img.chain.npc('boatswain')), lang: 3 };
    var d = G.MATE[m.id];
    return { name: d.name, portrait: SC.mateSpec(m.id), lang: 3 };
  };
  SC.hasMate = function (role) { var s = S(); return s.mates.some(function (x) { return x.role === role; }); };

  // ---------------------------------------------------------------- 실제 자료 (tools/heritage → G.HERITAGE)
  function link(url, text) { return url ? '<a href="' + U.esc(url) + '" target="_blank" rel="noopener">' + U.esc(text) + '</a>' : U.esc(text); }
  /** 출처 한 줄: 설명·자료·사진이 어디서 왔는지 (재사용 조건 표시) */
  SC.realCredit = function (H) {
    if (!H) return '';
    var p = [];
    if (H.whc) p.push(link(H.whc.url, 'UNESCO 세계유산센터') + ' (CC BY-SA 3.0 IGO)');
    if (H.wiki) p.push(link(H.wiki.url, '위키백과') + ' (CC BY-SA 4.0)');
    if (H.bio) p.push(link(H.bio.url, 'GBIF.org'));
    if (H.sea) p.push(link(H.sea.url, 'OBIS'));
    if (H.obj) p.push(link(H.obj.url, H.obj.museum) + ' (CC0)');
    var ph = H.photo ? '사진: ' + link(H.photo.url, [H.photo.by, H.photo.src].filter(Boolean).join(' · ') || '출처') + (H.photo.lic ? ' (' + U.esc(H.photo.lic) + ')' : '') : '';
    if (!p.length && !ph) return '';
    return '<div class="real-credit">' + (p.length ? '자료: ' + p.join(' · ') + (H.desc || H.record ? ' — 한국어 글은 이를 바탕으로 새로 씀' : '') : '') + (p.length && ph ? '<br>' : '') + ph + '</div>';
  };
  /** 발견물의 실제 모습: 세계유산 등재·생물 분류·소장품 — 발견 카드와 수첩에서 쓴다 */
  SC.realInfo = function (H) {
    if (!H) return '';
    var tags = [], out = '';
    if (H.whc) tags.push('<span class="tag whc">UNESCO 세계유산' + (H.whc.year ? ' · ' + H.whc.year + '년 등재' : '') + '</span>' + (H.whc.crit ? '<span class="tag">기준 ' + U.esc(H.whc.crit) + '</span>' : '') + (H.whc.danger ? '<span class="tag warn-text">위험에 처한 유산</span>' : ''));
    if (H.bio) tags.push('<span class="tag"><i>' + U.esc(H.bio.sci) + '</i></span>' + (H.bio.family ? '<span class="tag">' + U.esc(H.bio.family) + '</span>' : '') + (H.bio.records ? '<span class="tag">관찰 기록 ' + U.num(H.bio.records) + '건</span>' : '') + (H.bio.extinct ? '<span class="tag warn-text">멸종</span>' : ''));
    if (H.sea) tags.push('<span class="tag">바다 기록 ' + U.num(H.sea.records || 0) + '건' + (H.sea.depth ? ' · 깊이 ' + H.sea.depth[0] + '–' + H.sea.depth[2] + 'm' : '') + '</span>');
    if (H.obj) tags.push('<span class="tag">' + U.esc(H.obj.museum) + ' 소장</span>');
    if (H.legend) tags.push('<span class="tag">전설</span>');
    if (tags.length) out += '<div class="center real-tags">' + tags.join(' ') + '</div>';
    if (H.record) out += '<div class="real-record"><b>' + (H.whc ? '세계유산 기록' : H.legend ? '전설의 배경' : '오늘날의 기록') + '</b> ' + U.esc(H.record) + '</div>';
    if (H.lore && H.lore.length) out += H.lore.map(function (t) { return '<div class="real-lore">' + U.esc(t) + '</div>'; }).join('');
    if (H.obj && H.obj.title) out += '<div class="real-obj">' + link(H.obj.url, H.obj.title) + [H.obj.date, H.obj.culture, H.obj.no ? '소장 번호 ' + H.obj.no : ''].filter(Boolean).map(function (x) { return ' · ' + U.esc(x); }).join('') + '</div>';
    return out + SC.realCredit(H);
  };

  /** big discovery announcement card */
  /** 발견 그림 요소. 유적 복원 GIF는 움직임을 살리고, 나머지는 기존 Canvas 교체 체계를 쓴다. */
  SC.discoveryPicture = function (d, chain) {
    chain = chain || G.Img.chain.discovery(d);
    var picked = G.Img.pick(chain), file = picked && G.Img.file(picked), art;
    if (d.cat === 'ruin' && file && G.Img.isAnim(picked)) {
      art = document.createElement('img');
      art.className = 'disc-build-gif'; art.src = G.Img.src(picked); art.alt = d.name + ' 7단계 복원과 360도 상공 회전';
      return art;
    }
    return G.Img.make(chain, 720, 320, function () { return A.discoveryArt(d, 720, 320); });
  };
  /** 발견 카드 아래의 유물 줄: 새로 찾았을 때는 손에 넣은 것, 수첩에서 볼 때는 지금 어디에 있는지 */
  SC.relicStrip = function (d, relics) {
    var all = G.RELICS && G.RELICS[d.id]; if (!all || !all.length) return '';
    var s = G.Game.state, st = s.disc[d.id] || {}, mine = st.me;
    var list = relics || (mine ? all : null); if (!list || !list.length) return '';
    function where(r) {
      if (relics) return G.RELIC_KIND[r.kind] + ' · 값 ' + U.num(r.price);
      var it = s.player.items.filter(function (x) { return x.id === r.id; })[0];
      if (it) return R.isProof(it) ? '소지 중 (증거)' : '소지 중';
      if (st.left && st.left.indexOf(r.id) >= 0) return '그 자리에 두고 옴';
      if ((st.relics || []).indexOf(r.id) < 0) return '손에 넣지 못함';
      if (s.fleet.ships.some(function (sh) { return sh.fig === r.id; })) return '배에 달았다';
      return st.reported && st.gaveTo ? '후원자에게 바침' : '손을 떠남';
    }
    return '<div class="relic-strip"><div class="rs-head">' + (relics ? '손에 넣은 유물 — 발견의 증거가 됩니다' : '이 발견의 유물') + '</div><div class="rs-row">' +
      list.map(function (r) { var ob = r.real && r.real.obj; return '<div class="rs-item" data-relic="' + r.id + '"><b>' + U.esc(r.name) + '</b><small>' + where(r) + '</small>' + (ob ? '<small class="rs-museum">' + U.esc(ob.museum) + '</small>' : '') + '</div>'; }).join('') + '</div>' +
      (relics ? '<div class="rs-note">후원자에게 보고하면 증거로 바치고, 항구에서 스스로 발표하면 제독의 것이 됩니다.</div>' : '') + '</div>';
  };
  SC.discoveryCard = async function (d, fame, relics) {
    var chain = G.Img.chain.discovery(d);
    if (G.Img.pick(chain)) await G.Img.preload([chain], 1500);
    // 애니메이션 GIF를 Canvas에 그리면 한 프레임만 남는다. 유적은 원본 <img>로 올린다.
    var art = SC.discoveryPicture(d, chain);
    var html = '<div class="disc-card"><div class="disc-head">DISCOVERY</div><div class="art"></div>' +
      '<div class="dname">' + U.esc(d.name) + '</div>' +
      '<div class="center"><span class="tag">' + (G.DISC_CATS[d.cat] || '') + '</span> <span class="tag">' + (d.how === 'trade' ? '교역품' : G.REGIONS[d.reg] || '') + '</span> <span class="tag">' + (G.Disc.valueTag ? G.Disc.valueTag(d) : '가치 ' + U.num(d.val)) + '</span></div>' +
      '<div class="desc">' + U.esc(d.desc) + '</div>' + SC.realInfo(d.real) +
      (fame ? '<div class="center big" style="color:#6a3a14">명성 +' + U.num(fame) + '</div>' : '') + SC.relicStrip(d, relics) + '</div>';
    var win = UI.window({ title: fame ? '새로운 발견' : d.name, icon: 'star', width: 780, clickAny: true, html: html, buttons: [{ label: '확인', value: 1, cls: 'navy' }] });
    win.content.querySelector('.art').appendChild(art);
    U.$$('[data-relic]', win.content).forEach(function (el) {
      var r = G.RELIC[el.dataset.relic]; if (!r || !A.relicArt) return;
      el.insertBefore(G.Img.make(G.Img.chain.relic(r), 112, 112, function () { return A.relicArt(r, 112, 112); }), el.firstChild);
    });
    return win.result;
  };

  // ---------------------------------------------------------------- 유적 발견 연출
  /* 화면(탐험 지도·거리)이 살짝 어두워지고 복원 GIF만 빛나며 한 바퀴 돈다 → 마지막 장면에서 멈추고
     「○○ 발견」이 크게 빛나며 떠오른다 → 제독과 부하들이 이야기한다. 그림·세공에 밝은 사람이 있으면
     그만큼 자세히 기록하고(발견 설명·실제 자료에서 그 시대에 알 수 있는 것만 골라 말한다) 명성이 더 오른다(D.recordParts).
     GIF를 멈출 수 없어 마지막 장면은 images/discovery-ends/ID.jpg (tools/ruin_gifs/end_frames.py)로 바꿔 끼운다. */
  function revealKeys(d) {
    var chain = G.Img.chain.discovery(d), picked = G.Img.pick(chain), file = picked && G.Img.file(picked);
    if (d.cat !== 'ruin' || !file || !G.Img.isAnim(picked)) return null;
    var end = G.Img.file('discovery-ends/' + d.id) ? 'discovery-ends/' + d.id : null;
    return { gif: picked, end: end };
  }
  SC.hasReveal = function (d) { return !!revealKeys(d); };
  /** 그 기술을 가장 잘하는 사람: {lv, speaker, me} (제독 자신일 수도 있다) */
  function bestHand(id) {
    var s = S(), p = s.player, best = { lv: p.sk[id] || 0, speaker: { name: p.name, portrait: p.portrait }, me: true };
    s.mates.forEach(function (m) {
      var d = G.MATE[m.id]; if (!d) return;
      var lv = R.mateSkill(m, id);
      if (lv > best.lv) best = { lv: lv, speaker: { name: d.name, portrait: SC.mateSpec(m.id), lang: 3 }, me: false };
    });
    return best;
  }
  /** 발견 설명과 실제 자료에서 그 시대 사람이 말할 수 있는 문장만 (오늘날의 연도·등재 이야기는 뺀다) */
  function periodSentences(d) {
    var y = S().date.y, out = [];
    function ok(t) {
      if (/세계유산|등재|오늘날|실제로는|박물관|발굴 조사|성분 조사/.test(t)) return false;
      var yrs = t.match(/\d{4}/g) || []; return !yrs.some(function (x) { return +x > y; });
    }
    function split(t) { return String(t || '').split(/(?<=[.。!?])\s+/).map(function (x) { return x.trim(); }).filter(Boolean); }
    split(d.desc).forEach(function (t) { if (ok(t)) out.push(t); });
    var H = d.real || {};
    (H.lore || []).forEach(function (l) { split(l).forEach(function (t) { if (ok(t) && out.indexOf(t) < 0) out.push(t); }); });
    return out;
  }
  function lineFor(kind, lv, d) {
    var sent = periodSentences(d);
    if (kind === 'art') {
      if (lv >= 3) return '빛이 기우는 방향과 그림자의 깊이까지 살려 채색 도판으로 남기겠습니다.\f' + (sent.length ? '「' + sent.join(' ') + '」\f' : '') + '— 이만한 기록이면 학자들도 앞다투어 들여다볼 겁니다.';
      if (lv >= 2) return '기둥 사이 간격과 지붕선의 기울기까지 재어, 비례를 맞춰 그려 두겠습니다.' + (sent.length ? '\f「' + sent.slice(0, 2).join(' ') + '」' : '');
      return '대강의 윤곽이라도 화첩에 옮겨 두겠습니다.' + (sent.length ? '\f「' + sent[0] + '」' : '');
    }
    if (lv >= 3) return '쓰인 재료와 짜 맞춘 방식을 하나하나 적어 두겠습니다. 이음새의 각도, 장식의 두께, 장인이 쓴 연장까지 — 어느 고장의 장인이 어떻게 지었는지 짐작이 갑니다.';
    if (lv >= 2) return '이음새와 장식의 마감에 빈틈이 없군요. 장인의 연장 자국까지 고스란히 남아 있습니다. 재어서 적어 두겠습니다.';
    return '다듬은 솜씨가 예사롭지 않습니다. 눈에 띄는 장식만이라도 적어 두지요.';
  }
  SC.discoveryReveal = async function (d, fame) {
    var keys = revealKeys(d); if (!keys) return false;
    var FX = (G.FX && G.FX.reveal) || {}, W = Math.round(576 * (FX.scale || 1.9)), H = Math.round(256 * (FX.scale || 1.9));
    var el = U.el('div', 'reveal');
    el.style.setProperty('--rv-dim', FX.dim != null ? FX.dim : 0.62);
    el.style.setProperty('--rv-dim-ms', (FX.dimMs || 900) + 'ms');
    el.innerHTML = '<div class="rv-dim"></div><div class="rv-rays"></div>' +
      '<div class="rv-frame" style="width:' + W + 'px;height:' + H + 'px"><img class="rv-gif" alt=""><img class="rv-end" alt=""></div>' +
      '<div class="rv-title"><b>' + U.esc(d.name) + '</b> 발견</div><div class="rv-skip">누르면 건너뜁니다</div>';
    // 화면 층(#screen) 위, 대화창 층 아래 — 윗줄 HUD와 지도 이름표까지 함께 어두워진다
    var uiRoot = document.getElementById('ui'); if (uiRoot) uiRoot.appendChild(el); else UI.add(el);
    var gif = el.querySelector('.rv-gif'), end = el.querySelector('.rv-end');
    // 이미 한 번 불러 둔 GIF도 처음 장면부터 돌도록 새로 불러온다 (파일 주소일 때만 — 한 파일짜리 판의 data: 주소는 그대로)
    var src = G.Img.src(keys.gif); if (!/^(data|blob):/.test(src)) src += (src.indexOf('?') < 0 ? '?' : '&') + 'rv=' + Date.now();
    var loaded = new Promise(function (r) { gif.onload = r; gif.onerror = r; setTimeout(r, FX.loadWaitMs || 2500); });
    gif.src = src;
    if (keys.end) end.src = G.Img.src(keys.end);
    await loaded;
    setTimeout(function () { el.classList.add('on'); }, 30);
    // 한 바퀴 돌 때까지 — 누르거나 Enter·Space·Esc면 곧장 마지막 장면으로
    await new Promise(function (resolve) {
      var t = setTimeout(fin, (FX.gifMs || 9870) + 80), done = false;
      function fin() { if (done) return; done = true; clearTimeout(t); unkey(); el.removeEventListener('click', fin); resolve(); }
      var unkey = UI.pushKey(function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { fin(); return true; } return true; });
      el.addEventListener('click', fin);
    });
    if (keys.end) el.classList.add('ended');      // 마지막 장면에서 멈춤
    el.classList.add('titled');
    if (G.Audio) G.Audio.sfx('discover');
    await U.sleep(FX.titleMs || 1600);
    el.classList.add('talk');
    // ---- 대화
    var s = S(), p = s.player, me = { name: p.name, portrait: p.portrait };
    var lead = SC.mateSpeaker('first');
    var legend = d.real && d.real.legend;
    await UI.say(U.pick(['제독, 보십시오! 저것이 바로 소문으로만 듣던 ' + d.name + '입니다!', '제독…! 이야기 속에서나 듣던 ' + d.name + U.jx(d.name, '이/가') + ' 정말 눈앞에 있습니다!', '다들 멈춰! 제독, ' + d.name + '입니다. 우리가 찾아낸 겁니다!']), lead);
    await UI.say(legend ? U.pick(['전설이 거짓이 아니었군… 모두 잘해 주었다.', '꿈을 꾸는 것만 같구나. 이 광경을 잊지 말자.']) : U.pick(['마침내 찾았구나. 먼 길을 함께 와 준 덕분이다.', '이 눈으로 직접 보게 될 줄이야… 모두 수고했다.', '세상에 이런 것이 있었다니. 빠짐없이 기록해 두자.']), me);
    var art = bestHand('art'), craft = bestHand('craft'), rec = G.Disc.recordParts ? G.Disc.recordParts(d) : { k: 1 };
    if (art.lv) await UI.say(lineFor('art', art.lv, d), art.speaker);
    if (craft.lv) await UI.say(lineFor('craft', craft.lv, d), craft.speaker);
    if (!art.lv && !craft.lv) await UI.say(U.pick(['그림을 그릴 줄 아는 사람이 있었더라면 이 모습을 그대로 옮겨 갈 수 있었을 텐데요. 말로만 전하면 믿어 줄지 모르겠습니다.', '솜씨 좋은 화가나 장인이 함께였다면 짜임새까지 자세히 적어 갔을 텐데, 아쉽습니다.']), lead);
    if (rec.k > 1.0001) {
      var extra = Math.round(fame - fame / rec.k);
      await UI.say('이만큼 자세한 ' + (art.lv && craft.lv ? '그림과 기록' : art.lv ? '그림' : '기록') + '이라면 유럽의 학자와 궁정도 믿지 않을 수 없겠지요. 제독의 이름이 한층 더 널리 알려질 겁니다.', lead);
      if (extra > 0) UI.toast('현장 기록 — ' + (art.lv ? '그림 ' + art.lv + '단계' : '') + (art.lv && craft.lv ? ' · ' : '') + (craft.lv ? '세공 ' + craft.lv + '단계' : '') + ' · 명성 +' + U.num(extra) + ' 더', 'star', 4200);
    }
    el.classList.add('out');
    await U.sleep(450);
    if (el.parentNode) el.parentNode.removeChild(el);
    return true;
  };

  // ---------------------------------------------------------------- resume from a loaded save
  G.Game.resume = function () {
    if (G.Names) G.Names.apply();
    if (G.Wander) G.Wander.apply();      // 철새 — 옛 저장에는 처음 불러올 때 생긴다
    var s = G.Game.state;
    if (!s.settings) s.settings = { diff: 'normal', speed: 1 };
    if (s.fleet && s.fleet.mat == null) s.fleet.mat = (G.BALANCE && G.BALANCE.matStart) || 10;   // 자재가 생기기 전 저장 파일
    UI.fade(function () {
      if (s.loc.mode === 'sea') G.Game.go('sea', { resume: true });
      else if (s.loc.mode === 'land' && G.Scenes.land) G.Game.go('land', { resume: true });
      else G.Game.go('city', { cityId: s.loc.city, load: true });
    });
  };
})(window.G = window.G || {});
