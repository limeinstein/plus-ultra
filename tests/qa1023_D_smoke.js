/* QA 2026-10-23 D 그룹(가족·부하·선실) 고침 시험 — node tests/qa1023_D_smoke.js   (BROWSER_EXE=크롬 경로)
   [4] 아이(d.minor)·동생 남매는 썸·청혼 대상이 아니다 · 옛 저장의 짝 정리   [7] 배 위의 해산   [8] 피터 팬 — 아이 열쇠·대가 바뀌면 닫기
   [9] 왕세자비는 한 번   [10] 집에서 아이와 — 성장 한도   [11] 사건 중 자동 저장 건너뜀   [15] 명작 → 자택 보관함
   [25] 게르다가 떠나면 escort 풀림   [26] 섬에서 사라진 딸은 혼례 없음   [29] 요리 1단계 차림이 바뀐다
   [36] (a) 부인 외도 결투에 그림 없음 (b) 달타냥 두 번 빌리지 않음 (c) 동생의 어머니   [34] 조사 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Romance, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, U = G.U;
      await G.Game.ensureGeo();
      const said = [], toasts = [];
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      UI.toast = t => { toasts.push(String(t)); };
      let asked = [];
      UI.ask = async (t, o) => { asked.push(o.map(x => x.label + (x.dis ? '(x)' : ''))); return null; };
      UI.confirm = async () => false; UI.choose = async () => null;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.player.gold = 50000;
      const y3 = U.dateNum({ y: s.date.y - 4, m: s.date.m, d: s.date.d });
      const add = (id) => { const row = { id, role: 'none', joined: y3, loyal: 80, from: 0 }; s.mates.push(row); return row; };

      // ---- [4] 미성년 표시
      out.minor = ['peter_pan', 'gerda', 'simcheong'].map(id => !!(G.MATE[id] && G.MATE[id].minor));
      out.adultYoung = !G.MATE.joan_of_arc || !G.MATE.joan_of_arc.minor;
      const RM = G.Romance;
      out.unfit = [RM.unfit('peter_pan', 'gerda'), RM.unfit('peter_pan', 'simcheong')];
      // 동생 항해사 둘(남매) — 정의만 만들어 올린다
      const sibM = { id: 'sib_t_1', name: '시험남동생', g: 'm', sib: true, st: [60, 60, 60, 60], sk: {}, lg: { 0: 3 }, wage: 10, y: [1450, 9999], reg: [], style: 'ib', role: 'sailor' };
      const sibF = { id: 'sib_t_2', name: '시험여동생', g: 'f', sib: true, st: [60, 60, 60, 60], sk: {}, lg: { 0: 3 }, wage: 10, y: [1450, 9999], reg: [], style: 'ib', role: 'maid' };
      [sibM, sibF].forEach(d => { G.MATES.push(d); G.MATE[d.id] = d; });
      out.unfitSib = RM.unfit('sib_t_1', 'sib_t_2');
      const adultF = G.MATES.find(m => m.g === 'f' && !m.witch && !m.wd && !m.minor && !m.sib);
      out.fitOther = !RM.unfit('sib_t_1', adultF.id);
      // 피터 팬 + 게르다 + 심청 + 남매만 배에 — 여러 날이 지나도 짝이 생기지 않는다
      s.mates = [];
      ['peter_pan', 'gerda', 'simcheong', 'sib_t_1', 'sib_t_2'].forEach(add);
      for (let i = 0; i < 400; i++) { s.day++; RM.daily(); }
      out.noPairs = Object.keys(RM.st().pairs).length;
      // 옛 저장: 남매·아이 짝이 연인/부부로 남아 있으면 지운다
      RM.st().pairs = { 'sib_t_1|sib_t_2': { m: 'sib_t_1', f: 'sib_t_2', heat: 90, stage: 'lover', since: 1, cd: 0 }, 'peter_pan|gerda': { m: 'peter_pan', f: 'gerda', heat: 90, stage: 'wed', since: 1, cd: 0 } };
      RM.st().done = 'peter_pan|gerda';
      out.tagBefore = RM.tag('gerda');
      RM.daily();
      out.cleaned = [Object.keys(RM.st().pairs).length, RM.st().done || ''];
      // 청혼: 게르다·심청은 「청혼한다」가 없고 호감도 오르지 않는다
      const MT = G.MateTalk;
      const gRow = s.mates.find(m => m.id === 'gerda'); gRow.aff = 95;
      asked = []; await MT.talk(G.CITY_DATA[0], gRow);
      out.gerdaOpts = asked[0] || [];
      out.gerdaAff = gRow.aff || 0;
      const scRow = s.mates.find(m => m.id === 'simcheong');
      asked = []; await MT.talk(G.CITY_DATA[0], scRow);
      out.scOpts = asked[0] || [];
      const aRow = add(adultF.id); asked = []; await MT.talk(G.CITY_DATA[0], aRow);
      out.adultOpts = asked[0] || [];

      // ---- [36a] 부인 외도는 그림 없이
      let pics = 0; const sp0 = G.FamEv.showPic; G.FamEv.showPic = () => { pics++; return { stop: async () => {} }; };
      const W = G.Wives, aff0 = W.affair; let affairs = 0; W.affair = async () => { affairs++; };
      const wifeMate = adultF.id; s.player.wives2 = [{ id: wifeMate, kind: 'mate', city: 0, house: false, aboard: true, wed: 1, no: 2 }];
      const man = G.MATES.find(m => m.g !== 'f' && !m.minor && !m.sib && !m.witch && !m.wd && G.MATE[m.id] && m.id !== 'peter_pan');
      add(man.id);
      await RM.play({ m: man.id, f: wifeMate, heat: 50, stage: 'none', due: 'snack', cd: 0 });
      out.affairPics = [affairs, pics];
      s.player.wives2 = []; W.affair = aff0;
      await RM.play({ m: man.id, f: wifeMate, heat: 50, stage: 'none', due: 'snack', cd: 0 });
      out.normalPics = pics;
      G.FamEv.showPic = sp0;

      // ---- [7] 배 위의 해산
      const w2 = { id: wifeMate, kind: 'mate', city: 5, house: true, aboard: true, wed: 1, no: 2, preg: { since: s.day - 80, due: s.day + 200, told: false } };
      s.player.wives2 = [w2]; s.player.kids = [];
      s.loc = { mode: 'sea', city: null };
      const n1 = W.daily();
      w2.preg.due = s.day;
      const n2 = W.daily();
      out.shipBirth = { told: n1.map(x => x.text), born: n2.map(x => x.text), kid: s.player.kids[0] && { house: s.player.kids[0].house, witness: s.player.kids[0].witness } };
      s.player.wives2 = [];

      // ---- [8] 피터 팬: 아이 열쇠로 · 대가 바뀌면 닫는다
      const F = G.Family, PP = G.Peter;
      const kidA = { name: '마테오', sex: 'm', born: { y: s.date.y - 12, m: 3, d: 3 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, lost: 'peter' };
      const kidB = { name: '디에고', sex: 'm', born: { y: s.date.y - 10, m: 5, d: 5 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {} };
      s.player.kids = [kidB, kidA];
      s.peter = { phase: 'lost', kid: 1, kidKey: PP.kidKey(kidA), isle: 'hebrides', since: s.day };
      out.ppKey = PP.lostKid() === kidA;
      s.player.kids = [kidA, kidB];          // 번호가 바뀌어도 같은 아이
      out.ppKeyMoved = PP.lostKid() === kidA;
      // 옛 저장: 번호만 있고 그 번호의 아이가 사라진 아이가 아니면 → 되찾지 않는다
      s.peter = { phase: 'lost', kid: 1, isle: 'hebrides', since: s.day };
      s.player.kids = [kidA, { name: '새아이', sex: 'm', born: { y: s.date.y - 8, m: 1, d: 1 }, sk: {}, lg: {}, edu: {} }];
      out.ppOld = PP.lostKid() === kidA;
      s.player.kids = [{ name: '새아이', sex: 'm', born: { y: s.date.y - 8, m: 1, d: 1 }, sk: {}, lg: {}, edu: {} }];
      s.peter = { phase: 'lost', kid: 0, isle: 'hebrides', since: s.day };
      out.ppNewGen = [PP.lostKid(), s.peter.phase || ''];
      // fromRetire: 잃은 아이를 두고 대가 바뀌면 s.peter 를 닫는다
      s.player.kids = [kidA, kidB]; s.peter = { phase: 'lost', kid: 0, kidKey: PP.kidKey(kidA), isle: 'hebrides', since: s.day };
      const heir = { name: '후계', sex: 'm', born: { y: s.date.y - 25, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {} };
      const kidC = { name: '이자벨', sex: 'f', born: { y: s.date.y - 14, m: 2, d: 2 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, mother: 'mw2' };
      G.MAIDS.push({ id: 'mw2', name: '둘째부인시험', city: 3 }); G.MAID.mw2 = G.MAIDS[G.MAIDS.length - 1];
      s.player.wife = G.MAIDS[0].id;
      s.player.kids = [heir, kidA, kidB, kidC];
      const sibs = await G.Siblings.fromRetire(s.player, heir);
      out.retire = { peter: JSON.stringify(s.peter), sibs: sibs.map(k => k.name), lostOut: sibs.indexOf(kidA) < 0, mothers: sibs.map(k => k.name + ':' + k.sib.mother) };
      out.wifeName = F.wifeName();

      // ---- [9][26][34] 딸의 혼례
      const KW = G.KidWed, HL = G.HomeLife;
      const d1 = { name: '루시아', sex: 'f', born: { y: s.date.y - 19, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 70 }, edu: {}, touch: 80, bond: 70 };
      const d2 = { name: '마르타', sex: 'f', born: { y: s.date.y - 18, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 70 }, edu: {}, touch: 80, bond: 70, lost: 'peter' };
      s.player.kids = [d2, d1]; delete s.player.royalKin;
      out.dueLost = KW.due() === d1;
      out.royal1 = KW.royal(d1);
      s.player.royalKin = { name: '앞선 딸', y: s.date.y - 1 };
      out.royal2 = KW.royal(d1);
      UI.ask = async (t, o) => o[0].value;
      const logs0 = s.log ? s.log.length : 0;
      await KW.check();
      const logs = (s.log || []).slice(logs0).map(x => typeof x === 'string' ? x : (x.t || x.text || JSON.stringify(x)));
      out.kwLog = logs.filter(t => /혼례/.test(t))[0] || '';
      out.kwKind = d1.married && d1.married.kind;
      const sui = out.kwKind && G.KIDWED.common[out.kwKind] && G.KIDWED.common[out.kwKind].suitor;
      out.kwExpect = sui ? sui + U.jx(sui, '과/와') + ' 혼례를' : '';
      UI.ask = async (t, o) => null;
      out.kv = G.KidVoy && G.KidVoy.fill ? [G.KidVoy.fill('{k:과/와} 갑판장이', { name: '주앙' }), G.KidVoy.fill('{k:과/와} 경리가', { name: '마리아' }), G.KidVoy.fill('{k:이다/다}.', { name: '주앙' })] : [];

      // ---- [10] 집에서 아이와 — 성장 한도를 따른다
      const GR = G.Growth; s.player.st.str = 80; s.player.xp = {};
      const _ch = U.chance; U.chance = () => true;
      for (let i = 0; i < 30; i++) HL.adult({ str: 1 });
      U.chance = _ch;
      out.adult = { str: s.player.st.str, day: (GR.state().d || {}).str || 0 };

      // ---- [11] 사건 한가운데서는 자동 저장을 건너뛴다
      let saved = 0; const sv = G.State.save; G.State.save = () => { saved++; };
      G.Game.sceneName = 'sea';
      const busy0 = UI.busy; UI.busy = () => true;
      G.State.autoTick();
      const skipped = saved;
      UI.busy = busy0;
      G.State.autoTick();
      out.autosave = [skipped, saved];
      G.State.save = sv;

      // ---- [15] 명작은 자택 보관함으로 · 옛 studio.home 도 옮긴다
      const ST = G.Studio;
      s.player.storage = [];
      s.studio = { pend: [], works: [], made: {}, home: [{ id: 'masterwork', name: '옛 명작', value: 100, mw: true }] };
      const painter = G.MATES.find(m => m.sk && m.sk.paint) || G.MATES[0];
      const fullItems = s.player.items; s.player.items = []; for (let i = 0; i < 40; i++) s.player.items.push({ id: 'ring', tag: i });
      s.studio.pend.push({ by: painter.id, kind: 'paint', n: 1, name: '새 명작', desc: '시험', value: 3000, so: 10, date: { y: s.date.y, m: 1, d: 1 } });
      await ST.present();
      out.studio = { storage: s.player.storage.map(x => x.name), home: s.studio.home.length };
      s.player.items = fullItems;

      // ---- [25] 눈의 여왕: 모스크바로 가는 도중 게르다가 떠나면
      const SQ = G.SnowQueen;
      s.mates = s.mates.filter(m => m.id !== 'gerda'); delete s.flags.gone_gerda;
      s.snowQ = { stage: 'escort', metDay: s.day - 10 };
      const rd = SQ.ready();
      out.sq = { stage: s.snowQ.stage || '', cool: (s.snowQ.cool || 0) > s.day, ready: rd };

      // ---- [36b] 달타냥: 빌려준 뒤 거절하면 다음엔 빌리지 않는다
      const LG = G.Legend; const D = LG.state().dart; D.lent = 2000; D.done = 0;
      const paris = G.CITY_DATA.find(c => LG.isFrance(c));
      const C = G.Scenes.city, curOld = C.current; C.current = () => ({ kind: 'market', lgBuys: 5 });
      s.mates = s.mates.filter(m => m.id !== 'd_artagnan');
      const gold0 = s.player.gold; said.length = 0;
      await LG._t.marketBuy(paris, 1);
      C.current = curOld;
      out.dart = { paid: gold0 - s.player.gold, asks: said.filter(t => /빌려주실|빌려줄까/.test(t)).length, met: said.some(t => /또 뵙는군요/.test(t)) };

      // ---- [29] 요리 1단계 요리사: 차림이 바뀐다
      const CB = G.Cabins;
      const big = Object.keys(G.SHIP).map(id => ({ id, n: CB.slots({ type: id }) })).sort((a, b) => b.n - a.n)[0];
      s.fleet.ships[0].type = big.id; s.fleet.ships[0].cabins = null; s.fleet.cabinUid = null;
      CB.remodel(1, 'galley');
      const cooks = G.MATES.filter(d => d.sk && d.sk.cook >= 1 && d.lg && !d.minor);
      const rot = {};
      for (const want of ['africa', 'india', 'korea', 'latin', 'seasia']) {
        const d = cooks.find(x => { s.mates = []; const row = { id: x.id, role: 'none', loyal: 90 }; return CB.cookZone(row) === want; });
        if (!d) continue;
        s.mates = []; const row = { id: d.id, role: 'none', loyal: 90, sk: { cook: 1 } }; s.mates.push(row); CB.place(row, 1);
        const realSkill = G.R.mateSkill; G.R.mateSkill = (m, k) => k === 'cook' ? 1 : realSkill(m, k);
        const seen = new Set(), d0 = s.day, fats = [];
        for (let k = 0; k < 8; k++) { s.day = d0 + k * 7; const gm = CB.galleyMeal(); if (gm) { seen.add(gm.dish.id); fats.push(+gm.fat.toFixed(3)); } }
        s.day = d0; G.R.mateSkill = realSkill;
        rot[want] = [seen.size, Math.max(...fats) === Math.min(...fats)];
      }
      out.rot = rot;
      return out;
    });
    console.log('   ' + JSON.stringify(r).slice(0, 3000));
    ok(r.minor.every(Boolean) && r.adultYoung, '[4] 피터 팬·게르다·심청에 미성년 표시 (잔 다르크 같은 젊은 어른은 그대로)');
    ok(r.unfit.every(Boolean) && r.unfitSib && r.fitOther, '[4] 아이·동생 남매는 짝이 될 수 없고, 동생과 다른 부하는 그대로');
    ok(r.noPairs === 0, '[4] 아이·남매만 배에 있으면 400일이 지나도 짝이 생기지 않는다');
    ok(r.cleaned[0] === 0 && !r.cleaned[1] && !r.tagBefore, '[4] 옛 저장의 남매·아이 짝(연인·부부)은 조용히 지운다');
    ok(!r.gerdaOpts.some(t => /청혼/.test(t)) && !r.scOpts.some(t => /청혼/.test(t)) && r.gerdaAff === 0, '[4] 게르다·심청에게는 청혼이 없고 호감도 비운다 (' + r.gerdaOpts.join('/') + ')');
    ok(r.adultOpts.some(t => /청혼/.test(t)), '[4] 어른 여자 부하에게는 그대로 청혼할 수 있다');
    ok(r.affairPics[0] === 1 && r.affairPics[1] === 0 && r.normalPics === 1, '[36a] 배에 탄 부인과의 끌림은 결투로 — 간식 그림을 띄우지 않는다 (보통 사건은 그림 1)');
    ok(r.shipBirth.told.some(t => /배 위에서/.test(t)) && !r.shipBirth.told.some(t => /이 도시에서 기다릴게요/.test(t)) && r.shipBirth.born.some(t => /배 위에서/.test(t)) && r.shipBirth.kid && r.shipBirth.kid.house === 5 && r.shipBirth.kid.witness === true,
      '[7] 배에 탄 둘째 부인: 편지 대신 배 위 알림 · 배 위의 해산(witness) · 아이는 그 집에서 — ' + r.shipBirth.born[0]);
    ok(r.ppKey && r.ppKeyMoved && r.ppOld, '[8] 섬에 남은 아이를 열쇠(이름·생일)로 찾는다 — 번호가 바뀌어도 · 옛 저장도');
    ok(r.ppNewGen[0] === null && r.ppNewGen[1] === '', '[8] 새 대의 같은 번호 아이를 「되찾지」 않는다 — 옛 저장은 이야기를 닫는다');
    ok(r.retire.peter === '{}' && r.retire.lostOut, '[8] 대가 바뀔 때 섬에 남은 아이가 있으면 s.peter 를 닫는다 (동생으로 옮기지 않음)');
    ok(r.retire.mothers.some(t => /이자벨:둘째부인시험/.test(t)) && r.retire.mothers.some(t => t.indexOf('디에고:' + r.wifeName) === 0), '[36c] 동생 기록의 어머니는 낳은 부인 (' + r.retire.mothers.join(' · ') + ')');
    ok(r.dueLost, '[26] 섬에서 사라진 딸은 혼례를 치르지 않는다');
    ok(r.royal1 && !r.royal2 && r.kwKind !== 'prince', '[9] 왕세자비는 한 딸만 — 다음 딸은 보통 혼처 (' + r.kwKind + ')');
    ok(r.kwExpect && r.kwLog.indexOf(r.kwExpect) >= 0, '[34] 혼례 일지 조사: ' + r.kwLog);
    ok(r.kv.length === 3 && r.kv[0] === '주앙과 갑판장이' && r.kv[1] === '마리아와 경리가' && r.kv[2] === '주앙이다.', '[34] 배 위 아이 이야기 조사: ' + r.kv.join(' · '));
    ok(r.adult.str <= 81 && r.adult.day <= 45, '[10] 집에서 아이와 함께해도 성장 한도를 따른다 (30번 → 힘 ' + r.adult.str + ', 그날 경험 ' + r.adult.day + ')');
    ok(r.autosave[0] === 0 && r.autosave[1] === 1, '[11] 창이 떠 있으면 자동 저장을 건너뛰고, 틈이 나면 저장한다');
    ok(r.studio.storage.indexOf('옛 명작') >= 0 && r.studio.storage.indexOf('새 명작') >= 0 && r.studio.home === 0, '[15] 소지품이 가득하면 명작은 자택 보관함으로 · 옛 studio.home 도 옮긴다');
    ok(r.sq.stage === '' && r.sq.cool && !r.sq.ready, '[25] 모스크바로 가는 도중 게르다가 떠나면 escort 를 풀고 잠시 쉰다');
    ok(r.dart.paid === 0 && r.dart.asks === 0 && r.dart.met, '[36b] 달타냥: 이미 빌려준 뒤에는 다시 빌리지 않고 합류만 청한다');
    const zs = Object.keys(r.rot);
    ok(zs.length >= 2 && zs.every(z => r.rot[z][0] >= 2), '[29] 요리 1단계 요리사도 차림이 번갈아 바뀐다 (' + zs.map(z => z + ' ' + r.rot[z][0] + '가지').join(' · ') + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
