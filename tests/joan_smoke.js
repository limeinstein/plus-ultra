/* 오를레앙의 처녀 잔 (js/systems/joan.js · js/data/joan.js) — node tests/joan_smoke.js
   · 능력: 웅변·측량·운용·검술·신학 3 · 로망스어·게르만어 3 · 체력 92 · 무력 95 · 무급 · 츤데레
   · 조건: 프랑스 숲에서 야영하며 약초를 「찾았을」 때 · 기함에 빈 예배실이 있을 때만 (없거나 사람이 있으면 소문만 · 독일 숲·휴식·헛걸음이면 없음)
   · 화형대 앞 일기토: 못 본 척·지면 30일 뒤 다시 · 이기면 츤데레 대사와 합류, 비어 있던 예배실에 든다
   · 실제 야영 메뉴(약초를 캔다)에서 이어진다 · 프랑스 술집 주인의 귀띔 한 번 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, J = G.Joan, CB = G.Cabins, UI = G.UI, out = {};
      const d = G.MATE.joan_of_arc;
      out.data = { name: d.name, st: d.st, sk: d.sk, lg: d.lg, wage: d.wage, g: d.g, tone: G.Banter ? G.Banter.toneOf('joan_of_arc') : d.tone, toneName: G.BANTER && G.BANTER.toneName[d.tone],
        eff: ['speech', 'survey', 'ops', 'sword', 'theo'].map(k => G.R.mateSkill({ id: 'joan_of_arc' }, k)) };
      const find = (f, box) => { for (let x = box[0]; x <= box[1]; x += 0.1) for (let y = box[2]; y <= box[3]; y += 0.1) if (!G.Geo.isSea(x, y, 1) && f(x, y)) return [x, y]; return null; };
      const FR = find((x, y) => G.Tale.frenchForest(x, y), [-1, 6, 43, 50]), DE = find((x, y) => G.Tale.germanForest(x, y), [6, 15, 47, 55]);
      out.FR = FR;
      const said = [], asks = []; let answers = [];
      UI.say = async (t, w) => { said.push(((w && w.name) || '') + ': ' + t); }; UI.toast = (t) => { said.push('TOAST ' + t); };
      UI.ask = async (t, opts) => { asks.push(t + ' || ' + opts.map(o => o.label).join('|')); const a = answers.shift(); return a === undefined ? opts[0].value : a; };
      if (G.FamEv) G.FamEv.showPic = () => null;
      let duelRes = 'win', duelArgs = null; G.Games.duel = async (en, o) => { duelArgs = [en.name, o && o.place]; return duelRes; };
      s.loc.mode = 'land';
      const rooms = CB.rooms(), slot = 1;   // 처음 배(기함)는 갑판과 짐칸뿐 — 짐칸 하나를 고친다
      out.rooms0 = rooms.slice();
      // 1) 예배실이 없으면: 소문만
      CB.remodel(slot, 'galley');
      out.noChapel = await J.onCamp('herb', FR[0], FR[1], true); out.rumor = said.filter(x => /마녀를 태워라/.test(x)).length;
      // 2) 예배실이 있지만 사람이 있으면: 안 나온다
      CB.remodel(slot, 'chapel'); const priest = { id: 'rocco' }; const rm = s.mates[0]; CB.place(rm, slot);
      out.taken = await J.onCamp('herb', FR[0], FR[1], true);
      CB.place(rm, null); rm.role = 'first';   // 부관은 제자리로
      // 3) 빈 예배실: 휴식·헛걸음·독일 숲이면 안 나온다
      out.rest = await J.onCamp('rest', FR[0], FR[1], true);
      out.miss = await J.onCamp('herb', FR[0], FR[1], false);
      out.de = await J.onCamp('herb', DE[0], DE[1], true);
      // 4) 못 본 척 → 30일 뒤 다시
      said.length = 0; asks.length = 0; answers = [0];
      out.pass = await J.onCamp('herb', FR[0], FR[1], true); out.cool = J.state().cool - s.day; out.again = await J.onCamp('herb', FR[0], FR[1], true);
      // 5) 일기토에 진다
      s.day = J.state().cool; said.length = 0; answers = [1]; duelRes = 'lose';
      out.lose = await J.onCamp('herb', FR[0], FR[1], true); out.loseSaid = said.filter(x => /감옥|늦지 않았다/.test(x)).length;
      // 6) 이긴다 → 츤데레 · 합류 · 빈 예배실에
      s.day = J.state().cool; said.length = 0; asks.length = 0; answers = [1, 1]; duelRes = 'win';
      out.win = await J.onCamp('herb', FR[0], FR[1], true);
      const row = s.mates.find(m => m.id === 'joan_of_arc');
      out.row = row && { role: row.role, room: row.room, roomType: row.roomType };
      out.said = said.filter(x => /^오를레앙|^잔/.test(x)).map(x => x.slice(0, 70));
      out.tsun = said.some(x => /내가 이길 수 있었어/.test(x));
      out.duel = duelArgs; out.asks = asks;
      out.after = J.ready();
      // 7) 실제 야영 메뉴: 약초를 캔다 → 찾으면 이어진다 (새 판에서)
      return out;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 2600));
    ok(r.data.st.join() === '92,72,95,86' && r.data.eff.every(v => v === 3) && r.data.lg[2] === 3 && r.data.lg[3] === 3 && r.data.wage === 185 && r.data.g === 'f', '잔: 체력 92 · 무력 95 · 웅변·측량·운용·검술·신학 3 · 로망스어·게르만어 3 · 무급');
    ok(r.data.tone === 'tsun' && r.data.toneName === '츤데레형', '말투: 츤데레형');
    ok(r.FR && r.noChapel === false && r.rumor === 1, '기함에 예배실이 없으면 나오지 않고 고함 소문만 (한 번)');
    ok(r.taken === false, '예배실에 사람이 있으면 나오지 않는다');
    ok(r.rest === false && r.miss === false && r.de === false, '쉬기·약초 헛걸음·독일 숲에서는 나오지 않는다');
    ok(r.pass === false && r.cool === 30 && r.again === false, '못 본 척하면 30일 뒤에 다시');
    ok(r.lose === false && r.loseSaid >= 1, '일기토에 지면 감옥으로 끌려간다 — 다시 기회');
    ok(r.win === true && r.duel[0] === '마녀 사냥꾼 고셰' && r.duel[1] === 'land' && r.tsun, '화형대 앞 일기토(마녀 사냥꾼 고셰)에 이기면 「손만 묶여 있지 않았어도 내가 이길 수 있었어」');
    ok(r.row && r.row.roomType === 'chapel', '합류해 비어 있던 예배실에 든다 (' + JSON.stringify(r.row) + ')');
    ok(r.after === false, '한 번 합류하면 다시 나오지 않는다');
    // 실제 야영 메뉴에서
    const r2 = await page.evaluate(async () => {
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, CB = G.Cabins, rooms = CB.rooms(), slot = 1;   // 처음 배(기함)는 갑판과 짐칸뿐 — 짐칸 하나를 고친다
      CB.remodel(slot, 'chapel'); s.mates.forEach(m => { if (m.room === slot) CB.place(m, null); });
      const find = (f, box) => { for (let x = box[0]; x <= box[1]; x += 0.1) for (let y = box[2]; y <= box[3]; y += 0.1) if (!G.Geo.isSea(x, y, 1) && f(x, y)) return [x, y]; return null; };
      const FR = find((x, y) => G.Tale.frenchForest(x, y), [-1, 6, 43, 50]);
      const par = G.CITY_DATA.find(c => c.name === '파리');
      G.Game.go('land', { from: par.id, mount: { id: 'walk', n: 0 } }); await new Promise(r => setTimeout(r, 1500));
      s.loc.lon = FR[0]; s.loc.lat = FR[1];
      document.querySelectorAll('.modal-back').forEach(m => m.remove());
      const seen = []; let stage = 0;
      G.UI.say = async (t) => { seen.push(t.slice(0, 40)); };
      G.UI.ask = async (t, opts) => { seen.push('ASK ' + t.slice(0, 30)); const h = opts.find(o => o.value === 'herb'); if (h) return 'herb'; return opts[0].value; };
      G.Games.duel = async () => 'win';
      const uc = G.U.chance; G.U.chance = () => true;
      await G.Scenes.land.camp();
      G.U.chance = uc;
      return { seen: seen, room: (s.mates.find(m => m.id === 'joan_of_arc') || {}).roomType, joined: s.mates.some(m => m.id === 'joan_of_arc') };
    });
    console.log('   ' + JSON.stringify(r2.seen.slice(0, 3)) + ' … 예배실=' + r2.room);
    ok(r2.joined && r2.room === 'chapel' && r2.seen.some(x => /화형대/.test(x)), '실제 야영 메뉴: 프랑스 숲에서 「약초를 캔다」로 약초를 찾으면 화형대 사건이 이어진다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error(errors.slice(0, 3).join(' | ')); process.exitCode = 1; } finally { await browser.close(); }
})();
