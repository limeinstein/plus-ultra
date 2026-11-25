#!/usr/bin/env python3
"""전달받은 발견물 원고를 기존 ID·배역과 연결한다. 네트워크와 실행 중 파일 읽기는 쓰지 않는다."""
from pathlib import Path
import json,re,hashlib
ROOT=Path(__file__).resolve().parents[1];META=ROOT/'tools/discovery_stories_20261123';DOC=ROOT/'docs/discovery-stories-20261123'
MAPPING=json.loads((META/'mapping.json').read_text(encoding='utf-8'));ACTORS=json.loads((META/'actors.json').read_text(encoding='utf-8'))
ROLES=['부관','노장','학자','열혈','해적','도적','헬창','베테랑','군인','장군','어린애','허풍','구두쇠','예술가','선교사','기술자','인어','아이돌','남장','츤데레','왕녀','백설','잠공','영애','신데렐라','살림꾼','당찬','귀여운','유혹녀','여전사','엉뚱녀','똑순이','불만']
ALIASES={'해적 출신':'해적','공주':'왕녀','여자 동료':'살림꾼','잠든 공주':'잠공','무도회 공주':'신데렐라','인어공주':'인어'}
NUM={str(x['no']).zfill(3):x['id'] for x in MAPPING};NUM.update(dict(zip(['A'+str(i) for i in range(1,8)],['genghis','manatee','maelstrom','monalisa','goree','t_pepper','everest'])));NUM.update(dict(zip(['B'+str(i) for i in range(1,8)],['giza','kings','knossos','petra','qinshi','chichen','moai'])))
data={};report={'manuscripts':{},'scenarios':0,'arcs':0,'lines':0,'choruses':0,'relations':0,'family':0,'returns':0,'husbands':0,'jina':0}
def text(p):return p.read_text(encoding='utf-8-sig').replace('\r\n','\n')
def clean(t):return re.sub(r'\*\*|`','',t).strip()
def role(t):return ALIASES.get(clean(t),clean(t))
def lines(t,who):
 out=[]
 t=re.sub(r'([^/\s])\s+(견우|직녀|유비|관우|장비|제갈량|지나|부관|제독):',r'\1 / \2:',t)
 for part in re.split(r'\s+/\s+',t):
  part=clean(part.removeprefix('- '));part=re.sub(r'^\[지문\]\s*','— ',part)
  if not part:continue
  if part.startswith('—'):out.append(['*',part.lstrip('— ').strip()]);continue
  m=re.match(r'([^:：]{1,50})[:：]\s*(.*)',part)
  if m and (role(m[1]) in ROLES+['제독','갑판장'] or re.sub(r'[^0-9a-z가-힣]','',m[1].lower()) in ACTORS or m[1]==who):out.append([role(m[1]),m[2]])
  else:out.append([role(who),part])
 return out
def entry(ident):return data.setdefault(ident,{'scenarios':[],'related':[]})
def put(ident,rec):
 assert rec.get('base') and rec.get('recall'),(ident,rec)
 entry(ident)['scenarios'].append(rec);report['scenarios']+=1;report['arcs']+=len(rec['arcs']);report['lines']+=sum(len(a['lines']) for a in rec['arcs'])
