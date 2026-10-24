/* 발견물마다의 부하 대사 (js/systems/discvoice.js · js/data/discfacts_1~8.js)
   · 모든 발견물(세계일주 빼고)에 특기별 관찰 3~4개, 하십시오체·해요체 끝맺음이 바르다
   · 말씨 바꾸기: 하오·하게체에 「니다」가, 반말에 「요」가 남지 않는다
   · 발견하는 순간: 특기가 맞는 부하들이 그 발견물만의 관찰을 저마다의 말씨로 (실제 발견 연출에서)
   · 보고 자리에서 거들 때: 그 쪽의 특기에 맞는 관찰 + 맺음말 (실제 보고 자리에서)
   node tests/discvoice_smoke.js */
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
    await page.waitForFunction(() => window.G && G.Game && G.DiscVoice && G.Pitch && G.Voice, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const DV = G.DiscVoice, V = G.Voice, s = G.Game.state, out = { bad: [] };
      const SK = ['hist', 'sci', 'survey', 'art', 'music', 'acct', 'cook', 'craft', 'theo', 'nav', 'ops', 'sword', 'gun', 'shoot', 'med', 'ship', 'speech'];
      const sents = t => t.split(/(?<=[.!?])\s+/).filter(Boolean);
      let facts = 0, skillCount = {};
      G.DISCOVERIES.forEach(d => {
        if (d.id === 'circum') return;
        const F = G.DISC_FACTS[d.id];
        if (!F) { out.bad.push('없음 ' + d.id); return; }
        if (F.length < 3 || F.length > 5) out.bad.push(d.id + ' 개수 ' + F.length);
        F.forEach(f => {
          facts++; skillCount[f[0]] = (skillCount[f[0]] || 0) + 1;
          if (SK.indexOf(f[0]) < 0) out.bad.push(d.id + ' 특기 ' + f[0]);
          ['hao', 'hage'].forEach(rg => sents(DV.conv([f[1], f[2]], rg)).forEach(x => { if (/니(다|까)[.!?]?$/.test(x)) out.bad.push(d.id + ' ' + rg + ' 남음: ' + x.slice(-10)); }));
          sents(DV.conv([f[1], f[2]], 'ban')).forEach(x => { if (/요[.!?]?$/.test(x)) out.bad.push(d.id + ' 반말 남음: ' + x.slice(-10)); });
        });
      });
      out.facts = facts; out.skills = Object.keys(skillCount).length;
      // 1) 같은 관찰을 다섯 말씨로
      const st = G.DISC_FACTS.stonehenge || G.DISC_FACTS[Object.keys(G.DISC_FACTS)[0]];
      out.regs = ['sp', 'hao', 'hage', 'yo', 'ban'].map(rg => DV.conv([st[0][1], st[0][2]], rg));
      // 2) 발견 연출: 그 발견물 관찰의 특기를 가진 부하 둘을 태운다 (말투가 다른 사람으로)
      const d = G.DISC.stonehenge || G.DISC[Object.keys(G.DISC_FACTS)[0]], F = G.DISC_FACTS[d.id];
      const pickMate = (sk, notReg) => G.MATES.find(m => (m.sk[sk] || 0) >= 2 && !m.minor && V.reg(m) !== notReg);
      const m1 = pickMate(F[0][0]), m2 = pickMate(F[1][0], m1 && V.reg(m1));
      s.mates = [m1, m2].filter(Boolean).map((m, i) => ({ id: m.id, role: i ? 'none' : 'first', loyal: 80 }));
      out.mateRegs = s.mates.map(m => V.reg(G.MATE[m.id]) + '/' + V.typeOf(G.MATE[m.id]));
      const said = [], oldSay = G.UI.say, oldTitle = G.FX.reveal.titleMs;
      G.FX.reveal.titleMs = 1; G.UI.say = async (t, who) => { said.push({ t: String(t), who: who && who.name }); };
      const p = G.Scenes.discoveryReveal(d, 10);
      while (!document.querySelector('#ui .reveal')) await new Promise(r2 => setTimeout(r2, 10));
      document.querySelector('#ui .reveal').click();
      await p;
      const body = f => (f[1].split(/(?<=[.!?])\s+/)[0] || '').slice(0, 10);
      out.reveal = said.map(x => x.who + ': ' + x.t);
      out.revealHits = F.filter(f => said.some(x => x.t.indexOf(body(f)) >= 0)).length;
      // 3) 보고 자리: 후원자 앞에서 거든다
      said.length = 0;
      const king = G.SPONSOR.pt_king, uc = G.U.chance; G.U.chance = () => true;
      const oldReplay = G.Scenes.discoveryReplay; G.Scenes.discoveryReplay = async () => false;
      s.settings = s.settings || {}; s.settings.pitch = true;
      const res = await G.Pitch.run({ d: d, sp: king, mode: 'contract' });
      G.U.chance = uc; G.Scenes.discoveryReplay = oldReplay; G.UI.say = oldSay; G.FX.reveal.titleMs = oldTitle;
      out.pitch = said.map(x => x.who + ': ' + x.t);
      out.pitchHits = F.filter(f => said.some(x => x.t.indexOf(body(f)) >= 0)).length;
      out.pitchSpeakers = res.speakers;
      return out;
    });
    console.log('    발견 연출: ' + r.reveal.slice(2).join('\n                ').slice(0, 600));
    console.log('    보고 자리: ' + r.pitch.join('\n                ').slice(0, 700));
    ok(!r.bad.length, '모든 발견물에 관찰 · 끝맺음·말씨 바꾸기 이상 없음' + (r.bad.length ? ' — ' + r.bad.length + '건: ' + r.bad.slice(0, 8).join(' / ') : ''));
    ok(r.facts >= 3000 && r.skills >= 14, '관찰 ' + r.facts + '개 · 특기 ' + r.skills + '가지');
    ok(new Set(r.regs).size === 5, '같은 관찰을 다섯 말씨로: ' + r.regs.map(x => x.slice(-14)).join(' | '));
    ok(r.revealHits >= 2 && r.mateRegs.length === 2, '발견하는 순간: 말씨가 다른 두 부하(' + r.mateRegs.join(', ') + ')가 그 발견물만의 관찰을 말함 (' + r.revealHits + ')');
    ok(r.pitchHits >= 1 && r.pitchSpeakers.length >= 1, '보고 자리에서 거들 때도 그 발견물의 관찰로 (' + r.pitchHits + ')');
    ok(!errors.length, '콘솔 오류 0' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  } finally { await browser.close(); }
})().catch(e => { console.error('실패: ' + e.message); process.exit(1); });
