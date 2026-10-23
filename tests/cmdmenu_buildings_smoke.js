/* 실제 건물 메뉴의 도움말 풍선·버튼 글 점검 — node tests/cmdmenu_buildings_smoke.js   (BROWSER_EXE=크롬 경로)
   여러 도시(리스본·피렌체·이스탄불)의 건물(항구·술집·교역소·시장·조선소·도서관·성문·자택·여관 …)을 실제로 열어 본다.
   - 버튼 안 글이 밖으로 넘치지 않는다 (버튼과 그 안의 모든 칸: scrollWidth ≤ clientWidth, 칸이 버튼 상자 안)
   - 메뉴를 막 열었을 때(첫 항목에 키보드 표시가 저절로 붙어도) 풍선이 없다
   - 마우스를 올리면 풍선은 하나만, 그 버튼의 설명이 뜨고, 메뉴의 어느 버튼도 가리지 않는다(두 칸 메뉴 포함). 흐린(dim) 항목의 풍선도 또렷하다
   - 다른 버튼으로 옮기면 앞 풍선은 사라진다. 방향키로 고르면 풍선이 뜬다
   - 짧은 수치·상태(「20·20일 · 자재 10」 「16명 / 8~36」 「물건 값 131%」 「조선 기술 4등급」 「소지품 2/40」 「술 한 잔 10닢」)는 버튼 안에 남는다
   - 튜토리얼 「여기」 표(.tut-glow::after)는 풍선에 덮이지 않는다
   SHOTS=폴더 를 주면 화면을 찍는다. VIEWS=1280x720,960x540 (기본) · CITIES=0,30,112 (기본). 콘솔 오류 0. */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOTS || '';
