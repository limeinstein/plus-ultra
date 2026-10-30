/* 셰익스피어와 글로브의 불 — 앤 해서웨이 (2026-10-30 사용자 요청) — node tests/globe_smoke.js   (BROWSER_EXE=크롬 경로)
   · 앤 해서웨이(동료 · 짝이 있다: 썸·청혼 대상 아님) · 장면은 런던에서 날짜에 맞게
   · ① 폭풍 이야기 → 1611.11 『템페스트』 소식에 제독의 이야기
   · ② 앤이 런던에 온 날 → 6월 28일까지 머문다(날이 지나간다) → ③ 글로브의 불: 두 출구(맥주 사내) → 뚜껑문으로 분장실 → 원고 궤짝 → 템스 강가 → 둘 다 합류
   · 실패하면 화상(체력 −25) · 원고는 탄다 · 사양하면 스트랫퍼드로 · ④ 바다의 이야기 노래(피로 −10 · 규율 +6 · 차례로 · 사이 20일)
   · 소식: 글로브의 불(사라졌다) · 새 글로브 · 장례(관이 가벼웠다) · 첫 전집(원고) · 옛 저장 · 소문 · 말투 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Globe && G.Globe.hooked && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, GL = G.Globe, said = [], asked = [], out = {};
      let plan = [], chanceV = true;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : null; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async (l) => { said.push('[소식] ' + l.map(x => x.text).join(' / ')); };
      const ch0 = G.U.chance; G.U.chance = () => chanceV;
      const fresh = () => {
        G.State.newGame({ name: '시험', nation: 'EN', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1609, m: 1, d: 1 }; s.player.born = { y: 1579, m: 1, d: 1 }; delete s.life; delete s.globe; s.player.gold = 5000; s.player.hp = 100; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c == null ? 38 : c }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = GL.pending(); if (p) await GL.check(); return p; };
      const hired = (s, id) => s.mates.some(m => m.id === id);
      const A = G.MATE.anne_hathaway;
      out.anne = { g: A.g, wed: A.wed, wWed: G.MATE.shakespeare.wed, cook: A.sk.cook, en: A.lg[3], only: A.eventOnly, wage: A.wage };
      let s = fresh();
      const gate = (y, m, d, c, st) => { at(s, y, m, d, c); s.globe = Object.assign({ told: {} }, st || {}); return GL.pending(); };
      out.gates = { tale: gate(1610, 6, 1), taleLate: gate(1611, 11, 1), taleParis: gate(1610, 6, 1, 14), anne: gate(1613, 6, 10, 38, { tale: 'no' }), anneEarly: gate(1613, 5, 31, 38, { tale: 'no' }), anneLate: gate(1613, 6, 30, 38, { tale: 'no' }) };
      // ── ① 폭풍 이야기
      s = fresh(); at(s, 1610, 6, 1); await go(['monster']);
      out.tale = { v: s.globe.tale, venture: said.some(x => /시 벤처호/.test(x)), tempest: said.some(x => /『템페스트』요/.test(x)) };
      s.loc = { mode: 'sea', lon: -5, lat: 50 }; s.date = { y: 1611, m: 11, d: 1 }; out.tempestNews = GL.daily().map(x => x.text).join(' | ');
      // ── ②③ 앤 · 불 · 합류
      at(s, 1613, 6, 10); chanceV = true; s.player.skills = s.player.skills || {};
      await go(['stay', 'order', 'trap', 'take', 'yes']);
      out.fire = { date: s.date.m + '.' + s.date.d, anne: said.some(x => /^앤 해서웨이: 저는 앤이에요/.test(x)), burbage: said.some(x => /^리처드 버비지: .*축포를 쏘아라/.test(x)), ale: said.some(x => /맥주가 최고지/.test(x)),
        evac: s.globe.evac, path: s.globe.path, ok: s.globe.pathOk, papers: s.globe.papers, item: G.R.hasItem('globe_papers'), stage: said.some(x => /온 세상이 무대요/.test(x)), vanish: said.some(x => /불에 탔다고 생각할 거요/.test(x)),
        joined: s.globe.joined, w: hired(s, 'shakespeare'), a: hired(s, 'anne_hathaway'), loyal: (s.mates.find(m => m.id === 'anne_hathaway') || {}).loyal, wy: G.MATE.shakespeare.y[1] };
      out.noAgain = (at(s, 1613, 6, 20), GL.pending());
      // ── ④ 바다의 이야기 노래
      s.loc = { mode: 'sea', lon: -10, lat: 45 }; s.fleet.fatigue = 50; s.fleet.discipline = 50; s.day = 1000;
      said.length = 0; const r1 = await G.Romance.seaDay();
      out.song1 = { r: r1, fat: 50 - s.fleet.fatigue, dis: s.fleet.discipline - 50, n: s.globe.songN, text: said.filter(x => /다섯 길 물 아래/.test(x)).length };
      s.day += 5; const r2 = await GL.seaDay();
      s.day += 20; said.length = 0; const r3 = await GL.seaDay();
      out.song2 = { gap: r2, next: r3, rain: said.some(x => /비는 날마다 내리네/.test(x)), n: s.globe.songN };
      // 소식
      s.date = { y: 1613, m: 6, d: 30 }; out.fireNews = GL.daily().map(x => x.text).join(' | ');
      s.date = { y: 1614, m: 6, d: 1 }; out.rebuilt = GL.daily().map(x => x.text).join(' | ');
      s.date = { y: 1616, m: 4, d: 23 }; out.funeral = GL.daily().map(x => x.text).join(' | ');
      s.date = { y: 1623, m: 11, d: 8 }; out.folio = GL.daily().map(x => x.text).join(' | ');
      // 썸·청혼 대상이 아니다
      out.noLove = G.MATE.anne_hathaway.wed && G.MATE.shakespeare.wed;
      // ── 실패: 화상 · 원고는 탄다 · 사양
      s = fresh(); at(s, 1613, 6, 29); chanceV = false;
      await go(['go', 'jump', 'no']);
      out.fail = { ok: s.globe.pathOk, hp: s.player.hp, papers: s.globe.papers, joined: s.globe.joined, w: hired(s, 'shakespeare'), a: hired(s, 'anne_hathaway'), noStay: !asked.some(a => /머물겠는가/.test(a.t)) };
      s.loc = { mode: 'sea', lon: -10, lat: 45 }; s.date = { y: 1616, m: 4, d: 23 }; s.globe.told = { tempest: 1, fireNews: 1, rebuilt: 1 }; out.death = GL.daily().map(x => x.text).join(' | ');
      out.noSong = (s.day += 100, await GL.seaDay());
      // ── 옛 저장 · 소문 · 말투
      s = fresh(); s.date = { y: 1630, m: 1, d: 1 }; delete s.globe; out.oldSave = GL.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'globe');
      out.voice = !!(G.VOICES && G.VOICES.shakespeare && G.VOICES.anne_hathaway && G.VOICES.anne_hathaway.stories.length === 4);
      out.journal = !!(GL.daily && GL.daily._journal);
      G.U.chance = ch0;
      return out;
    });
    console.log(JSON.stringify({ fire: r.fire, song1: r.song1, song2: r.song2, fail: r.fail }));
    ok(r.anne.g === 'f' && r.anne.wed === 'shakespeare' && r.anne.wWed === 'anne_hathaway' && r.anne.cook === 3 && r.anne.en === 3 && r.anne.only && r.anne.wage === 0, '동료 앤 해서웨이 — 요리 3 · 영어 · 품삯 없음 · 셰익스피어와 짝(wed)');
    const g = r.gates;
    ok(g.tale && !g.taleLate && !g.taleParis && g.anne && !g.anneEarly && !g.anneLate, '장면이 런던에서 날짜에 맞게 열린다 ' + JSON.stringify(g));
    ok(r.tale.v === 'monster' && r.tale.venture && r.tale.tempest && /캘리번/.test(r.tempestNews) && /제독이 술잔을 사이에 두고/.test(r.tempestNews), '① 폭풍 이야기 → 1611.11 『템페스트』 궁정 공연에 제독의 이야기(캘리번)');
    const f = r.fire;
    ok(f.date === '6.28' && f.anne && f.burbage && f.evac === 'order' && f.ale, '② 앤이 런던에 오고 6월 28일까지 머문다 → ③ 축포의 불씨 · 두 출구 · 맥주 끼얹은 사내');
    ok(f.path === 'trap' && f.ok && f.papers && f.item, '불타는 분장실 — 뚜껑문(「지옥」)으로 들어가 원고 궤짝을 건진다');
    ok(f.stage && f.vanish && f.joined === 'yes' && f.w && f.a && f.loyal === 90 && f.wy >= 1660 && !r.noAgain, '템스 강가 — 「불에 탔다고 믿게 두자 · 온 세상이 무대」 → 둘 다 배에 오른다 (떠나지 않게 해를 늘림)');
    ok(r.song1.r === true && r.song1.fat === 10 && r.song1.dis === 6 && r.song1.n === 1 && r.song1.text >= 1 && r.song2.gap === false && r.song2.next === true && r.song2.rain && r.song2.n === 2, '④ 바다의 이야기 노래 — 피로 −10 · 규율 +6 · 차례로(다섯 길 물 아래 → 비는 날마다) · 20일 사이');
    ok(/보이지 않는다/.test(r.fireNews) && /빈 의자 둘/.test(r.rebuilt) && /관이 이상하게 가벼웠다/.test(r.funeral) && /바다에서 왔다/.test(r.folio) && r.noLove, '소식 — 사라진 부부 · 빈 의자 둘 · 가벼운 관 · 첫 전집의 원고는 「바다에서」');
    ok(r.fail.ok === false && r.fail.hp === 75 && r.fail.papers === false && r.fail.joined === 'no' && !r.fail.w && !r.fail.a && r.fail.noStay && /두 번째로 좋은 침대/.test(r.death) && r.noSong === false, '실패하면 화상(체력 −25) · 원고는 탄다 · 사양하면 스트랫퍼드로 — 역사 그대로의 죽음 소식 · 노래 없음');
    ok(r.oldSave === 0 && r.rumor && r.voice && r.journal, '옛 저장 · 소문 · 고유 말투(셰익스피어·앤) · 일지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
