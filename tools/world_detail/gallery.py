"""실제 게임 전후 원본을 고치지 않고 비교 갤러리·별도 미리보기로 묶는다."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,html,zipfile
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/world-detail-20261125'
names={'lisbon-basic':'항해 기본 시점 · 테주강어귀','lisbon-close':'항해 확대 · 테주강어귀','alps-basic':'육상 기본 · 알프스','alps-close':'육상 확대 · 실제 고도와 혼합림','amazon-close':'육상 확대 · 아마존 군락','fuji-close':'후지산 · 원뿔 화산과 눈 골짜기','nile-close':'나일강 · 사막의 강가 식생','amazon-river':'항해 확대 · 아마존 수로','uluru-close':'울루루 · 세로 풍화 홈','karst-close':'장자제 · 봉우리 군락','iguazu-close':'이구아수 · 절벽과 폭포','kilimanjaro-close':'킬리만자로 · 고도별 식생과 암반'}
before=json.loads((OUT/'before-final/report.json').read_text(encoding='utf-8'));after=json.loads((OUT/'after/report.json').read_text(encoding='utf-8'))
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22);small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',17)
canvas=Image.new('RGB',(1600,1040),'#eeeae1');draw=ImageDraw.Draw(canvas)
draw.text((22,12),'직전 작업본 · 이끼처럼 보이던 지면',font=font,fill='#272d21');draw.text((822,12),'이번 수정 · 숲 군락, 강변, 실제 고도의 암반',font=font,fill='#272d21')
for j,key in enumerate(['alps-close','amazon-river']):
 y=58+j*485
 for i,folder in enumerate(['iteration-1/after','after']):
  im=Image.open(OUT/folder/(key+'.png')).convert('RGB');im.thumbnail((790,445),Image.Resampling.LANCZOS);canvas.paste(im,(i*800+5,y))
 draw.text((12,y+446),names[key],font=small,fill='#272d21')
canvas.save(OUT/'comparison-preview.png')
# 원본 픽셀은 보존하고, 비교용 사본만 축소해 한 장에 모은다.
tex=Image.new('RGB',(1600,1040),'#eeeae1');td=ImageDraw.Draw(tex)
for col,title in enumerate(['작업 전 원본','사구·모래결 / 암벽·절리 수정']):td.text((col*800+16,12),title,font=font,fill='#272d21')
for row,(key,title) in enumerate([('desert-close','사막 · 굽은 사구와 모래결'),('snow-mountains-close','산 · 연결된 능선과 노출 암반')]):
 y=55+row*485
 for col,folder in enumerate(['biome-before','biome-runtime']):
  im=Image.open(OUT/folder/(key+'.png')).convert('RGB');im.thumbnail((790,445),Image.Resampling.LANCZOS);tex.paste(im,(col*800+5,y))
 td.text((12,y+446),title,font=small,fill='#272d21')
tex.save(OUT/'texture-before-after.png')
preview=Image.new('RGB',(1600,1560),'#eeeae1');pd=ImageDraw.Draw(preview)
for i,(key,title) in enumerate([('desert','사막'),('rocky','화강암 암릉'),('snow-mountains','설산'),('jungle','정글'),('mangrove','맹그로브'),('oasis','오아시스')]):
 x=(i%2)*800;y=(i//2)*520;pd.text((x+12,y+8),title+' · 실제 게임 확대',font=font,fill='#272d21');im=Image.open(OUT/'biome-runtime'/(key+'-close.png')).convert('RGB');im.thumbnail((790,445),Image.Resampling.LANCZOS);preview.paste(im,(x+5,y+48))
preview.save(OUT/'terrain-biomes-preview.png')
parts=['''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>세계 지형 · 작업 전후 비교</title><style>
*{box-sizing:border-box}body{margin:0;background:#edeae2;color:#252d24;font:16px/1.65 "Malgun Gothic",sans-serif}main{max-width:1500px;margin:auto;padding:30px}h1{font-size:28px;margin-bottom:6px}h2{font-size:21px;margin-top:40px}a{color:#31543b}nav{position:sticky;top:0;background:#edeae2;padding:10px 0;border-bottom:1px solid #bdc4b8;z-index:3}nav a{margin-right:22px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%;display:block}figcaption{font-size:14px;padding:4px 0}.meta{color:#566052;font-size:14px}.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:14px}.tiles figure{background:#d7dbd0;padding:10px}.tiles img{height:180px;object-fit:contain}.metric{padding:12px 0;border-top:1px solid #bdc4b8}button{padding:7px 12px;margin-right:9px;border:1px solid #84917e;background:transparent;color:inherit;cursor:pointer}.one .pair{display:block}.one .pair figure{margin-bottom:12px}@media(max-width:850px){.pair{grid-template-columns:1fr}main{padding:16px}}
</style><main><h1>자연스러운 지형과 강 · 미배포 작업본</h1><p>세계 좌표와 바다의 시간 환산을 유지하면서 실제 고도·생물군계·자연 호수를 반영했습니다. 같은 지역의 숲은 녹색 명암을 공유하고, 가지·수관·높이·군락 밀도로 수종을 구분합니다.</p><p class="meta">2026-11-25 · 실제 index.html 실행 · 원본 PNG를 수정하지 않음 · 비교를 위해 좌표·카메라·발견 상태를 준비한 시험 화면입니다. 자연경관을 모두 발견한 상태로 촬영했으며 실제 저장은 바꾸지 않았습니다. 지형은 높이 음영과 Blender 모형을 결합한 2.5D 방식입니다.</p><nav><a href="#scenes">기본·확대 비교</a><a href="#vegetation">수종</a><a href="#wonders">자연경관</a><a href="#rules">강과 계절</a><a href="#source">원본·검증</a></nav><h2 id="scenes">같은 위치와 확대율의 실제 게임 화면</h2><button id="layout">한 장씩 크게 보기</button>''']
parts[0]=parts[0].replace('2026-11-25 · 실제','2026-11-25~26 · 실제').replace('<a href="#vegetation">','<a href="#biomes">지형별 비교</a><a href="#vegetation">')
parts.append('<p>사막은 굽은 사구의 큰 곡면 위에 바람결·모래 알갱이 명암을 얹고, 산은 실제 경사에 따라 암반 면·절리·풍화 홈과 잔설을 나눴습니다. 이는 현재 엔진의 2.5D 개선이며 문명 7 전체 3D 품질과 동일하다는 뜻은 아닙니다.</p><p><a href="texture-before-after.png">사막·산 질감 비교 한 장</a> · <a href="terrain-biomes-preview.png">지형별 실제 게임 미리보기</a></p>')
parts.append('<h2>직전 작업본에서 다시 고친 모습</h2><p>지면의 과한 요철·수관 잡음을 걷고, 층진 수관과 군락 가장자리·흙·풀·경사 암반·얕은 강변을 구분했습니다. 산의 높이 투영은 나무·탐험대·클릭 역변환에 함께 적용합니다.</p>')
for key in ['alps-close','amazon-close','amazon-river']:
 parts.append(f'<h3>{names[key]} · 두 번째 검토</h3><div class="pair">')
 for folder,label in [('iteration-1/after','직전 작업본 원본'),('after','이번 수정')]:parts.append(f'<figure><a href="{folder}/{key}.png"><img src="{folder}/{key}.png" loading="lazy" alt="{names[key]} {label}"></a><figcaption>{label}</figcaption></figure>')
 parts.append('</div>')
parts.append('<p><a href="iteration-1/blender/regional-vegetation.blend">직전 수목 Blender 원본</a> · <a href="iteration-1/blender/natural-landmarks.blend">직전 자연경관 Blender 원본</a> · <a href="relief-projection.json">높이 투영·클릭 좌표 검사</a></p>')
biomeNames={'tundra':'툰드라 · 잔설과 낮은 관목','grassland':'초원 · 풀밭과 공터','jungle':'정글 · 교목·야자·아래층 식물','rocky':'화강암 암릉 · 설악산 부근','snow-mountains':'설산 · 능선과 노출 급사면','mangrove':'맹그로브 · 지주근과 물가','oasis':'시와 오아시스 · 샘과 좁은 녹지','desert':'사막 · 사구 법선과 바람결','waikiki':'휴양지 해변 · 와이키키','capri':'절벽과 만 · 카프리','jeju':'화산 해안 · 제주'}
br=OUT/'biome-runtime/report.json'
if br.exists():
 bdata=json.loads(br.read_text(encoding='utf-8'));parts.append('<h2 id="biomes">첨부 참고에 맞춘 지형별 실제 게임 전후</h2><p>각 지형의 기본·확대 화면입니다. 배는 원래 바다 판정으로 가까운 물에 두었으며 전후에 같은 배치 규칙을 썼습니다. 사진의 미터 단위 지형을 복제한 지도는 아니며, 기존 지도의 좌표와 항해 시간 단위를 유지합니다. 시와의 작은 샘은 기존 발견 위치 옆에 붙인 게임용 세부입니다.</p>')
 for row in bdata['views']:
  key=row['name'];kind=key.rsplit('-',1)[0];parts.append(f'<h3>{biomeNames[kind]} · {"확대" if key.endswith("close") else "기본"}</h3><div class="pair">')
  for folder,label in [('biome-before','원본'),('biome-runtime','수정본 · 실제 게임')]:parts.append(f'<figure><a href="{folder}/{key}.png"><img src="{folder}/{key}.png" loading="lazy" alt="{biomeNames[kind]} {label}"></a><figcaption>{label}</figcaption></figure>')
  parts.append('</div>')
parts.append('<h2>최초 게임 원본과 이번 수정 · 주요 항해와 자연경관</h2>')
for row in after['views']:
 key=row['name'];parts.append(f'<section><h3>{html.escape(names[key])}</h3><p class="meta">경도 {row["lon"]}° · 위도 {row["lat"]}° · 확대율 {row["zoom"]} px/°</p><div class="pair">')
 for folder,label in [('before-final','작업 전 원본'),('after','개선 작업본')]:parts.append(f'<figure><a href="{folder}/{key}.png"><img src="{folder}/{key}.png" loading="lazy" alt="{html.escape(names[key]+label)}"></a><figcaption>{label} · 원본 PNG 열기</figcaption></figure>')
 parts.append('</div></section>')
parts.append('<h2 id="vegetation">Blender 수목 원본 · 녹색은 공유하고 형태로 구분</h2><p>같은 녹색 재질과 조명으로 맞췄습니다. 나무가 겹치는 수관과 낮은 가지, 큰 교목·어린 나무의 높이 차이로 숲을 표현합니다. 먼 시점은 수관 덩어리, 가까운 시점은 최대 1,800개 부품을 묶은 캐시로 그립니다. 탐험대 주위는 옅어지며, 군락 준비는 여러 장면으로 나눕니다.</p><div class="tiles">')
trees={'oak':'참나무·활엽수','pine':'소나무·타이가 침엽수','umbrella':'우산소나무','acacia':'아라비아고무나무형','cedar':'백향목형','tropical':'티크·용뇌수·브라질나무형','poplar':'호양형','palm':'강변·해안 야자','mangrove':'맹그로브 지주근','bamboo':'대나무','snowpine':'눈이 남은 침엽수','emergent':'정글의 높은 교목·덩굴'}
for key,name in trees.items():parts.append(f'<figure><a href="blender/tree-{key}-0.png"><img src="blender/tree-{key}-0.png" loading="lazy" alt="{name}"></a><figcaption>{name}</figcaption></figure>')
parts.append('</div><h2 id="wonders">자연경관 모형 · 투명 렌더 원본</h2><p>ETOPO로 만든 원본에 더해 사진에서 구분되는 석주·화강암·원뿔 화산·날카로운 설산을 별도 조형으로 보강했습니다. 모형의 작은 요철과 절리는 측량값이 아닙니다. 지도에 직접 배치한 산은 발견 후 같은 그림을 다시 겹치지 않습니다. 나머지 자연경관 그림도 유지했습니다.</p><div class="tiles">')
frames=json.loads((OUT/'blender/frames.json').read_text(encoding='utf-8'))
for f in frames:
 if not f['id'].startswith('wonder-'):continue
 key=f['id'];parts.append(f'<figure><a href="blender/{key}.png"><img src="blender/{key}.png" loading="lazy" alt="{key}"></a><figcaption>{key.removeprefix("wonder-")}</figcaption></figure>')
parts.append('</div><h2>암벽·아래층 식물 부품</h2><div class="tiles">')
for f in frames:
 if f['id'].startswith('detail-') and f['id'].endswith('-0'):
  key=f['id'];parts.append(f'<figure><a href="blender/{key}.png"><img src="blender/{key}.png" loading="lazy" alt="{key}"></a><figcaption>{key.removeprefix("detail-").removesuffix("-0")}</figcaption></figure>')
parts.append('</div><h2>Blender 환경 시안 · 게임 스크린샷과 별도</h2><p>같은 부품으로 형태·배치를 검토한 편집 가능한 3D 시안입니다. 아래 장면 자체를 게임의 지면 메시로 쓴 것은 아닙니다. 실제 적용 결과는 위의 게임 전후 화면을 기준으로 봅니다.</p><div class="pair">')
for key in ['tundra','grassland','tropical','rocky','mountains','mangrove','oasis','desert','beach','cove','temperate-beach']:
 if (OUT/'biomes'/(key+'.png')).exists():parts.append(f'<figure><a href="biomes/{key}.png"><img src="biomes/{key}.png" loading="lazy" alt="Blender 환경 시안 {key}"></a><figcaption>Blender 시안 · {key}</figcaption></figure>')
parts.append('''</div><h2 id="rules">강 그림·통행·항로는 같은 자료로 판정</h2><p>주요 하류 21개를 개방했습니다. 작은 강은 육상 탐험만 가능하고, 큰 강도 함대에서 가장 제약이 큰 배의 폭·수심·선회 조건을 따릅니다. 마차의 큰 강 도하 금지, 말·코끼리의 이점, 짐승·짐 손실, 담수 보충에 따른 육상 경비 절감, 홍수, 겨울 결빙·순록 썰매, 강 항구의 나루·다리를 반영했습니다. 연결된 톤레사프 호수로 항해할 수 있고, 연결하지 않은 호수는 배가 들어갈 수 없습니다. 수로 끝에서는 기존 상륙 단추로 육상 탐험을 이어 갑니다.</p><p class="meta">강 폭·수심·선회 값은 게임용 설정입니다. 실제 수로 측량이나 항해 보증값이 아닙니다. 강의 표시 폭은 세계 지도에서 읽히도록 과장했으며 표시·충돌에는 같은 폭을 씁니다.</p><figure><a href="winter-river.png"><img src="winter-river.png" loading="lazy" alt="겨울 강과 순록 썰매"></a><figcaption>북드비나강 · 겨울 조건을 준비한 실제 게임 화면</figcaption></figure><h2 id="source">편집 원본과 검증</h2><p><a href="blender/regional-vegetation.blend">수목 Blender 원본</a> · <a href="blender/natural-landmarks.blend">자연경관 Blender 원본</a> · <a href="baseline.html">보존한 원본 실행판</a> · <a href="implementation.diff">보존 작업본 대비 차이</a> · <a href="runtime-manifest.json">파일 해시</a></p><p><a href="../../docs/world-terrain-20261125.md">구현·조정값·제약·자료 출처</a> · <a href="after/report.json">실행·성능 원본 기록</a> · <a href="actual-waterway-travel.json">실제 수로 항해 검사</a> · <a href="season-and-landing.json">계절·상륙 검사</a> · <a href="diagnostic/gpu-boundary.json">GPU/CPU 경계·복구 검사</a></p>''')
for label,r in [('작업 전',before),('작업 후',after)]:
 m=r['moving'];parts.append(f'<p class="metric">{label} 실제 먼바다 이동 · 중앙 {m["median"]:.1f}ms / p95 {m["p95"]:.1f}ms / 최대 {m["max"]:.1f}ms · 같은 시간 이동 거리 {m["distance"]:.12f}°</p>')
parts.append('<p><a href="blender/biome-assets.blend">최신 수목·지형 부품·환경 시안 Blender 원본</a> · <a href="final-validation.json">최종 11개 검사 결과</a> · <a href="biome-rules.json">생물군계·샘·도하 검사</a> · <a href="performance-before/report.json">원본 숲 카메라 이동 기록</a> · <a href="after/report.json">최종 숲 카메라 이동 기록</a></p>')
for label,r in [('원본 숲',json.loads((OUT/'performance-before/report.json').read_text(encoding='utf8'))),('수정 숲',after)]:
 m=r.get('forestMotion')
 if m:parts.append(f'<p class="metric">{label} 실제 rAF 카메라 이동 180프레임 · 표시 간격 중앙 {m["intervalMedian"]:.1f}ms / p95 {m["intervalP95"]:.1f}ms / 최대 {m["intervalMax"]:.1f}ms · CPU 장면 갱신 중앙 {m["updateMedian"]:.1f}ms / p95 {m["updateP95"]:.1f}ms / 최대 {m["updateMax"]:.1f}ms · 숲 판 재생성 {m["plateRebuilds"]}회</p>')
parts.append('<p class="meta">1600×900, RTX 3050, Chrome/D3D11. 정지/먼바다 수치는 장면 갱신과 WebGL 완료를 기다린 비용이며 2D 합성의 GPU 완료까지 동기화한 측정은 아닙니다. 별도 숲 이동은 실제 rAF 표시 간격을 기록했습니다. 전체 게임 FPS나 모든 PC의 성능을 보증하지 않습니다. 전후 측정은 순차 실행했습니다. 차가운 캐시·처음 선박 모형을 만드는 비용은 원본 기록의 cold·warmMax에 별도로 남겼습니다.</p><script>document.getElementById("layout").onclick=()=>document.body.classList.toggle("one");</script></main></html>')
parts.insert(-1,'<p><a href="terrain-art-and-comparison.zip">Blender 원본·전후 비교 모음 ZIP</a> · 전체 게임 배포판은 포함하지 않습니다.</p>')
(OUT/'index.html').write_text(''.join(parts),encoding='utf-8')
print('GALLERY_READY',len(after['views'])*2,'main screenshots;',len(frames),'asset frames; biome comparisons and Blender studies separate')
