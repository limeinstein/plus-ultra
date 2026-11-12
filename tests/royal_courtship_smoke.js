/* 다섯 왕녀의 무도회·구출·궁정 재회와 저장 호환을 파일 실행판에서 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--allow-file-access-from-files', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.resolve(__dirname, '../index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.RoyalCourtship && G.Ball && G.Game);
    await page.evaluate(async () => {
      function check(v, message) { if (!v) throw Error(message); }
      await G.Game.ensureGeo();
      const s = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 30,
        birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      s.settings.res = 0.35; s.settings.autosave = false;
      const start = G.State.serialize(), rc = G.RoyalCourtship, ui = G.UI;
      const ladies = G.COURT.princesses.filter(p => p.courtship);
      check(ladies.length === 5, '대상 왕녀 5명');
      const oldAsk = ui.ask, messages = [];
      ui.say = async (t, who) => { messages.push([t, who]); };
      ui.confirm = async () => true; ui.alert = async () => {}; ui.fade = async cb => cb();
      let answer = 'meet', selected;
      ui.ask = async (t, options) => options.some(o => o.value === answer) ? answer : options[0].value;
      const pick = G.U.pick, chance = G.U.chance, cfg = G.BALANCE.royalCourtship;
      G.U.pick = pool => pool.some(x => x && x.courtship) ? (pool.find(x => x.id === selected) || pool[0]) : pick(pool);
      let draw = true;
      G.U.chance = n => n === cfg.ballChance ? draw : chance(n);
      function visit(p) {
        const sp = G.SPONSOR[G.COURT.realms[p.realm].sponsors[0]];
        return G.Scenes.city.B.palace.menu(G.CITY_DATA[sp.city], sp.id).find(m => m && m.label === p.name + ' 만나기');
      }
      for (const p of ladies) {
        selected = p.id;
        const who = G.EventShot.princessSpeaker(p.realm, p.name);
        check(G.Img.pick(G.Art.portraitKeys(who.portrait)) === p.face && G.Img.pick(who.half) === p.half, p.name + ' 초상');
        for (const [key, w, h] of [[p.face,512,512],[p.half,1024,1536]]) {
          const img = await G.Img.load(key);
          check(img && img.naturalWidth === w && img.naturalHeight === h, key + ' 해독');
        }
        check(!visit(p), '초면에는 왕궁 만남 없음');
        await rc.ball();
        check(visit(p) && visit(p).dim && s.player.royalTies[p.id].stage === 'invited', p.name + ' 무도회 약속');
      }
      let state = G.Game.state = G.State.deserialize(G.State.serialize());
      const [pt, es, fr, ot, kr] = ladies;
      state.day += cfg.visitDays;
      answer = 'lover'; await visit(pt).onClick();
      check(visit(pt).sub.includes('일') && !state.player.wife && rc.info().includes(pt.name + ' · 연인'), '연인으로 저장');
      answer = 'friend'; await visit(es).onClick();
      check(state.player.royalTies[es.id].stage === 'friend', '친구 선택');
      answer = 'later'; await visit(fr).onClick();
      check(state.player.royalTies[fr.id].stage === 'invited' && visit(fr).dim, '고백 보류');
      state.day += cfg.visitDays;
      selected = fr.id; answer = 'lover'; await rc.ball();
      check(state.player.royalTies[fr.id].stage === 'lover', '무도회 재회에서 연인');
      await visit(es).onClick();
      check(state.player.royalTies[es.id].stage === 'friend', '친구에게 고백 강요 없음');
      await visit(pt).onClick();
      check(messages.some(([t]) => t === pt.courtship.date), '연인 재회');
      state = G.Game.state = G.State.deserialize(G.State.serialize());
      check(state.player.royalTies[pt.id].stage === 'lover' && state.player.royalTies[es.id].stage === 'friend', '관계 불러오기');
      state = G.Game.state = G.State.deserialize(start);
      check(!rc.info() && !visit(ot), '왕녀 기록이 없는 저장');
      draw = false; await rc.ball(); check(!state.player.royalTies, '손님 없는 추첨');
      draw = true; selected = ot.id; answer = 'leave'; await rc.ball(); check(!state.player.royalTies, '처음에 사양');
      const sp = G.SPONSOR.kr_king, c = G.Court.state();
      c.task = { kind: 'rescue', who: kr.name, sp: sp.id, realm: 'KR', stage: 0, ships: 2, den: 191, cat: 'bt', fame: 200, title: '왕녀 구출' };
      selected = kr.id; messages.length = 0; await rc.ball();
      check(!messages.some(([,w]) => w && w.name === kr.name), '구출 중에는 무도회에 오지 않음');
      G.Court.afterBattle({ court: 'rescue', kind: 'pirate' }, 'win', [], []);
      check(c.task.stage === 1, '해전에서 왕녀 구출');
      answer = 'meet'; await G.Court.report(sp);
      check(!c.task && messages.some(([t]) => t === kr.courtship.rescue) && visit(kr).dim && c.titles.KR === 1, '정순옹주 귀환·서임·재회 약속');
      state.day += cfg.visitDays; answer = 'lover'; await visit(kr).onClick();
      check(rc.info().includes(kr.name + ' · 연인'), '구출로 맺은 인연');
      // 자택의 실제 무도회 메뉴와 후속 무작위 손님 연결.
      const home = G.CITY_DATA[state.player.home];
      state.player.gold = 100000; selected = ot.id; answer = 'meet';
      G.Ball.forceWitch = 'none';
      await G.Scenes.city.B.home.menu(home).find(x => x && x.label === '무도회를 연다').onClick();
      check(state.player.royalTies[ot.id].stage === 'invited', '무도회 메뉴로 첫 만남');
      ui.ask = oldAsk; G.U.pick = pick; G.U.chance = chance;
      state.day += cfg.visitDays;
      window.royalVisit = visit(ot).onClick();
    });
    const confess = page.getByRole('button', { name: '나도 같은 마음이라고 고백한다' });
    await confess.waitFor({ timeout: 10000 });
    await confess.dispatchEvent('click');
    await page.evaluate(async () => { await window.royalVisit; G.Info.open('admiral'); });
    await page.getByText(/아이셰 술탄 · 연인/).last().waitFor();
    assert.deepEqual(errors, []);
    console.log('5개국 초상 10장 · 구출 왕명 · 무도회 첫 만남과 재회 · 궁정 방문 · 연인/친구/보류 · 저장 호환 통과. 콘솔 오류 0.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
