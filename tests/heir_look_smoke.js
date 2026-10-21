/* 뒤를 이은 자녀의 모습 (tests/heir_look_smoke.js) — node tests/heir_look_smoke.js
   아들·딸은 이름·생일로 정한 외형 변형(1~5)을 5·10·15·20·40살과 후계 시절까지 유지한다.
   옛 저장(look·heir 없음)도 초상에 붙은 그림 이름에서 알아낸다. */
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
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, I = G.Img, K = I.chain, F = G.Family, UI = G.UI;
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; UI.confirm = async () => true; UI.choose = async (t, o) => o[0].value; UI.ask = async (t, o) => o[0].value;
      UI.fade = async (fn) => {}; G.Game.go = () => {}; G.Game.refreshHud = () => {}; G.State.save = () => {};
      function fresh(look) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        const s = G.Game.state = G.State.newGame({ name: '아버지', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
        s.player.look = look; s.player.portrait = G.Art.withImg(G.Art.portraitSpec({ seed: 'player1PT', culture: 'med', g: 'm', age: 'young' }), ['portraits/player/' + look]);
        s.date = { y: 1500, m: 6, d: 1 };
        return s;
      }
      function kid(sex, age) { const s = G.Game.state; const k = { name: sex === 'f' ? '딸' : '아들', sex, born: { y: s.date.y - age, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70 }; s.player.kids.push(k); return k; }
      // 아이일 때: 저장된 외형 변형의 그림
      let s = fresh('sea_dog');
      out.kid = [5, 10, 15, 20].map(a => { s.player.kids = []; const k = kid('m', a); k.portraitVariant = 3; return G.HomeLife.chain(k, false)[0] + '|' + G.HomeLife.chain(k, true)[0]; }).join(' ');
      out.daughter = [5, 10, 15, 20].map(a => { s.player.kids = []; const k = kid('f', a); k.portraitVariant = 2; return G.HomeLife.chain(k, false)[0] + '|' + G.HomeLife.chain(k, true)[0]; }).join(' ');
      out.has = ['son', 'daughter'].flatMap(b => [5, 10, 15, 20, 40].flatMap(a => [1, 2, 3, 4, 5].flatMap(v => [b + '_age' + a + '_v' + v, b + '_age' + a + '_v' + v + '_half']))).map(x => I.has('portraits/family/' + x) ? 1 : 0).join('');
      out.looks = I.list('portraits/player/').map(x => x.split('/').pop()).filter(l => l !== 'admiral' && l !== 'ganghui').filter(l => !['5', '10', '15'].every(a => I.has('portraits/family/' + l + '/son_age' + a) && I.has('portraits/family/' + l + '/son_age' + a + '_half')));
      // 아들이 잇는다 (17살)
      s.player.kids = []; const son = kid('m', 17);
      son.portraitVariant = 4;
      await F.succeed(son); const p = s.player;
      out.succ = p.name + ':' + p.generation + ':' + p.look + ':' + JSON.stringify(p.heir);
      out.face17 = K.heroPortrait(p)[0] + '|' + K.heroHalf()[0] + '|' + G.Art.portraitKeys(p.portrait)[0];
      s.date = { y: p.born.y + 25, m: 6, d: 1 }; out.face25 = K.heroPortrait(p)[0] + '|' + K.heroHalf()[0];
      s.date = { y: p.born.y + 45, m: 6, d: 1 }; out.face45 = K.heroPortrait(p)[0] + '|' + K.heroHalf()[0];
      // 손자도 자기 외형 변형을 유지한다
      s.date = { y: p.born.y + 30, m: 6, d: 1 }; const g = kid('m', 6); g.portraitVariant = 2; out.grandson = G.HomeLife.chain(g, true)[0];
      // 옛 저장: look·heir 없이 초상에만 가족 그림 이름
      delete p.look; delete p.heir; p.kids = []; p.portrait.img = ['portraits/family/sea_dog/son_age15', 'portraits/family/son_age15', 'portraits/family/son_1', 'portraits/family/son'];
      s.date = { y: p.born.y + 18, m: 6, d: 1 };
      out.old = I.heroLook(p) + '|' + K.heroPortrait(p)[0] + '|' + K.heroHalf()[0];
      // 딸이 잇는다
      s = fresh('sea_dog'); s.player.kids = []; const dk = kid('f', 18); dk.portraitVariant = 5; await F.succeed(dk);
      const d = s.player; out.dau = d.look + ':' + d.heir.sex + ':' + K.heroPortrait(d).join(',') + '|' + K.heroHalf().join(',');
      s.date = { y: d.born.y + 45, m: 6, d: 1 }; out.dau45 = K.heroPortrait(d)[0];
      // 1대 제독은 그대로
      s = fresh('sea_dog'); s.date = { y: 1485, m: 6, d: 1 }; out.first = K.heroPortrait(s.player)[0] + '|' + K.heroHalf()[0] + '|' + I.heirKid(s.player);
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    const P = 'portraits/family/';
    ok(r.kid === [5, 10, 15, 20].map(a => P + 'son_age' + a + '_v3|' + P + 'son_age' + a + '_v3_half').join(' '), '아들: 같은 외형 변형으로 5·10·15·20살 얼굴·무릎상이 이어진다');
    ok(r.daughter === [5, 10, 15, 20].map(a => P + 'daughter_age' + a + '_v2|' + P + 'daughter_age' + a + '_v2_half').join(' '), '딸: 같은 외형 변형으로 5·10·15·20살 얼굴·무릎상이 이어진다');
    ok(r.has === '1'.repeat(100) && r.looks.length === 0, '자녀 2종 × 외형 5종 × 5·10·15·20·40살 × 얼굴·무릎상 100장이 모두 있다 ' + r.looks.join(','));
    ok(/^아들:2:sea_dog:\{"sex":"m","folder":"sea_dog","variant":4\}$/.test(r.succ), '아들이 이으면 아버지의 생김새와 자기 외형 변형을 잇는다 (' + r.succ + ')');
    ok(r.face17 === P + 'son_age15_v4|' + P + 'son_age15_v4_half|' + P + 'son_age15_v4', '17살 새 제독: 저장된 변형의 소년 얼굴·무릎상');
    ok(r.face25 === P + 'son_age20_v4|' + P + 'son_age20_v4_half', '스무 살부터: 저장된 변형의 성인 얼굴·무릎상 (' + r.face25 + ')');
    ok(r.face45 === P + 'son_age40_v4|' + P + 'son_age40_v4_half', '마흔부터: 저장된 변형의 40대 아들 얼굴·무릎상');
    ok(r.grandson === P + 'son_age5_v2_half', '손자도 자기 외형 변형을 쓴다');
    ok(r.old === 'sea_dog|' + P + 'sea_dog/son_age15|' + P + 'sea_dog/son_age15_half', '옛 저장: 초상의 그림 이름에서 알아낸다 (' + r.old + ')');
    ok(r.dau.indexOf('sea_dog:f:' + P + 'daughter_age15_v5') === 0 && r.dau.indexOf(P + 'daughter_age15_v5_half') >= 0 && r.dau45 === P + 'daughter_age40_v5', '딸이 이으면 저장된 변형의 15세·20세·40세 얼굴·무릎상');
    ok(r.first === 'portraits/player/sea_dog|characters/player_half_sea_dog|null', '1대 제독은 예전 그대로');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
