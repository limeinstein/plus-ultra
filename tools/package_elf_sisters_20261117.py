"""두 초상 묶음을 서로 다른 성인 엘프 자매 20명으로 게임에 등록한다."""
import json, re, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/elf-sisters-20261117'
OUT.mkdir(parents=True,exist_ok=True)
PAIRS=[
 ('galadriel','갈라드리엘','arwen','아르웬','금빛 바람','톨킨의 가운데땅','톨킨의 가운데땅'),
 ('celebrian','켈레브리안','luthien','루시엔','은빛 달','톨킨의 가운데땅','톨킨의 가운데땅'),
 ('idril','이드릴','nimrodel','님로델','숲의 맹세','톨킨의 가운데땅','톨킨의 가운데땅'),
 ('aredhel','아레델','finduilas','핀두일라스','장미의 검','톨킨의 가운데땅','톨킨의 가운데땅'),
 ('alleria','알레리아','vereesa','베리사','황혼의 불꽃','워크래프트','워크래프트'),
 ('tyrande','티란데','shandris','샨드리스','새벽의 날개','워크래프트','워크래프트'),
 ('sylvanas','실바나스','maiev','마이에브','검은 바람','워크래프트','워크래프트'),
 ('thalyssra','탈리스라','liadrin','리아드린','햇살의 노래','워크래프트','워크래프트'),
 ('deedlit','디드리트','marcille','마르실','바다의 진주','로도스도 전기','던전밥'),
 ('frieren','프리렌','nellas','넬라스','비취의 불꽃','장송의 프리렌','톨킨의 가운데땅'),
]
TRAITS=[
 ('검과 돛줄을 함께 다루며 거친 바람 앞에서 일행을 이끈다.','먼저 미소를 건네고, 뜻밖의 돌풍에도 침착하게 돛을 고른다.'),
 ('달과 별의 위치로 항로를 짚는 차분한 창전사다.','은빛 창끝으로 물결을 가리키며 새로운 항로를 찾는다.'),
 ('숲길의 흔적으로 길을 찾고 긴 활로 동료를 지킨다.','나뭇잎과 해류의 작은 변화를 빠르게 알아챈다.'),
 ('예의 바른 말과 빈틈없는 세검 솜씨를 갖췄다.','웃음 띤 눈으로 상대를 살피며 가볍고 빠르게 검을 쓴다.'),
 ('쌍검을 쓰며 위험한 순간에는 누구보다 먼저 앞으로 나선다.','기운찬 웃음과 재빠른 쌍검으로 동료들의 용기를 북돋운다.'),
 ('사람과 장비를 세심하게 챙기는 잎새검 전사다.','돛 수선과 요리를 즐기고 잎새검을 능숙하게 다룬다.'),
 ('침착한 판단과 날카로운 곡도로 갑판의 질서를 지킨다.','솔직한 말투와 과감한 움직임으로 위기를 돌파한다.'),
 ('바람을 읽는 활잡이로, 노래로 긴 항해의 지루함을 달랜다.','밝은 노래와 유연한 활솜씨로 새로운 바다를 반긴다.'),
 ('조류와 여울을 읽고 삼지창으로 해안의 길을 연다.','진주 장식을 손수 엮고 삼지창과 항해술을 함께 익혔다.'),
 ('오래된 숲의 이야기를 모으며 비취빛 창으로 길을 지킨다.','호기심이 많고 약초와 바닷바람의 냄새를 잘 구별한다.'),
]
SKILLS=[{'sword':3,'ops':3,'nav':2,'speech':2},{'sword':3,'nav':3,'survey':2,'sci':2},
 {'sword':3,'survey':3,'nav':2,'med':2},{'sword':3,'speech':3,'music':2,'craft':2},
 {'sword':3,'ops':3,'nav':2,'ship':2},{'sword':3,'ops':2,'craft':3,'cook':2},
 {'sword':3,'ops':3,'survey':2,'speech':2},{'sword':3,'nav':3,'music':3,'ops':2},
 {'sword':3,'nav':3,'survey':3,'craft':2},{'sword':3,'hist':3,'med':2,'nav':2}]
