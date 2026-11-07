// 발견 유물 더하기 표 만들기 — node gen.js  → out/discrelics.js · out/prompts.json · out/list.md
const fs = require('fs'), path = require('path');
const CR = require('./input/creatures.json'), FC = require('./input/faith_candidates.json');
const LEG = require('./legend.js'), REL = require('./religion.js');
function h(s) { let x = 2166136261; for (const c of s) { x ^= c.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; } return x; }
const out = [], names = new Set();
// 이미 있는 유물 이름도 겹치지 않게
CR.forEach(c => (c.rel || '').split(';').filter(Boolean).forEach(r => names.add(r.split(':').slice(1).join(':'))));
FC.forEach(c => (c.rel || '').split(';').filter(Boolean).forEach(r => names.add(r)));
function push(disc, group, rid, name, kind, v, desc, extra) {
  if (names.has(name)) throw new Error('이름 겹침 ' + name);
  names.add(name); out.push({ disc, group, rid, name, kind, v, desc, extra: extra || null });
}
// ---------------- 전설 생물
const legendIds = new Set(LEG.map(x => x[0]));
LEG.forEach(([d, n, k, v, desc, ex]) => push(d, 'legend', 'r_' + d + '_legend', n, k, v, desc, ex));
// ---------------- 동물 새끼
const DOG = 'shiba pomeranian pug corgi yorkie shihtzu golden bostonterrier dachshund papillon'.split(' ');
const CAT = 'siamese russianblue persian angora koreancat vancat'.split(' ');
const HORSE = 'shire friesian przewalski redhare kulan'.split(' ');
const FISH = 'f_bluefin f_swordfish f_sturgeon f_flying f_sunfish f_marlin f_puffer f_oarfish f_seadragon flyingfish sailfish pufferfish lionfish angelfish clownfish bluetang shiri piranha coelacanth electriceel'.split(' ');
const WATER = 'whale dolphin manta jellyfish lobster hermitcrab dugong boto baikalseal sealion walrus seaotter narwhal manatee humpback f_giantsquid'.split(' ');
const BUG_NAME = { monarchwinter: '제왕나비', periodical: '십칠년매미', fireflyriver: '반딧불이' };
function short(n) { return n.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s*—.*$/, '').replace(/^.*의 /, '').trim(); }
const A_DESC = [
  n => `어미 곁을 떠나 헤매던 ${n} 새끼를 거두어 왔다. 우리에 넣어 배에 실었고, 선원들이 번갈아 먹이를 준다. 왕실 동물원과 박물학자들이 앞다투어 사려 한다.`,
  n => `아직 어린 ${n} 새끼. 낯선 배 위에서도 금세 사람 손을 탔다. 이만한 것을 산 채로 데려온 사람은 드물어, 궁정에 바치면 큰 자랑이 된다.`,
  n => `보금자리 곁에서 데려온 어린 ${n}. 아직 어미를 찾아 두리번거린다. 잘 키워 내면 후원자와 박물학자 모두가 탐낸다.`
];
CR.forEach(c => {
  if (legendIds.has(c.id) || c.id === 'bullocho' || c.id === 'bluerose') return;
  if (c.g === 'LB') return;
  if (['pomeranian', 'yorkie', 'golden', 'bostonterrier'].includes(c.id)) return;   // 1700년 뒤에 생긴 품종 — 신기루로만 보이니 데려올 새끼가 없다
  const n = short(c.name);
  let name, desc, art;
  if (DOG.includes(c.id)) { name = n + ' 강아지'; desc = `아직 어린 ${n} 강아지. 갑판을 뒤뚱뒤뚱 따라다녀 선원들이 서로 안아 보겠다고 다툰다. 귀족 부인들이 큰값을 쳐 준다.`; art = 'puppy'; }
  else if (CAT.includes(c.id)) { name = n + ' 새끼'; desc = `버들 바구니에 담아 온 ${n} 새끼. 자라면 배의 쥐를 잡는 든든한 식구가 된다. 귀부인들의 사랑을 받는 귀한 품종이다.`; art = 'kitten'; }
  else if (HORSE.includes(c.id)) { name = n + ' 망아지'; desc = c.id === 'redhare' ? '붉은 털에 갈기가 불꽃처럼 일렁이는 망아지. 하루 천 리를 달렸다는 적토마의 혈통이라 한다. 다리가 길고 눈빛이 사납다.' : `가는 다리로 겨우 선 ${n} 망아지. 마구간 칸을 따로 내어 배에 실었다. 자라면 이름난 말이 된다.`; art = 'foal'; }
  else if (c.id === 'tarantula') { name = '골리앗버드이터 새끼거미'; desc = '알주머니에서 갓 나온 털북숭이 새끼거미 몇 마리를 나무 상자에 담아 왔다. 다 자라면 접시만 해진다. 물리지 않게 조심해야 한다.'; art = 'young'; }
  else if (c.id === 'dartfrog') { name = '독화살개구리 올챙이'; desc = '빗물을 받은 잎 속 웅덩이에서 건진 독화살개구리 올챙이. 어미가 등에 업어 나르던 것이다. 다 자라면 손대기 무서울 만큼 화려한 빛깔이 된다.'; art = 'fry'; }
  else if (c.g === 'I') { const b = BUG_NAME[c.id] || n; name = b + ' 애벌레'; desc = `먹이 잎과 함께 나무 상자에 담아 온 ${b} 애벌레. 탈바꿈을 마치면 박물학자들이 탐내는 표본이 된다.`; art = 'larva'; }
  else if (FISH.includes(c.id) || c.g === 'F' && c.id !== 'f_giantsquid') { name = n + ' 치어'; desc = `바닷물(강물)을 채운 유리병에 담아 온 ${n} 치어 몇 마리. 날마다 물을 갈아 주어야 한다. 학자들이 살아 있는 것을 보고 싶어 한다.`; art = 'fry'; }
  else if (WATER.includes(c.id)) { name = n + ' 새끼'; desc = `갑판 위 큰 물통에 물을 채워 데려온 어린 ${n}. 날마다 물을 갈고 먹이를 대느라 선원들이 바쁘다. 살아 있는 것을 본 사람은 드물다.`; art = 'water'; }
  else { name = n + ' 새끼'; desc = A_DESC[h(c.id) % 3](n); art = 'young'; }
  push(c.id, 'baby', 'r_' + c.id + '_baby', name, 'animal', 0.2, desc, null);
  out[out.length - 1].art = art;
});
// ---------------- 종교 성물
const T = {
  C: [['은 십자가 목걸이', 'gift', '{s}의 사제가 순례자에게 내어 준 작은 은 십자가 목걸이. 뒷면에 성인의 이름이 새겨져 있다.'],
      ['은촛대', 'treasure', '{s} 제단 곁에 서 있던 은촛대. 받침에 성인의 얼굴이 돋을새김되어 있고 촛농 자국이 겹겹이 남아 있다.'],
      ['시도서', 'book', '{s}의 수도사가 금박과 물감으로 꾸며 베낀 작은 기도서. 하루 여덟 번의 기도문과 성인들의 축일이 적혀 있다.'],
      ['묵주', 'gift', '{s}에서 축복받은 장미나무 구슬 묵주. 구슬마다 손때가 배어 반들거리고 끝에 작은 십자가가 달려 있다.'],
      ['은 향로', 'treasure', '사슬에 매달아 흔드는 {s}의 은 향로. 뚜껑 구멍마다 유향 냄새가 배어 있다.'],
      ['성작', 'treasure', '{s}의 미사에 쓰던 금도금 은잔. 잔 받침에 포도덩굴과 어린 양이 새겨져 있다.']],
  O: [['이콘 목걸이', 'gift', '{s}의 수도사가 그린 손톱만 한 성모 이콘을 은테에 넣은 목걸이.'],
      ['이콘 앞 기도 등잔', 'treasure', '{s}의 이콘 앞에 매달던 붉은 유리 등잔. 은사슬 세 줄에 매달려 있다.'],
      ['시편 필사본', 'book', '{s}에서 베낀 그리스어(교회 슬라브어) 시편. 머리글자마다 금박이 입혀져 있다.'],
      ['청동 축복 십자가', 'treasure', '{s}의 사제가 축복할 때 들던 청동 십자가. 가로대가 셋이고 가운데 그리스도가 새겨져 있다.'],
      ['은 향로', 'treasure', '방울이 달린 {s}의 은 향로. 흔들면 방울 소리와 함께 향 연기가 오른다.']],
  I: [['꾸란 필사본', 'book', '{s}의 서고에서 나온 꾸란 필사본. 금박 테두리 안에 검은 먹으로 글자를 쓰고 붉은 점으로 모음을 찍었다.'],
      ['놋쇠 모스크 등잔', 'treasure', '{s}의 천장에 매달던 놋쇠 등잔. 투조한 별무늬 사이로 불빛이 새어 나온다.'],
      ['기도 깔개', 'gift', '{s}에서 쓰던 작은 기도 깔개. 메카를 가리키는 아치 문양이 짜여 있다.'],
      ['미스바하 염주', 'gift', '{s}의 이맘이 지니던 서른세 알 염주. 대추야자 씨처럼 갈색으로 반들거린다.'],
      ['향로', 'treasure', '{s} 안뜰에서 쓰던 놋쇠 향로. 유향을 피우면 둥근 뚜껑 구멍마다 연기가 오른다.']],
  B: [['염주', 'gift', '{s}의 스님이 백팔 번 절하며 돌리던 보리수 열매 염주.'],
      ['사경 두루마리', 'book', '{s}에서 금니로 베낀 불경 두루마리. 첫머리에 부처의 설법 그림이 그려져 있다.'],
      ['청동 향로', 'treasure', '{s}의 불단 앞에 놓였던 세 발 청동 향로. 향 냄새가 아직 배어 있다.'],
      ['연꽃 촛대', 'treasure', '{s}의 불단을 밝히던 연꽃 받침 놋쇠 촛대.'],
      ['목탁', 'treasure', '{s}의 스님이 예불 때 두드리던 나무 목탁. 손잡이가 닳아 반들반들하다.'],
      ['금동 소불상', 'treasure', '{s}의 작은 법당에 모시던 손바닥만 한 금동 불상.']],
  T: [['마니차', 'treasure', '{s}의 순례자가 돌리던 손 기도 바퀴. 안에 「옴 마니 반메 훔」을 적은 종이가 수천 번 감겨 있다.'],
      ['금강저와 금강령', 'treasure', '{s}의 라마가 의식에 쓰던 청동 금강저와 방울 한 벌.'],
      ['경전 다발', 'book', '{s}의 서고에서 나온 길쭉한 종이 경전 다발. 나무판 두 장 사이에 끼워 비단으로 묶었다.'],
      ['버터 등잔', 'treasure', '{s}의 불단 앞에서 야크 버터를 태우던 은 등잔.'],
      ['카타 비단 스카프', 'gift', '{s}에서 축복을 담아 건네받은 흰 비단 스카프 카타.']],
  H: [['아르티 등잔', 'treasure', '{s}의 사제가 신상 앞에서 원을 그리며 흔들던 여러 갈래 놋쇠 등잔.'],
      ['제례 종', 'treasure', '{s}의 사당 문간에 매달아 들어갈 때 울리던 놋쇠 종. 손잡이 끝에 작은 신상이 앉아 있다.'],
      ['야자잎 경전', 'book', '{s}의 사제가 지니던 야자잎 경전. 잎마다 송곳으로 글자를 긁고 그을음을 먹였다.'],
      ['소라 나팔', 'treasure', '{s}의 예배를 알리던 흰 소라 나팔. 은으로 테를 둘렀다.'],
      ['루드라크샤 염주', 'gift', '{s}의 수행자가 걸던 주름진 열매 염주. 시바의 눈물이라고 부른다.']],
  S: [['구루 그란트 사히브 사본', 'book', '{s}에서 베낀 시크교 경전의 사본. 비단 보자기에 싸여 있다.'],
      ['카라 쇠팔찌', 'gift', '{s}의 순례자가 끼는 둥근 쇠팔찌.']],
  K: [['제례 놋쇠 촛대', 'treasure', '{s}의 제사상을 밝히던 놋쇠 촛대 한 쌍 가운데 하나.'],
      ['제기 한 벌', 'treasure', '{s}의 제사에 쓰던 굽 높은 놋쇠 제기.'],
      ['제례 홀기', 'book', '{s}의 제사 순서와 축문을 적은 홀기 책.']],
  D: [['도덕경 사본', 'book', '{s}의 도사가 베낀 『도덕경』. 오천 글자가 한 권에 빼곡하다.'],
      ['팔괘 거울', 'treasure', '{s}의 문 위에 걸던 팔괘 둘린 청동 거울. 나쁜 기운을 되비춘다고 한다.']],
  A: [['봉헌 등잔', 'treasure', '{s}의 신상 앞에 바치던 흙 기름 등잔. 손잡이에 신의 얼굴이 빚어져 있다.'],
      ['제주 그릇', 'treasure', '{s}의 사제가 신에게 술과 기름을 부어 바치던 얕은 청동 그릇.'],
      ['기도문 두루마리', 'book', '{s}의 사제들이 외던 기도문을 옛 글자로 적은 두루마리.'],
      ['신상 부적', 'gift', '{s}에 모신 신의 모습을 본뜬 작은 부적. 순례자들이 목에 걸고 다녔다.']],
  M: [['코팔 향로', 'treasure', '{s}의 사제가 코팔 수지를 태우던 흙 향로. 뚜껑에 신의 얼굴이 빚어져 있다.'],
      ['흑요석 제사 칼', 'treasure', '{s}의 제단에서 쓰던 검은 흑요석 칼. 손잡이에 조개와 비취가 박혀 있다.'],
      ['그림 문서', 'book', '{s}의 사제가 접어 지니던 나무껍질 종이 그림 문서. 제삿날과 별의 움직임이 적혀 있다.'],
      ['비취 봉헌 구슬', 'gift', '{s}의 성스러운 샘에 던져 바치던 비취 구슬.']]
};
const SITE = { paladoro: '산 마르코 대성당 보물실', belemmonstrance: '벨렝 왕실 예배당', creation: '시스티나 예배당', lastsupper: '그라치에 수도원', reliquary: '쾰른 대성당',
  tripitaka: '해인사 장경판전', kalachakra: '칼라차크라 법회', shiva: '나타라자 사당', sinai: '시나이산 예배당', kailash: '카일라스 순례길', manasarovar: '마나사로바르 호숫가 사원',
  arthurtomb: '글래스턴베리 수도원', pangboche: '팡보체 사원', guge: '구게 붉은 사원', marib: '마리브 해의 신전', hwangnyong: '황룡사', ayubuddha: '아유타야 왓 마하탓',
  adamspeak: '스리파다 순례길', putuo: '보타산', harmandir: '하르만디르 사히브', vittala: '비탈라 사원', ajanta: '아잔타 석굴 승원', machupicchu: '마추픽추 태양의 신전',
  chichen: '치첸 이트사', ur: '우르의 달신 신전', giralda: '세비야 대성당', barkal: '게벨 바르칼 아문 신전', rockdome: '알아크사 성역', zeus: '올림피아 제우스 신전', artemis: '에페소스 아르테미스 신전', gadir: '가디르 헤라클레스 신전', philae: '필레 이시스 신전',
  nabawi: '예언자의 모스크', angkorthom: '바욘 사원', barabarcaves: '바라바르 석굴', elephantacaves: '엘레판타 석굴', palenque: '팔렝케 신전', uxmal: '욱스말 신전', tikal: '티칼 신전', chavin: '차빈 신전', pachacamac: '파차카막 신전', elmirador: '엘 미라도르 신전', haleokeawe: '할레 오 케아웨' };
