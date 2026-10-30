/* 성인 소꿉친구 32종: 실제 생성·계층별 솜씨·저장 복원·초상 표시 검사. */
'use strict';
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
let pw; try { pw = require('playwright'); } catch (_) { pw = require('../tools/procedural_art/node_modules/playwright-core'); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/childhood-friends-20261029');
const specs = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/childhood_friends_20261029_prompts.json'), 'utf8')).assets;
function ok(v, t) { if (!v) throw new Error(t); }
function verifySelectedLayout() {
  const crypto=require('crypto'), cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/childhood_friends_20261029_face_layout.json'),'utf8'));
  const report=JSON.parse(fs.readFileSync(path.join(OUT,'face-layout/report.json'),'utf8'));
  ok(Object.keys(cfg.crops).length===8,'표시된 여덟 명만 수정');
  let restored=0;
  for(const a of specs) {
    const face=fs.readFileSync(path.join(ROOT,'images/portraits/childhood-friends',a.id+'.webp'));
    const original=fs.readFileSync(path.join(OUT,'face-layout/before',a.id+'.webp'));
    const row=report.find(x=>x.id===a.id);
    if(cfg.crops[a.id]) {
      ok(!face.equals(original) && row.layout===cfg.version,'표시된 인물 수정 '+a.id);
      ok(row.face_box[3]<row.before_face_box[3],'과한 확대 줄이기 '+a.id);
    } else {
      ok(face.equals(original) && row.layout==='original','표시 없는 원래 얼굴상 복원 '+a.id); restored++;
    }
    const half=fs.readFileSync(path.join(ROOT,'images/portraits/childhood-friends',a.id+'_half.webp'));
    ok(crypto.createHash('sha256').update(half).digest('hex')===row.half_sha256,'무릎상 유지 '+a.id);
  }
  ok(restored===24,'24명 원래 파일 그대로 복원');
}
(async () => {
  verifySelectedLayout();
  const browser = await pw.chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.OldGuard, null, { timeout: 90000 });
    const result = await page.evaluate(async specs => {
      function check(v, t) { if (!v) throw new Error(t); }
      await G.Game.ensureGeo();
      const s = G.Game.state = G.State.newGame({ name:'소꿉친구 검수', nation:'PT', job:'explorer', age:40, birth:{m:1,d:1}, st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal' });
      s.settings.res=.35; s.settings.autosave=false; s.flags.prologue=true;
      const OG=G.OldGuard, U=G.U, looks=G.OLD_GUARD_FRIEND_LOOKS, classes=G.OLD_GUARD.friendClasses;
      check(looks.length===32 && new Set(looks.map(x=>x.id)).size===32,'초상 32종');
      Object.keys(classes).forEach(k=>check(looks.filter(x=>x.kind===k).length===8,'계층별 8종 '+k));
      const origPick=U.pick, origChance=U.chance, defs=[], decoded=[];
      try {
        U.chance=()=>true;
        for (const look of looks) {
          const nat=Object.keys(G.WANDER_NATIONS).find(n=>look.styles.includes(G.WANDER_NATIONS[n].style));
          check(nat,'출신권 '+look.id);
          U.pick=arr=>arr.some(x=>x && x.id===look.id)?look:origPick(arr);
          const d=OG.makeKin('friend',Object.assign({},s.player,{nation:nat}),{name:'새 제독'});
          check(d.friendLook===look.id && d.g==='f' && !d.wd && d.friendAdult,'성인 여성 초상 선택 '+look.id);
          check(classes[look.kind].types.includes(d.type) && d.typeName===classes[look.kind].tag,'계층별 솜씨 '+look.id);
          check(d.desc.includes('나무 칼') && d.friendClass===look.kind && d.friendOrigin===look.origin,'소꿉친구 설정 '+look.id);
          check(d.face===look.face && d.halfKey===look.halfKey,'같은 인물의 두 초상 '+look.id);
          s.oldGuard.defs[d.id]=d; defs.push(d);
        }
        U.pick=origPick; U.chance=()=>false;
        const male=OG.makeKin('friend',s.player,{name:'새 제독'}), uncle=OG.makeKin('uncle',s.player,{name:'새 제독'}), cousin=OG.makeKin('cousin',s.player,{name:'새 제독'});
        check(male.g==='m' && !male.friendLook && !uncle.friendLook && !cousin.friendLook,'남성·친족 기존 생성 유지');
        const immigrantLook=looks.find(x=>x.id==='cf_africa_sailor');
        U.chance=p=>p===0.4; U.pick=arr=>arr.some(x=>x && x.id===immigrantLook.id)?immigrantLook:origPick(arr);
        const immigrant=OG.makeKin('friend',Object.assign({},s.player,{nation:'PT'}),{name:'새 제독'});
        check(immigrant.friendLook===immigrantLook.id && immigrant.nat==='AF' && immigrant.home===s.player.home,'같은 항구의 이주민 소꿉친구');
      } finally { U.pick=origPick; U.chance=origChance; }
      // 저장 자료만 남겨 다시 등록한다. 외모를 뽑아 덮지 않아야 한다.
      const saved=JSON.parse(JSON.stringify(s)); G.Game.state=saved; G.Wander.apply();
      for (const d of defs) {
        const loaded=G.MATE[d.id];
        check(loaded && loaded.friendLook===d.friendLook && loaded.friendClass===d.friendClass,'불러오기 '+d.id);
        check(G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(d.id)))===d.face,'얼굴 연결 '+d.id);
        check(G.Img.pick(G.Img.chain.mateHalf(d.id))===d.halfKey,'무릎상 연결 '+d.id);
        check(G.Img.pick(G.Img.chain.halfFor(G.Art.portraitKeys(G.Art.mateSpec(d.id))))===d.halfKey,'보통 대화 무릎상 '+d.id);
      }
      // 같은 동적 ID가 든 다른 저장으로 바꾸어도 지난 게임의 얼굴을 쓰지 않는다.
      const first=defs[0], other=defs[1], originalMate=G.MATE[first.id];
      G.MATE[first.id]=Object.assign({},originalMate,{face:other.face,halfKey:other.halfKey});
      check(G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(first.id)))===other.face,'같은 ID의 다른 저장 얼굴');
      G.MATE[first.id]=originalMate;
      // 옛 저장의 소꿉친구 초상은 추가 필드가 없어도 그대로 쓴다.
      const legacy=JSON.parse(JSON.stringify(defs[0])); legacy.id='kin_legacy_friend';
      ['friendLook','friendClass','friendOrigin','friendAdult'].forEach(k=>delete legacy[k]);
      G.Game.state.oldGuard.defs[legacy.id]=legacy; OG.apply();
      check(G.MATE[legacy.id].face===legacy.face && !G.MATE[legacy.id].friendClass,'옛 저장 호환');
      const original={say:G.UI.say,alert:G.UI.alert,pick:OG.pick,make:OG.makeKin,vets:OG.veterans};
      const talks=[];
      try {
        G.UI.say=async text=>{talks.push(text);}; G.UI.alert=async()=>{}; OG.pick=async c=>c.filter(x=>x.kin); OG.veterans=()=>[];
        for (const kind of Object.keys(classes)) {
          const d=defs.find(x=>x.friendClass===kind); OG.makeKin=()=>d;
          const chance=U.chance; U.chance=()=>true;
          try { await OG.atSucceed(G.Game.state.player,{name:'새 제독',sex:'m'},false); } finally { U.chance=chance; }
          const row=G.Game.state.mates.find(x=>x.id===d.id);
          check(row && row.loyal===G.BALANCE.oldGuard.kinLoyal && !row.ev,'실제 합류 '+kind);
          check(classes[kind].lines.every(x=>talks.includes(x.slice(2))),'계층별 합류 대사 '+kind);
        }
      } finally { G.UI.say=original.say; G.UI.alert=original.alert; OG.pick=original.pick; OG.makeKin=original.make; OG.veterans=original.vets; }
      for (const a of specs) {
        const key='portraits/childhood-friends/'+a.id;
        for (const [k,size] of [[key,[1024,1024]],[key+'_half',[1024,1536]]]) {
          check(G.Img.has(k),'등록 '+k); const im=await G.Img.load(k);
          check(im && im.naturalWidth===size[0] && im.naturalHeight===size[1],'해상도 '+k);
          check(G.PORTRAIT_FACES[k],'얼굴 기준점 '+k);
          if(k.endsWith('_half')) {
            const c=document.createElement('canvas');c.width=1024;c.height=1536;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);
            for(const [x,y] of [[0,0],[1023,0],[0,1535],[1023,1535]])check(ctx.getImageData(x,y,1,1).data[3]===0,'투명 여백 '+k);
          }
          decoded.push(k);
        }
      }
      window.friendDefs=defs; G.UI.fade=async fn=>fn(); G.Game.go('city',{cityId:0});
      return {ids:defs.map(d=>d.id),looks:defs.map(d=>d.friendLook),decoded,talks};
    }, specs);
    ok(result.decoded.length===64,'초상 64장 누락');
    await page.waitForFunction(()=>G.Game.sceneName==='city');
    await page.waitForTimeout(2200); await page.waitForFunction(()=>!document.querySelector('.toast'),null,{timeout:12000});
    await page.mouse.move(1278,1);
    const cases=['cf_east_noble','cf_south_villager','cf_sea_sailor','cf_sea_noble','cf_mena_villager','cf_mena_knight','cf_africa_sailor','cf_america_sailor','cf_med_villager','cf_med_knight'];
    for(const look of cases) for(const mode of ['half','face']) {
      await page.evaluate(({look,mode})=>{
        const d=window.friendDefs.find(d=>d.friendLook===look),who={name:d.name,portrait:G.Scenes.mateSpec(d.id),half:G.Img.chain.mateHalf(d.id),lang:3};
        if(mode==='face')who.noStand=true;
        window.friendDone=false; window.friendTalk=G.UI.say('약속 지키러 왔어. 이번엔 진짜 배에 태워 줘.',who).then(()=>window.friendDone=true);
      },{look,mode});
      await page.waitForSelector(mode==='face'?'.dlg .pframe':'.dlg-actor.tall',{state:'attached',timeout:30000});
      await page.waitForTimeout(850); await page.screenshot({path:path.join(OUT,look+'-'+mode+'-in-game.png')});
      for(let i=0;i<8&&!await page.evaluate(()=>window.friendDone);i++){await page.keyboard.press('Space');await page.waitForTimeout(80);}
      await page.evaluate(()=>window.friendTalk);
    }
    ok(!errors.length,errors.join('\n'));
    fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify({result,cases,errors},null,2));
    console.log('통과 — 표시된 얼굴상 8명 개별 수정·24명 원본 복원·무릎상 유지·초상 64장·저장 복원·실제 합류 대사·표시 '+(cases.length*2)+'사례·콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
