/* 로미오와 줄리엣 — 베로나의 두 가문 (G.Romeo) 2026-10-31 사용자 요청 (사람·조정값: js/data/romeojuliet.js)
   ■ 1부 (베니스·밀라노에 들어서면 — 1480~1590년, 하루 말을 달려 베로나로)
     ① 거리 싸움: 광장에서 몬터규와 캐풀렛 집안 하인들이 칼을 뽑는다. 영주 에스칼루스가 「다시 싸우면 목숨으로 갚는다」고 외친다.
        싸움판 양쪽 끝에서 서로를 안타깝게 바라보는 젊은 남녀 — 로미오와 줄리엣. 둘은 사랑하지만 두 집안은 철천지원수다.
     ② 머큐시오의 죽음: 줄리엣의 사촌 티볼트가 로미오의 벗 머큐시오를 찌른다 — 「두 집안 모두 염병에나 걸려라!」
        로미오가 복수의 칼로 티볼트를 벤다. 제독이 티볼트를 살린다 (의학으로 지혈 · 약재 herbs · 이발사 외과의 doctor닢 · 맨손으로 상처를 누른다).
        티볼트는 살았지만 두 집안의 골은 더 깊어진다.
   ■ 2부 (gap일 뒤 다시 베니스·밀라노에 들어서면 — 로미오의 하인 발타자르가 찾아온다)
     ③ 잠의 약: 둘은 로렌스 수사의 약(마흔두 시간 죽은 듯 잠든다)을 먹고 죽은 척해 함께 달아나려 했다. 줄리엣이 먼저 마시고 쓰러졌다.
        그런데 해독제를 들고 오던 존 수사가 역병 검역에 갇혀 약병이 깨졌다 — 해독제를 잃었다.
     ④ 성배 문제: 수사의 처방은 「참된 잔」에 담아야 듣는다. 금·은·납·나무 네 잔의 글귀 가운데 참은 단 하나 — 답은 납 잔.
        로미오와 함께 푼다 (과학 2인 로미오가 실마리를 준다). tries번 기회, 틀릴 때마다 줄리엣의 잠이 열네 시간씩 줄어든다.
        다 틀려도 마지막에 로렌스 수사가 알아내지만 줄리엣이 몹시 지친다 (충성 조금 낮게, 명성 적게).
     ⑤ 캐풀렛가 무덤: 줄리엣이 깨어난다. 두 집안은 둘이 죽은 줄 안다 — 둘은 제독의 배로 달아나 동료가 된다.
   ■ 소식 (만난 사람만): 다 포르토의 이야기(1531) · 반델로(1554) · 브룩의 시(1562) · 셰익스피어의 비극(1597) — 모두 둘이 죽는 결말. 제독은 진짜 결말을 안다.
   ■ 장면 그림 (없으면 건너뜀): images/legend-events/rj_*.webp — images/legend-events/ROMEOJULIET_PROMPT.md
   ■ 저장: s.romeo = { p1: 날, tybalt: 'med'|'herbs'|'doctor'|'hand', p2, tries, grail: 'solved'|'friar', joined, told: {} } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var RJ = G.Romeo = {};
  function K() { return G.BALANCE.romeo; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  var NEWS = ['daporto', 'bandello', 'brooke', 'shakes'];
  var NEWS_AT = { daporto: 15310101, bandello: 15540601, brooke: 15621119, shakes: 15970101 };
  function st() {
    var s = S(); if (!s) return null;
    if (!s.romeo) { s.romeo = { told: {} }; NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.romeo.told[k] = 1; }); }
    s.romeo.told = s.romeo.told || {};
    return s.romeo;
  }
  RJ.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { return !!(S().flags && S().flags['gone_' + id]); }
  function H(id) { return G.Hist ? G.Hist.speaker('rj_' + id) : { name: id, lang: 3 }; }
  function MS(id) { return G.Legend && G.Legend.speaker ? G.Legend.speaker(id) : { name: G.MATE[id].name, lang: 3 }; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) { return k === 'P' ? me() : k === 'romeo' || k === 'juliet' ? MS(k) : k === 'first' ? (G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {}) : k ? H(k) : {}; }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function log(t) { G.State.log(t); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : { lv: R.skill(id), who: null }; return { lv: b.lv || 0, who: b.who || '제독' }; }
  function herbs() { var c = S().fleet.cargo || {}; return c.herbs ? c.herbs.q || 0 : 0; }
  function inCity() { return K().cities.indexOf(cityNow()) >= 0; }
  function cityName() { var c = G.CITY_DATA[cityNow()]; return c ? c.name : '베니스'; }

  // ================================================================ 1부 — 거리 싸움 · 머큐시오의 죽음
  function p1Open() { var b = st(), t = today(); return !!(b && !b.p1 && inCity() && t >= K().from && t <= K().to && !row('romeo') && !gone('romeo')); }
  async function part1() {
    var b = st(), s = S(); b.met = 1; b.p1 = U.dayIndex(s.date);
    await withPic('rj_brawl', '베로나의 거리 싸움', function () { return play([
      [null, cityName() + '에서 하루 말을 달려 아디제 강가의 베로나에 닿았다. 붉은 벽돌 원형 극장 옆 광장, 장이 선 한낮 — 갑자기 고함이 터진다.'],
      [null, '「몬터규 놈들이 우리한테 엄지를 깨물었다!」「캐풀렛 개들이 먼저 시비를 걸었다!」 푸른 옷과 붉은 옷의 하인들이 칼을 뽑아 들고 뒤엉킨다. 사과 수레가 엎어지고 아이들이 울며 달아난다.'],
      [null, '광장 양쪽 끝, 싸움판 너머로 두 사람이 서로를 바라보고 있다. 푸른 망토의 청년과, 붉은 드레스를 입은 젊은 아가씨. 둘 다 칼부림을 막지도 끼어들지도 못한 채, 눈빛만 애타게 서로에게 닿아 있다.'],
      ['escalus', '(말을 몰고 광장에 뛰어들며) 칼을 내려라! 몬터규, 캐풀렛 — 너희 집안의 해묵은 원한 때문에 베로나의 거리가 세 번이나 피로 물들었다. 다시 한 번 이 거리를 어지럽히면 그 목숨으로 갚게 하리라!']
    ]); });
    var sw = skill('sword');
    var v = await UI.ask('광장의 칼부림이 영주의 호령에 멎는다. 저 두 사람은 누구일까?', [
      { label: '싸움이 다시 붙지 않게 두 집안 하인들 사이를 막아선다' + (sw.lv ? ' (검술 ' + sw.lv + ')' : ''), value: 'stop', icon: 'sword' },
      { label: '광장 끝의 두 사람에게 다가가 본다', value: 'look', icon: 'eye' }], me());
    if (v === 'stop') { fame('so', 20); await play([[null, '제독이 칼날 사이로 성큼 들어서자 하인들이 주춤 물러선다. 영주가 제독을 눈여겨본다.']]); }
    await play([
      ['romeo', '(제독 곁으로 다가와 낮게) 바다 냄새가 나는 분이시군요. 저는 로미오, 몬터규가의 아들입니다. …저 아가씨 보이십니까? 줄리엣, 캐풀렛가의 딸입니다. 지난밤 그 집 가면무도회에서 처음 만났지요. 이름을 알았을 땐 이미 늦었습니다.'],
      ['juliet', '(광장을 가로질러 와, 붉은 베일 아래로) 로미오, 여기선 안 돼요. 사촌 티볼트가 보고 있어요. …낯선 분, 이 사람의 친구인가요? 장미는 다른 이름으로 불러도 향기롭잖아요. 몬터규라는 이름이 이 사람의 손도, 발도, 얼굴도 아닌데.'],
      ['romeo', '로렌스 수사님이 내일 아침 저희를 몰래 짝지어 주시기로 했습니다. 두 집안이 이 혼인으로 화해할 수 있다면…']
    ]);
    // ② 머큐시오의 죽음
    await withPic('rj_mercutio', '머큐시오의 죽음', function () { return play([
      [null, '이튿날 오후, 뜨거운 햇볕이 광장을 달군다. 붉은 겉옷의 사내가 칼을 뽑고 로미오 앞을 막아선다.'],
      ['tybalt', '로미오, 이 악당 놈! 내 사촌의 가면무도회에 몰래 숨어들다니. 칼을 뽑아라!'],
      ['romeo', '티볼트, 나는 너와 싸우지 않겠다. 이제 너를 내 이름만큼 아끼게 될 까닭이 생겼으니.'],
      ['mercutio', '이런 비굴한 항복이 다 있나! 고양이 왕자 티볼트, 내가 상대해 주지!'],
      [null, '칼날이 부딪친다. 로미오가 둘 사이를 막아서는 순간 — 그 팔 밑으로 티볼트의 칼끝이 머큐시오의 가슴을 찌른다.'],
      ['mercutio', '…긁힌 것뿐이야, 긁힌 것. 우물만큼 깊지도, 성당 문만큼 넓지도 않지만 충분하다. 내일 날 찾아오면 무덤 속의 사내를 보게 될걸. 두 집안 모두 염병에나 걸려라! 두 집안 모두!'],
      [null, '머큐시오가 쓰러져 숨을 거둔다. 로미오의 얼굴에서 핏기가 가신다. 그가 칼을 뽑아 든다.'],
      ['romeo', '티볼트! 머큐시오의 넋이 아직 우리 머리 위에 떠 있다. 너든 나든, 아니면 둘 다 그를 따라가야 한다!'],
      [null, '두 칼이 미친 듯 맞부딪치고 — 로미오의 칼이 티볼트의 옆구리를 깊게 벤다. 티볼트가 피를 쏟으며 쓰러진다. 로미오가 칼을 떨어뜨린다. 「나는 운명의 노리개다!」']
    ]); });
    var med = skill('med'), hb = herbs(), opts = [];
    if (med.lv) opts.push({ label: med.who + '(의학 ' + med.lv + ')' + U.jx(med.who, '이/가') + ' 상처를 꿰매고 지혈한다', value: 'med', icon: 'heart' });
    opts.push({ label: '짐칸의 약재 ' + K().herbs + '을 짓이겨 상처를 막는다 (지금 ' + hb + ')', value: 'herbs', icon: 'leaf', dis: hb < K().herbs });
    opts.push({ label: '이발사 외과의를 데려온다 (금화 ' + U.num(K().doctor) + '닢)', value: 'doctor', icon: 'coin', dis: s.player.gold < K().doctor });
    opts.push({ label: '맨손으로 상처를 꽉 눌러 피를 막는다', value: 'hand', icon: 'people' });
    var t = await UI.ask('티볼트가 피를 쏟는다 — 이대로면 죽는다', opts, me());
    b.tybalt = t;
    if (t === 'herbs') { var cg = s.fleet.cargo.herbs; cg.q -= K().herbs; if (cg.q <= 0) delete s.fleet.cargo.herbs; }
    if (t === 'doctor') s.player.gold -= K().doctor;
    if (t === 'hand') s.fleet.fatigue = Math.min(100, s.fleet.fatigue + 10);
    await play([
      [null, t === 'med' ? med.who + U.jx(med.who, '이/가') + ' 바늘과 실로 벌어진 살을 꿰맨다. 티볼트가 이를 악물고 신음한다. 피가 멎는다.' :
        t === 'herbs' ? '쓴 냄새 나는 약초를 짓이겨 상처에 처매자 피가 서서히 멎는다.' :
        t === 'doctor' ? '골목 끝 이발소에서 외과의가 달려와 상처를 지지고 꿰맨다. 티볼트가 비명을 지르다 정신을 잃는다. 숨은 붙어 있다.' :
        '제독이 두 손으로 상처를 짓누른다. 손가락 사이로 피가 배어 나오지만, 한참 뒤 그 흐름이 잦아든다.'],
      ['tybalt', '(희미하게 눈을 뜨고) …몬터규 편의 손에 목숨을 건지다니. 이 빚은… 잊지 않겠다. 하지만 머큐시오가 죽었다. 두 집안은 이제 끝장이다.'],
      ['escalus', '머큐시오는 내 친척이다! 로미오, 너는 오늘 밤 안에 베로나를 떠나라. 다시 이 성벽 안에서 보이면 그 시각이 네 마지막이다. 캐풀렛도 몬터규도 칼을 거두어라!'],
      ['juliet', '(제독의 소매를 붙잡고) 티볼트를 살려 주셔서 고마워요. 하지만 이제 아버지는 저를 파리스 백작에게 억지로 시집보내려 하세요. 목요일에요. …로렌스 수사님께 방법이 있을 거예요. 며칠 뒤, 저희에게 소식이 오거든 꼭 와 주세요.']
    ]);
    var so = fame('so', 60);
    log('베로나에서 몬터규와 캐풀렛 두 집안의 칼부림을 보았다. 머큐시오가 죽고, 로미오에게 베인 티볼트를 살렸다. 로미오는 베로나에서 쫓겨났다. (사교 명성 +' + so + ')');
    UI.toast('베로나의 두 연인 — 며칠 뒤 베니스·밀라노에서 소식이 온다', 'heart', 5600);
    refresh();
  }

  // ================================================================ 2부 — 잠의 약 · 성배 · 무덤
  function p2Open() { var b = st(); return !!(b && b.p1 && !b.p2 && inCity() && U.dayIndex(S().date) - b.p1 >= K().gap && !row('romeo') && !gone('romeo')); }
  // 네 잔의 글귀 — 참은 단 하나. 답은 납 잔 (금: 은잔이 아니다 · 은: 이 잔이다 · 납: 금잔의 말은 거짓 · 나무: 납잔이 아니다)
  var CUPS = [
    { id: 'gold', name: '금잔', text: '「해독의 잔은 은잔이 아니다.」' },
    { id: 'silver', name: '은잔', text: '「해독의 잔은 바로 이 잔이다.」' },
    { id: 'lead', name: '납잔', text: '「금잔에 새긴 말은 거짓이다.」' },
    { id: 'wood', name: '나무잔', text: '「해독의 잔은 납잔이 아니다.」' }
  ];
  RJ.CUPS = CUPS;
  /** 잔 x가 참된 잔일 때 참인 글귀 수 (시험에서 답이 하나뿐인지 본다) */
  RJ.truths = function (x) { var A = x !== 'silver', B = x === 'silver', C = !A, D = x !== 'lead'; return [A, B, C, D].filter(Boolean).length; };
  async function part2() {
    var b = st(), s = S(); b.met = 1; b.p2 = today();
    await withPic('rj_potion', '잠의 약', function () { return play([
      [null, cityName() + '의 부두. 흙먼지를 뒤집어쓴 청년이 말에서 굴러떨어지듯 내려 제독에게 달려온다.'],
      ['balthasar', '선장님! 로미오 도련님의 하인 발타자르입니다. 큰일 났습니다! 줄리엣 아가씨가… 쓰러지셨습니다!'],
      ['balthasar', '로렌스 수사님이 약을 지어 주셨습니다. 마시면 마흔두 시간 동안 숨도 맥박도 없이 죽은 듯 잠드는 약이랍니다. 아가씨가 먼저 마셔 캐풀렛가 무덤에 눕고, 도련님도 같은 약으로 죽은 척해서, 깨어나면 함께 멀리 달아나기로 하셨지요.'],
      ['balthasar', '그런데 깨우는 약 — 해독제를 들고 오시던 존 수사님이 역병 검역에 걸려 문 닫힌 집에 갇히셨고, 그 북새통에 약병이 깨졌습니다! 아가씨는 벌써 무덤에 계십니다. 깨우지 못하면 아가씨는… 정말로 다시 눈을 뜨지 못하실지도 모릅니다!']
    ]); });
    await withPic('rj_grail', '로렌스 수사의 암자 — 성배 문제', function () { return play([
      [null, '말을 달려 베로나 성 밖, 로렌스 수사의 암자. 말린 약초 다발이 천장에 매달리고, 증류 그릇에서 김이 오른다. 로미오가 창백한 얼굴로 기다리고 있다.'],
      ['romeo', '와 주셨군요! 해독제는 수사님과 제가 다시 달였습니다. 그런데 처방 끝에 이렇게 적혀 있습니다. 「이 물은 참된 잔에 담아야만 잠을 깨운다. 그릇된 잔에 담으면 그저 물일 뿐.」'],
      ['laurence', '(떨리는 손으로 탁자 위 네 잔을 가리키며) 옛 스승이 남긴 잔들이오. 저마다 글귀가 새겨져 있지. 스승은 말했소 — 「네 글귀 가운데 참은 단 하나뿐」이라고. 늙은 내 머리로는 도무지… 줄리엣이 잠든 지 벌써 열네 시간이오. 남은 건 스물여덟 시간.'],
      [null, '금잔: ' + CUPS[0].text + '\n은잔: ' + CUPS[1].text + '\n납잔: ' + CUPS[2].text + '\n나무잔: ' + CUPS[3].text + '\n\n— 네 글귀 가운데 참은 단 하나다.']
    ]); });
    var left = 28, solved = false, tries = 0;
    while (tries < K().tries && !solved) {
      tries++;
      var v = await UI.ask('참된 잔은 어느 것일까? (남은 시간 ' + left + '시간 · 기회 ' + (K().tries - tries + 1) + '번)', CUPS.map(function (c) { return { label: c.name + ' — ' + c.text, value: c.id, icon: c.id === 'gold' ? 'coin' : c.id === 'lead' ? 'shield' : 'mug' }; }), me());
      if (v === 'lead') { solved = true; break; }
      left -= 14;
      var hint = tries === 1
        ? '…아무 일도 일어나지 않습니다. (로미오가 이마를 짚는다) 잠깐, 수사님께 배운 대로 따져 봅시다. 은잔과 납잔의 글귀를 보세요. 은잔이 참이면 금잔의 말이 거짓이 되니 납잔의 말도 참 — 참이 둘이 됩니다. 그러니 은잔은 아닙니다.'
        : '…또 아닙니다. (로미오가 잔들을 하나씩 짚는다) 은잔이 아니면 금잔의 말 「은잔이 아니다」는 참입니다. 참은 하나뿐이니 나무잔의 말 「납잔이 아니다」는 거짓이어야 해요. 그렇다면…!';
      await play([['romeo', hint]]);
    }
    b.tries = tries;
    if (solved) {
      b.grail = 'solved';
      await play([[null, '거무스름한 납 잔에 해독제를 붓자, 맑던 물이 순식간에 장밋빛으로 물든다.'], ['laurence', '겉을 보지 말고 말을 보라 — 스승의 가르침이 바로 이것이었구려! 어서, 무덤으로!']]);
    } else {
      b.grail = 'friar';
      await play([[null, '해가 지고 있다. 로렌스 수사가 마지막 남은 납 잔을 집어 든다. 「…겉이 초라한 잔이 참이다. 스승은 늘 그렇게 말했지!」 물이 장밋빛으로 물든다. 그러나 시간이 너무 흘렀다.']]);
    }
    var item = R.addItem ? R.addItem('lead_grail') : false;
    await withPic('rj_tomb', '캐풀렛가의 무덤', function () { return play([
      [null, '한밤, 캐풀렛가의 무덤. 횃불 아래 대리석 관대 위에 줄리엣이 신부 옷차림으로 누워 있다. 입술이 하얗다. 로미오가 무릎을 꿇고 납 잔을 그녀의 입술에 댄다.'],
      [null, solved ? '한 모금, 두 모금. …줄리엣의 속눈썹이 떨린다. 뺨에 핏기가 돌아온다.' : '한 모금, 두 모금. 한참 동안 아무 일도 없다. 로미오가 그녀의 이름을 부르며 흐느낀다. …마침내, 아주 느리게, 줄리엣의 손가락이 움직인다.'],
      ['juliet', solved ? '(눈을 뜨며) …로미오? 여기가 어디죠? 아, 수사님 말씀대로 됐군요. 당신이 여기 있어서… 다행이에요.' : '(쉰 목소리로, 겨우 눈을 뜨며) …로미오? 너무 추워요. 꿈속에서 아주 오래 헤맸어요. 당신 목소리만 따라왔어요.'],
      ['romeo', '줄리엣! (그녀를 끌어안으며) 이제 베로나는 우리가 둘 다 죽은 줄 압니다. 수사님이 내일 아침 두 집안에 그렇게 알리실 겁니다. 몬터규의 로미오도, 캐풀렛의 줄리엣도 이 무덤에 함께 묻혔다고.'],
      ['laurence', '두 집안은 자식을 잃었다고 믿고 서로 손을 잡겠지. 그것이 너희의 혼인이 줄 수 있는 유일한 화해다. 그러니 너희는 이 땅을 떠나야 한다. 다시는 돌아올 수 없다.'],
      ['juliet', '(제독을 바라보며) 선장님. 저희를 바다로 데려가 주세요. 이름도 집안도 없는 두 사람이지만, 칼과 셈과 붓과 기도라면 쓸모가 있을 거예요.'],
      ['romeo', '제 칼은 이제 원수가 아니라 선장님의 배를 지키는 데 쓰겠습니다.']
    ]); });
    // 동료로 — 둘이 함께
    ['romeo', 'juliet'].forEach(function (id) {
      if (row(id)) return;
      var nm = G.Legend && G.Legend.join ? G.Legend.join(id, G.CITY_DATA[cityNow()]) : null;
      if (!nm) { nm = { id: id, role: 'none', joined: today(), loyal: 80 }; s.mates.push(nm); }
      var r0 = row(id); if (r0 && !solved && id === 'juliet') r0.loyal = Math.max(40, (r0.loyal || 80) - 15);
    });
    b.joined = 1;
    var so = fame('so', solved ? K().fame : Math.round(K().fame / 2));
    log('베로나의 캐풀렛가 무덤에서 잠든 줄리엣을 깨웠다. ' + (solved ? '로미오와 함께 성배 문제를 풀어 납 잔에 해독제를 담았다.' : '성배 문제를 풀지 못해 로렌스 수사가 마지막에 납 잔을 골랐다.') + ' 죽은 것으로 알려진 로미오와 줄리엣이 배에 올랐다. (사교 명성 +' + so + ')');
    UI.toast('로미오와 줄리엣이 동료가 되었다' + (item !== false ? ' · 기념품 「로렌스 수사의 납 잔」' : ''), 'heart', 6000);
    refresh();
  }

  // ================================================================ 소식 (만난 사람만)
  RJ.daily = function () {
    var b = st(), out = []; if (!b || !b.met) return out;
    var t = today(), told = b.told, j = !!b.joined, tail = j ? ' 그 둘이 지금 제독의 배에서 함께 살고 있다는 건 아무도 모른다.' : '';
    function news(key, icon, text) { if (!told[key] && t >= NEWS_AT[key]) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('daporto', 'book', '【베로나의 두 연인】 비첸차의 루이지 다 포르토가 「두 고귀한 연인의 이야기」를 펴냈다. 원수 집안의 로메오와 줄리에타가 몰래 혼인하고, 잠의 약과 엇갈린 소식 끝에 둘 다 무덤에서 죽는다는 이야기다.' + tail);
    news('bandello', 'book', '【반델로의 이야기】 마테오 반델로의 이야기책에 베로나의 두 연인이 다시 실렸다. 이야기는 점점 더 슬퍼진다 — 머큐시오도 죽고, 티볼트도 죽고, 연인도 죽는다.' + (b.tybalt ? ' 티볼트가 살아났다는 건 이야기꾼들이 모르는 일이다.' : ''));
    news('brooke', 'book', '【로메우스와 줄리엣】 잉글랜드의 아서 브룩이 그 이야기를 긴 시로 옮겼다. 「사랑에 눈먼 젊은이들에게 주는 경고」라는 머리말까지 붙었다.' + tail);
    news('shakes', 'book', '【셰익스피어의 비극】 런던의 극작가 윌리엄 셰익스피어가 『로미오와 줄리엣』을 무대에 올렸다. 「별이 엇갈린 두 연인」은 무덤에서 함께 죽고, 그 죽음으로 두 집안이 화해한다. 관객들이 손수건을 적신다.' + (j ? ' …제독의 배에서 로미오와 줄리엣이 이 소식을 듣고 한참을 웃었다.' : ''));
    return out;
  };

  // ================================================================ 도시에 들어설 때 · 수첩
  RJ.pending = function () { var s = S(); if (!s || !inCity()) return false; return p1Open() || p2Open(); };
  RJ.check = async function () {
    if (RJ._busy) return false; RJ._busy = true;
    try { if (p2Open()) await part2(); else if (p1Open()) await part1(); } catch (e) { console.error(e); }
    RJ._busy = false;
    return true;
  };
  RJ.html = function () {
    var s = S(), b = s && s.romeo; if (!b || !b.p1 || b.p2) return '';
    var d = K().gap - (U.dayIndex(s.date) - b.p1);
    return '<div class="sep"></div><h4 style="margin:0 0 8px">베로나의 두 연인</h4><ul><li>' + U.esc(d > 0 ? d + '일 뒤부터 베니스나 밀라노에 들르면 로미오의 하인이 찾아온다' : '베니스나 밀라노에 들르면 로미오의 하인이 찾아온다 — 줄리엣이 위험하다') + '</li></ul>';
  };
  if (G.Court && G.Court.taskHtml && !G.Court._romeoHtml) { G.Court._romeoHtml = true; var th = G.Court.taskHtml; G.Court.taskHtml = function () { return th.apply(this, arguments) + RJ.html(); }; }
  (function hookDaily() {
    var W = G.World; if (!W || W._romeo) return;
    W._romeo = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(RJ.daily()); } catch (e) { console.error(e); } return out; };
  })();
  RJ._t = { part1: part1, part2: part2 };
})(window.G = window.G || {});
