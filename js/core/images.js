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
  var failAt = {}, askedAt = {};        // 못 읽은 때 · 읽기 시작한 때 (ms)
  /* 그림 읽기 조정값 (js/data/seafx.js 의 G.FX.img — 이 파일이 먼저 읽히므로 쓸 때마다 본다)
     tries: 한 그림을 몇 번까지 다시 받나 · retryMs: 다시 받기 전 쉬는 시간 · stallMs: 이만큼 소식이 없으면 끊고 다시
     failHold: 끝내 못 받은 그림을 이만큼 지난 뒤 다시 받아 본다(그동안만 코드 그림) · waitMs: 장면이 그림을 기다리는 가장 긴 시간
     slowMs: 이보다 오래 걸리면 「그림을 불러오는 중」 표시 · decodeMs: 미리 풀기를 기다리는 가장 긴 시간 · graceMs: 움직이는 그림(배·부대)이 코드 그림 대신 비워 두고 기다리는 시간 */
  var DEF = { tries: 3, retryMs: [400, 1500], stallMs: 45000, failHold: 20000, waitMs: 12000, slowMs: 500, graceMs: 8000, decodeMs: 1200, keep: 900 };
  function CF(k) { var c = G.FX && G.FX.img; return c && c[k] != null ? c[k] : DEF[k]; }
  function now() { return window.performance && performance.now ? performance.now() : Date.now(); }

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
    files = null; imgs = {}; state = {}; waiters = {}; blobs = {}; cityAsked = {}; failAt = {}; askedAt = {}; packs = {}; used = {}; okN = 0;
  };
  I.count = function () { return Object.keys(man()).length; };
  /** sorted keys that start with prefix */
  I.list = function (prefix) { return Object.keys(man()).filter(function (k) { return !prefix || k.indexOf(prefix) === 0; }).sort(natural); };
  function natural(a, b) { return a.localeCompare(b, undefined, { numeric: true }); }
  /** 이 그림 파일이 있나. 끝내 못 받은 그림은 얼마 동안(failHold) 없는 것으로 치고(코드 그림·다음 후보), 그 뒤에는 다시 받아 본다 */
  I.has = function (k) {
    if (!k || !man()[k]) return false;
    if (state[k] !== 'fail') return true;
    if (now() - failAt[k] < CF('failHold')) return false;
    delete state[k]; delete failAt[k]; delete askedAt[k];
    var pk = packOf(k); if (pk >= 0 && packFail[pk]) { delete packs[pk]; delete packFail[pk]; }
    return true;
  };
  function failed(k) { state[k] = 'fail'; failAt[k] = now(); }
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
  var packs = {}, packFail = {}, PACK = /^pack:(\d+)$/;
  function packOf(k) { var m = PACK.exec(man()[k] || ''); return m ? +m[1] : -1; }
  function loadPack(i) {
    if (packs[i]) return packs[i];
    var url = (G.IMAGE_PACK_URLS || [])[i];
    packs[i] = new Promise(function (resolve) {
      if (!url) { packFail[i] = 1; return resolve(false); }
      var n = 0;
      function attempt() {
        var s = document.createElement('script');
        s.src = url; s.async = true;
        s.onload = function () {
          var m = G.IMAGE_FILES || {}, tag = 'pack:' + i, done = {}, any = false;
          for (var k in files) if (files[k] === tag && m[k] && m[k] !== tag) { files[k] = m[k]; done[holder(k)] = k; any = true; }
          // 읽기 전에 I.src 로 자리표 주소를 받아 간 <img> 를 진짜 그림으로 바꾼다
          if (any) Array.prototype.forEach.call(document.querySelectorAll('img[src^="data:image/svg+xml"]'), function (im) { var k = done[im.getAttribute('src')]; if (k) im.src = I.src(k); });
          resolve(true);
        };
        s.onerror = function () {
          if (s.parentNode) s.parentNode.removeChild(s);
          if (++n < CF('tries')) { setTimeout(attempt, retryDelay(n)); return; }
          packFail[i] = 1;
          if (window.console) console.warn('[그림 교체] 그림 묶음을 불러오지 못했습니다: ' + url);
          resolve(false);
        };
        document.head.appendChild(s);
      }
      attempt();
    });
    return packs[i];
  }
  function retryDelay(n) { var r = CF('retryMs') || []; return r[Math.min(n - 1, r.length - 1)] || 500; }
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
      else { var k = job.slice(2); if (state[k] || !I.has(k)) continue; p = I.load(k); }
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
      I.NPCS.forEach(function (n) { add(K.npc(n[0], c)); add(K.npcHalf(n[0], c)); });
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
    if (/^(blob:|https?:|\/_blob\/)/.test(f)) return f;   // 아티팩트의 자산 저장소(/_blob/…)에 올린 그림은 그 주소 그대로
    return BASE + f.split('/').map(encodeURIComponent).join('/');
  };
  I.get = function (k) { if (state[k] !== 'ok') return null; used[k] = ++clock; return imgs[k]; };
  /* 읽어 둔 그림이 keep 장을 넘으면 가장 오래 안 쓴 것부터 놓아 준다 (오래 놀수록 메모리가 끝없이 불어나지 않게).
     놓아 준 그림은 다음에 쓸 때 다시 읽는다 — 브라우저 캐시에 있어 금방이다. 그리고 있는 쪽이 쥐고 있는 그림은 그대로 남는다. */
  var used = {}, clock = 0, okN = 0;
  function trimCache() {
    var keep = CF('keep'); if (okN <= keep) return;
    var ks = Object.keys(imgs).sort(function (a, b) { return (used[a] || 0) - (used[b] || 0); }), drop = Math.min(ks.length, okN - Math.round(keep * 0.8));
    for (var i = 0; i < drop; i++) { var k = ks[i]; if (clock - (used[k] || 0) < 40) break; delete imgs[k]; delete state[k]; delete used[k]; delete askedAt[k]; okN--; }
  }
  I.status = function (k) { return state[k] || (man()[k] ? 'idle' : 'none'); };
  /** 그림 하나를 읽는다 → Promise<img|null>. 못 받으면 몇 번 다시 받고(tries), 받은 뒤에는 미리 풀어 둔다(decode —
      처음 그릴 때 멈칫하거나 덜 풀린 채 그려지지 않게). 끝내 못 받아야 null (그때에만 코드 그림으로 돌아간다) */
  I.load = function (k) {
    var pk = k ? packOf(k) : -1;
    if (pk >= 0) {
      if (!askedAt[k]) askedAt[k] = now();
      return loadPack(pk).then(function (ok) {
        if (ok && packOf(k) < 0) return I.load(k);
        failed(k); return null;
      });
    }
    return new Promise(function (resolve) {
      if (!I.has(k)) return resolve(null);
      if (state[k] === 'ok') { used[k] = ++clock; return resolve(imgs[k]); }
      (waiters[k] = waiters[k] || []).push(resolve);
      if (state[k] === 'loading') return;
      state[k] = 'loading';
      if (!askedAt[k]) askedAt[k] = now();
      fetchImg(k, 0);
    });
  };
  function fetchImg(k, n) {
    var im = new Image(), over = false, timer = 0;
    im.decoding = 'async';
    function end(ok) {
      if (over) return; over = true;
      if (timer) clearTimeout(timer);
      im.onload = im.onerror = null;
      if (state[k] !== 'loading') return;                       // 그 사이 I.reset
      if (ok) { state[k] = 'ok'; imgs[k] = im; used[k] = ++clock; okN++; flush(k, im); trimCache(); return; }
      if (n + 1 < CF('tries')) { setTimeout(function () { if (state[k] === 'loading') fetchImg(k, n + 1); }, retryDelay(n + 1)); return; }
      failed(k);
      if (window.console) console.warn('[그림 교체] 파일을 불러오지 못했습니다: ' + (I.path(k) || k));
      flush(k, null);
    }
    im.onload = function () {
      var fin = function () { end(!!(im.naturalWidth || im.width)); };
      // 미리 풀기는 화면이 그려질 때 처리된다 — 탭이 가려져 있거나 화면 갱신이 멈춰 있으면 끝나지 않으므로 오래 기다리지 않는다
      if (im.decode && !document.hidden) { im.decode().then(fin, fin); setTimeout(fin, CF('decodeMs')); } else fin();
    };
    im.onerror = function () { end(false); };
    timer = setTimeout(function () { try { im.src = ''; } catch (e) { /* 무시 */ } end(false); }, CF('stallMs'));
    im.src = I.src(k);
  }
  /** 곧 그릴 그림: 기다리지 않고 읽기만 시작한다 (이미 읽는 중·읽었으면 아무 일도 하지 않는다 — 매 장면 불러도 가볍다) */
  I.want = function (k) { if (k && !state[k] && man()[k]) I.load(k); };
  /** 이 그림을 아직 받는 중인가 — 움직이는 그림(배·부대·사람)이 코드 그림을 잠깐 내보이는 대신 비워 두고 기다릴 때 쓴다.
      너무 오래(graceMs) 걸리면 false 를 돌려주어 코드 그림이라도 보이게 한다. 읽기 시작하지 않았으면 시작한다 */
  I.pending = function (k) {
    if (!k || !man()[k] || state[k] === 'ok' || state[k] === 'fail') return false;
    if (!state[k]) I.load(k);
    return now() - (askedAt[k] || now()) < CF('graceMs');
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
  /** 여러 자리의 그림을 읽는다. 다 읽으면(또는 끝내 못 읽으면) 풀린다. 장면은 이것을 기다렸다가 뜬다 —
      예전에는 1.5초만 기다리고 코드 그림으로 넘어가, 느린 연결에서는 코드 그림(각진 임시 그림)이나 빈 배경이 그대로 남았다.
      이제 waitMs(또는 더 긴 ms)까지 기다리고, slowMs 가 넘으면 「그림을 불러오는 중」을 띄운다. quiet: 표시 없이 */
  I.preload = function (chains, ms, quiet) {
    var list = (chains || []).filter(function (c) { return I.pick(c); });
    if (!list.length) return Promise.resolve();
    if (list.every(function (c) { return I.get(I.pick(c)); })) return Promise.resolve();
    var all = Promise.all(list.map(I.resolve)), cap = Math.max(ms || 0, CF('waitMs'));
    var p = Promise.race([all, new Promise(function (r) { setTimeout(r, cap); })]);
    if (!quiet) { busy(1); p.then(function () { busy(-1); }); }
    return p;
  };
  /* 「그림을 불러오는 중」 표시 — 기다림이 slowMs 를 넘을 때만 보인다 */
  var busyN = 0, busyEl = null, busyTimer = 0;
  function busy(d) {
    busyN = Math.max(0, busyN + d);
    if (busyN && !busyTimer && !(busyEl && busyEl.parentNode)) busyTimer = setTimeout(function () {
      busyTimer = 0; if (!busyN) return;
      if (!busyEl) { busyEl = document.createElement('div'); busyEl.className = 'img-loading'; busyEl.innerHTML = '<i></i><span>그림을 불러오는 중…</span>'; }
      (document.getElementById('ui') || document.body).appendChild(busyEl);
    }, CF('slowMs'));
    if (!busyN) { if (busyTimer) { clearTimeout(busyTimer); busyTimer = 0; } if (busyEl && busyEl.parentNode) busyEl.parentNode.removeChild(busyEl); }
  }
  /** 그림과 관계된 일(p)을 waitMs(또는 더 긴 ms)까지 기다린다 — 그동안 「그림을 불러오는 중」 표시. 시간이 넘으면 null */
  I.wait = function (p, ms) {
    var cap = Math.max(ms || 0, CF('waitMs'));
    var r = Promise.race([p, new Promise(function (res) { setTimeout(function () { res(null); }, cap); })]);
    busy(1); r.then(function () { busy(-1); }, function () { busy(-1); });
    return r;
  };
  /** 지금 장면이 그림을 기다리는 중인가 */
  I.busy = function () { return busyN > 0; };

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
      opts: {fit:'cover'|'contain', fx, fy, bg, post(ctx,w,h,key)} . returns true when an override exists.
      procedural: 그림을 끝내 못 받았을 때 대신 그릴 코드 그림 */
  I.apply = function (cv, chain, opts, procedural) {
    opts = opts || {};
    var key = I.pick(chain); if (!key) return false;
    function shown() {
      if (cv.classList) cv.classList.remove('img-wait');
      if (G.Game && G.Game._sceneSrc === cv && G.Game.setScene) G.Game.setScene(cv);
    }
    function paint(res) {
      var ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
      if (!res) {            // 끝내 못 받았다 → 코드 그림
        if (procedural) { try { var pc = procedural(); if (pc && pc !== cv) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h); ctx.drawImage(pc, 0, 0, w, h); ctx.restore(); } } catch (e) { console.error(e); } }
        shown(); return;
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      if (opts.bg) { ctx.fillStyle = opts.bg; ctx.fillRect(0, 0, w, h); }
      if (opts.fit === 'contain') I.drawContain(ctx, res.img, 0, 0, w, h);
      else I.drawCover(ctx, res.img, 0, 0, w, h, opts.fx, opts.fy);
      ctx.restore();
      if (opts.post) { ctx.save(); opts.post(ctx, w, h, res.key); ctx.restore(); }
      cv.setAttribute('data-img', res.key);
      shown();
    }
    var ready = I.get(key);
    if (ready) paint({ key: key, img: ready });
    else I.resolve(chain).then(paint);
    return true;
  };
  /** canvas w×h showing the override when there is one, otherwise procedural().
      그림이 있는데 아직 받는 중이면 코드 그림을 먼저 내보이지 않는다 — 빈 판(바탕색만)으로 기다렸다가 그림이 오면 그린다.
      (받는 동안 각진 코드 그림이 보였다가 바뀌던 문제) 끝내 못 받으면 그때 코드 그림. */
  I.make = function (chain, w, h, procedural, opts) {
    var key = I.pick(chain);
    if (!key) return procedural();
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    if (!I.get(key)) {
      cv.className = 'img-wait';
      if (opts && opts.bg) { var c = cv.getContext('2d'); c.fillStyle = opts.bg; c.fillRect(0, 0, w, h); }
    }
    I.apply(cv, chain, opts, procedural);
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
    ['woodland', '북미 숲 마을'], ['plains', '북미 평원 마을'], ['pueblo', '푸에블로'],
    ['kraal', '아프리카 벌집 오두막 마을'], ['tent', '사하라·사헬 천막 진영']];
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
    230: 'plains', 243: 'plains', 241: 'pueblo', 242: 'pueblo',
    // 아프리카 부족 마을 (js/data/tribes.js): 줄루·코사·산은 벌집 오두막, 풀라니·투아레그는 천막, 아샨티는 흙벽 마을 (마사이·오로모는 마사이 묶음, 베르베르는 아랍)
    298: 'kraal', 300: 'kraal', 305: 'kraal', 303: 'tent', 306: 'tent', 308: 'africa' };
  /** 그 묶음에 없는 건물은 이웃 묶음에서 빌려 온다 */
  I.EXT_NEXT = { china: 'korea', tropic: 'seasia', korea: 'china', japan: 'china', steppe: 'china',
    espana: 'iberia', ottoman: 'arabia', masai: 'africa', inca: 'aztec',
    plains: 'woodland', pueblo: 'woodland', woodland: 'tropic', kraal: 'masai', tent: 'africa' };
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
  /** 일반 소지품: 그 물건 그림, 없으면 종류 공통 그림 */
  K.item = function (it) { return ['items/' + it.id, 'item-kinds/' + it.kind, 'relic-kinds/' + it.kind]; };
  /** 발견 유물: 그 유물 그림, 같은 이름의 일반 물건, 종류 공통 그림 순 */
  K.relic = function (r) { return ['relics/' + r.id, 'items/' + r.id, 'relic-kinds/' + r.kind]; };
  /** 교역품: 품목별 그림, 없으면 갈래 공통 그림 */
  K.good = function (g) { return ['goods/' + g.id, 'good-kinds/' + g.cat]; };
  /** 소지품(일반 물건·유물) 그림의 주소 — 선택 창·알림·대화 단추의 작은 그림용. 그림이 없으면 null (코드로 그린 그림을 쓰는 자리는 I.make) */
  I.itemSrc = function (it) {
    if (!it) return null;
    var id = it.id || it, d = (G.ITEM && G.ITEM[id]) || it, rl = G.RELIC && G.RELIC[id];
    var k = I.pick(rl ? K.relic(rl) : d && d.kind ? K.item(d) : []);
    return k ? I.src(k) : null;
  };
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
    // 뒤를 이은 아들(옛 저장): 아버지의 생김새 폴더에서 온 그림이면 그 생김새를 잇는다
    var hk = I.heirKid(p);
    if (hk && hk.sex !== 'f' && hk.folder && I.has(FACE + hk.folder)) return hk.folder;
    // 옛 저장 파일은 초상에 못 박힌 젊은 얼굴이나 seed의 얼굴 번호에서 직접 알아낸다.
    // A.portraitKeys는 현재 나이에 따라 40대 얼굴을 돌려주므로 여기서 부르면 서로 재귀한다.
    var spec = p.portrait || {}, keys = spec.img ? [].concat(spec.img) : [];
    if (!keys.length) {
      var m = /^player(\d+)/.exec(String(spec.seed || ''));
      if (m) keys = K.player(+m[1]);
    }
    var k = keys.filter(function (x) { return x.indexOf(FACE) === 0; })[0];
    return k ? k.slice(FACE.length) : 'admiral';
  };
  /** 생김새 이름 (만들기 화면·수첩에 보이는 이름표) — 파일 이름 → 한글 이름. 없으면 파일 이름 그대로 */
  I.HERO_NAMES = {
    admiral: '기본 제독', ganghui: '중세의 연금술사', navigator_white: '하얀 남방의 항해사', armored_navigator: '철갑 항해사',
    sea_dog: '망원경을 든 뱃사람', muscle_swordsman: '근육질 검사', hat_spinner: '모자를 돌리는 항해사',
    charismatic_admiral: '카리스마 제독', battle_vanguard: '돌격대장', noble_scholar: '귀족 학자 제독',
    casanova: '카사노바', army_officer: '정규군 장교', sky_adventurer: '가죽옷 모험가', blackcoat_captain: '검은 코트의 선장'
    // 이름 있는 인물 16명(레오나르두 드 발렌사 …)은 20대·40대 얼굴이 없어 항구의 부하 후보로 옮겼다 (js/data/storycrew.js)
  };
  I.heroName = function (id) { return I.HERO_NAMES[id] || id; };
  /** 제독이 40세 이상이면 수염 난 그림을 쓴다. 만들기 화면은 age를 직접 넘긴다. */
  I.heroOld = function (p, age) {
    if (age == null) {
      var s = G.Game && G.Game.state;
      if (!p) p = s && s.player;
      age = s && p === s.player && G.R && G.R.age ? G.R.age() : null;
    }
    return age != null && age >= 40;
  };
  /** 뒤를 이은 자녀(2대부터)의 가족 그림 정보 {sex, folder} — 저장된 player.heir, 옛 저장은 초상에 붙은 가족 그림 이름에서 알아낸다. 1대 제독은 null */
  I.heirKid = function (p) {
    if (!p) { var s = G.Game && G.Game.state; p = s && s.player; }
    if (!p || !(p.generation > 1)) return null;
    if (p.heir) return p.heir;
    var keys = [].concat((p.portrait && p.portrait.img) || []), m = null;
    keys.some(function (x) { m = /^portraits\/family\/(?:([a-z_]+)\/)?(son|daughter)/.exec(String(x)); return !!m; });
    return m ? { sex: m[2] === 'daughter' ? 'f' : 'm', folder: m[1] || '' } : null;
  };
  /** 뒤를 이은 자녀가 제독이 되었을 때의 얼굴·무릎상(half) 후보 — portraits/family/<폴더>/son_age15(_half) → son_age15(_half).
      아들은 heirYoung(20)살이 되기 전까지만 소년의 모습이고 그 뒤로는 아버지의 생김새(젊은 얼굴 → 40대 얼굴)를 잇는다. 딸은 늘 딸의 그림. 해당 없으면 null */
  function heirChain(p, half, age) {
    var hk = I.heirKid(p); if (!hk) return null;
    if (hk.sex !== 'f') {
      if (age == null) { var s = G.Game && G.Game.state; if (!p) p = s && s.player; age = s && p === s.player && G.R && G.R.age ? G.R.age() : null; }
      var lim = (G.BALANCE && G.BALANCE.family && G.BALANCE.family.heirYoung) || 20;
      if (age == null || age >= lim) return null;
    }
    var b = hk.sex === 'f' ? 'daughter' : 'son', sf = half ? '_half' : '', P = 'portraits/family/', out = [];
    if (hk.folder) out.push(P + hk.folder + '/' + b + '_age15' + sf);
    out.push(P + b + '_age15' + sf);
    return out;
  }
  I.heirChain = heirChain;
  /** 대화창 얼굴: 40대 그림이 있으면 먼저, 없으면 고른 젊은 얼굴. 뒤를 이은 자녀는 가족 그림(아들은 스무 살 전까지)이 먼저 */
  K.heroPortrait = function (p, age) {
    var id = I.heroLook(p), young = FACE + id, old = 'portraits/player-aged/' + id;
    var hc = heirChain(p, false, age); if (hc) return hc.concat([young]);
    return I.heroOld(p, age) ? [old, young] : [young];
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
  /** 수첩에서 보는 무릎상. 40세부터 수염 난 그림이 있으면 자동으로 바꾼다. */
  K.heroHalf = function () {
    var id = I.heroLook(), young = id === 'admiral' ? 'characters/player_half' : 'characters/player_half_' + id;
    var old = id === 'admiral' ? 'characters/player_half_old' : 'characters/player_half_' + id + '_old';
    var hc = heirChain(null, true); if (hc) return hc.concat([young]);   // 뒤를 이은 자녀의 전신상
    return I.heroOld() ? [old, young] : [young];
  };
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
    var st = I.folkStyle(c);
    if (st === 'st') return c.rel === 'I' ? 'islam' : 'steppe';
    return cul(st === c.style ? c : { id: c.id, style: st, rel: c.rel });
  }
  /** 그 도시에 사는 사람들(건물 사람·여급·수비병)의 생김새 양식. 대개 도시 양식(c.style)과 같지만,
      건물은 유럽식이어도 사는 사람은 그 고장 사람인 곳이 있다 — 아프리카의 포르투갈 거점(베르데 곶·산토메)은 아프리카 사람,
      중앙아메리카·카리브 해안의 토착 도시(열대 양식 tr — 그림 묶음은 아프리카 사람)는 아메리카 토착민, 라사는 티베트(초원 양식) 사람.
      후원자(왕·총독)는 이 표와 상관없이 제 그림을 쓴다 */
  I.FOLK_STYLE = { 90: 'af', 99: 'af', 139: 'st', 208: 'az', 209: 'az', 211: 'an', 212: 'an', 213: 'an' };
  I.folkStyle = function (c) { return !c ? 'ib' : I.FOLK_STYLE[c.id] || c.style; };
  K.npc = function (id, c) {
    if (!c) return ['portraits/npc/' + id];
    var seed = 'npc' + c.id, role = NPC_ROLE_PORTRAIT[id], rolePic = role ? ['portraits/npc-roles/' + I.folkStyle(c) + '/' + role] : [];
    var cc = npcCul(c), own = ['portraits/npc/' + id + '@' + c.id].concat(variants('portraits/npc/' + id + '_' + cc, seed));
    // 손으로 고른 건물 사람 그림(portraits/npc/<id>_<문화권>)이 먼저. 문화권 표시 없는 그림(captain·pirate·native 등)은
    // 유럽 사람 얼굴이라 유럽 밖에서는 그 고장의 역할 공통 그림(npc-roles) 뒤로 미룬다 (명나라 선장이 유럽인으로 나오지 않게)
    return cc === 'europe' ? own.concat(variants('portraits/npc/' + id, seed), rolePic) : own.concat(rolePic, variants('portraits/npc/' + id, seed));
  };
  /** 그 도시에서 고른 그림이 여자(f)인지 남자(m)인지 — 호칭을 맞출 때 쓴다 */
  I.npcGender = function (id, c) {
    var k = I.pick(K.npc(id, c));
    if (k && k.indexOf('portraits/npc-roles/') === 0 && G.Art && G.Art.rolePortraitGender) return G.Art.rolePortraitGender(NPC_ROLE_PORTRAIT[id], I.folkStyle(c));
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
    // 아프리카(af 사헬·서아프리카, sw 스와힐리 해안, tr 열대 아프리카)는 아프리카·아랍 사람만. 열대(tropic) 묶음은 동남아·태평양 얼굴이라 동남아에만 쓴다
    af: ['africa', 'arabia'], sw: ['africa', 'arabia'], tr: ['africa'],
    'in': ['india'], se: ['seasia', 'tropic'], cn: ['china'], jp: ['japan'], kr: ['korea'], st: ['persia', 'china'],
    co: ['iberia', 'france', 'westeurope'], az: ['native'], an: ['native'], na: ['native']
  };
  /** 도시 하나만 따로: 라사(티베트)는 초원 양식이지만 여급은 중국 묶음에서 */
  I.MAID_POOL_CITY = { 139: ['china'] };
  /** 묶음 폴더 안에 섞여 있지만 그 고장 사람으로 보이지 않는 그림 — 1 = 어디서도 쓰지 않음, 문자열 = 그 도시 양식에서만 쓴다
      (아프리카 묶음의 금발·붉은 머리, 아랍 묶음의 유럽 옷차림 두 장, 동남아 묶음의 깃털 머리띠(아메리카 토착민 차림), 페르시아 묶음의 동아시아 얼굴은 초원에서만) */
  I.MAID_BAN = { 'maid-styles/africa/9': 1, 'maid-styles/africa/11': 1, 'maid-styles/arabia/2': 1, 'maid-styles/arabia/3': 1,
    'maid-styles/seasia/5': 1, 'maid-styles/persia/3': 'st' };
  /** 이 도시의 여급 그림 묶음 후보 */
  I.maidPool = function (c) { return !c ? null : I.MAID_POOL_CITY[c.id] || I.MAID_POOL[I.folkStyle(c)] || null; };
  /** 묶음 폴더의 흉상 그림들 — 그 고장에 맞지 않는 그림은 뺀다 */
  function maidList(st, c) {
    var fs = c ? I.folkStyle(c) : null;
    return I.list('maid-styles/' + st + '/').filter(function (k) {
      if (/_half$/.test(k)) return false;
      var b = I.MAID_BAN[k];
      return !b || (typeof b === 'string' && b === fs);
    });
  }
  I.maidList = maidList;
  /** 이 여급에게는 이 묶음을 고정으로. 없으면 도시 style 후보에서 고른다 */
  I.MAID_FACE = {
    m_lis: 'iberia', m_sev: 'iberia', m_cad: 'westeurope', m_bar: 'italy',
    m_gra: 'arabia', m_ale: 'arabia', m_ist: 'ottoman', m_tun: 'ottoman',
    m_par: 'france', m_mar: 'greece', m_lon: 'britain', m_bri: 'britain', m_ams: 'lowlands', m_ant: 'lowlands',
    m_ham: 'germany', m_cph: 'russia', m_rig: 'slav', m_ven: 'italy', m_gen: 'france', m_nap: 'greece',
    m_goa: 'iberia', m_cal: 'india', m_mal: 'seasia', m_mac: 'china', m_nag: 'japan', m_han: 'korea',
    // 유럽 여급 46명 — 자기 초상(portraits/maids/<id>)이 오기 전까지 쓰는 지역 묶음
    m_opo: 'iberia', m_bil: 'westeurope', m_tol: 'iberia', m_zar: 'iberia', m_cor: 'arabia', m_val: 'italy', m_tls: 'france', m_rou: 'france',
    m_trs: 'france', m_nan: 'westeurope', m_bdx: 'france', m_lyo: 'france', m_brg: 'lowlands', m_bxl: 'lowlands', m_sou: 'britain', m_edi: 'britain',
    m_dub: 'britain', m_lub: 'germany', m_brm: 'germany', m_kol: 'germany', m_ffm: 'germany', m_sxb: 'westeurope', m_nur: 'germany', m_aug: 'westeurope',
    m_pra: 'slav', m_vie: 'westeurope', m_dan: 'slav', m_kgb: 'slav', m_war: 'slav', m_bud: 'germany', m_sto: 'russia', m_bgo: 'lowlands',
    m_mil: 'italy', m_flo: 'italy', m_rom: 'italy', m_pal: 'greece', m_rag: 'italy', m_nov: 'russia', m_mos: 'russia', m_kie: 'slav',
    m_bel: 'slav', m_ath: 'greece', m_sal: 'iberia', m_can: 'greece', m_fam: 'greece', m_kaf: 'ottoman'
  };
  /** 이 여급이 쓸 지역 묶음 이름 (없으면 null → 코드로 그린 초상) */
  I.maidStyle = function (id, c) {
    if (I.MAID_FACE[id]) return I.MAID_FACE[id];
    var pool = I.maidPool(c);
    if (!pool || !pool.length) return null;
    return pool[Math.abs(G.U ? G.U.strHash('maid' + id) : 0) % pool.length];
  };
  /** 묶음 안에서 이 여급의 그림 한 장 (maid-styles/묶음/번호) */
  I.maidPic = function (id, c) {
    var st = I.maidStyle(id, c); if (!st) return null;
    var list = maidList(st, c);
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
    var pool = I.maidPool(c);
    if (!pool || !pool.length) return null;
    var st = pool[Math.abs(G.U ? G.U.strHash('city' + c.id) : 0) % pool.length];
    var list = maidList(st, c);
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
  /** 대화에서 쓰는 무릎상 (머리부터 무릎까지 서 있는 모습, 1024×1536, 투명) — 흉상 그림 이름 + _half.
      두 사람 다 무릎상이 있으면 대화창이 서 있는 모습으로 크게 바뀐다 (js/ui/ui.js dialogShell) */
  K.mateHalf = function (id) {
    var out = ['portraits/mates/' + id + '_half'];
    // 전용 얼굴이 없는 동료도 현재 얼굴과 같은 문화권·성별의 무릎상을 빌린다.
    if (G.Art && G.Art.mateSpec && G.Art.portraitKeys) {
      out = out.concat(K.halfOf(G.Art.portraitKeys(G.Art.mateSpec(id))));
    }
    return out.filter(function (k, i) { return out.indexOf(k) === i; });
  };
  /* 마을 사람 흉상(portraits/npc/<이름>)의 성별 — 이름 끝 _f·_m, 아니면 대개 남자 (여관 안주인 innkeeper_europe만 여자) */
  var NPC_FEMALE = { 'portraits/npc/innkeeper_europe': 1 };
  function npcKeyGender(k) {
    if (/_f(_\d+)?$/.test(k)) return 'f';
    if (/_m(_\d+)?$/.test(k)) return 'm';
    var r = /^portraits\/npc-roles\/([a-z]+)\/([a-z]+)$/.exec(k);
    if (r) return G.Art && G.Art.rolePortraitGender ? G.Art.rolePortraitGender(r[2], r[1]) : null;
    if (/^portraits\/npc\//.test(k)) return NPC_FEMALE[k.replace(/@\d+$/, '')] ? 'f' : 'm';
    return null;
  }
  /** 흉상 사슬 → 그 사람의 무릎상 후보 (말하는 사람에게 half가 없을 때 js/ui/ui.js가 쓴다).
      · 이름 있는 사람(동료·후원자·여급·경쟁자): 사슬에 든 그 사람 그림마다 <그림>_half
      · 마을 사람(portraits/npc·npc-roles): 지금 보이는 흉상의 <그림>_half, 없으면 같은 고장·같은 성별의 역할 무릎상 */
  K.halfFor = function (chain) {
    chain = [].concat(chain || []);
    var out = [], picked = I.pick(chain);
    chain.forEach(function (k) { if (/^portraits\/(mates|sponsors|courtiers|maids|rivals)\//.test(k) && !/_half$/.test(k)) out.push(k + '_half'); });
    if (picked && /^maid-styles\//.test(picked) && !/_half$/.test(picked)) out.push(picked + '_half');   // 이름 없는 그 고장 여급 (술집 여급 무릎상과 같은 그림)
    if (picked && /^portraits\/(npc|npc-roles|pools)\//.test(picked)) {
      out.push(picked + '_half');
      var g = npcKeyGender(picked);
      if (g) chain.forEach(function (k) { if (/^portraits\/npc-roles\//.test(k) && npcKeyGender(k) === g) out.push(k + '_half'); });
    }
    return out.filter(function (k, i) { return out.indexOf(k) === i; });
  };
  K.halfOf = function (chain) { return [].concat(chain || []).filter(function (k) { return /^portraits\/(rivals|npc|npc-roles|mates|sponsors|courtiers|maids|pools|legendary)\//.test(k) && !/_half$/.test(k); }).map(function (k) { return k + '_half'; }); };
  /** 마을 사람 무릎상: 흉상과 같은 후보 순서를 그대로 따른다. */
  K.npcHalf = function (id, c) { return K.halfOf(K.npc(id, c)); };
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
  /** 경쟁자 전용 그림이 먼저, 없을 때 같은 인물의 동료 그림을 잇는다. */
  K.rivalHalf = function (name) { return K.halfOf(K.rival(name)); };
  /** 제독 만들기에서 고를 수 있는 얼굴: 20대(portraits/player/)와 40대(portraits/player-aged/) 그림이 모두 있는 것만. 40대 그림이 하나도 없으면 있는 대로 */
  I.heroFaces = function () {
    var all = I.list('portraits/player/'), both = all.filter(function (k) { return I.has('portraits/player-aged/' + k.slice('portraits/player/'.length)); });
    return both.length ? both : all;
  };
  K.player = function (face) { var l = I.heroFaces(); return l.length ? [l[((face || 0) % l.length + l.length) % l.length]] : []; };
  /** 아이 그림: 나이(stage 5·10·15)와 어머니 고장(region 폴더)에 맞는 것부터 — portraits/family/<고장>/daughter_age10(_half) → daughter_age10(_half) → daughter_<몇째> → daughter.
      half = 무릎상(대화창 위에 서는 모습). 고르는 규칙은 js/systems/homelife.js (G.FAMILY_LOOK) */
  K.kid = function (sex, order, stage, region, half) {
    var b = sex === 'f' ? 'daughter' : 'son', sf = half ? '_half' : '', P = 'portraits/family/', out = [];
    if (stage) { if (region) out.push(P + region + '/' + b + '_age' + stage + sf); out.push(P + b + '_age' + stage + sf); }
    if (half) out.push(P + b + '_half'); else out.push(P + b + '_' + order, P + b);
    return out;
  };
  /** 자택 장면 그림 (js/art/homeart.js) — images/events/home/<이름> */
  K.homeEvent = function (name) { return ['events/home/' + name]; };
  K.discovery = function (d) { return ['discoveries/' + d.id, 'discovery-cats/' + d.cat]; };
  K.ship = function (id) { return ['ships/' + id]; };
  K.effect = function (id) { return ['effects/' + id]; };
  /** 육상전 지형별 초광폭 배경 */
  K.landWarBackground = function (terrain) { return ['landwar/backgrounds/' + terrain]; };
})(window.G = window.G || {});
