/* 돛 개조의 저장값·비용·범장 선택. 그림은 js/art/saildesign.js에서 만든다. */
(function(G){'use strict';
  var D=G.SailDesign={};
  D.design=function(id){return G.SAIL_DESIGN[id]||G.SAIL_DESIGN.plain;};
  D.shape=function(id){return G.SAIL_SHAPES.filter(function(s){return s.id===id;})[0]||G.SAIL_SHAPES[0];};
  D.clean=function(sh){var design=D.design(sh.sailDesign).id;return {shape:D.shape(sh.sailShape).id,design:design,ink:design!=='plain'&&design!=='nation_dutch'&&/^#[0-9a-f]{6}$/i.test(sh.sailInk||'')?sh.sailInk.toLowerCase():null,color:/^#[0-9a-f]{6}$/i.test(sh.sailColor||'')?sh.sailColor.toLowerCase():null};};
  D.canShape=function(type,id){return id==='native'||type!=='geobukseon';};
  D.rigKey=function(type,opt){
    opt=opt||{};var shape=D.shape(opt.sailShape).id,t=G.SHIP[type];
    if(shape!=='native'&&D.canShape(type,shape))return 'shape:'+shape;
    if(type!=='geobukseon'&&opt.sails&&opt.sails.length&&opt.sails.join(',')!==t.sails.join(','))return 'sails:'+opt.sails.join(',');
    return '';
  };
  D.quote=function(c,sh,picked){
    var cur=D.clean(sh),next=D.clean(picked),b=G.BALANCE.sailRefit,t=G.SHIP[sh.type],n=Math.max(1,sh.sails.length),lines=[],rate=c?G.R.priceLevel(c,'ship'):1;
    function add(name,cost){lines.push({name:name,cost:Math.ceil(cost*rate/10)*10});}
    if(!D.canShape(sh.type,next.shape))return {blocked:'거북선은 덮개와 돛 접기 구조 때문에 선종 고유 범장을 유지합니다.',lines:[],total:0};
    if(cur.shape!==next.shape||(picked.sailReset&&next.shape==='native'&&D.rigKey(sh.type,sh)!==''))add('돛 모양·삭구 교체',Math.max(b.shapeMin,t.price*b.shapeRate)+n*b.shapeMast);
    if(cur.design!==next.design||cur.ink!==next.ink){var d=D.design(next.design),k=d.group==='plain'?(d.id==='plain'?'plain':'stripe'):d.group;add('도안 제작·문양 작업',Math.max(b.designMin[k],t.price*b.designRate[k])+n*b.patternMast);}
    if(cur.color!==next.color)add('바탕 천 염색',Math.max(b.clothMin,t.price*b.clothRate)+n*b.clothMast);
    return {lines:lines,total:lines.reduce(function(n,l){return n+l.cost;},0),next:next};
  };
  D.apply=function(c,sh,picked){
    var s=G.Game.state,owned=s.fleet.ships.concat(G.Scenes.city.B.harbor.moored(c));
    if(sh.loan||owned.indexOf(sh)<0)return {ok:false,reason:'내 배만 개조할 수 있습니다.'};
    var q=D.quote(c,sh,picked);if(q.blocked)return {ok:false,reason:q.blocked};
    if(s.player.gold<q.total)return {ok:false,reason:'금화 '+G.U.num(q.total)+'닢이 필요합니다.'};
    if(!q.total)return {ok:true,cost:0};
    s.player.gold-=q.total;var p=q.next;
    [['sailShape',p.shape==='native'?null:p.shape],['sailDesign',p.design==='plain'?null:p.design],['sailInk',p.ink],['sailColor',p.color]].forEach(function(a){if(a[1])sh[a[0]]=a[1];else delete sh[a[0]];});
    if(D.clean(sh).shape!==D.clean(picked).shape)throw Error('돛 모양 저장 실패');
    if(q.lines.some(function(l){return l.name==='돛 모양·삭구 교체';})){var form=D.shape(p.shape),base=G.SHIP[sh.type].sails;sh.sails=form.kind?sh.sails.map(function(){return form.kind;}):base.slice();}
    G.State.log(sh.name+'호의 돛을 개조했다. ('+q.lines.map(function(l){return l.name;}).join(' · ')+' · '+G.U.num(q.total)+'닢)');
    return {ok:true,cost:q.total};
  };
  D.legacyCost=function(c,sh){var b=G.BALANCE.sailRefit;return Math.ceil(Math.max(b.legacyMastMin,G.SHIP[sh.type].price*b.legacyMastRate)*G.R.priceLevel(c,'ship')/10)*10;};
  D.label=function(sh){var p=D.clean(sh);return D.shape(p.shape).name+' · '+D.design(p.design).name;};
})(window.G=window.G||{});