def parse_body(ident,key,body,choral=False,revisit=False):
 base=re.search(r'^바탕: (.+)',body,re.M)[1];rec={'key':key,'base':re.sub(r' \(사용자가.*?\)','',base),'arcs':[],'recall':''};current=None
 if revisit:rec['revisit']=True;rec['requiresChorus']=True
 for line in body.splitlines():
  h=re.match(r'^\*\*([^*]+)\*\*\s*·\s*(.*)',line)
  inline=re.match(r'^- \*\*([^*]+)\*\*\s*\(([^)]+)\)[:：]\s*(.*)',line)
  if h:
   current={'role':role(h[1]),'tag':h[2].replace(' ',''),'lines':[]};rec['arcs'].append(current)
  elif inline:
   current=None;rec['arcs'].append({'role':role(inline[1]),'tag':inline[2].replace(' ',''),'lines':lines(inline[3],inline[1])})
  elif re.match(r'^- 관계 인물 · ',line):
   if not choral:
    z=re.match(r'^- 관계 인물 · (.+?)[:：]\s*(.*)',line);assert z,line
    actor=re.sub(r'\([^)]*\)','',z[1]).strip();entry(ident)['related'].append({'key':rec['key']+':inline:'+actor,'priority':1,'actors':[a.strip() for a in actor.split(' · ')],'lines':lines(z[2],actor),'rec':key})
  elif re.match(r'^- 가족 · ',line):
   z=re.match(r'^- 가족 · ([^:]+):\s*(.*)',line);assert z,line;rec['family']={'kind':z[1].strip(),'text':z[2]}
  elif line.startswith('- 부관:') and current is None:
   rec['adj']=lines(line[2:],'부관');current=None
  elif line.startswith('- 갑판장:'):
   a=line[2:].split(' / 회상: ');rec['deck']=lines(a[0],'갑판장');current=None
   if len(a)>1:rec['recall']=a[1]
  elif re.match(r'^-?\s*회상:',line):rec['recall']=re.sub(r'^-?\s*회상:\s*','',line);current=None
  elif line.startswith('- ') and current:current['lines'].extend(lines(line[2:],current['role']))
 if choral:
  rec['chorus']=body;rec['arcs']=[]
 assert all(a['role'] in ROLES and a['lines'] for a in rec['arcs']),(key,rec['arcs'])
 return rec
for row in MAPPING:
 p=DOC/row['source'];raw=text(p);m=re.search(r'^### '+str(row['no']).zfill(3)+r'\. [^\n]+\n([\s\S]*?)(?=^### |\Z)',raw,re.M);assert m,row
 put(row['id'],parse_body(row['id'],str(row['no']).zfill(3),m[1],601<=row['no']<=625 or 901<=row['no']<=925))
for vol in [46,47]:
 p=next(DOC.glob(str(vol)+'권_*.md'))
 for m in re.finditer(r'^### (\d{3})\. [^\n]+\n([\s\S]*?)(?=^### |\Z)',text(p),re.M):
  ident=NUM[m[1]];put(ident,parse_body(ident,'R'+m[1],m[2],revisit=True));report['returns']+=1
# 1·2권은 최신 625본과 겹치더라도 장면을 덮지 않고 별도 갈래로 보존한다.
for vol in [1,2]:
 p=next(DOC.glob('*시나리오_'+str(vol)+'권*.md'));raw=text(p)
 for m in re.finditer(r'^### 3-([1-7])\. [^\n]+\n([\s\S]*?)(?=^### 3-|\Z)',raw,re.M):
  key=('A' if vol==1 else 'B')+m[1];body=m[2];base=re.search(r'^`\[바탕\]` (.+)',body,re.M)[1];rec={'key':key,'base':base,'arcs':[]};current=None
  for line in body.splitlines():
   h=re.match(r'^\*\*(?:[가-힣]\. )?(.+?) — .+? \((.+?)\)\*\*',line)
   if h:current={'role':role(h[1]),'tag':h[2].replace(' ',''),'lines':[]};rec['arcs'].append(current)
   elif line=='**기본 (갑판장)**':current={'role':'갑판장','tag':'기본','lines':[]};rec['deck']=current['lines']
   elif line.startswith('`[회상]`'):rec['recall']=re.sub(r'^`\[회상\]`\s*\*\*제독\*\*:\s*','',line);current=None
   elif line.startswith('- ') and current:current['lines'].extend(lines(line[2:],current['role']))
  assert len(rec['arcs'])== (7 if vol==1 else 6),(key,len(rec['arcs']))
  put(NUM[key],rec)
# 원고 보충: 부관과 가족은 대상별이며, 다른 발견에 빌려 쓰지 않는다.
for file,kind in [('16_보충_부관_314.md','adj'),('17_보충_가족_314.md','family')]:
 for line in text(DOC/file).splitlines():
  z=re.match(r'^- (A[1-7]|B[1-7]|\d{3}) (.+)',line)
  if not z:continue
  ident=NUM[z[1]];rec=next(x for x in entry(ident)['scenarios'] if x['key']==z[1])
  if kind=='adj':rec['adj']=lines(z[2].split(' — ',1)[1],'부관')
  else:
   q=re.search(r' · ([^:]+):\s*(.*)',z[2]);assert q,line;rec['family']={'kind':q[1].strip(),'text':q[2]}
