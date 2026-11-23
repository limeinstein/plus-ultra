/* 여성 제독을 부르는 말 (tests/female_speech_smoke.js) — node tests/female_speech_smoke.js
   ① 나리 → 아씨 · 도련님 → 아가씨 · 형님 → 누님 (작위가 있으면 「○○ 각하」 그대로) · 남성 제독은 그대로
   ② 대화창: 「제독 나리」 · 제독을 부르는 사람의 말 · 제독의 아이가 하는 말 (아버지 ↔ 어머니) · 남의 이야기는 그대로
   ③ 상인 후원자·교황의 말 · 아이와의 사이 · 세대 교체의 글
   ④ 작위가 낮을 때 얕보는 인사 (없음 60% · 1칸 30% · 2칸 15% · 그 위는 없음) */
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
      const out = {}, R = G.R, UI = G.UI, CT = G.Court, F = G.Family;
      let alerts = [];
      UI.say = async () => {}; UI.alert = async (t) => { alerts.push(String(t)); }; UI.toast = () => {}; UI.confirm = async () => true;
      UI.choose = async (t, o) => o[0].value; UI.ask = async (t, o) => o[0].value; UI.fade = async () => {};
      G.State.save = () => {}; G.Game.refreshHud = () => {}; G.Game.go = () => {};
      if (G.BALANCE.oldGuard) G.BALANCE.oldGuard.kinChance = 0;
      function fresh(g) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        const s = G.Game.state = G.State.newGame({ name: '마리아 코스타', given: '마리아', surname: '코스타', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal', g });
        s.date = { y: 1500, m: 6, d: 1 }; s.day = 7300; s.loc.city = 0; s.loc.mode = 'city';
        return s;
      }
      const lisbon = G.CITY_DATA[0];
      function rank(n) { G.Court.state().titles.PT = n; }
      // ①
      let s = fresh('f');
      out.calls = [R.heroCall('나리'), R.heroCall('도련님'), R.heroCall('형님'), R.heroCall('각하'), R.heroParent()].join();
      rank(1); out.adr1 = CT.address(lisbon); rank(3); out.adr3 = CT.address(lisbon);
      // ②
      const kid = { name: '이네스 코스타', given: '이네스', sex: 'f', born: { y: 1490, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70 };
      s.player.kids.push(kid);
      out.say = [
        R.heroSay('아이고, 제독 나리! 어서 오십시오.', { name: '상인' }),
        R.heroSay('나리! 또 뵙는군요.', { name: G.MATE.d_artagnan.name }),
        R.heroSay('나리! 저건 풍차입니다요!', { name: '산초 판사' }),
        R.heroSay('아버지, 바다 이야기 해 주세요! 아빠 최고!', { name: '이네스 코스타' }),
        R.heroSay('어머니가 아버지 이야기를 해 주셨어요.', { name: '이네스' }),
        R.heroSay('……(엄마 치마 뒤에 숨는다)', { name: '이네스' }),
        R.heroSay('아버지의 원수를 갚겠소.', { name: '어느 장수' })
      ].join(' | ');
      out.bond = F.bondWord(kid);
      // ③
      const mer = G.SPONSORS.filter(x => x.type === 'merchant')[0], pope = G.SPONSORS.filter(x => x.type === 'pope')[0];
      let m1 = ''; for (let i = 0; i < 6; i++) m1 += G.Sponsor.line(mer, 'greetAgain', {}) + ' ';
      out.merchant = [/아씨/.test(m1), /나리/.test(m1)].join();
      out.popeBro = G.Sponsor.line({ type: 'pope', holders: [], title: '', id: 'x' }, 'greetFirst', {}).length > 0;
      // ④
      const chance = G.U.chance; let rolls = []; G.U.chance = (p) => { rolls.push(p); return true; };
      rank(0); rolls = []; out.slight0 = CT.hail(lisbon, 'tavern', ['어서 오시오.']) + '|' + rolls[0];
      rank(1); rolls = []; CT.hail(lisbon, 'inn', ['x']); out.slight1 = rolls[0];
      rank(2); rolls = []; CT.hail(lisbon, 'inn', ['x']); out.slight2 = rolls[0];
      rank(3); rolls = []; out.slight3 = CT.hail(lisbon, 'inn', ['x']) + '|' + rolls.length;
      G.U.chance = () => false; rank(0); out.noSlight = CT.hail(lisbon, 'tavern', ['어서 오시오.']);
      G.U.chance = chance;
      // 세대 교체의 글
      s = fresh('f'); const heir = { name: '후계 코스타', given: '후계', surname: '코스타', sex: 'f', born: { y: 1480, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70 };
      s.player.kids.push(heir); alerts = [];
      await F.succeed(heir, false);
      out.succ = [alerts.some(t => /어머니와의 사이/.test(t) && /어머니를 따름/.test(t) && /「어머니께 배운/.test(t) && /어머니는 오래 품어 온 해도/.test(t)), alerts.some(t => /아버지/.test(t))].join();
      // 남성 제독은 그대로
      s = fresh('m'); s.player.kids.push(kid);
      rank(1); out.maleAdr = CT.address(lisbon);
      G.U.chance = () => true; rank(0); out.maleHail = CT.hail(lisbon, 'tavern', ['어서 오시오.']); G.U.chance = chance;
      out.maleSay = [R.heroCall('나리'), R.heroParent(), R.heroSay('아이고, 제독 나리!', { name: 'x' }), R.heroSay('아버지, 오셨어요?', { name: '이네스' }), F.bondWord(kid)].join(' | ');
      let m2 = ''; for (let i = 0; i < 6; i++) m2 += G.Sponsor.line(mer, 'greetAgain', {}) + ' ';
      out.maleMerchant = [/아씨/.test(m2), /나리/.test(m2)].join();
      return out;
    });
    console.log('① 부르는 말');
    ok(r.calls === '아씨,아가씨,누님,각하,어머니', '나리 → 아씨 · 도련님 → 아가씨 · 형님 → 누님 · 각하는 그대로 · 어머니');
    ok(/아씨$/.test(r.adr1) && /각하$/.test(r.adr3), '작위 호칭: ' + r.adr1 + ' / ' + r.adr3);
    console.log('② 대화창');
    const say = r.say.split(' | ');
    ok(say[0] === '아이고, 제독 아씨! 어서 오십시오.', say[0]);
    ok(say[1] === '아씨! 또 뵙는군요.', '달타냥: ' + say[1]);
    ok(say[2] === '나리! 저건 풍차입니다요!', '남을 부르는 말은 그대로 — ' + say[2]);
    ok(say[3] === '어머니, 바다 이야기 해 주세요! 엄마 최고!', '제독의 아이: ' + say[3]);
    ok(say[4] === '아버지가 어머니 이야기를 해 주셨어요.' && say[5] === '……(유모 치마 뒤에 숨는다)', '아버지 ↔ 어머니: ' + say[4] + ' / ' + say[5]);
    ok(say[6] === '아버지의 원수를 갚겠소.', '아이가 아닌 사람의 「아버지」는 그대로');
    console.log('③ 후원자·가족');
    ok(r.merchant === 'true,false' && r.popeBro, '상인 후원자는 「아씨」라 부른다');
    ok(r.bond === '어머니를 따름', '아이와의 사이: ' + r.bond);
    ok(r.succ === 'true,false', '세대 교체의 글이 모두 「어머니」');
    console.log('④ 얕보는 인사');
    ok(/술집|아가씨|선장/.test(r.slight0) && /\|0\.6$/.test(r.slight0), '작위가 없으면 60% — ' + r.slight0.split('|')[0]);
    ok(r.slight1 === 0.3 && r.slight2 === 0.15, '작위 1칸 30% · 2칸 15%');
    ok(/각하/.test(r.slight3) && /\|0$/.test(r.slight3), '3칸(남작)부터는 공손하게 — ' + r.slight3.split('|')[0]);
    ok(r.noSlight === '어서 오시오.', '확률이 빗나가면 예전 인사');
    console.log('⑤ 남성 제독');
    ok(/나리$/.test(r.maleAdr) && r.maleHail === '어서 오시오.', '호칭·인사 그대로: ' + r.maleAdr);
    ok(r.maleSay === '나리 | 아버지 | 아이고, 제독 나리! | 아버지, 오셨어요? | 아버지를 따름' && r.maleMerchant === 'false,true', '대화·아이·상인 그대로');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' / ') : ''));
    console.log('female_speech_smoke: 모두 통과');
  } finally { await browser.close(); }
})().catch(e => { console.error('실패:', e.message); process.exit(1); });
