/* 일곱 바다 해적의 일기토 제작 명단과 주문서를 만든다. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..'), base = path.join(root, 'artifacts/pirate-duel-42-20261117');
const context = {window: {G: {ITEMS: [], ITEM: {}}}};
vm.createContext(context);
for (const f of ['seacaptains', 'pirate_lairs', 'pirate_roster']) vm.runInContext(fs.readFileSync(path.join(root,'js/data',f+'.js'),'utf8'),context);
const G = context.window.G, previous = JSON.parse(fs.readFileSync(path.join(root,'tools/pirate_roster_20261110/prompts.json'),'utf8')).portraits;
const zones = {
  med: ['지중해',['pr_hayreddin','pr_turgut','pr_oruc','pr_hurra','pr_caterina','pr_fatima']],
  atl: ['대서양',['pr_coullon','pr_fleury','pr_roberts','pr_ines','pr_beatriz','pr_moira']],
  north: ['북해',['pr_compaen','pr_nutt','pr_janjacobsen','pr_omalley','pr_ingeborg','pr_eilidh']],
  amer: ['카리브·아메리카',['pr_teach','pr_morgan','pr_rackham','pr_bonny','pr_read','pr_catalina']],
  ind: ['인도양',['pr_every','pr_kidd','pr_angre','pr_amina','pr_rahima','concept_zahra']],
  sea: ['동남아시아',['pr_yangyandi','pr_chenshang','pr_galesong','pr_dewi','pr_praphai','chief_sea_2']],
  east: ['동아시아',['pr_wangzhi','pr_limahong','pr_murakami','pr_chingshih','pr_hongryeon','pr_xiaojiao']]
};
const weapons = {
  pr_oruc:'One functional hand wields a short curved saber; the OTHER forearm is a silver prosthesis, never give it a second normal hand.',
  pr_bonny:'Wield a compact boarding axe; one holstered period pistol stays on the belt.',
  pr_ingeborg:'Wield two compact daggers, exactly one in each hand.',
  pr_amina:'Wield a short broad-headed boarding harpoon that fits entirely within each cell.',
  pr_dewi:'Wield a compact iron fighting fan; closed thrusts and opened guards.',
  pr_praphai:'Wield a compact curved Thai dha sword.',
  chief_sea_2:'Wield a compact Moro kris sword.',
  pr_chingshih:'Wield a short Chinese dao sword; folded red fan stays at the belt.',
  pr_hongryeon:'Wield a short Korean silver dagger (eunjangdo).',
  pr_xiaojiao:'Wield a compact curved boarding knife, retain bare feet.',
  pr_murakami:'Wield a short Japanese wakizashi; retain armor and haori.',
  pr_galesong:'Wield a Makassarese badik dagger.',
  pr_angre:'Wield a compact Maratha talwar saber.',
  concept_zahra:'Wield a short curved coral-hilted boarding saber.'
};
const entries=[];
for (const [zone,[region,ids]] of Object.entries(zones)) {
  for (const [index,id] of ids.entries()) {
    let p = G.SEA_PIRATES.find(q=>q.id===id), sourceKind='named';
    if(id==='chief_sea_2') {p={...G.PIRATE_LAIRS.find(q=>q.zone==='sea').chiefs[1],id,hist:0,zones:['sea']};sourceKind='lair-chief';}
    if(id==='concept_zahra') {p={id,name:'산호칼 자흐라',g:'f',hist:0,zones:['ind'],look:'30대의 성인 오만·스와힐리계 여성 해적 후보, 따뜻한 갈색 피부, 짙은 곱슬머리, 청록색 머릿수건, 산호빛 허리띠, 남색 긴 조끼와 느슨한 바지, 작은 산호 장식, 침착하고 당당함'};sourceKind='new-concept';}
    if(!p || p.g !== (index<3?'m':'f') || !p.zones.includes(zone)) throw new Error('명단 지역·성별 불일치: '+id);
    const old=previous.find(q=>q.id===id);
    let ref = old && [old.half,old.face].find(f=>f && fs.existsSync(path.join(root,f)));
    if(!ref && fs.existsSync(path.join(root,'images/wanted',id+'.webp'))) ref='images/wanted/'+id+'.webp';
    const weapon=weapons[id] || (['med','ind','sea'].includes(zone)?'Wield one compact curved boarding saber.':'Wield one compact period boarding sword or cutlass.');
    const prompt=`Use case: stylized-concept. Asset type: historical adventure RPG duel animation sprite sheet. Character: ${p.name}, ${p.g==='f'?'adult woman':'adult man'} pirate captain of ${region}. Game identity and appearance (Korean): ${p.look}. ${ref?'Input image role: IDENTITY AND COSTUME REFERENCE ONLY. Preserve the referenced face, hair, age, ethnicity, headgear, distinctive costume colors and accessories; construct full-body side-view animation from it. Do NOT include the portrait backdrop, framing, text or pose layout.':''} ${weapon} Exactly SIX columns FOUR rows, 24 equally spaced SQUARE cells on a 1536x1024 canvas. Row 1 six successive attack poses: anticipation, windup, advance, strike, followthrough, recover. Row 2 guard, brace, parry, recoil, guard, guard. Row 3 standing flinch, knees buckling, FULLY LYING DEFEATED ON GROUND, repeat lying pose for remaining three cells. Row 4 six distinct idle breathing and small stepping poses. ALL figures face RIGHT in consistent side view. Same character, face, outfit, weapon and scale in ALL cells. Hand painted historical adventure RPG art, clear realistic proportions, crisp contours, rich restrained shading, full color even if reference is monochrome. Genuine TRANSPARENT PNG alpha background. NO scenery, floor, ground shadows, pale haze, background color, checkerboard, grid lines, text or labels. Entire bodies, heads, clothing, weapon tips must stay strictly INSIDE their own cell with blank padding; NO overlapping cells or clipped tips. Ground baseline at 94 percent cell height. Distinct animation poses. No firearms being fired, no modern weapons, no extra people.`;
    entries.push({id,name:p.name,type:'duel',gender:p.g,zone,region,historical:!!p.hist,sourceKind,look:p.look,reference:ref?path.join(root,ref).replaceAll('\\','/'):null,prompt});
  }
}
fs.mkdirSync(path.join(base,'sources'),{recursive:true});
fs.writeFileSync(path.join(base,'prompts.json'),JSON.stringify(entries,null,2));
console.log(JSON.stringify(entries.map(p=>({id:p.id,name:p.name,region:p.region,reference:!!p.reference})),null,2));
