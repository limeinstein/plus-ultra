/* QA 2026-10-10 고친 것 다섯 가지:
   1 선택창 질문의 셈(금화·남은 날)이 질문 아래에 남는다 · 2 튜토리얼의 공작이 헤라클레스의 동굴을 취향으로 본다
   3 파일에서 불러오기를 취소해도 끝난다(건물 메뉴가 잠기지 않는다) · 4 바다에서 멈춰도 시간이 흐른다 · 5 웅변 설득에도 승리·좌절 그림
   node tests/qa_fixes_smoke.js  (BROWSER_EXE=크로미움 경로) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
    });

    // ---- 1 질문의 셈
    const q = await page.evaluate(async () => {
      const toasts = [], t0 = G.UI.toast; G.UI.toast = (m) => { toasts.push(String(m)); };
      window.QA = G.UI.ask('구호금을 내어 도울까? (금화 1,200닢)', [{ label: '구호금을 낸다', value: 1 }, { label: '그만둔다', value: 0 }], {});
      await new Promise(r => setTimeout(r, 900));
      const dlg = [...document.querySelectorAll('.modal-back')].pop();
      const out = { note: (dlg.querySelector('.ask-note') || {}).textContent || '', body: dlg.querySelector('.body').textContent, toasts: toasts.slice() };
      dlg.querySelector('.askrow button').click(); await window.QA; G.UI.toast = t0;
      return out;
    });
    ok(/금화 1,200닢/.test(q.note) && !q.toasts.some(t => /1,200/.test(t)), '선택창: 「금화 1,200닢」이 질문 아래에 남는다 (알림으로 흘려보내지 않음) — ' + q.note);

    // ---- 2 튜토리얼 공작의 취향
    const t = await page.evaluate(() => {
      const sp = G.SPONSOR.es_medinaceli, d = G.DISC.herc_cave, tut = JSON.stringify(G.TUTORIAL || G.TUT || {});
      return { hit: G.tasteHit(sp.taste, d), taste: sp.taste.join(','), line: /전설과 보물/.test(tut) || /전설과 보물/.test(document.documentElement.innerHTML) };
    });
    ok(t.hit, '메디나셀리 공작(' + t.taste + ') 취향에 「헤라클레스의 동굴」이 든다 (★)');

    // ---- 3 파일 창을 닫으면 끝난다
    const f = await page.evaluate(async () => {
      const click0 = HTMLInputElement.prototype.click, out = {};
      HTMLInputElement.prototype.click = function () { if (this.type === 'file') { const me = this; setTimeout(() => me.dispatchEvent(new Event('cancel')), 100); } else click0.call(this); };
      out.cancel = await Promise.race([G.State.importFile(), new Promise(r => setTimeout(() => r('HANG'), 3000))]);
      // cancel을 모르는 브라우저: 페이지에 초점이 돌아오면 취소로 본다
      HTMLInputElement.prototype.click = function () { if (this.type === 'file') setTimeout(() => window.dispatchEvent(new Event('focus')), 500); else click0.call(this); };
      out.focus = await Promise.race([G.State.importFile(), new Promise(r => setTimeout(() => r('HANG'), 4000))]);
      // 여관 「기능 → 불러오기 → 파일에서」를 취소해도 건물 메뉴가 풀린다
      HTMLInputElement.prototype.click = function () { if (this.type === 'file') { const me = this; setTimeout(() => me.dispatchEvent(new Event('cancel')), 100); } else click0.call(this); };
      const C = G.Scenes.city, s = G.Game.state;
      s.loc = { mode: 'city', city: 0, lon: 0, lat: 0, via: 'sea' }; G.Game.go('city', { cityId: 0 });
      for (let i = 0; i < 600 && C.isBusy(); i++) await new Promise(r => setTimeout(r, 100));
      const ch0 = G.UI.choose, say0 = G.UI.say; G.UI.say = async () => {}; let n = 0; G.UI.choose = async (title, opts) => (n++ === 0 ? 'load' : 'file');
      C.visit('inn'); for (let i = 0; i < 600 && C.isBusy(); i++) await new Promise(r => setTimeout(r, 100));
      C.run(() => C.B.inn.func(C.city()));
      await new Promise(r => setTimeout(r, 1500));
      out.busy = C.isBusy(); out.inn = !!C.current(); out.kind = C.current() && C.current().kind; out.n = n; out.scene = G.Game.sceneName;
      G.UI.choose = ch0; G.UI.say = say0; HTMLInputElement.prototype.click = click0;
      return out;
    });
    ok(f.cancel === null && f.focus === null, '파일 창 취소 → 불러오기가 끝난다 (cancel: ' + f.cancel + ', 초점 복귀: ' + f.focus + ')');
    ok(f.busy === false && f.inn, '여관 「기능 → 항해 일지 불러오기 → 파일에서」 취소 뒤 건물 메뉴가 다시 눌린다 ' + JSON.stringify(f));

    // ---- 4 멈춰도 시간이 흐른다
    const w = await page.evaluate(async () => {
      const s = G.Game.state, UI = G.UI; UI.say = async () => {}; UI.alert = async () => {}; UI.ask = async (t, ch) => ch[ch.length - 1].value; UI.choose = async () => null; UI.confirm = async () => false;
      if (G.SEA_RISK) { G.SEA_RISK.pirate = 0; G.SEA_RISK.storm = 0; } G.Disc.find = async () => {}; G.Explore.report = async () => {}; G.Explore.milestones = async () => {};   // 시간이 흐르는 동안 끼어드는 일은 끈다
      G.Game.go('sea', { depart: 0 }); await new Promise(r => setTimeout(r, 1500));
      const SEA = G.Scenes.sea, st = SEA.runtime();
      st.paused = true; st.path = null; st.npcs = [{ id: 'm1', kind: 'merchant', lon: s.loc.lon - 1, lat: s.loc.lat, heading: Math.PI / 2, n: 1, K: 0, spd: 1, life: 60, hostile: false, zone: G.Ships.zone(s.loc.lon, s.loc.lat), ships: [] }];
      const d0 = s.day, f0 = s.fleet.food, p0 = [s.loc.lon, s.loc.lat], n0 = st.npcs[0] ? [st.npcs[0].lon, st.npcs[0].lat] : null;
      for (let i = 0; i < 60; i++) { SEA.update(0.1); await new Promise(r => setTimeout(r, 0)); }
      const n1 = st.npcs[0] ? [st.npcs[0].lon, st.npcs[0].lat] : null;
      const out = { days: s.day - d0, food: f0 - s.fleet.food, moved: G.Geo.dist(p0[0], p0[1], s.loc.lon, s.loc.lat), npcMoved: n0 && n1 ? G.Geo.dist(n0[0], n0[1], n1[0], n1[1]) : -1,
        hud: (document.querySelector('#hud') || document.body).innerText.indexOf('멈춤') >= 0 };
      G.FX.waitSpeed = 0; const d1 = s.day; for (let i = 0; i < 60; i++) { SEA.update(0.1); await new Promise(r => setTimeout(r, 0)); }
      out.off = s.day - d1; G.FX.waitSpeed = 1;
      return out;
    });
    ok(w.days >= 4 && w.food > 0 && w.moved < 0.01, '멈춘 채 6초: ' + w.days + '일이 지나고 식량이 줄며(' + w.food.toFixed(2) + ') 내 배는 제자리');
    ok(w.npcMoved > 0, '멈춰 있는 동안 다른 배는 제 갈 길을 간다 (' + w.npcMoved.toFixed(2) + '°)');
    ok(w.hud, '상태 줄: 「⚓ 멈춤 (시간은 흐른다)」');
    ok(w.off === 0, 'G.FX.waitSpeed = 0 이면 예전처럼 시간이 멈춘다');

    // ---- 5 웅변 설득의 승리·좌절 그림
    const p = await page.evaluate(async () => {
      const s = G.Game.state, UI = G.UI, U = G.U, SP = G.Sponsor, O = G.Outcome, out = {};
      Object.keys(O.KINDS).forEach(k => { O.KINDS[k].ms = 60; });
      const seen = []; const show0 = O.show; O.show = (k, o) => { seen.push(k); return show0(k, Object.assign({}, o, { ms: 60 })); };
      const keep = { say: UI.say, ask: UI.ask, choose: UI.choose, alert: UI.alert, rng: U.rng };
      UI.say = async () => {}; UI.alert = async () => {};
      G.Game.go('city', { cityId: 0 });
      const sp = G.SPONSOR.pt_king;
      const cand = G.DISCOVERIES.filter(x => !G.tasteHit(sp.taste, x) && x.pw <= sp.pw && x.how !== 'special' && !x.tale && G.Disc.available(x)).sort((a, b) => a.val - b.val); const d = cand[0]; out.n = cand.length;
      out.disc = d && d.name;
      s.player.fame = 9000; s.player.sk.speech = 3; s.contract = null; s.hints = {}; s.hints[d.id] = { src: 'test' };
      UI.ask = async (t, ch) => { const v = ch.map(o => o.value); return v.includes('go') ? 'go' : v.includes('no') ? 'no' : v[v.length - 1]; };
      UI.choose = async (t, ch) => { const o = (ch || []).find(x => String(x.label).indexOf(d.name) >= 0); return o ? o.value : null; };
      try {
        U.rng = () => 0.02; await SP.propose(sp); out.win = seen.splice(0);
        SP.rel(sp.id).anger = 0; SP.rel(sp.id).trust = 0; SP.rel(sp.id).fail = 3; s.contract = null;
        U.rng = () => 0.98; await SP.propose(sp); out.lose = seen.splice(0);
      } finally { Object.assign(UI, { say: keep.say, ask: keep.ask, choose: keep.choose, alert: keep.alert }); U.rng = keep.rng; O.show = show0; }
      return out;
    });
    ok(p.win[0] === 'win', '관심사 밖 「' + p.disc + '」을 웅변으로 설득해 냄 → 승리 그림 ' + JSON.stringify(p.win));
    ok(p.lose[0] === 'lose', '설득 실패 → 좌절 그림 ' + JSON.stringify(p.lose));
    await page.waitForTimeout(300);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; }
  finally { await browser.close(); }
})();
