/* 동료 업적 「일당 수집 완료」 (js/data/achievements.js montcrew · js/systems/achieve.js AC.afterHire)
   · 루이스 몬테이루와 함께 만든 동료 열 사람(js/data/storycrew.js 맨 앞 열 명)을 술집에서 차례로 고용한다
   · 아홉 명째에는 「한 사람 남았다」 귀띔, 열 명째에 업적 창이 뜨고 금화·명성·칭호를 받는다
   · 한 사람이 떠나도(동료 명부에서 빠져도) 들인 적이 있으면 센다 — 옛 저장은 지금 배의 동료로 채운다
   · 수첩 「업적」 쪽에 「동료」 갈래와 열 사람 이름이 보인다. 콘솔 오류 0
   node tests/crew_achv_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, out = { toasts: [], wins: [] };
      UI.say = async () => {};
      UI.confirm = async () => true;
      UI.toast = (t) => { out.toasts.push(String(t)); };
      UI.window = (o) => { out.wins.push(o.title + '|' + (o.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()); return { result: Promise.resolve(1) }; };
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.flags.prologue = true; s.player.fame = 99999; s.player.gold = 9000000;
      for (let i = 0; i < 20; i++) s.player.lg[i] = 3;
      if (G.Cabins) G.Cabins.wageWarning = () => null;
      const a = G.Achieve.get('montcrew'), T = G.Scenes.city.B.tavern, c = G.CITY_DATA[0];
      out.a = a && { name: a.name, group: a.group, crew: a.crew.slice(), title: a.title };
      out.groups = G.ACHV_GROUPS.slice();
      out.names = a.crew.map(id => G.MATE[id] && G.MATE[id].name);
      out.first = G.Achieve.progress(a);
      const gold0 = s.player.gold;
      for (let i = 0; i < a.crew.length; i++) {
        const id = a.crew[i];
        if (i === 3) { s.mates = s.mates.filter(m => m.id !== a.crew[1]); }   // 둘째(로드리고)가 떠났다
        const got = await T.hireMate(c, G.MATE[id]);
        if (!got) { out.fail = id; break; }
        if (i === 8) { out.nine = { done: G.Achieve.done('montcrew'), toasts: out.toasts.filter(t => /한 사람 남았다/.test(t)), wins: out.wins.length }; }
      }
      out.done = G.Achieve.done('montcrew');
      out.wins10 = out.wins.filter(w => /일당 수집 완료/.test(w));
      out.goldGain = s.player.gold - gold0;
      out.titles = G.Achieve.titles();
      out.left = s.mates.some(m => m.id === a.crew[1]);
      out.log = (s.log || []).map(x => x.t || x.text || String(x)).filter(t => /일당 수집 완료/.test(t)).length;
      // 수첩 쪽
      const el = document.createElement('div'); G.Achieve.page(el);
      const txt = el.textContent;
      out.page = { group: txt.indexOf('동료') >= 0, name: txt.indexOf('일당 수집 완료') >= 0, mates: out.names.every(n => txt.indexOf(n) >= 0) };
      // 옛 저장: crewEver가 없어도 지금 배의 동료로 센다 → 하루가 지나면 업적
      G.Game.state = G.State.newGame({ name: '옛', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s2 = G.Game.state; a.crew.forEach(id => s2.mates.push({ id, role: 'none', joined: 0, loyal: 80 })); delete s2.crewEver;
      const news = G.Achieve.daily();
      out.old = { done: G.Achieve.done('montcrew'), news: news.filter(n => /일당 수집 완료/.test(n.text)).length };
      return out;
    });
    console.log('   ' + JSON.stringify({ a: r.a, nine: r.nine, wins10: r.wins10, gold: r.goldGain, titles: r.titles, page: r.page, old: r.old, fail: r.fail }));
    ok(r.a && r.a.name === '일당 수집 완료' && r.a.group === '동료' && r.groups.includes('동료'), '「동료」 갈래에 「일당 수집 완료」 업적이 있다');
    ok(r.a.crew.length === 10 && r.a.crew[0] === 'monteiro' && r.names.every(Boolean), '루이스 몬테이루를 비롯한 열 사람: ' + r.names.join(', '));
    ok(r.first.have === 0 && r.first.need === 10 && !r.first.done, '처음에는 0 / 10');
    ok(!r.fail, '열 사람을 술집에서 모두 고용했다');
    ok(r.nine && !r.nine.done && r.nine.toasts.length === 1 && r.nine.wins === 0, '아홉 명째: 아직 아니고 「한 사람 남았다」 귀띔 (' + (r.nine && r.nine.toasts[0]) + ')');
    ok(r.done && r.wins10.length === 1, '열 명째에 업적 창: ' + r.wins10[0]);
    ok(r.left === false && r.done, '중간에 한 사람이 떠나도 들인 적이 있으면 센다');
    ok(r.goldGain === 30000 && r.titles.includes('일당의 선장'), '보상: 금화 30,000 · 칭호 「일당의 선장」');
    ok(r.page.group && r.page.name && r.page.mates, '수첩 「업적」 쪽에 동료 갈래·업적·열 사람 이름');
    ok(r.old.done && r.old.news === 1, '옛 저장: 이미 배에 탄 열 사람으로 하루가 지나면 이룬다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
