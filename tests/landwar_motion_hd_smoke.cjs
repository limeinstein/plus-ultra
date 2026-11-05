/* 고해상도 육상전: file:// 그림·지역 무장·포구 정렬·준비/발사/착탄 순서·기마/짐승 돌격. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'tools/procedural_art/node_modules/playwright-core'));
const OUT = path.join(ROOT, 'artifacts/landwar-hd-20261105');
const ok = (v, text) => { assert(v, text); console.log('✓ ' + text); };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.State && G.Games && G.Games.landWar && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    await page.evaluate(() => {
      G.State.newGame({name:'육상전 동작 시험',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:70,int:70,mar:70,cha:70},sk:{sword:3,shoot:3,gun:3},lg:[],diff:'normal'});
      const s=G.Game.state; s.settings.sound=0;s.settings.music=0;s.settings.shake=false;
      s.loc={mode:'city',city:0,lon:-9,lat:39,mount:{id:'horse',n:50}};
      G.Games.landWar({enemy:{name:'시트 시험대',kind:'garrison',n:200,noSpecial:true},party:100,terr:'grass',guns:true});
      const ids=Object.keys(G.LANDWAR_HD);G.Sprites.preload(ids);
    });
    await page.waitForFunction(() => Object.keys(G.LANDWAR_HD).every(id => G.Sprites.ready(id)), null, { timeout: 60000 });
    const manifest = await page.evaluate(() => {
      const D=G.Games._landDebug;
      return {regional:Object.keys(G.LANDWAR_REGIONAL_HD).length,hd:Object.keys(G.LANDWAR_HD).length,
        size:[document.querySelector('.lwar canvas').width,document.querySelector('.lwar canvas').height],
        cave:D.sprite(D.mine.find(u=>u.type==='cav')),
        tiers:['swordsmen','musketeers','cannons','officers','cavalry_horse','cavalry_camel','cavalry_elephant'].every(id=>G.Sprites.meta(id).rows.length===4),
        weapons:Object.keys(G.LANDWAR_REGIONAL_HD).map(k=>{const a=G.LANDWAR_REGIONAL_HD[k].r;return G.Sprites.meta(a[0]).weapons[G.Sprites.row(a[0],a[1])];})};
    });
    ok(manifest.regional === 19, '19개 지역의 근접·원거리·지휘 외형 연결');
    ok(manifest.tiers && manifest.cave.id === 'cavalry_horse', '보병·총병·포병·장교·탈것의 LV0~LV3 유지');
    ok(manifest.size[0] === 2000 && manifest.size[1] === 880, '같은 전장 크기에서 2배 해상도로 그리기');
    ok(['bow','sling','javelin','boomerang'].every(w=>manifest.weapons.includes(w)), '지역 무장: 활·투석·투창·부메랑 분리');
    await page.evaluate(() => {const D=G.Games._landDebug;D.step(8);window.__gun=D.mine.find(u=>u.type==='gun');window.__target=D.foes[0];__target.n=__target.n0=999;window.__shot=D.strike(__gun,__target,'attack');});
    const before=await page.evaluate(() => {const D=G.Games._landDebug;return {act:D.motion(__gun),shots:D.effects().filter(e=>e.kind==='shot').length};});
    ok(before.act==='attack' && before.shots===0, '총을 겨누는 준비 장면에서 탄이 먼저 나오지 않음');
    await page.waitForFunction(() => G.Games._landDebug.effects().some(e=>e.kind==='shot'));
    const shot=await page.evaluate(()=>{const D=G.Games._landDebug,e=D.effects().find(e=>e.kind==='shot'),f=D.effects().find(e=>e.kind==='flash');return {same:e.x0===f.x&&e.y0===f.y,smoke:D.effects().some(e=>e.kind==='smoke'),bounds:e.x0>0&&e.x0<1000&&e.y0>0&&e.y0<440};});
    ok(shot.same&&shot.smoke&&shot.bounds,'총구 섬광·흑색화약 연기·탄의 출발점 일치');
    await page.locator('.lwar canvas').screenshot({path:path.join(OUT,'runtime-musket.png')});
    await page.evaluate(()=>window.__shot);
    await page.evaluate(()=>{const D=G.Games._landDebug;window.__art=D.mine.find(u=>u.type==='art');window.__hp=__target.n;window.__boom=D.strike(__art,__target,'attack');});
    await page.waitForFunction(()=>G.Games._landDebug.effects().some(e=>e.kind==='ball'));
    ok(await page.evaluate(()=>__target.n===__hp),'포탄 비행 중에는 착탄 피해가 먼저 발생하지 않음');
    await page.waitForFunction(()=>G.Games._landDebug.effects().some(e=>e.kind==='boom'));
    await page.waitForTimeout(80);
    ok(await page.evaluate(()=>__target.n<__hp&&G.Games._landDebug.effects().some(e=>e.kind==='ember')),'착탄 때 피해·화염·불티·파편 발생');
    await page.locator('.lwar canvas').screenshot({path:path.join(OUT,'runtime-explosion.png')});
    for(let i=0;i<7;i++){await page.locator('.lwar canvas').screenshot({path:path.join(OUT,'runtime-explosion-'+i+'.png')});await page.waitForTimeout(120);}
    await page.evaluate(()=>window.__boom);
    await page.evaluate(()=>{const D=G.Games._landDebug;window.__cav=D.mine.find(u=>u.type==='cav');window.__charge=D.strike(__cav,__target,'charge');});
    ok(await page.evaluate(()=>G.Games._landDebug.motion(__cav)==='charge'&&__cav.rush.dx>0),'기병은 공격 전 돌격 동작과 실제 전진을 사용');
    await page.waitForTimeout(170);
    await page.locator('.lwar canvas').screenshot({path:path.join(OUT,'runtime-charge.png')});
    await page.evaluate(()=>window.__charge);
    await page.evaluate(()=>{const D=G.Games._landDebug;G.Game.state.player.items.push({id:'shells',n:2});D.foes.forEach(u=>{u.n=u.n0=999;});window.__salvo=D.special('shells');});
    await page.waitForFunction(()=>G.Games._landDebug.effects().some(e=>e.kind==='ball'));
    ok(await page.evaluate(()=>__art.act==='attack'&&G.Games._landDebug.effects().some(e=>e.kind==='smoke')),'작렬탄 작전도 포병 발사 자세·포구 연기를 사용');
    await page.evaluate(()=>window.__salvo);
    ok(await page.evaluate(()=>G.Games._landDebug.foes.every(u=>u.n<999)&&G.Game.state.player.items.find(i=>i.id==='shells').n===1),'작렬탄 착탄 뒤 전체 피해·기존 한 회 사용 유지');
    await page.evaluate(()=>G.Games._landDebug.close());
    for (const loc of [{lon:-76,lat:-12,weapon:'sling',key:'andes'},{lon:135,lat:-25,weapon:'boomerang',key:'australia'},{lon:173,lat:-41,weapon:'javelin',key:'maori'}]) {
      await page.evaluate(loc=>{const s=G.Game.state;s.loc={mode:'city',city:0,lon:loc.lon,lat:loc.lat,mount:{id:'walk',n:0}};G.Games.landWar({enemy:{name:'지역 동작 시험',kind:'native',n:40,noSpecial:true},party:40,terr:'grass',guns:false});},loc);
      const native=await page.evaluate(()=>{const D=G.Games._landDebug,u=D.foes.find(x=>x.look==='bow');window.__native=u;return {weapon:D.weapon(u),sheet:D.sprite(u).id};});
      ok(native.weapon===loc.weapon&&native.sheet.startsWith('regional_'),loc.key+'의 실제 원거리 그림·무기 연결');
      await page.evaluate(()=>{const D=G.Games._landDebug;D.step(8);const t=D.mine[0];t.n=t.n0=999;window.__nativeShot=D.strike(__native,t,'attack');});
      const expected={sling:'stone',boomerang:'boomerang',javelin:'javelin'}[loc.weapon];
      await page.waitForFunction(kind=>G.Games._landDebug.effects().some(e=>e.kind===kind),expected);
      await page.locator('.lwar canvas').screenshot({path:path.join(OUT,'runtime-'+loc.key+'.png')});
      await page.evaluate(()=>window.__nativeShot);await page.evaluate(()=>G.Games._landDebug.close());
    }
    await page.evaluate(()=>{G.Game.state.loc={mode:'city',city:0,lon:15,lat:0};G.Games.landWar({enemy:{name:'짐승 시험',kind:'beast',n:30,beast:['lion']},party:40,terr:'grass'});const D=G.Games._landDebug;D.step(8);window.__beast=D.foes[0];window.__beastCharge=D.strike(__beast,D.mine[0],'charge');});
    ok(await page.evaluate(()=>G.Games._landDebug.motion(__beast)==='charge'&&G.Games._landDebug.sprite(__beast).beast),'들짐승도 달리기·돌진·공격 동작 사용');
    await page.evaluate(()=>window.__beastCharge);await page.evaluate(()=>G.Games._landDebug.close());
    ok(errors.length===0,'pageerror·console.error 0: '+errors.join(' | '));
    fs.writeFileSync(path.join(OUT,'browser-report.json'),JSON.stringify({manifest,errors},null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
