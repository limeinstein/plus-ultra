/* 교역 순이익 금화비: 100닢당 한 개·탄도/산개/바닥 회전·착지음 연결. */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.TradeFX && G.Audio && G.Img, null, { timeout: 90000 });
    await page.waitForTimeout(1800);
    const r = await page.evaluate(async () => {
      const sounds = [];
      G.Audio.coinRain = n => (sounds.push(n), true);
      const counts = [G.TradeFX.coinCount(-1), G.TradeFX.coinCount(50), G.TradeFX.coinCount(100), G.TradeFX.coinCount(950), G.TradeFX.coinCount(10000)];
      const small = G.TradeFX.profit(100);
      const smallDom = { n: document.querySelectorAll('.trade-profit-coin').length, heavy: document.querySelector('.trade-profit-fx').classList.contains('heavy') };
      const large = G.TradeFX.profit(10000);
      await new Promise(resolve => setTimeout(resolve, 1450));
      const layer = document.querySelector('.trade-profit-fx');
      const coins = [...layer.querySelectorAll('.trade-profit-coin')];
      const phases = coins.map(coin => coin.dataset.phase);
      const transforms = new Set(coins.map(coin => coin.style.transform).filter(Boolean));
      await new Promise(resolve => setTimeout(resolve, 1550));
      const latePhases = coins.map(coin => coin.dataset.phase);
      return { counts, small, smallDom, large, largeDom: {
        n: coins.length, hero: !!layer.querySelector('.trade-profit-hero'),
        heavy: layer.classList.contains('heavy'), physics: layer.dataset.physics,
        moving: transforms.size, phases, latePhases,
        src: layer.querySelector('.trade-profit-coin img').getAttribute('src')
      }, sounds };
    });
    ok(JSON.stringify(r.counts) === JSON.stringify([0, 1, 1, 10, 100]), '순이익 약 100닢마다 금화 한 개');
    ok(r.smallDom.n === 1 && !r.smallDom.heavy, '작은 이익은 한 닢이 또렷하게 떨어짐');
    ok(r.largeDom.n === 100 && r.largeDom.heavy && r.largeDom.hero, '큰 이익은 제독 위로 금화비가 쏟아짐');
    ok(r.largeDom.physics === 'ballistic' && r.largeDom.moving > 10, '금화마다 중력·수평 속도가 적용된 독립 궤적');
    ok(r.largeDom.phases.some(p => /scatter|bounce|roll|rest/.test(p)), '인물 충돌 산개와 바닥 반동·회전 단계 진입');
    ok(r.largeDom.latePhases.some(p => /roll|rest/.test(p)), '바닥에서 마찰을 받으며 빙글빙글 구른 뒤 감속');
    ok(/effects\/trade_coin\.webp$/.test(r.largeDom.src) && fs.existsSync(path.join(ROOT, 'images', 'effects', 'trade_coin.webp')), '투명 금화 그림을 게임 자산으로 사용');
    ok(JSON.stringify(r.sounds) === JSON.stringify([1, 100]), '동전 수에 맞춘 착지음을 호출');
    const trade = fs.readFileSync(path.join(ROOT, 'js', 'city', 'trade.js'), 'utf8');
    ok(/tradePaid\(sold\.profit\)/.test(trade) && /G\.TradeFX\.profit\(profit\)/.test(trade), '교역 매각의 실제 순이익과 금화비 연결');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message);
    if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | '));
    process.exitCode = 1;
  } finally { await browser.close(); }
})();
