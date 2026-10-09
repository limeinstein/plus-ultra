/* 부하들 사이의 썸 (tests/romance_smoke.js) — node tests/romance_smoke.js   (BROWSER_EXE=크롬 경로)
   3년 넘게 함께한 부하만 · 1년에 한 번 · 한 커플이 혼례로 완성되면 끝(다음 커플 없음) · 사건 그림(images/romance-events)
   궁합(남녀만·chemMin) → 끌림이 쌓임(맞닿은 방이 빠름) → 간식·달밤·고백 상담(제독의 질투)·다툼·혼례(항구에서만) → 연인·부부의 충성·규율
   → 헤어짐 · 떨어져 지냄 · 청혼 막힘 · 수첩 · 실제 바다(runDay)·실제 입항에서 사건이 뜬다 · 옛 저장 · 튜토리얼. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SHOT = process.env.SHOT || path.join(require('os').tmpdir(), 'romance_duo.png');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => {
    const TT = window.TT = { raf: [], auto: true, n: 0 };
    window.requestAnimationFrame = cb => { TT.raf.push(cb); return ++TT.n; };
    TT.pump = () => { const q = TT.raf; TT.raf = []; q.forEach(cb => { try { cb(performance.now()); } catch (e) { console.error(e); } }); };
    setInterval(() => { if (TT.auto) TT.pump(); }, 16);
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Romance, null, { timeout: 90000 });
    let r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, RM = G.Romance, B = G.BALANCE.romance, CB = G.Cabins;
      await G.Game.ensureGeo();
      window.__ui = { say: UI.say, alert: UI.alert, toast: UI.toast };
      const said = []; let answer = {};
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      UI.ask = async (t, o) => { for (const k in answer) { const hit = o.find(x => x.value === answer[k] && String(t + x.label).indexOf(k) >= 0) || (String(t).indexOf(k) >= 0 && o.find(x => x.value === answer[k])); if (hit) return hit.value; } return o[0].value; };
      UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); }; UI.toast = () => {}; UI.confirm = async () => true;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35; s.player.gold = 50000;
      // 궁합이 좋은 남녀 한 쌍, 궁합이 나쁜 남자 하나, 여자 하나 더 (마녀·철새는 빼고 이름난 사람으로)
      const plain = G.MATES.filter(m => !m.witch && !m.wd && G.MATE[m.id]);
      const F = plain.filter(m => m.g === 'f'), M = plain.filter(m => m.g !== 'f');
      const add = id => { const row = { id, role: 'none', joined: G.U.dateNum(s.date), loyal: 60, from: 0 }; s.mates.push(row); return row; };
      let pair = null;
      for (const f of F) { for (const m of M) { if (RM.chem(m.id, f.id) >= 0.75) { pair = [m.id, f.id]; break; } } if (pair) break; }
      const mRow = add(pair[0]), fRow = add(pair[1]);
      const bad = M.find(m => m.id !== pair[0] && RM.chem(m.id, pair[1]) < B.chemMin - 0.1); const badRow = add(bad.id);
      const menNow = s.mates.map(x => x.id).filter(id => G.MATE[id].g !== 'f');
      const f2 = F.find(f => f.id !== pair[1] && menNow.every(id => RM.chem(id, f.id) < B.chemMin)); add(f2.id);
      const others = s.mates.map(x => x.id).filter(id => G.MATE[id].g === 'f' && id !== pair[1]);   // 처음부터 있던 여자 부하가 있으면
      out.othersOk = others.every(f => menNow.every(id => RM.chem(id, f) < B.chemMin));
      out.pair = G.MATE[pair[0]].name + '(' + G.Banter.toneOf(pair[0]) + ') · ' + G.MATE[pair[1]].name + '(' + G.Banter.toneOf(pair[1]) + ') 궁합 ' + RM.chem(pair[0], pair[1]).toFixed(2);
      // 맞닿은 방 · 떨어진 방
      CB.rooms();
      mRow.role = 'nav'; fRow.role = 'surveyor';      // 조타실·파수대는 맞닿아 있다
      out.near = RM.near(pair[0], pair[1]);
      // ---- 막 들어온 부하끼리는 엮이지 않는다 → 3년 넘게 함께한 부하만
      for (let i = 0; i < 5; i++) RM.daily();
      out.newbie = Object.keys(RM.st().pairs).length === 0 && !RM.veteran(pair[0]);
      const y3 = G.U.dateNum({ y: s.date.y - 3, m: s.date.m, d: s.date.d });
      s.mates.forEach(m => { m.joined = y3; });
      out.vet = RM.veteran(pair[0]) && RM.veteran(pair[1]);
      // ---- 끌림이 쌓인다
      const h = () => { const p = RM.st().pairs[RM.key(pair[0], pair[1])]; return p ? p.heat : 0; };
      RM.daily(); const h1 = h(); RM.daily(); const h2 = h();
      out.rateNear = (h2 - h1).toFixed(2);
      out.keys = Object.keys(RM.st().pairs).join(','); out.onlyGood = out.keys === RM.key(pair[0], pair[1]);
      // 떨어진 방이면 더 느리다
      fRow.role = 'none'; RM.daily(); const h3 = h(); out.rateFar = (h3 - h2).toFixed(2); fRow.role = 'surveyor';
      // 여자끼리·남자끼리는 엮이지 않는다
      out.sameSex = Object.values(RM.st().pairs).every(p => G.MATE[p.m].g !== 'f' && G.MATE[p.f].g === 'f');
      // ---- ① 간식
      let guard = 0; while (!RM.st().pairs[RM.key(pair[0], pair[1])].due && guard++ < 400) { s.day++; RM.daily(); }
      const P = RM.st().pairs[RM.key(pair[0], pair[1])];
      out.snackDay = guard; out.due1 = P.due; out.dueSea = !!RM.due('sea');
      said.length = 0; answer = { '사이좋군': 'cheer' };
      await RM.play(P);
      out.snack = P.stage + ':' + said.length + ':' + said.some(t => /무화과|빵/.test(t));
      out.cool = RM.due('sea') === null; out.next = s.romance.next - s.day;
      // ---- ② 달밤
      guard = 0; while (!P.due && guard++ < 400) { s.day++; RM.daily(); }
      s.day += B.cool; said.length = 0; answer = { '키잡이에게': 'cheer' };
      await RM.play(P); out.moon = P.stage + ':' + guard;
      // ---- ③ 고백 상담: 제독이 호감을 쌓던 사람이면 먼저 묻는다 → 「잘해 보게」
      fRow.aff = 60;
      guard = 0; while (!P.due && guard++ < 400) { s.day++; RM.daily(); }
      s.day += B.cool; said.length = 0; answer = { '아니다': 'yield', '선물': 'gift' };
      const g0 = s.player.gold;
      await RM.play(P);
      out.confess = P.stage + ':' + guard + ':' + fRow.aff + ':' + (g0 - s.player.gold) + ':' + said.some(t => /마음에 두고 계신/.test(t));
      out.tag = RM.tag(pair[1]) + ' | ' + RM.tag(pair[0]);
      out.block = RM.blocksWed(pair[1]);
      // ---- 연인: 맞닿은 방이면 충성·규율이 오른다
      const l0 = mRow.loyal, d0 = s.fleet.discipline; s.fleet.discipline = 50; P.cd = s.day + 1000; P.due = null;
      for (let i = 0; i < 30; i++) { s.day++; RM.daily(); P.due = null; }
      out.lover = (mRow.loyal - l0).toFixed(1) + ':' + (s.fleet.discipline - 50).toFixed(1);
      // ---- 혼례: 바다에서는 안 되고 항구에서만
      P.cd = 0; P.since = s.day - B.wedDays - 1; P.heat = 100; s.romance.next = 0; RM.daily();
      out.wedDue = P.due + ':' + (RM.due('sea') === null) + ':' + (RM.due('city') === P);
      s.loc = { mode: 'city', city: 0, lon: 0, lat: 0 }; said.length = 0; answer = { '혼례를 올려': 'yes' };
      const g1 = s.player.gold, lm = mRow.loyal;
      await RM.play(P);
      out.wed = P.stage + ':' + (g1 - s.player.gold) + ':' + Math.round(mRow.loyal - lm) + ':' + said.some(t => /혼례를 올렸다/.test(t)) + ':' + said.some(t => /\[창\]/.test(t));
      out.block2 = RM.blocksWed(pair[1]);
      // ---- 한 커플 완성 → 썸은 끝: 사건도 새 짝도 없다
      out.done = s.romance.done === RM.key(pair[0], pair[1]);
      s.romance.next = 0; P.due = 'quarrel';
      out.doneDue = RM.due('sea') === null && RM.due('city') === null; P.due = null;
      for (let i = 0; i < 400; i++) { s.day++; RM.daily(); }
      out.doneNoNew = Object.keys(s.romance.pairs).length === 1 && !P.due;
      // ---- 부부의 다툼: 내버려 둬도 헤어지지 않는다
      P.due = 'quarrel'; P.cd = 0; s.romance.next = 0; answer = { '어떻게': 'leave' };
      for (let i = 0; i < 4; i++) { P.due = 'quarrel'; s.romance.next = 0; await RM.play(P); }
      out.wedQuarrel = P.stage + ':' + P.heat;
      // ---- 한 사람이 배를 떠나면
      const keepF = s.mates.splice(s.mates.indexOf(fRow), 1)[0]; const lm2 = mRow.loyal; const ms = RM.daily();
      out.apart = (lm2 - mRow.loyal).toFixed(0) + ':' + ms.map(m => m.text).join('/').slice(0, 60) + ':' + !!P.apart;
      s.mates.push(keepF); RM.daily(); out.back = !P.apart && P.stage === 'wed';
      // ---- 연인의 다툼: 내버려 두면 헤어진다
      const snap = JSON.parse(JSON.stringify(s.romance));
      P.stage = 'lover'; P.heat = 40;
      for (let i = 0; i < 3 && P.stage === 'lover'; i++) { P.due = 'quarrel'; s.romance.next = 0; P.cd = 0; await RM.play(P); }
      out.broke = P.stage + ':' + said.some(t => /여기까지 해요/.test(t)) + ':' + (P.cd - s.day);
      out.coldTag = RM.tag(pair[1]) === '' && RM.blocksWed(pair[1]) === '';
      s.romance = snap;
      // ---- 수첩
      out.html = RM.html().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120);
      // ---- 저장 · 옛 저장 · 튜토리얼
      const back = G.State.deserialize(G.State.serialize()); out.save = back.romance.pairs[RM.key(pair[0], pair[1])].stage === 'wed';
      delete s.romance; out.old = RM.due('sea') === null && RM.tag(pair[1]) === '' && /아직/.test(RM.html());
      s.romance = snap;
      s.tut = { step: 0, f: {} }; out.tut = RM.daily().length === 0 && RM.due('sea') === null; delete s.tut;
      window.__pair = pair;
      return out;
    });
    ok(/궁합 0\.\d\d/.test(r.pair) && r.near, '궁합 좋은 짝: ' + r.pair + ' — 맞닿은 방에 둔다');
    ok(+r.rateNear > +r.rateFar && +r.rateFar > 0 && r.onlyGood && r.sameSex && r.othersOk, '끌림: 맞닿은 방 하루 +' + r.rateNear + ' [' + r.keys + ']' + ' · 떨어진 방 +' + r.rateFar + ' · 궁합 나쁜 사람·같은 성별은 엮이지 않는다');
    ok(r.due1 === 'snack' && r.dueSea && /^spark:\d+:true$/.test(r.snack) && r.cool && r.next === 365, '① 간식 (' + r.snackDay + '일 뒤) → 「사이좋군」 → 눈길 · 다음 사건은 1년 뒤(365일)');
    ok(/^some:\d+$/.test(r.moon), '② 달밤 → 썸');
    ok(/^lover:\d+:30:300:true$/.test(r.confess), '③ 고백 상담: 제독이 호감을 쌓던 사람이면 먼저 묻는다 → 「잘해 보게」(제독의 호감 절반) · 선물값 300닢 → 고백 → 연인');
    ok(/♥ .+과\/?와? 연인|♥ .+[과와] 연인/.test(r.tag) && /이 있어요|가 있어요/.test(r.block), '꼬리표 「' + r.tag + '」 · 제독이 청혼하면: ' + r.block);
    ok(+r.lover.split(':')[0] > 0 && +r.lover.split(':')[1] > 0, '연인이 맞닿은 방이면 충성·규율이 조금씩 오른다 (30일 ' + r.lover + ')');
    ok(/^wed:true:true$/.test(r.wedDue) && /^wed:1800:15:true:true$/.test(r.wed) && /사람이에요/.test(r.block2), '혼례는 항구에서만 → 금화 1,800닢(배 1척) · 충성 +15 → 부부 (' + r.block2 + ')');
    ok(r.newbie && r.vet, '막 들어온 부하끼리는 엮이지 않는다 → 3년 넘게 함께한 부하만');
    ok(r.done && r.doneDue && r.doneNoNew, '혼례로 한 커플이 완성되면 썸은 끝 — 다툼도 새 커플도 없다');
    ok(/^wed:\d+$/.test(r.wedQuarrel) && +r.wedQuarrel.split(':')[1] >= 40, '부부는 다퉈도 헤어지지 않는다');
    ok(/^10:.+:true$/.test(r.apart) && r.back, '부부 한쪽이 배를 떠나면 남은 사람 충성 −10 · 돌아오면 다시 함께');
    ok(/^cold:true:120$/.test(r.broke) && r.coldTag, '연인은 다툼을 내버려 두면 헤어진다 → 120일 동안 서먹');
    ok(/부하들 사이/.test(r.html) && /부부/.test(r.html) && r.save && r.old && r.tut, '수첩 「동료」에 「부하들 사이」 · 저장 · 옛 저장 · 튜토리얼');

    // ---- 실제 바다: runDay에서 사건이 뜬다 (마주 보는 대화 그림)
    await page.evaluate(async () => {
      const s = G.Game.state, RM = G.Romance, P = RM.st().pairs[RM.key(__pair[0], __pair[1])];
      G.UI.say = __ui.say; G.UI.alert = __ui.alert; G.UI.toast = __ui.toast; TT.auto = true;
      P.stage = 'none'; P.heat = 30; P.due = 'snack'; P.cd = 0; s.romance.next = 0; s.romance.done = null; G.BALANCE.romance.seaChance = 1;
      G.UI.fade = async fn => { fn(); }; G.UI.ask = async (t, o) => o[1].value;
      G.Game.go('sea', { depart: 0 }); await new Promise(r2 => setTimeout(r2, 400));
      window.__P = P; window.__day = G.Scenes.sea.runDay().then(() => { window.__dayDone = true; });
    });
    let duo = '', t0 = Date.now(), sawPic = false;
    while (Date.now() - t0 < 60000) {
      const st = await page.evaluate(() => { const m = [...document.querySelectorAll('#ui .modal-back')].pop(); return { duo: !!(m && m.querySelector('.dlg-stage.duo')), pic: !!document.querySelector('.famscene img[src*="romance-events/01_snack_share"]'), text: m ? m.textContent.slice(0, 80) : '', done: !!window.__dayDone, stage: __P.stage }; });
      if (st.pic) sawPic = true;
      if (st.duo && !duo) { duo = st.text; await page.waitForTimeout(1800); await page.screenshot({ path: SHOT }); }
      if (st.done) break;
      await page.evaluate(() => { const m = [...document.querySelectorAll('#ui .modal-back')].pop(); if (m) (m.querySelector('.dlg') || m).click(); });
      await page.waitForTimeout(150);
    }
    r = await page.evaluate(() => ({ stage: __P.stage, done: !!window.__dayDone }));
    ok(sawPic, '사건 그림 「나눠 먹는 간식」(romance-events/01_snack_share)이 대화 위에 뜬다');
    ok(r.stage === 'spark' && r.done && duo, '실제 바다의 하루(runDay)에서 사건 — 두 부하가 마주 보는 대화 → 눈길 (' + duo.slice(0, 50) + ')');
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | ')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
