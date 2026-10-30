/* 제독의 집: 작위에 따른 다섯 단계와 고장별 외관·실내 그림. */
(function (G) {
  'use strict';
  var HB = G.HomeBuilding = {};
  var NAMES = ['평민의 집', '유력자의 집', '남작의 저택', '백작의 대저택', '공작의 궁전'];

  /** 작위 무게를 집의 다섯 단계로 묶는다. 옛 저장의 작위가 없어도 평민 집이 나온다. */
  HB.tier = function () {
    var best = G.Court && G.Court.best && G.Court.best();
    var w = best ? best.w || 0 : 0;
    return w >= 7 ? 4 : w >= 5 ? 3 : w >= 3 ? 2 : w >= 1 ? 1 : 0;
  };
  HB.name = function (tier) { return NAMES[tier == null ? HB.tier() : tier]; };
  HB.baseKind = function (tier, c) {
    var es = c && G.Img && G.Img.extStyle && G.Img.extStyle(c);
    // 북미 마을에는 양식에 맞는 저택·왕궁 원화가 없다. 이곳은 같은 고장 집을 늘려 큰 집터를 만든다.
    if (es === 'plains' || es === 'pueblo' || es === 'woodland') return 'home';
    return tier >= 4 ? 'palace' : tier >= 2 ? 'mansion' : 'home';
  };
  HB.roomKind = function (tier) { return tier >= 3 ? 'palace' : tier >= 2 ? 'mansion' : 'home'; };

  /** 같은 고장 집 그림으로 별채를 붙여, 그 고장의 건축 양식을 그대로 살린다. */
  HB.exterior = function (base, annex, tier, door) {
    if (!annex) return { cv: base, door: door };
    var aw = annex.width, pad = Math.round(aw * 0.45), both = tier >= 2, grand = tier >= 4;
    var left = both ? pad * (grand ? 2 : 1) : 0;
    var cv = G.Art.canvas(base.width + pad * (grand ? 4 : both ? 2 : 1), base.height);
    var x = cv.getContext('2d'), y = base.height - annex.height;
    if (grand) { x.drawImage(annex, 0, y); x.drawImage(annex, cv.width - aw, y); }
    if (both) x.drawImage(annex, grand ? pad : 0, y);
    x.save(); x.translate(left + base.width - aw * 0.55 + aw, 0); x.scale(-1, 1); x.drawImage(annex, 0, y); x.restore();
    x.drawImage(base, left, 0);
    return { cv: cv, door: { cx: (left + door.cx * base.width) / cv.width, foot: door.foot } };
  };
  /** 실내 원화의 기둥·문장을 그대로 사용한다. 별도 도형을 덧그리면 원화와 메뉴를 가린다. */
  HB.interior = function (base) { return base; };
})(window.G = window.G || {});
