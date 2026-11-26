"""원본·비교 자료만 묶는다. 거대한 원본 지구 자료나 미완료 로그·게임 배포판은 넣지 않는다."""
from pathlib import Path
import zipfile,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/world-detail-20261125'
archive=OUT/'terrain-art-and-comparison.zip'
files=[OUT/x for x in ['index.html','baseline.html','comparison-preview.png','texture-before-after.png','terrain-biomes-preview.png','winter-river.png','implementation.diff','runtime-manifest.json','source-manifest.json','patch-manifest.json','route-geometry.json','actual-waterway-travel.json','season-and-landing.json','ocean-invariant.json','harbor-profiles.json','diagnostic/gpu-boundary.json','after/report.json','before-final/report.json','biome-runtime/report.json','biome-before/report.json','performance-before/report.json','final-validation.json','biome-rules.json']]
files.extend((OUT/'after').glob('*.png'));files.extend((OUT/'before-final').glob('*.png'))
files.extend((OUT/'blender').glob('*.png'));files.extend((OUT/'blender').glob('*.blend'));files.extend([OUT/'blender/frames.json',OUT/'blender/mountain-heights.json'])
files.extend((OUT/'iteration-1/after').glob('*.png'));files.extend((OUT/'iteration-1/blender').glob('*.blend'));files.extend([OUT/'relief-projection.json',OUT/'iteration-1/after/report.json'])
for folder in ['biome-runtime','biome-before','biomes']:files.extend((OUT/folder).glob('*.png'))
files.extend((OUT/'before-source').rglob('*'));files.extend((ROOT/'tools/world_detail').glob('*.py'));files.extend((ROOT/'tools/world_detail').glob('*.cjs'));files.append(ROOT/'docs/world-terrain-20261125.md')
for rel in ['js/world/terrain.js','js/art/terrain_art.js','js/art/terrain_materials.js','js/data/landscapes.js','js/data/waterways.js','js/data/waterway_geometry.js','tests/terrain_relief_20261125.cjs','tests/terrain_biome_rules_20261125.cjs','tests/landscape_capture_20261125.cjs','tests/world_detail_browser.cjs','tests/world_detail_ocean_invariant.cjs','tests/world_detail_diagnostic.cjs','tests/world_detail_season_smoke.cjs','tests/world_detail_gallery_check.cjs','tests/waterways_20261125.cjs','tests/waterways_browser_20261125.cjs','tests/waterways_port_profile.cjs']:files.append(ROOT/rel)
final=json.loads((OUT/'final-validation.json').read_text(encoding='utf8'))
if len(final['rows'])!=11 or any(r['exit'] for r in final['rows']):raise RuntimeError('최종 검증이 완료되지 않음')
files.extend(OUT/r['log'] for r in final['rows'])
notes='''세계 지형·식생·강 검토 모음 (2026-11-25~26, 미배포 작업본)

artifacts/world-detail-20261125/index.html에서 전후 비교를 엽니다.
blender/biome-assets.blend는 최신 수목·지형 부품·11개 환경 시안의 주 원본입니다.
regional-vegetation.blend와 natural-landmarks.blend는 초기 원본을 보관합니다.
84개 투명 PNG와 생성 스크립트도 포함했습니다. biomes/는 Blender 시안이며
실제 게임 화면은 after/와 biome-runtime/, 원본은 before-final/와 biome-before/입니다.
첨부 참고 사진과 PDF는 재배포하지 않습니다.

이 모음은 전체 게임 배포판이 아닙니다. 원본 실행판 baseline.html은 사용자의
D:/Git/대항해2 CLAUDE/WebGame 공용 자산을 읽으므로 게임 폴더가 필요합니다.
게임의 거대한 원화 묶음과 ETOPO TIFF·Shapefile은 이 ZIP에 포함하지 않았습니다.
자료 원본은 작업 폴더 sources/에 보존했으며 출처·SHA256는 문서를 참고하십시오.
완성된 게임용 고도·수목 JS 묶음도 현재 WebGame/js/data에 있습니다.

재제작할 때는 기존 게임 저장소의 tools/world_detail 경로와 artifacts 경로를 유지합니다.
이미 추출한 mountain-heights.json과 공통 모형 함수가 있으므로 Blender 모형만 다시
구울 때는 별도의 지구 TIFF 다운로드 없이 blender_assets.py를 사용할 수 있습니다.
'''
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for file in sorted(set(files)):
  if file.is_file():z.write(file,file.relative_to(ROOT).as_posix())
 z.writestr('검토 모음 안내.txt',notes)
with zipfile.ZipFile(archive) as z:
 bad=z.testzip()
 if bad:raise RuntimeError('ZIP CRC 오류: '+bad)
 count=len(z.infolist())
meta={'file':archive.name,'bytes':archive.stat().st_size,'entries':count,'crc':'OK'}
(OUT/'package.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(meta,ensure_ascii=False))
