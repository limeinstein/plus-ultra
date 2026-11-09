/* 플레이어 도감 — 본 것만 (2026-11-10 사용자 요청 · js/systems/codexmemo.js · js/catalog.js seenIt)
   node tests/codex_seen_smoke.js   (SHOT=파일.png 이면 도감을 찍는다)
   · 처음에는 일곱 갈래 모두 0 — 「아직 항해에서 본 … 없습니다」, 제작용 도감(도시·배 …)은 감춘다
   · 게임에서: 동료와 대화 · 사건 장면 · 물건을 손에 넣음 · 식당 · 발견 · 업적 · 날이 지남 → 도감에 그것만 보인다
   · ?view=assets 는 모두 보인다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function ok(v, msg) { if (!v) throw new Error(msg); passed++; console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  ctx.setDefaultNavigationTimeout(120000);
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  const url = (f, q) => (process.env.WEB_BASE ? new URL(f, process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, f)).href) + (q || '');
  async function catalog(q) {
    await page.goto(url('catalog.html', q || '?view=player#people'));
    await page.waitForFunction(() => document.querySelectorAll('#tabs .tab').length >= 7, null, { timeout: 120000 });
    await page.waitForTimeout(300);
    return page.evaluate(() => ({
      tabs: [...document.querySelectorAll('#tabs .tab')].map(b => b.dataset.tab + ':' + b.querySelector('.n').textContent),
      extraHidden: document.getElementById('extraCatalog').hidden, empty: !document.getElementById('empty').hidden ? document.getElementById('empty').textContent : '',
      count: document.getElementById('resultCount').textContent, summary: document.getElementById('summary').textContent
    }));
  }
  async function tabNames(id) {
    await page.click('#tab-' + id); await page.waitForTimeout(150);
    return page.evaluate(() => [...document.querySelectorAll('#grid .card .name')].map(e => e.textContent));
  }
  try {
    // 1) 처음
    await page.goto(url('catalog.html', '?view=player#people'));
    await page.evaluate(() => localStorage.removeItem('pu_codex_seen_v1'));
    const a = await catalog();
    console.log('   ' + a.summary);
    ok(a.tabs.every(t => /:0$/.test(t)) && a.extraHidden && /아직 항해에서 본 인물이 없습니다/.test(a.empty), '처음 도감: 일곱 갈래 모두 0, 제작용 도감은 감춤 — 「' + a.empty.slice(0, 40) + '」');
    // 2) 게임에서 겪는다
    await page.goto(url('index.html'));
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const g = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, out = { installed: !!G.CodexMemo.installed };
      const UI = G.UI; const box = document.createElement('div');
      // 대화창: 동료 로코 (게임의 말하는 길 그대로 — 화면은 띄우지 않고 기록만 확인)
      const mid = 'rocco', m0 = G.MATE[mid]; out.mate = m0.name;
      UI.say('시험 대사', { name: m0.name, portrait: G.Scenes.mateSpec(mid), half: G.Img.chain.mateHalf(mid) });   // 게임의 대화창 그대로 (기다리지 않는다)
      // 마을 사람 (조선소 목수 — 도시에서 말을 걸 때의 얼굴) · 후원자
      G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 2500));
      UI.say('시험', G.Scenes.city.npc('shipwright', '조선소 목수'));
      const spn = G.SPONSORS.find(x => x.city === 0) || G.SPONSORS[0]; out.sponsor = spn.title; UI.say('시험', G.Sponsor.speaker(spn));
      // 사건 장면
      const sc = { key: 'legend-events/af_kuba_court', name: '쿠바 왕국의 궁정' }; out.scene = sc.name; G.FamEv.showPic({ img: sc.key, title: sc.name }).stop && 0;
      // 물건을 손에 넣는다 (산 것과 같다)
      const w = G.ITEMS.find(it => it.kind === 'weapon' && it.reg && it.reg.length); out.weapon = w.name; G.R.addItem(w.id);
      const instrument = G.ITEMS.find(it => it.kind === 'instrument'); out.instrument = instrument.name; G.R.addItem(instrument.id);
      // 식당
      const f = G.CUISINES[0]; out.food = f.name; G.Growth.meal(f.tier, f.id);
      // 발견 · 업적 · 날짜
      const d = G.DISC.giza || G.DISCOVERIES[0]; out.disc = d.name; s.disc[d.id] = { found: true, me: true };
      const ach = G.ACHIEVEMENTS[0]; out.ach = ach.name; (s.achv = s.achv || {})[ach.id] = { d: 14800101 };
      const h = (G.HISTORY || []).filter(e => e.text).sort((x, y) => (x.y - y.y) || ((x.m || 1) - (y.m || 1)))[0]; out.hist = h.text.split('.')[0];
      s.date = { y: h.y, m: h.m || 1, d: (h.d || 1) };
      G.CodexMemo.sync(); G.CodexMemo.flush();
      out.mem = JSON.parse(localStorage.getItem('pu_codex_seen_v1'));
      return out;
    });
    ok(g.installed && g.mem.it && Object.keys(g.mem.f).length === 1, '게임에서 갈고리가 걸리고 기록이 쌓인다 (사람 ' + Object.keys(g.mem.n).length + ' · 그림 ' + Object.keys(g.mem.k).length + ' · 물건 ' + Object.keys(g.mem.it).length + ')');
    const b = await catalog();
    console.log('   ' + b.summary);
    const people = await tabNames('people'), ev = await tabNames('events'), ach = await tabNames('achievements'), disc = await tabNames('discoveries'), food = await tabNames('foods'), instruments = await tabNames('instruments'), weap = await tabNames('weapons');
    if (process.env.SHOT) { await page.click('#tab-events'); await page.waitForTimeout(1500); await page.screenshot({ path: process.env.SHOT }); }
    ok(people.includes(g.mate) && people.includes(g.sponsor) && people.some(n => /조선소 목수/.test(n)) && people.length <= 4, '인물: 대화한 사람만 — ' + people.length + '명 (' + people.join(', ') + ')');
    ok(ev.includes(g.scene) && ev.some(n => g.hist.indexOf(n) === 0 || n === g.hist), '이벤트: 본 장면 「' + g.scene + '」 + 지나간 세계 소식 — ' + ev.length + '개');
    ok(ach.length === 1 && ach[0] === g.ach, '업적: 이룬 「' + g.ach + '」 하나');
    ok(disc.length === 1 && disc[0] === g.disc, '발견물: 찾은 「' + g.disc + '」 하나');
    ok(food.length === 1 && food[0] === g.food, '음식: 먹은 「' + g.food + '」 하나');
    ok(instruments.length === 1 && instruments[0] === g.instrument, '악기: 손에 넣은 「' + g.instrument + '」 하나');
    ok(weap.includes(g.weapon) && weap.length <= 3, '무기: 손에 넣은 「' + g.weapon + '」 — ' + weap.join(', '));
    // 3) 제작용 전체 도감
    await page.goto(url('catalog.html', '?view=assets#people'));
    await page.waitForFunction(() => document.querySelectorAll('#tabs .tab').length >= 7, null, { timeout: 120000 });
    const c = await page.evaluate(() => ({ n: +document.querySelector('#tab-discoveries .n').textContent.replace(/,/g, ''), extra: !document.getElementById('extraCatalog').hidden }));
    ok(c.n > 1000 && c.extra, '?view=assets 는 모두 보인다 (발견물 ' + c.n + ')');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''));
    console.log('통과 ' + passed);
  } catch (e) { console.log('실패: ' + e.message); if (errors.length) console.log(errors.join('\n')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
