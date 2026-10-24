/* 제독의 집: 작위에 따른 다섯 단계와 고장별 외관·실내 장식. */
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

  function style(c) {
    var es = G.Img && G.Img.extStyle && G.Img.extStyle(c);
    if (/china|korea|japan|steppe/.test(es || '')) return 'east';
    if (/arabia|ottoman|swahili/.test(es || '')) return 'islam';
    if (/india|seasia|tropic/.test(es || '')) return 'south';
    if (/africa|masai|kraal|tent|aztec|inca|woodland|plains|pueblo/.test(es || '')) return 'native';
    return 'europe';
  }
  var COLORS = {
    europe: ['#d0b897', '#754936', '#e6c878'], islam: ['#ddc49a', '#446776', '#e6c976'],
    east: ['#c5a987', '#4b514c', '#d8b969'], south: ['#d6b184', '#824f46', '#e7c780'],
    native: ['#b99a72', '#765640', '#d9b870']
  };
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
  /** 실내 바탕 그림 위에 단계별 가문 장식과 지역 문양을 얹는다. */
  HB.interior = function (base, c, tier) {
    if (!tier) return base;
    var cv = G.Art.canvas(1600, 900), x = cv.getContext('2d'), col = COLORS[style(c)], east = style(c) === 'east';
    x.drawImage(base, 0, 0, 1600, 900);
    // 높은 집일수록 천장 띠와 양쪽 기둥이 선명해진다.
    x.fillStyle = col[1]; x.fillRect(0, 0, 1600, 10 + tier * 3);
    x.fillStyle = col[2]; x.fillRect(0, 10 + tier * 3, 1600, 3);
    if (tier >= 2) {
      [115, 1470].forEach(function (px) {
        x.fillStyle = 'rgba(27,20,16,.42)'; x.fillRect(px - 17, 85, 34, 690);
        x.fillStyle = col[0]; x.fillRect(px - 11, 85, 22, 690);
        x.fillStyle = col[2]; x.fillRect(px - 25, 77, 50, 15); x.fillRect(px - 25, 760, 50, 13);
      });
    }
    if (tier >= 3) {
      x.fillStyle = 'rgba(42,20,16,.35)'; x.fillRect(615, 70, 370, 105);
      x.strokeStyle = col[2]; x.lineWidth = 8; x.strokeRect(615, 70, 370, 105);
      x.fillStyle = col[2]; x.beginPath();
      if (east) { x.moveTo(800, 92); x.lineTo(865, 128); x.lineTo(800, 158); x.lineTo(735, 128); }
      else { x.moveTo(760, 110); x.lineTo(800, 88); x.lineTo(840, 110); x.lineTo(831, 150); x.lineTo(769, 150); }
      x.closePath(); x.fill();
    }
    if (tier >= 4) {
      x.strokeStyle = col[2]; x.lineWidth = 6;
      for (var i = 0; i < 5; i++) {
        x.beginPath(); x.moveTo(490 + i * 155, 15); x.lineTo(520 + i * 145, 70); x.stroke();
      }
    }
    return cv;
  };
})(window.G = window.G || {});
