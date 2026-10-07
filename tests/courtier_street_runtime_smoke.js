/* 왕실 신하 서임 그림과 20개 지역 보행 주민의 실제 브라우저 연결을 점검한다. */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(os.tmpdir(), 'courtier_street_runtime');
function ok(value, message) { if (!value) throw new Error(message); console.log('  ✓ ' + message); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(message.text())) errors.push(message.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Court && G.StreetFolk && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(skill => { sk[skill.id] = 0; });
      G.Game.state = G.State.newGame({ name: '그림 시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 4, d: 12 },
        st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
    });
    const coverage = await page.evaluate(async () => {
      const ids = Object.values(G.COURT.realms).flatMap(realm => realm.sponsors);
      const courtiers = ids.map(id => {
        const who = G.Court.courtier(G.SPONSOR[id]);
        return { id, face: G.Img.pick(G.Art.portraitKeys(who.portrait)), half: G.Img.pick(who.half), name: who.name };
      });
      const styles = G.Art.NPC_STYLES.map(style => {
        const city = G.CITY_DATA.find(c => G.Img.folkStyle(c) === style);
        const folk = G.StreetFolk.make('man', city, 5000, 1000, 768, 'art:' + style);
        return { style, city: city.name, frames: folk.frames && folk.frames.length,
          face: G.Img.pick(G.Art.portraitKeys(folk.face.portrait)), half: G.Img.pick(folk.face.half) };
      });
      await Promise.all(styles.flatMap(row => Array.from({ length: 8 }, (_, i) => G.Img.load('street-folk/man_' + row.style + '/walk_' + (i + 1)))));
      return { courtiers, styles };
    });
    ok(coverage.courtiers.length === 22 && new Set(coverage.courtiers.map(x => x.face)).size === 22 && coverage.courtiers.every(x => /portraits\/courtiers\/.+/.test(x.face) && /_half$/.test(x.half)), '군주 22명마다 서로 다른 전속 신하 얼굴·무릎상');
    ok(coverage.styles.length === 20 && coverage.styles.every(x => x.frames === 8 && x.face === 'portraits/npc-roles/' + x.style + '/native' && x.half === x.face + '_half'), '20개 지역 주민의 보행 8장과 같은 사람 얼굴·무릎상');

    await page.evaluate(() => G.Game.go('city', { cityId: 0 }));
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Town.active(), null, { timeout: 60000 });
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      const st = G.Town.runtime(), c = G.CITY_DATA[0], folk = G.StreetFolk.make('man', c, st.streetW, st.hero.x, st.ground, 'runtime');
      folk.x = st.hero.x + 360; folk.target = folk.x; folk.state = 'walk'; folk.dir = 1;
      const list = G.Town.folks(); list.splice(0, list.length, folk);
      for (let i = 0; i < 30; i++) G.Town.update(1 / 30);
    });
    await page.screenshot({ path: path.join(OUT, 'regional-walker.png') });
    await page.evaluate(() => { window.__courtierDlg = G.UI.say('국왕의 이름으로 작위 수여 교서를 읽는 전속 신하입니다.', G.Court.courtier(G.SPONSOR.pt_king)); });
    await page.waitForSelector('.dlg-actor.tall', { timeout: 10000 });
    await page.waitForTimeout(700);
    const actor = await page.locator('.dlg-actor.tall').count();
    await page.screenshot({ path: path.join(OUT, 'courtier-investiture.png') });
    // 마을 사람·신하도 제독과 마주 선 무릎상 대화(9a14aea) — 서 있는 사람 가운데 왕실 신하의 무릎상이 있으면 된다
    const courtierTall = await page.evaluate(() => Array.from(document.querySelectorAll('.dlg-actor.tall img')).some(e => /portraits\/courtiers\/[^/]+_half/.test(e.src)));
    ok(actor >= 1 && courtierTall, '서임 장면에서 왕실 신하 무릎상이 크게 표시됨 (서 있는 사람 ' + actor + ')');
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } finally { await browser.close(); }
})().catch(error => { console.error('✗', error.message); process.exitCode = 1; });
