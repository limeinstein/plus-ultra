/* 다국어 틀 · 영어 시범판 (js/core/i18n.js · js/lang/en.js) — 2026-11-12
   · 한국어: 사전을 거치지 않는다 — G.T는 원문 그대로(조사까지), 화면 글자 감시(MutationObserver)도 돌지 않는다
   · 영어: 타이틀 단추 · 조작 안내 · 화면·글꼴의 언어 줄 · 도시 거리 · 교역소 구입 창 · 캔버스 글자(도시 이름표)가 영어로
   · 이름: G.cityName·G.goodName·G.N, G.T에 끼운 도시 이름이 저절로 옮겨진다
   · 언어 바꾸기: 타이틀 오른쪽 위 단추 → 영어 → 한국어로 돌아오면 다시 한국어
   · 중국어 간체·번체·베트남어도 고를 수 있다. 준비 중인 일본어·스페인어는 고를 수 없다.
   · 콘솔 오류 0
   node tests/i18n_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); } catch (_) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
const GAME = (process.env.WEB_BASE && new URL('index.html', process.env.WEB_BASE).href) || pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
const HANGUL = /[가-힣]/;

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [];
  async function open(lang) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await ctx.addInitScript((l) => { try { if (l) localStorage.setItem('pu.lang', l); else localStorage.removeItem('pu.lang'); } catch (e) { /* */ } }, lang);
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.goto(GAME, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !document.querySelector('#boot-loader.on') && document.querySelector('.title-menu .btn:not(.disabled)'), null, { timeout: 120000 });
    await page.waitForTimeout(800);
    return page;
  }
  const esc = async (page, n) => { for (let i = 0; i < (n || 6); i++) { if (await page.evaluate(() => G.UI.busy())) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); } } };
  const menuText = (page) => page.evaluate(() => [...document.querySelectorAll('.title-menu .btn')].map(b => b.textContent.trim()));
  try {
    // ---- 한국어 (처음 연 사람: 브라우저 언어가 한국어 → 한국어)
    let page = await open('ko');
    const ko = await page.evaluate(() => ({
      lang: G.I18N.lang, t: G.T('{city|에} 처음으로 입항했다.', { city: '리스본' }), t2: G.T('{a|을/를} 샀다', { a: '후추' }),
      date: G.U.fmtDate({ y: 1480, m: 5, d: 1 }), city: G.cityName(0), good: G.goodName('pepper'), n: G.N('리스본'), html: document.documentElement.lang
    }));
    const koMenu = await menuText(page);
    ok(ko.lang === 'ko' && ko.html === 'ko', '한국어: <html lang="ko">');
    ok(ko.t === '리스본에 처음으로 입항했다.' && ko.t2 === '후추를 샀다', 'G.T 한국어 조사: ' + ko.t + ' · ' + ko.t2);
    ok(ko.date === '1480년 5월 1일' && ko.city === '리스본' && ko.good === '후추' && ko.n === '리스본', '한국어 날짜·이름은 그대로');
    ok(koMenu.some(t => /새로운 항해/.test(t)), '타이틀 단추 한국어: ' + koMenu.slice(0, 3).join(' / '));

    // 타이틀 오른쪽 위 언어 단추 → 영어
    await page.click('.title-lang');
    await page.waitForTimeout(500);
    const choices = await page.evaluate(() => [...document.querySelectorAll('.choices > .choice')].map(b => ({ t: b.textContent.trim(), dis: b.classList.contains('dis') })));
    const dis = choices.filter(c => c.dis).map(c => c.t);
    ok(dis.length === 2 && dis.some(t => t.includes('日本語')) && dis.some(t => t.includes('Español')), '번역 자료가 없는 일본어·스페인어만 준비 중');
    ok(['简体中文', '繁體中文', 'Tiếng Việt'].every(label => choices.some(c => c.t.includes(label) && !c.dis)), '중국어 간체·번체·베트남어 선택 가능');
    await page.evaluate(() => { [...document.querySelectorAll('.choices > .choice')].find(b => /English/.test(b.textContent)).click(); });
    await page.waitForFunction(() => G.I18N.lang === 'en' && G.Game.sceneName === 'title' && document.querySelector('.title-menu .btn'), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    const enMenu = await menuText(page);
    ok(enMenu.some(t => /New Voyage/.test(t)) && !enMenu.some(t => HANGUL.test(t)), '영어로 바꾸면 타이틀 단추가 영어: ' + enMenu.slice(0, 3).join(' / '));
    ok(await page.evaluate(() => localStorage.getItem('pu.lang') === 'en' && document.documentElement.lang === 'en'), '이 기기에 기억 (pu.lang = en) · <html lang="en">');
    // 다시 한국어로
    await page.evaluate(() => { G.Scenes.title.langMenu(); });
    await page.waitForTimeout(500);
    await page.evaluate(() => { [...document.querySelectorAll('.choices > .choice')].find(b => /한국어/.test(b.textContent)).click(); });
    await page.waitForFunction(() => G.I18N.lang === 'ko' && document.querySelector('.title-menu .btn'), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    ok((await menuText(page)).some(t => /새로운 항해/.test(t)), '한국어로 돌아오면 다시 한국어');
    await page.context().close();

    // ---- 영어
    page = await open('en');
    const en = await page.evaluate(() => ({
      t: G.T('{city|에} 처음으로 입항했다.', { city: '리스본' }), date: G.U.fmtDate({ y: 1480, m: 5, d: 1 }), lat: G.U.fmtLat(38.7),
      city: G.cityName(7), good: G.goodName('porcelain'), n: G.N('오스만 제국'), font: getComputedStyle(document.documentElement).getPropertyValue('--serif')
    }));
    ok(en.city === 'Seville' && en.good === 'Chinese Porcelain' && en.n === 'Ottoman Empire', '이름: ' + [en.city, en.good, en.n].join(' · '));
    ok(en.date === 'May 1, 1480' && en.lat === '38.7°N', '날짜·위도: ' + en.date + ' · ' + en.lat);
    ok(/Noto Serif/.test(en.font), '영어 글꼴: ' + en.font.split(',')[0]);
    await page.evaluate(() => { G.Scenes.title.help(); });
    await page.waitForTimeout(800);
    const help = await page.evaluate(() => { const w = [...document.querySelectorAll('.win, .window, .modal')].pop() || document.body; return w.innerText; });
    ok(/Arrow keys/.test(help) && /Sea battles/.test(help) && !HANGUL.test(help), '조작 안내가 모두 영어');
    await esc(page);
    await page.evaluate(() => { G.Display.open(); });
    await page.waitForTimeout(600);
    const disp = await page.evaluate(() => document.querySelector('.disp-panel').innerText);
    ok(/Language/.test(disp) && /English/.test(disp) && /Text size/.test(disp), '화면·글꼴 창에 언어 줄');
    await esc(page);
    // 도시 · 교역소
    await page.evaluate(() => {
      G.State.newGame({ name: 'Juan', nation: 'ES', job: 'merchant', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state.settings.res = 0.35; G.Game.state.player.gold = 20000;
      G.Game.ensureGeo().then(() => G.Game.go('city', { cityId: 7 }));
    });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && document.querySelector('.city-banner'), null, { timeout: 60000 });
    await page.waitForTimeout(2500);
    await esc(page, 12);
    const city = await page.evaluate(() => ({ nm: document.querySelector('.city-banner .nm').textContent, menu: [...document.querySelectorAll('.cmdmenu .cmd')].map(b => b.textContent.trim()), bar: document.querySelector('.infobar').innerText }));
    ok(city.nm === 'Seville', '도시 이름: ' + city.nm);
    ok(city.menu.some(t => /Trading Post/.test(t)) && city.menu.some(t => /Harbor/.test(t)), '건물 메뉴: ' + city.menu.slice(0, 4).join(' / '));
    ok(/Fleet/.test(city.bar) && /Sea Chart/.test(city.bar) && !HANGUL.test(city.bar), '아래 단추줄 영어: ' + city.bar.replace(/\s+/g, ' ').slice(0, 80));
    await page.evaluate(() => { G.Scenes.city.B.trade.buy(G.CITY_DATA[7]); });
    await page.waitForTimeout(1200);
    const buy = await page.evaluate(() => { const w = [...document.querySelectorAll('.win, .window, .modal')].pop(); return w ? w.innerText : ''; });
    ok(/Buy — Seville/.test(buy) && /Olive Oil/.test(buy) && /Stock/.test(buy) && !HANGUL.test(buy), '교역소 구입 창이 모두 영어');
    await esc(page);
    // 대사는 통째로 옮긴다 (UI.say — 대사창이 낱말로 쪼개 그리기 전에) · 이름이 들어간 틀
    const talk = await page.evaluate(async () => {
      const got = [];
      for (const t of ['어서 오게! 목을 축이고 가게.', '실례하오, 제독. 함대를 이끄는 분이라 들었소. 나는 마테오, 이 고장에서 코그 한 척으로 장사하는 사람이오.', '죄송하지만, 이사벨 1세 폐하께서는 바쁘셔서 만나실 수 없습니다. 다른 날에 와 주십시오.']) {
        G.UI.say(t, { name: '술집 주인' });
        await new Promise(r => setTimeout(r, 400));
        const b = document.querySelector('.modal-back .body'); got.push(b ? b.innerText.replace(/▼/g, '').trim() : '');
        document.querySelector('.modal-back').click(); await new Promise(r => setTimeout(r, 400));
      }
      return got;
    });
    ok(/Wet your whistle/.test(talk[0]), '술집 주인의 인사: ' + talk[0]);
    ok(/Name's Mateo/.test(talk[1]) && /single Cog/.test(talk[1]), '이름이 들어간 대사: ' + talk[1].slice(0, 70) + '…');
    ok(/Her Majesty Isabella I is busy/.test(talk[2]), '군주의 대(1세 → I): ' + talk[2].slice(0, 60) + '…');
    // 캔버스 글자
    const cv = await page.evaluate(() => { const c = document.createElement('canvas').getContext('2d'); c.font = '16px serif'; return { w1: c.measureText('세빌리아').width, w2: c.measureText('Seville').width }; });
    ok(Math.abs(cv.w1 - cv.w2) < 0.5, '캔버스 글자도 옮긴다 (세빌리아 → Seville, 폭 ' + cv.w1.toFixed(1) + ')');
    await page.context().close();
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' / '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗ ' + e.message); process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
