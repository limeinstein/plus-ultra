/* 아내는 청혼을 받아들이면 제독의 말을 익힌다 (2026-11-10) — js/city/tavern.js T.maidSpeaker · js/core/rules.js R.spouseLang
   ① 낯선 말을 하는 여급(일본·중국 등)은 혼인 전에는 그 고장 말 → 혼인 뒤에는 어디서나 제독의 말로 (통역 없이 그대로 들림)
   ② 둘째 부인도 같다 ③ 헤어진 뒤에도 익힌 말은 남는다 ④ 부하 출신 아내: 제독의 모국어 3단계 (R.mateLang · 선실 CB.mateLang)
   node tests/wife_lang_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { if (!v) fail++; console.log((v ? '  ✓ ' : '  ✗ ') + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load|ERR_/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state, p = s.player, R = G.R, T = G.Scenes.city.B.tavern, TG = G.Tongues || G.TG;
      s.date = { y: 1550, m: 6, d: 1 }; s.mates = [];
      const native = R.nativeLang(p.nation);
      // 제독도 일행도 모르는 말을 하는 고장의 여급 둘
      const foreign = Object.values(G.MAID).filter(m => { const c = G.CITY_DATA[m.city]; return c && c.lang !== native && c.lang !== 0 && !m.royal && (p.lg[c.lang] || 0) === 0; });
      const m1 = foreign[0], m2 = foreign.find(m => G.CITY_DATA[m.city].lang !== G.CITY_DATA[m1.city].lang) || foreign[1];
      s.maids = s.maids || {}; s.maids[m1.id] = { aff: 100, met: 1 }; s.maids[m2.id] = { aff: 100, met: 1 };
      const sit = sp => (G.Tongues && G.Tongues.situation ? G.Tongues.situation(sp) : null);
      const before = T.maidSpeaker(m1), sitBefore = sit(before);
      p.wife = m1.id;                                  // tavern.js 청혼이 받아들여진 순간과 같은 상태
      const after = T.maidSpeaker(m1), wifeSp = G.Family.wifeSpeaker(), sitAfter = sit(after);
      const b2 = T.maidSpeaker(m2);
      p.wives2 = [{ id: m2.id, kind: 'maid', city: m2.city, house: m2.city, wed: 15500601 }];
      const a2 = T.maidSpeaker(m2), w2 = G.Wives.speaker(p.wives2[0]);
      // 헤어짐: 본처 자리를 비워도 익힌 말은 남는다
      p.wife = null; const gone = T.maidSpeaker(m1);
      // 부하 출신 아내
      const fem = G.MATES.find(d => d.g === 'f' && !d.minor && !(d.lg && d.lg[native] >= 3));
      const row = { id: fem.id, role: 'none', loyal: 80, sk: Object.assign({}, fem.sk) };
      s.mates = [row];
      const mBefore = R.mateLang(row, native), cbBefore = G.Cabins.mateLang(row, native);
      p.wife = fem.id;
      const mAfter = R.mateLang(row, native), cbAfter = G.Cabins.mateLang(row, native), other = R.mateLang(row, G.CITY_DATA[m1.city].lang);
      // 실제 대화창: 혼인 뒤 일본·중국 고장 말이 아니라 그대로 들린다
      p.wife = m1.id;
      G.UI.say('여보, 무사히 돌아오셨군요. 오늘은 바다가 잔잔했나요?', G.Family.wifeSpeaker());
      await new Promise(r => setTimeout(r, 600));
      const dlg = document.querySelector('.dlg'), html = dlg ? dlg.innerHTML : '';
      return { m1: m1.name + '(' + G.LANGS[G.CITY_DATA[m1.city].lang] + ')', m2: m2.name + '(' + G.LANGS[G.CITY_DATA[m2.city].lang] + ')',
        before, sitBefore, after, sitAfter, wifeSp: { lang: wifeSp.lang, li: wifeSp.li }, b2, a2, w2: { lang: w2.lang, li: w2.li }, gone, lgMe: s.maids[m1.id].lgMe,
        fem: fem.name, mBefore, cbBefore, mAfter, cbAfter, other, plainDlg: /잔잔했나요/.test(html) && !/class="lost"/.test(html) };
    });
    console.log('   여급 ' + r.m1 + ' · ' + r.m2 + ' · 부하 ' + r.fem);
    ok(r.before.li != null && r.before.lang < 3 && r.sitBefore && !r.sitBefore.plain, '혼인 전: 그 고장 말로 말한다 (말 번호 ' + r.before.li + ', 통하는 단계 ' + r.before.lang + ')');
    ok(r.after.li == null && r.after.lang === 3 && r.sitAfter && r.sitAfter.plain && r.wifeSp.lang === 3 && r.wifeSp.li == null, '청혼을 받아들인 뒤: 제독의 말로 그대로 들린다 (본처 · 집의 화자도)');
    ok(r.b2.li != null && r.a2.li == null && r.a2.lang === 3 && r.w2.lang === 3, '둘째 부인도 혼인하면 제독의 말로');
    ok(r.gone.lang === 3 && r.gone.li == null && r.lgMe > 0, '헤어진 뒤에도 익힌 말은 남는다 (s.maids[id].lgMe)');
    ok(r.mBefore < 3 && r.cbBefore < 3 && r.mAfter === 3 && r.cbAfter === 3, '부하 출신 아내: 제독의 모국어 ' + r.mBefore + ' → 3단계 (rules·선실 모두)');
    ok(r.other === 0 || r.other < 3, '다른 말은 그대로 (일본어 등 ' + r.other + ')');
    ok(r.plainDlg, '대화창에 통역·「…」 없이 그대로 나온다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.error('✗', e.message); } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n통과');
  process.exitCode = fail ? 1 : 0;
})();
