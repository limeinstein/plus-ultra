/* 제독의 자택 외관·실내: 작위 다섯 단계와 지역별 그림을 확인한다.
   node tests/home_building_smoke.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const GAME = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
function ok(value, message) { if (!value) throw new Error(message); console.log('  ✓ ' + message); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const result = await page.evaluate(async () => {
      G.Game.state = { date: { y: 1480, m: 5, d: 1 }, player: { look: 'admiral', nation: 'PT', home: 7 },
        settings: { res: 0.35 }, court: { titles: {} }, disc: {}, hints: {} };
      const ranks = [0, 1, 3, 5, 7], out = [];
      for (const id of [7, 78, 190, 230, 231, 241]) {
        const city = G.CITY_DATA[id], rows = [];
        for (let tier = 0; tier < 5; tier++) {
          G.Game.state.court.titles.PT = ranks[tier];
          await G.Town.open(city, [{ kind: 'home', name: '자택', icon: 'house' }]);
          const roomKind = G.HomeBuilding.roomKind(tier);
          await G.Img.preload([G.Scenes.city.interiorKeys(roomKind, city, '')], 1500);
          const item = G.Town.runtime().items[0], room = G.Scenes.city.interior('home', city, '');
          rows.push({ tier: G.HomeBuilding.tier(), ext: item.cv.toDataURL().slice(-1000),
            room: room.toDataURL().slice(-1000), width: item.w, door: item.door });
        }
        out.push(rows);
      }
      return out;
    });
    ok(result.every(rows => rows.every((r, i) => r.tier === i)), '평민·유력자·남작·백작·공작급이 5단계에 대응');
    ok(result.every(rows => new Set(rows.map(r => r.ext)).size === 5), '각 지역의 자택 외관 5단계가 서로 다름');
    ok(result.every(rows => new Set(rows.map(r => r.room)).size === 3 && rows[0].room === rows[1].room && rows[3].room === rows[4].room), '각 지역의 자택 실내는 집·저택·궁전 원화를 사용하고 같은 원화에 도형 장식을 덧그리지 않음');
    ok(result.every(rows => rows.every(r => r.door.cx > 0 && r.door.cx < 1 && r.door.foot > 0 && r.door.foot <= 1)), '모든 단계에서 출입문 좌표가 유효');
    ok(new Set(result.map(rows => rows[4].ext)).size === 6, '이베리아·아랍·동아시아·북미 세 양식의 공작급 외관이 서로 다름');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    if (process.env.SHOT) {
      const shot = await page.evaluate(async () => {
        const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 760;
        const ctx = canvas.getContext('2d'), city = G.CITY_DATA[7];
        ctx.fillStyle = '#2a2420'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 5; i++) {
          G.Game.state.court.titles.PT = [0, 1, 3, 5, 7][i];
          await G.Town.open(city, [{ kind: 'home', name: '자택', icon: 'house' }]);
          const ext = G.Town.runtime().items[0].cv;
          const room = G.Scenes.city.interior('home', city, '');
          ctx.fillStyle = '#d4c5a9'; ctx.font = '24px sans-serif'; ctx.fillText(G.HomeBuilding.name(), i * 320 + 16, 38);
          const ew = Math.min(300, ext.width * 250 / ext.height), eh = ext.height * ew / ext.width;
          ctx.drawImage(ext, i * 320 + (320 - ew) / 2, 310 - eh, ew, eh);
          ctx.drawImage(room, i * 320 + 8, 355, 304, 171);
        }
        return canvas.toDataURL('image/png').split(',')[1];
      });
      fs.writeFileSync(path.join(__dirname, '..', 'tmp', 'home-building-preview.png'), Buffer.from(shot, 'base64'));
    }
    await page.evaluate(async () => {
      const skills = {}; G.SKILLS.forEach(skill => { skills[skill.id] = 2; });
      G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 22,
        birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 70 }, sk: skills,
        lg: G.LANGS.map(() => 3), diff: 'normal' });
      const city = G.CITY_DATA[G.Game.state.player.home];
      await G.Town.open(city, G.Scenes.city.buildings(city));
      G.Town.hidden(true);
      G.Game.state.court = G.Game.state.court || { titles: {} };
      G.Game.state.court.titles.PT = 7;
      G.Town.hidden(false);
    });
    await page.waitForFunction(() => G.Town.runtime() && G.Town.runtime().homeTier === 4, null, { timeout: 15000 });
    ok(!errors.length, '같은 도시에서 작위를 받은 직후 거리의 집이 갱신되고 오류가 없음');
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
