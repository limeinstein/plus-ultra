/* 궁정: 명성의 네 갈래, 국왕의 부름(명성 10,000마다), 왕명 열 가지, 작위(제 나라 7칸·다른 나라 명예 작위), 공손한 인사.
   대화창은 시험에서 대신 답한다(UI.say·ask·choose·confirm·alert를 바꿔 끼움).
   node tests/court_smoke.js   (BROWSER_EXE=크롬 경로) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, UI = G.UI, CT = G.Court, F = G.Fame;
      function fresh(nation) {
        const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 2; });
        G.Game.state = G.State.newGame({ name: '시험 제독', nation, job: 'explorer', age: 22, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 70 }, sk, lg: G.LANGS.map(() => 3), diff: 'normal' });
        return G.Game.state;
      }
      // 대화창 대신 답하기
      const said = []; let want = null, askPick = null;
      UI.say = async (t) => { said.push(String(t)); };
      UI.alert = async (t) => { said.push(String(t)); };
      UI.toast = () => {};
      UI.confirm = async () => true;
      UI.choose = async (title, opts) => { const o = opts.filter(x => x.value && x.value.kind === want)[0]; return o ? o.value : null; };
      UI.ask = async (text, opts) => { const v = askPick ? askPick(text, opts) : opts[0].value; return v; };
      G.Game.refreshHud = () => {};
      G.State.save = () => {};

      // ---- 명성의 네 갈래
      let s = fresh('PT');
      F.add('ex', 300); F.add('tr', 200); F.add('bt', 100); F.add('so', 50);
      out.sum = s.player.fame; out.by = JSON.stringify(s.player.fameBy);
      s.player.fame += 40; F.sync(); out.drift = s.player.fameBy.ex;          // 다른 코드가 바로 더한 몫은 탐험으로
      F.add('bt', -150); out.lose = s.player.fame + ':' + s.player.fameBy.bt;  // 전투에서 100, 나머지 50은 고르게
      const old = fresh('PT'); delete old.player.fameBy; old.player.fame = 5000; old.stats.found = 10; old.stats.wins = 5; F.sync();
      out.oldSum = Object.values(old.player.fameBy).reduce((a, b) => a + b, 0);

      // ---- 부름
      s = fresh('PT');
      const king = G.SPONSOR.pt_king;
      out.before = CT.pending(king);
      F.add('ex', 10500);
      out.pending = CT.pending(king);
      const news = CT.daily(); out.news = news.length && news[0].text; out.news2 = CT.daily().length;
      const offers = CT.offers(king);
      out.offers = offers.map(o => o.kind + ':' + o.cat).join(',');
      out.cats = ['ex', 'tr', 'bt', 'so'].every(c => offers.some(o => o.cat === c));

      // ---- 왕명 열 가지를 하나씩: 받기 → 해내기 → 아뢰기 → 작위
      const kinds = ['tribute', 'supply', 'pirates', 'capture', 'rescue', 'letter', 'envoy', 'geo', 'treasure', 'zoo'];
      out.kinds = {};
      const realm = CT.realmOf(king);
      for (const kind of kinds) {
        s = fresh('PT'); F.add('ex', 10500 + 10000 * 3); s.court = { titles: { PT: 3 } };   // 자작에서 백작으로
        s.player.gold = 500000;
        // 그 종류가 나올 때까지 제안을 새로 굴린다
        let o = null;
        for (let i = 0; i < 60 && !o; i++) { s.court.offers = {}; s.seed = 1000 + i; o = CT.offers(king).filter(x => x.kind === kind)[0]; }
        if (!o) { out.kinds[kind] = 'no-offer'; continue; }
        want = kind; askPick = null;
        await CT.audience(king);
        const t = CT.task();
        if (kind === 'tribute') { out.kinds[kind] = s.court.titles.PT === 4 && s.player.gold === 500000 - o.amount ? 'ok' : 'bad'; continue; }
        if (!t || t.kind !== kind) { out.kinds[kind] = 'not-accepted'; continue; }
        const p0 = CT.progress(t).done;
        if (kind === 'supply') s.fleet.cargo[t.good] = { q: t.qty + 3, cost: 10 };
        if (kind === 'pirates') CT.afterBattle({ kind: 'pirate' }, 'win', Array.from({ length: t.n }, () => ({ side: 'en', sunk: true })), []);
        if (kind === 'capture') {
          out.lawful = CT.lawful({ kind: 'merchant', nation: t.nation });
          CT.afterBattle({ kind: 'merchant', nation: '없는 나라' }, 'win', [{ side: 'en', captured: true }], []);
          out.captureOther = t.got;
          CT.afterBattle({ kind: 'navy', nation: t.nation }, 'win', Array.from({ length: t.n }, () => ({ side: 'en', captured: true })), []);
        }
        if (kind === 'rescue') {
          const den = G.CITY_DATA[t.den], dk = den.dock || [den.lat, den.lon];
          s.loc = { mode: 'sea', lon: dk[1], lat: dk[0], heading: 0 };
          let npc = null; for (let i = 0; i < 30 && !npc; i++) { t.cd = 0; npc = CT.spawn([]); }
          out.rescueNpc = npc ? npc.kind + ':' + npc.n + ':' + npc.ships.length + ':' + npc.hostile : null;
          CT.afterBattle(npc, 'win', [{ side: 'en', sunk: true }], []);
        }
        if (kind === 'letter') { const to = G.SPONSOR[t.to]; out.letterItems = CT.palaceItems(to).map(x => x.label).join(','); await CT.mission(to); }
        if (kind === 'envoy') { const to = G.SPONSOR[t.to]; askPick = (text, opts) => opts[0].value; for (let i = 0; i < 20 && !t.stage; i++) { t.retry = 0; await CT.mission(to); } out.envoyGrade = t.grade; }
        if (kind === 'geo' || kind === 'treasure') {
          const ds = G.DISCOVERIES.filter(d => t.cats.includes(d.cat)).slice(0, t.n);
          ds.forEach(d => { s.disc[d.id] = { me: true, found: U_dn(s.date) }; });
        }
        if (kind === 'zoo') G.DISCOVERIES.filter(d => d.cat === 'creature' && d.how !== 'city').slice(0, t.n).forEach(d => { s.disc[d.id] = { me: true, found: 14800601 }; });
        function U_dn(d) { return d.y * 10000 + d.m * 100 + d.d; }
        const p1 = CT.progress(t).done, fame0 = s.player.fame, by0 = s.player.fameBy[t.cat];
        await CT.audience(king);
        const got = s.court.titles.PT === 4 && !CT.task() && s.player.fame > fame0 && s.player.fameBy[t.cat] > by0;
        out.kinds[kind] = !p0 && p1 && got ? 'ok' : 'bad p0=' + p0 + ' p1=' + p1 + ' got=' + got;
        if (kind === 'supply') out.supplyLeft = s.fleet.cargo[t.good] && s.fleet.cargo[t.good].q;
        if (kind === 'zoo') out.zoo = JSON.stringify(s.court.zoo) + Object.keys(s.court.zooUsed).length;
      }

      // ---- 사다리 끝까지: 피달구 → 공작
      s = fresh('PT'); s.player.gold = 5000000; want = 'tribute';
      const ladder = [];
      for (let i = 0; i < 9; i++) { F.add('ex', 10000); await CT.audience(king); const tt = CT.title(realm); ladder.push(tt ? tt.ko + '(' + tt.native + ')' : '-'); }
      out.ladder = ladder.join(' → '); out.top = CT.pending(king);
      out.hudTitle = CT.best().ko;

      // ---- 다른 나라: 신성로마제국의 명예 작위, 에스파냐 사다리
      const emp = G.SPONSOR.de_emperor, hre = CT.realmOf(emp);
      out.hrePending = CT.pending(emp);
      const hl = []; for (let i = 0; i < 4; i++) { await CT.audience(emp); const tt = CT.title(hre); hl.push(tt ? tt.ko : '-'); }
      out.hre = hl.join(' → ');
      out.titles = CT.titles().map(t => CT.fullName(t, true)).join(' / ');
      // 공손한 인사: 리스본(제 나라)·이스탄불(이슬람)·비엔나(제국)·한양(유교 — 그대로)
      out.adr = [0, 112, 54, 190].map(id => G.CITY_DATA[id].name + '=' + CT.address(G.CITY_DATA[id])).join(' | ');
      // 특허장: 사략허가장(오스만 제국)·면세증 — 포르투갈 공작(값 절반)
      {
        const T = G.Scenes.city.B.trade, lis = G.CITY_DATA[0], chooseOld = UI.choose, g0 = s.player.gold;
        const good = lis.goods[0], imp = Object.keys(G.GOOD).filter(id => !G.R.sells(lis, id))[0];
        const b0 = T.buyP(lis, good), s0 = T.sellP(lis, imp), n0 = { kind: 'merchant', nation: '오스만 제국' };
        out.lawful0 = CT.lawful(n0);
        let step = 0; UI.choose = async (title, opts) => { step++; if (step === 1) return opts[0].value; if (step === 2) return opts.filter(o => o.value.nation === '오스만 제국')[0].value; if (step === 3) return opts[1].value; return null; };
        await CT.charters(king); UI.choose = chooseOld;
        out.paid = g0 - s.player.gold; out.lawful1 = CT.lawful(n0); out.lawfulOther = CT.lawful({ kind: 'merchant', nation: '베네치아' }); out.lawfulPirate = CT.lawful({ kind: 'pirate', nation: '오스만 제국' });
        const g1 = s.player.gold, bt0 = s.player.fameBy.bt, lines = [];
        CT.afterBattle({ kind: 'navy', nation: '오스만 제국' }, 'win', [{ side: 'en', sunk: true }, { side: 'en', captured: true }, { side: 'en' }], lines);
        out.bounty = (s.player.gold - g1) + ':' + (s.player.fameBy.bt - bt0) + ':' + /사략 포상금/.test(lines.join(''));
        out.duty = CT.duty(lis) + ':' + CT.duty(G.CITY_DATA[112]) + ':' + (T.buyP(lis, good) <= Math.round(b0 * 0.92) + 1 && T.buyP(lis, good) < b0) + ':' + (T.sellP(lis, imp) > s0);
        out.papers = CT.papersHtml().replace(/<[^>]+>/g, '|');
        const d0 = s.date; s.date = { y: d0.y + 3, m: d0.m, d: d0.d }; const exp = CT.daily().filter(m => /기한이 끝났다/.test(m.text)).length;
        out.expired = exp + ':' + CT.lawful(n0) + ':' + CT.duty(lis); s.date = d0;
        // 작위가 없으면 받지 못한다
        const keep = s.court.titles; s.court.titles = {}; const gg = s.player.gold; await CT.charters(king); out.noTitle = gg === s.player.gold && CT.palaceItems(king).filter(i => i.label === '특허장')[0].dim; s.court.titles = keep;
      }
      // 귀족의 권한 — 값 깎기: 리스본(제 나라 공작 ×1.5)·이스탄불(공작)·한양(없음), 교역소 성공률에 그대로 얹힌다
      const hg = id => CT.haggle(G.CITY_DATA[id]); out.hag = [0, 112, 190].map(id => { const h = hg(id); return h ? Math.round(h.p * 100) + '/' + Math.round(h.disc * 1000) / 10 : '-'; }).join(' ');
      { const T = G.Scenes.city.B.trade, keep = s.court.titles; const withT = T.haggleOdds(G.CITY_DATA[112]); s.court.titles = {}; const noT = T.haggleOdds(G.CITY_DATA[112]); s.court.titles = keep; out.hagOdds = Math.round((withT.disc - noT.disc) * 1000) / 10 + ':' + !!withT.noble + ':' + !!noT.noble; }
      out.hail = CT.hail(G.CITY_DATA[0], 'tavern', ['어서 오게!']); out.hailPlain = CT.hail(G.CITY_DATA[190], 'tavern', ['어서 오게!']);
      out.taskHtml = CT.taskHtml().length; out.titlesHtml = CT.titlesHtml().length; out.fameHtml = F.html().length;
      // 뒤를 이은 자녀도 작위를 물려받는다 (작위는 s.court에 있다)
      const es = fresh('ES'); G.Fame.add('ex', 20000); es.player.gold = 900000; want = 'tribute';
      const esKing = G.SPONSOR.es_crown; await CT.audience(esKing); await CT.audience(esKing);
      out.es = CT.titles().map(t => CT.fullName(t, true)).join(' / ');
      // 내려놓기
      const q = fresh('PT'); F.add('ex', 10500); want = 'pirates';
      for (let i = 0; i < 60; i++) { q.court && (q.court.offers = {}); q.seed = 500 + i; if (CT.offers(king).some(x => x.kind === 'pirates')) break; }
      await CT.audience(king); const had = !!CT.task(); askPick = (text, opts) => 'quit'; await CT.audience(king);
      out.quit = had && !CT.task() && !CT.pending(king) && q.player.fame < 10500;
      // 기한 넘김
      const lt = fresh('PT'); F.add('ex', 10500); want = 'pirates'; askPick = null;
      for (let i = 0; i < 60; i++) { lt.court && (lt.court.offers = {}); lt.seed = 700 + i; if (CT.offers(king).some(x => x.kind === 'pirates')) break; }
      await CT.audience(king); lt.date = { y: 1483, m: 1, d: 1 }; const ln = CT.daily();
      out.late = !CT.task() && ln.some(m => /기한이 지났다/.test(m.text));
      out.said = said.length;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.sum === 650 && r.drift === 340, '네 갈래의 합 = 통합 명성 (' + r.by + '), 바로 더한 몫은 탐험으로');
    ok(r.lose === '540:0', '감점은 그 갈래부터, 모자라면 고르게 (' + r.lose + ')');
    ok(r.oldSum === 5000, '옛 저장: 기록으로 어림해 나눈 합이 그대로');
    ok(!r.before && r.pending && /부르신다/.test(r.news) && r.news2 === 0, '명성 10,000에서 국왕이 한 번 부른다');
    ok(r.cats, '왕명은 탐험·교역·전투·사교에서 하나씩 (' + r.offers + ')');
    Object.keys(r.kinds).forEach(k => ok(r.kinds[k] === 'ok', '왕명 「' + k + '」 받기 → 해내기 → 작위 (' + r.kinds[k] + ')'));
    ok(r.lawful && r.captureOther === 0, '나포: 그 나라 배만 세고, 악명은 오르지 않는다');
    ok(/^pirate:\d:\d:true$/.test(r.rescueNpc || ''), '구출: 소굴 앞바다에 해적단이 나타난다 (' + r.rescueNpc + ')');
    ok(/피달구\(Fidalgo\) → 영주\(Senhor\) → 남작\(Barão\) → 자작\(Visconde\) → 백작\(Conde\) → 후작\(Marquês\) → 공작\(Duque\) → 공작/.test(r.ladder) && !r.top, '포르투갈 사다리: ' + r.ladder);
    ok(r.hrePending && /제국 기사 → 제국 남작 → 제국 백작 → 제국 백작/.test(r.hre), '신성로마제국 명예 작위: ' + r.hre);
    ok(/리스본=공작 각하/.test(r.adr) && /이스탄불=공작 각하/.test(r.adr) && /비엔나=백작 각하/.test(r.adr) && /한양=$/.test(r.adr), '부르는 말: ' + r.adr);
    ok(r.paid === 11700 && !r.lawful0 && r.lawful1 && !r.lawfulOther && !r.lawfulPirate, '특허장: 공작은 35% 싸게(3,900 + 7,800닢), 사략허가장은 정한 나라의 배만 (' + r.paid + ')');
    ok(r.bounty === '1000:20:true', '사략 포상금: 꺾은 배 2척 → 1,000닢·전투 명성 +20 (' + r.bounty + ')');
    ok(r.duty === '0.08:0:true:true', '면세증: 그 나라 항구에서만 사는 값 −8%·들여온 물건 파는 값 +8% (' + r.duty + ')');
    ok(r.expired === '2:false:0' && r.noTitle, '기한이 끝나면 알리고 사라진다 · 작위가 없으면 받지 못한다 (' + r.papers + ')');
    ok(r.hag === '42/5.3 28/3.5 -' && r.hagOdds === '3.5:true:false', '귀족의 권한 — 값 깎기: 리스본 +42%·+5.3%p, 이스탄불 +28%·+3.5%p, 한양 없음 (' + r.hag + ' · ' + r.hagOdds + ')');
    ok(/공작 각하/.test(r.hail) && r.hailPlain === '어서 오게!', '유럽·이슬람은 공손하게, 그 밖은 예전대로');
    ok(/이달고 \(Hidalgo\)/.test(r.es) || /영주 \(Señor\)/.test(r.es), '에스파냐 사다리: ' + r.es);
    ok(r.quit && r.late, '왕명을 내려놓거나 기한을 넘기면 신뢰·명성이 깎이고 한동안 부르지 않는다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
