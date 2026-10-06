/* 뒤를 이은 자녀의 모습 (tests/heir_look_smoke.js) — node tests/heir_look_smoke.js
   아들이 제독이 되면 아버지의 생김새를 잇고, 스무 살 전에는 그 생김새 폴더의 소년 그림(son_age15 얼굴·전신상), 그 뒤에는 아버지의 젊은 얼굴, 마흔부터 40대 얼굴.
   딸이 이으면 딸의 그림. 옛 저장(look·heir 없음)도 초상에 붙은 그림 이름에서 알아낸다. 아이일 때의 그림(5·10·15살)도 생김새 폴더에서. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
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
      // 아이일 때: 생김새 폴더의 그림
      let s = fresh('sea_dog');
      out.kid = [5, 10, 15].map(a => { s.player.kids = []; const k = kid('m', a); return G.HomeLife.chain(k, false)[0] + '|' + G.HomeLife.chain(k, true)[0]; }).join(' ');
      out.has = ['sea_dog/son_age5', 'sea_dog/son_age10_half', 'sea_dog/son_age15', 'sea_dog/son_age15_half', 'blackcoat_captain/son_age15_half'].map(x => I.has('portraits/family/' + x) ? 1 : 0).join('');
      out.looks = I.list('portraits/player/').map(x => x.split('/').pop()).filter(l => l !== 'admiral' && l !== 'ganghui').filter(l => !['5', '10', '15'].every(a => I.has('portraits/family/' + l + '/son_age' + a) && I.has('portraits/family/' + l + '/son_age' + a + '_half')));
      // 아들이 잇는다 (17살)
      s.player.kids = []; const son = kid('m', 17);
      await F.succeed(son); const p = s.player;
      out.succ = p.name + ':' + p.generation + ':' + p.look + ':' + JSON.stringify(p.heir);
      out.face17 = K.heroPortrait(p)[0] + '|' + K.heroHalf()[0] + '|' + G.Art.portraitKeys(p.portrait)[0];
      s.date = { y: p.born.y + 25, m: 6, d: 1 }; out.face25 = K.heroPortrait(p)[0] + '|' + K.heroHalf()[0];
      s.date = { y: p.born.y + 45, m: 6, d: 1 }; out.face45 = K.heroPortrait(p)[0] + '|' + K.heroHalf()[0];
      // 손자의 그림도 같은 생김새 폴더
      s.date = { y: p.born.y + 30, m: 6, d: 1 }; const g = kid('m', 6); out.grandson = G.HomeLife.chain(g, true)[0];
      // 옛 저장: look·heir 없이 초상에만 가족 그림 이름
      delete p.look; delete p.heir; p.kids = []; p.portrait.img = ['portraits/family/sea_dog/son_age15', 'portraits/family/son_age15', 'portraits/family/son_1', 'portraits/family/son'];
      s.date = { y: p.born.y + 18, m: 6, d: 1 };
      out.old = I.heroLook(p) + '|' + K.heroPortrait(p)[0] + '|' + K.heroHalf()[0];
      // 딸이 잇는다
      s = fresh('sea_dog'); s.player.kids = []; const dk = kid('f', 18); await F.succeed(dk);
      const d = s.player; out.dau = d.look + ':' + d.heir.sex + ':' + K.heroPortrait(d).join(',') + '|' + K.heroHalf().join(',');
      s.date = { y: d.born.y + 45, m: 6, d: 1 }; out.dau45 = K.heroPortrait(d)[0];
      // 1대 제독은 그대로
      s = fresh('sea_dog'); s.date = { y: 1485, m: 6, d: 1 }; out.first = K.heroPortrait(s.player)[0] + '|' + K.heroHalf()[0] + '|' + I.heirKid(s.player);
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    const P = 'portraits/family/';
    ok(r.kid === [5, 10, 15].map(a => P + 'sea_dog/son_age' + a + '|' + P + 'sea_dog/son_age' + a + '_half').join(' '), '아이일 때: 제독의 생김새 폴더에서 나이에 맞는 얼굴·전신상');
    ok(r.has === '11111' && r.looks.length === 0, 'Codex의 아들 그림: 생김새 12종 × (5·10·15살 얼굴 + 전신상) 모두 있음 ' + r.looks.join(','));
    ok(/^아들:2:sea_dog:\{"sex":"m","folder":"sea_dog"\}$/.test(r.succ), '아들이 이으면 아버지의 생김새를 잇는다 (' + r.succ + ')');
    ok(r.face17 === P + 'sea_dog/son_age15|' + P + 'sea_dog/son_age15_half|' + P + 'sea_dog/son_age15', '17살 새 제독: 소년의 얼굴·전신상');
    ok(r.face25 === 'portraits/player/sea_dog|characters/player_half_sea_dog', '스무 살부터: 아버지의 젊은 모습 (' + r.face25 + ')');
    ok(r.face45 === 'portraits/player-aged/sea_dog|characters/player_half_sea_dog_old', '마흔부터: 40대 모습');
    ok(r.grandson === P + 'sea_dog/son_age5_half', '손자도 같은 생김새 폴더');
    ok(r.old === 'sea_dog|' + P + 'sea_dog/son_age15|' + P + 'sea_dog/son_age15_half', '옛 저장: 초상의 그림 이름에서 알아낸다 (' + r.old + ')');
    ok(/^sea_dog:f:portraits\/family\/([a-z_]+\/)?daughter_age15/.test(r.dau) && /daughter_age15_half/.test(r.dau) && /daughter_age15$/.test(r.dau45), '딸이 이으면 딸의 얼굴·전신상 (마흔이 넘어도)');
    ok(r.first === 'portraits/player/sea_dog|characters/player_half_sea_dog|null', '1대 제독은 예전 그대로');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
