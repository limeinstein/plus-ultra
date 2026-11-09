/* 새 그림과 기존의 같은 사건 그림을 게임 자료에 연결하는 정적 목록을 만든다. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'artifacts/missing-event-art-20261110');
const p=JSON.parse(fs.readFileSync(path.join(__dirname,'prompts.json'),'utf8'));
const a=JSON.parse(fs.readFileSync(path.join(OUT,'audit.json'),'utf8'));
const relations=Object.fromEntries(p.relations.map(x=>[x.eventId,x.key]));
const history={};
for(const row of p.history){const e=a.history[row.index],key=[e.y,e.m||1,e.d||1].join('-');if(history[key])throw Error('같은 날의 소식: '+key);history[key]={text:e.text,img:row.key};}
const code=`/* 누락 사건 원화 연결 — tools/missing_event_art_20261110/wire.cjs가 만든 정적 목록.
   원화와 기존 논리 키는 보존한다. 게임은 파일을 가져오지 않고 이 자료를 바로 읽는다. */
(function (G) {
  'use strict';
  G.EVENT_ART = ${JSON.stringify({relations,history},null,2)};
  (G.REL_EVENTS || []).forEach(function (e) {
    var img = G.EVENT_ART.relations[e.id]; if (img) e.img = img;
  });
  (G.HISTORY || []).forEach(function (e) {
    var row = G.EVENT_ART.history[[e.y, e.m || 1, e.d || 1].join('-')];
    if (row && row.text === e.text) e.img = row.img;
  });
  // 합류 전·후에 같은 인물을 쓴다. 여왕과 레일라의 공통 초상 대체 성별도 맞춘다.
  if (G.HIST_FIG && G.HIST_FIG.cv_isabel) G.HIST_FIG.cv_isabel.g = 'f';
  if (G.HIST_FIG && G.HIST_FIG.pr_leyla) G.HIST_FIG.pr_leyla.g = 'f';
  if (G.MATE && G.MATE.leyla) {
    G.MATE.leyla.face = 'portraits/legendary/leyla';
    G.MATE.leyla.halfKey = 'portraits/legendary/leyla_half';
  }
  if (G.MATE && G.MATE.cv_mendez) {
    G.MATE.cv_mendez.face = 'portraits/mates/cv_mendez';
    G.MATE.cv_mendez.halfKey = 'portraits/mates/cv_mendez_half';
  }
})(window.G = window.G || {});
`;
fs.writeFileSync(path.join(ROOT,'js/data/eventart.js'),code);console.log(JSON.stringify({relations:Object.keys(relations).length,history:Object.keys(history).length}));
