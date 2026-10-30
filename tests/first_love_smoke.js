/* 첫사랑 — 소꿉친구의 비밀 · 첫 항해 · 연애 · 청혼과 혼례 (2026-10-29 사용자 요청) — node tests/first_love_smoke.js   (BROWSER_EXE=크롬 경로)
   js/systems/firstlove.js · js/data/firstlove.js
   ① 지금 제독의 여성 소꿉친구만 (kinOf · 옛 저장은 설명) · 항구에서는 첫 항해가 시작되지 않는다 · 바다 3일째 밤 → 첫 항해(실마리)
   ② 30일 뒤 부치지 못한 편지 → 「진심이야」 → 연애 · 설명에 첫사랑이 덧붙는다
   ③ 항구 데이트 세 번(시장·노을 부두·등불 축제 — 겹치지 않음) → 청혼 · 「아직은」이면 60일 뒤 → 혼례: 본처 · 배에서 내림 · 갑판 위의 혼례
   ④ 아내가 있으면 「지켜야 할 사람」 — 연애로 가지 않는다 · 장면은 합성(배경 + 두 사람) · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.FirstLove && G.OldGuard && G.HeirPlan, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, said = [], out = {}, shots = [];
      UI.alert = async (t, title) => { said.push('[' + (title || '') + '] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + t); };
      UI.toast = () => {}; UI.confirm = async () => true;
      window.__ask = []; UI.ask = async (t, opts) => { said.push('ASK ' + t + ' :: ' + opts.map(o => o.label).join(' | ')); const w = window.__ask.shift(); const o = opts.find(x => x.value === w) || opts[0]; return o.value; };
      const es0 = G.EventShot.show; G.EventShot.show = (o) => { shots.push({ title: o.title, bg: o.bg[0], cast: o.cast.length, light: o.light }); return es0(o); };
      let wed = null; G.FamEv.wedding = async (o) => { wed = o; };
      const setup = (wife) => {
        G.State.newGame({ name: '주앙 코스타', nation: 'PT', job: 'explorer', age: 26, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1560, m: 6, d: 1 }; s.player.given = '주앙'; s.player.surname = '코스타'; s.player.generation = 2;
        if (wife) s.player.wife = wife;
        let d = null; for (let i = 0; i < 40 && (!d || d.g !== 'f'); i++) d = G.OldGuard.makeKin('friend', { name: '가브리엘 코스타', nation: 'PT', home: s.player.home, surname: '코스타' }, { name: '주앙' });
        G.OldGuard.st().defs[d.id] = d; G.MATES.push(d); G.MATE[d.id] = d; G.MATE_RANGE[d.id] = { zones: [], home: d.home };
        const row = G.Legend.join(d.id, G.CITY_DATA[s.player.home]); delete row.ev; row.kin = 'friend'; row.loyal = 80;
        s.loc = { mode: 'city', city: s.player.home };
        return { s, d, row };
      };
      // ①
      let { s, d, row } = setup(null);
      out.mine = G.FirstLove.isMine(d); out.kinOf = d.kinOf;
      const old = Object.assign({}, d, { kinOf: undefined }); out.oldSave = G.FirstLove.isMine(old);
      const other = Object.assign({}, d, { kinOf: '마누엘' }); out.other = G.FirstLove.isMine(other);
      out.cityDue = G.FirstLove.due();
      s.loc = { mode: 'sea', lon: -12, lat: 38 }; out.sea0 = G.FirstLove.due(); s.day += 3; out.sea3 = G.FirstLove.due();
      await G.FirstLove.run('voyage');
      const o = G.FirstLove.st();
      out.v = { st: o.st, said: said.join('\n'), due: G.FirstLove.due() };
      said.length = 0;
      // ②
      s.day += 30; out.secretDue = G.FirstLove.due(); window.__ask = ['confess'];
      await G.FirstLove.run('secret');
      out.sec = { st: o.st, desc: d.desc, said: said.join('\n'), loyal: row.loyal };
      said.length = 0;
      // ③ 데이트
      s.loc = { mode: 'city', city: s.player.home }; out.d0 = G.FirstLove.due();
      s.day += 20; out.d1 = G.FirstLove.due();
      const titles = [];
      for (let i = 0; i < 3; i++) { await G.FirstLove.run('date'); titles.push(o.dates[o.dates.length - 1]); s.day += 20; }
      out.dates = { list: titles, st: o.st, said: said.join('\n') };
      said.length = 0;
      out.pDue = G.FirstLove.due();
      window.__ask = ['later']; await G.FirstLove.run('propose');
      out.later = { st: o.st, due: G.FirstLove.due() };
      s.day += 60; window.__ask = ['yes']; await G.FirstLove.run('propose');
      out.wed = { wife: s.player.wife === d.id, aboard: s.mates.some(m => m.id === d.id), gone: !!s.flags['gone_' + d.id], wedFlag: !!s.flags['wed_' + d.id], fam: wed && wed.id === d.id, st: o.st, said: said.join('\n'), log: s.log.slice(-6).map(x => x.t).join(' / '), due: G.FirstLove.due() };
      out.shots = shots.slice();
      // ④ 아내가 있으면
      said.length = 0;
      ({ s, d, row } = setup('h_somewife'));
      s.loc = { mode: 'sea', lon: -12, lat: 38 }; G.FirstLove.due(); s.day += 3;
      await G.FirstLove.run('voyage'); s.day += 30;
      await G.FirstLove.run('secret');
      out.kept = { st: G.FirstLove.st().st, ask: said.find(x => /^ASK/.test(x)), due: G.FirstLove.due() };
      G.FirstLove.tick();
      return out;
    });
    console.log(JSON.stringify({ shots: r.shots, dates: r.dates.list, kept: r.kept.ask }, null, 1));
    ok(r.mine && r.kinOf === '주앙' && r.oldSave && !r.other, '지금 제독의 소꿉친구만 (kinOf · 옛 저장은 설명으로) — 다른 사람의 소꿉친구는 아니다');
    ok(r.cityDue === null && r.sea0 === null && r.sea3 === 'voyage', '항구에서는 아니고, 바다에 나가 3일째에 첫 항해');
    ok(r.v.st === 'voyage' && /수평선 너머/.test(r.v.said) && /조개 목걸이/.test(r.v.said) && r.v.due === null, '첫 항해의 밤 — 말을 꺼내다 그만둔다 (실마리)');
    ok(r.secretDue === 'secret' && r.sec.st === 'love' && /부치지 못한/.test(r.sec.said) && /나는 너를…/.test(r.sec.said) && /첫사랑/.test(r.sec.desc) && r.sec.loyal >= 93, '부치지 못한 편지 → 「진심이야」 → 연애 · 설명에 첫사랑');
    ok(r.d0 === null && r.d1 === 'date' && new Set(r.dates.list).size === 3 && r.dates.st === 'propose', '데이트 세 번 (겹치지 않음: ' + r.dates.list.join('·') + ') → 청혼 차례');
    ok(r.pDue === 'propose' && r.later.st === 'propose' && r.later.due === null, '「아직은」이면 한동안 미룬다');
    ok(r.wed.wife && !r.wed.aboard && r.wed.gone && r.wed.wedFlag && r.wed.fam && r.wed.st === 'wed' && r.wed.due === null, '청혼 → 본처 · 배에서 내림 · 갑판 위의 혼례 · 끝');
    ok(/세상 끝까지/.test(r.wed.said) && /결혼했다/.test(r.wed.log), '청혼 대사 · 일지 — ' + r.wed.log);
    ok(r.shots.length >= 5 && r.shots.every(x => x.cast === 2) && r.shots.some(x => x.light === 'night') && r.shots.some(x => x.light === 'dusk'), '장면 합성(배경 + 제독·소꿉친구) ' + r.shots.length + '장');
    ok(r.kept.st === 'kept' && /지켜야 할 사람/.test(r.kept.ask) && !/지금도 진심/.test(r.kept.ask) && r.kept.due === null, '아내가 있으면 「지켜야 할 사람」 — 연애로 가지 않는다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' / ') : ''));
    console.log('first_love_smoke OK');
  } catch (e) {
    console.error('✗ ' + (e && e.stack || e)); process.exitCode = 1;
  } finally { await browser.close(); }
})();
