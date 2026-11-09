/* 대가 바뀔 때 아버지의 아내들 (G.MaidSwap) — 2026-10-22 사용자 요청
   은퇴한(또는 세상을 떠난) 제독의 아내들은 모두 아버지를 따라간다. 뒤를 이은 자녀의 함대·술집에 다시 나오지 않는다.
   · 부하 출신 아내(본처·둘째 부인 — 배에 타 있던 사람도): 함대에서 내리고(s.mates에서 뺀다) 다시 고용·청혼할 수 없다 (s.flags['gone_' + id])
   · 여급 출신 아내: 그 술집에는 다른 이름·다른 얼굴의 새 여급이 일한다.
       새 여급은 그 고장 그림 묶음에서 아직 아무도 쓰지 않는 얼굴을 고르고, 그 얼굴의 고장에 맞는 이름을 붙인다.
       새 여급도 다음 대에서 아내가 되었다가 은퇴하면 또 다른 사람으로 바뀐다.
   · 왕녀(블랑카)처럼 술집에서 일하지 않는 아내는 따라가기만 한다.
   · 여급과 혼인하면 (본처·둘째 부인 — 2026-11-09 베타 피드백 #162 「결혼한 여급이 여전히 그 술집에서 일한다」):
       그 술집에는 새 여급이 선다. 그 고장 그림 묶음(새로 추가한 얼굴 포함)에서 아직 아무도 쓰지 않는 얼굴 — 새 번호부터.
       남은 얼굴이 없으면 이름 없는 그 지역 여급(기본 여급)이 선다. 옛 저장에서 이미 혼인한 여급도 술집을 볼 때 한 번 바꾼다 (MS.at).
       부인은 그 술집에 들르기도 하고(남편을 찾으러 · 배에 함께 타고 왔으면 같이), 새 여급은 「언니 잘 지내요?」 하고 안부를 묻는다 (MS.wifeDrop · MS.sisLine)
   · 저장: s.maidGen = {id: {id, city, name, like, pic, base, from, after}} 새로 생긴 여급 · s.tavernMaid = {도시: 여급 id | '-' (기본 여급)} 지금 그 술집의 여급
           s.maidPrev = {도시: 혼인으로 그 술집을 떠난 여급 id} · s.maidDrop = {부인 id: 마지막으로 술집에 들른 날}
           s.pastWives = {id: 그 아내의 제독 대(代)} — 불러오면(State.deserialize) G.MAID에 새 여급을 다시 등록한다 */
