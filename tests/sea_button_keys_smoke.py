"""바다 하단 단추 단축키 (2026-11-22 베타 피드백 「해상에서 자주 쓰는 상륙은 단축키가 있으면」) — python tests/sea_button_keys_smoke.py (BROWSER_EXE=크롬 경로)
   · 해도 M · 상륙 L · 낚시 F · 탐색 S · 비 대책 R — 단추 귀퉁이 표와 풍선 도움말
   · 한글 입력 상태(key 'ㅣ'·'ㅡ', code KeyL·KeyM)에서도 먹는다 · 다른 창이 떠 있으면 무시
   · 설정에서 키를 바꾸면 표·도움말이 따라 바뀌고, 빼면 표가 사라진다 · 옛 저장에서 겹치는 기본 키는 「없음」
   · 영어·중국어·일본어 도움말 · 해전 P(일시정지)도 한글 상태에서 · 페이지 오류 0 · 화면: /tmp/sea_button_keys"""
import asyncio, json, os, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path('/tmp/sea_button_keys'); OUT.mkdir(parents=True, exist_ok=True)

def ok(v, msg):
    if not v: raise AssertionError(msg)
    print('  ✓', msg)

IME = """([key, code]) => { const ev = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true }); document.body.dispatchEvent(ev);
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true })); }"""

LAND = """() => { const m = [...document.querySelectorAll('.modal-back')].map(m => m.textContent).join(' '); const t = window.__toasts.join(' ');
  return /상륙해서 탐험|해안에서 너무/.test(m + ' ' + t) ? (m + t).slice(0, 60) : ''; }"""
CLOSE = """() => { const b = [...document.querySelectorAll('.modal-back button, .modal-back .choice')].find(x => /그만둔다/.test(x.textContent)); if (b) b.click(); window.__toasts.length = 0; }"""

