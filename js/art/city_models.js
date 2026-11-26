/* 항해·육상·해도에서 쓰는 도시 모형. 도시·시설·시대는 본편 판정을 그대로 따른다. */
(function (G) {
  'use strict';
  var CI=G.CityIcon, D=G.CITY_MODELS, oldDraw=CI.draw;
  if (!D) return;
  var POI={0:['jeronimos','belem'],7:['giralda'],14:['notredame'],29:['sanmarco'],33:['colosseum'],
    38:['whitetower'],60:['stbasil'],61:['kyivsophia'],72:['parthenon'],112:['hagiasophia'],
    162:['phrasisanphet'],193:['kinkakuji'],200:['templomayor']};
  var HERO={notredame:'paris',colosseum:'rome',hagiasophia:'istanbul',whitetower:'london',giralda:'seville'};
  var COURT={fr_king:'louvre',ot_sultan:'topkapi',ru_prince:'kremlin',cn_emperor:'forbidden'};
  // 대청·가게의 발치, 화면 안의 비중. y가 작은 건물부터 그려 겹친 지붕을 정리한다.
  var SLOTS={landmark:[-.095,-.145,.54],palace:[.23,-.079,.41],manor:[.22,-.068,.32],
    home:[-.15,.045,.195],library:[.322,.06,.23],trade:[-.355,.04,.25],
    market:[-.02,.10,.205],tavern:[-.235,.20,.19],inn:[.161,.227,.177],gate:[0,0,.31]};
  var modelMemo=new WeakMap(), shoreMemo=new WeakMap(), discoverySource, discoveryCount=-1, discoveries={};
  var offsets=[], budget=0, until=0;
  function fx(){return G.FX.cityModels;}
  function state(){return G.Game&&G.Game.state;}
  function size(c){return Math.max(1,Math.min(3,c.size||1));}
  function dateNow(){var s=state();return s&&s.date||{y:1480,m:1};}
  function clamp(x,a,b){return Math.min(b,Math.max(a,x));}
  function asset(key,opts){
    var im=G.Img.get(key);
    if(!im&&G.Img.has(key)){G.Img.want(key);if(opts.pending)opts.pending(key);}
    return im;
  }
  function atlas(group,name){
    var r=D.sheets[group]&&D.sheets[group][name];
    return r?{key:'map-cities/'+group,r:r}:null;
  }
  function photo(id){
    var p=D.photos[id];
    return p?{key:'map-cities/landmarks/'+id,r:[0,0,p[0],p[1],.5,p[1]/p[0]*.93]}:null;
  }
  function originalArt(id){
    if(HERO[id])return atlas('heritage',HERO[id]);
    var ruin=G.RUIN_MODELS&&G.RUIN_MODELS[id];
    if(ruin)return {key:ruin[0],r:ruin.slice(1,7)};
    return G.RUIN_ADDITIONS&&G.RUIN_ADDITIONS[id]?null:photo(id);
  }
  function direct(id){
    var original=originalArt(id);
    if(original)return original;
    var r=G.RUIN_ADDITIONS&&G.RUIN_ADDITIONS[id];
    return r?{key:r[0],r:r.slice(1,7)}:null;
  }
  function valid(d,date){
    return d && d.cat==='ruin' && d.how==='city' && !d.mirage50 && !d.mirageFrom && !d.alwaysMirage &&
      (!d.built||d.built<=date.y) && (!d.openY||d.openY<=date.y) && (!d.goneY||date.y<d.goneY) && !(G.Disc&&G.Disc.isFuture(d));
  }
  function sites(id){
    var list=G.DISCOVERIES||[];
    if (list!==discoverySource||discoveryCount!==list.length) {
      discoverySource=list;discoveryCount=list.length;discoveries={};
      list.forEach(function(d){
        if(d.city==null||d.how!=='city'||d.cat!=='ruin')return;
        (discoveries[d.city]||(discoveries[d.city]=[])).push(d);
      });
    }
    return discoveries[id]||[];
  }
  function sponsor(c,date,f){
    if(size(c)<3)return null;
    var s=state(), contracted=s&&s.contract&&s.contract.sponsor, year=date.y+((date.m||1)-1)/12;
    var found=null, rank=-1;
    (G.SPONSORS||[]).forEach(function(sp){
      if(sp.city!==c.id || (sp.bld==='palace'?!f.palace:(f.mansion||[]).indexOf(sp.id)<0))return;
      if(sp.id!==contracted && !(sp.holders||[]).some(function(h){return h[0]<=year&&year<h[1];}))return;
      var score=(sp.pw||0)*2+(sp.bld==='palace'?1:0);
      if(score>rank){found=sp;rank=score;}
    });
    return found;
  }
  function courtId(sp,c,date){
    var id=sp&&COURT[sp.id];
    if(!id&&sp&&sp.place){
      var building=sites(c.id).find(function(d){return d.name===sp.place;});
      id=building&&building.id;
    }
    if(!id&&CI.culture(c)==='china'&&sp&&sp.bld==='palace'&&sp.type==='king')id='forbidden';
    var d=id&&G.DISC&&G.DISC[id];
    return d&&d.city===c.id&&valid(d,date)&&direct(id)?id:null;
  }
  function landmark(c,date,royal){
    var chosen=null,best=-1,pref=POI[c.id]||[];
    sites(c.id).forEach(function(d){
      if(d.id===royal||!valid(d,date))return;
      var i=pref.indexOf(d.id);
      // 도시에 이미 전용 대표 외관이 있으면 누락 보완으로 대표 발견물이 바뀌지 않는다.
      var score=(i>=0?1e6-i*1e4:0)+(originalArt(d.id)?50000:0)+(d.wonder?5000:0)+Math.min(20000,d.val||0);
      if(score>best){best=score;chosen=d;}
    });
    return chosen;
  }
  function silhouette(d,culture){
    var title=d.name||'';
    return direct(d.id)||atlas(culture,/궁|성채|사원|신전|모스크|대성당|요새|왕릉|사찰|탑|성벽/.test(title)?'palace':'library');
  }
  CI.plan=function(c,date){
    date=date||dateNow();
    var s=state(), seat=s&&s.player&&(G.R.seat?G.R.seat():s.player.home), n=size(c);
    var contract=s&&s.contract&&s.contract.sponsor, col=c.colony!=null&&G.Colony&&G.Colony.of(c);
    var key=[date.y,date.m,seat,contract,n,c.flags,c.port,col&&col.stage,(G.SPONSORS||[]).length].join(':');
    var memo=modelMemo.get(c);
    if(memo&&memo.key===key&&memo.state===s)return memo;
    var culture=CI.culture(c);
    if(!D.sheets[culture])culture='iberia';
    var f=G.R.facilities(c), sp=sponsor(c,date,f), royal=courtId(sp,c,date);
    var d=c.outpost?null:landmark(c,date,royal);
    var parts=[];
    function add(role,art,id){
      if(!art)return;
      var slot=SLOTS[role];
      parts.push({role:role,id:id||role,art:art,x:slot[0],y:slot[1],w:slot[2]});
    }
    if(d)add('landmark',silhouette(d,culture),d.id);
    // 현재 도시 메뉴에 열리는 왕궁·총독부와 최고 후원자의 저택만 쓴다.
    var court=n===3&&(sp&&sp.bld==='palace'||!sp&&f.palace&&c.flags&&c.flags.indexOf('P')>=0);
    if(court)add('palace',royal?direct(royal):atlas(culture,'palace'),royal||sp&&sp.id);
    else if(sp)add('manor',atlas(culture,'manor'),sp.id);
    if(seat===c.id&&!c.outpost)add('home',atlas(culture,'home'));
    if(n>=2&&f.market)add('market',atlas(culture,'market'));
    if(n>=2&&f.trade)add('trade',atlas(culture,'trade'));
    if(n>=3&&f.library)add('library',atlas(culture,'library'));
    if(f.tavern)add('tavern',atlas(culture,'tavern'));
    if(f.inn)add('inn',atlas(culture,'inn'));
    if(!parts.length&&f.gate&&c.outpost) add('gate',atlas('heritage','gate'));
    if(!d&&parts.length){
      var roles=['palace','manor','trade','tavern','inn','home'];
      var main=roles.map(function(role){return parts.find(function(p){return p.role===role;});}).find(Boolean);
      if(main){main.x=-.067;main.y=-.12;main.w=n===3?.58:n===2?.47:.55;}
    }else if(n<3&&d){
      parts[0].w=n===1?.63:.55;
    }
    parts.sort(function(a,b){return a.y-b.y;});
    var access=!!c.port&&!!f.harbor;
    var layout=parts.map(function(part){return part.role+':'+part.id+':'+part.art.key;}).join('|')+'@'+n+'@'+access;
    memo={key:key,layout:layout,state:s,culture:culture,n:n,parts:parts,harbor:access,
      landmark:d?d.id:royal||null,sponsor:sp&&sp.id,palace:!!court,seat:seat===c.id};
    modelMemo.set(c,memo);
    return memo;
  };

  function geometry(model,width){
    return model.parts.map(function(p){
      var r=p.art.r, rise=r[5], cap=p.role==='landmark'?width*.66:width*.52;
      var w=Math.min(p.w*width,cap/Math.max(.17,rise));
      return {p:p,x:p.x*width,y:p.y*width,w:w};
    });
  }
  function dockPoint(i,x,y,r){
    // 부두 원본의 땅 쪽 입구와 배의 발치를 지도 카메라에 사영한다.
    var rad=i*Math.PI/4, a=Math.cos(rad), b=Math.sin(rad), u=a*x-b*y, v=b*x+a*y;
    return [(.83205*u+.55470*v)*r,(.39253*u-.58880*v)*r];
  }
  function* findQuay(dry,wet,sign,sail,connected,home,direction,width,limit,shore){
    var best=null, scale=clamp(width*.20,13,27);
    var origin=[home.x,home.y], cx=shore?shore[0]:0, cy=shore?shore[1]:0;
    for(var i=0;i<8;i++){
      var art=atlas('quays',String(i)), r=scale*256*1.75/(5.4*art.r[2]);
      var bank=dockPoint(i,0,.35,r), tip=dockPoint(i,0,-.63,r);
      var bow=dockPoint(i,.57,-.95,r), stern=dockPoint(i,.57,-.42,r), boat=dockPoint(i,.57,-.69,r);
      var len=Math.hypot(tip[0],tip[1]), align=(tip[0]*direction[0]+tip[1]*direction[1])/len;
      if(align<-.3)continue;
      for(var j=0;j<offsets.length;j++){
        if(j&&j%24===0)yield;
        var o=offsets[j],x=cx+o[0],y=cy+o[1],d=o[2];
        if(d>limit)break;
        var score=d+Math.max(0,Math.hypot(x-origin[0],y-origin[1])-width)*.44+(1-align)*9;
        if(best&&score>=best.score)continue;
        var a=[x+bank[0],y+bank[1]], p=[x+tip[0],y+tip[1]];
        if(!dry(a[0],a[1])||!wet(p[0],p[1])||!wet(x+bow[0],y+bow[1])||!wet(x+stern[0],y+stern[1]))continue;
        if((!shore&&!connected(a[0],a[1]))||sign(a[0],a[1])<=0||sign(p[0],p[1])>=0||
            sign(x+bow[0],y+bow[1])>=0||sign(x+stern[0],y+stern[1])>=0||!sail(x+boat[0],y+boat[1]))continue;
        best={art:art,x:x,y:y,w:scale,score:score,land:a,water:p,ship:[x+boat[0],y+boat[1]]};
      }
    }
    return best;
  }
  function grid(){
    if(offsets.length)return;
    var max=fx().search;
    for(var x=-max;x<=max;x+=4)for(var y=-max;y<=max;y+=4){
      var d=Math.hypot(x,y);
      if(d<=max)offsets.push([x,y,d]);
    }
    offsets.sort(function(a,b){return a[2]-b[2];});
  }
  function* groundPlan(c,model,width,zoom){
    grid();
    var tiles=new Map(), exact=new Map(), lift=G.Terrain.lift, originY=c.lat+lift(c.lon,c.lat);
    function world(x,y){return G.Terrain.unproject(G.Geo.wrapLon(c.lon+x/zoom),originY-y/zoom);}
    function sign(x,y) {
      var key=x+':'+y,s=exact.get(key);
      if(s==null){var p=world(x,y);s=G.Geo.sdf(p[0],p[1]);exact.set(key,s);}
      return s;
    }
    function at(x,y){
      var a=Math.round(x), b=Math.round(y), k=(a+4096)*8192+b;
      var s=tiles.get(k);
      if(s==null){
        // 해안 가까이에서는 높이 투영이 0이므로 후보는 원래 거리장으로 빨리 거른다.
        s=G.Geo.sdf(G.Geo.wrapLon(c.lon+a/zoom),originY-b/zoom);
        tiles.set(k,s);
      }
      return s;
    }
    function dry(x,y){return at(x,y)>.045;}
    function wet(x,y){return at(x,y)<-.035;}
    function sail(x,y){
      if(!wet(x,y))return false;
      var p=world(x,y);
      return G.Geo.sdf(p[0],p[1])<0&&(!G.Hydro||!G.Hydro.ready||G.Hydro.canSail(p[0],p[1],{draft:1,beam:3,turn:28}));
    }
    var dx=c.dock?G.Geo.wrapLon(c.dock[1]-c.lon)*zoom:0,dy=c.dock?(c.lat-c.dock[0])*zoom:1;
    var len=Math.hypot(dx,dy)||1,direction=[dx/len,dy/len];
    // 해안 밖에 찍힌 예전 도시도 가장 가까운 육지부터 찾는다.
    var home=null, best=Infinity;
    for(var i=0;i<offsets.length;i++){
      if(i&&i%24===0)yield;
      var o=offsets[i],score=o[2]+Math.max(0,o[0]*direction[0]+o[1]*direction[1])*.6;
      if(o[2]>best)break;
      if(score<best&&dry(o[0],o[1])&&sign(o[0],o[1])>0){best=score;home={x:o[0],y:o[1]};if(!o[2])break;}
    }
    if(!home)return {buildings:[],dock:null,dry:false};
    function connected(x,y){
      var d=Math.hypot(x-home.x,y-home.y),n=Math.max(1,Math.ceil(d/4));
      for(var k=1;k<=n;k++)if(!dry(home.x+(x-home.x)*k/n,home.y+(y-home.y)*k/n))return false;
      return true;
    }
    function fits(x,y,w,check){
      var f=clamp(w*.19,2.2,9);
      return check(x,y)&&check(x-f,y)&&check(x+f,y)&&check(x,y-f*.60)&&check(x,y+f*.52);
    }
    function solid(x,y){return sign(x,y)>0;}
    var parts=geometry(model,width), center=home;
    if(parts.length){
      for(var i=0;i<offsets.length;i++){
        if(i&&i%12===0)yield;
        var o=offsets[i],x=o[0],y=o[1];
        if(!parts.every(function(a){return fits(a.x+x,a.y+y,a.w,dry);})||!connected(x,y))continue;
        if(!parts.every(function(a){return connected(a.x+x,a.y+y)&&fits(a.x+x,a.y+y,a.w,solid);}))continue;
        center={x:x,y:y};break;
      }
    }
    var buildings=[];
    parts.forEach(function(a){
      for(var k=0;k<4;k++){
        var factor=1-k*.25, x=center.x+a.x*factor,y=center.y+a.y*factor;
        if(fits(x,y,a.w,dry)&&connected(x,y)&&fits(x,y,a.w,solid)){buildings.push({p:a.p,x:x,y:y,w:a.w});return;}
      }
      for(var j=1;j<=3;j++){
        var w=a.w*(1-j*.19);
        if(fits(center.x,center.y,w,solid)){buildings.push({p:a.p,x:center.x,y:center.y,w:w});return;}
      }
    });
    // 작은 섬에서는 지붕은 뚜렷하게 두고 발치가 들어갈 수 있는 자리만 조밀하게 붙인다.
    var quay=model.harbor?yield* findQuay(dry,wet,sign,sail,connected,center,direction,width,fx().shoreSearch):null;
    if(!quay&&model.harbor&&c.dock){
      var dock=[dx,(originY-c.dock[0]-lift(c.dock[1],c.dock[0]))*zoom];
      quay=yield* findQuay(dry,wet,sign,sail,connected,center,direction,width,fx().shoreSearch,dock);
    }
    return {buildings:buildings,dock:quay,dry:true,center:center};
  }
  function lod(c,opts){
    var n=size(c),t=opts.zoom;
    if(!t)return {zoom:0,width:fx().chart[n]*(opts.scale||1)};
    var band=Math.round(Math.log2(Math.max(1,t))*fx().zoomBands), z=Math.pow(2,band/fx().zoomBands);
    var f=clamp((z-fx().zoomStart)/(fx().zoomEnd-fx().zoomStart),0,1);
    return {band:band,zoom:z,width:fx().width[n]+(fx().close[n]-fx().width[n])*f};
  }
  CI.beginModels=function(){budget=fx().plansPerFrame;until=performance.now()+fx().prepareMs;};
  CI.site=function(c,model,view,force){
    if(!view.zoom||!G.Terrain||!G.Terrain.ready){
      return {buildings:geometry(model,view.width),dock:model.harbor&&!view.zoom?{art:atlas('quays','0'),x:.22*view.width,y:.23*view.width,w:view.width*.26}:null};
    }
    var memo=shoreMemo.get(c);
    var key=view.band+':'+model.layout+':'+c.lon+':'+c.lat;
    if(!memo){memo=new Map();shoreMemo.set(c,memo);}
    var job=memo.get(key);
    if(job&&job.done)return job.value;
    if(!force&&(budget<=0||performance.now()>=until))return null;
    if(!force)budget--;
    if(!job){
      job={iterator:groundPlan(c,model,view.width,view.zoom)};
      memo.set(key,job);
      if(memo.size>fx().cachedBands)memo.delete(memo.keys().next().value);
    }
    do {
      var next=job.iterator.next();
      if(next.done){memo.set(key,next);return next.value;}
    }while(force||performance.now()<until);
    return null;
  };

  function paint(ctx,art,im,x,y,w,bounds,shadow){
    var r=art.r, l=x-r[4]*w, t=y-r[5]*w, h=w*r[3]/r[2];
    if(shadow){
      ctx.fillStyle='rgba(33,24,17,.22)';ctx.beginPath();
      ctx.ellipse(x+w*.03,y+w*.032,w*.31,w*.105,-.23,0,Math.PI*2);ctx.fill();
    }
    ctx.drawImage(im,r[0],r[1],r[2],r[3],l,t,w,h);
    bounds.push([l,t,l+w,t+h]);
  }
  function boundsOf(all,x,y,artX,artY,width){
    var a={left:x-7,top:-7,right:x+7,bottom:7};
    all.forEach(function(r){a.left=Math.min(a.left,r[0]);a.top=Math.min(a.top,r[1]-y);a.right=Math.max(a.right,r[2]);a.bottom=Math.max(a.bottom,r[3]-y);});
    return {width:width,height:a.bottom-a.top,radius:Math.max(9,a.right-x),
      top:a.top,base:a.bottom,left:a.left,right:a.right,y:artY,anchorX:artX,boxes:all};
  }
  CI.hit=function(mark,x,y){
    return !!(mark&&mark.boxes&&mark.boxes.some(function(r){return x>=r[0]-3&&x<=r[2]+3&&y>=r[1]-3&&y<=r[3]+3;}));
  };
  function waiting(ctx,x,y,width){
    ctx.save();
    ctx.fillStyle='#d9b36f';ctx.strokeStyle='#3e3021';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.restore();
    return boundsOf([],x,y,x,y,width);
  }
  CI.draw=function(ctx,c,x,y,opts){
    opts=opts||{};
    var model=CI.plan(c), view=lod(c,opts), im=asset('map-cities/'+model.culture,opts);
    if(!im)return view.zoom?waiting(ctx,x,y,view.width):oldDraw(ctx,c,x,y,opts);
    var plan=CI.site(c,model,view,false);
    if(!plan)return waiting(ctx,x,y,view.width);
    var ratio=view.zoom?opts.zoom/view.zoom:1, all=[], center=plan.center||{x:0,y:0};
    var ax=x+center.x*ratio,ay=y+center.y*ratio;
    ctx.save();
    ctx.imageSmoothingEnabled=true;
    plan.buildings.forEach(function(item){
      var art=item.p.art, pic=asset(art.key,opts);
      // 외관이 읽히기 전에는 같은 역할의 지역 모형을 쓴다.
      if(!pic){art=atlas(model.culture,item.p.role==='landmark'?'library':item.p.role==='gate'?'trade':item.p.role);pic=im;}
      if(art)paint(ctx,art,pic,x+item.x*ratio,y+item.y*ratio,item.w,all,true);
    });
    var mark=boundsOf(all,x,y,ax,ay,view.width);
    var q=plan.dock;
    if(q&&q.art){var qm=asset(q.art.key,opts);if(qm)paint(ctx,q.art,qm,x+q.x*ratio,y+q.y*ratio,q.w,all,false);}
    var own=opts.owner!==false&&G.Dominion&&G.R.cityOwner(c), color=own&&G.Dominion.color(own);
    if(color&&all.length){
      var w=clamp(view.width*.23,9,23), base=ay+3;
      ctx.fillStyle='rgba(20,14,8,.68)';ctx.fillRect(ax-w/2-1,base-1,w+2,4);
      ctx.fillStyle=color;ctx.fillRect(ax-w/2,base,w,2);
    }
    if(opts.auto&&all.length){
      ctx.strokeStyle='#74c6bb';ctx.lineWidth=1.45;ctx.beginPath();
      ctx.ellipse(ax,ay+3,Math.max(6,view.width*.15),3.5,0,0,Math.PI*2);ctx.stroke();
    }
    if(!all.length){
      ctx.fillStyle=color||'#d9b36f';ctx.strokeStyle='#3e3021';
      ctx.beginPath();ctx.arc(ax,ay,3,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
    ctx.restore();
    return mark;
  };
  CI.view=lod;
})(window.G=window.G||{});
