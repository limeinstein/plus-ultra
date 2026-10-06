/* 부하 후보의 특기 늘리기 — 지명도(G.RENOWN)와 더 얹어 줄 특기
   · 모든 부하 후보는 특기가 조금 더 늘어난다(base). 실존 인물은 지명도가 높을수록 후하게(byTier) — 조정값은 G.BALANCE.mateSkills.
   · 지명도: 4 전설 · 3 명사 · 2 이름난 사람 · 1 기록에 남은 사람(실존 인물의 기본). 지어낸 사람(이야기 속 동료·마녀·철새)은 0.
   · 늘리는 법: 손으로 고른 특기(G.RENOWN_SK — 그 사람의 일생에 맞게)를 먼저 올리고, 남은 몫은
     ① 가장 잘하는 특기를 3단계까지 올리기 ② 가까운 특기(NEAR)를 새로 1단계 익히기 를 번갈아 한다(철새는 새로 익히기부터). 한 특기는 3단계가 끝이다.
   · 철새·고장 사람(떠돌이 항해사)은 만들 때(G.Wander.make·G.RegionFolk.make) 더 얹는다 (G.MateSkills.wander). 옛 저장의 철새는 불러올 때 한 번.
   · 품삯·필요 명성은 그대로 둔다 (같은 값에 더 많은 솜씨). 이 파일은 동료를 올리는 data 파일들(people·storycrew·wanderers·regionfolk) 다음에 읽는다. */
