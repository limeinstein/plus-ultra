/* 선택한 해도 대화창: 실제 창 크기·글 보존·꾸밈·선택 시점·배율 변경을 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(ROOT,'artifacts/dialogue-chart-20261121');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[], cases=[];
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type() === 'error')errors.push(m.text());});
  await page.addInitScript(()=>{window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await page.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  await page.evaluate(async bg=>{
   G.State.newGame({name:'선장',nation:'PT',job:'explorer',age:28,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   const player=G.Game.state.player;player.look=G.Img.has('portraits/player/blackcoat_captain')?'blackcoat_captain':'admiral';
   player.portrait=G.Art.withImg(G.Art.npcSpec('player-dialogue-preview','captain','ib','m'),G.Img.chain.heroPortrait(player));
   G.Game.state.loc={mode:'city',city:0}; G.Game.sceneName='city';
   G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();if(G.Loader)G.Loader.hide();
   const image=new Image();image.src=bg;await image.decode();G.Game.setScene(image);document.querySelector('#boot-loader')?.remove();
   window.dialogWho={name:'항해사 페드루',portrait:G.Art.npcSpec('preview-sailor','sailor','ib'),half:['characters/player_half_navigator_white'],rigId:'preview-sailor',layout:'duo',side:'right',choiceSide:'right',lang:3,partner:{name:'선장',portrait:G.Game.state.player.portrait,half:['characters/player_half_blackcoat_captain'],rigId:'player'}};
   window.openSpeech=(text,opts)=>{window.dialogResolved=false;window.dialogResult=undefined;window.dialogPromise=G.UI.say(text,Object.assign({},dialogWho,opts)).then(v=>{window.dialogResolved=true;window.dialogResult=v;});};
   window.openQuestion=(text,choices,opts)=>{window.dialogResolved=false;window.dialogResult=undefined;window.dialogPromise=G.UI.ask(text,choices,Object.assign({},dialogWho,opts)).then(v=>{window.dialogResolved=true;window.dialogResult=v;});};
   window.dialogMetrics=()=>{const box=document.querySelector('.dlg'), speech=box.querySelector('.dialog-speech'),row=box.querySelector('.askrow'), br=box.getBoundingClientRect();return{text:speech.textContent,height:speech.clientHeight,scrollHeight:speech.scrollHeight,width:speech.clientWidth,scrollWidth:speech.scrollWidth,inside:br.left>=-1&&br.right<=innerWidth+1&&br.top>=-1&&br.bottom<=innerHeight+1,choices:!!row&&!row.hidden};};
  },pathToFileURL(path.join(ROOT,'images/interiors/tavern_europe.webp')).href);
  await page.evaluate(()=>openQuestion('선장님, 서쪽 바다에서 아직 해도에 없는 섬을 보았다는군요.\n원하신다면 그 이야기를 자세히 들려드리겠습니다.',['자세히 듣는다','다음에 이야기한다']));
  await page.waitForFunction(()=>document.querySelector('.dlg.chart-art-ready')&&[...document.querySelectorAll('.chart-name img')].every(im=>im.naturalWidth>2));
  await page.waitForTimeout(400);
  let m=await page.evaluate(()=>dialogMetrics());
  assert(m.inside&&m.choices&&m.scrollHeight<=m.height+1&&m.scrollWidth<=m.width+1,JSON.stringify(m));
  assert.strictEqual(await page.locator('.actor-name.chart-name').count(),2);
  const alignment=await page.evaluate(()=>{const box=document.querySelector('.dlg'),speech=box.querySelector('.dialog-speech').getBoundingClientRect(),button=box.querySelector('.askrow button').getBoundingClientRect(),bounds=box.getBoundingClientRect(),scale=bounds.width/box.offsetWidth;return{aligned:Math.abs(speech.left-button.left)<1,leftInset:(speech.left-bounds.left)/scale,rightInset:(bounds.right-speech.right)/scale};});
  assert(alignment.aligned&&Math.abs(alignment.leftInset-168)<1&&Math.abs(alignment.rightInset-192)<1,'빨간 표시 영역에 맞춘 본문·단추의 시작선과 좌우 여백');
  const spacing=await page.evaluate(()=>{
   const box=document.querySelector('.dlg'),speech=box.querySelector('.dialog-speech'),row=box.querySelector('.askrow'),b=box.getBoundingClientRect(),s=speech.getBoundingClientRect(),r=row.getBoundingClientRect(),scale=b.width/box.offsetWidth;
   return{top:(s.top-b.top)/scale,gap:(r.top-s.bottom)/scale,lineHeight:parseFloat(getComputedStyle(speech).lineHeight),fontSize:parseFloat(getComputedStyle(speech).fontSize)};
  });
  assert(Math.abs(spacing.top-36)<1&&Math.abs(spacing.gap-14)<1&&Math.abs(spacing.lineHeight/spacing.fontSize-1.62)<0.01,'이름표 아래 시작 여백·줄 간격·버튼까지의 간격을 일정하게 맞춘다');
  await page.screenshot({path:path.join(OUT,'01-applied-duo.png')});
  await page.locator('.askrow button').first().click();
  await page.waitForFunction(()=>dialogResolved);
  cases.push({name:'선택 시안 실제 적용·좌우 이름표·짧은 질문',passed:true});
  const normalize=t=>t.replace(/\s+/gu,'');
  async function speechLines(){return page.locator('.dialog-speech').last().evaluate(el=>{const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),tops=[];let node;while(node=walker.nextNode()){if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width&&r.height&&!tops.some(t=>Math.abs(t-r.top)<2))tops.push(r.top);}return tops.length;});}
  async function checkFaceNames(single=false){
   const result=await page.evaluate(single=>{
    const box=document.querySelector('.dlg'),scale=box.getBoundingClientRect().width/box.offsetWidth,overlap=G.FX.dialogPanel.bustOverlap*scale;
    const names=[...document.querySelectorAll('.actor-name')],pairs=single?[[box.querySelector('.pframe'),box.querySelector(':scope > .name')]]:[...document.querySelectorAll('.dlg-actor.bust')].map((face,i)=>[face,names[i]]);
    return pairs.map(([face,name])=>{if(!face||!name)return{missing:true};const f=face.getBoundingClientRect(),n=name.getBoundingClientRect();return{center:Math.abs((f.left+f.right-n.left-n.right)/2),width:Math.abs(f.width-n.width),bottom:Math.abs(f.bottom-n.top-overlap),inside:f.top>=0&&f.left>=0&&f.right<=innerWidth+1};});
   },single);
   assert(result.length===(single?1:2)&&result.every(r=>!r.missing&&r.center<2&&r.width<2&&r.bottom<2&&r.inside),'얼굴 칸을 이름표의 폭·중심·윗변에 맞춘다: '+JSON.stringify(result));return result;
  }
  async function readPages(expected,ask=false){
   const pages=[];let choices=false;
   for(let i=0;i<100;i++){
    await page.waitForTimeout(240);
    const info=await page.evaluate(()=>dialogMetrics());
    assert(info.inside,'대화창이 화면 안에 들어간다');
    assert(info.scrollHeight<=info.height+1&&info.scrollWidth<=info.width+1,'대사 넘침: '+JSON.stringify(info));
    assert(await speechLines()<=4,'한 쪽의 대사는 최대 4줄');
    pages.push(info.text);
    if(ask&&info.choices){choices=true;break;}
    const index=await page.locator('.dlg').getAttribute('data-page');
    if(ask)await page.locator('.dialog-next').click();else await page.keyboard.press('Enter');
    await page.waitForFunction(n=>dialogResolved||document.querySelector('.dlg')?.dataset.page!==n,index,{timeout:5000});
    if(await page.evaluate(()=>dialogResolved))break;
   }
   assert.strictEqual(normalize(pages.join('')),normalize(expected),'처음부터 끝까지 모든 글 보존');
   if(ask)assert(choices,'질문 마지막 쪽에 선택지를 표시한다');
   return pages.length;
  }
  const text='첫 항해의 기록입니다. <b>해도와 바람을 살피며 먼 섬을 찾아갑니다.</b> <span class="muted">동료들과 나눈 약속을 잊지 않겠습니다.</span>\n'.repeat(12)+'마지막 문장입니다. ⚓👩🏽‍🚀';
  const plain=text.replace(/<[^>]*>/g,'');
  await page.evaluate(t=>openSpeech(t,{raw:true}),text);
  const richPages=await readPages(plain);
  assert(richPages>1);cases.push({name:'긴 꾸밈 대사·여러 문단·이모지·글 보존',pages:richPages,passed:true});
  const joined='해도를펼치고아직발견하지못한섬을향해항해합니다'.repeat(35)+'끝';
  await page.evaluate(t=>openSpeech(t,{raw:true}),joined);
  const joinedPages=await readPages(joined);assert(joinedPages>1);cases.push({name:'띄어쓰기 없는 긴 대사',pages:joinedPages,passed:true});
  const question='먼 항구에서 전해 들은 이야기를 기록합니다. 바람과 보급을 살핀 뒤 다음 항로를 정해야 합니다. '.repeat(14)+'어느 항로로 떠나겠습니까?';
  await page.evaluate(t=>openQuestion(t,[{label:'고를 수 없음',value:'bad',dis:true},{label:'서쪽 항로를 택한다',value:'west'},{label:'돌아간다',value:'back'}],{raw:true}),question);
  await page.waitForTimeout(300);assert(!(await page.evaluate(()=>dialogMetrics())).choices);
  // 숨겨진 선택지를 스크립트로 눌러도 읽기 중에는 결정되지 않는다.
  await page.evaluate(()=>document.querySelectorAll('.askrow button')[1].click());assert(!(await page.evaluate(()=>dialogResolved)));
  const questionCount=await readPages(question,true);assert(questionCount>1);
  assert(await page.locator('.askrow button').first().isDisabled());
  await page.locator('.askrow button').nth(1).click();await page.waitForFunction(()=>dialogResolved);
  assert.strictEqual(await page.evaluate(()=>dialogResult),'west');cases.push({name:'긴 질문·마지막 쪽 선택·비활성 선택지',pages:questionCount,passed:true});
  const changed='글꼴과 창 크기를 바꾸어도 읽던 대사가 사라지지 않아야 합니다. 먼 항로의 기록을 마지막까지 보존합니다. '.repeat(13);
  await page.evaluate(t=>{G.Game.setUiSize('normal');openSpeech(t,{raw:true});},changed);
  await page.waitForTimeout(300);
  await page.evaluate(()=>{const body=document.querySelector('.dlg .body');body.style.fontFamily='Arial';body.style.fontSize='30px';G.Game.setUiSize('max');});
  await page.waitForTimeout(350);
  const changedPages=await readPages(changed);assert(changedPages>1);cases.push({name:'열린 대화의 글꼴·글자 크기·배율 변경 후 글 보존',pages:changedPages,passed:true});
  await page.evaluate(()=>{G.Game.setUiSize('max');});
  await page.evaluate(()=>openQuestion('보급을 마쳤습니다. 다음 행동을 고르십시오.',Array.from({length:20},(_,i)=>({label:'선택 '+(i+1)+' — 항해를 위한 긴 준비 내용을 확인한다',value:i})),{name:'매우 긴 이름을 가진 포르투갈 왕립 함대의 항해사 페드루'}));
  await page.waitForTimeout(400);m=await page.evaluate(()=>dialogMetrics());
  assert(m.inside&&m.scrollHeight<=m.height+1,'최대 글자 크기에서도 대사가 맞는다');
  assert(await page.locator('.askrow').evaluate(el=>el.scrollHeight>el.clientHeight),'많은 선택지는 창 안에서 스크롤된다');
  await page.screenshot({path:path.join(OUT,'02-large-font-many-choices.png')});
  await page.locator('.askrow button').last().click();await page.waitForFunction(()=>dialogResolved);
  assert.strictEqual(await page.evaluate(()=>dialogResult),19);cases.push({name:'최대 배율·긴 이름·20개 선택지의 끝 항목 선택',passed:true});
  await page.evaluate(()=>{G.Game.setUiSize('normal');openSpeech('얼굴 칸 대사도 모두 보입니다. '.repeat(20),{noStand:true,layout:null,partner:null,raw:true});});
  await page.waitForTimeout(350);const singleAlignment=await checkFaceNames(true);await page.screenshot({path:path.join(OUT,'08-single-face-name-alignment.png')});
  const facePages=await readPages('얼굴 칸 대사도 모두 보입니다. '.repeat(20));assert(facePages>1);cases.push({name:'얼굴 초상 대사',passed:true});
  cases.push({name:'한 사람 얼굴상과 이름표의 정렬',alignment:singleAlignment,passed:true});
  await page.evaluate(()=>openQuestion('먼 항구의 소식을 먼저 전합니다.\f이제 선택하십시오.',[{label:'확인',value:true}],{raw:true}));
  const explicitPages=await readPages('먼 항구의 소식을 먼저 전합니다.이제 선택하십시오.',true);assert.strictEqual(explicitPages,2);
  await page.locator('.askrow button').click();await page.waitForFunction(()=>dialogResolved);cases.push({name:'질문의 명시적 쪽 나눔',passed:true});
  // 크기를 다시 재더라도 사용자가 멈춘 자동 선택은 되살아나지 않는다.
  await page.evaluate(()=>{
   window.autoQuestion=()=>G.UI.ask('반복되는 항로 질문입니다.',[{label:'동쪽 항로',value:'east'},{label:'서쪽 항로',value:'west'}],dialogWho);
   window.dialogResolved=false;autoQuestion().then(v=>{dialogResult=v;dialogResolved=true;});
  });
  await page.locator('.askrow button').last().click();await page.waitForFunction(()=>dialogResolved);
  await page.evaluate(()=>{window.oldAutoMs=G.BALANCE.seaAuto.ms;G.BALANCE.seaAuto.ms=650;dialogResolved=false;G.UI.autoRun(autoQuestion).then(v=>{dialogResult=v;dialogResolved=true;});});
  await page.waitForSelector('.auto-left');await page.keyboard.press('ArrowRight');
  await page.evaluate(()=>document.querySelector('.dlg .body').style.fontFamily='Arial');
  await page.waitForTimeout(1000);assert(!(await page.evaluate(()=>dialogResolved))&&!(await page.locator('.auto-left').count()),'입력으로 멈춘 자동 선택은 다시 측정해도 멈춘다');
  await page.locator('.askrow button').last().click();await page.waitForFunction(()=>dialogResolved);
  await page.evaluate(()=>{dialogResolved=false;G.UI.autoRun(autoQuestion).then(v=>{dialogResult=v;dialogResolved=true;});});
  await page.waitForFunction(()=>dialogResolved,null,{timeout:5000});assert.strictEqual(await page.evaluate(()=>dialogResult),'west');
  await page.evaluate(()=>G.BALANCE.seaAuto.ms=oldAutoMs);cases.push({name:'자동 선택·사용자 입력으로 중단·재측정 뒤 중단 유지',passed:true});
  // 실제 게임의 여급·여성 동료·여성 후원자 대화 함수를 실행한다. 선택지를 시험용으로 바꾸지 않는다.
  await page.evaluate(async()=>{await G.Game.ensureGeo();G.Game.setUiSize('max');G.Game.state.player.gold=100000;window.flowDone=false;window.flowError=null;});
  async function waitRealChoices(minimum){
   for(let i=0;i<60;i++){
    await page.waitForTimeout(250);
    const state=await page.evaluate(()=>({done:flowDone,error:flowError,ask:!!document.querySelector('.askrow:not([hidden])'),next:!!document.querySelector('.dialog-next:not([hidden])')}));
    assert(!state.error,state.error);
    if(state.ask){
     const metrics=await page.evaluate(()=>dialogMetrics());assert(metrics.inside&&metrics.scrollHeight<=metrics.height+1,'실제 메뉴의 대사 넘침');
     const count=await page.locator('.askrow button').count();assert(count>=minimum,'실제 선택지 수: '+count);
     const geometry=await page.locator('.askrow').evaluate(el=>{const row=el.getBoundingClientRect(), box=el.closest('.dlg').getBoundingClientRect();return{inside:row.left>=box.left&&row.right<=box.right&&row.bottom<=box.bottom,scroll:el.scrollHeight>el.clientHeight,labels:[...el.querySelectorAll('button')].map(b=>b.textContent.trim())};});
     assert(geometry.inside,'실제 메뉴의 선택지 영역이 창 안에 놓인다');return{count,...geometry};
    }
    assert(!state.done,'선택지 전 대화가 끝남');
    if(state.next)await page.locator('.dialog-next').click();else await page.keyboard.press('Enter');
   }
   throw Error('실제 메뉴 선택지 대기 시간 초과');
  }
  async function finishRealFlow(){
   for(let i=0;i<40&&!await page.evaluate(()=>flowDone);i++){await page.waitForTimeout(250);if(await page.locator('.dlg').count())await page.keyboard.press('Enter');}
   assert(await page.evaluate(()=>flowDone),'실제 대화를 정상 종료한다');assert(!(await page.evaluate(()=>flowError)));
  }
  await page.evaluate(()=>{
   const s=G.Game.state,c=G.CITY_DATA[0],maid=G.Scenes.city.B.tavern.maidOf(c);
   window.testMaid=maid.name;s.maids[maid.id]={aff:95,met:3,lgMe:1};window.flowDone=false;window.flowError=null;
   G.Scenes.city.B.tavern.maid(c,maid).then(()=>flowDone=true,e=>{flowError=e.message;flowDone=true;});
  });
  const maidMenu=await waitRealChoices(7);await page.screenshot({path:path.join(OUT,'03-real-maid-many-choices.png')});
  const maidActors=await page.locator('.dlg-actor.tall').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
  assert.strictEqual(maidActors.length,2,'여급과 선장 둘 다 무릎상');assert(!maidMenu.scroll,'여급 선택지 8개를 스크롤 없이 배치한다');
  await page.locator('.askrow button').last().click();await finishRealFlow();cases.push({name:'여급 실제 대화 · '+await page.evaluate(()=>testMaid),...maidMenu,passed:true});
  await page.evaluate(()=>{
   const t=G.Scenes.city.B.tavern,m=t.maidOf(G.CITY_DATA[0]);
   openQuestion('어느 항구 이야기를 들려드릴까요?',['이야기한다','돌아간다'],Object.assign({},t.maidSpeaker(m),{layout:'duo',side:'right',choiceSide:'left',partner:t.playerSpeaker()}));
  });
  await page.waitForTimeout(400);
  const ordinaryActors=await page.locator('.dlg-actor.tall').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
  assert(ordinaryActors.length===2&&maidActors.every((h,i)=>Math.abs(h-ordinaryActors[i])<1),'8개 버튼과 일반 2개 버튼 대화의 무릎상 크기가 같다');
  await page.locator('.askrow button').last().click();await page.waitForFunction(()=>dialogResolved);
  cases.push({name:'여급 8개 선택지와 일반 2개 선택지의 무릎상 크기 비교',many:maidActors,ordinary:ordinaryActors,passed:true});
  await page.evaluate(()=>{G.Game.setUiSize('normal');window.flowDone=false;G.Scenes.city.B.tavern.maid(G.CITY_DATA[0],G.Scenes.city.B.tavern.maidOf(G.CITY_DATA[0])).then(()=>flowDone=true,e=>{flowError=e.message;flowDone=true;});});
  const normalMaid=await waitRealChoices(8);
  const normalActors=await page.locator('.dlg-actor.tall').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
  assert(normalActors.length===2&&normalActors.every(h=>h>=500)&&!normalMaid.scroll,'보통 배율에서 여급과 선장을 크게 보여 주고 버튼 8개를 모두 배치한다');
  await page.screenshot({path:path.join(OUT,'07-real-maid-normal-size.png')});
  await page.locator('.askrow button').last().click();await finishRealFlow();
  cases.push({name:'여급 실제 대화·보통 배율·큰 무릎상과 선택지 8개',actors:normalActors,...normalMaid,passed:true});
  await page.evaluate(()=>G.Game.setUiSize('max'));
  await page.evaluate(()=>{
   const s=G.Game.state,d=G.MATES.find(d=>d.g==='f'&&d.witch&&!d.minor&&!d.noWander)||G.MATES.find(d=>d.g==='f'&&!d.minor&&!d.sib&&!d.wed&&!d.noWander);
   window.testFemale=d.name;const m={id:d.id,role:'purser',loyal:90,aff:95};s.mates.push(m);window.flowDone=false;window.flowError=null;
   G.MateTalk.talk(G.CITY_DATA[0],m).then(()=>flowDone=true,e=>{flowError=e.message;flowDone=true;});
  });
  const femaleMenu=await waitRealChoices(6);await page.screenshot({path:path.join(OUT,'04-real-female-companion.png')});
  await page.locator('.askrow button').last().click();await finishRealFlow();cases.push({name:'여자 동료 실제 대화 · '+await page.evaluate(()=>testFemale),...femaleMenu,passed:true});
  await page.evaluate(()=>{
   const sp=G.SPONSOR.pt_queen,d=G.DISCOVERIES.find(d=>d.pw<=sp.pw&&G.tasteHit(sp.taste,d));G.Sponsor.rel(sp.id).trust=60;window.flowDone=false;window.flowError=null;
   G.Sponsor.negotiate(sp,d,1,false).then(()=>flowDone=true,e=>{flowError=e.message;flowDone=true;});
  });
  const patronMenu=await waitRealChoices(3);await page.screenshot({path:path.join(OUT,'05-real-patron-negotiation.png')});
  await page.locator('.askrow button').last().click();await finishRealFlow();cases.push({name:'여성 후원자 실제 계약 교섭 · 레오노르 왕비',...patronMenu,passed:true});
  await page.setViewportSize({width:1280,height:720});
  await page.evaluate(()=>{G.Game.state.settings.res=.35;G.Game.setUiSize('max');G.Game.go('sea',{depart:0});});
  await page.waitForFunction(()=>G.Game.sceneName==='sea'&&G.Scenes.sea.runtime(),null,{timeout:90000});
  await page.evaluate(()=>{if(G.Loader)G.Loader.hide();for(let i=0;i<8;i++)G.Scenes.sea.update(0);});
  const seaText='제독, 바람이 바뀌었습니다. 해안의 암초와 보급 상황을 살피며 안전한 항로를 정해야 합니다. '.repeat(14)+'마지막 항해 보고입니다.';
  await page.evaluate(t=>openSpeech(t,Object.assign({},G.Scenes.mateSpeaker('first'),{raw:true,lang:3})),seaText);
  await page.waitForFunction(()=>[...document.querySelectorAll('.dlg-actor .rig-fallback')].every(el=>el.tagName!=='IMG'||el.complete&&el.naturalWidth>0));
  await page.waitForTimeout(300);await page.screenshot({path:path.join(OUT,'06-sea-long-dialogue.png')});
  assert.strictEqual(await page.locator('.dlg-actor.bust').count(),2,'바다에서는 두 얼굴상으로 표시한다');
  const duoAlignment=[];
  for(const size of ['normal','max']){await page.evaluate(size=>G.Game.setUiSize(size),size);await page.waitForTimeout(350);duoAlignment.push({size,alignment:await checkFaceNames()});}
  await page.screenshot({path:path.join(OUT,'06-sea-long-dialogue.png')});cases.push({name:'바다 두 얼굴상과 이름표의 정렬·보통 및 최대 배율',sizes:duoAlignment,passed:true});
  const seaPages=await readPages(seaText);assert(seaPages>1);cases.push({name:'바다 실제 장면·1280×720·최대 배율·긴 대사',pages:seaPages,passed:true});
  const seaQuestion='식량과 식수, 선원들의 피로를 살펴 다음 항구를 결정해야 합니다. '.repeat(10)+'어느 항로를 택합니까?';
  await page.evaluate(t=>openQuestion(t,Array.from({length:9},(_,i)=>({label:'항로 '+(i+1)+' — 보급 상황을 살펴 항해한다',value:i})),Object.assign({},G.Scenes.mateSpeaker('first'),{raw:true,lang:3})),seaQuestion);
  const seaQuestionPages=await readPages(seaQuestion,true);await page.locator('.askrow button').last().click();await page.waitForFunction(()=>dialogResolved);assert.strictEqual(await page.evaluate(()=>dialogResult),8);
  cases.push({name:'바다의 긴 질문·선택지 9개·마지막 항로 선택',pages:seaQuestionPages,passed:true});
  assert.deepStrictEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({cases,errors},null,2));
  console.log(JSON.stringify({cases,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
