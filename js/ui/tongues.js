/* 낯선 말 (G.Tongues) — 대항해시대 3처럼, 말이 서툴면 상대의 말이 그 고장의 글자로 들리고 알아들은 낱말만 한글로 보인다.
   · 제독 자신이 아는 만큼(S.player.lg)만 대화창에서 한글로 보이고, 나머지 낱말은 그 말의 글자로 바뀐다
     (유럽 말 = 그리스 글자, 슬라브 = 키릴, 아랍 = 아랍, 페르시아·위구르 = 아랍 글자 변형, 중국 = 한자, 인도 = 데바나가리,
      아프리카 = 에티오피아 글자, 아메리카 = 체로키 글자, 동남아 = 타이 글자, 일본(동아시아) = 히라가나, 조선 = 이두 한자).
     뜻이 맞을 필요는 없다 — 알아듣지 못했다는 표시다. 낱말 길이는 한글 음절 수를 따른다.
   · 부관·통역이 제독보다 그 말을 잘하면 대화창 아래 작은 창에서 통역이 옮겨 준다. 통역이 옮긴 말 가운데
     제독이 스스로 알아들은 낱말은 밑줄로 드러내고, 통역도 놓친 낱말은 「…」로 둔다.
   · 어떤 낱말을 알아듣는지는 문장마다 정해진 난수로 고른다 — 수준이 높을수록 집합이 커지며, 낮은 수준이 알아들은 낱말은
     높은 수준도 반드시 알아듣는다(제독이 들은 낱말은 통역의 말에도 있다). */
