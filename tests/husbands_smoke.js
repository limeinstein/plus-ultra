/* 여성 제독의 남편들 (tests/husbands_smoke.js) — node tests/husbands_smoke.js
   ① 여성 제독 ↔ 남성 부하: 호감이 쌓이고 「청혼한다」가 나온다 · 여성 부하와는 애정선이 없다 · 남성 제독은 예전 그대로
   ② 청혼: 반지를 쓰고 남편이 되어 부하로 남는다 · 둘째 남편 · 정원 · 다른 부하의 연인은 안 된다
   ③ 남편은 해고·이별에서 빠진다 · 입항할 때의 주먹다짐(말리기·다침) · 자택 인사 · 수첩
   ④ 세대 교체: 어머니의 남자들은 어머니를 따라간다
   ⑤ 여급은 정보원(친분) · 후원자 설득의 이성 덤 없음 · 저장·불러오기 · 옛 저장 */
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
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, R = G.R, UI = G.UI, H = G.Husbands, MT = G.MateTalk;
      let asked = [], pick = null, said = [], alerts = [];
      UI.say = async (t) => { said.push(String(t)); }; UI.alert = async (t) => { alerts.push(String(t)); }; UI.toast = () => {}; UI.confirm = async () => true;
      UI.choose = async () => null;
      UI.ask = async (t, o) => { asked.push(o.map(x => x.label)); const v = pick ? pick(o) : null; pick = null; return v; };
      G.State.save = () => {}; G.Game.refreshHud = () => {};
      if (G.Outcome) G.Outcome.show = async () => {};
      if (G.Voice) { G.Voice.greet = () => '…'; G.Voice.again = () => '…'; G.Voice.chat = () => null; }
      function fresh(g) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal', g });
        s.date = { y: 1500, m: 6, d: 1 }; s.day = 7000; s.loc.city = 0; s.loc.mode = 'city';
        return s;
      }
      const men = G.MATES.filter(d => d.g !== 'f' && !d.minor && !d.sib && !d.wed && !d.eventOnly && d.id !== 'rocco').slice(0, 4);
      const woman = G.MATES.filter(d => d.g === 'f' && !d.minor && !d.sib && !d.wed && !d.witch)[0];
      const city = G.CITY_DATA[0];
      function add(s, d, aff) { const m = { id: d.id, role: 'none', loyal: 70, aff: aff || 0, joined: 14900101 }; s.mates.push(m); return m; }
      async function menu(m, choose) { asked = []; pick = choose || null; await MT.talk(city, m); return (asked[0] || []).join(','); }

      // ① 애정선
      let s = fresh('f'), a = add(s, men[0], 0), w = add(s, woman, 60);
      out.loveF = [MT.loveable(men[0]), MT.loveable(woman)].join();
      out.menuLow = await menu(a);
      // 한잔 → 호감이 오른다 (남성 부하) / 여성 부하는 그대로
      s.player.gold = 9999; pick = o => 'drink'; await MT.talk(city, a); out.affAfterDrink = a.aff;
      pick = o => 'drink'; await MT.talk(city, w); out.affWoman = w.aff;
      out.menuWoman = await menu(w);
      s = fresh('m'); a = add(s, men[0], 95); w = add(s, woman, 95);
      out.loveM = [MT.loveable(men[0]), MT.loveable(woman)].join();
      out.menuM = [await menu(a), await menu(w)].join(' / ');

      // ② 청혼
      s = fresh('f'); a = add(s, men[0], 95); const b = add(s, men[1], 95), c3 = add(s, men[2], 40);
      out.menuHigh = await menu(a);
      out.noRing = await H.propose(men[0], a, async () => {});
      s.player.items.push({ id: 'ring', qty: 2 });
      pick = o => 'wed'; await MT.talk(city, a);
      out.wed1 = [H.count(), H.is(men[0].id), s.mates.indexOf(a) >= 0, a.loyal >= 95, a.aff, R.itemCount ? R.itemCount('ring') : -1, H.ordinal(s.player.husbands[0])].join('|');
      out.menuHusband = await menu(a);
      pick = o => 'wed'; await MT.talk(city, b);
      out.wed2 = [H.count(), H.ordinal(s.player.husbands[0]), H.ordinal(s.player.husbands[1]), !!s.player.wife].join('|');
      out.log = s.log.slice(-3).map(x => x.t || x.text || x).join(' / ');
      // 다른 부하의 연인은 받지 않는다
      const pairOf = G.Romance.pairOf; G.Romance.pairOf = id => id === men[2].id ? { m: men[2].id, f: woman.id, stage: 'lover' } : null;
      s.player.items.push({ id: 'ring', qty: 1 }); c3.aff = 95; said = [];
      out.taken = [await H.propose(men[2], c3, async t => { said.push(t); }), said.join('')].join('|');
      G.Romance.pairOf = pairOf;
      // 정원
      const mx = G.BALANCE.wives.maxSpouses; G.BALANCE.wives.maxSpouses = 2;
      out.full = await H.propose(men[2], c3, async () => {}); G.BALANCE.wives.maxSpouses = mx;

      // ③ 해고·이별·주먹다짐·자택·수첩
      said = [];
      out.fire = [await G.MateDismiss.fire(a, city), s.mates.indexOf(a) >= 0, /남편/.test(said.join(''))].join('|');
      out.leaveWeight = G.MateLeave && G.MateLeave.weight ? G.MateLeave.weight(a) : 0;
      const K = G.BALANCE.husbands, chance = G.U.chance;
      G.U.chance = () => true;
      out.pending1 = H.pending();
      pick = o => 'leave'; alerts = []; said = [];
      await H.check();
      const hurt = [a, b].filter(m => m.hurt > s.day);
      out.brawl = [hurt.length, hurt[0] ? hurt[0].hurt - s.day : 0, alerts.length, said.length >= 4, s.husb.brawl === s.day].join('|');
      out.pending2 = H.pending();                      // 같은 날 다시 굴리지 않는다
      s.day += 1; out.pendingGap = H.pending();        // brawlGap이 지나지 않았다
      s.day += K.brawlGap; out.pendingHurt = H.pending();   // 다친 날이 지났으니 다시
      a.hurt = 0; b.hurt = 0; pick = o => 'calm'; const lo = [a.loyal, b.loyal]; a.loyal = 80; b.loyal = 80;
      await H.check();
      out.calm = [a.hurt > s.day || b.hurt > s.day, a.loyal, b.loyal].join('|');
      G.U.chance = chance;
      said = []; await G.Scenes.city.B.home.enter(city);
      out.home = said.length + '|' + (said[0] || '').slice(0, 40);
      out.info = H.info();
      // 저장·불러오기 뒤에도 남는다
      const copy = JSON.parse(JSON.stringify(s)); G.Game.state = copy;
      out.reload = [H.count(), H.is(men[1].id)].join('|');
      // 남편이 명단에서 사라지면 혼인도 끝난다
      copy.mates = copy.mates.filter(m => m.id !== men[1].id);
      out.pruned = [H.count(), H.is(men[1].id)].join('|');

      // ④ 세대 교체 — 어머니의 남자들은 어머니를 따라간다
      UI.choose = async (t, o) => o[0].value; pick = null; UI.ask = async (t, o) => o[0].value;
      UI.fade = async () => {}; G.Game.go = () => {};
      if (G.BALANCE.oldGuard) G.BALANCE.oldGuard.kinChance = 0;
      s = fresh('f'); s.player.given = '어머니'; s.player.surname = '코스타';
      const h1 = add(s, men[0], 100), h2 = add(s, men[1], 100), other = add(s, men[3], 0);
      s.player.husbands = [{ id: men[0].id, wed: 1, no: 1 }, { id: men[1].id, wed: 2, no: 2 }];
      const kid = { name: '후계 코스타', given: '후계', surname: '코스타', sex: 'f', born: { y: 1480, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70 };
      s.player.kids.push(kid); alerts = [];
      await G.Family.succeed(kid, false);
      const s2 = G.Game.state;
      out.succeed = [s2.player.generation, R.heroSex(), (s2.player.husbands || []).length, s2.mates.some(m => m.id === men[0].id || m.id === men[1].id), s2.mates.some(m => m.id === men[3].id),
        !!s2.flags['gone_' + men[0].id], alerts.some(t => t.indexOf(men[0].name) >= 0 && /따라/.test(t))].join('|');

      // ⑤ 여급 · 후원자 설득 · 옛 저장
      const maid = G.MAIDS.filter(m => m.city === 0)[0] || G.MAIDS[0], mc = G.CITY_DATA[maid.city];
      async function maidTitle(g) {
        const st = fresh(g); st.maids[maid.id] = { aff: 95, met: 3 }; st.loc.city = maid.city; let title = '';
        const ask0 = UI.ask; UI.ask = async (t, o) => { title = String(t); return null; };
        if (G.MateKnow) G.MateKnow.deliver = async () => {};
        said = []; await G.Scenes.city.B.tavern.maid(mc, maid); UI.ask = ask0;
        return title.replace(maid.name, '').replace(/[♥♡]/g, '').trim() + '|' + (said[0] || '');
      }
      out.maidF = await maidTitle('f'); out.maidM = await maidTitle('m');
      s = fresh('f'); delete s.player.husbands; delete s.husb;
      out.old = [H.count(), H.pending(), H.info()].join('|');
      out.names = men.map(d => d.name).join(',') + ' · ' + woman.name;
      return out;
    });
    console.log('① 애정선 (' + r.names + ')');
    ok(r.loveF === 'true,false', '여성 제독: 남성 부하와 애정선, 여성 부하와는 없음');
    ok(r.loveM === 'false,true', '남성 제독: 예전 그대로 (여성 부하와만)');
    ok(/청혼한다/.test(r.menuLow) && r.affAfterDrink > 0, '남성 부하에게 「청혼한다」가 보이고 한잔에 호감이 오른다 (+' + r.affAfterDrink + ')');
    ok(r.affWoman === 60 && !/청혼한다/.test(r.menuWoman), '여성 부하는 호감이 오르지 않고 청혼도 없다');
    ok(/^[^/]*\/[^/]*청혼한다/.test(r.menuM) && !/청혼한다.*\//.test(r.menuM), '남성 제독의 메뉴: 남성 부하에는 없고 여성 부하에만 — ' + r.menuM);
    console.log('② 청혼');
    ok(r.noRing === false, '반지가 없으면 청혼하지 못한다');
    ok(r.wed1 === '1|true|true|true|100|1|남편', '첫 남편: 부하로 남고 충성 95↑ · 호감 100 · 반지 하나 씀 — ' + r.wed1);
    ok(!/청혼한다/.test(r.menuHusband), '남편에게는 다시 청혼하지 않는다');
    ok(r.wed2 === '2|첫째 남편|둘째 남편|false', '둘째 남편 (player.wife는 쓰지 않는다) — ' + r.wed2);
    ok(/남편/.test(r.log), '일지: ' + r.log);
    ok(/^false\|.*마음은 이미/.test(r.taken), '다른 부하의 연인은 받지 않는다 — ' + r.taken);
    ok(r.full === false, '정원이 차면 더 맞지 못한다');
    console.log('③ 배 위의 남편');
    ok(r.fire === 'false|true|true', '남편은 해고할 수 없다');
    ok(r.leaveWeight === 0, '남편은 떠나는 부하에서 빠진다');
    ok(r.pending1 === true && /^1\|20\|1\|true\|true$/.test(r.brawl), '주먹다짐: 한 사람이 20일 다친다 — ' + r.brawl);
    ok(r.pending2 === false && r.pendingGap === false && r.pendingHurt === true, '같은 날·간격 안에는 없고, 간격이 지나면 다시');
    ok(r.calm === 'false|82|82', '말리면 다치지 않고 두 사람 충성 +2 — ' + r.calm);
    ok(/^[1-9]\d*\|/.test(r.home) && !/먼지/.test(r.home), '자택에는 남편들과 함께 — ' + r.home);
    ok(/배에 함께/.test(r.info) && /둘째 남편/.test(r.info), '수첩 「배우자」: ' + r.info.replace(/<[^>]+>/g, ''));
    ok(r.reload === '2|true' && r.pruned === '1|false', '저장·불러오기 뒤에도 남고, 명단에서 사라진 남편은 정리된다');
    console.log('④ 세대 교체');
    ok(r.succeed === '2|f|0|false|true|true|true', '어머니의 남자들은 어머니를 따라가고 다른 부하는 남는다 — ' + r.succeed);
    console.log('⑤ 여급·옛 저장');
    ok(/^— 친분\|제독님 오셨군요/.test(r.maidF), '여성 제독의 여급: ' + r.maidF);
    ok(/^— 호감\|당신 얼굴을 보니/.test(r.maidM), '남성 제독의 여급은 그대로: ' + r.maidM);
    ok(r.old === '0|false|', '옛 저장(남편 기록 없음)도 그대로 열린다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' / ') : ''));
    console.log('husbands_smoke: 모두 통과');
  } finally { await browser.close(); }
})().catch(e => { console.error('실패:', e.message); process.exit(1); });
