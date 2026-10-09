/* 리스본·세비야 후원자의 관심사가 겹치지 않는지 (js/data/people.js · js/data/interests.js)
   · 두 도시 후원자 10명의 관심사가 서로 하나도 겹치지 않는다
   · 관심사 목록(전설·미신·종교·예술)의 이름이 모두 실제 발견물이다 · 관심사마다 들어맞는 발견물이 넉넉하다
   · 궁전 인사말·계약 목록·도감에 관심사 이름이 나오고, 취향에 맞는 발견물은 계약 값이 오른다 · 콘솔 오류 0
   node tests/sponsor_taste_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.SPONSORS && G.DISCOVERIES && G.tasteHit && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const sp = G.SPONSORS.filter(s => (s.city === 0 || s.city === 7) && !s.tale);
      const tale = G.SPONSORS.filter(s => s.tale && s.city === 0), lis = [].concat(...G.SPONSORS.filter(s => s.city === 0 && !s.tale).map(s => s.taste));
      const taleClash = [].concat(...tale.map(s => s.taste.filter(t => lis.indexOf(t) >= 0)));
      const all = [].concat(...sp.map(s => s.taste));
      const missing = [].concat(...Object.keys(G.INTEREST_IDS).map(k => G.INTEREST_IDS[k].filter(id => !G.DISC[id]).map(id => k + ':' + id)));
      const counts = {};
      sp.forEach(s => { counts[s.id] = G.DISCOVERIES.filter(d => G.tasteHit(s.taste, d)).length; });
      const names = sp.map(s => s.title + '=' + s.taste.map(G.tasteName).join('·'));
      return { n: sp.length, taleClash, all, uniq: new Set(all).size, missing, counts, names };
    });
    console.log(r.names.join(' / '));
    ok(r.n === 10 && r.uniq === r.all.length, '리스본·세비야 후원자 ' + r.n + '명의 관심사 ' + r.all.length + '개가 하나도 겹치지 않는다');
    ok(!r.taleClash.length, '이야기 모드의 카사노바 남작도 리스본의 다른 후원자와 겹치지 않는다 ' + r.taleClash.join(','));
    ok(!r.missing.length, '전설·미신·종교·예술 목록의 이름이 모두 실제 발견물 ' + r.missing.join(','));
    ok(Object.values(r.counts).every(n => n >= 15), '관심사마다 들어맞는 발견물이 15곳 넘게 ' + JSON.stringify(r.counts));

    // 게임 안: 궁전 인사말·계약 목록의 취향·별표, 취향 보너스
    const g = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'ES', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const arch = G.SPONSOR.es_arch, kaaba = G.DISC.kaaba, troy = G.DISC.troy, med = G.SPONSOR.es_medinaceli;
      return { archLikes: G.tasteHit(arch.taste, kaaba), archNot: G.tasteHit(arch.taste, troy), mythAtl: G.tasteHit(med.taste, G.DISC.atlantis), mythKraken: G.tasteHit(med.taste, G.DISC.mermaid),
        name: G.tasteName('faith') + '·' + G.tasteName('myth') + '·' + G.tasteName('art') + '·' + G.tasteName('ruin') };
    });
    ok(g.archLikes && !g.archNot, '세비야 대주교는 카바 신전(종교)을 좋아하고 트로이(유적)는 취향이 아니다');
    ok(g.mythAtl && g.mythKraken, '메디나셀리 공작(전설·미신)은 아틀란티스와 인어를 좋아한다');
    ok(g.name === '종교·전설·미신·예술·유적', '관심사 이름: ' + g.name);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
