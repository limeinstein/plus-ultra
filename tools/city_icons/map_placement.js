/* 지도 시안의 건물 발치와 잔교를 실제 육지·수면에 맞춘다. */
(function (G) {
  'use strict';

  function offset(part, width, name) {
    return part[name].map((n, i) => (n - part.origin[i]) * width);
  }

  function near(limit, step) {
    const points = [];
    for (let dx = -limit; dx <= limit; dx += step) {
      for (let dy = -limit; dy <= limit; dy += step) {
        const dist = Math.hypot(dx, dy);
        if (dist <= limit) points.push([dx, dy, dist]);
      }
    }
    return points.sort((a, b) => a[2] - b[2]);
  }

  const bankLimit = 128, bankStep = 4;
  const cityOffsets = near(bankLimit, bankStep);
  const shoreOffsets = near(92, 2);

  // 대형 표시를 옮겨야 해도 원래 도시와 같은 강둑·해안에 머문다.
  function sameBank(ground) {
    const start = cityOffsets.find(([x,y])=>ground(x,y));
    if (!start) return ()=>false;
    const [x0,y0]=start;
    const cells = new Set([x0+','+y0]);
    const queue = [[x0,y0]];
    const directions = [[bankStep,0],[-bankStep,0],[0,bankStep],[0,-bankStep]];
    for (let i=0;i<queue.length;i++) {
      const [x,y]=queue[i];
      for (const [dx,dy] of directions) {
        const a=x+dx, b=y+dy, key=a+','+b;
        if (a*a+b*b>bankLimit*bankLimit || cells.has(key)) continue;
        if (!ground(a,b) || !ground(x+dx/2,y+dy/2)) continue;
        cells.add(key);
        queue.push([a,b]);
      }
    }
    return (x,y)=>{
      const a=Math.round(x/bankStep)*bankStep,b=Math.round(y/bankStep)*bankStep;
      return cells.has(a+','+b) && ground((x+a)/2,(y+b)/2);
    };
  }

  function onLand(site, width, ground, bank) {
    const feet = Object.values(site.feet).map(points => {
      const [center,...corners] = points.map(p=>p.map((n,i)=>(n-site.origin[i])*width));
      const midpoints = corners.map((p,i)=>p.map((n,j)=>(n+corners[(i+1)%corners.length][j])/2));
      return [center,...corners,...midpoints];
    });
    const edgeCount = feet.reduce((count,points)=>count+points.length-1,0);
    let best;
    for (const [dx, dy, dist] of cityOffsets) {
      if (best && dist > best.score) break;
      if (!bank(dx,dy)) continue;
      let dry = 0, corners = 0;
      for (const [center, ...edges] of feet) {
        if (!ground(dx + center[0], dy + center[1])) continue;
        dry++;
        for (const [x,y] of edges) if (ground(dx+x,dy+y)) corners++;
      }
      const score = dist + (feet.length-dry)*110 + (edgeCount-corners)*22;
      if (!best || score < best.score) best = {dx, dy, dry, count:feet.length, corners, edgeCount, score};
    }
    return best;
  }

  function onShore(parts, width, ground, navigable, direction, city, bank) {
    let best;
    for (const part of parts) {
      const w = Math.min(29, part.sizeRatio * width);
      const a = offset(part,w,'land'), b = offset(part,w,'water'), ship = offset(part,w,'ship');
      const line = [b[0]-a[0],b[1]-a[1]];
      const len = Math.hypot(...line);
      const bearing = (line[0]*direction[0] + line[1]*direction[1])/len;
      for (const [dx,dy,dist] of shoreOffsets) {
        const apart = Math.hypot(dx-city.dx,dy-city.dy);
        if (apart < width*.31 || bearing < -.25) continue;
        const score = dist + Math.max(0,apart-width*.81)*2.4 + (1-bearing)*9;
        if (best && score >= best.score) continue;
        if (!ground(dx+a[0],dy+a[1]) || !bank(dx+a[0],dy+a[1]) || ground(dx+b[0],dy+b[1]) ||
            !navigable(dx+ship[0],dy+ship[1]) ||
            ground(dx+ship[0]+line[0]*.28,dy+ship[1]+line[1]*.28) ||
            ground(dx+ship[0]-line[0]*.28,dy+ship[1]-line[1]*.28)) continue;
        best = {id:part.id, origin:part.origin, dx,dy,width:w,score,land:a,water:b,ship};
      }
    }
    return best;
  }

  G.CityTerrainPreview = function (layer, quays, width, worldAt, direction) {
    const cells = new Map();
    function cell(x,y) {
      const i = Math.round(x*2), j = Math.round(y*2), key = i+','+j;
      if (!cells.has(key)) {
        const ll = worldAt(i/2,j/2);
        cells.set(key,{ll,dry:G.Geo.sdf(...ll)>.035});
      }
      return cells.get(key);
    }
    const ground = (x,y)=>cell(x,y).dry;
    const navigable = (x,y)=>{
      const p = cell(x,y);
      return !p.dry && G.Hydro.canSail(...p.ll,{draft:1,beam:3,turn:28});
    };
    const bank = sameBank(ground);
    const city = onLand(layer,width,ground,bank);
    const quay = quays.length && city ? onShore(quays,width,ground,navigable,direction,city,bank) : null;
    return {city,quay};
  };
})(window.G = window.G || {});
