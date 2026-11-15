/* 유럽 철새 30명의 1487년·10년 배정·40년 반복, 지역·고용 제외·저장 복원을 실제 게임에서 검사한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const out = process.env.OUT || path.join(root, 'artifacts/windsalt-crew-20261115');

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const errors = [];
    const page = await browser.newPage({viewport: {width: 960, height: 640}});
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({contentType: 'text/css', body: ''}));
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'index.html')).href), {waitUntil: 'domcontentloaded'});
    assert.deepEqual(errors, [], '게임 자료 초기화 오류');
    await page.waitForFunction(() => window.G && G.WindsaltCrew && G.Game && G.Game.sceneName === 'title', null, {timeout: 120000});
    const result = await page.evaluate(async () => {
      function check(ok, message) { if (!ok) throw Error(message); }
      const params = {name: '유럽 철새 시험', nation: 'PT', job: 'explorer', age: 25, birth: {m: 1, d: 1},
        st: {str: 65, int: 65, mar: 65, cha: 65}, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal'};
      function fresh(seed, year) {
        const s = G.Game.state = G.State.newGame(params);
        s.seed = seed; s.date.y = year; s.settings.res = 0.35;
        s.player.fame = 100000; s.player.gold = 500000; s.flags.prologue = true;
        return s;
      }
      const crew = G.MATES.filter(m => m.windsaltRotation), ids = crew.map(m => m.id);
      const tavern = G.Scenes.city.B.tavern;
      const select = y => crew.filter(m => G.Frontier.mateReady(m, y)).map(m => m.id);
      const cities = [...new Set(ids.flatMap(id => G.MateMove.range(id)))];
      const candidates = () => cities.flatMap(id => tavern.candidates(G.CITY_DATA[id]).filter(m => m.windsaltRotation).map(m => m.id)).sort();
      check(crew.length === 30 && new Set(ids).size === 30 && new Set(crew.map(m => m.name)).size === 30, '서로 다른 30명');
      const nations = {PT:8,EN:8,ES:7,NL:7};
      const regions = {PT:[0,1,84,86,87],EN:[38,39,40,41,42],ES:[2,3,4,5,6,7,8,9,10,11,12,13,88],NL:[24]};
      const skillCounts = {}, languageCounts = {};
      for (const nat of Object.keys(nations)) check(crew.filter(m => m.nat === nat).length === nations[nat], nat + ' 국적 인원');
      for (const m of crew) {
        check(m.g === 'm' && !G.MatePower.why(m), '고용할 수 있는 남성 철새 ' + m.id);
        check(!!nations[m.nat], '네 나라 국적만 허용 ' + m.id);
        const sk = Object.entries(m.sk), lg = Object.entries(m.lg);
        check(sk.length >= 3 && sk.length <= 6 && sk.every(([id,lv]) => G.SKILL_BY_ID[id] && lv >= 2 && lv <= 3), '특기 3~6개·2~3단계 ' + m.id);
        check(lg.length >= 3 && lg.length <= 5 && lg.every(([id,lv]) => G.LANGS[id] && lv >= 2 && lv <= 3), '언어 3~5개·2~3단계 ' + m.id);
        check(m.lg[m.nat === 'PT' ? 1 : m.nat === 'ES' ? 0 : 3] === 3, '모국어 능숙 ' + m.id);
        skillCounts[sk.length] = (skillCounts[sk.length] || 0) + 1;
        languageCounts[lg.length] = (languageCounts[lg.length] || 0) + 1;
        const range = G.MateMove.range(m.id);
        check(range.length && range.includes(m.home) && range.every(id => regions[m.nat].includes(id)), '국적에 맞는 도시 안에서만 이동 ' + m.id);
        for (const key of [m.face, m.halfKey]) {
          check(!!G.PORTRAIT_FACES[key], '얼굴 자리 ' + key);
          const im = await G.Img.load(key);
          check(im && im.naturalWidth === (key.endsWith('_half') ? 1024 : 512) &&
            im.naturalHeight === (key.endsWith('_half') ? 1536 : 512), '실제 원화 규격 ' + key);
        }
        check(G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(m.id))) === m.face &&
          G.Img.pick(G.Img.chain.mateHalf(m.id)) === m.halfKey, '얼굴·무릎 같은 인물 ' + m.id);
      }
      check(!['ib','ne'].flatMap(style => G.Wander.facePool(style, 'm', 'nav', 'PT')).some(key => crew.some(m => m.face === key)), '일반 철새와 전용 얼굴 분리');
      let s = fresh(67271, 1486);
      s.mateLoc = Object.fromEntries(ids.map(id => [id, 0]));
      check(!select(1486).length && !candidates().length && !s.windsaltCrew, '1487년 전 미등장·추첨 없음');
      s = fresh(67271,1487);
      const oldActive = select(1487);
      for (const cityId of [44,23,43,175]) {
        s.mateLoc = Object.fromEntries(oldActive.map(id => [id,cityId]));
        s.mateRumorStay = Object.fromEntries(oldActive.map(id => [id,{city:cityId,until:s.day+20,any:true}]));
        for (const id of oldActive) {
          const at = G.MateMove.where(id);
          check(at && regions[G.MATE[id].nat].includes(at.id) && !s.mateRumorStay[id], '옛 저장의 지역 밖 위치·체류 수정 ' + id);
        }
        check(!tavern.candidates(G.CITY_DATA[cityId]).some(m => m.windsaltRotation), '독일·벨기에·아일랜드·해외 모집 차단 ' + cityId);
      }
      const schedules = [], cycleOrders = [];
      for (let epoch = 1487; epoch <= 1687; epoch += 40) {
        const whole = [];
        for (let slot = 0; slot < 4; slot++) {
          const y = epoch + slot * 10; s.date.y = y;
          const batch = select(y);
          check(batch.length === (slot === 3 ? 0 : 10), y + '년의 10명·휴식');
          check(select(y+9).join(',') === batch.join(','), y + '년부터 열 해 고정 명단');
          check(candidates().join(',') === batch.slice().sort().join(','), y + '년 실제 지역 술집 명단');
          check(!tavern.candidates(G.CITY_DATA[175]).some(m => m.windsaltRotation), '해당 지역 밖 미등장');
          check(G.MateKnow.wanderers().filter(m => m.windsaltRotation).length === batch.length, '수첩 철새 명단과 일치');
          schedules.push({from:y,to:y+9,names:batch.map(id => G.MATE[id].name)});
          whole.push(...batch);
        }
        check(whole.length === 30 && new Set(whole).size === 30, epoch + '년 묶음에서 각 한 번');
        cycleOrders.push(whole.join(','));
      }
      check(new Set(cycleOrders).size === cycleOrders.length, '40년마다 새로운 순서');
      const seeds = [];
      for (let seed=1;seed<=8;seed++) { fresh(seed,1487); seeds.push(select(1487).join(',')); }
      check(new Set(seeds).size === 8, '게임별 다른 추첨');
      s = fresh(67271,1487);
      const first = select(1487), snapshot = JSON.stringify(s.windsaltCrew);
      for (let i=0;i<100;i++) G.U.rand();
      check(select(1496).join(',') === first.join(',') && JSON.stringify(s.windsaltCrew) === snapshot, '다른 난수 소비로 명단이 바뀌지 않음');
      const m = G.MATE[first[0]], city = G.MateMove.where(m.id);
      check(G.MateMove.hear(m.id,city.id) === G.BALANCE.wander.rumorStayDays, '행방을 들은 전용 철새 체류');
      s.day++;
      check(G.MateMove.hear(m.id,city.id) === G.BALANCE.wander.rumorStayDays-1, '같은 소식으로 체류 연장 없음');
      check(tavern._mateCard(m,city).textContent.includes('1487~1496년'), '인물 카드에 모집 기간');
      if (G.Loader) await G.Loader.hide();
      window.__wsQA = G.UI.window({title:m.name+' — 항해사 후보',width:820,parch:false,html:'<div class="hire-card parch"></div>'});
      window.__wsQA.content.firstElementChild.appendChild(tavern._mateCard(m,city));
      window.__wsTest = {params,first,snapshot,id:m.id,city:city.id};
      return {characters:crew.length,nations,regions,skillCounts,languageCounts,portraits:60,cycles:cycleOrders.length,schedules,seeds};
    });
    await page.screenshot({path:path.join(out,'recruit-card.png')});
    const hiring = await page.evaluate(async () => {
      function check(ok,message) { if (!ok) throw Error(message); }
      window.__wsQA.close(null);
      const data=window.__wsTest, crew=G.MATES.filter(m=>m.windsaltRotation), ids=crew.map(m=>m.id), T=G.Scenes.city.B.tavern;
      const select=y=>crew.filter(m=>G.Frontier.mateReady(m,y)).map(m=>m.id);
      let s=G.Game.state; const m=G.MATE[data.id], city=G.CITY_DATA[data.city];
      G.UI.confirm=async()=>true; G.UI.say=async()=>{}; G.UI.window=()=>({result:Promise.resolve(1)});
      check(!await T.hireMate(city,crew.find(d=>!G.Frontier.mateReady(d))), '추첨되지 않은 인물 직접 고용 차단');
      check(!await T.hireMate(G.CITY_DATA[175],m), '지역 밖 직접 고용 차단');
      check(await T.hireMate(city,m) && !await T.hireMate(city,m), '실제 고용·중복 고용 차단');
      const kept=s.mates.find(x=>x.id===m.id);
      kept.loyal=100;
      check(Object.entries(m.sk).every(([id,lv])=>G.R.mateSkill(kept,id)===lv) && Object.entries(m.lg).every(([id,lv])=>G.R.mateLang(kept,id)===lv), '고용한 동료의 실제 특기·언어 적용');
      check(select(1487).length===9 && data.first.filter(id=>id!==m.id).join(',')===select(1487).join(','), '고용 후 새 후보 보충 없음');
      check(JSON.stringify(s.windsaltCrew)===data.snapshot, '고용 후 추첨 순서 고정');
      s.mates=s.mates.filter(x=>x.id!==m.id); s.mateDismiss={[m.id]:{available:true}};
      check(G.MateDismiss.returning(m.id), '같은 모집 기간의 해고 동료 복귀');
      s.date.y=1497; check(!G.MateDismiss.returning(m.id), '기간 밖 재고용 차단');
      s.date.y=1487; s.mates.push(kept); delete s.mateDismiss[m.id];
      check((await G.State.saveAsync(1)).ok, '저장 성공');
      s.date.y=1497; check(select(1497).length===10 && !G.MateMove.where(m.id) && s.mates.includes(kept), '다음 열 해에도 고용 동료 유지');
      s.date.y=1517; check(!select(1517).length && s.mates.includes(kept) && !Object.keys(G.MateMove.locs()).some(id=>ids.includes(id)), '휴식 기간 모집·위치 정리와 동료 유지');
      const counts=[];
      for (const y of [1527,1537,1547,1557]) { s.date.y=y; counts.push(select(y).length); }
      check(counts.join(',')==='10,10,9,0' && s.windsaltCrew.order.length===29 && !s.windsaltCrew.order.includes(m.id), '다음 40년 추첨에서 고용 인물 제외·29명 배정');
      s=G.Game.state=await G.State.loadAsync(1);
      check(JSON.stringify(s.windsaltCrew)===data.snapshot && s.mates.some(x=>x.id===m.id) && select(1487).join(',')===data.first.filter(id=>id!==m.id).join(','), '실제 저장 복원 뒤 명단·고용 상태 유지');
      delete s.windsaltCrew; delete s.seed;
      const legacy=select(1487).join(',');
      check(select(1487).length===10 && !select(1487).includes(m.id) && select(1496).join(',')===legacy, '전용 필드·시작 난수가 없는 옛 저장');
      s.mates=crew.map(d=>({id:d.id,role:'none'})); s.date.y=1567;
      check(!select(1567).length && s.mates.length===30, '모두 고용한 경우 새 등장 없음·동료 보존');
      return {saved:true,nextCycleCounts:counts,legacy:true,noDuplicates:true};
    });
    await page.goto((process.env.WEB_BASE ? new URL('catalog.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root,'catalog.html')).href),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.G&&G.WindsaltCrew&&document.readyState==='complete',null,{timeout:90000});
    assert(await page.evaluate(()=>G.WindsaltCrew.periodText().includes('40년')&&G.MATES.filter(m=>m.windsaltRotation).length===30));
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...result,hiring,errors},null,2));
    console.log('통과 — 30명·60장·4개국 한정·특기 3~6개·언어 3~5개, 6개 40년 주기·24개 기간, 게임별 무작위·고용 제외·휴식·저장 복원·옛 위치 수정, 게임·도감 콘솔 오류 0건');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
