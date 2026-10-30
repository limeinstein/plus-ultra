/* 동아시아 지역 이름 (2026-10-23, QA #25) — 조선은 중국의 일부가 아니다
   · G.REGIONS[6] = 「동아시아」, G.REGIONS[9] = 「일본」 · 어디에도 「중국·조선」이 없다
   · 지역 6 발견물: 조선 땅의 것은 「동아시아 · 조선」, 중국 땅의 것은 「동아시아 · 중국」 (G.Disc.regName · G.regionLabelAt)
   · 지역 6 도시: 좌표 판정(G.subRegionAt)과 도시 갈래(G.subRegion)가 모두 맞는다
   · 발견 창 태그 · 경쟁자 소문/보고 말(짧은 이름) · 정원 · 업적 · 유행 · 도감 페이지 · 콘솔 오류 0
   node tests/region_label_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const KR = ['jeju', 'bangudae', 'ganghwadolmen', 'janggunchong', 'jisandong', 'namsantower',   // 2026-10-30 휴양지 제주도 · 빠져 있던 조선 땅 발견물 (장군총은 압록강 건너 옛 고구려 땅 — 게임은 조선으로 적는다)
  'muryeong', 'bulguksa', 'seokguram', 'munmu', 'muyeol', 'hwangnyong', 'emille', 'jongmyo', 'sillacrown', 'cheonmado', 'baekjecenser', 'goryeoceladon', 'moonjar', 'tripitaka', 'hunmin',
  'seongsan', 'koreancat', 'moonbear', 'squirrel', 'vinousbird', 'crane', 'shiri', 'dragon', 'haeinsa', 'mireuksa', 'yonggung', 'dokkaebi', 'gumiho', 'gwisin', 'hyeonmu', 'seobul', 'hwaseong',
  'persimmon', 'omija', 'redpine', 'azalea', 'ft_hanyang'];
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const errors = [];
  const watch = page => {
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  };
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } }); watch(page);
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async (KR) => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const out = { reg6: G.REGIONS[6], reg9: G.REGIONS[9] };
      const ds = G.DISCOVERIES.filter(d => d.reg === 6 && d.how !== 'trade');
      out.disc = ds.map(d => ({ id: d.id, name: d.name, full: G.Disc.regName(d), short: G.Disc.regName(d, true), kr: KR.indexOf(d.id) >= 0 }));
      out.jp = G.DISCOVERIES.filter(d => d.reg === 9 && d.how !== 'trade').map(d => G.Disc.regName(d));
      out.trade = G.DISCOVERIES.filter(d => d.how === 'trade' && (d.regions || [d.reg]).indexOf(6) >= 0).map(d => G.Disc.regName(d));
      out.cities = G.CITY_DATA.filter(c => c && c.region === 6).map(c => ({ name: c.name, sub: G.subRegion(c), at: G.subRegionAt(6, c.lon, c.lat), label: G.regionLabel(c) }));
      // 발견 창 (석굴암 · 만리장성)
      out.card = {};
      for (const id of ['seokguram', 'greatwall', 'hunmin', 'tripitaka']) {
        G.Scenes.discoveryCard(G.DISC[id], 0, []);
        for (let k = 0; k < 40 && !document.querySelector('.disc-card .tag'); k++) await new Promise(r => setTimeout(r, 100));
        const tags = [...document.querySelectorAll('.disc-card .tag')].map(x => x.textContent);
        out.card[id] = tags.join(' / ');
        document.querySelectorAll('.modal-back').forEach(m => m.remove());
      }
      // 업적의 지역별 줄 · 유행 자리 이름
      const ach = (G.ACHIEVEMENTS || G.ACHIEVE || []).find(a => a.everyReg);
      out.achRows = ach && G.Achieve ? G.Achieve.progress(ach, []).rows.map(x => x.label) : null;
      out.fad = G.Fad ? G.Fad.where({ k: 'r', key: 6 }) : null;
      return out;
    }, KR);
    const bad = JSON.stringify(r).match(/중국·조선|중국 · 조선/);
    console.log('  지역 6 발견물 ' + r.disc.length + '개 (조선 ' + r.disc.filter(x => x.kr).length + ')');
    console.log('  ' + r.disc.map(x => x.name + '=' + x.short).join(', '));
    ok(r.reg6 === '동아시아' && r.reg9 === '일본', 'G.REGIONS[6]=「동아시아」 · G.REGIONS[9]=「일본」');
    ok(!bad, '어디에도 「중국·조선」이 없다');
    const wrongKr = r.disc.filter(x => x.kr && (x.full !== '동아시아 · 조선' || x.short !== '조선'));
    const wrongCn = r.disc.filter(x => !x.kr && (x.full !== '동아시아 · 중국' || x.short !== '중국'));
    ok(!wrongKr.length, '조선 땅 발견물 ' + r.disc.filter(x => x.kr).length + '개 모두 「동아시아 · 조선」 ' + wrongKr.map(x => x.name + '=' + x.full).join(', '));
    ok(!wrongCn.length, '중국 땅 발견물 ' + r.disc.filter(x => !x.kr).length + '개 모두 「동아시아 · 중국」 ' + wrongCn.map(x => x.name + '=' + x.full).join(', '));
    ok(r.jp.length && r.jp.every(x => x === '동아시아 · 일본'), '일본 발견물 ' + r.jp.length + '개 「동아시아 · 일본」');
    ok(r.trade.every(x => !/조선/.test(x)), '교역품 발견물은 지역 이름만: ' + r.trade.join(', '));
    const cityBad = r.cities.filter(c => c.sub !== c.at);
    ok(!cityBad.length, '지역 6 도시 ' + r.cities.length + '곳: 좌표 판정 = 도시 갈래 (조선 ' + r.cities.filter(c => c.sub === '조선').map(c => c.name).join('·') + ') ' + cityBad.map(c => c.name).join(','));
    ok(/동아시아 · 조선/.test(r.card.seokguram) && /동아시아 · 조선/.test(r.card.hunmin) && /동아시아 · 조선/.test(r.card.tripitaka) && /동아시아 · 중국/.test(r.card.greatwall), '발견 창 태그: ' + JSON.stringify(r.card));
    ok(!r.achRows || (r.achRows.indexOf('동아시아') >= 0 && r.achRows.indexOf('일본') >= 0), '업적 지역 줄: ' + (r.achRows || ['(없음)']).join('·'));
    ok(r.fad === null || r.fad === '동아시아 지역', '유행 자리: ' + r.fad);
    await page.close();

    // 도감 페이지
    const cat = await browser.newPage({ viewport: { width: 1400, height: 900 } }); watch(cat);
    await cat.goto(pathToFileURL(path.join(__dirname, '..', 'catalog.html')).href);
    await cat.waitForFunction(() => window.G && G.DISCOVERIES && document.body.innerText.length > 1000, null, { timeout: 90000 });
    await cat.waitForTimeout(1500);
    const c = await cat.evaluate(async () => {
      const out = { bad: [], seok: null, wall: null, joseonCity: null, chip: false };
      for (const id of [...document.querySelectorAll('[data-tab]')].map(e => e.dataset.tab)) {
        const tb = document.querySelector('[data-tab="' + id + '"]');   // 쪽을 바꾸면 단추를 새로 그리므로 매번 다시 찾는다
        tb.click(); await new Promise(r => setTimeout(r, 1000));
        const html = document.body.innerHTML;
        if (/중국·조선|중국 · 조선/.test(html)) out.bad.push(tb.dataset.tab);
        const cards = [...document.querySelectorAll('#grid .card')];
        const sub = n => { const k = cards.find(e => (e.querySelector('.name') || {}).textContent === n) || cards.find(e => ((e.querySelector('.name') || {}).textContent || '').indexOf(n) >= 0); return k ? k.querySelector('.sub').textContent : null; };
        if (tb.dataset.tab === 'discoveries') { out.seok = sub('석굴암'); out.wall = sub('만리장성'); out.hun = sub('훈민정음 해례본'); }
        if (/^cit/.test(tb.dataset.tab)) { out.joseonCity = sub('한양'); out.chip = [...document.querySelectorAll('[data-chip]')].some(e => e.textContent.trim().indexOf('동아시아') === 0); }
      }
      return out;
    });
    console.log('  도감: ' + JSON.stringify(c));
    ok(!c.bad.length, '도감 모든 쪽에 「중국·조선」이 없다 ' + c.bad.join(','));
    ok(/동아시아 · 조선/.test(c.seok || '') && /동아시아 · 조선/.test(c.hun || '') && /동아시아 · 중국/.test(c.wall || ''), '도감 발견물: 석굴암 「' + c.seok + '」 · 훈민정음 「' + c.hun + '」 · 만리장성 「' + c.wall + '」');
    ok(/동아시아 · 조선/.test(c.joseonCity || '') && c.chip, '도감 도시: 한양 「' + c.joseonCity + '」 · 지역 고르개 「동아시아」');
    await cat.close();
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
