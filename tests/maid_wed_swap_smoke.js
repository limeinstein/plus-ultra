/* 여급과 혼인하면 그 술집에는 새 여급이 선다 (js/systems/maidswap.js MS.wed — 2026-11-09 베타 피드백 #162)
   · 본처·둘째 부인 모두: 혼인한 여급은 더 이상 그 술집의 여급이 아니다 (술집 메뉴·서 있는 그림·거리 손님)
   · 새 여급의 얼굴은 그 고장 묶음에서 아직 아무도 쓰지 않는 그림 — 새로 그린(번호가 큰) 얼굴부터. 남은 얼굴이 없으면 기본 여급
   · 옛 저장(이미 혼인했는데 술집에 그대로 서 있던 여급)도 술집을 볼 때 바뀐다
   · 부인이 옛 술집에 들른다 (사는 도시 · 배에 함께) · 새 여급·기본 여급이 「언니 잘 지내요?」 · 「안부를 전한다」
   node tests/maid_wed_swap_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (/^ASKS/.test(m.text())) console.log('    ' + m.text()); });
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });
    await page.evaluate(() => {
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.player.gold = 100000; s.flags.prologue = true;
      s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; G.Game.go('city', { cityId: 0 });
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      document.querySelectorAll('.modal-back').forEach(e => e.remove());
      window._say = []; window._ask = [];
      const UI = G.UI;
      UI.say = async (t, who) => { _say.push(((who && who.name) || '') + ': ' + String(t)); };
      UI.alert = async (t) => { _say.push('ALERT: ' + String(t)); };
      UI.confirm = async () => true;
      UI.toast = (t) => { _say.push('TOAST: ' + String(t)); };
      window._answers = [];
      UI.ask = async (t, ch) => { _ask.push(String(t) + ' :: ' + ch.filter(Boolean).map(x => x.label || x).join('|')); return _answers.length ? _answers.shift() : null; };
      if (G.Outcome) G.Outcome.show = async () => {};
      if (G.FamEv) G.FamEv.wedding = async () => {};
      window._at = (cid) => { const m = G.MaidSwap.at(cid); return m ? { id: m.id, name: m.name, pic: m.pic || null, after: ((G.Game.state.maidGen || {})[m.id] || {}).after || null } : null; };
      window._go = async (cid) => {
        const C = G.Scenes.city, s = G.Game.state;
        if (C.current()) await C.leave();
        if (s.loc.city !== cid) { s.loc.city = cid; C.main && C.main(); await new Promise(r => setTimeout(r, 150)); }
      };
    });

    // ① 본처: 리스본(고향) 술집의 이네스에게 술집에서 청혼 → 새 여급
    const a = await page.evaluate(async () => {
      const s = G.Game.state, T = G.Scenes.city.B.tavern, c = G.CITY_DATA[0], m0 = G.MaidSwap.at(0);
      s.maids[m0.id] = { aff: 100, met: 3 }; G.R.addItem('ring'); if (!G.R.hasItem('ring')) s.player.items.push({ id: 'ring' });
      _answers = ['wed'];
      await T.maid(c, m0);
      const now = _at(0);
      console.log('ASKS ' + _ask.join(' ## ').slice(0, 400) + ' SAY ' + _say.join(' ## ').slice(0, 300));
      return { wife: s.player.wife, m0: m0.id, now, sub: T.sub(c), menu: T.menu(c).filter(Boolean).map(x => x.label + (x.sub ? '(' + x.sub + ')' : '')).join(','), alert: _say.filter(x => /^ALERT/.test(x)).pop() };
    });
    console.log('    ' + JSON.stringify(a.now) + ' · ' + a.alert);
    ok(a.wife === a.m0, '리스본 여급 ' + a.m0 + '과 결혼했다');
    ok(a.now && a.now.id !== a.m0 && /^maid-styles\//.test(a.now.pic || '') && a.now.after === a.m0, '리스본 술집에는 새 여급 ' + (a.now && a.now.name) + ' (' + (a.now && a.now.pic) + ')');
    ok(new RegExp(a.now.name).test(a.sub) && /새 여급/.test(a.alert), '술집 설명·혼인 알림에 새 여급: ' + a.sub);

    // ② 고르는 얼굴: 아무도 쓰지 않는 얼굴만 · 새 번호부터 — 암스테르담(저지대 묶음에 코덱스가 새로 그린 2~5번)
    const b = await page.evaluate(() => {
      const s = G.Game.state, I = G.Img, c = G.CITY_DATA[24], m = G.MaidSwap.at(24);
      const used = {}; (G.MAIDS || []).forEach(x => { const k = I.maidPic(x.id, G.CITY_DATA[x.city]); if (k) used[k] = 1; });
      Object.keys(s.maidGen).forEach(id => { if (s.maidGen[id].pic) used[s.maidGen[id].pic] = 1; });
      const pick = G.MaidSwap._freshFace(m.id, c);
      const pool = (I.maidPool(c) || []).map(st => st + ':' + I.maidList(st, c).length).join(' ');
      return { pick, pool, usedPick: !!used[pick], m: m.id };
    });
    console.log('    암스테르담 묶음 ' + b.pool + ' → ' + b.pick);
    ok(b.pick && !b.usedPick, '암스테르담: 아무도 쓰지 않는 얼굴 ' + b.pick);

    // ③ 둘째 부인: 암스테르담의 여급 → 그 도시에 집 · 새 여급
    const c2 = await page.evaluate(async () => {
      const s = G.Game.state, T = G.Scenes.city.B.tavern, c = G.CITY_DATA[24];
      s.loc.city = 24;
      const m0 = G.MaidSwap.at(24); s.maids[m0.id] = { aff: 100, met: 3 }; G.R.addItem('ring'); if (!G.R.hasItem('ring')) s.player.items.push({ id: 'ring' });
      _answers = ['wed'];
      await T.maid(c, m0);
      return { m0: m0.id, w2: (s.player.wives2 || []).map(w => w.id + '@' + w.city), now: _at(24) };
    });
    ok(c2.w2.indexOf(c2.m0 + '@24') >= 0 && c2.now && c2.now.id !== c2.m0, '둘째 부인(' + c2.m0 + ') — 암스테르담 술집에는 새 여급 ' + (c2.now && c2.now.name) + ' (' + (c2.now && c2.now.pic) + ')');

    // ④ 남은 얼굴이 없으면 기본 여급 — 세비야 (그림 목록을 비운다)
    const d = await page.evaluate(() => {
      const s = G.Game.state, I = G.Img, T = G.Scenes.city.B.tavern, c = G.CITY_DATA[7], m0 = G.MaidSwap.at(7);
      const ml = I.maidList; I.maidList = () => [];
      s.player.wives2.push({ id: m0.id, kind: 'maid', city: 7, house: true, aboard: false, wed: s.day, no: 3 });
      const now = G.MaidSwap.at(7); I.maidList = ml;
      return { m0: m0.id, now, mark: s.tavernMaid[7], sub: T.sub(c), menu: T.menu(c).filter(Boolean).some(x => x.label === '여급과 이야기' && !x.sub) };
    });
    ok(d.now === null && d.mark === '-' && /북적/.test(d.sub), '남은 얼굴이 없으면 이름 없는 기본 여급 (세비야: ' + d.sub + ')');

    // ⑤ 옛 저장: 이미 본처인데 술집에 그대로 서 있던 여급 — 술집을 볼 때 바뀐다
    const e = await page.evaluate(() => {
      const s = G.Game.state, old = s.player.wife, m = G.MAID['m_ham'];
      s.player.wife = 'm_ham'; delete s.tavernMaid[44]; if (s.maidPrev) delete s.maidPrev[44];
      const now = G.MaidSwap.at(44), girl = G.MaidSwap.at(44);
      s.player.wife = old;
      return { now, same: now && girl && now.id === girl.id };
    });
    ok(e.now && e.now.id !== 'm_ham' && e.same, '옛 저장의 부인(m_ham)도 함부르크 술집에서 내려오고 새 여급 ' + (e.now && e.now.name));

    // ⑥ 부인이 옛 술집에 들른다 — 본처(리스본에 산다) · 둘째(암스테르담 집) · 배에 함께
    const f = await page.evaluate(async () => {
      const s = G.Game.state, out = {};
      _say.length = 0; _ask.length = 0;
      out.home = await G.MaidSwap.wifeDrop(G.CITY_DATA[0], true); out.homeSay = _say.slice();
      _say.length = 0; _ask.length = 0; _answers = [null];
      out.w2 = await G.MaidSwap.wifeDrop(G.CITY_DATA[24], true); out.w2Say = _say.slice(); out.w2Ask = _ask.slice();
      _say.length = 0; s.player.wifeAboard = true; s.player.home = 0;
      out.aboard = await G.MaidSwap.wifeDrop(G.CITY_DATA[0], true); out.aboardSay = _say.slice(); s.player.wifeAboard = false;
      _say.length = 0;
      out.gap = await G.MaidSwap.wifeDrop(G.CITY_DATA[0], false);   // 방금 들렀다 — 20일 안에는 다시 오지 않는다
      out.none = await G.MaidSwap.wifeDrop(G.CITY_DATA[38], true);  // 런던: 혼인으로 떠난 여급이 없다
      return out;
    });
    console.log('    ' + f.homeSay.slice(0, 3).join(' / ').slice(0, 300));
    ok(f.home && f.homeSay.some(x => /언니! 잘 지내요\?/.test(x)), '본처가 리스본 술집에 남편을 찾으러 들르고, 새 여급이 「언니! 잘 지내요?」');
    ok(f.w2 && f.w2Ask.some(x => /함께 집으로 간다/.test(x)), '둘째 부인(암스테르담 집)도 들러 함께 집으로 가자고 한다');
    ok(f.aboard && f.aboardSay.some(x => /배를 타고 다니시는구나/.test(x)), '배에 함께 탄 부인은 옛 일터를 둘러보고 새 여급과 이야기한다');
    ok(!f.gap && !f.none, '20일 안에는 다시 들르지 않고, 떠난 여급이 없는 술집에는 없다');

    // ⑦ 새 여급과 이야기: 언니의 안부 · 「안부를 전한다」 / 기본 여급(세비야)도 안부
    const g = await page.evaluate(async () => {
      const s = G.Game.state, C = G.Scenes.city, T = C.B.tavern, out = {};
      s.loc.city = 24; const m = G.MaidSwap.at(24);
      const cur = {}; const cur0 = C.current; C.current = () => cur;
      _say.length = 0; _ask.length = 0; _answers = ['sis', null];
      await T.maid(G.CITY_DATA[24], m);
      out.say = _say.slice(); out.ask = _ask.slice(); out.aff = s.maids[m.id].aff;
      _say.length = 0; s.loc.city = 7; const cur2 = {}; C.current = () => cur2;   // 다른 술집에 새로 들어선 것으로
      await T.servant(G.CITY_DATA[7]); out.servant = _say.slice();
      C.current = cur0;
      return out;
    });
    console.log('    ' + g.say.join(' / ').slice(0, 300));
    ok(g.say.some(x => /언니/.test(x)) && g.ask.some(x => /의 안부를 전한다/.test(x)), '새 여급이 부인의 안부를 묻고, 「안부를 전한다」를 고를 수 있다');
    ok(g.aff === 3, '안부를 전하면 새 여급의 호감 +3 (한 번 들른 사이 한 번)');
    ok(g.servant.some(x => /언니/.test(x)), '기본 여급도 언니의 안부를 묻는다: ' + g.servant[0]);

    // ⑧ 저장·불러오기 뒤에도 새 여급이 그대로
    const h = await page.evaluate(() => {
      const before = { 0: _at(0), 24: _at(24), 7: _at(7) };
      const raw = G.State.serialize ? G.State.serialize(G.Game.state) : JSON.stringify(G.Game.state);
      G.Game.state = G.State.deserialize ? G.State.deserialize(raw) : JSON.parse(raw);
      const after = { 0: _at(0), 24: _at(24), 7: _at(7) };
      return { before, after };
    });
    ok(JSON.stringify(h.before) === JSON.stringify(h.after), '저장·불러오기 뒤에도 같은 여급');

    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('통과');
  } catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }
  await browser.close();
})();
