/* 여성 제독의 사건·업적 (tests/female_events_smoke.js) — node tests/female_events_smoke.js
   ① 백설공주: 여성 제독은 여자 부하만 여섯(여자 일곱) · 소문도 그 말로
   ② 부하들 사이의 썸: 고백 상담이 반대로 — 여자 부하가 찾아와 그 남자 부하가 어떠냐고 묻는다
   ③ 무도회: 여성 제독에게는 귀공자·왕자·공자·영식이 오고, 청혼을 받으면 남편이 되어 부하로 배에 오른다
   ④ 업적: 팜므파탈·측천무후·남자는 배 여자는 항구 (여성) / 카사노바·의자왕·사랑은 불가능의 영역·동화 업적 (남성) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (error) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, R = G.R, UI = G.UI, H = G.Husbands, AC = G.Achieve, BL = G.Ball;
      let said = [], asks = [], pick = null;
      UI.say = async (t, who) => { said.push((who && who.name ? who.name + ': ' : '') + String(t)); }; UI.alert = async () => {}; UI.toast = () => {}; UI.confirm = async () => true;
      UI.choose = async (t, o) => o[0].value;
      UI.ask = async (t, o) => { asks.push(o.map(x => x.label)); const v = pick ? pick(o) : o[0].value; return v; };
      G.State.save = () => {}; G.Game.refreshHud = () => {}; G.Game.cityHud = () => {};
      if (G.Outcome) G.Outcome.show = async () => {};
      AC.afterWed = async (id) => { AC.recordMarriage(id); return AC.check(); };   // 업적 장면 창은 띄우지 않는다 (셈만)
      function fresh(g, age) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
        const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: age || 25, birth: { m: 1, d: 1 }, st: { str: 70, int: 70, mar: 70, cha: 90 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal', g });
        s.date = { y: 1500, m: 6, d: 1 }; s.day = 7300; s.player.born.y = s.date.y - (age || 25); s.loc.city = 0; s.loc.mode = 'city'; s.player.gold = 99999; s.mates = [];   // 처음부터 타는 부관은 내린다 (인원을 세는 시험)
        return s;
      }
      const men = G.MATES.filter(d => d.g !== 'f' && !d.minor && !d.sib && !d.wed && !d.eventOnly && d.id !== 'rocco'), women = G.MATES.filter(d => d.g === 'f' && !d.minor && !d.sib && !d.wed);
      function add(s, d, aff) { const m = { id: d.id, role: 'none', loyal: 80, aff: aff || 0, joined: 14900101 }; s.mates.push(m); return m; }

      // ① 백설공주
      let s = fresh('f'); women.slice(0, 6).forEach(d => add(s, d)); out.snowF = G.Tale.snowOk(); out.womenN = women.length + '/' + s.mates.length;
      s.mates.pop(); add(s, men[0]); out.snowFmixed = G.Tale.snowOk();
      s = fresh('f'); men.slice(0, 6).forEach(d => add(s, d)); out.snowFmen = G.Tale.snowOk();
      const rumor = G.EVENT_RUMORS.filter(x => x.id === 'snow_white')[0];
      out.rumorF = G.EventRumor.texts(rumor).map(t => t.y || t).join(' ');
      s = fresh('m'); men.slice(0, 6).forEach(d => add(s, d)); out.snowM = G.Tale.snowOk();
      out.rumorM = G.EventRumor.texts(rumor).map(t => t.y || t).join(' ');

      // ② 고백 상담
      async function consult(g, choose, affOn) {
        const st = fresh(g), mm = add(st, men[0], g === 'f' ? affOn : 0), ff = add(st, women[0], g === 'm' ? affOn : 0);
        const p = { m: men[0].id, f: women[0].id, heat: 80, stage: 'some' };
        said = []; asks = []; pick = choose;
        await G.Romance.EV.confess(p); pick = null;
        return { first: said[1] || '', all: said.join(' | '), asks: asks.map(a => a.join('/')).join(' || '), stage: p.stage, mm, ff };
      }
      let c = await consult('f', o => o[0].value, 0);
      out.consultF = [c.first.indexOf(women[0].name + ':') === 0, /찾아가 귀띔했다/.test(c.all), c.stage].join('|');
      c = await consult('f', o => (o.filter(x => /사실은/.test(x.label))[0] || o[0]).value, 60);
      out.consultFmine = [/제독님도/.test(c.all), c.stage, c.ff.loyal, c.mm.aff].join('|');
      c = await consult('m', o => o[0].value, 0);
      out.consultM = [c.first.indexOf(men[0].name + ':') === 0, /귀띔했다/.test(c.all), c.stage].join('|');

      // ③ 무도회
      const chance = G.U.chance;
      s = fresh('f');
      out.guestsF = BL.pickGuests(3).map(l => l.title + ' ' + l.short + (l.g === 'm' ? '' : '(여)')).join(',');
      out.titles = G.BALL_GENTS.map(l => l.title).filter((x, i, a) => a.indexOf(x) === i).sort().join(',');
      const g0 = G.BALL_GENT.bg_friedrich, ctx = { guests: [g0], out: [], debut: null, dress: 0, wifeHurt: false, fav: null, score: 0 };
      said = []; asks = []; pick = o => (o.filter(x => /바다 이야기/.test(x.label))[0] || o[0]).value;
      G.U.chance = () => true; await BL._t.spotlight(ctx); G.U.chance = chance; pick = null;
      out.spot = [BL.rec(g0.id).aff > 0, /프리드리히/.test(said[0] || ''), asks[0].some(x => /아들/.test(x)), ctx.out.join(' / ')].join('|');
      BL.rec(g0.id).aff = G.BALANCE.ball.affWed; BL.rec(g0.id).tgt = 'p'; BL.autoWed = true; const gold0 = s.player.gold;
      await BL._t.proposal(ctx); BL.autoWed = null;
      out.wedGent = [H.is(g0.id), s.mates.some(m => m.id === g0.id), !!s.player.wife, BL.rec(g0.id).wed, s.player.gold - gold0, H.info().replace(/<[^>]+>/g, ''), G.MATE[g0.id].eventOnly].join('|');
      out.wedLog = s.log.slice(-1).map(x => x.t || x.text || x).join('');
      out.guestsAfter = BL.pickGuests(8).some(l => l.id === g0.id);
      s = fresh('m'); out.guestsM = BL.pickGuests(3).every(l => l.g !== 'm');

      // ④ 업적
      const ids = a => a.map(x => x.id);
      s = fresh('f'); const lf = ids(AC.list());
      s = fresh('m'); const lm = ids(AC.list());
      const only = ['casanova', 'uijawang', 'love_impossible', 'happily', 'dreamcome'], fem = ['femme_fatale', 'cheukcheon', 'ship_harbor'];
      out.listF = [only.some(i => lf.indexOf(i) >= 0), fem.every(i => lf.indexOf(i) >= 0), lf.length].join('|');
      out.listM = [only.every(i => lm.indexOf(i) >= 0), fem.some(i => lm.indexOf(i) >= 0), lm.length].join('|');
      out.getAll = !!AC.get('femme_fatale') && !!AC.get('casanova');
      const mx = G.BALANCE.wives.maxSpouses; G.BALANCE.wives.maxSpouses = 2;
      s = fresh('f', 25); const a1 = add(s, men[0], 100), a2 = add(s, men[1], 100);
      s.player.items.push({ id: 'ring', qty: 2 });
      await H.propose(men[0], a1, async () => {}); await H.propose(men[1], a2, async () => {});
      out.femme = [AC.progress(AC.get('femme_fatale'), []).done, AC.progress(AC.get('cheukcheon'), []).done, AC.done('femme_fatale'), AC.progress(AC.get('casanova'), []).done].join('|');
      s.loc.mode = 'sea'; AC.onVoyageStart(0);
      out.harbor = [AC.done('ship_harbor'), AC.done('love_impossible')].join('|');
      add(s, men[2]); s.player.voyageAchievements.husbandsOnly = false; AC.trackVoyageDay(); out.harborMixed = !!s.player.voyageAchievements.husbandsOnly;
      s = fresh('f', 25); s.player.born.y = s.date.y - 71; const b1 = add(s, men[0], 100), b2 = add(s, men[1], 100); s.player.items.push({ id: 'ring', qty: 2 });
      await H.propose(men[0], b1, async () => {}); await H.propose(men[1], b2, async () => {});
      out.cheuk = [AC.progress(AC.get('cheukcheon'), []).done, AC.progress(AC.get('femme_fatale'), []).done].join('|');
      G.BALANCE.wives.maxSpouses = mx;
      out.events = ['femme_fatale', 'cheukcheon', 'ship_harbor'].every(i => G.ACHV_EVENTS[i] && G.ACHV_EVENTS[i].n.length === 2);
      return out;
    });
    console.log('① 백설공주');
    ok(r.snowF === true && r.snowFmixed === false && r.snowFmen === false, '여성 제독: 여자 부하만 여섯일 때 — ' + [r.snowF, r.snowFmixed, r.snowFmen, r.womenN].join());
    ok(r.snowM === true, '남성 제독: 예전대로 남자 부하만 여섯');
    ok(/여자 일곱/.test(r.rumorF) && /사내 일곱/.test(r.rumorM), '소문도 제독에 맞게');
    console.log('② 고백 상담');
    ok(r.consultF === 'true|true|lover', '여성 제독: 여자 부하가 찾아와 묻고, 귀띔한 뒤 고백으로 — ' + r.consultF);
    ok(/^true\|cold\|70\|65$/.test(r.consultFmine), '제독이 마음에 둔 남자 부하면 물러난다(충성 −10 · 제독의 호감 +5) — ' + r.consultFmine);
    ok(r.consultM === 'true|false|lover', '남성 제독: 예전대로 남자 부하가 찾아온다');
    console.log('③ 무도회');
    ok(r.titles === '공자,귀공자,악사,영식,왕자', '귀공자·왕자·공자·영식(과 악사)이 있다: ' + r.titles);
    ok(r.guestsF.split(',').length === 3 && !/\(여\)/.test(r.guestsF) && r.guestsM === true, '여성 제독에게는 귀공자들, 남성 제독에게는 아가씨들 — ' + r.guestsF);
    ok(/^true\|true\|false\|/.test(r.spot) && /좋아하는 것을 알아맞혔다/.test(r.spot), '귀공자가 다가온다(아들 소개 없음) — ' + r.spot.split('|').slice(3).join(''));
    ok(/^true\|true\|false\|p\|40000\|/.test(r.wedGent) && /배에 함께/.test(r.wedGent), '청혼을 받으면 남편이 되어 부하로 배에 오른다 · 지참금 — ' + r.wedGent.split('|')[5]);
    ok(/^무도회에서 만난 프리드리히 \(덴마크 왕자\)를 남편으로 맞았다/.test(r.wedLog) && r.guestsAfter === false, '일지(이름이 한 번만): ' + r.wedLog);
    console.log('④ 업적');
    ok(r.listF.indexOf('false|true|') === 0 && r.listM.indexOf('true|false|') === 0 && r.getAll, '성별마다 다른 목록 — 여성 ' + r.listF.split('|')[2] + '개 · 남성 ' + r.listM.split('|')[2] + '개');
    ok(r.femme === 'true|false|true|false', '팜므파탈(20대에 남편 정원을 채움) — ' + r.femme);
    ok(r.harbor === 'true|false' && r.harborMixed === false, '남자는 배 여자는 항구(남편만 탄 배로 출항) — ' + r.harbor);
    ok(r.cheuk === 'true|false', '측천무후(일흔 뒤에) — ' + r.cheuk);
    ok(r.events === true, '세 업적의 장면 글이 있다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' / ') : ''));
    console.log('female_events_smoke: 모두 통과');
  } finally { await browser.close(); }
})().catch(e => { console.error('실패:', e.message); process.exit(1); });
