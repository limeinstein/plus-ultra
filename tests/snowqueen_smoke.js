/* 눈의 여왕 — node tests/snowqueen_smoke.js   (BROWSER_EXE=크롬 경로)
   · 북유럽 호숫가 야영 → 게르다(동생 카이를 찾는 소녀)가 탐험대에 합류 · 다른 곳 야영에서는 안 나온다 · 북방 술집 주인의 귀띔
   · 게르다를 데리고 모스크바에 들어서면 「눈의 여왕」 = 러시아 공주 엘리자베타 → 수수께끼(얼음 원반 ★3)
     못 풀면 retryDays 뒤 다시 · 풀면 진실 → 게르다·카이는 러시아에 남고(게르다 하선, 빨간 구두) → 엘리자베타가 몰래 배에 오름
   · 모스크바를 떠난 다음 날(뭍) 또는 다른 도시에서 엘리자베타가 나타나 합류: 신학2 과학3 측량3 회계3 웅변2 · 다섯 말 3 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'snowqueen');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.SnowQueen && G.SnowQueen.hooked, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const UI = G.UI, s = G.Game.state, R = G.R, SQ = G.SnowQueen, T = G.Tale, out = {}, said = [];
      const keep = { say: UI.say, ask: UI.ask, alert: UI.alert };
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); }; UI.alert = async (t) => { said.push(String(t)); };
      UI.ask = async (t, ch) => { said.push(String(t)); const l = ch.map(o => typeof o === 'string' ? o : o.value); return l[0]; };
      const ch0 = G.U.chance; G.U.chance = () => true;
      // 북방 술집의 귀띔
      await T.tavernHints(G.CITY_DATA[64]); out.hint = said.some(t => /맨발로 얼음|눈의 여왕/.test(t)); said.length = 0;
      // 다른 곳 야영: 안 나온다
      s.loc = { mode: 'land', lon: -3.7, lat: 40.4 };
      await T.onCamp('rest', -3.7, 40.4); out.nowhere = !s.mates.some(m => m.id === 'gerda');
      // 라도가 호숫가 야영 → 게르다
      s.loc = { mode: 'land', lon: 31.3, lat: 60.6 };
      out.lake = SQ.lakeAt(31.3, 60.6);
      await T.onCamp('rest', 31.3, 60.6);
      out.gerda = !!s.mates.find(m => m.id === 'gerda'); out.stage1 = SQ.state().stage;
      out.meetLines = said.filter(t => /게르다:/.test(t)).length; out.moscowLine = said.some(t => /모스크바/.test(t));
      // 모스크바: 수수께끼를 못 풀면
      const mos = G.CITY_DATA[60]; said.length = 0;
      const pz0 = G.Games.puzzle; G.Games.puzzle = async () => false;
      await SQ.moscow(mos);
      out.fail = { stage: SQ.state().stage, retry: SQ.state().retry - s.day, gerda: !!s.mates.find(m => m.id === 'gerda'), princess: said.some(t => /엘리자베타/.test(t)), doubt: said.some(t => /의심/.test(t)) };
      out.again = await SQ.moscow(mos);   // 아직 retry 전이면 아무 일 없음
      // 날이 지나 다시: 수수께끼를 푼다
      s.day += 31; said.length = 0; G.Games.puzzle = async () => true;
      await SQ.moscow(mos);
      out.win = { stage: SQ.state().stage, gerda: !!s.mates.find(m => m.id === 'gerda'), shoes: R.hasItem('redshoes'), truth: said.some(t => /공가|공주|공자/.test(t)), stay: said.some(t => /여기서 살게요/.test(t)), kai: said.some(t => /^카이:/.test(t)) };
      // 모스크바를 떠난 다음 날 뭍에서
      s.day += 1; s.loc = { mode: 'land', lon: 36, lat: 56 }; said.length = 0;
      await T.onLand(36, 56, { stop() {} });
      const em = s.mates.find(m => m.id === 'elizaveta');
      out.eliz = em ? { sk: ['theo', 'sci', 'survey', 'acct', 'speech'].map(k => R.mateSkill(em, k)), lg: [4, 2, 3, 0, 1].map(li => G.Cabins.mateLang(em, li)), wage: G.MATE.elizaveta.wage } : null;
      out.stage3 = SQ.state().stage; out.protect = said.some(t => /지켜 주겠소/.test(t));
      // 수수께끼 창 (진짜 미니게임): ★3 얼음 원반이 뜨는지
      G.Games.puzzle = pz0; G.U.chance = ch0; Object.assign(UI, keep);
      window.__pz = G.Games.puzzle({ id: 'snowqueen', name: '눈의 여왕의 얼음 원반', pw: 5, cat: 'treasure', how: 'land', pzTitle: '눈의 여왕의 수수께끼 — 얼음 원반', pzText: '얼음 탁자에 서리로 새겨진 글' }, 'hanoi', 3);
      return out;
    });
    console.log(JSON.stringify(r));
    await page.waitForTimeout(800);
    const pz = await page.evaluate(() => ({ disks: document.querySelectorAll('.hanoi .peg').length, title: (document.querySelector('.win .title') || {}).textContent || '' }));
    await page.screenshot({ path: path.join(OUT, 'puzzle.png') });
    ok(r.hint, '북방 술집 주인의 귀띔');
    ok(r.nowhere, '북유럽 호숫가가 아닌 곳의 야영에서는 나오지 않는다');
    ok(r.lake === '라도가 호' && r.gerda && r.stage1 === 'escort' && r.meetLines >= 3 && r.moscowLine, '라도가 호숫가 야영 → 게르다 합류, 모스크바로 (대사 ' + r.meetLines + '줄)');
    ok(r.fail.princess && r.fail.doubt && r.fail.gerda && r.fail.stage === 'escort' && r.fail.retry === 30, '「눈의 여왕」은 러시아 공주 엘리자베타 — 수수께끼를 못 풀면 게르다는 그대로, 30일 뒤 다시');
    ok(r.again === false, '그 전에는 다시 들어서도 아무 일 없음');
    ok(r.win.truth && r.win.stay && r.win.kai && !r.win.gerda && r.win.shoes && r.win.stage === 'stow', '풀면 진실 → 게르다·카이는 러시아에 남고 빨간 구두를 남긴다 → 몰래 탄 공주');
    ok(r.eliz && r.stage3 === 'done' && r.protect, '모스크바를 떠난 다음 날 엘리자베타가 나타나 합류 (「내가 아니면 누가 당신을 지켜 주겠소」)');
    ok(r.eliz && r.eliz.sk.join() === '2,3,3,3,2' && r.eliz.lg.every(v => v === 3) && r.eliz.wage === 165, '엘리자베타: 신학2 과학3 측량3 회계3 웅변2 · 슬라브·로망스·게르만·스페인·포르투갈 3 · 품삯 없음');
    ok(pz.disks === 3 && /눈의 여왕의 수수께끼 — 얼음 원반 ★★★/.test(pz.title), '수수께끼 창: 얼음 원반 ★3 (' + pz.title.trim() + ')');
    ok(errors.length === 0, '콘솔 오류 0' + (errors.length ? ': ' + errors.join(' | ') : ''));
    console.log('통과');
  } catch (e) { console.error('실패:', e.message, errors); await page.screenshot({ path: path.join(OUT, 'fail.png') }).catch(() => {}); process.exitCode = 1; } finally { await browser.close(); }
})();
