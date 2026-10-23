/* 남쪽 바다의 두 아가씨 — 떰(베트남 연안 낚시 · 옷감 · 세공사)과 마리아(필리핀 야영 사냥 · 악어) — node tests/seamaidens_smoke.js */
'use strict';
const path = require('path'), fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const res = [];
function ok(v, msg) { res.push(!!v); console.log((v ? '  ✓ ' : '  ✗ ') + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const out = {}, said = [], asked = [];
      G.UI.say = async (t, who) => { said.push(((who && who.name) || '') + '|' + t); };
      G.UI.ask = async (q, opts) => { asked.push(q); const o = opts.filter(x => !x.dis)[0]; return o ? o.value : null; };
      const toasts = []; const ot = G.UI.toast; G.UI.toast = (t) => { toasts.push(t); };
      function fresh(y) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
        G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.date = { y: y || 1600, m: 6, d: 1 }; G.SKILLS.forEach(x => { s.player.sk[x.id] = 0; });
        return s;
      }
      const T = G.Tam, M = G.Maria;
      out.mates = ['tam', 'maria'].map(id => G.MATE[id] && [G.MATE[id].name, JSON.stringify(G.MATE[id].sk), G.MATE[id].eventOnly].join(' '));
      out.item = !!G.ITEM.buwaya_pearl;
      // ---- 떰: 베트남 연안(유에 앞바다) 바다
      const sea = [107.8, 16.5];
      out.coast = T.vietCoast(sea[0], sea[1]); out.hainan = T.vietCoast(110.5, 19); out.far = T.vietCoast(109.7, 9.0); out.inland = T.vietCoast(105.8, 21.0);
      let s = fresh(1600); s.loc = Object.assign({}, s.loc, { mode: 'sea', lon: sea[0], lat: sea[1] });
      s.fleet.cargo = {}; out.noCloth = await T.afterFish(); out.rumor = toasts.slice(-1)[0] || '';
      s.fleet.cargo.silk = { q: 5, cost: 100, lots: { 0: { q: 5, cost: 100 } } };
      out.noTailor = await T.afterFish();
      const craftsman = G.MATES.find(d => d.sk && d.sk.craft >= 2 && d.wage && !d.eventOnly);
      s.mates.push({ id: craftsman.id, role: 'none', loyal: 80, sk: Object.assign({}, craftsman.sk) });
      said.length = 0;
      out.tam = await T.afterFish();
      out.tamSaid = said.slice(); out.silkLeft = s.fleet.cargo.silk && s.fleet.cargo.silk.q;
      out.tamJoined = s.mates.some(m => m.id === 'tam'); out.tamAgain = await T.afterFish();
      out.tamLog = s.log.slice(-3).map(l => l.t || l.text || l).join(' / ');
      // ---- 마리아: 필리핀 라구나 호숫가 뭍
      const ph = [121.25, 14.25];
      out.ph = M.philippines(ph[0], ph[1]); out.sabah = M.philippines(117.5, 6); out.palawan = M.philippines(118.7, 9.7);
      s = fresh(1560); s.loc = Object.assign({}, s.loc, { mode: 'land', lon: ph[0], lat: ph[1], party: 30 });
      s.disc.crocodile = { me: 1, found: 1 };
      out.before1565 = await M.onCamp('hunt', ph[0], ph[1]);
      s = fresh(1600); s.loc = Object.assign({}, s.loc, { mode: 'land', lon: ph[0], lat: ph[1], party: 30 });
      out.noCroc = await M.onCamp('hunt', ph[0], ph[1]); out.mRumor = toasts.slice(-1)[0] || '';
      s.disc.crocodile = { me: 1, found: 1 };
      out.notHunt = await M.onCamp('rest', ph[0], ph[1]);
      const L = G.Scenes.land; let battle = null; const ob = L.landBattle;
      L.landBattle = async (name, n, beasts, o) => { battle = { name, n, beasts, kind: o.kind, beast: o.beast, halt: !!(o.halt && o.halt.turn && /누노/.test(o.halt.text)) }; return 'truce'; };
      said.length = 0;
      out.maria = await M.onCamp('hunt', ph[0], ph[1]);
      L.landBattle = ob;
      out.battle = battle; out.mariaSaid = said.slice();
      out.pearl = s.player.items.some(i => i.id === 'buwaya_pearl'); out.mariaJoined = s.mates.some(m => m.id === 'maria');
      // 갈고리
      
      G.UI.toast = ot;
      return out;
    });
    console.log(JSON.stringify(Object.assign({}, r, { tamSaid: r.tamSaid.length, mariaSaid: r.mariaSaid.length })));
    ok(r.mates.every(Boolean) && /craft":3.*acct":3.*nav":3/.test(r.mates[0]) && /craft":3.*sci":3.*speech":3/.test(r.mates[1]) && r.item, '떰(세공·회계·항해 3) · 마리아(세공·과학·웅변 3) · 누노의 흑진주');
    ok(r.coast && !r.hainan && !r.far && !r.inland, '베트남 연안 바다만 (하이난·먼바다·뭍 제외)');
    ok(r.noCloth === false && /옷감과 바느질/.test(r.rumor) && r.noTailor === false, '옷감이나 세공사가 없으면 귀띔만');
    const ts = r.tamSaid.join('\n');
    ok(r.tam === true && /깜이/.test(ts) && /새어머니\|/.test(ts) && /깜\|/.test(ts) && /어머니, 이건 어머니 옷/.test(ts) && /깜, 이건 네 거야/.test(ts), '떰: 옷을 지어 주면 새어머니와 깜에게 옷을 건넨다');
    ok(r.tamJoined && r.silkLeft === 4 && r.tamAgain === false, '떰이 동료가 되고 견직물 한 통을 쓴다 (다시 일어나지 않는다)');
    ok(r.ph && !r.sabah && r.palawan, '필리핀 섬 판정 (사바 제외 · 팔라완 포함)');
    ok(r.before1565 === false, '1565년 전에는 마리아가 없다');
    ok(r.noCroc === false && /누노/.test(r.mRumor) && r.notHunt === false, '악어를 발견하지 못했으면 귀띔만 · 사냥이 아니면 없다');
    ok(r.maria === true && r.battle && r.battle.beasts && r.battle.kind === 'beast' && r.battle.halt && r.battle.beast[0] === 'crocodile', '마리아: 악어와 싸움이 붙고 그녀가 끼어들어 멈춘다 ' + JSON.stringify(r.battle));
    const ms = r.mariaSaid.join('\n');
    ok(r.pearl && r.mariaJoined && /누노를 해치지 마세요/.test(ms) && /흑진주/.test(ms), '악어가 흑진주를 건네고 마리아가 합류한다');
    ok(/G\.Tam\.afterFish/.test(fs.readFileSync(path.join(ROOT, 'js/games/fishing.js'), 'utf8')), '낚시를 마치면 떰을 살핀다 (fishing.js)');
    ok(/G\.Maria\.onCamp/.test(fs.readFileSync(path.join(ROOT, 'js/scenes/land.js'), 'utf8')), '야영 사냥을 마치면 마리아를 살핀다 (land.js)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  const bad = res.filter(x => !x).length;
  console.log(bad ? '실패 ' + bad : '모두 통과 ' + res.length);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
