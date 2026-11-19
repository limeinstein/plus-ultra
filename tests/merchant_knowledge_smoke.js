/* 상인이 아는 세상 점검 (G.Frontier.heard — js/systems/frontier.js · G.BALANCE.merchantKnows · 교역소 회화·시세·술집·거리 상인·장사 소문)
   · 희망봉·인도 항로·지팡그·서인도 항로가 알려지기 전: 리스본 상인은 인도·동아시아·일본·아메리카를 말하지 않는다
   · 먼 땅 상인은 제 교역권을 안다 (캘리컷 → 말라카), 항로가 알려지면 누구나 안다
   · 교역소 회화 30번에 먼 땅 이름이 나오지 않는다, 콘솔 오류 0
   node tests/merchant_knowledge_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href));
    await page.waitForFunction(() => window.G && G.Game && G.Econ && G.Frontier && G.Frontier.heard && G.Scenes && G.Scenes.city && G.Scenes.city.B.trade, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const F = G.Frontier, C = G.Scenes.city, T = C.B.trade, by = n => G.CITY_DATA.find(c => c.name === n);
      const lis = by('리스본'), cal = by('캘리컷'), nag = by('나가사키'), mal = by('말라카');
      G.CITY_DATA.filter(c => [5, 6, 8, 9, 10].includes(c.region) && c.port).forEach(c => { if (s.known.indexOf(c.id) < 0) s.known.push(c.id); });   // 해도에 먼 도시가 적혀 있어도
      const FAR = [5, 6, 8, 9, 10], o = {};
      const farTip = c => c.goods.filter(id => G.GOOD[id]).some(id => FAR.includes(T.farRegions(id, c)[0].r));
      o.leakedHints = G.CITY_DATA.flatMap(c => c.goods.flatMap(id => T.farRegions(id,c).filter(x => !F.heard(c,x.r)).map(x => c.name+':'+x.r)));
      o.lisFar = FAR.filter(r => F.heard(lis, r));
      o.lisTip = farTip(lis); o.lisNag = F.heard(lis, nag); o.calMal = F.heard(cal, mal); o.calLis = F.heard(cal, lis);
      s.econ = { ev: [], seq: 0, seeded: 1 }; G.BALANCE.econ.perDay = 0;
      for (let i = 0; i < 60; i++) G.Econ.spawn();
      o.rumorFar = G.Econ.rumors(lis, 60).filter(e => FAR.includes(G.CITY_DATA[e.at].region)).length;
      const out = [], say = C.say, cur = C.current; C.say = async (k, t) => { out.push(t); };
      try { for (let i = 0; i < 30; i++) { C.current = () => ({}); await T.talk(lis); } } finally { C.say = say; C.current = cur; }
      const farNames = G.CITY_DATA.filter(c => FAR.includes(c.region)).map(c => c.name).concat(FAR.map(r => G.REGIONS[r]));
      o.talkFar = out.join('\f').split('\f').filter(l => farNames.some(n => l.indexOf(n + '에') >= 0 || l.indexOf(n + '까지') >= 0));
      ['capegood', 'indiaroute', 'malacca', 'spiceis', 'china', 'zipang', 'westroute'].forEach(id => { s.disc[id] = Object.assign(s.disc[id] || {}, { rival: 1 }); });
      F.invalidate();
      o.lisFarAfter = FAR.filter(r => F.heard(lis, r)); o.lisNagAfter = F.heard(lis, nag); o.calLisAfter = F.heard(cal, lis);
      return o;
    });
    ok(r.leakedHints.length === 0, '모든 도시의 특산물 안내가 상인이 아는 문화권 안에 머문다: '+r.leakedHints.slice(0,4).join(','));
    ok(r.lisFar.length === 0, '항로를 모를 때 리스본 상인은 인도·동아시아·동남아시아·일본·아메리카를 모른다');
    ok(!r.lisTip, '리스본 특산물의 「비싸게 팔리는 곳」이 먼 땅이 아니다');
    ok(!r.lisNag, '리스본 상인은 나가사키를 모른다');
    ok(r.rumorFar === 0, '리스본 장사 소문에 먼 땅 사건이 없다');
    ok(r.talkFar.length === 0, '교역소 회화 30번에 먼 땅 장사 이야기가 없다' + (r.talkFar.length ? ' — ' + r.talkFar[0] : ''));
    ok(r.calMal && !r.calLis, '캘리컷 상인은 말라카를 알고, 리스본은 아직 모른다');
    ok(r.lisFarAfter.length === 5 && r.lisNagAfter && r.calLisAfter, '항로가 알려지면 서로 안다');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors[0] : ''));
    console.log('merchant_knowledge_smoke: 통과');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
