/* 16세기 동남아시아와 태평양 (G.SEAsia) — 2026-11-07 사용자 요청. 사람·조정값: js/data/seasia16.js (G.BALANCE.seasia16)
   역사는 바뀌지 않는다 — 땅 주인은 js/data/dominion.js 가 정한다(아바 1555 · 아유타야 1569 · …). 제독이 그 곁에서 무엇을 했는지만 남는다.
   ■ 도시에 들어설 때 (js/scenes/city.js)
     ① 페구 1554.10~1558: 바인나웅의 궁정. 포르투갈 용병과 총포를 모은다 — (가) 총 guns정이나 대포 cannon문을 웃돈(premium배)에 판다
        (나) 용병으로 아바 원정에 함께한다(육상전 army) (다) 사양한다
     ② 아유타야 1560~1566: 란쌍의 사절과 큰스님 — 비엔티안 천도, 에메랄드 불상, 탓루앙을 덮을 금
        (가) 짐칸의 금 gold통을 k배에 판다 (나) 금화 donate닢을 공덕으로 바친다 (다) 사양한다
     ④ 아카풀코 1565.10.8~1566: 우르다네타의 산 페드로호가 돌아왔다 — 「돌아오는 길」 · 괴혈병 — (가) 약재 herbs통 (나) 이야기만 듣는다
     ⑤ 아유타야 1568.11~1569.8.29: 바인나웅의 포위 — (가) 장인과 사람들을 강으로 빼낸다(육상전 army) (나) 버마 진영에 총포를 판다 (다) 떠난다
   ■ 바다의 하루 끝, 그 앞바다에 닿으면 (js/scenes/sea.js)
     ③ 세부 1565.4.27~1570: 레가스피의 산 미겔 마을 · 산토 니뇨 · 라자 투파스 (1568.9 뒤로는 포르투갈 함대의 봉쇄)
        (가) 굶주린 에스파냐 사람들에게 식량을 판다 (나) 라자 투파스의 마을에 식량을 나눈다 (다) 포르투갈 함대에 알린다 (라) 지나간다
     ⑥ 마닐라 만 1570.5~1572: 라자 술라이만과 레가스피 — (가) 술라이만 편에서 싸운다(육상전 fight) (나) 레가스피 편에 선다 (다) 중국 상인들과 거래만 (라) 지나간다
   ■ 떠나면 again일 뒤 다시(기한 안에서). 소식: 아바 · 치앙마이 · 비엔티안 · 탓루앙 · 세부 · 돌아오는 길 · 아유타야 함락 · 마닐라(월항 사건에서 들었으면 빼고) · 첫 갤리온 · 나레쑤언의 독립
   ■ 장면 그림: images/legend-events/sa_* — SEASIA16_PROMPT.md
   ■ 저장: s.seasia16 = { told: {}, toungoo, lanxang, cebu, urdaneta, ayutthaya, manila, <열쇠>How, <열쇠>Cool } */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R;
  var SA = G.SEAsia = {};
  function K() { return G.BALANCE.seasia16; }
  function S() { return G.Game && G.Game.state; }
  function today() { return U.dateNum(S().date); }
  var NEWS = ['ava', 'chiangmai', 'vientiane', 'thatluang', 'cebu', 'tornaviaje', 'ayutthaya', 'manila', 'galleon', 'naresuan'];
  var NEWS_AT = { ava: 15550122, chiangmai: 15580402, vientiane: 15600601, thatluang: 15661101, cebu: 15650427, tornaviaje: 15651008, ayutthaya: 15690830, manila: 15710624, galleon: 15731119, naresuan: 15840501 };
  SA.NEWS_AT = NEWS_AT;
  function st() {
    var s = S(); if (!s) return null;
    if (!s.seasia16) { s.seasia16 = { told: {} }; NEWS.forEach(function (k) { if (U.dateNum(s.date) > NEWS_AT[k]) s.seasia16.told[k] = 1; }); }
    s.seasia16.told = s.seasia16.told || {};
    return s.seasia16;
  }
  SA.state = st;
  function cityNow() { var s = S(); return s && s.loc && s.loc.mode === 'city' ? s.loc.city : null; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait, rigId: 'player' }; }
  function who(k) {
    if (k === 'P') return me();
    if (k === 'first') return G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {};
    return G.Hist ? G.Hist.speaker('sa_' + k) : { name: k, lang: 3 };
  }
  async function play(lines) { for (var i = 0; i < lines.length; i++) { var l = lines[i]; if (!l || !l[1]) continue; await UI.say(l[1], who(l[0])); } }
  function pic(key, title) { return G.FamEv && G.FamEv.showPic ? G.FamEv.showPic({ img: 'legend-events/' + key, title: title }) : null; }
  async function withPic(key, title, fn) { var pc = pic(key, title); try { return await fn(); } finally { if (pc) await pc.stop(); } }
  function refresh() { if (G.Game && G.Game.refreshHud) G.Game.refreshHud(); }
  function fame(k, n) { return G.Fame ? G.Fame.add(k, n) : 0; }
  function log(t) { G.State.log(t); }
  function item(id) { return R.addItem ? R.addItem(id) !== false : false; }
  function num(n) { return U.num(Math.round(n)); }
  function trust(id, n) { if (G.Sponsor && G.SPONSOR && G.SPONSOR[id]) G.Sponsor.addTrust(G.Sponsor.rel(id), n); }
  function qty(id) { var c = S().fleet.cargo || {}; return c[id] ? c[id].q || 0 : 0; }
  function take(id, n) { var c = S().fleet.cargo, cg = c && c[id]; if (!cg) return 0; n = Math.min(cg.q, n); if (R.takeCargoLots) R.takeCargoLots(cg, null, n, 0); cg.q -= n; if (cg.q <= 0) delete c[id]; return n; }
  function foodNeed(days) { return Math.ceil(R.dailyUse() * days); }
  function later(key, how) { var b = st(); b[key] = null; b[key + 'How'] = how; b[key + 'Cool'] = S().day + (K().again || 180); }
  function cooled(key) { var b = st(); return !(b[key + 'Cool'] > S().day); }
  function inWin(k) { var t = today(); return t >= k.from && t <= k.to; }
  function cityOpen(key) { var b = st(), k = K()[key]; return !!(b && !b[key] && cooled(key) && cityNow() === k.city && inWin(k)); }
  function seaOpen(key) {
    var b = st(), k = K()[key], l = S() && S().loc; if (!b || b[key] || !cooled(key) || !l || l.mode !== 'sea' || l.lon == null || !inWin(k)) return false;
    return l.lon >= k.box[0] && l.lon <= k.box[1] && l.lat >= k.box[2] && l.lat <= k.box[3];
  }
  async function fight(name, n, o) {
    var s = S(), L = G.Scenes && G.Scenes.land; if (!L || !L.landBattle) return 'win';
    var keep = s.loc.party; s.loc.party = Math.max(1, s.fleet.crew);
    try { return await L.landBattle(name, Math.max(10, Math.round(n)), false, Object.assign({ kind: 'garrison' }, o || {})); }
    finally { if (keep != null) s.loc.party = keep; else delete s.loc.party; }
  }
  /** 총·대포를 웃돈에 판다 — 판 금화 (모자라면 0) */
  function sellArms(k) {
    var g = qty('guns') >= k.guns ? Math.min(qty('guns'), k.guns * 4) : 0, c = qty('cannon') >= (k.cannon || 99) ? Math.min(qty('cannon'), k.cannon * 4) : 0;
    if (!g && !c) return 0;
    var gold = Math.round((g * G.GOOD.guns.p + c * G.GOOD.cannon.p) * k.premium);
    if (g) take('guns', g); if (c) take('cannon', c);
    S().player.gold += gold;
    return { gold: gold, text: [g ? '총 ' + g + '정' : '', c ? '대포 ' + c + '문' : ''].filter(Boolean).join(' · ') };
  }

  // ================================================================ ① 바인나웅의 아바·란나 정복 (페구 1554~1558)
  SA.toungoo = async function () {
    var b = st(), k = K().toungoo;
    await withPic('sa_pegu', '바인나웅의 궁정 (페구)', function () { return play([
      [null, '페구. 금빛 탑 슈웨모도가 하늘을 찌르고, 궁궐 마당에는 흰 코끼리가 금 사슬에 매여 있다. 따웅우 왕조의 도읍 — 여기서 버마 땅 전체를 하나로 묶으려는 왕이 군대를 모으고 있다.'],
      [null, '궁정 한쪽에는 포르투갈 말로 떠드는 용병들이 모여 있다. 화승총을 멘 사람, 대포 옆에서 화약을 재는 사람. 이 나라 왕들은 몇 해째 서양 총포와 용병을 사들이고 있다.'],
      ['bayinnaung', '바다에서 온 프랑크인가. 나는 바인나웅. 북쪽 아바에는 샨 사람들의 왕이 앉아 있고, 동쪽 란나(치앙마이)는 내게 고개를 숙이지 않는다. 열 방향을 모두 이기는 왕이 될 것이다.'],
      ['bayinnaung', '그대의 배에 총과 대포가 있다면 값을 넉넉히 쳐 주겠다. 칼을 잘 쓴다면 — 아바로 가는 내 군대에 서라. 전리품은 함께 나눈다.']
    ]); });
    var armsOk = qty('guns') >= k.guns || qty('cannon') >= k.cannon;
    var v = await UI.ask('바인나웅의 청', [
      { label: '총포를 판다 (값의 ' + k.premium + '배)' + (armsOk ? '' : ' — 총 ' + k.guns + '정이나 대포 ' + k.cannon + '문이 있어야 한다'), value: 'arms', dis: !armsOk },
      { label: '용병으로 아바 원정에 함께한다', value: 'march' },
      { label: '사양한다', value: 'no' }], who('bayinnaung'));
    if (v === 'arms' && armsOk) {
      var r = sellArms(k); b.toungoo = 'arms'; item('white_elephant_seal');
      await play([['bayinnaung', '좋다! 이 총들이 아바의 성문을 열 것이다. 이 인장을 가져가라 — 흰 코끼리의 나라에서 그대는 언제든 손님이다.']]);
      log('페구에서 따웅우의 바인나웅에게 ' + r.text + '을 금화 ' + num(r.gold) + '닢에 팔았다.');
      UI.toast('바인나웅에게 총포를 팔았다 — 금화 +' + num(r.gold), 'coin', 5200);
    } else if (v === 'march') {
      await play([[null, '이라와디 강을 거슬러 오르는 대군. 코끼리 부대와 포르투갈 화승총 부대, 몬과 버마의 창병들. 아바의 성벽 앞에서 샨 군사들이 활을 당긴다.']]);
      var res = await fight('아바 성의 샨 군사들', k.army, { guns: true, leader: '아바의 샨 왕', noSpecial: true });
      b.toungoo = res === 'win' ? 'won' : 'lost';
      if (res === 'win') {
        var bt = fame('bt', 400); S().player.gold += 6000; item('white_elephant_seal');
        await play([['bayinnaung', '아바가 무너졌다! 이라와디의 위아래가 모두 내 것이다. 그대의 몫이다 — 루비와 금화. 다음은 란나다.']]);
        log('바인나웅의 아바 원정에 용병으로 함께해 성을 무너뜨렸다. (전투 명성 +' + bt + ' · 금화 +6,000)');
      } else { await play([[null, '성벽 아래에서 밀려났다. 그래도 몇 주 뒤, 아바는 바인나웅의 코끼리 부대 앞에 무너졌다.']]); log('바인나웅의 아바 원정에 함께했다가 성벽 아래에서 밀려났다.'); }
    } else { later('toungoo', 'no'); }
    refresh(); return true;
  };

  // ================================================================ ② 란쌍 — 비엔티안과 탓루앙 (아유타야 1560~1566)
  SA.lanxang = async function () {
    var b = st(), k = K().lanxang, s = S();
    await withPic('sa_lanxang', '란쌍의 사절', function () { return play([
      [null, '아유타야 왕궁 앞. 코끼리를 탄 낯선 사절단이 들어선다. 메콩 강 위쪽 란쌍 — 「백만 코끼리의 나라」에서 왔다. 버마의 바인나웅에 맞서 아유타야와 손을 잡으려는 것이다.'],
      ['laomonk', '우리 왕 세타티랏께서는 도읍을 루앙프라방에서 메콩 강 아래 비엔티안으로 옮기셨소. 버마 군이 오는 길에서 한 걸음 물러나, 강과 들이 넓은 곳에 나라의 마음을 두려는 것이오.'],
      ['laomonk', '치앙마이에서 모셔 온 에메랄드 불상을 위해 호파깨오 사당을 지었고, 이제 부처님의 사리를 모실 큰 탑 — 탓루앙을 쌓고 있소. 그 탑을 금으로 덮으려 하오. 왕의 힘과 부처님의 가르침이 한 탑에 서는 것이지.'],
      ['setthathirath', '(사절단의 편지를 읽어 주는 통역의 목소리로) 「바다의 손님이여, 금이 있다면 내 탑에 보태 주시오. 공덕은 나누는 것이오.」']
    ]); });
    var goldOk = qty('gold') >= k.gold, cashOk = s.player.gold >= k.donate;
    var price = Math.round(k.gold * G.GOOD.gold.p * k.k);
    var v = await UI.ask('탓루앙을 덮을 금', [
      { label: '짐칸의 금 ' + k.gold + '통을 판다 (금화 ' + num(price) + '닢)', value: 'sell', dis: !goldOk },
      { label: '금화 ' + num(k.donate) + '닢을 공덕으로 바친다', value: 'donate', dis: !cashOk },
      { label: '사양한다', value: 'no' }], who('laomonk'));
    if (v === 'sell' && goldOk) { take('gold', k.gold); s.player.gold += price; b.lanxang = 'sell'; var tr = fame('tr', 40); log('아유타야에서 란쌍의 사절단에게 금 ' + k.gold + '통을 팔았다 — 비엔티안의 탓루앙을 덮을 금이다. (금화 +' + num(price) + ' · 교역 명성 +' + tr + ')'); }
    else if (v === 'donate' && cashOk) { s.player.gold -= k.donate; b.lanxang = 'donate'; var so = fame('so', 200); log('아유타야에서 란쌍의 탓루앙에 금화 ' + num(k.donate) + '닢을 공덕으로 바쳤다. (사교 명성 +' + so + ')'); }
    else { later('lanxang', 'no'); refresh(); return true; }
    await play([['laomonk', b.lanxang === 'donate' ? '(합장하며) 그대의 이름을 탑의 기단에 새길 수는 없지만, 스님들이 아침마다 그대를 위해 경을 읊을 것이오. 이 금박 한 장을 가져가시오 — 나눈 공덕은 돌아오는 법이오.' : '고맙소. 그대의 금이 비엔티안의 하늘에서 빛날 것이오. 이 금박 한 장은 그 증표요.']]);
    item('thatluang_leaf'); refresh(); return true;
  };

  // ================================================================ ③ 세부 — 레가스피의 거점 (1565~1570, 바다)
  SA.cebu = async function () {
    var b = st(), k = K().cebu, s = S(), blockade = today() >= 15680901;
    await withPic('sa_cebu', '세부 (1565)', function () { return play([
      [null, '세부 섬. 해안의 불탄 마을 위에 에스파냐 사람들이 나무 울타리를 두른 작은 요새 「산 미겔」을 세웠다. 마젤란이 이 섬에서 죽은 지 마흔네 해. 그때 세례를 받은 왕비가 지녔던 아기 예수상이 불탄 집 안에서 상자째 발견되었다고 한다.'],
      ['legazpi', '나는 레가스피. 멕시코에서 왔소. 이번엔 마젤란처럼 들렀다 가지 않소 — 여기 머물러 펠리페 왕의 섬들을 세우겠소. 섬 이름도 왕의 이름을 따 「필리피나스」요.'],
      ['tupas', '(요새 밖 언덕에서 팔짱을 끼고) 저들은 처음엔 우리 마을을 불태우더니 이제 쌀을 달라고 한다. 이 섬의 쌀이 넘쳐 나는 줄 아는가.'],
      blockade ? [null, '— 그리고 바다 쪽, 포르투갈 깃발을 단 함대가 세부 항구 어귀를 막고 있다. 「이 섬들은 사라고사 조약의 선 서쪽, 포르투갈 몫이다!」 몇 달째 이어지는 봉쇄에 요새 안은 굶주린다.'] : null,
      ['legazpi', '식량이 모자라오. 멕시코에서 오는 배는 언제 올지 모르고. 그대의 배에 쌀이 있다면 값을 넉넉히 치르겠소.']
    ]); });
    var need = foodNeed(k.food), foodOk = (s.fleet.food || 0) >= need, sell = Math.max(1500, Math.round(need * k.k * 10));
    var opts = [
      { label: '식량 ' + k.food + '일분을 에스파냐 요새에 판다 (금화 ' + num(sell) + '닢)', value: 'sell', dis: !foodOk },
      { label: '식량 ' + k.food + '일분을 라자 투파스의 마을에 나눈다', value: 'tupas', dis: !foodOk }];
    if (blockade) opts.push({ label: '봉쇄 중인 포르투갈 함대에 요새 사정을 알린다', value: 'pt' });
    opts.push({ label: '지나간다', value: 'leave' });
    var v = await UI.ask('세부의 산 미겔 요새', opts, who('legazpi'));
    if (v === 'sell' && foodOk) {
      s.fleet.food -= need; s.player.gold += sell; b.cebu = 'sell'; trust('es_crown', 4); item('santo_nino_copy');
      await play([['legazpi', '고맙소. 이 쌀이면 다음 배가 올 때까지 버틸 수 있소. 이건 산토 니뇨를 본떠 깎은 작은 상이오 — 이 섬에서 우리가 다시 시작했다는 표시지.']]);
      log('세부에서 레가스피의 산 미겔 요새에 식량 ' + k.food + '일분을 금화 ' + num(sell) + '닢에 팔았다.');
    } else if (v === 'tupas' && foodOk) {
      s.fleet.food -= need; b.cebu = 'tupas'; var so = fame('so', 120);
      await play([['tupas', '바다의 사람이 우리 아이들에게 쌀을 주다니. 저 쇠옷 입은 자들과는 다르군. 이 섬에서 그대는 언제든 친구다.']]);
      log('세부에서 라자 투파스의 마을에 식량 ' + k.food + '일분을 나누었다. (사교 명성 +' + so + ')');
    } else if (v === 'pt' && blockade) {
      b.cebu = 'pt'; trust('pt_king', 8); trust('es_crown', -8);
      await play([[null, '포르투갈 기함의 갑판. 함대장이 요새 사정을 듣고 고개를 끄덕였다. 「굶주림이 우리 대포보다 빠르겠군.」 — 그러나 봉쇄는 몇 달 뒤 풀렸고, 레가스피는 끝내 버텼다.']]);
      log('세부를 봉쇄한 포르투갈 함대에 에스파냐 요새의 사정을 알렸다. (포르투갈 궁정의 신뢰 +8)');
    } else { later('cebu', 'leave'); }
    refresh(); return true;
  };

  // ================================================================ ④ 아카풀코 — 우르다네타의 「돌아오는 길」 (1565.10~)
  SA.urdaneta = async function () {
    var b = st(), k = K().urdaneta;
    await withPic('sa_urdaneta', '돌아오는 길 (1565)', function () { return play([
      [null, '아카풀코 만. 넉 달 넘게 태평양을 건너온 배 한 척이 들어온다. 산 페드로호. 갑판 위의 사람들은 잇몸에서 피를 흘리고, 돛을 내릴 힘조차 없다. 그래도 그들은 웃고 있다 — 필리핀에서 아메리카로 「돌아오는 길」을 처음으로 찾아냈기 때문이다.'],
      ['urdaneta', '(지팡이를 짚고 내려서며) 나는 우르다네타, 아우구스티노회 수사요. 마젤란 이후 마흔 해 동안 아무도 서쪽에서 돌아오지 못했소. 동쪽으로 가면 바람이 막아서지.'],
      ['urdaneta', '그래서 북쪽으로 올라갔소. 일본의 바다를 지나 북위 서른여덟, 마흔 도까지. 거기선 바람이 서쪽에서 불고 해류가 동쪽으로 흐르오. 그 큰 물줄기를 타고 캘리포니아 해안까지 와서 남쪽으로 내려왔지.'],
      ['urdaneta', '이제 마닐라와 아카풀코 사이에 배가 오갈 수 있소. 중국의 비단과 멕시코의 은이 한 바다에서 만나게 될 거요. …다만, 우리 사람들이 너무 많이 쓰러졌소.']
    ]); });
    var herbsOk = qty('herbs') >= k.herbs;
    var v = await UI.ask('우르다네타의 산 페드로호', [
      { label: '약재 ' + k.herbs + '통으로 쓰러진 선원들을 돌본다', value: 'herbs', dis: !herbsOk },
      { label: '항로 이야기만 듣는다', value: 'listen' },
      { label: '자리를 뜬다', value: 'leave' }], who('urdaneta'));
    if (v === 'herbs' && herbsOk) {
      take('herbs', k.herbs); b.urdaneta = 'herbs'; item('tornaviaje_chart'); var so = fame('so', 150), ex = fame('ex', 120);
      await play([['urdaneta', '하느님이 그대를 보내셨소. 이건 내 해도의 사본이오 — 돌아오는 길. 언젠가 그대 배가 그 큰 바다를 건널 때 쓰시오.']]);
      log('아카풀코에서 우르다네타의 산 페드로호 선원들을 약재로 돌보았다. 우르다네타가 「돌아오는 길」의 해도 사본을 건넸다. (사교 명성 +' + so + ' · 탐험 명성 +' + ex + ')');
    } else if (v === 'listen') {
      b.urdaneta = 'listen'; var ex2 = fame('ex', 50);
      log('아카풀코에서 우르다네타에게 태평양을 동쪽으로 건너는 「돌아오는 길」 이야기를 들었다 — 북위 40도 언저리의 서풍과 해류. (탐험 명성 +' + ex2 + ')');
    } else { later('urdaneta', 'leave'); }
    refresh(); return true;
  };

  // ================================================================ ⑤ 아유타야 함락 (1568.11~1569.8.29)
  SA.ayutthaya = async function () {
    var b = st(), k = K().ayutthaya;
    await withPic('sa_ayutthaya', '아유타야 포위 (1569)', function () { return play([
      [null, '아유타야. 세 강이 감싸 도는 섬 도시를 바인나웅의 대군이 몇 달째 에워쌌다. 강물이 불어나는 철이 오기 전에 끝내려는 듯, 성벽 밖 들판이 버마와 란나, 몬 군사의 천막으로 가득하다.'],
      [null, '성 안. 금박을 입히던 장인들, 칠기와 상감을 다루던 공방, 왕족의 집안 사람들이 짐을 꾸린다. 성이 무너지면 모두 페구로 끌려간다는 소문이 돈다. 늙은 장인 하나가 제독의 소매를 붙잡았다.'],
      [null, '「배를 가진 분이시지요? 강 아래 바다까지만이라도… 우리 손이 버마 왕의 탑을 칠하러 끌려가는 걸 보고 싶지 않습니다.」'],
      ['bayinnaung', '(성 밖 진영에서 보낸 전령의 말로) 「바다의 상인이여, 성은 곧 무너진다. 총과 화약을 가져왔다면 내 진영으로 오라. 값은 넉넉히 치른다.」']
    ]); });
    var armsOk = qty('guns') >= k.guns;
    var v = await UI.ask('아유타야 포위', [
      { label: '장인과 사람들을 강으로 빼낸다', value: 'rescue' },
      { label: '버마 진영에 총을 판다 (값의 ' + k.premium + '배)' + (armsOk ? '' : ' — 총 ' + k.guns + '정이 있어야 한다'), value: 'arms', dis: !armsOk },
      { label: '떠난다', value: 'leave' }], me());
    if (v === 'rescue') {
      await play([[null, '달 없는 밤, 거룻배 몇 척이 짐과 사람을 싣고 강을 내려간다. 강굽이를 돌자 버마 군의 순찰선과 강가 진지에서 횃불이 올랐다.']]);
      var res = await fight('강가의 버마 군', k.army, { guns: true, leader: '버마 군 장수', noSpecial: true });
      b.ayutthaya = res === 'win' ? 'rescue' : 'rescueLost';
      if (res === 'win') {
        item('ayutthaya_craft'); var so = fame('so', 200), bt = fame('bt', 150);
        await play([[null, '새벽, 거룻배들이 바다 어귀에 닿았다. 늙은 장인이 검은 옻칠 함 하나를 내밀었다. 「이 손으로 다시 연꽃을 새길 수 있게 되었습니다.」']]);
        log('1569년 포위된 아유타야에서 장인과 사람들을 강으로 빼내 바다 어귀까지 데려갔다. (사교 명성 +' + so + ' · 전투 명성 +' + bt + ')');
      } else { await play([[null, '강가의 진지에 막혀 거룻배를 돌렸다. 몇 사람만 겨우 숲으로 흩어졌다.']]); log('1569년 아유타야에서 사람들을 빼내려다 버마 군에 막혔다.'); }
    } else if (v === 'arms' && armsOk) {
      var r = sellArms(Object.assign({}, k, { cannon: 99 })); b.ayutthaya = 'arms';
      log('1569년 아유타야를 에워싼 바인나웅의 진영에 ' + r.text + '을 금화 ' + num(r.gold) + '닢에 팔았다.');
      UI.toast('버마 진영에 총을 팔았다 — 금화 +' + num(r.gold), 'coin', 5200);
    } else { later('ayutthaya', 'leave'); }
    refresh(); return true;
  };

  // ================================================================ ⑥ 마닐라 (1570~1572, 바다)
  SA.manila = async function () {
    var b = st(), k = K().manila, s = S(), after = today() >= 15710624;
    await withPic('sa_manila', '마닐라 만 (1571)', function () { return play([
      [null, '루손 섬의 넓은 만. 파시그 강 어귀에 대나무 울타리와 대포를 두른 이슬람 왕국의 항구 마이닐라가 있다. 강가에는 중국 정크선들이 닻을 내리고 비단과 도자기를 부린다.'],
      ['sulayman', '나는 술라이만, 이 항구의 라자다. 브루나이 술탄의 핏줄이지. 세부의 쇠옷 입은 자들이 우리 강까지 올라왔다. 작년에 저들이 내 마을을 불태웠어. 이번엔 물러서지 않는다.'],
      ['legazpi', after ? '(새로 쌓은 돌담 위에서) 이 강 어귀에 도시를 세운다 — 마닐라. 필리피나스의 머리요. 중국 상인들이 이리 오고, 아카풀코의 은이 이리 올 것이오.' : '이 만은 필리피나스의 머리가 될 곳이오. 라자 술라이만이 고집을 꺾지 않는다면 힘으로라도.'],
      [null, '— 강가의 중국 상인 하나가 제독에게 다가와 귓속말을 한다. 「싸움이 나든 말든 우리는 장사요. 비단 좀 보시겠소?」']
    ]); });
    var v = await UI.ask('마닐라 만', [
      { label: '라자 술라이만 편에서 싸운다', value: 'sulayman' },
      { label: '레가스피 편에 선다', value: 'legazpi' },
      { label: '중국 상인들과 거래만 한다', value: 'trade' },
      { label: '지나간다', value: 'leave' }], who('sulayman'));
    if (v === 'sulayman') {
      await play([[null, '반쿠사이 물목. 카라코아 배들과 에스파냐의 거룻배가 맞붙는다. 술라이만의 전사들이 크리스를 뽑아 들고 뛰어든다.']]);
      var res = await fight('에스파냐 원정대와 비사야 동맹군', k.fight, { guns: true, leader: '마르틴 데 고이티', noSpecial: true });
      b.manila = res === 'win' ? 'sulayman' : 'sulaymanLost';
      if (res === 'win') { item('sulayman_kris'); trust('es_crown', -10); var bt = fame('bt', 250); await play([['sulayman', '오늘은 저들을 물렸다! …허나 저들은 또 온다. 바다는 넓고 저들의 배는 끝이 없지. 이 칼을 가져가라. 마이닐라의 사람이 바다의 친구에게 주는 것이다.']]); log('마닐라 만에서 라자 술라이만 편에 서서 에스파냐 원정대와 싸웠다. (전투 명성 +' + bt + ')'); }
      else { await play([[null, '물목의 싸움에서 밀려났다. 그날 젊은 라자의 깃발이 물속으로 가라앉았다.']]); log('마닐라 만에서 라자 술라이만 편에 섰다가 밀려났다.'); }
    } else if (v === 'legazpi') {
      b.manila = 'legazpi'; trust('es_crown', 8); var so = fame('so', 100);
      await play([['legazpi', '고맙소. 이 도시가 서면 그대의 배는 언제든 환영이오. 아카풀코의 은과 중국의 비단 — 이 둘이 만나는 곳이 바로 여기요.']]);
      log('마닐라 만에서 레가스피 편에 섰다. (사교 명성 +' + so + ')');
    } else if (v === 'trade') {
      b.manila = 'trade';
      var c = s.fleet.cargo = s.fleet.cargo || {}, kindsOk = !!c.silk || !R.maxKinds || Object.keys(c).length < R.maxKinds();
      var p = Math.round(G.GOOD.silk.p * 0.8), room = G.Cargo && G.Cargo.room ? G.Cargo.room('silk') : R.free(), q = kindsOk ? Math.max(0, Math.min(40, Math.floor(room), Math.floor(s.player.gold / p))) : 0;
      if (q > 0) {
        var cg = c.silk, port = 175;   // 복건(천주)에서 온 정크선의 비단
        if (cg) { R.addCargoLot(cg, port, q, p); cg.cost = Math.round((cg.cost * cg.q + p * q) / (cg.q + q)); cg.q += q; } else { c.silk = { q: q, cost: p, from: port, d: s.day, lots: {} }; c.silk.lots[port] = { q: q, cost: p }; }
        s.player.gold -= q * p;
        log('마닐라 만의 중국 상인에게 견직물 ' + q + '통을 1통 ' + num(p) + '닢에 샀다.');
        UI.toast('견직물 ' + q + '통을 샀다 (1통 ' + num(p) + '닢)', 'coin', 4800);
      } else UI.toast('짐칸이나 소지금이 모자라 아무것도 사지 못했다.', 'info', 4000);
    } else { later('manila', 'leave'); }
    refresh(); return true;
  };

  // ================================================================ 날마다 — 소식
  SA.daily = function () {
    var b = st(), out = [], s = S(); if (!b) return out;
    var t = today(), told = b.told;
    if (!told.manila && s.yuegang && s.yuegang.told && s.yuegang.told.manilaNews) told.manila = 1;   // 월항 사건에서 이미 들었다
    function news(key, icon, text) { if (!told[key] && t >= NEWS_AT[key]) { told[key] = 1; out.push({ icon: icon, history: true, text: text }); } }
    news('ava', 'cannon', '【아바 함락】 따웅우의 바인나웅이 북쪽의 아바를 무너뜨렸다. 샨 사람들의 왕이 다스리던 이라와디 강 위쪽이 따웅우의 것이 되었다.' + (b.toungoo === 'won' ? ' 그 성벽 아래에 제독의 사람들도 있었다.' : ''));
    news('chiangmai', 'cannon', '【치앙마이】 바인나웅이 란나 왕국의 치앙마이를 굴복시켰다. 따웅우 왕조는 이제 버마 땅을 넘어 타이 북부까지 다스리는 대제국이 되어 간다.');
    news('vientiane', 'crown', '【비엔티안】 란쌍의 세타티랏 왕이 도읍을 루앙프라방에서 메콩 강 아래 비엔티안으로 옮겼다. 치앙마이에서 모셔 온 에메랄드 불상도 함께 왔다.');
    news('thatluang', 'pray', '【탓루앙】 비엔티안에 부처님의 사리를 모신 큰 탑 탓루앙이 섰다. 왕권과 불교가 한 탑에 선 란쌍의 자랑이다.' + (b.lanxang ? ' 그 금빛 가운데 제독이 보탠 몫도 있다.' : ''));
    news('cebu', 'castle', '【세부의 산 미겔】 멕시코에서 온 레가스피의 원정대가 세부 섬에 요새를 세우고 눌러앉았다. 섬들은 펠리페 왕의 이름을 따 「필리피나스」라 불린다.');
    news('tornaviaje', 'ship', '【돌아오는 길】 우르다네타 수사가 이끈 산 페드로호가 필리핀에서 북위 40도의 서풍을 타고 태평양을 건너 아카풀코에 닿았다. 서쪽에서 아메리카로 돌아오는 바닷길이 처음으로 열렸다.');
    news('ayutthaya', 'skull', '【아유타야 함락】 바인나웅의 대군이 아유타야를 무너뜨렸다. 왕은 페구로 끌려가고, 바인나웅이 세운 마하 탐마라차가 종속 왕이 되었다. 왕족과 장인, 수많은 백성이 버마로 옮겨진다. 어린 왕자 나레쑤언도 볼모로 페구에 간다.');
    news('manila', 'castle', '【마닐라】 레가스피가 루손 섬 파시그 강 어귀의 마이닐라를 차지하고 그 자리에 에스파냐의 도시 마닐라를 세웠다. 필리피나스의 머리가 된다. 중국 정크선들이 비단을 싣고 몰려든다.');
    news('galleon', 'ship', '【첫 갤리온】 마닐라에서 중국의 비단과 도자기를 실은 갤리온이 태평양을 건너 아카풀코에 닿았다. 해마다 아메리카의 은이 서쪽으로, 아시아의 비단이 동쪽으로 — 세계를 한 바퀴 잇는 교역이 시작되었다.');
    news('naresuan', 'crown', '【나레쑤언의 독립】 볼모로 자랐던 아유타야의 왕자 나레쑤언이 버마에 대한 충성을 끊고 독립을 선언했다. 아유타야가 다시 일어선다.');
    return out;
  };

  // ================================================================ 도시 · 바다
  SA.pending = function () { var s = S(); if (!s || !s.loc || s.loc.mode !== 'city') return false; return cityOpen('toungoo') || cityOpen('lanxang') || cityOpen('urdaneta') || cityOpen('ayutthaya'); };
  SA.check = async function () {
    if (SA._busy) return false; SA._busy = true;
    try {
      if (cityOpen('toungoo')) await SA.toungoo();
      else if (cityOpen('ayutthaya')) await SA.ayutthaya();
      else if (cityOpen('lanxang')) await SA.lanxang();
      else if (cityOpen('urdaneta')) await SA.urdaneta();
    } catch (e) { console.error(e); }
    SA._busy = false;
    return true;
  };
  SA.seaPending = function () { return !!(S() && (seaOpen('cebu') || seaOpen('manila'))); };
  SA.atSea = async function () {
    if (SA._busy) return false; SA._busy = true;
    try { if (seaOpen('cebu')) await SA.cebu(); else if (seaOpen('manila')) await SA.manila(); } catch (e) { console.error(e); }
    SA._busy = false;
    return true;
  };
  (function hookDaily() {
    var W = G.World; if (!W || W._seasia16) return;
    W._seasia16 = true;
    var od = W.daily;
    W.daily = function () { var out = od.apply(this, arguments) || []; try { out = out.concat(SA.daily()); } catch (e) { console.error(e); } return out; };
  })();
})(window.G = window.G || {});
