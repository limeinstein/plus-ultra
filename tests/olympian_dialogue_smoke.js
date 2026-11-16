/* 올림포스 사도 · 초대받지 못한 사도 — 대사 정비 (2026-11-16)
   대사가 [말하는 이, 대사] 묶음인지, 만남 → 시험 → 승선이 그 묶음을 차례로 들려주는지, 소문이 붙는지 본다.
   node tests/olympian_dialogue_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, 'index.html')).href), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const OP = G.OlympianApostles, E = G.OLYMPIAN_APOSTLE_EVENTS, roster = G.OLYMPIAN_APOSTLES, out = {}, said = [];
      const FIELDS = ['intro', 'greet', 'dare', 'win', 'lose', 'join', 'wait', 'again'];
      // 꼴: 모든 마디가 [말하는 이, 대사] 묶음 · 말하는 이는 정해진 것만 · 마디마다 열두 사도가 서로 다른 말
      const okWho = w => w === null || w === 'A' || w === 'P' || w === 'first' || /^apostle_/.test(w);
      out.shape = roster.every(a => FIELDS.every(f => Array.isArray(E[a.slug][f]) && E[a.slug][f].length && E[a.slug][f].every(l => Array.isArray(l) && okWho(l[0]) && typeof l[1] === 'string' && l[1].length > 4)));
      out.distinct = FIELDS.every(f => new Set(roster.map(a => E[a.slug][f].map(l => l[1]).join('|'))).size === 12);
      out.player = roster.filter(a => FIELDS.some(f => E[a.slug][f].some(l => l[0] === 'P'))).length;
      // 신의 상징이 대사에 들어 있다
      const SYM = { hera: /맹세|석류|공작/, demeter: /딸|이삭|씨앗|곡창/, hestia: /화로|불씨/, aphrodite: /거품|장미|거울/, artemis: /사슴|달|사냥/, athena: /올빼미|올리브|지략/,
        zeus: /번개|독수리|참나무|손님/, poseidon: /파도|삼지창|말/, apollo: /리라|해|델포이/, ares: /창|전우|용기/, hephaestus: /망치|모루|렘노스|쇠/, hermes: /편지|길|훔치/ };
      out.symbols = roster.filter(a => !SYM[a.slug].test(FIELDS.map(f => E[a.slug][f].map(l => l[1]).join(' ')).join(' '))).map(a => a.slug).join();
      // 만남 흐름 — 대사를 모으며 일기토 사도 하나를 끝까지
      const s0 = {}; G.SKILLS.forEach(x => { s0[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk: s0, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; s.mates = [];
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      let pick = 'try';
      G.UI.ask = async (q, opts) => { out.lastAsk = opts.map(o => o.label).join(' / '); return opts.some(x => x.value === pick) ? pick : opts[opts.length - 1].value; };
      G.UI.toast = () => {};
      G.FamEv.showPic = () => null;
      const zeus = roster.find(a => a.slug === 'zeus'), d = G.DISC[zeus.discovery];
      s.disc[zeus.discovery] = { me: true, found: true }; OP.afterFind(d);
      out.liveBefore = (G.EVENT_RUMORS || []).filter(x => /^ol_/.test(x.id) && x.live(s)).map(x => x.id).join();
      const c = OP.city(zeus); s.loc = { mode: 'land', lon: c.lon, lat: c.lat, party: 36, base: { type: 'city', city: c.id, lon: c.lon, lat: c.lat }, days: 0 };
      // 진다 → lose · 하루 뒤 다시 · 이긴다 → win → 승선
      G.Games.duel = async () => 'lose';
      await OP.meet(zeus.id);
      out.meet1 = { intro: said.some(t => t.startsWith('|') && /번개가 할퀸/.test(t)), greet: said.some(t => t.startsWith('레온티오스|') && /손님/.test(t)), me: said.some(t => t.startsWith('주앙|') && /친절하군/.test(t)), lose: said.some(t => /천둥에 놀라/.test(t)), label: /「번개의 결투」에 도전한다 \(일기토\)/.test(out.lastAsk), log: (s.log || []).some(x => /레온티오스/.test(x.t || '')) };
      said.length = 0; s.day += 2; pick = 'try';
      G.Games.duel = async () => 'win';
      const ask0 = G.UI.ask; G.UI.ask = async (q, opts) => opts.some(x => x.value === 'try') ? 'try' : opts.some(x => x.value === 'hire') ? 'hire' : opts[opts.length - 1].value;
      await OP.meet(zeus.id);
      out.meet2 = { noIntro: !said.some(t => /번개가 할퀸/.test(t)), win: said.some(t => /호령보다 판단이 먼저/.test(t)), join: said.some(t => /깨진 맹세 위에 번개/.test(t)), hired: s.mates.some(m => m.id === zeus.id) };
      // 미룸 → wait · 다시 오면 again
      const hera = roster.find(a => a.slug === 'hera'); s.disc[hera.discovery] = { me: true, found: true }; OP.afterFind(G.DISC[hera.discovery]);
      const hc = OP.city(hera); s.loc = { mode: 'land', lon: hc.lon, lat: hc.lat, party: 36, base: { type: 'city', city: hc.id, lon: hc.lon, lat: hc.lat }, days: 0 };
      said.length = 0; G.UI.ask = async (q, opts) => opts.some(x => x.value === 'try') ? 'try' : 'later';
      G.Games.duel = async () => 'win'; const navalStart = OP.startNaval; OP.startNaval = a => { OP._navalFor = a.id; };
      await OP.meet(hera.id); out.navalCalled = OP._navalFor === hera.id;
      OP.startNaval = navalStart;
      // 해전 결과를 흉내 낸다 — 연습 해전에서 이겼고 고용은 미룬다
      s.olympianNaval = { id: hera.id, loc: JSON.parse(JSON.stringify(s.loc)), crew: s.fleet.crew };
      const go0 = G.Game.go; G.Game.go = async () => {};
      await OP.finishNaval({ olympianTrial: hera.id }, 'win');
      out.hera = { win: said.some(t => /공작은 꼬리를 펼 때/.test(t)), wait: said.some(t => /석류가 익기 전에/.test(t)), passed: !!s.olympianApostles[hera.id].passed, hired: s.mates.some(m => m.id === hera.id) };
      said.length = 0; s.day += 5; G.UI.ask = async (q, opts) => opts.some(x => x.value === 'hire') ? 'hire' : 'try';
      await OP.meet(hera.id);
      out.hera2 = { again: said.some(t => /맹세하러 온 것이오/.test(t)), join: said.some(t => /맨 윗줄/.test(t)), hired: s.mates.some(m => m.id === hera.id) };
      G.Game.go = go0;
      // 배에 탄 다른 사도 줄 · 없는 사람 줄은 건너뛴다
      said.length = 0;
      await OP.say(hera, [['apostle_zeus', '함께 탄 사도의 말'], ['apostle_ares', '아직 타지 않은 사도의 말'], [null, '해설']]);
      out.voice = { aboard: said.some(t => t.startsWith('레온티오스|함께 탄')), skipped: !said.some(t => /아직 타지 않은/.test(t)), narr: said.some(t => t === '|해설') };
      // 옛 꼴(문자열) 대사도 읽는다
      said.length = 0; await OP.say(hera, '옛 꼴의 한 줄'); out.legacy = said[0] === '칼리스테|옛 꼴의 한 줄';
      // 소문 — 성소를 찾고 아직 동료가 아닐 때만
      const R0 = (G.EVENT_RUMORS || []).filter(x => /^ol_/.test(x.id)); out.rumors = R0.length;
      out.rumorLive = R0.filter(x => x.live(s)).map(x => x.id).join();
      // 초대받지 못한 사도 — 제독의 대사 · 상징
      const UE = G.UNINVITED_APOSTLE_EVENTS;
      out.uninv = { me: ['two', 'reconciliation'].every(k => UE[k].lines.some(l => l[0] === 'P')), hestia: UE.covenant.lines.some(l => /화로의 여신/.test(l[1])), glaukos: UE.covenant.lines.some(l => /풀 한 포기/.test(l[1])), mask: UE.two.lines.some(l => /가면/.test(l[1])) };
      said.length = 0; await G.UninvitedApostles.scene('reconciliation'); out.uninvScene = said.some(t => t.startsWith('주앙|') && /빈 의자/.test(t));
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.shape && r.distinct, '열두 사도 — 모든 마디가 [말하는 이, 대사] 묶음 · 사도마다 다른 말');
    ok(r.player === 12, '제독이 말을 받는 장면 (' + r.player + '명)');
    ok(r.symbols === '', '신의 상징이 대사에 (' + (r.symbols || '모두') + ')');
    ok(r.meet1.intro && r.meet1.greet && r.meet1.me && r.meet1.lose && r.meet1.label && r.meet1.log, '제우스의 사도 — 첫 만남 해설 · 인사 · 제독의 말 · 시험 이름이 붙은 선택지 · 지면 lose · 일지');
    ok(r.meet2.noIntro && r.meet2.win && r.meet2.join && r.meet2.hired, '다시 도전 — 해설은 한 번만 · 이기면 win → join → 동료');
    ok(r.navalCalled && r.hera.win && r.hera.wait && r.hera.passed && !r.hera.hired && r.hera2.again && r.hera2.join && r.hera2.hired, '헤라의 사도 — 연습 해전 → win · 미루면 wait · 다시 오면 again → 동료');
    ok(r.voice.aboard && r.voice.skipped && r.voice.narr && r.legacy, '배에 탄 다른 사도 줄 · 없는 사람은 건너뜀 · 옛 꼴 문자열');
    ok(r.rumors === 12 && r.liveBefore === 'ol_zeus' && r.rumorLive === '', '거리 소문 12 — 동료가 되면 사라진다 (' + r.rumorLive + ')');
    ok(r.uninv.me && r.uninv.hestia && r.uninv.glaukos && r.uninv.mask && r.uninvScene, '초대받지 못한 사도 — 제독의 대사 · 헤스티아의 의자 · 글라우코스 · 가면');
    ok(errors.length === 0, '페이지 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  console.log(fail ? '\n실패 ' + fail : '\n모두 통과');
  process.exit(fail ? 1 : 0);
})();
