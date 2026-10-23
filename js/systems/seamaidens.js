/* 남쪽 바다의 두 아가씨 — 떰과 마리아 (G.Tam · G.Maria) 2026-10-24 사용자 요청. 사람은 js/data/seamaidens.js
   ■ 떰 (베트남 옛이야기 「떰과 깜」)
     · 조건: 배에 옷감 교역품(면직물·견직물·중국 비단·인도 캘리코·린네르·모직물·편사)이 있고, 세공에 밝은 사람(제독이나 부하, 세공 1단계 이상)이 있을 때
             베트남 연안 바다(안남·참파 앞바다)에서 낚시를 하면 (js/games/fishing.js F.open이 끝난 뒤)
     · 흐름: 바닷가 갯벌에서 빈 바구니를 안고 우는 처녀 — 새동생 깜이 그녀가 잡은 새우와 물고기를 쏟아 가져갔고, 새어머니는 축제에 입고 갈 옷도 주지 않는다.
             배의 세공사가 옷감 한 통으로 옷을 지어 주면, 그녀는 그 옷을 들고 집으로 가 자신을 시기하던 새어머니와 깜에게 건넨다 → 동료로 합류
     · 지나치면 coolDays일 뒤 다시
   ■ 마리아 (필리핀)
     · 조건: 악어(crocodile)를 발견했고, 필리핀 섬에서 야영하며 「사냥한다」 (js/scenes/land.js 야영을 마친 뒤)
     · 흐름: 물가에서 커다란 악어와 싸움(육상전)이 붙고, 첫 차례가 끝나면 그녀가 「누노를 해치지 마세요!」 하고 끼어든다 → 제독도 싸움을 멈춘다
             악어가 물속에서 흑진주 둘을 물어 올려 마리아와 제독에게 건넨다 (제독: 아이템 buwaya_pearl) → 마리아가 보석을 지니고 합류
     · 에스파냐 사람들이 루손에 들어온 1565년 뒤부터 (마리아라는 세례명)
   · 장면 그림 (없으면 건너뜀): images/legend-events/tam_shore · tam_clothes · maria_crocodile · maria_pearl (SEA_MAIDENS_PROMPT.md)
   · 저장: s.tam / s.maria = { met, cool, done } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var K = { coolDays: 60, haltTurn: 1, croc: 8, minYearMaria: 1565 };   // croc: 싸움에 나오는 악어 수 — 첫 차례 안에 끝나지 않게
  var CLOTH = ['silk', 'cnsilk', 'cottoncloth', 'calico', 'linen', 'woolcloth', 'chintz'];   // 옷을 지을 수 있는 옷감 (융단은 빼고) — 값진 것부터 고른다
  function S() { return G.Game && G.Game.state; }
  function row(id) { return S().mates.filter(function (x) { return x.id === id; })[0] || null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function mate(id, emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id, emo) : { name: G.MATE[id].name, portrait: G.Scenes.mateSpec(id), lang: 3 }; }
  function first() { return G.Scenes.mateSpeaker('first'); }
  function narrate(t) { return UI.say(t, {}); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  function npc(name, key, role) {
    var A = G.Art;
    return { name: name, portrait: A.withImg(A.npcSpec('sm_' + key, role, 'se', 'f'), ['portraits/history/' + key, 'portraits/npc-roles/se/' + role]), half: ['portraits/history/' + key + '_half', 'portraits/npc-roles/se/' + role + '_half'], lang: 3 };
  }
  function ready(id, key, min) {
    var s = S(); if (!s || !G.MATE[id] || row(id) || s.flags['gone_' + id]) return false;
    var o = s[key] || {}; if (o.done) return false;
    if (min && s.date.y < min) return false;
    if (G.Wives && G.Wives.list && G.Wives.list().some(function (w) { return w.id === id; })) return false;
    return !(o.cool > s.day);
  }
  async function join(id, key, logText) {
    var s = S(), nm = G.Legend && G.Legend.join ? G.Legend.join(id, null) : null;
    if (!nm) { s.mates.push({ id: id, role: 'none', joined: U.dateNum(s.date), loyal: 85 }); }
    (s[key] = s[key] || {}).done = s.day;
    G.State.log(logText);
    if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(id); } catch (e) { console.error(e); } }
    if (G.Game.refreshHud) G.Game.refreshHud();
  }

  // ================================================================ 떰
  var TM = G.Tam = { K: K, CLOTH: CLOTH };
  /** 베트남 연안의 바다인가: 통킹만에서 메콩 어귀까지, 뭍에서 1.2° 안 (하이난 섬 앞바다는 빼고) */
  TM.vietCoast = function (lon, lat) {
    if (!(lon >= 104.3 && lon <= 109.8 && lat >= 8.3 && lat <= 21.7)) return false;
    if (lat > 17.8 && lon > 108.4) return false;                       // 하이난 섬 서쪽 바다
    if (!G.Geo || !G.Geo.sdf) return true;
    if (G.Geo.sdf(lon, lat) > 0.05) return false;                        // 바다여야 한다
    for (var rr = 0.4; rr <= 1.21; rr += 0.4) for (var a = 0; a < 8; a++) {   // 1.2° 안에 뭍이 있다 (연안)
      if (G.Geo.sdf(lon + Math.cos(a * Math.PI / 4) * rr, lat + Math.sin(a * Math.PI / 4) * rr) > 0) return true;
    }
    return false;
  };
  /** 배에 실린 옷감 가운데 가장 값진 것 (없으면 null) */
  TM.cloth = function () {
    var c = S().fleet.cargo || {}, best = null;
    CLOTH.forEach(function (id) { if (c[id] && c[id].q >= 1 && G.GOOD[id] && (!best || G.GOOD[id].p > G.GOOD[best].p)) best = id; });
    return best;
  };
  /** 세공에 밝은 사람 (제독 포함) — { who, lv } */
  TM.tailor = function () { var b = R.skillBest ? R.skillBest('craft') : { who: null, lv: R.skill('craft') }; return b && b.lv >= 1 ? b : null; };
  TM.ready = function () { return ready('tam', 'tam'); };
  /** 낚시를 마친 뒤 (js/games/fishing.js) */
  TM.afterFish = async function () {
    var s = S(); if (!s || s.loc.mode !== 'sea' || !TM.ready() || !TM.vietCoast(s.loc.lon, s.loc.lat)) return false;
    var cl = TM.cloth(), tl = TM.tailor();
    if (!cl || !tl) {
      // 옷감이나 세공사가 없다 — 한 번만 귀띔
      if (!s.flags.tamRumor) { s.flags.tamRumor = 1; UI.toast('갯벌에서 빈 바구니를 안고 우는 처녀가 보였다. 해진 옷자락을 여미며 마을 쪽으로 돌아간다. — 옷감과 바느질 솜씨가 있었다면…', 'fish', 6000); }
      return false;
    }
    return TM.meet(cl, tl);
  };
  TM.meet = async function (cl, tl) {
    var s = S(), o = s.tam = s.tam || {}, pc = null, gname = G.GOOD[cl].name;
    o.met = (o.met || 0) + 1;
    var STEP = npc('새어머니', 'tam_stepmother', 'merchant'), CAM = npc('깜', 'tam_cam', 'maid');
    try {
      await narrate('낚싯줄을 거두는데, 가까운 갯벌에서 흐느끼는 소리가 들린다. 바지를 걷어 올린 처녀 하나가 텅 빈 대바구니를 안고 앉아 있다. 바구니 바닥에는 작은 망둑어 한 마리만 남았다.');
      pc = pic('tam_shore', '갯벌의 빈 바구니');
      await UI.say('새어머니가 바구니를 가득 채워 오는 딸에게 붉은 앞치마를 주겠다고 했어요. 저는 새벽부터 새우와 조개를 가득 잡았는데… 동생 깜이 「언니, 머리에 진흙이 묻었어, 가서 씻고 와」 하더니, 제가 갯물에 머리를 감는 사이에 제 새우와 조개를 자기 바구니에 쏟아 가 버렸어요.', mate('tam'));
      await UI.say('이제 곧 마을에 임금님 행차와 축제가 있어요. 깜은 새 옷을 입고 가겠지요. 저는 이 해진 옷밖에 없어서… 새어머니는 집에서 쌀과 겨나 고르라고 하세요.', mate('tam'));
      await UI.say('제독, 우리 배에 ' + gname + U.jx(gname, '이/가') + ' 실려 있습니다. ' + (tl.who && tl.who !== s.player.name ? tl.who + U.jx(tl.who, '이/가') + ' 바느질 솜씨가 좋으니' : '제독의 세공 솜씨라면') + ' 하룻밤이면 한 벌 지을 수 있겠습니다.', first());
      if (pc) { await pc.stop(); pc = null; }
      var v = await UI.ask('갯벌의 처녀에게 옷을 지어 줄까? (' + gname + ' 1통)', [
        { label: '옷감을 내어 옷을 지어 준다', value: 1, icon: 'heart' },
        { label: '그냥 지나간다', value: 0 }], me());
      if (!v) {
        await narrate('처녀는 고개를 숙여 인사하고, 망둑어 한 마리가 든 바구니를 안고 마을 쪽으로 걸어갔다.');
        o.cool = s.day + K.coolDays;
        G.State.log('안남 바닷가에서 빈 바구니를 안고 우는 처녀를 보고 지나쳤다.');
        return false;
      }
      // 옷감 한 통을 쓴다 (산 곳 기록도 함께 줄인다)
      var cg = s.fleet.cargo[cl];
      if (R.takeCargoLots) R.takeCargoLots(cg, null, 1, 0);   // 산 곳 기록에서 한 통 덜기 (큰 몫부터)
      cg.q -= 1; if (cg.q <= 0) delete s.fleet.cargo[cl];
      await narrate((tl.who && tl.who !== s.player.name ? tl.who : '제독') + U.jx(tl.who && tl.who !== s.player.name ? tl.who : '제독', '이/가') + ' 갑판에 ' + gname + U.jx(gname, '을/를') + ' 펼쳤다. 등불 아래 가위와 바늘이 밤새 오갔다. 새벽녘, 길게 트인 웃옷과 바람에 나부끼는 바지, 머리에 두를 비단 수건이 차곡차곡 개켜졌다.');
      pc = pic('tam_clothes', '갑판에서 지은 옷');
      await UI.say('이렇게 고운 옷은 처음이에요… 손이 떨려서 만지지도 못하겠어요.', mate('tam', 'happy'));
      await UI.say('그런데요, 제독. 이 옷은 새어머니께 드리고 싶어요. 남은 천으로 깜의 옷도 한 벌 지어 주실 수 있을까요? 저는… 이 해진 옷으로도 괜찮아요.', mate('tam'));
      await narrate('처녀는 옷 보따리를 안고 바닷가 마을의 대나무 울타리 집으로 갔다. 선원 몇이 그 뒤를 따랐다.');
      if (pc) { await pc.stop(); pc = null; }
      await UI.say('떰이냐? 바구니는 어디 두고 웬 보따리를 들고 오느냐. 쌀과 겨는 다 골라 놓았느냐?', STEP);
      await UI.say('어머니, 이건 어머니 옷이에요. 그리고 깜, 이건 네 거야. 축제에 같이 입고 가렴.', mate('tam'));
      await UI.say('…언니가? 내가 언니 바구니를 쏟아 갔는데? …왜 나한테 이런 걸 줘?', CAM);
      await UI.say('네가 미워서 울었던 게 아니야. 다들 축제에 가는데 나만 못 가는 게 서러웠을 뿐이야. 이제 나는 바다로 나가서, 내 바구니를 내 손으로 채울 거야.', mate('tam'));
      await UI.say('…… 바다로 간다고? 저 이방인들의 배를 타고? …그래, 가거라. 이 집에는 네가 짠 베가 아직 남아 있으니, 그걸로 버티마.', STEP);
      await narrate('새어머니는 끝내 고맙다는 말을 하지 못했다. 깜은 새 옷을 꼭 끌어안은 채 울타리 밖까지 따라 나와 언니의 뒷모습을 오래 바라보았다.');
      await UI.say('저는 베를 짜고 옷을 지을 줄 알아요. 장에서 물고기 값을 셈하는 것도, 조각배로 물때를 타는 것도요. 배에 태워 주세요. 이번에는 제 바구니를 제가 채우고 싶어요.', mate('tam', 'happy'));
      if (!(await UI.ask('떰이 배에 오르고 싶어 한다. (세공·회계·항해술 3 · ' + G.wageNote('tam') + ')', [{ label: '함께 가자', value: 1, icon: 'people' }, { label: '마을에 남게 한다', value: 0 }], me()))) {
        await UI.say('…네. 그럼 저는 다시 갯벌로 나갈게요. 언젠가 또 이 바닷가를 지나가시면 손을 흔들어 주세요.', mate('tam'));
        o.cool = s.day + K.coolDays;
        return false;
      }
      await join('tam', 'tam', '안남 바닷가에서 새어머니와 동생 깜의 구박을 받던 처녀 떰에게 ' + gname + '으로 옷을 지어 주었다. 떰은 그 옷을 새어머니와 깜에게 건네고 동료가 되었다.');
      UI.toast('떰이 동료가 되었다 — 세공·회계·항해술 3', 'heart', 4600);
      return true;
    } finally { if (pc) await pc.stop(); }
  };

  // ================================================================ 마리아
  var MR = G.Maria = { K: K };
  /** 필리핀 섬의 뭍인가 (보르네오 북쪽 사바는 빼고, 팔라완은 넣는다) */
  MR.philippines = function (lon, lat) {
    if (!(lat >= 4.8 && lat <= 19.8 && lon >= 116.9 && lon <= 126.8)) return false;
    if (lon < 119.6 && lat < 8.3) return false;                          // 보르네오 북쪽
    return true;
  };
  MR.ready = function () { return ready('maria', 'maria', K.minYearMaria) && !!(G.Disc && G.Disc.foundByMe('crocodile')); };
  /** 야영을 마친 뒤 (js/scenes/land.js — v: 한 일) */
  MR.onCamp = async function (v, lon, lat) {
    var s = S();
    if (v !== 'hunt' || !s || s.loc.mode !== 'land' || !MR.philippines(lon, lat)) return false;
    if (!MR.ready()) {
      if (!s.flags.mariaRumor && !G.Disc.foundByMe('crocodile') && ready('maria', 'maria', K.minYearMaria)) {
        s.flags.mariaRumor = 1;
        UI.toast('물가에서 통나무 같은 것이 스르르 물속으로 사라졌다. 마을 사람들은 그것을 「누노(할아버지)」라 부르며 함부로 사냥하지 말라고 했다. — 그 짐승이 무엇인지 알았더라면…', 'eye', 6500);
      }
      return false;
    }
    return MR.meet();
  };
  MR.meet = async function () {
    var s = S(), o = s.maria = s.maria || {}, pc = null, L = G.Scenes && G.Scenes.land;
    o.met = (o.met || 0) + 1;
    try {
      await narrate('사슴을 쫓아 물가 갈대숲에 들어선 순간, 물 위에 떠 있던 통나무가 눈을 떴다. 배를 두 척 이은 것만 한 악어가 진흙을 튀기며 뭍으로 올라오고, 갈대숲 곳곳에서 작은 악어들이 뒤따라 기어 나온다!');
      pc = pic('maria_crocodile', '물가의 누노');
      await UI.say('악어다! 모두 창과 총을 들어라! 물러서면 물속으로 끌려간다!', first());
      if (pc) { await pc.stop(); pc = null; }
      var res = 'truce';
      if (L && L.landBattle) {
        res = await L.landBattle('물가의 악어', K.croc, true, { kind: 'beast', beast: ['crocodile', 'boar'],
          halt: { turn: K.haltTurn, banner: '해치지 마세요!', text: '그때 갈대숲을 헤치고 한 처녀가 뛰어들어 악어 앞을 두 팔로 막아섰다. 「누노를 해치지 마세요!」',
            after: '처녀가 악어 앞에 무릎을 꿇자, 제독도 손을 들어 대원들을 물렸다.', toast: '마리아가 싸움을 멈추게 했다.' } });
      }
      pc = pic('maria_pearl', '누노의 선물');
      await narrate(res === 'truce' ? '창끝이 멈췄다. 처녀가 악어의 코끝에 이마를 대고 무어라 속삭이자, 성난 숨을 몰아쉬던 짐승이 천천히 입을 다물었다.'
        : '싸움이 끝나 갈 무렵, 갈대숲에서 한 처녀가 뛰어나와 악어 앞을 막아섰다. 제독은 대원들에게 창을 거두라고 일렀다.');
      await UI.say('누노를 해치지 마세요. 이분은 우리 할아버지들의 넋이 깃든 분이에요. 사냥감을 빼앗겨서 화가 나셨을 뿐이에요.', mate('maria'));
      await UI.say('…할아버지라고? 우리는 사슴을 쫓다가 이 짐승의 물가를 침범한 모양이군. 모두 무기를 내려라.', me());
      await narrate('악어는 한참 제독을 바라보더니 물속으로 미끄러져 들어갔다. 물결이 잦아들 무렵, 다시 떠오른 악어의 입에 검게 빛나는 구슬 두 알이 물려 있었다. 악어는 그것을 처녀와 제독의 발치에 차례로 내려놓고 깊은 물로 사라졌다.');
      var got = R.addItem ? R.addItem('buwaya_pearl') : false;
      await UI.say('흑진주예요! 호수 바닥에 가라앉은 옛 배의 보물이라고 할머니가 그러셨어요. 누노가 당신에게도 하나 주셨네요. 창을 거둔 사람에게만 주시는 선물이에요.', mate('maria', 'happy'));
      UI.toast(got !== false ? '누노의 흑진주를 얻었다.' : '소지품이 가득 차 누노의 흑진주를 마리아가 맡아 두었다.', 'ring', 4600);
      if (got === false) o.pearlKept = 1;
      if (pc) { await pc.stop(); pc = null; }
      await UI.say('저는 마리아예요. 세례를 받을 때 신부님이 지어 주신 이름이지요. 할머니에게서 숲과 물가 짐승들의 이름을 배웠고, 조개와 진주를 깎아 장신구를 만들어요.', mate('maria'));
      await UI.say('누노가 진주를 나눠 준 사람과 함께라면 바다 건너도 무섭지 않을 것 같아요. 이 진주를 지니고 가서, 당신들의 나라 사람들에게도 이 섬의 짐승과 사람들 이야기를 들려주고 싶어요.', mate('maria'));
      if (!(await UI.ask('마리아가 함께 가고 싶어 한다. (세공·과학·웅변 3 · ' + G.wageNote('maria') + ')', [{ label: '함께 가자', value: 1, icon: 'people' }, { label: '섬에 남게 한다', value: 0 }], me()))) {
        await UI.say('…알겠어요. 누노와 함께 기다릴게요. 다시 이 물가에 오시면 이번에는 사냥 말고 이야기를 하러 오세요.', mate('maria'));
        o.cool = s.day + K.coolDays;
        return false;
      }
      await join('maria', 'maria', '필리핀 섬의 물가에서 악어 「누노」와 싸우다 처녀 마리아의 말에 창을 거두었다. 악어가 흑진주를 건넸고, 마리아가 진주를 지니고 동료가 되었다.');
      UI.toast('마리아가 동료가 되었다 — 세공·과학·웅변 3', 'heart', 4600);
      return true;
    } finally { if (pc) await pc.stop(); }
  };

  // ================================================================ 술집 주인의 귀띔 (한 번씩)
  async function hint(c) {
    var s = S(); if (!c || c.region !== 8) return;
    var CC = G.Scenes.city, sp = { name: '술집 주인' };
    try { if (CC && CC.npc && CC.current && CC.current()) sp = CC.npc('tavernkeeper', '술집 주인'); } catch (e) { /* 도시 밖 */ }
    if (!s.flags.tamHint && TM.ready() && c.lon >= 104 && c.lon <= 110 && c.lat >= 8 && c.lat <= 23) {
      s.flags.tamHint = 1;
      await UI.say('안남 바닷가에 떰이라는 처녀가 있다네. 새어머니와 동생 깜에게 구박을 받으면서도 날마다 갯벌에서 새우를 잡지.\f고운 옷감과 바느질 솜씨가 있는 배라면, 그 앞바다에서 낚싯줄을 드리우다 그 처녀를 만날지도 모르겠군.', sp);
    } else if (!s.flags.mariaHint && ready('maria', 'maria', K.minYearMaria) && c.lon >= 110) {
      s.flags.mariaHint = 1;
      await UI.say('루손 섬 사람들은 악어를 「누노」, 할아버지라 부른다네. 함부로 사냥했다간 큰일 나지.\f그 섬 물가에서 사냥하다 악어와 맞닥뜨리면, 악어를 감싸는 처녀가 나타난다는 이야기가 있어. 악어가 어떤 짐승인지 아는 사람에게만 그런다더군.', sp);
    }
  }
  (function install() {
    var CC = G.Scenes && G.Scenes.city, B = CC && CC.B; if (!B || !B.tavern || G.Tam._inst) return;
    G.Tam._inst = true;
    var f = B.tavern.enter; if (typeof f !== 'function') return;
    B.tavern.enter = async function (c) {
      var r = await f.apply(this, arguments);
      try { if (r !== false && CC.current && CC.current() && CC.current().kind === 'tavern') await hint(c); } catch (e) { console.error(e); }
      return r;
    };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) B.tavern.enter[k] = f[k];
  })();
})(window.G = window.G || {});
