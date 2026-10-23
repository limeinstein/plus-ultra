/* 나폴레옹과 조제핀 (G.Napoleon) 2026-10-23 사용자 요청. 사람은 js/data/napoleon.js
   ① 1510년부터 코르시카 바다(BOX)에서 해적을 만나 「포격으로」 이기면 (적함을 가라앉혀 이겼고, 백병전으로 빼앗지는 않았을 때)
      바다에 빠진 소년 나폴레옹을 건진다. 해적이 그의 가족을 사로잡아 갔다 — 그는 배에 손님으로 남는다 (phase 'rescued').
   ② 그 뒤 어느 바다에서든 해적을 만나 「백병전으로」 이기면 (적함을 하나라도 빼앗으면) 짐칸에 갇힌 그의 가족을 구한다.
      나폴레옹은 제독을 따라 바다 사나이가 되기로 한다 → 동료 (phase 'joined'). 포격으로만 이기면 「배에 올라야 했다」는 귀띔.
   ③ 그를 데리고 오스트리아 도시(그 해의 주인이 오스트리아 — 빈 등)에 들어서면 살롱에서 조제핀 드 보아르네를 만난다. 나폴레옹은 한눈에 빠지고 조제핀은 그를 놀리듯 꼬신다.
      사흘 뒤 나폴레옹이 제독의 물건(가장 값진 장신구, 없으면 값진 물건, 그것도 없으면 금화 주머니)을 몰래 훔쳐 바치려다 들킨다 → 일기토.
      이기면 물건을 되찾고 나폴레옹은 앞으로 제독을 따르기로 결심한다(충성 100). 조제핀도 제독에게 반해 함께 동료가 된다 (phase 'done').
      지면 조제핀이 물건을 돌려주며 웃는다 — 다음에 오스트리아 도시에 들르면 나폴레옹이 다시 겨루자고 한다 (phase 'met').
   · 장면 그림 (없으면 건너뜀): images/legend-events/napoleon_rescue · napoleon_family · josephine_salon · napoleon_duel — 주문서 images/legend-events/NAPOLEON_PROMPT.md
   · 저장: s.napo = { phase: 'rescued'|'joined'|'met'|'done', at: 날번호, stole: {물건 또는 gold}, lost: 진 횟수 }, tell: 해전 결과 창 뒤에 펼칠 장면 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var NP = G.Napoleon = {};
  var NAP = 'napoleon', JOS = 'josephine';
  var BOX = [7.6, 10.4, 40.7, 43.6];   // 코르시카 섬 둘레 바다 [서경, 동경, 남위, 북위]
  NP.BOX = BOX;
  NP.FROM = 1510;
  function S() { return G.Game && G.Game.state; }
  function st() { var s = S(); return s.napo || (s.napo = {}); }
  NP.state = st;
  function row(id) { return S().mates.filter(function (x) { return x.id === id; })[0] || null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function sp(id, emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id, emo) : { name: G.MATE[id].name, portrait: G.Art.mateSpec(id), lang: 3 }; }
  function familySp(id, name, gender) {
    var key = 'portraits/legendary/' + id;
    var fallback = G.Art && G.Art.npcSpec ? G.Art.npcSpec('napoleon:' + id, 'noble', 'it', gender) : null;
    return { name: name, portrait: G.Art && G.Art.withImg ? G.Art.withImg(fallback, [key]) : fallback, half: [key + '_half'], lang: 3, special: true };
  }
  function first() { return G.Scenes.mateSpeaker('first'); }
  function narrate(t) { return UI.say(t, {}); }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : { stop: function () { return Promise.resolve(); } }; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { await pc.stop(); } }
  function owner(c) { return R.cityOwner ? R.cityOwner(c) : c.nation; }
  NP.inBox = function (lon, lat) { return lon >= BOX[0] && lon <= BOX[1] && lat >= BOX[2] && lat <= BOX[3]; };
  NP.isAustria = function (c) { return !!c && owner(c) === '오스트리아'; };
  function gone(id) { return !!S().flags['gone_' + id]; }

  // ================================================================ 해전 뒤 (js/scenes/battle.js finish — 이겼을 때)
  /** 어떻게 이겼나: 'gun' 포격(가라앉혔고 빼앗은 배 없음) · 'board' 백병전(빼앗은 배가 있다) · null */
  function howWon(ships) {
    var en = (ships || []).filter(function (b) { return b.side === 'en'; });
    if (en.some(function (b) { return b.captured; })) return 'board';
    if (en.some(function (b) { return b.sunk; })) return 'gun';
    return null;
  }
  NP.howWon = howWon;
  NP.afterBattle = function (npc, res, ships, lines) {
    var s = S(), p = st(); if (!s || !npc || npc.kind !== 'pirate' || res !== 'win' || p.phase === 'done') return;
    if (!G.MATE[NAP] || gone(NAP)) return;
    var how = howWon(ships), l = s.loc || {};
    if (!p.phase) {
      if (s.date.y < NP.FROM || !NP.inBox(l.lon, l.lat)) return;
      if (how === 'gun') { p.tell = 'rescue'; if (lines) lines.push('<b>가라앉는 해적선 둘레의 바다에서 누군가 손을 흔든다…</b>'); }
      return;
    }
    if (p.phase === 'rescued') {
      if (how === 'board') { p.tell = 'family'; if (lines) lines.push('<b>빼앗은 해적선 짐칸 쪽에서 사람 소리가 들린다…</b>'); }
      else if (how === 'gun' && !p.hint) { p.hint = 1; p.tell = 'hint'; }
    }
  };
  /** 해전 결과 창 뒤에 */
  NP.tell = async function () {
    var p = st(); if (!p || !p.tell) return false;
    var t = p.tell; p.tell = null;
    if (t === 'rescue') await rescue();
    else if (t === 'family') await family();
    else if (t === 'hint') await UI.say('…해적선이 가라앉아 버렸습니다. 어머니와 형제들이 저런 배 짐칸에 갇혀 있을지도 모르는데. 제독, 다음에는 배에 올라 주십시오 — 백병전으로요.', sp(NAP, 'sad'));
    return true;
  };
  async function rescue() {
    var s = S(), p = st();
    await withPic('napoleon_rescue', '부서진 돛대에 매달린 소년', async function () {
      await narrate('포연이 걷힌 코르시카 앞바다. 부서진 돛대 조각에 매달린 소년 하나가 파도에 떠밀려 온다. 선원들이 밧줄을 던져 끌어올린다.');
      await UI.say('제독, 아이입니다! 열 몇 살쯤… 해적선에서 뛰어내린 모양입니다. 숨은 붙어 있습니다!', first());
      await narrate('소년은 바닷물을 토해 내더니, 젖은 머리를 쓸어 넘기고 제독을 똑바로 올려다본다. 작은 몸에 눈빛만은 대포알처럼 단단하다.');
      await UI.say('…나폴레오네. 아작시오의 보나파르트 집안 둘째요. 고맙소, 바다의 제독.\f저 해적들이 우리 집 배를 덮쳤소. 어머니 레티치아와 형 조제프, 동생들까지 다 짐칸에 실려 갔소. 나는 칼을 들고 덤볐다가 바다에 내던져졌지.', sp(NAP));
      await UI.say('당신 대포는 대단하더군. 바람 아래에서 세 발로 저 배의 돛대를 꺾었지. …부탁이오. 해적은 이 바다에 또 나타날 거요. 그때 이번에는 배에 올라타 주시오. 가족이 그 짐칸에 있을지 모르니.', sp(NAP));
    });
    p.phase = 'rescued'; p.at = s.day;
    G.State.log('코르시카 앞바다에서 해적을 포격으로 무찌르고, 바다에 빠진 소년 나폴레옹 보나파르트를 건졌다. 해적이 그의 가족을 사로잡아 갔다고 한다.');
    UI.toast('나폴레옹이 손님으로 배에 남았다 — 다시 해적을 만나 백병전으로 이기면 가족을 찾을 수 있다', 'people', 6500);
    G.Fame.add('so', 30);
  }
  async function family() {
    var s = S(), p = st();
    await withPic('napoleon_family', '짐칸의 보나파르트 가족', async function () {
      await narrate('빼앗은 해적선의 짐칸 문을 부수자 어둠 속에서 쇠사슬 소리가 난다. 검은 옷의 부인이 아이들을 품에 안고 고개를 든다.');
      await UI.say('어머니!', sp(NAP, 'happy'));
      await UI.say('나폴레오네…! 살아 있었구나. 하느님, 감사합니다. …이분이 너를 건져 주신 분이냐?', familySp('letizia_bonaparte', '레티치아 보나파르트', 'f'));
      await UI.say('보나파르트 집안은 은혜를 잊지 않습니다, 제독. 이 아이 아버지가 살아 있었다면 무릎을 꿇었을 겁니다.', familySp('letizia_bonaparte', '레티치아 보나파르트', 'f'));
      await UI.say('나폴레오네, 네가 바다로 떨어지는 걸 보고 끝인 줄 알았다. …동생들은 내가 지켰다. 이제 네가 어머니를 안심시켜 드려라.', familySp('joseph_bonaparte', '조제프 보나파르트', 'm'));
      await UI.say('(동생들을 안아 주고 나서, 한참 바다를 바라보다가) …어머니, 저는 아작시오로 돌아가지 않겠습니다.\f제독, 나는 이번에 알았소. 섬에 앉아 있으면 해적이 와도 기다리는 수밖에 없소. 바다를 아는 사람만이 바다에서 가족을 지킬 수 있소.\f나를 데려가 주시오. 대포라면 누구보다 빨리 배우겠소. 오늘부터 나는 바다 사나이요!', sp(NAP));
    });
    var nmRow = G.Legend && G.Legend.join ? G.Legend.join(NAP, null) : null;
    p.phase = 'joined'; p.at = s.day;
    G.State.log('해적을 백병전으로 무찌르고 짐칸에 갇혀 있던 나폴레옹의 가족을 구했다. 가족은 코르시카로 가는 배에 태워 보냈다. 나폴레옹이 바다 사나이가 되겠다며 동료가 되었다.');
    G.Fame.add('so', 80); G.Fame.add('bt', 40);
    if (nmRow) {
      UI.toast('나폴레옹 보나파르트 — 동료가 되었다 (' + G.wageNote(NAP) + ')', 'heart', 5000);
      if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(NAP); } catch (e) { console.error(e); } }
    }
  }

  // ================================================================ 오스트리아의 살롱 (도시에 들어설 때 — js/scenes/city.js)
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? G.CITY_DATA[s.loc.city] : null; }
  NP.pending = function () {
    var s = S(), p = s && s.napo; if (!p || (p.phase !== 'joined' && p.phase !== 'met')) return false;
    if (!row(NAP) || !NP.isAustria(cityNow())) return false;
    if (p.phase === 'met' && p.at === s.day) return false;
    return true;
  };
  NP.check = async function () {
    if (NP._busy) return false; NP._busy = true;
    try { var p = st(); if (p.phase === 'joined') await salon(); else if (p.phase === 'met') await rematch(); }
    catch (e) { console.error(e); }
    NP._busy = false; return true;
  };
  /** 훔칠 물건: 가장 값진 장신구(약속 반지 빼고) → 값진 물건(증거·장비 중인 것 빼고) → 금화 주머니 */
  function loot() {
    var s = S(), pl = s.player, eq = pl.equip || {};
    var items = pl.items.filter(function (it) { var d = G.ITEM[it.id]; return d && !(R.isProof && R.isProof(it)) && eq.weapon !== it.id && eq.armor !== it.id; });
    var price = function (it) { return (G.ITEM[it.id].price || 0); };
    var gift = items.filter(function (it) { var d = G.ITEM[it.id]; return d.kind === 'gift' && !d.ring; }).sort(function (a, b) { return price(b) - price(a); })[0];
    var any = items.filter(function (it) { return price(it) > 0; }).sort(function (a, b) { return price(b) - price(a); })[0];
    var it = gift || any;
    if (it) return { item: it, name: G.ITEM[it.id].name };
    return { gold: Math.min(pl.gold, 1500), name: '금화 주머니' };
  }
  NP._loot = loot;
  async function salon() {
    var s = S(), p = st(), c = cityNow();
    await withPic('josephine_salon', c.name + '의 살롱', async function () {
      await narrate(c.name + '의 저녁. 촛불이 수백 개 켜진 살롱에서 현악 사중주가 울린다. 비단 옷자락 사이로, 장미 향을 두른 여인 하나가 웃음소리 한가운데 서 있다.');
      await UI.say('…제독. 저분은 누구요? 저 웃음, 저 눈… 대포알이 가슴에 박힌 것 같소.', sp(NAP));
      await UI.say('어머, 바다 냄새가 나는 손님들이네요. 저는 조제핀이에요. 마르티니크라는 먼 섬에서 왔지요.\f(나폴레옹의 작은 키를 내려다보며 부채로 입을 가리고) 어머나, 이 작은 장교님은 눈빛이 꼭 대포 같네요. 저한테 무얼 가져다주실 건가요? 장미? 아니면 별?', sp(JOS, 'happy'));
      await UI.say('(얼굴이 새빨개져서) 무엇이든! 원하는 것은 무엇이든 가져다드리겠소!', sp(NAP));
      await UI.say('정말요? 그럼 바다 건너 온 반짝이는 것이 좋겠어요. 제 목에 어울리는 걸로. (웃음)', sp(JOS, 'happy'));
    });
    p.phase = 'met'; p.at = s.day;
    await UI.fade(function () { G.Game.passDays(3); });
    await theft();
  }
  async function theft() {
    var s = S(), p = st(), pl = s.player, L = loot();
    if (L.item) R.removeItemObject(L.item); else pl.gold -= L.gold;
    p.stole = L.item ? { id: L.item.id, it: L.item } : { gold: L.gold };
    await narrate('사흘 동안 나폴레옹은 밤마다 살롱에 드나들었다. 나흘째 새벽, 선실 쪽에서 소란이 일어난다.');
    await UI.say('제독! 나폴레옹이 제독의 상자를 뒤지다 들켰습니다! 품에서 ' + L.name + U.jx(L.name, '이/가') + ' 나왔습니다.', first());
    await UI.say('…그렇소. 내가 훔쳤소. 조제핀에게 바치려고 했소. 변명하지 않겠소.\f허나 사내라면 칼로 결판을 내는 법. 제독, 나와 겨뤄 주시오. 내가 이기면 이것은 그녀의 것이고, 내가 지면 — 평생 당신을 따르겠소.', sp(NAP));
    await duel();
  }
  async function rematch() {
    var p = st();
    await UI.say('제독, 지난번 일은 잊지 않았소. 조제핀이 돌려준 그것은 아직도 내 얼굴을 뜨겁게 하오. …한 번 더 겨뤄 주시오. 이번에 지면, 정말로 평생 당신을 따르겠소.', sp(NAP));
    var v = await UI.ask('나폴레옹이 다시 일기토를 청한다', [{ label: '받아 준다', value: 1 }, { label: '다음에', value: 0 }], me());
    p.at = S().day;
    if (v) await duel();
  }
  async function duel() {
    var s = S(), p = st(), m = G.MATE[NAP], r = row(NAP);
    var res = 'win';
    if (G.Games && G.Games.duel) {
      res = await withPic('napoleon_duel', '새벽 부두의 일기토', function () {
        return G.Games.duel({ name: m.name, portrait: G.Art && G.Art.mateSpec ? G.Art.mateSpec(NAP) : null, look: 'rival', str: m.st[0], atk: 12, def: 6, skill: m.sk.sword || 2, mar: m.st[2], int: m.st[1], cha: m.st[3], style: 'it' }, { place: 'city', noSwap: true });
      });
    }
    var back = function () { var x = p.stole; if (!x) return; if (x.it) s.player.items.push(x.it); else if (x.gold) s.player.gold += x.gold; p.stole = null; };
    if (res === 'win') {
      back();
      await UI.say('(칼을 떨어뜨리고 무릎을 꿇으며) …졌소. 대포로는 몰라도, 칼로는 당신을 못 당하겠군.\f나폴레오네 보나파르트, 오늘부터 앞으로 평생 제독을 따르겠소. 이것은 맹세요.', sp(NAP));
      if (r) r.loyal = 100;
      await UI.say('(부채를 접으며 다가와) 어머, 결투 구경은 처음이에요. …바다의 제독님, 이 사람 칼을 받아 내면서도 끝까지 웃으셨죠? 그런 남자는 처음 봐요.\f저도 그 배에 태워 주세요. 살롱의 장미보다 당신이 보는 바다가 더 궁금해졌어요. 이 작은 장교님도 제가 곁에서 잘 달랠게요. (웃음)', sp(JOS, 'happy'));
      var j = G.Legend && G.Legend.join ? G.Legend.join(JOS, cityNow()) : null;
      if (j) { j.aff = 40; j.loyal = 85; }
      p.phase = 'done'; p.at = s.day;
      G.Fame.add('so', 120);
      G.State.log('오스트리아의 살롱에서 조제핀 드 보아르네를 만났다. 그녀에게 바치려고 물건을 훔친 나폴레옹을 일기토로 꺾었다 — 나폴레옹은 평생 따르겠다고 맹세했고, 조제핀도 동료가 되었다.');
      UI.toast('나폴레옹 충성 100 · 조제핀 드 보아르네 — 동료가 되었다 (' + G.wageNote(JOS) + ')', 'heart', 6000);
      if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(JOS); } catch (e) { console.error(e); } }
    } else {
      back();
      p.lost = (p.lost || 0) + 1;
      if (r) r.loyal = Math.max(30, (r.loyal || 70) - 10);
      await UI.say('(나폴레옹의 칼끝에서 그것을 집어 제독에게 돌려주며) 둘 다 바보 같아요. 훔친 걸 받을 만큼 저는 가난하지 않답니다. (웃음)\f작은 장교님, 이기긴 했어도 이건 당신 물건이 아니에요. 다음에 오면 그땐 정말 멋진 걸 보여 줘요.', sp(JOS, 'happy'));
      await UI.say('…이긴 것 같지가 않소. 제독, 다음에 이 땅에 오면 다시 겨뤄 주시오.', sp(NAP, 'sad'));
      G.State.log('오스트리아에서 조제핀에게 바치려고 물건을 훔친 나폴레옹과 일기토를 벌였으나 졌다. 조제핀이 물건을 돌려주었다.');
      p.at = s.day;   // 같은 날에는 다시 청하지 않는다 — 다음에 오스트리아 도시에 들르면
    }
    if (G.Game.refreshHud) G.Game.refreshHud();
  }

  NP._t = { rescue: rescue, family: family, salon: salon, duel: duel, rematch: rematch };
})(window.G = window.G || {});
