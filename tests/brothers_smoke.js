/* 두 왕자 — 왕자와 거지(광해군)·지킬과 하이드(임해군)·설화 (2026-11-02 사용자 요청) — node tests/brothers_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 돈화문 — 옷을 바꿔 입은 왕자 · 믿는다 · 혜민서의 설화 · 밤의 복면 사내(일기토) · 임해군의 오른팔 · 회화나무 · 옥패 · 막동(배 / 궁)
   · ② 20일 뒤 — 약병 · 임해군이 복면의 사내로 · 깨뜨린다/지킨다/알린다 · 설화의 마음
   · ③ 1592 세자를 세우는 날 — 임해·설화가 함께 떠나고 광해는 남는다 · ④' 임금의 밤(편지와 답장) / 붙잡으면 ④ 1608 교동도 — 빼낸다(병을 깨뜨렸어야) / 편지 → 사람으로 죽는다 · 실패하면 역사대로 · 설화(함께 떠난다 / 배 / 혜민서) · 편지를 광해에게
   · ⑤ 1623 반정의 밤 — 막동이 다시 옷을 바꿔 입는다 → 광해가 「이름 없는 선비」로 / 역사대로 · 소식 · 웃어넘기면 끝 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Brothers && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, BR = G.Brothers, said = [], asked = [], out = {};
      let plan = [], landRes = [], duelRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      G.Games.duel = async (en) => { said.push('[일기토] ' + en.name); return duelRes.length ? duelRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; return s;
      };
      const at = (s, y, m, d) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: 190, lon: G.CITY_DATA[190].lon, lat: G.CITY_DATA[190].lat }; };
      const go = async (choices, duel, land) => { plan = choices.slice(); duelRes = (duel || []).slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = BR.pending(); if (p) await BR.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      out.hidden = ['br_seolhwa', 'br_makdong', 'br_gwanghae', 'br_imhae'].every(id => G.MATE[id] && G.MATE[id].eventOnly) && !!G.MATE.br_gwanghae.wed;
      // ── 갈래 A: 믿는다 · 일기토 이김 · 임해군에게 · 막동을 배에 → 병을 깨뜨린다 · 마음은 임해군 → 교동도에서 빼낸다(매수) → 반정의 밤에 바꿔 입는다
      let s = fresh(1591, 3, 1);
      out.gate = { early: (at(s, 1589, 12, 31), BR.pending()), late: (at(s, 1592, 5, 23), BR.pending()) };
      at(s, 1591, 3, 1); const d0 = s.day; await go(['help', 'imhae', 'ship'], ['win']);
      const b = () => s.brothers;
      out.A1 = { swap: b().swap, night: b().night, back: b().back, jade: G.R.hasItem('br_jade'), mak: hired('br_makdong'), days: s.day - d0, twins: said.some(x => /쌍둥이처럼 똑같다/.test(x)), seol: said.some(x => /손이 왜 이렇게 고와요/.test(x)), hyde: said.some(x => /\[일기토\] 복면의 사내/.test(x)), arm: said.some(x => /책장을 넘기다 칼에 베였소/.test(x)), tree: said.some(x => /회화나무/.test(x)) };
      out.facesEarly = BR.pending();
      s.day = b().swapDay + 25; at(s, 1591, 4, 5); await go(['break', 'i']);
      out.A2 = { potion: b().potion, heart: b().heart, change: said.some(x => /착한 맏이는 잠들었다/.test(x)), knows: said.some(x => /침 자국은 거짓말을/.test(x)), done: BR.pending() };
      out.leaveEarly = (at(s, 1592, 2, 28), BR.pending());
      at(s, 1592, 4, 1); await go(['yes']);
      out.A3 = { leave: b().leave, imhae: hired('br_imhae'), seol: hired('br_seolhwa'), wed: G.MATE.br_seolhwa.wed === 'br_imhae' && G.MATE.br_imhae.wed === 'br_seolhwa', stay: said.some(x => /남는 것이 내 몫이오/.test(x)), beast: said.some(x => /나라 전체가 밤이 된다/.test(x)), tower: said.some(x => /세자가 되었다/.test(x)), kyo: (at(s, 1608, 5, 1), BR.pending() && true) };
      at(s, 1608, 5, 1); await go([]);
      out.A4 = { imhae: b().imhae, kyo: b().kyodong, letter: G.R.hasItem('br_letter'), erase: said.some(x => /형님의 이름을 지우면/.test(x)), reply: said.some(x => /이름은 네게 두고 간다/.test(x)), stillMates: hired('br_imhae') && hired('br_seolhwa') };
      out.A4b = { again: (at(s, 1609, 1, 1), BR.pending()) };
      at(s, 1623, 3, 25); await go(['swap']);
      out.A5 = { last: b().last, date: s.date.m + '.' + s.date.d, gh: hired('br_gwanghae'), mak: hired('br_makdong'), y: G.MATE.br_gwanghae.y[1], again: said.some(x => /한 번 더 할 차례예요/.test(x)), brothers: said.some(x => /이제 업어 줄 수 있겠구나/.test(x)), water: said.some(x => /물동이 도령/.test(x)) };
      s.loc = { mode: 'sea', lon: 126, lat: 36 };
      const day = (y, m, d) => { s.date = { y, m, d }; return BR.daily().map(x => x.text).join(' | '); };
      s.brothers.told = {}; out.newsA = { crown: day(1592, 6, 8), hoe: day(1592, 8, 30), acc: day(1608, 3, 18), kyo: day(1609, 6, 1), coup: day(1623, 4, 12), jeju: day(1641, 8, 7) };
      // ── 갈래 B: 일기토 짐(설화의 침) · 담을 넘는다 · 막동은 궁에 → 비밀을 지킨다 · 마음은 광해 → 편지 → 사람으로 · 설화를 배에 → 역사대로
      s = fresh(1590, 6, 1); at(s, 1590, 6, 1); await go(['help', 'wall', 'palace'], ['lose'], ['win']);
      out.B1 = { night: b().night, needle: said.some(x => /긴 침을 뽑아/.test(x)), wall: said.some(x => /\[육상전\] 후원의 궁궐 군사/.test(x)), mak: b().makdong, hired: hired('br_makdong') };
      s.day = b().swapDay + 30; at(s, 1590, 8, 1); await go(['keep', 'g']);
      at(s, 1608, 4, 1); await go(['letter', 'yes']);
      out.B4 = { imhae: b().imhae, seol: b().seolhwa, hired: hired('br_seolhwa'), letter: G.R.hasItem('br_letter'), human: said.some(x => /사람으로 죽겠소/.test(x)), threw: said.some(x => /갯벌에 던졌다/.test(x)) };
      at(s, 1610, 1, 1); await go([]); out.B4b = { reply: said.some(x => /좋은 왕이 되어라/.test(x)) };
      at(s, 1623, 4, 1); await go(['history']);
      out.B5 = { last: b().last, gh: hired('br_gwanghae'), stable: said.some(x => /마구간지기/.test(x)) };
      s.loc = { mode: 'sea', lon: 126, lat: 36 }; s.brothers.told = {}; out.newsB = { crown: day(1592, 6, 8), kyo: day(1609, 6, 1), coup: day(1623, 4, 12) };
      // ── 갈래 E: 1592에 붙잡는다 → 교동도에서 빼낸다(병을 깨뜨렸으니) → 임해·설화가 배에
      s = fresh(1591, 3, 1); at(s, 1591, 3, 1); await go(['help', 'imhae', 'palace']);
      s.day = b().swapDay + 25; at(s, 1591, 4, 5); await go(['break', 'i']);
      at(s, 1592, 5, 1); await go(['no']);
      let g0 = s.player.gold; at(s, 1608, 5, 1); await go(['escape', 'bribe']);
      out.E = { leave: b().leave, imhae: b().imhae, seol: b().seolhwa, gold: g0 - s.player.gold, mates: hired('br_imhae') && hired('br_seolhwa'), cant: said.some(x => /나는 왕이라서 형님을 살릴 수 없소/.test(x)), with: said.some(x => /혼자 보내지 않을 거예요/.test(x)), joinAsk: asked.some(a => /의원 자리가/.test(a.t)) };
      at(s, 1609, 1, 1); await go([]); out.Eb = { back: b().letterBack, gone: !G.R.hasItem('br_letter'), alive: said.some(x => /바다 어딘가에 계시는구려/.test(x)) };
      // ── 갈래 C: 알린다 → 빼내려 하면 짐승이 깬다 → 역사대로 · 설화는 혜민서에
      s = fresh(1591, 1, 1); at(s, 1591, 1, 1); await go(['help', 'imhae', 'palace']);
      s.day = b().swapDay + 21; at(s, 1591, 3, 1); await go(['told', 'none']);
      at(s, 1609, 2, 1); await go(['escape', 'no'], [], ['win']);
      out.C4 = { imhae: b().imhae, seol: b().seolhwa, letter: G.R.hasItem('br_letter'), beast: said.some(x => /문을 긁고 있소/.test(x)), told: said.some(x => /형님의 밤을 나는 알고 있었소/.test(x)), back: (at(s, 1610, 1, 1), BR.pending()) };
      // ── 웃어넘기면 끝
      s = fresh(1591, 5, 1); at(s, 1591, 5, 1); await go(['no']); out.D = { swap: s.brothers.swap, later: (at(s, 1608, 5, 1), BR.pending()) };
      // ── 옛 저장 · 소문 · 일지 · 말투
      s = fresh(1700, 1, 1); delete s.brothers; out.oldSave = BR.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'brothers');
      out.journal = !!(BR.daily && BR.daily._journal);
      out.voices = ['br_seolhwa', 'br_makdong', 'br_gwanghae', 'br_imhae'].every(id => G.VOICES && G.VOICES[id]);
      return out;
    });
    console.log(JSON.stringify({ A3: r.A3, A4: r.A4, A5: r.A5, E: r.E, newsA: Object.keys(r.newsA) }));
    ok(r.hidden, '설화·막동·광해는 사건으로만 만난다 (광해는 이미 짝이 있다)');
    ok(!r.gate.early && !r.gate.late, '① 돈화문은 1590.1.1~1592.5.22');
    const a = r.A1;
    ok(a.swap === 'help' && a.twins && a.seol && a.hyde && a.night === 'win' && a.days === 1, '① 옷을 바꿔 입은 왕자를 믿는다 · 혜민서의 설화 · 밤의 복면 사내(일기토) · 이튿날');
    ok(a.back === 'imhae' && a.arm && a.tree && a.jade && a.mak && r.facesEarly === false, '임해군의 오른팔 무명 · 회화나무 · 옥패 · 막동을 배에 · ②는 20일 뒤');
    ok(r.A2.potion === 'break' && r.A2.heart === 'i' && r.A2.change && r.A2.knows && !r.A2.done, '② 약을 마신 임해군이 복면의 사내로 · 병을 깨뜨린다 · 설화의 마음(임해군) · 「침 자국은 거짓말을 안 하거든요」');
    ok(r.leaveEarly === false && r.A3.leave === 'yes' && r.A3.imhae && r.A3.seol && r.A3.wed && r.A3.stay && r.A3.beast && r.A3.tower && r.A3.kyo, '③ 1592 세자를 세우는 날 — 임해군이 이름을 버리고 설화와 함께 배에(둘은 짝) · 광해는 「남는 것이 내 몫이오」 → 세자');
    ok(r.A4.imhae === 'sea' && r.A4.kyo === 1 && !r.A4.letter && r.A4.erase && r.A4.reply && r.A4.stillMates && r.A4b.again === false, '④\' 임금의 밤 — 「형님의 이름을 이 땅에서 지우겠소」 · 배 위의 형이 답장(「이름은 네게 두고 간다」) · 교동도는 열리지 않는다');
    ok(r.A5.last === 'swap' && r.A5.date === '4.11' && r.A5.gh && !r.A5.mak && r.A5.y >= 1650 && r.A5.again && r.A5.brothers && r.A5.water, '⑤ 반정의 밤 — 막동이 다시 옷을 바꿔 입고, 배에서 서른 해 만에 두 형제가 만난다 · 「물동이 도령」');
    const na = r.newsA;
    ok(/모습을 감추었다/.test(na.crown) && /자칭하며/.test(na.hoe) && /사라진 맏이/.test(na.acc) && /본 적이 없다고/.test(na.kyo) && /하루 왕 노릇을 잘했구나/.test(na.coup) && /그분은 바다에 계시오/.test(na.jeju), '소식 — 사라진 맏이 · 「임해군이라 자칭하던 자」 · 교동도에는 아무도 없었다 · 웃는 폐주 · 제주');
    ok(r.E.leave === 'no' && r.E.imhae === 'fled' && r.E.seol === 'imhae' && r.E.gold === 1500 && r.E.mates && r.E.cant && r.E.with && !r.E.joinAsk && r.Eb.back && r.Eb.gone && r.Eb.alive, '1592에 붙잡으면 ④ 교동도 — 병을 깨뜨렸으니 형이 따른다 · 매수 · 임해·설화가 배에 · 빈 편지 뒷장');
    ok(r.B1.night === 'lose' && r.B1.needle && r.B1.wall && r.B1.mak === 'palace' && !r.B1.hired, '일기토에 지면 설화가 침으로 찌른다 · 담을 넘는다(육상전) · 막동은 궁에');
    ok(r.B4.imhae === 'peace' && r.B4.seol === 'ship' && r.B4.hired && r.B4.letter && r.B4.human && r.B4.threw && r.B4b.reply, '④ 편지 — 마지막 약병을 갯벌에 던지고 「사람으로 죽겠소」 · 설화를 배에 · 답장을 광해에게');
    ok(r.B5.last === 'history' && !r.B5.gh && r.B5.stable && /단정히 앉아/.test(r.newsB.kyo) && /의관의 집에 숨었다가/.test(r.newsB.coup) && /오래 울었다/.test(r.newsB.crown), '⑤ 역사대로 — 막동(궁궐 마구간지기)을 보내지 않는다 · 소식(사람으로 죽은 형 · 의관의 집)');
    ok(r.C4.imhae === 'killed' && r.C4.seol === 'stay' && !r.C4.letter && r.C4.beast && r.C4.told && r.C4.back === false, '짐승을 깨운 채 빼내려 하면 역사대로 · 설화는 혜민서에 남는다');
    ok(r.D.swap === 'no' && r.D.later === false, '웃어넘기면 이야기가 끝난다');
    ok(r.oldSave === 0 && r.rumor && r.journal && r.voices, '옛 저장 · 소문 · 일지 · 네 사람의 말투');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
