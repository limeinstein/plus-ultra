/* 교역 성장·회복 재고·왕실 승급·기념 사업을 실제 file:// 게임에서 검증한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), cp = require('child_process');
const {pathToFileURL} = require('url');
let chromium; try { ({chromium} = require('playwright')); } catch (_) { ({chromium} = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/commerce-progression-20261103');
fs.mkdirSync(OUT, {recursive:true});
(async () => {
  const browser = await chromium.launch({executablePath:process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
  const errors = [], report = {};
  try {
    // 이전 규칙과 같은 전체 자료·게임 시작 조건에서 비교한다.
    const oldPage = await browser.newPage({viewport:{width:960,height:640}});
    const prior = new Map();
    for (const f of ['index.html','js/data/base.js','js/data/ships.js','js/data/eratrade.js','js/core/rules.js','js/systems/era.js','js/city/trade.js','js/systems/court.js','js/systems/matedismiss.js','js/city/misc.js','js/city/shipyard.js','js/ui/info.js']) prior.set(f, cp.execFileSync('git',['show','HEAD:'+f],{cwd:ROOT,encoding:'utf8',maxBuffer:8e6}));
    await oldPage.route('**/*', route => { const url=decodeURIComponent(route.request().url()), rel=url.slice(url.indexOf('/WebGame/')+9); return prior.has(rel) ? route.fulfill({body:prior.get(rel),contentType:rel.endsWith('.html')?'text/html':'application/javascript'}) : route.continue(); });
    await oldPage.addInitScript(()=>{requestAnimationFrame=()=>0;});
    await oldPage.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
    await oldPage.waitForFunction(()=>window.G&&G.State&&G.Court);
    const metrics = () => {
      const s=G.Game.state=G.State.newGame({name:'교역검사',nation:'PT',job:'merchant',age:22,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
      s.date={y:1480,m:1,d:1};s.day=0;s.invest={};s.econ={ev:[],seq:0,seeded:1};s.tfleet={open:{},told:{}};
      const c=G.CITY_DATA.find(c=>c.name==='카사블랑카'),lis=G.CITY_DATA[0];
      if(G.BALANCE.commerce)s.invest[c.id]={amt:G.R.investLevels(c.id)[2],version:2,div:0,t:0};else s.invest[c.id]={amt:12000,div:0,t:0};
      const id='ambergris',buy=G.R.buyPrice(c,id),q=G.R.supply(c,id);let sellTotal=0;
      for(let n=0;n<q;n++){sellTotal+=G.R.sellPrice(lis,id);G.R.onSell(lis,id,1);}
      return {largeCarrack:G.SHIP.lcarrack.price,caravel:G.SHIP.caravel.price,fluyt:G.SHIP.fluyt.price,crew100:G.BALANCE.crewWage.per*100,
        prizeValue:G.R.shipValue(G.R.newShip('lcarrack')),firstExpansion:G.R.investLevels?G.R.investLevels(c.id)[2]:G.R.INVEST_LV[2],rareStock:q,buy,rareGrossMargin:sellTotal-q*buy};
    };
    report.before=await oldPage.evaluate(metrics);await oldPage.close();
    const page=await browser.newPage({viewport:{width:960,height:720}});
    page.on('pageerror',e=>errors.push('pageerror: '+e.stack));
    page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
    await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);requestAnimationFrame=cb=>window.__pauseFrames?0:raf(cb);});
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>window.G&&G.Patronage&&G.Court&&G.Scenes.city.B.trade&&G.Game.sceneName==='title'&&!document.querySelector('#boot-loader.on'),null,{timeout:120000});
    await page.evaluate(()=>{window.__pauseFrames=true;});
    report.after=await page.evaluate(metrics);
    assert.equal(report.after.crew100,report.before.crew100*3);assert.equal(report.after.prizeValue,report.before.prizeValue,'나포선·기존 배의 매각 수익은 새 배값으로 급증하지 않는다');
    assert(report.after.firstExpansion>report.before.firstExpansion*2);
    assert(report.after.largeCarrack/report.after.rareGrossMargin>report.before.largeCarrack/report.before.rareGrossMargin*3);
    report.rules=await page.evaluate(async()=>{
      function ok(v,m){if(!v)throw Error(m);}
      const R=G.R,CT=G.Court,UI=G.UI,B=G.BALANCE;
      function fresh(){const s=G.Game.state=G.State.newGame({name:'경제검사',nation:'PT',job:'merchant',age:22,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});s.date={y:1480,m:1,d:1};s.day=0;s.invest={};s.player.gold=100000000;s.settings.autosave=false;s.econ={ev:[],seq:0,seeded:1};s.tfleet={open:{},told:{}};return s;}
      let s=fresh();const casa=G.CITY_DATA.find(c=>c.name==='카사블랑카'),lis=G.CITY_DATA[0];
      s.invest[casa.id]={amt:12000,div:0,t:0};ok(R.investLv(casa.id)===2,'기존 투자 등급 보존');
      s=fresh();ok(R.investLv(casa.id)===0,'새 게임 투자 등급');s.invest[casa.id].amt=12000;ok(R.investLv(casa.id)===1,'새 게임 12000닢에 희귀품 미개방');
      const preview=R.cityGoods(casa,2).filter(id=>!R.cityGoods(casa,0).includes(id));ok(preview.includes('ambergris'),'투자 품목 미리 보기: '+JSON.stringify(preview));
      s.invest[casa.id].amt=R.investLevels(casa.id)[2];
      const all=R.cityGoods(casa),stocks=all.map(id=>({id,q:R.supply(casa,id),rate:R.stockRate(casa,id)}));
      for(const {id,q} of stocks){R.onBuy(casa,id,q);ok(R.supply(casa,id)===0,'동일 날짜 완판 뒤 바닥 재고 재생 방지 '+id);for(let i=0;i<10;i++)ok(R.supply(casa,id)===0,'창 재방문 무한 공급 방지');}
      s.day=3;
      const recovery=stocks.map(x=>({id:x.id,q:R.supply(casa,x.id),rate:x.rate}));
      ok(recovery.every(x=>x.q>=1),'완판 후 모든 품목 재입하');
      ok(recovery.filter(x=>G.GOOD[x.id].cat==='food').some(x=>x.q>=30),'일반 식량 교역 재개');
      ok(recovery.find(x=>x.id==='ambergris').q<recovery.find(x=>x.id==='wheat').q,'품목별 회복 속도 차이');
      for(const x of recovery)ok(x.q<=Math.ceil(x.rate*3),'회복 물량 보존 '+x.id);
      const same=R.supply(casa,'ambergris');s.day=-1;R.supply(casa,'ambergris');s.day=3;ok(R.supply(casa,'ambergris')===same,'날짜 역행·복귀로 추가 입하 없음');
      s.day=100;ok(R.supply(casa,'ambergris')===R.stockCapacity(casa,'ambergris'),'시간 경과 뒤 희귀품 전량 회복');
      const base=R.stockRate(casa,'ambergris'),cap=R.stockCapacity(casa,'ambergris'),demand=R.satCap(casa,'guns');
      ok(R.buildProject(casa,'production'),'생산시설 건설');ok(R.stockRate(casa,'ambergris')>base&&R.stockCapacity(casa,'ambergris')>cap,'생산 투자 효과');
      ok(R.buildProject(casa,'warehouse'),'상관 건설');ok(R.buildProject(casa,'distribution')&&R.satCap(casa,'guns')>demand,'판로 투자 효과');
      for(let i=0;i<6;i++)R.buildProject(casa,'production');ok(R.projectLv(casa,'production')===3&&!R.buildProject(casa,'production'),'시설 한도');
      const mate=G.MATES.find(m=>m.wage>0&&!m.rival);ok(R.mateWage(mate.id)===mate.wage*3,'동료 급료 정확히 세 배');
      s.mateDismiss={[mate.id]:{count:1,wage:mate.wage+10}};ok(R.mateWage(mate.id)===(mate.wage+10)*3,'재고용 급료 중복 배율 방지');
      s.mates=[{id:mate.id,loyal:80,role:'crew'}];const wage=G.Cabins.totalWages(),cash=s.player.gold;G.World.newMonth();ok(s.player.gold===cash-wage,'실제 월말 급료 결제와 안내 일치');
      s.player.gold=10000000;const fame=s.player.fame,money=s.player.gold,cost=G.Patronage.cost(lis,'atlas');
      ok(G.Patronage.contribute(lis,'atlas'),'기념 사업 후원');ok(s.player.gold===money-cost&&s.player.fame===fame,'후원은 명성·금화 수익 없이 비용과 명판만');
      s.patronage=JSON.parse(JSON.stringify(s.patronage));ok(G.Patronage.records()[0].record.plaques[0].name==='경제검사','후원 저장 호환');
      for(let i=0;i<10;i++)G.Patronage.contribute(lis,'atlas');ok(G.Patronage.level(lis,'atlas')===5&&!G.Patronage.contribute(lis,'atlas'),'기념 사업 최고 단계·재결제 방지');
      const saved={say:UI.say,alert:UI.alert,toast:UI.toast,confirm:UI.confirm,choose:UI.choose,ask:UI.ask,refresh:G.Game.refreshHud,onFame:G.Achieve.onFame};
      G.Achieve.onFame=()=>{}; // 헌납 결제 검사는 별도 업적 하사금과 분리한다.
      UI.say=async()=>{};UI.alert=async()=>{};UI.toast=()=>{};UI.confirm=async()=>true;UI.ask=async()=>0;G.Game.refreshHud=()=>{};
      try{
        s=fresh();s.player.fame=1000000;s.player.fameBy={ex:1000000,tr:0,bt:0,so:0};const king=G.SPONSOR.pt_king,realm=CT.realmOf(king),rankLog=[];
        UI.choose=async(_,opts)=>{const x=opts.find(x=>x.value&&x.value.kind==='tribute');return x?x.value:null;};
        let prevCost=0;
        for(let rank=0;rank<CT.ladder(realm).length;rank++){
          ok(CT.pending(king),'마지막까지 왕명 가능 '+rank);
          const offers=CT.offers(king),tribute=offers.find(o=>o.kind==='tribute'),supply=offers.find(o=>o.kind==='supply');
          ok(tribute&&supply,'모든 단계에 헌납·분할 납품 선택지');ok(tribute.amount>prevCost,'직급별 요구 금액 증가');prevCost=tribute.amount;
          const before=s.player.gold;await CT.audience(king);ok(CT.rank(realm)===rank+1&&s.player.gold===before-tribute.amount,'헌납과 승급 정확히 한 번: '+JSON.stringify({rank:CT.rank(realm),expected:rank+1,gold:s.player.gold,before,amount:tribute.amount}));
          const wait=CT.waitDays(realm);ok(wait>0&&!CT.pending(king),'연속 즉시 승급 금지');
          await CT.audience(king);ok(CT.rank(realm)===rank+1,'대기 중 반복 알현');
          const foreign=G.SPONSOR.en_king;ok(!CT.pending(foreign),'다른 나라로 바꿔 즉시 승급 방지');
          rankLog.push({rank:rank+1,cost:tribute.amount,day:s.day,wait});
          s.day+=wait-1;ok(!CT.pending(king),'승급 대기 경계 하루 전');s.day++;
          s.date=G.U.addDays({y:1480,m:1,d:1},s.day);
        }
        ok(!CT.pending(king)&&CT.rank(realm)===8,'최고 작위까지 도달·사다리 상한');
        s=fresh();s.player.fame=1000000;s.court={titles:{PT:7},pacingVersion:1,promotions:{PT:{rank:7,day:-540}}};
        let letter;for(let i=0;i<100&&!letter;i++){s.seed=i;s.court.offers={};letter=CT.offers(king).find(o=>o.kind==='letter');}
        ok(letter&&letter.funds===B.commerce.court.diplomaticFunds[7],'상위 외교 준비금 증가');
        UI.choose=async(_,opts)=>{const x=opts.find(x=>x.value&&x.value.kind==='letter');return x?x.value:null;};
        const dipCash=s.player.gold;await CT.audience(king);ok(CT.task().kind==='letter'&&s.player.gold===dipCash-letter.funds,'외교 준비금 한 번 결제');
        await CT.audience(king);ok(s.player.gold===dipCash-letter.funds,'진행 중 왕명 재알현 이중 결제 방지');
        s=fresh();s.player.fame=20000;s.player.fameBy={ex:20000,tr:0,bt:0,so:0};
        UI.choose=async(_,opts)=>{const x=opts.find(x=>x.value&&x.value.kind==='supply');return x?x.value:null;};await CT.audience(king);
        const task=CT.task(),total=task.qty;ok(total>20,'첫 납품 규모');
        s.fleet.cargo[task.good]={q:15,cost:10,from:10,d:s.day};ok(CT.deliverSupply(task,15)===15&&!CT.progress(task).done,'소형선 분할 납품');
        s.fleet.cargo[task.good]={q:total-15+3,cost:10,from:10,d:s.day};await CT.report(king);
        ok(CT.rank(realm)===1&&!CT.task()&&s.fleet.cargo[task.good].q===3,'분할 납품 완결·남은 짐 보존');
        s=fresh();s.court={titles:{PT:7}};ok(!CT.pending(king)&&CT.rank(realm)===7,'옛 저장 작위 보존·대기 최초 적용');
        return {recovery,rankLog,finalPromotionYears:rankLog[7].day/365,checks:'재고·투자·임금·후원·8단계 승급·분할 납품·옛 저장 통과'};
      }finally{Object.assign(UI,{say:saved.say,alert:saved.alert,toast:saved.toast,confirm:saved.confirm,choose:saved.choose,ask:saved.ask});G.Game.refreshHud=saved.refresh;G.Achieve.onFame=saved.onFame;}
    });
    report.history=await page.evaluate(()=>{
      const s=G.Game.state,R=G.R,E=G.Era,C=name=>G.CITY_DATA.find(c=>c.name===name);
      for(const rule of G.ERA_MARKETS)for(const name of rule.cities||[])if(!C(name))throw Error('소비시장 도시 이름: '+name);
      function priceAt(name,id,y){s.date={y,m:1,d:1};s.market={};return {demand:E.mult(C(name),id),price:R.sellPrice(C(name),id)};}
      return {cacaoSpain1600:priceAt('세빌리아','cacao',1600),cacaoLondon1600:priceAt('런던','cacao',1600),cacaoLondon1680:priceAt('런던','cacao',1680),
        sugarLondon1600:priceAt('런던','sugar',1600),sugarLondon1690:priceAt('런던','sugar',1690),teaLondon1640:priceAt('런던','tea',1640),teaLondon1690:priceAt('런던','tea',1690),silverChina1600:priceAt('광주','silver',1600),silverKorea1600:priceAt('한양','silver',1600),silverLisbon1600:priceAt('리스본','silver',1600),forecast:E.list().length};
    });
    assert(report.history.cacaoSpain1600.demand>report.history.cacaoLondon1600.demand*2);
    assert(report.history.cacaoLondon1680.demand>report.history.cacaoLondon1600.demand*2);
    assert(report.history.sugarLondon1690.demand>report.history.sugarLondon1600.demand);
    assert(report.history.teaLondon1690.demand>report.history.teaLondon1640.demand*3);
    assert(report.history.silverChina1600.demand>report.history.silverLisbon1600.demand);assert.equal(report.history.silverKorea1600.demand,1,'중국 소비 곡선이 조선에 적용되지 않는다');
    fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
    // 대화창을 실제로 열어 화면과 버튼을 확인한다.
    await page.evaluate(()=>{const s=G.Game.state;s.loc={mode:'city',city:0};s.player.gold=3000000;s.date={y:1650,m:1,d:1};s.player.born.y=1628;s.day=0;s.market={};s.invest={};G.Scenes.city.B.trade.invest(G.CITY_DATA[0]);});
    await page.getByText('품목 확장 계획',{exact:true}).waitFor();await page.screenshot({path:path.join(OUT,'investment.png')});
    await page.getByRole('button',{name:'돌아간다',exact:true}).last().click();
    await page.evaluate(()=>{G.Patronage.open(G.CITY_DATA[0]);});await page.getByText('모든 도시의 명판',{exact:true}).waitFor();await page.screenshot({path:path.join(OUT,'patronage.png')});
    await page.getByRole('button',{name:'돌아간다',exact:true}).last().click();
    await page.evaluate(()=>{G.Scenes.city.B.trade.buy(G.CITY_DATA[0]);});await page.getByText('고른 것 한꺼번에 산다',{exact:true}).waitFor();await page.screenshot({path:path.join(OUT,'supply.png')});
    assert(await page.locator('small').filter({hasText:'하루 +'}).count()>0);
    const dayBefore=await page.evaluate(()=>{window.__pauseFrames=false;return G.Game.state.day;});
    await page.getByRole('button',{name:'입하를 기다린다 (3일)',exact:true}).click();
    await page.getByRole('button',{name:'기다린다',exact:true}).click();
    await page.waitForFunction(d=>G.Game.state.day===d+3,dayBefore,{timeout:15000,polling:100});
    await page.getByText('고른 것 한꺼번에 산다',{exact:true}).waitFor();
    report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));assert.deepEqual(errors,[]);
    console.log(JSON.stringify(report,null,2));console.log('통과: 실제 게임 규칙·옛 저장·8단계 승급·경제 화면·콘솔 오류 0');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
