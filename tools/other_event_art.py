#!/usr/bin/env python3
"""기존 사건의 누락 그림 제작 명세와 공통 내보내기."""
import json
from pathlib import Path
import history_event_art as export

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/other-event-art-20261028'
SPECS=ROOT/'tools/other_event_art_prompts.json'

PORTRAITS=[
 ('azambuja','디오구 드 아잠부자','elmina','Portuguese expedition commander aged 50, short trimmed grey beard, calm stern eyes, burgundy silk doublet embroidered with gold, gold chain, sheathed sword, holding a shipping ledger.'),
 ('caramansa','카라만사','elmina','Akan coastal ruler aged 42, dark brown skin, dignified broad face, short beard with tiny gold ornaments, white cotton draped over one shoulder, heavy gold chain and gold arm rings. No European crown. Calm guarded gaze.'),
 ('mina_elder','두 마을의 노인','elmina','Elderly Akan man aged 68, dark brown skin, deeply lined slender face, short silver beard and hair, undyed woven white and umber cloth, wooden staff, worried resolute gaze.'),
 ('mina_trader','아칸 상인','elmina','Akan woman merchant aged 38, dark brown skin, braided hair gathered neatly, russet woven wrapper and cream shoulder cloth, modest bead necklace, small brass weighing scales and cloth pouch, shrewd warm eyes.'),
 ('mina_factor','서인도 회사의 상관장','elmina','Dutch West India Company factor in 1637 aged 48, receding brown hair, pointed brown beard, charcoal doublet with plain white falling collar, dark broad brim felt hat, account book, calculating expression.'),
 ('mina_mother','엘미나의 여인','elmina','Adult Akan mother aged 35, dark brown skin, strong tired face, worn ochre and indigo woven dress and head wrap, hands held together at waist, quiet grief and dignity, fully clothed. No wounds, shackles or sensationalism.'),
 ('njinga','은징가','nzinga','Queen Njinga of Ndongo aged 40, dark brown skin, close cropped hair under a small bead and feather circlet, upright wiry athletic build, sharp commanding eyes, red shoulder cloth over securely opaque woven dress, leopard skin mantle, copper and ivory bracelets, ceremonial battle axe held downward. Regal and self possessed.'),
 ('kifunji','키푼지','nzinga','Ndongo noblewoman aged 33, dark brown skin, calm discerning eyes, blue cloth head wrap, indigo and ivory woven dress, bead necklaces, one hand holding a folded secret letter.'),
 ('kambu','캄부','nzinga','Ndongo noblewoman aged 58, dark brown skin, slender weathered face showing years of captivity, Portuguese style muted brown long dress with Ndongo red shoulder cloth, simple wooden rosary in both hands, quiet strength.'),
 ('jcsousa','주앙 코헤이아 드 소우자','nzinga','Portuguese governor in 1622 aged 52, pointed grey beard, narrow haughty eyes, black velvet doublet with white ruff, gold chain, gloved hand resting at waist. No chair in the isolated portrait.'),
 ('fsousa','페르낭 드 소우자','nzinga','Portuguese governor in 1625 aged 50, square face, short dark greying beard, cold eyes, black cape over steel breastplate, map and account folio held against torso.'),
 ('gaeta','안토니우 다 가에타','nzinga','Italian Capuchin friar aged 36, long brown beard, compassionate tired eyes, plain brown hooded robe with rope belt, folded pointed hood behind head, wooden cross and rosary, open reassuring hand.'),
 ('nzinga_wic','네덜란드 회사 사령관','nzinga','Dutch company commander in Angola in 1647 aged 45, sandy moustache and short beard, broad black felt hat with restrained orange band, steel breastplate over dark coat, white falling collar, folded military dispatch.'),
 ('nzinga_imb','임방갈라 전사','nzinga','Adult Imbangala envoy warrior aged 32, dark brown skin, close short hair, lean muscular build, securely wrapped woven umber and red waist and shoulder cloth, modest bead ornaments, spear held vertically within frame, alert disciplined stance. No fantasy costume.'),
 ('salvador_sa','살바도르 코헤이아 드 사','nzinga','Portuguese Brazilian naval commander Salvador Correia de Sa aged 46 in 1648, oval face, black shoulder length hair, fine moustache and pointed beard, dark steel cuirass over burgundy coat, broad dark hat, white falling collar, command baton.'),
 ('kongo_nsaku','은사쿠','kongo','Kongo envoy Nsaku aged 38 in 1483, dark brown skin, lean angular face, high cheekbones, short coiled hair, clean shaven, alert thoughtful dark eyes, cream raffia woven tunic with dark geometric border, copper bracelet, open hand at chest. No cross yet.'),
 ('kongo_soyo','마니 소요','kongo','Lord of Soyo aged 48 in 1483, dark brown skin, broad composed face, short black beard, small woven cap with upright dark feathers, rich ivory and russet raffia cloth, copper neck ring and armlets, carved wooden staff.'),
 ('kongo_nkuwu','은징가 아 은쿠우','kongo','King Nzinga a Nkuwu of Kongo aged 55 in 1491, dark brown skin, stately mature face with short salt and pepper beard, woven raffia skullcap, red and ivory geometric raffia royal robes, leopard mantle, copper arm rings, carved ivory scepter. No European metal crown.'),
 ('kongo_afonso','음벰바 아 은징가','kongo','Kongo prince Mvemba a Nzinga, later Afonso, aged 30 in 1491, dark brown skin, attentive intelligent face, short coiled hair, clean shaven, cream and muted blue geometric raffia tunic, small wooden cross, holding a small closed prayer book respectfully.'),
 ('kongo_priest','콩고 사절단의 사제','kongo','Portuguese mission priest aged 53 in 1491, grey tonsured hair, short grey beard, kindly serious face, plain ivory surplice over dark long cassock, narrow stole, small wooden cross and simple metal baptism vessel. Modest early Renaissance attire.'),
 ('kongo_leonor','레오노르 왕비','kongo','Kongo queen Leonor aged 45 in 1491, dark brown skin, dignified warm face, coiled braids beneath small ivory raffia cap, cream and red patterned woven royal dress, copper bead necklaces and bracelets, hands lightly joined, no European tiara.'),
 ('narvaez','판필로 데 나르바에스','aztec','Spanish conquistador Panfilo de Narvaez aged 42 in 1520, burly imposing build, red beard, forceful eyes, polished early sixteenth century steel breastplate over deep red doublet, low steel helmet held beside waist, both eyes intact.'),
 ('alvarado','페드로 데 알바라도','aztec','Spanish conquistador Pedro de Alvarado aged 35 in 1520, golden blond hair and short blond beard, angular handsome face, impatient confident gaze, early sixteenth century steel cuirass, elaborate feathered open helmet, red sash, sheathed sword.'),
 ('bernal','베르날 디아스 델 카스티요','aztec','Spanish soldier Bernal Diaz del Castillo aged 24 in 1520, lean sunburned face, short dark hair, sparse dark stubble, watchful curious eyes, worn quilted cotton armor over plain brown clothes, simple leather belt, holding a small notebook. Ordinary soldier, no noble jewelry.'),
 ('mowgli_ape','늙은 오랑우탄','junglebook','A single elderly male orangutan, biologically believable rusty orange fur, grey wisps around a dark leathery expressive face, wide cheek pads, intelligent patient eyes. Sitting upright naturally, whole head, torso, long hands and bent knees fully visible, one hand holding a banana low. Warm humorous wise presence, no clothing, no crown, no movie design. Animal character portrait, no human face.'),
]

