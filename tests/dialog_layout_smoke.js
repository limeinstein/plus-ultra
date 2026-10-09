/* 대화 구도 한 가지로 (tests/dialog_layout_smoke.js) — node tests/dialog_layout_smoke.js   (BROWSER_EXE=크롬 경로)
   도서관·술집을 뺀 모든 곳에서: 말하는 사람은 제독(왼쪽)과 마주 선다. 혼자 가운데 서는 구도·대화창 안 얼굴 칸은 없다.
   제독 혼잣말은 방금 마주 선 사람과 함께(없으면 제독만 왼쪽). 사람이 없는 말(내레이션)·noStand 장면은 예전 대화창.
   무릎상과 얼굴을 섞지 않는다 — 한 사람이라도 무릎상이 없으면 둘 다 얼굴. 얼굴은 테두리·배경 없이 투명 배경 그림만.
   바다·뭍(탐험)에서는 무릎상 대신 두 사람 얼굴(흉상)만 — 특별한 사건(가족·연인·부하끼리 썸·왕녀)만 무릎상.
   도서관·술집은 예전 구도 그대로. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'dialog_layout');
require('fs').mkdirSync(OUT, { recursive: true });
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const s = G.Game.state = G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'adventurer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal' });
      s.player.portrait = G.Art.portraitSpec({ seed: 'player0PT', culture: 'med', g: 'm', age: 'young', cloth: '#1e3552', beard: 0 });
      s.settings.res = 0.35; G.UI.fade = async fn => { fn(); };
      // 건물에 들어설 때 뜨는 인사말 등을 모두 닫는다 (늦게 뜨는 것까지 기다린다)
      window.clearAll = async () => {
        for (let i = 0, calm = 0; i < 40 && calm < 8; i++) {
          const m = [...document.querySelectorAll('#ui .modal-back')].pop();
          if (m) { calm = 0; const b = m.querySelector('.askrow button:not(.disabled)'); (b || m.querySelector('.dlg') || m).click(); } else if (G.Game.sceneName !== 'city' || document.querySelector('#ui .cmdmenu')) calm++;
          await new Promise(r2 => setTimeout(r2, 300));
        }
      };
      // 한 마디를 띄우고 구도를 읽은 뒤 닫는다
      window.probe = async (text, who, keepOpen) => {
        const p = G.UI.say(text, who);
        await new Promise(r => setTimeout(r, 350));
        const m = [...document.querySelectorAll('#ui .modal-back')].pop();
        const st = m && m.querySelector('.dlg-stage');
        const sides = [...document.querySelectorAll('.dlg-actor')].map(a => ['left', 'right', 'center'].find(k => a.classList.contains(k)) + (a.classList.contains('active') ? '*' : '')).join(',');
        const tall = document.querySelectorAll('.dlg-actor.tall').length, bust = document.querySelectorAll('.dlg-actor.bust').length;
        const rigSafe = [...document.querySelectorAll('.dlg-actor.tall .portrait-rig')].every(root => {
          const base = root.querySelector('.rig-base'), pieces = [...root.querySelectorAll('.rig-piece')];
          if (!base || pieces.length !== 3) return false;
          const baseVisible = Number(getComputedStyle(base).opacity) > .5;
          const pieceVisible = pieces.map(e => Number(getComputedStyle(e).opacity) > .5);
          return root.classList.contains('rig-ready')
            ? !baseVisible && pieceVisible.every(Boolean)
            : baseVisible && pieceVisible.every(v => !v);
        });
        const r = { kind: st ? (st.classList.contains('duo') ? 'duo' : 'solo') : m && m.querySelector('.dlg .pframe') ? 'face' : m ? 'box' : 'none', sides, tall, bust, rigSafe };
        if (!keepOpen) { (m.querySelector('.dlg') || m).click(); await p; }
        return r;
      };
    });
    const ev = (f, a) => page.evaluate(f, a);
    const fmt = x => x.kind + '[' + x.sides + ']';
    // ---- 도시: 거리(건물 밖) · 성문 위병 · 교역소(창이 열린 채) · 여관에서 부하와 이야기
    await ev(async () => { G.Game.go('city', { cityId: 0 }); await new Promise(r => setTimeout(r, 1500)); document.querySelectorAll('#ui .modal-back').forEach(e => e.remove()); });
    let r = await ev(async () => {
      const C = G.Scenes.city, out = {};
      out.street = await probe('어서 오시오.', C.npc('herald', '왕실 전령'));
      out.mate = await probe('제독, 출항 준비가 끝났습니다.', G.Scenes.mateSpeaker('first'));
      out.me = await probe('…어떻게 할까?', G.Scenes.city.B.tavern.playerSpeaker());
      out.narr = await probe('바람이 분다.', {});
      return out;
    });
    ok(/^duo\[left,right\*\]$/.test(fmt(r.street)) && /^duo\[left,right\*\]$/.test(fmt(r.mate)), '도시 거리: 사람·부하 모두 제독(왼쪽)과 마주 선다 — ' + fmt(r.street) + ' ' + fmt(r.mate));
    ok(/^duo\[left\*,right\]$/.test(fmt(r.me)), '제독의 혼잣말: 방금 마주 선 사람과 함께, 제독이 왼쪽 — ' + fmt(r.me));
    ok(r.narr.kind === 'box', '사람이 없는 말은 예전 대화창 (' + r.narr.kind + ')');
    // 무릎상과 얼굴을 섞지 않는다
    r = await ev(async () => {
      const C = G.Scenes.city, out = {};
      out.both = await probe('제독, 출항 준비가 끝났습니다.', G.Scenes.mateSpeaker('first'));
      out.mixed = await probe('어서 오시오.', Object.assign({}, C.npc('herald', '왕실 전령'), { noHalf: true }));
      // 목록에는 있지만 파일을 읽지 못하는 무릎상
      G.IMAGE_FILES['portraits/mates/zz_시험_없는그림_half'] = 'portraits/mates/zz_시험_없는그림_half.webp'; G.Img.reset();
      const pr = G.UI.say('제독!', Object.assign({}, G.Scenes.mateSpeaker('first'), { half: ['portraits/mates/zz_시험_없는그림_half'] }));
      out.brokenFirst = document.querySelectorAll('.dlg-actor.tall').length;
      await new Promise(r2 => setTimeout(r2, 2500));
      out.broken = { tall: document.querySelectorAll('.dlg-actor.tall').length, bust: document.querySelectorAll('.dlg-actor.bust').length, names: document.querySelectorAll('.actor-name').length };
      const m = [...document.querySelectorAll('#ui .modal-back')].pop(); (m.querySelector('.dlg') || m).click(); await pr;
      return out;
    });
    ok(r.both.tall === 2 && r.both.bust === 0, '두 사람 다 무릎상이 있으면 둘 다 무릎상 (' + r.both.tall + ')');
    ok(r.both.rigSafe, '무릎상은 완성본 한 장 또는 준비된 3개 레이어만 보여 부분 절단이 없다');
    ok(r.mixed.tall === 0 && r.mixed.bust === 2, '한 사람이라도 무릎상이 없으면 둘 다 얼굴 — 무릎상 ' + r.mixed.tall + ' · 얼굴 ' + r.mixed.bust);
    // 얼굴(흉상)은 테두리·배경 없이 투명 배경 그림만
    const look = await ev(async () => {
      const C = G.Scenes.city, pr = G.UI.say('어서 오시오.', Object.assign({}, C.npc('herald', '왕실 전령'), { noHalf: true }));
      await new Promise(r2 => setTimeout(r2, 350));
      const art = document.querySelector('.dlg-actor.bust .actor-art'), cs = art && getComputedStyle(art);
      const out = cs ? { border: cs.borderTopWidth, bg: cs.backgroundColor, shadow: cs.boxShadow } : null;
      const m = [...document.querySelectorAll('#ui .modal-back')].pop(); (m.querySelector('.dlg') || m).click(); await pr;
      return out;
    });
    ok(look && look.border === '0px' && /rgba\(0, 0, 0, 0\)|transparent/.test(look.bg) && look.shadow === 'none', '얼굴(흉상)에 테두리·배경이 없다 ' + JSON.stringify(look));
    ok(r.brokenFirst === 2 && r.broken.tall === 0 && r.broken.bust === 2 && r.broken.names === 2, '무릎상 파일을 못 읽으면 두 사람 다 얼굴로 다시 선다 — ' + JSON.stringify(r.broken));
    await page.screenshot({ path: OUT + '/01_city.png' });
    r = await ev(async () => {
      const C = G.Scenes.city, out = {};
      C.visit('trade'); await new Promise(r2 => setTimeout(r2, 1500));
      await clearAll();
      // 구입 창을 연 채로 주인이 말한다
      const w = G.UI.window({ title: '구입', html: '<div style="height:300px"></div>', buttons: [{ label: '닫기', value: 1 }] });
      out.window = await probe('가난한 사람에게는 볼일 없네!', C.npc('trader', '교역소 주인'));
      w.close(1);
      out.inn = (C.visit('inn'), await new Promise(r2 => setTimeout(r2, 1500)), null);
      await clearAll();
      out.innkeep = await probe('방은 2층이오.', C.npc('innkeeper', '여관 주인'));
      out.innKind = C.current() && C.current().kind;
      return out;
    });
    ok(/^duo\[left,right\*\]$/.test(fmt(r.window)), '창(교역소 표)이 열려 있어도 마주 선다 — ' + fmt(r.window));
    ok(r.innKind === 'inn' && /^duo\[left,right\*\]$/.test(fmt(r.innkeep)), '여관: 여관 주인과 마주 선다 (예전에는 혼자 가운데) — ' + fmt(r.innkeep));
    // ---- 도서관·술집: 예전 구도 그대로
    r = await ev(async () => {
      const C = G.Scenes.city, out = {}, back = async () => { const ex = document.querySelector('.cmd.exit'); if (ex) ex.click(); await new Promise(r2 => setTimeout(r2, 800)); };
      const clear = clearAll;
      await back(); C.visit('library'); await new Promise(r2 => setTimeout(r2, 1500)); await clear();
      out.libKeep = G.UI.keepScene();
      const w = G.UI.window({ title: '서가', html: '<div style="height:300px"></div>', buttons: [{ label: '닫기', value: 1 }] });
      out.libBook = await probe('…그때는 몰랐던 대목이 이제는 눈에 들어온다.', C.B.tavern.playerSpeaker());
      w.close(1);
      await back(); C.visit('tavern'); await new Promise(r2 => setTimeout(r2, 1500)); await clear();
      out.tavKeep = G.UI.keepScene();
      out.tavMaid = await probe('어서 오세요!', C.B.tavern.duo({ name: '여급', portrait: C.npc('tavernkeeper', '술집 주인').portrait }));
      return out;
    });
    ok(r.libKeep && r.tavKeep && r.libBook.kind === 'face', '도서관(책 보기)·술집은 예전 구도 그대로 — 서가를 연 채 제독의 혼잣말은 대화창 안 얼굴 (' + r.libBook.kind + '), 술집 여급 ' + fmt(r.tavMaid));
    // ---- 바다: 부하 · 제독 혼잣말(방금 마주 선 사람 없음) · 바다의 낯선 사람
    r = await ev(async () => {
      const out = {};
      G.Game.go('sea', { depart: 0 }); await new Promise(r2 => setTimeout(r2, 1500));
      G.Game.scene.update = function () {};   // 바다 사건이 끼어들지 않게 멈춘다
      await clearAll();
      out.mate = await probe('제독! 해적입니다!', G.Scenes.mateSpeaker('first'), true);
      return out;
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: OUT + '/02_sea.png' });
    r.me = await ev(async () => { const m = [...document.querySelectorAll('#ui .modal-back')].pop(); (m.querySelector('.dlg') || m).click(); await new Promise(r2 => setTimeout(r2, 200)); const now0 = Date.now; Date.now = () => now0() + 61000; /* 1분이 지난 셈 */ return probe('…돛을 거두자.', G.Scenes.city.B.tavern.playerSpeaker()); });
    ok(/^duo\[left,right\*\]$/.test(fmt(r.mate)) && /^duo\[left\*\]$/.test(fmt(r.me)), '바다: 부하와 마주 선다 (예전에는 얼굴 칸) · 마주 선 사람이 없으면 제독만 왼쪽 — ' + fmt(r.mate) + ' ' + fmt(r.me));
    ok(r.mate.tall === 0 && r.mate.bust === 2 && r.me.tall === 0, '바다의 보통 대화는 두 사람 얼굴(흉상)만 — 무릎상 ' + r.mate.tall + ' · 흉상 ' + r.mate.bust);
    // ---- 바다의 특별한 사건: 부하끼리 썸(special) · 가족(아이 이름) → 무릎상
    r = await ev(async () => {
      const out = {}, base = G.Scenes.mateSpeaker('first');
      out.romance = await probe('제독님… 저희 둘, 사귀기로 했습니다.', Object.assign({}, base, { special: true }));
      G.Game.state.player.kids = [{ name: '루이스', sex: 'm', born: { y: 1470, m: 1, d: 1 }, st: {} }];
      out.kid = await probe('아버지, 고래예요!', { name: '루이스 (10세 · 아주 가까움)', portrait: base.portrait, half: base.half });
      G.Game.state.player.kids = [];
      out.plain = await probe('물이 얼마 안 남았습니다.', Object.assign({}, base));
      return out;
    });
    ok(r.romance.tall >= 1 && r.kid.tall >= 1 && r.plain.tall === 0, '바다라도 특별한 사건(썸·가족)은 무릎상 — 썸 ' + r.romance.tall + ' · 아이 ' + r.kid.tall + ' · 보통 ' + r.plain.tall);
    // ---- 뭍(탐험)도 얼굴만
    r = await ev(async () => {
      const s = G.Game.state, loc0 = s.loc.mode; s.loc.mode = 'land';
      const out = { mate: await probe('제독, 이 길로 가면 강이 나옵니다.', G.Scenes.mateSpeaker('first')) };
      s.loc.mode = loc0; return out;
    });
    ok(r.mate.kind === 'duo' && r.mate.tall === 0 && r.mate.bust === 2, '뭍(탐험)도 두 사람 얼굴만 — ' + fmt(r.mate) + ' 흉상 ' + r.mate.bust);
    ok(errors.length === 0, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
    console.log('\n통과 — 화면: ' + OUT);
  } catch (e) { console.error('✗', e.message); if (errors.length) console.error('콘솔 오류: ' + errors.slice(0, 5).join(' | ')); process.exitCode = 1; }
  finally { await browser.close(); }
})();
