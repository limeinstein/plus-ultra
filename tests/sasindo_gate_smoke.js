/* 사신 — 하늘의 네 짐승: 강서대묘의 사신도를 손에 넣어야 사신의 자취가 열린다 (2026-11-14)
   · 강서대묘(gangseo)는 평양 서쪽의 유적 발견물, 찾으면 사신도(r_sasindo)를 함께 얻는다
   · 사신도 전에는 청룡(dragon)·백호(whitetiger)·봉황(phoenix)·현무(hyeonmu)의 단서도 발견도 열리지 않는다 (그 자리에 가도)
   · 사신도를 얻는 순간 네 짐승의 단서를 얻고, 그 자리(현무)에서 찾을 수 있다. 사신도를 팔아도 권한은 남는다
   node tests/sasindo_gate_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  try {
    await page.goto(((process.env.WEB_BASE && new URL('index.html',process.env.WEB_BASE).href) || pathToFileURL(path.join(__dirname, '..', 'index.html')).href), { timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.sea && G.DISC, null, { timeout: 180000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, D = G.Disc, out = {};
      s.date.y = 1560; s.player.sk = Object.assign(s.player.sk || {}, { hist: 3, sci: 3 }); G.Frontier.invalidate();
      const UI = G.UI; window._say = [];
      UI.say = async (t, who) => { _say.push(((who && who.name) || '') + ': ' + String(t)); };
      UI.toast = (t) => { _say.push('TOAST: ' + String(t)); }; UI.alert = async () => {}; UI.confirm = async () => true; UI.ask = async () => null; UI.choose = async () => null;
      G.Scenes.discoveryCard = async () => {}; G.Scenes.discoveryReveal = null; G.Scenes.discoveryVoices = null;
      if (G.Achieve) G.Achieve.afterFind = async () => {};
      D.noClueRoll = () => true;   // 단서 없는 날의 운은 이 시험과 관계없다
      const four = ['dragon', 'whitetiger', 'phoenix', 'hyeonmu'], g = G.DISC.gangseo;
      out.gangseo = g && { name: g.name, cat: g.cat, how: g.how, lat: g.lat, lon: g.lon, relic: (D.relicsOf('gangseo') || []).map(x => x.id + ':' + x.name) };
      out.needRelic = four.map(id => G.DISC[id].needRelic);
      // ① 사신도 전: 단서·발견이 닫혀 있다
      out.before = four.map(id => ({ id, needMet: D.needMet(G.DISC[id]), avail: G.Frontier.available(G.DISC[id]), hintBook: D.addHint(id, 'book:b_shiji') }));
      out.landBefore = D.checkLand(G.DISC.hyeonmu.lon, G.DISC.hyeonmu.lat, { search: true }).hits.map(d => d.id);
      // ② 강서대묘 발견 → 사신도 + 네 짐승의 단서
      s.loc = { mode: 'land', lon: g.lon, lat: g.lat, heading: 0 };
      s.discDay = null;   // 하루 한 개 — 위에서 이미 본 날
      const hitG = D.checkLand(g.lon, g.lat, { search: true }).hits.map(d => d.id);
      out.hitG = hitG;
      await D.find(g);
      out.items = s.player.items.map(it => it.id);
      out.has = D.hasRelic('r_sasindo');
      out.hints = four.filter(id => !!s.hints[id]);
      out.said = _say.filter(x => /사신|신수/.test(x)).slice(0, 2);
      out.after = four.map(id => D.needMet(G.DISC[id]));   // (개척 단계는 따로 — 새 게임이라 중국 길이 아직 닫혀 있다)
      s.discDay = null;
      out.landAfter = D.checkLand(G.DISC.hyeonmu.lon, G.DISC.hyeonmu.lat, { search: true }).hits.map(d => d.id);
      // ③ 사신도를 팔아도(소지품에서 빠져도) 권한은 남는다
      s.player.items = s.player.items.filter(it => it.id !== 'r_sasindo');
      out.afterSell = D.hasRelic('r_sasindo') && D.needMet(G.DISC.dragon);
      // 옛 저장 형태와 자택 보관·저장 복원도 확인한다.
      const record = s.disc.gangseo; delete s.disc.gangseo;
      s.player.storage = [{ id: 'r_sasindo', disc: 'gangseo' }];
      out.storage = D.hasRelic('r_sasindo') && four.every(id => D.needMet(G.DISC[id]));
      await G.State.saveAsync(1); G.Game.state = await G.State.loadAsync(1);
      out.restore = D.hasRelic('r_sasindo') && four.every(id => D.needMet(G.DISC[id]));
      delete G.Game.state.player.storage;
      out.legacyMissing = !D.hasRelic('r_sasindo');
      G.Game.state.disc.gangseo = record;
      out.recordOnly = D.hasRelic('r_sasindo');
      return out;
    });
    console.log('    ' + JSON.stringify(r.gangseo) + ' · ' + r.said.join(' / ').slice(0, 200));
    ok(r.gangseo && r.gangseo.cat === 'ruin' && r.gangseo.relic.some(x => /^r_sasindo:사신도$/.test(x)), '강서대묘는 유적 발견물, 사신도(r_sasindo)를 함께 얻는다');
    ok(r.needRelic.every(x => x === 'r_sasindo'), '청룡·백호·봉황·현무는 사신도가 있어야 열린다');
    ok(r.before.every(x => !x.needMet && !x.avail && !x.hintBook), '사신도 전: 네 짐승은 책에서도 단서가 나오지 않고 열리지 않는다');
    ok(r.landBefore.indexOf('hyeonmu') < 0, '사신도 전: 현무 자리에 가도 찾지 못한다 ' + JSON.stringify(r.landBefore));
    ok(r.hitG.indexOf('gangseo') >= 0, '강서대묘 자리에서 강서대묘를 찾는다');
    ok(r.items.indexOf('r_sasindo') >= 0 && r.has, '강서대묘를 찾으면 사신도가 소지품에 들어온다');
    ok(r.hints.length === 4, '사신도를 펼치면 네 짐승의 단서를 얻는다 (' + r.hints.join(',') + ')');
    ok(r.after.every(Boolean) && r.landAfter.indexOf('hyeonmu') >= 0, '사신도가 있으면 열리고, 현무를 그 자리에서 찾는다 ' + JSON.stringify([r.after, r.landAfter]));
    ok(r.afterSell, '사신도를 팔아도 권한은 남는다');
    ok(r.storage && r.restore && r.legacyMissing && r.recordOnly, '자택 보관·실제 저장 복원·필드 없는 옛 저장·획득 기록 호환');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('통과');
  } catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }
  finally { await browser.close(); }
})();
