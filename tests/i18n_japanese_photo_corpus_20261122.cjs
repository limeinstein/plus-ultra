/* 실제 fmt·heirScene 코드를 그대로 실행해 일본어 전체 이야기 자료와 세대 변형을 검사한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.join(root,'artifacts/i18n-ja-photo-20261122/corpus.json');
const c=vm.createContext({document:{body:null,documentElement:{dataset:{}},querySelector:()=>null,addEventListener(){}},navigator:{languages:['ko-KR']},location:{protocol:'file:'},localStorage:{getItem:()=>null}});
vm.runInContext('window=globalThis;G={};',c);
for(const file of ['js/core/util.js','js/data/base.js','js/core/i18n.js','js/lang/ja.js','js/data/story.js','js/data/voices_c.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
const runtime=fs.readFileSync(path.join(root,'js/systems/story.js'),'utf8');
const fmt=runtime.slice(runtime.indexOf('  function fmt(t) {'),runtime.indexOf('\n  // ================================================================ 사건 컷'));
const heir=runtime.slice(runtime.indexOf('  function heirText(t) {'),runtime.indexOf('  ST._heirScene = heirScene;'));
vm.runInContext(`var D=G.STORY;var state={player:{name:D.name,given:D.given,wife:'carmen',kids:[{name:'가브리엘'}]},story:{}};
var U=G.U;function S(){return state;}function T(){return state.story;}function gen(){return state.player.generation;}function homeKid(){return state.player.kids[0];}function lineRec(){return state.story.lineRec;}
var ST={motherName:function(){return '테레사';},grandma:function(){return {name:'레오노르 할머니'};}};
${runtime.match(/  ST\.kin = function \(\) \{[^\n]+/)[0]}
${runtime.match(/  ST\.heirMode = function \(\) \{[^\n]+/)[0]}
G.Family={wifeName:function(){return '카르멘';},kidName:function(k){return k.name;}};G.Game={state:state};G.I18N.lang='ja';
${fmt}\n${heir}`,c);
const report=vm.runInContext(`(function(){
 var rows=[];function walk(v,key){if(typeof v==='string'&&/[가-힣]/.test(v)){v.split('\\f').forEach(function(t){if(t.trim())rows.push({key:key,t:t});});}else if(Array.isArray(v))v.forEach(function(x,n){walk(x,key+'.'+n);});else if(v&&typeof v==='object')Object.keys(v).forEach(function(k){walk(v[k],key+'.'+k);});}walk(D,'photo');
 var missing=[],checked=0;
 function check(t,key,g,f){t=fmt(t);t.split('\\f').forEach(function(part){var tr=G.I18N.tr(part,true);checked++;if(!tr||/[가-힣]|⟦|⟧|\\$\\d|\\{[^}]+\\}/.test(tr))missing.push({key:key,generation:g,forced:f,raw:part,tr:tr});});}
 [1,2,3].forEach(function(g){[false,true].forEach(function(forced){state.player.generation=g;state.story.lineRec={dad:'마테우스 다 코스타',dadGiven:'마테우스',forced:forced};rows.forEach(function(row){if(g===1&&/\.homeLife\.heir\.|\.ending\.heir|\.heirTrace\./.test(row.key))return;check(row.t,row.key,g,forced);});if(g>1)Object.keys(D.scenes).forEach(function(id){['scene','memory'].forEach(function(k){heirScene(id,D.scenes[id][k]||[]).forEach(function(ln){if(Array.isArray(ln))check(ln[1],'heirScene.'+id+'.'+k,g,forced);});});});});});
 return {uniqueOriginalLines:new Set(rows.map(function(r){return r.t;})).size,checks:checked,missing:missing.filter(function(m,i,a){return a.findIndex(function(x){return x.raw===m.raw;})===i;})};
})()`,c);
report.details=vm.runInContext(`(function(){
 var stories=0,checks=0,missing=[];
 function check(ko,key){var ja=G.I18N.tr(ko,true);checks++;if(!ja||/[가-힣]|⟦|⟧/.test(ja))missing.push({key:key,ko:ko,ja:ja});}
 ['giacomo','anselmo','estevao'].forEach(function(id){G.VOICES[id].stories.forEach(function(s){stories++;check('「'+s.t+'」\\n'+s.l.join('\\n'),id+'.'+s.t);s.l.forEach(function(line){check(line,id);});});});
 G.SKILLS.forEach(function(sk){check(sk.desc,sk.id);check(sk.name+' · 지금 2 / 본디 1단계\\n'+sk.desc,sk.id+'.tooltip');});
 return {mateStories:stories,skillDescriptions:G.SKILLS.length,checks:checks,missing:missing};
})()`,c);
assert.deepEqual(Array.from(report.details.missing),[],'동료 개인 이야기·특기 설명 누락');
const previous=process.env.PREVIOUS_JA_FILE||path.join(root,'artifacts/i18n-ja-photo-20261122/ja-before.js');
if(fs.existsSync(previous)){
 let before;vm.runInNewContext(fs.readFileSync(previous,'utf8'),{window:{G:{I18N:{add(id,pack){before=pack;}}}}});
 const after=c.G.I18N.packs.ja;
 for(const kind of ['text','name','city','good'])for(const [key,value]of Object.entries(before[kind]))assert.equal(after[kind][c.G.I18N.norm(key)],value,kind+': '+key);
 const pats=new Map(after.pat.map(([pattern,value])=>[pattern.source,value]));
 for(const [pattern,value]of before.pat)assert.equal(pats.get(new RegExp(pattern).source),value,pattern);
 for(const [group,parts]of Object.entries(before.person))for(const [key,value]of Object.entries(parts))assert.equal(after.person[group][c.G.I18N.norm(key)],value,group+': '+key);
 report.preservation={unchanged:true,text:Object.keys(before.text).length,pat:before.pat.length,name:Object.keys(before.name).length,city:Object.keys(before.city).length,good:Object.keys(before.good).length,person:Object.values(before.person).reduce((sum,parts)=>sum+Object.keys(parts).length,0)};
}
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({originals:report.uniqueOriginalLines,checks:report.checks,details:report.details,missing:report.missing.length}));
if(process.env.JA_PHOTO_COLLECT!=='1')assert.equal(report.missing.length,0,'사진 이야기 자료·실제 치환의 번역 누락: '+output);