# 최신 1·2권 정리: 대응 네 갈래와 나중 갈래, 첫 부관 장면을 구별한다.
primary={
 'A1':'노장 열혈 왕녀 해적','A2':'학자 열혈 왕녀 살림꾼','A3':'노장 학자 해적 살림꾼','A4':'학자 열혈 왕녀 해적','A5':'노장 열혈 해적 살림꾼','A6':'노장 학자 왕녀 살림꾼','A7':'열혈 왕녀 해적 살림꾼',
 'B1':'열혈 잠공 유혹녀 노장','B2':'여전사 똑순이 백설 영애','B3':'신데렐라 엉뚱녀 당찬 왕녀','B4':'노장 귀여운 해적 여전사','B5':'여전사 똑순이 신데렐라 엉뚱녀','B6':'당찬 백설 영애 유혹녀','B7':'살림꾼 귀여운 열혈 왕녀'}
for key,roles in primary.items():
 rec=next(r for r in entry(NUM[key])['scenarios'] if r['key']==key);arcs=[]
 for a in rec['arcs']:
  if a['role']=='부관':rec['adjFirst']=a['lines'];continue
  if a['role'] not in roles.split():a['afterPrimary']=True
  arcs.append(a)
 rec['arcs']=arcs;assert len([a for a in arcs if not a.get('afterPrimary')])==4,key
for m in re.finditer(r'^\*\*(A[1-7]) [^\n]+\n([\s\S]*?)(?=^\*\*A|^## |\Z)',text(DOC/'01_02_정리_1권2권_대응4.md'),re.M):
 rec=next(r for r in entry(NUM[m[1]])['scenarios'] if r['key']==m[1]);rec['deck']=sum((lines(l[2:],'갑판장') for l in m[2].splitlines() if l.startswith('- ')),[]);assert len(rec['deck'])==3,m[1]
for file in ['18_보충_모자란배역_당찬.md','31_보충_당찬남장_301-600.md']:
 for line in text(DOC/file).splitlines():
  z=re.match(r'^- \*\*(\d{3})[^*]* · (당찬|남장)\*\* \(([^)]+)\) — (.*)',line)
  if z:
   rec=next(x for x in entry(NUM[z[1]])['scenarios'] if x['key']==z[1]);rec['arcs'].append({'role':z[2],'tag':z[3],'lines':lines(z[4],z[2]),'extra':True});report['arcs']+=1
# 관계 인물의 여러 이름·대사는 각각 실제 승선 인물로 해석한다.
raw=text(DOC/'15_보충_관계인물_라이벌동료.md');section=0;block=None
for line in raw.splitlines():
 h=re.match(r'^## (\d+)\.',line)
 if h:section=int(h[1]);block=None
 h=re.match(r'^\*\*([^*]+)\*\*',line)
 if h:
  refs=re.findall(r'\b(?:\d{3}|[AB][1-7])\b',h[1]);refs=[k for k in refs if k in NUM];block={'actors':[],'lines':[],'priority':2 if section in [1,2] else 1,'refs':refs,'key':'rel:'+str(section)+':'+h[1]}
  if '등 산과' in h[1]:block=None;continue
  for k in refs:entry(NUM[k])['related'].append(block)
 elif re.match(r'^- [^(]+\(\d{3}\):',line):
  q=re.match(r'^- ([^(]+)\((\d{3})\): ([^:]+): (.*)',line);assert q,line
  entry(NUM[q[2]])['related'].append({'key':'region:'+q[2]+':'+q[3],'actors':[q[3]],'lines':lines(q[3]+': '+q[4],q[3]),'priority':2})
 elif block and line.startswith('- '):
  parsed=lines(line[2:],'*');block['lines'].extend(parsed)
  for who,_ in parsed:
   if who not in ['*','제독'] and who not in block['actors']:block['actors'].append(who)
 elif line.startswith('| ') and section>=5 and not re.match(r'\| (동료|인물|---)',line):
  cols=[c.strip() for c in line.strip('|').split('|')]
  if len(cols)<3 or cols[2]=='—':continue
  actor,refs,t=cols[:3];actor=re.sub(r'\s*\([^)]*\)','',actor);numbers=re.findall(r'\b\d{3}\b',refs)
  for term,k in [('희망봉','401'),('마젤란 해협','403'),('혼곶','402'),('아마존 하구','608'),('귀환 항로','624'),('모나리자','A4')]:
   if term in refs:numbers.append(k)
  b={'key':'table:'+actor+':'+refs,'priority':3 if section==7 else 1,'actors':[a.strip() for a in actor.split(' · ')],'lines':lines(t,actor)}
  for k in numbers:
   if k in NUM:entry(NUM[k])['related'].append(b)
