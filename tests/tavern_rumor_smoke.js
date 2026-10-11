/* 주점 소문 3건(난이도 낮은 순 · 가까울수록 · 찾으면 새로 · 30일마다 새로) + 대륙·도시 특별 소문과 증거품.
   node tests/tavern_rumor_smoke.js  (BROWSER_EXE=크로미움 경로) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, TR = G.TavernRumor, T = G.Scenes.city.B.tavern, out = {};
      s.player.fame = 2000;   // 지역 거리 2까지
      const lis = G.CITY_DATA[0], src = 'tavern:0';
      // ① 3건 · 난이도 낮은 순
      const p = TR.pool(lis);
      out.n = p.ids.length;
      const tiers = p.ids.map(id => TR.tier(G.DISC[id]));
      out.sorted = tiers.every((t, i) => i === 0 || tiers[i - 1] <= t);
      const rest = TR.candidates(lis, src).filter(d => p.ids.indexOf(d.id) < 0);
      out.lowest = rest.every(d => TR.tier(d) >= Math.max.apply(null, tiers));
      out.names = p.ids.map(id => G.DISC[id].name + '(pw' + G.DISC[id].pw + ')');
      // ② 가까울수록 잘 뽑힘: 같은 층 후보들의 평균 거리 vs 뽑힌 것의 평균 거리 (300번)
      const geo = d => G.Geo.dist(lis.lon, lis.lat, d.lon, d.lat);
      let pick = 0, pickN = 0, all = 0, allN = 0;
      for (let k = 0; k < 300; k++) {
        delete s.tavernRumor; const q = TR.pool(lis), top = Math.max.apply(null, q.ids.map(id => TR.tier(G.DISC[id])));
        q.ids.forEach(id => { const d = G.DISC[id]; if (TR.tier(d) === top && (d.lat || d.lon)) { pick += geo(d); pickN++; } });
        if (k === 0) TR.candidates(lis, src).forEach(d => { if (TR.tier(d) === top && (d.lat || d.lon)) { all += geo(d); allN++; } });
      }
      out.pickAvg = Math.round(pick / pickN); out.allAvg = Math.round(all / allN);
      // ③ 손님 소문은 3건 안에서만 — 다 들으면 더 없음
      delete s.tavernRumor; const p3 = { ids: TR.pool(lis).ids.slice() }, heard = [];
      for (let k = 0; k < 5; k++) { const d = T.rumour(lis, { stack: true }); if (!d) { heard.push(null); continue; } heard.push(d.id); G.Disc.noteHint(d, src); }
      out.heard = heard; out.inPool = heard.filter(Boolean).every(id => p3.ids.indexOf(id) >= 0); out.exhausted = heard[3] === null && heard[4] === null;
      // ④ 하나를 찾으면 그 자리에 새 소문
      const found = p3.ids[0]; s.disc[found] = { found: true, me: true };
      const p4 = TR.pool(lis); out.refill = p4.ids.length === 3 && p4.ids.indexOf(found) < 0; out.newOne = T.rumour(lis, { stack: true });
      out.newOne = out.newOne && p4.ids.indexOf(out.newOne.id) >= 0 && !p3.ids.includes(out.newOne.id);
      // ⑤ 30일 지나면 새로
      const d0 = p4.d; s.day += 30; const p5 = TR.pool(lis); out.reset = p5.d === s.day && p5.d !== d0; s.day -= 30; delete s.tavernRumor;
      // ⑥ 특별 소문은 다른 주점의 소문·예전 소문 함수에 나오지 않는다
      const spIds = G.TAVERN_SPECIAL.map(t => t.disc);
      out.excl = G.CITY_DATA.slice(0, 120).every(c => TR.candidates(c, 'tavern:' + c.id).every(d => spIds.indexOf(d.id) < 0));
      let freeHit = false; for (let k = 0; k < 200; k++) { const d = T.rumourFree(lis); if (d && spIds.indexOf(d.id) >= 0) freeHit = true; }
      out.freeExcl = !freeHit;
      // ⑦ 특별 소문 + 증거품 (리스본 — 프레스터 존, 열려 있게 한다)
      const avail0 = G.Disc.available; G.Disc.available = d => d.id === 'prester' ? true : avail0(d);
      const canH = G.Frontier.canHint; G.Frontier.canHint = (d, x) => d.id === 'prester' ? true : canH(d, x);
      const UI = G.UI, keep = { say: UI.say, confirm: UI.confirm, toast: UI.toast }, said = [], conf = [];
      UI.say = async t => { said.push(String(t)); }; UI.toast = t => { said.push('toast:' + t); };
      UI.confirm = async (h, y, n, title) => { conf.push(title + '|' + h); return true; };
      try {
        out.sp = TR.special(lis) && TR.special(lis).disc;
        s.player.gold = 5000;
        out.told = await TR.tellSpecial(lis, { name: '술집 주인' });
        out.lv = G.Disc.hintLv('prester'); out.gold = s.player.gold;
        out.item = s.player.items.find(it => it.kind === 'clue');
        out.again = await TR.tellSpecial(lis, { name: '술집 주인' });   // 증거품을 샀으면 더 꺼내지 않음
        out.said = said.slice(0, 3); out.conf = conf[0] ? conf[0].slice(0, 60) : '';
        out.otherCity = TR.specialsAt(G.CITY_DATA[38]).map(t => t.disc);   // 런던: 네스 호 + 북유럽
      } finally { Object.assign(UI, keep); G.Disc.available = avail0; G.Frontier.canHint = canH; }
      return out;
    });
    console.log('    리스본 소문 3건:', r.names.join(', '));
    ok(r.n === 3 && r.sorted && r.lowest, '소문 3건, 난이도 낮은 순 (남은 후보는 모두 같거나 더 어려움)');
    ok(r.pickAvg < r.allAvg, '가까울수록 잘 뽑힘: 뽑힌 것 평균 ' + r.pickAvg + '° < 같은 층 후보 평균 ' + r.allAvg + '°');
    ok(r.inPool && r.exhausted, '손님 소문은 3건 안에서만, 다 들으면 더 없음 ' + JSON.stringify(r.heard));
    ok(r.refill && r.newOne, '하나를 찾으면 그 자리에 새 소문이 들어오고 들을 수 있음');
    ok(r.reset, '30일이 지나면 새로 뽑음');
    ok(r.excl && r.freeExcl, '특별 소문은 다른 주점 소문(새·옛 함수)에 나오지 않음');
    ok(r.sp === 'prester' && r.told === true, '리스본 주인: 특별 소문 「프레스터 존」');
    ok(r.item && r.item.clue === 'prester' && r.lv === 2 && r.gold === 4100, '증거품을 사면 단서 2겹 (특별 소문 + 증거품), 금화 900');
    ok(r.again === false, '증거품을 가졌으면 주인이 다시 꺼내지 않음');
    ok(r.otherCity.join() === 'nessie,brendan', '런던: 도시 것(네스 호) 먼저, 그다음 북유럽 것');
    // 그림: 증거품 권하는 창
    await page.evaluate(() => { const TR = G.TavernRumor, t = G.TAVERN_SPECIAL[0]; G.UI.confirm('「' + t.ev.name + '」<div class="muted" style="font-size:16px;margin-top:6px">' + t.ev.desc + '</div><div style="font-size:16px;margin-top:6px">금화 ' + TR.evPrice(t) + '닢에 사겠습니까? 가지고 있으면 이 이야기의 단서가 한 겹 더 쌓입니다.</div>', '산다', '그만둔다', '주점의 증거품'); });
    await page.waitForTimeout(500);
    await page.screenshot({ path: process.env.SHOT || '/tmp/tavern_evidence.png' });
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
