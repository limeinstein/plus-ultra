/* 플레이어 도감 — 게임의 인물·사건·업적·음식·소지품 자료를 그대로 읽는다. 저장 상태는 바꾸지 않는다. */
(function (G) {
  'use strict';
  G.CatalogExtras = { register: function (api) {
    const { tab, add, people, portrait, num } = api, I = G.Img, A = G.Art;
    const cityName = id => (G.CITY_DATA[id] || {}).name || '알려지지 않은 도시';
    const date = e => [e.y + '년', e.m ? e.m + '월' : '', e.d ? e.d + '일' : ''].filter(Boolean).join(' ');
    const words = { me: '제독', love: '동반자', you: '제독', k1: '첫째 아이', k2: '둘째 아이', k3: '셋째 아이', kids: '아이들', child: '아이', baby: '갓난아기', mate: '부관', city: '도시', home: '고향', days: '항해한 날수' };
    const prose = s => String(s || '').replace(/\{([^}|]+)(?:\|[^}]+)?\}/g, (_, k) => words[k] || '일행');
    function pageArt(label) {
      const cv = A.canvas(640, 400), c = cv.getContext('2d');
      c.fillStyle = '#e7d8b4'; c.fillRect(0, 0, 640, 400);
      c.strokeStyle = '#a18049'; c.lineWidth = 3; c.strokeRect(24, 24, 592, 352);
      c.fillStyle = '#75532f'; c.textAlign = 'center'; c.font = 'bold 52px serif'; c.fillText('✦', 320, 150);
      c.font = 'bold 30px serif'; c.fillText(label, 320, 236, 540);
      return cv;
    }
    function scene(t, e) {
      const chain = e.chain || (e.key ? [e.key] : []);
      return add(t, { group: e.group, name: e.name, sub: e.sub || '', meta: e.meta || '', extra: e.text || '', when: e.when, achId: e.achId, foodId: e.foodId,   // 본 것만 보이게 (js/systems/codexmemo.js)
        key: chain[0] || '', chain: chain, ar: '16 / 10',
        pic: () => I.make(chain, 960, 600, () => pageArt(e.name)),
        detail: () => ({ text: e.text, hint: e.hint, facts: (e.facts || []).filter(Boolean) }) });
    }

    // 사건에만 등장하는 인물도 찾을 수 있다. 그림 제작용 생김새 지시문은 설명으로 쓰지 않는다.
    people.chips.push(['history', '역사·이야기 인물']);
    Object.keys(G.HIST_FIG || {}).forEach(id => {
      const f = G.HIST_FIG[id], sp = G.Hist.speaker(id), chain = G.Hist.faceKeys(id);
      add(people, { group: 'history', name: f.name, sub: f.title || '이야기 속 인물', meta: f.born ? f.born + '년 출생' : '',
        portrait: true, key: chain[0], chain: chain, half: sp.half || [], ar: '1 / 1', extra: f.full || '',
        pic: () => portrait(sp.portrait || A.npcSpec('hist_' + id, f.role || 'captain', f.st || 'ib', f.g || 'm')),
        detail: () => ({ text: (G.BIOS || {})[f.name] || f.title || '항해 도중 이야기에서 만나는 인물입니다.',
          facts: [['역할', f.title || '이야기 인물'], f.fiction ? ['설정', '게임을 위해 만든 이야기 인물'] : null, f.full ? ['본명', f.full] : null, f.born ? ['태어난 해', f.born + '년'] : null] }) });
    });

    const events = tab('events', '이벤트 도감', { chips: [['all', '전체'], ['story', '모험 이야기'], ['family', '가족'], ['relations', '왕실·정세'], ['world', '세계 소식']],
      note: '항해에서 겪은 이야기와 장면, 그 해까지 지나간 세계 소식을 다시 볼 수 있습니다.' });
    (G.CATALOG_SCENES || []).forEach(e => scene(events, { group: 'story', name: e.name, key: e.key, sub: e.story, text: e.text,
      facts: [['이야기', e.story]], hint: '모험 중 펼쳐지는 장면입니다. 사건의 진행에 따라 이 장면을 만나게 됩니다.' }));
    const at = { sea: '바다 위', tavern: '술집', return: '집에 돌아온 날', dock: '고향 부두', port: '항구', preg: '임신 소식', birth: '출산', home: '집', wed: '혼례' };
    const needs = { wife: '본처', wife2: '둘째 부인', lover: '애인', married: '혼인한 동반자', matewife: '동료였던 아내', maidwife: '여급이었던 아내', k1: '아이 한 명 이상', k2: '아이 두 명 이상', k3: '아이 세 명 이상', nokids: '아이 없음', girl: '딸', boy: '아들', small: '여덟 살 미만의 아이', big: '열두 살 이상의 아이', baby: '곁에 있는 갓난아기', preg: '임신', mate: '부관 동행', aboard: '아이 승선', second: '둘째 부인과 혼례', rich: '금화 1만 닢 초과', long: '150일 넘게 떠나 있었음', together: '동반자와 함께 귀향' };
    const needText = n => n.map(k => k[0] === '!' ? (needs[k.slice(1)] || k.slice(1)) + ' 조건이 아님' : needs[k] || k).join(' · ');
    (G.FAMILY_EVENTS || []).forEach(e => scene(events, { group: 'family', name: e.title, key: e.img, sub: at[e.at] || '가족 이야기',
      text: prose((e.lines || []).filter(l => !l.if).map(l => l.t).slice(0, 4).join(' ')),
      hint: '가족 구성과 동행 여부에 따라 대화가 달라집니다.', facts: [['장소·계기', at[e.at] || '가족 이야기'],
        e.need && e.need.length ? ['기본 조건', needText(e.need)] : null, e.kid ? ['아이 나이', e.kid[0] + '세~' + e.kid[1] + '세'] : null,
        e.pick ? ['선택', e.pick.opts.map(o => prose(o.label)).join(' / ')] : null] }));
    const when = e => e.y * 10000 + (e.m || 1) * 100 + (e.d || 1);   // 그날이 지난 항해를 했으면 본 소식
    (G.REL_EVENTS || []).forEach(e => scene(events, { group: 'relations', name: e.title, key: e.img, sub: date(e), when: when(e), text: e.text || '이 사건을 계기로 나라 사이의 관계가 바뀝니다.',
      facts: [['시기', date(e)], e.need && e.need.met ? ['직접 소식을 전하는 조건', e.need.met.map(id => (G.SPONSOR[id] || {}).title || '후원자').join(' · ') + ' 가운데 한 사람을 만난 적이 있음'] : null,
        e.ask ? ['참여', prose(e.ask.text)] : null, e.battle ? ['참여', '해당 시기의 전장 해역에서 큰 해전에 참여할 수 있습니다.'] : null] }));
    (G.HISTORY || []).filter(e => e.text).forEach(e => scene(events, { group: 'world', name: e.text.split('.')[0], key: e.img, sub: date(e), text: e.text, when: when(e),
      facts: [['시기', date(e)], e.city ? ['관련 도시', cityName(e.city[0])] : null] }));

    const ach = tab('achievements', '업적 도감', { chips: [['all', '전체']].concat((G.ACHV_GROUPS || []).map(g => [g, g])),
      note: '이룬 업적의 달성 조건과 보상을 살펴봅니다. 아직 이루지 못한 업적은 항해 중 수첩의 업적에서 확인할 수 있습니다.' });
    (G.ACHIEVEMENTS || []).forEach(a => {
      const e = (G.ACHV_EVENTS || {})[a.id] || {}, chain = [e.pic || 'achievement-events/' + a.id];
      (a.ids || []).forEach(id => chain.push('discoveries/' + id));
      scene(ach, { group: a.group, name: a.name, sub: a.group, text: a.desc, chain: chain, achId: a.id,
        meta: '탐험 명성 +' + num(a.fame || 0) + ' · 금화 ' + num(a.gold || 0) + '닢',
        facts: [['달성 조건', a.desc], ['탐험 명성', '+' + num(a.fame || 0)], ['금화 보상', num(a.gold || 0) + '닢'],
          a.title ? ['칭호', a.title] : null, a.ids ? ['관련 발견물', a.ids.map(id => (G.DISC[id] || {}).name || id).join(' · ')] : null,
          a.crew ? ['관련 동료', a.crew.map(id => (G.MATE[id] || {}).name || id).join(' · ')] : null,
          e.n ? ['달성 장면', prose([].concat(e.n).join(' '))] : null] });
    });

    const zones = { british: '브리튼', german: '독일·한자', french: '프랑스', iberia: '이베리아', italian: '이탈리아', east_europe: '동유럽', russia_steppe: '러시아·초원', ottoman_levant: '오스만·레반트', north_africa: '북아프리카', africa: '아프리카', south_africa: '남아프리카', india: '인도', seasia: '동남아시아', china_north: '중국 북부', china_south: '중국 남부', korea: '조선', japan: '일본', north_america: '북아메리카', latin: '라틴아메리카', native_oceania: '토착 아메리카·오세아니아' };
    const food = tab('foods', '음식 도감', { chips: [['all', '전체']].concat(Object.entries(zones)), note: '지역별 음식의 설명과 식사 효과를 살펴봅니다. 표기된 값은 기본값이며 항해 중의 상태에 따라 실제 회복량이 달라집니다.' });
    const k = G.BALANCE.restaurant, served = {};
    G.CITY_DATA.filter(c => G.CUISINE.hasRestaurant ? G.CUISINE.hasRestaurant(c) : c.size >= k.minSize || (G.CUISINE.special[c.id] || []).length).forEach(c => G.CUISINE.dishes(c).forEach(d => (served[d.id] = served[d.id] || []).push(c)));
    G.CUISINES.forEach(d => {
      const cities = served[d.id] || [], prices = cities.map(c => Math.round(k.base + c.size * k.size + d.tier * k.tier));
      scene(food, { group: d.zone, name: d.name, sub: zones[d.zone], key: 'foods/' + d.id, text: d.desc, foodId: d.id,
        meta: '등급 ' + d.tier + ' · 피로 −' + k.rest[d.tier] + ' · 체력 +' + k.hp[d.tier],
        facts: [['지역', zones[d.zone]], ['음식 등급', d.tier], ['피로 감소', k.rest[d.tier]], ['체력 회복', k.hp[d.tier]], ['규율 증가', (k.disc || [])[d.tier] || 0],
          ['기본 사교 명성', (k.so || [])[d.tier] || 0], ['식사', '도시에 들를 때마다 한 끼'],
          ['기본 가격', prices.length ? num(Math.min(...prices)) + (Math.min(...prices) === Math.max(...prices) ? '' : '~' + num(Math.max(...prices))) + '닢' : '차림표가 편성된 도시에서 결정'],
          ['차림표에 있는 도시', cities.length ? cities.map(c => c.name).join(' · ') : '현재 차림표에 편성된 도시 없음']] });
    });

    ['instrument', 'weapon'].forEach(kind => {
      const t = tab(kind === 'instrument' ? 'instruments' : 'weapons', kind === 'instrument' ? '악기 도감' : '무기 도감', {
        chips: [['all', '전체'], ['market', '시장 판매'], ['relic', '발견 유물'], ['special', '특수 입수']],
        note: kind === 'instrument' ? '연주 악기와 군악기를 모았습니다. 지역·전통·생김새와 입수 경로를 살펴봅니다.' : '시장 무기와 발견·사건으로 얻는 무기를 모았습니다. 공격력과 입수 경로를 살펴봅니다.' });
      const seen = new Set();
      G.ITEMS.filter(it => it.kind === kind).forEach(it => {
        if (seen.has(it.id)) return; seen.add(it.id);
        const relic = (G.RELIC || {})[it.id], origin = relic ? 'relic' : it.reg && it.reg.length ? 'market' : 'special';
        const chain = I.chain.item(it), source = relic && G.DISC[relic.relic];
        add(t, { group: origin, itemId: it.id, name: it.name, sub: (it.subRegion || (it.reg || []).map(r => G.REGIONS[r]).join(' · ') || '특수 입수'),
          meta: kind === 'weapon' ? '공격력 ' + (it.atk || 0) : it.tradition || (it.military ? '군악기' : '연주 악기'),
          extra: it.desc + ' ' + (it.aliases || []).join(' '), key: chain[0], chain: chain, ar: '1 / 1', fit: 'contain',
          pic: () => I.make(chain, 480, 480, () => A.relicArt(it, 480, 480), { fit: 'contain' }),
          detail: () => ({ text: it.desc, facts: [kind === 'weapon' ? ['공격력', it.atk || 0] : null,
            it.price ? ['기본 가격', num(it.price) + '닢'] : null, ['입수 경로', origin === 'relic' ? (source ? source.name + ' 발견' : '발견 유물') : origin === 'market' ? '해당 지역의 시장' : '암시장·특별한 사건 등'],
            it.reg && it.reg.length ? ['판매 지역', (it.subRegion ? it.subRegion + ' · ' : '') + it.reg.map(r => G.REGIONS[r]).join(' · ')] : null,
            it.tradition ? ['전통', it.tradition] : null, it.strings ? ['현의 수', it.strings] : null, it.military ? ['용도', '군악'] : null] }) });
      });
    });
  } };
})(window.G = window.G || {});
