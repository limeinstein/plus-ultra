/* 귀족과 사절의 입국 · 조약 국기 · 변장 도구 불태우기 (js/systems/sneak.js · js/scenes/city.js C.handleEntry · js/systems/blackmarket.js)
   node tests/noble_entry_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, C = G.Scenes.city, CT = G.Court, city = n => G.CITY_DATA.find(c => c.name === n);
      s.date = { y: 1500, m: 3, d: 1 };
      CT.task();   // 궁정 상태를 만든다
      const said = [], asked = [];
      const U0 = { say: G.UI.say, toast: G.UI.toast, confirm: G.UI.confirm };
      G.UI.say = async (t) => { said.push(String(t)); };
      const toasts = []; G.UI.toast = (t) => { toasts.push(String(t)); };
      C.mateAsk = async (q, opts) => { asked.push(opts.map(o => o.label).join('|')); return asked.queue && asked.queue.length ? asked.queue.shift() : 'leave'; };
      const mate0 = C.mate; C.mate = async (t) => { said.push('부관: ' + t); };
      const out = {};
      const cairo = city('카이로'), mecca = city('메카'), ankara = city('앙카라'), sd = city('산토도밍고');
      const titles = () => (s.court || {}).titles || (CT._st ? CT._st().titles : null);
      const T = s.court.titles;
      // ① 작위 없음: 카이로는 이교도를 막는다
      out.noTitle = C.entryCheck(cairo) && C.entryCheck(cairo).reason;
      // ② 맘루크 작위: 카이로가 열린다 — 처음은 수비병이 의심하다 알아보는 말, 두 번째는 짧은 알림
      T.EG = 2;
      out.egCheck = C.entryCheck(cairo);
      said.length = 0; out.egIn = await C.handleEntry(cairo); out.egSay = said.slice();
      said.length = 0; toasts.length = 0; out.egIn2 = await C.handleEntry(cairo); out.egSay2 = said.length; out.egToast = toasts.slice();
      // 메카(성지)도 맘루크 작위로
      said.length = 0; out.meccaIn = await C.handleEntry(mecca); out.meccaSay = said.slice();
      // ③ 다른 나라의 작위는 소용없다: 맘루크 작위로 오스만의 앙카라 · 오스만 작위만 있으면 카이로
      said.length = 0; out.ankaraIn = await C.handleEntry(ankara); out.ankaraSay = said.slice();
      delete T.EG; T.OT = 1;
      said.length = 0; out.cairoOt = await C.handleEntry(cairo); out.cairoOtSay = said.slice();
      delete T.OT;
      // ④ 외교 사절: 맘루크 술탄에게 가는 특사 왕명이면 작위가 없어도 열린다 (전하고 나면 다시 막힌다)
      s.court.task = { kind: 'envoy', sp: 'pt_king', to: 'eg_sultan', stage: 0 };
      said.length = 0; out.envoyIn = await C.handleEntry(cairo); out.envoySay = said.slice();
      s.court.task.stage = 1; out.envoyDone = !!C.entryCheck(cairo);
      s.court.task = { kind: 'letter', sp: 'pt_king', to: 'es_crown', stage: 0 };
      // ⑤ 토르데시야스 조약: 포르투갈 제독은 에스파냐 항구(산토도밍고)에 못 들어간다 → 에스파냐로 가는 친서면 열린다
      out.sdLetter = C.entryCheck(sd);
      s.court.task = null;
      out.sdBlock = C.entryCheck(sd) && C.entryCheck(sd).reason;
      T.ES = 1; out.sdTitle = C.entryCheck(sd); said.length = 0; await C.handleEntry(sd); out.sdSay = said.slice(); delete T.ES;
      // ⑥ 암시장의 에스파냐 국기 (조약 뒤 · 포르투갈 제독) — 여러 장 산다
      const st = G.BlackMarket.stock(city('리스본'));
      out.bmFlag = st.items.filter(x => x.flag).map(x => x.id + ':' + x.left);
      s.date = { y: 1490, m: 1, d: 1 }; out.bmBefore = G.BlackMarket.flag(); s.date = { y: 1500, m: 3, d: 1 };
      G.R.addItem('flag_es'); G.R.addItem('flag_es');
      const ch = G.Sneak.chance(sd, 'treaty');
      out.flagPart = ch.dz + ' · ' + ch.parts.map(p => p[0] + ' ' + p[1]).join(' / ');
      out.flagHtml = /불태워집니다/.test(G.Sneak.html(sd, ch));
      // ⑦ 들키면 쓴 변장 도구 하나가 불탄다 — 남은 것으로 다음에 또
      const lost1 = G.Sneak.caught(sd, ch), lost2 = G.Sneak.caught(sd, G.Sneak.chance(sd, 'treaty')), ch3 = G.Sneak.chance(sd, 'treaty');
      out.burn = [lost1, lost2, ch3.dz, G.R.itemCount('flag_es')];
      G.R.addItem('turban'); G.R.addItem('turban'); G.R.addItem('turban');
      // 실제 성문 흐름: 잠입 → 들킴 (가망 0으로) → 불태움 말
      const SNc = G.Sneak.chance; G.Sneak.chance = function () { const r = SNc.apply(this, arguments); r.p = 0; return r; };
      G.UI.confirm = async () => true; asked.queue = ['sneak']; said.length = 0;
      const o0 = G.Outcome; G.Outcome = null;
      out.sneakFail = await C.handleEntry(cairo); out.sneakSay = said.filter(x => /불태워|남았습니다/.test(x)); out.turbanLeft = G.R.itemCount('turban');
      out.sneakOpt = asked.slice(-1)[0];
      G.Sneak.chance = SNc; G.Outcome = o0; Object.assign(G.UI, U0); C.mate = mate0;
      out.perk = CT.perkText();
      return out;
    });
    console.log(JSON.stringify(r, null, 1).slice(0, 4000));
    ok(r.noTitle === 'islam', '작위가 없으면 카이로는 이교도를 막는다');
    ok(!r.egCheck && r.egIn && r.egSay.length === 1 && /표지|인장/.test(r.egSay[0]) && /들어가시오/.test(r.egSay[0]), '맘루크 작위: 수비병이 의심하다가 작위의 표지를 알아보고 들인다');
    ok(r.egIn2 && r.egSay2 === 0 && r.egToast.length === 1, '두 번째부터는 짧게 알린다 (' + r.egToast[0] + ')');
    ok(r.meccaIn && /성도|성스러운/.test(r.meccaSay[0]), '성지 메카도 맘루크 작위로 — 경건히 머무르라는 말');
    ok(r.ankaraIn === false && r.ankaraSay.some(x => /남의 나라 술탄|아무 소용/.test(x)), '맘루크 작위로는 오스만 제국 앙카라에 못 들어간다 («' + (r.ankaraSay[0] || '').slice(-50) + '»)');
    ok(r.cairoOt === false && r.cairoOtSay.some(x => /오스만 제국의 작위라고/.test(x)), '오스만 작위만으로는 맘루크의 카이로에 못 들어간다');
    ok(r.envoyIn && /국서|사절/.test(r.envoySay[0]) && r.envoyDone, '맘루크 술탄에게 가는 특사면 문이 열리고 (사절의 대사), 전하고 나면 다시 막힌다');
    ok(r.sdLetter === null && r.sdBlock === 'treaty' && r.sdTitle === null && /조약은 상선/.test(r.sdSay[0] || ''), '조약 항구 산토도밍고: 에스파냐 궁정으로 가는 친서·에스파냐 작위면 열린다');
    ok(r.bmFlag.length === 1 && r.bmFlag[0] === 'flag_es:3' && r.bmBefore === null, '조약 뒤 암시장에서 에스파냐 국기를 판다 (기간마다 3장 · 조약 전엔 없다)');
    ok(/^flag_es/.test(r.flagPart) && /에스파냐 배 행세/.test(r.flagPart) && r.flagHtml, '에스파냐 국기를 달면 잠입 가망이 오른다 — ' + r.flagPart.split(' / ')[1]);
    ok(r.burn[0].name === '에스파냐 국기' && r.burn[0].left === 1 && r.burn[1].left === 0 && r.burn[2] === null && r.burn[3] === 0, '들키면 쓴 국기 하나가 불탄다 — 두 장이면 한 번 더 쓸 수 있다');
    ok(r.sneakFail === false && r.sneakSay.length === 2 && r.turbanLeft === 2 && /터번 ×3/.test(r.sneakOpt), '성문에서 들키면 「불태워 버려라」 — 터번 3개 → 2개, 부관이 남은 것을 알린다');
    ok(/잠입 없이/.test(r.perk) || r.perk === '', '수첩의 귀족 권한에 「잠입 없이 들어간다」');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error(errors.slice(0, 5).join(' | ')); process.exitCode = 1; } finally { await browser.close(); }
})();
