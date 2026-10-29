/* 명예혁명과 권리장전 (tests/glory_smoke.js) — node tests/glory_smoke.js   (BROWSER_EXE=크롬 경로)
   오라녜 편: 때 · 사양 → 다시 · 해협(11.11 전엔 기다림) · 개신교의 바람 · 토베이 · 국왕 편은 막힘 · 상륙 소식은 겪은 사람에게 다시 오지 않음
   권리 선언: 조항 · 오라녜 공의 인사 · 권리장전의 날(면세증 환불 · 교역 증서 · 사는 값 −5%) · 특허장에서 면세증이 막힘 · 뒷이야기
   국왕 편: 건플리트의 동풍 · 12월 탈출(이르면 기다림) · 국새 · 프랑스 항구 · 맹세 거절 → 증서 없음 · 늦으면
   누구나: 왕관 소식 · 권리 선언 · 증서 · 옛 저장 · 기한. 마지막에 런던 화면에서 권리 선언 한 장. 콘솔 오류 0. */
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
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Glory, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, GL = G.Glory, B = G.BALANCE.glory, C = G.CITY_DATA;
      await G.Game.ensureGeo(); TT.auto = false;
      const said = [], asks = []; let answer = {}, toasts = [];
      window.__ui = { say: UI.say, ask: UI.ask, alert: UI.alert, confirm: UI.confirm, toast: UI.toast, choose: UI.choose, save: G.State.save };
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + String(t)); };
      UI.ask = async (t, o) => { asks.push(String(t) + ' [' + o.map(x => x.value).join(',') + ']'); for (const k in answer) if (String(t).indexOf(k) >= 0) return answer[k]; return o[0].value; };
      UI.alert = async t => { said.push('[창] ' + String(t).replace(/<[^>]+>/g, ' ')); }; UI.confirm = async () => true; UI.toast = t => { toasts.push(String(t)); };
      G.State.save = () => {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const fresh = () => { const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'EN', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' }); s.settings.res = 0.35; s.player.gold = 50000; return s; };
      const setDate = (s, y, m, d) => { const nd = { y, m, d }; s.day += G.U.dayIndex(nd) - G.U.dayIndex(s.date); s.date = nd; };
      const items = s => JSON.stringify(s.player.items || []) + JSON.stringify(G.R.storage ? G.R.storage() : []);
      const atSea = (s, lat, lon) => { s.loc = { mode: 'sea', lon, lat, heading: 0 }; };
      const ams = C[B.amsterdam], lon = C[B.london], rouen = C[15];
      // ================= 오라녜 편
      let s = fresh();
      setDate(s, 1688, 7, 9); said.length = 0; await GL.arrival(ams); out.oEarly = said.length === 0;
      setDate(s, 1688, 7, 10); out.rumor = G.EVENT_RUMORS.filter(x => x.id === 'glory_o')[0].live(s);
      answer = { '함께 해협을': 'no' }; said.length = 0; await GL.arrival(ams);
      out.oLines = said.slice(); out.oDecline = s.glory.o === 0 && s.glory.next.o > s.day;
      said.length = 0; await GL.arrival(ams); out.oNoRepeat = said.length === 0;
      setDate(s, 1688, 8, 15); answer = {}; said.length = 0; await GL.arrival(ams);
      out.oAccept = s.glory.o === 1 && /바람이 아직 서쪽/.test(said[0] || '') && !G.EVENT_RUMORS.filter(x => x.id === 'glory_o')[0].live(s);
      out.html1 = GL.html().replace(/<[^>]+>/g, ' ');
      setDate(s, 1688, 10, 1); said.length = 0; await GL.arrival(lon); out.noJ = said.length === 0 && !s.glory.j;
      atSea(s, 50.3, -1.0); setDate(s, 1688, 11, 5); toasts = []; said.length = 0; await GL.atSea();
      out.waitSail = s.glory.o === 1 && said.length === 0 && /11월 11일/.test(toasts.join('|'));
      atSea(s, 53.5, 3.0); out.outside = !GL.seaPending();
      atSea(s, 50.3, -3.4); setDate(s, 1688, 11, 14); const g0 = s.player.gold; answer = { '토베이': 'land' }; said.length = 0; await GL.atSea();
      out.oWind = s.glory.o === 'done' && s.glory.oHelp === 'land' && s.player.gold - g0 === 10000 && items(s).indexOf('glory_banner') >= 0 &&
        said.some(t => /개신교의 바람/.test(t)) && said.some(t => /^오라녜 공 빌럼: /.test(t)) && said.some(t => /브릭섬/.test(t));
      setDate(s, 1688, 11, 20); out.noLandNews = GL.daily().length === 0;
      // 권리 선언
      setDate(s, 1689, 2, 22); said.length = 0; await GL.arrival(lon); out.declEarly = said.length === 0;
      setDate(s, 1689, 2, 23); const crownNews = GL.daily(); out.crownSkip = crownNews.length === 0;   // 아직 선언을 보지 않았으니 왕관 소식이 온다? — 23일 아침 소식
      answer = { '마음에 가장 와닿는': 'tax' }; said.length = 0; await GL.arrival(lon);
      out.decl = s.glory.decl === 'seen' && s.glory.clause === 'tax' && items(s).indexOf('glory_decl') >= 0 && said.some(t => /^핼리팩스 후작: /.test(t)) &&
        said.some(t => /^메리 2세: /.test(t)) && said.some(t => /^존 로크: /.test(t)) && said.some(t => /토베이에서 함께한/.test(t)) && !asks.some(a => /맹세/.test(a));
      // 권리장전의 날: 면세증 · 증서
      s.court = s.court || {}; s.court.papers = s.court.papers || {}; s.court.papers.exempt = { EN: 16900626 }; s.court.papers.marque = s.court.papers.marque || {};
      const buy0 = G.R.buyPrice(lon, 'wool') || G.R.buyPrice(lon, 'woolcloth'); setDate(s, 1689, 12, 25); GL.daily(); out.dispBefore = !GL.noDispense(G.COURT.realms.EN);
      const g1 = s.player.gold; setDate(s, 1689, 12, 26); const bn = GL.daily().map(x => x.text);
      out.bill = bn.some(t => /권리장전/.test(t)) && bn.some(t => /효력을 잃었다/.test(t)) && bn.some(t => /교역 증서/.test(t)) && s.player.gold - g1 === 6000 && !s.court.papers.exempt.EN && s.glory.charter === 1;
      out.dispAfter = GL.noDispense(G.COURT.realms.EN) && !GL.noDispense(G.COURT.realms.PT);
      out.mult = GL.mult(lon, 'wool', 'buy') === 0.95 && GL.mult(lon, 'wool', 'sell') === 1.05 && GL.mult(C[0], 'wine', 'buy') === 1;
      // 특허장 창: 잉글랜드 면세증을 고르면 막힌다
      const keep = { title: G.Court.title, choose: UI.choose }; let ch = 0;
      G.Court.title = () => ({ ko: '기사', w: 1, id: 'kn' });
      UI.choose = async () => (ch++ === 0 ? { kind: 'exempt' } : null);
      const g2 = s.player.gold; said.length = 0;
      await G.Court.charters(G.SPONSOR.en_king);
      out.charterBlocked = said.some(t => /의회의 동의 없이 법을 멈추거나 면제할 수 없소/.test(t)) && s.player.gold === g2 && !s.court.papers.exempt.EN;
      G.Court.title = keep.title; UI.choose = keep.choose;
      const pn = [];
      for (const d of [[1690, 2, 1], [1690, 7, 11], [1694, 7, 27]]) { setDate(s, d[0], d[1], d[2]); pn.push(GL.daily().length); }
      out.partNews = pn.join(',');
      // ================= 국왕 편
      s = fresh(); setDate(s, 1688, 9, 1); answer = {}; said.length = 0; await GL.arrival(lon);
      out.jAccept = s.glory.j === 1 && said.some(t => /^제임스 2세: /.test(t));
      said.length = 0; await GL.arrival(ams); out.noO = said.length === 0;
      atSea(s, 51.6, 1.1); setDate(s, 1688, 11, 16); answer = { '어찌하겠소': 'chase' }; said.length = 0; await GL.atSea();
      out.jWind = s.glory.j === 2 && s.glory.jWind === 'chase' && said.some(t => /^다트머스 경: /.test(t));
      setDate(s, 1688, 12, 5); toasts = []; said.length = 0; await GL.arrival(lon); out.flightEarly = said.length === 0 && /12월 중순/.test(toasts.join('|'));
      setDate(s, 1688, 12, 15); answer = { '프랑스로 데려가': 'yes' }; said.length = 0; await GL.arrival(lon);
      out.flight = s.glory.j === 3 && said.some(t => /템스강에 던져/.test(t)) && said.some(t => /로체스터/.test(t));
      setDate(s, 1688, 12, 21); out.sealSkip = GL.daily().length === 0;
      setDate(s, 1689, 1, 2); out.exileSkip = GL.daily().length === 0;
      said.length = 0; await GL.arrival(C[0]); out.notPortugal = s.glory.j === 3;
      const fr0 = G.Sponsor.rel('fr_king').trust; await GL.arrival(rouen);
      out.france = s.glory.j === 'done' && items(s).indexOf('glory_ring') >= 0 && said.some(t => /생제르맹/.test(t));
      out.frTrust = G.Sponsor.present(G.SPONSOR.fr_king) ? G.Sponsor.rel('fr_king').trust > fr0 : true;
      setDate(s, 1689, 3, 1); answer = { '맹세하겠는가': 'no' }; said.length = 0; await GL.arrival(lon);
      out.oathNo = s.glory.decl === 'seen' && s.glory.oath === 'no';
      setDate(s, 1689, 12, 26); const jb = GL.daily().map(x => x.text); out.noCharter = jb.some(t => /권리장전/.test(t)) && !s.glory.charter && GL.mult(lon, 'wool', 'buy') === 1;
      // 늦으면 · 거절 · 기한
      s = fresh(); s.glory = { o: 0, j: 2, decl: 0, next: {}, seen: {} }; setDate(s, 1689, 1, 21); out.late = GL.daily().some(x => /다른 배로 프랑스/.test(x.text)) && s.glory.j === 'late';
      s = fresh(); s.glory = { o: 0, j: 2, decl: 0, next: {}, seen: {} }; setDate(s, 1688, 12, 20); answer = { '프랑스로 데려가': 'no' }; await GL.arrival(lon); out.refused = s.glory.j === 'refused';
      s = fresh(); s.glory = { o: 1, j: 0, decl: 0, next: {}, seen: {} }; setDate(s, 1689, 2, 1); out.oFail = GL.daily().some(x => /제독 없이 해협/.test(x.text)) && s.glory.o === 'failed';
      // ================= 누구나: 왕관 소식 · 선언 · 증서
      s = fresh(); setDate(s, 1689, 2, 23); const cn = GL.daily().map(x => x.text); out.anyCrown = cn.some(t => /명예혁명/.test(t));
      setDate(s, 1689, 3, 10); answer = {}; said.length = 0; await GL.arrival(lon); out.anyDecl = s.glory.decl === 'seen' && !said.some(t => /토베이에서 함께한/.test(t));
      setDate(s, 1689, 12, 26); GL.daily(); out.anyCharter = s.glory.charter === 1;
      // 옛 저장
      s = fresh(); delete s.glory; setDate(s, 1700, 1, 1); out.old = GL.daily().length === 0 && !s.glory && GL.html() === '';
      s = fresh(); delete s.glory; setDate(s, 1692, 1, 1); out.old2 = GL.daily().length === 0;
      return out;
    });
    console.log('  오라녜:', r.oLines[1]);
    console.log('  수첩:', r.html1.replace(/\s+/g, ' '));
    console.log('  뒷이야기 수:', r.partNews);
    ok(r.oEarly && r.rumor, '1688.7.10 전에는 없다 · 암스테르담 소문');
    ok(r.oLines.some(t => /^한스 빌럼 벤팅크: /.test(t)) && r.oDecline && r.oNoRepeat, '암스테르담: 벤팅크·오라녜 공 · 사양하면 한 달 동안 없다');
    ok(r.oAccept && /영국 해협/.test(r.html1), '다시 찾아 맡는다 · 소문이 그친다 · 수첩');
    ok(r.noJ, '오라녜 편을 맡으면 런던의 제임스 2세는 부르지 않는다');
    ok(r.waitSail && r.outside, '11.11 전 해협에서는 기다린다 · 해협 밖에서는 없다');
    ok(r.oWind, '개신교의 바람 · 토베이 브릭섬 · 병사와 말 — 금화 10,000 · 오라녜 공의 깃발');
    ok(r.noLandNews, '겪은 사람에게 상륙 소식은 다시 오지 않는다');
    ok(r.declEarly && r.decl, '1689.2.23 런던 화이트홀: 핼리팩스·메리·로크 · 세금 조항 · 오라녜 공의 인사 · 권리 선언 인쇄본');
    ok(r.dispBefore && r.bill && r.dispAfter, '1689.12.26 권리장전: 잉글랜드 면세증이 효력을 잃고 남은 날만큼 돌려받는다(6,000) · 교역 증서');
    ok(r.mult && r.charterBlocked, '교역 증서: 잉글랜드 항구 사는 값 ×0.95·파는 값 ×1.05 · 왕궁 특허장에서 면세증이 막힌다');
    ok(r.partNews === '1,1,1', '뒷이야기: 로크의 『통치론』 · 보인 강 · 잉글랜드 은행');
    ok(r.jAccept && r.noO, '런던 1688.9: 제임스 2세의 부름 · 국왕 편을 맡으면 오라녜 공은 부르지 않는다');
    ok(r.jWind, '템스 어귀: 동풍에 묶인 다트머스 경의 함대 — 쫓는다');
    ok(r.flightEarly && r.flight && r.sealSkip && r.exileSkip, '12월 중순 전에는 기다림 · 국새를 템스강에 · 로체스터 · 겪은 소식은 다시 오지 않는다');
    ok(r.notPortugal && r.france && r.frTrust, '프랑스의 항구(루앙)에서만 — 생제르맹 · 인장 반지 · 프랑스 국왕의 신뢰');
    ok(r.oathNo && r.noCharter, '새 왕에게 맹세하지 않으면 교역 증서가 없다');
    ok(r.late && r.refused && r.oFail, '늦으면 국왕이 다른 배로 · 거절 · 해협 기한 실패');
    ok(r.anyCrown && r.anyDecl && r.anyCharter, '낀 적 없는 제독: 왕관 소식 · 런던에서 권리 선언 · 교역 증서');
    ok(r.old && r.old2, '옛 저장(1692·1700)에는 지난 소식을 띄우지 않는다 · 1700년 저장에는 state.glory를 만들지 않는다');

    // ---- 실제 화면: 런던 화이트홀의 권리 선언
    const shot = await page.evaluate(async () => {
      const k = window.__ui; Object.assign(G.UI, { say: k.say, ask: k.ask, alert: k.alert, confirm: k.confirm, toast: k.toast, choose: k.choose }); G.State.save = k.save;
      TT.auto = true;
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'EN', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.settings.res = 0.35; s.settings.autosave = false;
      const nd = { y: 1689, m: 2, d: 25 }; s.day += G.U.dayIndex(nd) - G.U.dayIndex(s.date); s.date = nd;
      s.loc = { mode: 'city', city: 38, lon: -0.2, lat: 51.6 };
      G.Game.go('city', { cityId: 38 });
      await new Promise(r => setTimeout(r, 2500));
      window.__gp = G.Glory.arrival(G.CITY_DATA[38]);
      return G.Game.sceneName;
    });
    let seen = '';
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500);
      seen = await page.evaluate(() => document.getElementById('ui').innerText);
      if (/잉글랜드의 왕관을 바치나이다/.test(seen)) break;
      await page.keyboard.press('Space').catch(() => {});
    }
    await page.screenshot({ path: path.join(require('os').tmpdir(), 'glory_decl.png') });
    ok(shot === 'city' && /왕관을 바치나이다/.test(seen), '실제 도시 화면 — 런던에서 권리 선언 (임시 폴더 glory_decl.png)');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.slice(0, 3).join(' / ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗', e.message); process.exit(1); });
