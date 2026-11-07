/* 발견 유물 더하기 — 동물의 새끼 · 전설 생물의 물건 · 종교 발견물의 성물 (js/data/discrelics.js · 2026-11-07)
   node tests/disc_relics_smoke.js        (ART=1 이면 images/relics/ 그림이 모두 있는지도 본다 — Codex 작업 뒤)
   · 표의 모든 줄이 G.RELIC·G.ITEM 에 들어가고 id 가 겹치지 않는다 · 예전 유물 id 는 그대로 (r_tiger·r_tiger2 …)
   · 전설 생물(전설·미신 관심사)에는 새끼가 없고 전설의 물건이, 실제 동물에는 새끼가, 종교 발견물에는 성물이
   · 실제로 찾으면 소지품에 들어온다: 호랑이 → 호랑이 새끼 · 티라노 → 이빨 화석 · 인어 → 인어의 귀걸이 · 노트르담 → 성물
   · 코드 그림(G.Art.relicArt)이 모두 오류 없이 그려진다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let passed = 0;
function ok(v, msg) { if (!v) throw new Error(msg); passed++; console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const a = await page.evaluate(() => {
      const T = G.DISC_RELICS, ids = T.map(r => r[1]), out = { n: T.length, groups: {} };
      out.unique = new Set(ids).size === ids.length;
      out.missingDisc = T.filter(r => !G.DISC[r[0]]).map(r => r[0]);
      out.notReg = T.filter(r => !G.RELIC[r[1]] || !G.ITEM[r[1]] || G.RELIC[r[1]].relic !== r[0]).map(r => r[1]);
      out.dupName = (() => { const mine = new Set(ids), d = []; Object.values(G.RELIC).forEach(r => { if (!mine.has(r.id) && T.some(t => t[2] === r.name)) d.push(r.name); }); const nm = T.map(t => t[2]); nm.forEach((x, i) => { if (nm.indexOf(x) !== i) d.push(x); }); return d; })();
      out.old = ['r_tiger', 'r_tiger2', 'r_mermaid', 'r_dragon', 'r_dragon2', 'r_notredame', 'r_grail'].map(id => id + ':' + (G.RELIC[id] ? G.RELIC[id].name : '없음'));
      T.forEach(r => { const g = /_baby$/.test(r[1]) ? 'baby' : /_legend$/.test(r[1]) ? 'legend' : 'faith'; out.groups[g] = (out.groups[g] || 0) + 1; });
      const myth = G.DISCOVERIES.filter(d => d.cat === 'creature' && !d.plant && G.INTERESTS.myth.has(d) && d.id !== 'bullocho');
      out.mythBaby = myth.filter(d => G.RELIC['r_' + d.id + '_baby']).map(d => d.id);
      out.mythNoLegend = myth.filter(d => !G.RELIC['r_' + d.id + '_legend']).map(d => d.id);
      const animals = G.DISCOVERIES.filter(d => d.cat === 'creature' && !d.plant && !G.INTERESTS.myth.has(d) && !d.legendBeast && !G.Disc.isFuture(d));   // 1700년 뒤에 생긴 품종(신기루로만 보임)은 새끼가 없다
      out.animalNoBaby = animals.filter(d => !G.RELIC['r_' + d.id + '_baby'] && !G.RELIC['r_' + d.id + '_legend']).map(d => d.id);
      const faith = G.DISCOVERIES.filter(d => G.INTERESTS.faith.has(d) && !(d.mirageFrom || d.alwaysMirage || (d.built && d.built >= 1700)));
      out.faithNoHoly = faith.filter(d => !G.RELIC['r_' + d.id + '_holy']).map(d => d.id);
      out.babyKinds = [...new Set(T.filter(r => /_baby$/.test(r[1])).map(r => r[3]))];
      out.samples = ['r_tiger_baby', 'r_shiba_baby', 'r_shire_baby', 'r_morpho_baby', 'r_f_bluefin_baby', 'r_trex_legend', 'r_mermaid_legend', 'r_dragon_legend', 'r_notredame_holy', 'r_kaaba_holy', 'r_bulguksa_holy', 'r_tripitaka_holy'].map(id => id + '=' + (G.RELIC[id] ? G.RELIC[id].name + '/' + G.RELIC[id].kind + '/' + G.RELIC[id].price : '없음'));
      // 코드 그림
      let artErr = []; T.forEach(r => { try { const c = G.Art.relicArt(G.RELIC[r[1]], 96, 96); if (!c || !c.width) artErr.push(r[1]); } catch (e) { artErr.push(r[1] + ':' + e.message); } });
      out.artErr = artErr;
      out.noImg = T.filter(r => !(G.IMAGE_FILES && G.IMAGE_FILES['relics/' + r[1]])).length;
      return out;
    });
    console.log('   ' + a.samples.join('\n   '));
    ok(a.n === 411 && a.unique && !a.missingDisc.length && !a.notReg.length, '표 ' + a.n + '줄 모두 G.RELIC·G.ITEM 에 등록, id 겹침 없음 — ' + JSON.stringify(a.groups));
    ok(!a.dupName.length, '새 유물 이름이 서로·예전 유물과 겹치지 않는다' + (a.dupName.length ? ' — ' + a.dupName.join(',') : ''));
    ok(a.old.every(x => !/없음/.test(x)), '예전 유물 id 그대로: ' + a.old.join(' · '));
    ok(!a.mythBaby.length && !a.mythNoLegend.length, '전설 생물에는 새끼 대신 전설의 물건' + (a.mythNoLegend.length ? ' — 빠짐 ' + a.mythNoLegend : ''));
    ok(!a.animalNoBaby.length && a.babyKinds.join() === 'animal', '실제 동물은 모두 새끼(동식물)' + (a.animalNoBaby.length ? ' — 빠짐 ' + a.animalNoBaby : ''));
    ok(!a.faithNoHoly.length, '종교 발견물(신기루 빼고)은 모두 성물' + (a.faithNoHoly.length ? ' — 빠짐 ' + a.faithNoHoly : ''));
    ok(!a.artErr.length, '코드 그림 ' + a.n + '장 오류 없음' + (a.artErr.length ? ' — ' + a.artErr.slice(0, 5) : ''));
    if (process.env.ART) ok(a.noImg === 0, 'images/relics/ 그림 모두 있음 (없는 것 ' + a.noImg + ')');
    else console.log('   (그림 파일이 아직 없는 유물 ' + a.noImg + '종 — Codex 작업 뒤 ART=1 로 확인)');
    // 실제로 찾기
    const b = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const UI = G.UI; UI.say = async () => {}; UI.ask = async (t, o) => o[0].value; UI.alert = async () => {}; UI.toast = () => {};
      UI.window = (o) => ({ result: Promise.resolve(o.buttons ? o.buttons[o.buttons.length - 1].value : null), el: document.createElement('div'), content: document.createElement('div') });
      // 획득 규칙을 검사하는 동안 발견 연출과 닫기 입력은 기다리지 않는다.
      G.Scenes.discoveryCard = async () => {}; G.Scenes.discoveryReveal = async () => {}; G.Scenes.discoveryVoices = async () => {};
      if (G.Mirage) G.Mirage.vanish = async () => {};
      if (G.Names) G.Names.offer = async () => {};
      const s = G.Game.state, D = G.Disc, got = {};
      for (const id of ['tiger', 'trex', 'mermaid', 'notredame', 'shiba']) {
        const before = s.player.items.length; await D.find(G.DISC[id], G.DISC[id].how);
        got[id] = s.player.items.slice(before).map(i => (G.ITEM[i.id] || {}).name || i.id);
      }
      return got;
    });
    ok(b.tiger.includes('호랑이 새끼'), '호랑이를 찾으면: ' + b.tiger.join(' · '));
    ok(b.trex.includes('티라노사우루스 이빨 화석') && !b.trex.some(x => /새끼/.test(x)), '티라노사우루스(신기루로 보아도 화석은 손에 넣는다): ' + b.trex.join(' · '));
    ok(b.mermaid.includes('인어의 귀걸이'), '인어: ' + b.mermaid.join(' · '));
    ok(b.notredame.some(x => /노트르담 대성당의/.test(x)), '노트르담 대성당: ' + b.notredame.join(' · '));
    ok(b.shiba.length === 0 || b.shiba.includes('시바견 강아지'), '시바견(신기루면 없음): ' + (b.shiba.join(' · ') || '— 신기루'));
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.slice(0, 3).join(' | ') : ''));
    console.log('통과 ' + passed);
  } catch (e) { console.log('실패: ' + e.message); if (errors.length) console.log(errors.join('\n')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
