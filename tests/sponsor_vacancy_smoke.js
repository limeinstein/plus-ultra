/* 자리가 빈 후원자와 맺은 계약 (2026-10-25 버그) — 브라간사 공작과 계약하고 보고하러 오포르토에 왔더니 저택이 없었다.
   페르난두 2세 공작은 1483년 처형되고 1497년 자이미 1세가 이을 때까지 자리가 비어 있다 (js/data/people.js holders).
   · 자리가 비어도 그 후원자와 계약 중이면 저택이 남고, 집사가 사연을 들려주고 보고를 받는다 (사례금 · 계약 끝)
   · 계약이 없으면 빈 자리의 저택은 보이지 않는다 · 자리가 비는 해에 소식이 온다 */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOT_DIR || '';

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Sponsor && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 70, int: 60, mar: 70, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, SP = G.Sponsor, C = G.Scenes.city, sp = G.SPONSOR.pt_braganza, porto = G.CITY_DATA[1];
      s.settings.sound = 0; s.settings.music = 0;
      const mansions = () => C.buildings(porto).filter(b => b.kind === 'mansion' && b.arg === 'pt_braganza').length;
      const out = {};
      // 1482: 공작이 있다
      s.date = { y: 1482, m: 3, d: 1 };
      out.y1482 = { present: SP.present(sp), mansion: mansions() };
      // 계약 (발견물 하나)
      const d = G.DISCOVERIES.find(x => x.how === 'land' && G.Disc.available(x));
      s.contract = { sponsor: sp.id, disc: d.id, advance: 1000, reward: 8000, valueK: G.Disc.valueK(d), due: 14900101, start: 14820301, circ: false };
      s.sponsors[sp.id] = s.sponsors[sp.id] || {};
      G.Succession.sync();
      // 1484: 공작이 처형되어 자리가 비었다 → 해가 바뀔 때 소식
      s.date = { y: 1484, m: 1, d: 1 };
      const news = G.Succession.year().map(m => m.text);
      out.y1484 = { present: SP.present(sp), caretaker: SP.caretaker(sp), mansion: mansions(), news };
      // 발견을 마치고 오포르토에
      s.disc[d.id] = Object.assign(s.disc[d.id] || {}, { found: true, me: true, date: 14840101 });
      s.loc = { mode: 'city', city: 1, lon: porto.lon, lat: porto.lat };
      out.todo = C.todo(porto).filter(t => t.kind === 'mansion').map(t => t.text);
      const B = C.B.mansion;
      out.sub = B.sub(porto, 'pt_braganza');
      out.menu = B.menu(porto, 'pt_braganza').map(m => m.label);
      const seen = [];
      G.UI.say = async (t, sp2) => { seen.push(((sp2 && sp2.name) || '') + '|' + String(t).slice(0, 70)); };
      G.UI.ask = async (t, o) => o[0].value; G.UI.alert = async (t) => { seen.push('ALERT ' + String(t).replace(/<[^>]+>/g, '').slice(0, 60)); };
      if (G.Pitch) G.Pitch.on = () => false;
      if (G.Disc.gradeOf) G.Disc.gradeOf = () => null;
      const g0 = s.player.gold;
      const entered = await B.enter(porto, 'pt_braganza');
      await G.Sponsor.report(sp);
      out.report = { entered, seen, gain: s.player.gold - g0, contract: s.contract, reported: s.disc[d.id].reported, log: s.log.slice(-1)[0].t };
      // 계약이 끝나면 빈 자리의 저택은 다시 보이지 않는다
      out.after = { mansion: mansions(), caretaker: SP.caretaker(sp) };
      // 1497: 자이미 1세가 잇는다
      s.date = { y: 1498, m: 1, d: 1 };
      out.y1498 = { present: SP.present(sp), holder: SP.holder(sp), mansion: mansions(), face: SP.face(sp).name };
      return out;
    });
    // ---------------- 다른 후원자들: 교황 선출 사이(왕궁) · 세상을 떠난 학자(제자) · 도시가 사라진 계약
    const o = await page.evaluate(async () => {
      const s = G.Game.state, SP = G.Sponsor, C = G.Scenes.city, out = {};
      const d = G.DISCOVERIES.find(x => x.how === 'land' && G.Disc.available(x));
      const mk = (id) => { s.contract = { sponsor: id, disc: d.id, advance: 1000, reward: 8000, valueK: 1, due: 17000101, start: 14800101, circ: false }; };
      const seen = []; G.UI.say = async (t, sp2) => { seen.push(((sp2 && sp2.name) || '') + '|' + String(t).slice(0, 90)); };
      // 교황: 1521년 레오 10세가 죽고 1522년 하드리아노 6세 — 사이에는 시종장
      const pope = G.SPONSOR.it_pope, rome = G.CITY_DATA[pope.city];
      s.date = { y: 1521, m: 6, d: 1 }; mk('it_pope');
      out.pope = { present: SP.present(pope), pal: C.buildings(rome).filter(b => b.kind === 'palace').length, sp: (C.B.palace.sp(rome) || {}).id, steward: SP.stewardName(pope), voice: SP.voiceKey(pope), note: SP.vacancyNote(pope), menu: C.B.palace.menu(rome).map(m => m.label) };
      seen.length = 0; out.pope.entered = await C.B.palace.enter(rome); out.pope.say = seen.slice();
      // 레오나르도: 1519년 세상을 떠남 — 제자가 맞는다
      const leo = G.SPONSOR.it_leonardo, mil = G.CITY_DATA[leo.city];
      s.date = { y: 1525, m: 1, d: 1 }; mk('it_leonardo');
      out.leo = { present: SP.present(leo), mansion: C.buildings(mil).filter(b => b.kind === 'mansion' && b.arg === 'it_leonardo').length, steward: SP.stewardName(leo), note: SP.vacancyNote(leo) };
      // 아라곤 국왕: 1516년이 마지막 — 시종장
      const ara = G.SPONSOR.es_aragon; s.date = { y: 1520, m: 1, d: 1 }; mk('es_aragon');
      out.ara = { steward: SP.stewardName(ara), note: SP.vacancyNote(ara), open: SP.open(ara) };
      // 아즈텍 황제: 테노치티틀란이 무너지면 계약은 없던 일
      s.date = { y: 1522, m: 1, d: 1 }; mk('az_king'); const g0 = s.player.gold;
      const news = G.Succession.year().map(m => m.text);
      out.az = { contract: s.contract, news: news.filter(t => /계약/.test(t)), gold: s.player.gold - g0 };
      // 뉴암스테르담(1664 뉴욕) — 빌린 배는 제독의 배가 된다
      s.date = { y: 1665, m: 1, d: 1 }; mk('nl_stuyvesant'); const sh = s.fleet.ships[0]; s.contract.loan = sh.uid; s.contract.loanName = sh.name; sh.loan = true;
      out.ny = { news: G.Succession.year().map(m => m.text).filter(t => /계약/.test(t)), contract: s.contract, loanFlag: !!sh.loan };
      // 도시가 있으면 건드리지 않는다
      s.date = { y: 1484, m: 1, d: 1 }; mk('pt_braganza'); out.keep = !!G.Sponsor.orphanContract() || !s.contract;
      s.contract = null;
      return out;
    });
    console.log(JSON.stringify(o, null, 2));
    assert.strictEqual(o.pope.present, false); assert(o.pope.pal >= 1); assert.strictEqual(o.pope.sp, 'it_pope', '교황 선출 사이에도 계약 중이면 왕궁에 들어간다');
    assert(/로마 교황의 시종장/.test(o.pope.steward)); assert.strictEqual(o.pope.voice, 'official');
    assert(/세상을 떠나셨습니다.*뒤를 이으실 분은 아직/.test(o.pope.note), o.pope.note);
    assert.deepStrictEqual(o.pope.menu, ['보고']); assert.strictEqual(o.pope.entered, true);
    assert(o.pope.say.some(x => /^로마 교황의 시종장\|.*이 궁에는.*교황청이 지킵니다/.test(x.replace(/\f/g, ' '))) || o.pope.say.some(x => /이 궁에는/.test(x)), o.pope.say.join(' / '));
    assert.strictEqual(o.leo.present, false); assert.strictEqual(o.leo.mansion, 1); assert(/의 제자$/.test(o.leo.steward), o.leo.steward);
    assert(/1519년에 세상을 떠나셨습니다.*이제 그 자리를 이으실 분은 없습니다/.test(o.leo.note), o.leo.note);
    assert(/아라곤 국왕의 시종장/.test(o.ara.steward) && o.ara.open);
    assert.strictEqual(o.az.contract, null, '테노치티틀란이 사라지면 계약은 없던 일'); assert(o.az.news.length === 1 && /테노치티틀란이 사라져/.test(o.az.news[0]), o.az.news.join(' / '));
    assert.strictEqual(o.az.gold, 0, '선금은 돌려주지 않는다');
    assert.strictEqual(o.ny.contract, null); assert.strictEqual(o.ny.loanFlag, false, '빌린 배는 제독의 배'); assert(/뉴암스테르담이 사라져.*제독의 배다/.test(o.ny.news[0]), o.ny.news.join(' / '));
    assert.strictEqual(o.keep, false, '도시가 있으면 계약은 그대로');
    assert.deepStrictEqual(r.y1482, { present: true, mansion: 1 });
    assert.strictEqual(r.y1484.present, false, '1483~1497 공작 자리가 비어 있다');
    assert.strictEqual(r.y1484.caretaker, true);
    assert.strictEqual(r.y1484.mansion, 1, '계약 중이면 저택이 남는다 (버그: 없었다)');
    assert(r.y1484.news.some(t => /브라간사 공작 자리가 비었다.*오포르토에서 브라간사 공작 가의 집사가 대신 받는다/.test(t)), r.y1484.news.join(' / '));
    assert(r.todo.length === 1, '도착하면 「보고」 할 일이 뜬다');
    assert(/자리가 비어 브라간사 공작 가의 집사가 맡고 있다/.test(r.sub), r.sub);
    assert.deepStrictEqual(r.menu, ['보고']);
    assert.strictEqual(r.report.entered, true);
    assert(r.report.seen.some(x => /^브라간사 공작 가의 집사\|/.test(x)), '집사가 맞는다');
    assert(r.report.seen.some(x => /에보라에서 처형/.test(x) || /주앙 2세/.test(x)), '사연을 들려준다: ' + r.report.seen.slice(0, 3).join(' / '));
    assert(r.report.gain > 0, '사례금을 받았다');
    assert.strictEqual(r.report.contract, null, '계약이 끝났다');
    assert.strictEqual(r.report.reported, 'pt_braganza');
    assert(/브라간사 공작에게/.test(r.report.log));
    assert.deepStrictEqual(r.after, { mansion: 0, caretaker: false }, '계약이 없으면 빈 자리의 저택은 보이지 않는다');
    assert.strictEqual(r.y1498.present, true); assert.strictEqual(r.y1498.mansion, 1); assert(/자이미/.test(r.y1498.face));
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify(r, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
