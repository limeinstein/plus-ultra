/* 아르슬란 이야기의 술집 단서와 공용 위치 안내를 파일판에서 점검한다. */
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
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      await G.Arslan.start();
      G.Game.state.settings.res = .35;
      G.Game.go('city', { cityId: G.ARSLAN.home, load: true });
    });

    const count = await page.evaluate(async () => {
      const D = G.ARSLAN, AR = G.Arslan, C = G.Scenes.city, T = C.B.tavern;
      const s = G.Game.state, t = s.arslan, home = G.CITY_DATA[D.home];
      const now = G.U.dayIndex(s.date);
      function check(ok, message) { if (!ok) throw new Error(message); }
      function setRoute(id, age = 0) {
        const b = D.beats.find(b => b.id === id);
        t.beats = Object.fromEntries(b.after.map(id => [id, now - age]));
        t.cool = {};
        t.battleWins = {};
        return b;
      }
      function read(id, c = home) {
        const lead = AR.tavernLeads(c).find(x => x.id === id);
        check(lead, id + ' 단서 없음');
        return lead;
      }
      t.pro = 1;
      check(read('pro_yard').text.includes('이스탄불 조선소') && AR.tavernLeads(home).length === 1, '프롤로그 조선소');
      t.pro = 2;
      check(read('pro_lib').text.includes('이스탄불 도서관'), '프롤로그 도서관');
      t.pro = 3;
      check(read('pro_name').text.includes('이스탄불 항구'), '프롤로그 항구');
      t.prologue = 1;
      const beats = D.beats.filter(b => b.guide);
      check(beats.every(b => D.tavern[b.id]), '수첩에서 볼 수 있는 사건은 모두 술집 단서가 있다');
      for (const b of beats) {
        setRoute(b.id, 1000);
        if (b.battles) {
          check(!AR.tavernLeads(home).some(x => x.id === b.id), '승리 전 후속 단서');
          t.battleWins[b.after[0]] = now;
        }
        const lead = read(b.id);
        if (Array.isArray(b.where)) {
          for (const id of b.where) check(lead.text.includes(G.CITY_DATA[id].name), b.id + ' 도시 누락');
        } else if (b.where === 'away') check(lead.text.includes('이스탄불 밖'), b.id + ' 고향 제외');
        if (b.box) check(/북위|남위/.test(lead.text) && /동경|서경/.test(lead.text), b.id + ' 좌표 누락');
        t.beats[b.id] = now;
        check(!AR.tavernLeads(home).some(x => x.id === b.id), b.id + ' 지난 단서가 재등장함');
      }
      setRoute('r_sche', 2);
      const sche = read('r_sche', G.CITY_DATA[119]);
      check(sche.blocked && /5일.*3일/.test(sche.text) && /도시 밖/.test(sche.text), '셰헤라자드 대기·재입장');
      setRoute('a3_news');
      check(read('a3_news').text.includes('1495년 3월부터'), '신문 날짜');
      setRoute('a4_grain1', 2);
      s.player.gold = 500;
      const grain = read('a4_grain1');
      check(grain.blocked && /800닢/.test(grain.text) && /300닢/.test(grain.text) && /8일 남았/.test(grain.text), '곡물값과 남은 날 동시 안내');
      setRoute('a4_rho_head', 1000);
      t.fleet.rho = 1;
      check(/일반 해전을 3번.*1승/.test(read('a4_rho_head').text), '로도스 해전 승수');
      setRoute('w_aylin', 1000);
      t.cool.w_aylin = now + 4;
      check(read('w_aylin').text.includes('4일 뒤'), '혼약을 미룬 뒤 재시도');
      setRoute('f_offer', 1000);
      check(read('f_offer').text.includes('혼약이 1건'), '종막 혼약 조건');
      setRoute('r_mahina', 1000);
      check(/서경.*또는.*동경/.test(read('r_mahina').text), '날짜 변경선 양쪽');
      const nearSea = { how: 'sea', lon: home.dock[1] + .1, lat: home.dock[0] };
      check(/출항/.test(T.whereText(home, nearSea)) && !/성문/.test(T.whereText(home, nearSea)), '가까운 바다 목표는 배로');
      check(/후원자/.test(T.contractInfo(home, { task: { kind: 'survey', done: true } })), '완료된 측량은 보고로');
      const good = G.R.cityGoods(home, 0)[0], cargo = s.fleet.cargo;
      const procure = { task: { kind: 'procure', good, qty: 8, whereName: '사라진 도시' } };
      try {
        s.fleet.cargo = { [good]: { q: 2 } };
        const suppliers = T.contractInfo(home, procure);
        check(suppliers.includes(home.name) && suppliers.includes('6통') && !suppliers.includes(procure.task.whereName), '지금 살 수 있는 교역소와 부족 수량');
        s.fleet.cargo[good].q = 8;
        check(T.contractInfo(home, procure).includes('후원자'), '조달 완료는 보고로');
      } finally { s.fleet.cargo = cargo; }
      const originalClear = G.LandNav.clear;
      try {
        G.LandNav.clear = () => true;
        check(/성문/.test(T.whereText(home, { how: 'land', lon: home.lon + .1, lat: home.lat })), '이어진 뭍길');
        G.LandNav.clear = () => false;
        check(!/성문/.test(T.whereText(home, { how: 'land', lon: home.lon + .1, lat: home.lat })), '물로 끊긴 뭍길');
      } finally { G.LandNav.clear = originalClear; }
      t.finale = now;
      check(!AR.tavernLeads(home).length, '종막 뒤 술집 단서 종료');
      delete t.finale;
      s.arslan = null;
      check(!AR.tavernLeads(home).length, '기본 항해에는 이야기 단서 없음');
      s.arslan = t;
      return beats.length + D.prologue.stages.length;
    });

    await page.evaluate(() => {
      const s = G.Game.state, t = s.arslan, c = G.CITY_DATA[G.ARSLAN.home], now = G.U.dayIndex(s.date);
      t.beats = { start: now };
      const tavern = G.Scenes.city.B.tavern;
      const item = tavern.menu(c).find(x => x && x.label.includes('〈달무리〉'));
      if (!item) throw new Error('술집 단서 메뉴 없음');
      window.tavernClue = item.onClick();
    });
    await page.getByText('콘야 환전상들이', { exact: false }).waitFor({ timeout: 30000 });
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.getByText('동경 30.3∼36.4도', { exact: false }).waitFor({ timeout: 30000 });
    fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(path.join(process.env.OUT,'browser-checks.json'),JSON.stringify({...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),count,errors},null,2));
    assert.deepEqual(errors, []);
    console.log('술집 단서 ' + count + '개 · 진행 조건과 공용 위치 안내 · 대화 화면 · 브라우저 오류 0');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
