/* 모자람이 풀림 → 마을 사람들의 입으로 (js/systems/economy.js E.sold·E.reliefLine·E.reliefMurmur · js/systems/streetfolk.js 말풍선)
   · 가뭄 든 카디스에 밀을 모자란 양만큼 팔면: 「풀림」 기록, 값 전 → 뒤, 알림 한 줄, 일지
   · 카디스 거리: 지나가는 사람 한둘이 말풍선으로 중얼거림, 말을 걸면 종류마다 다른 고마움·값 이야기 (장사꾼은 아직 모자란 이웃 도시)
   · 이웃 도시(세빌리아 아닌 리스본): 날이 지나면 「…라더라」 들은 이야기, 도시마다 두 번까지
   · 조금만 팔면 기록 없음, 절반쯤 팔면 「한풀 꺾임」 · 술집 소문(E.say)이 제독 이름을 댄다 · 옛 저장(relief 없음) · 말이 안 통하면 말풍선도 ×
   node tests/econ_relief_smoke.js   (스크린샷: OUT 또는 임시 폴더/econ_relief_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'econ_relief_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + String(e.stack).split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  async function goCity(id) {
    await page.evaluate(id => { const s = G.Game.state, c = G.CITY_DATA[id]; s.loc = { mode: 'city', city: id, lon: c.lon, lat: c.lat }; G.Game.go('city', { cityId: id }); }, id);
    await page.waitForFunction(id => G.Game.sceneName === 'city' && G.Town.active() && G.Town.city() && G.Town.city().id === id && !G.Town.hidden(), id, { timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
  }
  try {
    await page.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Econ && G.StreetFolk && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });

    // ① 카디스 가뭄에 밀을 모자란 양만큼 판다
    const a = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const B = G.BALANCE, E = G.Econ, R = G.R, C = id => G.CITY_DATA[id];
      B.econ.perDay = 0; B.econ.warPerDay = 0; B.econ.seed = 0; B.econ.npcFill = 0; if (B.disaster) B.disaster.random = 0;
      s.econ = { ev: [], seq: 0, seeded: 1 };     // 옛 저장처럼 relief 없음
      const cad = C(8), e = E.start('drought', 8, { lead: 0, dur: 200, k: 1 }); s.day += 30;
      const toasts = []; const t0 = G.UI.toast; G.UI.toast = (t) => { toasts.push(t); };
      const o = { need: E.needLeft(e, cad, 'wheat'), p0: Math.round(R.buyPrice(cad, 'wheat')), cities: e.cities.length };
      s.fleet.cargo.wheat = { q: 600, cost: 5, from: 7, d: s.day };
      // 조금만: 기록 없음
      const T = G.Scenes.city.B.trade;
      T.sellQty(cad, 'wheat', 20); o.afterSmall = (s.econ.relief || []).length;
      // 나머지 모자란 양
      const res = T.sellQty(cad, 'wheat', o.need);
      o.rel = res.relief; o.p1 = Math.round(R.buyPrice(cad, 'wheat')); o.left = E.needLeft(e, cad, 'wheat');
      o.log = s.log.slice(-3).map(x => x.t || x.text || String(x)).join(' / ');
      // 또 팔아도 다시 적지 않는다
      T.sellQty(cad, 'wheat', 30); o.n2 = s.econ.relief.length;
      o.toast = E.reliefToast(o.rel[0]);
      o.say = E.say(e, cad);
      G.UI.toast = t0;
      return o;
    });
    console.log('   ', JSON.stringify(a.rel[0]));
    ok(a.afterSmall === 0, '모자란 양 ' + a.need + '통 중 20통만 팔면 기록 없음');
    ok(a.rel.length === 1 && a.rel[0].kind === 'full' && a.rel[0].pb > a.rel[0].pa && a.n2 === 1, '모자란 양을 채우니 「풀림」 — 사는 값 ' + a.rel[0].pb + ' → ' + a.rel[0].pa + '닢 (지금 ' + a.p1 + '닢), 다시 팔아도 한 번만');
    ok(a.rel[0].others.length >= 1, '아직 모자란 이웃 도시: ' + a.rel[0].others.map(o => o.id).join(','));
    ok(/카디스/.test(a.toast) && /제자리/.test(a.toast), '알림: ' + a.toast);
    ok(/시험 선장/.test(a.say), '술집 소문이 제독을 댄다: ' + a.say);

    // ② 카디스 거리: 말풍선 · 말 걸기
    await goCity(8);
    const b = await page.evaluate(() => {
      const st = G.Town.runtime(), L = G.Town.folks();
      const m = L.filter(f => f.murmur);
      L.forEach((f, i) => { f.x = st.cam + 260 + i * 320; f.target = f.x; f.state = 'idle'; f.timer = 99; });
      for (let i = 0; i < 70; i++) G.Town.update(1 / 30);       // 첫 말풍선이 뜨기까지
      return { n: L.length, murm: m.length, texts: m.map(f => f.murmur && f.murmur.text), on: m.filter(f => f.murmur && f.murmur.on).length };
    });
    await page.screenshot({ path: path.join(OUT, 'cadiz_murmur.png') });
    ok(b.murm >= 1 && b.murm <= 2 && b.texts.every(t => t && t.length > 3), '카디스 거리 ' + b.n + '명 중 ' + b.murm + '명이 중얼거림: ' + b.texts.join(' | '));
    ok(b.on >= 1, '말풍선이 뜬다 (스크린샷 cadiz_murmur.png)');
    const talk = await page.evaluate(async () => {
      const c = G.CITY_DATA[8], SF = G.StreetFolk, said = {};
      const say0 = G.UI.say; let cur = []; G.UI.say = async (t) => { cur.push(t); };
      const RB = G.BALANCE.econ.relief, sure0 = RB.localSure, tell0 = RB.localTell; RB.localSure = 99; RB.localTell = 99;   // 종류마다 한 번씩 들어 보려고
      for (const t of ['woman', 'merchant', 'boy', 'man', 'elder', 'grandma']) {
        cur = []; const f = SF.make(t, c, 6000, 1000, 768, 'rel' + t); await SF.talk(f, c); said[t] = cur[0];
      }
      // 한 사람에게 한 번
      const f2 = SF.make('woman', c, 6000, 1000, 768, 'again'); cur = []; await SF.talk(f2, c); const first = cur[0]; cur = []; await SF.talk(f2, c); said.again = [first, cur[0]];
      RB.localSure = sure0; RB.localTell = tell0;
      // 고장 이야기(streetculture)의 시장 사건 줄: 이 도시는 걱정 대신 풀린 이야기
      said.culture = G.StreetCulture && G.StreetCulture.context ? G.StreetCulture.context(SF.make('woman', c, 6000, 1000, 768, 'cul'), c).filter(x => /economy:/.test(x.id || x.key || '')).map(x => x.text || x.body || JSON.stringify(x)) : [];
      G.UI.say = say0;
      return said;
    });
    Object.keys(talk).forEach(k => console.log('    ' + k + ': ' + (Array.isArray(talk[k]) ? talk[k].join(' ⟶ ') : talk[k])));
    ok(/닢에서 [0-9,]+닢으로/.test(talk.woman) && /고마/.test(talk.woman), '마을 여자: 값 전·뒤와 고마움');
    ok(/모자라/.test(talk.merchant) && /가 보시오|모자란 곳/.test(talk.merchant), '장사꾼: 여기는 끝났고 아직 모자란 곳으로');
    ok(/아저씨/.test(talk.boy) && /통이 내려지는/.test(talk.man), '소년·마을 남자도 저마다의 말로');
    ok(talk.again[0] !== talk.again[1] && !/닢에서/.test(talk.again[1] || ''), '같은 사람은 두 번 하지 않는다');
    ok(talk.culture.length && talk.culture.every(t => /제자리를 찾았/.test(t)), '고장 이야기(streetculture)도 걱정 대신 풀린 이야기: ' + talk.culture[0]);

    // ③ 이웃 도시: 날이 지나면 들은 이야기
    const c = await page.evaluate(async () => {
      const s = G.Game.state, E = G.Econ, SF = G.StreetFolk, lis = G.CITY_DATA[0];
      const o = { early: !!E.reliefNear(lis) };
      s.day += 25;
      const n = E.reliefNear(lis); o.n = n && { local: n.local };
      const say0 = G.UI.say; let cur = []; G.UI.say = async (t) => { cur.push(t); };
      const out = [];
      for (let i = 0; i < 8; i++) { cur = []; const f = SF.make(i % 2 ? 'merchant' : 'man', lis, 6000, 1000, 768, 'hear' + i); await SF.talk(f, lis); if (/카디스에 밀이 모자라|카디스 쪽은 이제 늦었소/.test(cur[0] || '')) out.push(cur[0]); }
      G.UI.say = say0;
      o.heard = out; o.after = !!E.reliefNear(lis);
      s.day += 100; o.old = !!E.reliefNear(lis);
      return o;
    });
    ok(!c.early, '리스본에는 소문이 닿는 데 날이 걸린다');
    ok(c.n && c.n.local === false && c.heard.length === 2 && !c.after, '25일 뒤 리스본: 「…라더라」 두 번까지 — ' + c.heard[0]);
    ok(!c.old, '오래되면 잊힌다');

    // ④ 절반쯤 팔면 「한풀 꺾임」 · 말이 안 통하는 도시의 말풍선
    const d = await page.evaluate(() => {
      const s = G.Game.state, E = G.Econ, R = G.R, T = G.Scenes.city.B.trade;
      const sev = G.CITY_DATA[7], ev = E.start('fire', 7, { lead: 0, dur: 120, k: 1 }); s.day += 20;
      const g = E.goodsOf(ev).filter(x => x.d > 1)[0].g, need = E.needLeft(ev, sev, g);
      s.fleet.cargo[g] = { q: 2000, cost: 5, from: 0, d: s.day };
      const t0 = G.UI.toast; G.UI.toast = () => {};
      const r = T.sellQty(sev, g, Math.round(need * 0.5)).relief; G.UI.toast = t0;
      const part = r[0], near = E.reliefNear(sev), mur = near && E.reliefMurmur(near, sev);
      // 말이 안 통하면
      const lg0 = s.player.lg; s.player.lg = G.LANGS.map(() => 0); s.mates.forEach(m => { m.role = 'none'; });
      const L = SF_spawn(sev); s.player.lg = lg0;
      function SF_spawn(c) { return G.StreetFolk.spawn(c, 6000, 1000, 768, 'deaf'); }
      return { g, need, part: part && part.kind, toast: part && E.reliefToast(part), mur, deaf: L.filter(f => f.murmur).map(f => f.murmur.text) };
    });
    ok(d.part === 'part' && /한풀 꺾였다/.test(d.toast), '대화재 세빌리아 ' + d.g + ' 절반: 「한풀 꺾임」 — ' + d.toast);
    ok(d.deaf.length && d.deaf.every(t => /×/.test(t)), '말이 안 통하면 말풍선도 알아듣는 만큼만: ' + d.deaf.join(' | '));

    // ⑤ 저장·불러오기 (relief가 저장에 들어가고, 옛 저장도 그대로)
    const e = await page.evaluate(() => {
      const s = G.Game.state, j = JSON.parse(JSON.stringify(s));
      const old = JSON.parse(JSON.stringify(s)); delete old.econ.relief; G.Game.state = old;
      const n0 = G.Econ.reliefNear(G.CITY_DATA[8]);
      G.Game.state = s;
      return { saved: (j.econ.relief || []).length, oldOk: n0 === null };
    });
    ok(e.saved >= 2 && e.oldOk, '저장에 ' + e.saved + '가지 · 옛 저장(relief 없음)도 오류 없음');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (err) {
    console.error('실패:', err.message); console.error(errors.join('\n')); process.exitCode = 1;
    try { await page.screenshot({ path: path.join(OUT, 'fail.png') }); } catch (e) { /* */ }
  } finally { await browser.close(); }
})();