(function (G) {
  'use strict';
  var U = G.U;
  var MS = G.MaidSwap = {};
  function S() { return G.Game && G.Game.state; }

  // 그림 묶음(얼굴의 고장)마다 그 고장 여인의 이름
  var NAMES = {
    iberia: ['마르가리다', '콘수엘로', '팔로마', '테레사', '로사리오', '이네스', '도로테아', '필라르', '아순시온', '클라라'],
    france: ['아녜스', '이자보', '잔', '클로드', '마들렌', '실비', '루이즈', '앙투아네트', '페리네트', '쥘리엔'],
    westeurope: ['아델', '헤드비히', '오데트', '엘로이즈', '로잘린', '마틸드', '베르트', '이자벨', '아나', '제르트뤼드'],
    britain: ['앨리스', '모드', '세실리', '조앤', '로웨나', '애그니스', '마저리', '이디스', '거트루드', '위니프레드'],
    germany: ['아델하이트', '마르가레테', '우르줄라', '카타리나', '안나', '엘스베트', '바르바라', '헤드비히', '쿠니군데', '크리스티네'],
    lowlands: ['아흐네스', '마르흐리트', '알레이트', '베아트레이스', '헤이르트라위드', '야코바', '마흐델레나', '엘리사벳', '디르키어', '네일티어'],
    slav: ['야드비가', '루드밀라', '보제나', '즈데나', '밀레나', '도브라바', '얀카', '스바타바', '드라호미라', '부크나'],
    russia: ['옐레나', '마르파', '아쿨리나', '바실리사', '예브도키야', '타티야나', '울리야나', '페오도시야', '나탈리야', '크세니야'],
    italy: ['루크레치아', '베아트리체', '오타비아', '피오렌차', '카테리나', '안젤라', '시모네타', '줄리에타', '코스탄차', '리비아'],
    greece: ['엘레니', '조이', '테오도라', '이리니', '안나', '소피아', '카테리나', '마리아', '에우도키아', '안젤리키'],
    arabia: ['파티마', '자이나브', '라일라', '아미나', '하디자', '누르', '살마', '야스민', '마르얌', '훌리아'],
    ottoman: ['귈바하르', '미흐리마', '나즐르', '에스마', '하티제', '쉬쉬', '페리', '귈셴', '아이셰', '세르브'],
    persia: ['시린', '파리사', '로크사나', '나히드', '마흐타브', '굴바누', '타흐미나', '아자르', '파리데', '수산'],
    india: ['락슈미', '미라', '파드미니', '사비트리', '라다', '찬드라', '가우리', '수난다', '아난디', '카말라'],
    seasia: ['수리', '말라티', '데위', '시티', '란티', '쿠스마', '아유', '멜라티', '인단', '마와르'],
    tropic: ['레일라니', '말리아', '타히아', '아누헤아', '마타리아', '로이마타', '히나', '바이아', '테우이', '마누아'],
    china: ['춘매', '월아', '소련', '옥향', '수영', '혜란', '추월', '향란', '금화', '설매'],
    japan: ['오하루', '오치요', '오쓰루', '오유키', '오키쿠', '오나쓰', '오린', '오소노', '오하나', '오카메'],
    korea: ['연화', '매월', '초선', '난향', '옥이', '분이', '춘심', '홍매', '설향', '도화'],
    africa: ['아마라', '은네카', '아비', '진자', '은달라', '아요', '은조키', '파투', '은지아', '아다니'],
    native: ['아이야나', '나코마', '타케라', '위치타', '하우나', '시나', '키모', '아와니', '오나와', '타니'],
    inca: ['쿠시', '이마', '수마', '오클로', '치키', '야나', '코야', '웨이타', '추키', '탐타']
  };
  var LIKES = ['bold', 'strong', 'willful', 'brave', 'kind', 'delicate', 'steady', 'generous'];

  function st() {
    var s = S(); if (!s) return null;
    if (!s.maidGen) s.maidGen = {}; if (!s.tavernMaid) s.tavernMaid = {}; if (!s.pastWives) s.pastWives = {};
    return s;
  }
  /** 저장된 새 여급들을 G.MAID에 올린다 (불러올 때) */
  MS.register = function (s) {
    s = s || S(); if (!s || !s.maidGen) return;
    Object.keys(s.maidGen).forEach(function (id) { var r = s.maidGen[id]; if (r) G.MAID[id] = { id: r.id, city: r.city, name: r.name, like: r.like, pic: r.pic, gen: true, base: r.base }; });
  };
  var NONE = '-';   // s.tavernMaid의 「이름 있는 여급이 없다 — 기본 여급」
  /** 지금 제독의 부인(본처·둘째 부인)인가 */
  function isWife(id) {
    var s = S(), p = s && s.player; if (!p || !id) return false;
    if (p.wife === id) return true;
    return (p.wives2 || []).some(function (w) { return w && w.id === id; });
  }
  MS.isWife = isWife;
  /** 부인을 따지지 않은 그 술집의 여급 */
  function rawAt(cityId) {
    var s = S(), id = s && s.tavernMaid && s.tavernMaid[cityId];
    if (id === NONE) return null;
    if (id) { if (!G.MAID[id]) MS.register(s); if (G.MAID[id]) return G.MAID[id]; }
    return G.baseMaidAt ? G.baseMaidAt(cityId) : (G.MAIDS || []).filter(function (m) { return m.city === cityId; })[0] || null;
  }
  var inAt = false;
  /** 그 도시 술집에서 지금 일하는 이름 있는 여급 (없으면 null — 이름 없는 기본 여급).
      부인이 된 여급은 술집에 서지 않는다 — 옛 저장에서 이미 혼인한 여급도 여기서 한 번 새 여급으로 바꾼다 */
  MS.at = function (cityId) {
    var s = S(); if (s && !s.pwMig) MS.migrate();
    var m = rawAt(cityId);
    if (m && s && s.player && !inAt && !m.royal && isWife(m.id)) {
      inAt = true;
      try { MS.wed(m.id, cityId); } catch (e) { console.error(e); }
      finally { inAt = false; }
      m = rawAt(cityId);
    }
    return m;
  };
  /** 지금 쓰이는 여급 얼굴들 (새 여급과 겹치지 않게) */
  function usedFaces(c) {
    var I = G.Img, used = {};
    (G.MAIDS || []).forEach(function (m) { var k = I.maidPic(m.id, G.CITY_DATA[m.city]); if (k) used[k] = 1; });
    var s = S(); if (s && s.maidGen) Object.keys(s.maidGen).forEach(function (id) { var r = s.maidGen[id]; if (r && r.pic) used[r.pic] = 1; });
    try { var sv = I.pick(I.chain.maidCity(c)); if (sv) used[sv] = 1; } catch (e) { /* 그 도시의 이름 없는 여급 그림 */ }
    return used;
  }
  /** 혼인으로 새로 서는 여급의 얼굴: 그 고장 묶음 → 이웃 묶음 순으로, 아직 아무도 쓰지 않는 그림만 (없으면 null → 기본 여급).
      이름 없는 다른 도시 여급이 쓰지 않는 것 → 번호가 큰 것(새로 그린 얼굴)부터 */
  function freshFace(oldId, c) {
    var I = G.Img; if (!I || !I.maidList) return null;
    var oldPic = I.maidPic(oldId, c), used = usedFaces(c), styles = [], st0 = I.maidStyle(oldId, c), spread = {};
    try { var mp = I.spreadCityMaids ? I.spreadCityMaids() : {}; Object.keys(mp).forEach(function (k) { if (mp[k]) spread[mp[k]] = 1; }); } catch (e) { /* 그림 목록이 아직 없다 */ }
    if (st0) styles.push(st0);
    (I.maidPool(c) || []).forEach(function (x) { if (styles.indexOf(x) < 0) styles.push(x); });
    function num(k) { return parseInt(k.slice(k.lastIndexOf('/') + 1), 10) || 0; }
    for (var i = 0; i < styles.length; i++) {
      var list = I.maidList(styles[i], c).filter(function (k) { return k !== oldPic && I.has(k) && !used[k] && /^maid-styles\//.test(k); });
      if (!list.length) continue;
      list.sort(function (a, b) { return ((spread[a] ? 1 : 0) - (spread[b] ? 1 : 0)) || (num(b) - num(a)); });
      return list[0];
    }
    return null;
  }
  MS._freshFace = freshFace;
  /** 새 여급의 얼굴: 떠난 아내와 다른, 아직 아무도 쓰지 않는 그림 (그 고장 묶음 → 이웃 묶음 순) */
  function pickFace(oldId, c, seed) {
    var I = G.Img; if (!I || !I.maidList) return null;
    var oldPic = I.maidPic(oldId, c), used = usedFaces(c), styles = [], st0 = I.maidStyle(oldId, c);
    if (st0) styles.push(st0);
    (I.maidPool(c) || []).forEach(function (x) { if (styles.indexOf(x) < 0) styles.push(x); });
    var fallback = null;
    for (var i = 0; i < styles.length; i++) {
      var list = I.maidList(styles[i], c).filter(function (k) { return k !== oldPic && I.has(k); });
      if (!list.length) continue;
      var fresh = list.filter(function (k) { return !used[k]; });
      var pool = fresh.length ? fresh : null;
      if (!pool) { if (!fallback) fallback = list; continue; }
      return pool[Math.abs(U.strHash(seed)) % pool.length];
    }
    return fallback ? fallback[Math.abs(U.strHash(seed)) % fallback.length] : null;
  }
  /** 이미 쓰이는 이름들 — 모든 도시의 이름 있는 여급(새로 들어온 여급까지)·부하·지금과 지난 대의 부인 (QA 14: 예전엔 같은 도시만 보아 다른 도시 여급과 이름이 겹쳤다) */
  function takenNames(s) {
    var t = {};
    Object.keys(G.MAID || {}).forEach(function (k) { var m = G.MAID[k]; if (m && m.name && (!m.gen || (s.maidGen && s.maidGen[k]))) t[m.name] = 1; });   // 다른 저장에서 올라온 새 여급은 빼고
    Object.keys(s.maidGen || {}).forEach(function (k) { var r = s.maidGen[k]; if (r && r.name) t[r.name] = 1; });
    Object.keys(G.MATE || {}).forEach(function (k) { var m = G.MATE[k]; if (m && m.name) t[m.name] = 1; });
    (s.mates || []).forEach(function (m) { if (m && m.name) t[m.name] = 1; });
    var p = s.player || {}, nameOf = function (id) { var d = id && (G.MAID[id] || G.MATE[id]); if (d && d.name) t[d.name] = 1; };
    nameOf(p.wife); (p.wives2 || []).forEach(function (w) { nameOf(w.id); }); (p.elders || []).forEach(function (e) { nameOf(e.id); });
    return t;
  }
  function nearNames(c) { var out = [], I = G.Img; ((I && I.maidPool && I.maidPool(c)) || []).forEach(function (k) { (NAMES[k] || []).forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); }); return out; }
  function allNames() { var out = []; Object.keys(NAMES).forEach(function (k) { NAMES[k].forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); }); return out; }
  function styleOf(pic) { var m = pic && /^maid-styles\/([^/]+)\//.exec(pic); return m ? m[1] : null; }
  /** 새 여급 하나를 만들어 그 술집에 세운다. o.fresh = 아무도 쓰지 않는 얼굴만 (없으면 기본 여급을 세우고 null) */
  MS.replace = function (old, o) {
    o = o || {};
    var s = st(), c = G.CITY_DATA[old.city]; if (!s || !c) return null;
    var base = old.base || old.id, n = 2;
    while (G.MAID[base + '_g' + n] || s.maidGen[base + '_g' + n]) n++;
    var id = base + '_g' + n, seed = id + ':' + (s.seed || 0) + ':' + s.date.y;
    var pic = o.fresh ? freshFace(old.id, c) : pickFace(old.id, c, seed);
    if (o.fresh && !pic) { s.tavernMaid[old.city] = NONE; return null; }
    var pool = NAMES[(G.Img.maidStyle ? G.Img.maidStyle(base, c) : '') || styleOf(pic)] || NAMES[styleOf(pic)] || NAMES.westeurope;   // 이름은 그 술집 고장(처음 여급)의 이름
    var taken = takenNames(s); taken[old.name] = 1;
    var names = pool.filter(function (x) { return !taken[x]; });
    if (!names.length) names = nearNames(c).filter(function (x) { return !taken[x]; });   // 그 고장 이름이 다 쓰였으면 이웃 고장(그 도시 그림 묶음들)의 이름
    if (!names.length) names = allNames().filter(function (x) { return !taken[x]; });   // 그래도 없으면 어느 고장 이름이든
    if (!names.length) names = pool.filter(function (x) { return x !== old.name; });
    var name = names[Math.abs(U.strHash(seed + 'n')) % names.length];
    var likes = LIKES.filter(function (x) { return x !== old.like; }), like = likes[Math.abs(U.strHash(seed + 'l')) % likes.length];
    var rec = { id: id, city: old.city, name: name, like: like, pic: pic, base: base, from: s.date.y };
    if (o.after) rec.after = o.after;
    s.maidGen[id] = rec; s.tavernMaid[old.city] = id;
    MS.register(s);
    return G.MAID[id];
  };
  /** 여급과 혼인했다: 그 술집에 지금 서 있는 사람이 그 여급이면 새 여급(없으면 기본 여급)으로 바꾼다 → 새 여급 | null(기본 여급) */
  MS.wed = function (id, cityId) {
    var s = st(), old = G.MAID[id]; if (!s || !old || old.royal) return null;
    var city = cityId != null ? cityId : old.city, now = rawAt(city);
    if (!now || now.id !== id) return now;
    s.maidPrev = s.maidPrev || {}; s.maidPrev[city] = id;
    return MS.replace(old, { fresh: true, after: id });
  };
  /** 이 술집을 혼인으로 떠난 여급 가운데 지금도 부인인 사람 (없으면 null) */
  MS.prevWife = function (cityId) {
    var s = S(), id = s && s.maidPrev && s.maidPrev[cityId];
    return id && isWife(id) && G.MAID[id] ? G.MAID[id] : null;
  };
  /** 혼인 알림 꼬리: 그 술집에 새로 선 여급 */
  MS.wedNote = function (cityId) {
    var c = G.CITY_DATA[cityId], m = rawAt(cityId); if (!c) return '';
    return c.name + ' 술집에는 ' + (m ? '새 여급 ' + m.name + U.jx(m.name, '이/가') : '다른 여급이') + ' 일하게 되었다.';
  };

  // ---------------------------------------------------------------- 부인과 그 술집
  function wifeRow(id) { var p = S().player; return (p.wives2 || []).filter(function (w) { return w && w.id === id; })[0] || null; }
  /** 그 부인이 지금 이 도시에 있는가: 'aboard' 배에 함께 · 'home' 이 도시에 산다 · null */
  function wifeHere(id, cityId) {
    var s = S(), p = s.player;
    if (p.wife === id) {
      if (p.wifeAboard) return 'aboard';
      var seat = G.R && G.R.seat ? G.R.seat() : p.home;
      return seat === cityId ? 'home' : null;
    }
    var w = wifeRow(id); if (!w) return null;
    if (G.Wives && G.Wives.isCold && G.Wives.isCold(w)) return null;   // 토라져 있으면 찾아오지 않는다
    if (w.aboard) return 'aboard';
    return w.house && !w.deliver && w.city === cityId ? 'home' : null;
  }
  MS.wifeHere = wifeHere;
  function wifeSpk(id) {
    var p = S().player;
    if (p.wife === id && G.Family && G.Family.wifeSpeaker) return G.Family.wifeSpeaker();
    var w = wifeRow(id); if (w && G.Wives && G.Wives.speaker) return G.Wives.speaker(w);
    return { name: G.MAID[id] ? G.MAID[id].name : '부인' };
  }
  function maidSpk(c) {
    var T = G.Scenes.city.B.tavern, m = MS.at(c.id);
    return m ? T.maidSpeaker(m) : T.servantSpeaker(c);
  }
  function dropCfg() { var b = (G.BALANCE && G.BALANCE.maidWife) || {}; return { chance: b.dropChance == null ? 0.35 : b.dropChance, gap: b.dropGap == null ? 20 : b.dropGap, sisAff: b.sisAff == null ? 3 : b.sisAff }; }
  /** 술집에 들어설 때: 이 술집에서 일하던 부인이 들른다 (남편을 찾으러 · 배에 함께 왔으면 옛 일터를 둘러본다). 일어났으면 true */
  MS.wifeDrop = async function (c, force) {
    var s = S(), wm = MS.prevWife(c.id); if (!wm) return false;
    var where = wifeHere(wm.id, c.id); if (!where) return false;
    var K = dropCfg(); s.maidDrop = s.maidDrop || {};
    var last = s.maidDrop[wm.id];
    if (!force && ((last != null && s.day - last < K.gap) || !U.chance(K.chance))) return false;
    s.maidDrop[wm.id] = s.day;
    var UI = G.UI, ws = wifeSpk(wm.id), ms = maidSpk(c), mn = ms.name && ms.name !== '여급' ? ms.name : '', wn = wm.name;
    var T = G.Scenes.city.B.tavern, duo = function (sp, emo) { return T.duo ? T.duo(sp, emo || 'warm') : sp; };
    if (where === 'home') {
      await UI.say('술집 문이 열리고 낯익은 얼굴이 들어선다. ' + wn + '다. 예전에 이 술집에서 일하던 그 사람이다.', {});
      await UI.say(U.pick(['역시 여기 있었네요. 배가 들어왔다는 말을 듣자마자 왔어요. 집보다 술집을 먼저 찾는 버릇은 여전하네요.', '항구에 당신 배가 보이길래 혹시나 했어요. 여기 계실 줄 알았다니까요.', '집에서 기다리다 못해 찾으러 왔어요. 이 술집 문턱은 눈 감고도 넘는걸요.']), duo(ws, 'happy'));
      await UI.say(wn + ' 언니! 잘 지내요? 요즘 통 안 들르셔서 서운했어요.', duo(ms, 'happy'));
      await UI.say((mn ? mn + ', ' : '') + U.pick(['너도 잘 지냈지? 이 사람 오면 독한 술은 주지 마. 집에 데려가야 하니까.', '일은 할 만해? 그 자리, 생각보다 고되지? 나도 그랬어.', '단골손님들은 여전하지? 이 사람한테는 외상 주지 마.']), duo(ws, 'warm'));
      await UI.say(U.pick(['걱정 마세요, 언니. 제가 잘 감시할게요.', '언니가 하던 대로 하고 있어요. 손님들이 아직도 언니 이야기를 해요.', '언니가 행복해 보여서 좋아요. 다음엔 아이들도 데리고 오세요!']), duo(ms, 'happy'));
      var w2 = wifeRow(wm.id);
      if (w2 && w2.house && G.Wives && G.Wives.visit) {
        var v = await UI.ask(wn + U.jx(wn, '이/가') + ' 팔을 끈다.', [{ label: '함께 집으로 간다', value: 'go' }, { label: '한잔만 더 하고 가겠다', value: null }], duo(ws, 'warm'));
        if (v === 'go') { await G.Wives.visit(w2); return true; }
        await UI.say('한 잔만이에요. 기다릴게요.', duo(ws, 'warm'));
      } else await UI.say('천천히 마시고 와요. 저는 먼저 집에 가 있을게요.', duo(ws, 'warm'));
    } else {
      await UI.say(wn + U.jx(wn, '이/가') + ' 술집 안을 둘러보며 웃는다. 예전에 일하던 곳이다.', {});
      await UI.say('어머, ' + wn + ' 언니! 정말 배를 타고 다니시는구나. 잘 지내요?', duo(ms, 'happy'));
      await UI.say(U.pick(['응, 바닷바람이 생각보다 괜찮아. 이 술집은 여전하네.', '배 위는 흔들려도 이 사람 곁이라 괜찮아. 여기는 하나도 안 변했구나.']) + (mn ? ' ' + mn + ', 힘들진 않아?' : ' 힘들진 않아?'), duo(ws, 'warm'));
      await UI.say(U.pick(['언니 몫까지 하느라 바빠요! 그래도 언니가 행복해 보여서 좋아요.', '힘들 때마다 언니 생각해요. 다음에 오시면 바다 이야기 꼭 들려주세요!']), duo(ms, 'happy'));
    }
    return true;
  };
  /** 새 여급(또는 기본 여급)이 부인의 안부를 묻는 말 — 이 술집을 혼인으로 떠난 부인이 있을 때만 (없으면 '') */
  MS.sisLine = function (c) {
    var wm = MS.prevWife(c.id); if (!wm) return '';
    var wn = wm.name, here = wifeHere(wm.id, c.id);
    return here === 'home' ? U.pick([wn + ' 언니는 잘 지내요? 같은 도시에 살아도 요즘은 얼굴 보기가 힘드네요.', '혹시 ' + wn + ' 언니 남편분이시죠? 언니한테 가끔 들르라고 전해 주세요.'])
      : here === 'aboard' ? U.pick([wn + ' 언니는 배 위에서 잘 지내요? 멀미는 안 한대요?', wn + ' 언니도 같이 오셨어요? 이따 꼭 들르라고 해 주세요!'])
      : U.pick([wn + ' 언니는 잘 지내요? 언니가 일하던 자리를 제가 맡고 있어요.', '혹시 ' + wn + ' 언니 남편분이시죠? 언니 잘 지내요? 보고 싶다고 꼭 전해 주세요.', wn + ' 언니가 떠나고 나서 손님들이 한동안 서운해했어요. 언니는 잘 지내요?']);
  };
  /** 「부인의 안부를 전한다」: 새 여급이 반가워한다 (한 번 들른 사이 한 번 호감 +sisAff) */
  MS.sisTalk = async function (c, m, st, say) {
    var wm = MS.prevWife(c.id); if (!wm) return;
    var wn = wm.name, cur = G.Scenes.city.current ? G.Scenes.city.current() : null;
    await say(U.pick([wn + ' 언니가 잘 지낸다니 다행이에요! 언니가 그러는데, 당신은 술보다 바다를 더 좋아한대요.', '정말요? ' + wn + ' 언니가 행복하다니 저까지 기뻐요. 언니한테 제 안부도 전해 주세요.', '언니가 그렇게 칭찬하던 분이 당신이군요. 언니 잘 부탁드려요!']), 'happy');
    if (st && cur && !cur.sisTold) { cur.sisTold = 1; st.aff = Math.min(100, (st.aff || 0) + dropCfg().sisAff); }
  };
  /** 은퇴한 제독의 아내들이 그를 따라간다 → [{id, name, kind, newMaid}] */
  MS.retire = function (ids) {
    var s = st(); if (!s) return [];
    var gen = (s.player && s.player.generation) || 1, out = [];
    s.pwMig = 1;
    (ids || []).forEach(function (id) {
      if (!id || out.some(function (x) { return x.id === id; })) return;
      s.pastWives[id] = gen;
      var maid = G.MAID[id], mate = !maid && G.MATE[id];
      var o = { id: id, name: maid ? maid.name : mate ? mate.name : id, kind: maid ? 'maid' : 'mate' };
      if (mate) {
        s.mates = (s.mates || []).filter(function (x) { return x.id !== id; });
        s.flags['gone_' + id] = 1;
      } else if (maid && !maid.royal) {
        var now = MS.at(maid.city);
        if (now && now.id === id) o.newMaid = MS.replace(maid);
        if (s.maids) delete s.maids[id];
      }
      out.push(o);
    });
    if (G.R && G.R.tidyCaptains) G.R.tidyCaptains();
    return out;
  };
  /** 옛 저장 (이 고침 전에 대가 바뀐 게임): 지난 대의 아내를 찾아 같은 일을 한 번 한다.
      ① 선대의 부인 명단(p.elders — 세대 교체 때 Wives.retire가 남긴 id)에 있는 여급·부하 — 가장 정확하다 (QA 4: 옛 저장 일지는 300줄로 잘려 결혼 줄이 거의 없다)
      ② 부하 출신 = 혼인 표시(s.flags['wed_' + id])가 있는데 지금 제독의 아내가 아닌 사람.
      ③ 여급 출신 = 마지막 세대 교체 전의 일지에 「○○과 결혼했다」「○○을 둘째(셋째·넷째…) 부인으로 맞았다」로 남은 여급 (이름이 같은 여급이 여럿이면 호감 100인 사람) */
  MS.migrate = function () {
    var s = S(); if (!s || !s.player || s.pwMig) return;
    s.pwMig = 1;
    if ((s.player.generation || 1) < 2) return;
    var p = s.player, now = {}; if (p.wife) now[p.wife] = 1; (p.wives2 || []).forEach(function (w) { now[w.id] = 1; });
    var ids = [];
    function add(id) { if (id && !now[id] && ids.indexOf(id) < 0) ids.push(id); }
    (p.elders || []).forEach(function (e) { if (e && (G.MAID[e.id] || G.MATE[e.id])) add(e.id); });
    Object.keys(s.flags || {}).forEach(function (k) { var m = /^wed_(.+)$/.exec(k); if (m && G.MATE[m[1]]) add(m[1]); });
    var log = s.log || [], cut = -1;
    for (var i = log.length - 1; i >= 0; i--) if (/은퇴하고 .* 뒤를 이었다/.test(log[i].t)) { cut = i; break; }
    for (var j = 0; j < cut; j++) {
      var t = log[j].t, mm = /^(.+?)(?:과|와) 결혼했다/.exec(t) || /^(.+?)(?:을|를) \S+ 부인으로 맞았다/.exec(t);
      if (!mm) continue;
      var nm = mm[1], cand = (G.MAIDS || []).filter(function (x) { return x.name === nm; });
      if (cand.length > 1) cand = cand.filter(function (x) { return s.maids && s.maids[x.id] && s.maids[x.id].aff >= 100; });
      if (cand.length === 1) add(cand[0].id);
    }
    if (ids.length) MS.retire(ids);
  };
  /** 지난 대 제독의 아내였는가 */
  MS.isPast = function (id) { var s = S(); return !!(s && s.pastWives && s.pastWives[id]); };
})(window.G = window.G || {});
