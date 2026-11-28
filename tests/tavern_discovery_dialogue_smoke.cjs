/* 술집 사람에게서 실제로 듣고 기록하는 발견물 단서를 점검한다. */
'use strict';
const assert = require('node:assert/strict');
const fs=require('fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.addInitScript(() => {
      localStorage.setItem('pu.lang', 'ko');
      const raf = requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => (cb.name === 'loop'||String(cb).includes('.frameDue(')&&String(cb).includes('.scene.update(')) ? 0 : raf(cb);
    });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(__dirname, '..', 'index.html')).href), { waitUntil: 'commit', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.TavernRumor.clue, null, { timeout: 120000 });
    const report = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, UI = G.UI, R = G.R, TR = G.TavernRumor, T = G.Scenes.city.B.tavern;
      const lis = G.CITY_DATA[0], sev = G.CITY_DATA[7], all = G.DISCOVERIES;
      const said = [], notices = [];
      s.date.y = 1601;
      s.player.fame = 6000;
      s.player.gold = 10000;
      G.Frontier.available = () => true;
      R.lang = () => 3;
      UI.say = async (text, who) => { said.push({ text, who: who && who.name }); };
      UI.toast = (_text, _icon, _ms, record) => { if (record) notices.push(record); };
      G.Game.refreshHud = () => {};
      G.U.chance = () => true;
      G.U.rand = () => 0.1;

      function check(ok, message) { if (!ok) throw new Error(message); }
      function setPool(c, discs) {
        G.DISCOVERIES = discs;
        (s.tavernRumor || (s.tavernRumor = {}))[c.id] = { d: s.day, ids: discs.map(d => d.id) };
      }
      const sea = all.find(d => d.how === 'sea' && d.cat === 'nature' && TR.canTell(d, 'tavern:0') && !TR.isSpecial(d.id));
      const land = G.DISC.pamukkale;
      const trade = G.DISC.t_cacao;
      const building = all.find(d => G.Disc.isBuilding(d) && G.CITY_DATA[d.city] && R.cityExists(G.CITY_DATA[d.city]) && TR.canTell(d, 'mate:test'));
      const hidden = all.find(d => d.tale && d.cat === 'geo') || all.find(d => d.tale);
      check(sea && land && trade && building && hidden, '시험 대상이 있어야 한다');
      check(!TR.canTell(hidden, 'mate:test'), '다른 이야기의 전용 발견은 들을 수 없다');
      check(/뭍에 탐험대/.test(TR.route(lis, land)), '뭍에 가야 하는 발견');
      check(/배로/.test(TR.route(lis, sea)), '배를 타야 하는 발견');
      check(TR.route(lis, building).includes('건물 앞으로'), '거리의 건물은 직접 살핀다');
      const city = G.CITY_DATA[building.city];
      check(TR.route(city, building).includes('이 도시'), '이미 있는 도시의 건물');
      const cacao = TR.route(lis, trade);
      const seller = G.CITY_DATA.find(c => c && cacao.startsWith(c.name + ' 교역소'));
      check(seller && trade.regions.includes(seller.region) && R.cityGoods(seller, 0).includes(trade.good), '카카오 구입처와 발견 지역');
      check(TR.clue(lis, G.DISC.aurora, 'drinker').includes('10월') && TR.clue(lis, G.DISC.aurora, 'drinker').includes('3월'), '오로라 계절');
      const samui = G.DISC.samui, ligor = G.CITY_DATA[161];
      check(samui.lat > ligor.lat && /리골.*북쪽/.test(TR.clue(ligor, samui, 'drinker')) &&
        !/남동쪽/.test(TR.clue(ligor, samui, 'drinker')), '코사무이로 가는 방향');
      const rewritten = TR.clue(lis, trade, 'rival', null, G.RIVAL_STAYS['크리스토발 콜론'].plan.t_cacao);
      check(/씨앗/.test(rewritten) && /카카오/.test(rewritten) && !/해협/.test(rewritten), '콜론의 카카오 계획과 단서 일치');

      setPool(lis, [sea]);
      UI.ask = async () => 1;
      await T.drinker(lis);
      check(G.Disc.hintSrcs(sea.id).join() === 'tavern:0', '술꾼이 전한 대상을 기록한다');
      check(said.some(x => x.who === '술 취한 선원' && x.text.includes(TR.route(lis, sea))), '술꾼의 실제 대화');
      check(notices.at(-1).source.includes('술 취한 선원') && notices.at(-1).body.includes(TR.route(lis, sea)), '들은 위치를 기록한다');
      check(!TR.next(lis) && TR.pool(lis).ids.includes(sea.id), '같은 술집에서 제자리 반복을 하지 않는다');

      setPool(sev, [sea]);
      await T.servant(sev);
      check(G.Disc.hintLv(sea.id) === 2 && said.at(-1).who === '여급' && said.at(-1).text.includes('다른 손님'), '다른 술집 여급이 단서를 겹친다');

      delete s.hints[sea.id];
      const maid = G.MAIDS.find(m => m.city === lis.id) || G.MAIDS[0], maidCity = G.CITY_DATA[maid.city];
      setPool(maidCity, [sea]);
      s.maids[maid.id] = { aff: 70, met: 3 };
      const choices = ['talk', null];
      UI.ask = async () => choices.shift();
      await T.maid(maidCity, maid);
      check(said.at(-1).who === maid.name && G.Disc.hintSrcs(sea.id).includes('tavern:' + maidCity.id), '이름난 여급도 같은 발견을 기록한다');

      delete s.hints[sea.id];
      const m = G.MATES.find(x => Object.keys(x.lg || {}).length && !x.rival);
      const local = G.CITY_DATA.find(c => c.region === sea.reg);
      setPool(local, [sea, hidden]);
      const talks = ['info', 1, 'info', null], before = s.player.gold;
      UI.ask = async () => talks.shift();
      await T.talkMate(local, m, true);
      check(G.Disc.hintSrcs(sea.id)[0] === 'mate:' + m.id, '후보 항해사의 정보 메뉴에서 단서를 받는다');
      check(s.player.gold === before - (15 + (local.size || 1) * 10), '같은 항차에 두 번 결제하지 않는다');
      const line = said.find(x => x.who === m.name && x.text.includes(TR.route(local, sea)));
      check(line && !line.text.includes('내가 직접'), '후보의 대사에는 맞는 경로가 나온다');
      check(notices.at(-1).source.includes(m.name), '후보의 이름을 출처에 적는다');

      G.DISCOVERIES = all;
      const colon = '크리스토발 콜론', plan = ['plan', null];
      T.rivalTarget = () => trade;
      G.SeaFolk.atSeaName = () => false;
      UI.ask = async () => plan.shift();
      await T.rivalTalk(lis, colon);
      check(said.at(-1).who === colon && said.at(-1).text === rewritten &&
        G.Disc.hintSrcs(trade.id).includes('rival'), '경쟁 항해사의 계획과 수첩의 대상이 맞는다');
      const cairo = G.CITY_DATA[79];
      UI.confirm = async () => false;
      await TR.tellSpecial(cairo, { name: '술집 주인' });
      check(said.some(x => x.who === '술집 주인' && /큰 무덤/.test(x.text) && /탐험대/.test(x.text)) &&
        G.Disc.hintSrcs('giza').includes('special:79'), '특별 소문에도 확인할 장소와 같은 발견물이 기록된다');

      s.date.y = 1515;
      const artist = G.MATE[G.DISC.monalisa.by], art = G.Disc.checkPerson(artist.id);
      const seen = [], find = G.Disc.find;
      try {
        UI.ask = async () => null;
        G.Disc.find = async d => { seen.push(d.id); };
        const purse = s.player.gold;
        await T.talkMate(lis, artist, true);
        check(art.length && seen.join() === art.map(d => d.id).join() && purse === s.player.gold, '작가를 만났을 때 본인의 작품을 직접 보여 준다');
      } finally { G.Disc.find = find; s.date.y = 1601; }

      const rows = all.filter(d => !d.bookOnly && !d.tale && !d.song && d.id !== 'circum');
      const malformed = rows.filter(d => {
        const text = TR.clue(lis, d, 'maid');
        return !text.trim() || text.includes('undefined');
      });
      check(!malformed.length, '깨진 단서 ' + malformed.map(d => d.id).join(', '));
      return { formatted: rows.length, example: rewritten.split('\f').pop() };
    });
    fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(path.join(process.env.OUT,'browser-checks.json'),JSON.stringify({...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),report,errors},null,2));
    assert.deepEqual(errors, []);
    console.log('술꾼·여급·항해사·콜론 단서 · ' + report.formatted + '개 출력 점검 · 브라우저 오류 0');
    console.log(report.example);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
