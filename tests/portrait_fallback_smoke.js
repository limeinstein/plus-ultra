/* 코드로 그린 얼굴(다각형) 대신 사람 그림 (tests/portrait_fallback_smoke.js) — node tests/portrait_fallback_smoke.js   (BROWSER_EXE=크롬 경로)
   역할 사람(20고장 × 14역할 × 남녀)·항해사·후원자·원주민·도시 사람·문화권만 정한 얼굴 모두 그림이 고른다 (images/manifest.js 기준).
   성별이 맞고, 아이 얼굴은 빌리지 않는다. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const A = G.Art, miss = [], wrongSex = []; let tot = 0;
      const sexOf = k => { const m = /\/(m|f)\/\d+$/.exec(k); if (m) return m[1]; const r2 = /^portraits\/npc-roles\/([a-z]+)\/([a-z]+)$/.exec(k); return r2 ? A.rolePortraitGender(r2[2], r2[1]) : null; };
      const add = (sp, g) => {
        tot++; const k = G.Img.pick(A.portraitKeys(sp) || []);
        if (!k) miss.push(sp.seed); else if (g && sexOf(k) && sexOf(k) !== g) wrongSex.push(sp.seed + '→' + k);
      };
      A.NPC_STYLES.forEach(st => A.NPC_ROLES.concat(['pope', 'gov']).forEach(ro => ['m', 'f'].forEach(g => { const sp = A.npcSpec('x' + st + ro, ro, st, g); add(sp, sp.g); })));
      (G.MATES || []).forEach(m => add(A.mateSpec(m.id)));
      (G.SPONSORS || []).forEach(s => { try { add(A.sponsorSpec(s)); } catch (e) { /* 없는 후원자 */ } });
      ['herald', 'trader', 'innkeeper', 'guard', 'priest', 'librarian', 'shipwright', 'harbormaster'].forEach(id => G.CITY_DATA.forEach(c => { try { add(A.townSpec(id, c)); } catch (e) { /* 그 도시에 없는 사람 */ } }));
      ['m', 'f'].forEach(g => ['eu', 'med', 'arab', 'af', 'in', 'asia', 'am'].forEach(cu => add(A.portraitSpec({ seed: 'p' + cu + g, culture: cu, g }), g)));
      // 옛 저장: 문화권이 적혀 있지 않은 얼굴은 얼굴빛으로 어림한다
      const old = A.portraitSpec({ seed: 'oldjp', culture: 'asia', g: 'f' }); delete old.culture;
      const oldPick = G.Img.pick(A.portraitKeys(old));
      // 아이 얼굴은 어른 그림을 빌리지 않는다
      const kid = A.portraitSpec({ seed: 'kid_시험1500', culture: 'med', g: 'm', age: 'young' });
      const historical = ['h_jogwangjo', 'h_jeonggwangpil', 'h_kimanguk', 'h_hwangjini', 'h_sinsaimdang', 'h_josik', 'h_yihwang', 'h_imkkeokjeong']
        .map(id => [id, G.Img.pick(A.portraitKeys(A.mateSpec(id)) || [])]);
      return { tot, miss: miss.slice(0, 5), nMiss: miss.length, wrongSex: wrongSex.slice(0, 5), oldPick, kid: A.portraitKeys(kid), historical };
    });
    ok(r.nMiss === 0, '코드로 그린 얼굴 0 / ' + r.tot + '명 ' + r.miss.join(','));
    ok(r.wrongSex.length === 0, '빌린 얼굴의 성별이 맞다 ' + r.wrongSex.join(','));
    ok(/\/f\//.test(r.oldPick || ''), '옛 저장(문화권이 적혀 있지 않은 얼굴)도 성별이 맞는 그림을 빌린다 (고장은 얼굴빛으로 어림) — ' + r.oldPick);
    ok(r.kid === null, '아이 얼굴은 빌리지 않는다');
    ok(r.historical.every(x => x[1]) && new Set(r.historical.map(x => x[1])).size === r.historical.length, '조선 실존 인물은 가능한 한 서로 다른 전용·역할별 얼굴을 쓴다 — ' + r.historical.map(x => x.join('→')).join(', '));
    ok(r.historical.filter(x => ['h_jeonggwangpil', 'h_kimanguk', 'h_josik'].includes(x[0])).every(x => /^portraits\/pools\/sponsors\/kr\/m\//.test(x[1])), '조선의 재상·학자는 항해사 갑옷이 아닌 후원자형 복식을 쓴다');
    ok(r.historical.filter(x => ['h_jogwangjo', 'h_sinsaimdang', 'h_yihwang', 'h_imkkeokjeong'].includes(x[0])).every(x => /^portraits\/legendary\//.test(x[1])), '있는 전용 고해상도 초상을 우선 사용한다');
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; }
  finally { await browser.close(); }
})();
