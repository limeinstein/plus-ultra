/* Loop of Good Hope 도감: 게임에 나오는 도시·인물·발견물·배·건물 내부를 게임과 같은 그림으로 보여 주고,
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
  /*  장면 판(G.Reel)이 있으면 Canvas로 — 목록의 작은 그림은 마지막 장면을 멈춰 두고 마우스를 올리면 한 번 돈다
      (GIF 수십 장이 한꺼번에 돌면 목록이 버벅인다), 자세히 보기는 계속 돈다 */
  function animatedImage(it, thumb) {
    if (it.animated && it.disc && G.Reel && G.Reel.has(it.disc)) {
      const key = G.Reel.key(it.disc), cv = document.createElement('canvas');
      cv.width = thumb ? 480 : 1152; cv.height = thumb ? 213 : 512; cv.className = 'reel'; cv.setAttribute('aria-label', it.name);
      G.Reel.load(key).then(L => {
        if (!L) return;
        if (!thumb) { G.Reel.play(cv, L, { loop: true }); return; }
        G.Reel.drawLast(cv, L);
        let p = null;
        cv.addEventListener('mouseenter', () => { if (!p) p = G.Reel.play(cv, L, { onEnd: () => { p = null; } }); });
      });
      return cv;
    }
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
    if (c.flags.includes('T')) return ['교역소', '술집', '여관', '시장', c.rel === 'I' ? '모스크' : '사당', '조합', '성문'];   // 아프리카 부족 마을
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
  /** 그 도시 거리에 서는 건물 [kind, 이름, 그림 체인] — 그림이 있는 것만 */
  function streetBuildings(c) {
    const fac = facilities(c), out = [];
    const want = { harbor: fac.includes('항구'), trade: true, shipyard: fac.includes('조선소'), tavern: true, inn: true, market: fac.some(f => f === '시장'),
      church: true, library: fac.some(f => /도서관|서고|학당|문고/.test(f)) || fac.includes((c.places && c.places.library) || '도서관'),
      palace: G.SPONSORS.some(s => s.city === c.id && s.bld === 'palace') || c.flags.includes('P'), mansion: G.SPONSORS.some(s => s.city === c.id && s.bld !== 'palace'),
      guild: c.flags.includes('G') || c.size >= 3, gate: true };
    I.INTERIORS.forEach(([kind, label]) => {
      if (!want[kind]) return;
      const ch = I.chain.exterior(kind, c, '');
      if (I.pick(ch)) out.push([kind, label === '교회·사원' ? churchName(c) : label, ch]);
    });
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
    // 대화창은 무릎상(_half)이 있으면 서 있는 모습으로 크게 보여 준다 — 도감도 게임과 같은 그림을 먼저 (2026-10-11)
    if (it.half) {
      const hk = I.pick(it.half);
      if (hk) {
        const bust = it.pic, bustChain = it.chain;
        it.halfKey = hk; it.bustPic = bust; it.bustChain = bustChain;
        it.chain = [hk].concat(bustChain || []); it.ar = '2 / 3';
        it.pic = () => I.make([hk], 1024, 1536, bust);
      }
    }
    it.text = [it.name, it.sub, it.meta, it.key, (it.chain || []).join(' '), it.extra || ''].join(' ').toLowerCase();
    t.items.push(it); ITEM[it.uid] = it;
    return it;
  }

  // ------------------------------------------------ cities
  const tCity = tab('cities', '도시', {
    chips: [['all', '전체']].concat(G.REGIONS.map((r, i) => [String(i), r])),
    note: '게임의 거리 화면 그림입니다. 파일: <code>images/backgrounds/도시번호.jpg</code>(이 도시만의 거리 배경) · 없으면 양식 공통 <code>bg-styles/양식_port_a</code>… · 권장 1600×900. 자세히 보기에서 그 도시에 서는 건물 그림도 보여 줍니다.'
  });
  CITY.forEach(c => {
    const sps = G.SPONSORS.filter(s => s.city === c.id);
    const maid = G.MAIDS.find(m => m.city === c.id);
    const discs = G.DISCOVERIES.filter(d => d.how === 'city' && d.city === c.id);
    add(tCity, {
      group: String(c.region), name: c.name, sub: '#' + c.id + ' · ' + (G.regionLabel ? G.regionLabel(c) : G.REGIONS[c.region]) + ' · ' + c.nation,
      meta: G.LANGS[c.lang] + ' · ' + (REL[c.rel] || '') + ' · ' + (c.port ? '항구' : '내륙') + ' · ' + SIZE[c.size],
      key: I.pick(I.chain.bg(c)) || 'backgrounds/' + c.id, kind: 'jpg', chain: I.chain.bg(c).concat(I.chain.city(c, 'day')), ar: '16 / 9',
      extra: c.goods.map(goodName).join(' ') + ' ' + STYLE[c.style],
      pic: () => I.make(I.chain.bg(c), 1600, 900, () => I.make(I.chain.city(c, 'day'), 1600, 900, () => A.cityScene(c, { time: 'day' }))),
      detail: () => ({
        facts: [
          ['지역', G.regionLabel ? G.regionLabel(c) : G.REGIONS[c.region]], ['처음 다스리는 나라', G.Dominion ? G.Dominion.first(c) || c.nation : c.nation],
          G.Dominion && G.DOMINION[c.id] ? ['다스린 나라', G.Dominion.history(c).map(h => h.y + (h.m ? '.' + h.m : '') + ' ' + h.n + (G.NATION_LEADERS[h.n] ? ' (' + G.Dominion.leader(h.n, h.y).text + ')' : '')).join(' → ')] : null,
          G.DOMINION_NOTES && G.DOMINION_NOTES[c.id] && G.DOMINION_NOTES[c.id][0] ? ['내력', G.DOMINION_NOTES[c.id][0]] : null, ['말', G.LANGS[c.lang]], ['종교', REL[c.rel]],
          ['규모', SIZE[c.size] + (c.port ? ' · 항구' : ' · 내륙')], ['건물', facilities(c).join(', ')],
          ['특산품', c.goods.map(goodName).join(', ') || '—'], c.relay && c.relay.length ? ['중계무역', c.relay.map(x => goodName(x.id) + (x.from ? ' (' + x.from + '~)' : '')).join(', ') + ' — 먼 산지에서 들여와 판다'] : null, ['건축 양식', STYLE[c.style] + ' (' + c.style + ')'],
          c.founded ? ['건설', c.founded + '년'] : null,
          c.until ? ['사라짐', c.until + '년'] : null,
          c.flags.includes('H') ? ['입항', '성지 — 다른 종교의 함대는 들어갈 수 없음'] : null,
          G.Sneak && G.Sneak.islamZone(c) && G.Sneak.islamZone(c) !== 'holy' ? ['입항', G.Sneak.ZONE_NAME[G.Sneak.islamZone(c)] + ' — 이슬람 왕조가 다스리는 동안 이교도는 잠입이나 교섭이 필요함 (터번이 도움)'] : null,
          c.flags.includes('X') ? ['입항', '쇄국 — 교섭이나 잠입이 필요함 (명나라 옷이 도움)'] : null,
          c.flags.includes('E') ? ['지위', '제국의 수도'] : null,
          sps.length ? ['후원자', sps.map(s => s.title).join(', ')] : null,
          maid ? ['여급', maid.name] : null,
          discs.length ? ['건물에 들어가면 발견', discs.map(d => d.name).join(', ')] : null,
          ['위치', lat(c.lat) + ', ' + lon(c.lon)]
        ],
        strip: streetBuildings(c).map(([kind, label, ch]) => ({ label: label, key: I.pick(ch), kind: 'webp',
          pic: () => I.make(ch, 900, 700, () => A.canvas(900, 700), { fit: 'contain' }) })),
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
    chips: [['all', '전체'], ['mate', '동료'], ['sponsor', '후원자'], ['maid', '여급'], ['maidstyle', '지역별 여급'], ['rival', '경쟁자'], ['npc', '마을 사람'], ['princess', '왕명 왕녀'], ['court', '궁정 사람'], ['street', '거리 사람']],
    note: '파일: 동료 <code>portraits/mates/ID.png</code> · 후원자 <code>portraits/sponsors/ID.png</code> · 여급 <code>portraits/maids/ID.png</code> · 지역별 여급 <code>maid-styles/묶음/1.png</code>(흉상) <code>maid-styles/묶음/1_half.png</code>(서 있는 모습, 여러 장 가능) · 경쟁자 <code>portraits/rivals/이름.png</code> · 마을 사람 <code>portraits/npc/역할.png</code> · 왕명 왕녀·거리 사람 <code>portraits/street-folk/종류_양식</code> · 궁정 사람 <code>portraits/courtiers/후원자ID</code> · 얼굴(흉상) 512×512 · 대화창에 서는 무릎상은 같은 이름에 <code>_half</code>(1024×1536 투명) — 지역별 완성 무릎상이 있으면 얼굴 확장본보다 먼저 보여 줍니다'
  });
  const skillTxt = sk => Object.keys(sk || {}).map(k => (G.SKILL_BY_ID[k] || {}).name + ' ' + sk[k]).join(' · ');
  const langTxt = lg => Object.keys(lg || {}).sort((a, b) => lg[b] - lg[a]).map(k => G.LANGS[k] + ' ' + G.LANG_LV[lg[k]]).join(', ');
  G.MATES.forEach(m => {
    const spec = A.mateSpec(m.id);
    add(tPeople, {
      group: 'mate', portrait: true, name: m.name, sub: (m.witch ? (m.legend ? '전설의 마녀' : '마녀로 몰렸던 여인') : '동료') + ' · 명성 ' + num(m.fame) + ' 이상 · ' + m.y[0] + '~' + m.y[1] + '년',
      meta: skillTxt(m.sk), key: 'portraits/mates/' + m.id, kind: 'png', chain: A.portraitKeys(spec), ar: '1 / 1', extra: m.desc, half: I.chain.mateHalf(m.id),
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
      meta: (hs => hs.slice(0, 6).map(h => h[2]).join(' → ') + (hs.length > 6 ? ' → … (' + hs.length + '대)' : ''))(sp.holders.filter(h => h[4] !== 'g')), key: 'portraits/sponsors/' + sp.id, kind: 'png', chain: A.portraitKeys(spec0), ar: '1 / 1', half: I.chain.halfFor(A.portraitKeys(spec0)),
      pic: () => portrait(spec0),
      detail: () => ({
        text: (bs => bs.length ? '인물 이야기 — ' + bs.join(' / ') : '')(sp.holders.filter(h => h[4] !== 'g').map(h => {
          const k = G.BIOS && (G.BIOS[h[2]] ? h[2] : Object.keys(G.BIOS).filter(x => x.length >= 3 && h[2].indexOf(x) >= 0).sort((a, b) => b.length - a.length)[0]);
          return k ? h[2] + ': ' + G.BIOS[k] : null;
        }).filter(Boolean)),
        facts: [
          ['사는 곳', c.name + ' · ' + (sp.place || (sp.bld === 'palace' ? palaceName(c) : '저택'))], ['신분', G.SPONSOR_TYPE[sp.type]],
          ['세력', G.POWER_NAME[sp.pw] + ' (만나려면 명성 ' + num(G.POWER_FAME[sp.pw]) + ')'], ['재력', '★'.repeat(sp.wealth)],
          ['좋아하는 발견', sp.taste.map(G.tasteName).join(', ')], ['말', G.LANGS[sp.lang]],
          sp.nation ? ['나라', NATION[sp.nation]] : null
        ],
        strip: sp.holders.map((h, i) => ({ label: h[2] + ' (' + Math.floor(h[0]) + '~' + (h[1] >= 9999 ? '' : Math.floor(h[1])) + ')', key: (p => typeof p === 'string' ? 'portraits/sponsors/' + p : p ? 'portraits/sponsors/' + sp.id + '_' + p : 'portraits/sponsors/' + sp.id)(A.sponsorPic(sp, i)), kind: 'png', pic: () => portrait(A.sponsorSpec(sp, i)) })),
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
      meta: '좋아하는 사람: ' + G.LIKES[m.like].name + (m.from ? ' · ' + m.from + '년부터 등장' : '') + (reg ? ' · 그림: ' + (MAIDST[reg] || reg) : ''),
      key: 'portraits/maids/' + m.id, kind: 'png', chain: A.portraitKeys(spec), ar: '1 / 1', half: I.chain.maidHalf(m.id, c).concat(I.chain.halfFor(A.portraitKeys(spec))),
      pic: () => portrait(spec),
      detail: () => ({
        facts: [['일하는 곳', c.name + ' 술집'], m.from ? ['등장', m.from + '년부터'] : null, ['좋아하는 사람', G.LIKES[m.like].name],
          ['쓰는 그림', reg ? (MAIDST[reg] || reg) + ' (maid-styles/' + reg + ')' : '코드로 그린 초상'],
          ['결혼', '호감이 높아지면 반지를 건네 청혼할 수 있음']],
        files: [{ key: 'portraits/maids/' + m.id, kind: 'png', note: '이 여급만의 초상 (없으면 지역 그림을 쓴다)' },
          { key: 'portraits/maids/' + m.id + '_half', kind: 'png', note: '술집에 서 있는 모습 (없으면 지역 그림)' }]
      })
    });
  });
  // 지역별 여급 그림: 전용 초상이 없는 여급이 쓴다
  (I.MAIDSTYLES || []).forEach(([sid, label]) => {
    // 실제 게임과 같은 필터를 써서 금지된 저해상도·지역 부적합 그림이 대표 카드에도 나오지 않게 한다.
    const pics = I.maidList ? I.maidList(sid) : I.list('maid-styles/' + sid + '/').filter(k => !/_half$/.test(k));
    const users = G.MAIDS.filter(m => I.maidStyle && I.maidStyle(m.id, CITY[m.city]) === sid && !I.has('portraits/maids/' + m.id));
    const styles = Object.keys(I.MAID_POOL || {}).filter(k => (I.MAID_POOL[k] || []).includes(sid)).map(k => STYLE[k] || k);
    const first = pics[0] || 'maid-styles/' + sid;
    add(tPeople, {
      group: 'maidstyle', portrait: true, name: label, sub: '지역별 여급 그림 ' + (pics.length || 0) + '장',
      meta: users.length ? users.map(m => m.name + '(' + CITY[m.city].name + ')').join(', ') : '아직 쓰는 여급이 없음',
      key: first, kind: 'webp', chain: [first], ar: '1 / 1', half: [first + '_half'],
      pic: () => I.make([first], 512, 512, () => A.canvas(512, 512)),
      detail: () => ({
        text: '한 묶음에 여러 장을 넣으면 도시마다 다른 얼굴이 나옵니다. 여급 번호로 한 장이 정해져 늘 같은 얼굴을 씁니다.',
        facts: [['그림 수', (pics.length || 0) + '장'],
          ['쓰는 여급', users.length ? users.map(m => m.name + ' · ' + CITY[m.city].name).join(', ') : '없음'],
          ['적용되는 도시 양식', styles.join(', ') || '고정 배정만']],
        strip: pics.slice(0, 24).map(k => ({ label: k.split('/').pop(), key: k, kind: 'webp',
          pic: () => I.make([k], 320, 320, () => A.canvas(320, 320)) })),
        files: [{ key: first, kind: 'webp', note: '현재 대표로 쓰는 대화창 흉상' },
          { key: first + '_half', kind: 'webp', note: '현재 대표로 쓰는 술집 무릎상 (배경 투명)' }]
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
      meta: ds.map(d => d.name + ' ' + d.rival[0] + '년').join(', '), key: 'portraits/rivals/' + nm, kind: 'png', chain: A.portraitKeys(spec), ar: '1 / 1', half: I.chain.rivalHalf(nm).concat(I.chain.halfFor(A.portraitKeys(spec))),
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
      key: 'portraits/npc/' + id, kind: 'png', chain: A.portraitKeys(spec), ar: '1 / 1', extra: id, half: local ? I.chain.npcHalf(id, CITY[0]) : I.chain.halfFor(A.portraitKeys(spec)),
      pic: () => portrait(spec),
      detail: () => ({
        text: local ? '같은 역할이라도 도시 양식마다 얼굴이 달라집니다. 도시 번호가 붙은 전용 그림, 그다음 문화권별 건물 사람 그림(portraits/npc/)을 먼저 쓰고, 둘 다 없는 고장에서 portraits/npc-roles/양식/역할.webp를 씁니다.' : '',
        facts: [['나오는 곳', NPC_WHERE[id]]],
        strip: local ? Object.keys(CUL_CITY).map(cu => { const c0 = CUL_CITY[cu], hk = I.pick(I.chain.npcHalf(id, c0)); return {
          label: CUL[cu] + ' (예: ' + c0.name + ')', key: hk || 'portraits/npc/' + id + '_' + cu, kind: hk ? 'webp' : 'png',
          pic: hk ? () => I.make([hk], 1024, 1536, () => portrait(npcSpec(id, c0))) : () => portrait(npcSpec(id, c0)) }; }) : null,
        files: local ? [
          { key: 'portraits/npc/' + id + '@0', kind: 'png', note: '한 도시에서만 (예: 리스본 = 0번)' },
          { key: 'portraits/npc/' + id + '_europe', kind: 'png', note: '문화권별 — europe, islam, eastasia, south, native' },
          { key: 'portraits/npc/' + id, kind: 'png', note: '모든 도시 공통' }
        ] : [{ key: 'portraits/npc/' + id, kind: 'png', note: '모든 곳 공통' }]
      })
    });
  });

  // 사라진 에스파냐 왕녀 특별 이벤트
  if (G.PRINCESS) {
    const p = G.PRINCESS, k = 'portraits/princesses/' + p.id, hk = k + '_half';
    const spec = A.withImg(A.npcSpec('princess_es', 'noble', 'ib', 'f'), [k]);
    add(tPeople, {
      group: 'princess', portrait: true, name: p.name, sub: '특별 이벤트 · 에스파냐',
      meta: '「사라진 왕녀」에서 레반트와 홍해까지 찾아가 구하는 국왕의 막내딸', key: k, kind: 'webp', chain: A.portraitKeys(spec), ar: '1 / 1', half: [hk],
      pic: () => portrait(spec),
      detail: () => ({
        text: '통합 명성이 높은 총각 제독에게 에스파냐 국왕이 비밀리에 구출을 부탁하는, 이 게임에서 지어낸 왕녀입니다.',
        facts: [['이름', p.name], ['애칭', p.short], ['등장하는 이야기', '사라진 에스파냐 왕녀'], ['고향', (CITY[p.city] || {}).name || '에스파냐']],
        files: [{ key: k, kind: 'webp', note: '블랑카 왕녀의 고유 얼굴상' }, { key: hk, kind: 'webp', note: '같은 인물의 고유 무릎상 — 옷단까지, 무릎 노출 없음' }]
      })
    });
  }

  // 왕명 이벤트의 왕녀·귀족 여성 — js/data/court.js의 실제 이름과 고유 그림을 쓴다.
  ((G.COURT && G.COURT.princesses) || []).forEach(p => {
    const realm = G.COURT.realms[p.realm], k = p.face, hk = p.half || k + '_half';
    add(tPeople, {
      group: 'princess', portrait: true, name: p.name, sub: '왕명 왕녀 · ' + realm.name,
      meta: '「왕녀 구출」 왕명에서 해적에게 붙잡혀 간 인물', key: k, kind: 'webp', chain: [k], ar: '1 / 1', half: [hk],
      pic: () => I.make([k], 512, 512, () => portrait(A.npcSpec(p.id, 'noble', p.style, 'f'))),
      detail: () => ({
        text: realm.name + ' 궁정의 왕명에서 이름이 정해지는 인물입니다. 구출 대상의 이름은 게임과 도감에서 똑같이 표시됩니다.',
        facts: [['궁정', realm.name], ['등장하는 왕명', '해적에게 붙잡혀 간 왕녀를 구해 온다'], ['해적 소굴 후보', (realm.dens || []).map(id => CITY[id] && CITY[id].name).filter(Boolean).join(', ')]],
        files: [{ key: k, kind: 'webp', note: '이 왕녀만의 고유 얼굴상' }, { key: hk, kind: 'webp', note: '같은 인물의 고유 무릎상 — 옷단까지, 무릎 노출 없음' }]
      })
    });
  });

  // 궁정 사람 (js/systems/court.js — 왕궁·저택에서 후원자 곁에 선 사람)
  I.list('portraits/courtiers/').filter(k => !/_half$/.test(k)).forEach(k => {
    const id = k.split('/').pop(), sp = G.SPONSOR[id], c = sp && CITY[sp.city];
    add(tPeople, {
      group: 'court', portrait: true, name: (sp ? sp.title : id) + ' 궁정', sub: '궁정 사람 · ' + (c ? c.name : id), meta: '왕궁·저택에서 후원자 곁에서 말을 건네는 사람',
      key: k, kind: 'webp', chain: [k], ar: '1 / 1', half: [k + '_half'],
      pic: () => I.make([k], 512, 512, () => A.canvas(512, 512)),
      detail: () => ({ facts: [['나오는 곳', (c ? c.name + ' ' : '') + (sp && sp.bld === 'palace' ? '왕궁' : '저택')]], files: [{ key: k, kind: 'webp', note: '얼굴 (흉상)' }] })
    });
  });
  // 거리 사람 (js/systems/streetfolk.js — 거리를 걷다 말을 거는 사람, 고장 그림 묶음마다 얼굴·무릎상)
  const FOLK = [['town_man', '마을 사람'], ['town_woman', '마을 여자'], ['boy', '마을 소년'], ['girl', '마을 소녀'], ['elder', '마을 할아버지'], ['grandmother', '마을 할머니'],
    ['librarian', '도서관 사서'], ['innkeeper', '여관 주인'], ['adventurer', '모험가'], ['merchant', '장사꾼'], ['noble_youth', '젊은 귀족'], ['soldier', '병사'], ['navigator', '항해사']];
  const FOLKST = map(I.STYLES);
  FOLK.forEach(([sid, label]) => {
    const keys = I.list('portraits/street-folk/' + sid + '_').filter(k => !/_half$/.test(k));
    if (!keys.length) return;
    const k0 = keys.find(k => /_ib$/.test(k)) || keys[0];
    add(tPeople, {
      group: 'street', portrait: true, name: label, sub: '거리 사람 · 고장 그림 ' + keys.length + '가지', meta: '거리에서 말을 걸면 대화창에 서는 사람 — 고장마다 옷·얼굴이 다름',
      key: k0, kind: 'webp', chain: [k0], ar: '1 / 1', half: [k0 + '_half'],
      pic: () => I.make([k0], 512, 512, () => A.canvas(512, 512)),
      detail: () => ({
        text: '도시의 그림 양식(거리 사람 묶음)에 따라 아래 그림 가운데 하나가 나옵니다. 걷는 모습은 images/street-folk/' + sid + '_양식.webp 시트입니다.',
        strip: keys.filter(k => k !== k0).map(k => { const st = k.split('_').pop(); const h = I.has(k + '_half') ? k + '_half' : k;
          return { label: (FOLKST[st] || st) + ' (' + st + ')', key: h, kind: 'webp', pic: () => I.make([h], h === k ? 512 : 1024, h === k ? 512 : 1536, () => A.canvas(512, 512)) }; }),
        files: [{ key: k0, kind: 'webp', note: '얼굴 (흉상, 512×512)' }, { key: 'street-folk/' + sid + '_ib', kind: 'webp', note: '거리를 걷는 그림 시트 (이베리아)' }]
      })
    });
  });

  // ------------------------------------------------ discoveries
  const tDisc = tab('discoveries', '발견물', {
    chips: [['all', '전체']].concat(Object.keys(G.DISC_CATS).map(k => [k, G.DISC_CATS[k]])),
    note: '파일: <code>images/discoveries/ID.jpg</code> · 권장 1440×640(9:4) · 지리는 배 위의 발견 장면과 고지도 항로, 유적은 복원과 상공 회전, 자연 경관은 시간 변화 파노라마, 동물은 새끼의 등장과 성체 보호, 식물은 빈 캔버스의 유화가 실사 풍경으로 살아나는 과정, 보물은 암흑 속 큐레이터 조명과 360° 2회전, 교역품은 등불 켜진 시장 좌판으로 다가가는 장면을 GIF로 보여 줍니다.'
  });
  G.DISCOVERIES.forEach(d => {
    const where = d.how === 'trade' ? (d.regions || [d.reg]).map(r => G.REGIONS[r]).join('·') : (G.Disc && G.Disc.regName ? G.Disc.regName(d) : d.how === 'city' && CITY[d.city] && CITY[d.city].region === d.reg && G.regionLabel ? G.regionLabel(CITY[d.city]) : G.regionLabelAt ? G.regionLabelAt(d.reg, d.lon, d.lat) : G.REGIONS[d.reg]);   // 도감에는 discovery.js 가 없다 — 동아시아는 좌표로 「동아시아 · 조선 / 중국 / 일본」 (2026-10-23)
    const place = d.how === 'city' ? CITY[d.city].name + (d.cat === 'ruin' ? ' 시내 (그 건물을 누르면)' : d.by && G.MATE[d.by] ? ' — ' + G.MATE[d.by].name + '을(를) 만나면 (세상을 떠난 뒤에는 시내 건물에서)' : ' 시내 (건물에 들어가면)')
      : d.outskirts && d.homeCity != null ? CITY[d.homeCity].name + ' 근처 뭍 (도시 밖을 탐험하면)' : d.how === 'trade' ? goodName(d.good) + ' — ' + where + '에서 처음 살 때' : d.id === 'circum' ? '세계 일주를 마치고 출발한 항구로 돌아올 때' : lat(d.lat) + ', ' + lon(d.lon);
    const moving = d.cat === 'geo' || d.cat === 'ruin' || d.cat === 'nature' || d.natural || ((d.cat === 'creature' || d.cat === 'treasure' || d.cat === 'trade' || d.cat === 'people') && !!(G.Reel && G.Reel.has(d)));
    add(tDisc, {
      group: d.cat, name: d.name, sub: G.DISC_CATS[d.cat] + ' · ' + where, meta: HOW[d.how] + ' · 가치 ' + num(d.val) + (d.rival ? ' · 경쟁자 ' + d.rival[2] : ''),
      key: 'discoveries/' + d.id, kind: 'jpg', chain: I.chain.discovery(d), ar: '9 / 4', extra: d.desc + ' ' + (d.name0 || ''), animated: moving, disc: d,
      pic: () => I.make(I.chain.discovery(d), 720, 320, () => A.discoveryArt(d, 720, 320)),
      detail: () => ({
        text: d.desc, hint: '단서 — ' + d.hint, real: d.real,
        facts: [
          ['분류', G.DISC_CATS[d.cat]], d.name0 ? ['옛 기록의 이름', d.name0] : null, ['지역', where], ['찾는 방법', HOW[d.how]], ['위치', place],
          ...(d.folk ? (G.FOLK_LABEL || []).filter(k => d.folk[k[0]]).map(k => ['풍속 · ' + k[1], d.folk[k[0]]]) : []),
          d.folkCities ? ['이야기를 듣는 곳', d.folkCities.map(i => CITY[i].name).join(', ') + ' — 들어서면 마을 사람이, 술집에서는 주인이 (개척 단계와 상관없이)'] : null,
          ['가치', num(d.val)], ['명성 (직접 보고하면)', '+' + num(fameFor(d))], ['단서에 쓰인 말', G.LANGS[d.lang]],
          G.frontierText ? ['단서가 열리는 때', G.frontierText(d)] : null,
          d.need ? ['앞 고리 (먼저 찾아야 열린다)', d.need.map(x => (G.DISC[x] || {}).name || x).join(', ')] : null,
          (nx => nx.length ? ['다음 고리', nx.map(x => x.name).join(', ')] : null)(G.DISCOVERIES.filter(x => x.need && x.need.indexOf(d.id) >= 0)),
          (as => as.length ? ['업적', as.map(a => a.name).join(', ')] : null)((G.ACHIEVEMENTS || []).filter(a => (a.ids && a.ids.indexOf(d.id) >= 0) || (a.cats && a.cats.some(r => r.ids && r.ids.indexOf(d.id) >= 0)))),
          G.clueWhere ? ['단서를 얻는 곳', G.clueWhere(d) + ' (' + G.CLUE_NAME[G.CLUE[d.id]] + ' 갈래 · 계약·큰 항로 이야기·유물·원주민 등은 갈래와 상관없이)'] : null,
          (bs => bs.length ? [G.CLUE && G.CLUE[d.id] === 'talk' ? '이야기가 나오는 책 (단서는 사람들에게서)' : '단서가 실린 책', bs.map(b => b.title + ' (' + G.LANGS[b.lang] + (b.y > 1480 ? ' · ' + b.y + '년 간행' : '') + (b.sk ? ' · ' + (G.SKILL_BY_ID[b.sk] || {}).name + ' ' + b.lv : '') + ')').join(' / ')] : null)(G.BOOKS.filter(b => b.discs.indexOf(d.id) >= 0)),
          d.rival ? ['경쟁자', d.rival[2] + ' — ' + d.rival[0] + '년 ' + d.rival[1] + '월에 발표'] : null,
          d.evidence ? ['증거품', d.evidence] : null,
          (G.RELICS && G.RELICS[d.id]) ? ['유물 (발견의 증거)', G.RELICS[d.id].map(r => r.name + ' — ' + G.RELIC_KIND[r.kind] + ' · 값 ' + num(r.price) + '닢').join(' / ')] : null
        ],
        files: [
          { key: 'discoveries/' + d.id, kind: 'jpg', note: moving ? '이 발견물의 움직이는 그림' : '이 발견물의 그림' },
          moving && G.Reel && G.Reel.has(d) ? { key: 'discovery-sheets/' + d.id, kind: 'webp', note: '게임에서 재생하는 장면 판' } : null,
          { key: 'discovery-cats/' + d.cat, kind: 'jpg', note: G.DISC_CATS[d.cat] + ' 분류 공통' }
        ].filter(Boolean)
      })
    });
  });

  // ------------------------------------------------ trade goods
  const tGoods = tab('goods', '교역품', {
    chips: [['all', '전체']].concat(Object.keys(G.GOOD_CATS).map(k => [k, G.GOOD_CATS[k]])),
    note: '교역소·함대 적재 목록·교역품 발견 카드에 쓰는 그림입니다. 파일: <code>images/goods/ID.webp</code> · 권장 192×192 투명 배경 · 갈래 공통 <code>good-kinds/갈래.webp</code>'
  });
  G.GOODS.forEach(g => {
    const ownKey = g.plant && g.from ? 'discovery-ends/' + g.from : 'goods/' + g.id;
    add(tGoods, {
      group: g.cat, name: g.name, sub: G.GOOD_CATS[g.cat] + ' · ' + g.id,
      meta: '기준값 ' + num(g.p) + '닢' + (G.Cargo ? ' · 무게 ' + G.Cargo.wt(g.id) + (G.Cargo.keep(g.id) ? ' · ' + G.Cargo.keep(g.id) + '일 신선' : '') : g.life ? ' · ' + g.life + '일 뒤 상함' : ''),
      key: ownKey, kind: g.plant ? 'jpg' : 'webp', chain: I.chain.good(g), ar: '1 / 1', extra: g.id,
      pic: () => I.make(I.chain.good(g), 256, 256, () => A.relicArt({ id: 'good_' + g.id, name: g.name, kind: 'treasure' }, 256, 256), { fit: 'contain' }),
      detail: () => ({ facts: [['갈래', G.GOOD_CATS[g.cat]], ['기준값', num(g.p) + '닢'], ['보관', G.Cargo ? (G.Cargo.keep(g.id) ? G.Cargo.keep(g.id) + '일 신선 → 넘으면 값이 떨어지고 두 배를 넘기면 상함' : '상하지 않음') : g.life ? g.life + '일' : '상하지 않음']].concat(G.Cargo ? [['무게', '1통에 ' + G.Cargo.wt(g.id)]] : []),
        files: [{ key: ownKey, kind: g.plant ? 'jpg' : 'webp', note: g.plant ? '이 교역품이 된 식물 발견의 고해상도 마지막 장면' : '이 교역품의 그림 (192×192, 투명 배경)' }, { key: 'good-kinds/' + g.cat, kind: 'webp', note: G.GOOD_CATS[g.cat] + ' 공통' }] })
    });
  });

  // ------------------------------------------------ ordinary items
  const tItems = tab('items', '소지품', {
    chips: [['all', '전체']].concat(Object.keys(G.ITEM_KIND).filter(k => k !== 'book' && k !== 'fig' && k !== 'animal').map(k => [k, G.ITEM_KIND[k]])),
    note: '시장과 수첩 소지품에 쓰는 일반 장비·도구·장신구 그림입니다. 파일: <code>images/items/ID.webp</code> · 권장 256×256 투명 배경 · 종류 공통 <code>item-kinds/종류.webp</code>'
  });
  G.ITEMS.filter(it => !(G.RELIC && G.RELIC[it.id])).forEach(it => {
    const stat = it.kind === 'weapon' ? '공격 ' + it.atk : it.kind === 'armor' ? '방어 ' + it.def : it.kind === 'gift' ? '호감 ' + it.gv : it.kind === 'mgift' ? '남자 선물 ' + it.gv : G.ITEM_KIND[it.kind];
    add(tItems, {
      group: it.kind, name: it.name, sub: (G.ITEM_KIND[it.kind] || it.kind) + ' · ' + it.id,
      meta: stat + (it.price ? ' · ' + num(it.price) + '닢' : ''), key: 'items/' + it.id, kind: 'webp', chain: I.chain.item(it), ar: '1 / 1', extra: it.desc,
      pic: () => I.make(I.chain.item(it), 256, 256, () => A.relicArt(it, 256, 256), { fit: 'contain' }),
      detail: () => ({ text: it.desc, facts: [['종류', G.ITEM_KIND[it.kind] || it.kind], ['효과', stat], ['기준값', it.price ? num(it.price) + '닢' : '팔지 않음']],
        files: [{ key: 'items/' + it.id, kind: 'webp', note: '이 소지품의 그림 (256×256, 투명 배경)' }, { key: 'item-kinds/' + it.kind, kind: 'webp', note: (G.ITEM_KIND[it.kind] || it.kind) + ' 공통' }] })
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
    // 지금 게임은 도시마다 거리 화면(backgrounds/도시번호)을 쓴다 — 양식 공통 거리 배경, 없으면 이 양식 첫 도시의 거리 배경을 보여 준다
    const styleBg = I.list('bg-styles/' + st + '_port_').concat(I.list('bg-styles/' + st + '_inland_'), ['bg-styles/' + st + '_port', 'bg-styles/' + st + '_inland', 'bg-styles/' + st]);
    const stChain = styleBg.concat(['backgrounds/' + ex.id, 'city-styles/' + st]);
    const own = cities.filter(c => I.has('backgrounds/' + c.id)).length;
    add(tEtc, {
      group: 'style', name: label, sub: 'bg-styles/' + st + '_…', meta: cities.length + '곳 — ' + cities.slice(0, 4).map(c => c.name).join(', ') + (cities.length > 4 ? ' …' : '') + ' · 거리 배경 ' + own + '곳',
      key: I.pick(stChain) || 'bg-styles/' + st + '_port_a', kind: 'jpg', chain: stChain, ar: '16 / 9', extra: cities.map(c => c.name).join(' '),
      pic: () => I.make(stChain, 1600, 900, () => A.cityScene(ex, { time: 'day' })),
      detail: () => ({
        text: '도시마다 거리 화면 배경(backgrounds/도시번호)을 씁니다. 이 양식의 도시 가운데 ' + own + '곳은 제 배경이 있고, 없는 곳은 양식 공통 거리 배경(bg-styles/' + st + '_port_a …), 그것도 없으면 도시 풍경(cities/ · city-styles/)을 씁니다. 그림은 ' + (I.pick(styleBg) ? '양식 공통 거리 배경' : ex.name + '의 거리 배경') + '입니다.',
        facts: [['쓰는 도시', cities.map(c => c.name + ' (' + c.id + ')' + (I.has('backgrounds/' + c.id) ? '' : ' — 배경 없음')).join(', ')]],
        files: [
          { key: 'bg-styles/' + st + '_port_a', kind: 'jpg', note: '항구 도시 공통 거리 배경 (여러 장이면 _a, _b …)' },
          { key: 'bg-styles/' + st + '_inland_a', kind: 'jpg', note: '내륙 도시 공통 거리 배경' },
          { key: 'city-styles/' + st, kind: 'jpg', note: '낮' },
          { key: 'city-styles/' + st + '_golden', kind: 'jpg', note: '해질녘' },
          { key: 'city-styles/' + st + '_dusk', kind: 'jpg', note: '저녁' }
        ]
      })
    });
  });
  Object.keys(G.DISC_CATS).forEach(cat => {
    const ds = G.DISCOVERIES.filter(d => d.cat === cat), ex = ds[0];
    const bare = ds.filter(d => !I.pick(['discoveries/' + d.id]));   // 제 그림이 없어 분류 공통 그림을 쓰는 발견물
    const exChain = ['discovery-cats/' + cat].concat(ex ? I.chain.discovery(ex) : []);
    add(tEtc, {
      group: 'cat', name: G.DISC_CATS[cat] + ' 발견물', sub: 'discovery-cats/' + cat,
      meta: bare.length ? bare.length + '종이 이 공통 그림을 씀' : ds.length + '종 모두 제 그림이 있어 지금은 쓰이지 않음 (그림은 ' + (ex ? ex.name : '') + ')',
      key: 'discovery-cats/' + cat, kind: 'jpg', chain: exChain, ar: '9 / 4',
      pic: () => I.make(exChain, 720, 320, () => A.discoveryArt(ex, 720, 320)),
      detail: () => ({ text: '이 분류의 발견물 가운데 discoveries/ID 파일이 없는 것만 이 그림을 씁니다.' + (bare.length ? '' : ' 지금은 모든 발견물에 제 그림이 있습니다.'), facts: [['발견물', ds.map(d => d.name).join(', ')], bare.length ? ['공통 그림을 쓰는 것', bare.map(d => d.name).join(', ')] : null], files: [{ key: 'discovery-cats/' + cat, kind: 'jpg', note: '분류 공통' }] })
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
      detail: () => ({ text: '도시 건축 발견물과 같은 id의 그림은 해당 도시·건축 연도에 자동으로 서고, 그 밖의 장식은 js/scenes/town.js 의 LANDMARKS 에서 정합니다.', files: [{ key: k, kind: 'webp', note: '거리 볼거리' }] })
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
    const early = animatedImage(it, true);          // 장면 판은 GIF를 받지 않고 곧장
    if (early && early.tagName === 'CANVAS') { el.appendChild(early); return; }
    if (it.chain && I.pick(it.chain)) await I.preload([it.chain], 4000);
    const moving = early;
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
    } else I.drawCover(tctx, src, 0, 0, w, h, 0.5, it.halfKey ? 0 : it.portrait ? 0.25 : 0.5);
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
      ', 경쟁자 ' + cnt('rival') + ', 마을 사람 ' + cnt('npc') + ') · 발견물 ' + n('discoveries') + ' · 교역품 ' + n('goods') + ' · 소지품 ' + n('items') + ' · 배 ' + n('ships') + ' · 교체한 그림 ' + I.count() + '장';
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
    if (it.halfKey) {
      d.strip = [{ label: '대화창에 서는 모습 (무릎상)', key: it.halfKey, kind: 'webp', pic: () => I.make([it.halfKey], 1024, 1536, it.bustPic) },
        { label: '얼굴 (흉상) — 수첩·명부·작은 대화 칸', key: (it.bustChain && I.pick(it.bustChain)) || it.key, kind: 'png', pic: it.bustPic }].concat(d.strip || []);
      d.files = (d.files || []).concat([{ key: it.halfKey, kind: 'webp', note: '대화창에 서는 무릎상 (머리부터 무릎까지, 1024×1536 투명 배경)' }]);
    }
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
    if (it.halfKey) await I.preload([[it.halfKey]], 4000);
    const moving = animatedImage(it), src = moving ? null : it.pic();
    $('#dHero').appendChild(moving || copyCanvas(src));
    if (d.strip) {
      const box = $('#dStrip');
      for (const s of d.strip) {
        const fig = document.createElement('figure');
        fig.innerHTML = '<figcaption>' + esc(s.label) + '<span class="path">' + pathHtml(pathOf(s.key, s.kind)) + '</span></figcaption>';
        box.appendChild(fig);
        await new Promise(r => requestAnimationFrame(() => r()));
        if (s.key && I.has(s.key)) await I.preload([[s.key]], 4000);
        const pic = s.pic();
        const cv = s.wide ? copyCanvas(pic, 480, 270) : copyCanvas(pic);
        fig.insertBefore(cv, fig.firstChild);
      }
    }
  }

  // ---------------------------------------------------------------- help: manifest check
  // 게임이 통째로 읽는 그림 폴더 (발견 장면 판·끝 장면, 유물, 거리 사람·건물 묶음, 일기토, 안내서 그림 등)
  const GAME_DIRS = /^(discovery-ends|discovery-sheets|discoveries_cinematic|discovery-ends-cinematic|relics|relic-kinds|exterior-styles|street-folk|street-ground|sprites|goods|good-kinds|items|item-kinds|duel|guide|ships-nav|family-events|romance-events|cabins|effects|outcomes|landwar|map-discoveries|minigames)\//;
  const GAME_PORTRAITS = /^portraits\/(legendary|courtiers|street-folk|npc-roles|pools|family|player|player-aged)\//;
  // 게임이 이름으로 부르는 그 밖의 그림: 건물 사람 변형(_2·_f·_m), 이야기 인물(story_·princess_), 이야기·전설 동료, 개척 단계 보물(ft_), 다른 후원자 자리 그림
  const GAME_NAMED = /^(portraits\/npc\/(story_|princess_)[a-z_]+|portraits\/npc\/[a-z]+(_[a-z]+)?_(\d|f|m)|discoveries\/ft_[a-z_]+|portraits\/mates\/[a-z_]+|portraits\/sponsors\/[a-z_]+)$/;
  function knownKey(k) {
    let m;
    if (k === 'title') return true;
    if (GAME_DIRS.test(k) || GAME_PORTRAITS.test(k)) return true;
    if (/_half$/.test(k)) k = k.replace(/_half$/, '');   // 대화창 무릎상 — 흉상과 같은 이름 + _half
    if (GAME_NAMED.test(k)) return true;
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
