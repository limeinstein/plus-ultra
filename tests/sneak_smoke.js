/* 잠입: 이슬람 성지·내륙·지중해 이슬람 도시 + 명나라 쇄국 도시, 터번·명나라 옷 변장, 통행 허가 기한.
   node tests/sneak_smoke.js  (BROWSER_EXE=크로미움 경로) */
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
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 0), diff: 'normal' });
    });
    // ---- 어느 도시가 막히나
    const r = await page.evaluate(() => {
      const s = G.Game.state, C = G.Scenes.city, by = n => G.CITY_DATA.find(c => c.name === n);
      const chk = (n, y) => { s.date.y = y; const x = C.entryCheck(by(n)); return x ? x.reason + (x.zone ? ':' + x.zone : '') : 'open'; };
      return {
        alex: chk('알렉산드리아', 1480), cairo: chk('카이로', 1480), mecca: chk('메카', 1480), ist: chk('이스탄불', 1480), tunis: chk('튀니스', 1480),
        basra: chk('바스라', 1480), aden: chk('아덴', 1480), sinop: chk('시높', 1480), casa: chk('카사블랑카', 1480), malacca: chk('말라카', 1480), venice: chk('베니스', 1480),
        malaga80: chk('말라가', 1480), malaga90: chk('말라가', 1490), granada80: chk('그라나다', 1480), granada93: chk('그라나다', 1493),
        kazan1500: chk('카잔', 1500), kazan1560: chk('카잔', 1560), samar: chk('사마르칸트', 1480), canton: chk('광주', 1480), macau: chk('오문', 1560)
      };
    });
    ok(r.alex === 'islam:med' && r.tunis === 'islam:med' && r.ist === 'islam:med', '지중해 이슬람 항구(알렉산드리아·튀니스·이스탄불) — 잠입/교섭 필요');
    ok(r.cairo === 'islam:inland' && r.samar === 'islam:inland', '내륙 이슬람 도시(카이로·사마르칸트) — 잠입/교섭 필요');
    ok(r.mecca === 'holy', '성지 메카 — 예전대로 성지');
    ok(['basra', 'aden', 'sinop', 'casa', 'malacca', 'venice'].every(k => r[k] === 'open'), '인도양·흑해·대서양·동남아 이슬람 항구와 유럽 도시는 열려 있음 ' + JSON.stringify([r.basra, r.aden, r.sinop, r.casa, r.malacca]));
    ok(r.malaga80 === 'islam:med' && r.malaga90 === 'open', '말라가: 1480 그라나다 왕국(막힘) → 1490 카스티야(열림)');
    ok(r.granada80 === 'islam:inland' && r.granada93 === 'open', '그라나다: 1492년 함락 뒤 열림');
    ok(r.kazan1500 === 'islam:inland' && r.kazan1560 === 'open', '카잔: 1552 러시아 차르국 뒤 열림');
    ok(r.canton === 'closed' && r.macau === 'open', '명나라 광주는 쇄국, 오문은 열림');

    // ---- 가망 계산
    const p = await page.evaluate(() => {
      const s = G.Game.state, SN = G.Sneak, R = G.R, by = n => G.CITY_DATA.find(c => c.name === n);
      s.date.y = 1480; s.player.items = s.player.items.filter(it => it.id !== 'turban' && it.id !== 'mingrobe');
      const alex = by('알렉산드리아'), canton = by('광주'), xian = by('서안'), mecca = by('메카');
      const out = {};
      out.alex0 = SN.chance(alex, 'islam');
      out.canton0 = SN.chance(canton, 'closed');
      R.addItem('turban');
      out.alexT = SN.chance(alex, 'islam'); out.meccaT = SN.chance(mecca, 'holy'); out.cantonT = SN.chance(canton, 'closed'); out.xianT = SN.chance(xian, 'closed');
      R.addItem('mingrobe');
      out.cantonM = SN.chance(canton, 'closed');
      s.player.lg[alex.lang] = 2; out.alexTL = SN.chance(alex, 'islam'); s.player.lg[alex.lang] = 0;
      s.player.notoriety = 40; out.alexTN = SN.chance(alex, 'islam'); s.player.notoriety = 0;
      (s.flags.sneakFail = {})[alex.id] = s.day; out.alexTF = SN.chance(alex, 'islam'); s.flags.sneakFail = {};
      const pc = x => Math.round(x.p * 100);
      return { a0: pc(out.alex0), aT: pc(out.alexT), mT: pc(out.meccaT), c0: pc(out.canton0), cT: pc(out.cantonT), xT: pc(out.xianT), cM: pc(out.cantonM), aTL: pc(out.alexTL), aTN: pc(out.alexTN), aTF: pc(out.alexTF),
        dzC: out.cantonM.dz, tips0: out.alex0.tips.join(' / '), parts: out.alexT.parts.map(x => x[0] + ' ' + Math.round(x[1] * 100)).join(', ') };
    });
    console.log('    가망 %:', JSON.stringify(p));
    ok(p.aT - p.a0 === 35, '터번: 알렉산드리아 ' + p.a0 + '% → ' + p.aT + '%');
    ok(p.mT > p.aT - 30 && p.mT < p.aT, '성지 메카는 터번이 있어도 더 어렵다 (' + p.mT + '%)');
    ok(p.cT - p.c0 === 12 && p.xT - p.c0 === 4, '중국: 터번은 항구 광주 +12%, 내륙 서안 +4% (회회 상인)');
    ok(p.cM - p.c0 === 35 && p.dzC === 'mingrobe', '명나라 옷: 광주 ' + p.c0 + '% → ' + p.cM + '% (터번보다 먼저 씀)');
    ok(p.aTL === p.aT + 22, '아랍어 2단계: −10%(못 함) 대신 +12%');
    ok(p.aTN < p.aT && p.aTF === p.aT - 15, '악명·최근에 들킨 일은 가망을 깎는다');
    ok(/터번/.test(p.tips0), '터번이 없으면 부관이 귀띔');

    // ---- 통행 허가 기한
    const pass = await page.evaluate(() => {
      const s = G.Game.state, C = G.Scenes.city, alex = G.CITY_DATA.find(c => c.name === '알렉산드리아');
      s.date.y = 1480; G.Sneak.givePass(alex); const a = C.entryCheck(alex);
      s.day += 400; const b = C.entryCheck(alex); s.day -= 400;
      delete s.flags['pass' + alex.id]; delete s.flags['passD' + alex.id];
      return { a: a && a.reason, b: b && b.reason };
    });
    ok(pass.a == null && pass.b === 'islam', '교섭 통행 허가: 1년 동안 그냥 들어가고, 지나면 다시 막힘');

    // ---- 성문에서의 흐름 (대화는 자동으로 넘김)
    const flow = await page.evaluate(async () => {
      const UI = G.UI;
      const s = G.Game.state, C = G.Scenes.city, alex = G.CITY_DATA.find(c => c.name === '알렉산드리아');
      s.date.y = 1480; s.player.gold = 10000;
      const log = [], keep = { say: UI.say, ask: UI.ask, confirm: UI.confirm, toast: UI.toast, rng: G.U.rng };
      UI.say = async t => { log.push('say:' + t); };
      UI.toast = t => { log.push('toast:' + t); };
      UI.ask = async (t, ch) => { log.push('ask:' + ch.map(c => c.label).join('|')); return 'sneak'; };
      UI.confirm = async (h) => { log.push('confirm:' + (/성공할 가망/.test(h) ? 'table' : h)); return true; };
      const out = {};
      try {
        G.U.rng = () => 0.01; out.win = await C.handleEntry(alex); out.flag = s.flags.sneaking; out.log1 = log.splice(0);
        const seq = [0.99, 0.01, 0.99]; let k = 0; G.U.rng = () => seq[Math.min(k++, seq.length - 1)];   // 실패 · 터번 압수 · 못 달아남
        out.lose = await C.handleEntry(alex); out.log2 = log.splice(0); out.gold = s.player.gold; out.turban = G.R.hasItem('turban');
        out.failRec = (s.flags.sneakFail || {})[alex.id] === s.day;
      } finally { Object.assign(UI, { say: keep.say, ask: keep.ask, confirm: keep.confirm, toast: keep.toast }); G.U.rng = keep.rng; }
      return out;
    });
    console.log('    흐름1:', flow.log1.join(' ▸ ').slice(0, 400));
    console.log('    흐름2:', flow.log2.join(' ▸ ').slice(0, 400));
    ok(flow.win === true && flow.flag === 78, '터번 잠입 성공 → 들어감');
    ok(flow.log1.some(x => /^ask:.*잠입한다 \(가망 \d+% · 터번\)/.test(x)) && flow.log1.includes('confirm:table'), '「잠입한다 (가망 n% · 터번)」, 고르면 까닭 표');
    ok(flow.log1.some(x => /^ask:.*교섭한다/.test(x)) && flow.log1.some(x => /^ask:.*공격한다/.test(x)), '교섭·공격 선택지도 있음 (성지가 아니므로)');
    ok(flow.lose === false && flow.gold === 5000 && !flow.turban && flow.failRec, '들킴 → 벌금 절반 · 터번 압수 · 경계 기록');

    // ---- 그림으로 확인
    await page.evaluate(() => { const UI = G.UI, s = G.Game.state; s.player.items = s.player.items.filter(it => it.id !== 'turban'); G.R.addItem('turban'); const c = G.CITY_DATA.find(c => c.name === '카이로'); UI.confirm(G.Sneak.html(c, G.Sneak.chance(c, 'islam')), '잠입한다', '그만둔다', '잠입 — ' + c.name); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: process.env.SHOT || '/tmp/sneak_confirm.png' });
    const items = await page.evaluate(() => ({ m: G.ITEM.mingrobe && G.ITEM.mingrobe.reg.join(','), t: G.ITEM.turban.reg.join(','), img: G.IMAGE_FILES['items/mingrobe'] }));
    ok(items.m === '6,8' && items.img, '명나라 옷: 조선·동남아 시장, 그림 연결');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
