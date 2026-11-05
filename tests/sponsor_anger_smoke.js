/* 후원자의 노여움 (tests/sponsor_anger_smoke.js) — node tests/sponsor_anger_smoke.js — 2026-11-05 피드백
   「마누엘 1세와 계약을 기한 전에 포기한 뒤 모험 제안을 누르면 단서가 안 보이고 "용건도 없이 어전을 드나드는 것은 무례한 일이오"만 나온다」
   · 계약을 포기하면 90일 노여움 — 그때 바로 알림 · 왕궁 「모험 제안」에 「노여움 N일」
   · 제안을 누르면 까닭(「계약 이름」을 기한 전에 포기)과 풀리는 날을 알리고, 사죄의 선물로 바로 풀 수 있다 → 단서 목록이 나온다
   · 날이 지나면 저절로 풀린다 · 이중 보고·교섭 결렬도 까닭을 적는다 · 콘솔 오류 0 */
const path = require('path'); const { pathToFileURL } = require('url'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  try {
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push('PAGEERR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.G && G.Game && G.Sponsor && G.Scenes && G.Scenes.city, null, { timeout: 90000, polling: 200 });
  const out = await page.evaluate(async () => {
    const R = []; const ok = (c, m) => R.push((c ? '✓ ' : '✗ ') + m); const sleep = ms => new Promise(r => setTimeout(r, ms));
    await G.Game.ensureGeo(); G.Nav.init();
    G.State.newGame({ name: '페르낭 소아르스', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    if (G.Tutorial && G.Tutorial.stop) try { G.Tutorial.stop(); } catch (e) {}
    const s = G.Game.state, SP = G.Sponsor, UI = G.UI, sp = G.SPONSOR.pt_king, rel = SP.rel('pt_king');
    s.player.gold = 1000000;
    const said = [], asked = [], Q = [];
    UI.say = async (t, w) => { said.push(((w && w.name) || '') + ': ' + t); };
    UI.ask = async (t, ch) => { asked.push({ t, ch }); const v = Q.shift(); const hit = ch.find(c => c.value === v); return hit ? hit.value : ch[ch.length - 1].value; };
    let chooseList = null; UI.choose = async (t, o) => { chooseList = o; return null; };
    UI.alert = async () => {}; const toasts = []; const t0 = UI.toast; UI.toast = (t) => { toasts.push(t); };
    const city = G.CITY_DATA[sp.city];
    G.Game.go('city', { cityId: city.id }); await sleep(400);
    // 단서 몇 개
    G.DISCOVERIES.filter(d => !d.circ).slice(0, 4).forEach(d => { s.hints[d.id] = 2; });
    // 계약을 맺고 기한 전에 포기
    const d0 = G.DISCOVERIES.find(d => d.name);
    s.contract = { sponsor: 'pt_king', disc: d0.id, advance: 5000, due: 99991231, small: false };
    await SP.breakContract(sp, 'quit');
    ok(!s.contract && SP.angerLeft(sp) >= 89 && SP.angerLeft(sp) <= 90, '기한 전에 포기 → 노여움 ' + SP.angerLeft(sp) + '일');
    ok(toasts.some(t => /90일 동안 새 모험을 제안할 수 없다/.test(t)), '포기할 때 바로 알린다: ' + toasts.find(t => /90일/.test(t)));
    const PB = G.Scenes.city.B.palace || G.Scenes.city.B.court;
    const menu = PB && PB.menu ? PB.menu(city, sp.id) : null;
    const it = menu && menu.find(x => x && x.label === '모험 제안');
    ok(it && /노여움 \d+일/.test(it.sub) && it.dim, '왕궁 「모험 제안」: ' + (it && it.sub));
    // 제안 → 까닭과 날짜 → 물러난다
    said.length = 0; asked.length = 0; chooseList = null;
    await SP.propose(sp);
    const a = asked[0];
    ok(said.some(x => /용건도 없이/.test(x)) && a && a.t.indexOf('「' + d0.name + '」 계약을 기한 전에 포기한 일') >= 0 && /\d+년 \d+월 \d+일\(앞으로 \d+일\)부터/.test(a.t), '까닭과 풀리는 날: ' + (a && a.t));
    ok(a && /사죄의 뜻으로 금화 [\d,]+닢/.test(a.ch[0].label) && !chooseList, '「물러난다」면 그대로 — ' + (a && a.ch[0].label));
    // 사죄 → 풀리고 단서 목록
    const g0 = s.player.gold, cost = SP.apologyCost(sp);
    Q.push('pay'); said.length = 0; asked.length = 0;
    await SP.propose(sp);
    ok(SP.angerLeft(sp) === 0 && s.player.gold === g0 - cost && chooseList && chooseList.length >= 4, '사죄의 선물 금화 ' + cost + '닢 → 노여움이 풀리고 단서 ' + (chooseList ? chooseList.length : 0) + '개가 나온다');
    // 날이 지나면 저절로
    rel.anger = G.U.dateNum(G.U.addDays(s.date, 10)); rel.angerWhy = { why: 'dbl', name: '옥수수' };
    ok(/「옥수수」 발견을 두 후원자에게 보고한 일/.test(SP.angerText(sp)), '이중 보고: ' + SP.angerText(sp));
    s.date = G.U.addDays(s.date, 11); ok(SP.angerLeft(sp) === 0, '날이 지나면 저절로 풀린다');
    rel.anger = G.U.dateNum(G.U.addDays(s.date, 5)); delete rel.angerWhy;
    ok(/지난 계약의 일/.test(SP.angerText(sp)), '옛 저장(까닭 없음): ' + SP.angerText(sp));
    UI.toast = t0;
    return R;
  });
  console.log(out.join('\n')); console.log(errs.length ? errs.join('\n') : '콘솔 오류 0');
  } finally { await b.close(); }
})();
