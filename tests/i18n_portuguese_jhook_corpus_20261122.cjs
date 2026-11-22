/* 해적여제 실제 자료 전체와 도시명·결말 치환을 검사한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/i18n-pt-jhook-20261122');
const c=vm.createContext({document:{body:null,documentElement:{dataset:{}},querySelector:()=>null,addEventListener(){}},navigator:{languages:['ko-KR']},location:{protocol:'file:'},localStorage:{getItem:()=>null}});
vm.runInContext('window=globalThis;G={};',c);
for(const f of ['js/core/util.js','js/core/i18n.js','js/lang/pt.js','js/data/cities.js','js/data/jhook.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const runtime=fs.readFileSync(path.join(root,'js/systems/jhook.js'),'utf8');
vm.runInContext(`var state={player:{given:'제시카',name:'제시카 후크'}};function S(){return state;}var currentCity=null;function curCity(){return currentCity;}
${runtime.match(/  function fmt\(t\) \{[^\n]+/)[0]}
G.I18N.lang='pt';`,c);
const report=vm.runInContext(`(function(){
 var rows=[],missing=[],checked=0;
 function walk(v,key){if(typeof v==='string'&&/[가-힣]/.test(v))v.split('\f').forEach(function(t){if(t.trim())rows.push({key:key,t:t});});else if(Array.isArray(v))v.forEach(function(x,n){walk(x,key+'.'+n);});else if(v&&typeof v==='object')Object.keys(v).forEach(function(k){walk(v[k],key+'.'+k);});}
 walk(G.JHOOK,'jhook');
 for(var city of [null,{name:'리스본'},{name:'항주'}]){currentCity=city;for(var row of rows){var raw=fmt(row.t),tr=G.I18N.tr(raw,true);checked++;if(!tr||/[가-힣]|⟦|⟧|⟪|⟫|\\$\\d|\\{[^}]+\\}/.test(tr))missing.push({key:row.key,raw:raw,tr:tr});}}
 return {uniqueOriginals:new Set(rows.map(function(r){return r.t;})).size,checks:checked,missing:missing.filter(function(m,i,a){return a.findIndex(function(x){return x.raw===m.raw;})===i;})};
})()`,c);
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'corpus.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({originals:report.uniqueOriginals,checks:report.checks,missing:report.missing.length}));
if(process.env.PT_JHOOK_COLLECT!=='1')assert.equal(report.missing.length,0,'해적여제 번역 누락');
