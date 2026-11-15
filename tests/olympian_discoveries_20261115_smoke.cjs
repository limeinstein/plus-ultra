/* 새 발견의 실제 보상 지급·중복 방지·장착 효과·후원자 보고·그림 재생을 함께 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const out = process.env.OUT || path.join(root, 'artifacts/olympian-discoveries-20261115');
const ids = ['pergusa', 'hermescave', 'yria', 'heraion', 'hephaistia', 'aretias', 'vesta'];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const deadline = setTimeout(() => { console.error('검사 제한 시간 초과'); browser.close().catch(() => {}); }, 300000);
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); else if (message.text().startsWith('검사:')) console.log(message.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.addInitScript(() => { window.testRAF = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'index.html')).href));
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const report = await page.evaluate(async ids => {
      function check(value, label) { if (!value) throw Error(label); }
      function near(a, b, label) { check(Math.abs(a-b) < 1e-9, label + ': ' + a + ' / ' + b); }
      G.Scenes.title.exit(); await G.Loader.hide(); G.UI.clearScreen();
      G.State.newGame({ name: '그리스 신화 발견 검사', nation: 'PT', job: 'explorer', age: 28, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [0,1,2,4], diff: 'normal' });
      const s = G.Game.state, R = G.R;
      s.settings.res = .35; s.flags.relicTip = 1;
      window.requestAnimationFrame = window.testRAF;
      await G.Game.ensureGeo();
      const positions = [];
      check(G.OLYMPIAN_DISCOVERIES.length === 7, '일곱 발견 등록');
      for (const id of ids) {
        const d = G.DISC[id];
        check(G.DISCOVERIES.filter(x => x.id === id).length === 1, '발견 ID 중복 없음 ' + id);
        check(d && d.olympian && !d.openY && G.Disc.opened(d), '1480년부터 열림 ' + id);
        check(G.DISC_FACTS[id].length === 3 && G.DISC_FAM[id].length === 4, '특기·가족 대사 ' + id);
        check(G.BOOKS.some(b => b.discs.includes(id)), '서적 단서 ' + id);
        check(G.tasteHit(['faith'], d) && G.tasteHit(['myth'], d), '후원자 관심사 ' + id);
        check(G.RELICS[id].length === 1 && G.RELICS[id][0].id === 'r_'+id, '전용 보상 하나 ' + id);
        if (d.how !== 'city') {
          let reachable = false;
          for (let x=-8; x<=8; x++) for (let y=-8; y<=8; y++) {
            const lon = d.lon+x*d.r/8, lat = d.lat+y*d.r/8;
            if (G.Geo.dist(d.lon,d.lat,lon,lat) <= d.r && G.Geo.isLand(lon,lat) === (d.how === 'land')) reachable = true;
          }
          check(reachable, '탐지 반경 안에 접근 가능한 뭍·바다 ' + id);
        }
        positions.push({ id, lat: d.lat, lon: d.lon, how: d.how });
      }
      check(G.DISC.pergusa.how === 'land' && G.DISC.hermescave.how === 'land', '내륙 호수·동굴은 육상 발견');
      check(G.DISC.aretias.how === 'sea' && G.DISC.vesta.city === 33, '섬은 항해·신전은 로마 시내');
      // 소지품에 들고만 있을 때 선수상의 덕이 켜지면 안 된다.
      s.fleet.crew = 100; s.player.items = ids.map(id => ({ id: 'r_'+id, disc: id }));
      s.fleet.ships.forEach(sh => { sh.fig = null; });
      const baseline = R.dailyUse();
      near(R.supplyUseK(), 1, '미장착 보급 효과 없음');
      const sh = s.fleet.ships[0];
      sh.fig = 'r_pergusa';
      near(R.dailyUse()/baseline, .92, '데메테르 실제 보급 8% 절약');
      near(R.dailyUse(100, { ships: [] }), baseline, '새 함대 초기 보급에 이전 게임의 선수상 효과가 섞이지 않음');
      check(/8%/.test(G.FigFx.plain(G.FIGUREHEAD.r_pergusa)), '보급 효과 글');
      const food = s.fleet.food; s.fleet.food = 100;
      check(R.daysOfFood() === Math.floor(100/R.dailyUse()+1e-6), '항해 가능 일수도 같은 보급 계산');
      s.fleet.food = food;
      const one = s.fleet.ships.slice();
      s.fleet.ships = Array.from({ length: 30 }, () => ({ ...sh, fig: 'r_pergusa' }));
      near(R.supplyUseK(), .8, '보급 중첩 20% 상한');
      s.fleet.ships = one; sh.fig = null;
      const wind = { dir: 0, spd: .8 };
      const oldSpeed = R.shipSpeed(sh, 0, wind, null);
      sh.fig = 'r_hermescave';
      near(R.shipSpeed(sh, 0, wind, null)/oldSpeed, 1.05, '헤르메스 실제 속력 5%');
      sh.fig = 'r_yria'; near(R.fleetBonus('morale')*2, .16, '디오니소스 규율 +0.16/일');
      sh.fig = 'r_vesta'; near(R.fleetBonus('hp'), .05, '헤스티아 피해 경감 5%');
      sh.fig = null;
      s.player.equip.weapon = 'r_aretias'; check(R.atk() === 41, '아레스 착용 공격 41');
      s.player.equip.armor = 'r_hephaistia'; check(R.def() === 41, '헤파이스토스 착용 방어 41');
      check(R.itemStatOf('r_heraion').v === 11 && R.stat('cha') === 71, '헤라 매력 +11');
      check(R.itemStatText('r_heraion') === '매력 +11', '브로치 효과 설명 +11');
      check(R.itemStatOf('pearlnk').v <= G.BALANCE.itemStats.chaMax, '일반 장신구의 보너스 상한 유지');
      s.player.st.cha = 95; check(R.stat('cha') === 100, '매력 전체 상한 유지'); s.player.st.cha = 60;
      s.player.items = s.player.items.filter(it => it.id !== 'r_heraion');
      check(R.stat('cha') === 60, '브로치 없으면 매력 원복');
      s.player.equip.weapon = s.player.equip.armor = null;
      s.player.items = [];
      console.log('검사: 장착·보급·무기·매력 계산 통과');
      // 대화 입력만 생략하고 실제 발견 지급 경로를 실행한다.
      const saved = { say: G.UI.say, toast: G.UI.toast, reveal: G.Scenes.discoveryReveal, card: G.Scenes.discoveryCard,
        voices: G.Scenes.discoveryVoices, news: G.Scenes.city.news, achievementScene: G.Achieve.scene };
      G.UI.say = async () => {}; G.UI.toast = () => {};
      G.Scenes.discoveryReveal = G.Scenes.discoveryCard = G.Scenes.discoveryVoices = G.Scenes.city.news = async () => {};
      G.Achieve.scene = async () => {};   // 업적의 지급은 실행하고 확인 대화만 생략한다.
      const obtained = [];
      try {
        for (const id of ids) {
          const d = G.DISC[id];
          console.log('검사: 발견 경로 ' + id);
          check(await G.Disc.find(d, d.how), '실제 발견 성공 ' + id);
          check(s.player.items.filter(it => it.id === 'r_'+id && it.disc === id).length === 1, '발견 보상 지급 ' + id);
          check(await G.Disc.find(d, d.how) === false, '재발견 중복 지급 차단 ' + id);
          check(s.player.items.filter(it => it.id === 'r_'+id).length === 1, '보상 수량 하나 ' + id);
          const proof = G.Sponsor.submitProof({ id: 'qa_sponsor', taste: ['myth'] }, d);
          check(proof.back.some(it => it.id === 'r_'+id) && !proof.given.length && R.hasItem('r_'+id), '보고 후 보상 보존 ' + id);
          obtained.push({ id, name: d.name, reward: G.ITEM['r_'+id].name });
          console.log('검사: 보상·재발견·보고 통과 ' + id);
        }
      } finally {
        G.UI.say = saved.say; G.UI.toast = saved.toast; G.Scenes.discoveryReveal = saved.reveal;
        G.Scenes.discoveryCard = saved.card; G.Scenes.discoveryVoices = saved.voices; G.Scenes.city.news = saved.news;
        G.Achieve.scene = saved.achievementScene;
      }
      const loaded = [];
      for (const id of ids) {
        for (const key of ['discoveries/'+id, 'discovery-ends/'+id, 'discovery-sheets/'+id, 'map-discoveries/completion/'+id, 'relics/r_'+id]) {
          const im = new Image(); im.src = G.Img.src(key); await im.decode();
          check(im.naturalWidth > 0, '그림 로딩 ' + key); loaded.push(key);
        }
        const d = G.DISC[id], item = G.ITEM['r_'+id];
        check(G.Scenes.hasReveal(d), '발견 연출 연결 ' + id);
        check(G.Img.pick(G.Img.chain.item(item)) === 'relics/r_'+id, '소지품 그림 연결 ' + id);
        if (item.kind === 'fig') check(G.Img.pick(G.Img.chain.figurehead(G.FIGUREHEAD[item.id])) === 'relics/r_'+id, '선수상 그림 연결 ' + id);
        check(G.DiscoveryIcon.key(d) === 'map-discoveries/completion/'+id, '지도 외관 연결 ' + id);
        const sheet = await G.Reel.load(G.Reel.key(d)); check(sheet && sheet.n === 24, '24칸 시트 ' + id);
        const canvas = document.createElement('canvas'); canvas.width = 576; canvas.height = 256;
        await G.Reel.play(canvas, sheet, { ms: 80 }).done;
        check(canvas.getContext('2d').getImageData(288,128,1,1).data[3] === 255, '시트 재생 완료 ' + id);
      }
      G.Info.open('items');
      return { totalDiscoveries: G.DISCOVERIES.length, obtained, positions, images: loaded.length,
        supplyRatio: .92, speedRatio: 1.05, charisma: 11, attack: 41, defense: 41 };
    }, ids);
    console.log('발견 지급·중복 방지·보고 보존·중급 효과·그림 35개·7개 시트 재생 통과');
    await page.waitForSelector('.items-tbl');
    await page.screenshot({ path: path.join(out, 'inventory-runtime.png') });
    await page.keyboard.press('Escape');
    await page.evaluate(() => { G.UI.clearScreen(); G.FX.reveal.titleMs = 1000; window.qaReveal = G.Scenes.discoveryReveal(G.DISC.yria, 123); });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(out, 'discovery-runtime.png') });
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
    const catalog = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    catalog.on('pageerror', error => errors.push(error.message));
    catalog.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await catalog.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({ contentType: 'text/css', body: '' }));
    await catalog.goto((process.env.WEB_BASE ? new URL('catalog.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'catalog.html')).href));
    await catalog.waitForFunction(() => window.G && G.DISC && G.DISC.vesta);
    const catalogRows = await catalog.evaluate(ids => ids.map(id => ({ id, name: G.DISC[id].name, reward: !!G.RELIC['r_'+id], art: !!G.IMAGE_FILES['discoveries/'+id] })), ids);
    assert(catalogRows.every(row => row.reward && row.art));
    assert.deepEqual(errors, [], '페이지·콘솔 오류 없음');
    fs.writeFileSync(path.join(out, 'browser-check.json'), JSON.stringify({ ...report, catalog: catalogRows, errors }, null, 2)+'\n');
    console.log('file:// 게임·도감 등록 및 콘솔 오류 0건');
  } finally { clearTimeout(deadline); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
