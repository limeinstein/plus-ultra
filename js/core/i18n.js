/* 다국어 (G.I18N · G.T · G.N) — 2026-11-12 사용자 요청 「영어·중국어(간체·번체)·일본어·베트남어·스페인어까지」
   ■ 원문(한국어)이 곧 열쇠다. 한국어로 할 때는 아무것도 바뀌지 않는다 — 번역이 없는 문장도 한국어 그대로 나온다.
   ■ 세 갈래로 옮긴다
     ① 화면 글자 자동 번역: #ui·불러오기 화면에 들어온 글자 마디(text node)와 title·placeholder·alt를 사전(text)에서 통째로 찾아 바꾼다.
        단추·제목·짧은 안내처럼 고정된 글은 코드를 고치지 않고 언어 파일에 한 줄 넣으면 된다.
        숫자가 섞인 글은 틀(pat: [정규식, 바꿀 글])로 — 예 ['^금화 ([\\d,]+)닢$', '$1 gold'].
     ② 값을 끼우는 문장: G.T('{city}에 처음으로 입항했다.', {city: c.name}) — 언어 파일에는 같은 원문을 열쇠로 '{city}...'를 쓴다.
        한국어 조사는 {city|이/가}처럼 적으면 받침에 맞춰 붙는다(다른 언어 번역에서는 값만 들어간다).
        끼운 값이 도시·교역품 이름이면 저절로 그 언어의 이름으로 바뀐다.
     ③ 고유 이름: G.N('리스본') → 'Lisbon'. 도시는 번호(city), 교역품은 id(good), 그 밖의 이름(나라·지역·종교…)은 한국어 이름(name)으로 찾는다.
   ■ 언어 파일: js/lang/언어.js — G.I18N.add('en', { text: {...}, pat: [...], city: {...}, good: {...}, name: {...} })
     index.html에서 이 파일 바로 뒤에 읽는다. 아직 비어 있는 언어(ready: false)는 고를 수는 있어도 「준비 중」으로 보인다.
   ■ 번역이 빠진 글 모으기: 한국어가 아닌 언어로 놀다 보면 옮기지 못한 한국어 글이 G.I18N.missing()에 모인다
     (tools/i18n_missing.js가 화면을 돌며 모아 파일로 낸다 — 다음 번역 거리).
   ■ 이 기기(브라우저)에만 기억한다: localStorage pu.lang — 저장 파일과는 상관없다.
     처음 연 사람: 웹판(http·https)이면 브라우저 언어가 준비된 언어일 때 그 언어로, 파일로 연 게임(개발·시험)은 한국어. */
