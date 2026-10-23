/* 선실에서 는 특기가 화면마다 보이는가 (2026-10-23 QA 26·32·33)
   · 수첩 「동료」 · 부하편성 설명 · 선실 창 — 타고난 특기 + 선실에서 는 것(★), 충성이 낮으면 (본디 n)
   · 선실 창·수첩: 지금 방에서 느는 특기의 진행 「측량 2년 140일 · 다음 단계 3년」
   · 충성이 낮아도 단계가 오르면 알린다 (본디 단계로 견준다) · 방을 옮긴 뒤에는 「선실에서 … (지금 파수대)」
   BROWSER_EXE=… node tests/cabin_growth_display_smoke.js  (그림: $OUT 또는 임시 폴더/cabin_growth_display) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'cabin_growth_display');
fs.mkdirSync(OUT, { recursive: true });
const res = [];
function ok(v, msg) { res.push([!!v, msg]); console.log((v ? '  ✓ ' : '  ✗ ') + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const UI = G.UI; UI.toast = () => {}; G.State.save = () => {};
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
      const s = G.Game.state, R = G.R, CB = G.Cabins, out = {};
      const big = ['galleon', 'carrack', 'nao'].filter(t => G.SHIP[t])[0];
      s.fleet.ships[0] = R.newShip(big, '기함');
      s.mates = [];
      // 측량을 모르는 사람 둘, 측량 1인 사람 하나 (타고난 특기 그대로 — 실제 고용처럼 m.sk 없이)
      const pool = G.MATES.filter(d => d.wage && !d.witch && !d.wd);
      const no = pool.filter(d => !(d.sk && d.sk.survey)).map(d => d.id);
      const one = pool.filter(d => d.sk && d.sk.survey === 1 && !(d.sk.nav >= 3)).map(d => d.id);
      const mk = (id, loyal) => { const m = { id, role: 'none', loyal, joined: 0 }; s.mates.push(m); return m; };
      const rooms = CB.rooms();
      const free = rooms.map((t, k) => k).filter(k => k > 0 && !G.CABIN[rooms[k]].fixed);
      free.slice(0, 5).forEach(k => CB.remodel(k, 'chart'));
      const a = mk(no[0], 80); CB.place(a, free[0]);      // 지도 제작실 3년 → 측량 0 → 1
      const low = mk(one[0], 30); CB.place(low, free[1]);  // 충성 30 · 측량 1 → 2 (건성이라 지금은 1)
      const mv = mk(no[1], 80); CB.place(mv, free[2]);     // 지도 제작실 500일 → 파수대(측량사) 595일
      let msgs = [];
      const run = n => { for (let d = 0; d < n; d++) msgs = msgs.concat(CB.grow()); };
      run(500);
      CB.place(mv, null); mv.role = 'surveyor';
      out.mid = CB.growNote(a);                             // 500일
      run(595);
      out.msgs = msgs.map(x => x.text);
      out.a = { id: a.id, name: G.MATE[a.id].name, sv: R.mateSkill(a, 'survey'), raw: CB.rawSkill(a, 'survey'), text: CB.skillText(a), grow: CB.growNote(a) };
      out.low = { name: G.MATE[low.id].name, sv: R.mateSkill(low, 'survey'), raw: CB.rawSkill(low, 'survey'), text: CB.skillText(low) };
      out.mv = { name: G.MATE[mv.id].name, sv: R.mateSkill(mv, 'survey'), skw: mv.skw && mv.skw.survey, grow: CB.growNote(mv) };
      // 진행 문구: 2년 140일 (870일)
      const p = mk(no[2], 80); CB.place(p, free[3]);
      p.skd = { survey: 869 }; p.skw = { survey: 'chart' }; CB.grow();
      out.p = { name: G.MATE[p.id].name, grow: CB.growNote(p), type: CB.roomOf(p) };
      // 다쳐 있는 동안 단계가 오르면
      const h = mk(no[3], 80); CB.place(h, free[4]);
      h.sk = { survey: 1 }; h.skd = { survey: 1094 }; h.skw = { survey: 'chart' }; h.hurt = s.day + 30;
      out.hurt = CB.grow().map(x => x.text).filter(t => t.indexOf(G.MATE[h.id].name) === 0)[0] || '';
      // 옛 저장(skd·skw 없음)
      const old = mk(no[4], 80); out.old = { text: CB.skillText(old), grow: CB.growNote(old) };
      out.yd = [CB.yd(0), CB.yd(140), CB.yd(365), CB.yd(870), CB.yd(1095)];
      out.free = free.length;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    const A = r.a, L = r.low, M = r.mv;
    ok(A.sv === 1 && A.raw === 1 && /측량 1★/.test(A.text), '지도 제작실 3년 → 측량 1★ (' + A.text + ')');
    ok(r.free >= 5, '빈 선실 5칸 이상 (' + r.free + ')');
    ok(r.msgs.some(t => t.indexOf(A.name) === 0 && /지도 제작실에서 3년을 지내며 측량이 늘었다 \(측량 0 → 1\)\.$/.test(t)), '같은 방: 「지도 제작실에서 3년을 지내며 측량이 늘었다 (측량 0 → 1).」');
    const lowMsg = r.msgs.filter(t => t.indexOf(L.name) === 0)[0] || '';
    ok(L.raw === 2 && L.sv === 1, '충성 30: 본디 측량 2, 지금 쓰는 단계 1');
    ok(/측량 1 → 2/.test(lowMsg) && /충성이 낮아 일을 건성으로 해서 지금은 측량 1만큼만 쓴다/.test(lowMsg), '충성이 낮아도 알린다: ' + lowMsg);
    ok(/측량 1★\(본디 2\)/.test(L.text), '충성이 낮으면 「측량 1★(본디 2)」 (' + L.text + ')');
    const mvMsg = r.msgs.filter(t => t.indexOf(M.name) === 0)[0] || '';
    ok(M.sv === 1 && M.skw === '*', '방을 옮겨도 날이 이어져 측량 1');
    ok(/선실에서 측량을 3년 익혀 한 단계 늘었다 \(측량 0 → 1 · 지금 파수대\)\./.test(mvMsg) && mvMsg.indexOf('파수대에서 3년') < 0, '방을 옮긴 뒤: ' + mvMsg);
    ok(r.p.grow === '측량 2년 140일 · 다음 단계 3년', '진행: ' + r.p.grow);
    ok(r.mid === '측량 1년 135일 · 다음 단계 3년' && A.grow === '측량 3년 · 다음 단계 9년', '진행 (500일 ' + r.mid + ' · 3년 ' + A.grow + ')');
    ok(/측량 1 → 2/.test(r.hurt) && /다쳐 있어서 지금은 측량 1만큼만 쓴다/.test(r.hurt), '다친 동안: ' + r.hurt);
    ok(r.old.grow === null && r.old.text.indexOf('★') < 0, '옛 저장·방 없는 부하: ★ 없음 · 진행 없음');
    ok(r.yd.join('|') === '0일|140일|1년|2년 140일|3년', '날 수 글: ' + r.yd.join('|'));

    // ---- 수첩 「동료」
    await page.evaluate(() => { G.Info.open('mates'); });
    await page.waitForSelector('.modal-back .mates .shipcard');
    await page.waitForTimeout(400);
    const nb = await page.evaluate(names => {
      const cards = [...document.querySelectorAll('.modal-back .mates .shipcard')];
      const of = n => { const c = cards.filter(e => e.innerText.indexOf(n) >= 0)[0]; return c ? c.innerText.replace(/\s+/g, ' ') : ''; };
      const pipsOf = n => { const c = cards.filter(e => e.innerText.indexOf(n) >= 0)[0]; if (!c) return null; const row = [...c.querySelectorAll('div')].filter(d => /측량/.test(d.textContent) && d.querySelector('.pips'))[0]; if (!row) return null;
        const html = row.innerHTML, i = html.indexOf('측량'); const tmp = document.createElement('div'); tmp.innerHTML = html.slice(i); const pp = tmp.querySelector('.pips'); return pp ? pp.querySelectorAll('i.on').length : null; };
      return { a: of(names[0]), low: of(names[1]), mv: of(names[2]), aPips: pipsOf(names[0]), lowPips: pipsOf(names[1]) };
    }, [A.name, L.name, M.name]);
    console.log(JSON.stringify(nb, null, 1));
    ok(nb.aPips === 1 && /측량.*★/.test(nb.a), '수첩: ' + A.name + ' 측량 칸 1개 + ★');
    ok(/선실 수련 · 측량 3년( \d+일)? · 다음 단계 9년/.test(nb.a), '수첩: 선실 수련 진행이 보인다');
    ok(nb.lowPips === 1 && /\(본디 2\)/.test(nb.low), '수첩: 충성 낮은 ' + L.name + ' 측량 칸 1개 (본디 2)');
    await page.screenshot({ path: path.join(OUT, 'notebook_mates.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // ---- 부하편성 설명
    await page.evaluate(() => { window.__done = false; G.Scenes.city.B.tavern.organize().then(() => { window.__done = true; }); });
    await page.waitForSelector('.modal-back .choice');
    const org = await page.evaluate(n => [...document.querySelectorAll('.modal-back .choice')].map(e => (e.innerText + ' | ' + (e.title || '')).replace(/\s+/g, ' ')).filter(t => t.indexOf(n) >= 0)[0] || '', A.name);   // 설명(desc)은 마우스를 올리면 뜨는 title
    const orgLow = await page.evaluate(n => [...document.querySelectorAll('.modal-back .choice')].map(e => (e.innerText + ' | ' + (e.title || '')).replace(/\s+/g, ' ')).filter(t => t.indexOf(n) >= 0)[0] || '', L.name);
    ok(/측량 1★/.test(org), '부하편성: ' + org.slice(0, 120));
    ok(/측량 1★\(본디 2\)/.test(orgLow), '부하편성 (충성 낮음): ' + orgLow.slice(0, 120));
    await page.screenshot({ path: path.join(OUT, 'organize.png') });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__done, null, { timeout: 5000 });

    // ---- 선실 창
    await page.evaluate(() => { window.__cv = G.CabinView.open(); });
    await page.waitForSelector('.modal-back .cb-roster .cb-mate');
    await page.waitForTimeout(600);
    const cv = await page.evaluate(names => {
      const chips = [...document.querySelectorAll('.modal-back .cb-roster .cb-mate')].map(e => e.innerText.replace(/\s+/g, ' '));
      const cards = [...document.querySelectorAll('.modal-back .cb-card')].map(e => e.innerText.replace(/\s+/g, ' '));
      const cardEl = [...document.querySelectorAll('.modal-back .cb-card')].filter(e => e.innerText.indexOf(names[1]) >= 0)[0];
      const g = cardEl && cardEl.querySelector('.cb-grow');
      return { chipA: chips.filter(t => t.indexOf(names[0]) >= 0)[0] || '', chipP: chips.filter(t => t.indexOf(names[1]) >= 0)[0] || '', cardP: cards.filter(t => t.indexOf(names[1]) >= 0)[0] || '', cardTip: g ? g.title : '' };
    }, [A.name, r.p.name]);
    console.log(JSON.stringify(cv, null, 1));
    ok(/측량 1★/.test(cv.chipA) && /선실 수련 측량 3년( \d+일)? · 다음 단계 9년/.test(cv.chipA), '선실 창 명단: ' + cv.chipA);
    ok(/선실 수련 측량 2년 14\d일 · 다음 단계 3년/.test(cv.chipP), '선실 창 명단 진행: ' + cv.chipP);
    ok(/수련 2년\/3년/.test(cv.cardP), '선실 카드 진행: ' + cv.cardP);
    ok(/선실 수련 측량 2년 14\d일 · 다음 단계 3년/.test(cv.cardTip), '선실 카드 진행 풀이(마우스): ' + cv.cardTip);
    await page.screenshot({ path: path.join(OUT, 'cabin_view.png') });
    // 부하를 누른 팝업
    await page.locator('.modal-back .cb-roster .cb-mate', { hasText: r.p.name }).first().click();
    await page.waitForSelector('.modal-back .cb-pop-mate');
    const pop = await page.evaluate(() => document.querySelector('.modal-back .cb-pop-mate .cb-pop-d').innerText.replace(/\s+/g, ' '));
    ok(/수련 측량 2년 14\d일 · 다음 단계 3년/.test(pop), '부하 팝업: ' + pop);
    await page.waitForTimeout(400);
    const popBox = await page.evaluate(() => { const b = document.querySelector('.modal-back .cb-pop-mate').getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; });
    console.log('popup box', popBox);
    await page.screenshot({ path: path.join(OUT, 'cabin_pop.png') });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    ok(errors.length === 0, '콘솔 오류 0 ' + (errors.length ? errors.slice(0, 3).join(' | ') : ''));
  } finally {
    await browser.close();
  }
  const bad = res.filter(x => !x[0]).length;
  console.log(bad ? '실패 ' + bad : '모두 통과 ' + res.length);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
