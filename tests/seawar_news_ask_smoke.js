/* 100년 QA 2026-11-18 고친 것 두 가지
   ① 해전 소식 — 해군이 없는 나라(신성로마제국·밀라노·헝가리·폴란드·모스크바)는 빠지고, 지중해 함대뿐인 교황령·피렌체는 지중해 나라하고만 지중해에서 싸운다
      (예전: 종교 개혁 적대로 「교황령 함대가 발트해에서 스웨덴과 맞붙었다」가 판마다 100번 넘게 나왔다) — js/systems/relations.js RL.seaWarOK · js/data/relations.js seaWar
   ② 고를 수 없는(흐린) 선택지는 스크립트로 click()해도 고르지 않는다 — js/ui/ui.js UI.ask(o.dis) · UI.choose(o.disabled)
   node tests/seawar_news_ask_smoke.js */
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
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href));
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.go('create'));
    await page.waitForSelector('#nm');
    await page.fill('#nm', '이강희'); await page.press('#nm', 'Enter');
    await page.waitForFunction(() => G.Game.sceneName === 'city' && G.Game.state, null, { timeout: 90000 });

    // ① 1500~1700년 달마다 해전 소식을 모은다 (확률은 1로)
    const a = await page.evaluate(() => {
      const s = G.Game.state, RL = G.Rel, B = G.BALANCE.relations, keep = B.seaWarMonth, out = { news: {}, n: 0 };
      B.seaWarMonth = 1;
      try {
        for (let y = 1500; y < 1700; y++) for (let m = 1; m <= 12; m++) {
          s.date = { y, m, d: 1 };
          RL.daily().filter(x => x.minor && x.icon === 'cannon').forEach(x => { out.n++; out.news[x.text] = (out.news[x.text] || 0) + 1; });
        }
      } finally { B.seaWarMonth = keep; }
      out.ok = { paSw: RL.seaWarOK('PA', 'SW'), paDk: RL.seaWarOK('PA', 'DK'), paEn: RL.seaWarOK('PA', 'EN'), paOt: RL.seaWarOK('PA', 'OT'), paFr: RL.seaWarOK('PA', 'FR'), hreOt: RL.seaWarOK('HRE', 'OT'), frMi: RL.seaWarOK('FR', 'MI'), esEn: RL.seaWarOK('ES', 'EN'), esOt: RL.seaWarOK('ES', 'OT') };
      return out;
    });
    const texts = Object.keys(a.news);
    const bad = (re) => texts.filter(t => re.test(t));
    console.log('   해전 소식 ' + a.n + '줄 · 문장 ' + texts.length + '가지 · ' + JSON.stringify(a.ok));
    ok(a.n > 0, '전쟁 중인 바다 나라의 해전 소식은 그대로 나온다');
    ok(!a.ok.paSw && !a.ok.paDk && !a.ok.paEn && a.ok.paOt && a.ok.paFr, '교황령: 스웨덴·덴마크·잉글랜드와는 바다에서 싸우지 않고, 오스만·프랑스(지중해)와는 싸울 수 있다');
    ok(!a.ok.hreOt && !a.ok.frMi && a.ok.esEn && a.ok.esOt, '해군 없는 신성로마제국·밀라노는 빠지고, 에스파냐는 그대로');
    ok(!bad(/교황령|피렌체/).filter(t => /발트해|외레순|도버|북해|비스케이|대서양/.test(t)).length, '교황령·피렌체 함대가 지중해 밖 바다에 나오지 않는다');
    ok(!bad(/신성로마제국|밀라노|헝가리|폴란드|모스크바/).length, '신성로마제국·밀라노·헝가리·폴란드·모스크바의 해전 소식이 없다');
    ok(bad(/교황령/).length > 0 && bad(/교황령/).every(t => /에게해|아드리아해|리구리아해|서지중해|티레니아해/.test(t)), '교황령 소식은 지중해에서만 (' + bad(/교황령/).length + '가지)');

    // ② 흐린 선택지
    const b = await page.evaluate(async () => {
      const UI = G.UI, out = {};
      let v1 = 'pending';
      UI.ask('고르시오', [{ label: '돈이 모자라 못 고르는 것', value: 'no', dis: true }, { label: '고를 수 있는 것', value: 'yes' }]).then(v => { v1 = v; });
      await new Promise(r => setTimeout(r, 300));
      const bs = [...document.querySelectorAll('.modal-back .askrow button')];
      out.askDisabledAttr = bs[0].disabled; bs[0].click(); await new Promise(r => setTimeout(r, 200));
      out.afterDis = v1; out.stillOpen = !!document.querySelector('.modal-back .askrow');
      bs[1].click(); await new Promise(r => setTimeout(r, 200)); out.afterOk = v1;
      let v2 = 'pending';
      UI.choose('고르시오', [{ label: '흐린 줄', value: 'no', disabled: true }, { label: '고를 수 있는 줄', value: 'yes' }]).then(v => { v2 = v; });
      await new Promise(r => setTimeout(r, 300));
      const cs = [...document.querySelectorAll('.choice')];
      cs[0].click(); await new Promise(r => setTimeout(r, 200)); out.chDis = v2;
      cs[1].click(); await new Promise(r => setTimeout(r, 300)); out.chOk = v2;
      return out;
    });
    console.log('   ' + JSON.stringify(b));
    ok(b.askDisabledAttr && b.afterDis === 'pending' && b.stillOpen, 'UI.ask: 흐린 단추를 click()해도 고르지 않고 창이 그대로 있다');
    ok(b.afterOk === 'yes', 'UI.ask: 고를 수 있는 단추는 그대로 고른다');
    ok(b.chDis === 'pending' && b.chOk === 'yes', 'UI.choose: 흐린 줄은 고르지 않고, 다른 줄은 고른다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('실패: ' + e.message); console.error(errors.join('\n')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
