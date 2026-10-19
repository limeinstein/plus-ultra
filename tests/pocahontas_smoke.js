/* 포카혼타스의 중재 (2026-10-20) — js/systems/pocahontas.js · js/games/landwar.js halt
   · 조건: 아즈텍 멸망(1521.8.13) 뒤 · 북·중앙아메리카(카리브 포함) 항구 · 노예 무역을 한 적 없음 — 하나라도 어기면 나오지 않는다. 술집에는 나오지 않는다
   · 흐름: 정착민·원주민이 맞서고 → 편을 고르면 육상전 → 첫 차례 뒤 포카혼타스가 끼어들어 싸움이 멈춘다(truce) → 화해 → 동료로 합류
   · 동료: 요리·웅변·세공·음악·조선 3, 검술 2 · 거절하면 90일 뒤 다른 항구의 부두로 다시 찾아온다(싸움 없이) · 콘솔 오류 0
   node tests/pocahontas_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
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
    const a = await page.evaluate(() => {
      const s = G.Game.state, PC = G.Pocahontas, out = {};
      const havana = G.CITY_DATA.filter(c => c && c.name === '아바나')[0], lima = G.CITY_DATA[222];
      const at = (c, y, m, d) => { s.loc = { mode: 'city', city: c.id }; s.date = { y, m, d }; return PC.pending(); };
      out.ports = G.CITY_DATA.filter(c => c && PC.isPort(c)).map(c => c.name);
      out.before = at(havana, 1521, 8, 12);
      out.after = at(havana, 1521, 8, 13);
      out.later = at(havana, 1650, 3, 1);
      out.lima = at(lima, 1650, 3, 1);
      out.lisbon = at(G.CITY_DATA[0], 1650, 3, 1);
      s.slaver = { first: 1, last: 1, bought: 10, sold: 0, gen: s.player.generation || 1 };
      out.slaver = at(havana, 1650, 3, 1);
      delete s.slaver;
      const m = G.MATE.h_pocahontas;
      out.tavern = G.Frontier.mateReady(m, 1610);
      out.sk = m.sk;
      out.havana = havana.id;
      return out;
    });
    console.log('   북·중앙아메리카 항구 ' + a.ports.length + '곳: ' + a.ports.slice(0, 12).join(', ') + ' …');
    ok(!a.before && a.after && a.later, '아즈텍 멸망(1521.8.13) 전에는 없고, 그 뒤 아바나에서는 생긴다');
    ok(!a.lima && !a.lisbon, '남아메리카(리마)·유럽(리스본) 항구에서는 생기지 않는다');
    ok(!a.slaver, '노예 무역을 한 적이 있으면 생기지 않는다');
    ok(a.tavern === false, '술집 항해사 후보로는 나오지 않는다 (사건으로만)');
    ok(JSON.stringify(a.sk) === JSON.stringify({ cook: 3, speech: 3, craft: 3, music: 3, ship: 3, sword: 2 }), '능력: 요리·웅변·세공·음악·조선 3, 검술 2');

    // ---------------- 사건: 원주민 편 → 육상전 → 두 차례 뒤 중재 → 거절 → 90일 뒤 부두에서 다시 → 합류
    await page.evaluate((hv) => {
      const s = G.Game.state, UI = G.UI; s.loc = { mode: 'city', city: hv }; s.date = { y: 1610, m: 5, d: 1 };
      window.__said = []; window.__ask = ['native', 0];
      UI.say = async (t, w) => { window.__said.push((w && w.name ? w.name + ': ' : '') + t); };
      UI.ask = async (t, ch) => (window.__ask.length ? window.__ask.shift() : ch[0].value);
      window.__fame0 = s.player.fame;
      window.__p = G.Pocahontas.check();
    }, a.havana);
    // 육상전: 진형 → 시작 → 공격 두 번 → 중재
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => b.offsetParent && /전투 개시/.test(b.textContent)), null, { timeout: 15000 });
    await page.evaluate(() => Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent && /전투 개시/.test(b.textContent))[0].click());
    for (let i = 0; i < 12; i++) {
      if (await page.evaluate(() => /멈추세요/.test(document.body.innerText))) break;
      await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).filter(x => x.offsetParent && /공격/.test(x.textContent))[0]; if (b) b.click(); });
      await page.waitForTimeout(1500);
    }
    await page.waitForFunction(() => /멈추세요/.test(document.body.innerText) && Array.from(document.querySelectorAll('button')).some(b => b.offsetParent && b.textContent.trim() === '확인'), null, { timeout: 20000 });
    const mid = await page.evaluate(() => document.body.innerText.match(/(여성이 두 줄 사이에 버티고 서자[^\n]*)/) ? 1 : 0);
    await page.evaluate(() => Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent && b.textContent.trim() === '확인')[0].click());
    await page.evaluate(() => window.__p);
    const b = await page.evaluate(() => { const s = G.Game.state; return { p: s.poca, joined: s.mates.some(x => x.id === 'h_pocahontas'), fame: s.player.fame - window.__fame0, said: window.__said.join('\n') }; });
    console.log('   ' + JSON.stringify(b.p) + ' · 명성 +' + b.fame);
    ok(b.p.side === 'native' && b.p.res === 'truce' && mid, '원주민 편 → 육상전 첫 차례 뒤 포카혼타스가 끼어들어 싸움이 멈춘다 (truce)');
    ok(/마토아카/.test(b.said) && /담배를 나누자/.test(b.said) && b.fame > 0, '화해 장면 — 포와탄의 딸 마토아카, 사교 명성 +' + b.fame);
    ok(!b.joined && b.p.cool > 0, '거절하면 동료가 되지 않고 90일 쉰다');
    const c = await page.evaluate(async () => {
      const s = G.Game.state, PC = G.Pocahontas; window.__said = []; window.__ask = [1];
      const still = PC.pending();
      s.day = s.poca.cool + 1;
      const nyc = G.CITY_DATA.filter(c => c && PC.isPort(c) && c.name !== '아바나')[0];
      s.loc = { mode: 'city', city: nyc.id };
      const pend = PC.pending();
      await PC.check();
      const m = s.mates.filter(x => x.id === 'h_pocahontas')[0];
      return { still, pend, port: nyc.name, joined: !!m, role: m && m.role, battle: !!document.querySelector('.landwar'), again: /또 만났네요/.test(window.__said.join('\n')), sk: G.R.mateSkill ? ['cook', 'speech', 'craft', 'music', 'ship', 'sword'].map(k => G.R.mateSkill(m, k)) : null, after: PC.pending() };
    });
    console.log('   ' + JSON.stringify(c));
    ok(!c.still && c.pend && c.again, '쉬는 날이 지나면 다른 항구(' + c.port + ')의 부두로 싸움 없이 다시 찾아온다');
    ok(c.joined && !c.after, '받아들이면 동료로 합류 (' + c.role + ') — 그 뒤에는 다시 나오지 않는다');
    if (c.sk) ok(c.sk.join() === '3,3,3,3,3,2', '부하 능력 그대로: ' + c.sk.join('·'));
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); try { console.error((await page.evaluate(() => document.body.innerText)).slice(-1200)); } catch (x) {} process.exitCode = 1; } finally { await browser.close(); }
})();
