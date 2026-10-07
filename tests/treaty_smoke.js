/* 토르데시야스 조약(1494.6.7)·사라고사 조약(1529.4.22) 점검 (js/systems/treaty.js · js/data/treaty.js)
   · 6월 6일까지는 조건이 없고, 6월 7일에 조약 창(세계 지도·경계선)이 뜨며 그날부터 조건이 걸린다
   · 반구: 서경 46.5° 서쪽 에스파냐 · 동쪽 포르투갈, 브라질은 포르투갈, 지구 반대편은 1529년부터 동경 144.5°(향료제도는 포르투갈)
   · 새로 찾은 땅의 몫과 보고 사례금 (같은 왕실 ×1.15 · 상대 왕실 ×0.7 · 잉글랜드·프랑스는 조약을 모른다), 동북아시아·보물은 조약 밖
   · 상대 왕실 반구의 상대 왕실 항구는 막힘 (1516년 뒤 「에스파냐」 이름도), 동북아시아(오문)는 막지 않음
   · 포르투갈어가 통하는 항구 (고아·상해·나가사키·무스카트), 바다에서 경계선을 넘으면 알림, 해도에 선, 옛 저장, 콘솔 오류 0
   node tests/treaty_smoke.js   (스크린샷: OUT 또는 임시 폴더/treaty_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'treaty_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + String(e.stack).split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  async function closeWin() { await page.waitForTimeout(400); await page.locator('.win .foot button').last().click(); await page.waitForTimeout(400); }
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Treaty && G.TREATY, null, { timeout: 90000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 200 });

    // ① 조약의 날 — 리스본에 있는 포르투갈 제독
    const pre = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      if (G.BALANCE.disaster) G.BALANCE.disaster.random = 0; if (G.BALANCE.econ) G.BALANCE.econ.perDay = 0;
      s.date = { y: 1494, m: 6, d: 5 };
      s.history = G.HISTORY.findIndex(h => h.y > 1493);   // 1494년 소식부터
      const m1 = G.Game.passDays(1);   // 6월 6일
      const o = { d6: G.Treaty.active(), t1a: s.treaty && s.treaty.t1, newsBefore: m1.filter(m => /토르데시야스/.test(m.text)).length };
      const m2 = G.Game.passDays(1);   // 6월 7일
      o.d7 = G.Treaty.active(); o.t1b = s.treaty.t1; o.newsQuiet = m2.filter(m => /토르데시야스/.test(m.text)).length; o.log = s.log.slice(-3).map(l => l.t);
      s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat };
      G.Game.go('city', { cityId: 0 });
      return o;
    });
    console.log(JSON.stringify(pre));
    ok(!pre.d6 && !pre.t1a && pre.newsBefore === 0, '1494년 6월 6일까지는 조약이 없다');
    ok(pre.d7 && pre.t1b === 'due' && pre.newsQuiet === 0 && pre.log.some(t => /토르데시야스/.test(t)), '6월 7일: 조약이 걸림 (일지에 적고 창을 기다림, 「세상의 소식」 한 줄로 따로 띄우지 않음)');
    await page.waitForFunction(() => G.Game.sceneName === 'city', null, { timeout: 30000 });
    await page.waitForSelector('.treaty canvas', { timeout: 20000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, 'tordesillas.png') });
    const tw = await page.evaluate(() => ({ text: document.querySelector('.treaty').innerText, cv: document.querySelector('.treaty canvas').width }));
    await closeWin();
    const t1 = await page.evaluate(() => G.Game.state.treaty.t1);
    ok(/370레구아/.test(tw.text) && /브라질/.test(tw.text) && /동북아시아/.test(tw.text) && /포르투갈의 제독/.test(tw.text) && tw.cv === 900 && t1 === 1, '조약 창: 370레구아·브라질·동북아시아·제독의 처지, 세계 지도 · 닫으면 다시 안 뜸');

    // ② 반구·몫·보고 사례금
    const r = await page.evaluate(() => {
      const s = G.Game.state, T = G.Treaty, o = {};
      o.side = { brazil: T.side(-38, -12), mexico: T.side(-96, 19), calicut: T.side(75.8, 11.2), moluccas: T.side(127.4, 0.8), ng140: T.side(140, -3), guam: T.side(144.8, 13.4) };
      const D = G.DISC;
      o.claim = { westroute: T.claimOf(D.westroute), capegood: T.claimOf(D.capegood), spice: T.claimOf(D.spiceis) };
      const ne = G.DISCOVERIES.find(d => (d.reg === 6 || d.reg === 9) && ['geo', 'nature', 'ruin'].indexOf(d.cat) >= 0);
      const tr = G.DISCOVERIES.find(d => d.cat === 'treasure' && d.reg === 10);
      o.ne = [ne && ne.name, T.claimOf(ne)]; o.tr = [tr && tr.name, T.claimOf(tr)];
      const sp = id => G.SPONSORS.find(x => x.id === id), en = G.SPONSORS.find(x => x.nation === 'EN' || x.nation === 'FR');
      o.mod = { pt: T.reportMod(sp('pt_king'), D.westroute), es: T.reportMod(sp('es_crown'), D.westroute), en: en && T.reportMod(en, D.westroute), ptCape: T.reportMod(sp('pt_king'), D.capegood) };
      // 실제 보고: 포르투갈 국왕에게 서쪽 땅(서회항로)을 보고한다
      const UI = G.UI, said = [];
      UI.say = async (t) => { said.push(t); }; UI.alert = async () => true; UI.ask = async () => null; UI.toast = () => {};
      const k = { sponsor: 'pt_king', disc: 'westroute', advance: 0, reward: 10000, due: 99999999, start: 14940601, circ: false };
      s.contract = k; s.disc.westroute = { me: true, found: 14940601 };
      const g0 = s.player.gold;
      return G.Sponsor.report(sp('pt_king')).then(() => { o.gain = s.player.gold - g0; o.said = said.join(' / '); o.claimSaved = (s.disc.westroute || {}).claim; return o; });
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 2400));
    ok(r.side.brazil === 'PT' && r.side.mexico === 'ES' && r.side.calicut === 'PT' && r.side.moluccas === 'PT' && r.side.ng140 === 'ES', '반구: 브라질·캘리컷·향료제도는 포르투갈, 멕시코는 에스파냐, 1529년 전 동경 140°는 에스파냐(반대편 경계 133.5°)');
    ok(r.claim.westroute === 'ES' && r.claim.capegood === 'PT' && r.ne[1] === null && r.tr[1] === null, '땅의 몫: 서회항로 에스파냐 · 아프리카 남단 포르투갈 · 동북아시아(' + r.ne[0] + ')·보물(' + r.tr[0] + ')은 조약 밖');
    ok(r.mod.pt.k === 0.7 && r.mod.es.k === 1.15 && (!r.mod.en || r.mod.en.k === 1) && r.mod.ptCape.k === 1.15, '보고 사례금: 상대 왕실 땅 ×0.7 · 같은 왕실 땅 ×1.15 · 잉글랜드·프랑스 후원자는 그대로 (「' + (r.mod.en ? r.mod.en.line.slice(0, 30) : '') + '…」)');
    ok(r.gain > 0 && r.gain < 10000 && r.claimSaved === 'ES' && /토르데시야스 선 서쪽/.test(r.said), '포르투갈 국왕에게 서회항로 보고: 사례금 ' + r.gain + ' (약속 10,000), 몫 「에스파냐」 적음');

    // ③ 항구 들어가기
    const en = await page.evaluate(() => {
      const s = G.Game.state, T = G.Treaty, C = id => G.CITY_DATA[id], o = {};
      const at = (y, nat) => { s.date = { y: y, m: 6, d: 1 }; s.player.nation = nat; };
      at(1530, 'PT'); o.ptVera = T.entryBlock(C(199)); o.ptVeraOwner = G.R.cityOwner(C(199));
      at(1490, 'PT'); o.before = T.entryBlock(C(194));
      at(1560, 'ES'); o.esGoa = T.entryBlock(C(150)); o.esMacau = T.entryBlock(C(173)); o.esRecife = T.entryBlock(C(214)); o.esLisbon = T.entryBlock(C(0));
      at(1560, 'PT'); o.ptGoa = T.entryBlock(C(150));
      o.entryCheck = G.Scenes.city.entryCheck(C(150));
      s.player.nation = 'PT';
      return o;
    });
    console.log(JSON.stringify(en));
    ok(en.ptVera && en.ptVeraOwner === '에스파냐' && /에스파냐령/.test(en.ptVera.text), '1530년 포르투갈 함대 → 베라크루스(에스파냐령): 막힘 — 「' + en.ptVera.text + '」');
    ok(!en.before && en.esGoa && en.esRecife && !en.esMacau && !en.esLisbon && !en.ptGoa, '조약 전은 열림 · 에스파냐 함대는 고아·페르남부쿠 막힘, 오문(동북아시아)·리스본(유럽)은 열림');

    // ④ 포르투갈어가 통하는 항구 (에스파냐 제독, 포르투갈어만 할 줄 안다)
    const lg = await page.evaluate(() => {
      const s = G.Game.state, R = G.R, C = id => G.CITY_DATA[id], o = {};
      s.player.lg = G.LANGS.map((_, i) => i === 1 ? 3 : 0); s.mates.forEach(m => { m.role = 'none'; });
      const at = y => { s.date = { y: y, m: 6, d: 1 }; };
      at(1560); o.goa = R.cityLang(C(150)); o.sh = R.cityLang(C(288)); o.calicut = R.cityLang(C(152)); o.macau = R.cityLang(C(173));
      at(1540); o.sh1540 = R.cityLang(C(288));
      at(1600); o.naga = R.cityLang(C(191)); o.musc = R.cityLang(C(125));
      at(1650); o.naga1650 = R.cityLang(C(191));
      at(1560); o.why = G.Treaty.ptLang(C(288)); o.langLv = G.Scenes.city.langLv(C(150));
      return o;
    });
    console.log(JSON.stringify(lg));
    ok(lg.goa.alt && lg.goa.lv === 3 && lg.sh.alt && lg.naga.alt && lg.musc.alt && lg.macau.lv === 3 && lg.langLv === 3, '포르투갈어가 통함: 고아(포르투갈령)·상해·나가사키·무스카트·오문');
    ok(!lg.calicut.alt && lg.calicut.lv === 0 && !lg.sh1540.alt && !lg.naga1650.alt, '캘리컷(포르투갈령 아님)·1540년 상해·1650년 나가사키는 그 고장 말만');

    // ⑤ 바다에서 경계선 넘기 · 해도
    const sea = await page.evaluate(() => {
      const s = G.Game.state, T = G.Treaty, o = {};
      s.date = { y: 1500, m: 3, d: 1 }; s.player.nation = 'PT';
      s.loc = { mode: 'sea', lon: -44, lat: -5 }; s.treaty.side = null;
      o.a = T.daily().map(m => m.text);
      s.loc.lon = -49; o.b = T.daily().map(m => m.text);
      s.loc.lon = -20; s.treaty.side = 'PT'; o.c = T.daily().map(m => m.text);   // 선에서 먼 곳
      return o;
    });
    console.log(JSON.stringify(sea));
    ok(sea.a.length === 0 && sea.b.length === 1 && /토르데시야스 선/.test(sea.b[0]) && /(에스파냐|카스티야)의 바다/.test(sea.b[0]) && sea.c.length === 0, '바다에서 서경 46.5°를 넘으면: 「' + sea.b[0] + '」');
    await page.evaluate(() => { const s = G.Game.state; s.loc = { mode: 'city', city: 0, lon: G.CITY_DATA[0].lon, lat: G.CITY_DATA[0].lat }; s.date = { y: 1500, m: 3, d: 1 }; document.querySelectorAll('.modal-back').forEach(e => e.remove()); G.Info.open('map'); });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = document.querySelector('.cv-zoom [data-z="all"]'); if (b) b.click(); });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, 'chart.png') });
    // 발견물 카드: 몫
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); G.Info.open('disc'); });
    await page.waitForTimeout(800);
    const disc = await page.evaluate(() => { const c = document.querySelector('.card[data-d="westroute"]'); return c ? c.innerText : ''; });
    await page.evaluate(() => { document.querySelectorAll('.modal-back').forEach(e => e.remove()); });
    ok(/(에스파냐|카스티야)의 땅/.test(disc), '발견물 카드: 「' + disc.replace(/\n/g, ' ') + '」');

    // ⑥ 사라고사 조약
    await page.evaluate(() => { const s = G.Game.state; s.date = { y: 1529, m: 4, d: 21 }; G.Game.passDays(1); });
    const zz = await page.evaluate(() => ({ t2: G.Game.state.treaty.t2, z: G.Treaty.zaragoza(), ng: G.Treaty.side(140, -3), guam: G.Treaty.side(144.8, 13.4), mol: G.Treaty.side(127.4, 0.8) }));
    await page.waitForSelector('.treaty canvas', { timeout: 20000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, 'zaragoza.png') });
    const zt = await page.evaluate(() => document.querySelector('.treaty').innerText);
    await closeWin();
    ok(zz.z && zz.ng === 'PT' && zz.guam === 'ES' && zz.mol === 'PT' && /144\.5/.test(zt) && /35만/.test(zt), '1529년 4월 22일 사라고사 조약 창 · 동경 140°는 포르투갈로, 괌(144.8°)은 에스파냐, 향료제도는 포르투갈');

    // ⑦ 옛 저장: 1600년, s.treaty 없음 → 창 없이 지난 것으로
    const old = await page.evaluate(async () => { const s = G.Game.state; delete s.treaty; s.date = { y: 1600, m: 1, d: 1 }; G.Treaty.daily(); await new Promise(r => setTimeout(r, 1500)); return { t: JSON.stringify(s.treaty), win: !!document.querySelector('.treaty') }; });
    ok(/"t1":"skip"/.test(old.t) && /"t2":"skip"/.test(old.t) && !old.win, '옛 저장(1600년): 조약 창 없이 지난 것으로 ' + old.t);
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('스크린샷: ' + OUT);
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
