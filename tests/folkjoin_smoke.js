/* 민족 발견물에서 나서는 동료 (js/systems/folkjoin.js) — node tests/folkjoin_smoke.js
   · 자료: 민족 발견물 50종(남극인 빼고)마다 남녀 이름 넷씩 · 얼굴(그 고장 양식, 남녀 모두 완성 초상 한 쌍) · 갈래 · 말
   · 확률 0이면 아무 일 없다 · 한 민족에 한 번만 굴린다
   · 실제 발견(D.find)에서 나서면 → 받아들이면 동료(그 민족 말 능숙 · 그 고장 얼굴) · 저장·불러오기 뒤에도 얼굴 그대로
   · 거절하면 명부에서 내린다 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' ' + String(e.stack).split('\n').slice(1, 4).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.route(/^https?:\/\//, r => r.fulfill({ status: 204, body: '' }));
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      const UI = G.UI, FJ = G.FolkJoin, out = {};
      UI.fade = async fn => { fn && fn(); };
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 3, d: 3 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.flags.prologue = true; s.date = { y: 1620, m: 6, d: 1 };
      G.Game.go('city', { cityId: 0 }); await sleep(500);
      // 창을 넘긴다: want = 고를 단추 글 (정규식)
      let want = null, seen = [];
      const pump = async (p, ms) => {
        const t0 = Date.now(); let done = false; p.then(() => { done = true; }, () => { done = true; });
        while (!done && Date.now() - t0 < (ms || 30000)) {
          const w = [...document.querySelectorAll('.modal-back')].pop();
          if (w) {
            seen.push(w.innerText.replace(/\s+/g, ' ').slice(0, 120));
            const asks = [...w.querySelectorAll('.askrow button, .askrow .btn')].filter(b => !b.classList.contains('disabled'));
            const b = (want && asks.find(x => want.test(x.textContent))) || asks[0] || w.querySelector('.foot button') || w.querySelector('.dlg');
            if (b) b.click();
          }
          await sleep(40);
        }
        return p;
      };
      for (let i = 0; i < 60 && UI.busy(); i++) { const w = [...document.querySelectorAll('.modal-back')].pop(); const b = w && (w.querySelector('.foot button') || w.querySelector('.dlg')); if (b) b.click(); await sleep(40); }
      // ① 자료
      const ppl = G.DISCOVERIES.filter(d => d.cat === 'people');
      out.nPeople = ppl.length; out.nData = Object.keys(G.FOLK_JOIN).length;
      out.noData = ppl.filter(d => !G.FOLK_JOIN[d.id]).map(d => d.id);
      out.badData = Object.keys(G.FOLK_JOIN).filter(id => { const P = G.FOLK_JOIN[id]; return !G.DISC[id] || P.m.length < 4 || P.f.length < 4 || !P.types.every(t => G.WANDER_TYPES[t]) || !P.lang.every(l => G.LANGS[l]); });
      out.noFace = []; Object.keys(G.FOLK_JOIN).forEach(id => ['m', 'f'].forEach(g => { if (!FJ.faces(G.FOLK_JOIN[id].style, g).length) out.noFace.push(id + ':' + g); }));
      out.who = ['khoikhoi', 'folk_zulu', 'vampire', 'aztec'].map(id => FJ.who(G.DISC[id]));
      // ② 확률 0 · 한 번만
      G.BALANCE.folkJoin.chance = 0;
      out.zero = await FJ.afterFind(G.DISC.folk_akan); out.zeroBusy = UI.busy();
      G.BALANCE.folkJoin.chance = 1;
      out.again = await FJ.afterFind(G.DISC.folk_akan);   // 이미 굴렸다
      // ③ 실제 발견 → 받아들인다
      const d = G.DISC.inuit, mates0 = s.mates.length;
      want = /함께 가자/; seen = [];
      await pump(G.Disc.find(d, 'land'), 60000);
      const m = s.mates.slice(mates0).map(x => G.MATE[x.id]).find(x => x && x.folk === 'inuit');
      out.joined = !!m; out.sawOffer = seen.some(t => /이누이트 사람/.test(t) && /동료로 맞을까/.test(t));
      if (m) {
        out.mate = { name: m.name, g: m.g, type: m.type, lg: m.lg, face: m.face, fame: m.fame, wage: m.wage, desc: m.desc };
        out.nameOk = (m.g === 'f' ? G.FOLK_JOIN.inuit.f : G.FOLK_JOIN.inuit.m).includes(m.name);
        const sp = G.Scenes.mateSpec(m.id); out.portrait = JSON.stringify(sp && (sp.img || sp.keys || sp.chain || sp)).slice(0, 200);
        out.half = G.Img.pick(G.Img.chain.mateHalf(m.id));
        // ④ 저장 → 불러오기
        const json = G.State.serialize(); G.Game.state = G.State.deserialize(json); G.Wander.apply();
        const m2 = G.MATE[m.id]; out.afterLoad = m2 ? m2.face : null; out.inMates = G.Game.state.mates.some(x => x.id === m.id);
        G.Game.state = s; G.Wander.apply();
      }
      // ⑤ 거절
      const n0 = G.MATES.length; want = /고향에 남으라고/; seen = [];
      await pump(FJ.afterFind(G.DISC.folk_maori), 30000);
      out.refused = G.MATES.length === n0 && !s.mates.some(x => (G.MATE[x.id] || {}).folk === 'folk_maori');
      out.refuseLog = (s.log || []).slice(-3).map(x => x.t || x.text || '').join(' / ');
      out.rolled = Object.keys(s.folkJoin.rolled);
      // ⑥ 여러 민족으로 지어 본다 (얼굴·말)
      out.samples = ['folk_zulu', 'aztec', 'folk_tuva', 'vampire', 'folk_sami', 'folk_hawaii'].map(id => { const x = FJ.make(G.DISC[id], 'f'), y = FJ.make(G.DISC[id], 'm'); return id + ' ' + x.name + '/' + y.name + ' ' + x.face + ' ' + y.face + ' lg' + Object.keys(x.lg).join(','); });
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.noData.length === 1 && r.noData[0] === 'antpeople' && r.nData === r.nPeople - 1, '민족 발견물 ' + r.nPeople + '종 가운데 남극인만 빼고 자료가 있다');
    ok(!r.badData.length, '이름(남녀 넷씩)·갈래·말이 모두 맞다 ' + r.badData.join(','));
    ok(!r.noFace.length, '모든 민족의 남녀 얼굴(그 고장 양식 완성 초상) ' + r.noFace.join(','));
    ok(r.who.join('|') === '코이코이 사람|줄루 사람|트란실바니아 사람|아즈텍 사람', '부르는 말: ' + r.who.join(' · '));
    ok(r.zero === false && !r.zeroBusy && r.again === false, '확률 0이면 아무 일 없고, 한 민족에 한 번만 굴린다');
    ok(r.joined && r.sawOffer, '실제 발견(이누이트 사람들)에서 나서고 → 받아들이면 동료가 된다');
    ok(r.nameOk && r.mate.lg && r.mate.lg[15] === 3 && r.mate.fame === 0 && /^portraits\/npc-roles\/na\//.test(r.mate.face), '이름은 그 민족 이름 · 북미토착어 능숙 · 명성 0 · 얼굴은 북아메리카 양식 (' + r.mate.name + ', ' + r.mate.face + ')');
    ok(/npc-roles\/na\//.test(r.half || ''), '무릎상도 같은 얼굴 짝 (' + r.half + ')');
    ok(r.afterLoad === r.mate.face && r.inMates, '저장·불러오기 뒤에도 그 얼굴·동료 그대로');
    ok(r.refused && /고향에 남으라고/.test(r.refuseLog), '거절하면 명부에서 내리고 일지에 남긴다');
    ok(r.rolled.indexOf('inuit') >= 0 && r.rolled.indexOf('folk_maori') >= 0, '굴린 민족을 기억한다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
