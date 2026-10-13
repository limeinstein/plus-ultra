/* 옛이야기의 아가씨들을 만나는 일 (G.Tale) — 사람은 js/data/fairytales.js, 조정값은 G.BALANCE.fairy. 2026-10-12
   ■ 신데렐라 — 짐칸에 유리가 있고 세공에 밝은 사람(제독이나 부하 누구든)이 있을 때, 프랑스 도시 근처 숲을 돌아다니면(하루마다 chance)
     재투성이 아가씨가 깨진 유리 구두를 들고 다가온다. 유리 한 통으로 구두를 지어 주면 무급 항해사로 합류한다.
   ■ 백설공주 — 부하가 남자만 꼭 여섯 명일 때(제독까지 일곱), 프랑스 도시 근처 숲을 돌아다니면 왕비의 사냥꾼에게 쫓기는 그녀가 뛰어든다.
     일기토(제독이나 검술이 가장 좋은 부하)로 사냥꾼을 물리치면 합류한다. 지면 그녀는 숲으로 달아나고, 한동안 지나 다시 만날 수 있다.
   ■ 잠자는 숲속의 공주 — 의학에 밝은 사람이 있고 용·드래곤(dragon·reddragon·blackdragon)을 찾은 뒤, 독일 땅(신성로마제국·한자 동맹 도시 근처) 숲에서 야영하면
     가시덤불 성에서 잠든 처녀를 만난다. 깨우면 물레 가락에 찔린 상처가 덧나 있다 — 치료해 주면 「운명」이라며 합류한다.
   ■ 인어공주 — 덴마크의 섬(퓐·셸란·롤란·팔스테르·보른홀름)에 상륙해 야영지에서 사냥하면 물가에서 걸음이 서툰 그녀를 만난다.
     말을 못 하지만 항해·측량·요리에 밝다. 돌보기로 하면 합류한다.
   · 거절하거나 놓치면 coolDays 동안은 다시 나오지 않는다. 그 고장 술집 주인이 한 번씩 귀띔한다.
   · 넷 모두 들이면 업적 「Once Upon a Time」, 넷 모두와 혼인하면 「Happily Ever After」 (js/data/achievements.js · js/systems/achieve.js)
   · 저장: s.fairy = { cool: {id: 날번호}, met: {id: 번} }   · 뭍(js/scenes/land.js)이 G.Tale.onLand(하루) · G.Tale.onCamp(야영 뒤)를 부른다 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, T = {};
  G.Tale = T;
  function S() { return G.Game.state; }
  function K() { return (G.BALANCE && G.BALANCE.fairy) || {}; }
  function st() { var s = S(); var F = s.fairy || (s.fairy = {}); F.cool = F.cool || {}; F.met = F.met || {}; return F; }
  T.state = st;
  function row(id) { return S().mates.filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { return !!S().flags['gone_' + id]; }
  T.hired = function (id) { return !!row(id); };
  /** 아직 만날 수 있는가 (들이지 않았고, 떠나보내지 않았고, 거절한 뒤 쉬는 날이 지났다) */
  T.ready = function (id) {
    if (row(id) || gone(id)) return false;
    if (G.Wives && G.Wives.list && G.Wives.list().some(function (w) { return w.id === id; })) return false;   // 혼인해 집에 있다
    if (S().player.wife === id) return false;
    var c = st().cool[id]; return !(c && S().day < c);
  };
  function cool(id) { st().cool[id] = S().day + (K().coolDays || 45); }
  function who(id, emo) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id, emo) : { name: G.MATE[id].name, portrait: G.Art.mateSpec(id), half: G.Img.chain.mateHalf(id), lang: 3, special: true }; }
  T.speaker = who;
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function say(id, text, emo) { return UI.say(text, who(id, emo)); }
  function narrate(text) { return UI.say(text, {}); }
  function bestName(sk) { var b = R.skillBest(sk); return { lv: b.lv, name: b.who || S().player.name, me: !b.who }; }

  // ---------------------------------------------------------------- 어디인가
  function owner(c) { return R.cityOwner ? R.cityOwner(c) : c.nation; }
  /** 가장 가까운 (지금 있는) 도시와 거리 */
  function nearest(lon, lat) {
    var best = null, bd = 1e9;
    G.CITY_DATA.forEach(function (c) { if (R.cityExists && !R.cityExists(c)) return; var d = G.Geo.dist(lon, lat, c.lon, c.lat); if (d < bd) { bd = d; best = c; } });
    return best ? { c: best, d: bd } : null;
  }
  T.nearest = nearest;
  var GERMAN = { '신성로마제국': 1, '한자 동맹': 1 };
  T.frenchForest = function (lon, lat, terr) {
    if ((terr || G.Geo.terrain(lon, lat)) !== 'forest') return false;
    var n = nearest(lon, lat); return !!n && n.d <= (K().nearR || 2.5) && owner(n.c) === '프랑스';
  };
  T.germanForest = function (lon, lat, terr) {
    if ((terr || G.Geo.terrain(lon, lat)) !== 'forest') return false;
    var n = nearest(lon, lat); return !!n && n.d <= (K().nearR || 2.5) + 0.5 && !!GERMAN[owner(n.c)];
  };
  // 덴마크의 섬들 (유틀란트 반도는 빼고): 퓐 · 셸란 · 롤란·팔스테르 · 보른홀름
  var DK_ISLES = [[9.8, 10.95, 54.85, 55.65], [11.05, 12.75, 54.95, 56.15], [10.95, 12.25, 54.55, 54.95], [14.6, 15.25, 54.95, 55.35]];
  T.danishIsland = function (lon, lat) {
    return DK_ISLES.some(function (b) { return lon >= b[0] && lon <= b[1] && lat >= b[2] && lat <= b[3]; });
  };

  // ---------------------------------------------------------------- 조건
  var DRAGONS = ['dragon', 'reddragon', 'blackdragon'];
  T.glass = function () { var c = S().fleet.cargo || {}; return c.glass ? c.glass.q || 0 : 0; };
  function takeGlass() { var c = S().fleet.cargo; if (!c.glass) return false; c.glass.q -= 1; if (c.glass.q <= 0) delete c.glass; return true; }
  T.cinderellaOk = function () { return R.skillRead('craft') >= 1 && T.glass() >= 1; };
  T.snowOk = function () { var m = S().mates; return m.length === 6 && m.every(function (x) { var d = G.MATE[x.id]; return d && d.g !== 'f'; }); };
  T.beautyOk = function () { return R.skillRead('med') >= 1 && DRAGONS.some(function (id) { return G.Disc.foundByMe(id); }); };

  // ---------------------------------------------------------------- 들이기 (무급)
  T.join = async function (id) {
    var m = G.MATE[id], nm = G.Legend && G.Legend.join ? G.Legend.join(id, null) : null;
    if (!nm) return null;
    st().met[id] = (st().met[id] || 0) + 1;
    UI.toast(m.name + ' — 품삯을 받지 않는 항해사', 'heart', 4200);
    if (G.Achieve && G.Achieve.afterHire) { try { await G.Achieve.afterHire(id); } catch (e) { console.error(e); } }
    return nm;
  };
  function ask(text, yes, no) { return UI.ask(text, [{ label: yes, value: 1 }, { label: no, value: 0 }], me()); }

  // ================================================================ 신데렐라
  T.cinderella = async function () {
    var id = 'cinderella', cr = bestName('craft');
    await narrate('숲길 옆 그루터기에 푸른 비단 무도회 옷을 입은 아가씨가 맨발로 앉아 울고 있다. 한 손에는 유리 구두 한 짝, 무릎 위에는 산산이 깨진 다른 한 짝의 조각이 한 줌.');
    await say(id, '아… 놀라셨죠. 죄송해요, 길을 막고 있었네요.\f오늘 밤 성에서 무도회가 있어요. 대모님이 마련해 주신 유리 구두를 신고 가야 하는데… 서두르다 한 짝을 바위에 떨어뜨려 깨뜨렸어요. 한 짝만 신고 춤을 출 수는 없잖아요.');
    await say(id, '저기… 혹시 배에 유리를 싣고 다니시나요? 그리고 유리를 다룰 줄 아는 분이 계시다면— 깨진 한 짝만, 이 구두와 똑같이 지어 주실 수 없을까요?\f드릴 수 있는 건 아무것도 없지만… 무도회가 끝나면 무엇이든 하겠어요.');
    var v = await ask('짐칸의 유리 한 통으로 ' + (cr.me ? '제독이 직접' : cr.name + U.jx(cr.name, '이/가')) + ' 유리 구두를 지어 줄까? (유리 ' + T.glass() + '통 실음)', '유리 구두를 지어 준다 (유리 1통)', '바빠서 그냥 지나간다');
    if (!v || !takeGlass()) {
      await say(id, '…그렇죠. 괜찮아요, 맨발로라도 가 볼게요. 좋은 항해 되세요.');
      cool(id); return false;
    }
    await narrate((cr.me ? '제독이' : cr.name + U.jx(cr.name, '이/가')) + ' 모닥불에 유리를 녹여 남은 한 짝을 본떠 얇게 부풀린다. ' + (cr.lv >= 3 ? '해가 기울 무렵, 빛을 받으면 무지갯빛이 도는 구두가 완성되었다. 처음 것과 어느 쪽이 어느 쪽인지 가릴 수가 없다.' : cr.lv >= 2 ? '몇 번을 다시 불어 마침내 남은 짝과 꼭 같은 구두가 나왔다.' : '처음 것보다 조금 투박하지만, 발에는 꼭 맞는 구두가 되었다.'));
    await say(id, '어머… 꼭 맞아요! 두 짝이 다시 한 켤레가 됐어요.', 'happy');
    await narrate('그녀는 구두를 신고 몇 걸음 춤을 춰 보더니, 문득 멈춰 서서 성 쪽을 바라본다.');
    await say(id, '이상하죠. 이렇게 고운 구두를 신고 나니… 무도회보다 저 바다가 더 보고 싶어요. 열두 시가 되면 마법이 풀려도, 바다는 그대로 있을 테니까요.\f저를 배에 태워 주세요. 품삯은 필요 없어요. 부엌이든 갑판이든, 쓸고 닦는 일이라면 누구보다 잘해요.');
    if (!(await ask('신데렐라가 무급 항해사로 함께 가겠다고 한다.', '배에 태운다', '무도회에 보낸다'))) {
      await say(id, '…네, 그럼 무도회에 다녀올게요. 언젠가 다시 이 숲에서 뵈어요.'); cool(id); return false;
    }
    await T.join(id);
    await say(id, '고맙습니다, 제독님. 이 구두는… 잃어버리지 않을게요.', 'happy');
    return true;
  };

  // ================================================================ 백설공주
  T.snowWhite = async function (api) {
    var id = 'snow_white';
    await narrate('나뭇가지가 우지끈 부러지는 소리. 흰 살결에 흑단 같은 머리, 붉은 벨벳 옷자락이 가시에 찢긴 아가씨가 숲에서 뛰쳐나와 일행 뒤로 숨는다. 손에는 빨간 사과 하나를 꼭 쥐고 있다. 그 뒤를 단검을 든 사냥꾼이 쫓아온다.');
    await say(id, '살려 주세요! 저 사람이… 왕비님이 저를 죽이라고 보냈어요!');
    var hunter = { name: '왕비의 사냥꾼', portrait: G.Art.withImg(G.Art.npcSpec('tale_hunter', 'soldier', 'ne', 'm'), ['portraits/npc-roles/ne/soldier']), look: 'brawler',
      str: 78, atk: 12, def: 5, skill: 2, mar: 74, int: 50, cha: 40, style: 'slash' };
    await UI.say('비키시오, 뱃사람들. 이건 왕비 마마의 명이오. 그 아이의 심장을 가져가야 내 목이 붙어 있소.', { name: hunter.name, portrait: hunter.portrait });
    var sw = R.skillBest('sword'), mates = S().mates, px = sw.who ? mates.filter(function (m) { return G.MATE[m.id].name === sw.who; })[0] : null;
    var v = await UI.ask('사냥꾼이 단검을 뽑았다. 어떻게 할까?', [
      { label: '제독이 직접 맞선다', value: 1 },
      { label: px ? sw.who + '에게 맡긴다 (검술 ' + sw.lv + ')' : '맡길 검객이 없다', value: 2, dis: !px },
      { label: '못 본 척 길을 비킨다', value: 0 }], Object.assign(me(), { cancel: false }));
    if (!v) {
      await narrate('사냥꾼이 아가씨의 팔을 낚아채려는 순간, 그녀는 몸을 비틀어 빠져나가 숲 깊은 곳으로 사라졌다. 사냥꾼이 혀를 차며 뒤를 쫓는다.');
      cool(id); return false;
    }
    var res = await G.Games.duel(hunter, v === 2 && px ? { mate: px, place: 'land' } : { place: 'land' });
    if (res !== 'win') {
      await narrate('사냥꾼의 칼끝을 겨우 피하는 사이, 아가씨는 이미 숲 깊이 달아나 보이지 않는다. 사냥꾼도 그녀를 쫓아 사라졌다.');
      cool(id); return false;
    }
    await UI.say('…칼솜씨가 대단하군. 왕비 마마께는 멧돼지 심장을 가져가겠소. 그 아이는 다시는 이 숲에 들어오지 않게 하시오.', { name: hunter.name, portrait: hunter.portrait });
    G.Fame.add('bt', 2);
    await say(id, '고맙습니다… 정말로요.', 'happy');
    var n = S().mates.length;
    await narrate('그녀는 일행을 하나하나 세어 본다. 제독, 그리고 남자 부하 ' + n + '명.');
    await say(id, '하나, 둘, 셋… 일곱. 일곱 사람이네요! 숲속 오두막의 아저씨들도 일곱이었어요.\f저, 요리도 하고 빨래도 하고, 아픈 사람도 돌볼 줄 알아요. 품삯은 필요 없어요. 다만 왕비님의 거울이 볼 수 없는 먼 바다로— 저를 데려가 주세요.', 'happy');
    if (!(await ask('백설공주가 무급 항해사로 함께 가겠다고 한다.', '배에 태운다', '안전한 마을까지만 데려다준다'))) {
      await say(id, '…네. 그래도 구해 주신 은혜는 잊지 않을게요.'); cool(id); return false;
    }
    await T.join(id);
    await say(id, '그럼 오늘부터 이 배가 제 오두막이에요! 다들 손부터 씻고 오세요. 저녁은 제가 할게요.', 'happy');
    return true;
  };

  // ================================================================ 잠자는 숲속의 공주
  T.sleepingBeauty = async function () {
    var id = 'sleeping_beauty', md = bestName('med');
    var dg = DRAGONS.filter(function (x) { return G.Disc.foundByMe(x); }).map(function (x) { return G.DISC[x].name; })[0] || '용';
    await narrate('야영지 뒤편, 찔레 가시덤불이 성벽처럼 둘러친 낡은 탑이 있다. 「' + dg + '」' + U.jx('「' + dg + '」', '을/를') + ' 보고 온 이들이라는 걸 알기라도 하는 듯, 가시덤불이 스스로 갈라져 길을 연다.');
    await narrate('먼지 쌓인 계단 끝, 꽃이 시들지 않은 방의 침상에 장밋빛 비단 옷의 처녀가 잠들어 있다. 숨결은 고르지만, 어깨를 흔들어도 깨지 않는다. 손에는 금빛 물레 가락을 쥔 채다.');
    if (!(await ask('잠든 처녀를 깨워 볼까?', '조심스레 깨운다', '그대로 두고 물러난다'))) { cool(id); return false; }
    await narrate('창을 열어 바람을 들이고 이름 모를 처녀를 몇 번이고 부르자, 긴 속눈썹이 떨리더니 그녀가 천천히 눈을 뜬다.');
    await say(id, '…누구세요? 성은… 다들 어디 갔죠? 저는 그저 물레를 한 번 만져 봤을 뿐인데.');
    await narrate('그녀가 내민 손가락 끝이 검붉게 부어 있다. 물레 가락에 찔린 자리가 오랜 세월 덧나, 열이 손목까지 올라와 있다.');
    var v = await ask((md.me ? '제독이' : md.name + U.jx(md.name, '이/가')) + ' 상처를 살핀다. 치료할까? (의학 ' + md.lv + ')', '상처를 치료한다', '그냥 둔다');
    if (!v) { await say(id, '괜찮아요… 조금 따끔할 뿐이에요.'); cool(id); return false; }
    await narrate((md.me ? '제독이' : md.name + U.jx(md.name, '이/가')) + ' ' + (md.lv >= 3 ? '곪은 자리를 깨끗이 째어 고름을 빼내고, 약초를 찧어 싸매고, 열을 내리는 탕약까지 달여 먹인다.' : md.lv >= 2 ? '상처를 씻어 내고 약초를 붙여 단단히 싸맨다.' : '서툰 손으로나마 상처를 씻고 깨끗한 천으로 감싼다.') + ' 이윽고 그녀의 볼에 핏기가 돈다.');
    await say(id, '백 년 동안 꿈을 꿨어요. 가시덤불을 헤치고 누군가 바다 냄새를 풍기며 찾아오는 꿈을. 그리고 그 사람이 제 상처를 낫게 해 주는 꿈을…\f이건 운명이에요. 분명히요.', 'happy');
    await say(id, '성도 사람들도 다 사라졌다면, 저는 이제 어디에도 매인 몸이 아니에요. 품삯은 필요 없어요— 백 년 늦은 세상을, 당신 배에서 보고 싶어요.');
    if (!(await ask('잠자는 숲속의 공주가 무급 항해사로 함께 가겠다고 한다.', '배에 태운다', '마을까지만 데려다준다'))) {
      await say(id, '…운명은 한 번에 오지 않는 법이죠. 다시 만날 거예요.'); cool(id); return false;
    }
    await T.join(id);
    await say(id, '이제 다시는 잠들지 않을게요. 백 년이나 잤으니까요!', 'happy');
    return true;
  };

  // ================================================================ 인어공주
  T.littleMermaid = async function () {
    var id = 'little_mermaid';
    await narrate('사냥감을 쫓다 물가에 이르자, 바닷물에 젖은 청록빛 옷자락을 끌며 붉은 머리의 아가씨가 젖은 바위를 짚고 일어서려다 비틀거린다. 걸음마를 처음 배우는 아이처럼, 한 발짝 한 발짝이 아슬아슬하다. 목에는 산호 목걸이가 걸려 있다.');
    await say(id, '(입술을 달싹이지만 소리가 나오지 않는다. 그녀는 제 목을 가리키고 고개를 젓는다.)');
    await narrate('그녀는 모래 위에 손가락으로 무언가를 그린다 — 이 섬의 해안선, 그 앞바다의 얕은 여울과 깊은 골, 그리고 물살이 도는 방향까지. 어느 뱃사람의 해도보다 정확하다.');
    await say(id, '(바다를 가리키고, 일행이 타고 온 배를 가리키고, 두 손을 모아 고개를 숙인다.)', 'happy');
    if (!(await ask('말을 못 하는 이 아가씨를 어떻게 할까?', '돌보기로 한다 — 배에 태운다', '가까운 마을 사람들에게 맡긴다'))) {
      await narrate('마을 사람들에게 그녀를 맡기고 돌아서는데, 뒤에서 아무 소리도 들리지 않는다. 돌아보니 그녀는 바다만 바라보고 서 있었다.');
      cool(id); return false;
    }
    await T.join(id);
    await narrate('배에 오르자 그녀의 걸음이 거짓말처럼 가벼워진다. 출렁이는 갑판 위가 뭍보다 편한 모양이다. 그날 저녁, 그녀가 말없이 차린 생선 요리에 선원들이 혀를 내둘렀다.');
    await say(id, '(활짝 웃으며 키를 가리킨다. 바람이 바뀌는 쪽을 먼저 알아채는 눈치다.)', 'happy');
    return true;
  };

  // ---------------------------------------------------------------- 뭍에서 하루가 지날 때 (js/scenes/land.js)
  /** 프랑스 도시 근처 숲: 신데렐라 · 백설공주 */
  T.onLand = async function (lon, lat, api) {
    if (S().loc.mode !== 'land') return false;
    var terr = G.Geo.terrain(lon, lat);
    if (!T.frenchForest(lon, lat, terr)) return false;
    var cand = [];
    if (T.ready('cinderella') && T.cinderellaOk()) cand.push('cinderella');
    if (T.ready('snow_white') && T.snowOk()) cand.push('snow_white');
    if (!cand.length || !U.chance(K().chance == null ? 0.3 : K().chance)) return false;
    if (api && api.stop) api.stop();
    var id = U.pick(cand);
    return id === 'cinderella' ? T.cinderella() : T.snowWhite(api);
  };
  /** 야영을 마친 뒤 (v: 한 일 — 'rest'·'hunt'·…) */
  T.onCamp = async function (v, lon, lat) {
    if (!v || S().loc.mode !== 'land') return false;
    var terr = G.Geo.terrain(lon, lat);
    if (v === 'hunt' && T.danishIsland(lon, lat) && T.ready('little_mermaid')) return T.littleMermaid();
    if (T.germanForest(lon, lat, terr) && T.ready('sleeping_beauty') && T.beautyOk()) return T.sleepingBeauty();
    return false;
  };

  // ---------------------------------------------------------------- 술집 주인의 귀띔 (그 고장에서 한 번씩)
  async function hint(key, text, c) {
    var s = S(); if (s.flags['ftHint_' + key]) return;
    s.flags['ftHint_' + key] = 1;
    var CC = G.Scenes.city;
    await UI.say(text, CC && CC.npc ? CC.npc('tavernkeeper', '술집 주인') : {});
  }
  T.tavernHints = async function (c) {
    if (!c) return;
    var o = owner(c);
    if (o === '프랑스' && T.ready('cinderella')) await hint('cin', '요즘 이 근처 숲에 재투성이 아가씨가 깨진 유리 구두를 들고 앉아 운다더군. 유리를 다룰 줄 아는 사람을 찾는다나. 유리야 시장에서 팔지만, 그걸 구두로 만드는 솜씨가 문제지.');
    else if (o === '프랑스' && T.ready('snow_white')) await hint('snow', '숲에 들어갈 거면 조심하게. 왕비의 사냥꾼이 웬 아가씨를 쫓아다닌다더군. 그 아가씨는 일곱 사내가 사는 오두막을 찾는다던데… 사내 일곱이 함께 다니는 무리라면 반가워할지도.');
    if (GERMAN[o] && T.ready('sleeping_beauty')) await hint('beauty', '이 고장 숲 깊은 곳에 가시덤불로 뒤덮인 탑이 있다네. 용을 본 사람 앞에서만 덤불이 길을 연다는 옛말이 있지. 그 안에 잠든 공주가 다쳐 있다는데, 의원 없이 가 봐야 소용없다더군.');
    if (o === '덴마크' && T.ready('little_mermaid')) await hint('mermaid', '섬에서 사냥하다 보면 물가에서 걸음마 하듯 걷는 아가씨를 본다는 사람들이 있어. 말은 한마디도 못 하는데, 바다 일은 늙은 뱃사람보다 잘 안다더군.');
  };
  T.install = function () {
    var CC = G.Scenes && G.Scenes.city, B = CC && CC.B; if (!B || !B.tavern || T._inst) return;
    T._inst = true;
    var f = B.tavern.enter;
    if (typeof f !== 'function') return;
    B.tavern.enter = async function (c) {
      var r = await f.apply(this, arguments);
      try { if (r !== false && CC.current && CC.current() && CC.current().kind === 'tavern') await T.tavernHints(c); } catch (e) { console.error(e); }
      return r;
    };
    for (var k in f) if (Object.prototype.hasOwnProperty.call(f, k)) B.tavern.enter[k] = f[k];
  };
  T.install();
})(window.G = window.G || {});
