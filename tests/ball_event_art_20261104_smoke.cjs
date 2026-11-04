/* 공용 무도회 샷 네 장과 다른 손님·딸에게 같은 배경을 쓰는 대화를 확인한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'artifacts/ball-event-art-20261104/screenshots');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/ball_event_art_20261104_prompts.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']});
  const errors = [], checks = [];
  try {
    fs.mkdirSync(OUT, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.Ball && G.HomeLife && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, {timeout: 120000});
    await page.evaluate(() => {
      const s = G.Game.state = G.State.newGame({name: '무도회 그림 확인', nation: 'PT', job: 'explorer', age: 42, birth: {m: 1, d: 1}, st: {str: 60, int: 60, mar: 60, cha: 70}, sk: {}, lg: [], diff: 'normal'});
      s.settings.res = .35; s.settings.sound = 0; s.settings.music = 0;
      s.date = {y: 1600, m: 6, d: 1}; s.player.gold = 500000;
      s.player.kids = [
        {name: '이사벨', given: '이사벨', sex: 'f', born: {y: 1584, m: 1, d: 1}, artFolder: 'iberia', st: {cha: 80}, sk: {}, bond: 70},
        {name: '아미나', given: '아미나', sex: 'f', born: {y: 1583, m: 1, d: 1}, artFolder: 'africa', st: {cha: 75}, sk: {}, bond: 75}
      ];
      window.__ballSpeaker = id => id === 'witch' ? G.Legend.speaker(G.BALL_WITCH.id) : id === 'daughter1' ? G.HomeLife.speaker(s.player.kids[0]) : id === 'daughter2' ? G.HomeLife.speaker(s.player.kids[1]) : G.Ball.ladySp(G.BALL_LADY[id]);
    });
    const cases = [
      ['ball_open', 'bl_theresia'], ['ball_open', 'bl_alexandra'],
      ['debut', 'daughter1'], ['debut', 'daughter2'],
      ['witch', 'witch'], ['proposal', 'bl_marie'], ['proposal', 'bl_jane']
    ];
    for (const [id, who] of cases) {
      const row = plan.scenes.find(x => x.id === id);
      const check = await page.evaluate(async ({row, who}) => {
        const key = 'events/ball/' + row.id, image = await G.Img.load(key), speaker = window.__ballSpeaker(who);
        if (!image || image.naturalWidth !== 1881 || image.naturalHeight !== 836) throw Error('해독·규격: ' + key);
        window.__ballPic = G.FamEv.showPic({img: key, title: row.title, noStand: true});
        await window.__ballPic.ready;
        window.__ballSay = G.UI.say('오늘 이 자리에 와 주셔서 고맙습니다.', speaker);
        return {key, who, name: speaker.name, portrait: G.Img.pick(G.Art.portraitKeys(speaker.portrait)), src: G.Img.src(key)};
      }, {row, who});
      await page.waitForSelector('.famscene.on img');
      await page.waitForSelector('.dlg .pframe');
      await page.evaluate(() => document.querySelector('.famscene img').decode());
      await page.waitForTimeout(350);
      assert.strictEqual(await page.locator('.dlg-actor.active.tall').count(), 0, '개별 무릎상이 공용 샷을 덮지 않음');
      assert(await page.locator('#ui').evaluate(el => el.classList.contains('scenepic-on')));
      await page.screenshot({path: path.join(OUT, id+'_'+who+'.png')});
      await page.keyboard.press('Enter');
      await page.evaluate(async () => {await window.__ballSay; await window.__ballPic.stop();});
      assert.strictEqual(await page.locator('.famscene').count(), 0);
      checks.push(check);
    }
    for (const key of ['ball_open', 'debut', 'proposal']) {
      const group = checks.filter(x => x.key === 'events/ball/'+key);
      assert.strictEqual(group.length, 2);
      assert.strictEqual(group[0].src, group[1].src, '인물이 달라도 같은 공용 배경');
      assert.notStrictEqual(group[0].name, group[1].name, '대화하는 실제 인물은 바뀜');
      assert.notStrictEqual(group[0].portrait, group[1].portrait, '실제 인물별 초상은 구별됨');
    }
    // 실제 무도회·데뷔·마녀·청혼에서 같은 네 열쇠를 호출하는지 확인한다.
    const integration = await page.evaluate(async () => {
      const old = {say: G.UI.say, ask: G.UI.ask, confirm: G.UI.confirm, alert: G.UI.alert, fade: G.UI.fade, showPic: G.FamEv.showPic, pickGuests: G.Ball.pickGuests, passDays: G.Game.passDays};
      const observed = [], BL = G.Ball, s = G.Game.state, home = G.CITY_DATA[s.player.home];
      G.UI.say = async () => {}; G.UI.ask = async (q, opts) => (opts.find(o => o.value === 'back') || opts[opts.length-1]).value;
      G.UI.confirm = async () => true; G.UI.alert = async () => {}; G.UI.fade = async fn => fn(); G.Game.passDays = () => {};
      G.FamEv.showPic = function (ev) {observed.push(ev.img); return old.showPic.call(this, ev);};
      try {
        G.Court.state().titles.PT = 3;
        BL.pickGuests = () => [G.BALL_LADY.bl_theresia]; BL.forceWitch = 'none';
        await BL.host(home);
        if (observed[0] !== 'events/ball/ball_open') throw Error('무도회 개막 호출');
        observed.length = 0;
        await BL.host(home, {debut: s.player.kids[0], dress: 0});
        if (observed[0] !== 'events/ball/debut' || !s.player.kids[0].debut) throw Error('딸의 데뷔 호출·진행');
        observed.length = 0;
        BL.forceWitch = 'lose';
        await BL._t.witch(home, {guests: [G.BALL_LADY.bl_theresia], out: [], debut: null});
        if (!observed.includes('events/ball/witch')) throw Error('마녀 난입 호출');
        observed.length = 0;
        const lady = G.BALL_LADY.bl_alexandra, record = BL.rec(lady.id);
        record.aff = 100; record.tgt = 'p'; BL.autoWed = false;
        await BL._t.proposal({guests: [lady], out: []});
        if (!observed.includes('events/ball/proposal')) throw Error('청혼 호출');
        if (document.querySelector('.famscene') || document.getElementById('ui').classList.contains('scenepic-on') || BL.running) throw Error('종료 뒤 그림·진행 잠금 정리');
        return observed.length && ['무도회', '데뷔탕트', '마녀 난입', '청혼'];
      } finally {
        G.UI.say=old.say; G.UI.ask=old.ask; G.UI.confirm=old.confirm; G.UI.alert=old.alert; G.UI.fade=old.fade;
        G.FamEv.showPic=old.showPic; G.Ball.pickGuests=old.pickGuests; G.Game.passDays=old.passDays;
        BL.forceWitch=null; BL.autoWed=null;
      }
    });
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify({checks, integration, errors}, null, 2));
    assert.deepStrictEqual(errors, []);
    console.log('공용 샷 4장·대화 7회, 손님·딸 교체와 같은 배경 재사용, 실제 사건 호출·종료 통과. 콘솔 오류 0.');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
