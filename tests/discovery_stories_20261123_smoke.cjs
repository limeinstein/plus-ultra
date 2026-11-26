/* 원고 전체의 연결·기함 배역·되풀이·새 발견 조건·옛 저장·부관·가족·길잡이·오류 수정을 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.OUT||path.join(root,'artifacts/discovery-stories-20261123');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--allow-file-access-from-files','--use-gl=angle', '--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[];
try{const p=await b.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.addInitScript(()=>{localStorage.setItem('pu.lang','ko');requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16)});
await p.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.G?.Game?.sceneName==='title',null,{timeout:120000});
const result=await p.evaluate(async()=>{
 const checks=[];function ok(v,t){if(!v)throw Error(t);checks.push(t)}
 function fresh(g='m'){const s=G.Game.state=G.State.newGame({name:'시험 제독',g,nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});s.settings.res=.35;s.settings.music=0;s.settings.sound=0;s.date={y:1650,m:6,d:1};s.flags.prologue=true;return s}
 let s=fresh(),DS=G.DiscStories,counts=G.DISC_STORY_COUNTS;
 ok(counts.scenarios===989&&counts.choruses===67&&counts.newDiscoveries===438,'925본+1·2권·재방문 989개, 합창 67개, 새 발견 438개');
 ok(G.DISCOVERIES.length===new Set(G.DISCOVERIES.map(d=>d.id)).size,'발견 ID 중복 없음');
 ok(G.MATES.length===new Set(G.MATES.map(d=>d.id)).size,'동료 ID 중복 없음');
 const sourceNumbers=[];for(const e of Object.values(G.DISC_STORIES))for(const r of e.scenarios)if(/^\d{3}$/.test(r.key))sourceNumbers.push(+r.key);
 ok(sourceNumbers.length===925&&new Set(sourceNumbers).size===925&&Math.min(...sourceNumbers)===1&&Math.max(...sourceNumbers)===925,'001~925 전부 연결, 예정 목록은 제외');
 s.mates=[];let plans=0,art=0;
 for(const [id,e]of Object.entries(G.DISC_STORIES)){
  const d=G.DISC[id],plan=DS.plan(d);ok(!!d&&!!plan&&plan.lines.length>0,'장면 '+id);
  ok(plan.lines.every(l=>l.text.trim()&&!/\{출항지\}|\{날수\}/.test(l.text)),'문구 '+id);DS.commit(plan);plans++;
  if(G.DISC_STORY_NEW.includes(id)){
   ok(Number.isFinite(d.lat)&&Number.isFinite(d.lon)&&['land','sea','city'].includes(d.how),'위치·발견법 '+id);
   ok(G.CLUE[id]==='talk'||G.CLUE[id]==='book','얻을 수 있는 단서 '+id);
   if(d.how==='city')ok(!!G.CITY_DATA[d.city],'도시 '+id);
   const cv=G.Art.discoveryArt(d,144,64);ok(cv&&cv.width===144&&cv.height===64,'기본 그림 '+id);cv.width=1;cv.height=1;art++;
  }
 }
 ok(plans===937&&art===438,'937개 발견물의 계획·438개 그림 전체 생성');
 s=fresh();s.mates=[];ok(DS.plan(G.DISC.monalisa).kind==='deck','1권도 부관이 없으면 전용 대사를 갑판장이 맡음');
 s.fleet.ships[0].type='galleon';s.fleet.ships[0].cabins=Array(17).fill('sick');s.fleet.ships[0].cabins[0]='deck';s.fleet.cabinUid=s.fleet.ships[0].uid;
 const cast=['rocco','triana','pinzon_m','pinzon_v','ibnmajid','pigafetta','elcano','orellana','ds_kaitau','ds_tekle','guan_yu','zhuge_liang','snow_white','cinderella','sleeping_beauty'];
 s.mates=cast.map((id,i)=>({id,role:['first','nav','surveyor','interp','purser'][i]||'none',...(i>=5?{room:i-4,roomType:'sick'}:{}),loyal:90}));
 let choruses=0;for(const [id,e]of Object.entries(G.DISC_STORIES))if(e.scenarios.some(r=>r.chorus)){const p=DS.plan(G.DISC[id]);ok(p.kind==='chorus'&&p.participants.length<=8&&new Set(p.participants).size===p.participants.length,'합창 인원 '+id);ok(p.participants.includes('rocco')&&p.lines.some(l=>l.who==='망대 선원'||/외침/.test(e.scenarios.find(r=>r.chorus).chorus.cast.find(c=>c.actor===l.who)?.tag||'')),'부관과 육지 외침 '+id);DS.commit(p);ok(DS.plan(G.DISC[id]).kind!=='chorus','합창은 한 번 '+id);choruses++}ok(choruses===67,'모든 합창의 기함 인원·한 번 조건');
 s=fresh();s.fleet.ships[0].type='galleon';s.fleet.ships[0].cabins=['deck','sick','galley','chapel','musicroom'];s.fleet.cabinUid=s.fleet.ships[0].uid;
 const all=G.MATES.filter(d=>!d.minor&&!d.mute),artist=all.find(d=>DS.role({id:d.id})==='예술가'&&d.id!=='rocco'),elder=all.find(d=>DS.role({id:d.id})==='노장'&&d.id!==artist.id);
 s.mates=[{id:'rocco',role:'first',loyal:90},{id:artist.id,role:'none',room:1,roomType:'sick',loyal:90},{id:elder.id,role:'nav',loyal:90},{id:'guan_yu',role:'captain',loyal:90},{id:'zhuge_liang',role:'none',loyal:90},{id:'lacosa',role:'interp',loyal:90}];
 ok(DS.crew().some(m=>m.id==='lacosa')&&!DS.crew().some(m=>m.id==='guan_yu'||m.id==='zhuge_liang'),'기함 고정 보직·선실만, 다른 배 선장과 대기는 제외');
 const chance=G.BALANCE.discStory.deputyChance;G.BALANCE.discStory.deputyChance=0;
 let a=DS.plan(G.DISC.canyon);ok(a.kind==='arc','해당 발견물 대응 인물이 주연');DS.commit(a);let a2=DS.plan(G.DISC.canyon);ok(a2.key!==a.key,'본 갈래를 되풀이하지 않음');
 s.mates.find(m=>m.id==='guan_yu').role='surveyor';a=DS.plan(G.DISC.guanyublade);ok(a.kind==='arc'&&a.actor==='guan_yu'&&a.lines.every(l=>!l.id||DS.crew().some(m=>m.id===l.id)),'관계 인물 우선, 없는 장비·유비는 발언하지 않음');
 G.BALANCE.discStory.deputyChance=1;a=DS.plan(G.DISC.canyon);ok(a.kind==='adj'&&a.actor==='rocco','부관 대체 갈래');G.BALANCE.discStory.deputyChance=chance;
 const before={gold:s.player.gold,found:s.stats.found,disc:JSON.stringify(s.disc)};DS.commit(a);const saved=G.State.serialize();G.Game.state=G.State.deserialize(saved);s=G.Game.state;ok(JSON.stringify(s.discStory.seen)===JSON.stringify(JSON.parse(saved).discStory.seen),'이야기 기록 저장·복원');ok(s.player.gold===before.gold&&s.stats.found===before.found&&JSON.stringify(s.disc)===before.disc,'이야기 보기가 발견 보상을 다시 주지 않음');
 delete s.discStory;s.settings.banter=false;ok(DS.plan(G.DISC.canyon)===null&&!s.discStory,'수다 끔·옛 저장의 기본값');s.settings.banter=true;G.I18N.lang='en';ok(!DS.enabled(),'새 원고 미번역 언어는 기존 관찰 대사를 사용');G.I18N.lang='ko';
 s=fresh('f');s.mates=[];const rec=G.DISC_STORIES.monalisa.scenarios.find(r=>r.key==='A4');ok(/엄마/.test(DS.familyText(rec,{kind:'딸'}))&&!/아빠/.test(DS.familyText(rec,{kind:'딸'})),'여성 제독에게 딸이 엄마로 부름');
 s.player.kids.push({name:'딸 시험',given:'딸',surname:'시험',sex:'f',born:{y:1640,m:1,d:1},bond:60});s.disc.monalisa={found:16500101,me:true};
 const say0=G.UI.say,spoken=[];G.UI.say=async(t,o)=>{if(o.heroSpeechAdapted)ok(G.R.heroSay(t,o)===t,'가족 원고의 성별 호칭 중복 변환 없음');spoken.push({text:t,name:o.name})};
 try{await DS.play(G.DISC.monalisa);ok(s.discStory.pending.length===1&&!spoken.some(x=>/엄마/.test(x.text)),'집에 있는 딸의 말은 나중으로');const at=s.player.home;ok(await DS.home(G.CITY_DATA[at],false)===0,'보고 전에는 가족 소식 보류');s.disc.monalisa.reported=true;ok(await DS.home(G.CITY_DATA[at],false)===1&&spoken.at(-1).name==='딸 시험'&&/엄마/.test(spoken.at(-1).text),'보고 뒤 자택에서 실제 딸의 말');ok(await DS.home(G.CITY_DATA[at],false)===0&&s.discStory.pending.length===0,'가족 소식도 한 번');}finally{G.UI.say=say0}
 const sibRec={family:{kind:'남동생',text:'형! 형도 갔어요?'}};ok(DS.familyText(sibRec,{kind:'여동생'}).startsWith('언니'),'여동생의 여성 제독 호칭');
 s=fresh();const mark=id=>s.disc[id]={found:16500101,me:true};mark('ds_557');mark('yak');const cal=G.CITY_DATA.find(c=>c.lon>=80&&c.lon<=94&&c.lat>=18&&c.lat<=30);
 ok(G.DiscoveryGuides.eligible('ds_tenzing',cal)&&!G.DiscoveryGuides.eligible('ds_tenzing',G.CITY_DATA[0]),'텐징은 셰르파 마을과 고산 발견 뒤 해당 지역에서만');
 const pac=G.CITY_DATA.find(c=>c.lat>=-45&&c.lat<=-10&&(c.lon>=165||c.lon<=-165));ok(!!pac&&!G.DiscoveryGuides.eligible('ds_kaitau',pac),'마오리 발견 전 길잡이 보류');mark('folk_maori');ok(G.DiscoveryGuides.eligible('ds_kaitau',pac),'마오리 발견 뒤 카이 타우');
 const af=G.CITY_DATA.find(c=>c.lon>=35&&c.lon<=46&&c.lat>=9&&c.lat<=23);mark('prester');ok(G.DiscoveryGuides.eligible('ds_tekle',af)&&!G.DiscoveryGuides.eligible('ds_tekle',cal),'테클레는 해당 아비시니아 항구에서만');
 const original={say:G.UI.say,confirm:G.UI.confirm,choose:G.UI.choose};G.UI.say=async()=>{};G.UI.confirm=async()=>true;G.UI.choose=async(t,opts)=>opts[0].value;
 try{
  ok(!await G.DiscoveryGuides.offer(G.DISC_GUIDES.find(x=>x.key==='tekle'),af),'선물 없으면 수도사 합류 안 함');
  const gift=Object.values(G.ITEM).find(x=>x.kind==='book');ok(!!gift,'선물용 실제 책');G.R.addItem(gift.id);const q=G.R.itemCount(gift.id);ok(await G.DiscoveryGuides.offer(G.DISC_GUIDES.find(x=>x.key==='tekle'),af),'책 선물 뒤 실제 합류');ok(G.R.itemCount(gift.id)===q-1&&!G.DiscoveryGuides.eligible('ds_tekle',af),'선물 한 개·합류 한 번');
 }finally{Object.assign(G.UI,original)}
 s=fresh();const sp=G.SPONSOR.jp_shogun;s.date.y=1572;const oldTitle=sp.title;s.date.y=1573;const mid=sp.title;s.date.y=1603;ok(oldTitle==='무로마치 쇼군'&&mid==='천하의 실권자'&&sp.title==='도쿠가와 쇼군','1573·1603 직함 경계');
 s.date.y=3000;const book=G.bookEarlyList().find(b=>/쿡/.test(b.author));ok(!!book,'쿡 필사본');const author=book.author;s.date.y=1580;ok(G.bookAnon(book)&&!/쿡/.test(book.title)&&!/쿡/.test(G.Disc.hintText(G.DISC[book.discs[0]])),'간행 전 제목·단서에서 쿡 이름 가림');s.date.y=book.y;ok(book.author===author&&!G.bookAnon(book),'간행 해에 원저자 복원');
 s=fresh();s.player.gold=0;const inn=G.Scenes.city.B.inn,c=G.CITY_DATA[0];ok(inn.relief(c)&&inn.reliefTarget(c)===3000,'배가 있으면 3000닢까지 여관 구제');s.fleet.ships=[];ok(inn.reliefTarget(c)>3000,'배가 없으면 최저가 배 밑천도 포함');
 s=fresh();s.story={end:'searching'};ok(G.Story.noHeirs()&&G.Life.maxAge()===100,'사진 이야기 미완료는 계승 잠금·100세');s.story.end='done';ok(!G.Story.noHeirs()&&G.Life.maxAge()===80,'이야기 완료 뒤 보통 수명');
 return {checks:checks.length,plans,art,counts};
});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({result,errors},null,2));console.log(JSON.stringify({passed:true,...result,errors}));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
