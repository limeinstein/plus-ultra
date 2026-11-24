/* 여성 제독의 임신·출산·대물림 (tests/motherhood_smoke.js) — node tests/motherhood_smoke.js
   ① 항해 중 임신: 남편이 있을 때만 · 50세까지 · 해산 뒤 쉬는 날 · 남성 제독은 예전 그대로
   ② 해산 두 달 전 산실로: 진료실 → 식당 → 예배실 → 창고 → 방 하나를 헐어 창고로 → 함장실 · 함장실을 맡는 남편 · 곁을 지키는 사람
   ③ 해산: 아버지의 성 · 어머니 쪽 비중 · 체력 · 이름 짓기 · 자택에서 가까워지기
   ④ 아들도 딸도 뒤를 잇는다(시집가지 않은 딸) · 가계도에 여성 제독과 남편들 · 옛 저장 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (error) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, R = G.R, UI = G.UI, H = G.Husbands, M = G.Mother, F = G.Family, CB = G.Cabins, KB = G.BALANCE.mother;
      let said = [], alerts = [], chosen = [], pickRoom = null;
      UI.say = async (t) => { said.push(String(t)); }; UI.alert = async (t) => { alerts.push(String(t)); }; UI.toast = () => {}; UI.confirm = async () => true;
      UI.choose = async (t, o) => { chosen.push(String(t)); if (/어떻게 키울까/.test(t)) return 'home'; return pickRoom != null && /헐어/.test(t) ? pickRoom : o[0].value; };
      UI.ask = async (t, o) => o[0].value; UI.prompt = async (t, v) => v;
      G.State.save = () => {}; G.Game.refreshHud = () => {};
      const chance0 = G.U.chance; let roll = true;   // 확률은 날을 보낼 때만 고정한다 (새 게임 만들기 등은 그대로)
      const men = G.MATES.filter(d => d.g !== 'f' && !d.minor && !d.sib && !d.wed && !d.eventOnly && d.id !== 'rocco' && d.name.indexOf(' ') > 0).slice(0, 2);
      const doc = G.MATES.filter(d => d.g !== 'f' && d.sk && d.sk.med >= 2 && !d.eventOnly && men.indexOf(d) < 0)[0];
      const woman = G.MATES.filter(d => d.g === 'f' && !d.minor && !d.sib && !d.wed && !d.witch && !(d.sk && d.sk.med))[0];
      function fresh(g, age) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
        const s = G.Game.state = G.State.newGame({ name: '마리아 코스타', given: '마리아', surname: '코스타', nation: 'PT', job: 'explorer', age: age || 25, birth: { m: 1, d: 1 }, st: { str: 80, int: 80, mar: 80, cha: 80 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal', g });
        s.date = { y: 1480, m: 6, d: 1 }; s.day = 31; s.loc.city = 0; s.loc.mode = 'city';
        return s;
      }
      function add(s, d) { const m = { id: d.id, role: 'none', loyal: 90, aff: 100, joined: 14800101 }; s.mates.push(m); return m; }
      function wed(s, d) { add(s, d); (s.player.husbands || (s.player.husbands = [])).push({ id: d.id, wed: s.day, no: s.player.husbands.length + 1 }); }
      function days(s, n) { let notes = []; G.U.chance = () => roll; try { for (let i = 0; i < n; i++) { s.day++; notes = notes.concat(M.daily()); } } finally { G.U.chance = chance0; } return notes; }
      function rooms(s, list) { const sh = s.fleet.ships[0], n = CB.rooms().length; sh.cabins = ['deck'].concat(list).slice(0, Math.max(n, list.length + 1)); while (sh.cabins.length < n) sh.cabins.push('hold'); return CB.rooms(); }

      // ① 임신
      let s = fresh('f'); out.slots = CB.rooms().length;
      days(s, 30); out.noHusband = !!s.player.pregSelf;
      wed(s, men[0]); days(s, 21); const pr = s.player.pregSelf;
      out.conceived = pr ? [pr.dad === men[0].id, pr.due - pr.since, pr.gen.mom, pr.gen.faW.join('~')].join('|') : 'none';
      let notes = days(s, 40); out.told = notes.map(n => n.text).join(' ').slice(0, 60);
      s = fresh('m'); wed(s, men[0]); days(s, 60); out.male = !!s.player.pregSelf;
      s = fresh('f', 40); s.player.born.y = s.date.y - 51; wed(s, men[0]); days(s, 60); out.tooOld = !!s.player.pregSelf + '|' + R.age();
      s = fresh('f', 40); s.player.born.y = s.date.y - 50; wed(s, men[0]); days(s, 21); out.at50 = !!s.player.pregSelf + '|' + R.age();
      s = fresh('f'); wed(s, men[0]); s.player.lastBirthSelf = s.day; days(s, 290); out.rest = !!s.player.pregSelf; days(s, 31); out.afterRest = !!s.player.pregSelf;
      s = fresh('f'); wed(s, men[0]); roll = false; days(s, 200); out.unlucky = !!s.player.pregSelf; roll = true;

      // ② 산실
      async function lie(list, extra) {
        const st = fresh('f'); wed(st, men[0]); wed(st, men[1]); if (extra) extra(st);
        rooms(st, list);
        st.player.pregSelf = { since: st.day, due: st.day + 266, told: true, sex: 'm', dad: men[1].id, gen: M.genSnap(men[1].id) };
        days(st, 205); const before = !!(st.motherTodo && st.motherTodo.lie) || !!st.player.pregSelf.lie;
        days(st, 2); const todo = !!(st.motherTodo && st.motherTodo.lie);
        alerts = []; said = []; chosen = [];
        await M.lieIn();
        const L = st.player.pregSelf.lie;
        return { before, todo, kind: L.kind, room: L.room, made: L.made, deputy: L.deputy === men[1].id, nurse: L.nurse, cabins: CB.rooms().join(','), alert: alerts.join(' ').replace(/<br>/g, ' '), asked: chosen.filter(t => /헐어/.test(t)).length, st };
      }
      let a = await lie(['hold', 'mess', 'sick'], st => { const m = add(st, doc); });
      out.sick = [a.before, a.todo, a.kind, a.made, a.deputy, a.nurse === doc.id, /진료실/.test(a.alert) && /맡는다/.test(a.alert)].join('|');
      a = await lie(['hold', 'mess', 'chapel'], st => add(st, woman)); out.mess = [a.kind, a.nurse === woman.id, /식당/.test(a.alert)].join('|');
      a = await lie(['hold', 'chapel', 'gun']); out.chapel = [a.kind, a.nurse, /예배실/.test(a.alert), /곁을 지킬/.test(a.alert)].join('|');
      a = await lie(['store', 'gun', 'hold']); out.store = [a.kind, a.made, a.cabins.split(',').filter(x => x === 'store').length].join('|');
      a = await lie(['gun', 'hold', 'rig']); out.holdMade = [a.kind, a.made, a.room, a.cabins, a.asked].join('|');
      const full = Array(Math.max(1, out.slots - 1)).fill('gun'); full[full.length - 1] = 'rig';
      pickRoom = full.length; a = await lie(full, st => { const m = add(st, woman); }); pickRoom = null;
      out.asked = [a.kind, a.made, a.room === full.length, a.cabins.split(',')[full.length], a.asked, /헐어 창고로/.test(a.alert)].join('|');
      // 고칠 방이 없는 배
      { const st = fresh('f'); wed(st, men[0]); const slotsOf = CB.slotsOf; CB.slotsOf = () => 0;
        st.player.pregSelf = { since: st.day, due: st.day + 30, told: true, sex: 'm', dad: men[0].id, gen: M.genSnap(men[0].id) };
        alerts = []; await M.lieIn(); out.captain = st.player.pregSelf.lie.kind + '|' + /함장실/.test(alerts.join('')); CB.slotsOf = slotsOf; }

      // ③ 해산
      s = fresh('f'); wed(s, men[0]); add(s, doc); rooms(s, ['sick']);
      CB.place(s.mates.filter(m => m.id === doc.id)[0], 1);
      days(s, 21); out.dad = s.player.pregSelf.dad === men[0].id;
      days(s, 206); await M.lieIn(); out.info = M.info().replace(/<[^>]+>/g, '');
      const hp0 = s.player.hp = 100; s.fleet.fatigue = 30;
      days(s, 60);
      const todo = s.motherTodo, kids = s.player.kids.slice();
      out.born = [!!(todo && todo.birth), kids.length >= 1, s.player.pregSelf == null, s.player.lastBirthSelf <= s.day && s.player.lastBirthSelf > s.day - 30, kids[0].unnamed, kids[0].father === men[0].id].join('|');
      alerts = []; said = []; chosen = [];
      await M.birth(todo); delete s.motherTodo;
      const k0 = s.player.kids[0], sur = men[0].name.slice(men[0].name.indexOf(' ') + 1);
      out.named = [k0.unnamed, k0.surname === sur, k0.name.indexOf(sur) > 0, k0.fatherName === men[0].name, k0.bond, k0.house == null && !k0.aboard].join('|');
      out.kidName = k0.name + ' ← ' + men[0].name;
      out.hp = [hp0 - s.player.hp, s.fleet.fatigue, /진료실에서/.test(alerts[0]), said.length, chosen.some(t => /이름/.test(t) && t.indexOf(sur) > 0)].join('|');
      out.log = s.log.slice(-2).map(x => x.t || x.text || x).join(' / ');
      // 어머니 쪽 비중: 아버지 능력 20, 어머니 80 → 아이 평균이 중간보다 어머니 쪽
      let sum = 0, fa = 0; const g = M.genSnap(men[0].id); g.fa = { str: 20, int: 20, mar: 20, cha: 20 }; g.moAge = 25; g.faAge = 30;
      G.U.chance = () => false;
      for (let i = 0; i < 200; i++) { const x = F.inherit(g); sum += (x.st.str + x.st.int + x.st.mar + x.st.cha) / 4; fa += x.info.fa; }
      out.inherit = [Math.round(sum / 200), Math.round(fa / 200)].join('|');
      const g2 = { fa: g.fa, mo: g.mo, faAge: 30, moAge: 25 }; sum = 0; fa = 0;
      for (let i = 0; i < 200; i++) { const x = F.inherit(g2); sum += (x.st.str + x.st.int + x.st.mar + x.st.cha) / 4; fa += x.info.fa; }
      out.inheritMale = [Math.round(sum / 200), Math.round(fa / 200)].join('|');
      G.U.chance = chance0;
      // 자택: 가까워진다
      k0.bond = 50; s.player.lastHomeBond = null; M.homeVisit(); out.homeBond = k0.bond; M.homeVisit(); out.homeBond += '|' + k0.bond;
      out.dadSur = [M.dadSurname('kim'), M.dadSurname('tupac')].join('|');

      // ④ 후계·가계도
      s.date.y += 20;
      const son = { name: '아들 코스타', given: '아들', surname: '코스타', sex: 'm', born: { y: s.date.y - 17, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70 };
      const dau = { name: '딸 코스타', given: '딸', surname: '코스타', sex: 'f', born: { y: s.date.y - 19, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70 };
      const wedDau = { name: '시집간 딸', given: '시집간', sex: 'f', born: { y: s.date.y - 22, m: 1, d: 1 }, sk: {}, lg: [], st: { str: 60, int: 60, mar: 60, cha: 60 }, bond: 70, married: { kind: 'cha', y: s.date.y - 2, title: '귀족' } };
      s.player.kids.push(son, dau, wedDau);
      out.heirs = F.heirs().map(k => k.given).join(',');
      const gens = G.FamilyTree.gens(), cur = gens[gens.length - 1];
      out.treeNow = [cur.e.sex, cur.e.husbands.join(','), cur.kids[0].dad].join('|');
      UI.fade = async () => {}; G.Game.go = () => {}; if (G.BALANCE.oldGuard) G.BALANCE.oldGuard.kinChance = 0;
      const mother = s.player.name;
      await F.succeed(dau, false);
      const s2 = G.Game.state, line = s2.lineage[0];
      out.succ = [s2.player.name, R.heroSex(), s2.player.generation, line.name === mother, line.sex, line.husbands.join(','), line.kids.filter(x => x.dad).length].join('|');
      let html = ''; const win0 = UI.window; UI.window = (o) => { html = o.html; return { el: document.createElement('div'), content: document.createElement('div'), close() {} }; };
      try { G.FamilyTree.open(); } catch (e) { html = html || String(e); } UI.window = win0;
      out.treeHtml = [html.indexOf(mother.split(' ')[0]) >= 0, /남편/.test(html), html.indexOf(men[0].name) >= 0, /아버지 /.test(html)].join('|');
      // 남성 제독의 딸도 뒤를 잇는다 · 옛 저장
      s = fresh('m'); s.date.y += 20; s.player.kids.push(Object.assign({}, dau, { born: { y: s.date.y - 19, m: 1, d: 1 } }));
      out.maleHeirs = F.heirs().length;
      s = fresh('f'); delete s.player.husbands; out.old = [M.daily().length, M.info(), !!s.player.pregSelf].join('|');
      G.U.chance = chance0;
      out.names = men.map(d => d.name).join(',') + ' · 의사 ' + doc.name + ' · ' + woman.name;
      return out;
    });
    console.log('① 임신 (' + r.names + ' · 기함 방 ' + r.slots + '칸)');
    ok(r.noHusband === false, '남편이 없으면 아이가 생기지 않는다');
    ok(r.conceived === 'true|266|self|0.2~0.45', '남편이 있으면 항해 중에 아이가 생긴다 — ' + r.conceived);
    ok(/아기가 생겼다/.test(r.told), '40일 뒤 알아차린다: ' + r.told);
    ok(r.male === false, '남성 제독에게는 없다');
    ok(r.tooOld === 'false|51' && r.at50 === 'true|50', '50세까지 — 51세 ' + r.tooOld + ' · 50세 ' + r.at50);
    ok(r.rest === false && r.afterRest === true, '해산 뒤 300일은 쉰다');
    ok(r.unlucky === false, '확률이 빗나가면 생기지 않는다');
    console.log('② 산실');
    ok(r.sick === 'false|true|sick|false|true|true|true', '두 달 전에 진료실로 · 함장실은 아버지인 남편 · 곁은 진료실의 의사 — ' + r.sick);
    ok(r.mess === 'mess|true|true', '진료실이 없으면 식당 · 의사가 없으면 여성 항해사 — ' + r.mess);
    ok(/^chapel\|(null|)\|true\|true$/.test(r.chapel), '식당도 없으면 예배실 · 곁을 지킬 사람이 없을 수도 — ' + r.chapel);
    ok(r.store === 'store|false|1', '있는 창고를 쓴다(더 헐지 않는다) — ' + r.store);
    ok(/^store\|true\|2\|deck,gun,store,rig/.test(r.holdMade) && /\|0$/.test(r.holdMade), '방이 없으면 빈 선실을 헐어 창고로 (묻지 않는다) — ' + r.holdMade);
    ok(r.asked === 'store|true|true|store|1|true', '쓰는 방뿐이면 어느 방을 헐지 고른다 — ' + r.asked);
    ok(r.captain === 'captain|true', '고칠 방이 없는 배는 함장실에서');
    console.log('③ 해산');
    ok(r.dad && /아기를 가짐/.test(r.info) && /진료실에서 해산 준비/.test(r.info), '수첩: ' + r.info);
    ok(r.born === 'true|true|true|true|true|true', '날이 차면 태어난다 — ' + r.born);
    ok(r.named === 'false|true|true|true|60|true', '아버지의 성 · 사이 60 · 고향 집에서 — ' + r.kidName);
    ok(/^(5|10)\|20\|true\|[2-9]\|true$/.test(r.hp), '진료실 + 의사: 체력 −5~10 · 피로 −10 · 이름 창에 아버지 성 — ' + r.hp);
    ok(/태어났다/.test(r.log), '일지: ' + r.log);
    const [avgF, faF] = r.inherit.split('|').map(Number), [avgM, faM] = r.inheritMale.split('|').map(Number);
    ok(faF >= 28 && faF <= 37 && faM >= 45 && faM <= 55 && avgF > avgM + 5, '어머니 쪽 비중: 여성 제독 아버지 ' + faF + '% (아이 평균 ' + avgF + ') · 남성 제독 ' + faM + '% (' + avgM + ')');
    ok(r.homeBond === '53|53', '집에 들르면 아이와 가까워진다 (보름에 한 번)');
    ok(r.dadSur === '김|', '아버지의 성: 김서진 → 김 · 성이 없는 이름은 제독의 성 — ' + r.dadSur);
    console.log('④ 후계·가계도');
    ok(/아들/.test(r.heirs) && /(^|,)딸/.test(r.heirs) && !/시집간/.test(r.heirs), '아들도 시집가지 않은 딸도 뒤를 잇는다: ' + r.heirs);
    ok(/^f\|[^|]+\|.+/.test(r.treeNow), '가계도(지금): 여성 제독 · 남편 · 아이의 아버지 — ' + r.treeNow);
    ok(/^딸 코스타\|f\|2\|true\|f\|[^|]+\|[1-9]/.test(r.succ), '딸이 뒤를 잇고, 물러난 여성 제독이 남편들과 함께 가계도에 남는다 — ' + r.succ);
    ok(r.treeHtml === 'true|true|true|true', '가계도 창에 여성 제독·남편·아버지가 보인다 — ' + r.treeHtml);
    ok(r.maleHeirs === 1, '남성 제독의 딸도 뒤를 잇는다');
    ok(r.old === '0||false', '옛 저장도 그대로');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' / ') : ''));
    console.log('motherhood_smoke: 모두 통과');
  } finally { await browser.close(); }
})().catch(e => { console.error('실패:', e.message); process.exit(1); });
