/* 꼬리에 꼬리를 무는 발견(js/data/chaindisc.js)과 업적(js/data/achievements.js · js/systems/achieve.js) 점검
   · 새 사슬 발견 50곳, 모든 앞 고리·업적 목록의 id가 실제로 있다, 무 제국의 앞 고리는 쿠페의 별길
   · 앞 고리를 찾기 전에는 그 자리에 가도 찾지 못하고(checkLand·checkSea), 소문에도 오르지 않는다
   · 앞 고리를 찾으면(D.find) 사슬의 말과 함께 다음 고리 단서가 생긴다 — 둘이 필요한 고리는 둘 다 찾아야
   · 무 대륙 사슬을 끝까지: 모아이 → 롱고롱고 → 라피타 → (난마돌) → 레루 → 쿠페 → 무
   · 업적: 진행 계산, 이루면 보상(금화·명성·칭호)과 알림 창, 「한 가지 남았다」 귀띔, 하루가 지나면 옛 저장의 업적·사슬 단서를 챙긴다
   · 수첩 「업적」 쪽과 도감의 앞 고리·다음 고리 줄이 뜬다, 콘솔 오류 없음
   node tests/chain_achv_smoke.js  (playwright) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const { chromium } = pw;
const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, 'index.html')).href;
const CAT = pathToFileURL(path.join(ROOT, 'catalog.html')).href;
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'chain_achv_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Achieve && G.CHAINS, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, D = G.Disc, out = {};
      s.date.y = 1600;
      // 장면·창은 바로 넘긴다
      const said = [], wins = [], toasts = [], win0 = G.UI.window, say0 = G.UI.say, toast0 = G.UI.toast;
      G.UI.say = async t => { said.push(String(t)); }; G.UI.toast = t => { toasts.push(String(t)); };
      G.UI.window = o => { wins.push(o.title + '|' + (o.html || '').replace(/<[^>]+>/g, ' ')); return { result: Promise.resolve(1), el: document.createElement('div'), content: document.createElement('div') }; };
      G.Scenes.discoveryReveal = async () => {}; G.Scenes.discoveryCard = async () => {};
      if (G.Names) G.Names.offer = async () => {}; if (G.Scenes.city) G.Scenes.city.news = async () => {};
      const ids = new Set(G.DISCOVERIES.map(d => d.id)), bad = [];
      G.DISCOVERIES.forEach(d => (d.need || []).forEach(x => { if (!ids.has(x)) bad.push(d.id + '<-' + x); }));
      G.ACHIEVEMENTS.forEach(a => (a.ids || []).concat(...(a.cats || []).map(c => c.ids || [])).forEach(x => { if (!ids.has(x)) bad.push(a.id + ':' + x); }));
      G.CHAINS.forEach(c => c.root.concat(c.ids).forEach(x => { if (!ids.has(x)) bad.push(c.id + ':' + x); }));
      out.data = { chainDisc: G.CHAIN_DISC.length, chains: G.CHAINS.length, achv: G.ACHIEVEMENTS.length, bad, mu: G.DISC.mu.need.join(),
        dup: G.DISCOVERIES.map(d => d.id).filter((x, i, a) => a.indexOf(x) !== i) };

      // 잠긴 고리: 그 자리에 가도, 소문에도
      const rr = G.DISC.rongorongo, at = G.DISC.atlantis;
      out.locked = { land: D.checkLand(rr.lon, rr.lat).hits.indexOf(rr) >= 0, sea: D.checkSea(at.lon, at.lat).indexOf(at) >= 0, avail: D.available(rr),
        rumour: Array.from({ length: 300 }, () => G.Scenes.city.B.tavern.rumour(G.CITY_DATA[0])).some(d => d && d.chain) };

      // 무 대륙 사슬 (무 제국은 태평양 개척 단계도 열려 있어야 한다 — 여기서는 단계를 모두 연 셈 친다)
      const avail0 = G.Frontier.available; G.Frontier.available = d => !d.need || d.need.every(x => D.foundByMe(x));
      const step = [];
      async function find(id) { await D.find(G.DISC[id], 'land'); step.push(id + ':' + Object.keys(s.hints).filter(h => G.DISC[h].chain === 'mu').join('/')); }
      await find('moai');
      out.afterMoai = { hint: !!s.hints.rongorongo, src: s.hints.rongorongo && s.hints.rongorongo.src, line: said.some(t => /그림 글자 나무판/.test(t)),
        landNow: D.checkLand(rr.lon, rr.lat).hits.indexOf(rr) >= 0 };
      await find('rongorongo'); await find('lapita');
      out.leluWait = { hint: !!s.hints.lelu, avail: D.available(G.DISC.lelu) };     // 난마돌을 아직 못 찾았다
      await find('nanmadol');
      out.leluOpen = !!s.hints.lelu;
      await find('lelu'); await find('kupe');
      out.muHint = !!s.hints.mu;
      const hits = D.checkSea(-170, -5).map(d => d.id);
      out.muSea = hits.indexOf('mu') >= 0;
      await find('mu');
      out.chainDone = G.Achieve.chainDone(G.CHAINS[0]);
      G.Frontier.available = avail0;
      out.achvFirst = { done: G.Achieve.done('firstchain'), win: wins.some(w => /업적 달성\|.*꼬리에 꼬리를/.test(w)), log: s.log.slice(-8).map(x => x.t).join(' / ').includes('꼬리에 꼬리를') };

      // 업적 진행·「한 가지 남았다」·보상
      const g0 = s.player.gold, f0 = s.player.fame;
      for (const id of ['dragon', 'whitetiger', 'phoenix']) await D.find(G.DISC[id], 'land');
      out.almost = toasts.some(t => /사신 — 하늘의 네 짐승.*한 가지 남았다/.test(t));
      const p3 = G.Achieve.progress(G.Achieve.get('foursymbols'));
      await D.find(G.DISC.hyeonmu, 'land');
      const a4 = G.Achieve.get('foursymbols');
      out.four = { before: p3.have + '/' + p3.need, done: G.Achieve.done('foursymbols'), gold: s.player.gold - g0 >= a4.gold, fame: s.player.fame > f0, title: G.Achieve.titles().indexOf(a4.title) >= 0 };

      // 옛 저장: 앞 고리를 이미 찾은 상태(사슬 단서 없음)·이미 채운 업적 → 하루가 지나면 챙긴다
      s.disc.knossos = { me: true, found: 15990101 }; delete s.hints.akrotiri;
      ['t_pepper', 't_clove', 't_nutmeg', 't_cinnamon', 't_ginger', 't_allspice'].forEach(id => { s.disc[id] = { me: true, found: 15990101 }; });
      const news = G.Achieve.daily();
      out.daily = { akrotiri: !!s.hints.akrotiri, src: s.hints.akrotiri && s.hints.akrotiri.src, spices: G.Achieve.done('spices'), news: news.map(n => n.text.slice(0, 40)) };

      // 수첩 쪽
      const el = document.createElement('div'); G.Achieve.page(el);
      out.page = { rows: el.querySelectorAll('.achv-row').length, chains: el.querySelectorAll('.ch-row').length, locks: el.querySelectorAll('.ch-s.lock').length, done: el.querySelectorAll('.achv-row.done').length };
      G.UI.window = win0; G.UI.say = say0; G.UI.toast = toast0;
      return out;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 2500));
    ok(r.data.chainDisc === 50 && r.data.chains === 11 && !r.data.bad.length && !r.data.dup.length, '사슬 발견 50곳·사슬 11갈래, 모든 id가 있다 ' + r.data.bad.join(','));
    ok(r.data.mu === 'kupe', '무 제국의 앞 고리는 쿠페의 별길');
    ok(r.data.achv >= 50, '업적 ' + r.data.achv + '가지');
    ok(!r.locked.land && !r.locked.sea && !r.locked.avail && !r.locked.rumour, '잠긴 고리는 그 자리에 가도·소문으로도 찾지 못한다');
    ok(r.afterMoai.hint && /^chain:moai/.test(r.afterMoai.src) && r.afterMoai.line && r.afterMoai.landNow, '모아이를 찾으면 사슬의 말과 함께 롱고롱고 단서, 이제 그 자리에서 찾는다');
    ok(!r.leluWait.hint && !r.leluWait.avail && r.leluOpen, '레루는 라피타와 난마돌을 둘 다 찾아야 열린다');
    ok(r.muHint && r.muSea, '쿠페의 별길을 찾으면 무 제국 단서, 그 바다에서 무를 찾는다');
    ok(r.chainDone && r.achvFirst.done && r.achvFirst.win && r.achvFirst.log, '사슬 완성 → 업적 「꼬리에 꼬리를」 알림 창·일지');
    ok(r.almost, '「사신」 업적까지 한 가지 남았다고 귀띔한다 (' + r.four.before + ')');
    ok(r.four.done && r.four.gold && r.four.fame && r.four.title, '사신을 모두 찾으면 업적·금화·명성·칭호');
    ok(r.daily.akrotiri && /^chain:knossos/.test(r.daily.src) && r.daily.spices && r.daily.news.length >= 2, '옛 저장: 하루가 지나면 사슬 단서와 이미 채운 업적을 챙긴다 — ' + r.daily.news.join(' | '));
    ok(r.page.rows === r.data.achv && r.page.chains === 11 && r.page.locks > 0 && r.page.done >= 3, '수첩 「업적」 쪽: 업적 ' + r.page.rows + ' · 사슬 ' + r.page.chains + ' · 잠김 ' + r.page.locks + ' · 달성 ' + r.page.done);

    // 화면: 수첩 「업적」 쪽
    await page.evaluate(() => { G.Info.open('achv'); });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'achv_page.png') });

    await page.goto(CAT);
    await page.waitForFunction(() => document.body && document.body.innerText.length > 100, null, { timeout: 60000 });
    const cat = await page.evaluate(() => ({ need: G.DISC.lelu.need.join(), next: G.DISCOVERIES.filter(x => x.need && x.need.indexOf('moai') >= 0).map(x => x.id).join() }));
    ok(cat.need === 'lapita,nanmadol' && cat.next === 'rongorongo', '도감: 레루의 앞 고리 ' + cat.need + ', 모아이의 다음 고리 ' + cat.next);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
