/* 기함 선실 화면 (G.CabinView) — 배를 옆에서 자른 그림 위에 방을 늘어놓고, 방을 눌러 부하를 배치하거나(어디서나) 방을 고친다(조선소에서만).
   규칙은 js/systems/cabins.js, 방의 종류는 js/data/cabins.js. 배 그림은 코드로 그린다 (칸 크기는 G.FX.cabinView). */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, CV = {};
  G.CabinView = CV;
  function S() { return G.Game.state; }
  function CB() { return G.Cabins; }
  function L() { return (G.FX && G.FX.cabinView) || { w: 1000, tw: 130, th: 82, gap: 6, top: 112 }; }
  var ROLE_OF = { adjutant: 'first', helm: 'nav', lookout: 'surveyor' };

  /** 방과 칸의 자리 (왼쪽이 뱃머리, 오른쪽이 고물): 위 갑판에 갑판·조타실·부관실·함장실, 돛대 위에 파수대, 갑판 아래에 선실 */
  function layout(rooms) {
    var l = L(), n = rooms.length - 1, cols = Math.max(4, Math.min(CB().cols(), n)), rows = Math.max(1, Math.ceil(n / CB().cols()));
    var step = l.tw + l.gap, inner = cols * step - l.gap;
    var x0 = Math.round((l.w - inner) / 2) + 26, x1 = x0 + inner, deckY = l.top, lowY = deckY + l.th + 16;
    var at = function (j) { return x1 - j * step + l.gap; };          // 고물에서 j번째 자리
    return {
      cols: cols, rows: rows, x0: x0, x1: x1, deckY: deckY, lowY: lowY, h: lowY + rows * (l.th + l.gap) + 64,
      fixed: { captain: [at(1), deckY], adjutant: [at(2), deckY], helm: [at(3), deckY], deck: [at(4), deckY], lookout: [at(3), 8] },
      cell: function (i) { var k = i - 1; return [x0 + (k % CB().cols()) * step, lowY + Math.floor(k / CB().cols()) * (l.th + l.gap)]; }
    };
  }

  /** 배 그림: 하늘·바다·선체·돛대·돛 (방은 그 위에 DOM으로 얹는다) */
  function drawShip(cv, lay, sh) {
    var l = L(), W = l.w, H = lay.h, g = cv.getContext('2d');
    cv.width = W; cv.height = H;
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#b9cfd6'); sky.addColorStop(0.55, '#dfe3cf'); sky.addColorStop(1, '#e8dcb8');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    var deckLine = lay.deckY + l.th + 8, bottom = H - 30, bowX = lay.x0 - 96, sternX = lay.x1 + 22, water = bottom - 46;
    // 뒤쪽 바다
    g.fillStyle = '#6f9aa6'; g.fillRect(0, water, W, H - water);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
    for (var wy = water + 10; wy < H; wy += 16) { g.beginPath(); for (var wx = 0; wx <= W; wx += 20) g.lineTo(wx, wy + Math.sin(wx * 0.05 + wy) * 3); g.stroke(); }
    // 돛대와 돛 (큰 돛대는 파수대 아래, 앞 돛대는 갑판 위)
    var mainX = lay.fixed.lookout[0] + l.tw / 2, foreX = Math.max(lay.x0 + 40, lay.fixed.deck[0] - 40);
    var mast = function (x, top) { g.fillStyle = '#5b4026'; g.fillRect(x - 5, top, 10, deckLine - top); };
    var sail = function (x, y, w, h) {
      g.fillStyle = 'rgba(248,240,220,.82)'; g.strokeStyle = 'rgba(90,65,35,.6)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.quadraticCurveTo(x + w / 2 + 14, y + h / 2, x + w / 2, y + h); g.lineTo(x - w / 2, y + h); g.quadraticCurveTo(x - w / 2 + 14, y + h / 2, x - w / 2, y); g.fill(); g.stroke();
    };
    mast(foreX, 26); sail(foreX, 38, 150, lay.deckY - 54);
    mast(mainX, 4); sail(mainX, 30, 230, lay.deckY - 44);
    // 뱃머리 기움 돛대와 깃발
    g.strokeStyle = '#5b4026'; g.lineWidth = 7; g.beginPath(); g.moveTo(lay.x0 - 30, deckLine - 6); g.lineTo(bowX - 40, deckLine - 60); g.stroke();
    g.strokeStyle = 'rgba(70,50,30,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(bowX - 40, deckLine - 60); g.lineTo(foreX, 36); g.lineTo(mainX, 10); g.lineTo(sternX, lay.deckY - 14); g.stroke();
    g.fillStyle = '#b3402e'; g.beginPath(); g.moveTo(sternX, lay.deckY - 60); g.lineTo(sternX + 46, lay.deckY - 50); g.lineTo(sternX, lay.deckY - 40); g.fill();
    g.fillStyle = '#5b4026'; g.fillRect(sternX - 3, lay.deckY - 62, 5, 60);
    // 고물 누각 (조타실·부관실·함장실이 들어선다)
    var castleX = lay.fixed.helm[0] - 10;
    var wood = g.createLinearGradient(0, lay.deckY, 0, bottom);
    wood.addColorStop(0, '#8a6238'); wood.addColorStop(1, '#5a3d22');
    g.fillStyle = wood;
    g.beginPath(); g.moveTo(castleX, lay.deckY - 12); g.lineTo(sternX + 16, lay.deckY - 22); g.lineTo(sternX, deckLine); g.lineTo(castleX, deckLine); g.closePath(); g.fill();
    // 선체
    g.beginPath();
    g.moveTo(bowX - 14, deckLine - 12);
    g.lineTo(sternX, deckLine);
    g.quadraticCurveTo(sternX - 4, bottom - 20, sternX - 50, bottom);
    g.lineTo(lay.x0 - 10, bottom);
    g.quadraticCurveTo(bowX + 10, bottom - 14, bowX - 14, deckLine - 12);
    g.closePath(); g.fill();
    g.strokeStyle = '#3b2715'; g.lineWidth = 3; g.stroke();
    // 널빤지 줄
    g.save(); g.clip(); g.strokeStyle = 'rgba(40,25,12,.28)'; g.lineWidth = 1.5;
    for (var py = deckLine + 14; py < bottom; py += 16) { g.beginPath(); g.moveTo(bowX - 20, py); g.lineTo(sternX + 10, py); g.stroke(); }
    // 물 아래는 조금 어둡게
    g.fillStyle = 'rgba(40,70,85,.28)'; g.fillRect(0, water + 4, W, H);
    g.restore();
    // 갑판 난간
    g.strokeStyle = '#3b2715'; g.lineWidth = 4; g.beginPath(); g.moveTo(bowX - 14, deckLine - 12); g.lineTo(castleX, deckLine); g.stroke();
    // 배 이름
    g.fillStyle = 'rgba(255,240,205,.9)'; g.font = '700 20px serif'; g.textAlign = 'left';
    g.fillText(sh.name + '호 · ' + G.SHIP[sh.type].name, bowX + 34, bottom - 10);
  }

  function skillNote(m, c) {
    var R = G.R, ks = c.skills || G.ROLE_SKILLS[c.role] || [], best = null, lv = 0;
    ks.forEach(function (k) { var v = R.mateSkill(m, k); if (v > lv) { lv = v; best = k; } });
    return best ? G.SKILL_BY_ID[best].name + ' ' + lv : c.lang ? '통역' : ks.length ? '특기 없음' : '';
  }
  function loyalTag(m) {
    var lo = m.loyal == null ? 70 : m.loyal, e = CB().eff(m);
    return '<span class="cb-loyal' + (e < 1 ? ' low' : '') + '">충성 ' + Math.round(lo) + (e < 1 ? ' · 효율 ' + Math.round(e * 100) + '%' : '') + '</span>';
  }
  function face(id, size) { try { return G.Art.portraitCanvas(G.Scenes.mateSpec(id), size); } catch (e) { return U.el('span'); } }

  /** 방 한 칸 */
  function tile(c, pos, m, opts) {
    var l = L(), pow = opts.pow;
    var el = U.el('div', 'cb-room' + (c.fixed ? ' fixed' : '') + (c.id === 'hold' ? ' hold' : '') + (m || opts.admiral ? '' : ' empty'));
    el.style.left = pos[0] + 'px'; el.style.top = pos[1] + 'px'; el.style.width = l.tw + 'px'; el.style.height = l.th + 'px';
    el.title = c.name + ' — ' + c.desc + (c.fx ? '\n사람을 두면: ' + c.fx : '');
    var h = '<div class="cb-h">' + G.icon(c.icon) + '<b>' + c.name + '</b>' + (pow > 0 ? '<i class="cb-pow" title="방의 힘 (1 + 특기 단계, 충성이 낮으면 줄어든다)">' + (Math.round(pow * 10) / 10) + '</i>' : '') + '</div>';
    if (opts.admiral) h += '<div class="cb-who"><span class="cb-face"></span><span class="cb-nm"><span class="n1">' + U.esc(G.R.fullName ? G.R.fullName() : '제독') + '</span><small>제독</small></span></div>';
    else if (m) h += '<div class="cb-who"><span class="cb-face"></span><span class="cb-nm"><span class="n1">' + U.esc(G.MATE[m.id].name) + '</span><small>' + skillNote(m, c) + '</small></span></div>';
    else h += '<div class="cb-none">' + (c.id === 'hold' ? (opts.yard ? '눌러서 고친다' : '조선소에서 고친다') : '비어 있음') + '</div>';
    el.innerHTML = h;
    var f = el.querySelector('.cb-face');
    if (f && m) f.appendChild(face(m.id, 44));
    else if (f && opts.admiral) { try { if (S().player.portrait) f.appendChild(G.Art.portraitCanvas(S().player.portrait, 44)); else f.innerHTML = G.icon('crown'); } catch (e) { /* 얼굴 그림이 없으면 비워 둔다 */ } }
    return el;
  }

  function mateOptions(c, cur) {
    var s = S();
    var opts = s.mates.filter(function (m) { return G.MATE[m.id]; }).map(function (m) {
      return { label: G.MATE[m.id].name + (m === cur ? ' (지금 이 자리)' : ''), right: skillNote(m, c) + ' · ' + CB().placeName(m), value: m.id, icon: 'people', disabled: m === cur,
        desc: Object.keys(G.MATE[m.id].sk).map(function (k) { return G.SKILL_BY_ID[k].name + ' ' + G.MATE[m.id].sk[k]; }).join(' · ') };
    });
    if (cur) opts.push({ label: '자리를 비운다', value: '-', icon: 'boot' });
    return opts;
  }
  function mateById(id) { return S().mates.filter(function (m) { return m.id === id; })[0]; }
  function setRole(m, role) { var T = G.Scenes.city.B.tavern; if (m.room != null) CB().place(m, null); T.assign(m, role); }

  /** 방을 고른 뒤: 부하를 앉힌다 */
  async function pickFor(type, i) {
    var c = G.CABIN[type], role = ROLE_OF[type];
    var cur = role ? CB().roleMate(role) : CB().occupant(i);
    if (!S().mates.length) { UI.toast('배치할 부하가 없습니다. 술집에서 부하를 찾아보십시오.', 'people'); return; }
    var v = await UI.choose(c.name + '에 둘 사람', mateOptions(c, cur), { width: 640, icon: c.icon, text: c.desc + (c.fx ? '<br><span class="muted">사람을 두면: ' + c.fx + '</span>' : '') });
    if (v == null) return;
    if (v === '-') { if (role) { cur.role = 'none'; } else CB().place(cur, null); return; }
    var m = mateById(v); if (!m) return;
    if (role) setRole(m, role); else CB().place(m, i);
  }
  /** 부하를 고른 뒤: 어느 방에 둘지 */
  async function pickRoom(m) {
    var rooms = CB().rooms(), d = G.MATE[m.id], opts = [];
    ['adjutant', 'helm', 'lookout'].forEach(function (t) {
      var c = G.CABIN[t], o = CB().roleMate(ROLE_OF[t]);
      opts.push({ label: c.name, right: skillNote(m, c) + (o && o !== m ? ' · ' + G.MATE[o.id].name + '와 교대' : o === m ? ' · 지금 이 자리' : ''), value: 'r:' + t, icon: c.icon, desc: c.desc, disabled: o === m });
    });
    rooms.forEach(function (t, i) {
      if (t === 'hold') return;
      var c = G.CABIN[t], o = CB().occupant(i);
      opts.push({ label: c.name, right: skillNote(m, c) + (o && o !== m ? ' · ' + G.MATE[o.id].name + ' 대신' : o === m ? ' · 지금 이 자리' : ''), value: 'c:' + i, icon: c.icon, desc: c.desc + (c.fx ? ' — ' + c.fx : ''), disabled: o === m });
    });
    if (m.room != null || ROLE_OF_INV(m.role)) opts.push({ label: '자리에서 뺀다 (대기)', value: '-', icon: 'boot' });
    var v = await UI.choose(d.name + '의 자리', opts, { width: 620, text: Object.keys(d.sk).map(function (k) { return G.SKILL_BY_ID[k].name + ' ' + d.sk[k]; }).join(' · ') + ' — ' + loyalTag(m) });
    if (v == null) return;
    if (v === '-') { if (m.room != null) CB().place(m, null); if (ROLE_OF_INV(m.role)) m.role = 'none'; return; }
    if (v.indexOf('r:') === 0) setRole(m, ROLE_OF[v.slice(2)]); else CB().place(m, +v.slice(2));
  }
  function ROLE_OF_INV(role) { return role === 'first' || role === 'nav' || role === 'surveyor'; }

  /** 조선소: 선실 i를 다른 방으로 고친다 */
  async function remodel(i, c0) {
    var s = S(), rooms = CB().rooms(), now = rooms[i];
    var opts = G.CABINS.filter(function (c) { return !c.fixed; }).map(function (c) {
      return { label: c.name, right: c.id === now ? '지금 이 방' : c.cost ? U.num(c.cost) + '닢 · ' + c.days + '일' : '비운다', value: c.id, icon: c.icon, disabled: c.id === now, desc: c.desc + (c.fx ? ' — ' + c.fx : '') };
    });
    var v = await UI.choose('선실 고치기', opts, { width: 640, icon: 'hammer', text: '소지금 ' + U.num(s.player.gold) + '닢. 방마다 맞는 특기를 가진 부하를 두어야 힘을 냅니다.' });
    if (v == null) return;
    var c = G.CABIN[v];
    if (c.cost > s.player.gold) { UI.toast('돈이 모자랍니다. (' + U.num(c.cost) + '닢)', 'coin'); return; }
    if (c.cost && !await UI.confirm(G.CABIN[now].name + U.j(G.CABIN[now].name, '을/를').slice(G.CABIN[now].name.length) + ' ' + c.name + U.j(c.name, '으로/로').slice(c.name.length) + ' 고치겠습니까? (금화 ' + U.num(c.cost) + '닢 · ' + c.days + '일)', '고친다', '그만둔다')) return;
    s.player.gold -= c.cost;
    CB().remodel(i, v);
    if (c.days) await UI.fade(function () { G.Game.passDays(c.days); });
    UI.toast(c.id === 'hold' ? '선실을 비웠다.' : c.name + U.j(c.name, '을/를').slice(c.name.length) + ' 꾸몄다.', c.icon);
    if (G.Game.cityHud && c0) G.Game.cityHud(); else if (G.Game.refreshHud) G.Game.refreshHud();
  }

  /** 지금 힘을 내는 방들의 효과 풀이 */
  function effects() {
    var rooms = CB().rooms(), seen = {}, out = [];
    ['adjutant', 'helm', 'lookout'].concat(rooms).forEach(function (t) {
      if (seen[t]) return; seen[t] = 1;
      var c = G.CABIN[t], p = CB().power(t);
      if (c && c.fx && p > 0) out.push('<li><b>' + c.name + '</b> <i class="cb-pow">' + (Math.round(p * 10) / 10) + '</i> ' + c.fx + '</li>');
    });
    return out.length ? '<ul class="cb-fx">' + out.join('') + '</ul>' : '<div class="muted">아직 힘을 내는 방이 없습니다. 방에 맞는 특기를 가진 부하를 배치하십시오.</div>';
  }

  /** 선실 화면을 연다. opts.yard = 조선소가 있는 도시(방을 고칠 수 있다) */
  CV.open = async function (opts) {
    opts = opts || {};
    var s = S();
    for (;;) {
      var sh = CB().flagship();
      if (!sh) { UI.toast('기함이 없습니다.', 'ship'); return; }
      CB().tidy();
      var rooms = CB().rooms(), lay = layout(rooms), l = L();
      var wage = CB().wages(), warn = CB().wageWarning();
      var html = '<div class="cb-top"><span>' + G.icon('bed') + '선실 <b>' + (rooms.length - 1) + '</b>칸 <small class="muted">(큰 배일수록 많다)</small></span>' +
        '<span>' + G.icon('people') + '부하 <b>' + s.mates.length + '</b>명</span>' +
        '<span' + (warn ? ' class="warn-text"' : '') + '>' + G.icon('coin') + '급료 한 달 <b>' + U.num(wage) + '</b>닢' + (warn ? ' — 가진 돈으로 ' + Math.max(0, warn.months) + '달' : '') + '</span>' +
        '<span class="muted">' + (opts.yard ? '방을 누르면 고치거나 사람을 둡니다.' : '방을 누르면 사람을 둡니다. 방을 고치는 일은 조선소에서.') + '</span></div>' +
        '<div class="cb-ship" style="width:' + l.w + 'px;height:' + lay.h + 'px"><canvas></canvas></div>' +
        '<div class="cb-sub">부하 <small class="muted">— 눌러서 자리를 정한다. 맞닿은 방에서 지내면 서로의 말을 더 빨리 익히고, 석 달·아홉 달·두 해를 함께하면 제독의 모국어를 한 단계씩 배운다. 자리가 없는 부하는 달마다 충성이 떨어진다.</small></div>' +
        '<div class="cb-roster"></div><div class="cb-sub">지금 힘을 내는 방</div>' + effects();
      var win = UI.window({ title: '기함 선실 — ' + U.esc(sh.name) + '호', icon: 'ship', width: l.w + 56, html: html, buttons: [{ label: '닫는다', value: null }], clickAny: false });
      var box = win.content.querySelector('.cb-ship');
      drawShip(box.querySelector('canvas'), lay, sh);
      var add = function (c, pos, m, o, act) { var t = tile(c, pos, m, o); t.onclick = function () { win.close(act); }; box.appendChild(t); };
      add(G.CABIN.captain, lay.fixed.captain, null, { admiral: true }, { k: 'captain' });
      ['adjutant', 'helm', 'lookout'].forEach(function (t) { add(G.CABIN[t], lay.fixed[t], CB().roleMate(ROLE_OF[t]), { pow: CB().power(t) }, { k: 'fixed', type: t }); });
      rooms.forEach(function (t, i) {
        add(G.CABIN[t], i === 0 ? lay.fixed.deck : lay.cell(i), CB().occupant(i), { pow: CB().powerAt(i), yard: opts.yard }, { k: 'room', i: i });
      });
      var ros = win.content.querySelector('.cb-roster');
      s.mates.forEach(function (m) {
        var d = G.MATE[m.id]; if (!d) return;
        var idle = (!m.role || m.role === 'none') && m.room == null;
        var chip = U.el('div', 'cb-mate' + (idle ? ' idle' : ''), '<span class="cb-face"></span><span class="cb-nm"><span class="n1">' + U.esc(d.name) + '</span><small>' + U.esc(CB().placeName(m)) + '</small>' + loyalTag(m) + '</span>');
        chip.querySelector('.cb-face').appendChild(face(m.id, 40));
        chip.title = Object.keys(d.sk).map(function (k) { return G.SKILL_BY_ID[k].name + ' ' + d.sk[k]; }).join(' · ');
        chip.onclick = function () { win.close({ k: 'mate', id: m.id }); };
        ros.appendChild(chip);
      });
      if (!s.mates.length) ros.innerHTML = '<div class="muted">부하가 없습니다. 술집에서 부하를 찾아보십시오.</div>';
      var a = await win.result;
      if (!a) return;
      if (a.k === 'captain') await UI.say('함장실은 제독의 방입니다. 맞닿은 부관실 사람과는 말을 빨리 익힙니다.', G.Scenes.mateSpeaker ? G.Scenes.mateSpeaker('first') : {});
      else if (a.k === 'fixed') await pickFor(a.type);
      else if (a.k === 'mate') { var mm = mateById(a.id); if (mm) await pickRoom(mm); }
      else if (a.k === 'room') {
        var type = rooms[a.i];
        if (a.i === 0) await pickFor('deck', 0);
        else if (!opts.yard) { if (type === 'hold') UI.toast('빈 선실입니다. 조선소의 「개조」에서 쓰임을 정할 수 있습니다.', 'hammer'); else await pickFor(type, a.i); }
        else if (type === 'hold') await remodel(a.i, opts.yard);
        else {
          var w = await UI.choose(G.CABIN[type].name, [{ label: '부하를 배치한다', value: 'p', icon: 'people' }, { label: '다른 방으로 고친다', value: 'r', icon: 'hammer' }], { width: 420 });
          if (w === 'p') await pickFor(type, a.i); else if (w === 'r') await remodel(a.i, opts.yard);
        }
      }
    }
  };
})(window.G = window.G || {});
