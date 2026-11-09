/* 실제 file:// 게임의 시계를 16ms씩 진행한다. OUT을 주면 검토용 GIF와 접촉 PNG도 기록한다. */
'use strict';
const assert = require('assert/strict'), fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process'), { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), out = process.env.OUT;

async function arena(page, place, fallback) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(pathToFileURL(path.join(root,'index.html')).href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.G && G.Game.sceneName === 'title');
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now()+500));
  await page.evaluate(async ({place, fallback}) => {
    G.State.newGame({ name:'시범 제독', nation:'PT', job:'explorer', age:18, birth:{m:1,d:1},
      st:{str:80,int:60,mar:90,cha:70}, sk:{sword:3}, lg:[], diff:'normal' });
    G.Game.state.settings.res=0.35;
    const keys=['duel/fighters/main_admiral','duel/fighters/caribbean_pirate','duel/backgrounds/'+place,'duel/cutins/main_admiral'];
    for (const id of ['main_admiral','caribbean_pirate']) for (const type of ['atk','react']) keys.push('duel/fighters_ext/'+id+'_'+type);
    keys.push(...Object.keys(G.DUEL_ART.fx).map(id=>'duel/fx/'+id));
    if (!fallback) assertAssets(await Promise.all(keys.map(k=>G.Img.load(k))));
    function assertAssets(images) { if (images.some(im=>!im)) throw Error('시범 시트·효과를 불러오지 못함'); }
    if (fallback) {
      const load=G.Img.load, get=G.Img.get, has=G.Img.has, hidden=k=>/^duel\/(fighters|fx)/.test(k);
      G.Img.load=k=>hidden(k)?Promise.resolve(null):load(k);
      G.Img.get=k=>hidden(k)?null:get(k); G.Img.has=k=>!hidden(k)&&has(k);
    }
    G.Games.duelDebug={events:[]};
    G.Games.duel({name:'카리브 해적',style:'slash',sprite:'caribbean_pirate',look:'pirate',skill:1,mar:58},
      {sprite:'main_admiral',place,stance:'allout',fastEnd:true});
    document.querySelector('.rd-sys .btn').click();
    window.d=G.Games._duelDebug;
  }, {place, fallback});
  await page.clock.runFor(1700);
}

