/* 지역 문화·현재 정세·언어·실제 거리 그림과 대화 회귀 검사. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/streetculture-20261103');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.addInitScript(() => { requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.StreetCulture && G.Game.sceneName === 'title', null, { polling: 100 });
    const report = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = G.State.newGame({ name: '거리 주민 검사', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 },
        st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: Array(20).fill(3), diff: 'normal' });
      s.settings.res = .35; s.settings.autosave = false; s.flags.prologue = true;
      const SC = G.StreetCulture, SF = G.StreetFolk, check = (v, msg) => { if (!v) throw Error(msg); };
      const city = name => G.CITY_DATA.find(c => c.name === name), kr = city('한양'), cn = city('북경');
      const dates = [{ y: 1480, m: 1, d: 1 }, { y: 1592, m: 6, d: 1 }, { y: 1644, m: 6, d: 7 }];
      const regions = new Set(); let samples = 0, minLines = Infinity;
      for (const date of dates) {
        s.date = date;
        for (const c of G.CITY_DATA) {
          regions.add(SC.region(c));
          for (const type of SF.types(c).filter(t => !G.STREET_FOLK.types[t].animal)) {
            const f = SF.make(type, c, 2500, 800, 768, 'coverage:' + c.id + ':' + type);
            SC.attach(f, c, 0);
            const lines = SC.localLines(f, c), context = SC.context(f, c);
            minLines = Math.min(minLines, lines.length);
            check(lines.length > 0 && context.length > 0, '대사 없음: ' + c.name + '/' + type);
            check(lines.concat(context).every(l => l.text && !/\{city\}|undefined|NaN/.test(l.text)), '대사 치환: ' + c.name);
            if (type === 'boy' || type === 'girl') check(lines.every(l => l.group === 'role' || l.group === 'region'), '아이에게 성인의 도시 회고를 배정하지 않음');
            check(f.face.name === f.name, '거리·대화 호칭 일치'); samples++;
          }
        }
      }
      check(regions.size === 13, '13개 고장 구분: ' + [...regions]);
      check(minLines >= 9, '모든 도시·역할에 상시 대사 9개 이상');
      const d = G.STREET_FOLK, counts = {
        regional: Object.values(d.cultures).reduce((n, p) => n + p.lines.length, 0),
        role: Object.values(d.cultureRoleLines).reduce((n, p) => n + p.length, 0),
        city: Object.values(d.cultureCityLines).reduce((n, p) => n + p.length, 0)
      };
      check(counts.regional + counts.role + counts.city >= 220, '상시 대사 220개 이상');
      for (const c of G.CITY_DATA.filter(c => d.cultureCityLines[c.id])) {
        const local = SF.make('woman', c, 2500, 800, 768, 'focus:' + c.id);
        const all = SC.localLines(local, c), context = SC.context(local, c), seen = [];
        for (let i = 0; i < all.length + context.length; i++) seen.push(SC.next(local, c));
        check(new Set(seen.map(e => e.id)).size === seen.length, '도시 대사까지 모두 듣기 전 반복 없음: ' + c.name);
        const culture = seen.filter(e => e.id.startsWith('culture:'));
        check(culture[0].group === 'city' && culture[1].group === 'region' && culture[2].group === 'role', '도시·고장·역할 대사를 번갈아 들음: ' + c.name);
      }
      check(SC.region(city('잔지바르')) === 'sw', '동아프리카 해안');
      check(SC.region(city('이스탄불')) === 'islam', '이슬람 문화');
      check(G.CITY_DATA.filter(c => c.style === 'tr' && c.region === 10).every(c => ['na', 'az', 'an'].includes(SC.region(c))), '아메리카 열대 마을의 문화');
      check(G.CITY_DATA.filter(c => c.region === 10).every(c => !G.Art.folkCulture(c).afr), '아메리카 코드 그림은 아프리카로 분류하지 않음');
      const f = SF.make('elder', kr, 2500, 800, 768, 'history');
      s.date = { y: 1592, m: 5, d: 22 };
      check(!SC.context(f, kr).some(l => l.id === 'local:0'), '왜란 시작 전 대사 차단');
      s.date.d = 23; check(SC.context(f, kr).some(l => l.id === 'local:0'), '왜란 시작일 대사');
      s.date = { y: 1599, m: 1, d: 1 };
      check(!SC.context(f, kr).some(l => l.id === 'local:0') && SC.context(f, kr).some(l => l.id === 'local:1'), '왜란 뒤 재건');
      s.date = { y: 1644, m: 6, d: 5 }; check(!SC.context(f, cn).some(l => l.id === 'local:6'), '청 입관 전 차단');
      s.date.d = 6; check(SC.context(f, cn).some(l => l.id === 'local:6'), '청 입관일');
      s.date = { y: 1637, m: 1, d: 8 }; check(!SC.context(f, kr).some(l => l.id === 'local:3'), '게임 양력 남한산성 소식 전 차단');
      s.date.d = 9; check(SC.context(f, kr).some(l => l.id === 'local:3'), '게임 양력 남한산성 소식');
      s.date = { y: 1637, m: 2, d: 24 }; s.horan = { end: 'avoided' };
      check(!SC.context(f, kr).some(l => l.id === 'local:4') && SC.context(f, kr).some(l => l.id === 'local:7' && l.mood === 'proud'), '플레이어의 병자호란 평화 결말');
      delete s.horan;
      s.date = { y: 1480, m: 1, d: 1 };
      check(!SC.localLines(f, kr).some(l => /황진이/.test(l.text)), '황진이 시조의 시기 제한');
      s.conquests = { [kr.id]: { owner: '포르투갈' } };
      check(SC.region(kr) === 'kr' && SC.context(f, kr).some(l => /포르투갈/.test(l.text) && l.id.startsWith('conquest:')), '점령 후 현지 문화와 실제 주인');
      delete s.conquests[kr.id];
      const oldActive = G.Econ.activeAt;
      try {
        G.Econ.activeAt = () => [{ id: 'test', type: 'bumper', at: kr.id, why: '곳간에 곡식이 넉넉하다' }];
        check(SC.context(f, kr).some(l => l.id === 'economy:test' && l.mood === 'happy'), '풍년의 기쁨');
        G.Econ.activeAt = () => [{ id: 'test', type: 'plague', at: kr.id, why: '돌림병이 번지고 있다' }];
        check(SC.next(f, kr).mood === 'worry', '역병의 걱정 우선');
        const responses = ['boy', 'merchant', 'soldier'].map(type => SC.context({ type }, kr).find(e => e.id === 'economy:test').text);
        check(new Set(responses).size === responses.length && responses.every(t => t.includes('돌림병')), '같은 실제 소식을 아이·상인·병사가 각자의 처지로 반응');
      } finally { G.Econ.activeAt = oldActive; }
      const future = { y: 1500, m: 8, d: 2, text: '한양의 검사 소식이 전해졌다.' };
      G.HISTORY.push(future);
      try {
        s.date = { y: 1500, m: 8, d: 1 }; check(!SC.context(f, kr).some(l => l.text.includes(future.text)), '미래 역사 차단');
        s.date.d = 2; check(SC.context(f, kr).some(l => l.text.includes(future.text)), '역사 당일 소식');
      } finally { G.HISTORY.pop(); }
      s.date = { y: 1480, m: 1, d: 1 };
      const friend = SF.make('girl', kr, 2500, 800, 768, 'rotation'), pool = SC.localLines(friend, kr).length + SC.context(friend, kr).length;
      const ids = Array.from({ length: pool }, () => SC.next(friend, kr).id);
      check(new Set(ids).size === pool, '전부 듣기 전에 같은 이야기 반복 없음');
      const savedSay = G.UI.say, savedRumor = G.EventRumor.pick, savedFest = G.Fest.line;
      const spoken = [];
      try {
        G.UI.say = async (text, sp) => spoken.push({ text, name: sp.name }); G.EventRumor.pick = () => null; G.Fest.line = () => null;
        const man = SF.make('boy', kr, 2500, 800, 768, 'talk'); SC.attach(man, kr, 0);
        await SF.talk(man, kr); await SF.talk(man, kr); await SF.talk(man, kr);
        check(man.used && /척|선원/.test(spoken[1].text), '두 번째 대화에서 기존의 실용 정보');
        const animal = SF.make('cat', kr, 2500, 800, 768, 'pet'); await SF.talk(animal, kr);
        check(animal.cultureTalks == null && animal.face.noFace, '짐승의 기존 대화 유지');
        const deaf = SF.make('girl', kr, 2500, 800, 768, 'deaf');
        s.player.lg = []; await SF.talk(deaf, kr); check(deaf.cultureTalks == null && !deaf.used, '말이 안 통하면 정보를 아낌');
      } finally { G.UI.say = savedSay; G.EventRumor.pick = savedRumor; G.Fest.line = savedFest; s.player.lg = Array(20).fill(3); }
      window.streetCultureReport = { samples, regions: [...regions], counts, minLines, spoken };
      return window.streetCultureReport;
    });
    console.log(JSON.stringify(report, null, 2));
    const images = await page.evaluate(async () => {
      const out = [], names = ['한양', '북경', '캘리컷', '이스탄불', '잔지바르', '테노치티틀란', '쿠스코', '암스테르담'];
      G.Game.showLayers(false, false, true); G.UI.clearScreen(); await G.Loader.hide();
      for (const name of names) {
        const c = G.CITY_DATA.find(c => c.name === name), s = G.Game.state;
        s.date = { y: name === '한양' ? 1592 : 1644, m: 6, d: 7 }; s.loc = { mode: 'city', city: c.id };
        await G.Town.open(c, [{ kind: 'trade', name: '교역소', icon: 'scales' }, { kind: 'market', name: '시장', icon: 'sack' }]);
        const st = G.Town.runtime(); st.cam = st.camTo = Math.max(0, (st.streetW - 1600) / 2); st.hero.x = st.cam + 300;
        st.folks = ['elder', 'woman', 'merchant'].map((type, i) => {
          const f = G.StreetFolk.make(type, c, st.streetW, st.cam + 650 + i * 260, 768, 'visual:' + c.id + i);
          G.StreetCulture.attach(f, c, i); f.state = 'walk'; f.target = f.x + 100; f.v = 40; return f;
        });
        await Promise.all(st.folks.flatMap(f => f.frames ? [G.Img.resolve([f.frames[0].k])] : []));
        G.StreetCulture.update(st.folks, 2.1, st.cam);
        if (!st.folks.some(f => f.bubble)) throw Error('거리 말풍선 없음: ' + name);
        st.hover = st.folks[0]; st.dirty = true; G.Town.update(0);
        out.push({ name, url: G.Game.canvases().scene.toDataURL('image/jpeg', .9) });
      }
      return out;
    });
    for (const im of images) fs.writeFileSync(path.join(OUT, im.name + '.jpg'), Buffer.from(im.url.split(',')[1], 'base64'));
    const atlas = await page.evaluate(async rows => {
      const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 1100; const ctx = cv.getContext('2d');
      ctx.fillStyle = '#211d19'; ctx.fillRect(0, 0, cv.width, cv.height);
      for (let i = 0; i < rows.length; i++) {
        const img = new Image(); img.src = rows[i].url; await img.decode();
        const x = (i % 2) * 800, y = Math.floor(i / 2) * 275;
        ctx.drawImage(img, 250, 420, 1300, 480, x, y + 30, 800, 240);
        ctx.fillStyle = '#f5e2b7'; ctx.font = '20px sans-serif'; ctx.fillText(rows[i].name, x + 18, y + 24);
      }
      return cv.toDataURL('image/jpeg', .9);
    }, images);
    fs.writeFileSync(path.join(OUT, 'regional-streets.jpg'), Buffer.from(atlas.split(',')[1], 'base64'));
    await page.evaluate(async () => {
      const st = G.Town.runtime(); G.UI.clearScreen();
      await G.Loader.hide(); window.streetCultureChat = G.StreetFolk.talk(st.folks[0], st.city);
    });
    await page.waitForSelector('.dlg', { state: 'visible' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, 'dialogue.png') });
    assert.deepEqual(errors, [], '페이지·콘솔 오류 0');
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ ...report, errors }, null, 2));
    console.log('지역 13곳·날짜 경계·점령·풍년·역병·대화·거리 8곳 검증, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
