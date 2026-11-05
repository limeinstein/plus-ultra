/* 미남 항해사 — 동아시아 (G.BeauxEA) 2026-11-05 사용자 요청 「미남 항해사가 나오는 형태로 이벤트를 추가해줘」 — 연애 없이 동료로만
   사람·동료·조정값: js/data/beauxea.js (G.BALANCE.beauxEA). 세 이야기는 서로 따로 열린다. 날짜는 게임의 양력.
   ■ ① 혼노지의 불길 — 모리 란마루 (1582.5.20~6.21, 쿄토): 노부나가의 시동 란마루가 교토 거리에서 제독을 맞는다(철포 이벤트에서 노부나가를 만났으면 알아본다).
        → 6월 21일 새벽까지 날이 지나간다 → 「적은 혼노지에 있다」 — 아케치의 군사가 절을 에워싼다(육상전) → 불길 속, 노부나가가 「인간 오십 년」을 읊고 안으로 사라진다
        → 함께 죽겠다는 란마루를 붙잡는다 (말로 붙잡는다 / 억지로 끌어낸다) → 이름을 버리고 배에 (동료 「란」) · 지면 역사대로
   ■ ② 모란정의 서생 — 곤곡 배우 옥랑 (1599~1620, 소주): 『모란정』 「경몽」 무대 뒤, 소금 상인 왕 대인이 옥랑을 제 집 극단(가반)에 사들이려 한다
        → 몸값을 대신 치른다(금화) / 연극이 끝난 소동 틈에 빼낸다(육상전) / 지나친다 → 「노래로만 부르던 바다를 보고 싶어요」 (동료)
   ■ ③ 에도의 마상재 — 조선 통신사의 재인 무진 (1636.11~1637.3 · 1643.7~11 · 1655.9~1656.1, 에도): 쇼군 앞에서 말 위 재주
        → 하타모토가 시샘해 말에 독침을 놓았다 — 쓰러진 말 (말을 사 준다 / 범인을 쫓는다 — 일기토) → 「이제 바다를 타 보고 싶습니다」 (동료)
   ■ 소식: 혼노지(란마루를 살렸으면 「주검을 찾지 못했다」) · 모란정의 배우가 사라졌다 · 에도의 마상재
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/bx_*.webp
   ■ 저장: s.beauxEA = { ran, ranMet, ok, okWay, mu, muWay, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var BX = G.BeauxEA = {};
  function S() { return G.Game && G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.beauxEA) || {}; }
  var KYOTO = 193, SUZHOU = 286, EDO = 297;
  var NEWS_AT = { honnoji: 15820622, okNews: 0, muNews: 0 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.beauxEA) {
      s.beauxEA = { told: {} };
      if (U.dateNum(s.date) > NEWS_AT.honnoji) s.beauxEA.told.honnoji = 1;   // 옛 저장
    }
    if (!s.beauxEA.told) s.beauxEA.told = {};
    return s.beauxEA;
  }
  BX.state = st;
  function today() { return U.dateNum(S().date); }
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function mateSp(id, emo) { return G.Legend && G.Legend.speaker && G.MATE[id] ? G.Legend.speaker(id, emo) : { name: (G.MATE[id] || {}).name || id, lang: 3 }; }
  function H(id) { return G.Hist ? G.Hist.speaker(id) : { name: id, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function first() { return G.Scenes && G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : { name: '부관', lang: 3 }; }
  // 말하는 사람: RN 란마루 · OK 옥랑 · MJ 무진 (아직 동료가 아니어도 동료 얼굴로 선다)
  var WHO = { P: me, F: first, RN: function (e) { return mateSp('bx_ranmaru', e); }, OK: function (e) { return mateSp('bx_okrang', e); }, MJ: function (e) { return mateSp('bx_mujin', e); } };
  var CROWD = { name: '구경꾼', lang: 3 };
  async function play(lines) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i]; if (!l) continue;
      var w = l[0], who = w && typeof w === 'object' ? w : w && WHO[w] ? WHO[w](l[2]) : w ? H(w) : {};
      await UI.say(l[1], who);
    }
  }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function log(t) { G.State.log(t); }
  function fame(kind, key) { var n = (K().fame || {})[key] || 0; return n ? G.Fame.add(kind, n) : 0; }
  function skill(id) { return R.skill ? R.skill(id) || 0 : 0; }
  function join(id, loyal, cityId) { if (row(id) || !G.Legend || !G.Legend.join) return row(id); var m = G.Legend.join(id, G.CITY_DATA[cityId]); if (m && loyal) m.loyal = loyal; return m; }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(8, Math.round(n)), false, Object.assign({ kind: 'garrison', noSpecial: true }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  async function passTo(day) {
    var n = U.dayIndex({ y: Math.floor(day / 10000), m: Math.floor(day / 100) % 100, d: day % 100 }) - U.dayIndex(S().date);
    if (!(n > 0)) return;
    var msgs = [];
    await UI.fade(function () { msgs = G.Game.passDays(n) || []; });
    if (msgs.length && G.Scenes.city && G.Scenes.city.news) await G.Scenes.city.news(msgs);
  }
  /** 철포 삼백 자루 이벤트(js/systems/teppo.js)에서 노부나가를 만났는가 */
  function metNobu() { var t = S().teppo; return !!(t && t.end === 'done' && t.by === 'nobu'); }   // 철포를 노부나가에게 직접 바쳤다
  BX.metNobu = metNobu;

  // ================================================================ 소식
  BX.daily = function () {
    var b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told;
    if (!told.honnoji && t >= NEWS_AT.honnoji && b.ranMet) {
      told.honnoji = 1;
      out.push({ icon: 'skull', history: true, text: b.ran === 'saved'
        ? '【혼노지】 불탄 혼노지의 잿더미에서 노부나가의 주검은 끝내 나오지 않았다. 곁을 지키던 시동 모리 란마루의 주검도 찾지 못했다 — 아케치의 군사들은 「불길 속으로 뛰어든 남만 배의 선장이 무언가를 업고 나갔다」고 수군거렸다.'
        : '【혼노지】 불탄 혼노지의 잿더미에서 노부나가의 주검은 끝내 나오지 않았다. 곁을 지키던 열일곱 살의 시동 모리 란마루도 함께 쓰러졌다고 한다.' });
    }
    if (b.ok === 'joined' && !told.okNews) {
      told.okNews = 1;
      out.push({ icon: 'note', history: true, text: '【소주의 무대】 소주 곤곡 무대에서 『모란정』의 류몽매를 부르던 배우 옥랑이 사라졌다. 양주의 소금 상인이 사람을 풀어 찾는다지만, 객석의 아가씨들은 「꿈속의 서생은 꿈으로 돌아간 것」이라며 울었다고 한다.' });
    }
    if (b.mu === 'joined' && !told.muNews) {
      told.muNews = 1;
      out.push({ icon: 'horse', history: true, text: '【에도의 마상재】 조선 통신사가 에도를 떠났다. 쇼군 앞에서 말 위에 거꾸로 섰던 재인 하나가 돌아가는 행렬에 없었다고 한다. 「조선의 하늘 사람은 바다로 갔다」는 말이 에도의 찻집에 돈다.' });
    }
    return out;
  };

  // ================================================================ ① 혼노지의 불길 — 모리 란마루 (1582.5.20~6.21, 쿄토)
  function ranOpen() { var b = st(), t = today(), k = K().honnoji || {}; return !!(b && !b.ran && cityNow() === KYOTO && t >= (k.from || 15820520) && t <= (k.night || 15820621) && !row('bx_ranmaru')); }
  async function ran() {
    var b = st(), k = K().honnoji || {}, knew = metNobu();
    b.ranMet = 1;
    await withPic('bx_kyoto', '교토의 시동 (1582)', function () { return play([
      [null, '교토, 시조 거리. 장터 사람들이 길을 비킨다. 말에 탄 젊은 무사 하나가 지나가는데 — 지나가는 사람마다 고개를 돌린다. 여자도, 남자도, 노인도.'],
      [CROWD, '(속삭이며) 우대신(노부나가) 나리의 시동 란마루 님이시오. 저 얼굴 좀 보시오. 먹으로 그린 것 같지 않소?'],
      ['RN', '(말에서 내려 제독 앞에 서며) ' + (knew ? '남만 총 삼백 자루를 날라 온 바다의 선장이시군요. 주군께서 그 이야기를 자주 하십니다.' : '남만 배의 선장이시군요. 주군께서는 바다 건너의 물건과 사람을 좋아하십니다.') + ' 모리 란마루라 합니다. 주군께서는 지금 혼노지에 머무십니다 — 서쪽 원정 길에 잠시.'],
      ['RN', '(조용히 웃으며) 저는 열일곱입니다. 사람들은 제 얼굴 이야기만 하지요. 하지만 주군께서는 제게 장부와 칼을 맡기셨습니다. 얼굴은 언젠가 늙지만, 셈과 칼은 늙지 않으니까요.']
    ]); });
    await passTo(k.night || 15820621);
    await withPic('bx_honnoji', '혼노지의 새벽 (1582.6.21)', function () { return play([
      [null, '새벽. 북소리와 함성이 교토의 새벽을 찢는다. 도라지꽃 문장의 깃발이 혼노지의 담을 에워쌌다 — 아케치 미쓰히데의 군사다.'],
      ['bx_akechi', '적은 혼노지에 있다! 한 놈도 남기지 마라!'],
      ['F', '제독, 절에 불이 붙었습니다! …그 시동이 아직 안에 있을 겁니다!']
    ]); });
    var res = await fight('혼노지를 에워싼 아케치의 군사', k.foe || 30, { guns: true, leader: '아케치의 장수' });
    if (res !== 'win') {
      b.ran = 'lost';
      await play([[null, '조총 연기에 막혀 담에도 닿지 못했다. 불길이 혼노지의 지붕을 삼켰다. 해가 떴을 때, 절은 잿더미였다.']]);
      log('1582년 혼노지의 변 — 불타는 혼노지에 닿지 못했다. 모리 란마루는 노부나가와 함께 쓰러졌다.');
      refresh(); return;
    }
    await play([
      [null, '담을 넘어 불타는 회랑으로. 흰 잠옷 차림의 노부나가가 활을 내려놓고 불길 쪽으로 돌아선다. 그 곁에 란마루가 피 묻은 창을 들고 서 있다.'],
      ['bx_nobunaga', '(제독을 보고 잠시 웃는다) …바다의 사람이 여기까지 왔구나. 「인간 오십 년, 하천의 세월에 비하면 꿈과 환영 같도다.」 (방문을 닫으며) 란, 불을 질러라. 내 목을 저들에게 주지 마라.'],
      [null, '문 안쪽에서 불길이 치솟는다. 란마루가 그 문 앞에 무릎을 꿇는다.'],
      ['RN', '(불빛에 비친 얼굴이 하얗다) 선장님, 가십시오. 시동은 주군과 함께 끝나는 것이 도리입니다. …저는 여기서 끝납니다.']
    ]);
    var talk = Math.min(0.9, 0.4 + skill('speech') * 0.15 + (knew ? 0.15 : 0));
    var v = await UI.ask('불길 앞에 무릎 꿇은 란마루', [
      { label: '「주군께서 그대에게 맡긴 건 칼과 장부요. 죽음이 아니오」 — 말로 붙잡는다 (' + Math.round(talk * 100) + '%)', value: 'talk', icon: 'scroll' },
      { label: '억지로 둘러메고 불길을 빠져나간다', value: 'carry', icon: 'boot' }], me());
    var ok = v === 'carry' || U.chance(talk);
    if (v === 'talk' && !ok) await play([['RN', '(고개를 젓는다) …그 말씀은 고맙습니다.'], [null, '제독은 대답 대신 그를 둘러멨다. 불붙은 들보가 등 뒤로 무너졌다.']]);
    b.ran = 'saved'; b.ranWay = v === 'talk' && ok ? 'talk' : 'carry';
    await withPic('bx_ran_sea', '가모가와의 새벽', function () { return play([
      [null, '가모가와 강가. 연기 냄새가 밴 채로 동이 튼다. 란마루의 오른손등이 불에 데어 있다.'],
      ['RN', b.ranWay === 'talk' ? '(오래 강물을 보다가) …주군께서는 제게 셈과 칼을 맡기셨지요. 그것을 불 속에 두고 오는 것도 도리가 아니겠군요.' : '(정신을 차리고 몸을 일으키며) …살려 두셨군요. 시동이 주군보다 오래 살다니, 부끄러운 일입니다. (손등의 화상을 내려다본다) 그래도 — 이 손으로 할 일이 남았나 봅니다.'],
      ['RN', '모리 란마루는 오늘 혼노지에서 죽었습니다. 앞으로는 그냥 「란」이라 불러 주십시오. 배의 장부와 칼, 제가 맡겠습니다.']
    ]); });
    join('bx_ranmaru', 88, KYOTO);
    var f = fame('so', 'ran');
    log('1582년 혼노지의 변 — 불타는 혼노지에서 노부나가의 시동 모리 란마루를 끌어냈다. 그는 이름을 버리고 「란」이 되어 배에 올랐다. (사교 명성 +' + f + ')');
    UI.toast('란 — 혼노지에서 살아 나온 시동이 배에 올랐다', 'people', 6000);
    refresh();
  }

  // ================================================================ ② 모란정의 서생 — 곤곡 배우 옥랑 (1599~1620, 소주)
  function okOpen() { var b = st(), t = today(), k = K().kunqu || {}; return !!(b && !b.ok && cityNow() === SUZHOU && t >= (k.from || 15990101) && t <= (k.to || 16201231) && !row('bx_okrang')); }
  async function ok() {
    var b = st(), s = S(), k = K().kunqu || {}, tang = !!row('h_tangxianzu');
    await withPic('bx_peony', '모란정 「경몽」 (소주)', function () { return play([
      [null, '소주의 정원 무대. 연못 위로 등불이 흔들린다. 피리 소리와 함께 흰 장삼의 서생이 버들가지를 들고 나온다 — 『모란정』의 류몽매다.'],
      ['OK', '(노래) 「그대를 찾아 사방을 헤맸소, 꽃처럼 아름다운 이여, 흐르는 물처럼 가 버린 세월이여…」'],
      [null, '객석이 숨을 멈춘다. 달처럼 흰 얼굴, 부채를 펼칠 때마다 등불이 따라 흔들린다. 아가씨들이 손수건을 깨문다.'],
      [null, '무대 뒤. 분칠을 지우던 배우의 손목을 살찐 사내가 붙잡는다.'],
      ['bx_salt', '옥랑아, 양주로 가자. 내 집 극단에서 나만을 위해 불러라. 반주에게는 은 천 냥을 주었다. 이제 너는 내 것이다.'],
      ['OK', '(손목을 빼려다 놓친다) 저는 무대의 배우지, 대인의 집 물건이 아닙니다…'],
      ['bx_banzhu', '(부채를 접으며) 옥랑, 은 천 냥이다. 극단 식구들이 겨울을 난다. …미안하다.']
    ]); });
    var v = await UI.ask('소금 상인이 배우를 사 가려 한다', [
      { label: '몸값을 대신 치른다 (금화 ' + U.num(k.ransom || 2000) + '닢)', value: 'pay', icon: 'coin', dis: s.player.gold < (k.ransom || 2000) },
      { label: '「극이 끝나면 소동이 날 거요」 — 틈을 타 빼낸다', value: 'steal', icon: 'sword' },
      tang ? { label: '탕현조에게 맡긴다 — 「『모란정』을 쓴 사람의 말을 들어 보시오」', value: 'tang', icon: 'book' } : null,
      { label: '지나친다', value: 'pass' }].filter(Boolean), me());
    var good = false;
    if (v === 'pay' && s.player.gold >= (k.ransom || 2000)) { s.player.gold -= (k.ransom || 2000); good = true; await play([['bx_banzhu', '(금화를 세며 한숨) …은 천 냥은 대인께 돌려드리지요. 옥랑, 너는 이제 누구의 것도 아니다.'], ['bx_salt', '(얼굴이 붉어지며) 남만 놈이 감히…! 흥, 배우 하나쯤.']]); }
    else if (v === 'steal') { var r = await fight('왕 대인의 하인들', k.foe || 14, { leader: '왕 대인의 집사' }); good = r === 'win'; if (!good) await play([[null, '하인들에게 밀리는 사이, 배우는 가마에 실려 양주 쪽으로 떠났다.']]); }
    else if (v === 'tang') { good = true; await play([[{ name: '탕현조', lang: 3 }, '(배에서 내려와 상인 앞에 서며) 내가 『모란정』을 쓴 사람이오. 「정은 어디서 오는지 모르나 한번 가면 깊어진다」고 썼지. …정을 은으로 살 수 있다고 쓴 적은 없소. 이 배우를 놓아주시오.'], ['bx_salt', '(멈칫하다 손을 놓으며) …탕 대인이 그렇다니.']]); }
    b.okWay = v;
    if (!good) { b.ok = v === 'pass' ? 'pass' : 'lost'; log('소주 — 곤곡 배우 옥랑이 소금 상인의 집 극단으로 팔려 갔다.'); refresh(); return; }
    await play([
      ['OK', '(분칠을 다 지운 얼굴로 — 맨얼굴이 더 곱다) 고맙습니다, 선장님. 저는 열 해 동안 「바다처럼 깊은 정」, 「파도 같은 이별」을 불렀어요. 그런데 바다를 한 번도 본 적이 없어요.'],
      ['OK', '노래로만 부르던 바다를 보고 싶어요. 배에서는 무엇이든 할게요. 저는 별자리를 노랫말처럼 외우거든요. 밤바다에서 길을 잃지는 않을 거예요.']
    ]);
    b.ok = 'joined';
    join('bx_okrang', 85, SUZHOU);
    var f = fame('so', 'ok');
    log('소주 — 소금 상인에게 팔려 가던 곤곡 배우 옥랑을 ' + (v === 'pay' ? '몸값을 치러' : v === 'tang' ? '탕현조의 말로' : '소동 틈에') + ' 빼냈다. 그는 노래로만 부르던 바다를 보러 배에 올랐다. (사교 명성 +' + f + ')');
    UI.toast('옥랑 — 『모란정』의 서생이 배에 올랐다', 'people', 6000);
    refresh();
  }

  // ================================================================ ③ 에도의 마상재 — 조선 통신사의 재인 무진 (1636 · 1643 · 1655, 에도)
  function muWin() { var t = today(); return (K().tsushinsa || []).some(function (w) { return t >= w[0] && t <= w[1]; }); }
  function muOpen() { var b = st(); return !!(b && !b.mu && cityNow() === EDO && muWin() && !row('bx_mujin')); }
  async function mu() {
    var b = st(), s = S(), k = K();
    await withPic('bx_bajeong', '에도의 마상재', function () { return play([
      [null, '에도성 앞 마장. 조선 통신사의 깃발이 늘어섰다. 쇼군과 다이묘들이 지켜보는 가운데, 흰 옷의 젊은 재인 하나가 말에 오른다.'],
      [null, '말이 달린다. 재인이 말 등 위에 우뚝 선다 — 거꾸로 선다 — 말 배 밑으로 사라졌다가 반대편에서 솟아오른다. 에도 사람들이 숨을 들이켠다.'],
      [CROWD, '(일본말로) 하늘 사람이다… 조선의 하늘 사람이다! 저 얼굴을 봐라, 웃을 때 덧니가 —'],
      ['bx_hatamoto', '(팔짱을 낀 채 옆 사람에게) 흥, 광대 재주 아닌가. 쇼군 앞에서 저따위가 박수를 받다니.'],
      ['MJ', '(말에서 내려 땀을 닦으며 제독에게) 바다 건너의 선장이시오? 무진이라 하오. 동래에서 배를 탈 때부터 바다만 보았소. 말보다 크게 흔들리더구려! 하하.']
    ]); });
    await play([
      [null, '그날 밤 마구간. 무진의 말이 쓰러져 거품을 문다. 목덜미에 가는 침 하나가 꽂혀 있다.'],
      ['bx_envoy', '(굳은 얼굴로) 낮에 재주를 비웃던 쇼군의 근시 하나가 마구간 근처를 서성였다 하오. …통신사가 일본 땅에서 시비를 일으킬 수는 없소. 무진, 참아라.'],
      ['MJ', '(쓰러진 말의 목을 끌어안고) 이 녀석이랑 동래에서부터 같이 왔소. 바다도 같이 건넜소…']
    ]);
    var v = await UI.ask('독침에 쓰러진 무진의 말', [
      { label: '에도의 말 시장에서 좋은 말을 사 준다 (금화 ' + U.num(k.horse || 1200) + '닢)', value: 'horse', icon: 'horse', dis: s.player.gold < (k.horse || 1200) },
      { label: '범인을 쫓는다 — 하타모토와 겨룬다 (일기토)', value: 'duel', icon: 'sword' }], me());
    b.muWay = v;
    if (v === 'horse' && s.player.gold >= (k.horse || 1200)) {
      s.player.gold -= (k.horse || 1200);
      await play([['MJ', '(새 말의 갈기를 쓰다듬다가 고개를 젓는다) …고맙소. 이 말은 통신사 행렬에 돌려주겠소. 돌아가는 길에 누군가 타야 하니까.']]);
    } else {
      var res = G.Games && G.Games.duel ? await G.Games.duel({ name: '쇼군의 근시', look: 'rival', str: 70, atk: 11, def: 4, skill: 2, mar: 72, int: 55, cha: 50, style: 'slash' }, { place: 'land' }) : 'win';
      b.muDuel = res;
      await play([[null, res === 'win' ? '하타모토가 칼을 떨어뜨리고 무릎을 꿇었다. 품에서 독침 통이 굴러 나왔다.' : '하타모토의 칼이 빨랐다. 그러나 소란에 통신사 군관들이 달려오자 그는 품에서 무언가를 떨어뜨리고 달아났다 — 독침 통이었다.'], ['bx_envoy', '(독침 통을 집어 들고) …이것으로 막부에 따질 수는 있겠소. 고맙소, 선장.']]);
    }
    await play([
      ['MJ', '(새벽, 바닷가에서) 선장. 나는 말 위에서 하늘을 보며 살았소. 그런데 이번에 처음 바다를 건너며 알았소 — 갑판도 말 등이오. 더 크고, 더 사나운.'],
      ['MJ', '정사 어른께 허락을 받았소. 「재인 하나쯤 바다에 빠졌다고 아뢰겠다」고. (덧니를 보이며 웃는다) 이제 바다를 타 보고 싶소. 망대 꼭대기는 내게 맡기시오.']
    ]);
    b.mu = 'joined';
    join('bx_mujin', 86, EDO);
    var f = fame('so', 'mu');
    log('에도 — 조선 통신사의 마상재 재인 무진이 바다를 타 보겠다며 배에 올랐다. (사교 명성 +' + f + ')');
    UI.toast('무진 — 조선의 하늘 사람이 배에 올랐다', 'people', 6000);
    refresh();
  }

  // ================================================================ 도시에 들어설 때 (js/scenes/city.js)
  var STEPS = [[ranOpen, ran], [okOpen, ok], [muOpen, mu]];
  BX.pending = function () { if (!S()) return false; return STEPS.some(function (x) { return x[0](); }); };
  BX.check = async function () {
    if (BX._busy) return false; BX._busy = true;
    try { for (var i = 0; i < STEPS.length; i++) if (STEPS[i][0]()) { await STEPS[i][1](); break; } } catch (e) { console.error(e); }
    BX._busy = false; refresh();
    return true;
  };
  BX._t = { ran: ran, ok: ok, mu: mu };
})(window.G = window.G || {});