SCENES=[
 ('mina_stones','리스본의 다듬은 돌',['azambuja','colombo','dias'],'Lisbon quay, December 1481. Number-marked dressed stone blocks and lime sacks being loaded onto caravels by masons. Commander Azambuja holds a shipping ledger, Columbus examines a block, Dias calls from a cargo vessel. Busy serious preparation, Tagus water beyond.'),
 ('mina_meeting','카라만사의 대답',['azambuja','caramansa'],'Gold Coast beach, January 1482. Caramansa beneath a broad woven ceremonial parasol faces Azambuja in gold embroidered silk, equal visual stature. Akan attendants carry ivory horns, Portuguese sailors stand farther back beside bundles of cloth and brass basins. Tense diplomatic discussion under a coastal tree, village and anchored caravels beyond.'),
 ('mina_rock','신성한 바위',['azambuja','mina_elder'],'Gold Coast rocky promontory, 1482. A large sacred black rock newly split by a mason chisel. Akan elder raises an open hand to stop the workers, Azambuja turns with a guarded look; anxious villagers approach with lowered staffs. Unopened gift bundles by a boat. Moment before violence, no wounds, no active fighting.'),
 ('mina_walls','스무 날의 성벽',['azambuja','dias','colombo'],'Elmina coast, February 1482. Newly assembled low white stone fort and square keep, workers fitting numbered stone blocks on timber scaffold. Azambuja and Dias stand by stacked stones; Columbus makes a note on a chart. Ocean, canoes and caravels, glowing afternoon, only early construction not later huge mature castle.'),
 ('mina_king','미나의 첫 금',['azambuja','pt_king'],'Lisbon royal chamber, 1482. Joao II in black and gold fur trimmed robes receives a modest wooden tray of gold dust and small nuggets brought from Elmina. Azambuja bows slightly beside a maritime chart. Side window shows Tagus caravels, quiet triumphant but restrained mood.'),
 ('mina_door','돌아오지 않는 문',['mina_mother','mina_factor'],'Elmina fort, 1637, somber critical historical narrative. African mother in worn ochre and indigo cloth stands in foreground and looks toward a low stone sea gate where an anchored transport waits. Other fully clothed captives in the shaded corridor, a Dutch factor holding ledger far to one side. Dignified eye level view, sorrow and coercion conveyed through expressions, no gore, no exposed bodies, no glamorization.'),
 ('nzinga_chair','앉을 자리 없는 방',['njinga','jcsousa'],'Luanda governor audience room, 1622. Queen Njinga in red cloth and small feather circlet sits upright on the strong bent back of her fully clothed kneeling adult attendant, matching the seated governor eye level. Governor in black and white ruff seated in velvet chair opposite. Deliberate political confrontation, eye level wide view, unused cushion on floor, no comedy or humiliation framing.'),
 ('nzinga_kifunji','키푼지의 부탁',['kifunji','nzinga_imb'],'Luanda shaded alley near harbor, 1625. Blue head wrapped Kifunji discreetly passes a folded letter toward an anonymous sea captain seen from behind. Imbangala envoy in merchant cloth keeps watch beside ivory bundles. Portuguese fort in distant heat, urgent private negotiation.'),
 ('nzinga_kilombo','마탐바의 킬롬보',['njinga','nzinga_imb'],'Matamba fortified woodland camp in the 1630s. Queen Njinga with modest natural age lines from her reference offers a ceremonial battle axe handle first to an anonymous visiting captain. Disciplined Imbangala warriors, timber palisade and cooking smoke among green hills. Mutual oath of friendship, no blood.'),
 ('nzinga_kombi','콤비로 가는 길',['njinga','nzinga_wic','nzinga_imb'],'Angola river harbor in 1647. Njinga now visibly in her sixties, same face identity with grey hair and natural wrinkles, stands with Imbangala envoy and Dutch commander as allied soldiers embark in canoes carrying muskets. Orange white blue Dutch flag above distant fort, humid morning, resolve before battle, no violence.'),
 ('nzinga_kambu','캄부의 몸값',['kambu','gaeta'],'Luanda governor courtyard, 1656. Thin Kambu in brown Portuguese dress with red Ndongo cloth clasps her worn rosary. Brown robed Capuchin Gaeta mediates with a Portuguese clerk across a table bearing coin pouches and a sealed agreement. Hope of release after long captivity, respectful dignified faces, no shackles.'),
 ('kongo_call','적도 너머의 큰 강',['pt_king','cao'],'Lisbon palace, 1482. King Joao II and navigator Diogo Cao bend over an African coastal chart; a small stone padrao model with carved Portuguese arms and cross stands on the table. Two caravels visible on Tagus through an arched window, morning departure light.'),
 ('kongo_padrao','상 조르즈의 돌기둥',['cao','kongo_soyo','kongo_nsaku'],'Congo River estuary, 1483. Mud brown freshwater streams fan visibly into blue ocean carrying floating grasses. On the southern headland Diogo Cao stands beside a newly erected limestone padrao topped with a cross, while the feather capped lord of Soyo and Nsaku gesture inland. Two caravels anchored beyond, exploratory meeting without triumphalist posing.'),
 ('kongo_lisbon1','리스본의 손님',['pt_king','kongo_nsaku'],'Lisbon royal audience, 1483. Joao II welcomes four adult Kongo guests in simple dignified Portuguese silk garments. Oldest guest Nsaku, SAME angular face and short hair as reference, wearing cream silk rather than raffia, looks toward a church visible through a side window. Warm cautious hospitality, no restraints.'),
 ('kongo_return','돌아온 아들들',['kongo_nsaku','kongo_soyo'],'Kongo coast, 1485. Nsaku in cream travel worn Portuguese silk steps from a small landing boat, greeted with an embrace by his joyful elderly mother. Three returning companions and local people carrying drums and ivory horns, lord of Soyo beside the shore. Emotional reunion, wooden huts, palm trees, ship beyond.'),
 ('kongo_lisbon2','세례를 받은 사절',['pt_king','kongo_nsaku_envoy','kongo_priest'],'Lisbon palace, late 1490. Joao II speaks with Nsaku now called Joao da Silva in black velvet with a gold cross, same recognizable face as the reference. Priest and friars, masons and carpenters prepare hand tools, a small bell and church supplies for a voyage. Purposeful diplomatic departure.'),
 ('kongo_baptism','음반자 콩고의 세례',['kongo_nkuwu','kongo_priest','kongo_leonor','kongo_afonso'],'Mbanza Kongo hilltop, 1491. In front of an unfinished modest stone chapel with open roof rafters, the Portuguese priest gently pours baptism water onto the bowed forehead of King Nzinga a Nkuwu, beside a leopard skin covered dais. Queen Leonor and prince Mvemba with a prayer book look on, many Kongo townspeople beyond. Royal cap removed for water, same face and royal fabrics. No vast European baroque cathedral.'),
 ('kongo_students','산투 엘로이로 가는 아이들',[],'Lisbon stone street, 1491. A dozen Kongo students, older teenagers and young adults fully clothed in modest woven tunics and Portuguese travel cloaks, walk toward the Santo Eloi monastery with a kind friar. Curious faces looking at arches, tiled roofs and church bells, books and bundles in hands, morning light. No restraints.'),
 ('mowgli_bananas','바나나 도둑들',['mowgli','mowgli_ape'],'Fictional central Indian jungle adventure. A laughing adult Mowgli in ragged ochre and umber cloth swings down on a vine to snatch a banana bunch while five realistic rusty orange orangutans raid expedition fruit baskets. The elderly wide cheeked orangutan catches his wrist gently. Playful scramble, green banyan canopy, no costumes on animals.'),
 ('mowgli_riddle','오랑우탄의 수수께끼',['mowgli','mowgli_ape'],'Fictional Indian jungle clearing beneath banyan roots. Wise elderly orangutan sits naturally and raises one long finger while posing a riddle, adult Mowgli crouches nearby with hands in his tousled black hair, brow furrowed comically in thought. A few bananas on the ground and two curious apes in branches. Mowgli face clean shaven, same person as reference.'),
 ('mowgli_human','사람의 모습',['mowgli','mowgli_ape'],'Fictional Indian jungle edge. Adult Mowgli, same smiling clean shaven face and umber ochre cloth as reference, shyly holds out a banana bunch to a fully clothed adult woman explorer seen mainly from behind in practical earth toned traveling cloak. Wise elderly orangutan smiles in background, warm human connection and soft jungle sunlight. No romance stereotype, no extra identifiable game character.'),
]

