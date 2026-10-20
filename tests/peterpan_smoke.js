/* 피터 팬 — 섬이 데려간 아이 (2026-10-20) — js/systems/peterpan.js · js/data/peterpan.js
   · 섬: 외헤브리디스·스카이·멀·아일레이·오크니·셰틀랜드는 「작은 섬」, 에든버러·인버네스·포트윌리엄·킨타이어·케이스네스(본토)는 아니다 — 섬 자리는 게임 지도에서 뭍
   · 데려갈 아이: 견습으로 배에 탄 어른이 되기 전의 자녀(딸도) — 집에 있는 아이·어른이 된 아이는 아니다
   · 루이스 섬에 상륙 → 아이가 사라진다 (k.lost · 견습 목록·뒤를 이을 아들에서 빠짐 · 정보 창 꼬리표) · 부관이 약초를 캐라고 한다
   · 다시 상륙하면 부관의 귀띔 · 사냥·다른 섬의 약초로는 나오지 않는다
   · 그 섬에서 야영 「약초를 캔다」 → 피터 팬이 아이를 돌려주고(사이 +12 · 의학 1) 무급 항해사로 합류 (검술·항해·측량 3, 음악 2)
   · 한 번뿐 · 에든버러 술집 주인의 귀띔 · 초상 그림 등록 · 콘솔 오류 0
   node tests/peterpan_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });
    await page.waitForTimeout(2000);
    for (let i = 0; i < 30 && await page.evaluate(() => G.UI.busy()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
    await page.evaluate(() => G.Game.ensureGeo && G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady && G.Nav && G.Nav.ready(), null, { timeout: 120000 });

    const a = await page.evaluate(() => {
      const PP = G.Peter, Geo = G.Geo, out = {};
      const isl = { 루이스: [-6.6, 58.2], 스카이: [-6.3, 57.3], 멀: [-6.0, 56.45], 아일레이: [-6.2, 55.8], 오크니: [-3.1, 59.0], 셰틀랜드: [-1.25, 60.3] };
      out.isles = Object.keys(isl).map(k => [k, PP.isle(isl[k][0], isl[k][1]), Geo.isLand(isl[k][0], isl[k][1])]);
      const main = { 에든버러: [-3.2, 55.95], 인버네스: [-4.2, 57.5], 포트윌리엄: [-5.1, 56.8], 킨타이어: [-5.5, 55.6], 케이스네스: [-3.3, 58.5], 아드나머칸: [-5.9, 56.7] };
      out.main = Object.keys(main).map(k => [k, PP.isle(main[k][0], main[k][1])]);
      const s = G.Game.state, p = s.player; s.date = { y: 1550, m: 6, d: 1 }; const y = s.date.y;
      const kid = (name, sex, age, aboard) => ({ name, sex, born: { y: y - age, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, aboard, bond: 50 });
      p.kids = [kid('후아나', 'f', 13, false), kid('디에고', 'm', 17, true)];
      out.none = PP.kid();                                   // 집에 있는 딸 · 어른이 된 아들
      p.kids.push(kid('마테오', 'm', 14, true)); p.kids.push(kid('이네스', 'f', 12, true));
      out.pick = PP.kid() && PP.kid().name;                  // 가장 어린 견습
      p.kids.pop();
      out.pick2 = PP.kid() && PP.kid().name;
      out.ready = PP.ready();
      out.img = !!G.Img.file('portraits/legendary/peter_pan') && !!G.Img.file('portraits/legendary/peter_pan_half');
      out.chain = G.Art.portraitKeys ? G.Art.portraitKeys(G.Art.mateSpec('peter_pan')).slice(0, 2) : [];
      out.tavern = G.Frontier.mateReady(G.MATE.peter_pan, 1550);
      return out;
    });
    console.log('   ' + JSON.stringify(a.isles) + '\n   ' + JSON.stringify(a.main));
    ok(a.isles.every(x => x[1] && x[2]), '스코틀랜드의 작은 섬 여섯 곳: 섬으로 알아보고, 게임 지도에서 뭍이다');
    ok(a.main.every(x => !x[1]), '본토(에든버러·인버네스·포트윌리엄·킨타이어·케이스네스·아드나머칸)는 섬이 아니다');
    ok(a.none === null, '집에 있는 아이·어른이 된 견습은 데려가지 않는다');
    ok(a.pick === '이네스' && a.pick2 === '마테오' && a.ready, '견습 중 가장 어린 아이(딸도): ' + a.pick + ' → ' + a.pick2);
    ok(a.img && a.tavern === false, '초상 그림 등록 ' + JSON.stringify(a.chain) + ' · 술집 항해사 후보로는 나오지 않는다');

    // ---------------- 루이스 섬에 상륙
    await page.evaluate(() => {
      window.__said = []; const UI = G.UI;
      window.__say0 = UI.say; window.__ask0 = UI.ask;
      UI.say = async (t, w) => { window.__said.push((w && w.name ? w.name + ': ' : '') + t); };
      UI.ask = async (t, ch) => (window.__askQ && window.__askQ.length ? window.__askQ.shift() : null);
      const s = G.Game.state; s.flags.prologue = true; s.date = { y: 1550, m: 6, d: 1 };
      const sea = G.Nav.nearestSea(-6.6, 58.2, 6);
      let lp = null; for (let r = 0; r < 1.2 && !lp; r += 0.05) for (let a = 0; a < 6.3 && !lp; a += 0.3) { const x = -6.6 + Math.cos(a) * r, y = 58.2 + Math.sin(a) * r; if (G.Geo.isLand(x, y) && G.Peter.isle(x, y) === 'hebrides') lp = [x, y]; }
      window.__lp = lp;
      s.loc = { mode: 'sea', lon: sea[0], lat: sea[1], heading: 0 };
      G.Game.go('land', { landing: { lon: lp[0], lat: lp[1], shipLon: sea[0], shipLat: sea[1] } });
    });
    await page.waitForFunction(() => G.Game.state.peter && G.Game.state.peter.phase === 'lost', null, { timeout: 60000 });
    await page.waitForFunction(() => G.Scenes.land.runtime() && G.Scenes.land.runtime().busy === 0, null, { timeout: 20000 });
    const b = await page.evaluate(() => {
      const s = G.Game.state, k = s.player.kids[2], said = window.__said.join('\n');
      return { kid: k.name, lost: k.lost, isle: s.peter.isle, aboard: G.Family.aboard().map(x => x.name), heirs: G.Family.heirs().map(x => x.name), tag: G.Peter.tag(k),
        smell: /약초 향/.test(said), note: /피터를 찾으러 가요/.test(said), herb: /약초를 캐 보십시오/.test(said) };
    });
    console.log('   ' + JSON.stringify(b));
    ok(b.lost === 'peter' && b.isle === 'hebrides' && b.note && b.smell, '루이스 섬에 상륙 — 견습 ' + b.kid + '의 옷에서 약초 향, 그날 밤 「피터를 찾으러 가요」 쪽지를 남기고 사라졌다');
    ok(b.herb, '부관: 이 섬에서 야영하며 약초를 캐 보자');
    ok(b.aboard.indexOf(b.kid) < 0 && b.heirs.indexOf(b.kid) < 0 && /행방불명\(외헤브리디스 제도\)/.test(b.tag), '사라진 동안 견습 목록·뒤를 이을 아들에서 빠짐 · 정보 창 「' + b.tag.trim() + '」');

    const c = await page.evaluate(async () => {
      const PP = G.Peter, l = G.Game.state.loc; window.__said = [];
      const again = await PP.onLanding(l.lon, l.lat);
      const re = /약초 냄새를 잊지/.test(window.__said.join('\n'));
      const hunt = await PP.onCamp('hunt', l.lon, l.lat);
      const other = await PP.onCamp('herb', -3.1, 59.0);
      window.__said = [];
      await PP.tavernHint(G.CITY_DATA[42]);
      const hint = /서쪽 섬들/.test(window.__said.join('\n'));
      return { again, re, hunt, other, still: G.Game.state.peter.phase, hint };
    });
    ok(!c.again && c.re, '다시 상륙하면 부관이 「약초 냄새를 잊지 마십시오」 귀띔');
    ok(!c.hunt && !c.other && c.still === 'lost', '사냥·다른 섬(오크니)의 약초로는 피터가 나오지 않는다');
    ok(c.hint, '에든버러 술집 주인의 귀띔');

    // ---------------- 야영 → 약초를 캔다
    await page.evaluate(() => { window.__said = []; window.__askQ = ['herb']; window.__bond0 = G.Game.state.player.kids[2].bond; window.__day0 = G.Game.state.day; });
    await page.evaluate(() => Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent && /야영/.test(b.textContent))[0].click());
    await page.waitForFunction(() => G.Game.state.peter.phase === 'done', null, { timeout: 30000 });
    await page.waitForTimeout(500);
    const d = await page.evaluate(() => {
      const s = G.Game.state, k = s.player.kids[2], m = s.mates.filter(x => x.id === 'peter_pan')[0], said = window.__said.join('\n');
      return { lost: k.lost, bond: k.bond - window.__bond0, med: k.sk.med, aboard: G.Family.aboard().map(x => x.name).indexOf(k.name) >= 0, joined: !!m, role: m && m.role, wage: G.MATE.peter_pan.wage,
        sk: ['sword', 'nav', 'survey', 'music'].map(id => G.R.mateSkill(m, id)), crow: /꼬끼오/.test(said), out: /이 섬을 나갈 수만 있다면 어디든 좋아/.test(said), days: s.day - window.__day0 };
    });
    console.log('   ' + JSON.stringify(d));
    ok(d.crow && !d.lost && d.aboard && d.bond >= 12 && d.med === 1, '약초를 캐자 「꼬끼오」 — 피터 팬이 아이를 돌려준다 (사이 +' + d.bond + ' · 의학 1 · 다시 견습)');
    ok(d.out && d.joined && d.wage === 0, '「이 섬을 나갈 수만 있다면 어디든 좋아」 — 무급 항해사로 합류 (' + d.role + ')');
    ok(d.sk.join() === '3,3,3,2', '능력: 검술·항해·측량 3, 음악 2 (' + d.sk.join('·') + ')');

    const e = await page.evaluate(async () => {
      const PP = G.Peter, l = G.Game.state.loc;
      const r = await PP.onLanding(l.lon, l.lat);
      return { r, phase: G.Game.state.peter.phase, lost: G.Game.state.player.kids.some(k => k.lost) };
    });
    ok(!e.r && e.phase === 'done' && !e.lost, '한 번뿐 — 다시 상륙해도 아이가 사라지지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); try { console.error(await page.evaluate(() => (window.__said || []).join('\n').slice(-1500))); } catch (x) {} process.exitCode = 1; } finally { await browser.close(); }
})();