(function (G) {
  'use strict';
  var TIER = {
    4: 'leonardo michelangelo raffaello galileo kepler shakespeare cervantes gutenberg drake barbarossa elcano xavier vespucci mercator ' +
       'h_yisunsin h_heojun h_jeongyagyong h_hwangjini h_sinsaimdang h_yihwang h_yiyi h_kimhongdo h_kimjeongho h_hongildong ' +
       'h_wangyangming h_lishizhen h_qijiguang h_zhengchenggong h_chingshih h_musashi h_rikyu h_basho h_hokusai h_ryoma ' +
       'h_sinan h_nanak h_tansen h_birbal h_lapulapu h_cuauhtemoc h_pocahontas h_sacagawea h_tecumseh h_juanaines',
    3: 'dias pigafetta tycho botticelli donatello camoes piri paracelsus urdaneta ibnmajid orellana coronado cabot verrazzano marina bokuden ' +
       'regiomontanus leoafricanus pinzon_m lacosa ' +
       'h_kimsiseup h_jogwangjo h_imkkeokjeong h_hyujeong h_samyeong h_gwakjaeu h_nongae h_heogyun h_nangseolheon h_yuseongryong h_songsiyeol ' +
       'h_jeongseon h_bakjiwon h_kimjeonghui h_sinyunbok h_kimmandeok h_jeonbongjun h_anyongbok h_yunseondo h_jeongcheol h_hongdaeyong h_bakjega ' +
       'h_kimokgyun h_jangnoksu h_imgyeongeop h_kimmanjung h_bakmunsu ' +
       'h_tangyin h_wangzhi h_xuguangqi h_xuxiake h_songyingxing h_yuanchonghuan h_zhengzhilong h_wuchengen h_tangxianzu h_dongqichang h_caoxueqin ' +
       'h_linzexu h_shilang h_haerui h_chenyuanyuan ' +
       'h_ikkyu h_sesshu h_soun h_eitoku h_hasekura h_nagamasa h_chikamatsu h_gennai h_ino h_manjiro h_okuni ' +
       'h_kabir h_mirabai h_kunjali h_tenali h_abulfazl h_chandbibi h_malikambar h_angre h_tulsidas ' +
       'h_hangtuah h_enrique h_suriyothai h_malahayati h_nguyendu ' +
       'h_kemalreis h_jami h_bihzad h_matrakci h_fuzuli h_turgut h_seydiali h_taqialdin h_baha h_rezaabbasi h_mullasadra h_evliya h_katipcelebi ' +
       'h_anacaona h_hatuey h_guerrero h_ruminahui h_garcilaso h_guamanpoma h_powhatan h_squanto h_metacom h_zumbi h_pontiac h_sequoyah h_brant h_tupacamaru2',
    2: 'duarte zacuto pinzon_v serrao verrocchio manutius ariosto garcia covilha cadamosto torres correia aguilar isaac ' +
       'h_seogeojeong h_kimjongjik h_seonghyeon h_eouudong h_choebu h_kimilson h_seogyeongdeok h_josik h_yisugwang h_kimyuk h_choemyeonggil h_heomok ' +
       'h_yuhyeongwon h_yiik h_choehangi h_sinjaehyo h_jiseogyeong h_jeongyagjeon ' +
       'h_wenzhengming h_shenzhou h_zhuyunming h_qiuying h_xuwei h_lizhi h_guyanwu h_fengmenglong h_liurushi h_yuanmei h_jiyun h_weiyuan h_zhangbaozai h_yudayou ' +
       'h_nobutsuna h_genpaku h_takeyoshi h_yoshitaka h_saikaku h_zuiken h_takatoshi ' +
       'h_surdas h_chaitanya h_purandara h_gulbadan h_abbakka h_kalijaga h_tunperak ' +
       'h_suyuti h_muteferrika h_baki h_almahri ' +
       'h_caonabo h_enriquillo h_massasoit h_dandara h_xicotencatl h_caramuru h_titucusi h_chalcuchimac',
    1: 'triana arana giorgio'
  };
  var R = G.RENOWN = {};
  Object.keys(TIER).forEach(function (t) { TIER[t].split(/\s+/).forEach(function (id) { if (id) R[id] = +t; }); });
  /** 실존 인물인데 표에 없으면 1 (고장의 실존 인물 h_*는 모두 실존) */
  G.renownOf = function (m) { return !m ? 0 : R[m.id] != null ? R[m.id] : m.native && /^h_/.test(m.id) ? 1 : 0; };
  G.RENOWN_NAME = ['', '기록에 남은 사람', '이름난 사람', '명사', '전설'];

  /** 손으로 고른 특기 — 그 사람의 일생에 맞게 (이미 더 높으면 그대로) */
  G.RENOWN_SK = {
    leonardo: { craft: 3, ship: 3, survey: 3, med: 2, music: 2 },
    michelangelo: { craft: 3, hist: 3, theo: 1, med: 1 },
    raffaello: { craft: 2, theo: 1, survey: 1 },
    galileo: { survey: 3, craft: 2, music: 2, speech: 1 },
    kepler: { survey: 3, music: 2, theo: 1, hist: 1 },
    shakespeare: { hist: 3, music: 3, acct: 1 },
    cervantes: { hist: 3, speech: 3, sword: 2, shoot: 1, acct: 1 },
    gutenberg: { craft: 3, sci: 2, acct: 2, art: 1 },
    drake: { gun: 3, ops: 3, sword: 2, survey: 1, speech: 1 },
    barbarossa: { ops: 3, nav: 3, ship: 1, speech: 1 },
    elcano: { survey: 2, ship: 2, sword: 1, acct: 1 },
    xavier: { speech: 3, med: 2, hist: 2 },
    vespucci: { acct: 3, nav: 2, speech: 2 },
    mercator: { art: 3, craft: 3, sci: 3, hist: 1 },
    h_yisunsin: { ship: 2, shoot: 2, hist: 1, speech: 1 },
    h_heojun: { sci: 3, hist: 2, cook: 1 },
    h_jeongyagyong: { hist: 3, craft: 3, ship: 1, med: 1, acct: 1 },
    h_hwangjini: { hist: 2, art: 2, cook: 1 },
    h_sinsaimdang: { craft: 3, hist: 2, music: 1 },
    h_yihwang: { theo: 2, speech: 2, sci: 1 },
    h_yiyi: { acct: 3, speech: 2, ops: 1 },
    h_kimhongdo: { music: 2, craft: 2, hist: 1 },
    h_kimjeongho: { craft: 3, art: 2, nav: 1 },
    h_hongildong: { ops: 3, speech: 2, shoot: 1 },
    h_wangyangming: { ops: 3, theo: 2, speech: 2, sword: 1 },
    h_lishizhen: { sci: 3, cook: 2, hist: 1, survey: 1 },
    h_qijiguang: { gun: 3, ship: 2, shoot: 1, hist: 1 },
    h_zhengchenggong: { sword: 2, acct: 2, speech: 1, ship: 1 },
    h_chingshih: { gun: 3, acct: 2, speech: 2, sword: 1 },
    h_musashi: { art: 3, craft: 2, hist: 1, ops: 1 },
    h_rikyu: { art: 2, craft: 2, theo: 1, speech: 1 },
    h_basho: { speech: 3, hist: 3, survey: 1, art: 1 },
    h_hokusai: { craft: 2, survey: 1, hist: 1 },
    h_ryoma: { nav: 3, speech: 3, acct: 2, shoot: 1 },
    h_sinan: { ship: 3, sci: 2, survey: 2, art: 1 },
    h_nanak: { speech: 3, music: 3, hist: 1 },
    h_tansen: { speech: 2, theo: 1, hist: 1 },
    h_birbal: { hist: 2, acct: 2, music: 1 },
    h_lapulapu: { ops: 2, nav: 1, shoot: 1 },
    h_cuauhtemoc: { ops: 3, speech: 1, theo: 1 },
    h_pocahontas: { speech: 3, survey: 1, cook: 1, med: 1 },
    h_sacagawea: { survey: 3, speech: 3, cook: 1, med: 1 },
    h_tecumseh: { speech: 3, sword: 2, shoot: 1 },
    h_juanaines: { sci: 3, speech: 2, music: 2, theo: 2 },
    // 명사 몇 사람
    dias: { survey: 2, ship: 1 }, pigafetta: { survey: 2, art: 1 }, tycho: { craft: 2, med: 1 }, camoes: { sword: 2, nav: 1 },
    piri: { hist: 2, art: 2 }, paracelsus: { theo: 1, speech: 1 }, ibnmajid: { music: 2, hist: 1 }, bokuden: { ops: 2, art: 1 },
    marina: { hist: 2, cook: 1 }, h_turgut: { ops: 3, ship: 1 }, h_kemalreis: { survey: 2 }, h_seydiali: { music: 1, speech: 1 },
    h_evliya: { music: 2, speech: 2 }, h_ino: { nav: 2, acct: 1 }, h_manjiro: { acct: 1, shoot: 1 }, h_hasekura: { speech: 3, theo: 1 },
    h_nagamasa: { nav: 2, acct: 1 }, h_xuxiake: { survey: 3, med: 1 }, h_zhengzhilong: { speech: 2, ops: 2 }, h_kunjali: { sword: 2 },
    h_malahayati: { sword: 2 }, h_jeonbongjun: { speech: 2 }, h_anyongbok: { survey: 1, ops: 1 }, h_kimmandeok: { cook: 1, speech: 1 }
  };

  // 가까운 특기 — 잘하는 것 옆에서 새로 익히기 쉬운 것 (앞쪽일수록 먼저)
  var NEAR = {
    nav: ['survey', 'ops', 'ship'], ops: ['speech', 'nav', 'sword'], sword: ['ops', 'shoot', 'med'], gun: ['shoot', 'ship', 'ops'],
    shoot: ['gun', 'sword', 'survey'], med: ['sci', 'cook', 'theo'], speech: ['hist', 'theo', 'acct'], survey: ['nav', 'sci', 'art'],
    hist: ['speech', 'art', 'theo'], acct: ['speech', 'craft', 'nav'], ship: ['craft', 'nav', 'gun'], theo: ['speech', 'hist', 'med'],
    sci: ['survey', 'med', 'craft'], art: ['craft', 'hist', 'music'], craft: ['art', 'ship', 'acct'], cook: ['music', 'med', 'acct'],
    music: ['speech', 'art', 'cook']
  };
  var ORDER = {}; (G.SKILLS || []).forEach(function (s, i) { ORDER[s.id] = i; });
  function cfg() { return (G.BALANCE && G.BALANCE.mateSkills) || {}; }
  function cap() { return cfg().cap || 3; }
  function total(sk) { var t = 0; for (var k in sk) t += sk[k]; return t; }
  function sorted(sk) { return Object.keys(sk).sort(function (a, b) { return sk[b] - sk[a] || ORDER[a] - ORDER[b]; }); }
  /** 특기 n단계를 얹는다: 잘하는 것 올리기와 가까운 것 새로 익히기를 번갈아. rnd(있으면) = 0~1 난수 — 새로 익힐 것을 고를 때 */
  function spread(sk, n, rnd, addFirst) {
    var C = cap(), step = addFirst ? 1 : 0, guard = 0;
    while (n > 0 && guard++ < 60) {
      var ids = sorted(sk), up = null, add = null;
      for (var i = 0; i < ids.length; i++) if (sk[ids[i]] < C) { up = ids[i]; break; }
      var opts = [];
      ids.forEach(function (id) { (NEAR[id] || []).forEach(function (x) { if (!sk[x] && opts.indexOf(x) < 0) opts.push(x); }); });
      if (!ids.length) opts = Object.keys(NEAR);
      if (opts.length) add = rnd ? opts[Math.floor(rnd() * Math.min(3, opts.length))] : opts[0];
      var doAdd = step % 2 === 1 ? !!add : !up && !!add;
      if (doAdd) sk[add] = 1; else if (up) sk[up]++; else break;
      step++; n--;
    }
    return sk;
  }
  var MS = G.MateSkills = { spread: spread, NEAR: NEAR };
  /** 정해진 부하 후보 한 사람에게 — 몇 단계 얹을지 */
  MS.budget = function (m) {
    var c = cfg(), by = c.byTier || [0, 1, 2, 3, 4];
    return (c.base == null ? 1 : c.base) + (by[G.renownOf(m)] || 0);
  };
  /** 정해진 부하 후보(실존 인물·이야기 속 동료·마녀) 모두 — 이 파일을 읽을 때 한 번 */
  MS.boostAll = function () {
    (G.MATES || []).forEach(function (m) {
      if (m.wd || m.skBoost) return;
      m.sk = m.sk || {};
      var before = total(m.sk), n = MS.budget(m), hand = G.RENOWN_SK[m.id], C = cap();
      if (hand) for (var k in hand) if ((m.sk[k] || 0) < hand[k]) m.sk[k] = Math.min(C, hand[k]);
      var left = n - (total(m.sk) - before);
      if (left > 0) spread(m.sk, left);
      m.renown = G.renownOf(m);
      m.skBoost = 1;
    });
  };
  /** 철새·고장 사람 한 사람(저장되는 정의) — 만들 때, 또는 옛 저장을 불러올 때 한 번 */
  MS.wander = function (d) {
    if (!d || d.skBoost) return d;
    var c = cfg(), w = c.wander || [1, 2], U = G.U;
    var n = U ? U.ri(w[0], w[1]) : w[0];
    if (U && c.wanderLucky && U.chance(c.wanderLucky)) n++;     // 드물게 솜씨 좋은 떠돌이
    d.sk = spread(d.sk || {}, n, U ? U.rand : null, true);
    d.skBoost = 1;
    return d;
  };
  MS.boostAll();
})(window.G = window.G || {});