(function (G) {
  'use strict';
  var I = G.I18N = {};
  var KEY = 'pu.lang';
  /* font: 이 언어로 할 때 --serif 앞에 둘 글꼴(구글 글꼴 css + 컴퓨터에 깔린 글꼴) — js/ui/display.js가 쓴다 */
  var GF = 'https://fonts.googleapis.com/css2?family=';
  var LATIN = { name: 'Noto Serif', css: GF + 'Noto+Serif:ital,wght@0,400;0,500;0,700;1,400&display=swap', stack: "'Noto Serif', 'Georgia', 'Times New Roman'" };
  I.LANGS = [
    { id: 'ko', label: '한국어', html: 'ko' },
    { id: 'en', label: 'English', html: 'en', font: LATIN },
    { id: 'zh-Hans', label: '简体中文', html: 'zh-Hans', font: { name: 'Noto Serif SC', css: GF + 'Noto+Serif+SC:wght@400;500;700&display=swap', stack: "'Noto Serif SC', 'Songti SC', 'SimSun', 'NSimSun'" } },
    { id: 'zh-Hant', label: '繁體中文', html: 'zh-Hant', font: { name: 'Noto Serif TC', css: GF + 'Noto+Serif+TC:wght@400;500;700&display=swap', stack: "'Noto Serif TC', 'Songti TC', 'PMingLiU', 'MingLiU'" } },
    { id: 'ja', label: '日本語', html: 'ja', font: { name: 'Noto Serif JP', css: GF + 'Noto+Serif+JP:wght@400;500;700&display=swap', stack: "'Noto Serif JP', 'Yu Mincho', 'YuMincho', 'Hiragino Mincho ProN', 'MS PMincho'" } },
    { id: 'vi', label: 'Tiếng Việt', html: 'vi', font: LATIN },
    { id: 'es', label: 'Español', html: 'es', font: LATIN }
  ];
  I.packs = {};          // 언어 → {text, pat, city, good, name, ready}
  I.miss = {};           // 옮기지 못한 한국어 글 → 본 횟수
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* 사생활 보호 창 */ } }
  I.info = function (id) { return I.LANGS.filter(function (l) { return l.id === id; })[0] || null; };
  /** 번역이 들어 있는 언어인가 (한국어는 언제나) */
  I.ready = function (id) { return id === 'ko' || !!(I.packs[id] && I.packs[id].ready); };
  I.lang = 'ko';
  I.isKo = function () { return I.lang === 'ko'; };

  /** 언어 파일이 부른다. 같은 언어를 여러 파일로 나눠 넣어도 된다(뒤의 것이 덧붙는다) */
  I.add = function (id, pack) {
    var p = I.packs[id] || (I.packs[id] = { text: {}, pat: [], city: {}, good: {}, name: {}, person: {}, ready: false });
    ['text', 'city', 'good', 'name'].forEach(function (k) { if (pack[k]) for (var x in pack[k]) p[k][norm(x)] = pack[k][x]; });
    if (pack.person) for (var gk in pack.person) { var pg = p.person[gk] || (p.person[gk] = {}); for (var px in pack.person[gk]) pg[norm(px)] = pack.person[gk][px]; }
    personIdx = null; trReset();
    if (pack.pat) pack.pat.forEach(function (r) { p.pat.push([new RegExp(r[0]), r[1]]); });
    if (pack.ready != null) p.ready = !!pack.ready;
    if (pack.pjoin) p.pjoin = pack.pjoin;   // 지어 낸 사람 이름을 잇는 법 — { gs: 이름·성 사이, sf: 성·이름 사이, combo: 앞말·뒷말 사이, num: 'C'(대를 한자 숫자+世로) } · 없으면 빈칸 하나
    nameIdx = null;
    if (id === I.lang && document.body) I.sweep(document.body);
  };

  // ---------------------------------------------------------------- 고유 이름
  var nameIdx = null;   // 한국어 이름 → 지금 언어의 이름 (도시·교역품 표를 한국어 이름으로 거꾸로 묶은 것 + name 표)
  function names() {
    var gn = (G.GOODS || []).length + (G.CITY_DATA || []).length;   // 나중에 더해지는 교역품·도시(시대 교역품 등)도 묶이게 — 수가 바뀌면 다시 묶는다 (2026-11-12)
    if (nameIdx && nameIdx.lang === I.lang && nameIdx.n === gn) return nameIdx.map;
    var p = I.packs[I.lang], m = {};
    if (p) {
      (G.CITY_DATA || []).forEach(function (c) { if (c && p.city[c.id] != null && m[c.name] == null) m[c.name] = p.city[c.id]; });
      (G.GOODS || []).forEach(function (g) { if (g && p.good[g.id] != null && m[g.name] == null) m[g.name] = p.good[g.id]; });
      for (var k in p.name) m[k] = p.name[k];
    }
    nameIdx = { lang: I.lang, map: m, ok: !!(G.CITY_DATA && G.GOODS), n: gn }; trReset();
    if (!nameIdx.ok) { var keep = nameIdx; nameIdx = null; return keep.map; }   // 자료를 다 읽기 전이면 다음에 다시 묶는다
    return m;
  }
  /** 고유 이름 하나: G.N('리스본') → 'Lisbon' (모르면 그대로) */
  G.N = function (ko) {
    if (I.lang === 'ko' || ko == null) return ko;
    var k = norm(String(ko)), pm = persons(), v = pm && pm[k];
    if (v != null) return v;
    v = names()[k]; if (v != null) return v;
    v = k.length <= 24 && HANGUL.test(k) ? personGuess(k) : null;
    return v != null ? v : ko;
  };

  // ---------------------------------------------------------------- 게임이 지은 사람 이름 (철새 항해사·고장 사람·원주민 동료)
  /* 한국어 이름 조각(G.WANDER_NATIONS의 이름·성, G.REGION_FOLK.pools, G.FOLK_JOIN)을 언어 파일의 person 표로 그 고장 표기로 옮긴다
     — person: { 'W:ES': {하비에르: 'Javier', …}, 'R:VN': {…}, F: {크로토아: 'Krotoa', …} } (tools/i18n/en/person_*.tsv)
     · 동아시아(성이 앞)는 그 차례대로 「Song Kang-ho」 · 뒤에 붙은 「2세」는 로마 숫자(II), 「 3」은 그대로
     · 지금 있는 동료·철새의 이름이면 이름 표(name)보다 먼저 — 같은 글자의 물건 이름(마카나 = 흑요석 칼 같은)과 겹칠 때 사람이 이긴다 */
  var personIdx = null;
  function persons() {
    var p = I.packs[I.lang]; if (!p || !p.person) return null;
    var st = G.Game && G.Game.state, wd = st && st.wander, sig = (G.MATES || []).length + ':' + (wd ? (wd.seq || 0) + ':' + wd.gen : '-') + ':' + (st ? st.date && st.date.y : '');
    if (personIdx && personIdx.lang === I.lang && personIdx.sig === sig) return personIdx.map;   // 동료 수·철새 번호가 그대로면 다시 묶지 않는다
    var list = [], defs = wd && wd.defs;
    (G.MATES || []).forEach(function (m) { if (m && m.name) list.push(m); });
    if (defs) for (var dk in defs) if (defs[dk] && defs[dk].name) list.push(defs[dk]);
    var map = {};
    list.forEach(function (m) { var k = norm(m.name); if (map[k] == null) { var e = personEn(k, p.person, m.nat, true); if (e != null) map[k] = e; } });
    personIdx = { lang: I.lang, sig: sig, map: map }; trReset();
    return map;
  }
  function personGuess(k) { var p = I.packs[I.lang]; return p && p.person ? personEn(k, p.person, null, false) : null; }
  function personEn(s, P, nat, any) {
    var m = /^(.+?) \(([^()]+)\)$/.exec(s);   // 「이름 (도시)」 — 고장 사람 이름이 모자랄 때
    if (m) { var b = personEn(m[1], P, nat, any); return b != null ? b + ' (' + G.N(m[2]) + ')' : null; }
    var base = s, suf = '';
    m = /^(.+?) (\d+)(세)?$/.exec(s);
    if (m) { base = m[1]; suf = m[3] && PJ('num') === 'C' ? hanNum(+m[2]) + '世' : ' ' + (m[3] ? roman(+m[2]) : m[2]); }
    var F = P.F || {};
    if (F[base] != null && (any || base.length >= 2 || suf)) return F[base] + suf;
    var W = G.WANDER_NATIONS || {}, R = (G.REGION_FOLK && G.REGION_FOLK.pools) || {}, r, k;
    if (nat && W[nat]) { r = wanderEn(base, W[nat], P['W:' + nat]); if (r != null) return r + suf; }
    for (k in W) { r = wanderEn(base, W[k], P['W:' + k]); if (r != null) return r + suf; }
    for (k in R) { r = poolEn(base, R[k], P['R:' + k]); if (r != null) return r + suf; }
    return null;
  }
  function pick2(s, firsts, seconds, sep, d) {   // s = 앞조각 + sep + 뒷조각 → [앞, 뒤]의 번역
    for (var i = 0; i < firsts.length; i++) {
      var a = firsts[i]; if (!a || s.indexOf(a + sep) !== 0) continue;
      var b = s.slice(a.length + sep.length);
      if (seconds.indexOf(b) >= 0 && d[a] != null && d[b] != null) return [d[a], d[b]];
    }
    return null;
  }
  function wanderEn(s, N, d) {
    if (!d || !N.people) return null;
    var gv = N.people.map(function (p) { return p[0]; }), sr = N.people.map(function (p) { return p[1]; }), r;
    if (N.order === 'sf') { r = pick2(s, sr, gv, N.sep || '', d); return r ? r[0] + PJ('sf') + r[1] : null; }
    r = pick2(s, gv, sr, ' ', d); return r ? r[0] + PJ('gs') + r[1] : null;
  }
  function poolEn(s, p, d) {
    if (!d) return null;
    var gv = (p.m || []).concat(p.f || []), r;
    if (p.order === 'mono') return gv.indexOf(s) >= 0 && d[s] != null ? d[s] : null;
    if (p.order === 'combo') { r = pick2(s, p.a || [], gv, ' ', d); return r ? r[0] + PJ('combo') + r[1] : null; }
    if (p.order === 'sf') { r = pick2(s, p.sur || [], gv, p.sep == null ? '' : p.sep, d); return r ? r[0] + PJ('sf') + r[1] : null; }
    r = pick2(s, gv, p.sur || [], ' ', d); return r ? r[0] + PJ('gs') + r[1] : null;
  }
  function PJ(k) { var p = I.packs[I.lang], j = p && p.pjoin; return j && j[k] != null ? j[k] : (k === 'num' ? '' : ' '); }
  function hanNum(n) { var d = '〇一二三四五六七八九'; if (n < 10) return d[n]; if (n < 20) return '十' + (n % 10 ? d[n % 10] : ''); if (n < 100) return d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : ''); return String(n); }   // ⟪C$2⟫: 한자 숫자(주앙 2세 → 若昂二世)
  function roman(n) { if (!(n > 0 && n < 40)) return String(n); var r = '', t = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; t.forEach(function (p) { while (n >= p[0]) { r += p[1]; n -= p[0]; } }); return r; }
  /** 「·」나 「, 」로 이은 이름들: '일본·동아시아' → 'Japan · East Asia' */
  var depth = 0;
  function one(x) {   // 이름 표 → 없으면 사전(text) → 틀(pat) — 틀 안에서 다시 틀을 부를 수 있지만 너무 깊이는 가지 않는다
    var v = G.N(x); if (v !== x) return v;
    var p = I.packs[I.lang], t = p && p.text[norm(x)]; if (t != null) return t;
    if (depth > 3 || !HANGUL.test(x)) return x;
    t = seg(x); if (t != null) return t;
    depth++; try { t = I.tr(x, true); } finally { depth--; }
    return t != null ? t.trim() : x;
  }
  /** 아는 문장을 이어 붙인 글: 문장 끝(. ! ? …)에서 나눠, 사전(text)에 있는 문장·문장 묶음으로 빈틈없이 덮이면 옮긴다
      (단서 여러 개를 줄바꿈으로 이은 대사처럼 — 틀이 붙잡은 글 안에서만 쓴다) */
  function seg(x) {
    var p = I.packs[I.lang]; if (!p) return null;
    var ss = (norm(x).match(/[^.!?…]+(?:[.!?…]+[」』”"')]*|$)/g) || []).map(function (a) { return a.trim(); }).filter(Boolean);
    if (ss.length < 2 || ss.length > 16) return null;
    var best = [[]];
    for (var i = 0; i < ss.length; i++) {
      if (!best[i]) continue;
      for (var j = i + 1; j <= ss.length; j++) {
        if (best[j]) continue;
        var k = ss.slice(i, j).join(' '), v = p.text[k];
        if (v == null) { var nm = G.N(k); if (nm !== k) v = nm; }
        if (v == null && j - i <= 3 && depth <= 3 && HANGUL.test(k)) { depth++; try { var q = I.tr(k, true); } finally { depth--; } if (q != null) v = q.trim(); }   // 숫자·이름이 든 문장은 틀로 (후원자 대사를 이어 붙인 글 끝의 「사례로 금화 #닢을…」 같은)
        if (v != null) best[j] = best[i].concat(v);
      }
    }
    return best[ss.length] ? best[ss.length].join(' ') : null;
  }
  I.names = function (x) {
    if (I.lang === 'ko') return x;
    var lead = /^\s*/.exec(x)[0], tail = /\s*$/.exec(x)[0];   // 붙잡은 조각의 앞뒤 빈칸(「 (사교 명성 −5)」)은 그대로 둔다
    if ((lead || tail) && x.trim()) { var w = I.names(x.trim()); if (lead && !/^\s/.test(w)) w = lead + w; if (tail && !/\s$/.test(w)) w += tail; return w; }
    var v = one(x); if (v !== x) return v;
    var dot = /\s*·\s*/.test(x), parts = dot ? x.split(/\s*·\s*/) : splitTop(x, ', ');   // 「, 」는 괄호 밖에서만 나눈다 (「이름(독일 포수, 뉘른베르크), …」)
    return parts.map(function (a) { return one(a.trim()); }).join(dot ? ' · ' : ', ');
  };
  /** 도시 이름 (도시 객체나 번호) */
  G.cityName = function (c) { if (typeof c === 'number') c = G.CITY_DATA && G.CITY_DATA[c]; if (!c) return ''; if (I.lang === 'ko') return c.name; var p = I.packs[I.lang]; return (p && p.city[c.id]) || c.name; };
  /** 교역품 이름 (id) */
  G.goodName = function (id) { var g = G.GOOD && G.GOOD[id]; if (!g) return id; if (I.lang === 'ko') return g.name; var p = I.packs[I.lang]; return (p && p.good[id]) || g.name; };

  // ---------------------------------------------------------------- 문장
  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  I.norm = norm;
  var HANGUL = /[가-힣]/;
  /** 값 끼우기: {이름} · {이름|을/를} (한국어만 조사) */
  function fill(s, vars, ko) {
    if (!vars) return s;
    return s.replace(/\{([\w$]+)(?:\|([^}]+))?\}/g, function (all, k, pair) {
      if (!(k in vars)) return all;
      var v = vars[k];
      if (v == null) v = '';
      if (!ko && typeof v === 'string') v = G.N(v);
      v = String(v);
      return ko && pair && G.U ? v + G.U.jx(v, pair) : v;
    });
  }
  /** G.T(한국어 원문, 값) — 지금 언어의 문장 */
  G.T = function (ko, vars) {
    if (ko == null) return '';
    if (I.lang === 'ko') return fill(String(ko), vars, true);
    var p = I.packs[I.lang], t = p && p.text[norm(ko)];
    if (t == null) { note(ko); return fill(String(ko), vars, true); }
    return fill(t, vars, false);
  };
  var missN = 0;
  function note(s) {   // 숫자는 #로 묶어 센다 (윗줄의 금화처럼 늘 바뀌는 글이 끝없이 쌓이지 않게)
    s = norm(s).replace(/\d[\d,.]*/g, '#'); if (!s || !HANGUL.test(s) || s.length > 4000) return;
    if (I.miss[s] == null) { if (missN >= 20000) return; missN++; I.miss[s] = 0; }
    I.miss[s]++;
  }
  /** 화면 글 한 마디를 옮긴다 — 바꿀 것이 없으면 null */
  /* 옮긴 결과를 기억한다 — 틀(pat)이 붙잡은 조각을 다시 이름·문장으로 옮기는 길(names → seg → tr)이 깊어지면
     긴 글(나라 지배 기록처럼 숫자·「·」가 많은 글)에서 같은 조각을 수만 번 다시 옮겨 몇 초씩 멈췄다 (2026-11-12)
     · 언어·사전·이름 표·사람 이름 표가 바뀌면 비운다 · 깊이마다 따로 (깊이에 따라 결과가 다르다) */
  var trCache = Object.create(null), trN = 0, NONE = {};
  function trReset() { trCache = Object.create(null); trN = 0; }
  I.tr = function (s, quiet) {
    if (I.lang === 'ko' || !s || !HANGUL.test(s)) return null;
    var p = I.packs[I.lang]; if (!p) return null;
    var ck = I.lang + depth + '\u0001' + s, cv = trCache[ck];
    if (cv !== undefined) { if (cv === NONE) { if (!quiet && depth === 0) note(norm(s)); return null; } return cv; }
    var r = trRaw(s, quiet, p);
    if (trN > 50000) trReset();
    trCache[ck] = r == null ? NONE : r; trN++;
    return r;
  };
  function trRaw(s, quiet, p) {
    var n = norm(s), t = p.text[n];
    if (t == null) { var gn = G.N(n); if (gn !== n) t = gn; }   // 이름 표 · 게임이 지은 사람 이름
    if (t == null) for (var i = 0; i < p.pat.length; i++) {
      var r = p.pat[i]; if (!r[0].test(n)) continue;
      var u = n.replace(r[0], r[1]).replace(/⟦([^⟧]*)⟧/g, function (a, x) { return I.names(x); }).replace(/⟪R(\d+)⟫/g, function (a, x) { return roman(+x); }).replace(/⟪C(\d+)⟫/g, function (a, x) { return hanNum(+x); }).replace(/⟪l⟫([\s\S]*?)⟪\/l⟫/g, function (a, x) { return x.toLowerCase(); });   // ⟪l⟫…⟪/l⟫: 번역의 {1:lc} — 문장 가운데 배 종류 이름은 소문자로
        // ⟦$1⟧: 붙잡은 글이 이름(· 로 이은 이름들)이면 옮긴다 · ⟪R$2⟫: 로마 숫자(군주의 대 — 아폰수 5세 → Afonso V)
      if (!HANGUL.test(u)) { t = u; break; }   // 옮긴 뒤에도 한국어가 남으면 옮기지 못한 것으로 친다
    }
    if (t == null && depth <= 3 && (n.indexOf(' · ') > 0 || n.indexOf(' / ') > 0)) t = joined(n);   // 「 · 」「 / 」로 이은 조각들 (도감 카드의 「육상 탐험 · 가치 120」처럼)
    if (t == null && depth <= 3) t = lined(s, n);   // 여러 줄(title의 \n) · 앞머리 「— 」「· 」를 떼고 옮긴다 (2026-11-13 영어 QA)
    if (t == null) { if (!quiet) note(n); return null; }
    var lead = /^\s*/.exec(s)[0], tail = /\s*$/.exec(s)[0];
    return lead + t + tail;
  }
  /* 줄마다 옮긴다: 줄바꿈이 든 글(수첩·선실의 title 풍선)은 줄마다, 한 줄이면 앞머리 「— 」「· 」「• 」를 떼고 — 모두 옮겨지면 같은 꼴로 다시 잇는다 */
  function lined(s, n) {
    var ls = String(s).split('\n');
    if (ls.length > 1 && ls.length <= 24) {
      var out = [];
      for (var i = 0; i < ls.length; i++) {
        var a = ls[i]; if (!HANGUL.test(a)) { out.push(a); continue; }
        depth++; try { var q = I.tr(a, true); } finally { depth--; }
        if (q == null) return null; out.push(q);
      }
      return out.join('\n');
    }
    var m = /^([—·•]\s?)(.+)$/.exec(n);
    if (m && HANGUL.test(m[2])) { depth++; try { var r = I.tr(m[2], true); } finally { depth--; } if (r != null) return m[1] + r.trim(); }
    return null;
  }
  /* 괄호·『』 밖의 「 / 」 다음 「 · 」에서 나눠 조각마다 옮기고, 모두 옮겨지면 같은 이음표로 다시 잇는다 — 하나라도 못 옮기면 null */
  function splitTop(s, sep) {
    var out = [], lv = 0, st = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '(' || c === '『' || c === '「' || c === '〔' || c === '[') lv++;
      else if ((c === ')' || c === '』' || c === '」' || c === '〕' || c === ']') && lv > 0) lv--;
      else if (lv === 0 && s.substr(i, sep.length) === sep) { out.push(s.slice(st, i)); st = i + sep.length; i += sep.length - 1; }
    }
    out.push(s.slice(st));
    return out;
  }
  function joined(n) {
    var seps = [' / ', ' · '];
    for (var k = 0; k < seps.length; k++) {
      var ps = splitTop(n, seps[k]); if (ps.length < 2) continue;
      var outp = [];
      for (var j = 0; j < ps.length; j++) { var q = ps[j].trim() ? one(ps[j].trim()) : ''; if (HANGUL.test(q)) return null; outp.push(q); }
      return outp.join(seps[k]);
    }
    return null;
  }
  /** 옮기지 못한 글 (많이 본 차례) */
  I.missing = function () { return Object.keys(I.miss).sort(function (a, b) { return I.miss[b] - I.miss[a]; }); };
  /** 대사·알림·창으로 들어온 통문장 가운데 옮기지 못한 것 */
  I.missingApi = function () { return Object.keys(I.missApi).sort(function (a, b) { return I.missApi[b] - I.missApi[a]; }); };

  // ---------------------------------------------------------------- 화면 글자 자동 번역
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 0, CODE: 1, CANVAS: 1 };
  var ATTRS = ['title', 'placeholder', 'alt', 'aria-label', 'label'];   // label: <optgroup>·<option>의 이름표
  function skipEl(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) { if (SKIP[e.tagName] || e.getAttribute('translate') === 'no' || (e.classList && e.classList.contains('no-i18n'))) return true; }
    return false;
  }
  function doText(node) {
    var v = node.nodeValue; if (!v || !HANGUL.test(v) || skipEl(node.parentNode)) return;
    var t = I.tr(v); if (t != null && t !== v) node.nodeValue = t;
  }
  function doAttrs(el) {
    if (!el.getAttribute || el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || (el.getAttribute('translate') === 'no' || (el.classList && el.classList.contains('no-i18n'))) || (el.parentNode && skipEl(el.parentNode))) return;   // 입력칸(INPUT·TEXTAREA)도 placeholder·title·aria-label은 옮긴다 (2026-11-13) — 안의 글만 건드리지 않는다
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute && el.getAttribute(ATTRS[i]); if (!a || !HANGUL.test(a)) continue;
      var t = I.tr(a); if (t != null && t !== a) el.setAttribute(ATTRS[i], t);
    }
  }
  /** 이 요소 아래의 글을 모두 옮긴다 */
  I.sweep = function (root) {
    if (I.lang === 'ko' || !root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    doAttrs(root);
    if (skipEl(root)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  };
  var obs = null;
  function watch() {
    if (obs || I.lang === 'ko' || !window.MutationObserver || !document.body) return;
    obs = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doAttrs(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) I.sweep(m.addedNodes[j]);
      }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    I.sweep(document.body);
  }

  // ---------------------------------------------------------------- 캔버스 글자 (해도·바다·육지의 도시 이름 같은 것)
  /* fillText·strokeText·measureText를 감싸 같은 사전으로 옮긴다 (폭을 재는 measureText도 옮겨야 이름표 크기가 맞는다). 한국어면 그대로 */
  var cCache = { lang: null, m: null };
  function ctr(t) {
    if (cCache.lang !== I.lang || !cCache.m) cCache = { lang: I.lang, m: new Map() };
    var v = cCache.m.get(t);
    if (v === undefined) { v = I.tr(t); if (v == null) v = t; if (cCache.m.size < 8000) cCache.m.set(t, v); }
    return v;
  }
  function hookCanvas() {
    var P = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype; if (!P || P._i18n) return; P._i18n = true;
    ['fillText', 'strokeText', 'measureText'].forEach(function (k) {
      var f = P[k]; if (!f) return;
      P[k] = function (t) {
        if (I.lang !== 'ko' && typeof t === 'string' && HANGUL.test(t)) { var a = Array.prototype.slice.call(arguments); a[0] = ctr(t); return f.apply(this, a); }
        return f.apply(this, arguments);
      };
    });
  }

  // ---------------------------------------------------------------- 대사·알림·창 (js/ui/ui.js) — 통째로 옮긴다
  /* 대사창은 글을 낱말·강조 단위로 쪼개 그리므로(UI.say → speech) 화면 글자 자동 번역으로는 문장을 통째로 찾지 못한다.
     그래서 UI.say·ask·toast·alert·confirm·choose·cmdMenu·window(제목·단추)에 들어오는 글을 그리기 전에 통째로 옮긴다.
     옮기지 못한 통문장은 I.missApi에 모인다 (조각이 아니라 문장 그대로 — 번역할 거리는 이쪽이 먼저) */
  I.missApi = {};
  var missApiN = 0;
  function noteApi(s) {
    s = norm(s).replace(/\d[\d,.]*/g, '#'); if (!s || !HANGUL.test(s) || s.length > 6000) return;
    if (I.missApi[s] == null) { if (missApiN >= 20000) return; missApiN++; I.missApi[s] = 0; }
    I.missApi[s]++;
  }
  /** 통문장 하나 (태그가 섞여도 된다) — 옮기지 못하면 원문 */
  I.tx = function (s) {
    if (I.lang === 'ko' || typeof s !== 'string' || !HANGUL.test(s)) return s;
    var t = I.tr(s, true);
    if (t == null) { noteApi(s); return s; }
    return t;
  };
  function txPages(text) {
    if (Array.isArray(text)) return text.map(txPages);
    if (typeof text !== 'string') return text;
    return text.split('\f').map(I.tx).join('\f');
  }
  function txList(list) {
    if (!Array.isArray(list)) return list;
    return list.map(function (o) {
      if (typeof o === 'string') return I.tx(o);
      if (!o || typeof o !== 'object') return o;
      var c = {}; for (var k in o) c[k] = o[k];
      ['label', 'right', 'desc', 'sub', 'title', 'text'].forEach(function (k) { if (typeof c[k] === 'string') c[k] = I.tx(c[k]); });
      return c;
    });
  }
  function txOpts(o, keys) {
    if (!o || typeof o !== 'object') return o;
    var c = {}; for (var k in o) c[k] = o[k];
    keys.forEach(function (k) { if (typeof c[k] === 'string') c[k] = I.tx(c[k]); });
    if (c.buttons) c.buttons = txList(c.buttons);
    return c;
  }
  function hookUI() {
    var UI = G.UI; if (!UI || UI._i18n) return; UI._i18n = true;
    function wrap(name, fn) { var f = UI[name]; if (typeof f !== 'function') return; UI[name] = function () { return I.lang === 'ko' ? f.apply(this, arguments) : fn.call(this, f, arguments); }; }
    wrap('say', function (f, a) { return f.call(this, txPages(a[0]), a[1]); });
    wrap('ask', function (f, a) { return f.call(this, txPages(a[0]), txList(a[1]), a[2]); });
    wrap('toast', function (f, a) {   // 갈래(큰 일·여느 소식…)는 원문(한국어)으로 가른다
      var o = a[3] || {}; if (!o.tier && UI.toastTier) { var c = {}; for (var k in o) c[k] = o[k]; c.tier = UI.toastTier(a[0], a[1], a[2], o); o = c; }
      return f.call(this, I.tx(a[0]), a[1], a[2], o);
    });
    wrap('alert', function (f, a) { return f.call(this, I.tx(a[0]), I.tx(a[1])); });
    wrap('confirm', function (f, a) { return f.call(this, I.tx(a[0]), I.tx(a[1]), I.tx(a[2]), I.tx(a[3])); });
    wrap('choose', function (f, a) { return f.call(this, I.tx(a[0]), txList(a[1]), txOpts(a[2], ['text', 'head'])); });
    wrap('cmdMenu', function (f, a) { return f.call(this, I.tx(a[0]), I.tx(a[1]), txList(a[2]), a[3]); });
    wrap('window', function (f, a) {   // 창의 본문(html)은 통째로 사전에 있을 때만 — 없으면 화면 글자 자동 번역에 맡긴다
      var o = txOpts(a[0], ['title']); if (o && typeof o.html === 'string' && HANGUL.test(o.html)) { var t = I.tr(o.html, true); if (t != null) o.html = t; }
      return f.call(this, o);
    });
  }

  // ---------------------------------------------------------------- 날짜·위경도·방위 (util.js)
  function wrapUtil() {
    var U = G.U; if (!U || U._i18n) return; U._i18n = true;
    var fd = U.fmtDate, fla = U.fmtLat, flo = U.fmtLon, dn = U.dirName;
    U.fmtDate = function (dt) { return I.lang === 'ko' ? fd(dt) : fill(G.T('{y}년 {m}월 {d}일'), { y: dt.y, m: dt.m, d: dt.d, mon: G.T(dt.m + '월') }, false); };   // mon: 달 이름 (언어 파일의 '1월'…'12월')
    U.fmtLat = function (lat) { return I.lang === 'ko' ? fla(lat) : fill(G.T(lat >= 0 ? '북위 {v}°' : '남위 {v}°'), { v: Math.abs(lat).toFixed(1) }, false); };
    U.fmtLon = function (lon) { return I.lang === 'ko' ? flo(lon) : fill(G.T(lon >= 0 ? '동경 {v}°' : '서경 {v}°'), { v: Math.abs(lon).toFixed(1) }, false); };
    U.dirName = function (a) { return I.lang === 'ko' ? dn(a) : G.T(dn(a)); };
  }

  // ---------------------------------------------------------------- 고르기
  /** 처음 연 사람: 브라우저 언어가 준비된 언어면 그것 (한 번 고른 뒤에는 고른 것) */
  I.pref = function () {
    var v = lsGet(KEY); if (v && I.info(v)) return v;
    if (location.protocol === 'file:') return 'ko';   // 파일로 연 게임(개발·시험)은 한국어 — 웹판(http·https)에서만 브라우저 언어를 본다
    var nav = String((navigator.languages && navigator.languages[0]) || navigator.language || 'ko').toLowerCase();
    var guess = /^ko/.test(nav) ? 'ko' : /^zh-(tw|hk|mo|hant)/.test(nav) ? 'zh-Hant' : /^zh/.test(nav) ? 'zh-Hans' : /^ja/.test(nav) ? 'ja' : /^vi/.test(nav) ? 'vi' : /^es/.test(nav) ? 'es' : /^en/.test(nav) ? 'en' : 'ko';
    return I.ready(guess) ? guess : (I.ready('en') && guess !== 'ko' ? 'en' : 'ko');
  };
  I.apply = function () {
    var l = I.info(I.lang) || I.LANGS[0], root = document.documentElement;
    root.lang = l.html; root.dataset.lang = l.id;
    if (G.Display && G.Display.applyFont) G.Display.applyFont();
    var bt = document.querySelector('#boot-loader .bl-text'); if (bt) { var t = I.tr(bt.textContent); if (t) bt.textContent = t; }
  };
  /** 언어를 바꾼다 (이 기기에 기억). 한국어로 돌아갈 때는 이미 그린 화면을 다시 그려야 한다 — redraw */
  I.set = function (id, redraw) {
    if (!I.info(id)) return;
    lsSet(KEY, id);
    var was = I.lang; I.lang = id; nameIdx = null;
    I.apply();
    if (id !== 'ko') { watch(); I.sweep(document.body); }
    else if (obs) { obs.disconnect(); obs = null; }
    if (was !== id && redraw) redraw();
  };
  /* 읽는 순간: 이 기기에 고른 언어가 있으면 바로 그 언어로 (뒤따라 읽는 자료 파일·불러오기 화면도) —
     처음 연 사람은 모든 스크립트를 읽은 뒤(언어 파일이 다 들어온 뒤) 브라우저 언어를 보고 정한다 */
  I.init = function () {
    wrapUtil(); hookCanvas();
    var v = lsGet(KEY);
    I.lang = v && I.info(v) ? v : 'ko';
    I.apply();
    if (I.lang !== 'ko') watch();
    document.addEventListener('DOMContentLoaded', function () {
      hookUI();
      if (!lsGet(KEY)) { var g = I.pref(); if (g !== I.lang) { I.lang = g; nameIdx = null; if (g !== 'ko') watch(); } }
      I.apply();
      if (I.lang !== 'ko') I.sweep(document.body);
    });
  };
  I.init();
})(window.G = window.G || {});
