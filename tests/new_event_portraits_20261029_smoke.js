/* 새 사건 인물 33명의 실제 그림 읽기·전용 화자 선택·얼굴상과 무릎상 표시 검사. */
'use strict';
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/new-event-portraits-20261029');
const assets = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/new_event_portraits_20261029_prompts.json'), 'utf8')).assets;
function ok(v, message) { if (!v) throw new Error(message); }
(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Glory && G.Huguenot, null, { timeout: 90000 });
    const decoded = await page.evaluate(async assets => {
      const rows = [];
      for (const a of assets) {
        if (!G.HIST_FIG[a.id]) throw new Error('화자 자료 누락: ' + a.id);
        const faceKey = 'portraits/history/' + a.id, halfKey = faceKey + '_half', who = G.Hist.speaker(a.id);
        if (G.Img.pick(G.Art.portraitKeys(who.portrait)) !== faceKey || G.Img.pick(who.half) !== halfKey) throw new Error('전용 초상 선택 실패: ' + a.id);
        if (a.g === 'f' && G.HIST_FIG[a.id].g !== 'f') throw new Error('여성 화자 설정 오류: ' + a.id);
        for (const [key, size] of [[faceKey,[1024,1024]],[halfKey,[1024,1536]]]) {
          if (!G.Img.has(key)) throw new Error('등록 누락: ' + key);
          const im = await G.Img.load(key);
          if (!im || im.naturalWidth !== size[0] || im.naturalHeight !== size[1]) throw new Error('읽기·해상도 오류: ' + key);
          if (!G.PORTRAIT_FACES[key]) throw new Error('눈·입 기준점 누락: ' + key);
          if (key === halfKey) {
            const canvas = document.createElement('canvas'); canvas.width=1024; canvas.height=1536;
            const c = canvas.getContext('2d'); c.drawImage(im,0,0);
            for (const [x,y] of [[0,0],[1023,0],[0,1535],[1023,1535]]) if (c.getImageData(x,y,1,1).data[3] !== 0) throw new Error('투명 모서리 오류: ' + key);
          }
          rows.push({key,size});
        }
      }
      return rows;
    }, assets);
    ok(decoded.length === 66, '초상 66개 누락');
    await page.evaluate(async () => {
      await G.Game.ensureGeo(); const sk={}; G.SKILLS.forEach(x=>sk[x.id]=1);
      const s = G.Game.state = G.State.newGame({name:'인물화 검수',nation:'PT',job:'adventurer',age:30,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>3),diff:'normal'});
      s.settings.res=.35; s.settings.autosave=false; s.flags.prologue=true; G.UI.fade=async fn=>fn(); G.Game.go('city',{cityId:0});
    });
    await page.waitForFunction(()=>G.Game.sceneName==='city');
    await page.waitForTimeout(2200);
    await page.waitForFunction(()=>!document.querySelector('.toast'),null,{timeout:12000});
    const cases=['glory_mary2','lu_katharina','wp_abbess','glory_william3','lu_cardinal','roist','wp_pauw','hg_messenger'];
    for (const id of cases) {
      for (const mode of ['half','face']) {
        await page.evaluate(({id,mode})=>{
          window.portraitDone=false;
          const who=G.Hist.speaker(id); if(mode==='face') who.noStand=true;
          window.portraitTalk=G.UI.say('표정과 머릿결, 의상과 자세를 확인합니다.',who).then(()=>window.portraitDone=true);
        },{id,mode});
        await page.waitForSelector(mode==='face'?'.dlg .pframe':'.dlg-actor.tall',{state:'attached',timeout:30000});
        await page.waitForTimeout(850);
        await page.screenshot({path:path.join(OUT,id+'-'+mode+'-in-game.png')});
        for(let n=0;n<8&&!await page.evaluate(()=>window.portraitDone);n++){await page.keyboard.press('Space');await page.waitForTimeout(80);}
        await page.evaluate(()=>window.portraitTalk);
      }
    }
    ok(!errors.length, errors.join('\n'));
    fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify({decoded,cases,errors},null,2));
    console.log('통과 — 새 인물 33명·초상 66개 읽기/전용 연결/투명 여백/얼굴 기준점, 표시 16사례, 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
