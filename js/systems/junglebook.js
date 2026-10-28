/* 정글북 — 모글리 (G.Mowgli) 2026-10-26 사용자 요청 · 2026-10-28 QA에서 게임에 연결. 사람·조정값은 js/data/junglebook.js (G.BALANCE.jungleBook)
   ■ 조건: 델리 근처(radius도 안) 숲을 뭍으로 걸으며 탐험할 때, 배에 교역품 바나나가 banana(10)개 이상 있고, 여자 부하가 한 사람 이상 있을 것
   ■ 흐름 (뭍에서 하루를 걸을 때마다 — js/scenes/land.js 가 G.Mowgli.onLand 를 부른다)
     · 걸을 때마다 바나나가 몇 개씩 사라진다 (steals날) — 나뭇가지 위에서 킥킥대는 소리
     · 그다음 날: 바나나를 쫓는 오랑우탄 무리와 마주친다. 무리 속에 사람 청년이 하나 — 늑대 손에 자란 모글리
     · 늙은 오랑우탄이 모글리에게 「네가 사람이라면 내 수수께끼를 풀어 봐라」. 모글리는 쩔쩔매고, 제독이 답을 귀띔한다 (두 번까지)
       → 풀면: 「사람이라면 다른 이에게 도움을 받는 것도 사람의 모습이지」 — 모글리는 사람이 되기 위해, 그리고 제독의 여자 부하에게 반해서 동료가 된다
       → 못 풀면: 오랑우탄들이 남은 바나나를 몽땅 가져가고 모글리도 함께 사라진다 (coolDays일 뒤 다시)
   ■ 말: 사람의 말은 모른다 — 함께 지낸 날(m.mg.days)에 따라 힌두어·아프리카토착어·동남아시아토착어·페르시아어를 익혀 90일째 모두 3단계 (m.lgx)
   · 저장: s.mowgli = { steal, met, cool, done, crush: 반한 부하 id, fails } · 동료 줄 m.mg = { days } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var MG = G.Mowgli = {};
  var ID = 'mowgli';
  function K() { return (G.BALANCE && G.BALANCE.jungleBook) || {}; }
  function S() { return G.Game && G.Game.state; }
  function row(id) { var s = S(); return s ? s.mates.filter(function (x) { return x.id === id; })[0] || null : null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(ID, emo) : { name: G.MATE[ID].name, portrait: G.Scenes.mateSpec(ID), lang: 3 }; }
  function boy() { return Object.assign({}, who(), { name: '정글의 청년' }); }   // 이름을 알기 전
  function ape() {
    // 동물 얼굴은 사람용 절차 얼굴 대신 전용 원화를 그대로 표시한다.
    return { name: '늙은 오랑우탄', lang: 3, rigNoFace: true,
      portrait: G.Art.withImg({}, ['portraits/history/mowgli_ape']), half: ['portraits/history/mowgli_ape_half'] };
  }
  function mateSp(m) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(m.id) : { name: G.MATE[m.id].name, portrait: G.Scenes.mateSpec(m.id), lang: 3 }; }
  function narrate(t) { return UI.say(t, {}); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }   // 그림이 없으면 건너뛴다
  function st() { var s = S(); return s.mowgli || (s.mowgli = {}); }

  MG.ready = function () {
    var s = S(); if (!s || !G.MATE[ID] || row(ID) || s.flags['gone_' + ID]) return false;
    var o = s.mowgli || {}; if (o.done) return false;
    return !(o.cool > s.day);
  };
  /** 델리 근처의 숲인가 (바다·눈·얼음은 빼고) */
  MG.forest = function (lon, lat) {
    var c = G.CITY_DATA[K().city != null ? K().city : 145]; if (!c) return false;
    if (G.Geo.dist(lon, lat, c.lon, c.lat) > (K().radius || 3)) return false;
    var t = G.Geo.terrain(lon, lat);
    return !!t && t !== 'sea' && t !== 'ice' && t !== 'snow';
  };
  MG.bananas = function () { var c = S().fleet.cargo || {}; return c.banana ? c.banana.q || 0 : 0; };
  function takeBananas(n) {
    var c = S().fleet.cargo, b = c && c.banana; if (!b) return 0;
    n = Math.min(b.q, n); b.q -= n; if (b.q <= 0) delete c.banana; return n;
  }
  /** 여자 부하 (매력이 가장 높은 사람부터) */
  MG.women = function () {
    return S().mates.filter(function (m) { var d = G.MATE[m.id]; return d && d.g === 'f' && m.id !== ID && !(R.mateHidden && R.mateHidden(m)); })
      .sort(function (a, b) { return ((G.MATE[b.id].st || [])[3] || 0) - ((G.MATE[a.id].st || [])[3] || 0); });
  };

  /** 뭍에서 하루를 걸을 때 (js/scenes/land.js) */
  MG.onLand = async function (lon, lat, api) {
    var s = S(); if (!s || s.loc.mode !== 'land' || !MG.ready() || !MG.forest(lon, lat)) return false;
    if (!MG.women().length) return false;
    var o = st(), k = K(), q = MG.bananas();
    if (!o.steal && q < (k.banana || 10)) return false;           // 시작하려면 바나나가 넉넉해야 한다
    if (q <= 0) { o.steal = 0; return false; }                      // 다 사라졌다 — 처음부터
    if ((o.steal || 0) < (k.steals || 2)) {
      var sn = k.stealN || [1, 3], n = takeBananas(U.ri(sn[0], sn[1]));
      o.steal = (o.steal || 0) + 1;
      UI.toast(o.steal === 1 ? '짐 바구니에서 바나나 ' + n + '개가 감쪽같이 사라졌다! 머리 위 나뭇가지에서 킥킥대는 소리가 난다.'
        : '또 바나나 ' + n + '개가 없어졌다! 이번에는 주황빛 털북숭이 팔이 나뭇잎 사이로 쑥 들어가는 것을 보았다. (남은 바나나 ' + MG.bananas() + '개)', 'eye', 5200);
      return false;
    }
    if (api && api.stop) api.stop();
    return MG.meet();
  };

  // 수수께끼 — 늙은 오랑우탄이 「사람이라면」 풀어 보라고 낸다 (모글리가 먼저 틀린다)
  var RIDDLES = [
    { q: '아침에는 네 발로, 낮에는 두 발로, 저녁에는 세 발로 걷는 것이 무엇이냐?', a: '사람', wrong: ['원숭이', '거미', '코끼리'], mg: '네 발, 두 발, 세 발…? 그런 짐승은 정글에 없어! 원숭이? 원숭이는 나무에서 네 발이니까…',
      why: '아기 때는 기어 다니고, 자라서는 두 발로 걷고, 늙으면 지팡이를 짚으니까— 사람이다.' },
    { q: '강을 건너야 한다. 작은 뗏목에는 너와 짐 하나만 탈 수 있다. 호랑이, 염소, 바나나 한 송이를 모두 건너편으로 옮기려면, 맨 처음에 무엇을 태워야 하느냐? 호랑이는 염소를 먹고, 염소는 바나나를 먹는다.', a: '염소', wrong: ['호랑이', '바나나', '아무것도 안 태우고 헤엄친다'], mg: '호랑이부터! 시어 칸 같은 놈은 먼저 치워 버려야지— 아, 그러면 염소가 바나나를…',
      why: '염소를 먼저 건너 두면, 호랑이와 바나나는 서로 건드리지 않으니까. 그다음에 하나를 옮기고 염소를 데리고 돌아오면 된다.' },
    { q: '나무에 바나나 열 송이가 달려 있었다. 원숭이 셋이 두 송이씩 따 먹고, 바람에 한 송이가 떨어졌다. 나무에 남은 바나나는 몇 송이냐?', a: '세 송이', wrong: ['네 송이', '일곱 송이', '한 송이도 없다'], mg: '열에서… 원숭이가 셋이니까 셋을 빼고… 일곱? 아니, 두 송이씩이랬는데…',
      why: '셋이 두 송이씩이면 여섯 송이, 떨어진 것이 한 송이— 열에서 일곱을 빼면 세 송이가 남는다.' },
    { q: '정글의 짐승은 모두 붉은 꽃을 무서워한다. 붉은 꽃을 손에 들고도 데지 않고, 마음대로 피우고 끄는 짐승은 무엇이냐?', a: '사람', wrong: ['반딧불이', '흑표범', '물소'], mg: '붉은 꽃…! 불 말이구나. 바기라도 발루도 불만 보면 물러서는데… 반딧불이? 반딧불이는 작은 불이잖아!',
      why: '불을 피우고 다루는 것은 사람뿐이다. 정글의 짐승은 아무도 그렇게 하지 못한다.' }
  ];
  MG.RIDDLES = RIDDLES;

  MG.meet = async function () {
    var s = S(), o = st(), k = K(), pc = null;
    o.met = (o.met || 0) + 1;
    var women = MG.women(), w = women[0];
    try {
      pc = pic('mowgli_bananas', '바나나 도둑들');
      await narrate('숲길이 갑자기 소란스러워졌다. 머리 위 가지가 휘청이더니 주황빛 털북숭이 오랑우탄 대여섯이 짐 바구니로 뛰어내린다. 바나나를 한 아름씩 끌어안고 달아나려는 놈들 사이로— 맨발에 해진 천옷을 두른 검게 그을린 청년이 덩굴을 타고 내려와 바나나 한 송이를 낚아챈다.');
      await UI.say('하하! 이번엔 내가 먼저다, 털북숭이들아!', boy());
      await narrate('그 순간 덩치가 가장 큰 늙은 오랑우탄이 나무 밑동에 털썩 주저앉더니, 청년의 손목을 붙잡고 바나나를 빼앗는다. 그러고는 사람처럼 손가락을 까딱인다.');
      if (pc) { await pc.stop(); pc = null; }
      var A = ape();
      await UI.say('이 바나나는 저 사람들 것이다, 사람 새끼야. 늑대들은 너를 사람이라 하고, 사람들은 너를 늑대라 하지. 네가 정말 사람이라면— 내가 내는 수수께끼를 풀어 봐라. 풀면 바나나는 네 것, 못 풀면 너는 평생 우리와 나무 위에서 바나나나 줍는 거다.', A);
      await UI.say('…좋아! 나는 늑대 무리에서 정글의 법을 배웠어. 수수께끼쯤이야!', boy());
      var rd = RIDDLES[(o.met + (s.day % RIDDLES.length)) % RIDDLES.length];
      pc = pic('mowgli_riddle', '오랑우탄의 수수께끼');
      await UI.say(rd.q, A);
      await UI.say(rd.mg, boy());
      await UI.say('(머리를 감싸 쥐고 쪼그려 앉는다. 늑대에게 배운 것으로는 도무지 풀리지 않는 모양이다. 그러다 슬쩍 제독 쪽을 돌아본다.)', boy());
      if (pc) { await pc.stop(); pc = null; }
      var opts = U.shuffle([rd.a].concat(rd.wrong)), solved = false;
      for (var tries = 0; tries < 2 && !solved; tries++) {
        var v = await UI.ask((tries ? '틀렸다! 늙은 오랑우탄이 한 번만 더 기회를 준다. ' : '') + '청년에게 답을 귀띔해 줄까? — 「' + rd.q.replace(/\s+/g, ' ').slice(0, 46) + (rd.q.length > 46 ? '…' : '') + '」',
          opts.map(function (x) { return { label: '「' + x + '」라고 귀띔한다', value: x }; }), Object.assign(me(), { cancel: false }));
        await UI.say('…' + v + '! 답은 ' + v + U.jx(v, '이야/야') + '!', boy());
        if (v === rd.a) solved = true;
        else { await UI.say('우하하! 틀렸다, 틀렸어! 사람 새끼가 사람의 귀띔을 받고도 틀리다니!', A); opts = opts.filter(function (x) { return x !== v; }); }
      }
      if (!solved) {
        var lost = takeBananas(MG.bananas());
        await narrate('늙은 오랑우탄이 손뼉을 치자, 오랑우탄들이 남은 바나나' + (lost ? ' ' + lost + '개' : '') + '를 몽땅 끌어안고 나무 위로 올라간다. 청년은 어깨를 늘어뜨린 채 그 뒤를 따라 덩굴을 타고 숲 깊은 곳으로 사라졌다.');
        o.cool = s.day + (k.coolDays || 30); o.steal = 0; o.fails = (o.fails || 0) + 1;
        G.State.log('델리 근처 숲에서 바나나를 훔치는 오랑우탄들과 늑대 손에 자란 청년을 만났지만, 늙은 오랑우탄의 수수께끼를 풀지 못했다.');
        return false;
      }
      await UI.say('…' + rd.why, boy());
      await UI.say('흠. 풀었군. 하지만 네 머리로 푼 게 아니라 저 사람의 귀띔으로 푼 거다.', A);
      await UI.say('그, 그건…', boy());
      pc = pic('mowgli_human', '사람의 모습');
      await UI.say('부끄러워할 것 없다, 사람 새끼야. 늑대는 혼자 사냥하지 않고 무리로 사냥하지. 사람은 그보다 더하다. 모르는 것을 묻고, 남의 귀띔을 받아 함께 푸는 것— 사람이라면 다른 이에게 도움을 받는 것도 사람의 모습이란다. 너는 오늘 사람처럼 풀었다.', A);
      await narrate('청년은 한참 말없이 제 손바닥을 내려다보다가, 제독과 일행을 차례로 바라본다. 그러다 그의 눈길이 ' + G.MATE[w.id].name + '에게서 멈췄다. 귀까지 빨개진 그가 엉거주춤 바나나 한 송이를 내민다.');
      await UI.say('나… 나는 모글리야. 늑대 무리에서 자랐어. 사람이 되고 싶어. 사람의 말도, 사람이 사는 곳도 배우고 싶어.\f그리고 저… 저 사람은 누구야? 정글의 어떤 꽃보다— 아니, 붉은 꽃보다 더 눈이 부셔.', who());
      await UI.say(U.pick(['어머, 바나나를 주는 거예요? …고마워요, 모글리.', '후후, 정글에서는 그렇게 마음을 전하나요? 고마워요.', '…저, 저요? 바나나는 고맙게 받을게요.']), mateSp(w));
      await UI.say('하하! 사람 새끼가 사람 여자에게 반했구나! 가거라, 모글리. 사람이 되려면 사람들 곁으로 가야지. 바나나 몇 송이만 놓고 가면 우리는 그걸로 됐다.', A);
      if (pc) { await pc.stop(); pc = null; }
      // 떠나기 전, 자기를 키운 어미 늑대와의 작별 (Codex 장면 mowgli_farewell)
      pc = pic('mowgli_farewell', '어미 늑대와의 작별');
      await narrate('숲 가장자리에서 회갈색 늑대 한 마리가 그를 기다리고 있었다. 모글리는 무릎을 꿇고 어미 늑대와 이마를 맞댄 채 한참을 머물렀다. 이윽고 그가 환하게 웃으며 일어나, 제독이 내민 손을 잡았다.');
      if (pc) { await pc.stop(); pc = null; }
      var fee = takeBananas(k.fee || 3);
      var nm = G.Legend && G.Legend.join ? G.Legend.join(ID, G.CITY_DATA[K().city != null ? K().city : 145]) : null;
      if (!nm) { nm = { id: ID, role: 'none', joined: U.dateNum(s.date), loyal: 85 }; s.mates.push(nm); }
      nm.loyal = Math.max(nm.loyal || 0, 85);
      nm.mg = { days: 0 };
      o.done = s.day; o.crush = w.id; o.riddle = RIDDLES.indexOf(rd);
      G.State.log('델리 근처 숲에서 바나나를 훔치는 오랑우탄들과 늑대 손에 자란 청년 모글리를 만났다. 늙은 오랑우탄의 수수께끼를 함께 풀었고, 모글리는 사람이 되기 위해— 그리고 ' + G.MATE[w.id].name + '에게 반해서 동료가 되었다.' + (fee ? ' (오랑우탄들이 바나나 ' + fee + '개를 가져갔다)' : ''));
      UI.toast('모글리가 동료가 되었다 — 세공·사격·측량·조선기술 3 · 사람의 말은 ' + (k.langDays || 90) + '일 동안 익힌다', 'heart', 5200);
      if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(ID); } catch (e) { console.error(e); } }
      if (G.Game.refreshHud) G.Game.refreshHud();
      return true;
    } finally { if (pc) await pc.stop(); }
  };

  // ================================================================ 말 — 90일 동안 네 가지 말을 3단계까지
  MG.daily = function () {
    var m = row(ID), out = []; if (!m) return out;
    var t = m.mg || (m.mg = { days: 0 }), k = K(), days = k.langDays || 90, langs = k.langs || [8, 10, 12, 6];
    t.days = (t.days || 0) + 1;
    var lv = Math.min(3, Math.floor(3 * t.days / days));
    if (lv <= (t.lv || 0)) return out;
    t.lv = lv;
    m.lgx = m.lgx || {};
    langs.forEach(function (li) { m.lgx[li] = Math.max(m.lgx[li] || 0, lv); });
    var names = langs.map(function (li) { return G.LANGS[li]; }).join('·');
    out.push({ icon: 'book', text: lv >= 3 ? '모글리가 ' + names + '를 모두 능숙하게 하게 되었다. 「정글의 말보다 사람의 말이 훨씬 어려워. 그래도 이제는 다 알아들어!」'
      : '모글리가 ' + names + '를 ' + G.LANG_LV[lv] + ' 수준까지 익혔다. (함께 지낸 지 ' + t.days + '일)' });
    return out;
  };
  (function hookDaily() {
    var W = G.World; if (!W || W._mg) return;
    W._mg = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(MG.daily()); } catch (e) { console.error(e); } return out; };
  })();

  // ================================================================ 술집 주인의 귀띔 (인도의 항구·도시에서 한 번)
  async function hint(c) {
    var s = S(); if (!c || s.flags.mowgliHint || !MG.ready() || c.region !== 5) return;
    s.flags.mowgliHint = 1;
    var CC = G.Scenes.city, sp = { name: '술집 주인' };
    try { if (CC && CC.npc && CC.current && CC.current()) sp = CC.npc('tavernkeeper', '술집 주인'); } catch (e) { /* 도시 밖 */ }
    await UI.say('델리 근처 숲을 지나는 대상들이 바나나를 도둑맞는다더군. 범인은 주황빛 털의 오랑우탄 무리인데, 그 무리에 늑대 손에 자랐다는 사람 청년이 섞여 다닌다나.\f바나나를 넉넉히 싣고 그 숲을 걸어 보게. 그 청년은 여인을 보면 얼굴이 빨개진다던데— 일행에 아가씨가 있으면 더 쉽게 만날지도 모르지.', sp);
  }
  (function hookTavern() {
    var CC = G.Scenes && G.Scenes.city, B = CC && CC.B; if (!B || !B.tavern || MG._inst) return;
    MG._inst = true;
    var f = B.tavern.enter; if (typeof f !== 'function') return;
    B.tavern.enter = async function (c) {
      var r = await f.apply(this, arguments);
      try { if (r !== false && CC.current && CC.current() && CC.current().kind === 'tavern') await hint(c); } catch (e) { console.error(e); }
      return r;
    };
    for (var key in f) if (Object.prototype.hasOwnProperty.call(f, key)) B.tavern.enter[key] = f[key];
  })();
})(window.G = window.G || {});
