/* 교역 순이익 금화비: 100닢마다 금화 하나가 제독에게 떨어진다. */
(function (G) {
  'use strict';
  var F = {}, active = null;
  G.TradeFX = F;

  function cfg() { return (G.FX && G.FX.tradeProfit) || {}; }
  function coinCount(profit) {
    var per = Math.max(1, cfg().perCoin || 100);
    return profit > 0 ? Math.max(1, Math.round(profit / per)) : 0;
  }
  F.coinCount = coinCount;

  function src(key) { return G.Img && G.Img.src ? G.Img.src(key) : 'images/' + key + '.png'; }
  function heroSrc() {
    if (!G.Img || !G.Img.chain || !G.Img.chain.heroHalf) return null;
    var key = G.Img.pick(G.Img.chain.heroHalf());
    return key ? G.Img.src(key) : null;
  }
  function stop(run) {
    run = run || active;
    if (!run) return;
    if (run.raf) cancelAnimationFrame(run.raf);
    if (run.layer && run.layer.parentNode) run.layer.remove();
    if (active === run) active = null;
  }
  F.stop = stop;

  /* 인물의 머리와 양 어깨를 하나의 완만한 곡면으로 근사한다. */
  function heroSurface(x, size, w, h, heroH) {
    var dx = x + size * 0.5 - w * 0.5;
    var reach = heroH * 0.35;
    if (Math.abs(dx) > reach) return null;
    var u = Math.abs(dx) / reach;
    var top = h - 18 - heroH;
    return top + heroH * (0.055 + Math.pow(u, 1.55) * 0.34);
  }

  function animate(run, coins, opt) {
    var before = performance.now(), lifeMs = opt.lifeMs;
    function frame(now) {
      if (active !== run || !run.layer.parentNode) return;
      var elapsed = now - run.started;
      var dt = Math.min(0.034, Math.max(0.001, (now - before) / 1000));
      before = now;
      for (var i = 0; i < coins.length; i++) {
        var p = coins[i], age = elapsed - p.delay;
        if (age < 0) { p.el.dataset.phase = 'waiting'; continue; }
        var prevY = p.y;
        if (!p.floor) {
          p.vy += opt.gravity * dt;
          var air = Math.max(0, 1 - opt.airDrag * dt);
          p.vx *= air;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.angle += p.spin * dt;
          p.flip += p.flipV * dt;

          var surface = p.hitHero ? null : heroSurface(p.x, p.size, opt.w, opt.h, opt.heroH);
          if (surface !== null && p.vy > 0 && p.y + p.size >= surface && prevY + p.size <= surface + 18) {
            var side = p.x + p.size * 0.5 < opt.w * 0.5 ? -1 : 1;
            if (Math.abs(p.x + p.size * 0.5 - opt.w * 0.5) < 12) side = Math.random() < 0.5 ? -1 : 1;
            p.y = surface - p.size;
            p.vy = -Math.abs(p.vy) * (0.25 + Math.random() * 0.17);
            p.vx += side * opt.scatter * (0.62 + Math.random() * 0.7);
            p.spin += side * (260 + Math.random() * 480);
            p.flipV += (Math.random() - 0.5) * 620;
            p.hitHero = true;
            p.el.dataset.phase = 'scatter';
          } else {
            p.el.dataset.phase = p.hitHero ? 'scatter' : 'fall';
          }

          if (p.y >= p.ground) {
            p.y = p.ground;
            if (p.bounces < 3 && Math.abs(p.vy) > 115) {
              p.vy = -Math.abs(p.vy) * opt.bounce * (0.78 + Math.random() * 0.34);
              p.vx += (Math.random() - 0.5) * 80;
              p.spin += (Math.random() - 0.5) * 210;
              p.bounces++;
              p.el.dataset.phase = 'bounce';
            } else {
              p.floor = true;
              p.vy = 0;
              p.el.dataset.phase = 'roll';
            }
          }
        } else {
          var friction = Math.exp(-opt.floorFriction * dt);
          p.vx *= friction;
          p.flipV *= Math.exp(-1.55 * dt);
          var rollSpin = p.vx / Math.max(8, p.size * 0.5) * 57.3;
          p.spin += (rollSpin - p.spin) * Math.min(1, dt * 4.2);
          p.x += p.vx * dt;
          p.angle += p.spin * dt;
          p.flip += p.flipV * dt;
          p.y = p.ground + Math.sin(p.flip * Math.PI / 180) * Math.min(3, Math.abs(p.flipV) / 170);
          p.el.dataset.phase = Math.abs(p.vx) + Math.abs(p.spin) > 18 ? 'roll' : 'rest';
        }

        if (p.x < -p.size * 0.2) { p.x = -p.size * 0.2; p.vx = Math.abs(p.vx) * 0.55; }
        if (p.x > opt.w - p.size * 0.8) { p.x = opt.w - p.size * 0.8; p.vx = -Math.abs(p.vx) * 0.55; }
        var fade = Math.max(0, Math.min(1, (lifeMs - elapsed) / 520));
        p.el.style.opacity = String(fade);
        p.el.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotate(' + p.angle.toFixed(1) + 'deg)';
        p.im.style.transform = 'rotateY(' + p.flip.toFixed(1) + 'deg)';
      }
      if (elapsed >= lifeMs) { stop(run); return; }
      run.raf = requestAnimationFrame(frame);
    }
    run.started = performance.now();
    run.raf = requestAnimationFrame(frame);
  }

  F.profit = function (profit) {
    var logical = coinCount(profit), ui = document.getElementById('ui');
    if (!logical || !ui) return { logical: logical, shown: 0, heavy: false };
    var C = cfg(), shown = Math.min(logical, C.maxCoins || 120), heavy = logical >= (C.showerAt || 18);
    stop();
    var layer = document.createElement('div');
    layer.className = 'trade-profit-fx' + (heavy ? ' heavy' : '');
    layer.dataset.profit = String(Math.round(profit));
    layer.dataset.coins = String(logical);
    layer.dataset.shown = String(shown);
    layer.dataset.physics = 'ballistic';
    layer.style.setProperty('--hero-h', (C.heroH || 470) + 'px');

    var hs = heroSrc();
    if (hs) {
      var hero = document.createElement('img');
      hero.className = 'trade-profit-hero'; hero.src = hs; hero.alt = '';
      layer.appendChild(hero);
    }

    var cs = src('effects/trade_coin');
    var w = G.Game && G.Game.uiW ? G.Game.uiW() : 1600;
    var h = G.Game && G.Game.uiH ? G.Game.uiH() : 900;
    var span = heavy ? w * 0.86 : Math.min(460, w * 0.4);
    var minMs = C.minMs || 1450, maxMs = C.maxMs || 4800;
    var totalMs = Math.min(maxMs, minMs + Math.sqrt(logical) * 210);
    var coins = [];
    for (var i = 0; i < shown; i++) {
      var coin = document.createElement('span'), im = document.createElement('img');
      var size = (heavy ? 29 : 39) + Math.random() * (heavy ? 25 : 27);
      var startX = w * 0.5 + (Math.random() - 0.5) * span;
      var targetX = w * 0.5 + (Math.random() - 0.5) * (heavy ? 210 : 115);
      var delay = heavy ? Math.random() * Math.max(380, totalMs - 1050) : i * 150 + Math.random() * 100;
      var flight = 0.72 + Math.random() * 0.32;
      coin.className = 'trade-profit-coin';
      coin.style.setProperty('--size', Math.round(size) + 'px');
      coin.dataset.phase = 'waiting';
      im.src = cs; im.alt = ''; coin.appendChild(im); layer.appendChild(coin);
      coins.push({
        el: coin, im: im, size: size, delay: delay,
        x: startX, y: -size - Math.random() * 170,
        vx: (targetX - startX) / flight + (Math.random() - 0.5) * 95,
        vy: 30 + Math.random() * 125,
        angle: Math.random() * 360, spin: (Math.random() - 0.5) * 760,
        flip: Math.random() * 360, flipV: (Math.random() < 0.5 ? -1 : 1) * (620 + Math.random() * 980),
        ground: h - size - 22 - Math.random() * 23,
        bounces: 0, hitHero: false, floor: false
      });
    }
    ui.appendChild(layer);
    var run = { layer: layer, raf: 0, started: 0 };
    active = run;
    animate(run, coins, {
      w: w, h: h, heroH: C.heroH || 470, lifeMs: totalMs + 1250,
      gravity: C.gravity || 1480, bounce: C.bounce || 0.34,
      floorFriction: C.floorFriction || 2.6, airDrag: C.airDrag || 0.08,
      scatter: C.scatter || 340
    });
    if (G.Audio && G.Audio.coinRain) G.Audio.coinRain(logical);
    return { logical: logical, shown: shown, heavy: heavy };
  };
})(window.G = window.G || {});
