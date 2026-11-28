"""내장 ImageGen용 장면별 제작 지시문. API 호출은 하지 않는다."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = 'Use case: historical-scene. ONE single full-bleed ultrawide 9:4 narrative event painting for a historical Age of Sail RPG, 1500-1700. Rich hand-painted semi-realistic game illustration, painted fabric and natural materials, atmospheric layered depth, believable anatomy, hands and emotions, main action within central 80 percent. No text, captions, watermark, UI, collage, grid, panels, modern objects. '
FEMALE = 'The PLAYER protagonist is an ADULT FEMALE CAPTAIN in a navy coat and cream linen blouse, her partner is an ADULT MALE husband or lover in period linen and wool. Show the woman as the captain and mother, the man as her supporting partner. Faces turned away or softly obscured so it works with all player portraits. '
SCENES = [
('01_ship_sunset_touch', 'Sunset on wooden ship: female captain and husband seen from behind at the railing, their hands overlap gently.'),
('02_ship_moonlit_cloak', 'Moonlit ship deck: female captain opens her large cloak to share its warmth with her husband, backs to viewer, silver sea.'),
('03_ship_shared_chart', 'Captain cabin: female captain and husband side by side plotting a route on a parchment chart with dividers.'),
('04_ship_rain_shelter', 'Ship deck in a sudden shower: female captain and her male lover run hand in hand under one cloak, joyful rain.'),
('05_ship_dawn_cups', 'Dawn beside the ship wheel: husband brings two steaming earthenware cups to the female captain on watch.'),
('06_tavern_toast', 'Quiet candlelit tavern table: female captain and her male lover toast each other with pewter cups.'),
('07_tavern_dance', 'Intimate period wedding celebration in a harbor tavern: female captain bride and her male partner dance beside a hearth, crew clapping.'),
('08_tavern_secret_note', 'Quiet harbor tavern: female captain receives a small folded love note under the table from her adult male sailor lover.'),
('09_tavern_fireplace_cloak', 'Harbor tavern hearth: female captain and husband dry wet cloaks and warm their hands beside the fire.'),
('10_tavern_shared_meal', 'Harbor tavern: female captain and her male lover share a bowl of stew and break bread together at a small wooden table.'),
('11_return_doorway', 'Returning home: travel-worn female captain reaches across an open doorway to take her husbands welcoming hands.'),
('12_return_dock_embrace', 'Dawn harbor: female captain and husband embrace on the dock after a long voyage, distant ship and lanterns. Natural unambiguous arms.'),
('13_return_unpack_gifts', 'Homecoming: female captain and husband open a sea chest of small voyage gifts as children gather with delight.'),
('14_return_waiting_lamp', 'Rainy homecoming: husband holds a lamp inside a cottage window as female captain approaches outside through rain.'),
('15_return_remove_cloak', 'Homecoming: husband tenderly helps female captain remove her heavy wet traveling cloak in the cottage entry.'),
('16_pregnancy_news_tokens', 'Pregnancy news: female captain rests her own hand on her barely showing abdomen and offers tiny baby shoes beside her compass to her delighted husband.'),
('17_pregnancy_quiet_touch', 'Pregnant FEMALE captain seated by a cabin window, her visibly pregnant clothed belly cradled by her own hands and her husbands hand, gentle daylight.'),
('18_pregnancy_build_cradle', 'Pregnant female captain and husband assemble a wooden cradle together in a warm cabin, folded baby linens.'),
('19_birth_newborn_hands', 'After a safe birth, female captain MOTHER rests fully clothed under linen blankets, holding a swaddled newborn with her husband supporting the baby. Tender and nonmedical, no birth anatomy.'),
('20_birth_first_night', 'First night after childbirth: female captain mother and husband sit beside their sleeping newborns wooden cradle in a softly lit cabin.'),
('21_family_breakfast', 'Female captain mother, husband and two young children share bread and fruit at a sunlit cottage breakfast table.'),
('22_family_map_story', 'Education: female captain MOTHER teaches her children geography using a chart and toy ship, husband listens warmly at the cottage table.'),
('23_family_carve_toy_boat', 'Female captain mother and school-age child carefully carve a wooden toy boat together, husband holds the unfinished sail.'),
('24_family_deck_laundry', 'Family aboard anchored wooden sailing ship: female captain mother and husband hang laundry while their child hands up a cloth, harbor in distance.'),
('25_family_rainy_board_game', 'Rainy cottage afternoon: female captain mother, husband and children play a simple wooden board game beside the hearth.'),
('26_family_herb_garden', 'Female captain mother and husband help their children plant herbs in a small garden overlooking a historical harbor.'),
('27_family_festival_lanterns', 'Female captain mother, husband and children walk together through a lantern festival in a premodern harbor, warm lights over water.'),
('28_family_height_marks', 'Female captain mother marks a childs height on a cottage doorframe while husband steadies a second child nearby.'),
('29_family_mending_clothes', 'Female captain mother and husband show an older child how to mend a sailcloth jacket by the hearth, family cooperation.'),
('30_family_bedtime', 'Female captain MOTHER tucks a child into a wooden bed and holds the childs hand, husband dims a lantern in the doorway.'),
('31_daughter_wedding_father_pov', 'An older FEMALE captain MOTHER watches her adult daughters wedding from a distance, from behind the mothers shoulder, proud and emotional. Mother wears formal navy sailing coat.'),
('32_daughter_wedding_brother_pov', 'A FEMALE player as the adult SISTER of a bride, navy coat, watching her sisters wedding procession from the side, period harbor chapel, warm emotion.'),
('33_daughter_wedding_sister_pov', 'A FEMALE player as the adult SISTER of a bride, clasping her sisters hands before a period wedding, both clearly adult women, familial not romantic.'),
('34_adult_daughter_chart_gift', 'An older female captain MOTHER gives her adult daughter an heirloom sea chart and logbook on the dock, passing on her legacy.'),
('35_adult_son_first_command', 'An older female captain MOTHER hands a compass and command of a wooden sailing ship to her adult son on deck, proud crew behind.'),
('36_adult_siblings_homecoming', 'Female captain protagonist reunites with her adult brothers and sisters at the harbor after long voyages, traveling chests and warm embraces.'),
('childfriend_join', 'Female captain mother welcomes her now adult childs childhood friend as a new sailor on deck, the two young adults standing beside her.'),
('childfriend_visit', 'Female captain mother and husband welcome their school-age childs childhood friend at home, children with toy boats, kindly family scene.'),
('heir_council', 'Older FEMALE captain MOTHER leads a family council with adult heirs and loyal crew around a cabin table, chart and sealed logbook.'),
('oldguard_farewell', 'Older FEMALE captain and her adult heir bid farewell to a retiring elderly loyal sailor at dawn on the harbor pier, restrained melancholy.'),
('41_family_sickbed', 'Illness in the family: female captain MOTHER tends her feverish child in bed with a cool cloth, husband brings a bowl of herbal broth, hopeful quiet care.'),
('42_family_holiday', 'Family holiday: female captain MOTHER, husband and two children picnic on a grassy headland beside a peaceful harbor, sailing ship at anchor, relaxed afternoon.')]
jobs = [dict(id='family_f_'+key, key='family-events/female/'+key, prompt=BASE+FEMALE+scene) for key,scene in SCENES]
for key, scene in SCENES[-2:]:
    jobs.append(dict(id='family_m_'+key, key='family-events/'+key, prompt=BASE+'The PLAYER is an ADULT MALE CAPTAIN father in a navy coat, his spouse an ADULT WOMAN in period linen dress. '+scene.replace('female captain MOTHER','male captain FATHER').replace('husband','wife')))
DEATH = [
('mutiny','반란으로 끝난 항해','A mutiny has ended in tragedy on a wooden ship deck. A loyal crew member stands with their BACK in the foreground and looks from FAR AWAY toward the motionless captain lying beside the wheel; mutineers retreat into darkness. No active attack.'),
('pirate','해적의 포화 속에서','After a pirate attack, a surviving crew member in the distant foreground watches the motionless captain on a ruined wooden deck, torn sails and a pirate ship receding offshore.'),
('navy','군함의 포화 속에서','After naval cannon fire, a surviving sailor seen from behind looks across a long wrecked deck at the motionless captain beneath a fallen mast, distant royal warships under smoke.'),
('prison','돌벽 안의 마지막 밤','A prison guard seen from behind at the distant cell doorway looks toward the captain lying still on a narrow straw bed behind iron bars. Cold stone, one weak shaft of dawn light.'),
('illness','병상에서의 이별','A loved one or doctor seen from behind in a distant doorway quietly watches the captain who has died under a linen blanket on a cottage bed, extinguished candle, mournful light.'),
('peace_home','집에서 맞은 평온한 마지막','An elderly captain has passed away peacefully in a chair by a cottage window; family silhouettes watch from FAR AWAY in the doorway, harbor in distance, gentle evening light.'),
('peace_sea','바다에서 맞은 평온한 마지막','An elderly captain has passed away peacefully in a chair in a wooden ships quiet cabin; loyal sailors watch from FAR AWAY at the doorway, still sea beyond windows, no danger.'),
('peace_land','탐험길의 평온한 마지막','An elderly captain has passed away peacefully seated under an old tree beside a tranquil expedition camp; companions look on from FAR AWAY, sunset over hills, no danger.'),
('ice','빙하 속에 멈춘 항해','SKELETAL remains of the captain still wearing a weathered period captain coat on a wooden sailing ship crushed and trapped in monumental glacier ice, frozen compass and silent aurora, tragic loneliness.'),
('starvation','빈 식량통 곁의 마지막','SKELETAL remains of the captain in a weathered captain coat seated beside empty food barrels and an empty bowl on a drifting sailing ship, slack sails, endless empty sea, sad tragic stillness.'),
('sea_illness','바다의 병이 남긴 침묵','SKELETAL remains of the captain wearing a worn captain coat on a cot in an abandoned wooden ships sickbay, empty medicine bottle and dried herbs, drifting fog outside porthole, mournful tragedy.'),
('disaster','재해가 휩쓴 자리','SKELETAL remains of the captain in a weathered captain coat amid the splintered wreckage of a wooden sailing ship washed inland by a devastating natural storm and tidal wave; storm clearing in distance, immense tragic silence.'),
('abandoned','아무도 돌아오지 않은 탐험','SKELETAL remains of the captain in a weathered captain coat at an abandoned inland expedition camp, companions have ALL FLED and none remain, torn empty tents, compass and abandoned packs, footprints lead away, tragic isolation.')]
for sex in ('m','f'):
    for key,title,scene in DEATH:
        who = 'male man' if sex=='m' else 'female woman with a long braid and feminine tailored navy coat'
        jobs.append(dict(id='death_'+sex+'_'+key,key='endings/'+sex+'/'+key,title=title,prompt=BASE+'The deceased player captain is an ADULT '+who+'. The gender must be distinct through coat silhouette and hairstyle even for a skeleton. '+scene+' Composition: distant third-person wide tableau, no close-up, dignified grief, no blood, no gore, no horror or comedy. Skeleton scenes depict dry bone only, no decay or wounds.'))
    jobs.append(dict(id='era_'+sex,key='endings/'+sex+'/era',title='1700년 1월 1일 — 새로운 세기의 여명',prompt=BASE+'The dawn of a new century on January 1, 1700. An elderly '+('male' if sex=='m' else 'female')+' captain seen from FAR behind stands on a high harbor overlook, closing an old logbook, while a younger generation readies new wooden sailing ships below. First golden sunrise spreads over the horizon; old charts and a lowered pennant symbolize the END of the players era, bustling new sails symbolize the new century. Quiet grand final GAME OVER feeling, bittersweet and hopeful, no death, no written numerals or text.'))
ref = str(ROOT/'images/song/concerts/kr.webp')
for id, key, scene in [
('concert_kr_fan','song/concerts/kr_fan_20261127','Exactly FOUR band members from reference: Kim Soyoung singing with her blossom fan, Woldam playing geomungo, Hwanggyu playing hand gong, masked Imcheosa playing bowed ajaeng. A dynamic fan flourish finale in a Joseon harbor courtyard, warm lanterns and cheering crowd. NEW pose, wide view from audience, joyful folk-rock energy adapted to the historical setting.'),
('concert_kr_trio_new','song/concerts/kr_trio_20261127','Exactly THREE band members: Kim Soyoung singing with blossom fan, Woldam playing geomungo, Hwanggyu striking gong and janggu. NO masked man, no fourth performer. Dawn harbor market on Joseon coast, exuberant street performance, smiling fishermen and children, lively NEW composition.'),
('concert_europe_new','song/concerts/europe_20261127','Exactly FOUR band members from reference: Soyoung singing with blossom fan, Woldam playing geomungo, Hwanggyu playing gong, masked Imcheosa on acoustic lute. A candlelit EUROPEAN 16th century waterfront stone courtyard with arches and wooden sailing ships, local townspeople clapping. New original moonlit encore pose, no Joseon buildings.')]:
    jobs.append(dict(id=id,key=key,prompt=BASE+'Reference image defines these fictional GAME characters identities, hairstyles and clothes, not real musicians. Preserve Soyoungs dark braided hair, flower hairpin, cream blossom embroidered outfit and navy jacket. '+scene,refs=[ref]))
out=Path(__file__).parent/'prompts.json'
out.write_text(json.dumps(jobs,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(jobs)}개 장면, 여성 가족 {len(SCENES)}개 / 남성 가족 {len(SCENES)}개')
