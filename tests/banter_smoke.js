/* 동물·식물 발견 때 부하들의 세 마디 (js/systems/banter.js · js/data/banter.js)
   - 말투 12가지가 고루 나오고(남자 6·여자 6), 성별과 맞는지
   - 호랑이 = 공격, 연꽃 = 잎 위에 올라타기, 용 = 말 걸기(「우리는 ○○에서 온 모험가들이다」 → 「누가 좀 말려」)
   - 생물 발견물 전부 × 말투 12가지로 만들어 봐서 글자리({…})·undefined가 남지 않는지
   - 발견(G.Disc.find) 뒤에 실제로 띄우는지, 설정에서 끄면 안 띄우는지, 동료가 없으면 갑판장·견습 선원이 채우는지
   node tests/banter_smoke.js  (OUT=폴더 면 대화 장면 스크린샷) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const GAME = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
const OUT = process.env.OUT;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const BT = G.Banter, Bd = G.BANTER, s = G.Game.state, out = {};
      // 말투 분포
      const cnt = {}, bad = [];
      G.MATES.forEach(m => { const t = BT.toneOf(m.id); cnt[t] = (cnt[t] || 0) + 1; if ((m.g === 'f') !== (Bd.female.indexOf(t) >= 0)) bad.push(m.id + ':' + t); });
      out.cnt = cnt; out.genderBad = bad;
      // 말투마다 한 사람씩 골라 둔다
      const byTone = {}; G.MATES.forEach(m => { const t = BT.toneOf(m.id); if (!byTone[t]) byTone[t] = m.id; });
      out.tones = Object.keys(byTone).length;
      let seed = 1; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const setMates = ids => { s.mates = ids.map(id => ({ id, role: 'first', loyal: 80 })); };
      // 사용자 예
      setMates([byTone.rush, byTone.polite]);
      const tiger = BT.compose(G.DISC.tiger, rng), lotus = BT.compose(G.DISC.lotus, rng);
      out.tiger = tiger.map(l => l.p.name + ': ' + l.text); out.tigerIdea = tiger.idea;
      out.lotus = lotus.map(l => l.p.name + ': ' + l.text); out.lotusIdea = lotus.idea;
      // 용: 말 거는 판이 나올 때까지
      let dragon = null;
      setMates([byTone.shonen, byTone.grumpy]);
      for (let i = 0; i < 40 && !dragon; i++) { const x = BT.compose(G.DISC.dragon, rng); if (x[1].p === x[0].p) dragon = x; }
      out.dragon = dragon.map(l => l.p.name + ': ' + l.text);
      // 모든 생물 × 모든 말투 (세 사람씩 돌려 가며)
      const tones = Object.keys(byTone), creatures = G.DISCOVERIES.filter(d => d.cat === 'creature');
      const left = []; let n = 0; const seenTone = {};
      for (let i = 0; i < tones.length; i++) {
        setMates([byTone[tones[i]], byTone[tones[(i + 1) % tones.length]], byTone[tones[(i + 5) % tones.length]]]);
        creatures.forEach(d => { for (let k = 0; k < 3; k++) { const L = BT.compose(d, rng); n++; if (L.length !== 3) left.push(d.id + ' len ' + L.length); L.forEach(l => { seenTone[l.p.tone] = 1; if (/[{}]|undefined|null|NaN/.test(l.text)) left.push(d.id + ' ' + l.text); }); } });
      }
      out.composed = n; out.left = left.slice(0, 5); out.leftN = left.length; out.seenTone = Object.keys(seenTone).length; out.creatures = creatures.length;
      // 동료가 없으면 갑판장·견습 선원
      s.mates = [];
      out.fill = BT.compose(G.DISC.panda, rng).map(l => l.p.name);
      // 발견 뒤 실제로 띄우는지 (발견 장면·카드는 건너뛴다)
      setMates([byTone.cute, byTone.merch]);
      const said = []; const UI = G.UI;
      const o = { say: UI.say, alert: UI.alert, toast: UI.toast, rev: G.Scenes.discoveryReveal, card: G.Scenes.discoveryCard, offer: G.Names && G.Names.offer };
      UI.say = async (t, who) => { said.push((who && who.name) + ': ' + t); }; UI.alert = async () => {}; UI.toast = () => {};
      G.Scenes.discoveryReveal = async () => {}; G.Scenes.discoveryCard = async () => {}; if (G.Names) G.Names.offer = async () => {};
      await G.Disc.find(G.DISC.koala, 'land');
      out.afterFind = said.slice();
      said.length = 0; s.settings.banter = false;
      await G.Disc.find(G.DISC.kiwi, 'land');
      out.offSaid = said.length;
      s.settings.banter = true;
      UI.say = o.say; UI.alert = o.alert; UI.toast = o.toast; G.Scenes.discoveryReveal = o.rev; G.Scenes.discoveryCard = o.card; if (G.Names) G.Names.offer = o.offer;
      // 동료 화면에 말투
      G.Info.open('mates'); await new Promise(r => setTimeout(r, 600));
      out.tag = Array.from(document.querySelectorAll('.tag')).map(e => e.textContent).filter(t => t.indexOf('말투') === 0);
      document.querySelectorAll('.win .x, .win .close').forEach(b => b.click && b.click());
      out.byTone = byTone;
      return out;
    });
    console.log('    말투 분포', JSON.stringify(r.cnt));
    ok(r.tones === 12 && !r.genderBad.length, '말투 12가지가 모두 나오고 성별과 맞음');
    ok(r.tigerIdea === 'attack' && r.tiger.length === 3 && r.tiger[0].indexOf('호랑이') >= 0 && r.tiger[0].indexOf('공격해 ') >= 0, '호랑이 → 공격:\n      ' + r.tiger.join('\n      '));
    ok(r.lotusIdea === 'rideLeaf' && r.lotus[0].indexOf('잎 위에 올라타') >= 0, '연꽃 → 잎 위에 올라타기:\n      ' + r.lotus.join('\n      '));
    ok(r.dragon && /에서 온/.test(r.dragon[1]) && r.dragon[0].indexOf('말을 걸어') >= 0, '용 → 말 걸기·말리기:\n      ' + r.dragon.join('\n      '));
    ok(r.leftN === 0 && r.seenTone === 12, '생물 ' + r.creatures + '종 × 말투 12가지로 ' + r.composed + '판을 만들어 글자리·빈 값 0' + (r.leftN ? ' — ' + r.left.join(' | ') : ''));
    ok(r.fill.indexOf('갑판장') >= 0 && r.fill.indexOf('견습 선원') >= 0, '동료가 없으면 갑판장·견습 선원이 주고받음');
    ok(r.afterFind.length >= 3, '발견하면 세 마디를 띄움:\n      ' + r.afterFind.slice(-3).join('\n      '));
    ok(r.offSaid === 0, '설정 「발견 때 부하들의 수다」를 끄면 띄우지 않음');
    ok(r.tag.length >= 2, '동료 화면에 말투 표시 (' + r.tag.join(', ') + ')');
    if (OUT) {
      fs.mkdirSync(OUT, { recursive: true });
      await page.keyboard.press('Escape');
      for (let i = 0; i < 10; i++) { if (!(await page.evaluate(() => G.UI.busy()))) break; await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
      await page.evaluate(ids => { const s = G.Game.state; s.mates = [ids.rush, ids.tsun, ids.genius].map(id => ({ id, role: 'first', loyal: 80 })); }, r.byTone);
      for (let k = 0; k < 3; k++) {
        await page.evaluate(k => { const L = G.Banter.compose(G.DISC.tiger); window.__bt = L; G.UI.say(L[k].text, L[k].p.sp()); }, k);
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(OUT, 'banter_' + k + '.png') });
        await page.keyboard.press('Enter'); await page.waitForTimeout(400);
      }
    }
    ok(!errors.length, '페이지 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