# 합창은 기존 발견 17곳과 새 지리 발견 25곳 모두 같은 문법으로 묶는다.
def chorus(body):
 out={'cast':[]}
 for l in body.splitlines():
  if not l.startswith('- '):continue
  l=l[2:]
  for label,k in [('고난 지문','hardship'),('합창 지문','close'),('회상','recall'),('제독','admiral')]:
   if l.startswith(label+':'):out[k]=l.split(':',1)[1].strip();break
  else:
   m=re.match(r'(?:관계 인물 · )?(.+?)\s*\(([^)]+)\):\s*(.*)',l)
   if m:
    actor=role(m[1].strip());out['cast'].append({'actor':actor,'tag':m[2],'text':m[3],'named':l.startswith('관계 인물 · ') or actor not in ROLES+['망대 선원'],'local':'그 자리' in m[2]})
 assert all(out.get(k) for k in ['hardship','close','admiral','recall']),out
 assert any(c['actor']=='망대 선원' for c in out['cast']),out
 return out
for ident,e in data.items():
 for rec in e['scenarios']:
  if isinstance(rec.get('chorus'),str):rec['chorus']=chorus(rec['chorus']);report['choruses']+=1
for m in re.finditer(r'^### (\d{3})\. [^\n]+\n([\s\S]*?)(?=^### |\Z)',text(DOC/'33_보충_합창_기존지리발견.md'),re.M):
 rec=next(x for x in entry(NUM[m[1]])['scenarios'] if x['key']==m[1]);rec['chorus']=chorus(m[2]);report['choruses']+=1
# 여성 제독에게 들려줄 남편 줄. 다시 온 장면은 첫 발견의 줄과 구별한다.
for l in text(DOC/'48_보충_남편_135.md').splitlines():
 m=re.match(r'^- (A[1-7]|B[1-7]|\d{3}) (.+?) · 남편: (.*)',l)
 if not m:continue
 key=('R' if '(다시 옴)' in m[2] else '')+m[1];rec=next(r for r in entry(NUM[m[1]])['scenarios'] if r['key']==key)
 assert rec.get('family',{}).get('kind')=='아내',(key,rec.get('family'));rec['family']['husband']=m[3];report['husbands']+=1
assert report['husbands']==135,report['husbands']
assert not [(r['key'],ident) for ident,e in data.items() for r in e['scenarios'] if r.get('family',{}).get('kind')=='아내' and not r['family'].get('husband')]
# 지나의 기존 동료 ID만 쓴다. 마대인·왕서방은 지나의 말 속 인물이다.
jinaMeet=None
for m in re.finditer(r'^\*\*([^*]+)\*\*[^\n]*\n([\s\S]*?)(?=^\*\*|^## |\Z)',text(DOC/'49_보충_지나_마대인의딸.md'),re.M):
 head,body=m[1],m[2];rawlines=sum((lines(l[2:],'지나') for l in body.splitlines() if l.startswith('- ')),[])
 if not rawlines:continue
 if '아닌 곳' in head:
  jinaMeet={'except':[NUM[n] for n in ['062','063','908','909']],'text':rawlines[0][1]};report['jina']+=1;continue
 no=re.match(r'\d{3}',head)[0]
 for ln in rawlines:
  cond=re.match(r'^\((.+?)(?:가|이) 있으면\)\s*(.*)',ln[1])
  if cond:ln[1]=cond[2];ln.append(cond[1])
 entry(NUM[no])['related'].append({'key':'jina:'+no,'priority':1,'actors':['지나'],'lines':rawlines,'onReturn':True});report['jina']+=1
 if no in ['908','909']:
  rec=next(r for r in entry(NUM[no])['scenarios'] if r['key']==no);rec['chorus']['consumes']=[{'actor':'지나','key':'jina:'+no}]
