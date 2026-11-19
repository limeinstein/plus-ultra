'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'artifacts/plant-native-art-20261119');
const context = {window:{}};
vm.createContext(context);
for (const file of ['plantrelics.js', 'natives.js']) vm.runInContext(fs.readFileSync(path.join(root, 'js/data', file), 'utf8'), context);
const jobs = context.window.G.PLANT_RELICS.map(a => ({id:a[1], name:a[2], kind:a[3], description:a[5], type:'plant', keys:['relics/'+a[1], 'items/'+a[1]], prompt:`Use case: stylized-concept. Asset type: square transparent inventory icon in a painterly realistic historical ocean exploration RPG. Draw exactly this single collectible object: ${a[2]}. Object description (Korean): ${a[5]}. Category ${a[3]}. Show the object itself, not the discovery landscape. Wooden figureheads are carved ship bow ornaments; staffs shown whole diagonally; seed pouches open with a few distinctive seeds and one small identifying plant part; medicine as its period wrapping or vessel. One coherent object group, centered, full silhouette inside 10% empty margins, tactile natural materials, delicate hand-painted detail, soft upper-left lighting, readable at 256px. No text, labels, border, watermark, tabletop, scenery or person. Actual transparent background, square.`}));
const facilities = [
 ['trade','교역소','a local barter store, neatly bundled regional goods, baskets, balance-free exchange space'],
 ['tavern','술집','a communal refreshment shelter, simple seating and locally appropriate drinking vessels, quiet welcoming gathering space'],
 ['inn','여관','a modest guest sleeping shelter, locally woven mats or fur bedding appropriate to this climate, guest belongings'],
 ['gate','성문','the village boundary footpath and modest entrance clearing, natural terrain beyond, no European masonry or castle gate'],
 ['church','사당','a modest quiet sheltered place of remembrance, spare natural materials, no invented sacred iconography or exotic fantasy altar'],
 ['market','시장','a local market area with small woven baskets, regional provisions and crafts displayed at human scale'],
 ['guild','조합','a communal craft and voyage planning shelter with local hand tools, baskets, cordage and wooden work surfaces']
];
const details = {
 316:'Eora coastal settlement near Sydney harbour. Eucalyptus woodland, sandstone shore, small curved bark shelters and bark canoes. Warm coastal daylight. No tipis, no Polynesian carvings.',
 317:'Arrernte central Australian desert camp. Red earth, spinifex, rocky ridge and low practical brush windbreak shelters near a water source. No tipis, no tropical palms, no secret sacred imagery.',
 318:'Maori settlement by a steaming lake in Aotearoa, timber and raupo reed houses, modest communal building with restrained red timber details, woven flax. No invented elaborate sacred carvings.',
 319:'Motu Papua coastal settlement, timber stilt houses over shallow turquoise water, palm-thatch roofs, boardwalks, pottery and locally built sailing canoes. Humid coastal daylight.',
 320:'Evenki Siberian taiga seasonal camp, conical birch-bark and reindeer-hide tents, larch and birch forest, tethered reindeer and practical sled equipment. Cool daylight, a little residual snow.',
 321:'Yukaghir Kolyma riverside settlement, low timber and earth insulated shelters mixed with practical summer tents, fishing racks, river and sparse northern larch. Cool late summer light.',
 322:'Inuit west Hudson Bay summer camp, low sealskin tents with stone-weighted edges, skin kayaks, rocky treeless tundra shore, practical drying racks. Cool clear Arctic summer. No totem poles, no forest.',
 323:'Inughuit northwest Greenland coast, low stone and turf houses, skin boats and dog sleds, dramatic bare rock and distant floating ice. Arctic summer light. No trees, no totem poles.',
 324:'Tlingit Chilkat river coastal village, substantial cedar plank houses with broad front gables, understated carved secular exterior timber posts, salmon drying racks and dugout canoes, misty conifer forest. No plains tipis.',
 325:'Omagua middle Amazon riverbank settlement, long palm-thatched timber houses, woven cotton, canoes and a broad brown river with rainforest. Soft humid sunlight. No stone pyramids, no Arctic objects.',
 326:'Tapajo settlement on a bluff at the meeting of two Amazonian rivers, palm-thatched houses, fine decorated earthenware pots and baskets, broad river vista and rainforest. Warm clear daylight. No stone pyramids.'
};
for (const [city, tribe] of Object.entries(context.window.G.TRIBES)) {
 const common = `Use case: historical-scene. Asset type: full-bleed wide 16:9 game background for a historical ocean exploration RPG. Style: refined hand-painted realistic adventure game illustration, cohesive natural pigments, tactile weathered materials, atmospheric depth, convincing perspective, not a photograph or 3D render. Locale: ${details[city]} Game context: ${tribe.note} Historical-inspired fictional interpretation for game use. No writing, lettering, UI, border, watermark, modern materials, European colonial architecture or generic pan-Indigenous costume. If people appear, only a few small respectfully depicted adult local residents, peripheral to the architecture; no closeup foreground people. Wide horizontal composition with readable central space for game menus.`;
 jobs.push({id:'village_'+city,name:tribe.tribe+' 마을',city:+city,type:'village',keys:['backgrounds/'+city,'cities/'+city],prompt:common+' Scene: view from the village path across the whole lived-in settlement, several clearly distinguished buildings and the surrounding characteristic landscape. Buildings and paths occupy lower two-thirds; natural vista in upper third.'});
 for (const [kind,name,subject] of facilities) for (const type of ['exterior','interior']) {
   const label = type==='exterior'?'외부':'내부';
   jobs.push({id:type+'_'+kind+'_'+city,name:tribe.tribe+' '+name+' '+label,city:+city,kind,type,keys:[type+'s/'+kind+'@'+city],prompt:common+` Scene: ${type==='exterior'?'three-quarter street-level exterior view of one clearly readable local building or sheltered facility, entire facade and entry visible, grounded in its village':'eye-level view within the local shelter or open-air facility, structure and everyday objects surround usable central floor space, believable doorway light'}. Facility purpose: ${subject}. For the village boundary facility, show the path just outside the entrance rather than inventing a room. Use practical locally plausible forms based on the locale. For open shelter cultures, an interior is the space beneath the shelter, never an invented enclosed European room.`});
 }
}
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'prompts.json'),JSON.stringify({date:'2026-11-19',tool:'built-in image_gen',jobs},null,2));
console.log(JSON.stringify({total:jobs.length,plants:jobs.filter(j=>j.type==='plant').length,villages:11,facilities:facilities.length}));
