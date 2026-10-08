/* 클로드가 추가한 83개 발견물의 원문과 원화 제작 지시를 내보낸다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {window:{G:{}}}; vm.createContext(ctx);
for (const file of ['eastdisc','folkdisc']) vm.runInContext(fs.readFileSync(path.join(root,'js/data',file+'.js'),'utf8'),ctx);
const G = ctx.window.G;
const style = 'Refined historical exploration sketchbook: richly detailed hand-painted watercolor, delicate ink contours, natural textures, believable anatomy and geography, warm paper undertone. No writing, captions, labels, borders, gutters, logos or watermark.';
const rows = G.WONDERS.list.map(r=>({id:r[0],name:r[1],category:r[2],region:r[9],description:r[10],extra:r[12]}));
if(rows.length!==83) throw Error('83개 목록 불일치: '+rows.length);
for(const r of rows){
 const facts = `Subject: ${r.name} (${r.id}), region ${r.region}. Source brief: ${r.description}.`;
 if(r.category==='nature') {
  r.source = `tools/nature_gifs/sources/${r.id}.png`;
  r.prompt = `Create ONE extremely wide continuous 3:1 landscape panorama, 1536x512 or wider, for a historical exploration game. ${facts} ${style} Accurately depict the distinctive landforms, plant life, water and local architecture described. Distant elevated viewpoint, landmark fully visible, ample scenery both sides for a horizontal camera pan. Neutral early daylight suitable for dawn-to-night grading. No modern buildings, tourists or modern infrastructure. One uninterrupted landscape, NOT a grid.`;
 } else if(r.category==='ruin') {
  r.source = `tools/ruin_gifs/v2/master/${r.id}.png`;
  r.prompt = `Create ONE exact 4-column by 4-row storyboard master sheet (16 equal rectangular cells), landscape canvas 2048x1536, for a historical landmark reconstruction animation. ${facts} ${style} Cells touch without borders, all content safely inside its own cell. Row-major: cells 1-7 show seven genuinely different cumulative construction stages of THIS specific structure: surveyed empty terrain, foundations, rising structural frame, exterior cladding, completed roofs and interiors, landscaping, finished historical landmark. Cell 8 is a finished watercolor establishing view. Cells 9-16 show the same completed landmark from eight different elevated azimuths 0,45,90,135,180,225,270,315 degrees. Stable building identity and proportions, entire towers and roofs visible with generous headroom, NO closeups, no duplicated front view pretending to rotate. Historically plausible original materials, no modern tourists or construction machinery. Distinct architecture matching the source brief, not a generic palace. All 16 cells form a regular 4x4 grid, no text.`;
 } else {
  r.source = `tools/discovery83/masters/${r.id}.png`;
  r.prompt = `Create ONE exact 4-column by 4-row animation storyboard sheet, 16 equal landscape cells, overall 2048x1536. ${facts} Cultural activity brief: ${JSON.stringify(r.extra.folk)}. ${style} Portray these specific people with respectful natural faces, varied individual features, culturally specific clothing, hair, instruments and landscape; never generic costume stereotypes or caricatures. Select one clearly readable main activity from the source brief: dance, musical performance, cooking, or a nonviolent martial demonstration. Give this culture a distinctive scene. Frame order is left to right, top to bottom: first row four successive hand/instrument or food-preparation gestures at medium range, second and third rows eight successive FULL-BODY phases of the main dance/music/martial action, last row four progressively wider gathering views with the appropriate food being prepared or shared. Same identifiable performers, outfits, instruments, location, light and spatial positions throughout; bodies, hands, feet and props genuinely change pose from cell to cell, not merely camera zoom. Keep full figures and instruments inside each cell with generous margins. Anatomically credible hands and limbs. Choose public/social activities from the brief without inventing secret ceremonial details. Historical travel illustration, no modern plastic or electronics, no fantasy regalia. EXACT regular 4x4 equal-cell grid with no gutters, no borders, no text.`;
 }
}
fs.writeFileSync(path.join(__dirname,'prompts.json'),JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify(rows));
