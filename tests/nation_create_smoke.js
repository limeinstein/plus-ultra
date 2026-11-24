/* 제독의 국적 여섯 (tests/nation_create_smoke.js) — node tests/nation_create_smoke.js   2026-11-24
   ① 제독 만들기: 국적 단추 여섯(에스파냐·포르투갈·잉글랜드·네덜란드·오스만·조선) → 그 나라의 이름·모국어, 성별을 바꾸면 그 나라의 여성 이름
   ② 새 게임: 고향·첫 배·첫 부관·아는 고장·나라 이름·모국어·자국 판정이 나라마다 (G.NATIONS — js/data/base.js)
   ③ 규칙: 제 나라 궁정의 작위 사다리(잉글랜드·오스만·조선) · 외교의 나라 열쇠 · 이슬람 항구(오스만 제독은 이교도가 아니다) · 제 나라 회사 · 아이 이름 · 점령지의 깃발
   ④ 예전 그대로: byNation 없이 부른 새 게임(이야기 모드·튜토리얼·다른 시험)은 리스본/세빌리아 · 이야기 모드의 주인공은 새 규칙을 타지 않는다 */
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
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });

    // ---------------------------------------------------------------- ① ② 만들기 화면 → 새 게임
    console.log('① ② 제독 만들기 → 새 게임');
    const WANT = {
      ES: { home: '세빌리아', lang: '스페인어', l2: '포르투갈어', ship: 'caravel', mate: 'rocco', name: '에스파냐' },
      PT: { home: '리스본', lang: '포르투갈어', l2: '스페인어', ship: 'caravel', mate: 'rocco', name: '포르투갈' },
      EN: { home: '런던', lang: '게르만어', l2: '로망스어', ship: 'caravel', mate: 'rocco', name: '잉글랜드' },
      NL: { home: '암스테르담', lang: '게르만어', l2: '로망스어', ship: 'caravel', mate: 'rocco', name: '네덜란드' },
      OT: { home: '이스탄불', lang: '아랍어', l2: '로망스어', ship: 'caravel', mate: 'rocco', name: '오스만 제국' },
      KR: { home: '한양', lang: '조선어', l2: '중국어', ship: 'maengseon', mate: 'kim', name: '조선' }
    };
    const made = await page.evaluate(async () => {
      const out = { order: [], nat: {} };
      G.UI.confirm = async () => true; G.UI.toast = () => {}; G.State.save = () => {};
      G.Game.launch = async () => {};
      await G.Game.ensureGeo();
      G.Game.go('create');
      const q = s => document.querySelector(s), opt = (g, v) => document.querySelector('.create [data-g="' + g + '"][data-v="' + v + '"]');
      out.order = [...document.querySelectorAll('.create [data-g="nat"]')].map(e => e.dataset.v);
      out.labels = [...document.querySelectorAll('.create [data-g="nat"]')].map(e => e.textContent);
      out.sex = !!opt('sex', 'm') && !!opt('sex', 'f');
      for (const k of G.NATION_ORDER) {
        G.Game.go('create');
        if (k !== 'PT') opt('nat', k).click();
        const o = out.nat[k] = {};
        o.on = opt('nat', k).classList.contains('on');
        o.nameM = q('#nm').value + ' ' + q('#sn').value; o.inM = G.NATIONS[k].names.m.indexOf(o.nameM) >= 0;
        o.desc = q('.cr-natdesc').textContent === G.NATIONS[k].desc;
        opt('sex', 'f').click();
        o.nameF = q('#nm').value + ' ' + q('#sn').value; o.inF = G.NATIONS[k].names.f.indexOf(o.nameF) >= 0;
        o.called = q('#fullnm b').textContent;
        o.over = [...document.querySelectorAll('.create .sect')].filter(s => s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1).length;
        opt('sex', 'm').click();
        q('#go').click();
        for (let i = 0; i < 40 && !(G.Game.state && G.Game.state.player.nation === k && G.Game.state.player.portrait); i++) await new Promise(r => setTimeout(r, 50));
        const s = G.Game.state, p = s.player, R = G.R, hc = G.CITY_DATA[p.home];
        Object.assign(o, { nation: p.nation, g: p.g, home: hc.name, at: s.loc.city === p.home, ship: s.fleet.ships[0].type, shipName: s.fleet.ships[0].name, mate: s.mates[0].id + ':' + s.mates[0].role,
          lg: p.lg.map((v, i) => v ? G.LANGS[i] + v : '').filter(Boolean).join(','), natName: R.nationName(p.nation), native: G.LANGS[R.nativeLang(p.nation)],
          homeNat: R.isHomeNation(hc), knowsHome: s.known.indexOf(p.home) >= 0, known: s.known.length, food: Math.round(R.daysOfFood()) });
      }
      return out;
    });
    ok(made.order.join(',') === 'ES,PT,EN,NL,OT,KR', '국적 단추 여섯, 차례대로: ' + made.labels.join(' · '));
    ok(made.sex, '성별 단추(남성·여성)가 있다');
    for (const k of Object.keys(WANT)) {
      const o = made.nat[k], w = WANT[k];
      ok(o.on && o.inM && o.inF && o.desc && !o.over, k + ' 고르면 그 나라 이름(남 ' + o.nameM + ' · 여 ' + o.called + ')과 소개, 칸 넘침 없음');
      ok(o.nation === k && o.home === w.home && o.at && o.knowsHome && o.homeNat, k + ' → ' + o.home + '에서 시작, 제 나라 항구로 친다 (아는 고장 ' + o.known + '곳)');
      ok(o.ship === w.ship && o.mate === w.mate + ':first' && o.food >= 15, k + ' 첫 배 ' + o.shipName + '(' + o.ship + ') · 부관 ' + o.mate + ' · 식량 ' + o.food + '일');
      ok(o.natName === w.name && o.native === w.lang && o.lg.indexOf(w.lang + '3') >= 0 && o.lg.indexOf(w.l2 + '2') >= 0, k + ' 나라 이름 ' + o.natName + ' · 말 ' + o.lg);
    }

    // ---------------------------------------------------------------- ③ ④ 규칙
    console.log('③ ④ 규칙');
    const r = await page.evaluate(async () => {
      const out = {}, R = G.R, C = G.Scenes.city;
      const city = n => G.CITY_DATA.find(c => c && c.name === n);
      function fresh(nat, extra) {
        const N = G.NATIONS[nat], sk = {}, lg = G.LANGS.map(() => 0); G.SKILLS.forEach(x => { sk[x.id] = 0; }); lg[N.lang] = 3;
        const s = G.Game.state = G.State.newGame(Object.assign({ name: '시험', nation: nat, job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 55, int: 60, mar: 55, cha: 55 }, sk, lg, diff: 'normal', byNation: true }, extra || {}));
        return s;
      }
      const entry = n => { const b = C.entryCheck(city(n)); return b ? b.reason : 'ok'; };
      for (const k of G.NATION_ORDER) {
        const s = fresh(k), o = out[k] = {};
        o.realm = Object.keys(G.COURT.realms).filter(x => G.Court.isHome(G.COURT.realms[x])).join(',');
        o.ladder = o.realm ? G.Court.ladder(G.COURT.realms[o.realm]).map(x => x[0]).join('>') : '';
        o.top = o.realm ? G.Court.fullName(G.Court.title(G.COURT.realms[o.realm], 8)) : '';
        o.rel = String(G.Rel.mine());
        o.faith = R.heroFaith();
        o.alex = entry('알렉산드리아'); o.mecca = entry('메카');
        o.kids = G.Family.names('m')[0] + '·' + G.Family.names('f')[0];
        o.crown = R.myCrown(); o.owner = R.myOwnerName(1480) + '→' + R.myOwnerName(1750);
        o.co = ['포르투갈', '카스티야', '잉글랜드', '네덜란드'].filter(n => R.isMyCompany(n)).join(',');
      }
      // 네덜란드: 부르고뉴 시절의 저지대도, 에스파냐 땅이던 때(1556~1578)의 암스테르담도 제 나라
      let s = fresh('NL');
      out.nl1480 = R.isHomeNation(city('암스테르담')) + '|' + R.isHomeNation(city('앤트워프')) + '|' + R.isHomeNation(city('런던'));
      s.date = { y: 1560, m: 1, d: 1 }; out.nl1560 = R.cityOwner(city('암스테르담')) + ':' + R.isHomeNation(city('암스테르담')) + '|' + R.isHomeNation(city('세빌리아'));
      s.date = { y: 1600, m: 1, d: 1 }; out.nl1600 = R.cityOwner(city('암스테르담')) + ':' + R.isHomeNation(city('암스테르담'));
      // ④ 예전 호출(byNation 없음)
      s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 55, int: 60, mar: 55, cha: 55 }, sk: {}, lg: [], diff: 'normal' });
      out.oldPT = G.CITY_DATA[s.player.home].name + '|' + s.mates[0].id + '|' + s.fleet.ships[0].name;
      s = G.Game.state = G.State.newGame({ name: '시험', nation: 'KR', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 55, int: 60, mar: 55, cha: 55 }, sk: {}, lg: [], diff: 'normal' });
      out.oldKR = G.CITY_DATA[s.player.home].name + '|' + s.mates[0].id + '|' + s.fleet.ships[0].type;
      // ④ 이야기 모드의 주인공(잉글랜드 사람 제시카): 제 나라 사다리·외교·믿음의 새 규칙을 타지 않는다
      s = fresh('EN'); s.jhook = { act: 1, beats: {}, flags: {} };
      out.story = (R.myNation() === null) + '|' + G.Court.isHome(G.COURT.realms.EN) + '|' + G.Rel.mine() + '|' + R.nationName('EN') + '|' + R.isHomeNation(city('런던'));
      delete s.jhook;
      return out;
    });
    ok(r.ES.realm === 'ES' && r.PT.realm === 'PT' && r.PT.ladder.indexOf('피달구>') === 0, '포르투갈·에스파냐의 작위 사다리는 그대로: ' + r.PT.ladder);
    ok(r.EN.realm === 'EN' && r.OT.realm === 'OT' && r.KR.realm === 'KR' && r.NL.realm === '', '제 나라 궁정 — 잉글랜드 ' + r.EN.top + ' · 오스만 ' + r.OT.top + ' · 조선 ' + r.KR.top + ' (네덜란드는 없음)');
    ok([r.EN, r.OT, r.KR].every(o => o.ladder.split('>').length === 8), '사다리 여덟 칸: ' + r.EN.ladder + ' / ' + r.OT.ladder + ' / ' + r.KR.ladder);
    ok(r.ES.rel === 'ES' && r.PT.rel === 'PT' && r.EN.rel === 'EN' && r.NL.rel === 'NL' && r.OT.rel === 'OT' && r.KR.rel === 'null', '외교의 나라 열쇠: ES·PT·EN·NL·OT, 조선은 유럽 외교 밖');
    ok(r.OT.faith === 'I' && r.OT.alex === 'ok' && r.OT.mecca === 'ok', '오스만 제독은 이슬람 항구·성지에 그냥 들어간다');
    ok(r.PT.alex === 'islam' && r.PT.mecca === 'holy' && r.KR.alex === 'islam' && r.EN.mecca === 'holy', '다른 나라 제독은 예전처럼 막힌다: ' + r.PT.alex + '·' + r.PT.mecca);
    ok(r.PT.kids === '주앙·마리아' && r.ES.kids === '후안·마리아' && r.EN.kids === '존·메리' && r.KR.kids === '재현·서연', '아이 이름: ' + ['PT', 'EN', 'NL', 'OT', 'KR'].map(k => r[k].kids).join(' / '));
    ok(r.ES.owner === '카스티야→에스파냐' && r.EN.owner === '잉글랜드→영국' && r.KR.owner === '조선→조선' && r.OT.crown === '오스만 궁정' && r.PT.crown === '포르투갈 왕실', '점령지의 깃발·포상하는 조정: ' + r.ES.owner + ' · ' + r.EN.owner + ' · ' + r.KR.crown);
    ok(r.PT.co === '포르투갈' && r.ES.co === '카스티야' && r.EN.co === '잉글랜드' && r.NL.co === '네덜란드' && r.KR.co === '', '제 나라 회사: 잉글랜드 → ' + r.EN.co + ' · 네덜란드 → ' + r.NL.co);
    ok(r.nl1480 === 'true|true|false' && r.nl1560 === '에스파냐:true|false' && r.nl1600 === '네덜란드:true', '네덜란드의 제 나라 항구: 1480 ' + r.nl1480 + ' · 1560 ' + r.nl1560 + ' · 1600 ' + r.nl1600);
    ok(r.oldPT === '리스본|rocco|산 가브리엘' && r.oldKR === '세빌리아|rocco|caravel', '예전 호출(byNation 없음)은 그대로: ' + r.oldPT + ' · ' + r.oldKR);
    ok(r.story === 'true|false|PT|잉글랜드|true', '이야기 모드의 주인공은 새 규칙을 타지 않는다: ' + r.story);
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('nation_create_smoke: 모두 통과');
  } catch (e) { console.error('실패: ' + e.message); if (errors.length) console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  await browser.close();
})();
