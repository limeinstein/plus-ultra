/* 사건·전설 부하의 소문 (G.EVENT_RUMORS) — 거리를 걷는 마을 사람이 가끔(5%) 들려준다. 시스템: js/systems/eventrumor.js. 2026-10-22 사용자 요청
   「어느 지역에서 누군가 조건을 맞추어야 한다」는 것을 짧고 두루뭉술하게 — 정답을 다 알려 주지 않는다.
   항목: id · near [[경도, 위도], …] + r(°): 이 둘레 도시의 마을 사람만 이야기한다 · own: 그 도시를 다스리는 나라 이름(정규식)도 맞아야 한다
         where(c): 그 도시가 맞아야 하는 다른 조건 (이슬람 도시 등)
         mates: 이 사람들이 모두(anyDone: 한 사람이라도) 배에 있거나 떠났거나 혼인했으면 끝난 이야기 (G.EventRumor.done)
         y: [시작 해, 끝 해] (또는 d: [yyyymmdd, yyyymmdd]) · live(s): 아직 일어날 수 있는가 (없으면 mates·y만 본다)
         text: [{y: 해요체, o: 하오·하게체}, …] 말 1~2개 — 또는 function(s)로 사건의 단계·날짜에 맞는 말만 (빈 목록이면 그 소문은 돌지 않는다)
   ※ 발견물의 숨은 이름은 쓰지 않는다 (「용」「황금 도시」처럼 두루뭉술하게).
   ※ 이야기 속 사건의 실제 조건은 그 시스템 파일의 머리 주석에 있다. 조건을 바꾸면 여기 말도 맞춰 고친다. */
