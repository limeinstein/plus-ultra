/* 말투·이야기 (js/systems/voice.js · js/data/voices*.js)
   · 이벤트 부하마다 고유 말투(첫마디·근황·한잔·옛이야기 4~6편), 보통 부하는 17가지 말투 갈래, 요령은 말씨대로
   · 아내는 성품(여급 like 8가지·마녀)이나 고유 아내 말로, 아이는 나이 × 아들딸 × 성격 × 사이로
   · 부하와 이야기 → 「옛이야기를 청한다」로 한 편씩 · 자택 가족 · 둘째 부인의 집에서 실제로 그 말이 나온다
   node tests/voices_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Voice && G.MateTalk && G.Family && G.Wives, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const V = G.Voice, out = { bad: [] }, bad = (m) => out.bad.push(m);
      const REG = ['hao', 'hage', 'yo', 'sp', 'ban'];
      const arr = (a, n, where) => { if (!Array.isArray(a) || a.length < n) bad(where + ' 모자람 (' + (a ? a.length : 0) + '/' + n + ')'); };
      const allStr = [];
      const walk = (o, where) => { if (typeof o === 'string') { allStr.push([where, o]); return; } if (o && typeof o === 'object') for (const k in o) walk(o[k], where + '.' + k); };
      // 1) 이벤트 부하 고유 말투
      const VO = G.VOICES || {}, ids = Object.keys(VO);
      out.uniques = ids.length;
      ids.forEach(id => {
        const v = VO[id], d = G.MATE[id];
        if (!d) { bad('없는 부하 ' + id); return; }
        if (REG.indexOf(v.reg) < 0) bad(id + ' reg');
        ['hi', 'mid', 'low'].forEach(b => { arr(v.greet && v.greet[b], 1, id + '.greet.' + b); arr(v.chat && v.chat[b], 1, id + '.chat.' + b); });
        arr(v.again, 1, id + '.again'); arr(v.drink, 1, id + '.drink'); if (!v.drinkDone) bad(id + '.drinkDone'); arr(v.lifeIntro, 1, id + '.lifeIntro');
        if (!v.stories || v.stories.length < 4 || v.stories.length > 6) bad(id + ' 옛이야기 ' + (v.stories || []).length + '편');
        (v.stories || []).forEach((s, i) => { if (!s.t || !s.l || s.l.length < 3 || s.l.length > 6) bad(id + ' 이야기 ' + i); });
        const canLove = d.g === 'f' && !d.minor && !d.sib;
        if (v.love && !canLove) bad(id + ' love는 여자 어른만');
        if (v.wife && !canLove) bad(id + ' wife는 여자 어른만');
        walk(v, id);
      });
      // 2) 말투 갈래 17 · 요령 10×5 · 아내 9 · 아이
      const T = G.VOICE_TYPES || {}, TK = ['rush', 'noble', 'merch', 'hidden', 'genius', 'shonen', 'charm', 'cute', 'tsun', 'grumpy', 'plain', 'polite', 'old_m', 'old_f', 'child_m', 'child_f', 'witch'];
      TK.forEach(k => { const v = T[k]; if (!v) { bad('갈래 ' + k); return; } if (REG.indexOf(v.reg) < 0) bad(k + ' reg'); ['hi', 'mid', 'low'].forEach(b => { arr(v.greet && v.greet[b], 2, k + '.greet.' + b); arr(v.chat && v.chat[b], 3, k + '.chat.' + b); }); arr(v.again, 3, k + '.again'); arr(v.drink, 3, k + '.drink'); arr(v.lifeIntro, 2, k + '.lifeIntro'); walk(v, k); });
      out.types = TK.filter(k => T[k]).length;
      const TIP = G.VOICE_TIPS || {};
      ['nav', 'med', 'acct', 'sword', 'gun', 'theo', 'survey', 'ship', 'speech', 'def'].forEach(k => REG.forEach(r => { if (!(TIP[k] && TIP[k][r])) bad('요령 ' + k + '.' + r); }));
      const WV = G.WIFE_VOICES || {};
      ['brave', 'bold', 'kind', 'steady', 'delicate', 'generous', 'strong', 'willful', 'witch'].forEach(k => { const w = WV[k]; if (!w) { bad('아내 ' + k); return; } ['greet', 'away', 'nokids', 'pregHint', 'preg', 'lowKid', 'baby', 'home2', 'kids2'].forEach(f => arr(w[f], 2, '아내 ' + k + '.' + f)); (w.preg || []).forEach(t => { if (t.indexOf('{n}') < 0) bad('아내 ' + k + ' preg {n}'); }); (w.lowKid || []).forEach(t => { if (t.indexOf('{kid}') < 0) bad('아내 ' + k + ' lowKid {kid}'); }); (w.kids2 || []).forEach(t => { if (t.indexOf('{kids}') < 0) bad('아내 ' + k + ' kids2 {kids}'); }); walk(w, '아내' + k); });
      const KV = G.KID_VOICES || {}, TEMP = ['lively', 'calm', 'warm', 'stubborn'];
      ['tod', 'kid', 'teen', 'adult'].forEach(bd => ['m', 'f'].forEach(sx => TEMP.forEach(t => ['hi', 'mid', 'lo'].forEach(b => arr(KV[bd] && KV[bd][sx] && KV[bd][sx][t] && KV[bd][sx][t][b], 2, '아이 ' + bd + sx + t + b)))));
      ['m', 'f'].forEach(sx => TEMP.forEach(t => arr(KV.aboard && KV.aboard[sx] && KV.aboard[sx][t], 2, '견습 ' + sx + t)));
      TEMP.forEach(t => ['play', 'tale', 'story', 'storyCold'].forEach(f => arr(KV.react && KV.react[t] && KV.react[t][f], 1, '반응 ' + t + f)));
      walk(KV, '아이'); walk(TIP, '요령');
      // 3) 글: 너무 긴 마디, 남은 글자리, 같은 말 되풀이
      const long = allStr.filter(x => x[1].length > 140 && !/\.stories\./.test(x[0]));
      out.long = long.slice(0, 3).map(x => x[0] + ' ' + x[1].length);
      out.braces = allStr.filter(x => /\{(?!p\}|n\}|kid\}|kids\})[^}]*\}/.test(x[1])).slice(0, 3).map(x => x[0]);
      const seen = {}; let dup = 0; allStr.forEach(x => { if (x[1].length > 12) { if (seen[x[1]]) dup++; seen[x[1]] = 1; } }); out.dup = dup;
      out.lines = allStr.length;
      // 4) 모든 부하가 말투를 얻는다 — 갈래가 고루 쓰인다
      const cnt = {}; G.MATES.forEach(d => { const k = V.typeOf(d); cnt[k] = (cnt[k] || 0) + 1; if (!V.greet(d, { loyal: 70 })) bad('첫마디 없음 ' + d.id); });
      out.typeCount = cnt;
      out.distinct = new Set(['guan_yu', 'zhang_fei', 'liu_bei', 'scheherazade', 'peter_pan', 'napoleon'].filter(id => G.MATE[id]).map(id => V.greet(G.MATE[id], { loyal: 70 }))).size;
      // 5) 부하와 이야기: 옛이야기 한 편 · 근황 · 요령 말씨
      const UI = G.UI, said = [];
      const saved = { say: UI.say, ask: UI.ask, choose: UI.choose, toast: UI.toast };
      UI.say = async (t) => { said.push(Array.isArray(t) ? t.join('\f') : String(t)); };
      UI.toast = () => {};
      const s = G.Game.state, gid = VO.guan_yu ? 'guan_yu' : ids[0];
      s.mates.push({ id: gid, role: 'none', loyal: 70 });
      const m = s.mates[s.mates.length - 1];
      let step = 0; const plan = ['tale', 'tale', 'chat', null];
      UI.ask = async (t, ch) => { said.push('Q:' + t); return plan[step++]; };
      await G.MateTalk.talk(G.CITY_DATA[s.player.home], m);
      const st = VO[gid].stories;
      out.tale = { first: said.some(x => x.indexOf(st[0].t) >= 0 && x.indexOf(st[0].l[0]) >= 0), second: said.some(x => x.indexOf(st[1].t) >= 0), vtale: m.vtale, loyal: m.loyal, greetUnique: said.some(x => VO[gid].greet.mid.concat(VO[gid].greet.hi, VO[gid].greet.low).some(g => x.indexOf(g) >= 0)) };
      out.tipReg = V.reg(G.MATE[gid]) + ':' + !!V.tip(G.MATE[gid]);
      // 6) 자택: 아내(여급 bold) · 아이 넷 (나이·성격 다르게)
      said.length = 0;
      const maid = G.MAIDS.find(x => x.like === 'bold'); s.player.wife = maid.id;
      const mk = (name, sex, age, temper, bond) => ({ name, sex, born: { y: s.date.y - age, m: 1, d: 1 }, sk: {}, lg: {}, st: { str: 50, int: 50, mar: 50, cha: 50 }, edu: {}, temper, bond });
      s.player.kids = [mk('가', 'm', 4, 'lively', 80), mk('나', 'f', 9, 'calm', 20), mk('다', 'f', 13, 'stubborn', 50), mk('라', 'm', 17, 'warm', 70)];
      UI.ask = async () => null;
      s.player.homeGap = 400; s.player.homeGapDay = s.day;
      await G.Family.talk();
      const WB = WV.bold || {}, seg = t => t.split(/\{[^}]+\}/).sort((a, b) => b.length - a.length)[0].slice(0, 14), inList = (l) => said.some(x => (l || []).some(t => x.indexOf(V.fill(seg(t))) >= 0));
      out.home = { away: inList(WB.away), lowKid: inList(WB.lowKid), tod: inList(KV.tod.m.lively.hi), kid: inList(KV.kid.f.calm.lo), teen: inList(KV.teen.f.stubborn.mid), adult: inList(KV.adult.m.warm.hi), n: said.length };
      // 7) 둘째 부인의 집: 성품 말 · 그 집 아이 한마디
      said.length = 0;
      const maid2 = G.MAIDS.find(x => x.like === 'delicate' && x.id !== maid.id);
      s.player.wives2 = [{ id: maid2.id, kind: 'maid', city: maid2.city, house: true, aboard: false, wed: s.day }];
      const k2 = mk('마', 'm', 8, 'warm', 70); k2.mother = maid2.id; k2.house = maid2.city; s.player.kids.push(k2);
      await G.Wives.talk(G.Wives.of(maid2.id));
      const WD = WV.delicate || {};
      out.home2 = { greet: inList(WD.home2), kids2: inList(WD.kids2), kid: inList(KV.kid.m.warm.hi) };
      Object.assign(UI, saved);
      return out;
    });
    ok(!r.bad.length, '자료 빠짐 없음' + (r.bad.length ? ': ' + r.bad.slice(0, 12).join(' / ') : ''));
    ok(r.uniques >= 40, '이벤트 부하 고유 말투 ' + r.uniques + '명');
    ok(r.types === 17, '보통 부하 말투 갈래 17가지 — 쓰임: ' + JSON.stringify(r.typeCount));
    ok(!r.long.length && !r.braces.length, '마디 길이·글자리 이상 없음 ' + JSON.stringify(r.long) + JSON.stringify(r.braces));
    ok(r.dup <= 5, '같은 말 되풀이 ' + r.dup + '마디 (모두 ' + r.lines + '마디)');
    ok(r.distinct >= 5, '이벤트 부하 첫마디가 저마다 다름 (' + r.distinct + '/6)');
    ok(r.tale.first && r.tale.second && r.tale.vtale === 2 && r.tale.loyal === 73 && r.tale.greetUnique, '부하와 이야기: 고유 첫마디 · 옛이야기 두 편 차례로(처음 들을 때 충성 +1씩) · 근황 ' + JSON.stringify(r.tale));
    ok(/:true$/.test(r.tipReg), '요령도 그 사람 말씨로 (' + r.tipReg + ')');
    ok(r.home.away && r.home.lowKid && r.home.tod && r.home.kid && r.home.teen && r.home.adult, '자택: 아내(당당한) 오랜만 · 서먹한 아이 · 아이 네 명이 나이·성격·사이대로 ' + JSON.stringify(r.home));
    ok(r.home2.greet && r.home2.kids2 && r.home2.kid, '둘째 부인(섬세한)의 집: 성품 말 · 아이들 이야기 · 그 집 아이 한마디 ' + JSON.stringify(r.home2));
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
