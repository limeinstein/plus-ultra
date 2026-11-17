"""전체 동물의 이동 방식과 종별 투명 원화를 연결한다. 원화는 수정하지 않는다."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
rows = json.loads((ROOT / 'artifacts/animal-tracking-20261117/roster.json').read_text('utf-8'))
groups = {
    'cat': 'siamese russianblue persian angora koreancat tiger lion cheetah whitetiger cloudleopard snowleopard manul vancat leopard jaguar lynx puma amurtiger amurleopard smilodon gumiho',
    'dog': 'shiba pomeranian pug corgi yorkie shihtzu golden bostonterrier dachshund papillon hyena fennec coyote floridawolf hudsonwolf arcticwolf graywolf himalwolf dingo redfox fenrir',
    'bear': 'panda polarbear moonbear sunbear brownbear grizzly redpanda wolverine',
    'split': 'moose buffalo giraffe antelope warthog babirusa yak saiga reindeer argali chiru muskdeer oryx nubianibex wildebeest okapi bison muskox bighorn minotaur',
    'hoof': 'shire friesian redhare zebra przewalski kulan unicorn',
    'elephant': 'elephant asianelephant mammoth brachio mokele',
    'rhino': 'rhino trike stego',
    'hippo': 'hippo tapir',
    'bird': 'frigatebird albatross paradise flamingo roc ploverbird peacock vinousbird crane eagle falcon stork parrot turkey roadrunner phoenix budgie kiwi phoenixw hornbill snowyowl bncrane sacredibis baldeagle toucan condor hummingbird siberiancrane emu',
    'ostrich': 'ostrich',
    'web': 'penguin mallard platypus emperorpenguin magellanpenguin',
    'hand': 'mandrill chimp gorilla lemur gibbon proboscis tarsier snowmonkey baboon koala raccoon opossum',
    'hop': 'kangaroo',
    'lizard': 'tortoise komodo crocodile chameleon iguana marineiguana reddragon blackdragon hyeonmu chimera yelbegen',
    'frog': 'dartfrog',
    'camel': 'llama bactrian dromedary vicuna',
    'small': 'prairiedog sable porcupine meerkat squirrel anteater armadillo skunk otter beaver sloth capybara wombat',
    'snake': 'boa kingcobra anaconda electriceel apophis yakumama xiangliu',
    'water': 'coelacanth narwhal manatee humpback f_bluefin f_swordfish f_sturgeon f_flying f_sunfish f_marlin f_puffer f_oarfish f_giantsquid f_seadragon shiri sealion whale lobster dolphin kraken mermaid dragon sailfish pufferfish jellyfish manta lionfish angelfish clownfish bluetang nessie isonade bakunawa zaratan leviathan jormungandr cipactli giant-octopus sea-serpent sea-dragon man-eating-shark ghost-ship dugong baikalseal walrus piranha boto seaotter',
    'insect': 'tarantula hermitcrab hercules titanus silverscarab lanternfly periodical chalcosoma giraffestag tamamushi orchidmantis rainbowstag goliath sacredscarab',
    'flutter': 'flyingfox morpho glasswing monarchwinter lunamoth eightyeight swallowtail emeraldswallow birdwing sasakia atlasmoth deadleaf bhutanglory fireflyriver sunsetmoth cometmoth giantswallow motherpearl peacockbf',
    'biped': 'yeti elf cyclops titan oni dokkaebi troll',
    'raptor': 'trex',
    'ghost': 'gwisin',
}
kind = {did: k for k, ids in groups.items() for did in ids.split()}
atlas = '''pomeranian yorkie golden bostonterrier whitetiger mammoth elf kraken reddragon unicorn mermaid phoenix smilodon brachio trex trike stego phoenixw blackdragon chimera cyclops titan oni dokkaebi gumiho gwisin hyeonmu isonade bakunawa xiangliu zaratan leviathan apophis jormungandr fenrir yakumama cipactli giant-octopus sea-serpent sea-dragon man-eating-shark ghost-ship yelbegen siberiancrane wolverine amurleopard lion kangaroo'''.split()
atlas += [row['id'] for row in rows if row['id'] not in atlas]
profiles = {}
palettes = {
 'cat':['#292323','#aa7141','#e7bc72','#fff0d3'], 'dog':['#302721','#875436','#cf9b60','#f7e6c4'],
 'bear':['#241f1b','#624831','#b48959','#ebd7b0'], 'split':['#302b25','#856346','#c8a575','#eee1bb'],
 'hoof':['#282321','#72503b','#b58a5b','#e8d4af'], 'elephant':['#33353a','#777b82','#a9a9a2','#eee0b7'],
 'rhino':['#343634','#6b746b','#a4aa91','#d9d2b3'], 'bird':['#282c2e','#756a42','#d6b365','#f1e8cf'],
 'ostrich':['#252427','#736664','#d4a3a0','#f3eee1'], 'web':['#20282e','#496875','#d9b875','#f3f1df'],
 'hand':['#29241f','#736044','#b5986c','#eee1c8'], 'hop':['#423026','#93603e','#ca9c69','#eddbb3'],
 'lizard':['#27362c','#536b46','#9caf67','#e4d69b'], 'frog':['#202d27','#236454','#51ae78','#e8c557'],
 'camel':['#463123','#94714c','#ceb17d','#f4e1ba'], 'small':['#322920','#786047','#b99a6a','#eddfbc'],
 'snake':['#203b2c','#417448','#a2a955','#e8d598'], 'water':['#203c51','#437d98','#95c8cf','#eee7cd'],
 'insect':['#242d26','#496544','#a1a25b','#e0cb87'], 'flutter':['#252736','#3567a4','#73b9dd','#e8dfb8'],
 'biped':['#302c34','#625b72','#b8b1bd','#eee3d1'], 'raptor':['#303829','#677646','#b5a15f','#e5d3a3'],
 'ghost':['#34394e','#70879e','#bbd5df','#eff4e8']}
palettes['hippo'] = palettes['rhino']
overrides = {}
def palette(ids, colors):
    for did in ids.split(): overrides[did] = colors.split()
palette('panda penguin emperorpenguin magellanpenguin', '#20262c #fbf4df')
palette('tiger amurtiger lionfish', '#292525 #d78631 #eeb55b #f4e0b3')
palette('whitetiger snowleopard amurleopard leopard jaguar cheetah', '#25262b #ac834c #e0c38b #f6ecd3')
palette('polarbear arcticwolf snowyowl', '#39424d #b7c4c5 #f9f1da')
palette('flamingo', '#34303a #d35c7c #f1a2b4 #f9d4cc')
palette('crane bncrane siberiancrane stork sacredibis baldeagle', '#242c32 #c95142 #f5f0de')
palette('parrot budgie peacock paradise hornbill', '#233e45 #3b9272 #dbb94c #d76c4d')
palette('redpanda redfox', '#352b29 #ba5c35 #e2a365 #f1e2bb')
palette('zebra', '#272a2c #eee6d3')
palette('giraffe', '#65402b #bd8544 #e7c976 #f3dfb0')
palette('morpho glasswing', '#25253b #245fc0 #6bc8ed #e5f3e5')
palette('monarchwinter swallowtail eightyeight motherpearl', '#28262a #d77b32 #efc65b #f4e5bf')
palette('dartfrog', '#252b30 #2c88c7 #e6c643 #e87b35')
palette('mammoth', '#30271f #79523a #bc8b56 #ead9ad')
palette('whitetiger', '#25262b #777d81 #bec2bc #f6ecd3')
palette('elf', '#333b22 #55743a #b89459 #f0d8a7')
palette('kraken', '#412d55 #7c4b91 #b784c3 #e6c993')
palette('reddragon phoenix phoenixw', '#8f302c #c84b2d #ec9636 #f5cd5a')
palette('unicorn', '#887550 #c7af72 #e7dab7 #fff2d8')
palette('mermaid', '#21595e #3f9c98 #d77c67 #f1d4ac')
palette('stego', '#623b2b #a55d3d #d49b52 #eddbac')
palette('blackdragon', '#242a30 #495867 #889ca2 #d4ae57')
palette('oni', '#392f32 #8d3436 #c65c4c #ecdcb0')
palette('dokkaebi', '#2d3b30 #497c5b #8f7653 #e5d8b5')
palette('gumiho', '#633e2f #b96e45 #e6c796 #f8edcf')
palette('hyeonmu', '#252e31 #326762 #769082 #d5b465')
palette('bakunawa leviathan sea-dragon', '#243e52 #286c79 #65aaa3 #e3d9a8')
palette('jormungandr', '#284c38 #507a48 #89a360 #e8dcaa')
palette('fenrir', '#30343a #727c82 #b6bfc0 #eee4cb')
palette('bostonterrier skunk', '#25272b #777b7e #f2ead7')
palette('russianblue', '#30383f #687984 #9dabb0 #d2d7d1')
palette('yorkie', '#30383e #676e73 #b58a53 #e4c68b')
palette('siamese', '#382c29 #81664c #cbb488 #f0dfb7')
palette('angora', '#8d9095 #c1c7c4 #f7efdc')
palette('clownfish', '#25282c #d36b27 #efa342 #fff0d6')
palette('bluetang', '#1b2b40 #225aab #5899ca #e4c74a')
palette('angelfish', '#203550 #387eaa #e2c052 #f0e5bf')
palette('jellyfish', '#65568e #9a9dca #c5dce6 #f3e8e8')
palette('lobster hermitcrab', '#4b302a #a34d34 #d68b4e #ebd6ab')
palette('tarantula', '#29271f #564d35 #99875b #d1bd83')
palette('lunamoth', '#385c43 #7ebc83 #b7d8a2 #e9e4be')
palette('atlasmoth deadleaf cometmoth', '#4c382f #946a49 #cca56f #eddbab')
palette('sunsetmoth', '#302d3f #6c4e8b #be723d #dfbc4a')
palette('birdwing emeraldswallow', '#233330 #377750 #8cba54 #e5cc5a')
palette('raccoon', '#2b2e31 #6d7373 #b5b5a5 #eee2c5')
for row in rows:
    did = row['id']
    assert did in kind, f'이동 방식 누락: {did}'
    p = {'kind': kind[did], 'habitat': row['how'], 'palette': overrides.get(did, palettes[kind[did]])}
    if did in atlas:
        p['slot'] = atlas.index(did) % 16
        p['sheet'] = atlas.index(did) // 16 + 1
    else:
        assert row.get('icon'), f'종별 원화 누락: {did}'
        p['key'] = row['icon'].rsplit('.', 1)[0]
    profiles[did] = p
out = ROOT / 'js/data/animaltracking.js'
out.write_text('/* 전체 동물 발견물의 종별 원화·이동 방식. 제작: tools/build_animal_tracking_20261117.py */\n(function(G){\n  \'use strict\';\n  G.ANIMAL_TRACKING = ' + json.dumps(profiles, ensure_ascii=False, indent=2) + ';\n})(window.G=window.G||{});\n', encoding='utf-8', newline='\n')
print(f'{len(profiles)}종 연결 완료')
