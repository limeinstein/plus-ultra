/* 포르투갈과 콩고 (tests/kongo_smoke.js) — node tests/kongo_smoke.js   (BROWSER_EXE=크롬 경로)
   1편: 국왕의 부름(1482.8~) · 사양 → 두 달 뒤 → 맡기 → 강 어귀(바다) · 스스로 가겠다는 사람 → 리스본 → 르완다(약속 안) → 교역·포르투갈어
   2편: 은사쿠의 리스본 도착 소식 → 1490.10 부름 → 리스본 → (1491.5.3 역사 소식 없음) → 세례 · 교역의 약속 → 리스본 → 값 · 뒷이야기
   그 밖: 1편을 안 한 제독의 역사 소식 · 교회(rel) · 오래된 저장 · 실패 갈래 · 늦은 귀환 · 볼모 갈래 · 금화가 모자라면. 마지막에 실제 화면 한 장. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
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
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Kongo, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, K = G.Kongo, B = G.BALANCE.kongo;
      await G.Game.ensureGeo(); TT.auto = false;
      const said = [], asks = []; let answer = {}, toasts = [];
      window.__ui = { say: UI.say, ask: UI.ask, alert: UI.alert, confirm: UI.confirm, toast: UI.toast, save: G.State.save };
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      UI.ask = async (t, o) => { asks.push(String(t) + ' [' + o.map(x => x.value + (x.dis ? '(x)' : '')).join(',') + ']'); for (const k in answer) if (String(t).indexOf(k) >= 0) return answer[k]; return o[0].value; };
      UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); }; UI.confirm = async () => true; UI.toast = t => { toasts.push(String(t)); };
      G.State.save = () => {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const fresh = (nation) => { const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: nation || 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' }); s.settings.res = 0.35; s.player.gold = 50000; return s; };
      const setDate = (s, y, m, d) => { const nd = { y, m, d }; s.day += G.U.dayIndex(nd) - G.U.dayIndex(s.date); s.date = nd; };
      const lis = G.CITY_DATA[0], kg = G.CITY_DATA[100], sev = G.CITY_DATA[7];
      const atSea = (s, lon, lat) => { s.loc = { mode: 'sea', lon, lat, heading: 0 }; };
      const daily = () => K.daily();
      // ================= 1편
      let s = fresh();
      setDate(s, 1482, 7, 31); said.length = 0; await K.arrival(lis); out.early = said.length === 0 && !(s.kongo && s.kongo.ep1);
      out.relBefore = kg.rel === 'N' && !K.ptLang(kg);
      setDate(s, 1482, 8, 10);
      out.rumor = G.EVENT_RUMORS.filter(x => x.id === 'kongo')[0].live(s);
      answer = { '주앙 2세의 명 — 적도': 'no' }; said.length = 0;
      await K.arrival(sev); out.notSeville = said.length === 0;
      await K.arrival(lis);
      out.call1 = said.slice(); out.decline = s.kongo.ep1 === 0 && s.kongo.next > s.day;
      said.length = 0; await K.arrival(lis); out.noRepeat = said.length === 0;
      setDate(s, 1482, 10, 10); answer = {}; said.length = 0; await K.arrival(lis);
      out.accept = s.kongo.ep1 === 1 && /마음을 정했는가/.test(said[0] || '') && s.kongo.due === 14841009;
      out.rumorOff = !G.EVENT_RUMORS.filter(x => x.id === 'kongo')[0].live(s);
      out.html1 = K.html().replace(/<[^>]+>/g, ' ');
      // 바다: 멀리서는 없다 → 강 어귀
      atSea(s, 8.0, -3.0); out.far = !K.seaPending();
      setDate(s, 1483, 4, 1); atSea(s, 12.1, -6.2); out.near = K.seaPending();
      const gold0 = s.player.gold; answer = { '이 고을 사람 넷': 'willing' }; said.length = 0;
      await K.atSea();
      out.mouth = said.slice();
      out.willing = s.kongo.ep1 === 2 && s.kongo.how === 'willing' && gold0 - s.player.gold === 1500 && s.kongo.contact === 14830401 && !K.seaPending() && s.known.includes(100);
      out.html2 = K.html().replace(/<[^>]+>/g, ' ');
      // 르완다에 먼저 가도 아무 일 없다 → 리스본
      said.length = 0; await K.arrival(kg); out.kgEarly = said.length === 0;
      setDate(s, 1483, 10, 1); const g1 = s.player.gold; said.length = 0;
      await K.arrival(lis);
      out.lisbon1 = s.kongo.ep1 === 3 && s.player.gold - g1 === 3000 && said.some(t => /볼모가 아니라 짐의 손님/.test(t));
      out.html3 = K.html().replace(/<[^>]+>/g, ' ');
      // 돌려보낸다 (약속 안)
      setDate(s, 1484, 5, 1); const kgBuy0 = G.R.buyPrice(kg, 'ivory'), lisBuy0 = G.R.buyPrice(lis, 'wine'); said.length = 0;
      await K.arrival(kg);
      out.return1 = said.slice();
      out.done1 = s.kongo.ep1 === 'done' && !s.kongo.late && K.level() === 1 && JSON.stringify(s.player.items || s.items || []).indexOf('kongo_raffia') >= 0;
      out.price1 = Math.abs(G.R.buyPrice(kg, 'ivory') / kgBuy0 - 0.92) < 0.03 && G.R.buyPrice(lis, 'wine') === lisBuy0;
      out.lang1 = /포르투갈어/.test(K.ptLang(kg) || '') && kg.rel === 'N';
      out.htmlDone1 = K.html() === '';
      // ================= 2편
      setDate(s, 1488, 11, 30); out.n0 = daily().length;
      setDate(s, 1488, 12, 1); out.nsaku = daily().map(x => x.text).join('|');
      setDate(s, 1490, 9, 30); said.length = 0; await K.arrival(lis); out.call2Early = said.length === 0 && !s.kongo.ep2;
      setDate(s, 1490, 10, 1); out.call2News = daily().map(x => x.text).join('|');
      said.length = 0; await K.arrival(lis);
      out.lisbon2 = s.kongo.ep2 === 1 && said.some(t => /^주앙 다 실바 \(은사쿠\): /.test(t));
      out.html4 = K.html().replace(/<[^>]+>/g, ' ');
      setDate(s, 1491, 5, 3); out.noHist = daily().length === 0 && kg.rel === 'N';
      setDate(s, 1491, 6, 1); answer = { '무엇을 도와주겠는가': 'trade' }; said.length = 0;
      await K.arrival(kg);
      out.bapt = said.slice();
      out.baptOk = s.kongo.ep2 === 2 && s.kongo.help === 'trade' && s.kongo.bapt === 14910601 && kg.rel === 'C' && JSON.stringify(s.player.items || s.items || []).indexOf('kongo_horn') >= 0;
      out.renamed = said.some(t => /^주앙 1세 \(은징가 아 은쿠우\): /.test(t)) && said.some(t => /^마니 콩고 은징가 아 은쿠우: /.test(t)) && said.some(t => /^아폰수 왕자/.test(t));
      out.asks = asks.slice(-2);
      setDate(s, 1491, 12, 1); const g2 = s.player.gold, ivory1 = G.R.buyPrice(kg, 'ivory'); said.length = 0;
      await K.arrival(lis);
      out.done2 = s.kongo.ep2 === 'done' && s.player.gold - g2 === 20000 && K.level() === 3 && said.some(t => /산투 엘로이/.test(t));
      out.price3 = Math.abs(G.R.buyPrice(kg, 'ivory') / ivory1 - 0.80 / 0.92) < 0.03 && K.mult(kg, 'ivory', 'sell') === 1.12;
      // 뒷이야기
      const nn = [];
      for (const d of [[1492, 10, 1], [1495, 6, 1], [1509, 1, 1], [1518, 5, 3], [1526, 7, 6]]) { setDate(s, d[0], d[1], d[2]); nn.push(daily().length); }
      out.later = nn.join(',');   // church를 고르지 않았으니 1492는 0
      setDate(s, 1530, 1, 1); out.laterDup = daily().length === 0;
      // ================= 1편을 하지 않은 제독: 역사 소식 · 교회
      s = fresh('ES'); setDate(s, 1491, 5, 2); out.relES0 = kg.rel === 'N';
      setDate(s, 1491, 5, 3); const hn = daily(); out.histNews = hn.length === 1 && /주앙 1세/.test(hn[0].text) && kg.rel === 'C' && /포르투갈어/.test(K.ptLang(kg) || '');
      out.histOnce = daily().length === 0;
      said.length = 0; setDate(s, 1491, 6, 1); await K.arrival(lis); out.noCall2 = said.length === 0;
      // 오래된 저장: 지나간 역사 소식은 띄우지 않는다
      s = fresh(); setDate(s, 1530, 1, 1); out.oldSave = daily().length === 0 && kg.rel === 'C';
      s = fresh(); delete s.kongo; out.oldHtml = K.html() === '' && K.level() === 0;
      // ================= 실패 · 늦음 · 볼모 · 금화
      s = fresh(); setDate(s, 1482, 9, 1); answer = {}; await K.arrival(lis);
      setDate(s, 1484, 9, 2); const f1 = daily(); out.fail1 = s.kongo.ep1 === 'failed' && /혼자 콩고 강 어귀/.test(f1.map(x => x.text).join('|'));
      s = fresh(); setDate(s, 1482, 9, 1); await K.arrival(lis);
      atSea(s, 12.0, -6.0); s.player.gold = 100; answer = { '이 고을 사람 넷': 'willing' }; await K.atSea();
      out.hostage = s.kongo.how === 'hostage' && s.player.gold === 100 && asks[asks.length - 1].indexOf('willing(x)') >= 0;
      await K.arrival(lis);
      const prom = s.kongo.promise; setDate(s, Math.floor(prom / 10000) + 1, 1, 1);
      out.remind = true; const g3 = s.player.gold; said.length = 0; await K.arrival(kg);
      out.late = s.kongo.ep1 === 'done' && s.kongo.late === 1 && s.player.gold - g3 === Math.round(8000 * 0.6) && said.some(t => /장례까지/.test(t));
      s = fresh(); setDate(s, 1482, 9, 1); await K.arrival(lis); atSea(s, 12.0, -6.0); await K.atSea(); await K.arrival(lis);
      setDate(s, 1485, 8, 31); const g0 = daily(); out.notYet = s.kongo.ep1 === 3;
      setDate(s, 1485, 9, 2); const gu = daily(); out.giveUp = out.notYet && s.kongo.ep1 === 'failed' && gu.some(x => /두 번째 항해/.test(x.text));
      // 2편 실패: 가다가 기한을 넘기면 — 그때 역사 소식
      s = fresh(); s.kongo = { ep1: 'done', ep2: 0, done1: 14840501, seen: {} }; setDate(s, 1490, 11, 1); daily(); await K.arrival(lis);
      setDate(s, 1491, 5, 3); out.waitHist = daily().length === 0;
      setDate(s, 1491, 11, 2); const f2 = daily().map(x => x.text).join('|'); out.fail2 = s.kongo.ep2 === 'failed' && /다른 배에 맡겼다/.test(f2) && /주앙 1세/.test(f2);
      // 금화가 모자라면 성당은 고를 수 없다
      s = fresh(); s.kongo = { ep1: 'done', ep2: 1, done1: 14840501, due: 14920101, seen: {} }; setDate(s, 1491, 6, 1); s.player.gold = 10; answer = { '무엇을 도와주겠는가': 'church' };
      await K.arrival(kg); out.poor = s.kongo.help === 'trade' && s.player.gold >= 10 && asks[asks.length - 1].indexOf('church(x)') >= 0;
      // 총병 갈래
      s = fresh(); s.kongo = { ep1: 'done', ep2: 1, done1: 14840501, due: 14920101, seen: {} }; setDate(s, 1491, 6, 1); s.fleet.crew = 100; answer = { '무엇을 도와주겠는가': 'march' };
      await K.arrival(kg); out.march = s.kongo.help === 'march' && s.fleet.crew <= 100 && s.fleet.crew >= 88;
      return out;
    });
    console.log('  부름:', r.call1.slice(1, 2).join(''));
    console.log('  강 어귀:', r.mouth.slice(0, 1).join('').slice(0, 90) + '…');
    console.log('  수첩:', r.html1.replace(/\s+/g, ' '), '\n        ', r.html3.replace(/\s+/g, ' '), '\n        ', r.html4.replace(/\s+/g, ' '));
    console.log('  묻기:', r.asks.join(' / '));
    console.log('  뒷이야기 수:', r.later);
    ok(r.early && r.relBefore, '1482.8 전에는 부르지 않는다 · 세례 전 르완다는 신전·포르투갈어 없음');
    ok(r.rumor && r.rumorOff, '리스본 소문은 맡기 전에만');
    ok(r.notSeville && r.call1.some(t => /디오구 캉/.test(t)) && r.decline && r.noRepeat, '리스본에서만 주앙 2세가 부른다 · 사양하면 두 달 동안 없다');
    ok(r.accept && /콩고 강 어귀/.test(r.html1), '다시 불러 맡는다 — 기한 2년 · 수첩');
    ok(r.far && r.near && r.mouth.some(t => /^디오구 캉: /.test(t)) && r.mouth.some(t => /민물이다/.test(t)), '바다: 강 어귀 1.4° 안에서만 — 흙빛 바다·디오구 캉·돌기둥');
    ok(r.willing && /리스본/.test(r.html2), '「스스로 가겠다는 사람」 — 선물 1,500 · 넷이 배에 · 르완다를 해도에');
    ok(r.kgEarly && r.lisbon1 && /열다섯 달/.test(r.html3), '르완다보다 리스본이 먼저 — 국왕이 손님으로 맞고 하사금 3,000 · 약속 날이 수첩에');
    ok(r.done1 && r.return1.some(t => /은징가 아 은쿠우/.test(t)) && r.return1.some(t => /사제와 장인|신을 섬기는 사람/.test(t)), '르완다에 돌려보낸다 — 콩고 왕이 사제·장인을 청한다 · 라피아 천');
    ok(r.price1 && r.lang1 && r.htmlDone1, '1편 뒤: 르완다에서 사는 값 −8% · 포르투갈어 · (아직 신전)');
    ok(r.n0 === 0 && /은사쿠가 상아와 라피아 천/.test(r.nsaku), '1488.12 은사쿠가 리스본에 — 1편을 마친 제독에게');
    ok(r.call2Early && /주앙 다 실바/.test(r.call2News) && r.lisbon2 && /주앙 다 실바와 사제/.test(r.html4), '1490.10 2편의 부름 → 리스본에서 맡는다');
    ok(r.noHist, '가는 중에는 1491.5.3 역사 소식이 오지 않는다 (제독이 직접 본다)');
    ok(r.baptOk && r.renamed, '르완다 → 음반자 콩고의 세례: 은징가 아 은쿠우 → 주앙 1세 · 아폰수 왕자 · 교회(rel C) · 상아 뿔피리');
    ok(r.done2 && r.price3, '리스본에 편지·젊은이들 → 하사금 20,000 · 교역의 약속: 사는 값 −20%·파는 값 +12%');
    ok(r.later === '0,1,1,1,1' && r.laterDup, '뒷이야기: 주앙 1세의 변심·아폰수 1세·엔히크 주교·아폰수의 편지 (한 번씩)');
    ok(r.relES0 && r.histNews && r.histOnce && r.noCall2, '1편을 안 한 제독: 1491.5.3 역사 소식 한 번 · 그날부터 교회·포르투갈어 · 2편은 없다');
    ok(r.oldSave && r.oldHtml, '오래된 저장은 지난 소식을 띄우지 않는다 · state.kongo 없어도 그대로');
    ok(r.fail1, '강 어귀를 기한 안에 못 찾으면 실패');
    ok(r.hostage && r.late, '금화가 모자라면 볼모 갈래만 · 열다섯 달을 넘겨 돌려보내면 늦음(보상 60%)');
    ok(r.giveUp, '3년이 지나도 돌려보내지 못하면 디오구 캉이 대신 — 실패');
    ok(r.waitHist && r.fail2, '2편 기한을 넘기면 실패 소식과 함께 그제야 세례 소식');
    ok(r.poor && r.march, '금화가 모자라면 성당 갈래는 막힘 · 총병 갈래는 선원 12% 잃음');

    // ---- 실제 화면: 르완다에서 세례 장면
    const shot = await page.evaluate(async () => {
      const k = window.__ui; Object.assign(G.UI, { say: k.say, ask: k.ask, alert: k.alert, confirm: k.confirm, toast: k.toast }); G.State.save = k.save;
      TT.auto = true;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35; s.settings.autosave = false;
      const nd = { y: 1491, m: 4, d: 20 }; s.day += G.U.dayIndex(nd) - G.U.dayIndex(s.date); s.date = nd;
      s.kongo = { ep1: 'done', ep2: 1, done1: 14840501, due: 14920101, seen: { bapt: 1 } };
      s.loc = { mode: 'city', city: 100, lon: 13.2, lat: -8.8 };
      G.Game.go('city', { cityId: 100 });
      await new Promise(r => setTimeout(r, 2500));
      window.__kp = G.Kongo.arrival(G.CITY_DATA[100]);
      return G.Game.sceneName;
    });
    let seen = '';
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500);
      seen = await page.evaluate(() => document.getElementById('ui').innerText);
      if (/주앙 1세 \(은징가/.test(seen) || /사제/.test(seen) && /세례를 줍니다/.test(seen)) break;
      await page.keyboard.press('Space').catch(() => {});
    }
    await page.screenshot({ path: path.join(require('os').tmpdir(), 'kongo_baptism.png') });
    ok(shot === 'city' && /세례를 줍니다|주앙 1세/.test(seen), '실제 도시 화면 — 르완다에서 세례 장면 (임시 폴더 kongo_baptism.png)');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.slice(0, 3).join(' / ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗', e.message); process.exit(1); });
