/* QA 2026-10-10 작은 문제 6~19 고친 것 (보고서 번호)
   6 의심 물러나기 되풀이 · 7 옛 저장 증거 등급 · 8 웅변 없으면 설득 창 없음 · 9 후원자 말투 · 10 장소 빈 소문 · 11 잔치 한 번
   12 탁군 들판 대사 · 13 잔치 대사(내륙·외국) · 15 앙카라 · 17 삼총사 결투 피하기·술집에서 쫓겨나면 결투 없음 · 18 여관에서 숨진 뒤
   (14 자동항해 안내·16 이야기 모드 아이·19 발견물 겹침은 코드·disc_spacing_smoke로 본다)
   node tests/qa_fixes2_smoke.js  (BROWSER_EXE=크로미움 경로) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const timer = setInterval(async () => { try { console.log('   … 단계 ' + await page.evaluate(() => window.QSTEP)); } catch (e) {} }, 20000);
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, UI = G.UI, U = G.U, SP = G.Sponsor, D = G.Disc, out = {};
      const said = [], asked = [];
      UI.say = async (t) => { said.push(String(t)); }; UI.alert = async () => {}; UI.toast = () => {};
      Object.keys(G.Outcome.KINDS).forEach(k => { G.Outcome.KINDS[k].ms = 30; }); G.Outcome.enabled = false;
      const rng0 = U.rng;
      window.QSTEP = '6';
      // 6 의심: 물러난 뒤 같은 증거로 오면 다시 굴리지 않고 의심한다
      const sp = G.SPONSOR.pt_king, d6 = G.DISC[Object.keys(G.DISC).find(k => G.DISC[k].pw >= 2 && G.DISC[k].how === 'land')];
      UI.ask = async (t, ch) => { asked.push(t); return 'later'; };
      U.rng = () => 0.01; out.d1 = await SP.doubt(sp, d6, { key: 'sketch', name: '스케치', k: 0.95 });
      U.rng = () => 0.99; out.d2 = await SP.doubt(sp, d6, { key: 'sketch', name: '스케치', k: 0.95 });
      out.d3 = await SP.doubt(sp, d6, { key: 'plate', name: '정밀 도판', k: 1.05 });
      U.rng = rng0;
      window.QSTEP = '7';
      // 7 옛 저장: 등급 없이 찾은 발견물은 「해도」
      const d7 = G.DISC[Object.keys(G.DISC).find(k => G.DISC[k].cat === 'ruin' && G.DISC[k].how === 'land')];
      s.disc[d7.id] = { me: true, found: 14800601 }; s.mates = [];
      out.g7 = D.gradeOf(d7).key;
      window.QSTEP = '8';
      // 8 웅변이 없으면 설득 창이 없다 · 9 말투
      out.voice = {};
      ['noble', 'king', 'queen', 'merchant', 'scholar', 'priest', 'official'].forEach(v => {
        const fake = { id: 'x', title: '시험', type: 'noble', voice: v, holders: [[1400, 1700, '시험인']], city: 0, taste: ['geo'] };
        out.voice[v] = ['coldTaste', 'coldInsult', 'nextTime', 'persOk', 'persFail', 'likedReport', 'likedFund'].map(k => SP.line(fake, k)).every(t => t && !/[{}]|undefined/.test(t));
        if (v === 'queen') out.queen = SP.line(fake, 'persOk');
      });
      // 8 (웅변 0) 관심사 밖 제안 → 설득 창 없이 넘어간다
      { const sp8 = G.SPONSOR.pt_king, cand = G.DISCOVERIES.filter(x => !G.tasteHit(sp8.taste, x) && x.pw <= sp8.pw && x.how !== 'special' && !x.tale && G.Disc.available(x)).sort((a, b) => a.val - b.val), d8 = cand[0];
        s.player.fame = 9000; s.player.sk.speech = 0; s.contract = null; s.hints = {}; s.hints[d8.id] = { src: 'test' }; const rel8 = SP.rel(sp8.id); rel8.trust = 0; rel8.fail = 3; rel8.anger = 0;
        const asks8 = []; UI.ask = async (t, ch) => { asks8.push(String(t)); const v = ch.map(o => o.value); return v.includes('no') ? 'no' : v[v.length - 1]; };
        const ch0 = UI.choose; UI.choose = async (t, ch) => { const o = (ch || []).find(x => String(x.label).indexOf(d8.name) >= 0); return o ? o.value : null; };
        U.rng = () => 0.02; await SP.propose(sp8); U.rng = rng0; UI.choose = ch0;
        out.persuadeAsk = asks8.some(t => /관심사\(/.test(t)); }
      window.QSTEP = '10';
      // 10 장소 빈 소문
      const ready0 = G.Frontier.mateReady; G.Frontier.mateReady = (m, y) => m.id === 'liu_bei' || ready0(m, y);
      G.Frontier.tick(); delete s.front.mates.liu_bei;
      out.rumour = G.Frontier.tick().map(m => m.text).filter(t => /유비/.test(t));
      G.Frontier.mateReady = ready0;
      window.QSTEP = '11';
      // 11 잔치 한 번 · 13 잔치 대사
      const big = G.DISC.circum; s.fleet.fatigue = 60;
      out.f1 = await G.Fest.begin(0, big); const fat1 = s.fleet.fatigue;
      s.day += 30; out.f2 = await G.Fest.begin(7, big); out.fatTwice = fat1 !== s.fleet.fatigue;
      const paris = G.CITY_DATA.find(c => c && c.name === '파리'), venice = G.CITY_DATA.find(c => c && c.name === '베니스');
      const all = Object.values(G.FESTIVAL.lines).flat().concat(G.FESTIVAL.open);
      out.inland = G.Fest.fits(all, paris).some(t => /부두|항구|배를 보러/.test(t));
      out.foreign = G.Fest.fits(all, venice).some(t => /우리 고장/.test(t));
      out.home = G.Fest.fits(all, G.CITY_DATA[0]).some(t => /우리 고장/.test(t));
      window.QSTEP = '12';
      // 12 탁군 들판
      said.length = 0; UI.ask = async (t, ch) => ch[ch.length - 1].value; UI.confirm = async () => false;
      await G.Legend.onLand(115.97, 39.49);
      out.zhuo = said.join('\n');
      window.QSTEP = '15';
      // 15 앙카라
      out.c117 = G.CITY_DATA[117].name;
      window.QSTEP = '17';
      // 17 삼총사: 피하면 결투 없이 끝
      const duel0 = G.Games.duel; let dueled = 0; G.Games.duel = async () => { dueled++; return 'win'; };
      s.mates.push({ id: 'd_artagnan', role: 'first', joined: 0, loyal: 80 });
      UI.ask = async (t, ch) => (ch.some(o => o.value === 0) ? 0 : ch[0].value);
      await G.Legend._t.muskDuel(G.CITY_DATA[1]); out.duelAvoid = dueled;
      UI.ask = async (t, ch) => 1; UI.confirm = async () => false;
      await G.Legend._t.muskDuel(G.CITY_DATA[2]); out.duelWin = dueled; out.joinedWithoutAsk = s.mates.some(m => /athos|porthos|aramis/.test(m.id));
      G.Games.duel = duel0;
      window.QSTEP = '18';
      // 18 여관에서 숨진 뒤
      G.Life && (G.Life.tick = () => {});
      said.length = 0; s.player.gold = 9999; s.life = s.life || {}; s.life.end = true;
      UI.number = async () => 1; UI.fade = async (f) => { f(); }; G.Scenes.city.news = async () => {};
      await G.Scenes.city.B.inn.stay(G.CITY_DATA[0]);
      out.innSaid = said.some(t => /피로가 풀렸다/.test(t));
      return out;
    });
    clearInterval(timer);
    ok(r.d1.abort && r.d2.abort && !r.d3.abort, '6 의심을 물리고 같은 증거로 다시 오면 굴리지 않고 또 의심 · 더 나은 증거면 처음처럼 따짐');
    ok(r.g7 === 'chart', '7 등급이 생기기 전에 찾은 발견(옛 저장)은 「해도」 — ' + r.g7);
    ok(Object.values(r.voice).every(Boolean) && /요/.test(r.queen), '9 말투 7가지 모두 새 대사가 있다 (왕비: ' + r.queen + ')');
    ok(!r.persuadeAsk, '8 웅변 특기가 없으면 누를 수 없는 설득 창을 띄우지 않는다');
    ok(!r.rumour.length, '10 머무는 곳이 없는 전설 동료는 장소 빈 소문이 나지 않는다');
    ok(r.f1 === true && r.f2 === false && !r.fatTwice, '11 같은 발견(세계일주)으로 다른 도시에서 또 잔치 → 열리지 않고 보너스도 한 번');
    ok(!r.inland && !r.foreign && r.home, '13 내륙(파리)엔 부두·항구 이야기 없음 · 남의 나라(베니스)엔 「우리 고장 배」 없음 · 고향(리스본)엔 있음');
    ok(/제사 술/.test(r.zhuo) && !/시원하게 사는/.test(r.zhuo), '12 탁군 들판에서는 들판에 맞는 대사');
    ok(r.c117 === '앙카라', '15 도시 117 → ' + r.c117);
    ok(r.duelAvoid === 0 && r.duelWin === 1 && !r.joinedWithoutAsk, '17 삼총사 결투를 피할 수 있고, 이겨도 묻고 나서 맞는다');
    ok(!r.innSaid, '18 여관에서 숨진 뒤 「피로가 풀렸다」가 나오지 않는다');
    await page.waitForTimeout(300);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; }
  finally { await browser.close(); }
})();