(function (G) {
  'use strict';
  var TG = {};
  G.Tongues = TG;
  var U = G.Util || G.U;

  TG.KEEP = [0, 0.35, 0.7, 1];     // 수준별 알아듣는 낱말 비율 (모름·기초·보통·능숙)

  function range(a, b) { var s = ''; for (var i = a; i <= b; i++) s += String.fromCharCode(i); return s; }
  var GREEK = 'αβγδεζηθικλμνξοπρστυφχω', CYR = 'абвгдежзиклмнопрстуфхцчшыюя';
  var ARAB = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي', PERS = ARAB + 'پچژگ', UYG = 'ابتجخدرزسشغفقكلمنهوي' + 'ۇۆۈېىڭئ';
  var HANZI = '之乎者也天地人山水日月風雲海船國王城市金銀道德仁義禮智信東西南北中大小上下来去言語不可有無見聞知行生死春秋百千萬年時心手足門家';
  var IDU = '爲是乎良叱隱乙如古在白飛等以乃亦中去羅也爲只尼彌';
  var DEVA_C = 'कखगघचछजटडणतथदधनपबभमयरलवशसह', DEVA_V = 'ािीुूेैोौं';
  var ETHI = range(0x1200, 0x1357).replace(/[቉቎቏቗቙቞቟኉኎኏኱኶኷኿዁዆዇዗጑጖጗]/g, '');
  var CHER = range(0x13A0, 0x13F4);
  var THAI_C = 'กขคงจฉชซญดตถทธนบปผพฟภมยรลวสหอ', THAI_V = 'ะาิีึืุูเแโไ';
  var HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだでどばびぶべぼぱぴぷぺぽ';

  /** 말 번호(G.LANGS) → 글자 */
  TG.SCRIPT = ['greek', 'greek', 'greek', 'greek', 'cyrillic', 'arabic', 'persian', 'hanzi', 'deva', 'uyghur', 'ethiopic', 'cherokee', 'thai', 'hira', 'idu'];
  TG.RTL = { arabic: 1, persian: 1, uyghur: 1 };

  function pick(r, s) { return s.charAt(Math.floor(r() * s.length)); }
  function syll(w) { var n = 0; for (var i = 0; i < w.length; i++) { var c = w.charCodeAt(i); n += c >= 0xAC00 && c <= 0xD7A3 ? 1 : 0.45; } return Math.max(1, Math.round(n)); }
  /** 한 낱말을 그 말의 글자로 (같은 낱말은 늘 같은 모양) */
  TG.word = function (w, script) {
    var r = U.makeRng(U.strHash(script + ':' + w)), n = syll(w), out = '', i;
    switch (script) {
      case 'greek': case 'cyrillic': {
        var set = script === 'greek' ? GREEK : CYR, len = n * 2 + Math.floor(r() * 2);
        for (i = 0; i < len; i++) out += pick(r, set);
        break;
      }
      case 'arabic': case 'persian': case 'uyghur': {
        var st = script === 'arabic' ? ARAB : script === 'persian' ? PERS : UYG, la = n * 2 + Math.floor(r() * 2);
        for (i = 0; i < la; i++) out += pick(r, st);
        break;
      }
      case 'hanzi': for (i = 0; i < n; i++) out += pick(r, HANZI); break;
      case 'idu': for (i = 0; i < n; i++) out += pick(r, i === n - 1 && n > 1 ? IDU : HANZI + IDU); break;
      case 'deva': for (i = 0; i < n + Math.floor(n / 2); i++) { out += pick(r, DEVA_C); if (r() < 0.65) out += pick(r, DEVA_V); } break;
      case 'ethiopic': for (i = 0; i < n; i++) out += pick(r, ETHI); break;
      case 'cherokee': for (i = 0; i < n + (r() < 0.4 ? 1 : 0); i++) out += pick(r, CHER); break;
      case 'thai': for (i = 0; i < n + 1; i++) { if (r() < 0.25) out += pick(r, 'เแโไ'); out += pick(r, THAI_C); if (r() < 0.5) out += pick(r, 'ะาิีุู'); } break;
      case 'hira': for (i = 0; i < Math.round(n * 1.5); i++) out += pick(r, HIRA); break;
      default: for (i = 0; i < n * 2; i++) out += '×';
    }
    return out;
  };

  var WORD = /[가-힣A-Za-z0-9]+/g;
  /** 문장을 낱말로 나눠 낱말마다 알아듣는 문턱(0~1)을 정한다 — 같은 문장이면 늘 같다 */
  function parts(text) {
    var r = U.makeRng(U.strHash(String(text))), out = [], last = 0, m;
    WORD.lastIndex = 0;
    while ((m = WORD.exec(text))) {
      if (m.index > last) out.push({ sep: text.slice(last, m.index) });
      out.push({ w: m[0], r: r() });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ sep: text.slice(last) });
    return out;
  }
  function knows(p, lv) { return lv >= 3 || p.r < TG.KEEP[Math.max(0, lv)]; }
  function esc(s) { return U.esc(s).replace(/\n/g, '<br>'); }

  /** 대화창 본문: 제독이 아는 낱말(lv)만 한글, 나머지는 그 말의 글자 */
  TG.heard = function (text, lv, li) {
    var script = TG.SCRIPT[li] || 'greek', rtl = TG.RTL[script];
    return parts(String(text)).map(function (p) {
      if (p.sep != null) return esc(p.sep);
      if (knows(p, lv)) return lv >= 3 ? esc(p.w) : '<span class="heard">' + esc(p.w) + '</span>';
      // 아랍 글자 낱말도 문장 안에서는 왼쪽→오른쪽으로 늘어놓는다(bidi-override) — 뜻 없는 글자라 순서는 상관없고, 구두점·낱말 순서가 흐트러지지 않는다
      return '<span class="foreign ' + script + (rtl ? ' ltrx' : '') + '">' + TG.word(p.w, script) + '</span>';
    }).join('');
  };
  /** 통역이 옮긴 말: 통역이 아는 낱말(team)은 한글, 그 가운데 제독도 들은 낱말(own)은 밑줄, 통역도 놓친 낱말은 … */
  TG.relay = function (text, own, team) {
    var ps = parts(String(text)), out = [], i = 0;
    while (i < ps.length) {
      var p = ps[i];
      if (p.sep != null) { out.push(esc(p.sep)); i++; continue; }
      if (knows(p, team)) { out.push(knows(p, own) && own > 0 ? '<span class="caught">' + esc(p.w) + '</span>' : esc(p.w)); i++; continue; }
      // 통역도 놓친 낱말: 띄어쓰기로만 이어진 것들은 「…」 하나로
      var j = i + 1;
      while (j + 1 < ps.length && ps[j].sep != null && !/[^\s]/.test(ps[j].sep) && ps[j + 1].w != null && !knows(ps[j + 1], team)) j += 2;
      out.push('<span class="lost">…</span>');
      i = j;
    }
    return out.join('');
  };

  /** 옛 방식(수준만 아는 화자): 말 번호가 없으면 지금 도시의 말로 */
  TG.guessLi = function () {
    var S = G.Game && G.Game.state; if (!S) return 0;
    var c = S.loc && S.loc.mode === 'city' && S.loc.city != null ? G.CITY_DATA[S.loc.city] : null;
    return c && c.lang != null ? c.lang : 0;
  };

  /** 화자 opts({li, lang})로 말하는 형편: {own, team, li, mate(옮겨 주는 동료), plain} */
  TG.situation = function (opts) {
    if (!opts || (opts.li == null && (opts.lang == null || opts.lang >= 3))) return { plain: true };
    var R = G.R, S = G.Game && G.Game.state;
    if (opts.li == null || !R || !S) return { plain: opts.lang >= 3, own: opts.lang, team: opts.lang, li: TG.guessLi() };
    var li = opts.li, own = Math.max((S.player.lg && S.player.lg[li]) || 0, opts.minLv || 0), team = Math.max(own, R.lang(li)), mate = null;   // minLv: 손짓·발짓으로 통하는 만큼(원주민)
    if (opts.lang != null && opts.lang < team) team = Math.max(own, opts.lang);    // 화자 쪽이 서툰 경우(동료 후보의 말이 짧음)
    if (team > own) {
      var best = -1;
      S.mates.forEach(function (m) {
        if (m.role !== 'interp' && m.role !== 'first') return;
        var d = G.MATE[m.id]; if (!d) return;
        var lv = d.lg[li] || 0, sc = lv * 2 + (m.role === 'interp' ? 1 : 0);
        if (lv > own && sc > best) { best = sc; mate = { id: m.id, name: d.name, role: m.role }; }
      });
    }
    return { plain: own >= 3, own: own, team: team, li: li, mate: mate };
  };

  /** 말 이름 (통역 창 제목에 쓰임) */
  TG.langName = function (li) { return (G.LANGS && G.LANGS[li]) || ''; };
})(window.G = window.G || {});
