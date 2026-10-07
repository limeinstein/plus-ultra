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
    return { name: d.name, portrait: SC.mateSpec(m.id), half: G.Img.chain.mateHalf(m.id), lang: 3 };
  };

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
  function discoveryMotionMs(d) {
    var fx = (G.FX && G.FX.reveal) || {};
    if (d && d.plant) return fx.plantPlayMs || 8400;
    return d && (d.cat === 'treasure' || d.cat === 'trade') && !d.natural ? (fx.treasurePlayMs || 8400) : (fx.playMs || 5000);
  }
  function discoveryGifMs(d) {
    var fx = (G.FX && G.FX.reveal) || {};
    if (d && d.plant) return fx.plantGifMs || 8400;
    return d && (d.cat === 'treasure' || d.cat === 'trade') && !d.natural ? (fx.treasureGifMs || 8400) : (fx.gifMs || 9820);
  }
  /** 발견 그림 요소. 장면 판이나 GIF가 있으면 움직임을 살리고, 나머지는 기존 Canvas 교체 체계를 쓴다. */
  SC.discoveryPicture = function (d, chain) {
    chain = chain || G.Img.chain.discovery(d);
    var picked = G.Img.pick(chain), file = picked && G.Img.file(picked), art;
    var animatedCat = d.cat === 'geo' || d.cat === 'ruin' || d.cat === 'nature' || d.natural || d.cat === 'creature' || d.cat === 'treasure' || d.cat === 'trade' || d.cat === 'people';   // 민족: 그림이 들어오면 바로 움직인다
    if (animatedCat && G.Reel && G.Reel.has(d)) {
      art = G.Reel.element(d, { cls: 'disc-build-gif', w: 1152, h: 512, ms: discoveryMotionMs(d) });
      art.setAttribute('aria-label', d.name);
      return art;
    }
    if (animatedCat && file && G.Img.isAnim(picked)) {
      art = document.createElement('img');
      art.className = 'disc-build-gif'; art.src = G.Img.src(picked);
      art.alt = d.cat === 'geo' ? d.name + ' 항해 장면과 고지도 위의 발견 항로' :
        d.cat === 'ruin' ? d.name + ' 7단계 복원과 360도 상공 회전' :
        d.cat === 'creature' ? (d.plant ? d.name + ' 유화가 실사 풍경으로 살아나는 장면' : d.name + ' 새끼 등장과 성체 보호 장면') :
          d.cat === 'treasure' && !d.natural ? d.name + ' 암흑 속 박물관 조명과 360도 2회전' : d.cat === 'trade' ? d.name + ' — 등불 켜진 시장 좌판으로 다가가는 장면' : d.name + ' 일출부터 밤까지 이어지는 파노라마';
      return art;
    }
    // 장면 그림이 없는 교역품은 교역품 그림을 시장 좌판 빛 위에 놓는다
    if (d.cat === 'trade' && d.good && G.GOOD[d.good] && G.Img.chain.good) {
      var good = G.GOOD[d.good], goodChain = G.Img.chain.good(good);
      if (G.Img.pick(goodChain)) return G.Img.make(goodChain, 720, 320, function () { return A.discoveryArt(d, 720, 320); }, {
        fit: 'contain',
        post: function (ctx, w, h) {
          ctx.globalCompositeOperation = 'destination-over';
          var bg = ctx.createRadialGradient(w / 2, h * 0.42, 20, w / 2, h / 2, w * 0.62);
          bg.addColorStop(0, '#7c5633'); bg.addColorStop(0.55, '#392315'); bg.addColorStop(1, '#120b08');
          ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
          A.vignette(ctx, w, h, 0.58);
        }
      });
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
    var s = S();
    var chain = G.Img.chain.discovery(d);
    if (G.Img.pick(chain)) await G.Img.preload([chain], 1500);
    // 애니메이션 GIF를 Canvas에 그리면 한 프레임만 남는다. 움직이는 발견 그림은 원본 <img>나 장면 판으로 올린다.
    var art = SC.discoveryPicture(d, chain);
    var impact = s.disc[d.id] && s.disc[d.id].impact;
    function delta(n) { return (n > 0 ? '+' : '') + n; }
    var impactHtml = impact ? '<div class="disc-impact ' + impact.key + '"><div class="di-title">' + G.icon(impact.icon || 'star') + '<b>발견의 여파 · ' + U.esc(impact.name) + '</b></div><div class="di-line">' + U.esc(impact.line) + '</div><div class="di-stats"><span>피로 ' + delta(impact.fatigue) + '</span><span>규율 ' + delta(impact.discipline) + '</span></div></div>' : '';
    var html = '<div class="disc-card"><div class="disc-head">DISCOVERY</div><div class="art"></div>' +
      '<div class="dname">' + U.esc(d.name) + '</div>' +
      '<div class="center"><span class="tag">' + (G.DISC_CATS[d.cat] || '') + '</span> <span class="tag">' + (d.how === 'trade' ? '교역품' : G.REGIONS[d.reg] || '') + '</span> <span class="tag">' + (G.Disc.valueTag ? G.Disc.valueTag(d) : '가치 ' + U.num(d.val)) + '</span></div>' +
      '<div class="desc">' + U.esc(d.desc) + '</div>' + impactHtml + SC.realInfo(d.real) +
      (fame ? '<div class="center big" style="color:#6a3a14">명성 +' + U.num(fame) + '</div>' : '') + SC.relicStrip(d, relics) + '</div>';
    var win = UI.window({ title: fame ? '새로운 발견' : d.name, icon: 'star', width: 780, clickAny: true, html: html, buttons: [{ label: '확인', value: 1, cls: 'navy' }] });
    win.content.querySelector('.art').appendChild(art);
    U.$$('[data-relic]', win.content).forEach(function (el) {
      var r = G.RELIC[el.dataset.relic]; if (!r || !A.relicArt) return;
      el.insertBefore(G.Img.make(G.Img.chain.relic(r), 112, 112, function () { return A.relicArt(r, 112, 112); }), el.firstChild);
    });
    return win.result;
  };

  // ---------------------------------------------------------------- 지리·유적·자연 경관·동물·보물 발견 연출
  /* 화면(탐험 지도·거리)이 살짝 어두워지고 발견 GIF만 빛나며 움직인다 → 마지막 장면에서 멈추고
     「○○ 발견」이 크게 빛나며 떠오른다 → 제독과 부하들이 이야기한다. 유적은 그림·세공에 밝은 사람이
     자세히 기록하면 명성이 더 오른다(D.recordParts). 자연 경관은 화가가 지형과 빛을 기록한다.
     GIF를 멈출 수 없어 마지막 장면은 images/discovery-ends/ID.jpg로 바꿔 끼운다. */
  //   장면 판(images/discovery-sheets/ID.webp)이 있으면 그것을 Canvas로 돌린다(G.Reel) — GIF보다 가볍고, 빠르기를 게임이 정하며,
  //   다시 받지 않고 처음부터 돌릴 수 있다. 없으면 예전처럼 GIF를 <img>로.
  function revealKeys(d) {
    if (d.cat !== 'geo' && d.cat !== 'ruin' && d.cat !== 'nature' && !d.natural && d.cat !== 'creature' && d.cat !== 'treasure' && d.cat !== 'trade' && d.cat !== 'people') return null;
    var sheet = G.Reel ? G.Reel.key(d) : null;
    var chain = G.Img.chain.discovery(d), picked = G.Img.pick(chain), file = picked && G.Img.file(picked);
    var gif = file && G.Img.isAnim(picked) ? picked : null;
    if (!sheet && !gif) return null;
    var end = G.Img.file('discovery-ends/' + d.id) ? 'discovery-ends/' + d.id : null;
    return { sheet: sheet, gif: gif, end: end };
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
    if (kind === 'cook') {      // 교역품 × 요리
      if (lv >= 3) return '맛을 보니 알겠습니다. 이것 하나면 궁정의 식탁도 시장의 좌판도 사로잡을 수 있습니다. 어떻게 다루고 무엇과 곁들이는지까지 적어 두면, 들여올 값어치가 훨씬 높게 매겨질 겁니다.' + (sent.length ? '\f「' + sent.slice(0, 2).join(' ') + '」' : '');
      if (lv >= 2) return '향과 맛, 다듬는 법을 기록해 두겠습니다. 쓰임을 알면 사려는 사람도 늘어나지요.' + (sent.length ? '\f「' + sent[0] + '」' : '');
      return '조금 맛을 보았습니다. 어디에 쓰면 좋을지 짐작이 갑니다. 적어 두지요.';
    }
    if (kind === 'music') {     // 민족 × 음악
      if (lv >= 3) return '저들의 북장단에 가락을 맞추었더니 경계하던 얼굴이 풀립니다. 노래를 주고받는 사이 이야기와 풍습을 하나하나 들을 수 있었습니다.' + (sent.length ? '\f「' + sent.slice(0, 2).join(' ') + '」' : '');
      if (lv >= 2) return '우리 노래를 한 곡 들려주자 저들도 답가를 불러 주었습니다. 마음이 열린 덕에 더 많은 것을 알게 되었습니다.' + (sent.length ? '\f「' + sent[0] + '」' : '');
      return '피리를 꺼내 한 소절 불었더니 아이들이 먼저 다가옵니다. 말이 통하지 않아도 노래는 통하는군요.';
    }
    if (d.cat === 'creature') {
      if (d.plant) {
        if (kind === 'sci') {
          if (lv >= 3) return '줄기와 잎맥, 꽃과 열매, 뿌리가 땅과 물을 붙드는 모습까지 차례로 적겠습니다. 사는 땅의 빛과 습기도 함께 살피면 이 식물이 어떻게 살아가는지 밝힐 수 있습니다.\f' + (sent.length ? '「' + sent.join(' ') + '」' : '');
          if (lv >= 2) return '잎과 줄기의 생김새, 뿌리 내린 땅, 빛을 받는 방향을 함께 기록하겠습니다.' + (sent.length ? '\f「' + sent.slice(0, 2).join(' ') + '」' : '');
          return '손대지 말고 잎과 줄기, 자라는 자리부터 찬찬히 적어 두겠습니다.' + (sent.length ? '\f「' + sent[0] + '」' : '');
        }
        if (lv >= 3) return '빈 화폭에 먼 풍경부터 깔고, 줄기와 잎을 한 획씩 세운 뒤 마지막 빛까지 얹겠습니다. 살아 숨 쉬는 이 모습을 그대로 전할 수 있을 겁니다.';
        if (lv >= 2) return '잎과 꽃의 빛깔, 줄기의 결, 주위 풍경이 함께 드러나도록 그려 두겠습니다.';
        return '시들기 전에 윤곽과 빛깔부터 화첩에 옮겨 두겠습니다.';
      }
      if (kind === 'sci') {
        if (lv >= 3) return '새끼의 생김새와 움직임, 성체가 뒤를 지키는 습성까지 차례로 적겠습니다. 털과 비늘, 발자국도 견주어 보면 이 동물이 어떻게 살아가는지 밝혀낼 수 있습니다.\f' + (sent.length ? '「' + sent.join(' ') + '」' : '');
        if (lv >= 2) return '새끼와 성체의 크기, 먹이 흔적, 사는 곳을 함께 기록하겠습니다.' + (sent.length ? '\f「' + sent.slice(0, 2).join(' ') + '」' : '');
        return '놀라게 하지 말고 생김새와 움직임부터 찬찬히 적어 두겠습니다.' + (sent.length ? '\f「' + sent[0] + '」' : '');
      }
      if (lv >= 3) return '새끼의 코와 눈빛부터 뒤에 선 성체의 위엄까지 한 장에 담겠습니다. 이 그림이면 먼 나라 사람도 살아 있는 모습을 떠올릴 겁니다.';
      if (lv >= 2) return '털과 비늘의 빛깔, 새끼와 성체의 크기 차이가 드러나도록 그려 두겠습니다.';
      return '움직이기 전에 얼굴과 윤곽부터 화첩에 옮겨 두겠습니다.';
    }
    if (d.cat === 'nature' || d.natural) {
      if (lv >= 3) return '빛이 옮겨 가는 방향과 바위·물·구름의 빛깔까지 살려 채색 도판으로 남기겠습니다.\f' + (sent.length ? '「' + sent.join(' ') + '」\f' : '') + '— 이 광경을 보지 못한 학자도 지형을 헤아릴 수 있을 겁니다.';
      if (lv >= 2) return '산줄기의 높낮이와 물길의 폭을 재어, 눈앞의 넓이와 깊이가 드러나게 그려 두겠습니다.' + (sent.length ? '\f「' + sent.slice(0, 2).join(' ') + '」' : '');
      return '멀리 보이는 윤곽과 빛깔만이라도 화첩에 옮겨 두겠습니다.' + (sent.length ? '\f「' + sent[0] + '」' : '');
    }
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
    var treasure = d.cat === 'treasure' && !d.natural, playMs = discoveryMotionMs(d);
    var el = U.el('div', 'reveal' + (treasure ? ' treasure' : ''));
    el.style.setProperty('--rv-dim', FX.dim != null ? FX.dim : 0.62);
    el.style.setProperty('--rv-dim-ms', (FX.dimMs || 900) + 'ms');
    el.innerHTML = '<div class="rv-dim"></div><div class="rv-rays"></div>' +
      '<div class="rv-frame" style="width:' + W + 'px;height:' + H + 'px">' + (keys.sheet ? '<canvas class="rv-reel" width="1152" height="512"></canvas>' : '<img class="rv-gif" alt="">') + '<img class="rv-end" alt=""></div>' +
      '<div class="rv-title"><b>' + U.esc(d.name) + '</b> 발견</div><div class="rv-skip">누르면 건너뜁니다</div>';
    // 화면 층(#screen) 위, 대화창 층 아래 — 윗줄 HUD와 지도 이름표까지 함께 어두워진다
    var uiRoot = document.getElementById('ui'); if (uiRoot) uiRoot.appendChild(el); else UI.add(el);
    var gif = el.querySelector('.rv-gif'), end = el.querySelector('.rv-end'), reel = null, L = null;
    if (keys.end) end.src = G.Img.src(keys.end);
    if (keys.sheet) {
      // 미리 받아 두었으면(G.Reel.prefetch) 곧바로, 아니면 받는 동안 화면부터 어두워진다
      L = G.Reel.now(keys.sheet);
      if (!L) {
        setTimeout(function () { el.classList.add('on'); }, 30);
        L = await G.Img.wait(G.Reel.load(keys.sheet), FX.loadWaitMs || 2500);   // 느린 연결에서도 연출을 건너뛰지 않고 판을 기다린다
      }
      setTimeout(function () { el.classList.add('on'); }, 30);
      if (L) reel = G.Reel.play(el.querySelector('.rv-reel'), L, { ms: playMs });
    } else {
      // 이미 한 번 불러 둔 GIF도 처음 장면부터 돌도록 새로 불러온다 (파일 주소일 때만 — 한 파일짜리 판의 data: 주소는 그대로)
      var src = G.Img.src(keys.gif); if (!/^(data|blob):/.test(src)) src += (src.indexOf('?') < 0 ? '?' : '&') + 'rv=' + Date.now();
      var loaded = G.Img.wait(new Promise(function (r) { gif.onload = r; gif.onerror = r; }), FX.loadWaitMs || 2500);
      gif.src = src;
      await loaded;
      setTimeout(function () { el.classList.add('on'); }, 30);
    }
    // 연출이 끝날 때까지 — 누르거나 Enter·Space·Esc면 곧장 마지막 장면으로
    await new Promise(function (resolve) {
      var wait = reel ? null : setTimeout(fin, (L === null && keys.sheet ? 600 : discoveryGifMs(d) + 80)), done = false;
      if (reel) reel.done.then(fin);
      function fin() { if (done) return; done = true; if (wait) clearTimeout(wait); if (reel) reel.finish(); unkey(); el.removeEventListener('click', fin); resolve(); }
      var unkey = UI.pushKey(function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { fin(); return true; } return true; });
      el.addEventListener('click', fin);
    });
    if (keys.end && !reel) el.classList.add('ended');      // 마지막 장면에서 멈춤 (장면 판은 스스로 마지막 장면에서 멈춰 있다)
    el.classList.add('titled');
    if (G.Audio) G.Audio.sfx('discover');
    await U.sleep(FX.titleMs || 1600);
    el.classList.add('talk');
    // ---- 대화
    var s = S(), p = s.player, me = { name: p.name, portrait: p.portrait };
    var lead = SC.mateSpeaker('first');
    var legend = d.real && d.real.legend, animal = d.cat === 'creature';
    await UI.say(U.pick(['제독, 보십시오! 저것이 바로 소문으로만 듣던 ' + d.name + '입니다!', '제독…! 이야기 속에서나 듣던 ' + d.name + U.jx(d.name, '이/가') + ' 정말 눈앞에 있습니다!', '다들 멈춰! 제독, ' + d.name + '입니다. 우리가 찾아낸 겁니다!']), lead);
    await UI.say(legend ? U.pick(['전설이 거짓이 아니었군… 모두 잘해 주었다.', '꿈을 꾸는 것만 같구나. 이 광경을 잊지 말자.']) : U.pick(['마침내 찾았구나. 먼 길을 함께 와 준 덕분이다.', '이 눈으로 직접 보게 될 줄이야… 모두 수고했다.', '세상에 이런 것이 있었다니. 빠짐없이 기록해 두자.']), me);
    if (animal) await UI.say(U.pick(['새끼 뒤에 성체가 있습니다. 더 다가가면 위험합니다. 이 자리에서 조용히 살펴보시지요.', '새끼를 지키러 성체가 나왔습니다. 길을 막지 말고, 놀라게 하지 않도록 물러서서 기록하겠습니다.']), lead);
    var natural = d.cat === 'nature' || d.natural;
    var art = bestHand('art'), science = animal ? bestHand('sci') : { lv: 0 }, craft = (natural || animal) ? { lv: 0 } : bestHand('craft'), rec = G.Disc.recordParts ? G.Disc.recordParts(d) : { k: 1 };
    if (science.lv) await UI.say(lineFor('sci', science.lv, d), science.speaker);
    if (art.lv) await UI.say(lineFor('art', art.lv, d), art.speaker);
    if (craft.lv) await UI.say(lineFor('craft', craft.lv, d), craft.speaker);
    var cook = d.cat === 'trade' ? bestHand('cook') : { lv: 0 }, music = d.cat === 'people' ? bestHand('music') : { lv: 0 };
    if (cook.lv) await UI.say(lineFor('cook', cook.lv, d), cook.speaker);
    if (music.lv) await UI.say(lineFor('music', music.lv, d), music.speaker);
    if (!art.lv && !science.lv && !craft.lv && !cook.lv && !music.lv) await UI.say(animal ? U.pick(['생물에 밝은 사람이나 화가가 함께였다면 새끼와 성체의 모습을 더 자세히 남겼을 텐데요. 눈에 새겨 두겠습니다.', '가까이 갈 수는 없으니 발자국과 생김새를 잘 기억해 두어야겠습니다.']) : natural ? U.pick(['그림을 그릴 줄 아는 사람이 있었더라면 이 넓은 풍경을 그대로 옮겨 갈 수 있었을 텐데요. 말로만 전하면 믿어 줄지 모르겠습니다.', '산줄기와 물길의 생김새를 화첩에 남기지 못해 아쉽습니다. 눈에 새겨 두어야겠습니다.']) : U.pick(['그림을 그릴 줄 아는 사람이 있었더라면 이 모습을 그대로 옮겨 갈 수 있었을 텐데요. 말로만 전하면 믿어 줄지 모르겠습니다.', '솜씨 좋은 화가나 장인이 함께였다면 짜임새까지 자세히 적어 갔을 텐데, 아쉽습니다.']), lead);
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
