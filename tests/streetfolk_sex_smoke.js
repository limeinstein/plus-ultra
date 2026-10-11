/* 거리 사람: 걷는 그림과 대화창 무릎상의 성별이 같다 (js/data/streetfolk.js walkSex·faceFix · js/systems/streetfolk.js SF.faceFix)
   · 도시 양식마다 한 도시씩, 짐승을 뺀 모든 종류에 대해 SF.make → 대화창 무릎상(face.half)의 성별이 걷는 그림의 성별과 같다
     무릎상 성별: 그 종류의 얼굴 그림(portraits/street-folk)이면 artSex, 빌린 역할 그림(npc-roles)이면 G.Art.rolePortraitGender
   · 리스본 여관 주인: 걷는 그림은 여자 → 이름표 「여관 안주인」, 무릎상은 리스본 여관 안주인 역할 그림(npc-roles/ib/keeper)
   · 걷는 그림과 얼굴이 원래 맞는 경우는 그대로 그 종류의 얼굴 그림을 쓴다. 무릎상 그림 파일이 모두 있다. 콘솔 오류 0
   node tests/streetfolk_sex_smoke.js */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const SF = G.StreetFolk, D = G.STREET_FOLK, A = G.Art, out = { styles: {}, bad: [], fixed: [], kept: 0, missing: [] };
      const byStyle = {};
      G.CITY_DATA.forEach(c => { const st = G.Img.folkStyle(c); if (!byStyle[st]) byStyle[st] = c; });
      out.styleN = Object.keys(byStyle).length;
      Object.keys(byStyle).forEach(st => {
        const c = byStyle[st];
        Object.keys(D.types).filter(t => !D.types[t].animal).forEach(t => {
          const sprite = SF.spriteOf(t, c);
          if (!G.Img.has('portraits/street-folk/' + sprite + '_' + st)) return;
          const f = SF.make(t, c, 3000, 500, 600, 'sx:' + st + ':' + t);
          const ws = SF.walkSex(sprite, c), half = (f.face.half || [])[0] || '';
          let hs = null;
          const m = half.match(/^portraits\/npc-roles\/(\w+)\/(\w+)_half$/);
          if (m) { hs = A.rolePortraitGender(m[2], m[1]); out.fixed.push(st + ':' + t + '→' + m[2]); }
          else if (half === 'portraits/street-folk/' + sprite + '_' + st + '_half') { hs = SF.artSex(sprite, c); out.kept++; }
          if (!G.Img.has(half)) out.missing.push(st + ':' + t + ':' + half);
          if (hs !== ws || (f.face.portrait && f.face.portrait.g && f.face.portrait.g !== ws)) out.bad.push(st + ':' + t + ' 걷는 ' + ws + ' / 얼굴 ' + hs + ' ' + half);
          if (st === 'ib' && t === 'innkeeper') out.lisbon = { name: f.name, half, g: f.face.portrait && f.face.portrait.g, ws };
        });
      });
      return out;
    });
    console.log('   양식 ' + r.styleN + '곳 · 그대로 ' + r.kept + ' · 바꾼 얼굴 ' + r.fixed.length + ': ' + r.fixed.join(', '));
    ok(r.styleN >= 18, '도시 양식 ' + r.styleN + '곳을 살폈다');
    ok(!r.bad.length, '걷는 그림과 대화창 무릎상의 성별이 모두 같다 ' + r.bad.join(' | '));
    ok(!r.missing.length, '무릎상 그림 파일이 모두 있다 ' + r.missing.join(' | '));
    ok(r.lisbon && r.lisbon.ws === 'f' && r.lisbon.name === '여관 안주인' && r.lisbon.half === 'portraits/npc-roles/ib/keeper_half' && r.lisbon.g === 'f',
      '리스본 여관 주인: 걷는 그림 여자 → 「여관 안주인」, 무릎상 ' + (r.lisbon && r.lisbon.half));
    ok(r.kept > 150 && r.fixed.length > 30, '맞는 얼굴은 그대로(' + r.kept + '), 어긋난 얼굴만 바꿈(' + r.fixed.length + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
