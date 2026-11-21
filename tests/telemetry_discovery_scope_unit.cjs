// 전송 계층은 외부 접속 없이 관찰한다. 실제 서비스 응답을 검사하는 시험과 분리한다.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'../js/core/telemetry.js'),'utf8');
for(const useScope of [true,false]){
 const all=[{id:'plain',name:'기본'},{id:'exclusive',name:'전용'}],payloads=[];let calls=0;
 const G={Game:{state:{player:{fame:0},loc:{mode:'sea',lon:1,lat:2},day:0,stats:{}}},CITY_DATA:[],DISCOVERIES:all,Disc:{foundByMe:()=>false},Scenes:{title:{version:'test'}}};
 if(useScope)G.Disc.forVoyage=()=>{calls++;return all.slice(0,1)};
 const window={G,PU_WEB_CHANNEL:'beta',PU_TELEMETRY_ENDPOINT:'https://example.invalid/api/event',crypto:{randomUUID:()=> 'unit'},addEventListener(){},setInterval(){}};
 const ctx={window,location:{protocol:'https:'},sessionStorage:{getItem:()=>null,setItem(){}},document:{hidden:false,addEventListener(){}},navigator:{sendBeacon:()=>true},Blob,crypto:window.crypto,fetch:(url,options)=>{payloads.push(JSON.parse(options.body));return Promise.resolve()}};
 vm.runInNewContext(code,ctx);assert.equal(calls,useScope?1:0);assert.equal(payloads.length,1);assert.deepEqual(Array.from(payloads[0].voyage.missingDiscoveries,x=>x.id),useScope?['plain']:['plain','exclusive']);
}
console.log('통과: 익명 항해 자료가 항해별 발견 목록을 사용하고, 구형 초기화에는 전체 목록으로 호환');
