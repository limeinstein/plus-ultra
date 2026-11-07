/* 클로드가 추가한 동남아 네 사건 묶음의 실제 그림 키와 등장인물을 모은다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const G = {MATES: [], MATE: {}, ITEMS: [], ITEM: {}};
const context = vm.createContext({window: {G}});
const bundles = ['seasia16', 'macdang', 'spicemactan', 'sundajohor'];
for (const bundle of bundles) vm.runInContext(fs.readFileSync(path.join(root, 'js/data', bundle + '.js'), 'utf8'), context);
const portraitStyle = 'Use case: historical-scene. Asset type: one transparent knee-up character portrait for an Age of Sail historical RPG. Polished hand-painted semi-realistic 2D game illustration, delicate brushwork, warm natural skin, expressive individual face, intricate period textiles, believable anatomy. Standing in a relaxed three-quarter pose, entire headwear through BOTH knees visible, hands and all props inside canvas, generous transparent margin around silhouette, portrait 1024x1536. Genuinely transparent background, no scenery, no ground shadow, no text, no frame, no watermark, no extra figures. Historical clothing from the specified Southeast Asian culture and early-to-mid 16th century. ';
const portraits = Object.values(G.HIST_FIG).map(f => ({id:f.id, name:f.name, folder:'history', look:f.look, prompt:portraitStyle + 'Subject: ' + f.name + ', ' + f.title + '. Character design: ' + f.look + (f.minor || f.id === 'sj_ali' ? '. Clearly a child or adolescent of the specified age, fully clothed, age-appropriate proportions and sober non-romantic presentation.' : '')}));
for (const f of G.MATES) portraits.push({id:f.id, name:f.name, folder:'mates', look:f.desc, prompt:portraitStyle + 'Subject: '+f.name+'. A clearly ADULT young '+(f.g === 'f'?'woman':'man')+', age 23 to 28, attractive and distinctive, tasteful historical adventure character design. Character background and visual design: '+f.desc});
const scenes=[];
for (const bundle of bundles) {
  const src=fs.readFileSync(path.join(root,'js/systems',bundle+'.js'),'utf8');
  const matches=[...src.matchAll(/withPic\('([^']+)', '([^']+)'/g)];
  for (const m of matches) {
    const context=src.slice(m.index,Math.min(src.length,m.index+2300));
    scenes.push({id:m[1],title:m[2],bundle,context,refs:[...new Set([...context.matchAll(/\['((?:sa|md|sm|sj)_[^']+)'/g)].map(x=>x[1]))]});
  }
}
const plan={mode:'built-in image_gen',date:'2026-11-07',portraits,scenes};
const dest=path.join(root,'tools/seasia_event_art_20261107_prompts.json');
if (!fs.existsSync(dest)) fs.writeFileSync(dest,JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({portraits:portraits.length,scenes:scenes.length,path:dest}));
