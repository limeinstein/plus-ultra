/* 웅변이 후원자 계약 조건 교섭의 성공률과 실제 조건을 함께 개선하는지 점검
   node tests/sponsor_speech_terms_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const s = G.Game.state, SP = G.Sponsor, sp = G.SPONSORS.find(x => SP.present(x)) || G.SPONSORS[0];
      s.mates.forEach(m => { m.role = 'none'; }); const rel = SP.rel(sp.id); rel.trust = 20;
      const offer = { advance: 1000, reward: 5000, years: 3 };
      const levels = [0, 1, 2, 3].map(lv => {
        s.player.sk.speech = lv;
        return { lv, chance: SP.negotiationChance(sp, 'money', 1, null), money: SP.improveTerms(offer, 'money', null, lv), time: SP.improveTerms(offer, 'time', null, lv) };
      });
      const purser = { acct: 2 };
      const both = [0, 3].map(lv => ({ lv, money: SP.improveTerms(offer, 'money', purser, lv), time: SP.improveTerms(offer, 'time', purser, lv) }));
      return { levels, both };
    });
    console.log(JSON.stringify(r));
    ok(r.levels.every((x, i, a) => !i || x.chance > a[i - 1].chance), '웅변 단계마다 조건 교섭 성공률 상승: ' + r.levels.map(x => Math.round(x.chance * 100) + '%').join(' → '));
    ok(r.levels.map(x => x.money.advance).join() === '1400,1400,1500,1500', '웅변이 높을수록 선금 증액 폭 증가(100닢 단위 반올림): ' + r.levels.map(x => x.money.advance).join(' → '));
    ok(r.levels[0].money.years === 2 && r.levels[1].money.years === 2 && r.levels[2].money.years === 3 && r.levels[3].money.years === 3, '웅변 2부터 선금 증액의 기한 단축 방지');
    ok(r.levels.map(x => x.time.advance).join() === '800,900,900,1000', '기간 연장 때 웅변 단계에 따라 선금 삭감 완화: ' + r.levels.map(x => x.time.advance).join(' → '));
    ok(r.levels[3].time.years === 5 && r.levels.slice(0, 3).every(x => x.time.years === 4), '웅변 3은 기간을 한 해 더 연장');
    ok(r.both[1].money.advance > r.both[0].money.advance && r.both[1].time.years > r.both[0].time.years, '경리 회계와 함께 교섭해도 웅변 혜택이 추가 적용');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