(function (G) {
  'use strict';
  var P = {   // 자주 쓰는 자리
    paris: [2.35, 48.85], germany: [10, 51], denmark: [10.5, 55.7], nordic: [25, 61], edinburgh: [-3.2, 55.95], london: [-0.12, 51.5],
    toledo: [-4.0, 39.86], seville: [-6.0, 37.4], vienna: [16.37, 48.2], genoa: [8.93, 44.4], milan: [9.19, 45.46], florence: [11.25, 43.77],
    istanbul: [28.97, 41.0], cairo: [31.2, 30.0], baghdad: [44.4, 33.3], china: [116, 34], hangzhou: [120.2, 30.3], korea: [127.5, 36.5],
    havana: [-82.4, 23.1], veracruz: [-96.1, 19.2], panama: [-79.5, 9.0], lima: [-77.0, -12.0], namerica: [-76, 37]
  };
  var FR = /프랑스|브르타뉴|부르고뉴|프로방스/, EN = /잉글랜드|영국/, DE = /신성로마|한자|작센|바이에른|브레멘|함부르크|뤼베크|프로이센|베스트팔렌|프랑크푸르트|독일/,
    DK = /덴마크/, KR = /조선|대한/, CN = /^(명|청|대서|대순|삼번|후금|동녕 왕국)$/;
  function dn(s) { return s.date.y * 10000 + s.date.m * 100 + s.date.d; }
  function has(s, id) { return (s.mates || []).some(function (m) { return m.id === id; }); }
  function done(id) { return G.EventRumor && G.EventRumor.done ? G.EventRumor.done(id) : false; }
  function SPR(id) { return G.SPONSOR && G.SPONSOR[id]; }
  function present(id) { var sp = SPR(id); return !!(sp && G.Sponsor && G.Sponsor.present(sp)); }
  function holder(id) { var sp = SPR(id); return (sp && G.Sponsor && G.Sponsor.holder(sp)) || ''; }
  function female(s) { var p = s.player || {}; return p.g === 'f' || !!(p.heir && p.heir.sex === 'f'); }
  G.EVENT_RUMORS = [
    // ───────────── 옛이야기의 아가씨들 (js/systems/fairytales.js — G.Tale.ready: 배에 없고 · 떠나지 않았고 · 혼인하지 않았다)
    { id: 'cinderella', near: [P.paris], r: 7, own: FR, mates: ['cinderella'], text: [
      { y: '프랑스 어느 숲에서 깨진 유리 구두를 꼭 쥔 아가씨를 봤대요. 유리를 싣고 다니는 솜씨 좋은 사람이라면 도울 수 있을 텐데요.',
        o: '프랑스 어느 숲에서 깨진 유리 구두를 꼭 쥔 아가씨를 봤다는 사람이 있더군. 유리를 싣고 다니는 솜씨 좋은 사람이라면 도울 수 있을 텐데.' },
      { y: '숲길에 재투성이 아가씨가 나타난대요. 구두 한 짝을 고쳐 줄 손재주 있는 사람을 찾는다나 봐요.',
        o: '숲길에 재투성이 아가씨가 나타난다더군. 구두 한 짝을 고쳐 줄 손재주 있는 사람을 찾는다나.' }] },
    { id: 'snow_white', near: [P.paris], r: 7, own: FR, mates: ['snow_white'], text: [
      { y: '숲에서 사냥꾼에게 쫓기는 아가씨가 있대요. 사내 일곱이 함께 다니는 무리 앞에만 나타난다나 봐요.',
        o: '숲에서 사냥꾼에게 쫓기는 아가씨가 있다더군. 사내 일곱이 함께 다니는 무리 앞에만 나타난다나.' },
      { y: '프랑스 숲 깊은 곳에 왕비의 미움을 산 아가씨가 숨어 산대요. 사내 일곱이 한 무리여야 만날 수 있다던가요.',
        o: '프랑스 숲 깊은 곳에 왕비의 미움을 산 아가씨가 숨어 산다더군. 사내 일곱이 한 무리여야 만난다던가.' }] },
    { id: 'sleeping_beauty', near: [P.germany], r: 7, own: DE, mates: ['sleeping_beauty'], text: [
      { y: '독일 땅 숲 깊숙이 가시덤불에 덮인 성이 있대요. 거기 잠든 처녀를 깨우려면 용을 본 사람과 병을 고치는 사람이 함께 가야 한다나 봐요.',
        o: '독일 땅 숲 깊숙이 가시덤불에 덮인 성이 있다네. 거기 잠든 처녀를 깨우려면 용을 본 사람과 병을 고치는 사람이 함께 가야 한다는군.' },
      { y: '가시덤불 성 이야기 들어 보셨어요? 숲에서 밤을 지새우는 사람만 그 성을 본대요.',
        o: '가시덤불 성 이야기가 있지. 숲에서 밤을 지새우는 사람만 그 성을 본다더군.' }] },
    { id: 'little_mermaid', near: [P.denmark], r: 5, own: DK, mates: ['little_mermaid'], text: [
      { y: '덴마크 섬 물가에서 말을 못 하는 아가씨를 봤대요. 걸음이 서툴러서, 섬에서 사냥하던 사람들 눈에만 띈다나 봐요.',
        o: '덴마크 섬 물가에서 말을 못 하는 아가씨를 봤다더군. 걸음이 서툴러서, 섬에서 사냥하던 사람들 눈에만 띈다나.' },
      { y: '바다에서 올라온 것 같은 아가씨가 섬 바닷가를 헤맨대요. 섬에 내려 야영하는 뱃사람이라면 만날지도 몰라요.',
        o: '바다에서 올라온 것 같은 아가씨가 섬 바닷가를 헤맨다지. 섬에 내려 야영하는 뱃사람이라면 만날지도 모르지.' }] },
    // 잔 (js/systems/joan.js — JN.ready: 합류한 적이 있으면(done) 끝)
    { id: 'joan', near: [P.paris], r: 7, own: FR, mates: ['joan_of_arc'], live: function (s) { return !(s.joan && s.joan.done); }, text: [
      { y: '숲가 마을에서 「마녀를 태워라」 하는 소리가 났대요. 약초 캐러 숲에 들어간 사람이 봤다는데… 배에 빈 기도방이 있는 분이라면 그 아가씨가 따라갈지도요.',
        o: '숲가 마을에서 「마녀를 태워라」 하는 소리가 났다더군. 약초 캐러 숲에 들어간 사람이 봤다는데… 배에 빈 기도방이 있는 사람이라면 그 아가씨가 따라갈지도 모르지.' },
      { y: '프랑스 숲 마을에 화형대가 섰대요. 칼을 쓸 줄 아는 사람이 막아서야 할 텐데요.',
        o: '프랑스 숲 마을에 화형대가 섰다는군. 칼을 쓸 줄 아는 사람이 막아서야 할 텐데.' }] },
    // 눈의 여왕 (js/systems/snowqueen.js — SQ.ready: 아직 시작하지 않았고 게르다가 배에 없고 떠나지 않았다)
    { id: 'snowqueen', near: [P.nordic], r: 12, mates: ['gerda'], live: function (s) { return !(s.snowQ && s.snowQ.stage); }, text: [
      { y: '북쪽 호숫가에서 동생을 찾는 소녀가 있대요. 하얀 썰매가 동쪽으로 갔다나요. 호숫가에서 밤을 보내는 사람이면 만날지도 몰라요.',
        o: '북쪽 호숫가에서 동생을 찾는 소녀가 있다더군. 하얀 썰매가 동쪽으로 갔다나. 호숫가에서 밤을 보내는 사람이면 만날지도 모르지.' },
      { y: '얼어붙은 호숫가에 빨간 구두를 신은 아이가 서 있대요. 눈의 여왕 이야기를 한다나 봐요.',
        o: '얼어붙은 호숫가에 빨간 구두를 신은 아이가 서 있다더군. 눈의 여왕 이야기를 하더라나.' }] },
    // 피터 팬 (js/systems/peterpan.js) — 아이를 잃은 뒤(lost)에는 찾는 법만
    { id: 'peter', near: [P.edinburgh], r: 4, mates: ['peter_pan'], live: function (s) { return !(s.peter && s.peter.phase === 'done'); }, text: function (s) {
      var find = { y: '서쪽 섬들에서 아이가 밤새 사라졌다 돌아왔다는 이야기가 있어요. 산비탈 약초 냄새를 따라가면 찾는대요.',
        o: '서쪽 섬들에서 아이가 밤새 사라졌다 돌아왔다는 이야기가 있지. 산비탈 약초 냄새를 따라가면 찾는다나.' };
      if (s.peter && s.peter.phase === 'lost') return [find];
      return [{ y: '스코틀랜드 작은 섬엔 어른이 되지 않는 아이가 산대요. 아이를 데리고 섬에 내리는 사람은 조심하래요.',
        o: '스코틀랜드 작은 섬엔 어른이 되지 않는 아이가 산다는 옛말이 있지. 아이를 데리고 섬에 내리는 사람은 조심하라더군.' }, find];
    } },
    // ───────────── 전설 속 인물 (js/systems/legends.js)
    { id: 'tao', near: [P.china], r: 14, own: CN, mates: ['liu_bei', 'guan_yu', 'zhang_fei'], anyDone: true, live: function (s) { return !(s.legend && s.legend.tao && s.legend.tao.done); }, text: [
      { y: '북쪽 탁군 땅 복숭아밭에 의형제를 맺은 세 사내가 있대요. 중국 술집에서 술을 자꾸 사는 사람한테 먼저 말을 건다나 봐요.',
        o: '북쪽 탁군 땅 복숭아밭에 의형제를 맺은 세 사내가 있다더군. 중국 술집에서 술을 자꾸 사는 사람한테 먼저 말을 건다나.' },
      { y: '술 좋아하는 붉은 얼굴의 장수랑 수염 덥수룩한 사내 이야기 들으셨어요? 술집과 복숭아밭을 오가다 보면 만난대요.',
        o: '술 좋아하는 붉은 얼굴의 장수와 수염 덥수룩한 사내가 있다지. 술집과 복숭아밭을 오가다 보면 만난다더군.' }] },
    { id: 'zhuge', near: [P.china], r: 14, own: CN, mates: ['zhuge_liang'], live: function (s) { return has(s, 'liu_bei') && !(s.legend && s.legend.zhuge && s.legend.zhuge.done); }, text: [
      { y: '와룡이라는 선비가 여관에서 누군가를 기다린대요. 덕이 높은 분을 바로 곁에 둔 제독이 여관에 자꾸 들르면 나선다나 봐요.',
        o: '와룡이라는 선비가 여관에서 누군가를 기다린다지. 덕이 높은 사람을 바로 곁에 둔 제독이 여관에 자꾸 들르면 나선다나.' }] },
    { id: 'dartagnan', near: [P.paris], r: 7, own: FR, mates: ['d_artagnan'], live: function (s) { return !(s.legend && s.legend.dart && s.legend.dart.done); }, text: [
      { y: '가스코뉴에서 올라온 젊은이가 말 살 돈이 모자라 장터를 서성인대요. 시장에서 물건을 많이 사는 사람한테 손을 벌린다나 봐요.',
        o: '가스코뉴에서 올라온 젊은이가 말 살 돈이 모자라 장터를 서성인다더군. 시장에서 물건을 많이 사는 사람한테 손을 벌린다나.' }] },
    { id: 'musketeers', near: [P.paris], r: 9, own: FR, mates: ['athos', 'porthos', 'aramis'], live: function (s) { return has(s, 'd_artagnan'); }, text: [
      { y: '왕의 총사 셋이 가스코뉴 젊은이를 찾고 있대요. 그 젊은이와 함께 처음 가 보는 술집에 들어서면 결투를 걸어 온대요.',
        o: '왕의 총사 셋이 가스코뉴 젊은이를 찾고 있다는군. 그 젊은이와 함께 처음 가 보는 술집에 들어서면 결투를 걸어 온다더군.' }] },
    // 셰헤라자드는 이슬람 도시 도서관에서만 · 알라딘·알리바바는 오스만 제국 도시 교역소에서만 — 그 도시 사람들만 이야기한다 (키예프·칸디아 같은 이웃 도시는 아니다)
    { id: 'scheherazade', near: [P.istanbul, P.cairo, P.baghdad], r: 10, where: function (c) { return c.rel === 'I'; }, mates: ['scheherazade'],
      live: function (s) { return !(s.legend && s.legend.sche && s.legend.sche.done); }, text: [
      { y: '천 하룻밤 이야기를 아는 여인이 도서관에 들른대요. 한자리에서 책을 여러 권 읽는 사람을 눈여겨본다나 봐요.',
        o: '천 하룻밤 이야기를 아는 여인이 도서관에 들른다더군. 한자리에서 책을 여러 권 읽는 사람을 눈여겨본다나.' }] },
    { id: 'lamp', near: [P.istanbul], r: 10, where: function (c) { return G.Legend && G.Legend.isOttoman ? G.Legend.isOttoman(c) : c.rel === 'I'; }, mates: ['aladdin', 'ali_baba'], live: function (s) { return has(s, 'scheherazade'); }, text: [
      { y: '오스만 교역소에 돈을 크게 댄 사람한테만 오는 손님들이 있대요. 낡은 등잔이랑 동굴 이야기를 하는 젊은이들인데… 이야기꾼 여인이 말을 옮겨 줘야 알아듣는다나 봐요.',
        o: '오스만 교역소에 돈을 크게 댄 사람한테만 오는 손님들이 있다더군. 낡은 등잔과 동굴 이야기를 하는 젊은이들… 이야기꾼 여인이 말을 옮겨 줘야 알아듣는다던가.' }] },
    // ───────────── 이베리아·이탈리아
    { id: 'quixote', near: [P.toledo], r: 6, mates: ['don_quixote', 'sancho_panza'], anyDone: true, live: function (s) { return !(s.quix && s.quix.stage); }, text: [
      { y: '라 만차 들판에서 풍차한테 창을 겨누는 늙은 기사가 있대요. 톨레도 쪽에 가면 볼 수 있을걸요. 순례 길동무를 찾는다나 봐요.',
        o: '라 만차 들판에서 풍차한테 창을 겨누는 늙은 기사가 있다더군. 톨레도 쪽에 가면 볼 수 있다지. 순례 길동무를 찾는다나.' },
      { y: '당나귀 탄 땅딸보 종자를 거느린 기사 이야기 들으셨어요? 톨레도 근처에서 바다의 기사를 기다린대요.',
        o: '당나귀 탄 땅딸보 종자를 거느린 기사가 있다지. 톨레도 근처에서 바다의 기사를 기다린다더군.' }] },
    // 레오나르도 (js/systems/leonardo.js): 저택에 있는 동안(1482~1518년) · 밀라노 공작을 만난 적이 있거나 지금 공작이 있어야(1480~1498 · 1521~1534) 문이 열린다
    { id: 'leonardo', near: [P.milan], r: 6, y: [1482, 1518], mates: ['leonardo'],
      live: function (s) { return !(s.leo && s.leo.joined) && present('it_leonardo') && ((G.Leo && G.Leo.metMoro && G.Leo.metMoro()) || present('it_moro')); }, text: [
      { y: '밀라노에 하늘을 나는 기계를 그리는 화가가 산대요. 먼저 공작님께 얼굴을 알려야 그 집 문이 열린다나요.',
        o: '밀라노에 하늘을 나는 기계를 그리는 화가가 산다더군. 먼저 공작께 얼굴을 알려야 그 집 문이 열린다나.' }] },
    { id: 'medici', near: [P.florence], r: 7, d: [14800101, 14920407], live: function (s) { return !(s.medici && s.medici.stage); }, text: [
      { y: '피렌체 메디치 은행이 남모를 시름에 잠겼대요. 그 집 당주와 일을 한번 해낸 사람한테나 털어놓겠지요.',
        o: '피렌체 메디치 은행이 남모를 시름에 잠겼다는 소문이 있지. 그 집 당주와 일을 한번 해낸 사람한테나 털어놓겠지.' }] },
    // 바르바로사 (js/systems/barbarossa.js): 1542년 말까지 조건(b.ok)을 갖춘 사람만 1543년 3~10월에 황제가 부른다
    { id: 'barbarossa', near: [P.seville, P.vienna, P.genoa], r: 8, d: [15380101, 15431031],
      live: function (s) { var b = s.barb || {}; return !b.stage && (dn(s) <= 15421231 || !!b.ok); }, text: [
      { y: '붉은 수염 해적 때문에 황제 폐하의 시름이 깊으시대요. 폐하께서 믿으시고 작위까지 받은 사람이라면 부르실 거라나요.',
        o: '붉은 수염 해적 때문에 황제 폐하의 시름이 깊으시다더군. 폐하께서 믿으시고 작위까지 받은 사람이라면 부르실 거라나.' }] },
    // 사라진 왕녀 (js/systems/princess.js): 결혼하지 않은 남자 제독 · 에스파냐 국왕이 있을 때 · 한 번뿐
    { id: 'princess', near: [P.seville], r: 9, live: function (s) {
      if (s.princess || female(s)) return false;
      var PR = G.Princess; if (PR && PR.single && !PR.single()) return false; if (!PR && s.player.wife) return false;
      return !(PR && PR.crown) || !!PR.crown();
    }, text: [
      { y: '에스파냐 왕녀님 소식이 끊겼다고 쉬쉬하는 이야기가 있어요. 이름이 아주 높은, 아직 장가 안 간 제독을 왕께서 찾으신대요.',
        o: '에스파냐 왕녀님 소식이 끊겼다고 쉬쉬하는 이야기가 있지. 이름이 아주 높은, 아직 장가 안 간 제독을 왕께서 찾으신다더군.' }] },
    // ───────────── 잉글랜드 (js/systems/tudor.js)
    { id: 'henry', near: [P.london], r: 6, own: EN, y: [1527, 1533], live: function (s) { return !(s.tudor && s.tudor.div && s.tudor.div.stage) && /헨리 8세/.test(holder('en_king')); }, text: [
      { y: '국왕 폐하께서 왕비님과의 혼인을 무르시려 한대요. 폐하와 가까운 뱃사람이라면 로마까지 심부름을 맡기실지도 몰라요.',
        o: '국왕 폐하께서 왕비와의 혼인을 무르시려 한다더군. 폐하와 가까운 뱃사람이라면 로마까지 심부름을 맡기실지도 모르지.' }] },
    { id: 'elizabeth', near: [P.london], r: 6, own: EN, d: [15530719, 15581116], live: function (s) { return !(s.tudor && s.tudor.eliz && s.tudor.eliz.stage); }, text: [
      { y: '런던 탑에 갇힌 공주님이 언니 여왕님을 무서워하신대요. 왕궁과 줄이 닿는 분이라면 거리에서 탑이 보일 거래요.',
        o: '런던 탑에 갇힌 공주님이 언니 여왕을 무서워하신다더군. 왕궁과 줄이 닿는 사람이라면 거리에서 탑이 보인다나.' }] },
    // 칼레: 1588년 1~7월 여왕이 부른다 (부름을 받으면 이 소문은 끝)
    { id: 'calais', near: [P.london], r: 7, own: EN, d: [15860101, 15880731], live: function (s) { var t = s.tudor || {}; return !(t.calais && t.calais.stage) && !t.armada; }, text: [
      { y: '에스파냐가 큰 함대를 꾸린대요. 여왕님께 발견을 아뢴 적 있는 뱃사람들이 칼레 앞바다로 불려 간다나요.',
        o: '에스파냐가 큰 함대를 꾸린다더군. 여왕께 발견을 아뢴 적 있는 뱃사람들이 칼레 앞바다로 불려 간다나.' }] },
    // ───────────── 아메리카
    // 아즈텍 (js/systems/aztec.js): 쿠바의 술잔(1장)은 1519년 2월 17일까지 — 그 뒤로는 서쪽 땅의 소식
    { id: 'aztec', near: [P.havana, P.veracruz], r: 12, d: [15170301, 15210812], live: function (s) { return !(s.aztec && s.aztec.end); }, text: function (s) {
      var t = dn(s), b = s.aztec || {};
      if (t <= 15190217) return b.rumor ? [] : [
        { y: '쿠바 항구 술집마다 서쪽 호수 위의 황금 도시 이야기가 한창이래요. 코르테스라는 사내가 사람을 모은대요.',
          o: '쿠바 항구 술집마다 서쪽 호수 위의 황금 도시 이야기가 한창이라더군. 코르테스라는 사내가 사람을 모은다나.' }];
      if (t < 15191108) return [
        { y: '코르테스라는 사내가 배를 몰고 서쪽 땅으로 떠났대요. 호수 위의 황금 도시로 간다나 봐요. 그쪽 바닷가에 가 보면 소식을 들을 수 있을 거예요.',
          o: '코르테스라는 사내가 배를 몰고 서쪽 땅으로 떠났다더군. 호수 위의 황금 도시로 간다나. 그쪽 바닷가에 가 보면 소식을 들을 수 있겠지.' }];
      return [
        { y: '서쪽 땅 호수 위의 황금 도시에 하얀 사람들이 들어갔대요. 그 나라가 크게 흔들린다는데, 가 보는 사람만 무슨 일인지 알겠지요.',
          o: '서쪽 땅 호수 위의 황금 도시에 하얀 사람들이 들어갔다더군. 그 나라가 크게 흔들린다는데, 가 보는 사람만 무슨 일인지 알겠지.' }];
    } },
    // 잉카 (js/systems/incafall.js): 동업(1524~1532.10.15)은 아직 고르지 않은 사람에게만 · 쿠스코 입성(~1535)·망코의 반란(1536.5~1537.4)은 누구나
    { id: 'inca', near: [P.panama, P.lima], r: 12, d: [15240101, 15370430], text: function (s) {
      var t = dn(s), b = s.incaFall || {}, out = [];
      if (!b.side && t <= 15321015) out.push({ y: '파나마에 남쪽 황금 나라로 갈 동업자를 찾는 늙은 군인이 있대요. 돈을 대는 사람이라면 한몫 끼워 준다나요.',
        o: '파나마에 남쪽 황금 나라로 갈 동업자를 찾는 늙은 군인이 있다더군. 돈을 대는 사람이라면 한몫 끼워 준다나.' });
      var partner = b.side === 'partner' && !b.ransom && t <= 15330725, cusco = !b.cusco && t <= 15351231, siege = !b.siege && t <= 15370430;
      if (partner || cusco || siege) out.push({ y: '남쪽 산속 나라가 흔들린대요. 그 나라 서울에 가 보면 무슨 일인지 보게 될 거래요.',
        o: '남쪽 산속 나라가 흔들린다더군. 그 나라 서울에 가 보면 무슨 일인지 보게 되겠지.' });
      return out;
    } },
    { id: 'pocahontas', near: [P.namerica, P.havana], r: 16, d: [15210813, 17000101], mates: ['h_pocahontas'], live: function (s) { return !(s.poca && s.poca.done) && !(G.Pocahontas && G.Pocahontas.slaver && G.Pocahontas.slaver()); }, text: [
      { y: '옥수수밭 가장자리에서 정착민과 원주민이 맞선대요. 사람을 사고판 적 없는 제독 앞에서만, 두 줄 사이로 뛰어드는 처녀가 있다나요.',
        o: '옥수수밭 가장자리에서 정착민과 원주민이 맞선다더군. 사람을 사고판 적 없는 제독 앞에서만, 두 줄 사이로 뛰어드는 처녀가 있다나.' }] },
    // ───────────── 동아시아
    { id: 'simcheong', near: [P.korea], r: 6, own: KR, mates: ['simcheong'], live: function (s) { return !(s.sim && s.sim.done); }, text: [
      { y: '포구에 「제물로 바칠 처녀를 쌀 삼백 석에 산다」는 방이 붙었대요. 쌀을 넉넉히 싣고 조선 항구에 드는 배라면….',
        o: '포구에 「제물로 바칠 처녀를 쌀 삼백 석에 산다」는 방이 붙었다더군. 쌀을 넉넉히 싣고 조선 항구에 드는 배라면….' }] },
    // 견우와 직녀 (js/systems/gyeonwoo.js): 오작 할멈의 부탁은 아직 받지 않았을 때만 (받은 뒤로는 수첩의 할 일)
    { id: 'gyeonwoo', near: [P.korea, P.hangzhou], r: 8, mates: ['gyeonwoo', 'jiknyeo'], anyDone: true, live: function (s) { return !(s.gw && (s.gw.end || s.gw.stage > 0)); }, text: [
      { y: '오작 할멈이 거북 모양 배를 찾아다닌대요. 항주와 사카이를 아는 선장이라면 한 해 한 번 만나는 연인을 이어 줄 수 있다나요.',
        o: '오작 할멈이 거북 모양 배를 찾아다닌다더군. 항주와 사카이를 아는 선장이라면 한 해 한 번 만나는 연인을 이어 줄 수 있다나.' }] }
  ];
})(window.G = window.G || {});
