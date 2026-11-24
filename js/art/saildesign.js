/* 원본 벡터 도안. 첨부 참고 이미지의 픽셀·워터마크는 사용하지 않는다. */
(function(G){'use strict';
  var A=G.Art,PI=Math.PI,SA=G.SailArt={};
  function rgb(h){h=(h||'#ffffff').slice(1);return [0,2,4].map(function(i){return parseInt(h.slice(i,i+2),16);});}
  function path(g,p,fill,stroke,w){g.beginPath();p.forEach(function(v,i){if(i)g.lineTo(v[0],v[1]);else g.moveTo(v[0],v[1]);});g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=w||.025;g.stroke();}}
  function disk(g,x,y,r,col){g.beginPath();g.arc(x,y,r,0,PI*2);g.fillStyle=col;g.fill();}
  function line(g,p,col,w){g.beginPath();p.forEach(function(v,i){if(i)g.lineTo(v[0],v[1]);else g.moveTo(v[0],v[1]);});g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();}
  function star(g,x,y,r,col,n){var p=[];for(var k=0;k<(n||5)*2;k++){var a=-PI/2+k*PI/(n||5),d=k%2?r*.42:r;p.push([x+Math.cos(a)*d,y+Math.sin(a)*d]);}path(g,p,col);}
  function lily(g,col){
    path(g,[[0,.43],[-.10,.19],[-.055,-.06],[-.18,-.16],[-.28,-.08],[-.31,.08],[-.43,-.06],[-.40,-.25],[-.24,-.31],[-.08,-.21],[-.13,-.45],[0,-.64],[.13,-.45],[.08,-.21],[.24,-.31],[.4,-.25],[.43,-.06],[.31,.08],[.28,-.08],[.18,-.16],[.055,-.06],[.1,.19]],col);
    g.fillStyle=col;g.fillRect(-.24,.04,.48,.10);path(g,[[-.2,.29],[0,.17],[.2,.29],[.15,.44],[0,.37],[-.15,.44]],col);
  }
  function at(g,x,y,s,fn){g.save();g.translate(x,y);g.scale(s,s);fn();g.restore();}
  function crown(g,col){path(g,[[-.5,-.08],[-.43,.35],[.43,.35],[.5,-.08],[.23,.08],[0,-.3],[-.23,.08]],col);g.fillStyle=col;g.fillRect(-.43,.40,.86,.13);[-.5,0,.5].forEach(function(x){disk(g,x,x?-.08:-.3,.075,col);});}
  function eagle(g,col,double){
    [-1,1].forEach(function(side){g.save();g.scale(side,1);path(g,[[.04,-.12],[.2,-.31],[.42,-.57],[.65,-.61],[.54,-.32],[.7,-.48],[.67,-.2],[.46,.02],[.68,-.05],[.55,.18],[.28,.13],[.16,.29]],col);line(g,[[.08,.3],[.34,.54],[.5,.5]],col,.055);g.restore();});
    path(g,[[-.14,-.23],[.14,-.23],[.2,.3],[.36,.62],[0,.5],[-.36,.62],[-.2,.3]],col);
    (double?[-1,1]:[1]).forEach(function(side){g.save();g.scale(side,1);path(g,[[0,-.11],[-.03,-.47],[.17,-.56],[.38,-.49],[.26,-.39],[.13,-.4],[.14,-.18]],col);g.restore();});
  }
  function lion(g,col,wing){
    if(wing){[-1,1].forEach(function(s){path(g,[[0,0],[s*.5,-.5],[s*.73,-.44],[s*.49,.1],[s*.18,.2]],col);});}
    path(g,[[-.08,-.31],[.15,-.31],[.28,.03],[.06,.28],[-.19,.14]],col);disk(g,.09,-.4,.18,col);path(g,[[.14,-.49],[.35,-.48],[.34,-.37],[.13,-.31]],col);
    line(g,[[.12,-.03],[.42,-.21],[.52,-.14]],col,.10);line(g,[[.01,.2],[.36,.43],[.48,.43]],col,.11);line(g,[[-.08,.13],[-.31,.42],[-.48,.42]],col,.11);
    line(g,[[-.15,.09],[-.45,-.03],[-.47,-.35],[-.3,-.48]],col,.07);star(g,-.29,-.49,.09,col,4);
  }
  function skull(g,col,sabers){
    [[[-.48,.53],[.48,-.06]],[[-.48,-.06],[.48,.53]]].forEach(function(p){line(g,p,col,sabers?.055:.09);if(!sabers)p.forEach(function(v){disk(g,v[0],v[1],.075,col);});});
    g.beginPath();g.ellipse(0,-.24,.30,.32,0,0,PI*2);g.fillStyle=col;g.fill();g.fillRect(-.17,-.07,.34,.24);
    g.save();g.globalCompositeOperation='destination-out';disk(g,-.11,-.27,.073,'#000000');disk(g,.11,-.27,.073,'#000000');path(g,[[-.04,-.11],[0,-.18],[.04,-.11]],'#000000');for(var k=-1;k<=1;k++)g.fillRect(k*.075-.013,.045,.026,.12);g.restore();
  }
  function motif(g,id,col,d){
    if(id==='lilies'||id==='sixlilies'){var pts=id==='lilies'?[[-.28,-.23],[.28,-.23],[0,.36]]:[[-.32,-.4],[.32,-.4],[-.32,0],[.32,0],[-.32,.4],[.32,.4]];pts.forEach(function(p){at(g,p[0],p[1],id==='lilies'?.5:.33,function(){lily(g,col);});});}
    else if(id==='eagle'||id==='doubleeagle')eagle(g,col,id==='doubleeagle');
    else if(id==='lion'||id==='winglion')lion(g,col,id==='winglion');
    else if(id==='skull'||id==='sabers')skull(g,col,id==='sabers');
    else if(id==='christ'){path(g,[[-.13,-.6],[.13,-.6],[.11,-.2],[.48,-.23],[.48,.04],[.11,.01],[.14,.55],[-.14,.55],[-.11,.01],[-.48,.04],[-.48,-.23],[-.11,-.2]],col);g.fillStyle='#e9dfc6';g.fillRect(-.035,-.47,.07,.88);g.fillRect(-.34,-.13,.68,.07);}
    else if(id==='castle'){g.fillStyle=col;g.fillRect(-.43,-.18,.86,.64);[-.4,0,.4].forEach(function(x){g.fillRect(x-.1,-.4,.2,.4);for(var k=-1;k<=1;k++)g.fillRect(x+k*.075-.024,-.49,.048,.13);});g.save();g.globalCompositeOperation='destination-out';g.fillStyle='#000000';g.fillRect(-.09,.18,.18,.3);g.restore();}
    else if(id==='portugal'){g.fillStyle='#eee4c9';g.fillRect(-.42,-.5,.84,1);[[0,-.27],[-.24,0],[0,0],[.24,0],[0,.27]].forEach(function(p){g.fillStyle='#33568b';g.fillRect(p[0]-.09,p[1]-.11,.18,.22);disk(g,p[0],p[1],.023,'#eee6cf');});}
    else if(id==='medici'){[[-.29,-.3],[.29,-.3],[-.3,.15],[.3,.15],[0,.47]].forEach(function(p){disk(g,p[0],p[1],.13,col);});disk(g,0,-.5,.15,'#33568b');at(g,0,-.48,.16,function(){lily(g,'#daba5a');});}
    else if(id==='taeguk'){disk(g,0,0,.49,'#b43a3d');g.fillStyle='#335a88';g.beginPath();g.arc(0,0,.49,0,PI);g.fill();disk(g,-.245,0,.245,'#335a88');disk(g,.245,0,.245,'#b43a3d');}
    else if(id==='sun'||id==='sunmoon'){star(g,id==='sunmoon'?-.22:0,id==='sunmoon'?-.12:0,id==='sunmoon'?.38:.62,col,16);disk(g,id==='sunmoon'?-.22:0,id==='sunmoon'?-.12:0,id==='sunmoon'?.24:.4,col);if(id==='sunmoon'){disk(g,.28,.18,.28,'#e9ddbd');disk(g,.39,.10,.23,d.field||'#a33434');}}
    else if(id==='crescent'){disk(g,-.1,0,.53,col);g.save();g.globalCompositeOperation='destination-out';disk(g,.12,-.1,.45,'#000000');g.restore();}
    else if(id==='chrysanthemum'||id==='rose'||id==='mokko'){var n=id==='chrysanthemum'?16:id==='rose'?10:5;for(var i=0;i<n;i++){g.save();g.rotate(i*PI*2/n);g.beginPath();g.ellipse(0,-.30,.10,id==='chrysanthemum'?.30:.22,0,0,PI*2);g.fillStyle=col;g.fill();g.restore();}disk(g,0,0,.16,id==='rose'?'#a93636':col);}
    else if(id==='aoi'){disk(g,0,0,.62,col);disk(g,0,0,.54,d.field||'#303b36');for(var i=0;i<3;i++){g.save();g.rotate(i*PI*2/3);path(g,[[0,0],[-.3,-.32],[-.12,-.54],[.12,-.54],[.3,-.32]],col);line(g,[[0,-.06],[0,-.45]],d.field||'#303b36',.025);g.restore();}}
    else if(id==='takeda'){[[0,-.35],[-.32,0],[.32,0],[0,.35]].forEach(function(p){path(g,[[p[0],p[1]-.26],[p[0]+.25,p[1]],[p[0],p[1]+.26],[p[0]-.25,p[1]]],col);});}
    else if(id==='circlecross'){g.strokeStyle=col;g.lineWidth=.065;g.beginPath();g.arc(0,0,.57,0,PI*2);g.stroke();line(g,[[-.56,0],[.56,0]],col,.08);line(g,[[0,-.56],[0,.56]],col,.08);}
    else if(id==='mori'){line(g,[[-.54,-.35],[.54,-.35]],col,.08);[[-.28,.22],[.28,.22],[0,-.05]].forEach(function(p){disk(g,p[0],p[1],.17,col);});}
    else if(id==='dragon'||id==='serpent'){line(g,[[.1,-.48],[-.28,-.4],[-.40,-.08],[.29,.05],[.36,.35],[0,.49],[-.29,.32]],col,.16);path(g,[[.02,-.52],[.4,-.6],[.51,-.43],[.29,-.26],[.07,-.34]],col);line(g,[[.22,-.51],[.13,-.68]],col,.05);line(g,[[.36,-.52],[.46,-.7]],col,.05);if(id==='dragon'){[-1,1].forEach(function(s){line(g,[[s*.20,.02],[s*.5,-.1],[s*.54,-.25]],col,.07);line(g,[[s*.18,.28],[s*.50,.40],[s*.55,.29]],col,.07);});disk(g,.54,.1,.095,col);}}
    else if(id==='keys'){[-1,1].forEach(function(s){line(g,[[-s*.4,.5],[s*.24,-.3]],col,.09);g.strokeStyle=col;g.lineWidth=.07;g.beginPath();g.arc(s*.31,-.4,.15,0,PI*2);g.stroke();line(g,[[-s*.3,.35],[-s*.12,.48]],col,.07);});}
    else if(id==='twobars'){g.fillStyle=col;g.fillRect(-.55,-.3,1.1,.2);g.fillRect(-.55,.15,1.1,.2);}
    else if(id==='sheaf'){for(var i=-3;i<=3;i++)line(g,[[i*.035,.53],[i*.1,-.48]],col,.055);g.fillStyle=col;g.fillRect(-.17,-.03,.34,.13);}
    else if(id==='douglas'){g.fillStyle='#33578b';g.fillRect(-.6,-.65,1.2,.38);[-.4,0,.4].forEach(function(x){star(g,x,-.46,.105,'#eee2c5');});path(g,[[0,.49],[-.38,.1],[-.35,-.08],[-.18,-.15],[0,-.02],[.18,-.15],[.35,-.08],[.38,.1]],col);}
    else if(id==='quartered'){g.fillStyle='#33558b';g.fillRect(0,-.65,.65,.65);g.fillRect(-.65,0,.65,.65);at(g,-.3,-.3,.42,function(){lion(g,col);});at(g,.3,.3,.42,function(){lion(g,col);});at(g,.3,-.25,.44,function(){lily(g,col);});at(g,-.3,.35,.44,function(){lily(g,col);});}
    else if(id==='paulownia'){for(var i=-1;i<=1;i++){g.save();g.rotate(i*.5);g.beginPath();g.ellipse(0,.05,.18,.4,0,0,PI*2);g.fillStyle=col;g.fill();g.restore();for(var j=0;j<5;j++)disk(g,i*.32,(j%2?-.42:-.55),.065,col);}}
    else if(id==='calligraphy'){for(var i=0;i<3;i++)line(g,[[i*.14-.12,.38],[i*.14-.12,-.59]],col,.055);for(var i=0;i<3;i++){g.strokeStyle=col;g.lineWidth=.045;g.beginPath();g.ellipse(-.05,.22,i*.1+.22,.17,0,0,PI*2);g.stroke();}line(g,[[-.35,.46],[.55,-.18]],col,.065);}
    else if(id==='text'){g.fillStyle=col;g.font='bold .24px sans-serif';g.textAlign='center';g.textBaseline='middle';var n=d.text||'',rows=n.length>6?[n.slice(0,Math.ceil(n.length/2)),n.slice(Math.ceil(n.length/2))]:[n];rows.forEach(function(t,i){g.fillText(t,0,(i-(rows.length-1)/2)*.32,1.1);});}
  }
  SA.paint=function(g,opt,size,clear){
    var d=G.SailDesign.design(opt.sailDesign),ink=A.validSailColor(opt.sailInk)?opt.sailInk:d.ink;
    g.save();if(clear)g.clearRect(0,0,size,size);g.scale(size,size);
    if(d.pattern==='stripes'||d.pattern==='bands'||d.pattern==='fourbars'){g.fillStyle=ink;for(var i=0;i<8;i+=2){if(d.pattern==='bands')g.fillRect(0,i/8,1,1/8);else g.fillRect(i/8,0,1/8,1);}}
    if(d.pattern==='diamonds')for(var i=0;i<5;i++)path(g,[[.5,i*.2],[.65,i*.2+.1],[.5,i*.2+.2],[.35,i*.2+.1]],ink);
    if(d.pattern==='cross'){g.fillStyle=ink;g.fillRect(.42,0,.15,1);g.fillRect(0,.40,1,.15);}
    if(d.pattern==='saltire'){line(g,[[.08,.08],[.92,.92]],ink,.10);line(g,[[.08,.92],[.92,.08]],ink,.10);if(d.motif==='ragged')for(var i=1;i<9;i++)for(var s of [-1,1])line(g,[[i*.1,s>0?i*.1:1-i*.1],[i*.1-.055,s>0?i*.1+.04:1-i*.1-.04]],ink,.035);}
    if(d.pattern==='tricolor'){g.fillStyle='#cc8545';g.fillRect(0,0,1,1/3);g.fillStyle='#e7dec8';g.fillRect(0,1/3,1,1/3);g.fillStyle='#345985';g.fillRect(0,2/3,1,1/3);}
    if(d.pattern==='shield'||d.pattern==='roundel'){var round=d.pattern==='roundel';
      if(round){disk(g,.5,.5,.34,d.field);g.strokeStyle='#c9ab65';g.lineWidth=.018;g.beginPath();g.arc(.5,.5,.34,0,PI*2);g.stroke();}
      else path(g,[[.23,.23],[.77,.23],[.74,.65],[.65,.79],[.5,.88],[.35,.79],[.26,.65]],d.field,'#c9ab65',.018);
      g.save();g.beginPath();if(round)g.arc(.5,.5,.32,0,PI*2);else g.rect(.25,.25,.5,.55);g.clip();at(g,.5,round?.5:.52,round?.46:.38,function(){motif(g,d.motif,ink,d);});g.restore();if(d.crown)at(g,.5,.16,.22,function(){crown(g,'#d7b65c');});}
    else if(d.motif&&d.motif!=='ragged'){if(d.pattern==='seal'){g.strokeStyle=ink;g.lineWidth=.028;g.beginPath();g.arc(.5,.5,.36,0,PI*2);g.stroke();}at(g,.5,.49,d.pattern==='seal'?.58:.55,function(){motif(g,d.motif,d.emblemInk||ink,d);});}
    g.restore();
  };
  SA.decorate=function(material,opt,baseColor,T){
    var d=G.SailDesign.design(opt.sailDesign),active=d.id!=='plain',key=d.id+'|'+(opt.sailInk||'')+'|'+(opt.sailColor||'');
    if(!material.sailBaseMap)material.sailBaseMap=material.map;
    if(!active){if(material.map!==material.sailBaseMap)material.map=material.sailBaseMap;material.userData.sailDecorKey=null;return;}
    if(material.userData.sailDecorKey===key)return;
    var n=G.FX.sailDecor.textureSize,cv=material.sailDecorCanvas,layer=material.sailLayerCanvas;
    if(!cv){cv=material.sailDecorCanvas=document.createElement('canvas');layer=material.sailLayerCanvas=document.createElement('canvas');cv.width=cv.height=layer.width=layer.height=n;
      // Texture.clone()은 r147에서 Source를 공유한다. 독립 지도여야 원래 천을 지우지 않는다.
      var map=material.sailDecorMap=new T.CanvasTexture(cv);['encoding','wrapS','wrapT','anisotropy','flipY','minFilter','magFilter'].forEach(function(k){map[k]=material.sailBaseMap[k];});}
    var g=cv.getContext('2d'),lg=layer.getContext('2d');g.clearRect(0,0,n,n);g.drawImage(material.sailBaseMap.image,0,0,n,n);SA.paint(lg,opt,n,true);
    var pix=g.getImageData(0,0,n,n),ink=lg.getImageData(0,0,n,n).data,base=rgb(baseColor),target=rgb(opt.sailColor||(!['shield','roundel'].includes(d.pattern)&&d.field)||baseColor);
    for(var i=0;i<pix.data.length;i+=4){var shade=Math.max(.35,Math.min(1.2,(pix.data[i]/base[0]+pix.data[i+1]/base[1]+pix.data[i+2]/base[2])/3)),alpha=ink[i+3]/255;
      for(var c=0;c<3;c++)pix.data[i+c]=Math.min(255,pix.data[i+c]*target[c]/base[c]*(1-alpha)+ink[i+c]*shade*alpha);}
    g.putImageData(pix,0,0);material.map=material.sailDecorMap;material.map.needsUpdate=true;material.userData.sailDecorKey=key;
  };
  var decalCanvas=document.createElement('canvas'),decalKey='';decalCanvas.width=decalCanvas.height=G.FX.sailDecor.textureSize;
  A.sailDecal=function(ctx,spec,x,y,w,h){if(!spec||!spec.sailDesign||spec.sailDesign==='plain')return;var key=spec.sailDesign+'|'+(spec.sailInk||'');if(key!==decalKey){SA.paint(decalCanvas.getContext('2d'),spec,decalCanvas.width,true);decalKey=key;}ctx.save();ctx.clip();ctx.drawImage(decalCanvas,x,y,w,h);ctx.restore();};
})(window.G=window.G||{});
