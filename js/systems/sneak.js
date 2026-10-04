/* 잠입: 이교도·외국인을 들이지 않는 도시에 몰래 들어가기 — 성문(항구)에서 한 번 판정한다 (js/scenes/city.js C.handleEntry).
   조정값: js/data/base.js G.BALANCE.sneak

   · 이슬람 지역에서 이교도를 막는 곳 (SN.islamZone): 성지(메카·메디나) · 내륙 이슬람 도시 · 지중해 연안 이슬람 항구.
     이슬람 왕조가 다스리는 동안만 막는다 — 그라나다가 카스티야 땅이 되거나 카잔이 러시아 땅이 되면 그냥 들어간다 (SN.islamRuled).
     인도양·홍해·페르시아만·동아프리카·동남아시아의 이슬람 항구는 교역항이라 예전처럼 열려 있다.
   · 명나라 쇄국 도시(flags 'X')는 예전 그대로 막혀 있다.
   · 잠입 확률 (SN.chance): 갈래별 바탕 + 변장(터번·명나라 옷) + 그 고장 말 + 화술 + 그 고장 말을 모국어로 하는 동료
     − 악명 − 얼마 전 들킨 일. 「잠입한다」를 고르면 부관이 까닭을 하나하나 보여 준다.
   · 터번: 이슬람 도시에서 크게, 중국 항구(광주·천주 등 회회 상인이 오가던 곳)에서는 조금 도움. 명나라 옷: 중국 도시에서 크게 도움. */
