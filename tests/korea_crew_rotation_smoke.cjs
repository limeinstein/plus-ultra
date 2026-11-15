/* 조선 여성 20명의 특기 수, 3년 주기 추첨, 고용·저장, 전용 초상을 실제 file:// 게임에서 확인한다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const out = process.env.OUT || path.join(root, 'artifacts/korea-crew-20261115');

(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined),
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const errors = [];
    const page = await browser.newPage({viewport: {width: 960, height: 640}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({contentType: 'text/css', body: ''}));
    await page.addInitScript(() => {window.requestAnimationFrame = () => 0;});
    await page.goto((process.env.WEB_BASE ? new URL('index.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'index.html')).href), {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.KoreaCrew && G.Game && G.Game.sceneName === 'title', null, {timeout: 120000});
    const result = await page.evaluate(async () => {
      function check(ok, label) {if (!ok) throw Error(label);}
      const s = G.Game.state = G.State.newGame({name: '조선 항해사 시험', nation: 'PT', job: 'explorer', age: 30,
        birth: {m: 1, d: 1}, st: {str: 65, int: 65, mar: 65, cha: 65}, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal'});
      Object.assign(s.settings, {res: .35, sound: 0, music: 0});
      s.seed = 67271; s.player.fame = 10000; s.player.gold = 500000; s.flags.prologue = true;
      const crew = G.MATES.filter(m => m.koreaRotation), ids = crew.map(m => m.id);
      const korea = G.MATE_ZONES.korea.ids, tavern = G.Scenes.city.B.tavern;
      const selection = y => crew.filter(m => G.Frontier.mateReady(m, y)).map(m => m.id);
      const candidates = () => korea.flatMap(cid => tavern.candidates(G.CITY_DATA[cid]).filter(m => m.koreaRotation).map(m => m.id));
      check(crew.length === 20 && new Set(ids).size === 20 && new Set(crew.map(m => m.name)).size === 20, '서로 다른 동료 20명');
      const skills = [];
      for (const m of crew) {
        const entries = Object.entries(m.sk), n = entries.length, old = +m.no <= 10;
        check(old ? n === 5 : n >= 2 && n <= 3, m.name + ' 특기 수 ' + n);
        check(entries.every(([k, v]) => G.SKILL_BY_ID[k] && Number.isInteger(v) && v >= 1 && v <= 3), m.name + ' 특기·단계');
        check(new Set(entries.map(([,v]) => v)).size > 1, m.name + ' 특기 단계 차이');
        check(m.lg[14] === 3, m.name + ' 언어는 특기와 별도');
        check(G.MATE[m.id] === m && m.g === 'f' && !G.MatePower.why(m), m.name + ' 일반 고용 가능');
        check(G.MateMove.range(m.id).every(cid => korea.includes(cid)), m.name + ' 조선 안의 이동 범위');
        for (const [key, width, height] of [[m.face, 512, 512], [m.face + '_half', 1024, 1536]]) {
          const image = await G.Img.load(key), face = G.PORTRAIT_FACES[key];
          check(image && image.naturalWidth === width && image.naturalHeight === height, '실제 초상 크기 ' + key);
          check(face && face.box[2] > 0 && face.box[3] > 0, '리그 얼굴 자리 ' + key);
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 1);
          check(ctx.getImageData(0, 0, 1, 1).data[3] < 8, '투명 배경 ' + key);
        }
        check(G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(m.id))) === m.face &&
          G.Img.pick(G.Img.chain.mateHalf(m.id)) === m.face + '_half', m.name + ' 같은 인물의 얼굴·무릎상');
        skills.push({id: m.id, name: m.name, no: m.no, skills: {...m.sk}, languages: {...m.lg}});
      }
      const before = JSON.stringify(crew.map(m => m.sk));
      G.MateSkills.boostAll();
      check(JSON.stringify(crew.map(m => m.sk)) === before, '공통 보강이 지정 특기 수·단계를 바꾸지 않음');
      const borrowed = G.Wander.facePool('kr', 'f', 'nav', 'KR');
      check(!borrowed.some(key => crew.some(m => m.face === key)), '일반 철새에게 전용 얼굴을 빌려주지 않음');
      s.date.y = 1479; s.mateLoc = Object.fromEntries(ids.map(id => [id, 190]));
      s.mateRumorStay = Object.fromEntries(ids.map(id => [id, {city: 190, until: s.day + 59, any: true}]));
      check(!selection(1479).length && !candidates().length && !G.MateMove.where(ids[0]), '시작 전 명단·옛 위치·소문 정리');
      check(!Object.keys(s.mateRumorStay).some(id => ids.includes(id)), '쉬는 동료의 소문 체류 제거');
      s.capRoster = {y: null, seq: 0, gen: {}, prom: {}, out: {}, seen: Object.fromEntries(ids.map(id => [id, 1459]))};
      G.Captains.newYear();
      check(ids.every(id => s.capRoster.seen[id] == null && !s.capRoster.prom[id] && !s.flags['gone_' + id]), '미등장 기간을 실업으로 세어 바다 선장으로 빼지 않음');
      const periods = [], cycles = [];
      for (let epoch = 1480; epoch <= 1660; epoch += 60) {
        const cycle = [];
        for (let y = epoch; y < epoch + 60; y += 3) {
          s.date.y = y;
          const batch = selection(y);
          check(batch.length === 1 && selection(y + 2).join() === batch.join(), y + '년부터 3년간 한 명');
          check(candidates().join() === batch.join(), y + '년 실제 조선 술집 명단');
          check(!tavern.candidates(G.CITY_DATA[175]).some(m => m.koreaRotation) &&
            !tavern.candidates(G.CITY_DATA[191]).some(m => m.koreaRotation), '조선 밖에 나타나지 않음');
          check(!G.MateMove.where(ids.find(id => id !== batch[0])), '추첨되지 않은 후보의 행방 제외');
          cycle.push(batch[0]); periods.push({from: y, to: y + 2, id: batch[0], name: G.MATE[batch[0]].name});
        }
        check(new Set(cycle).size === 20, epoch + '년부터 60년간 스무 명 중복 없이 등장');
        cycles.push(cycle.join());
      }
      check(new Set(cycles).size === 4, '60년 묶음마다 순서 갱신');
      s.date.y = 1480;
      const first = selection(1480)[0];
      for (let n = 0; n < 12; n++) G.MateMove.month();
      check(selection(1480)[0] === first && candidates().join() === first, '도시 이동·반복 조회로 재추첨하지 않음');
      window.__krQA = {first, periods};
      return {skills, periods, cycles: cycles.length};
    });
    await page.evaluate(async () => {if (G.Loader) await G.Loader.hide();});
    for (const [group, label] of [['first', 'five-skills'], ['new', 'two-three-skills']]) {
      await page.evaluate(group => {
        const data = window.__krQA;
        const entry = data.periods.find(p => group === 'first' ? +G.MATE[p.id].no <= 10 : +G.MATE[p.id].no > 10);
        G.Game.state.date.y = entry.from;
        const m = G.MATE[entry.id], city = G.MateMove.where(m.id), tavern = G.Scenes.city.B.tavern;
        const card = tavern._mateCard(m, city);
        if (!card.textContent.includes(entry.from + '~' + entry.to + '년')) throw Error('인물 카드의 실제 등장 기간');
        window.__krCard = G.UI.window({title: m.name + ' — 항해사 후보', width: 820, parch: false, html: '<div class="hire-card parch"></div>'});
        window.__krCard.content.firstElementChild.appendChild(card);
      }, group);
      await page.waitForTimeout(300);
      await page.screenshot({path: path.join(out, label + '.png')});
      await page.evaluate(() => window.__krCard.close(null));
    }
    const hiring = await page.evaluate(async () => {
      function check(ok, label) {if (!ok) throw Error(label);}
      let s = G.Game.state;
      const crew = G.MATES.filter(m => m.koreaRotation), ids = crew.map(m => m.id), data = window.__krQA;
      const tavern = G.Scenes.city.B.tavern, selection = y => crew.filter(m => G.Frontier.mateReady(m, y)).map(m => m.id).join();
      const candidates = () => G.MATE_ZONES.korea.ids.flatMap(cid => tavern.candidates(G.CITY_DATA[cid]).filter(m => m.koreaRotation).map(m => m.id));
      s.date.y = 1480;
      const m = G.MATE[data.first], city = G.MateMove.where(m.id), baseSkills = JSON.stringify(m.sk);
      G.UI.confirm = async () => true; G.UI.say = async () => {}; G.UI.window = () => ({result: Promise.resolve(1)});
      check(!await tavern.hireMate(city, crew.find(d => d.id !== m.id)), '명단 밖 직접 고용 차단');
      s.flags['gone_' + m.id] = true;
      check(!await tavern.hireMate(city, m), '떠난 동료 직접 고용 차단');
      delete s.flags['gone_' + m.id];
      check(await tavern.hireMate(city, m) && !candidates().includes(m.id), '실제 고용·명단 제외');
      check(!await tavern.hireMate(city, m), '중복 고용 차단');
      const kept = s.mates.find(x => x.id === m.id); kept.loyal = 87;
      s.date.y = 1483;
      check(s.mates.includes(kept) && kept.loyal === 87 && candidates().length === 1 && !G.MateMove.where(m.id), '3년 뒤 고용 동료 유지·새 후보 한 명');
      check(JSON.stringify(m.sk) === baseSkills, '고용·등장 교체 후 지정 특기 유지');
      s.mates = s.mates.filter(x => x.id !== m.id); s.mateDismiss = {[m.id]: {available: true}};
      check(!G.MateDismiss.returning(m.id), '기간 밖 해고 동료 미등장');
      s.date.y = 1482;
      check(G.MateDismiss.returning(m.id) && candidates().includes(m.id), '같은 기간에는 재고용 가능');
      s.mates.push(kept); delete s.mateDismiss[m.id]; s.date.y = 1480;
      const seed = s.seed;
      delete s.seed; delete s.mateLoc;
      const legacy = selection(1480);
      check(ids.includes(legacy) && selection(1482) === legacy && candidates().length === (legacy === m.id ? 0 : 1), '난수·주기 필드가 없는 옛 저장');
      s.seed = seed;
      check(selection(1480) === data.first, '난수 복원 후 같은 명단');
      const saved = await G.State.saveAsync(1); check(saved.ok, '저장 성공');
      const different = [];
      for (let seed = 1; seed <= 8; seed++) {s.seed = seed; different.push(selection(1480));}
      check(new Set(different).size > 1, '저장별 무작위 순서');
      s = G.Game.state = await G.State.loadAsync(1);
      check(selection(1480) === data.first && s.mates.some(x => x.id === m.id && x.loyal === 87) && !candidates().includes(m.id), '저장 복원 후 같은 명단·고용 상태');
      s.date.y = 1479;
      check(!await tavern.hireMate(city, m), '시작 전 직접 고용 차단');
      return '고용·중복 방지·기간 변경·해고 후 복귀·옛 저장·저장 복원 통과';
    });
    await page.goto((process.env.WEB_BASE ? new URL('catalog.html', process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'catalog.html')).href), {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.KoreaCrew && document.readyState === 'complete', null, {timeout: 90000});
    assert(await page.evaluate(() => G.KoreaCrew.periodText() === '1480년부터 3년마다 20명 중 1명 등장' &&
      G.MATES.filter(m => m.koreaRotation).every(m => Object.keys(m.sk).length === (+m.no <= 10 ? 5 : +m.no === 12 || +m.no === 15 || +m.no === 17 || +m.no === 20 ? 2 : 3))));
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({...result, hiring, errors}, null, 2));
    console.log('통과 — 20명·전용 초상 40장·첫 10명 특기 5개·새 10명 특기 2~3개, 4묶음·80개 기간, ' + hiring + ', 게임·도감 콘솔 오류 0건');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
