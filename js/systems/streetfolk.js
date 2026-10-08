/* 거리를 걷는 마을 사람 (G.StreetFolk) — 거리 화면(js/scenes/town.js)에서
   · 거리가 열릴 때와 건물에서 나올 때마다 그 도시에 맞는 사람 3~4명(G.FX.streetFolk.min~max)을 새로 뽑아 거리에 풀어 놓는다.
     도서관이 있는 도시에만 사서, 항구에만 항해사, 큰 도시에만 병사, 왕궁·저택이 있는 도시에만 귀족 청년. 짐승은 한 마리까지.
   · 저마다 걷다 서다 하며 거리를 오간다(속도·쉬는 시간 G.FX.streetFolk). 누르면 제독이 다가가 말을 건다.
   · 대화: 흔한 이야기(js/data/streetfolk.js) + 그 사람에게 맞는 쓸모 있는 이야기 — 시장 소식(js/systems/economy.js)·단서(이야기 갈래)·
     도서관의 책·여관값·후원자·다스리는 나라·바람과 계절풍·가까운 항구·도시의 볼거리. 쓸모 있는 이야기는 한 사람에게 한 번.
     말이 통하지 않으면 대화창이 알아듣는 만큼만 보여 준다(UI.garble — 포르투갈어가 통하는 항구도 R.cityLang으로).
   · 그림: images/street-folk/<종류>_<문화권>/walk_1… 또는 images/street-folk/<종류>/walk_1… 가 있으면 그 그림, 없으면 코드 그림(G.Art.drawFolk).
   · 저장하지 않는다 (나올 때마다 새로). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, A = G.Art;
  var SF = G.StreetFolk = {};
  function S() { return G.Game.state; }
  function D() { return G.STREET_FOLK; }
  function K() { return (G.FX && G.FX.streetFolk) || {}; }

  // ---------------------------------------------------------------- 뽑기
  function canHave(type, c) {
    var T = D().types[type]; if (!T) return false;
    var f = R.facilities(c);
    if (T.need === 'library') return !!f.library;
    if (T.need === 'port') return !!c.port;
    if (T.need === 'big') return c.size >= 2 || !!f.palace;
    if (T.need === 'court') return !!f.palace || (f.mansion && f.mansion.length > 0) || c.size >= 3;
    return true;
  }
  SF.types = function (c) { return Object.keys(D().types).filter(function (t) { return canHave(t, c); }); };
  /** 이번에 거리에 나올 사람들 — [{type, spec, x, y, dir, …}] */
  SF.spawn = function (c, streetW, heroX, ground, seed) {
    var k = K(), n = U.ri(k.min || 3, k.max || 4), pool = SF.types(c), out = [], cul = A.folkCulture ? A.folkCulture(c).cul : 'europe';
    var catW = cul === 'islam' || cul === 'eastasia' ? 1.6 : 0.8;   // 이슬람·동아시아 도시엔 고양이가 흔하다
    var animal = false, tries = 0;
    while (out.length < n && pool.length && tries++ < 40) {
      var t = U.weighted(pool, function (x) { var T = D().types[x]; return (T.w || 1) * (x === 'cat' ? catW : x === 'dog' ? 2 - catW * 0.6 : 1); });
      pool = pool.filter(function (x) { return x !== t; });
      if (D().types[t].animal) { if (animal) continue; animal = true; pool = pool.filter(function (x) { return !D().types[x].animal; }); }
      out.push(SF.make(t, c, streetW, heroX, ground, (seed || 0) + ':' + out.length + ':' + t + ':' + Math.floor(U.rng() * 1e6)));
    }
    // 서로·제독과 너무 붙지 않게 띄워 놓는다
    var lo = 120, hi = Math.max(lo + 200, streetW - 120);
    var near = Math.min(out.length, U.ri(1, 2));     // 한두 사람은 거리에 나서자마자 보이는 곳에
    out.forEach(function (f, i) {
      for (var j = 0; j < 12; j++) {
        var x = i < near ? U.clamp(heroX + (U.chance(0.5) ? -1 : 1) * U.rf(220, 640), lo, hi) : U.rf(lo, hi);
        if (Math.abs(x - heroX) > 170 && out.every(function (o, m) { return m >= i || Math.abs(o.x - x) > 140; })) { f.x = x; break; }
        f.x = x;
      }
      f.target = f.x;
    });
    SF.warm(out);
    return out;
  };
  /** 말을 걸었을 때 대화창에 설 무릎상(그 사람·제독)을 미리 받아 둔다 — 누르자마자 대화가 열리게 (기다리지 않음) */
  SF.warm = function (list) {
    var I = G.Img; if (!I || !I.count || !I.count() || !I.prefetchKeys) return;
    var keys = [];
    try {
      if (I.chain.heroHalf) keys = keys.concat(I.chain.heroHalf());
      (list || []).forEach(function (f) {
        if (f.face && f.face.half) {
          var own = I.pick(f.face.half); if (own) keys.push(own);
        }
        var p = f.face && f.face.portrait; if (!p || !A.portraitKeys || !I.chain.halfFor) return;
        var ch = I.chain.halfFor(A.portraitKeys(p)), k = I.pick(ch); if (k) keys.push(k);
      });
    } catch (e) { return; }
    I.prefetchKeys(keys.filter(function (k, i) { return k && keys.indexOf(k) === i; }));
  };
  SF.make = function (type, c, streetW, heroX, ground, seed) {
    // 짐승: 그 지역의 걷는 그림이 있으면 그 그림의 짐승으로 (지역마다 개 또는 고양이 한 마리)
    if (D().types[type] && D().types[type].animal && imgFrames(type, c)) { var pk = (D().petKind || {})[G.Img.folkStyle(c)] || 'dog'; if (D().types[pk]) type = pk; }
    var k = K(), T = D().types[type], dp = k.depth || [12, 52], sc = k.scale || [0.92, 1.06];
    var depth = U.rf(dp[0], dp[1]), f0 = { type: type, name: T.name, animal: !!T.animal, seed: seed }, sp = SF.speaker(f0, c);
    // 거리의 모습은 대화창 얼굴과 같은 성별로: 그림이 있으면 그 그림의 성별, 없으면 코드 얼굴의 성별
    var sex = T.animal ? null : (T.face && T.face.town && G.Img.npcGender ? G.Img.npcGender(T.face.town, c) : null) || (sp.portrait && sp.portrait.g) || (T.face && T.face.g) || null;
    return { type: type, name: T.name, animal: !!T.animal, face: sp, spec: A.folkSpec(type, c, seed, { sex: sex }), seed: seed, x: heroX, y: ground + depth,
      sc: (sc[0] + (depth - dp[0]) / Math.max(1, dp[1] - dp[0]) * (sc[1] - sc[0])), dir: U.chance(0.5) ? 1 : -1,
      state: 'idle', timer: U.rf(0, 2.5), ph: U.rf(0, 1), v: 0, target: heroX, minX: 60, maxX: streetW - 60, talked: 0, used: false, frames: imgFrames(type, c) };
  };
  /** 걷는 그림 8장: 그 도시 양식(20곳) → 문화권 → 공통 차례로. 그림 이름은 G.STREET_FOLK.sprites (마을 남자 = town_man …) */
  /** 걷는 그림: 한 장짜리 시트(street-folk/<그림 이름>_<양식>.webp — 4열×2줄 8단계, 칸마다 380×444) 또는 낱장(…/walk_1…8).
      도시 양식 → 문화권 → 공통 차례로 찾는다. 그림 이름은 G.STREET_FOLK.sprites (마을 남자 = town_man …).
      돌려주는 값: 8칸 [{k: 그림 키, c: 시트의 칸 번호(낱장이면 없음)}] */
  function imgFrames(type, c) {
    var I = G.Img; if (!I || !I.list || !I.has) return null;
    var name = (D().sprites || {})[type] || type, style = I.folkStyle ? I.folkStyle(c) : c.style;
    var cul = A.folkCulture ? A.folkCulture(c).cul : 'europe';
    var cands = ['street-folk/' + name + '_' + style, 'street-folk/' + type + '_' + cul, 'street-folk/' + type];
    for (var i = 0; i < cands.length; i++) {
      var key = cands[i];
      if (I.has(key)) { if (I.want) I.want(key); return [0, 1, 2, 3, 4, 5, 6, 7].map(function (n) { return { k: key, c: n }; }); }
      var l = I.list(key + '/walk_');
      if (l.length) {
        l.sort(function (a, b) { return (+(/(\d+)$/.exec(a) || [0, 0])[1]) - (+(/(\d+)$/.exec(b) || [0, 0])[1]); });   // walk_1 … walk_8 차례 (walk_10 넘어도)
        l.forEach(function (k) { if (I.want) I.want(k); });
        return l.map(function (k) { return { k: k }; });
      }
    }
    return null;
  }
  SF.frames = imgFrames;

  // ---------------------------------------------------------------- 걷기
  /** 한 번 움직인다. 움직인 사람이 있으면 true */
  SF.update = function (list, dt, heroX) {
    var k = K(), moved = false;
    (list || []).forEach(function (f) {
      if (f.state === 'talk') { var d0 = heroX - f.x; if (d0 && Math.sign(d0) !== f.dir) { f.dir = Math.sign(d0); moved = true; } return; }
      if (f.state === 'idle') {
        f.timer -= dt;
        if (f.animal && f.timer > 0 && U.chance(dt * 0.4)) { f.dir = -f.dir; moved = true; }   // 짐승은 두리번거린다
        if (f.timer > 0) return;
        var span = f.animal ? 420 : 620, tx = U.clamp(f.x + U.rf(-span, span), f.minX, f.maxX);
        if (f.type === 'dog' && Math.abs(heroX - f.x) < 500 && U.chance(0.45)) tx = U.clamp(heroX + (U.chance(0.5) ? -1 : 1) * U.rf(60, 110), f.minX, f.maxX);   // 강아지는 제독 곁으로 온다
        if (Math.abs(tx - f.x) < 40) { f.timer = U.rf(0.6, 1.6); return; }
        var spd = f.animal ? (k.animalSpeed || [70, 130]) : (k.speed || [38, 72]);
        f.target = tx; f.v = U.rf(spd[0], spd[1]) * (f.spec.stoop ? 0.7 : f.spec.child ? 1.15 : 1); f.state = 'walk'; f.dir = tx > f.x ? 1 : -1;
      }
      if (f.state === 'walk') {
        var d = f.target - f.x, step = f.v * dt;
        if (Math.abs(d) <= step) { f.x = f.target; f.state = 'idle'; var idl = k.idle || [1.2, 4.5]; f.timer = U.rf(idl[0], idl[1]); }
        else { f.x += Math.sign(d) * step; f.dir = d > 0 ? 1 : -1; }
        var stride = (f.frames ? (K().imgH || 158) * (f.animal ? 0.45 : f.spec.child ? 0.78 : 1) : f.spec.h) * f.sc * (f.animal ? 0.9 : 0.62);   // 걷는 그림이면 그림 키로
        f.ph = (f.ph + step / stride) % 1;
        moved = true;
      }
    });
    return moved;
  };

  // ---------------------------------------------------------------- 그리기·누르기
  function k0() { return K(); }
  SF.draw = function (ctx, f, cam, glow) {
    var x = f.x - cam; if (x < -120 || x > 1720) return;
    var moving = f.state === 'walk';
    if (f.frames) {
      var I = G.Img, idx = moving ? Math.floor(f.ph * f.frames.length) % f.frames.length : 0, fr = f.frames[idx], img = I.get(fr.k);
      if (img) {
        // 한 칸(380×444)은 어른 키에 맞춰 그렸고, 아이·짐승은 칸 안에서 이미 작다 (tools/npc_walks.py displayScale) — 칸 높이는 모두 같게
        var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, cw = fr.c != null ? iw / 4 : iw, ch = fr.c != null ? ih / 2 : ih;
        var h = (k0().imgH || 158) * f.sc, w = cw * h / ch;
        ctx.save(); ctx.fillStyle = 'rgba(40,26,12,.28)'; ctx.beginPath(); ctx.ellipse(x, f.y - 2, w * 0.3, 7, 0, 0, 7); ctx.fill();
        ctx.translate(x, f.y); if (f.dir < 0) ctx.scale(-1, 1);
        if (fr.c != null) ctx.drawImage(img, (fr.c % 4) * cw, Math.floor(fr.c / 4) * ch, cw, ch, -w / 2, -h, w, h);   // 시트의 한 칸
        else ctx.drawImage(img, -w / 2, -h, w, h);
        ctx.restore();
        if (glow) A.drawFolk(ctx, { h: f.spec.h, type: 'none' }, x, f.y, 1, 0, false, f.sc, true);
        return;
      }
    }
    A.drawFolk(ctx, f.spec, x, f.y, f.dir, f.ph, moving, f.sc, glow);
  };
  /** 화면 자리 (x, y)에 있는 사람 (앞에 선 사람 먼저) */
  SF.hit = function (list, x, y, cam) {
    var best = null;
    (list || []).slice().sort(function (a, b) { return b.y - a.y; }).some(function (f) {
      var h = f.spec.h * f.sc, sx = f.x - cam, w = f.animal ? h * 0.95 : h * 0.26;
      if (x >= sx - w && x <= sx + w && y >= f.y - h * (f.animal ? 1.1 : 1.08) && y <= f.y + 8) { best = f; return true; }
      return false;
    });
    return best;
  };

  // ---------------------------------------------------------------- 대화
  function C() { return G.Scenes.city; }
  /** 대화창의 얼굴 (짐승은 얼굴 없이 이름만) */
  SF.speaker = function (f, c) {
    var T = D().types[f.type], cl = R.cityLang(c), sp = { name: f.name, lang: f.animal ? 3 : cl.lv, li: cl.li };
    if (f.animal) { sp.noFace = true; sp.solo = true; return sp; }   // 고양이·강아지: 얼굴을 지어 붙이지 않는다 (UI.withFace도 건너뛴다)
    var fc = T.face || {}, stl = G.Img.folkStyle(c), sprite = (D().sprites || {})[f.type] || f.type;
    var own = 'portraits/street-folk/' + sprite + '_' + stl;
    try {
      if (G.Img.has(own)) {
        var ownBase = A.npcSpec('street:' + c.id + ':' + f.seed, fc.role || 'sailor', stl, fc.g);
        sp.portrait = A.withImg(ownBase, [own]);
        sp.half = [own + '_half'];
      } else if (fc.town) sp.portrait = A.townSpec(fc.town, c);
      else {
        var base = A.npcSpec('street:' + c.id + ':' + f.seed, fc.role || 'sailor', stl, fc.g);
        if (fc.age) { base = Object.assign({}, base, { age: fc.age }); if (fc.age === 'young') { base.beard = 0; base.moustache = false; } if (fc.age === 'old') base.hair = '#c8c0b0'; }
        // 역할 그림(npc-roles)은 문화권마다 남녀가 정해져 있다(학자·귀족 그림은 여자 등) — 성별이 맞을 때만 쓰고, 아니면 코드로 그린 얼굴
        var rg = fc.img && A.rolePortraitGender ? A.rolePortraitGender(fc.img, stl) : null;
        if (!fc.g && rg) base = Object.assign({}, base, { g: rg });   // 성별을 정하지 않은 사람(마을 사람·젊은 귀족)은 그 지역 역할 그림(=걷는 그림)의 성별
        var okImg = fc.img && (!rg || rg === (fc.g || base.g));
        sp.portrait = okImg ? A.withImg(base, ['portraits/npc-roles/' + stl + '/' + fc.img]) : base;
      }
      if (!sp.half && sp.portrait && A.portraitKeys && G.Img.chain.halfFor) sp.half = G.Img.chain.halfFor(A.portraitKeys(sp.portrait));   // 대화창: 걷는 그림과 같은 사람의 무릎상
    } catch (e) { /* 얼굴 없이 */ }
    return sp;
  };
  function fill(t, c) {
    var owner = R.cityOwner(c), ruler = G.Dominion && G.Dominion.leader ? (G.Dominion.leader(owner).text || owner) : owner;
    return String(t).replace(/\{city\}/g, c.name).replace(/\{owner이\}/g, owner + U.jx(owner, '이/가')).replace(/\{owner\}/g, owner).replace(/\{ruler\}/g, ruler)
      .replace(/\{season\}/g, D().season[(S().date.m || 1) - 1]).replace(/\{church\}/g, R.churchName ? R.churchName(c) : '교회');
  }
  // ---- 쓸모 있는 이야기 (없으면 null)
  function dirWord(dx, dy) {
    var a = Math.atan2(dy, dx) * 180 / Math.PI, n = ['동', '북동', '북', '북서', '서', '남서', '남', '남동'];
    return n[Math.round(((a + 360) % 360) / 45) % 8] + '쪽';
  }
  function hintFor(c, cats, who) {
    if (!G.Disc || !G.DISCOVERIES) return null;
    var src = 'tavern:street' + c.id;
    var cand = G.DISCOVERIES.filter(function (d) {
      return cats.indexOf(d.cat) >= 0 && !G.Disc.foundByMe(d.id) && G.Disc.available(d) && G.Disc.built(d) && G.Disc.needMet(d) && G.Disc.clueOk(d, src) && G.Disc.rumourW(d, src) > 0 && !d.bookOnly &&
        d.reg != null && G.REGION_DIST[c.region] && G.REGION_DIST[c.region][d.reg] <= 1;
    });
    if (!cand.length) return null;
    var d = U.pick(cand);
    return { text: (who === 'elder' ? '내 할아버지께 들은 이야기가 있네. ' : '모험가들 사이에 도는 이야기요. ') + d.hint, after: function () { G.Disc.noteHint(d, src); } };
  }
  var INFO = {
    man: function (c) { var e = G.Econ && (G.Econ.activeAt(c.id)[0] || G.Econ.rumors(c, 1)[0]); return e ? { text: '장사꾼들한테 들었는데 말이오, ' + G.Econ.say(e, c), after: function () { G.Econ.learn(e); } } : null; },
    woman: function (c) {
      var cats = Object.keys(G.GOOD_CATS).map(function (k) { return { k: k, v: R.catIndex(c, k) }; }).sort(function (a, b) { return a.v - b.v; });
      var lo = cats[0], hi = cats[cats.length - 1]; if (hi.v - lo.v < 0.12) return null;
      return { text: '요즘 이 동네 장에서는 ' + G.GOOD_CATS[lo.k] + U.jx(G.GOOD_CATS[lo.k], '이/가') + ' 싸고 ' + G.GOOD_CATS[hi.k] + U.jx(G.GOOD_CATS[hi.k], '은/는') + ' 비싸요. 살 거면 지금이 좋아요.' };
    },
    boy: function (c) {
      var f = S().fleet, sh = f.ships[0]; if (!sh) return null;
      return { text: '항구에 있는 ' + sh.name + '호가 아저씨 배예요? 배가 ' + f.ships.length + '척이나 있어요? 우와, 선원도 ' + f.crew + '명이나!' };
    },
    girl: function (c) { var m = G.MAIDS && G.MAIDS.filter(function (x) { return x.city === c.id; })[0]; return m ? { text: '술집에 ' + m.name + ' 언니 알아요? 엄청 예쁘고 노래도 잘해요. 선장님들이 다 그 언니 보러 온대요.' } : null; },
    elder: function (c) { return hintFor(c, ['ruin', 'nature', 'people', 'geo'], 'elder'); },
    grandma: function (c) {
      var f = S().fleet;
      if ((f.scurvy || 0) > 0 || (f.sick || 0) > 0) return { text: '선원들 얼굴이 누렇게 떴던데, 배에 신 과일을 실어 가우. 라임이나 레몬 같은 거. 그게 약이야.' };
      if ((f.fatigue || 0) > 50) return { text: '자네 사람들이 많이 지쳐 보여. 여관에서 하룻밤 푹 쉬고 떠나요. 지친 몸으로 바다에 나가면 탈이 나.' };
      return null;
    },
    librarian: function (c) {
      var bs = (G.BOOKS || []).filter(function (b) { return b.libs && b.libs.indexOf(c.id) >= 0; });
      if (!bs.length) return null; var b = U.pick(bs);
      return { text: '저희 ' + (R.libraryName ? R.libraryName(c) : '도서관') + '에는 『' + b.title.replace(/^.*『|』.*$/g, '') + '』 같은 귀한 책도 있습니다. 시간이 나시면 서가를 둘러보십시오.' };
    },
    innkeeper: function (c) { return { text: '우리 여관은 하룻밤에 금화 ' + R.innCost(c) + '닢이오. 묵으면 선원들 피로가 풀리고, 저장도 해 드리지.' }; },
    adventurer: function (c) { return hintFor(c, ['geo', 'nature', 'ruin'], 'adv'); },
    merchant: function (c) {
      var TR = C().B.trade; if (!TR || !TR.farRegions) return null;
      var sp = c.goods.filter(function (id) { return G.GOOD[id] && !R.isRelay(c, id); }).map(function (id) { var fr = TR.farRegions(id); return { id: id, r: fr[0].r, x: fr[0].m / 0.62 }; }).sort(function (a, b) { return b.x - a.x; })[0];
      if (!sp || sp.x < 1.5) return INFO.man(c);
      return { text: '여기서 흔한 ' + U.eul(G.GOOD[sp.id].name) + ' ' + G.REGIONS[sp.r] + '까지 실어 가면 여기 값의 ' + sp.x.toFixed(1) + '배는 받는다오. 먼 길이 곧 돈이지.' };
    },
    noble: function (c) {
      var sps = (G.SPONSORS || []).filter(function (s) { return s.city === c.id; }); if (!sps.length) return null; var sp = U.pick(sps);
      var nm = G.Sponsor && G.Sponsor.holderName ? G.Sponsor.holderName(sp) : sp.title;
      return { text: (sp.bld === 'palace' ? '궁정' : '저택') + '의 ' + nm + '께서 요즘 쓸 만한 모험가를 찾고 계시다더군. 명성이 있다면 한번 찾아뵙게.' };
    },
    soldier: function (c) {
      var ev = G.Econ && G.Econ.activeAt(c.id).filter(function (e) { return e.type === 'war' || e.type === 'border'; })[0];
      if (ev) return { text: G.Econ.title(ev) + ' 때문에 요즘 비상이오. ' + ev.why + '. 총과 말이 모자라 값이 껑충 뛰었소.', after: function () { G.Econ.learn(ev); } };
      if (G.Treaty && G.Treaty.active() && G.Treaty.crownOf(R.cityOwner(c))) return { text: '토르데시야스 조약 이후로 상대 왕실의 배는 항구에 들이지 말라는 명령이 내려와 있소. 당신 깃발은 ' + R.nationName(S().player.nation) + '이로군.' };
      return null;
    },
    navigator: function (c) {
      var mn = G.Monsoon && G.Monsoon.portNote ? G.Monsoon.portNote(c) : null;
      if (mn) return { text: (mn.phase === 'sw' ? '요즘은 남서 계절풍이 한창이오. ' : '요즘은 북동 계절풍이 부오. ') + mn.zone.tip[mn.phase] + '라오.' };
      var s = S(), best = null;
      G.CITY_DATA.forEach(function (t) {
        if (!t.port || t.id === c.id || !R.cityExists(t) || (s.visited && s.visited[t.id])) return;
        var d = G.Geo.dist(c.lon, c.lat, t.lon, t.lat); if (d < 2 || d > 14) return;
        if (!best || d < best.d) best = { t: t, d: d };
      });
      if (!best) return null;
      var gn = (best.t.goods || []).slice(0, 2).map(function (id) { return G.GOOD[id] ? G.GOOD[id].name : ''; }).filter(Boolean).join('·');
      return { text: '아직 ' + best.t.name + '에는 안 가 보셨소? 여기서 ' + dirWord(best.t.lon - c.lon, best.t.lat - c.lat) + '으로 순풍이면 ' + Math.max(2, Math.round(best.d * 1.6)) + '일 남짓이오.' + (gn ? ' 그 항구는 ' + U.j(gn, '으로/로') + ' 이름났지.' : '') };
    },
    dog: function () { if (U.chance(0.15)) { var g = U.ri(2, 9); S().player.gold += g; return { text: '(한참 땅을 파더니 무언가를 물고 온다 — 금화 ' + g + '닢이다!)', gold: g }; } return null; },
    cat: function () { return null; }
  };
  SF.INFO = INFO;
  /** 말을 건다 (js/scenes/city.js C.chatFolk) */
  SF.talk = async function (f, c) {
    var sp = f.face || SF.speaker(f, c), lines = D().lines[f.type] || ['……'];
    if (!R.facilities(c).church || (c.flags && c.flags.indexOf('T') >= 0)) { var nl = lines.filter(function (l) { return l.indexOf('{church}') < 0; }); if (nl.length) lines = nl; }   // 교회가 없거나 작은 사당뿐인 마을
    var cl = R.cityLang(c); if (!f.animal) { sp.lang = cl.lv; sp.li = cl.li; }   // 말은 지금 일행의 실력으로
    f.talked++;
    var deaf = !f.animal && sp.lang === 0;            // 말이 통하지 않으면 쓸모 있는 이야기는 아껴 둔다 (통역을 데려와 다시 말을 걸면 된다)
    var info = !f.used && !deaf && INFO[f.type] ? INFO[f.type](c) : null;
    var text, useInfo = info && (f.animal || f.talked === 1 || U.chance(0.7));
    if (useInfo) { f.used = true; text = info.text; }
    else text = fill(U.pick(lines), c);
    if (f.talked > 1 && !f.animal && !useInfo) text = U.pick(['또 만났군요. ', '아까 그 분이시군요. ', '']) + text;
    await UI.say(text, sp);
    if (deaf) { await C().mate('말이 통하지 않아 무슨 이야기인지 알아듣지 못했습니다.'); return; }
    if (useInfo && info.after) info.after();
    if (useInfo && info.gold) G.Game.refreshHud();
  };
})(window.G = window.G || {});
