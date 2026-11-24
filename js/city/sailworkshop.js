/* 조선소의 돛 모양·문양 작업실. 미리보기는 복사한 설정을 쓰고 적용할 때만 배를 바꾼다. */
(function(G){'use strict';
  var Y=G.Scenes.city.B.shipyard,U=G.U,UI=G.UI,A=G.Art,D=G.SailDesign;
  Y.sailWorkshop=async function(c,sh){
    var s=G.Game.state;if(sh.loan||s.fleet.ships.concat(G.Scenes.city.B.harbor.moored(c)).indexOf(sh)<0)return;
    var draft={sailShape:sh.sailShape||'native',sailDesign:sh.sailDesign||'plain',sailInk:sh.sailInk||null,sailColor:sh.sailColor||null},group=D.design(draft.sailDesign).group;
    function opts(list,fn){return list.map(function(x){return '<option value="'+U.esc(x.id)+'">'+U.esc(fn(x))+'</option>';}).join('');}
    var html='<style>.sail-workshop .work-top{display:grid;grid-template-columns:minmax(260px,1fr) minmax(260px,1fr);gap:16px}.sail-workshop canvas{display:block;max-width:100%;height:auto}.sail-workshop label{display:block;margin:8px 0}.sail-workshop select,.sail-workshop input[type=search]{width:100%;font:inherit}.sail-workshop .work-tabs{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0}.sail-workshop .work-note{min-height:44px;font-size:14px}.sail-workshop .work-cost{padding:10px 0;border-top:1px solid currentColor}.sail-workshop .work-cost b{font-size:22px}.sail-workshop .work-list{height:170px}.sail-workshop .work-colors{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.sail-workshop .work-colors label{display:inline-flex;gap:6px;align-items:center}@media(max-width:700px){.sail-workshop .work-top{grid-template-columns:1fr}.sail-workshop .work-list{height:120px}}</style>'+
      '<div class="scroll sail-workshop" style="max-height:660px"><div class="work-top"><div><canvas class="sail-work-preview" width="520" height="330" aria-label="돛 모양과 문양 미리보기"></canvas><div class="work-colors"><label>바탕 <input type="color" class="work-base" value="'+(draft.sailColor||'#eee3c8')+'"></label><button class="btn work-natural" type="button">원래 천</button><label>문양색 <input type="color" class="work-ink" value="'+(draft.sailInk||D.design(draft.sailDesign).ink)+'"></label><button class="btn work-original-ink" type="button">도안 원색</button></div><div class="work-cost"></div></div><div>'+
      '<label>돛 모양<select class="work-shape">'+opts(G.SAIL_SHAPES,function(x){return x.name+(D.canShape(sh.type,x.id)?'':' (이 배에서 사용 불가)');})+'</select></label><button type="button" class="btn work-reset-shape">원래 범장 복원</button><div class="work-shape-note muted small"></div>'+
      '<div class="work-tabs">'+Object.keys(G.SAIL_DESIGN_GROUPS).map(function(k){return '<button class="btn" type="button" data-sail-group="'+k+'">'+G.SAIL_DESIGN_GROUPS[k]+'</button>';}).join('')+'</div>'+
      '<label>문양 찾기<input type="search" class="work-search" placeholder="나라·왕가·가문 이름"></label><select class="work-list" size="6" aria-label="돛 문양 목록"></select><div class="work-note muted"></div>'+
      '<p class="muted small">문양은 상징을 간략화한 장식입니다. 창작 국명 표장은 따로 표시합니다. 실제 소속·외교 관계는 바뀌지 않습니다.</p></div></div></div>';
    return UI.window({title:sh.name+'호 — 돛 모양·문양',icon:'sail',width:1000,html:html,
      buttons:[{label:'개조한다',value:'apply',cls:'primary',onClick:function(){var result=D.apply(c,sh,draft);if(!result.ok){UI.toast(result.reason,'coin');return false;}UI.toast(result.cost?'돛 개조 완료 · '+U.num(result.cost)+'닢':'이미 같은 돛입니다.','sail');}},{label:'그만둔다',value:null,cls:'navy'}],
      onBuild:function(el){
        var cv=el.querySelector('canvas'),ctx=cv.getContext('2d'),select=el.querySelector('.work-list'),shape=el.querySelector('.work-shape'),find=el.querySelector('.work-search'),base=el.querySelector('.work-base'),ink=el.querySelector('.work-ink');shape.value=draft.sailShape;
        function preview(){
          ctx.fillStyle='#193b4b';ctx.fillRect(0,0,cv.width,cv.height);var spec=A.shipLook(sh.type,Object.assign({},sh,draft,{flag:'#315c99',rig:{fill:.9,brace:.14,lee:1}}));
          var form=D.shape(draft.sailShape);if(form.kind)spec.sails=sh.sails.map(function(){return form.kind;});else if(draft.sailShape==='native'&&(sh.sailShape||draft.sailReset))spec.sails=G.SHIP[sh.type].sails.slice();
          if(!G.Ship3D||!G.Ship3D.draw(ctx,cv.width*.5,cv.height*.9,.55,220,spec,1.25))A.shipSide(ctx,cv.width*.5,cv.height*.8,1.35,spec,U.makeRng(1),1);
          var q=D.quote(c,sh,draft),d=D.design(draft.sailDesign);ink.disabled=d.id==='plain'||d.pattern==='tricolor';el.querySelector('.work-cost').innerHTML=q.blocked?'<span class="warn-text">'+U.esc(q.blocked)+'</span>':q.lines.map(function(l){return '<div>'+l.name+' <span style="float:right">'+U.num(l.cost)+'닢</span></div>';}).join('')+'<div style="margin-top:5px">총 비용 <b>'+U.num(q.total)+'닢</b> · 소지금 '+U.num(s.player.gold)+'닢</div>';
          el.querySelector('.work-note').textContent=d.name+' — '+d.note;el.querySelector('.work-shape-note').textContent=form.desc;
          U.$$('[data-sail-group]',el).forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.sailGroup===group));b.style.outline=b.dataset.sailGroup===group?'2px solid currentColor':'';});
        }
        function list(){var text=find.value.trim().toLowerCase(),rows=G.SAIL_DESIGNS.filter(function(d){return d.group===group&&(!text||(d.name+' '+d.note).toLowerCase().indexOf(text)>=0);});select.innerHTML=opts(rows,function(d){return d.name;});select.value=draft.sailDesign;preview();}
        U.$$('[data-sail-group]',el).forEach(function(b){b.onclick=function(){group=b.dataset.sailGroup;find.value='';list();};});
        select.onchange=function(){draft.sailDesign=select.value;draft.sailInk=null;ink.value=D.design(draft.sailDesign).ink;preview();};
        shape.onchange=function(){draft.sailShape=shape.value;draft.sailReset=shape.value==='native';preview();};el.querySelector('.work-reset-shape').onclick=function(){draft.sailShape='native';draft.sailReset=true;shape.value='native';preview();};find.oninput=list;
        base.oninput=function(){draft.sailColor=base.value;preview();};ink.oninput=function(){draft.sailInk=ink.value;preview();};
        el.querySelector('.work-natural').onclick=function(){draft.sailColor=null;base.value='#eee3c8';preview();};el.querySelector('.work-original-ink').onclick=function(){draft.sailInk=null;ink.value=D.design(draft.sailDesign).ink;preview();};list();
      }}).result;
  };
})(window.G=window.G||{});
