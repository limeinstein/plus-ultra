/* 특허 회사의 건물 — 회사 본부 · 상관 · 거래소 (규칙: js/systems/company.js · 자료: js/data/company.js) — 2026-11-04
   단추는 「나온다」까지 8개 이하 (사용자 요청 2026-11-04). 고르기 창도 8개 이하.
   ■ 회사 본부 (company, arg = 회사 id): 사원 명부(입회·승진·탈퇴) · 회사 임무 · 독점품 납품 · 주식 창구
   ■ 상관 (factory): 한 도시에 회사가 여럿이면 한 건물 — 「다른 회사 상관으로」로 바꾼다. 회사 창고 · 중개 주문서 · 회사 임무 · 상관장과 이야기
   ■ 거래소 (exchange): 시세표 · 주식을 산다 · 주식을 판다 · 중개인의 귀띔 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city;
  function S() { return G.Game.state; }
  function CO() { return G.Company; }
  function num(n) { return U.num(Math.round(n)); }
  function pct(d) { return (d >= 0 ? '▲' : '▼') + Math.abs(Math.round(d * 1000) / 10) + '%'; }
  function me() { var p = S().player; return { name: p.name, portrait: p.portrait }; }
  function clerk(co) { return CO().staff('guildmaster', co.short + ' 서기', co); }
  function chief(co) { return CO().staff('trader', co.short + ' 상관장', co); }
  function broker() { return CO().staff('vendor', '중개인'); }

  // ================================================================ 함께 쓰는 것
  /** 회사 임무 게시판 (본부·상관) */
  async function missions(c, co, who) {
    var X = CO(), m = X.mission();
    if (m) {
      if (X.reportHere(c, m)) {
        var r = X.report(c);
        await UI.say(m.kind === 'prize' ? '「' + m.name + '」호를 잡았다는 소식은 벌써 들었소! 이사회가 크게 기뻐하오. 약속한 포상금이오.' : '장부에 적었소. 그 바다가 한결 조용해졌다는구려. 수고했소.', who);
        await UI.alert('<b>' + U.esc(m.title) + '</b><br>' + (m.kind === 'prize' ? '회사 포상금' : '보수') + ' 금화 <b>' + num(r.pay) + '</b>닢' + (r.merit ? ' · 공헌 +' + r.merit : '') + (r.fame ? ' · 전투 명성 +' + r.fame : ''), '회사 임무 완수');
        if (G.Audio) G.Audio.sfx('coin');
        return;
      }
      var v = await UI.ask('맡은 회사 임무 — ' + X.missionText(m), [{ label: '계속한다', value: null }, { label: '임무를 그만둔다' + (X.isMember(m.co) ? ' (공헌 −' + G.BALANCE.company.failMerit + ')' : ''), value: 'drop' }], who);
      if (v === 'drop' && await UI.confirm('「' + U.esc(m.title) + '」' + U.jx(m.title, '을/를') + ' 그만둘까요?', '그만둔다', '계속한다')) { X.abandon(); UI.toast('회사 임무를 그만두었다.', 'scroll'); }
      return;
    }
    if (X.rival(co)) { await UI.say(G.COMPANY[X.state().member].short + ' 사람에게 회사 일을 맡길 수는 없소. 우리 장부를 그쪽에 넘기려는 속셈이 아니라면 말이오.', who); return; }
    var offs = X.offers(c, co);
    if (!offs.length) { await UI.say('지금은 맡길 일이 없소. 한 달쯤 지나면 게시판이 바뀌오.' + (X.isMember(co) ? '' : ' 회사 사람이 되면 더 큰 일을 맡길 수 있소.'), who); return; }
    var rows = offs.map(function (o, i) { return { label: X.KINDS[o.kind].name + ' — ' + U.esc(o.title), icon: X.KINDS[o.kind].icon, right: '금화 ' + num(o.pay) + (o.merit ? ' · 공헌 ' + o.merit : ''), value: i, desc: o.desc }; });
    rows.push({ label: '돌아간다', icon: 'boot', value: -1 });
    var pickN = await UI.choose(co.short + ' 회사 임무', rows, { icon: 'scroll', width: 900, text: X.isMember(co) ? U.esc(X.rankName(co, X.rank(co))) + '에게 맡길 수 있는 일 — 한 번에 하나만 맡는다.' : '회사 사람이 아니면 단속 일만 맡을 수 있다 (보수 60% · 공헌 없음).' });
    if (pickN == null || pickN < 0) return;
    var o = offs[pickN];
    var ok = await UI.ask(o.desc + ' — 기한 ' + o.days + '일 · ' + (o.kind === 'convoy' ? '수수료 최대' : o.kind === 'prize' ? '포상금' : '보수') + ' 금화 ' + num(o.pay) + '닢', [{ label: '맡는다', value: 'yes' }, { label: '그만둔다', value: null }], who);
    if (ok !== 'yes') return;
    X.accept(o);
    var line = { patrol: '좋소. 놈들을 쳐부수고 돌아오면 본부든 상관이든 알려 주시오.', convoy: '회사선 선장들에게 그대의 깃발을 따르라고 일러 두었소. 해적과 경쟁사 놈들이 냄새를 맡을 테니 조심하시오. 본부 부두에서 기다리겠소.', found: '물자는 그대가 마련해야 하오. 목재·대포·총을 싣고 가서 그 고장 사람들과 담판을 지으시오.', prize: '그 배 한 척이 작은 나라의 한 해 세금만큼 싣고 다니오. 붙잡든 가라앉히든, 놈들 장부에 구멍을 내시오.' }[o.kind];
    await UI.say(line, who);
    UI.toast('회사 임무를 맡았다 — ' + o.title, X.KINDS[o.kind].icon, 5200);
  }
  /** 주식을 산다 (fixed: 그 회사만) */
  async function buyStock(c, fixed) {
    var X = CO(), s = S(), list = fixed ? [fixed] : X.actives();
    if (!list.length) { UI.toast('아직 주식을 파는 회사가 없다.', 'chart'); return; }
    var co = fixed;
    if (!co) {
      var v = await UI.choose('주식을 산다 — 소지금 ' + num(s.player.gold) + '닢', list.map(function (x) { return { label: U.esc(x.name), icon: 'seal', right: num(X.ask(x)) + '닢 ' + pct(X.change(x)), value: x.id }; }).concat([{ label: '돌아간다', icon: 'boot', value: null }]), { icon: 'chart', width: 720 });
      if (!v) return; co = G.COMPANY[v];
    }
    var ask = X.ask(co), have = X.state().shares[co.id] || 0, mx = X.canBuy(co), K2 = G.BALANCE.company.stock;
    if (mx < 1) { UI.toast(have >= K2.cap ? '이 회사 주식은 더 살 수 없다 (' + K2.cap + '주까지).' : X.room() < ask ? '투자 한도에 닿았다 — 주식에 넣은 돈은 금화 ' + num(K2.investCap) + '닢까지 (지금 ' + num(X.invested()) + '닢). 팔면 다시 살 수 있다.' : '금화가 모자란다 (1주 ' + num(ask) + '닢).', 'coin', 5200); return; }
    var n = await UI.number({ title: co.name + ' ' + co.cert + ' 사기', text: '1주에 금화 ' + num(ask) + '닢 (액면 ' + num(co.face) + ' · 한 해 배당 약 ' + num(X.divPer(co)) + '닢). 가진 주식 ' + have + '주. 투자 한도 남은 금화 ' + num(X.room()) + '닢.', min: 1, max: mx, value: Math.min(mx, 10), unit: '주',
      info: function (k) { return '합계 금화 <b>' + num(k * ask) + '</b>닢 · 남는 돈 ' + num(s.player.gold - k * ask) + '닢'; } });
    if (!n) return;
    var cost = X.buy(co, n);
    if (cost) { UI.toast(co.short + ' ' + n + '주를 샀다 (금화 ' + num(cost) + '닢).', 'chart'); if (G.Audio) G.Audio.sfx('coin'); }
  }
  async function sellStock(c, fixed) {
    var X = CO(), hs = X.holdings().filter(function (h) { return !fixed || h.co.id === fixed.id; });
    if (!hs.length) { UI.toast('팔 주식이 없다.', 'chart'); return; }
    var co = fixed;
    if (!co || hs.length > 1) {
      var v = await UI.choose('주식을 판다', hs.slice(0, 7).map(function (h) { return { label: U.esc(h.co.name) + ' ' + h.n + '주', icon: 'seal', right: num(X.bid(h.co)) + '닢 · 손익 ' + (h.pl >= 0 ? '+' : '') + num(h.pl), value: h.co.id }; }).concat([{ label: '돌아간다', icon: 'boot', value: null }]), { icon: 'chart', width: 760 });
      if (!v) return; co = G.COMPANY[v];
    }
    var have = X.state().shares[co.id] || 0, bid = X.bid(co); if (!have) return;
    if (X.isMember(co) && X.perk(X.rank(co)).shares) UI.toast('주의: ' + X.rankName(co, X.rank(co)) + '은 자사주 ' + X.perk(X.rank(co)).shares + '주를 지녀야 한다는 것이 회사의 법이다.', 'seal', 4800);
    var n = await UI.number({ title: co.name + ' ' + co.cert + ' 팔기', text: '1주에 금화 ' + num(bid) + '닢. 가진 주식 ' + have + '주.', min: 1, max: have, value: have, unit: '주',
      info: function (k) { return '받을 금화 <b>' + num(k * bid) + '</b>닢'; } });
    if (!n) return;
    var got = X.sell(co, n);
    if (got) { UI.toast(co.short + ' ' + n + '주를 팔았다 (금화 +' + num(got) + ').', 'chart'); if (G.Audio) G.Audio.sfx('coin'); }
  }
  /** 시세표 */
  function quoteHtml(only) {
    var X = CO(), b = X.state(), list = only ? [only] : X.actives();
    var th = '<tr><th>회사</th><th>주가</th><th>지난달</th><th>배당률</th><th>최근 4년</th><th>가진 주식</th></tr>';
    var tr = list.map(function (co) {
      var p = X.px(co), ch = X.change(co), n = b.shares[co.id] || 0;
      return '<tr' + (X.isMember(co) ? ' class="co-mine"' : '') + '><td><b>' + U.esc(co.name) + '</b>' + (X.isMember(co) ? ' <small class="good-text">내 회사</small>' : '') + '<br><small class="muted">' + U.esc(co.mono.map(function (id) { return G.GOOD[id].name; }).join('·')) + ' 독점</small></td>' +
        '<td style="text-align:right"><b>' + num(p) + '</b>닢</td><td class="' + (ch >= 0 ? 'good-text' : 'bad-text') + '">' + pct(ch) + '</td>' +
        '<td style="text-align:right">' + (X.divPer(co) / p * 100).toFixed(1) + '%</td><td>' + X.spark(co, 140, 30) + '</td>' +
        '<td style="text-align:right">' + (n ? n + '주<br><small>' + num(n * p) + '닢</small>' : '<span class="muted">—</span>') + '</td></tr>';
    }).join('');
    var cap = G.BALANCE.company.stock.investCap;
    return '<table class="tbl co-quotes" style="width:100%;font-size:17px">' + th + tr + '</table><div style="margin-top:8px;font-size:16px">주식에 넣은 돈 <b>' + num(X.invested()) + '</b> / ' + num(cap) + '닢 <small class="muted">(산 값의 합계 — 입회·설립 출자 몫 포함. 팔면 그만큼 다시 살 수 있다)</small></div><div class="muted" style="margin-top:4px;font-size:15px">사는 값은 주가보다 ' + Math.round(G.BALANCE.company.stock.spread * 100) + '% 비싸고 파는 값은 ' + Math.round(G.BALANCE.company.stock.spread * 100) + '% 싸다. 배당은 해마다 1월에 저절로 들어온다. 선단의 귀환·침몰, 세상의 큰 사건, 제독의 회사 임무가 주가를 움직인다.</div>';
  }
  async function quotes(only) { await UI.window({ title: only ? only.name + ' 주가' : '주식 시세표 — ' + U.fmtDate(S().date), icon: 'chart', width: 1080, html: quoteHtml(only), buttons: [{ label: '닫는다', value: 1, cls: 'navy' }] }).result; }

  // ================================================================ 회사 본부
  var HQ = { icon: 'seal', paint: 'guild' };
  C.B.company = HQ;
  HQ.title = function (c, arg) { var co = G.COMPANY[arg]; return co ? co.hqName : '회사 본부'; };
  HQ.sub = function (c, arg) {
    var X = CO(), co = G.COMPANY[arg]; if (!co) return '';
    return X.isMember(co) ? X.rankName(co, X.rank(co)) + ' · 공헌 ' + num(X.state().merit) : X.rival(co) ? '경쟁 회사의 본부' : '출자금 금화 ' + num(X.fee(co)) + '닢으로 입회';
  };
  HQ.enter = async function (c, arg) {
    var X = CO(), co = G.COMPANY[arg]; if (!co) return false;
    var who = clerk(co), b = X.state();
    if (X.isMember(co)) await C.say(who, U.pick(['어서 오시오, ' + X.rankName(co, b.rank) + '. 이사회가 그대 이야기를 자주 하오.', '돌아오셨구려! 장부가 기다리고 있었소.', '오늘 ' + co.short + ' 주가는 금화 ' + num(X.px(co)) + '닢이오. 바다 소식부터 들려주시오.']));
    else if (X.rival(co)) await C.say(who, G.COMPANY[b.member].short + ' 사람이 여기는 무슨 일이오? …볼일만 보고 가시오.');
    else await C.say(who, co.hqFull + '에 잘 오셨소. ' + co.desc);
    return true;
  };
  HQ.menu = function (c, arg) {
    var X = CO(), co = G.COMPANY[arg]; if (!co) return [];
    var member = X.isMember(co), nx = member ? X.next() : null, m = X.mission(), held = X.monoHeld(co);
    var msub = m ? (X.reportHere(c, m) ? '보고할 수 있다' : '맡은 일 있음') : X.rival(co) ? '맡길 수 없다' : X.offers(c, co).length + '건';
    return [
      { label: '사원 명부', icon: 'book', sub: member ? X.rankName(co, X.rank(co)) + (nx && nx.ok ? ' · 승진 심사' : '') : X.rival(co) ? '다른 회사 사람' : '입회 안내', onClick: function () { return roster(c, co); } },
      { label: '회사 임무', icon: 'scroll', sub: msub, onClick: function () { return missions(c, co, clerk(co)); } },
      { label: '독점품 납품', icon: 'sack', sub: member ? (held.length ? held.map(function (id) { return G.GOOD[id].name; }).join('·') : '짐칸에 없다') : '회원만', dim: !member || !held.length, onClick: function () { return deliver(c, co); } },
      { label: '주식 창구', icon: 'chart', sub: num(X.px(co)) + '닢 ' + pct(X.change(co)), onClick: function () { return desk(c, co); } }
    ];
  };
  function ladderHtml(co) {
    var X = CO(), b = X.state(), k = G.BALANCE.company, r0 = X.rank(co), sh = b.shares[co.id] || 0;
    var rows = [1, 2, 3, 4].map(function (r) {
      var p = k.ranks[r];
      return '<tr' + (r === r0 ? ' class="co-mine"' : '') + '><td><b>' + U.esc(X.rankName(co, r)) + '</b>' + (r === r0 ? ' ◀' : '') + '</td><td>' + (p.merit ? '공헌 ' + num(p.merit) : '입회') + (p.shares ? '<br><small>자사주 ' + p.shares + '주</small>' : '') + '</td>' +
        '<td>' + p.quota + '통</td><td>' + p.chain + '고리</td><td>×' + p.premium + '</td><td>×' + p.payK + '</td><td>' + ['단속'].concat(r >= k.convoy.rank ? ['선단'] : [], r >= k.prize.rank ? ['나포'] : [], r >= k.found.rank ? ['건설'] : []).join('·') + '</td><td>' + (p.salary ? num(p.salary * X.eraK()) + '닢' : '—') + '</td></tr>';
    }).join('');
    return '<div style="font-size:17px;margin-bottom:8px">' + (r0 ? '공헌 <b>' + num(b.merit) + '</b> · 자사주 <b>' + sh + '</b>주' + (X.doubted() ? ' <span class="bad-text">· 경쟁사 주식이 더 많아 공헌이 20% 덜 쌓인다</span>' : '') : U.esc(co.desc)) + '</div>' +
      '<table class="tbl" style="width:100%;font-size:16px"><tr><th>계급</th><th>조건</th><th>창고 할당<br><small>(' + k.quotaDays + '일)</small></th><th>주문서</th><th>독점품<br>납품 값</th><th>임무<br>보수</th><th>임무</th><th>한 해 보수</th></tr>' + rows + '</table>' +
      '<div class="muted" style="margin-top:8px;font-size:15px">독점품: ' + U.esc(co.mono.map(function (id) { return G.GOOD[id].name; }).join('·')) + ' — ' + U.esc(G.CITY_DATA[co.hq].name) + ' 세관이 비회원의 짐을 뒤진다. 상관: ' + U.esc(X.posts(co).map(function (p) { return G.CITY_DATA[p.c].name + (p.mine ? '★' : ''); }).join('·') || '아직 없다') + '</div>';
  }
  async function roster(c, co) {
    var X = CO(), b = X.state(), s = S(), who = clerk(co);
    if (X.rival(co)) { await UI.say('이미 ' + G.COMPANY[b.member].name + U.jx(G.COMPANY[b.member].name, '에') + ' 몸담은 분이구려. 두 회사의 장부에 이름을 올릴 수는 없소. 그쪽을 정리하고 오시오.', who); return; }
    if (X.isMember(co)) {
      var nx = X.next(), btn = [];
      if (nx && nx.ok) btn.push({ label: nx.name + ' 승진 심사', value: 'up', cls: 'green' });
      btn.push({ label: '회사를 떠난다', value: 'leave' }, { label: '닫는다', value: null, cls: 'navy' });
      var v = await UI.window({ title: co.name + ' 사원 명부', icon: 'book', width: 1020, html: ladderHtml(co), buttons: btn }).result;
      if (v === 'up') {
        var r = X.promote();
        if (r) {
          await UI.say(r.rank >= 4 ? '이사회가 한목소리로 정했소. 오늘부터 그대가 ' + r.name + '이오. 바다 건너 회사의 땅은 이제 그대가 다스리오.' : r.rank === 3 ? '이사회에 그대 자리를 마련했소. 이제 회사의 배당과 항로를 함께 정하시오.' : '그대에게 회사의 배와 깃발을 맡기오. 선단을 이끌고, 경쟁사의 배를 노려도 좋소.', who);
          UI.toast(co.short + ' ' + r.name + U.jx(r.name, '이/가') + ' 되었다!', 'crown', 5600);
          if (G.Audio) G.Audio.sfx('cheer');
        }
      } else if (v === 'leave') {
        if (await UI.confirm(co.name + U.jx(co.name, '을/를') + ' 떠나면 계급과 공헌이 모두 사라지고, 한 해 동안 어느 회사에도 들 수 없습니다. 주식은 그대로 남습니다. 떠날까요?', '떠난다', '남는다', '회사를 떠난다')) {
          X.leave(); await UI.say('…그렇다면 할 수 없지. 장부에서 그대 이름을 지우겠소. 바다에서 마주치지 않기를.', who);
        }
      }
      return;
    }
    var why = X.joinBlock(co), founder = X.founder(co), fee = founder ? 0 : X.fee(co), p = X.px(co);
    var n = Math.max(1, Math.floor(fee * G.BALANCE.company.joinShare / p)), fy = G.BALANCE.company.founderYears;
    var html = ladderHtml(co) + '<div style="font-size:18px;margin-top:12px;line-height:1.6">' + (founder ? '<b class="good-text">설립 때 출자한 분이구려 — 그때의 ' + U.esc(co.cert) + ' ' + (b.shares[co.id] || 0) + '주가 곧 출자이니, 출자금 없이 장부에 올리겠소.</b> <small class="muted">(회사가 선 뒤 ' + fy + '년 안, 설립 때 받은 주식을 다 쥐고 있을 때만)</small>' :
      '입회 출자금 금화 <b>' + num(fee) + '</b>닢 → ' + U.esc(co.cert) + ' <b>' + n + '</b>주(주당 ' + num(p) + '닢)를 받고 나머지는 입회금.') + (!founder && co.nation !== ({ PT: '포르투갈', ES: '카스티야' }[s.player.nation] || s.player.nation) ? ' <small class="muted">(다른 나라 사람이라 ' + G.BALANCE.company.foreignK + '배)</small>' : '') + (!founder && b.smug[co.id] ? ' <small class="bad-text">(밀수 전과 ' + b.smug[co.id] + '번)</small>' : '') +
      '<br><small class="muted">한 회사에만 속할 수 있다. 다른 회사의 상관 창고·주문서·임무는 쓸 수 없고 그 회사 세관에 더 자주 걸린다.</small>' + (why ? '<br><span class="bad-text">' + U.esc(why) + '</span>' : '') + '</div>';
    var w = await UI.window({ title: co.name + ' 입회', icon: 'book', width: 1020, html: html, buttons: [{ label: '돌아간다', value: null }, { label: '입회한다', value: 'join', cls: 'green', disabled: !!why }] }).result;
    if (w !== 'join' || X.joinBlock(co)) return;
    var r2 = X.join(co); if (!r2) return;
    await UI.say('좋소! ' + U.esc(s.player.name) + ', 오늘부터 그대는 ' + co.name + '의 ' + X.rankName(co, 1) + '이오. 바다 건너 상관에 가면 회사 창고를 열어 줄 것이고, 중개 주문서도 맡길 수 있소. 무엇보다 — 이제 ' + G.CITY_DATA[co.hq].name + ' 세관은 그대 짐을 뒤지지 않소.', who);
    UI.toast(co.name + '에 입회했다' + (r2.shares ? ' — ' + co.cert + ' ' + r2.shares + '주' : ' (설립 출자자)'), 'seal', 5600);
    if (G.Audio) G.Audio.sfx('coin');
  }
  async function deliver(c, co) {
    var X = CO(), who = clerk(co);
    if (!X.isMember(co)) { await UI.say('독점품은 회사 사람에게서만 사들이오.', who); return; }
    var held = X.monoHeld(co);
    if (!held.length) { await UI.say('짐칸에 우리 독점품이 없구려. ' + co.mono.map(function (id) { return G.GOOD[id].name; }).join('·') + U.jx(G.GOOD[co.mono[co.mono.length - 1]].name, '을/를') + ' 가져오면 시장보다 후하게 쳐주겠소.', who); return; }
    var rows = held.map(function (id) { var q = S().fleet.cargo[id].q, pr = X.monoPrice(c, co, id), rc = X.monoRecent(co, id); return { label: G.goodDot(id) + G.GOOD[id].name + ' ' + q + '통', right: '1통 ' + num(pr) + '닢 <small class="muted">(시장 ' + num(R.sellPrice(c, id)) + (rc ? ' · 요즘 넘긴 ' + rc + '통' : '') + ')</small>', value: id }; });
    if (held.length > 1) rows.unshift({ label: '모두 넘긴다', icon: 'sack', value: '*' });
    rows.push({ label: '돌아간다', icon: 'boot', value: null });
    var v = await UI.choose('독점품 납품 — ' + X.rankName(co, X.rank(co)) + ' 값 ×' + X.perk(X.rank(co)).premium, rows, { icon: 'sack', width: 760, text: '회사가 시장 값보다 후하게 사들인다. 한꺼번에 많이 넘길수록 값이 떨어지고, 한두 달 지나면 값이 돌아온다.' });
    if (!v) return;
    var ids = v === '*' ? held : [v], tot = 0, mer = 0;
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], have = S().fleet.cargo[id] ? S().fleet.cargo[id].q : 0, q = have;
      if (v !== '*') { q = await UI.number({ title: G.GOOD[id].name + ' 납품', text: '첫 1통에 금화 ' + num(X.monoPrice(c, co, id)) + '닢 — 넘길수록 값이 떨어진다 (시장 ' + num(R.sellPrice(c, id)) + ')', min: 1, max: have, value: have, unit: '통',
        info: (function (gid) { return function (k) { var g = X.monoValue(c, co, gid, k); return '받을 금화 <b>' + num(g) + '</b>닢 · 1통 평균 ' + num(g / Math.max(1, k)) + '닢'; }; })(id) }); if (!q) return; }
      var r = X.deliverMono(c, co, id, q); tot += r.value; mer += r.merit;
    }
    if (tot) { await UI.say(U.pick(['좋은 물건이오. 앤트워프 상인들이 줄을 서겠군.', '장부에 적었소. 회사가 그대를 잊지 않을 것이오.', '이만하면 이번 배당이 두둑하겠소!']), who); UI.toast('독점품을 넘겼다 — 금화 +' + num(tot) + (mer ? ' · 공헌 +' + mer : ''), 'coin', 5000); if (G.Audio) G.Audio.sfx('coin'); }
  }
  async function desk(c, co) {
    var X = CO(), b = X.state(), n = b.shares[co.id] || 0;
    var btn = [{ label: '산다', value: 'buy', cls: 'green' }];
    if (n) btn.push({ label: '판다', value: 'sell' });
    btn.push({ label: '닫는다', value: null, cls: 'navy' });
    var v = await UI.window({ title: co.name + ' 주식 창구', icon: 'chart', width: 1000, html: quoteHtml(co) + '<div style="font-size:17px;margin-top:8px">이 창구에서는 ' + U.esc(co.short) + ' 주식만 사고판다. 여러 회사 주식은 거래소에서.</div>', buttons: btn }).result;
    if (v === 'buy') await buyStock(c, co);
    else if (v === 'sell') await sellStock(c, co);
  }

  // ================================================================ 상관
  var FA = { icon: 'flag', paint: 'trade' }, scope = {};
  C.B.factory = FA;
  function here(c) {
    var X = CO(), fs = X.factoriesAt(c.id); if (!fs.length) return null;
    var id = scope[c.id], mine = X.me();
    if (!id || !fs.some(function (x) { return x.id === id; })) id = mine && fs.some(function (x) { return x.id === mine.id; }) ? mine.id : fs[0].id;
    scope[c.id] = id; return G.COMPANY[id];
  }
  FA.title = function (c) { var co = here(c); return co ? co.short + ' 상관' : '상관'; };
  FA.sub = function (c) { var X = CO(), co = here(c); return !co ? '' : X.isMember(co) ? '창고 할당 ' + X.quotaLeft(co, c.id) + '통 남음' : X.rival(co) ? '경쟁 회사의 상관' : '회사 사람에게만 창고를 연다'; };
  FA.enter = async function (c) {
    var X = CO(), co = here(c); if (!co) return false;
    var who = chief(co);
    if (X.isMember(co)) await C.say(who, U.pick(['어서 오시오! 본국 배를 기다리던 참이오. 창고에 ' + X.postAt(co, c.id).g.map(function (id) { return G.GOOD[id].name; }).join('·') + U.jx(G.GOOD[X.postAt(co, c.id).g.slice(-1)[0]].name, '이/가') + ' 쌓여 있소.', '회사 사람이구려. 이 바다에서는 우리끼리 돕고 살아야지.', '마침 잘 왔소. 이 바다 장사 이야기를 해 줄 게 많소.']));
    else if (X.rival(co)) await C.say(who, '…' + G.COMPANY[X.state().member].short + ' 깃발이군. 여기는 ' + co.short + '의 상관이오. 창고 문은 열어 줄 수 없소.');
    else await C.say(who, co.name + '의 상관이오. 회사 창고는 회사 사람에게만 열리오. ' + G.CITY_DATA[co.hq].name + '의 본부에서 입회하면 이야기가 달라지지.');
    return true;
  };
  FA.menu = function (c) {
    var X = CO(), co = here(c); if (!co) return [];
    var member = X.isMember(co), fs = X.factoriesAt(c.id), m = X.mission(), ch = X.state().chain, out = [];
    if (member) {
      out.push({ label: '회사 창고', icon: 'sack', sub: X.quotaLeft(co, c.id) + '통 남음 · ' + X.quotaRenew() + '일 뒤 새로', dim: !X.quotaLeft(co, c.id), onClick: function () { return warehouse(c, co); } });
      out.push({ label: '중개 주문서', icon: 'scroll', sub: ch ? (X.chainHere(c) ? '납품할 수 있다' : '고리 ' + ch.leg + ' · 보너스 ' + num(ch.pot) + '닢') : '사슬을 잇는다', onClick: function () { return chain(c, co); } });
    }
    out.push({ label: '회사 임무', icon: 'seal', sub: m ? (X.reportHere(c, m) ? '보고할 수 있다' : '맡은 일 있음') : X.rival(co) ? '맡길 수 없다' : X.offers(c, co).length + '건', onClick: function () { return missions(c, co, chief(co)); } });
    out.push({ label: '상관장과 이야기', icon: 'people', onClick: function () { return talk(c, co); } });
    if (fs.length > 1) out.push({ label: '다른 회사 상관으로', icon: 'flag', sub: fs.filter(function (x) { return x.id !== co.id; }).map(function (x) { return x.short; }).join('·'), onClick: function () { return switchCo(c, co); } });
    return out;
  };
  async function switchCo(c, co) {
    var X = CO(), fs = X.factoriesAt(c.id).filter(function (x) { return x.id !== co.id; }).slice(0, 7);
    var v = fs.length === 1 ? fs[0].id : await UI.choose('어느 회사의 상관으로 갈까?', fs.map(function (x) { return { label: U.esc(x.name), icon: 'flag', right: X.isMember(x) ? '내 회사' : X.rival(x) ? '경쟁사' : '', value: x.id }; }).concat([{ label: '돌아간다', icon: 'boot', value: null }]), { icon: 'flag' });
    if (!v) return;
    scope[c.id] = v;
    var nco = G.COMPANY[v];
    await C.say(chief(nco), X.isMember(nco) ? '어서 오시오, 우리 회사 사람!' : X.rival(nco) ? '경쟁사 사람이 여긴 웬일이오?' : nco.name + '의 상관이오. 무슨 일이오?');
  }
  async function warehouse(c, co) {
    var X = CO(), s = S(), post = X.postAt(co, c.id), who = chief(co), left = X.quotaLeft(co, c.id);
    if (!post) return;
    if (!left) { await UI.say('이번 철 그대 몫은 다 내주었소. ' + X.quotaRenew() + '일 뒤에 새 몫이 나오오. 계급이 오르면 몫도 늘지.', who); return; }
    var rows = post.g.filter(function (id) { return G.GOOD[id]; }).map(function (id) {
      var cp = X.costPrice(c, id); return { label: G.goodDot(id) + G.GOOD[id].name + (co.mono.indexOf(id) >= 0 ? ' <small class="good-text">독점품</small>' : ''), right: '1통 ' + num(cp) + '닢 <small class="muted">(교역소 ' + num(R.buyPrice(c, id)) + ')</small>', value: id };
    });
    rows.push({ label: '돌아간다', icon: 'boot', value: null });
    var v = await UI.choose('회사 창고 — 남은 할당 ' + left + '통 · 소지금 ' + num(s.player.gold) + '닢', rows, { icon: 'sack', width: 760, text: '교역소 재고와 상관없이 원가로 내준다. ' + X.quotaRenew() + '일 뒤 할당이 새로 나온다.' });
    if (!v) return;
    var cp2 = X.costPrice(c, v), f = s.fleet;
    if (!f.cargo[v] && Object.keys(f.cargo).length >= R.maxKinds()) { await UI.say('배에 다른 종류의 짐을 더 실을 곳이 없어 보이오. (품목 ' + R.maxKinds() + '종까지)', who); return; }
    var mx = Math.min(left, Math.floor(s.player.gold / cp2), Math.max(0, Math.floor(R.free())));
    if (mx < 1) { await UI.say(R.free() < 1 ? '짐칸이 꽉 찼구려.' : '금화가 모자라오.', who); return; }
    var q = await UI.number({ title: G.GOOD[v].name + ' — 회사 창고', text: '1통에 금화 ' + num(cp2) + '닢 (원가). 몇 통 실을까?', min: 1, max: mx, value: mx, unit: '통', info: function (n) { return '합계 금화 <b>' + num(n * cp2) + '</b>닢'; } });
    if (!q) return;
    var r = X.buyWarehouse(c, co, v, q);
    if (r) { UI.toast(G.GOOD[v].name + ' ' + q + '통을 회사 창고에서 실었다 (금화 ' + num(r) + '닢).', 'sack', 4600); if (G.Audio) G.Audio.sfx('coin'); }
  }
  function legText(c, o, co) { return G.CITY_DATA[c.id].name + '의 ' + G.GOOD[o.g].name + ' ' + o.q + '통 → ' + G.CITY_DATA[o.to].name + (co && CO().isPost(co, o.to) ? ' 상관' : ' 거래처') + ' (기한 ' + o.days + '일 · 배수 ×' + o.mult + ')'; }
  /** 주문서의 끝 도시에 들어섰다 — 바로 넘길지 묻는다 (상관이 없는 거래처도) */
  async function chainArrive(c) {
    var X = CO(), ch = X.state().chain; if (!ch || !X.chainHere(c)) return;
    var co = G.COMPANY[ch.co], who = X.isPost(co, c.id) ? chief(co) : X.staff('trader', co.short + ' 거래처 상인');
    await deliverFlow(c, co, who, true);
  }
  G.CompanyUI = { chainArrive: chainArrive };
  /** 고리를 넘기고 — 정산하거나 다음 고리를 잇는다 */
  async function deliverFlow(c, co, who, onArrive) {
    var X = CO(), ch = X.state().chain, k = G.BALANCE.company;
    var have = S().fleet.cargo[ch.g] ? S().fleet.cargo[ch.g].q : 0;
    if (have < ch.q) { await UI.say(G.GOOD[ch.g].name + U.jx(G.GOOD[ch.g].name, '이/가') + ' 모자라오. ' + ch.q + '통이 있어야 하는데 ' + have + '통뿐이구려.', who); return; }
    var ok = await UI.ask((onArrive ? co.short + '의 주문서를 기다리던 사람이 부두로 나왔다. ' : '') + '주문서 고리 ' + ch.leg + ' — ' + G.GOOD[ch.g].name + ' ' + ch.q + '통을 넘길까? (쌓인 연계 보너스 ' + num(ch.pot) + '닢)', [{ label: '넘긴다', value: 'go' }, { label: '나중에', value: null }], who);
    if (ok !== 'go') return;
    var r = X.chainDeliver(c);
    if (!r) return;
    if (G.Audio) G.Audio.sfx('coin');
    if (r.last) {
      var g = X.chainCash(true);
      await UI.alert('<b>사슬을 끝까지 이었다!</b><br>이번 고리 값 금화 ' + num(r.value) + '닢<br>쌓인 연계 보너스 ' + num(r.pot) + ' × ' + k.jackpot + ' = 금화 <b>' + num(g) + '</b>닢<br>공헌 +' + (r.merit + k.jackpotMerit), '중개 주문서 — 완성');
      await UI.say('이 바다의 항구를 한 바퀴 다 이었구려! 본국 이사회에 그대 이름이 오를 것이오.', who);
      return;
    }
    var nx = X.legOffer(c, co, ch.leg + 1);
    if (!nx) { var g2 = X.chainCash(false); await UI.alert('이번 고리 값 금화 ' + num(r.value) + '닢 · 여기서 이을 고리가 없어 정산했다 — 연계 보너스 금화 <b>' + num(g2) + '</b>닢', '중개 주문서'); return; }
    var v = await UI.ask('고리 ' + ch.leg + ' 완료 — 금화 ' + num(r.value) + '닢을 받았다. 쌓인 연계 보너스 ' + num(r.pot) + '닢. 다음 고리: ' + legText(c, nx, co) + (nx.leg >= ch.max ? ' — 마지막 고리, 이으면 보너스 ×' + k.jackpot : '') + ' (기한을 넘기면 보너스가 날아간다)', [
      { label: '다음 고리를 잇는다', value: 'next' }, { label: '정산한다 (보너스 금화 ' + num(r.pot) + '닢)', value: 'cash' }], who);
    if (v === 'next') { X.chainNext(c, nx); UI.toast('다음 고리 — ' + legText(c, nx, co), 'scroll', 5600); }
    else { var g3 = X.chainCash(false); UI.toast('연계 보너스 금화 +' + num(g3), 'coin', 4600); }
  }
  async function chain(c, co) {
    var X = CO(), b = X.state(), ch = b.chain, who = chief(co), k = G.BALANCE.company;
    if (ch && ch.co !== co.id) { await UI.say('다른 회사의 주문서를 들고 계시구려. 그건 그 회사 상관에서 셈하시오.', who); return; }
    if (ch && X.chainHere(c)) { await deliverFlow(c, co, who, false); return; }
    if (ch) {
      var v2 = await UI.ask(X.chainText() + ' — 기한을 넘기면 쌓인 보너스가 날아간다.', [{ label: '계속한다', value: null }, { label: '주문서를 찢는다 (보너스를 버린다)', value: 'drop' }], who);
      if (v2 === 'drop' && await UI.confirm('쌓인 연계 보너스 금화 ' + num(ch.pot) + '닢을 버리고 주문서를 찢을까요?', '찢는다', '그만둔다')) X.chainDrop();
      return;
    }
    var o = X.legOffer(c, co, 1);
    if (!o) { await UI.say('오늘은 이 상관에서 시작할 만한 주문이 없소. 다른 상관에 가 보시오.', who); return; }
    var mx = X.perk(X.rank(co)).chain;
    var v3 = await UI.ask('중개 주문서 — 상관과 이 바다의 큰 항구를 잇는 사슬. 고리마다 값은 그 자리에서 받고, 배수만큼 「연계 보너스」가 쌓인다. 고리를 마칠 때마다 정산하거나 다음 고리를 잇는다 (최대 ' + mx + '고리, 끝까지 이으면 보너스 ×' + k.jackpot + '). 기한을 넘기면 보너스가 날아간다. — 첫 고리: ' + legText(c, o, co), [{ label: '주문서를 받는다', value: 'take' }, { label: '돌아간다', value: null }], who);
    if (v3 !== 'take') return;
    X.chainTake(c, co, o);
    await UI.say('이 도시 교역소에서 ' + G.GOOD[o.g].name + U.jx(G.GOOD[o.g].name, '을/를') + ' ' + o.q + '통 사서 ' + G.CITY_DATA[o.to].name + U.jx(G.CITY_DATA[o.to].name, '으로/로') + ' 가져가시오. 그 도시에 들어서면 회사 사람이 부두에서 받아 갈 것이오. 우리 회사 창고에 있는 것을 써도 좋소.', who);
  }
  async function talk(c, co) {
    var X = CO(), b = X.state(), who = chief(co), rv = X.actives().filter(function (x) { return x.id !== co.id && X.posts(x).length; });
    var lines = [];
    lines.push('우리 ' + co.short + ' 주가는 지금 금화 ' + num(X.px(co)) + '닢이오 (' + pct(X.change(co)) + '). ' + (X.health(co) > 1.05 ? '요즘 회사 형편이 좋소.' : X.health(co) < 0.95 ? '요즘 회사 형편이 좋지 않소.' : '그럭저럭이오.'));
    lines.push('이 바다의 ' + co.short + ' 상관은 ' + X.posts(co).map(function (p) { return G.CITY_DATA[p.c].name; }).join('·') + '. 회사는 ' + co.mono.map(function (id) { return G.GOOD[id].name; }).join('·') + U.jx(G.GOOD[co.mono[co.mono.length - 1]].name, '을/를') + ' 혼자 쥐려 하오 — 본국 세관이 회사 사람 아닌 이의 짐을 뒤지지.');
    if (rv.length) { var r = U.pick(rv); lines.push(r.short + ' 놈들이 ' + X.posts(r).slice(0, 3).map(function (p) { return G.CITY_DATA[p.c].name; }).join('·') + '에 상관을 두고 있소. 그쪽 주가는 ' + num(X.px(r)) + '닢. ' + (X.isMember(co) && X.rank(co) >= 2 ? '그놈들 화물선을 털면 우리 주가가 오르고 그쪽은 떨어지지.' : '')); }
    if (!X.isMember(co) && !X.rival(co)) lines.push(G.CITY_DATA[co.hq].name + '의 본부에서 입회하면 이 상관의 창고를 원가로 열어 주고, 중개 주문서도 맡길 수 있소.');
    else if (X.isMember(co)) { var o = X.legOffer(c, co, 1); if (o && !b.chain) lines.push('오늘 이 상관에서 시작하는 주문서가 있소 — ' + legText(c, o, co) + '.'); }
    await UI.say(lines.join('\f'), who);
  }

  // ================================================================ 거래소
  var EX = { icon: 'chart', paint: 'guild' };
  C.B.exchange = EX;
  EX.title = function (c) { var x = CO().exchangeAt(c.id); return x ? x.name : '거래소'; };
  EX.sub = function () { var X = CO(), hs = X.holdings(), v = 0; hs.forEach(function (h) { v += h.value; }); return hs.length ? '가진 주식 ' + num(v) + '닢어치' : '회사 주식을 사고판다'; };
  EX.enter = async function (c) {
    var X = CO(), list = X.actives(), hot = list.slice().sort(function (a, z) { return Math.abs(X.change(z)) - Math.abs(X.change(a)); })[0];
    await C.say(broker(), hot ? '오늘은 ' + hot.short + U.jx(hot.short, '이/가') + ' 들썩이는군! 지난달보다 ' + pct(X.change(hot)) + '. 무엇을 사고팔겠소?' : '주식을 사고파는 곳이오. 아직은 살 것이 별로 없지만.');
    return true;
  };
  EX.menu = function (c) {
    var X = CO(), cost = Math.round(G.BALANCE.company.stock.tip * X.eraK());
    return [
      { label: '시세표', icon: 'chart', sub: X.actives().length + '개 회사', onClick: function () { return quotes(null); } },
      { label: '주식을 산다', icon: 'coin', onClick: function () { return buyStock(c, null); } },
      { label: '주식을 판다', icon: 'sack', sub: X.holdings().length ? X.holdings().length + '개 회사' : '', dim: !X.holdings().length, onClick: function () { return sellStock(c, null); } },
      { label: '중개인의 귀띔', icon: 'eye', sub: '금화 ' + num(cost) + '닢', onClick: function () { return tip(c, cost); } }
    ];
  };
  async function tip(c, cost) {
    var X = CO(), s = S(), who = broker();
    if (s.player.gold < cost) { await UI.say('공짜 소문은 없소. 금화 ' + num(cost) + '닢이면 들을 만한 이야기를 해 주지.', who); return; }
    var v = await UI.ask('중개인에게 금화 ' + num(cost) + '닢을 주고 다가올 소식을 들을까? (늘 맞지는 않는다)', [{ label: '듣는다', value: 'yes' }, { label: '그만둔다', value: null }], who);
    if (v !== 'yes') return;
    s.player.gold -= cost;
    var t = X.tip();
    if (!t) { await UI.say('(동전을 굴리며) 요즘은 바다가 조용하오. 큰 소식이 없어. …이 돈은 다음 소문 값으로 받아 두지.', who); return; }
    await UI.say('(목소리를 낮추며) ' + t.text + ' — ' + (t.days <= 30 ? '한 달 안에' : Math.ceil(t.days / 30) + '달쯤 뒤에') + ' 결판이 날 걸세. ' + (t.up ? t.co.short + ' 주식을 쥐고 있으면 웃을 테고.' : t.co.short + ' 주식은 미리 털어 두는 게 좋겠지.'), who);
    G.State.log('거래소 중개인의 귀띔 — ' + t.text);
  }
})(window.G = window.G || {});
