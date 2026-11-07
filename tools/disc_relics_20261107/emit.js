const fs = require('fs'), path = require('path');
const D = require('./out/data.json'), CR = require('./input/creatures.json'), FC = require('./input/faith_candidates.json');
const info = {}; CR.forEach(c => info[c.id] = c); FC.forEach(c => info[c.id] = info[c.id] || c);
const J = s => JSON.stringify(s);
const G_NAME = { baby: '동물의 새끼 — 실제 동물을 찾으면 그 새끼를 데려온다 (개는 강아지·말은 망아지·곤충은 애벌레·물고기는 치어)', legend: '전설 생물 — 새끼 대신 전설의 물건 (용의 비늘·화석·인어의 귀걸이 …)', faith: '종교 발견물 — 교회·모스크·절·사원에 있을 법한 성물이나 경전' };
let js = `/* 발견 유물 더하기 (2026-11-07 사용자 요청) — 동물의 새끼 · 전설 생물의 물건 · 종교 발견물의 성물
   js/data/relics.js 가 이 표를 읽어 G.RELICS·G.ITEM 에 넣는다. 한 줄 = [발견 id, 유물 id, 이름, 종류, 값 배율, 설명, 덧붙임]
   · 유물 id 는 r_<발견>_baby · r_<발견>_legend · r_<발견>_holy 로 정해 두었다 (앞에 다른 유물이 늘어도 id 가 밀리지 않는다 — 저장 호환)
   · 값 = 발견 가치 × 값 배율 (relics.js, 최소 300닢). 종류: animal 동식물 · treasure 보물 · gift 장신구(gv 선물 값) · book 서적(읽으면 같은 지역 단서)
   · 그림: images/relics/<유물 id>.webp (256×256 투명). 없으면 G.Art.relicArt 가 그린다. 만드는 법은 docs/codex/07_discovery_relic_icons.md
   · 원본 표 생성: tools/disc_relics_20261107/ (전설·종교 갈래 목록과 이름 규칙) */
(function (G) {
  'use strict';
  G.DISC_RELICS = [\n`;
['baby', 'legend', 'faith'].forEach(g => {
  js += `    // ---------------------------------------------------------------- ${G_NAME[g]}\n`;
  D.filter(x => x.group === g).forEach(x => { js += `    [${J(x.disc)}, ${J(x.rid)}, ${J(x.name)}, ${J(x.kind)}, ${x.v}, ${J(x.desc)}${x.extra ? ', ' + J(x.extra).replace(/"(\w+)":/g, '$1: ') : ''}],\n`; });
});
js = js.replace(/,\n$/, '\n') + `  ];\n})(window.G = window.G || {});\n`;
fs.writeFileSync(path.join(__dirname, '../../js/data/discrelics.js'), js);
// ---------------- Codex 프롬프트
const BASE = 'Use case: historical-scene. Asset type: isolated transparent inventory icon for a richly illustrated historical exploration game (Age of Discovery, 1480-1700). ';
const STYLE = ' One subject only, centered and completely visible, three-quarter museum catalog view, fill about 80 percent of a square canvas with generous clear margin on every side. Detailed hand-painted realistic watercolor and fine ink with convincing materials, warm natural highlights, crisp readable silhouette at small icon sizes, matching an old maritime adventure inventory. Genuinely transparent background, no floor, no scenery, no cast-shadow plate, no text, no labels, no border, no frame, no logo, no watermark.';
const ART = {
  young: 'a single live baby animal of this exact species, sitting or curled up naturally, endearing but anatomically accurate for the species (correct markings, proportions and number of limbs), no cage, no people.',
  puppy: 'a single live puppy of this exact dog breed, sitting, breed-accurate coat colour and ears, no collar text, no people.',
  kitten: 'a single live kitten of this exact cat breed, sitting in a small wicker basket, breed-accurate coat, no people.',
  foal: 'a single live foal of this exact horse breed standing on long thin legs, breed-accurate coat and mane, no saddle, no people.',
  water: 'a single live young animal of this exact species shown alone, wet and glistening as if just lifted from the water, accurate species anatomy, no tub, no water surface, no people.',
  fry: 'a few tiny juvenile fish (fry) of this exact species, recognisable by their markings, swimming inside a small round hand-blown glass jar of clear water with a cork stopper.',
  larva: 'the larva (caterpillar or grub) of this exact insect species, accurate colours and patterns for the species, resting on a single fresh green leaf.'
};
const P = D.map(x => {
  const d = info[x.disc] || {};
  let subject;
  if (x.group === 'baby') subject = `Paint ${x.name} — ${ART[x.art] || ART.young} Species: ${d.name}${d.real ? ' (' + d.real + ')' : ''}. Species notes: ${d.desc || ''}`;
  else if (x.group === 'legend') subject = `Paint the legendary artifact 「${x.name}」: ${x.desc} It is a single physical object or keepsake left behind by the mythical creature 「${d.name}」 — show only the object, never the creature itself.`;
  else subject = `Paint the religious object 「${x.name}」: ${x.desc} Historically plausible craftsmanship of the ${{ C: 'Latin Christian', O: 'Eastern Orthodox', I: 'Islamic', B: 'Buddhist', T: 'Tibetan Buddhist', H: 'Hindu', S: 'Sikh', K: 'Confucian ritual', D: 'Taoist', A: 'ancient Mediterranean / Near Eastern temple', M: 'pre-Columbian Mesoamerican / Andean / Polynesian temple' }[x.faith]} tradition of the site 「${d.name}」. Respectful, no sacred faces of the Prophet, no figurative images on Islamic objects.`;
  return { id: x.rid, disc: x.disc, group: x.group, name: x.name, kind: x.kind, description: x.desc, target: `tools/disc_relics_20261107/sources/${x.rid}.png`, file: `images/relics/${x.rid}.webp`, prompt: BASE + subject + STYLE };
});
fs.writeFileSync(path.join(__dirname, 'prompts.json'), JSON.stringify({ date: '2026-11-07', tool: 'OpenAI ImageGen + tools/prepare_relic_icon.py', size: [256, 256], format: 'WEBP', total: P.length, assets: P }, null, 1));
// ---------------- 사람용 목록
let md = '';
['baby', 'legend', 'faith'].forEach(g => {
  const L = D.filter(x => x.group === g);
  md += `\n## ${G_NAME[g]} — ${L.length}\n\n| 유물 id | 이름 | 종류 | 발견물 |\n|---|---|---|---|\n`;
  L.forEach(x => { md += `| \`${x.rid}\` | ${x.name} | ${x.kind} | ${(info[x.disc] || {}).name || x.disc} |\n`; });
});
fs.writeFileSync(path.join(__dirname, '../../docs/art/disc-relics-20261107-list.md'), md);
console.log('ok', P.length, js.length);
