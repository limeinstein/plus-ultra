/* 정글북 — 모글리 (2026-10-26 · 2026-10-28 게임에 연결) — 델리 근처 숲 · 바나나 10개 · 여자 부하 · 걸을 때마다 사라지는 바나나 · 오랑우탄의 수수께끼 · 90일 동안 네 가지 말
   node tests/junglebook_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const out = {}, said = [], asked = [], toasts = [], pics = [];
      let answer = 'right';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => {
        asked.push(q);
        const MG = G.Mowgli, rd = MG.RIDDLES.find(x => q.indexOf(x.q.replace(/\s+/g, ' ').slice(0, 30)) >= 0);
        if (rd) { const o = answer === 'right' ? opts.find(x => x.value === rd.a) : opts.find(x => x.value !== rd.a); return o.value; }
        return opts[0].value;
      };
      G.UI.toast = (t) => { toasts.push(t); };
      const showPic = G.FamEv.showPic;
      G.FamEv.showPic = ev => { pics.push(ev.img + (G.Img.file(ev.img) ? '' : '(없음)')); return showPic.call(G.FamEv, ev); };
      const MG = G.Mowgli, D = G.CITY_DATA[145], at = [D.lon + 1.2, D.lat + 0.8];
      const fem = G.MATES.find(d => d.g === 'f' && !d.eventOnly && d.st);
      function fresh(bananas, woman) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1520, m: 6, d: 1 };
        s.mates = woman ? [{ id: fem.id, role: 'none', loyal: 80 }] : [{ id: 'rocco', role: 'first', loyal: 80 }];
        s.fleet.cargo = bananas ? { banana: { q: bananas, cost: 12, d: s.day, lots: { 0: { q: bananas, cost: 12 } } } } : {};
        s.loc = { mode: 'land', lon: at[0], lat: at[1], party: 30 };
        said.length = 0; asked.length = 0; toasts.length = 0; pics.length = 0;
        return s;
      }
      const d = G.MATE.mowgli;
      out.def = d && { sk: d.sk, lg: Object.keys(d.lg).length, eventOnly: d.eventOnly, wage: d.wage, face: G.Img.file('portraits/legendary/mowgli_half') };
      out.scripts = [...document.scripts].map(x => x.getAttribute('src') || '').filter(x => /junglebook/.test(x));
      out.landHook = /G\.Mowgli\.onLand/.test(String(G.Scenes.land && Object.values(G.Scenes.land).map(String).join('')) || '');
      out.where = { near: MG.forest(at[0], at[1]), far: MG.forest(D.lon + 6, D.lat), delhi: MG.forest(D.lon, D.lat) };
      const walk = async (s, n) => { const res = []; for (let i = 0; i < n; i++) { let stopped = false; res.push(await MG.onLand(s.loc.lon, s.loc.lat, { stop: () => { stopped = true; } }) + (stopped ? '/stop' : '')); } return res; };
      let s = fresh(20, false); out.noWoman = await walk(s, 4); out.noWomanBan = MG.bananas();
      s = fresh(8, true); out.fewBananas = await walk(s, 4); out.fewBan = MG.bananas();
      s.loc.lon = D.lon + 6; s.fleet.cargo.banana.q = 20; out.farAway = await walk(s, 3);
      s = fresh(20, true); answer = 'wrong';
      out.failWalk = await walk(s, 3);
      out.failBan = MG.bananas(); out.failCool = s.mowgli.cool - s.day; out.failJoined = s.mates.some(m => m.id === 'mowgli');
      out.stealToasts = toasts.filter(t => /바나나/.test(t)).length;
      out.failAsked = asked.length;
      s = fresh(20, true); answer = 'right';
      out.okWalk = await walk(s, 3);
      out.okSaid = said.join('\n'); out.pics = pics.slice();
      out.joined = s.mates.some(m => m.id === 'mowgli'); out.crush = s.mowgli.crush === fem.id; out.okBan = MG.bananas();
      out.femName = fem.name;
      out.again = await walk(s, 2);
      const m = s.mates.find(x => x.id === 'mowgli'), L = [8, 10, 12, 6], snap = {};
      for (let dd = 1; dd <= 95; dd++) { MG.daily(); if (dd === 30 || dd === 60 || dd === 89 || dd === 90) snap[dd] = L.map(li => G.R.mateLang(m, li)).join(''); }
      out.langs = snap; out.other = G.R.mateLang(m, 0);
      // 하루가 지나면 World.daily를 거쳐 말을 익힌다
      const t0 = m.mg.days; G.World.daily(); out.viaWorld = m.mg.days === t0 + 1;
      return out;
    });
    console.log('   ' + JSON.stringify({ def: r.def, where: r.where, pics: r.pics }));
    ok(r.scripts.length === 2, '자료·사건 스크립트가 index.html에 들어 있다');
    ok(r.def && r.def.sk.craft === 3 && r.def.sk.shoot === 3 && r.def.sk.survey === 3 && r.def.sk.ship === 3 && r.def.lg === 0 && r.def.eventOnly && r.def.face, '모글리: 세공·사격·측량·조선기술 3 · 처음엔 사람의 말을 모른다 · 사건으로만 · 무릎상 연결 (품삯 ' + (r.def && r.def.wage) + ')');
    ok(r.where.near && r.where.delhi && !r.where.far, '델리 근처(3도 안)에서만');
    ok(r.noWoman.every(x => x === 'false') && r.noWomanBan === 20, '여자 부하가 없으면 아무 일도 없다');
    ok(r.fewBananas.every(x => x === 'false') && r.fewBan === 8, '바나나가 10개보다 적으면 아무 일도 없다');
    ok(r.farAway.every(x => x === 'false'), '델리에서 멀면 아무 일도 없다');
    ok(r.failWalk[0] === 'false' && r.failWalk[1] === 'false' && /stop/.test(r.failWalk[2]) && r.stealToasts === 2, '걸을 때마다 바나나가 사라지고(이틀), 사흘째 오랑우탄들과 마주친다 — ' + r.failWalk.join(','));
    ok(r.failAsked === 2 && r.failBan === 0 && r.failCool === 30 && !r.failJoined, '수수께끼를 두 번 틀리면 남은 바나나를 몽땅 가져가고 모글리도 사라진다 (30일 뒤)');
    ok(r.okWalk[2] === 'true/stop' && r.joined && r.crush, '수수께끼를 풀면 모글리가 동료가 된다');
    ok(/네가 정말 사람이라면/.test(r.okSaid) && /다른 이에게 도움을 받는 것도 사람의 모습/.test(r.okSaid) && /사람이 되고 싶어/.test(r.okSaid) && r.okSaid.indexOf(r.femName + '에게서 멈췄다') >= 0, '오랑우탄이 사람이라면 풀어 보라 → 모글리가 쩔쩔매고 제독이 돕는다 → 도움 받는 것도 사람의 모습 → ' + r.femName + '에게 반한다');
    ok(r.pics.indexOf('legend-events/mowgli_farewell') >= 0 && /어미 늑대와 이마를 맞댄/.test(r.okSaid), '합류할 때 어미 늑대와의 작별 장면 그림이 나온다 — ' + r.pics.join(','));
    ok(r.okBan > 0 && r.okBan < 20, '바나나는 사라지고 몇 개는 오랑우탄들이 가져간다 (남은 ' + r.okBan + ')');
    ok(r.again.every(x => x === 'false'), '동료가 된 뒤에는 다시 일어나지 않는다');
    ok(r.langs[30] === '1111' && r.langs[60] === '2222' && r.langs[89] === '2222' && r.langs[90] === '3333' && r.other === 0, '90일 동안 힌두어·아프리카·동남아시아·페르시아어를 익혀 90일째 모두 3단계 — ' + JSON.stringify(r.langs));
    ok(r.viaWorld, '하루가 지나면(World.daily) 말을 익히는 날이 는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
