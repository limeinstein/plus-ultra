/* 튜토리얼 QA 2026-10-16 (tests/tutorial_qa_1016.js) — node tests/tutorial_qa_1016.js   (BROWSER_EXE=크롬 경로)
   앞부분(0~4단계)은 tutorial_smoke.js와 같고, 그 뒤에 이번에 고친 것을 본다:
   ① 세르다 저택: 공작이 문전박대 중이던 옛 저장이어도 만나 주고, 운이 나빠도 교섭이 성공하며, 교섭 뒤에는 「승낙한다」만 남는다
   ② 튜토리얼 표시는 하늘빛(키보드 커서의 노란빛과 다름)이고 맨 위 창 안의 단추에만
   ③ 선실 단계에 카디스 곁을 지나도 「입항하시겠습니까?」를 묻지 않는다
   ④ 본 게임: 곁 항구는 한 번 묻고, 「지나간다」면 30초(실제 시간) 동안 다시 묻지 않으며, 도시를 눌러 가면 닿자마자 묻지 않고 입항한다
   ⑤ 보고: 발견물 그림이 사람들 없이 먼저 돌고, 걷힌 뒤에 대화가 시작된다 */
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
  page.on('pageerror', e => errors.push('PAGEERR ' + e.message + ' @ ' + (e.stack||'').split('\n').slice(0,4).join(' | ')));
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
    TT.text = () => { const m = TT.top(); if (!m) return ''; const b = m.querySelector('.dlg .body'), n = m.querySelector('.dlg .name'); return b ? (n ? n.textContent : '') + b.textContent : m.textContent; };   // 마주 선 대화의 이름패(두 사람)는 빼고 말하는 사람 이름 + 대사
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

    }
    // ==== QA 2026-10-16 ① 세르다: 교섭에 실패해도 막히지 않는다 · 교섭 뒤엔 승낙만 · 빛나는 단추는 맨 위 창 안에만
    r = await ev(async () => {
      const C = G.Scenes.city, s = G.Game.state, o = {};
      await TT.menu('술집을 나온다');
      G.Sponsor.rel('es_medinaceli').anger = 99991231;          // 옛 저장: 교섭 결렬로 문전박대 중이던 상태
      const rng0 = G.U.rng; G.U.rng = () => 0.999;               // 운이 아주 나빠도
      await TT.visit('mansion', 'es_medinaceli');
      await TT.until(() => !!s.tut.f.dukeIn && !G.UI.busy() && !C.isBusy() && !G.Tutorial.busy(), { what: '공작 알현' });
      await TT.menu('모험 제안');
      o.rude = false;
      // 제안 고르기 → 첫 조건 물음까지
      await TT.until(() => TT.kind() === 'ask' && /선금/.test(TT.text()), { what: '조건 물음', win: [[/제안 선택/, '헤라클레스의 동굴']] });
      o.rude = TT.log.some(x => /무례|다시 오게|썩 물러/.test(x));
      o.opts1 = [...TT.top().querySelectorAll('.askrow .btn')].map(b => b.textContent.trim()).join('|');
      await TT.sleep(500); G.Tutorial.tick(); await TT.sleep(400);
      o.glow1 = [...document.querySelectorAll('.tut-glow')].map(e => e.textContent.trim().slice(0, 8) + (TT.top().contains(e) ? '' : '(밖)')).join(',');
      const g = document.querySelector('.tut-glow'); o.glowCss = g ? getComputedStyle(g).outlineColor : '';
      o.clicked = TT.click('교섭한다'); TT.dbg = JSON.stringify(o); await TT.sleep(200); o.after = TT.kind() + ':' + TT.text().slice(0, 60); TT.dbg = JSON.stringify(o);
      await TT.until(() => TT.find('자금 증가').length > 0, { what: '요구 창', wait: 5 });
      TT.click('자금 증가');
      await TT.until(() => TT.kind() === 'ask' && /선금/.test(TT.text()), { what: '교섭 뒤 조건 물음', win: [[/교섭/, '확인']] });
      o.opts2 = [...TT.top().querySelectorAll('.askrow .btn')].map(b => b.textContent.trim()).join('|');
      o.fail = TT.log.some(x => /욕심|결렬/.test(x));
      G.U.rng = rng0;
      await TT.until(() => !!s.contract, { what: '계약', pref: [[/선금/, '승낙한다'], [/빌려주겠네/, '괜찮습니다']], win: [[/계약하시겠습니까/, '계약한다']] });
      o.adv = s.contract.advance;
      await TT.until(() => TT.stepIs('depart') && !!s.tut.f.in_depart && !G.UI.busy() && !G.Tutorial.busy(), { what: '출항 단계' });
      return o;
    });
    console.log(JSON.stringify(r));
    ok(!r.rude && /교섭한다/.test(r.opts1) && r.opts2 === '승낙한다' && !r.fail && r.adv > 0, '세르다: 문전박대 없음 · 운이 나빠도 교섭 성공 · 교섭 뒤엔 「승낙한다」만 (' + r.opts1 + ' → ' + r.opts2 + ', 선금 ' + r.adv + ')');
    ok(/승낙/.test(r.glow1) && !/\(밖\)/.test(r.glow1) && /47, 198, 255/.test(r.glowCss), '튜토리얼 표시는 하늘빛이고 맨 위 창 안에만 (' + r.glow1 + ' · ' + r.glowCss + ')');
    await page.screenshot({ path: SHOTS + '/qa_sponsor.png' });

    // ==== ② 출항 → 선실 단계에서 카디스 앞을 지나도 「입항하시겠습니까?」를 묻지 않는다
    r = await ev(async () => {
      const C = G.Scenes.city, s = G.Game.state, SEA = G.Scenes.sea, o = {};
      await TT.menu('저택을 나온다').catch(() => {});
      await TT.visit('harbor');
      await TT.menu('출항');
      await TT.until(() => G.Game.sceneName === 'sea', { what: '출항', pref: [[/출항/, '출항한다']] });
      await TT.until(() => TT.stepIs('sail') && !!s.tut.f.t_sail && !G.UI.busy() && !G.Tutorial.busy(), { what: '항해 단계' });
      s.tut.f.sailed = 1;
      await TT.until(() => TT.stepIs('cabin') && !G.UI.busy() && !G.Tutorial.busy(), { what: '선실 단계' });
      const cad = G.CITY_DATA.find(c => c.name === '카디스'); if (s.known.indexOf(cad.id) < 0) s.known.push(cad.id);
      const d = cad.dock || [cad.lat, cad.lon]; s.loc.lon = d[1]; s.loc.lat = d[0];
      const st = SEA.runtime(); st.portPromptBlock = null; st.path = null; st.target = null; st.paused = true;
      o.near = SEA.portNear() && SEA.portNear().name;
      const asked = []; const ask0 = G.UI.ask; G.UI.ask = function (t) { asked.push(String(t).slice(0, 30)); return ask0.apply(this, arguments); };
      for (let i = 0; i < 40; i++) { if (!G.UI.busy()) SEA.update(0.05); else TT.enter(); await TT.sleep(20); }
      o.asked = asked.filter(x => /입항/.test(x)).length;
      G.UI.ask = ask0;
      return o;
    });
    ok(r.near === '카디스' && r.asked === 0, '선실 단계: 카디스 곁에서도 입항을 묻지 않는다 (곁 항구 ' + r.near + ', 물음 ' + r.asked + ')');

    // ==== ③ 본 게임: 거절하면 30초 동안 다시 묻지 않고, 도시를 직접 누르면 닿자마자 묻지 않고 들어간다
    r = await ev(async () => {
      const s = G.Game.state, SEA = G.Scenes.sea, o = {};
      G.Tutorial.end(); s.settings.portAsk = 'ask';   // 예전 방식(항상 묻기)으로 곁 항구 물음을 본다 — 기본은 알림만
      const st = SEA.runtime(); st.portPromptBlock = null; st.portPromptUntil = {};
      const asked = [], times = []; const ask0 = G.UI.ask;
      G.UI.ask = function (t, ch) { asked.push(String(t).slice(0, 30)); if (/입항/.test(t)) { times.push(Date.now()); setTimeout(() => { o.cool = Math.round(((st.portPromptUntil[G.CITY_DATA.find(c => c.name === '카디스').id] || 0) - Date.now()) / 1000); }, 0); return Promise.resolve(0); } return ask0.apply(this, arguments); };
      const t0 = Date.now(); while (Date.now() - t0 < 8000) { if (!G.UI.busy()) SEA.update(0.05); await TT.sleep(30); }
      o.first = times.length;
      o.gap = times.length > 1 ? Math.min(...times.slice(1).map((x, i) => x - times[i])) : 99999;
      // 도시를 직접 누른다 (조금 떨어진 곳에서)
      const cad = G.CITY_DATA.find(c => c.name === '카디스'), d = cad.dock || [cad.lat, cad.lon];
      const sea = G.Nav.nearestSea(d[1] - 0.6, d[0] - 0.3, 12); s.loc.lon = sea[0]; s.loc.lat = sea[1];
      SEA.goCity(cad.id); st.speed = 2;
      const n0 = asked.length;
      await TT.until(() => G.Game.sceneName === 'city', { what: '카디스 입항', step: async () => { const q = SEA.runtime(); if (q && G.Game.sceneName === 'sea' && !G.UI.busy() && !q.busy) { if (q.paused && q.path) SEA.resume(); SEA.update(0.05); } }, wait: 5, ms: 60000 });
      o.click = asked.slice(n0).filter(x => /입항/.test(x)).length;
      o.city = G.CITY_DATA[s.loc.city].name; o.all = asked.join(' / '); o.wait = JSON.stringify(G.BALANCE.cityEntryPrompt);
      G.UI.ask = ask0;
      await TT.sleep(300); o.left = /입항하시겠습니까/.test(document.getElementById('ui').textContent); await TT.until(() => !G.UI.busy() && !G.Scenes.city.isBusy(), { what: '도시 들어섬' });
      return o;
    });
    ok(r.first >= 1 && r.gap >= 29900 && r.cool >= 28 && r.click === 0 && !r.left && r.city === '카디스', '본 게임: 곁 항구를 한 번 묻고, 거절하면 ' + r.cool + '초 동안 다시 묻지 않음 · 도시를 눌러 가면 묻지 않고 입항 (' + JSON.stringify(r) + ')');

    // ==== ④ 보고: 발견물 그림이 다 돈 뒤에 사람들이 나온다
    r = await ev(async () => {
      const o = {}, ids = Object.keys(G.DISC);
      const d = ids.map(id => G.DISC[id]).find(x => x && x.cat === 'geo' && x.id !== 'circum' && G.Reel && G.Reel.key(x));
      o.d = d ? d.id : '-';
      const ev = []; const say0 = G.UI.say;
      G.UI.say = function (t, w) { ev.push('say:' + !!document.querySelector('.reveal.replay') + ':' + !!document.querySelector('.reveal.report')); return say0.apply(this, arguments); };
      const sp = G.SPONSOR.es_medinaceli;
      const p = G.Pitch.run({ d: d || G.DISC.herc_cave, sp: sp, mode: 'contract' });
      await TT.sleep(200); o.replayFirst = !!document.querySelector('.reveal.replay') && !document.querySelector('#ui .modal-back');
      const out = await (async () => { const r0 = p; await TT.until(async () => { return await Promise.race([r0.then(() => true), TT.sleep(10).then(() => false)]); }, { what: '보고 자리', ms: 60000 }); return r0; })();
      await out.close();
      G.UI.say = say0;
      o.ev = ev.slice(0, 3).join(',');
      return o;
    });
    ok(r.replayFirst && /^say:false:false/.test(r.ev), '보고: 그림이 먼저 혼자 돌고, 걷힌 뒤에 사람들이 이야기한다 (' + r.d + ' · ' + r.ev + ')');

    ok(errors.length === 0, '콘솔 오류 없음');
    console.log('\n통과 ' + passed + '건');
  } catch (e) { console.error('✗', e.message); console.log('DBG', await page.evaluate(() => TT.dbg).catch(()=>'')); process.exitCode = 1; }
  finally {
    console.log((await page.evaluate(() => TT.log.slice(-3).join('\n') + '\n상태 step ' + (G.Game.state.tut ? G.Game.state.tut.step : '끝') + ' day ' + G.Game.state.day + ' loc ' + JSON.stringify(G.Game.state.loc).slice(0, 120) + ' npcs ' + (G.Game.sceneName === 'sea' ? G.Scenes.sea.runtime().npcs.map(n => n.kind + (n.tut ? '*' : '') + ':' + G.Geo.dist(G.Game.state.loc.lon, G.Game.state.loc.lat, n.lon, n.lat).toFixed(2) + ':' + n.hostile + ':' + (n.cooldown || 0) + ':' + !!n.fled).join(' ') + ' paused ' + G.Scenes.sea.runtime().paused + ' busy ' + G.Scenes.sea.runtime().busy + ' path ' + !!G.Scenes.sea.runtime().path + ' tutbusy ' + G.Tutorial.busy() + ' modal ' + document.querySelectorAll('#ui .modal-back').length + ' overlay ' + [...document.getElementById('ui').children].map(e => e.className.slice(0, 18) + ':' + e.children.length).join(',') : '')).catch(e => e.message)).slice(0, 1500));
    await page.screenshot({ path: '/tmp/tut_last.png' }).catch(() => {});
    console.log(errors.length ? '콘솔 오류: ' + errors.slice(0, 6).join(' | ') : '(콘솔 오류 없음)');
    await browser.close();
  }
})();
