/* 가문의 가계도 (js/systems/familytree.js G.FamilyTree) — node tests/familytree_smoke.js   (BROWSER_EXE=크롬 경로)
   · 1대 제독이 물러나기 전에는 자택 메뉴에 「가계도」가 없다 · 물러나면 s.lineage 에 남고 메뉴가 생긴다
   · 세 대: 대마다 제독 ═ 본처 · 아이들 · 뒤를 이은 아이(금테) · 아이들의 앞날(시집감·항해사로 함께·제 길로·분가함·집에서 지냄)
   · 바다에서 생을 마치고 이은 대는 「바다에서 생을 마침」 · 저장·불러오기에 남는다 · 옛 저장은 항해 일지에서 이름을 찾는다 · 콘솔 오류 0
   · 2026-10-23 QA 2·3: 옛 저장은 불러올 때 한 번 선대를 s.lineage 에 남긴다(그 뒤 일지 줄이 지워져도 이름이 남는다) ·
     since 없는 2대가 물러나면 재임 시작 해는 일지의 세대 교체 해(1510), 그것도 없으면 동생들이 집에 든 해, 아무것도 없으면 「?」 (1480 아님) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.evaluate(() => { if (window.G && G.BALANCE && G.BALANCE.oldGuard) G.BALANCE.oldGuard.kinChance = 0; });   // 세대 교체 때 친족·소꿉친구 고르기 창을 띄우지 않는다 (tests/old_guard_smoke.js 가 따로 본다)
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.FamilyTree, null, { timeout: 120000 });
    let r = await page.evaluate(async () => {
      const UI = G.UI;
      UI.alert = async () => {}; UI.say = async () => {}; UI.toast = () => {}; UI.confirm = async () => true; UI.fade = async (fn) => { if (fn) fn(); };
      UI.ask = async (t, o) => (o.find(x => !x.dis) || o[0]).value; UI.choose = async (t, o) => o[0].value;
      G.Game.go = () => {}; G.Game.refreshHud = () => {}; G.State.save = () => {};
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: async () => {} });
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '알폰소', nation: 'PT', job: 'explorer', age: 48, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
      s.date = { y: 1500, m: 6, d: 1 };
      const maids = Object.keys(G.MAID), P = () => G.Game.state.player;
      const menu = () => G.Scenes.city.B.home.menu(G.CITY_DATA[P().home]).filter(Boolean).map(m => m.label + (m.sub ? ' [' + m.sub + ']' : ''));
      function kid(name, sex, age, st, ex) { const k = Object.assign({ name, sex, born: { y: s.date.y - age, m: 3, d: 5 }, sk: {}, lg: {}, st: Object.assign({ str: 55, int: 55, mar: 55, cha: 55 }, st || {}), edu: {}, bond: 60 }, ex || {}); P().kids.push(k); return k; }
      P().wife = maids[0];
      const before = { has: G.FamilyTree.has(), menu: menu().some(x => /^가계도/.test(x)) };
      const h = kid('주앙', 'm', 18); kid('마리아', 'f', 24, {}, { married: { kind: 'int', y: 1494, title: '학자의 아내' } }); kid('마누엘', 'm', 20, { str: 70 }); kid('이자벨', 'f', 21, { cha: 72 }); kid('레오노르', 'f', 8);
      await G.Family.retire();   // 은퇴 → 주앙
      const after1 = { has: G.FamilyTree.has(), menu: menu().filter(x => /^가계도/.test(x)) };
      await G.Siblings.hire(P().siblings.find(k => k.name === '마누엘'));
      s.date = { y: 1501, m: 4, d: 1 }; await G.Siblings.check();   // 이자벨 시집
      s.date = { y: 1522, m: 6, d: 1 }; P().wife = maids[3];
      const h2 = kid('페드루', 'm', 17); kid('카타리나', 'f', 14);
      await G.Family.retire(true);   // 바다에서 생을 마침 → 페드루
      kid('루이스', 'm', 2);
      return { before, after1, line: s.lineage.map(e => e.gen + ':' + e.name + ':' + e.end + ':' + (e.wife ? e.wife.name : '') + ':' + e.kids.length), gen: P().generation,
        saved: G.State.deserialize(G.State.serialize()).lineage.length };
    });
    ok(!r.before.has && !r.before.menu, '1대 제독이 물러나기 전에는 「가계도」가 없다');
    ok(r.after1.has && /가계도 \[2대째 가문\]/.test(r.after1.menu[0] || ''), '물러나면 자택 메뉴에 「가계도」 — ' + r.after1.menu[0]);
    ok(r.line.length === 2 && /^1:알폰소:retire:.+:5$/.test(r.line[0]) && /^2:주앙:death:.+:2$/.test(r.line[1]) && r.gen === 3, '대마다 기록 — ' + r.line.join(' / '));
    ok(r.saved === 2, '저장·불러오기에 기록이 남는다');

    r = await page.evaluate(async () => {
      G.UI.window = ((orig) => function (o) { const w = orig.call(this, o); window.__ftw = w; return w; })(G.UI.window);
      G.FamilyTree.open();
      await new Promise(r => setTimeout(r, 600));
      const el = document.querySelector('.ft-win');
      const couples = [...el.querySelectorAll('.ft-couple')].map(e => e.innerText.replace(/\s+/g, ' '));
      const kids = [...el.querySelectorAll('.ft-kid')].map(e => e.innerText.replace(/\s+/g, ' '));
      const heirs = el.querySelectorAll('.ft-kid.heir').length, faces = el.querySelectorAll('.ft-face canvas').length, nofaces = el.querySelectorAll('.ft-noface').length;
      window.__ftw.close(1);
      return { couples, kids, heirs, faces, nofaces };
    });
    ok(r.couples.length === 3 && /1대 제독 알폰소/.test(r.couples[0]) && /지금/.test(r.couples[2]) && /바다에서 생을 마침/.test(r.couples[1]) && /은퇴/.test(r.couples[0]), '세 대가 위에서 아래로 (1대 · 2대 바다에서 생을 마침 · 지금)');
    ok(r.heirs === 2 && r.kids.some(x => /주앙.*뒤를 이음 — 2대 제독/.test(x)) && r.kids.some(x => /페드루.*뒤를 이음 — 3대 제독/.test(x)), '뒤를 이은 아이는 금테 · 「뒤를 이음 — N대 제독」');
    const fate = n => (r.kids.find(x => x.indexOf(n) === 0) || '');
    ok(/학자의 아내/.test(fate('마리아')) && /항해사로 함께/.test(fate('마누엘')) && /시집감 — 귀족 가문의 안주인/.test(fate('이자벨')) && /분가함/.test(fate('레오노르')), '아이들의 앞날 — ' + ['마리아', '마누엘', '이자벨', '레오노르'].map(fate).join(' / '));
    ok(/집에서 지냄/.test(fate('카타리나')) && /집에서 자람/.test(fate('루이스')), '지금 대의 동생·아이 — ' + fate('카타리나') + ' / ' + fate('루이스'));
    ok(r.faces >= 10 && !r.nofaces, '얼굴 그림 ' + r.faces + '장 (빈 얼굴 ' + r.nofaces + ')');

    // 옛 저장: 2대째인데 기록이 없다 → 항해 일지에서 이름
    r = await page.evaluate(() => {
      const s = G.Game.state; delete s.lineage; delete s.flags.lineageV; s.player.generation = 2;   // 옛 저장 흉내 (기록·옮김 표시 없음)
      s.log.push({ d: 15000101, t: '베르나르두가 은퇴하고 ' + s.player.name + '이 뒤를 이었다.' });
      return { has: G.FamilyTree.has(), gens: G.FamilyTree.gens().map(g => g.e.gen + ':' + (g.e.name || '?') + (g.e.stub ? '(기록 없음)' : '')) };
    });
    ok(r.has && r.gens.length === 2 && /^1:베르나르두\(기록 없음\)/.test(r.gens[0]), '옛 저장은 항해 일지에서 선대 이름을 찾는다 — ' + r.gens.join(' / '));

    // QA 2·3: 옛 저장(2대, since·lineage 없음)을 불러오기 → 한 번 옮김 → 일지 줄이 지워져도 이름이 남고, 2대가 물러나면 1510~1530
    r = await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const mk = (name, extra) => {
        G.Game.state = G.State.newGame({ name: name, nation: 'PT', job: 'explorer', age: 40, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
        const o = JSON.parse(G.State.serialize());
        o.player.generation = 2; delete o.player.since; delete o.lineage; delete o.flags.lineageV; delete o.flags.journalV;
        o.date = { y: 1530, m: 6, d: 1 }; o.day = Math.round(50 * 365.25);
        o.log = o.log.map(e => ({ d: e.d, t: e.t }));   // 등급 없는 옛 줄
        extra(o);
        return JSON.stringify(o);
      };
      const out = {};
      // ① 일지에 「베르나르두가 은퇴하고 페드루가 뒤를 이었다」(1510)가 남아 있는 옛 저장
      let json = mk('페드루', o => { o.log.push({ d: 15100301, t: '베르나르두가 은퇴하고 페드루가 뒤를 이었다.' }); });
      let s = G.Game.state = G.State.deserialize(json);
      out.a = { line: (s.lineage || []).map(e => e.gen + ':' + e.name + ':' + e.from + '~' + e.to + (e.stub ? ':stub' : '')), since: s.player.since, flag: s.flags.lineageV,
        succG: (s.log.find(e => /은퇴하고/.test(e.t)) || {}).g };
      s.log = s.log.filter(e => !/은퇴하고/.test(e.t));    // 일지 줄이 지워져도
      out.a.after = G.FamilyTree.gens().map(g => g.e.gen + ':' + (g.e.name || '?'));
      out.a.saved = G.State.deserialize(G.State.serialize()).lineage.map(e => e.name).join(',');
      // 2대 페드루가 1530년에 물러남 → 「1510~1530년 제독」
      s.player.kids.push({ name: '안토니우', sex: 'm', born: { y: 1510, m: 3, d: 5 }, sk: {}, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, bond: 60 });
      await G.Family.retire();
      s = G.Game.state;
      const e2 = s.lineage.find(e => e.gen === 2) || {};
      out.a.e2 = e2.from + '~' + e2.to;
      G.UI.window = ((orig) => function (o) { const w = orig.call(this, o); window.__ftw = w; return w; })(G.UI.window);
      G.FamilyTree.open(); await new Promise(r => setTimeout(r, 300));
      out.a.ui = [...document.querySelectorAll('.ft-win .ft-couple')].map(e => e.innerText.replace(/\s+/g, ' '));
      window.__ftw.close(1);
      // ② 일지 줄은 없고 동생들(1512년에 집에 듦)만 있는 옛 저장 → 1512
      json = mk('조르즈', o => { o.player.siblings = [{ name: '이네스', sex: 'f', born: { y: 1495, m: 1, d: 1 }, sk: {}, lg: {}, st: {}, edu: {}, sib: { father: '루이', mother: '', gen: 2, y: 1512 } }]; });
      s = G.Game.state = G.State.deserialize(json);
      out.b = { since: s.player.since, line: s.lineage.map(e => e.gen + ':' + (e.name || '?') + ':' + e.from + '~' + e.to) };
      // ③ 아무 단서도 없는 옛 저장 → 모름 (「?~1530년 제독」, 1480 아님)
      json = mk('바스쿠', () => {});
      s = G.Game.state = G.State.deserialize(json);
      out.c = { since: s.player.since == null ? null : s.player.since };
      s.player.kids.push({ name: '루이스', sex: 'm', born: { y: 1508, m: 3, d: 5 }, sk: {}, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, bond: 60 });
      await G.Family.retire();
      s = G.Game.state;
      const e3 = s.lineage.find(e => e.gen === 2) || {};
      out.c.e2 = e3.from + '~' + e3.to;
      G.FamilyTree.open(); await new Promise(r => setTimeout(r, 300));
      out.c.ui = [...document.querySelectorAll('.ft-win .ft-couple')].map(e => e.innerText.replace(/\s+/g, ' '));
      window.__ftw.close(1);
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.a.flag === 1 && r.a.line.length === 1 && /^1:베르나르두:\d{4}~1510:stub$/.test(r.a.line[0]) && r.a.since === 1510, '옛 저장 불러오기: 선대를 한 번 s.lineage 에 남기고 지금 제독의 since 를 채운다 — ' + r.a.line.join(' / ') + ' · since ' + r.a.since);
    ok(r.a.succG === 'F', '세대 교체 줄은 가문(F) 등급 — 일상보다 오래 남는다');
    ok(/^1:베르나르두/.test(r.a.after[0]) && r.a.saved === '베르나르두', '그 뒤 일지 줄이 지워져도 선대 이름이 남는다 (저장에도) — ' + r.a.after.join(' / '));
    ok(r.a.e2 === '1510~1530' && r.a.ui.some(x => /2대 제독 페드루.*1510~1530년 제독/.test(x)), 'since 없는 2대가 물러나면 1510~1530년 제독 (게임 시작 해 아님) — ' + r.a.e2);
    ok(r.b.since === 1512 && /^1:\?:\d{4}~1512$/.test(r.b.line[0]), '일지 줄이 없으면 동생들이 집에 든 해로 since — ' + r.b.since + ' · ' + r.b.line.join(' / '));
    ok(r.c.since === null && r.c.e2 === 'null~1530' && r.c.ui.some(x => /2대 제독 바스쿠.*\?~1530년 제독/.test(x)) && !r.c.ui.some(x => /1480~1530/.test(x)), '단서가 없으면 「?~1530년 제독」 — ' + (r.c.ui.find(x => /2대/.test(x)) || ''));
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
