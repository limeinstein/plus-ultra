/* 도서관 서가 — 대항해시대 3처럼 책장에 꽂힌 책 가운데서 골라 읽는다.
   책등 색: 검정 = 읽은 책, 노랑(빛남) = 지금 읽을 수 있는 책, 빨강 = 아직 때가 이르거나(간행 전·아직 모르는 땅) 읽을 힘(언어·학문)이 모자란 책.
   가까이 가면(마우스·방향키) 제목과 지은이, 누르면 펼쳐서 제목과 내용 → 이 책과 관계된 능력을 가진 부하들과의 이야기.
   다시 읽을 때는 그때 함께 읽은 부하를 제독이 떠올리는 한마디로 넘어간다. 기록은 s.bookLog[책] = {y, m, w:[부하], g:{부하: 떠올릴 말}} */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city;
  var LB = C.B.library;
  function S() { return G.Game.state; }

  // ---------------------------------------------------------------- 책의 상태
  /** 이 도서관의 서가에 꽂힌 책 전부 (아직 나오지 않은 책은 빨간 책등으로) */
  LB.shelfBooks = function (c) { return G.BOOKS.filter(function (b) { return b.libs.indexOf(c.id) >= 0; }); };
  /** 지금 언어 실력으로 읽어 낼 수 있는 대목(발견물 id) — 늘 같은 순서라 실력이 늘면 대목이 늘어난다 */
  LB.readable = function (b) {
    var s = S(), lv = R.langRead(b.lang);
    var discs = b.discs.filter(function (id) { return G.DISC[id]; });
    var n = lv >= 3 ? discs.length : lv === 2 ? Math.ceil(discs.length * 0.7) : lv === 1 ? Math.ceil(discs.length * 0.35) : 0;
    var rng = U.makeRng(U.strHash(b.id + s.seed));
    return { all: discs, part: discs.slice().sort(function () { return rng() - 0.5; }).slice(0, n) };
  };
  function tally(ids) {
    var s = S(), o = { fresh: 0, known: 0, later: 0, laterIds: [] };
    ids.forEach(function (id) {
      if (s.hints[id] || G.Disc.foundByMe(id)) o.known++;
      else if (G.Disc.available(G.DISC[id])) o.fresh++;
      else { o.later++; o.laterIds.push(id); }
    });
    return o;
  }
  function langNm(b) { return G.LANGS[b.lang]; }
  /** 서가에서의 상태: kind = read(검정) · open(노랑) · again(노랑, 전에 읽었지만 새로 알아들을 대목이 생김) · lock(빨강), why = era·lang·skill·later */
  LB.shelfState = function (b) {
    var s = S(), y = s.date.y, read = !!s.flags['read_' + b.id];
    if ((b.y || 0) > y) return { kind: 'lock', why: 'era', read: read, text: '아직 쓰이지 않은 책 — ' + b.y + '년 무렵에야 나온다' };
    var lv = R.langRead(b.lang), L = langNm(b);
    if (!lv) return { kind: 'lock', why: 'lang', read: read, text: L + U.jx(L, '을/를') + ' 읽을 사람이 없다 — 제독이 배우거나, 그 말을 아는 부하를 데려오자' };
    if (b.sk && R.skillRead(b.sk) < (b.lv || 1)) {
      var sk = G.SKILL_BY_ID[b.sk].name;
      return { kind: 'lock', why: 'skill', read: read, text: sk + ' ' + (b.lv || 1) + '단계가 있어야 뜻을 푼다 — 제독이 배우거나, 그 학문을 아는 부하를 데려오자' };
    }
    var r = LB.readable(b), t = tally(r.part), rd = R.langBest(b.lang).who, by = rd ? ' · ' + L + U.jx(L, '은/는') + ' ' + rd + U.jx(rd, '이/가') + ' 읽어 준다' : '';
    if (t.fresh > 0) return { kind: read ? 'again' : 'open', read: read, t: t, text: (read ? '전에 읽은 책 — 이제는 새로 알아들을 대목이 있다' : '읽을 수 있다 — 새 단서가 있을지도 모른다') + by };
    if (read) return { kind: 'read', read: true, t: t, text: '읽은 책 — ' + recallShort(b) };
    if (t.later > 0 && t.known === 0) {
      var d = G.DISC[t.laterIds[0]], f = G.Frontier && G.Frontier.of(d);
      return { kind: 'lock', why: 'later', read: false, t: t, text: '아직 알려지지 않은 땅의 이야기뿐이다 — ' + (f ? '〈' + f.name + '〉에 관한 소문이 돌기 시작하면' : '세상을 더 알게 되면') + ' 뜻이 통한다' };
    }
    return { kind: 'open', read: false, t: t, text: (t.known ? '읽을 수 있다 — 이미 아는 이야기가 많다' : '읽을 수 있다') + by };
  };

  // ---------------------------------------------------------------- 부하들
  var SHORT = { rocco: '로코', duarte: '두아르테', pinzon_m: '마르틴', pinzon_v: '비센테', lacosa: '라 코사', ibnmajid: '이븐 마지드', hasan: '하산',
    leonardo: '레오나르도', michelangelo: '미켈란젤로', raffaello: '라파엘로', piri: '피리 레이스', leoafricanus: '레오', manuel: '마누엘', ahmad: '아흐마드' };
  function short(id) { if (SHORT[id]) return SHORT[id]; var d = G.MATE[id]; if (!d) return '그 사람'; var p = d.name.split(' '); return p[p.length - 1]; }
  LB.mateShort = short;
  function inFleet(id) { return S().mates.some(function (m) { return m.id === id; }); }
  function joinNames(ids) { return ids.map(short).join('·'); }
  function mateSpk(id) { var d = G.MATE[id]; return { name: d ? d.name : short(id), portrait: G.Scenes.mateSpec(id), lang: 3 }; }
  function meSpk() { var p = S().player; return { name: p.name, portrait: p.portrait }; }

  // 발견물의 갈래 → 그 이야기에 밝은 특기
  var CAT_SK = { geo: ['survey', 'nav'], nature: ['sci'], creature: ['sci'], ruin: ['hist'], treasure: ['craft', 'hist'], people: ['speech', 'hist', 'music'], trade: ['acct', 'cook'] };
  function topics(b) {
    var t = {};
    if (b.sk) t[b.sk] = (t[b.sk] || 0) + 3;
    b.discs.forEach(function (id) { var d = G.DISC[id]; if (!d) return; (CAT_SK[d.cat] || []).forEach(function (k, i) { t[k] = (t[k] || 0) + (i ? 0.5 : 1); }); });
    return t;
  }
  /** 부하 한 사람이 이 책에 할 말이 있는 까닭들 (점수 순) */
  function reasons(m, b, tp) {
    var out = [], rel = G.BOOK_REL[b.id] && G.BOOK_REL[b.id][m.id];
    if (rel) out.push({ k: 'rel', sc: 100, rel: rel });
    for (var k in tp) { var lv = R.mateSkill(m, k); if (lv > 0 && POOL[k]) out.push({ k: k, sc: tp[k] * 2 + lv * 3 + (k === b.sk ? 6 : 0) }); }
    var d = G.MATE[m.id], lg = d && d.lg ? d.lg[b.lang] || 0 : 0;
    if (lg >= 3) out.push({ k: 'lang', sc: 8 });
    return out.filter(function (r) { return r.sc >= 8; }).sort(function (a, c) { return c.sc - a.sc; });
  }
  /** 이야기에 낄 부하 (최대 3명, 되도록 서로 다른 까닭으로) */
  LB.speakers = function (b) {
    var tp = topics(b), cand = [];
    S().mates.forEach(function (m) { if (!G.MATE[m.id]) return; var rs = reasons(m, b, tp); if (rs.length) cand.push({ m: m, rs: rs }); });
    cand.sort(function (a, c) { return c.rs[0].sc - a.rs[0].sc; });
    var out = [], usedK = {};
    while (out.length < 3 && cand.length) {
      var best = null, bi = -1, br = null;
      cand.forEach(function (x, i) {
        x.rs.forEach(function (r) { var sc = r.sc - (usedK[r.k] ? 7 : 0); if (!best || sc > best) { best = sc; bi = i; br = r; } });
      });
      if (bi < 0 || best < 4) break;
      out.push({ id: cand[bi].m.id, r: br }); usedK[br.k] = 1; cand.splice(bi, 1);
    }
    return out;
  };

  // 까닭별 대사: [대사, 다시 읽을 때 떠올리는 말, {D}로 입에 올려도 되는 발견물 갈래(없으면 그 특기의 기본 갈래)].
  // {T} 책 이름, {A} 지은이, {D} 발견물, {R} 그 고장, {L} 책의 말. {A:은/는}처럼 조사를 붙인다
  var POOL = {
    survey: [
      ['이 책에 적힌 거리와 방위를 해도에 옮겨 보겠습니다. {D} 대목만 제대로 옮겨도 해도의 빈자리를 하나 채울 수 있겠군요.', '{D} 대목을 해도에 옮겨 보겠다고 했었지', ['geo']],
      ['{A:은/는} 옛 자료를 그대로 옮긴 곳이 많습니다. 위도는 믿되 경도는 한 번 더 재 봅시다.', '위도는 믿되 경도는 다시 재 보자고 했었지'],
      ['지명이 옛 이름이라 헷갈리는군요. 지금 뱃사람들이 부르는 이름으로 바꿔 적어 두겠습니다.', '옛 지명을 지금 이름으로 바꿔 적어 두겠다고 했었지'],
      ['{R}의 해안선이 이 책대로라면 지금 해도와는 꽤 다릅니다. 어느 쪽이 맞는지는 가 봐야 알겠지요.', '{R}의 해안선이 해도와 다르다고 했었지', ['geo', 'ruin', 'nature']]
    ],
    nav: [
      ['이런 책은 바람 이야기부터 봅니다. 계절풍이 언제 바뀌는지만 알아도 뱃길의 반은 간 셈이지요.', '바람이 바뀌는 때부터 보라고 했었지'],
      ['{R} 쪽으로 간다면 물과 식량을 넉넉히 실어야겠습니다. 책에 나오는 항구 사이가 생각보다 멉니다.', '{R} 쪽은 보급을 넉넉히 하자고 했었지', ['geo', 'trade', 'ruin']],
      ['배를 몰아 본 사람이 쓴 글인지 아닌지는 금방 압니다. 뱃길 대목만큼은 믿어도 좋겠군요.', '뱃길 대목만큼은 믿어도 좋다고 했었지']
    ],
    hist: [
      ['{A:은/는} 들은 이야기와 제 눈으로 본 것을 가려 쓰지 않았습니다. 둘을 나눠 읽어야 합니다.', '들은 이야기와 본 것을 나눠 읽으라고 했었지'],
      ['{D} 이야기가 여기도 나오는군요. 옛 기록이 이렇게 또렷하다면 폐허라도 남아 있을 겁니다.', '{D}의 자취가 남아 있을 거라고 했었지', ['ruin']],
      ['같은 이야기가 다른 옛 기록에도 나옵니다. 두 책이 서로 모르고 썼다면, 참말일 공산이 크지요.', '다른 옛 기록과 맞춰 보자고 했었지'],
      ['이 책이 쓰인 때를 생각하며 읽어야 합니다. {A:이/가} 살던 시절의 세상은 지금과 사뭇 달랐지요.', '지은이가 살던 시절을 생각하며 읽으라고 했었지'],
      ['{D} 대목은 그 고장 사람들이 대대로 전해 온 이야기일 겁니다. 가시거든 노인들에게 먼저 물어보십시오.', '{D} 이야기는 그 고장 노인들에게 물어보라고 했었지', ['people', 'treasure', 'ruin']]
    ],
    sci: [
      ['{D:이라니/라니}! 책의 설명은 엉성하지만 무언가 실제로 본 것을 적은 게 틀림없습니다. 제 눈으로 확인하고 싶군요.', '{D:을/를} 제 눈으로 확인하고 싶다고 했었지', ['creature', 'nature']],
      ['이 책의 자연 이야기는 절반은 관찰이고 절반은 소문입니다. 표본을 가져오면 가려낼 수 있지요.', '표본을 가져와 가려내자고 했었지'],
      ['{D} 대목을 보십시오. 이런 것이 정말 있다면 우리가 아는 자연의 이치를 고쳐 써야 할지도 모릅니다.', '{D} 때문에 자연의 이치를 고쳐 써야 할지 모른다고 했었지', ['creature', 'nature']]
    ],
    theo: [
      ['믿음이 다른 이들의 이야기라도 배울 것이 있습니다. 그곳 사람들을 대할 때 이 책의 말을 떠올리십시오.', '그곳 사람들을 대할 때 이 책의 말을 떠올리라고 했었지'],
      ['순례자들이 찾는 곳이 적혀 있군요. 성지로 가는 길에는 늘 사람과 물이 있기 마련입니다.', '순례자의 길을 따라가 보자고 했었지'],
      ['기적 이야기는 가려 들어야 합니다. 그래도 사람들이 무엇을 거룩하게 여기는지는 이 책이 잘 알려 주지요.', '사람들이 무엇을 거룩하게 여기는지 보라고 했었지']
    ],
    med: [
      ['약초 이야기가 많군요. 괴혈병에 듣는 것이 있는지 따로 적어 두겠습니다.', '괴혈병에 듣는 약초를 적어 두겠다고 했었지'],
      ['이 처방은 위험합니다. 양을 잘못 쓰면 약이 독이 되지요.', '처방의 양을 조심하라고 했었지']
    ],
    acct: [
      ['{D} 한 짐이면 값이 얼마나 나갈까요? 이 책에 적힌 게 사실이라면 큰 장사가 됩니다.', '{D:이/가} 큰 장사가 될 거라고 했었지', ['trade']],
      ['상인이라면 이 책의 시장 이야기부터 읽습니다. 무엇이 어디서 싸고 어디서 비싼지 다 들어 있지요.', '시장 이야기부터 읽으라고 했었지'],
      ['{R}의 물건값을 적어 둔 대목이 있군요. 오래된 값이지만, 무엇이 귀했는지는 지금도 크게 다르지 않을 겁니다.', '{R}에서 무엇이 귀했는지 눈여겨보라고 했었지', ['trade']]
    ],
    craft: [
      ['{D}의 솜씨를 적은 대목이 있군요. 진품이라면 한 번 손으로 만져 보고 싶습니다.', '{D}의 솜씨를 직접 보고 싶다고 했었지', ['treasure']],
      ['금은 세공 이야기가 나오면 저는 먼저 의심부터 합니다. 소문 속 보물은 늘 실물보다 크지요.', '소문 속 보물은 늘 실물보다 크다고 했었지']
    ],
    speech: [
      ['그곳 사람들의 인사와 예법이 적혀 있군요. 말 한마디로 싸움을 피할 수 있다면 이보다 값진 대목은 없지요.', '그곳 사람들의 예법을 익혀 두자고 했었지'],
      ['{D} 이야기를 보니, 그 사람들과는 서두르지 말고 선물부터 건네는 게 좋겠습니다.', '{D:과/와}는 선물부터 건네라고 했었지', ['people']]
    ],
    lang: [
      ['이건 제 고향 말로 쓴 책입니다. 옮긴 글로는 이 맛이 안 나지요. 어려운 대목은 제가 풀어 드리겠습니다.', '{L}로 된 어려운 대목을 풀어 주었었지'],
      ['{L}로 쓴 책을 여기서 보다니 반갑군요. 말투가 아주 옛것이라 요즘 사람들은 잘 못 읽습니다.', '옛 {L} 말투를 풀어 주었었지']
    ]
  };
  var OPEN = ['{T:을/를} 덮었다. 다들 어떻게 읽었나?', '{T}… 함께 읽어 보니 어떤가?', '{T}, 자네들 생각은 어떤가?'];
  var CLOSE = ['좋아, {M}의 말을 새겨 두지.', '다들 고맙네. 다음 항해 때 이 이야기를 떠올리자.', '과연… 책 한 권에 바다 하나가 들어 있군.'];
  function fmt(t, v) {
    return t.replace(/\{(\w)(?::([^}]+))?\}/g, function (_, k, j) { var x = v[k] != null ? String(v[k]) : ''; return j ? x + U.jx(x, j) : x; });
  }
  function needs(t) { var o = {}; t.replace(/\{(\w)/g, function (_, k) { o[k] = 1; }); return o; }

  /** 첫 열람 뒤의 이야기: [[말하는 이, 대사], …]와 기록 */
  LB.talk = function (b, got) {
    var s = S(), sp = LB.speakers(b), lines = [], log = { w: [], g: {} };
    // 이야기에 쓸 발견물: 방금 얻은 단서가 먼저, 없으면 이미 아는 것 (아직 모르는 땅의 이름은 흘리지 않는다)
    var ds = got.slice();
    b.discs.forEach(function (id) { var d = G.DISC[id]; if (d && ds.indexOf(d) < 0 && (s.hints[id] || G.Disc.foundByMe(id))) ds.push(d); });
    var rng = U.makeRng(U.strHash(b.id + ':' + s.day));
    var usedT = {}, usedD = [];
    sp.forEach(function (x, i) {
      var line = null, gist = null;
      if (x.r.k === 'rel') { line = x.r.rel[0]; gist = x.r.rel[1]; }
      else {
        // 대사마다 입에 올려도 되는 갈래의 발견물만 쓴다 (측량사는 지리, 학자는 유적, 과학자는 생물…)
        var k = x.r.k, opts = [];
        POOL[k].forEach(function (p, pi) {
          var n = needs(p[0] + p[1]), d = null;
          if (n.D || n.R) {
            var fit = ds.filter(function (q) { return (p[2] || []).indexOf(q.cat) >= 0 && (!n.R || (q.reg != null && G.REGIONS[q.reg])); });
            d = fit.filter(function (q) { return usedD.indexOf(q) < 0; })[0] || fit[0] || null;
            if (!d) return;
          }
          opts.push({ p: p, pi: pi, d: d });
        });
        var fresh = opts.filter(function (o) { return !usedT[k + o.pi]; });
        if (fresh.length) opts = fresh;
        if (!opts.length) return;
        // 발견물을 입에 올리는 대사를 조금 더 자주
        var wsum = 0; opts.forEach(function (o) { o.w = o.d ? 1.6 : 1; wsum += o.w; });
        var r0 = rng() * wsum, o = opts[opts.length - 1];
        for (var oi = 0; oi < opts.length; oi++) { r0 -= opts[oi].w; if (r0 <= 0) { o = opts[oi]; break; } }
        usedT[k + o.pi] = 1; if (o.d) usedD.push(o.d);
        var p = o.p, d = o.d;
        var v = { T: b.name, A: b.authorShort || b.author || '지은이', L: langNm(b), D: d ? d.name : null, R: d && d.reg != null ? G.REGIONS[d.reg] : null };
        line = fmt(p[0], v); gist = fmt(p[1], v);
      }
      lines.push([mateSpk(x.id), line]);
      log.w.push(x.id); log.g[x.id] = gist;
    });
    var me = meSpk();
    if (lines.length) {
      lines.unshift([me, fmt(OPEN[Math.floor(rng() * OPEN.length)], { T: b.name })]);
      lines.push([me, fmt(CLOSE[Math.floor(rng() * CLOSE.length)], { M: short(log.w[0]) })]);
    } else if (s.mates.length) {
      lines.push([me, '동료들에게 물어보았지만 이 책에 밝은 이는 없군. 이런 방면에 밝은 사람을 찾아봐야겠어.']);
    } else {
      lines.push([me, fmt('{T:을/를} 혼자 읽었다. 이런 책을 함께 풀어 볼 동료가 있으면 좋을 텐데.', { T: b.name })]);
    }
    return { lines: lines, log: log };
  };
  function whenOf(L) { return L.y + '년 ' + L.m + '월'; }
  function recallShort(b) {
    var L = S().bookLog && S().bookLog[b.id];
    if (!L) return '줄거리는 대강 기억난다';
    return whenOf(L) + (L.w.length ? ', ' + joinNames(L.w) + U.jx(joinNames(L.w), '과/와') + ' 함께' : ', 혼자') + ' 읽었다';
  }
  /** 다시 읽을 때 제독이 떠올리는 말 */
  LB.recall = function (b) {
    var L = S().bookLog && S().bookLog[b.id];
    if (!L) return b.name + '… 전에 읽은 책이다. 줄거리는 대강 기억난다.';
    if (!L.w.length) return whenOf(L) + '에 혼자 읽은 책이다. 줄거리는 대강 기억난다.';
    var who = joinNames(L.w), first = L.w[0], nm = short(first), gist = L.g && L.g[first];
    var txt = whenOf(L) + '에 ' + who + U.jx(who, '과/와') + ' 함께 읽은 책이다.' + (gist ? ' ' + nm + U.jx(nm, '이/가') + ' ' + gist + '.' : '');
    var gone = L.w.filter(function (id) { return !inFleet(id); });
    if (gone.length) txt += ' ' + joinNames(gone) + '도 이제는 곁에 없구나.';
    return txt;
  };

  // ---------------------------------------------------------------- 읽기
  /** 한 번 읽는다: 하루가 지나고 읽어 낸 대목에서 단서를 얻는다 */
  function readOnce(b) {
    var s = S();
    G.Game.passDays(1); G.Game.refreshHud();
    var r = LB.readable(b), got = [];
    r.part.forEach(function (id) { if (G.Disc.addHint(id, 'book:' + b.id)) got.push(G.DISC[id]); });
    var later = r.part.filter(function (id) { return !s.hints[id] && !G.Disc.foundByMe(id) && !G.Disc.available(G.DISC[id]); }).length;
    var known = r.part.filter(function (id) { return got.indexOf(G.DISC[id]) < 0 && (s.hints[id] || G.Disc.foundByMe(id)); }).length;
    s.flags['read_' + b.id] = 1;
    return { got: got, later: later, known: known, missed: r.all.length - r.part.length };
  }
  function metaLine(b) {
    var lb = R.langBest(b.lang), bits = [langNm(b) + ' ' + C.langPips(lb.lv) + (lb.who ? ' (' + lb.who + ')' : '')];
    bits.push(b.y > 1480 ? b.y + '년 무렵' : '옛 책');
    if (b.sk) bits.push(G.SKILL_BY_ID[b.sk].name + ' ' + (b.lv || 1));
    return bits.join(' · ');
  }
  /** 펼친 책: 왼쪽 쪽 = 제목·지은이, 오른쪽 쪽 = 내용, 아래 = 얻은 단서 */
  function openBook(b, res, note) {
    var gain = '';
    if (res) {
      var notes = [];
      if (res.known) notes.push('이미 아는 이야기 ' + res.known + '곳');
      if (res.missed) notes.push(langNm(b) + '가 서툴러 놓친 대목 ' + res.missed + '곳');
      if (res.later) notes.push('먼 나라 이야기라 아직 알아듣기 어려운 대목 ' + res.later + '곳');
      gain = '<div class="bgain parch">' + (res.got.length ?
        '<div class="gh">이 책에서 얻은 단서</div>' + res.got.map(function (d) { return '<div class="hint-item"><div class="nm">' + U.esc(d.name) + ' <span class="tag">' + G.DISC_CATS[d.cat] + '</span></div><div class="tx">' + U.esc(d.hint) + '</div></div>'; }).join('') :
        '<div class="gh">새로 알게 된 것은 없었다.</div>') +
        (notes.length ? '<div class="muted gn">' + notes.join(' · ') + '</div>' : '') + '</div>';
    }
    var html = '<div class="obook">' +
      '<div class="pg l"><div class="orn">✦ ✦ ✦</div><div class="bt">' + U.esc(b.name) + '</div><div class="ba">' + U.esc(b.author || '지은이 모름') + ' 지음</div>' +
      '<div class="bm">' + metaLine(b) + '</div><div class="orn low">✦</div></div>' +
      '<div class="pg r"><div class="tx">' + U.esc(b.text || b.title) + '</div></div></div>' + gain +
      (note ? '<div class="bnote">' + note + '</div>' : '');
    return UI.window({ title: b.title, icon: 'book', width: 1000, parch: false, html: html, buttons: [{ label: '책을 덮는다', value: 1, cls: 'navy' }] }).result;
  }
  /** 빨간 책: 표지만 보고 까닭을 듣는다 */
  function lockedBook(b, st) {
    var era = st.why === 'era';
    var html = '<div class="bshut"><div class="spine lock"></div><div><div class="bt">' + U.esc(b.name) + '</div><div class="ba">' + U.esc(b.author || '지은이 모름') + (era ? '' : ' 지음') + '</div>' +
      '<div class="bm">' + metaLine(b) + '</div><div class="why">' + U.esc(st.text) + '</div></div></div>';
    return UI.window({ title: era ? '아직 때가 이르다' : '지금은 읽을 수 없다', icon: 'book', width: 700, clickAny: true, html: html, buttons: [{ label: '책장에 도로 꽂는다', value: 1 }] }).result;
  }
  /** 서가에서 책 한 권을 골랐을 때 */
  LB.pick = async function (c, b) {
    var s = S(), st = LB.shelfState(b);
    if (st.kind === 'lock') { await lockedBook(b, st); return; }
    if (st.kind === 'read') {
      await openBook(b, null, '다시 훑어보았다. (날은 지나지 않는다)');
      await UI.say(LB.recall(b), meSpk());
      return;
    }
    var first = !st.read;
    var res = readOnce(b);
    await openBook(b, res, '읽는 데 하루가 걸렸다.');
    // 이야기하는 동안 무슨 책에서 무엇을 읽었는지 위에 붙여 둔다
    var unpin = UI.pin('<div class="pn-t">' + G.icon('book') + ' 읽은 책 — <b>' + U.esc(b.title) + '</b> <span class="muted">(' + U.esc(b.author || '') + ')</span></div>' +
      (res.got.length ? '<div class="pn-g">얻은 단서: ' + res.got.map(function (d) { return '<b>' + U.esc(d.name) + '</b>'; }).join(' · ') + '</div>' : '<div class="pn-g muted">새로 알게 된 단서는 없었다' + (res.known ? ' (이미 아는 이야기 ' + res.known + '곳)' : '') + '</div>'));
    try {
      if (first) {
        var t = LB.talk(b, res.got);
        s.bookLog = s.bookLog || {};
        s.bookLog[b.id] = { y: s.date.y, m: s.date.m, w: t.log.w, g: t.log.g };
        await UI.talk(t.lines);
      } else {
        await UI.say(LB.recall(b) + (res.got.length ? ' 그때는 몰랐던 대목이 이제는 눈에 들어온다.' : ''), meSpk());
      }
    } finally { unpin(); }
  };

  // ---------------------------------------------------------------- 서가 화면
  var FILL = ['#5a4332', '#4b3a2a', '#3f4a3a', '#4a3a44', '#53463a', '#3d4652', '#5b4a2e', '#46302a'];
  /** 책장 세 칸에 책등을 늘어놓는다 (도시마다 늘 같은 모양) */
  function layout(c, books) {
    var rng = U.makeRng(U.strHash('shelf:' + c.id)), ROWS = 3, W = 1120, GAP = 2;
    var rows = [[], [], []];
    books.slice().sort(function (a, b) { return a.lang - b.lang || (a.y || 0) - (b.y || 0); }).forEach(function (b, i) { rows[i % ROWS].push(b); });
    return rows.map(function (rb) {
      var items = [], used = 0, per = Math.max(1, Math.floor((26 - rb.length) / (rb.length + 1)));
      function filler() { var w = 18 + Math.floor(rng() * 20); items.push({ w: w, h: 108 + Math.floor(rng() * 42), c: FILL[Math.floor(rng() * FILL.length)], band: rng() < 0.6 }); used += w + GAP; }
      rb.forEach(function (b) {
        var n = 1 + Math.floor(rng() * per * 1.6);
        for (var i = 0; i < n; i++) filler();
        var w = 34 + Math.floor(rng() * 10);
        items.push({ w: w, h: 128 + Math.floor(rng() * 22), b: b }); used += w + GAP;
      });
      // 넘치면 뒤쪽 채움 책부터 뺀다
      for (var k = items.length - 1; used > W && k >= 0; k--) if (!items[k].b) { used -= items[k].w + GAP; items.splice(k, 1); }
      // 남으면 눕혀 쌓은 책 한 무더기와 채움 책
      if (W - used > 130 && rng() < 0.6) { items.push({ stack: 2 + Math.floor(rng() * 3), w: 100 }); used += 100 + GAP; }
      while (W - used > 20) { var w2 = Math.min(W - used - GAP, 18 + Math.floor(rng() * 20)); if (w2 < 14) break; items.push({ w: w2, h: 108 + Math.floor(rng() * 42), c: FILL[Math.floor(rng() * FILL.length)], band: rng() < 0.6 }); used += w2 + GAP; }
      return items;
    });
  }
  function spineHtml(it, idx) {
    if (it.stack) {
      var h = '';
      for (var i = 0; i < it.stack; i++) h += '<i style="width:' + (86 + (i * 7) % 16) + 'px;background:' + FILL[(idx + i * 3) % FILL.length] + '"></i>';
      return '<div class="bstack">' + h + '</div>';
    }
    if (!it.b) return '<div class="bk fill' + (it.band ? ' band' : '') + '" style="width:' + it.w + 'px;height:' + it.h + 'px;--c:' + it.c + '"></div>';
    return '<div class="bk real" data-i="' + idx + '" style="width:' + it.w + 'px;height:' + it.h + 'px"><i class="lab"></i><i class="rib"></i></div>';
  }
  function posIn(e, root) { var x = 0, y = 0; while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return [x, y]; }
  LB.shelf = async function (c) {
    var books = LB.shelfBooks(c);
    if (!books.length) { await C.say(C.npc('librarian', '사서'), '안됐습니다만, 읽으실 만한 책이 없습니다.'); return; }
    var rows = layout(c, books), reals = [];
    var html = '<div class="bshelf-head"><span class="lg"><i class="bk read"></i>읽은 책</span><span class="lg"><i class="bk open"></i>읽을 수 있는 책</span><span class="lg"><i class="bk lock"></i>아직 읽을 수 없는 책</span>' +
      '<span class="cnt"></span></div><div class="bcase">';
    rows.forEach(function (items, ri) {
      html += '<div class="brow"><div class="bline">';
      items.forEach(function (it) { if (it.b) { it.row = ri; reals.push(it); } html += spineHtml(it, it.b ? reals.length - 1 : ri * 5 + items.indexOf(it)); });
      html += '</div><div class="bplank"></div></div>';
    });
    html += '<div class="btag hidden"></div></div><div class="bplate"></div>';
    var busy = false, focus = -1, hover = -1, api;
    function el(i) { return api.content.querySelector('.bk.real[data-i="' + i + '"]'); }
    function refresh() {
      var nOpen = 0;
      reals.forEach(function (it, i) {
        var st = LB.shelfState(it.b), e = el(i); it.st = st;
        e.className = 'bk real ' + (st.kind === 'again' ? 'open again' : st.kind) + (i === focus ? ' focus' : '');
        if (st.kind === 'open' || st.kind === 'again') nOpen++;
      });
      api.content.querySelector('.cnt').textContent = '서가의 책 ' + reals.length + '권 · 지금 읽을 수 있는 책 ' + nOpen + '권 · 읽는 데 하루';
      plate(hover >= 0 ? hover : focus);
    }
    function plate(i) {
      var p = api.content.querySelector('.bplate'), tag = api.content.querySelector('.btag');
      if (i < 0 || !reals[i]) { p.innerHTML = '<span class="muted">책에 가까이 가면 제목과 지은이가 보입니다. 눌러서 펼쳐 봅니다. (방향키로 고르고 Enter)</span>'; tag.classList.add('hidden'); return; }
      var it = reals[i], b = it.b, st = it.st || LB.shelfState(b), e = el(i);
      tag.innerHTML = '<b>' + U.esc(b.name) + '</b><span>' + U.esc(b.author || '지은이 모름') + '</span>';
      tag.className = 'btag ' + (st.kind === 'again' ? 'open' : st.kind);
      var cs = api.content.querySelector('.bcase'), q = posIn(e, cs), x = q[0] + e.offsetWidth / 2, y = q[1] - 18;
      tag.style.left = '0px'; tag.style.top = y + 'px';
      var tw = tag.offsetWidth, cw = cs.offsetWidth;
      tag.style.left = U.clamp(x - tw / 2, 6, cw - tw - 6) + 'px';
      p.innerHTML = '<span class="pk ' + (st.kind === 'again' ? 'open' : st.kind) + '"></span><b>' + U.esc(b.title) + '</b><span class="muted"> · ' + langNm(b) + '</span><br><span class="st">' + U.esc(st.text) + '</span>';
    }
    async function choose(i) {
      if (busy || !reals[i]) return;
      busy = true; focus = i;
      try { await LB.pick(c, reals[i].b); } catch (e) { console.error(e); }
      busy = false; hover = -1;
      if (api.content.isConnected) refresh();
    }
    function move(dx, dy) {
      if (!reals.length) return;
      if (focus < 0) focus = 0;
      else if (dx) focus = U.clamp(focus + dx, 0, reals.length - 1);
      else {
        var cur = reals[focus], row = cur.row + dy, x0 = el(focus).offsetLeft, best = -1, bd = 1e9;
        reals.forEach(function (it, i) { if (it.row !== row) return; var d = Math.abs(el(i).offsetLeft - x0); if (d < bd) { bd = d; best = i; } });
        if (best >= 0) focus = best;
      }
      hover = -1; refresh();
    }
    // reals는 줄 순서(위 칸 왼쪽부터)로 쌓였고 data-i도 같은 순서다 — 방향키 ←→는 이 순서를 따른다
    api = UI.window({ title: c.name + ' 도서관 — 서가', icon: 'book', width: 1240, parch: false, html: '', onKey: function (e) {
      if (busy) return false;
      if (e.key === 'ArrowLeft') { move(-1, 0); return true; }
      if (e.key === 'ArrowRight') { move(1, 0); return true; }
      if (e.key === 'ArrowUp') { move(0, -1); return true; }
      if (e.key === 'ArrowDown') { move(0, 1); return true; }
      if ((e.key === 'Enter' || e.key === ' ') && focus >= 0) { choose(focus); return true; }
      return false;
    } });
    api.el.classList.add('shelfwin');
    api.content.innerHTML = html;
    api.content.querySelectorAll('.bk.real').forEach(function (e) {
      var i = +e.getAttribute('data-i');
      e.addEventListener('mouseenter', function () { if (busy) return; hover = i; plate(i); });
      e.addEventListener('mouseleave', function () { if (busy) return; hover = -1; plate(focus); });
      e.addEventListener('click', function () { choose(i); });
    });
    refresh();
    return api.result;
  };
})(window.G = window.G || {});
