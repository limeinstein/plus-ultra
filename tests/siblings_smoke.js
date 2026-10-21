/* 은퇴 뒤의 동생들 (js/systems/siblings.js G.Siblings) — node tests/siblings_smoke.js   (BROWSER_EXE=크롬 경로)
   · 세대 교체: 뒤를 이은 아들 말고 남은 아이들이 새 제독의 집에 (시집간 딸·사라진 아이 빼고, 갓난아기는 이름을 지어 준다) · 아이 때 그림 그대로
   · 자택 메뉴 「동생들」 · 방 안의 가족에 선다 · 스무 살부터 항해사로 (둘까지, 월급 절반, 그림은 스무 살 아이 그림) · 동생과는 청혼 없음
   · 저장·불러오기 뒤에도 동생 항해사가 있다 · 스물두 살이 넘은 집의 동생: 아들은 제 길로, 딸은 시집 (지참금·혼례 그림·앞날 카드·편지)
   · 배를 떠난 동생은 집으로 돌아온다 · 해마다 스무 살·스물두 살 알림 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (error) { playwright = require('../tools/procedural_art/node_modules/playwright-core'); }
const { chromium } = playwright;
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Siblings && G.SIBLINGS, null, { timeout: 120000 });
    await page.evaluate(() => {
      const UI = G.UI;
      window.__said = []; window.__asks = []; window.__pick = [];   // __pick: 차례대로 고를 value (없으면 막히지 않은 첫 것)
      UI.say = async (t, who) => { window.__said.push((who && who.name ? who.name + ': ' : '') + t); };
      UI.alert = async (t) => { window.__said.push('[알림] ' + String(t).replace(/<[^>]+>/g, ' ')); };
      UI.toast = (t) => { window.__said.push('[토스트] ' + t); };
      UI.confirm = async () => true; UI.fade = async (fn) => { if (fn) fn(); };
      UI.ask = async (t, opts) => {
        window.__asks.push({ t, opts: opts.map(o => (o.dis ? '(막힘)' : '') + o.label) });
        const want = window.__pick.length ? window.__pick.shift() : undefined;
        const o = want !== undefined ? opts.find(x => x.value === want) : opts.find(x => !x.dis);
        return o ? o.value : null;
      };
      UI.choose = async (t, opts) => opts[0].value;
      G.Game.go = () => {}; G.Game.refreshHud = () => {}; G.State.save = () => {};
      if (G.FamEv) G.FamEv.showPic = (o) => { window.__pic = o.img; return { stop: async () => {} }; };
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
      const s = G.Game.state = G.State.newGame({ name: '아버지', nation: 'PT', job: 'explorer', age: 50, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
      s.date = { y: 1520, m: 6, d: 1 };
      s.player.wife = Object.keys(G.MAID)[0]; s.player.gold = 20000;
      function kid(name, sex, age, st, extra) { const k = Object.assign({ name, sex, born: { y: 1520 - age, m: 3, d: 5 }, sk: { nav: 1 }, lg: {}, st: Object.assign({ str: 55, int: 55, mar: 55, cha: 55 }, st || {}), edu: {}, bond: 60 }, extra || {}); s.player.kids.push(k); return k; }
      window.__heir = kid('주앙', 'm', 18);
      kid('마누엘', 'm', 20, { str: 70 });            // 스무 살 — 항해사로
      kid('이자벨', 'f', 21, { cha: 72 }, { aboard: true });   // 견습으로 배에 타 있던 딸 → 집으로
      kid('디오구', 'm', 23, { int: 75 });            // 이미 스물두 살 넘음 → 집에 들르면 떠난다
      kid('레오노르', 'f', 8);
      kid('마리아', 'f', 25, {}, { married: { kind: 'cha', y: 1513, title: '귀족 가문의 안주인' } });   // 시집간 딸은 빼고
      kid('', 'm', 0, {}, { unnamed: true });          // 갓난아기 — 이름을 지어 준다
      window.__art = {};
      s.player.kids.forEach(k => { if (k.name) window.__art[k.name] = G.HomeLife.chain(k, true)[0]; });
    });
    await page.evaluate(() => G.Family.succeed(window.__heir));
    let r = await page.evaluate(() => {
      const p = G.Game.state.player;
      return { name: p.name, gen: p.generation, sib: p.siblings.map(k => k.name + ':' + G.Family.kidAge(k)), kids: p.kids.length,
        art: p.siblings.filter(k => window.__art[k.name]).every(k => G.HomeLife.chain(k, true)[0].replace(/_v\d/, '') === window.__art[k.name].replace(/_v\d/, '')),
        faces: ['m', 'f'].every(sx => { const v = p.siblings.filter(k => k.sex === sx).map(k => k.portraitVariant).concat(sx === 'm' ? [p.heir.variant] : []); return new Set(v).size === v.length; }),
        aboard: p.siblings.some(k => k.aboard), said: window.__said.join('\n') };
    });
    ok(r.name === '주앙' && r.gen === 2 && r.kids === 0, '주앙이 뒤를 잇는다');
    ok(r.sib.length === 5 && !r.sib.some(x => /^마리아/.test(x)), '남은 아이 5명이 새 제독의 동생으로 (시집간 딸은 빼고) — ' + r.sib.join(', '));
    ok(r.sib.some(x => /:0$/.test(x) && !/^:/.test(x)), '이름 없던 갓난아기에게 이름 (' + r.sib.filter(x => /:0$/.test(x)) + ')');
    ok(r.art, '아이 때 그림(폴더·순번·나이)이 그대로');
    ok(r.faces, '같은 성별 형제끼리(뒤를 이은 제독 포함) 얼굴이 겹치지 않는다');
    ok(!r.aboard, '견습으로 배에 타 있던 딸도 집으로');
    ok(/남은 아이들/.test(r.said) && /스무 살이 되면 항해사로/.test(r.said), '「남은 아이들」 알림');

    // 집: 메뉴 · 방 안의 가족
    r = await page.evaluate(() => {
      const c = G.CITY_DATA[G.Game.state.player.home];
      const menu = G.Scenes.city.B.home.menu(c).filter(Boolean).map(m => m.label + (m.sub ? ' [' + m.sub + ']' : ''));
      const fam = G.HomeLife.family().map(f => f.name + ' ' + f.sub);
      return { menu, fam };
    });
    ok(r.menu.some(x => /^동생들 \[.*함께 항해 0\/2/.test(x)), '자택 메뉴 「동생들」 — ' + r.menu.filter(x => /동생/.test(x)));
    ok(r.fam.length === 4 && r.fam.every(x => /동생/.test(x)), '아내가 없어도 방 안에 동생들이 선다 (세 살 아래 빼고) — ' + r.fam.join(' / '));

    // 열 살 아래는 데려갈 수 없다 · 스무 살 마누엘을 항해사로
    r = await page.evaluate(async () => {
      const S = G.Siblings, p = G.Game.state.player, by = n => p.siblings.find(k => k.name === n);
      window.__asks = [];
      window.__pick = ['hire'];
      await S.talk(by('마누엘'), G.CITY_DATA[p.home]);
      const m = by('마누엘'), d = G.MATE[m.mateId], row = G.Game.state.mates.find(x => x.id === m.mateId);
      const sp = G.Scenes.mateSpec(m.mateId);
      return { id: m.mateId, row: !!row, sib: d && d.sib, wage: d && d.wage, face: d && d.face, half: d && d.halfKey, hasFace: !!(d && G.Img.has(d.face)), hasHalf: !!(d && G.Img.has(d.halfKey)),
        keys: G.Art.portraitKeys ? G.Art.portraitKeys(sp).slice(0, 3) : [], half2: G.Img.chain.mateHalf(m.mateId).join(','), st: d && d.st, asks: window.__asks };
    });
    ok(r.row && r.sib, '마누엘이 항해사가 되었다 (' + r.id + ')');
    ok(/family\/son_age20/.test(r.face) && r.hasFace && r.hasHalf, '항해사 그림은 스무 살 아이 그림 — ' + r.face + ' · ' + r.half);
    ok(r.keys.indexOf(r.face) >= 0 && r.half2.split(',').slice(0, 2).indexOf(r.half) >= 0, '얼굴·무릎상 사슬에 그 그림 (' + r.keys.join(',') + ')');
    ok(r.st[0] === 70, '능력은 자란 그대로 (힘 ' + r.st[0] + ')');
    r = await page.evaluate(async () => {
      const S = G.Siblings, p = G.Game.state.player, by = n => p.siblings.find(k => k.name === n);
      window.__asks = []; window.__pick = [null];
      await S.talk(by('레오노르'));
      const a8 = window.__asks[0].opts.join('|');
      const ok20 = await S.hire(by('이자벨'));   // 스물한 살 — 둘째
      const ok3 = await S.hire(by('디오구'));    // 셋째는 안 된다
      window.__asks = []; window.__pick = [null];
      await S.talk(by('디오구'));
      return { a8, ok20, ok3, n: S.aboard().length, full: window.__asks[0].opts.join('|') };
    });
    ok(!/항해사로/.test(r.a8), '여덟 살 동생에게는 「항해사로 데려간다」가 없다');
    ok(r.ok20 && !r.ok3 && r.n === 2 && /\(막힘\)항해사로 데려간다/.test(r.full), '함께 항해하는 동생은 둘까지 (셋째는 막힘)');

    // 동생과는 청혼·호감이 없다
    r = await page.evaluate(async () => {
      const p = G.Game.state.player, k = p.siblings.find(k => k.name === '이자벨'), m = G.Game.state.mates.find(x => x.id === k.mateId);
      window.__asks = []; window.__pick = ['chat', null];
      await G.MateTalk.talk(G.CITY_DATA[p.home], m);
      return { opts: window.__asks[0].opts.join('|'), aff: m.aff || 0 };
    }).catch(e => ({ err: e.message }));
    ok(!r.err && !/청혼/.test(r.opts) && !r.aff, '여동생 항해사와는 청혼·호감이 없다 — ' + (r.opts || r.err));

    // 저장·불러오기
    r = await page.evaluate(() => {
      const ids = G.Siblings.aboard().map(k => k.mateId);
      const txt = G.State.serialize();
      ids.forEach(id => { delete G.MATE[id]; });
      for (let i = G.MATES.length - 1; i >= 0; i--) if (G.MATES[i].sib) G.MATES.splice(i, 1);
      G.Game.state = G.State.deserialize(txt);
      G.Siblings.apply();
      return { ok: ids.every(id => G.MATE[id] && G.MATE[id].sib), n: G.Siblings.aboard().length, home: G.Siblings.home().length, gone: ids.some(id => G.Game.state.flags['gone_' + id]) };
    });
    ok(r.ok && r.n === 2 && r.home === 3 && !r.gone, '저장·불러오기 뒤에도 동생 항해사 둘 · 집에 셋');

    // 집에 들르면: 스물세 살 디오구가 제 길로 (지력 → 학자)
    r = await page.evaluate(async () => {
      window.__said = []; window.__pick = ['give']; const g0 = G.Game.state.player.gold;
      const did = await G.Siblings.check();
      const k = G.Game.state.player.siblings.find(k => k.name === '디오구');
      return { did, left: k.left, gold: g0 - G.Game.state.player.gold, said: window.__said.join('\n'), home: G.Siblings.home().map(k => k.name) };
    });
    ok(r.did && r.left && r.left.kind === 'life' && r.left.path === 'int' && r.gold === 800, '디오구가 집을 떠나 제 길로 — ' + r.left.title + ' (노자 ' + r.gold + '닢)');
    ok(/ENDING/.test(r.said) && /대학/.test(r.said) && r.home.indexOf('디오구') < 0, '앞날 카드 · 집에서 빠진다');
    console.log('     ' + r.said.split('\n').slice(0, 4).join('\n     '));

    // 이자벨을 배에서 내리게(해고) → 다음 해 스물두 살 → 집에 들르면 돌아와 있고, 시집간다
    r = await page.evaluate(async () => {
      const s = G.Game.state, k = s.player.siblings.find(k => k.name === '이자벨');
      s.mates = s.mates.filter(m => m.id !== k.mateId); s.flags['gone_' + k.mateId] = 1;   // 술집에서 해고한 것처럼
      s.date = { y: 1521, m: 3, d: 10 };   // 생일(3월 5일)이 지나 스물두 살
      const ny = G.Siblings.newYear().map(x => x.text);
      window.__said = []; window.__pic = null; window.__pick = ['rich']; const g0 = s.player.gold;
      const did = await G.Siblings.check();
      return { ny, did, k: k.married, left: k.left, gold: g0 - s.player.gold, pic: window.__pic, said: window.__said.join('\n') };
    });
    ok(r.ny.some(x => /이자벨.*스물두 살/.test(x)), '해마다 알림: ' + r.ny.join(' / '));
    ok(/이자벨: .*배에서 내렸어/.test(r.said), '배를 떠난 동생은 집으로 돌아온다');
    ok(r.did && r.k && r.left.kind === 'wed' && r.left.path === 'cha' && r.gold > 0, '이자벨이 시집간다 — ' + r.left.title + ' (지참금 ' + r.gold + '닢)');
    ok(r.pic === 'family-events/32_daughter_wedding_brother_pov' && /백작 가문/.test(r.said) && /형님/.test(r.said) && /오빠/.test(r.said) && /동생 이자벨/.test(r.said), '시집가는 날: 신랑 인사(형님) · 동생(오빠) · 남자 형제 시점 혼례 그림 · 편지');
    console.log('     ' + r.said.split('\n').filter(x => /^(백작|이자벨|\[알림\])/.test(x)).slice(0, 6).join('\n     ').slice(0, 900));

    // 마누엘(스물한 살, 배 위)은 떠나지 않는다 · 스무 살 알림
    r = await page.evaluate(async () => {
      const s = G.Game.state; s.date = { y: 1523, m: 6, d: 1 };   // 마누엘 23세 — 배 위
      const did = await G.Siblings.check();
      const m = s.player.siblings.find(k => k.name === '마누엘');
      return { did, aboard: G.Siblings.hired(m), left: !!m.left };
    });
    ok(r.aboard && !r.left, '배에 함께 탄 동생은 스물두 살이 넘어도 떠나지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
