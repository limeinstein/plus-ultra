/* 첨부 사진의 산 형태·휴양지 해안에 맞춘 미술용 지역 구분. 지질 측량도나 통행 자료는 아니다. */
(function(G){
 'use strict';
 G.LANDSCAPE_PROFILES=[
  {id:'pillars',box:[110.1,110.9,28.9,29.7],rock:'pillar'},
  {id:'korean-granite',box:[127.6,129.1,37.2,38.7],rock:'granite'},
  {id:'huangshan-granite',box:[117.7,118.6,29.7,30.6],rock:'granite'},
  {id:'fuji-volcano',box:[138.45,139.0,35.1,35.7],rock:'volcano'},
  {id:'yosemite-walls',box:[-120.0,-119.2,37.3,38.3],rock:'wall'},
  {id:'grand-canyon',box:[-114.3,-110.5,35.5,37.3],rock:'sandstone'},
  {id:'halong-karst',box:[106.7,107.8,20.5,21.4],rock:'karst'}
 ];
 G.COAST_ART_TYPES={
  volcanic:['galapagos','santorini','madeira','azores','hawaii','jeju'],
  cove:['capri','sicily','phuket','palawan','stlucia','seychelles','joatinga'],
  temperate:['skye','goldenisles'],
  white:['maldives','boracay','bahamas','borabora','cookisles','fiji','tahiti','okinawa','waikiki']
 };
 // 기존 오아시스 발견 위치에 붙이는 게임용 샘의 세부 지형. 반경은 화면 가독성을 위한 설정이다.
 G.LANDSCAPE_MICRO=[{id:'siwa-spring',discovery:'siwa',kind:'oasis',offset:[.08,-.025],radius:.045,freshRadius:.11}];
 G.LANDSCAPE_FORMATIONS=[
  {id:'seorak-ridge',lon:128.465,lat:38.125,kind:'granite',width:.50},
  {id:'seorak-spur',lon:128.38,lat:38.20,kind:'granite',variant:1,width:.28},
  {id:'fuji',discovery:'fuji',lon:138.7183,lat:35.35657,kind:'volcano',width:.78},
  {id:'matterhorn',discovery:'matterhorn',lon:7.658,lat:45.976,kind:'snowridge',variant:1,width:.62},
  {id:'everest',discovery:'everest',lon:86.925,lat:27.988,kind:'snowridge',width:.72},
  {id:'machapuchare',discovery:'machapuchare',lon:83.947,lat:28.497,kind:'snowridge',variant:1,width:.62},
  {id:'zhangjiajie',discovery:'zhangjiajie',lon:110.43,lat:29.32,kind:'pillar',width:.64},
  {id:'huangshan',discovery:'huangshan',lon:118.17,lat:30.13,kind:'granite',width:.58},
  {id:'yosemite-wall',lon:-119.63,lat:37.74,kind:'wall',width:.62},
  {id:'canyon-wall',lon:-112.1,lat:36.2,kind:'sandstone',width:.63},
  {id:'canyon-spur',lon:-112.5,lat:36.2,kind:'sandstone',width:.45}
 ];
})(window.G=window.G||{});
