/* 첨부 도감의 빈 이야기·왕실·세계 소식과 실제 선택되는 인물 원화를 대조한다. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'artifacts/missing-event-art-20261110');
const ctx=vm.createContext({console,performance,document:{readyState:'loading'},addEventListener(){}});ctx.window=ctx;ctx.G={};
function run(f){vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});}
for(const f of [...fs.readFileSync(path.join(ROOT,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]))if(f==='js/core/util.js'||f.startsWith('js/data/'))run(f);
for(const f of ['images/manifest.js','js/core/images.js','js/art/paint.js','js/art/portrait.js'])run(f);
const G=ctx.G;G.Game={state:{date:{y:1560,m:1,d:1},player:{},mates:[]}};
run('js/data/catalogscenes.js');
const stories=G.CATALOG_SCENES.filter(x=>/^legend-events\/(cv_|pr_)/.test(x.key)).map(x=>({...x,exists:G.Img.has(x.key)}));
const portraits=[...(G.COLONVOY_FIGS||[]),...(G.PIRIMAP_FIGS||[])].map(id=>{
 const f=G.HIST_FIG[id],sp=G.Hist.speaker(id),face=G.Img.pick(G.Art.portraitKeys(sp.portrait)||[]),half=G.Img.pick(sp.half||[]);
 return {id,...f,selectedFace:face,selectedHalf:half,dedicatedFace:G.Img.has(f.face||'portraits/history/'+id),dedicatedHalf:G.Img.has((f.face||'portraits/history/'+id)+'_half')};
});
const m=G.MATE.cv_mendez;portraits.push({id:m.id,name:m.name,look:m.desc,selectedFace:G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(m.id))),selectedHalf:G.Img.pick(G.Img.chain.mateHalf(m.id)),dedicatedFace:G.Img.has('portraits/mates/cv_mendez'),dedicatedHalf:G.Img.has('portraits/mates/cv_mendez_half')});
const relations=G.REL_EVENTS.map(x=>({...x,exists:!!(x.img&&G.Img.has(x.img))}));
const history=G.HISTORY.filter(x=>x.text).map((x,i)=>({...x,index:i,exists:!!(x.img&&G.Img.has(x.img))}));
const available=Object.entries(G.IMAGE_FILES).filter(([k])=>/^(legend-events|history-events|relation-events|achievement-events)\//.test(k)).map(([key,file])=>({key,file}));
fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'audit.json'),JSON.stringify({stories,portraits,relations,history,available},null,2));
console.log(JSON.stringify({stories:stories.length,missingStories:stories.filter(x=>!x.exists).length,portraits:portraits.length,missingPortraits:portraits.filter(x=>!x.dedicatedFace||!x.dedicatedHalf).length,relations:relations.length,history:history.length}));
console.log('이야기',stories.filter(x=>!x.exists).map(x=>x.key+': '+x.name).join('\n'));
console.log('인물',portraits.map(x=>x.id+': '+x.name+' / '+x.dedicatedFace+'/'+x.dedicatedHalf).join('\n'));
console.log('왕실',relations.map(x=>x.id+': '+x.title).join('\n'));
console.log('세계',history.map(x=>x.index+': '+x.text.split('.')[0]).join('\n'));
