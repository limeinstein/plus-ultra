/* 현재 소굴 자료에서 누락 인물·장면 제작 지시문을 만든다. 생성은 내장 ImageGen으로 실행한다. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const context = { window: { G: { SEA_PIRATES: [] } } };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/data/pirate_lairs.js'), 'utf8'), context);
const G = context.window.G;
const looks = {
  med: [
    'Man 52, weathered North African face, stocky muscular build, black beard graying at chin, red turban, open ivory linen shirt, ochre sash and sleeveless brown leather vest; faint healed shackle marks on wrists, resolute gaze.',
    'Woman 33, North African, warm olive skin, dark almond eyes, thick black braid, indigo headwrap, sea-green linen blouse and fitted russet sleeveless coat, brass belt and sheathed curved saber; shrewd confident half-smile.',
    'Man 46, North African, dark curled beard, blue turban, left arm missing below shoulder with neatly pinned sleeve, right hand at belt; sand-colored shirt, weathered brown sleeveless vest, composed strength. No wounds.',
    'Man 38, North African, lean face, narrow mustache, black headwrap and black indigo short kaftan, dark sash, hand on sheathed curved sword, reserved alert eyes.',
    'Man 43, North African, broad nose and small curling beard, cream wrapped headcloth, plum open-collar tunic, bronze coin purse at belt, sly calculating expression.'
  ],
  atl: [
    'English man 48, broad square face, graying brown beard, weathered black felt hat, faded red wool doublet over open cream shirt, leather baldric, rolled blank naval pennant held at waist, forceful gaze.',
    'Dutch man 41, narrow face, sandy blond short beard, gray felt hat, slate-blue wool sailor coat, cream linen collar and brown belt, quietly appraising eyes.',
    'English man 34, dark tousled hair and black stubble, broad grin, worn brown leather jerkin and open ivory shirt, ochre bandana, hand resting on sheathed cutlass.',
    'English man 50, rugged red-brown beard, navy wool cap, pale shirt and dark blue sleeveless coat; RIGHT hand replaced by a modest iron hook, left hand rests at belt. Healed old amputation, no wound.',
    'English man 57, squinting pale blue eyes, silver sideburns and stubble, sunworn freckled face, faded green sailor coat and off-white shirt, brass small spyglass held at waist.'
  ],
  north: [
    'Irish woman 40, strong freckled face, auburn hair in a thick braid, green eyes, forest-green wool mantle clasped with bronze brooch over russet fitted linen tunic and leather belt, assured commanding expression.',
    'Irish man 64, tall lean build, long graying copper beard, windswept silver hair, dark teal wool cloak over brown tunic, carved wooden pipe held away from face, amused seasoned expression.',
    'Scandinavian man 42, very broad powerful build, long ash-blond hair and thick blond beard, plain blue wool tunic and sleeveless fur-edged brown jerkin, axe secured at hip, calm gray eyes. No horned helmet.',
    'Irish man 31, lively red curls and red stubble, one open hand raised loosely with faded red pigment, burgundy wool waistcoat and cream open-collar shirt, spirited grin. Paint, no blood.',
    'Baltic man 49, heavy sturdy build, long brown mustache and short beard, gray knit sailor cap, ochre wool tunic and dark gray waistcoat, thick rope loop held in one hand, contemplative gaze.'
  ],
  amer: [
    'French Caribbean man 47, black wavy shoulder-length hair and curled mustache, dark faded burgundy coat and cream shirt, black parrot perched naturally on LEFT shoulder, wide leather belt and sheathed cutlass, mischievous grin.',
    'French Caribbean woman 32, windblown chestnut curls, sun-tanned face, dark red headscarf, cream open-collar blouse and fitted navy sleeveless sailor coat, plain black sash, sheathed cutlass and confident direct gaze.',
    'French Caribbean man 53, graying brown beard, red wool cap, weathered teal coat over cream shirt, LEFT leg replaced BELOW KNEE with a simple wooden peg beginning at bottom crop, balanced upright pose, no injuries.',
    'French Caribbean man 39, slim sharp face, dark brown swept hair, black mustache and pointed beard, pale linen shirt with burgundy vest, folded captured plain pennants tucked under arm, proud expression.',
    'French Caribbean man 44, heavy round build, curly brown hair, merry ruddy cheeks and short beard, striped cream and blue sailor shirt, loose rust-red vest, small wooden rum cup in one hand.'
  ],
  ind: [
    'French man 39 in Madagascar, lean idealistic face, long chestnut hair tied back and neatly trimmed beard, cream open linen shirt and blue weathered frock coat, simple leather belt, one open palm in a friendly address.',
    'French man 46 in Madagascar, deeply tanned face, black curled beard and shoulder-length hair, faded sand-colored scarf and green sailor coat, coral bead bracelet, hand on sheathed cutlass, stern watchful expression.',
    'Red Sea Arab man 30, dark bronze skin, short black curls and close beard, open cream sleeveless linen vest and indigo wrapped trousers with simple sash, rope and small pearl pouch at belt, athletic diver build.',
    'English man 37, angular fair freckled face and sandy stubble, brown felt hat, faded green wool coat and cream shirt, closed slim trade ledger held in left hand, calculating half-smile.',
    'Arab man 45, bronze skin, salt-and-pepper beard, dark hair under plain cream headcloth, dark red sleeveless vest over light open shirt, distinctive shark-tooth necklace, unwavering gaze.'
  ],
  sea: [
    'Iranun Moro man 50, brown skin, strong cheekbones, long dark mustache and short beard, ornate wrapped maroon headcloth, patterned indigo sleeveless coat over cream collarless shirt, broad woven sash and sheathed kris, regal confidence.',
    'Iranun Moro woman 34, warm brown skin, long black hair with blue silk headwrap, blue woven tunic with gold edging and fitted red vest, colorful sash, small kingfisher-feather ornament, sheathed kris, proud assured gaze.',
    'Iranun Moro man 38, brown skin, black hair tied back and trimmed mustache, red wrapped headcloth, woven brown vest and dark blue collarless shirt, patterned sash, broad shoulders and severe gaze.',
    'Bajau man 36, deep brown sun-tanned skin, lean muscular diver build, black shoulder-length wet-looking hair, open teal sleeveless woven vest, earth-colored striped sarong, shell bracelet and knotted rope at belt, relaxed smile.',
    'Malay man 42, warm brown skin, black mustache and pointed goatee, dark wrapped headcloth, plum collarless shirt and patterned gold-brown sash, holds a wavy kris blade safely downward at side, guarded eyes.'
  ],
  east: [
    'Ming Chinese man 54, broad shrewd face, sparse black mustache and goatee, dark scholar cap, rich dark teal silk cross-collar robe and brown belt, plain folding fan closed in hand, prosperous smuggler chief.',
    'Satsuma Japanese man 44, rugged face, tied black topknot, dark stubble, indigo kosode worn under dark red sleeveless haori, plain hakama and two sheathed swords at belt, powerful reserved expression.',
    'Ming Chinese man 40, lean sharp face, black cloth eyepatch over LEFT eye, tied dark hair, charcoal cross-collar jacket and dark red sash, alert surviving eye, one hand on sheathed dao.',
    'Ming Chinese man 35, powerful broad shoulders, dark tied hair and short beard, dark navy sleeveless coat over ivory cross-collar shirt, black dragon embroidered ONLY on coat hem, ochre sash and sheathed dao, fierce expression.',
    'Ming Chinese man 29, wiry agile build, narrow eyes, sparse mustache, brown cloth headband and tied hair, weathered gray short jacket and blue sash, small rope coil at belt, quick knowing smile.'
  ]
};
const style = 'Use case: historical-scene. Asset type: individual character knee portrait for Loop of Good Hope sailing RPG. ONE adult character only. Polished hand-painted semi-realistic 2D game illustration, subtly illustrated natural face, fine brushwork, rich restrained colors and detailed period cloth, not a photo or 3D render. Vertical 1024x1536. Centered from complete head/hat to just BELOW BOTH KNEES, hands and all props visible, face nearly forward, head in top 8-22%, small clear top and side margins. Figure and garment continue to bottom edge at knees, no floating cutout or feet. Genuine transparent background, no floor, cast shadow, scene, frame, text or watermark. Believable hands. No modern objects. Subject: ';
const portraits = [];
G.PIRATE_LAIRS.forEach(d => {
  const people = d.chiefs.map((c, i) => ({ ...c, id: 'lairchief_' + d.zone + '_' + i, type: 'chief' }))
    .concat(d.mates.map((m, i) => ({ name: m[0], desc: m[1], g: 'm', id: 'lair_' + d.zone + '_' + (i + 1), type: 'officer' })));
  people.forEach((c, i) => portraits.push({ ...c, zone: d.zone, place: d.place, key: 'portraits/rivals/' + c.name, prompt: style + looks[d.zone][i] + ' Character: ' + c.name + '. ' + c.desc }));
});
const env = {
  med: 'Djerba, Tunisia: shallow turquoise lagoon, sandbars, low whitewashed North African houses, Ottoman watchtower, palm trees and Mediterranean galleys with long oars and lateen sails.',
  atl: 'Mamora on the Moroccan Atlantic river mouth: sandy fortified riverbank, low ochre stone ramparts, a small pirate council house, English and Dutch sailing vessels in the tidal inlet, Atlantic swell beyond.',
  north: 'Clare Island, western Ireland: a medieval square stone tower above a small rocky harbor, emerald grass and sea cliffs, Irish sailing galleys, cool silver Atlantic mist and warm breaking sunset.',
  amer: 'Tortuga, Caribbean: lush green island slopes, a rough timber buccaneer harbor and jetty, small sloops with square and gaff sails, rum barrels and bundled hides, bright turquoise sea.',
  ind: 'Ile Sainte-Marie, Madagascar: tropical palms, coral-lagoon shallows, rustic timber pirate village, wooden sailing ships being repaired on shore, anchored brigantines and Malagasy fishing canoes.',
  sea: 'Jolo, Sulu Sea: volcanic tropical island, stilt-built woven-bamboo waterfront, Iranun long narrow oared lanong vessels with tripod masts, woven sails and ornate high prows, tropical haze.',
  east: 'Shuangyu near Ningbo, Ming China: steep wooded rocky island harbor, gray-tiled Chinese timber warehouses, bamboo moorings, Chinese junks with battened sails and a small Portuguese caravel, warm mist.'
};
const sceneStyle = 'Use case: historical-scene. Asset type: ONE continuous cinematic event illustration for Loop of Good Hope Age of Sail RPG. Wide 2.25:1 landscape 1881x836. Polished painterly semi-realistic 2D illustration, fine brushwork, tactile wood, sailcloth, stone and atmospheric water, warm light and cool shadows. No montage, panels, borders, lettering, captions, watermark, modern ships or objects. Keep main subjects within middle 75% vertical safe area. Scene: ';
const scenes = G.PIRATE_LAIRS.map(d => ({ id: 'lair_' + d.zone, key: 'legend-events/lair_' + d.zone, title: d.place + '의 해적 소굴', prompt: sceneStyle + env[d.zone] + ' Wide view from the jetty toward the distinct fortified pirate haven. A few small adult pirates in local period clothes gather on the pier, lowering their weapons peacefully. A furled plain pennant is tied to a mast; no skull insignia or specific national flag. Weathered cargo, mooring ropes, seabirds and layered anchored vessels. Focus on the place, allowing the image to accompany both its location being revealed and its peaceful surrender. No recognizable protagonist or close-up faces.' }));
scenes.push({ id: 'pirateking', key: 'achievement-events/pirateking', title: '해적왕', prompt: sceneStyle + 'Triumphant gathering after unifying the seven pirate havens. View from behind and slightly above an adult sea captain in a dark weathered coat on a flagship quarterdeck, one hand calmly on the wooden railing, a varied council of adult North African, Irish, Caribbean European, Red Sea, Iranun and Ming Chinese pirate captains on the deck raising hats in respect. Beyond them an immense sunlit anchorage of Mediterranean lateen galleys, Atlantic square-rigged sailing ships, Caribbean sloops, Sulu oared lanong vessels and Chinese junks, distinct rigging and hulls. Exactly seven plain small pennants stream from a foreground signal line, no emblems or letters. Warm golden sunset breaks through clouds. Focus on shared seamanship, sea wind and earned respect; no crown, throne, treasure pile, gore or combat.' });
const plan = { date: '2026-11-06', mode: 'built-in image_gen', portraits, scenes };
const dest = path.join(ROOT, 'tools/missing_event_art_20261106_prompts.json');
fs.writeFileSync(dest, JSON.stringify(plan, null, 2) + '\n');
console.log(JSON.stringify({ portraits: portraits.length, scenes: scenes.length, file: dest }));
