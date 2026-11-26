/* 새 수형이 그림판에 있고 실제 지역에서 선택되며, 사구 판의 양쪽 경계가 이어지는지 확인한다. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');

const root = path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'artifacts/world-detail-20261125'),{recursive:true});
const scripts = [
  'js/core/inflate.js','js/data/base.js','js/data/seafx.js','js/data/world_data.js',
  'js/data/terrain_detail.js','js/data/terrain_patches.js','js/data/waterway_geometry.js',
  'js/data/waterways.js','js/data/landscapes.js','js/art/terrain_materials.js','js/world/geo.js',
  'js/world/terrain.js','js/data/terrain_art.js','js/art/terrain_art.js'
];

(async () => {
  const browser = await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.setContent('<canvas width="1600" height="900"></canvas>');
    for (const script of scripts) await page.addScriptTag({content:fs.readFileSync(path.join(root,script),'utf8')});
    const result = await page.evaluate(async () => {
      G.Game = {state:{date:{y:1480,m:5,d:15}}};
      G.DISCOVERIES = [{id:'siwa',name:'시와 오아시스',lon:25.52,lat:29.2}];
      G.Geo.init();
      const art = G.TerrainArt;
      const ctx = document.querySelector('canvas').getContext('2d');
      await art.ready;
      const missing = [];
      for (const form of ['beech','birch','fir','willow','kapok','fanpalm','tamarisk']) {
        for (const variant of [0,1]) {
          const id = `tree-${form}-${variant}`;
          if (!art.sprite(ctx,id,0,0,20,30)) missing.push(id);
        }
      }
      let seen = new Set();
      const drawOriginal = art.sprite;
      art.sprite = (canvas,id,...args) => {seen.add(id);return drawOriginal(canvas,id,...args);};
      const scenes = [
        ['sahara',3.2,24.7],['arabia',47.6,19.8],['jungle',-55,-3],['alps',8.1,46.5],
        ['seorak',128.46,38.12],['boreal',30.3,60],['siwa',25.52,29.2],
        ['loire',.69,47.36],['seine',2.1,48.9]
      ];
      const counts = {};
      for (const [name,lon,lat] of scenes) {
        const zoom = 540;
        art.invalidate();
        seen = new Set();
        const toScreen = (x,y)=>[800+G.Geo.wrapLon(x-lon)*zoom,450-(y-lat)*zoom];
        for (let i=0;i<180;i++) {
          art.draw(ctx,{lon,lat,zoom},toScreen,null);
          if (!art.stats().pendingChunks) break;
        }
        const stats = art.stats();
        counts[name] = {types:[...seen].sort(),parts:stats.trees,pending:stats.pendingChunks};
      }
      const side = 256, map = G.TerrainMaterials.duneHeights(side);
      let maxHeight=0, seam=0, interior=0;
      for (let y=0;y<side;y++) for (let x=0;x<side;x++) {
        const z = map[y*side+x];
        maxHeight=Math.max(maxHeight,z);
        const dx=Math.abs(z-map[y*side+(x+1)%side]);
        const dy=Math.abs(z-map[((y+1)%side)*side+x]);
        seam=Math.max(seam,x===side-1?dx:0,y===side-1?dy:0);
        interior=Math.max(interior,x<side-1?dx:0,y<side-1?dy:0);
      }
      return {missing,counts,maxParts:G.FX.terrainWorld.maxTrees,dunes:{maxHeight,seam,interior}};
    });
    const out=path.join(root,'artifacts/world-detail-20261125/variety-mix-check.json');
    fs.writeFileSync(out,JSON.stringify({...result,errors},null,2));
    const {counts,dunes} = result;
    const hasForm = (names,form) => names.some(name=>counts[name].types.some(id=>id.startsWith('tree-'+form+'-')));
    assert.deepEqual(errors,[]);
    assert.deepEqual(result.missing,[]);
    assert(Object.values(counts).every(scene=>scene.parts<=result.maxParts&&!scene.pending));
    for (const region of ['sahara','arabia']) assert(!counts[region].types.some(id=>id.startsWith('detail-stones')));
    assert(hasForm(['jungle'],'kapok'));
    assert(hasForm(['alps','seorak'],'beech'));
    assert(hasForm(['boreal','alps','seorak'],'fir'));
    assert(hasForm(['siwa'],'tamarisk')&&hasForm(['siwa'],'palm'));
    assert(hasForm(['loire','seine'],'willow'));
    assert(dunes.maxHeight>.5&&dunes.seam<=dunes.interior*1.15);
    console.log('VEGETATION_AND_DUNES_OK');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
