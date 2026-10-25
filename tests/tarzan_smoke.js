/* 정글의 사내 타잔 (2026-10-25) — 시에라리온 동쪽 정글 · 사냥 · 짐승 떼의 우두머리 · 공격/일기토(의학)/설득(소지품) · 90일 몸짓 · 3년 동안 새 솜씨 9가지
   node tests/tarzan_smoke.js */
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
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const out = {}, said = [], asked = [], battles = [];
      let pick = null, duelRes = 'win';
      G.UI.say = async (t, w) => { said.push(((w && w.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asked.push({ q, opts: opts.map(o => (o.dis ? '×' : '') + o.label) }); const want = pick && opts.find(o => o.value === pick && !o.dis); const o = want || opts.filter(x => !x.dis)[0]; return o ? o.value : null; };
      G.UI.choose = async (t, opts) => opts[0] ? opts[0].value : null;
      G.UI.toast = () => {};
      G.Games.duel = async () => duelRes;
      const L = G.Scenes.land;
      L.landBattle = async (name, n, beasts, o) => { battles.push({ name, n, leader: o && o.leader, look: o && o.leaderLook, halt: !!(o && o.halt) }); return o && o.halt ? 'truce' : 'win'; };
      const TZ = G.Tarzan, SL = G.CITY_DATA[91];
      function fresh(skLv) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = skLv; });
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1520, m: 6, d: 1 }; G.SKILLS.forEach(x => { s.player.sk[x.id] = skLv; }); s.mates = [];
        s.loc = { mode: 'land', lon: SL.lon + 0.6, lat: SL.lat, party: 40 };
        said.length = 0; asked.length = 0; battles.length = 0;
        return s;
      }
      const d = G.MATE.tarzan;
      out.def = d && { sk: d.sk, mar: d.st[2], lg: Object.keys(d.lg).length, wage: d.wage, eventOnly: d.eventOnly };
      // 어디서
      out.where = { east: TZ.jungle(SL.lon + 0.6, SL.lat), sea: TZ.jungle(SL.lon - 0.5, SL.lat), farEast: TZ.jungle(SL.lon + 4, SL.lat), north: TZ.jungle(SL.lon + 0.6, 11.5) };
      // 다른 일이면 아무 일도 없다
      let s = fresh(0);
      out.rest = await TZ.onCamp('rest', s.loc.lon, s.loc.lat);
      // ① 의학 없음 · 소지품 없음 → 일기토·설득은 고를 수 없다 → 계속 공격
      s = fresh(0); s.player.items = [];
      pick = 'duel';
      out.attack = await TZ.onCamp('hunt', s.loc.lon, s.loc.lat);
      out.attackAsk = asked.find(a => /앞을 막아섰다/.test(a.q));
      out.attackBattles = battles.slice();
      out.attackCool = s.tarzan && s.tarzan.cool - s.day; out.attackJoined = s.mates.some(m => m.id === 'tarzan');
      out.attackReady = TZ.ready();
      // ② 의학이 있으면 일기토 — 지면 60일
      s = fresh(0); s.player.sk.med = 1; s.player.items = []; pick = 'duel'; duelRes = 'lose';
      out.duelLose = await TZ.onCamp('hunt', s.loc.lon, s.loc.lat); out.duelLoseCool = s.tarzan.cool - s.day;
      // 이기면 치료 → 짐승들이 걱정 → 사람임을 깨닫고 고개를 끄덕여 합류
      s = fresh(0); s.player.sk.med = 2; pick = 'duel'; duelRes = 'win';
      out.duelWin = await TZ.onCamp('hunt', s.loc.lon, s.loc.lat);
      out.duelSaid = said.join('\n');
      out.duelJoined = s.mates.some(m => m.id === 'tarzan');
      // ③ 설득: 소지품 하나를 건넨다
      s = fresh(0); s.player.items = []; G.R.addItem('compass'); const n0 = s.player.items.length; pick = 'talk';
      out.talk = await TZ.onCamp('hunt', s.loc.lon, s.loc.lat);
      out.talkItems = [n0, s.player.items.length]; out.talkJoined = s.mates.some(m => m.id === 'tarzan'); out.talkHow = s.tarzan.how;
      out.talkSaid = said.join('\n');
      // 말: 90일 동안 몸짓
      const mime0 = G.Tale.mime('제독, 바다로 나가요!', { name: '타잔' });
      for (let i = 0; i < 89; i++) TZ.daily();
      const mime89 = G.Tale.mime('고맙습니다', { name: '타잔' });
      const msg90 = TZ.daily();
      out.mute = { day0: !!mime0 && /mime/.test(mime0), day89: !!mime89, day90: !G.Tale.mime('고맙습니다', { name: '타잔' }), msg: (msg90.find(x => /처음으로/.test(x.text)) || {}).text, lgx: s.mates.find(m => m.id === 'tarzan').lgx };
      out.mermaidStill = G.Tale.mime('안녕', { name: '신데렐라' }) === null;
      return out;
    });
    console.log('   ' + JSON.stringify({ def: r.def, where: r.where }));
    ok(r.def && r.def.sk.ops === 3 && r.def.sk.sword === 3 && r.def.mar === 93 && r.def.lg === 0 && r.def.wage === 0 && r.def.eventOnly, '타잔: 운용술·검술 3 · 무력 93 · 아는 말 없음 · 무급 · 사건으로만');
    ok(r.where.east && !r.where.sea && !r.where.farEast && !r.where.north, '시에라리온 동쪽 정글에서만 (서쪽 바다·먼 동쪽·북쪽은 아니다)');
    ok(r.rest === false, '사냥이 아닌 야영(쉬기)으로는 만나지 않는다');
    ok(r.attackAsk && r.attackAsk.opts.some(o => /^×일기토/.test(o)) && r.attackAsk.opts.some(o => /^×설득/.test(o)), '의학이 없으면 일기토, 소지품이 없으면 설득을 고를 수 없다 — ' + (r.attackAsk && r.attackAsk.opts.join(' / ')));
    ok(r.attackBattles.length === 2 && r.attackBattles[0].halt && r.attackBattles[0].look === 'chief' && r.attackBattles[1].leader === '숲의 사내', '짐승 떼와 싸우다 첫 차례 뒤 사람(우두머리)이 보이고, 계속 공격하면 다시 싸운다');
    ok(r.attack === false && !r.attackJoined && r.attackCool === 365 && !r.attackReady, '계속 공격하면 그는 다쳐 사라진다 (1년 동안 만나지 못한다)');
    ok(r.duelLose === false && r.duelLoseCool === 60, '일기토에서 지면 밀림으로 사라진다 (60일)');
    ok(r.duelWin === true && r.duelJoined && /치료|싸맨다|씻고/.test(r.duelSaid) && /짐승들이 하나둘 다가온다/.test(r.duelSaid) && /고개를 끄덕였다/.test(r.duelSaid), '일기토에서 이기면 치료 → 짐승들이 걱정 → 사람임을 깨닫고 고개를 끄덕여 합류');
    ok(r.talk === true && r.talkJoined && r.talkItems[1] === r.talkItems[0] - 1 && r.talkHow === 'gift' && /고개를 끄덕였다/.test(r.talkSaid), '설득: 소지품 하나를 건네고 합류');
    ok(r.mute.day0 && r.mute.day89 && r.mute.day90 && /처음으로 사람의 말/.test(r.mute.msg || '') && r.mute.lgx && r.mute.lgx[1] >= 2, '90일 동안은 몸짓으로만, 90일째 제독의 말을 익힌다');
    ok(r.mermaidStill, '다른 동료의 말은 그대로');

    // 3년 동안 새 솜씨 9가지가 3단계 (제독이 모든 솜씨 1단계 — 가르칠 수 있다)
    const lr = await page.evaluate(() => {
      const TZ = G.Tarzan, sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state; G.SKILLS.forEach(x => { s.player.sk[x.id] = 1; }); s.player.sk.nav = 3; s.player.sk.gun = 2;
      s.mates = [{ id: 'tarzan', role: 'none', loyal: 85, tz: { days: 0, learned: 0, list: [] } }];
      const at = {}, msgs = [];
      for (let dd = 1; dd <= 1200; dd++) { const o = TZ.daily(); o.forEach(x => msgs.push(x.text)); if (dd === 360 || dd === 720 || dd === 1080) { const m = s.mates[0]; at[dd] = Object.keys(m.sk || {}).filter(k => m.sk[k] >= 3).length + '/' + m.tz.learned; } }
      const m = s.mates[0], d = G.MATE.tarzan;
      const lv = id => (m.sk && m.sk[id] != null ? m.sk[id] : d.sk[id] || 0);
      return { at, list: m.tz.list, three: G.SKILLS.filter(x => lv(x.id) >= 3).map(x => x.id), first: m.tz.list[0], msg: msgs.find(t => /배웠다/.test(t)), eff: G.R.mateSkill(m, m.tz.list[0]) };
    });
    console.log('   ' + JSON.stringify(lr.at) + ' · ' + lr.list.join(','));
    ok(lr.list.length === 9 && lr.three.length === 11, '3년(36달) 뒤 새 솜씨 9가지가 3단계 (운용술·검술까지 3단계 11가지)');
    ok(lr.at[360] === '3/9' && lr.at[720] === '6/18' && lr.at[1080] === '9/27', '해마다 3가지씩 고르게 익힌다 (1년 ' + lr.at[360] + ' · 2년 ' + lr.at[720] + ' · 3년 ' + lr.at[1080] + ')');
    ok(lr.first === 'nav' && /에게서 .* 배웠다/.test(lr.msg || '') && lr.eff === 3, '가르칠 사람이 가장 잘하는 솜씨(항해술 3)부터 배운다 — ' + lr.msg);

    // 실제 육상전: 짐승 떼를 사람이 이끈다 (우두머리는 사람 모습)
    const lw = await page.evaluate(async () => {
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0; s.loc = { mode: 'land', lon: -12.6, lat: 8.5, party: 40, mount: { id: 'walk', n: 0 } };
      const p = G.Games.landWar({ enemy: { name: '밀림의 짐승 떼', kind: 'beast', n: 10, leader: '숲의 사내', leaderLook: 'chief', beast: ['lion', 'hyena'] }, party: 40, terr: 'jungle', guns: false, fastEnd: true, flee: false });
      await new Promise(r => setTimeout(r, 300));
      const D = G.Games._landDebug, lead = D.foes.find(u => u.leader), beasts = D.foes.filter(u => !u.leader).map(u => u.look);
      D.foes.forEach(u => { if (u.leader) u.n = 0; });
      [...document.querySelectorAll('.lwar .lw-btns button')].filter(x => /전투 개시/.test(x.textContent))[0].click();
      await new Promise(r => setTimeout(r, 300)); await D.run(); await p;
      return { look: lead.look, cls: lead.cls, name: lead.name, beasts };
    });
    ok(lw.look === 'chief' && lw.cls === 'blade' && lw.name === '숲의 사내' && lw.beasts.every(x => x === 'beast'), '육상전: 짐승 떼 뒤의 우두머리는 사람(숲의 사내)으로 그린다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
