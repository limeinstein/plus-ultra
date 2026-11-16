/* 발견 보상 개·고양이·앵무새·작은 원숭이와 쉬어 가는 선원들 — 대형 동물은 제외 */
(function (G) {
  'use strict';
  var P = G.CrewPets = {};
  P.available = function () {
    return G.BALANCE.crewPetRecovery.pets.filter(function (p) { return G.R.hasItem(p.item); });
  };
  P.canRecover = function () {
    var s = G.Game.state;
    return s.loc.mode === 'sea' && s.fleet.crew > 0 && s.fleet.fatigue >= G.BALANCE.crewPetRecovery.fatigue;
  };
  P.recover = function () {
    var f = G.Game.state.fleet, c = G.BALANCE.crewPetRecovery, before = f.fatigue, disc = f.discipline;
    f.fatigue = c.recoverFatigue;
    if (disc <= c.lowDiscipline) f.discipline = Math.max(disc, c.recoverDiscipline);
    return '피로 ' + Math.round(before) + ' → ' + c.recoverFatigue + (f.discipline > disc ? ' · 규율 ' + Math.round(disc) + ' → ' + f.discipline : '');
  };
  P.antics = [
    { id: 'dog_cat_chase', title: '갑판의 술래잡기', groups: ['dog', 'cat'], lines: [
      '갑판에서 개가 고양이를 뒤쫓기 시작했다. 고양이는 밧줄 더미를 훌쩍 넘고, 개는 통을 돌아 따라붙는다. 선원들도 굴러가는 물통을 붙잡느라 술래잡기에 끼어들었다.',
      '고양이가 낮은 통 위에 올라가 꼬리를 흔들자 개가 얌전히 주저앉았다. 선원 하나가 둘의 머리를 차례로 쓰다듬었다. 갑판에는 한동안 웃음이 남았다.' ] },
    { id: 'parrot_cat_chase', title: '이번에는 누가 술래?', groups: ['bird', 'cat'], lines: [
      '앵무새가 고양이의 머리 위를 낮게 스쳐 갔다. 고양이가 앞발을 뻗어 쫓아가자 앵무새는 돛줄로 피하고, 고양이가 돌아서면 다시 뒤를 따라 날았다.',
      '쫓는 쪽이 몇 번이나 뒤바뀌더니, 선원들이 둘을 달래 겨우 술래잡기를 끝냈다. 고양이는 품 안에서 그르렁거리고 앵무새는 아무 일 없었다는 듯 고개를 갸웃했다.' ] },
    { id: 'monkey_dog_spat', title: '장난감의 주인은 누구?', groups: ['monkey', 'dog'], lines: [
      '원숭이가 개의 천 장난감을 낚아챘다. 개가 으르렁거리며 반대쪽을 물자 원숭이도 꽉 붙잡고 놓지 않았다. 갑판 한가운데서 한바탕 실랑이가 벌어졌다.',
      '선원들이 둘 사이에 끼어들어 달래고, 같은 장난감을 하나 더 만들어 주었다. 잠시 뒤에는 원숭이도 개도 제 장난감을 끌어안았다. 다친 곳 없이 소동이 끝났다.' ] },
    { id: 'parrot_teases_monkey', title: '그 목소리는 앵무새였다', groups: ['bird', 'monkey'], lines: [
      '앵무새가 원숭이의 울음소리를 흉내 냈다. 원숭이가 뒤를 돌아보면 조용해지고, 고개를 돌리면 또 같은 소리가 났다. 범인을 알아낸 원숭이가 두 팔을 치켜들자 선원들이 웃음을 터뜨렸다.',
      '앵무새는 선원들의 웃음소리까지 따라 했다. 원숭이는 잠깐 토라졌지만 선원이 어깨를 긁어 주자 금세 기분이 풀렸다. 앵무새도 가까이 내려앉아 함께 쉬었다.' ] }
  ];
  P.interactionChoices = function () {
    var pets = P.available();
    return P.antics.filter(function (ev) { return ev.groups.every(function (group) {
      return pets.some(function (pet) { return pet.group === group; });
    }); });
  };
  P.interactionDaily = async function () {
    var s = G.Game.state;
    if (!P.canRecover() || s.flags.crewPetAnticRollDay === s.day) return false;
    var choices = P.interactionChoices();
    if (!choices.length) return false;
    s.flags.crewPetAnticRollDay = s.day;
    // 조합이나 동물이 많아도 전체 사건을 두고 하루 한 번만 2% 추첨한다.
    if (!G.U.chance(G.BALANCE.crewPetAntics.chance)) return false;
    var ev = G.U.pick(choices), pets = P.available();
    var bird = ev.groups.indexOf('bird') >= 0 && G.U.pick(pets.filter(function (p) { return p.group === 'bird'; }));
    var hd = G.FamEv && G.FamEv.showPic({ img: P.imageKey(ev.id), title: ev.title, noStand: true }), result = '';
    try {
      if (hd && hd.ready) await hd.ready;
      for (var i = 0; i < ev.lines.length; i++) {
        if (i === ev.lines.length - 1) result = P.recover();
        await G.UI.say(ev.lines[i] + (i === ev.lines.length - 1 ? '\n웃고 떠들다 보니 선원들이 기운을 되찾았다. ' + result : ''), {});
      }
      G.State.log('배의 동물들이 소동을 벌였다 — ' + ev.title + '. ' + result);
    } finally { if (hd) await hd.stop(); }
    if (bird && G.Game.state === s) await P.startFlight(bird.id);
    return true;
  };
  P.imageKey = function (id) {
    var base = 'crew-pet-events/' + id, choices = [base];
    if (G.Img && G.Img.file(base + '_women')) choices.push(base + '_women');
    if (G.Img && G.Img.file(base + '_men')) choices.push(base + '_men');
    return G.U.pick(choices);
  };
  P.daily = async function () {
    var s = G.Game.state, cfg = G.BALANCE.crewPetRecovery;
    if (!P.canRecover()) return false;
    var pets = P.available();
    if (!pets.length || s.flags.crewPetRollDay === s.day) return false;
    s.flags.crewPetRollDay = s.day;   // 동물이 여럿이어도 하루에 딱 한 번만 10% 추첨
    if (!G.U.chance(cfg.chance)) return false;
    var pet = G.U.pick(pets);
    var hd = G.FamEv && G.FamEv.showPic({ img: P.imageKey(pet.id), title: pet.name + G.U.jx(pet.name, '과/와') + ' 쉬어 가는 시간', noStand: true });
    try {
      if (hd && hd.ready) await hd.ready;
      await G.UI.say('지친 선원들 사이로 ' + pet.name + G.U.jx(pet.name, '이/가') + ' 다가왔다. 누군가 장난감을 흔들자 하나둘 웃음이 번진다. 잠시 일을 내려놓고 함께 놀던 선원들의 얼굴에 생기가 돌아왔다.', {});
      var result = P.recover();
      G.State.log(pet.name + G.U.jx(pet.name, '과/와') + ' 놀며 선원들이 기운을 되찾았다. ' + result);
      await G.UI.say('선원들이 한결 가벼운 몸으로 서로 도우며 일자리로 돌아갔다.\n' + result, {});
    } finally { if (hd) await hd.stop(); }
    // 두 대화와 액자 닫힘(퇴장 애니메이션)까지 모두 기다린 다음에만 날아오른다.
    if (G.Game.state === s) await P.startFlight(pet.id);
    return true;
  };
  P.startFlight = async function (id) {
    var cfg = G.FX.crewPetFlight, sea = G.Scenes.sea;
    if (cfg.birds.indexOf(id) < 0 || G.Game.scene !== sea) return false;
    var st = sea.runtime(), state = G.Game.state;
    if (!st || !st.alive) return false;
    var image = await G.Img.load('effects/crew_pet_' + id);
    if (!image || G.Game.scene !== sea || G.Game.state !== state || sea.runtime() !== st || !st.alive) return false;
    st.crewPetFlight = { id: id, t: 0, image: image };
    return true;
  };
  P.step = function (st, dt, frozen) {
    var f = st.crewPetFlight;
    if (!f || frozen || st.busy || G.UI.busy()) return;
    f.t += Math.max(0, dt);
    if (f.t >= G.FX.crewPetFlight.seconds) delete st.crewPetFlight;
  };
  P.flightPose = function (t, length) {
    var c = G.FX.crewPetFlight, u = G.U.clamp(t / c.seconds, 0, 1);
    var k = Math.min(1, u / c.launch, (1 - u) / c.land);
    var dk = 6 * k * (1 - k) * (u < c.launch ? 1 / c.launch : u > 1 - c.land ? -1 / c.land : 0);
    k = k * k * (3 - 2 * k);
    var a = u * Math.PI * 2 * c.turns, r = G.U.clamp(length * c.radius, c.minRadius, c.maxRadius);
    var h = G.U.clamp(length * c.height, c.minHeight, c.maxHeight);
    return { x: Math.cos(a) * r * k, y: (Math.sin(a) * r * c.ellipse - h) * k - length * c.deck,
      size: G.U.clamp(length * c.size, c.minSize, c.maxSize), alpha: Math.min(1, k * c.fade),
      flip: Math.cos(a) * dk - Math.sin(a) * Math.PI * 2 * c.turns * k < 0, frame: Math.floor(t * 1000 / c.frameMs) % 8 };
  };
  P.drawFlight = function (st, ctx, pp, length) {
    var f = st.crewPetFlight;
    if (!f || st.busy || G.UI.busy()) return;
    var p = P.flightPose(f.t, length), image = f.image;
    var cw = image.width / 4, ch = image.height / 2, height = p.size * ch / cw;
    ctx.save(); ctx.translate(pp[0] + p.x, pp[1] + p.y); ctx.globalAlpha = p.alpha;
    if (p.flip) ctx.scale(-1, 1);
    ctx.drawImage(image, (p.frame % 4) * cw, Math.floor(p.frame / 4) * ch, cw, ch, -p.size / 2, -height / 2, p.size, height);
    ctx.restore();
  };
})(window.G = window.G || {});