async function closeImpacts(page) {
  await page.evaluate(()=>{
    const tune=G.FX.duel.impact.timing, previous=tune.slash;
    tune.slash={wind:25,swing:20,follow:20,recover:40};
    G.Games.duelDebug.events.length=0;
    const chance=G.U.chance; G.U.chance=()=>true;
    d.fast=false; d.me.hp=d.en.hp=10000; d.en.armorId='plate';
    window.pairComplete=false;
    d.strike(d.me,'slash',{sure:true}).then(()=>d.strike(d.me,'slash',{sure:true})).finally(()=>{
      tune.slash=previous; G.U.chance=chance; d.en.armorId=null; window.pairComplete=true;
    });
  });
  await page.clock.runFor(650);
  const pair=await page.evaluate(()=>({done:pairComplete, events:G.Games.duelDebug.events}));
  assert(pair.done);
  const hits=by(pair,'contact'); assert.equal(hits.length,2); assert(hits.every(e=>e.material==='armor'));
  assert(hits[1].time-hits[0].time<330); assert.equal(by(pair,'screen').length,1,'가까운 두 치명의 섬광 제한');
}
async function action(page, name, capture) {
  await page.evaluate(({name,capture}) => {
    const trace=G.Games.duelDebug.events;
    trace.length=0;
    const incoming=name==='loss'||name==='incoming', a=incoming?d.en:d.me, b=incoming?d.me:d.en;
    const move=name==='thrust'?'thrust':name==='bash'||name==='boss'?'bash':'slash';
    const denied=name==='block'||name==='parry'||name==='skill-parry', crit=name==='muted'||name==='heavy'||name==='rapid';
    const dead=['ko','boss','loss'].includes(name);
    for (const f of [a,b]) Object.assign(f,{hp:10000,maxHp:10000,spirit:100,stun:0,pose:'idle',poseT:0,pt:0,
      x:0,tx:0,rot:0,sq:0,kx:0,ky:0,push:null,preFall:0,fly:false,flash:0,armLift:0,travel:null});
    a.move=a.style=move; b.move=name==='parry'?'thrust':move; a.sword=2; b.sword=name==='skill-parry'?4:2;
    d.en.look=name==='boss'?'rival':'pirate';
    if(dead) b.hp=1;
    d.fast=name==='fast'; G.Game.state.settings.shake=name!=='muted';
    const chance=G.U.chance;
    G.U.chance=p=>p===0.55?chance(p):denied?false:p<0.2?crit:true;
    const cv=document.querySelector('.rd-stage canvas'), small=document.createElement('canvas');
    small.width=560;small.height=Math.round(small.width*cv.height/cv.width);
    const ctx=small.getContext('2d'), frames=[], samples=[];
    let active=true, done=false, lastFrame=-Infinity, contacts=0, contactImage=null;
    const start=performance.now();
    function observe() {
      if(!active)return;
      const now=performance.now(), hits=trace.filter(e=>e.type==='contact').length;
      samples.push({ms:now-start,freeze:d.freeze,pt:[a.pt,b.pt],shake:d.shake.x,x:b.kx,ax:a.kx,
        flash:b.flash,pose:a.pose,bpose:b.pose,hp:b.hp});
      if(capture && (now-lastFrame>=48 || hits!==contacts)) {
        ctx.drawImage(cv,0,0,small.width,small.height);
        frames.push([Math.round(now-start),small.toDataURL('image/png').split(',')[1]]);
        if(hits!==contacts) contactImage=cv.toDataURL().split(',')[1];
        contacts=hits;lastFrame=now;
      }
      requestAnimationFrame(observe);
    }
    requestAnimationFrame(observe);
    let play;
    if(name==='combo') play=d.useTech('special',a);
    else play=d.strike(a,move,{noCrit:!crit,sure:!denied});
    play.then(()=>{done=true;G.U.chance=chance;},e=>{G.U.chance=chance;throw e;});
    window.finishCapture=()=>{active=false;return {done, samples,events:trace.slice(),frames,contactImage};};
  },{name,capture});
  await page.clock.runFor(name==='combo'?3500:['ko','boss','loss'].includes(name)?2550:1050);
  const result=await page.evaluate(()=>finishCapture());
  assert(result.done,name+' 동작 완료');
  return result;
}
function save(place,name,r) {
  const base=path.join(out,place+'-'+name), tmp=fs.mkdtempSync(path.join(os.tmpdir(),'duel-impact-'));
  try {
    fs.writeFileSync(base+'.png',Buffer.from(r.contactImage,'base64'));
    const frames=r.frames;
    // 필살기 컷인 GIF는 DOM에 따로 겹치므로 검토 GIF는 첫 베기의 준비부터 담는다.
    if(name==='combo') frames.splice(0,frames.findIndex(f=>f[0]>1220));
    fs.writeFileSync(path.join(tmp,'timing.json'),JSON.stringify(frames.map((f,i)=>i+1<frames.length?Math.max(10,frames[i+1][0]-f[0]):150)));
    frames.forEach((f,i)=>fs.writeFileSync(path.join(tmp,String(i).padStart(3,'0')+'.png'),Buffer.from(f[1],'base64')));
    execFileSync('python',['-c',
      "from PIL import Image; from pathlib import Path; import json,sys; d=Path(sys.argv[1]); frames=[Image.open(f).convert('RGB') for f in sorted(d.glob('*.png'))]; sample=Image.new('RGB',(320,115*5)); [sample.paste(frames[round(i*(len(frames)-1)/4)].resize((320,115)),(0,115*i)) for i in range(5)]; palette=sample.quantize(colors=256); frames=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]; frames[0].save(sys.argv[2],save_all=True,append_images=frames[1:],duration=json.loads((d/'timing.json').read_text()),loop=0,optimize=True)",tmp,base+'.gif']);
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
}
const by=(r,type)=>r.events.filter(e=>e.type===type);
function check(r,name) {
  const hit=by(r,'contact')[0]; assert(hit,name+' 접촉');
  const frozen=r.samples.filter(s=>s.freeze>0);
  if(name==='slash'||name==='incoming') {
    assert.equal(hit.level,'light');assert(frozen.length>=2);
    assert(frozen.every(s=>s.pt[0]===frozen[0].pt[0]&&s.pt[1]===frozen[0].pt[1]));
    assert(new Set(frozen.map(s=>s.shake)).size>1);assert.equal(Math.sign(by(r,'shake')[0].x),hit.dir);
  }
  if(['slash','bash','thrust'].includes(name)) {
    const dx=(hit.x-hit.front)*hit.dir;
    assert(dx>=-10&&dx<=30);assert(r.samples.some(s=>s.x*hit.dir>1));
  }
  if(name==='heavy') {
    const start=by(r,'hitstop')[0].ms;
    const origin=r.samples.find(s=>s.freeze>0).ms;
    const sample=offset=>r.samples.find(s=>s.ms>=origin+start+offset).x;
    const early=sample(65),late=sample(215);
    assert(early>12 && late>early && late<=27,'강타의 첫 밀림 뒤 마찰로 더 미끄러짐');
  }
  if(['parry','block','skill-parry'].includes(name)) {
    assert.equal(hit.kind,name==='block'?'block':'parry');
    if(name!=='block') assert(Math.max(...r.samples.map(s=>Math.abs(s.ax)))>=26*0.8);
  }
  if(name==='combo') {
    assert.deepEqual(by(r,'hitstop').map(e=>e.level),['comboHit','comboHit','comboEnd']);
    assert.deepEqual(by(r,'screen').map(e=>e.kind),['comboEnd']);
    assert(by(r,'hitstop')[2].ms>by(r,'hitstop')[0].ms);
    assert.equal(by(r,'contact')[2].move,'rise');
  }
  if(['ko','boss','loss'].includes(name)) assert.equal(by(r,'slowmo').length,name==='boss'?1:0);
  if(name==='boss') assert.equal(by(r,'land').length,1);
  if(name==='loss') {
    assert.equal(by(r,'koBurst').length,0);assert.equal(by(r,'screen').length,0);assert(by(r,'vignette')[0].alpha>=0.45);
  }
  if(name==='muted') {
    assert.equal(by(r,'shake').length,0);assert.equal(by(r,'screen').length,0);
    assert(frozen.some(s=>s.flash>0));assert(frozen.every(s=>s.shake===0));
  }
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||undefined,
    args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try {
    if(out)fs.mkdirSync(out,{recursive:true});
    for(const place of ['deck','tavern','fallback']) {
      const page=await browser.newPage({viewport:{width:1060,height:740}});
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|fonts\./.test(m.text()))errors.push(m.text());});
      await arena(page,place==='fallback'?'deck':place,place==='fallback');
      const gallery=['slash','thrust','bash','block','parry','combo','ko','boss','loss'];
      const names=place==='deck'?gallery.concat(['incoming','heavy','muted','fast','skill-parry']):place==='fallback'?['slash','parry']:gallery;
      const results={}, flashes=[];
      for(const name of names){
        const capture=!!out&&gallery.includes(name)&&place!=='fallback', r=await action(page,name,capture);
        check(r,name);results[name]=r;flashes.push(...by(r,'screen').map(e=>e.time));
        if(capture)save(place,name,r);
      }
      if(place!=='fallback'){
        const y=name=>by(results[name],'contact')[0].y;
        assert(y('bash')<y('slash')&&y('slash')<y('thrust'));
      }
      if(place==='deck'){
        const length=r=>r.samples.find(s=>s.pose==='idle'&&s.ms>by(r,'hitstop')[0].ms&&s.hp<10000).ms;
        const ratio=length(results.fast)/length(results.slash);
        assert(ratio>=0.55&&ratio<=0.65,'빠르게 배율 '+ratio);
        await closeImpacts(page);
      }
      for(let i=1;i<flashes.length;i++)assert(flashes[i]-flashes[i-1]>=330);
      console.log(place+' '+names.length+'가지 연출 통과');await page.close();
    }
    assert.deepEqual(errors,[]); console.log('콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
