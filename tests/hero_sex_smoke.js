/* 제독의 성별 (tests/hero_sex_smoke.js) — node tests/hero_sex_smoke.js
   ① 성별은 R.heroSex 한 곳에서: 뒤를 이은 자녀(player.heir.sex) · player.g · 옛 player.sex · 옛 저장(없으면 남성)
   ② 제독 만들기: 성별 선택 → 그 성별의 생김새·이름만, 새 게임에 player.g 저장
   ③ 여성 제독은 여급·여성 부하에게 청혼하지 않고, 여급과 「함께 시간을 보낸다」가 없고, 옛 저장에 남은 아내에게 아이가 생기지 않는다
   ④ 성별을 보던 곳(작위·무도회·결과 연출·왕녀·소꿉친구·동생)이 모두 같은 답을 낸다 · 세대 교체가 새 제독의 성별을 적는다 */
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

    // ---------------------------------------------------------------- ① ③ ④ 규칙
    const r = await page.evaluate(async () => {
      const out = {}, R = G.R, UI = G.UI, F = G.Family;
      let asked = [];
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; UI.confirm = async () => true;
      UI.choose = async () => null; UI.ask = async (t, o) => { asked.push(o.map(x => x.label)); return null; };
      G.State.save = () => {};
      function fresh(g, extra) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        const p = Object.assign({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 25, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' }, extra || {});
        if (g) p.g = g;
        const s = G.Game.state = G.State.newGame(p);
        s.date = { y: 1500, m: 6, d: 1 };
        return s;
      }
      // ① 판정
      let s = fresh();
      out.defSex = R.heroSex() + '|' + s.player.g;
      s = fresh('f');
      out.fSex = R.heroSex() + '|' + s.player.g + '|' + R.heroFemale();
      s = fresh(); delete s.player.g;                       // 옛 저장: 성별 칸이 없다
      out.oldSave = R.heroSex();
      s.player.heir = { sex: 'f', folder: '' }; s.player.generation = 2;   // 옛 저장: 뒤를 이은 딸
      out.oldDaughter = R.heroSex();
      s.player.g = 'm'; out.heirFirst = R.heroSex(); delete s.player.g;   // 후계자 기록(heir.sex)이 먼저다
      delete s.player.heir; s.player.generation = 1; s.player.sex = 'f';   // 옛 결과 연출이 보던 자리
      out.oldSexField = R.heroSex();
      out.otherPlayer = R.heroSex({ g: 'f' }) + R.heroSex({ g: 'm', heir: { sex: 'f' } }) + R.heroSex({});

      // ④ 성별을 보던 곳들 — 여성 제독(g) · 뒤를 이은 딸(옛 저장) · 남성
      function probe() {
        const realm = G.COURT.realms[G.Game.state.player.nation], t = G.Court.title(realm, 3);
        return [t.native, G.Outcome.key('win'), G.Princess.single(), G.Osa.heirFemale()].join('|');
      }
      s = fresh('f'); out.probeF = probe();
      s = fresh(); delete s.player.g; s.player.heir = { sex: 'f', folder: '' }; s.player.generation = 2; out.probeDaughter = probe();
      s = fresh('m'); out.probeM = probe();

      // ③ 여급: 청혼·데이트 메뉴
      const city = G.CITY_DATA[0], maid = G.MAIDS.filter(m => m.city === 0)[0] || G.MAIDS[0], mc = G.CITY_DATA[maid.city];
      async function maidMenu(g) {
        const st = fresh(g); st.maids = st.maids || {}; st.maids[maid.id] = { aff: 95, met: 3 };
        st.loc.city = maid.city; asked = [];
        if (G.MateKnow) G.MateKnow.deliver = async () => {};
        await G.Scenes.city.B.tavern.maid(mc, maid);
        return (asked[0] || []).join(',');
      }
      out.maidM = await maidMenu('m'); out.maidF = await maidMenu('f');
      s = fresh('f'); s.maids[maid.id] = { aff: 95, met: 3 }; out.dateF = G.FamEv.canDate(maid.id);
      s = fresh('m'); s.maids[maid.id] = { aff: 95, met: 3 }; out.dateM = !!G.FamEv.canDate(maid.id);
      // ③ 여성 부하: 청혼 메뉴
      const fm = G.MATES.filter(d => d.g === 'f' && !d.minor && !d.sib && !d.wed && !d.witch)[0];
      async function mateMenu(g) {
        const st = fresh(g), m = { id: fm.id, loyal: 80, aff: 95, joined: { y: 1490, m: 1, d: 1 } };
        st.mates.push(m); asked = [];
        if (G.Voice) { G.Voice.greet = () => '…'; G.Voice.again = () => '…'; }
        await G.MateTalk.talk(mc, m);
        return (asked[0] || []).join(',');
      }
      out.mateName = fm.name; out.mateM = await mateMenu('m'); out.mateF = await mateMenu('f');
      // ③ 본처가 있을 때의 청혼(둘째 부인)도 막힌다
      s = fresh('f'); s.player.wife = maid.id;
      out.w2F = await G.Wives.proposeMaid(mc, maid, async () => {});
      // ③ 옛 저장에 남은 아내 — 아이가 생기지 않는다 (남성 제독은 생긴다)
      const chance = G.U.chance; G.U.chance = () => true;
      async function conceive(g) {
        const st = fresh(g); st.player.wife = maid.id; st.maids[maid.id] = { aff: 100, met: 9 }; st.loc.city = st.player.home;
        await F.homeVisit(true);
        return !!st.player.preg;
      }
      out.pregM = await conceive('m'); out.pregF = await conceive('f');
      G.U.chance = chance;
      out.asked = null;
      return out;
    });
    console.log('① 성별 판정');
    ok(r.defSex === 'm|m', '성별 없이 만든 새 게임은 남성으로 저장: ' + r.defSex);
    ok(r.fSex === 'f|f|true', '여성으로 만든 새 게임: ' + r.fSex);
    ok(r.oldSave === 'm', '성별 칸이 없는 옛 저장 = 남성');
    ok(r.oldDaughter === 'f', '옛 저장의 뒤를 이은 딸 = 여성');
    ok(r.oldSexField === 'f', '옛 player.sex 도 읽는다');
    ok(r.heirFirst === 'f', '후계자 기록(heir.sex)이 g보다 먼저');
    ok(r.otherPlayer === 'ffm', '다른 제독 객체를 넘겨도 같은 규칙: ' + r.otherPlayer);
    console.log('④ 성별을 보던 곳');
    ok(/^Baronesa\|outcomes\/win_f\|false\|true$/.test(r.probeF), '여성 제독: 여성형 작위·여성 결과 그림·왕녀 청혼 없음 — ' + r.probeF);
    ok(r.probeDaughter === r.probeF, '뒤를 이은 딸(옛 저장)도 같은 답 — ' + r.probeDaughter);
    ok(/^Barão\|outcomes\/win\|true\|false$/.test(r.probeM), '남성 제독은 그대로 — ' + r.probeM);
    console.log('③ 청혼·데이트·임신');
    ok(/청혼한다/.test(r.maidM) && /함께 시간을 보낸다/.test(r.maidM), '남성 제독의 여급 메뉴: ' + r.maidM);
    ok(r.maidF && !/청혼한다/.test(r.maidF) && !/함께 시간을 보낸다/.test(r.maidF) && /선물한다/.test(r.maidF), '여성 제독의 여급 메뉴에는 청혼·데이트가 없다: ' + r.maidF);
    ok(r.dateF === null && r.dateM === true, '여급 데이트: 여성 제독 null · 남성 제독 가능');
    ok(/청혼한다/.test(r.mateM), '남성 제독 → ' + r.mateName + ': ' + r.mateM);
    ok(r.mateF && !/청혼한다/.test(r.mateF) && /선물한다/.test(r.mateF), '여성 제독 → ' + r.mateName + ' 청혼 없음: ' + r.mateF);
    ok(r.w2F === false, '본처가 있는 옛 저장의 여성 제독도 둘째 부인을 맞지 않는다');
    ok(r.pregM === true && r.pregF === false, '아내의 임신: 남성 제독 ' + r.pregM + ' · 여성 제독 ' + r.pregF);

    // ---------------------------------------------------------------- ② 제독 만들기 화면
    console.log('② 제독 만들기');
    const c = await page.evaluate(async () => {
      const out = {}, I = G.Img;
      out.facesM = I.heroFaces().length + '/' + I.heroFaces('m').length; out.facesF = I.heroFaces('f').map(k => k.split('/').pop()).join(',');
      out.sexOfLooks = I.heroLookSex('jessica') + I.heroLookSex('sea_dog') + I.heroLookSex('rose_f');
      G.UI.confirm = async () => true; G.UI.toast = () => {};
      let launched = 0; G.Game.launch = async () => { launched++; };
      G.Game.go('create');
      const q = s => document.querySelector(s), opt = v => document.querySelector('.create [data-g="sex"][data-v="' + v + '"]');
      out.hasOpt = !!opt('m') && !!opt('f') && opt('m').classList.contains('on');
      const maleName = q('#nm').value;
      opt('f').click();
      out.onF = opt('f').classList.contains('on');
      for(let i=0;i<20&&q('.look-name b').textContent!=='붉은 외투의 선장';i++)q('#face').click();
      out.look1 = q('.look-name b') ? q('.look-name b').textContent : '';
      out.nameF = q('#nm').value + ' ' + q('#sn').value;
      out.cycle=[];for(let i=0;i<15;i++){out.cycle.push(q('.look-name b').textContent);q('#face').click();}out.look2=out.cycle.find(n=>n==='꽃 댕기의 항해사');out.look3=q('.look-name b').textContent;
      out.note = q('.look-name small') ? q('.look-name small').textContent : '';
      out.specG = G.Scenes.create.playerSpec().g;
      q('#go').click();
      for (let i = 0; i < 200 && !launched; i++) await new Promise(r => setTimeout(r, 50));
      const p = G.Game.state.player;
      out.savedF = p.g + '|' + p.look + '|' + G.R.heroSex() + '|' + p.portrait.g + '|' + [].concat(p.portrait.img || []).join(',');
      // 남성으로 다시
      launched = 0; G.Game.go('create'); opt('f').click(); opt('m').click();
      out.backToM = q('.look-name b').textContent + '|' + q('.look-name small').textContent;
      q('#go').click();
      for (let i = 0; i < 200 && !launched; i++) await new Promise(r => setTimeout(r, 50));
      const p2 = G.Game.state.player;
      out.savedM = p2.g + '|' + I.heroLookSex(p2.look) + '|' + p2.portrait.g;
      return out;
    });
    ok(/^(\d+)\/\1$/.test(c.facesM) && +c.facesM.split('/')[0] >= 14, '남성 생김새 목록은 그대로: ' + c.facesM);
    ok(c.facesF === 'black_hunter_f,conqueror_f,excavator_f,explorer_f,gold_surveyor_f,hunter_f,jessica,lookout_f,missionary_f,navigator_f,noble_navigator_f,soldier_f,soyoung,surveyor_f,white_navigator_f', '여성 생김새: ' + c.facesF);
    ok(c.sexOfLooks === 'fmf', '생김새의 성별(표·_f 이름): ' + c.sexOfLooks);
    ok(c.hasOpt && c.onF, '성별 단추가 있고 누르면 바뀐다');
    ok(new Set(c.cycle).size===15 && c.look1 === '붉은 외투의 선장' && c.look2 === '꽃 댕기의 항해사' && c.look3 === c.look1, '여성 15종을 한 바퀴 돌아 같은 얼굴로: ' + [c.look1, c.look2, c.look3].join(' → '));
    ok(/^(이네스|베아트리스|카타리나|레오노르|필리파|마리아나) /.test(c.nameF), '여성 이름으로 바뀐다: ' + c.nameF);
    ok(c.note === '' && c.specG === 'f', '40대 그림이 없는 여성 생김새는 수염 안내가 없다 · 초상 성별 f');
    ok(/^f\|(jessica|soyoung)\|f\|f\|portraits\/player\/(jessica|soyoung)$/.test(c.savedF), '여성으로 시작 → 저장: ' + c.savedF);
    ok(/수염/.test(c.backToM) && c.savedM === 'm|m|m', '남성으로 돌리면 예전 그대로: ' + c.backToM + ' · ' + c.savedM);

    // ---------------------------------------------------------------- ④ 세대 교체가 성별을 적는다
    console.log('④ 세대 교체');
    const h = await page.evaluate(async () => {
      const UI = G.UI, F = G.Family;
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; UI.confirm = async () => true; UI.choose = async (t, o) => o[0].value; UI.ask = async (t, o) => o[0].value;
      UI.fade = async () => {}; G.Game.go = () => {}; G.Game.refreshHud = () => {}; G.State.save = () => {};
      if (G.BALANCE.oldGuard) G.BALANCE.oldGuard.kinChance = 0;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      async function succeed(g, look, kidSex) {
        const s = G.Game.state = G.State.newGame({ name: '선대', given: '선대', surname: '코스타', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal', g });
        s.player.look = look; s.player.portrait = G.Art.withImg(G.Art.portraitSpec({ seed: 'x', culture: 'med', g: g, age: 'young' }), ['portraits/player/' + look]);
        s.date = { y: 1520, m: 6, d: 1 };
        const k = { name: '후계 코스타', given: '후계', surname: '코스타', sex: kidSex, born: { y: 1500, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70 };
        s.player.kids.push(k);
        await F.succeed(k, false);
        const p = G.Game.state.player;
        return [p.g, G.R.heroSex(), p.look, p.generation].join('|');
      }
      return { son: await succeed('m', 'sea_dog', 'm'), sonOfMother: await succeed('f', 'jessica', 'm'), daughter: await succeed('m', 'sea_dog', 'f') };
    });
    ok(h.son === 'm|m|sea_dog|2', '아버지 → 아들: ' + h.son);
    ok(h.sonOfMother === 'm|m|admiral|2', '여성 제독 → 남자 후계는 남성·기본 제독 생김새: ' + h.sonOfMother);
    ok(h.daughter === 'f|f|sea_dog|2', '딸이 이으면 여성으로 적힌다: ' + h.daughter);

    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' / ') : ''));
    console.log('hero_sex_smoke: 모두 통과');
  } finally { await browser.close(); }
})().catch(e => { console.error('실패:', e.message); process.exit(1); });
