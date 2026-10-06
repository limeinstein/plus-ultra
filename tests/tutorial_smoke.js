/* 튜토리얼 「첫 항해」를 처음부터 끝까지 돌린다 (tests/tutorial_smoke.js) — node tests/tutorial_smoke.js   (BROWSER_EXE=크롬 경로)
   0 프롤로그 → 1 도서관 → 2 술집 → 3 고용 → 4 역할 → 5 후원자·출항 → 6 항해 → 7 선실 → 8 해전(물러났다가 다시 → 승리) → 9 세우타 입항
   → 10 성문 → 11 육상전 → 12 발견 → 13 귀환 → 14 산호 구입 → 15 자동항해 → 16 판매 → 17 보고 → 18 여관 저장 → 에필로그 → 본 게임으로.
   설명은 부하들이 말로 하는지(안내판에는 할 일만), 「다시 듣기」가 되는지도 본다. FROM=gate: 지난번에 떠 둔 9단계 뒤의 상태에서 이어 본다.
   대화창은 저절로 넘기고(Enter), 고를 것은 시험이 고른다. 느린 swiftshader에서 빨리 돌리려고 그림 칠하기를 끄고 장면의 update를 직접 돌린다. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const VERBOSE = !!process.env.VERBOSE, SHOTS = process.env.SHOTS || '/tmp/tut_shots';
require('fs').mkdirSync(SHOTS, { recursive: true });
let passed = 0;
function ok(v, msg) { if (!v) throw new Error(msg); passed++; console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => {
    // 시험 도우미. 그림 칠하기(rAF)는 시험이 박자를 정한다 — 도시에서는 제 박자로, 바다·뭍·해전에서는 드물게(느린 swiftshader)
    const TT = window.TT = { log: [], raf: [], slow: false, n: 0 };
    window.requestAnimationFrame = cb => { TT.raf.push(cb); return ++TT.n; };
    window.createImageBitmap = undefined;
    let lastPump = 0;
    setInterval(() => {
      const now = performance.now(); if (TT.slow && now - lastPump < 400) return; lastPump = now;
      const q = TT.raf; TT.raf = []; q.forEach(cb => { try { cb(now); } catch (e) { console.error(e); } });
    }, 16);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    TT.sleep = sleep;
    TT.top = () => [...document.querySelectorAll('#ui .modal-back')].pop() || null;
    TT.text = () => { const m = TT.top(); return m ? m.textContent : ''; };
    TT.kind = () => { const m = TT.top(); if (!m) return ''; if (m.querySelector('.askrow')) return 'ask'; if (m.querySelector('.win')) return 'win'; return 'say'; };
    TT.find = (txt, root) => [...(root || document.getElementById('ui')).querySelectorAll('.cmd, .choice, .btn, .hire-row, tr.click, .opt')].filter(e => !e.closest('.tutbox') && e.textContent.indexOf(txt) >= 0);
    TT.click = (txt, exact) => { const m = TT.top(); let c = TT.find(txt, m || undefined); if (exact) c = c.filter(e => e.textContent.trim() === txt); const e = c[0]; if (!e) return false; e.click(); return true; };
    TT.enter = () => { const m = TT.top(); if (!m) return; const d = m.querySelector('.dlg') || m; d.click(); };
    /** 조건이 될 때까지: 대화는 넘기고, 물음은 pref(글 → 고를 단추 글)로 고르고, 장면은 step()으로 돌린다 */
    TT.until = async (cond, o) => {
      o = o || {}; const t0 = Date.now(), max = o.ms || 60000;
      for (;;) {
        let r = false; try { r = await cond(); } catch (e) { r = false; }
        if (r) return r;
        if (Date.now() - t0 > max) throw new Error('시간 초과: ' + (o.what || cond.toString().slice(0, 80)) + ' | 단계 ' + G.Tutorial.step() + ' | 장면 ' + G.Game.sceneName + ' | 창: ' + TT.text().slice(0, 120));
        const k = TT.kind();
        if (k === 'say' && TT.hold && TT.hold.test(TT.text())) { TT.held = true; await sleep(80); continue; }   // 화면을 찍는 동안 대화창을 붙들어 둔다
        if (k === 'say') { TT.log.push(TT.text().slice(0, 160)); TT.enter(); await sleep(15); continue; }
        if (k === 'ask') {
          const txt = TT.text(); let done = false;
          for (const [re, lab] of (o.pref || [])) { if (re.test(txt) && TT.click(lab)) { done = true; break; } }
          if (!done) { const b = TT.top().querySelector('.askrow .btn'); if (b) b.click(); }
          await sleep(15); continue;
        }
        if (k === 'win') {
          let done = false; const txt = TT.text();
          for (const [re, lab] of (o.win || [])) { if (re.test(txt) && TT.click(lab)) { done = true; break; } }
          if (!done) { const m = TT.top(); const b = [...m.querySelectorAll('.btn')].filter(x => /확인|닫|계속|그대로|이대로|좋다|결정/.test(x.textContent))[0] || m.querySelector('.win .x'); if (b) b.click(); else TT.enter(); }
          await sleep(20); continue;
        }
        if (o.step) await o.step();
        await sleep(o.wait == null ? 30 : o.wait);
      }
    };
    /** 도시: 건물에 들어간다 / 메뉴를 누른다 */
    TT.visit = async (kind, arg) => { await TT.until(() => !G.UI.busy() && !G.Scenes.city.isBusy() && !G.Tutorial.busy(), { what: 'idle before visit ' + kind }); G.Scenes.city.visit(kind, arg); await sleep(60);
      // 그 건물에 들어서면 부하들이 설명한다(teachAt) — 다 들을 때까지
      await TT.until(() => { const t = G.Game.state.tut; if (!t) return true; const st = G.TUTORIAL.steps[t.step]; if (!t.f['in_' + st.id]) return true; return !(st.teach && st.teachAt === kind && !t.f['t_' + st.id] && G.Scenes.city.current() && G.Scenes.city.current().kind === kind) && !G.UI.busy() && !G.Tutorial.busy(); }, { what: '설명 ' + kind }); };
    TT.menu = async (label) => { await TT.until(() => !G.UI.busy() && !G.Scenes.city.isBusy() && !G.Tutorial.busy() && TT.find(label).some(e => e.classList.contains('cmd')), { what: 'menu ' + label }); TT.find(label).filter(e => e.classList.contains('cmd') && e.querySelector('span').textContent.trim() === label)[0].click(); await sleep(60); };
    TT.stepIs = id => G.Tutorial.step() === id;
    TT.sea = () => G.Scenes.sea.runtime();
  });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Tutorial && G.Tutorial.begin, null, { timeout: 90000 });
    await ev(async () => { await G.Game.ensureGeo(); if (G.Nav && G.Nav.init) G.Nav.init(); });
    const titleBtn = await ev(() => [...document.querySelectorAll('.title-menu .btn')].map(b => b.textContent.trim()).join('|'));
    ok(/첫 항해 \(튜토리얼\)/.test(titleBtn), '타이틀에 「첫 항해 (튜토리얼)」 단추: ' + titleBtn);
    ok(await ev(() => !!G.DISC.herc_cave && G.BOOKS.some(b => b.id === 'b_mela') && G.Geo.isLand(G.DISC.herc_cave.lon, G.DISC.herc_cave.lat)), '자료: 책 b_mela · 발견물 herc_cave(뭍 위)');

    let r;
    // FROM=gate: 앞부분(0~9단계)을 건너뛰고, 지난번에 떠 둔 9단계 뒤의 상태에서 이어 본다 (고칠 때 빨리 보려고)
    const SNAP = path.join(SHOTS, 'state_after_9.json'), fs = require('fs');
    if (process.env.FROM === 'gate' && fs.existsSync(SNAP)) {
      await ev(async data => { G.UI.fade = async fn => { fn(); }; G.Game.state = G.State.deserialize(data); G.Game.resume(); await TT.sleep(500); }, fs.readFileSync(SNAP, 'utf8'));
      console.log('  (9단계 뒤의 상태에서 이어 본다)');
    } else {
    // ---- 시작
    r = await ev(async () => {
      G.UI.prompt = async () => '알론소 데 몬테로';
      G.UI.fade = async fn => { fn(); };
      await G.Tutorial.begin();
      const s = G.Game.state;
      return { tut: !!s.tut, name: s.player.name, nation: s.player.nation, gold: s.player.gold, ship: s.fleet.ships[0].name, diff: s.settings.diff, sk: JSON.stringify(s.player.sk), scene: G.Game.sceneName, city: s.loc.city };
    });
    ok(r.tut && r.nation === 'ES' && r.gold === 3000 && r.ship === '에스페란사' && r.diff === 'easy' && r.city === 7, '시작: ' + JSON.stringify(r));

    // ---- 0 프롤로그 → 1 도서관
    r = await ev(async () => {
      await TT.until(() => !!G.Game.state.tut.f.in_prologue && !G.UI.busy() && !G.Tutorial.busy(), { what: '프롤로그 대사' });
      const box = document.querySelector('.tutbox'); const o = { box0: box ? box.textContent.slice(0, 80) : '' };
      // 순서에 없는 건물: 로코가 말린다
      const n0 = TT.log.length; G.Scenes.city.visit('tavern'); await TT.sleep(80);
      await TT.until(() => !G.UI.busy() && !G.Tutorial.busy(), {});
      o.blocked = TT.log.slice(n0).join(' / ') + ' → ' + (G.Scenes.city.current() ? G.Scenes.city.current().kind : '거리');
      await TT.visit('library');
      await TT.until(() => TT.stepIs('library') && !!G.Game.state.tut.f.in_library && !G.UI.busy() && !G.Tutorial.busy(), { what: '도서관 여는 대사' });
      o.glow = [...document.querySelectorAll('.tut-glow')].map(e => e.textContent.trim().slice(0, 12)).join(',');
      o.teach = TT.log.some(x => /책등 색을 보십시오/.test(x)) && !!G.Game.state.tut.f.t_library;
      o.box = document.querySelector('.tutbox').textContent; o.tipList = !!document.querySelector('.tutbox li, .tutbox .tb-t');
      // 「다시 듣기」
      const n1 = TT.log.length; document.querySelector('.tutbox [data-act=again]').click(); await TT.sleep(80);
      await TT.until(() => !G.UI.busy() && !G.Tutorial.busy(), {});
      o.again = new Set(TT.log.slice(n1).filter(x => /책등 색을 보십시오|두 가지가 있어야/.test(x)).map(x => x.slice(0, 12))).size;
      return o;
    });
    ok(r.teach && !r.tipList && /다시 듣기/.test(r.box) && r.again === 2, '설명은 부하가 말로 한다(로코: 서가·책등 색·읽는 조건) · 안내판에는 할 일만 · 「다시 듣기」 (' + r.again + '줄 다시)');
    ok(/첫 항해/.test(r.box0) && /도서관이 먼저/.test(r.blocked) && /거리$/.test(r.blocked), '0 프롤로그: 안내 상자 · 다른 건물은 로코가 말린다 (' + r.blocked.slice(0, 60) + ')');
    ok(/열람/.test(r.glow), '빛나는 단추: ' + r.glow);
    await page.screenshot({ path: SHOTS + '/01_library.png' });

    // ---- 1 도서관: 멜라의 『지지』
    r = await ev(async () => {
      const C = G.Scenes.city, LB = C.B.library, c = G.CITY_DATA[7], b = G.BOOKS.find(x => x.id === 'b_mela'), o = {};
      o.shelf = LB.shelfBooks(c).some(x => x.id === 'b_mela') + ':' + LB.shelfState(b).kind;
      const d0 = G.Game.state.day;
      C.run(() => LB.pick(c, b));
      await TT.until(() => TT.stepIs('tavern') && !!G.Game.state.tut.f.in_tavern && !G.UI.busy() && !G.Tutorial.busy(), { what: '책을 읽고 술집 단계로' });
      o.hint = !!G.Game.state.hints.herc_cave; o.days = G.Game.state.day - d0;
      o.said = TT.log.filter(x => /헤라클레스께 바쳐진 동굴/.test(x)).length;
      return o;
    });
    ok(r.shelf === 'true:open' && r.hint && r.days === 1 && r.said >= 1, '1 도서관: 서가에 『지지』 · 읽으면 하루가 가고 단서 「헤라클레스의 동굴」 (' + JSON.stringify(r) + ')');

    // ---- 2 술집 · 3 고용 · 4 역할
    r = await ev(async () => {
      const C = G.Scenes.city, s = G.Game.state, o = {};
      await TT.menu('도서관을 나온다').catch(() => {});
      await TT.until(() => !!s.tut.f.in_tavern && !G.UI.busy() && !G.Tutorial.busy(), { what: '술집 단계 여는 대사' });
      await TT.visit('tavern');
      await TT.menu('술을 마신다');
      await TT.menu('여급과 이야기');
      await TT.until(() => TT.stepIs('hire') && !!s.tut.f.in_hire && !G.UI.busy() && !G.Tutorial.busy(), { what: '술집 단계 끝', pref: [[/호감|카르멘/, '돌아간다']] });
      o.drink = TT.log.some(x => /바르바리 해적 푸스타/.test(x)); o.maid = TT.log.some(x => /바스크 사람/.test(x));
      o.cands = C.B.tavern.candidates(G.CITY_DATA[7]).map(m => m.id).join(',');
      // 고용: 명부에서 고르고 → 부하로 고용한다 → 고용한다
      for (const id of ['lacosa', 'arana']) {
        await TT.menu('항해사를 찾는다');
        await TT.until(() => TT.kind() === 'win' && TT.find(G.MATE[id].name).length > 0, { what: '명부 ' + id, win: [[/^$/, 'x']] });
        const row = TT.find(G.MATE[id].name).filter(e => e.classList.contains('hire-row'))[0]; row.click(); await TT.sleep(40);
        row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        await TT.until(() => s.mates.some(m => m.id === id), { what: '고용 ' + id, pref: [[/무슨 용건/, '부하로 고용한다'], [/뭐라고 답할까/, '쓰겠소']], win: [[/고용하겠습니까/, '고용한다']] });
        await TT.until(() => !G.UI.busy() || TT.kind() === 'win', { what: '고용 뒤' });
        if (TT.kind() === 'win') { const x = TT.top().querySelector('.win .x'); if (x) x.click(); }
        await TT.until(() => !G.UI.busy() && !C.isBusy(), { what: '명부 닫기', pref: [[/무슨 용건/, '떠난다']] });
      }
      o.mates = s.mates.map(m => m.id + ':' + m.role + ':' + m.loyal).join(',');
      o.fame = G.MATE.lacosa.fame + '/' + s.player.fame;
      await TT.until(() => TT.stepIs('roles') && !!s.tut.f.in_roles && !G.UI.busy() && !G.Tutorial.busy(), { what: '역할 단계 여는 대사' });
      // 부하편성 → 라 코사 → 기함 측량사
      await TT.menu('부하편성');
      await TT.until(() => TT.kind() === 'win' && TT.find('후안 데 라 코사').length > 0, { what: '부하편성 창' });
      o.glow = [...document.querySelectorAll('.tut-glow')].map(e => e.textContent.trim().slice(0, 10)).join(',');
      TT.click('후안 데 라 코사'); await TT.sleep(60);
      await TT.until(() => TT.kind() === 'win' && TT.find('기함 측량사').length > 0, { what: '역할 고르기' });
      TT.click('기함 측량사'); await TT.sleep(60);
      await TT.until(() => TT.kind() === 'win' && TT.find('기함 선실').length > 0, { what: '부하편성으로 돌아옴' });
      TT.top().querySelector('.win .x').click();
      await TT.until(() => TT.stepIs('sponsor') && !!s.tut.f.in_sponsor && !G.UI.busy() && !G.Tutorial.busy(), { what: '후원자 단계 여는 대사' });
      o.role = s.mates.map(m => m.id + ':' + m.role).join(',');
      o.said = TT.log.some(x => /돛대 꼭대기는 내 자리요/.test(x));
      return o;
    });
    ok(r.drink && r.maid && /lacosa/.test(r.cands) && /arana/.test(r.cands), '2 술집: 술을 마시고 여급과 이야기 → 명부에 라 코사·아라나 (' + r.cands + ')');
    ok(/lacosa:none:70/.test(r.mates) && /arana:none:70/.test(r.mates) && r.fame === '0/0', '3 고용: 필요 명성 면제, 둘 다 대기·충성 70 (' + r.mates + ')');
    ok(/lacosa:surveyor/.test(r.role) && /arana:none/.test(r.role) && r.said, '4 역할: 라 코사 측량사, 아라나 대기 (' + r.role + ') · 빛나는 것: ' + r.glow);
    await page.screenshot({ path: SHOTS + '/04_roles_done.png' });

    // ---- 5 후원자: 메디나셀리 공작과 계약 → 출항
    r = await ev(async () => {
      const C = G.Scenes.city, s = G.Game.state, o = {};
      await TT.menu('술집을 나온다');
      // 다른 저택은 로코가 말린다
      const n0 = TT.log.length; C.visit('palace'); await TT.sleep(80); await TT.until(() => !G.UI.busy() && !G.Tutorial.busy(), {});
      o.other = TT.log.slice(n0).join('/').slice(0, 40);
      await TT.visit('mansion', 'es_medinaceli');
      await TT.until(() => !!s.tut.f.dukeIn && !G.UI.busy() && !C.isBusy() && !G.Tutorial.busy(), { what: '공작 알현' });
      o.in = C.current() && C.current().kind;
      await TT.menu('모험 제안');
      await TT.until(() => !!s.contract, { what: '계약', pref: [[/선금/, '승낙한다'], [/빌려주겠네/, '괜찮습니다']], win: [[/제안 선택/, '헤라클레스의 동굴'], [/계약하시겠습니까/, '계약한다']] });
      await TT.until(() => TT.stepIs('depart') && !!s.tut.f.in_depart && !G.UI.busy() && !G.Tutorial.busy(), { what: '출항 단계 여는 대사' });
      o.contract = s.contract.sponsor + ':' + s.contract.disc + ':' + s.contract.advance + ':' + s.contract.reward;
      o.call = TT.log.some(x => /이제부터 저도 제독이라 부르겠습니다/.test(x));
      await TT.menu(/저택/.test(document.querySelector('.cmd.exit') ? document.querySelector('.cmd.exit').textContent : '') ? document.querySelector('.cmd.exit span').textContent.trim() : '저택을 나온다');
      await TT.visit('harbor');
      // 출항 준비: 40일치
      await TT.menu('출항 준비');
      return o;
    });
    ok(/세르다 저택/.test(r.other) && r.in === 'mansion' && /^es_medinaceli:herc_cave:/.test(r.contract) && r.call, '5 후원자: 공작과 계약 (' + r.contract + '), 「제독」이라 부르기 시작 · 다른 나리는 다음에 (' + r.other + ')');
    await page.waitForTimeout(600);
    await page.screenshot({ path: SHOTS + '/05_prep.png' });

    r = await ev(async () => {
      const C = G.Scenes.city, s = G.Game.state, o = {};
      TT.click('40일'); await TT.sleep(40); TT.click('결정', true);
      await TT.until(() => G.Game.sceneName === 'sea' || (!G.UI.busy() && !C.isBusy()), { what: '출항 준비 끝', pref: [[/출항하겠습니까|출항/, '출항한다']] });
      if (G.Game.sceneName !== 'sea') { await TT.menu('출항'); await TT.until(() => G.Game.sceneName === 'sea', { what: '출항', pref: [[/출항하겠습니까/, '출항한다']] }); }
      o.food = G.R.daysOfFood(); o.crew = s.fleet.crew;
      return o;
    });
    ok(r.food >= 30, '출항 준비 40일치를 싣고 출항 (식량 ' + r.food + '일 · 선원 ' + r.crew + '명)');

    // ---- 6 항해 · 7 선실
    r = await ev(async () => {
      TT.slow = true;
      const s = G.Game.state, SEA = G.Scenes.sea, o = {};
      const sail = async () => { const st = SEA.runtime(); if (G.Game.sceneName === 'sea' && st && !G.UI.busy() && !st.busy) { if (!G.Tutorial.pending() && st.paused && !st.pendingPort) { if (st.path || st.dirCrs != null) SEA.resume(); else G.Tutorial.helm(); } st.speed = 2; SEA.update(0.05); } };
      await TT.until(() => TT.stepIs('sail') && !!s.tut.f.t_sail && !G.UI.busy() && !G.Tutorial.busy(), { what: '항해 단계 여는 대사' });
      o.risk = G.SEA_RISK.pirate + '/' + G.SEA_RISK.storm;
      await TT.sleep(500); o.helm = !!document.querySelector('.tutbox [data-act=helm]'); document.querySelector('.tutbox [data-act=helm]').click();
      const st0 = SEA.runtime(); o.course = !!(st0.path || st0.dirCrs != null) + ':' + !!st0.autoOn;
      await TT.until(() => TT.stepIs('cabin') && !!s.tut.f.in_cabin && !G.UI.busy() && !G.Tutorial.busy(), { what: '하루 항해 → 선실 단계', step: sail, wait: 5, ms: 90000 });
      o.day = s.day; o.paused = SEA.runtime().paused;
      // 수첩 → 함대 → 기함 선실을 열어 본다 (창이 뜨는지), 아라나를 갑판에
      const p = G.CabinView.open(); await TT.sleep(300);
      o.cabinWin = /기함 선실/.test(TT.text());
      const ar = s.mates.find(m => m.id === 'arana'); G.Cabins.place(ar, 0);
      const x = TT.top() && TT.top().querySelector('.win .x'); if (x) x.click(); await p.catch(() => {});
      await TT.until(() => TT.stepIs('battle') && !G.UI.busy() && !G.Tutorial.busy(), { what: '선실 단계 끝' });
      o.room = ar.room + ':' + G.Cabins.placeName(ar); o.said = TT.log.some(x => /모두가 내 눈 안에 있군/.test(x));
      return o;
    });
    ok(r.risk === '0/0' && r.helm && /^true:false/.test(r.course) && r.cabinWin && /^0:/.test(r.room) && r.said, '6 항해 · 7 선실: 곧장 침로(자동항해 아님), 하루 뒤 선실 안내, 아라나를 갑판에 (' + JSON.stringify(r) + ')');

    // ---- 8 해전: 해적 푸스타 → 물러났다가 「약하게 하고 다시」 → 승리
    r = await ev(async () => {
      const s = G.Game.state, SEA = G.Scenes.sea, B = G.Scenes.battle, o = {};
      const sail = async () => { const st = SEA.runtime(); if (G.Game.sceneName === 'sea' && st && !G.UI.busy() && !st.busy) { if (!G.Tutorial.pending() && st.paused && !st.pendingPort) { if (st.path || st.dirCrs != null) SEA.resume(); else G.Tutorial.helm(); } st.speed = 2; SEA.update(0.05); } };
      await TT.until(() => G.Game.sceneName === 'battle', { what: '해적과 만나 해전으로', step: sail, wait: 5, ms: 110000, pref: [[/해적/, '싸운다']] });
      o.sighted = TT.log.some(x => /노가 쉰 개는 되겠어/.test(x)); o.day = s.day;
      await TT.until(() => !!s.tut.f.battleIn && !G.UI.busy() && !G.Tutorial.busy(), { what: '해전 여는 말' });
      const bs = B.runtime(); o.paused = bs.paused; o.enemy = bs.ships.filter(b => b.side === 'en').map(b => b.type + ':' + b.crew).join(',') + ' vs ' + bs.ships.filter(b => b.side === 'me').map(b => b.type + ':' + b.crew).join(',');
      o.tips = TT.log.some(x => /대포는 배 옆구리에/.test(x)) && TT.log.some(x => /배를 붙이고 칼로 싸우오/.test(x));
      const gold0 = s.player.gold;
      // 물러난다 → 다시 (약하게)
      bs.paused = false; bs.myFlag.fled = true;
      await TT.until(() => /밀렸다/.test(TT.text()), { what: '졌을 때의 물음', step: async () => { if (G.Game.sceneName === 'battle' && !G.UI.busy()) B.update(0.05); }, wait: 10, pref: [[/zzz/, 'x']], ms: 30000 }).catch(e => { o.err = e.message; });
      TT.click('적을 약하게 하고 다시');
      await TT.until(() => G.Game.sceneName === 'battle' && B.runtime() && B.runtime() !== bs && !!G.Game.state.tut.f.battleIn && !G.UI.busy() && !G.Tutorial.busy(), { what: '다시 시작한 해전' });
      const s2 = G.Game.state, b2 = B.runtime();
      o.again = (s2.tut.f.weak || 0) + ':' + b2.paused + ':' + b2.ships.filter(b => b.side === 'en').map(b => b.crew).join(',') + ':' + (s2.player.gold === gold0);
      // 이긴다
      b2.paused = false; const ef = b2.enFlag; ef.alive = false; ef.sunk = true; ef.hp = 0;
      await TT.until(() => G.Game.sceneName === 'sea' && !G.UI.busy() && !!G.Game.state.tut.f.won && !G.Tutorial.busy(), { what: '승리하고 바다로', step: async () => { if (G.Game.sceneName === 'battle' && !G.UI.busy()) B.update(0.05); }, wait: 10, ms: 60000 });
      o.won = G.Game.state.stats.wins + ':' + TT.log.some(x => /첫 해전을 이기셨군요/.test(x));
      return o;
    });
    ok(r.sighted && r.paused && r.tips && /fusta/.test(r.enemy), '8 해전: 해적 푸스타가 나타나 덤비고, 해전은 멈춘 채 시작 (' + r.enemy + ', ' + r.day + '일째) ' + JSON.stringify([r.sighted, r.paused, r.tips]));
    ok(!r.err && /^1:true:/.test(r.again) && /:true$/.test(r.again), '   물러나면 「다시」 — 상태를 되돌리고 적을 약하게 (' + r.again + ')');
    ok(/^1:true$/.test(r.won), '   승리 → 바다로 돌아와 로코의 한마디');

    // ---- 9 세우타 입항
    r = await ev(async () => {
      const SEA = G.Scenes.sea, o = {};
      const s = () => G.Game.state;
      const sail = async () => { const st = SEA.runtime(); if (G.Game.sceneName === 'sea' && st && !G.UI.busy() && !st.busy) { if (!G.Tutorial.pending() && st.paused && !st.pendingPort) { if (st.path || st.dirCrs != null) SEA.resume(); else G.Tutorial.helm(); } st.speed = 2; SEA.update(0.05); } };
      let ld = -1; o.track = []; const sail0 = sail; const sailT = async () => { const g = s(); if (g.day !== ld) { ld = g.day; const st = SEA.runtime(); o.track.push(g.day + ':' + g.loc.lon.toFixed(2) + ',' + g.loc.lat.toFixed(2) + (st ? (st.paused ? 'P' : '') + (st.path ? 'p' : '') + (st.stopping ? 's' : '') : '')); } await sail0(); };
      await TT.until(() => G.Game.sceneName === 'city' && s().loc.city === 84, { what: '세우타 입항', step: sailT, wait: 5, ms: 110000, pref: [[/해적/, '싸운다']] });
      TT.slow = false;
      await TT.until(() => TT.stepIs('gate') && !!s().tut.f.in_gate && !G.UI.busy() && !G.Tutorial.busy(), { what: '입항 뒤 성문 단계' });
      o.day = s().day; o.route = G.Routes.isOpen(7, 84); o.strait = !!s().tut.f.strait; o.found = s().stats.found;
      o.said = TT.log.some(x => /제노바 뱃사람은 돈 되는 말은 다 합니다/.test(x)); o.fad = !!G.Fad.at(G.CITY_DATA[7], 'coral');
      return o;
    });
    ok(r.route && r.said && r.found === 0 && r.fad, '9 입항: 세우타(' + r.day + '일째, ' + r.track.join(' ') + ') · 세빌리아–세우타 항로 열림 · 다른 발견 없음 · 지브롤터 덧장면 ' + (r.strait ? '봄' : '안 봄'));
    await page.screenshot({ path: SHOTS + '/09_ceuta.png' });

    fs.writeFileSync(SNAP, await ev(() => G.State.serialize()));
    }

    // ---- 10 성문 → 뭍 · 11 육상전(지면 다시) · 12 발견
    await ev(() => { TT.hold = /다가갈수록 표식이 좁아지오/; TT.held = false; });
    const shot = page.waitForFunction(() => TT.held, null, { timeout: 200000 }).then(async () => { await page.waitForTimeout(900); await page.screenshot({ path: SHOTS + '/10_land_talk.png' }); await page.evaluate(() => { TT.hold = null; }); }).catch(() => page.evaluate(() => { TT.hold = null; }));
    r = await ev(async () => {
      const C = G.Scenes.city, L = G.Scenes.land, o = {}, s = G.Game.state;
      await TT.until(() => !!s.tut.f.in_gate && !G.UI.busy() && !C.isBusy() && !G.Tutorial.busy(), { what: '성문 단계 여는 대사' });
      const n0 = TT.log.length; C.visit('trade'); await TT.sleep(80); await TT.until(() => !G.UI.busy() && !G.Tutorial.busy(), {});
      o.blocked = TT.log.slice(n0).join('/').slice(0, 30);
      await TT.visit('gate');
      o.teach = TT.log.some(x => /말보다 당나귀가 낫소/.test(x)); const day0 = s.day;
      await TT.menu('탐험을 떠난다');
      await TT.until(() => TT.kind() === 'win' && /마구간/.test(TT.text()), { what: '탈것 고르기 창' });
      o.outfit = [...TT.top().querySelectorAll('.btn')].map(b => b.textContent.trim()).join('|').slice(0, 60);
      TT.top().querySelector('.of-card[data-id=donkey]').click(); await TT.sleep(60);
      o.go = TT.top().querySelector('.btn.navy').textContent.trim() + (TT.top().querySelector('.btn.navy').classList.contains('tut-glow') ? ' (빛남)' : '');
      await TT.sleep(450); o.go = TT.top().querySelector('.btn.navy').textContent.trim() + (TT.top().querySelector('.btn.navy').classList.contains('tut-glow') ? ' (빛남)' : '');
      TT.top().querySelector('.btn.navy').click();
      await TT.until(() => G.Game.sceneName === 'land', { what: '뭍으로', ms: 20000, pref: [[/탐험을 떠납니까/, '떠난다']] });
      TT.slow = true;
      await TT.until(() => !!s.tut.f.landSaid && !G.UI.busy() && !G.Tutorial.busy(), { what: '뭍의 설명' });
      o.land = TT.log.some(x => /흐릿한 「\?」를 찍겠소/.test(x)) && TT.log.some(x => /지치면 야영하시오/.test(x));
      // 육상전은 시험이 대신 치른다: 처음에는 지고, 약하게 한 다음에 이긴다
      const calls = []; const lw0 = G.Games.landWar;
      G.Games.landWar = async a => { calls.push(a.enemy.n + ':' + a.terr); return calls.length === 1 ? { res: 'lose', left: 2, dead: 9 } : { res: 'win', left: a.party - 1, leaderDown: true, dead: 1 }; };
      const way = [[-5.45, 35.62], [-5.9, 35.66], [G.DISC.herc_cave.lon, G.DISC.herc_cave.lat]]; let wi = 0;
      const walk = async () => {
        const st = L.runtime(); if (G.Game.sceneName !== 'land' || !st || G.UI.busy() || st.busy || G.Tutorial.pending()) return;
        const l = s.loc; while (wi < way.length - 1 && G.Geo.dist(l.lon, l.lat, way[wi][0], way[wi][1]) < 0.06) wi++;
        if (!st.path || st.path[0] !== way[wi][0]) st.path = way[wi].slice();
        st.paused = false; st.speed = 1; L.update(0.05);
      };
      const crew0 = s.fleet.crew, fame0 = s.player.fame, gold0 = s.player.gold;
      await TT.until(() => TT.stepIs('return') && !!s.tut.f.t_return && !G.UI.busy() && !G.Tutorial.busy(), { what: '뭍을 걸어 도적 떼 → 동굴 발견', step: walk, wait: 4, ms: 150000, pref: [[/도적 떼에게 밀렸다/, '적을 약하게 하고 다시']] });
      G.Games.landWar = lw0;
      o.calls = calls.join(','); o.crew = crew0 + '→' + s.fleet.crew; o.gold = s.player.gold - gold0;
      o.found = !!G.Disc.foundByMe('herc_cave') + ':' + s.stats.found + ':' + (s.player.fame - fame0) + ':' + !!(s.disc.herc_cave && s.disc.herc_cave.reported);
      o.said = ['법을 모르는 놈들이군', '우두머리를 쓰러뜨리면', '이제 반쯤 제독이시군요', '저 벼랑 아래요', '공작께 보고해야 받지', '마구간에 그대로 맡겨지오'].map(k => TT.log.some(x => x.indexOf(k) >= 0) ? 1 : 0).join('');
      o.days = s.loc.days; o.glow = [...document.querySelectorAll('.tut-glow')].map(e => e.textContent.trim()).join(',');
      return o;
    });
    await shot;
    if (VERBOSE) console.log(JSON.stringify(r));
    ok(/뭍으로 갑니다/.test(r.blocked) && r.teach && /당나귀와 떠난다.*빛남/.test(r.go) && r.land, '10 성문: 탈것 창에서 ' + r.go + ' → 뭍 · 라 코사·아라나가 걷기·「?」·야영을 일러 준다');
    ok(r.calls === '9:mountain,5:mountain' && r.gold > 0, '11 육상전: 도적 9명 — 지면 「약하게 하고 다시」(5명) → 승리 (대원 ' + r.crew + ', 금화 +' + r.gold + ')');
    ok(/^true:1:\d+:false$/.test(r.found) && +r.found.split(':')[2] > 0 && r.said === '111111', '12 발견: 헤라클레스의 동굴 (그 자리에서 명성 +' + r.found.split(':')[2] + ', 보고는 아직) · 대사 ' + r.said + ' · 뭍에서 ' + r.days + '일');
    ok(/출발지로 돌아간다/.test(r.glow), '13 귀환: 빛나는 단추 ' + r.glow);
    await page.screenshot({ path: SHOTS + '/12_found.png' });

    // ---- 13 귀환 → 14 산호 구입
    r = await ev(async () => {
      const C = G.Scenes.city, L = G.Scenes.land, o = {}, s = G.Game.state;
      const back = async () => {
        const st = L.runtime(); if (G.Game.sceneName !== 'land' || !st || G.UI.busy() || st.busy) return;
        if (st.paused && !st.path) { const b = TT.find('도시로 돌아간다')[0] || TT.find('출발지로 돌아간다')[0]; if (b) b.click(); L.update(0.05); await TT.sleep(30); return; }
        st.paused = false; st.speed = 1; L.update(0.05);
      };
      await TT.until(() => G.Game.sceneName === 'city' && s.loc.city === 84, { what: '세우타로 귀환', step: back, wait: 4, ms: 120000, pref: [[/걸어서 돌아갑니다/, '돌아간다']] });
      TT.slow = false;
      await TT.until(() => TT.stepIs('buy') && !!s.tut.f.in_buy && !G.UI.busy() && !G.Tutorial.busy(), { what: '구입 단계 여는 대사' });
      o.day = s.day;
      await TT.visit('trade');
      o.teach = TT.log.some(x => /산호가 유행/.test(x)) && TT.log.some(x => /카라벨은 백일흔 통/.test(x));
      G.UI.number = async q => Math.min(18, q.max);
      const gold0 = s.player.gold;
      await TT.menu('구입');
      await TT.until(() => TT.kind() === 'win' && /구입 — 세우타/.test(TT.text()), { what: '구입 창' });
      await TT.sleep(450);
      o.glow = [...document.querySelectorAll('.tut-glow')].map(e => e.textContent.trim().slice(0, 6)).join(',');
      TT.top().querySelector('tr.click[data-id=coral]').click();
      await TT.until(() => !!s.fleet.cargo.coral && TT.kind() === 'win' && /구입 — 세우타/.test(TT.text()), { what: '산호를 샀다' });
      TT.click('돌아간다', true);
      await TT.until(() => TT.stepIs('auto') && !!s.tut.f.t_auto && !G.UI.busy() && !G.Tutorial.busy(), { what: '자동항해 단계 여는 대사' });
      o.coral = s.fleet.cargo.coral.q + ':' + s.fleet.cargo.coral.cost + ':' + (gold0 - s.player.gold);
      o.sellAt = G.Scenes.city.B.trade.quoteTable ? 0 : 0;
      return o;
    });
    ok(r.teach && /^18:\d+:\d+$/.test(r.coral) && /산호/.test(r.glow), '13 귀환(' + r.day + '일째) · 14 구입: 로코·아라나의 설명 뒤 산호 18통 (' + r.coral + ') · 빛나는 것 ' + r.glow);

    // ---- 15 자동항해 → 16 판매
    r = await ev(async () => {
      const C = G.Scenes.city, SEA = G.Scenes.sea, o = {}, s = G.Game.state;
      document.querySelector('.cmd.exit').click(); await TT.sleep(80);
      // 교역소 다음은 항구: 다른 곳은 말린다
      const n0 = TT.log.length; C.visit('gate'); await TT.sleep(80); await TT.until(() => !G.UI.busy() && !G.Tutorial.busy(), {});
      o.blocked = TT.log.slice(n0).join('/').slice(0, 24);
      await TT.visit('harbor');
      await TT.menu('출항');
      await TT.until(() => G.Game.sceneName === 'sea', { what: '자동항해로 출항', pref: [[/출항하겠습니까/, '자동항해로 출항한다'], [/그대로 떠나시겠습니까/, '그대로 출항']], win: [[/어디로 갈까요/, '세빌리아']] });
      TT.slow = true;
      await TT.sleep(200); const st0 = SEA.runtime(); o.auto = !!st0.autoOn + ':' + !!st0.path + ':' + (st0.target && st0.target.city ? st0.target.city.id : '');
      const sail = async () => { const st = SEA.runtime(); if (G.Game.sceneName === 'sea' && st && !G.UI.busy() && !st.busy) { if (!G.Tutorial.pending() && st.paused && !st.pendingPort) { if (st.path || st.dirCrs != null) SEA.resume(); else G.Tutorial.helm(); } SEA.update(0.03); } };
      const d0 = s.day;
      await TT.until(() => G.Game.sceneName === 'city' && s.loc.city === 7, { what: '세빌리아 입항', step: sail, wait: 4, ms: 110000 });
      TT.slow = false;
      o.days = s.day - d0; o.dolphin = TT.log.some(x => /돌고래는 규칙을 어겨도 봐주겠소/.test(x));
      await TT.until(() => TT.stepIs('sell') && !!s.tut.f.in_sell && !G.UI.busy() && !G.Tutorial.busy(), { what: '판매 단계 여는 대사' });
      await TT.visit('trade');
      const gold0 = s.player.gold, tr0 = G.Fame.get('tr'), cost = s.fleet.cargo.coral.cost * s.fleet.cargo.coral.q;
      await TT.menu('매각');
      await TT.until(() => TT.kind() === 'win' && /매각 — 세빌리아/.test(TT.text()), { what: '매각 창' });
      o.fad = /유행/.test(TT.text());
      TT.click('모두 판다');
      await TT.until(() => !s.fleet.cargo.coral && TT.kind() === 'win' && /매각 — 세빌리아/.test(TT.text()) || (!s.fleet.cargo.coral && !G.UI.busy()), { what: '산호를 팔았다', win: [[/모두 팔겠습니까/, '예']] });
      if (TT.kind() === 'win') TT.click('돌아간다', true);
      await TT.until(() => TT.stepIs('report') && !!s.tut.f.t_report && !G.UI.busy() && !G.Tutorial.busy(), { what: '보고 단계 여는 대사' });
      o.profit = (s.player.gold - gold0) - cost; o.trFame = G.Fame.get('tr') - tr0;
      o.said = TT.log.some(x => /제일 쉬운 말이고, 제일 어려운 일/.test(x));
      return o;
    });
    ok(/^true:true:7$/.test(r.auto) && r.dolphin, '15 자동항해: 세우타에서 「자동항해로 출항한다」 → 세빌리아 (' + r.auto + ', ' + r.days + '일) · 돌고래 덧장면 · 다른 건물은 말린다(' + r.blocked + ')');
    ok(r.fad && r.profit > 0 && r.said, '16 판매: 유행하는 산호를 팔아 이익 +' + r.profit + '닢 (교역 명성 +' + r.trFame + ')');

    // ---- 17 보고 → 18 여관 저장 → 에필로그
    r = await ev(async () => {
      const C = G.Scenes.city, o = {}, s = G.Game.state;
      document.querySelector('.cmd.exit').click(); await TT.sleep(80);
      await TT.visit('mansion', 'es_medinaceli');
      await TT.until(() => !!s.tut.f.dukeBack && !G.UI.busy() && !C.isBusy() && !G.Tutorial.busy(), { what: '공작 알현(보고)' });
      const gold0 = s.player.gold, fame0 = s.player.fame;
      await TT.menu('보고');
      await TT.until(() => TT.stepIs('inn') && !!s.tut.f.in_inn && !G.UI.busy() && !C.isBusy() && !G.Tutorial.busy(), { what: '보고 → 여관 단계', ms: 60000 });
      o.report = !s.contract + ':' + !!s.disc.herc_cave.reported + ':' + (s.player.gold - gold0) + ':' + (s.player.fame - fame0);
      document.querySelector('.cmd.exit').click(); await TT.sleep(80);
      await TT.visit('inn');
      o.teach = TT.log.some(x => /일지는 세 권이고/.test(x));
      await TT.menu('기능');
      await TT.until(() => !s.tut, { what: '일지 기록 → 에필로그 → 이어 가기', ms: 60000, win: [[/첫 항해를 마치다/, '이 항해를 이어 간다'], [/항해 일지에 기록/, '일지 1'], [/기능/, '항해 일지 기록']] });
      await TT.until(() => !G.UI.busy(), {});
      await TT.sleep(600);
      o.epi = TT.log.some(x => /이제 진짜 바다가 시작됩니다/.test(x));
      o.after = !s.tut + ':' + G.Game.sceneName + ':' + !document.querySelector('.tutbox') + ':' + G.MATE.lacosa.fame + ':' + G.SEA_RISK.pirate;
      const m1 = G.State.meta(1), m0 = G.State.meta(0), m4 = G.State.meta(4);
      o.saves = (m1 ? m1.name : '-') + '|' + (m0 ? 'auto0' : '-') + '|' + (m4 ? 'tut4' : '-');
      const st1 = await G.State.loadAsync(1); o.saved = !!(st1 && st1.tut && st1.tut.f.saved);
      // 끝난 뒤에는 아무것도 막지 않는다
      const n9 = TT.log.length; C.visit('tavern'); await TT.sleep(900);
      o.free = (C.current() || G.UI.busy() || C.isBusy()) && !TT.log.slice(n9).some(x => /로코 알베르티/.test(x)) ? 'tavern' : '';
      o.fameBy = G.Fame.text();
      return o;
    });
    ok(/^true:true:\d+:\d+$/.test(r.report) && +r.report.split(':')[2] >= 3000, '17 보고: 사례금·명성 (' + r.report + ')');
    ok(r.teach && r.epi && /^true:city:true:/.test(r.after) && +r.after.split(':')[3] > 0 && +r.after.split(':')[4] > 0 && r.saved && /알론소/.test(r.saves), '18 여관 저장 → 에필로그 → 「이 항해를 이어 간다」: 안내가 꺼지고 바꿔 둔 자료가 돌아온다 (' + r.after + ' · 저장 ' + r.saves + ')');
    ok(r.free === 'tavern', '튜토리얼이 끝나면 어느 건물이든 간다 · 명성 ' + r.fameBy);
    ok(errors.length === 0, '콘솔 오류 없음');
    console.log('\n통과 ' + passed + '건');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; }
  finally {
    console.log((await page.evaluate(() => TT.log.slice(-3).join('\n') + '\n상태 step ' + (G.Game.state.tut ? G.Game.state.tut.step : '끝') + ' day ' + G.Game.state.day + ' loc ' + JSON.stringify(G.Game.state.loc).slice(0, 120) + ' npcs ' + (G.Game.sceneName === 'sea' ? G.Scenes.sea.runtime().npcs.map(n => n.kind + (n.tut ? '*' : '') + ':' + G.Geo.dist(G.Game.state.loc.lon, G.Game.state.loc.lat, n.lon, n.lat).toFixed(2) + ':' + n.hostile + ':' + (n.cooldown || 0) + ':' + !!n.fled).join(' ') + ' paused ' + G.Scenes.sea.runtime().paused + ' busy ' + G.Scenes.sea.runtime().busy + ' path ' + !!G.Scenes.sea.runtime().path + ' tutbusy ' + G.Tutorial.busy() + ' modal ' + document.querySelectorAll('#ui .modal-back').length + ' overlay ' + [...document.getElementById('ui').children].map(e => e.className.slice(0, 18) + ':' + e.children.length).join(',') : '')).catch(e => e.message)).slice(0, 1500));
    await page.screenshot({ path: '/tmp/tut_last.png' }).catch(() => {});
    console.log(errors.length ? '콘솔 오류: ' + errors.slice(0, 6).join(' | ') : '(콘솔 오류 없음)');
    await browser.close();
  }
})();