def build_specs():
    assets=[]
    # 원화의 자연스러운 무릎 바로 아래를 자르는 좌표. 몸을 압축하거나 얼굴만 확대하지 않는다.
    knee_bottom={'azambuja':.68,'caramansa':.68,'mina_elder':.68,'mina_trader':.79,
      'mina_factor':.68,'mina_mother':.81,'njinga':1,'kifunji':.82,'kambu':.82,
      'jcsousa':.68,'fsousa':.68,'gaeta':.68,'nzinga_wic':.68,'nzinga_imb':.68,
      'salvador_sa':.68,'kongo_nsaku':.68,'kongo_soyo':.68,'kongo_nkuwu':.68,
      'kongo_afonso':.68,'kongo_priest':.68,'kongo_leonor':.82,'narvaez':.68,
      'alvarado':.68,'bernal':.68}
    for ident,name,group,subject in PORTRAITS:
        prompt=('Use case: stylized-concept. Create one production character portrait for a historical ocean adventure RPG. '+subject+
          ' Semi realistic hand painted digital oil illustration, coherent with detailed Renaissance adventure game portraits, softly modeled face planes, restrained brush texture, warm key light, neutral subtle rim light. '
          'One isolated character, vertical 2:3 composition, head through both complete knees, entire headgear and both hands safely inside frame with generous clear margins. Natural adult anatomy, normal head to body ratio, long enough torso and thighs, no chibi, no shortened thick legs. Three quarter standing pose unless subject explicitly seated, face angled only slightly so both eyes remain readable. '
          'Genuinely transparent background with clean alpha edges, no painted backdrop, ground shadow, scenery, text, labels, logo, watermark, frame, collage or second figure. 1024x1536.')
        asset=dict(id=ident,name=name,group=group,type='portrait',subject=subject,prompt=prompt,transparent_background=True)
        if ident in knee_bottom:
            asset['crop']=[.08,0,.94,knee_bottom[ident]]
        if ident=='mowgli_ape':
            asset['crop']=[0,0,1,.80]
            asset['face_crop']=[.19,0,.81,.4133]
        assets.append(asset)
    # 같은 은사쿠의 외교 사절 복식. 새 얼굴을 만들지 않고 앞서 생성한 원화를 참조한다.
    assets.append(dict(id='kongo_nsaku_envoy',name='주앙 다 실바 (은사쿠)',group='kongo',type='portrait',people=['kongo_nsaku'],transparent_background=True,crop=[.08,0,.94,.68],
      prompt='Use case: identity-preserve. Create the later diplomatic outfit of the SAME Kongo man Nsaku in the reference. Preserve his exact angular face, eyes, nose, skin, short coiled hair, clean shaven appearance, natural slender body proportions and standing posture. Only change clothes to a modest black late fifteenth century Portuguese velvet doublet, long black coat, dark hose, small gold cross pendant, a sealed letter in hand. He is now envoy Joao da Silva in 1490, about seven years older with subtle maturity. Semi realistic hand painted adventure game portrait. Single isolated head through complete knees, hands and head safely in frame, 1024x1536 genuinely transparent background, no scenery, text, frame, extra people.'))
    for ident,name,people,subject in SCENES:
        assets.append(dict(id=ident,name=name,type='scene',people=people,subject=subject,transparent_background=False,
          prompt='Use case: historical-scene. Create one panoramic event illustration for a historical ocean adventure RPG. '+subject+
          ' Use attached character references only for the corresponding people identity, facial proportions, skin, clothing and painterly rendering; stage them naturally in this new scene, do not paste portrait cutouts. Clearly distinguish every different face. Semi realistic hand painted digital oil illustration, restrained cinematic lighting, rich tactile materials, atmospheric depth. Wide 2.25:1 composition, main faces and important actions in central 75 percent with room at top and bottom for crop, readable medium distance, complete composition without interface. No text, captions, letters readable on documents, watermark, logo, border or collage. Do not use any existing movie character designs.'))
    revised=ROOT/'tools/other_event_women_revision_prompts.json'
    if revised.exists():
        women={a['id']:a for a in json.loads(revised.read_text(encoding='utf-8'))['assets']}
        for asset in assets:
            if asset['type']=='portrait' and asset['id'] in women:
                asset['prompt']=women[asset['id']]['prompt']
                asset['crop']=[0,0,1,1]  # 수정 원화 자체가 무릎단에서 끝난다.
                asset['revision']='사용자 얼굴 참고 · 젊은 성인 · 무릎단'
    painted=ROOT/'tools/other_event_painted_revision_prompts.json'
    if painted.exists():
        revised={a['id']:a for a in json.loads(painted.read_text(encoding='utf-8'))['assets']}
        for asset in assets:
            if asset['type']=='portrait' and asset['id'] in revised:
                asset['prompt']=revised[asset['id']]['prompt']
                asset['crop']=[0,0,1,1]
                asset['revision']='실사 질감 제거 · 게임용 붓질 · 무릎단'
    SPECS.write_text(json.dumps(dict(mode='built-in image_gen',date='2026-10-28',assets=assets),ensure_ascii=False,indent=2),encoding='utf-8')
    OUT.mkdir(parents=True,exist_ok=True)
    print(json.dumps({'portrait_pairs':sum(a['type']=='portrait' for a in assets),'scenes':sum(a['type']=='scene' for a in assets)}))

if __name__=='__main__':
    import sys
    if '--specs' in sys.argv: build_specs()
    else:
        export.OUT=OUT; export.SPECS=SPECS
        export.materialize(); export.preview()
        print('원화 내보내기 완료')
