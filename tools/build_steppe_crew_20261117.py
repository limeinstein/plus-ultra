"""초원 남성 원화 30명을 지역별 발견 뒤 순환하는 영입 자료로 연결한다."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
art = json.loads((ROOT / 'tools/steppe_windsalt_20261117_prompts.json').read_text(encoding='utf-8'))
homes = {'UG': [137, 138, 311], 'MN': [143, 144, 310], 'TB': [139], 'MJ': [189, 312, 313, 314, 315]}
skills = [
    ['ops', 'nav', 'ship'], ['ops', 'sword', 'nav', 'speech'],
    ['nav', 'survey', 'sci', 'hist', 'ops'], ['sword', 'shoot', 'ops', 'nav', 'med', 'speech'],
    ['ship', 'craft', 'ops', 'nav'], ['nav', 'survey', 'speech', 'acct', 'hist', 'sci'],
    ['cook', 'med', 'nav'], ['ops', 'ship', 'craft', 'sword'],
    ['nav', 'sci', 'survey', 'art', 'speech'], ['speech', 'music', 'acct', 'nav', 'ops', 'cook']
]
roles = ['돛줄 항해사', '갑판 호위', '밧줄 운반꾼', '해도 제작자', '선단 경비', '물 보급관', '신호장', '매듭 장인',
         '권양기 갑판장', '돛 운반꾼', '방향 길잡이', '밧줄 장인', '선단 연락원', '갑판 살림꾼', '매듭 수선공',
         '망루 당직', '항로 참모', '원정 길잡이', '별길 관측자', '구조 담당', '물 운반꾼', '해도 길잡이',
         '나침반 당직', '보급 운반꾼', '갑판 당직', '노잡이', '돛 수선공', '키잡이', '호송대 경비', '갑판 작업장']
crew = []
for i, row in enumerate(art['portraits']):
    nat = row['nat']
    langs = ([13, 7, 9, 14, 6] if nat == 'MJ' else [9, 7, 6, 5, 13])[:3 + i % 3]
    sk = skills[i % len(skills)]
    crew.append(dict(no=row['id'], id='steppe_' + row['id'], name=row['name'], nat=nat, natName=row['nationality'],
        steppeRegion=nat, style='cn' if nat == 'MJ' else 'st', home=homes[nat][i % len(homes[nat])],
        zone='steppe_' + nat, reg=[6, 7] if nat == 'MJ' else [7], portraitAge=row['age'],
        st=[84 + i * 3 % 14, 70 + i * 7 % 20, 78 + i * 5 % 16, 72 + i * 2 % 19],
        sk={s: 3 if j < 2 else 2 for j, s in enumerate(sk)},
        lg={str(l): 3 if j < 2 else 2 for j, l in enumerate(langs)},
        fame=300 + i % 6 * 100, wage=85 + i % 6 * 5,
        desc=row['nationality'] + ' 출신의 ' + roles[i] + '. 대상 길과 강의 나루를 오가다 배를 탔다. 고향의 발견물이 알려지면 같은 고장의 도시와 여관을 떠돌며 선단에 합류한다.'))

text = """/* 위구르 8·몽골 10·티베트 6·만주 6명의 창작 성인 남성 항해사.
   초상은 tools/steppe_windsalt_20261117_prompts.json, 발견물·도시·주기 수치는 base.js에 둔다. */
(function (G) {
  'use strict';
  var cfg = G.BALANCE.steppeCrew, groups = {}, byRegion = {};
  var names = { UG: '위구르', MN: '몽골', TB: '티베트', MJ: '만주' };
  Object.keys(cfg.groups).forEach(function (key) {
    G.MATE_ZONES['steppe_' + key] = { name: names[key], ids: cfg.groups[key].cities.slice() };
    byRegion[key] = [];
  });
  var crew = """ + json.dumps(crew, ensure_ascii=False, indent=2) + ";\n"
text += """  crew.forEach(function (m) {
    m.steppeRotation = true; m.face = 'portraits/mates/steppe-windsalt/' + m.no; m.halfKey = m.face + '_half';
    m.g = 'm'; m.role = 'sailor'; m.typeName = '초원 철새 항해사'; m.y = [0, 9999]; m.skBoost = 1;
    G.MATES.push(m); G.MATE[m.id] = m; G.MATE_RANGE[m.id] = { zones: [m.zone], home: m.home };
    byRegion[m.steppeRegion].push(m.id);
  });
  Object.keys(byRegion).forEach(function (key) {
    groups[key] = G.DiscoveryCrew.create(byRegion[key], 'steppeCrew', 'steppeCrew_' + key, key);
  });
  G.SteppeCrew = {
    ids: crew.map(function (m) { return m.id; }), groups: groups,
    active: function (id, year, seed) {
      var m = G.MATE[id], group = m && groups[m.steppeRegion];
      return !!(group && group.active(id, year, seed));
    },
    rememberDiscovery: function (id) {
      Object.keys(groups).forEach(function (key) { if (cfg.groups[key].gates.indexOf(id) >= 0) groups[key].rememberDiscovery(); });
    },
    periodText: function (id, year) {
      var m = G.MATE[id], group = groups[id] || (m && groups[m.steppeRegion]);
      return group ? group.periodText(year) : '지역별 발견물을 직접 하나 이상 발견한 날부터 ' + cfg.years + '년마다 최대 ' + cfg.count + '명 · 미고용 후보 순환 · ' + cfg.cycle + '년마다 재추첨';
    }
  };
})(window.G = window.G || {});
"""
(ROOT / 'js/data/steppecrew.js').write_text(text, encoding='utf-8', newline='\n')
print('초원 남성 철새 30명 자료 작성 완료')
