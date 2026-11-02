/* 원본 크기를 바꾸지 않는 그림 보관·퇴출·재읽기·목록 초기화 검사. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..'), sizes = {}, reads = {};
class TestImage {
  set src(value) {
    this.url = value;
    if (!value) return;
    reads[value] = (reads[value] || 0) + 1;
    queueMicrotask(() => {
      const size = sizes[value];
      if (size) {
        this.naturalWidth = this.width = size[0]; this.naturalHeight = this.height = size[1];
        if (this.onload) this.onload();
      } else if (this.onerror) this.onerror();
    });
  }
  get src() { return this.url; }
}
const G = { FX: { img: { keep: 900, keepBytes: 768, tries: 1, listKeep: 2 } }, IMAGE_FILES: {} };
for (const key of ['a', 'b', 'c', 'd']) { G.IMAGE_FILES[key] = key + '.webp'; sizes['images/' + key + '.webp'] = [8, 8]; }
const sandbox = { window: { G }, Image: TestImage, document: { hidden: true },
  setTimeout, clearTimeout, URL, console: { warn() {}, error: console.error } };
vm.createContext(sandbox);
for (const file of ['js/core/images.js', 'js/art/reel.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox);
(async () => {
  const I = G.Img, R = G.Reel;
  const first = R.load('a'); assert.strictEqual(R.load('a'), first, '같은 판을 동시에 두 번 받지 않는다');
  const active = await first;
  await R.load('b'); await R.load('c'); I.get('a'); await R.load('d');
  assert.equal(I.status('a'), 'ok'); assert.equal(I.status('d'), 'ok');
  assert.equal(I.status('b'), 'idle'); assert.equal(I.status('c'), 'idle');
  assert.equal(R.now('b'), null, '재생기가 퇴출된 원본을 별도로 붙잡지 않는다');
  assert.equal(active.img.naturalWidth, 8, '기존 재생 원본은 손대지 않는다');
  const reloaded = await R.load('b'); assert.equal(reloaded.img.naturalWidth, 8);
  assert.equal(reads['images/b.webp'], 2, '다시 찾으면 원본을 다시 읽는다');
  assert(I.cacheStats().bytes <= 768); assert.equal(I.cacheStats().count, 3);
  const list = I.list(''); list.length = 0; assert.equal(I.count(), 4); assert.equal(I.list('').length, 4);
  I.reset(); assert.equal(I.cacheStats().bytes, 0); assert.equal(I.cacheStats().count, 0); assert.equal(R.now('a'), null);
  G.IMAGE_FILES.e = 'e.webp'; sizes['images/e.webp'] = [20, 20]; I.reset();
  assert.equal(I.count(), 5); assert.equal(I.list('e')[0], 'e', '초기화 뒤 목록도 갱신한다');
  const large = await I.load('e'); assert.equal(large.naturalWidth, 20);
  assert.equal(I.cacheStats().count, 1, '예산보다 큰 한 장은 읽기 반복 없이 유지한다');
  assert.strictEqual(await I.load('e'), large); assert.equal(reads['images/e.webp'], 1);
  assert.equal(await R.load('missing'), null); assert.equal(await R.load('missing'), null);
  I.reset(); G.FX.img.keep = 2; G.FX.img.keepBytes = 4096;
  await I.load('a'); await I.load('b'); await I.load('c');
  assert.equal(I.cacheStats().count, 1, '작은 그림도 장수 한도를 지킨다');
  assert.equal(I.status('c'), 'ok');
  console.log('그림 메모리·장수 한도, 최근 사용 우선, 동시 읽기 공유, 원본 재읽기, 재생 참조·목록 초기화 통과');
})().catch(e => { console.error(e); process.exitCode = 1; });
