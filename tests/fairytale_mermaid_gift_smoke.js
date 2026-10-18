/* 인어공주의 몸짓 말 · 처음 말을 익힌 날 · 옛이야기 아가씨들 능력 · 이성 부하 선물 = 충성 — node tests/fairytale_mermaid_gift_smoke.js */
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|fonts|ERR_FILE/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Tale && G.MateTalk && G.Cabins, null, { timeout: 90000 });
  const out = await page.evaluate(async () => {
    const rows = []; const ok = (v, s) => rows.push((v ? '✓ ' : '✗ ') + s);
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    G.State.newGame({ name: '선물 시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    const s = G.Game.state, R = G.R, MM = G.MATE.little_mermaid, SW = G.MATE.snow_white, SH = G.MATE.scheherazade;
    // 능력
    rows.push('  능력 ' + ['MM','SW','SH'].map(k => JSON.stringify({MM,SW,SH}[k].sk)).join(' / '));
    ok(MM.sk.music === 3 && MM.sk.nav === 3 && MM.sk.survey === 3 && MM.sk.ops === 3 && MM.sk.craft === 1 && !(MM.sk.cook > 0) && !Object.keys(MM.lg).some(k => MM.lg[k] > 0), '인어공주: 음악·항해·측량·운용 3, 세공 1, 말 없음');
    ok(['cook', 'craft', 'music', 'speech', 'acct'].every(k => SW.sk[k] === 3), '백설공주: 요리·세공·음악·웅변·회계 3');
    const eu = [0, 1, 2, 3, 4], as = [5, 6, 7, 8, 9, 12, 13, 14];
    ok(eu.concat(as).every(i => SH.lg[i] >= 2 && SH.lg[i] <= 3) && ['speech', 'acct', 'sci'].every(k => SH.sk[k] === 3), '셰헤라자드: 유럽·아시아 말 모두 2~3, 웅변·회계·과학 3');
    // 몸짓 말
    const m = G.Legend.join('little_mermaid', null);
    ok(!!m && G.Tale.mute(), '인어공주가 배에 올랐고 아직 말을 못 한다');
    const say = async (text, who) => { const p = G.UI.say(text, who); await sleep(80); const b = document.querySelector('.dlg .body'); const r = { html: b ? b.innerHTML : '', text: b ? b.innerText : '' }; document.querySelector('.modal-back').click(); await sleep(260); document.querySelector('.modal-back') && document.querySelector('.modal-back').click(); await p; return r; };
    const r1 = await say('고마워요, 제독! 정말 기뻐요.', G.Tale.speaker('little_mermaid'));
    ok(/class="mime"/.test(r1.html) && /두 손을 모아/.test(r1.text) && /손짓으로 미루어 보면/.test(r1.text), '말을 못 하면 대사가 몸짓으로: ' + r1.text.replace(/\n/g, ' / '));
    const r2 = await say('또 무슨 이야기를 할까요?', G.Scenes.mateSpeaker(m.role));   // 이름만 있는 화자(부하와 이야기 등)
    ok(/갸웃/.test(r2.text), '부하 화자로 물어도 몸짓 (' + r2.text.replace(/\n/g, ' / ') + ')');
    const r3 = await say('(바다를 가리키고 웃는다.)', G.Tale.speaker('little_mermaid'));
    ok(!/mime/.test(r3.html) && /바다를 가리키고/.test(r3.text), '이미 몸짓으로 쓴 줄은 그대로');
    const r4 = await say('고마워요.', G.Tale.speaker('snow_white'));
    ok(!/mime/.test(r4.html), '다른 사람의 말은 그대로');
    // 한배 사람들에게서 말을 익힌다 (제독의 말 90일)
    let first = null, days = 0;
    for (; days < 120 && G.Tale.mute(); days++) { const o = G.Cabins.daily(); const f = o.find(x => /처음으로 말을/.test(x.text)); if (f) first = f.text; }
    ok(!!first && !G.Tale.mute() && days >= 85 && days <= 95, days + '일 만에 처음 말을 했다: ' + first);
    const r5 = await say('고마워요, 제독!', G.Tale.speaker('little_mermaid'));
    ok(!/mime/.test(r5.html) && /고마워요, 제독/.test(r5.text), '말을 익힌 뒤에는 말로');
    // 선물: 이성 부하는 충성이 선물 값만큼
    const gift = async (mate, itemId) => {
      s.player.items.push({ id: itemId });
      const seq = ['gift', null]; const ask0 = G.UI.ask, ch0 = G.UI.choose, say0 = G.UI.say;
      let shown = null;
      G.UI.ask = async (t, opts) => { if (shown == null) shown = opts.map(o => o && o.label).filter(Boolean); const v = seq.length ? seq.shift() : null; return v === 'gift' && shown.indexOf('선물한다') < 0 ? null : v; };
      G.UI.choose = async () => 0; G.UI.say = async () => {};
      const lo0 = mate.loyal; try { await G.MateTalk.talk(G.CITY_DATA[0], mate); } finally { G.UI.ask = ask0; G.UI.choose = ch0; G.UI.say = say0; }
      return { d: mate.loyal - lo0, shown };
    };
    m.loyal = 60; const g1 = await gift(m, 'perfume');
    ok(g1.d === 5, '남자 제독 → 여성 부하에게 향수: 충성 +' + g1.d + ' (예전 +2)');
    const male = G.MATES.find(x => x.g !== 'f' && x.fame >= 0 && !s.mates.some(y => y.id === x.id));
    const mm = G.Legend.join(male.id, null); mm.loyal = 60;
    const g2 = await gift(mm, 'pearlnk');
    ok(g2.d === 0 && g2.shown.indexOf('선물한다') < 0, '남자 제독 → 남자 부하: 선물 고르는 줄 없음');
    s.player.g = 'f'; s.player.items = s.player.items.filter(it => it.id !== 'pearlnk');
    const g3 = await gift(mm, 'pearlnk');
    ok(g3.d === 12 && g3.shown.indexOf('선물한다') >= 0, '여자 제독 → 남자 부하(' + male.name + ')에게 진주 목걸이: 충성 +' + g3.d);
    m.loyal = 60; const g4 = await gift(m, 'ribbon');
    ok(g4.d === 2, '여자 제독 → 여성 부하(같은 성): 예전처럼 +2');
    return rows;
  });
  console.log(out.join('\n'));
  console.log(errors.slice(0, 8).join('\n') || '✓ 콘솔 오류 없음');
  await browser.close();
  process.exitCode = out.some(x => x[0] === '✗') || errors.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