async def settle(page):
    # 바다의 하루 사건 창이 뜨면 첫 단추로 닫고, 바다가 한가해질 때까지 기다린다
    for _ in range(40):
        free = await page.evaluate("""() => { if (!G.UI.busy() && !G.Scenes.sea.runtime().busy) return true;
          const b = document.querySelector('.modal-back .choice, .modal-back button'); if (b) b.click(); return false; }""")
        if free: return
        if await page.evaluate("() => !!document.querySelector('.modal-back') && !document.querySelector('.modal-back .choice, .modal-back button')"):
            await page.keyboard.press('Enter')
        await page.wait_for_timeout(700)
    info = await page.evaluate("() => [...document.querySelectorAll('.modal-back')].map(m => m.textContent.slice(0, 200) + ' || ' + [...m.querySelectorAll('button,.choice')].map(b => b.className + ':' + b.textContent.trim()).join(' / '))")
    await page.screenshot(path=str(OUT / 'stuck.png'))
    raise AssertionError('바다가 한가해지지 않는다 ' + str(info))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('BROWSER_EXE') or None, args=['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'])
        page = await b.new_page(viewport={'width': 1280, 'height': 720})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto((ROOT / 'index.html').as_uri())
        await page.wait_for_function("() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending", timeout=180000)
        await page.evaluate("""async () => {
          try { localStorage.clear(); } catch (e) {}
          await G.Game.ensureGeo();
          const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 1; });
          const s = G.Game.state = G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: G.LANGS.map(() => 1), diff: 'normal' });
          s.settings.res = 0.35; G.State.save = () => {};
          window.__toasts = []; G.UI.toast = (t) => { window.__toasts.push(String(t)); };
          G.Game.go('sea', { depart: 0 });
          await new Promise(r => setTimeout(r, 3000));
          document.querySelectorAll('.modal-back').forEach(e => e.remove());
          G.Scenes.sea.runtime().paused = true;
        }""")
        await page.wait_for_timeout(800)
        hints = await page.evaluate("() => [...document.querySelectorAll('.sailbar .btn')].filter(b => b.querySelector('.hk')).map(b => [b.textContent.replace(/\\s+/g,''), b.title])")
        print(json.dumps(hints, ensure_ascii=False))
        labels = {h[0] for h in hints}
        for want in ['해도M', '상륙L', '낚시F', '탐색S', '비대책R']:
            ok(want in labels, '단추 귀퉁이 표: ' + want)
        ok(any(h[1] == '상륙 — 단축키 L' for h in hints), '상륙 풍선 도움말에 단축키')
        ok(any('— 단축키 S' in h[1] for h in hints), '탐색 풍선 도움말에 단축키')
        await page.screenshot(path=str(OUT / 'sea_bar_ko.png'))

        # 한글 입력 상태: L → key 'ㅣ' code KeyL
        await page.evaluate("() => { window.__toasts.length = 0; }")
        await settle(page)
        await page.evaluate(IME, ['ㅣ', 'KeyL'])
        await page.wait_for_function(LAND, timeout=10000)
        t = await page.evaluate(LAND)
        ok(t, '한글 상태 ㅣ(L) → 상륙 시도 (' + str(t) + ')')
        await page.evaluate(CLOSE); await page.wait_for_timeout(1500)

        # 한글 상태 ㅡ(M) → 해도
        await settle(page)
        await page.evaluate(IME, ['ㅡ', 'KeyM'])
        await page.wait_for_function("() => !!document.querySelector('.modal-back')", timeout=10000)
        opened = await page.evaluate("() => !!document.querySelector('.modal-back')")
        ok(opened, '한글 상태 ㅡ(M) → 해도 창이 열린다')
        await page.screenshot(path=str(OUT / 'chart_by_key.png'))
        await page.keyboard.press('Escape'); await page.wait_for_timeout(600)
        await settle(page)

        # 다른 창이 떠 있으면 단축키는 무시
        await page.evaluate("() => { window.__al = G.UI.alert('시험 알림'); window.__toasts.length = 0; }")
        await page.wait_for_timeout(2500)
        await page.evaluate(IME, ['ㅣ', 'KeyL'])
        await page.wait_for_timeout(2500)
        ok(not any('상륙' in x or '해안' in x for x in await page.evaluate("() => window.__toasts.concat([...document.querySelectorAll('.modal-back')].map(m => m.textContent))")), '알림 창이 떠 있으면 L이 먹지 않는다')
        await page.evaluate("() => { const b = document.querySelector('.modal-back button, .modal-back .choice'); if (b) b.click(); }")
        await settle(page)
        await page.wait_for_timeout(1500)

        # 키 바꾸기: 상륙 → K
        await page.evaluate("() => G.Keys.bind(G.Game.state.settings, 'seaLand', 'KeyK')")
        await page.wait_for_timeout(2500)
        lab = await page.evaluate("() => { const b = [...document.querySelectorAll('.sailbar .btn')].find(b => /상륙/.test(b.textContent)); return [b.querySelector('.hk') && b.querySelector('.hk').textContent, b.title]; }")
        ok(lab == ['K', '상륙 — 단축키 K'], '상륙 키를 K로 바꾸면 표와 도움말이 따라 바뀐다 ' + str(lab))
        await page.evaluate("() => { window.__toasts.length = 0; }")
        await page.evaluate(IME, ['ㅣ', 'KeyL'])
        await page.wait_for_timeout(2500)
        ok(not await page.evaluate(LAND), '바꾼 뒤 L은 상륙이 아니다')
        await settle(page)
        await page.keyboard.press('KeyK'); await page.wait_for_function(LAND, timeout=10000)
        ok(await page.evaluate(LAND), '바꾼 K로 상륙 시도')
        await page.evaluate(CLOSE); await page.wait_for_timeout(1500)

        # 빼기
        await page.evaluate("() => G.Keys.clear(G.Game.state.settings, 'seaLand')")
        await page.wait_for_timeout(2500)
        lab = await page.evaluate("() => { const b = [...document.querySelectorAll('.sailbar .btn')].find(b => /상륙/.test(b.textContent)); return [!!b.querySelector('.hk'), b.title, b.classList.contains('has-hk')]; }")
        ok(lab == [False, '상륙', False], '「빼기」하면 표가 사라진다 ' + str(lab))
        await page.evaluate("() => G.Keys.reset(G.Game.state.settings)")

        # 설정 화면의 키보드 칸
        rows = await page.evaluate("() => G.Keys.actions.filter(a => /^(chart|sea)/.test(a.id)).map(a => a.id + '=' + G.Keys.label(a.id))")
        ok(rows == ['chart=M', 'seaLand=L', 'seaFish=F', 'seaSearch=S', 'seaRain=R'], '키 설정 목록 ' + str(rows))

        # 옛 저장: 이미 S를 다른 동작(아래)에 쓰고 있으면 탐색은 「없음」
        old = await page.evaluate("""() => { const st = { keys: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', notebook: 'KeyN' } }; G.Keys.ensure(st); return [st.keys.seaSearch, st.keys.seaLand, st.keys.down]; }""")
        ok(old == ['', 'KeyL', 'KeyS'], '옛 저장에서 겹치는 기본 키는 없음으로 ' + str(old))

        # 다른 언어 풍선 도움말
        for lang, want in [('en', 'Land — Shortcut L'), ('zh-Hans', '登陆 — 快捷键 L'), ('ja', None)]:
            await page.evaluate("(l) => G.I18N.set(l)", lang)
            await page.wait_for_timeout(2000)
            tl = await page.evaluate("() => { const b = [...document.querySelectorAll('.sailbar .btn')].find(b => b.querySelector('.hk') && b.querySelector('.hk').textContent === 'L'); return b && b.title; }")
            print('   ', lang, tl)
            if want: ok(tl == want, lang + ' 도움말 ' + str(tl))
            else: ok(tl and '단축키' not in tl and '상륙' not in tl, lang + ' 도움말에 한국어가 남지 않는다')
            await page.screenshot(path=str(OUT / ('sea_bar_' + lang + '.png')))
        await page.evaluate("() => G.I18N.set('ko')")
        await page.wait_for_timeout(2000)
        tl = await page.evaluate("() => { const b = [...document.querySelectorAll('.sailbar .btn')].find(b => b.querySelector('.hk') && b.querySelector('.hk').textContent === 'L'); return b && b.title; }")
        ok(tl == '상륙 — 단축키 L', '한국어로 돌아오면 도움말도 한국어 ' + str(tl))

        # 해전: 한글 상태 ㅔ(P) → 일시정지
        await page.evaluate("async () => { G.Game.go('battle', { npc: { kind: 'pirate', n: 2, zone: 'med' } }); await new Promise(r => setTimeout(r, 1500)); document.querySelectorAll('.modal-back').forEach(e => e.remove()); }")
        await page.wait_for_timeout(800)
        before = await page.evaluate("() => [...document.querySelectorAll('.sailbar .btn')].map(b => b.textContent.trim()).join('|')")
        await page.evaluate(IME, ['ㅔ', 'KeyP'])
        await page.wait_for_timeout(2500)
        after = await page.evaluate("() => [...document.querySelectorAll('.sailbar .btn')].map(b => b.textContent.trim()).join('|')")
        print('    battle', before[:80], '->', after[:80])
        ok(before != after, '해전에서 한글 상태 ㅔ(P) → 일시정지 단추가 바뀐다')

        ok(not errors, '페이지 오류 없음 ' + str(errors[:3]))
        await b.close()

asyncio.run(main())
