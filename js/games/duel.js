/* 일기토 (duel) — 규칙·글·그림은 이 게임에서 새로 만들었다.
   · 삼국지 6처럼: 무력과 검술로 저절로 겨루고, 처음에 「방침」을 고르며, 기세가 차면 「기술」을 쓴다
     방침: 결사돌진 · 강력공격 · 절대생포 · 호신중시
     기술: 일격필살 · 선제공격 · 측면공격 · 생포 · 거짓퇴각 · 비밀무기 · 유인 · 교체 · 설득 · 허보 · 호통 · 필살기
   · 대항해시대 2처럼: 갑판 위에서 두 사람이 칼을 겨루는 모습. 한 합마다 베기·찌르기·치기를 내고 상성이 있다
     찌르기 → 베기 → 치기 → 찌르기 (화살표 쪽을 이긴다). 상대가 노리는 수는 검술이 높을수록 잘 읽힌다
   G.Games.duel(enemy, opt) → 'win' | 'lose' | 'flee'  (자세한 결과는 G.Games.lastDuel)
     enemy: {name, portrait, str, atk, def, skill, mar, int, cha, style, look, sprite}
     opt: {mate: 대신 싸울 동료, place: 'deck'|'land'|'explore'|'city'|'tavern', sprite, noSwap} */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art, I = G.Img;
  G.Games = G.Games || {};
  var W = 1060, H = 380;

  function duelFx() {
    return (G.FX && G.FX.duel) || { spriteSize: 230, shakeX: 10, shakeY: 6, shakeHit: 0.25, shakeBig: 0.6, shakeDecay: 2.5,
      flashHit: 0.10, flashTaken: 0.16, flashBig: 0.25, flashDecay: 6, knockback: 26, knockReturnMs: 260, hitParticles: 10, particleLife: 0.42 };
  }

  // ---------------------------------------------------------------- 이름표
  var MOVE = { slash: '베기', thrust: '찌르기', bash: '치기' };
  var MOVE_EN = { slash: 'Cut', thrust: 'Thrust', bash: 'Bash' };
  var BEATS = { thrust: 'slash', slash: 'bash', bash: 'thrust' };      // 찌르기는 베기를, 베기는 치기를, 치기는 찌르기를 이긴다
  var COUNTER = { slash: 'thrust', bash: 'slash', thrust: 'bash' };    // 그 수를 이기는 수
  G.DUEL_MOVE = MOVE;
  var STANCE = {
    allout: { name: '결사돌진', en: 'À outrance', dmg: 1.3, taken: 1.35, spirit: 25, desc: '물러서지 않고 끝장을 본다. 주는 피해 +30%, 받는 피해 +35%, 기세 +25로 시작. 물러설 수 없다.' },
    strong: { name: '강력공격', en: 'Assault', dmg: 1.18, taken: 1.08, spirit: 10, desc: '힘껏 몰아친다. 주는 피해 +18%, 받는 피해 +8%.' },
    capture: { name: '절대생포', en: 'Quarter', dmg: 0.85, taken: 1.0, spirit: 10, desc: '칼등으로 쳐서 사로잡는다. 주는 피해 −15%, 생포가 쉬워지고(상대 체력 40% 이하), 상대가 체력 15% 아래로 떨어지거나 쓰러지면 사로잡는다.' },
    guard: { name: '호신중시', en: 'En garde', dmg: 0.85, taken: 0.65, spirit: 0, desc: '몸을 지키며 틈을 노린다. 받는 피해 −35%, 주는 피해 −15%, 막기 +12%. 언제든 물러설 수 있다.' }
  };
  G.DUEL_STANCE = STANCE;
  var SPECIAL = { slash: ['물리네', 'Moulinet', '칼을 풍차처럼 돌려 세 번 벤다'], thrust: ['플레슈', 'Flèche', '몸을 날려 번개처럼 찌른다 — 막기를 뚫는다'], bash: ['천둥 내려치기', 'Crushing blow', '온 힘으로 내려쳐 상대를 비틀거리게 한다'] };
  // 기술: cost 기세, once 한 번만, tip 설명
  var TECH = [
    { id: 'deathblow', name: '일격필살', en: 'Coup de grâce', cost: 50, tip: '한칼에 끝낸다. 상대가 많이 다쳤을수록(체력 45% 이하), 무력·검술이 높을수록 잘 된다. 빗나가면 크게 받아친다.' },
    { id: 'first', name: '선제공격', en: 'Stop-hit', cost: 15, tip: '다음 합에서 먼저 친다. 맞히면 상대의 반격이 절반.' },
    { id: 'flank', name: '측면공격', en: 'Volte', cost: 25, tip: '옆으로 돌아 친다. 상성과 갑옷을 무시하고 30% 세게.' },
    { id: 'capture', name: '생포', en: 'Seize', cost: 20, tip: '칼을 쳐 떨어뜨리고 사로잡는다. 상대 체력 35% 이하(절대생포는 40%)에서.' },
    { id: 'feint', name: '거짓퇴각', en: 'Retreat feint', cost: 15, tip: '물러서는 척 끌어들여 되받아친다. 지력 대결.' },
    { id: 'secret', name: '비밀무기', en: 'Hidden steel', cost: 0, once: true, tip: '품에 숨긴 권총(사격술 1 이상)이나 단검. 한 번만. 떳떳하지 못해 구경꾼이 야유한다.' },
    { id: 'lure', name: '유인', en: 'Lure', cost: 15, tip: '밧줄·젖은 갑판으로 끌어들여 넘어뜨린다. 성공하면 상대가 한 합 쉰다.' },
    { id: 'swap', name: '교체', en: 'Second', cost: 0, once: true, tip: '동료와 바꾼다(한 번만). 새로 나서는 사람은 온전한 몸으로 싸운다.' },
    { id: 'persuade', name: '설득', en: 'Parley', cost: 30, tip: '칼을 내려놓으라고 설득한다. 상대가 지쳤을수록, 매력·웅변이 높을수록 잘 된다. 실패하면 상대가 격앙한다.' },
    { id: 'bluff', name: '허보', en: 'Ruse', cost: 15, tip: '「네 배에 불이 붙었다!」 거짓 소식으로 흔든다. 상대의 기세가 꺾이고 두 합 동안 덜 맞힌다.' },
    { id: 'roar', name: '호통', en: 'War cry', cost: 20, tip: '호통을 쳐 얼어붙게 한다. 많이 다친 상대는 달아나기도 한다.' },
    { id: 'special', name: '필살기', en: 'Signature', cost: 100, tip: '기세를 모두 써서 장기에 맞는 필살기를 쓴다.' }
  ];
  G.DUEL_TECH = TECH;

  /** 무기에 맞는 공격: 찌르는 검은 찌르기, 휜 칼은 베기, 무거운 날·곤봉·도끼는 치기 */
  var STYLE = { rapier: 'thrust', estoc: 'thrust', katar: 'thrust', kris: 'thrust', longinus: 'thrust',
    saber: 'slash', shamshir: 'slash', katana: 'slash', shotel: 'slash', firangi: 'slash', longsword: 'slash', excalibur: 'slash',
    twohand: 'bash', flamberge: 'bash', broadsword: 'bash', bastard: 'bash', guandao: 'bash', macuahuitl: 'bash' };
  G.Games.weaponStyle = function (id) {
    if (!id) return 'slash';
    if (STYLE[id]) return STYLE[id];
    var d = G.ITEM && G.ITEM[id], n = d ? d.name : '';
    if (/도끼|곤봉|부메랑|라브리스/.test(n)) return 'bash';
    if (/단검|작살|창/.test(n)) return 'thrust';
    return 'slash';
  };

  /** 부관 등 동료가 싸울 때의 능력 (st: 체력·지력·무력·매력) */
  G.Games.mateFighter = function (m) {
    var d = G.MATE[m.id], st = (d && d.st) || [55, 50, 55, 50];
    return { name: d ? d.name : '부관', portrait: G.Scenes.mateSpec(m.id), maxHp: Math.round(60 + st[0] * 0.6), atk: 3 + Math.round(st[2] / 10), def: 1 + Math.floor(st[0] / 30),
      skill: R.mateSkill(m, 'sword'), sword: R.mateSkill(m, 'sword'), might: st[2], int: st[1], cha: st[3], speech: R.mateSkill(m, 'speech') || 0, shoot: R.mateSkill(m, 'shoot') || 0,
      mar: st[2], style: 'slash', m: m, look: 'mate' };
  };
  /** 대신 싸울 부관 (기함의 부관이 있고 다치지 않았으면) */
  G.Games.proxy = function () {
    var s = G.Game.state, m = s.mates.filter(function (x) { return x.role === 'first'; })[0];
    return m && !R.mateHurt(m) ? m : null;
  };
  /** 교체해 나설 수 있는 사람 (다치지 않은 동료 중 가장 센 사람, 또는 제독) */
  function swapCandidate(cur) {
    var s = G.Game.state, best = null, bs = -1;
    s.mates.forEach(function (m) {
      if (R.mateHurt(m) || (cur.m && cur.m === m)) return;
      var f = G.Games.mateFighter(m), sc = f.might + f.sword * 12;
      if (sc > bs) { bs = sc; best = f; }
    });
    if (cur.m && s.player.hp >= 40) { var pf = playerFighter(); var ps = pf.might + pf.sword * 12; if (ps > bs) best = pf; }
    return best;
  }
  function playerFighter() {
    var s = G.Game.state, p = s.player;
    var f = { name: p.name, portrait: p.portrait, maxHp: Math.round(60 + p.st.str * 0.6), atk: R.atk(), def: R.def(), sword: p.sk.sword || 0, might: p.st.mar, int: p.st.int, cha: p.st.cha,
      speech: R.skill('speech'), shoot: R.skill('shoot'), style: G.Games.weaponStyle(p.equip.weapon), look: 'admiral', admiral: true };
    // 생김새에 맞는 전투원 시트(이강희 → duel/fighters/ganghui), 없으면 main_admiral
    var hk = G.Img && G.Img.pick(G.Img.chain.heroDuel());
    f.hero = hk ? hk.slice('duel/fighters/'.length) : 'main_admiral';
    f.hp = Math.max(8, Math.round(f.maxHp * p.hp / 100));
    return f;
  }

  G.Games.playerFighter = playerFighter;

  // ================================================================ 일기토
  G.Games.duel = function (enemy, opt) {
    opt = opt || {};
    var s = G.Game.state, p = s.player;
    var me = opt.mate ? G.Games.mateFighter(opt.mate) : playerFighter();
    if (me.hp == null) me.hp = me.maxHp;
    if (opt.sprite) me.sprite = opt.sprite;
    var look = enemy.look || (/해적|두목/.test(enemy.name) ? 'pirate' : /함장|수비|장교/.test(enemy.name) ? 'captain' : /사내|주정/.test(enemy.name) ? 'brawler' : 'rival');
    var en = { name: enemy.name, portrait: enemy.portrait, maxHp: Math.round(60 + (enemy.str || 60) * 0.6), atk: enemy.atk || 8, def: enemy.def || 2, sword: enemy.skill || 0, might: enemy.mar || 55 + (enemy.skill || 0) * 5,
      int: enemy.int || 45, cha: enemy.cha || 40, speech: 0, shoot: 0, style: enemy.style || (look === 'pirate' ? 'slash' : look === 'captain' ? 'thrust' : U.pick(['slash', 'thrust', 'bash'])), look: look, sprite: enemy.sprite || null };
    en.hp = en.maxHp;
    [me, en].forEach(function (f) { f.spirit = 20; f.x = 0; f.pose = 'idle'; f.pt = 0; f.stun = 0; f.dizzy = 0; f.flash = 0; f.used = {}; });
    me.side = 'me'; en.side = 'en';
    var place = opt.place || (G.Game.sceneName === 'battle' || G.Game.sceneName === 'sea' ? 'deck' : 'tavern');
    var art = G.DUEL_ART || {}, D = duelFx(), bgImg = null;
    var result = G.Games.lastDuel = { how: null, stance: null, mate: opt.mate || null, swapped: null, secret: false };
    var stance = null, myNext = 'auto', enIntent = null, intentSeen = false, round = 0, over = false, busy = false, paused = false, fast = false;
    var flags = { first: false, feintMe: false, feintEn: false, bluffEn: 0, lureEn: false };
    var fx = [], shakeT = 0, screenFlash = 0, screenFlashRgb = '255,244,220', logs = [], swapped = false;
    if (G.Audio) G.Audio.music('battle');

    return new Promise(function (resolve) {
      var html = '<div class="rduel">' +
        '<div class="rd-top"><div class="rd-side me"><div class="pp"></div><div class="info"><div class="nm"></div><div class="bar hp"><i></i><b></b></div><div class="bar sp"><i></i><b></b></div><div class="sub"></div></div></div>' +
        '<div class="rd-mid"><div class="rd-round"></div><div class="rd-rps">찌르기 <span>→</span> 베기 <span>→</span> 치기 <span>→</span> 찌르기<small>화살표 쪽을 이긴다</small></div></div>' +
        '<div class="rd-side en"><div class="info"><div class="nm"></div><div class="bar hp"><i></i><b></b></div><div class="bar sp"><i></i><b></b></div><div class="sub"></div></div><div class="pp"></div></div></div>' +
        '<div class="rd-stage"><canvas width="' + W + '" height="' + H + '"></canvas><div class="rd-stance"></div></div>' +
        '<div class="rd-log"></div>' +
        '<div class="rd-ctrl"><div class="rd-moves"><div class="lbl">다음 수 <span class="intent"></span></div><div class="row"></div></div><div class="rd-techs"><div class="lbl">기술 <small>기세를 쓴다</small></div><div class="grid"></div></div><div class="rd-sys"></div></div></div>';
      var win = UI.window({ title: '일기토', icon: 'sword', width: 1120, html: html, closable: false });
      var el = win.content, cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
      // 초상에 양식이 없으면 지금 있는 도시(바다면 가까운 도시)의 양식으로 전투원 그림을 고른다
      var hereStyle = (function () { var s0 = G.Game.state, c0 = s0 && s0.loc && G.CITY_DATA && G.CITY_DATA[s0.loc.city]; return c0 && c0.style; })();
      function fighterSprite(f) {
        var id = art.pick ? art.pick(f, { style: hereStyle }) : (f.sprite || (art.byName && art.byName[f.name]) || (f.admiral ? 'main_admiral' : f.m ? 'first_mate' : art.byLook && art.byLook[f.look]));
        if (!id || !I) return;
        f.spriteId = id;
        var key = 'duel/fighters/' + id;
        f.spriteKey = key;
        f.spriteImg = I.get(key);
        I.load(key).then(function (im) { if (im) f.spriteImg = im; });
      }
      fighterSprite(me); fighterSprite(en);
      if (I && art.backgrounds) {
        var bgid = art.backgrounds[place] || art.backgrounds.tavern, bgkey = 'duel/backgrounds/' + bgid;
        bgImg = I.get(bgkey);
        I.load(bgkey).then(function (im) { if (im) bgImg = im; });
      }
      var logEl = el.querySelector('.rd-log');
      function setPortrait(f, sel) { var box = el.querySelector(sel + ' .pp'); box.innerHTML = ''; if (f.portrait) box.appendChild(A.portraitCanvas(f.portrait, 84)); }
      setPortrait(me, '.rd-side.me'); setPortrait(en, '.rd-side.en');
      function say(t) { logs.push(t); logEl.innerHTML = logs.slice(-2).map(function (x, i, a) { return '<div' + (i < a.length - 1 ? ' class="old"' : '') + '>' + x + '</div>'; }).join(''); }
      function bars() {
        [[me, '.rd-side.me'], [en, '.rd-side.en']].forEach(function (x) {
          var f = x[0], b = el.querySelector(x[1]);
          b.querySelector('.nm').innerHTML = U.esc(f.name) + (f.m ? ' <small>(동료)</small>' : '');
          b.querySelector('.bar.hp i').style.width = Math.max(0, f.hp / f.maxHp * 100) + '%'; b.querySelector('.bar.hp b').textContent = '체력 ' + Math.max(0, Math.round(f.hp)) + ' / ' + f.maxHp;
          b.querySelector('.bar.sp i').style.width = f.spirit + '%'; b.querySelector('.bar.sp b').textContent = '기세 ' + Math.round(f.spirit);
          b.querySelector('.sub').innerHTML = '무력 ' + f.might + ' · 검술 ' + f.sword + ' · 공격 ' + f.atk + ' · 방어 ' + f.def + ' · 장기 ' + MOVE[f.style] + (f === me && stance ? ' · <b>' + STANCE[stance].name + '</b>' : '');
        });
        el.querySelector('.rd-round').innerHTML = stance ? '제 ' + (round + 1) + ' 합' : '방침을 고르십시오';
      }
      function power(f) { return f.might + f.sword * 12 + f.atk * 1.5; }

      // ------------------------------------------------ 그림
      var t0 = performance.now(), live = true, last = t0;
      var ROPE = U.makeRng(5);
      function drawScene(t) {
        if (bgImg && I) {
          I.drawCover(ctx, bgImg, 0, 0, W, H, 0.5, 0.5);
          var shade = ctx.createLinearGradient(0, 0, 0, H);
          shade.addColorStop(0, 'rgba(20,14,8,.04)'); shade.addColorStop(0.58, 'rgba(20,14,8,.02)'); shade.addColorStop(1, 'rgba(20,12,6,.16)');
          ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
          return;
        }
        if (place === 'tavern') {
          var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1a10'); g.addColorStop(0.62, '#4a3020'); g.addColorStop(0.63, '#5a3c22'); g.addColorStop(1, '#3a2614'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          for (var b = 0; b < 12; b++) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(b * 92, 0, 6, H * 0.62); }
          for (var pl = 0; pl < 9; pl++) { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.moveTo(0, H * 0.63 + pl * 16); ctx.lineTo(W, H * 0.63 + pl * 16); ctx.stroke(); }
          [140, 530, 920].forEach(function (lx) { var gl = ctx.createRadialGradient(lx, 60, 4, lx, 60, 150); gl.addColorStop(0, 'rgba(255,200,110,.55)'); gl.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = gl; ctx.fillRect(lx - 150, 0, 300, 220); ctx.fillStyle = '#ffd890'; ctx.fillRect(lx - 5, 50, 10, 16); });
          // 통·탁자
          [[70, 1], [990, 1], [210, 0], [850, 0]].forEach(function (o) { ctx.fillStyle = o[1] ? '#6a4020' : '#5a3418'; if (o[1]) { ctx.fillRect(o[0] - 26, H * 0.5, 52, 70); ctx.fillStyle = '#3a2210'; ctx.fillRect(o[0] - 26, H * 0.5 + 18, 52, 5); ctx.fillRect(o[0] - 26, H * 0.5 + 48, 52, 5); } else { ctx.fillRect(o[0] - 50, H * 0.58, 100, 10); ctx.fillRect(o[0] - 44, H * 0.58, 8, 50); ctx.fillRect(o[0] + 36, H * 0.58, 8, 50); } });
        } else {
          var sg = ctx.createLinearGradient(0, 0, 0, H * 0.5); sg.addColorStop(0, '#5a8ab8'); sg.addColorStop(1, '#c8dce4'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H * 0.5);
          // 구름
          ctx.fillStyle = 'rgba(255,255,255,.55)'; for (var c = 0; c < 5; c++) { var cx = ((c * 260 + t * 8) % (W + 300)) - 150, cy = 30 + (c % 3) * 22; ctx.beginPath(); ctx.ellipse(cx, cy, 70, 14, 0, 0, 7); ctx.ellipse(cx + 40, cy - 8, 40, 12, 0, 0, 7); ctx.fill(); }
          // 바다
          ctx.fillStyle = '#3a6a8a'; ctx.fillRect(0, H * 0.36, W, H * 0.2);
          ctx.strokeStyle = 'rgba(255,255,255,.35)'; for (var w2 = 0; w2 < 14; w2++) { var wx = (w2 * 83 + t * 20) % W; ctx.beginPath(); ctx.moveTo(wx, H * 0.4 + (w2 % 4) * 9); ctx.lineTo(wx + 22, H * 0.4 + (w2 % 4) * 9); ctx.stroke(); }
          // 오른쪽: 갈고리로 붙은 적선의 뱃전
          ctx.fillStyle = '#3a2618'; ctx.beginPath(); ctx.moveTo(W - 120, H * 0.3); ctx.lineTo(W, H * 0.26); ctx.lineTo(W, H * 0.6); ctx.lineTo(W - 150, H * 0.6); ctx.fill();
          ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W - 60, H * 0.28); ctx.lineTo(W - 60, -10); ctx.stroke();
          // 돛대·돛·밧줄 (왼쪽 뒤)
          ctx.fillStyle = '#5a3a20'; ctx.fillRect(150, -10, 14, H * 0.58);
          ctx.fillStyle = '#efe4c8'; ctx.beginPath(); ctx.moveTo(60, 20); ctx.quadraticCurveTo(160, 35 + Math.sin(t) * 4, 260, 20); ctx.lineTo(268, 140); ctx.quadraticCurveTo(160, 160 + Math.sin(t) * 5, 52, 140); ctx.fill();
          ctx.strokeStyle = 'rgba(40,24,10,.6)'; ctx.lineWidth = 1.2; for (var r = 0; r < 6; r++) { ctx.beginPath(); ctx.moveTo(157, 0); ctx.lineTo(20 + r * 60 + ROPE() * 0, H * 0.46); ctx.stroke(); }
          // 뱃전 난간
          ctx.fillStyle = '#6a4424'; ctx.fillRect(0, H * 0.46, W - 150, 14);
          for (var bl = 0; bl < 22; bl++) { ctx.fillStyle = '#4a2c16'; ctx.fillRect(bl * 44 + 8, H * 0.46 + 14, 8, 30); }
          // 갑판
          var dg = ctx.createLinearGradient(0, H * 0.58, 0, H); dg.addColorStop(0, '#9a7040'); dg.addColorStop(1, '#6a4826'); ctx.fillStyle = dg; ctx.fillRect(0, H * 0.58, W, H * 0.42);
          ctx.strokeStyle = 'rgba(40,24,10,.35)'; ctx.lineWidth = 1; for (var pk = 0; pk < 8; pk++) { var py = H * 0.58 + pk * (pk + 4) * 2.2; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke(); }
          // 통·감긴 밧줄
          ctx.fillStyle = '#6a4020'; ctx.fillRect(40, H * 0.5, 44, 62); ctx.fillStyle = '#3a2210'; ctx.fillRect(40, H * 0.55, 44, 4); ctx.fillRect(40, H * 0.64, 44, 4);
          ctx.strokeStyle = '#b89a60'; ctx.lineWidth = 3; for (var rc = 0; rc < 4; rc++) { ctx.beginPath(); ctx.ellipse(960, H * 0.84, 34 - rc * 7, 10 - rc * 2, 0, 0, 7); ctx.stroke(); }
        }
        // 구경꾼 (난간·벽 앞에서 들썩인다)
        for (var k = 0; k < 16; k++) {
          var side = k < 8 ? 0 : 1, gx = side ? W - 330 + (k - 8) * 34 : 70 + k * 34, gy = H * (place === 'tavern' ? 0.6 : 0.56) + (k % 2) * 8;
          var hop = Math.max(0, Math.sin(t * (4 + k % 3) + k)) * (cheer[side] > 0 ? 6 : 1.5);
          ctx.fillStyle = side ? 'rgba(40,14,10,.85)' : 'rgba(14,24,44,.85)';
          ctx.beginPath(); ctx.ellipse(gx, gy - 22 - hop, 10, 18, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(gx, gy - 46 - hop, 7, 0, 7); ctx.fill();
          if (cheer[side] > 0) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(gx + 6, gy - 34 - hop); ctx.lineTo(gx + 12, gy - 56 - hop); ctx.stroke(); }
        }
      }
      var cheer = [0, 0];
      var LOOK = {
        admiral: { coat: '#1d3f7a', trim: '#d9b45f', pants: '#e8dcc0', hat: 'tricorne', hatc: '#1a1a22', skin: '#e0b48a', hair: '#4a3020' },
        mate: { coat: '#4a5a2a', trim: '#c8b080', pants: '#cabb96', hat: 'cap', hatc: '#6a2a20', skin: '#d8a878', hair: '#2a1a10' },
        pirate: { coat: '#6a1a18', trim: '#e0c060', pants: '#2a2a2a', hat: 'bandana', hatc: '#b02820', skin: '#c89868', hair: '#1a1008', beard: 1 },
        captain: { coat: '#8a2420', trim: '#e8d8a0', pants: '#e8e0c8', hat: 'morion', hatc: '#a8b0b8', skin: '#e0b48a', hair: '#3a2410' },
        brawler: { coat: '#6a5030', trim: '#3a2a18', pants: '#4a3a28', hat: 'none', hatc: '#000', skin: '#d8a070', hair: '#3a2010', beard: 1, bare: 1 },
        rival: { coat: '#2a4a3a', trim: '#e0c890', pants: '#d8ccb0', hat: 'bicorne', hatc: '#161616', skin: '#e2b890', hair: '#6a4a2a' }
      };
      function spriteFrame(f, t) {
        var p = Math.max(0, Math.min(0.999, f.pt || 0)), pose = f.pose;
        if (pose === 'windup') return [0, 1];
        if (pose === 'lunge') return [0, Math.min(5, 2 + Math.floor(p * 4))];
        if (pose === 'block') return [1, Math.min(3, Math.floor(p * 4))];
        if (pose === 'hit') return [2, Math.min(2, Math.floor(p * 3))];
        if (pose === 'down') return [2, 0];                       // 뒤로 젖혀지는 장면으로 쓰러진다
        if (pose === 'kneel') return [2, 1];                      // 비틀거리며 주저앉음(항복·생포)
        if (pose === 'shout' || pose === 'shoot') return [3, 4];
        if (pose === 'run') return [3, Math.floor(t * 8) % 4];    // 물러설 때는 대기 동작을 빨리
        return [3, Math.floor(t * 5.5) % 4];                      // 대기: 180ms 안팎
      }
      function drawSpriteFighter(f, bx, by, face, t) {
        var fr = spriteFrame(f, t), L = art.layout ? art.layout(f.spriteImg) : { cw: 256, ch: 256, px: 128, py: 246, f: 1 };
        // spriteSize = 원본 256px이 화면에서 차지하는 크기 (줄인 사본이면 그만큼 키운다)
        var k = (D.spriteSize || 230) / 256 / (L.f || 1), w = L.cw * k, h = L.ch * k, sx = fr[1] * L.cw, sy = fr[0] * L.ch;
        var bob = f.pose === 'idle' ? Math.sin(t * 3 + (face > 0 ? 0 : 1.5)) * 1.2 : 0;
        ctx.save(); ctx.translate(bx + f.x * face, by + bob); ctx.scale(face, 1);
        // 쓰러짐: 발을 축으로 뒤로 넘어감(0.45초), 항복·생포: 조금 주저앉음
        var q = Math.min(1, (f.pt || 0) * (f.poseDur || 0.35) / 0.45);
        if (f.pose === 'down') { ctx.rotate(-q * 0.95); ctx.translate(0, q * 6); }   // 피격 첫 장면이 이미 30° 남짓 젖혀져 있어 합쳐 눕는다
        else if (f.pose === 'kneel') ctx.translate(0, q * 12);
        ctx.drawImage(f.spriteImg, sx, sy, L.cw, L.ch, -L.px * k, -L.py * k, w, h);
        if (f.flash > 0) {
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.7, f.flash * 0.5);
          ctx.drawImage(f.spriteImg, sx, sy, L.cw, L.ch, -L.px * k, -L.py * k, w, h);
        }
        ctx.restore();
      }
      /** 사람 그리기 (옆모습). face 1 = 오른쪽을 본다 */
      function drawFighter(f, bx, by, face, t) {
        if (f.spriteImg) { drawSpriteFighter(f, bx, by, face, t); return; }
        if (f.spriteKey && I && I.pending(f.spriteKey)) return;   // 전투원 그림을 받는 중: 코드 그림을 내보이지 않고 기다린다
        var L = LOOK[f.look] || LOOK.brawler, k = f.pt, pose = f.pose, bob = pose === 'idle' ? Math.sin(t * 3 + (face > 0 ? 0 : 1.5)) * 1.8 : 0;
        ctx.save(); ctx.translate(bx + f.x * face, by); ctx.scale(1.4, 1.4);
        if (pose === 'down') { ctx.rotate(-face * Math.PI / 2 * Math.min(1, k * 2)); ctx.translate(0, -10 * Math.min(1, k * 2)); }
        if (pose === 'kneel') ctx.translate(0, 22);
        ctx.scale(face, 1);
        // 그림자
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 2, 34, 7, 0, 0, 7); ctx.fill();
        // 다리
        var stepA = pose === 'run' ? Math.sin(t * 16) * 0.6 : pose === 'lunge' ? 0.7 : pose === 'hit' ? -0.3 : 0.28, legL = 46;
        ctx.strokeStyle = L.pants; ctx.lineWidth = 11; ctx.lineCap = 'round';
        if (pose === 'kneel') { ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(18, -30); ctx.lineTo(18, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(-20, -22); ctx.lineTo(-40, -22); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(0, -58 + bob); ctx.lineTo(Math.sin(stepA) * legL, -4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -58 + bob); ctx.lineTo(-Math.sin(stepA) * legL * 0.9, -4); ctx.stroke(); }
        ctx.fillStyle = '#1a120a'; if (pose !== 'kneel') { ctx.fillRect(Math.sin(stepA) * legL - 6, -10, 16, 10); ctx.fillRect(-Math.sin(stepA) * legL * 0.9 - 6, -10, 16, 10); }
        // 몸통 (외투)
        var lean = pose === 'lunge' ? 0.35 : pose === 'windup' ? -0.2 : pose === 'hit' ? -0.3 : pose === 'block' ? -0.08 : pose === 'shout' ? -0.12 : 0;
        ctx.save(); ctx.translate(0, -58 + bob); ctx.rotate(lean);
        ctx.fillStyle = L.coat; ctx.beginPath(); ctx.moveTo(-16, 4); ctx.lineTo(-13, -44); ctx.lineTo(13, -44); ctx.lineTo(18, 4); ctx.lineTo(24, 18); ctx.lineTo(-22, 18); ctx.closePath(); ctx.fill();
        if (L.bare) { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-9, -44, 18, 30); }
        ctx.strokeStyle = L.trim; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, 16); ctx.stroke();
        ctx.fillStyle = '#3a2410'; ctx.fillRect(-16, -12, 34, 5);
        // 머리
        ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(2, -56, 11, 0, 7); ctx.fill();
        ctx.fillStyle = L.hair; ctx.beginPath(); ctx.arc(-2, -58, 11, Math.PI * 0.8, Math.PI * 1.9); ctx.fill();
        if (L.beard) { ctx.fillStyle = L.hair; ctx.beginPath(); ctx.arc(6, -49, 6, 0, Math.PI); ctx.fill(); }
        ctx.fillStyle = '#1a1008'; ctx.fillRect(8, -58, 2.5, 2.5);
        if (f.stun > 0 || f.dizzy > 0) { for (var st2 = 0; st2 < 3; st2++) { var sa = t * 4 + st2 * 2.1; ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.arc(Math.cos(sa) * 16, -76 + Math.sin(sa) * 4, 3, 0, 7); ctx.fill(); } }
        // 모자
        ctx.fillStyle = L.hatc;
        if (L.hat === 'tricorne') { ctx.beginPath(); ctx.moveTo(-16, -63); ctx.lineTo(0, -76); ctx.lineTo(18, -63); ctx.lineTo(0, -66); ctx.fill(); ctx.strokeStyle = '#d9b45f'; ctx.lineWidth = 1.5; ctx.stroke(); }
        else if (L.hat === 'bicorne') { ctx.beginPath(); ctx.ellipse(1, -67, 18, 7, 0, Math.PI, 0); ctx.fill(); }
        else if (L.hat === 'bandana') { ctx.beginPath(); ctx.arc(1, -60, 12, Math.PI, 0); ctx.fill(); ctx.fillRect(-14, -60, 6, 12); }
        else if (L.hat === 'morion') { ctx.beginPath(); ctx.ellipse(1, -64, 17, 5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(1, -66, 9, Math.PI, 0); ctx.fill(); ctx.fillRect(0, -80, 2, 8); }
        else if (L.hat === 'cap') { ctx.beginPath(); ctx.arc(1, -62, 11, Math.PI, 0); ctx.fill(); }
        // 팔과 칼
        var ang, reach = 1;
        if (pose === 'windup') ang = f.move === 'thrust' ? -0.1 : f.move === 'bash' ? -2.2 : -1.6;
        else if (pose === 'lunge') ang = f.move === 'thrust' ? 0 : f.move === 'bash' ? -2.2 + k * 2.8 : -1.5 + k * 2.3;
        else if (pose === 'block') ang = -1.25;
        else if (pose === 'hit') ang = -0.4;
        else if (pose === 'shout') ang = -2.3;
        else if (pose === 'shoot') ang = -0.05;
        else if (pose === 'down' || pose === 'kneel') ang = 0.9;
        else if (pose === 'run') ang = 0.6;
        else ang = -0.55 + Math.sin(t * 2) * 0.05;
        if (pose === 'lunge' && f.move === 'thrust') reach = 1.35;
        ctx.save(); ctx.translate(4, -38); ctx.rotate(ang);
        ctx.strokeStyle = L.coat; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(26 * reach, 0); ctx.stroke();
        ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(28 * reach, 0, 4.5, 0, 7); ctx.fill();
        if (pose === 'shoot') { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(28, -4, 22, 6); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(24, 0, 8, 10); }
        else {
          var sty = f.style, bl = sty === 'thrust' ? 64 : sty === 'bash' ? 50 : 56;
          ctx.translate(28 * reach, 0);
          ctx.fillStyle = '#c8a040'; ctx.fillRect(-2, -7, 5, 14);                                  // 코등이
          ctx.strokeStyle = '#e8ecf2'; ctx.lineWidth = sty === 'thrust' ? 2.5 : 4.5; ctx.lineCap = 'butt';
          ctx.beginPath(); ctx.moveTo(2, 0);
          if (sty === 'slash') ctx.quadraticCurveTo(bl * 0.6, -6, bl, -14); else ctx.lineTo(bl, 0);
          ctx.stroke();
          if (sty === 'bash') { ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(bl - 18, -3); ctx.lineTo(bl + 6, -12); ctx.lineTo(bl + 6, 10); ctx.lineTo(bl - 18, 5); ctx.fill(); }
          if (sty === 'thrust') { ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 7, -1.2, 1.2); ctx.stroke(); }
        }
        ctx.restore();
        // 뒤쪽 팔 (찌르기 자세는 뒤로 든다)
        ctx.strokeStyle = L.coat; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-6, -38);
        if (f.style === 'thrust' && pose !== 'down' && pose !== 'kneel') ctx.lineTo(-24, -58); else ctx.lineTo(-14, -14);
        ctx.stroke();
        ctx.restore();
        if (f.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,200,170,' + f.flash + ')'; ctx.beginPath(); ctx.ellipse(0, -60, 30, 60, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
        ctx.restore();
      }
      function draw() {
        var now = performance.now(), t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
        [me, en].forEach(function (f) { if (f.flash > 0) f.flash = Math.max(0, f.flash - dt * 3); if (f.poseT > 0) { f.poseT -= dt; f.pt = Math.min(1, f.pt + dt / Math.max(0.05, f.poseDur || 0.3)); if (f.poseT <= 0 && f.pose !== 'down' && f.pose !== 'kneel' && f.pose !== 'run') { f.pose = 'idle'; } } if (f.pose === 'run') f.x -= dt * 260; if (f.tx != null) { f.x += (f.tx - f.x) * Math.min(1, dt * 10); } });
        cheer = cheer.map(function (c) { return Math.max(0, c - dt); });
        ctx.save();
        if (shakeT > 0 && G.Game.state.settings.shake !== false) ctx.translate(U.rf(-1, 1) * shakeT * D.shakeX, U.rf(-1, 1) * shakeT * D.shakeY);
        drawScene(t);
        var gy = H * 0.86;
        drawFighter(me, W / 2 - 160, gy, 1, t);
        drawFighter(en, W / 2 + 160, gy, -1, t);
        fx.forEach(function (e) {
          e.t += dt; var q = e.t / e.life; if (q < 0) return;
          if (e.kind === 'spark') { ctx.strokeStyle = 'rgba(255,240,180,' + (1 - q) + ')'; ctx.lineWidth = 2.5; for (var i = 0; i < 8; i++) { var a = i / 8 * 6.28 + e.seed; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * 5, e.y + Math.sin(a) * 5); ctx.lineTo(e.x + Math.cos(a) * (12 + q * 30), e.y + Math.sin(a) * (12 + q * 30)); ctx.stroke(); } }
          else if (e.kind === 'hitParticle') { ctx.fillStyle = 'rgba(' + e.col + ',' + (1 - q) + ')'; ctx.beginPath(); ctx.arc(e.x + e.vx * e.t, e.y + e.vy * e.t + 90 * e.t * e.t, e.r * (1 - q * 0.55), 0, 7); ctx.fill(); }
          else if (e.kind === 'slashArc') { ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - q)) + ')'; ctx.lineWidth = 6 * (1 - q) + 1; ctx.beginPath(); ctx.arc(e.x, e.y, 62, e.a0, e.a0 + e.dir * (1.6 * Math.min(1, q * 3)), e.dir < 0); ctx.stroke(); }
          else if (e.kind === 'num') { ctx.font = '800 ' + (e.big ? 34 : 26) + 'px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,' + (1 - q) + ')'; ctx.strokeText(e.text, e.x, e.y - q * 46); ctx.fillStyle = 'rgba(' + e.col + ',' + (1 - q) + ')'; ctx.fillText(e.text, e.x, e.y - q * 46); }
          else if (e.kind === 'bubble') { var al = q < 0.1 ? q * 10 : q > 0.85 ? (1 - q) / 0.15 : 1; ctx.font = '800 20px ' + getComputedStyle(document.body).fontFamily; var tw = ctx.measureText(e.text).width + 24; ctx.fillStyle = 'rgba(255,250,236,' + al * 0.95 + ')'; ctx.strokeStyle = 'rgba(40,24,10,' + al + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(e.x - tw / 2, e.y - 40, tw, 32); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.x - 8, e.y - 8); ctx.lineTo(e.x, e.y + 6); ctx.lineTo(e.x + 8, e.y - 8); ctx.fill(); ctx.fillStyle = 'rgba(40,20,8,' + al + ')'; ctx.textAlign = 'center'; ctx.fillText(e.text, e.x, e.y - 17); }
          else if (e.kind === 'banner') { var ab = q < 0.12 ? q / 0.12 : q > 0.75 ? (1 - q) / 0.25 : 1; ctx.font = '800 40px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(20,10,0,' + ab + ')'; ctx.strokeText(e.text, W / 2, 62); ctx.fillStyle = 'rgba(255,222,130,' + ab + ')'; ctx.fillText(e.text, W / 2, 62); if (e.sub) { ctx.font = '700 18px ' + getComputedStyle(document.body).fontFamily; ctx.lineWidth = 4; ctx.strokeText(e.sub, W / 2, 90); ctx.fillStyle = 'rgba(255,240,210,' + ab + ')'; ctx.fillText(e.sub, W / 2, 90); } }
          else if (e.kind === 'smoke') { ctx.fillStyle = 'rgba(230,230,225,' + 0.6 * (1 - q) + ')'; ctx.beginPath(); ctx.arc(e.x + q * 20 * e.d, e.y - q * 16, 8 + q * 24, 0, 7); ctx.fill(); }
          else if (e.kind === 'flashS') { ctx.fillStyle = 'rgba(255,230,140,' + (1 - q) + ')'; ctx.beginPath(); ctx.arc(e.x, e.y, 10 + q * 8, 0, 7); ctx.fill(); }
        });
        fx = fx.filter(function (e) { return e.t < e.life; });
        if (shakeT > 0) shakeT = Math.max(0, shakeT - dt * D.shakeDecay);
        ctx.restore();
        if (screenFlash > 0 && G.Game.state.settings.shake !== false) { ctx.fillStyle = 'rgba(' + screenFlashRgb + ',' + screenFlash + ')'; ctx.fillRect(0, 0, W, H); }
        if (screenFlash > 0) screenFlash = Math.max(0, screenFlash - dt * D.flashDecay);
      }
      (function loop() { if (!live) return; draw(); requestAnimationFrame(loop); })();

      // ------------------------------------------------ 연출 도우미
      function sleep(ms) { return new Promise(function (r) { setTimeout(r, fast ? ms * 0.5 : ms); }); }
      function pose(f, name, dur) { f.pose = name; f.pt = 0; f.poseT = dur || 0.35; f.poseDur = dur || 0.35; }
      function posX(f) { return f === me ? W / 2 - 160 : W / 2 + 160; }
      function banner(text, sub) { fx = fx.filter(function (e) { return e.kind !== 'banner'; }); fx.push({ kind: 'banner', text: text, sub: sub, t: 0, life: 1.5 }); }
      function bubble(f, text) { fx.push({ kind: 'bubble', text: text, x: posX(f) + f.x * (f === me ? 1 : -1), y: H * 0.86 - 190, t: 0, life: 1.6 }); }
      function num(f, text, col, big) { fx.push({ kind: 'num', text: text, col: col || '255,236,160', big: big, x: posX(f) + U.rf(-12, 12), y: H * 0.86 - 170, t: 0, life: 1.1 }); }
      function hurt(f, d, big) {
        d = Math.max(1, Math.round(d)); f.hp = Math.max(0, f.hp - d); f.flash = 0.9; pose(f, 'hit', 0.3); f.tx = -D.knockback; setTimeout(function () { f.tx = 0; }, D.knockReturnMs);
        num(f, '−' + d, f === me ? '255,140,120' : '255,236,160', big); shakeT = Math.min(1, shakeT + (big ? D.shakeBig : D.shakeHit));
        screenFlash = Math.max(screenFlash, big ? D.flashBig : f === me ? D.flashTaken : D.flashHit); screenFlashRgb = f === me ? '255,120,100' : '255,244,220';
        (f === me ? en : me).spirit = Math.min(100, (f === me ? en : me).spirit + 10); f.spirit = Math.min(100, f.spirit + 4);
        cheer[f === me ? 1 : 0] = 1.2;
        return d;
      }
      function other(f) { return f === me ? en : me; }
      function stK(f, key) { if (f !== me || !stance) return 1; return STANCE[stance][key]; }

      // ------------------------------------------------ 한 합
      function hitChance(a, b, adv) {
        var c = 0.62 + (a.sword - b.sword) * 0.06 + (a.might - b.might) / 250 + adv * 0.15;
        if (b === me && stance === 'guard') c -= 0.12;
        if (a === en && flags.bluffEn > 0) c -= 0.3;
        return U.clamp(c, 0.15, 0.95);
      }
      function dmgOf(a, b, adv, k) {
        var d = (6 + a.might * 0.12 + a.sword * 2.5 + a.atk * 0.7) * stK(a, 'dmg') * (adv > 0 ? 1.35 : adv < 0 ? 0.75 : 1) * U.rf(0.85, 1.15) * (k || 1) - b.def * 0.5;
        d *= b === me && stance ? STANCE[stance].taken : 1;
        return Math.max(1, d);
      }
      function advOf(m1, m2) { return BEATS[m1] === m2 ? 1 : BEATS[m2] === m1 ? -1 : 0; }
      /** 공격 하나 (그림과 함께). 맞히면 true */
      async function strike(a, mv, opts) {
        opts = opts || {};
        var b = other(a), adv = opts.noAdv ? 0 : advOf(mv, b.move || b.style);
        a.move = mv; pose(a, 'windup', 0.18); await sleep(170);
        pose(a, 'lunge', 0.3); a.tx = 70; if (G.Audio) G.Audio.sfx('sword');
        var hx = W / 2 + (a === me ? 60 : -60);
        if (mv === 'slash' || mv === 'bash') fx.push({ kind: 'slashArc', x: hx + (a === me ? -20 : 20), y: H * 0.86 - 120, a0: a === me ? -1.9 : -1.2, dir: a === me ? 1 : -1, t: 0, life: 0.3 });
        await sleep(140);
        var hc = opts.sure ? 1 : hitChance(a, b, adv) + (opts.hitK || 0);
        var ok = b.stun > 0 || U.chance(hc);
        if (ok) {
          var h = dmgOf(a, b, adv, opts.k), crit = !opts.noCrit && U.chance(0.05 + a.sword * 0.03);
          if (crit) h *= 1.6;
          if (opts.ignoreArmor) h += b.def * 0.5;
          fx.push({ kind: 'spark', x: hx, y: H * 0.86 - 110, seed: U.rand() * 6, t: 0, life: 0.4 });
          for (var hp = 0; hp < D.hitParticles; hp++) fx.push({ kind: 'hitParticle', x: hx + U.rf(-5, 5), y: H * 0.86 - 110 + U.rf(-5, 5), vx: U.rf(-75, 75), vy: U.rf(-95, 20), r: U.rf(1.5, 3.8), col: U.chance(0.55) ? '255,226,130' : '210,70,45', t: 0, life: D.particleLife });
          hurt(b, h, crit || opts.big);
          if (crit) bubble(a, '일섬!');
        } else {
          pose(b, 'block', 0.3); fx.push({ kind: 'spark', x: hx - (a === me ? 20 : -20), y: H * 0.86 - 122, seed: U.rand() * 6, t: 0, life: 0.35 });
          b.spirit = Math.min(100, b.spirit + 6); num(b, '막음', '200,220,255');
        }
        setTimeout(function () { a.tx = 0; }, 180);
        await sleep(300);
        return { ok: ok, adv: adv };
      }
      function pickEnemyMove() {
        var rec = myHist.slice(-3), cnt = {}; rec.forEach(function (m) { cnt[m] = (cnt[m] || 0) + 1; });
        var fav = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
        if (fav && U.chance(0.2 + en.sword * 0.1)) return COUNTER[fav];
        return U.chance(0.5) ? en.style : U.pick(['slash', 'thrust', 'bash']);
      }
      var myHist = [];
      function prepareIntent() {
        enIntent = pickEnemyMove();
        intentSeen = U.chance(0.4 + me.sword * 0.14);
        var iEl = el.querySelector('.intent');
        iEl.innerHTML = intentSeen ? '— 상대가 <b>' + MOVE[enIntent] + '</b>' + U.jx(MOVE[enIntent], '을/를') + ' 노리는 듯하다 → <b>' + MOVE[COUNTER[enIntent]] + '</b>' + U.jx(MOVE[COUNTER[enIntent]], '이/가') + ' 유리' : '— 상대의 수가 읽히지 않는다';
        moveBtns();
      }
      function myMove() {
        if (myNext !== 'auto') return myNext;
        return intentSeen ? COUNTER[enIntent] : me.style;
      }
      /** 보통 합: 먼저 치는 쪽이 치고, 버티면 받아친다 */
      async function exchange() {
        var mv = myMove(), emv = enIntent || en.style;
        myHist.push(mv); me.move = mv; en.move = emv;
        var ini = me.might * 0.5 + me.sword * 10 + U.rf(0, 25) + (flags.first ? 60 : 0), eni = en.might * 0.5 + en.sword * 10 + U.rf(0, 25);
        var order = ini >= eni ? [me, en] : [en, me];
        var firstHit = false;
        say('제 ' + (round + 1) + ' 합 — ' + (me.m ? U.esc(me.name) : '나') + ': <b>' + MOVE[mv] + '</b> · ' + U.esc(en.name) + ': <b>' + MOVE[emv] + '</b>' + (advOf(mv, emv) > 0 ? ' <span class="good-text">상성 유리!</span>' : advOf(mv, emv) < 0 ? ' <span class="warn-text">상성 불리</span>' : ''));
        for (var i = 0; i < 2; i++) {
          var a = order[i], b = other(a);
          if (a.hp <= 0 || b.hp <= 0) break;
          if (a.stun > 0) { a.stun--; bubble(a, '...!'); await sleep(300); continue; }
          if (a === en && flags.lureEn) { flags.lureEn = false; continue; }
          if (a === en && flags.feintMe) {                                   // 거짓퇴각에 걸려 헛친다
            flags.feintMe = false; a.move = emv; pose(a, 'lunge', 0.3); a.tx = 90; await sleep(260); a.tx = 0; num(a, '헛침', '220,220,220');
            await strike(me, mv, { k: 1.5, sure: true, big: true }); continue;
          }
          var k = 1;
          if (i === 1 && firstHit && flags.first && a === en) k = 0.5;
          var r = await strike(a, a === me ? mv : emv, { k: k, hitK: a === me && flags.first ? 0.25 : 0 });
          if (i === 0 && r.ok) firstHit = true;
        }
        flags.first = false;
        if (flags.bluffEn > 0) flags.bluffEn--;
        me.spirit = Math.min(100, me.spirit + 3); en.spirit = Math.min(100, en.spirit + 3);
      }

      // ------------------------------------------------ 기술
      function techOk(tc, f) {
        f = f || me; var o = other(f);
        if (f.used[tc.id] && tc.once) return false;
        if (f.spirit < tc.cost) return false;
        if (tc.id === 'deathblow') return o.hp <= o.maxHp * 0.45 || f.might >= 80;
        if (tc.id === 'capture') return o.hp <= o.maxHp * (f === me && stance === 'capture' ? 0.4 : 0.35);
        if (tc.id === 'persuade') return o.hp <= o.maxHp * 0.5 || o.spirit <= 20;
        if (tc.id === 'swap') return f === me && !opt.noSwap && !swapped && !!swapCandidate(me);
        return true;
      }
      async function useTech(id, f) {
        f = f || me; var o = other(f), tc = TECH.filter(function (x) { return x.id === id; })[0];
        f.spirit -= tc.cost; f.used[id] = (f.used[id] || 0) + 1;
        var who = f === me ? (me.m ? U.esc(me.name) : '제독') : U.esc(en.name);
        banner(tc.name, (f === me ? '' : U.esc(en.name) + ' — ') + tc.en);
        await sleep(350);
        var pr = function (base) { return U.clamp(base, 0.05, 0.95); };
        if (id === 'deathblow') {
          var p1 = pr(0.3 + (power(f) - power(o)) / 150 + (1 - o.hp / o.maxHp) * 0.35 + (f === me && stance === 'allout' ? 0.1 : 0));
          f.move = f.style; pose(f, 'windup', 0.35); await sleep(380); pose(f, 'lunge', 0.35); f.tx = 90; if (G.Audio) G.Audio.sfx('cannon');
          fx.push({ kind: 'slashArc', x: W / 2, y: H * 0.86 - 120, a0: -2.2, dir: f === me ? 1 : -1, t: 0, life: 0.45 });
          await sleep(200);
          if (U.chance(p1)) { fx.push({ kind: 'spark', x: W / 2, y: H * 0.86 - 110, seed: 1, t: 0, life: 0.6 }); hurt(o, Math.max(o.hp, o.maxHp * 0.6), true); say(who + '의 일격필살! 단칼에 베어 넘겼다!'); }
          else { pose(o, 'block', 0.3); num(o, '빗나감', '220,220,220'); say(who + '의 일격필살이 빗나갔다! 크게 빈틈을 드러냈다.'); setTimeout(function () { f.tx = 0; }, 200); await sleep(300); await strike(o, o.style, { k: 1.4, sure: true, big: true }); }
          f.tx = 0;
        } else if (id === 'first') { flags.first = f === me; bubble(f, '먼저 간다!'); say(who + U.jx(f === me && !me.m ? '제독' : f.name, '이/가') + ' 칼끝을 겨누며 선수를 노린다.'); if (f === en) { var r0 = await strike(en, en.style, { hitK: 0.25 }); } }
        else if (id === 'flank') { f.tx = 40; await sleep(150); await strike(f, f.style, { noAdv: true, k: 1.3, hitK: 0.2, ignoreArmor: true }); say(who + U.jx(f === me && !me.m ? '제독' : f.name, '이/가') + ' 옆으로 돌아 파고들었다!'); }
        else if (id === 'capture') {
          var p2 = pr(0.35 + (f.might - o.might) / 120 + (f === me && stance === 'capture' ? 0.2 : 0) + (1 - o.hp / o.maxHp) * 0.3);
          f.move = 'bash'; pose(f, 'lunge', 0.3); f.tx = 80; await sleep(300);
          if (U.chance(p2)) { fx.push({ kind: 'spark', x: W / 2 + 60, y: H * 0.86 - 120, seed: 2, t: 0, life: 0.5 }); pose(o, 'kneel', 5); bubble(o, '크윽... 졌다'); say(who + U.jx(f === me && !me.m ? '제독' : f.name, '이/가') + ' 칼을 쳐 떨어뜨리고 ' + U.esc(o.name) + U.jx(o.name, '을/를') + ' 사로잡았다!'); f.tx = 0; end(f === me ? 'capture' : 'captured'); return 'end'; }
          say('생포에 실패했다! ' + U.esc(o.name) + U.jx(o.name, '이/가') + ' 뿌리치고 받아친다.'); f.tx = 0; await sleep(200); await strike(o, o.style, { k: 1.2 });
        } else if (id === 'feint') {
          var p3 = pr(0.5 + (f.int - o.int) / 150); f.tx = -60; pose(f, 'run', 0.25); await sleep(260); f.pose = 'idle'; f.tx = 0;
          if (U.chance(p3)) { if (f === me) flags.feintMe = true; else flags.feintEn = true; bubble(o, '거기 서라!'); say(U.esc(o.name) + U.jx(o.name, '이/가') + ' 물러서는 척에 속아 쫓아온다 — 다음에 헛친다!'); }
          else { f.spirit = Math.max(0, f.spirit - 10); o.spirit = Math.min(100, o.spirit + 10); say(U.esc(o.name) + U.jx(o.name, '은/는') + ' 속지 않았다.'); }
        } else if (id === 'secret') {
          var gun = f === me ? f.shoot >= 1 : (en.look === 'pirate' || en.look === 'captain') && U.chance(0.6);
          pose(f, 'shoot', 0.5); await sleep(200);
          if (gun) { fx.push({ kind: 'flashS', x: posX(f) + (f === me ? 60 : -60), y: H * 0.86 - 56, t: 0, life: 0.2 }); for (var sm = 0; sm < 3; sm++) fx.push({ kind: 'smoke', x: posX(f) + (f === me ? 66 : -66), y: H * 0.86 - 56, d: f === me ? 1 : -1, t: -sm * 0.05, life: 1.4 }); if (G.Audio) G.Audio.sfx('cannon'); }
          await sleep(150);
          var dd = o.maxHp * U.rf(gun ? 0.22 : 0.16, gun ? 0.3 : 0.22);
          hurt(o, dd, true); result.secret = result.secret || f === me;
          bubble(o, gun ? '비겁한 놈!' : '단검이라니!'); say(who + U.jx(f === me && !me.m ? '제독' : f.name, '이/가') + ' 품에서 ' + (gun ? '권총을 꺼내 쏘았다!' : '단검을 던졌다!') + ' 구경꾼들이 야유한다.');
          cheer[f === me ? 0 : 1] = 0; cheer[f === me ? 1 : 0] = 1.5;
        } else if (id === 'lure') {
          var p4 = pr(0.45 + (f.int - o.int) / 150 + (place === 'deck' ? 0.08 : 0));
          f.tx = -30; await sleep(200); f.tx = 0;
          if (U.chance(p4)) { o.stun = 1; o.spirit = Math.max(0, o.spirit - 10); pose(o, 'hit', 0.5); bubble(o, place === 'deck' ? '으악, 밧줄이!' : '어이쿠!'); say(U.esc(o.name) + U.jx(o.name, '이/가') + (place === 'deck' ? ' 젖은 갑판에 미끄러져 밧줄에 걸려 넘어졌다!' : ' 의자에 걸려 넘어졌다!') + ' (한 합 쉰다)'); }
          else say(U.esc(o.name) + U.jx(o.name, '은/는') + ' 유인에 넘어가지 않았다.');
        } else if (id === 'swap') {
          var nf = swapCandidate(me); swapped = true; result.swapped = nf.m || 'admiral';
          var oldM = me.m;
          me.tx = -200; pose(me, 'run', 0.6); await sleep(500);
          // 물러난 사람: 다친 만큼 기록
          if (oldM) { if (me.hp < me.maxHp * 0.5) oldM.hurt = G.Game.state.day + 10; }
          else G.Game.state.player.hp = U.clamp(Math.round(100 * me.hp / me.maxHp), 5, 100);
          var keep = { spirit: Math.max(20, me.spirit * 0.5), used: me.used };
          Object.keys(me).forEach(function (kk) { if (kk !== 'side') delete me[kk]; });
          Object.assign(me, nf, { side: 'me', spirit: keep.spirit, used: keep.used, x: -200, tx: 0, pose: 'idle', pt: 0, stun: 0, dizzy: 0, flash: 0,
            sprite: null, spriteImg: null, spriteId: null });
          fighterSprite(me);
          if (me.hp == null) me.hp = me.maxHp;
          result.mate = nf.m || null;
          setPortrait(me, '.rd-side.me'); bubble(me, '제가 상대하겠습니다!');
          say('<b>' + U.esc(nf.name) + '</b>' + U.jx(nf.name, '이/가') + ' 대신 나섰다! (무력 ' + nf.might + ' · 검술 ' + nf.sword + ')');
          await sleep(500);
        } else if (id === 'persuade') {
          var p5 = pr(0.2 + (f.cha - 50) / 150 + (f.speech || 0) * 0.1 + (1 - o.hp / o.maxHp) * 0.3 - (o.look === 'rival' ? 0.15 : 0));
          pose(f, 'shout', 0.6); bubble(f, U.pick(['칼을 거두시오! 더 피를 볼 것 없소.', '이만하면 됐소. 항복하시오.', '당신 같은 사람을 잃기는 아깝소.']));
          await sleep(900);
          if (U.chance(p5)) { pose(o, 'kneel', 5); bubble(o, '...알았다. 내가 졌소.'); say(U.esc(o.name) + U.jx(o.name, '이/가') + ' 칼을 내려놓았다!'); end(f === me ? 'persuade' : 'persuaded'); return 'end'; }
          o.spirit = Math.min(100, o.spirit + 25); bubble(o, '웃기지 마라!'); say('설득이 먹히지 않았다. ' + U.esc(o.name) + U.jx(o.name, '이/가') + ' 더욱 격앙했다! (상대 기세 +25)');
        } else if (id === 'bluff') {
          var p6 = pr(0.45 + (f.int - o.int) / 120);
          pose(f, 'shout', 0.6); bubble(f, place === 'deck' ? U.pick(['네 배에 불이 붙었다!', '저기 해군이 온다!', '네 부하들이 달아난다!']) : U.pick(['경비대가 온다!', '네 지갑이 없어졌다!']));
          await sleep(800);
          if (U.chance(p6)) { o.spirit = Math.max(0, o.spirit - 30); if (f === me) flags.bluffEn = 2; pose(o, 'hit', 0.5); bubble(o, '뭐, 뭐라고?!'); say(U.esc(o.name) + U.jx(o.name, '이/가') + ' 허보에 흔들렸다! (기세 −30, 두 합 동안 덜 맞힌다)'); }
          else { bubble(o, '어림없다!'); say(U.esc(o.name) + U.jx(o.name, '은/는') + ' 흔들리지 않았다.'); }
        } else if (id === 'roar') {
          var p7 = pr(0.4 + (f.might + f.cha - o.might - o.int) / 250);
          pose(f, 'shout', 0.7); bubble(f, U.pick(['물러서라!!', '덤벼라, 이 겁쟁이!', '누구 앞이라고!']));
          shakeT = 0.5; await sleep(700);
          if (U.chance(p7)) {
            if (o.hp <= o.maxHp * 0.25 && f === me) { pose(o, 'run', 3); bubble(o, '히익!'); say(U.esc(o.name) + U.jx(o.name, '이/가') + ' 호통에 겁을 먹고 달아났다!'); await sleep(700); end('rout'); return 'end'; }
            o.stun = 1; o.spirit = Math.max(0, o.spirit - 20); bubble(o, '...!'); say(U.esc(o.name) + U.jx(o.name, '이/가') + ' 호통에 얼어붙었다! (한 합 쉰다, 기세 −20)');
          } else { f.spirit = Math.max(0, f.spirit - 5); say(U.esc(o.name) + U.jx(o.name, '은/는') + ' 코웃음을 쳤다.'); }
        } else if (id === 'special') {
          var sp = SPECIAL[f.style]; banner(sp[0] + '!', sp[1] + ' — ' + sp[2]);
          if (f.style === 'slash') { for (var h3 = 0; h3 < 3 && o.hp > 0; h3++) await strike(f, 'slash', { k: 0.75, sure: !(o === me && stance === 'guard' && U.chance(0.3)), noAdv: true, big: h3 === 2 }); }
          else if (f.style === 'thrust') await strike(f, 'thrust', { k: 2.4, sure: true, noAdv: true, ignoreArmor: true, big: true });
          else { await strike(f, 'bash', { k: 2.0, sure: !(o === me && stance === 'guard' && U.chance(0.3)), noAdv: true, big: true }); if (o.hp > 0) { o.stun = 1; say(U.esc(o.name) + U.jx(o.name, '이/가') + ' 비틀거린다!'); } }
          f.tx = 0;
        }
        bars();
        return null;
      }
      /** 상대(적)가 기술을 쓸까 */
      function enemyTech() {
        var cands = [];
        if (techOk(TECH[11], en)) cands.push(['special', 1]);
        if (techOk(TECH[0], en) && me.hp <= me.maxHp * 0.35) cands.push(['deathblow', 0.6]);
        if (techOk(TECH[10], en) && U.chance(0.25)) cands.push(['roar', 0.35]);
        if (techOk(TECH[1], en) && U.chance(0.2)) cands.push(['first', 0.3]);
        if (techOk(TECH[4], en) && U.chance(0.12)) cands.push(['feint', 0.3]);
        if (en.look === 'pirate' && !en.used.secret && en.hp < en.maxHp * 0.4 && U.chance(0.35)) cands.push(['secret', 0.5]);
        for (var i = 0; i < cands.length; i++) if (U.chance(cands[i][1])) return cands[i][0];
        return null;
      }

      // ------------------------------------------------ 흐름
      var queued = null, timer = null;
      async function step() {
        if (over || busy || paused || !stance) return;
        busy = true; clearTimeout(timer);
        try {
          var r = null;
          if (queued) { var q = queued; queued = null; r = await useTech(q); }
          else {
            var et = enemyTech();
            if (et) {
              // 적의 기술: 거짓퇴각은 제독 쪽 다음 공격을 헛치게
              if (et === 'feint') { banner('거짓퇴각', U.esc(en.name) + ' — Retreat feint'); en.spirit -= 15; en.used.feint = 1; en.tx = -60; pose(en, 'run', 0.25); await sleep(260); en.tx = 0; if (U.chance(0.5 + (en.int - me.int) / 150)) { say(U.esc(en.name) + U.jx(en.name, '이/가') + ' 물러서는 척한다 — 쫓아 들어가다 헛쳤다!'); pose(me, 'lunge', 0.3); me.tx = 90; await sleep(260); me.tx = 0; await strike(en, en.style, { k: 1.4, sure: true, big: true }); } else say(U.esc(en.name) + '의 거짓퇴각을 알아챘다.'); }
              else r = await useTech(et, en);
            } else await exchange();
          }
          if (r) return;
          round++; bars();
          if (en.hp <= 0) return end(stance === 'capture' ? 'capture' : 'ko');
          if (stance === 'capture' && en.hp <= en.maxHp * 0.15 && me.hp > 0) { pose(en, 'kneel', 5); bubble(en, '그, 그만! 항복한다!'); say(U.esc(en.name) + U.jx(en.name, '이/가') + ' 무릎을 꿇었다 — 사로잡았다!'); await sleep(500); return end('capture'); }
          if (me.hp <= 0) return end('lose');
          prepareIntent(); techBtns();
        } catch (e) { console.error(e); }
        busy = false;
        schedule();
      }
      function schedule() { clearTimeout(timer); if (!over && !paused && stance) timer = setTimeout(step, fast ? 650 : 1400); }
      function end(how) {
        if (over) return; over = true; clearTimeout(timer); busy = true;
        var winHow = { ko: 1, capture: 1, persuade: 1, rout: 1 };
        var res = winHow[how] ? 'win' : how === 'flee' ? 'flee' : 'lose';
        result.how = how === 'captured' || how === 'persuaded' ? 'lose' : how; result.stance = stance;
        if (res === 'win') { if (how === 'ko') { pose(en, 'down', 5); } cheer[0] = 3; banner({ ko: '승리!', capture: '생포!', persuade: '설득 성공!', rout: '상대가 달아났다!' }[how]); }
        else if (res === 'lose') { pose(me, how === 'captured' || how === 'persuaded' ? 'kneel' : 'down', 5); cheer[1] = 3; banner('패배...'); }
        else banner('물러섰다');
        if (!me.m && me.admiral) p.hp = U.clamp(Math.round(100 * me.hp / me.maxHp), 5, 100);
        say(res === 'win' ? '<span class="good-text">' + ({ ko: U.esc(en.name) + U.jx(en.name, '이/가') + ' 쓰러졌다!', capture: U.esc(en.name) + U.jx(en.name, '을/를') + ' 사로잡았다!', persuade: U.esc(en.name) + U.jx(en.name, '이/가') + ' 칼을 거두었다!', rout: U.esc(en.name) + U.jx(en.name, '이/가') + ' 달아났다!' }[how]) + '</span>'
          : res === 'lose' ? '<span class="warn-text">' + (me.m ? U.esc(me.name) + U.jx(me.name, '이/가') : '제독이') + ' 쓰러지고 말았다...</span>' : '싸움을 피해 물러섰다.');
        el.querySelector('.rd-ctrl').classList.add('done');
        setTimeout(function () { live = false; win.close(res); if (G.Audio) G.Audio.music(G.Game.sceneName === 'sea' || G.Game.sceneName === 'battle' ? 'sea' : 'town'); resolve(res); }, opt.fastEnd ? 60 : 1900);
      }

      // ------------------------------------------------ 조작
      function moveBtns() {
        var row = el.querySelector('.rd-moves .row'); row.innerHTML = '';
        [['auto', '자동'], ['slash', '베기'], ['thrust', '찌르기'], ['bash', '치기']].forEach(function (m, i) {
          var good = m[0] !== 'auto' && intentSeen && COUNTER[enIntent] === m[0];
          var b = U.el('button', 'btn small' + (myNext === m[0] ? ' on' : '') + (good ? ' good' : ''), (i ? i + ' ' : '') + m[1] + (m[0] === me.style ? ' <small>장기</small>' : '') + (m[0] !== 'auto' ? ' <small class="en">' + MOVE_EN[m[0]] + '</small>' : ''));
          b.title = m[0] === 'auto' ? '읽히면 상성으로, 아니면 장기로 친다' : MOVE[m[0]] + ' — ' + MOVE[BEATS[m[0]]] + U.jx(MOVE[BEATS[m[0]]], '을/를') + ' 이기고 ' + MOVE[COUNTER[m[0]]] + '에 진다';
          b.onclick = function () { myNext = m[0]; moveBtns(); };
          row.appendChild(b);
        });
      }
      function techBtns() {
        var grid = el.querySelector('.rd-techs .grid'); grid.innerHTML = '';
        TECH.forEach(function (tc) {
          var ok = techOk(tc) && !over, lbl = tc.name;
          var b = U.el('button', 'btn small tech' + (queued === tc.id ? ' on' : '') + (ok ? '' : ' disabled'), lbl + (tc.cost ? '<i>' + tc.cost + '</i>' : '<i>1회</i>'));
          b.title = tc.name + ' (' + tc.en + ') — ' + tc.tip + (tc.id === 'special' ? ' 지금: 「' + SPECIAL[me.style][0] + '」 — ' + SPECIAL[me.style][2] : '') + (tc.id === 'swap' && swapCandidate(me) ? ' 나설 사람: ' + swapCandidate(me).name : '');
          if (!ok) b.disabled = true;
          b.onclick = function () { if (!techOk(tc)) return; queued = queued === tc.id ? null : tc.id; techBtns(); if (!busy) { clearTimeout(timer); step(); } };
          grid.appendChild(b);
        });
      }
      function sysBtns() {
        var sys = el.querySelector('.rd-sys'); sys.innerHTML = '';
        var pb = U.el('button', 'btn small ghost', paused ? '계속 (Space)' : '멈춤 (Space)'); pb.onclick = function () { paused = !paused; sysBtns(); if (!paused) schedule(); else clearTimeout(timer); }; sys.appendChild(pb);
        var fb = U.el('button', 'btn small ghost' + (fast ? ' on' : ''), '빠르게'); fb.onclick = function () { fast = !fast; sysBtns(); }; sys.appendChild(fb);
        var fl = U.el('button', 'btn small ghost', '물러선다 (Esc)');
        if (stance === 'allout') { fl.classList.add('disabled'); fl.title = '결사돌진이라 물러설 수 없다'; }
        fl.onclick = async function () {
          if (over || busy || stance === 'allout') return;
          if (!stance) return end('flee');
          busy = true; clearTimeout(timer);
          if (stance === 'guard' || U.chance(0.6)) { me.tx = -200; pose(me, 'run', 1); await sleep(500); busy = false; return end('flee'); }
          say('물러서지 못했다! 등 뒤를 노린다!'); await strike(en, en.style, { k: 1.2 }); busy = false; bars();
          if (me.hp <= 0) return end('lose'); schedule();
        };
        sys.appendChild(fl);
      }
      /** 싸우기 전에 방침을 고른다 */
      function stancePanel() {
        var box = el.querySelector('.rd-stance');
        box.innerHTML = '<div class="st-h">방침을 고르십시오</div><div class="st-cmp">' +
          '<div><b>' + U.esc(me.name) + '</b> 무력 ' + me.might + ' · 검술 ' + me.sword + ' · 공격 ' + me.atk + ' · 방어 ' + me.def + ' · 장기 ' + MOVE[me.style] + '</div>' +
          '<div><b>' + U.esc(en.name) + '</b> 무력 ' + en.might + ' · 검술 ' + en.sword + ' · 공격 ' + en.atk + ' · 방어 ' + en.def + ' · 장기 ' + MOVE[en.style] + '</div></div><div class="st-row"></div>';
        var row = box.querySelector('.st-row');
        Object.keys(STANCE).forEach(function (k, i) {
          var S2 = STANCE[k], b = U.el('button', 'btn st-btn' + (k === 'allout' ? ' red' : k === 'guard' ? ' navy' : ''), '<b>' + (i + 1) + '. ' + S2.name + '</b><small>' + S2.en + '</small><span>' + S2.desc + '</span>');
          b.onclick = function () { chooseStance(k); };
          row.appendChild(b);
        });
      }
      function chooseStance(k) {
        if (stance) return;
        stance = k; me.spirit = Math.min(100, me.spirit + STANCE[k].spirit);
        el.querySelector('.rd-stance').classList.add('gone');
        banner(STANCE[k].name, STANCE[k].en);
        say('방침: <b>' + STANCE[k].name + '</b> — ' + STANCE[k].desc);
        bars(); prepareIntent(); techBtns(); sysBtns();
        timer = setTimeout(step, 1100);
      }
      var unkey = UI.pushKey(function (e) {
        if (over) return false;
        var n = parseInt(e.key, 10);
        if (!stance) { if (n >= 1 && n <= 4) { chooseStance(Object.keys(STANCE)[n - 1]); return true; } if (e.key === 'Escape') { end('flee'); return true; } return false; }
        if (n >= 0 && n <= 3) { myNext = ['auto', 'slash', 'thrust', 'bash'][n]; moveBtns(); return true; }
        if (e.key === ' ') { el.querySelector('.rd-sys .btn').click(); return true; }
        if (e.key === 'Escape') { el.querySelectorAll('.rd-sys .btn')[2].click(); return true; }
        return false;
      });
      win.result.then(function () { live = false; unkey(); clearTimeout(timer); });
      G.Games._duelDebug = { me: me, en: en, flags: flags, choose: chooseStance, use: async function (id) { for (var i = 0; i < 200 && busy && !over; i++) await new Promise(function (r) { setTimeout(r, 30); }); if (over) return; queued = id; clearTimeout(timer); await step(); for (var j = 0; j < 200 && busy && !over; j++) await new Promise(function (r) { setTimeout(r, 30); }); }, step: step, techOk: function (id) { return techOk(TECH.filter(function (x) { return x.id === id; })[0]); }, get over() { return over; }, set fast(v) { fast = v; } };
      bars(); stancePanel(); moveBtns(); techBtns(); sysBtns();
      if (opt.stance) chooseStance(opt.stance);
    });
  };
})(window.G = window.G || {});