const CUSTOM = {
  stcrown: ['에스테르곰 대성당의 대관식 기도서', 'book', '헝가리 왕이 왕관을 받던 날 대주교가 읽은 기도문을 금박으로 꾸며 베낀 책. 성 이슈트반이 나라를 성모에게 바쳤다는 이야기로 시작한다.'],
  holylance: ['황제 보물실의 은 성합', 'treasure', '성창과 함께 모시던 은 성합. 뚜껑의 수정 창 너머로 작은 나뭇조각이 보인다 — 십자가의 나무라고 한다.'],
  tripitaka: ['팔만대장경 인경본 한 권', 'book', '팔만대장경 경판에 먹을 발라 한 장씩 찍어 묶은 불경 한 권. 오천만 글자를 새겼다는데 이 책 안의 글자도 한 획 흐트러짐이 없다.'],
  kalachakra: ['칼라차크라 만다라 탕카', 'treasure', '「시간의 바퀴」 만다라를 광물 물감으로 그린 비단 두루마리 그림. 가운데 궁전 둘레로 신들이 겹겹이 앉아 있고, 바깥 테두리에 불꽃이 두른다.']
};
const fcById = {}; FC.forEach(c => { fcById[c.id] = c; });
const KEY = ['십자가', '촛대', '기도서', '시도서', '묵주', '향로', '성작', '이콘', '등잔', '필사본', '꾸란', '깔개', '염주', '경', '목탁', '불상', '마니차', '기도 바퀴', '금강저', '카타', '종', '소라', '제기', '홀기', '거울', '부적', '칼', '구슬', '그릇', '두루마리', '문서'];
const religionOf = {};
Object.keys(REL).forEach(k => REL[k].split(/\s+/).filter(Boolean).forEach(id => { if (religionOf[id]) throw new Error('두 번 ' + id); religionOf[id] = k; }));
Object.keys(religionOf).forEach(id => {
  const c = fcById[id]; if (!c) throw new Error('없는 종교 발견물 ' + id);
  if (c.fut) return;   // 신기루(아직 세상에 없는 건물)는 손에 넣을 것이 없다
  const k = religionOf[id], list = T[k], have = c.rel || '';
  if (CUSTOM[id]) { const q = CUSTOM[id]; push(id, 'faith', 'r_' + id + '_holy', q[0], q[1], 0.25, q[2], null); out[out.length - 1].faith = k; return; }
  const s = SITE[id] || c.name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s*—.*$/, '').replace(/의 /g, ' ').trim();
  const start = h(id) % list.length;
  let pick = null;
  for (let i = 0; i < list.length && !pick; i++) {
    const t = list[(start + i) % list.length], word = KEY.find(w => t[0].includes(w));
    const nm = s + '의 ' + t[0];
    if (word && have.includes(word)) continue;       // 이미 같은 갈래의 성물이 있으면 다른 것으로
    if (names.has(nm)) continue;
    pick = [nm, t[1], t[2].replace(/\{s\}/g, s)];
  }
  if (!pick) throw new Error('고를 것이 없다 ' + id);
  push(id, 'faith', 'r_' + id + '_holy', pick[0], pick[1], 0.25, pick[2], null);
  out[out.length - 1].faith = k;
});
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out/data.json'), JSON.stringify(out, null, 1));
const cnt = {}; out.forEach(o => cnt[o.group] = (cnt[o.group] || 0) + 1);
console.log(out.length, cnt);
