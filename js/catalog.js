/* PLUS ULTRA 도감: 게임에 나오는 도시·인물·발견물·배·건물 내부를 게임과 같은 그림으로 보여 주고,
   그림을 바꿀 때 쓸 파일 이름(images/…)을 알려 준다. 그림은 js/art 의 함수를 그대로 쓴다. */
(function (G) {
  'use strict';
  const A = G.Art, I = G.Img;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => Number(n).toLocaleString('ko-KR');
  const map = pairs => Object.fromEntries(pairs);
  const STYLE = map(I.STYLES), CUL = map(I.CULTURES), NPCN = map(I.NPCS), INTN = map(I.INTERIORS);
  const MAIDST = map(I.MAIDSTYLES || []), MAIDSTYLE = new Set(Object.keys(MAIDST));
  const REL = { C: '가톨릭', O: '정교회', I: '이슬람교', H: '힌두교', B: '불교', K: '유교', J: '신도·불교', N: '토착 신앙' };
  const HOW = { sea: '바다에서 발견', land: '육상 탐험', city: '도시에 입항', trade: '교역품 첫 구입', special: '특별한 조건' };
  const SIZE = { 1: '작은 도시', 2: '보통 도시', 3: '큰 도시' };
  const SAIL = { sq: '사각돛', lat: '삼각돛', bat: '대나무 살 돛' };
  const NATION = { PT: '포르투갈', ES: '에스파냐' };
  const CITY = G.CITY_DATA;
  const cityByName = n => CITY.find(c => c.name === n) || CITY[0];
  const CUL_CITY = { europe: CITY[0], islam: CITY[112], eastasia: cityByName('항주'), south: CITY[152], native: cityByName('테노치티틀란') };
  const goodName = id => (G.GOOD[id] || {}).name || id;
  const lat = v => (v >= 0 ? '북위 ' : '남위 ') + Math.abs(v).toFixed(1) + '°';
  const lon = v => (v >= 0 ? '동경 ' : '서경 ') + Math.abs(v).toFixed(1) + '°';

  // ---------------------------------------------------------------- helpers
  function pathOf(key, kind) {
    const f = I.path(key);
    return 'images/' + (f || key + (kind === 'png' ? '.png' : '.jpg'));
  }
  function copyCanvas(src, w, h) {
    const c = document.createElement('canvas');
    c.width = w || src.width; c.height = h || src.height;
    const ctx = c.getContext('2d');
    if (w || h) I.drawCover(ctx, src, 0, 0, c.width, c.height); else ctx.drawImage(src, 0, 0);
    return c;
  }
  /** GIF를 Canvas로 복사하면 첫 프레임만 남는다. 애니메이션 항목은 원본 요소를 쓴다. */
  function animatedImage(it) {
    const k = it.animated && it.chain && I.pick(it.chain), f = k && I.file(k);
    if (!f || !(I.isAnim ? I.isAnim(k) : /\.gif(?:$|[?#])/i.test(f))) return null;
    const img = new Image(); img.src = I.src(k); img.alt = it.name + ' 복원 애니메이션';
    return img;
  }
  const portrait = spec => A.portraitCanvas(spec, 160);
  function churchName(c) { if (c.places && c.places.church) return c.places.church; return c.rel === 'I' ? '모스크' : 'HBJ'.includes(c.rel) ? '사원' : c.rel === 'K' ? '사당' : c.rel === 'N' ? '신전' : '교회'; }
  function palaceName(c) {
    const sp = G.SPONSORS.find(s => s.city === c.id && s.bld === 'palace');
    return sp && sp.type === 'gov' ? '총독부' : sp && sp.type === 'pope' ? '교황청' : sp && sp.type === 'official' ? '시청' : '왕궁';
  }
  /** same rule as the game (R.facilities) */
  function facilities(c) {
    const out = [];
    if (c.port) out.push('항구');
    out.push('교역소');
    if (c.port && c.size >= 2) out.push('조선소');
    out.push('술집', '여관');
    if (c.size >= 2 && c.id !== 92) out.push('시장');
    out.push(churchName(c));
    if (c.flags.includes('L') || G.BOOKS.some(b => b.libs.includes(c.id))) out.push((c.places && c.places.library) || '도서관');
    const sps = G.SPONSORS.filter(s => s.city === c.id);
    const named = sps.filter(s => s.bld === 'palace' && s.place);
    if (named.length) named.forEach(s => out.push(s.place));
    else if (c.flags.includes('P') || sps.some(s => s.bld === 'palace')) out.push(palaceName(c));
    const mans = sps.filter(s => s.bld !== 'palace');
    mans.filter(s => s.place).forEach(s => out.push(s.place));
    const plain = mans.filter(s => !s.place).length;
    if (plain) out.push(plain > 1 ? '저택 ' + plain + '채' : '저택');
    if (c.flags.includes('G') || c.size >= 3) out.push('조합');
    out.push('성문');
    return out;
  }
  const fameFor = d => Math.round(d.val / 26 + d.pw * 30);   // 게임과 같은 식 (G.Disc.fameFor)
  /** escaped path with break opportunities after each slash */
  const pathHtml = p => esc(p).replace(/\//g, '/<wbr>');

  // ---------------------------------------------------------------- tabs & items
  const TABS = [], ITEM = {};
  function tab(id, label, opts) { const t = Object.assign({ id, label, items: [], chips: null, chip: 'all', note: '' }, opts || {}); TABS.push(t); return t; }
  function add(t, it) {
    it.uid = t.id + ':' + t.items.length;
    it.text = [it.name, it.sub, it.meta, it.key, (it.chain || []).join(' '), it.extra || ''].join(' ').toLowerCase();
    t.items.push(it); ITEM[it.uid] = it;
    return it;
  }

  // ------------------------------------------------ cities
  const tCity = tab('cities', '도시', {
    chips: [['all', '전체']].concat(G.REGIONS.map((r, i) => [String(i), r])),
    note: '파일: <code>images/cities/도시번호.jpg</code> · 권장 1600×900 · 해질녘 <code>_golden</code>, 저녁 <code>_dusk</code>를 붙인 파일도 쓸 수 있습니다.'
  });
  CITY.forEach(c => {
    const sps = G.SPONSORS.filter(s => s.city === c.id);
    const maid = G.MAIDS.find(m => m.city === c.id);
    const discs = G.DISCOVERIES.filter(d => d.how === 'city' && d.city === c.id);
    add(tCity, {
      group: String(c.region), name: c.name, sub: '#' + c.id + ' · ' + G.REGIONS[c.region] + ' · ' + c.nation,
      meta: G.LANGS[c.lang] + ' · ' + (REL[c.rel] || '') + ' · ' + (c.port ? '항구' : '내륙') + ' · ' + SIZE[c.size],
      key: 'cities/' + c.id, kind: 'jpg', chain: I.chain.city(c, 'day'), ar: '16 / 9',
      extra: c.goods.map(goodName).join(' ') + ' ' + STYLE[c.style],
      pic: () => I.make(I.chain.city(c, 'day'), 1600, 900, () => A.cityScene(c, { time: 'day' })),
      detail: () => ({
        facts: [
          ['지역', G.REGIONS[c.region]], ['처음 다스리는 나라', c.nation], ['말', G.LANGS[c.lang]], ['종교', REL[c.rel]],
          ['규모', SIZE[c.size] + (c.port ? ' · 항구' : ' · 내륙')], ['건물', facilities(c).join(', ')],
          ['특산품', c.goods.map(goodName).join(', ')], ['건축 양식', STYLE[c.style] + ' (' + c.style + ')'],
          c.founded ? ['건설', c.founded + '년'] : null,
          c.until ? ['사라짐', c.until + '년'] : null,
          c.flags.includes('H') ? ['입항', '성지 — 다른 종교의 함대는 들어갈 수 없음'] : null,
          c.flags.includes('X') ? ['입항', '쇄국 — 교섭이나 잠입이 필요함'] : null,
          c.flags.includes('E') ? ['지위', '제국의 수도'] : null,
          sps.length ? ['후원자', sps.map(s => s.title).join(', ')] : null,
          maid ? ['여급', maid.name] : null,
          discs.length ? ['입항하면 발견', discs.map(d => d.name).join(', ')] : null,
          ['위치', lat(c.lat) + ', ' + lon(c.lon)]
        ],
        files: [
          { key: 'backgrounds/' + c.id, kind: 'jpg', note: '거리 화면의 배경 (이 도시만)' },
          { key: 'bg-styles/' + c.style + (c.port ? '_port' : '_inland') + '_a', kind: 'jpg', note: '거리 배경 · 같은 양식의 ' + (c.port ? '항구' : '내륙') + ' 도시 공통 (여러 장이면 _a, _b …)' },
          { key: 'cities/' + c.id, kind: 'jpg', note: '거리 그림이 없을 때 쓰는 도시 풍경 (낮)' },
          { key: 'cities/' + c.id + '_golden', kind: 'jpg', note: '해질녘 — 없으면 낮 그림에 노을빛을 입힘' },
          { key: 'cities/' + c.id + '_dusk', kind: 'jpg', note: '저녁 — 없으면 낮 그림에 노을빛을 입힘' },
          { key: 'city-styles/' + c.style, kind: 'jpg', note: '같은 양식(' + STYLE[c.style] + ') 도시 공통' }
        ]
      })
    });
  });

  // ------------------------------------------------ people
  const tPeople = tab('people', '인물', {
    chips: [['all', '전체'], ['mate', '동료'], ['sponsor', '후원자'], ['maid', '여급'], ['maidstyle', '지역별 여급'], ['rival', '경쟁자'], ['npc', '마을 사람']],
    note: '파일: 동료 <code>portraits/mates/ID.png</code> · 후원자 <code>portraits/sponsors/ID.png</code> · 여급 <code>portraits/maids/ID.png</code> · 지역별 여급 <code>maid-styles/묶음/1.png</code>(흉상) <code>maid-styles/묶음/1_half.png</code>(서 있는 모습, 여러 장 가능) · 경쟁자 <code>portraits/rivals/이름.png</code> · 마을 사람 <code>portraits/npc/역할.png</code> · 권장 512×512, 얼굴은 위쪽에'
  });
  const skillTxt = sk => Object.keys(sk || {}).map(k => (G.SKILL_BY_ID[k] || {}).name + ' ' + sk[k]).join(' · ');
  const langTxt = lg => Object.keys(lg || {}).sort((a, b) => lg[b] - lg[a]).map(k => G.LANGS[k] + ' ' + G.LANG_LV[lg[k]]).join(', ');
  G.MATES.forEach(m => {
    const spec = A.mateSpec(m.id);
    add(tPeople, {
      group: 'mate', portrait: true, name: m.name, sub: (m.witch ? (m.legend ? '전설의 마녀' : '마녀로 몰렸던 여인') : '동료') + ' · 명성 ' + num(m.fame) + ' 이상 · ' + m.y[0] + '~' + m.y[1] + '년',
      meta: skillTxt(m.sk), key: 'portraits/mates/' + m.id, kind: 'png', chain: spec.img, ar: '1 / 1', extra: m.desc,
      pic: () => portrait(spec),
      detail: () => ({
        text: m.desc + (G.BIOS && G.BIOS[m.name] ? ' 〔인물 이야기〕 ' + G.BIOS[m.name] : ''),
        facts: [
          ['능력치', G.STATS.map((s, i) => s.name + ' ' + m.st[i]).join(' · ')], ['특기', skillTxt(m.sk)], ['어학', langTxt(m.lg)],
          ['만나는 곳', (G.MATE_RANGE && G.MATE_RANGE[m.id] ? G.MATE_RANGE[m.id].zones.map(z => G.MATE_ZONES[z].name).join('·') + ' 도시의 술집·여관 — 한 달에 한 번 이웃 도시로 옮기거나 머묾 (처음: ' + G.CITY_DATA[G.MATE_RANGE[m.id].home].name + ')' : m.reg.map(r => G.REGIONS[r]).join(', ') + '의 술집')],
          ['만날 수 있는 때', m.y[0] + '~' + m.y[1] + '년' + (m.after ? (nm => ' · ' + nm + G.U.jx(nm, '이/가') + ' 알려진 뒤')(m.after.map(id => G.DISC[id] ? G.DISC[id].name : id).join('·')) : '')],
          ['필요한 명성', num(m.fame)], ['월급', num(m.wage) + '닢']
        ],
        files: [{ key: 'portraits/mates/' + m.id, kind: 'png', note: '이 동료의 초상' }]
      })
    });
  });
  G.SPONSORS.forEach(sp => {
    const c = CITY[sp.city];
    const spec0 = A.sponsorSpec(sp, 0);
    add(tPeople, {
      group: 'sponsor', portrait: true, name: sp.title, sub: '후원자 · ' + c.name + ' · ' + G.SPONSOR_TYPE[sp.type],
      meta: (hs => hs.slice(0, 6).map(h => h[2]).join(' → ') + (hs.length > 6 ? ' → … (' + hs.length + '대)' : ''))(sp.holders.filter(h => h[4] !== 'g')), key: 'portraits/sponsors/' + sp.id, kind: 'png', chain: spec0.img, ar: '1 / 1',
      pic: () => portrait(spec0),
      detail: () => ({
        text: (bs => bs.length ? '인물 이야기 — ' + bs.join(' / ') : '')(sp.holders.filter(h => h[4] !== 'g').map(h => {
          const k = G.BIOS && (G.BIOS[h[2]] ? h[2] : Object.keys(G.BIOS).filter(x => x.length >= 3 && h[2].indexOf(x) >= 0).sort((a, b) => b.length - a.length)[0]);
          return k ? h[2] + ': ' + G.BIOS[k] : null;
        }).filter(Boolean)),
        facts: [
          ['사는 곳', c.name + ' · ' + (sp.place || (sp.bld === 'palace' ? palaceName(c) : '저택'))], ['신분', G.SPONSOR_TYPE[sp.type]],
          ['세력', G.POWER_NAME[sp.pw] + ' (만나려면 명성 ' + num(G.POWER_FAME[sp.pw]) + ')'], ['재력', '★'.repeat(sp.wealth)],
          ['좋아하는 발견', sp.taste.map(t => G.DISC_CATS[t]).join(', ')], ['말', G.LANGS[sp.lang]],
          sp.nation ? ['나라', NATION[sp.nation]] : null
        ],
        strip: sp.holders.map((h, i) => ({ label: h[2] + ' (' + h[0] + '~' + (h[1] >= 9999 ? '' : h[1]) + ')', key: (p => typeof p === 'string' ? 'portraits/sponsors/' + p : p ? 'portraits/sponsors/' + sp.id + '_' + p : 'portraits/sponsors/' + sp.id)(A.sponsorPic(sp, i)), kind: 'png', pic: () => portrait(A.sponsorSpec(sp, i)) })),
        files: [
          { key: 'portraits/sponsors/' + sp.id + '_1', kind: 'png', note: '시대별 인물 — 아래 그림의 번호(1, 2, …)를 붙입니다' },
          { key: 'portraits/sponsors/' + sp.id, kind: 'png', note: '인물이 바뀌어도 같은 그림' }
        ]
      })
    });
  });
  G.MAIDS.forEach(m => {
    const spec = A.maidSpec(m), c = CITY[m.city], reg = I.maidStyle ? I.maidStyle(m.id, c) : null;
    add(tPeople, {
      group: 'maid', portrait: true, name: m.name, sub: '여급 · ' + c.name + ' 술집',
      meta: '좋아하는 사람: ' + G.LIKES[m.like].name + (reg ? ' · 그림: ' + (MAIDST[reg] || reg) : ''),
      key: 'portraits/maids/' + m.id, kind: 'png', chain: spec.img, ar: '1 / 1',
      pic: () => portrait(spec),
      detail: () => ({
        facts: [['일하는 곳', c.name + ' 술집'], ['좋아하는 사람', G.LIKES[m.like].name],
          ['쓰는 그림', reg ? (MAIDST[reg] || reg) + ' (maid-styles/' + reg + ')' : '코드로 그린 초상'],
          ['결혼', '호감이 높아지면 반지를 건네 청혼할 수 있음']],
        files: [{ key: 'portraits/maids/' + m.id, kind: 'png', note: '이 여급만의 초상 (없으면 지역 그림을 쓴다)' },
          { key: 'portraits/maids/' + m.id + '_half', kind: 'png', note: '술집에 서 있는 모습 (없으면 지역 그림)' }]
      })
    });
  });
  // 지역별 여급 그림: 전용 초상이 없는 여급이 쓴다
  (I.MAIDSTYLES || []).forEach(([sid, label]) => {
    const pics = I.list('maid-styles/' + sid + '/').filter(k => !/_half$/.test(k));
    const users = G.MAIDS.filter(m => I.maidStyle && I.maidStyle(m.id, CITY[m.city]) === sid && !I.has('portraits/maids/' + m.id));
    const styles = Object.keys(I.MAID_POOL || {}).filter(k => (I.MAID_POOL[k] || []).includes(sid)).map(k => STYLE[k] || k);
    const first = pics[0] || 'maid-styles/' + sid;
    add(tPeople, {
      group: 'maidstyle', portrait: true, name: label, sub: '지역별 여급 그림 ' + (pics.length || 0) + '장',
      meta: users.length ? users.map(m => m.name + '(' + CITY[m.city].name + ')').join(', ') : '아직 쓰는 여급이 없음',
      key: first, kind: 'png', chain: [first], ar: '1 / 1',
      pic: () => I.make([first], 512, 512, () => A.canvas(512, 512)),
      detail: () => ({
        text: '한 묶음에 여러 장을 넣으면 도시마다 다른 얼굴이 나옵니다. 여급 번호로 한 장이 정해져 늘 같은 얼굴을 씁니다.',
        facts: [['그림 수', (pics.length || 0) + '장'],
          ['쓰는 여급', users.length ? users.map(m => m.name + ' · ' + CITY[m.city].name).join(', ') : '없음'],
          ['적용되는 도시 양식', styles.join(', ') || '고정 배정만']],
        strip: pics.slice(0, 24).map(k => ({ label: k.split('/').pop(), key: k, kind: 'webp',
          pic: () => I.make([k], 320, 320, () => A.canvas(320, 320)) })),
        files: [{ key: 'maid-styles/' + sid + '/1', kind: 'png', note: '대화창 흉상 (512×512) — 2, 3 … 을 더 넣을 수 있습니다' },
          { key: 'maid-styles/' + sid + '/1_half', kind: 'png', note: '술집에 서 있는 모습 (세로로 긴 그림, 배경 투명)' }]
      })
    });
  });
  const rivals = [];
  G.DISCOVERIES.forEach(d => { if (d.rival && !rivals.includes(d.rival[2])) rivals.push(d.rival[2]); });
  rivals.forEach(nm => {
    const spec = A.rivalSpec(nm), ds = G.DISCOVERIES.filter(d => d.rival && d.rival[2] === nm);
    const mate = G.MATES.find(m => m.name === nm);
    add(tPeople, {
      group: 'rival', portrait: true, name: nm, sub: '경쟁자' + (mate ? ' · 동료로도 등장' : ''),
      meta: ds.map(d => d.name + ' ' + d.rival[0] + '년').join(', '), key: 'portraits/rivals/' + nm, kind: 'png', chain: spec.img, ar: '1 / 1',
      pic: () => portrait(spec),
      detail: () => ({
        text: (G.BIOS && G.BIOS[nm] ? G.BIOS[nm] + ' 〔게임에서〕 ' : '') + '정해진 때가 되면 아래 발견을 먼저 발표합니다. 술집에서 만나 일기토로 이기면 발표를 1~2년 늦출 수 있습니다.',
        facts: ds.map(d => [d.rival[0] + '년 ' + d.rival[1] + '월', d.name]),
        files: [{ key: 'portraits/rivals/' + nm, kind: 'png', note: '경쟁자로 나올 때의 초상' }].concat(mate ? [{ key: 'portraits/mates/' + mate.id, kind: 'png', note: '위 파일이 없으면 동료 그림을 씀' }] : [])
      })
    });
  });
  const NPC_WHERE = { trader: '교역소', vendor: '시장', harbormaster: '항구', innkeeper: '여관', tavernkeeper: '술집', shipwright: '조선소', priest: '교회·모스크·사원',
    librarian: '도서관', guildmaster: '조합', guard: '성문·왕궁·입항을 막는 도시', butler: '후원자 저택', drunk: '술집 손님', brawler: '술집에서 시비를 거는 손님',
    gambler: '술집 포카', native: '육상 탐험', pirate: '해전 — 해적 두목과 일기토', captain: '해전 — 적 함장과 일기토', boatswain: '부하가 없을 때 대신 말하는 갑판장' };
  const NPC_ROLE = { guard: 'soldier', butler: 'keeper', drunk: 'sailor', brawler: 'soldier', gambler: 'sailor' };
  const NPC_FIXED = { native: ['native', 'az'], pirate: ['sailor', 'ib'], captain: ['soldier', 'ib'], boatswain: ['sailor', 'ib'] };
  function npcSpec(id, c) {
    if (A.TOWNFOLK[id]) return A.townSpec(id, c);
    if (NPC_ROLE[id]) return A.withImg(A.npcSpec(id + c.id, NPC_ROLE[id], c.style), I.chain.npc(id, c));
    const f = NPC_FIXED[id] || ['sailor', 'ib'];
    return A.withImg(A.npcSpec(id, f[0], f[1]), I.chain.npc(id));
  }
  I.NPCS.forEach(([id, label]) => {
    const local = !NPC_FIXED[id];
    const spec = npcSpec(id, CITY[0]);
    add(tPeople, {
      group: 'npc', portrait: true, name: label, sub: '마을 사람 · ' + NPC_WHERE[id], meta: local ? '문화권·도시마다 다른 그림 가능' : '모든 곳에서 같은 그림',
      key: 'portraits/npc/' + id, kind: 'png', chain: spec.img, ar: '1 / 1', extra: id,
      pic: () => portrait(spec),
      detail: () => ({
        text: local ? '같은 역할이라도 도시 양식마다 얼굴이 달라집니다. 도시 번호가 붙은 전용 그림, 그다음 문화권별 건물 사람 그림(portraits/npc/)을 먼저 쓰고, 둘 다 없는 고장에서 portraits/npc-roles/양식/역할.webp를 씁니다.' : '',
        facts: [['나오는 곳', NPC_WHERE[id]]],
        strip: local ? Object.keys(CUL_CITY).map(cu => ({ label: CUL[cu] + ' (예: ' + CUL_CITY[cu].name + ')', key: 'portraits/npc/' + id + '_' + cu, kind: 'png', pic: () => portrait(npcSpec(id, CUL_CITY[cu])) })) : null,
        files: local ? [
          { key: 'portraits/npc/' + id + '@0', kind: 'png', note: '한 도시에서만 (예: 리스본 = 0번)' },
          { key: 'portraits/npc/' + id + '_europe', kind: 'png', note: '문화권별 — europe, islam, eastasia, south, native' },
          { key: 'portraits/npc/' + id, kind: 'png', note: '모든 도시 공통' }
        ] : [{ key: 'portraits/npc/' + id, kind: 'png', note: '모든 곳 공통' }]
      })
    });
  });

  // ------------------------------------------------ discoveries
  const tDisc = tab('discoveries', '발견물', {
    chips: [['all', '전체']].concat(Object.keys(G.DISC_CATS).map(k => [k, G.DISC_CATS[k]])),
    note: '파일: <code>images/discoveries/ID.jpg</code> · 권장 1440×640(9:4) · 유적은 <code>tools/ruin_gifs/build.py</code>가 만든 GIF로 7단계 복원과 360° 상공 회전을 보여 줍니다.'
  });
  G.DISCOVERIES.forEach(d => {
    const where = d.how === 'trade' ? (d.regions || [d.reg]).map(r => G.REGIONS[r]).join('·') : G.REGIONS[d.reg];
    const place = d.how === 'city' ? CITY[d.city].name + ' 시내' : d.how === 'trade' ? goodName(d.good) + ' — ' + where + '에서 처음 살 때' : d.id === 'circum' ? '세계 일주를 마치고 출발한 항구로 돌아올 때' : lat(d.lat) + ', ' + lon(d.lon);
    add(tDisc, {
      group: d.cat, name: d.name, sub: G.DISC_CATS[d.cat] + ' · ' + where, meta: HOW[d.how] + ' · 가치 ' + num(d.val) + (d.rival ? ' · 경쟁자 ' + d.rival[2] : ''),
      key: 'discoveries/' + d.id, kind: 'jpg', chain: I.chain.discovery(d), ar: '9 / 4', extra: d.desc, animated: d.cat === 'ruin',
      pic: () => I.make(I.chain.discovery(d), 720, 320, () => A.discoveryArt(d, 720, 320)),
      detail: () => ({
        text: d.desc, hint: '단서 — ' + d.hint, real: d.real,
        facts: [
          ['분류', G.DISC_CATS[d.cat]], ['지역', where], ['찾는 방법', HOW[d.how]], ['위치', place],
          ['가치', num(d.val)], ['명성 (직접 보고하면)', '+' + num(fameFor(d))], ['단서에 쓰인 말', G.LANGS[d.lang]],
          G.frontierText ? ['단서가 열리는 때', G.frontierText(d)] : null,
          (bs => bs.length ? ['단서가 실린 책', bs.map(b => b.title + ' (' + G.LANGS[b.lang] + (b.y > 1480 ? ' · ' + b.y + '년 간행' : '') + (b.sk ? ' · ' + (G.SKILL_BY_ID[b.sk] || {}).name + ' ' + b.lv : '') + ')').join(' / ')] : null)(G.BOOKS.filter(b => b.discs.indexOf(d.id) >= 0)),
          d.rival ? ['경쟁자', d.rival[2] + ' — ' + d.rival[0] + '년 ' + d.rival[1] + '월에 발표'] : null,
          d.evidence ? ['증거품', d.evidence] : null,
          (G.RELICS && G.RELICS[d.id]) ? ['유물 (발견의 증거)', G.RELICS[d.id].map(r => r.name + ' — ' + G.RELIC_KIND[r.kind] + ' · 값 ' + num(r.price) + '닢').join(' / ')] : null
        ],
        files: [
          { key: 'discoveries/' + d.id, kind: 'jpg', note: '이 발견물의 그림' },
          { key: 'discovery-cats/' + d.cat, kind: 'jpg', note: G.DISC_CATS[d.cat] + ' 분류 공통' }
        ]
      })
    });
  });

  // ------------------------------------------------ relics
  if (G.RELIC) {
    const tRel = tab('relics', '유물', {
      chips: [['all', '전체']].concat(Object.keys(G.RELIC_KIND).map(k => [k, G.RELIC_KIND[k]])),
      note: '발견한 자리에서 손에 넣는 물건 — 발견의 증거가 됩니다. 후원자에게 보고하면 바치고(서적·다음 탐험으로 이어지는 물건은 돌려받기도 함), 항구에서 스스로 발표하면 제독의 것이 되어 시장에 팔 수 있습니다. 파일: <code>images/relics/ID.png</code> · 권장 256×256 · 종류 공통 <code>relic-kinds/종류.png</code>'
    });
    const STAT = r => r.kind === 'weapon' ? '공격 ' + r.atk : r.kind === 'armor' ? '방어 ' + r.def : r.kind === 'gift' && r.gv ? '호감 ' + r.gv : r.kind === 'fig' ? Object.entries({ spd: '속도', storm: '폭풍', morale: '사기', battle: '해전', hp: '선체', luck: '행운', monster: '괴물 쫓기' }).filter(([k]) => r[k]).map(([k, n]) => n + ' +' + Math.round(r[k] * 100) + '%').join(' · ') : '';
    Object.keys(G.RELIC).forEach(id => {
      const r = G.RELIC[id], d = G.DISC[r.relic];
      add(tRel, {
        group: r.kind, name: r.name, sub: G.RELIC_KIND[r.kind] + ' · ' + d.name, meta: '값 ' + num(r.price) + '닢' + (STAT(r) ? ' · ' + STAT(r) : '') + (r.lead ? ' · 읽으면 「' + r.lead.map(x => G.DISC[x].name).join('·') + '」 단서' : ''),
        key: 'relics/' + id, kind: 'png', chain: I.chain.relic(r), ar: '1 / 1', extra: (r.desc || '') + ' ' + d.name,
        pic: () => I.make(I.chain.relic(r), 256, 256, () => A.relicArt(r, 256, 256)),
        detail: () => ({
          text: r.desc, real: r.real,
          facts: [['종류', G.RELIC_KIND[r.kind]], ['나오는 발견', d.name + ' (' + G.DISC_CATS[d.cat] + ')'], ['값', num(r.price) + '닢 (세공 특기 1단계마다 +8%)'],
            STAT(r) ? ['효과', STAT(r)] : null,
            r.lead ? ['이어지는 발견', r.lead.map(x => G.DISC[x].name).join(', ') + ' — 소지품에서 읽으면 단서'] : r.kind === 'book' ? ['읽으면', '같은 지역의 발견 단서 하나'] : null,
            ['보고할 때', r.kind === 'book' || r.lead ? '후원자에게 바치지만 돌려받기도 한다' : '후원자에게 바친다'], ['발표할 때', '제독의 것 — 팔거나 쓸 수 있다']],
          files: [{ key: 'relics/' + id, kind: 'png', note: '이 유물의 그림 (256×256, 배경 포함)' }, { key: 'relic-kinds/' + r.kind, kind: 'png', note: G.RELIC_KIND[r.kind] + ' 공통' }]
        })
      });
    });
  }

  // ------------------------------------------------ ships
  const tShip = tab('ships', '배', {
    chips: [['all', '전체']].concat(Object.keys(G.SHIP_CULT).map(k => [k, G.SHIP_CULT[k]])),
    note: '파일: <code>images/ships/ID.png</code> · 권장 880×480 · 조선소와 함대 창에 쓰입니다. 그림이 없으면 배 모양(서양 배·갤리·다우·정크·판옥선·거북선·안택선·뗏목 등)에 맞춰 코드로 그립니다.'
  });
  const TRAIT = k => G.SHIP_TRAITS[k] ? G.SHIP_TRAITS[k].name : k;
  G.SHIP_TYPES.forEach(s => {
    add(tShip, {
      group: s.cult, name: s.name, sub: s.id + ' · ' + G.SHIP_CULT[s.cult] + ' · ' + s.lv + '등급' + (s.from ? ' · ' + s.from + '년부터' : ''), meta: s.feat + ' — ' + s.traits.map(TRAIT).join('·'),
      key: 'ships/' + s.id, kind: 'png', chain: I.chain.ship(s.id), ar: '11 / 6', extra: s.desc + ' ' + s.where,
      pic: () => A.shipCard(s.id, 440, 240),
      detail: () => ({
        text: s.desc,
        facts: [['특징', s.feat], ['특성', s.traits.map(k => TRAIT(k) + ' — ' + G.SHIP_TRAITS[k].desc).join(' / ')],
          ['파는 곳', s.where], ['문화권', G.SHIP_CULT[s.cult] + ' (다른 문화권 조선소에서는 수리비 1.5배)'],
          ['적재량', s.cap], ['내구도', s.hp + ' (목재에 따라 달라짐)'], ['선원', s.crew[0] + '~' + s.crew[1] + '명'], ['포문', s.ports], ['속도', s.spd], s.oar ? ['노 속도', s.oar] : null, ['선회', s.turn],
          s.armor ? ['장갑', '포탄 피해 ' + Math.round(s.armor * 100) + '%'] : null,
          ['돛', s.sails.map(x => SAIL[x]).join(' + ')], ['값', num(s.price) + '닢'], s.from ? ['등장', s.from + '년'] : null,
          ['조선 기술', s.lv + '등급 (' + G.SHIP_LV[s.lv] + ') — 그 도시 조선소의 기술이 이 등급 이상이어야 짓는다. 기본은 도시 크기(+이름난 조선소 1), 조선소 「기술 투자」로 올린다']],
        files: [{ key: 'ships/' + s.id, kind: 'png', note: '이 배의 그림' }]
      })
    });
  });

  // ------------------------------------------------ interiors
  const tInt = tab('interiors', '건물 내부', { note: '파일: <code>images/interiors/건물.jpg</code> · 문화권별 <code>_islam</code> 등, 도시별 <code>@도시번호</code>, 후원자별 <code>mansion@ID</code> · 권장 1600×900' });
  I.INTERIORS.forEach(([kind, label]) => {
    add(tInt, {
      name: label, sub: 'interiors/' + kind, meta: '문화권 5가지로 그려짐', key: 'interiors/' + kind, kind: 'jpg', chain: I.chain.interior(kind, CITY[0], ''), ar: '16 / 9',
      pic: () => I.make(I.chain.interior(kind, CITY[0], ''), 1600, 900, () => A.interior(kind, CITY[0], '')),
      detail: () => ({
        text: '가장 구체적인 파일부터 찾습니다. 한 장만 넣으면 모든 도시의 ' + label + '에 쓰입니다.',
        strip: Object.keys(CUL_CITY).map(cu => ({ label: CUL[cu] + ' (예: ' + CUL_CITY[cu].name + ')', key: 'interiors/' + kind + '_' + cu, kind: 'jpg', wide: true,
          pic: () => I.make(I.chain.interior(kind, CUL_CITY[cu], ''), 1600, 900, () => A.interior(kind, CUL_CITY[cu], '')) })),
        files: [
          (kind === 'mansion' || kind === 'palace') ? { key: 'interiors/' + kind + '@' + (kind === 'palace' ? 'pt_king' : 'pt_behaim'), kind: 'jpg', note: '후원자 한 사람의 ' + label + ' (후원자 ID)' } : null,
          { key: 'interiors/' + kind + '@0', kind: 'jpg', note: '한 도시에서만 (예: 리스본 = 0번)' },
          { key: 'interiors/' + kind + '_europe', kind: 'jpg', note: '문화권별 — europe, islam, eastasia, south, native' },
          { key: 'interiors/' + kind, kind: 'jpg', note: '모든 도시 공통' }
        ]
      })
    });
  });

  // ------------------------------------------------ building exteriors (street view)
  const tExt = tab('exteriors', '건물 겉모습', {
    chips: [['all', '전체'], ['common', '공통']].concat((I.EXTSTYLES || []).map(([id, lab]) => [id, lab])),
    note: '거리 화면에 세우는 건물 그림입니다. 고장마다 <code>images/exterior-styles/묶음/건물.webp</code>, 공통은 <code>images/exteriors/건물.webp</code> · 도시별 <code>@도시번호</code>, 후원자 저택은 <code>mansion@후원자ID</code> · 배경을 지운(투명) PNG·WEBP, 높이 520픽셀 정도를 권합니다.'
  });
  // 고장별 건물 묶음
  (I.EXTSTYLES || []).forEach(([es, elab]) => {
    const city = CITY.find(c => c && I.extStyle && I.extStyle(c) === es) || CITY[0];
    I.INTERIORS.forEach(([kind, label]) => {
      const key = 'exterior-styles/' + es + '/' + kind;
      if (!I.has(key)) return;
      add(tExt, {
        group: es, name: label, sub: elab, meta: es + ' · ' + (city ? city.name + ' 등' : ''),
        key: key, kind: 'webp', chain: [key], ar: '4 / 3', fit: 'contain',
        pic: () => I.make([key], 900, 700, () => A.canvas(900, 700)),
        detail: () => ({
          text: elab + ' 양식의 도시에서 이 건물 자리에 세웁니다. 이 묶음에 없는 건물은 이웃 묶음이나 공통 그림, 그래도 없으면 코드 그림을 씁니다.',
          files: [{ key: key, kind: 'webp', note: elab + ' — ' + label }]
        })
      });
    });
  });
  I.INTERIORS.forEach(([kind, label]) => {
    const chain = I.chain.exterior(kind, CITY[7] || CITY[0], '');
    add(tExt, {
      group: 'common', name: label, sub: 'exteriors/' + kind, meta: I.pick(chain) ? '그림 있음 — 거리에 세워집니다' : '아직 없음 — 코드로 그린 대용을 씁니다',
      key: 'exteriors/' + kind, kind: 'webp', chain: chain, ar: '4 / 3', fit: 'contain',
      pic: () => I.make(chain, 900, 700, () => { const c = A.canvas(900, 700); const x = c.getContext('2d'); x.fillStyle = '#d8c8a4'; x.fillRect(0, 0, 900, 700); x.fillStyle = '#6b5640'; x.font = '600 34px "Nanum Myeongjo", serif'; x.textAlign = 'center'; x.fillText('그림 없음', 450, 360); return c; }),
      detail: () => ({
        text: '거리 화면에서 이 건물을 눌러 들어갑니다. 파일을 넣지 않으면 코드로 그린 대용 그림(시장 가판대·성문 등)이나 다른 건물 그림을 씁니다.',
        files: [
          { key: 'exteriors/' + kind + '@7', kind: 'webp', note: '한 도시에서만 (예: 세비야 = 7번)' },
          (kind === 'mansion' || kind === 'palace') ? { key: 'exteriors/' + kind + '@es_fonseca', kind: 'webp', note: '후원자 한 사람의 저택·왕궁 (후원자 ID)' } : null,
          { key: 'exteriors/' + kind + '_europe', kind: 'webp', note: '문화권별 — europe, islam, eastasia, south, native' },
          { key: 'exteriors/' + kind, kind: 'webp', note: '모든 도시 공통' }
        ]
      })
    });
  });

  // ------------------------------------------------ others
  const tEtc = tab('etc', '기타', {
    chips: [['all', '전체'], ['title', '타이틀'], ['bg', '거리 배경·볼거리'], ['style', '도시 양식'], ['cat', '발견물 분류'], ['family', '제독·자녀']],
    note: '여러 항목에 한꺼번에 쓰이는 그림입니다. 개별 파일(도시·발견물)이 있으면 그쪽이 먼저입니다.'
  });
  add(tEtc, {
    group: 'title', name: '타이틀 화면', sub: 'title', meta: '게임을 켜면 처음 보이는 그림', key: 'title', kind: 'jpg', chain: ['title'], ar: '16 / 9',
    pic: () => I.make(['title'], 1600, 900, A.titleScene),
    detail: () => ({ facts: [['쓰이는 곳', '타이틀 화면 배경']], files: [{ key: 'title', kind: 'jpg', note: '1600×900 권장' }] })
  });
  I.STYLES.forEach(([st, label]) => {
    const cities = CITY.filter(c => c.style === st), ex = cities[0];
    if (!ex) return;
    add(tEtc, {
      group: 'style', name: label, sub: 'city-styles/' + st, meta: cities.length + '곳 — ' + cities.slice(0, 4).map(c => c.name).join(', ') + (cities.length > 4 ? ' …' : ''),
      key: 'city-styles/' + st, kind: 'jpg', chain: ['city-styles/' + st], ar: '16 / 9', extra: cities.map(c => c.name).join(' '),
      pic: () => I.make(['city-styles/' + st], 1600, 900, () => A.cityScene(ex, { time: 'day' })),
      detail: () => ({
        text: '이 양식의 도시 가운데 cities/번호 파일이 없는 곳은 모두 이 그림을 씁니다.',
        facts: [['쓰는 도시', cities.map(c => c.name + ' (' + c.id + ')').join(', ')]],
        files: [
          { key: 'city-styles/' + st, kind: 'jpg', note: '낮' },
          { key: 'city-styles/' + st + '_golden', kind: 'jpg', note: '해질녘' },
          { key: 'city-styles/' + st + '_dusk', kind: 'jpg', note: '저녁' }
        ]
      })
    });
  });
  Object.keys(G.DISC_CATS).forEach(cat => {
    const ds = G.DISCOVERIES.filter(d => d.cat === cat), ex = ds[0];
    add(tEtc, {
      group: 'cat', name: G.DISC_CATS[cat] + ' 발견물', sub: 'discovery-cats/' + cat, meta: ds.length + '종에 공통으로 쓰임', key: 'discovery-cats/' + cat, kind: 'jpg',
      chain: ['discovery-cats/' + cat], ar: '9 / 4',
      pic: () => I.make(['discovery-cats/' + cat], 720, 320, () => A.discoveryArt(ex, 720, 320)),
      detail: () => ({ text: '이 분류의 발견물 가운데 discoveries/ID 파일이 없는 것은 모두 이 그림을 씁니다.', facts: [['발견물', ds.map(d => d.name).join(', ')]], files: [{ key: 'discovery-cats/' + cat, kind: 'jpg', note: '분류 공통' }] })
    });
  });
  [['ib_port', '항구 도시 거리 배경'], ['ib_inland', '내륙 도시 거리 배경']].forEach(([base, label]) => {
    const list = I.list('bg-styles/' + base + '_');
    const key = list[0] || 'bg-styles/' + base + '_a';
    add(tEtc, {
      group: 'bg', name: label, sub: 'bg-styles/' + base + '_a …', meta: list.length ? '넣어 둔 배경 ' + list.length + '장 — 도시마다 하나씩 골라 씁니다' : '아직 없음',
      key: key, kind: 'jpg', chain: list.length ? [key] : ['bg-styles/' + base], ar: '16 / 9',
      pic: () => I.make(list.length ? [key] : ['bg-styles/' + base], 1600, 900, () => { const c = A.canvas(1600, 900); const x = c.getContext('2d'); x.fillStyle = '#cfc0a0'; x.fillRect(0, 0, 1600, 900); return c; }),
      detail: () => ({
        text: '거리 화면의 배경입니다. 여러 장을 넣으면 도시마다 하나가 정해져 늘 같은 배경이 나옵니다. 특정 도시만 다르게 하려면 backgrounds/도시번호 파일을 넣으세요.',
        strip: list.map((k, i) => ({ label: k.split('/').pop(), key: k, kind: 'jpg', wide: true, pic: () => I.make([k], 1600, 900, () => A.canvas(1600, 900)) })),
        files: list.length ? list.map(k => ({ key: k, kind: 'jpg', note: '거리 배경 (1600×900)' })) : [{ key: 'bg-styles/' + base + '_a', kind: 'jpg', note: '거리 배경 (1600×900)' }]
      })
    });
  });
  I.list('landmarks/').forEach(k => {
    add(tEtc, {
      group: 'bg', name: '거리 볼거리 — ' + k.split('/').pop(), sub: k, meta: '거리 뒤쪽에 서 있는 구조물 (누를 수 없음)', key: k, kind: 'webp', chain: [k], ar: '4 / 3', fit: 'contain',
      pic: () => I.make([k], 700, 700, () => A.canvas(700, 700)),
      detail: () => ({ text: '도시 거리 뒤쪽에 장식으로 서 있습니다. 어느 도시에 세울지는 js/scenes/town.js 의 LANDMARKS 에서 정합니다.', files: [{ key: k, kind: 'webp', note: '거리 볼거리' }] })
    });
  });
  const walkKeys = I.list('characters/walk_');
  add(tEtc, {
    group: 'family', portrait: true, name: '거리를 걷는 제독', sub: 'characters/walk_1 … walk_8', meta: walkKeys.length ? '걷는 그림 ' + walkKeys.length + '장' : '아직 없음 — 그림을 넣으면 거리에 나타납니다',
    key: walkKeys[0] || 'characters/walk_1', kind: 'webp', chain: walkKeys.length ? [walkKeys[0]] : ['characters/player'], ar: '3 / 4', fit: 'contain',
    pic: () => I.make(walkKeys.length ? [walkKeys[0]] : ['characters/player'], 400, 540, () => A.canvas(400, 540)),
    detail: () => ({
      text: '옆모습으로 걷는 그림을 차례대로 넣으면 거리에서 걸어 다닙니다. 배경을 지운 PNG·WEBP, 발끝이 그림 아래쪽에 닿게 잘라 주세요. 한 장만 넣을 때는 characters/player 로 넣습니다.',
      strip: walkKeys.slice(0, 8).map(k => ({ label: k.split('/').pop(), key: k, kind: 'webp', pic: () => I.make([k], 260, 540, () => A.canvas(260, 540)) })),
      files: (walkKeys.length ? walkKeys : ['characters/walk_1', 'characters/walk_2']).map(k => ({ key: k, kind: 'webp', note: '걷는 동작 한 장' })).concat([{ key: 'characters/player', kind: 'png', note: '한 장으로 대신할 때' }])
    })
  });
  add(tEtc, {
    group: 'family', portrait: true, name: '제독 반신상 (수첩)', sub: 'characters/player_half', meta: I.pick(['characters/player_half']) ? '그림 있음' : '아직 없음 — 없으면 코드로 그린 초상을 씁니다',
    key: 'characters/player_half', kind: 'png', chain: ['characters/player_half'], ar: '1 / 1', fit: 'contain',
    pic: () => I.make(['characters/player_half'], 512, 512, () => A.canvas(512, 512)),
    detail: () => ({
      text: '항해 수첩의 제독 쪽에서 크게 보여 주는 그림입니다. 무릎 위까지 나오는 512×512 그림을 권합니다.',
      files: [{ key: 'characters/player_half', kind: 'png', note: '수첩에서 보는 반신상 (512×512)' }]
    })
  });
  const faceSpec = i => A.portraitSpec({ seed: 'player' + i + 'PT', culture: 'med', g: 'm', age: 'young', cloth: ['#1e3552', '#5a1e1e', '#2a3a2a', '#3a2a4a'][i % 4], beard: i % 3 });
  const players = I.list('portraits/player/');
  add(tEtc, {
    group: 'family', portrait: true, name: '제독 얼굴', sub: 'portraits/player/', meta: players.length ? '넣은 얼굴 ' + players.length + '장' : '파일 이름은 자유, 여러 장 넣으면 고를 수 있음',
    key: players[0] || 'portraits/player/얼굴1', kind: 'png', chain: players, ar: '1 / 1',
    pic: () => portrait(faceSpec(0)),
    detail: () => ({
      text: 'portraits/player 폴더에 넣은 그림은 이름 순서대로 제독 만들기 화면의 "얼굴" 버튼으로 돌려 가며 고릅니다. 파일이 없으면 아래처럼 코드로 그린 얼굴을 씁니다.',
      strip: [0, 1, 2, 3].map(i => ({ label: '코드 얼굴 ' + (i + 1), key: players[i] || 'portraits/player/얼굴' + (i + 1), kind: 'png', pic: () => portrait(faceSpec(i)) })),
      files: (players.length ? players : ['portraits/player/얼굴1', 'portraits/player/얼굴2']).map(k => ({ key: k, kind: 'png', note: '제독 얼굴 후보' }))
    })
  });
  [['son', '아들', 'm'], ['daughter', '딸', 'f']].forEach(([b, label, g]) => {
    const spec = A.withImg(A.portraitSpec({ seed: 'kid_' + b, culture: 'med', g, age: 'young', beard: 0 }), I.chain.kid(g, 1));
    add(tEtc, {
      group: 'family', portrait: true, name: '자녀 — ' + label, sub: 'portraits/family/' + b, meta: '결혼한 뒤 태어나는 ' + label + ', 대를 이으면 새 제독', key: 'portraits/family/' + b, kind: 'png',
      chain: spec.img, ar: '1 / 1', pic: () => portrait(spec),
      detail: () => ({
        files: [
          { key: 'portraits/family/' + b + '_1', kind: 'png', note: '첫째 ' + label + ' (둘째는 _2)' },
          { key: 'portraits/family/' + b, kind: 'png', note: '모든 ' + label + ' 공통' }
        ]
      })
    });
  });

  // ---------------------------------------------------------------- state
  let cur = TABS[0], query = '';
  const hash = decodeURIComponent((location.hash || '').slice(1));
  if (TABS.some(t => t.id === hash)) cur = TABS.find(t => t.id === hash);
  const matches = it => !query || it.text.includes(query);
  const visible = t => t.items.filter(it => matches(it) && (t.chip === 'all' || it.group === t.chip));

  // ---------------------------------------------------------------- thumbnails (lazy, one per frame)
  const queue = [];
  let pumping = false;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { io.unobserve(e.target); queue.push(e.target); pump(); }
  }), { rootMargin: '300px 0px' }) : null;
  async function pump() {
    if (pumping) return;
    pumping = true;
    while (queue.length) {
      const el = queue.shift();
      if (el.isConnected && !el.querySelector('canvas, img')) {
        await drawThumb(el);
        await new Promise(r => requestAnimationFrame(() => r()));
      }
    }
    pumping = false;
  }
  async function drawThumb(el) {
    const it = ITEM[el.dataset.uid];
    if (!it) return;
    if (it.chain && I.pick(it.chain)) await I.preload([it.chain], 4000);
    const moving = animatedImage(it);
    if (moving) { el.appendChild(moving); return; }
    let src;
    try { src = it.pic(); } catch (e) { console.error(e); return; }
    const r = el.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(40, Math.round((r.width || 240) * dpr)), h = Math.max(40, Math.round((r.height || 135) * dpr));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var tctx = cv.getContext('2d');
    if (it.fit === 'contain') {
      tctx.fillStyle = '#e3d5b6'; tctx.fillRect(0, 0, w, h);
      I.drawContain(tctx, src, w * 0.04, h * 0.04, w * 0.92, h * 0.92);
    } else I.drawCover(tctx, src, 0, 0, w, h, 0.5, it.portrait ? 0.25 : 0.5);
    el.appendChild(cv);
  }

  // ---------------------------------------------------------------- render
  function stateHtml(it) {
    const k = it.chain && I.pick(it.chain);
    return k ? '<span class="state on" title="' + esc('images/' + I.path(k)) + '">교체됨</span>' : '<span class="state">코드 그림</span>';
  }
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(t => {
      const n = t.items.filter(matches).length;
      return '<button class="tab" role="tab" type="button" id="tab-' + t.id + '" aria-selected="' + (t === cur) + '" data-tab="' + t.id + '">' + esc(t.label) + '<span class="n">' + num(n) + '</span></button>';
    }).join('');
  }
  function renderChips() {
    const box = $('#chips');
    if (!cur.chips) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = cur.chips.map(([v, label]) => {
      const n = cur.items.filter(it => matches(it) && (v === 'all' || it.group === v)).length;
      return '<button class="chip" type="button" data-chip="' + v + '" aria-pressed="' + (cur.chip === v) + '">' + esc(label) + '<span class="n">' + n + '</span></button>';
    }).join('');
  }
  function renderGrid() {
    const grid = $('#grid'), list = visible(cur);
    if (io) io.disconnect();
    queue.length = 0;
    grid.className = 'grid ' + cur.id;
    grid.setAttribute('aria-labelledby', 'tab-' + cur.id);
    grid.innerHTML = list.map(it =>
      '<button class="card" type="button" data-uid="' + it.uid + '">' +
      '<span class="thumb" data-uid="' + it.uid + '" style="--ar:' + it.ar + '"></span>' +
      '<span class="body"><span class="name">' + esc(it.name) + '</span>' +
      '<span class="sub">' + esc(it.sub) + '</span>' +
      (it.meta ? '<span class="meta">' + esc(it.meta) + '</span>' : '') +
      '<span class="file"><span class="path">' + pathHtml(pathOf(it.key, it.kind)) + '</span>' + stateHtml(it) + '</span></span></button>'
    ).join('');
    $('#empty').hidden = list.length > 0;
    grid.querySelectorAll('.thumb').forEach(el => { if (io) io.observe(el); else queue.push(el); });
    if (!io) pump();
  }
  function renderAll() {
    renderTabs(); renderChips(); renderGrid();
    $('#note').innerHTML = cur.note;
  }
  function summary() {
    const n = id => TABS.find(t => t.id === id).items.length;
    const people = TABS.find(t => t.id === 'people').items;
    const cnt = g => people.filter(it => it.group === g).length;
    $('#summary').textContent = '도시 ' + n('cities') + ' · 인물 ' + people.length + ' (동료 ' + cnt('mate') + ', 후원자 ' + cnt('sponsor') + ', 여급 ' + cnt('maid') + ', 지역별 여급 그림 ' + cnt('maidstyle') +
      ', 경쟁자 ' + cnt('rival') + ', 마을 사람 ' + cnt('npc') + ') · 발견물 ' + n('discoveries') + ' · 배 ' + n('ships') + ' · 교체한 그림 ' + I.count() + '장';
  }

  // ---------------------------------------------------------------- detail sheet
  function filesTable(files) {
    files = files.filter(Boolean);
    return '<div class="scroll-x"><table class="chain"><thead><tr><th>순서</th><th>파일 이름</th><th>설명</th></tr></thead><tbody>' +
      files.map((f, i) => {
        const p = pathOf(f.key, f.kind), has = I.has(f.key);
        return '<tr><td>' + (i + 1) + '</td><td><span class="path">' + pathHtml(p) + '</span><button class="copy" type="button" data-copy="' + esc(p) + '">복사</button>' +
          (has ? ' <span class="state on">있음</span>' : '') + '</td><td>' + esc(f.note || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  /** 실제 자료 (tools/heritage): 세계유산 등재·생물 분류·소장품과 출처 */
  function realHtml(H) {
    if (!H) return '';
    const a = (url, t) => url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(t) + '</a>' : esc(t);
    const rows = [];
    if (H.whc) rows.push(['UNESCO 세계유산', a(H.whc.url, (H.whc.no ? '#' + H.whc.no + ' ' : '') + (H.whc.name || '')) + (H.whc.year ? ' · ' + H.whc.year + '년 등재' : '') + (H.whc.crit ? ' · 기준 ' + esc(H.whc.crit) : '') + (H.whc.states ? ' · ' + esc(H.whc.states) : '') + (H.whc.danger ? ' · 위험에 처한 유산' : '')]);
    if (H.record) rows.push([H.whc ? '세계유산 기록' : H.legend ? '전설의 배경' : '오늘날의 기록', esc(H.record)]);
    (H.lore || []).forEach(t => rows.push(['이야기', esc(t)]));
    if (H.bio) rows.push(['생물 (GBIF)', a(H.bio.url, H.bio.sci) + [H.bio.ko, H.bio.en, H.bio.family, H.bio.records ? '관찰 기록 ' + num(H.bio.records) + '건' : '', H.bio.extinct ? '멸종' : ''].filter(Boolean).map(x => ' · ' + esc(x)).join('')]);
    if (H.sea) rows.push(['바다 기록 (OBIS)', a(H.sea.url, num(H.sea.records || 0) + '건') + (H.sea.depth ? ' · 깊이 ' + H.sea.depth[0] + '–' + H.sea.depth[2] + 'm (가운데 ' + H.sea.depth[1] + 'm)' : '') + (H.sea.lat ? ' · 위도 ' + H.sea.lat[0] + '°~' + H.sea.lat[1] + '°' : '')]);
    if (H.obj) rows.push(['실존 소장품', a(H.obj.url, H.obj.title || '') + [H.obj.museum, H.obj.date, H.obj.culture, H.obj.place, H.obj.medium, H.obj.no ? '소장 번호 ' + H.obj.no : ''].filter(Boolean).map(x => ' · ' + esc(x)).join('')]);
    if (H.wiki) rows.push(['위키백과', a(H.wiki.url, H.wiki.title) + (H.wiki.ko ? ' · 한국어: ' + esc(H.wiki.ko) : '')]);
    if (H.photo) rows.push(['사진', a(H.photo.url, [H.photo.by, H.photo.src].filter(Boolean).join(' · ') || '출처') + (H.photo.lic ? ' · ' + esc(H.photo.lic) : '')]);
    return '<h3>실제 자료</h3><dl class="facts">' + rows.map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>').join('') + '</dl>' +
      '<p class="d-text hint">설명은 UNESCO 세계유산센터(CC BY-SA 3.0 IGO)·위키백과(CC BY-SA 4.0)를 바탕으로 새로 쓴 글이며, 소장품 자료는 The Met·Smithsonian Open Access(CC0), 생물 자료는 GBIF.org·OBIS에서 가져왔습니다. 다시 모으려면 <code>python tools/heritage/fetch.py</code>.</p>';
  }
  async function openDetail(it) {
    const d = it.detail ? it.detail() : {};
    const body = $('#dBody');
    const facts = (d.facts || []).filter(Boolean);
    body.innerHTML =
      '<div class="d-hero' + (it.portrait ? ' portrait' : '') + '" id="dHero"></div>' +
      '<div class="d-main"><h2 id="dTitle">' + esc(it.name) + '</h2><p class="d-sub">' + esc(it.sub) + '</p>' +
      (d.text ? '<p class="d-text">' + esc(d.text) + '</p>' : '') +
      (d.hint ? '<p class="d-text hint">' + esc(d.hint) + '</p>' : '') +
      (facts.length ? '<dl class="facts">' + facts.map(f => '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>').join('') + '</dl>' : '') +
      realHtml(d.real) +
      (d.strip ? '<h3>그림 종류</h3><div class="strip" id="dStrip"></div>' : '') +
      '<h3>이 그림을 바꾸려면</h3><p class="d-text hint">위에서부터 먼저 찾습니다. 파일을 넣은 뒤 <code>python tools/images.py</code>를 실행하세요.</p>' + filesTable(d.files || []) +
      '</div>';
    const dlg = $('#detail');
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    dlg.scrollTop = 0;
    if (it.chain && I.pick(it.chain)) await I.preload([it.chain], 4000);
    const moving = animatedImage(it), src = moving ? null : it.pic();
    $('#dHero').appendChild(moving || copyCanvas(src));
    if (d.strip) {
      const box = $('#dStrip');
      for (const s of d.strip) {
        const fig = document.createElement('figure');
        fig.innerHTML = '<figcaption>' + esc(s.label) + '<span class="path">' + pathHtml(pathOf(s.key, s.kind)) + '</span></figcaption>';
        box.appendChild(fig);
        await new Promise(r => requestAnimationFrame(() => r()));
        const pic = s.pic();
        const cv = s.wide ? copyCanvas(pic, 480, 270) : copyCanvas(pic);
        fig.insertBefore(cv, fig.firstChild);
      }
    }
  }

  // ---------------------------------------------------------------- help: manifest check
  function knownKey(k) {
    let m;
    if (k === 'title') return true;
    if ((m = /^cities\/(\d+)(_(golden|dusk))?$/.exec(k))) return +m[1] < CITY.length;
    if ((m = /^backgrounds\/(\d+)$/.exec(k))) return +m[1] < CITY.length;
    if ((m = /^bg-styles\/([a-z]+)(_(port|inland))?(_[a-z0-9]+)?$/.exec(k))) return !!STYLE[m[1]];
    if ((m = /^exteriors\/([a-z]+)(?:_([a-z]+)|@(.+))?$/.exec(k))) return !!INTN[m[1]] && (!m[2] || !!CUL[m[2]]) && (!m[3] || (/^\d+$/.test(m[3]) ? +m[3] < CITY.length : !!G.SPONSOR[m[3]]));
    if (/^landmarks\/.+$/.test(k) || /^characters\/.+$/.test(k)) return true;
    if ((m = /^city-styles\/([a-z]+)(_(golden|dusk))?$/.exec(k))) return !!STYLE[m[1]];
    if ((m = /^interiors\/([a-z]+)(?:_([a-z]+)|@(.+))?$/.exec(k))) return !!INTN[m[1]] && (!m[2] || !!CUL[m[2]]) && (!m[3] || (/^\d+$/.test(m[3]) ? +m[3] < CITY.length : !!G.SPONSOR[m[3]]));
    if ((m = /^portraits\/npc\/([a-z]+)(?:_([a-z]+)|@(\d+))?$/.exec(k))) return !!NPCN[m[1]] && (!m[2] || !!CUL[m[2]]) && (!m[3] || +m[3] < CITY.length);
    if ((m = /^portraits\/mates\/(.+)$/.exec(k))) return !!G.MATE[m[1]];
    if ((m = /^portraits\/maids\/(.+?)(_half)?$/.exec(k))) return !!G.MAID[m[1]];
    if ((m = /^maid-styles\/([a-z]+)\/\d+(_half)?$/.exec(k))) return MAIDSTYLE.has(m[1]);
    if ((m = /^maid-styles\/([a-z]+)(_half)?$/.exec(k))) return MAIDSTYLE.has(m[1]);
    if ((m = /^portraits\/sponsors\/(.+)$/.exec(k))) {
      if (G.SPONSOR[m[1]]) return true;
      const n = /^(.+)_(\d+)$/.exec(m[1]);
      return !!(n && G.SPONSOR[n[1]] && +n[2] >= 1 && +n[2] <= G.SPONSOR[n[1]].holders.length);
    }
    if ((m = /^portraits\/rivals\/(.+)$/.exec(k))) return rivals.includes(m[1]);
    if (/^portraits\/player\/.+$/.test(k)) return true;
    if (/^portraits\/family\/(son|daughter)(_\d+)?$/.test(k)) return true;
    if ((m = /^discoveries\/(.+)$/.exec(k))) return !!G.DISC[m[1]];
    if ((m = /^discovery-cats\/(.+)$/.exec(k))) return !!G.DISC_CATS[m[1]];
    if ((m = /^ships\/(.+)$/.exec(k))) return !!G.SHIP[m[1]];
    return false;
  }
  function manifestCheck() {
    const keys = I.list(''), bad = keys.filter(k => !knownKey(k));
    const box = $('#manifestCheck');
    if (!keys.length) { box.innerHTML = '<div class="check">지금 <code>images/manifest.js</code>에 등록된 그림이 없습니다. 모든 그림을 코드로 그리고 있습니다.</div>'; return; }
    box.innerHTML = '<div class="check' + (bad.length ? ' warn' : '') + '">등록된 그림 ' + keys.length + '장' +
      (bad.length ? ' — 게임에서 찾지 않는 이름이 ' + bad.length + '개 있습니다:<ul>' + bad.map(k => '<li><code>images/' + esc(I.path(k)) + '</code></li>').join('') + '</ul>' : ' — 이름이 모두 맞습니다.') + '</div>';
  }

  // ---------------------------------------------------------------- events
  function toast(text) {
    const t = $('#toast');
    t.textContent = text; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 1600);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('복사했습니다: ' + text); }
    catch (e) { toast('복사하지 못했습니다. 파일 이름을 직접 선택해 복사하세요.'); }
  }
  document.addEventListener('click', e => {
    const tb = e.target.closest('[data-tab]');
    if (tb) {
      cur = TABS.find(t => t.id === tb.dataset.tab);
      try { history.replaceState(null, '', '#' + cur.id); } catch (err) { /* sandboxed */ }
      renderAll(); window.scrollTo(0, 0); return;
    }
    const ch = e.target.closest('[data-chip]');
    if (ch) { cur.chip = ch.dataset.chip; renderChips(); renderGrid(); return; }
    const cp = e.target.closest('[data-copy]');
    if (cp) { copy(cp.dataset.copy); return; }
    const card = e.target.closest('.card');
    if (card) { openDetail(ITEM[card.dataset.uid]); return; }
    if (e.target.id === 'helpBtn') { manifestCheck(); const h = $('#help'); if (h.showModal) h.showModal(); else h.setAttribute('open', ''); }
  });
  ['detail', 'help'].forEach(id => {
    const dlg = $('#' + id);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  });
  let qt = null;
  $('#q').addEventListener('input', e => {
    clearTimeout(qt);
    qt = setTimeout(() => { query = e.target.value.trim().toLowerCase(); renderAll(); }, 120);
  });
  summary();
  renderAll();
})(window.G = window.G || {});
