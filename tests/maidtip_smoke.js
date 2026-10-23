/* 여급의 귀띔 — 사례하고 상선대·군함대·해적·철새의 행방을 묻는다 (2026-10-22)
   node tests/maidtip_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.UI.fade = async fn => { fn && fn(); }; G.UI.toast = () => {};
      const s = G.Game.state, MT = G.MaidTip, out = {}; s.date = { y: 1530, m: 5, d: 1 }; s.player.gold = 50000;
      const m = G.MAIDS.find(x => x.city === 0) || G.MAIDS.find(x => G.CITY_DATA[x.city] && G.CITY_DATA[x.city].port); const c = G.CITY_DATA[m.city];
      out.maid = m.name + '@' + c.name;
      const st = s.maids[m.id] = { aff: 10, met: 1 };
      out.can10 = MT.canAsk(st);
      let said = []; const say = async (t) => { said.push(t); };
      await MT.ask(c, m, st, say); out.refuse = said.pop();
      // 값: 호감·만난 횟수
      st.aff = 20; st.met = 0; out.p20 = MT.price('merchant', c, st);
      st.aff = 60; st.met = 0; out.p60 = MT.price('merchant', c, st);
      st.aff = 60; st.met = 30; out.p60m = MT.price('merchant', c, st);
      st.aff = 95; st.met = 60; out.p95m = MT.price('merchant', c, st);
      out.prices = ['merchant', 'navy', 'pirate', 'wander'].map(k => MT.price(k, c, { aff: 20, met: 0 }));
      // 상선대를 묻는다 (UI 흐름)
      st.aff = 60; st.met = 10;
      G.UI.choose = async (t, o) => { out.menu = o.map(x => x.label + ' ' + x.right); return 'merchant'; };
      const g0 = s.player.gold; said = [];
      await MT.ask(c, m, st, say); out.mText = said.pop(); out.paid = g0 - s.player.gold;
      // 같은 날 다시 물으면 안 된다
      said = []; await MT.ask(c, m, st, say); out.sameDay = said.pop();
      // 해적·군함대 소식도 만든다
      out.tips = ['pirate', 'navy'].map(k => { const t = MT.make(k, c, m, st); return t ? MT.text(t) : null; });
      out.note = MT.html().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      // 철새
      s.day += 1; G.UI.choose = async () => 'wander'; said = [];
      await MT.ask(c, m, st, say); out.sameStay = said.pop(); said = [];   // 하루가 흘러도 같은 입항이면 막힌다 (QA 2026-10-23)
      s.portVisit = (s.portVisit || 0) + 1;
      out.wanders = MT.wanderers(c, st).map(w => w.m.name + '@' + w.c.name);
      await MT.ask(c, m, st, say); out.wText = said.pop();
      // 바다: 상선대 소식 자리로 가면 나타난다
      const tip = s.maidTips.find(t => t.kind === 'merchant');
      s.fleet.food = s.fleet.water = 9999;
      G.Game.go('sea', { depart: c.id });
      const SEA = G.Scenes.sea, rt = SEA.runtime();
      s.loc.lon = tip.lon + 3; s.loc.lat = tip.lat; rt.npcs = [];
      if (!G.Geo.isSea(s.loc.lon, s.loc.lat, 0.2)) { const p = G.Nav.nearestSea(tip.lon + 3, tip.lat, 8); s.loc.lon = p[0]; s.loc.lat = p[1]; }
      SEA.spawnNpcsForTest();
      const n = rt.npcs.find(x => x.tip === tip.id);
      out.spawn = n ? { kind: n.kind, label: n.label, n: n.n, ships: n.ships.length, d: +G.Geo.dist(s.loc.lon, s.loc.lat, n.lon, n.lat).toFixed(2) } : null;
      out.spawnedOnce = (() => { const before = rt.npcs.length; SEA.spawnNpcsForTest(); return rt.npcs.filter(x => x.tip === tip.id).length; })();
      // 기한이 지난 소식은 나오지 않는다
      const t2 = s.maidTips.find(t => t.kind === 'pirate'); t2.to = s.day - 1; s.loc.lon = t2.lon; s.loc.lat = t2.lat; rt.npcs = [];
      SEA.spawnNpcsForTest(); out.expired = rt.npcs.some(x => x.tip === t2.id);
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(!r.can10 && /친해지면/.test(r.refuse), '호감 10: 아무것도 묻지 못한다 (' + r.refuse + ')');
    ok(r.p20 > r.p60 && r.p60 > r.p60m && r.p60m > r.p95m, '사례금: 호감 20 ' + r.p20 + ' > 호감 60 ' + r.p60 + ' > 60·만남 30번 ' + r.p60m + ' > 95·만남 60번 ' + r.p95m);
    ok(r.menu && r.menu.length === 4, '물을 것 넷: ' + r.menu.join(' / '));
    ok(r.paid > 0 && /앞바다/.test(r.mText) && /일 안/.test(r.mText), '상선대: ' + r.mText.split('\n').pop() + ' (금화 ' + r.paid + ')');
    ok(/오늘은/.test(r.sameDay), '같은 여급에게는 하루 한 번');
    ok(/오늘은/.test(r.sameStay || ''), '다음 날이라도 같은 입항이면 다시 묻지 못한다');
    ok(r.tips.every(Boolean), '해적·군함대: ' + r.tips.join(' / '));
    ok(/여급의 귀띔/.test(r.note), '수첩 할 일: ' + r.note.slice(0, 120));
    ok(r.wText && (r.wanders.length ? r.wanders.every(w => r.wText.indexOf(w.split('@')[0]) >= 0) : /못 들었/.test(r.wText)), '철새: ' + (r.wanders.join(', ') || '(근처에 없음)'));
    ok(r.spawn && r.spawn.kind === 'merchant' && r.spawn.ships > 0, '그 앞바다에 가면 상선대가 나타난다: ' + JSON.stringify(r.spawn));
    ok(r.spawnedOnce === 1, '한 번만 나타난다');
    ok(!r.expired, '기한이 지나면 나타나지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
