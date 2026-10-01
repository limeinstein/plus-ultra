/* 그림 교체: images/manifest.js 에 등록된 파일이 있으면 코드로 그린 그림 대신 그 파일을 보여 줍니다.
   키는 images/ 폴더 기준 경로에서 확장자를 뺀 것입니다. 예) images/cities/0.jpg → 'cities/0'
   하나의 그림 자리에는 [가장 구체적인 키, ..., 가장 일반적인 키] 순서의 후보 목록(체인)을 씁니다. */
(function (G) {
  'use strict';
  var I = {};
  G.Img = I;
  var BASE = 'images/';
  var files = null;
  var imgs = {}, state = {}, waiters = {};

  function man() {
    if (!files) {
      files = {};
      var m = G.IMAGE_FILES || {};
      for (var k in m) if (Object.prototype.hasOwnProperty.call(m, k) && m[k]) files[k] = m[k];
    }
    return files;
  }
  I.base = function (b) { if (b != null) BASE = b; return BASE; };
  /** re-read G.IMAGE_FILES (e.g. after the manifest changed) */
  I.reset = function () {
    for (var b in blobs) { try { URL.revokeObjectURL(blobs[b]); } catch (e) { /* 무시 */ } }
    files = null; imgs = {}; state = {}; waiters = {}; blobs = {}; cityAsked = {};
  };
  I.count = function () { return Object.keys(man()).length; };
  /** sorted keys that start with prefix */
  I.list = function (prefix) { return Object.keys(man()).filter(function (k) { return !prefix || k.indexOf(prefix) === 0; }).sort(natural); };
  function natural(a, b) { return a.localeCompare(b, undefined, { numeric: true }); }
  I.has = function (k) { return !!(k && man()[k]) && state[k] !== 'fail'; };
  /** first key of the chain that has a file */
  I.pick = function (chain) { chain = [].concat(chain || []); for (var i = 0; i < chain.length; i++) if (I.has(chain[i])) return chain[i]; return null; };
  I.file = function (k) { return man()[k] || null; };
  /** 사람이 읽을 파일 이름. 한 파일짜리 판에서는 data: 주소 대신 원래 이름을 돌려준다 */
  I.path = function (k) {
    if (!k) return null;
    var p = G.IMAGE_PATHS && G.IMAGE_PATHS[k];
    if (p) return p;
    var f = man()[k];
    if (!f) return null;
    if (f.indexOf('data:') === 0) {
      var m = /^data:image\/([a-z]+)/.exec(f);
      return k + '.' + (m ? (m[1] === 'jpeg' ? 'jpg' : m[1]) : 'png');
    }
    return f;
  };
  /** 움직이는 그림인가 — 원본 GIF, 아티팩트·한 파일짜리 판에서 줄인 움직이는 WEBP(이름이 .anim.webp), data:image/gif.
      움직이는 그림은 Canvas에 옮기면 첫 장면만 남으므로 <img>로 올려야 한다. */
  I.isAnim = function (k) {
    if (!k) return false;
    var f = man()[k] || '', p = I.path(k) || '';
    return /\.(gif|anim\.webp)(?:$|[?#])/i.test(p) || /^data:image\/gif/i.test(f);
  };
  /* 한 파일짜리 판은 그림이 아주 긴 data: 주소로 들어 있다. 그대로 쓰면 주소가 수십만 자여서
     그림을 따로 열어 보거나 주소를 다루기 어렵다. 처음 쓸 때 짧은 blob: 주소로 바꿔 둔다. */
  var blobs = {};
  function blobUrl(k, f) {
    if (blobs[k]) return blobs[k];
    try {
      var i = f.indexOf(','), head = f.slice(5, i);
      var type = head.replace(/;base64$/, '') || 'image/png';
      var bin = atob(f.slice(i + 1)), n = bin.length, a = new Uint8Array(n);
      for (var j = 0; j < n; j++) a[j] = bin.charCodeAt(j);
      blobs[k] = URL.createObjectURL(new Blob([a], { type: type }));
    } catch (e) { blobs[k] = f; }
    return blobs[k];
  }
  /* 아티팩트판: 그림은 묶음 파일(img/pack-NN.js)에 나뉘어 있고, 묶음 안의 그림이 처음 필요할 때 그 묶음을 읽는다.
     읽기 전에는 G.IMAGE_FILES 에 'pack:번호' 자리표만 있다. */
  var packs = {}, PACK = /^pack:(\d+)$/;
  function packOf(k) { var m = PACK.exec(man()[k] || ''); return m ? +m[1] : -1; }
  function loadPack(i) {
    if (packs[i]) return packs[i];
    var url = (G.IMAGE_PACK_URLS || [])[i];
    packs[i] = new Promise(function (resolve) {
      if (!url) return resolve(false);
      var s = document.createElement('script');
      s.src = url; s.async = true;
      s.onload = function () {
        var m = G.IMAGE_FILES || {}, tag = 'pack:' + i, done = [];
        for (var k in files) if (files[k] === tag && m[k] && m[k] !== tag) { files[k] = m[k]; done.push(k); }
        // 읽기 전에 I.src 로 자리표 주소를 받아 간 <img> 를 진짜 그림으로 바꾼다
        done.forEach(function (k) {
          var ph = holder(k);
          Array.prototype.forEach.call(document.querySelectorAll('img'), function (im) { if (im.getAttribute('src') === ph) im.src = I.src(k); });
        });
        resolve(true);
      };
      s.onerror = function () { delete packs[i]; if (window.console) console.warn('[그림 교체] 그림 묶음을 불러오지 못했습니다: ' + url); resolve(false); };
      document.head.appendChild(s);
    });
    return packs[i];
  }
  /** 묶음을 아직 읽지 않은 그림의 자리표 주소 (투명한 빈 SVG — 그림마다 달라서 나중에 찾아 바꿀 수 있다) */
  function holder(k) { return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><desc>' + k.replace(/[<&]/g, '') + '</desc></svg>'); }
  /** 이 그림이 바로 쓸 수 있게 준비되었나 (묶음까지 읽혔나) — 묶음을 읽는 중이면 Promise */
  I.ready = function (k) { var p = packOf(k); return p < 0 ? Promise.resolve(true) : loadPack(p); };
  /** 묶음 여러 개를 미리 읽어 둔다 (키 앞부분 목록) */
  I.prefetch = function (prefixes) {
    var want = {};
    Object.keys(man()).forEach(function (k) { var p = packOf(k); if (p >= 0 && [].concat(prefixes || ['']).some(function (x) { return k.indexOf(x) === 0; })) want[p] = 1; });
    return Promise.all(Object.keys(want).map(function (p) { return loadPack(+p); }));
  };
  /* 미리 받기 줄 — 지금 화면에 필요한 그림(I.load·I.src)은 곧바로 받고, 곧 쓸 그림(I.prefetchKeys·I.prefetchCity)은
     한 번에 PREFETCH_MAX개씩 차례로 받는다 (지금 필요한 그림과 받는 길을 다투지 않게).
     아티팩트판은 묶음 단위, 웹판·개발판은 그림 파일 단위. */
  var queue = [], queued = {}, running = 0, PREFETCH_MAX = 2;
  function pump() {
    while (running < PREFETCH_MAX && queue.length) {
      var job = queue.shift();
      delete queued[job];
      var pk = /^p:(\d+)$/.exec(job), p;
      if (pk) { if (packs[+pk[1]]) continue; p = loadPack(+pk[1]); }
      else { var k = job.slice(2); if (state[k] === 'ok' || state[k] === 'fail' || state[k] === 'loading') continue; p = I.load(k); }
      running++;
      p.then(done, done);
    }
    function done() { running--; setTimeout(pump, 0); }
  }
  /** 곧 쓸 그림들을 미리 받는다 (기다리지 않음). front: 줄 맨 앞에. 돌려주는 값: 새로 줄에 넣은 수 */
  I.prefetchKeys = function (keys, front) {
    var jobs = [];
    [].concat(keys || []).forEach(function (k) {
      if (!k || !man()[k]) return;
      var pk = packOf(k), job = pk >= 0 ? 'p:' + pk : 'k:' + k;
      if (pk >= 0 ? packs[pk] : state[k]) return;
      if (queued[job] || jobs.indexOf(job) >= 0) return;
      jobs.push(job);
    });
    jobs.forEach(function (j) { queued[j] = 1; });
    queue = front ? jobs.concat(queue) : queue.concat(jobs);
    pump();
    return jobs.length;
  };
  /** 한 도시에서 쓸 그림을 미리 받는다. level 'near' = 거리 배경과 건물 겉모습(항구에 다가갈 때),
      'in'(기본) = 건물 안·마을 사람·여급·후원자·그 지역 동료 얼굴까지(도시에 들어갔을 때) */
  var cityAsked = {};
  I.prefetchCity = function (c, level) {
    if (!c || !I.count()) return 0;
    level = level || 'in';
    var tag = c.id + ':' + level;
    if (cityAsked[tag]) return 0;
    cityAsked[tag] = 1;
    var keys = [];
    function add(chain) { var k = I.pick(chain); if (k) keys.push(k); }
    add(K.bg(c));
    I.INTERIORS.forEach(function (b) { add(K.exterior(b[0], c)); });
    if (level === 'in') {
      cityAsked[c.id + ':near'] = 1;
      I.NPCS.forEach(function (n) { add(K.npc(n[0], c)); });
      I.INTERIORS.forEach(function (b) { add(K.interior(b[0], c)); });
      (G.SPONSORS || []).forEach(function (sp) { if (sp.city === c.id) I.list('portraits/sponsors/' + sp.id).forEach(function (k) { keys.push(k); }); });
      (G.MAIDS || []).forEach(function (m) { if (m.city === c.id) { add(K.maid(m.id, c)); add(K.maidHalf(m.id, c)); } });
      add(K.maidCity(c)); add(K.maidCityHalf(c));
      (G.MATES || []).forEach(function (m) { if (m.reg && m.reg[0] === c.region) add(K.mate(m.id)); });
    }
    return I.prefetchKeys(keys);
  };
  /** 지금 데리고 있는 동료들의 얼굴 (바다·해전·사건 대화에 바로 나오게) */
  I.prefetchCrew = function () {
    var s = G.Game && G.Game.state, A = G.Art;
    if (!s || !s.mates) return 0;
    var keys = [];
    s.mates.forEach(function (m) {
      var spec = G.Scenes && G.Scenes.mateSpec ? G.Scenes.mateSpec(m.id) : null;
      var k = I.pick((A && A.portraitKeys && spec && A.portraitKeys(spec)) || K.mate(m.id));
      if (k) keys.push(k);
    });
    return I.prefetchKeys(keys, true);
  };
  I.src = function (k) {
    var f = man()[k]; if (!f) return null;
    var pk = packOf(k);
    if (pk >= 0) { loadPack(pk); return holder(k); }
    if (f.indexOf('data:') === 0) {
      if (blobs[k]) return blobs[k];
      if (window.URL && URL.createObjectURL && f.indexOf(';base64,') > 0) return blobUrl(k, f);
      return f;
    }
    if (/^(blob:|https?:)/.test(f)) return f;
    return BASE + f.split('/').map(encodeURIComponent).join('/');
  };
  I.get = function (k) { return state[k] === 'ok' ? imgs[k] : null; };
  I.status = function (k) { return state[k] || (man()[k] ? 'idle' : 'none'); };
  I.load = function (k) {
    var pk = k ? packOf(k) : -1;
    if (pk >= 0) return loadPack(pk).then(function (ok) {
      if (ok && packOf(k) < 0) return I.load(k);
      state[k] = 'fail'; return null;
    });
    return new Promise(function (resolve) {
      if (!k || !man()[k] || state[k] === 'fail') return resolve(null);
      if (state[k] === 'ok') return resolve(imgs[k]);
      (waiters[k] = waiters[k] || []).push(resolve);
      if (state[k] === 'loading') return;
      state[k] = 'loading';
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { state[k] = 'ok'; imgs[k] = im; flush(k, im); };
      im.onerror = function () { state[k] = 'fail'; if (window.console) console.warn('[그림 교체] 파일을 불러오지 못했습니다: ' + (man()[k] || k)); flush(k, null); };
      im.src = I.src(k);
    });
  };
  function flush(k, im) { var w = waiters[k] || []; delete waiters[k]; w.forEach(function (f) { try { f(im); } catch (e) { console.error(e); } }); }
  /** walk the chain: the first file that loads wins. resolves {key, img} or null */
  I.resolve = function (chain) {
    chain = [].concat(chain || []);
    var i = 0;
    function next() {
      while (i < chain.length && !I.has(chain[i])) i++;
      if (i >= chain.length) return Promise.resolve(null);
      var k = chain[i++];
      return I.load(k).then(function (im) { return im ? { key: k, img: im } : next(); });
    }
    return next();
  };
  /** load the pictures for several chains; resolves when done or after ms */
  I.preload = function (chains, ms) {
    var list = (chains || []).filter(function (c) { return I.pick(c); });
    if (!list.length) return Promise.resolve();
    var all = Promise.all(list.map(I.resolve));
    return ms ? Promise.race([all, new Promise(function (r) { setTimeout(r, ms); })]) : all;
  };

  /** draw so the picture covers the rect (cropping the overflow). fx/fy: focus 0..1 */
  I.drawCover = function (ctx, im, x, y, w, h, fx, fy) {
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    if (!iw || !ih) return;
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = 'high'; } catch (e) { /* 옛 브라우저 */ }
    var s = Math.max(w / iw, h / ih), dw = iw * s, dh = ih * s;
    ctx.drawImage(im, x + (w - dw) * (fx == null ? 0.5 : fx), y + (h - dh) * (fy == null ? 0.5 : fy), dw, dh);
  };
  /** draw so the whole picture fits inside the rect */
  I.drawContain = function (ctx, im, x, y, w, h) {
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    if (!iw || !ih) return;
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = 'high'; } catch (e) { /* 옛 브라우저 */ }
    var s = Math.min(w / iw, h / ih), dw = iw * s, dh = ih * s;
    ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  };

  /** paint the override for chain onto canvas cv — now if loaded, otherwise as soon as the file arrives.
      opts: {fit:'cover'|'contain', fx, fy, bg, post(ctx,w,h,key)} . returns true when an override exists */
  I.apply = function (cv, chain, opts) {
    opts = opts || {};
    var key = I.pick(chain); if (!key) return false;
    function paint(res) {
      if (!res) return;
      var ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      if (opts.bg) { ctx.fillStyle = opts.bg; ctx.fillRect(0, 0, w, h); }
      if (opts.fit === 'contain') I.drawContain(ctx, res.img, 0, 0, w, h);
      else I.drawCover(ctx, res.img, 0, 0, w, h, opts.fx, opts.fy);
      ctx.restore();
      if (opts.post) { ctx.save(); opts.post(ctx, w, h, res.key); ctx.restore(); }
      cv.setAttribute('data-img', res.key);
      if (G.Game && G.Game._sceneSrc === cv && G.Game.setScene) G.Game.setScene(cv);
      if (opts.onPaint) opts.onPaint(cv, res.key);
    }
    var ready = I.get(key);
    if (ready) paint({ key: key, img: ready });
    else I.resolve(chain).then(paint);
    return true;
  };
  /** canvas w×h showing the override when there is one, otherwise procedural() */
  I.make = function (chain, w, h, procedural, opts) {
    var key = I.pick(chain);
    if (!key) return procedural();
    var cv;
    if (I.get(key)) { cv = document.createElement('canvas'); cv.width = w; cv.height = h; }
    else cv = procedural();
    I.apply(cv, chain, opts);
    return cv;
  };
  // ---------------------------------------------------------------- key chains (파일 이름 규칙)
  I.STYLES = [['ib', '이베리아'], ['ne', '서·북유럽'], ['it', '이탈리아·남프랑스'], ['gr', '그리스·발칸'], ['ru', '러시아'], ['is', '아랍·북아프리카'],
    ['pe', '페르시아·중앙아시아'], ['af', '사헬(흙벽 도시)'], ['sw', '동아프리카 해안'], ['tr', '열대 토착 마을'], ['in', '인도'], ['se', '동남아시아'],
    ['cn', '중국'], ['kr', '조선'], ['jp', '일본'], ['st', '초원(유르트)'], ['co', '신대륙 식민 도시'], ['az', '메소아메리카'], ['an', '안데스'], ['na', '북미 원주민 마을']];
  /** 도시 양식 → 건물 겉모습 묶음 (images/exterior-styles/<묶음>/<건물>.webp) */
  I.EXTSTYLES = [['iberia', '포르투갈'], ['espana', '에스파냐·식민'], ['france', '서·북유럽'], ['italy', '이탈리아·남프랑스'],
    ['easteurope', '동유럽'], ['ottoman', '오스만·레반트'], ['russia', '러시아'], ['arabia', '아랍·북아프리카·페르시아'],
    ['swahili', '동아프리카 해안'], ['africa', '아프리카 내륙'], ['masai', '아프리카 초원'], ['india', '인도'],
    ['seasia', '동남아시아 본토'], ['tropic', '섬·열대 마을'], ['china', '중국'],
    ['korea', '조선'], ['japan', '일본'], ['steppe', '초원'], ['aztec', '메소아메리카'], ['inca', '안데스'],
    ['woodland', '북미 숲 마을'], ['plains', '북미 평원 마을'], ['pueblo', '푸에블로']];
  I.EXT_BY_STYLE = { ib: 'iberia', co: 'espana', ne: 'france', it: 'italy', gr: 'easteurope', ru: 'russia',
    is: 'arabia', pe: 'arabia', sw: 'swahili', af: 'africa', tr: 'masai', 'in': 'india', se: 'seasia',
    cn: 'china', kr: 'korea', jp: 'japan', st: 'steppe', az: 'aztec', an: 'inca', na: 'woodland' };
  /** 같은 양식이라도 다른 묶음을 쓰는 도시 */
  I.EXT_BY_CITY = {
    // 카스티야·아라곤·그라나다의 에스파냐 도시
    2: 'espana', 3: 'espana', 4: 'espana', 5: 'espana', 6: 'espana', 7: 'espana', 8: 'espana',
    11: 'espana', 12: 'espana', 13: 'espana', 88: 'espana',
    // 오스만이 다스리는 발칸·레반트
    72: 'ottoman', 73: 'ottoman', 76: 'ottoman', 112: 'ottoman', 113: 'ottoman', 114: 'ottoman',
    115: 'ottoman', 116: 'ottoman', 117: 'ottoman', 118: 'ottoman', 119: 'ottoman', 120: 'ottoman',
    121: 'ottoman', 
    // 베네치아가 쥔 섬
    74: 'italy', 75: 'italy',
    // 섬 동남아시아·열대 아메리카는 대나무 고상가옥
    160: 'tropic', 166: 'tropic', 167: 'tropic', 168: 'tropic', 169: 'tropic',
    170: 'tropic', 171: 'tropic', 172: 'tropic', 208: 'tropic', 209: 'tropic', 211: 'tropic',
    212: 'tropic', 213: 'tropic',
    // 북미 원주민: 평원(다코타 수우·만단)은 티피, 푸에블로(타오스·아코마)는 흙벽돌 계단 집
    230: 'plains', 243: 'plains', 241: 'pueblo', 242: 'pueblo' };
  /** 그 묶음에 없는 건물은 이웃 묶음에서 빌려 온다 */
  I.EXT_NEXT = { china: 'korea', tropic: 'seasia', korea: 'china', japan: 'china', steppe: 'china',
    espana: 'iberia', ottoman: 'arabia', masai: 'africa', inca: 'aztec',
    plains: 'woodland', pueblo: 'woodland', woodland: 'tropic' };
  I.extStyle = function (c) { return (c && I.EXT_BY_CITY[c.id]) || (c && I.EXT_BY_STYLE[c.style]) || null; };
  I.CULTURES = [['europe', '유럽'], ['islam', '이슬람권'], ['eastasia', '동아시아'], ['south', '인도·동남아시아'], ['native', '아프리카·아메리카 토착']];
  I.INTERIORS = [['harbor', '항구'], ['trade', '교역소'], ['shipyard', '조선소'], ['tavern', '술집'], ['inn', '여관'], ['market', '시장'], ['church', '교회·사원'], ['library', '도서관'], ['palace', '왕궁'], ['mansion', '저택'], ['guild', '조합'], ['gate', '성문'], ['home', '자택']];
  I.NPCS = [['trader', '교역소 주인'], ['vendor', '시장 상인'], ['harbormaster', '항구 관리인'], ['innkeeper', '여관 안주인'], ['tavernkeeper', '술집 주인'],
    ['shipwright', '조선소 목수'], ['priest', '성직자(신부·이맘·승려)'], ['librarian', '도서관 사서'], ['guildmaster', '조합장'], ['guard', '위병·수위·수비병'],
    ['butler', '저택 집사'], ['drunk', '술 취한 선원'], ['brawler', '거친 사내'], ['gambler', '포카 상대'], ['native', '원주민'], ['pirate', '해적 두목'],
    ['captain', '적 함장'], ['boatswain', '갑판장(부하가 없을 때)']];
  function cul(c) { return G.Art && G.Art.cultureOf ? G.Art.cultureOf(c) : 'europe'; }
  var K = I.chain = {};
  K.title = function () { return ['title']; };
  /** 발견 유물: 그 유물 그림, 없으면 종류 공통 그림 (relic-kinds/treasure 등) */
  K.relic = function (r) { return ['relics/' + r.id, 'relic-kinds/' + r.kind]; };
  /** town background: per-city file, then a numbered variant for the style (port / inland), then the style */
  K.bg = function (c) {
    var out = ['backgrounds/' + c.id];
    var base = 'bg-styles/' + c.style + (c.port ? '_port' : '_inland');
    var list = I.list(base + '_');
    if (list.length) out.push(list[Math.abs(G.U ? G.U.strHash('bg' + c.id) : c.id) % list.length]);
    out.push(base, 'bg-styles/' + c.style);
    return out;
  };
  /** building seen from the street: this very building, then the city, the culture, and the common one */
  K.exterior = function (kind, c, variant) {
    var out = [];
    if (variant) out.push('exteriors/' + kind + '@' + variant);
    out.push('exteriors/' + kind + '@' + c.id);
    var es = I.extStyle(c);
    if (es) {
      out.push('exterior-styles/' + es + '/' + kind);
      var nx = I.EXT_NEXT[es];
      if (nx) out.push('exterior-styles/' + nx + '/' + kind);
    }
    out.push('exteriors/' + kind + '_' + cul(c), 'exteriors/' + kind);
    return out;
  };
  /** 제독의 생김새 이름 — 만들기 화면에서 고른 얼굴 그림 portraits/player/<이름> 의 <이름> (기본 'admiral').
      이 이름으로 반신상·걷는 그림·일기토 시트를 고른다. 이름에 맞는 그림이 없으면 기본 제독 그림.
      저장된 player.look 이 먼저, 옛 저장 파일은 초상의 얼굴 그림에서 알아낸다. */
  var FACE = 'portraits/player/';
  I.heroLook = function (p) {
    if (!p) { var s = G.Game && G.Game.state; p = s && s.player; }
    if (!p) return 'admiral';
    if (p.look) return p.look;
    var keys = (G.Art && G.Art.portraitKeys && G.Art.portraitKeys(p.portrait)) || [];
    var k = keys.filter(function (x) { return x.indexOf(FACE) === 0; })[0];
    return k ? k.slice(FACE.length) : 'admiral';
  };
  /** the admiral walking along the street (drawn only when the file exists) */
  K.hero = function () { return ['characters/player']; };
  /** 걷는 그림 여러 장 (기본 제독 characters/walk_1 …, 다른 생김새는 characters/<이름>/walk_1 …) */
  K.heroWalk = function () {
    var id = I.heroLook(), l = id === 'admiral' ? [] : I.list('characters/' + id + '/walk_');
    return l.length ? l : I.list('characters/walk_');
  };
  /** 뛰는 그림 여러 장 (characters/<이름>/run_1 …, 기본 제독은 characters/run_1 …) — 없으면 거리에서 먼 길도 걷는 그림으로 간다 */
  K.heroRun = function () {
    var id = I.heroLook();
    return I.list(id === 'admiral' ? 'characters/run_' : 'characters/' + id + '/run_');
  };
  /** 수첩에서 보는 반신상 (기본 characters/player_half, 다른 생김새는 characters/player_half_<이름> — 없으면 코드 초상) */
  K.heroHalf = function () { var id = I.heroLook(); return [id === 'admiral' ? 'characters/player_half' : 'characters/player_half_' + id]; };
  /** 일기토에서 제독의 전투원 시트 (duel/fighters/<이름>, 없으면 main_admiral) */
  K.heroDuel = function () { var id = I.heroLook(); return (id === 'admiral' ? [] : ['duel/fighters/' + id]).concat(['duel/fighters/main_admiral']); };
  /** a landmark that only stands there to be looked at */
  K.landmark = function (id) { return ['landmarks/' + id]; };
  K.city = function (c, time) {
    var t = time && time !== 'day' ? time : null, out = [];
    if (t) out.push('cities/' + c.id + '_' + t);
    out.push('cities/' + c.id);
    if (t) out.push('city-styles/' + c.style + '_' + t);
    out.push('city-styles/' + c.style);
    return out;
  };
  K.interior = function (kind, c, variant) {
    var out = [];
    if (variant) out.push('interiors/' + kind + '@' + variant);
    out.push('interiors/' + kind + '@' + c.id, 'interiors/' + kind + '_' + cul(c), 'interiors/' + kind);
    return out;
  };
  /** 같은 역할이라도 도시마다 다른 얼굴이 나오도록: _f(여) _m(남) _2 _3 가 있으면 도시 번호로 하나를 고른다 */
  function variants(base, seed) {
    var opts = [];
    ['_f', '_m', '_2', '_3'].forEach(function (sfx) { if (I.has(base + sfx)) opts.push(base + sfx); });
    if (!opts.length) return [base];
    opts.push(base);
    var i = Math.abs(G.U ? G.U.strHash(seed + base) : 0) % opts.length;
    return opts[i] === base ? [base] : [opts[i], base];
  }
  // 한 도시 안에서 같은 얼굴이 두 건물에 나오지 않게 — 시장 상인·술집 주인·조선소 목수는 역할 공통 그림을 쓰지 않는다(전용 그림이 없으면 코드로 그린 얼굴)
  var NPC_ROLE_PORTRAIT = I.NPC_ROLE_PORTRAIT = { trader: 'merchant', harbormaster: 'captain', guildmaster: 'official', innkeeper: 'keeper',
    priest: 'priest', librarian: 'scholar', guard: 'soldier', brawler: 'soldier', drunk: 'sailor', gambler: 'sailor', butler: 'keeper', native: 'native', pirate: 'captain', captain: 'captain', boatswain: 'sailor' };
  /** 마을 사람 그림의 문화권 — 초원(st: 아스트라한·카잔·호브드·카라코룸)은 건물 안 모습과 달리 유럽 얼굴을 쓰지 않는다 */
  function npcCul(c) {
    if (c.style === 'st') return c.rel === 'I' ? 'islam' : 'steppe';
    return cul(c);
  }
  K.npc = function (id, c) {
    if (!c) return ['portraits/npc/' + id];
    var seed = 'npc' + c.id, role = NPC_ROLE_PORTRAIT[id], rolePic = role ? ['portraits/npc-roles/' + c.style + '/' + role] : [];
    var cc = npcCul(c), own = ['portraits/npc/' + id + '@' + c.id].concat(variants('portraits/npc/' + id + '_' + cc, seed));
    // 손으로 고른 건물 사람 그림(portraits/npc/<id>_<문화권>)이 먼저. 문화권 표시 없는 그림(captain·pirate·native 등)은
    // 유럽 사람 얼굴이라 유럽 밖에서는 그 고장의 역할 공통 그림(npc-roles) 뒤로 미룬다 (명나라 선장이 유럽인으로 나오지 않게)
    return cc === 'europe' ? own.concat(variants('portraits/npc/' + id, seed), rolePic) : own.concat(rolePic, variants('portraits/npc/' + id, seed));
  };
  /** 그 도시에서 고른 그림이 여자(f)인지 남자(m)인지 — 호칭을 맞출 때 쓴다 */
  I.npcGender = function (id, c) {
    var k = I.pick(K.npc(id, c));
    if (k && k.indexOf('portraits/npc-roles/') === 0 && G.Art && G.Art.rolePortraitGender) return G.Art.rolePortraitGender(NPC_ROLE_PORTRAIT[id], c.style);
    return !k ? null : /_f$/.test(k) ? 'f' : /_m$/.test(k) ? 'm' : null;
  };
  K.mate = function (id) { return ['portraits/mates/' + id]; };
  /** 새 항해사·후원자를 만들 때 쓰는 국가별 얼굴 묶음. 번호는 1~10이다. */
  K.peoplePool = function (kind, nation, gender, index) {
    return ['portraits/pools/' + kind + '/' + nation + '/' + gender + '/' + String(Math.max(1, Math.min(10, index || 1))).padStart(2, '0')];
  };
  /** 지역별 술집 여급 그림 (images/maid-styles/이름.png = 흉상, 이름_half.png = 서 있는 모습) */
  I.MAIDSTYLES = [['westeurope', '서유럽 맥주집'], ['iberia', '이베리아·안달루시아'], ['britain', '브리튼·아일랜드'], ['germany', '독일·북해'],
    ['france', '프랑스'], ['lowlands', '네덜란드·플랑드르'], ['greece', '그리스·마살리아'], ['slav', '슬라브·발트'],
    ['russia', '러시아·북방'], ['italy', '이탈리아'], ['arabia', '아랍·이집트'], ['ottoman', '오스만·레반트'],
    ['persia', '페르시아·중앙아시아'], ['india', '인도'], ['seasia', '동남아시아'], ['tropic', '열대 토착'],
    ['china', '중국'], ['japan', '일본'], ['korea', '조선'], ['africa', '아프리카'], ['native', '아메리카 토착']];
  /** 도시 style → 어울리는 여급 그림 묶음. 여급마다 묶음 안에서 한 장이 고정으로 뽑힌다 */
  I.MAID_POOL = {
    ib: ['iberia', 'france', 'westeurope', 'italy'], ne: ['westeurope', 'britain', 'germany', 'lowlands', 'slav'],
    it: ['italy', 'france', 'greece'], gr: ['greece', 'italy', 'ottoman'], ru: ['russia', 'slav'],
    is: ['arabia', 'ottoman', 'persia'], pe: ['persia', 'arabia'],
    af: ['africa', 'arabia'], sw: ['africa', 'arabia'], tr: ['tropic', 'native'],
    'in': ['india'], se: ['seasia', 'tropic'], cn: ['china'], jp: ['japan'], kr: ['korea'], st: ['persia', 'china'],
    co: ['iberia', 'france', 'westeurope'], az: ['native', 'tropic'], an: ['native', 'tropic'], na: ['native']
  };
  /** 이 여급에게는 이 묶음을 고정으로. 없으면 도시 style 후보에서 고른다 */
  I.MAID_FACE = {
    m_lis: 'iberia', m_sev: 'iberia', m_cad: 'westeurope', m_bar: 'italy',
    m_gra: 'arabia', m_ale: 'arabia', m_ist: 'ottoman', m_tun: 'ottoman',
    m_par: 'france', m_mar: 'greece', m_lon: 'britain', m_bri: 'britain', m_ams: 'lowlands', m_ant: 'lowlands',
    m_ham: 'germany', m_cph: 'russia', m_rig: 'slav', m_ven: 'italy', m_gen: 'france', m_nap: 'greece',
    m_goa: 'iberia', m_cal: 'india', m_mal: 'seasia', m_mac: 'china', m_nag: 'japan', m_han: 'korea'
  };
  /** 이 여급이 쓸 지역 묶음 이름 (없으면 null → 코드로 그린 초상) */
  I.maidStyle = function (id, c) {
    if (I.MAID_FACE[id]) return I.MAID_FACE[id];
    var pool = c && I.MAID_POOL[c.style];
    if (!pool || !pool.length) return null;
    return pool[Math.abs(G.U ? G.U.strHash('maid' + id) : 0) % pool.length];
  };
  /** 묶음 안에서 이 여급의 그림 한 장 (maid-styles/묶음/번호) */
  I.maidPic = function (id, c) {
    var st = I.maidStyle(id, c); if (!st) return null;
    var list = I.list('maid-styles/' + st + '/').filter(function (k) { return !/_half$/.test(k); });
    if (!list.length) return I.has('maid-styles/' + st) ? 'maid-styles/' + st : null;
    return list[Math.abs(G.U ? G.U.strHash('maidpic' + id) : 0) % list.length];
  };
  K.maid = function (id, c) {
    var out = ['portraits/maids/' + id], k = I.maidPic(id, c);
    if (k) out.push(k);
    return out;
  };
  /** 이름 있는 여급이 없는 도시의 술집에 서 있는 그 지역 여급 */
  I.maidPicCity = function (c) {
    var pool = c && I.MAID_POOL[c.style];
    if (!pool || !pool.length) return null;
    var st = pool[Math.abs(G.U ? G.U.strHash('city' + c.id) : 0) % pool.length];
    var list = I.list('maid-styles/' + st + '/').filter(function (k) { return !/_half$/.test(k); });
    if (!list.length) return I.has('maid-styles/' + st) ? 'maid-styles/' + st : null;
    return list[Math.abs(G.U ? G.U.strHash('citypic' + c.id) : 0) % list.length];
  };
  K.maidCity = function (c) { var k = I.maidPicCity(c); return k ? [k] : []; };
  K.maidCityHalf = function (c) { var k = I.maidPicCity(c); return k ? [k + '_half'] : []; };
  /** 술집에 서 있는 여급의 전신(무릎까지) 그림 */
  K.maidHalf = function (id, c) {
    var out = ['portraits/maids/' + id + '_half'], k = I.maidPic(id, c);
    if (k) out.push(k + '_half');
    return out;
  };
  /** holder: 1-based index into sp.holders (the person holding the title at that time) */
  K.sponsor = function (sp, holder) {
    var out = [];
    if (typeof holder === 'string' && holder) out.push('portraits/sponsors/' + holder);   // 다른 후원자의 그림을 빌림 (포르투갈 펠리페 1세 = 에스파냐 펠리페 2세)
    else if (holder) out.push('portraits/sponsors/' + sp.id + '_' + holder);
    out.push('portraits/sponsors/' + sp.id); return out;
  };
  K.rival = function (name) {
    var out = ['portraits/rivals/' + name];
    var m = (G.MATES || []).filter(function (x) { return x.name === name; })[0];
    if (m) out.push('portraits/mates/' + m.id);
    return out;
  };
  K.player = function (face) { var l = I.list('portraits/player/'); return l.length ? [l[((face || 0) % l.length + l.length) % l.length]] : []; };
  K.kid = function (sex, order) { var b = sex === 'f' ? 'daughter' : 'son'; return ['portraits/family/' + b + '_' + order, 'portraits/family/' + b]; };
  K.discovery = function (d) { return ['discoveries/' + d.id, 'discovery-cats/' + d.cat]; };
  K.ship = function (id) { return ['ships/' + id]; };
  K.shipNav = function (id) { return ['ships-nav/' + id]; };
  K.effect = function (id) { return ['effects/' + id]; };
  /** 일기토 전투원 6×4 시트와 초광폭 배경 */
  K.duelFighter = function (id) { return ['duel/fighters/' + id]; };
  K.duelBackground = function (id) { return ['duel/backgrounds/' + id]; };
})(window.G = window.G || {});
