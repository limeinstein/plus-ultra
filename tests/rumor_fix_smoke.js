/* 소문·옛 저장 아내 고침 점검 (QA 4·9·10·11·14·22, 2026-10-23)
   · 9  혼인한(집에 사는·선대의) 옛이야기 아가씨의 소문은 돌지 않는다 — G.Tale.ready 와 같은 답
   · 10 레오나르도 소문: 밀라노 공작을 만난 적이 없고 공작이 없는 해(1500~1518)에는 돌지 않는다 · 1519년(레오나르도가 떠난 해)도
   · 11 바르바로사 소문: 1543년 10월 뒤 · 1543년에 b.ok 없이는 돌지 않는다 — G.Barb.callDue 와 같은 답
   · 22 아즈텍·잉카 소문은 그 단계에 맞는 말만 · 이슬람 소문은 이슬람(오스만) 도시에서만 · 왕녀 소문은 결혼하지 않은 남자 제독에게만 · 말투(해요/하오)
   · 4  옛 저장: p.elders 만 있는 선대 아내(여급·부하)도 따라 떠난다 · 「셋째 부인으로 맞았다」 줄도 찾는다
   · 14 새 여급 이름은 모든 이름 있는 여급·부하 이름과 겹치지 않는다
   node tests/rumor_fix_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    await page.evaluate(() => G.Game.ensureGeo());
    await page.waitForFunction(() => G.Game.geoReady, null, { timeout: 120000, polling: 300 });
    const r = await page.evaluate(async () => {
      const out = {}, ER = G.EventRumor, byId = {}; G.EVENT_RUMORS.forEach(x => { byId[x.id] = x; });
      function fresh(y, m, d) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
        G.Game.state = G.State.newGame({ name: '페르난두', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        const s = G.Game.state; s.flags.prologue = true; s.date = { y, m: m || 6, d: d || 1 }; return s;
      }
      const live = id => ER.live(byId[id]);
      const textsOf = id => ER.texts(byId[id]).map(t => typeof t === 'string' ? t : t.y + ' / ' + t.o).join(' | ');
      // ---- 9 혼인한 옛이야기 아가씨
      let s = fresh(1500);
      out.tale0 = { snow: live('snow_white'), cin: live('cinderella'), mer: live('little_mermaid') };
      s.player.wife = 'snow_white'; s.player.wives2 = [{ id: 'cinderella', kind: 'mate', city: 14, house: true, aboard: false, wed: s.day }];
      s.player.elders = [{ id: 'little_mermaid', kind: 'mate', city: 0, title: '어머니', gen: 1 }];
      out.tale1 = { snow: live('snow_white'), cin: live('cinderella'), mer: live('little_mermaid'), readySnow: G.Tale.ready('snow_white'), readyCin: G.Tale.ready('cinderella'),
        paris: ER.at(G.CITY_DATA[14]).map(x => x.id) };
      // ---- 10 레오나르도
      const leo = (y, met) => { s = fresh(y); if (met) G.Sponsor.rel('it_moro').met = 1; return { live: live('leonardo'), metMoro: G.Leo.metMoro(), moro: G.Sponsor.present(G.SPONSOR.it_moro), leo: G.Sponsor.present(G.SPONSOR.it_leonardo) }; };
      out.leo = { y1485: leo(1485), y1505: leo(1505), y1505met: leo(1505, true), y1519met: leo(1519, true), y1481: leo(1481) };
      s = fresh(1490); s.mates.push({ id: 'leonardo', role: 'none', loyal: 95 }); out.leo.aboard = live('leonardo');
      // ---- 11 바르바로사
      const es = G.SPONSOR.es_crown;
      const barb = (y, m, b) => { s = fresh(y, m); s.barb = b || {}; return { live: live('barbarossa'), due: G.Barb.callDue(es), holder: G.Sponsor.holder(es) }; };
      out.barb = { y1540: barb(1540, 6), y1542dec: barb(1542, 12), y1543noOk: barb(1543, 5), y1543ok: barb(1543, 5, { ok: 1 }), y1543nov: barb(1543, 11, { ok: 1 }), call: barb(1543, 5, { ok: 1, stage: 'call' }) };
      // ---- 22 아즈텍: 단계에 맞는 말
      const az = (y, m, d, b) => { s = fresh(y, m, d); s.aztec = b || { told: {} }; return { live: live('aztec'), t: textsOf('aztec') }; };
      out.az = { y1518: az(1518, 6, 1), y1518done: az(1518, 6, 1, { rumor: 1, told: {} }), y1519may: az(1519, 5, 1), y1520: az(1520, 3, 1), end: az(1520, 3, 1, { end: 'cortes', told: {} }) };
      // ---- 22 잉카: 동업자는 고르지 않은 사람에게만 · 사양해도 쿠스코·반란은 누구나
      const inca = (y, m, b) => { s = fresh(y, m); s.incaFall = b || {}; return { live: live('inca'), t: textsOf('inca') }; };
      out.inca = { y1526: inca(1526, 1), partner: inca(1526, 1, { side: 'partner' }), declined: inca(1526, 1, { side: 'declined' }), declined1534: inca(1534, 3, { side: 'declined' }),
        allDone: inca(1536, 8, { side: 'declined', cusco: 'leave', siege: 'spain' }) };
      // ---- 22 이슬람 소문: 이슬람(오스만) 도시에서만
      s = fresh(1500);
      const sche = byId.scheherazade, lamp = byId.lamp;
      out.isl = { scheBad: G.CITY_DATA.filter(c => G.R.cityExists(c) && ER.near(sche, c) && c.rel !== 'I').map(c => c.name),
        lampBad: G.CITY_DATA.filter(c => G.R.cityExists(c) && ER.near(lamp, c) && !G.Legend.isOttoman(c)).map(c => c.name),
        scheCities: G.CITY_DATA.filter(c => ER.near(sche, c)).length,
        kiev: G.CITY_DATA.filter(c => /키예프|키이우|칸디아|간디아/.test(c.name)).map(c => c.name + ':' + (ER.near(sche, c) ? 'Y' : 'n')) };
      // ---- 22 왕녀: 결혼하지 않은 남자 제독
      s = fresh(1500); out.pr = { single: live('princess') };
      s.player.wife = 'm_lis'; out.pr.married = live('princess');
      s.player.wife = null; s.player.heir = { sex: 'f', folder: '' }; out.pr.female = live('princess');
      delete s.player.heir; s.princess = { stage: 0, sp: 'es_crown' }; out.pr.started = live('princess');
      // ---- 22 말투: 모든 소문에 해요체·하오체가 있고, 말하는 사람에 맞춰 고른다
      out.regMissing = G.EVENT_RUMORS.filter(x => typeof x.text !== 'function').filter(x => x.text.some(t => typeof t === 'string' || !t.y || !t.o)).map(x => x.id);
      s = fresh(1500); for (let i = 0; i < 20; i++) s.player.lg[i] = 3;
      const tol = G.CITY_DATA[4], picks = { woman: [], man: [], boy: [], elder: [] };
      for (let i = 0; i < 40; i++) Object.keys(picks).forEach(k => { const p = ER.pick({ type: k }, tol, true); if (p) picks[k].push(p.body); });
      out.reg = { womanYo: picks.woman.every(b => /요\.$|요…?$|라면….$|요\?$/.test(b) || /요\. |요\.$/.test(b)), manNoYo: picks.man.every(b => !/대요\.|래요\.|나 봐요\.|어요\.|세요\?/.test(b)), sampleW: picks.woman[0], sampleM: picks.man[0] };
      // ---- 4 옛 저장: p.elders 만 있다 (일지에 결혼 줄 없음)
      s = fresh(1560); s.player.generation = 2; delete s.pwMig; delete s.maidGen; delete s.tavernMaid;
      s.player.elders = [{ id: 'm_sev', kind: 'main', city: 7, title: '어머니', gen: 1 }, { id: 'w_morgan', kind: 'mate', city: 38, no: 2, title: '선대의 둘째 부인', gen: 1 }];
      s.mates.push({ id: 'w_morgan', role: 'none', joined: 15550101, loyal: 90, from: 38 });
      s.log = [{ d: 15600101, t: '페르난두가 은퇴하고 주앙이 뒤를 이었다.' }];
      const sevMaid = G.MaidSwap.at(7);
      out.mig1 = { sev: sevMaid && sevMaid.id, sevName: sevMaid && sevMaid.name, morgan: s.mates.some(m => m.id === 'w_morgan'), gone: !!s.flags.gone_w_morgan, past: G.MaidSwap.isPast('m_sev') && G.MaidSwap.isPast('w_morgan') };
      // ---- 4 옛 저장: 「셋째 부인으로 맞았다」
      s = fresh(1560); s.player.generation = 2; delete s.pwMig; delete s.maidGen; delete s.tavernMaid;
      s.log = [{ d: 15400101, t: '카르멘과 결혼했다.' }, { d: 15450101, t: '모르간 르 페이를 둘째 부인으로 맞았다.' }, { d: 15500101, t: '이네스를 셋째 부인으로 맞았다.' }, { d: 15600101, t: '페르난두가 은퇴하고 주앙이 뒤를 이었다.' }];
      const lis = G.MaidSwap.at(0), sev2 = G.MaidSwap.at(7);
      out.mig2 = { lis: lis && lis.id, lisName: lis && lis.name, sev: sev2 && sev2.id };
      // 지금 제독의 아내(이네스)는 그대로 둔다
      s = fresh(1560); s.player.generation = 2; delete s.pwMig; delete s.maidGen; delete s.tavernMaid; s.player.wife = 'm_lis';
      s.player.elders = [{ id: 'm_lis', kind: 'main', city: 0, title: '어머니', gen: 1 }];
      out.mig3 = G.MaidSwap.at(0).id;
      // ---- 14 새 여급 이름: 모든 여급·부하 이름과 겹치지 않는다 (같은 술집을 여러 번 바꿔도)
      s = fresh(1560); s.pwMig = 1;
      const dup = [], made = [];
      const others = (id) => { const t = {}; Object.keys(G.MAID).forEach(k => { if (k !== id && G.MAID[k] && G.MAID[k].name && (!G.MAID[k].gen || s.maidGen[k])) t[G.MAID[k].name] = (t[G.MAID[k].name] || 0) + 1; }); Object.keys(G.MATE).forEach(k => { if (G.MATE[k] && G.MATE[k].name) t[G.MATE[k].name] = 1; }); return t; };
      (G.MAIDS || []).slice(0, 60).forEach(m => { const n = G.MaidSwap.replace(m); if (n) { made.push(n.name); if (others(n.id)[n.name]) dup.push(m.city + ':' + n.name); } });
      for (let i = 0; i < 14; i++) { const cur = G.MaidSwap.at(0); const n = G.MaidSwap.replace(cur); made.push(n.name); if (others(n.id)[n.name]) dup.push('lisbon#' + i + ':' + n.name); }
      out.names = { made: made.length, dup, sample: made.slice(-6) };
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    // 9
    ok(r.tale0.snow && r.tale0.cin && r.tale0.mer, '혼인 전: 백설공주·신데렐라·인어공주 소문이 돈다');
    ok(!r.tale1.snow && !r.tale1.cin && !r.tale1.mer && !r.tale1.readySnow && !r.tale1.readyCin, '본처(백설공주)·집에 사는 부인(신데렐라)·선대 부인(인어공주)의 소문은 돌지 않는다 — G.Tale.ready 와 같다');
    ok(!r.tale1.paris.includes('snow_white') && !r.tale1.paris.includes('cinderella'), '파리 마을 사람: ' + r.tale1.paris.join('·'));
    // 10
    ok(r.leo.y1485.live && r.leo.y1485.moro, '1485년(일 모로가 밀라노 공작): 레오나르도 소문이 돈다');
    ok(!r.leo.y1505.live && !r.leo.y1505.moro && !r.leo.y1505.metMoro, '1505년, 공작을 만난 적 없음(공작 자리 빔): 레오나르도 소문이 돌지 않는다');
    ok(r.leo.y1505met.live, '1505년, 공작을 만난 적 있음: 소문이 돈다');
    ok(!r.leo.y1519met.live && !r.leo.y1519met.leo && !r.leo.y1481.live && !r.leo.aboard, '1519년(저택이 빔)·1481년·배에 태운 뒤에는 돌지 않는다');
    // 11
    ok(r.barb.y1540.live && r.barb.y1542dec.live, '1540년·1542년 12월: 아직 조건을 갖출 수 있다 — 소문이 돈다');
    ok(!r.barb.y1543noOk.live && !r.barb.y1543noOk.due, '1543년 5월, b.ok 없음: 소문 없음 (황제도 부르지 않는다)');
    ok(r.barb.y1543ok.live === r.barb.y1543ok.due && r.barb.y1543ok.live, '1543년 5월, b.ok 있음: 소문이 돈다 = 황제가 부른다 (' + r.barb.y1543ok.holder + ')');
    ok(!r.barb.y1543nov.live && !r.barb.y1543nov.due && !r.barb.call.live, '1543년 11월(부름 기한 지남)·부름을 받은 뒤: 소문 없음');
    // 22
    ok(/쿠바/.test(r.az.y1518.t) && !r.az.y1518done.live, '아즈텍 1518년: 쿠바의 술잔 이야기 · 이미 코르테스와 술잔을 나눴으면 소문 없음');
    ok(r.az.y1519may.live && !/쿠바/.test(r.az.y1519may.t) && /떠났/.test(r.az.y1519may.t), '아즈텍 1519년 5월: 「쿠바에서 사람을 모은다」 대신 「서쪽 땅으로 떠났다」');
    ok(r.az.y1520.live && /들어갔/.test(r.az.y1520.t) && !r.az.end.live, '아즈텍 1520년: 「황금 도시에 들어갔다」 · 끝난 뒤엔 없음');
    ok(/동업자/.test(r.inca.y1526.t) && !/동업자/.test(r.inca.partner.t) && r.inca.partner.live, '잉카: 이미 동업자면 「동업자를 찾는」 말은 나오지 않는다');
    ok(r.inca.declined.live && !/동업자/.test(r.inca.declined.t) && r.inca.declined1534.live && !r.inca.allDone.live, '잉카: 사양해도 쿠스코·반란 이야기는 남는다 · 둘 다 겪으면 끝');
    ok(!r.isl.scheBad.length && !r.isl.lampBad.length && r.isl.scheCities > 3, '이슬람 소문은 이슬람 도시(알라딘은 오스만 도시)에서만 — ' + r.isl.kiev.join(' '));
    ok(r.pr.single && !r.pr.married && !r.pr.female && !r.pr.started, '왕녀 소문: 결혼하지 않은 남자 제독에게만 (기혼·여성 제독·이미 시작 → 없음)');
    ok(!r.regMissing.length, '모든 소문 말에 해요체·하오체가 있다 ' + r.regMissing.join(','));
    ok(r.reg.womanYo && r.reg.manNoYo, '말투: 마을 여자 「' + r.reg.sampleW + '」 · 마을 사람 「' + r.reg.sampleM + '」');
    // 4
    ok(r.mig1.sev && r.mig1.sev !== 'm_sev' && r.mig1.sevName !== '카르멘' && !r.mig1.morgan && r.mig1.gone && r.mig1.past, '옛 저장(p.elders 만): 세비야 술집 카르멘 → ' + r.mig1.sevName + ', 모르간은 함대에서 내림');
    ok(r.mig2.lis && r.mig2.lis !== 'm_lis' && r.mig2.lisName !== '이네스' && r.mig2.sev !== 'm_sev', '옛 저장(「셋째 부인으로 맞았다」 줄): 리스본 이네스 → ' + r.mig2.lisName);
    ok(r.mig3 === 'm_lis', '지금 제독의 아내인 여급은 그대로');
    // 14
    ok(!r.names.dup.length && r.names.made > 60, '새 여급 ' + r.names.made + '명: 이름이 다른 여급·부하와 겹치지 않는다 (' + r.names.sample.join('·') + ') ' + r.names.dup.join(','));
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
