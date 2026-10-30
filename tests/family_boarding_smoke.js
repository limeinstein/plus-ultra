/* 성인 자녀: 올해 항해 이야기를 나눈 뒤에도 승선·하선·재승선할 수 있다.
   node tests/family_boarding_smoke.js */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending,
      null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 40,
        birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, p = s.player, F = G.Family;
      s.settings.res = 0.35; s.settings.sound = 0; s.settings.music = 0;
      s.date = { y: 1520, m: 6, d: 1 };
      G.UI.say = async () => {};
      G.UI.toast = () => {};
      G.UI.confirm = async () => true;
      function check(value, message) { if (!value) throw new Error(message); }
      function kid(age, edu) {
        const k = { name: '주앙', sex: 'm', born: { y: s.date.y - age, m: 1, d: 1 },
          st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: {}, bond: 70 };
        if (edu !== undefined) k.edu = edu;
        p.kids = [k]; return k;
      }
      async function talk(choice) {
        const menus = [];
        G.UI.ask = async (text, opts) => {
          const values = opts.map(o => o.value); menus.push(values);
          if (choice !== null) check(values.includes(choice), '선택지 누락: ' + String(choice));
          return choice;
        };
        await F.talk();
        check(menus.length === 1, '자녀의 선택지가 한 번 표시된다');
        return menus[0];
      }
      // 19세: 이야기를 선택한 뒤 거절해도 같은 해에 다시 태울 수 있다.
      let k = kid(19, {});
      check((await talk('story')).includes('aboard'), '성인 승선 선택');
      check(k.bond === 75, '항해 이야기로 사이 +5');
      let menu = await talk(null);
      check(!menu.includes('story') && menu.includes('aboard'), '이야기는 연 1회, 승선은 계속 표시');
      await talk('aboard');
      check(k.aboard && k.bond === 78 && F.aboard().includes(k), '실제 함대 합류');
      await talk(0); check(!k.aboard, '집에 남게 하기');
      await talk('aboard'); check(k.aboard, '같은 해 재승선');
      // 이미 이야기를 마친 옛 저장·교육 기록 없는 옛 저장.
      k = kid(19, { '1520:story': 1 });
      await talk('aboard'); check(k.aboard, '기존 저장에서도 바로 승선');
      k = kid(19); await talk('aboard'); check(k.aboard, '교육 기록 없는 저장 호환');
      // 15세에 이야기를 들은 뒤 같은 해 16세가 되어도 승선 가능.
      k = kid(15, {}); k.born = { y: 1504, m: 6, d: 2 };
      await talk('story'); s.date.d = 2;
      check(F.kidAge(k) === 16, '성년 경계');
      await talk('aboard'); check(k.aboard, '성년이 된 해에도 승선');
      // 어린 자녀의 견습 취소·재시도도 그대로 유지.
      for (const age of [12, 15]) {
        k = kid(age, {}); G.UI.confirm = async () => false;
        await talk('aboard'); check(!k.aboard, age + '세 견습 취소');
        G.UI.confirm = async () => true;
        await talk('aboard'); check(k.aboard, age + '세 견습 재시도');
      }
      k = kid(19, { '1520:story': 1 }); s.date.y++;
      menu = await talk('story'); check(menu.includes('aboard') && k.bond === 75, '다음 해 이야기 다시 가능');
      return '19세 승선·거절·재승선, 기존 저장, 16세 경계, 12·15세 견습, 연 1회 이야기 확인';
    });
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(result);
    console.log('콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
