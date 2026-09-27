/* 왕궁 / 저택: 후원자 알현, 모험 제안, 보고 */
(function (G) {
  'use strict';
  var U = G.U, UI = G.UI, R = G.R, C = G.Scenes.city, SP = G.Sponsor;
  function S() { return G.Game.state; }

  function palaceSponsor(c) { return G.SPONSORS.filter(function (s) { return s.city === c.id && s.bld === 'palace' && SP.present(s); })[0] || null; }
  function make(kind) {
    var B = { paint: kind, icon: kind === 'palace' ? 'crown' : 'mansion' };
    B.title = function (c, arg) { return kind === 'palace' ? R.palaceName(c) : C.mansionName(G.SPONSOR[arg]); };
    B.variant = function (c, arg) { return arg || ''; };
    B.exitLabel = kind === 'palace' ? '물러난다' : '저택을 나온다';
    B.sp = function (c, arg) { return kind === 'palace' ? palaceSponsor(c) : G.SPONSOR[arg]; };
    B.enter = async function (c, arg) {
      var sp = B.sp(c, arg);
      if (!sp) {
        var guard = { name: '위병', portrait: G.Art.withImg(G.Art.npcSpec('pg' + c.id, 'soldier', c.style), G.Img.chain.npc('guard', c)), lang: C.langLv(c) };
        await C.say(guard, U.pick(['이곳의 주인께서는 지금 계시지 않다. 돌아가라.', '너 같은 녀석이 들어올 장소가 아니다! 꺼지지 못할까!']));
        return false;
      }
      var ok = await SP.audience(sp);
      if (!ok) return false;
      var who = SP.speaker(sp), rel = SP.rel(sp.id), s = S();
      var greet = rel.met <= 1 ? SP.holderName(sp) + '일세. 자네가 요즘 소문난 항해자인가? 무슨 일로 왔나?' : U.pick(['오오, ' + s.player.name + ', 잘 왔네.', '무슨 일인가, ' + s.player.name + '?', '자네로군. 이번에는 무슨 이야기를 가져왔나?']);
      await C.say(who, greet);
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
      ];
    };
    return B;
  }
  async function chat(sp) {
    var s = S(), who = SP.speaker(sp), rel = SP.rel(sp.id);
    var lines = [];
    var tasteTxt = sp.taste.map(function (t) { return G.DISC_CATS[t]; }).join('·');
    lines.push('나는 ' + tasteTxt + '에 관한 이야기라면 언제든 귀를 기울이지.');
    // 리스본·세비야의 후원자는 다음 큰 항로 이야기를 들려준다 (앞선 발견이 알려진 뒤)
    var lead = G.Frontier && G.Frontier.takeLead ? G.Frontier.takeLead(sp.city, 'sponsor') : null;
    if (lead) { lines.push('그러고 보니 요즘 궁정에서도 화제가 된 이야기가 있네. ' + lead.text + '\n그 일을 해내겠다면 기꺼이 후원을 생각해 보지.'); UI.toast('단서를 얻었다: 「' + lead.disc.name + '」', 'scroll'); await C.say(who, lines.join('\f')); return; }
    // occasionally drop a hint that matches the sponsor's taste
    if (rel.trust >= 25 && U.chance(0.5)) {
      var cand = G.DISCOVERIES.filter(function (d) { return sp.taste.indexOf(d.cat) >= 0 && !s.hints[d.id] && !G.Disc.foundByMe(d.id) && d.pw <= sp.pw && d.how !== 'special' && G.Disc.available(d); });
      if (cand.length) { var d = U.pick(cand); lines.push('그러고 보니 이런 이야기를 들은 적이 있네. ' + d.hint); G.Disc.addHint(d.id, 'sponsor:' + sp.id); UI.toast('단서를 얻었다: 「' + d.name + '」', 'scroll'); }
    } else if (s.player.fame < 200) lines.push('자네도 이름을 떨치고 싶다면 먼저 작은 발견부터 차근차근 쌓아 가게.');
    else lines.push(U.pick(['요즘 바다 건너에서 들려오는 소식이 참으로 흥미롭군.', '세상은 우리가 아는 것보다 훨씬 넓다네.', '돈보다 귀한 것은 새로운 지식일세.']));
    await C.say(who, lines.join('\f'));
  }
  C.B.palace = make('palace');
  C.B.mansion = make('mansion');
})(window.G = window.G || {});
