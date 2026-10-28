/* 2026-10-28 피드백
   ① 로코 알베르티: 술집 부하편성에서 해고할 수 없다는 말 — 지금 부관이 다른 사람이면 그 사람 얼굴·이름이 뜨던 것 → 로코 자신이 말한다
   ② 자택: 시집간 딸이 「가족」 이야기에 집에 있는 것처럼 나오고, 집을 비운 달마다 사이가 식는데 가까워질 방법이 없던 것
      → 시집간 딸은 집에 없고(가족 이야기·여관·가족 사건), 사이가 식지 않으며, 아내가 전하는 편지에 해마다 답장(사이 +6 · 선물 +12)
   ③ 「아직은 품에 두고 싶다」(k.wedNext)가 주석 안에 들어가 먹지 않던 것 */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Family && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, p = s.player, out = {}; s.settings.sound = 0; s.settings.music = 0;
      const said = []; G.UI.say = async (t, sp) => { said.push(((sp && sp.name) || '') + '|' + String(t).slice(0, 60)); };
      // ① 다른 사람을 부관으로, 로코는 대기
      const other = G.MATES.find(m => m.id !== 'rocco' && !m.eventOnly && !m.tale && m.g === 'm');
      const rocco = s.mates.find(m => m.id === 'rocco'); rocco.role = 'none';
      s.mates.push({ id: other.id, role: 'first', loyal: 80, joined: 14800101 });
      const ri = s.mates.indexOf(rocco); let step = 0;
      G.UI.choose = async () => (step++ === 0 ? ri : step === 2 ? 'fire' : null);
      await G.Scenes.city.B.tavern.organize();
      out.rocco = { said: said.filter(x => /버리시겠다/.test(x)), first: G.MATE[other.id].name, still: s.mates.some(m => m.id === 'rocco') };
      // ② 아내와 딸(20세 · 시집감)·아들(10세)
      p.wife = p.wife || { id: 'w_test', name: '마리아', look: 0 };
      const F = G.Family;
      const born = (age) => ({ y: s.date.y - age, m: 1, d: 1 });
      const dau = { name: '이네스', sex: 'f', born: born(20), st: { str: 40, int: 50, mar: 30, cha: 60 }, sk: {}, lg: {}, edu: {}, bond: 25, married: { kind: 'cha', y: s.date.y - 1, title: '리스본의 귀족 집안' } };
      const son = { name: '주앙', sex: 'm', born: born(10), st: { str: 40, int: 50, mar: 30, cha: 60 }, sk: {}, lg: {}, edu: {}, bond: 50 };
      p.kids = [dau, son];
      out.home = { kidsHome: G.HomeLife.kidsHome().map(k => k.name), famev: G.FamEv && G.FamEv.homeKids ? G.FamEv.homeKids().kids.map(k => k.name) : null };
      // 집을 비운 석 달: 아들만 식는다
      s.loc = { mode: 'sea', lon: -20, lat: 30 };
      for (let i = 0; i < 3; i++) F.newMonth();
      out.month = { dau: dau.bond, son: son.bond };
      // 가족 이야기: 딸은 아내가 편지로 전한다 — 답장
      s.loc = { mode: 'city', city: p.home, lon: G.CITY_DATA[p.home].lon, lat: G.CITY_DATA[p.home].lat };
      said.length = 0; const asks = [];
      G.UI.ask = async (t, o) => { asks.push(t.slice(0, 40)); if (o.some(x => x.value === 'letter')) return 'letter'; return null; };
      G.UI.confirm = async () => false;
      await F.talk();
      out.talk1 = { said: said.slice(), asks: asks.slice(), bond: dau.bond };
      said.length = 0; asks.length = 0;
      await F.talk();
      out.talk2 = { said: said.filter(x => /이네스/.test(x)), asks: asks.filter(x => /이네스/.test(x)), bond: dau.bond };
      // ③ 아직은 품에 두고 싶다
      const d2 = { name: '베아트리스', sex: 'f', born: born(19), st: { str: 40, int: 50, mar: 30, cha: 60 }, sk: {}, lg: {}, edu: {}, bond: 60, wedNext: s.day + 300 };
      p.kids.push(d2);
      out.wed = { before: !!G.KidWed.due(), after: (s.day += 301, !!G.KidWed.due()) };
      return out;
    });
    console.log(JSON.stringify(r, null, 2));
    assert(r.rocco.said.length === 1 && /^로코 알베르티\|/.test(r.rocco.said[0]), '로코 자신이 말한다: ' + r.rocco.said.join(' / ') + ' (부관: ' + r.rocco.first + ')');
    assert.strictEqual(r.rocco.still, true);
    assert.deepStrictEqual(r.home.kidsHome, ['주앙']); if (r.home.famev) assert.deepStrictEqual(r.home.famev, ['주앙']);
    assert.strictEqual(r.month.dau, 25, '시집간 딸은 사이가 식지 않는다'); assert(r.month.son < 50, '집에 있는 아이는 그대로 식는다');
    assert(r.talk1.said.some(x => /이네스한테서 짧은 편지|이네스가 편지/.test(x)), r.talk1.said.join(' / '));
    assert(!r.talk1.said.some(x => /^이네스/.test(x)), '시집간 딸이 집에서 말하지 않는다');
    assert(r.talk1.asks.some(x => /이네스에게 답장/.test(x)));
    assert.strictEqual(r.talk1.bond, 31, '답장 +6');
    assert(r.talk2.asks.length === 0 && r.talk2.said.some(x => /올해 보낸 답장도/.test(x)), '해마다 한 번');
    assert.deepStrictEqual(r.wed, { before: false, after: true }, '「아직은 품에 두고 싶다」 — 그 날이 지나야 다시');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
