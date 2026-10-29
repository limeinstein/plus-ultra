/* 아이가 아버지의 성을 이어받고 승계 뒤에도 유지되는가 — node tests/family_surname_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FILE_NOT_FOUND|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.evaluate(() => { if (window.G && G.BALANCE && G.BALANCE.oldGuard) G.BALANCE.oldGuard.kinChance = 0; });   // 세대 교체 때 친족·소꿉친구 고르기 창을 띄우지 않는다 (tests/old_guard_smoke.js 가 따로 본다)
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Family, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      const UI = G.UI;
      UI.prompt = async (t, d) => d; UI.choose = async (t, rows) => rows[0].value;
      UI.ask = async (t, rows) => (rows.find(x => !x.dis) || rows[0]).value;
      UI.alert = async () => {}; UI.say = async () => {}; UI.confirm = async () => true; UI.toast = () => {};
      G.Game.go = () => {}; G.Game.refreshHud = () => {}; G.State.save = () => {};
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: async () => {} });
      const base = (o) => Object.assign({ nation: 'PT', job: 'explorer', age: 40, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' }, o);
      const kid = (name, age) => ({ name, sex: 'm', born: { y: 1500 - age, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, bond: 70 });
      const out = {};

      let s = G.Game.state = G.State.newGame(base({ name: '이강희', given: '강희', surname: '이' }));
      s.date = { y: 1500, m: 6, d: 1 };
      const ko = kid('', 18); ko.unnamed = true; s.player.kids = [ko];
      out.koCreated = { given: s.player.given, surname: s.player.surname, name: s.player.name };
      out.koKid = G.Family.setKidName(ko, '서준');
      G.Family.pickStorage = async () => [];
      await G.Family.succeed(ko, false);
      out.koHeir = { name: s.player.name, given: s.player.given, surname: s.player.surname };

      s = G.Game.state = G.State.newGame(base({ name: 'João Silva', given: 'João', surname: 'Silva' }));
      s.date = { y: 1500, m: 6, d: 1 };
      const west = kid('', 18); west.unnamed = true; s.player.kids = [west];
      out.westKid = G.Family.setKidName(west, 'Pedro');
      await G.Family.succeed(west, false);
      out.westHeir = { name: s.player.name, given: s.player.given, surname: s.player.surname };
      out.saved = G.State.deserialize(G.State.serialize()).player;

      // 옛 저장: given/surname가 없더라도 띄어 쓴 창립자 이름에서 성을 되살린다.
      s = G.Game.state = G.State.newGame(base({ name: 'Miguel Costa' }));
      delete s.player.given; delete s.player.surname;
      s.player.kids = [kid('Luis', 8)];
      G.Family.fixNames();
      out.old = { player: s.player.name, child: s.player.kids[0].name, surname: s.player.surname };
      return out;
    });
    ok(r.koCreated.name === '이강희' && r.koCreated.given === '강희' && r.koCreated.surname === '이', '새 게임에 한국식 이름·성을 따로 보존한다');
    ok(r.koKid === '이서준' && r.koHeir.name === '이서준' && r.koHeir.surname === '이', '한국식 아이 이름과 후계자가 아버지의 성을 잇는다');
    ok(r.westKid === 'Pedro Silva' && r.westHeir.name === 'Pedro Silva' && r.saved.name === 'Pedro Silva', '서양식 아이 이름·승계·저장에 성이 유지된다');
    ok(r.old.player === 'Miguel Costa' && r.old.child === 'Luis Costa' && r.old.surname === 'Costa', '옛 저장은 창립자 이름에서 성을 복원해 자녀에게 붙인다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
