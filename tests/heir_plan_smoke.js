/* 후계를 위한 안배 — 소꿉친구의 방문 · 옛 부하 인선 · 세대 교체 (2026-10-29 사용자 요청) — node tests/heir_plan_smoke.js   (BROWSER_EXE=크롬 경로)
   js/systems/heirplan.js · js/data/heirplan.js · js/systems/oldguard.js · js/city/misc.js(자택)
   ① 소꿉친구: 찾아와서 「약속」 → k.cfriend.promised · 합류 전에는 술집에 없다(gone_) / 「지금 태운다」 → 사건 표시 없이 합류
   ② 인선: 20년↑ 옛 부하만 후보 · 약속한 소꿉친구가 한 자리 → 하나만 · 충성 높으면 받아들임 → 「안배」 꼬리표 · 이별을 겪지 않는다
      · 다시 열어 고르지 않으면 약속을 거둔다 · 거절하면 한 해 동안 다시 부탁할 수 없다
   ③ 세대 교체: 약속한 부하는 골라 둔 채로 남고(후견 · 약속 대사), 약속한 소꿉친구가 부두에서 합류, 약속하지 않은 노장은 내린다 · 약속은 비운다
   ④ 집에 들르면 제독 55세↑·어른 아들이면 한 번 권한다 · 자택 메뉴 「후계를 위한 안배」 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.HeirPlan && G.OldGuard && G.Family, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, said = [], out = {};
      UI.alert = async (t, title) => { said.push('[' + (title || '') + '] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + t); };
      UI.toast = () => {}; UI.fade = (fn) => { if (fn) fn(); }; G.Game.go = () => {};
      window.__confirm = true; UI.confirm = async () => window.__confirm;
      window.__ask = []; UI.ask = async (t, opts) => { said.push('ASK ' + t + ' :: ' + opts.map(o => (o.dis ? '(막힘)' : '') + o.label).join(' | ')); const w = window.__ask.shift(); const o = opts.find(x => x.value === w) || opts.find(x => !x.dis); return o ? o.value : null; };
      if (G.FamEv) G.FamEv.showPic = (ev) => { said.push('PIC ' + ev.img); return { stop: () => Promise.resolve() }; };
      const win0 = UI.window.bind(UI);
      UI.window = (o) => {
        if (!/남을 사람|인선/.test(o.title)) return win0(o);
        const el = document.createElement('div'); el.innerHTML = o.html; const w = { content: el };
        if (o.onBuild) o.onBuild(el, w);
        (window.__clicks || []).forEach(nm => { const tr = [...el.querySelectorAll('tr[data-og]')].find(x => x.textContent.indexOf(nm) >= 0); if (tr) tr.onclick({ preventDefault() {} }); });
        window.__win = { title: o.title, head: el.querySelector('.muted') && el.querySelector('.muted').textContent, rows: [...el.querySelectorAll('tr[data-og]')].map(x => x.textContent.replace(/\s+/g, ' ')), checked: [...el.querySelectorAll('tr[data-og] input:checked')].map(i => +i.dataset.og), disabled: [...el.querySelectorAll('tr[data-og] input:disabled')].length };
        window.__clicks = [];
        return { result: Promise.resolve('pick') };
      };
      G.State.newGame({ name: '가브리엘 코스타', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1540, m: 6, d: 1 }; s.player.born = { y: 1478, m: 1, d: 1 }; s.player.storage = []; s.player.surname = '코스타'; s.player.given = '가브리엘';
      G.Wander.apply();
      const plain = G.MATES.filter(m => !m.wd && !m.witch && !m.sib && !m.tale && !m.eventOnly && m.st && m.y && m.y[1] < 9000).slice(0, 4);
      const [V1, V2, V3, N] = plain;
      s.mates = [
        { id: V1.id, role: 'none', joined: 14950101, loyal: 90 },   // 45년 노장
        { id: V2.id, role: 'none', joined: 15150101, loyal: 90 },   // 25년 옛 부하
        { id: V3.id, role: 'none', joined: 14950101, loyal: 70 },   // 45년 노장 (약속 안 함)
        { id: N.id, role: 'none', joined: 15350101, loyal: 90 }     // 5년
      ];
      out.names = { V1: V1.name, V2: V2.name, V3: V3.name, N: N.name };
      const k = { name: '주앙', sex: 'm', born: { y: 1520, m: 3, d: 5 }, sk: {}, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, bond: 60 };
      s.player.kids.push(k);
      const HP = G.HeirPlan, c = G.CITY_DATA[s.player.home];
      out.cand = HP.candidates().map(m => G.MATE[m.id].name);
      // ① 소꿉친구 — 약속
      window.__ask = ['promise'];
      await HP.friendVisit(k, c);
      const fid = k.cfriend && k.cfriend.id, fdef = G.MATE[fid];
      out.friend = { st: k.cfriend.st, name: fdef && fdef.name, gone: !!s.flags['gone_' + fid], aboard: s.mates.some(m => m.id === fid), said: said.join('\n') };
      said.length = 0;
      // ② 인선 #1 — 약속한 소꿉친구가 한 자리 → 하나만 · V1에게 부탁
      window.__clicks = [V1.name];
      await HP.arrange(c);
      out.a1 = { win: window.__win, ids: HP.plan().ids.slice(), w: G.MateLeave.weight(s.mates[0]), tag: G.OldGuard.tags(s.mates[0], V1), said: said.join('\n'), loyal: s.mates[0].loyal };
      said.length = 0;
      // 인선 #2 — V1의 약속을 거두고 V2에게 부탁 → 거절
      G.BALANCE.heirPlan.accept = [[0, 0]];
      window.__clicks = [V1.name, V2.name];
      await HP.arrange(c);
      out.a2 = { ids: HP.plan().ids.slice(), no: !!HP.plan().no[V2.id], said: said.join('\n'), log: s.log.slice(-4).map(x => x.t).join(' / ') };
      said.length = 0;
      // 인선 #3 — V2는 막혀 있다 · V1에게 다시
      G.BALANCE.heirPlan.accept = [[0, 1]];
      window.__clicks = [V1.name];
      await HP.arrange(c);
      out.a3 = { ids: HP.plan().ids.slice(), win: window.__win };
      said.length = 0;
      // ③ 세대 교체 — 고르기 창은 그대로(미리 골라 둔 V1 + 소꿉친구)
      G.BALANCE.oldGuard.kinChance = 1;   // 약속한 소꿉친구가 있으면 무작위 친족은 오지 않는다
      window.__clicks = [];
      await G.Family.succeed(k, false);
      const s2 = G.Game.state, ids = s2.mates.map(m => m.id), v1 = s2.mates.find(m => m.id === V1.id);
      out.succ = { win: window.__win, v1: !!v1, aide: v1 && !!v1.aide, loyal: v1 && v1.loyal, v3: ids.includes(V3.id), v2: ids.includes(V2.id), friend: ids.includes(fid), fev: (s2.mates.find(m => m.id === fid) || {}).ev,
        gone: !s2.flags['gone_' + fid], kin: ids.filter(id => /^kin_/.test(id)).length, plan: JSON.stringify(s2.oldGuard.plan), cst: k.cfriend.st, said: said.join('\n') };
      said.length = 0;
      // ④ 자동으로 권한다 · 「지금 태운다」 · 자택 메뉴
      G.State.newGame({ name: '루이스 소자', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s3 = G.Game.state; s3.date = { y: 1560, m: 6, d: 1 }; s3.player.born = { y: 1498, m: 1, d: 1 };
      s3.mates = [{ id: V1.id, role: 'none', joined: 15300101, loyal: 90 }];
      const k3 = { name: '마누엘', sex: 'm', born: { y: 1540, m: 3, d: 5 }, sk: {}, lg: {}, st: { str: 55, int: 55, mar: 55, cha: 55 }, edu: {}, bond: 60 };
      s3.player.kids.push(k3);
      G.BALANCE.heirPlan.friendVisit = 0; window.__confirm = false;
      await HP.homeEvents(G.CITY_DATA[s3.player.home]);
      const asked1 = HP.plan().asked, said1 = said.filter(x => /앞날을 부탁/.test(x)).length;
      await HP.homeEvents(G.CITY_DATA[s3.player.home]);
      out.auto = { asked: asked1, offered: said.join('\n').indexOf('PIC') < 0, again: HP.plan().asked === asked1 };
      const menu = G.City && G.City.B ? null : null;
      const HM = G.Scenes && G.Scenes.city && G.Scenes.city.B ? G.Scenes.city.B.home : null;
      const items = (HM || (G.CityB && G.CityB.home) || { menu: () => [] }).menu(G.CITY_DATA[s3.player.home]).filter(Boolean).map(x => x.label);
      out.menu = items.join(',');
      G.BALANCE.heirPlan.friendVisit = 1; window.__ask = ['join'];
      await HP.homeEvents(G.CITY_DATA[s3.player.home]);
      const f3 = k3.cfriend && s3.mates.find(m => m.id === k3.cfriend.id);
      out.join = { st: k3.cfriend && k3.cfriend.st, row: !!f3, ev: f3 && f3.ev, kin: f3 && f3.kin, gone: k3.cfriend && !!s3.flags['gone_' + k3.cfriend.id], pics: said.filter(x => /^PIC/.test(x)).join(',') };
      return out;
    });
    console.log(JSON.stringify({ cand: r.cand, friend: r.friend.name, a1: r.a1.win, succ: r.succ.win, menu: r.menu }, null, 1));
    const n = r.names;
    ok(r.cand.length === 3 && !r.cand.includes(n.N), '부탁할 수 있는 옛 부하 = 20년↑ — ' + r.cand.join('·'));
    ok(r.friend.st === 'promised' && r.friend.gone && !r.friend.aboard && /나무 칼/.test(r.friend.said) && /PIC family-events\/childfriend_visit/.test(r.friend.said), '소꿉친구가 찾아와 약속 — 합류 전에는 술집에 없다 (' + r.friend.name + ')');
    ok(/약속한다/.test(r.friend.said) && /지금 우리 배에 태운다/.test(r.friend.said), '고를 길: 지금 태운다 · 약속 · 아직은 이르다');
    ok(r.a1.win.title === '후계를 위한 인선' && /1명까지/.test(r.a1.win.head) && /소꿉친구/.test(r.a1.win.head), '인선 창: 약속한 소꿉친구가 한 자리를 써서 하나만 — ' + r.a1.win.head.slice(0, 90));
    ok(r.a1.ids.length === 1 && r.a1.w === 0 && /안배/.test(r.a1.tag) && r.a1.loyal === 95, '충성 높은 노장이 받아들였다 — 「안배」 꼬리표 · 이별을 겪지 않는다 · 충성 +5');
    ok(/PIC family-events\/heir_council/.test(r.a1.said) && /곁에 남아 줄 사람/.test(r.a1.said) && /부탁이 있네/.test(r.a1.said), '저녁 식탁의 부탁 장면');
    ok(r.a2.ids.length === 0 && r.a2.no && /부탁을 거두었다/.test(r.a2.log) && /거절했다/.test(r.a2.log), '다시 열어 고르지 않으면 약속을 거둔다 · 거절하면 기록 — ' + r.a2.log);
    ok(r.a3.ids.length === 1 && r.a3.win.disabled >= 1 && r.a3.win.rows.some(x => /올해는 거절/.test(x)), '거절한 부하는 한 해 동안 막혀 있다');
    ok(r.succ.win.checked.length === 2 && r.succ.win.rows.some(x => /약속/.test(x)), '세대 교체 창: 약속한 부하·소꿉친구를 골라 둔 채로');
    ok(r.succ.v1 && r.succ.aide && r.succ.loyal === 100 && /약속드린 대로/.test(r.succ.said), '약속한 노장은 후견으로 남는다 — 약속 대사');
    ok(r.succ.friend && !r.succ.fev && r.succ.gone && r.succ.kin === 1 && /약속한 날이지/.test(r.succ.said) && r.succ.cst === 'joined', '약속한 소꿉친구가 부두에서 합류 (무작위 친족은 오지 않는다)');
    ok(!r.succ.v3 && r.succ.v2, '약속하지 않은 노장은 선대와 함께 내린다 · 노장이 아닌 옛 부하는 그대로');
    ok(/"ids":\[\]/.test(r.succ.plan) && /PIC family-events\/oldguard_farewell/.test(r.succ.said), '약속은 새 제독 몫으로 비운다 · 작별 장면');
    ok(r.auto.asked === 1560 && r.auto.again, '제독 55세↑·어른 아들이면 집에 들를 때 한 번 권한다 (거절해도 다시 묻지 않는다)');
    ok(/후계를 위한 안배/.test(r.menu), '자택 메뉴 「후계를 위한 안배」');
    ok(r.join.st === 'aboard' && r.join.row && !r.join.ev && r.join.kin === 'friend' && !r.join.gone && /childfriend_join/.test(r.join.pics), '「지금 태운다」 → 사건 표시 없이 합류 · 합류 장면');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' / ') : ''));
    console.log('heir_plan_smoke OK');
  } catch (e) {
    console.error('✗ ' + (e && e.stack || e)); process.exitCode = 1;
  } finally { await browser.close(); }
})();
