/* 녹음 효과음·배경 소리 (sounds/rpg/ · sounds/nature/ · js/data/sfxfiles.js): 파일이 모두 읽히고, 이름마다 녹음이 나며, 배경 소리가 깔렸다 사라지고, 장면에 이어져 있다
   node tests/sfx_samples_smoke.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Audio && G.SFX_FILES, null, { timeout: 90000 });
    const F = await page.evaluate(() => G.SFX_FILES);
    const files = [...new Set(Object.values(F.sets).flatMap(e => e.f).concat(Object.values(F.amb).map(e => e.f)))];
    const all = ['rpg', 'nature'].flatMap(d => fs.readdirSync(path.join(ROOT, F.dir, d)).filter(f => /\.ogg$/.test(f)).map(f => d + '/' + f.replace(/\.ogg$/, '')));
    const unused = all.filter(f => files.indexOf(f) < 0);
    ok(!unused.length, '녹음 ' + all.length + '개(rpg ' + all.filter(f => /^rpg/.test(f)).length + ' · nature ' + all.filter(f => /^nature/.test(f)).length + ')를 모두 어딘가에 쓴다' + (unused.length ? ' — 안 씀: ' + unused.join(', ') : ''));
    ok(fs.existsSync(path.join(ROOT, 'sounds/rpg/License.txt')) && fs.existsSync(path.join(ROOT, 'sounds/nature/License.txt')), '출처·허가 안내문이 함께 있다');
    ok(files.every(f => fs.existsSync(path.join(ROOT, F.dir + f + F.ext))), '녹음 파일 ' + files.length + '개가 모두 sounds/에 있다');
    // 파일마다 실제로 풀리는가 (길이를 읽는다)
    const durs = await page.evaluate(async (files) => {
      const out = {};
      await Promise.all(files.map(f => new Promise(res => { const a = new Audio(); a.preload = 'auto'; a.onloadedmetadata = () => { out[f] = a.duration; res(); }; a.onerror = () => { out[f] = -1; res(); }; a.src = G.SFX_FILES.dir + f + G.SFX_FILES.ext; setTimeout(res, 8000); })));
      return out;
    }, files);
    ok(files.every(f => durs[f] > 0.05), '모든 녹음이 풀린다 (가장 짧은 ' + Math.min(...files.map(f => durs[f])).toFixed(2) + '초)');
    // 이름마다 녹음이 나는가: play()를 엿본다
    const played = await page.evaluate(async () => {
      G.Audio.unlock(); await new Promise(r => setTimeout(r, 120));
      const log = []; const P = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { log.push({ src: decodeURIComponent(this.src.split('/').pop()), rate: this.playbackRate, vol: this.volume }); return P.call(this); };
      const out = {};
      for (const name of Object.keys(G.SFX_FILES.sets)) {
        const n0 = log.length; const r = G.Audio.sfx(name);
        await new Promise(r => setTimeout(r, 650));
        out[name] = { r, n: log.length - n0, files: log.slice(n0).map(x => x.src), rate: log.slice(n0).map(x => +x.rate.toFixed(2)), vol: log.slice(n0).map(x => +x.vol.toFixed(2)) };
      }
      const n1 = log.length; G.Audio.coinRain(45); await new Promise(r => setTimeout(r, 1500));
      out.coinRain = { n: log.length - n1, files: log.slice(n1).map(x => x.src) };
      HTMLMediaElement.prototype.play = P;
      return out;
    });
    for (const k of Object.keys(played)) console.log('    ' + k.padEnd(9) + ' ' + played[k].n + '번 ' + played[k].files.join(','));
    const sets = F.sets;
    ok(Object.keys(sets).every(k => played[k].n === (sets[k].seq || [0]).length && played[k].r === true), '이름 ' + Object.keys(sets).length + '개마다 녹음이 난다 (발걸음은 한 번에 여러 걸음)');
    ok(played.townstep.rate.every(r => r >= sets.townstep.rate[0] - 0.01 && r <= sets.townstep.rate[1] + 0.01) && new Set(played.run.files).size > 1, '발걸음은 빠르기·파일을 바꿔 가며 낸다');
    ok(played.coinRain.n === 3 && /handleCoins/.test(played.coinRain.files[0]) && /coin_prize/.test(played.coinRain.files[2]), '아주 큰 매출이면 돈주머니 소리 두 번에 금화 소리까지');
    // 배경 소리: 알려 주면 깔리고, 소식이 끊기면 사라진다
    const amb = await page.evaluate(async () => {
      const keys = Object.keys(G.SFX_FILES.amb), out = {};
      const t0 = Date.now(); while (Date.now() - t0 < 1500) { const lv = {}; keys.forEach(k => lv[k] = 1); G.Audio.amb(lv); await new Promise(r => setTimeout(r, 200)); }
      out.on = G.Audio.ambState();
      await new Promise(r => setTimeout(r, 7500));
      out.off = G.Audio.ambState();
      G.Audio.rain(0.8); await new Promise(r => setTimeout(r, 1500)); out.rain = G.Audio.ambState().rain; G.Audio.rain(0);
      return out;
    });
    const ak = Object.keys(F.amb);
    ok(ak.every(k => amb.on[k] && amb.on[k].playing && amb.on[k].cur > 0.5), '배경 소리 ' + ak.length + '가지가 깔린다 (' + ak.join('·') + ')');
    ok(ak.every(k => amb.off[k] && !amb.off[k].playing && amb.off[k].cur === 0), '장면이 알려 주지 않으면 서서히 사라진다');
    ok(amb.rain && amb.rain.playing && amb.rain.cur > 0.3, '비가 오면 녹음한 빗소리를 깐다');
    // 뭍의 짐승·새 소리 · 덮치는 들짐승
    const wild = await page.evaluate(async () => {
      const W = G.SFX_FILES.wild, ev = W.every.slice(); W.every = [0.05, 0.08]; G.Audio.wildReset();
      const log = []; const sm = G.Audio.sample; G.Audio.sample = function (n) { log.push(n); return sm.apply(this, arguments); };
      for (let i = 0; i < 60; i++) { G.Audio.wild('steppe', { beasts: ['hyena', 'lion'], mount: 'donkey' }); await new Promise(r => setTimeout(r, 40)); }
      const africa = [...new Set(log)]; log.length = 0;
      for (let i = 0; i < 40; i++) { G.Audio.wild('snow', {}); await new Promise(r => setTimeout(r, 40)); }
      const snow = [...new Set(log)]; log.length = 0;
      const sf = G.Audio.sfx, called = []; G.Audio.sfx = function (n) { called.push(n); return sf.apply(this, arguments); };
      ['lion', 'hyena', 'bear', 'tiger', 'boar', 'jaguar', undefined].forEach(a => G.Audio.beast(a));
      G.Audio.sfx = sf; G.Audio.sample = sm; W.every = ev;
      return { africa, snow, beast: called };
    });
    console.log('    ' + JSON.stringify(wild));
    ok(wild.africa.some(n => n === 'hyena' || n === 'lion') && wild.africa.indexOf('donkey') >= 0 && wild.snow.every(n => /wol|raven/i.test(n)), '뭍에서 가끔 땅에 맞는 짐승·새 소리 (사자·하이에나가 사는 초원 · 눈밭의 늑대 · 당나귀를 타면 당나귀)');
    ok(wild.beast.join() === 'roarLion,hyena,roarBig,roarBig,roarBeast,roarBeast,growl', '덮치는 들짐승마다 다른 울음 (모르는 짐승은 합성 으르렁)');
    // 효과음 크기 0이면 녹음도 소리가 나지 않는다
    const muted = await page.evaluate(async () => { G.Audio.pref.sound = 0; const log = []; const P = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { log.push(1); return P.call(this); }; G.Audio.sfx('coin'); await new Promise(r => setTimeout(r, 100)); HTMLMediaElement.prototype.play = P; G.Audio.pref.sound = 0.5; return log.length; });
    ok(muted === 0, '효과음 크기 0이면 녹음도 내지 않는다');
    // 녹음을 못 읽으면 합성음으로 (ogg를 못 트는 브라우저)
    const fb = await page.evaluate(() => { const F = G.SFX_FILES; G.SFX_FILES = null; const r = [G.Audio.sfx('draw'), G.Audio.sfx('card'), G.Audio.sfx('coin')]; G.SFX_FILES = F; return r; });
    ok(fb.every(Boolean), '녹음이 없으면 비슷한 합성음으로 (칼 뽑기 → 쇳소리, 카드 → 종이)');
    // 장면에 이어져 있다
    const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
    const hooks = [['js/games/duel.js', "sfx('draw')", '일기토 시작 칼 뽑기'], ['js/games/duel.js', "sfx('cut')", '일기토 베기'], ['js/games/duel.js', "sfx('parry')", '일기토 막기'],
      ['js/games/landwar.js', "sfx('draw')", '육상전 개시'], ['js/scenes/battle.js', "sfx('creak')", '백병전 뱃전 부딪침'], ['js/games/poker.js', "sfx('shuffle')", '포카 섞기'], ['js/games/poker.js', "sfx('card')", '포카 나누기'],
      ['js/games/poker.js', "sfx('reveal')", '포카 펼치기'], ['js/ui/info.js', "sfx('book')", '수첩 펴기'], ['js/ui/info.js', "'equip'", '장비'], ['js/systems/audio.js', "AU.sample('purse')", '매출'], ['js/systems/audio.js', "'landstep'", '뭍 걷기'],
      ['js/systems/audio.js', "AU.sample('creak')", '항해 삐걱임'], ['js/city/restaurant.js', "sfx('pot')", '식당'], ['js/systems/treasurehunt.js', "sfx('latch')", '보물 상자'], ['js/scenes/city.js', "sfx('doorClose')", '건물 나서기'], ['js/ui/info.js', "sfx('bookClose')", '수첩 덮기'],
      ['js/scenes/sea.js', 'G.Audio.amb({ sea_waves', '항해 물결·바람·폭풍'], ['js/scenes/battle.js', "sea_close", '해전 물결'], ['js/scenes/battle.js', "sfx('drums')", '해전 북소리'], ['js/scenes/battle.js', "sfx('boom')", '침몰 폭발'],
      ['js/scenes/town.js', 'harbor', '항구 물결'], ['js/scenes/land.js', 'meadow', '뭍의 새·밀림·밤'], ['js/scenes/land.js', 'G.Audio.wild(', '뭍의 짐승 소리'], ['js/scenes/land.js', 'G.Audio.beast(', '덮치는 짐승'],
      ['js/systems/explore.js', "sfx('seamonster')", '바다 괴물'], ['js/games/landwar.js', "sfx('drums')", '육상전 북소리'], ['js/games/poker.js', "sfx('bet')", '포카 판돈']];
    ok(hooks.every(h => src(h[0]).indexOf(h[1]) >= 0), '장면 연결: ' + hooks.map(h => h[2]).join(' · '));
    ok(/sounds/.test(src('tools/build_web.py')) && /sounds/.test(src('tools/build_desktop.py')), '웹·설치형 배포판에 sounds/를 담는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error(errors.slice(0, 5).join(' | ')); process.exitCode = 1; } finally { await browser.close(); }
})();
