/* 바다의 사람들 (G.Rovers) — 2026-11-04 사용자 요청 「스페르베르 · 메이플라워 · 헨드릭 하멜 · 얀 얀서 벨테브레이 · 그레이스 오말리 · 앤 보니&메리 리드 · 에드워드 티치」
   「해적선은 대결하여 약탈 후 서로 친해지는 이벤트」 · 「이주 이벤트는 물품 조달이나 원주민과의 이벤트로」. 사람·조정값: js/data/rovers.js (G.BALANCE.rovers)
   ■ 메이플라워 (이주) — 도시에 들어설 때
     ① 런던 1620.6~9.10: 순례자들의 대리인 크리스토퍼 마틴이 배에 실을 밀·맥주를 찾는다 → 짐칸에 있으면 값의 k배로 넘긴다
     ② 플리머스 1620.12.21~1621.3.15: 첫 겨울 — 절반이 쓰러졌다. 식량 food일분 / 약재 herbs통 / 떠난다
     ③ 플리머스 1621.3.16~8.31: 「웰컴, 잉글리시먼!」 사모셋, 스콴토, 왐파노아그의 마사소이트. 서로 겁먹은 두 무리 사이에서
        모직물·면직물·동광석(gift통)을 선물로 내거나 웅변으로 말을 잇는다 → 평화의 약속 · 스콴토가 물고기를 묻어 옥수수 심는 법을 가르친다
     ④ 플리머스 1621.9.20~11.30 (②나 ③에 함께했으면): 첫 추수 잔치 — 마사소이트와 아흔 사람이 사슴 다섯 마리를 들고 온다
   ■ 조선의 네덜란드 사람들
     ⑤ 한양 1628~1660: 훈련도감의 박연(벨테브레이) — 고향 말을 잊어 가는 사내 · 조선말 한 단계 · 홍이포 설계도
     ⑥ 제주 앞바다 1653.8~9 (바다): 스페르베르호의 난파 — 생존자를 건진다(항해·운용 2가 없으면 선원 몇을 잃는다) · 제주 목사 이원진 · 박연이 통역하러 온다(⑤를 만났으면)
     ⑦ 여수 앞바다 1666.8~9.15 (바다): 작은 배로 달아나는 하멜과 일곱 사람 — (가) 하멜을 태운다(동료) (나) 나가사키 물길만 알려 준다 (다) 못 본 척
   ■ 해적 — 그 바다에서 하루 끝마다 chance: 「통행세를 내든지 싸우든지」 → 싸우면 큰 해전(G.Rel.greatBattle)
        이기면 해적의 짐을 털고(포상) 이튿날 서로 술잔을 나누며 동료가 된다 · 지면 해적이 소지금의 plunder를 털어 가고 웃으며 떠난다(again일 뒤 다시)
        통행세(toll)를 내면 싸우지 않고 지나간다(again일 뒤 다시)
     ⑧ 그레이스 오말리 (1565~1600, 아일랜드 서쪽 클루 만) ⑨ 앤 보니와 메리 리드 (1685~1699, 자메이카~바하마) ⑩ 에드워드 티치 「검은 수염」 (1685~1699, 캐롤라이나 앞바다)
        ※ 보니·리드·티치의 실제 활동은 1716~1720 — 게임이 1700년에 끝나므로 전설 동료로 앞당겼다.
   ■ 소식: 메이플라워 서약 · 플리머스 · 왐파노아그와의 약속 · 스페르베르호의 난파 · 하멜의 탈출 · 『하멜 표류기』 · 그라누알과 엘리자베스(오말리를 만났으면)
   ■ 저장: s.rovers = { told: {}, supply, winter, natives, feast, weltevree, sperwer, hamel, omalley, bonny, teach, <열쇠>How, <열쇠>Cool, day, hit } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var RV = G.Rovers = {};
  function K() { return G.BALANCE.rovers; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  var NEWS = ['compact', 'plymouth', 'treaty', 'sperwer', 'hamelEsc', 'hamelBook', 'granuaile'];
  var NEWS_AT = { compact: 16201121, plymouth: 16201226, treaty: 16210322, sperwer: 16530816, hamelEsc: 16660904, hamelBook: 16680601, granuaile: 15930906 };
  RV.NEWS_AT = NEWS_AT;
  function st() {
    var s = S(); if (!s) return null;
    if (!s.rovers) { s.rovers = { told: {} }; NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.rovers.told[k] = 1; }); }
    s.rovers.told = s.rovers.told || {};
    return s.rovers;
  }
  RV.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function row(id) { return (S().mates || []).filter(function (x) { return x.id === id; })[0] || null; }
  function gone(id) { var s = S(); return !!(s.flags && s.flags['gone_' + id]); }
  function free(id) { return !!(G.MATE[id] && !row(id) && !gone(id)); }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) {
    if (k === 'P') return me();
    if (k === 'first') return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    if (G.MATE[k] && row(k) && G.Legend && G.Legend.speaker) return G.Legend.speaker(k);
    return G.Hist ? G.Hist.speaker('rv_' + k) : { name: k, lang: 3 };
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function log(t) { G.State.log(t); }
  function skill(id) { var b = R.skillBest ? R.skillBest(id) : { lv: R.skill(id), who: null }; return { lv: (b && b.lv) || 0, who: (b && b.who) || '제독' }; }
  function item(id) { return R.addItem ? R.addItem(id) !== false : false; }
  function num(n) { return U.num(Math.round(n)); }
  function qty(id) { var c = S().fleet.cargo || {}; return c[id] ? c[id].q || 0 : 0; }
  function take(id, n) { var c = S().fleet.cargo, cg = c && c[id]; if (!cg) return 0; n = Math.min(cg.q, n); if (R.takeCargoLots) R.takeCargoLots(cg, null, n, 0); cg.q -= n; if (cg.q <= 0) delete c[id]; return n; }
  function foodNeed(days) { return Math.ceil(R.dailyUse() * days); }
  function join(id) {
    var s = S(), nm = G.Legend && G.Legend.join ? G.Legend.join(id, null) : null;
    if (!nm) { nm = { id: id, role: 'none', joined: today(), loyal: K().loyal }; s.mates.push(nm); }
    nm.loyal = Math.max(nm.loyal || 0, K().loyal || 80);
    if (G.Achieve && G.Achieve.afterHire) { try { G.Achieve.afterHire(id); } catch (e) { console.error(e); } }
    return nm;
  }
  function later(key, how) { var b = st(); b[key] = null; b[key + 'How'] = how; b[key + 'Cool'] = S().day + (K().again || 180); }
  function cooled(key) { var b = st(); return !(b[key + 'Cool'] > S().day); }
  function inWin(k) { var t = today(); return t >= k.from && t <= k.to; }
  function cityOpen(key, need) { var b = st(), k = K()[key]; return !!(b && !b[key] && cooled(key) && cityNow() === k.city && inWin(k) && (need ? need(b) : true)); }
  function inBox(k) { var l = S().loc; return !!(l && l.mode === 'sea' && l.lon != null && l.lon >= k.box[0] && l.lon <= k.box[1] && l.lat >= k.box[2] && l.lat <= k.box[3]); }
  function seaOpen(key) { var b = st(), k = K()[key]; return !!(b && !b[key] && cooled(key) && inWin(k) && inBox(k)); }

  // ================================================================ ① 메이플라워 — 배에 실을 물자 (런던 1620)
  RV.supply = async function () {
    var b = st(), k = K().supply, s = S(); b.supply = 'met';
    await withPic('rv_supply', '순례자들의 물자 (1620)', function () { return play([
      [null, '런던의 부두. 낡은 화물선 메이플라워호가 짐을 싣고 있다. 잉글랜드 국교회를 떠나 네덜란드 레이던에 숨어 살던 「분리파」 신자들과, 새 땅에서 한몫 잡으려는 사람들이 함께 대서양을 건너려 한다.'],
      ['cmartin', '나는 크리스토퍼 마틴, 이 항해의 물자를 맡았소. 그런데 돈은 모자라고 출발은 늦어졌소. 배에 밀과 맥주가 모자라오 — 바다에서 물은 썩지만 맥주는 버티지. 밀 ' + k.goods.wheat + '통, 맥주 ' + k.goods.beer + '통. 그대 짐칸에 있다면 값을 넉넉히 쳐 드리겠소.']
    ]); });
    var ids = Object.keys(k.goods), ok = ids.every(function (id) { return qty(id) >= k.goods[id]; });
    var pay = Math.round(ids.reduce(function (a, id) { return a + k.goods[id] * G.GOOD[id].p * k.k; }, 0));
    var v = await UI.ask('메이플라워에 실을 물자 — ' + ids.map(function (id) { return G.GOOD[id].name + ' ' + k.goods[id] + '통(지금 ' + qty(id) + ')'; }).join(' · '), [
      { label: '넘긴다 (금화 ' + num(pay) + '닢)', value: 'sell', dis: !ok },
      { label: ok ? '팔지 않는다' : '짐칸에 모자라다 — 다음에', value: 'no' }], who('cmartin'));
    if (v === 'sell' && ok) {
      ids.forEach(function (id) { take(id, k.goods[id]); }); s.player.gold += pay; b.supply = 'sold';
      var tr = fame('tr', 30);
      await play([['cmartin', '고맙소! 이걸로 대서양을 건널 수 있겠소. 9월에는 떠나야 하오 — 겨울이 오기 전에 닿아야 하니까.']]);
      log('런던에서 메이플라워호에 밀 ' + k.goods.wheat + '통과 맥주 ' + k.goods.beer + '통을 넘겼다. (금화 +' + num(pay) + ' · 교역 명성 +' + tr + ')');
    } else { later('supply', 'no'); }
    refresh(); return true;
  };

  // ================================================================ ② 메이플라워 — 플리머스의 첫 겨울
  RV.winter = async function () {
    var b = st(), k = K().mayflower, s = S(); b.winter = 'met';
    await withPic('rv_winter', '플리머스의 첫 겨울', function () { return play([
      [null, '눈 덮인 만. 메이플라워호가 닻을 내린 채 떠 있고, 바닷가 언덕에는 짓다 만 오두막 몇 채뿐이다. 남쪽 버지니아로 가려던 배가 폭풍에 밀려 이 북쪽 해안에 닿았다. 배에서 내리기 전, 사람들은 선실에서 「스스로 법을 정하고 따르겠다」는 약속에 서명했다.'],
      ['bradford', '바다의 손님… 보시다시피 우리는 겨울을 이기지 못하고 있소. 괴혈병과 열병으로 날마다 누군가를 언덕에 묻소. 원주민들의 눈에 띄지 않게, 무덤 위에 옥수수를 심어 감추고 있지.'],
      ['bradford', '먹을 것과 약이 있다면, 봄까지만 버티게 해 주시오.']
    ]); });
    var need = foodNeed(k.food), foodOk = (s.fleet.food || 0) >= need, herbsOk = qty('herbs') >= k.herbs;
    var v = await UI.ask('플리머스의 첫 겨울', [
      { label: '식량 ' + k.food + '일분을 나눈다', value: 'food', dis: !foodOk },
      { label: '약재 ' + k.herbs + '통으로 아픈 이들을 돌본다' + (skill('med').lv ? ' (의학 ' + skill('med').lv + ')' : ''), value: 'herbs', dis: !herbsOk },
      { label: '떠난다', value: 'leave' }], who('bradford'));
    if (v === 'food' && foodOk) s.fleet.food -= need;
    else if (v === 'herbs' && herbsOk) take('herbs', k.herbs);
    else { later('winter', 'leave'); refresh(); return true; }
    b.winter = v; item('mayflower_compact');
    var so = fame('so', 120);
    await play([['bradford', '하느님께서 그대를 보내셨소. 봄이 오면 이 언덕에 첫 집들이 설 것이오. 이건 배에서 우리가 서명한 약속의 사본이오 — 기념으로 가지시오.']]);
    log('1620년 겨울, 플리머스의 순례자들에게 ' + (v === 'food' ? '식량 ' + k.food + '일분' : '약재 ' + k.herbs + '통') + '을 나누었다. (사교 명성 +' + so + ')');
    refresh(); return true;
  };

  // ================================================================ ③ 메이플라워 — 왐파노아그와의 약속
  RV.natives = async function () {
    var b = st(), k = K().natives; b.natives = 'met';
    await withPic('rv_samoset', '「웰컴, 잉글리시먼!」 (1621)', function () { return play([
      [null, '봄. 숲에서 키 큰 사내 하나가 활을 들고 성큼성큼 마을로 걸어 들어왔다. 순례자들이 총을 움켜쥐는데, 사내가 활짝 웃으며 외친다.'],
      ['samoset', '웰컴, 잉글리시먼! (서툰 말로) 나 사모셋. 북쪽에서 온 사람. 잉글랜드 고기잡이배에서 말 배웠다. 맥주 있나?'],
      [null, '며칠 뒤 사모셋이 다른 사내를 데려왔다. 잉글랜드 말을 유창하게 한다 — 스콴토. 몇 해 전 잉글랜드 노예상에게 붙잡혀 에스파냐에 팔렸다가, 런던을 거쳐 고향에 돌아와 보니 마을 사람들이 모두 역병으로 죽고 없었다고 한다.'],
      ['squanto', '대추장 마사소이트가 언덕 너머에 와 있소. 예순 명과 함께. 그는 이 잉글랜드 사람들을 지켜보고 있었소 — 겨울 동안 남의 곡식 저장 구덩이를 판 사람들이라는 것도 알고 있지. 이 만남이 잘못되면 피를 볼 거요.'],
      ['massasoit', '(언덕 위에서 붉게 칠한 얼굴로) 우리 땅에 온 사람들이여. 우리는 이웃 나라라간세트와 싸우고 있고, 역병으로 많은 사람을 잃었다. 너희는 친구가 될 것이냐, 또 다른 적이 될 것이냐.']
    ]); });
    var gifts = k.gifts.filter(function (id) { return qty(id) >= k.gift; }), sp = skill('speech');
    var opts = gifts.map(function (id) { return { label: G.GOOD[id].name + ' ' + k.gift + '통을 선물로 내놓는다', value: 'g:' + id }; });
    opts.push({ label: sp.lv ? '스콴토와 함께 두 쪽의 말을 잇는다 (웅변 ' + sp.lv + ' — ' + sp.who + ')' : '말을 잇는다 — 웅변이 있어야 한다', value: 'talk', dis: !sp.lv });
    opts.push({ label: '끼어들지 않는다', value: 'leave' });
    var v = await UI.ask('마사소이트와 순례자들 사이에서', opts, who('massasoit'));
    if (v === 'leave' || !v || (v === 'talk' && !sp.lv)) { later('natives', 'leave'); await play([[null, '제독은 한 걸음 물러섰다. 그날 해 질 녘, 언덕 위와 아래에서 서로를 지켜보는 눈길만 오래 이어졌다.']]); refresh(); return true; }
    if (v.indexOf('g:') === 0) { var gid = v.slice(2); take(gid, k.gift); b.natives = gid; }
    else b.natives = 'talk';
    await withPic('rv_treaty', '마사소이트와의 약속', function () { return play([
      ['P', b.natives === 'talk' ? '대추장, 이 사람들은 겨울에 굶주려 남의 곡식에 손을 댔습니다. 그 값을 치르고 싶어 합니다. 그리고 나라간세트가 쳐들어오면 함께 싸우겠다고 합니다.' : '대추장, 바다 건너에서 가져온 ' + G.GOOD[b.natives].name + '입니다. 겨울에 이 사람들이 진 빚의 값이라 여겨 주십시오.'],
      ['massasoit', '…좋다. 서로 해치지 않는다. 누가 쳐들어오면 서로 돕는다. 무기를 들고 서로의 마을에 오지 않는다.'],
      ['squanto', '(이튿날, 순례자들의 밭에서) 보시오. 옥수수 씨 하나에 물고기 두 마리를 함께 묻어야 하오. 이 땅은 물고기를 먹어야 옥수수를 키우지. 강에 청어가 올라오는 철이 지금이오.'],
      ['bradford', '스콴토는 하느님이 보내신 도구요. 그리고 그대도.']
    ]); });
    var so = fame('so', 150);
    log('1621년 봄 플리머스에서 왐파노아그의 마사소이트와 순례자들 사이의 약속을 도왔다' + (b.natives === 'talk' ? ' (말로)' : ' (' + G.GOOD[b.natives].name + ' ' + k.gift + '통)') + '. 스콴토가 물고기를 묻어 옥수수를 심는 법을 가르쳤다. (사교 명성 +' + so + ')');
    UI.toast('왐파노아그와의 약속 · 사교 명성 +' + so, 'scroll', 5200);
    refresh(); return true;
  };

  // ================================================================ ④ 메이플라워 — 첫 추수 잔치
  RV.feast = async function () {
    var b = st(); b.feast = 1;
    await withPic('rv_feast', '첫 추수 잔치 (1621)', function () { return play([
      [null, '가을. 옥수수가 익었다. 순례자들이 들새를 잡아 잔치를 열자, 총소리를 들은 마사소이트가 아흔 사람을 이끌고 왔다. 그들은 사슴 다섯 마리를 메고 왔다. 사흘 동안 두 무리가 함께 먹고, 활을 겨루고, 춤을 추었다.'],
      ['massasoit', '바다의 친구여, 너도 와 앉아라. 봄에 네가 이어 준 말이 오늘 이 불가에 있다.'],
      ['squanto', '잔치는 사흘이면 끝나지만 약속은 오래가야 하오. …그대 같은 사람이 이 바다에 더 많았으면 좋겠군.']
    ]); });
    var so = fame('so', 120);
    log('1621년 가을, 플리머스에서 순례자들과 왐파노아그 사람들의 첫 추수 잔치에 함께했다. (사교 명성 +' + so + ')');
    refresh(); return true;
  };

  // ================================================================ ⑤ 한양 — 박연 (얀 얀서 벨테브레이)
  RV.weltevree = async function () {
    var b = st(), s = S(); b.weltevree = 1;
    await withPic('rv_weltevree', '훈련도감의 박연', function () { return play([
      [null, '한양, 훈련도감. 붉은 수염에 파란 눈의 사내가 조선 무관의 갓을 쓰고 화포 앞에서 군사들을 다그치고 있다. 군사들은 그를 「박연」이라 부른다.'],
      ['weltevree', '(조선말로) 서양 배를 탄 손님이라고? …(한참 망설이다 서툰 네덜란드 말로) 나는… 얀 얀서. 벨테브레이. 드레이프 마을. 우베르케르크호를 탔지. 물을 길으러 내렸다가 붙잡힌 게 정묘년이었소.'],
      ['weltevree', '고향 말이 입에서 자꾸 빠져나가오. 이제는 꿈도 조선말로 꾸지. 조선 아내와 아이들도 있소. 오랑캐가 쳐들어왔을 때는 이 포를 들고 싸웠다오.'],
      ['weltevree', '그대 배에 조선말을 배울 사람이 있으면 가르쳐 주겠소. 그리고 이건 — 내가 조선에 남길 것이오. 서양 대포, 홍이포를 만드는 법이지.']
    ]); });
    var lg = s.player.lg, before = lg[14] || 0;
    if (before < 2) lg[14] = before + 1;
    item('hongi_cannon');
    var so = fame('so', 60);
    log('한양 훈련도감에서 귀화한 네덜란드 사람 박연(얀 얀서 벨테브레이)을 만났다.' + (before < 2 ? ' 그에게서 조선말을 배웠다(' + (G.LANG_LV ? G.LANG_LV[lg[14]] : lg[14]) + ').' : '') + ' (사교 명성 +' + so + ')');
    UI.toast('박연의 홍이포 설계도' + (before < 2 ? ' · 조선어 +1' : ''), 'scroll', 5200);
    refresh(); return true;
  };

  // ================================================================ ⑥ 제주 앞바다 — 스페르베르호의 난파 (1653)
  RV.sperwer = async function () {
    var b = st(), s = S(); b.sperwer = 'met';
    await withPic('rv_sperwer', '스페르베르호의 난파 (1653)', function () { return play([
      [null, '제주 남쪽 바다, 폭풍이 지나간 새벽. 부서진 큰 배의 돛대가 파도 사이로 기울어 있다. 네덜란드 동인도 회사의 스페르베르호 — 타이완에서 나가사키로 가던 배다. 바위 해안에 사람들이 매달려 손을 흔든다.'],
      ['first', '제독님, 살아 있는 사람이 많습니다! 하지만 파도가 아직 높아 거룻배를 내리면 우리 사람도 위험합니다.']
    ]); });
    var nav = Math.max(skill('nav').lv, skill('ops').lv);
    var v = await UI.ask('스페르베르호의 생존자들', [{ label: '거룻배를 내려 생존자들을 건진다' + (nav >= 2 ? ' (항해·운용 ' + nav + ')' : ' — 선원을 잃을 수 있다'), value: 'save' }, { label: '지나간다', value: 'pass' }], me());
    if (v !== 'save') { later('sperwer', 'pass'); refresh(); return true; }
    var lost = nav >= 2 ? 0 : Math.min(3, Math.max(0, s.fleet.crew - 1)); s.fleet.crew -= lost;
    b.sperwer = 'saved';
    await play([
      [null, (lost ? '높은 파도에 선원 ' + lost + '명을 잃었지만, ' : '') + '바위 해안의 사람들을 하나둘 건져 올렸다. 예순네 명 가운데 살아남은 서른여섯 명.'],
      ['hamel', '(물에 젖은 일지를 끌어안고) 고맙소… 나는 헨드릭 하멜, 이 배의 서기요. 선장님은 돌아가셨소. 여기가 어디요? 켈파트? 일본은 아니지요?'],
      ['yiwonjin', '(말을 탄 관리들이 해안에 늘어선다) 나는 제주 목사 이원진이다. 이 땅에 표류한 이국인들은 나라의 법에 따라 한양으로 보낸다. 손님의 배는 물러가시오.'],
      b.weltevree ? ['weltevree', '(몇 달 뒤, 한양에서 온 붉은 수염의 사내가 그들 앞에 섰다) …너희는 네덜란드 사람이냐? 나도 그렇다. 박연이다. 너희는 이 나라를 떠나지 못할 것이다 — 나처럼.'] : null,
      ['hamel', '(관리들에게 끌려가며 돌아보고) 이 일을 적어 두겠소! 그대 배의 이름도!']
    ]);
    var so = fame('so', 120);
    log('1653년 제주 앞바다에서 부서진 스페르베르호의 생존자들을 건졌다' + (lost ? ' (선원 ' + lost + '명을 잃었다)' : '') + '. 서기 헨드릭 하멜과 서른여섯 사람은 제주 목사에게 넘겨졌다. (사교 명성 +' + so + ')');
    refresh(); return true;
  };

  // ================================================================ ⑦ 여수 앞바다 — 하멜의 탈출 (1666)
  RV.hamel = async function () {
    var b = st(), knew = b.sperwer === 'saved'; b.hamel = 'met';
    await withPic('rv_hamel', '하멜의 탈출 (1666)', function () { return play([
      [null, '여수 앞바다, 달 없는 밤. 돛 하나짜리 작은 고깃배가 남쪽으로 노를 젓고 있다. 배에는 조선 옷을 입은 서양 사람 여덟. 열세 해 동안 조선에 묶여 있던 스페르베르호 사람들이다.'],
      ['hamel', knew ? '(배를 알아보고 눈을 크게 뜬다) 그 배! 그 이름! 제주 앞바다에서 우리를 건졌던… 열세 해 만이오! 일지에 적어 둔 그대로요!' : '(겁에 질려 노를 멈춘다) 조선 수군이 아니라 서양 배다! …나는 헨드릭 하멜. 스페르베르호의 서기였소. 열세 해 동안 이 나라에 붙잡혀 있었소. 나가사키로 가려 하오.'],
      ['hamel', '우리를 고발하지 말아 주시오. 이 작은 배로는 일본까지 갈 수 있을지 모르겠소. 동인도 회사는 우리에게 열세 해 치 품삯을 빚졌지. 그걸 받아 내려면 이 이야기를 적어 가야 하오.']
    ]); });
    var v = await UI.ask('달아나는 하멜의 작은 배', [
      { label: '하멜을 우리 배에 태운다 (일곱은 나가사키로)', value: 'take' },
      { label: '나가사키로 가는 물길과 물·식량만 건넨다', value: 'guide' },
      { label: '못 본 척 지나간다', value: 'pass' }], who('hamel'));
    if (v === 'pass') { later('hamel', 'pass'); refresh(); return true; }
    if (v === 'take' && free('hamel')) {
      b.hamel = 'joined';
      await play([['hamel', '…좋소. 동료들은 나가사키의 데지마로 가고, 나는 그대 배에서 이 일지를 마저 적겠소. 조선말이라면 내가 그대 배에서 누구보다 잘하오. 장부도 볼 줄 알지 — 서기였으니까.']]);
      join('hamel'); item('hamel_journal');
      log('1666년 여수 앞바다에서 조선을 탈출하던 헨드릭 하멜을 배에 태웠다. 하멜이 동료가 되었다.');
      UI.toast('헨드릭 하멜이 동료가 되었다 — 회계 3 · 역사학 2 · 조선어 3', 'heart', 5200);
    } else {
      b.hamel = 'guide';
      await play([['hamel', '고맙소! 일지에 그대 이름을 적겠소. 언젠가 암스테르담에서 이 이야기가 책이 되면, 거기 그대도 있을 거요.']]);
      item('hamel_journal'); var so = fame('so', 100);
      log('1666년 여수 앞바다에서 조선을 탈출하던 헨드릭 하멜 일행에게 나가사키로 가는 물길을 알려 주었다. (사교 명성 +' + so + ')');
    }
    refresh(); return true;
  };

  // ================================================================ 해적 — 맞붙어 털고, 친해진다
  var PIRATE = {
    omalley: { boss: 'grace', mates: ['omalley'], pic: 'rv_omalley', title: '클루 만의 갤리선',
      hail: [[null, '아일랜드 서쪽, 섬이 흩어진 클루 만. 안개 속에서 노 서른 개짜리 갤리선 세 척이 미끄러져 나와 제독의 배를 에워쌌다. 맨 앞 배의 뱃머리에 짧은 붉은 머리의 여인이 서 있다.'],
        ['grace', '이 바다는 오말리 집안의 바다다! 지나가려면 통행세를 내라. 싫으면 — 칼로 내 보든가!']],
      spec: { foe: '아일랜드 해적', foeLabel: '그라누알의 갤리선', ships: ['galley', 'galley', 'galley', 'pinnace'], names: ['그라누알의 기함', '오말리 집안의 갤리선', '오플라허티 집안의 갤리선', '정찰선'],
        boss: { hist: 'rv_grace', str: 80, mar: 88, int: 76, cha: 86, line: '바다에서 나를 꺾은 자는 아직 없다!' }, gold: 6000, fame: 400 },
      win: [['grace', '(칼을 내던지며 껄껄 웃는다) 하! 내 갤리선을 이렇게 몰아붙인 놈은 처음이다. 내 배의 은은 가져가라 — 이긴 놈 몫이지. …그런데 오늘 밤은 내 성에서 위스키를 마시자.'],
        [null, '그날 밤 록플리트 성의 탑에서, 그라누알은 바다 이야기를 끝없이 늘어놓았다. 새벽이 올 무렵 그녀가 잔을 내려놓았다.'],
        ['grace', '잉글랜드 총독 놈들이 내 배를 하나씩 빼앗아 가고 있지. 이 만에 갇혀 있느니 너와 넓은 바다를 보겠다. 대신 내 배에서는 내 말이 법이다 — 알겠지? 하하!']],
      lose: [['grace', '(제독의 금화 상자를 갑판에 내려놓게 하고) 통행세는 이걸로 됐다. 이 바다에서 칼을 뽑을 배짱이 있는 놈은 오랜만이군. 다음에 다시 붙자 — 그때도 이기면 술은 내가 사지!']],
      item: 'granuaile_brooch' },
    bonny: { boss: 'bonny', mates: ['bonny', 'mread'], pic: 'rv_bonny', title: '래컴의 슬루프',
      hail: [[null, '카리브의 푸른 바다. 옥양목 깃발 — 해골 아래 엇갈린 칼 두 자루 — 을 단 날렵한 슬루프가 다가온다. 갑판에서 줄무늬 옷의 사내가 술병을 흔들고, 그 앞에서 붉은 머리의 여인과 갈색 머리의 여인이 칼을 뽑아 든다.'],
        ['rackham', '하하, 짐 많은 배로군! 나는 캘리코 잭. 짐의 절반만 내놓으면 다들 무사히—'],
        ['bonny', '(잭의 말을 자르며) 잭, 입 다물어. 협상은 내가 해. 어이, 거기! 짐을 내놓든가, 우리 칼맛을 보든가!'],
        ['read', '(조용히) 앤, 저 배는 포가 많다. …그래도 싸울 거지?']],
      spec: { foe: '해적', foeLabel: '캘리코 잭의 해적단', ships: ['pinnace', 'tartane', 'pinnace'], names: ['리벤지호 (래컴)', '노획한 타르타나', '해적 슬루프'],
        boss: { hist: 'rv_bonny', str: 74, mar: 86, int: 66, cha: 90, line: '겁쟁이들은 갑판 밑으로 숨어라!' }, gold: 5000, fame: 350 },
      win: [['bonny', '(갑판에 주저앉아 숨을 몰아쉬며 웃는다) 젠장, 졌다! 짐은 가져가. 잭은 술에 취해 갑판 밑에서 안 나오더라. 사내답게 싸웠으면 이 꼴은 안 났지.'],
        ['read', '(칼을 거두며) 너희 배는 제대로 싸웠다. 플랑드르에서 본 어느 연대보다 나았어.'],
        [null, '그날 밤 두 배의 선원들이 한 갑판에서 럼주를 나눴다. 앤이 제독의 잔에 잔을 부딪쳤다.'],
        ['bonny', '결정했어. 잭은 여기 두고 간다. 메리, 너도 가지? 이 제독의 배라면 겁쟁이는 없겠어.'],
        ['read', '…앤이 가면 나도 간다. 그게 우리 약속이니까.']],
      lose: [['bonny', '(제독의 금화 상자를 걷어차 열며) 이 정도면 됐어! 칼솜씨는 나쁘지 않던데? 다음에 또 만나면 그땐 럼주부터 마시자고!'], ['read', '(지나가며 낮게) 다음엔 왼쪽을 조심해라. 앤은 늘 왼쪽으로 들어온다.']],
      item: 'calico_pistol' },
    teach: { boss: 'teach', mates: ['blackbeard'], pic: 'rv_teach', title: '앤 여왕의 복수호',
      hail: [[null, '캐롤라이나 앞바다, 오크러코크 섬 근처의 얕은 물목. 마흔 문의 포를 단 큰 배가 검은 깃발을 올린다 — 뿔 달린 해골이 창으로 붉은 심장을 찌르는 그림. 갑판 위로 시커먼 연기가 피어오른다.'],
        ['first', '제독님, 저… 저건 사람입니까? 수염에서 연기가… 머리에서 불이…'],
        ['teach', '(모자 밑의 도화선에서 연기를 피워 올리며 우레 같은 목소리로) 나는 검은 수염이다! 지옥에서 바로 왔지! 짐을 넘겨라. 그러면 아무도 다치지 않는다. 싸우면 — 살아남는 놈이 없다!']],
      spec: { foe: '해적', foeLabel: '검은 수염의 해적 함대', ships: ['frigate', 'pinnace', 'pinnace', 'tartane'], names: ['앤 여왕의 복수호 (검은 수염)', '어드벤처호', '리벤지호', '노획한 타르타나'],
        boss: { hist: 'rv_teach', str: 92, mar: 94, int: 72, cha: 70, line: '내 수염의 연기를 마시고도 살아남을 테냐!' }, gold: 9000, fame: 500 },
      win: [['teach', '(도화선을 뽑아 바다에 던지고, 연기 사이로 이를 드러내며 웃는다) 하하하! 내 연기에 겁먹지 않은 놈은 처음이다! 짐은 가져가라. 사실 이 연기는 싸우지 않으려고 피우는 거다 — 다들 겁먹고 항복하니까 피를 볼 일이 없지.'],
        [null, '그날 밤, 무시무시한 해적은 촛불 아래서 뜻밖에 조용했다. 노획한 배의 항해 일지를 넘기며 바다 길을 이야기했다.'],
        ['teach', '이 바다엔 이제 나를 잡으러 오는 군함뿐이다. 너 같은 놈 배에서 포나 쏘는 게 낫겠군. 포라면 내가 바다에서 제일이지 — 수염은 그대로 두겠다. 하하!']],
      lose: [['teach', '(금화 상자를 들어 보이며) 봐라, 아무도 죽지 않았지? 이게 검은 수염의 장사다! 너는 제법 버텼다. 다음에 다시 붙으면… 그땐 술 한잔하자.']],
      item: 'blackbeard_fuse' }
  };
  RV.PIRATE = PIRATE;
  function pirateFree(key) { return PIRATE[key].mates.every(free); }
  function pirateOpen(key) { var b = st(); return !!(b && !b[key] && pirateFree(key) && cooled(key) && inWin(K()[key]) && inBox(K()[key])); }
  function pirateAfter(key) { var b = st(); return !!(b && (b[key] === 'won' || b[key] === 'lost') && S().loc.mode === 'sea'); }
  function roll(key) {   // 하루에 한 번만 굴린다
    var b = st(), s = S(), d = b.roll || (b.roll = {});
    if (d[key] && d[key].day === s.day) return d[key].hit;
    var hit = U.chance(K()[key].chance || 0.3); d[key] = { day: s.day, hit: hit }; return hit;
  }
  async function pirate(key) {
    var P = PIRATE[key], b = st(), k = K()[key], s = S();
    if (b.roll && b.roll[key]) b.roll[key].hit = false;
    await withPic(P.pic, P.title, function () { return play(P.hail); });
    var toll = Math.max(100, Math.round(s.player.gold * k.toll));
    var v = await UI.ask(P.title + ' — 통행세를 내든지 싸우든지', [
      { label: '맞서 싸운다', value: 'fight' },
      { label: '통행세 금화 ' + num(toll) + '닢을 낸다', value: 'pay', dis: s.player.gold < toll },
      { label: '돛을 올려 달아난다', value: 'flee' }], who(P.boss));
    if (v === 'pay' && s.player.gold >= toll) { s.player.gold -= toll; later(key, 'paid'); await play([[P.boss, '현명하군! 이 바다에서 또 보자.']]); log(P.title + '에 통행세 금화 ' + num(toll) + '닢을 냈다.'); refresh(); return true; }
    if (v !== 'fight') { later(key, 'fled'); await play([[null, '돛을 한껏 올려 바람을 탔다. 뒤에서 해적들의 웃음소리와 함께 포탄 하나가 물기둥을 세웠다.']]); refresh(); return true; }
    b[key] = 'fighting';
    var sp = P.spec, spec = { id: 'rv_' + key, foe: sp.foe, foeLabel: sp.foeLabel, ships: sp.ships.slice(), names: sp.names.slice(), boss: sp.boss,
      ask: P.title + '와 맞붙겠습니까?', fightLabel: '맞붙는다', noLabel: '물러난다', decline: '하! 겁쟁이로군.',
      win: { fame: sp.fame, gold: sp.gold, so: 80, text: P.title + '를 꺾고 해적들의 짐을 털었다!' }, lose: P.title + '에 졌다. 해적들이 갑판으로 몰려든다…',
      onWin: function () { st()[key] = 'won'; }, onLose: function () { st()[key] = 'lost'; } };
    var go = G.Rel && G.Rel.greatBattle ? (G.Rel.register(spec), await G.Rel.greatBattle(spec)) : false;
    if (!go) { later(key, 'declined'); }
    refresh(); return true;
  }
  async function afterPirate(key) {
    var P = PIRATE[key], b = st(), s = S();
    if (b[key] === 'won') {
      b[key] = 'friends';
      await withPic(P.pic + '_friends', '술잔을 나누다', function () { return play(P.win); });
      P.mates.forEach(function (id) { if (free(id)) join(id); });
      item(P.item);
      log(P.title + '와 맞붙어 이기고 짐을 털었다. 그날 밤 술잔을 나눈 뒤 ' + P.mates.map(function (id) { return G.MATE[id].name; }).join('와 ') + U.jx(G.MATE[P.mates[P.mates.length - 1]].name, '이/가') + ' 동료가 되었다.');
      UI.toast(P.mates.map(function (id) { return G.MATE[id].name; }).join(' · ') + ' — 동료가 되었다', 'heart', 5600);
    } else {
      var loot = Math.round(s.player.gold * K().plunder); s.player.gold -= loot;
      await withPic(P.pic, P.title, function () { return play(P.lose); });
      later(key, 'lost');
      log(P.title + '에 지고 금화 ' + num(loot) + '닢을 털렸다. 해적들은 웃으며 다음에 다시 붙자고 했다.');
      UI.toast('해적에게 금화 ' + num(loot) + '닢을 털렸다 — 다음에 다시 붙자고 한다', 'skull', 5200);
    }
    refresh(); return true;
  }

  // ================================================================ 날마다 — 소식
  RV.daily = function () {
    var b = st(), out = []; if (!b) return out;
    var t = today(), told = b.told;
    function news(key, icon, text, ok) { if (!told[key] && t >= NEWS_AT[key] && ok !== false) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('granuaile', 'crown', '【그라누알과 엘리자베스】 아일랜드의 여해적 그레이스 오말리가 그리니치 궁전에서 잉글랜드의 엘리자베스 여왕을 만났다. 둘은 라틴어로 이야기했고, 그라누알은 무릎을 꿇지 않았다고 한다 — 여왕이 아니라 같은 여왕으로서 왔다고.', !!b.omalleyMet);
    news('compact', 'scroll', '【메이플라워 서약】 대서양을 건넌 메이플라워호가 케이프 코드 앞바다에 닻을 내렸다. 배에서 내리기 전, 남자 마흔한 명이 「스스로 법을 정하고 따르겠다」는 약속에 서명했다.');
    news('plymouth', 'ship', '【플리머스】 메이플라워호의 순례자들이 뉴잉글랜드 해안에 닿아 마을을 세우기 시작했다. 첫 겨울은 혹독하다.');
    news('treaty', 'scroll', '【왐파노아그와의 약속】 플리머스의 순례자들과 왐파노아그의 대추장 마사소이트가 서로 해치지 않고 돕기로 약속했다. 그 약속은 반세기 넘게 이어진다.');
    news('sperwer', 'skull', '【스페르베르호의 난파】 네덜란드 동인도 회사의 상선 스페르베르호가 폭풍에 제주 앞바다에서 부서졌다. 살아남은 서른여섯 명은 조선 관리들에게 붙잡혀 한양으로 보내진다.');
    news('hamelEsc', 'ship', '【하멜의 탈출】 조선에 붙잡혀 있던 스페르베르호 사람 여덟이 여수에서 작은 배를 타고 달아나 일본의 나가사키에 닿았다. 열세 해 만이다.');
    news('hamelBook', 'scroll', '【하멜 표류기】 헨드릭 하멜이 조선에서 보낸 열세 해를 적은 일지가 네덜란드에서 책으로 나왔다. 유럽 사람들이 「코레아」라는 나라를 처음 자세히 읽는다.');
    return out;
  };

  // ================================================================ 도시 · 바다
  RV.pending = function () {
    var s = S(); if (!s || !s.loc || s.loc.mode !== 'city') return false;
    return cityOpen('supply') || winterOpen() || cityOpen('natives') || feastOpen() || cityOpen('weltevree');
  };
  function feastOpen() { var b = st(), k = K().feast; return !!(b && !b.feast && cityNow() === k.city && inWin(k) && ((b.winter && b.winter !== 'met') || (b.natives && b.natives !== 'met'))); }
  function winterOpen() { var b = st(), k = K().mayflower; return !!(b && !b.winter && cooled('winter') && cityNow() === k.city && inWin(k)); }
  RV.check = async function () {
    if (RV._busy) return false; RV._busy = true;
    try {
      if (cityOpen('supply')) await RV.supply();
      else if (winterOpen()) await RV.winter();
      else if (cityOpen('natives')) await RV.natives();
      else if (feastOpen()) await RV.feast();
      else if (cityOpen('weltevree')) await RV.weltevree();
    } catch (e) { console.error(e); }
    RV._busy = false;
    return true;
  };
  RV.seaPending = function () {
    var s = S(); if (!s || !s.loc || s.loc.mode !== 'sea') return false;
    if (Object.keys(PIRATE).some(pirateAfter)) return true;
    if (seaOpen('sperwer') || (seaOpen('hamel') && free('hamel'))) return true;
    return Object.keys(PIRATE).some(function (key) { return pirateOpen(key) && roll(key); });
  };
  RV.atSea = async function () {
    if (RV._busy) return false; RV._busy = true;
    try {
      var after = Object.keys(PIRATE).filter(pirateAfter)[0];
      if (after) await afterPirate(after);
      else if (seaOpen('sperwer')) await RV.sperwer();
      else if (seaOpen('hamel') && free('hamel')) await RV.hamel();
      else {
        var key = Object.keys(PIRATE).filter(function (k) { return pirateOpen(k) && roll(k); })[0];
        if (key) { if (key === 'omalley') st().omalleyMet = 1; await pirate(key); }
      }
    } catch (e) { console.error(e); }
    RV._busy = false;
    return true;
  };
  (function hookDaily() {
    var W = G.World; if (!W || W._rovers) return;
    W._rovers = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(RV.daily()); } catch (e) { console.error(e); } return out; };
  })();
  RV._t = { pirate: pirate, afterPirate: afterPirate };
})(window.G = window.G || {});
