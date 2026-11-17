"""원화 제작 명세에서 인도양 여성 철새 30명의 고정 자료와 등장 순환을 만든다."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
plan = json.loads((ROOT / 'tools/indian_ocean_windsalt_20261116_prompts.json').read_text(encoding='utf-8'))
zones = {
    'IN': ('monsoon_india', '인도 해안', [148, 150, 151, 152, 154, 157]),
    'LK': ('monsoon_srilanka', '스리랑카', [155]),
    'BD': ('monsoon_bengal', '벵골만', [157]),
    'PK': ('monsoon_west', '인도양 서부', [148, 125]),
    'MV': ('monsoon_islands', '인도양 섬 항로', [155, 154, 152]),
    'OM': ('monsoon_oman', '오만', [125]),
    'ID': ('monsoon_sumatra', '수마트라 인도양 항로', [166])
}
jobs = ['돛줄 항해사', '해안 안내인', '나침반지기', '해도 기록관', '측량 항해사', '신호수', '항로 상담역', '매듭 기술자', '야간 당직장', '갑판의 교섭가', '호위 항해사', '급수 당직장', '해도 전달수', '조타수', '돛 관리인', '갑판 부관', '수심 측량사', '휴식 당직장', '밧줄 감정사', '항해 일지 기록관', '별자리 항해사', '돛줄 당직장', '돛 수선공', '신호 항해사', '선단 호위병', '망원경지기', '갑판 기술자', '선창 관리인', '인도양 키잡이', '돛 수선 항해사']
actions = ['바람을 받는 줄을 잡고 해도를 챙긴다', '돌아보며 뒤따르는 동료를 확인한다', '나침반 바늘을 가리고 방위를 읽는다', '잠깐 앉아 다음 항로를 생각한다', '젖은 해도를 펼쳐 얕은 여울을 가른다', '먼 수평선을 가리키며 방향을 알린다', '턱을 괴고 바뀌는 물길을 헤아린다', '무릎을 굽혀 매듭을 단단히 묶는다', '등불을 들고 당직 구역을 살핀다', '웃으며 다가오는 동료를 맞는다', '칼집을 짚고 갑판의 질서를 지킨다', '목마른 동료에게 물 한 잔을 건넨다', '머리카락을 넘기고 해도 두루마리를 챙긴다', '키를 잡고 물살에 맞춰 배를 돌린다', '젖은 돛감을 어깨에 메고 옮긴다', '차분히 팔짱을 끼고 동료의 말을 듣는다', '측심줄의 무게추로 수심을 잰다', '통에 걸터앉아 당직 뒤 숨을 고른다', '줄의 상한 결을 찾아 손본다', '항해 일지에 새로운 물길을 적는다', '별과 측정판의 각도를 맞춘다', '몸을 틀어 힘차게 돛줄을 당긴다', '젖은 돛천을 접고 찢어진 가장자리를 찾는다', '천을 흔들어 다음 선박에 신호를 보낸다', '칼을 낮게 받치고 위험한 뱃길을 지킨다', '망원경으로 먼 배의 돛을 확인한다', '동료에게 줄뭉치를 던져 건넨다', '바구니 속 항해 도구를 챙긴다', '작은 해도를 짚고 키를 움직인다', '무릎을 굽혀 돛천에 바느질을 한다']
skillsets = [
    ['nav', 'ops', 'survey'], ['nav', 'speech', 'survey', 'sci'],
    ['nav', 'sci', 'survey', 'hist', 'ops'], ['art', 'hist', 'nav', 'speech', 'acct', 'music'],
    ['nav', 'survey', 'sci', 'ops'], ['ops', 'nav', 'speech', 'music', 'sword'],
    ['speech', 'med', 'nav'], ['craft', 'ship', 'ops', 'nav'],
    ['nav', 'ops', 'sword', 'shoot', 'med'], ['speech', 'acct', 'nav', 'music', 'art', 'cook']
]
crew = []
for i, r in enumerate(plan['portraits']):
    zone, _, ports = zones[r['nat']]
    assert r['home'] in ports
    skills = skillsets[i % len(skillsets)]
    langs = [8, 5, 6, 1, 3]
    if r['nat'] == 'OM': langs = [5, 8, 6, 1, 3]
    if r['nat'] == 'ID': langs = [12, 8, 5, 1, 3]
    count = 3 + i % 3
    m = dict(no=r['id'], id='monsoon_' + r['id'], name=r['name'], nat=r['nat'], natName=r['nationality'],
             style='is' if r['nat'] == 'OM' else 'se' if r['nat'] == 'ID' else 'in',
             home=r['home'], zone=zone, reg=[8] if r['nat'] == 'ID' else [4] if r['nat'] == 'OM' else [5], portraitAge=r['age'],
             st=[66 + (i * 5) % 18, 80 + (i * 3) % 13, 76 + (i * 7) % 15, 86 + (i * 2) % 10],
             sk={sk: 3 if j < 2 else 2 for j, sk in enumerate(skills)},
             lg={str(li): 3 if j < 2 else 2 for j, li in enumerate(langs[:count])},
             fame=300 + i % 6 * 100, wage=85 + i % 6 * 5,
             desc=r['nationality'] + ' 출신의 ' + jobs[i] + '. ' + actions[i] + '. 계절풍의 방향을 읽으며 인도양의 항구들을 오간다.')
    crew.append(m)
prefix = """/* 계절풍의 여성 항해사 30명. 인도항로 발견일부터 5년마다 3명, 40년마다 다시 섞는다.
   얼굴·복식 참고는 tools/indian_ocean_windsalt_20261116_prompts.json. 국가는 지리적 출신 표기다. */
(function (G) {
  'use strict';
  var U = G.U, cfg = G.BALANCE.monsoonCrew;
"""
for zone, name, ports in zones.values():
    prefix += '  G.MATE_ZONES.' + zone + ' = ' + json.dumps({'name': name, 'ids': ports}, ensure_ascii=False) + ';\n'
prefix += '  var crew = ' + json.dumps(crew, ensure_ascii=False, indent=2) + ';\n'
prefix += """  var ids = crew.map(function (m) { return m.id; });
  crew.forEach(function (m) {
    m.monsoonRotation = true;
    m.face = 'portraits/mates/indian-ocean-windsalt/' + m.no; m.halfKey = m.face + '_half';
    m.g = 'f'; m.role = 'sailor'; m.typeName = '항해사'; m.y = [0, 9999]; m.skBoost = 1;
    G.MATES.push(m); G.MATE[m.id] = m; G.MATE_RANGE[m.id] = { zones: [m.zone], home: m.home };
  });
"""
tail = "  G.MonsoonCrew = G.DiscoveryCrew.create(ids, 'monsoonCrew', 'monsoonCrew');\n})(window.G = window.G || {});\n"
(ROOT / 'js/data/monsooncrew.js').write_text(prefix + tail, encoding='utf-8', newline='\n')
print('인도양 여성 철새 30명 자료 작성 완료')
