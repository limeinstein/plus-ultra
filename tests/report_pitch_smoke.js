/* 보고·발표의 자리 (js/systems/pitch.js) 점검 — node tests/report_pitch_smoke.js   (BROWSER_EXE=크롬 경로)
   · 후원자에게 보고할 때 발견물 그림을 사람 없이 먼저 재생하고, 완전히 걷힌 뒤 대화를 시작한다
   · 지식이 있는 부하가 값어치를 띄운다: 넘어가면 사례금·명성이 오른다 / 부풀린 말이 들키면 깎인다
   · 쪽(학문·아름다움·돈·신앙·영광·부풀리기)은 부하의 지식과 후원자에 따라 다르다 — 성직자 앞 신학자 → 신앙, 상인 앞 회계 → 돈
   · 나이·성별의 궁합: 젊은 부하와 나이 든 후원자 → 확률이 오른다
   · 항구 발표도 그림을 띄우고 명성이 오른다. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'report_pitch');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.go('city', { cityId: 0 });
      await new Promise(r => setTimeout(r, 1200));
      const s = G.Game.state, SP = G.Sponsor, UI = G.UI, U = G.U, P = G.Pitch, out = {};
      s.date = { y: 1500, m: 3, d: 7 };
      const best = (sk, pred) => G.MATES.filter(m => (m.sk[sk] || 0) >= 2 && (!pred || pred(m))).sort((a, b) => (b.sk[sk] || 0) - (a.sk[sk] || 0))[0];
      const hist = best('hist') || best('survey'), theo = best('theo'), acct = best('acct');
      out.mates = [hist, theo, acct].map(m => m && m.name);
      const said = [], who = []; let replayActive = false, replayDuringSpeech = 0, replayCalls = 0;
      const realSay = UI.say;
      const realReplay = G.Scenes.discoveryReplay;
      G.Scenes.discoveryReplay = async () => { replayCalls++; replayActive = true; await Promise.resolve(); replayActive = false; return true; };
      UI.say = async (t, w) => { said.push(t); who.push(w && w.name); if (replayActive) replayDuringSpeech++; };
      UI.alert = async () => true; UI.ask = async () => null; UI.fade = async (fn) => { fn && fn(); };
      SP.shareWithMates = async () => {}; G.Disc.gradeOf = () => null; if (G.Names) G.Names.onReport = async () => {}; if (G.Fest) G.Fest.begin = async () => {};
      const d = G.DISC.carnac;
      const king = G.SPONSOR.pt_king;
      const setup = (mates) => {
        s.mates = mates.map((m, i) => ({ id: m.id, role: i ? 'surveyor' : 'first', loyal: 90 }));
        s.disc.carnac = { found: 14800520, me: true };
        s.contract = { sponsor: king.id, disc: 'carnac', reward: 10000, due: U.dateNum(U.addDays(s.date, 300)) };
        SP.rel(king.id).trust = 40;
      };
      // 1) 같은 판을 세 번: 자리 없이(기준) · 부하가 넘어가게 · 부하가 시큰둥하게
      setup([hist]);
      const snap = JSON.stringify(s);
      const run = async (pitchOn, chance) => {
        G.Game.state = JSON.parse(snap); const s2 = G.Game.state; s2.settings = s2.settings || {}; s2.settings.pitch = pitchOn;
        const uc = U.chance; U.chance = chance;
        const g0 = s2.player.gold, f0 = s2.player.fame;
        await SP.report(king);
        U.chance = uc;
        return { gold: s2.player.gold - g0, fame: s2.player.fame - f0 };
      };
      out.base = await run(false, () => false);
      said.length = 0; replayDuringSpeech = 0;
      out.win = await run(true, (p) => p < 0.999 ? true : true);
      out.winSaid = said.slice(0, 6); out.replays = replayCalls; out.replayDuringSpeech = replayDuringSpeech;
      out.lose = await run(true, () => false);
      // 2) 쪽: 성직자 앞 신학자 → 신앙, 상인 앞 회계 → 돈
      G.Game.state = JSON.parse(snap); const s3 = G.Game.state;
      const priest = G.SPONSORS.filter(x => x.type === 'priest' || x.type === 'pope')[0], merch = G.SPONSORS.filter(x => x.type === 'merchant')[0];
      if (theo) { s3.mates = [{ id: theo.id, role: 'first', loyal: 90 }]; out.theoAngle = (P.candidates(G.DISC.sepulchre || d, priest)[0] || {}).angle; }
      if (acct) { s3.mates = [{ id: acct.id, role: 'first', loyal: 90 }]; out.acctAngle = (P.candidates(G.DISCOVERIES.filter(x => x.cat === 'treasure')[0], merch)[0] || {}).angle; }
      // 3) 나이: 젊은 부하 + 나이 든 후원자 → 확률이 오른다
      const young = G.MATES.filter(m => P.mateAge(m.id) === 'young' && (m.sk.hist || m.sk.art || m.sk.survey))[0];
      const oldSp = G.SPONSORS.filter(x => G.Sponsor.present(x) && P.sponsorAge(x) === 'old')[0];
      if (young && oldSp) { const c = { id: young.id, angle: 'scholar', lv: 2 }; out.demo = P.demo(c, oldSp); }
      // 4) 부풀리기: 입담만 좋은 부하 + 신중한 학자 → 시큰둥하면 들킨다 → 깎인다
      const talker = G.MATES.filter(m => (m.st || [])[3] >= 64 && (m.st || [])[1] < 58)[0];
      const NOSK = {}; ['hist', 'sci', 'survey', 'art', 'music', 'acct', 'cook', 'craft', 'theo', 'nav', 'ops', 'sword', 'gun'].forEach(k => { NOSK[k] = 0; });   // 지식은 없고 입담만
      const sch = G.SPONSORS.filter(x => x.type === 'scholar' && G.Sponsor.present(x))[0];
      if (talker && sch) {
        G.Game.state = JSON.parse(snap); const s4 = G.Game.state;
        s4.mates = [{ id: talker.id, role: 'first', loyal: 90, sk: NOSK }];
        const c = P.candidates(d, sch)[0]; out.talker = talker.name; out.talkerAngle = c && c.angle; out.caughtP = c && P.caughtP(c, sch);
        s4.contract = { sponsor: sch.id, disc: 'carnac', reward: 10000, due: U.dateNum(U.addDays(s4.date, 300)) };
        const snap4 = JSON.stringify(s4);
        const one = async (on) => { G.Game.state = JSON.parse(snap4); const s5 = G.Game.state; s5.settings = s5.settings || {}; s5.settings.pitch = on; const uc = U.chance; U.chance = (p) => p > 0.5; const g0 = s5.player.gold; await SP.report(sch); U.chance = uc; return s5.player.gold - g0; };
        out.talkBase = await one(false); out.talkCaught = await one(true);
      }
      // 5) 항구 발표
      G.Game.state = JSON.parse(snap); const s6 = G.Game.state; s6.contract = null; s6.settings.pitch = true;
      const f0 = s6.player.fame, uch = UI.choose, uc = U.chance; UI.choose = async () => 'carnac'; U.chance = () => true; const beforeAnnounceReplays = replayCalls;
      await G.Scenes.city.B.harbor.announce(G.CITY_DATA[0]);
      out.annFame = s6.player.fame - f0; out.annReplay = replayCalls - beforeAnnounceReplays;
      G.Game.state = JSON.parse(snap); const s7 = G.Game.state; s7.contract = null; s7.settings.pitch = false; const f7 = s7.player.fame;
      await G.Scenes.city.B.harbor.announce(G.CITY_DATA[0]); out.annBase = s7.player.fame - f7;
      UI.choose = uch; U.chance = uc; UI.say = realSay; G.Scenes.discoveryReplay = realReplay;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.win.gold > r.base.gold && r.win.fame > r.base.fame, '부하가 넘어가게 했으면 사례금 ' + r.base.gold + ' → ' + r.win.gold + ', 명성 ' + r.base.fame + ' → ' + r.win.fame);
    ok(r.lose.gold === r.base.gold, '시큰둥하면 그대로 (' + r.lose.gold + ')');
    ok(r.replays === 1 && r.replayDuringSpeech === 0, '발견물 재생을 먼저 끝내고 대화를 시작한다 (재생 ' + r.replays + '회, 겹친 대화 ' + r.replayDuringSpeech + '회)');
    ok(r.winSaid.slice(1, 3).some(t => /「카르낙 거석군」/.test(t)), '제독이 「카르낙 거석군」을 내놓는다: ' + r.winSaid.join(' / ').slice(0, 300));
    if (r.theoAngle) ok(r.theoAngle === 'faith', '성직자 앞의 신학자 → 신앙 쪽');
    if (r.acctAngle) ok(r.acctAngle === 'profit', '상인 앞의 회계 → 돈 쪽');
    if (r.demo) ok(r.demo.k > 0 && r.demo.tag === 'youngToOld', '젊은 부하 + 나이 든 후원자 → 확률 +' + r.demo.k);
    if (r.talker) ok(r.talkerAngle === 'legend' && r.caughtP > 0.5 && r.talkCaught < r.talkBase, '입담만 좋은 ' + r.talker + ' → 부풀리기, 학자에게 들키면(' + Math.round(r.caughtP * 100) + '%) 사례금 ' + r.talkBase + ' → ' + r.talkCaught);
    ok(r.annReplay === 1 && r.annFame > r.annBase, '항구 발표: 발견물 재생 뒤 명성 ' + r.annBase + ' → ' + r.annFame);

    // 화면: 실제 대화창으로 한 장면
    await page.evaluate(() => {
      const s = G.Game.state, king = G.SPONSOR.pt_king;
      const hist = G.MATES.filter(m => (m.sk.hist || 0) >= 2)[0] || G.MATES.filter(m => (m.sk.survey || 0) >= 2)[0];
      s.mates = [{ id: hist.id, role: 'first', loyal: 90 }];
      s.settings.pitch = true;
      G.Pitch.run({ d: G.DISC.carnac, sp: king, mode: 'contract' }).then(p => p.close());
    });
    await page.waitForSelector('.reveal.replay', { timeout: 10000 });
    const replayScene = await page.evaluate(() => ({ replay: !!document.querySelector('.reveal.replay'), actors: !!document.querySelector('#ui > .dlg-actors') }));
    await page.screenshot({ path: path.join(OUT, '1_open.png') });
    ok(replayScene.replay && !replayScene.actors, '발견물 그림은 사람 없이 단독 재생된다');
    await page.mouse.click(800, 700); await page.waitForTimeout(500);
    if (await page.$('.reveal.replay')) { await page.mouse.click(800, 700); await page.waitForTimeout(900); }
    await page.waitForFunction(() => !document.querySelector('.reveal.replay') && !!G.UI.stageInfo, null, { timeout: 10000 });
    ok(await page.evaluate(() => !document.querySelector('.reveal.replay') && !!G.UI.stageInfo), '발견물 창이 사라진 뒤 대화 인물이 나온다');
    await page.screenshot({ path: path.join(OUT, '2_mate.png') });
    for (let i = 0; i < 7; i++) { await page.mouse.click(800, 800); await page.waitForTimeout(500); }
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과 — 화면: ' + OUT);
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
