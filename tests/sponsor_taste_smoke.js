/* 리스본·세비야 후원자의 관심사 (js/data/people.js · js/data/interests.js)
   · 모두 관심사가 둘 이상 · 왕은 모두 보물·지리 · 두 도시 후원자 10명의 첫 관심사는 서로 다르다(두 왕만 보물)
   · 두 왕 말고는 어느 두 사람도 관심사가 둘 이상 겹치지 않는다
   · 관심사 목록(전설·미신·종교·예술)의 이름이 모두 실제 발견물이다 · 관심사마다 들어맞는 발견물이 넉넉하다
   · 관심사에 맞는 발견물은 선금·사례가 후하고, 관심사 밖이라 시큰둥해도 웅변으로 설득해 계약할 수 있다 · 콘솔 오류 0
   node tests/sponsor_taste_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.SPONSORS && G.DISCOVERIES && G.tasteHit && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(() => {
      const sp = G.SPONSORS.filter(s => (s.city === 0 || s.city === 7) && !s.tale);
      const tale = G.SPONSORS.filter(s => s.tale && s.city === 0);
      const pairs = [];
      sp.forEach((a, i) => sp.slice(i + 1).forEach(b => { const n = a.taste.filter(t => b.taste.indexOf(t) >= 0).length; if (n >= 2 && !(a.type === 'king' && b.type === 'king')) pairs.push(a.id + '+' + b.id); }));
      const taleClash = [].concat(...tale.map(t => sp.filter(s => s.city === 0 && s.taste.filter(x => t.taste.indexOf(x) >= 0).length >= 2).map(s => s.id)));
      const firsts = sp.filter(s => s.type !== 'king').map(s => s.taste[0]);
      const kings = G.SPONSORS.filter(s => s.type === 'king'), kingBad = kings.filter(k => k.taste.indexOf('treasure') < 0 || k.taste.indexOf('geo') < 0).map(k => k.id);
      const few = sp.filter(s => s.taste.length < 2).map(s => s.id);
      const all = [].concat(...sp.map(s => s.taste));
      const missing = [].concat(...Object.keys(G.INTEREST_IDS).map(k => G.INTEREST_IDS[k].filter(id => !G.DISC[id]).map(id => k + ':' + id)));
      const counts = {};
      sp.forEach(s => { counts[s.id] = G.DISCOVERIES.filter(d => G.tasteHit(s.taste, d)).length; });
      const names = sp.map(s => s.title + '=' + s.taste.map(G.tasteName).join('·'));
      return { n: sp.length, taleClash, pairs, firsts, firstU: new Set(firsts).size, kingN: kings.length, kingBad, few, all, missing, counts, names };
    });
    console.log(r.names.join(' / '));
    ok(r.n === 10 && !r.few.length, '리스본·세비야 후원자 ' + r.n + '명 모두 관심사가 둘 이상 ' + r.few.join(','));
    ok(!r.kingBad.length, '왕 ' + r.kingN + '명 모두 보물·지리에 관심이 있다 ' + r.kingBad.join(','));
    ok(r.firstU === r.firsts.length, '왕 말고 8명의 첫 관심사가 서로 다르다: ' + r.firsts.join('·'));
    ok(!r.pairs.length, '두 왕 말고는 관심사가 둘 이상 겹치는 두 사람이 없다 ' + r.pairs.join(','));
    ok(!r.taleClash.length, '이야기 모드의 카사노바 남작도 리스본 후원자와 둘 이상 겹치지 않는다 ' + r.taleClash.join(','));
    ok(!r.missing.length, '전설·미신·종교·예술 목록의 이름이 모두 실제 발견물 ' + r.missing.join(','));
    ok(Object.values(r.counts).every(n => n >= 50), '후원자마다 취향에 맞는 발견물이 50곳 넘게 ' + JSON.stringify(r.counts));

    // 게임 안: 궁전 인사말·계약 목록의 취향·별표, 취향 보너스
    const g = await page.evaluate(() => {
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'ES', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
      const arch = G.SPONSOR.es_arch, kaaba = G.DISC.kaaba, troy = G.DISC.troy, med = G.SPONSOR.es_medinaceli;
      return { archLikes: G.tasteHit(arch.taste, kaaba), archNot: G.tasteHit(arch.taste, troy), mythAtl: G.tasteHit(med.taste, G.DISC.atlantis), mythKraken: G.tasteHit(med.taste, G.DISC.mermaid),
        name: G.tasteName('faith') + '·' + G.tasteName('myth') + '·' + G.tasteName('art') + '·' + G.tasteName('ruin') };
    });
    ok(g.archLikes && !g.archNot, '세비야 대주교는 카바 신전(종교)을 좋아하고 트로이(유적)는 취향이 아니다');
    ok(g.mythAtl && g.mythKraken, '메디나셀리 공작(전설·미신)은 아틀란티스와 인어를 좋아한다');
    ok(g.name === '종교·전설·미신·예술·유적', '관심사 이름: ' + g.name);
    // 관심사에 맞으면 후하게 · 관심사 밖이면 웅변으로 설득
    const v = await page.evaluate(async () => {
      const s = G.Game.state, arch = G.SPONSOR.es_arch, kaaba = G.DISC.kaaba;
      const o1 = G.Sponsor.offerFor(arch, kaaba), keep = arch.taste; arch.taste = ['geo']; const o2 = G.Sponsor.offerFor(arch, kaaba); arch.taste = keep;
      s.player.sk.speech = 0; const p0 = G.Sponsor.persuadeChance(arch, 1.5);
      s.player.sk.speech = 3; const p3 = G.Sponsor.persuadeChance(arch, 1.5);
      // 대주교에게 관심사 밖(유적) 「트로이」를 내밀고 웅변으로 설득 → 계약 (화면 대화는 흉내)
      const troy = G.DISC.troy; s.hints = {}; s.hints.troy = { src: 'test' }; s.player.fame = 20000; s.contract = null;
      const UI = G.UI, U = G.U, keepUI = { say: UI.say, ask: UI.ask, choose: UI.choose, alert: UI.alert, confirm: UI.confirm, toast: UI.toast }, keepU = { rf: U.rf, chance: U.chance };
      const said = [], asks = [];
      UI.say = async (t) => { said.push(String(t)); }; UI.alert = async () => {}; UI.toast = () => {}; UI.confirm = async () => true;
      UI.choose = async (title, items) => { const i = items.findIndex(x => /트로이/.test(x.label)); return i >= 0 ? items[i].value : null; };
      UI.ask = async (title, opts) => { asks.push(title + ' :: ' + opts.map(o => o.label + (o.dis ? '(X)' : '')).join(' / ')); const f = v => opts.find(o => o.value === v && !o.dis); return (f('go') || f('ok') || opts[opts.length - 1]).value; };
      U.rf = (a, b) => a; U.chance = () => true;
      try { await G.Sponsor.propose(arch); } finally { Object.assign(UI, keepUI); Object.assign(U, keepU); }
      return { r1: o1.reward, r2: o2.reward, a1: o1.advance, a2: o2.advance, liked: o1.liked, p0, p3, contract: s.contract && s.contract.disc, asks, said: said.filter(t => /설득|일리|말솜씨|관심사/.test(t)) };
    });
    console.log(JSON.stringify(v).slice(0, 900));
    ok(v.liked && v.r1 > v.r2 * 1.2 && v.a1 > v.a2, '관심사에 맞으면 사례를 후하게: 성공 보수 ' + v.r2 + ' → ' + v.r1 + ', 선금 ' + v.a2 + ' → ' + v.a1);
    ok(v.p0 === 0 && v.p3 > 0.5, '웅변이 없으면 설득할 수 없고(0%), 웅변 3이면 ' + Math.round(v.p3 * 100) + '%');
    ok(v.contract === 'troy' && v.asks.some(t => /관심사/.test(t) && /웅변으로 설득한다/.test(t)), '관심사 밖 「트로이」도 웅변으로 설득해 대주교와 계약을 맺었다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