rows=[]
for i,p in enumerate(PAIRS):
    no=f'{i+1:02d}'
    for rank in range(2):
        slug,name=p[rank*2:rank*2+2]
        sibling_slug,sibling_name=p[(1-rank)*2:(1-rank)*2+2]
        relation='언니' if rank==0 else '여동생'
        source=ROOT.parent/('output/elf-warriors-20261117'+('-v2' if rank else ''))/'game-ready'
        ident='elf_'+slug
        for suffix in ('','_half'):
            dest=ROOT/'images/portraits/mates/elf-sisters'/f'{slug}{suffix}.webp'
            dest.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(source/f'{no}{suffix}.webp',dest)
            with Image.open(dest) as im:
                assert im.size==((1024,1536) if suffix else (512,512)) and im.mode=='RGBA'
                assert im.getchannel('A').getextrema()[0]==0
        rows.append(dict(id=ident,name=name,g='f',style='ne',race='elf',role='soldier',
            typeName='엘프 전사',elfSister=True,sisterId='elf_'+sibling_slug,sisterRank=relation,
            sisterPair='elf_sisters_'+no,portraitAge=32 if rank==0 else 27,
            face='portraits/mates/elf-sisters/'+slug,halfKey='portraits/mates/elf-sisters/'+slug+'_half',
            home=64+i%5,reg=[1],st=[77+i%4,74+i%5,87-i%3,88+i%6],sk=SKILLS[i],skBoost=1,
            lg={'3':3,'2':2,'1':2},fame=300,wage=125,y=[0,9999],
            desc=f'{p[4]} 자매의 {relation}. {sibling_name}의 '+('언니' if rank==0 else '여동생')+f'이며, 북유럽 항구를 여행하는 성인 엘프 전사다. '+TRAITS[i][rank],
            nameOrigin=p[5+rank]))
assert len(rows)==20 and len({r['name'] for r in rows})==20
data='/* 엘프 자매 10쌍. 이름만 기존 작품에서 차용하며 자매 관계·인물 설정은 이 게임의 별도 설정이다. */\n(function (G) {\n  \'use strict\';\n  var crew = '+json.dumps(rows,ensure_ascii=False,indent=2)+';\n'
data+='  crew.forEach(function (m) {\n    if (!G.MATE[m.id]) { G.MATES.push(m); G.MATE[m.id] = m; }\n    G.MATE_RANGE[m.id] = { zones: [\'nordic\'], home: m.home };\n  });\n  G.ELF_SISTERS = crew.map(function (m) { return m.id; });\n})(window.G = window.G || {});\n'
(ROOT/'js/data/elfsisters.js').write_text(data,encoding='utf-8',newline='\n')
for html in ('index.html','catalog.html'):
    file=ROOT/html
    text=file.read_text(encoding='utf-8')
    anchor='<script src="js/data/steppecrew.js"></script>'
    addition='<script src="js/data/elfsisters.js"></script>'
    assert anchor in text
    if addition not in text:text=text.replace(anchor,anchor+'\n'+addition)
    file.write_text(text,encoding='utf-8',newline='\n')
# 기존 목록의 별칭과 다른 작업의 연결을 보존하고 이 작업의 40개 키만 더한다.
file=ROOT/'images/manifest.js'
text=file.read_text(encoding='utf-8')
match=re.search(r'G\.IMAGE_FILES\s*=\s*(\{.*?\});',text,re.S)
files=json.loads(match.group(1))
for row in rows:
    for key in (row['face'],row['halfKey']):files[key]=key+'.webp'
text=text[:match.start(1)]+json.dumps(dict(sorted(files.items())),ensure_ascii=False,indent=2)+text[match.end(1):]
file.write_text(text,encoding='utf-8',newline='\n')
(OUT/'roster.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
# 윗줄 언니·아랫줄 여동생을 각 가족 카드 안에서 직접 비교한다.
sheet=Image.new('RGB',(2200,2000),'#eae6de');draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',23)
small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',19)
for i,p in enumerate(PAIRS):
    x,y=i%5*440,i//5*1000
    draw.text((x+220,y+8),f'{i+1:02d} {p[4]} 자매',font=font,fill='#263744',anchor='mt')
    for rank in range(2):
        row=rows[i*2+rank]; yy=y+48+rank*470
        draw.text((x+220,yy),row['sisterRank']+' · '+row['name'],font=font,fill='#263744',anchor='mt')
        draw.text((x+220,yy+32),row['nameOrigin'],font=small,fill='#596570',anchor='mt')
        with Image.open(ROOT/'images'/ (row['halfKey']+'.webp')) as im:
            im=im.convert('RGBA');im.thumbnail((300,390),Image.Resampling.LANCZOS);sheet.paste(im,(x+20,yy+67),im)
        with Image.open(ROOT/'images'/ (row['face']+'.webp')) as im:
            im=im.convert('RGBA').resize((160,160),Image.Resampling.LANCZOS);sheet.paste(im,(x+265,yy+90),im)
sheet.save(OUT/'sisters-overview.jpg',quality=94)
print('성인 엘프 20명·자매 10쌍·초상 40장 등록')