const VIEWS = (process.env.VIEWS || '1280x720,960x540').split(',').map(v => v.split('x').map(Number));
const CITIES = (process.env.CITIES || '0,30,112').split(',').map(Number);
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const fails = [];
let passed = 0;
function ok(v, msg) { if (v) { passed++; return true; } fails.push(msg); console.log('  ✗ ' + msg); return false; }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const seenInline = [], seenTip = [];
  try {
    for (const [vw, vh] of VIEWS) {
      const tag = vw + 'x' + vh;
      console.log('== 화면 ' + tag);
      const page = await browser.newPage({ viewport: { width: vw, height: vh } });
      page.on('pageerror', e => errors.push(tag + ' pageerror ' + e.message));
      page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FILE|Failed to load|net::/.test(m.text())) errors.push(tag + ' ' + m.text()); });
      await page.addInitScript(() => {
        // 시험 도우미 (페이지 안)
        const T = window.__T = {};
        // 느린 swiftshader: 장면 그리기를 1초에 몇 번만 (메뉴·풍선은 DOM 이라 상관없다)
        const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => setTimeout(() => raf(cb), 200);
        const vis = el => { for (let e = el, op = 1; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; op *= +cs.opacity; if (!e.parentElement) return op; } return 0; };
        T.opacity = vis;
        /** 화면에 보이는 도움말 풍선들 — .cmd-tip 요소 + (예전 방식) 버튼 ::after 에 그린 설명 */
        T.bubbles = () => {
          const out = [];
          document.querySelectorAll('.cmd-tip').forEach(t => {
            const r = t.getBoundingClientRect(), op = vis(t);
            if (r.width > 2 && r.height > 2 && op > 0.05) out.push({ kind: 'el', text: t.textContent, op, rect: { l: r.left, t: r.top, r: r.right, b: r.bottom } });
          });
          document.querySelectorAll('.cmdmenu .cmd').forEach(b => {
            const c = getComputedStyle(b, '::after').content;
            if (c && c !== 'none' && c !== 'normal' && !/^"?여기"?$/.test(c)) out.push({ kind: 'after', text: c, op: vis(b) * +getComputedStyle(b, '::after').opacity, rect: null, btn: b.textContent.trim().slice(0, 14) });
          });
          return out;
        };
        /** 버튼과 그 안의 칸이 넘치는지 */
        T.overflow = () => [...document.querySelectorAll('.cmdmenu .cmd')].filter(b => {
          const R = b.getBoundingClientRect();
          if (b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1) return true;
          return [...b.children].some(ch => {
            if (ch.classList.contains('cmd-tip')) return false;
            const a = ch.getBoundingClientRect(), cs = getComputedStyle(ch);
            if (cs.position === 'absolute') return false;   // ⓘ 표 따위
            if (ch.scrollWidth > ch.clientWidth + 1 && ch.clientWidth > 0) return true;
            return a.right > R.right + 0.5 || a.left < R.left - 0.5 || a.bottom > R.bottom + 0.5 || a.top < R.top - 0.5;
          });
        }).map(b => b.textContent.trim());
        T.cmds = () => [...document.querySelectorAll('.cmdmenu .cmd')].map((b, i) => {
          const r = b.getBoundingClientRect(), sub = b.querySelector('.sub');
          return { i, text: b.textContent.trim(), tip: b.dataset.tip || '', sub: sub ? sub.textContent.trim() : '', dim: b.classList.contains('dim'),
            rect: { l: r.left, t: r.top, r: r.right, b: r.bottom }, x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
        });
      });
      await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
      await page.waitForFunction(() => window.G && G.Game && G.Scenes && G.Scenes.city && G.Game.sceneName === 'title', null, { timeout: 120000 });
      await page.evaluate(() => {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
        G.Game.state = G.State.newGame({ name: '검사', nation: 'PT', job: 'merchant', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        const s = G.Game.state; s.flags.prologue = true; s.player.gold = 500000;
        const UI = G.UI; UI.say = async () => {}; UI.ask = async () => null; UI.alert = async () => {}; UI.confirm = async () => false; UI.choose = async () => null;
      });
      for (const cid of CITIES) {
        const kinds = await page.evaluate(async cid => {
          const s = G.Game.state, C = G.Scenes.city, UI = G.UI;
          s.loc = { mode: 'city', city: cid }; G.Game.go('city', { cityId: cid });
          await new Promise(r => setTimeout(r, 1500));
          for (let i = 0; i < 20 && UI.busy(); i++) { const bt = document.querySelector('.modal-back .win .btn, .modal-back .btn'); if (bt) bt.click(); else document.querySelectorAll('.modal-back').forEach(x => x.click()); await new Promise(r => setTimeout(r, 300)); }
          for (let i = 0; i < 60 && C.isBusy(); i++) await new Promise(r => setTimeout(r, 300));
          const seen = {};
          return C.buildings(C.city()).filter(b => { const k = b.kind; if (seen[k]) return false; seen[k] = 1; return true; }).map(b => ({ kind: b.kind, arg: b.arg }));
        }, cid);
        const cname = await page.evaluate(() => G.Scenes.city.city().name);
        for (const bd of kinds) {
          const where = tag + ' ' + cname + ' ' + bd.kind;
          if (process.env.VERBOSE) console.log('  · ' + where);
          await page.mouse.move(3, vh - 3);
          const opened = await page.evaluate(async bd => {
            const C = G.Scenes.city;
            // 창이 열려 기다리는 건물(처음 오는 손님 대화 등)에 막히지 않게: 12초 안에 메뉴가 안 뜨면 건너뛴다
            const to = new Promise(r => setTimeout(() => r('timeout'), 12000));
            const v = await Promise.race([C.visit(bd.kind, bd.arg).then(() => 'ok', e => 'ERR ' + e), to]);
            if (v !== 'ok') { document.querySelectorAll('.modal-back').forEach(x => x.remove()); return v; }
            await new Promise(r => setTimeout(r, 150));
            return !!document.querySelector('.cmdmenu') && !G.UI.busy();
          }, bd);
          if (opened !== true) { console.log('  - ' + where + ': 메뉴 없음 (' + opened + ')'); await page.evaluate(async () => { const C = G.Scenes.city; if (C.current && C.current()) await Promise.race([C.leave(), new Promise(r => setTimeout(r, 5000))]); }); continue; }
          await page.waitForTimeout(80);
          const st = await page.evaluate(() => ({ cmds: __T.cmds(), over: __T.overflow(), bub: __T.bubbles(), many: document.querySelector('.cmdmenu').classList.contains('many'),
            kbd: !!document.querySelector('.cmdmenu .cmd.kbd-focus') }));
          st.cmds.forEach(c => { if (c.sub) seenInline.push({ where, t: c.sub }); if (c.tip) seenTip.push({ where, t: c.tip }); });
          ok(!st.over.length, where + ': 버튼 글이 넘치지 않는다 ' + JSON.stringify(st.over));
          ok(!st.bub.length, where + ': 막 열었을 때 풍선이 없다 (키보드 표시 ' + st.kbd + ') ' + JSON.stringify(st.bub.map(b => b.text.slice(0, 20))));
          if (SHOTS && /library|tavern|gate|harbor|market|home/.test(bd.kind)) await page.screenshot({ path: path.join(SHOTS, tag + '_' + cid + '_' + bd.kind + '_open.png') });
          // 풍선이 있는 버튼마다 마우스를 올린다
          const tips = st.cmds.filter(c => c.tip);
          let shot = false;
          for (const c of tips) {
            await page.mouse.move(c.x, c.y); await page.waitForTimeout(120);
            const b = await page.evaluate(() => ({ bub: __T.bubbles(), cmds: __T.cmds(), vw: innerWidth, vh: innerHeight }));
            const one = b.bub.length === 1;
            ok(one, where + ' 「' + c.text.slice(0, 10) + '」: 올리면 풍선이 하나 (' + b.bub.length + ')');
            if (!one) continue;
            const t = b.bub[0];
            ok(t.text.indexOf(c.tip) >= 0, where + ' 「' + c.text.slice(0, 10) + '」: 풍선 글이 그 버튼 설명');
            ok(t.op > 0.99, where + ' 「' + c.text.slice(0, 10) + '」' + (c.dim ? '(흐린 항목)' : '') + ': 풍선이 또렷하다 (불투명도 ' + t.op.toFixed(2) + ')');
            if (t.rect) {
              const hit = b.cmds.filter(o => t.rect.l < o.rect.r - 1 && t.rect.r > o.rect.l + 1 && t.rect.t < o.rect.b - 1 && t.rect.b > o.rect.t + 1);
              ok(!hit.length, where + ' 「' + c.text.slice(0, 10) + '」: 풍선이 메뉴 버튼을 가리지 않는다 ' + JSON.stringify(hit.map(h => h.text.slice(0, 10))));
              ok(t.rect.l >= -1 && t.rect.t >= -1 && t.rect.r <= b.vw + 1 && t.rect.b <= b.vh + 1, where + ' 「' + c.text.slice(0, 10) + '」: 풍선이 화면 안');
            }
            if (SHOTS && !shot && /library|tavern|harbor|market|home|shipyard|trade/.test(bd.kind)) { shot = true; await page.screenshot({ path: path.join(SHOTS, tag + '_' + cid + '_' + bd.kind + '_hover.png') }); }
          }
          // 풍선 없는 버튼으로 옮기면 풍선이 사라진다
          const plain = st.cmds.find(c => !c.tip);
          if (tips.length && plain) {
            await page.mouse.move(plain.x, plain.y); await page.waitForTimeout(120);
            const n = await page.evaluate(() => __T.bubbles().length);
            ok(n === 0, where + ': 설명 없는 버튼으로 옮기면 풍선이 사라진다 (' + n + ')');
          }
          // 방향키: 설명 있는 항목을 키로 고르면 풍선이 하나 뜬다 (거리에서는 메뉴 키를 쓰지 않으니 건물 안에서만)
          if (tips.length) {
            await page.mouse.move(3, vh - 3); await page.waitForTimeout(60);
            const r = await page.evaluate(async () => {
              const cmds = [...document.querySelectorAll('.cmdmenu .cmd')], want = cmds.findIndex(b => b.dataset.tip);
              if (G.UI.townKeys && G.UI.townKeys()) return { skip: 1 };
              const press = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: k, bubbles: true }));
              press('ArrowDown'); press('ArrowUp');   // 저절로 붙은 표시에서 한 번 움직였다 돌아오기
              for (let i = 0; i < cmds.length + 1; i++) { if (document.querySelector('.cmdmenu .cmd.kbd-focus') === cmds[want]) break; press('ArrowDown'); }
              await new Promise(r => setTimeout(r, 120));
              const bub = __T.bubbles();
              return { at: document.querySelector('.cmdmenu .cmd.kbd-focus') === cmds[want], n: bub.length, text: bub[0] && bub[0].text, tip: cmds[want].dataset.tip };
            });
            if (!r.skip) ok(r.at && r.n === 1 && r.text.indexOf(r.tip) >= 0, where + ': 방향키로 고른 항목의 풍선이 하나 뜬다 ' + JSON.stringify(r));
          }
          // 튜토리얼 「여기」 표: 설명 있는 첫 버튼에 붙여 보고, 그 위에 마우스·키보드 표시가 있어도 「여기」가 그대로 보이는지
          if (tips.length) {
            const c = tips[0];
            await page.evaluate(i => { const b = document.querySelectorAll('.cmdmenu .cmd')[i]; b.classList.add('tut-glow'); }, c.i);
            await page.mouse.move(c.x, c.y); await page.waitForTimeout(120);
            const r = await page.evaluate(i => {
              const b = document.querySelectorAll('.cmdmenu .cmd')[i], cs = getComputedStyle(b, '::after'), badge = cs.content, bop = +cs.opacity;   // 계산값은 살아 있는 객체 — 표를 떼기 전에 읽어 둔다
              const R = b.getBoundingClientRect(), x = R.right - 24, y = (R.top + R.bottom) / 2;   // 「여기」 표는 버튼 오른쪽 끝 가운데
              const top = document.elementFromPoint(x, y);
              const bub = __T.bubbles().filter(t => t.rect);
              const cover = bub.some(t => t.rect.l < R.right && t.rect.r > R.left && t.rect.t < R.bottom && t.rect.b > R.top);
              b.classList.remove('tut-glow');
              return { badge, op: bop, top: !!(top && (top === b || b.contains(top))), cover };
            }, c.i);
            ok(/여기/.test(r.badge) && r.top && !r.cover, where + ' 「' + c.text.slice(0, 10) + '」: 튜토리얼 「여기」 표가 풍선에 덮이지 않는다 ' + JSON.stringify(r));
            if (SHOTS && bd.kind === 'library') {
              await page.evaluate(i => document.querySelectorAll('.cmdmenu .cmd')[i].classList.add('tut-glow'), c.i);
              await page.waitForTimeout(80);
              await page.screenshot({ path: path.join(SHOTS, tag + '_' + cid + '_library_tutglow_hover.png') });
              await page.evaluate(i => document.querySelectorAll('.cmdmenu .cmd')[i].classList.remove('tut-glow'), c.i);
            }
          }
          await page.mouse.move(3, vh - 3);
          await page.evaluate(async () => { const C = G.Scenes.city; if (C.current && C.current()) await Promise.race([C.leave(), new Promise(r => setTimeout(r, 5000))]); await new Promise(r => setTimeout(r, 80)); });
        }
      }
      await page.close();
    }
    // 짧은 수치·상태는 버튼 안에 (한 번이라도 나왔다면 풍선으로 숨지 않았는지)
    const want = [[/자재 \d/, '항구 보급 「…일 · 자재 n」'], [/\d+명 \/ \d/, '술집 선원 「n명 / a~b」'], [/물건 값 \d+%/, '시장 「물건 값 n%」'], [/조선 기술 \d+등급/, '조선소 「조선 기술 n등급」'], [/소지품 \d+\/\d+/, '자택 보관함 「소지품 n/40」'], [/술 한 잔 \d+닢/, '술집 「술 한 잔 n닢」']];
    for (const [re, name] of want) {
      const tip = seenTip.filter(x => re.test(x.t)), inl = seenInline.filter(x => re.test(x.t));
      if (!tip.length && !inl.length) { console.log('  - ' + name + ': 이번에 연 메뉴에는 나오지 않았다'); continue; }
      ok(!tip.length && inl.length > 0, name + ' 는 버튼 안에 보인다 (안 ' + inl.length + ' · 풍선 ' + tip.length + (tip[0] ? ' 예: ' + tip[0].where + ' ' + tip[0].t : '') + ')');
    }
    ok(!errors.length, '콘솔 오류 0 ' + JSON.stringify(errors.slice(0, 5)));
  } finally {
    await browser.close();
  }
  console.log('\n통과 ' + passed + ' · 실패 ' + fails.length);
  if (fails.length) { console.log('실패 목록:\n' + fails.slice(0, 80).join('\n')); process.exit(1); }
  console.log('실제 건물 메뉴 도움말 점검 통과');
})().catch(e => { console.error(e); process.exit(1); });