(function (G) {
  'use strict';
  var SN = G.Sneak = {};
  function B() { return (G.BALANCE && G.BALANCE.sneak) || {}; }
  function S() { return G.Game && G.Game.state; }
  function num(v, d) { return v == null ? d : v; }

  /** 이교도를 막는 이슬람 지역의 자리 갈래: 'holy' 성지 · 'inland' 내륙 · 'med' 지중해 연안 항구 (아니면 null) */
  SN.islamZone = function (c) {
    if (!c || c.rel !== 'I') return null;
    if ((c.flags || '').indexOf('H') >= 0) return 'holy';
    if (!c.port) return 'inland';
    var m = B().med || [29, 41.5, -6.5, 37];   // 지중해 상자: 위도 남·북, 경도 서·동 (흑해·대서양·홍해는 빠진다)
    if (c.lat >= m[0] && c.lat <= m[1] && c.lon >= m[2] && c.lon <= m[3]) return 'med';
    return null;
  };
  /** 지금 이슬람 왕조가 다스리는가 — 유럽 나라 등(G.BALANCE.sneak.nonIslam)이 차지했으면 false */
  SN.islamRuled = function (c, own) {
    own = own || (G.R && G.R.cityOwner ? G.R.cityOwner(c) : c.nation);
    return (B().nonIslam || []).indexOf(own) < 0;
  };
  SN.ZONE_NAME = { holy: '이슬람 성지', inland: '내륙 이슬람 도시', med: '지중해 이슬람 항구' };

  /** 교섭으로 받은 통행 허가가 아직 살아 있는가 (passDays일) */
  SN.hasPass = function (c) {
    var s = S(); if (!s) return false;
    var d = s.flags['passD' + c.id];
    return d != null && s.day - d <= num(B().passDays, 365);
  };
  SN.givePass = function (c) { var s = S(); s.flags['pass' + c.id] = U().dateNum(s.date); s.flags['passD' + c.id] = s.day; };
  function U() { return G.U; }

  /** 이 도시에서 쓸 변장 도구 id (없으면 null) — 중국은 명나라 옷이 먼저 */
  SN.disguise = function (c, reason) {
    var R = G.R, china = reason === 'closed' || c.style === 'cn', islam = reason === 'holy' || reason === 'islam';
    if (china && R.hasItem('mingrobe')) return 'mingrobe';
    if ((china || islam) && R.hasItem('turban')) return 'turban';
    return null;
  };

  /** 잠입 확률과 그 까닭 { p, parts: [[까닭, 값]], dz: 변장 도구 id, tips: [부관의 귀띔] } */
  SN.chance = function (c, reason) {
    var b = B(), R = G.R, s = S(), parts = [], tips = [];
    var base = (b.base || {})[reason]; if (base == null) base = 0.3;
    parts.push([{ holy: '성지를 지키는 경비', islam: '이교도를 살피는 ' + (c.port ? '항구 관리' : '성문 경비'), closed: '쇄국의 관문', treaty: '조약을 지키는 수비대', wanted: '수배서를 든 경비' }[reason] || '성문 경비', base]);
    var china = reason === 'closed' || c.style === 'cn', islam = reason === 'holy' || reason === 'islam';
    var dz = SN.disguise(c, reason);
    if (dz === 'turban' && islam) parts.push(['터번 변장 — 이슬람 상인 행세', reason === 'holy' ? num(b.turbanHoly, 0.45) : num(b.turban, 0.35)]);
    else if (dz === 'turban' && china) parts.push([c.port ? '터번 변장 — 회회(무슬림) 상인 행세' : '터번 변장 — 내륙이라 회회 상인이 드물다', c.port ? num(b.turbanChinaPort, 0.12) : num(b.turbanChina, 0.04)]);
    else if (dz === 'mingrobe') parts.push(['명나라 옷 변장 — 명나라 상인 행세', num(b.mingrobe, 0.35)]);
    if (islam && !dz) tips.push('터번이 있으면 이슬람 상인처럼 보일 텐데요. (지중해·중근동·인도·동아프리카 시장)');
    if (china && dz !== 'mingrobe') tips.push('명나라 옷이 있으면 훨씬 수월할 겁니다. (조선·동남아시아 시장)');
    var lv = R.lang(c.lang);
    if (lv <= 0) { parts.push([G.LANGS[c.lang] + '를 못 한다', num(b.lang0, -0.1)]); tips.push(G.LANGS[c.lang] + '를 아는 통역이 있으면 낫습니다.'); }
    else parts.push([G.LANGS[c.lang] + ' ' + lv + '단계', lv * num(b.langLv, 0.06)]);
    var sp = R.skill('speech'); if (sp > 0) parts.push(['화술 ' + sp, sp * num(b.speech, 0.05)]);
    var nat = null;
    s.mates.forEach(function (m) { var d = G.MATE[m.id]; if (!nat && d && d.lg && (d.lg[c.lang] || 0) >= 3) nat = d; });
    if (nat) parts.push([nat.name + U().jx(nat.name, '이/가') + ' 그 고장 사람처럼 길잡이', num(b.native, 0.1)]);
    var no = s.player.notoriety || 0;
    if (no > 0) { var nv = -Math.min(num(b.notoMax, 0.2), no * num(b.noto, 0.003)); if (nv <= -0.01) parts.push(['악명 ' + no, nv]); }
    var ff = (s.flags.sneakFail || {})[c.id];
    if (ff != null && s.day - ff <= num(b.alertDays, 30)) parts.push(['얼마 전 들킨 일로 경계가 삼엄하다', num(b.alert, -0.15)]);
    var p = 0; parts.forEach(function (x) { p += x[1]; });
    p = Math.max(num(b.min, 0.05), Math.min(num(b.max, 0.95), p));
    return { p: p, parts: parts, dz: dz, tips: tips };
  };

  /** 부관이 보여 줄 표 (HTML) */
  SN.html = function (c, ch) {
    var pc = function (v) { return (v > 0 ? '+' : '') + Math.round(v * 100) + '%'; };
    return '<div style="font-size:18px;line-height:1.55">' + U().esc(c.name) + '에 몰래 들어갈 채비를 살펴보았습니다.' +
      '<table style="width:100%;margin:8px 0;border-collapse:collapse">' + ch.parts.map(function (x, i) {
        return '<tr><td style="padding:2px 6px">' + U().esc(x[0]) + '</td><td style="padding:2px 6px;text-align:right" class="' + (i === 0 ? '' : x[1] >= 0 ? 'good-text' : 'warn-text') + '">' + (i === 0 ? Math.round(x[1] * 100) + '%' : pc(x[1])) + '</td></tr>';
      }).join('') + '<tr style="border-top:1px solid rgba(128,128,128,.5)"><td style="padding:4px 6px"><b>성공할 가망</b></td><td style="padding:4px 6px;text-align:right"><b>' + Math.round(ch.p * 100) + '%</b></td></tr></table>' +
      (ch.tips.length ? '<div class="muted" style="font-size:15px">' + ch.tips.map(U().esc).join('<br>') + '</div>' : '') +
      '<div class="muted" style="font-size:15px;margin-top:4px">들키면 달아나거나, 벌금(가진 금화의 절반)을 물고 악명이 오릅니다.' + (ch.dz ? ' 변장 도구를 빼앗길 수도 있습니다.' : '') + '</div></div>';
  };

  /** 들켰다: 기록 · 변장 도구 압수 — 빼앗긴 도구 이름을 돌려준다 */
  SN.caught = function (c, ch) {
    var s = S(), b = B();
    (s.flags.sneakFail = s.flags.sneakFail || {})[c.id] = s.day;
    if (ch.dz && U().chance(num(b.confiscate, 0.5))) {
      var i = -1; s.player.items.forEach(function (it, k) { if (i < 0 && it.id === ch.dz) i = k; });
      if (i >= 0) { s.player.items.splice(i, 1); return G.ITEM[ch.dz].name; }
    }
    return null;
  };
})(window.G = window.G || {});
