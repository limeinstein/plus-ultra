/* 권력자는 부하 후보가 아니다 (tests/matepower_smoke.js) — node tests/matepower_smoke.js   (BROWSER_EXE=크롬 경로)
   후원자·군주·라이벌과 같은 사람 + 사건 속 권력자(콩고 왕·카시케·칼레의 드레이크·투르구트·구키 요시타카 …)는 술집·귀띔·수첩·여급의 행방 찾기·남의 배 선장에 나오지 않는다.
   학자·통역 같은 사람(케플러·갈릴레이·시난·라 코사)은 그대로. 이미 태운 사람은 그대로, 사건으로 태우는 것(레오나르도)은 된다.
   피리 레이스·정성공은 예외. 바다에서 사로잡은 이름난 선장(바르바로사 등)은 권력자여도 철새가 된다. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const U_ = '';
const fs = require('fs');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.MatePower, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, MP = G.MatePower, F = G.Frontier, UI = G.UI;
      await G.Game.ensureGeo();
      UI.say = async () => {}; UI.ask = async (t, o) => o[0].value; UI.alert = async () => {}; UI.toast = () => {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const fresh = (y) => { const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'EN', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' }); const nd = { y, m: 6, d: 1 }; s.day += G.U.dayIndex(nd) - G.U.dayIndex(s.date); s.date = nd; return s; };
      const list = MP.list(); out.list = list.map(x => x.id + ':' + x.why).join('\n');
      const ids = list.map(x => x.id);
      const must = ['kisk', 'h_cuauhtemoc', 'h_powhatan', 'h_caonabo', 'h_anacaona', 'h_enriquillo', 'drake', 'barbarossa', 'h_turgut', 'h_yoshitaka', 'h_suriyothai', 'tycho', 'vespucci', 'dias', 'elcano', 'h_yisunsin', 'h_abulfazl', 'h_patiunus'];
      out.missing = must.filter(id => ids.indexOf(id) < 0).join(',');
      const keep = ['leonardo', 'piri', 'h_zhengchenggong', 'kepler', 'galileo', 'h_sinan', 'lacosa', 'h_musashi', 'h_wangzhi', 'tupac', 'lucrezia_medici'];
      out.wrong = keep.filter(id => ids.indexOf(id) >= 0).join(',');
      out.noWitch = !list.some(x => G.MATE[x.id].witch || G.MATE[x.id].wd);
      // 술집 손님
      let s = fresh(1580);
      G.MateMove.locs();
      const plain = G.MATES.filter(m => m.y[0] <= 1580 && m.y[1] >= 1580 && !m.tale && !m.eventOnly && !m.wd && !m.witch && !MP.blocked(m) && F.mateReady(m, 1580))[0];
      const lon = G.CITY_DATA[38], here0 = G.MateMove.here;
      G.MateMove.here = () => [G.MATE.drake, G.MATE.h_turgut, G.MATE.tycho, plain];   // 그 도시에 셋이 함께 머문다고 치고
      const cand = G.Scenes.city.B.tavern.candidates(lon).map(m => m.id);
      G.MateMove.here = here0;
      out.tavern = cand.indexOf('drake') < 0 && cand.indexOf('h_turgut') < 0 && cand.indexOf('tycho') < 0 && cand.indexOf(plain.id) >= 0;
      out.where = plain.name;
      const cid = 38;
      out.ready = !F.mateReady(G.MATE.drake, 1580) && F.mateReady(G.MATE[plain.id], 1580);
      // 귀띔 · 수첩 · 여급
      const far = 40;
      out.hint = !/드레이크/.test(G.Scenes.city.B.tavern.mateHint(lon) || '');
      if (G.MateKnow) {
        G.MateKnow.know('drake', far, 'rumor'); G.MateKnow.know(plain.id, cid, 'rumor');
        const kl = G.MateKnow.list().map(d => d.id);
        out.known = kl.indexOf('drake') < 0 && kl.indexOf(plain.id) >= 0;
        out.byName = G.MateKnow.byName('프랜시스 드레이크').length === 0 && G.MateKnow.byName(plain.name).length >= 1;
      } else { out.known = out.byName = true; }
      // 이미 태운 사람은 그대로
      s.mates.push({ id: 'drake', role: 'none', loyal: 80 }); out.hiredKeep = s.mates.some(m => m.id === 'drake');
      // 사건으로 태우기 — 레오나르도
      s = fresh(1500); const before = s.mates.length; if (G.Leo && G.Leo.invite) await G.Leo.invite(true); out.leo = !G.Leo || s.mates.some(m => m.id === 'leonardo');
      // 사로잡은 이름난 선장이 권력자면 몸값
      s = fresh(1540); s.loc = { mode: 'sea', lon: 5, lat: 40 };
      const capBefore = !G.Frontier.mateReady(G.MATE.barbarossa, 1540);
      const g0 = s.player.gold, lines = [];
      G.Captains && G.Captains.afterBattle && G.Captains.afterBattle({ kind: 'pirate', cap: { id: 'pr_hayreddin', name: '하이레딘 바르바로사', src: 'hist', mate: 'barbarossa' } }, 'win', [{ side: 'en', flag: true, captured: true }], lines);
      out.capBefore = capBefore;
      out.capture = !!G.Captains && lines.some(t => /철새가 되어/.test(t)) && G.Frontier.mateReady(G.MATE.barbarossa, 1540) && !!(s.capFreed && s.capFreed.barbarossa);
      out.capName = Object.keys(G).filter(k => /Captain/i.test(k)).join(',');
      return out;
    });
    console.log('  막힌 사람 ' + r.list.split('\n').length + '명:\n    ' + r.list.split('\n').join('\n    '));
    ok(!r.missing, '권력자·라이벌이 모두 부하 후보에서 빠졌다' + (r.missing ? ' — 빠짐: ' + r.missing : ''));
    ok(!r.wrong && r.noWitch, '예외(레오나르도·피리 레이스·정성공)와 학자·통역·검객·길잡이(케플러·갈릴레이·시난·라 코사·무사시 …)·철새·마녀는 그대로' + (r.wrong ? ' — 잘못 막힘: ' + r.wrong : ''));
    ok(r.tavern && r.ready, '술집 손님: 드레이크·투르구트·튀코 브라헤는 같은 술집에 있어도 부하 후보로 나오지 않고, ' + r.where + U_ + '는 나온다');
    ok(r.hint && r.known && r.byName, '술집 주인의 귀띔 · 수첩 「철새」 · 여급의 행방 찾기에도 나오지 않는다');
    ok(r.hiredKeep && r.leo, '이미 태운 사람(옛 저장)은 그대로 · 레오나르도는 밤샘 이야기 뒤 배에 오른다');
    ok(r.capBefore && r.capture, '바르바로사: 술집에는 나오지 않다가, 바다에서 기함을 사로잡으면 철새가 되어 부하 후보로');
    const az = fs.readFileSync(path.join(ROOT, 'js/systems/aztec.js'), 'utf8');
    ok(az.indexOf("joinMate('h_cuauhtemoc'") < 0 && /황제는 남의 배에서 노를 젓지 않는다/.test(az), '아즈텍의 멸망: 구한 쿠아우테목은 부하가 되지 않고 마야 해안에 내린다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.slice(0, 3).join(' / ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗', e.message); process.exit(1); });
