/* 메디치 은행의 위기 통합 흐름 — 빚쟁이 셋 → 잉글랜드 국왕 → 피렌체 정산. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GAME = process.env.PAGE || pathToFileURL(path.join(ROOT, 'index.html')).href;
function ok(value, message) { if (!value) throw new Error(message); console.log('  ✓ ' + message); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !/fonts|ERR_|net::/.test(message.text())) errors.push(message.text()); });
    await page.route('https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/**', route => route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' }));
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Medici && G.Medici._t, null, { timeout: 120000 });
    const art = await page.evaluate(async () => {
      const names = ['lucrezia_medici', 'calds', 'sousa', 'launay', 'ashford'];
      const rows = [];
      for (const name of names) for (const suffix of ['', '_half']) {
        const key = 'portraits/medici/' + name + suffix;
        const url = G.Img.src(key);
        const size = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
          image.onerror = reject;
          image.src = url;
        });
        rows.push({ key, size });
      }
      return rows;
    });
    ok(art.length === 10 && art.every(row => row.size[0] === (row.key.endsWith('_half') ? 1024 : 448) && row.size[1] === (row.key.endsWith('_half') ? 1536 : 448)), '메디치 사건 인물 5명의 얼굴상·무릎상 10장을 원본 크기로 로드');
    const result = await page.evaluate(async () => {
      const s = G.State.newGame({ name: '메디치 시험', nation: 'PT', job: 'merchant', age: 30, birth: { m: 1, d: 1 }, st: { str: 70, int: 70, mar: 70, cha: 70 }, sk: {}, lg: [], diff: 'normal' });
      G.Game.state = s;
      s.date = { y: 1485, m: 1, d: 1 };
      s.player.gold = 10000;
      const said = [];
      G.UI.say = async text => { said.push(String(text)); };
      G.UI.ask = async (text, choices) => {
        const values = (choices || []).map(choice => choice.value);
        return values.includes('note') ? 'note' : values.includes(1) ? 1 : values[0];
      };
      G.UI.confirm = async () => true;
      G.UI.alert = async text => { said.push(String(text)); };
      G.UI.toast = () => {};
      G.Game.refreshHud = () => {};
      G.Games.duel = async () => 'win';
      G.Medici._t.start(14900101);
      for (const debtor of G.Medici.DEBTORS) await G.Medici._t.findDebtor(G.CITY_DATA[debtor.city]);
      const afterDebtors = { stage: s.medici.stage, got: Object.keys(s.medici.got).length, luc: s.medici.luc };
      await G.Medici._t.visitLuc();
      const king = G.SPONSOR[G.Medici.CFG.king];
      await G.Medici._t.demandKing(G.CITY_DATA[G.Medici.CFG.london], king);
      const afterKing = { stage: s.medici.stage, gold: s.player.gold, hint: s.medici.hint };
      const lorenzo = G.SPONSOR[G.Medici.CFG.sponsor];
      await G.Medici._t.deliver(G.CITY_DATA[G.Medici.CFG.florence], lorenzo);
      return {
        afterDebtors,
        afterKing,
        end: s.medici.end,
        rewardGold: s.player.gold,
        mates: s.mates.map(mate => mate.id),
        note: G.Medici.note(),
        said: said.join('\n')
      };
    });
    ok(result.afterDebtors.stage === 2 && result.afterDebtors.got === 3 && result.afterDebtors.luc === 3, '세 빚쟁이에게 환어음을 모두 받으면 잉글랜드 국왕 단계로 진행');
    ok(result.afterKing.stage === 3 && result.afterKing.gold === 210000 && result.afterKing.hint === 1, '국왕의 기사를 이기면 20만 두카트를 받아 피렌체 귀환 단계로 진행');
    ok(result.end === 'done' && result.rewardGold === 40000, '로렌초에게 20만 두카트를 전하고 사례 3만 두카트를 받음');
    ok(result.mates.includes('botticelli') && result.mates.includes('lucrezia_medici'), '보티체리와 루크레치아가 동료로 합류');
    ok(!result.note && /메디치 은행을 살렸다/.test(result.said), '완료 뒤 진행 메모를 닫고 결말을 표시');
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('통과');
  } catch (error) {
    console.error('실패:', error.stack || error.message);
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
