/* 궁정 후원자의 재위일·수도·초상 짝과 실제 건물 목록 검사. */
'use strict';
const assert = require('node:assert/strict');
const fs=require('fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
(async function () {
  const browser = await chromium.launch({executablePath:process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--no-sandbox','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const errors = [];
  try {
    const page = await browser.newPage({viewport:{width:900,height:540}});
    page.on('pageerror', e=>errors.push(e.message));
    page.on('console', m=>{ if(m.type()==='error') errors.push(m.text()); });
    await page.addInitScript(()=>{localStorage.setItem('pu.lang','ko');window.requestAnimationFrame=()=>0;});
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.resolve(__dirname,'../index.html')).href),{waitUntil:'load',timeout:180000});
    const report = await page.evaluate(async () => {
      const H=G.CourtHistory, SP=G.Sponsor, game=G.Game;
      G.State.newGame({name:'궁정검사',nation:'PT',job:'adventurer',age:24,birth:{m:1,d:1},st:{str:65,int:65,mar:65,cha:65},sk:{},lg:{},diff:'normal'});
      const s=game.state, date=n=>({y:Math.floor(n/10000),m:Math.floor(n/100)%100,d:n%100});
      function eq(a,b,label){if(a!==b)throw Error(label+' '+JSON.stringify(a)+' != '+JSON.stringify(b));}
      const entries=[
        ['it_pope',15900914,null],['it_pope',15900915,'우르바노 7세'],['it_pope',15900927,'우르바노 7세'],['it_pope',15900928,null],
        ['it_pope',16050401,'레오 11세'],['it_pope',17001123,'클레멘스 11세'],['kr_king',16230412,'광해군'],['kr_king',16230413,'인조'],
        ['es_crown',17001031,'카를로스 2세'],['es_crown',17001101,'펠리페 5세'],['nl_stad',16600601,null],
        ['jp_emperor',16300101,'메이쇼 천황'],['se_king',16490101,'크리스티나 여왕'],['de_emperor',16571201,null],
        ['cn_ming',16200903,'태창제'],['cn_ming',16440615,null],['cn_qing',16431008,'순치제'],
        ['cn_qing',16100101,null],['kr_women',16200101,null],['kr_women',16230413,'인목왕후'],['kr_inhyeon',16890618,null],['kr_inhyeon',16940505,'인현왕후'],['kr_seja',16250304,null],['kr_seja',16250305,'소현세자'],['kr_seja',16670214,'세자 이순'],['kr_seja',16900720,null],['kr_seja',16900721,'세자 이윤'],['kr_king',17001231,'숙종'],['kr_seja',17001231,'세자 이윤'],
        ['it_doge',16560529,'프란체스코 코르나로'],['hu_king',16090101,'마차시 2세'],['ru_prince',16050501,'표도르 2세']];
      for(const [id,n,expect] of entries){s.date=date(n);eq(SP.holder(G.SPONSOR[id]),expect,id+' '+n);}
      s.date=date(16450101);eq(G.SPONSOR.jp_shogun.city,297,'에도');eq(G.SPONSOR.cn_qing.city,188,'북경');
      eq(G.SPONSOR.hu_king.city,330,'프레스부르크');
      s.date=date(16550101);eq(G.Court.realmOf(G.SPONSOR.en_king),null,'공화정');eq(G.SPONSOR.en_king.title,'잉글랜드 호국경','호칭');
      for(const sp of G.SPONSORS.filter(x=>x.historicalCourt)){
        const hs=sp.holders.filter(h=>h[1]>1580&&h[0]<1701);
        for(let i=0;i<hs.length;i++){if(hs[i][0]>=hs[i][1]||(i&&hs[i-1][1]>hs[i][0]))throw Error('겹친 재위 '+sp.id+' '+JSON.stringify(hs[i]));}
      }
      const numbers=new Set([15800101,17001231,...Object.keys(H.changes).map(Number)]);
      let min=Infinity;
      for(const n of numbers){
        s.date=date(n);
        const counts={};
        for(const sp of G.SPONSORS){if(SP.present(sp)) counts[sp.city]=(counts[sp.city]||0)+1;}
        for(const [city,a,b] of H.capitals)if(n>=a&&n<b){let v=counts[city]||0;if(v<5)throw Error('후견인 부족 '+city+' '+n+' '+v);min=Math.min(min,v);}
      }
      const imgs=Object.keys(H.people);
      for(const id of imgs){ const key='portraits/sponsors/court1580/'+id;
        if(!G.IMAGE_FILES[key] || !G.IMAGE_FILES[key+'_half'])throw Error('초상 누락 '+id); }
      const used = new Set(G.SPONSORS.flatMap(sp=>sp.holders.map(h=>h[6])).filter(Boolean));
      for(const id of imgs)if(!used.has(id))throw Error('아무도 쓰지 않는 초상 '+id);
      const C=G.Scenes.city;
      for(const n of [15800101,16170601,16490601,16901231,17001231]){
        s.date=date(n);
        for(const [city,a,b] of H.capitals)if(n>=a&&n<b){
          const town=G.CITY_DATA[city];
          const patrons=C.buildings(town).filter(x=>x.kind==='palace'||x.kind==='mansion').map(x=>C.B[x.kind].sp(town,x.arg)).filter(x=>x&&SP.present(x));
          if(new Set(patrons.map(x=>x.id)).size<5)throw Error('도시 메뉴 부족 '+town.name+' '+n);
        }
      }
      const baseline=s.date=date(16200101), sp=G.SPONSOR.kr_king;
      eq(G.Succession.curKey(sp),'kr_king:1608:광해군','기존 알현 기록');
      const portraitImage = new Image(); portraitImage.src=G.Img.src('portraits/sponsors/court1580/gwanghae_half'); await portraitImage.decode();
      eq(portraitImage.naturalHeight,1152,'실제 인물상 크기');
      function portrait(person, pose, expected) {
        const pic=SP.face(person,pose);
        eq(G.Img.pick(G.Art.portraitKeys(pic.portrait)),expected,'얼굴 '+person.id);
        eq(G.Img.pick(pic.half),expected+'_half','인물상 '+person.id);
      }
      for (const pose of [undefined,'listen']) portrait(sp,pose,'portraits/history/br_gwanghae_king');
      const alts=Object.keys(G.IMAGE_FILES).filter(k=>k.startsWith('portraits/sponsors/court1580-poses/')&&!k.endsWith('_half'));
      eq(alts.length,16,'대화 자세 수');
      for (const key of alts) {
        const id=key.split('/').pop().replace(/_listen$/,'');
        eq(G.Img.pick(G.Img.chain.sponsor(sp,'court1580/'+id,'listen')),key,'대화 자세 '+id);
        eq(G.Img.has(key+'_half'),true,'대화 인물상 '+id);
      }
      function room(id,expected) {
        const seat=G.SPONSOR[id], city=G.CITY_DATA[seat.city];
        const venue=H.venue(seat.bld,city,id);
        eq(venue.profile,expected,'접견처 '+id);
        for(const [side,folder] of [['exterior','exteriors'],['interior','interiors']]) {
          const chain=G.Img.chain[side](seat.bld,city,id);
          if(!chain.includes(folder+'/court1580/'+expected)||!G.Img.pick(chain)) throw Error(side+' '+id);
        }
      }
      room('kr_king','kr_throne');room('kr_seja','kr_east');room('kr_sugwang','kr_office');
      room('kr_heojun','kr_clinic');room('kr_hongsuneon','kr_interpret');room('jp_emperor','jp_palace');
      room('jp_shogun','jp_castle');room('it_pope','rome');room('it_doge','venice');
      const buildings=Object.keys(G.IMAGE_FILES).filter(k=>k.startsWith('exteriors/court1580/'));
      eq(buildings.length,39,'건물 외관 수');
      for(const key of buildings)eq(G.Img.has(key.replace('exteriors/','interiors/')),true,'건물 실내 '+key);
      portrait(G.SPONSOR.kr_seja,'listen','portraits/sponsors/court1580-poses/yi_ji_listen');
      const reachable=new Set();
      for(const n of [15800601,15941101,16000601,16170601,16280601,16450501,16550101,16660901,16890601,17000601]){
        s.date=date(n);
        for(const seat of G.SPONSORS){
          if(!SP.present(seat))continue;
          const city=G.CITY_DATA[seat.city], venue=H.venue(seat.bld,city,seat.id);
          if(venue && venue.profile)reachable.add(venue.profile);
        }
      }
      for(const key of buildings)if(!reachable.has(key.split('/').pop()))throw Error('후견인이 사용하지 않는 건물 '+key);
      s.date=date(16000101);eq(G.Art.sponsorPic(G.SPONSOR.kr_seja,SP.holderIndex(G.SPONSOR.kr_seja)),'court1580/cp_gwanghae','세자 복식');
      portrait(G.SPONSOR.kr_seja,'listen','portraits/history/gwanghae');
      const royalCity=G.CITY_DATA[sp.city];
      room('kr_king','kr_temp');
      const temporary=C.interior(sp.bld,royalCity,sp.id);
      s.date=baseline;
      const restored=C.interior(sp.bld,royalCity,sp.id);
      if(temporary===restored)throw Error('천도 뒤에도 이전 알현실을 사용함');
      const before=SP.holder(sp);const court=G.Dominion.leader('조선');eq(court.name,before,'지도·궁정 일치');
      const officials=G.SPONSORS.filter(x=>x.historicalGreeting).length;
      s.date=date(16170101);eq(SP.holder(G.SPONSOR.kr_sugwang),'이수광','순천부사');
      const town=G.CITY_DATA[334];eq(G.R.facilities(town).mansion.includes('kr_sugwang'),true,'관아 출입');
      for(const county of [334,335,336,337])eq(G.R.facilities(G.CITY_DATA[county]).palace,false,'지방 고을 왕궁 '+county);
      const keys=['kr_sugwang','kr_heojun','kr_gyeyang','kr_janghyeon'];
      for(const id of keys)if(!G.SPONSOR[id].historicalGreeting)throw Error('첫 대사 '+id);
      s.date=date(15900927);s.spHolder={};s.player.born=date(15600101);G.Succession.sync();game.newDay();
      eq(G.U.dateNum(s.date),15900928,'일일 진행으로 공위에 진입');
      eq(s.spHolder.it_pope,null,'공위 시작 당일 계승');
      s.contract={sponsor:'it_pope'};eq(SP.caretaker(G.SPONSOR.it_pope),true,'공위 중 계약 보고');s.contract=null;
      s.date=date(16170101);
      const local=C.buildings(town).find(x=>x.arg==='kr_sugwang');
      eq(local.name,'순천도호부 관아','도시 메뉴 관아');
      const magistrate=C.B[local.kind].sp(town,local.arg);
      eq(SP.holder(magistrate),'이수광','관아 후원자');
      return {dates:entries.length,boundaries:numbers.size,capitals:H.capitals.length,min,portraitPairs:imgs.length,officials,royalListeningPoses:alts.length,eventRoles:Object.keys(H.eventPortraits).length,venuePairs:buildings.length};
    });
    const output=process.env.OUT||path.join(__dirname,'../artifacts/courts1580_browser');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'browser-checks.json'),JSON.stringify({...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),report,errors},null,2));
    assert.deepEqual(errors,[]); console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
