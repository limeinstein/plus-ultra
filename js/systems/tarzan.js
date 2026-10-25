/* 정글의 사내 — 타잔 (G.Tarzan) 2026-10-25 사용자 요청. 사람·조정값은 js/data/tarzan.js (G.BALANCE.tarzan)
   ■ 만남: 시에라리온 동쪽 정글(밀림·숲)에서 야영하며 「사냥한다」 (js/scenes/land.js 야영을 마친 뒤)
     · 짐승 떼가 덤벼든다(육상전) — 첫 차례가 끝나면 짐승들 뒤에서 무리를 이끄는 사람이 보인다 (halt)
     · 고른다: ① 계속 공격한다 → 다시 육상전. 그는 다쳐 밀림으로 사라진다 (coolAttack일 뒤 다시 만날 수 있다)
              ② 일기토로 사로잡는다 — 일행(제독이나 동료)에 의학을 아는 사람이 있을 때만. 이기면 상처를 치료해 주고,
                 짐승들이 다가와 그를 걱정한다. 지면 그는 밀림으로 사라진다 (coolLose일)
              ③ 설득한다 — 소지품 하나를 그에게 건넨다 (하나도 없으면 고를 수 없다)
     · 사로잡으면: 그는 자기 손과 우리 손을 번갈아 보며 자신이 사람이라는 것을 깨닫는다. 「함께 가지 않겠나?」 하고 묻자 본능처럼 고개를 끄덕이고 따라온다
   ■ 말: 사람의 말을 모른다 — 함께 지낸 지 muteDays(90)일이 지나야 말이 통한다. 그때까지 하는 말은 대화창에서 몸짓으로 나온다 (G.Tale.mime을 감싼다)
     90일째 되는 날 제독의 모국어를 익힌다 (m.lgx)
   ■ 배움: 함께 지낸 날(m.tz.days)마다, 제독과 동료들에게서 솜씨를 배운다 — learnMonths(36)달 동안 새 솜씨 learnSkills(9)가지가 3단계에 이른다.
     가르칠 사람이 가장 잘하는 솜씨부터 하나씩 익힌다 (가르칠 사람이 하나도 없는 솜씨는 배우지 못한다). 운용술·검술은 처음부터 3
   · 저장: s.tarzan = { met, cool, done, how } · 동료 줄 m.tz = { days, learned, list, spoke } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var TZ = G.Tarzan = {};
  var ID = 'tarzan', SIERRA = 91;
  function K() { return (G.BALANCE && G.BALANCE.tarzan) || {}; }
  function S() { return G.Game && G.Game.state; }
  function row(id) { var s = S(); return s ? s.mates.filter(function (x) { return x.id === id; })[0] || null : null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(ID, emo) : { name: G.MATE[ID].name, portrait: G.Scenes.mateSpec(ID), lang: 3 }; }
  function stranger() { var w = who(); return Object.assign({}, w, { name: '숲의 사내' }); }   // 이름을 알기 전
  function first() { return G.Scenes.mateSpeaker('first'); }
  function narrate(t) { return UI.say(t, {}); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  function st() { var s = S(); return s.tarzan || (s.tarzan = {}); }

  /** 아직 만날 수 있는가 */
  TZ.ready = function () {
    var s = S(); if (!s || !G.MATE[ID] || row(ID) || s.flags['gone_' + ID]) return false;
    var o = s.tarzan || {}; if (o.done) return false;
    return !(o.cool > s.day);
  };
  /** 시에라리온 동쪽의 정글인가 */
  TZ.jungle = function (lon, lat) {
    var c = G.CITY_DATA[SIERRA], b = K().box || {}; if (!c) return false;
    if (!(lon >= c.lon - 0.05 && lon <= c.lon + (b.east || 2.6) && lat >= (b.south || 7.2) && lat <= (b.north || 9.9))) return false;
    var t = G.Geo.terrain(lon, lat);
    return t === 'jungle' || t === 'forest';
  };
  /** 일행에 의학을 아는 사람이 있는가 (제독이나 동료) */
  TZ.medic = function () { var b = R.skillBest('med'); return b.lv >= 1 ? b : null; };
  /** 그에게 건넬 수 있는 소지품 (발견의 증거물은 빼고) */
  TZ.gifts = function () { return (S().player.items || []).filter(function (it) { return !(R.isProof && R.isProof(it)); }); };

  /** 야영을 마친 뒤 (js/scenes/land.js — v: 한 일) */
  TZ.onCamp = async function (v, lon, lat) {
    var s = S();
    if (v !== 'hunt' || !s || s.loc.mode !== 'land' || !TZ.jungle(lon, lat) || !TZ.ready()) return false;
    return TZ.meet();
  };

  TZ.meet = async function () {
    var s = S(), o = st(), K0 = K(), L = G.Scenes && G.Scenes.land, pc = null;
    o.met = (o.met || 0) + 1;
    try {
      await narrate('사냥감을 쫓아 덩굴이 늘어진 밀림 깊숙이 들어서자, 새소리가 뚝 끊겼다. 사방의 덤불이 동시에 흔들리더니— 사자와 하이에나가 이빨을 드러내고 뛰쳐나온다. 나무 위에서는 커다란 유인원들이 가지를 흔들며 울부짖는다!');
      pc = pic('tarzan_ambush', '밀림의 짐승 떼');
      await UI.say('짐승 떼다! 모두 둥글게 모여라! 총을 겨눠라!', first());
      if (pc) { await pc.stop(); pc = null; }
      var res = 'truce';
      if (L && L.landBattle) {
        res = await L.landBattle('밀림의 짐승 떼', K0.beasts || 10, true, { kind: 'beast', beast: ['lion', 'hyena'], leader: '숲의 사내', leaderLook: 'chief', flee: false,
          halt: { turn: K0.haltTurn || 1, banner: '사람이다!', text: '그때 나무 꼭대기에서 길게 울리는 외침이 들렸다. 짐승들이 일제히 공격을 멈추고 뒤로 물러선다.',
            after: '짐승 떼 한가운데, 덩굴을 타고 내려선 것은— 사람이었다.', toast: '짐승들을 이끄는 사람이 있다!' } });
      }
      if (res === 'lose' || res === 'flee') {
        await narrate('대원들이 짐승 떼에 밀려 야영지로 물러났다. 밀림 깊은 곳에서 길게 울리는 외침이 한 번 더 들리고는, 다시 조용해졌다.');
        o.cool = s.day + (K0.coolLose || 60);
        return false;
      }
      if (res === 'win') return await wounded(o, true);   // 첫 차례에 무리의 우두머리가 쓰러졌다
      pc = pic('tarzan_leader', '짐승들의 우두머리');
      await narrate('검은 피부와 짧게 곱슬거리는 머리, 드러낸 상체, 거친 풀과 가죽을 엮은 허리옷, 손에는 돌을 갈아 만든 칼. 사내는 고개를 약간 숙인 채 정면을 노려보며 사자의 갈기를 짚고 선다. 낮게 으르렁거리는 소리에 짐승들이 숨을 죽인다. 하지만 그 눈만은 분명 사람의 눈이다.');
      await UI.say('(이를 드러내고 가슴을 두드리며, 사냥감을 가리켰다가 우리를 가리킨다. 이 숲의 것을 건드리지 말라는 몸짓이다.)', stranger());
      await UI.say('제독, 사람입니다! 짐승들이 저자를 우두머리로 따릅니다. 어떻게 하시겠습니까?', first());
      if (pc) { await pc.stop(); pc = null; }
      var md = TZ.medic(), gifts = TZ.gifts();
      var v = await UI.ask('짐승들을 이끄는 사내가 앞을 막아섰다. 어떻게 할까?', [
        { label: '계속 공격한다', value: 'attack', icon: 'sword' },
        { label: md ? '일기토로 사로잡는다 (의학 ' + md.lv + ' — ' + (md.who || '제독') + U.jx(md.who || '제독', '이/가') + ' 상처를 돌본다)' : '일기토로 사로잡는다 — 다친 그를 돌볼 의원(의학)이 없다', value: 'duel', dis: !md, icon: 'sword' },
        { label: gifts.length ? '설득한다 — 소지품 하나를 건넨다' : '설득한다 — 건넬 소지품이 없다', value: 'talk', dis: !gifts.length, icon: 'people' }
      ], Object.assign(me(), { cancel: false }));
      if (v === 'duel' && md) return await duel(o, md);
      if (v === 'talk' && gifts.length) return await persuade(o);
      return await wounded(o, false);
    } finally { if (pc) await pc.stop(); }
  };

  // ① 계속 공격 — 그는 다쳐 사라진다
  async function wounded(o, already) {
    var s = S(), K0 = K(), L = G.Scenes && G.Scenes.land;
    if (!already) {
      await UI.say('총을 겨눠라! 저자가 우두머리다!', me());
      if (L && L.landBattle) await L.landBattle('숲의 사내와 짐승 떼', Math.max(4, Math.round((K0.beasts || 10) * 0.7)), true, { kind: 'beast', beast: ['lion', 'hyena'], leader: '숲의 사내', leaderLook: 'chief', flee: false });
    }
    await narrate('총성이 밀림을 흔들었다. 사내가 어깨를 감싸 쥐고 비틀거린다. 피가 흐르는 팔로 덩굴을 낚아채더니, 그는 짐승 같은 외침을 남기고 나무 사이로 날아가 사라졌다. 짐승들도 그 뒤를 따라 밀림 속으로 흩어졌다.');
    await UI.say('…다친 짐승은 다시 오지 않습니다. 다친 사람도요. 당분간 이 숲에서 그를 보기는 어렵겠습니다.', first());
    o.cool = s.day + (K0.coolAttack || 365); o.how = 'attack';
    G.State.log('시에라리온 동쪽 밀림에서 짐승 떼를 이끄는 사내와 싸웠다. 그는 다쳐 밀림 속으로 사라졌다.');
    return false;
  }

  // ② 일기토 — 이기면 치료하고, 짐승들이 그를 걱정한다
  async function duel(o, md) {
    var s = S(), K0 = K(), d = K0.duel || {};
    var sw = R.skillBest('sword'), px = sw.who ? s.mates.filter(function (m) { return G.MATE[m.id] && G.MATE[m.id].name === sw.who && m.id !== ID; })[0] : null;
    var v = await UI.ask('누가 그와 맞붙을까? (짐승들이 둥글게 둘러싼다)', [
      { label: '제독이 직접 맞선다', value: 1 },
      { label: px ? sw.who + '에게 맡긴다 (검술 ' + sw.lv + ')' : '맡길 검객이 없다', value: 2, dis: !px }
    ], Object.assign(me(), { cancel: false }));
    await narrate('제독이 손을 들자 대원들이 총을 내렸다. 사내도 무언가를 알아챈 듯 짐승들을 물리고, 둥글게 비운 풀밭 한가운데로 걸어 나온다.');
    var w = stranger();
    var foe = { name: '숲의 사내', portrait: w.portrait, look: 'brawler', style: 'bash', str: d.str || 92, atk: d.atk || 14, def: d.def || 6, skill: d.skill || 3, mar: d.mar || 93, int: d.int || 40, cha: d.cha || 30 };
    var res = await G.Games.duel(foe, v === 2 && px ? { mate: px, place: 'land' } : { place: 'land' });
    if (res !== 'win') {
      await narrate('사내의 주먹이 바람처럼 날아들었다. 정신을 차렸을 때, 그는 이미 덩굴을 타고 나무 위로 사라진 뒤였다. 멀리서 승리의 외침이 길게 울린다.');
      o.cool = s.day + (K0.coolLose || 60); o.how = 'lostDuel';
      G.State.log('시에라리온 동쪽 밀림에서 짐승들을 이끄는 사내와 일기토를 벌였으나 졌다. 그는 밀림으로 사라졌다.');
      return false;
    }
    var mdName = md.who || '제독', pc = null;
    try {
      await narrate('마침내 사내가 풀밭에 쓰러졌다. 이마가 찢어지고 팔에 깊은 상처가 났다. 그가 이를 드러내며 일어서려 하지만 다리가 말을 듣지 않는다.');
      await narrate(mdName + U.jx(mdName, '이/가') + ' 천천히 다가가 무릎을 꿇는다. ' + (md.lv >= 3 ? '상처를 깨끗이 씻어 꿰매고, 찧은 약초를 덮어 단단히 싸맨다. 열을 내리는 탕약도 입에 흘려 넣는다.' : md.lv >= 2 ? '상처를 씻어 약초를 붙이고 깨끗한 천으로 싸맨다.' : '서툰 손으로나마 상처를 씻고 천으로 감싼다.') + ' 사내는 으르렁거리다가— 아프지 않게 하려는 손길이라는 것을 알았는지, 이내 가만히 몸을 맡긴다.');
      pc = pic('tarzan_heal', '짐승들의 걱정');
      await narrate('그때 덤불이 갈라지며 짐승들이 하나둘 다가온다. 늙은 유인원이 사내의 이마를 쓰다듬고, 사자가 낮게 울며 그의 손을 핥는다. 하이에나들은 대원들 곁을 서성이면서도 감히 덤비지 않는다. 마치 우두머리가 무사한지 묻는 것 같다.');
      await UI.say('(다가온 짐승들의 머리를 하나하나 쓰다듬으며, 괜찮다는 듯 낮게 그르렁거린다.)', w);
      if (pc) { await pc.stop(); pc = null; }
      o.how = 'duel';
      return await capture(o);
    } finally { if (pc) await pc.stop(); }
  }

  // ③ 설득 — 소지품 하나를 건넨다
  async function persuade(o) {
    var s = S(), gifts = TZ.gifts();
    var v = await UI.choose('사내에게 무엇을 건넬까?', gifts.map(function (it, i) { return { label: R.itemName(it), value: i, thumb: G.Img && G.Img.itemSrc ? G.Img.itemSrc(it) : null }; }), { width: 460, cancel: false, text: '총을 내려놓고, 소지품 하나를 그의 발치에 놓는다. 무엇이든 그는 처음 보는 물건일 것이다.' });
    var it = gifts[v == null ? 0 : v] || gifts[0];
    var nm = R.itemName(it);
    var def = G.ITEM && G.ITEM[it.id], eq = s.player.equip;
    if (def && eq && (def.kind === 'weapon' || def.kind === 'armor') && eq[def.kind] === it.id && !s.player.items.some(function (x) { return x !== it && x.id === it.id; })) eq[def.kind] = null;
    R.removeItemObject(it);
    var pc = null;
    try {
      await narrate('제독은 총을 땅에 내려놓고 빈손을 펼쳐 보였다. 그리고 「' + nm + '」' + U.jx('「' + nm + '」', '을/를') + ' 천천히 그의 발치에 내려놓고 한 걸음 물러섰다.');
      pc = pic('tarzan_gift', '처음 보는 물건');
      await narrate('사내는 한참을 노려보다가 몸을 낮춰 다가온다. 물건의 냄새를 맡고, 뒤집어 보고, 햇빛에 비춰 보고, 이로 깨물어 본다. 그러다 문득 고개를 들어 제독을 바라본다. 으르렁거림이 멈췄다.');
      await UI.say('(물건을 가슴에 꼭 끌어안고, 제독을 향해 고개를 갸웃한다. 그러고는 짐승들에게 짧게 소리친다 — 짐승들이 하나둘 덤불 속으로 물러난다.)', stranger());
      if (pc) { await pc.stop(); pc = null; }
      o.how = 'gift'; o.gift = it.id;
      G.State.log('시에라리온 동쪽 밀림에서 짐승들을 이끄는 사내에게 「' + nm + '」' + U.jx('「' + nm + '」', '을/를') + ' 건넸다.');
      return await capture(o);
    } finally { if (pc) await pc.stop(); }
  }

  // 사로잡은 뒤 — 자신이 사람이라는 것을 깨닫고, 고개를 끄덕여 따라온다
  async function capture(o) {
    var s = S(), pc = null;
    try {
      pc = pic('tarzan_human', '나는 사람이다');
      await narrate('사내는 제독의 손을 오래 바라본다. 그리고 제 손을 펼쳐 본다. 다섯 손가락, 손톱, 손금— 털 많은 유인원의 손과도, 사자의 발과도 다르다. 그는 대원들 하나하나의 얼굴을 들여다보고, 물웅덩이에 비친 제 얼굴을 들여다본다. 똑같다.');
      await UI.say('(제 가슴을 짚었다가 제독의 가슴을 짚는다. 다시 제 가슴, 제독의 가슴. 목 안에서 말이 되지 못한 소리가 떨린다.)', stranger());
      await narrate('그의 목에는 낡은 가죽끈에 꿴 작은 금붙이가 걸려 있다. 문장이 새겨진 반지 — 오래전 이 해안에서 부서진 어느 배의 것이다. 젖먹이일 때부터 지녔을 그것이, 그가 짐승이 아니라 사람의 아이였다는 것을 말해 준다.');
      await UI.say('…너도 우리와 같은 사람이로구나. 바다 건너에 너와 같은 사람들이 사는 곳이 있다. 우리와 함께 가지 않겠나?', me());
      if (pc) { await pc.stop(); pc = null; }
      await narrate('말을 알아들었을 리 없다. 그런데도 사내는 숨을 고르더니— 본능처럼, 천천히 고개를 끄덕였다. 늙은 유인원이 그의 등을 한 번 두드리고 밀림 속으로 돌아간다. 사자가 길게 한 번 울었다.');
      var nm = G.Legend && G.Legend.join ? G.Legend.join(ID, G.CITY_DATA[SIERRA]) : null;
      if (!nm) { nm = { id: ID, role: 'none', joined: U.dateNum(s.date), loyal: 85 }; s.mates.push(nm); }
      nm.loyal = Math.max(nm.loyal || 0, 85);
      nm.tz = { days: 0, learned: 0, list: [] };
      o.done = s.day;
      G.State.log('시에라리온 동쪽 밀림에서 짐승들 손에 자란 사내를 만났다. 그는 자신이 사람이라는 것을 깨닫고 함께 가기로 했다. 대원들은 그를 「타잔」— 짐승들이 부르던 소리를 따라 그렇게 불렀다.');
      await UI.say('(이름을 묻자, 사내는 제 가슴을 두드리며 짐승들이 부르던 소리를 낸다 — 「타잔」.)', who());
      UI.toast('타잔이 동료가 되었다 — 운용술·검술 3 · 무력 93 · 말은 ' + (K().muteDays || 90) + '일 뒤에 통한다', 'heart', 5200);
      if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(ID); } catch (e) { console.error(e); } }
      if (G.Game.refreshHud) G.Game.refreshHud();
      return true;
    } finally { if (pc) await pc.stop(); }
  }

  // ================================================================ 말 — 함께 지낸 지 90일
  TZ.mute = function () {
    var m = row(ID); if (!m) return false;
    var t = m.tz || {}; return !t.spoke && (t.days || 0) < (K().muteDays || 90);
  };
  var GESTURE = [
    [/고마|감사/, '제 가슴을 두 번 두드리고, 당신의 어깨를 커다란 손으로 덥석 감싼다.'],
    [/미안|잘못/, '고개를 숙이고 낮게 그르렁거리며, 당신의 손등에 이마를 댄다.'],
    [/싫|안 돼|안돼|아니|그만/, '이를 드러내고 고개를 세차게 젓더니, 손바닥으로 땅을 탁 친다.'],
    [/먹|배고|고기|과일|요리/, '배를 두드리고, 무언가를 뜯어 먹는 시늉을 하며 눈을 빛낸다.'],
    [/싸우|적|칼|총|공격|덤벼/, '몸을 낮추고 으르렁거리며, 돌칼을 쥔 손을 앞으로 내민다.'],
    [/바다|배|돛|파도|섬|바람/, '돛대 꼭대기를 가리키고, 원숭이처럼 밧줄을 타고 오르는 시늉을 한다.'],
    [/\?/, '고개를 갸웃하며 당신 얼굴에 코를 바짝 대고 들여다본다.'],
    [/!/, '가슴을 두드리며 짧게 외치고, 제자리에서 펄쩍 뛰어오른다.']
  ];
  var GESTURE_ANY = ['당신을 빤히 바라보다가, 천천히 고개를 끄덕인다.', '입을 열어 무언가 말하려다, 대신 손짓으로 뜻을 그려 보인다.', '당신의 말을 따라 하려는 듯 입술을 달싹인다.', '낮게 그르렁거리며 당신 곁에 쪼그려 앉는다.'];
  function tarzanMime(raw, opts) {
    var d = G.MATE[ID]; if (!d || !opts || !(opts.name === d.name || opts.mateId === ID)) return null;
    var t = String(raw == null ? '' : raw).replace(/<[^>]+>/g, '').trim();
    if (!t || /^[(（]/.test(t) || !TZ.mute()) return null;
    var g = null; for (var i = 0; i < GESTURE.length && !g; i++) if (GESTURE[i][0].test(t)) g = GESTURE[i][1];
    if (!g) g = GESTURE_ANY[Math.abs(U.strHash(t)) % GESTURE_ANY.length];
    var gist = (t.match(/^[^.!?…。]*[.!?…。]?/) || [t])[0].trim(); if (gist.length > 40) gist = gist.slice(0, 38) + '…';
    return '<span class="mime">(' + U.esc(g) + ')</span><span class="mime-gist">몸짓으로 미루어 보면 — 「' + U.esc(gist) + '」</span>';
  }
  function hookMime() {
    var T = G.Tale; if (!T || T._tzMime) return;
    T._tzMime = true;
    var om = T.mime;
    T.mime = function (raw, opts) { var r = om ? om.apply(this, arguments) : null; return r || tarzanMime(raw, opts); };
  }

  // ================================================================ 배움 — 3년 동안 새 솜씨 9가지를 3단계까지
  function lvOf(m, id) { var d = G.MATE[ID]; return (m.sk && m.sk[id] != null ? m.sk[id] : (d.sk[id] || 0)) || 0; }
  /** 이 솜씨를 가르칠 수 있는 사람 (제독과 함께 있는 동료 가운데 가장 잘하는 사람) */
  TZ.teacher = function (id) {
    var s = S(), best = { lv: s.player.sk[id] || 0, who: R.fullName ? R.fullName() : s.player.name };
    s.mates.forEach(function (m) { if (m.id === ID || !G.MATE[m.id]) return; var lv = R.mateSkill(m, id); if (lv > best.lv) best = { lv: lv, who: G.MATE[m.id].name }; });
    return best;
  };
  /** 한 단계를 익힌다 — 익히던 솜씨가 3이 아니면 그것을, 아니면 가르칠 사람이 가장 잘하는 새 솜씨를 */
  TZ.learnOne = function (m) {
    var t = m.tz, d = G.MATE[ID], cap = K().learnSkills || 9;
    var cur = t.list[t.list.length - 1];
    if (!cur || lvOf(m, cur) >= 3) {
      if (t.list.length >= cap) return null;
      var cand = G.SKILLS.map(function (x) { return x.id; }).filter(function (id) { return !d.sk[id] && t.list.indexOf(id) < 0; })
        .map(function (id) { return { id: id, tc: TZ.teacher(id) }; }).filter(function (x) { return x.tc.lv >= 1; });
      if (!cand.length) return null;
      cand.sort(function (a, b) { return b.tc.lv - a.tc.lv; });
      cur = cand[0].id; t.list.push(cur);
    }
    var tc = TZ.teacher(cur);
    m.sk = m.sk || {}; m.sk[cur] = Math.min(3, lvOf(m, cur) + 1);
    t.learned = (t.learned || 0) + 1;
    var sn = (G.SKILLS.filter(function (x) { return x.id === cur; })[0] || {}).name || cur;
    return { icon: 'star', text: '타잔이 ' + tc.who + '에게서 ' + sn + U.jx(sn, '을/를') + ' 배웠다. 한 번 보면 따라 하고 두 번 보면 익힌다 — ' + sn + ' ' + m.sk[cur] + '단계' + (m.sk[cur] >= 3 ? ' (다 익혔다)' : '') };
  };
  /** 날마다 (G.World.daily를 감싼다) — 함께 지낸 날을 세고, 말과 솜씨를 익힌다 */
  TZ.daily = function () {
    var m = row(ID), out = []; if (!m) return out;
    var t = m.tz || (m.tz = { days: 0, learned: 0, list: [] }), Kc = K();
    t.days = (t.days || 0) + 1;
    // 말: 90일째에 제독의 말을 익힌다
    if (!t.spoke && t.days >= (Kc.muteDays || 90)) {
      t.spoke = U.dateNum(S().date);
      var li = R.nativeLang ? R.nativeLang(S().player.nation) : 0;
      m.lgx = m.lgx || {}; m.lgx[li] = Math.max(m.lgx[li] || 0, 2);
      out.push({ icon: 'heart', text: '타잔이 처음으로 사람의 말을 했다 — 「나… 타잔. 너… 친구.」 함께 지낸 지 ' + t.days + '일, 이제 ' + G.LANGS[li] + '로 뜻이 통한다.' });
    }
    // 솜씨: learnMonths달 동안 learnSkills × 3 단계
    var months = Math.min(Kc.learnMonths || 36, Math.floor(t.days / 30));
    var target = Math.floor((Kc.learnSkills || 9) * 3 * months / (Kc.learnMonths || 36));
    for (var guard = 0; (t.learned || 0) < target && guard < 30; guard++) { var n = TZ.learnOne(m); if (!n) break; out.push(n); }
    return out;
  };
  function hookDaily() {
    var W = G.World; if (!W || W._tz) return;
    W._tz = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(TZ.daily()); } catch (e) { console.error(e); } return out; };
  }

  // ================================================================ 술집 주인의 귀띔 (서아프리카 해안에서 한 번)
  async function hint(c) {
    var s = S(); if (!c || s.flags.tarzanHint || !TZ.ready()) return;
    if (!(c.region === 3 && c.lon < 0 && c.lat > 0)) return;
    s.flags.tarzanHint = 1;
    var CC = G.Scenes.city, sp = { name: '술집 주인' };
    try { if (CC && CC.npc && CC.current && CC.current()) sp = CC.npc('tavernkeeper', '술집 주인'); } catch (e) { /* 도시 밖 */ }
    await UI.say('시에라리온 동쪽 밀림에서 사냥하다 혼쭐이 난 사람들이 있다네. 사자와 하이에나가 한꺼번에 덤비는데, 그 뒤에서 웬 벌거벗은 사내가 짐승처럼 소리를 질러 무리를 부리더라는군.\f총으로 쫓아내 봐야 다시는 못 볼 테고… 붙잡으려면 맨손으로 겨루거나 마음을 사야겠지. 다친 짐승 같은 사람이라, 상처를 돌볼 의원이 있으면 모를까.', sp);
  }
  function hookTavern() {
    var CC = G.Scenes && G.Scenes.city, B = CC && CC.B; if (!B || !B.tavern || TZ._inst) return;
    TZ._inst = true;
    var f = B.tavern.enter; if (typeof f !== 'function') return;
    B.tavern.enter = async function (c) {
      var r = await f.apply(this, arguments);
      try { if (r !== false && CC.current && CC.current() && CC.current().kind === 'tavern') await hint(c); } catch (e) { console.error(e); }
      return r;
    };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) B.tavern.enter[k] = f[k];
  }
  hookMime(); hookDaily(); hookTavern();
})(window.G = window.G || {});
