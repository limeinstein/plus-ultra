/* 튜토리얼 21단계의 실제 치환·진행기 대사·선택 두 갈래·안내와 완료 창을 확인한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/i18n-pt-tutorial-20261122');
fs.mkdirSync(out,{recursive:true});
const entry=path.join(out,'focused.html');
fs.writeFileSync(entry,fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="js\/lang\/(?!pt\.js)[^"]+"><\/script>/g,'').replace('<head>','<head>\n<base href="'+pathToFileURL(root+path.sep).href+'">'));
const runtime=fs.readFileSync(path.join(root,'js/systems/tutorial.js'),'utf8');
const speakerCode=runtime.slice(runtime.indexOf('  function mateWho('),runtime.indexOf('  /** 특기 단계:'));
const playCode=runtime.slice(runtime.indexOf('  async function play(lines)'),runtime.indexOf('  /** 이 단계에서 한 번만 하는 말 */'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],report={passed:false};
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','ko');window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await p.goto(pathToFileURL(entry).href,{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await p.evaluate(()=>{G.I18N.set('pt');G.Tutorial.start();G.Game.state.settings.res=.35;});
  report.corpus=await p.evaluate(()=>{
   const missing=[],stats={pages:0,choices:0,branches:0};
   function walk(v,key){
    if(typeof v==='string'&&/[가-힣]/.test(v))for(const raw of G.Tutorial.fmt(v).split('\f')){const tr=G.I18N.tx(raw);stats.pages++;if(/[가-힣]|⟦|⟪|\{(?:sk|pow|name)/.test(tr))missing.push({key,raw,tr});}
    else if(Array.isArray(v))v.forEach((x,i)=>walk(x,key+'.'+i));
    else if(v&&typeof v==='object'){if(v.ask){stats.choices++;stats.branches+=v.opts.length;}Object.entries(v).forEach(([k,x])=>walk(x,key+'.'+k));}
   }
   walk(G.TUTORIAL,'tutorial');
   const book=G.BOOK?.b_mela; if(book)walk(book.title,'book.title');
   return {...stats,steps:G.TUTORIAL.steps.length,missing};
  });
  console.log('튜토리얼 자료',report.corpus.pages,'쪽, 누락',report.corpus.missing.length);
  assert.deepEqual(report.corpus.missing,[]);
  report.playback=await p.evaluate(async({speakerCode,playCode})=>{
   // 실제 진행기의 비공개 함수를 그대로 읽어 UI 경계만 대체한다. 게임 파일은 수정하지 않는다.
   const play=new Function('G',`var UI=G.UI,D=G.TUTORIAL;function S(){return G.Game.state;}function scene(){return G.Game.sceneName;}function C(){return G.Scenes.city;}var fmt=G.Tutorial.fmt;${speakerCode}\n${playCode}\nreturn play;`)(G);
   G.Game.sceneName='sea';
   const groups=[];function walk(v){if(Array.isArray(v)){if(v.length&&v.every(x=>Array.isArray(x)&&typeof x[0]==='string'&&typeof x[1]==='string'||x?.ask)){groups.push(v);return;}v.forEach(walk);}else if(v?.ask)groups.push([v]);else if(v&&typeof v==='object')Object.values(v).forEach(walk);}
   walk(G.TUTORIAL.steps);
   const oldSay=G.UI.say,oldAsk=G.UI.ask;let branch=0,pages=0,speakers=0,choices=0;
   const check=s=>{const tr=G.I18N.tx(s);if(/[가-힣]|⟦|⟪|\{(?:sk|pow|name)/.test(tr))throw Error('실제 튜토리얼 재생 누락: '+s);};
   function who(sp){if(sp?.name){check(sp.name);speakers++;}}
   G.UI.say=async(text,sp)=>{text.split('\f').forEach(s=>{check(s);pages++;});who(sp);};
   G.UI.ask=async(text,opts,sp)=>{check(text);opts.forEach(o=>check(o.label));who(sp);choices++;return Math.min(branch,opts.length-1);};
   try{for(branch=0;branch<2;branch++)for(const lines of groups)await play(lines);}finally{G.UI.say=oldSay;G.UI.ask=oldAsk;}
   G.Game.sceneName='city';return {groups:groups.length,pages,speakers,choices};
  },{speakerCode,playCode});
  const grab=async name=>{
   await p.waitForTimeout(120);
   const missing=await p.evaluate(()=>{
    G.I18N.sweep(document.body);const found=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
    while((n=w.nextNode())){const el=n.nodeType===3?n.parentElement:n;if(!el||el.closest('script,style,[translate=no],.no-i18n')||!el.getClientRects().length)continue;
     if(n.nodeType===3&&/[가-힣]/.test(n.nodeValue))found.push(n.nodeValue.trim());
     if(n.nodeType===1)for(const a of ['title','placeholder','aria-label','alt'])if(/[가-힣]/.test(n.getAttribute(a)||''))found.push(a+': '+n.getAttribute(a));
    }return [...new Set(found)].filter(Boolean);
   });
   report[name]=missing;await p.screenshot({path:path.join(out,name+'.png')});assert.deepEqual(missing,[],name+' 화면 누락');
  };
  await p.evaluate(()=>{G.Scenes.title.exit();G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();G.UI.say(G.Tutorial.fmt(G.TUTORIAL.steps.find(s=>s.id==='roles').teach[0][1]),{name:'루카'});});
  await p.waitForSelector('.dlg');await grab('roles-dialogue');for(let i=0;i<8;i++)await p.keyboard.press('Escape');
  await p.setViewportSize({width:960,height:540});
  await p.evaluate(()=>{let q;function walk(v){if(v?.ask&&!q)q=v;else if(v&&typeof v==='object')Object.values(v).forEach(walk);}walk(G.TUTORIAL.steps.find(s=>s.id==='hire'));G.UI.ask(G.Tutorial.fmt(q.ask),q.opts.map((o,i)=>({label:o[0],value:i})),{name:'후안 데 라 코사'});});
  await p.waitForSelector('.askrow button');await grab('hire-choice-small');await p.keyboard.press('Escape');
  report.epilogue=await p.evaluate(()=>{
   const html=G.T('<div style="font-size:19px;line-height:1.7">튜토리얼을 마쳤습니다.<br>얻은 것: 동료 <b>{mates}</b>명 · 발견 <b>{found}</b> · 명성 <b>{fame}</b> · 금화 <b>{gold}</b>닢<div class="sep"></div><b>이 항해를 이어 간다</b> — 지금 상태({city}, {date})를 그대로 본 게임으로 넘깁니다. 안내는 꺼집니다.<br><b>타이틀로 돌아간다</b> — 처음부터 「새로운 항해」로 제독을 직접 만들 수 있습니다.</div>',{mates:3,found:1,fame:450,gold:7200,city:'세빌리아',date:G.U.fmtDate(G.Game.state.date)});
   G.UI.window({title:'첫 항해를 마치다',icon:'laurel',width:680,html,buttons:[{label:'타이틀로 돌아간다',value:'title'},{label:'이 항해를 이어 간다',value:'keep'}]});return html;
  });
  assert(!/[가-힣]|\{(?:mates|found|fame|gold|city|date)\}/.test(report.epilogue));
  assert(['3','1','450','7200','Sevilha'].every(s=>report.epilogue.includes(s)));
  await p.waitForSelector('.modal-back .content');await grab('epilogue-small');await p.keyboard.press('Escape');
  assert.deepEqual(errors,[]);report.passed=true;
  console.log(JSON.stringify({corpus:report.corpus,playback:report.playback,passed:true,errors}));
 }finally{report.errors=errors;fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