assert report['jina']==58 and jinaMeet,report['jina']
for ident,e in data.items():
 for rec in e['scenarios']:
  assert rec.get('arcs') or rec.get('chorus'),ident
  assert all(a['role'] in ROLES for a in rec['arcs']),ident
  for a in rec['arcs']:a['key']=rec['key']+':'+a['role']+(':extra' if a.get('extra') else '')
  if rec.get('family'):report['family']+=1
 for rel in e['related']:
  rel.pop('refs',None);assert rel['lines'],rel;report['relations']+=1
for p in DOC.glob('*.md'):report['manuscripts'][p.name]=hashlib.sha256(p.read_bytes()).hexdigest()
report.update(discoveries=len(data),newDiscoveries=sum(x['new'] for x in MAPPING),roles=ROLES)
report['arcs']=sum(len(r['arcs']) for e in data.values() for r in e['scenarios'])
report['lines']=sum(len(a['lines']) for e in data.values() for r in e['scenarios'] for a in r['arcs'])
new=[x['definition'] for x in MAPPING if x['new']]
payload={'stories':data,'actors':ACTORS,'new':new,'roles':ROLES,'jinaMeet':jinaMeet,'counts':{k:v for k,v in report.items() if isinstance(v,int)}}
runtime="""/* 발견물 이야기 원고에서 생성. tools/compile_discovery_stories.py로 다시 만든다. */
(function (G) {
  'use strict';
  var P = __PAYLOAD__;
  G.DISC_STORIES = P.stories; G.DISC_STORY_ACTORS = P.actors; G.DISC_STORY_ROLES = P.roles; G.DISC_STORY_COUNTS = P.counts;
  G.DISC_STORY_JINA_MEET = P.jinaMeet;
  G.BALANCE.discStory = { deputyChance: 0.2, recent: 3, chorusMax: 8, hardshipMax: 2, revisitRadius: 2.4, familyPerVisit: 3, equinox: { months: [3,9], day: 21, range: 7 } };
  G.DISC_STORY_NEW = [];
  P.new.forEach(function (d) {
    if (G.DISC[d.id]) throw new Error('발견물 ID 중복: ' + d.id);
    d.idx = G.DISCOVERIES.length;
    G.DISC_NAMES[d.id] = { clue: d.desc.split(/[.!?]/)[0] + '의 소문' };
    if (G.discClueInstall) G.discClueInstall(d);
    G.DISCOVERIES.push(d); G.DISC[d.id] = d; G.DISC_STORY_NEW.push(d.id);
  });

  // 뒤늦게 등록된 식물도 기존 유물과 같은 등록·획득 규칙을 쓴다.
  (G.PLANT_RELICS || []).forEach(function (a) {
    if (G.DISC_STORY_NEW.indexOf(a[0]) < 0) return;
    var ex = { rid: a[1] };
    if (a[6]) for (var k in a[6]) ex[k] = a[6][k];
    G.registerDiscoveryRelic(a[0], a[2], a[3], a[4], a[5], ex);
  });
})(window.G = window.G || {});
""".replace('__PAYLOAD__',json.dumps(payload,ensure_ascii=False,separators=(',',':')))
(ROOT/'js/data/discstories_20261123.js').write_text(runtime,encoding='utf-8',newline='\n')
(META/'compile-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in report.items() if isinstance(v,int)},ensure_ascii=False))
if __name__=='__main__':pass
