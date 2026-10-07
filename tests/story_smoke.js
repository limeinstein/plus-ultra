/* 이야기 모드 「아버지의 사진」 점검 (js/data/story.js · js/systems/story.js) — node tests/story_smoke.js   (BROWSER_EXE=크롬 경로)
   - 타이틀에 「이야기 — 아버지의 사진」 단추
   - 시작: 마테우스(포르투갈·하얀 남방의 항해사)·동료 셋과 자리·사진·남작과의 알함브라 계약·단서(알함브라·첫 흔적)
   - 프롤로그 대사가 오류 없이 흐른다 (대화창은 저절로 넘김)
   - 흔적 일곱을 차례로 찾으면 장면·기억·다음 단서, 한양 편지 → 아틀란티스 사슬 단서·멈춘 시계, 아틀란티스 → 끝
   - 순서: 앞의 흔적을 찾기 전에는 다음 흔적이 도시에서 보이지 않는다
   - 보통 항해(이야기 아님)에서는 흔적·동료 셋·남작이 나오지 않는다
   - 수첩 「아버지의 사진」 쪽이 그려진다. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const GAME = pathToFileURL(path.join(__dirname, '..', process.env.PAGE || 'index.html')).href;
let passed = 0;
function ok(v, msg) { if (!v) throw new Error(msg); passed++; console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const title = await page.evaluate(() => Array.from(document.querySelectorAll('.title-menu .btn')).map(b => b.textContent.trim()));
    ok(title.some(t => /아버지의 사진/.test(t)), '타이틀 단추: ' + title.join(' · '));

    // 대화창은 저절로 넘기고, 고를 것은 첫 것으로
    await page.evaluate(() => {
      const UI = G.UI; window.SAID = [];
      UI.say = async (t, who) => { SAID.push((who && who.name || '') + ': ' + String(t).slice(0, 40)); };
      UI.ask = async (t, opts) => opts[0].value;
      UI.alert = async () => {}; UI.fade = async (fn) => { fn && fn(); };
      UI.window = (o) => ({ result: Promise.resolve(o.buttons ? o.buttons[o.buttons.length - 1].value : null), el: document.createElement('div'), content: document.createElement('div') });
    });
    await page.evaluate(async () => { await G.Game.ensureGeo(); G.Story.start(); G.Game.go('city', { cityId: 0, story: true }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state && G.Game.state.story && G.Game.state.story.prologue, null, { timeout: 90000 });
    const a = await page.evaluate(() => {
      const s = G.Game.state;
      return { name: s.player.name, nation: s.player.nation, look: s.player.look, mates: s.mates.map(m => m.id + ':' + m.role), ship: s.fleet.ships[0].name,
        contract: s.contract && s.contract.disc + '@' + s.contract.sponsor, hints: Object.keys(s.hints), photo: s.player.items.some(it => it.id === 'photo'),
        said: SAID.length, who: Array.from(new Set(SAID.map(x => x.split(':')[0]))), gold: s.player.gold, rocco: s.mates.some(m => m.id === 'rocco'),
        half: G.Img.chain.mateHalf('giacomo')[0], face: G.Img.pick(G.Art.mateSpec('giacomo').img || []) };
    });
    ok(a.name === '마테우스 다 코스타' && a.nation === 'PT' && a.look === 'navigator_white', '제독: ' + a.name + ' · ' + a.nation + ' · ' + a.look);
    ok(a.mates.length === 3 && a.mates.join().includes('giacomo:first') && a.mates.join().includes('anselmo:surveyor') && a.mates.join().includes('estevao:nav') && !a.rocco, '동료: ' + a.mates.join(' · '));
    ok(a.face === 'portraits/player/casanova' && a.half === 'characters/player_half_casanova', '자코모의 얼굴·무릎상 = 카사노바 그림');
    ok(a.ship === '도나 레오노르' && a.photo, '배 「' + a.ship + '」 · 사진을 지님');
    ok(a.contract === 'alhambra@pt_casanova' && a.hints.includes('alhambra') && a.hints.includes('ft_granada'), '남작과 알함브라 계약 · 단서 ' + a.hints.join(','));
    ok(a.said > 25 && a.who.includes('레오노르 다 코스타') && a.who.includes('자코모 카사노바') && a.who.includes('조반니 카사노바 남작'), '프롤로그 대사 ' + a.said + '줄 — ' + a.who.join('·'));

    // 흔적을 차례로
    const b = await page.evaluate(async () => {
      const s = G.Game.state, D = G.Disc, out = { steps: [] };
      G.Scenes.discoveryCard = async () => {}; if (G.Names) G.Names.offer = async () => {};   // 발견 카드·이름 짓기 창은 건너뛴다
      const traces = G.STORY.traces.map(t => t[0]);
      out.cairoBefore = D.checkCity(79).some(d => d.id === 'ft_cairo');          // 아직 단서 없음 → 안 보임
      out.granadaSeen = D.checkCity(10).some(d => d.id === 'ft_granada');
      for (const id of traces) {
        const d = G.DISC[id]; SAID.length = 0;
        const seen = D.checkCity(d.city).some(x => x.id === id);
        await D.find(d, 'city');
        out.steps.push({ id, seen, said: SAID.length, found: D.foundByMe(id), hints: Object.keys(s.hints).filter(h => /^ft_|knossos|gibraltar|timaeus/.test(h)) });
      }
      out.watch = s.player.items.some(it => it.id === 'watch'); out.letter = !!s.story.letter;
      out.found = s.story.found.slice();
      SAID.length = 0;
      await D.find(G.DISC.atlantis, 'sea');
      out.end = s.story.end; out.endSaid = SAID.slice(); out.watchDesc = (s.player.items.filter(it => it.id === 'watch')[0] || {}).desc;
      return out;
    });
    ok(!b.cairoBefore && b.granadaSeen, '그라나다 흔적은 보이고, 카이로 흔적은 단서 없이는 안 보인다');
    b.steps.forEach((st, i) => {
      const next = G_next(i);
      ok(st.seen && st.found && st.said >= 5 && (!next || st.hints.includes(next)), st.id + ': 장면 ' + st.said + '줄 · 다음 단서 ' + (next || '(아틀란티스 사슬)') + ' → ' + st.hints.join(','));
    });
    function G_next(i) { const T = ['ft_granada', 'ft_cairo', 'ft_delhi', 'ft_cuzco', 'ft_hangzhou', 'ft_sakai', 'ft_hanyang']; return T[i + 1] || null; }
    ok(b.steps[6].hints.includes('knossos') && b.steps[6].hints.includes('gibraltar') && b.steps[6].hints.includes('timaeus') && b.watch && b.letter, '한양 편지 → 크노소스·지브롤터·『티마이오스』 단서, 멈춘 시계');
    ok(b.end === 'done' && b.endSaid.some(x => /김도현/.test(x)) && /다시 돌기/.test(b.watchDesc), '아틀란티스 → 아버지와의 만남 · 끝 (' + b.endSaid.length + '줄)');

    // 수첩 쪽
    const pg = await page.evaluate(() => { const el = document.createElement('div'); G.Story.page(el); return el.textContent; });
    ok(/아버지의 흔적/.test(pg) && /찾음/.test(pg) && /편지/.test(pg), '수첩 「아버지의 사진」 쪽이 그려진다');

    // 보통 항해에서는 나오지 않는다
    const c = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; }); const lg = G.LANGS.map(() => 0); lg[1] = 3;
      const s = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg, diff: 'normal' });
      G.Game.state = s;
      return { story: !!s.story, avail: G.Disc.available(G.DISC.ft_granada), hint: G.Disc.addHint('ft_granada', 'tavern:0'), hinted: !!s.hints.ft_granada,
        mate: G.Frontier.mateReady(G.MATE.giacomo, 1480), baron: G.Sponsor.present(G.SPONSOR.pt_casanova), rocco: s.mates.some(m => m.id === 'rocco'),
        cap: G.Captains && G.Captains.natOfMate ? true : true };
    });
    ok(!c.story && !c.avail && !c.hint && !c.hinted && !c.mate && !c.baron && c.rocco, '보통 항해: 흔적·동료 셋·남작이 나오지 않고 로코가 부관');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
    console.log('통과 ' + passed);
  } catch (e) { console.log('실패: ' + e.message); if (errors.length) console.log(errors.join('\n')); process.exitCode = 1; }
  await browser.close();
})();
