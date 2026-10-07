/* 왕궁 / 저택: 후원자 알현, 모험 제안, 보고 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city, SP = G.Sponsor;
  function S() { return G.Game.state; }

  function palaceSponsor(c) { return G.SPONSORS.filter(function (s) { return s.city === c.id && s.bld === 'palace' && SP.present(s); })[0] || null; }
  function make(kind) {
    var B = { paint: kind, icon: kind === 'palace' ? 'crown' : 'mansion' };
    B.title = function (c, arg) { return kind === 'palace' ? R.palaceName(c, arg && G.SPONSOR[arg]) : C.mansionName(G.SPONSOR[arg]); };
    B.variant = function (c, arg) { return arg || ''; };
    B.exitLabel = kind === 'palace' ? '물러난다' : '저택을 나온다';
    B.sp = function (c, arg) { if (kind !== 'palace') return G.SPONSOR[arg]; var own = arg && G.SPONSOR[arg]; return own ? (SP.present(own) ? own : null) : palaceSponsor(c); };
    B.enter = async function (c, arg) {
      var sp = B.sp(c, arg);
      if (!sp) {
        var guard = { name: '위병', portrait: G.Art.withImg(G.Art.npcSpec('pg' + c.id, 'soldier', G.Img.folkStyle(c)), G.Img.chain.npc('guard', c)), lang: C.langLv(c), li: c.lang };
        await C.say(guard, G.Court ? G.Court.hail(c, 'guard', ['이곳의 주인께서는 지금 계시지 않다. 돌아가라.', '너 같은 녀석이 들어올 장소가 아니다! 꺼지지 못할까!']) : U.pick(['이곳의 주인께서는 지금 계시지 않다. 돌아가라.', '너 같은 녀석이 들어올 장소가 아니다! 꺼지지 못할까!']));
        return false;
      }
      var ok = await SP.audience(sp);
      if (!ok) return false;
      var who = SP.speaker(sp), rel = SP.rel(sp.id), s = S();
      var first = rel.met <= 1 || (G.Succession && G.Succession.firstMeetingBefore);
      var succ = G.Succession && G.Succession.newHolderBefore;
      var greet = succ ? U.pick([SP.holderName(sp) + '일세. 선대께서 자네 이야기를 하시곤 했지. 이제는 내가 이 자리의 주인이니, 자네가 어떤 사람인지 내 눈으로 보겠네.',
          SP.holderName(sp) + '일세. 선대와 자네 사이의 일은 들었네. 하지만 믿음은 새로 쌓아야 하는 법이지.'])
        : first ? SP.holderName(sp) + '일세. 자네가 요즘 소문난 항해자인가? 무슨 일로 왔나?' : U.pick(['오오, ' + s.player.name + ', 잘 왔네.', '무슨 일인가, ' + s.player.name + '?', '자네로군. 이번에는 무슨 이야기를 가져왔나?']);
      await C.say(who, greet);
      // 국왕의 부름·명예 작위: 군주가 먼저 왕명 이야기를 꺼낸다 (js/systems/court.js)
      // 사라진 왕녀: 에스파냐 국왕이 먼저 꺼낸다 (js/systems/princess.js) — 그 이야기를 했으면 왕명은 메뉴에서
      var prDone = false;
      if (G.Princess) { try { prDone = await G.Princess.onEnter(sp); } catch (e) { console.error(e); } }
      if (G.Court && !prDone) { try { await G.Court.onEnter(sp); } catch (e) { console.error(e); } }
      return true;
    };
    B.sub = function (c, arg) { var sp = B.sp(c, arg); return sp ? SP.holderName(sp) + ' · ' + sp.title + ' (세력 ' + G.POWER_NAME[sp.pw] + ')' : ''; };
    B.menu = function (c, arg) {
      var sp = B.sp(c, arg), s = S(), k = s.contract;
      if (!sp) return [];
      var mine = k && k.sponsor === sp.id;
      return [
        { label: '모험 제안', icon: 'scroll', dim: !!k, onClick: function () { return SP.propose(sp); } },
        { label: '보고', icon: 'seal', sub: mine ? (G.Errand.done(k) ? (k.task ? '완료' : '발견 완료') : '계약 중') : '', dim: !mine, onClick: function () { return SP.report(sp); } },
        { label: '이야기', icon: 'people', onClick: function () { return chat(sp); } }
      ].concat(G.Princess ? G.Princess.palaceItems(sp) : []).concat(G.Court ? G.Court.palaceItems(sp) : []);   // 사라진 왕녀 · 왕명·친서·특사
    };
    return B;
  }
  /** 후원자가 도서관의 책을 일러 준다: 취향에 맞는 사료 갈래(book) 발견이 실린, 지금 나와 있는 책과 그 도서관 (단서는 주지 않는다) */
  function libraryTip(sp) {
    var s = S(), c0 = G.CITY_DATA[sp.city], out = [];
    G.BOOKS.forEach(function (b) {
      if ((b.y || 0) > s.date.y || s.flags['read_' + b.id]) return;
      var libs = b.libs.map(function (id) { return G.CITY_DATA[id]; }).filter(function (c) { return c && R.cityExists(c); });
      if (!libs.length) return;
      b.discs.forEach(function (id) {
        var d = G.DISC[id];
        if (!d || G.Disc.clue(d) !== 'book' || sp.taste.indexOf(d.cat) < 0 || s.hints[id] || G.Disc.foundByMe(id) || !G.Disc.available(d)) return;
        var c = libs.slice().sort(function (a, z) { return G.Geo.dist(c0.lon, c0.lat, a.lon, a.lat) - G.Geo.dist(c0.lon, c0.lat, z.lon, z.lat); })[0];
        out.push({ book: b, disc: d, city: c, w: 1 / (1 + G.Geo.dist(c0.lon, c0.lat, c.lon, c.lat) / 20) });
      });
    });
    return out.length ? U.weighted(out, function (x) { return x.w; }) : null;
  }
  async function chat(sp) {
    var s = S(), who = SP.speaker(sp), rel = SP.rel(sp.id);
    var lines = [];
    var tasteTxt = sp.taste.map(function (t) { return G.DISC_CATS[t]; }).join('·');
    lines.push('나는 ' + tasteTxt + '에 관한 이야기라면 언제든 귀를 기울이지.');
    // 리스본·세비야의 후원자는 다음 큰 항로 이야기를 들려준다 (앞선 발견이 알려진 뒤)
    var lead = G.Frontier && G.Frontier.takeLead ? G.Frontier.takeLead(sp.city, 'sponsor') : null;
    if (lead) { lines.push('그러고 보니 요즘 궁정에서도 화제가 된 이야기가 있네. ' + lead.text + '\n그 일을 해내겠다면 기꺼이 후원을 생각해 보지.'); UI.toast('단서를 얻었다: 「' + lead.disc.name + '」', 'scroll'); await C.say(who, lines.join('\f')); return; }
    // occasionally drop a hint that matches the sponsor's taste — 이야기 갈래(talk)만. 옛 유적·전설은 도서관으로 보낸다
    if (rel.trust >= 25 && U.chance(0.5)) {
      var cand = G.DISCOVERIES.filter(function (d) { return sp.taste.indexOf(d.cat) >= 0 && !d.bookOnly && G.Disc.clueOk(d, 'sponsor') && G.Disc.rumourW(d, 'sponsor:' + sp.id) && !G.Disc.foundByMe(d.id) && d.pw <= sp.pw && d.how !== 'special' && G.Disc.available(d); });
      if (cand.length) { var d = U.weighted(cand, function (x) { return G.Disc.rumourW(x, 'sponsor:' + sp.id); }); lines.push((G.Disc.hasHint(d.id) ? '자네가 쫓는 그 이야기 말일세, 나도 들은 바가 있네. ' : '그러고 보니 이런 이야기를 들은 적이 있네. ') + d.hint); G.Disc.noteHint(d, 'sponsor:' + sp.id); }
      var bk = cand.length && U.chance(0.6) ? null : libraryTip(sp);
      if (bk) lines.push('옛 이야기라면 내 말보다 사료가 낫지. ' + bk.city.name + ' 도서관에 ' + bk.book.title + U.jx(bk.book.name || bk.book.title, '이/가') + ' 있으니 읽어 보게. ' + bk.disc.name + '에 관한 대목이 있을 걸세.');
    } else if (s.player.fame < 200) lines.push('자네도 이름을 떨치고 싶다면 먼저 작은 발견부터 차근차근 쌓아 가게.');
    else lines.push(U.pick(['요즘 바다 건너에서 들려오는 소식이 참으로 흥미롭군.', '세상은 우리가 아는 것보다 훨씬 넓다네.', '돈보다 귀한 것은 새로운 지식일세.']));
    await C.say(who, lines.join('\f'));
  }
  C.B.palace = make('palace');
  C.B.mansion = make('mansion');
})(window.G = window.G || {});
