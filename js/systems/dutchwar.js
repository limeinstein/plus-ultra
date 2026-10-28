/* 네덜란드 독립 전쟁 — 개미와 베짱이 (G.DutchWar) 2026-10-28 사용자 요청
   에스파냐 왕에게 맞선 반란이 독립 전쟁으로 번지고, 네덜란드가 바다와 장사의 강국으로 자란다.
   그 시작에 선 암스테르담 젊은이들이 「개미와 베짱이」를 두고 다툰다 — 누가 개미이고 누가 베짱이인가. (사람: js/data/dutchwar.js)
   ■ 흐름 (암스테르담 — 1578년 5월까지 왕의 편이던 도시)
     ① 여름의 노래 (1566.8.10~1575.7.31, 처음 들어설 때): 담 광장 청어 시장. 할리나가 술통 위에서 외친다 —
        「여름 내 청어를 잡고 배를 지은 우리가 개미, 우리 곳간에서 열 번째 동전을 걷어 가는 왕의 사람들이 베짱이」.
        페르베르크가 맞받는다 — 「겨울이 오면 베짱이는 곳간이 가장 큰 집, 왕의 집 문을 두드리게 된다. 개미 혼자서는 겨울을 못 난다」.
        사내들: 노래만 부르는 바다거지 얀, 조용히 장사나 하자는 피터르, 에스파냐 장교 디르크. 제독이 편을 고른다 (또는 미룬다 — cool일 뒤 다시).
     ② 곳간 (밀 wheat 이상을 싣고 들어서면 — 고른 그 자리에서 이미 있으면 바로):
        할리나 편 「개미의 곳간」: 밤 운하 어귀에서 포위된 도시(하를럼·알크마르·레이던…)로 가는 바다거지 배에 밀을 싣는다 — 디르크의 순찰대와 육상전.
          이기면 할리나가 사내들의 청혼을 물리치고 제독의 배에 오른다. 네덜란드의 독립이 shift(2)년 빨라진다.
        페르베르크 편 「왕의 곳간」: 바닷길이 막힌 암스테르담 시민에게 나눌 밀을 페르베르크 저택에 들인다 — 얀의 바다거지들과 육상전.
          이기면 페르베르크가 왕의 곳간을 보러 제독의 배에 오른다. 역사는 그대로 흘러간다 (1581년 독립 선언).
        지면 밀을 빼앗기고 cool일 뒤 다시. 동료 제안을 미루면 offerUntil까지 암스테르담에서 기다린다.
     ③ 소식 (만난 사람만): 열 번째 동전(1571) · 브릴(1572) · 하를럼 함락(1573) · 레이던 해방(1574) · 앤트워프의 약탈(1576) ·
           위트레흐트 동맹(1579) · [두 해 이른 독립 선언(1579.7.26)] · 빌럼의 죽음(1584) · 연합 동인도 회사(1602) · 열두 해 휴전(1609)
   ■ 독립이 두 해 빨라지면 (s.dutchwar.early) — 자료는 그대로 두고 이 판에서만 읽는 값을 바꾼다
     · 도시 주인(G.Dominion.ownerAt·changesIn): 브뤼즈·앤트워프·암스테르담·브뤼셀이 네덜란드 편에 서는 날이 두 해 빠르다
     · 나라(G.Rel.powers): 네덜란드가 1581년 대신 1579년부터 · 에스파냐와 전쟁, 잉글랜드와 우호 (G.Rel.set, 1581년부터는 본래 값)
     · 지도자(G.Dominion.leader): 1575~1580년 네덜란드의 스타트하우더는 오라녀 공 빌럼 1세
     · 「네덜란드의 독립 선언」(relevents hb_dutch, 1581.7.26)은 1579.7.26에 이 파일이 알리고 본래 날짜에는 알리지 않는다
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/dutch_*.webp — images/legend-events/DUTCH_PROMPT.md
   ■ 저장: s.dutchwar = { met, asked, wait, side: 'free'|'spain', step: 1|2, lostAt, joined, offer, early, expired, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var DW = G.DutchWar = {};
  function K() { return G.BALANCE.dutchWar; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  function dayIdx(n) { return U.dayIndex({ y: Math.floor(n / 10000), m: Math.floor(n / 100) % 100, d: n % 100 }); }
  function since(n) { return U.dayIndex(S().date) - dayIdx(n); }

  // 이미 지난 소식은 알린 것으로 친다 (옛 저장·늦게 시작한 판)
  var NEWS = ['tenth', 'briel', 'haarlem', 'leiden', 'fury', 'utrecht', 'abjure', 'willem', 'voc', 'truce'];
  var NEWS_AT = { tenth: 15710801, briel: 15720401, haarlem: 15730713, leiden: 15741003, fury: 15761104, utrecht: 15790123, abjure: 15790726, willem: 15840710, voc: 16020320, truce: 16090409 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.dutchwar) {
      s.dutchwar = { told: {} };
      NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.dutchwar.told[k] = 1; });
    }
    s.dutchwar.told = s.dutchwar.told || {};
    return s.dutchwar;
  }
  DW.state = st;
  function early() { var s = S(); return !!(s && s.dutchwar && s.dutchwar.early); }
  DW.early = early;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { return !!(S().flags && S().flags['gone_' + id]); }
  function aboard(id) { var m = row(id); return !!(m && !(R.mateHidden && R.mateHidden(m))); }
  function H(id) { return G.Hist ? G.Hist.speaker('nl_' + id) : { name: id, lang: 3 }; }
  function MS(id, emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id, emo) : { name: G.MATE[id].name, portrait: G.Scenes.mateSpec(id), lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) { return k === 'P' ? me() : k === 'halina' || k === 'verberk' ? MS(k) : k ? H(k) : {}; }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function crownTrust(n) { if (G.Sponsor && G.SPONSOR && G.SPONSOR.es_crown) G.Sponsor.addTrust(G.Sponsor.rel('es_crown'), n); }
  function spaniard() { return S().player.nation === 'ES'; }

  // ================================================================ 밀
  DW.wheat = function () { var c = S().fleet.cargo || {}; return c.wheat ? c.wheat.q || 0 : 0; };
  function takeWheat(n) { var c = S().fleet.cargo; if (!c.wheat) return 0; var t = Math.min(n, c.wheat.q); c.wheat.q -= t; if (c.wheat.q <= 0) delete c.wheat; return t; }

  // 그 무렵 거리의 이야기와 포위된 도시
  function mood() {
    var t = today();
    if (t < 15670822) return '지난여름 남쪽 도시들에서 성상을 부수는 소동이 번졌다. 마드리드의 왕이 크게 노했다는 소문이 돈다.';
    if (t < 15720401) return '왕이 보낸 알바 공의 「피의 위원회」가 사람들을 잡아가고, 물건을 팔 때마다 값의 열에 하나를 걷겠다는 「열 번째 동전」 이야기로 거리가 들끓는다.';
    return '바다거지들이 브릴을 빼앗은 뒤로 홀란트의 도시들이 하나둘 오라녀 공의 깃발을 올렸다. 암스테르담만은 아직 왕의 편이고, 성 밖 바다는 거지당 배들이 막고 있다.';
  }
  function besieged() {
    var t = today();
    if (t < 15721211) return '숲과 바다에 숨은 오라녀 공의 사람들';
    if (t < 15730713) return '에스파냐 군에게 둘러싸인 하를럼';
    if (t < 15731008) return '에스파냐 군에게 둘러싸인 알크마르';
    if (t <= 15741003) return '에스파냐 군에게 둘러싸인 레이던';
    return '홀란트의 굶주린 도시들';
  }

  // ================================================================ 독립이 두 해 빨라진다 — 이 판에서만 읽는 값
  var DUTCH = [22, 23, 24, 25];   // 브뤼즈 · 앤트워프 · 암스테르담 · 브뤼셀
  function shiftOf(id) {
    var l = G.DOMINION && G.DOMINION[id]; if (!l) return null;
    for (var i = 1; i < l.length; i++) if (l[i][1] === '네덜란드') return { y: l[i][0], m: l[i][2] || 1 };
    return null;
  }
  function mn(y, m) { return y * 12 + (m || 1) - 1; }
  (function hookDominion() {
    var D = G.Dominion; if (!D || D._dutch) return; D._dutch = true;
    var oOwner = D.ownerAt, oCh = D.changesIn, oLeader = D.leader;
    D.ownerAt = function (c, y, m) {
      var r = oOwner.apply(this, arguments); if (!early()) return r;
      var id = c && c.id != null ? c.id : c; if (DUTCH.indexOf(id) < 0) return r;
      var sh = shiftOf(id), t = mn(y, m); if (!sh) return r;
      return t >= mn(sh.y - K().shift, sh.m) && t < mn(sh.y, sh.m) ? '네덜란드' : r;
    };
    D.changesIn = function (y, m) {
      var out = oCh.apply(this, arguments); if (!early()) return out;
      out = out.filter(function (x) { var sh = shiftOf(x.c.id); return !(DUTCH.indexOf(x.c.id) >= 0 && sh && sh.y === y && sh.m === m && x.to === '네덜란드'); });
      DUTCH.forEach(function (id) { var sh = shiftOf(id); if (sh && sh.y - K().shift === y && sh.m === m) out.push({ c: G.CITY_DATA[id], from: oOwner(G.CITY_DATA[id], y, m), to: '네덜란드' }); });
      return out;
    };
    D.leader = function (n, y) {
      if (y == null) { var s = S(); y = s ? s.date.y : 1480; }
      if (n === '네덜란드' && early() && y >= 1575 && y < 1581) return oLeader.call(this, n, 1581);   // 오라녀 공 빌럼 1세
      return oLeader.apply(this, arguments);
    };
  })();
  (function hookRel() {
    var RL = G.Rel; if (!RL || RL._dutch) return; RL._dutch = true;
    var op = RL.powers;
    RL.powers = function (y) {
      var out = op.apply(this, arguments), s = S(); y = y || (s && s.date.y);
      if (!early() || !y || y < 1581 - K().shift || out.indexOf('NL') >= 0) return out;
      var p = G.RELATIONS.powers.NL; if (p && p.to && y >= p.to) return out;
      return G.RELATIONS.order.filter(function (k) { return k === 'NL' || out.indexOf(k) >= 0; });
    };
  })();
  function goEarly() {
    var b = st(); if (b.early) return;
    b.early = today();
    if (G.Rel && G.Rel.set) {
      G.Rel.set('ES', 'NL', -90, 1581, '네덜란드 독립 전쟁');
      G.Rel.set('EN', 'NL', 40, 1581, '오라녀 공을 돕는 잉글랜드');
    }
    G.State.log('암스테르담 운하의 밤 이야기가 홀란트에 퍼졌다. 망설이던 도시들이 오라녀 공의 깃발 아래 모인다. — 네덜란드의 독립이 두 해 빨라진다 (1581년 → 1579년)');
  }

  // ================================================================ 날마다 — 소식 (만난 사람만)
  DW.daily = function () {
    var s = S(), b = st(), out = []; if (!b || !b.met) return out;
    var t = today(), told = b.told, ha = aboard('halina'), ve = aboard('verberk');
    function news(key, ok, icon, text) { if (!told[key] && t >= NEWS_AT[key] && ok) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('tenth', true, 'coin', '【열 번째 동전】 알바 공이 물건을 팔 때마다 값의 열에 하나를 세금으로 걷기 시작했다. 암스테르담의 빵집과 술집이 항의하며 문을 닫았다.' + (ha ? ' 할리나가 장부를 덮으며 말한다. 「봐요, 베짱이가 또 곳간에 손을 넣었어요.」' : ''));
    news('briel', true, 'ship', '【브릴】 4월 1일, 바다거지 배 스물네 척이 마스 강 어귀의 작은 항구 브릴을 빼앗았다. 「4월 1일, 알바가 안경(브릴)을 잃었다」는 노래가 홀란트에 퍼진다.' + (b.side === 'free' ? ' 그 노래를 처음 부른 사람이 얀이라는 이야기도 있다.' : ''));
    news('haarlem', true, 'castle', '【하를럼 함락】 일곱 달을 버틴 하를럼이 끝내 성문을 열었다. 성벽 위에서 싸우던 여인들의 이야기가 오래 전해진다.');
    news('leiden', true, 'ship', '【레이던 해방】 10월 3일, 오라녀 공이 둑을 터뜨려 들판을 바다로 만들었다. 물길을 타고 온 바다거지 배들이 굶주린 레이던 시민에게 청어와 흰 빵을 나누었다.' + (ha ? ' 할리나가 갑판에서 청어 한 마리를 높이 들어 올리며 웃는다. 「개미의 겨울은 이렇게 나는 거예요!」' : ''));
    news('fury', true, 'skull', '【앤트워프의 약탈】 품삯을 받지 못한 에스파냐 군이 앤트워프를 사흘 동안 약탈했다. 죽은 사람이 칠천이 넘는다. 왕의 편이던 남쪽 도시들까지 등을 돌린다.' + (ve ? ' 페르베르크가 소식을 듣고 오래 말이 없다. 「…왕의 곳간이 비면, 왕의 군대도 베짱이가 되는군요.」' : ''));
    news('utrecht', true, 'handshake', '【위트레흐트 동맹】 홀란트·제일란트·위트레흐트를 비롯한 북쪽 주들이 한데 묶여 에스파냐에 끝까지 맞서기로 맹세했다.');
    if (!told.abjure && b.early && t >= NEWS_AT.abjure) {
      if (s.rel) { s.rel.seen = s.rel.seen || {}; s.rel.seen.hb_dutch = 1; }   // 본래 날(1581.7.26)의 소식은 다시 알리지 않는다 (js/data/relevents.js)
      else { s.rel = { seen: { hb_dutch: 1 } }; }
    }
    news('abjure', b.early, 'scroll', '【네덜란드의 독립 선언】 7월 26일, 북쪽 일곱 주가 펠리페 2세를 더는 군주로 섬기지 않겠다고 선언했다. 그 몇 해 전 암스테르담 운하 어귀에서 바다거지 배에 밀을 실어 보낸 밤이 있었다고들 한다. 오라녀 공 빌럼이 이끄는 싸움은 이제 독립 전쟁이다.' + (ha ? ' 할리나가 돛대 위로 주황·하양·파랑 깃발을 올린다.' : ''));
    news('willem', true, 'skull', '【빌럼의 죽음】 7월 10일, 델프트의 집 계단에서 오라녀 공 빌럼이 왕이 내건 현상금을 노린 자의 총에 쓰러졌다. 「하느님, 이 가엾은 백성을 불쌍히 여기소서」가 마지막 말이었다고 한다.');
    news('voc', true, 'ship', '【연합 동인도 회사】 네덜란드의 여러 무역 회사가 하나로 묶여 「연합 동인도 회사(VOC)」가 섰다. 누구나 주식을 사서 배와 장사에 몫을 걸 수 있다. 암스테르담은 이제 북해의 곳간이 아니라 세계의 곳간이 되려 한다.' + (ha ? ' 할리나가 장부를 펼치며 말한다. 「주식 한 장 사 둘까요? 이번엔 개미가 여럿이 함께 모으는 거예요.」' : ''));
    news('truce', true, 'handshake', '【열두 해 휴전】 에스파냐와 네덜란드가 열두 해 동안 싸움을 멈추기로 했다. 왕은 네덜란드를 사실상 독립한 나라로 대한다.' + (ve ? ' 페르베르크가 부채를 펴며 웃는다. 「개미와 베짱이가 한 탁자에 앉았네요. 겨울이 길었지요.」' : ''));
    return out;
  };

  // ================================================================ ① 여름의 노래
  function meetOpen() {
    var b = st(), t = today();
    if (!b || b.side || b.expired || cityNow() !== K().city || t < K().from || t > K().to) return false;
    return !b.met || (b.wait && since(b.asked) >= K().cool);
  }
  async function meet() {
    var b = st(), s = S(), first = !b.met;
    b.met = 1; b.asked = today(); b.wait = 0;
    if (first) {
      await withPic('dutch_summer', '여름의 노래 — 암스테르담', function () { return play([
        [null, '암스테르담 담 광장의 청어 시장. 소금물 냄새 사이로 젊은 남녀 여럿이 술통을 둘러싸고 언성을 높인다. 그 한가운데, 붉은 리본으로 머리를 묶은 아가씨 하나가 술통 위에 올라서 있다.'],
        [null, mood()],
        ['halina', '여러분, 개미와 베짱이 이야기 알죠? 여름 내 곡식을 모은 개미는 겨울을 나고, 노래만 부른 베짱이는 굶어 죽어요.'],
        ['pieter', '그래, 할리나. 그러니까 우리도 개미처럼 조용히 장사나 하자는 거야. 에스파냐 은화가 들어오는 한 우리 곳간은 차.'],
        ['halina', '피터르, 넌 이야기를 거꾸로 읽었어. 여름 내 북해에서 청어를 잡고, 배를 짓고, 발트해의 밀을 실어 나른 게 누구야? 우리야. 우리가 개미라고.'],
        ['halina', '그럼 베짱이는 누구냐고? 마드리드에서 노래나 부르면서 우리 곳간에 손을 넣어 물건마다 열 번째 동전을 걷어 가는 사람들이지!'],
        ['jan', '옳소! (류트를 튕기며) 「빌헬무스 판 나사우에, 나는 독일의 피를 받은—」'],
        ['halina', '얀, 너는 노래 좀 그만 불러. 너야말로 진짜 베짱이 같으니까.'],
        ['jan', '…베짱이도 겨울이 오면 칼을 든다고, 할리나.'],
        [null, '군중이 갈라진다. 검붉은 비단에 상아색 레이스을 단 아가씨가 하녀를 거느리고 걸어온다. 그 뒤로 붉은 띠를 맨 에스파냐 장교가 따른다.'],
        ['verberk', '재미있는 이야기네요, 할리나. 그런데 끝을 잊었어요. 겨울이 오면 베짱이는 누구 집 문을 두드리지요? 곳간이 가장 큰 집 — 왕의 집이에요.'],
        ['verberk', '흉년이 들면 발트해 밀값이 세 배로 뛰어요. 북해에 폭풍이 불면 청어 배가 돌아오지 않지요. 그때 우리를 먹여 살린 건 신대륙의 은을 가진 폐하였어요. 개미 혼자서는 겨울을 못 나요. 더 큰 개미집에 들어가야지요.'],
        ['dirk', '사촌 말이 맞아. 너희 노래꾼들이 왕의 군대를 이길 것 같아? 테르시오의 창끝 앞에서도 노래를 불러 보시지.'],
        ['halina', '디르크 판 페르베르크, 칼을 찼다고 다 개미는 아니야. 남의 곳간을 지키는 개는 될 수 있겠지만.'],
        ['pieter', '(할리나의 소매를 잡아끌며) 할리나, 그만해. 너 그러다 잡혀가. 우리… 우리 결혼하면 이런 일엔 끼지 말자.'],
        ['halina', '놔, 피터르. 청혼은 나중에 해. 지금 우린 겨울 이야기를 하는 중이야.'],
        ['halina', '거기, 바다 냄새 나는 제독님! ' + (spaniard() ? '에스파냐 깃발을 달았어도 바다를 아는 사람이죠? ' : '') + '당신 생각은 어때요? 개미는 제 곳간을 제 손으로 지켜야 해요, 아니면 더 큰 개미집에 들어가야 해요?'],
        ['verberk', '(부채를 접으며) 제독께서도 왕의 바다를 다니시는 분이지요. 신중하게 대답하세요.']
      ]); });
    } else {
      await play([
        [null, '담 광장 청어 시장. 오늘도 술통 둘레에 젊은이들이 모여 있다. ' + mood()],
        ['halina', '또 왔네요, 제독님! 대답은 들고 왔어요? 개미는 제 곳간을 지켜야 해요, 아니면 큰 개미집에 들어가야 해요?'],
        ['verberk', '조급하게 굴지 말아요, 할리나. 겨울은 천천히 오니까요. …그래도 대답은 듣고 싶네요, 제독.']
      ]);
    }
    var v = await UI.ask('개미와 베짱이 — 누구의 말에 손을 들어 줄까?', [
      { label: '할리나 — 개미는 제 곳간을 제 손으로 지킨다', value: 'free', icon: 'flag' },
      { label: '페르베르크 — 겨울에는 큰 곳간 곁이 든든하다', value: 'spain', icon: 'crown' },
      { label: '…아직은 모르겠다', value: 'wait' }], me());
    if (v === 'free') {
      b.side = 'free'; b.step = 1;
      await play([
        ['halina', '거봐요! 바다를 아는 사람은 다르다니까. …그럼 말로만 말고 손으로 보여 줘요.'],
        ['halina', besieged() + U.jx(besieged(), '이/가') + ' 굶고 있어요. 밀 ' + K().wheat + '만 있으면 한 달은 버텨요. 바다거지들 배가 달 없는 밤마다 운하 어귀로 와요. 밀을 싣고 이 항구로 와 줘요. 내가 거기서 기다릴게요.'],
        ['verberk', '…할리나, 그건 반역이에요. 제독께서도요. 그 운하를 지키는 게 디르크라는 걸 잊지 마세요.'],
        ['dirk', '(칼자루를 툭툭 두드리며) 기다리고 있겠소, 제독.']
      ]);
      G.State.log('암스테르담에서 할리나의 편에 섰다. 밀 ' + K().wheat + '을 싣고 오면 바다거지 배에 실어 ' + besieged() + '에 보내기로 했다.');
      UI.toast('할리나의 부탁 — 밀 ' + K().wheat + '을 싣고 암스테르담으로 (1575년 7월까지)', 'flag', 6000);
    } else if (v === 'spain') {
      b.side = 'spain'; b.step = 1;
      await play([
        ['verberk', '현명한 분이시네요. 겨울을 아는 분이에요.'],
        ['verberk', '거지당 배들이 바닷길을 막아서 이 도시 곳간이 비어 가요. 암스테르담이 굶으면 사람들은 할리나 같은 아이의 노래를 따라 부르겠지요. 밀 ' + K().wheat + '을 들여와 주세요. 우리 집 곳간을 열어 시민들에게 나눌 거예요. 왕의 곳간이 얼마나 든든한지 보여 줘야지요.'],
        ['halina', '흥, 남의 밀로 생색을 내겠다고요? 얀의 친구들이 가만있지 않을걸요.'],
        ['jan', '(류트 줄을 조이며) 제독, 바다는 넓은데 왜 굳이 개 집 곳간에 밀을 넣으려 하시오.']
      ]);
      G.State.log('암스테르담에서 페르베르크의 편에 섰다. 밀 ' + K().wheat + '을 싣고 오면 페르베르크 저택의 곳간을 열어 시민에게 나누기로 했다.');
      UI.toast('페르베르크의 부탁 — 밀 ' + K().wheat + '을 싣고 암스테르담으로 (1575년 7월까지)', 'crown', 6000);
    } else {
      b.wait = 1;
      await play([['halina', '겁쟁이! …농담이에요. 다음에 올 때는 대답을 들고 와요.'], ['verberk', '서두를 것 없어요. 겨울은 반드시 오니까요.']]);
      G.State.log('암스테르담 청어 시장에서 할리나와 페르베르크의 다툼을 들었다. 아직 누구의 편도 들지 않았다.');
      return;
    }
    refresh();
    if (DW.wheat() >= K().wheat) { await play([[null, '마침 짐칸에 밀이 넉넉하다. 일은 오늘 밤으로 정해졌다.']]); await granary(); }
    else UI.toast('밀은 어디서 사 와도 된다 — 암스테르담 시장에서 샀다면 항구를 나갔다가 다시 들어오면 된다', 'scroll', 5600);
  }

  // ================================================================ ② 곳간
  function runOpen() {
    var b = st(), t = today();
    return !!(b && b.side && b.step === 1 && !b.expired && cityNow() === K().city && t <= K().to && DW.wheat() >= K().wheat && (!b.lostAt || since(b.lostAt) >= K().cool));
  }
  async function granary() { return st().side === 'free' ? canal() : manor(); }
  /** 도시 안에서 뭍의 싸움 — 함대의 선원으로 (js/systems/mughal.js 와 같은 방식) */
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, n, false, Object.assign({ kind: 'garrison' }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  // 할리나 편 — 개미의 곳간
  async function canal() {
    var b = st(), s = S();
    await withPic('dutch_canal', '개미의 곳간 — 운하 어귀의 밤', function () { return play([
      [null, '달 없는 밤, 암스테르담 성벽 바깥 운하 어귀. 할리나가 등불을 외투로 가린 채 손짓한다. 갈대 사이로 낮고 납작한 배 한 척이 미끄러져 나온다.'],
      ['halina', '왔군요! 서둘러요. 자루를 저 배로 — 하나도 흘리지 말고.'],
      ['jan', '(낮은 목소리로) 거지 만세다, 제독. 이 밀이면 ' + besieged().replace(/^에스파냐 군에게 둘러싸인 /, '') + '의 아이들이 겨울을 나.'],
      [null, '밀 자루가 절반쯤 넘어갔을 때, 둑 위에서 횃불이 줄지어 켜진다. 창끝과 화승총 총구가 번뜩인다.'],
      ['dirk', '거기 서라! 왕의 이름으로 — 할리나, 결국 이럴 줄 알았지. 제독, 당신도 교수대에 함께 오르게 될 거요.'],
      ['halina', '디르크! 비켜. 이 밀은 굶는 사람들 거야. 네 왕의 곳간에 넣을 게 아니라고!']
    ]); });
    var r = await fight('디르크의 에스파냐 순찰대', K().patrol, { kind: 'garrison', guns: true, leader: '디르크 판 페르베르크' });
    if (r !== 'win') {
      takeWheat(K().wheat); b.lostAt = today();
      await play([
        ['dirk', '반역자들을 묶어라! …제독, 이번엔 목숨만은 살려 두지. 이 밀은 왕의 창고로 간다.'],
        [null, '바다거지 배는 빈 채로 어둠 속으로 달아났다. 할리나는 디르크의 병사들 손을 뿌리치고 골목으로 사라졌다.'],
        ['halina', '(이튿날 아침, 부두 기둥 뒤에서) 포기 안 해요. 개미는 곳간이 털려도 다시 모아요. 밀을 싣고 다시 와요.']
      ]);
      G.State.log('암스테르담 운하 어귀에서 디르크의 에스파냐 순찰대에 막혀 밀 ' + K().wheat + '을 빼앗겼다.');
      UI.toast('밀을 빼앗겼다 — 한 달쯤 뒤 다시 밀을 싣고 오면 된다', 'flag', 5200);
      refresh(); return;
    }
    takeWheat(K().wheat); b.step = 2;
    var bt = G.Fame ? G.Fame.add('bt', K().fameFree) : 0;
    if (spaniard()) crownTrust(-K().trust);
    await play([
      ['dirk', '(칼을 떨어뜨리고 무릎을 꿇은 채) …이걸로 끝이 아니야, 할리나. 왕의 군대는 너희가 여름 내 모은 개미 떼보다 많아.'],
      ['halina', '알아. 그래서 우리는 겨울 내내 모을 거야. 돌아가서 네 사촌한테 전해. 개미가 곳간 문을 잠갔다고.'],
      [null, '바다거지 배들이 밀을 싣고 어둠 속으로 사라진다. 멀리 물 위로 얀의 노래가 들려온다. 「빌헬무스 판 나사우에…」'],
      ['pieter', '(숨을 헐떡이며 달려와) 할리나! 무사해? …나, 사실 오늘 밤 반지를 가져왔어. 이제 이런 일은 그만두고 조용히 살자. 곡물 가게 안주인으로.'],
      ['jan', '(배에서 뛰어내리며) 피터르, 비켜. 할리나는 내 배에 탈 거야. 바다거지의 아내로!'],
      ['halina', '(웃음을 터뜨리며) 둘 다 고마워. 진심이야. 그런데 나, 누구 집 곳간지기가 되려고 술통 위에서 소리친 게 아니야.'],
      ['halina', '개미는 제 곳간을 제 손으로 지킨다고 했잖아요. 내 곳간은 이 도시가 아니라 바다에 있어요. …제독님, 당신 배에 자리 하나 있어요? 장부 셈이라면 암스테르담에서 내가 제일이에요.']
    ]);
    goEarly();
    G.State.log('암스테르담 운하 어귀에서 디르크의 순찰대를 물리치고 바다거지 배에 밀 ' + K().wheat + '을 실어 ' + besieged() + '에 보냈다. (전투 명성 +' + bt + ')');
    UI.toast('역사가 움직였다 — 네덜란드의 독립이 두 해 빨라진다 (1581년 → 1579년)', 'flag', 6500);
    await offer('halina');
    refresh();
  }
  // 페르베르크 편 — 왕의 곳간
  async function manor() {
    var b = st(), s = S();
    await withPic('dutch_manor', '왕의 곳간 — 페르베르크 저택', function () { return play([
      [null, '운하 옆 페르베르크 저택의 곳간. 하인들이 밀 자루를 나르고, 페르베르크가 장부를 들고 자루를 하나하나 센다.'],
      ['verberk', '…스물여덟, 스물아홉, 서른. 꼭 맞네요. 내일 아침 니콜라스 교회 앞에서 나눌 거예요. 폐하의 이름으로요.'],
      [null, '그때 곳간 문이 부서지는 소리. 해진 회색 외투 차림의 사내들이 몽둥이와 갈고리를 들고 몰려든다. 앞장선 사람은 류트 대신 단검을 쥔 얀이다.'],
      ['jan', '미안하오, 아가씨. 이 밀은 ' + besieged().replace(/^에스파냐 군에게 둘러싸인 /, '') + '로 가야 해. 제독, 비켜서시오! 당신과 싸울 생각은 없소.'],
      ['verberk', '(얼굴이 하얗게 질렸지만 물러서지 않고) 제독, 부탁해요. 이 곳간을 지켜 주세요.']
    ]); });
    var r = await fight('얀의 바다거지들', K().geuzen, { kind: 'bandit', leader: '얀' });
    if (r !== 'win') {
      takeWheat(K().wheat); b.lostAt = today();
      await play([
        [null, '바다거지들이 밀 자루를 짊어지고 운하로 사라졌다. 곳간 바닥에 흩어진 밀알만 남았다.'],
        ['verberk', '…곳간이 비었네요. 그래도 나는 포기하지 않아요. 겨울은 아직 오지 않았으니까요. 밀을 싣고 다시 와 주세요.']
      ]);
      G.State.log('암스테르담 페르베르크 저택의 곳간에서 얀의 바다거지들에게 밀 ' + K().wheat + '을 빼앗겼다.');
      UI.toast('밀을 빼앗겼다 — 한 달쯤 뒤 다시 밀을 싣고 오면 된다', 'crown', 5200);
      refresh(); return;
    }
    takeWheat(K().wheat); b.step = 2;
    var bt = G.Fame ? G.Fame.add('bt', K().fameSpain) : 0;
    crownTrust(K().trust);
    await play([
      ['jan', '…쳇. 베짱이도 겨울엔 칼을 든다더니, 개미 떼 앞에선 못 당하겠군. 할리나한테 전해 주쇼. 노래는 계속된다고.'],
      [null, '이튿날 아침, 니콜라스 교회 앞. 페르베르크의 하인들이 시민들에게 밀을 나누어 준다. 사람들이 모자를 벗고 「폐하 만세」를 외친다. 군중 맨 끝에서 할리나가 입술을 깨물고 서 있다.'],
      ['halina', '(제독에게 다가와) 당신은 왕의 개미가 됐군요. 좋아요. 그래도 우리 곳간은 우리가 지킬 거예요. 두고 봐요.'],
      ['dirk', '사촌, 이 일로 브뤼셀의 총독 각하께서도 너를 눈여겨보실 거야. 이제 마드리드 궁정에 가서 좋은 혼처를 —'],
      ['verberk', '디르크, 나는 혼처를 고르러 가는 게 아니에요. 왕의 곳간이 얼마나 큰지 이 눈으로 보고 싶어요. 세비야의 은 창고, 마닐라의 비단, 신대륙의 금광까지.'],
      ['verberk', '제독, 당신 배라면 그곳에 갈 수 있지요? 나는 역사와 예법, 에스파냐 말이라면 누구보다 잘 알아요. 왕의 궁정에서도 당신 편이 되어 드릴게요.']
    ]);
    G.State.log('암스테르담 페르베르크 저택의 곳간을 얀의 바다거지들로부터 지켜 내고 밀 ' + K().wheat + '을 시민에게 나누었다. (전투 명성 +' + bt + ' · 에스파냐 왕실의 신뢰)');
    UI.toast('왕의 곳간을 지켰다 — 역사는 그대로 흘러간다 (네덜란드 독립 1581년)', 'crown', 6000);
    await offer('verberk');
    refresh();
  }
  /** 동료로 맞을지 묻는다 — 미루면 암스테르담에서 기다린다 */
  async function offer(id) {
    var b = st(), m = G.MATE[id];
    var ok = await UI.confirm(m.name + U.jx(m.name, '을/를') + ' 동료로 맞이하겠습니까? (월급 금화 ' + U.num(m.wage) + '닢)', '동료로 맞이한다', '다음에');
    if (!ok) {
      b.offer = id;
      await play([[id, id === 'halina' ? '흥, 생각할 시간이 필요하다는 거죠? 좋아요. 이 항구에서 기다릴게요. 너무 늦으면 혼자 배를 사서 나갈 거예요.' : '서두르지 않으셔도 돼요. 저는 이 도시에서 기다릴게요. 겨울은 길거든요.']]);
      return false;
    }
    b.offer = null;
    var nm = G.Legend && G.Legend.join ? G.Legend.join(id, G.CITY_DATA[K().city]) : null;
    if (!nm && !row(id)) { var s = S(); s.mates.push({ id: id, role: 'none', joined: U.dateNum(s.date), loyal: 85 }); }
    b.joined = id;
    await play([[id, id === 'halina' ? '좋아요, 제독님. 개미의 곳간을 바다에 짓는 거예요. 그 첫 장부는 내가 쓸게요!' : '그럼, 왕의 바다로 가요. 큰 개미집이 얼마나 넓은지, 함께 보러요.']]);
    return true;
  }
  function offerOpen() {
    var b = st(); if (!b || !b.offer || cityNow() !== K().city || today() >= K().offerUntil) return false;
    return !row(b.offer) && !gone(b.offer);
  }
  async function offerAgain() {
    var b = st(), id = b.offer;
    await play([[id, id === 'halina' ? '왔네요, 제독님! 기다리다 목이 빠지는 줄 알았어요. 이번엔 대답해 줄 거죠?' : '다시 뵙네요, 제독. 이번에는 저를 데려가 주실 건가요?']]);
    await offer(id);
  }
  // 기한이 지났다 — 곳간 일은 끝나지 않았고 역사는 그대로
  function expire() { var b = st(); if (b && !b.expired && today() > K().to && (!b.side || b.step === 1)) b.expired = 1; }

  // ================================================================ 도시에 들어설 때 · 수첩
  DW.pending = function () { var s = S(); if (!s || cityNow() !== K().city) return false; expire(); return runOpen() || meetOpen() || offerOpen(); };
  DW.check = async function () {
    if (DW._busy) return false; DW._busy = true;
    try {
      if (runOpen()) await granary();
      else if (meetOpen()) await meet();
      else if (offerOpen()) await offerAgain();
    } catch (e) { console.error(e); }
    DW._busy = false;
    return true;
  };
  DW.html = function () {
    var s = S(), b = s && s.dutchwar; if (!b) return '';
    var li = [], t = today();
    if (b.side && b.step === 1 && !b.expired && t <= K().to)
      li.push('1575년 7월까지 밀 ' + K().wheat + '을 싣고 암스테르담으로 — ' + (b.side === 'free' ? '할리나와 바다거지들의 「개미의 곳간」' : '페르베르크 저택의 「왕의 곳간」') + ' (지금 ' + DW.wheat() + ')');
    if (b.offer && !row(b.offer) && !gone(b.offer) && t < K().offerUntil) li.push('암스테르담에서 ' + G.MATE[b.offer].name + U.jx(G.MATE[b.offer].name, '이/가') + ' 기다린다 — 동료로 맞으러');
    if (!li.length) return '';
    return '<div class="sep"></div><h4 style="margin:0 0 8px">개미와 베짱이 — ' + (b.side === 'spain' ? '왕의 곳간' : '개미의 곳간') + '</h4><ul>' + li.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._dutchHtml) { G.Court._dutchHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + DW.html(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._dutch) return;
    W._dutch = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(DW.daily()); } catch (e) { console.error(e); } return out; };
  })();
  DW._t = { meet: meet, canal: canal, manor: manor, offer: offer, goEarly: goEarly };
})(window.G = window.G || {});
